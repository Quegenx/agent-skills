// Split from turn-audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { TURN } from "./turn.mjs";
import * as A from "./audit.mjs";
import * as k from "./iso-kit.mjs";
import { sampleShape } from "./turn-build.mjs";






const TAU = Math.PI * 2;

export const EYE = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2);

export const f3 = (v) => (Math.round(v * 1000) / 1000).toFixed(3);


export const apply = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];

const back = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];


export const place = (pose, p) => {
  const q = apply(pose.R, [p[0] - pose.origin[0], p[1] - pose.origin[1], p[2] - pose.origin[2]]);
  return [q[0] + pose.t[0], q[1] + pose.t[1], q[2] + pose.t[2]];
};


export const unplace = (pose, p) => {
  const q = back(pose.R, [p[0] - pose.t[0], p[1] - pose.t[1], p[2] - pose.t[2]]);
  return [q[0] + pose.origin[0], q[1] + pose.origin[1], q[2] + pose.origin[2]];
};


export function posed(shape, pose) {
  if (!pose) return shape;
  const out = { ...shape, _b: undefined, _f: undefined };
  if (shape.F) out.F = { o: place(pose, shape.F.o), a: apply(pose.R, shape.F.a), u: shape.F.u ? apply(pose.R, shape.F.u) : undefined, v: shape.F.v ? apply(pose.R, shape.F.v) : undefined };
  if (shape.kind === "ball" || shape.kind === "box") out.o = place(pose, shape.o);
  if (shape.flats) out.flats = shape.flats.map(([nx, ny, nz, d]) => [...apply(pose.R, [nx, ny, nz]), d]);
  if (shape.axes) out.axes = shape.axes.map((axis) => apply(pose.R, axis));
  if (shape.points) out.points = shape.points.map((p) => place(pose, p));
  if (shape.tips) out.tips = shape.tips.map((tip) => tip && place(pose, tip));
  if (shape.tipAxes) out.tipAxes = shape.tipAxes.map((axis) => axis && apply(pose.R, axis));
  if (shape.cut) out.cut = Array.isArray(shape.cut) ? shape.cut.map((one) => posed(one, pose)) : posed(shape.cut, pose);
  return out;
}


export const IDENTITY = { R: EYE, t: [0, 0, 0], origin: [0, 0, 0] };

export const poseFor = (cams, group) => (group && group !== "static" ? { R: cams[group.index].R, t: cams[group.index].t, origin: group.origin } : IDENTITY);


export function eventsOf(T, layer) {
  const data = T.data;
  const name = typeof layer === "string" ? layer : layer.name;
  const prepared = TURN.prepare(data, { unit: 1 }).layers.find((l) => l.name === name);
  const plan = prepared ? prepared.planar : [];
  const a = ((T.P.azimuth ?? 45) * Math.PI) / 180;
  const e = ((T.P.elevation ?? 30) * Math.PI) / 180;
  const out = new Set();
  for (let i = 0; i < plan.length; i += 5) {
    const part = T.parts[plan[i]];
    const g = part.group;
    if (!g || g.kind !== "turn" || g.parent) continue;
    const n = [plan[i + 2], plan[i + 3], plan[i + 4]];
    const flat = Math.hypot(n[0], n[1]);
    if (flat < 1e-9) continue;
    const c = (-n[2] * Math.sin(e)) / (flat * Math.cos(e));
    if (c <= -1 || c >= 1) continue;
    const phi = Math.atan2(n[1], n[0]);
    for (const b of [phi + Math.acos(c), phi - Math.acos(c)]) {
      const theta = ((((a - b) * 180) / Math.PI) % 360 + 360) % 360;
      out.add(Math.round(theta * 1e6) / 1e6);
    }
  }
  return [...out].sort((x, y) => x - y);
}


function polygonArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}


