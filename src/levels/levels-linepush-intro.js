// The warm-up set for the line-push world: three tiny rooms that teach one
// idea each (see worlds.js). Same level-text format as levels.js. Solutions
// are proven shortest by the solver under linePush (experiments/ scratch
// search, 2026-10-01); all three are first drafts for Michael to replace.
//
// 1: one push, in a corridor, straight into the column of light (the copy
// that lands on it floats away). 2: two piles in a row (the first push feeds the
// second pile, which is why it still works). 3: an open room, where the
// pile's side neighbours are untouched, unlike the classic spread.
const LEVELS_LINEPUSH_INTRO = [
  {
    name: "Level 1",
    info: "3x1, 1 push into the light",
    solution: "RRR",
    text: `
      0S  2  E`,
  },
  {
    name: "Level 2",
    info: "5x1, 2 pushes",
    solution: "RRRRRR",
    text: `
      0S  2  2  0  E`,
  },
  {
    name: "Level 3",
    info: "4x3, 1 push",
    solution: "LRU",
    text: `
      3  2  3  E
      2  3  0S  2
      0  0  0  0`,
  },
];
