// How many distinct shortest solutions are there, once you stop counting a
// different route through the "seed" (the region reachable by walking alone,
// with no push) as a different solution?
//
// analyse()'s `ways` counts raw move-sequences, which overcounts badly whenever
// several cells in the currently-walkable region are all equally good places to
// stand: walking to the push by one route rather than another isn't a different
// plan, and which of the pushed pile's neighbours you happened to be standing on
// doesn't matter either, since a push spreads to every one of its open
// neighbours regardless of which side you pushed from. What actually
// distinguishes two solutions is the ordered list of pushes, each one identified
// by (the cell you launched it from, the pile you pushed) -- not the pile alone:
// a push never moves you, so pushing the same pile from a different neighbour
// leaves you standing somewhere genuinely different afterward (even though the
// pile's spread is identical either way), which can open or close off different
// follow-up moves. Walking to the *same* launch cell by a different route of the
// same length is the actual redundancy this collapses, since that reaches the
// identical state regardless of which route was taken.
//
// This does not attempt the harder question of whether two push orders commute
// (push A then B reaching the same position as B then A): those still count as
// two distinct sequences here, which may still overcount a little, but far less
// than raw move-sequences do.
//
//   const { pushWays } = require("./push-ways.js");
//   pushWays(level, { maxStates, maxHeight, capSequences })
// Returns null if the state cap was hit. `overflow: true` means the sequence
// count passed capSequences and searching stopped early (a lower bound, not exact).
const { createState, step, DIRS } = require("../src/engine.js");

function keyOf(state) {
  return String.fromCharCode(state.pos, ...state.h);
}

function pushWays(level, opts = {}) {
  const { maxStates = 300000, maxHeight = 9, capSequences = 20000 } = opts;
  const first = createState(level);
  const states = [first];
  const seen = new Map([[keyOf(first), 0]]);
  const dist = [0];
  const succ = [];
  const winMove = [];
  let capped = false;

  for (let head = 0; head < states.length; head += 1) {
    const state = states[head];
    succ[head] = [];
    winMove[head] = -1;
    for (let d = 0; d < DIRS.length; d += 1) {
      const out = step(level, state, d);
      if (out.result === "blocked" || out.result === "died") continue;
      if (out.result === "won") {
        winMove[head] = d;
        continue;
      }
      if (out.result === "pushed" && Math.max(...out.state.h) > maxHeight) continue;
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
      }
      const pile = out.result === "pushed" ? level.nbrs[state.pos][d] : -1;
      succ[head].push({ to, push: out.result === "pushed", pile, from: state.pos });
    }
  }
  if (capped) return null;

  let best = Infinity;
  for (let i = 0; i < states.length; i += 1) if (winMove[i] >= 0) best = Math.min(best, dist[i]);
  if (best === Infinity) return { solvable: false, length: -1, pushSequences: 0, overflow: false };

  // seqSets[i]: the distinct push-sequences (as comma-joined pile indices) that
  // reach state i along some shortest path. Processed in BFS discovery order, so
  // every predecessor of a state is already finished by the time it's needed.
  const seqSets = new Array(states.length);
  seqSets[0] = new Set([""]);
  let overflow = false;
  for (let i = 0; i < states.length; i += 1) {
    if (dist[i] >= best || !seqSets[i]) continue;
    if (seqSets[i].has("...")) {
      // This state's own set already overflowed: propagate the overflow marker,
      // not the (incomplete) set, rather than pay to copy it further.
      for (const { to } of succ[i]) {
        if (dist[to] !== dist[i] + 1) continue;
        if (!seqSets[to]) seqSets[to] = new Set();
        seqSets[to].add("...");
      }
      overflow = true;
      continue;
    }
    for (const { to, push, pile, from } of succ[i]) {
      if (dist[to] !== dist[i] + 1) continue;
      if (!seqSets[to]) seqSets[to] = new Set();
      const target = seqSets[to];
      const token = `${from}>${pile}`;
      for (const seq of seqSets[i]) {
        target.add(push ? (seq ? `${seq},${token}` : token) : seq);
      }
      if (target.size > capSequences) {
        overflow = true;
        target.clear();
        target.add("...");
      }
    }
  }

  const finalSeqs = new Set();
  let sawOverflow = overflow;
  for (let i = 0; i < states.length; i += 1) {
    if (winMove[i] < 0 || dist[i] !== best || !seqSets[i]) continue;
    for (const seq of seqSets[i]) {
      if (seq === "...") sawOverflow = true;
      else finalSeqs.add(seq);
    }
  }
  return { solvable: true, length: best + 1, pushSequences: finalSeqs.size, overflow: sawOverflow };
}

module.exports = { pushWays };
