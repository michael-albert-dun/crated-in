// Play UI for Crated In: you're in a room of crates, seen from
// directly above. Rules live in engine.js (loaded first); this file draws the
// room and animates what step() reports. The plain test UI is test.html.
//
// Look: straight top-down, with light from the top left. Height shows in the
// stencilled numeral on each crate lid and in shadows, which fall onto the floor
// and onto lower neighbouring crates, longer the bigger the height difference.
// An earlier look used a perspective camera over the middle of the room (things
// scale up and lean away from the centre, showing the sides that face the
// middle); it is still here behind PERSPECTIVE, but tall walls and stacks hid
// too much of the cells beside them.

const CELL = 64;
const PERSPECTIVE = false;
const CAMERA = 40; // perspective mode only: camera height above the floor in crate layers; lower = stronger lean
const WALL_LAYERS = 4; // perspective mode only: walls are "infinitely" tall; drawn this tall to limit how much they hide
const SHADOW_PER_LAYER = 4.5; // px of shadow length per crate layer of height difference
const WALL_SHADOW_LAYERS = 6; // walls are tall: their shadow is as long as a stack this high would cast
const SHADOW_COLOUR = "rgba(30, 18, 6, 0.2)";
const PAD = CELL / 2; // thickness of the boundary wall around the room
const SVG_NS = "http://www.w3.org/2000/svg";
const SETTINGS_KEY = "crated-in.play.v1";
const PROGRESS_KEY = "crated-in.solved.v1";
const KEY_DIRS = {
  ArrowUp: 0, w: 0, W: 0,
  ArrowDown: 1, s: 1, S: 1,
  ArrowLeft: 2, a: 2, A: 2,
  ArrowRight: 3, d: 3, D: 3,
};
const DIR_WORDS = ["up", "down", "left", "right"];
const FACING_DEGREES = [-90, 90, 180, 0];
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CRATE = { sideX: "#a97c45", sideY: "#c0925a", stroke: "#5b3d17", line: "rgba(91, 61, 23, 0.55)" };
const LID_FILL = "#e3c38e";
// The entry door that shuts behind you: dark wood, in two leaves.
const DOOR = { top: "#7b6146", sideX: "#5b4630", sideY: "#6b533a", stroke: "#2e2418", line: "rgba(0, 0, 0, 0.35)" };
const STONE = { top: "#5b606a", sideX: "#3f434a", sideY: "#4b4f57", stroke: "#25272b", line: "rgba(0, 0, 0, 0.3)" };

const state = {
  levelIndex: 0,
  level: null,
  // Each entry is a full snapshot, so undo is just popping.
  history: [],
  current: null,
  settings: { numbers: true, gentle: false, justEnough: false },
  solved: new Set(),
  cheat: false,
};

// What is on screen right now. Between moves it mirrors state.current; during
// an animation it holds in-between values (fractional heights, flying crates).
const view = {
  h: null,
  player: { x: 0, y: 0, base: 0, z: 0, alpha: 1, scale: 1, facing: 1, leanX: 0, leanY: 0 },
  ghosts: [],
  glow: 0,
  entryClosed: 1, // 0 = entry doorway open, 1 = door shut
};
let geo = null;
let anim = null;

const elements = {
  board: document.querySelector("#board"),
  title: document.querySelector("#room-title"),
  message: document.querySelector("#message"),
  counts: document.querySelector("#counts"),
  cheatStatus: document.querySelector("#cheat-status"),
  undo: document.querySelector("#undo"),
  restart: document.querySelector("#restart"),
  select: document.querySelector("#room-select"),
  numbers: document.querySelector("#opt-numbers"),
  gentle: document.querySelector("#opt-gentle"),
};

// ---------------------------------------------------------------- storage

function loadStorage() {
  try {
    Object.assign(state.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
    state.solved = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY)) || []);
  } catch (error) {
    // Storage is only a convenience; carry on with defaults.
  }
}

function saveStorage() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...state.solved]));
  } catch (error) {
    // Ignore: the game works without storage.
  }
}

// --------------------------------------------------------------- geometry

// The scene is the board plus a thin band of boundary wall (PAD wide) around it.
// Board coordinates (bx, by) map to scene pixels (cellX(bx), cellY(by)).
const cellX = (bx) => PAD + bx * CELL;
const cellY = (by) => PAD + by * CELL;

function setupGeometry() {
  const { width, height } = state.level;
  const sw = width * CELL + 2 * PAD;
  const sh = height * CELL + 2 * PAD;
  geo = { sw, sh, cx: sw / 2, cy: sh / 2 };
  const lean = (PERSPECTIVE ? (WALL_LAYERS / (CAMERA - WALL_LAYERS)) * Math.max(geo.cx, geo.cy) : 0) + 0.7 * CELL;
  elements.board.setAttribute("viewBox", `${-lean} ${-lean} ${sw + 2 * lean} ${sh + 2 * lean}`);
}

function scale(z) {
  return PERSPECTIVE ? CAMERA / (CAMERA - z) : 1;
}

