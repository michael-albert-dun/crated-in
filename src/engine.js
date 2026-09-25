// DOM-free rules engine for the box-manipulation puzzle "Crated In".
//
// A level is static (size, walls, target, neighbour table). A state is
// { h, pos }: h is an Int16Array of heights (walls ignored) and pos is the
// player's cell index. The player has no height of its own: it is the height
// of the cell they stand on. States are treated as immutable, so step() may
// share `h` between the old and new state when nothing changed.

const DIRS = [
  { name: "U", dr: -1, dc: 0 },
  { name: "D", dr: 1, dc: 0 },
  { name: "L", dr: 0, dc: -1 },
  { name: "R", dr: 0, dc: 1 },
];

// Level text: one row per line, cells separated by spaces. "#" is a wall,
// otherwise a height digit, optionally followed by S (start) or T (target),
// e.g. "0S 4 0T". T may carry the side of the exit gap (U, D, L or R), e.g.
// "0TL": the target cell is the one you must reach, and the gap in the wall is
// on its left. S may carry a side too, "0SD": the entry gate you arrived
// through, on the same rules as the exit and never the same gap. Levels without
// sides (older test levels) have no gaps to draw.
function parseLevel(text) {
  const rows = text.trim().split("\n").map((line) => line.trim().split(/\s+/));
  const height = rows.length;
  const width = rows[0].length;
  const wall = new Uint8Array(width * height);
  const heights = new Int16Array(width * height);
  let start = -1;
  let target = -1;
  let exitDir = -1;
  let startDir = -1;
  rows.forEach((row, r) => {
    if (row.length !== width) throw new Error("Ragged level row " + r);
    row.forEach((token, c) => {
      const i = r * width + c;
      if (token === "#") {
        wall[i] = 1;
        return;
      }
      const match = /^(\d+)(?:S([UDLR])?|T([UDLR])?)?$/.exec(token);
      if (!match) throw new Error("Bad cell " + JSON.stringify(token));
      heights[i] = Number(match[1]);
      // The marker letter (S or T) is whatever follows the height digits.
      const marker = token.replace(/^\d+/, "")[0];
      if (marker === "S") {
        start = i;
        if (match[2]) startDir = DIRS.findIndex((dir) => dir.name === match[2]);
      }
      if (marker === "T") {
        target = i;
        if (match[3]) exitDir = DIRS.findIndex((dir) => dir.name === match[3]);
      }
    });
  });
  if (start < 0 || target < 0) throw new Error("Level needs an S and a T");
  const level = makeLevel(width, height, wall, heights, start, target, exitDir, startDir);
  if (exitDir >= 0 && !isValidExit(width, height, wall, target, exitDir)) {
    throw new Error("Exit gap is not on the outside wall or a wall connected to it");
  }
  if (startDir >= 0 && !isValidExit(width, height, wall, start, startDir)) {
    throw new Error("Entry gap is not on the outside wall or a wall connected to it");
  }
  if (exitDir >= 0 && startDir >= 0 && gateKey(width, target, exitDir) === gateKey(width, start, startDir)) {
    throw new Error("Entry and exit are the same gap");
  }
  return level;
}

// Wall cells that are 4-connected through walls to a wall cell on the board's
// edge, i.e. wall that is part of the room's outer structure rather than a
// free-standing pillar.
function outerWalls(width, height, wall) {
  const outer = new Uint8Array(wall.length);
  const stack = [];
  for (let i = 0; i < wall.length; i += 1) {
    const r = Math.floor(i / width);
    const c = i % width;
    if (wall[i] && (r === 0 || c === 0 || r === height - 1 || c === width - 1)) {
      outer[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop();
    const r = Math.floor(i / width);
    const c = i % width;
    for (const { dr, dc } of DIRS) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || rr >= height || cc < 0 || cc >= width) continue;
      const n = rr * width + cc;
      if (wall[n] && !outer[n]) {
        outer[n] = 1;
        stack.push(n);
      }
    }
  }
  return outer;
}

