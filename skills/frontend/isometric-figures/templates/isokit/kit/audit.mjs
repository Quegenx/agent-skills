// Split from audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { add3, sub3, mul3, dot3, unit3, pathLength, curveRuns, cut as cutAlong, tangentAlong } from "./lathe.mjs";
import { runsOf } from "./tube.mjs";
import { depthOrder, explodeStates, settle } from "./audit-depth.mjs";
import { BIG, boundsOf, box, cameraBasis, cutDistance, labelOf, matches, moved, offsetOf, overlaps, polygonDistance, ring, screenBox, sdf, seatedOn, tube } from "./audit-geometry.mjs";
import { clearances, crowding, folds, linksOf, looseEnds, mountsOf, offsetAt, samplesOf, seats, selfOverlaps, slenderOf, terminals } from "./audit-routes.mjs";



function surfaceOf(shape, spacing = 0.6) {
  const points = [];
  if (shape.kind === "body") {
    const { F, poly } = shape;
    const u = F.u ?? unit3(Math.abs(F.a[2]) > 0.9 ? [1, 0, 0] : [-F.a[1], F.a[0], 0]);
    const v = F.v ?? [F.a[1] * u[2] - F.a[2] * u[1], F.a[2] * u[0] - F.a[0] * u[2], F.a[0] * u[1] - F.a[1] * u[0]];
    for (let i = 0; i < poly.length - 1; i++) {
      const [s0, r0] = poly[i];
      const [s1, r1] = poly[i + 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(s1 - s0, r1 - r0) / spacing));
      for (let j = 0; j <= steps; j++) {
        const s = s0 + ((s1 - s0) * j) / steps;
        const r = r0 + ((r1 - r0) * j) / steps;
        const around = Math.max(1, Math.min(160, Math.ceil((2 * Math.PI * r) / spacing)));
        for (let k = 0; k < around; k++) {
          const t = (k / around) * 2 * Math.PI;
          points.push(add3(add3(F.o, mul3(F.a, s)), add3(mul3(u, r * Math.cos(t)), mul3(v, r * Math.sin(t)))));
        }
      }
    }
  } else if (shape.kind === "box") {
    for (let axis = 0; axis < 3; axis++)
      for (const sign of [-1, 1]) {
        const o1 = (axis + 1) % 3;
        const o2 = (axis + 2) % 3;
        const n1 = Math.max(1, Math.ceil((2 * shape.half[o1]) / spacing));
        const n2 = Math.max(1, Math.ceil((2 * shape.half[o2]) / spacing));
        for (let i = 0; i <= n1; i++)
          for (let j = 0; j <= n2; j++) {
            const c = [0, 0, 0];
            c[axis] = sign * shape.half[axis];
            c[o1] = -shape.half[o1] + (2 * shape.half[o1] * i) / n1;
            c[o2] = -shape.half[o2] + (2 * shape.half[o2] * j) / n2;
            points.push(add3(shape.o, add3(add3(mul3(shape.axes[0], c[0]), mul3(shape.axes[1], c[1])), mul3(shape.axes[2], c[2]))));
          }
      }
  } else if (shape.kind === "prism") {
    const { F, poly, s0, s1 } = shape;
    const at = (s, x, y) => add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
    const rows = Math.max(1, Math.ceil((s1 - s0) / spacing));
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x0, y0] = poly[j];
      const [x1, y1] = poly[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / spacing));
      for (let k = 0; k < steps; k++)
        for (let row = 0; row <= rows; row++) points.push(at(s0 + ((s1 - s0) * row) / rows, x0 + ((x1 - x0) * k) / steps, y0 + ((y1 - y0) * k) / steps));
    }
    const xs = poly.map(([x]) => x);
    const ys = poly.map(([, y]) => y);
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += spacing)
      for (let y = Math.min(...ys); y <= Math.max(...ys); y += spacing) if (polygonDistance(poly, x, y) < 0) points.push(at(s0, x, y), at(s1, x, y));
  } else if (shape.kind === "ball") {
    const count = Math.max(24, Math.min(600, Math.ceil((4 * Math.PI * shape.r * shape.r) / (spacing * spacing))));
    for (let i = 0; i < count; i++) {
      const z = 1 - (2 * (i + 0.5)) / count;
      const ring = Math.sqrt(1 - z * z);
      const t = i * 2.399963;
      points.push(add3(shape.o, mul3([ring * Math.cos(t), ring * Math.sin(t), z], shape.r)));
    }
    if (shape.flats) {
      const kept = points.filter((p) => shape.flats.every(([nx, ny, nz, cut]) => nx * (p[0] - shape.o[0]) + ny * (p[1] - shape.o[1]) + nz * (p[2] - shape.o[2]) <= cut + 1e-9));
      points.length = 0;
      points.push(...kept);
      for (const [nx, ny, nz, cut] of shape.flats) {
        const n = [nx, ny, nz];
        const helper = Math.abs(nz) > 0.9 ? [1, 0, 0] : [0, 0, 1];
        const u = unit3([helper[1] * nz - helper[2] * ny, helper[2] * nx - helper[0] * nz, helper[0] * ny - helper[1] * nx]);
        const v = [ny * u[2] - nz * u[1], nz * u[0] - nx * u[2], nx * u[1] - ny * u[0]];
        const rho = Math.sqrt(Math.max(0, shape.r * shape.r - cut * cut));
        const centre = add3(shape.o, mul3(n, cut));
        for (let x = -rho; x <= rho; x += spacing)
          for (let y = -rho; y <= rho; y += spacing) {
            if (x * x + y * y > rho * rho) continue;
            const p = add3(centre, add3(mul3(u, x), mul3(v, y)));
            if (shape.flats.every(([mx, my, mz, other]) => mx * (p[0] - shape.o[0]) + my * (p[1] - shape.o[1]) + mz * (p[2] - shape.o[2]) <= other + 1e-6)) points.push(p);
          }
      }
    }
  } else {
    for (const { p, r } of samplesOf(shape, spacing)) for (let k = 0; k < 8; k++) points.push(add3(p, mul3([Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4), 0], r)));
  }
  return shape.cut ? points.filter((p) => cutDistance(shape, p) >= -1e-3) : points;
}


