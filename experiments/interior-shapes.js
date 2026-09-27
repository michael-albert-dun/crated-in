// The 3x3 room with both entry and exit as interior cells (no exterior pendant),
// up to the room's dihedral symmetry, excluding placements where S and E are
// directly adjacent (those solve in a handful of moves and aren't interesting).
// 12 raw orbits of (S, E) pairs; 4 are adjacent-cell pairs, leaving 8.
//
//   node experiments/interior-shapes.js   lists them as SHAPES keys icfg1..icfg8
const POINTS = [];
for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) POINTS.push([r, c]);
const idx = new Map(POINTS.map((p, i) => [p.join(","), i]));

const rot90 = ([r, c]) => { const dr = r - 1; const dc = c - 1; return [dc + 1, -dr + 1]; };
const mirror = ([r, c]) => [r, 2 - c];
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

const manhattan = ([r1, c1], [r2, c2]) => Math.abs(r1 - r2) + Math.abs(c1 - c2);
const REPS = orbitReps().filter(([s, e]) => manhattan(s, e) > 1);

function buildShape([sr, sc], [er, ec]) {
  const grid = Array.from({ length: 3 }, () => Array(3).fill("."));
  grid[sr][sc] = "S";
  grid[er][ec] = "E";
  return grid.map((row) => row.join(" "));
}

const SHAPES = {};
REPS.forEach(([s, e], i) => { SHAPES[`icfg${i + 1}`] = buildShape(s, e); });

if (require.main === module) {
  REPS.forEach(([s, e], i) => console.log(`icfg${i + 1}: S ${s} E ${e}\n` + SHAPES[`icfg${i + 1}`].join("\n") + "\n"));
  console.log(`${REPS.length} configurations`);
}

module.exports = { SHAPES, POINTS, REPS };
