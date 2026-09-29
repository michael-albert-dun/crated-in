// Shape-seeded search. The room's shape is fixed up front (walls, pillars, start
// and exit with their gates), so it can't grow long corridors or decoy alcoves by
// construction; only the crate heights are searched, by simulated annealing on the
// solver's own measures (solution length, pushes, traps, few equal solutions,
// little shuffling) with penalties for decoy cells and forced walks at the ends.
//
//   node experiments/shape-levels.js [--shapes all|name,name] [--restarts 6] [--iterations 600]
//        [--seed 1] [--min-moves 24] [--max-moves 44] [--min-pushes 6] [--max-pushes 13]
//        [--min-traps 3] [--max-ways 3] [--max-decoys 0] [--max-unused 0] [--max-states 60000] [--minutes 0] [--out src/candidates.js] [--count 5]
//   node experiments/shape-levels.js --merge run1.log run2.log ...   (as make-levels.js)
//
// A shape is rows of cells: "." open, "#" wall, "E" the exit cell (a column of
// light), "S" the start. (The older "T" target with a gate side, e.g. "TU", and an
// entry side, e.g. "SL", still work.)
const fs = require("fs");
const { parseLevel, solve } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { analyse } = require("./analyse.js");
const { faults, forcedRuns } = require("./tidy.js");
const { pushWays } = require("./push-ways.js");
const { fits, finish } = require("./make-levels.js");

const SHAPES = {
  // A pure 4x4: in at the lower left, the exit cell in the upper right corner, so it can be reached from either of two cells.
  square4: [". . . E", ". . . .", ". . . .", "S . . ."],
  // A plus/cross: 5 rows x 3 columns with all four corners of that rectangle
  // removed. In at the bottom middle, exit at the top middle.
  cross3: ["# E #", ". . .", ". . .", ". . .", "# S #"],
  // A 3x2 block and a 2x3 block, joined through a single crate: entry near the
  // top of the 3x2 (its exit gap), exit near the bottom of the 2x3.
  linked32: [". . E # #", ". . # # #", ". . # # S", "# . . . .", "# # . . ."],
  // 5x5, a wall spine down the middle column for the top 3 rows, splitting them
  // into a left 3x2 tower and a right 3x2 tower, both standing on a fully open
  // 2x5 base. Entry at the bottom-left of the base, exit at the top of the right
  // tower. (Whether the left tower is actually needed, or just a decoy standing
  // there, depends on the heights -- see experiments/require-region.js.)
  twinTower: [". . # . E", ". . # . .", ". . # . .", ". . . . .", "S . . . ."],
  // 3 rows x 5 columns: the top-left and top-right cells removed, and the middle
  // of the bottom row removed. Entry at the bottom left, exit at the bottom right.
  notch3x5: ["# . . . #", ". . . . .", "S . # . E"],
  // 2 rows x 5 columns, entry at the top-left cell, exit somewhere in the right
  // column: "a" straight across (top right), "b" diagonally (bottom right).
  rect2x5a: ["S . . . E", ". . . . ."],
  rect2x5b: ["S . . . .", ". . . . E"],
  // 4x4 with the corners (and their neighbours) at the upper left and lower right removed, leaving a diagonal band: in at the lower left, exit at the upper right.
  diag4: ["# # . E", "# . . .", ". . . #", "S . # #"],
  // 5 rows x 4 columns: in at row 2, exit at row 4, both in column 1, a wall between them and a matching wall at row 3, column 4.
  notch5x4: [". . . .", "S . . .", "# . . #", "E . . .", ". . . ."],
  // 6 rows x 5 columns: in bottom middle, exit top middle, pillars at columns 2 and 4 in the two middle rows (and, for the second, in row 3 only).
  pillars6: [". . E . .", ". . . . .", ". # . # .", ". # . # .", ". . . . .", ". . S . ."],
  pillars6row3: [". . E . .", ". . . . .", ". # . # .", ". . . . .", ". . . . .", ". . S . ."],
  // 6 rows x 5 columns: in bottom middle, exit top middle, each corner and its two neighbours removed.
  nibbles6: ["# # E # #", "# . . . #", ". . . . .", ". . . . .", "# . . . #", "# # S # #"],
  // The older gate-model shapes (T plus a side letter); written out in the exit-cell model by convert.js.
  pillars: [". . . . TU", ". # . # .", "SL . . . ."],
  diamond: ["# . . TU", ". . . .", ". . . .", "SL . . #"],
  upright: [". . TU", ". # .", ". . .", ". # .", "SL . ."],
};