export const grounded = (shape) => Boolean(shape.ground) || (shape.name ?? "").startsWith("stand.");


export function supports(solids, tubes, { ground = grounded, touch = 0.15, sunk = 0.5 } = {}) {
  const nodes = [...solids, ...tubes.filter((tube) => !tube.limp)];
  const surfaces = nodes.map((shape) => surfaceOf(shape));
  const links = nodes.map(() => []);
  const deep = [];
  for (let a = 0; a < nodes.length; a++) {
    const ba = boundsOf(nodes[a]);
    for (let b = a + 1; b < nodes.length; b++) {
      const bb = boundsOf(nodes[b]);
      if (!overlaps(ba, bb, touch + 0.05)) continue;
      const same = (nodes[a].owner && (nodes[a].owner === nodes[b].owner || nodes[a].owner === nodes[b].name)) || (nodes[b].owner && nodes[b].owner === nodes[a].name);
      let gap = BIG;
      for (const p of surfaces[a]) gap = Math.min(gap, sdf(nodes[b], p));
      for (const p of surfaces[b]) gap = Math.min(gap, sdf(nodes[a], p));
      if (gap <= touch) links[a].push(b), links[b].push(a);
      const solidPair = nodes[a].kind !== "tube" && nodes[b].kind !== "tube";
      if (solidPair && !same && gap < -sunk && !seatedOn(nodes[a], nodes[b]) && !seatedOn(nodes[b], nodes[a])) deep.push({ a: nodes[a].name, b: nodes[b].name, depth: -gap });
    }
  }
  const held = new Uint8Array(nodes.length);
  const queue = [];
  nodes.forEach((shape, index) => ground(shape) && ((held[index] = 1), queue.push(index)));
  while (queue.length) {
    const index = queue.pop();
    for (const next of links[index]) if (!held[next]) (held[next] = 1), queue.push(next);
  }
  const loose = nodes.filter((_, index) => !held[index] && nodes[index].kind !== "tube").map((shape) => shape.name);
  const hanging = nodes.filter((_, index) => !held[index] && nodes[index].kind === "tube").map((shape) => shape.name);
  return { loose, hanging, sunk: deep.sort((x, y) => y.depth - x.depth) };
}


const multiply = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];


