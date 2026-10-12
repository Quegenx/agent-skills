// drawkit.js: a drawing library as one classic script (pages render
// from file://, where ES modules are blocked). Load after pen.js when you use the bean cast:
//   <script src="pen.js"></script><script src="drawkit.js"></script>
// Namespaces: Draw.core (easing, noise, paths, ik, hatch, fibre, grain, burst, speed lines), Draw.textures
// (paper, fibrePaper, lightBands, sun, moon, star4, grass, soil, nightSky, fleshCells, filmFinish), Draw.lowpoly
// (facetMass, ridge, skyGradient, facetCloud, RAMPS), Draw.fx (timeWarp, shake, burstParticles, landDust, ring,
// flashAlpha, comicText, floatText, afterimages, starburst, heart), Draw.nature (sprout, melonLeaf, tendril,
// vine, blossom, bee, drop), Draw.colony (leaf, leafPiece, egg, larva, cocoon, seedGrain, fungus, roots,
// nestCanvas), Draw.rigs.{ant, bean, bug, chibi, critter}. Usage and rules: seek-engine ILLUSTRATION.md.
//
// MIT licence, see LICENSE-pen.txt:
// each module's code is unchanged; only its import/export lines are rewritten, and @napi-rs/canvas is replaced
// by the browser canvas. Everything draws as a pure function of its inputs (seeded, no Math.random, no Date).
// Heavy surfaces (paper, soil, facetMass, nestCanvas) return a canvas: build them once, then drawImage per frame.
(() => {
const Draw = window.Draw = { rigs: {} }
const createCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
// ---------------------------------------------------------------- core.mjs
Draw.core = (() => {
// core.mjs — maths, easing, noise, path helpers and the two textures everything uses (grain, hatch).
// Pure functions of their inputs: no Math.random, no Date. Same frame in, same pixels out.


// ------------------------------------------------------------------ numbers
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const rad = (d) => d * Math.PI / 180;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };   // smoothstep window
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const rng = (seed) => { let s = Math.max(1, Math.floor(seed)) % 2147483647; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1; };

// ------------------------------------------------------------------ easing (k in 0..1)
const eOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
const eIn = (k) => Math.pow(clamp(k), 3);
const eIO = (k) => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eExpo = (k) => (k = clamp(k), k === 1 ? 1 : 1 - Math.pow(2, -10 * k));
const eBack = (k, s = 1.8) => { k = clamp(k) - 1; return 1 + (s + 1) * k * k * k + s * k * k; };      // overshoot, settles at 1
const eElastic = (k) => { k = clamp(k); return k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI / 3)) + 1; };
const eBounce = (k) => { k = clamp(k); const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
// a pop-in scale that overshoots: 0 before t0, ~1.1 at the peak, 1 after `d` seconds
const popS = (t, t0, d = .38, s = 2.2) => t < t0 ? 0 : eBack((t - t0) / d, s);

// ------------------------------------------------------------------ geometry
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const centroid = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
const ellPts = (cx, cy, rx, ry, n = 24, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const rrect = (x, y, w, h, r) => { const p = [], k = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  for (const [cx, cy, a0] of k) for (let i = 0; i <= 4; i++) { const a = rad(a0 + i * 22.5); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
function catmull(P, closed = false, step = 7) {           // dense points through control points
  const out = [], n = P.length, g = (i) => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < m; s++) { const t = s / m, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
  }
  out.push(closed ? [...P[0]] : [...P[n - 1]]); return out;
}
function densify(P, step = 7) { const out = [];
  for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], m = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step)); for (let s = 0; s < m; s++) out.push([lerp(x0, x1, s / m), lerp(y0, y1, s / m)]); }
  out.push([...P[P.length - 1]]); return out; }
// arc-length sampler: path(pts).at(u) -> [x, y, angle], .slice(u) -> points up to u
function pathOf(pts) {
  const D = catmull(pts, false, 5), L = [0]; for (let i = 1; i < D.length; i++) L.push(L[i - 1] + Math.hypot(D[i][0] - D[i - 1][0], D[i][1] - D[i - 1][1]));
  const T = L[L.length - 1];
  const idx = (u) => { const lim = clamp(u) * T; let i = 1; while (i < D.length - 1 && L[i] < lim) i++; return [i, (lim - L[i - 1]) / ((L[i] - L[i - 1]) || 1)]; };
  return { length: T, points: D,
    at(u) { const [i, k] = idx(u), a = D[i - 1], b = D[i]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])]; },
    slice(u) { const [i, k] = idx(u), out = D.slice(0, i); const a = D[i - 1], b = D[i]; out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); return out; } };
}
// 2-bone IK: joint position for a limb from `a` to `c` with segment lengths l1, l2; bendUp picks the side
// pref: which way the joint should point — true = up, or a direction vector [dx, dy] (e.g. [-.6, -.8] = back and up)
function ik(a, c, l1, l2, pref = true) {
  const dx = c[0] - a[0], dy = c[1] - a[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + .01, l1 + l2 - .01);
  const base = Math.atan2(dy, dx), off = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const cand = [base + off, base - off].map((ang) => [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1]);
  const v = pref === true ? [0, -1] : pref === false ? [0, 1] : pref, score = (p) => (p[0] - a[0]) * v[0] + (p[1] - a[1]) * v[1];
  return score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1];
}

// ------------------------------------------------------------------ canvas helpers
const INK = "#1E1612";
function poly(ctx, pts, close = true) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath(); }
function smooth(ctx, pts, close = true) {                  // quadratic through midpoints: soft organic outlines
  const n = pts.length, g = (i) => close ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
  ctx.beginPath(); ctx.moveTo(...(close ? mid(g(-1), g(0)) : g(0)));
  for (let i = 0; i < (close ? n : n - 1); i++) { const a = g(i), b = g(i + 1), m = mid(a, b); ctx.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  if (!close) ctx.lineTo(...g(n - 1)); else ctx.closePath();
}
function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); }
function stroke(ctx, w = 3, c = INK) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
function fill(ctx, c) { ctx.fillStyle = c; ctx.fill(); }
function line(ctx, pts, w = 2, c = INK, dash = null) { ctx.save(); if (dash) ctx.setLineDash(dash); poly(ctx, pts, false); stroke(ctx, w, c); ctx.restore(); }
function at(ctx, x, y, s, r, fn) { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
// tapered stroke (thick in the middle, thin at the ends) — for limbs, stems, antennae
function taper(ctx, pts, w0, w1, c = INK) { for (let i = 0; i < pts.length - 1; i++) line(ctx, [pts[i], pts[i + 1]], lerp(w0, w1, i / Math.max(1, pts.length - 2)), c); }

// ------------------------------------------------------------------ texture
function grainCanvas(sz = 256, amt = 60, seed = 3) {
  const c = createCanvas(sz, sz), x = c.getContext("2d"), d = x.createImageData(sz, sz), r = rng(seed);
  for (let i = 0; i < sz * sz; i++) { const v = 255 - Math.floor(Math.pow(r(), 2.2) * amt); d.data[i * 4] = v; d.data[i * 4 + 1] = v; d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
}
const _grain = {};
// multiply printed-paper grain over whatever `clipFn` outlines
function grainOver(ctx, clipFn, a = .5, amt = 60) {
  const key = amt; _grain[key] ??= ctx.createPattern(grainCanvas(256, amt, 3 + amt), "repeat");
  ctx.save(); clipFn(); ctx.clip(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = a; ctx.fillStyle = _grain[key]; ctx.fillRect(-4000, -4000, 8000, 8000); ctx.restore();
}
// parallel hatch lines inside `clipFn`, at angle `ang`, every `gap` px, inside bounding box `box`
function hatch(ctx, clipFn, ang, gap, c, w = 1, a = .35, box = [-600, -600, 2600, 2600]) {
  ctx.save(); clipFn(); ctx.clip(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha *= a;
  const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0);
  ctx.translate(cx, cy); ctx.rotate(ang); ctx.beginPath(); for (let d = -R; d < R; d += gap) { ctx.moveTo(-R, d); ctx.lineTo(R, d); } ctx.stroke(); ctx.restore();
}
// short random strokes along an angle: pencil / crayon fibre, used on suns, felt, fur
function fibre(ctx, clipFn, box, n, ang, len, cols, w = 1.2, a = .6, seed = 9) {
  const r = rng(seed); ctx.save(); clipFn(); ctx.clip(); ctx.lineCap = "round"; ctx.lineWidth = w; const [x0, y0, x1, y1] = box;
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), l = len * (.5 + r()), aa = ang + (r() - .5) * .5;
    ctx.globalAlpha = a * (.5 + r() * .5); ctx.strokeStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(aa) * l, y + Math.sin(aa) * l); ctx.stroke(); }
  ctx.restore();
}
// radial burst / impact lines around a point
function burst(ctx, x, y, r0, r1, n = 10, w = 3, c = INK, a0 = 0, span = Math.PI * 2) {
  for (let i = 0; i < n; i++) { const a = a0 + (span >= Math.PI * 2 ? i / n : i / Math.max(1, n - 1)) * span; line(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], w, c); }
}
// speed lines trailing behind a moving thing (dir = travel angle)
function speedLines(ctx, x, y, dir, n = 3, len = 50, gap = 12, w = 2.4, c = INK) {
  const bx = -Math.cos(dir), by = -Math.sin(dir), nx = -by, ny = bx;
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * gap, sx = x + bx * 30 + nx * o, sy = y + by * 30 + ny * o; line(ctx, [[sx, sy], [sx + bx * len * (1 - i * .15), sy + by * len * (1 - i * .15)]], w, c); }
}
function lerpColor(a, b, k) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(",")})`; }

return { catmull, densify, pathOf, ik, poly, smooth, ellipse, stroke, fill, line, at, taper, grainCanvas, grainOver, hatch, fibre, burst, speedLines, lerpColor, clamp, lerp, rad, ss, hash, rng, noise1, eOut, eIn, eIO, eExpo, eBack, eElastic, eBounce, popS, mid, centroid, ellPts, rrect, INK, createCanvas, Path2D }
})()
// ---------------------------------------------------------------- textures.mjs
Draw.textures = (() => {
// textures.mjs — surfaces. Heavy ones are built ONCE (per scene) into an offscreen canvas and blitted
// every frame; only what moves is drawn per frame. Each material gets three layers:
//   base colour  ->  texture (grain / hatch / cells / fibre)  ->  edge (outline, rim light, pooled edge)
const { createCanvas, rng, hash, lerp, rad, ellipse, stroke, fill, line, hatch, fibre, grainCanvas, INK } = Draw.core;
// warm paper with printed grain
function paper(W, H, color = "#F3EEDD", grain = .35) {
  const c = createCanvas(W, H), x = c.getContext("2d"); x.fillStyle = color; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "multiply"; x.globalAlpha = grain; x.fillStyle = x.createPattern(grainCanvas(256, 40, 7), "repeat"); x.fillRect(0, 0, W, H);
  return c;
}
// warm paper with fibres, blotches and a soft vignette (the brush-ink look)
function fibrePaper(W, H, color = "#F3EBDA") {
  const c = createCanvas(W, H), x = c.getContext("2d"); x.fillStyle = color; x.fillRect(0, 0, W, H);
  x.globalAlpha = .05; x.strokeStyle = "#8A7456"; x.lineWidth = 1;
  for (let i = 0; i < W * H / 800; i++) { const px = hash(i * 3.1) * W, py = hash(i * 5.7) * H, a = hash(i * 7.3) * Math.PI, l = 6 + hash(i * 1.9) * 22;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * .5 + 3, py + Math.sin(a) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  x.globalAlpha = 1;
  for (let i = 0; i < 26; i++) { const px = hash(i * 11.1) * W, py = hash(i * 13.3) * H, r = 80 + hash(i * 2.2) * 260, g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "rgba(150,120,80,0.035)"); g.addColorStop(1, "rgba(150,120,80,0)"); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  x.globalCompositeOperation = "multiply"; x.globalAlpha = .55; x.fillStyle = x.createPattern(grainCanvas(256, 26, 5), "repeat"); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  const v = x.createRadialGradient(W / 2, H * .46, H * .35, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, "rgba(90,70,40,0)"); v.addColorStop(1, "rgba(90,70,40,0.16)"); x.fillStyle = v; x.fillRect(0, 0, W, H);
  return c;
}
// wide diagonal light bands drifting across the sky (textured-editorial signature)
function lightBands(ctx, W, H, t, { alpha = .55, color = "#EEDDB4", angle = 40, width = 78, gap = 250, drift = 14 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.translate(W / 2, H / 2); ctx.rotate(rad(angle));
  const R = Math.hypot(W, H), off = (t * drift) % gap; for (let d = -R; d < R; d += gap) ctx.fillRect(-R, d + off, R * 2, width); ctx.restore();
}
// a textured sun: warm gradient, two crossing fibre hatches, outline, rays
function sun(ctx, x, y, r, { rays = 12, rayColor = "#D9A035", len = [1.25, 1.6], rayW = 3 } = {}) {
  ctx.save(); ellipse(ctx, x, y, r, r); const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, "#F6C35A"); g.addColorStop(1, "#EFA43A"); fill(ctx, g);
  fibre(ctx, () => ellipse(ctx, x, y, r, r), [x - r, y - r, x + r, y + r], Math.round(r * 5), rad(-60), r * .22, ["#E07D22", "#D9661B", "#F8D27A"], Math.max(1, r / 45), .55, 5);
  ellipse(ctx, x, y, r, r); stroke(ctx, Math.max(1.5, r / 36));
  for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2 + .12; line(ctx, [[x + Math.cos(a) * r * len[0], y + Math.sin(a) * r * len[0]], [x + Math.cos(a) * r * len[1], y + Math.sin(a) * r * len[1]]], rayW, rayColor); }
  ctx.restore();
}
function moon(ctx, x, y, r) { ellipse(ctx, x, y, r, r); fill(ctx, "#D9D9DE"); ctx.save(); ellipse(ctx, x, y, r, r); ctx.clip(); ellipse(ctx, x + r * .5, y - r * .25, r * .95, r); fill(ctx, "#A8A8B6"); ctx.restore(); ellipse(ctx, x, y, r, r); stroke(ctx, 2.2); }
function star4(ctx, x, y, r, color = "#EDEBFF") { ctx.fillStyle = color; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * .23 : r; i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
// a row of grass blades along a ground line
function grass(ctx, y, x0, x1, h = 18, seed = 3, cols = ["#6FA45A", "#8DB872"]) {
  const r = rng(seed); ctx.save(); ctx.lineCap = "round";
  for (let x = x0; x < x1; x += 6 + r() * 6) { const hh = h * (.4 + r() * .8), lean = (r() - .5) * 8; ctx.strokeStyle = cols[r() > .5 ? 0 : 1]; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * .3, y - hh * .6, x + lean, y - hh); ctx.stroke(); }
  ctx.restore();
}
// soil cross-section: "dig" (warm, pebbles), "day" (lighter, blotches), "night" (dark, star-like specks)
function soil(W, H, kind = "day") {
  const c = createCanvas(W, H), x = c.getContext("2d"), r = rng({ dig: 11, night: 21, day: 31 }[kind] || 7);
  x.fillStyle = { dig: "#8C5E3D", night: "#3A2519", day: "#9A6A45" }[kind]; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "multiply"; x.globalAlpha = .5; x.fillStyle = x.createPattern(grainCanvas(256, 70, 5 + kind.length), "repeat"); x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  if (kind !== "night") hatch(x, () => { x.beginPath(); x.rect(0, 0, W, H); }, rad(-32), 7, "#5E3C24", 1, .25, [0, 0, W, H]);
  x.strokeStyle = kind === "night" ? "rgba(200,170,140,.35)" : "rgba(70,40,20,.55)"; x.lineWidth = 1.6;
  for (const f of [.24, .44, .65]) { const yy = f * H; x.beginPath(); for (let i = 0; i <= 40; i++) { const px = i / 40 * W, py = yy + Math.sin(i * .7 + yy) * 7 + Math.sin(i * 1.9) * 3; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  for (let i = 0; i < W * H / (kind === "night" ? 3000 : 4400); i++) { const px = r() * W, py = r() * H, s = r();
    if (kind === "night") { x.fillStyle = s > .7 ? "rgba(240,225,200,.8)" : "rgba(160,120,90,.6)"; x.beginPath(); x.arc(px, py, .8 + s * 1.8, 0, 7); x.fill();
      if (s > .93) { ellipse(x, px, py, 9 + 6 * s, 6 + 4 * s, s * 3); stroke(x, 1, "rgba(200,170,140,.5)"); } }
    else if (s > .88 && kind === "dig") { ellipse(x, px, py, 12 + 8 * r(), 9 + 5 * r(), r() * 3); fill(x, "#E7D2A6"); stroke(x, 1.6, "#3B2414"); }
    else { x.fillStyle = s > .5 ? "#6E4529" : "#7E5233"; ellipse(x, px, py, 3 + s * 9, 2.5 + s * 6, r() * 3); x.fill(); } }
  return c;
}
// a night sky strip: navy, fine hatch, dots and four-point stars
function nightSky(W, H, seed = 9) {
  const c = createCanvas(W, H), x = c.getContext("2d"), r = rng(seed); x.fillStyle = "#1C2458"; x.fillRect(0, 0, W, H);
  hatch(x, () => { x.beginPath(); x.rect(0, 0, W, H); }, rad(-20), 4, "#2A3470", 1, .6, [0, 0, W, H]);
  for (let i = 0; i < W * H / 6000; i++) { const px = r() * W, py = r() * H, s = r(); if (s > .82) star4(x, px, py, 7); else { x.fillStyle = "#EDEBFF"; x.beginPath(); x.arc(px, py, 1 + s, 0, 7); x.fill(); } }
  return c;
}
// fruit flesh as packed juice cells (watermelon, citrus with other colours)
function fleshCells(w, h, { base = "#D02A3B", cell = [200, 30, 50], line = "rgba(120,10,25,.55)", hi = "rgba(255,200,205,.6)", size = 17 } = {}) {
  const c = createCanvas(w, h), x = c.getContext("2d"), r = rng(17); x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let yy = size / 2; yy < h; yy += size) for (let xx = (yy / size % 2) * size / 2; xx < w; xx += size + 1) {
    const px = xx + (r() - .5) * 6, py = yy + (r() - .5) * 5, rr = size * .42 + r() * 3;
    x.fillStyle = `rgba(${cell[0] + r() * 40 | 0},${cell[1] + r() * 25 | 0},${cell[2] + r() * 20 | 0},.9)`; ellipse(x, px, py, rr, rr * .85, r() * 3); x.fill(); x.strokeStyle = line; x.lineWidth = 1.4; x.stroke();
    if (r() > .6) { x.fillStyle = hi; x.beginPath(); x.arc(px - 2, py - 2, 1.4, 0, 7); x.fill(); } }
  return c;
}
// film finish: a few precomputed grain tiles cycled per frame + tiny exposure flicker + vignette
function filmFinish(W, H, { tiles = 4, grain = .12, flicker = .025, vignette = .18 } = {}) {
  const T = Array.from({ length: tiles }, (_, i) => grainCanvas(256, 90, 101 + i * 7));
  const v = createCanvas(W, H), vx = v.getContext("2d"), g = vx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55);
  g.addColorStop(0, "rgba(40,30,20,0)"); g.addColorStop(1, `rgba(40,30,20,${vignette})`); vx.fillStyle = g; vx.fillRect(0, 0, W, H);
  return (ctx, frame) => { ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = grain; const tile = T[frame % tiles];
    const ox = Math.floor(hash(frame) * 256), oy = Math.floor(hash(frame + 5) * 256); ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(tile, "repeat"); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
    ctx.drawImage(v, 0, 0);
    const f = (hash(frame * 1.3) - .5) * 2 * flicker; if (f) { ctx.save(); ctx.globalCompositeOperation = f > 0 ? "screen" : "multiply"; ctx.fillStyle = f > 0 ? `rgba(255,250,240,${f})` : `rgba(0,0,0,${-f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } };
}