function clipArea(subject, clip) {
  if (subject.length < 3 || clip.length < 3) return 0;
  const sign = polygonArea(clip) >= 0 ? 1 : -1;
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (p) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j];
      const q = input[(j + 1) % input.length];
      const sp = side(p);
      const sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) {
        const t = sp / (sp - sq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out.length >= 3 ? Math.abs(polygonArea(out)) : 0;
}


const pathPolys = (d) =>
  [...(d ?? "").matchAll(/M([^M]*)/g)].map(([, body]) => {
    const nums = (body.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    return pts;
  });


function convexHull(points) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}


function footprints(run, f) {
  if (run.kind === "tube") return f.quadList.map(([buf, n]) => convexHull(Array.from({ length: n }, (_, i) => [buf[2 * i], buf[2 * i + 1]])));
  if (run.kind === "fixed") return [Array.from({ length: f.hullN }, (_, i) => [f.hull[2 * i], f.hull[2 * i + 1]])];
  const polys = pathPolys(f.d[run.role.fill]);
  return polys.length ? [convexHull(polys.flat())] : [];
}


export function overlapArea(runA, fa, runB, fb) {
  if (fa.box[2] < fb.box[0] || fb.box[2] < fa.box[0] || fa.box[3] < fb.box[1] || fb.box[3] < fa.box[1]) return 0;
  let best = 0;
  for (const a of footprints(runA, fa)) for (const b of footprints(runB, fb)) best = Math.max(best, clipArea(a, b));
  return best;
}


function hausdorffish(A, B) {
  if (!A.length || !B.length) return 0;
  const seg = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
    return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
  };
  const one = (P, Q) => {
    let worst = 0;
    const m = Q.length;
    const n = P.length;
    for (let i = 0; i < n; i++) {
      const centre = Math.round((i / n) * m);
      let best = Infinity;
      for (let w = -10; w <= 10; w++) {
        const j = (((centre + w) % m) + m) % m;
        best = Math.min(best, seg(P[i], Q[j], Q[(j + 1) % m]));
      }
      if (best > 0.02) for (let j = 0; j < m; j++) best = Math.min(best, seg(P[i], Q[j], Q[(j + 1) % m]));
      worst = Math.max(worst, best);
    }
    return worst;
  };
  return Math.max(one(A, B), one(B, A));
}


const areaOfPath = (d) => pathPolys(d).reduce((sum, poly) => sum + Math.abs(polygonArea(poly)), 0);


function flatPolys(d) {
  const out = [];
  for (const [, body] of (d ?? "").matchAll(/M([^M]*)/g)) {
    const nums = (body.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);
    if (nums.length >= 6) out.push(nums);
  }
  return out;
}


const jitter = (a, b) => {
  const t = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return t - Math.floor(t);
};


