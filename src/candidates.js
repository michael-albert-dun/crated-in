// Candidate levels from experiments/shape-levels.js (picked by pick-shapes.js), for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
  {
    name: "Candidate 1",
    info: "notch5x4 5x4, 8 pushes, 1 way, 8 traps, 26 moves, revisit 0.62, 0 decoys, 5 tempting",
    solution: "RURRLLDLURDDDDUURDLLDLDLDL",
    text: `
      5  3  2  4
      4S  3  5  0
      #  1  2  #
      E  1  5  4
      0  4  4  3`,
  },
  {
    name: "Candidate 2",
    info: "notch5x4 5x4, 10 pushes, 2 ways, 8 traps, 34 moves, revisit 0.62, 0 decoys, 3 tempting",
    solution: "RRRRDULDLURRRDDDDRUULLUULLURDRRDDL",
    text: `
      4  4  4  3
      2S  2  4  4
      #  0  5  #
      E  1  3  5
      1  3  4  3`,
  },
  {
    name: "Candidate 3",
    info: "pillars6 6x5, 13 pushes, 2 ways, 8 traps, 46 moves, revisit 0.59, 0 decoys, 4 tempting",
    solution: "LRRUUULLUUDLDRRURULULUULULUUUUUURDDDRRRRUUULLU",
    text: `
      4  0  E  0  3
      3  4  0  3  3
      0  #  4  #  0
      3  #  2  #  4
      0  1  3  3  0
      1  3  0S  0  0`,
  },
  {
    name: "Candidate 4",
    info: "nibbles6 6x5, 9 pushes, 1 way, 10 traps, 28 moves, revisit 0.57, 0 decoys, 10 tempting",
    solution: "UUUUDLURUUUUUU",
    text: `
      #  #  E  #  #
      #  0  0  3  #
      3  1  3  5  1
      4  3  2  3  2
      #  0  0  4  #
      #  #  1S  #  #`,
  },
  {
    name: "Candidate 5",
    info: "nibbles6 6x5, 12 pushes, 1 way, 13 traps, 33 moves, revisit 0.64, 0 decoys, 5 tempting",
    solution: "UUULULURRRULLULDLLUURURU",
    text: `
      #  #  E  #  #
      #  2  0  5  #
      0  5  5  5  3
      5  0  3  3  3
      #  5  3  2  #
      #  #  0S  #  #`,
  },
  {
    name: "Candidate 6",
    info: "square4 4x4, 9 pushes, 1 way, 9 traps, 27 moves, revisit 0.48, 0 decoys, 3 tempting",
    solution: "UURDRRRRULLUURRLURRRR",
    text: `
      1  4  0  E
      4  1  4  0
      0  5  4  3
      1S  4  0  4`,
  },
  {
    name: "Candidate 7",
    info: "square4 4x4, 14 pushes, 1 way, 14 traps, 36 moves, revisit 0.64, 0 decoys, 1 tempting",
    solution: "RURRRLURDRRRURURDLUUUULLULDRRRLURRRR",
    text: `
      4  2  0  E
      1  5  2  0
      1  2  4  3
      1S  5  0  4`,
  },
];
