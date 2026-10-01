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
// Order here is the order on the home screen: Three in a Row (line push) first (the more natural
// mechanic), Spread the Load (classic) as the older wand.
const WORLDS = [
  {
    id: "line",
    name: "Three in a Row",
    tagline: "One crate under you, one just beyond the pile.",
    rule: [
      "The wand puts a crate underneath you, and in the space just beyond the original pile.",
    ],
    rules: { linePush: true },
    groups: [
      { title: "Warm-up", levels: LEVELS_LINEPUSH_INTRO },
      { title: "Rooms", levels: LEVELS_LINEPUSH },
    ],
  },
  {
    id: "classic",
    name: "Spread the Load",
    tagline: "A crate on every side of the pile.",
    rule: [
      "The wand puts a crate in every possible position adjacent to the pile it came from.",
    ],
    rules: {},
    groups: [
      { title: "Warm-up", levels: LEVELS.slice(0, 3) },
      { title: "Rooms", levels: LEVELS.slice(3) },
    ],
  },
  {
    id: "equalise",
    name: "Level Best",
    tagline: "No exit: make the whole room flat.",
    rule: [
      "There is no column of light in these rooms. Instead the way out opens once every stack is the same height. The wand works as in Spread the Load, and whenever the whole room is lifted level the floor is lowered to match.",
    ],
    rules: {},
    groups: [
      { title: "Warm-up", levels: LEVELS_EQUALIZE },
    ],
  },
];