function toneRaster(layers, box, scale) {
  const x0 = box[0];
  const y0 = box[1];
  const w = Math.max(1, Math.ceil((box[2] - x0) * scale));
  const h = Math.max(1, Math.ceil((box[3] - y0) * scale));
  const out = new Float32Array(w * h).fill(-1);
  const owner = new Int16Array(w * h).fill(-1);
  for (const { polys, v, id } of layers) {
    if (!polys.length) continue;
    let ymin = Infinity;
    let ymax = -Infinity;
    for (const p of polys) for (let i = 1; i < p.length; i += 2) {
      if (p[i] < ymin) ymin = p[i];
      if (p[i] > ymax) ymax = p[i];
    }
    const r0 = Math.max(0, Math.floor((ymin - y0) * scale));
    const r1 = Math.min(h - 1, Math.ceil((ymax - y0) * scale));
    const hits = [];
    for (let row = r0; row <= r1; row++)
      for (let sub = 0; sub < 8; sub++) {
      const y = y0 + (row + (sub + 0.5) / 8) / scale;
      hits.length = 0;
      for (const p of polys) {
        const n = p.length;
        for (let i = 0; i < n; i += 2) {
          const ax = p[i];
          const ay = p[i + 1];
          const bx = p[(i + 2) % n];
          const by = p[(i + 3) % n];
          if ((ay <= y) === (by <= y)) continue;
          hits.push([ax + ((y - ay) * (bx - ax)) / (by - ay), by > ay ? 1 : -1]);
        }
      }
      if (hits.length < 2) continue;
      hits.sort((a, b) => a[0] - b[0]);
      let winding = 0;
      for (let k = 0; k < hits.length - 1; k++) {
        winding += hits[k][1];
        if (!winding) continue;
        const xa = hits[k][0];
        const xb = hits[k + 1][0];
        const c0 = Math.max(0, Math.floor((xa - x0) * scale));
        const c1 = Math.min(w - 1, Math.floor((xb - x0) * scale));
        for (let c = c0; c <= c1; c++) {
          if (Math.floor(jitter(c, row) * 8) !== sub) continue;
          if (c === c0 || c === c1) {
            const x = x0 + (c + jitter(row, c)) / scale;
            if (x < xa || x >= xb) continue;
          }
          out[row * w + c] = v;
          owner[row * w + c] = id;
        }
      }
    }
  }
  return { out, owner };
}


function toneLayers(run, f) {
  const layers = [];
  run.roles.forEach((role, r) => {
    const d = f.d[r];
    if (!d) return;
    if (role.type === "face") layers.push({ polys: flatPolys(d), v: f.q[r] / TURN.q, id: r });
    else if (role.type === "path" && role.name === "fill") layers.push({ polys: flatPolys(d), v: 2, id: r });
    else if (role.type === "path" && /^s[0-4]$/.test(role.name)) layers.push({ polys: flatPolys(d), v: Number(role.name.slice(1)), id: r });
    else if (role.name === "body") layers.push({ polys: flatPolys(d), v: 2, id: r });
    else if (role.name === "shine") layers.push({ polys: flatPolys(d), v: 4, id: r });
    else if (role.name === "shade") layers.push({ polys: flatPolys(d), v: 0, id: r });
  });
  return layers;
}


function visibleChange(run, frames, scale = 4) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const f of frames) {
    box[0] = Math.min(box[0], f.box[0] - 1);
    box[1] = Math.min(box[1], f.box[1] - 1);
    box[2] = Math.max(box[2], f.box[2] + 1);
    box[3] = Math.max(box[3], f.box[3] + 1);
  }
  const rasters = frames.map((f) => toneRaster(toneLayers(run, f), box, scale));
  const steps = [];
  for (let i = 1; i < rasters.length; i++) {
    const a = rasters[i - 1];
    const b = rasters[i];
    let sum = 0;
    for (let j = 0; j < a.out.length; j++) {
      if (a.owner[j] === b.owner[j]) continue;
      const va = a.out[j];
      const vb = b.out[j];
      if (va < 0 || vb < 0) sum += 2;
      else {
        const d = Math.abs(va - vb);
        if (d > 1 / 16 + 1e-6) sum += d;
      }
    }
    steps.push(sum / (scale * scale));
  }
  return steps;
}


export function surfacePoints(shape, spacing = 0.6) {
  return sampleShape(shape, Math.max(16, Math.round(TAU / Math.max(0.05, spacing / Math.max(1, shape.r ?? 3)))));
}


export function sphereOf(points) {
  const c = [0, 0, 0];
  for (const p of points) for (let i = 0; i < 3; i++) c[i] += p[i] / Math.max(1, points.length);
  let r = 0;
  for (const p of points) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]));
  return { c, r };
}


