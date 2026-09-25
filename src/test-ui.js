// Test UI for Crated In. Rules live in engine.js (loaded first);
// this file only draws the board and turns input into step() calls.

const CELL = 64;
const SVG_NS = "http://www.w3.org/2000/svg";
const SETTINGS_KEY = "crated-in.settings.v1";
const HINT_COLORS = { walk: "#009e73", push: "#e69f00", drop: "#d55e00" };
// Light-to-dark ramp for heights 0..6; taller piles reuse the last colour.
const HEIGHT_FILLS = ["#f4f1e8", "#dbe6ee", "#bcd3e3", "#97bad5", "#729fc5", "#5385b3", "#3b6b9c"];
const KEY_DIRS = {
  ArrowUp: 0, w: 0, W: 0,
  ArrowDown: 1, s: 1, S: 1,
  ArrowLeft: 2, a: 2, A: 2,
  ArrowRight: 3, d: 3, D: 3,
};

const state = {
  levelIndex: 0,
  level: null,
  // Each entry is a full snapshot, so undo is just popping.
  history: [],
  current: null,
  settings: { hints: true, soft: false, justEnough: false },
  cheat: false,
};

const DIR_WORDS = { U: "up", D: "down", L: "left", R: "right" };
const DIR_ARROWS = { U: "▲", D: "▼", L: "◀", R: "▶" };

const elements = {
  board: document.querySelector("#board"),
  select: document.querySelector("#level-select"),
  undo: document.querySelector("#undo"),
  restart: document.querySelector("#restart"),
  cheat: document.querySelector("#cheat"),
  cheatStatus: document.querySelector("#cheat-status"),
  status: document.querySelector("#status"),
  counts: document.querySelector("#counts"),
  hints: document.querySelector("#opt-hints"),
  soft: document.querySelector("#opt-soft"),
  enough: document.querySelector("#opt-enough"),
};

