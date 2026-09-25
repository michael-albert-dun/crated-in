const test = require("node:test");
const assert = require("node:assert");
const { parseLevel, createState, step, solve, isValidExit, exitDirs, gateKey, formatLevel } = require("../src/engine.js");

const U = 0;
const D = 1;
const L = 2;
const R = 3;

const heights = (state) => Array.from(state.h);

test("walking works across a difference of at most 1", () => {
  const level = parseLevel("0S 1 2 1T");
  let state = createState(level);
  for (const d of [R, R]) {
    const out = step(level, state, d);
    assert.strictEqual(out.result, "walked");
    state = out.state;
  }
  assert.strictEqual(step(level, state, R).result, "won");
});

test("stepping off a drop of 2 kills you, or is blocked in soft mode", () => {
  const level = parseLevel("2S 0T");
  const state = createState(level);
  assert.strictEqual(step(level, state, R).result, "died");
  assert.strictEqual(step(level, state, R, { soft: true }).result, "blocked");
});

test("edges and walls block", () => {
  const level = parseLevel("0S #\n0 0T");
  const state = createState(level);
  assert.strictEqual(step(level, state, U).result, "blocked");
  assert.strictEqual(step(level, state, L).result, "blocked");
  assert.strictEqual(step(level, state, R).result, "blocked");
});

test("walking onto the target wins", () => {
  const level = parseLevel("0S 0T");
  assert.strictEqual(step(level, createState(level), R).result, "won");
});

test("a push spreads to non-wall neighbours, including the player's cell", () => {
  const level = parseLevel("0S 3 #\n0 0 0T");
  const out = step(level, createState(level), R);
  assert.strictEqual(out.result, "pushed");
  assert.strictEqual(out.state.pos, level.start);
  // Pile 3 -> 2; player's cell and the cell below it gain 1; the wall gains none.
  assert.deepStrictEqual(heights(out.state), [1, 2, 0, 0, 1, 0]);
});

test("pushing does not move the player, even when the gap closes", () => {
  const level = parseLevel("0S 2 0T");
  const out = step(level, createState(level), R);
  assert.strictEqual(out.result, "pushed");
  assert.strictEqual(out.state.pos, level.start);
});

test("reflooring removes every full bottom layer, and the player drops with it", () => {
  const level = parseLevel("0S 4 0T");
  const first = step(level, createState(level), R);
  // [0,4,0] -> [1,3,1] -> reflooring -> [0,2,0]
  assert.deepStrictEqual(heights(first.state), [0, 2, 0]);
  assert.strictEqual(first.reflooded, 1);
  const second = step(level, first.state, R);
  // [0,2,0] -> [1,1,1] -> reflooring -> [0,0,0]
  assert.deepStrictEqual(heights(second.state), [0, 0, 0]);
});

test("the initial position is normalised by reflooring", () => {
  const level = parseLevel("1S 2 1T");
  assert.deepStrictEqual(heights(createState(level)), [0, 1, 0]);
});

test("justEnough repeats the spread until the gap is at most 1", () => {
  const level = parseLevel("0S 4 0T");
  const out = step(level, createState(level), R, { justEnough: true });
  assert.strictEqual(out.spreads, 2);
  assert.deepStrictEqual(heights(out.state), [0, 0, 0]);
});

test("solver finds shortest solutions in both push variants", () => {
  const level = parseLevel("0S 4 0T");
  const single = solve(level);
  assert.strictEqual(single.status, "solved");
  assert.strictEqual(single.moves, "RRRR");
  assert.strictEqual(single.pushes, 2);
  const enough = solve(level, { justEnough: true });
  assert.strictEqual(enough.moves, "RRR");
});

test("solver reports an unreachable target as unsolvable", () => {
  const level = parseLevel("0S # 0T");
  assert.strictEqual(solve(level).status, "unsolvable");
});

test("solver can search from a mid-game state", () => {
  const level = parseLevel("0S 4 0T");
  const pushed = step(level, createState(level), R).state;
  const out = solve(level, { from: pushed });
  assert.strictEqual(out.status, "solved");
  assert.strictEqual(out.moves, "RRR");
});

test("T can carry the side of the exit gap", () => {
  const level = parseLevel("0S 0 0TR");
  assert.strictEqual(level.exitDir, R);
  assert.strictEqual(formatLevel(level).split(" ").pop(), "0TR");
  assert.strictEqual(parseLevel("0S 0T").exitDir, -1);
});

test("exit gaps must face off the board or an outer wall", () => {
  assert.throws(() => parseLevel("0S 0 0\n0 0TU 0\n0 0 0"));
  // Wall pillar in the middle is free-standing: no exit through it.
  assert.throws(() => parseLevel("0S 0 0\n0 # 0TL\n0 0 0"));
  // Wall touching the edge is part of the outer structure: a tunnel is allowed.
  const tunnel = parseLevel("0S 0 0\n# 0TL 0\n0 0 0");
  assert.strictEqual(tunnel.exitDir, L);
  assert.strictEqual(tunnel.target, 4);
});

test("exitDirs lists each valid side of a cell", () => {
  const level = parseLevel("0S 0 0\n# 0T 0\n0 0 0");
  assert.deepStrictEqual(exitDirs(level.width, level.height, level.wall, 4), [L]);
  assert.deepStrictEqual(exitDirs(level.width, level.height, level.wall, 0), [U, D, L]);
  assert.strictEqual(isValidExit(level.width, level.height, level.wall, 0, R), false);
});

test("with an exit gap you must step out through it, not just reach the target", () => {
  const level = parseLevel("0S 0TR");
  const onTarget = step(level, createState(level), R);
  assert.strictEqual(onTarget.result, "walked");
  assert.strictEqual(step(level, onTarget.state, L).result, "walked");
  const out = step(level, onTarget.state, R);
  assert.strictEqual(out.result, "won");
  assert.strictEqual(out.state.pos, level.target);
  assert.strictEqual(solve(level).moves, "RR");
});

test("stepping out works at any height", () => {
  const level = parseLevel("0S 1 2TU");
  let state = createState(level);
  for (const d of [R, R]) state = step(level, state, d).state;
  assert.strictEqual(step(level, state, U).result, "won");
});

test("S can carry the side of the entry gate, on the same rules as the exit", () => {
  const level = parseLevel("0SL 0 0TR");
  assert.strictEqual(level.startDir, L);
  assert.strictEqual(level.exitDir, R);
  assert.strictEqual(formatLevel(level).split(" ")[0], "0SL");
  assert.strictEqual(parseLevel("0S 0 0T").startDir, -1);
  assert.throws(() => parseLevel("0S 0 0\n0 0SU 0\n0 0 0TR"));
});

test("entry and exit gates may not share a gap", () => {
  // Both cells face the same tunnel wall cell in the top-left corner.
  assert.strictEqual(gateKey(3, 1, L), gateKey(3, 3, U));
  assert.throws(() => parseLevel("# 0SL 0\n0TU 0 0\n0 0 0"), /same gap/);
});

test("the entry gate has no effect on play", () => {
  const level = parseLevel("0SL 0 0TR");
  const plain = parseLevel("0S 0 0TR");
  assert.strictEqual(solve(level).moves, solve(plain).moves);
});