export function familiesOf(T, { sweep, clips }) {
  const groups = T.groups;
  const out = [];
  const roots = groups.filter((g) => g.kind === "turn" && !g.parent);
  if (sweep) out.push({ name: "sweep", frame: 0.3, periodic: true, unit: "°", ...sweep });
  else if (roots.length) out.push({ name: "sweep", at: (x) => Object.fromEntries(roots.map((g) => [g.name, x])), from: 0, to: 360, frame: 0.3, periodic: true, unit: "°" });
  for (const clip of clips ?? []) out.push({ from: 0, frame: 1 / 60, unit: "s", ...clip });
  return out;
}


export function samplesOf(family, frame) {
  const xs = [];
  const count = Math.max(1, Math.round((family.to - family.from) / frame));
  for (let i = 0; i < count + (family.periodic ? 0 : 1); i++) xs.push(family.from + i * frame);
  return xs;
}


export const ORBIT_LINES = { separation: null, unseparated: "order", cycles: "order", forced: "order", swaps: "order", layers: "depth", rigid: "rigid", swept: "swept", posed: "posed", folds: "routes", self: "routes", crowding: "routes", endon: "routes", coverage: "coverage", depth: "depth", continuity: "continuity" };

export const ORBIT_CHECKS = ["order", "rigid", "swept", "posed", "routes", "coverage", "continuity", "depth"];


