// Reversal generator. Instead of hunting for a good board by random mutation,
// build one backwards from its ending, so every level is solvable by
// construction and every cell that matters is there for a reason.
//
// Start from a finished position (the player on the target, random low heights),
// then undo pushes one at a time. Undoing a push is exact:
//   forward:  pile q loses 1, every open neighbour of q gains 1 (the player's own
//             cell included), then if every open cell is at least 1 the bottom
//             layer is removed (reflooring);
//   backward: pile q gains 1, its open neighbours lose 1, and if some cell would
//             go below 0 everything is lifted by that many layers first (undoing
//             the reflooring). The undone push must have been legal: the pile
//             ended up at least 2 above the cell the player stood on.
// Between undone pushes the player can walk back (a walk needs a height
// difference of at most 1, the same both ways). The last position is the start.
// The first undone push must be from the target or next to it, and the start is
// the cell of the last one, so the level has no long forced walk at either end.
//
//   node experiments/reverse-levels.js [--sizes 5x5,6x5] [--pushes 6-11] [--tries 400]
//        [--seed 1] [--min-moves 24] [--max-moves 44] [--out src/candidates.js] [--count 5]
//
// The solver still has the last word (it finds the real shortest solution, which
// can be shorter than the one built), and tidy() then walls off decoys. What it
// prints is how many boards survive each stage, since the yield is the point.
const fs = require("fs");
const path = require("path");
const { makeLevel, outerWalls, exitDirs, gateKey, formatLevel, createState, solve, parseLevel } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { analyse } = require("./analyse.js");
const { tidy, faults, forcedRuns } = require("./tidy.js");
const { fits, finish } = require("./make-levels.js");

const HEIGHT_WEIGHTS = [0.45, 0.32, 0.17, 0.06];
const MAX_HEIGHT = 7; // during construction; the finished level is checked against 5

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

function weightedPick(items, weight, rand) {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let x = rand() * total;
  for (const item of items) {
    x -= weight(item);
    if (x <= 0) return item;
  }
  return items[items.length - 1];
}

function randomWalls(width, height, wallP, rand) {
  for (let tries = 0; tries < 50; tries += 1) {
    const wall = new Uint8Array(width * height);
    for (let i = 0; i < wall.length; i += 1) wall[i] = rand() < wallP ? 1 : 0;
    const open = [];
    wall.forEach((w, i) => { if (!w) open.push(i); });
    if (open.length < 10) continue;
    const seen = new Set([open[0]]);
    for (const cell of seen) {
      const r = Math.floor(cell / width);
      const c = cell % width;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= height || cc < 0 || cc >= width) continue;
        if (!wall[rr * width + cc]) seen.add(rr * width + cc);
      }
    }
    if (seen.size === open.length) return wall;
  }
  return null;
}

// Positions the player can reach by walking (height difference <= 1), with the
// path to each, from `pos` over heights `h`.
function walkTree(level, h, pos) {
  const parent = new Map([[pos, -1]]);
  const order = [pos];
  for (let head = 0; head < order.length; head += 1) {
    const cell = order[head];
    for (const n of level.nbrs[cell]) {
      if (n < 0 || parent.has(n) || Math.abs(h[n] - h[cell]) > 1) continue;
      parent.set(n, cell);
      order.push(n);
    }
  }
  return { parent, order };
}

// The heights before a push at pile q made with the player at p, or null if that
// push could not have happened.
function undoPush(level, h, p, q) {
  const g = Int16Array.from(h);
  g[q] += 1;
  for (const n of level.nbrs[q]) if (n >= 0) g[n] -= 1;
  let min = Infinity;
  for (let i = 0; i < g.length; i += 1) if (!level.wall[i] && g[i] < min) min = g[i];
  if (min > 0) return null; // would have been reflooded away
  const lift = -min;
  for (let i = 0; i < g.length; i += 1) if (!level.wall[i]) g[i] += lift;
  let max = 0;
  for (let i = 0; i < g.length; i += 1) if (!level.wall[i] && g[i] > max) max = g[i];
  if (max > MAX_HEIGHT || g[q] - g[p] < 2) return null;
  return g;
}

