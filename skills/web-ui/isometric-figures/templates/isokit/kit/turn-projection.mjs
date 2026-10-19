// Shared TURN implementation from turn-fixed.mjs. Each factory owns one runtime instance; no state crosses backend entrypoints.
export function createTurnProjection(dependencies, fixed) {
  const { T3_EYE, T3_LB, T3_LEVELS, T3_MATERIALS, T3_MAT_KEYS, T3_MAT_TUBE, T3_Q, T3_RAD, T3_ROOT, T3_SHINE, T3_SOFT, T3_TAU, t3Apart, t3Arena, t3Buf, t3Grow, t3Grown, t3Hull, t3LatheSeam, t3Mul, t3PointAlong, t3State, t3Step, t3Support, t3Tables, t3Unit } = dependencies;


function t3Num(v) {
  if (t3State.exact) return String(Math.round(v * 1e6) / 1e6);
  let t = Math.round(v * 100);
  if (t === 0) return "0";
  let sign = "";
  if (t < 0) {
    sign = "-";
    t = -t;
  }
  const whole = Math.floor(t / 100);
  const part = t - whole * 100;
  if (part === 0) return sign + whole;
  if (part < 10) return sign + whole + ".0" + part;
  return sign + whole + "." + (part % 10 === 0 ? part / 10 : part);
}


function t3Token(get, count, closed) {
  const f = t3Arena.f;
  const at = f.arenaN;
  let arena = f.arena;
  if (!arena || arena.length < 2 * (at + count)) {
    const next = new Float64Array(Math.max(512, 2 * (at + count) * 2));
    if (arena) next.set(arena.subarray(0, 2 * at));
    arena = f.arena = next;
  }
  const unit = t3State.exact ? 1e6 : 100;
  for (let i = 0; i < count; i++) {
    arena[2 * (at + i)] = Math.round(get(2 * i) * unit) / unit;
    arena[2 * (at + i) + 1] = Math.round(get(2 * i + 1) * unit) / unit;
  }
  f.arenaN = at + count;
  return "\u0001" + String.fromCharCode(at & 0xffff, at >>> 16, count, closed ? 1 : 0);
}


function t3Level(score, bands) {
  let u = 0;
  for (let i = 0; i < bands.length; i++) u += t3Step(bands[i] - T3_SOFT, bands[i] + T3_SOFT, score);
  return Math.round(u * T3_Q);
}


function t3Rot(axis, degrees) {
  const [x, y, z] = t3Unit(axis);
  const c = Math.cos(degrees * T3_RAD);
  const s = Math.sin(degrees * T3_RAD);
  const C = 1 - c;
  return new Float64Array([c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]);
}


function t3Camera(P, pose) {
  const a = (P.azimuth ?? 45) * T3_RAD;
  const e = (P.elevation ?? 30) * T3_RAD;
  const k = P.scale * T3_ROOT;
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const se = Math.sin(e);
  const ce = Math.cos(e);
  const cam = { m: new Float64Array(6), ox: 0, oy: 0, V: [0, 0, 0], L: [0, 0, 0], k, turn: 0, R: T3_EYE, t: [0, 0, 0], lx: 0, ly: 1, sa, ca, se, ce, origin: P.origin };
  const lw = Math.hypot(sa, ca, 1.2);
  if (pose && pose.R && !(pose.turn !== undefined && pose.root)) {
    const R = pose.R;
    const t = pose.t ?? [0, 0, 0];
    const r0 = [sa * k, -ca * k, 0];
    const r1 = [ca * se * k, sa * se * k, -ce * k];
    for (let c = 0; c < 3; c++) {
      cam.m[c] = r0[0] * R[c] + r0[1] * R[3 + c] + r0[2] * R[6 + c];
      cam.m[3 + c] = r1[0] * R[c] + r1[1] * R[3 + c] + r1[2] * R[6 + c];
    }
    cam.ox = P.origin[0] + r0[0] * t[0] + r0[1] * t[1] + r0[2] * t[2];
    cam.oy = P.origin[1] + r1[0] * t[0] + r1[1] * t[1] + r1[2] * t[2];
    const V = [ca * ce, sa * ce, se];
    const L = [-sa / lw, ca / lw, 1.2 / lw];
    for (let c = 0; c < 3; c++) {
      cam.V[c] = R[c] * V[0] + R[3 + c] * V[1] + R[6 + c] * V[2];
      cam.L[c] = R[c] * L[0] + R[3 + c] * L[1] + R[6 + c] * L[2];
    }
    cam.R = R;
    cam.t = t;
  } else {
    const turn = pose ? pose.turn ?? 0 : 0;
    const pivot = pose && pose.pivot ? pose.pivot : [0, 0];
    const b = a - turn * T3_RAD;
    const sb = Math.sin(b);
    const cb = Math.cos(b);
    cam.m[0] = sb * k;
    cam.m[1] = -cb * k;
    cam.m[2] = 0;
    cam.m[3] = cb * se * k;
    cam.m[4] = sb * se * k;
    cam.m[5] = -ce * k;
    cam.ox = P.origin[0] + (pivot[0] * sa - pivot[1] * ca) * k;
    cam.oy = P.origin[1] + (pivot[0] * ca + pivot[1] * sa) * se * k;
    cam.V = [cb * ce, sb * ce, se];
    cam.L = [-sb / lw, cb / lw, 1.2 / lw];
    cam.turn = turn;
    const c = Math.cos(turn * T3_RAD);
    const s = Math.sin(turn * T3_RAD);
    cam.R = new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]);
    cam.t = [pivot[0], pivot[1], 0];
  }
  const lh = Math.hypot(cam.L[0], cam.L[1]) || 1;
  cam.lx = cam.L[0] / lh;
  cam.ly = cam.L[1] / lh;
  return cam;
}


