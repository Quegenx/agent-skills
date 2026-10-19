// Shared TURN implementation from turn-fixed.mjs. Each factory owns one runtime instance; no state crosses backend entrypoints.
export function createTurnOutlines(dependencies, fixed) {
  const { T3_EYE, T3_ROOT, T3_TAU, t3ArcPoints, t3Arena, t3Basis, t3Cut, t3Disjoint, t3Enclose, t3Fix, t3Gjk, t3Grow, t3Hull, t3LatheMid, t3MaterialCss, t3Matrix, t3Num, t3Overlap, t3PointAlong, t3Quat, t3Rot, t3RouteCache, t3RouteOf, t3Step, t3Table, t3TangentAlong, t3Thin, t3Token, t3Unit } = dependencies;


function t3Path(buf, count, closed) {
  if (count < 2) return "";
  if (t3Arena.on) return t3Token((i) => buf[i], count, closed);
  let s = "M" + t3Num(buf[0]) + " " + t3Num(buf[1]);
  for (let i = 1; i < count; i++) s += "L" + t3Num(buf[2 * i]) + " " + t3Num(buf[2 * i + 1]);
  return closed ? s + "Z" : s;
}


function t3FreeRot(v) {
  if (v.R) return v.R instanceof Float64Array ? v.R : Float64Array.from(v.R);
  if (v.q) return t3Quat(v.q);
  if (v.axis) return t3Rot(v.axis, v.angle ?? 0);
  return T3_EYE;
}


function t3Cloud(run, part) {
  const out = [];
  const ring = (F, s, r, count) => {
    for (let j = 0; j < count; j++) {
      const c = Math.cos((j / count) * T3_TAU);
      const n = Math.sin((j / count) * T3_TAU);
      out.push(F.o[0] + F.a[0] * s + r * (c * F.u[0] + n * F.v[0]), F.o[1] + F.a[1] * s + r * (c * F.u[1] + n * F.v[1]), F.o[2] + F.a[2] * s + r * (c * F.u[2] + n * F.v[2]));
    }
  };
  if (run.kind === "prism") {
    for (let i = 0; i < 3 * run.n; i++) out.push(run.lo[i]);
    for (let i = 0; i < 3 * run.n; i++) out.push(run.hi[i]);
  } else if (run.kind === "round") {
    ring(run.F, run.s0, run.r0, 24);
    ring(run.F, run.s1, run.r1, 24);
    for (const [end, s, r] of [[0, run.s0, run.r0], [1, run.s1, run.r1]]) {
      if (run.ends[end] !== "dome") continue;
      const sign = end ? 1 : -1;
      for (const b of [0.5, 1.0, 1.35]) ring(run.F, s + sign * r * Math.sin(b), r * Math.cos(b), 6);
      out.push(run.F.o[0] + run.F.a[0] * (s + sign * r), run.F.o[1] + run.F.a[1] * (s + sign * r), run.F.o[2] + run.F.a[2] * (s + sign * r));
    }
  } else if (run.kind === "ball") {
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 64; i++) {
      const y = 1 - (2 * (i + 0.5)) / 64;
      const rad = Math.sqrt(1 - y * y);
      const w = [Math.cos(golden * i) * rad, Math.sin(golden * i) * rad, y];
      const p = [run.c[0] + run.r * w[0], run.c[1] + run.r * w[1], run.c[2] + run.r * w[2]];
      let inside = true;
      for (const flat of run.flats) if ((p[0] - run.c[0]) * flat.n[0] + (p[1] - run.c[1]) * flat.n[1] + (p[2] - run.c[2]) * flat.n[2] > flat.d + 1e-9) inside = false;
      if (inside) out.push(p[0], p[1], p[2]);
    }
    for (const flat of run.flats)
      for (let j = 0; j < 12; j++) {
        const c = Math.cos((j / 12) * T3_TAU) * flat.rho;
        const n = Math.sin((j / 12) * T3_TAU) * flat.rho;
        out.push(run.c[0] + flat.n[0] * flat.d + c * flat.u[0] + n * flat.v[0], run.c[1] + flat.n[1] * flat.d + c * flat.u[1] + n * flat.v[1], run.c[2] + flat.n[2] * flat.d + c * flat.u[2] + n * flat.v[2]);
      }
  } else if (run.kind === "lathe") {
    const lv = run.levels;
    const step = Math.max(4, Math.floor(lv.length / 4 / 8)) * 4;
    for (let i = 0; i < lv.length; i += step) ring(run.F, lv[i], lv[i + 1], 8);
    ring(run.F, lv[lv.length - 4], lv[lv.length - 3], 8);
  } else if (run.kind === "tube") {
    const b = run.body;
    const stride = Math.max(1, Math.floor(b.count / 8));
    for (let i = 0; i < b.count; i += stride) {
      const T = t3Unit([b.D3[3 * i], b.D3[3 * i + 1], b.D3[3 * i + 2]]);
      const [u, v] = t3Basis(T);
      ring({ o: [b.P3[3 * i], b.P3[3 * i + 1], b.P3[3 * i + 2]], a: T, u, v }, 0, run.r, 8);
    }
  } else if (part.cloud) for (const v of part.cloud) out.push(v);
  return Float64Array.from(out);
}


