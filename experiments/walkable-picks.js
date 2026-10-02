// Walkable-goal candidates from experiments/walkable-corners.js (2026-10-01).
const POOL = [
  {
    name: "Walk 1",
    info: "4x4, 14 moves, 4 pushes, 4 traps, 1 way, easy-tier",
    solution: "DLUUUDLLURUURR",
    text: `
      4  1  4  2
      5  0  2  3
      0  0  2  1S
      1  2  0  0`,
  },
  {
    name: "Walk 2",
    info: "4x4, 17 moves, 5 pushes, 9 traps, 1 way, mid-tier",
    solution: "LLLLDLDRDDRURDLUU",
    text: `
      3  3  2  0S
      1  2  4  4
      5  1  3  2
      3  2  3  1`,
  },
  {
    name: "Walk 3",
    info: "5x4, 19 moves, 6 pushes, 6 traps, 1 way, mid-tier",
    solution: "UUDRURRRRUUULLDLDDR",
    text: `
      3  2  3  1  1
      5  0  1  4  3
      1  1  0  1  1
      2S  5  4  0  4`,
  },
  {
    name: "Walk 4",
    info: "5x5, 22 moves, 7 pushes, 8 traps, 2 ways, hard-tier",
    solution: "RRDDDDLLDDRUULULDRDUUR",
    text: `
      3  0  4S  3  2
      3  2  1  0  4
      0  0  1  2  1
      5  4  1  0  4
      4  2  0  3  0`,
  },
  {
    name: "Walk 5",
    info: "5x5, 22 moves, 7 pushes, 8 traps, 4 ways, hard-tier",
    solution: "RRDDDDLDLDRULULULDRUUR",
    text: `
      3  0  3S  3  2
      3  2  1  1  4
      0  0  1  2  1
      4  4  1  1  4
      4  2  0  4  0`,
  },
  {
    name: "Walk 6",
    info: "4x4, 23 moves, 8 pushes, 6 traps, 1 way, mid-tier",
    solution: "DLULLLDRDDLURDLLLUULLDD",
    text: `
      4  1  4  2
      4  5  3  0S
      4  3  2  2
      0  2  4  2`,
  },
  {
    name: "Walk 7",
    info: "5x4, 24 moves, 8 pushes, 6 traps, 2 ways, mid-tier",
    solution: "DLLUURURRDURRDDLDDLRUUUU",
    text: `
      1  3  2  1  2
      3  1  0  2  4
      1  4  2S  1  4
      2  1  2  1  1`,
  },
  {
    name: "Walk 8",
    info: "5x4, 32 moves, 8 pushes, 10 traps, 1 way, hard-tier",
    solution: "DRUDLLULLURURDDDDLLURDURDRDLURRR",
    text: `
      3  1  0  4  1
      1  0  3  1S  5
      2  2  3  1  2
      1  4  4  4  3`,
  },
  {
    name: "Walk 9",
    info: "4x4, 32 moves, 9 pushes, 8 traps, 1 way, hard-tier",
    solution: "LURUULUURRDDLULDLUULUUURRLDRRULD",
    text: `
      1  1  5  2
      4  4  4  5
      0  4  3  4
      4  0  1S  3`,
  },
  {
    name: "Walk 10",
    info: "5x4, 34 moves, 10 pushes, 10 traps, 1 way, hard-tier",
    solution: "DRUDLLLLULLURURDDDDLLURDURDRDLURRR",
    text: `
      3  1  0  4  0
      1  0  3  1S  4
      2  2  3  1  1
      3  4  4  4  2`,
  },
  {
    name: "Walk 11",
    info: "5x4, 35 moves, 10 pushes, 8 traps, 1 way, hard-tier",
    solution: "RURRRDULDLLDRLUUURRRDLLDDRRDRULLUUR",
    text: `
      2  1  4  2  4
      5  0  0  2  0
      2S  1  4  4  3
      3  5  2  0  4`,
  },
  {
    name: "Walk 12",
    info: "5x4, 39 moves, 11 pushes, 8 traps, 1 way, hard-tier",
    solution: "UDLLLULLDRRRRULLURURDDDDLLURDURDRDLURRR",
    text: `
      3  1  0  4  0
      1  0  3  0  3
      2  2  3  1  1S
      1  4  3  4  2`,
  },
];
