# Crated In

A box-manipulation puzzle on a grid.

This is an early design sketch. There is a rules engine, headless experiments,
a play UI (`index.html`), a test page (`test.html`, the same game with test tools)
and a pool page (`pool.html`, the same game showing a disposable batch of levels
to choose between). A second win condition is being explored alongside the
original exit-based one; see "The equalise variant" below.

The fiction: the door slams behind you and you're crated in; across the room a
column of light glows, your only way out. You have a wand that is supposed to move
crates for you but isn't working properly: all it does is destroy the top of a
nearby stack you can't climb and put copies down on its neighbours (yours
included, so you wind up a level higher). You can clamber up or down one
crate at a time, but a drop of two or more is too far.

## Run Locally

The page loads scripts only, but serve it anyway for consistency with the other
games:

```sh
python3 -m http.server 4176 --bind 127.0.0.1
```

Then open http://127.0.0.1:4176/ for the home screen (`?level=3` jumps straight to
a level), http://127.0.0.1:4176/test.html for the test UI, or
http://127.0.0.1:4176/pool.html for whatever batch is currently in the pool.
http://127.0.0.1:4176/pool-equalize.html is the equivalent pool page for the
"equalise" win condition (see below).

### Play UI (`index.html`)

The room is drawn straight down, lit from the top left. Height shows in the
stencilled numeral on each crate lid (always shown, since it is essential); lids have a light top-left and
dark bottom-right bevel and no outline. (An earlier stage with cast shadows was
dropped as distracting.) The floor is drawn as crate tops at height 0
(unnumbered), so when the bottom layer sinks away it is the floor that goes, and
all lids share one colour.

Walls come in two kinds. Anything off the board, or wall joined through wall to
the board's edge, is "outside" and drawn as the dark backdrop. Each open cell
next to outside gets a half-width edge of plain dark grey (with a faint speckle)
on that side, plus a half-by-half block on corners where both neighbours and the
diagonal are outside, so rooms need not look square and the silhouette has no
notches. A free-standing wall cell is instead a dark grey octagonal pillar (black
inset, light eight-pointed star) on a sky-blue void tile, so it can't be
mistaken for floor. The exit is a full square of light (nested glowing squares,
seen from above like a shaft of light), a cell of its own set into the room's edge
or just outside it. It is a column rather than a doorway because a doorway at
floor level read as a fixed height, so leaving from a tall crate looked like a
drop: stepping onto the column keeps you at your height and floats you up and
away, with motes of light rising, into the next room. Arriving is the mirror
image: when a room starts (also on restart) a column of light comes on over the
start cell, you rise up it from below to the height of the crate, and the light
fades.

An earlier look used a perspective camera over the middle of the room, so tall
things scaled up and leaned away from the centre. It is still in `src/game.js`
behind `PERSPECTIVE`, but tall walls and stacks hid too much of the cells beside
them.

Moves are animated: a push lifts the top crate, splits it, and the copies drift
down onto the neighbours; a fatal drop plays
as a fall; winning is stepping onto the column of light, which floats you up into the next room. Starting the next move
finishes any running animation, and `prefers-reduced-motion` skips them. Arrow
keys or WASD move, tapping a neighbouring square works on touch, `z` undoes,
`r` restarts, `c` peeks at a shortest solution and `m` (or Escape, or the Menu
button) goes back to the home screen.

The home screen is the index page: a short story, how to play, the settings
(just gentle mode) and a grid of level
tiles. Solved levels show a tick and the first unsolved one is outlined; picking
a tile goes straight into that level. Solved levels are remembered in local
storage. It is one page with two screens; the address bar follows (`?level=N`
while playing, plain at home), so the back button and reloads work.

Reflooring changes no rule, since every rule depends only on height differences,
so the UI hides it: the engine still normalises to "lowest height is 0" (which
keeps the state space finite for the solver), and the UI keeps an offset, the
layers removed so far, that it adds back to every numeral, so the numbers just
keep counting up. The floor tiles get a numeral too once the offset is above 0.
(An optional "sink the floor" elevator animation, with the room shaking as every
numeral fades down, was built and then dropped.)

### Test UI (`test.html`)