function matrixOf(text) {
  let m = [1, 0, 0, 1, 0, 0];
  if (!text) return m;
  for (const [, kind, args] of text.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const v = (args.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    let n = [1, 0, 0, 1, 0, 0];
    if (kind === "matrix" && v.length === 6) n = v;
    else if (kind === "translate") n = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
    else if (kind === "scale") n = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0];
    else if (kind === "rotate") {
      const a = ((v[0] ?? 0) * Math.PI) / 180;
      const [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      n = multiply(multiply([1, 0, 0, 1, cx, cy], [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    else if (kind === "skewX") n = [1, 0, Math.tan((v[0] ?? 0) * Math.PI / 180), 1, 0, 0];
    else if (kind === "skewY") n = [1, Math.tan((v[0] ?? 0) * Math.PI / 180), 0, 1, 0, 0];
    m = multiply(m, n);
  }
  return m;
}


const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;


const attributeOf = (attrs, name) => {
  const hit = [...attrs.matchAll(/(?:^|\s)([^\s=/>]+)\s*=\s*(["'])([\s\S]*?)\2/g)].find((match) => match[1] === name);
  if (!hit) return null;
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return hit[3].replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (all, code) => {
    if (code[0] !== "#") return named[code];
    const value = code[1] === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : all;
  });
};


function pointsOfShape(tag, attrs) {
  const get = (name) => attributeOf(attrs, name);
  const num = (name) => Number(get(name) ?? 0);
  if (tag === "path") {
    const d = get("d") ?? "";
    const out = [];
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    for (const [, command, args] of d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g)) {
      const v = (args.match(NUMBER) ?? []).map(Number);
      const rel = command === command.toLowerCase();
      const C = command.toUpperCase();
      const pair = (i) => [v[i] + (rel ? x : 0), v[i + 1] + (rel ? y : 0)];
      const take = (p) => {
        out.push(p);
        return p;
      };
      if (C === "H") for (const value of v) [x] = take([value + (rel ? x : 0), y]);
      else if (C === "V") for (const value of v) [, y] = take([x, value + (rel ? y : 0)]);
      else if (C === "A") for (let i = 0; i + 6 < v.length; i += 7) [x, y] = take([v[i + 5] + (rel ? x : 0), v[i + 6] + (rel ? y : 0)]);
      else if (C === "Z") {
        x = sx;
        y = sy;
      } else {
        const width = C === "C" ? 6 : C === "S" || C === "Q" ? 4 : 2;
        for (let i = 0; i + 1 < v.length; i += width) {
          for (let j = 0; j < width; j += 2) out.push(pair(i + j));
          [x, y] = pair(i + width - 2);
          if (C === "M" && i === 0) {
            sx = x;
            sy = y;
          }
        }
      }
    }
    return out;
  }
  if (tag === "circle" || tag === "ellipse") {
    const r = Number(get("r") ?? get("rx") ?? 0);
    const ry = Number(get("r") ?? get("ry") ?? 0);
    return [[num("cx") - r, num("cy") - ry], [num("cx") + r, num("cy") + ry]];
  }
  if (tag === "line") return [[num("x1"), num("y1")], [num("x2"), num("y2")]];
  if (tag === "rect") return cornersOfBox([num("x"), num("y"), num("x") + num("width"), num("y") + num("height")]);
  if (tag === "polyline" || tag === "polygon") {
    const v = (get("points") ?? "").match(NUMBER)?.map(Number) ?? [];
    const out = [];
    for (let i = 0; i + 1 < v.length; i += 2) out.push([v[i], v[i + 1]]);
    return out;
  }
  return [];
}


const boxOfPoints = (points, m) => {
  let box = null;
  for (const [x, y] of points) {
    const px = m[0] * x + m[2] * y + m[4];
    const py = m[1] * x + m[3] * y + m[5];
    box = box ? [Math.min(box[0], px), Math.min(box[1], py), Math.max(box[2], px), Math.max(box[3], py)] : [px, py, px, py];
  }
  return box;
};

const cornersOfBox = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const boxOfShape = (tag, attrs, m) => {
  if (tag !== "circle" && tag !== "ellipse") return boxOfPoints(pointsOfShape(tag, attrs), m);
  const num = (name) => Number(attributeOf(attrs, name) ?? 0);
  const rx = tag === "circle" ? num("r") : num("rx");
  const ry = tag === "circle" ? rx : num("ry");
  const x = m[0] * num("cx") + m[2] * num("cy") + m[4];
  const y = m[1] * num("cx") + m[3] * num("cy") + m[5];
  const dx = Math.hypot(m[0] * rx, m[2] * ry);
  const dy = Math.hypot(m[1] * rx, m[3] * ry);
  return [x - dx, y - dy, x + dx, y + dy];
};

const unionBox = (a, b) => (!a ? b : !b ? a : [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);

const meetBox = (a, b) => {
  if (!a || !b) return a ?? null;
  const box = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
  return box[0] <= box[2] && box[1] <= box[3] ? box : null;
};

const areaOf = (box) => (box ? Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]) : 0);


export function markupBox(svg) {
  const tags = [...svg.matchAll(/<(\/?)([a-zA-Z]+)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g)];
  const clips = new Map();
  let clipId = null;
  for (const [, close, tag, attrs, self] of tags) {
    if (tag === "clipPath" && !close) {
      const id = attributeOf(attrs, "id");
      if (id) clips.set(id, null);
      clipId = self ? null : id;
      continue;
    }
    if (clipId) {
      if (tag === "clipPath" && close) {
        clipId = null;
        continue;
      }
      clips.set(clipId, unionBox(clips.get(clipId), boxOfShape(tag, attrs, matrixOf(attributeOf(attrs, "transform")))));
    }
  }
  const stack = [{ m: [1, 0, 0, 1, 0, 0], clip: null, skip: false }];
  let box = null;
  for (const [, close, tag, attrs, self] of tags) {
    const top = stack[stack.length - 1];
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const m = multiply(top.m, matrixOf(attributeOf(attrs, "transform")));
    const ref = ((attributeOf(attrs, "clip-path") ?? "").match(/url\(#([^)]*)\)/) ?? [])[1];
    const own = ref && clips.get(ref) ? boxOfPoints(cornersOfBox(clips.get(ref)), m) : null;
    const clip = own ? meetBox(top.clip ?? own, own) : top.clip;
    const empty = ref && clips.has(ref) && (!own || areaOf(own) === 0 || (top.clip && (!clip || areaOf(clip) === 0)));
    const frame = { m, clip, skip: Boolean(empty) || top.skip || ["defs", "clipPath", "mask", "linearGradient", "radialGradient", "pattern", "text", "title"].includes(tag) || (attributeOf(attrs, "class") ?? "").includes("iso-halo") };
    if (!frame.skip) {
      const shape = boxOfShape(tag, attrs, m);
      if (shape) box = unionBox(box, frame.clip ? meetBox(shape, frame.clip) : shape);
    }
    if (!self) stack.push(frame);
  }
  return box;
}


export function footprintOf(shape, cam) {
  const flat = (p) => [cam.origin[0] + dot3(p, cam.R) * cam.k, cam.origin[1] + dot3(p, cam.D) * cam.k];
  if (shape.kind === "body") {
    const { F } = shape;
    const points = [];
    for (const [s, r] of shape.poly) {
      if (r <= 0) {
        points.push(flat(add3(F.o, mul3(F.a, s))));
        continue;
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        points.push(flat(add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, r * Math.cos(a)), mul3(F.v, r * Math.sin(a))))));
      }
    }
    return boxOfPoints(points, [1, 0, 0, 1, 0, 0]);
  }
  if (shape.kind === "prism") {
    const { F } = shape;
    const points = [];
    for (const s of [shape.s0, shape.s1]) for (const [x, y] of shape.poly) points.push(flat(add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)))));
    return boxOfPoints(points, [1, 0, 0, 1, 0, 0]);
  }
  const [x0, y0, x1, y1] = screenBox(shape, cam, [0, 0, 0]);
  return [x0, y0, x1, y1];
}


export function coverage(items, P, { least = 0.6, pad = 1, allow = [] } = {}) {
  const cam = cameraBasis(P);
  const out = [];
  for (const item of items) {
    if (typeof item.svg !== "string" || !item.shapes || !item.shapes.length || matches(allow, item.name)) continue;
    const drawn = markupBox(item.svg);
    if (!drawn) continue;
    const grow = (box) => [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
    const shapes = item.shapes.map((shape) => footprintOf(shape, cam)).reduce(unionBox, null);
    const share = areaOf(meetBox(grow(drawn), grow(shapes))) / (areaOf(grow(drawn)) || 1);
    if (share < least) out.push({ name: item.name, share, drawn, shapes });
  }
  return out.sort((a, b) => a.share - b.share);
}


export function solidClearances(solids, { state, sunk = 0.5, spacing = 0.6, cell = 4 } = {}) {
  const stretched = new Set();
  const list = solids.filter((shape) => shape.kind !== "tube").map((shape) => {
    if (!(shape.slide && state !== undefined && shape.move)) return shape;
    const next = { ...moved(shape, offsetOf(shape, state)), move: undefined };
    if (next.slide.to !== shape.slide.to) stretched.add(next);
    return next;
  });
  if (!solidClearances.cache) solidClearances.cache = new WeakMap();
  const cache = solidClearances.cache;
  const gridOf = (shape) => {
    let samples = cache.get(shape);
    if (!samples) cache.set(shape, samples = new Map());
    const key = `${spacing}:${cell}`;
    let grid = samples.get(key);
    if (grid) return grid;
    grid = new Map();
    for (const p of surfaceOf(shape, spacing)) {
      const key = p.map((v) => Math.floor(v / cell)).join(",");
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(p);
    }
    samples.set(key, grid);
    return grid;
  };
  const pointsIn = (shape, box) => {
    const grid = gridOf(shape);
    const lo = box.min.map((v) => Math.floor(v / cell));
    const hi = box.max.map((v) => Math.floor(v / cell));
    const out = [];
    if ((hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1) > grid.size) {
      for (const points of grid.values()) for (const p of points) if (p.every((v, i) => v >= box.min[i] && v <= box.max[i])) out.push(p);
      return out;
    }
    for (let x = lo[0]; x <= hi[0]; x++)
      for (let y = lo[1]; y <= hi[1]; y++)
        for (let z = lo[2]; z <= hi[2]; z++) {
          const points = grid.get(`${x},${y},${z}`);
          if (points) for (const p of points) if (p.every((v, i) => v >= box.min[i] && v <= box.max[i])) out.push(p);
        }
    return out;
  };
  const offsets = list.map((shape) => offsetAt(shape, state));
  const bounds = list.map((shape) => boundsOf(shape));
  const found = [];
  for (let a = 0; a < list.length; a++)
    for (let b = a + 1; b < list.length; b++) {
      const rel = sub3(offsets[a], offsets[b]);
      if (Math.abs(rel[0]) + Math.abs(rel[1]) + Math.abs(rel[2]) < 1e-6 && !stretched.has(list[a]) && !stretched.has(list[b])) continue;
      const box = { min: [0, 1, 2].map((i) => Math.max(bounds[a].min[i] + rel[i], bounds[b].min[i])), max: [0, 1, 2].map((i) => Math.min(bounds[a].max[i] + rel[i], bounds[b].max[i])) };
      if (box.min.some((v, i) => v > box.max[i] - sunk)) continue;
      if (seatedOn(list[a], list[b]) || seatedOn(list[b], list[a])) continue;
      let worst = -sunk;
      let at = null;
      const local = { min: sub3(box.min, rel), max: sub3(box.max, rel) };
      for (const p of pointsIn(list[a], local)) {
        const d = sdf(list[b], add3(p, rel));
        if (d < worst) (worst = d), (at = add3(p, offsets[a]));
      }
      for (const p of pointsIn(list[b], box)) {
        const d = sdf(list[a], sub3(p, rel));
        if (d < worst) (worst = d), (at = add3(p, offsets[b]));
      }
      if (at) found.push({ tube: list[a].name, other: list[b].name, kind: "through", solid: true, clearance: worst, need: -sunk, at, from: 0, to: 0, length: 0, state: state === undefined ? "" : labelOf(state) });
    }
  return found.sort((x, y) => x.clearance - y.clearance);
}


export function wobble(solids, { samples = 20 } = {}) {
  const out = [];
  for (const shape of solids) {
    const profile = shape.curve;
    if (!profile) continue;
    const segments = curveRuns(profile);
    let run = [];
    const flush = () => {
      if (run.length) {
        const values = [];
        for (const index of run) {
          const [s0] = profile[index];
          const [s1] = profile[index + 1];
          for (let j = values.length ? 1 : 0; j <= samples; j++) {
            const s = s0 + ((s1 - s0) * j) / samples;
            values.push([s, segments[index].slope(s)]);
          }
        }
        const scale = Math.max(1, ...values.map(([, g]) => Math.abs(g))) * 1e-6;
        const turns = [];
        let last = 0;
        for (let i = 1; i < values.length; i++) {
          const d = values[i][1] - values[i - 1][1];
          if (Math.abs(d) <= scale) continue;
          const sign = Math.sign(d);
          if (last && sign !== last) turns.push(Math.round(values[i - 1][0] * 100) / 100);
          last = sign;
        }
        if (turns.length) out.push({ name: shape.name, at: turns, from: profile[run[0]][0], to: profile[run[run.length - 1] + 1][0] });
      }
      run = [];
    };
    segments.forEach((segment, index) => (segment ? run.push(index) : flush()));
    flush();
  }
  return out;
}


export function report({ clearance = [], depth = { problems: [], missing: [] }, terminals: ends, folds: bends, supports: held, loose, apart, flight, crowding: crowded, self, wobble: wobbly, seats: seated, cover: covered } = {}, { limit = 4000 } = {}) {
  const lines = [];
  const f = (v) => (Math.round(v * 100) / 100).toFixed(2);
  const p3 = (p) => `[${p.map((v) => v.toFixed(1)).join(", ")}]`;
  const clash = (c) => (c.solid ? `  solid   ${c.state ? c.state + "  " : ""}${c.tube}  ×  ${c.other}   sunk ${f(-c.clearance)} deep   at ${p3(c.at)}` : `  ${c.kind.padEnd(7)} ${c.state ? c.state + "  " : ""}${c.tube}  ×  ${c.other}   clearance ${f(c.clearance)} < ${f(c.need)}   along ${f(c.from)}\u2013${f(c.to)} of ${f(c.length)}   at ${p3(c.at)}`);
  lines.push(`clearance: ${clearance.length} problem${clearance.length === 1 ? "" : "s"}`);
  for (const c of clearance.slice(0, limit)) lines.push(clash(c));
  if (apart) {
    lines.push(`clearance apart: ${apart.length} problem${apart.length === 1 ? "" : "s"}`);
    for (const c of apart.slice(0, limit)) lines.push(clash(c));
  }
  if (ends) {
    lines.push(`terminals: ${ends.length} end${ends.length === 1 ? "" : "s"} not on a mount`);
    for (const e of ends.slice(0, limit)) lines.push(`  ${e.tube} ${e.end}  ${Number.isFinite(e.d) ? f(e.d) : "∞"} from ${e.nearest} (rim ${Number.isFinite(e.high) ? `${f(e.low)}…${f(e.high)}` : "-"})   at ${p3(e.at)}`);
  }
  if (loose) {
    const hanging = loose.filter((e) => !e.free);
    lines.push(`loose ends: ${hanging.length}`);
    for (const e of hanging.slice(0, limit)) lines.push(`  ${e.state}  ${e.tube} ${e.end} touches nothing that moves with it   at ${p3(e.at)}`);
  }
  if (bends) {
    lines.push(`screen folds: ${bends.length}`);
    for (const b of bends.slice(0, limit))
      lines.push(b.kind === "pinch" ? `  ${b.name}  turns ${b.flatTurn.toFixed(0)}° on screen round a ${f(b.radius)} px bend, under ${f(b.width * 2)} px for a ${f(b.width)} px tube   at ${p3(b.at)}` : `  ${b.name}  turns ${b.flatTurn.toFixed(0)}° on screen for ${b.realTurn.toFixed(0)}° in 3D   at ${p3(b.at)}`);
  }
  if (held) {
    const hanging = held.hanging ?? [];
    lines.push(`support: ${held.loose.length} unsupported solid${held.loose.length === 1 ? "" : "s"} · ${hanging.length} hanging tube${hanging.length === 1 ? "" : "s"} · ${held.sunk.length} sunk pair${held.sunk.length === 1 ? "" : "s"}`);
    for (const name of held.loose.slice(0, limit)) lines.push(`  loose   ${name}`);
    for (const name of hanging.slice(0, limit)) lines.push(`  hanging ${name}`);
    for (const d of held.sunk.slice(0, limit)) lines.push(`  sunk    ${d.a} × ${d.b}   ${f(d.depth)} deep`);
  }
  lines.push(`depth order: ${depth.problems.length} problem${depth.problems.length === 1 ? "" : "s"}`);
  for (const d of depth.problems.slice(0, limit))
    lines.push(`  ${d.cycle ? "cycle " : "order "} ${d.label}  ${d.front} (k ${f(d.frontKey)}) is in front of ${d.back} (k ${f(d.backKey)}) but drawn first   ${f(d.area)} px²${d.against ? ` (${f(d.against)} px² the other way)` : ""}, up to ${f(d.depth)} nearer, at ${d.at.map((v) => v.toFixed(1)).join(",")}`);
  if (flight) {
    lines.push(`through in mid-flight: ${flight.length} pair${flight.length === 1 ? "" : "s"}`);
    for (const c of flight.slice(0, limit)) lines.push(clash(c));
  }
  if (self) {
    lines.push(`self-overlap: ${self.length} chunk${self.length === 1 ? "" : "s"} whose outline crosses itself on screen`);
    for (const c of self.slice(0, limit)) lines.push(`  ${c.name}  its outline folds back on screen: the line turns on a ${f(c.radius)} px radius, under its ${f(c.width)} px half-width   at ${p3(c.at)}, screen ${c.screen.map((v) => v.toFixed(1)).join(",")}`);
  }
  if (wobbly) {
    lines.push(`wobble: ${wobbly.length} smoothed profile${wobbly.length === 1 ? "" : "s"} whose slope turns between its ends`);
    for (const w of wobbly.slice(0, limit)) lines.push(`  ${w.name}  dr/ds turns at s = ${w.at.join(", ")} on the run ${f(w.from)}\u2013${f(w.to)}; give it an analytic profile and smooth.slope`);
  }
  if (seated) {
    lines.push(`saddles off their host apart: ${seated.length}`);
    for (const d of seated.slice(0, limit)) lines.push(`  ${d.name} (${d.piece}) is cut to ${d.host} (${d.hostPiece}); apart, its cut base is on show`);
  }
  if (covered) {
    lines.push(`stand-in shapes: ${covered.length} item${covered.length === 1 ? "" : "s"} whose recorded shape covers too little of what it draws`);
    for (const c of covered.slice(0, limit)) lines.push(`  ${c.name}  its shapes cover ${Math.round(c.share * 100)}% of its drawing (drawn ${c.drawn.map((v) => v.toFixed(0)).join(",")}, recorded ${c.shapes.map((v) => v.toFixed(0)).join(",")}); record the true shape of what you draw`);
  }
  if (crowded) {
    lines.push(`crowding: ${crowded.length} pair${crowded.length === 1 ? "" : "s"} where a bend or end touches another line on screen`);
    for (const c of crowded.slice(0, limit)) lines.push(`  ${c.state ? c.state + "  " : ""}${c.a} ${c.where}  ×  ${c.b}   outlines ${c.gap < 0 ? `overlap ${f(-c.gap)}` : `${f(c.gap)} apart`} px, ${f(c.depth)} apart in depth   at screen ${c.screen.map((v) => v.toFixed(1)).join(",")}`);
  }
  if (depth.passing && depth.passing.length) {
    const pairs = (list) => new Set(list.map((d) => [d.front, d.back].sort().join("|"))).size;
    lines.push(`in passing (uniform explode states only, not failing): ${pairs(depth.passing.filter((d) => d.cycle))} interlocked pairs, ${pairs(depth.passing.filter((d) => !d.cycle))} pairs no linear key can order`);
    for (const d of depth.passing.slice(0, limit)) lines.push(`  ${d.cycle ? "cycle " : "unorderable"} ${d.label}  ${d.front} / ${d.back}   ${f(d.area)} px²`);
  }
  if (depth.missing.length) lines.push(`items with no shape: ${depth.missing.length}  ${depth.missing.slice(0, 20).join(", ")}`);
  if (loose && loose.some((e) => e.free)) {
    const free = loose.filter((e) => e.free);
    lines.push(`free ends apart (marked free, not failing): ${free.length}`);
    for (const e of free.slice(0, limit)) lines.push(`  ${e.tube} ${e.end}   at ${p3(e.at)}`);
  }
  return lines.join("\n");
}


export const failures = ({ clearance = [], depth = { problems: [], missing: [] }, terminals: ends = [], folds: bends = [], supports: held = { loose: [], sunk: [] }, loose = [], apart = [], flight = [], crowding: crowded = [], self = [], wobble: wobbly = [], seats: seated = [], cover: covered = [] }) =>
  covered.length + clearance.length + apart.length + flight.length + crowded.length + ends.length + loose.filter((e) => !e.free).length + bends.length + held.loose.length + (held.hanging ?? []).length + held.sunk.length + depth.problems.length + depth.missing.length + self.length + wobbly.length + seated.length;


export function recorder(P, { order = [], spring = {}, ground = grounded } = {}) {
  const V = cameraBasis(P).V;
  const counts = new Map();
  const R = { P, V, order, spring, ground, items: [], solids: [], tubes: [], routes: [], settled: null };
  R.nameFor = (base) => {
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}#${count}`;
  };
  R.solid = (shape) => {
    R.solids.push(shape);
    return shape;
  };
  R.put = ({ at = null, bias = 0, key, name, piece = "", move = [0, 0, 0], ride, shapes = [], ...rest } = {}) => {
    const item = { ...rest, piece, ride: ride ?? piece, key: key ?? (at ? dot3(at, V) : 0) + bias, move, shapes, name: name ?? R.nameFor(`${piece || "item"}.item`) };
    for (const shape of shapes) (shape.move = item.move), (shape.ride = item.ride), (shape.piece = piece);
    R.items.push(item);
    return item;
  };
  R.route = (name, points, radius, { owner = name, touch, bundle, limp = false, gaps = [], closed = false, ends = [true, true], rims, free = [false, false], piece = "", move = [0, 0, 0], ride = piece } = {}) => {
    const total = pathLength(points);
    const radiusOf = typeof radius === "function" ? radius : () => radius;
    const runs = runsOf(total, gaps);
    const recorded = runs.map(([from, to], index) => ({
      ...tube(cutAlong(points, from, to), (t) => radiusOf((from + (to - from) * t) / total), { name, owner, touch, bundle, limp, joined: true }),
      tips: closed ? [null, null] : [index === 0 && ends[0] ? points[0] : null, index === runs.length - 1 && ends[1] ? points[points.length - 1] : null],
      tipAxes: [tangentAlong(points, 0), tangentAlong(points, total)],
      tipRims: rims ?? [radiusOf(0), radiusOf(1)],
      free: [index === 0 && free[0], index === runs.length - 1 && free[1]],
      offset: from,
      total,
      move,
      ride,
      piece,
    }));
    R.tubes.push(...recorded);
    R.routes.push({ name, points, r: radiusOf(0.5), bundle, move, ride, piece });
    return recorded;
  };
  return R;
}


const worstOf = (lists) => [...lists.flat().reduce((all, c) => (all.has(`${c.tube}|${c.other}`) && all.get(`${c.tube}|${c.other}`).clearance <= c.clearance ? all : all.set(`${c.tube}|${c.other}`, c)), new Map()).values()].sort((x, y) => x.clearance - y.clearance);


export function audit(R, P = R.P, { allow = [], crowd = [], cover = [], ground = R.ground, frames = explodeStates(R.order, R.spring).frames, apart = R.order.length > 0 } = {}) {
  const { items, overlaps, solved } = R.settled ?? settle(R, P);
  const mounts = mountsOf(R.tubes, R.solids);
  const links = linksOf(R.tubes, mounts);
  return {
    clearance: clearances(R.tubes, R.solids, { mounts }),
    apart: apart ? [...clearances(R.tubes, R.solids, { state: 1, mounts, only: "through" }), ...solidClearances(R.solids, { state: 1 })] : [],
    flight: worstOf(frames.map((state) => [...clearances(R.tubes, R.solids, { state, mounts, only: "through" }), ...solidClearances(R.solids, { state })])),
    crowding: (apart ? [0, 1] : [0]).flatMap((state) => crowding(R.routes, P, { links, items, allow: crowd, state, rods: slenderOf(R.solids) })),
    cover: coverage(items, P, { allow: cover }),
    terminals: terminals(R.tubes, R.solids, { mounts }),
    loose: looseEnds(R.tubes, R.solids, { state: 1 }),
    folds: folds(R.routes, P, { items }),
    self: selfOverlaps(items, P),
    wobble: wobble(R.solids),
    seats: seats(R.solids),
    supports: supports(R.solids, R.tubes, { ground }),
    depth: depthOrder(items, P, { overlaps, solved, allow }),
  };
}


export function auditOrExit(R, P = R.P, { flag = "--audit", argv = process.argv, ...options } = {}) {
  if (!argv.includes(flag)) return null;
  const started = Date.now();
  const result = audit(R, P, options);
  const { overlaps, solved, states } = R.settled;
  console.log(report(result));
  console.log(`audit · ${R.tubes.length} tubes · ${R.solids.length} solids · ${R.items.length} items · ${states.length} depth states · ${overlaps.pairs.length} overlaps · ${solved.rules} order rules · ${((Date.now() - started) / 1000).toFixed(1)} s`);
  const count = failures(result);
  console.log(count ? `audit failed: ${count} problem${count === 1 ? "" : "s"}` : "audit passed");
  if (count) process.exitCode = 1;
  return result;
}

export { depthOrder, explodeStates, keyAt, orderKeys, overlapsOf, prefixStates, reversalsOf, settle, springStates, uniformStates } from "./audit-depth.mjs";

export { ball, body, boundsOf, box, cameraBasis, cylinder, disc, extruded, labelOf, lathe, moved, offsetOf, orientedBox, prism, ring, sameRun, sdf, shareOf, slab, slide, solid, traced, tube } from "./audit-geometry.mjs";

export { clearances, crowding, folds, linksOf, looseEnds, mountsOf, seats, selfOverlaps, slenderOf, terminals } from "./audit-routes.mjs";
