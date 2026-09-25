// Playability experiment: how often are random boards solvable, and how much
// do solutions need pushes? Compares the single-spread push with the
// "just enough" variant on the same boards.
//
//   node experiments/explore.js [--sizes 5x5,6x6,7x7] [--count 200] [--seed 1]
//                               [--wall 0.1] [--max-states 200000] [--show 2]
//
// Solver outcomes: solved / unsolvable (search space exhausted) / unknown (hit
// the state or height cap first, so possibly solvable).
const { formatLevel, createState, solve } = require("../src/engine.js");
const { mulberry32, randomLevel } = require("./random-levels.js");

function parseArgs(argv) {
  const args = { sizes: "5x5,6x6,7x7", count: 200, seed: 1, wall: 0.1, maxStates: 200000, show: 2 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = key === "sizes" ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

function summarise(label, results, show) {
  const solved = results.filter((r) => r.out.status === "solved");
  const count = (status) => results.filter((r) => r.out.status === status).length;
  const pct = (n) => ((100 * n) / results.length).toFixed(1) + "%";
  const needPush = solved.filter((r) => r.out.pushes > 0);
  const mean = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "-");
  const lengths = solved.map((r) => r.out.moves.length).sort((a, b) => a - b);
  console.log(`  ${label}`);
  console.log(
    `    solved ${pct(solved.length)}  unsolvable ${pct(count("unsolvable"))}  unknown ${pct(count("unknown"))}`,
  );
  console.log(
    `    of solved: need a push ${pct(needPush.length)} of all boards; mean length ${mean(lengths)}` +
      `, median ${lengths[Math.floor(lengths.length / 2)] ?? "-"}, max ${lengths[lengths.length - 1] ?? "-"}` +
      `; mean pushes when needed ${mean(needPush.map((r) => r.out.pushes))}`,
  );
  console.log(`    mean states explored ${mean(results.map((r) => r.out.states))}`);
  const hardest = [...needPush].sort((a, b) => b.out.moves.length - a.out.moves.length).slice(0, show);
  for (const { level, out } of hardest) {
    console.log(`    longest: ${out.moves.length} moves, ${out.pushes} pushes: ${out.moves}`);
    console.log(formatLevel(level, createState(level)).replace(/^/gm, "      "));
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const size of args.sizes.split(",")) {
    const [width, height] = size.split("x").map(Number);
    const rand = mulberry32(args.seed);
    const levels = [];
    while (levels.length < args.count) {
      const level = randomLevel(width, height, args.wall, rand);
      if (level) levels.push(level);
    }
    console.log(`${size}, ${args.count} boards, walls ${args.wall}, seed ${args.seed}`);
    for (const justEnough of [false, true]) {
      const results = levels.map((level) => ({
        level,
        out: solve(level, { justEnough, maxStates: args.maxStates }),
      }));
      summarise(justEnough ? "just-enough push" : "single-spread push", results, args.show);
    }
  }
}

main();