function t3Scratch(name, size) {
  if (t3Buf[name].length < size) t3Buf[name] = new Float64Array(size * 2);
  return t3Buf[name];
}


function t3SetHull(f, buf, count) {
  const hull = t3Grow(f, "hull", 2 * count, Float64Array);
  for (let i = 0; i < 2 * count; i++) hull[i] = buf[i];
  f.hullN = count;
}


function t3Faded(f, run, prefix, lines, count) {
  if (!f.fade) f.fade = {};
  const detail = t3State.detail;
  if (detail < 1) for (let i = 0; i < count; i++) lines.alpha[i] *= detail;
  if (detail < 0.01) count = 0;
  f.fade[prefix] = { key: lines.key.slice(0, count), alpha: lines.alpha.slice(0, count) };
  const slots = run.slots[prefix === "v" ? "bevel" : "ribs"] ?? 6;
  const levels = run._levels ?? (run._levels = new Array(T3_LEVELS + 1));
  for (let l = 0; l <= T3_LEVELS; l++) levels[l] = "";
  for (let i = 0; i < count; i++) {
    const alpha = lines.alpha[i];
    const level = Math.min(T3_LEVELS, Math.round(alpha * T3_LEVELS));
    if (level <= 0) continue;
    levels[level] += lines.d[i];
  }
  const present = [];
  for (let l = T3_LEVELS; l >= 1; l--) if (levels[l]) present.push([l, levels[l]]);
  while (present.length > slots) {
    let best = 1;
    let gap = Infinity;
    for (let i = 1; i < present.length; i++) {
      const g = present[i - 1][0] - present[i][0];
      if (g < gap) {
        gap = g;
        best = i;
      }
    }
    const [a, da] = present[best - 1];
    const [b, db] = present[best];
    present.splice(best - 1, 2, [(a + b) / 2, da + db]);
  }
  for (let j = 0; j < slots; j++) {
    const role = run.role[`${prefix}${j}`];
    if (role === undefined) continue;
    if (j < present.length) {
      f.d[role] = present[j][1];
      f.o[role] = present[j][0] / T3_LEVELS;
    } else {
      f.d[role] = "";
      f.o[role] = 0;
    }
  }
  return present.length;
}


