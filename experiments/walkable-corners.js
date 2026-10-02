// Walkable-goal level search ("make every cell reachable by walking", no exit,
// engine.isWalkable) over plain rectangular rooms under line push. Only the
// crate heights and the start cell are searched, by simulated annealing on
// analyse.js's measures with walkWin, the same shape as line-corners.js. No
// pillars yet: rooms are pure rectangles. With no exit and no pillars every
// symmetry of the rectangle plays identically, so boards are deduplicated up
// to those symmetries (see canonical).
//
//   node experiments/walkable-corners.js [--tier easy|mid|hard] [--sizes 4x4,5x4,5x5]
//        [--restarts 3] [--iterations 500] [--seed 1] [--minutes 0] [--out run.log]
//
// Tiers are aimed at the density experiment (walkable-density.js): the median
// solvable uniform-height 4x4 board is 12 moves / 5 pushes / 1 trap, its 95th
// percentile 32 / 11 / 6. Every kept board is a "FOUND {json}" line on stdout;
// experiments/walkable-pool.js merges logs, re-verifies at the full height cap
// and picks a spread.
const { parseLevel } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { analyse } = require("./analyse.js");

const TIERS = {
  easy: { minLen: 8, maxLen: 14, minPushes: 3, maxPushes: 5, minTraps: 1 },
  mid: { minLen: 14, maxLen: 24, minPushes: 5, maxPushes: 8, minTraps: 2 },
  hard: { minLen: 22, maxLen: 40, minPushes: 7, maxPushes: 12, minTraps: 3 },
};
const MAX_INITIAL = 5;
const MAX_WAYS = 4;
const MAX_REVISIT = 0.65;
const MAX_UNUSED = 2; // cells the solution never touches

function render(w, h, heights, start) {
  const rows = [];
  for (let r = 0; r < h; r += 1) {
    rows.push(Array.from({ length: w }, (_, c) => `${heights[r * w + c]}${r * w + c === start ? "S" : ""}`).join("  "));
  }
  return rows.join("\n");
}

// Smallest text among the rectangle's symmetries (flips, plus the transpose and
// quarter turns for squares), so equivalent boards compare equal. The start is
// carried along with its cell.
function canonical(text) {
  const grid = text.trim().split("\n").map((l) => l.trim().split(/\s+/));
  const h = grid.length;
  const w = grid[0].length;
  const variants = [];
  const maps = [
    (r, c) => [r, c],
    (r, c) => [r, w - 1 - c],
    (r, c) => [h - 1 - r, c],
    (r, c) => [h - 1 - r, w - 1 - c],
  ];
  for (const m of maps) {
    const out = Array.from({ length: h }, () => Array(w));
    for (let r = 0; r < h; r += 1) for (let c = 0; c < w; c += 1) { const [rr, cc] = m(r, c); out[rr][cc] = grid[r][c]; }
    variants.push(out.map((row) => row.join(" ")).join("|"));
  }
  if (w === h) {
    const t = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => grid[c][r]));
    for (const m of maps) {
      const out = Array.from({ length: h }, () => Array(w));
      for (let r = 0; r < h; r += 1) for (let c = 0; c < w; c += 1) { const [rr, cc] = m(r, c); out[rr][cc] = t[r][c]; }
      variants.push(out.map((row) => row.join(" ")).join("|"));
    }
  }
  return variants.sort()[0];
}

function evaluate(w, h, heights, start, tier) {
  const text = render(w, h, heights, start);
  const a = analyse(parseLevel(text), { linePush: true, walkWin: true, maxHeight: 6, maxStates: 40000 });
  if (!a || a.alreadyWon || !a.solvable) return null;
  const miss = (v, lo, hi) => Math.max(0, lo - v) + Math.max(0, v - hi);
  const score =
    3 * Math.min(a.traps, 8) + 1.5 * a.pushes + a.pushCells - 2 * Math.log2(a.ways) +
    4 * a.deadFraction -
    40 * Math.max(0, a.revisit - MAX_REVISIT) - 6 * Math.max(0, a.unused - MAX_UNUSED) -
    1.5 * miss(a.length, tier.minLen, tier.maxLen) - 3 * miss(a.pushes, tier.minPushes, tier.maxPushes) - 4 * Math.max(0, tier.minTraps - a.traps);
  return { text, a, score };
}