// An exit gap is a side of the target cell that faces off the board, or a wall
// cell belonging to the outer structure (a tunnel through the wall to the
// outside). A free-standing pillar can't hold an exit.
function isValidExit(width, height, wall, target, dir, outer = outerWalls(width, height, wall)) {
  if (wall[target]) return false;
  const r = Math.floor(target / width) + DIRS[dir].dr;
  const c = (target % width) + DIRS[dir].dc;
  if (r < 0 || r >= height || c < 0 || c >= width) return true;
  return Boolean(outer[r * width + c]);
}

// Identifies the gap a gate opens onto, so two gates can be told apart.
function gateKey(width, cell, dir) {
  return `${Math.floor(cell / width) + DIRS[dir].dr},${(cell % width) + DIRS[dir].dc}`;
}

// Every valid exit side of the cell `target`, as direction indices.
function exitDirs(width, height, wall, target, outer = outerWalls(width, height, wall)) {
  if (wall[target]) return [];
  return DIRS.map((_, d) => d).filter((d) => isValidExit(width, height, wall, target, d, outer));
}

function makeLevel(width, height, wall, heights, start, target, exitDir = -1, startDir = -1) {
  // nbrs[i][d] is the cell index in direction d, or -1 if that is off the
  // board or a wall. Both cases behave identically: you can't move there and
  // spreading doesn't put anything there.
  const nbrs = [];
  for (let i = 0; i < width * height; i += 1) {
    const r = Math.floor(i / width);
    const c = i % width;
    nbrs.push(
      DIRS.map(({ dr, dc }) => {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= height || cc < 0 || cc >= width) return -1;
        return wall[rr * width + cc] ? -1 : rr * width + cc;
      }),
    );
  }
  return { width, height, wall, initialHeights: heights, start, target, exitDir, startDir, nbrs };
}

function formatLevel(level, state = createState(level)) {
  const lines = [];
  for (let r = 0; r < level.height; r += 1) {
    const cells = [];
    for (let c = 0; c < level.width; c += 1) {
      const i = r * level.width + c;
      if (level.wall[i]) {
        cells.push("# ");
        continue;
      }
      const exitMark = level.exitDir >= 0 ? DIRS[level.exitDir].name : "";
      const entryMark = level.startDir >= 0 && i === level.start ? DIRS[level.startDir].name : "";
      const marker = i === state.pos ? "S" + entryMark : i === level.target ? "T" + exitMark : " ";
      cells.push(String(state.h[i]) + marker);
    }
    lines.push(cells.join(" ").trimEnd());
  }
  return lines.join("\n");
}

function createState(level) {
  const h = Int16Array.from(level.initialHeights);
  reflood(level, h);
  return { h, pos: level.start };
}

// Reflooring: while every non-wall cell is at least 1, the bottom layer
// disappears. Repeating that until some cell is 0 is the same as subtracting
// the minimum, which is what this does. Mutates h; returns the layers removed.
function reflood(level, h) {
  let min = Infinity;
  for (let i = 0; i < h.length; i += 1) {
    if (!level.wall[i] && h[i] < min) min = h[i];
  }
  if (min === Infinity || min <= 0) return 0;
  for (let i = 0; i < h.length; i += 1) {
    if (!level.wall[i]) h[i] -= min;
  }
  return min;
}

// Top block of `at` explodes: it loses one, and each neighbouring non-wall
// cell (including the player's) gains one. Mutates h.
function spread(level, h, at) {
  h[at] -= 1;
  for (const n of level.nbrs[at]) {
    if (n >= 0) h[n] += 1;
  }
}

