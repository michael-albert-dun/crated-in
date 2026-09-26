// Candidate levels from experiments/find-levels.js, for review in the test UI.
// Same format as levels.js. Replace or delete freely.
const CANDIDATES = [
  {
    name: "Candidate 1",
    info: "4x4, 4 pushes, 1 way, 7 traps, 8% unused",
    solution: "LDDDDRRURDRRDL",
    text: `
      0  1SU #  1
      4  4  1  5
      0  2  1  2
      #  0  #  0TL`,
  },
  {
    name: "Candidate 2",
    info: "4x4, 6 pushes, 2 ways, 8 traps, 0% unused",
    solution: "LUULDLLLUURRRRDDLLUUUUL",
    text: `
      0TL 2  #  #
      2  3  4  #
      0  4  3  2
      1  3  1  2SR`,
  },
  {
    name: "Candidate 3",
    info: "4x4, 4 pushes, 1 way, 1 traps, 11% unused",
    solution: "LUUURUUURRU",
    text: `
      0  #  5  4TU
      3  3  0  #
      #  1  #  #
      #  2  1SR #`,
  },
  {
    name: "Candidate 4",
    info: "5x5, 6 pushes, 1 way, 4 traps, 28% unused",
    solution: "UUUULUUUURRRRRU",
    text: `
      0  0  0  4TU 0
      3  #  #  1  #
      0  4  2  #  3
      0  4  #  0  1
      #  0SL 4  4  #`,
  },
  {
    name: "Candidate 5",
    info: "5x5, 5 pushes, 1 way, 3 traps, 21% unused",
    solution: "UURRRDDDDDRURUUUR",
    text: `
      2  0  3  0  3
      0SD #  2  #  2
      #  #  2  #  0TR
      3  1  4  4  2
      4  #  1  1  1`,
  },
  {
    name: "Candidate 6",
    info: "5x5, 7 pushes, 1 way, 2 traps, 7% unused",
    solution: "DDDDLUULLLULLDDDDDDL",
    text: `
      4  #  #  #  0SU
      2  3  0  #  1
      1  #  4  1  3
      3  #  #  0  0
      5TL 0  #  #  #`,
  },
  {
    name: "Candidate 7",
    info: "6x6, 6 pushes, 1 way, 2 traps, 26% unused",
    solution: "LDRDLLLLLUUUUURRRRDLDD",
    text: `
      2  5  3  0  4  1
      #  0  0  #  0TD 5
      #  #  0  0  #  #
      0  0  1  #  2  2SU
      #  1  1  2  4  0
      #  #  #  #  0  #`,
  },
  {
    name: "Candidate 8",
    info: "6x6, 5 pushes, 1 way, 4 traps, 26% unused",
    solution: "DRRRRRRDDDDDLLLLD",
    text: `
      #  0SU 3  #  3  3
      1  1  0  2  2  0
      #  #  #  #  #  0
      #  #  0  #  #  2
      #  #  1TD 3  0  2
      #  #  #  #  0  1`,
  },
  {
    name: "Candidate 9",
    info: "6x6, 6 pushes, 1 way, 4 traps, 23% unused",
    solution: "LDDDLDDLLUUUULLUUU",
    text: `
      4TU #  #  2  0  1SR
      2  4  1  #  0  5
      #  0  #  0  2  #
      3  1  2  0  #  #
      #  #  0  3  2  #
      #  #  0  1  2  #`,
  },
  {
    name: "Candidate 10",
    info: "6x6, 5 pushes, 1 way, 5 traps, 22% unused",
    solution: "ULLLUUURURUUURRRRD",
    text: `
      #  0  #  3  #  3
      #  1  1  1  0  0TD
      5  2  0  #  #  #
      2  2  #  #  #  #
      0  #  1  2  4  #
      1  2  2  0SD 1  2`,
  },
  {
    name: "Candidate 11",
    info: "6x6, 4 pushes, 1 way, 4 traps, 27% unused",
    solution: "LUUUULLLLDULLD",
    text: `
      #  5TD 3  #  #  #
      #  #  0  3  1  0
      #  2  5  4  4  1
      #  #  #  #  3  2
      1  4  3  #  0  3
      #  #  0  0  5  1SR`,
  },
  {
    name: "Long 1",
    info: "5x5, 107 moves, 23 pushes, 3 ways, 11 traps, 0% unused",
    solution: "UULLDLDULLDRULLLRDLLUDDDRRRUUULLLLRRUULLLDRRDDLLLUURRDDLLLLURRUULLLDRRDDLLLLUURRDDDDLLLUUUURUURRDDDDLLLLLUU",
    text: `
      5  1  1  1  2
      #  1  1  #  1
      #  3  2  0  2SR
      0TU 1  #  #  0
      0  2  1  0  1`,
  },
  {
    name: "Long 2",
    info: "5x5, 106 moves, 27 pushes, 3 ways, 7 traps, 0% unused",
    solution: "UURRRRRDDDDLLUURRDDDDDUULLDDRUURRDDDLLUURRDDDDLUULLDDDRUURRDDDLLUURULDDDRRDDDULLDDDRRRUULLDRULDDDDDDDLDLLU",
    text: `
      #  #  0  1  #
      2  2  1  1  0
      0SL #  2  #  0
      #  0  2  1  4
      5TU 3  #  2  1`,
  },
  {
    name: "Long 3",
    info: "5x5, 80 moves, 24 pushes, 6 ways, 12 traps, 0% unused",
    solution: "LULDRURRURRURDDLLLLUURRDDLLLRUUULLDDDRRUUUUUULDLURDLLLDLULDRUULLLLDDRUULLLLLLDDL",
    text: `
      3  0  3  0  2
      5TL #  3  3  0
      #  0  3  1  3
      1  2  #  1  #
      1  3  2SD 0  #`,
  },
  {
    name: "Long 5",
    info: "5x5, 66 moves, 15 pushes, 2 ways, 14 traps, 5% unused",
    solution: "RRUULDDLLULLRURDDLLUULLURDRUUULRUUULLLLLLDDDRRRUUULLLRDDDLLLUUUULL",
    text: `
      0TL 2  4  0  0
      #  0  #  #  0
      #  1  #  3  0
      0  4  0  2  0
      4  #  0SL 0  0`,
  },
  {
    name: "Long 7",
    info: "5x5, 53 moves, 19 pushes, 9 ways, 8 traps, 10% unused",
    solution: "ULLLRUUUDLLULLUURRRRUULLRDDLLDRRURURLDRURUURRDDRRRRUR",
    text: `
      0  #  #  1  5
      4  2  2  #  1TR
      5  #  1  0  5
      0  2  3  #  4
      1  0  4  0  0SD`,
  },
];
