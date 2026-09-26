// Generator for interesting boards: random start, then hill-climbing on
// single-cell mutations to make the shortest solution longer and push-heavier.
//
//   node experiments/generate.js [--size 5x5] [--boards 5] [--iterations 1500]
//                                [--min-pushes 4] [--seed 1] [--wall 0.1]
//                                [--max-states 60000] [--just-enough 0]
//
// A board is only accepted if
//   - it is solvable (with the state and height caps of solve()),
//   - walking alone can't reach the target (so pushes are compulsory, not just
//     a shortcut past a route you could walk), and
//   - the shortest solution has at least --min-pushes pushes.
// The score is moves + 2 * pushes. Sideways moves are accepted so the search
// can drift across plateaus. Output is in levels.js format.
const { formatLevel, createState, solve } = require("../src/engine.js");
const { mulberry32, randomLevel, mutate } = require("./random-levels.js");

function parseArgs(argv) {
  const args = { size: "5x5", boards: 5, iterations: 1500, minPushes: 4, seed: 1, wall: 0.1, maxStates: 60000, justEnough: 0 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = key === "size" ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

function evaluate(level, args) {
  const opts = { justEnough: Boolean(args.justEnough), maxStates: args.maxStates };
  const out = solve(level, opts);
  if (out.status !== "solved") return null;
  if (solve(level, { ...opts, noPushes: true }).status === "solved") return null;
  return { out, score: out.moves.length + 2 * out.pushes };
}

function climb(width, height, args, rand) {
  let level = null;
  let current = null;
  for (let tries = 0; tries < 200 && !current; tries += 1) {
    level = randomLevel(width, height, args.wall, rand);
    current = level && evaluate(level, args);
  }
  if (!current) return null;
  for (let it = 0; it < args.iterations; it += 1) {
    const candidate = mutate(level, rand, 5);
    if (!candidate) continue;
    const result = evaluate(candidate, args);
    if (result && result.score >= current.score) {
      level = candidate;
      current = result;
    }
  }
  return { level, ...current };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [width, height] = args.size.split("x").map(Number);
  const rand = mulberry32(args.seed);
  let found = 0;
  let attempts = 0;
  while (found < args.boards && attempts < args.boards * 20) {
    attempts += 1;
    const best = climb(width, height, args, rand);
    if (!best || best.out.pushes < args.minPushes) continue;
    found += 1;
    console.log(`// ${args.size}, ${best.out.moves.length} moves, ${best.out.pushes} pushes, ${best.out.states} states: ${best.out.moves}`);
    console.log(formatLevel(best.level, createState(best.level)));
    console.log();
  }
  console.log(`// ${found} boards from ${attempts} climbs (seed ${args.seed})`);
}

main();
