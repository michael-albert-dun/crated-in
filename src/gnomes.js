// The gnome transition (an experiment, see README): when you leave a solved
// walkable room by its pillar of light, you are lifted away, a flood of gnomes
// runs in from every side and carries the old crates out, the room is rebuilt
// as the next level by another flood carrying crates in, and a column of light
// drops you onto the start square. It is meant to look busy and frantic, not
// plausible.
//
// Everything on screen is a pure function of the stage's clock: planGnomes()
// fixes every gnome's route and the moment each crate changes hands up front
// (seeded, so the same transition always looks the same), and update(t) only
// reads the plan at time t. That also means fast-forwarding (a keypress calls
// update(1)) always lands on exactly the right board. Loaded before game.js
// and used only through the hooks there (typeof gnomeClearPhase); a page
// without this file keeps the plain transition. Uses game.js's view, svgEl,
// cellX/cellY and easing helpers at call time.

const GNOME_CLEAR_MS = 3000;
const GNOME_BUILD_MS = 3600;
const GNOME_PAUSE = 0.2; // seconds a gnome spends at a crate
const GNOME_HATS = ["#d62f2f"]; // all red, like proper gnomes (the tunics still vary)
const GNOME_TUNICS = ["#2f6f4f", "#3d4f8a", "#7a4a2a", "#5a5a5a", "#8a3b5a"];

function gnomeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A point just outside the room on one side, in cell units. `near` picks the
// side closest to (x, y); otherwise any side, so routes cross the room.
function gnomeEdgePoint(level, x, y, near, rand) {
  const { width, height } = level;
  const gap = 1.35;
  const sides = [
    { d: y, p: () => [rand() * width, -gap] },
    { d: height - y, p: () => [rand() * width, height + gap] },
    { d: x, p: () => [-gap, rand() * height] },
    { d: width - x, p: () => [width + gap, rand() * height] },
  ];
  const side = near ? sides.slice().sort((a, b) => a.d - b.d)[0] : sides[Math.floor(rand() * 4)];
  return side.p();
}

// mode "clear": every crate is taken from a cell and carried out of the room;
// "build": crates are carried in and dropped until `target` is built. Returns
// { gnomes, jobs, ms } where each job is { cell, delta, at } (at: seconds from
// the stage's start at which the stack changes) and each gnome has a route of
// timed points { x, y, t, carry, work }.
function planGnomes(level, mode, heights, seed, ms) {
  const rand = gnomeRandom(seed);
  const jobs = [];
  for (let c = 0; c < heights.length; c += 1) {
    if (level.wall[c]) continue;
    const count = Math.round(heights[c]);
    for (let k = 0; k < count; k += 1) jobs.push({ cell: c, delta: mode === "clear" ? -1 : 1, at: 0 });
  }
  for (let i = jobs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
  }
  const total = ms / 1000;
  const count = Math.max(8, Math.min(24, Math.ceil(jobs.length / 2.6)));
  const gnomes = [];
  for (let g = 0; g < count; g += 1) {
    const mine = jobs.filter((_, i) => i % count === g);
    const centre = (cell) => [(cell % level.width) + 0.5, Math.floor(cell / level.width) + 0.5];
    // Waypoints in order; carry says whether the leg that *arrives* here is loaded.
    const points = [];
    let [px, py] = gnomeEdgePoint(level, level.width / 2, level.height / 2, false, rand);
    points.push({ x: px, y: py, carry: false, work: null });
    for (const job of mine) {
      const [cx, cy] = centre(job.cell);
      points.push({ x: cx, y: cy, carry: mode === "build", work: job });
      [px, py] = gnomeEdgePoint(level, cx, cy, rand() < 0.5, rand);
      points.push({ x: px, y: py, carry: mode === "clear", work: null });
    }
    let dist = 0;
    for (let i = 1; i < points.length; i += 1) dist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    const start = rand() * 0.08 * total;
    const budget = total * (0.9 + 0.1 * rand()) - start;
    const pauses = mine.length * GNOME_PAUSE;
    const speed = dist / Math.max(0.2, budget - pauses);
    let t = start;
    points[0].t = t;
    points[0].tOut = t;
    for (let i = 1; i < points.length; i += 1) {
      t += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) / speed;
      points[i].t = t;
      if (points[i].work) {
        points[i].work.at = t + GNOME_PAUSE / 2;
        t += GNOME_PAUSE;
      }
      points[i].tOut = t;
    }
    gnomes.push({ points, hat: GNOME_HATS[g % GNOME_HATS.length], tunic: GNOME_TUNICS[(g * 3) % GNOME_TUNICS.length], phase: rand() * 6.28 });
  }
  jobs.sort((a, b) => a.at - b.at);
  return { gnomes, jobs, mode, ms, base: Float64Array.from(heights) };
}

