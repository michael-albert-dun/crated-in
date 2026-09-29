// Whether a solution genuinely uses a given region of cells: walks onto at
// least one of them, or launches a push from one of them (receiving a copy
// from someone else's push doesn't count -- that can happen to an otherwise
// untouched decoy). Useful when a shape has a whole branch (a side room, a
// tower) that a search could easily route around entirely, leaving it as
// pure decoration; this lets a search or a picker require it be load-bearing.
//
//   const { touchesRegion } = require("./region.js");
//   touchesRegion(level, moves, cellIndexes) -> boolean
const { createState, step, DIRS } = require("../src/engine.js");

function touchesRegion(level, moves, cells) {
  const region = new Set(cells);
  let state = createState(level);
  if (region.has(state.pos)) return true;
  for (const m of moves) {
    const d = DIRS.findIndex((dir) => dir.name === m);
    if (region.has(level.nbrs[state.pos][d])) return true; // launched a push from here, or walked onto it
    const out = step(level, state, d);
    state = out.state;
    if (region.has(state.pos)) return true;
  }
  return false;
}

module.exports = { touchesRegion };
