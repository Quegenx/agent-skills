// Split from turn-build.mjs; original algorithms and public entrypoint contracts are preserved.
import { TURN } from "./turn.mjs";
import * as k from "./iso-kit.mjs";
import * as G from "./lathe.mjs";
import * as A from "./audit.mjs";





export const TAU = Math.PI * 2;

export const r4 = (v) => Math.round(v * 1e4) / 1e4;

const r3 = (v) => Math.round(v * 1e3) / 1e3;

export const pack3 = (value) => JSON.parse(JSON.stringify(value, (key, v) => (typeof v === "number" ? r3(v) : v instanceof Float64Array || v instanceof Float32Array ? Array.from(v, r3) : v)));

export const pack = (value) => JSON.parse(JSON.stringify(value, (key, v) => (typeof v === "number" ? r4(v) : v instanceof Float64Array || v instanceof Float32Array ? Array.from(v, r4) : v)));

export const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");


function octOf(n) {
  const l = Math.abs(n[0]) + Math.abs(n[1]) + Math.abs(n[2]) || 1;
  let x = n[0] / l;
  let y = n[1] / l;
  if (n[2] < 0) {
    const ox = (1 - Math.abs(y)) * (x >= 0 ? 1 : -1);
    const oy = (1 - Math.abs(x)) * (y >= 0 ? 1 : -1);
    x = ox;
    y = oy;
  }
  return [Math.round((x * 0.5 + 0.5) * 65535), Math.round((y * 0.5 + 0.5) * 65535)];
}


export function packPairs(byLayer, stride, grouped) {
  const out = {};
  for (const [name, list] of Object.entries(byLayer)) {
    const count = list.length / stride;
    const bytes = new Uint8Array(count * (grouped ? 10 : 8));
    const view = new DataView(bytes.buffer);
    for (let e = 0; e < count; e++) {
      const at = e * stride;
      let o = e * (grouped ? 10 : 8);
      view.setUint16(o, list[at]);
      view.setUint16(o + 2, list[at + 1]);
      o += 4;
      if (grouped) {
        view.setUint16(o, list[at + 2] + 1);
        o += 2;
      }
      const [u, v] = octOf(list.slice(at + stride - 3, at + stride));
      view.setUint16(o, u);
      view.setUint16(o + 2, v);
    }
    out[name] = Buffer.from(bytes).toString("base64");
  }
  return out;
}


export function signedArea(points) {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}


export function convexOrThrow(points, name) {
  const n = points.length;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const c = points[(i + 2) % n];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) < 1e-9) continue;
    if (!sign) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) throw new Error(`turning: part ${name} is not convex; split it into convex pieces`);
  }
}


export function roundedPolygon(polygon, radius = 0, steps = 4) {
  const poly = signedArea(polygon) < 0 ? polygon.slice().reverse() : polygon.slice();
  if (!(radius > 0)) return poly.map(([x, y]) => [x, y]);
  const n = poly.length;
  const normals = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l];
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const na = normals[(i - 1 + n) % n];
    const nb = normals[i];
    const denom = 1 + na[0] * nb[0] + na[1] * nb[1];
    const c = [poly[i][0] - (radius * (na[0] + nb[0])) / denom, poly[i][1] - (radius * (na[1] + nb[1])) / denom];
    const a0 = Math.atan2(na[1], na[0]);
    let a1 = Math.atan2(nb[1], nb[0]);
    while (a1 < a0 - 1e-9) a1 += TAU;
    for (let s = 0; s <= steps; s++) {
      const t = a0 + ((a1 - a0) * s) / steps;
      out.push([c[0] + radius * Math.cos(t), c[1] + radius * Math.sin(t)]);
    }
  }
  return out;
}


export const fine = (v) => {
  const t = Math.round(v * 1000) / 1000;
  return t === 0 ? "0" : String(t);
};

export const finePath = (points) => points.map(([x, y], i) => `${i ? "L" : "M"}${fine(x)} ${fine(y)}`).join("") + "Z";


export const dot3 = G.dot3;

export const sub3 = G.sub3;

export const add3 = G.add3;

export const mul3 = G.mul3;