function render(shape, heights) {
  let k = 0;
  return shape
    .map((row) => row.split(" ").map((token) => (token === "#" || token === "E" ? token : `${heights[k++]}${token === "." ? "" : token}`)).join("  "))
    .join("\n");
}

function parseArgs(argv) {
  const args = {
    shapes: "all", restarts: 6, iterations: 600, seed: 1, minMoves: 24, maxMoves: 44, minPushes: 6, maxPushes: 13,
    minTraps: 3, maxWays: 3, maxRevisit: 0.55, count: 5, out: "", maxHeight: 5, maxDecoys: 0, maxUnused: 0, maxStates: 60000, minutes: 0,
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = ["shapes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

// Cheap score from the analysis alone.
function baseScore(a, args) {
  return (
    3 * Math.min(a.traps, 8) + 1.5 * a.pushes - 3 * Math.log2(a.ways) - 40 * Math.max(0, a.revisit - args.maxRevisit + 0.05) -
    1.0 * Math.max(0, args.minMoves - a.length) - 1.0 * Math.max(0, a.length - args.maxMoves) - (args.maxDecoys > 0 ? 15 : 40) * (a.unused / a.openCells)
  );
}

function evaluate(shape, heights, args, full) {
  const text = render(shape, heights);
  const level = parseLevel(text);
  const a = analyse(level, { maxStates: args.maxStates, maxHeight: 9 }); // match solve()'s own default height cap
  if (!a || !a.solvable || a.walkable || a.disconnected > 0) return null;
  let score = baseScore(a, args);
  let extra = null;
  if (full) {
    const f = faults(text);
    const solution = solve(level, { maxStates: 100000 });
    if (solution.status !== "solved") return null;
    const runs = forcedRuns(level, solution.moves);
    // The cheap score above penalises raw `ways` (noisy: inflated by walking to
    // the same launch cell by different equal-length routes, or by which side of
    // a pile a push came from -- see push-ways.js). Now that we can afford it,
    // undo that rough penalty and apply the accurate one instead.
    const pw = pushWays(level, { maxStates: args.maxStates, maxHeight: 9, capSequences: 4000 });
    const plans = pw && !pw.overflow ? pw.pushSequences : Infinity;
    extra = { decoys: f ? f.decoys : 99, runs, plans };
    score += 3 * Math.log2(Math.max(1, a.ways)) - 3 * Math.log2(Math.max(1, Math.min(plans, 1e6)));
    score -= (args.maxDecoys > 0 ? 2 : 8) * extra.decoys + 3 * (Math.max(0, runs.opening - 1) + Math.max(0, runs.closing - 1));
  }
  return { text, a, score, extra };
}

function anneal(shape, args, rand, deadline) {
  const open = shape.join(" ").split(" ").filter((token) => token !== "#" && token !== "E").length;
  let heights = Array.from({ length: open }, () => Math.floor(rand() * 4));
  let current = null;
  for (let tries = 0; tries < 200 && !current; tries += 1) {
    heights = Array.from({ length: open }, () => Math.floor(rand() * 4));
    current = evaluate(shape, heights, args, false);
  }
  if (!current) return null;
  current = evaluate(shape, heights, args, true) || current;
  let best = { ...current, heights: heights.slice() };
  for (let it = 0; it < args.iterations; it += 1) {
    if (deadline && Date.now() > deadline) break;
    const temperature = 3 * (1 - it / args.iterations) + 0.05;
    const next = heights.slice();
    const i = Math.floor(rand() * open);
    const op = rand();
    if (op < 0.6) next[i] = Math.max(0, Math.min(args.maxHeight, next[i] + (rand() < 0.5 ? -1 : 1)));
    else if (op < 0.85) next[i] = Math.floor(rand() * (args.maxHeight + 1));
    else {
      const j = Math.floor(rand() * open);
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (next.every((h, k) => h === heights[k])) continue;
    // Full scoring only when the cheap score is competitive.
    let result = evaluate(shape, next, args, false);
    if (!result || result.score < current.score - temperature * 2) continue;
    result = evaluate(shape, next, args, true) || result;
    if (result.score >= current.score - temperature * Math.log(1 / Math.max(rand(), 1e-9)) * 0.3) {
      heights = next;
      current = result;
      if (result.score > best.score) best = { ...result, heights: next.slice() };
    }
  }
  return best;
}

function qualifies(best, args) {
  return (
    best && best.extra && best.extra.decoys <= args.maxDecoys && best.extra.runs.opening <= 2 && best.extra.runs.closing <= 2 &&
    fits(best.a, args, best.extra.plans)
  );
}

function main() {
  const argv = process.argv.slice(2);
  const mergeAt = argv.indexOf("--merge");
  if (mergeAt >= 0) {
    const files = argv.filter((arg, i) => i > mergeAt && !arg.startsWith("--") && !/^\d/.test(arg));
    const args = parseArgs(argv.filter((arg, i) => i < mergeAt));
    const seen = new Map();
    for (const file of files) {
      for (const line of fs.readFileSync(file, "utf8").split("\n")) {
        if (line.startsWith("FOUND ")) {
          const item = JSON.parse(line.slice(6));
          seen.set(item.text, item);
        }
      }
    }
    console.log(`${seen.size} boards in ${files.length} logs`);
    // The logs hold every attempt; re-check the ones in the window for decoys and
    // forced ends, and only now pay for the accurate push-sequence count (each
    // log already carries the cheap raw `ways`, but not necessarily `pw`).
    const clean = [];
    for (const item of seen.values()) {
      if (!fits(item.a, args, item.a.ways)) continue; // quick pre-filter on the cheap count first
      const level = parseLevel(item.text);
      const f = faults(item.text);
      const solution = solve(level, { maxStates: 100000 });
      if (solution.status !== "solved") continue;
      const runs = forcedRuns(level, solution.moves);
      if (!f || f.decoys > args.maxDecoys || runs.opening > 2 || runs.closing > 2) continue;
      const pw = item.pw !== undefined ? { pushSequences: item.pw, overflow: false } : pushWays(level, { maxStates: args.maxStates, maxHeight: 9, capSequences: 4000 });
      const plans = pw && !pw.overflow ? pw.pushSequences : Infinity;
      if (!fits(item.a, args, plans)) continue;
      clean.push({ ...item, pw: plans });
    }
    console.log(`${clean.length} clean boards in the window`);
    return finish(clean, args);
  }
  const args = parseArgs(argv);
  const names = args.shapes === "all" ? Object.keys(SHAPES) : args.shapes.split(",");
  const found = new Map();
  const deadline = args.minutes ? Date.now() + args.minutes * 60000 : 0;
  for (const name of names) {
    const shape = SHAPES[name];
    for (let r = 0; r < args.restarts; r += 1) {
      if (deadline && Date.now() > deadline) break;
      const best = anneal(shape, args, mulberry32(args.seed * 7919 + r * 104729 + name.length), deadline);
      if (!best) continue;
      const ok = qualifies(best, args);
      const a = best.a;
      const plans = best.extra && best.extra.plans;
      console.log(`${name} #${r}: ${ok ? "KEEP" : "skip"} ${a.length}m ${a.pushes}p ${a.traps}t ${a.ways}w-raw ${plans}pw rev ${a.revisit.toFixed(2)} decoys ${best.extra && best.extra.decoys} forced ${best.extra && best.extra.runs.opening}/${best.extra && best.extra.runs.closing} score ${best.score.toFixed(1)}`);
      console.log(`FOUND ${JSON.stringify({ text: best.text, a, pw: plans })}`);
      if (ok) found.set(best.text, { text: best.text, a, pw: plans });
    }
  }
  console.log(`${found.size} kept`);
  finish([...found.values()], args);
}

if (require.main === module) main();
module.exports = { SHAPES, render };