const REJECT = {};
function reject(code) {
  REJECT[code] = (REJECT[code] || 0) + 1;
  return null;
}

// Every undoable push from `pos`: walk to some cell p by the reverse-walk
// relation, then undo a push at a neighbour q. `near` (a cell, or -1) limits p to
// that cell and its neighbours.
function reverseMoves(level, h, pos, near) {
  const { order } = walkTree(level, h, pos);
  const moves = [];
  for (const p of order) {
    if (near >= 0 && p !== near && !level.nbrs[near].includes(p)) continue;
    for (const q of level.nbrs[p]) {
      if (q < 0) continue;
      const before = undoPush(level, h, p, q);
      if (before) moves.push({ p, q, before });
    }
  }
  return moves;
}

function generate(width, height, goal, rand, { minGain = 1, maxGain = 8, looked: args_looked = 24, nodes = 200 } = {}) {
  const wall = randomWalls(width, height, 0.1 + rand() * 0.15, rand);
  if (!wall) return reject(1);
  const outer = outerWalls(width, height, wall);
  const open = [];
  wall.forEach((w, i) => { if (!w) open.push(i); });
  const gated = open.filter((i) => exitDirs(width, height, wall, i, outer).length > 0);
  if (gated.length < 2) return reject(2);
  const target = pick(gated, rand);
  const exitDir = pick(exitDirs(width, height, wall, target, outer), rand);

  const h = new Int16Array(width * height);
  for (const i of open) {
    let x = rand();
    let v = 0;
    for (; v < HEIGHT_WEIGHTS.length - 1 && x >= HEIGHT_WEIGHTS[v]; v += 1) x -= HEIGHT_WEIGHTS[v];
    h[i] = v;
  }
  h[open.find((i) => h[i] === 0) ?? open[0]] = 0;
  const min = Math.min(...open.map((i) => h[i]));
  for (const i of open) h[i] -= min;

  const probe = makeLevel(width, height, wall, h, target, target, exitDir, -1);
  // Undo pushes, but only ones that count. After each candidate undo the solver
  // measures the real shortest distance from the new position to the exit, and
  // the undo is kept only if that distance grows by at least `minGain` (a push
  // plus the walk to it), so every undone push is needed, not just possible. That
  // is the point of measuring instead of assuming: a random undo is usually
  // bypassed by a shortcut. Depth-first with a budget, so it backtracks out of
  // corners and always ends. Stops once the distance reaches `goal`.
  const distance = (heights, pos) => {
    const probeLevel = makeLevel(width, height, wall, heights, pos, target, exitDir, -1);
    const out = solve(probeLevel, { maxStates: 30000 });
    return out.status === "solved" ? out.moves.length : -1;
  };
  let budget = nodes;
  const chain = [];
  const extend = (heights, pos, dist) => {
    if (dist >= goal) {
      // The finished level: initial heights at most 5, and a start with a gate
      // (the cell itself, or one a short walk away).
      if (Math.max(...open.map((i) => heights[i])) > 5) return null;
      const { order } = walkTree(probe, heights, pos);
      const gatedStart = order.find((cell) => exitDirs(width, height, wall, cell, outer).length > 0);
      if (gatedStart === undefined || (gatedStart !== pos && order.indexOf(gatedStart) > 2)) return null;
      return { heights, pos: gatedStart };
    }
    if (budget-- <= 0) return null;
    const moves = reverseMoves(probe, heights, pos, dist === 1 ? target : -1);
    const remaining = moves.slice();
    // Look at a handful of undoable pushes, in a random order weighted towards variety.
    const scored = [];
    for (let looked = 0; looked < args_looked && remaining.length; looked += 1) {
      const m = weightedPick(remaining, (x) => (chain.slice(-3).includes(x.q) ? 0.3 : 1) * (x.p === pos ? 0.6 : 1), rand);
      remaining.splice(remaining.indexOf(m), 1);
      const d = distance(m.before, m.p);
      if (d >= dist + minGain && d <= dist + maxGain) scored.push({ ...m, d });
    }
    while (scored.length) {
      const m = weightedPick(scored, () => 1, rand);
      scored.splice(scored.indexOf(m), 1);
      chain.push(m.q);
      const done = extend(m.before, m.p, m.d);
      if (done) return done;
      chain.pop();
    }
    return null;
  };
  const built = extend(h, target, 1);
  if (!built) return reject(3);
  const heights = built.heights;
  const pos = built.pos;

  // The start needs a gate; if this cell has none, walk back to a nearby gated one.
  let start = pos;
  let startDirs = exitDirs(width, height, wall, start, outer);
  if (!startDirs.length) {
    const { order } = walkTree(probe, heights, pos);
    const near = order.find((cell) => exitDirs(width, height, wall, cell, outer).length > 0);
    if (near === undefined) return reject(4);
    start = near;
    startDirs = exitDirs(width, height, wall, start, outer);
  }
  const startDir = pick(startDirs, rand);
  if (start === target || gateKey(width, start, startDir) === gateKey(width, target, exitDir)) return reject(5);
  if (Math.max(...open.map((i) => heights[i])) > 5) return reject(6);
  const level = makeLevel(width, height, wall, heights, start, target, exitDir, startDir);
  return formatLevel(level, createState(level));
}

