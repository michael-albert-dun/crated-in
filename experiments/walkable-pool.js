// Merges the logs of experiments/walkable-corners.js, re-verifies every board
// with the full solver (height cap 9, so no shortcut the annealer's cap of 6
// missed), drops symmetric duplicates and picks a spread across the difficulty
// range. Prints the picks (and writes them as a POOL array in level text format
// with --out, ready for a pool page once the game can play this goal).
//
//   node experiments/walkable-pool.js <log files...> [--count 15] [--per-size 6] [--out picks.js]
const fs = require("fs");
const { parseLevel, solve } = require("../src/engine.js");
const { analyse } = require("./analyse.js");
const { canonical } = require("./walkable-corners.js");

const argv = process.argv.slice(2);
const files = [];
const args = { count: 15, perSize: 6, out: "" };
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2).replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = key === "out" ? argv[i + 1] : Number(argv[i + 1]);
    i += 1;
  } else files.push(argv[i]);
}

const seen = new Map();
for (const file of files) {
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith("FOUND ")) continue;
    const item = JSON.parse(line.slice(6));
    seen.set(canonical(item.text), item);
  }
}
console.log(`${seen.size} distinct boards (up to symmetry) in ${files.length} logs`);

const verified = [];
for (const item of seen.values()) {
  const level = parseLevel(item.text);
  const solution = solve(level, { linePush: true, walkWin: true, maxHeight: 9, maxStates: 300000 });
  if (solution.status !== "solved" || solution.moves.length !== item.a.length || solution.pushes !== item.a.pushes) continue;
  const a = analyse(level, { linePush: true, walkWin: true, maxHeight: 9, maxStates: 300000 });
  if (!a || a.length !== solution.moves.length || a.ways > 4 || a.unused > 2) continue;
  verified.push({ ...item, a, solution: solution.moves, interest: 3 * Math.min(a.traps, 8) + a.pushCells - 2 * Math.log2(a.ways) - 4 * a.unused - 20 * Math.max(0, a.revisit - 0.55) });
}
console.log(`${verified.length} verified at the full height cap`);

const difficulty = (v) => v.a.length + 2 * v.a.pushes;
verified.sort((x, y) => difficulty(x) - difficulty(y));
// Annealing runs tend to leave families of boards that differ in one or two
// crates; a pick must differ from every earlier pick of its size in at least
// MIN_DIFF cells (under the rectangle's symmetries, via the same flips).
const MIN_DIFF = 5;
const cellsOf = (text) => text.trim().split(/\s+/).map((t) => t.replace("S", "") + (t.includes("S") ? "S" : ""));
function similar(a, b) {
  if (a.shape !== b.shape) return false;
  const [w, h] = a.shape.split("x").map(Number);
  const x = cellsOf(a.text);
  const flips = [(r, c) => r * w + c, (r, c) => r * w + (w - 1 - c), (r, c) => (h - 1 - r) * w + c, (r, c) => (h - 1 - r) * w + (w - 1 - c)];
  return flips.some((f) => {
    let diff = 0;
    const y = cellsOf(b.text);
    for (let r = 0; r < h; r += 1) for (let c = 0; c < w; c += 1) if (x[r * w + c] !== y[f(r, c)]) diff += 1;
    return diff < MIN_DIFF;
  });
}
const picked = [];
const perSize = new Map();
for (let b = 0; b < args.count; b += 1) {
  const lo = Math.floor((b * verified.length) / args.count);
  const hi = Math.floor(((b + 1) * verified.length) / args.count);
  const bin = verified.slice(lo, hi).filter((v) => (perSize.get(v.shape) || 0) < args.perSize && !picked.some((p) => similar(p, v))).sort((x, y) => y.interest - x.interest);
  if (!bin.length) continue;
  picked.push(bin[0]);
  perSize.set(bin[0].shape, (perSize.get(bin[0].shape) || 0) + 1);
}

picked.forEach((v, i) => {
  const a = v.a;
  console.log(`\n#${i + 1} ${v.shape} ${a.length}m ${a.pushes}p ${a.traps}t ${a.ways}w dead ${(a.deadFraction * 100).toFixed(0)}% unused ${a.unused}  ${v.solution}`);
  console.log(v.text.split("\n").map((r) => "  " + r).join("\n"));
});
if (args.out) {
  const entries = picked.map((v, i) => `  {
    name: "Walk ${i + 1}",
    info: "${v.shape}, ${v.a.length} moves, ${v.a.pushes} pushes, ${v.a.traps} traps, ${v.a.ways} way${v.a.ways === 1 ? "" : "s"}, ${v.tier}-tier",
    solution: "${v.solution}",
    text: \`
${v.text.split("\n").map((r) => `      ${r.trim()}`).join("\n")}\`,
  },`).join("\n");
  fs.writeFileSync(args.out, `// Walkable-goal candidates from experiments/walkable-corners.js (${new Date().toISOString().slice(0, 10)}).\nconst POOL = [\n${entries}\n];\n`);
  console.log(`\nwrote ${picked.length} boards to ${args.out}`);
}
