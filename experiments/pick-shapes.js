// Picks candidate levels from shape-levels.js logs and writes src/candidates.js.
//   node experiments/pick-shapes.js [--per-shape 2] [--out src/candidates.js] label=log1,log2 label=log3 ...
// Each label=logs argument names a shape and the logs its attempts are in. Boards
// are re-checked (decoys with tempting alcoves exempt, forced ends) and ranked by
// repeated squares and decoys, then spread across the solution lengths.
const fs = require("fs");
const path = require("path");
const { parseLevel, solve } = require("../src/engine.js");
const { faults, forcedRuns } = require("./tidy.js");
const { fits } = require("./make-levels.js");

const args = { perShape: 2, out: "", minMoves: 24, maxMoves: 46, minPushes: 6, maxPushes: 14, minTraps: 3, maxWays: 3, maxRevisit: 0.68, maxUnused: 3, maxDecoys: 3 };
const groups = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase());
    args[key] = key === "out" ? argv[i + 1] : Number(argv[i + 1]);
    i += 1;
  } else {
    const [label, files] = argv[i].split("=");
    groups.push({ label, files: files.split(",") });
  }
}

const picked = [];
for (const { label, files } of groups) {
  const seen = new Map();
  for (const file of files) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (line.startsWith("FOUND ")) {
        const item = JSON.parse(line.slice(6));
        seen.set(item.text, item);
      }
    }
  }
  const good = [];
  for (const item of seen.values()) {
    if (!fits(item.a, args)) continue;
    const level = parseLevel(item.text);
    const f = faults(item.text);
    const solution = solve(level, { maxStates: 200000 });
    if (!f || f.decoys > args.maxDecoys || solution.status !== "solved") continue;
    const runs = forcedRuns(level, solution.moves);
    if (runs.opening > 2 || runs.closing > 2) continue;
    good.push({ ...item, label, f, runs, solution: solution.moves });
  }
  // Fewer repeated squares and decoys first; then spread by length.
  good.sort((x, y) => x.a.revisit + 0.05 * x.f.decoys - (y.a.revisit + 0.05 * y.f.decoys));
  const top = good.slice(0, Math.max(args.perShape * 2, args.perShape));
  top.sort((x, y) => x.a.length - y.a.length);
  const chosen = [];
  for (let i = 0; i < Math.min(args.perShape, top.length); i += 1) chosen.push(top[Math.round((i * (top.length - 1)) / Math.max(1, Math.min(args.perShape, top.length) - 1))]);
  console.log(`${label}: ${seen.size} boards, ${good.length} qualify, picking ${new Set(chosen).size}`);
  for (const c of new Set(chosen)) picked.push(c);
}

const body = picked
  .map((c, i) => {
    const level = parseLevel(c.text);
    const info = `${c.label} ${level.height}x${level.width}, ${c.a.pushes} pushes, ${c.a.ways} way${c.a.ways === 1 ? "" : "s"}, ${c.a.traps} traps, ${c.a.length} moves, revisit ${c.a.revisit.toFixed(2)}, ${c.f.decoys} decoys, ${c.f.tempting} tempting`;
    console.log(`// ${info}\n${c.text}\n`);
    return `  {
    name: "Candidate ${i + 1}",
    info: "${info}",
    solution: "${c.solution}",
    text: \`
${c.text.split("\n").map((l) => "      " + l).join("\n")}\`,
  },`;
  })
  .join("\n");
if (args.out && picked.length) {
  const header = `// Candidate levels from experiments/shape-levels.js (picked by pick-shapes.js), for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
`;
  fs.writeFileSync(path.resolve(args.out), header + body + "\n];\n");
  console.log(`wrote ${args.out} (${picked.length})`);
}