function t3EmitPlanes(run, cam, f, sx = 0, sy = 0) {
  const m = cam.m;
  const V = cam.V;
  for (let j = 0; j < run.planes.length; j++) {
    const plane = run.planes[j];
    const role = run.role[`plane${j}`];
    const o = plane.o;
    const X = cam.ox - sx + m[0] * o[0] + m[1] * o[1] + m[2] * o[2];
    const Y = cam.oy - sy + m[3] * o[0] + m[4] * o[1] + m[5] * o[2];
    const facing = plane.n[0] * V[0] + plane.n[1] * V[1] + plane.n[2] * V[2];
    const alpha = Math.round(t3Step(plane.fade[0], plane.fade[1], facing) * 100) / 100;
    f.o[role] = alpha;
    if (plane.billboard) {
      f.t[role] = t3Arena.on ? t3Matrix(f, role, 1, 0, 0, 1, X, Y) : `translate(${t3Num(X)} ${t3Num(Y)})`;
      continue;
    }
    const u = plane.u;
    const v = plane.v;
    const a = m[0] * u[0] + m[1] * u[1] + m[2] * u[2];
    const b = m[3] * u[0] + m[4] * u[1] + m[5] * u[2];
    const c = m[0] * v[0] + m[1] * v[1] + m[2] * v[2];
    const d = m[3] * v[0] + m[4] * v[1] + m[5] * v[2];
    f.t[role] = t3Arena.on ? t3Matrix(f, role, a, b, c, d, X, Y) : `matrix(${t3Fix(a, 1e5)} ${t3Fix(b, 1e5)} ${t3Fix(c, 1e5)} ${t3Fix(d, 1e5)} ${t3Fix(X, 100)} ${t3Fix(Y, 100)})`;
  }
}


function t3PathOf(points, closed) {
  if (points.length < 2) return "";
  if (t3Arena.on) return t3Token((i) => points[i >> 1][i & 1], points.length, closed);
  let s = "M" + t3Num(points[0][0]) + " " + t3Num(points[0][1]);
  for (let i = 1; i < points.length; i++) s += "L" + t3Num(points[i][0]) + " " + t3Num(points[i][1]);
  return closed ? s + "Z" : s;
}


function t3HullOut(f, points, most = 32) {
  const thin = t3Thin(points, most);
  const hull = t3Grow(f, "hull", 2 * thin.length, Float64Array);
  for (let i = 0; i < thin.length; i++) {
    hull[2 * i] = thin[i][0];
    hull[2 * i + 1] = thin[i][1];
  }
  f.hullN = thin.length;
}


function t3SupportHull(geo, cam, components, dirs) {
  const table = t3Table(dirs);
  const pts = [];
  const { O, SA, SU, SV } = geo;
  for (let j = 0; j < dirs; j++) {
    const dx = table[2 * j];
    const dy = table[2 * j + 1];
    const pa = SA[0] * dx + SA[1] * dy;
    const pu = SU[0] * dx + SU[1] * dy;
    const pv = SV[0] * dx + SV[1] * dy;
    const w = Math.hypot(pu, pv);
    let best = -Infinity;
    let px = 0;
    let py = 0;
    for (let c = 0; c < components.length; c += 3) {
      const kind = components[c];
      const s = components[c + 1];
      const r = components[c + 2];
      if (kind === 0) {
        const value = s * pa + r * w;
        if (value > best) {
          best = value;
          const cs = w > 1e-12 ? pu / w : 1;
          const sn = w > 1e-12 ? pv / w : 0;
          px = O[0] + s * SA[0] + r * (cs * SU[0] + sn * SV[0]);
          py = O[1] + s * SA[1] + r * (cs * SU[1] + sn * SV[1]);
        }
      } else {
        const rk = r * cam.k;
        const value = s * pa + rk;
        if (value > best) {
          best = value;
          px = O[0] + s * SA[0] + rk * dx;
          py = O[1] + s * SA[1] + rk * dy;
        }
      }
    }
    const last = pts[pts.length - 1];
    if (!last || Math.abs(last[0] - px) + Math.abs(last[1] - py) > 0.02) pts.push([px, py]);
  }
  if (pts.length > 2) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 0.02) pts.pop();
  }
  return pts;
}