// Perspective projection of scene point (X, Y) at height z (in crate layers).
function project(X, Y, z) {
  const k = scale(z);
  return [geo.cx + (X - geo.cx) * k, geo.cy + (Y - geo.cy) * k];
}

function cellCentre(i) {
  const { width } = state.level;
  return { x: (i % width) + 0.5, y: Math.floor(i / width) + 0.5 };
}

// A gate is a doorway next to a cell: the exit beside the target cell, and the
// entry you arrive through beside the start cell. It is on the side of the cell
// facing the outer wall, or a wall cell connected to it. If that faces off the
// board the doorway is a gap in the thin boundary wall, otherwise it is that
// wall cell (a tunnel). Returns its scene rectangle, or null for levels without
// a gate side.
function gateInfo(cell, dir) {
  const { width, height } = state.level;
  if (dir < 0) return null;
  const col = (cell % width) + DIRS[dir].dc;
  const row = Math.floor(cell / width) + DIRS[dir].dr;
  const onBoard = row >= 0 && row < height && col >= 0 && col < width;
  let rect;
  if (onBoard) rect = [cellX(col), cellY(row), cellX(col + 1), cellY(row + 1)];
  else if (col < 0) rect = [0, cellY(row), PAD, cellY(row + 1)];
  else if (col >= width) rect = [cellX(width), cellY(row), cellX(width) + PAD, cellY(row + 1)];
  else if (row < 0) rect = [cellX(col), 0, cellX(col + 1), PAD];
  else rect = [cellX(col), cellY(height), cellX(col + 1), cellY(height) + PAD];
  return { row, col, onBoard, rect };
}

// Boundary wall: a half-width band, only beside open floor (edge wall cells are
// their own boundary, so rooms need not look square), with gaps at the gates.
function boundarySegments(gates) {
  const { width: W, height: H, wall } = state.level;
  const open = (r, c) => r >= 0 && r < H && c >= 0 && c < W && !wall[r * W + c];
  const gap = (r, c) => gates.some((gate) => !gate.onBoard && gate.row === r && gate.col === c);
  const segs = [];
  const top = [];
  const bottom = [];
  const left = [];
  const right = [];
  for (let c = 0; c < W; c += 1) {
    top[c] = open(0, c) && !gap(-1, c);
    bottom[c] = open(H - 1, c) && !gap(H, c);
    if (top[c]) segs.push([cellX(c), 0, cellX(c + 1), PAD]);
    if (bottom[c]) segs.push([cellX(c), cellY(H), cellX(c + 1), cellY(H) + PAD]);
  }
  for (let r = 0; r < H; r += 1) {
    left[r] = open(r, 0) && !gap(r, -1);
    right[r] = open(r, W - 1) && !gap(r, W);
    if (left[r]) segs.push([0, cellY(r), PAD, cellY(r + 1)]);
    if (right[r]) segs.push([cellX(W), cellY(r), cellX(W) + PAD, cellY(r + 1)]);
  }
  if (top[0] || left[0]) segs.push([0, 0, PAD, PAD]);
  if (top[W - 1] || right[0]) segs.push([cellX(W), 0, cellX(W) + PAD, PAD]);
  if (bottom[0] || left[H - 1]) segs.push([0, cellY(H), PAD, cellY(H) + PAD]);
  if (bottom[W - 1] || right[H - 1]) segs.push([cellX(W), cellY(H), cellX(W) + PAD, cellY(H) + PAD]);
  return segs;
}

// --------------------------------------------------------------- drawing

function svgEl(name, attrs, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
}

