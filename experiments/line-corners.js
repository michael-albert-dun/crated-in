// Line-push level search over plain rectangular rooms: in at the lower left,
// the exit cell (E) in the upper right, optional pillars placed symmetrically
// (180-degree rotation about the room's centre, plus reflection in the
// lower-left to upper-right diagonal for square rooms) and never touching the
// start or exit cell. Only the crate heights are searched, by simulated
// annealing on analyse.js's measures under linePush (including the rule that a
// pile can be pushed onto the exit's light).
//
//   node experiments/line-corners.js --list                      print the shapes
//   node experiments/line-corners.js [--tier easy|mid|hard] [--shapes 0,3,5|all]
//        [--restarts 3] [--iterations 500] [--seed 1] [--minutes 0] [--out run.log]
//
// Tiers are aimed relative to line-push Level 9 (22 moves, 8 pushes, 4 traps):
// easy a little simpler, mid about the same, hard somewhat more. Every kept
// board is written as a "FOUND {json}" line; experiments/line-corners-pool.js
// merges logs, re-verifies with the full solver and writes src/levels-test/pool.js.
const fs = require("fs");
const { parseLevel, solve } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { analyse } = require("./analyse.js");

const TIERS = {
  easy: { minLen: 10, maxLen: 17, minPushes: 3, maxPushes: 6, minTraps: 1 },
  mid: { minLen: 17, maxLen: 26, minPushes: 5, maxPushes: 9, minTraps: 3 },
  hard: { minLen: 25, maxLen: 42, minPushes: 8, maxPushes: 14, minTraps: 5 },
};
const MAX_INITIAL = 5;
const MAX_WAYS = 3;
const MAX_REVISIT = 0.65;
const MAX_UNUSED = 1; // decoy cells the solution never touches

// Shapes are arrays of rows of "." (open), "#" (pillar), with E and S placed.
function buildShapes() {
  const sizes = [[4, 4], [5, 4], [4, 5], [5, 5], [6, 4], [4, 6], [6, 5], [5, 6]];
  const shapes = [];
  const seen = new Set();
  for (const [w, h] of sizes) {
    const s = [h - 1, 0];
    const e = [0, w - 1];
    const cells = [];
    for (let r = 0; r < h; r += 1) for (let c = 0; c < w; c += 1) cells.push([r, c]);
    const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 1;
    const candidates = cells.filter((p) => !near(p, s) && !near(p, e));
    const rot = (p) => [h - 1 - p[0], w - 1 - p[1]];
    // Reflection in the lower-left / upper-right diagonal: (r, c) -> (h-1-c, h-1-r), squares only.
    const refl = (p) => [h - 1 - p[1], h - 1 - p[0]];
    const groups = [[]]; // the no-pillar room first
    for (const p of candidates) {
      const q = rot(p);
      const orbit = [p, q];
      if (!candidates.some((c) => c[0] === q[0] && c[1] === q[1])) continue;
      groups.push(orbit);
      if (w === h) {
        const m = refl(p);
        const orbit4 = [p, q, m, rot(m)];
        if (orbit4.every((x) => candidates.some((c) => c[0] === x[0] && c[1] === x[1]))) groups.push(orbit4);
      }
    }
    for (const group of groups) {
      const pillars = new Set(group.map(([r, c]) => `${r},${c}`));
      if (pillars.size > 4) continue;
      const rows = [];
      for (let r = 0; r < h; r += 1) {
        const row = [];
        for (let c = 0; c < w; c += 1) {
          row.push(r === s[0] && c === s[1] ? "S" : r === e[0] && c === e[1] ? "E" : pillars.has(`${r},${c}`) ? "#" : ".");
        }
        rows.push(row.join(" "));
      }
      if (!connected(rows)) continue;
      const key = rows.join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      shapes.push({ name: `${w}x${h}${pillars.size ? `-p${[...pillars].sort().join(";")}` : ""}`, rows });
    }
  }
  return shapes;
}

// All open cells reachable from S (the exit cell counts as open for this).
function connected(rows) {
  const grid = rows.map((row) => row.split(" "));
  const h = grid.length;
  const w = grid[0].length;
  let start = null;
  let open = 0;
  grid.forEach((row, r) => row.forEach((t, c) => {
    if (t !== "#") open += 1;
    if (t === "S") start = [r, c];
  }));
  const seen = new Set([start.join()]);
  const stack = [start];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= h || cc >= w || grid[rr][cc] === "#" || seen.has(`${rr},${cc}`)) continue;
      seen.add(`${rr},${cc}`);
      stack.push([rr, cc]);
    }
  }
  return seen.size === open;
}

