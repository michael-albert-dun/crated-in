// Exhaustive (up to a height cap) search for "equalise" levels where only a
// handful of piles start above height 0 -- the rest of a plain rectangle is
// flat already. This is the opposite of reverse-equalize.js: instead of
// constructing a board known to be solvable, it enumerates raw boards and
// asks the solver whether they happen to be, so it can also come back with
// "none of these are solvable" as a real, useful answer.
//
// For each pile count k (from --min-piles to --max-piles), it tries every
// combination of k cells, every height assignment (1..--max-height each), and
// every start cell, checking solve(level, { flatWin: true }). Reduced by the
// rectangle's 4-fold symmetry (identity, horizontal flip, vertical flip, 180
// rotation, exactly what a plain rectangle has -- no 90 degree rotation unless
// it's square) to cut the search ~4x: a configuration (heights + start cell)
// is only checked when it is the lexicographically smallest among its own
// symmetric images.
//
//   node experiments/sparse-equalize.js [--width 3] [--height 4] [--min-piles 1] [--max-piles 3]
//        [--max-height 6] [--max-states 5000] [--solve-max-height 0] [--minutes 0] [--progress 5000]
//
// --solve-max-height is the solver's own height cap (default: --max-height +
// 10). Important: a lot of sparse boards genuinely diverge (heights climb
// without bound while some cell stays permanently stranded at 0, once its
// neighbours have grown too tall to ever walk to or push from again -- see
// sparse-equalize-notes.md for the mechanism and a validated example). No
// finite cap can ever prove one of these "unsolvable"; it can only hit a cap
// and report "unknown", at whatever size the cap is. So keep both caps modest
// (the defaults are already tuned for this): raising them doesn't rescue a
// genuinely divergent board, it just makes checking it slower.
//
// Prints running counts per pile-count, and "FOUND {json}" for every solvable
// configuration (as level text, ready to paste into src/pool-equalize.js),
// so a long run can be left going and its log inspected afterward even if it
// self-stops (--minutes) before finishing.
const { makeLevel, solve } = require("../src/engine.js");
const { formatConstruction } = require("./reverse-equalize.js");

function parseArgs(argv) {
  const args = {
    width: 3, height: 4, minPiles: 1, maxPiles: 3, maxHeight: 6,
    maxStates: 5000, solveMaxHeight: 0, minutes: 0, progress: 5000,
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = Number(argv[i + 1]);
  }
  return args;
}

// maps[g][i] is where cell i goes under the rectangle's g-th symmetry.
function makeTransforms(width, height) {
  const fns = [
    (r, c) => [r, c],
    (r, c) => [r, width - 1 - c],
    (r, c) => [height - 1 - r, c],
    (r, c) => [height - 1 - r, width - 1 - c],
  ];
  return fns.map((fn) => {
    const map = new Int32Array(width * height);
    for (let r = 0; r < height; r += 1) {
      for (let c = 0; c < width; c += 1) {
        const [rr, cc] = fn(r, c);
        map[r * width + c] = rr * width + cc;
      }
    }
    return map;
  });
}

// True when (h, pos) is the lexicographically smallest among its own images
// under every symmetry (including the identity, so equal-to-itself passes).
function isCanonical(h, pos, maps) {
  const key0 = h.join(",") + "|" + pos;
  for (let g = 1; g < maps.length; g += 1) {
    const map = maps[g];
    const th = new Array(h.length);
    for (let i = 0; i < h.length; i += 1) th[map[i]] = h[i];
    if (th.join(",") + "|" + map[pos] < key0) return false;
  }
  return true;
}

function* combinations(n, k) {
  if (k === 0) { yield []; return; }
  const idx = Array.from({ length: k }, (_, i) => i);
  for (;;) {
    yield idx.slice();
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i -= 1;
    if (i < 0) return;
    idx[i] += 1;
    for (let j = i + 1; j < k; j += 1) idx[j] = idx[j - 1] + 1;
  }
}

function* heightAssignments(k, maxHeight) {
  if (k === 0) { yield []; return; }
  const a = new Array(k).fill(1);
  for (;;) {
    yield a.slice();
    let i = k - 1;
    while (i >= 0) {
      a[i] += 1;
      if (a[i] <= maxHeight) break;
      a[i] = 1;
      i -= 1;
    }
    if (i < 0) return;
  }
}

function run(args) {
  const { width, height, maxHeight, maxStates } = args;
  // See the file header: many "unknown" results are genuinely divergent, and
  // no cap size changes that -- so this only needs to be comfortably above
  // the piles' own starting cap, not maximised.
  const solveMaxHeight = args.solveMaxHeight || maxHeight + 10;
  const cells = width * height;
  const wall = new Uint8Array(cells); // a plain rectangle: no walls at all
  const maps = makeTransforms(width, height);
  const deadline = args.minutes ? Date.now() + args.minutes * 60000 : 0;
  const found = [];
  let stopped = false;

  for (let k = args.minPiles; k <= args.maxPiles && !stopped; k += 1) {
    let checked = 0;
    let canonical = 0;
    let solved = 0;
    let unsolvable = 0;
    let unknown = 0;
    console.log(`--- k=${k} (${width}x${height}, height 1-${maxHeight}) ---`);
    for (const combo of combinations(cells, k)) {
      if (stopped) break;
      for (const heights of heightAssignments(k, maxHeight)) {
        const h = new Int16Array(cells);
        combo.forEach((ci, i) => { h[ci] = heights[i]; });
        for (let pos = 0; pos < cells; pos += 1) {
          checked += 1;
          if (!isCanonical(h, pos, maps)) continue;
          canonical += 1;
          if (deadline && Date.now() > deadline) { stopped = true; break; }
          const level = makeLevel(width, height, wall, h, pos, -1, -1, -1, -1);
          const result = solve(level, { flatWin: true, maxHeight: solveMaxHeight, maxStates });
          if (result.status === "solved") {
            solved += 1;
            const text = formatConstruction(width, height, wall, h, pos);
            const entry = { k, text, moves: result.moves, pushes: result.pushes, length: result.moves.length };
            found.push(entry);
            console.log(`FOUND ${JSON.stringify(entry)}`);
          } else if (result.status === "unsolvable") unsolvable += 1;
          else unknown += 1;
          if (canonical % args.progress === 0) {
            console.log(`  ...${checked} checked (${canonical} canonical): ${solved} solved, ${unsolvable} unsolvable, ${unknown} unknown`);
          }
        }
        if (stopped) break;
      }
    }
    console.log(`k=${k} done: ${checked} checked (${canonical} canonical), ${solved} solved, ${unsolvable} unsolvable, ${unknown} unknown`);
    if (stopped) console.log(`(stopped early: --minutes budget reached)`);
  }
  console.log(`${found.length} solvable configuration(s) total`);
  return found;
}

if (require.main === module) run(parseArgs(process.argv.slice(2)));
module.exports = { run, parseArgs, makeTransforms, isCanonical, combinations, heightAssignments };