function marginOf(n, A, B) {
  let hiA = -Infinity;
  for (const a of A) {
    const v = n[0] * a[0] + n[1] * a[1] + n[2] * a[2];
    if (v > hiA) hiA = v;
  }
  let loB = Infinity;
  for (const b of B) {
    const v = n[0] * b[0] + n[1] * b[1] + n[2] * b[2];
    if (v < loB) loB = v;
  }
  return { margin: loB - hiA, d: (loB + hiA) / 2 };
}


function closest(A, B, rounds = 200) {
  let w = sub3(B[0], A[0]);
  for (let it = 0; it < rounds; it++) {
    const l = G.len3(w);
    if (l < 1e-12) break;
    let hi = -Infinity;
    let a = A[0];
    for (const p of A) {
      const v = dot3(p, w);
      if (v > hi) {
        hi = v;
        a = p;
      }
    }
    let lo = Infinity;
    let b = B[0];
    for (const p of B) {
      const v = dot3(p, w);
      if (v < lo) {
        lo = v;
        b = p;
      }
    }
    const s = sub3(b, a);
    const ds = sub3(w, s);
    const dd = dot3(ds, ds);
    if (dd < 1e-14) break;
    const t = Math.max(0, Math.min(1, dot3(w, ds) / dd));
    const next = sub3(w, mul3(ds, t));
    if (G.len3(sub3(next, w)) < 1e-10) break;
    w = next;
  }
  return w;
}


export function gjk(A, B, warm = null) {
  const w = warm && G.len3(warm) > 1e-9 ? warm : closest(A, B);
  const n = G.unit3(G.len3(w) > 1e-12 ? w : [0, 0, 1]);
  const { margin, d } = marginOf(n, A, B);
  return { n, d, margin };
}


export function quickSeparate(A, B, hints = []) {
  const centre = (list) => mul3(list.reduce((sum, p) => add3(sum, p), [0, 0, 0]), 1 / list.length);
  const candidates = [sub3(centre(B), centre(A)), ...hints.flatMap((h) => [h, mul3(h, -1)])].filter((n) => G.len3(n) > 1e-9).map(G.unit3);
  let best = null;
  for (const n of candidates) {
    const { margin } = marginOf(n, A, B);
    if (!best || margin > best.margin) best = { n, margin };
  }
  if (best.margin >= 0.1) return best;
  let { n, margin } = best;
  for (const step of [0.3, 0.1, 0.03]) {
    for (let round = 0; round < 12; round++) {
      const F = G.frameAlong([0, 0, 0], n);
      let improved = false;
      for (let j = 0; j < 8; j++) {
        const t = (j / 8) * TAU;
        const trial = G.unit3(add3(n, add3(mul3(F.u, step * Math.cos(t)), mul3(F.v, step * Math.sin(t)))));
        const value = marginOf(trial, A, B).margin;
        if (value > margin + 1e-9) {
          margin = value;
          n = trial;
          improved = true;
        }
      }
      if (!improved) break;
    }
  }
  return { n, margin };
}


export function separate(A, B, hints = []) {
  const centre = (list) => mul3(list.reduce((s, p) => add3(s, p), [0, 0, 0]), 1 / list.length);
  const candidates = [sub3(centre(B), centre(A)), closest(A, B), ...hints.flatMap((h) => [h, mul3(h, -1)])].filter((n) => G.len3(n) > 1e-9).map(G.unit3);
  let best = null;
  for (const n of candidates) {
    const { margin } = marginOf(n, A, B);
    if (!best || margin > best.margin) best = { n, margin };
  }
  let { n, margin } = best;
  for (const step of [0.3, 0.1, 0.03, 0.01, 0.003, 0.001]) {
    for (let round = 0; round < 40; round++) {
      const F = G.frameAlong([0, 0, 0], n);
      let improved = false;
      for (let j = 0; j < 8; j++) {
        const t = (j / 8) * TAU;
        const trial = G.unit3(add3(n, add3(mul3(F.u, step * Math.cos(t)), mul3(F.v, step * Math.sin(t)))));
        const value = marginOf(trial, A, B).margin;
        if (value > margin + 1e-9) {
          margin = value;
          n = trial;
          improved = true;
        }
      }
      if (!improved) break;
    }
  }
  return { n, d: marginOf(n, A, B).d, margin };
}


