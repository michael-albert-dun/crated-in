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
const { makeLevel, outerWalls, exitDirs, gateKey, formatLevel, createState, solve } = require("../src/engine.js");
const { mulberry32, randomLevel } = require("./random-levels.js");

const MAX_CELL_HEIGHT = 5;

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

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

function mutate(level, rand) {
  const wall = Uint8Array.from(level.wall);
  const heights = Int16Array.from(createState(level).h);
  let { start, target, exitDir, startDir } = level;
  const cells = wall.length;
  const i = Math.floor(rand() * cells);
  const op = rand();
  if (op < 0.55) {
    if (wall[i]) return null;
    heights[i] = Math.max(0, Math.min(MAX_CELL_HEIGHT, heights[i] + (rand() < 0.5 ? -1 : 1)));
  } else if (op < 0.7) {
    if (i === start || i === target) return null;
    wall[i] = wall[i] ? 0 : 1;
  } else if (op < 0.8) {
    if (wall[i] || i === target) return null;
    start = i;
    startDir = -1;
  } else if (op < 0.95) {
    if (wall[i] || i === start) return null;
    target = i;
    exitDir = -1;
  } else {
    // Same cells, different side of a gap (if there is another).
    if (rand() < 0.5) exitDir = -1;
    else startDir = -1;
  }
  // Walls may have cut a tunnel to the outside, or a gate cell may have moved:
  // keep each gate if it's still valid, otherwise pick a valid side or reject
  // the mutation. The two gates must not share a gap.
  const outer = outerWalls(level.width, level.height, wall);
  const fix = (cell, dir) => {
    const dirs = exitDirs(level.width, level.height, wall, cell, outer);
    if (!dirs.length) return -1;
    return dirs.includes(dir) ? dir : pick(dirs, rand);
  };
  exitDir = fix(target, exitDir);
  startDir = fix(start, startDir);
  if (exitDir < 0 || startDir < 0) return null;
  if (gateKey(level.width, start, startDir) === gateKey(level.width, target, exitDir)) return null;
  return makeLevel(level.width, level.height, wall, heights, start, target, exitDir, startDir);
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
    const candidate = mutate(level, rand);
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
