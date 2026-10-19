// Drawing kit base: core, textures, lowpoly and fx. Classic script for file:// pages.
// Load drawkit-nature.js for nature/colony/ant; drawkit-cast.js for bean/bug/chibi/critter.
// Load pen.js before using the bean cast. See ../ILLUSTRATION.md for the complete load order.
// [buildwithhanif/claude-animation-skill, lib/{core,textures,lowpoly,fx}.mjs]
// MIT licence, see LICENSE-pen.txt. Browser wrappers replace imports/exports and canvas creation.
// Local correction: expired particles consume the same four seeded draws as live particles.
(() => {
const Draw = window.Draw = { rigs: {} }
const createCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
// ---------------------------------------------------------------- core.mjs
Draw.core = (() => {
// core.mjs  -  maths, easing, noise, path helpers and the two textures everything uses (grain, hatch).
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
// pref: which way the joint should point  -  true = up, or a direction vector [dx, dy] (e.g. [-.6, -.8] = back and up)
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
// tapered stroke (thick in the middle, thin at the ends)  -  for limbs, stems, antennae
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

function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255))); return `rgb(${c.join(",")})`; }

return { shade, catmull, densify, pathOf, ik, poly, smooth, ellipse, stroke, fill, line, at, taper, grainCanvas, grainOver, hatch, fibre, burst, speedLines, lerpColor, clamp, lerp, rad, ss, hash, rng, noise1, eOut, eIn, eIO, eExpo, eBack, eElastic, eBounce, popS, mid, centroid, ellPts, rrect, INK, createCanvas, Path2D }
})()
// ---------------------------------------------------------------- textures.mjs
Draw.textures = (() => {
// textures.mjs  -  surfaces. Heavy ones are built ONCE (per scene) into an offscreen canvas and blitted
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
// lowpoly.mjs  -  faceted flat-vector illustration (the "poster landscape" look): every mass is cut into
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
// fx.mjs  -  game-feel effects, all pure functions of time (seeded, no state between frames).
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
    if (fade <= 0) { r(); continue; }
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
})()