return { paper, fibrePaper, lightBands, sun, moon, star4, grass, soil, nightSky, fleshCells, filmFinish }
})()
// ---------------------------------------------------------------- lowpoly.mjs
Draw.lowpoly = (() => {
// lowpoly.mjs — faceted flat-vector illustration (the "poster landscape" look): every mass is cut into
// triangles, each triangle lit as a flat plane from one light direction and coloured from a gradient ramp.
// No outlines. Depth comes from layers that fade toward the sky colour (atmospheric perspective).
//
//   const rock = facetMass(W, H, polygon, { ramp: RAMPS.canyon, light: [-.7, -.5, .5], cell: 38, dome: [cx, halfWidth] })
//   ctx.drawImage(rock, 0, 0)                 // bake once in setup(), blit every frame
//
// ramp: colours from shadow to lit. The shading value is (normal · light), bent by `contrast`, darkened
// toward the bottom by `bottomDark`, and pulled toward `haze` by `fade` for distant layers.
const { createCanvas, clamp, lerp, hash } = Draw.core;
const RAMPS = {
  canyon: ["#2A0F2E", "#5A1840", "#9C2A4A", "#D8452F", "#F2702A", "#FF9A3C"],
  dusk: ["#2B1B45", "#4B2A63", "#7A3A78", "#B14E7A", "#E07A6E", "#F7B18A"],
  mesa: ["#3A1A2A", "#6B2A3A", "#A8434A", "#D46A4A", "#EE9A5E", "#F9C88A"],
  forest: ["#0F2A2A", "#18423A", "#24604A", "#3C8A5A", "#6BB06A", "#A8D48A"],
  ice: ["#1E2A4A", "#2E4A7A", "#4A76A8", "#7AA8D0", "#B8D8EC", "#EEF6FA"],
  water: ["#1A2450", "#2A3C78", "#3E5E9C", "#5E86BC", "#9CB8DA", "#DCE8F4"],
  balloon: ["#6A2A1E", "#A8452E", "#D2633E", "#E8835A", "#F4A97E", "#FFD0B0"],
  cloud: ["#B88A9C", "#D2A6B0", "#E8C4C4", "#F6DCD4", "#FFEDE4", "#FFF8F2"],
};
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function rampColor(ramp, v) { const k = clamp(v) * (ramp.length - 1), i = Math.min(ramp.length - 2, Math.floor(k)), f = k - i, a = hexRgb(ramp[i]), b = hexRgb(ramp[i + 1]); return a.map((c, j) => Math.round(lerp(c, b[j], f))); }
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)));

// 2-D value noise, fractal
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(a * 157.31 + b * 311.7 + s * 17.17); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); }
const fbm = (x, y, s = 1) => (vnoise(x, y, s) * .6 + vnoise(x * 2.1, y * 2.1, s + 3) * .3 + vnoise(x * 4.3, y * 4.3, s + 7) * .1);

// Bake a faceted mass into its own canvas (size W×H, polygon in that canvas's coordinates).
// opts: ramp, light [x,y,z] (x<0 = lit from the left), cell (facet size px), jitter (0..0.5), zAmp (relief),
//       freq (noise scale), dome [cx, halfWidth] (a rounded pillar), ridge (bias: brighter near the top),
//       bottomDark (0..1), contrast, fade (0..1 toward haze), haze (hex), seed
function facetMass(W, H, poly, o = {}) {
  const { ramp = RAMPS.canyon, light = [-.7, -.55, .45], cell = 56, jitter = .22, zAmp = 55, freq = .004, dome = null, ridge = .25, bottomDark = .45, contrast = 1.15, fade = 0, haze = "#F4E6D8", seed = 1 } = o;
  const c = createCanvas(W, H), x = c.getContext("2d");
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [px, py] of poly) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
  x0 -= cell; y0 -= cell; x1 += cell; y1 += cell;
  const nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1, P = [];
  const L = Math.hypot(...light), lx = light[0] / L, ly = light[1] / L, lz = light[2] / L, hz = hexRgb(haze);
  const z = (px, py) => { let v = fbm(px * freq, py * freq, seed) * zAmp; if (dome) { const d = clamp(1 - Math.pow((px - dome[0]) / dome[1], 2), 0, 1); v += Math.sqrt(d) * dome[1] * .9; } return v; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const jx = (hash(i * 7.1 + j * 13.3 + seed) - .5) * 2 * jitter * cell, jy = (hash(i * 3.7 + j * 5.9 + seed * 2) - .5) * 2 * jitter * cell;
    const px = x0 + i * cell + (j % 2 ? cell / 2 : 0) + jx, py = y0 + j * cell + jy; P.push([px, py, z(px, py)]); }
  x.save(); x.beginPath(); poly.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.clip();
  const tri = (a, b, d) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let Nx = uy * vz - uz * vy, Ny = uz * vx - ux * vz, Nz = ux * vy - uy * vx; if (Nz < 0) { Nx = -Nx; Ny = -Ny; Nz = -Nz; } const n = Math.hypot(Nx, Ny, Nz) || 1;
    let v = (Nx * lx + Ny * ly + Nz * lz) / n; v = clamp((v - .1) * contrast + .45);
    const cy = (a[1] + b[1] + d[1]) / 3, depth = clamp((cy - y0) / (y1 - y0)); v = clamp(v + ridge * (1 - depth) * .5 - bottomDark * depth * .6);
    let col = rampColor(ramp, v); if (fade) col = mix(col, hz, fade);
    x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(d[0], d[1]); x.closePath(); x.fillStyle = rgb(col); x.fill(); x.strokeStyle = rgb(col); x.lineWidth = 1.2; x.stroke(); };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = P[j * nx + i], b = P[j * nx + i + 1], d = P[(j + 1) * nx + i], e = P[(j + 1) * nx + i + 1];
    if ((i + j) % 2) { tri(a, b, e); tri(a, e, d); } else { tri(a, b, d); tri(b, e, d); } }
  x.restore(); return c;
}
// ridge line helper: a mountain-range outline from control heights, closed down to `base`
function ridge(x0, x1, base, heights, seed = 1, rough = 18) {
  const P = [[x0, base]], n = heights.length; for (let i = 0; i <= 60; i++) { const u = i / 60, k = u * (n - 1), a = Math.floor(k), f = k - a, h = lerp(heights[a], heights[Math.min(n - 1, a + 1)], f * f * (3 - 2 * f));
    P.push([lerp(x0, x1, u), h + (hash(i * 3.3 + seed) - .5) * rough]); } P.push([x1, base]); return P;
}
// a smooth sky: vertical stops [[0, "#hex"], [1, "#hex"]] plus a sun glow
function skyGradient(ctx, W, H, stops, sun = null) {
  const g = ctx.createLinearGradient(0, 0, 0, H); for (const [o, c] of stops) g.addColorStop(o, c); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (sun) { const [sx, sy, r, col] = sun, gl = ctx.createRadialGradient(sx, sy, r * .6, sx, sy, r * 5); gl.addColorStop(0, col + "AA"); gl.addColorStop(1, col + "00"); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
}
// a faceted cloud baked to its own canvas
function facetCloud(w, h, seed = 1, ramp = RAMPS.cloud) {
  // a union of 4-5 domes on a flat base, sampled into one outline
  const bumps = Array.from({ length: 5 }, (_, i) => [w * (.14 + i * .18 + (hash(i + seed) - .5) * .06), h * (.28 + .5 * hash(i * 3 + seed)) * (i === 0 || i === 4 ? .6 : 1), w * (.13 + .06 * hash(i * 5 + seed))]);
  const top = (x) => { let y = h; for (const [cx, r, rw] of bumps) { const d = (x - cx) / rw; if (Math.abs(d) < 1) y = Math.min(y, h - r * Math.sqrt(1 - d * d) - h * .12); } return y; };
  const P = [[w * .04, h]]; for (let i = 0; i <= 60; i++) { const x = w * (.04 + .92 * i / 60); P.push([x, top(x)]); } P.push([w * .96, h]);
  return facetMass(w, h + 4, P, { ramp, light: [-.4, -.8, .5], cell: 34, zAmp: 20, dome: [w / 2, w * .46], bottomDark: .05, ridge: .6, contrast: .7, seed });
}

return { rampColor, facetMass, ridge, skyGradient, facetCloud, RAMPS, fbm }
})()
// ---------------------------------------------------------------- fx.mjs
Draw.fx = (() => {
// fx.mjs — game-feel effects, all pure functions of time (seeded, no state between frames).
//   hit-stop:      const tw = timeWarp(STOPS); g = tw.game(t) (freezes on contacts); tw.real(g) for sound cues
//   screen shake:  const [dx, dy] = shake(t, [[t0, amp], ...])
//   particles:     sparks / debris / dust / confetti / rising embers bursting at t0
//   impact:        ring(), flashAlpha(), comicText(), floatText(), afterimages via a draw callback
//   shapes:        starburst() (rounded-ray spark), heart(), speed lines are in core.mjs
const { clamp, lerp, eOut, eIn, eBack, rng, hash, ellipse, stroke, fill, line, at, poly, INK } = Draw.core;
// ---------------------------------------------------------------- hit-stop: game time freezes briefly on contact
// stops: [[gameTime, duration], ...] in GAME time. game(t) maps real -> game; real(g) maps game -> real.
function timeWarp(stops) {
  const S = [...stops].sort((a, b) => a[0] - b[0]);
  return {
    game(t) { let acc = 0; for (const [s, d] of S) { if (t < s + acc) break; if (t < s + acc + d) return s; acc += d; } return t - acc; },
    real(g) { let acc = 0; for (const [s, d] of S) { if (s >= g) break; acc += d; } return g + acc; },
    frozen(t) { let acc = 0; for (const [s, d] of S) { if (t < s + acc) break; if (t < s + acc + d) return true; acc += d; } return false; },
  };
}
// ---------------------------------------------------------------- screen shake: decaying, deterministic
function shake(t, events, dur = .45) {
  let x = 0, y = 0;
  for (const [t0, amp] of events) { const d = t - t0; if (d < 0 || d > dur) continue; const k = Math.exp(-d * 9) * amp;
    x += Math.sin(d * 97 + t0) * k; y += Math.cos(d * 83 + t0 * 3) * k * .8; }
  return [x, y];
}
// ---------------------------------------------------------------- particles
// kind: "spark" (streaks), "debris" (tumbling chunks), "dust" (puffs), "confetti", "ember" (rising glow)
function burstParticles(ctx, t, t0, x, y, o = {}) {
  const d = t - t0, { n = 14, speed = 520, life = .6, gravity = 900, colors = ["#FFD35A", "#FFF3C4", "#F28C28"], size = 8, kind = "spark", seed = 1, spread = Math.PI * 2, dir = -Math.PI / 2 } = o;
  if (d < 0 || d > life * 1.6) return;
  const r = rng(seed * 977 + Math.floor(t0 * 1000));
  for (let i = 0; i < n; i++) {
    const a = dir + (r() - .5) * spread, sp = speed * (.45 + r() * .75), L = life * (.6 + r() * .6), dd = Math.min(d, L), fade = 1 - clamp(d / L);
    if (fade <= 0) { r(); r(); continue; }
    const px = x + Math.cos(a) * sp * dd, py = y + Math.sin(a) * sp * dd + (kind === "ember" ? -gravity * .3 * dd * dd : .5 * gravity * dd * dd), col = colors[i % colors.length], sz = size * (.6 + r() * .8);
    ctx.save(); ctx.globalAlpha *= fade;
    if (kind === "spark") { const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp + gravity * dd, vl = Math.hypot(vx, vy) || 1; line(ctx, [[px, py], [px - vx / vl * sz * 3, py - vy / vl * sz * 3]], sz * .55, col); }
    else if (kind === "debris") { at(ctx, px, py, 1, d * (6 + i), () => { poly(ctx, [[-sz, -sz * .6], [sz * .8, -sz], [sz, sz * .7], [-sz * .7, sz]]); fill(ctx, col); stroke(ctx, 1.8); }); }
    else if (kind === "dust") { const s2 = sz * (1 + d * 3); ellipse(ctx, px, py, s2, s2 * .7); fill(ctx, col); }
    else if (kind === "confetti") { at(ctx, px, py, 1, d * 8 + i, () => { ctx.scale(Math.cos(d * 10 + i), 1); ctx.fillStyle = col; ctx.fillRect(-sz / 2, -sz * .7, sz, sz * 1.4); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(-sz / 2, -sz * .7, sz, sz * 1.4); }); }
    else if (kind === "ember") { const g = ctx.createRadialGradient(px, py, 0, px, py, sz * 2); g.addColorStop(0, col); g.addColorStop(1, "rgba(255,200,80,0)"); ctx.fillStyle = g; ctx.fillRect(px - sz * 2, py - sz * 2, sz * 4, sz * 4); }
    ctx.restore();
  }
}
// dust puff at the feet on landing (two clouds sliding out sideways)
function landDust(ctx, t, t0, x, y, s = 1, color = "rgba(214,190,150,.85)") {
  const d = t - t0; if (d < 0 || d > .5) return; const k = eOut(d / .5), a = 1 - d / .5;
  ctx.save(); ctx.globalAlpha *= a; for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) { const px = x + sg * (30 + k * (70 + i * 30)) * s, py = y - (6 + i * 7) * s - k * 10 * s, r = (16 + i * 5) * s * (1 - .3 * k);
    ellipse(ctx, px, py, r, r * .75); fill(ctx, color); ellipse(ctx, px, py, r, r * .75); stroke(ctx, 1.6, "rgba(90,70,50,.5)"); } ctx.restore();
}
// expanding shock ring
function ring(ctx, t, t0, x, y, r1 = 160, { dur = .35, w = 10, color = "#FFF3C4", squash = 1 } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; const k = eOut(d / dur);
  ctx.save(); ctx.globalAlpha *= 1 - d / dur; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, r1 * k), Math.max(1, r1 * k * squash), 0, 0, Math.PI * 2); ctx.lineWidth = w * (1 - k * .7); ctx.strokeStyle = color; ctx.stroke(); ctx.restore();
}
// full-frame (or local) white flash intensity after a hit
const flashAlpha = (t, t0, dur = .12) => (t < t0 || t > t0 + dur) ? 0 : 1 - (t - t0) / dur;
// radial impact spikes (comic "pow" star) behind a word
function impactStar(ctx, x, y, r, n = 12, color = "#FFD35A", rot = 0) {
  const P = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * .55 : r * (1 + .12 * hash(i)); P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  poly(ctx, P); fill(ctx, color); poly(ctx, P); stroke(ctx, 4);
}
// comic word that slams in over an impact star and holds, e.g. "POW!", "HIT!", "K.O."
function comicText(ctx, t, t0, x, y, str, { size = 90, dur = .7, color = "#FFFFFF", star = "#FFD35A", rot = -.12, font = "sans-serif" } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; const k = eBack(clamp(d / .16), 2.6), out = 1 - clamp((d - dur + .15) / .15);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k * out, k * out);
  if (star) impactStar(ctx, 0, -size * .3, size * 1.25, 12, star, d * 2);
  ctx.font = `${size}px "${font}"`; ctx.textAlign = "center"; ctx.lineJoin = "round"; ctx.lineWidth = size * .16; ctx.strokeStyle = INK; ctx.strokeText(str, 0, 0); ctx.fillStyle = color; ctx.fillText(str, 0, 0);
  ctx.restore();
}
// a number or word that pops and floats up, e.g. "+100", "-12"
function floatText(ctx, t, t0, x, y, str, { size = 44, color = "#FFFFFF", dur = .8, rise = 90, font = "sans-serif" } = {}) {
  const d = t - t0; if (d < 0 || d > dur) return; const k = eBack(clamp(d / .15), 2), a = 1 - clamp((d - dur * .6) / (dur * .4));
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y - eOut(d / dur) * rise); ctx.scale(k, k); ctx.font = `${size}px "${font}"`; ctx.textAlign = "center"; ctx.lineJoin = "round";
  ctx.lineWidth = size * .18; ctx.strokeStyle = INK; ctx.strokeText(str, 0, 0); ctx.fillStyle = color; ctx.fillText(str, 0, 0); ctx.restore();
}
// afterimages: call draw(ctx, gamePastTime, alpha) for a few earlier moments (dashes, fast flips)
function afterimages(ctx, g, draw, { n = 4, gap = .035, alpha = .35, tint = null } = {}) {
  for (let i = n; i >= 1; i--) { ctx.save(); ctx.globalAlpha *= alpha * (1 - i / (n + 1)); draw(ctx, g - i * gap, i); ctx.restore(); }
}
// a rounded-ray spark: the special-attack projectile, pickups, stars
function starburst(ctx, x, y, r, { rays = 10, color = "#D97757", inner = .4, rot = 0, glow = 0, outline = true } = {}) {
  if (glow > 0) { const g = ctx.createRadialGradient(x, y, r * .2, x, y, r * 2.2); g.addColorStop(0, `rgba(255,190,120,${.7 * glow})`); g.addColorStop(1, "rgba(255,190,120,0)"); ctx.fillStyle = g; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const drawRays = () => { ctx.beginPath(); let first = true; const pt = (x2, y2) => { first ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2); first = false; };
    for (let i = 0; i < rays; i++) { const a = i / rays * Math.PI * 2, w = Math.PI / rays * .85;
      pt(Math.cos(a - w) * r * inner, Math.sin(a - w) * r * inner);
      for (let k = 0; k <= 6; k++) { const aa = a - w * .35 + k / 6 * w * .7, rr = r * (1 - .06 * Math.pow((k - 3) / 3, 2)); pt(Math.cos(aa) * rr, Math.sin(aa) * rr); }
      pt(Math.cos(a + w) * r * inner, Math.sin(a + w) * r * inner); }
    ctx.closePath(); };
  drawRays(); const g2 = ctx.createRadialGradient(0, 0, r * .1, 0, 0, r); g2.addColorStop(0, "#FFD3B8"); g2.addColorStop(1, color); ctx.fillStyle = g2; ctx.fill(); if (outline) { ctx.lineWidth = Math.max(2, r * .045); ctx.strokeStyle = INK; ctx.lineJoin = "round"; ctx.stroke(); }
  ctx.restore();
}
function heart(ctx, x, y, s, full = true) {
  const P = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 2; P.push([x + 16 * Math.pow(Math.sin(a), 3) * s, y - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s]); }
  poly(ctx, P); fill(ctx, full ? "#E5484D" : "rgba(40,30,30,.35)"); if (full) { ellipse(ctx, x - 6 * s, y - 6 * s, 3.5 * s, 2.5 * s, -.5); fill(ctx, "rgba(255,255,255,.8)"); } poly(ctx, P); stroke(ctx, 3);
}

