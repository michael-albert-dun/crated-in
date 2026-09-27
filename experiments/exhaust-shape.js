// Exhaustive search of a small shape: every assignment of heights 0..max to its
// open cells, solved, keeping the boards whose shortest solution is longest.
// For shapes small enough (9 cells at max height 5 is about 10 million boards)
// this answers "how interesting can this shape get?" with no luck involved.
//
//   node experiments/exhaust-shape.js --shape diag4 [--max-height 5] [--part 0 --parts 1]
//        [--keep 40] [--min-moves 18]
// Prints the best boards as "BEST {json}" lines (text, moves, pushes), which can be
// merged from several --part runs and re-scored with analyse.js.
const { parseLevel, solve } = require("../src/engine.js");
const { SHAPES: BASE_SHAPES, render } = require("./shape-levels.js");
const { SHAPES: CROSS_SHAPES } = require("./cross-shapes.js");
const { SHAPES: INTERIOR_SHAPES } = require("./interior-shapes.js");
const SHAPES = { ...BASE_SHAPES, ...CROSS_SHAPES, ...INTERIOR_SHAPES };

const args = { shape: "diag4", maxHeight: 5, part: 0, parts: 1, keep: 40, minMoves: 18 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
  args[key] = key === "shape" ? argv[i + 1] : Number(argv[i + 1]);
}
const shape = SHAPES[args.shape];
const open = shape.join(" ").split(" ").filter((t) => t !== "#" && t !== "E").length;
const level = parseLevel(render(shape, Array(open).fill(0)));
const cells = [];
level.wall.forEach((w, i) => {
  if (!w) cells.push(i);
});
const base = args.maxHeight + 1;
const total = base ** open;
const best = [];
let worst = args.minMoves;
const t0 = Date.now();
for (let n = args.part; n < total; n += args.parts) {
  let x = n;
  for (let k = 0; k < open; k += 1) {
    level.initialHeights[cells[k]] = x % base;
    x = Math.floor(x / base);
  }
  const out = solve(level, { maxStates: 4000 });
  if (out.status !== "solved" || out.moves.length < worst) continue;
  best.push({ moves: out.moves.length, pushes: out.pushes, heights: cells.map((c) => level.initialHeights[c]) });
  if (best.length > args.keep * 4) {
    best.sort((a, b) => b.moves - a.moves || b.pushes - a.pushes);
    best.length = args.keep;
    worst = best[best.length - 1].moves;
  }
}
best.sort((a, b) => b.moves - a.moves || b.pushes - a.pushes);
best.length = Math.min(best.length, args.keep);
for (const b of best) console.log(`BEST ${JSON.stringify({ moves: b.moves, pushes: b.pushes, text: render(shape, b.heights) })}`);
console.error(`part ${args.part}/${args.parts}: ${total / args.parts} boards in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
