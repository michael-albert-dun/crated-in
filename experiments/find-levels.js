// Level finder: hill-climbs random boards on the whole-level analysis of
// analyse.js, rather than on solution length alone (which drifts into long
// grinding solutions). It rewards
//   - traps: moves along the solution that lead somewhere you can't escape from,
//   - pushes and distinct piles pushed,
// and penalises many equally short solutions, shuffling back and forth, length, and
// the share of cells the solution never touches (an irrelevant corner). Boards
// with open cells walled off from the start are rejected outright. A board must need pushes (walking alone can't reach the exit).
//
//   node experiments/find-levels.js [--sizes 5x5,6x6] [--boards 3] [--iterations 250]
//        [--seed 1] [--wall 0.1] [--min-pushes 4] [--max-length 45] [--max-ways 4]
//        [--max-initial 5] [--max-unused 0.35] [--max-states 60000] [--out src/candidates.js]
//
// Initial heights never exceed --max-initial (pushes can build higher in play;
// the analysis ignores states with a pile above 6). With --out, accepted boards
// are written as CANDIDATES for the test UI, which lists them after the levels.
const fs = require("fs");
const path = require("path");
const { formatLevel, createState, solve } = require("../src/engine.js");
const { mulberry32, randomLevel, mutate } = require("./random-levels.js");
const { analyse } = require("./analyse.js");

function parseArgs(argv) {
  const args = {
    sizes: "5x5", boards: 3, iterations: 250, seed: 1, wall: 0.1, minPushes: 4,
    maxLength: 45, maxWays: 4, maxInitial: 5, maxUnused: 0.35, maxStates: 60000, out: "",
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = ["sizes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

function rate(level, args) {
  const a = analyse(level, { maxStates: args.maxStates });
  if (!a || !a.solvable || a.walkable || a.disconnected > 0 || a.length > args.maxLength) return null;
  const score =
    2 * a.traps + 1.5 * a.pushes + a.pushCells - 3 * Math.log2(a.ways) - 40 * Math.max(0, a.revisit - 0.45) - 0.2 * a.length - 40 * (a.unused / a.openCells);
  return { a, score };
}

function climb(width, height, args, rand) {
  let level = null;
  let current = null;
  for (let tries = 0; tries < 300 && !current; tries += 1) {
    level = randomLevel(width, height, args.wall, rand);
    current = level && rate(level, args);
  }
  if (!current) return null;
  for (let it = 0; it < args.iterations; it += 1) {
    const candidate = mutate(level, rand, args.maxInitial);
    if (!candidate) continue;
    const result = rate(candidate, args);
    if (result && result.score >= current.score) {
      level = candidate;
      current = result;
    }
  }
  return { level, ...current };
}

function accept(a, args) {
  return a.pushes >= args.minPushes && a.ways <= args.maxWays && a.unused / a.openCells <= args.maxUnused;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rand = mulberry32(args.seed);
  const found = [];
  for (const size of args.sizes.split(",")) {
    const [width, height] = size.split("x").map(Number);
    let got = 0;
    for (let attempts = 0; got < args.boards && attempts < args.boards * 6; attempts += 1) {
      const best = climb(width, height, args, rand);
      if (!best || !accept(best.a, args)) continue;
      got += 1;
      const solution = solve(best.level, { maxStates: 400000 });
      const a = best.a;
      const info = `${size}, ${a.pushes} pushes, ${a.ways} way${a.ways === 1 ? "" : "s"}, ${a.traps} traps, ${Math.round((100 * a.unused) / a.openCells)}% unused`;
      console.log(`// ${info}, ${a.length} moves, revisit ${a.revisit.toFixed(2)}, score ${best.score.toFixed(1)}`);
      console.log(formatLevel(best.level, createState(best.level)));
      console.log();
      found.push({ info, solution: solution.moves, text: formatLevel(best.level, createState(best.level)) });
    }
  }
  console.log(`// ${found.length} candidates (seed ${args.seed})`);
  if (args.out && found.length) {
    const body = found
      .map(
        (c, i) => `  {
    name: "Candidate ${i + 1}",
    info: "${c.info}",
    solution: "${c.solution}",
    text: \`
${c.text.split("\n").map((l) => "      " + l).join("\n")}\`,
  },`,
      )
      .join("\n");
    const header = `// Candidate levels from experiments/find-levels.js, for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
`;
    fs.writeFileSync(path.resolve(args.out), header + body + "\n];\n");
    console.log(`wrote ${args.out}`);
  }
}

main();
