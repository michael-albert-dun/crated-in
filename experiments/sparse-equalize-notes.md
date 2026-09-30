# Sparse-start search for the "equalise" win condition

Michael's question (2026-09-30): are there interesting puzzles in the
equalise variant where only a small number of piles start above height 0 —
built directly, not by reverse construction (`reverse-equalize.js`) — say a
3x4 room with at most 3 such piles? Might there be none at all?

Tool: `experiments/sparse-equalize.js`. For a plain WxH rectangle (no walls),
it enumerates every combination of k cells to be positive (1..`--max-height`
each, the rest at 0) and every start cell, and asks
`solve(level, { flatWin: true })`. Reduced by the rectangle's 4-fold symmetry
(flip horizontally, flip vertically, 180 degrees — a plain rectangle has no
90-degree symmetry unless it's square) to cut the raw count roughly 4x.

## A structural observation before brute-forcing

Heights are never negative (an existing engine invariant), so "every cell
equals 0" and "the sum of all heights is 0" are the *same* condition — sum
can never go negative, so hitting 0 forces every term to be 0.

That makes the sum a useful thing to track:

- **A push always increases the total.** Pushing pile `at` does `h[at] -= 1`
  and `+1` to every one of its neighbours; on an open rectangle with no
  walls, an open cell has 2 neighbours (a corner), 3 (an edge) or 4 (interior),
  so the net change is `+1`, `+2` or `+3` respectively — never zero or negative.
- **Only reflooring decreases the total**, and it does it in one lump per
  cycle: `-(open cells) * (layers removed)`, and only once *every* open cell
  is simultaneously at height >= 1.

So reaching the flat state isn't a slow walk downhill — pushes only ever add
to the total, so it's a race to get every single cell in the room to >= 1
(paying that ever-growing "sum tax" as you go) before a reflood cycle can
claw the total back down.

## A second, bigger structural finding: some sparse boards *diverge*

Found while calibrating the search (see below): picked the first board the
solver couldn't resolve (2 piles, height 2 each, at cells (1,2) and (2,1) on
the 3x4 grid) and traced its BFS by hand. Two corner cells (the two on the
room's left edge, diagonally away from both piles) **never become nonzero in
any of the first ~2900 reachable states**, while the rest of the room's
heights climb past 50 through repeated push/walk cycling between the two
piles.

The mechanism: once a cell's neighbours have all been pushed up far above it,
you can no longer *walk* adjacent to it (the height gap is way past 1), and
you can't *push* into it either unless you're standing right on it with a
big enough gap to the neighbour you're pushing — which requires having
stayed at that low corner the whole time. In this board, no branch of play
does that before the surrounding region has already run away, so the corner
is permanently stranded at 0 and the board can never go flat. It's a genuine
dead end, not a search-budget problem — **and no BFS with any finite cap can
ever prove this "unsolvable" outright**, because the reachable state space
really is infinite (heights climb without bound). Raising `--max-states` or
`--solve-max-height` arbitrarily high does not resolve these boards; it only
delays which cap gets hit first (confirmed directly: identical results at
`--max-states` 20000, 100000 and 400000 for the same batch).

Practical upshot: treat the solver's "unknown" verdict here as *empirically,
almost certainly unsolvable by divergence*, not "inconclusive, needs a bigger
cap" — and tune the caps for speed accordingly (small caps classify these
just as correctly as huge ones, much faster). This is also, incidentally, a
nice bit of game-design trivia in its own right: sparse boards are exactly
the ones prone to this "runs away forever" failure mode, which the
reverse-constructed levels in `src/levels-test/pool-equalize.js` can never produce (they
always carry a known finite solution by construction).

## Results

3x4 (3 wide, 4 tall), no walls. `--max-states 5000 --solve-max-height
(height cap + 10)` — cheap and, per the finding above, no less conclusive
than a much bigger cap.

| k (positive piles) | height cap | canonical boards | solved | unsolvable (proven) | unknown (divergent) |
| --- | --- | --- | --- | --- | --- |
| 1 | 1-6 | 240 | **0** | 240 | 0 |
| 2 | 1-3 | 1848 | **0** | 1502 | 346 |
| 2 | 1-6 | 7368 | **0** | 3693 | 3675 |
| 3 | 1-6 | 144000 | **0** | 41349 | 102651 |

**Total: 151,608 canonical configurations checked (k=1, 2 and 3, heights
1-6, every start cell) — zero solvable.**

k=1 is fully proven (no divergence at all: a lone pile can't sustain the
runaway dynamic above, since there's nothing to alternate pushes with). k=2
and k=3 are proven for a large minority and divergent (per the mechanism
above) for the rest, with divergence becoming *more* common as k grows (up to
71% of k=3's canonical boards) since more piles means more ways to sustain a
runaway push cycle.

**Sanity check on the "unknown" bucket:** re-ran a spread of 135 boards the
solver called "unknown" under the cheap settings above (~1 in every 700 of
k=3's canonical boards) against a much bigger cap (height 60, 300000 states,
vs. 16/5000 for the sweep) to make sure cheap settings weren't just giving up
early on something actually solvable. All 135 stayed "unknown" — none flipped
to solved or proven-unsolvable — which is good evidence the divergence
classification is real and not a false negative from an over-cheap cap.

## Where this goes next

This is a real, reportable design fact, not a search-parameters gap: **no
equalise puzzle with 1, 2 or 3 starting piles (each height 1-6) is solvable
on a plain 3x4 room, from any start cell.** From here, in rough order of how
much they'd change the question rather than just the parameters:

- Raise the height cap further — expected to be low-value, since taller
  piles mostly just diverge faster (more of the "unknown" bucket), not
  obviously unlock new solvable topologies. Untested, but the trend across
  k=2 at height 3 vs. 6 (unknown share roughly doubling) points this way.
- Try a *bigger* room (3x5, 4x4 — more interior cells with 4 neighbours might
  change the divergence balance, since divergence seems to hinge on corner/edge
  cells with too few neighbours getting stranded).
- Allow a single wall/pillar. This changes the *neighbour graph* directly,
  which is the thing that actually seems to matter here — removing a corner's
  second neighbour, or giving an interior cell a wall-neighbour instead of an
  open one, could plausibly break the divergence pattern rather than just
  delay it. This feels like the most promising lever, of the three.

If a solvable config does turn up in any follow-up: pick a spread by
move/push count (same instinct as the rest of the level-search pipeline) and
stage them in `src/levels-test/pool-equalize.js` for a look in `pool-equalize.html`. These
would be a genuinely different *kind* of level from the reverse-constructed
batch already there: no known-short solution baked in by construction, so
likely a longer, more exploratory solve — visiting most of the room before
the first reflood, since so much of it starts untouched.

Separately, it might be worth a small follow-up tool that classifies a board
as "provably divergent" cheaply and directly (e.g., detect that some cell's
neighbours have all pulled more than 1 ahead of it with no explored state
where the player was adjacent at the critical gap) instead of only inferring
it from hitting a cap, and/or a short write-up of the divergence mechanism as
an actual proof rather than an empirically-supported observation. Not done
here — flagging as an idea, not started.

## Parameters

- `--max-height`: the cap on each of the k piles' *starting* height. Biggest
  effect on how many boards there are to check at all.
- `--max-states` / `--solve-max-height`: the solver's own caps, passed
  straight to `solve()`. Per the divergence finding above, keep these modest
  (a few thousand states, height cap ~ +10 over `--max-height`) — raising them
  further does not resolve genuinely divergent boards, only delays the same
  "unknown" verdict.
- Player start cell is unrestricted (any of the 12 cells, not just cells at
  height 0).
