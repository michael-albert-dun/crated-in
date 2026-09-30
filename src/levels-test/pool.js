// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/levels-test/candidates.js was starting to. Once a choice is made, whatever's here
// can be discarded; nothing else in the game refers to it. See pool.html.
//
// This batch: boards on the shape
//   #  .  .  #  .  .  E
//   S  .  .  .  .  .  #
// found by exhausting heights 0-4 for whether the shortest solution pushes
// twice from row2,col4 (the only open cell that borders both halves of the
// room), with a trip toward the exit and back to the left alcove in between.
const POOL = [
  {
    name: "Option 1",
    info: "7x2, 6 pushes, 2 ways, 1 traps, 19 moves -- compact push-retreat-push (19 moves)",
    solution: "RRRRRLLURDRRRRRRURR",
    text: `
      #  0  2  #  0  1  E
      0S  0  0  2  3  0  #`,
  },
  {
    name: "Option 2",
    info: "7x2, 9 pushes, 2 ways, 3 traps, 24 moves -- stall-at-alcove push-retreat-push (24 moves, full narration)",
    solution: "RRRRRRULLLURDRRRRRRURURR",
    text: `
      #  0  2  #  4  0  E
      0S  0  0  2  2  4  #`,
  },
  {
    name: "Option 3",
    info: "7x2, 9 pushes, 6 ways, 4 traps, 24 moves -- variant with early left-alcove peek (24 moves)",
    solution: "RRRURRRULLULDRRRRRRURURR",
    text: `
      #  0  3  #  4  0  E
      0S  0  0  2  2  4  #`,
  },
];