export function frameFrom(F) {
  const a = G.unit3(F.a);
  let u = F.u ? G.unit3(sub3(F.u, mul3(a, dot3(F.u, a)))) : null;
  if (!u || G.len3(u) < 1e-9) u = G.frameAlong([0, 0, 0], a).u;
  const v = F.v && Math.abs(dot3(G.cross3(a, u), F.v)) > 0.999 ? G.unit3(F.v) : G.cross3(a, u);
  return { o: F.o.slice(), a, u, v };
}


export function sampleShape(shape, count = 48) {
  const out = [];
  if (shape.kind === "body") {
    const F = frameFrom(shape.F);
    for (const [s, r] of shape.poly) {
      if (r < 1e-9) {
        out.push(G.pointOf(F, s, 0, 0));
        continue;
      }
      for (let j = 0; j < count; j++) out.push(G.pointOf(F, s, r, (j / count) * TAU));
    }
  } else if (shape.kind === "prism") {
    const F = shape.F;
    for (const s of [shape.s0, shape.s1]) for (const [x, y] of shape.poly) out.push(add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y))));
  } else if (shape.kind === "ball") {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const total = Math.max(count * 3, 96);
    for (let i = 0; i < total; i++) {
      const y = 1 - (2 * (i + 0.5)) / total;
      const rad = Math.sqrt(1 - y * y);
      const t = golden * i;
      const n = [Math.cos(t) * rad, Math.sin(t) * rad, y];
      if ((shape.flats ?? []).some(([nx, ny, nz, d]) => nx * n[0] * shape.r + ny * n[1] * shape.r + nz * n[2] * shape.r > d + 1e-9)) continue;
      out.push(add3(shape.o, mul3(n, shape.r)));
    }
    for (const [nx, ny, nz, d] of shape.flats ?? []) {
      const F = G.frameAlong(add3(shape.o, mul3([nx, ny, nz], d)), [nx, ny, nz]);
      const rho = Math.sqrt(Math.max(0, shape.r * shape.r - d * d));
      for (let j = 0; j < count; j++) {
        const p = G.pointOf(F, 0, rho, (j / count) * TAU);
        if ((shape.flats ?? []).every(([mx, my, mz, e]) => mx * (p[0] - shape.o[0]) + my * (p[1] - shape.o[1]) + mz * (p[2] - shape.o[2]) <= e + 1e-6)) out.push(p);
      }
    }
  } else if (shape.kind === "box") {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push(add3(shape.o, add3(add3(mul3(shape.axes[0], sx * shape.half[0]), mul3(shape.axes[1], sy * shape.half[1])), mul3(shape.axes[2], sz * shape.half[2]))));
  } else if (shape.kind === "tube") {
    const pts = shape.points;
    for (let i = 0; i < pts.length; i++) {
      const t = G.unit3(sub3(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
      const F = G.frameAlong(pts[i], t);
      const ring = Math.max(8, Math.round(count / 4));
      for (let j = 0; j < ring; j++) out.push(G.pointOf(F, 0, shape.radii[i], (j / ring) * TAU));
    }
  }
  return out;
}


export function hull2(points) {
  return G.hullOf(points);
}


export function thinCloud(points, most = 64) {
  if (points.length <= most) return points;
  const out = [];
  const step = points.length / most;
  for (let i = 0; i < most; i++) out.push(points[Math.floor(i * step)]);
  return out;
}


export function spansOf(total, gaps, breaks, maxLength) {
  const cuts = gaps
    .map(([a, b]) => [Math.max(0, Math.min(a, b)), Math.min(total, Math.max(a, b))])
    .filter(([a, b]) => b - a > 1e-6)
    .sort((x, y) => x[0] - y[0]);
  const runs = [];
  let at = 0;
  for (const [a, b] of cuts) {
    if (a > at + 1e-6) runs.push([at, a, at > 0, true]);
    at = Math.max(at, b);
  }
  if (total > at + 1e-6) runs.push([at, total, at > 0, cuts.length > 0 && cuts[cuts.length - 1][1] >= total - 1e-6]);
  const pieces = [];
  for (const [from, to, gapStart, gapEnd] of runs) {
    const stops = [from, ...breaks.filter((b) => b > from + 1e-6 && b < to - 1e-6).sort((x, y) => x - y), to];
    for (let index = 0; index < stops.length - 1; index++) {
      const a = stops[index];
      const b = stops[index + 1];
      const count = Math.max(1, Math.ceil((b - a) / maxLength - 1e-9));
      for (let c = 0; c < count; c++) {
        pieces.push({
          from: a + ((b - a) * c) / count,
          to: a + ((b - a) * (c + 1)) / count,
          open0: !(index === 0 && c === 0),
          open1: !(index === stops.length - 2 && c === count - 1),
          gap0: index === 0 && c === 0 && gapStart,
          gap1: index === stops.length - 2 && c === count - 1 && gapEnd,
        });
      }
    }
  }
  return pieces;
}


export function groupData(T) {
  return T.groups.map((g) => ({
    name: g.name,
    parent: g.parent ? g.parent.index : -1,
    kind: g.kind,
    origin: g.origin,
    pivot: g.pivot,
    direction: g.direction,
    travel: g.travel,
    point: g.point,
    axis: g.axis,
    range: g.range,
    upright: g.upright,
    loose: g.loose || undefined,
  }));
}


export function partData(part) {
  const details = {};
  const seams = part.kind === "prism" ? part.localSeams : part.kind === "fixed" ? null : part.details.seams;
  if (seams && seams.length) details.seams = seams;
  if (part.details.ribs) details.ribs = part.details.ribs;
  const out = { name: part.name, kind: part.kind, group: part.group ? part.group.index : -1, layer: part.layer.index };
  if (part.tone !== "hi") out.tone = part.tone;
  if (part.crease !== "faint") out.crease = part.crease;
  if (part.lit) out.lit = true;
  if (part.material) out.mat = part.material;
  out.spec = part.spec;
  if (Object.keys(details).length) out.details = details;
  if (part.planes.length) out.planes = part.planes.map(({ o, u, v, n, fade, billboard }) => ({ o, u, v, n, fade, billboard }));
  if (part.dots.length) out.dots = part.dots.map(({ p, n, size, tone, fade }) => ({ p, n, size, tone, fade }));
  if (part.kind === "item") out.cloud = part.cloud;
  return out;
}


export function statesOf(T, poses) {
  if (typeof poses === "function") poses = poses();
  if (Array.isArray(poses) && poses.length) return poses;
  const out = [];
  for (let deg = 0; deg < 360; deg += 2) out.push(Object.fromEntries(T.groups.map((g) => [g.name, g.kind === "turn" ? deg : g.range ? g.range[0] + ((g.range[1] - g.range[0]) * (deg % 90)) / 90 : 0])));
  return out;
}


function tumbleStates(T, group, count = 160) {
  let root = group;
  while (root && root.kind !== "free") root = root.parent;
  if (!root) return [];
  let seed = 977;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < count; i++) {
    const u = rand();
    const a = rand() * TAU;
    const b = rand() * TAU;
    const q = [Math.sqrt(1 - u) * Math.sin(a), Math.sqrt(1 - u) * Math.cos(a), Math.sqrt(u) * Math.sin(b), Math.sqrt(u) * Math.cos(b)];
    const values = { [root.name]: { q } };
    for (const g of T.groups) if (g.kind === "hinge" && g.loose) values[g.name] = g.range[0] + (g.range[1] - g.range[0]) * rand();
    out.push(values);
  }
  return out;
}


