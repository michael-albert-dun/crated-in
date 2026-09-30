// Approved levels for the "line push" variant (see README's Mechanics --
// step(..., { linePush: true }); a push only ever reaches you and the square
// past the pile, and fails outright with no room there). Same level-text
// format as levels.js. Not yet wired into a page of their own -- for now,
// play them via test.html or pool.html with the "Line push" checkbox on.
//
// First three, from the initial 4x4 pool batch (plain room, no walls, entry
// lower-left, exit upper-right): kept as found (2 pushes, no traps -- a thin
// warm-up); tightened by walling off decoy cells identified by hand (see
// experiments/analyse.js's traps measure) that don't change the solution:
// Level 2 lost the single cell at (2,3); Level 3 lost the whole bottom-right
// corner, (2,3)/(3,2)/(3,3) together. Both keep their original solution
// exactly, with the traps that made them interesting intact.
const LEVELS_LINEPUSH = [
  {
    name: "Level 1",
    info: "4x4, 2 pushes, 8 moves",
    solution: "UUUURURR",
    text: `
      5  1  1  E
      0  1  3  0
      5  3  4  4
      0S  2  4  5`,
  },
  {
    name: "Level 2",
    info: "4x4, 5 pushes, 15 moves, 2 traps",
    solution: "UUURDRRRUULURRU",
    text: `
      0  5  4  E
      4  2  0  2
      4  4  4  #
      0S  1  3  1`,
  },
  {
    name: "Level 3",
    info: "4x4, 8 pushes, 22 moves, 5 traps",
    solution: "RULURURDLUUURULUURRRRR",
    text: `
      0  5  1  E
      4  5  5  1
      1  4  5  #
      0S  0  #  #`,
  },
];