// Applies one move. A level with an exit gap is won by stepping out through
// it: standing on the target cell and moving in the exit direction (at any
// height; the gap is on a wall or the room's edge, so nothing else uses that
// move). Levels without a gap side (older test levels) are won on reaching the
// target cell. Returns { state, result, ... } where result is one of
//   "blocked"  nothing happened (wall, edge, or a drop in soft mode)
//   "died"     stepped off a drop of 2+ (hard mode only); state is unchanged
//   "walked"   moved to the neighbouring cell
//   "won"      stepped out through the gap (or, without a gap, onto the target);
//              stepping out leaves the state unchanged
//   "pushed"   the neighbour was 2+ higher, so it spread; the player stays put
//              (push-then-move: you walk up on a later move once the gap is 1).
// Pushed results also carry `spreads` and `reflooded` (layers removed).
//
// opts.soft        a fatal drop is just blocked instead of killing you.
// opts.justEnough  variant: one push repeats the spread until the gap is at
//                  most 1, rather than spreading once per push.
function step(level, state, d, opts = {}) {
  const from = state.pos;
  if (from === level.target && d === level.exitDir) return { state, result: "won" };
  const to = level.nbrs[from][d];
  if (to < 0) return { state, result: "blocked" };
  const gap = state.h[to] - state.h[from];
  if (gap <= -2) return { state, result: opts.soft ? "blocked" : "died" };
  if (gap <= 1) {
    return {
      state: { h: state.h, pos: to },
      result: to === level.target && level.exitDir < 0 ? "won" : "walked",
    };
  }
  const h = Int16Array.from(state.h);
  let spreads = 0;
  do {
    spread(level, h, to);
    spreads += 1;
  } while (opts.justEnough && h[to] - h[from] >= 2);
  const reflooded = reflood(level, h);
  return { state: { h, pos: from }, result: "pushed", spreads, reflooded };
}

function stateKey(state) {
  return String.fromCharCode(state.pos, ...state.h);
}

// Breadth-first search over (heights, position). Spreading adds blocks, so the
// state space is infinite in principle; states with a pile above maxHeight are
// dropped and maxStates bounds the search. Returns
//   { status: "solved", moves, pushes, states }   moves like "RRUL", shortest
//   { status: "unsolvable", states }              search space exhausted
//   { status: "unknown", states }                 a cap was hit first
// opts.from is a state to search from instead of the level's start, e.g. to
// ask whether a half-played board can still be won.
// opts.noPushes restricts the search to walking, which answers "could you just
// walk there?" without any spreading.
// "Hard" and "soft" mode solve identically (a fatal drop is never useful), so
// the solver ignores opts.soft.
function solve(level, opts = {}) {
  const { maxHeight = 9, maxStates = 300000 } = opts;
  const first = opts.from || createState(level);
  const seen = new Map([[stateKey(first), 0]]);
  const states = [first];
  const parent = [-1];
  const moveInto = [-1];
  const pushInto = [false];
  let capped = false;

  for (let head = 0; head < states.length; head += 1) {
    const state = states[head];
    for (let d = 0; d < DIRS.length; d += 1) {
      const out = step(level, state, d, { justEnough: opts.justEnough });
      if (out.result === "blocked" || out.result === "died") continue;
      if (out.result === "pushed" && opts.noPushes) continue;
      if (out.result === "won") {
        let moves = DIRS[d].name;
        let pushes = 0;
        for (let i = head; i > 0; i = parent[i]) {
          moves = DIRS[moveInto[i]].name + moves;
          if (pushInto[i]) pushes += 1;
        }
        return { status: "solved", moves, pushes, states: states.length };
      }
      if (out.result === "pushed" && Math.max(...out.state.h) > maxHeight) {
        capped = true;
        continue;
      }
      const key = stateKey(out.state);
      if (seen.has(key)) continue;
      if (states.length >= maxStates) {
        capped = true;
        continue;
      }
      seen.set(key, states.length);
      states.push(out.state);
      parent.push(head);
      moveInto.push(d);
      pushInto.push(out.result === "pushed");
    }
  }
  return { status: capped ? "unknown" : "unsolvable", states: states.length };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DIRS, parseLevel, makeLevel, outerWalls, isValidExit, exitDirs, gateKey, formatLevel, createState, reflood, step, solve };
}
