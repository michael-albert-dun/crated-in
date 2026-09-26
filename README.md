# Crated In

A box-manipulation puzzle on a grid.

This is an early design sketch. There is a rules engine, headless experiments,
a play UI (`index.html`) and a plain test UI (`test.html`).

The fiction: you're trapped in a room of crates with a way out. You can clamber
up or down one crate at a time, but a drop of two or more is too far. Push
against a stack you can't climb and its top crate copies itself, the copies
float gently down onto the neighbouring stacks, and you wind up a level higher.

## Run Locally

The page loads scripts only, but serve it anyway for consistency with the other
games:

```sh
python3 -m http.server 4176 --bind 127.0.0.1
```

Then open http://127.0.0.1:4176/ for the play UI (`?level=3` jumps to a level) or
http://127.0.0.1:4176/test.html for the test UI.

### Play UI (`index.html`)

The room is drawn straight down, lit from the top left. Height shows in the
stencilled numeral on each crate lid (an option) and in shadows: every stack and
wall casts one down and to the right onto the floor and onto lower crates, longer
the bigger the height difference. The floor is drawn as crate tops at height 0
(unnumbered), so when the bottom layer sinks away it is the floor that goes, and
all lids share one colour. The boundary is a half-width wall, drawn only beside
open floor (edge wall cells are their own boundary), so rooms need not look
square. The exit is a lit doorway with chevrons, either a gap in the boundary or
a tunnel through wall that connects to it. The entry gate is a cool blue-grey
doorway with chevrons pointing in: when a room starts (also on restart) you walk
in through it and the door slides shut behind you, staying shut for that room.

An earlier look used a perspective camera over the middle of the room, so tall
things scaled up and leaned away from the centre. It is still in `src/game.js`
behind `PERSPECTIVE`, but tall walls and stacks hid too much of the cells beside
them.

Moves are animated: a push lifts the top crate, splits it, and the copies drift
down onto the neighbours; reflooring sinks the whole floor; a fatal drop plays
as a fall; winning is stepping out through the doorway, which carries you straight on into the next room. Starting the next move
finishes any running animation, and `prefers-reduced-motion` skips them. Arrow
keys or WASD move, tapping a neighbouring square works on touch, `z` undoes,
`r` restarts and `c` peeks at a shortest solution. Options (under "Levels and
Settings") are the stencilled numbers, gentle mode and "sink the floor"; solved
levels are remembered in local storage.

Reflooring changes no rule, since every rule depends only on height differences,
so the UI can show it two ways. By default it is hidden: the engine still
normalises to "lowest height is 0" (which keeps the state space finite for the
solver), and the UI keeps an offset, the layers removed so far, that it adds
back to every numeral, so the numbers just keep counting up. The floor tiles get
a numeral too once the offset is above 0. The "sink the floor" option shows what
the rule literally says instead: a slow elevator effect, with the room shaking
while every numeral fades down by the layers removed.

### Test UI (`test.html`)

Plain squares with heights (it doesn't draw the entry gate). Move with arrow keys or WASD, or tap a
neighbouring square. `z` undoes and `r` restarts. The test options switch on
move hints (green walk, amber push, red fatal drop), soft mode and the
just-enough push variant; they are remembered in local storage.

`c` toggles cheat mode: below the board it says whether the position can still
be won, the next move of a shortest solution (also marked with an arrow on the
board) and how many moves remain, or a red "No longer solvable". It re-solves
after every move, using the engine's `solve(level, { from: state })`.

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

Initial version is a maze problem: reach the target cell, then step out. Only
reachability matters, with no par or move count.

The target cell is not special in itself: it is the cell next to a gap in the
wall, and you win by stepping out through the gap (moving from the target cell
in the exit direction, at any height). Levels without a gap side, such as the
small test boards in the tests, are won on reaching the target cell. The gap (the "exit") is one side of the
target cell that faces either off the board (the room's outer wall) or a wall
cell that is connected through wall to the board's edge (a tunnel through the
wall). A free-standing wall pillar can't hold an exit. In level text this is
`T` plus a side letter, e.g. `0TL`; the engine rejects invalid gaps
(`isValidExit`, `exitDirs`, `outerWalls`). There is one exit per room for now;
several exits leading to different rooms would be a natural extension.

Rooms chain together: the start cell is likewise next to an **entry gate**, the
doorway you arrived through, with the same rules as the exit and never the same
gap. In level text it is `S` plus a side letter, e.g. `0SD`. The entry has no
effect on play: it is shut once you're in, so it can't be walked back through,
and the solver ignores it.
Levels without side letters still parse.

## Code

- `src/engine.js`: DOM-free rules (`parseLevel`, `step`, `solve`, ...). Has a
  `module.exports` guard so Node can `require` it.
- `tests/engine.test.js`: rules tests. Run `node --test tests/engine.test.js`.
- `index.html`, `styles.css`, `src/game.js`: the play UI (SVG, perspective
  drawing, animation). `test.html`, `test.css`, `src/test-ui.js`: the plain test
  UI. Both keep undo as a history of snapshots. `src/levels.js` holds the rooms
  in level text format, each with its shortest known solution.
- `experiments/generate.js`: hill-climbing level generator (see below).
- `experiments/explore.js`: random boards solved by breadth-first search over
  (heights, position). Run `node experiments/explore.js`; the flags are listed
  at the top of the file.

Level text is one row per line, cells separated by spaces: `#` wall, a height
digit, optionally followed by `S` (start) or `T` (target) and then the side of
its gate (`U`, `D`, `L` or `R`), e.g. `0SL 4 0TR`.

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

The first levels in `src/levels.js` came from this generator (plus the original
5x5 example as room 9; room 8 was regenerated when entry gates were added, since
its start cell had no valid gate side), ordered from 4x4 rooms with 2 pushes up to 5x5 rooms
with 14. The number of iterations is the difficulty dial.

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