return { timeWarp, shake, burstParticles, landDust, ring, impactStar, comicText, floatText, afterimages, starburst, heart, flashAlpha }
})()
// ---------------------------------------------------------------- nature.mjs
Draw.nature = (() => {
// nature.mjs — plants and small creatures in the textured-editorial style.
// Every function draws at the current transform; place with at(ctx, x, y, s, rot, () => ...).
const { lerp, clamp, rad, eBack, ellipse, stroke, fill, line, at, poly, smooth, hatch, INK } = Draw.core;
// a sprout: stem + two cotyledons with midribs; droop 0..1 wilts them, shine 0..1 adds dew highlights
function sprout(ctx, { droop = 0, shine = 0, sway = 0, h = 158 } = {}) {
  const top = [sway * 8 + droop * 18, -h + droop * 20];
  smooth(ctx, [[0, 4], [-2, -h * .5], top], false); stroke(ctx, 16); smooth(ctx, [[0, 4], [-2, -h * .5], top], false); stroke(ctx, 11, "#7CC95A");
  line(ctx, [[-3, -10], [-4, -h * .6]], 2.4, "rgba(220,255,200,.55)");
  const leaf = (sg) => at(ctx, top[0], top[1], 1, sg * rad(18 + droop * 55) + (sg < 0 ? Math.PI : 0) + sway * .08, () => {
    ellipse(ctx, 70, 0, 70, 38); fill(ctx, "#94D46C"); hatch(ctx, () => ellipse(ctx, 70, 0, 70, 38), rad(30), 5, "#6DB04D", 1, .5, [0, -40, 140, 40]); ellipse(ctx, 70, 0, 70, 38); stroke(ctx, 3);
    line(ctx, [[6, 0], [128, 0]], 2, "#4F8C39"); for (let i = 1; i < 4; i++) { line(ctx, [[i * 30, 0], [i * 30 + 16, -18 + i]], 1.2, "#4F8C39"); line(ctx, [[i * 30, 0], [i * 30 + 16, 18 - i]], 1.2, "#4F8C39"); }
    if (shine > 0) { ctx.save(); ctx.globalAlpha *= shine; ellipse(ctx, 60, -12, 9, 9); fill(ctx, "#fff"); ellipse(ctx, 84, -4, 5, 5); fill(ctx, "#fff"); ctx.restore(); } });
  leaf(-1); leaf(1);
}
// a watermelon (cucurbit) leaf: five deep pointed lobes with serrated edges and pale veins
function melonLeaf(ctx, s = 1) {
  ctx.save(); ctx.scale(s, s); const pts = [];
  for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, main = Math.pow(Math.abs(Math.cos(a * 2.5)), 1.3), sub = .16 * Math.abs(Math.sin(a * 15)) * (.4 + main);
    pts.push([Math.cos(a) * 64 * (.3 + .7 * main + sub), Math.sin(a) * 60 * (.3 + .7 * main + sub)]); }
  poly(ctx, pts); fill(ctx, "#5EAA4E"); hatch(ctx, () => poly(ctx, pts), rad(40), 5, "#3E8A3A", 1, .5, [-70, -70, 70, 70]); poly(ctx, pts); stroke(ctx, 2.6);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; line(ctx, [[0, 0], [Math.cos(a) * 54, Math.sin(a) * 50]], 1.6, "#CFE8B4"); }
  ctx.restore();
}
// a tendril that rises and ends in a small curl-loop; k 0..1 grows it
function tendril(ctx, k = 1, s = 1) {
  const n = Math.max(2, Math.round(24 * k)), pts = [];
  for (let i = 0; i <= n; i++) { const q = i / 24; if (q < .6) pts.push([Math.sin(q * 5) * 8, -q * 110]); else { const a = (q - .6) / .4 * Math.PI * 1.8; pts.push([Math.sin(3) * 8 + 16 - Math.cos(a) * 16, -66 - Math.sin(a) * 16]); } }
  ctx.save(); ctx.scale(s, s); smooth(ctx, pts, false); stroke(ctx, 6.5); smooth(ctx, pts, false); stroke(ctx, 4, "#6CC05A");
  if (k > .95) { ellipse(ctx, pts[n][0], pts[n][1], 9, 9); stroke(ctx, 6.5); ellipse(ctx, pts[n][0], pts[n][1], 9, 9); stroke(ctx, 3.5, "#9BE07C"); } ctx.restore();
}
// a vine along points (already sliced to its grown length): outline, body, highlight, little hairs
function vine(ctx, pts, w = 18) {
  smooth(ctx, pts, false); stroke(ctx, w + 6); smooth(ctx, pts, false); stroke(ctx, w, "#4E9E47");
  ctx.save(); ctx.translate(-3, -3); smooth(ctx, pts, false); stroke(ctx, w * .28, "rgba(190,235,160,.6)"); ctx.restore();
  for (let i = 3; i < pts.length; i += 5) { const [x, y] = pts[i]; line(ctx, [[x, y - w * .65], [x + 4, y - w * 1.1]], 1.2); }
}
// a five-petal flower (yellow cucurbit blossom); open 0..1
function blossom(ctx, open = 1, color = "#F5CF3A") {
  const k = eBack(clamp(open)); ctx.save(); ctx.scale(k, k);
  for (let i = 0; i < 5; i++) at(ctx, 0, 0, 1, i / 5 * Math.PI * 2, () => { ellipse(ctx, 0, -52, 36, 48); fill(ctx, color); stroke(ctx, 2.6); line(ctx, [[0, -14], [0, -84]], 1.4, "#D9A92A"); line(ctx, [[0, -40], [-12, -70]], 1, "#D9A92A"); line(ctx, [[0, -40], [12, -70]], 1, "#D9A92A"); });
  ellipse(ctx, 0, 0, 20, 20); fill(ctx, "#B87A2A"); stroke(ctx, 2); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ellipse(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 2.2, 2.2); fill(ctx, "#7A4A18"); }
  ctx.restore();
}
// a bee: striped body, fuzz, wing blur that flaps with t
function bee(ctx, t, s = 1) {
  ctx.save(); ctx.scale(s, s);
  ctx.save(); ctx.globalAlpha *= .7; ellipse(ctx, -6, -34, 20, 14, -.4 + Math.sin(t * 60) * .3); fill(ctx, "#E9F4FA"); stroke(ctx, 1.6); ellipse(ctx, 8, -30, 16, 11, .3 + Math.sin(t * 60 + 1) * .3); fill(ctx, "#E9F4FA"); stroke(ctx, 1.4); ctx.restore();
  ellipse(ctx, 0, 0, 44, 28); fill(ctx, "#F2C230"); ctx.save(); ellipse(ctx, 0, 0, 44, 28); ctx.clip(); for (const x of [-20, 2, 24]) { ctx.fillStyle = INK; ctx.fillRect(x, -30, 11, 60); } ctx.restore();
  ellipse(ctx, 0, 0, 44, 28); stroke(ctx, 2.6); for (let i = 0; i < 14; i++) { const a = Math.PI * 1.1 + i / 13 * Math.PI * .8; line(ctx, [[Math.cos(a) * 44, Math.sin(a) * 28], [Math.cos(a) * 50, Math.sin(a) * 33]], 1); }
  line(ctx, [[42, 4], [52, 6]], 2.2); ellipse(ctx, -44, -2, 14, 14); fill(ctx, INK); ellipse(ctx, -48, -6, 3, 3); fill(ctx, "#fff");
  line(ctx, [[-50, -12], [-60, -30]], 1.6); line(ctx, [[-44, -14], [-48, -32]], 1.6);
  ctx.restore();
}
// a water drop (sweat, dew, rain)
function drop(ctx, s = 1, color = "#9CCBEA") { ctx.save(); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(10, 0, 0, 6); ctx.quadraticCurveTo(-10, 0, 0, -16); fill(ctx, color); stroke(ctx, 2); ellipse(ctx, -3, -2, 2, 3); fill(ctx, "#fff"); ctx.restore(); }

