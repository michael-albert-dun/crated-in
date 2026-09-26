// Shape-seeded search. The room's shape is fixed up front (walls, pillars, start
// and exit with their gates), so it can't grow long corridors or decoy alcoves by
// construction; only the crate heights are searched, by simulated annealing on the
// solver's own measures (solution length, pushes, traps, few equal solutions,
// little shuffling) with penalties for decoy cells and forced walks at the ends.
//
//   node experiments/shape-levels.js [--shapes all|name,name] [--restarts 6] [--iterations 600]
//        [--seed 1] [--min-moves 24] [--max-moves 44] [--min-pushes 6] [--max-pushes 13]
//        [--min-traps 3] [--max-ways 3] [--max-decoys 0] [--max-unused 0] [--out src/candidates.js] [--count 5]
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
const { fits, finish } = require("./make-levels.js");

const SHAPES = {
  // A pure 4x4: in at the lower left, the exit cell in the upper right corner, so it can be reached from either of two cells.
  square4: [". . . E", ". . . .", ". . . .", "S . . ."],
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
    minTraps: 3, maxWays: 3, maxRevisit: 0.55, count: 5, out: "", maxHeight: 5, maxDecoys: 0, maxUnused: 0,
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
  const a = analyse(level, { maxStates: 60000 });
  if (!a || !a.solvable || a.walkable || a.disconnected > 0) return null;
  let score = baseScore(a, args);
  let extra = null;
  if (full) {
    const f = faults(text);
    const solution = solve(level, { maxStates: 100000 });
    const runs = forcedRuns(level, solution.moves);
    extra = { decoys: f ? f.decoys : 99, runs };
    score -= (args.maxDecoys > 0 ? 2 : 8) * extra.decoys + 3 * (Math.max(0, runs.opening - 1) + Math.max(0, runs.closing - 1));
  }
  return { text, a, score, extra };
}

function anneal(shape, args, rand) {
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
  return best && best.extra && best.extra.decoys <= args.maxDecoys && best.extra.runs.opening <= 2 && best.extra.runs.closing <= 2 && fits(best.a, args);
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
    // The logs hold every attempt; re-check the ones in the window for decoys and forced ends.
    const clean = [...seen.values()].filter((item) => {
      if (!fits(item.a, args)) return false;
      const level = parseLevel(item.text);
      const f = faults(item.text);
      const runs = forcedRuns(level, solve(level, { maxStates: 100000 }).moves);
      return f && f.decoys <= args.maxDecoys && runs.opening <= 2 && runs.closing <= 2;
    });
    console.log(`${clean.length} clean boards in the window`);
    return finish(clean, args);
  }
  const args = parseArgs(argv);
  const names = args.shapes === "all" ? Object.keys(SHAPES) : args.shapes.split(",");
  const found = new Map();
  for (const name of names) {
    const shape = SHAPES[name];
    for (let r = 0; r < args.restarts; r += 1) {
      const best = anneal(shape, args, mulberry32(args.seed * 7919 + r * 104729 + name.length));
      if (!best) continue;
      const ok = qualifies(best, args);
      const a = best.a;
      console.log(`${name} #${r}: ${ok ? "KEEP" : "skip"} ${a.length}m ${a.pushes}p ${a.traps}t ${a.ways}w rev ${a.revisit.toFixed(2)} decoys ${best.extra && best.extra.decoys} forced ${best.extra && best.extra.runs.opening}/${best.extra && best.extra.runs.closing} score ${best.score.toFixed(1)}`);
      console.log(`FOUND ${JSON.stringify({ text: best.text, a })}`);
      if (ok) found.set(best.text, { text: best.text, a });
    }
  }
  console.log(`${found.size} kept`);
  finish([...found.values()], args);
}

if (require.main === module) main();
module.exports = { SHAPES, render };
