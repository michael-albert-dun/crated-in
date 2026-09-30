// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/levels-test/candidates.js was starting to. Once a choice is made,
// whatever's here can be discarded; nothing else in the game refers to it.
// See pool.html.
//
// Cleared out (2026-09-30): the "going around in circles" ring-room batch
// that was here was decided -- all three kept, as Levels 1-3 of
// src/levels/levels-linepush.js (ahead of the earlier 4x4 batch, which is
// now Levels 4-6 there).
const POOL = [];
