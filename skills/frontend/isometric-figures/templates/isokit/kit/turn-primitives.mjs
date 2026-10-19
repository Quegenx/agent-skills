// Shared TURN implementation from turn-fixed.mjs. Each factory owns one runtime instance; no state crosses backend entrypoints.
export function createTurnPrimitives(dependencies, fixed) {
const T3_ROOT = Math.sqrt(1.6);

const T3_TAU = Math.PI * 2;

const T3_RAD = Math.PI / 180;

const T3_LB = [0, 0.2, 0.42, 0.62];

const T3_EB = [0.25, 0.5, 0.75];

const T3_SOFT = 0.035;

const T3_LEVELS = 32;

const T3_Q = 64;

const t3State = { detail: 1, exact: false };


function t3Fix(v, scale) {
  const t = Math.round(v * scale) / scale;
  return t === 0 ? "0" : String(t);
}


const t3Arena = { on: false, f: null };


function t3Matrix(f, role, a, b, c, d, e, g) {
  const list = f.tm || (f.tm = []);
  const m = list[role] || (list[role] = new Float64Array(6));
  m[0] = Math.round(a * 1e5) / 1e5;
  m[1] = Math.round(b * 1e5) / 1e5;
  m[2] = Math.round(c * 1e5) / 1e5;
  m[3] = Math.round(d * 1e5) / 1e5;
  m[4] = Math.round(e * 100) / 100;
  m[5] = Math.round(g * 100) / 100;
  return "\u0002";
}


const t3Step = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};


function t3Grow(f, name, size, Kind) {
  if (!f[name] || f[name].length < size) f[name] = new Kind(Math.max(size, f[name] ? f[name].length * 2 : 16));
  return f[name];
}


function t3Box(buf, count, box) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = buf[2 * i];
    const y = buf[2 * i + 1];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  box[0] = x0;
  box[1] = y0;
  box[2] = x1;
  box[3] = y1;
}


function t3Unit(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}


function t3Mul(A, B) {
  const out = new Float64Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  return out;
}


const t3Apply = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];


const T3_EYE = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);


function t3Quat(q) {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  const x = q[0] / l;
  const y = q[1] / l;
  const z = q[2] / l;
  const w = q[3] / l;
  return new Float64Array([1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]);
}


function t3Roles(part) {
  const roles = [];
  const spec = part.spec;
  const details = part.details ?? {};
  const add = (name, type, extra = {}) => roles.push({ name, type, ...extra });
  const tone = part.tone ?? "hi";
  const crease = part.crease ?? "faint";
  const fadedSlots = (prefix, count, cls, lineTone) => {
    for (let j = 0; j < count; j++) add(`${prefix}${j}`, "slot", { cls, tone: lineTone });
  };
  const planes = () => (part.planes ?? []).forEach((_, j) => add(`plane${j}`, "plane"));
  const dots = () => (part.dots ?? []).forEach((dot, j) => add(`c${j}`, "dot", { tone: dot.tone ?? "mid", size: dot.size ?? 0.5 }));
  const sheets = (top) => {
    for (let t = 0; t < 4; t++) add(`s${t}`, "path", { cls: "iso-shade", shade: t });
    if (top) add("s4", "path", { cls: "iso-top" });
  };
  const inner = () => {
    if ((details.seams && details.seams.length) || (details.ribs && details.ribs.seams)) add("inner", "path", { cls: "iso-line", tone: "faint" });
  };
  const ribs = () => {
    if (details.ribs) fadedSlots("r", spec.slots?.ribs ?? 6, "iso-line", details.ribs.tone ?? "lo");
  };
  if (part.kind === "prism") {
    add("fill", "path", { cls: "iso-fill" });
    const faces = spec.ring.length / 2 + (spec.up ? 0 : 2);
    for (let j = 0; j < faces; j++) add(`f${j}`, "face");
    if (spec.up) add("top", "xform", { cls: "iso-top" });
    if (crease !== "none") add("crease", "path", { cls: "iso-line iso-crease", tone: crease });
    if (spec.bevel && crease !== "none") fadedSlots("v", spec.slots?.bevel ?? 6, "iso-line iso-bevel", crease);
    if (details.seams && details.seams.length) add("inner", "path", { cls: "iso-line", tone: "faint" });
    planes();
    add("edge", "path", { cls: "iso-line iso-edge", tone });
    dots();
  } else if (part.kind === "round" || part.kind === "lathe") {
    add("fill", "path", { cls: "iso-fill" });
    sheets(true);
    const ends = part.kind === "round" ? spec.ends : spec.caps.map((cap) => (cap ? "flat" : "open"));
    ends.forEach((end, j) => end === "flat" && add(`k${j}`, "face"));
    if (crease !== "none") add("crease", "path", { cls: "iso-line iso-crease", tone: crease });
    inner();
    ribs();
    planes();
    add("edge", "path", { cls: "iso-line iso-edge", tone });
    dots();
  } else if (part.kind === "ball") {
    add("fill", "path", { cls: "iso-fill" });
    sheets(false);
    spec.flats.forEach((_, j) => add(`f${j}`, "face"));
    if (crease !== "none") add("crease", "path", { cls: "iso-line iso-crease", tone: crease });
    planes();
    add("edge", "path", { cls: "iso-line iso-edge", tone });
    dots();
  } else if (part.kind === "tube") {
    add("body", "path", { cls: "tb-body" });
    if (spec.wide) {
      add("shine", "path", { cls: "tb-shine" });
      add("shade", "path", { cls: "tb-shade" });
    }
    if (spec.rings) fadedSlots("r", spec.slots?.ribs ?? 6, "tb-ring", spec.rings.tone ?? "lo");
    add("edges", "path", { cls: "iso-line tb-edge", tone });
  } else if (fixed && part.kind === "item") {
    return roles;
  } else if (part.kind === "fixed") {
    add("move", "self");
    ribs();
    planes();
    dots();
  }
  return roles;
}


