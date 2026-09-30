// Level generator for the "equalise" win condition: instead of building a board
// and searching for whether it happens to be solvable (the approach everywhere
// else in this repo), it constructs one backward from the solved state itself,
// so every board it produces is solvable by construction.
//
// The solved state of this variant is simply "every non-wall cell at height 0"
// (isFlat, in engine.js): reflood already keeps the minimum non-wall height at
// 0 after every move, so "all equal" and "all flat" are the same thing. Start
// there, at a random open cell, and repeatedly apply one of two reverse moves:
//
//   - reverse-walk: step to a neighbour at most 1 different in height (walking
//     is its own inverse, since the gap rule is symmetric).
//   - reverse-unpush: pick a neighbouring pile, add back the layers reflooring
//     would have stripped after the push it undoes (0 or more, chosen so the
//     result stays non-negative), then undo the spread itself (+1 on the pile,
//     -1 on each of its neighbours, including the player's cell). Verified by
//     simulating the *forward* push from the candidate and checking it lands
//     back exactly on the state before -- see tryUnpush.
//
// Whatever's left after N reverse moves is the level's start (S). Because a
// solution of exactly N moves is known to exist, the only way a board can be
// worse than intended is a *shortcut*: run solve(level, { flatWin: true }) and
// reject unless its shortest solution is exactly N moves.
//
//   node experiments/reverse-equalize.js [--shapes all|name,name] [--attempts 300] [--seed 1]
//        [--min-steps 3] [--max-steps 8] [--min-pushes 1] [--max-pushes 6]
//        [--layer-max 2] [--walk-bias 0.35] [--out src/levels-test/pool-equalize.js] [--count 5]
//
// Shapes come from experiments/equalize-shapes.js (a separate, smaller set from
// shape-levels.js's SHAPES: these carry no entry/exit gate, since this variant
// picks its own start cell while constructing). Writes src/levels-test/pool-equalize.js
// (POOL_EQUALIZE, matching src/levels-test/pool.js's role for the exit-based game): review
// in pool-equalize.html, then copy anything worth keeping into
// src/levels/levels-equalize.js by hand.
const fs = require("fs");
const path = require("path");
const { makeLevel, parseLevel, step, solve } = require("../src/engine.js");
const { mulberry32 } = require("./random-levels.js");
const { SHAPES } = require("./equalize-shapes.js");

function parseShape(shape) {
  const rows = shape.map((row) => row.split(" "));
  const height = rows.length;
  const width = rows[0].length;
  const wall = new Uint8Array(width * height);
  rows.forEach((row, r) => {
    if (row.length !== width) throw new Error("Ragged shape row " + r);
    row.forEach((token, c) => {
      if (token === "#") wall[r * width + c] = 1;
      else if (token !== ".") throw new Error("Bad shape cell " + JSON.stringify(token));
    });
  });
  return { width, height, wall };
}

function shuffled(list, rand) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function formatConstruction(width, height, wall, h, pos) {
  const lines = [];
  for (let r = 0; r < height; r += 1) {
    const cells = [];
    for (let c = 0; c < width; c += 1) {
      const i = r * width + c;
      cells.push(wall[i] ? "#" : String(h[i]) + (i === pos ? "S" : ""));
    }
    lines.push(cells.join("  "));
  }
  return lines.join("\n");
}

