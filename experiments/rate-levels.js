// Prints the analysis metrics for every level in src/levels.js, to see what the
// measures say about levels we already like or dislike.
//
//   node experiments/rate-levels.js
const fs = require("fs");
const path = require("path");
const { parseLevel } = require("../src/engine.js");
const { analyse } = require("./analyse.js");

const LEVELS = new Function(fs.readFileSync(path.join(__dirname, "../src/levels.js"), "utf8") + "; return LEVELS;")();

console.log("level  size  moves pushes cells  ways traps  dead%  revisit unused% disc  states");
LEVELS.forEach((lv, i) => {
  const level = parseLevel(lv.text);
  const a = analyse(level);
  if (!a) return console.log(`${i + 1}  (state cap hit)`);
  console.log(
    [
      String(i + 1).padStart(5),
      `${level.width}x${level.height}`.padStart(5),
      String(a.length).padStart(6),
      String(a.pushes).padStart(6),
      String(a.pushCells).padStart(5),
      String(a.ways).padStart(6),
      String(a.traps).padStart(5),
      (a.deadFraction * 100).toFixed(0).padStart(6),
      a.revisit.toFixed(2).padStart(8),
      ((100 * a.unused) / a.openCells).toFixed(0).padStart(7),
      String(a.disconnected).padStart(5),
      String(a.states).padStart(7),
    ].join(" "),
  );
});
