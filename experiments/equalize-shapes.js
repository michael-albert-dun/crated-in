// Room shapes for the "equalise" win-condition variant: win by reflooring the
// whole board flat, instead of walking to an exit (see engine.js's isFlat and
// reverse-equalize.js, which builds levels on these shapes). Rows of "." (open)
// and "#" (wall). No S or E marker: unlike shape-levels.js's SHAPES, these carry
// no entry or exit gate, since reverse-equalize.js picks the start cell itself
// while constructing a level backward from an already-flat board.
const SHAPES = {
  // The tutorial shape: a plain 3x3, fully open. A push from any edge-middle
  // cell against the centre reaches all four arms in one move; whether that
  // also reaches the corners (and so equalises the whole board) depends only
  // on the heights, which is exactly what reverse-equalize.js searches for.
  square3: [". . .", ". . .", ". . ."],
};

module.exports = { SHAPES };
