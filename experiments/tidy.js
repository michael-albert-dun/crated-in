// Tidies a level the way we have been doing by hand, so generated candidates
// arrive without the faults Michael keeps spotting:
//   - alcove decoys: an open cell that can be turned into a wall without changing
//     the length of the shortest solution (it is somewhere to wander into, not a
//     part of the puzzle);
//   - all-wall border rows and columns left behind by that;
//   - a forced opening walk: the start has one open neighbour and the first move
//     just walks there, so the player could simply arrive one square further on.
//
//   const { tidy } = require("./tidy.js");
//   tidy(text) -> { text, removed, trimmed }
const { parseLevel, solve, createState, step, isValidExit, formatLevel, DIRS } = require("../src/engine.js");

const grid = (text) => text.trim().split("\n").map((line) => line.trim().split(/\s+/));
const toText = (rows) => formatLevel(parseLevel(rows.map((row) => row.join(" ")).join("\n")));

// Drops border rows and columns that are all wall.
function crop(rows) {
  let out = rows;
  const allWall = (cells) => cells.every((token) => token === "#");
  for (;;) {
    if (out.length && allWall(out[0])) out = out.slice(1);
    else if (out.length && allWall(out[out.length - 1])) out = out.slice(0, -1);
    else if (out.length && allWall(out.map((row) => row[0]))) out = out.map((row) => row.slice(1));
    else if (out.length && allWall(out.map((row) => row[row.length - 1]))) out = out.map((row) => row.slice(0, -1));
    else return out;
  }
}

// The forced opening of a solution: the leading moves made from cells with at
// most two open neighbours, up to the first junction (or the target). Returns
// null if there is none, else { moves, pos, prev, heights, behind } where `pos` is
// the junction, `prev` the cell we came from, `heights` the state there and
// `behind` the corridor cells left behind.
function forcedOpening(level, moves) {
  let state = createState(level);
  const visited = [];
  let prev = -1;
  let last = level.start;
  let count = 0;
  for (const m of moves) {
    const pos = state.pos;
    const degree = level.nbrs[pos].filter((n) => n >= 0).length;
    if (degree > 2 || pos === level.target) break;
    const out = step(level, state, DIRS.findIndex((dir) => dir.name === m));
    if (out.result === "won") break;
    if (!visited.includes(pos)) visited.push(pos);
    state = out.state;
    if (state.pos !== pos) {
      prev = pos;
      last = state.pos;
    }
    count += 1;
  }
  const pos = state.pos;
  if (count === 0 || prev < 0 || pos === level.start) return null;
  // Only trim if we stopped at a junction we can stand on.
  return { moves: count, pos, prev, heights: Array.from(state.h), behind: visited.filter((cell) => cell !== pos) };
}

// The forced closing of a solution: after the last junction (a cell with three
// or more open neighbours) the player walks, and pushes, along a corridor to the
// exit. If the exit could be on an earlier cell of that corridor, the rest of it
// only pads the level. Tries each corridor cell, earliest first, as the new target
// (with any valid gate side), walls the cells after it, and keeps the first
// version that still solves in fewer moves. If the whole route is corridor there
// is no puzzle at all and the trimmed level comes out tiny; the caller's window
// check then rejects it.
function trimClosing(rows, level, moves, maxStates) {
  let state = createState(level);
  const path = [state.pos];
  for (const m of moves) {
    const out = step(level, state, DIRS.findIndex((dir) => dir.name === m));
    state = out.state;
    if (path[path.length - 1] !== state.pos) path.push(state.pos);
  }
  if (path[path.length - 1] !== level.target) return null;
  const degree = (cell) => level.nbrs[cell].filter((n) => n >= 0).length;
  let junction = -1;
  path.forEach((cell, i) => {
    if (degree(cell) >= 3) junction = i;
  });
  const W = level.width;
  const at = (cell) => [Math.floor(cell / W), cell % W];
  for (let t = Math.max(0, junction); t < path.length - 1; t += 1) {
    const [tr, tc] = at(path[t]);
    const kept = new Set(path.slice(0, t + 1));
    for (const dir of DIRS) {
      const test = rows.map((row) => row.slice());
      const [or, oc] = at(level.target);
      test[or][oc] = "#";
      for (const cell of path.slice(t + 1)) {
        if (kept.has(cell)) continue;
        const [r, c] = at(cell);
        test[r][c] = "#";
      }
      test[tr][tc] = `${rows[tr][tc].replace(/\D.*$/, "")}T${dir.name}`;
      let trimmedLevel;
      try {
        trimmedLevel = parseLevel(test.map((row) => row.join(" ")).join("\n"));
      } catch (error) {
        continue;
      }
      const check = solve(trimmedLevel, { maxStates });
      if (check.status === "solved" && check.moves.length < moves.length) {
        return { rows: test, saved: moves.length - check.moves.length };
      }
    }
  }
  return null;
}