export function groupStates(T, group, states, { tumble = false } = {}) {
  if (!group) return [{}];
  let chain = [];
  for (let g = group; g; g = g.parent) chain.push(g);
  if (group.loose) return tumble ? [...states, ...tumbleStates(T, group)] : states.length ? states : [{}];
  if (chain.length === 1 && group.kind === "turn") return Array.from({ length: 360 }, (_, deg) => ({ [group.name]: deg }));
  if (chain.length === 1) {
    const [lo, hi] = group.range ?? [0, 0];
    return Array.from({ length: 33 }, (_, i) => ({ [group.name]: lo + ((hi - lo) * i) / 32 }));
  }
  return states;
}


function sweptGroups(T, layer, states, scene) {
  const V = G.viewOf(T.P);
  const cam = k.cameraOf(T.P);
  const byGroup = new Map();
  for (const part of T.parts) {
    if (part.layer !== layer || part.dead) continue;
    const key = part.group ? part.group.index : -1;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(part);
  }
  const out = [];
  for (const [key, parts] of byGroup) {
    const group = key >= 0 ? T.groups[key] : null;
    const local = parts.flatMap((part) => part.samples);
    const root = group && group.kind === "turn" && !group.parent;
    const list = root ? Array.from({ length: 72 }, (_, i) => ({ [group.name]: i * 5 })) : group ? groupStates(T, group, states) : [{}];
    let zmin = Infinity;
    let zmax = -Infinity;
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    const cloud = [];
    const stride = Math.max(1, Math.floor((local.length * list.length) / 4000));
    let counter = 0;
    for (const values of list) {
      const cams = TURN.cams(scene, values);
      const c = key >= 0 ? cams[key] : cams.world;
      for (const q of local) {
        const p = [c.R[0] * q[0] + c.R[1] * q[1] + c.R[2] * q[2] + c.t[0], c.R[3] * q[0] + c.R[4] * q[1] + c.R[5] * q[2] + c.t[1], c.R[6] * q[0] + c.R[7] * q[1] + c.R[8] * q[2] + c.t[2]];
        if (p[2] < zmin) zmin = p[2];
        if (p[2] > zmax) zmax = p[2];
        const [x, y] = k.iso(p, T.P);
        if (x < box[0]) box[0] = x;
        if (y < box[1]) box[1] = y;
        if (x > box[2]) box[2] = x;
        if (y > box[3]) box[3] = y;
        if (counter++ % stride === 0) cloud.push(p);
      }
    }
    let radius = 0;
    let envelope = cloud;
    if (root) {
      const slices = new Map();
      for (const q of local) {
        const band = Math.floor(q[2]);
        slices.set(band, Math.max(slices.get(band) ?? 0, Math.hypot(q[0], q[1])));
        radius = Math.max(radius, Math.hypot(q[0], q[1]));
      }
      envelope = [];
      for (const [band, r] of slices)
        for (const z of [band, band + 1])
          for (let j = 0; j < 48; j++) envelope.push([group.origin[0] + r * Math.cos((j / 48) * TAU), group.origin[1] + r * Math.sin((j / 48) * TAU), Math.max(zmin, Math.min(zmax, z))]);
      const pad = radius * cam.k;
      const c = k.iso([group.origin[0], group.origin[1], 0], T.P);
      box[0] = Math.min(box[0], c[0] - pad);
      box[2] = Math.max(box[2], c[0] + pad);
    }
    out.push({ key, group, parts, root, radius, zmin, zmax, box, envelope, V });
  }
  return out;
}