function fits(a, tier) {
  return (
    a.length >= tier.minLen && a.length <= tier.maxLen && a.pushes >= tier.minPushes && a.pushes <= tier.maxPushes &&
    a.traps >= tier.minTraps && a.ways <= MAX_WAYS && a.unused <= MAX_UNUSED && a.revisit <= MAX_REVISIT
  );
}

function anneal(w, h, tier, rand, iterations, deadline) {
  const n = w * h;
  let heights;
  let start;
  let current = null;
  for (let tries = 0; tries < 600 && !current; tries += 1) {
    heights = Array.from({ length: n }, () => Math.floor(rand() * 5));
    start = Math.floor(rand() * n);
    current = evaluate(w, h, heights, start, tier);
  }
  if (!current) return null;
  let best = { ...current };
  const kept = new Map(); // canonical text -> best-scoring board that fit
  for (let it = 0; it < iterations; it += 1) {
    if (deadline && Date.now() > deadline) break;
    const temperature = 3 * (1 - it / iterations) + 0.05;
    const next = heights.slice();
    let nextStart = start;
    const i = Math.floor(rand() * n);
    const op = rand();
    if (op < 0.55) next[i] = Math.max(0, Math.min(MAX_INITIAL, next[i] + (rand() < 0.5 ? -1 : 1)));
    else if (op < 0.75) next[i] = Math.floor(rand() * (MAX_INITIAL + 1));
    else if (op < 0.92) {
      const j = Math.floor(rand() * n);
      [next[i], next[j]] = [next[j], next[i]];
    } else nextStart = i;
    if (nextStart === start && next.every((v, k) => v === heights[k])) continue;
    const result = evaluate(w, h, next, nextStart, tier);
    if (!result) continue;
    if (fits(result.a, tier)) {
      const key = canonical(result.text);
      if (!kept.has(key) || kept.get(key).score < result.score) kept.set(key, result);
    }
    if (result.score >= current.score - temperature * Math.log(1 / Math.max(rand(), 1e-9)) * 0.3) {
      heights = next;
      start = nextStart;
      current = result;
      if (result.score > best.score) best = result;
    }
  }
  return { best, kept };
}

function parseArgs(argv) {
  const args = { tier: "mid", sizes: "4x4,5x4,5x5", restarts: 3, iterations: 500, seed: 1, minutes: 0 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    args[key] = ["tier", "sizes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tier = TIERS[args.tier];
  const sizes = args.sizes.split(",").map((s) => s.split("x").map(Number));
  const deadline = args.minutes ? Date.now() + args.minutes * 60000 : 0;
  let total = 0;
  sizes.forEach(([w, h], idx) => {
    for (let r = 0; r < args.restarts; r += 1) {
      if (deadline && Date.now() > deadline) return;
      const out = anneal(w, h, tier, mulberry32(args.seed * 7919 + r * 104729 + idx * 31), args.iterations, deadline);
      if (!out) continue;
      const b = out.best.a;
      console.log(`${w}x${h} #${r}: best ${b.length}m ${b.pushes}p ${b.traps}t ${b.ways}w unused ${b.unused} rev ${b.revisit.toFixed(2)} score ${out.best.score.toFixed(1)}; ${out.kept.size} fit`);
      for (const item of out.kept.values()) {
        total += 1;
        console.log(`FOUND ${JSON.stringify({ shape: `${w}x${h}`, tier: args.tier, text: item.text, a: item.a })}`);
      }
    }
  });
  console.log(`done ${total} kept`);
}

if (require.main === module) main();
module.exports = { TIERS, render, canonical };
