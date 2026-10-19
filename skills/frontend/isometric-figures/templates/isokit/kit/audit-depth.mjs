// Split from audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { add3, mul3, dot3 } from "./lathe.mjs";
import { cameraBasis, flatDistance, labelOf, matches, moved, offsetOf, overlaps, rayDepth, sameRun, screenBox, shareOf } from "./audit-geometry.mjs";



export function springStates(order, { stagger = 0.035, stiffness = 64, damping = 14.2, substeps = 4, fps = 60, settle = 1e-3, stride = 1, reversals = [] } = {}) {
  const out = [];
  const scripts = [[true], [false], ...reversals.flatMap((at) => [[true, at], [false, at]])];
  for (const [on, back] of scripts) {
    const springs = Object.fromEntries(order.map((id) => [id, { x: on ? 0 : 1, v: 0, target: on ? 0 : 1, pending: null }]));
    const toggle = (value, clock) => {
      const goal = value ? 1 : 0;
      let index = 0;
      for (const id of value ? order : [...order].reverse()) {
        if (springs[id].target === goal) springs[id].pending = null;
        else springs[id].pending = { value: goal, at: clock + index++ * stagger };
      }
    };
    const name = back === undefined ? (on ? "apart" : "together") : `${on ? "apart" : "together"}, back at ${back.toFixed(2)} s,`;
    const dt = 1 / fps;
    let clock = 0;
    let goal = on ? 1 : 0;
    toggle(on, 0);
    for (let frame = 0; frame < 100000; frame++) {
      if (back !== undefined && clock < back && clock + dt >= back) toggle(!on, back), (goal = on ? 0 : 1);
      clock += dt;
      for (const spring of Object.values(springs)) {
        if (spring.pending && clock >= spring.pending.at) (spring.target = spring.pending.value), (spring.pending = null);
        for (let index = 0; index < substeps; index++) {
          const h = dt / substeps;
          spring.v += ((spring.target - spring.x) * stiffness - spring.v * damping) * h;
          spring.x += spring.v * h;
        }
      }
      const settled = (back === undefined || clock >= back) && Object.values(springs).every((spring) => !spring.pending && Math.abs(spring.x - goal) < settle && Math.abs(spring.v) < settle);
      if (settled) break;
      if ((frame + 1) % stride === 0) out.push({ label: `${name} ${clock.toFixed(3)} s`, shares: Object.fromEntries(Object.entries(springs).map(([id, spring]) => [id, spring.x])) });
    }
  }
  return out;
}


export const uniformStates = (count = 10) => Array.from({ length: count + 1 }, (_, index) => index / count);


export const reversalsOf = (order, stagger = 0.035, margin = 0.008) => order.flatMap((_, index) => [index * stagger - margin, index * stagger + margin]).filter((at) => at > 0);


export function prefixStates(order, { shares = [0.25, 0.5, 0.75, 1] } = {}) {
  const out = [];
  for (let count = 1; count < order.length; count++)
    for (const s of shares)
      out.push({ label: `first ${count - 1} out, ${order[count - 1]} at ${s}`, shares: Object.fromEntries(order.map((id, index) => [id, index < count - 1 ? 1 : index === count - 1 ? s : 0])) });
  return out;
}


