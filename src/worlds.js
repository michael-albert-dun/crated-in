// The worlds on the main page (loaded after the level files, before game.js).
// A world is its own level set with its own rules; game.js takes the engine's
// rule flags from `rules` (so levels can't be played under the wrong ones) and
// builds the home screen and the world screens from this list, so adding a
// world is adding an entry here. Fields:
//   id       the "?w=" in addresses and the prefix of its saved progress
//   name     title on its card and its screen (shown in the play title too)
//   tagline  one line on the home card
//   rule     paragraphs on the world screen: what is different about this world
//   rules    engine flags: { linePush, slideClimb }; omitted flags are off
//   groups   level sets shown in order, each { title, blurb?, levels }; the first
//            is the warm-up that teaches the mechanic. Slide-or-climb is meant
//            to arrive for classic and line as a second group once enough of
//            the first is solved (not built yet).
// Progress is kept by position in the world's flat level list, so append new
// levels to the end of a group's array only if that group is the last one.
// Order here is the order on the home screen: Line Push first (the more natural
// mechanic), Spreading Stacks as the older wand.
const WORLDS = [
  {
    id: "line",
    name: "Line Push",
    tagline: "A push only reaches you and the square behind the pile.",
    rule: [
      "Here the wand is more disciplined. Pushing a stack that's too tall to climb still destroys its top crate, but only two copies appear: one on your own square and one on the square just past the pile, in the same direction. Nothing lands at the sides.",
      "If there's no square past the pile (a wall, a pillar or the edge of the room) the push doesn't happen at all. The column of light is the exception: a copy pushed onto it floats away up the light, so you can push a stack straight into the exit.",
    ],
    rules: { linePush: true },
    groups: [
      { title: "Warm-up", levels: LEVELS_LINEPUSH_INTRO },
      { title: "Rooms", levels: LEVELS_LINEPUSH },
    ],
  },
  {
    id: "classic",
    name: "Spreading Stacks",
    tagline: "The old wand: a push spreads the top crate over every neighbour.",
    rule: [
      "Point the wand at a stack that's too tall to climb (by pushing against it). The crate on top is destroyed, but a copy of it drifts down onto each neighbouring stack, including yours, so you're lifted a level.",
      "A stack in the open has four neighbours, one in a corner has two: where the pile sits changes where the crates go. (A copy that lands on the column of light just floats away.)",
    ],
    rules: {},
    groups: [
      { title: "Warm-up", levels: LEVELS.slice(0, 3) },
      { title: "Rooms", levels: LEVELS.slice(3) },
    ],
  },
  {
    id: "equalise",
    name: "Equalise",
    tagline: "No exit: make the whole room flat.",
    rule: [
      "There is no column of light in these rooms. Instead the way out opens once every stack is the same height. Pushing works as in Spreading Stacks (the old wand), and whenever the whole room is lifted level the floor is lowered to match.",
    ],
    rules: {},
    groups: [
      { title: "Warm-up", levels: LEVELS_EQUALIZE },
    ],
  },
];