// Which states of the shortest solution have a real choice? A state is forced
// when the solution's move is the only move that leads somewhere new (not a state
// already on the path) from which the exit can still be reached. Moves that lead
// to dead states are the traps, and don't count as choices. Returns
// { opening, closing, choices, states }: how many states at the start and at
// the end of the path are forced, and how many in between are not.
function forcedRuns(level, moves, maxStates = 20000) {
  const keyOf = (state) => `${state.pos},${Array.from(state.h).join("")}`;
  const path = [createState(level)];
  for (const m of moves) {
    const out = step(level, path[path.length - 1], DIRS.findIndex((dir) => dir.name === m));
    if (out.result === "won") break;
    path.push(out.state);
  }
  const onPath = new Set(path.map(keyOf));
  const forced = path.map((state) => {
    let live = 0;
    for (let d = 0; d < 4; d += 1) {
      const out = step(level, state, d);
      if (out.result === "blocked" || out.result === "died") continue;
      if (out.result === "won") { live += 1; continue; }
      if (onPath.has(keyOf(out.state)) && keyOf(out.state) !== keyOf(path[path.indexOf(state) + 1] || state)) continue;
      const rest = solve(level, { from: out.state, maxStates });
      if (rest.status === "solved" || rest.status === "unknown") live += 1;
    }
    return live <= 1;
  });
  let opening = 0;
  while (opening < forced.length && forced[opening]) opening += 1;
  let closing = 0;
  while (closing < forced.length - opening && forced[forced.length - 1 - closing]) closing += 1;
  const choices = forced.length - opening - closing;
  return { opening, closing, choices, states: forced.length, path };
}