function rasterOf(item, cam, step, offset) {
  const shapes = item.shapes.map((shape) => moved(shape, offset));
  const flat = (p) => [cam.origin[0] + dot3(p, cam.R) * cam.k, cam.origin[1] + dot3(p, cam.D) * cam.k];
  const boxes = shapes.map((shape) => screenBox(shape, cam, [0, 0, 0]));
  const guides = shapes.map((shape) => {
    if (shape.kind === "tube") {
      const points = shape.points.map(flat);
      const widths = shape.radii.map((r) => r * cam.k);
      const boxes = new Float64Array((points.length - 1) * 4);
      for (let i = 0; i < points.length - 1; i++) {
        const pad = Math.max(widths[i], widths[i + 1]) + step * 0.5;
        boxes[i * 4] = Math.min(points[i][0], points[i + 1][0]) - pad;
        boxes[i * 4 + 1] = Math.max(points[i][0], points[i + 1][0]) + pad;
        boxes[i * 4 + 2] = Math.min(points[i][1], points[i + 1][1]) - pad;
        boxes[i * 4 + 3] = Math.max(points[i][1], points[i + 1][1]) + pad;
      }
      return { points, widths, boxes };
    }
    if (shape.kind === "body") {
      const s = shape.poly.map(([value]) => value);
      return { axis: [flat(add3(shape.F.o, mul3(shape.F.a, Math.min(...s)))), flat(add3(shape.F.o, mul3(shape.F.a, Math.max(...s))))], reach: Math.max(...shape.poly.map(([, r]) => r)) * cam.k };
    }
    return null;
  });
  const x0 = Math.floor(Math.min(...boxes.map((b) => b[0])) / step);
  const y0 = Math.floor(Math.min(...boxes.map((b) => b[1])) / step);
  const x1 = Math.ceil(Math.max(...boxes.map((b) => b[2])) / step);
  const y1 = Math.ceil(Math.max(...boxes.map((b) => b[3])) / step);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  return { x0, y0, x1, y1, w, h, boxes, shapes, guides, depth: null };
}


function depthAt(raster, cam, step, cx, cy) {
  if (!raster.depth) {
    raster.depth = new Float32Array(raster.w * raster.h);
    raster.done = new Uint8Array(raster.w * raster.h);
  }
  const cell = (cy - raster.y0) * raster.w + (cx - raster.x0);
  if (raster.done[cell]) return raster.depth[cell];
  const x = cx * step;
  const y = cy * step;
  const c = add3(mul3(cam.R, (x - cam.origin[0]) / cam.k), mul3(cam.D, (y - cam.origin[1]) / cam.k));
  let best = NaN;
  for (let index = 0; index < raster.shapes.length; index++) {
    const shape = raster.shapes[index];
    const b = raster.boxes[index];
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    const guide = raster.guides[index];
    let segments = null;
    if (shape.kind === "tube") {
      segments = [];
      const boxes = guide.boxes;
      for (let i = 0; i < guide.points.length - 1; i++) {
        if (x < boxes[i * 4] || x > boxes[i * 4 + 1] || y < boxes[i * 4 + 2] || y > boxes[i * 4 + 3]) continue;
        if (flatDistance(x, y, guide.points[i], guide.points[i + 1]) <= Math.max(guide.widths[i], guide.widths[i + 1]) + step * 0.5) segments.push(i);
      }
      if (!segments.length) continue;
    } else if (shape.kind === "body" && flatDistance(x, y, guide.axis[0], guide.axis[1]) > guide.reach + step) continue;
    const t = rayDepth(shape, c, cam.V, 0.02, segments);
    if (t !== null && !(t <= best)) best = t;
  }
  raster.depth[cell] = best;
  raster.done[cell] = 1;
  return best;
}