The same game as the main page (same drawing, animations, home screen and
controls), with extra tools switched on by `src/test-config.js` setting
`window.CRATED_TEST` before `game.js` loads: the candidate levels from the finder
are appended after the real ones (dashed tiles in the grid, "Candidate N" in the
level menu), and the play screen gains a level dropdown, a level info line (size,
pushes and the finder's measures) and a Cheat button (`c` does the same). The
test options are move hints, which outline each neighbouring square green for a
walk, amber for a push and red for a fatal drop, plus gentle mode, the
just-enough push variant, and slide-or-climb (see Mechanics below). Its
settings and solved ticks are stored separately from the main page
(`crated-in.test.*` keys).

`c` toggles cheat mode: below the board it says whether the position can still
be won, the next move of a shortest solution and how many moves remain, or "This
room can't be escaped any more". It re-solves after every move, using the
engine's `solve(level, { from: state })`.

### Pool UI (`pool.html`)

The same game again, built the same way as the test page (`src/pool-config.js`
sets `window.CRATED_TEST` with `pool: true`, no real levels, no candidates.js),
but for one purpose: showing a disposable batch of levels to choose between.
`src/pool.js` holds the whole list as `POOL`, and the file is meant to be fully
**overwritten** with a fresh batch each time, not appended to the way
`candidates.js` is, so it never accumulates old decided-and-forgotten options.
`experiments/make-levels.js`'s `finish()` and `experiments/pick-shapes.js`
detect an `--out` path named `pool.js` and switch the variable name and each
entry's name prefix to `POOL`/"Option N" automatically. Settings and solved
ticks use their own storage keys (`crated-in.pool.*`), separate from both the
main page and the test page.

## The equalise variant

A second win condition, being explored as a separate set of levels: instead of
reaching an exit, you win by pushing until every stack in the room is the same
height. Reflooring already keeps the lowest non-wall height at 0 after every
move (see Mechanics, below), so "every stack equal" and "every stack at 0" are
the same state -- the win is a push that leaves the whole board flat, and you
*see* that happen: unlike the exit game, which hides reflooring behind a
running offset so the displayed numbers just keep counting up, these levels
show the true (dropping) height, since watching the board go flat is the
point.

These levels have no target and no exit cell at all (`isFlat(level, h)` in
`src/engine.js` is the only win condition they have); `solve(level, {
flatWin: true })` treats a push that flattens the board as a win the same way
it treats stepping onto an exit. Everything else -- walking, pushing, dying,
reflooring itself -- is unchanged; only the win check differs (for now: pushing
against a pile exactly one higher is a candidate for a future rule change,
independent of this variant).

`pool-equalize.html` is the equalise counterpart of `pool.html`: same game and
test tools, but `src/levels-equalize.js` (the approved levels, hand-curated,
holds a 3x3 tutorial so far) followed by `src/pool-equalize.js` (the current
disposable batch, dashed tiles, same "overwritten each round" convention as
`pool.js`). Its settings and solved ticks use their own storage keys
(`crated-in.pool-equalize.*`, via `game.js`'s `TEST.namespace`), so they don't
collide with the exit-based pool's.

The tutorial level (`src/levels-equalize.js`, Level 1): a plain 3x3, corners at
height 1, the four edge-middle cells at 0, the centre at 2. Standing on any
edge-middle cell and pushing the centre spreads one copy onto each of the four
edge-middle cells (their common neighbour), levelling every cell in the room to
1 -- which reflood then strips to 0 in the same move. One push both equalises
and wins.

### Generating levels: reverse construction

`experiments/reverse-equalize.js` builds a level backward from the solved state
instead of building a board and checking whether it happens to be solvable: it
starts at a random open cell on an all-zero (flat) board and repeatedly applies
one of two reverse moves --

- **reverse-walk**: step to a neighbour at most 1 different in height (walking
  is its own inverse, since the gap rule is symmetric).
- **reverse-unpush**: pick a neighbouring pile, add back however many layers
  reflooring would have stripped after the push it undoes (0 or more, however
  many keep every cell non-negative), then undo the spread itself (+1 on the
  pile, -1 on each of its neighbours, including the player's own cell).
  Verified by simulating the *forward* push from the candidate and checking it
  reproduces the state before, exactly.

Whatever is left after the chosen number of reverse moves is the level's start.
A solution of that many moves is known to exist, so the only way a board can be
worse than intended is a *shortcut* -- a shorter solution existing by accident
-- checked by running `solve(level, { flatWin: true })` and rejecting unless
its shortest solution is exactly that many moves.

```sh
node experiments/reverse-equalize.js [--shapes all|name,name] [--attempts 300] [--seed 1]
     [--min-steps 3] [--max-steps 8] [--min-pushes 1] [--max-pushes 6]
     [--layer-max 2] [--walk-bias 0.35] [--out src/pool-equalize.js] [--count 5]
```

Shapes come from `experiments/equalize-shapes.js`, a separate and much smaller
set from `shape-levels.js`'s `SHAPES` (so far just `square3`, the tutorial's
plain 3x3): these carry no entry or exit gate, since this variant picks its own
start cell while constructing rather than being given one.

Unlike the exit-based generators, this one hasn't yet been through a round of
picking by eye, tuning the length/push window, or checking against a design
principle the way "alcove decoys" was for the original game -- it produces
solvable, shortcut-free boards and nothing more opinionated than that yet.
Initial heights can run fairly tall (`--layer-max` and `--max-steps` are the
knobs to rein that in) since each reverse-unpush is free to add back any number
of reflood layers up to `--layer-max`.

## The board

Play is on a rectangular grid. Each cell is in exactly one of these states:

- **Floor**: The "height 0" level.
- **Stack**: a pile of blocks with a height (1 or more), standing on floor.
- **Wall**: immovable, impassable and inert. Think of a wall as a pillar of
  infinite height and depth: it never receives blocks and never counts for
  reflooring.

The player has no height of their own: it is the height of the cell they stand
on.

## Mechanics

Each move is an attempt to step in one of four directions, and what happens
depends on the gap (neighbour height minus your height):

- **Walking**: the gap is between -1 and 1, so you move there.
- **Dying**: the gap is -2 or less. In hard mode this loses the game. In soft
  mode the move is just blocked.
- **Spreading**: the gap is 2 or more. You don't move. The top block of the
  neighbouring pile explodes: the pile loses one block and every non-wall,
  on-board cell adjacent to it (including yours) gains one. So one push shrinks
  the gap by 2. This is *push then move*: you walk up on a later move, once the
  gap is 1 or less, which lets you do several spreads first.
- **Reflooring**: after every move, if every non-wall height is at least 1, the
  bottom layer disappears (repeatedly, until some cell is 0). Your own height
  drops with it, which is only bookkeeping: nothing ever lowers a pile that
  reaches your level.

Mistakes can make a board unwinnable, which is intended. `z` should undo.

### Variant to try: slide-or-climb

Normally a neighbour exactly 1 higher is always climbed (an ordinary walk).
The `slideClimb` option (`step(..., { slideClimb: true })`; the "Slide-or-climb"
checkbox on `test.html`/`pool.html`, off by default so the original puzzles are
unaffected) changes that specific case: if the square past the neighbour, in
the same direction, is strictly lower, the neighbour slides forward into it
instead (a real moved unit -- it loses 1, that square gains 1, unlike a push's
non-conserving copies onto every side) and you step onto the now-level
neighbour in the same move (push-and-move, unlike an ordinary push, which
never moves you). Otherwise you climb it exactly as before. Reflooring can
still trigger off a slide, same as a push. Counted as a push for move/solve
bookkeeping. `solve()`'s `flatWin` option recognises a slide that flattens the
board too, for whenever this gets tried against the equalise variant.

### Variant to try: "just enough" spreading

Instead of one spread per push, a push could repeat the spread until the gap is
1 or less, so a push always ends with you able to walk. The engine supports this
as `step(..., { justEnough: true })`, which the experiment compares.

## Objective

Initial version is a maze problem: reach the exit. Only reachability matters,
with no par or move count.

The exit is a cell of its own, `E` in level text: a column of light that is
inert like a wall (walking can't pass through it, no copies land on it, it does
not count for reflooring), but stepping onto it from **any** open neighbour wins,
at any height, since you float up rather than step down. So an exit set into the
middle of a room's top row can be reached from three cells, and a level can offer
more than one way in. One exit per room for now; several exits leading to
different rooms would be a natural extension.

Rooms chain together. The start (`S`) needs no gate: you arrive on a column of
light over it, and nothing about the entry affects play, so the solver ignores it.

Older levels used a target cell with a gap in the wall beside it (`T` plus a side
letter, e.g. `0TL`, valid on the outside wall or a tunnel through wall connected
to it: `isValidExit`, `exitDirs`, `outerWalls`), and `S` plus a side letter for an
entry doorway. The engine still parses those (the tests use them), but the game
no longer draws them, and `experiments/convert.js` turns a level into the exit-cell
form: the exit cell goes where the gap was, in place of the tunnel's wall cell or
in a new row or column outside the room. A tunnel whose wall cell touched other
open cells would have gained extra ways in, so such exits (Levels 8, 12 and 17)
were first moved to an edge side of the target, which leaves the solution unchanged.

## Code

- `src/engine.js`: DOM-free rules (`parseLevel`, `step`, `solve`, ...). Has a
  `module.exports` guard so Node can `require` it.
- `tests/engine.test.js`: rules tests. Run `node --test tests/engine.test.js`.
- `index.html`, `styles.css`, `src/game.js`: the play UI (SVG, top-down
  drawing, animation) with its home screen. `test.html` and `src/test-config.js`:
  the same game with test tools (see above). `pool.html` and `src/pool-config.js`:
  the same game again, showing only the disposable batch in `src/pool.js` (see
  above). Undo is a history of snapshots. `src/levels.js` holds the rooms
  in level text format, each with its shortest known solution. `experiments/convert.js`
  converts old-style levels to the exit-cell form.
- `pool-equalize.html` and `src/pool-equalize-config.js`: the pool page for the
  equalise variant (see above); `src/levels-equalize.js` holds its approved
  levels and `src/pool-equalize.js` its current disposable batch, same
  approved/candidate relationship as `levels.js`/`candidates.js`.
  `experiments/reverse-equalize.js` generates the batch by reverse construction
  from the solved state, over shapes in `experiments/equalize-shapes.js`.
- `experiments/generate.js`: hill-climbing level generator (see below).
- `experiments/explore.js`: random boards solved by breadth-first search over
  (heights, position). Run `node experiments/explore.js`; the flags are listed
  at the top of the file.

Level text is one row per line, cells separated by spaces: `#` wall, `E` the exit
cell, or a height digit optionally followed by `S` (start), e.g. `0S 4 1 E`.
(The older `T` and side-letter forms still parse, see Objective.)

The solver caps pile height at 9 and the search at 300,000 states, since
spreading adds blocks and the state space is unbounded. It reports "unknown"
when a cap was hit before the search finished.

## First findings (seed 1, 150 random boards per size, 10% walls)

From `experiments/explore.js`. Targets are random cells that have a valid exit
gap. Lengths are from before stepping out became a move, so add one to each.

| Size | Solvable | Need a push | Median / max solution length |
| --- | --- | --- | --- |
| 5x5 | 83% | 37% | 5 / 15 |
| 6x6 | 83% | 38% | 6 / 38 |
| 7x7 | 84% | 47% | 7 / 21 |

Single-spread and just-enough pushes give almost identical statistics on random
boards, so the choice is a feel question rather than a difficulty one. Random
boards are mostly easy, but the tail has genuine multi-push puzzles.

## Generator

`experiments/generate.js` starts from a random solvable board and repeatedly
mutates one cell (a height, a wall, the start or the target), keeping the change
if the score `moves + 2 * pushes` of the shortest solution doesn't drop. A board
is only accepted if walking alone can't reach the target (so a push is always
compulsory) and it has at least `--min-pushes` pushes. Start and target must
each keep a valid gate (and not the same gap), including through mutations that
move them or change walls. It runs in seconds:
5x5 boards with 8 to 13 pushes and 25 to 37 moves come out readily, and left
running longer it drifts to 90 to 180 move solutions that are mostly repeated
grinding, which probably isn't fun. Score doesn't yet measure what makes a
puzzle good (few distinct solutions, tempting dead ends), so pick by eye.

Level 1 in `src/levels.js` is a hand-made tutorial (a plain 3x3 room with a
central pillar). The early levels have been through an "elegance pruning" pass
since: several were replaced with plain open shapes (a room with a pillar or
two, a rectangle, a rectangle with a notch) found by the search below rather
than hand-built, or trimmed of decoy cells; expect this to continue. The rest
came from this generator (plus the original 5x5 example, and
one room regenerated when entry gates were added because its start cell had no
valid gate side), ordered from 4x4 rooms with 2 pushes up to 5x5 rooms with 18.
Two rooms were eased by turning a crate into a wall. The number of iterations is
the difficulty dial.

## Finding levels

`experiments/analyse.js` explores every reachable state of a level (ignoring
piles above 6, which no sensible solution needs) and reports what the shortest
solution alone can't: how many distinct shortest move-sequences there are
(`ways`), how many of its moves lead somewhere you can't escape from (traps),
how much it shuffles back and forth (`revisit`), and which open cells it never
touches (`unused`: an irrelevant corner). Open cells walled off from the start
are counted too (`disconnected`). `experiments/rate-levels.js` prints these for
every level in `src/levels.js`.

`experiments/push-ways.js` fixes a real flaw in `ways`: it counts raw
move-sequences, which is inflated by walking to the same push by a different
route of the same length (not a different plan) and, less obviously, by which
side of a pile you pushed from (a push never moves you, so pushing the same
pile from a different neighbour leaves you standing somewhere genuinely
different afterward, which can matter for what you can do next -- so *that*
distinction is real, unlike the walking-route one). `pushWays(level, opts)`
returns the count of distinct `(launch cell, pile)` sequences instead: usually
well under half the raw count, sometimes close to it. It's expensive (another
full solve of the state graph), so the generators below use raw `ways` as a
cheap proxy while searching and only pay for the accurate count on boards that
already look promising, keeping both numbers in a level's `info` string
(`"N plans (M raw ways)"`) since the gap between them is itself informative.