function tidy(text, { maxStates = 400000 } = {}) {
  let rows = grid(text);
  const removed = [];
  let trimmed = 0;
  for (let changed = true; changed;) {
    changed = false;
    const base = solve(parseLevel(rows.map((r) => r.join(" ")).join("\n")), { maxStates });
    if (base.status !== "solved") break;
    // Alcove decoys.
    outer: for (let r = 0; r < rows.length; r += 1) {
      for (let c = 0; c < rows[0].length; c += 1) {
        if (/^#|[ST]/.test(rows[r][c])) continue;
        const test = rows.map((row) => row.slice());
        test[r][c] = "#";
        let level;
        try {
          level = parseLevel(test.map((row) => row.join(" ")).join("\n"));
        } catch (error) {
          continue; // the wall would break a gate
        }
        const result = solve(level, { maxStates });
        if (result.status === "solved" && result.moves.length === base.moves.length) {
          removed.push([r, c, rows[r][c]]);
          rows = crop(test);
          changed = true;
          break outer;
        }
      }
    }
    if (changed) continue;
    // Forced runs: states at either end of the solution where the solution's move
    // is the only live one (see forcedRuns). The puzzle starts at the first real
    // choice and ends at the last, so move the start there, and the exit back to
    // the last choice, walling the corridor cells that are left over.
    const level = parseLevel(rows.map((r) => r.join(" ")).join("\n"));
    const runs = forcedRuns(level, base.moves);
    const W = level.width;
    const at = (cell) => [Math.floor(cell / W), cell % W];
    const cellsOf = (from, to) => runs.path.slice(from, to).map((state) => state.pos);
    if (runs.opening > 0 && runs.opening < runs.states - 1) {
      const first = runs.path[runs.opening];
      const behind = cellsOf(0, runs.opening).filter((cell) => cell !== first.pos);
      const lastOther = [...cellsOf(0, runs.opening)].reverse().find((cell) => cell !== first.pos);
      if (lastOther !== undefined) {
        const test = rows.map((row) => row.slice());
        for (const cell of behind) {
          const [r, c] = at(cell);
          test[r][c] = "#";
        }
        const [nr, nc] = at(first.pos);
        const [pr, pc] = at(lastOther);
        const towards = DIRS.find((dir) => nr + dir.dr === pr && nc + dir.dc === pc);
        if (towards) {
          test[nr][nc] = `${first.h[first.pos]}S${towards.name}`;
          first.h.forEach((h, i) => {
            const [r, c] = at(i);
            if (test[r][c] !== "#" && i !== first.pos) test[r][c] = test[r][c].replace(/^\d+/, String(h));
          });
          try {
            const check = solve(parseLevel(test.map((row) => row.join(" ")).join("\n")), { maxStates });
            if (check.status === "solved" && check.moves.length === base.moves.length - runs.opening) {
              rows = crop(test);
              trimmed += runs.opening;
              changed = true;
            }
          } catch (error) {
            // No valid gate there; keep the opening.
          }
        }
      }
    }
    if (changed) continue;
    if (runs.closing > 1 && runs.opening + runs.closing < runs.states) {
      const idx = runs.states - runs.closing;
      const closingCells = new Set(cellsOf(idx, runs.states));
      const keep = new Set(cellsOf(0, idx + 1));
      const target = runs.path[idx].pos;
      for (const dir of DIRS) {
        const test = rows.map((row) => row.slice());
        const [or, oc] = at(level.target);
        test[or][oc] = "#";
        for (const cell of closingCells) {
          if (keep.has(cell)) continue;
          const [r, c] = at(cell);
          test[r][c] = "#";
        }
        const [tr, tc] = at(target);
        test[tr][tc] = `${rows[tr][tc].replace(/\D.*$/, "")}T${dir.name}`;
        try {
          const check = solve(parseLevel(test.map((row) => row.join(" ")).join("\n")), { maxStates });
          if (check.status === "solved" && check.moves.length < base.moves.length) {
            rows = crop(test);
            trimmed += base.moves.length - check.moves.length;
            changed = true;
            break;
          }
        } catch (error) {
          // Not a valid gate side; try the next.
        }
      }
    }
  }
  return { text: toText(rows), removed, trimmed };
}

// Open cells that could be walled off without changing the length of the
// shortest solution, each tested on its own, plus whether the opening is a
// forced walk. Cheaper than tidy(), for use inside a search.
function faults(text, { maxStates = 20000 } = {}) {
  const rows = grid(text);
  const level = parseLevel(text);
  const base = solve(level, { maxStates });
  if (base.status !== "solved") return null;
  let decoys = 0;
  let tempting = 0;
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[0].length; c += 1) {
      if (/^#|^E|[ST]/.test(rows[r][c])) continue;
      const test = rows.map((row) => row.slice());
      test[r][c] = "#";
      let walled;
      try {
        walled = parseLevel(test.map((row) => row.join(" ")).join("\n"));
      } catch (error) {
        continue;
      }
      const result = solve(walled, { maxStates });
      if (!(result.status === "solved" && result.moves.length === base.moves.length)) continue;
      // Removable. But an alcove can be a feature: if the exit were moved onto it
      // the puzzle would collapse (it is a tempting near-miss that blocks the direct
      // way), so it earns its place. Only meaningful in the exit-cell model.
      if (level.exit >= 0) {
        const moved = rows.map((row) => row.map((token) => (token === "E" ? "#" : token)));
        moved[r][c] = "E";
        try {
          const there = solve(parseLevel(moved.map((row) => row.join(" ")).join("\n")), { maxStates });
          if (there.status === "solved" && there.moves.length <= base.moves.length / 2) {
            tempting += 1;
            continue;
          }
        } catch (error) {
          // Not a valid exit spot; count it as a plain decoy.
        }
      }
      decoys += 1;
    }
  }
  const opening = forcedOpening(level, base.moves);
  return { decoys, tempting, openingMoves: opening ? opening.moves : 0 };
}

module.exports = { tidy, faults, forcedOpening, forcedRuns };