function t3Planes(list) {
  return (list ?? []).map((plane) => ({ o: plane.o, u: plane.u, v: plane.v, n: plane.n, fade: plane.fade ?? [0.04, 0.3], billboard: Boolean(plane.billboard) }));
}


function t3Dots(list) {
  return (list ?? []).map((dot) => ({ p: dot.p, n: dot.n ?? null, size: dot.size ?? 0.5, fade: dot.fade ?? [0.04, 0.42] }));
}


function t3PreparePrism(run, part) {
  const spec = part.spec;
  const n = spec.ring.length / 2;
  run.n = n;
  run.up = Boolean(spec.up);
  const ring = Float64Array.from(spec.ring);
  run.ring = ring;
  const nx = new Float64Array(n);
  const ny = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = ring[2 * j] - ring[2 * i];
    const dy = ring[2 * j + 1] - ring[2 * i + 1];
    const l = Math.hypot(dx, dy) || 1;
    nx[i] = dy / l;
    ny[i] = -dx / l;
  }
  run.nx = nx;
  run.ny = ny;
  const F = spec.up ? { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] } : spec.F;
  run.F = F;
  run.s0 = spec.up ? spec.z0 : spec.s0;
  run.s1 = spec.up ? spec.z1 : spec.s1;
  const lo = new Float64Array(3 * n);
  const hi = new Float64Array(3 * n);
  const N3 = new Float64Array(3 * n);
  for (let i = 0; i < n; i++) {
    const x = ring[2 * i];
    const y = ring[2 * i + 1];
    for (let c = 0; c < 3; c++) {
      const base = F.o[c] + F.u[c] * x + F.v[c] * y;
      lo[3 * i + c] = base + F.a[c] * run.s0;
      hi[3 * i + c] = base + F.a[c] * run.s1;
      N3[3 * i + c] = F.u[c] * nx[i] + F.v[c] * ny[i];
    }
  }
  run.lo = lo;
  run.hi = hi;
  run.N3 = N3;
  run.sharp = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = (i - 1 + n) % n;
    run.sharp[i] = nx[p] * nx[i] + ny[p] * ny[i] < Math.cos(0.35) ? 1 : 0;
  }
  if (spec.bevel) {
    const inset = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      const p = (i - 1 + n) % n;
      const mx = nx[p] + nx[i];
      const my = ny[p] + ny[i];
      const l = Math.hypot(mx, my) || 1;
      inset[2 * i] = ring[2 * i] - (mx / l) * spec.bevel;
      inset[2 * i + 1] = ring[2 * i + 1] - (my / l) * spec.bevel;
    }
    run.inset = inset;
  }
  run.seams = part.details && part.details.seams ? part.details.seams.slice() : null;
  run.cut = spec.cuts && spec.cuts.length ? spec.cuts : null;
}


function t3Axes(run, part) {
  if (run.kind === "ball") return run.flats.map((flat) => flat.n);
  if (run.kind === "tube") return run.tips.slice();
  if (run.kind === "prism") {
    const out = [run.F.a];
    for (let i = 0; i < run.n; i++) {
      const n = [run.N3[3 * i], run.N3[3 * i + 1], run.N3[3 * i + 2]];
      if (out.every((m) => Math.abs(m[0] * n[0] + m[1] * n[1] + m[2] * n[2]) < 0.9995)) out.push(n);
    }
    return out;
  }
  if (run.F) return [run.F.a];
  if (part.spec && part.spec.F) return [part.spec.F.a];
  return [];
}


