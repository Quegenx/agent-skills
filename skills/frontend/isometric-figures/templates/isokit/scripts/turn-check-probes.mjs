// Browser probe sources split from turn-check.mjs; preserve literal scripts and original source notices.
export const HELPERS = String.raw`(() => {
  const stage = document.querySelector(".iso-turn") || document.querySelector(".iso-stage");
  const svgs = [...stage.querySelectorAll(":scope > svg")];
  const hook = window.__isoTurn;
  const C = hook.controller;
  const vb = svgs[0].viewBox.baseVal;
  const W = vb.width;
  const H = vb.height;
  const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n");
  const theme = (stage.closest("[data-theme]") || document.body).getAttribute("data-theme") || "dark";
  const setState = (state) => (typeof state === "number" ? C.set(state) : C.set(state));
  const matrixOf = (el) => {
    const m = el.ownerSVGElement.getScreenCTM().inverse().multiply(el.getScreenCTM());
    return "matrix(" + m.a + " " + m.b + " " + m.c + " " + m.d + " " + m.e + " " + m.f + ")";
  };
  const decode = async (svg, w, h) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    await new Promise((done, fail) => { image.onload = done; image.onerror = fail; image.src = url; });
    const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, w, h);
    URL.revokeObjectURL(url);
    return ctx.getImageData(0, 0, w, h).data;
  };
  window.__tc = { stage, svgs, hook, C, W, H, css, theme, setState, matrixOf, decode };
  return { W, H, layers: svgs.map((s) => s.dataset.live || null), theme };
})()`;

