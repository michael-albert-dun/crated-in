// Whole-level analysis: explores every reachable state (not just until the first
// win) so a level can be judged on more than the length of its shortest solution.
//
//   const { analyse } = require("./analyse.js");
//   analyse(level, { justEnough, maxHeight, maxStates })
//
// Piles above maxHeight are treated as out of bounds (no sensible solution
// needs them); heightCuts says how many moves that dropped. Returns null if the
// state limit was hit (the numbers would be misleading), otherwise
//   solvable        the room can be escaped from the start
//   states          reachable states
//   length, pushes  of one shortest solution (including the final step out)
//   ways            number of distinct shortest solutions (capped at 1e9)
//   traps           moves along that solution that lead to a state you can no
//                   longer escape from: the tempting mistakes on the way
//   deadFraction    share of reachable states from which escape is impossible
//   revisit         share of the solution's squares visited more than once
//                   (high means shuffling back and forth: grinding)
//   walkable        the exit can be reached by walking alone (no pushes needed)
//   pushCells       distinct piles pushed against in the solution
//   openCells       cells that aren't walls
//   unused          open cells the solution never touches: it doesn't walk on
//                   them, push against them, or have them receive a copy from a
//                   push (so a cul-de-sac you visit to push a pile out counts)
//   disconnected    open cells that can't be reached from the start even by
//                   walking with no height limit (enclosed by walls)
const { createState, step, DIRS } = require("../src/engine.js");

function keyOf(state) {
  return String.fromCharCode(state.pos, ...state.h);
}

function analyse(level, opts = {}) {
  const { maxHeight = 6, maxStates = 500000, justEnough = false } = opts;
  const first = opts.from || createState(level);
  const openCells = level.wall.reduce((count, w) => count + (w ? 0 : 1), 0);
  const reach = new Set([level.start]);
  for (const cell of reach) for (const n of level.nbrs[cell]) if (n >= 0) reach.add(n);
  const disconnected = openCells - reach.size;
  const states = [first];
  const seen = new Map([[keyOf(first), 0]]);
  const dist = [0];
  const parent = [-1];
  const moveIn = [-1];
  const pushIn = [false];
  const succ = []; // succ[i] = [{ to, push }] for the moves that stay in the room
  const winMove = []; // winMove[i] = direction of the winning move, or -1
  let capped = false; // the state limit was hit: the numbers can't be trusted
  let heightCuts = 0; // moves dropped for building a pile above maxHeight

  for (let head = 0; head < states.length; head += 1) {
    const state = states[head];
    succ[head] = [];
    winMove[head] = -1;
    for (let d = 0; d < DIRS.length; d += 1) {
      const out = step(level, state, d, { justEnough });
      if (out.result === "blocked" || out.result === "died") continue;
      if (out.result === "won") {
        winMove[head] = d;
        continue;
      }
      if (out.result === "pushed" && Math.max(...out.state.h) > maxHeight) {
        heightCuts += 1;
        continue;
      }
      const key = keyOf(out.state);
      let to = seen.get(key);
      if (to === undefined) {
        if (states.length >= maxStates) {
          capped = true;
          continue;
        }
        to = states.length;
        seen.set(key, to);
        states.push(out.state);
        dist.push(dist[head] + 1);
        parent.push(head);
        moveIn.push(d);
        pushIn.push(out.result === "pushed");
      }
      succ[head].push({ to, push: out.result === "pushed", d });
    }
  }
  if (capped) return null;

  const n = states.length;
  // Which states can still escape: walk the move graph backwards from the wins.
  const preds = Array.from({ length: n }, () => []);
  succ.forEach((edges, from) => edges.forEach(({ to }) => preds[to].push(from)));
  const canWin = new Uint8Array(n);
  const queue = [];
  for (let i = 0; i < n; i += 1) {
    if (winMove[i] >= 0) {
      canWin[i] = 1;
      queue.push(i);
    }
  }
  for (let q = 0; q < queue.length; q += 1) {
    for (const p of preds[queue[q]]) {
      if (!canWin[p]) {
        canWin[p] = 1;
        queue.push(p);
      }
    }
  }
  const solvable = canWin[0] === 1;
  const alive = canWin.reduce((a, b) => a + b, 0);
  const result = { solvable, states: n, heightCuts, deadFraction: 1 - alive / n, openCells, disconnected };
  if (!solvable) return result;

  // Shortest solutions: BFS order means dist is non-decreasing, so one forward
  // pass counts the paths through the shortest-path DAG.
  let best = Infinity;
  for (let i = 0; i < n; i += 1) if (winMove[i] >= 0) best = Math.min(best, dist[i]);
  const ways = new Float64Array(n);
  ways[0] = 1;
  for (let i = 0; i < n; i += 1) {
    if (dist[i] >= best) continue;
    for (const { to } of succ[i]) {
      if (dist[to] === dist[i] + 1) ways[to] = Math.min(1e9, ways[to] + ways[i]);
    }
  }
  let totalWays = 0;
  let end = -1;
  for (let i = 0; i < n; i += 1) {
    if (winMove[i] >= 0 && dist[i] === best) {
      totalWays = Math.min(1e9, totalWays + ways[i]);
      if (end < 0) end = i;
    }
  }

  const path = [];
  for (let i = end; i >= 0; i = parent[i]) path.push(i);
  path.reverse();
  let traps = 0;
  let pushes = 0;
  const pushedPiles = new Set();
  path.forEach((i, k) => {
    for (const { to } of succ[i]) if (!canWin[to]) traps += 1;
    if (k > 0 && pushIn[i]) {
      pushes += 1;
      pushedPiles.add(states[path[k - 1]].pos * 100 + moveIn[i]);
    }
  });
  const cells = new Set(path.map((i) => states[i].pos));
  const touched = new Set(cells);
  path.forEach((i, k) => {
    if (k > 0 && pushIn[i]) {
      const pile = level.nbrs[states[path[k - 1]].pos][moveIn[i]];
      touched.add(pile);
      for (const nb of level.nbrs[pile]) if (nb >= 0) touched.add(nb);
    }
  });

  // Could you just walk out? Follow walking edges only (heights don't change).
  const walkSeen = new Set([0]);
  const walkQueue = [0];
  let walkable = false;
  for (let q = 0; q < walkQueue.length && !walkable; q += 1) {
    const i = walkQueue[q];
    if (winMove[i] >= 0) walkable = true;
    for (const { to, push } of succ[i]) {
      if (!push && !walkSeen.has(to)) {
        walkSeen.add(to);
        walkQueue.push(to);
      }
    }
  }

  return {
    ...result,
    length: best + 1,
    pushes,
    ways: totalWays,
    traps,
    revisit: 1 - cells.size / path.length,
    walkable,
    pushCells: pushedPiles.size,
    unused: openCells - touched.size,
  };
}

module.exports = { analyse };
