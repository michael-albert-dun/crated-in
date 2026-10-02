// Turns the page into a pool page: LEVELS *is* the (ephemeral) pool, not the
// real level list plus extras, and the test tools switch on as usual. The
// current batch has no exit: the goal is to make every cell walkable (goal:
// "walkable", see boardGoal in game.js). Load after engine.js and pool.js and
// before game.js; do not load levels.js.
const LEVELS = POOL;
window.CRATED_TEST = { realCount: 0, pool: true, linePush: true, goal: "walkable" };
