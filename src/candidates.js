// Candidate levels from experiments/make-levels.js, for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
  {
    name: "Candidate 1",
    info: "5x5, 6 pushes, 1 way, 3 traps, 21 moves",
    solution: "LLLLDDDDRURRRDDRRUUUU",
    text: `
      0  0  2  0SD #
      0  #  #  #  #
      1  #  #  #  #
      1  2  0  #  5TU
      0  4  2  0  1`,
  },
  {
    name: "Candidate 2",
    info: "6x4, 7 pushes, 1 way, 5 traps, 23 moves",
    solution: "LLULLDRURRRRUURRRRDDDDD",
    text: `
      #  #  0  1  1  3
      #  #  0  #  #  0
      0  1  1  #  #  5TD
      0  4  4  2SD #  #`,
  },
  {
    name: "Candidate 3",
    info: "6x5, 7 pushes, 1 way, 6 traps, 24 moves",
    solution: "LDLLLRURDLDDLLLLLUUULUUL",
    text: `
      2TL #  #  #  #  #
      0  0  #  #  #  #
      #  0  #  #  #  #
      #  1  #  #  0  0SU
      #  0  3  2  0  4`,
  },
  {
    name: "Candidate 4",
    info: "5x4, 9 pushes, 2 ways, 5 traps, 26 moves",
    solution: "RDRDLUUUDRUULLUUURRRRRRDDL",
    text: `
      0  0  0  3  4
      2SL 4  #  #  5TL
      2  0  #  #  #
      0  0  #  #  #`,
  },
  {
    name: "Candidate 5",
    info: "6x4, 8 pushes, 2 ways, 3 traps, 31 moves",
    solution: "UULLLLLDDRDRULLLLULDRUUDRULULUU",
    text: `
      #  5  3  3  1  2
      0TU 2  1  #  #  2
      2  0  3  2  0  2SD
      #  #  #  1  0  #`,
  },
];
