// Random board helpers shared by the experiments.
const { makeLevel, outerWalls, exitDirs, gateKey } = require("../src/engine.js");

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

module.exports = { mulberry32, randomLevel };
