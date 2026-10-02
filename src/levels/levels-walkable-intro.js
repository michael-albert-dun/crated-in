// The warm-up set for the walkable world (see worlds.js): four tiny rooms with
// no exit, played under line push, won by making every square reachable on
// foot. Same level-text format as levels.js. Solutions are proven shortest by
// the solver (walkWin, linePush), each the only shortest one; all four are
// first drafts for Michael to replace.
//
// 1: walk up to the tall crate and push it (one push does it). 2: two tall
// crates in a row, so the first push feeds the second pile. 3: a push that
// looks right but makes things worse, so undo is part of the lesson. 4: a
// small open room with the same trap in it, and three pushes.
const LEVELS_WALKABLE_INTRO = [
  {
    name: "Level 1",
    info: "4x1, 1 push",
    solution: "RR",
    text: `
      0S  0  2  0`,
  },
  {
    name: "Level 2",
    info: "5x1, 2 pushes",
    solution: "LLLL",
    text: `
      2  2  2  0  1S`,
  },
  {
    name: "Level 3",
    info: "4x2, 2 pushes, 1 trap",
    solution: "DLULDL",
    text: `
      0  2  0  2S
      1  3  1  1`,
  },
  {
    name: "Level 4",
    info: "3x3, 3 pushes, 1 trap",
    solution: "URDRDDDL",
    text: `
      0  0  1
      1S  3  3
      3  3  0`,
  },
];
