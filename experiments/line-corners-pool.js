// Merges the logs of experiments/line-corners.js, re-verifies every candidate
// with the full solver (height cap 9, so no shortcut the annealer's cheaper cap
// of 6 missed), picks a spread across the difficulty range and writes it to
// src/levels-test/pool.js for pool.html.
//
//   node experiments/line-corners-pool.js <log files...> [--count 15] [--per-shape 2] [--out src/levels-test/pool.js]
const fs = require("fs");
const path = require("path");
const { parseLevel, solve } = require("../src/engine.js");
const { analyse } = require("./analyse.js");

const argv = process.argv.slice(2);
const files = [];
const args = { count: 15, perShape: 2, out: path.join(__dirname, "../src/levels-test/pool.js") };
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2).replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = key === "out" ? argv[i + 1] : Number(argv[i + 1]);
    i += 1;
  } else files.push(argv[i]);
}

const existing = new Set();
const lp = fs.readFileSync(path.join(__dirname, "../src/levels/levels-linepush.js"), "utf8");
for (const m of lp.matchAll(/text: `([^`]*)`/g)) existing.add(m[1].trim().split("\n").map((l) => l.trim().split(/\s+/).join(" ")).join("|"));

const seen = new Map();
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith("FOUND ")) continue;
    const item = JSON.parse(line.slice(6));
    seen.set(item.text, item);
  }
}
console.log(`${seen.size} distinct boards in ${files.length} logs`);

// The room mirrored in the lower-left/upper-right diagonal plays identically
// (square rooms); keep one of each pair.
function mirrorKey(text) {
  const rows = text.trim().split("\n").map((l) => l.trim().split(/\s+/));
  const h = rows.length;
  const w = rows[0].length;
  if (w !== h) return text;
  const out = [];
  for (let r = 0; r < h; r += 1) out.push(Array.from({ length: w }, (_, c) => rows[h - 1 - c][h - 1 - r]).join("  "));
  return out.join("\n");
}

const verified = [];
const dupes = new Set();
for (const item of seen.values()) {
  const mk = mirrorKey(item.text);
  if (dupes.has(item.text) || dupes.has(mk)) continue;
  dupes.add(item.text);
  const level = parseLevel(item.text);
  const solution = solve(level, { linePush: true, maxHeight: 9, maxStates: 300000 });
  if (solution.status !== "solved" || solution.moves.length !== item.a.length || solution.pushes !== item.a.pushes) continue;
  const a = analyse(level, { linePush: true, maxHeight: 9, maxStates: 300000 });
  if (!a || a.length !== solution.moves.length || a.ways > 3 || a.unused > 1) continue;
  if (existing.has(item.text.trim().split("\n").map((l) => l.trim().split(/\s+/).join(" ")).join("|"))) continue;
  verified.push({ ...item, a, solution: solution.moves, interest: 3 * Math.min(a.traps, 8) + a.pushCells - 3 * Math.log2(a.ways) - 4 * a.unused - 20 * Math.max(0, a.revisit - 0.55) });
}
console.log(`${verified.length} verified at the full height cap`);

// Pick across the difficulty range: sort by a simple difficulty (moves and pushes),
// cut into `count` bins, and take the most interesting board of each bin that
// doesn't overuse one shape.
verified.sort((x, y) => x.a.length + 2 * x.a.pushes - (y.a.length + 2 * y.a.pushes));
const picked = [];
const perShape = new Map();
const bins = args.count;
for (let b = 0; b < bins; b += 1) {
  const lo = Math.floor((b * verified.length) / bins);
  const hi = Math.floor(((b + 1) * verified.length) / bins);
  const pool = verified.slice(lo, hi).filter((v) => (perShape.get(v.shape) || 0) < args.perShape).sort((x, y) => y.interest - x.interest);
  if (!pool.length) continue;
  picked.push(pool[0]);
  perShape.set(pool[0].shape, (perShape.get(pool[0].shape) || 0) + 1);
}
picked.sort((x, y) => x.a.length + 2 * x.a.pushes - (y.a.length + 2 * y.a.pushes));

const entries = picked.map((v, i) => {
  const a = v.a;
  const rows = v.text.split("\n").map((r) => `      ${r.trim()}`).join("\n");
  return `  {
    name: "Pool ${i + 1}",
    info: "${v.shape}, ${a.length} moves, ${a.pushes} pushes, ${a.traps} traps, ${a.ways} way${a.ways === 1 ? "" : "s"}, ${v.tier}-tier",
    solution: "${v.solution}",
    text: \`
${rows}\`,
  },`;
}).join("\n");

const header = `// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/levels-test/candidates.js was starting to. Once a choice is made,
// whatever's here can be discarded; nothing else in the game refers to it.
// See pool.html.
//
// Current batch (${new Date().toISOString().slice(0, 10)}): candidate line-push ("Three in a Row") rooms from
// experiments/line-corners.js, rectangular rooms with the start in the lower
// left and the exit in the upper right, ordered roughly easiest to hardest
// (line-push Level 9, the current hardest, is 22 moves / 8 pushes / 4 traps).
// Play with the "Line push" option on (pool.html now turns it on at load).
// Solutions are proven shortest under linePush at the solver's height cap of 9.
`;
fs.writeFileSync(args.out, `${header}const POOL = [\n${entries}\n];\n`);
console.log(`wrote ${picked.length} levels to ${args.out}`);
for (const v of picked) console.log(`${v.shape.padEnd(22)} ${v.a.length}m ${v.a.pushes}p ${v.a.traps}t ${v.a.ways}w ${v.tier}`);