`experiments/tidy.js` cleans up a board the way levels have been tidied by
hand: `faults(text)` finds decoy cells (an open cell that can be turned to wall
without changing the shortest solution's length -- somewhere to wander into and
get stuck) and separates out *tempting* ones (where the cell is removable
**and** moving the exit onto it would roughly halve the solution -- a
near-miss the level wants you to be drawn to, not a defect); `forcedRuns(level,
moves)` finds the forced walk at either end of the solution (states with no
real choice); `tidy(text)` applies both, walling off decoys, moving the start
past a forced opening, trimming a forced closing walk back to the exit, and
cropping any all-wall border rows/columns left behind.

Alcove decoys count against a level as a design preference; several of the real
levels had them and were tidied by turning the crate into a wall. But a
*tempting* alcove is worth keeping, since it's the near-miss that makes a wrong
turn feel like a real mistake rather than a random wall.

## Shape-seeded search

The free-form search below can grow long corridors and decoy alcoves as a side
effect of hill-climbing on solution length; `experiments/shape-levels.js` avoids
that by fixing the room's shape (walls, start, exit) up front and only
searching the crate heights, by simulated annealing on traps, pushes, `revisit`
and (once a board is already promising) decoys, forced ends and the real
`pushWays` count:

```
node experiments/shape-levels.js [--shapes all|name,name] [--restarts 6] [--iterations 600]
     [--seed 1] [--min-moves 24] [--max-moves 44] [--min-pushes 6] [--max-pushes 13]
     [--min-traps 3] [--max-ways 3] [--max-decoys 0] [--max-unused 0] [--minutes 0]
     [--out src/candidates.js] [--count 5]
node experiments/shape-levels.js --merge run1.log run2.log ...
```