function t3EmitDots(run, cam, f, sx = 0, sy = 0) {
  const m = cam.m;
  const V = cam.V;
  for (let j = 0; j < run.dots.length; j++) {
    const dot = run.dots[j];
    const role = run.role[`c${j}`];
    const p = dot.p;
    f.cx[role] = cam.ox - sx + m[0] * p[0] + m[1] * p[1] + m[2] * p[2];
    f.cy[role] = cam.oy - sy + m[3] * p[0] + m[4] * p[1] + m[5] * p[2];
    const alpha = (dot.n ? t3Step(dot.fade[0], dot.fade[1], dot.n[0] * V[0] + dot.n[1] * V[1] + dot.n[2] * V[2]) : 1) * t3State.detail;
    f.o[role] = alpha < 0.005 ? 0 : Math.round(alpha * 100) / 100;
  }
}


function t3Arcs(nr, na, view, light) {
  const cuts = [];
  if (Math.abs(nr) > 1e-9) {
    const visibleCut = -(na * view.a) / (nr * view.flat);
    if (visibleCut > -1 && visibleCut < 1) {
      const d = Math.acos(visibleCut);
      cuts.push(view.phi - d, view.phi + d);
    }
    for (let b = 0; b < T3_LB.length; b++) {
      const c = (T3_LB[b] - na * light.a) / (nr * light.flat);
      if (c > -1 && c < 1) {
        const d = Math.acos(c);
        cuts.push(light.phi - d, light.phi + d);
      }
    }
  }
  for (let i = 0; i < cuts.length; i++) {
    const w = ((cuts[i] % T3_TAU) + T3_TAU) % T3_TAU;
    cuts[i] = Math.round(w * 1e9) / 1e9;
  }
  cuts.sort((a, b) => a - b);
  const sorted = [];
  for (let i = 0; i < cuts.length; i++) if (!sorted.length || cuts[i] !== sorted[sorted.length - 1]) sorted.push(cuts[i]);
  const label = (angle) => {
    const facing = nr * view.flat * Math.cos(angle - view.phi) + na * view.a;
    if (facing <= 1e-9) return -1;
    const score = nr * light.flat * Math.cos(angle - light.phi) + na * light.a;
    let tone = 0;
    while (tone < T3_LB.length && score >= T3_LB[tone]) tone++;
    return tone;
  };
  if (!sorted.length) {
    const tone = label(0);
    return tone < 0 ? [] : [{ tone, from: 0, to: T3_TAU, full: true }];
  }
  const merged = [];
  for (let index = 0; index < sorted.length; index++) {
    const from = sorted[index];
    const to = index + 1 < sorted.length ? sorted[index + 1] : sorted[0] + T3_TAU;
    const tone = label((from + to) / 2);
    const last = merged[merged.length - 1];
    if (last && last.tone === tone && Math.abs(last.to - from) < 1e-9) last.to = to;
    else merged.push({ tone, from, to });
  }
  if (merged.length > 1 && merged[0].tone === merged[merged.length - 1].tone && Math.abs(merged[merged.length - 1].to - T3_TAU - merged[0].from) < 1e-9) {
    const last = merged.pop();
    merged[0].from = last.from - T3_TAU;
  }
  const out = [];
  for (const arc of merged) if (arc.tone >= 0) out.push(arc);
  return out;
}


