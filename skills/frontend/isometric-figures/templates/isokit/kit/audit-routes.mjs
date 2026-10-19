// Split from audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { add3, sub3, mul3, dot3, len3, unit3, pathLength, resample } from "./lathe.mjs";
import { BIG, boundsOf, box, cameraBasis, labelOf, matches, moved, offsetOf, overlaps, rayDepth, screenBox, sdf, seatedOn, segmentPoint, tube } from "./audit-geometry.mjs";



export function samplesOf(shape, spacing) {
  const dense = resample(shape.points, spacing);
  const total = pathLength(shape.points) || 1;
  const lengths = [0];
  for (let index = 1; index < shape.points.length; index++) lengths.push(lengths[index - 1] + len3(sub3(shape.points[index], shape.points[index - 1])));
  const radiusAt = (at) => {
    let index = 1;
    while (index < lengths.length - 1 && lengths[index] < at) index++;
    const span = lengths[index] - lengths[index - 1] || 1;
    const t = Math.max(0, Math.min(1, (at - lengths[index - 1]) / span));
    return shape.radii[index - 1] + (shape.radii[index] - shape.radii[index - 1]) * t;
  };
  const step = total / Math.max(1, dense.length - 1);
  return dense.map((p, index) => {
    const t = unit3(sub3(dense[Math.min(dense.length - 1, index + 1)], dense[Math.max(0, index - 1)]));
    return { p, t, along: index * step, edge: Math.min(index * step, total - index * step), r: radiusAt(index * step) };
  });
}


function centreline(shape, p) {
  let best = { d: BIG, r: 0 };
  for (let index = 0; index < shape.points.length - 1; index++) {
    const { d, t } = segmentPoint(p, shape.points[index], shape.points[index + 1]);
    if (d < best.d) best = { d, r: shape.radii[index] + (shape.radii[index + 1] - shape.radii[index]) * t };
  }
  return best;
}


const sameOffset = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-6;


const placed = (shape, state) => (state === undefined || !shape.move ? shape : moved(shape, offsetOf(shape, state)));


export const offsetAt = (shape, state) => (state === undefined || !shape.move ? [0, 0, 0] : offsetOf(shape, state));


function tipDistance(other, p) {
  if (other.kind === "tube") {
    const { d, r } = centreline(other, p);
    return d - r;
  }
  return sdf(other, p);
}