function render(rows, heights) {
  let k = 0;
  return rows
    .map((row) => row.split(" ").map((t) => (t === "#" || t === "E" ? t : `${heights[k++]}${t === "S" ? "S" : ""}`)).join("  "))
    .join("\n");
}

function evaluate(rows, heights, tier) {
  const text = render(rows, heights);
  const a = analyse(parseLevel(text), { linePush: true, maxHeight: 6, maxStates: 40000 });
  if (!a || !a.solvable || a.walkable || a.disconnected > 0) return null;
  const miss = (v, lo, hi) => Math.max(0, lo - v) + Math.max(0, v - hi);
  const score =
    3 * Math.min(a.traps, 8) + 1.5 * a.pushes + a.pushCells - 3 * Math.log2(a.ways) -
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

function anneal(rows, tier, rand, iterations, deadline) {
  const open = rows.join(" ").split(" ").filter((t) => t !== "#" && t !== "E").length;
  let heights;
  let current = null;
  for (let tries = 0; tries < 300 && !current; tries += 1) {
    heights = Array.from({ length: open }, () => Math.floor(rand() * 4));
    current = evaluate(rows, heights, tier);
  }
  if (!current) return null;
  let best = { ...current, heights: heights.slice() };
  const kept = new Map(); // every distinct board that fit along the way
  for (let it = 0; it < iterations; it += 1) {
    if (deadline && Date.now() > deadline) break;
    const temperature = 3 * (1 - it / iterations) + 0.05;
    const next = heights.slice();
    const i = Math.floor(rand() * open);
    const op = rand();
    if (op < 0.6) next[i] = Math.max(0, Math.min(MAX_INITIAL, next[i] + (rand() < 0.5 ? -1 : 1)));
    else if (op < 0.85) next[i] = Math.floor(rand() * (MAX_INITIAL + 1));
    else {
      const j = Math.floor(rand() * open);
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (next.every((h, k) => h === heights[k])) continue;
    const result = evaluate(rows, next, tier);
    if (!result) continue;
    if (fits(result.a, tier)) kept.set(result.text, result);
    if (result.score >= current.score - temperature * Math.log(1 / Math.max(rand(), 1e-9)) * 0.3) {
      heights = next;
      current = result;
      if (result.score > best.score) best = { ...result, heights: next.slice() };
    }
  }
  return { best, kept };
}

function parseArgs(argv) {
  const args = { tier: "mid", shapes: "all", restarts: 3, iterations: 500, seed: 1, minutes: 0, out: "", list: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--list") {
      args.list = true;
      continue;
    }
    const key = argv[i].replace(/^--/, "");
    args[key] = ["tier", "shapes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
    i += 1;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const shapes = buildShapes();
  if (args.list) {
    shapes.forEach((s, i) => console.log(`${i} ${s.name}\n${s.rows.join("\n")}`));
    console.log(`${shapes.length} shapes`);
    return;
  }
  const tier = TIERS[args.tier];
  const chosen = args.shapes === "all" ? shapes.map((_, i) => i) : args.shapes.split(",").map(Number);
  const deadline = args.minutes ? Date.now() + args.minutes * 60000 : 0;
  let total = 0;
  for (const idx of chosen) {
    const shape = shapes[idx];
    for (let r = 0; r < args.restarts; r += 1) {
      if (deadline && Date.now() > deadline) return console.log(`done (time) ${total} kept`);
      const out = anneal(shape.rows, tier, mulberry32(args.seed * 7919 + r * 104729 + idx * 31), args.iterations, deadline);
      if (!out) continue;
      const b = out.best.a;
      console.log(`${shape.name} #${r}: best ${b.length}m ${b.pushes}p ${b.traps}t ${b.ways}w unused ${b.unused} rev ${b.revisit.toFixed(2)} score ${out.best.score.toFixed(1)}; ${out.kept.size} fit`);
      for (const item of out.kept.values()) {
        total += 1;
        console.log(`FOUND ${JSON.stringify({ shape: shape.name, tier: args.tier, text: item.text, a: item.a })}`);
      }
    }
  }
  console.log(`done ${total} kept`);
}

if (require.main === module) main();
module.exports = { buildShapes, TIERS, render };