export const ZBUFFER = String.raw`(() => {
  const { svgs, C, W, H, setState, matrixOf, decode } = window.__tc;
  const V = window.__isoVerify;
  const SCALE = 2;
  const w = W * SCALE;
  const h = H * SCALE;
  const STATIC = 30000;
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const frameOf = (F) => {
    if (F.u && F.v) return F;
    const a = unit3(F.a);
    const helper = Math.abs(a[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    const u = unit3(cross3(helper, a));
    return { o: F.o, a, u, v: cross3(a, u) };
  };
  function meshOf(shape) {
    const tris = [];
    const quad = (a, b, c, d) => tris.push(a, b, c, a, c, d);
    if (shape.kind === "prism") {
      const F = frameOf(shape.F);
      const at = (s, [x, y]) => add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, x), mul3(F.v, y)));
      const n = shape.poly.length;
      const centre = shape.poly.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
      for (const s of [shape.s0, shape.s1]) for (let i = 0; i < n; i++) tris.push(at(s, centre), at(s, shape.poly[i]), at(s, shape.poly[(i + 1) % n]));
      for (let i = 0; i < n; i++) quad(at(shape.s0, shape.poly[i]), at(shape.s0, shape.poly[(i + 1) % n]), at(shape.s1, shape.poly[(i + 1) % n]), at(shape.s1, shape.poly[i]));
    } else if (shape.kind === "body") {
      const F = frameOf(shape.F);
      const count = 72;
      const ring = (s, r) => Array.from({ length: count }, (_, j) => { const t = (j / count) * Math.PI * 2; return add3(add3(F.o, mul3(F.a, s)), add3(mul3(F.u, r * Math.cos(t)), mul3(F.v, r * Math.sin(t)))); });
      const poly = shape.poly;
      for (let i = 0; i < poly.length; i++) {
        const [s0, r0] = poly[i];
        const [s1, r1] = poly[(i + 1) % poly.length];
        if (r0 < 1e-9 && r1 < 1e-9) continue;
        const a = ring(s0, r0);
        const b = ring(s1, r1);
        for (let j = 0; j < count; j++) quad(a[j], a[(j + 1) % count], b[(j + 1) % count], b[j]);
      }
    } else if (shape.kind === "ball") {
      const rows = 32;
      const cols = 64;
      const flats = shape.flats || [];
      const at = (i, j) => {
        const phi = (i / rows) * Math.PI;
        const t = (j / cols) * Math.PI * 2;
        let n = [Math.sin(phi) * Math.cos(t), Math.sin(phi) * Math.sin(t), Math.cos(phi)];
        let p = mul3(n, shape.r);
        for (const [nx, ny, nz, d] of flats) {
          const k = nx * p[0] + ny * p[1] + nz * p[2];
          if (k > d) p = sub3(p, mul3([nx, ny, nz], k - d));
        }
        return add3(shape.o, p);
      };
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) quad(at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j));
    } else if (shape.kind === "box") {
      const c = (sx, sy, sz) => add3(shape.o, add3(add3(mul3(shape.axes[0], sx * shape.half[0]), mul3(shape.axes[1], sy * shape.half[1])), mul3(shape.axes[2], sz * shape.half[2])));
      const v = [c(-1, -1, -1), c(1, -1, -1), c(1, 1, -1), c(-1, 1, -1), c(-1, -1, 1), c(1, -1, 1), c(1, 1, 1), c(-1, 1, 1)];
      for (const [a, b, cc, d] of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) quad(v[a], v[b], v[cc], v[d]);
    } else if (shape.kind === "tube") {
      const pts = [];
      const radii = [];
      shape.points.forEach((p, i) => {
        if (pts.length && Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1], p[2] - pts[pts.length - 1][2]) < 1e-6) return;
        pts.push(p);
        radii.push(shape.radii[i]);
      });
      if (pts.length < 2) return tris;
      const count = 20;
      let u = null;
      const rings = pts.map((p, i) => {
        const t = unit3(sub3(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
        if (!u) { const helper = Math.abs(t[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]; u = unit3(cross3(helper, t)); } else u = unit3(sub3(u, mul3(t, dot3(u, t))));
        const v = cross3(t, u);
        const r = radii[i];
        return Array.from({ length: count }, (_, j) => { const a = (j / count) * Math.PI * 2; return add3(p, add3(mul3(u, r * Math.cos(a)), mul3(v, r * Math.sin(a)))); });
      });
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < count; j++) quad(rings[i][j], rings[i][(j + 1) % count], rings[i + 1][(j + 1) % count], rings[i + 1][j]);
      for (const [index, p] of [[0, pts[0]], [rings.length - 1, pts[pts.length - 1]]]) for (let j = 0; j < count; j++) tris.push(p, rings[index][j], rings[index][(j + 1) % count]);
    }
    return tris;
  }
  const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
  canvas.dataset.check = "1";
  const gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true, alpha: false, depth: true });
  const vs = "attribute vec3 p;uniform vec3 uR0;uniform vec3 uR1;uniform vec3 uR2;uniform vec3 uT;uniform vec3 uM0;uniform vec3 uM1;uniform vec2 uO;uniform vec3 uV;uniform vec2 uView;uniform float uSpan;void main(){vec3 q=vec3(dot(uR0,p),dot(uR1,p),dot(uR2,p))+uT;vec2 s=uO+vec2(dot(uM0,q),dot(uM1,q));gl_Position=vec4(s.x/uView.x*2.-1.,1.-s.y/uView.y*2.,-dot(uV,q)/uSpan,1.);}";
  const fs = "precision highp float;uniform vec3 uId;void main(){gl_FragColor=vec4(uId,1.);}";
  const compile = (type, source) => { const sh = gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  gl.useProgram(program);
  const loc = (name) => gl.getUniformLocation(program, name);
  const where = { p: gl.getAttribLocation(program, "p"), R0: loc("uR0"), R1: loc("uR1"), R2: loc("uR2"), T: loc("uT"), M0: loc("uM0"), M1: loc("uM1"), O: loc("uO"), V: loc("uV"), view: loc("uView"), span: loc("uSpan"), id: loc("uId") };
  const bufferOf = (shapes) => {
    const pos = [];
    for (const shape of shapes) for (const p of meshOf(shape)) pos.push(p[0], p[1], p[2]);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    return { b, count: pos.length / 3 };
  };
  const parts = V.parts.map((part, index) => ({ index, group: part.group, name: part.name, mesh: bufferOf(part.shapes) }));
  const statics = V.statics.map((item) => ({ rank: item.rank, mesh: bufferOf(item.shapes) }));
  const colour = (id) => [((id + 1) & 255) / 255, (((id + 1) >> 8) & 255) / 255, 0];
  const zIds = () => {
    const cams = C.cams();
    const world = cams.world;
    gl.viewport(0, 0, w, h);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(where.M0, world.m[0], world.m[1], world.m[2]);
    gl.uniform3f(where.M1, world.m[3], world.m[4], world.m[5]);
    gl.uniform2f(where.O, world.ox, world.oy);
    gl.uniform3f(where.V, world.V[0], world.V[1], world.V[2]);
    gl.uniform2f(where.view, W, H);
    gl.uniform1f(where.span, 4000);
    const draw = (mesh, R, t, id) => {
      gl.uniform3f(where.R0, R[0], R[1], R[2]);
      gl.uniform3f(where.R1, R[3], R[4], R[5]);
      gl.uniform3f(where.R2, R[6], R[7], R[8]);
      gl.uniform3f(where.T, t[0], t[1], t[2]);
      gl.uniform3fv(where.id, colour(id));
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.b);
      gl.enableVertexAttribArray(where.p);
      gl.vertexAttribPointer(where.p, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    };
    const eye = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    for (const item of statics) draw(item.mesh, eye, [0, 0, 0], STATIC + item.rank);
    for (const part of parts) {
      const cam = part.group >= 0 ? cams[part.group] : null;
      draw(part.mesh, cam ? cam.R : eye, cam ? cam.t : [0, 0, 0], part.index);
    }
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const ids = new Int32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; ids[y * w + x] = pixels[i] + pixels[i + 1] * 256 - 1; }
    return ids;
  };
  const toId = (id) => "rgb(" + ((id + 1) & 255) + "," + (((id + 1) >> 8) & 255) + ",0)";
  const painterSvg = (reverse = false) => {
    const out = [];
    let rank = 0;
    for (const svg of svgs) {
      if (svg.dataset.live) {
        const nodes = [...svg.querySelectorAll("[data-p]")];
        if (reverse) nodes.reverse();
        for (const node of nodes) for (const el of node.querySelectorAll(".iso-fill, .tb-body")) out.push('<path d="' + el.getAttribute("d") + '" transform="' + matrixOf(el) + '" fill-rule="' + (el.getAttribute("fill-rule") || "nonzero") + '" fill="' + toId(Number(node.dataset.p)) + '"/>');
      } else {
        for (const el of svg.querySelectorAll(".iso-fill, .tb-body")) out.push('<path d="' + el.getAttribute("d") + '" transform="' + matrixOf(el) + '" fill-rule="' + (el.getAttribute("fill-rule") || "nonzero") + '" fill="' + toId(STATIC + rank) + '"/>');
        rank++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + w + '" height="' + h + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="rgb(0,0,0)"/>' + out.join("") + "</svg>";
  };
  const pIds = async (reverse) => {
    const data = await decode(painterSvg(reverse), w, h);
    const ids = new Int32Array(w * h);
    for (let i = 0; i < w * h; i++) ids[i] = data[i * 4] + data[i * 4 + 1] * 256 - 1;
    return ids;
  };
  const nameOf = (id) => (id >= STATIC ? "static layer " + (id - STATIC) : id < 0 ? "empty" : V.parts[id].name);
  const joint = (a, b) => {
    const m = /^(.*):(\d+)$/;
    const x = a.match(m);
    const y = b.match(m);
    return Boolean(x && y && x[1] === y[1] && Math.abs(Number(x[2]) - Number(y[2])) <= 1);
  };
  async function check(state, { reverse = false } = {}) {
    setState(state);
    const Z = zIds();
    const P = await pIds(reverse);
    const tally = new Map();
    const interior = (ids, i, x, y) => {
      const v = ids[i];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; const yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h || ids[yy * w + xx] !== v) return false; }
      return true;
    };
    let total = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const p = P[i];
        const z = Z[i];
        if (p === z || p < 0 || z < 0) continue;
        if (!interior(P, i, x, y) || !interior(Z, i, x, y)) continue;
        const key = p + "|" + z;
        tally.set(key, (tally.get(key) || 0) + 1);
        total++;
      }
    const live = [];
    const layers = [];
    for (const [key, px] of tally) {
      const [p, z] = key.split("|").map(Number);
      const a = nameOf(p);
      const b = nameOf(z);
      if (p >= STATIC || z >= STATIC) layers.push({ painter: a, truth: b, px });
      else if (!joint(a, b)) live.push({ painter: a, truth: b, px });
    }
    live.sort((x, y) => y.px - x.px);
    layers.sort((x, y) => y.px - x.px);
    return { total, live, layers, stats: C.stats() };
  }
  async function footprint(state, name) {
    setState(state);
    const index = V.parts.findIndex((part) => part.name === name);
    const Z = zIds();
    const P = await pIds(false);
    const boxOf = (ids) => {
      let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let i = 0; i < ids.length; i++) if (ids[i] === index) { n++; const x = i % w, y = (i / w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      return { px: n, box: n ? [x0 / SCALE, y0 / SCALE, x1 / SCALE, y1 / SCALE] : null };
    };
    return { painter: boxOf(P), truth: boxOf(Z) };
  }
  window.__tc.order = { check, footprint };
  return { parts: parts.length, statics: statics.length, w, h };
})()`;

