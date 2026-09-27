// Generates tidy candidate levels for a stretch of the difficulty ramp:
// hill-climb with find-levels.js, tidy each board (tidy.js), re-analyse it and
// keep only boards that still fit the target window and have no unused cells.
// Writes the best few, spread across the window, to src/candidates.js.
//
//   node experiments/make-levels.js [--sizes 5x5,6x5,6x6] [--seeds 1-12] [--count 5]
//        [--min-moves 24] [--max-moves 44] [--min-pushes 6] [--max-pushes 11]
//        [--min-traps 3] [--max-ways 3] [--out src/candidates.js]
//   node experiments/make-levels.js --merge run1.log run2.log ... [--count 5] [--out src/candidates.js]
// Each run prints its kept boards as "FOUND {json}" lines, so several runs can go in
// parallel (different --seeds) and be merged afterwards.
const fs = require("fs");
const path = require("path");
const { formatLevel, createState, solve, parseLevel } = require("../src/engine.js");
const { mulberry32, randomLevel, mutate } = require("./random-levels.js");
const { analyse } = require("./analyse.js");
const { rate } = require("./find-levels.js");
const { tidy, faults, forcedRuns } = require("./tidy.js");
const { toExitCell } = require("./convert.js");

// Like find-levels' climb, but the score also charges for the faults that tidy()
// would have to remove afterwards (alcove decoys, a forced opening walk), and
// keeps the solution inside the target window, so the search improves the
// puzzle that survives tidying instead of one that is mostly decoration.
function adjust(level, result, args) {
  const a = result.a;
  const f = faults(formatLevel(level, createState(level)));
  if (!f) return null;
  // The puzzle proper is what is left after the forced walks at either end.
  const moves = solve(level, { maxStates: 100000 }).moves;
  if (!moves) return null;
  const runs = forcedRuns(level, moves);
  const core = a.length - runs.opening - runs.closing;
  const outside =
    Math.max(0, args.minPushes - a.pushes) * 3 + Math.max(0, args.minMoves - core) * 1.5 +
    3 * (Math.max(0, runs.opening - 1) + Math.max(0, runs.closing - 1));
  // Cells that are part of the puzzle (not decoys) earn score, up to a room of about 18.
  const essential = a.openCells - f.decoys;
  return { ...result, score: result.score - 8 * f.decoys + 2 * Math.min(essential, 18) - 0 - outside };
}

// One hill-climbing stage from `level`; returns the best board found.
function stage(level, args, rand, iterations) {
  const base0 = rate(level, args);
  let current = base0 && adjust(level, base0, args);
  if (!current) return null;
  for (let it = 0; it < iterations; it += 1) {
    const candidate = mutate(level, rand, args.maxInitial);
    if (!candidate) continue;
    const base = rate(candidate, args);
    // Only pay for the fault check when the plain score is competitive.
    if (!base || base.score < current.score) continue;
    const result = adjust(candidate, base, args);
    if (result && result.score >= current.score) {
      level = candidate;
      current = result;
    }
  }
  return { level, ...current };
}

// Climb, tidy, climb again on the smaller board that is left, and so on: what
// survives tidying is what counts, and tidying shrinks the board (so start big).
function climb(width, height, args, rand) {
  let level = null;
  for (let tries = 0; tries < 300 && !level; tries += 1) {
    const candidate = randomLevel(width, height, args.wall, rand);
    if (candidate && rate(candidate, args)) level = candidate;
  }
  if (!level) return null;
  let best = null;
  for (let round = 0; round < args.rounds; round += 1) {
    best = stage(level, args, rand, args.iterations);
    if (!best) return null;
    level = parseLevel(tidy(formatLevel(best.level, createState(best.level))).text);
    if (!rate(level, args)) return null;
  }
  return { level };
}