function t3Unpack(value, grouped) {
  if (!value) return new Float64Array(0);
  if (typeof value !== "string") return Float64Array.from(value);
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const size = grouped ? 10 : 8;
  const stride = grouped ? 6 : 5;
  const count = bytes.length / size;
  const out = new Float64Array(count * stride);
  for (let e = 0; e < count; e++) {
    let o = e * size;
    const at = e * stride;
    out[at] = view.getUint16(o);
    out[at + 1] = view.getUint16(o + 2);
    o += 4;
    if (grouped) {
      out[at + 2] = view.getUint16(o) - 1;
      o += 2;
    }
    let x = (view.getUint16(o) / 65535) * 2 - 1;
    let y = (view.getUint16(o + 2) / 65535) * 2 - 1;
    const z = 1 - Math.abs(x) - Math.abs(y);
    if (z < 0) {
      const ox = (1 - Math.abs(y)) * (x >= 0 ? 1 : -1);
      const oy = (1 - Math.abs(x)) * (y >= 0 ? 1 : -1);
      x = ox;
      y = oy;
    }
    const l = Math.hypot(x, y, z) || 1;
    out[at + stride - 3] = x / l;
    out[at + stride - 2] = y / l;
    out[at + stride - 1] = z / l;
  }
  return out;
}


function t3Frame(run) {
  const count = run.roles.length;
  return { d: new Array(count).fill(""), q: new Int32Array(count), w: new Float64Array(count).fill(-1), t: new Array(count).fill(""), o: new Float64Array(count).fill(1), box: new Float64Array(4), hull: new Float64Array(64), hullN: 0, cx: new Float64Array(count), cy: new Float64Array(count), quads: null, quadN: 0 };
}


const t3Buf = { a: new Float64Array(1024), b: new Float64Array(1024), c: new Float64Array(1024) };


const t3Lines = { d: [], alpha: [], key: [] };

const t3None = { d: [], alpha: [], key: [] };



function t3Geo(F, cam) {
  const m = cam.m;
  const V = cam.V;
  const L = cam.L;
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const lin = (w) => [m[0] * w[0] + m[1] * w[1] + m[2] * w[2], m[3] * w[0] + m[4] * w[1] + m[5] * w[2]];
  const O = [cam.ox + m[0] * F.o[0] + m[1] * F.o[1] + m[2] * F.o[2], cam.oy + m[3] * F.o[0] + m[4] * F.o[1] + m[5] * F.o[2]];
  const aV = dot(F.a, V);
  const uV = dot(F.u, V);
  const vV = dot(F.v, V);
  const aL = dot(F.a, L);
  const uL = dot(F.u, L);
  const vL = dot(F.v, L);
  return { O, SA: lin(F.a), SU: lin(F.u), SV: lin(F.v), aV, aL, view: { a: aV, flat: Math.hypot(uV, vV), phi: Math.atan2(vV, uV) }, light: { a: aL, flat: Math.hypot(uL, vL), phi: Math.atan2(vL, uL) } };
}


function t3At(geo, s, r, t, buf, index) {
  const c = Math.cos(t);
  const n = Math.sin(t);
  buf[index] = geo.O[0] + s * geo.SA[0] + r * (c * geo.SU[0] + n * geo.SV[0]);
  buf[index + 1] = geo.O[1] + s * geo.SA[1] + r * (c * geo.SU[1] + n * geo.SV[1]);
}


function t3Oriented(buf, count) {
  let area = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    area += buf[2 * i] * buf[2 * j + 1] - buf[2 * j] * buf[2 * i + 1];
  }
  if (area >= 0) return buf;
  for (let i = 0, j = count - 1; i < j; i++, j--) {
    const x = buf[2 * i];
    const y = buf[2 * i + 1];
    buf[2 * i] = buf[2 * j];
    buf[2 * i + 1] = buf[2 * j + 1];
    buf[2 * j] = x;
    buf[2 * j + 1] = y;
  }
  return buf;
}


function t3Hull(points) {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-12) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-12) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}


function t3Meet(A, a, B, b) {
  const ab = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  const det = 1 - ab * ab;
  if (det < 1e-12) return [];
  const alpha = (a - b * ab) / det;
  const beta = (b - a * ab) / det;
  const base = [A[0] * alpha + B[0] * beta, A[1] * alpha + B[1] * beta, A[2] * alpha + B[2] * beta];
  const rest = 1 - (base[0] * base[0] + base[1] * base[1] + base[2] * base[2]);
  if (rest < 0) return [];
  const cr = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
  const k = Math.sqrt(rest / det);
  return [
    [base[0] + cr[0] * k, base[1] + cr[1] * k, base[2] + cr[2] * k],
    [base[0] - cr[0] * k, base[1] - cr[1] * k, base[2] - cr[2] * k],
  ];
}


const t3Tables = new Map();


function t3BoxOf(pts, box) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  box[0] = x0;
  box[1] = y0;
  box[2] = x1;
  box[3] = y1;
}


