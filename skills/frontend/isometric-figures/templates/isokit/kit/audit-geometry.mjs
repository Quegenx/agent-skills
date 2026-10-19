// Split from audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { cameraOf, roundedPlan } from "./iso-kit.mjs";
import { add3, sub3, mul3, dot3, len3, unit3, pathLength, curveRuns } from "./lathe.mjs";




export const BIG = 1e9;


export function body(F, poly, meta = {}) {
  return { kind: "body", F, poly: poly.map(([s, r]) => [s, Math.max(0, r)]), ...meta };
}


export function traced(meridian, { radius = null, error = 0.02, depth = 6 } = {}) {
  const segments = radius ? null : curveRuns(meridian);
  const out = [[meridian[0][0], meridian[0][1]]];
  for (let index = 0; index < meridian.length - 1; index++) {
    const [s0] = meridian[index];
    const [s1, r1] = meridian[index + 1];
    const along = Math.abs(s1 - s0) > 1e-9;
    const at = along && radius ? radius : along && segments[index] ? segments[index].radius : null;
    if (at) {
      const split = (a, b, level) => {
        const mid = (a + b) / 2;
        if (level >= depth) return;
        const ra = at(a);
        const rb = at(b);
        const deviation = Math.max(...[0.25, 0.5, 0.75].map((t) => Math.abs(at(a + (b - a) * t) - (ra + (rb - ra) * t))));
        if (deviation <= error) return;
        split(a, mid, level + 1);
        out.push([mid, at(mid)]);
        split(mid, b, level + 1);
      };
      split(s0, s1, 0);
    }
    out.push([s1, r1]);
  }
  return out;
}


export function lathe(F, meridian, { radius = null, ...meta } = {}) {
  return body(F, traced(meridian, { radius }), meta);
}


export function solid(F, profile, { radius = null, ...meta } = {}) {
  const first = profile[0];
  const last = profile[profile.length - 1];
  return body(F, traced([[first[0], 0], ...profile, [last[0], 0]], { radius: radius && ((s) => radius(Math.max(first[0], Math.min(last[0], s)))) }), meta);
}


export function prism(F, polygon, s0, s1, meta = {}) {
  return { kind: "prism", F, poly: polygon.map(([x, y]) => [x, y]), s0: Math.min(s0, s1), s1: Math.max(s0, s1), ...meta };
}


const FLOOR = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };


export const extruded = (ring, z, height, meta = {}) => prism(FLOOR, ring, z, z + height, meta);


export const slab = (plan, z, height, meta = {}, steps = 8) => extruded(roundedPlan(plan, steps), z, height, meta);


export const cylinder = (cx, cy, r, z, height, meta = {}) => disc({ o: [cx, cy, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, z, z + height, r, meta);


export const disc = (F, s0, s1, r, meta = {}) => body(F, [[s0, 0], [s0, r], [s1, r], [s1, 0]], meta);


export const ring = (F, s0, s1, rIn, rOut, meta = {}) => body(F, [[s0, rIn], [s0, rOut], [s1, rOut], [s1, rIn]], meta);


export function box(min, max, meta = {}) {
  const centre = mul3(add3(min, max), 0.5);
  return { kind: "box", o: centre, axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], half: mul3(sub3(max, min), 0.5), ...meta };
}


export const orientedBox = (centre, axes, half, meta = {}) => ({ kind: "box", o: centre, axes: axes.map(unit3), half, ...meta });


export const ball = (at, r, meta = {}) => ({ kind: "ball", o: at, r, ...meta });


export function tube(points, radius, meta = {}) {
  const total = pathLength(points) || 1;
  let walked = 0;
  const radii = Array.isArray(radius)
    ? radius
    : points.map((point, index) => {
        if (index > 0) walked += len3(sub3(point, points[index - 1]));
        return typeof radius === "function" ? radius(walked / total) : radius;
      });
  return { kind: "tube", points, radii, round: meta.round ?? [false, false], ...meta };
}


export const slide = (F, from, to, r, meta = {}) => ({ ...disc(F, from, to, r, meta), slide: { from, to, r } });


export function moved(shape, offset) {
  if (!offset || (!offset[0] && !offset[1] && !offset[2])) return shape;
  if (shape.slide) {
    const { from, to, r } = shape.slide;
    const reach = Math.max(from + 1e-3, to + dot3(offset, shape.F.a));
    return { ...shape, poly: [[from, 0], [from, r], [reach, r], [reach, 0]], slide: { from, to: reach, r }, _b: undefined, _f: undefined };
  }
  const cut = shape.cut ? (Array.isArray(shape.cut) ? shape.cut.map((one) => moved(one, offset)) : moved(shape.cut, offset)) : undefined;
  if (shape.kind === "body" || shape.kind === "prism") return { ...shape, cut, F: { ...shape.F, o: add3(shape.F.o, offset) }, _b: undefined, _f: undefined };
  if (shape.kind === "tube") return { ...shape, cut, points: shape.points.map((p) => add3(p, offset)), tips: shape.tips && shape.tips.map((tip) => tip && add3(tip, offset)), _b: undefined };
  return { ...shape, cut, o: add3(shape.o, offset), _b: undefined };
}


function polyDistance(poly, s, r) {
  let best = BIG;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [s0, r0] = poly[j];
    const [s1, r1] = poly[i];
    const ds = s1 - s0;
    const dr = r1 - r0;
    const span = ds * ds + dr * dr;
    const t = span > 0 ? Math.max(0, Math.min(1, ((s - s0) * ds + (r - r0) * dr) / span)) : 0;
    const es = s - s0 - ds * t;
    const er = r - r0 - dr * t;
    const d = es * es + er * er;
    if (d < best && (r0 > 1e-9 || r1 > 1e-9)) best = d;
    if (r0 > r !== r1 > r && s < s0 + ((r - r0) * ds) / (dr || 1e-12)) inside = !inside;
  }
  const d = Math.sqrt(best);
  return inside ? -d : d;
}


