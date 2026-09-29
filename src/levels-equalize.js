// Approved levels for the "equalise" win condition, in level text format (same
// format as src/levels.js, but no T or E: these levels have no target or exit
// cell, since the win condition is a property of the whole board -- see
// isFlat in engine.js). This is a hand-curated list: pick from a batch in
// src/pool-equalize.js (see pool-equalize.html and
// experiments/reverse-equalize.js) and paste the entry in here once approved.
const LEVELS_EQUALIZE = [
  {
    name: "Level 1",
    info: "3x3, 1 push, 1 move to flatten",
    solution: "D",
    // The tutorial: a plain 3x3, corners at 1, the arms at 0, the centre at 2.
    // A single push from the top-middle arm spreads onto all four arms
    // (levelling every cell to 1), which reflood then strips to 0 in the same
    // move -- the corners were never touched, so the push both equalises and
    // wins in one step.
    text: `
      1  0S  1
      0  2  0
      1  0  1`,
  },
];
