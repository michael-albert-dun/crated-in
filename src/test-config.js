// Turns index-style pages into the test page: append the candidate levels from
// experiments/find-levels.js to LEVELS (so the level grid and menu list them
// after the real ones) and switch on the extra tools in game.js. Load after
// levels.js and candidates.js and before game.js.
window.CRATED_TEST = { realCount: LEVELS.length };
if (typeof CANDIDATES !== "undefined") LEVELS.push(...CANDIDATES);