function relation(points, box, swept, P) {
  const V = G.viewOf(P);
  let zmin = Infinity;
  let zmax = -Infinity;
  for (const p of points) {
    zmin = Math.min(zmin, p[2]);
    zmax = Math.max(zmax, p[2]);
  }
  if (zmax <= swept.zmin + 1e-6) return { side: "behind", rule: "horizontal plane" };
  if (zmin >= swept.zmax - 1e-6) return { side: "front", rule: "horizontal plane" };
  if (swept.root) {
    const a = ((P.azimuth ?? 45) * Math.PI) / 180;
    const along = points.map((p) => (p[0] - swept.group.origin[0]) * Math.cos(a) + (p[1] - swept.group.origin[1]) * Math.sin(a));
    if (Math.max(...along) <= -swept.radius) return { side: "behind", rule: "cylinder" };
    if (Math.min(...along) >= swept.radius) return { side: "front", rule: "cylinder" };
  }
  if (box && (box[2] < swept.box[0] - 1 || swept.box[2] < box[0] - 1 || box[3] < swept.box[1] - 1 || swept.box[3] < box[1] - 1)) return { side: "apart", rule: "never overlap" };
  const hit = separate(points, swept.envelope, [[0, 0, 1], [Math.cos(((P.azimuth ?? 45) * Math.PI) / 180), Math.sin(((P.azimuth ?? 45) * Math.PI) / 180), 0]]);
  if (hit.margin >= -0.08) return { side: dot3(hit.n, V) > 0 ? "behind" : "front", rule: "swept envelope", margin: hit.margin };
  return null;
}


