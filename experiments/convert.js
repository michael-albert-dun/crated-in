// Converts a level from the gate model ("T" plus a side letter: a doorway beside
// the target) to the exit-cell model ("E": a column of light you step onto from
// any open neighbour). The exit cell goes where the gate was: in place of the wall
// cell for a tunnel, or in a new row or column added outside the room for a gap in
// the edge. The target cell becomes an ordinary cell.
//
// The entry gate side letter on S is dropped too.
//
// A tunnel whose wall cell touches other open cells would turn those into extra
// ways to the exit, changing the level, so such an exit is first moved to an edge
// side of the target if it has one (the solution is unchanged, only its last
// letter). Throws if that isn't possible.
const { parseLevel, solve, formatLevel, exitDirs, outerWalls, DIRS } = require("../src/engine.js");

function toExitCell(text) {
  let level = parseLevel(text);
  if (level.exit >= 0) return formatLevel(parseLevel(text.replace(/S[UDLR]/g, "S")));
  const W = level.width;
  const H = level.height;
  const rows = text.trim().split("\n").map((line) => line.trim().split(/\s+/));
  const tr = Math.floor(level.target / W);
  const tc = level.target % W;
  let dir = level.exitDir;
  const spot = (d) => [tr + DIRS[d].dr, tc + DIRS[d].dc];
  const inside = (r, c) => r >= 0 && r < H && c >= 0 && c < W;
  const extraOpen = (d) => {
    const [er, ec] = spot(d);
    if (!inside(er, ec)) return 0;
    return DIRS.filter(({ dr, dc }) => inside(er + dr, ec + dc) && !level.wall[(er + dr) * W + ec + dc] && (er + dr) * W + ec + dc !== level.target).length;
  };
  if (extraOpen(dir) > 0) {
    const options = exitDirs(W, H, level.wall, level.target, outerWalls(W, H, level.wall)).filter((d) => !inside(...spot(d)));
    if (!options.length) throw new Error("No edge exit to move to");
    dir = options[0];
  }
  const grid = rows.map((row) => row.slice());
  grid[tr][tc] = grid[tr][tc].replace(/[TS].*$/, ""); // the target is an ordinary cell now
  const [er, ec] = spot(dir);
  let out;
  if (inside(er, ec)) {
    grid[er][ec] = "E";
    out = grid;
  } else {
    const wallRow = () => Array(grid[0].length).fill("#");
    if (dir === 0) out = [wallRow(), ...grid];
    else if (dir === 1) out = [...grid, wallRow()];
    else out = grid.map((row) => row.slice());
    if (dir === 0) out[0][tc] = "E";
    else if (dir === 1) out[out.length - 1][tc] = "E";
    else if (dir === 2) out = out.map((row, r) => ["#", ...row]).map((row, r) => (r === tr ? ["E", ...row.slice(1)] : row));
    else out = out.map((row, r) => [...row, r === tr ? "E" : "#"]);
  }
  // There is no entry doorway any more (you arrive on a column of light), so the start needs no side letter.
  const converted = formatLevel(parseLevel(out.map((row) => row.join(" ").replace(/S[UDLR]/, "S")).join("\n")));
  const before = solve(level);
  const after = solve(parseLevel(converted));
  if (before.status !== "solved" || after.status !== "solved" || before.moves.length !== after.moves.length) {
    throw new Error(`Conversion changed the level: ${before.moves && before.moves.length} -> ${after.moves && after.moves.length}`);
  }
  return converted;
}

module.exports = { toExitCell };