export const POPS = String.raw`(() => {
  const { stage, svgs, W, H, css, theme, setState, decode } = window.__tc;
  const SCALE = 2;
  const w = W * SCALE;
  const h = H * SCALE;
  let hidden = null;
  const svgString = () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + w + '" height="' + h + '" class="iso iso-svg" data-theme="' + theme + '" style="--anatomy-paper:var(--anatomy-card)"><style>' + css + '</style><rect width="100%" height="100%" style="fill:var(--anatomy-card)"/>' + svgs.map((s) => '<g class="' + (s.getAttribute("class") || "") + '">' + s.innerHTML + "</g>").join("") + "</svg>";
  async function render(state, hide = null) {
    setState(state);
    if (hide !== null) {
      hidden = stage.querySelector('[data-p="' + hide + '"]');
      if (hidden) hidden.setAttribute("display", "none");
    }
    const data = await decode(svgString(), w, h);
    if (hidden) {
      hidden.removeAttribute("display");
      hidden = null;
    }
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) lum[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
    return lum;
  }
  const erode = (mask) => {
    const out = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        let all = 1;
        for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (!mask[i + dy * w + dx]) { all = 0; break; }
        out[i] = all;
      }
    return out;
  };
  const regionOf = (mask) => {
    let n = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { n, box: n ? [x0 / SCALE, y0 / SCALE, x1 / SCALE, y1 / SCALE].map((v) => Math.round(v * 10) / 10) : null };
  };
  async function first(a, b, hide = null) {
    const A = await render(a);
    const B = await render(b, hide);
    let mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (Math.abs(A[i] - B[i]) >= 5) mask[i] = 1;
    mask = erode(erode(mask));
    return regionOf(mask);
  }
  let cache = null;
  async function second(a, b, c) {
    const A = cache && cache.x === a ? cache.lum : await render(a);
    const B = cache && cache.y === b ? cache.mid : await render(b);
    const Cl = await render(c);
    cache = { x: b, lum: B, y: c, mid: Cl };
    let mask = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const e = Math.abs(2 * B[i] - A[i] - Cl[i]);
        if (e <= 6) continue;
        let flat = true;
        for (let dy = -1; dy <= 1 && flat; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(B[i + dy * w + dx] - B[i]) > 4) { flat = false; break; }
        if (e > 56 || flat) mask[i] = 1;
      }
    mask = erode(mask);
    const region = regionOf(mask);
    if (window.__tcDump && region.n >= 6 && !window.__tcDumped) {
      window.__tcDumped = true;
      const png = (lum, scaleBy = 1) => {
        const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
        const ctx = canvas.getContext("2d");
        const img = ctx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
          const v = Math.max(0, Math.min(255, lum[i] * scaleBy));
          img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
          img.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        return canvas.toDataURL("image/png").split(",")[1];
      };
      const diff = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) diff[i] = Math.abs(2 * B[i] - A[i] - Cl[i]);
      window.__tcDumped = { a: png(A), b: png(B), c: png(Cl), e: png(diff, 4) };
    }
    return region;
  }
  window.__tc.pops = { first, second, render };
  return { w, h };
})()`;

