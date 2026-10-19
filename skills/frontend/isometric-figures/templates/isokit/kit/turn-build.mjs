// Split from turn-build.mjs; original algorithms and public entrypoint contracts are preserved.
import { TURN } from "./turn.mjs";
import * as k from "./iso-kit.mjs";
import * as G from "./lathe.mjs";
import * as A from "./audit.mjs";
import { TAU, add3, convexOrThrow, dot3, fine, finePath, frameFrom, hull2, mul3, roundedPolygon, sampleShape, signedArea, spansOf, sub3 } from "./turn-build-analysis.mjs";
import { build } from "./turn-build-output.mjs";



export function turning(P, { recorder = null, scale = 1 } = {}) {
  const T = { P, R: recorder, scale, groups: [], layers: [], order: [], parts: [], built: null };
  const groupOf = (g) => {
    if (g === undefined || g === null) return null;
    if (typeof g !== "string") return g;
    const group = T.groups.find((x) => x.name === g);
    if (!group) throw new Error(`turning: unknown group ${g}`);
    return group;
  };
  const layerOf = (l) => (typeof l === "string" ? T.layers.find((x) => x.name === l) : l);
  const origin = (group) => (group ? group.origin : [0, 0, 0]);
  const local = (group, p) => sub3(p, origin(group));
  T.group = (name, options = {}) => {
    if (T.groups.some((group) => group.name === name)) throw new Error(`turning: duplicate group ${name}`);
    const parent = groupOf(options.parent);
    const po = origin(parent);
    let kind;
    let spec;
    if (options.turn) {
      kind = "turn";
      const pivot = options.turn.pivot ?? [0, 0];
      spec = { origin: [pivot[0], pivot[1], 0], pivot: [pivot[0], pivot[1]], range: options.turn.range ?? null };
    } else if (options.slide) {
      kind = "slide";
      spec = { origin: po.slice(), direction: G.unit3(options.slide.direction), travel: options.slide.travel ?? 0, range: [0, options.slide.travel ?? 0] };
    } else if (options.hinge) {
      kind = "hinge";
      spec = { origin: options.hinge.point.slice(), point: options.hinge.point.slice(), axis: G.unit3(options.hinge.axis), range: options.hinge.range ?? [0, 0] };
    } else if (options.free) {
      kind = "free";
      const at = options.free.origin ?? po;
      spec = { origin: at.slice(), range: null };
    } else throw new Error(`turning: group ${name} needs turn, slide, hinge or free`);
    const upright = kind !== "free" && (parent ? parent.upright : true) && (kind !== "hinge" || Math.abs(spec.axis[2]) > 0.9999);
    const loose = kind === "free" || Boolean(parent && parent.loose);
    const group = { name, index: T.groups.length, parent, kind, upright, loose, ...spec };
    T.groups.push(group);
    return group;
  };
  T.layer = (name) => {
    const layer = { name, index: T.layers.length, live: true };
    T.layers.push(layer);
    return layer;
  };
  T.stack = (names) => {
    T.order = names.slice();
    return T;
  };
  const common = (options, kind) => {
    const group = groupOf(options.group);
    const layer = layerOf(options.layer ?? T.layers[0]);
    if (!layer) throw new Error(`turning: part ${options.name} has no live layer`);
    const name = options.name ?? `${kind}#${T.parts.length}`;
    const material = options.material ?? null;
    if (material && !TURN.materials.includes(material)) throw new Error(`turning: part ${name} has material ${material}; use one of ${TURN.materials.join(", ")}`);
    return { id: T.parts.length, name, kind, group, layer, owner: options.owner, tone: options.tone ?? "hi", crease: options.crease ?? "faint", lit: Boolean(options.lit), material, details: options.details ?? {}, shapes: [], planes: [], dots: [], samples: [], hints: [] };
  };
  const record = (part, shape) => {
    shape.name = shape.name ?? part.name;
    if (part.owner && !shape.owner) shape.owner = part.owner;
    part.shapes.push(shape);
    if (T.R) T.R.solid(shape);
    return shape;
  };
  const toLocalDots = (part, F, list) => {
    for (const dot of list ?? []) {
      const [s, x, y] = dot.at;
      const p = add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
      part.dots.push({ p: local(part.group, p), n: dot.normal ? G.unit3(dot.normal) : null, size: dot.size ?? 0.5, tone: dot.tone ?? "mid", fade: dot.fade ?? [0.04, 0.42] });
    }
  };
  T.prism = (options) => {
    const part = common(options, "prism");
    let F;
    let ring;
    let s0;
    let s1;
    if (options.plan) {
      F = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
      ring = k.roundedPlan(options.plan, options.steps ?? 4);
      s0 = options.z ?? options.s0 ?? 0;
      s1 = options.h !== undefined ? s0 + options.h : options.s1;
    } else {
      F = frameFrom(options.F);
      ring = roundedPolygon(options.polygon, options.round ?? 0, options.steps ?? 4);
      s0 = options.s0;
      s1 = options.s1;
    }
    if (s1 < s0) [s0, s1] = [s1, s0];
    if (signedArea(ring) < 0) ring = ring.slice().reverse();
    convexOrThrow(ring, part.name);
    const bevel = options.bevel ?? part.details.bevel ?? 0;
    const upright = Math.abs(F.a[2]) > 0.9999 && (!part.group || part.group.upright);
    record(part, A.prism(F, ring, s0, s1, { name: part.name }));
    const corner = (s, [x, y]) => add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
    part.world = { F, ring, s0, s1 };
    if (upright) {
      const flip = F.a[2] < 0;
      const pts = ring.map((p) => local(part.group, corner(flip ? s1 : s0, p)));
      let xy = pts.map(([x, y]) => [x, y]);
      if (signedArea(xy) < 0) xy = xy.reverse();
      const z0 = pts[0][2];
      const z1 = z0 + (s1 - s0);
      part.spec = { up: 1, ring: xy.flat(), z0, z1, bevel };
      part.planPath = finePath(xy);
      part.localSeams = (part.details.seams ?? []).map((s) => (flip ? z1 - (s - s0) : z0 + (s - s0)));
    } else {
      const FL = { o: local(part.group, F.o), a: F.a, u: F.u, v: F.v };
      part.spec = { up: 0, F: FL, ring: ring.flat(), s0, s1, bevel };
      part.localSeams = (part.details.seams ?? []).slice();
    }
    toLocalDots(part, F, part.details.dots);
    for (const s of [s0, s1]) for (const p of ring) part.samples.push(local(part.group, corner(s, p)));
    part.hints.push(F.a);
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % n];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l > 1e-6) part.hints.push(G.unit3(add3(mul3(F.u, (b[1] - a[1]) / l), mul3(F.v, -(b[0] - a[0]) / l))));
    }
    T.parts.push(part);
    return part;
  };
  const detailParts = (part, F, radiusAt, ends) => {
    const details = part.details ?? {};
    for (const bolt of details.bolts ?? []) {
      const { s, r, count, phase = 0, size = 0.5, tone = "mid", fade = [0.04, 0.42] } = bolt;
      const atEnd = ends ? (Math.abs(s - ends[0]) < 1e-6 ? -1 : Math.abs(s - ends[1]) < 1e-6 ? 1 : 0) : 0;
      const onCap = atEnd !== 0 && (!radiusAt || r < radiusAt(s) - 1e-6);
      const slope = radiusAt ? (radiusAt(s + 1e-3) - radiusAt(s - 1e-3)) / 2e-3 : 0;
      for (let j = 0; j < count; j++) {
        const t = phase + (j / count) * TAU;
        const p = G.pointOf(F, s, r, t);
        const radial = G.radialOf(F, t);
        const n = onCap ? mul3(F.a, atEnd) : G.unit3(sub3(radial, mul3(F.a, slope)));
        part.dots.push({ p: local(part.group, p), n, size, tone, fade });
      }
    }
    toLocalDots(part, F, details.dots);
    for (const ring of details.rings ?? []) {
      const [s, x, y] = ring.at;
      const o = add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
      const n = G.unit3(ring.normal ?? F.a);
      const B = G.frameAlong([0, 0, 0], n);
      const steps = Math.max(12, Math.ceil((TAU * ring.r * k.cameraOf(P).k) / 1.2));
      const pts = Array.from({ length: steps }, (_, j) => [ring.r * Math.cos((j / steps) * TAU), ring.r * Math.sin((j / steps) * TAU)]);
      T.plane({ part, o, u: B.u, v: B.v, normal: n, fade: ring.fade ?? [0.04, 0.3], svg: `<path class="iso-line" data-tone="${ring.tone ?? "lo"}" d="${finePath(pts)}"/>` });
    }
    for (const rule of details.rules ?? []) {
      const pts = rule.points.map(([s, x, y]) => add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y))));
      let n = rule.normal ? G.unit3(rule.normal) : null;
      if (!n) {
        for (let i = 2; i < pts.length && !n; i++) {
          const c = G.cross3(sub3(pts[1], pts[0]), sub3(pts[i], pts[0]));
          if (G.len3(c) > 1e-9) n = G.unit3(c);
        }
        n = n ?? F.a;
      }
      const B = G.frameAlong([0, 0, 0], n);
      const o = pts[0];
      const flat = pts.map((p) => [dot3(sub3(p, o), B.u), dot3(sub3(p, o), B.v)]);
      const d = flat.map(([x, y], i) => `${i ? "L" : "M"}${fine(x)} ${fine(y)}`).join("");
      const free = rule.free === true ? ' data-free=""' : rule.free ? ` data-free="${rule.free}"` : "";
      T.plane({ part, o, u: B.u, v: B.v, normal: n, fade: rule.fade ?? [0.04, 0.3], svg: `<path class="iso-line" data-tone="${rule.tone ?? "lo"}"${free} d="${d}"/>` });
    }
  };
  T.round = (options) => {
    const F = frameFrom(options.F);
    const r0 = Array.isArray(options.r) ? options.r[0] : options.r0 ?? options.r;
    const r1 = Array.isArray(options.r) ? options.r[1] : options.r1 ?? options.r;
    let s0 = options.s0;
    let s1 = options.s1;
    const ends = (options.ends ?? ["flat", "flat"]).slice();
    if (s1 < s0) throw new Error(`turning: round ${options.name} needs s0 < s1`);
    ends.forEach((end, j) => {
      if (end === "dome" && Math.abs(r0 - r1) > 1e-9) throw new Error(`turning: round ${options.name} can only have a dome where the end radius equals the side's (a capsule)`);
    });
    const profile = [];
    const arc = (sAt, sign, r) => Array.from({ length: 9 }, (_, j) => (j / 8) * (Math.PI / 2)).map((b) => [sAt + sign * r * Math.cos(b), r * Math.sin(b), 1]);
    if (ends[0] === "dome") profile.push(...arc(s0, -1, r0).slice(0, -1).map((p, j) => (j === 0 ? [p[0], 0] : p)), [s0, r0, 1]);
    else profile.push([s0, r0]);
    if (ends[1] === "dome") profile.push([s1, r1, 1], ...arc(s1, 1, r1).reverse().slice(1).map((p, j, list) => (j === list.length - 1 ? [p[0], 0] : p)));
    else profile.push([s1, r1]);
    const vertical = Math.abs(F.a[2]) > 0.9999;
    const groupOk = !options.group || groupOf(options.group).upright;
    const radiusAt = (s) => r0 + ((r1 - r0) * (Math.max(s0, Math.min(s1, s)) - s0)) / (s1 - s0 || 1);
    if (vertical && groupOk && options.fixed !== false) {
      const meridian = [[profile[0][0], 0], ...profile.filter((p) => p[1] > 1e-9), [profile[profile.length - 1][0], 0]];
      const seams = (options.details?.seams ?? []).map((sv) => G.arcOf(F, sv, radiusAt(sv), P, { slope: (r1 - r0) / (s1 - s0 || 1), least: 0 })).join("");
      const paths = G.lathe(meridian, F, P, ends.includes("dome") ? { smooth: true } : {});
      const svg = k.solidSvg(paths, { tone: options.tone ?? "hi", crease: options.crease ?? "faint", lit: options.lit, inner: seams ? k.lineSvg(seams, { tone: "faint" }) : "" });
      const ribs = options.details?.ribs ? { ...options.details.ribs, r0: options.details.ribs.r0 ?? radiusAt(options.details.ribs.s0), r1: options.details.ribs.r1 ?? radiusAt(options.details.ribs.s1) } : undefined;
      const part = T.fixed({ ...options, svg, anchor: G.pointOf(F, s0, 0, 0), F, details: { ...(options.details ?? {}), ribs, seams: undefined }, shapes: [A.solid(F, profile, { name: options.name })], skipDetails: true });
      part.round = { F, s0, s1, r0, r1, ends };
      detailParts(part, F, radiusAt, [s0, s1]);
      return part;
    }
    const part = common(options, "round");
    record(part, A.solid(F, profile, { name: part.name }));
    part.world = { F, s0, s1, r0, r1, ends, profile };
    part.spec = { F: { o: local(part.group, F.o), a: F.a, u: F.u, v: F.v }, s0, s1, r0, r1, ends };
    detailParts(part, F, radiusAt, [s0, s1]);
    const ring = (s, r, count = 48) => Array.from({ length: count }, (_, j) => G.pointOf(F, s, r, (j / count) * TAU));
    const pts = [...ring(s0, r0), ...ring(s1, r1)];
    for (const [end, sAt, r] of [[0, s0, r0], [1, s1, r1]]) {
      if (ends[end] !== "dome") continue;
      const sign = end ? 1 : -1;
      for (let j = 1; j <= 6; j++) {
        const b = (j / 6) * (Math.PI / 2);
        if (j === 6) pts.push(add3(F.o, mul3(F.a, sAt + sign * r)));
        else pts.push(...ring(sAt + sign * r * Math.sin(b), r * Math.cos(b), 32));
      }
    }
    part.samples = pts.map((p) => local(part.group, p));
    part.hints.push(F.a);
    T.parts.push(part);
    return part;
  };
  T.ball = (options) => {
    const c = options.c;
    const r = options.r;
    const flats = (options.flats ?? []).map(({ n, d }) => ({ n: G.unit3(n), d }));
    const shape = A.ball(c, r, { name: options.name, flats: flats.map(({ n, d }) => [n[0], n[1], n[2], d]) });
    if (!flats.length && options.fixed !== false) {
      const svg = k.solidSvg(G.sphereOf(c, r, P, { steps: 48 }), { tone: options.tone ?? "hi", crease: options.crease ?? "faint", lit: options.lit });
      return T.fixed({ ...options, svg, anchor: c, shapes: [shape] });
    }
    const part = common(options, "ball");
    record(part, shape);
    part.world = { c, r, flats };
    part.spec = { c: local(part.group, c), r, flats };
    part.samples = sampleShape(shape, 48).map((p) => local(part.group, p));
    for (const { n } of flats) part.hints.push(n);
    detailParts(part, G.frameAlong(c, flats.length ? flats[0].n : [0, 0, 1]), null, null);
    T.parts.push(part);
    return part;
  };
  T.lathe = (options) => {
    const F = frameFrom(options.F);
    const profile = options.profile;
    const curve = G.profileCurve(profile.map(([sv, rv]) => [sv, rv]), { slope: options.slope ?? null, radius: options.radius ?? null });
    const kk = k.cameraOf(P).k;
    const knots = [curve.s0];
    const split = (a, b, level) => {
      const mid = (a + b) / 2;
      if (level < 7 && (Math.abs(curve.radius(mid) - (curve.radius(a) + curve.radius(b)) / 2) * kk > 0.1 || b - a > 4)) {
        split(a, mid, level + 1);
        knots.push(mid);
        split(mid, b, level + 1);
      }
    };
    const stops = [curve.s0, ...profile.map(([sv]) => sv).filter((sv) => sv > curve.s0 && sv < curve.s1), curve.s1];
    for (let i = 0; i < stops.length - 1; i++) {
      split(stops[i], stops[i + 1], 0);
      knots.push(stops[i + 1]);
    }
    for (let i = 1; i < knots.length - 1; i++) {
      const a = curve.radius(knots[i - 1]);
      const b = curve.radius(knots[i]);
      const c = curve.radius(knots[i + 1]);
      const h0 = knots[i] - knots[i - 1];
      const h1 = knots[i + 1] - knots[i];
      if ((c - b) / h1 - (b - a) / h0 > 1e-6) throw new Error(`turning: lathe ${options.name} is not convex near s = ${knots[i].toFixed(2)} (r(s) must be concave); split it`);
    }
    const levels = [];
    for (const sv of knots) {
      const g = curve.slope(sv);
      const norm = Math.hypot(1, g);
      levels.push(sv, curve.radius(sv), 1 / norm, -g / norm);
    }
    const caps = [curve.radius(curve.s0) > 1e-6, curve.radius(curve.s1) > 1e-6];
    const shape = A.solid(F, profile.map(([sv, rv]) => [sv, rv, 1]), { name: options.name, radius: curve.radius });
    const vertical = Math.abs(F.a[2]) > 0.9999;
    const groupOk = !options.group || groupOf(options.group).upright;
    if (vertical && groupOk && options.fixed !== false) {
      const meridian = [[curve.s0, 0], ...knots.map((sv) => [sv, curve.radius(sv), 1]), [curve.s1, 0]];
      meridian[1] = [meridian[1][0], meridian[1][1]];
      meridian[meridian.length - 2] = [meridian[meridian.length - 2][0], meridian[meridian.length - 2][1]];
      const seams = (options.details?.seams ?? []).map((sv) => G.arcOf(F, sv, curve.radius(sv), P, { slope: curve.slope(sv), least: 0 })).join("");
      const svg = k.solidSvg(G.lathe(meridian, F, P, { smooth: { slope: curve.slope, radius: curve.radius } }), { tone: options.tone ?? "hi", crease: options.crease ?? "faint", lit: options.lit, inner: seams ? k.lineSvg(seams, { tone: "faint" }) : "" });
      const part = T.fixed({ ...options, svg, anchor: G.pointOf(F, curve.s0, 0, 0), F, details: { ...(options.details ?? {}), seams: undefined }, shapes: [shape], skipDetails: true });
      detailParts(part, F, curve.radius, [curve.s0, curve.s1]);
      return part;
    }
    const part = common(options, "lathe");
    record(part, shape);
    part.spec = { F: { o: local(part.group, F.o), a: F.a, u: F.u, v: F.v }, levels, caps };
    part.world = { F, profile, curve, knots };
    const pts = [];
    for (const sv of knots) for (let j = 0; j < 32; j++) pts.push(G.pointOf(F, sv, curve.radius(sv), (j / 32) * TAU));
    part.samples = pts.map((p) => local(part.group, p));
    part.hints.push(F.a);
    detailParts(part, F, curve.radius, [curve.s0, curve.s1]);
    T.parts.push(part);
    return part;
  };
  T.routes = [];
  T.tube = (options) => {
    const { route, r, chunk = 6, turn = 20, gaps = [], breaks = [], caps = true, rings = null, hue = null, spacing = 0.8, owner, touch, bundle, rims, free } = options;
    const group = groupOf(options.group);
    const name = options.name ?? `tube#${T.routes.length}`;
    const dense = G.resample(route, spacing);
    const total = G.pathLength(dense);
    const turnBreaks = [];
    let walked = 0;
    let bent = 0;
    for (let i = 1; i < dense.length - 1; i++) {
      walked += G.len3(sub3(dense[i], dense[i - 1]));
      const a = G.unit3(sub3(dense[i], dense[i - 1]));
      const b = G.unit3(sub3(dense[i + 1], dense[i]));
      bent += (Math.acos(Math.max(-1, Math.min(1, dot3(a, b)))) * 180) / Math.PI;
      if (bent > turn) {
        turnBreaks.push(walked);
        bent = 0;
      }
    }
    const allBreaks = [...breaks, ...turnBreaks].sort((x, y) => x - y);
    const pieces = spansOf(total, gaps, allBreaks, chunk);
    const wide = r * k.cameraOf(P).k > 1.3;
    const routeIndex = T.routes.length;
    const capList = [caps].flat();
    T.routes.push({ name, group, points: dense.map((p) => local(group, p)), r, spacing, wide, hue, rings, world: route, gaps, breaks: allBreaks, chunk, caps });
    if (T.R) T.R.route(name, route, r, { gaps, limp: options.limp ?? true, owner: owner ?? name, touch, bundle, rims, free });
    const chunks = pieces.map((piece, index) => {
      const part = common({ ...options, name: `${name}:${index}` }, "tube");
      part.route = name;
      part.chunk = index;
      part.hue = hue;
      part.spec = { route: routeIndex, from: piece.from, to: piece.to, open0: piece.open0, open1: piece.open1, gap0: piece.gap0, gap1: piece.gap1, caps: [capList[0], capList[capList.length - 1]], wide, rings: rings ? { tone: rings.tone ?? "lo" } : null };
      const core = G.cut(dense, piece.from, piece.to);
      part.shapes.push(A.tube(core, r, { name: part.name, owner: owner ?? name }));
      part.world = { route, r, index };
      for (let i = 0; i < core.length; i++) {
        const t = G.unit3(sub3(core[Math.min(core.length - 1, i + 1)], core[Math.max(0, i - 1)]));
        const F = G.frameAlong(core[i], t);
        for (let j = 0; j < 10; j++) part.samples.push(local(group, G.pointOf(F, 0, r, (j / 10) * TAU)));
      }
      part.hints.push(G.unit3(sub3(core[1], core[0])), G.unit3(sub3(core[core.length - 1], core[core.length - 2])));
      T.parts.push(part);
      return part;
    });
    return { name, chunks, total, dense };
  };
  T.fixed = (options) => {
    const part = common(options, "fixed");
    const anchor = options.anchor;
    for (const shape of options.shapes ?? []) record(part, shape);
    const world = part.shapes.flatMap((shape) => sampleShape(shape, 48));
    const flat = world.map((p) => k.iso(p, P));
    const hull = options.hull ?? hull2(flat);
    const box = A.markupBox(options.svg) ?? [Math.min(...hull.map((p) => p[0])), Math.min(...hull.map((p) => p[1])), Math.max(...hull.map((p) => p[0])), Math.max(...hull.map((p) => p[1]))];
    part.svg = options.svg;
    const F = options.F ? frameFrom(options.F) : null;
    part.spec = { anchor: local(part.group, anchor), home: k.iso(anchor, P), box: [box[0] - 0.5, box[1] - 0.5, box[2] + 0.5, box[3] + 0.5], hull: hull.flat(), F: F ? { o: local(part.group, F.o), a: F.a, u: F.u, v: F.v } : null };
    if (F && !options.skipDetails) detailParts(part, F, null, null);
    part.samples = world.map((p) => local(part.group, p));
    if (F) part.hints.push(F.a);
    T.parts.push(part);
    return part;
  };
  T.item = (options) => {
    const part = common(options, "item");
    const cloud = options.cloud ?? [[0, 0, 0]];
    part.spec = { item: 1 };
    part.cloud = cloud.map((p) => local(part.group, p)).flat();
    part.samples = cloud.map((p) => local(part.group, p));
    T.parts.push(part);
    return part;
  };
  T.plane = ({ part, o, u, v, svg, fade = [0.04, 0.3], normal = null }) => {
    const U = G.unit3(u);
    const W = G.unit3(v);
    const n = normal ? G.unit3(normal) : G.unit3(G.cross3(U, W));
    part.planes.push({ o: local(part.group, o), u: U, v: W, n, fade, svg });
    return part;
  };
  T.billboard = ({ part, at, normal, svg, fade = [0.04, 0.3] }) => {
    part.planes.push({ o: local(part.group, at), u: [1, 0, 0], v: [0, 1, 0], n: G.unit3(normal), fade, svg, billboard: true });
    return part;
  };
  const drop = (part) => {
    T.parts.splice(T.parts.indexOf(part), 1);
    T.parts.forEach((p, index) => (p.id = index));
  };
  T.split = (part, { n, d }) => {
    const N = G.unit3(n);
    if (part.kind === "prism") {
      const { F, ring, s0, s1 } = part.world;
      const along = dot3(N, F.a);
      const base = { name: part.name, owner: part.owner, group: part.group, layer: part.layer, tone: part.tone, crease: part.crease, lit: part.lit, material: part.material, details: { ...part.details }, bevel: part.spec.bevel };
      let halves;
      if (Math.abs(Math.abs(along) - 1) < 1e-6) {
        const sCut = (d - dot3(N, F.o)) / along;
        if (!(sCut > s0 + 1e-6 && sCut < s1 - 1e-6)) throw new Error(`turning: split plane misses ${part.name}`);
        halves = [{ s0, s1: sCut }, { s0: sCut, s1 }].map((span) => ({ ...base, F, polygon: ring, s0: span.s0, s1: span.s1 }));
      } else if (Math.abs(along) < 1e-6) {
        const nu = dot3(N, F.u);
        const nv = dot3(N, F.v);
        const c = d - dot3(N, F.o);
        const side = (p) => nu * p[0] + nv * p[1] - c;
        const clip = (sign) => {
          const out = [];
          for (let i = 0; i < ring.length; i++) {
            const a = ring[i];
            const b = ring[(i + 1) % ring.length];
            const sa = sign * side(a);
            const sb = sign * side(b);
            if (sa <= 0) out.push(a);
            if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
              const t = sa / (sa - sb);
              out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
            }
          }
          return out;
        };
        halves = [clip(1), clip(-1)].map((polygon) => ({ ...base, F, polygon, s0, s1 }));
        if (halves.some((h) => h.polygon.length < 3)) throw new Error(`turning: split plane misses ${part.name}`);
      } else throw new Error(`turning: a prism can only be split by a plane along or across its axis (${part.name})`);
      part.dead = true;
      if (T.R) T.R.solids.splice(T.R.solids.indexOf(part.shapes[0]), 1);
      const made = halves.map((h, index) => T.prism({ ...h, name: `${part.name}.${index ? "b" : "a"}`, round: 0, details: index ? { ...h.details, dots: [] } : h.details }));
      for (const half of made) {
        half.spec.cuts = [...(part.spec.cuts ?? []), { n: N, d: d - dot3(N, half.group ? half.group.origin : [0, 0, 0]) }];
        half.hints.unshift(N);
      }
      drop(part);
      return made;
    }
    if (part.kind === "round" || (part.kind === "fixed" && part.round)) {
      const { F, s0, s1, r0, r1, ends } = part.round ?? part.world;
      const along = dot3(N, F.a);
      if (Math.abs(Math.abs(along) - 1) > 1e-6) throw new Error(`turning: a round can only be split across its axis (${part.name})`);
      const sCut = (d - dot3(N, F.o)) / along;
      if (!(sCut > s0 + 1e-6 && sCut < s1 - 1e-6)) throw new Error(`turning: split plane misses ${part.name}`);
      const rAt = r0 + ((r1 - r0) * (sCut - s0)) / (s1 - s0);
      part.dead = true;
      if (T.R) T.R.solids.splice(T.R.solids.indexOf(part.shapes[0]), 1);
      const base = { owner: part.owner, group: part.group, layer: part.layer, tone: part.tone, crease: part.crease, lit: part.lit, material: part.material, F, fixed: false };
      const made = [
        T.round({ ...base, name: `${part.name}.a`, s0, s1: sCut, r: [r0, rAt], ends: [ends[0], "open"], details: part.details }),
        T.round({ ...base, name: `${part.name}.b`, s0: sCut, s1, r: [rAt, r1], ends: ["open", ends[1]] }),
      ];
      for (const half of made) {
        half.spec.cuts = [...(part.spec.cuts ?? []), { n: N, d: d - dot3(N, half.group ? half.group.origin : [0, 0, 0]) }];
        half.hints.unshift(N);
      }
      drop(part);
      return made;
    }
    throw new Error(`turning: split supports prisms and rounds (${part.name})`);
  };
  T.build = (options = {}) => build(T, options);
  return T;
}

export { gjk, pack, roundedPolygon, sampleShape, separate } from "./turn-build-analysis.mjs";
