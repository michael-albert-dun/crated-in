// Levels, in the text format of parseLevel(): "#" wall, a height digit, "S"
// start and "T" target, each followed by the side of its gap (U, D, L or R):
// "0SD" is where you enter the room, "0TL" the doorway you step out through.
// "name" is what the play UI shows (plain "Level N" for now, since the levels
// may get real names); "info" (size and pushes) is only for the test UI.
// "solution" is the shortest known solution with single-spread pushes (from
// the solver), for reference. Level 1 is a hand-made tutorial; the rest were
// found with experiments/generate.js, ordered roughly by difficulty.
const LEVELS = [
  {
    name: "Level 1",
    info: "3x5, 1 push (hand-made tutorial)",
    solution: "UUUURRRDDR",
    text: `
      2  4  1
      2  #  1
      2  0  0TR
      1  #  #
      0SD #  #`,
  },
  {
    name: "Level 2",
    info: "4x4, 2 pushes",
    solution: "DRULLUUURU",
    text: `
      1  1TU 0  0
      3  #  5  4
      2SL 0  1  #
      1  1  1  2`,
  },
  {
    name: "Level 3",
    info: "4x4, 3 pushes",
    solution: "UURRRRRRU",
    text: `
      0  2  2  4TU
      1  #  1  #
      2SL 0  #  #
      #  #  #  #`,
  },
  {
    name: "Level 4",
    info: "4x4, 5 pushes",
    solution: "ULLLDLDDRRUULLLLLUU",
    text: `
      0TU #  #  #
      3  2  0  1
      0  2  #  2SR
      #  1  3  3`,
  },
  {
    name: "Level 5",
    info: "5x5, 5 pushes",
    solution: "LLLULDLULLUURRDRRRR",
    text: `
      #  #  #  #  #
      3  2  1  0  0
      0  #  0  0  2TR
      3  1  #  0  #
      3  0  1  2SD #`,
  },
  {
    name: "Level 6",
    info: "5x5, 6 pushes",
    solution: "UUUUULDRRDLURDRLLDDRDDL",
    text: `
      #  #  #  0  1
      #  2  3  0  1
      #  1  #  #  4
      #  1  1  #  1
      #  #  3TL #  0SR`,
  },
  {
    name: "Level 7",
    info: "5x5, 6 pushes",
    solution: "DLLDLLUULLDDRUUULLLURURR",
    text: `
      2  0TR #  #  #
      1  2  #  #  #
      0  4  1  #  0SR
      #  1  2  0  1
      #  4  0  2  2`,
  },
  {
    name: "Level 8",
    info: "5x5, 10 pushes",
    solution: "LLURDLDDLUULDRRRRULLUURRRUURRRDDDDR",
    text: `
      2  5  0  3  0
      1  #  0  #  0
      2  0  2  #  5TR
      0  3  1  0  #
      0  0  2  3  3SD`,
  },
  {
    name: "Level 9",
    info: "5x5, 7 pushes",
    solution: "DLLLUUULLLDDDRRRUUUUULDDDDLLUUUURRRRDRUU",
    text: `
      0  3  2  0TU #
      1  4  1  2  #
      1  #  2  #  #
      1  #  3  #  0SL
      1  0  1  4  1`,
  },
  {
    name: "Level 10",
    info: "5x5, 20 pushes",
    solution: "URRUUUDLURULDRUUUDLUURURUURRULDRDLLLDRULDRDLUURURULLUR",
    text: `
      #  #  #  0TR #
      0  4  1  2  0
      4  3  0  3  2
      1  3  #  0  2
      2SD 1  #  #  #`,
  },
  {
    name: "Level 11",
    info: "6x6, 10 pushes",
    solution: "UUURURDRDDDDDDRRRURRULUUUUR",
    text: `
      2  1  4  #  #  #
      5  0  0  1  #  5TR
      1SL #  1  1  #  3
      #  #  0  #  0  5
      #  #  5  4  0  1
      #  #  0  1  5  0`,
  },
  {
    name: "Level 12",
    info: "6x6, 12 pushes",
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
    name: "Level 13",
    info: "5x5, 15 pushes",
    solution: "LLDDLDLDDDDLDRRRLUUURDLUUUDRRUULULDDRRRRURRRUR",
    text: `
      2  2  1  2  0SU
      #  0  2  5  #
      5  0  #  #  0TR
      0  3  3  0  5
      0  1  3  0  #`,
  },
  {
    name: "Level 14",
    info: "5x5, 9 pushes",
    solution: "UURRUURDLULURULDDLRRULLDDLLLL",
    text: `
      3  #  0  1  1
      0TL 1  3  2  2
      #  3  1  #  0
      2  2  0  4  0
      0SD #  0  0  0`,
  },
  {
    name: "Level 15",
    info: "5x5, 18 pushes",
    solution: "LLDLDRULDDDURDDLDDRRRUULLLRDDLLUUUUURRDLLLRDDLLUUURRULDDDLLRRLLUUUUUURRDDRU",
    text: `
      #  1  2  3  4SR
      #  2  3  0  #
      #  4  #  1  0TU
      2  0  1  4  5
      #  1  #  #  2`,
  },
];
