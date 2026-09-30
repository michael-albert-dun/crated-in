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
    name: "Candidate 12",
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
    name: "Candidate 13",
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
    name: "Candidate 14",
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
    name: "Candidate 15",
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
    name: "Candidate 16",
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
    name: "Candidate 17",
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
    name: "Candidate 18",
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
    name: "Candidate 19",
    info: "icfg6 (3x3 interior, edge-mid to corner), 8 pushes, 1 way, 5 traps, 23 moves, revisit 0.78",
    solution: "DRURDLLRDDDLURDDDULDDDL",
    text: `
      5  3S  1
      0  3  5
      E  0  5`,
  },
  {
    name: "Candidate 20",
    info: "2x5 rect, exit diagonal, 30 pushes, 6 ways, 17 traps, 71 moves, revisit 0.90",
    solution: "DRURRRLDRURRDRDLURRDRRRLDRURRRLDLURDRURRRRRRLDLURDRRRRULDRRRURDRURDRRRR",
    text: `
      0S  1  5  5  0
      0  5  1  0  E`,
  },
  {
    name: "Candidate 21",
    info: "notch3x5 3x5, 8 pushes, 1 way, 8 traps, 24 moves, revisit 0.71",
    solution: "RUURDLURUURRRRRDR",
    text: `
      #  4  5  2  #
      4  2  3  5  0
      0S  0  #  2  E`,
  },
  {
    name: "Candidate 22",
    info: "notch3x5 3x5, 11 pushes, 2 ways, 9 traps, 25 moves, revisit 0.68",
    solution: "URURRURDRURRRDDDDR",
    text: `
      #  0  4  0  #
      2  1  5  5  1
      0S  5  #  1  E`,
  },
  {
    name: "Candidate 23",
    info: "notch3x5 3x5, 11 pushes, 1 way, 8 traps, 29 moves, revisit 0.69",
    solution: "RURRRULDRRURULDRRRRRD",
    text: `
      #  3  3  5  #
      3  1  4  5  1
      3S  2  #  0  E`,
  },
  {
    name: "Candidate 24",
    info: "notch3x5 3x5, 15 pushes, 2 ways, 19 traps, 45 moves, revisit 0.80",
    solution: "URRRRRRURDRRRD",
    text: `
      #  2  2  5  #
      0  0  4  5  1
      0S  5  #  0  E`,
  },
  {
    name: "Candidate 25",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 12 pushes, 4 ways, 5 traps, 28 moves, revisit 0.68",
    solution: "URDLDRRDRRRLDLURRURDDRDRRRDR",
    text: `
      #  0  0  3  #
      0  0  3  5  0
      1S  4  #  0  E`,
  },
  {
    name: "Candidate 26",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 13 pushes, 4 ways, 5 traps, 33 moves, revisit 0.73",
    solution: "URRURDRLDRUURRRRULDRRRURDRURDRRDR",
    text: `
      #  0  1  5  #
      1  0  3  5  0
      0S  0  #  0  E`,
  },
  {
    name: "Candidate 27",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 18 pushes, 6 ways, 8 traps, 44 moves, revisit 0.80",
    solution: "URDURDLDDRDRRULDRDRDRLURDRDLURRRRRRULDRRRRDR",
    text: `
      #  0  0  4  #
      0  0  3  4  0
      1S  4  #  0  E`,
  },
  {
    name: "Candidate 28",
    info: "notch3x5 (>=6 cells at height 0) 3x5, 19 pushes, 8 ways, 5 traps, 49 moves, revisit 0.82",
    solution: "RURRLDRUURRRLDLURUURRRLURDRLDRUURRRRULDRRRURDRRDR",
    text: `
      #  0  0  4  #
      2  0  4  5  0
      1S  0  #  0  E`,
  },
  {
    name: "Candidate 29",
    info: "linked32 5x5, 7 pushes, 1 plan, 5 traps, 23 moves",
    solution: "DDDLLLLULUULDLUUUDRUUUR",
    text: `
      2  0  E  #  #
      4  2  #  #  #
      0  2  #  #  0S
      #  3  4  4  0
      #  #  2  4  2`,
  },
  {
    name: "Candidate 30",
    info: "linked32 5x5, 9 pushes, 1 plan, 7 traps, 27 moves",
    solution: "DLDLLURDDRRDLULLLLLULULUURR",
    text: `
      2  0  E  #  #
      1  5  #  #  #
      4  4  #  #  0S
      #  0  1  1  1
      #  #  4  5  0`,
  },
  {
    name: "Candidate 31",
    info: "linked32 5x5, 12 pushes, 1 plan, 6 traps, 30 moves",
    solution: "DLLLLLULURULUUURURR",
    text: `
      3  0  E  #  #
      4  5  #  #  #
      1  2  #  #  0S
      #  2  0  4  0
      #  #  2  5  2`,
  },
  // The three below are on Level 9's exact shape (same walls, start and exit),
  // with heights hand-picked (from a random search over that one shape) so
  // that the level is provably unsolvable by climbing alone -- turn on
  // "Slide-or-climb" in Test options, or nothing here can be won. Each
  // solution's essential slide leaves the far cell exactly 1 higher than it
  // would be after a plain climb, turning what would otherwise be a fatal
  // 2-drop a move or two later into a safe step.
  {
    name: "Slide demo 1 (needs Slide-or-climb)",
    info: "3x5, 1 push (a slide), 6 moves -- unsolvable by climbing alone",
    solution: "URRRDR",
    text: `
      #  3  0  0  #
      1  2  0  1  0
      0S  1  #  2  E`,
  },
  {
    name: "Slide demo 2 (needs Slide-or-climb)",
    info: "3x5, 2 pushes (1 ordinary, 1 slide), 7 moves -- unsolvable by climbing alone",
    solution: "UURRRDR",
    text: `
      #  0  3  1  #
      3  1  3  0  0
      0S  3  #  0  E`,
  },
  {
    name: "Slide demo 3 (needs Slide-or-climb)",
    info: "3x5, 3 pushes (1 ordinary, 2 slides), 9 moves -- unsolvable by climbing alone",
    solution: "URULRRRDR",
    text: `
      #  3  0  2  #
      4  4  1  3  3
      2S  4  #  2  E`,
  },
  // The two below are on a hand-drawn diagonal-corridor shape (a 5x5 room,
  // walls carving a band from lower-left to upper-right), with only the seven
  // "middle" cells (Manhattan distance > 2 from both S and E) given positive
  // height -- found by an exhaustive sweep (heights 1-4 on those seven cells,
  // 16384 boards) over that one shape, checking solve() with and without
  // slideClimb. Of that sweep: 2401 boards were climb-provably-impossible but
  // slide-solvable (this shape is far richer than Level 9's for that); 744
  // were solvable both ways with sliding dramatically shorter. Both entries
  // below were re-verified at a much larger search cap (400000 states) to
  // rule out the "divergent, not actually proven" trap found earlier in the
  // equalise variant's sparse-start search.
  {
    name: "Slide demo 4 (needs Slide-or-climb)",
    info: "5x5, 21 pushes, 51 moves -- unsolvable by climbing alone (proven, only 247 reachable states)",
    solution: "URURUUDRULUUURURLDDRUULRDRULDDDLLURURDDDLLURURDLRRU",
    text: `
      #  #  #  0  E
      #  4  1  0  0
      #  3  4  1  #
      0  0  3  4  #
      0S  0  #  #  #`,
  },
  {
    name: "Slide demo 5 (try with and without Slide-or-climb)",
    info: "5x5, solvable either way: climbing takes 24 moves/8 pushes, sliding takes 9 moves/2 pushes",
    solution: "URRRURUUR",
    text: `
      #  #  #  0  E
      #  4  2  0  0
      #  4  2  1  #
      0  0  3  3  #
      0S  0  #  #  #`,
  },
];