function t3RoundOutline(run, geo, cam) {
  const k = cam.k;
  const { s0, s1, r0, r1, ends } = run;
  const domes = (ends[0] === "dome" ? 1 : 0) + (ends[1] === "dome" ? 1 : 0);
  if (domes === 2) {
    const c0 = [geo.O[0] + s0 * geo.SA[0], geo.O[1] + s0 * geo.SA[1]];
    const c1 = [geo.O[0] + s1 * geo.SA[0], geo.O[1] + s1 * geo.SA[1]];
    const rk = r0 * k;
    const dx = c1[0] - c0[0];
    const dy = c1[1] - c0[1];
    const l = Math.hypot(dx, dy);
    const count = Math.max(24, Math.ceil((Math.PI * rk) / 1.5));
    const out = [];
    if (l < 1e-6) {
      for (let j = 0; j < 2 * count; j++) {
        const t = (j / (2 * count)) * T3_TAU;
        out.push([c1[0] + rk * Math.cos(t), c1[1] + rk * Math.sin(t)]);
      }
      return out;
    }
    const beta = Math.atan2(dy, dx);
    for (let j = 0; j <= count; j++) {
      const t = beta - Math.PI / 2 + (Math.PI * j) / count;
      out.push([c1[0] + rk * Math.cos(t), c1[1] + rk * Math.sin(t)]);
    }
    for (let j = 0; j <= count; j++) {
      const t = beta + Math.PI / 2 + (Math.PI * j) / count;
      out.push([c0[0] + rk * Math.cos(t), c0[1] + rk * Math.sin(t)]);
    }
    return out;
  }
  if (domes === 1) {
    const pts = [];
    for (const [end, s, r] of [[0, s0, r0], [1, s1, r1]]) {
      t3ArcPoints(geo, s, r, 0, T3_TAU, k, pts);
      if (ends[end] !== "dome") continue;
      const sign = end ? 1 : -1;
      const c = [geo.O[0] + s * geo.SA[0], geo.O[1] + s * geo.SA[1]];
      const rk = r * k;
      const beta = Math.atan2(sign * geo.SA[1], sign * geo.SA[0]);
      const count = Math.max(24, Math.ceil((Math.PI * rk) / 1.5));
      for (let j = 0; j <= count; j++) {
        const t = beta - Math.PI / 2 + (Math.PI * j) / count;
        pts.push([c[0] + rk * Math.cos(t), c[1] + rk * Math.sin(t)]);
      }
    }
    return t3Hull(pts);
  }
  const view = geo.view;
  const out = [];
  let c;
  if (view.flat < 1e-9) c = run.na * view.a > 0 ? -2 : 2;
  else c = -(run.na * view.a) / (run.nr * view.flat);
  if (c <= -1 || c >= 1) {
    const side = c <= -1;
    const capFirst = -geo.aV > 0;
    const keepFirst = side ? !capFirst : capFirst;
    const s = keepFirst ? s0 : s1;
    const r = keepFirst ? r0 : r1;
    t3ArcPoints(geo, s, r, 0, T3_TAU, k, out, run.cutS !== null && Math.abs(run.cutS - s) < 1e-6);
    out.pop();
    return out;
  }
  const d = Math.acos(c);
  const lo = view.phi - d;
  const hi = view.phi + d;
  const cut0 = run.cutS !== null && Math.abs(run.cutS - s0) < 1e-6;
  const cut1 = run.cutS !== null && Math.abs(run.cutS - s1) < 1e-6;
  if (-geo.aV > 0) t3ArcPoints(geo, s0, r0, hi, lo + T3_TAU, k, out, cut0);
  else t3ArcPoints(geo, s0, r0, lo, hi, k, out, cut0);
  const tail = [];
  if (geo.aV > 0) t3ArcPoints(geo, s1, r1, hi, lo + T3_TAU, k, tail, cut1);
  else t3ArcPoints(geo, s1, r1, lo, hi, k, tail, cut1);
  const first = out[out.length - 1];
  const a = tail[0];
  const b = tail[tail.length - 1];
  if (Math.hypot(a[0] - first[0], a[1] - first[1]) > Math.hypot(b[0] - first[0], b[1] - first[1])) tail.reverse();
  for (const p of tail) out.push(p);
  return out;
}


function t3LatheOutline(run, geo, cam) {
  const k = cam.k;
  const view = geo.view;
  const lv = run.levels;
  const pts = [];
  const cut = (L) => (view.flat < 1e-9 ? Infinity : -(L.na * view.a) / (L.nr * view.flat));
  const inside = (L) => L.r <= 1e-9 || Math.abs(cut(L)) < 1;
  const sides = (L) => {
    if (L.r <= 1e-9) {
      const p = [geo.O[0] + L.s * geo.SA[0], geo.O[1] + L.s * geo.SA[1]];
      return [p, p];
    }
    const c = Math.max(-1, Math.min(1, cut(L)));
    const d = Math.acos(c);
    return [view.phi - d, view.phi + d].map((t) => {
      const cs = Math.cos(t);
      const sn = Math.sin(t);
      return [geo.O[0] + L.s * geo.SA[0] + L.r * (cs * geo.SU[0] + sn * geo.SV[0]), geo.O[1] + L.s * geo.SA[1] + L.r * (cs * geo.SU[1] + sn * geo.SV[1])];
    });
  };
  const span = (a, b) => {
    const pa = sides(a);
    const pb = sides(b);
    return Math.max(Math.hypot(pa[0][0] - pb[0][0], pa[0][1] - pb[0][1]), Math.hypot(pa[1][0] - pb[1][0], pa[1][1] - pb[1][1]));
  };
  const refine = (a, b, depth) => {
    if (depth >= 10 || span(a, b) < 1.2) return;
    const mid = t3LatheMid(a, b);
    refine(a, mid, depth + 1);
    pts.push(...sides(mid));
    refine(mid, b, depth + 1);
  };
  let previous = null;
  for (let i = 0; i < lv.length; i += 4) {
    const L = { s: lv[i], r: lv[i + 1], nr: lv[i + 2], na: lv[i + 3] };
    if (inside(L)) pts.push(...sides(L));
    if (previous) {
      const pin = inside(previous);
      const lin = inside(L);
      if (pin && lin) refine(previous, L, 0);
      else if (pin !== lin) {
        let a = pin ? previous : L;
        let b = pin ? L : previous;
        const start = a;
        for (let it = 0; it < 14; it++) {
          const mid = t3LatheMid(a.s < b.s ? a : b, a.s < b.s ? b : a);
          if (inside(mid)) a = mid;
          else b = mid;
        }
        pts.push(...sides(a));
        refine(start.s < a.s ? start : a, start.s < a.s ? a : start, 0);
      }
    }
    previous = L;
  }
  for (const i of [0, lv.length - 4]) if (lv[i + 1] > 1e-9) t3ArcPoints(geo, lv[i], lv[i + 1], 0, T3_TAU, k, pts);
  return t3Hull(pts);
}


