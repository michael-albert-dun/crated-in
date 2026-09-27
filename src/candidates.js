// Candidate levels from experiments/shape-levels.js / exhaust-shape.js / etc, for review in the test UI.
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
  {
    name: "Candidate 8",
    info: "diag4 4x4, 6 pushes, 2 ways, 8 traps, 14 moves, revisit 0.57, 0 decoys, 2 tempting",
    solution: "RURUURULURUUUR",
    text: `
      #  #  0  E
      #  5  4  0
      5  1  0  #
      0S  2  #  #`,
  },
  {
    name: "Candidate 9",
    info: "diag4 4x4, 8 pushes, 2 ways, 8 traps, 18 moves, revisit 0.67, 1 decoys, 0 tempting",
    solution: "RURRRULDRURRURURRU",
    text: `
      #  #  1  E
      #  3  0  3
      0  3  3  #
      0S  5  #  #`,
  },
  {
    name: "Candidate 10",
    info: "diag4 4x4, 9 pushes, 2 ways, 8 traps, 19 moves, revisit 0.68, 1 decoys, 0 tempting",
    solution: "URURRRULDRURRURURUR",
    text: `
      #  #  5  E
      #  4  1  2
      2  3  4  #
      0S  5  #  #`,
  },
  {
    name: "Candidate 11",
    info: "diag4 4x4, 11 pushes, 2 ways, 9 traps, 27 moves, revisit 0.74, 0 decoys, 2 tempting",
    solution: "UUURRRLDRURRRRULLDRURRURRUR",
    text: `
      #  #  2  E
      #  0  5  2
      4  2  5  #
      0S  5  #  #`,
  },
  {
    name: "Candidate 12",
    info: "cross3 5x3, 9 pushes, 1 way, 2 traps, 27 moves, revisit 0.67, 0 decoys",
    solution: "UULURRUULLDRRRUUUDLULUURURU",
    text: `
      #  E  #
      2  0  4
      5  2  5
      1  3  2
      #  0S  #`,
  },
  {
    name: "Candidate 13",
    info: "cross3 5x3, 11 pushes, 2 ways, 2 traps, 31 moves, revisit 0.71, 0 decoys",
    solution: "UULURRDRDLLUDURDLLDULDRRDLULULU",
    text: `
      #  E  #
      0  0  4
      2  3  2
      2  5  0
      #  3S  #`,
  },
  {
    name: "Candidate 14",
    info: "cross3 5x3, 13 pushes, 1 way, 1 traps, 35 moves, revisit 0.74, 0 decoys",
    solution: "UURRULLURDRDRRURDLURRRRULLDRURURU",
    text: `
      #  E  #
      4  0  3
      3  0  5
      2  4  4
      #  1S  #`,
  },
  {
    name: "Candidate 15",
    info: "cross3 5x3, 21 pushes, 2 ways, 7 traps, 55 moves, revisit 0.84, 0 decoys",
    solution: "ULURRRULLURDRDRRURDLURRRRULLDRRRLURRDRDRLURRDRDLURURU",
    text: `
      #  E  #
      5  0  3
      4  0  5
      2  3  5
      #  2S  #`,
  },
  {
    name: "Candidate 16",
    info: "cfg13 (3x3, edge-mid entry, off-corner exit), 21 pushes, 1 way, 7 traps, 48 moves, revisit 0.81",
    solution: "DRDDLDDDDURDDLDLDURDDLDLDURDDLDLLURDDDDLUULLDDDD",
    text: `
      #  #  3S  #  #
      #  5  2  1  #
      #  4  4  5  #
      #  0  4  3  #
      #  E  #  #  #`,
  },
  {
    name: "Candidate 17",
    info: "cfg13 (3x3, edge-mid entry, off-corner exit), 22 pushes, 1 way, 15 traps, 55 moves, revisit 0.85",
    solution: "DDDRDLDDLURDDDULDDDURDDDULDDDURDDDULDDDURDDDULDDDULDDDD",
    text: `
      #  #  0S  #  #
      #  4  2  1  #
      #  3  3  4  #
      #  0  2  4  #
      #  E  #  #  #`,
  },
  {
    name: "Candidate 18",
    info: "cfg13 (3x3, edge-mid entry, off-corner exit), 29 pushes, 4 ways, 22 traps, 70 moves, revisit 0.89",
    solution: "DDDDRDLDDDURDLDDDLRULDDLURDLLRDLLLRULLLRDLLLRULLLRDLLLRULLLRDLLLRDLLLD",
    text: `
      #  #  0S  #  #
      #  5  2  2  #
      #  4  5  4  #
      #  0  4  4  #
      #  E  #  #  #`,
  },
  {
    name: "Candidate 19",
    info: "cfg13 (3x3, edge-mid entry, off-corner exit), 35 pushes, 4 ways, 31 traps, 86 moves, revisit 0.88",
    solution: "DDDRDDLDDRDLDDLURDLLRDLLLRULLLRDLLLRULLLRDLLLRULLLRDLLLRULLLDDLURRDDLLULULLDLDRRDDLLLD",
    text: `
      #  #  0S  #  #
      #  5  2  0  #
      #  3  5  5  #
      #  0  5  3  #
      #  E  #  #  #`,
  },
  {
    name: "Candidate 20",
    info: "icfg6 (3x3 interior, edge-mid to corner), 8 pushes, 1 way, 5 traps, 23 moves, revisit 0.78",
    solution: "DRURDLLRDDDLURDDDULDDDL",
    text: `
      5  3S  1
      0  3  5
      E  0  5`,
  },
  {
    name: "Candidate 21",
    info: "icfg8 (3x3 interior, centre to corner), 9 pushes, 1 way, 5 traps, 23 moves, revisit 0.78",
    solution: "DRDRULLRUUULDRUUUDLUUUL",
    text: `
      E  0  5
      0  2S  5
      4  4  0`,
  },
  {
    name: "Candidate 22",
    info: "2x5 rect, exit straight across, 12 pushes, 3 ways, 7 traps, 30 moves, revisit 0.77",
    solution: "DRRRURRLULDRRRRRLLURRRRDRRURUR",
    text: `
      2S  5  4  0  E
      2  1  5  4  0`,
  },
  {
    name: "Candidate 23",
    info: "2x5 rect, exit diagonal, 30 pushes, 6 ways, 17 traps, 71 moves, revisit 0.90",
    solution: "DRURRRLDRURRDRDLURRDRRRLDRURRRLDLURDRURRRRRRLDLURDRRRRULDRRRURDRURDRRRR",
    text: `
      0S  1  5  5  0
      0  5  1  0  E`,
  },
  {
    name: "Candidate 24",
    info: "notch3x5 3x5, 8 pushes, 1 way, 8 traps, 24 moves, revisit 0.71",
    solution: "RUURDLURUURRRRRDR",
    text: `
      #  4  5  2  #
      4  2  3  5  0
      0S  0  #  2  E`,
  },
  {
    name: "Candidate 25",
    info: "notch3x5 3x5, 11 pushes, 2 ways, 9 traps, 25 moves, revisit 0.68",
    solution: "URURRURDRURRRDDDDR",
    text: `
      #  0  4  0  #
      2  1  5  5  1
      0S  5  #  1  E`,
  },
  {
    name: "Candidate 26",
    info: "notch3x5 3x5, 11 pushes, 1 way, 8 traps, 29 moves, revisit 0.69",
    solution: "RURRRULDRRURULDRRRRRD",
    text: `
      #  3  3  5  #
      3  1  4  5  1
      3S  2  #  0  E`,
  },
  {
    name: "Candidate 27",
    info: "notch3x5 3x5, 15 pushes, 2 ways, 19 traps, 45 moves, revisit 0.80",
    solution: "URRRRRRURDRRRD",
    text: `
      #  2  2  5  #
      0  0  4  5  1
      0S  5  #  0  E`,
  },
  {
    name: "Candidate 28",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 12 pushes, 4 ways, 5 traps, 28 moves, revisit 0.68",
    solution: "URDLDRRDRRRLDLURRURDDRDRRRDR",
    text: `
      #  0  0  3  #
      0  0  3  5  0
      1S  4  #  0  E`,
  },
  {
    name: "Candidate 29",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 13 pushes, 4 ways, 5 traps, 33 moves, revisit 0.73",
    solution: "URRURDRLDRUURRRRULDRRRURDRURDRRDR",
    text: `
      #  0  1  5  #
      1  0  3  5  0
      0S  0  #  0  E`,
  },
  {
    name: "Candidate 30",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 18 pushes, 6 ways, 8 traps, 44 moves, revisit 0.80",
    solution: "URDURDLDDRDRRULDRDRDRLURDRDLURRRRRRULDRRRRDR",
    text: `
      #  0  0  4  #
      0  0  3  4  0
      1S  4  #  0  E`,
  },
  {
    name: "Candidate 31",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 19 pushes, 8 ways, 5 traps, 49 moves, revisit 0.82",
    solution: "RURRLDRUURRRLDLURUURRRLURDRLDRUURRRRULDRRRURDRRDR",
    text: `
      #  0  0  4  #
      2  0  4  5  0
      1S  0  #  0  E`,
  },
];
