// Levels, in the text format of parseLevel(): "#" wall, a height digit, "S" the
// start, and "E" the exit cell (a column of light set into the room's edge, or
// just outside it: stepping onto it from any open neighbour wins).
// "name" is what the play UI shows (plain "Level N" for now, since the levels
// may get real names); "info" (size and pushes) is only for the test UI.
// "solution" is the shortest known solution with single-spread pushes (from
// the solver), for reference. Level 1 is a hand-made tutorial; the rest were
// found with experiments/generate.js, ordered roughly by difficulty.
const LEVELS = [
  {
    name: "Level 1",
    info: "3x3, 2 pushes (hand-made tutorial)",
    solution: "UURRRRDD",
    text: `
      1  0  4
      2  #  0
      2S  0  E`,
  },
  {
    name: "Level 2",
    info: "4x3, 2 pushes",
    solution: "DRULLUUURU",
    text: `
      #  E  #
      1  1  0
      3  #  5
      2S  0  1
      1  1  1`,
  },
  {
    name: "Level 3",
    info: "4x4, 5 pushes",
    solution: "ULLLDLDDRRUULLLLLUU",
    text: `
      E  #  #  #
      0  #  #  #
      3  2  0  1
      #  2  #  2S
      #  1  3  3`,
  },
  {
    name: "Level 4",
    info: "3x4, 4 pushes",
    solution: "LLULDLULLUURRDR",
    text: `
      3  2  1  #
      0  #  0  E
      3  1  #  #
      3  0  1S  #`,
  },
  {
    name: "Level 5",
    info: "5x4, 5 pushes",
    solution: "UUUULDRRDLURDRLLDD",
    text: `
      #  #  #  0  1
      #  2  3  0  1
      #  1  #  #  4
      #  E  #  #  1S`,
  },
  {
    name: "Level 6",
    info: "5x5, 7 pushes",
    solution: "DDDLULLLLUULLUURURR",
    text: `
      4  0  E  #  #
      1  5  #  #  #
      3  3  #  #  0S
      #  1  1  2  3
      #  #  3  5  0`,
  },
  {
    name: "Level 7",
    info: "3x5, 9 pushes",
    solution: "URRRURURDLDDRRDR",
    text: `
      #  2  0  1  #
      0  4  0  4  0
      0S  5  #  0  E`,
  },
  {
    name: "Level 8",
    info: "3x3, 9 pushes",
    solution: "DRDRULLRUUULDRUUUDLUUUL",
    text: `
      E  0  5
      0  2S  5
      4  4  0`,
  },
  {
    name: "Level 9",
    info: "4x4, 11 pushes",
    solution: "UUURRRLDRURRRRULLDRURRURRUR",
    text: `
      #  #  2  E
      #  0  5  2
      4  2  5  #
      0S  5  #  #`,
  },
  {
    name: "Level 10",
    info: "5x2, 12 pushes",
    solution: "DRRRURRLULDRRRRRLLURRRRDRRURUR",
    text: `
      2S  5  4  0  E
      2  1  5  4  0`,
  },
  {
    name: "Level 11",
    info: "6x6, 10 pushes",
    solution: "UUURURDRDDDDDDRRRURRULUUUUR",
    text: `
      2  1  4  #  #  #  #
      5  0  0  1  #  5  E
      1S #  1  1  #  3  #
      #  #  0  #  0  5  #
      #  #  5  4  0  1  #
      #  #  0  1  5  0  #`,
  },
  {
    name: "Level 12",
    info: "6x5, 12 pushes",
    solution: "URUUULDLDDDRRRDDRRULLULUULURDRDRRRRRURULUUUUU",
    text: `
      #  #  #  #  E  #
      5  2  #  #  5  #
      0  2  #  #  0  4
      0  3  #  #  1  1
      2  2  0  3  4  #
      1S #  3  0  0  #`,
  },
  {
    name: "Level 13",
    info: "5x5, 15 pushes",
    solution: "LLDDLDLDDDDLDRRRLUUURDLUUUDRRUULULDDRRRRURRRUR",
    text: `
      2  2  1  2  0S #
      #  0  2  5  #  #
      5  0  #  #  0  E
      0  3  3  0  5  #
      0  1  3  0  #  #`,
  },
  {
    name: "Level 14",
    info: "5x5, 9 pushes",
    solution: "UURRUURDLULURULDDLRRULLDDLLLL",
    text: `
      #  #  #  0  1  1
      E  0  1  3  2  2
      #  #  3  1  #  #
      #  2  2  0  #  #
      #  0S #  #  #  #`,
  },
  {
    name: "Level 15",
    info: "5x4, 18 pushes",
    solution: "LLDLDRULDDDURDDLDDRRRUULLLRDDLLUUUUURRDLLLRDDLLUUURRULDDDLLRRLLUUUUUURRDDRR",
    text: `
      #  1  2  3  4S #
      #  2  3  0  #  #
      #  4  #  1  0  E
      #  0  1  4  5  #`,
  },
];
