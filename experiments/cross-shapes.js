// The 17 essentially-different placements of the entry and exit on the perimeter
// of a plain 3x3 room, up to the room's dihedral symmetry (4 rotations x 2
// reflections). There are 12 possible attachment points around the room (three
// per side: the two corners, each attachable from either of its two outward
// sides, plus the one middle-of-side cell), so 12x11 ordered (entry, exit) pairs,
// which the symmetry group collapses to 17 orbits.
//
//   node experiments/cross-shapes.js   lists them (as "SHAPES" keys cfg1..cfg17)
//
// Exposes SHAPES (same shape-text format as shape-levels.js: "." open, "#" wall,
// "S" start, "E" exit), for both shape-levels.js (merged into its own SHAPES) and
// exhaust-shape.js's --shape flag.
const POINTS = [];
for (let c = 1; c <= 3; c += 1) POINTS.push([0, c]);
for (let c = 1; c <= 3; c += 1) POINTS.push([4, c]);
for (let r = 1; r <= 3; r += 1) POINTS.push([r, 0]);
for (let r = 1; r <= 3; r += 1) POINTS.push([r, 4]);
const idx = new Map(POINTS.map((p, i) => [p.join(","), i]));

const rot90 = ([r, c]) => { const dr = r - 2; const dc = c - 2; return [dc + 2, -dr + 2]; };
const mirror = ([r, c]) => [r, 4 - c];
const rotk = (p, k) => { let x = p; for (let i = 0; i < k; i += 1) x = rot90(x); return x; };
const GROUP = [];
for (let k = 0; k < 4; k += 1) { GROUP.push((p) => rotk(p, k)); GROUP.push((p) => mirror(rotk(p, k))); }

function orbitReps() {
  const n = POINTS.length;
  const pairIndex = (a, b) => a * n + b;
  const parent = Array.from({ length: n * n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (x, y) => { x = find(x); y = find(y); if (x !== y) parent[x] = y; };
  for (let a = 0; a < n; a += 1) {
    for (let b = 0; b < n; b += 1) {
      if (a === b) continue;
      for (const g of GROUP) {
        const ga = idx.get(g(POINTS[a]).join(","));
        const gb = idx.get(g(POINTS[b]).join(","));
        union(pairIndex(a, b), pairIndex(ga, gb));
      }
    }
  }
  const seen = new Set();
  const reps = [];
  for (let a = 0; a < n; a += 1) {
    for (let b = 0; b < n; b += 1) {
      if (a === b) continue;
      const root = find(pairIndex(a, b));
      if (seen.has(root)) continue;
      seen.add(root);
      reps.push([POINTS[a], POINTS[b]]);
    }
  }
  return reps;
}

function buildShape([sr, sc], [er, ec]) {
  const grid = Array.from({ length: 5 }, () => Array(5).fill("#"));
  for (let r = 1; r <= 3; r += 1) for (let c = 1; c <= 3; c += 1) grid[r][c] = ".";
  grid[sr][sc] = "S";
  grid[er][ec] = "E";
  return grid.map((row) => row.join(" "));
}

const REPS = orbitReps();
const SHAPES = {};
REPS.forEach(([s, e], i) => {
  SHAPES[`cfg${i + 1}`] = buildShape(s, e);
});

if (require.main === module) {
  REPS.forEach(([s, e], i) => console.log(`cfg${i + 1}: S ${s} E ${e}\n` + SHAPES[`cfg${i + 1}`].join("\n") + "\n"));
  console.log(`${REPS.length} configurations`);
}

module.exports = { SHAPES, POINTS, REPS };