export function proveLayers(T, statics, states, scene) {
  const order = T.order.length ? T.order : T.layers.map((layer) => layer.name);
  const rank = new Map(order.map((name, index) => [name, index]));
  const problems = [];
  const proofs = [];
  const swept = new Map(T.layers.map((layer) => [layer.name, sweptGroups(T, layer, states, scene)]));
  for (const layer of T.layers) if (!rank.has(layer.name)) problems.push(`live layer ${layer.name} is missing from T.stack`);
  for (const item of statics) {
    if (!item.shapes || !item.shapes.length) continue;
    const layerName = item.layer;
    if (!rank.has(layerName)) {
      problems.push(`static ${item.name} has layer ${layerName ?? "(none)"}, which is not in T.stack`);
      continue;
    }
    const points = item.shapes.flatMap((shape) => sampleShape(shape, 24));
    const flat = points.map((p) => k.iso(p, T.P));
    const box = [Math.min(...flat.map((p) => p[0])), Math.min(...flat.map((p) => p[1])), Math.max(...flat.map((p) => p[0])), Math.max(...flat.map((p) => p[1]))];
    for (const layer of T.layers) {
      const want = rank.get(layerName) < rank.get(layer.name) ? "behind" : "front";
      for (const group of swept.get(layer.name)) {
        const proof = relation(points, box, group, T.P);
        const label = `${item.name} × ${layer.name}${group.group ? `/${group.group.name}` : ""}`;
        if (!proof) {
          const zs = points.map((p) => p[2]);
          const top = Math.max(...zs);
          const bottom = Math.min(...zs);
          const where = top > group.zmax + 1e-6 ? `at z = ${group.zmax.toFixed(2)}` : bottom < group.zmin - 1e-6 ? `at z = ${group.zmin.toFixed(2)}` : `into a piece behind and a piece in front of ${group.group ? `the ${group.group.name} axis` : "the layer"}`;
          problems.push(`static ${item.name} interleaves live layer ${layer.name}: split ${item.name} ${where}, or move it`);
          continue;
        }
        if (proof.side !== "apart" && proof.side !== want) {
          problems.push(`static ${item.name} is ${proof.side === "behind" ? "behind" : "in front of"} live layer ${layer.name} (${proof.rule}) but its layer ${layerName} is ${want === "behind" ? "under" : "over"} it: move it to a layer ${proof.side === "behind" ? "under" : "over"} ${layer.name}`);
          continue;
        }
        proofs.push({ static: item.name, layer: layer.name, group: group.group ? group.group.name : "world", rule: proof.rule, side: proof.side });
        void label;
      }
    }
  }
  const live = T.layers.slice().sort((a, b) => rank.get(a.name) - rank.get(b.name));
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++)
      for (const lower of swept.get(live[i].name))
        for (const upper of swept.get(live[j].name)) {
          let ok = lower.zmax <= upper.zmin + 1e-6 ? "horizontal plane" : null;
          if (!ok && (lower.box[2] < upper.box[0] - 1 || upper.box[2] < lower.box[0] - 1 || lower.box[3] < upper.box[1] - 1 || upper.box[3] < lower.box[1] - 1)) ok = "never overlap";
          if (!ok) {
            const hit = separate(lower.envelope, upper.envelope, [[0, 0, 1]]);
            if (hit.margin >= -0.08 && dot3(hit.n, G.viewOf(T.P)) > 0) ok = "swept envelope";
          }
          if (!ok) problems.push(`live layer ${live[i].name} interleaves live layer ${live[j].name} (${lower.group ? lower.group.name : "world"} × ${upper.group ? upper.group.name : "world"}): move parts between them or reorder T.stack`);
          else proofs.push({ static: `layer ${live[i].name}`, layer: live[j].name, group: upper.group ? upper.group.name : "world", rule: ok, side: "behind" });
        }
  return { problems, proofs };
}