function parseArgs(argv) {
  const args = { sizes: "5x5,6x5", pushes: "6-11", tries: 400, seed: 1, minMoves: 24, maxMoves: 44, minPushes: 5, maxPushes: 13, minTraps: 3, maxWays: 3, maxRevisit: 0.55, count: 5, out: "" };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = ["sizes", "pushes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rand = mulberry32(args.seed);
  const [pLo, pHi] = args.pushes.split("-").map(Number);
  const stats = { generated: 0, solvable: 0, tidied: 0, analysed: 0, window: 0, clean: 0 };
  const found = new Map();
  for (let t = 0; t < args.tries; t += 1) {
    const [w, h] = pick(args.sizes.split(","), rand).split("x").map(Number);
    const text = generate(w, h, args.minMoves + Math.floor(rand() * (args.maxMoves - args.minMoves + 1)), rand);
    if (!text) continue;
    stats.generated += 1;
    const first = solve(parseLevel(text), { maxStates: 100000 });
    if (first.status !== "solved") continue;
    stats.solvable += 1;
    const tidied = tidy(text);
    const level = parseLevel(tidied.text);
    stats.tidied += 1;
    const a = analyse(level, { maxStates: 100000, maxHeight: 9 }); // match solve()'s own default height cap
    if (!a) continue;
    stats.analysed += 1;
    if (a.length < args.minMoves || a.length > args.maxMoves || a.pushes < args.minPushes || a.pushes > args.maxPushes) continue;
    stats.window += 1;
    const solution = solve(level, { maxStates: 100000 });
    const runs = forcedRuns(level, solution.moves);
    const f = faults(tidied.text);
    const clean = fits(a, args) && f && f.decoys === 0 && runs.opening <= 2 && runs.closing <= 2;
    if (!clean) continue;
    stats.clean += 1;
    if (!found.has(tidied.text)) {
      found.set(tidied.text, { text: tidied.text, a, runs });
      console.log(`FOUND ${JSON.stringify({ text: tidied.text, a })}`);
      console.log(`// ${a.length}m ${a.pushes}p ${a.traps}t ${a.ways}w  forced ${runs.opening}/${runs.closing}  choices ${runs.choices}/${runs.states}\n${tidied.text}\n`);
    }
  }
  console.log(JSON.stringify(stats), "rejects", JSON.stringify(REJECT));
  if (args.out) finish([...found.values()], args);
}

if (require.main === module) main();
module.exports = { generate };