// One reverse-construction attempt on `shape`, or null if it got stuck too
// early or didn't fit the requested window.
function attempt(shape, args, rand) {
  const { width, height, wall } = parseShape(shape);
  const cells = width * height;
  const open = [];
  for (let i = 0; i < cells; i += 1) if (!wall[i]) open.push(i);
  if (open.length < 2) return null;

  let pos = pick(open, rand);
  let h = new Int16Array(cells); // the solved state: flat.
  // start/target/exit don't matter for the neighbour table; -1 for the latter
  // two leaves this level with no "reach a cell" win condition of its own,
  // which is exactly what a flat-win level (isFlat) is.
  const level = makeLevel(width, height, wall, h, pos, -1, -1, -1, -1);
  const { nbrs } = level;

  function tryWalk() {
    for (const d of shuffled([0, 1, 2, 3], rand)) {
      const n = nbrs[pos][d];
      if (n < 0) continue;
      if (Math.abs(h[n] - h[pos]) > 1) continue;
      pos = n;
      return true;
    }
    return false;
  }

  function tryUnpush() {
    for (const d of shuffled([0, 1, 2, 3], rand)) {
      const at = nbrs[pos][d];
      if (at < 0) continue;
      const atNbrs = nbrs[at].filter((n) => n >= 0);
      for (let k = 0; k <= args.layerMax; k += 1) {
        const cand = Int16Array.from(h);
        for (let i = 0; i < cells; i += 1) if (!wall[i]) cand[i] += k;
        cand[at] += 1;
        let ok = true;
        for (const n of atNbrs) {
          cand[n] -= 1;
          if (cand[n] < 0) { ok = false; break; }
        }
        if (!ok) continue;
        // The real check: does pushing forward from this candidate reproduce
        // exactly the state we started from? (Single spread, matching the play
        // UI's default -- not the justEnough variant.)
        const out = step(level, { h: cand, pos }, d, {});
        if (out.result === "pushed" && out.spreads === 1 && out.state.pos === pos && arraysEqual(out.state.h, h)) {
          h = cand;
          pushCount += 1;
          return true;
        }
      }
    }
    return false;
  }

  const totalSteps = args.minSteps + Math.floor(rand() * (args.maxSteps - args.minSteps + 1));
  let pushCount = 0;
  let stepsDone = 0;
  for (; stepsDone < totalSteps; stepsDone += 1) {
    const walkFirst = rand() < args.walkBias;
    const first = walkFirst ? tryWalk : tryUnpush;
    const second = walkFirst ? tryUnpush : tryWalk;
    if (!first() && !second()) break; // stuck: fewer steps than planned
  }
  if (stepsDone < args.minSteps || pushCount < args.minPushes || pushCount > args.maxPushes) return null;

  const text = formatConstruction(width, height, wall, h, pos);
  let checked;
  try {
    checked = parseLevel(text);
  } catch {
    return null;
  }
  const result = solve(checked, { flatWin: true, maxHeight: 12, maxStates: args.maxStates });
  if (result.status !== "solved" || result.moves.length < stepsDone) return null; // a shortcut exists
  return { text, moves: result.moves, pushes: result.pushes, length: result.moves.length, width, height };
}

function parseArgs(argv) {
  const args = {
    shapes: "all", attempts: 300, seed: 1, minSteps: 3, maxSteps: 8, minPushes: 1, maxPushes: 6,
    layerMax: 2, walkBias: 0.35, maxStates: 200000, count: 5, out: "src/levels-test/pool-equalize.js",
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "").replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    args[key] = ["shapes", "out"].includes(key) ? argv[i + 1] : Number(argv[i + 1]);
  }
  return args;
}

// Picks `count` boards spread across the length window and writes them to
// src/levels-test/pool-equalize.js (POOL_EQUALIZE), the same way make-levels.js spreads
// picks for src/levels-test/pool.js.
function finish(all, args) {
  if (!all.length) {
    console.log("nothing to write");
    return;
  }
  const unique = [...new Map(all.map((c) => [c.text, c])).values()];
  unique.sort((x, y) => x.length - y.length);
  const n = Math.min(args.count, unique.length);
  const picks = [];
  for (let i = 0; i < n; i += 1) {
    picks.push(unique[Math.round((i * (unique.length - 1)) / Math.max(1, n - 1))]);
  }
  const chosen = [...new Set(picks)];
  const body = chosen
    .map((c, i) => {
      const info = `${c.width}x${c.height}, ${c.pushes} push${c.pushes === 1 ? "" : "es"}, ${c.length} moves to flatten`;
      console.log(`// ${info}\n${c.text}\n`);
      return `  {
    name: "Option ${i + 1}",
    info: "${info}",
    solution: "${c.moves}",
    text: \`
${c.text.split("\n").map((l) => "      " + l).join("\n")}\`,
  },`;
    })
    .join("\n");
  writeOut(args.out, chosen.length, body);
}

function writeOut(out, count, body) {
  if (!out || !count) return;
  const header = `// A throwaway batch of "equalise" levels to look at and choose between (see
// pool-equalize.html and experiments/reverse-equalize.js). Ephemeral by design:
// the whole file gets overwritten with a fresh POOL_EQUALIZE every time there's
// a new batch to show. Once a choice is made, copy the entry into
// src/levels/levels-equalize.js by hand and forget this file until the next batch.
const POOL_EQUALIZE = [
`;
  fs.writeFileSync(path.resolve(out), header + body + "\n];\n");
  console.log(`wrote ${out} (POOL_EQUALIZE, ${count} entries)`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const names = args.shapes === "all" ? Object.keys(SHAPES) : args.shapes.split(",");
  const found = [];
  let tries = 0;
  for (let i = 0; i < args.attempts; i += 1) {
    const name = names[i % names.length];
    const rand = mulberry32(args.seed * 7919 + i * 104729 + name.length);
    const res = attempt(SHAPES[name], args, rand);
    tries += 1;
    if (!res) continue;
    console.log(`${name} #${i}: KEEP ${res.length}m ${res.pushes}p`);
    console.log(`FOUND ${JSON.stringify({ name, ...res })}`);
    found.push(res);
  }
  console.log(`${tries} attempts, ${found.length} kept`);
  finish(found, args);
}

if (require.main === module) main();
module.exports = { attempt, parseShape, formatConstruction, finish, writeOut };