function t3PrepareBall(run, part, P, unit) {
  const spec = part.spec;
  const k = P.scale * T3_ROOT;
  run.c = spec.c;
  run.r = spec.r;
  run.flats = spec.flats.map((flat) => {
    const n = t3Unit(flat.n);
    const rho = Math.sqrt(Math.max(0, spec.r * spec.r - flat.d * flat.d));
    const [u, v] = t3Basis(n);
    return { n, d: flat.d, rho, u, v };
  });
  run.limb = Math.max(32, Math.min(160, Math.ceil((T3_TAU * spec.r * k * unit) / 1.5)));
  run.rimCount = run.flats.map((flat) => Math.max(20, Math.min(120, Math.ceil((T3_TAU * flat.rho * k * unit) / 1.5))));
}


function t3PrepareTube(run, part, data) {
  const spec = part.spec;
  const source = data.routes[spec.route];
  let route = t3RouteCache.get(source);
  if (!route) {
    route = t3RouteOf(source.points);
    t3RouteCache.set(source, route);
  }
  const total = route.total;
  const r = source.r;
  const step = Math.max(0.05, Math.min(source.spacing, total / 4) * 0.5);
  const lead = 0.5;
  run.r = r;
  run.wide = Boolean(source.wide);
  run.hue = source.hue ?? null;
  const partOf = (start, end) => {
    const points = t3Cut(route, Math.max(0, start), Math.min(total, end));
    let walked = Math.max(0, start);
    const count = points.length;
    const P3 = new Float64Array(3 * count);
    const D3 = new Float64Array(3 * count);
    for (let i = 0; i < count; i++) {
      if (i > 0) walked += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1], points[i][2] - points[i - 1][2]);
      const a = t3PointAlong(route, Math.max(0, Math.min(total, walked - step)));
      const b = t3PointAlong(route, Math.max(0, Math.min(total, walked + step)));
      for (let c = 0; c < 3; c++) {
        P3[3 * i + c] = points[i][c];
        D3[3 * i + c] = b[c] - a[c];
      }
    }
    return { count, P3, D3 };
  };
  const openStart = spec.open0 && spec.from > 0;
  const openEnd = spec.open1 && spec.to < total;
  run.body = partOf(openStart ? spec.from - lead : spec.from, openEnd ? spec.to + lead : spec.to);
  run.stripe = openStart || openEnd ? partOf(openStart ? spec.from - 2 * lead : spec.from, openEnd ? spec.to + 2 * lead : spec.to) : run.body;
  const ends = [!spec.open0 && (spec.from <= 1e-6 || spec.gap0), !spec.open1 && (spec.to >= total - 1e-6 || spec.gap1)];
  run.capped = [ends[0] && (spec.gap0 || spec.caps[0]), ends[1] && (spec.gap1 || spec.caps[1])];
  const P3 = run.body.P3;
  const last = run.body.count - 1;
  const vec = (i, j) => t3Unit([P3[3 * i] - P3[3 * j], P3[3 * i + 1] - P3[3 * j + 1], P3[3 * i + 2] - P3[3 * j + 2]]);
  run.tips = [vec(1, 0), vec(last, last - 1)];
  run.rings = null;
  if (source.rings) {
    const { pitch = 3, twist = 0, cross = false, fade = [0.1, 0.55], phase = 0, steps = 16 } = source.rings;
    const lo = openStart ? spec.from - 2 * lead : spec.from;
    const hi = openEnd ? spec.to + 2 * lead : spec.to;
    const margin = twist ? 0 : Math.min(pitch * 0.35, (hi - lo) / 2);
    const from = Math.max(lo, !openStart ? lo + margin : lo);
    const to = Math.min(hi, !openEnd ? hi - margin : hi);
    const segments = [];
    if (to > from) {
      const hands = twist ? (cross ? [1, -1] : [1]) : [0];
      const reach = Math.abs(twist) * r;
      const first = Math.ceil((from - reach - phase) / pitch);
      const lastIndex = Math.floor((to + reach - phase) / pitch);
      const surface = (t, theta) => {
        const at = Math.max(0, Math.min(total, t));
        return { c: t3PointAlong(route, at), T: t3TangentAlong(route, at), theta };
      };
      for (let index = first; index <= lastIndex; index++) {
        const station = phase + index * pitch;
        for (const hand of hands) {
          const samples = [];
          for (let k = 0; k <= steps; k++) {
            const theta = (k / steps) * Math.PI;
            const t = station + hand * twist * r * (k / steps - 0.5);
            samples.push({ t, theta });
          }
          for (let k = 0; k < steps; k++) {
            let a = samples[k];
            let b = samples[k + 1];
            if ((a.t < from && b.t < from) || (a.t > to && b.t > to)) continue;
            const clipTo = (x, y, edge) => ({ t: edge, theta: x.theta + ((y.theta - x.theta) * (edge - x.t)) / (y.t - x.t || 1e-9) });
            if (a.t < from) a = clipTo(a, b, from);
            if (b.t < from) b = clipTo(b, a, from);
            if (a.t > to) a = clipTo(a, b, to);
            if (b.t > to) b = clipTo(b, a, to);
            segments.push([surface(a.t, a.theta), surface(b.t, b.theta)]);
          }
        }
      }
    }
    run.rings = { segments, fade, tone: source.rings.tone ?? "lo" };
  }
}