export function continuity(T, scene, runs, groups, { step, quick, result, say, families = [], frameOf = (f) => f.frame }) {
  const stepSize = quick ? step * 10 : step;
  const measures = [];
  const worst = { q: 0, birth: 0, dot: 0, fade: 0, motion: 0, merge: 0 };
  const failures = [];
  const k = scene.P.scale * Math.sqrt(1.6);
  const sweeps = [];
  for (const g of groups) {
    if (g.loose) continue;
    if (g.kind === "turn") sweeps.push({ group: g, from: 0, to: 360, unit: "°" });
    else if (g.kind === "hinge") sweeps.push({ group: g, from: g.range[0], to: g.range[1], unit: "°" });
    else sweeps.push({ group: g, from: 0, to: g.travel, unit: "" });
  }
  for (const sweep of sweeps) {
    const g = sweep.group;
    const parts = runs.filter((run) => run.group === g.index);
    if (!parts.length) continue;
    const span = sweep.to - sweep.from;
    const delta = g.kind === "slide" ? Math.max(0.01, span / 400) : stepSize;
    const count = Math.max(1, Math.round(span / delta));
    const reach = parts.map((run) => {
      let r = 0;
      const part = T.parts[run.index];
      for (const p of part.samples) r = Math.max(r, g.kind === "slide" ? 0 : Math.hypot(p[0], p[1]));
      return r;
    });
    const valuesAt = (x) => ({ [g.name]: x });
    const emitPart = (run, x, f) => {
      const cams = TURN.cams(scene, valuesAt(x));
      TURN.emit(run, cams[g.index], f);
      return f;
    };
    say(`continuity ${g.name}: ${count} steps of ${delta}${sweep.unit} over ${parts.length} parts`);
    const snap = (run, f) => {
      const roles = run.roles;
      const out = { faces: [], sheets: [], dots: [], planes: [], fade: {}, outline: null, levels: f.levels ?? 0 };
      roles.forEach((role, r) => {
        if (role.type === "face") out.faces.push([f.d[r] ? areaOfPath(f.d[r]) : 0, f.q[r], Boolean(f.d[r])]);
        else if (role.type === "path" && /^s[0-4]$/.test(role.name)) out.sheets.push([areaOfPath(f.d[r]), (f.d[r].match(/M/g) ?? []).length]);
        else if (role.type === "dot") out.dots.push(f.o[r]);
        else if (role.type === "plane") out.planes.push(f.o[r]);
      });
      for (const [prefix, set] of Object.entries(f.fade ?? {})) {
        const map = new Map();
        set.key.forEach((key, i) => map.set(key, Math.round(set.alpha[i] * TURN.levels) / TURN.levels));
        out.fade[prefix] = map;
      }
      const edge = run.role.fill !== undefined ? f.d[run.role.fill] : run.role.body !== undefined ? f.d[run.role.body] : "";
      out.outline = run.kind === "fixed" ? [Array.from({ length: f.hullN }, (_, i) => [f.hull[2 * i], f.hull[2 * i + 1]])] : pathPolys(edge);
      out.slots = run.slots;
      return out;
    };
    const compare = (run, a, b, dx, reachPx) => {
      const m = { q: 0, birth: 0, dot: 0, fade: 0, motion: 0, merge: 0 };
      for (let i = 0; i < Math.min(a.faces.length, b.faces.length); i++) {
        const [areaA, qa, onA] = a.faces[i];
        const [areaB, qb, onB] = b.faces[i];
        if (onA && onB) m.q = Math.max(m.q, (Math.abs(qa - qb) * 16) / TURN.q);
        if (onA !== onB) m.birth = Math.max(m.birth, onA ? areaA : areaB);
        m.area = Math.max(m.area ?? 0, Math.abs(areaA - areaB));
      }
      for (let i = 0; i < Math.min(a.sheets.length, b.sheets.length); i++) {
        const [areaA, countA] = a.sheets[i];
        const [areaB, countB] = b.sheets[i];
        if (!countA !== !countB) m.birth = Math.max(m.birth, Math.abs(areaA - areaB));
        m.area = Math.max(m.area ?? 0, Math.abs(areaA - areaB));
      }
      for (let i = 0; i < Math.min(a.dots.length, b.dots.length); i++) m.dot = Math.max(m.dot, Math.abs(a.dots[i] - b.dots[i]));
      for (let i = 0; i < Math.min(a.planes.length, b.planes.length); i++) m.dot = Math.max(m.dot, Math.abs(a.planes[i] - b.planes[i]));
      for (const prefix of new Set([...Object.keys(a.fade), ...Object.keys(b.fade)])) {
        const A0 = a.fade[prefix] ?? new Map();
        const B0 = b.fade[prefix] ?? new Map();
        for (const key of new Set([...A0.keys(), ...B0.keys()])) m.fade = Math.max(m.fade, Math.abs((A0.get(key) ?? 0) - (B0.get(key) ?? 0)));
      }
      const slots = Math.max(run.slots.bevel ?? 0, run.slots.ribs ?? 0);
      if (slots && (a.levels > slots || b.levels > slots)) m.merge = Math.max(a.levels, b.levels) - slots;
      if (a.outline.length && b.outline.length && a.outline[0].length && b.outline[0].length) m.motion = Math.max(0, hausdorffish(a.outline[0], b.outline[0]) - (1.5 * reachPx * dx + 0.05));
      return m;
    };
    const frames = parts.map((run) => TURN.frame(run));
    let previous = parts.map((run, i) => snap(run, emitPart(run, sweep.from, frames[i])));
    for (let c = 1; c <= count; c++) {
      const x = sweep.from + c * delta;
      parts.forEach((run, i) => {
        const current = snap(run, emitPart(run, x, frames[i]));
        const reachPx = g.kind === "slide" ? k : (reach[i] * k * Math.PI) / 180;
        const m = compare(run, previous[i], current, g.kind === "slide" ? delta : delta, reachPx);
        for (const key of Object.keys(worst)) worst[key] = Math.max(worst[key], m[key] ?? 0);
        const scale = delta / step;
        if (m.q > Math.ceil(scale) || m.birth > 2 * scale || m.dot > 0.0105 * scale || m.fade > Math.ceil(scale) / 32 + 0.005 || m.merge > 0 || m.motion > 0) failures.push({ part: run.name, group: g.name, at: x, m });
        measures.push({ run, x: x - delta, dx: delta, value: m.birth + m.motion * 4 + (m.area ?? 0), motion: m.motion, birth: m.birth, valuesAt, reachPx });
        previous[i] = current;
      });
    }
  }
  measures.sort((a, b) => b.value - a.value);
  let halvingFails = 0;
  let halvingChecked = 0;
  const halving = (run, at, x, dx) => {
    const emitAt = (value) => {
      const f = TURN.frame(run);
      const cams = TURN.cams(scene, at(value));
      TURN.emit(run, run.group >= 0 ? cams[run.group] : cams.world, f);
      return f;
    };
    const frames = Array.from({ length: 9 }, (_, j) => emitAt(x + (dx * j) / 8));
    const measure = (scale) => {
      const eighth = Math.max(...visibleChange(run, frames, scale));
      const quarter = Math.max(...visibleChange(run, [0, 2, 4, 6, 8].map((j) => frames[j]), scale));
      const half = Math.max(...visibleChange(run, [frames[0], frames[4], frames[8]], scale));
      const full = visibleChange(run, [frames[0], frames[8]], scale)[0];
      return { full, half, quarter, eighth, fails: full >= 2 && half > 0.6 * full && quarter > 0.6 * half && eighth > 0.6 * quarter && eighth >= 2 };
    };
    const coarse = measure(4);
    return coarse.fails ? measure(16) : coarse;
  };
  const seen = new Set();
  for (const entry of measures.slice(0, quick ? 40 : 400)) {
    if (!(entry.value > 1e-6)) break;
    const key = `${entry.run.index}|${entry.x.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    halvingChecked++;
    const g = groups[entry.run.group];
    const h = halving(entry.run, entry.valuesAt, entry.x, entry.dx);
    if (!h.fails) continue;
    halvingFails++;
    failures.push({ part: entry.run.name, group: g.name, at: entry.x, m: { halving: `${f2(h.full)} tone·px² step stays ${f2(h.half)}, ${f2(h.quarter)} and ${f2(h.eighth)} at a half, a quarter and an eighth of the step` } });
  }
  const areaRoles = (run) => run.roles.map((role, r) => (role.type === "face" || /^s[0-4]$/.test(role.name) || (run.kind === "tube" && role.name === "body") ? r : -1)).filter((r) => r >= 0);
  const clipSteps = [];
  for (const family of families) {
    if (family.periodic) continue;
    const xs = samplesOf(family, frameOf(family));
    say(`continuity ${family.name}: ${xs.length} frames over ${runs.length} parts`);
    const frames = runs.map((run) => TURN.frame(run));
    let previous = null;
    for (const x of xs) {
      const cams = TURN.cams(scene, family.at(x));
      const current = runs.map((run, index) => {
        TURN.emit(run, run.group >= 0 ? cams[run.group] : cams.world, frames[index]);
        return areaRoles(run).map((r) => areaOfPath(frames[index].d[r]));
      });
      if (previous)
        runs.forEach((run, index) => {
          let most = 0;
          let role = -1;
          current[index].forEach((v, k) => {
            const d = Math.abs(v - previous[index][k]);
            if (d > most) {
              most = d;
              role = k;
            }
          });
          if (most >= 0.5) clipSteps.push({ family, run, x: x - frameOf(family), dx: frameOf(family), role, value: most });
        });
      previous = current;
    }
  }
  clipSteps.sort((a, b) => b.value - a.value);
  let clipChecked = 0;
  for (const entry of clipSteps.slice(0, quick ? 60 : 400)) {
    clipChecked++;
    const h = halving(entry.run, entry.family.at, entry.x, entry.dx);
    if (!h.fails) continue;
    halvingFails++;
    failures.push({ part: entry.run.name, group: entry.family.name, at: entry.x, m: { halving: `${f2(h.full)} tone·px² step stays ${f2(h.half)}, ${f2(h.quarter)} and ${f2(h.eighth)} at a half, a quarter and an eighth of the frame` } });
  }
  result.continuity = failures;
  result.stats.continuity = { worst, halvingChecked: halvingChecked + clipChecked, halvingFails, measures: measures.length + clipSteps.length };
}
