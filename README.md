# Crated In

A box-manipulation puzzle on a grid.

This is an early design sketch. There is a rules engine, headless experiments,
a play UI (`index.html`) and a test page (`test.html`, the same game with test tools).

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
a level) or http://127.0.0.1:4176/test.html for the test UI.

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
walk, amber for a push and red for a fatal drop, plus gentle mode and the
just-enough push variant. Its settings and solved ticks are stored separately
from the main page (`crated-in.test.*` keys).

`c` toggles cheat mode: below the board it says whether the position can still
be won, the next move of a shortest solution and how many moves remain, or "This
room can't be escaped any more". It re-solves after every move, using the
engine's `solve(level, { from: state })`.

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
open cells would have gained extra ways in, so such exits (Levels 6, 10 and 15)
were first moved to an edge side of the target, which leaves the solution unchanged.

## Code

- `src/engine.js`: DOM-free rules (`parseLevel`, `step`, `solve`, ...). Has a
  `module.exports` guard so Node can `require` it.
- `tests/engine.test.js`: rules tests. Run `node --test tests/engine.test.js`.
- `index.html`, `styles.css`, `src/game.js`: the play UI (SVG, top-down
  drawing, animation) with its home screen. `test.html` and `src/test-config.js`:
  the same game with test tools (see above). Undo is a history of snapshots. `src/levels.js` holds the rooms
  in level text format, each with its shortest known solution. `experiments/convert.js`
  converts old-style levels to the exit-cell form.
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

Targets are random cells that have a valid exit gap. Lengths are from before
stepping out became a move, so add one to each.

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

Level 1 in `src/levels.js` is a hand-made tutorial (a P-shaped corridor with one
push), and Levels 1 to 3 are meant as the tutorial set. Level 3 is deliberately
a corridor with no decisions, to show that a push raises the base height you
stand on. The rest came from this generator (plus the original 5x5 example, and
one room regenerated when entry gates were added because its start cell had no
valid gate side), ordered from 4x4 rooms with 2 pushes up to 5x5 rooms with 18.
Two rooms were eased by turning a crate into a wall. The number of iterations is
the difficulty dial.

## Finding levels

`experiments/analyse.js` explores every reachable state of a level (ignoring
piles above 6, which no sensible solution needs) and reports what the shortest
solution alone can't: how many distinct shortest solutions there are, how many
of its moves lead somewhere you can't escape from (traps), how much it shuffles
back and forth, and which open cells it never touches (an irrelevant corner).
Open cells walled off from the start are counted too. `experiments/rate-levels.js`
prints these for every level in `src/levels.js`.

`experiments/find-levels.js` hill-climbs random boards on those measures instead
of solution length alone, rejects boards with enclosed cells or more than 35%
unused cells, keeps initial heights at 5 or below (pushes can build higher in
play), and writes `src/candidates.js`. `test.html` lists those after the real
levels as "Candidate N" for review; promote a good one by copying it into
`src/levels.js`. The tuning weights are guesses; play the candidates and adjust.

A design preference for the finder and for hand edits: alcove decoys, meaning
protruding cells that no shortest solution uses and that only add somewhere to
wander into and get stuck, count against a level. Several levels had them and
were tidied by turning the crate into a wall (`rate-levels.js` shows the
"unused" cells that give them away). The finder's `unused` measure already
penalises them in general; a stricter version could specifically target dead-end
protrusions.
