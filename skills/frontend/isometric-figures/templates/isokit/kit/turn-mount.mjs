// Shared TURN implementation from turn-fixed.mjs. Each factory owns one runtime instance; no state crosses backend entrypoints.
export function createTurnMount(dependencies, fixed) {
  const { T3_Q, t3Anchor, t3Arena, t3Camera, t3Cams, t3Cover, t3Emit, t3Frame, t3Grow, t3Keep, t3Order, t3PoseOf, t3Prepare, t3State } = dependencies;


function t3Mount(stage, data, { onHold = null, onFrame = null, follow = null, painter = "svg", numeric = painter === "canvas", canvasLayers = null, shift = false } = {}) {
  if (!fixed) { painter = "svg"; numeric = false; canvasLayers = null; shift = false; }
  const canvasSet = painter === "canvas" ? new Set(canvasLayers ?? data.layers.map((layer) => layer.name)) : new Set();
  const dom = canvasSet.size < data.layers.length;
  const domLayer = data.layers.map((layer) => !canvasSet.has(layer.name));
  const layerEls = new Map([...stage.querySelectorAll("svg[data-live]")].map((svg) => [svg.dataset.live, svg]));
  const first = layerEls.values().next().value;
  const viewWidth = first && first.viewBox && first.viewBox.baseVal ? first.viewBox.baseVal.width : 0;
  const unitOf = () => {
    const width = first ? first.getBoundingClientRect().width : 0;
    return viewWidth && width ? Math.round((width / viewWidth) * 100) / 100 : 1;
  };
  let unit = unitOf();
  let scene = t3Prepare(data, { unit });
  const runs = () => scene.runs;
  const count = data.parts.length;
  const nodes = new Array(count);
  const bound = new Array(count);
  const cache = new Array(count);
  const containers = new Map();
  for (const [name, svg] of layerEls) containers.set(name, svg.querySelector(".iso-parts") ?? svg);
  for (const run of scene.runs) {
    const layer = data.layers[run.layer];
    const container = containers.get(layer.name);
    const node = container ? container.querySelector(`[data-p="${run.index}"]`) : null;
    nodes[run.index] = node;
    const map = {};
    if (node) {
      map.move = node;
      node.querySelectorAll("[data-r]").forEach((el) => (map[el.getAttribute("data-r")] = el));
    }
    bound[run.index] = run.roles.map((role) => map[role.name] ?? null);
    cache[run.index] = run.roles.map(() => ({ d: null, q: null, b: null, f: null, w: null, t: null, o: null, cx: null, cy: null }));
  }
  const frames = scene.runs.map((run) => t3Frame(run));
  const values = Object.fromEntries(data.groups.map((g) => [g.name, data.values ? data.values[g.name] ?? 0 : 0]));
  let lastPoses = null;
  let cams = null;
  const orders = scene.layers.map((layer) => Int32Array.from(layer.rest));
  const changes = [];
  const stats = { ms: 0, writes: 0, moved: 0, forced: 0, refined: 0, unseparated: 0, emitted: 0 };
  let writes = 0;
  const write = (index) => {
    const run = scene.runs[index];
    const f = frames[index];
    const els = bound[index];
    const memo = cache[index];
    for (let r = 0; r < run.roles.length; r++) {
      const el = els[r];
      if (!el) continue;
      const role = run.roles[r];
      const c = memo[r];
      const type = role.type;
      if (type === "path" || type === "face" || type === "slot") {
        const d = f.d[r];
        if (c.d !== d) {
          el.setAttribute("d", d);
          c.d = d;
          writes++;
        }
        if (type === "face") {
          const q = f.q[r];
          if (c.q !== q) {
            const band = Math.min(3, Math.floor(q / T3_Q));
            const mix = (q - T3_Q * band) / T3_Q;
            if (c.b !== band) {
              el.setAttribute("data-b", String(band));
              c.b = band;
              writes++;
            }
            if (c.f !== mix) {
              if (mix) el.style.setProperty("--f", String(mix));
              else el.style.removeProperty("--f");
              c.f = mix;
              writes++;
            }
            c.q = q;
          }
          const w = f.w[r];
          if (c.w !== w) {
            if (w < 0) el.style.removeProperty("stroke-width");
            else el.style.strokeWidth = String(w);
            c.w = w;
            writes++;
          }
        } else if (type === "slot") {
          const o = f.o[r];
          if (c.o !== o) {
            el.setAttribute("opacity", String(Math.round(o * 1000) / 1000));
            c.o = o;
            writes++;
          }
        }
      } else if (type === "xform" || type === "self" || type === "plane") {
        const t = f.t[r];
        if (c.t !== t) {
          if (t) el.setAttribute("transform", t);
          else el.removeAttribute("transform");
          c.t = t;
          writes++;
        }
        if (type === "plane") {
          const o = f.o[r];
          if (c.o !== o) {
            el.setAttribute("opacity", String(o));
            c.o = o;
            writes++;
          }
        }
      } else if (type === "dot") {
        const x = Math.round(f.cx[r] * 100) / 100;
        const y = Math.round(f.cy[r] * 100) / 100;
        const o = f.o[r];
        if (c.cx !== x) {
          el.setAttribute("cx", String(x));
          c.cx = x;
          writes++;
        }
        if (c.cy !== y) {
          el.setAttribute("cy", String(y));
          c.cy = y;
          writes++;
        }
        if (c.o !== o) {
          el.setAttribute("fill-opacity", String(o));
          c.o = o;
          writes++;
        }
      }
    }
  };
  const samePose = (a, b) => {
    if (!a || !b) return false;
    for (let i = 0; i < 9; i++) if (a.R[i] !== b.R[i]) return false;
    return a.t[0] === b.t[0] && a.t[1] === b.t[1] && a.t[2] === b.t[2];
  };
  let lastUnit = unit;
  let moved = 0;
  let snapshotNext = false;
  const emittedList = [];
  const shiftOn = Boolean(shift);
  const emitAt = shiftOn ? new Array(count) : null;
  const shiftable = (run) => run.kind === "prism" || run.kind === "round" || run.kind === "ball" || run.kind === "lathe";
  const sameView = (base, cam) => {
    const m = cam.m;
    const b = base.m;
    for (let i = 0; i < 6; i++) if (m[i] !== b[i]) return false;
    return true;
  };
  const keepEmit = (run, cam, f) => {
    let base = emitAt[run.index];
    if (!base) base = emitAt[run.index] = { m: new Float64Array(6), ox: 0, oy: 0, box: new Float64Array(4), hull: new Float64Array(0), hullN: 0 };
    base.m.set(cam.m);
    base.ox = cam.ox;
    base.oy = cam.oy;
    base.box.set(f.box);
    if (base.hull.length < 2 * f.hullN) base.hull = new Float64Array(2 * f.hullN);
    for (let i = 0; i < 2 * f.hullN; i++) base.hull[i] = f.hull[i];
    base.hullN = f.hullN;
  };
  const shiftFrame = (f, base, dx, dy) => {
    f.box[0] = base.box[0] + dx;
    f.box[1] = base.box[1] + dy;
    f.box[2] = base.box[2] + dx;
    f.box[3] = base.box[3] + dy;
    const hull = t3Grow(f, "hull", 2 * base.hullN, Float64Array);
    for (let i = 0; i < base.hullN; i++) {
      hull[2 * i] = base.hull[2 * i] + dx;
      hull[2 * i + 1] = base.hull[2 * i + 1] + dy;
    }
    f.hullN = base.hullN;
    f.sx = dx;
    f.sy = dy;
  };
  const writeShift = (index, dx, dy) => {
    const node = nodes[index];
    if (!node) return;
    const text = dx || dy ? `translate(${Math.round(dx * 100) / 100} ${Math.round(dy * 100) / 100})` : "";
    if (node.__shift === text) return;
    if (text) node.setAttribute("transform", text);
    else node.removeAttribute("transform");
    node.__shift = text;
    writes++;
  };
  const render = () => {
    const t0 = performance.now();
    writes = 0;
    moved = 0;
    if (fixed) stats.orderMs = 0;
    t3Arena.on = false;
    const snapshotting = snapshotNext;
    snapshotNext = false;
    cams = t3Cams(scene, values);
    t3State.detail = detail;
    const poses = cams.poses;
    const fresh = lastUnit !== unit || !lastPoses;
    let emitted = 0;
    emittedList.length = 0;
    let shifted = 0;
    for (const run of scene.runs) {
      const g = run.group;
      const changed = fresh || (g >= 0 ? !samePose(poses[g], lastPoses[g]) : false);
      if (!changed) continue;
      const domRun = snapshotting || domLayer[run.layer];
      const cam = g >= 0 ? cams[g] : cams.world;
      const f = frames[run.index];
      const base = shiftOn && !fresh && !snapshotting ? emitAt[run.index] : null;
      if (base && sameView(base, cam)) {
        const dx = cam.ox - base.ox;
        const dy = cam.oy - base.oy;
        shiftFrame(f, base, dx, dy);
        if (domRun) writeShift(run.index, dx, dy);
        emittedList.push(run.index);
        shifted++;
        continue;
      }
      t3Arena.on = Boolean(numeric) && !domRun;
      t3Emit(run, cam, f);
      if (f.sx || f.sy) {
        f.sx = 0;
        f.sy = 0;
      }
      if (shiftOn && shiftable(run)) keepEmit(run, cam, f);
      if (domRun) {
        write(run.index);
        if (shiftOn && shiftable(run)) writeShift(run.index, 0, 0);
      }
      emittedList.push(run.index);
      emitted++;
    }
    if (fixed) stats.shifted = shifted;
    lastPoses = poses;
    lastUnit = unit;
    t3Arena.on = false;
    t3Arena.f = null;
    const t1 = performance.now();
    if (fixed) stats.emitMs = t1 - t0;
    const orderStats = { forced: 0, refined: 0, unseparated: 0, edges: 0 };
    scene.layers.forEach((layer, index) => {
      const previous = orders[index];
      const tOrder = performance.now();
      const order = t3Order(layer, frames, cams, previous, orderStats, scene);
      if (fixed) stats.orderMs += performance.now() - tOrder;
      let same = true;
      for (let j = 0; j < order.length; j++)
        if (order[j] !== previous[j]) {
          same = false;
          break;
        }
      if (snapshotting && !domLayer[index]) {
        const container = containers.get(layer.name);
        if (container) for (const global of order) if (nodes[global]) container.appendChild(nodes[global]);
        orders[index] = order;
        return;
      }
      if (same) return;
      if (!domLayer[index]) {
        orders[index] = order;
        return;
      }
      const container = containers.get(layer.name);
      const position = new Map();
      previous.forEach((global, at) => position.set(global, at));
      const keep = t3Keep(Array.from(order, (global) => position.get(global)));
      let after = null;
      const shifted = [];
      for (let j = order.length - 1; j >= 0; j--) {
        const node = nodes[order[j]];
        if (!keep[j] && node && container) {
          container.insertBefore(node, after);
          moved++;
          shifted.push(scene.runs[order[j]].name);
        }
        if (node) after = node;
      }
      orders[index] = order;
      if (shifted.length) changes.push({ layer: layer.name, moved: shifted });
    });
    stats.ms = performance.now() - t0;
    stats.writes = writes;
    stats.moved = moved;
    stats.forced = orderStats.forced;
    stats.refined = orderStats.refined;
    stats.unseparated = orderStats.unseparated;
    stats.emitted = emitted;
    t3State.detail = 1;
    if (onFrame) onFrame(controller);
    return { ...stats };
  };
  let detail = 1;
  const set = (next, options) => {
    if (options && options.detail !== undefined) {
      const value = Math.max(0, Math.min(1, options.detail));
      if (value !== detail) {
        detail = value;
        lastPoses = null;
      }
    }
    if (typeof next === "number") {
      const g = data.groups.find((group) => group.kind === "turn");
      if (g) values[g.name] = next;
    } else if (next) for (const [name, value] of Object.entries(next)) values[name] = value;
    if (follow) Object.assign(values, follow({ ...values }));
    return render();
  };
  const itemRuns = new Map();
  let unwrap = new Map();
  const angleAt = (clientX, clientY, z = 0, groupName) => {
    const svg = first;
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const x = vb.x + ((clientX - box.left) / box.width) * vb.width;
    const y = vb.y + ((clientY - box.top) / box.height) * vb.height;
    const c = t3Camera(scene.P, null);
    const p = (x - c.ox) / c.k;
    const q = (y - c.oy + z * c.ce * c.k) / (c.se * c.k);
    const wx = p * c.sa + q * c.ca;
    const wy = -p * c.ca + q * c.sa;
    const group = data.groups.find((g) => g.name === groupName) ?? data.groups.find((g) => g.kind === "turn");
    const pivot = group ? group.origin : [0, 0, 0];
    const raw = (Math.atan2(wy - pivot[1], wx - pivot[0]) * 180) / Math.PI;
    const key = group ? group.name : "";
    const last = unwrap.get(key);
    let angle = raw;
    if (last !== undefined) angle = last + ((((raw - last) % 360) + 540) % 360) - 180;
    unwrap.set(key, angle);
    return angle;
  };
  const observer = typeof ResizeObserver === "function" && first
    ? new ResizeObserver(() => {
        if (fixed && (!dom || !first.isConnected)) return;
        const next = unitOf();
        if (Math.abs(next - unit) < 0.05) return;
        unit = next;
        scene = t3Prepare(data, { unit });
        render();
      })
    : null;
  if (observer) observer.observe(first);
  if (follow) Object.assign(values, follow({ ...values }));
  const controller = {
    set,
    render,
    painter,
    emitted: () => emittedList,
    snapshot: () => {
      snapshotNext = true;
      lastPoses = null;
      render();
      lastPoses = null;
      render();
      return [...containers.values()];
    },
    numeric: Boolean(numeric) && canvasSet.size > 0,
    canvasLayers: [...canvasSet],
    setUnit: (next) => {
      if (Math.abs(next - unit) < 1e-6) return null;
      unit = next;
      scene = t3Prepare(data, { unit });
      return render();
    },
    angleAt,
    get values() {
      return { ...values };
    },
    cover: (names, options) => t3Cover(controller, names, options),
    order: (name) => {
      const index = name === undefined ? 0 : scene.layers.findIndex((layer) => layer.name === name);
      return index < 0 ? [] : Array.from(orders[index], (global) => scene.runs[global].name);
    },
    orderIndex: (name) => {
      const index = name === undefined ? 0 : scene.layers.findIndex((layer) => layer.name === name);
      return index < 0 ? null : orders[index];
    },
    events: () => changes.splice(0, changes.length),
    stats: () => ({ ...stats }),
    frames: () => frames,
    cams: () => cams,
    scene: () => scene,
    pose: (name) => t3PoseOf(scene, cams, name),
    detach: (name) => {
      const index = scene.groups.findIndex((g) => g.name === name);
      const pose = t3PoseOf(scene, cams, name);
      const o = scene.groups[index].origin;
      return { world: true, R: pose.R, t: [pose.t[0] - o[0], pose.t[1] - o[1], pose.t[2] - o[2]] };
    },
    anchor: (name, point, direction) => t3Anchor(scene, cams, name, point, direction),
    item: (name, { cloud, box, hull }) => {
      const run = itemRuns.get(name) ?? scene.runs.find((r) => r.name === name);
      if (!run) return null;
      itemRuns.set(name, run);
      run.cloud = cloud instanceof Float64Array ? cloud : Float64Array.from(cloud);
      run.version = (run.version ?? 0) + 1;
      run.itemBox.set(box);
      run.itemHull = hull instanceof Float64Array ? hull : Float64Array.from(hull);
      const n = run.cloud.length / 3;
      run.centroid = [0, 0, 0];
      for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) run.centroid[c] += run.cloud[3 * i + c] / Math.max(1, n);
      t3Emit(run, null, frames[run.index]);
      return nodes[run.index];
    },
    node: (name) => {
      const run = scene.runs.find((r) => r.name === name);
      return run ? nodes[run.index] : null;
    },
    destroy: () => {
      if (observer) observer.disconnect();
      if (typeof window !== "undefined" && window.__isoTurn && window.__isoTurn.controller === controller) delete window.__isoTurn;
    },
  };
  const hold = () => {
    if (onHold) onHold();
  };
  if (!fixed) {
    delete controller.painter;
    delete controller.emitted;
    delete controller.snapshot;
    delete controller.numeric;
    delete controller.canvasLayers;
    delete controller.setUnit;
    delete controller.item;
    delete controller.node;
  }
  if (typeof window !== "undefined") {
    window.__isoTurn = {
      controller,
      set(next) {
        hold();
        return set(next);
      },
      get() {
        hold();
        return { ...values };
      },
      order(name) {
        hold();
        return controller.order(name);
      },
      events() {
        hold();
        return controller.events();
      },
      stats() {
        hold();
        return controller.stats();
      },
      layers() {
        hold();
        return scene.layers.map((layer) => layer.name);
      },
    };
  }
  render();
  return controller;
}
  return { t3Mount };
}