// Where a gnome is at time s (seconds), or null when off-stage: { x, y, angle,
// carry, working }.
function gnomeAt(gnome, s) {
  const pts = gnome.points;
  if (s < pts[0].t || s > pts[pts.length - 1].tOut) return null;
  for (let i = 1; i < pts.length; i += 1) {
    if (s <= pts[i].t) {
      const a = pts[i - 1];
      const b = pts[i];
      const k = (s - a.tOut) / Math.max(1e-6, b.t - a.tOut);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x), carry: b.carry, working: false };
    }
    if (s <= pts[i].tOut) {
      const next = pts[i + 1] || pts[i];
      const angle = next === pts[i] ? 0 : Math.atan2(next.y - pts[i].y, next.x - pts[i].x);
      return { x: pts[i].x, y: pts[i].y, angle, carry: false, working: true };
    }
  }
  return null;
}

// The stack heights at time s: the plan's base with every job done by then.
function gnomeHeights(plan, s, into) {
  into.set(plan.base);
  for (const job of plan.jobs) if (job.at <= s) into[job.cell] += job.delta;
  return into;
}

function drawGnome(g, gnome, pose, s) {
  const x = cellX(pose.x);
  const y = cellY(pose.y);
  const stride = s * 22 + gnome.phase;
  const hop = pose.working ? 0 : Math.abs(Math.sin(stride)) * 4;
  const group = svgEl("g", {}, g);
  svgEl("ellipse", { cx: x + 2, cy: y + 5, rx: 10, ry: 6.5, fill: "rgba(0, 0, 0, 0.25)" }, group);
  const body = svgEl("g", { transform: `translate(${x.toFixed(1)} ${(y - hop).toFixed(1)}) rotate(${((pose.angle * 180) / Math.PI).toFixed(0)})` }, group);
  const swing = pose.working ? Math.sin(s * 40 + gnome.phase) * 2 : Math.sin(stride) * 4;
  svgEl("ellipse", { cx: swing, cy: -5, rx: 4.2, ry: 2.8, fill: "#4a3320" }, body);
  svgEl("ellipse", { cx: -swing, cy: 5, rx: 4.2, ry: 2.8, fill: "#4a3320" }, body);
  svgEl("ellipse", { cx: 0, cy: 0, rx: 9, ry: 8, fill: gnome.tunic, stroke: "#1e1a16", "stroke-width": 1.4 }, body);
  svgEl("ellipse", { cx: 6.5, cy: 0, rx: 6.5, ry: 5.2, fill: "#f6f2e8", stroke: "#b9b2a2", "stroke-width": 1 }, body);
  svgEl("circle", { cx: -1, cy: 0, r: 7.4, fill: gnome.hat, stroke: "#1e1a16", "stroke-width": 1.4 }, body);
  svgEl("circle", { cx: -7.5, cy: pose.working ? 0 : Math.sin(stride) * 2, r: 2.8, fill: gnome.hat, stroke: "#1e1a16", "stroke-width": 1.2 }, body);
  if (pose.carry) {
    const cy = y - hop - 15;
    svgEl("rect", { x: x - 11, y: cy - 11, width: 22, height: 22, rx: 2, fill: "#e2b878", stroke: "#7a5a2c", "stroke-width": 2 }, group);
    svgEl("line", { x1: x - 8, y1: cy + 8, x2: x + 8, y2: cy - 8, stroke: "#7a5a2c", "stroke-width": 2 }, group);
  }
}