function loadSettings() {
  try {
    Object.assign(state.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
  } catch (error) {
    // Storage is only a convenience; carry on with defaults.
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch (error) {
    // Ignore: the game works without storage.
  }
}

function loadLevel(index) {
  state.levelIndex = index;
  state.level = parseLevel(LEVELS[index].text);
  restart();
  elements.select.value = String(index);
  const svg = elements.board;
  svg.setAttribute("viewBox", `0 0 ${state.level.width * CELL} ${state.level.height * CELL}`);
}

function restart() {
  state.history = [];
  state.current = {
    game: createState(state.level),
    moves: 0,
    pushes: 0,
    status: "playing",
    message: "",
  };
  render();
}

function undo() {
  if (!state.history.length) return;
  state.current = state.history.pop();
  render();
}

function move(d) {
  const cur = state.current;
  if (cur.status !== "playing") return;
  const opts = { soft: state.settings.soft, justEnough: state.settings.justEnough };
  const out = step(state.level, cur.game, d, opts);
  if (out.result === "blocked") return;
  const next = { game: out.state, moves: cur.moves + 1, pushes: cur.pushes, status: "playing", message: "" };
  if (out.result === "pushed") {
    next.pushes += 1;
    next.message = out.reflooded ? "The pile spread, and the floor dropped." : "The pile spread.";
  } else if (out.result === "won") {
    next.status = "won";
    next.message = "You stepped out!";
  } else if (out.result === "died") {
    next.status = "died";
    next.message = "You fell. Undo to take it back.";
  }
  state.history.push(cur);
  state.current = next;
  render();
}

function classifyNeighbour(gap) {
  if (gap >= 2) return "push";
  if (gap <= -2) return "drop";
  return "walk";
}

function svgEl(name, attrs, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
}

function starPoints(cx, cy, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

// Cheat mode: search from the current position for a shortest win. Runs on
// every render while cheat is on, which is fine for boards this small (the
// solver's state cap bounds the worst case).
function analyse() {
  const cur = state.current;
  if (!state.cheat || cur.status !== "playing") return null;
  const out = solve(state.level, { from: cur.game, justEnough: state.settings.justEnough, maxHeight: 12 });
  if (out.status !== "solved") return { status: out.status };
  return { status: "solved", letter: out.moves[0], length: out.moves.length, pushes: out.pushes };
}

function render() {
  const { level, current } = state;
  const svg = elements.board;
  svg.replaceChildren();
  const { h, pos } = current.game;
  const advice = analyse();
  const hintFor = new Map();
  if (state.settings.hints && current.status === "playing") {
    level.nbrs[pos].forEach((n, d) => {
      if (n >= 0) hintFor.set(n, { d, kind: classifyNeighbour(h[n] - h[pos]) });
    });
  }

  for (let i = 0; i < level.width * level.height; i += 1) {
    const x = (i % level.width) * CELL;
    const y = Math.floor(i / level.width) * CELL;
    const group = svgEl("g", {}, svg);
    if (level.wall[i]) {
      svgEl("rect", { x, y, width: CELL, height: CELL, fill: "#3a3d43" }, group);
      continue;
    }
    svgEl("rect", { x, y, width: CELL, height: CELL, fill: HEIGHT_FILLS[Math.min(h[i], HEIGHT_FILLS.length - 1)], stroke: "#b9b4a7", "stroke-width": 1 }, group);
    const hint = hintFor.get(i);
    if (hint) {
      svgEl("rect", { x: x + 3, y: y + 3, width: CELL - 6, height: CELL - 6, fill: "none", stroke: HINT_COLORS[hint.kind], "stroke-width": 4, rx: 4 }, group);
    }
    const label = svgEl("text", { x: x + 8, y: y + 20, "font-size": 18, "font-weight": 700, fill: h[i] >= 4 ? "#ffffff" : "#23262b" }, group);
    label.textContent = String(h[i]);
    if (i === level.target && level.exitDir >= 0) {
      // The gap you must step out through, on this side of the star's cell.
      const dir = DIRS[level.exitDir];
      const bar = { x: x + (dir.dc > 0 ? CELL - 6 : 0), y: y + (dir.dr > 0 ? CELL - 6 : 0) };
      svgEl("rect", { x: dir.dc ? bar.x : x, y: dir.dr ? bar.y : y, width: dir.dc ? 6 : CELL, height: dir.dr ? 6 : CELL, fill: "#f0c419" }, group);
    }
    if (i === level.target) {
      svgEl("polygon", { points: starPoints(x + CELL / 2, y + CELL / 2 + 3, 20, 9), fill: "#f0c419", stroke: "#8a6d00", "stroke-width": 2 }, group);
    }
    if (i === pos) {
      svgEl("circle", { cx: x + CELL / 2, cy: y + CELL / 2 + 3, r: 15, fill: "#d55e00", stroke: "#ffffff", "stroke-width": 3 }, group);
    }
    if (advice && advice.status === "solved" && i === level.nbrs[pos][DIRS.findIndex((dir) => dir.name === advice.letter)]) {
      const mark = svgEl("text", { x: x + CELL - 8, y: y + CELL - 8, "font-size": 16, "text-anchor": "end", fill: h[i] >= 4 ? "#ffffff" : "#23262b" }, group);
      mark.textContent = DIR_ARROWS[advice.letter];
    }
    // Tap target: the whole cell. Only neighbours of the player do anything.
    const tap = svgEl("rect", { x, y, width: CELL, height: CELL, fill: "transparent" }, group);
    tap.addEventListener("click", () => {
      const d = level.nbrs[state.current.game.pos].indexOf(i);
      if (d >= 0) move(d);
    });
  }

  elements.status.textContent = current.message || (current.status === "playing" ? "Reach the star." : "");
  elements.status.className = current.status === "playing" ? "" : current.status;
  elements.counts.textContent = `Moves: ${current.moves}   Pushes: ${current.pushes}`;
  renderCheat(advice);
  elements.undo.disabled = state.history.length === 0;
}

function renderCheat(advice) {
  const box = elements.cheatStatus;
  box.className = "";
  elements.cheat.setAttribute("aria-pressed", String(state.cheat));
  if (!advice) {
    box.textContent = "";
  } else if (advice.status === "solved") {
    box.textContent = `Solvable: go ${DIR_WORDS[advice.letter]} next (${advice.length} moves left, ${advice.pushes} pushes).`;
  } else if (advice.status === "unsolvable") {
    box.className = "dead";
    box.textContent = "No longer solvable. Undo, or restart.";
  } else {
    box.textContent = "Couldn't tell: the search limit was reached.";
  }
}

function toggleCheat() {
  state.cheat = !state.cheat;
  render();
}

function init() {
  loadSettings();
  LEVELS.forEach((level, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = level.name;
    elements.select.appendChild(option);
  });
  elements.hints.checked = state.settings.hints;
  elements.soft.checked = state.settings.soft;
  elements.enough.checked = state.settings.justEnough;

  elements.select.addEventListener("change", () => loadLevel(Number(elements.select.value)));
  elements.undo.addEventListener("click", undo);
  elements.restart.addEventListener("click", restart);
  elements.cheat.addEventListener("click", toggleCheat);
  const bindOption = (element, key) =>
    element.addEventListener("change", () => {
      state.settings[key] = element.checked;
      saveSettings();
      render();
    });
  bindOption(elements.hints, "hints");
  bindOption(elements.soft, "soft");
  bindOption(elements.enough, "justEnough");

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLSelectElement) return;
    if (event.key === "z" || event.key === "Z") {
      undo();
    } else if (event.key === "c" || event.key === "C") {
      toggleCheat();
    } else if (event.key === "r" || event.key === "R") {
      restart();
    } else if (event.key in KEY_DIRS) {
      event.preventDefault();
      move(KEY_DIRS[event.key]);
    }
  });

  loadLevel(0);
}

init();