function rimOf(tube, index) {
  const tip = tube.tips[index];
  const axis = tube.tipAxes ? tube.tipAxes[index] : unit3(index ? sub3(tube.points[tube.points.length - 1], tube.points[tube.points.length - 2]) : sub3(tube.points[1], tube.points[0]));
  const radius = tube.tipRims ? tube.tipRims[index] : tube.radii[index ? tube.radii.length - 1 : 0];
  const helper = Math.abs(axis[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = unit3([helper[1] * axis[2] - helper[2] * axis[1], helper[2] * axis[0] - helper[0] * axis[2], helper[0] * axis[1] - helper[1] * axis[0]]);
  const v = [axis[1] * u[2] - axis[2] * u[1], axis[2] * u[0] - axis[0] * u[2], axis[0] * u[1] - axis[1] * u[0]];
  return Array.from({ length: 12 }, (_, k) => add3(tip, add3(mul3(u, radius * Math.cos((k * Math.PI) / 6)), mul3(v, radius * Math.sin((k * Math.PI) / 6)))));
}


export function mountsOf(tubes, solids, { tolerance = 0.15 } = {}) {
  const byName = new Map(tubes.map((tube) => [tube.name, tube]));
  const out = new Map();
  for (const tube of tubes) {
    const found = [null, null];
    (tube.tips ?? []).forEach((tip, index) => {
      if (!tip) return;
      const rim = rimOf(tube, index);
      let best = null;
      const consider = (other) => {
        if (other === tube || (other.owner && other.owner === tube.owner) || other.name === tube.owner || other.anchor === false) return;
        const { min, max } = boundsOf(other);
        if (!overlaps({ min: tip, max: tip }, { min, max }, 3 + (tube.tipRims ? tube.tipRims[index] : 0))) return;
        const ds = rim.map((p) => tipDistance(other, p));
        const score = (Math.abs(tipDistance(other, tip)) + ds.reduce((sum, d) => sum + Math.abs(d), 0) / ds.length) / 2;
        if (!best || score < best.score) best = { shape: other, score, d: tipDistance(other, tip), high: Math.max(...ds), low: Math.min(...ds) };
      };
      solids.forEach(consider);
      tubes.forEach(consider);
      if (best && byName.get(best.shape.owner) && best.shape.kind !== "tube") best.host = byName.get(best.shape.owner);
      found[index] = best && { ...best, tip, landed: best.high <= tolerance && best.low >= -tolerance };
    });
    out.set(tube, found);
  }
  return out;
}


function ringAround(sample, r) {
  const axis = sample.t;
  const helper = Math.abs(axis[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = unit3([helper[1] * axis[2] - helper[2] * axis[1], helper[2] * axis[0] - helper[0] * axis[2], helper[0] * axis[1] - helper[1] * axis[0]]);
  const v = [axis[1] * u[2] - axis[2] * u[1], axis[2] * u[0] - axis[0] * u[2], axis[0] * u[1] - axis[1] * u[0]];
  return Array.from({ length: 12 }, (_, k) => add3(sample.p, add3(mul3(u, r * Math.cos((k * Math.PI) / 6)), mul3(v, r * Math.sin((k * Math.PI) / 6)))));
}


export function clearances(tubes, solids, { ratio = 0.5, least = 0.2, spacing = 0.5, touching = -0.05, through = -0.1, state, only, mounts = mountsOf(tubes, solids) } = {}) {
  const gapOf = (r) => Math.max(least, ratio * r);
  const problems = new Map();
  const note = (tube, other, kind, clearance, need, sample) => {
    if (only && kind !== only) return;
    const id = `${tube.name}|${other.name}`;
    const prior = problems.get(id);
    if (prior && prior.clearance <= clearance) {
      prior.from = Math.min(prior.from, sample.along);
      prior.to = Math.max(prior.to, sample.along);
      return;
    }
    problems.set(id, { tube: tube.name, other: other.name, kind, clearance, need, at: sample.p, from: prior ? Math.min(prior.from, sample.along) : sample.along, to: prior ? Math.max(prior.to, sample.along) : sample.along, length: pathLength(tube.points), state: state === undefined ? "" : labelOf(state) });
  };
  const poseOf = new Map([...tubes, ...solids].map((shape) => [shape, placed(shape, state)]));
  const offsets = new Map([...tubes, ...solids].map((shape) => [shape, offsetAt(shape, state)]));
  const widest = new Map(tubes.map((tube) => [tube, poseOf.get(tube).radii.reduce((r, next) => Math.max(r, next), 0)]));
  const together = (a, b) => len3(sub3(offsets.get(a), offsets.get(b))) < 0.05;
  const runsBy = new Map();
  for (const tube of tubes) runsBy.set(tube.owner, [...(runsBy.get(tube.owner) ?? []), tube]);
  const tipsOf = (owner) => (runsBy.get(owner) ?? []).flatMap((run) => (mounts.get(run) ?? []).filter(Boolean).map((mount) => ({ run, mount })));
  const seatedOn = (shape, owner) => shape && shape.cut && [shape.cut].flat().some((cut) => cut.owner === owner);
  const zone = (r) => r + gapOf(r) + 1;
  const ownerOf = (other) => other.owner ?? other.name;
  const related = (tube, other, sample) => {
    if (seatedOn(other, tube.owner)) return true;
    const tips = tipsOf(tube.owner);
    const near = (entry) => len3(sub3(sample.p, add3(entry.mount.tip, offsets.get(entry.run)))) <= zone(sample.r) + (entry.run.tipRims ? Math.max(...entry.run.tipRims) : 0);
    for (const entry of tips) {
      if (!near(entry) || !together(tube, entry.mount.shape)) continue;
      const mount = entry.mount.shape;
      if (mount === other || (entry.mount.host && (entry.mount.host === other || other.owner === entry.mount.host.owner))) return true;
      if (tipsOf(ownerOf(other)).some((theirs) => theirs.mount.shape === mount)) return true;
    }
    for (const entry of tipsOf(ownerOf(other))) {
      const mount = entry.mount.shape;
      const lands = mount.owner === tube.owner || seatedOn(mount, tube.owner);
      if (!lands || !together(entry.run, tube)) continue;
      if (len3(sub3(sample.p, add3(entry.mount.tip, offsets.get(entry.run)))) <= zone(sample.r) + (entry.run.tipRims ? Math.max(...entry.run.tipRims) : 0) + sample.r) return true;
    }
    return false;
  };
  const nearTip = (tube, sample) => {
    const at = (tube.offset ?? 0) + sample.along;
    const total = tube.total ?? pathLength(tube.points);
    const tips = mounts.get(tube) ?? [null, null];
    return (tips[0] && at <= zone(sample.r)) || (tips[1] && total - at <= zone(sample.r));
  };
  const clearanceTo = (other, sample) => {
    if (sample.edge >= sample.r) return sdf(other, sample.p) - sample.r;
    return Math.min(...ringAround(sample, sample.r).map((q) => sdf(other, q)));
  };
  for (const tube of tubes) {
    const posed = poseOf.get(tube);
    const samples = samplesOf(posed, spacing);
    const tb = boundsOf(posed);
    for (const shape of solids) {
      if (shape.owner && shape.owner === tube.owner) continue;
      if (matches(tube.touch, shape.name) || matches(shape.touch, tube.name)) continue;
      const other = poseOf.get(shape);
      const ob = boundsOf(other);
      if (!overlaps(tb, ob, Math.max(4, gapOf(widest.get(tube))))) continue;
      for (const sample of samples) {
        if (!overlaps({ min: sample.p, max: sample.p }, ob, sample.r + Math.max(3, gapOf(sample.r)))) continue;
        const gap = gapOf(sample.r);
        const clearance = clearanceTo(other, sample);
        if (clearance >= gap) continue;
        if (related(tube, shape, sample)) continue;
        if (nearTip(tube, sample) && clearance >= through) continue;
        note(tube, shape, clearance < 0 ? "through" : "close", clearance, gap, sample);
      }
    }
  }
  for (let a = 0; a < tubes.length; a++) {
    const ta = poseOf.get(tubes[a]);
    const samples = samplesOf(ta, spacing);
    for (let b = 0; b < tubes.length; b++) {
      if (a === b) continue;
      const tb = poseOf.get(tubes[b]);
      if (tubes[a].owner && tubes[a].owner === tubes[b].owner && tubes[a].joined) continue;
      if (matches(tubes[a].touch, tubes[b].name) || matches(tubes[b].touch, tubes[a].name)) continue;
      const bundled = tubes[a].bundle && tubes[a].bundle === tubes[b].bundle;
      const widestB = widest.get(tubes[b]);
      const envelope = bundled ? 3 : Math.max(3, gapOf(Math.min(widest.get(tubes[a]), widestB)));
      if (!overlaps(boundsOf(ta), boundsOf(tb), envelope)) continue;
      for (const sample of samples) {
        const envelope = bundled ? 3 : Math.max(3, gapOf(Math.min(sample.r, widestB)));
        if (!overlaps({ min: sample.p, max: sample.p }, boundsOf(tb), sample.r + envelope)) continue;
        const clearance = sample.edge >= sample.r ? sdf(tb, sample.p) - sample.r : Math.min(...ringAround(sample, sample.r).map((q) => sdf(tb, q)));
        const r = centreline(tb, sample.p).r;
        const gap = bundled ? touching : gapOf(Math.min(sample.r, r));
        if (clearance >= gap) continue;
        if (related(tubes[a], tubes[b], sample)) continue;
        if (nearTip(tubes[a], sample) && clearance >= through) continue;
        if (a > b && problems.has(`${tubes[b].name}|${tubes[a].name}`)) continue;
        note(tubes[a], tubes[b], clearance < 0 ? "through" : "close", clearance, gap, sample);
      }
    }
  }
  const seen = new Set();
  return [...problems.values()]
    .sort((x, y) => x.clearance - y.clearance)
    .filter((c) => {
      const id = [c.tube, c.other].sort().join("|");
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}


export function terminals(tubes, solids, { tolerance = 0.15, mounts = mountsOf(tubes, solids, { tolerance }) } = {}) {
  const out = [];
  for (const tube of tubes) {
    (mounts.get(tube) ?? []).forEach((mount, index) => {
      if (!tube.tips || !tube.tips[index] || (mount && mount.landed)) return;
      out.push({ tube: tube.name, end: index ? "end" : "start", at: tube.tips[index], d: mount ? mount.d : Infinity, high: mount ? mount.high : Infinity, low: mount ? mount.low : -Infinity, nearest: mount ? mount.shape.name : "nothing" });
    });
  }
  return out;
}


export function looseEnds(tubes, solids, { state = 1, tolerance = 0.15 } = {}) {
  const out = [];
  for (const tube of tubes) {
    const offset = offsetAt(tube, state);
    (tube.tips ?? []).forEach((tip, index) => {
      if (!tip) return;
      const hit = solids.some((shape) => {
        if ((shape.owner && shape.owner === tube.owner) || shape.name === tube.owner) return false;
        if (!sameOffset(offsetAt(shape, state), offset)) return false;
        const { min, max } = boundsOf(shape);
        return overlaps({ min: tip, max: tip }, { min, max }, 1) && sdf(shape, tip) <= tolerance;
      });
      if (!hit) out.push({ tube: tube.name, end: index ? "end" : "start", at: add3(tip, offset), state: labelOf(state), free: Boolean(tube.free && tube.free[index]) });
    });
  }
  return out;
}


export function folds(routes, P, { fold = 140, turn = 110, pinch = 2, items = null } = {}) {
  const cam = cameraBasis(P);
  const entries = items ? entriesOf(items, cam) : null;
  const shown = (name, p) => !entries || frontAt(entries, cam, cam.origin[0] + dot3(p, cam.R) * cam.k, cam.origin[1] + dot3(p, cam.D) * cam.k) === name;
  const flat = (p) => [dot3(p, cam.R) * cam.k, dot3(p, cam.D) * cam.k];
  const angle = (a, b) => (Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]) || 1)))) * 180) / Math.PI;
  const out = [];
  for (const { name, points, r } of routes) {
    const step = Math.max(0.25, r * 0.5);
    const dense = resample(points, step);
    const screen = dense.map(flat);
    const reach = Math.max(2, Math.round((4 * r) / step));
    const width = r * cam.k;
    let worst = null;
    for (const span of [1.5, 3, 6]) {
      const near = Math.max(1, Math.round((span * r) / step));
      for (let i = near; i < dense.length - near; i++) {
        const p0 = screen[i - near];
        const p1 = screen[i];
        const p2 = screen[i + near];
        const a = [p1[0] - p0[0], p1[1] - p0[1]];
        const b = [p2[0] - p1[0], p2[1] - p1[1]];
        const c = [p2[0] - p0[0], p2[1] - p0[1]];
        const la = Math.hypot(a[0], a[1]);
        const lb = Math.hypot(b[0], b[1]);
        if (la < width * 0.3 || lb < width * 0.3) continue;
        const bend = angle(a, b);
        const area = Math.abs(a[0] * b[1] - a[1] * b[0]) / 2;
        const radius = area > 1e-9 ? (la * lb * Math.hypot(c[0], c[1])) / (4 * area) : Infinity;
        if (bend > 90 && radius < pinch * width && (!worst || radius < worst.radius) && shown(name, dense[i])) worst = { name, kind: "pinch", flatTurn: bend, radius, width, at: dense[i], index: i };
      }
    }
    if (worst) {
      let toStart = 0;
      for (let i = 1; i <= worst.index; i++) toStart += Math.hypot(screen[i][0] - screen[i - 1][0], screen[i][1] - screen[i - 1][1]);
      let toEnd = 0;
      for (let i = worst.index + 1; i < screen.length; i++) toEnd += Math.hypot(screen[i][0] - screen[i - 1][0], screen[i][1] - screen[i - 1][1]);
      if (Math.min(toStart, toEnd) > 3 * width) out.push(worst);
    }
    for (let i = reach; i < dense.length - reach; i++) {
      const a = [screen[i][0] - screen[i - reach][0], screen[i][1] - screen[i - reach][1]];
      const b = [screen[i + reach][0] - screen[i][0], screen[i + reach][1] - screen[i][1]];
      if (Math.hypot(a[0], a[1]) < 1e-6 || Math.hypot(b[0], b[1]) < 1e-6) continue;
      const flatTurn = angle(a, b);
      const A3 = sub3(dense[i], dense[i - reach]);
      const B3 = sub3(dense[i + reach], dense[i]);
      const realTurn = (Math.acos(Math.max(-1, Math.min(1, dot3(A3, B3) / (len3(A3) * len3(B3) || 1)))) * 180) / Math.PI;
      if (flatTurn > fold && realTurn < turn && shown(name, dense[i])) {
        out.push({ name, kind: "fold", flatTurn, realTurn, at: dense[i] });
        i += 2 * reach;
      }
    }
  }
  return out;
}