function t3Order(layer, frames, cams, previous, stats, scene) {
  const parts = layer.parts;
  const count = parts.length;
  const local = layer.local;
  const rank = layer._rank ?? (layer._rank = new Int32Array(count));
  if (previous) for (let at = 0; at < count; at++) rank[local.get(previous[at])] = at;
  else for (let at = 0; at < count; at++) rank[local.get(layer.rest[at])] = at;
  let groupEdges = 0;
  if (layer.groupPairs) for (const gp of layer.groupPairs) groupEdges += gp.a.length * gp.b.length;
  const maxEdges = layer.planar.length / 5 + (layer.framed ? layer.framed.length / 6 : 0) + groupEdges + layer.dynamic.length / 2 + (layer.free ? layer.free.length * count : 0) + 1;
  const head = layer._head ?? (layer._head = new Int32Array(count));
  const next = layer._next && layer._next.length >= maxEdges ? layer._next : (layer._next = new Int32Array(maxEdges));
  const to = layer._to && layer._to.length >= maxEdges ? layer._to : (layer._to = new Int32Array(maxEdges));
  const live = layer._live && layer._live.length >= maxEdges ? layer._live : (layer._live = new Uint8Array(maxEdges));
  const indeg = layer._indeg ?? (layer._indeg = new Int32Array(count));
  head.fill(-1);
  indeg.fill(0);
  let edges = 0;
  const addEdge = (back, front) => {
    to[edges] = front;
    next[edges] = head[back];
    live[edges] = 1;
    head[back] = edges;
    indeg[front]++;
    edges++;
  };
  const runs = scene ? scene.runs : null;
  const groupOf = (global) => (runs ? runs[global].group : -1);
  const planar = layer.planar;
  for (let p = 0; p < planar.length; p += 5) {
    const i = planar[p];
    const j = planar[p + 1];
    const fi = frames[i];
    const fj = frames[j];
    if (!t3Overlap(fi.box, fj.box, -0.05)) continue;
    const g = groupOf(i);
    const V = g >= 0 ? cams[g].V : cams.world.V;
    const s = planar[p + 2] * V[0] + planar[p + 3] * V[1] + planar[p + 4] * V[2];
    if (s < 1e-7 && s > -1e-7) continue;
    const li = local.get(i);
    const lj = local.get(j);
    if (s > 0) addEdge(li, lj);
    else addEdge(lj, li);
  }
  const framed = layer.framed;
  if (framed)
    for (let p = 0; p < framed.length; p += 6) {
      const i = framed[p];
      const j = framed[p + 1];
      if (!t3Overlap(frames[i].box, frames[j].box, -0.05)) continue;
      const g = framed[p + 2];
      const V = g >= 0 ? cams[g].V : cams.world.V;
      const s = framed[p + 3] * V[0] + framed[p + 4] * V[1] + framed[p + 5] * V[2];
      if (s < 1e-7 && s > -1e-7) continue;
      const li = local.get(i);
      const lj = local.get(j);
      if (s > 0) addEdge(li, lj);
      else addEdge(lj, li);
    }
  if (layer.groupPairs)
    for (const gp of layer.groupPairs) {
      const union = (list, box) => {
        box[0] = Infinity;
        box[1] = Infinity;
        box[2] = -Infinity;
        box[3] = -Infinity;
        for (let q = 0; q < list.length; q++) {
          const b = frames[list[q]].box;
          if (b[0] < box[0]) box[0] = b[0];
          if (b[1] < box[1]) box[1] = b[1];
          if (b[2] > box[2]) box[2] = b[2];
          if (b[3] > box[3]) box[3] = b[3];
        }
      };
      union(gp.a, gp.boxA);
      union(gp.b, gp.boxB);
      if (!t3Overlap(gp.boxA, gp.boxB, -0.05)) continue;
      const V = gp.frame >= 0 ? cams[gp.frame].V : cams.world.V;
      const s = gp.n[0] * V[0] + gp.n[1] * V[1] + gp.n[2] * V[2];
      if (s < 1e-7 && s > -1e-7) continue;
      for (let x = 0; x < gp.a.length; x++) {
        const i = gp.a[x];
        const bi = frames[i].box;
        if (!t3Overlap(bi, gp.boxB, -0.05)) continue;
        for (let y = 0; y < gp.b.length; y++) {
          const j = gp.b[y];
          if (!t3Overlap(bi, frames[j].box, -0.05)) continue;
          if (s > 0) addEdge(local.get(i), local.get(j));
          else addEdge(local.get(j), local.get(i));
        }
      }
    }
  const dynamic = layer.dynamic;
  let unseparated = 0;
  let solved = 0;
  const rel = layer.rel ?? (layer.rel = new Map());
  const cross = (i, j) => {
    const ri = runs[i];
    const rj = runs[j];
    const ci = ri.group >= 0 ? cams[ri.group] : cams.world;
    const cj = rj.group >= 0 ? cams[rj.group] : cams.world;
    const A = ci.R;
    const B = cj.R;
    const dx = cj.t[0] - ci.t[0];
    const dy = cj.t[1] - ci.t[1];
    const dz = cj.t[2] - ci.t[2];
    const key = i * 65536 + j;
    let memo = rel.get(key);
    if (!memo) {
      memo = { pose: new Float64Array(12), n: [0, 0, 0], margin: -Infinity, fresh: false, vi: -1, vj: -1 };
      rel.set(key, memo);
    }
    const pose = memo.pose;
    const vi = fixed ? ri.version ?? 0 : 0;
    const vj = fixed ? rj.version ?? 0 : 0;
    let same = memo.fresh && memo.vi === vi && memo.vj === vj;
    memo.vi = vi;
    memo.vj = vj;
    let at = 0;
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 3; r++) {
        const v = A[c] * B[r] + A[3 + c] * B[3 + r] + A[6 + c] * B[6 + r];
        if (same && Math.abs(pose[at] - v) > 1e-12) same = false;
        pose[at++] = v;
      }
    for (let c = 0; c < 3; c++) {
      const v = A[c] * dx + A[3 + c] * dy + A[6 + c] * dz;
      if (same && Math.abs(pose[at] - v) > 1e-9) same = false;
      pose[at++] = v;
    }
    let nx;
    let ny;
    let nz;
    if (same) {
      const n = memo.n;
      nx = A[0] * n[0] + A[1] * n[1] + A[2] * n[2];
      ny = A[3] * n[0] + A[4] * n[1] + A[5] * n[2];
      nz = A[6] * n[0] + A[7] * n[1] + A[8] * n[2];
    } else {
      const n = memo.n;
      const warm = memo.fresh ? [A[0] * n[0] + A[1] * n[1] + A[2] * n[2], A[3] * n[0] + A[4] * n[1] + A[5] * n[2], A[6] * n[0] + A[7] * n[1] + A[8] * n[2]] : null;
      const hints = [...ri.axes.map((axis) => [axis, ci]), ...rj.axes.map((axis) => [axis, cj]), [[0, 0, 1], cams.world]];
      hints.centroids = [ri.centroid, rj.centroid];
      const hit = t3Gjk(ri.cloud, ci, rj.cloud, cj, warm, 8, hints);
      solved++;
      nx = hit.n[0];
      ny = hit.n[1];
      nz = hit.n[2];
      n[0] = A[0] * nx + A[3] * ny + A[6] * nz;
      n[1] = A[1] * nx + A[4] * ny + A[7] * nz;
      n[2] = A[2] * nx + A[5] * ny + A[8] * nz;
      memo.margin = hit.margin;
      memo.fresh = true;
    }
    if (memo.margin < -0.08) {
      unseparated++;
      if (globalThis.__t3unsep) globalThis.__t3unsep.push([ri.part?.name ?? ri.name ?? i, rj.part?.name ?? rj.name ?? j, memo.margin]);
    }
    const V = cams.world.V;
    return nx * V[0] + ny * V[1] + nz * V[2];
  };
  for (let p = 0; p < dynamic.length; p += 2) {
    const i = dynamic[p];
    const j = dynamic[p + 1];
    if (!t3Overlap(frames[i].box, frames[j].box, -0.05)) continue;
    const s = cross(i, j);
    if (s < 1e-7 && s > -1e-7) continue;
    const li = local.get(i);
    const lj = local.get(j);
    if (s > 0) addEdge(li, lj);
    else addEdge(lj, li);
  }
  const loose = layer.free;
  if (loose && loose.length) {
    const isLoose = layer.looseAt;
    for (let a = 0; a < loose.length; a++) {
      const i = loose[a];
      const gi = runs[i].group;
      const bi = frames[i].box;
      for (let b = 0; b < count; b++) {
        const j = parts[b];
        if (j === i || runs[j].group === gi) continue;
        if (isLoose[b] && j < i) continue;
        if (!t3Overlap(bi, frames[j].box, -0.05)) continue;
        const s = cross(i, j);
        if (s < 1e-7 && s > -1e-7) continue;
        const li = local.get(i);
        if (s > 0) addEdge(li, b);
        else addEdge(b, li);
      }
    }
  }
  const heap = layer._heap ?? (layer._heap = new Int32Array(count));
  const done = layer._done ?? (layer._done = new Uint8Array(count));
  done.fill(0);
  let size = 0;
  const less = (a, b) => rank[a] < rank[b];
  const push = (v) => {
    let i = size++;
    heap[i] = v;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(heap[i], heap[p])) break;
      const tmp = heap[i];
      heap[i] = heap[p];
      heap[p] = tmp;
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    heap[0] = heap[--size];
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let s = i;
      if (l < size && less(heap[l], heap[s])) s = l;
      if (r < size && less(heap[r], heap[s])) s = r;
      if (s === i) break;
      const tmp = heap[i];
      heap[i] = heap[s];
      heap[s] = tmp;
      i = s;
    }
    return top;
  };
  for (let v = 0; v < count; v++) if (indeg[v] === 0) push(v);
  const out = new Int32Array(count);
  let placed = 0;
  let forced = 0;
  let refined = 0;
  let tested = false;
  const mark = layer._mark && layer._mark.length >= count ? layer._mark : (layer._mark = new Uint8Array(count));
  const via = layer._via && layer._via.length >= count ? layer._via : (layer._via = new Int32Array(count));
  const iter = layer._iter && layer._iter.length >= count ? layer._iter : (layer._iter = new Int32Array(count));
  const stack = layer._stack && layer._stack.length >= count ? layer._stack : (layer._stack = new Int32Array(count));
  const checked = layer._checked && layer._checked.length >= maxEdges ? layer._checked : (layer._checked = new Uint8Array(maxEdges));
  checked.fill(0, 0, edges);
  const breakCycle = () => {
    mark.fill(0, 0, count);
    for (let root = 0; root < count; root++) {
      if (done[root] || mark[root]) continue;
      let top = 0;
      stack[top++] = root;
      mark[root] = 1;
      iter[root] = head[root];
      while (top) {
        const v = stack[top - 1];
        let e = iter[v];
        while (e >= 0 && (!live[e] || done[to[e]] || mark[to[e]] === 2)) e = next[e];
        if (e < 0) {
          mark[v] = 2;
          top--;
          continue;
        }
        iter[v] = next[e];
        const w = to[e];
        if (mark[w] === 1) {
          let dropped = false;
          let x = v;
          let edge = e;
          for (;;) {
            if (!checked[edge]) {
              checked[edge] = 1;
              const a = x;
              const b = to[edge];
              if (t3Disjoint(frames[parts[a]], frames[parts[b]], 0.1)) {
                live[edge] = 0;
                indeg[b]--;
                refined++;
                dropped = true;
                if (indeg[b] === 0) push(b);
              }
            }
            if (x === w) break;
            edge = via[x];
            let from = -1;
            for (let s = 0; s < top; s++) if (stack[s] === x) from = s > 0 ? stack[s - 1] : -1;
            if (from < 0) break;
            x = from;
          }
          return dropped ? 1 : 0;
        }
        via[w] = e;
        mark[w] = 1;
        iter[w] = head[w];
        stack[top++] = w;
      }
    }
    return -1;
  };
  while (placed < count) {
    if (size === 0) {
      let broken = 0;
      for (let tries = 0; tries < 64 && size === 0; tries++) {
        const result = breakCycle();
        if (result <= 0) break;
        broken++;
      }
      if (size) continue;
      void broken;
      void tested;
      let pick = -1;
      for (let v = 0; v < count; v++) if (!done[v] && (pick < 0 || indeg[v] < indeg[pick] || (indeg[v] === indeg[pick] && rank[v] < rank[pick]))) pick = v;
      forced++;
      if (globalThis.__t3forced) globalThis.__t3forced.push(parts[pick]);
      indeg[pick] = 0;
      push(pick);
    }
    const v = pop();
    if (done[v]) continue;
    done[v] = 1;
    out[placed++] = parts[v];
    for (let e = head[v]; e >= 0; e = next[e]) {
      if (!live[e]) continue;
      const w = to[e];
      if (done[w]) continue;
      if (--indeg[w] === 0) push(w);
    }
  }
  if (stats) {
    stats.edges = (stats.edges ?? 0) + edges;
    stats.forced = (stats.forced ?? 0) + forced;
    stats.refined = (stats.refined ?? 0) + refined;
    stats.unseparated = (stats.unseparated ?? 0) + unseparated;
    stats.solved = (stats.solved ?? 0) + solved;
  }
  return out;
}


