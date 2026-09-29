// A throwaway batch of "equalise" levels to look at and choose between (see
// pool-equalize.html and experiments/reverse-equalize.js). Ephemeral by design:
// the whole file gets overwritten with a fresh POOL_EQUALIZE every time there's
// a new batch to show. Once a choice is made, copy the entry into
// src/levels-equalize.js by hand and forget this file until the next batch.
const POOL_EQUALIZE = [
  {
    name: "Option 1",
    info: "3x3, 3 pushes, 3 moves to flatten",
    solution: "ULL",
    text: `
      3  0  4
      1  5  0S
      3  1  3`,
  },
  {
    name: "Option 2",
    info: "3x3, 3 pushes, 3 moves to flatten",
    solution: "DRR",
    text: `
      3  0S  5
      2  4  0
      3  2  3`,
  },
  {
    name: "Option 3",
    info: "3x3, 4 pushes, 4 moves to flatten",
    solution: "LLLR",
    text: `
      4  4  4
      1  4  3
      7  0S  5`,
  },
  {
    name: "Option 4",
    info: "3x3, 5 pushes, 5 moves to flatten",
    solution: "UUURR",
    text: `
      2  5  5
      8  0  5
      0S  7  3`,
  },
  {
    name: "Option 5",
    info: "3x3, 6 pushes, 6 moves to flatten",
    solution: "UUURRR",
    text: `
      3  6  6
      9  0  6
      0S  9  3`,
  },
  {
    name: "Option 6",
    info: "3x3, 6 pushes, 7 moves to flatten",
    solution: "UDDDUDR",
    text: `
      7  3  5
      0S  4  5
      7  3  4`,
  },
];