A shape is rows of `.` (open), `#` (wall), `E` (the exit cell) and `S` (the
start); `SHAPES` in the file has the ones tried so far (`square4`, `diag4`,
`cross3`, `notch5x4`, `pillars6`, `nibbles6`, the 2x5 rectangles, `linked32`,
...), each with a one-line comment on the shape it describes. `--minutes`
self-stops a long run so it can be left going in the background; each attempt
logs a `FOUND {json}` line, so several `--seed`s can run in parallel and be
merged afterwards. `experiments/cross-shapes.js` and
`experiments/interior-shapes.js` generate whole *families* of shapes rather
than one each: every essentially-different way to place the entry and exit on
a plain 3x3 room's perimeter (17, up to the room's dihedral symmetry) or fully
inside it (8, excluding adjacent placements), merged into `shape-levels.js`'s
own `SHAPES` automatically.

`experiments/pick-shapes.js` picks the actual candidates from a shape's logs:
re-checks each board (decoys, forced ends, the real `pushWays` count), ranks by
fewest repeated squares/decoys/plans, and spreads the picks across the solution
lengths on offer.

```
node experiments/pick-shapes.js [--per-shape 2] [--out src/candidates.js] label=log1,log2 label=log3 ...
```

Both tools' `--out` writes `src/candidates.js` (appendable; "Candidate N") by
default, or `src/pool.js` ("Option N" instead, and the whole file replaced, not
appended to -- see Pool UI above) when the path's basename is `pool.js`.

