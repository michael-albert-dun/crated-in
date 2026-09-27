// A throwaway batch of levels to look at and choose between, in level text
// format. Ephemeral by design: the whole file gets overwritten with a fresh
// POOL every time there's a new batch to show, rather than growing forever the
// way src/candidates.js was starting to. Once a choice is made, whatever's here
// can be discarded; nothing else in the game refers to it. See pool.html.
const POOL = [];