function parseArgs(argv) {
  const args = {
    sizes: "5x5,6x5", seeds: "1-12", count: 5, minMoves: 24, maxMoves: 46, minPushes: 6, maxPushes: 13,
    minTraps: 3, maxWays: 3, maxRevisit: 0.55, out: "", iterations: 150, rounds: 3,
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = ["sizes", "seeds", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

// `ways` is analyse()'s raw count of distinct shortest move-sequences: cheap
// (already computed), but inflated by walking a different route to the same
// launch cell before a push, or approaching a push from a different side (see
// push-ways.js for what that second kind actually means for play). Callers that
// have paid for the accurate count (pushWays(), in push-ways.js: distinct
// (launch cell, pile) sequences) pass it as `waysValue`; otherwise this falls
// back to the raw, noisier count.
function fits(a, args, waysValue = a && a.ways) {
  return (
    a && a.solvable && !a.walkable && a.disconnected === 0 && a.unused <= (args.maxUnused || 0) &&
    a.length >= args.minMoves && a.length <= args.maxMoves && a.pushes >= args.minPushes && a.pushes <= args.maxPushes &&
    a.traps >= args.minTraps && waysValue <= args.maxWays && a.revisit <= args.maxRevisit
  );
}

function main() {
  const argv = process.argv.slice(2);
  const mergeAt = argv.indexOf("--merge");
  if (mergeAt >= 0) return merge(argv, mergeAt);
  const args = parseArgs(argv);
  const [lo, hi] = args.seeds.split("-").map(Number);
  const climbArgs = {
    wall: 0.1, minPushes: args.minPushes, maxLength: args.maxMoves + 10, maxWays: args.maxWays, maxInitial: 5,
    maxUnused: 0.5, maxStates: 60000, iterations: args.iterations, rounds: args.rounds,
    minMoves: args.minMoves, minPushes: args.minPushes,
  };
  const found = new Map();
  let boards = 0;
  for (let seed = lo; seed <= (hi || lo); seed += 1) {
    for (const size of args.sizes.split(",")) {
      const [w, h] = size.split("x").map(Number);
      const best = climb(w, h, climbArgs, mulberry32(seed * 1000 + w * 10 + h));
      if (!best) continue;
      boards += 1;
      const start = formatLevel(best.level, createState(best.level));
      const tidied = tidy(start);
      const level = parseLevel(tidied.text);
      const a = analyse(level, { maxStates: 100000, maxHeight: 9 }); // match solve()'s own default height cap
      const ok = fits(a, args);
      console.log(`seed ${seed} ${size}: ${ok ? "KEEP" : "skip"} ${a ? `${a.length}m ${a.pushes}p ${a.traps}t ${a.ways}w ${a.unused}u` : "(cap)"} removed ${tidied.removed.length} trimmed ${tidied.trimmed}`);
      // Every tidied board is logged with its metrics, so --merge can filter with any window.
      if (a && !found.has(tidied.text)) console.log(`FOUND ${JSON.stringify({ text: tidied.text, a })}`);
      if (ok && !found.has(tidied.text)) found.set(tidied.text, { a, level, text: tidied.text });
    }
  }
  console.log(`${boards} boards, ${found.size} fit`);
  finish([...found.values()], args);
}

// Picks `count` boards spread across the window (by solution length) and writes them out.
function finish(all, args) {
  all.sort((x, y) => x.a.length - y.a.length);
  const picks = [];
  for (let i = 0; i < Math.min(args.count, all.length); i += 1) {
    picks.push(all[Math.round((i * (all.length - 1)) / Math.max(1, Math.min(args.count, all.length) - 1))]);
  }
  const unique = [...new Set(picks)];
  const namePrefix = args.out && path.basename(args.out) === "pool.js" ? "Option" : "Candidate";
  const body = unique
    .map((c0, i) => {
      let c = c0;
      // Written in the exit-cell model (a column of light), whatever the search used.
      c = { ...c, text: toExitCell(c.text) };
      const level = parseLevel(c.text);
      const solution = solve(level, { maxStates: 400000 }).moves;
      // `pw` (push-sequences, the corrected count) is attached by callers that computed
      // it; otherwise fall back to reporting the raw, noisier `ways` alone.
      const info = c.pw === undefined
        ? `${level.width}x${level.height}, ${c.a.pushes} pushes, ${c.a.ways} way${c.a.ways === 1 ? "" : "s"}, ${c.a.traps} traps, ${c.a.length} moves`
        : `${level.width}x${level.height}, ${c.a.pushes} pushes, ${c.pw} plan${c.pw === 1 ? "" : "s"} (${c.a.ways} raw), ${c.a.traps} traps, ${c.a.length} moves`;
      console.log(`// ${info}\n${c.text}\n`);
      return `  {
    name: "${namePrefix} ${i + 1}",
    info: "${info}",
    solution: "${solution}",
    text: \`
${c.text.split("\n").map((l) => "      " + l).join("\n")}\`,
  },`;
    })
    .join("\n");
  writeOut(args.out, unique.length, body);
}

// Writes to src/candidates.js (appendable, growing) or src/pool.js (ephemeral,
// fully overwritten each time -- see that file's own comment): the variable
// name and each entry's name prefix ("Candidate"/"Option") follow from which.
function writeOut(out, count, body) {
  if (!out || !count) return;
  const isPool = path.basename(out) === "pool.js";
  const varName = isPool ? "POOL" : "CANDIDATES";
  const header = isPool
    ? `// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/candidates.js was starting to. Once a choice is made, whatever's here
// can be discarded; nothing else in the game refers to it. See pool.html.
const POOL = [
`
    : `// Candidate levels from experiments/make-levels.js, for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
`;
  fs.writeFileSync(path.resolve(out), header + body + "\n];\n");
  console.log(`wrote ${out} (${varName}, ${count} entries)`);
}

function merge(argv, at) {
  const files = [];
  for (let i = at + 1; i < argv.length && !argv[i].startsWith("--"); i += 1) files.push(argv[i]);
  const rest = argv.filter((arg, i) => i < at || i > at + files.length);
  const args = parseArgs(rest);
  const seen = new Map();
  for (const file of files) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.startsWith("FOUND ")) continue;
      const item = JSON.parse(line.slice(6));
      seen.set(item.text, item);
    }
  }
  console.log(`${seen.size} boards in ${files.length} logs`);
  finish([...seen.values()].filter((item) => fits(item.a, args)), args);
}

if (require.main === module) main();
module.exports = { fits, finish, parseArgs, writeOut };