function drawGnomePuffs(g, plan, s) {
  for (const job of plan.jobs) {
    const age = s - job.at;
    if (age < 0 || age > 0.45) continue;
    const k = age / 0.45;
    const level = state.level;
    const x = cellX((job.cell % level.width) + 0.5);
    const y = cellY(Math.floor(job.cell / level.width) + 0.5);
    for (let n = 0; n < 4; n += 1) {
      const a = n * 1.57 + job.cell;
      svgEl("circle", {
        cx: x + Math.cos(a) * 22 * k, cy: y + Math.sin(a) * 16 * k - 6 * k, r: 5 + 9 * k,
        fill: `rgba(236, 226, 204, ${(0.55 * (1 - k)).toFixed(2)})`,
      }, g);
    }
  }
}

// render() calls this to add the gnomes, their dust and any carried crates.
function gnomeItems(items) {
  const scene = view.gnomes;
  if (!scene) return;
  const { plan, s } = scene;
  items.push({ key: 40, dist: 0, draw: (g) => drawGnomePuffs(g, plan, s) });
  for (const gnome of plan.gnomes) {
    const pose = gnomeAt(gnome, s);
    if (!pose) continue;
    items.push({ key: 41 + pose.y * 0.01, dist: 0, draw: (g) => drawGnome(g, gnome, pose, s) });
  }
}

function gnomeStage(plan) {
  const scratch = new Float64Array(plan.base.length);
  return {
    ms: plan.ms,
    update(t) {
      const s = Math.min(1, t) * (plan.ms / 1000);
      view.h = gnomeHeights(plan, s, scratch).slice();
      view.gnomes = t >= 1 ? null : { plan, s };
    },
  };
}

// Lifted away: the player floats up the pillar they just stepped onto and is gone.
function gnomeLiftPhase(cell) {
  const a = cellCentre(cell);
  const pl = view.player;
  const z0 = view.h[cell];
  return {
    ms: 1300,
    update(t) {
      const rise = easeInOut(t);
      pl.x = a.x;
      pl.y = a.y;
      pl.base = z0;
      pl.z = z0 + 3.4 * rise;
      pl.alpha = 1 - Math.max(0, (rise - 0.35) / 0.65);
      view.glow = Math.min(1, t * 2);
      view.rise = rise;
    },
  };
}

// The old room's crates all go out. The pillar fades as the gnomes arrive.
function gnomeClearPhase(level, heights) {
  const plan = planGnomes(level, "clear", heights, 1000 + state.levelIndex, GNOME_CLEAR_MS);
  const stage = gnomeStage(plan);
  return {
    ms: stage.ms,
    update(t) {
      view.player.alpha = 0;
      view.rise = 0;
      view.glow = 0;
      view.pillarAlpha = Math.max(0, 1 - t / 0.2);
      stage.update(t);
    },
  };
}

// The next room is built from nothing. The caller has already set view.h to
// zeros for the new level's geometry.
function gnomeBuildPhase(level, target) {
  const plan = planGnomes(level, "build", target, 2000 + state.levelIndex, GNOME_BUILD_MS);
  plan.base.fill(0);
  const stage = gnomeStage(plan);
  return {
    ms: stage.ms,
    update(t) {
      view.player.alpha = 0;
      stage.update(t);
    },
  };
}

// The pillar of light comes back over the start square and drops the player in.
function gnomeDropPhase() {
  const { level } = state;
  const c = cellCentre(level.start);
  const pl = view.player;
  const facing = readyFacing();
  return {
    ms: 1300,
    update(t) {
      const z1 = view.h[level.start]; // read now: the build stage has finished by the time this runs
      const fall = Math.min(1, Math.max(0, (t - 0.25) / 0.4));
      const landed = Math.min(1, Math.max(0, (t - 0.65) / 0.25));
      view.beam = t >= 1 ? 0 : easeOut(Math.min(1, t / 0.2)) * (1 - easeInOut(Math.max(0, (t - 0.75) / 0.25)));
      view.beamRise = 1 - t;
      pl.facing = facing;
      pl.x = c.x;
      pl.y = c.y;
      pl.base = z1;
      pl.z = z1 + 3.4 * (1 - fall * fall) + 0.4 * Math.sin(Math.PI * landed);
      pl.alpha = Math.min(1, Math.max(0, (t - 0.15) / 0.12));
    },
  };
}