export function linksOf(tubes, mounts) {
  const links = new Map();
  const link = (a, b) => {
    if (!a || !b || a === b) return;
    if (!links.has(a)) links.set(a, new Set());
    if (!links.has(b)) links.set(b, new Set());
    links.get(a).add(b);
    links.get(b).add(a);
  };
  const ownerOf = (shape) => shape.owner ?? shape.name;
  const seats = new Map();
  for (const tube of tubes)
    for (const mount of mounts.get(tube) ?? []) {
      if (!mount) continue;
      const host = ownerOf(mount.shape);
      link(tube.owner, host);
      if (!seats.has(host)) seats.set(host, []);
      seats.get(host).push(tube.owner);
      if (mount.shape.cut) for (const cut of [mount.shape.cut].flat()) link(tube.owner, ownerOf(cut));
    }
  for (const owners of seats.values()) for (const a of owners) for (const b of owners) link(a, b);
  return links;
}


const entriesOf = (items, cam) => items.flatMap((item) => (item.shapes ?? []).map((shape) => ({ shape, box: screenBox(shape, cam, [0, 0, 0]).map((v, i) => v + (i < 2 ? -1 : 1)), owner: item.route ?? shape.owner ?? item.name, bundle: shape.bundle ?? null, item: item.name })));


function frontEntry(entries, cam, x, y) {
  const c = add3(mul3(cam.R, (x - cam.origin[0]) / cam.k), mul3(cam.D, (y - cam.origin[1]) / cam.k));
  let best = -BIG;
  let who = null;
  for (const entry of entries) {
    const { shape, box } = entry;
    if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) continue;
    const t = rayDepth(shape, c, cam.V, 0.02, null);
    if (t !== null && t > best) (best = t), (who = entry);
  }
  return who;
}


