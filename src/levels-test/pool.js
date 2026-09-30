// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/levels-test/candidates.js was starting to. Once a choice is made,
// whatever's here can be discarded; nothing else in the game refers to it.
// See pool.html.
//
// Cleared out (2026-09-30): the 4x4 line-push batch that was here was decided
// -- all three kept (one tightened, one had its bottom-right corner walled
// off) as src/levels/levels-linepush.js.
const POOL = [];