function pts(list) {
  return list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function poly(parent, list, fill, stroke, width = 1.2) {
  return svgEl("polygon", { points: pts(list), fill, stroke: stroke || "none", "stroke-width": width, "stroke-linejoin": "round" }, parent);
}

function line(parent, a, b, stroke, width = 1.2) {
  return svgEl("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke, "stroke-width": width, "stroke-linecap": "round" }, parent);
}

// Crate lid markings: a frame and a brace. The brace runs bottom-left to
// top-right so it stays clear of the height numeral in the top-left.
function drawLidMarks(g, at, style) {
  poly(g, [at(0.13, 0.13), at(0.87, 0.13), at(0.87, 0.87), at(0.13, 0.87)], "none", style.line, 2);
  line(g, at(0.87, 0.13), at(0.13, 0.87), style.line, 2);
}

function drawNumber(g, at, k, value, opacity) {
  const [x, y] = at(0.28, 0.32);
  const label = svgEl("text", {
    x, y, "font-size": 21 * k, "font-weight": 900, "text-anchor": "middle", "dominant-baseline": "central",
    "font-family": "Impact, 'Arial Black', 'Helvetica Neue', sans-serif", fill: "#3b2a12", opacity,
  }, g);
  label.textContent = String(value);
}

// One box between heights zb and zt over the scene rectangle (X0, Y0)-(X1, Y1):
// the side faces that face the camera axis, then the top. Returns a function
// mapping lid coordinates u, v in 0..1 to screen points.
function drawPrism(g, X0, Y0, X1, Y1, zb, zt, style, options = {}) {
  const faces = [];
  if (PERSPECTIVE && geo.cx < X0) faces.push([[X0, Y0], [X0, Y1], style.sideX]);
  if (PERSPECTIVE && geo.cx > X1) faces.push([[X1, Y0], [X1, Y1], style.sideX]);
  if (PERSPECTIVE && geo.cy < Y0) faces.push([[X0, Y0], [X1, Y0], style.sideY]);
  if (PERSPECTIVE && geo.cy > Y1) faces.push([[X0, Y1], [X1, Y1], style.sideY]);
  for (const [a, b, fill] of faces) {
    poly(g, [project(a[0], a[1], zb), project(b[0], b[1], zb), project(b[0], b[1], zt), project(a[0], a[1], zt)], fill, style.stroke);
    const courses = options.courses || 0;
    for (let j = 1; j < courses; j += 1) {
      const z = zb + ((zt - zb) * j) / courses;
      line(g, project(a[0], a[1], z), project(b[0], b[1], z), style.line);
    }
    if (options.seam) {
      const z = (zb + zt) / 2;
      line(g, project(a[0], a[1], z), project(b[0], b[1], z), style.line);
    }
  }
  const at = (u, v) => project(X0 + (X1 - X0) * u, Y0 + (Y1 - Y0) * v, zt);
  poly(g, [at(0, 0), at(1, 0), at(1, 1), at(0, 1)], options.top || style.top, style.stroke);
  if (options.lid) drawLidMarks(g, at, style);
  if (options.mortar) {
    line(g, at(0, 0.5), at(1, 0.5), style.line);
    line(g, at(0.5, 0), at(0.5, 0.5), style.line);
    line(g, at(0.25, 0.5), at(0.25, 1), style.line);
    line(g, at(0.75, 0.5), at(0.75, 1), style.line);
  }
  return at;
}

function drawCrate(g, X0, Y0, zb, zt, isTop) {
  return drawPrism(g, X0, Y0, X0 + CELL, Y0 + CELL, zb, zt, CRATE, { seam: true, lid: isTop, top: isTop ? LID_FILL : CRATE.sideY });
}

// Floor is crate tops at height 0, unnumbered.
function drawFloorTile(g, br, bc) {
  const X0 = cellX(bc);
  const Y0 = cellY(br);
  const at = (u, v) => [X0 + CELL * u, Y0 + CELL * v];
  poly(g, [at(0, 0), at(1, 0), at(1, 1), at(0, 1)], LID_FILL, CRATE.stroke);
  drawLidMarks(g, at, CRATE);
}

function drawStack(g, i, hd) {
  const { width } = state.level;
  const X0 = cellX(i % width);
  const Y0 = cellY(Math.floor(i / width));
  const layers = Math.ceil(hd - 1e-6);
  let at = null;
  // Without perspective the lower layers are hidden under the top one.
  for (let j = PERSPECTIVE ? 0 : Math.max(0, layers - 1); j < layers; j += 1) {
    at = drawCrate(g, X0, Y0, j, Math.min(j + 1, hd), j === layers - 1);
  }
  if (at && state.settings.numbers && hd > 0.5) drawNumber(g, at, scale(hd), Math.round(hd), 0.8);
}

function drawWall(g, X0, Y0, X1, Y1) {
  drawPrism(g, X0, Y0, X1, Y1, 0, WALL_LAYERS, STONE, { courses: WALL_LAYERS, mortar: true });
}

// Shadows: every stack and wall casts one down and to the right (light from the
// top left) onto each lower cell it reaches. The shadow is clipped to the
// receiving cell and drawn just above that cell's own contents, so it covers a
// lower crate's lid but is itself covered by anything taller.
function addShadows(items, casters, gates) {
  const { level } = state;
  for (const { rect, h } of casters) {
    for (let br = 0; br < level.height; br += 1) {
      for (let bc = 0; bc < level.width; bc += 1) {
        const i = br * level.width + bc;
        if (level.wall[i] || gates.some((gate) => gate.onBoard && gate.row === br && gate.col === bc)) continue;
        const hB = view.h[i];
        if (hB >= h - 0.05) continue;
        const off = Math.min(h - hB, 6) * SHADOW_PER_LAYER;
        const x0 = Math.max(rect[0] + off, cellX(bc));
        const y0 = Math.max(rect[1] + off * 1.15, cellY(br));
        const x1 = Math.min(rect[2] + off, cellX(bc + 1));
        const y1 = Math.min(rect[3] + off * 1.15, cellY(br + 1));
        if (x1 <= x0 || y1 <= y0) continue;
        items.push({
          key: hB + 0.01, dist: 0,
          draw: (g) => svgEl("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: SHADOW_COLOUR }, g),
        });
      }
    }
  }
}

// A doorway. The exit is warm and lit, with chevrons pointing out. The entry is
// cool daylight-blue, with chevrons pointing in: where you came from.
function drawPassage(g, [X0, Y0, X1, Y1], dirIndex, isEntry) {
  const dir = DIRS[dirIndex];
  const w = X1 - X0;
  const h = Y1 - Y0;
  const along = dir.dc !== 0 ? w : h;
  const outward = (Math.atan2(dir.dr, dir.dc) * 180) / Math.PI;
  const centre = `translate(${X0 + w / 2} ${Y0 + h / 2})`;
  const palette = isEntry
    ? { floor: "#d6e4f4", glow: "url(#glow-entry)", beam: "url(#beam-entry)", chevron: "#4a6a94" }
    : { floor: "#ffe9a6", glow: "url(#glow)", beam: "url(#beam)", chevron: "#c98a00" };
  const lit = isEntry ? 0.7 * (1 - view.entryClosed) : 0.55 + 0.45 * view.glow;
  // Light spilling out beyond the doorway (hidden by the walls for a tunnel).
  const beam = svgEl("g", { transform: `${centre} rotate(${outward})`, opacity: lit }, g);
  svgEl("rect", { x: along / 2, y: -CELL / 2, width: CELL * 1.6, height: CELL, fill: palette.beam }, beam);
  svgEl("rect", { x: X0, y: Y0, width: w, height: h, fill: palette.floor }, g);
  svgEl("rect", { x: X0, y: Y0, width: w, height: h, fill: palette.glow, opacity: isEntry ? 0.7 : 0.6 + 0.4 * view.glow }, g);
  // Chevrons (just one in the thin doorway of the boundary wall).
  const chevrons = svgEl("g", { transform: `${centre} rotate(${isEntry ? outward + 180 : outward})` }, g);
  for (const off of along >= CELL * 0.8 ? [-11, 5] : [-1]) {
    svgEl("polyline", { points: `${off - 7},-11 ${off + 5},0 ${off - 7},11`, fill: "none", stroke: palette.chevron, "stroke-width": 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, chevrons);
  }
}

// The two leaves of the entry door, sliding in from either side of the doorway
// until they meet. `closed` is 0 (open, nothing drawn) to 1 (shut).
function doorLeaves([X0, Y0, X1, Y1], dirIndex, closed) {
  const acrossY = DIRS[dirIndex].dc !== 0; // a doorway in a left/right wall closes vertically
  const length = acrossY ? Y1 - Y0 : X1 - X0;
  const reach = (length / 2) * closed;
  return acrossY
    ? [[X0, Y0, X1, Y0 + reach], [X0, Y1 - reach, X1, Y1]]
    : [[X0, Y0, X0 + reach, Y1], [X1 - reach, Y0, X1, Y1]];
}

// A crate in flight. `lift` is how far it is above where it will land: without
// perspective that shows as a bigger crate, higher up the screen, over its own
// shadow.
function drawGhost(g, ghost) {
  const X0 = cellX(ghost.x - 0.5);
  const Y0 = cellY(ghost.y - 0.5);
  const lift = PERSPECTIVE ? 0 : Math.max(0, ghost.lift);
  if (lift > 0) {
    svgEl("rect", { x: X0 + lift * 5, y: Y0 + lift * 6, width: CELL, height: CELL, fill: SHADOW_COLOUR, opacity: ghost.alpha }, g);
  }
  const cx = X0 + CELL / 2;
  const cy = Y0 + CELL / 2;
  const group = svgEl("g", {
    opacity: ghost.alpha,
    transform: lift > 0 ? `translate(${cx} ${cy - lift * 9}) scale(${1 + 0.1 * lift}) translate(${-cx} ${-cy})` : "",
  }, g);
  drawCrate(group, X0, Y0, ghost.z, ghost.z + 1, true);
}

function drawPlayer(g) {
  const pl = view.player;
  if (pl.alpha <= 0.01) return;
  const X = cellX(pl.x);
  const Y = cellY(pl.y);
  const [sx, sy] = project(X, Y, pl.base);
  svgEl("ellipse", { cx: sx, cy: sy, rx: 15 * scale(pl.base) * pl.scale, ry: 11 * scale(pl.base) * pl.scale, fill: "rgba(0, 0, 0, 0.28)", opacity: pl.alpha }, g);
  // Without perspective a hop shows as a slightly bigger figure, drawn higher up.
  const lift = PERSPECTIVE ? 0 : pl.z - pl.base;
  const [bx, by] = PERSPECTIVE ? project(X, Y, pl.z + 0.5) : [X, Y - lift * 9];
  const k = (PERSPECTIVE ? scale(pl.z + 0.5) : 1 + 0.1 * lift) * pl.scale;
  const body = svgEl("g", {
    transform: `translate(${bx + pl.leanX} ${by + pl.leanY}) rotate(${FACING_DEGREES[pl.facing]}) scale(${k})`,
    opacity: pl.alpha,
  }, g);
  // Seen from above, facing right: shoulders, hands, then head with hair.
  svgEl("ellipse", { cx: 0, cy: 0, rx: 9, ry: 15, fill: "#2f6fdb", stroke: "#12326e", "stroke-width": 2 }, body);
  svgEl("circle", { cx: 8, cy: -13, r: 4, fill: "#f3c98b", stroke: "#a9773a", "stroke-width": 1 }, body);
  svgEl("circle", { cx: 8, cy: 13, r: 4, fill: "#f3c98b", stroke: "#a9773a", "stroke-width": 1 }, body);
  svgEl("circle", { cx: -1, cy: 0, r: 9, fill: "#5b3a1a", stroke: "#2d1b09", "stroke-width": 1.5 }, body);
  svgEl("circle", { cx: 2, cy: 0, r: 6.5, fill: "#f3c98b" }, body);
  svgEl("circle", { cx: 5, cy: -2.6, r: 1.2, fill: "#3a2a12" }, body);
  svgEl("circle", { cx: 5, cy: 2.6, r: 1.2, fill: "#3a2a12" }, body);
}

function addTapPad(svg, rect, z, d) {
  const [X0, Y0, X1, Y1] = rect;
  const pad = svgEl("polygon", {
    points: pts([project(X0, Y0, z), project(X1, Y0, z), project(X1, Y1, z), project(X0, Y1, z)]),
    fill: "transparent", style: "cursor: pointer",
  }, svg);
  pad.addEventListener("click", () => move(d));
}

function render() {
  const { level, current } = state;
  const svg = elements.board;
  svg.replaceChildren();
  const defs = svgEl("defs", {}, svg);
  const glow = svgEl("radialGradient", { id: "glow" }, defs);
  svgEl("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": 0.95 }, glow);
  svgEl("stop", { offset: "100%", "stop-color": "#ffdf80", "stop-opacity": 0 }, glow);
  const beam = svgEl("linearGradient", { id: "beam", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  svgEl("stop", { offset: "0%", "stop-color": "#fff0b3", "stop-opacity": 0.75 }, beam);
  svgEl("stop", { offset: "100%", "stop-color": "#fff0b3", "stop-opacity": 0 }, beam);
  const glowEntry = svgEl("radialGradient", { id: "glow-entry" }, defs);
  svgEl("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": 0.9 }, glowEntry);
  svgEl("stop", { offset: "100%", "stop-color": "#b9d2f0", "stop-opacity": 0 }, glowEntry);
  const beamEntry = svgEl("linearGradient", { id: "beam-entry", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  svgEl("stop", { offset: "0%", "stop-color": "#cfe2ff", "stop-opacity": 0.6 }, beamEntry);
  svgEl("stop", { offset: "100%", "stop-color": "#cfe2ff", "stop-opacity": 0 }, beamEntry);

  const floor = svgEl("g", {}, svg);
  const scene = svgEl("g", {}, svg);
  const exit = gateInfo(level.target, level.exitDir);
  const entry = gateInfo(level.start, level.startDir);
  const gates = [exit, entry].filter(Boolean);
  const items = [];
  const distance2 = (x, y) => (x - geo.cx) ** 2 + (y - geo.cy) ** 2;
  const casters = [];

  if (exit) drawPassage(floor, exit.rect, level.exitDir, false);
  if (entry) drawPassage(floor, entry.rect, level.startDir, true);
  for (let br = 0; br < level.height; br += 1) {
    for (let bc = 0; bc < level.width; bc += 1) {
      const i = br * level.width + bc;
      if (gates.some((gate) => gate.onBoard && gate.row === br && gate.col === bc)) continue;
      const [X0, Y0] = [cellX(bc), cellY(br)];
      if (level.wall[i]) {
        items.push({ key: WALL_LAYERS + 1, dist: distance2(X0 + CELL / 2, Y0 + CELL / 2), draw: (g) => drawWall(g, X0, Y0, X0 + CELL, Y0 + CELL) });
        casters.push({ rect: [X0, Y0, X0 + CELL, Y0 + CELL], h: WALL_SHADOW_LAYERS });
        continue;
      }
      drawFloorTile(floor, br, bc);
      if (!exit && i === level.target) {
        svgEl("rect", { x: X0, y: Y0, width: CELL, height: CELL, fill: "#ffe9a6", opacity: 0.8 }, floor);
      }
      const hd = view.h[i];
      if (hd > 0.05) {
        casters.push({ rect: [X0, Y0, X0 + CELL, Y0 + CELL], h: hd });
        items.push({ key: hd, dist: distance2(X0 + CELL / 2, Y0 + CELL / 2), draw: (g) => drawStack(g, i, hd) });
      }
    }
  }
  if (entry && view.entryClosed > 0.001) {
    for (const [X0, Y0, X1, Y1] of doorLeaves(entry.rect, level.startDir, view.entryClosed)) {
      items.push({ key: WALL_LAYERS + 1, dist: distance2((X0 + X1) / 2, (Y0 + Y1) / 2), draw: (g) => drawPrism(g, X0, Y0, X1, Y1, 0, WALL_LAYERS, DOOR) });
    }
  }
  for (const [X0, Y0, X1, Y1] of boundarySegments(gates)) {
    casters.push({ rect: [X0, Y0, X1, Y1], h: WALL_SHADOW_LAYERS });
    items.push({ key: WALL_LAYERS + 1, dist: distance2((X0 + X1) / 2, (Y0 + Y1) / 2), draw: (g) => drawWall(g, X0, Y0, X1, Y1) });
  }
  addShadows(items, casters, gates);
  for (const ghost of view.ghosts) {
    items.push({ key: ghost.z + 1, dist: 0, draw: (g) => drawGhost(g, ghost) });
  }
  items.push({ key: view.player.z + 0.5, dist: 0, draw: drawPlayer });
  // Higher things cover lower ones; among equals, nearer the edge goes first.
  items.sort((a, b) => a.key - b.key || b.dist - a.dist);
  for (const item of items) item.draw(scene);

  // Tap targets: the four neighbours of the player, and on the target cell,
  // the player's own square or the doorway steps out.
  if (current.status === "playing") {
    const pos = current.game.pos;
    level.nbrs[pos].forEach((n, d) => {
      if (n < 0) return;
      const X0 = cellX(n % level.width);
      const Y0 = cellY(Math.floor(n / level.width));
      addTapPad(svg, [X0, Y0, X0 + CELL, Y0 + CELL], view.h[n], d);
    });
    if (exit && pos === level.target) {
      const X0 = cellX(pos % level.width);
      const Y0 = cellY(Math.floor(pos / level.width));
      addTapPad(svg, exit.rect, 0, level.exitDir);
      addTapPad(svg, [X0, Y0, X0 + CELL, Y0 + CELL], view.h[pos], level.exitDir);
    }
  }
}

// ------------------------------------------------------------ animation

const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const easeOut = (t) => 1 - (1 - t) ** 3;

// Phases run one after another; each has a duration in ms and an update(t)
// that sets `view` for t in 0..1. Starting a new move (or undo) first finishes
// the running animation instantly, so fast input never waits on it.
function runPhases(phases) {
  finishAnimation();
  if (REDUCED_MOTION || !phases.length) {
    settle();
    return;
  }
  anim = { phases, index: 0, start: performance.now(), raf: 0 };
  anim.raf = requestAnimationFrame(tick);
}

function tick(now) {
  const a = anim;
  if (!a) return;
  const phase = a.phases[a.index];
  const t = Math.min(1, (now - a.start) / phase.ms);
  phase.update(t);
  render();
  if (t >= 1) {
    a.index += 1;
    a.start = now;
    if (a.index >= a.phases.length) {
      anim = null;
      settle();
      return;
    }
  }
  a.raf = requestAnimationFrame(tick);
}

function finishAnimation() {
  if (!anim) return;
  cancelAnimationFrame(anim.raf);
  const a = anim;
  anim = null;
  for (let i = a.index; i < a.phases.length; i += 1) a.phases[i].update(1);
  settle();
}

// Called whenever the view catches up with the game state. Stepping through the
// doorway carries you straight on into the next room.
function settle() {
  syncView();
  render();
  updateHud();
  if (state.current.status === "won" && state.levelIndex + 1 < LEVELS.length) {
    loadLevel(state.levelIndex + 1);
  }
}

function walkPhase(from, to) {
  const a = cellCentre(from);
  const b = cellCentre(to);
  const z0 = view.h[from];
  const z1 = view.h[to];
  const pl = view.player;
  return {
    ms: 170,
    update(t) {
      const e = easeInOut(t);
      pl.x = lerp(a.x, b.x, e);
      pl.y = lerp(a.y, b.y, e);
      pl.base = lerp(z0, z1, e);
      pl.z = pl.base + 0.35 * Math.sin(Math.PI * t);
    },
  };
}

// Stepping out: from the target cell through the doorway, down to floor level
// (whatever height you were standing at), fading into the light.
function exitPhase(target) {
  const a = cellCentre(target);
  const dir = DIRS[state.level.exitDir];
  const pl = view.player;
  const z0 = view.h[target];
  return {
    ms: 520,
    update(t) {
      const e = easeInOut(t);
      pl.x = a.x + dir.dc * 1.1 * e;
      pl.y = a.y + dir.dr * 1.1 * e;
      pl.base = lerp(z0, 0, Math.min(1, e * 2));
      pl.z = pl.base + 0.3 * Math.sin(Math.PI * Math.min(1, t * 2));
      pl.alpha = 1 - Math.max(0, t - 0.45) / 0.55;
      view.glow = t;
    },
  };
}

// Arriving: the mirror of stepping out. You walk in from the entry doorway onto
// the start cell, rising from floor level to whatever height it is.
function entryPhase() {
  const { level } = state;
  const c = cellCentre(level.start);
  const dir = DIRS[level.startDir];
  const pl = view.player;
  const z1 = view.h[level.start];
  return {
    ms: 780,
    update(t) {
      const e = easeInOut(t);
      const back = 1 - t;
      view.entryClosed = 0;
      pl.facing = level.startDir ^ 1; // directions come in opposite pairs
      pl.x = c.x + dir.dc * 1.1 * (1 - e);
      pl.y = c.y + dir.dr * 1.1 * (1 - e);
      pl.base = lerp(z1, 0, Math.min(1, back * 2));
      pl.z = pl.base + 0.3 * Math.sin(Math.PI * Math.min(1, back * 2));
      pl.alpha = Math.min(1, t / 0.55);
    },
  };
}

// Once you're in, the entry door slides shut behind you (after a beat).
function closeDoorPhase() {
  return {
    ms: 700,
    update(t) {
      view.entryClosed = easeInOut(Math.max(0, (t - 0.2) / 0.8));
    },
  };
}

function fallPhases(from, to, d) {
  const a = cellCentre(from);
  const b = cellCentre(to);
  const z0 = view.h[from];
  const pl = view.player;
  return [
    {
      ms: 160,
      update(t) {
        pl.x = lerp(a.x, lerp(a.x, b.x, 0.6), easeOut(t));
        pl.y = lerp(a.y, lerp(a.y, b.y, 0.6), easeOut(t));
      },
    },
    {
      ms: 480,
      update(t) {
        pl.x = lerp(lerp(a.x, b.x, 0.6), b.x, t);
        pl.y = lerp(lerp(a.y, b.y, 0.6), b.y, t);
        pl.base = z0 - 5 * t * t;
        pl.z = pl.base;
        pl.scale = 1 - 0.5 * t;
        pl.alpha = 1 - t * t;
      },
    },
  ];
}

function nudgePhase(d) {
  const pl = view.player;
  return {
    ms: 120,
    update(t) {
      const push = 7 * Math.sin(Math.PI * t);
      pl.leanX = DIRS[d].dc * push;
      pl.leanY = DIRS[d].dr * push;
    },
  };
}

// The signature moment: the top crate of the pile lifts off, splits into up to
// four copies, they drift down onto the neighbouring stacks (yours included, so
// you are lifted), and if every stack now has a crate under it the bottom layer
// sinks away. With the "push until you can climb" option this repeats.
function pushPhases(prevGame, out, d) {
  const { level } = state;
  const pos = prevGame.pos;
  const pile = level.nbrs[pos][d];
  const nbrs = level.nbrs[pile].filter((n) => n >= 0);
  const pc = cellCentre(pile);
  const pl = view.player;
  const hs = Float64Array.from(prevGame.h);
  const phases = [];
  const follow = () => {
    pl.base = view.h[pos];
    pl.z = pl.base;
  };

  for (let round = 0; round < out.spreads; round += 1) {
    const before = Float64Array.from(hs);
    const top = before[pile];
    const liftZ = top - 1 + 1.1;
    const flying = () =>
      nbrs.map((n) => ({ cell: n, ...cellCentre(n) }));
    phases.push({
      ms: 240,
      update(t) {
        view.h.set(before);
        view.h[pile] = top - 1;
        view.ghosts = [{ x: pc.x, y: pc.y, z: top - 1 + 1.1 * easeOut(t), lift: 1.1 * easeOut(t), alpha: 1 }];
        pl.leanX = DIRS[d].dc * 7 * Math.sin(Math.PI * Math.min(1, t * 1.5));
        pl.leanY = DIRS[d].dr * 7 * Math.sin(Math.PI * Math.min(1, t * 1.5));
        follow();
      },
    });
    phases.push({
      ms: 560,
      update(t) {
        pl.leanX = 0;
        pl.leanY = 0;
        const e = easeOut(t);
        view.ghosts = flying().map((f) => {
          const endZ = f.cell === pos ? before[f.cell] + 1.05 : before[f.cell];
          const z = lerp(liftZ, endZ, e) + 0.12 * Math.sin(t * Math.PI * 3) * (1 - t);
          return { x: lerp(pc.x, f.x, e), y: lerp(pc.y, f.y, e), z, lift: z - endZ, alpha: 0.95 };
        });
      },
    });
    phases.push({
      ms: 260,
      update(t) {
        view.h.set(before);
        view.h[pile] = top - 1;
        view.ghosts = [];
        for (const n of nbrs) {
          if (n !== pos) {
            view.h[n] = before[n] + 1;
          } else {
            view.h[n] = before[n] + easeInOut(t);
            const c = cellCentre(n);
            view.ghosts.push({ x: c.x, y: c.y, z: before[n] + 1.05 - 0.05 * t, lift: 0, alpha: 1 - t });
          }
        }
        follow();
      },
    });
    hs[pile] -= 1;
    for (const n of nbrs) hs[n] += 1;
  }

  if (out.reflooded > 0) {
    const after = Float64Array.from(out.state.h);
    const raised = Float64Array.from(hs);
    phases.push({
      ms: 380,
      update(t) {
        for (let i = 0; i < raised.length; i += 1) view.h[i] = level.wall[i] ? 0 : lerp(raised[i], after[i], easeInOut(t));
        view.ghosts = [];
        follow();
      },
    });
  }
  return phases;
}

// ---------------------------------------------------------------- play

function syncView() {
  const { game, status } = state.current;
  const c = cellCentre(game.pos);
  const pl = view.player;
  view.h = Float64Array.from(game.h);
  view.ghosts = [];
  view.glow = status === "won" ? 1 : 0;
  view.entryClosed = 1;
  Object.assign(pl, {
    x: c.x, y: c.y, base: game.h[game.pos], z: game.h[game.pos],
    alpha: status === "playing" ? 1 : 0, scale: 1, leanX: 0, leanY: 0,
  });
}

function loadLevel(index) {
  finishAnimation();
  state.levelIndex = index;
  state.level = parseLevel(LEVELS[index].text);
  setupGeometry();
  view.player.facing = 1;
  restart();
}

function restart() {
  finishAnimation();
  state.history = [];
  state.current = {
    game: createState(state.level),
    moves: 0,
    pushes: 0,
    status: "playing",
    message: "The door closes behind you. Find the lit doorway, and step through it.",
  };
  syncView();
  render();
  updateHud();
  playEntry();
}

function playEntry() {
  if (state.level.startDir < 0 || REDUCED_MOTION) return;
  const phase = entryPhase();
  phase.update(0);
  render();
  runPhases([phase, closeDoorPhase()]);
}

function undo() {
  finishAnimation();
  if (!state.history.length) return;
  state.current = state.history.pop();
  syncView();
  render();
  updateHud();
}

function move(d) {
  finishAnimation();
  const cur = state.current;
  if (cur.status !== "playing") return;
  const { level } = state;
  const opts = { soft: state.settings.gentle, justEnough: state.settings.justEnough };
  const from = cur.game.pos;
  const to = level.nbrs[from][d];
  view.player.facing = d;
  const out = step(level, cur.game, d, opts);

  if (out.result === "blocked") {
    if (to >= 0) cur.message = "That's too far to drop.";
    runPhases([nudgePhase(d)]);
    updateHud();
    return;
  }

  const next = { game: out.state, moves: cur.moves + 1, pushes: cur.pushes, status: "playing", message: "" };
  let phases;
  if (out.result === "pushed") {
    next.pushes += 1;
    next.message = "The top crate splits, and the copies drift down around it. You're lifted a level.";
    if (out.reflooded) next.message += " Every stack is at least one high, so the bottom layer sinks away.";
    phases = pushPhases(cur.game, out, d);
  } else if (out.result === "won") {
    next.status = "won";
    next.message = state.levelIndex + 1 < LEVELS.length ? "Out!" : "Out! That was the last room.";
    phases = level.exitDir >= 0 ? [exitPhase(from)] : [walkPhase(from, to), exitPhase(to)];
    state.solved.add(state.levelIndex);
    saveStorage();
  } else if (out.result === "died") {
    next.status = "died";
    next.message = "Too far to drop! Undo to take it back.";
    phases = fallPhases(from, to, d);
  } else {
    phases = [walkPhase(from, to)];
  }
  state.history.push(cur);
  state.current = next;
  runPhases(phases);
  updateHud();
}

function advice() {
  const cur = state.current;
  if (!state.cheat || cur.status !== "playing") return null;
  const out = solve(state.level, { from: cur.game, justEnough: state.settings.justEnough, maxHeight: 12 });
  return out;
}

function updateHud() {
  const cur = state.current;
  const settled = !anim;
  const total = LEVELS.length;
  elements.title.textContent = `Room ${state.levelIndex + 1} of ${total}`;
  elements.counts.textContent = `Moves ${cur.moves}  ·  Pushes ${cur.pushes}`;
  // Hold back the outcome until the animation has played.
  elements.message.textContent = settled || cur.status === "playing" ? cur.message : "";
  elements.message.className = settled && cur.status !== "playing" ? cur.status : "";
  elements.undo.disabled = state.history.length === 0;

  const box = elements.cheatStatus;
  box.className = "";
  const result = settled ? advice() : null;
  if (!state.cheat || !result) {
    box.textContent = "";
  } else if (result.status === "solved") {
    box.textContent = `Peek: go ${DIR_WORDS[DIRS.findIndex((dir) => dir.name === result.moves[0])]} next (${result.moves.length} moves left).`;
  } else if (result.status === "unsolvable") {
    box.className = "dead";
    box.textContent = "This room can't be escaped any more. Undo, or restart.";
  } else {
    box.textContent = "Couldn't tell: the search limit was reached.";
  }

  for (const [i, option] of [...elements.select.options].entries()) {
    option.textContent = `${state.solved.has(i) ? "✓ " : ""}${LEVELS[i].name}`;
  }
  elements.select.value = String(state.levelIndex);
}

function init() {
  loadStorage();
  LEVELS.forEach((level, i) => {
    elements.select.appendChild(new Option(level.name, String(i)));
  });
  elements.numbers.checked = state.settings.numbers;
  elements.gentle.checked = state.settings.gentle;

  elements.select.addEventListener("change", () => loadLevel(Number(elements.select.value)));
  elements.undo.addEventListener("click", undo);
  elements.restart.addEventListener("click", restart);
  elements.numbers.addEventListener("change", () => {
    state.settings.numbers = elements.numbers.checked;
    saveStorage();
    render();
  });
  elements.gentle.addEventListener("change", () => {
    state.settings.gentle = elements.gentle.checked;
    saveStorage();
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLSelectElement) return;
    if (event.key === "z" || event.key === "Z") {
      undo();
    } else if (event.key === "r" || event.key === "R") {
      restart();
    } else if (event.key === "c" || event.key === "C") {
      state.cheat = !state.cheat;
      updateHud();
    } else if (event.key in KEY_DIRS) {
      event.preventDefault();
      move(KEY_DIRS[event.key]);
    }
  });

  const requested = Number(new URLSearchParams(location.search).get("room")) - 1;
  loadLevel(requested >= 0 && requested < LEVELS.length ? requested : 0);
}

init();