## Exhaustive search

When a shape is small enough, `experiments/exhaust-shape.js` sidesteps the
search entirely: every assignment of heights 0..max to the open cells, solved,
keeping the longest. Roughly 10 million boards (9 cells at height 0..5) run in
under a minute on one core, and split across `--part`/`--parts` for more; this
is how we know a shape's true ceiling rather than just what a search happened
to find. `experiments/exhaust-zero.js` is the same idea restricted to boards
with at least `--min-zero` cells at height 0 (generated directly by choosing
which cells are zeroed rather than filtering the full space, since that subset
can be a tiny fraction of it): still exhaustive *within* that restriction, just
over a deliberately smaller space, useful when the full sweep would take too
long or when a room reading "mostly flat, a few tall stacks" matters for its
own sake.

```
node experiments/exhaust-shape.js --shape diag4 [--max-height 5] [--part 0 --parts 1] [--keep 40] [--min-moves 18]
node experiments/exhaust-zero.js --shape notch3x5 --min-zero 6 [--max-height 5] [--part 0 --parts 1] [--keep 40] [--min-moves 18]
```

Neither writes `src/candidates.js` directly; their `BEST {json}` lines get
merged and scored the same way as `shape-levels.js`'s (see the shape-search
sessions in the repo's history for the exact recipe), since a board worth
keeping still needs the decoy/forced-end/`pushWays` checks above.