export function polygonDistance(poly, x, y) {
  let best = BIG;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x0, y0] = poly[j];
    const [x1, y1] = poly[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const span = dx * dx + dy * dy;
    const t = span > 0 ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / span)) : 0;
    const ex = x - x0 - dx * t;
    const ey = y - y0 - dy * t;
    const d = ex * ex + ey * ey;
    if (d < best) best = d;
    if (y0 > y !== y1 > y && x < x0 + ((y - y0) * dx) / (dy || 1e-12)) inside = !inside;
  }
  const d = Math.sqrt(best);
  return inside ? -d : d;
}


function cappedSegment(p, a, b, r, endRadius = r) {
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bz = b[2] - a[2];
  const px = p[0] - a[0];
  const py = p[1] - a[1];
  const pz = p[2] - a[2];
  const baba = bx * bx + by * by + bz * bz || 1e-12;
  const paba = px * bx + py * by + pz * bz;
  if (endRadius !== r) {
    const length = Math.sqrt(baba);
    const along = paba / length;
    const radial = Math.hypot(px - bx * paba / baba, py - by * paba / baba, pz - bz * paba / baba);
    return polyDistance([[0, 0], [0, r], [length, endRadius], [length, 0]], along, radial);
  }
  const x = Math.hypot(px * baba - bx * paba, py * baba - by * paba, pz * baba - bz * paba) - r * baba;
  const y = Math.abs(paba - baba * 0.5) - baba * 0.5;
  const x2 = x * x;
  const y2 = y * y * baba;
  const d = Math.max(x, y) < 0 ? -Math.min(x2, y2) : (x > 0 ? x2 : 0) + (y > 0 ? y2 : 0);
  return (Math.sign(d) * Math.sqrt(Math.abs(d))) / baba;
}


export function segmentPoint(p, a, b) {
  const ba = sub3(b, a);
  const pa = sub3(p, a);
  const t = Math.max(0, Math.min(1, dot3(pa, ba) / (dot3(ba, ba) || 1e-12)));
  return { d: len3(sub3(pa, mul3(ba, t))), t };
}


export function sdf(shape, p) {
  const d = baseSdf(shape, p);
  return shape.cut ? Math.max(d, -cutDistance(shape, p)) : d;
}


export function cutDistance(shape, p) {
  if (!Array.isArray(shape.cut)) return sdf(shape.cut, p);
  let best = BIG;
  for (const cut of shape.cut) best = Math.min(best, sdf(cut, p));
  return best;
}