return { sprout, melonLeaf, tendril, vine, blossom, bee, drop }
})()
// ---------------------------------------------------------------- colony.mjs
Draw.colony = (() => {
// colony.mjs — an ant colony in cross-section, and what a leafcutter carries into it.
// Everything draws at the current transform (place with at()). All in the textured-editorial style:
// base → texture → edge on every surface (references/detail.md).
const { clamp, lerp, rad, rng, hash, ellipse, stroke, fill, line, poly, smooth, hatch, at, pathOf, INK, createCanvas, grainCanvas } = Draw.core;
// ---------------------------------------------------------------- leaves
// a broad leaf lying flat, seen from the side-above: serrated edge, midrib, side veins, hatch
function leaf(ctx, len = 600, { color = "#6DB352", cut = null } = {}) {
  const P = []; for (let i = 0; i <= 80; i++) { const u = i / 80, a = u * Math.PI * 2, x = Math.cos(a) * len / 2, w = Math.sin(a) * len * .2 * (1 - .25 * Math.cos(a));
    const serr = (i % 4 < 2 ? 1 : .94); P.push([x, w * serr]); }
  ctx.save(); poly(ctx, P);
  if (cut) { ctx.clip(); ctx.beginPath(); ctx.rect(-len, -len, len * 2, len * 2); ctx.arc(cut[0], cut[1], cut[2], 0, Math.PI * 2, true); ctx.clip(); poly(ctx, P); }
  const g = ctx.createLinearGradient(0, -len * .2, 0, len * .2); g.addColorStop(0, "#8CCB6A"); g.addColorStop(1, "#4E9A42"); fill(ctx, g);
  hatch(ctx, () => poly(ctx, P), rad(35), 6, "#3E8A3A", 1, .4, [-len / 2, -len * .25, len / 2, len * .25]);
  line(ctx, [[-len / 2 + 10, 0], [len / 2 - 8, 0]], 4, "#3D7A34"); for (let i = 1; i < 8; i++) { const x = -len / 2 + i * len / 8; line(ctx, [[x, 0], [x + len * .07, -len * .13]], 1.8, "#CFE8B4"); line(ctx, [[x, 0], [x + len * .07, len * .13]], 1.8, "#CFE8B4"); }
  poly(ctx, P); stroke(ctx, 3);
  if (cut) { ctx.beginPath(); ctx.arc(cut[0], cut[1], cut[2], 0, Math.PI * 2); stroke(ctx, 3); }
  ctx.restore();
}
// the half-moon piece a leafcutter carries; `bite` 0..1 nibbles its straight edge
function leafPiece(ctx, r = 70) {
  const P = []; for (let i = 0; i <= 30; i++) { const a = Math.PI + i / 30 * Math.PI; P.push([Math.cos(a) * r, Math.sin(a) * r * .9]); }
  for (let i = 0; i <= 10; i++) P.push([r - i * r * .2, (i % 2 ? 6 : 0)]);
  const g = ctx.createLinearGradient(0, -r, 0, 0); g.addColorStop(0, "#9AD47A"); g.addColorStop(1, "#58A74A"); poly(ctx, P); fill(ctx, g);
  hatch(ctx, () => poly(ctx, P), rad(35), 5, "#3E8A3A", 1, .45, [-r, -r, r, 4]);
  line(ctx, [[0, 0], [0, -r * .85]], 2.6, "#3D7A34"); line(ctx, [[0, -r * .3], [-r * .45, -r * .6]], 1.4, "#CFE8B4"); line(ctx, [[0, -r * .3], [r * .45, -r * .6]], 1.4, "#CFE8B4");
  poly(ctx, P); stroke(ctx, 2.8);
}

// ---------------------------------------------------------------- brood
function egg(ctx, s = 1) { ctx.save(); ctx.scale(s, s); ellipse(ctx, 0, 0, 9, 13); const g = ctx.createRadialGradient(-3, -5, 1, 0, 0, 14); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#E6E0D0"); fill(ctx, g); stroke(ctx, 1.8); ellipse(ctx, -3, -5, 2.4, 3.4); fill(ctx, "#fff"); ctx.restore(); }
// a C-shaped grub; wiggle 0..1 animates it
function larva(ctx, s = 1, wiggle = 0) {
  ctx.save(); ctx.scale(s, s); const P = [], Q = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (.2 + i / 12 * 1.4) + wiggle * .15 * Math.sin(i), r = 22 + wiggle * 2; P.push([Math.cos(a) * r, Math.sin(a) * r]); Q.push([Math.cos(a) * (r - 13 + i * .4), Math.sin(a) * (r - 13 + i * .4)]); }
  const S = [...P, ...Q.reverse()]; poly(ctx, S); const g = ctx.createLinearGradient(-20, -20, 20, 20); g.addColorStop(0, "#FFFDF6"); g.addColorStop(1, "#E3DAC4"); fill(ctx, g);
  for (let i = 1; i < 12; i++) { const a = Math.PI * (.2 + i / 12 * 1.4); line(ctx, [[Math.cos(a) * 9.5, Math.sin(a) * 9.5], [Math.cos(a) * 22, Math.sin(a) * 22]], 1, "rgba(120,100,70,.55)"); }
  poly(ctx, S); stroke(ctx, 2); const h = P[P.length - 1]; ellipse(ctx, h[0], h[1], 5, 5); fill(ctx, "#C8A878"); stroke(ctx, 1.4); ctx.restore();
}
function cocoon(ctx, s = 1) { ctx.save(); ctx.scale(s, s); ellipse(ctx, 0, 0, 14, 26); const g = ctx.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, "#E8D2A6"); g.addColorStop(1, "#B8966A"); fill(ctx, g);
  for (let i = -2; i <= 2; i++) line(ctx, [[-12, i * 9], [12, i * 9 + 3]], 1, "rgba(110,80,40,.5)"); ellipse(ctx, 0, 0, 14, 26); stroke(ctx, 2); ellipse(ctx, -5, -10, 3, 7); fill(ctx, "rgba(255,255,255,.6)"); ctx.restore(); }
function seedGrain(ctx, s = 1, r = 0) { at(ctx, 0, 0, s, r, () => { ellipse(ctx, 0, 0, 16, 9); fill(ctx, "#C9A45E"); line(ctx, [[-10, -2], [8, -4]], 1.6, "rgba(255,255,255,.6)"); ellipse(ctx, 0, 0, 16, 9); stroke(ctx, 1.8); }); }

// ---------------------------------------------------------------- fungus garden: a spongy white mass that grows
function fungus(ctx, w, h, grow = 1, seed = 4) {
  const r = rng(seed), n = Math.round(46 * clamp(grow)); ctx.save();
  for (let i = 0; i < n; i++) { const x = (r() - .5) * w, y = -Math.abs(r()) * h * Math.sqrt(1 - Math.pow(2 * x / w, 2)), rr = 16 + r() * 22;
    ellipse(ctx, x, y, rr, rr * .8); const g = ctx.createRadialGradient(x - rr * .3, y - rr * .3, 1, x, y, rr); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#DCD6C8"); fill(ctx, g); stroke(ctx, 1.4, "#8C8472");
    for (let k = 0; k < 3; k++) { ellipse(ctx, x + (r() - .5) * rr, y + (r() - .5) * rr * .6, 1.6, 1.6); fill(ctx, "#A89E86"); } }
  ctx.restore();
}

// ---------------------------------------------------------------- roots hanging from the surface
function roots(ctx, x, y, len, seed = 1, w = 7) {
  const r = rng(seed); const branch = (x0, y0, L, a, ww, d) => { if (d > 3 || L < 30) return; const pts = [[x0, y0]]; let px = x0, py = y0, ang = a;
    for (let i = 0; i < 8; i++) { ang += (r() - .5) * .35; px += Math.cos(ang) * L / 8; py += Math.sin(ang) * L / 8; pts.push([px, py]); }
    smooth(ctx, pts, false); stroke(ctx, ww + 2.4); smooth(ctx, pts, false); stroke(ctx, ww, "#C9A77A");
    for (let i = 2; i < pts.length; i += 2) for (let k = 0; k < 3; k++) { const [hx, hy] = pts[i], ha = r() * Math.PI * 2; line(ctx, [[hx, hy], [hx + Math.cos(ha) * 10, hy + Math.sin(ha) * 10]], .9, "rgba(220,200,160,.8)"); }
    for (let i = 3; i < pts.length - 1; i += 3) branch(pts[i][0], pts[i][1], L * .5, ang + (r() > .5 ? .7 : -.7), ww * .6, d + 1); };
  branch(x, y, len, Math.PI / 2, w, 0);
}

// ---------------------------------------------------------------- the nest: chambers and tunnels baked into a soil canvas
// spec: { W, H, ground, chambers: [{ id, x, y, rx, ry }], tunnels: [[[x,y],...], ...], seed }
// returns { canvas, paths } — paths are pathOf() samplers for walking ants along each tunnel
function nestCanvas(spec) {
  const { W, H, ground, chambers, tunnels, seed = 7 } = spec, c = createCanvas(W, H), x = c.getContext("2d"), r = rng(seed);
  // soil: base gradient deeper = darker, grain, hatch, strata, pebbles, specks
  const g = x.createLinearGradient(0, ground, 0, H); g.addColorStop(0, "#7A5234"); g.addColorStop(1, "#3E2616"); x.fillStyle = g; x.fillRect(0, ground, W, H - ground);
  x.globalCompositeOperation = "multiply"; x.globalAlpha = .5; x.fillStyle = x.createPattern(grainCanvas(256, 80, 13), "repeat"); x.fillRect(0, ground, W, H - ground); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  hatch(x, () => { x.beginPath(); x.rect(0, ground, W, H - ground); }, rad(-30), 8, "#2A180C", 1, .25, [0, ground, W, H]);
  x.strokeStyle = "rgba(210,170,120,.25)"; x.lineWidth = 2; for (let yy = ground + 220; yy < H; yy += 260 + r() * 120) { x.beginPath(); for (let px = 0; px <= W; px += 40) { const py = yy + Math.sin(px * .004 + yy) * 18 + Math.sin(px * .017) * 6; px ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  for (let i = 0; i < W * (H - ground) / 9000; i++) { const px = r() * W, py = ground + 30 + r() * (H - ground - 30), s = r();
    if (s > .92) { ellipse(x, px, py, 14 + r() * 20, 10 + r() * 12, r() * 3); fill(x, s > .97 ? "#8C7E70" : "#A08262"); stroke(x, 2, "#2A180C"); }
    else { x.fillStyle = s > .6 ? "rgba(230,200,160,.45)" : "rgba(30,15,8,.5)"; x.beginPath(); x.arc(px, py, 1 + s * 2.5, 0, 7); x.fill(); } }
  // tunnels first (so chambers sit on top), then chambers: warm lit interiors with a darker rim and a floor
  const T = tunnels.map((p) => pathOf(p));
  for (const t of T) { const pts = t.points; smooth(x, pts, false); stroke(x, 58, "#2A180C"); smooth(x, pts, false); stroke(x, 50, "#B98C62"); smooth(x, pts, false); stroke(x, 26, "rgba(236,200,150,.35)"); }
  for (const ch of chambers) { const { x: cx, y: cy, rx, ry } = ch;
    ellipse(x, cx, cy, rx + 6, ry + 6); fill(x, "#2A180C");
    ellipse(x, cx, cy, rx, ry); const cg = x.createRadialGradient(cx, cy - ry * .3, rx * .1, cx, cy, rx * 1.05); cg.addColorStop(0, "#F0CC98"); cg.addColorStop(.7, "#C9976A"); cg.addColorStop(1, "#8E6342"); fill(x, cg);
    hatch(x, () => ellipse(x, cx, cy, rx, ry), rad(20), 7, "#8E6342", 1, .3, [cx - rx, cy - ry, cx + rx, cy + ry]);
    x.save(); ellipse(x, cx, cy, rx, ry); x.clip(); x.fillStyle = "rgba(120,80,45,.55)"; x.fillRect(cx - rx, cy + ry * .55, rx * 2, ry); x.restore();   // floor
    ellipse(x, cx, cy, rx, ry); stroke(x, 3.4); }
  // the surface line
  x.fillStyle = "#6E4A2C"; x.fillRect(0, ground - 2, W, 8); line(x, [[0, ground], [W, ground]], 3.4);
  return { canvas: c, paths: T };
}

return { leaf, leafPiece, egg, larva, cocoon, seedGrain, fungus, roots, nestCanvas }
})()
// ---------------------------------------------------------------- rigs/ant.mjs
Draw.rigs.ant = (() => {
// ant.mjs — a detailed, poseable ant in the textured-editorial style (glossy chitin, hatching,
// setae, compound eye with two highlights, elbowed beaded antennae, toothed mandibles, 3-segment legs
// with tarsi and claws, a real tripod gait).
//
// LOCAL SPACE (read this before placing it): facing +x, origin = the point ON THE GROUND under the
// petiole (waist). Feet land on y = 0. So `ant(ctx, x, groundY, s, pose)` always stands on groundY —
// there is no "ground" knob to get out of sync (that knob once gave the ant stilt legs).
// Body length ≈ 300 * s px, standing height ≈ 150 * s px.
//
// pose: {
//   flip        face -x instead of +x
//   rot         body pitch in radians, about `pivot` (default: the rear feet) — climb, stand up, fall
//   pivot       [x, y] local pivot for rot
//   gait        phase (radians); advance it by ~speed*t*9. undefined = standing still
//   stride      step length (default 26)
//   rear        0..1: stand up on the hind legs (front + mid legs lift, body pitches back)
//   headDip     px the head drops (sniff, dig)
//   ant         antenna sway -1..1
//   jaw         mandible open 0..1
//   carry       fn(ctx) drawn at the mandibles (small object), or
//   overhead    fn(ctx) drawn above the head, held by the raised front legs
//   sweat       0..1 a drop on the head
//   blink       true = eye closed line
//   dust        0..1 little dust puffs at the feet
//   gaster      abdomen scale (queen ≈ 1.7): bigger, paler bands
//   look        { ink, fill, tex } 0..1 each: draw only some layers (build-up reveals)
// }
const { clamp, lerp, rad, ellipse, stroke: _stroke, fill: _fill, line: _line, at, hatch: _hatch, INK } = Draw.core;
const C = { hi: "#A2653F", mid: "#5A301D", lo: "#26130B", leg: "#2B1810", legFar: "#4A2C1E", rim: "rgba(214,150,108,.55)", spec: "rgba(255,244,232,.72)" };

// LAYERS. pose.look = { ink, fill, tex } (each 0..1) draws the ant as a build-up: ink = outlines, eye,
// antennae, tarsi; fill = flat body colour; tex = gradient, hatching, gloss, rim light, setae, shadow.
// Default all 1. Every draw call below goes through these wrappers, classed by its colour.
let LK = { ink: 1, fill: 1, tex: 1 };
const TEXC = new Set([C.spec, C.rim, "#fff", "shadow"]);
const kind = (c) => c === INK || c === "#0E0806" ? "ink" : (typeof c === "string" && (c.startsWith("rgba") || TEXC.has(c))) ? "tex" : "fill";
function withA(ctx, a, fn) { if (a <= 0) return; if (a >= 1) return fn(); ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); }
const stroke = (ctx, w, c = INK) => withA(ctx, LK[kind(c)], () => _stroke(ctx, w, c));
const line = (ctx, pts, w, c = INK) => withA(ctx, LK[kind(c)], () => _line(ctx, pts, w, c));
const fill = (ctx, c) => withA(ctx, LK[kind(c)], () => _fill(ctx, c));
const hatch = (ctx, ...a) => withA(ctx, LK.tex, () => _hatch(ctx, ...a));

// hips on the mesosoma underside (x, y) and neutral foot positions, near side. Far side is offset.
const LEGS = [
  // each leg is an inverted V: a short femur out to the knee, a long tibia down to the tarsus
  { hip: [64, -60], knee: [104, -80], foot: [140, 0], tar: 20, dir: 1 },    // front: knee forward and up
  { hip: [42, -58], knee: [52, -86], foot: [60, 0], tar: 18, dir: 1 },      // mid: knee up
  { hip: [22, -56], knee: [-24, -84], foot: [-72, 0], tar: 22, dir: -1 },   // hind: knee back and up, tibia crosses the gaster
];
// tripod gait: legs move in two alternating sets of three
const TRIPOD = [[0, 0], [1, 1], [0, 0]];   // [nearSet, farSet] for front, mid, hind  -> near front+hind with far mid

function chitin(ctx, cx, cy, r, pathFn) {
  const g = ctx.createRadialGradient(cx - r * .35, cy - r * .45, r * .08, cx, cy, r * 1.15);
  g.addColorStop(0, C.hi); g.addColorStop(.5, C.mid); g.addColorStop(1, C.lo); pathFn();
  withA(ctx, LK.fill * (1 - LK.tex), () => _fill(ctx, C.mid));          // flat colour stage
  withA(ctx, LK.fill * LK.tex, () => _fill(ctx, g));                     // modelled chitin
}
function setae(ctx, cx, cy, rx, ry, rot, a0, a1, n, len, w = 1.1) {
  for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / Math.max(1, n - 1), c = Math.cos(a), s = Math.sin(a);
    const x = cx + (c * rx * Math.cos(rot) - s * ry * Math.sin(rot)), y = cy + (c * rx * Math.sin(rot) + s * ry * Math.cos(rot));
    const nx = Math.cos(a + rot), ny = Math.sin(a + rot); withA(ctx, LK.tex, () => _line(ctx, [[x, y], [x + nx * len, y + ny * len + 1]], w, INK)); }
}

function leg(ctx, L, footOff, lift, far, rear, i) {
  const hip = [L.hip[0] + (far ? 8 : 0), L.hip[1] + (far ? -4 : 0)];
  let fx = L.foot[0] + footOff + (far ? 12 : 0), fy = -lift;
  if (rear > 0 && i < 2) { fx = lerp(fx, L.hip[0] + 30 + i * 10, rear); fy = lerp(fy, L.hip[1] - 50 + i * 30, rear); }   // arms up
  const ankle = [fx - L.dir * L.tar * .7, fy - L.tar * .55];
  const knee = [L.knee[0] + (far ? 8 : 0) + footOff * .5 + (rear > 0 && i < 2 ? (fx - L.foot[0]) * .5 : 0), L.knee[1] + (far ? -4 : 0) - lift * .5 + (rear > 0 && i < 2 ? fy * .5 : 0)];
  const col = far ? C.legFar : C.leg, k = far ? .8 : 1;
  ctx.save(); ctx.globalAlpha *= far ? .9 : 1;
  ellipse(ctx, hip[0], hip[1] + 2, 7 * k, 5.5 * k); fill(ctx, col); stroke(ctx, 1.4);                                  // coxa
  // femur: thick, tapering; tibia: thinner; both drawn as outline + fill so the joint reads
  for (const [a, b, w0] of [[hip, knee, 5.6], [knee, ankle, 3.8]]) {
    line(ctx, [a, b], w0 * k + 2.6, INK); line(ctx, [a, b], w0 * k, col);
    line(ctx, [[lerp(a[0], b[0], .15), lerp(a[1], b[1], .15) - 1.5], [lerp(a[0], b[0], .8), lerp(a[1], b[1], .8) - 1.5]], 1.4, "rgba(230,170,130,.45)");   // leg gloss
  }
  ellipse(ctx, knee[0], knee[1], 3.6 * k, 3.6 * k); fill(ctx, col); stroke(ctx, 1.3);                 // knee
  // tarsus: 3 small beads to the claw
  const tip = [fx + L.dir * L.tar * .25, fy];
  for (let j = 0; j < 3; j++) { const u0 = j / 3, u1 = (j + 1) / 3; line(ctx, [[lerp(ankle[0], tip[0], u0), lerp(ankle[1], tip[1], u0)], [lerp(ankle[0], tip[0], u1 - .07), lerp(ankle[1], tip[1], u1 - .07)]], 2.3 * k, INK); }
  line(ctx, [tip, [tip[0] + L.dir * 6, tip[1] - 3]], 1.6, INK); line(ctx, [tip, [tip[0] + L.dir * 6, tip[1] + 2]], 1.6, INK);   // claw
  ctx.restore();
}

function ant(ctx, x, y, s = 1, pose = {}) {
  const { flip = false, rot = 0, pivot: pv, gait, stride = 26, rear = 0, headDip = 0, jaw = 0, carry, overhead, sweat = 0, blink = false, dust = 0 } = pose;
  const antA = pose.ant ?? 0, pivot = pv ?? (pose.rear ? [-84, -26] : [-70, 0]);
  LK = { ink: 1, fill: 1, tex: 1, ...(pose.look || {}) };
  const walking = gait !== undefined, ph = gait ?? 0;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 3 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s);
  if (rot || rear) { ctx.translate(pivot[0], pivot[1]); ctx.rotate(rot - rear * rad(34)); ctx.translate(-pivot[0], -pivot[1]); }
  ctx.translate(0, bob);

  // contact shadow on the ground
  if (!rot && !rear) withA(ctx, LK.tex * .22, () => { ellipse(ctx, 10, 2, 150, 8); _fill(ctx, "#2A1A10"); });

  const footOff = (i, far) => { if (!walking) return 0; const set = TRIPOD[i][far ? 1 : 0], p = ph + (set ? Math.PI : 0); return Math.sin(p) * stride * .5; };
  const liftOf = (i, far) => { if (!walking) return 0; const set = TRIPOD[i][far ? 1 : 0], p = ph + (set ? Math.PI : 0); return Math.max(0, Math.cos(p)) * 12; };
  // far-side legs first
  LEGS.forEach((L, i) => leg(ctx, L, footOff(i, true), liftOf(i, true), true, rear, i));

  // ---------------- gaster (abdomen): segmented, glossy, hairy
  const gs = pose.gaster || 1, GRX = 66 * gs, GRY = 50 * gs, GX = -84 - (gs - 1) * 62, GY = -74 - (gs - 1) * 22, GR = rad(-12);
  chitin(ctx, GX, GY, GRX, () => ellipse(ctx, GX, GY, GRX, GRY, GR));
  ctx.save(); ellipse(ctx, GX, GY, GRX, GRY, GR); ctx.clip();
  for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(GX + GRX * (.9 - k * .38), GY, 14, GRY * 1.05, GR, -1.35, 1.35); stroke(ctx, 1.8, "rgba(20,8,4,.6)"); }   // tergite bands
  hatch(ctx, () => ellipse(ctx, GX, GY + 10, GRX, GRY * .7, GR), rad(-60), 5, "#1A0B06", 1, .35, [GX - 70, GY - 50, GX + 70, GY + 50]);             // form shading
  ctx.beginPath(); ctx.ellipse(GX, GY, GRX - 3, GRY - 3, GR, .2, 2.4); stroke(ctx, 3, C.rim);                                                  // bounce rim light
  ctx.restore();
  ellipse(ctx, GX, GY, GRX, GRY, GR); stroke(ctx, 3.4);
  at(ctx, GX - 16, GY - 30, 1, rad(-22), () => { ellipse(ctx, 0, 0, 24, 7); fill(ctx, C.spec); ellipse(ctx, 22, 5, 4, 3); fill(ctx, C.spec); });   // specular streak + dot
  setae(ctx, GX, GY, GRX, GRY, GR, Math.PI * .55, Math.PI * 1.35, 16, 7);

  // ---------------- petiole: the narrow waist with one node
  line(ctx, [[-22, -70], [0, -68]], 9, INK); line(ctx, [[-22, -70], [0, -68]], 6, C.mid);
  chitin(ctx, -8, -80, 12, () => { ctx.beginPath(); ctx.moveTo(-18, -70); ctx.quadraticCurveTo(-10, -96, 2, -72); ctx.closePath(); });
  ctx.beginPath(); ctx.moveTo(-18, -70); ctx.quadraticCurveTo(-10, -96, 2, -72); stroke(ctx, 2.4);

  // ---------------- mesosoma (thorax): pronotum hump, mesonotum, propodeum with a tiny spine
  const meso = () => { ctx.beginPath(); ctx.moveTo(0, -66); ctx.bezierCurveTo(4, -86, 22, -84, 30, -80); ctx.bezierCurveTo(38, -92, 58, -100, 76, -88);
    ctx.bezierCurveTo(86, -80, 84, -64, 72, -58); ctx.bezierCurveTo(48, -52, 18, -54, 0, -66); ctx.closePath(); };
  chitin(ctx, 44, -76, 40, meso);
  ctx.save(); meso(); ctx.clip(); hatch(ctx, () => ellipse(ctx, 44, -60, 50, 12), rad(-50), 4.5, "#1A0B06", 1, .35, [0, -100, 90, -50]); ctx.restore();
  meso(); stroke(ctx, 2.8);
  line(ctx, [[30, -80], [34, -60]], 1.4, "rgba(20,8,4,.55)");                               // segment suture
  line(ctx, [[46, -94], [66, -95]], 2, C.spec);                                              // gloss
  line(ctx, [[4, -80], [-2, -88]], 2, INK);                                                  // propodeal spine

  // near-side legs over the body
  LEGS.forEach((L, i) => leg(ctx, L, footOff(i, false), liftOf(i, false), false, rear, i));

  // ---------------- head
  ctx.save(); ctx.translate(96, -96 + headDip); ctx.rotate(rad(headDip * .5));
  const head = () => { ctx.beginPath(); ctx.moveTo(-18, 2); ctx.bezierCurveTo(-20, -24, 12, -34, 30, -20); ctx.bezierCurveTo(42, -10, 40, 14, 26, 20); ctx.bezierCurveTo(8, 26, -14, 20, -18, 2); ctx.closePath(); };
  chitin(ctx, 8, -6, 32, head);
  ctx.save(); head(); ctx.clip(); hatch(ctx, () => ellipse(ctx, 10, 10, 30, 14), rad(-40), 4, "#1A0B06", 1, .3, [-20, -30, 40, 30]); ctx.restore();
  head(); stroke(ctx, 3);
  // mandibles (open with `jaw`), with teeth
  for (const [sg, far] of [[1, true], [1, false]]) at(ctx, 34, 10, 1, rad(far ? 10 + jaw * 26 : -8 - jaw * 18), () => {
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(18, -6, 22, 6); ctx.lineTo(16, 4); ctx.lineTo(14, 8); ctx.lineTo(9, 4); ctx.lineTo(6, 7); ctx.quadraticCurveTo(2, 4, 0, 4); ctx.closePath();
    fill(ctx, far ? C.legFar : "#3A2014"); stroke(ctx, 1.8); });
  line(ctx, [[22, -4], [30, 4]], 1.4, "rgba(20,8,4,.6)");                                      // clypeus
  // compound eye: dark, a faceted sheen, two highlights
  if (blink) line(ctx, [[10, -12], [24, -10]], 2.6);
  else { ellipse(ctx, 17, -11, 9, 8, rad(-15)); fill(ctx, "#0E0806"); ctx.save(); ellipse(ctx, 17, -11, 9, 8, rad(-15)); ctx.clip(); hatch(ctx, () => ellipse(ctx, 17, -11, 9, 8), rad(45), 2.2, "#4A3A34", .8, .5, [6, -20, 28, -2]); ctx.restore();
    ellipse(ctx, 14, -14, 3.2, 2.6); fill(ctx, "#fff"); ellipse(ctx, 20, -8, 1.4, 1.4); fill(ctx, "#fff"); }
  // antennae: long scape to the elbow, then a beaded funiculus ending in a club
  const antenna = (far) => { const sw = antA * (far ? .7 : 1), base = far ? [6, -26] : [12, -24];
    const elbow = [base[0] + 10 + sw * 8, base[1] - 50], tipA = rad(-58 + sw * 22 + (far ? -8 : 0));
    line(ctx, [base, elbow], far ? 3 : 3.6, far ? C.legFar : INK);
    let p = elbow; for (let j = 0; j < 10; j++) { const l = 6.2, a = tipA + j * .03 * (1 + sw); const q = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
      line(ctx, [p, q], (far ? 2.2 : 2.8) + j * .12, far ? C.legFar : INK); ellipse(ctx, q[0], q[1], (1.6 + j * .12) * (far ? .8 : 1), (1.6 + j * .12) * (far ? .8 : 1)); fill(ctx, far ? C.legFar : INK); p = q; }
    ellipse(ctx, p[0], p[1], far ? 3 : 3.6, far ? 3 : 3.6); fill(ctx, far ? C.legFar : INK); };
  ctx.save(); ctx.globalCompositeOperation = "destination-over"; antenna(true); ctx.restore(); antenna(false);
  setae(ctx, 8, -6, 30, 22, 0, Math.PI * 1.1, Math.PI * 1.5, 5, 4, .9);
  // sweat drop
  if (sweat > 0) { const dy = -54 - sweat * 8; ctx.save(); ctx.globalAlpha *= clamp(sweat * 3); ctx.beginPath(); ctx.moveTo(34, dy - 14); ctx.quadraticCurveTo(43, dy, 34, dy + 5); ctx.quadraticCurveTo(25, dy, 34, dy - 14); fill(ctx, "#9CCBEA"); stroke(ctx, 2); ellipse(ctx, 31, dy - 2, 2, 3); fill(ctx, "#fff"); ctx.restore(); }
  if (carry) at(ctx, 52, 12, 1, 0, () => carry(ctx));
  ctx.restore();
  if (overhead) at(ctx, 90, -196, 1, 0, () => overhead(ctx));
  if (dust > 0) { ctx.save(); ctx.globalAlpha *= dust; for (const fx of [-60, 40, 128]) { ellipse(ctx, fx - 8, -3, 7, 4); fill(ctx, "rgba(150,120,90,.5)"); ellipse(ctx, fx + 6, -5, 5, 3); fill(ctx, "rgba(150,120,90,.4)"); } ctx.restore(); }
  ctx.restore();
}