function t3Grown(poly, by) {
  if (!(by > 0)) return poly;
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area >= 0 ? 1 : -1;
  const n = poly.length;
  const normals = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(sign * (b[1] - a[1])) / l, (-sign * (b[0] - a[0])) / l];
  });
  return poly.map((p, i) => {
    const na = normals[(i - 1 + n) % n];
    const nb = normals[i];
    const mx = na[0] + nb[0];
    const my = na[1] + nb[1];
    const dd = (mx * mx + my * my) / 2 || 1;
    return [p[0] + (mx * by) / dd, p[1] + (my * by) / dd];
  });
}


function t3LatheMid(a, b) {
  const h = b.s - a.s;
  const ga = -a.na / a.nr;
  const gb = -b.na / b.nr;
  const nr = a.nr + b.nr;
  const na = a.na + b.na;
  const l = Math.hypot(nr, na) || 1;
  return { s: (a.s + b.s) / 2, r: (a.r + b.r) / 2 + (h * (ga - gb)) / 8, nr: nr / l, na: na / l };
}


function t3ClipConvex(subject, clip) {
  if (subject.length < 3 || clip.length < 3) return [];
  let area = 0;
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area >= 0 ? 1 : -1;
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
  return out;
}


function t3LatheSeam(levels, s) {
  for (let i = 0; i + 4 < levels.length; i += 4) {
    const sa = levels[i];
    const sb = levels[i + 4];
    if ((s - sa) * (s - sb) <= 0 && sa !== sb) {
      const t = (s - sa) / (sb - sa);
      const r = levels[i + 1] + (levels[i + 5] - levels[i + 1]) * t;
      const slope = (levels[i + 5] - levels[i + 1]) / (sb - sa);
      return { s, r, slope };
    }
  }
  return { s, r: levels[1], slope: 0 };
}


const T3_SHINE = (() => {
  const l = Math.hypot(-0.55, -0.835);
  return [-0.55 / l, -0.835 / l];
})();


function t3RouteOf(flat) {
  const n = flat.length / 3;
  const along = new Float64Array(n);
  for (let i = 1; i < n; i++) along[i] = along[i - 1] + Math.hypot(flat[3 * i] - flat[3 * i - 3], flat[3 * i + 1] - flat[3 * i - 2], flat[3 * i + 2] - flat[3 * i - 1]);
  return { flat, n, along, total: along[n - 1] };
}


function t3PointAlong(route, at) {
  const { flat, n, along } = route;
  if (at <= 0) return [flat[0], flat[1], flat[2]];
  if (at >= along[n - 1]) return [flat[3 * n - 3], flat[3 * n - 2], flat[3 * n - 1]];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (along[mid] <= at) lo = mid;
    else hi = mid;
  }
  const span = along[hi] - along[lo] || 1;
  const t = (at - along[lo]) / span;
  return [flat[3 * lo] + (flat[3 * hi] - flat[3 * lo]) * t, flat[3 * lo + 1] + (flat[3 * hi + 1] - flat[3 * lo + 1]) * t, flat[3 * lo + 2] + (flat[3 * hi + 2] - flat[3 * lo + 2]) * t];
}


function t3Cut(route, from, to) {
  const { flat, n, along } = route;
  const out = [];
  for (let i = 1; i < n; i++) {
    const start = along[i - 1];
    const end = along[i];
    if (end >= from && start <= to) {
      const length = end - start || 1;
      const t0 = Math.max(0, (from - start) / length);
      const t1 = Math.min(1, (to - start) / length);
      const at = (t) => [flat[3 * i - 3] + (flat[3 * i] - flat[3 * i - 3]) * t, flat[3 * i - 2] + (flat[3 * i + 1] - flat[3 * i - 2]) * t, flat[3 * i - 1] + (flat[3 * i + 2] - flat[3 * i - 1]) * t];
      if (!out.length) out.push(at(t0));
      out.push(at(t1));
    }
  }
  return out;
}


const t3RouteCache = new WeakMap();


const t3Pts = (buf, n) => {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = [buf[2 * i], buf[2 * i + 1]];
  return out;
};


function t3StripeEnd(half, centre, nx, ny, from, to) {
  const offset = (p) => (p[0] - centre[0]) * nx + (p[1] - centre[1]) * ny;
  const values = half.map(offset);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const points = [];
  const cross = (k, level) => {
    const t = (level - values[k]) / (values[k + 1] - values[k] || 1e-9);
    return [half[k][0] + (half[k + 1][0] - half[k][0]) * t, half[k][1] + (half[k + 1][1] - half[k][1]) * t];
  };
  for (let k = 0; k < half.length; k++) {
    if (values[k] >= lo && values[k] <= hi) points.push(half[k]);
    if (k < half.length - 1) for (const level of [lo, hi]) if ((values[k] - level) * (values[k + 1] - level) < 0) points.push(cross(k, level));
  }
  return points
    .map((p) => [p, offset(p)])
    .sort((x, y) => (from > to ? y[1] - x[1] : x[1] - y[1]))
    .map(([p]) => p);
}


