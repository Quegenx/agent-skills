// Split from turn-build.mjs; original algorithms and public entrypoint contracts are preserved.
import { TURN, TURN_CSS } from "./turn.mjs";
import * as G from "./lathe.mjs";
import * as A from "./audit.mjs";
import { add3, dot3, esc, groupData, groupStates, mul3, pack, pack3, packPairs, partData, proveLayers, quickSeparate, r4, separate, statesOf, sub3, thinCloud } from "./turn-build-analysis.mjs";



export function build(T, { statics = [], verify = false, poses = null, strict = true, fullClouds = false } = {}) {
  const P = T.P;
  const started = Date.now();
  const states = statesOf(T, poses);
  const groups = groupData(T);
  const parts = T.parts.map(partData);
  const sweep = (layerParts, list) => {
    const data = { P, groups, layers: T.layers.map((layer) => ({ name: layer.name, parts: [], rest: [] })), parts };
    const scene = TURN.prepare(data, { unit: T.scale });
    const frames = scene.runs.map((run) => TURN.frame(run));
    return { scene, frames, data };
  };
  void sweep;
  const routes = T.routes.map((route) => ({ points: route.points.flat().map(r4), r: route.r, spacing: route.spacing, wide: route.wide, hue: route.hue, rings: route.rings }));
  const scratch = { P, groups, layers: T.layers.map((layer) => ({ name: layer.name, parts: [], rest: [] })), parts, routes };
  let scene = TURN.prepare(scratch, { unit: T.scale });
  const slotNeed = parts.map(() => ({ bevel: 0, ribs: 0 }));
  const sampleCams = new Map();
  const camsFor = (group) => {
    const key = group ? group.index : -1;
    if (!sampleCams.has(key)) {
      const list = groupStates(T, group, states, { tumble: true }).map((values) => TURN.cams(scene, values));
      sampleCams.set(key, list);
    }
    return sampleCams.get(key);
  };
  T.parts.forEach((part, index) => {
    const run = scene.runs[index];
    const needs = part.kind === "item" ? false : part.kind === "prism" ? Boolean(part.spec.bevel) : part.kind === "tube" ? Boolean(part.spec.rings) : Boolean(part.details.ribs);
    if (!needs) return;
    const g = part.group ? part.group.index : -1;
    const wide = { ...run, slots: { bevel: 64, ribs: 64 }, role: { ...run.role } };
    for (let j = 0; j < 64; j++) {
      wide.role[`v${j}`] = 1000 + j;
      wide.role[`r${j}`] = 2000 + j;
    }
    const f = TURN.frame(run);
    f.d = new Array(3000).fill("");
    f.o = new Float64Array(3000);
    f.q = new Int32Array(3000);
    f.w = new Float64Array(3000);
    f.t = new Array(3000).fill("");
    f.cx = new Float64Array(3000);
    f.cy = new Float64Array(3000);
    let most = 0;
    for (const cams of camsFor(part.group)) {
      TURN.emit(wide, g >= 0 ? cams[g] : cams.world, f);
      most = Math.max(most, f.levels ?? 0);
    }
    slotNeed[index][part.kind === "prism" ? "bevel" : "ribs"] = Math.max(1, most);
  });
  parts.forEach((data, index) => {
    data.spec = slotNeed[index].bevel || slotNeed[index].ribs ? { ...data.spec, slots: slotNeed[index] } : { ...data.spec };
  });
  scene = TURN.prepare({ ...scratch, parts }, { unit: T.scale });
  const centre = (list) => mul3(list.reduce((s, p) => add3(s, p), [0, 0, 0]), 1 / Math.max(1, list.length));
  const spheres = T.parts.map((part) => {
    const c = centre(part.samples);
    let r = 0;
    for (const p of part.samples) r = Math.max(r, G.len3(sub3(p, c)));
    return { c, r };
  });
  const planes = {};
  const dynamic = {};
  const free = {};
  let stateCamList = null;
  const stateCams = () => stateCamList ?? (stateCamList = states.map((values) => TURN.cams(scene, values)));
  const boxCache = new Map();
  const boxesOf = (part, list, key) => {
    const id = `${part.id}|${key}`;
    if (boxCache.has(id)) return boxCache.get(id);
    const local = thinCloud(part.samples, 40);
    const out = new Float64Array(4 * list.length + 1);
    const steps = [];
    list.forEach((cams, at) => {
      const c = part.group ? cams[part.group.index] : cams.world;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const q of local) {
        const x = c.ox + c.m[0] * q[0] + c.m[1] * q[1] + c.m[2] * q[2];
        const y = c.oy + c.m[3] * q[0] + c.m[4] * q[1] + c.m[5] * q[2];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (at) steps.push(Math.max(Math.abs(x0 - out[4 * at - 4]), Math.abs(y0 - out[4 * at - 3]), Math.abs(x1 - out[4 * at - 2]), Math.abs(y1 - out[4 * at - 1])));
      out.set([x0, y0, x1, y1], 4 * at);
    });
    steps.sort((x, y) => x - y);
    out[4 * list.length] = steps.length ? steps[Math.floor(steps.length * 0.95)] : 0;
    boxCache.set(id, out);
    return out;
  };
  const boxesMeet = (a, b, list, key) => {
    const A = boxesOf(a, list, key);
    const B = boxesOf(b, list, key);
    const pad = 1.5 + A[4 * list.length] + B[4 * list.length];
    for (let i = 0; i < list.length; i++) {
      const o = 4 * i;
      if (A[o] < B[o + 2] + pad && B[o] < A[o + 2] + pad && A[o + 1] < B[o + 3] + pad && B[o + 1] < A[o + 3] + pad) return true;
    }
    return false;
  };
  let framedCount = 0;
  const framedAll = {};
  const groupPairsAll = {};
  const ancestors = (g) => {
    const out = [];
    for (let x = g; x; x = x.parent) out.push(x);
    return out;
  };
  const commonOf = (g1, g2) => {
    const list = ancestors(g1);
    for (let x = g2; x; x = x.parent) if (list.includes(x)) return x;
    return null;
  };
  const sampleStates = () => {
    const all = stateCams();
    const count = Math.min(all.length, 24);
    return Array.from({ length: count }, (_, i) => all[Math.floor((i * all.length) / count)]);
  };
  const toFrame = (dir, from, frame) => {
    if (from === frame) return dir;
    const cams = sampleStates()[0] ?? TURN.cams(scene, {});
    const Rf = from ? cams[from.index].R : [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const w = [Rf[0] * dir[0] + Rf[1] * dir[1] + Rf[2] * dir[2], Rf[3] * dir[0] + Rf[4] * dir[1] + Rf[5] * dir[2], Rf[6] * dir[0] + Rf[7] * dir[1] + Rf[8] * dir[2]];
    const Rc = frame ? cams[frame.index].R : [1, 0, 0, 0, 1, 0, 0, 0, 1];
    return [Rc[0] * w[0] + Rc[3] * w[1] + Rc[6] * w[2], Rc[1] * w[0] + Rc[4] * w[1] + Rc[7] * w[2], Rc[2] * w[0] + Rc[5] * w[1] + Rc[8] * w[2]];
  };
  const cloudCache = new Map();
  const framedCloud = (part, frame) => {
    const key = `${part.id}|${frame ? frame.index : -1}`;
    if (cloudCache.has(key)) return cloudCache.get(key);
    const local = thinCloud(part.samples, 32);
    const out = [];
    for (const cams of sampleStates()) {
      const c = part.group ? cams[part.group.index] : cams.world;
      const f = frame ? cams[frame.index] : cams.world;
      for (const q of local) {
        const p = [c.R[0] * q[0] + c.R[1] * q[1] + c.R[2] * q[2] + c.t[0] - f.t[0], c.R[3] * q[0] + c.R[4] * q[1] + c.R[5] * q[2] + c.t[1] - f.t[1], c.R[6] * q[0] + c.R[7] * q[1] + c.R[8] * q[2] + c.t[2] - f.t[2]];
        out.push([f.R[0] * p[0] + f.R[3] * p[1] + f.R[6] * p[2], f.R[1] * p[0] + f.R[4] * p[1] + f.R[7] * p[2], f.R[2] * p[0] + f.R[5] * p[1] + f.R[8] * p[2]]);
      }
    }
    cloudCache.set(key, out);
    return out;
  };
  const skip = {};
  const problems = [];
  const margins = [];
  const planesByName = new Map();
  const layerData = [];
  for (const layer of T.layers) {
    const members = T.parts.filter((part) => part.layer === layer);
    const plan = [];
    const dyn = [];
    const framed = [];
    const skipped = [];
    const pairsOfGroups = [];
    const settled = new Set();
    const byGroup = new Map();
    for (const part of members) {
      if (part.group && part.group.loose) continue;
      const key = part.group ? part.group.index : -1;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(part);
    }
    const keys = [...byGroup.keys()];
    if (states.length)
      for (let x = 0; x < keys.length; x++)
        for (let y = x + 1; y < keys.length; y++) {
          const A = byGroup.get(keys[x]);
          const B = byGroup.get(keys[y]);
          const ga = keys[x] >= 0 ? T.groups[keys[x]] : null;
          const gb = keys[y] >= 0 ? T.groups[keys[y]] : null;
          const common = commonOf(ga, gb);
          const ca = A.flatMap((part) => framedCloud(part, common).filter((_, i) => fullClouds || i % 2 === 0));
          const cb = B.flatMap((part) => framedCloud(part, common).filter((_, i) => fullClouds || i % 2 === 0));
          const hit = quickSeparate(ca, cb, [[0, 0, 1], ...A.flatMap((part) => part.hints).slice(0, 6).map((h) => toFrame(h, ga, common)), ...B.flatMap((part) => part.hints).slice(0, 6).map((h) => toFrame(h, gb, common))]);
          if (hit.margin < 0.1) continue;
          pairsOfGroups.push(keys[x], keys[y], common ? common.index : -1, hit.n[0], hit.n[1], hit.n[2]);
          settled.add(`${keys[x]}|${keys[y]}`);
          settled.add(`${keys[y]}|${keys[x]}`);
        }
    groupPairsAll[layer.name] = pairsOfGroups;
    for (let x = 0; x < members.length; x++)
      for (let y = x + 1; y < members.length; y++) {
        const a = members[x];
        const b = members[y];
        if (a.route && a.route === b.route && Math.abs(a.chunk - b.chunk) <= 1) {
          skipped.push(a.id, b.id);
          continue;
        }
        const sa = spheres[a.id];
        const sb = spheres[b.id];
        if (a.group === b.group) {
          const g = a.group ? a.group.index : -1;
          const reach = G.len3(sub3(sb.c, sa.c)) + sa.r + sb.r;
          let near = false;
          void reach;
          if (a.group && a.group.loose) near = G.len3(sub3(sb.c, sa.c)) < sa.r + sb.r + 1;
          else near = boxesMeet(a, b, camsFor(a.group), `g${g}`);
          if (!near) continue;
          const hit = separate(a.samples, b.samples, [[0, 0, 1], ...a.hints, ...b.hints]);
          margins.push({ a: a.name, b: b.name, margin: hit.margin });
          const o = a.group ? a.group.origin : [0, 0, 0];
          planesByName.set(`${a.name}|${b.name}`, { n: hit.n, d: hit.d + dot3(hit.n, o) });
          if (hit.margin < -0.08) {
            problems.push(`interlock ${a.name} × ${b.name} ${hit.margin.toFixed(2)}: split, flats or a flush contact`);
            if (strict) continue;
          }
          plan.push(a.id, b.id, hit.n[0], hit.n[1], hit.n[2]);
        } else if ((a.group && a.group.loose) || (b.group && b.group.loose)) {
          continue;
        } else if (settled.has(`${a.group ? a.group.index : -1}|${b.group ? b.group.index : -1}`)) {
          continue;
        } else {
          const near = !states.length || boxesMeet(a, b, stateCams(), "states");
          if (!near) continue;
          const common = commonOf(a.group, b.group);
          const ca = framedCloud(a, common);
          const cb = framedCloud(b, common);
          const hit = quickSeparate(ca, cb, [[0, 0, 1], ...a.hints, ...b.hints].map((h) => toFrame(h, a.group, common)).concat([[0, 0, 1], ...b.hints.map((h) => toFrame(h, b.group, common))]));
          if (hit.margin >= 0.1) {
            framed.push(a.id, b.id, common ? common.index : -1, hit.n[0], hit.n[1], hit.n[2]);
            framedCount++;
          } else dyn.push(a.id, b.id);
        }
      }
    planes[layer.name] = plan;
    dynamic[layer.name] = dyn;
    framedAll[layer.name] = framed;
    free[layer.name] = members.filter((part) => part.group && part.group.loose).map((part) => part.id);
    skip[layer.name] = skipped;
    layerData.push({ name: layer.name, parts: members.map((part) => part.id), rest: [] });
  }
  if (problems.length && strict) throw new Error(`turning: ${problems.length} pair${problems.length === 1 ? "" : "s"} with no separating plane\n  ${problems.join("\n  ")}`);
  const layered = proveLayers(T, statics, states, scene);
  if (layered.problems.length) throw new Error(`turning: ${layered.problems.length} layer problem${layered.problems.length === 1 ? "" : "s"}\n  ${layered.problems.join("\n  ")}`);
  const values = Object.fromEntries(T.groups.map((g) => [g.name, g.kind === "free" ? null : 0]));
  const data = { P, groups, layers: layerData, parts, routes, planes: packPairs(planes, 5, false), framed: packPairs(framedAll, 6, true), groupPairs: pack(groupPairsAll), dynamic, free, skip, values };
  const clouds = T.parts.map((part) => thinCloud(part.samples, 64));
  data.parts.forEach((p, index) => {
    if (p.kind === "fixed") p.cloud = clouds[index].flat().map(r4);
  });
  const packed = { ...pack({ ...data, parts: [] }), parts: pack3(data.parts) };
  scene = TURN.prepare(packed, { unit: T.scale });
  const cams = TURN.cams(scene, values);
  const frames = scene.runs.map((run) => TURN.emit(run, run.group >= 0 ? cams[run.group] : cams.world, TURN.frame(run)));
  const V = G.viewOf(P);
  scene.layers.forEach((layer, index) => {
    const provisional = Int32Array.from(Array.from(layer.parts).sort((i, j) => dot3(spheres[i].c, V) - dot3(spheres[j].c, V)));
    const order = TURN.order(layer, frames, cams, provisional, {}, scene);
    packed.layers[index].rest = Array.from(order);
    layer.rest = order;
  });
  const markup = {};
  scene.layers.forEach((layer, index) => {
    markup[layer.name] = `<g class="iso-parts" data-layer="${esc(layer.name)}">${packed.layers[index].rest.map((i) => partMarkup(T.parts[i], scene.runs[i], frames[i])).join("")}</g>`;
  });
  const report = {
    parts: T.parts.length,
    groups: T.groups.length,
    layers: T.layers.map((layer) => ({ name: layer.name, parts: packed.layers[layer.index].parts.length, planar: planes[layer.name].length / 5, framed: framedAll[layer.name].length / 6, groupPairs: groupPairsAll[layer.name].length / 6, dynamic: dynamic[layer.name].length / 2, skip: skipped(skip[layer.name]) })),
    tight: margins.filter((m) => m.margin < 0).sort((a, b) => a.margin - b.margin),
    margins,
    proofs: layered.proofs,
    seconds: (Date.now() - started) / 1000,
  };
  const out = { svg: markup, data: packed, css: TURN_CSS, report, scene, frames, planesByName };
  out.layerSvg = (name, { width, height, label = "" }) => `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg iso-live iso-layer" data-live="${esc(name)}" viewBox="0 0 ${width} ${height}" aria-hidden="true"${label ? ` aria-label="${esc(label)}"` : ""}>${markup[name]}</svg>`;
  if (verify) out.verify = verifyData(T, statics);
  T.built = out;
  T.data = packed;
  return out;
}


const skipped = (list) => list.length / 2;


function attrs(pairs) {
  return Object.entries(pairs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([key, v]) => ` ${key}="${esc(v)}"`)
    .join("");
}


function roleMarkup(part, run, f, r) {
  const role = run.roles[r];
  if (role.type === "path") return `<path${attrs({ class: role.cls, "data-shade": role.shade === undefined ? undefined : String(role.shade), "data-tone": role.tone, "data-r": role.name, d: f.d[r] })}/>`;
  if (role.type === "face") {
    const q = f.q[r];
    const band = Math.min(3, Math.floor(q / TURN.q));
    const mix = (q - TURN.q * band) / TURN.q;
    const style = [mix ? `--f:${mix}` : "", f.w[r] >= 0 ? `stroke-width:${f.w[r]}` : ""].filter(Boolean).join(";");
    return `<path${attrs({ class: "iso-tn", "data-r": role.name, "data-b": band ? String(band) : undefined, style: style || undefined, d: f.d[r] })}/>`;
  }
  if (role.type === "slot") return `<path${attrs({ class: role.cls, "data-tone": role.tone, "data-r": role.name, opacity: String(Math.round(f.o[r] * 1000) / 1000), d: f.d[r] })}/>`;
  if (role.type === "xform") return `<path${attrs({ class: role.cls, "data-r": role.name, transform: f.t[r], d: part.planPath })}/>`;
  if (role.type === "plane") {
    const index = Number(role.name.slice(5));
    return `<g${attrs({ "data-r": role.name, transform: f.t[r], opacity: String(f.o[r]) })}>${part.planes[index].svg}</g>`;
  }
  return "";
}


function dotsMarkup(part, run, f) {
  let out = "";
  let open = null;
  run.roles.forEach((role, r) => {
    if (role.type !== "dot") return;
    if (open !== role.tone) {
      if (open !== null) out += "</g>";
      out += `<g class="iso-dots" data-tone="${role.tone}">`;
      open = role.tone;
    }
    out += `<circle data-r="${role.name}" cx="${Math.round(f.cx[r] * 100) / 100}" cy="${Math.round(f.cy[r] * 100) / 100}" r="${role.size}" fill-opacity="${f.o[r]}"/>`;
  });
  return open !== null ? out + "</g>" : out;
}


function partMarkup(part, run, f) {
  if (part.kind === "item") return `<g class="iso-item" data-p="${run.index}" data-name="${esc(part.name)}"></g>`;
  const head = (cls, extra = {}) => `<g${attrs({ class: cls, "data-p": String(run.index), "data-name": part.name, "data-mat": part.material ?? undefined, "data-lit": part.lit ? "" : undefined, ...extra })}>`;
  const inner = run.roles.map((role, r) => (role.type === "dot" || role.type === "self" ? "" : roleMarkup(part, run, f, r))).join("");
  if (part.kind === "tube") return head("tb", { "data-hue": part.hue ?? undefined }) + inner + "</g>";
  if (part.kind === "fixed") {
    const at = part.svg.lastIndexOf('<path class="iso-line iso-edge"');
    const body = at >= 0 ? part.svg.slice(0, at) + inner + part.svg.slice(at) : part.svg + inner;
    return head("iso-part", { transform: f.t[run.role.move] || undefined }) + body + dotsMarkup(part, run, f) + "</g>";
  }
  return head("iso-solid", { "data-seamless": part.kind === "round" || part.kind === "ball" || part.kind === "lathe" ? "" : undefined }) + inner + dotsMarkup(part, run, f) + "</g>";
}


function verifyData(T, statics = []) {
  const order = T.order.length ? T.order : T.layers.map((layer) => layer.name);
  const live = new Set(T.layers.map((layer) => layer.name));
  const staticLayers = order.filter((name) => !live.has(name));
  const liveShapes = new Set(T.parts.flatMap((part) => part.shapes));
  return {
    parts: T.parts.map((part) => ({ name: part.name, group: part.group ? part.group.index : -1, layer: part.layer.index, shapes: part.shapes.map((shape) => localShape(shape, part.group)) })),
    statics: statics.filter((item) => item.shapes && item.shapes.length && staticLayers.includes(item.layer)).map((item) => ({ name: item.name, rank: staticLayers.indexOf(item.layer), shapes: item.shapes.filter((shape) => !liveShapes.has(shape)).map((shape) => localShape(shape, null)) })),
  };
}


function localShape(shape, group) {
  const o = group ? group.origin : [0, 0, 0];
  const out = { kind: shape.kind };
  if (shape.F) out.F = { o: sub3(shape.F.o, o), a: shape.F.a, u: shape.F.u, v: shape.F.v };
  for (const key of ["poly", "s0", "s1", "r", "radii", "flats"]) if (shape[key] !== undefined) out[key] = shape[key];
  if (shape.o && shape.kind !== "body" && shape.kind !== "prism") out.o = sub3(shape.o, o);
  if (shape.points) out.points = shape.points.map((p) => sub3(p, o));
  if (shape.axes) out.axes = shape.axes;
  if (shape.half) out.half = shape.half;
  return pack(out);
}
