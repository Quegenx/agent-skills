// Split from turn-audit.mjs; original algorithms and public entrypoint contracts are preserved.
import { TURN } from "./turn.mjs";
import * as A from "./audit.mjs";
import * as G from "./lathe.mjs";
import { EYE, IDENTITY, ORBIT_CHECKS, ORBIT_LINES, apply, continuity, f2, f3, familiesOf, overlapArea, place, poseFor, posed, samplesOf, sphereOf, surfacePoints, unplace } from "./turn-audit-analysis.mjs";



export function orbit(T, R, P, options = {}) {
  const started = Date.now();
  const { sweep = null, clips = [], poses = null, random = 2000, step = 0.05, crowd = [], cover = [], fittings = [], depthAngles = 36, depthEvents = 36, quick = false, log = null, routeStates = 240, posedStep = null, only = null } = options;
  const say = (text) => log && log(text);
  const unknown = (only ?? []).filter((name) => !ORBIT_CHECKS.includes(name));
  if (unknown.length) throw new Error(`orbit: unknown check ${unknown.join(", ")} in only (the checks are ${ORBIT_CHECKS.join(", ")})`);
  const wants = (name) => !only || only.includes(name);
  const data = T.data;
  const scene = TURN.prepare(data, { unit: 1 });
  const runs = scene.runs;
  const groups = T.groups;
  const E = ((P.elevation ?? 30) * Math.PI) / 180;
  const result = { separation: [], unseparated: [], cycles: [], forced: [], swaps: [], layers: [], rigid: [], swept: [], posed: [], folds: [], self: [], crowding: [], endon: [], coverage: [], depth: [], continuity: [], notes: [], stats: {}, quick, skipped: Object.keys(ORBIT_LINES).filter((line) => ORBIT_LINES[line] && !wants(ORBIT_LINES[line])) };
  const families = familiesOf(T, { sweep, clips });
  const extra = typeof poses === "function" ? poses() : Array.isArray(poses) ? poses : [];
  const frameOf = (family) => (quick ? family.frame * (family.periodic ? Math.max(1, 1 / family.frame) : 3) : family.frame);
  const label = (family, x) => `${family.name} ${x.toFixed(3)}${family.unit ?? ""}`;
  const emitAll = (values, frames = runs.map((run) => TURN.frame(run))) => {
    const cams = TURN.cams(scene, values);
    for (const run of runs) TURN.emit(run, run.group >= 0 ? cams[run.group] : cams.world, frames[run.index]);
    return { cams, frames };
  };
  say("separation");
  const allMargins = T.built?.report?.margins ?? [];
  for (const m of allMargins) if (m.margin < -0.08) result.separation.push({ a: m.a, b: m.b, margin: m.margin });
  result.stats.planes = allMargins.length;
  result.stats.tightest = allMargins.length ? Math.min(...allMargins.map((m) => m.margin)) : 0;
  const relationOf = (layer, i, j, cams) => {
    const plan = layer.planar;
    for (let p = 0; p < plan.length; p += 5)
      if ((plan[p] === i && plan[p + 1] === j) || (plan[p] === j && plan[p + 1] === i)) {
        const g = runs[plan[p]].group;
        const V = g >= 0 ? cams[g].V : cams.world.V;
        const s = plan[p + 2] * V[0] + plan[p + 3] * V[1] + plan[p + 4] * V[2];
        return plan[p] === i ? s : -s;
      }
    const a = runs[i];
    const b = runs[j];
    const ca = a.group >= 0 ? cams[a.group] : cams.world;
    const cb = b.group >= 0 ? cams[b.group] : cams.world;
    const hit = TURN.gjk(a.cloud, ca, b.cloud, cb, null, 32, TURN.hintsOf(a, ca, b, cb, cams.world));
    const V = cams.world.V;
    return hit.n[0] * V[0] + hit.n[1] * V[1] + hit.n[2] * V[2];
  };
  const pairsOf = (layer) => {
    if (layer._pairs) return layer._pairs;
    const list = [];
    const seen = new Set();
    for (let p = 0; p < layer.planar.length; p += 5) list.push([layer.planar[p], layer.planar[p + 1]]);
    for (let p = 0; p < layer.dynamic.length; p += 2) list.push([layer.dynamic[p], layer.dynamic[p + 1]]);
    for (let p = 0; p < (layer.framed ? layer.framed.length : 0); p += 6) list.push([layer.framed[p], layer.framed[p + 1]]);
    for (const gp of layer.groupPairs ?? []) for (const i of gp.a) for (const j of gp.b) list.push([i, j]);
    for (const [i, j] of list) seen.add(i * 65536 + j);
    for (const i of layer.free) for (const j of layer.parts) {
      if (i === j || runs[i].group === runs[j].group) continue;
      const key = Math.min(i, j) * 65536 + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      list.push([Math.min(i, j), Math.max(i, j)]);
    }
    layer._pairs = list;
    return list;
  };
  const checkState = (values, tag, previous, record) => {
    const { cams, frames } = emitAll(values);
    const orders = [];
    scene.layers.forEach((layer, index) => {
      const stats = {};
      const order = TURN.order(layer, frames, cams, previous ? previous[index] : null, stats, scene);
      orders.push(order);
      if (stats.forced) result.forced.push({ layer: layer.name, state: tag, forced: stats.forced });
      const framed = layer.framed ?? [];
      for (let p = 0; p < framed.length; p += 6) {
        const i = framed[p];
        const j = framed[p + 1];
        if (TURN.disjoint(frames[i], frames[j], 0.1)) continue;
        const g = framed[p + 2];
        const R = g >= 0 ? cams[g].R : EYE;
        const n = [R[0] * framed[p + 3] + R[1] * framed[p + 4] + R[2] * framed[p + 5], R[3] * framed[p + 3] + R[4] * framed[p + 4] + R[5] * framed[p + 5], R[6] * framed[p + 3] + R[7] * framed[p + 4] + R[8] * framed[p + 5]];
        const extent = (run) => {
          const c = run.group >= 0 ? cams[run.group] : cams.world;
          let lo = Infinity;
          let hi = -Infinity;
          for (let q = 0; q < run.cloud.length; q += 3) {
            const x = run.cloud[q];
            const y = run.cloud[q + 1];
            const z = run.cloud[q + 2];
            const v = n[0] * (c.R[0] * x + c.R[1] * y + c.R[2] * z + c.t[0]) + n[1] * (c.R[3] * x + c.R[4] * y + c.R[5] * z + c.t[1]) + n[2] * (c.R[6] * x + c.R[7] * y + c.R[8] * z + c.t[2]);
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
          return [lo, hi];
        };
        const margin = extent(runs[j])[0] - extent(runs[i])[1];
        if (margin < -0.08) result.unseparated.push({ layer: layer.name, state: tag, a: runs[i].name, b: runs[j].name, margin, framed: true });
      }
      for (const gp of layer.groupPairs ?? []) {
        const R = gp.frame >= 0 ? cams[gp.frame].R : EYE;
        const nw = [R[0] * gp.n[0] + R[1] * gp.n[1] + R[2] * gp.n[2], R[3] * gp.n[0] + R[4] * gp.n[1] + R[5] * gp.n[2], R[6] * gp.n[0] + R[7] * gp.n[1] + R[8] * gp.n[2]];
        const along = (list, high) => {
          let best = high ? -Infinity : Infinity;
          for (const index of list) {
            const run = runs[index];
            const c = run.group >= 0 ? cams[run.group] : cams.world;
            for (let q = 0; q < run.cloud.length; q += 3) {
              const x = run.cloud[q];
              const y = run.cloud[q + 1];
              const z = run.cloud[q + 2];
              const v = nw[0] * (c.R[0] * x + c.R[1] * y + c.R[2] * z + c.t[0]) + nw[1] * (c.R[3] * x + c.R[4] * y + c.R[5] * z + c.t[1]) + nw[2] * (c.R[6] * x + c.R[7] * y + c.R[8] * z + c.t[2]);
              best = high ? Math.max(best, v) : Math.min(best, v);
            }
          }
          return best;
        };
        const margin = along(gp.b, false) - along(gp.a, true);
        if (margin < -0.08) result.unseparated.push({ layer: layer.name, state: tag, a: runs[gp.a[0]].name, b: runs[gp.b[0]].name, margin, framed: true });
      }
      const n = layer.parts.length;
      const local = layer.local;
      const adj = Array.from({ length: n }, () => []);
      const indeg = new Int32Array(n);
      for (const [i, j] of pairsOf(layer)) {
        if (TURN.disjoint(frames[i], frames[j], 0.1)) continue;
        const ri = runs[i];
        const rj = runs[j];
        if (stats.unseparated && ri.group !== rj.group) {
          const ca = ri.group >= 0 ? cams[ri.group] : cams.world;
          const cb = rj.group >= 0 ? cams[rj.group] : cams.world;
          const hit = TURN.gjk(ri.cloud, ca, rj.cloud, cb, null, 32, TURN.hintsOf(ri, ca, rj, cb, cams.world));
          if (hit.margin < -0.08) result.unseparated.push({ layer: layer.name, state: tag, a: ri.name, b: rj.name, margin: hit.margin });
        }
        const s = relationOf(layer, i, j, cams);
        if (s < 1e-7 && s > -1e-7) continue;
        const from = s > 0 ? local.get(i) : local.get(j);
        const to = s > 0 ? local.get(j) : local.get(i);
        adj[from].push(to);
        indeg[to]++;
      }
      const queue = [];
      for (let v = 0; v < n; v++) if (!indeg[v]) queue.push(v);
      let seen = 0;
      while (queue.length) {
        const v = queue.pop();
        seen++;
        for (const w of adj[v]) if (--indeg[w] === 0) queue.push(w);
      }
      if (seen < n) {
        const stuck = [];
        for (let v = 0; v < n; v++) if (indeg[v] > 0) stuck.push(runs[layer.parts[v]].name);
        let split = null;
        for (const m of T.built?.report?.margins ?? []) if (stuck.includes(m.a) && stuck.includes(m.b) && (!split || m.margin > split.margin)) split = m;
        const plane = split && T.built.planesByName ? T.built.planesByName.get(`${split.a}|${split.b}`) : null;
        result.cycles.push({ layer: layer.name, state: tag, parts: stuck.slice(0, 8), split: plane ? { part: split.b, a: split.a, b: split.b, n: plane.n, d: plane.d } : null });
      }
    });
    if (record) record(cams, frames, orders);
    return { cams, frames, orders };
  };
  const swapsOf = (a, b) => {
    const list = [];
    scene.layers.forEach((layer, index) => {
      const pa = a.orders[index];
      const pb = b.orders[index];
      const rankA = new Map();
      pa.forEach((g, at) => rankA.set(g, at));
      const rankB = new Map();
      pb.forEach((g, at) => rankB.set(g, at));
      const moved = new Set();
      for (let at = 0; at < pb.length; at++) if (pa[at] !== pb[at]) moved.add(pb[at]);
      const moving = [...moved];
      for (let x = 0; x < moving.length; x++)
        for (const j of layer.parts) {
          const i = moving[x];
          if (i === j || (moved.has(j) && j < i)) continue;
          if ((rankA.get(i) < rankA.get(j)) === (rankB.get(i) < rankB.get(j))) continue;
          if (T.parts[i].route && T.parts[i].route === T.parts[j].route && Math.abs(T.parts[i].chunk - T.parts[j].chunk) <= 1) continue;
          const area = Math.min(overlapArea(runs[i], a.frames[i], runs[j], a.frames[j]), overlapArea(runs[i], b.frames[i], runs[j], b.frames[j]));
          list.push({ layer: layer.name, i, j, area });
        }
    });
    return list;
  };
  const clone = (frames) => frames.map((f) => ({ ...f, d: f.d.slice(), box: Float64Array.from(f.box), hull: Float64Array.from(f.hull), quadList: f.quadList, fill: undefined }));
  const flush = new Set();
  for (const m of T.built?.report?.margins ?? []) if (Math.abs(m.margin) < 0.05) flush.add(`${m.a}|${m.b}`);
  const flushOf = (a, b) => flush.has(`${a}|${b}`) || flush.has(`${b}|${a}`);
  const changes = [];
  let orderStates = 0;
  for (const family of wants("order") ? families : []) {
    const xs = samplesOf(family, frameOf(family));
    say(`order scan ${family.name}: ${xs.length} states`);
    let previous = null;
    const local = [];
    for (const x of xs) {
      const values = family.at(x);
      const tag = label(family, x);
      const state = checkState(values, tag, previous ? previous.orders : null);
      orderStates++;
      const snapshot = { orders: state.orders.map((o) => Int32Array.from(o)), frames: clone(state.frames), x };
      if (previous) {
        const swaps = swapsOf(previous, snapshot);
        for (const swap of swaps) {
          if (swap.area <= 0.25) continue;
          const layerIndex = scene.layers.findIndex((l) => l.name === swap.layer);
          const layer = scene.layers[layerIndex];
          const prior = previous.orders[layerIndex];
          const probe = (value) => {
            const { cams, frames } = emitAll(family.at(value));
            const order = TURN.order(layer, frames, cams, prior, {}, scene);
            const at = new Map();
            order.forEach((g, index) => at.set(g, index));
            return { first: at.get(swap.i) < at.get(swap.j), frames };
          };
          const start = probe(previous.x).first;
          let lo = previous.x;
          let hi = x;
          let frames = null;
          for (let it = 0; it < 16; it++) {
            const mid = (lo + hi) / 2;
            const next = probe(mid);
            if (next.first === start) lo = mid;
            else {
              hi = mid;
              frames = next.frames;
            }
          }
          if (!frames) frames = probe(hi).frames;
          const area = overlapArea(runs[swap.i], frames[swap.i], runs[swap.j], frames[swap.j]);
          const built = flushOf(runs[swap.i].name, runs[swap.j].name);
          if (area > (built ? 0.5 : 0.25)) result.swaps.push({ layer: swap.layer, a: runs[swap.i].name, b: runs[swap.j].name, area, at: `${family.name} ${f3(hi)}` });
        }
        if (swaps.length) local.push({ family, x, count: swaps.length, pairs: swaps });
      }
      previous = snapshot;
    }
    changes.push(...local);
    const share = Math.round((quick ? Math.min(200, random) : random) / families.length);
    let seed = 12345 + families.indexOf(family);
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const events = local.flatMap((c) => [c.x - (family.delta ?? (family.periodic ? 0.001 : family.frame / 50)), c.x + (family.delta ?? (family.periodic ? 0.001 : family.frame / 50))]);
    say(`order scan ${family.name}: ${share} random states, ${events.length} event states`);
    for (let i = 0; i < share; i++) {
      const x = family.from + rand() * (family.to - family.from);
      checkState(family.at(x), `random ${label(family, x)}`, null);
    }
    for (const x of events.slice(0, quick ? 100 : 4000)) checkState(family.at(x), `event ${label(family, x)}`, null);
    orderStates += share + Math.min(events.length, quick ? 100 : 4000);
  }
  for (const values of wants("order") ? extra.slice(0, quick ? 100 : extra.length) : []) checkState(values, `pose ${JSON.stringify(values).slice(0, 60)}`, null);
  result.stats.orderStates = orderStates + extra.length;
  result.stats.changes = changes.length;
  result.changes = changes.sort((a, b) => b.count - a.count).slice(0, 10).map((c) => ({ family: c.family.name, x: c.x, count: c.count, pairs: c.pairs.slice(0, 4).map((p) => `${runs[p.i].name} / ${runs[p.j].name}`), at: c.family.at }));
  say("rigid");
  const mounts = A.mountsOf(R.tubes, R.solids);
  if (wants("rigid")) {
  for (const c of A.clearances(R.tubes, R.solids, { mounts })) result.rigid.push({ kind: "clearance", text: `${c.kind} ${c.tube} × ${c.other} clearance ${f2(c.clearance)} < ${f2(c.need)}` });
  for (const e of A.terminals(R.tubes, R.solids, { mounts })) result.rigid.push({ kind: "terminal", text: `${e.tube} ${e.end} ${Number.isFinite(e.d) ? f2(e.d) : "∞"} from ${e.nearest}` });
  const held = A.supports(R.solids, R.tubes);
  for (const name of held.loose) result.rigid.push({ kind: "support", text: `loose ${name}` });
  for (const name of held.hanging ?? []) result.rigid.push({ kind: "support", text: `hanging ${name}` });
  for (const d of held.sunk) result.rigid.push({ kind: "support", text: `sunk ${d.a} × ${d.b} ${f2(d.depth)} deep` });
  for (const c of A.solidClearances(R.solids)) result.rigid.push({ kind: "solid", text: `${c.tube} × ${c.other} sunk ${f2(-c.clearance)}` });
  }
  say("swept");
  const liveShapes = [];
  for (const part of T.parts) for (const shape of part.shapes) liveShapes.push({ shape, part, group: part.group });
  const liveSet = new Set(liveShapes.map((entry) => entry.shape));
  const staticShapes = [];
  for (const item of R.items) for (const shape of item.shapes ?? []) if (!liveSet.has(shape)) staticShapes.push({ shape, item });
  const pointsCache = new Map();
  const pointsOf = (shape) => {
    if (!pointsCache.has(shape)) pointsCache.set(shape, surfacePoints(shape));
    return pointsCache.get(shape);
  };
  for (const g of wants("swept") ? groups : []) {
    if (g.kind !== "turn" || g.parent) continue;
    const mine = liveShapes.filter((entry) => entry.group === g);
    const slices = new Map();
    for (const { shape } of mine)
      for (const p of pointsOf(shape)) {
        const band = Math.floor(p[2] * 2);
        const r = Math.hypot(p[0] - g.origin[0], p[1] - g.origin[1]);
        slices.set(band, Math.max(slices.get(band) ?? 0, r));
      }
    const flagged = [];
    for (const { shape, item } of staticShapes) {
      let worst = Infinity;
      for (const p of pointsOf(shape)) {
        const r = Math.hypot(p[0] - g.origin[0], p[1] - g.origin[1]);
        for (const band of [Math.floor(p[2] * 2), Math.floor(p[2] * 2 - 0.2), Math.floor(p[2] * 2 + 0.2)]) {
          const reach = slices.get(band);
          if (reach !== undefined) worst = Math.min(worst, r - reach);
        }
      }
      if (worst < -0.1) flagged.push({ shape, item });
    }
    for (const { shape, item } of flagged) {
      let deepest = 0;
      let where = 0;
      const count = quick ? 90 : 720;
      for (let i = 0; i < count; i++) {
        const angle = (i * 360) / count;
        const cams = TURN.cams(scene, { [g.name]: angle });
        const pose = poseFor(cams, g);
        const b = A.boundsOf(shape);
        for (const { shape: other } of mine)
          for (const p of pointsOf(other)) {
            const q = place(pose, p);
            if (q[0] < b.min[0] - 0.5 || q[0] > b.max[0] + 0.5 || q[1] < b.min[1] - 0.5 || q[1] > b.max[1] + 0.5 || q[2] < b.min[2] - 0.5 || q[2] > b.max[2] + 0.5) continue;
            const d = A.sdf(shape, q);
            if (d < deepest) {
              deepest = d;
              where = angle;
            }
          }
      }
      if (deepest < -0.1) result.swept.push({ text: `${item.name} × ${g.name} sweep: ${f2(-deepest)} deep at ${f2(where)}°` });
    }
  }
  say("posed");
  const posedStates = [];
  for (const family of families) {
    const frame = posedStep ?? (family.periodic ? (quick ? 4 : 0.5) : family.frame * (quick ? 4 : 1));
    for (const x of samplesOf(family, frame)) posedStates.push({ values: family.at(x), tag: label(family, x) });
  }
  for (const values of extra.slice(0, quick ? 40 : extra.length)) posedStates.push({ values, tag: "pose" });
  const entries = [
    ...liveShapes.map((entry) => ({ ...entry, kind: "live", sphere: sphereOf(pointsOf(entry.shape)) })),
    ...staticShapes.map((entry) => ({ shape: entry.shape, part: { name: entry.item.name }, group: "static", item: entry.item, kind: "static", sphere: sphereOf(pointsOf(entry.shape)) })),
  ];
  const posedSeen = new Set();
  const movingGroups = groups.filter((g) => !(g.kind === "turn" && !g.parent));
  const needsStatic = movingGroups.length > 0;
  for (const { values, tag } of wants("posed") ? posedStates : []) {
    const cams = TURN.cams(scene, values);
    const placed = entries.map((entry) => {
      if (entry.kind === "static") return { entry, c: entry.sphere.c, pose: null };
      const pose = poseFor(cams, entry.group);
      return { entry, c: entry.group ? place(pose, entry.sphere.c) : entry.sphere.c, pose: entry.group ? pose : null };
    });
    placed.sort((a, b) => a.c[0] - a.entry.sphere.r - (b.c[0] - b.entry.sphere.r));
    for (let i = 0; i < placed.length; i++) {
      const A0 = placed[i];
      const reachA = A0.c[0] + A0.entry.sphere.r + 0.5;
      for (let j = i + 1; j < placed.length; j++) {
        const B0 = placed[j];
        if (B0.c[0] - B0.entry.sphere.r > reachA) break;
        const a = A0.entry;
        const b = B0.entry;
        if (a.group === b.group) continue;
        if (a.kind === "static" && b.kind === "static") continue;
        if ((a.kind === "static" || b.kind === "static") && !needsStatic) continue;
        if (a.kind === "static" || b.kind === "static") {
          const live = a.kind === "static" ? b : a;
          if (!live.group || (live.group.kind === "turn" && !live.group.parent)) continue;
        }
        if (a.shape.kind === "tube" && b.shape.kind === "tube") continue;
        if (Math.hypot(A0.c[0] - B0.c[0], A0.c[1] - B0.c[1], A0.c[2] - B0.c[2]) > a.sphere.r + b.sphere.r + 0.5) continue;
        const key = `${a.part.name}|${b.part.name}`;
        if (posedSeen.has(key)) continue;
        const pa = A0.pose ?? IDENTITY;
        const pb = B0.pose ?? IDENTITY;
        let deepest = 0;
        for (const p of pointsOf(a.shape)) {
          const d = A.sdf(b.shape, unplace(pb, place(pa, p)));
          if (d < deepest) deepest = d;
        }
        for (const p of pointsOf(b.shape)) {
          const d = A.sdf(a.shape, unplace(pa, place(pb, p)));
          if (d < deepest) deepest = d;
        }
        const limit = a.shape.kind === "tube" || b.shape.kind === "tube" ? -0.1 : -0.5;
        if (deepest < limit) {
          posedSeen.add(key);
          result.posed.push({ text: `${a.part.name} × ${b.part.name} through ${f2(-deepest)} at ${tag}` });
        }
      }
    }
  }
  result.stats.posedStates = posedStates.length;
  say("folds, self, crowding, endon");
  const routes = T.routes ?? [];
  const turnGroups = groups.filter((g) => g.kind === "turn" && !g.parent);
  const tubesAll = R.tubes;
  const linkMap = A.linksOf(tubesAll, mounts);
  const routeSample = [];
  {
    const all = posedStates.filter((s) => s.tag !== "pose");
    const stride = Math.max(1, Math.floor(all.length / (quick ? 48 : routeStates)));
    for (let i = 0; i < all.length; i += stride) routeSample.push(all[i]);
    for (const values of extra.slice(0, 24)) routeSample.push({ values, tag: "pose" });
  }
  const foldSeen = new Set();
  const crowdSeen = new Set();
  const lo = (E * 180) / Math.PI;
  for (const route of wants("routes") ? routes : []) {
    const g = route.group;
    const root = g && g.kind === "turn" && !g.parent;
    const records = R.routes.filter((r) => r.name === route.name);
    const groupParts = T.parts.filter((part) => part.group === g);
    const itemsAt = (pose) => groupParts.map((part) => ({ name: part.name, route: part.route, shapes: pose ? part.shapes.map((shape) => posed(shape, pose)) : part.shapes }));
    const views = [];
    if (!g) views.push({ P, pose: null, tag: "rest" });
    else if (root) {
      const count = quick ? 72 : 720;
      for (let i = 0; i < count; i++) {
        const x = (i * 360) / count;
        views.push({ P: { ...P, azimuth: (P.azimuth ?? 45) - x }, pose: null, tag: `${f2(x)}°` });
      }
    } else for (const { values, tag } of routeSample) views.push({ P, pose: poseFor(TURN.cams(scene, values), g), tag });
    for (const view of views) {
      const posedRecords = view.pose ? records.map((r) => ({ ...r, points: r.points.map((p) => place(view.pose, p)) })) : records;
      const items = itemsAt(view.pose);
      for (const fold of A.folds(posedRecords, view.P, { items })) {
        const key = `${fold.name}|${fold.kind}`;
        if (foldSeen.has(key)) continue;
        foldSeen.add(key);
        result.folds.push({ text: `${fold.name} ${fold.kind} at ${view.tag}: turns ${fold.flatTurn.toFixed(0)}° on screen${fold.kind === "pinch" ? ` round a ${f2(fold.radius)} px bend` : ` for ${fold.realTurn.toFixed(0)}° in 3D`}` });
      }
      for (const s of A.selfOverlaps(items.filter((item) => item.route === route.name), view.P)) {
        const key = `self|${s.name}`;
        if (foldSeen.has(key)) continue;
        foldSeen.add(key);
        result.self.push({ text: `${s.name} folds back at ${view.tag}: radius ${f2(s.radius)} px under its half-width ${f2(s.width)} px` });
      }
    }
    const dense = route.world;
    const total = G.pathLength(dense);
    const stations = G.resample(dense, 0.25);
    const rotations = !g || root || g.upright ? [null] : routeSample.map(({ values }) => poseFor(TURN.cams(scene, values), g).R);
    const bad = [];
    let walked = 0;
    for (let i = 1; i < stations.length - 1; i++) {
      walked += G.len3(G.sub3(stations[i], stations[i - 1]));
      if (route.gaps.some(([a, b]) => walked >= a - 1e-6 && walked <= b + 1e-6)) continue;
      if (fittings.some(([name, a, b]) => name === route.name && walked >= a && walked <= b)) continue;
      const t0 = G.unit3(G.sub3(stations[i + 1], stations[i - 1]));
      for (const Rm of rotations) {
        const t = Rm ? apply(Rm, t0) : t0;
        const phi = (Math.asin(Math.max(-1, Math.min(1, t[2]))) * 180) / Math.PI;
        if ((phi > lo - 15 && phi < lo + 15) || (phi > -lo - 15 && phi < -lo + 15)) {
          bad.push({ at: walked, phi });
          break;
        }
      }
    }
    if (bad.length) result.endon.push({ text: `${route.name} points within 15° of the view along ${f2(bad[0].at)}\u2013${f2(bad[bad.length - 1].at)} of ${f2(total)} (slope ${bad[0].phi.toFixed(1)}°): bend flat or inside a fitting` });
  }
  const crowdViews = [];
  for (const g of turnGroups) {
    const count = quick ? 24 : 72;
    for (let i = 0; i < count; i++) crowdViews.push({ group: g, P: { ...P, azimuth: (P.azimuth ?? 45) - (i * 360) / count }, tag: `${f2((i * 360) / count)}°`, values: null });
  }
  const others = [...new Set(routes.map((route) => route.group).filter((g) => g && !(g.kind === "turn" && !g.parent)))];
  for (const g of others) for (const { values, tag } of routeSample.slice(0, quick ? 24 : 72)) crowdViews.push({ group: g, P, tag, values });
  for (const view of wants("routes") ? crowdViews : []) {
    const g = view.group;
    const pose = view.values ? poseFor(TURN.cams(scene, view.values), g) : null;
    const mineRoutes = R.routes.filter((r) => routes.some((route) => route.name === r.name && route.group === g)).map((r) => (pose ? { ...r, points: r.points.map((p) => place(pose, p)) } : r));
    if (!mineRoutes.length) continue;
    const groupParts = T.parts.filter((part) => part.group === g);
    const items = groupParts.map((part) => ({ name: part.name, route: part.route, shapes: pose ? part.shapes.map((shape) => posed(shape, pose)) : part.shapes }));
    const rods = A.slenderOf(items.flatMap((item) => item.shapes).filter((shape) => shape.kind !== "tube"));
    for (const c of A.crowding(mineRoutes, view.P, { links: linkMap, items, allow: crowd, rods })) {
      const key = [c.a, c.b, c.where].join("|");
      if (crowdSeen.has(key)) continue;
      crowdSeen.add(key);
      result.crowding.push({ text: `${c.a} ${c.where} × ${c.b} at ${view.tag}: outlines ${c.gap < 0 ? `overlap ${f2(-c.gap)}` : `${f2(c.gap)} apart`} px` });
    }
  }
  say("coverage");
  const rest = emitAll(Object.fromEntries(groups.map((g) => [g.name, g.kind === "free" ? null : 0])));
  const coverItems = T.parts.map((part) => {
    const run = runs[part.id];
    const f = rest.frames[part.id];
    const outline = run.kind === "fixed" ? part.svg : run.kind === "tube" ? f.d[run.role.body] : f.d[run.role.fill];
    return { name: part.name, svg: `<path d="${outline}"/>`, shapes: part.shapes };
  });
  for (const c of wants("coverage") ? A.coverage(coverItems, P, { allow: cover }) : []) result.coverage.push({ text: `${c.name} its shapes cover ${Math.round(c.share * 100)}% of its drawing` });
  say("continuity");
  if (wants("continuity")) {
    TURN.exact(true);
    try {
      continuity(T, scene, runs, groups, { step, quick, result, say, families, frameOf });
    } finally {
      TURN.exact(false);
    }
  }
  say("depth oracle");
  const depthStates = [];
  const first = families[0];
  if (first) for (let i = 0; i < (quick ? 6 : depthAngles); i++) {
    const x = first.from + ((first.to - first.from) * i) / (quick ? 6 : depthAngles);
    depthStates.push({ values: first.at(x), tag: label(first, x) });
  }
  for (const family of families.slice(1)) for (let i = 0; i <= (quick ? 3 : 12); i++) {
    const x = family.from + ((family.to - family.from) * i) / (quick ? 3 : 12);
    depthStates.push({ values: family.at(x), tag: label(family, x) });
  }
  for (const change of result.changes.slice(0, quick ? 4 : depthEvents)) depthStates.push({ values: change.at(change.x), tag: `${change.family} ${f3(change.x)}` });
  let checked = 0;
  for (const { values, tag } of wants("depth") ? depthStates : []) {
    const state = checkState(values, `depth ${tag}`, null);
    scene.layers.forEach((layer, index) => {
      const items = [];
      for (const global of layer.parts) {
        const part = T.parts[global];
        const pose = poseFor(state.cams, part.group);
        items.push({ name: part.name, global, shapes: part.shapes.map((shape) => posed(shape, pose)), route: part.route, chunk: part.chunk });
      }
      const ranks = new Map((T.order.length ? T.order : T.layers.map((l) => l.name)).map((name, at) => [name, at]));
      for (const item of R.items) if (item.layer && ranks.has(item.layer) && item.shapes && item.shapes.length) items.push({ name: item.name, static: ranks.get(item.layer) < ranks.get(layer.name) ? "below" : "above", shapes: item.shapes });
      const overlaps = A.overlapsOf(items, P, { step: quick ? 0.5 : 0.25, skip: (a, b) => A.sameRun(a, b) || (a.static && b.static) });
      for (const pair of overlaps.pairs) {
        const a = items[pair.a];
        const b = items[pair.b];
        if (!a.static === !b.static) continue;
        const sideIndex = a.static ? 0 : 1;
        const fixed = a.static ? a : b;
        const moving = a.static ? b : a;
        const staticFront = pair.front[sideIndex].area >= overlaps.least;
        const liveFront = pair.front[1 - sideIndex].area >= overlaps.least;
        if (fixed.static === "below" && staticFront) result.layers.push({ text: `${fixed.name} (under ${layer.name}) is in front of ${moving.name} at ${tag}: ${f2(pair.front[sideIndex].area)} px²` });
        if (fixed.static === "above" && liveFront) result.layers.push({ text: `${fixed.name} (over ${layer.name}) is behind ${moving.name} at ${tag}: ${f2(pair.front[1 - sideIndex].area)} px²` });
      }
      const rank = new Map();
      state.orders[index].forEach((global, at) => rank.set(global, at));
      for (const pair of overlaps.pairs) {
        if (items[pair.a].static || items[pair.b].static) continue;
        checked++;
        const aFront = pair.front[0].area >= overlaps.least;
        const bFront = pair.front[1].area >= overlaps.least;
        if (aFront === bFront) continue;
        const front = items[aFront ? pair.a : pair.b];
        const backItem = items[aFront ? pair.b : pair.a];
        if (rank.get(front.global) < rank.get(backItem.global)) result.depth.push({ text: `${layer.name} at ${tag}: ${front.name} is in front of ${backItem.name} but drawn first (${f2(pair.front[aFront ? 0 : 1].area)} px²)` });
      }
    });
  }
  result.stats.depthStates = depthStates.length;
  result.stats.depthPairs = checked;
  result.stats.seconds = (Date.now() - started) / 1000;
  return result;
}