function t3Overlap(a, b, pad) {
  return a[0] < b[2] - pad && b[0] < a[2] - pad && a[1] < b[3] - pad && b[1] < a[3] - pad;
}


function t3Apart(A, an, B, bn, pad) {
  for (let pass = 0; pass < 2; pass++) {
    const P = pass ? B : A;
    const pn = pass ? bn : an;
    for (let i = 0; i < pn; i++) {
      const j = (i + 1) % pn;
      const nx = P[2 * j + 1] - P[2 * i + 1];
      const ny = P[2 * i] - P[2 * j];
      const l = Math.hypot(nx, ny);
      if (l < 1e-9) continue;
      let a0 = Infinity;
      let a1 = -Infinity;
      for (let q = 0; q < an; q++) {
        const v = (A[2 * q] * nx + A[2 * q + 1] * ny) / l;
        if (v < a0) a0 = v;
        if (v > a1) a1 = v;
      }
      let b0 = Infinity;
      let b1 = -Infinity;
      for (let q = 0; q < bn; q++) {
        const v = (B[2 * q] * nx + B[2 * q + 1] * ny) / l;
        if (v < b0) b0 = v;
        if (v > b1) b1 = v;
      }
      if (a1 < b0 + pad || b1 < a0 + pad) return true;
    }
  }
  return false;
}


function t3Support(cloud, R, t, dir, world) {
  let best = -Infinity;
  let at = 0;
  const n = cloud.length / 3;
  const dx = R[0] * dir[0] + R[3] * dir[1] + R[6] * dir[2];
  const dy = R[1] * dir[0] + R[4] * dir[1] + R[7] * dir[2];
  const dz = R[2] * dir[0] + R[5] * dir[1] + R[8] * dir[2];
  for (let i = 0; i < n; i++) {
    const v = cloud[3 * i] * dx + cloud[3 * i + 1] * dy + cloud[3 * i + 2] * dz;
    if (v > best) {
      best = v;
      at = i;
    }
  }
  const x = cloud[3 * at];
  const y = cloud[3 * at + 1];
  const z = cloud[3 * at + 2];
  world[0] = R[0] * x + R[1] * y + R[2] * z + t[0];
  world[1] = R[3] * x + R[4] * y + R[5] * z + t[1];
  world[2] = R[6] * x + R[7] * y + R[8] * z + t[2];
  return best + dir[0] * t[0] + dir[1] * t[1] + dir[2] * t[2];
}


function t3Keep(values) {
  const n = values.length;
  const tails = [];
  const tailAt = [];
  const back = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < values[i]) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = values[i];
    tailAt[lo] = i;
    back[i] = lo > 0 ? tailAt[lo - 1] : -1;
  }
  const keep = new Uint8Array(n);
  let k = tails.length ? tailAt[tails.length - 1] : -1;
  while (k >= 0) {
    keep[k] = 1;
    k = back[k];
  }
  return keep;
}


function t3Anchor(scene, cams, name, point, direction) {
  const index = name === null || name === undefined ? -1 : scene.groups.findIndex((g) => g.name === name);
  const cam = index >= 0 ? cams[index] : cams.world;
  const o = index >= 0 ? scene.groups[index].origin : [0, 0, 0];
  const R = cam.R;
  const q = [point[0] - o[0], point[1] - o[1], point[2] - o[2]];
  const world = [R[0] * q[0] + R[1] * q[1] + R[2] * q[2] + cam.t[0], R[3] * q[0] + R[4] * q[1] + R[5] * q[2] + cam.t[1], R[6] * q[0] + R[7] * q[1] + R[8] * q[2] + cam.t[2]];
  const w = cams.world;
  const screen = [w.ox + w.m[0] * world[0] + w.m[1] * world[1] + w.m[2] * world[2], w.oy + w.m[3] * world[0] + w.m[4] * world[1] + w.m[5] * world[2]];
  const out = { world, screen };
  if (direction) out.direction = [R[0] * direction[0] + R[1] * direction[1] + R[2] * direction[2], R[3] * direction[0] + R[4] * direction[1] + R[5] * direction[2], R[6] * direction[0] + R[7] * direction[1] + R[8] * direction[2]];
  return out;
}


const T3_MAT_KEYS = ["paper", "face", "top", "shade-0", "shade-1", "shade-2", "shade-3", "lit-top", "lit-shade", "hi", "mid", "lo", "faint", "dot", "lit"];

const T3_MAT_TUBE = ["body", "shine", "shade", "edge"];