// a watermelon seed, glossy, tip to the right; ~72 x 52 px at s = 1
function seed(ctx, s = 1, pale = false) {
  ctx.save(); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(-34, 6); ctx.bezierCurveTo(-30, -26, 18, -30, 38, -2); ctx.bezierCurveTo(24, 22, -26, 28, -34, 6); ctx.closePath();
  if (pale) fill(ctx, "#EFE6CF"); else { const g = ctx.createLinearGradient(0, -28, 0, 24); g.addColorStop(0, "#3E2C24"); g.addColorStop(1, "#110A07"); fill(ctx, g); }
  stroke(ctx, 2.6); line(ctx, [[-18, -8], [2, -16], [22, -12]], 2.4, pale ? "rgba(160,140,110,.6)" : "rgba(255,255,255,.55)"); ctx.restore();
}

// Construction guides for the ant, in blue: the shapes and lines an illustrator blocks in before inking.
// p 0..1 draws them on in order. Same arguments as ant() so the two line up exactly.
function antGuides(ctx, x, y, s = 1, p = 1, { color = "#5E80CC", flip = false, w = 2 } = {}) {
  const items = [
    ["line", [[-190, 0], [200, 0]]],                                                  // ground
    ["ell", -84, -74, 66, 50, rad(-12)], ["ell", -8, -80, 12, 12, 0], ["ell", 42, -76, 44, 20, rad(-8)], ["ell", 100, -100, 34, 29, rad(-10)],
    ["line", [[-170, -60], [150, -112]]],                                             // body axis
    ...LEGS.flatMap((L) => [["line", [L.hip, L.knee]], ["line", [L.knee, L.foot]], ["ell", L.knee[0], L.knee[1], 4, 4, 0]]),
    ["line", [[108, -122], [118, -170], [150, -205]]],                                // antenna
    ["cross", -84, -74], ["cross", 42, -76], ["cross", 100, -100],
  ];
  const n = items.length, k = clamp(p) * n;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s); ctx.strokeStyle = color; ctx.lineWidth = w / s; ctx.lineCap = "round";
  items.forEach((it, i) => { const u = clamp(k - i); if (u <= 0) return; ctx.beginPath();
    if (it[0] === "line") { const P = it[1]; let tot = 0; for (let j = 1; j < P.length; j++) tot += Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]); let lim = tot * u;
      ctx.moveTo(...P[0]); for (let j = 1; j < P.length && lim > 0; j++) { const l = Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]), q = Math.min(1, lim / l); ctx.lineTo(lerp(P[j - 1][0], P[j][0], q), lerp(P[j - 1][1], P[j][1], q)); lim -= l; } }
    else if (it[0] === "ell") { const [, cx, cy, rx, ry, r] = it, n = Math.max(2, Math.round(48 * u)), cr = Math.cos(r), sr = Math.sin(r);
      for (let j = 0; j <= n; j++) { const a = -Math.PI / 2 + j / 48 * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry, px = cx + ex * cr - ey * sr, py = cy + ex * sr + ey * cr; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
    else { ctx.moveTo(it[1] - 7 * u, it[2]); ctx.lineTo(it[1] + 7 * u, it[2]); ctx.moveTo(it[1], it[2] - 7 * u); ctx.lineTo(it[1], it[2] + 7 * u); }
    ctx.stroke(); });
  ctx.restore();
}