function frontAt(entries, cam, x, y) {
  const entry = frontEntry(entries, cam, x, y);
  return entry ? entry.owner : null;
}


const belongs = (entry, name, bundle) => Boolean(entry) && (entry.owner === name || entry.item === name || (bundle && entry.bundle === bundle));


export function slenderOf(solids, { ratio = 4, least = 0.3 } = {}) {
  const out = [];
  const axisLine = (centre, axis, half, r, shape) => {
    out.push({ name: shape.owner ?? shape.name, solid: shape.name, owners: new Set([shape.name, shape.owner].filter(Boolean)), points: [add3(centre, mul3(axis, -half)), add3(centre, mul3(axis, half))], r, move: shape.move, ride: shape.ride, piece: shape.piece, rod: true });
  };
  for (const shape of solids) {
    if (!shape || shape.kind === "tube" || shape.kind === "ball" || shape.fitting) continue;
    if (shape.kind === "body") {
      const s = shape.poly.map(([value]) => value);
      const s0 = Math.min(...s);
      const s1 = Math.max(...s);
      const r = Math.max(...shape.poly.map(([, value]) => value));
      if (r >= least && s1 - s0 >= ratio * r) axisLine(add3(shape.F.o, mul3(shape.F.a, (s0 + s1) / 2)), shape.F.a, (s1 - s0) / 2, r, shape);
      continue;
    }
    let axes;
    let half;
    let centre;
    if (shape.kind === "prism") {
      const xs = shape.poly.map(([x]) => x);
      const ys = shape.poly.map(([, y]) => y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      axes = [shape.F.u, shape.F.v, shape.F.a];
      half = [(x1 - x0) / 2, (y1 - y0) / 2, (shape.s1 - shape.s0) / 2];
      centre = add3(shape.F.o, add3(add3(mul3(shape.F.u, (x0 + x1) / 2), mul3(shape.F.v, (y0 + y1) / 2)), mul3(shape.F.a, (shape.s0 + shape.s1) / 2)));
    } else if (shape.kind === "box") {
      axes = shape.axes;
      half = shape.half;
      centre = shape.o;
    } else continue;
    const order = [0, 1, 2].sort((a, b) => half[b] - half[a]);
    const r = half[order[1]];
    if (r >= least && half[order[0]] >= ratio * r) axisLine(centre, axes[order[0]], half[order[0]], r, shape);
  }
  return out;
}


export function crowding(routes, P, { gap = 1, bend = 30, links = new Map(), items = null, allow = [], state, clear = 2, rods = [] } = {}) {
  const cam = cameraBasis(P);
  const shift = (thing) => (state === undefined ? [0, 0, 0] : offsetOf(thing, state));
  const entries = items ? entriesOf(items.map((item) => ({ ...item, shapes: (item.shapes ?? []).map((shape) => moved(shape, shift(item))) })), cam) : null;
  const bundles = new Map(routes.map((route) => [route.name, route.bundle]));
  const shown = (owner, x, y, rod) => {
    if (!entries) return true;
    const entry = frontEntry(entries, cam, x, y);
    if (rod) return Boolean(entry) && (entry.shape.name === rod.solid || (!entry.shape.name && entry.item === rod.solid));
    return belongs(entry, owner, bundles.get(owner));
  };
  const flat = (p) => [cam.origin[0] + dot3(p, cam.R) * cam.k, cam.origin[1] + dot3(p, cam.D) * cam.k];
  const lines = [...routes, ...rods].map((route) => {
    const step = Math.max(0.25, route.r * 0.5);
    const offset = shift(route);
    const dense = resample(route.points.map((p) => add3(p, offset)), step);
    return { ...route, step, dense, screen: dense.map(flat), width: route.r * cam.k };
  });
  const marksOf = (line) => {
    const out = [];
    const reach = Math.max(2, Math.round((2 * line.r) / line.step));
    const last = line.dense.length - 1;
    for (let i = 0; i <= last; i++) {
      if (i <= reach || i >= last - reach) {
        out.push({ i, where: i <= reach ? "start" : "end" });
        continue;
      }
      const A = sub3(line.dense[i], line.dense[i - reach]);
      const B = sub3(line.dense[i + reach], line.dense[i]);
      const turn = (Math.acos(Math.max(-1, Math.min(1, dot3(A, B) / (len3(A) * len3(B) || 1)))) * 180) / Math.PI;
      if (turn > bend) out.push({ i, where: "bend" });
    }
    return out;
  };
  const found = new Map();
  for (const a of lines) {
    if (a.rod) continue;
    const marks = marksOf(a);
    for (const b of lines) {
      if (a === b || (a.bundle && a.bundle === b.bundle) || links.get(a.name)?.has(b.name)) continue;
      if (b.rod && [...b.owners].some((name) => name === a.name || links.get(a.name)?.has(name))) continue;
      if (allow.some(([x, y]) => [b.name, b.solid].filter(Boolean).some((name) => (matches([x], a.name) && matches([y], name)) || (matches([y], a.name) && matches([x], name))))) continue;
      for (const { i, where } of marks) {
        const [x, y] = a.screen[i];
        let best = { d: BIG, j: -1 };
        for (let j = 0; j < b.screen.length; j++) {
          const d = Math.hypot(b.screen[j][0] - x, b.screen[j][1] - y);
          if (d < best.d) best = { d, j };
        }
        const touch = best.d - a.width - b.width;
        if (touch >= gap) continue;
        if (where !== "bend" && touch <= -2 * Math.min(a.width, b.width)) {
          const tip = a.screen[where === "start" ? 0 : a.screen.length - 1];
          let clearTip = BIG;
          for (const q of b.screen) clearTip = Math.min(clearTip, Math.hypot(q[0] - tip[0], q[1] - tip[1]));
          const reachB = Math.max(2, Math.round((2 * b.r) / b.step));
          const j0 = Math.max(0, best.j - reachB);
          const j1 = Math.min(b.dense.length - 1, best.j + reachB);
          const straight = j1 - j0 >= 2 && dot3(unit3(sub3(b.dense[best.j], b.dense[j0])), unit3(sub3(b.dense[j1], b.dense[best.j]))) > Math.cos((bend * Math.PI) / 180);
          if (straight && clearTip > b.width + a.width + 1) continue;
        }
        const [bx, by] = b.screen[best.j];
        const u = [(bx - x) / (best.d || 1), (by - y) / (best.d || 1)];
        const inA = Math.max(0.2, a.width - 0.35);
        const inB = Math.max(0.2, b.width - 0.35);
        if (!shown(a.name, x + u[0] * inA, y + u[1] * inA)) continue;
        if (b.rod) {
          if (!shown(b.name, bx - u[0] * inB, by - u[1] * inB, b) && !shown(b.name, bx + u[0] * inB, by + u[1] * inB, b)) continue;
        } else if (!shown(b.name, bx - u[0] * inB, by - u[1] * inB)) continue;
        const depth = Math.abs(dot3(sub3(a.dense[i], b.dense[best.j]), cam.V));
        const need = 2 * (a.r + b.r);
        const id = [a.name, b.name].sort().join("|");
        const prior = found.get(id);
        if (!prior || Math.abs(touch) < Math.abs(prior.gap)) found.set(id, { a: a.name, b: b.rod ? `${b.solid} (rod)` : b.name, where, gap: touch, depth, need, screen: [x, y], at: a.dense[i], state: state === undefined ? "" : labelOf(state) });
      }
    }
  }
  if (entries)
    for (const fitting of entries.filter((entry) => entry.shape.fitting && entry.shape.kind === "body")) {
      const { shape } = fitting;
      const reach = Math.max(...shape.poly.map(([, r]) => r));
      const [x, y] = flat(shape.F.o);
      for (const b of lines) {
        if (b.rod) continue;
        if ((fitting.bundle && b.bundle === fitting.bundle) || b.name === fitting.owner || links.get(fitting.owner)?.has(b.name)) continue;
        if (allow.some(([p, q]) => (matches([p], fitting.item) && matches([q], b.name)) || (matches([q], fitting.item) && matches([p], b.name)))) continue;
        let best = { d: BIG, j: -1 };
        for (let j = 0; j < b.screen.length; j++) {
          const d = Math.hypot(b.screen[j][0] - x, b.screen[j][1] - y);
          if (d < best.d) best = { d, j };
        }
        const touch = best.d - reach * cam.k - b.width;
        if (touch >= clear) continue;
        const front = frontEntry(entries, cam, x, y);
        if (!(front === fitting || belongs(front, fitting.owner, fitting.bundle))) continue;
        const id = [fitting.item, b.name].sort().join("|");
        const prior = found.get(id);
        if (!prior || Math.abs(touch) < Math.abs(prior.gap)) found.set(id, { a: fitting.item, b: b.name, where: "fitting", gap: touch, depth: Math.abs(dot3(sub3(shape.F.o, b.dense[best.j]), cam.V)), need: 0, screen: [x, y], at: shape.F.o, state: state === undefined ? "" : labelOf(state) });
      }
    }
  return [...found.values()].sort((x, y) => Math.abs(x.gap) - Math.abs(y.gap));
}


export function selfOverlaps(items, P, { entries: given = null, fold = 0.25, least = 0.5 } = {}) {
  const cam = cameraBasis(P);
  const entries = given ?? entriesOf(items, cam);
  const flat = (p) => [cam.origin[0] + dot3(p, cam.R) * cam.k, cam.origin[1] + dot3(p, cam.D) * cam.k];
  const out = [];
  for (const item of items) {
    if (!item.route || !item.shapes || !item.shapes.length || item.shapes[0].kind !== "tube") continue;
    const shape = item.shapes[0];
    const r = shape.radii.reduce((sum, value) => sum + value, 0) / shape.radii.length;
    const dense = resample(shape.points, Math.max(0.1, r * 0.2));
    const screen = dense.map(flat);
    const n = screen.length;
    if (n < 4) continue;
    const width = r * cam.k;
    const span = 3;
    const normals = screen.map((_, i) => {
      const a = screen[Math.max(0, i - span)];
      const b = screen[Math.min(n - 1, i + span)];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    });
    let worst = null;
    for (const side of [1, -1]) {
      const edge = screen.map((p, i) => [p[0] + side * normals[i][0] * width, p[1] + side * normals[i][1] * width]);
      for (let i = span; i < n - span - 1; i++) {
        const along = [screen[i + 1][0] - screen[i][0], screen[i + 1][1] - screen[i][1]];
        const step = [edge[i + 1][0] - edge[i][0], edge[i + 1][1] - edge[i][1]];
        const length = Math.hypot(along[0], along[1]);
        if (length < 1e-6) continue;
        const forward = (step[0] * along[0] + step[1] * along[1]) / length;
        if (forward > -fold * length) continue;
        const x = (screen[i][0] + screen[i + 1][0]) / 2;
        const y = (screen[i][1] + screen[i + 1][1]) / 2;
        const front = frontEntry(entries, cam, x, y);
        if (front && front.owner !== item.route && front.item !== item.name) continue;
        const radius = Math.abs(forward / length - 1) > 1e-6 ? width / Math.abs(1 - forward / length) : Infinity;
        if (width - radius < least) continue;
        if (!worst || radius < worst.radius) worst = { name: item.name, route: item.route, radius, width, at: dense[i], screen: [x, y] };
      }
    }
    if (worst) out.push(worst);
  }
  return out;
}


export function seats(solids) {
  const out = [];
  for (const shape of solids) {
    if (!shape.seated || !shape.cut) continue;
    for (const host of [shape.cut].flat()) {
      const mine = mul3(shape.move ?? [0, 0, 0], 1);
      const theirs = mul3(host.move ?? [0, 0, 0], 1);
      if ((shape.ride ?? shape.piece) === (host.ride ?? host.piece) && sameOffset(mine, theirs)) continue;
      out.push({ name: shape.name, host: host.name, piece: shape.ride ?? shape.piece, hostPiece: host.ride ?? host.piece });
    }
  }
  return out;
}