// glass, pcb, sensor, signal, coffee, bean, milk, smoke, porcelain, lavender and knit are from anatomy-reveal (MIT, Ann Nguyen,
// see LICENSE-anatomy-reveal.txt beside this file), as are the __t3unsep and __t3forced debug collectors in t3Order.
const T3_MATERIALS = {
  gold: {
    light: ["#d3bb88", "#e4d2a8", "#f1e5c6", "#a1844f", "#bc9f69", "#d3bb88", "#e4d2a8", "#f8efd8", "#dfcb9c", "#4b3920", "#86693f", "#a98c5b", "#c1a676", "#4a381f", "#2a1d0c", "#cdb07a", "#f3e8cc", "#8e7044", "#4b3920"],
    dark: ["#3f3521", "#4b3f28", "#5a4c31", "#2b2416", "#352c1b", "#3f3521", "#4b3f28", "#6a5a3b", "#4f4329", "#e6d2a3", "#8a7550", "#5e4e33", "#463a26", "#e6d2a3", "#fff3d6", "#4a3e27", "#8c7853", "#251f13", "#e6d2a3"],
  },
  chrome: {
    light: ["#8e959c", "#c3c8cd", "#f7f8f9", "#a2a9b0", "#6f767d", "#454b52", "#cacfd4", "#ffffff", "#bcc2c8", "#202428", "#585e65", "#878d94", "#a9afb5", "#2a2e33", "#000000", "#8b9299", "#fbfcfd", "#3c4248", "#202428"],
    dark: ["#2a2e32", "#4a5056", "#6e757c", "#2e3236", "#24272b", "#1a1d20", "#4a5056", "#848b92", "#3a3f44", "#dfe3e7", "#7c838a", "#4d5359", "#363b40", "#e4e7ea", "#ffffff", "#34393e", "#9aa1a8", "#16191b", "#dfe3e7"],
  },
  steel: {
    light: ["#b8bdc1", "#cdd1d4", "#e5e8ea", "#8f959b", "#a4aaaf", "#b8bdc1", "#cdd1d4", "#f1f3f4", "#c6cacd", "#2b2f33", "#6b7177", "#959ba1", "#aeb3b8", "#33373b", "#000000", "#b3b8bd", "#eef0f2", "#7d8389", "#2b2f33"],
    dark: ["#2c3034", "#34393d", "#3e4348", "#1f2225", "#25292c", "#2c3034", "#34393d", "#4a5056", "#33383c", "#d0d4d8", "#727980", "#4a5056", "#33383d", "#d8dce0", "#ffffff", "#30353a", "#5c6369", "#1a1d20", "#d0d4d8"],
  },
  gunmetal: {
    light: ["#444a51", "#50575e", "#5f666e", "#2f3439", "#393f45", "#444a51", "#50575e", "#6d757d", "#4b5258", "#0f1113", "#1d2125", "#272b30", "#30353a", "#b0b5ba", "#000000", "#3d4349", "#6e757c", "#24282c", "#0f1113"],
    dark: ["#1d2125", "#22272b", "#2a2f34", "#15181b", "#191c20", "#1d2125", "#22272b", "#323840", "#20252a", "#a9b0b7", "#5c636a", "#3a4046", "#2a2f34", "#b8bec4", "#ffffff", "#1f2327", "#3a4046", "#111316", "#a9b0b7"],
  },
  rubber: {
    light: ["#2a2b2e", "#34363a", "#46484d", "#1b1c1e", "#222326", "#2a2b2e", "#34363a", "#55575c", "#2f3134", "#070708", "#111214", "#18191b", "#1f2023", "#6a6c70", "#000000", "#27282b", "#5b5d62", "#121314", "#050506"],
    dark: ["#121213", "#161618", "#1c1c1f", "#0c0c0d", "#0f0f10", "#121213", "#161618", "#232327", "#141416", "#8c8e92", "#4a4c50", "#2c2d30", "#1f2023", "#9a9ca0", "#ffffff", "#131315", "#2b2c30", "#0a0a0b", "#8c8e92"],
  },
  brass: {
    light: ["#bd9646", "#d2ad5b", "#e6c87e", "#8a6a2c", "#a47f38", "#bd9646", "#d2ad5b", "#f0d796", "#c8a252", "#3f2e0e", "#765a24", "#9a7a3c", "#b08c46", "#3a2a0c", "#1f1606", "#b8913f", "#efd795", "#7d5f26", "#3f2e0e"],
    dark: ["#3d3017", "#49391c", "#574523", "#2a210f", "#332813", "#3d3017", "#49391c", "#66522b", "#45371b", "#e9cf8a", "#8e7438", "#5e4c25", "#44371c", "#e9cf8a", "#fff0c8", "#433419", "#8a6f36", "#21190b", "#e9cf8a"],
  },
  copper: {
    light: ["#b3633e", "#c9784f", "#df9670", "#7c4128", "#9a5132", "#b3633e", "#c9784f", "#eaa985", "#be6d46", "#3a1a0c", "#6e3820", "#925037", "#a65d3f", "#3a1a0c", "#1c0b04", "#ad5f3b", "#f0b896", "#6e3720", "#3a1a0c"],
    dark: ["#3d1f13", "#492617", "#582e1c", "#2a160d", "#331a10", "#3d1f13", "#492617", "#673722", "#432215", "#eaa985", "#8f5236", "#5f3624", "#45271a", "#eaa985", "#ffe0cc", "#42221a", "#8a4c31", "#1f0f08", "#eaa985"],
  },
  glass: {
    light: ["#e3eff2", "#eef7f9", "#f7fcfd", "#b9d2d8", "#c8dde2", "#d6e7eb", "#e3eff2", "#ffffff", "#e0eef1", "#1f4954", "#5f8e99", "#97bcc5", "#c3dbe0", "#2a5b66", "#000000", "#d3e6ea", "#ffffff", "#9fbfc7", "#1f4954"],
    dark: ["#0a1519", "#0e1c21", "#1a3640", "#08161b", "#0c1f25", "#112a32", "#17363f", "#2b5a66", "#1b4652", "#9ad7e3", "#4f8b97", "#2a5560", "#173a43", "#c8f0f8", "#ffffff", "#0e2026", "#2b5a66", "#071216", "#9ad7e3"],
  },
  pcb: {
    light: ["#cfe6d5", "#dcefe0", "#e9f6ec", "#9cc7a6", "#acd3b5", "#bddcc4", "#cfe6d5", "#f2fbf4", "#d6ecdb", "#17432a", "#4a8a5d", "#86b994", "#b5d8bd", "#7a6420", "#000000", "#c3e0ca", "#f2fbf4", "#8fbf9b", "#17432a"],
    dark: ["#0c1d12", "#0f2618", "#1b4a2a", "#0a1a0f", "#0d2415", "#12301c", "#173c23", "#2c6a3c", "#1e5230", "#8fe0a5", "#3f8f56", "#2a5c38", "#1a3d25", "#e8d17a", "#ffffff", "#0f2618", "#2c6a3c", "#071209", "#8fe0a5"],
  },
  sensor: {
    light: ["#e4dcf2", "#efe9f8", "#f7f3fc", "#c2b2e0", "#cfc1e8", "#dacfee", "#e4dcf2", "#ffffff", "#e8e1f5", "#3b2366", "#7458a8", "#a893cf", "#cdbfe6", "#3b2366", "#000000", "#dcd2ee", "#ffffff", "#ad9ad1", "#3b2366"],
    dark: ["#170d22", "#1e122d", "#3d2560", "#140b1e", "#1c1029", "#251537", "#2f1b46", "#5a3a8c", "#43296b", "#d2b8ff", "#8a68c4", "#553d80", "#33244f", "#f0e0ff", "#ffffff", "#1e122d", "#5a3a8c", "#0d0614", "#d2b8ff"],
  },
  signal: {
    light: ["#e45a52", "#ec7067", "#f48a80", "#b8352f", "#c9423b", "#d84d46", "#e45a52", "#ff9d94", "#ec7067", "#5e0f0c", "#9e2a25", "#c4524b", "#e08a83", "#5e0f0c", "#000000", "#d84d46", "#ff9d94", "#a3302a", "#5e0f0c"],
    dark: ["#3a0a0c", "#4a0d10", "#7a1a1c", "#2e0709", "#3c0a0c", "#4d0e11", "#5e1316", "#a3282b", "#7a1a1d", "#ff9a96", "#c2484a", "#7a2224", "#4d1214", "#ffd0cc", "#ffffff", "#4a0d10", "#a3282b", "#240405", "#ff9a96"],
  },
  coffee: {
    light: ["#ad784e", "#b47d51", "#b98154", "#936541", "#9d6d46", "#a7734b", "#af7a4f", "#b98154", "#a8754c", "#3b2415", "#65432a", "#855b3a", "#9b6b45", "#442b1a", "#1e0f07", "#a8754c", "#b98154", "#8a5e3d", "#3b2415"],
    dark: ["#765033", "#7d5537", "#8b5f3d", "#4d3320", "#5c3e27", "#6b482e", "#795234", "#926540", "#724d31", "#24160d", "#3c2618", "#523622", "#65442b", "#1e110a", "#9a6a44", "#724d31", "#90633f", "#4d3320", "#24160d"],
  },
  bean: {
    light: ["#66442f", "#6a4731", "#6e4a33", "#543827", "#5b3d2a", "#61412d", "#674530", "#6e4a33", "#62422d", "#1c110c", "#352318", "#4a3122", "#593c29", "#21150e", "#0d0705", "#62422d", "#6e4a33", "#4e3424", "#1c110c"],
    dark: ["#422c1e", "#472f20", "#503524", "#281a12", "#312116", "#3b271a", "#442d1f", "#553927", "#3f2a1d", "#110b07", "#1e130d", "#2b1c13", "#372419", "#0e0906", "#5a3c29", "#3f2a1d", "#533726", "#281a12", "#110b07"],
  },
  milk: {
    light: ["#eee4d5", "#f4eadb", "#f8efe0", "#d7ccbd", "#e0d5c6", "#e8decf", "#f0e6d7", "#f8efe0", "#eae0d0", "#7c695a", "#ab9c8d", "#cabdae", "#ded3c4", "#867565", "#4a3424", "#eae0d0", "#f8efe0", "#cfc3b3", "#7c695a"],
    dark: ["#bdaf9b", "#c6b8a3", "#d5c7b2", "#8d7e6d", "#9f907e", "#b0a28f", "#c0b29e", "#ded0ba", "#b9aa97", "#564739", "#766758", "#938473", "#a99b88", "#4d3d30", "#e6d8c2", "#b9aa97", "#daccb7", "#8d7e6d", "#564739"],
  },
  smoke: {
    light: ["#8f969c", "#959da3", "#9aa2a8", "#767d82", "#80878c", "#899095", "#91989e", "#9aa2a8", "#8a9197", "#272a2c", "#4c5054", "#696f73", "#7e858a", "#2e3134", "#0f1113", "#8a9197", "#9aa2a8", "#6e7478", "#272a2c"],
    dark: ["#4f565b", "#555c61", "#60686e", "#303437", "#3b4144", "#474d51", "#51585d", "#666f74", "#4c5357", "#121416", "#232629", "#34383b", "#42484c", "#0e1011", "#6c757b", "#4c5357", "#646c72", "#303437", "#121416"],
  },
  porcelain: {
    light: ["#f4f3f1", "#fbfaf8", "#ffffff", "#d9d7d3", "#e4e2de", "#eeece9", "#f6f5f3", "#ffffff", "#efeeeb", "#5d5a56", "#a19d98", "#c9c6c1", "#e2e0dc", "#6d6a66", "#000000", "#efeeeb", "#ffffff", "#cfccc7", "#5d5a56"],
    dark: ["#cfccc8", "#dad7d3", "#ecebe8", "#8e8b87", "#a7a4a0", "#bebbb7", "#d3d0cc", "#f6f5f3", "#c9c6c2", "#3b3936", "#6e6b67", "#97938f", "#b5b2ae", "#2a2826", "#ffffff", "#c9c6c2", "#f2f1ef", "#8e8b87", "#3b3936"],
  },
  lavender: {
    light: ["#d9d4e6", "#e3dfee", "#eeebf5", "#a59cc0", "#b5adcc", "#c5bed8", "#d4cee3", "#f4f1fa", "#ddd8eb", "#3b3550", "#7d7596", "#aaa3c2", "#cbc6dc", "#4a4360", "#000000", "#ccc6dc", "#f1eef8", "#a199bd", "#3b3550"],
    dark: ["#8a83a0", "#9690ac", "#c3bdd6", "#5b5470", "#6c6582", "#7e7795", "#9089a8", "#d6d0e6", "#a8a1bf", "#2c2740", "#4f4866", "#6f6888", "#7e7795", "#ffffff", "#ffffff", "#8a83a0", "#c3bdd6", "#4a4360", "#2c2740"],
  },
  knit: {
    light: ["#cfccd6", "#dad7e0", "#e6e4eb", "#a29eae", "#b2aebd", "#c1bdcb", "#cfccd8", "#ece9f0", "#d4d1dc", "#4a4656", "#8b8798", "#b1adbd", "#cac6d3", "#5a5666", "#000000", "#c6c2cf", "#e6e4eb", "#a29eae", "#4a4656"],
    dark: ["#7d7988", "#888494", "#aeaabb", "#55515f", "#64606f", "#736f7f", "#827e8f", "#c1bdcd", "#8f8b9c", "#2e2b38", "#4a4656", "#5d5969", "#6c6878", "#ffffff", "#ffffff", "#7d7988", "#aeaabb", "#4a4656", "#2e2b38"],
  },
};
  return { T3_ROOT, T3_TAU, T3_RAD, T3_LB, T3_EB, T3_SOFT, T3_LEVELS, T3_Q, t3State, t3Fix, t3Arena, t3Matrix, t3Step, t3Grow, t3Box, t3Unit, t3Mul, t3Apply, T3_EYE, t3Quat, t3Roles, t3Planes, t3Dots, t3PreparePrism, t3Axes, t3Unpack, t3Frame, t3Buf, t3Lines, t3None, t3Geo, t3At, t3Oriented, t3Hull, t3Meet, t3Tables, t3BoxOf, t3Grown, t3LatheMid, t3ClipConvex, t3LatheSeam, T3_SHINE, t3RouteOf, t3PointAlong, t3Cut, t3RouteCache, t3Pts, t3StripeEnd, t3Overlap, t3Apart, t3Support, t3Keep, t3Anchor, T3_MAT_KEYS, T3_MAT_TUBE, T3_MATERIALS };
}