function regionOf(flags, gw, gh, value, step) {
  const n = gw * gh;
  const on = new Uint8Array(n);
  let all = 0;
  let inner = 0;
  for (let cell = 0; cell < n; cell++) if (flags[cell] === value) (on[cell] = 1), all++;
  if (!all) return { all, inner, area: 0 };
  const grow = new Uint8Array(n);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const cell = y * gw + x;
      if (on[cell] && x > 0 && x < gw - 1 && y > 0 && y < gh - 1 && on[cell - 1] && on[cell + 1] && on[cell - gw] && on[cell + gw]) inner++;
      if (on[cell] || (x > 0 && on[cell - 1]) || (x < gw - 1 && on[cell + 1]) || (y > 0 && on[cell - gw]) || (y < gh - 1 && on[cell + gw])) grow[cell] = 1;
    }
  const shut = new Uint8Array(n);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const cell = y * gw + x;
      shut[cell] = on[cell] || (grow[cell] && (x === 0 || grow[cell - 1]) && (x === gw - 1 || grow[cell + 1]) && (y === 0 || grow[cell - gw]) && (y === gh - 1 || grow[cell + gw])) ? 1 : 0;
    }
  const core = new Uint8Array(n);
  for (let y = 1; y < gh - 1; y++)
    for (let x = 1; x < gw - 1; x++) {
      const cell = y * gw + x;
      core[cell] = shut[cell] && shut[cell - 1] && shut[cell + 1] && shut[cell - gw] && shut[cell + gw] ? 1 : 0;
    }
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  let largest = 0;
  for (let start = 0; start < n; start++) {
    if (!core[start] || seen[start]) continue;
    let top = 0;
    let size = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top) {
      const cell = stack[--top];
      size++;
      const x = cell % gw;
      const y = (cell - x) / gw;
      const visit = (next) => {
        if (core[next] && !seen[next]) (seen[next] = 1), (stack[top++] = next);
      };
      if (x > 0) visit(cell - 1);
      if (x < gw - 1) visit(cell + 1);
      if (y > 0) visit(cell - gw);
      if (y < gh - 1) visit(cell + gw);
    }
    if (size > largest) largest = size;
  }
  return { all, inner, area: largest * step * step };
}


function measure(ra, rb, dx, dy, dz, cam, step, tolerance, least) {
  if (ra.x1 < rb.x0 + dx || rb.x1 + dx < ra.x0 || ra.y1 < rb.y0 + dy || rb.y1 + dy < ra.y0) return null;
  const ix0 = Math.max(ra.x0, rb.x0 + dx);
  const ix1 = Math.min(ra.x1, rb.x1 + dx);
  const iy0 = Math.max(ra.y0, rb.y0 + dy);
  const iy1 = Math.min(ra.y1, rb.y1 + dy);
  const gw = ix1 - ix0 + 1;
  const gh = iy1 - iy0 + 1;
  const flags = new Int8Array(gw * gh);
  const worst = [0, 0];
  const at = [null, null];
  let any = false;
  for (let y = iy0; y <= iy1; y++) {
    for (let x = ix0; x <= ix1; x++) {
      const ta = depthAt(ra, cam, step, x, y);
      if (Number.isNaN(ta)) continue;
      const tb = depthAt(rb, cam, step, x - dx, y - dy) + dz;
      if (Number.isNaN(tb)) continue;
      const cell = (y - iy0) * gw + (x - ix0);
      if (ta > tb + tolerance) {
        flags[cell] = 1;
        any = true;
        if (ta - tb > worst[0]) (worst[0] = ta - tb), (at[0] = [x * step, y * step]);
      } else if (tb > ta + tolerance) {
        flags[cell] = -1;
        any = true;
        if (tb - ta > worst[1]) (worst[1] = tb - ta), (at[1] = [x * step, y * step]);
      }
    }
  }
  if (!any) return null;
  const front = [regionOf(flags, gw, gh, 1, step), regionOf(flags, gw, gh, -1, step)];
  if (front[0].area < least && front[1].area < least) return null;
  return front.map((region, side) => ({ ...region, depth: worst[side], at: at[side] }));
}