return { ant, seed, antGuides }
})()
// ---------------------------------------------------------------- rigs/bean.mjs
Draw.rigs.bean = (() => {
// bean.mjs — the brush-ink + watercolour cast: a bean-bodied person with stick limbs, a head-and-
// shoulders bust, a speech bubble and a waving flag. Drawn with a Pen (lib/pen.mjs), so they draw
// themselves on and boil like everything else in that style.
//   pen.begin("hero", reveal); person(pen, x, groundY, scale, { hat: "peci", shirt: "#F2C230", walk: t * 9 }, t);
// options: skin, shirt, hair, hat (peci|pith|helmet|turban|fez|cap), glasses (sun|round), arms [l, r]
// (degrees from straight down, outward positive), bend [l, r], face (smile|open|flat|sad), walk (phase),
// look (eye shift px), mustache, sash, medals, jacketLine, mask, flip, still, dip.
const { lerp, rad, ellPts, rrect } = Draw.core;
const INK = "#2A2420", RED = "#D0312D", WHITE = "#FBF7EE", GOLD = "#E3B64B", NAVY = "#3C4A6B", SAND = "#D8C7A0";
const SKIN = ["#D9A273", "#C68A5A", "#E9C29C", "#A8704A", "#F0CDB0", "#8E5B3A"];

// bean body, stick limbs, washed head and clothes. Local space: feet at 0, 1 unit = 1 px at s=1.
function person(p, x, y, s, o, t) {
  const ctx = p.ctx;
  let bob = o.still ? 0 : Math.sin(t * 4.2 + x * .013) * 2.2, lg = [0, 0];
  if (o.walk != null) { const ph = o.walk; lg = [Math.sin(ph) * 24, -Math.sin(ph) * 24]; bob = -Math.abs(Math.cos(ph)) * 7; }
  ctx.save(); ctx.translate(x, y + bob * s); ctx.scale(s * (o.flip ? -1 : 1), s);
  const hy = -212 + (o.dip || 0), sk = o.skin || SKIN[0];
  // head
  p.wash(ellPts(0, hy, 31, 30, 18), sk, { alpha: .75 });
  p.ring(0, hy, 32, 31, { w: 4.2 });
  if (o.hair) p.wash([[-31, hy - 4], [-28, hy - 24], [-10, hy - 33], [12, hy - 33], [29, hy - 22], [31, hy - 6], [18, hy - 18], [-6, hy - 20]], o.hair, { alpha: .9 });
  hat(p, o.hat, hy, o);
  // face
  const bl = ((t + x * .0137) % 3.3) < .12;
  const ex = o.look || 0;
  if (o.glasses === "sun") { p.wash(ellPts(-12 + ex, hy - 1, 11, 8, 12), INK, { alpha: .9 }); p.wash(ellPts(12 + ex, hy - 1, 11, 8, 12), INK, { alpha: .9 }); p.stroke([[-2 + ex, hy - 2], [2 + ex, hy - 2]], { w: 3 }); }
  else {
    if (bl) { p.stroke([[-16 + ex, hy - 1], [-8 + ex, hy - 1]], { w: 3 }); p.stroke([[8 + ex, hy - 1], [16 + ex, hy - 1]], { w: 3 }); }
    else if (o.face === "sad") { p.stroke([[-17 + ex, hy + 1], [-12 + ex, hy - 4], [-7 + ex, hy + 1]], { w: 3 }); p.stroke([[7 + ex, hy + 1], [12 + ex, hy - 4], [17 + ex, hy + 1]], { w: 3 }); }
    else { p.dot(-12 + ex, hy - 1, 3.8); p.dot(12 + ex, hy - 1, 3.8); }
    if (o.glasses === "round") { p.ring(-12 + ex, hy - 1, 10, 10, { w: 2.6 }); p.ring(12 + ex, hy - 1, 10, 10, { w: 2.6 }); }
  }
  if (o.mustache) p.stroke([[-16, hy + 10], [-6, hy + 6], [0, hy + 9], [6, hy + 6], [16, hy + 10]], { w: 4.5, taper: .9 });
  const face = o.face || "smile";
  if (o.mask) { p.wash(rrect(-22, hy + 3, 44, 24, 8), "#E7F1F4", { alpha: .95 }); p.poly(rrect(-22, hy + 3, 44, 24, 8), { w: 2.8 }); p.stroke([[-22, hy + 8], [-31, hy]], { w: 2.2 }); p.stroke([[22, hy + 8], [31, hy]], { w: 2.2 }); }
  else if (face === "open") { p.wash(ellPts(0, hy + 14, 7, 8, 10), "#7A2A22", { alpha: .9 }); p.ring(0, hy + 14, 7, 8, { w: 2.6 }); }
  else if (face === "flat") p.stroke([[-8, hy + 15], [8, hy + 15]], { w: 3 });
  else if (face === "sad") p.stroke([[-9, hy + 18], [0, hy + 12], [9, hy + 18]], { w: 3 });
  else p.stroke([[-10, hy + 11], [0, hy + 17], [10, hy + 11]], { w: 3.2 });
  if (!o.mask && face !== "sad") { p.wash(ellPts(-20, hy + 9, 6, 4, 8), "#E58B7B", { alpha: .45 }); p.wash(ellPts(20, hy + 9, 6, 4, 8), "#E58B7B", { alpha: .45 }); }
  // body
  const torso = [[-22, -176], [22, -176], [30, -120], [31, -82], [-31, -82], [-30, -120]];
  p.wash(torso, o.shirt || WHITE, { alpha: .85, round: true });
  if (o.sash) p.wash([[-22, -172], [-10, -176], [30, -96], [22, -86]], o.sash, { alpha: .9 });
  if (o.jacketLine) p.stroke([[0, -176], [0, -84]], { w: 2.4 });
  p.blob(torso, { w: 4 });
  if (o.medals) { p.dot(-12, -150, 4, GOLD); p.dot(-4, -150, 4, RED); }
  // arms
  const [la, ra] = o.arms || [18, 18], [lb, rb] = o.bend || [0, 0];
  arm(p, -22, -166, la, lb, -1, sk); arm(p, 22, -166, ra, rb, 1, sk);
  // legs
  for (const [hx, a, sg] of [[-13, lg[0], -1], [13, lg[1], 1]]) {
    const fx = hx + Math.sin(rad(a)) * 80, fy = -82 + Math.cos(rad(a)) * 80;
    p.stroke([[hx, -84], [fx, fy]], { w: 5.2, taper: .3 });
    p.stroke([[fx - (sg < 0 ? 12 : 0), fy], [fx + (sg > 0 ? 12 : 0), fy]], { w: 6, taper: .2 });
  }
  ctx.restore();
}
function arm(p, sx, sy, a, b, sg, sk) {
  const d = (ang) => [sg * Math.sin(rad(ang)), Math.cos(rad(ang))];
  const [ux, uy] = d(a), ex = sx + ux * 42, ey = sy + uy * 42, [fx, fy] = d(a + b), hx = ex + fx * 40, hy = ey + fy * 40;
  p.stroke([[sx, sy], [ex, ey], [hx, hy]], { w: 4.6, taper: .3, smooth: false });
  p.wash(ellPts(hx, hy, 7, 7, 8), sk, { alpha: .8, wt: .2 }); p.ring(hx, hy, 7, 7, { w: 2.4, wt: .2 });
}
function hat(p, kind, hy, o) {
  if (kind === "peci") { const P = [[-30, hy - 17], [-27, hy - 45], [27, hy - 45], [30, hy - 17], [0, hy - 21]]; p.wash(P, INK, { alpha: .92 }); p.poly([[-30, hy - 17], [-27, hy - 45], [27, hy - 45], [30, hy - 17]], { w: 3.4 }); }
  if (kind === "pith") { const P = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; P.push([Math.cos(a) * 36, hy - 14 + Math.sin(a) * 30]); }
    p.wash([...P, [48, hy - 12], [-48, hy - 12]], SAND, { alpha: .9 }); p.stroke(P, { w: 3.6 }); p.stroke([[-50, hy - 12], [50, hy - 12]], { w: 4 }); }
  if (kind === "helmet") { const P = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; P.push([Math.cos(a) * 37, hy - 6 + Math.sin(a) * 36]); }
    p.wash(P, "#3BAA5C", { alpha: .9 }); p.stroke([...P, P[0]], { w: 3.6 }); p.stroke([[10, hy - 8], [40, hy - 2]], { w: 3 }); }
  if (kind === "turban") { p.wash(ellPts(0, hy - 30, 36, 20, 14), WHITE, { alpha: .9 }); p.ring(0, hy - 30, 36, 20, { w: 3.2 }); p.stroke([[-30, hy - 30], [0, hy - 42], [30, hy - 26]], { w: 2.4 }); }
  if (kind === "fez") { const P = [[-22, hy - 22], [-18, hy - 56], [18, hy - 56], [22, hy - 22]]; p.wash(P, RED, { alpha: .9 }); p.poly(P, { w: 3.2 }); p.stroke([[0, hy - 56], [10, hy - 40]], { w: 2.2 }); }
  if (kind === "cap") { p.wash([[-32, hy - 12], [-26, hy - 34], [0, hy - 42], [26, hy - 34], [32, hy - 12], [56, hy - 10]], o.capColor || NAVY, { alpha: .9 }); p.stroke([[-32, hy - 12], [-26, hy - 34], [0, hy - 42], [26, hy - 34], [32, hy - 12], [56, hy - 10]], { w: 3.2 }); }
}
// head and shoulders only (delegates, masked faces)
function bust(p, x, y, s, o, t) {
  const ctx = p.ctx; ctx.save(); ctx.translate(x, y + Math.sin(t * 3.3 + x) * 1.5); ctx.scale(s, s);
  const sh = [[-50, 0], [-44, -40], [-18, -60], [18, -60], [44, -40], [50, 0]];
  p.wash(sh, o.shirt || WHITE, { alpha: .85 }); p.stroke(sh, { w: 4, taper: .3 });
  const hy = -100, sk = o.skin || SKIN[0];
  p.wash(ellPts(0, hy, 31, 30, 18), sk, { alpha: .75 }); p.ring(0, hy, 32, 31, { w: 4.2 });
  if (o.hair) p.wash([[-31, hy - 4], [-28, hy - 24], [-10, hy - 33], [12, hy - 33], [29, hy - 22], [31, hy - 6], [18, hy - 18], [-6, hy - 20]], o.hair, { alpha: .9 });
  hat(p, o.hat, hy, o);
  const bl = ((t + x * .0137) % 3.1) < .12;
  if (bl) { p.stroke([[-16, hy - 1], [-8, hy - 1]], { w: 3 }); p.stroke([[8, hy - 1], [16, hy - 1]], { w: 3 }); } else { p.dot(-12, hy - 1, 3.8); p.dot(12, hy - 1, 3.8); }
  if (o.glasses === "round") { p.ring(-12, hy - 1, 10, 10, { w: 2.6 }); p.ring(12, hy - 1, 10, 10, { w: 2.6 }); }
  if (o.mask) { p.wash(rrect(-22, hy + 3, 44, 24, 8), "#E7F1F4", { alpha: .95 }); p.poly(rrect(-22, hy + 3, 44, 24, 8), { w: 2.8 }); p.stroke([[-22, hy + 8], [-31, hy]], { w: 2.2 }); p.stroke([[22, hy + 8], [31, hy]], { w: 2.2 }); }
  else p.stroke([[-10, hy + 11], [0, hy + 17], [10, hy + 11]], { w: 3.2 });
  ctx.restore();
}
function bubble(p, x, y, str, o = {}) {
  const ctx = p.ctx; ctx.save(); ctx.font = `${o.size || 40}px "Patrick Hand"`;
  const w = ctx.measureText(str).width + 44, h = (o.size || 40) * 1.5; ctx.restore();
  const tail = o.tail ?? -1, B = rrect(x - w / 2, y - h / 2, w, h, h / 2);
  const tl = [[x + tail * w * .18 - 12, y + h / 2 - 3], [x + tail * w * .32, y + h / 2 + 22], [x + tail * w * .18 + 12, y + h / 2 - 3]];
  p.wash(B, WHITE, { alpha: .95, solid: true, wt: .2 }); p.wash(tl, WHITE, { alpha: .95, solid: true, wt: .1 });
  p.blob(B, { w: 3.6, wt: .6 }); p.stroke(tl, { w: 3.2, smooth: false, wt: .3 });
  p.text(str, x, y + (o.size || 40) * .33, { size: o.size || 40, color: o.color || INK, wt: .8 });
}
function flagCloth(p, x, y, fw, fh, t, amp = 7) {           // waving red-white flag, hoisted at (x, y) top-left
  const n = 12, top = [], mid = [], bot = [];
  for (let i = 0; i <= n; i++) { const u = i / n, dx = u * fw, wv = Math.sin(u * 5.2 - t * 7.5) * amp * u, sq = Math.sin(u * 5.2 - t * 7.5 + .6) * 2 * u;
    top.push([x + dx - sq, y + wv]); mid.push([x + dx - sq, y + fh / 2 + wv]); bot.push([x + dx - sq, y + fh + wv]); }
  p.wash([...top, ...mid.slice().reverse()], RED, { alpha: .95, ox: x, oy: y + fh / 4 });
  p.wash([...mid, ...bot.slice().reverse()], WHITE, { alpha: .95, ox: x, oy: y + fh * .75, solid: true });
  p.stroke(top, { w: 3.2, taper: .3 }); p.stroke(bot, { w: 3.2, taper: .3 }); p.stroke([top[n], bot[n]], { w: 3, taper: .2, smooth: false });
}


return { person, hat, bust, bubble, flagCloth, SKIN }
})()
// ---------------------------------------------------------------- rigs/bug.mjs
Draw.rigs.bug = (() => {
// bug.mjs — a beetle-ish enemy: glossy domed shell with spots, head with glowing eyes and mandibles, six
// legs that scuttle, antennae. Same textured style as the ant (gradient, hatch, specular, rim light).
//
// LOCAL SPACE: facing -x (it walks toward a hero on its left), origin on the ground under the shell,
// feet on y = 0. Shell ≈ 170 × 90 at s = 1.   bug(ctx, x, groundY, s, pose)
// pose: { shell: colour, flip (face +x), gait, rot, squash (0..1 flattened), flash, jaw (0..1), angry,
//         hurt (x eyes), horns (boss), t }
const { clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, hatch, INK } = Draw.core;
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255))); return `rgb(${c.join(",")})`; }