## Free-form search

`experiments/random-levels.js` is the shared RNG and board/mutation helpers
behind this section (a seeded `mulberry32`, `randomLevel`, `mutate`); nothing
here is run directly. `experiments/find-levels.js` hill-climbs random boards
(any walls, not a fixed shape) on the `analyse.js` measures instead of solution
length alone, rejects
boards with enclosed cells or more than 35% unused cells, and keeps initial
heights at 5 or below (pushes can build higher in play). `experiments/make-levels.js`
builds on it: climbs, tidies with `tidy.js`, re-analyses, and keeps only boards
that still fit the target window, writing the best few (as `src/candidates.js`
or `src/pool.js`, same as `pick-shapes.js` above) spread across it.

```
node experiments/make-levels.js [--sizes 5x5,6x5,6x6] [--seeds 1-12] [--count 5]
     [--min-moves 24] [--max-moves 44] [--min-pushes 6] [--max-pushes 11]
     [--min-traps 3] [--max-ways 3] [--out src/candidates.js]
node experiments/make-levels.js --merge run1.log run2.log ... [--count 5] [--out src/candidates.js]
```

Since this search can still grow corridors and decoys by construction (that's
what `tidy.js` was built to clean up after), the shape-seeded search above is
the better default; this is what produced most of the original candidates
before shapes existed. `experiments/reverse-levels.js` is an abandoned attempt
at a third approach (building a level backwards from a finished position by
undoing pushes, so every cell is solvable by construction) that never
consistently beat shape-seeding in practice; it's left in the repo but isn't
part of the active pipeline.