function t3Cover(controller, names, { polygons = 6, edges = 10, pad = 0.3, layers = null } = {}) {
  const uCoverEdge = new Float32Array(polygons * edges * 3);
  const uCoverCount = new Float32Array(polygons);
  const scene = controller.scene();
  const frames = controller.frames();
  const sets = Array.isArray(names) ? (names.length && Array.isArray(names[0]) ? names : [names]) : [[names]];
  const candidates = [];
  const taken = new Set();
  for (const list of sets) {
    const targets = scene.runs.filter((run) => list.includes(run.name));
    if (!targets.length) continue;
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const run of targets) {
      const b = frames[run.index].box;
      box[0] = Math.min(box[0], b[0]);
      box[1] = Math.min(box[1], b[1]);
      box[2] = Math.max(box[2], b[2]);
      box[3] = Math.max(box[3], b[3]);
    }
    const home = targets[0].layer;
    scene.layers.forEach((layer, index) => {
      const order = controller.orderIndex(layer.name);
      if (!order) return;
      let from = 0;
      if (index === home) {
        for (let at = 0; at < order.length; at++) if (targets.some((run) => run.index === order[at])) from = at + 1;
      } else if (!(layers && layers.includes(layer.name)) || index < home) return;
      for (let at = from; at < order.length; at++) {
        const run = scene.runs[order[at]];
        if (list.includes(run.name) || taken.has(run.index)) continue;
        const f = frames[run.index];
        const b = f.box;
        if (!(b[0] < box[2] + pad && box[0] < b[2] + pad && b[1] < box[3] + pad && box[1] < b[3] + pad)) continue;
        if (!targets.some((target) => !t3Disjoint(frames[target.index], f, -pad))) continue;
        taken.add(run.index);
        const share = (Math.min(b[2], box[2]) - Math.max(b[0], box[0])) * (Math.min(b[3], box[3]) - Math.max(b[1], box[1]));
        candidates.push({ run, f, share });
      }
    });
  }
  candidates.sort((a, b) => b.share - a.share);
  const parts = [];
  let slot = 0;
  for (const { run, f } of candidates) {
    if (slot >= polygons) break;
    const points = [];
    if (f.quadN) for (const [buf, count] of f.quadList) for (let i = 0; i < count; i++) points.push([buf[2 * i], buf[2 * i + 1]]);
    else for (let i = 0; i < f.hullN; i++) points.push([f.hull[2 * i], f.hull[2 * i + 1]]);
    const lines = t3Enclose(points, edges);
    if (!lines.length) continue;
    lines.forEach((line, e) => {
      const at = (slot * edges + e) * 3;
      uCoverEdge[at] = line[0];
      uCoverEdge[at + 1] = line[1];
      uCoverEdge[at + 2] = line[2] - pad;
    });
    uCoverCount[slot] = lines.length;
    parts.push(run.name);
    slot++;
  }
  return { uCoverEdge, uCoverCount, dropped: Math.max(0, candidates.length - slot), parts };
}


