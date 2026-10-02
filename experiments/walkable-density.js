// How hard is the "make every cell walkable" goal (engine.isWalkable) under
// line push, on plain rectangular rooms with no exit and no pillars? Random
// crate heights, start in the lower left, each board analysed exhaustively
// (analyse.js with walkWin). Prints, per shape and height mix, how many boards
// are already won, can't be won, or were too big to judge, plus the
// distribution of shortest solution length, pushes, traps and number of
// shortest solutions for the rest. Answers whether plain rejection sampling is
// enough or the generator needs annealing.
//
//   node experiments/walkable-density.js [--boards 1000] [--seed 1] [--shapes 4x4,5x4]
//        [--mix low|flat|both] [--max-height 6] [--max-states 100000] [--no-line-push]
const { makeLevel } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { analyse } = require("./analyse.js");

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : fallback;
};
const BOARDS = Number(opt("boards", 1000));
const SEED = Number(opt("seed", 1));
const SHAPES = opt("shapes", "4x4,5x4,5x5").split(",").map((s) => s.split("x").map(Number));
const MIXES = { low: [0.35, 0.3, 0.2, 0.1, 0.05], flat: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6] };
const mixNames = opt("mix", "both") === "both" ? Object.keys(MIXES) : [opt("mix", "both")];
const MAX_HEIGHT = Number(opt("max-height", 6));
const MAX_STATES = Number(opt("max-states", 100000));
const LINE_PUSH = !args.includes("--no-line-push");

function pickHeight(rand, weights) {
  let x = rand();
  for (let h = 0; h < weights.length; h += 1) {
    x -= weights[h];
    if (x < 0) return h;
  }
  return weights.length - 1;
}

function quantiles(values) {
  if (!values.length) return "-";
  const v = [...values].sort((a, b) => a - b);
  const at = (q) => v[Math.min(v.length - 1, Math.floor(q * v.length))];
  return `min ${v[0]}  p25 ${at(0.25)}  median ${at(0.5)}  p75 ${at(0.75)}  p95 ${at(0.95)}  max ${v[v.length - 1]}`;
}

for (const [w, h] of SHAPES) {
  for (const mix of mixNames) {
    const rand = mulberry32(SEED * 1009 + w * 31 + h);
    const tally = { already: 0, unsolvable: 0, unknown: 0, solved: 0 };
    const length = [];
    const pushes = [];
    const traps = [];
    const ways = [];
    const dead = [];
    const started = Date.now();
    for (let b = 0; b < BOARDS; b += 1) {
      const heights = new Int16Array(w * h);
      for (let i = 0; i < heights.length; i += 1) heights[i] = pickHeight(rand, MIXES[mix]);
      const level = makeLevel(w, h, new Uint8Array(w * h), heights, (h - 1) * w, -1);
      const a = analyse(level, { linePush: LINE_PUSH, walkWin: true, maxHeight: MAX_HEIGHT, maxStates: MAX_STATES });
      if (a === null) tally.unknown += 1;
      else if (a.alreadyWon) tally.already += 1;
      else if (!a.solvable) tally.unsolvable += 1;
      else {
        tally.solved += 1;
        length.push(a.length);
        pushes.push(a.pushes);
        traps.push(a.traps);
        ways.push(a.ways);
        dead.push(Math.round(a.deadFraction * 100));
      }
    }
    const pct = (n) => ((100 * n) / BOARDS).toFixed(1) + "%";
    console.log(`\n== ${w}x${h}, ${mix} heights, ${BOARDS} boards, ${((Date.now() - started) / 1000).toFixed(1)}s`);
    console.log(`already walkable ${pct(tally.already)}  solvable ${pct(tally.solved)}  unsolvable ${pct(tally.unsolvable)}  too big ${pct(tally.unknown)}`);
    console.log("moves      ", quantiles(length));
    console.log("pushes     ", quantiles(pushes));
    console.log("traps      ", quantiles(traps));
    console.log("ways       ", quantiles(ways));
    console.log("dead states", quantiles(dead), "(% of reachable states that can no longer win)");
  }
}