// --passes is ported from anatomy-reveal's object/scan-apart.mjs and motion/scan.mjs (MIT, Ann Nguyen; see
// ../kit/LICENSE-anatomy-reveal.txt).
export const PASSES = String.raw`((sweep, film) => {
  const { C, setState } = window.__tc;
  const runs = C.scene().runs;
  const nameOf = (p) => (typeof p === "number" ? runs[p]?.name ?? String(p) : p?.name ?? p?.id ?? String(p));
  const pairs = new Map();
  const steps = [];
  let hookless = 0;
  for (let index = 0; index < sweep.length; index++) {
    globalThis.__t3unsep = [];
    globalThis.__t3forced = [];
    if (film) window.seek(sweep[index]);
    else setState(sweep[index]);
    const s = (film ? window.__isoTurn.controller : C).stats();
    const unsep = globalThis.__t3unsep;
    const forced = globalThis.__t3forced;
    if ((s.unseparated && !unsep.length) || (s.forced && !forced.length)) hookless++;
    for (const [a, b, margin] of unsep) {
      const key = a + " × " + b;
      const prev = pairs.get(key);
      if (!prev || margin < prev.margin) pairs.set(key, { margin, index });
    }
    if (forced.length || unsep.length) steps.push({ index, forced: forced.length, unseparated: unsep.length, names: [...new Set(forced.map(nameOf))].slice(0, 6) });
  }
  delete globalThis.__t3unsep;
  delete globalThis.__t3forced;
  return { hookless, steps, pairs: [...pairs].map(([key, v]) => ({ key, ...v })).sort((x, y) => x.margin - y.margin) };
})`;

export const PERF = String.raw`(async (frames, step, group) => {
  const { C, stage } = window.__tc;
  const name = group || C.scene().groups.find((g) => g.kind === "turn")?.name;
  const base = C.values[name] || 0;
  const ms = [];
  const writes = [];
  const moved = [];
  const times = [];
  await new Promise((done) => {
    let i = 0;
    const tick = (now) => {
      times.push(now);
      const s = C.set({ [name]: base + i * step });
      ms.push(s.ms);
      writes.push(s.writes);
      moved.push(s.moved);
      i++;
      if (i < frames) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
  const gaps = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
  const sorted = (list) => list.slice().sort((a, b) => a - b);
  const median = (list) => sorted(list)[Math.floor(list.length / 2)];
  const p95 = (list) => sorted(list)[Math.floor(list.length * 0.95)];
  const live = [...stage.querySelectorAll("svg[data-live] *")].length;
  return { frames, setMedian: median(ms), setP95: p95(ms), writes: median(writes), moved: median(moved), gapMedian: median(gaps), gapP95: p95(gaps), live };
})`;