function t3Css() {
  const rules = [];
  const ramp = "--tn-0:var(--anatomy-shade-0);--tn-1:var(--anatomy-shade-1);--tn-2:var(--anatomy-shade-2);--tn-3:var(--anatomy-shade-3);--tn-4:var(--anatomy-top)";
  rules.push(`.iso-live{${ramp}}`);
  rules.push(`.iso-live [data-mat]{${ramp}}`);
  rules.push(".iso-live [data-lit]{--tn-0:var(--anatomy-lit-shade);--tn-1:var(--anatomy-lit-shade);--tn-2:var(--anatomy-lit-shade);--tn-3:var(--anatomy-lit-shade);--tn-4:var(--anatomy-lit-top)}");
  const colour = "color-mix(in srgb,var(--ta) calc(100% - var(--f,0) * 100%),var(--tb))";
  rules.push(`.iso-tn{stroke-width:.4;stroke-linejoin:round;--ta:var(--tn-0);--tb:var(--tn-1);fill:${colour};stroke:${colour}}`);
  for (let i = 1; i < 4; i++) rules.push(`.iso-tn[data-b="${i}"]{--ta:var(--tn-${i});--tb:var(--tn-${i + 1})}`);
  rules.push(t3MaterialCss());
  for (const hue of ["red", "green", "blue"]) rules.push(`.tb[data-hue="${hue}"]{--tb-ink:var(--anatomy-${hue})}`);
  rules.push(".tb[data-hue] .tb-body{fill:color-mix(in srgb,var(--tb-ink) 54%,var(--anatomy-shade-2))}");
  rules.push(".tb[data-hue] .tb-shine{fill:color-mix(in srgb,var(--tb-ink) 16%,var(--anatomy-top))}");
  rules.push(".tb[data-hue] .tb-shade{fill:color-mix(in srgb,var(--tb-ink) 30%,var(--anatomy-hi))}");
  rules.push(".tb[data-hue] .tb-edge{stroke:color-mix(in srgb,var(--tb-ink) 38%,var(--anatomy-hi))}");
  rules.push(".tb[data-hue][data-mat] .tb-body{fill:color-mix(in srgb,var(--tb-ink) 62%,var(--mat-body))}");
  rules.push(".tb[data-hue][data-mat] .tb-shine{fill:color-mix(in srgb,var(--tb-ink) 22%,var(--mat-shine))}");
  rules.push(".tb[data-hue][data-mat] .tb-shade{fill:color-mix(in srgb,var(--tb-ink) 46%,var(--mat-shade))}");
  rules.push(".tb[data-hue][data-mat] .tb-edge{stroke:color-mix(in srgb,var(--tb-ink) 30%,var(--mat-edge))}");
  rules.push(".iso-turn{position:relative}");
  rules.push(".iso-turn>.iso-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}");
  return rules.join("\n");
}
  return { t3Path, t3FreeRot, t3Cloud, t3EmitPlanes, t3PathOf, t3HullOut, t3SupportHull, t3RoundOutline, t3LatheOutline, t3PrepareBall, t3PrepareTube, t3Order, t3Cover, t3Css };
}
