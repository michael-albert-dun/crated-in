// Turns the page into the pool page for the "equalise" win condition: LEVELS is
// the approved list (src/levels-equalize.js) followed by the current disposable
// batch (src/pool-equalize.js), the same relationship test.html has between
// levels.js and candidates.js -- so the batch can be played and judged
// alongside the levels already kept, not in isolation. Load after engine.js,
// levels-equalize.js and pool-equalize.js, and before game.js.
const LEVELS = [...LEVELS_EQUALIZE, ...POOL_EQUALIZE];
window.CRATED_TEST = { realCount: LEVELS_EQUALIZE.length, pool: true, namespace: "pool-equalize" };