function baseSdf(shape, p) {
  if (shape.kind === "body") {
    const { F } = shape;
    const q = sub3(p, F.o);
    const s = dot3(q, F.a);
    const x = dot3(q, F.u);
    const y = dot3(q, F.v);
    return polyDistance(shape.poly, s, Math.hypot(x, y));
  }
  if (shape.kind === "ball") {
    let d = len3(sub3(p, shape.o)) - shape.r;
    if (shape.flats) for (const [nx, ny, nz, cut] of shape.flats) d = Math.max(d, nx * (p[0] - shape.o[0]) + ny * (p[1] - shape.o[1]) + nz * (p[2] - shape.o[2]) - cut);
    return d;
  }
  if (shape.kind === "prism") {
    const { F } = shape;
    const q = sub3(p, F.o);
    const s = dot3(q, F.a);
    const flat = polygonDistance(shape.poly, dot3(q, F.u), dot3(q, F.v));
    const along = Math.max(shape.s0 - s, s - shape.s1);
    return Math.hypot(Math.max(flat, 0), Math.max(along, 0)) + Math.min(Math.max(flat, along), 0);
  }
  if (shape.kind === "box") {
    const q = sub3(p, shape.o);
    const d = shape.axes.map((axis, index) => Math.abs(dot3(q, axis)) - shape.half[index]);
    const outside = Math.hypot(Math.max(d[0], 0), Math.max(d[1], 0), Math.max(d[2], 0));
    return outside + Math.min(Math.max(d[0], d[1], d[2]), 0);
  }
  const { points, radii, round } = shape;
  let best = BIG;
  const last = points.length - 1;
  for (let index = 0; index < last; index++) {
    const d = cappedSegment(p, points[index], points[index + 1], radii[index], radii[index + 1]);
    if (d < best) best = d;
  }
  if (round[0]) best = Math.min(best, len3(sub3(p, points[0])) - radii[0]);
  if (round[1]) best = Math.min(best, len3(sub3(p, points[last])) - radii[last]);
  return best;
}


export function boundsOf(shape) {
  if (shape._b) return shape._b;
  let min;
  let max;
  if (shape.kind === "body") {
    const { F, poly } = shape;
    const s0 = Math.min(...poly.map(([s]) => s));
    const s1 = Math.max(...poly.map(([s]) => s));
    const rm = Math.max(...poly.map(([, r]) => r));
    const a = add3(F.o, mul3(F.a, s0));
    const b = add3(F.o, mul3(F.a, s1));
    const spread = [0, 1, 2].map((i) => rm * Math.sqrt(Math.max(0, 1 - F.a[i] * F.a[i])));
    min = [0, 1, 2].map((i) => Math.min(a[i], b[i]) - spread[i]);
    max = [0, 1, 2].map((i) => Math.max(a[i], b[i]) + spread[i]);
  } else if (shape.kind === "ball") {
    min = shape.o.map((v) => v - shape.r);
    max = shape.o.map((v) => v + shape.r);
  } else if (shape.kind === "prism") {
    const { F } = shape;
    min = [BIG, BIG, BIG];
    max = [-BIG, -BIG, -BIG];
    for (const s of [shape.s0, shape.s1])
      for (const [x, y] of shape.poly) {
        const p = add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
        for (let i = 0; i < 3; i++) (min[i] = Math.min(min[i], p[i])), (max[i] = Math.max(max[i], p[i]));
      }
  } else if (shape.kind === "box") {
    const extent = [0, 1, 2].map((i) => shape.axes.reduce((sum, axis, j) => sum + Math.abs(axis[i]) * shape.half[j], 0));
    min = shape.o.map((v, i) => v - extent[i]);
    max = shape.o.map((v, i) => v + extent[i]);
  } else {
    min = [BIG, BIG, BIG];
    max = [-BIG, -BIG, -BIG];
    shape.points.forEach((p, index) => {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i] - shape.radii[index]);
        max[i] = Math.max(max[i], p[i] + shape.radii[index]);
      }
    });
  }
  shape._b = { min, max };
  return shape._b;
}


export function cameraBasis(P) {
  const { sinA, cosA, sinE, cosE, k } = cameraOf(P);
  return { R: [sinA, -cosA, 0], D: [cosA * sinE, sinA * sinE, -cosE], V: [cosA * cosE, sinA * cosE, sinE], k, origin: P.origin };
}


export function screenBox(shape, cam, offset) {
  const { min, max } = boundsOf(shape);
  let x0 = BIG;
  let y0 = BIG;
  let x1 = -BIG;
  let y1 = -BIG;
  const visit = (p) => {
    const x = cam.origin[0] + dot3(p, cam.R) * cam.k;
    const y = cam.origin[1] + dot3(p, cam.D) * cam.k;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  if (shape.kind === "tube") {
    shape.points.forEach((p, index) => {
      const r = shape.radii[index];
      const q = add3(p, offset);
      visit(add3(q, mul3(cam.R, r)));
      visit(add3(q, mul3(cam.R, -r)));
      visit(add3(q, mul3(cam.D, r)));
      visit(add3(q, mul3(cam.D, -r)));
    });
  } else {
    for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) visit(add3([x, y, z], offset));
  }
  return [x0, y0, x1, y1];
}


function spanOf(c, V, min, max) {
  let t0 = -BIG;
  let t1 = BIG;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(V[i]) < 1e-12) {
      if (c[i] < min[i] || c[i] > max[i]) return null;
      continue;
    }
    let a = (min[i] - c[i]) / V[i];
    let b = (max[i] - c[i]) / V[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
  }
  return t0 <= t1 ? [t0, t1] : null;
}