function bug(ctx, x, y, s = 1, p = {}) {
  const col = p.shell || "#6A3FA0", flip = !!p.flip, sq = p.squash || 0, t = p.t || 0, ph = p.gait;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s * (1 - sq * .65));
  if (!p.rot) { ctx.save(); ctx.globalAlpha *= .25; ellipse(ctx, 0, 2, 105, 9); fill(ctx, "#1A1020"); ctx.restore(); }
  if (p.rot) { ctx.translate(0, -60); ctx.rotate(p.rot); ctx.translate(0, 60); }
  // legs (three pairs): hip under the shell, knee out and up beside it, foot splayed on the ground
  const legs = (far) => { for (let i = 0; i < 3; i++) {
    const hx = -40 + i * 40 + (far ? 10 : 0), hy = -36, set = (i % 2) ^ (far ? 1 : 0), sw = ph === undefined ? 0 : Math.sin(ph + set * Math.PI) * 16, lift = ph === undefined ? 0 : Math.max(0, Math.cos(ph + set * Math.PI)) * 9;
    const kx = hx + (i - 1) * 46 - 8 + sw * .5, ky = -30 - lift, fx = hx + (i - 1) * 64 - 16 + sw, fy = -lift;
    line(ctx, [[hx, hy], [kx, ky], [fx, fy]], far ? 6 : 7.6, INK); line(ctx, [[hx, hy], [kx, ky], [fx, fy]], far ? 3 : 4, far ? "#2E2238" : "#4A3858");
    line(ctx, [[fx, fy], [fx - 9, fy + 1]], 3, INK); } };
  legs(true);
  // shell
  const SH = () => { ctx.beginPath(); ctx.moveTo(-88, -34); ctx.bezierCurveTo(-92, -112, 70, -118, 84, -40); ctx.quadraticCurveTo(0, -26, -88, -34); ctx.closePath(); };
  const g = ctx.createRadialGradient(-20, -100, 10, 0, -60, 120); g.addColorStop(0, shade(col, .35)); g.addColorStop(.6, col); g.addColorStop(1, shade(col, -.45)); SH(); fill(ctx, g);
  ctx.save(); SH(); ctx.clip();
  hatch(ctx, () => ellipse(ctx, 10, -40, 100, 30), rad(-40), 6, "#140A1E", 1.2, .35, [-100, -120, 100, -20]);
  line(ctx, [[-2, -104], [-4, -32]], 3, "rgba(20,10,30,.6)");                                   // elytra seam
  for (const [sx, sy, r] of [[-50, -70, 11], [-22, -88, 9], [28, -86, 10], [50, -62, 12], [-6, -58, 8]]) { ellipse(ctx, sx, sy, r, r * .8); fill(ctx, shade(col, -.55)); }
  ctx.beginPath(); ctx.ellipse(0, -70, 84, 40, 0, .3, 2.6); stroke(ctx, 3, "rgba(255,200,255,.25)");
  ctx.restore(); SH(); stroke(ctx, 3.4);
  ellipse(ctx, -34, -96, 22, 7, -.3); fill(ctx, "rgba(255,255,255,.6)");
  legs(false);
  if (p.horns) { for (const [hx2, a] of [[-40, -.5], [30, .4]]) { ctx.beginPath(); ctx.moveTo(hx2 - 8, -104); ctx.quadraticCurveTo(hx2 + a * 30, -150, hx2 + a * 50, -168); ctx.quadraticCurveTo(hx2 + a * 16, -130, hx2 + 8, -106); ctx.closePath(); fill(ctx, "#E8DCC0"); stroke(ctx, 2.8); } }
  // head
  ctx.save(); ctx.translate(-92, -46);
  ellipse(ctx, 0, 0, 30, 25); const hg = ctx.createRadialGradient(-8, -10, 2, 0, 0, 32); hg.addColorStop(0, shade(col, -.1)); hg.addColorStop(1, shade(col, -.6)); fill(ctx, hg); stroke(ctx, 3);
  // mandibles
  const j = p.jaw || 0; for (const sg of [-1, 1]) at(ctx, -24, 8, 1, sg * (.2 + j * .6), () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-26, sg * 4, -30, sg * 16); ctx.lineTo(-20, sg * 8); ctx.lineTo(-14, sg * 12); ctx.quadraticCurveTo(-8, sg * 4, 0, sg * 6); ctx.closePath(); fill(ctx, "#2A1E30"); stroke(ctx, 2); });
  if (j > .3) { ellipse(ctx, -26, 8, 10 * j, 12 * j); fill(ctx, "#5A0E1A"); }
  // eyes
  for (const [ex, ey] of [[-10, -8], [8, -12]]) {
    if (p.hurt) { line(ctx, [[ex - 6, ey - 6], [ex + 6, ey + 6]], 3.4); line(ctx, [[ex + 6, ey - 6], [ex - 6, ey + 6]], 3.4); continue; }
    const gl = ctx.createRadialGradient(ex, ey, 1, ex, ey, 16); gl.addColorStop(0, "rgba(255,80,60,.55)"); gl.addColorStop(1, "rgba(255,80,60,0)"); ctx.fillStyle = gl; ctx.fillRect(ex - 16, ey - 16, 32, 32);
    ellipse(ctx, ex, ey, 7, 8); fill(ctx, "#FF4A36"); stroke(ctx, 2); ellipse(ctx, ex - 2, ey - 3, 2.2, 2.2); fill(ctx, "#fff");
    if (p.angry) line(ctx, [[ex - 10, ey - 14 + (ex < 0 ? -4 : 2)], [ex + 10, ey - 14 + (ex < 0 ? 2 : -4)]], 4); }
  // antennae
  for (const [ax, sw] of [[-4, 0], [10, 1.3]]) { const w = Math.sin(t * 8 + sw) * 8; ctx.beginPath(); ctx.moveTo(ax, -22); ctx.quadraticCurveTo(ax - 10, -60, ax - 34 + w, -70); stroke(ctx, 3); ellipse(ctx, ax - 34 + w, -70, 4.5, 4.5); fill(ctx, INK); }
  ctx.restore();
  if (p.flash > 0) { ctx.save(); ctx.globalAlpha *= p.flash; SH(); fill(ctx, "#FFFFFF"); ellipse(ctx, -92, -46, 30, 25); fill(ctx, "#FFFFFF"); ctx.restore(); }
  ctx.restore();
}

return { bug }
})()
// ---------------------------------------------------------------- rigs/chibi.mjs
Draw.rigs.chibi = (() => {
// chibi.mjs — a big-head cartoon person with real joints (front / three-quarter view), built to be styled
// into a specific character with a preset: hair, glasses, shirt, pocket, pants, shoes, skin.
//
// LOCAL SPACE: origin on the ground between the feet, y up negative. Height ≈ 310 × s px (head ≈ 40 %).
//   chibi(ctx, x, groundY, s, pose, look)          look = a preset object (see HANIF_LOOK in the examples)
// pose: {
//   t          time (blinks, idle breathing)
//   flip       mirror (faces the other way: head turn, pocket side)
//   gait       walk/run phase (radians); omit to stand.  run: true = bigger stride + arm swing
//   air        airborne: knees tuck
//   sq         squash (>1) / stretch (<1) about the feet
//   rot        whole-body tilt about the hips
//   armL/armR  [shoulder, elbow] degrees: 0 = hanging down, 90 = straight out sideways, 180 = straight up;
//              elbow bends the forearm further the same way. Presets via arms: "rest" | "up" | "cheer" |
//              "wave" | "pointR" | "pointL" | "hips" | "shrug" | "carry"
//   holdR/holdL fn(ctx) drawn at that hand (a bag, a map, a coin)
//   eyes       "neutral" | "happy" | "wide" | "closed" | "side" | "star"
//   brows      "neutral" | "raised" | "worried" | "furrowed"
//   mouth      "rest" | "smile" | "open" | "O" | "flat" | "frown" | "A" | "E" | "U" | "M"
//   headTilt   radians; look [dx, dy] pupil offset; blush 0..1; sweat 0..1; flash 0..1
// }
const { clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, smooth, rrect, INK } = Draw.core;
const ARM_PRESETS = {
  rest: [[12, 10], [12, 10]], up: [[150, 15], [150, 15]], cheer: [[128, 34], [128, 34]], wave: [[12, 10], [145, 30]],
  pointR: [[12, 10], [92, -4]], pointL: [[92, -4], [12, 10]], hips: [[40, 110], [40, 110]], shrug: [[55, 80], [55, 80]], carry: [[20, 60], [20, 60]],
};

function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255))); return `rgb(${c.join(",")})`; }
const O = (w = 4) => w;

function limb(ctx, a, b, c, w1, w2, col, outline = 3.6) {    // two segments with round joints, outlined
  line(ctx, [a, b, c], w1 + outline * 2, INK); line(ctx, [a, b], w1, col); line(ctx, [b, c], w2, col);
  ellipse(ctx, b[0], b[1], w1 / 2, w1 / 2); fill(ctx, col);
}
const dirFrom = (deg, side) => [Math.sin(rad(deg)) * side, Math.cos(rad(deg))];

function chibi(ctx, x, y, s = 1, p = {}, L = {}) {
  const t = p.t || 0, skin = L.skin || "#FBDDB0", shirt = L.shirt || "#FBF4E2", pants = L.pants || "#23232A", shoe = L.shoes || "#23232A", hair = L.hair || "#1A1A1E";
  const sq = p.sq ?? 1, breathe = p.gait === undefined && !p.air ? Math.sin(t * 2.4) * .012 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * Math.sqrt(sq) * (p.flip ? -1 : 1), s / Math.sqrt(sq) * (1 + breathe));
  if (!p.air) { ctx.save(); ctx.globalAlpha *= .22; ellipse(ctx, 0, 3, 70, 9); fill(ctx, "#2A1A10"); ctx.restore(); }
  if (p.rot) { ctx.translate(0, -95); ctx.rotate(p.rot); ctx.translate(0, 95); }
  const run = p.gait !== undefined, ph = p.gait || 0, amp = p.run ? 1 : .6;
  // ---------------- legs
  for (const side of [-1, 1]) {
    const hip = [side * 20, -94], swing = run ? Math.sin(ph + (side > 0 ? Math.PI : 0)) : 0, lift = run ? Math.max(0, swing) : 0;
    let foot = [side * 26 + (run ? swing * 10 * amp : 0), -lift * 26 * amp], knee;
    if (p.air) { foot = [side * 30, -34]; knee = [side * 34, -62]; }
    else knee = [lerp(hip[0], foot[0], .5) + side * (4 + lift * 10), lerp(hip[1], foot[1], .5) - lift * 8];
    limb(ctx, hip, knee, [foot[0], foot[1] - 12], 30, 27, pants);
    // sneaker: black upper, white sole and toe, laces
    at(ctx, foot[0] + side * 6, foot[1] - 8, 1, 0, () => { const S = rrect(-26, -12, 52, 22, 10); poly(ctx, S); fill(ctx, shoe); poly(ctx, S); stroke(ctx, 3.4);
      poly(ctx, rrect(-26, 4, 52, 7, 3)); fill(ctx, "#F4F4F2"); stroke(ctx, 2.4); for (const lx of [-6, 3]) line(ctx, [[lx - 5, -6], [lx + 5, -2]], 2.4, "#F4F4F2"); });
    // rolled pant cuff
    poly(ctx, rrect(foot[0] - 17, foot[1] - 24, 34, 9, 3)); fill(ctx, shade(pants, .15)); stroke(ctx, 2.6);
  }
  // ---------------- arms behind the torso edge are drawn after it; compute first
  const preset = ARM_PRESETS[p.arms || "rest"] || ARM_PRESETS.rest;
  let aL = p.armL || preset[0], aR = p.armR || preset[1];
  if (run && !p.armL && !p.armR && (!p.arms || p.arms === "rest")) { const sw = Math.sin(ph) * 32 * amp; aL = [18 + sw, 70]; aR = [18 - sw, 70]; }
  if (p.arms === "wave") aR = [145 + Math.sin(t * 12) * 18, 30];
  // ---------------- torso: shirt with collar, placket, buttons, pocket + pen, rolled hem
  const T = [[-52, -172], [52, -172], [60, -120], [64, -86], [-64, -86], [-60, -120]];
  poly(ctx, [[-30, -94], [30, -94], [34, -80], [-34, -80]]); fill(ctx, pants);                           // belt line under the shirt
  smooth(ctx, T); fill(ctx, shirt); ctx.save(); smooth(ctx, T); ctx.clip(); ellipse(ctx, 50, -110, 34, 70); fill(ctx, shade(shirt, -.08)); ctx.restore(); smooth(ctx, T); stroke(ctx, 3.8);
  line(ctx, [[0, -166], [0, -88]], 2.4); for (const by of [-150, -130, -110]) { ellipse(ctx, 6, by, 2.6, 2.6); stroke(ctx, 2); }
  const pocketX = p.flip ? -34 : 30;
  if (L.pocket) { const Pk = [[pocketX - 16, -150], [pocketX + 16, -150], [pocketX + 16, -126], [pocketX, -118], [pocketX - 16, -126]]; poly(ctx, Pk); fill(ctx, L.pocket); poly(ctx, Pk); stroke(ctx, 2.8);
    if (L.pen) { poly(ctx, rrect(pocketX - 2, -166, 7, 22, 3)); fill(ctx, L.pen); stroke(ctx, 2.2); } }
  // collar
  for (const side of [-1, 1]) { const C = [[0, -168], [side * 26, -176], [side * 30, -160], [side * 8, -154]]; poly(ctx, C); fill(ctx, shirt); poly(ctx, C); stroke(ctx, 3); }
  // ---------------- arms
  const arm = (side, [sh, el], hold) => {
    const S = [side * 50, -164], d1 = dirFrom(sh, side), E = [S[0] + d1[0] * 40, S[1] + d1[1] * 40], d2 = dirFrom(sh + el, side), Hn = [E[0] + d2[0] * 38, E[1] + d2[1] * 38];
    // sleeve (rolled at the elbow), forearm skin, hand
    line(ctx, [S, E], 30 + 7.2, INK); line(ctx, [S, E], 30, shirt); ellipse(ctx, E[0], E[1], 17, 17); fill(ctx, shirt); stroke(ctx, 3);
    line(ctx, [E, Hn], 22 + 7, INK); line(ctx, [E, Hn], 22, skin); ellipse(ctx, E[0], E[1], 14, 14); fill(ctx, shirt);
    ellipse(ctx, Hn[0], Hn[1], 15, 15); fill(ctx, skin); stroke(ctx, 3.2); line(ctx, [[Hn[0] - side * 4, Hn[1] - 6], [Hn[0] + side * 2, Hn[1] + 2]], 1.6, "rgba(140,90,50,.7)");
    if (hold) at(ctx, Hn[0], Hn[1], 1, 0, () => hold(ctx));
  };
  arm(-1, aL, p.flip ? p.holdR : p.holdL); arm(1, aR, p.flip ? p.holdL : p.holdR);
  // ---------------- head
  ctx.save(); ctx.translate(0, -176); ctx.rotate(p.headTilt || 0); ctx.translate(0, -58);
  ellipse(ctx, 0, 12, 12, 12); fill(ctx, skin);                                                          // neck
  for (const side of [-1, 1]) { ellipse(ctx, side * 64, 4, 13, 17); fill(ctx, skin); stroke(ctx, 3.4); ellipse(ctx, side * 64, 4, 5, 8); fill(ctx, shade(skin, -.15)); }
  const F = [[-62, -20], [-58, 20], [-40, 44], [0, 56], [40, 44], [58, 20], [62, -20], [40, -52], [0, -60], [-40, -52]];
  smooth(ctx, F); fill(ctx, skin); ctx.save(); smooth(ctx, F); ctx.clip(); ellipse(ctx, 0, 60, 70, 22); fill(ctx, shade(skin, -.07)); ctx.restore(); smooth(ctx, F); stroke(ctx, 3.8);
  // hair: a messy spiky mass (irregular tufts, swept a little to one side), down to the ears, choppy fringe
  const Hr = [[-66, 6], [-70, -18]]; const spikes = L.spikes || 22;
  for (let i = 0; i <= spikes; i++) { const u = i / spikes, a = Math.PI * (1.08 + u * .84), jit = Math.sin(i * 12.9898) * 43758.5453, j = jit - Math.floor(jit);
    const valley = 80 + 4 * Math.sin(i * 1.7), tip = 93 + 11 * j + (u > .3 && u < .7 ? 5 : 0), sw = .05 + .04 * j;
    Hr.push([Math.cos(a - .04) * valley, -18 + Math.sin(a - .04) * valley * .86]); Hr.push([Math.cos(a + sw) * tip, -18 + Math.sin(a + sw) * tip * .86]); }
  Hr.push([70, -18], [66, 6]);
  const fringe = [[60, -10], [50, 4], [42, -20], [30, -6], [22, -26], [10, -10], [0, -28], [-12, -12], [-22, -30], [-34, -10], [-44, -26], [-54, 0], [-60, -12]];
  poly(ctx, [...Hr, ...fringe]); fill(ctx, hair); poly(ctx, [...Hr, ...fringe]); stroke(ctx, 3.2);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (1.15 + i * .085); line(ctx, [[Math.cos(a) * 40, -20 + Math.sin(a) * 36], [Math.cos(a + .06) * 86, -20 + Math.sin(a + .06) * 80]], 1.8, "rgba(255,255,255,.16)"); }
  // brows, eyes, glasses, mouth
  const ey = 2, lk = p.look || [0, 0], bl = p.eyes === "closed" || (p.eyes !== "wide" && ((t + (L.blinkOffset || 0)) % 3.4) < .12);
  const brow = p.brows || "neutral";
  for (const side of [-1, 1]) { const bx = side * 26, by = -26; const k = brow === "raised" ? -8 : brow === "furrowed" ? 4 : 0, tilt = brow === "worried" ? side * -6 : brow === "furrowed" ? side * 6 : 0;
    ctx.beginPath(); ctx.moveTo(bx - 12, by + k + tilt); ctx.quadraticCurveTo(bx, by + k - 6, bx + 12, by + k - tilt); stroke(ctx, 4.4); }
  for (const side of [-1, 1]) { const ex = side * 26 + lk[0], eyY = ey + lk[1];
    if (bl) { ctx.beginPath(); ctx.moveTo(ex - 8, eyY); ctx.quadraticCurveTo(ex, eyY + 4, ex + 8, eyY); stroke(ctx, 3.6); }
    else if (p.eyes === "happy") { ctx.beginPath(); ctx.moveTo(ex - 9, eyY + 3); ctx.quadraticCurveTo(ex, eyY - 8, ex + 9, eyY + 3); stroke(ctx, 3.8); }
    else if (p.eyes === "star") { ctx.save(); ctx.translate(ex, eyY); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI * 2, r = i % 2 ? 4 : 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fill(ctx, "#F5B81E"); stroke(ctx, 2); ctx.restore(); }
    else { const big = p.eyes === "wide" ? 1.5 : 1; ellipse(ctx, ex + (p.eyes === "side" ? 5 : 0), eyY, 5.2 * big, 7.2 * big); fill(ctx, INK); ellipse(ctx, ex - 1.5, eyY - 3, 1.8, 1.8); fill(ctx, "#fff"); } }
  if (L.glasses !== false) { for (const side of [-1, 1]) { poly(ctx, rrect(side * 26 - 23, ey - 16, 46, 32, 8)); fill(ctx, "rgba(220,235,245,.18)"); poly(ctx, rrect(side * 26 - 23, ey - 16, 46, 32, 8)); stroke(ctx, 6.4); line(ctx, [[side * 49, ey - 8], [side * 62, ey - 10]], 5); }
    line(ctx, [[-3, ey - 6], [3, ey - 6]], 5); line(ctx, [[-36, ey - 10], [-28, ey - 14]], 2, "rgba(255,255,255,.7)"); }
  if (p.blush) { ctx.save(); ctx.globalAlpha *= p.blush; ellipse(ctx, -40, 26, 11, 6); fill(ctx, "#F2A0A0"); ellipse(ctx, 40, 26, 11, 6); fill(ctx, "#F2A0A0"); ctx.restore(); }
  const my = 30, m = p.mouth || "rest";
  if (m === "rest") { ctx.beginPath(); ctx.moveTo(-10, my); ctx.quadraticCurveTo(0, my + 7, 10, my); stroke(ctx, 3.6); }
  else if (m === "flat" || m === "M") line(ctx, [[-9, my + 2], [9, my + 2]], 3.6);
  else if (m === "frown") { ctx.beginPath(); ctx.moveTo(-10, my + 5); ctx.quadraticCurveTo(0, my - 3, 10, my + 5); stroke(ctx, 3.6); }
  else { const shp = { smile: [16, 12, 1], open: [14, 14, 1], A: [11, 13, 0], E: [13, 8, 0], O: [7, 9, 0], U: [6, 7, 0] }[m] || [12, 10, 0];
    ctx.beginPath(); if (shp[2]) { ctx.moveTo(-shp[0], my - 2); ctx.quadraticCurveTo(0, my - 2 + shp[1] * 2, shp[0], my - 2); ctx.closePath(); } else ctx.ellipse(0, my + 3, shp[0], shp[1], 0, 0, Math.PI * 2);
    fill(ctx, "#7A1E26"); ctx.save(); ctx.clip(); ellipse(ctx, 0, my + shp[1] + 2, shp[0] * .8, shp[1] * .6); fill(ctx, "#E86A74"); ctx.restore(); stroke(ctx, 3.4);
    if (shp[2]) { ctx.beginPath(); ctx.moveTo(-shp[0] + 3, my); ctx.lineTo(shp[0] - 3, my); stroke(ctx, 4, "#FFFFFF"); } }
  if (p.sweat) { ctx.save(); ctx.globalAlpha *= p.sweat; ctx.beginPath(); ctx.moveTo(70, -34); ctx.quadraticCurveTo(80, -18, 70, -12); ctx.quadraticCurveTo(60, -18, 70, -34); fill(ctx, "#9CCBEA"); stroke(ctx, 2.4); ctx.restore(); }
  if (p.flash) { ctx.save(); ctx.globalAlpha *= p.flash; smooth(ctx, F); fill(ctx, "#fff"); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}

