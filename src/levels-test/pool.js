// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/levels-test/candidates.js was starting to. Once a choice is made,
// whatever's here can be discarded; nothing else in the game refers to it.
// See pool.html.
//
// Current batch (2026-10-01): candidate line-push ("Three in a Row") rooms from
// experiments/line-corners.js, rectangular rooms with the start in the lower
// left and the exit in the upper right, ordered roughly easiest to hardest
// (line-push Level 9, the current hardest, is 22 moves / 8 pushes / 4 traps).
// Play with the "Line push" option on (pool.html now turns it on at load).
// Solutions are proven shortest under linePush at the solver's height cap of 9.
const POOL = [
  {
    name: "Pool 1",
    info: "4x4-p0,0;3,3, 13 moves, 5 pushes, 3 traps, 1 way, easy-tier",
    solution: "UUURRUDRULRUU",
    text: `
      #  0  5  E
      4  5  0  4
      4  4  1  4
      0S  4  3  #`,
  },
  {
    name: "Pool 2",
    info: "4x4, 17 moves, 5 pushes, 1 traps, 1 way, easy-tier",
    solution: "RRRRUUUDLLURUURRR",
    text: `
      3  2  0  E
      3  0  5  3
      1  3  5  5
      1S  3  3  0`,
  },
  {
    name: "Pool 3",
    info: "4x4-p1,0;2,3, 17 moves, 5 pushes, 2 traps, 1 way, easy-tier",
    solution: "URUURDLDRRRRRUURU",
    text: `
      4  2  0  E
      #  2  5  3
      0  0  4  #
      1S  5  3  2`,
  },
  {
    name: "Pool 4",
    info: "4x4-p1,0;2,3, 17 moves, 5 pushes, 3 traps, 1 way, easy-tier",
    solution: "RRRULULDRUUULUURR",
    text: `
      0  3  0  E
      #  2  5  0
      4  4  2  #
      0S  1  3  0`,
  },
  {
    name: "Pool 5",
    info: "4x4, 16 moves, 6 pushes, 4 traps, 1 way, easy-tier",
    solution: "URRRRULUULURRRRR",
    text: `
      5  0  5  E
      3  1  3  0
      2  5  1  2
      0S  4  2  3`,
  },
  {
    name: "Pool 6",
    info: "4x5-p0,0;4,3, 19 moves, 6 pushes, 4 traps, 1 way, mid-tier",
    solution: "RURRRRULLLUURRRRRRU",
    text: `
      #  5  0  E
      1  3  5  0
      2  5  2  5
      2  2  5  2
      0S  5  1  #`,
  },
  {
    name: "Pool 7",
    info: "5x4-p0,0;3,4, 21 moves, 6 pushes, 8 traps, 1 way, mid-tier",
    solution: "RRURRUUULLLDDRRUUUUUR",
    text: `
      #  5  4  0  E
      2  4  2  4  0
      5  4  5  2  4
      1S  1  3  0  #`,
  },
  {
    name: "Pool 8",
    info: "4x5-p0,0;4,3, 20 moves, 7 pushes, 5 traps, 1 way, mid-tier",
    solution: "UUURRRRULLLUURRRRRRU",
    text: `
      #  5  0  E
      0  3  5  0
      2  5  2  5
      2  2  5  2
      0S  4  2  #`,
  },
  {
    name: "Pool 9",
    info: "4x5-p2,0;2,3, 23 moves, 6 pushes, 7 traps, 1 way, mid-tier",
    solution: "RRRRULDLLUURULUULURRRRR",
    text: `
      0  3  0  E
      1  3  4  0
      #  0  2  #
      4  4  4  0
      0S  3  0  0`,
  },
  {
    name: "Pool 10",
    info: "5x4-p0,0;3,4, 22 moves, 7 pushes, 8 traps, 1 way, mid-tier",
    solution: "RRURRUUULLLLDDRRUUUUUR",
    text: `
      #  4  4  0  E
      3  5  2  4  0
      3  4  5  2  5
      0S  1  3  0  #`,
  },
  {
    name: "Pool 11",
    info: "5x4-p0,1;3,3, 23 moves, 8 pushes, 6 traps, 3 ways, mid-tier",
    solution: "UUDRRULURRURDRRUURDRRUU",
    text: `
      3  #  4  0  E
      4  0  5  5  0
      0  4  0  3  1
      1S  3  5  #  1`,
  },
  {
    name: "Pool 12",
    info: "5x5-p0,0;4,4, 26 moves, 8 pushes, 8 traps, 2 ways, hard-tier",
    solution: "UUUURRRDDDDLRULURRULUURRRU",
    text: `
      #  3  4  0  E
      0  3  0  2  0
      0  4  0  3  5
      3  0  2  4  5
      1S  5  0  2  #`,
  },
  {
    name: "Pool 13",
    info: "4x6-p2,2;3,1, 34 moves, 8 pushes, 5 traps, 1 way, hard-tier",
    solution: "RRRRRRUULDRDLLLLUUUURRRLDDDRRURUUU",
    text: `
      1  3  1  E
      2  5  5  0
      5  1  #  2
      3  #  1  1
      4  2  5  2
      0S  4  3  2`,
  },
  {
    name: "Pool 14",
    info: "6x4-p0,3;3,2, 34 moves, 12 pushes, 8 traps, 1 way, hard-tier",
    solution: "UURUURRRRDDRRRLURRDRUUULDDRRUUUUUR",
    text: `
      0  5  1  #  0  E
      3  4  2  4  5  0
      1  4  0  0  4  3
      1S  4  #  1  3  4`,
  },
  {
    name: "Pool 15",
    info: "6x4-p0,3;3,2, 39 moves, 13 pushes, 8 traps, 2 ways, hard-tier",
    solution: "UURUURRRDDRRRRUULDLLUURDRRUULDDRRUUUUUR",
    text: `
      0  4  1  #  0  E
      3  4  2  5  4  0
      1  4  0  0  4  3
      1S  2  #  1  3  4`,
  },
];
