// Approved levels for the "line push" variant (see README's Mechanics --
// step(..., { linePush: true }); a push only ever reaches you and the square
// past the pile, and fails outright with no room there). Same level-text
// format as levels.js. Not yet wired into a page of their own -- for now,
// play them via test.html or pool.html with the "Line push" checkbox on.
//
// Levels 1-3: "going around in circles" -- a ring-shaped room (a wall block
// splits it into a loop: a top corridor, a single-cell connector down each
// side, and a fully open bottom row). The top alone can't quite reach the
// exit; looping down one connector, across the bottom, and up the other
// reaches it from the far side instead.
//
// Level 1 (Michael's own hand-design, smallest of the three) is built around
// a genuine *trap* rather than a dead end: one push along the top row is
// real and tempting (it gets you most of the way, looking clean) but
// continuing is a fatal drop, so you have to notice and retreat instead. The
// point of the loop isn't routing around a wall -- the connector cell next
// to the exit gets fed from *both* directions: the abandoned top push
// leaves it one short, and pushing the same connector again from below
// (after the loop) supplies exactly the rest. Proven in 24 states; the same
// shortest solution also works under plain push, so unlike Levels 2 and 3
// this one isn't relying on line push's directional blocking to force the
// loop.
//
// Levels 2 and 3 are a size up (6x4): Level 2 just needs the loop (top alone
// can't reach the exit). Level 3 is the fuller variant Michael asked for --
// loop all the way back to the start side and push again from there -- found
// by filtering random search for that exact shape of solution (about 1 in
// 800,000 boards matched); its actual solution goes further than asked,
// looping the bottom corridor twice, there and back, before finishing via
// the top.
//
// Levels 4-6, from the initial 4x4 pool batch (plain room, no walls, entry
// lower-left, exit upper-right): kept as found (2 pushes, no traps -- a thin
// warm-up); tightened by walling off decoy cells identified by hand (see
// experiments/analyse.js's traps measure) that don't change the solution:
// Level 5 lost the single cell at (2,3); Level 6 lost the whole bottom-right
// corner, (2,3)/(3,2)/(3,3) together. Both keep their original solution
// exactly, with the traps that made them interesting intact.
const LEVELS_LINEPUSH = [
  {
    name: "Level 1",
    info: "5x4 ring room, 2 pushes, 15 moves, proven -- a real trap (one clean push, then a fatal drop) rather than a dead end",
    solution: "RRRLLDDRRRRUUUU",
    text: `
      #  #  #  #  E
      2S  2  2  4  0
      1  #  #  #  4
      0  0  0  0  1`,
  },
  {
    name: "Level 2",
    info: "6x4 ring room, 2 pushes, 17 moves -- needs the loop (top alone can't reach the exit)",
    solution: "RRDLLDDDRRRRRRUUU",
    text: `
      0S  0  0  2  #  E
      2  2  1  0  0  3
      4  #  #  #  #  3
      2  2  3  2  4  1`,
  },
  {
    name: "Level 3",
    info: "6x4 ring room, 6 pushes, 34 moves -- loops the bottom corridor twice before finishing via the top",
    solution: "RDRRULDRLDDRRRRRRRULLLLLUURRRRRRU",
    text: `
      0S  0  1  0  #  E
      2  0  1  4  0  0
      2  #  #  #  #  4
      1  1  1  3  3  1`,
  },
  {
    name: "Level 4",
    info: "4x4, 2 pushes, 8 moves",
    solution: "UUUURURR",
    text: `
      5  1  1  E
      0  1  3  0
      5  3  4  4
      0S  2  4  5`,
  },
  {
    name: "Level 5",
    info: "4x4, 5 pushes, 15 moves, 2 traps",
    solution: "UUURDRRRUULURRU",
    text: `
      0  5  4  E
      4  2  0  2
      4  4  4  #
      0S  1  3  1`,
  },
  {
    name: "Level 6",
    info: "4x4, 8 pushes, 22 moves, 5 traps",
    solution: "RULURURDLUUURULUURRRRR",
    text: `
      0  5  1  E
      4  5  5  1
      1  4  5  #
      0S  0  #  #`,
  },
];