export function overlapsOf(items, P, { step = 0.25, tolerance = 0.3, least = 0.25, states = [0], skip = () => false } = {}) {
  const cam = cameraBasis(P);
  const live = items.map((item, index) => ({ item, index })).filter(({ item }) => item.shapes && item.shapes.length);
  const homes = live.map(() => null);
  let uid = 0;
  const stamp = (raster) => Object.assign(raster, { uid: uid++ });
  const home = (index) => homes[index] ?? (homes[index] = stamp(rasterOf(live[index].item, cam, step, [0, 0, 0])));
  const sliding = live.map(({ item }) => item.shapes.some((shape) => shape.slide));
  const slid = new Map();
  const rasterAt = (index, offset) => {
    if (!sliding[index]) return home(index);
    const id = `${index}|${offset.map((v) => v.toFixed(2)).join(",")}`;
    if (!slid.has(id)) slid.set(id, stamp(rasterOf(live[index].item, cam, step, offset)));
    return slid.get(id);
  };
  const shiftOf = (offset) => ({ gx: Math.round((dot3(offset, cam.R) * cam.k) / step), gy: Math.round((dot3(offset, cam.D) * cam.k) / step), dz: dot3(offset, cam.V) });
  const memo = new Map();
  const pairs = [];
  for (const state of states) {
    const offsets = live.map(({ item }) => offsetOf(item, state));
    const shifts = live.map((_, index) => (sliding[index] ? { gx: 0, gy: 0, dz: 0 } : shiftOf(offsets[index])));
    for (let a = 0; a < live.length; a++) {
      const ra = rasterAt(a, offsets[a]);
      const sa = shifts[a];
      for (let b = a + 1; b < live.length; b++) {
        const rb = rasterAt(b, offsets[b]);
        const sb = shifts[b];
        if (ra.x1 + sa.gx < rb.x0 + sb.gx || rb.x1 + sb.gx < ra.x0 + sa.gx || ra.y1 + sa.gy < rb.y0 + sb.gy || rb.y1 + sb.gy < ra.y0 + sa.gy) continue;
        if (skip(live[a].item, live[b].item)) continue;
        const dx = sb.gx - sa.gx;
        const dy = sb.gy - sa.gy;
        const dz = sb.dz - sa.dz;
        const id = `${ra.uid}|${rb.uid}|${dx},${dy},${dz.toFixed(3)}`;
        let hit = memo.get(id);
        if (hit === undefined) {
          hit = measure(ra, rb, dx, dy, dz, cam, step, tolerance, least);
          memo.set(id, hit);
        }
        if (!hit) continue;
        pairs.push({ state, a: live[a].index, b: live[b].index, front: hit.map((side) => ({ ...side, at: side.at && [side.at[0] + sa.gx * step, side.at[1] + sa.gy * step] })) });
      }
    }
  }
  return { pairs, least, states, step, V: cam.V };
}


const liftOf = (item, V) => dot3(item.move ?? [0, 0, 0], V);


export const keyAt = (item, state, V) => item.key + liftOf(item, V) * shareOf(item, state);


export function orderKeys(items, overlaps, { gap = 0.02, rounds = 0 } = {}) {
  const { pairs, least, V } = overlaps;
  const start = items.map((item) => item.key);
  const strongest = new Map();
  const cycles = [];
  for (const pair of pairs) {
    const aFront = pair.front[0].area >= least;
    const bFront = pair.front[1].area >= least;
    if (aFront && bFront) {
      cycles.push(pair);
      continue;
    }
    const [front, back] = aFront ? [pair.a, pair.b] : [pair.b, pair.a];
    const weight = pair.front[aFront ? 0 : 1].area;
    const need = gap + shareOf(items[back], pair.state) * liftOf(items[back], V) - shareOf(items[front], pair.state) * liftOf(items[front], V);
    const id = `${front}|${back}`;
    const prior = strongest.get(id);
    if (!prior) strongest.set(id, { front, back, weight, pair, need });
    else {
      prior.weight = Math.max(prior.weight, weight);
      if (need > prior.need) (prior.need = need), (prior.pair = pair);
    }
  }
  const rules = [...strongest.values()];
  const limit = rounds || items.length + 1;
  const dropped = [];
  let keys = start.slice();
  let active = rules.slice();
  for (let attempt = 0; attempt < 400; attempt++) {
    keys = start.slice();
    const by = new Array(items.length).fill(null);
    let changed = true;
    let round = 0;
    let last = -1;
    for (; changed && round < limit; round++) {
      changed = false;
      for (const rule of active) {
        if (keys[rule.front] - keys[rule.back] >= rule.need - 1e-9) continue;
        keys[rule.front] = keys[rule.back] + rule.need;
        by[rule.front] = rule;
        last = rule.front;
        changed = true;
      }
    }
    if (!changed) break;
    const seen = new Map();
    let node = last;
    let step = 0;
    while (node !== -1 && by[node] && !seen.has(node) && step < items.length * 2) {
      seen.set(node, step++);
      node = by[node].back;
    }
    const loop = [];
    if (node !== -1 && seen.has(node)) {
      let walk = node;
      do {
        loop.push(by[walk]);
        walk = by[walk].back;
      } while (walk !== node && loop.length <= items.length);
    }
    const candidates = loop.length ? loop : active.filter((rule) => keys[rule.front] - keys[rule.back] < rule.need - 1e-9);
    if (!candidates.length) break;
    const victim = candidates.reduce((low, rule) => (rule.weight < low.weight ? rule : low));
    dropped.push(victim);
    active = active.filter((rule) => rule !== victim);
  }
  return { keys, rules: rules.length, cycles, dropped };
}


