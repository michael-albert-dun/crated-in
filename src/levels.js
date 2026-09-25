// Levels, in the text format of parseLevel(): "#" wall, a height digit, "S"
// start and "T" target, each followed by the side of its gap (U, D, L or R):
// "0SD" is where you enter the room, "0TL" the doorway you step out through.
// "solution" is the shortest known solution with single-spread pushes (from
// the solver), for reference. Found with experiments/generate.js; ordered
// roughly by difficulty.
const LEVELS = [
  {
    name: "Room 1 (4x4, 2 pushes)",
    solution: "DRULLUUURU",
    text: `
      1  1TU 0  0
      3  #  5  4
      2SL 0  1  #
      1  1  1  2`,
  },
  {
    name: "Room 2 (4x4, 3 pushes)",
    solution: "UURRRRRRU",
    text: `
      0  2  2  4TU
      1  #  1  #
      2SL 0  #  #
      #  #  1  0`,
  },
  {
    name: "Room 3 (5x5, 5 pushes)",
    solution: "LLLULDLULLUURRDRRRR",
    text: `
      3  #  #  0  #
      3  2  1  0  0
      0  #  0  0  2TR
      3  1  #  0  #
      3  0  1  2SD 0`,
  },
  {
    name: "Room 4 (5x5, 6 pushes)",
    solution: "DLLDLLUULLDDRUUULLLURURR",
    text: `
      2  0TR #  4  0
      1  2  #  #  2
      0  4  1  #  0SR
      #  1  2  0  1
      #  4  0  2  2`,
  },
  {
    name: "Room 5 (5x5, 10 pushes)",
    solution: "LLURDLDDLUULDRRRRULLUURRRUURRRDDDDR",
    text: `
      2  5  0  3  0
      1  #  0  #  0
      2  0  2  #  5TR
      0  3  1  0  #
      0  0  2  3  3SD`,
  },
  {
    name: "Room 6 (6x6, 11 pushes)",
    solution: "UUUUUUURURDRDDDDDDRRRURRULUUUUR",
    text: `
      2  1  4  #  4  1
      5  0  0  1  #  5TR
      0  #  1  1  #  3
      3  #  0  #  0  5
      0  #  5  4  0  1
      1SD #  0  1  5  0`,
  },
  {
    name: "Room 7 (6x6, 12 pushes)",
    solution: "UURUUULDLDDDRRRDDRRULLULUULURDRDRRRRRURULUUUUU",
    text: `
      5  2  #  #  5TU #
      0  2  #  3  0  4
      0  3  #  #  1  1
      2  2  0  3  4  #
      1  #  3  0  0  #
      0SD #  #  #  #  #`,
  },
  {
    name: "Room 8 (5x5, 15 pushes)",
    solution: "LLDDLDLDDDDLDRRRLUUURDLUUUDRRUULULDDRRRRURRRUR",
    text: `
      2  2  1  2  0SU
      #  0  2  5  #
      5  0  #  #  0TR
      0  3  3  0  5
      0  1  3  0  #`,
  },
  {
    name: "Room 9 (5x5, 9 pushes)",
    solution: "UURRUURDLULURULDDLRRULLDDLLLL",
    text: `
      3  #  0  1  1
      0TL 1  3  2  2
      #  3  1  #  0
      2  2  0  4  0
      0SD #  0  0  0`,
  },
];
