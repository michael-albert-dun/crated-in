// Random board helpers shared by the experiments.
const { makeLevel, outerWalls, exitDirs, gateKey, createState } = require("../src/engine.js");

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Height weights for non-wall cells: mostly low, a few tall piles.
const HEIGHT_WEIGHTS = [0.35, 0.3, 0.2, 0.1, 0.05];

function pickHeight(rand) {
  let x = rand();
  for (let h = 0; h < HEIGHT_WEIGHTS.length; h += 1) {
    x -= HEIGHT_WEIGHTS[h];
    if (x < 0) return h;
  }
  return HEIGHT_WEIGHTS.length - 1;
}

function randomLevel(width, height, wallP, rand) {
  const wall = new Uint8Array(width * height);
  const heights = new Int16Array(width * height);
  const open = [];
  for (let i = 0; i < wall.length; i += 1) {
    if (rand() < wallP) wall[i] = 1;
    else {
      heights[i] = pickHeight(rand);
      open.push(i);
    }
  }
  if (open.length < 2) return null;
  // Start and target each need a gate: a gap in the room's edge, or in wall
  // connected to it. The gates must differ, and the cells should be apart so
  // trivial one-step boards are rare.
  const outer = outerWalls(width, height, wall);
  const gated = open.filter((i) => exitDirs(width, height, wall, i, outer).length > 0);
  if (gated.length < 2) return null;
  const start = gated[Math.floor(rand() * gated.length)];
  const far = gated.filter(
    (i) => Math.abs(Math.floor(i / width) - Math.floor(start / width)) + Math.abs((i % width) - (start % width)) >= 3,
  );
  if (!far.length) return null;
  const target = far[Math.floor(rand() * far.length)];
  const pickDir = (cell) => {
    const dirs = exitDirs(width, height, wall, cell, outer);
    return dirs[Math.floor(rand() * dirs.length)];
  };
  const startDir = pickDir(start);
  const exitDir = pickDir(target);
  if (gateKey(width, start, startDir) === gateKey(width, target, exitDir)) return null;
  return makeLevel(width, height, wall, heights, start, target, exitDir, startDir);
}

function pick(list, rand) {
  return list[Math.floor(rand() * list.length)];
}

// One random change to a board: a height, a wall, the start or target cell, or
// the side of a gate. Initial heights never exceed maxInitial (pushes can build
// higher during play). Returns null if the change isn't valid.
function mutate(level, rand, maxInitial = 5) {
  const wall = Uint8Array.from(level.wall);
  const heights = Int16Array.from(createState(level).h);
  let { start, target, exitDir, startDir } = level;
  const cells = wall.length;
  const i = Math.floor(rand() * cells);
  const op = rand();
  if (op < 0.55) {
    if (wall[i]) return null;
    heights[i] = Math.max(0, Math.min(maxInitial, heights[i] + (rand() < 0.5 ? -1 : 1)));
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

module.exports = { mulberry32, randomLevel, mutate };