function t3Basis(w) {
  const helper = Math.abs(w[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = t3Unit([helper[1] * w[2] - helper[2] * w[1], helper[2] * w[0] - helper[0] * w[2], helper[0] * w[1] - helper[1] * w[0]]);
  return [u, [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]]];
}

function t3Table(count) {
  let table = t3Tables.get(count);
  if (!table) {
    table = new Float64Array(2 * count);
    for (let j = 0; j < count; j++) {
      table[2 * j] = Math.cos((j / count) * T3_TAU);
      table[2 * j + 1] = Math.sin((j / count) * T3_TAU);
    }
    t3Tables.set(count, table);
  }
  return table;
}


function t3Thin(points, most) {
  if (points.length <= most) return points;
  const n = points.length;
  const picks = [];
  for (let i = 0; i < most; i++) picks.push(Math.floor((i * n) / most));
  const thin = picks.map((i) => points[i]);
  let err = 0;
  for (let j = 0; j < most; j++) {
    const a = thin[j];
    const b = thin[(j + 1) % most];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const end = j + 1 < most ? picks[j + 1] : picks[0] + n;
    for (let i = picks[j] + 1; i < end; i++) {
      const p = points[i % n];
      const out = ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / l;
      if (Math.abs(out) > err) err = Math.abs(out);
    }
  }
  return t3Grown(thin, err);
}


function t3ArcPoints(geo, s, r, from, to, k, out, cut = false) {
  const count = Math.max(2, Math.ceil((Math.abs(to - from) * 48) / T3_TAU), Math.ceil((Math.abs(to - from) * Math.max(r, 1e-6) * k) / 1.5));
  for (let j = 0; j <= count; j++) {
    const t = from + ((to - from) * j) / count;
    const c = Math.cos(t);
    const n = Math.sin(t);
    const p = [geo.O[0] + s * geo.SA[0] + r * (c * geo.SU[0] + n * geo.SV[0]), geo.O[1] + s * geo.SA[1] + r * (c * geo.SU[1] + n * geo.SV[1])];
    if (cut) p.cut = true;
    out.push(p);
  }
}


function t3PrepareRound(run, part, P, unit) {
  const spec = part.spec;
  const k = P.scale * T3_ROOT;
  run.F = spec.F;
  run.s0 = spec.s0;
  run.s1 = spec.s1;
  run.r0 = spec.r0;
  run.r1 = spec.r1;
  run.ends = spec.ends;
  const g = (spec.r1 - spec.r0) / (spec.s1 - spec.s0 || 1);
  const norm = Math.hypot(1, g);
  run.nr = 1 / norm;
  run.na = -g / norm;
  run.g = g;
  const rmax = Math.max(spec.r0, spec.r1);
  const around = T3_TAU * rmax * k * unit;
  run.fine = Math.max(around < 30 ? 16 : 24, Math.min(96, Math.ceil(around / 2.2)));
  run.dirs = Math.max(around < 30 ? 16 : 32, Math.min(256, Math.ceil(around / 1.5)));
  run.capCount = Math.max(around < 30 ? 16 : 24, Math.min(160, Math.ceil(around / 1.5)));
  run.domeCount = Math.max(around < 30 ? 12 : 16, Math.min(48, Math.round(run.fine * 0.75)));
  const comps = [];
  for (const [end, s, r] of [[0, spec.s0, spec.r0], [1, spec.s1, spec.r1]]) comps.push(spec.ends[end] === "dome" ? 1 : 0, s, r);
  run.components = comps;
  const details = part.details ?? {};
  run.seams = (details.seams ?? []).map((s) => ({ s, r: spec.r0 + g * (s - spec.s0), slope: g }));
  run.ribs = details.ribs ? { ...details.ribs, r0: details.ribs.r0 ?? spec.r0 + g * (details.ribs.s0 - spec.s0), r1: details.ribs.r1 ?? spec.r0 + g * (details.ribs.s1 - spec.s0) } : null;
  run.cutS = null;
  for (const cut of spec.cuts ?? []) {
    const along = cut.n[0] * spec.F.a[0] + cut.n[1] * spec.F.a[1] + cut.n[2] * spec.F.a[2];
    const sCut = (cut.d - (cut.n[0] * spec.F.o[0] + cut.n[1] * spec.F.o[1] + cut.n[2] * spec.F.o[2])) / along;
    if (Math.abs(sCut - spec.s0) < 1e-6 || Math.abs(sCut - spec.s1) < 1e-6) run.cutS = sCut;
  }
}


function t3PrepareLathe(run, part, P, unit) {
  const spec = part.spec;
  const k = P.scale * T3_ROOT;
  run.F = spec.F;
  run.levels = spec.levels;
  run.caps = spec.caps;
  let rmax = 0;
  for (let i = 0; i < spec.levels.length; i += 4) rmax = Math.max(rmax, spec.levels[i + 1]);
  run.fine = Math.max(24, Math.min(96, Math.ceil((T3_TAU * rmax * k * unit) / 2.2)));
  run.dirs = Math.max(32, Math.min(256, Math.ceil((T3_TAU * rmax * k * unit) / 1.5)));
  run.capCount = Math.max(24, Math.min(160, Math.ceil((T3_TAU * rmax * k * unit) / 1.5)));
  const comps = [];
  for (let i = 0; i < spec.levels.length; i += 4) comps.push(0, spec.levels[i], spec.levels[i + 1]);
  run.components = comps;
  const details = part.details ?? {};
  run.seams = (details.seams ?? []).map((seam) => (typeof seam === "number" ? t3LatheSeam(spec.levels, seam) : seam));
  run.ribs = details.ribs ?? null;
}


function t3TangentAlong(route, at) {
  const a = t3PointAlong(route, Math.max(0, at - 0.6));
  const b = t3PointAlong(route, Math.min(route.total, at + 0.6));
  return t3Unit([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
}


function t3Sides(part, cam, r) {
  const m = cam.m;
  const k = cam.k;
  const n = part.count;
  const out = { n, flat: new Float64Array(2 * n), left: new Float64Array(2 * n), right: new Float64Array(2 * n), shineA: new Float64Array(2 * n), shineB: new Float64Array(2 * n), shadeA: new Float64Array(2 * n), shadeB: new Float64Array(2 * n), frames: [] };
  const half = r * k;
  for (let i = 0; i < n; i++) {
    const x = part.P3[3 * i];
    const y = part.P3[3 * i + 1];
    const z = part.P3[3 * i + 2];
    const px = cam.ox + m[0] * x + m[1] * y + m[2] * z;
    const py = cam.oy + m[3] * x + m[4] * y + m[5] * z;
    const dx = m[0] * part.D3[3 * i] + m[1] * part.D3[3 * i + 1] + m[2] * part.D3[3 * i + 2];
    const dy = m[3] * part.D3[3 * i] + m[4] * part.D3[3 * i + 1] + m[5] * part.D3[3 * i + 2];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    out.flat[2 * i] = px;
    out.flat[2 * i + 1] = py;
    out.frames.push({ p: [px, py], nx, ny, half });
    out.left[2 * i] = px + nx * half;
    out.left[2 * i + 1] = py + ny * half;
    out.right[2 * i] = px - nx * half;
    out.right[2 * i + 1] = py - ny * half;
    const toward = nx * T3_SHINE[0] + ny * T3_SHINE[1];
    const shineAt = half * 0.44 * toward;
    const shineHalf = half * 0.24;
    out.shineA[2 * i] = px + nx * (shineAt + shineHalf);
    out.shineA[2 * i + 1] = py + ny * (shineAt + shineHalf);
    out.shineB[2 * i] = px + nx * (shineAt - shineHalf);
    out.shineB[2 * i + 1] = py + ny * (shineAt - shineHalf);
    const shadeAt = -half * 0.62 * toward;
    const shadeHalf = half * 0.2;
    out.shadeA[2 * i] = px + nx * (shadeAt + shadeHalf);
    out.shadeA[2 * i + 1] = py + ny * (shadeAt + shadeHalf);
    out.shadeB[2 * i] = px + nx * (shadeAt - shadeHalf);
    out.shadeB[2 * i + 1] = py + ny * (shadeAt - shadeHalf);
  }
  return out;
}


function t3TubeCap(cam, centre, tangent, radius, inward) {
  const V = cam.V;
  const m = cam.m;
  let n1 = [tangent[1] * V[2] - tangent[2] * V[1], tangent[2] * V[0] - tangent[0] * V[2], tangent[0] * V[1] - tangent[1] * V[0]];
  if (Math.hypot(n1[0], n1[1], n1[2]) < 1e-6) {
    const helper = Math.abs(tangent[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    n1 = [helper[1] * tangent[2] - helper[2] * tangent[1], helper[2] * tangent[0] - helper[0] * tangent[2], helper[0] * tangent[1] - helper[1] * tangent[0]];
  }
  n1 = t3Unit(n1);
  const n2 = t3Unit([tangent[1] * n1[2] - tangent[2] * n1[1], tangent[2] * n1[0] - tangent[0] * n1[2], tangent[0] * n1[1] - tangent[1] * n1[0]]);
  const steps = 28;
  const proj = (p) => [cam.ox + m[0] * p[0] + m[1] * p[1] + m[2] * p[2], cam.oy + m[3] * p[0] + m[4] * p[1] + m[5] * p[2]];
  const ring = new Array(steps);
  for (let index = 0; index < steps; index++) {
    const angle = (index / steps) * T3_TAU;
    const cs = radius * Math.cos(angle);
    const sn = radius * Math.sin(angle);
    ring[index] = proj([centre[0] + n1[0] * cs + n2[0] * sn, centre[1] + n1[1] * cs + n2[1] * sn, centre[2] + n1[2] * cs + n2[2] * sn]);
  }
  const C = proj(centre);
  const probe = proj([centre[0] + n2[0], centre[1] + n2[1], centre[2] + n2[2]]);
  const along = (probe[0] - C[0]) * inward[0] + (probe[1] - C[1]) * inward[1];
  const from = along > 0 ? steps / 2 : 0;
  const half = (start) => Array.from({ length: steps / 2 + 1 }, (_, index) => ring[(start + index) % steps]);
  return { ring, arc: half(from), inner: half((from + steps / 2) % steps) };
}


function t3Disjoint(fa, fb, pad) {
  const qa = fa.quadN ? fa.quads : null;
  const qb = fb.quadN ? fb.quads : null;
  if (!qa && !qb) return t3Apart(fa.hull, fa.hullN, fb.hull, fb.hullN, pad);
  const listA = qa ? fa.quadList : [[fa.hull, fa.hullN]];
  const listB = qb ? fb.quadList : [[fb.hull, fb.hullN]];
  for (const [A, an] of listA) for (const [B, bn] of listB) if (!t3Apart(A, an, B, bn, pad)) return false;
  return true;
}


function t3Gjk(cloudA, camA, cloudB, camB, warm, rounds = 8, hints = null) {
  let w = warm && (warm[0] || warm[1] || warm[2]) ? [warm[0], warm[1], warm[2]] : null;
  const a = [0, 0, 0];
  const b = [0, 0, 0];
  if (!w) {
    t3Support(cloudA, camA.R, camA.t, [1, 0, 0], a);
    t3Support(cloudB, camB.R, camB.t, [-1, 0, 0], b);
    w = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  }
  let margin = -Infinity;
  let best = w;
  const step = (limit) => {
    for (let it = 0; it < limit; it++) {
      const l = Math.hypot(w[0], w[1], w[2]);
      if (l < 1e-12) break;
      const n = [w[0] / l, w[1] / l, w[2] / l];
      const hiA = t3Support(cloudA, camA.R, camA.t, n, a);
      const loB = -t3Support(cloudB, camB.R, camB.t, [-n[0], -n[1], -n[2]], b);
      const value = loB - hiA;
      if (value > margin) {
        margin = value;
        best = n;
      }
      const s = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ds = [w[0] - s[0], w[1] - s[1], w[2] - s[2]];
      const dd = ds[0] * ds[0] + ds[1] * ds[1] + ds[2] * ds[2];
      if (dd < 1e-14) break;
      const tt = Math.max(0, Math.min(1, (w[0] * ds[0] + w[1] * ds[1] + w[2] * ds[2]) / dd));
      w = [w[0] - ds[0] * tt, w[1] - ds[1] * tt, w[2] - ds[2] * tt];
    }
  };
  step(rounds);
  if (margin < 0) step(24);
  if (margin < 0.05 && hints) {
    if (hints.centroids) {
      const [ca, cb] = hints.centroids;
      const wa = [camA.R[0] * ca[0] + camA.R[1] * ca[1] + camA.R[2] * ca[2] + camA.t[0], camA.R[3] * ca[0] + camA.R[4] * ca[1] + camA.R[5] * ca[2] + camA.t[1], camA.R[6] * ca[0] + camA.R[7] * ca[1] + camA.R[8] * ca[2] + camA.t[2]];
      const wb = [camB.R[0] * cb[0] + camB.R[1] * cb[1] + camB.R[2] * cb[2] + camB.t[0], camB.R[3] * cb[0] + camB.R[4] * cb[1] + camB.R[5] * cb[2] + camB.t[1], camB.R[6] * cb[0] + camB.R[7] * cb[1] + camB.R[8] * cb[2] + camB.t[2]];
      const n = t3Unit([wb[0] - wa[0], wb[1] - wa[1], wb[2] - wa[2]]);
      const hiA = t3Support(cloudA, camA.R, camA.t, n, a);
      const loB = -t3Support(cloudB, camB.R, camB.t, [-n[0], -n[1], -n[2]], b);
      if (loB - hiA > margin) {
        margin = loB - hiA;
        best = n;
      }
    }
    for (const [axis, cam] of hints) {
      const R = cam.R;
      const w0 = [R[0] * axis[0] + R[1] * axis[1] + R[2] * axis[2], R[3] * axis[0] + R[4] * axis[1] + R[5] * axis[2], R[6] * axis[0] + R[7] * axis[1] + R[8] * axis[2]];
      for (const sign of [1, -1]) {
        const n = [w0[0] * sign, w0[1] * sign, w0[2] * sign];
        const hiA = t3Support(cloudA, camA.R, camA.t, n, a);
        const loB = -t3Support(cloudB, camB.R, camB.t, [-n[0], -n[1], -n[2]], b);
        if (loB - hiA > margin) {
          margin = loB - hiA;
          best = n;
        }
      }
    }
  }
  const l = Math.hypot(best[0], best[1], best[2]) || 1;
  return { n: [best[0] / l, best[1] / l, best[2] / l], margin };
}


function t3Enclose(points, edges) {
  const hull = t3Hull(points);
  const n = hull.length;
  if (n < 3) return [];
  let area = 0;
  for (let i = 0; i < n; i++) area += hull[i][0] * hull[(i + 1) % n][1] - hull[(i + 1) % n][0] * hull[i][1];
  const sign = area >= 0 ? 1 : -1;
  let lines = [];
  for (let i = 0; i < n; i++) {
    const p = hull[i];
    const q = hull[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const l = Math.hypot(dx, dy);
    if (l < 1e-9) continue;
    const nx = (sign * dy) / l;
    const ny = (-sign * dx) / l;
    lines.push([nx, ny, -(nx * p[0] + ny * p[1])]);
  }
  const meet = (A, B) => {
    const det = A[0] * B[1] - A[1] * B[0];
    if (Math.abs(det) < 1e-12) return null;
    return [(-A[2] * B[1] + B[2] * A[1]) / det, (-A[0] * B[2] + B[0] * A[2]) / det];
  };
  while (lines.length > edges) {
    let best = -1;
    let cost = Infinity;
    const m = lines.length;
    for (let i = 0; i < m; i++) {
      const prev = lines[(i - 1 + m) % m];
      const self = lines[i];
      const next = lines[(i + 1) % m];
      const turn = prev[0] * next[1] - prev[1] * next[0];
      if (sign * turn <= 1e-9) continue;
      const apex = meet(prev, next);
      const a = meet(prev, self);
      const b = meet(self, next);
      if (!apex || !a || !b) continue;
      const added = Math.abs((a[0] - apex[0]) * (b[1] - apex[1]) - (a[1] - apex[1]) * (b[0] - apex[0])) / 2;
      if (added < cost) {
        cost = added;
        best = i;
      }
    }
    if (best < 0) break;
    lines.splice(best, 1);
  }
  return lines;
}


function t3PoseOf(scene, cams, name) {
  const index = scene.groups.findIndex((g) => g.name === name);
  const cam = index >= 0 && cams ? cams[index] : null;
  return { R: cam ? Array.from(cam.R) : Array.from(T3_EYE), t: cam ? [cam.t[0], cam.t[1], cam.t[2]] : [0, 0, 0] };
}


function t3FloorOf(scene, name, R = T3_EYE) {
  const index = scene.groups.findIndex((g) => g.name === name);
  let low = Infinity;
  for (const run of scene.runs) {
    if (run.group !== index) continue;
    const c = run.cloud;
    for (let i = 0; i < c.length; i += 3) {
      const z = R[6] * c[i] + R[7] * c[i + 1] + R[8] * c[i + 2];
      if (z < low) low = z;
    }
  }
  return low;
}


function t3Compose(A, B) {
  return Array.from(t3Mul(A, B));
}


function t3PoseUniforms(controller, group, prefix = "uGroup") {
  const scene = controller.scene();
  const index = scene.groups.findIndex((g) => g.name === group);
  const cams = controller.cams();
  const cam = index >= 0 && cams ? cams[index] : null;
  const R = cam ? cam.R : T3_EYE;
  const t = cam ? cam.t : [0, 0, 0];
  const o = index >= 0 ? scene.groups[index].origin : [0, 0, 0];
  const T = [t[0] - (R[0] * o[0] + R[1] * o[1] + R[2] * o[2]), t[1] - (R[3] * o[0] + R[4] * o[1] + R[5] * o[2]), t[2] - (R[6] * o[0] + R[7] * o[1] + R[8] * o[2])];
  return { [`${prefix}X`]: [R[0], R[3], R[6]], [`${prefix}Y`]: [R[1], R[4], R[7]], [`${prefix}Z`]: [R[2], R[5], R[8]], [`${prefix}T`]: T };
}


function t3MaterialCss() {
  const rules = [];
  const block = (values) => T3_MAT_KEYS.map((key, i) => `--anatomy-${key}:${values[i]}`).concat(T3_MAT_TUBE.map((key, i) => `--mat-${key}:${values[T3_MAT_KEYS.length + i]}`)).join(";");
  for (const [name, { light, dark }] of Object.entries(T3_MATERIALS)) {
    rules.push(`[data-mat="${name}"]{${block(dark)}}`);
    rules.push(`.iso[data-theme="light"] [data-mat="${name}"]{${block(light)}}`);
    rules.push(`.iso[data-theme="dark"] [data-mat="${name}"]{${block(dark)}}`);
  }
  rules.push("[data-mat] .tb-body{fill:var(--mat-body)}");
  rules.push("[data-mat] .tb-shine{fill:var(--mat-shine)}");
  rules.push("[data-mat] .tb-shade{fill:var(--mat-shade)}");
  rules.push("[data-mat] .tb-edge{stroke:var(--mat-edge)}");
  return rules.join("\n");
}
  return { t3Num, t3Token, t3Level, t3Rot, t3Camera, t3Scratch, t3SetHull, t3Faded, t3EmitDots, t3Arcs, t3Basis, t3Table, t3Thin, t3ArcPoints, t3PrepareRound, t3PrepareLathe, t3TangentAlong, t3Sides, t3TubeCap, t3Disjoint, t3Gjk, t3Enclose, t3PoseOf, t3FloorOf, t3Compose, t3PoseUniforms, t3MaterialCss };
}