export function depthOrder(items, P, options = {}) {
  const overlaps = options.overlaps ?? overlapsOf(items, P, options);
  const { pairs, least, states, V } = overlaps;
  const allow = options.allow ?? [];
  const dropped = new Set((options.solved?.dropped ?? []).map((rule) => `${rule.front}|${rule.back}`));
  const missing = items.filter((item) => !item.shapes || !item.shapes.length).map((item) => item.name);
  const ranks = new Map();
  for (const state of states) {
    const order = items.map((item, index) => ({ index, key: keyAt(item, state, V) })).sort((x, y) => x.key - y.key || x.index - y.index);
    const rank = new Int32Array(items.length);
    order.forEach(({ index }, position) => (rank[index] = position));
    ranks.set(state, rank);
  }
  const rest = options.rest ?? states.filter((state) => state === 0 || state === 1);
  const problems = [];
  const passing = [];
  for (const pair of pairs) {
    const rank = ranks.get(pair.state);
    const aFirst = rank[pair.a] < rank[pair.b];
    const wrong = pair.front[aFirst ? 0 : 1];
    const right = pair.front[aFirst ? 1 : 0];
    if (wrong.area < least) continue;
    const front = items[aFirst ? pair.a : pair.b];
    const back = items[aFirst ? pair.b : pair.a];
    const excused = allow.find(([x, y]) => (matches([x], front.name) && matches([y], back.name)) || (matches([y], front.name) && matches([x], back.name)));
    const entry = {
      state: pair.state,
      label: labelOf(pair.state),
      front: front.name,
      back: back.name,
      frontKey: keyAt(front, pair.state, V),
      backKey: keyAt(back, pair.state, V),
      cells: wrong.all,
      area: wrong.area,
      against: right.area,
      cycle: right.area >= least,
      depth: wrong.depth,
      at: wrong.at,
    };
    const front_ = aFirst ? pair.a : pair.b;
    const back_ = aFirst ? pair.b : pair.a;
    entry.unorderable = !rest.includes(pair.state) && dropped.has(`${front_}|${back_}`);
    const replayed = typeof pair.state !== "number";
    (!excused && (rest.includes(pair.state) || replayed || (!entry.cycle && !entry.unorderable)) ? problems : passing).push(entry);
  }
  return { problems, passing, missing };
}


export function explodeStates(order = [], spring = {}, { uniform = 10, stride = 4 } = {}) {
  if (!order.length) return { depth: [0], frames: [], apart: false };
  const reversals = reversalsOf(order, spring.stagger ?? 0.035);
  const prefix = prefixStates(order);
  return {
    depth: [...uniformStates(uniform), ...springStates(order, { ...spring, stride, reversals }), ...prefix],
    frames: [...springStates(order, { ...spring, reversals }), ...prefix],
    apart: true,
  };
}


export function settle(R, P = R.P, { states = explodeStates(R.order, R.spring).depth, skip = sameRun, ...options } = {}) {
  const items = R.items.slice();
  const overlaps = overlapsOf(items, P, { states, skip, ...options });
  const solved = orderKeys(items, overlaps);
  items.forEach((item, index) => (item.key = solved.keys[index]));
  R.settled = { items, overlaps, solved, states };
  return R.settled;
}