return { chibi, ARM_PRESETS }
})()
// ---------------------------------------------------------------- rigs/critter.mjs
Draw.rigs.critter = (() => {
// critter.mjs — a blocky little hero built for action: squash & stretch, run, jump, flip, punch, kick,
// get hurt, charge up. Rounded block body with a faint pixel grid, two tall eyes, stub arms, four legs.
//
// LOCAL SPACE: facing +x, origin on the ground under the body centre; feet on y = 0. Body 130 × 100 at s = 1.
//   critter(ctx, x, groundY, s, pose)
// pose: {
//   color       body colour (default a warm orange)
//   flip        face -x
//   gait        run phase (radians); omit to stand
//   sq          squash/stretch: >1 = squashed (wide, short), <1 = stretched (tall, thin); about the feet
//   rot         whole-body spin about the body centre (flips, tumbles)
//   face        "normal" | "blink" | "happy" | "angry" | "hurt" | "surprised" | "focus"
//   punch       0..1 front arm jab (0 rest, 1 fully out); punchBack for the rear arm
//   kick        0..1 front leg kick
//   arms        "rest" | "up" (cheer) | "guard"
//   crouch      0..1 lowers the body (charging, before a jump)
//   aura        0..1 power-up glow + flame tongues
//   flash       0..1 white hit flash
//   air         true while airborne: legs tuck
// }
const { clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, rrect, hatch, INK } = Draw.core;
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255))); return `rgb(${c.join(",")})`; }

function critter(ctx, x, y, s = 1, p = {}) {
  const col = p.color || "#D97757", flip = !!p.flip, sq = p.sq ?? 1, crouch = p.crouch || 0, face = p.face || "normal", t = p.t || 0;
  const BW = 130 * Math.sqrt(sq), BH = 100 / Math.sqrt(sq) * (1 - crouch * .18), LEG = p.air ? 8 : 14 * (1 - crouch * .5), cy = -LEG - BH / 2;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s);
  // aura behind everything
  if (p.aura > 0) { const a = p.aura, g = ctx.createRadialGradient(0, cy, 20, 0, cy, 170 + 40 * a); g.addColorStop(0, `rgba(255,190,110,${.55 * a})`); g.addColorStop(1, "rgba(255,190,110,0)"); ctx.fillStyle = g; ctx.fillRect(-260, cy - 260, 520, 520);
    for (let i = 0; i < 9; i++) { const u = i / 9, fx = -BW / 2 - 10 + u * (BW + 20), h = (60 + 50 * Math.abs(Math.sin(t * 9 + i * 1.7))) * a;
      ctx.beginPath(); ctx.moveTo(fx - 14, -LEG); ctx.quadraticCurveTo(fx - 18, -LEG - h * .6, fx + Math.sin(t * 7 + i) * 8, -LEG - BH - h * .4); ctx.quadraticCurveTo(fx + 18, -LEG - h * .6, fx + 14, -LEG); ctx.closePath();
      ctx.fillStyle = `rgba(255,${150 + (i % 3) * 30},70,${.35 * a})`; ctx.fill(); } }
  // contact shadow
  if (!p.air) { ctx.save(); ctx.globalAlpha *= .25; ellipse(ctx, 0, 2, BW * .62, 8); fill(ctx, "#2A1A10"); ctx.restore(); }
  ctx.save(); if (p.rot) { ctx.translate(0, cy); ctx.rotate(p.rot); ctx.translate(0, -cy); }
  // legs: four stubs, far pair darker; running alternates pairs
  const run = p.gait !== undefined, ph = p.gait || 0;
  const legX = [-44, -16, 16, 44];
  legX.forEach((lx, i) => { const far = i % 2 === 1, pair = (i === 0 || i === 3) ? 0 : 1, sw = run ? Math.sin(ph + pair * Math.PI) : 0;
    const lift = run ? Math.max(0, Math.cos(ph + pair * Math.PI)) * 10 : 0, kx = (p.kick && i === 3) ? p.kick * 60 : 0, ky = (p.kick && i === 3) ? -p.kick * 30 : 0;
    const L = p.air ? LEG + 4 : LEG, x0 = lx * (BW / 130) + sw * 12, y0 = -L - lift * .5;
    if (kx) { poly(ctx, rrect(x0 - 8, -L - 10, 16 + kx, 16, 6)); fill(ctx, shade(col, -.15)); stroke(ctx, 2.6); poly(ctx, rrect(x0 + kx - 4, -L - 16 + ky * .2, 22, 26, 7)); fill(ctx, shade(col, .05)); stroke(ctx, 2.8); return; }
    poly(ctx, rrect(x0 - 8, y0 - 4, 16, L + 4 - lift * .5, 4)); fill(ctx, far ? shade(col, -.35) : shade(col, -.15)); stroke(ctx, 2.6); });
  // rear arm
  const arm = (front, jab) => { const ax = front ? BW / 2 - 6 : -BW / 2 + 6, ay = cy + 8, up = p.arms === "up", guard = p.arms === "guard";
    const ext = jab * 78, ex = ax + (front ? 1 : -1) * (up ? 4 : 10) + (front ? ext : ext * .6 * (front ? 1 : 1)), ey = up ? ay - 48 : guard ? ay - 18 : ay + 6 - jab * 6;
    const fx = front ? ex : (jab > 0 ? ax + ext : ex);
    ctx.save(); poly(ctx, rrect(Math.min(ax, fx) - 2, ey - 10, Math.abs(fx - ax) + 4 + 16, 20, 8)); fill(ctx, shade(col, front ? -.05 : -.3)); stroke(ctx, 2.6);
    if (jab > .3) { poly(ctx, rrect(fx + 4, ey - 15, 30, 30, 9)); fill(ctx, shade(col, .1)); stroke(ctx, 3); line(ctx, [[fx + 12, ey - 6], [fx + 12, ey + 6]], 2, "rgba(30,20,15,.5)"); }
    ctx.restore(); };
  arm(false, p.punchBack || 0);
  // body: gradient + pixel grid + hatch + rim + specular
  const B = rrect(-BW / 2, cy - BH / 2, BW, BH, 20);
  const g = ctx.createLinearGradient(-BW / 2, cy - BH / 2, BW / 2, cy + BH / 2); g.addColorStop(0, shade(col, .28)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, -.28));
  poly(ctx, B); fill(ctx, g);
  ctx.save(); poly(ctx, B); ctx.clip();
  ctx.strokeStyle = "rgba(90,35,15,.12)"; ctx.lineWidth = 1.2; for (let gx = -BW / 2; gx < BW / 2; gx += 13) { ctx.beginPath(); ctx.moveTo(gx, cy - BH / 2); ctx.lineTo(gx, cy + BH / 2); ctx.stroke(); } for (let gy = cy - BH / 2; gy < cy + BH / 2; gy += 13) { ctx.beginPath(); ctx.moveTo(-BW / 2, gy); ctx.lineTo(BW / 2, gy); ctx.stroke(); }
  hatch(ctx, () => { ctx.beginPath(); ctx.rect(-BW / 2, cy + BH * .1, BW, BH); }, rad(-50), 6, "#7A2E14", 1, .3, [-BW / 2, cy, BW / 2, cy + BH / 2]);
  line(ctx, [[-BW / 2 + 14, cy + BH / 2 - 7], [BW / 2 - 14, cy + BH / 2 - 7]], 4, "rgba(255,210,170,.5)");
  ctx.restore();
  poly(ctx, B); stroke(ctx, 3.4);
  poly(ctx, rrect(-BW / 2 + 12, cy - BH / 2 + 9, BW * .32, 10, 5)); fill(ctx, "rgba(255,255,255,.55)");
  // eyes (side view: both on the front half)
  const ex = [BW * .1, BW * .34], eyY = cy - BH * .06;
  const eye = (xx) => {
    if (face === "blink") line(ctx, [[xx - 7, eyY + 4], [xx + 7, eyY + 4]], 4);
    else if (face === "happy") { ctx.beginPath(); ctx.moveTo(xx - 9, eyY + 6); ctx.lineTo(xx, eyY - 6); ctx.lineTo(xx + 9, eyY + 6); stroke(ctx, 4.4); }
    else if (face === "hurt") { line(ctx, [[xx - 8, eyY - 8], [xx + 8, eyY + 8]], 4); line(ctx, [[xx + 8, eyY - 8], [xx - 8, eyY + 8]], 4); }
    else { const tall = face === "surprised" ? 32 : face === "focus" ? 16 : 26, w = face === "surprised" ? 15 : 13;
      poly(ctx, rrect(xx - w / 2, eyY - tall / 2, w, tall, 4)); fill(ctx, "#1A120E"); ellipse(ctx, xx - 2, eyY - tall / 2 + 6, 3, 4); fill(ctx, "#fff");
      if (face === "angry" || face === "focus") line(ctx, [[xx - 12, eyY - tall / 2 - 12 + (xx > BW * .2 ? 6 : 0)], [xx + 12, eyY - tall / 2 - 12 + (xx > BW * .2 ? 0 : 6)]], 5); } };
  ex.forEach(eye);
  if (face === "surprised") { ctx.font = "bold 64px sans-serif"; ctx.fillStyle = INK; ctx.fillText("!", BW * .2, cy - BH / 2 - 26); }
  if (face === "happy" || face === "hurt") { ellipse(ctx, BW * .44, cy + BH * .22, 9, 5); fill(ctx, "rgba(229,72,77,.45)"); }
  // front arm on top
  arm(true, p.punch || 0);
  // hit flash
  if (p.flash > 0) { ctx.save(); ctx.globalAlpha *= p.flash; poly(ctx, B); fill(ctx, "#FFFFFF"); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}

return { critter }
})()
})()