function tubeDistance(shape, p, segments) {
  const { points, radii, round } = shape;
  const last = points.length - 1;
  let best = BIG;
  for (const index of segments) {
    const d = cappedSegment(p, points[index], points[index + 1], radii[index], radii[index + 1]);
    if (d < best) best = d;
    for (const [joint, flag] of [[0, round[0]], [last, round[1]]]) {
      if (!flag || (joint !== index && joint !== index + 1)) continue;
      const q = points[joint];
      const e = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) - radii[joint];
      if (e < best) best = e;
    }
  }
  return best;
}


function bodyDepth(shape, c, V, eps) {
  const { F, poly } = shape;
  if (!shape._f || shape._f.view.some((value, index) => value !== V[index])) {
    const s = poly.map(([value]) => value);
    shape._f = { view: [...V], aV: dot3(F.a, V), uV: dot3(F.u, V), vV: dot3(F.v, V), s0: Math.min(...s), s1: Math.max(...s), rm: Math.max(...poly.map(([, r]) => r)) };
  }
  const { aV, uV, vV, s0, s1, rm } = shape._f;
  const q = [c[0] - F.o[0], c[1] - F.o[1], c[2] - F.o[2]];
  const sc = dot3(q, F.a);
  const xc = dot3(q, F.u);
  const yc = dot3(q, F.v);
  let lo = -BIG;
  let hi = BIG;
  if (Math.abs(aV) > 1e-9) {
    const a = (s0 - sc) / aV;
    const b = (s1 - sc) / aV;
    lo = Math.min(a, b);
    hi = Math.max(a, b);
  } else if (sc < s0 || sc > s1) return null;
  const qa = uV * uV + vV * vV;
  if (qa > 1e-12) {
    const qb = 2 * (xc * uV + yc * vV);
    const qc = xc * xc + yc * yc - rm * rm;
    const disc = qb * qb - 4 * qa * qc;
    if (disc < 0) return null;
    const root = Math.sqrt(disc);
    lo = Math.max(lo, (-qb - root) / (2 * qa));
    hi = Math.min(hi, (-qb + root) / (2 * qa));
  } else if (xc * xc + yc * yc > rm * rm) return null;
  if (lo > hi) return null;
  let t = hi + eps;
  for (let step = 0; step < 160 && t >= lo - eps; step++) {
    let d = polyDistance(poly, sc + t * aV, Math.hypot(xc + t * uV, yc + t * vV));
    if (shape.cut) d = Math.max(d, -cutDistance(shape, [c[0] + V[0] * t, c[1] + V[1] * t, c[2] + V[2] * t]));
    if (d < eps) return t;
    t -= Math.max(d, eps * 0.5);
  }
  return null;
}


export function rayDepth(shape, c, V, eps, segments) {
  if (shape.kind === "body") return bodyDepth(shape, c, V, eps);
  const span = spanOf(c, V, boundsOf(shape).min, boundsOf(shape).max);
  if (!span) return null;
  let t = span[1] + eps;
  for (let step = 0; step < 160 && t >= span[0] - eps; step++) {
    const p = [c[0] + V[0] * t, c[1] + V[1] * t, c[2] + V[2] * t];
    const d = segments ? tubeDistance(shape, p, segments) : sdf(shape, p);
    if (d < eps) return t;
    t -= Math.max(d, eps * 0.5);
  }
  return null;
}


export function flatDistance(x, y, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const span = dx * dx + dy * dy;
  const t = span > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / span)) : 0;
  return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
}


export const shareOf = (item, state) => (typeof state === "number" ? state : state.shares[item.ride ?? item.piece] ?? 0);


export const offsetOf = (item, state) => mul3(item.move ?? [0, 0, 0], shareOf(item, state));


export const labelOf = (state) => (typeof state === "number" ? `share ${Math.round(state * 1000) / 1000}` : state.label);


export const overlaps = (a, b, pad) => a.min.every((v, i) => v - pad <= b.max[i] && b.min[i] - pad <= a.max[i]);


export const matches = (list, name) =>
  (list ?? []).some((entry) => {
    if (typeof entry === "function") return entry(name);
    if (entry.endsWith("*")) return name.startsWith(entry.slice(0, -1));
    return name === entry || name.startsWith(entry + ".") || name.startsWith(entry + ":") || name.startsWith(entry + "#");
  });


export const seatedOn = (shape, host) => Boolean(shape.seated && shape.cut && [shape.cut].flat().some((cut) => cut === host || (cut.name && cut.name === host.name)));


export const sameRun = (a, b) => Boolean(a.route) && a.route === b.route && Math.abs(a.chunk - b.chunk) <= 1;
