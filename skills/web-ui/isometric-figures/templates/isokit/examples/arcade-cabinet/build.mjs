import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript, latheScript } from "../../scripts/inline-kit.mjs";
import { buildArcadeCabinet } from "./cabinet-scene.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";

const W = 600;
const H = 760;
const AZIMUTH = 146;
const ELEVATION = 24;

const PLATE = { x: -98, y: -18, w: 184, d: 236, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;
const XI = 60;
const XW = 64;
const TOPZ = 358;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-XW, 0, TOPZ], [XW, 0, TOPZ], [XW, 126, TOPZ], [-XW, 126, TOPZ], [-XW, 178, 184], [XW, 178, 184]],
  W,
  H,
  { pad: 30, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const Faded = (list, style) => k.fadedSvg(list, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
  return R.put({ name, at: ref, bias, svg, shapes, piece: "cab", ...rest });
}

const signed = (poly) => poly.reduce((a, [x, y], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return a + x * y2 - x2 * y;
}, 0);
const screenOriented = (pts) => (signed(pts) < 0 ? [...pts].reverse() : pts);
function runsOf(flags, want) {
  const count = flags.length;
  const runs = [];
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count]);
  if (start < 0) return flags[0] === want ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : [];
  let run = null;
  for (let step = 0; step < count; step++) {
    const index = (start + step) % count;
    if (flags[index] === want) {
      if (!run) run = [index];
      run.push((index + 1) % count);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}

function prismPaths(F, poly, s0, s1) {
  const ring = signed(poly) > 0 ? poly : [...poly].reverse();
  const n = ring.length;
  const W3 = (s, [x, y]) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
  const capNear = G.dot3(F.a, V) > 0;
  const [nearS, farS] = capNear ? [s1, s0] : [s0, s1];
  const near = ring.map((p) => at(W3(nearS, p)));
  const far = ring.map((p) => at(W3(farS, p)));
  const normals = ring.map(([x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % n];
    return G.unit3(G.add3(G.mul3(F.u, y1 - y0), G.mul3(F.v, -(x1 - x0))));
  });
  const facing = normals.map((m) => G.dot3(m, V) > 1e-9);
  const outline = [];
  const crease = [];
  for (const run of runsOf(facing, false)) outline.push(k.pathOf(run.map((i) => near[i])));
  for (const run of runsOf(facing, true)) {
    crease.push(k.pathOf(run.map((i) => near[i])));
    outline.push(k.pathOf(run.map((i) => far[i])));
  }
  for (let i = 0; i < n; i++) if (facing[(i + n - 1) % n] !== facing[i]) outline.push(k.pathOf([near[i], far[i]]));
  const parts = [k.pathOf(screenOriented(near), true), k.pathOf(screenOriented(far), true)];
  const buckets = [[], [], [], [], []];
  for (let i = 0; i < n; i++) {
    if (!facing[i]) continue;
    const quad = screenOriented([near[i], near[(i + 1) % n], far[(i + 1) % n], far[i]]);
    parts.push(k.pathOf(quad, true));
    buckets[G.toneOf(normals[i], P)].push(k.pathOf(quad, true));
  }
  const capTone = G.toneOf(capNear ? F.a : G.mul3(F.a, -1), P);
  buckets[capTone].push(k.pathOf(screenOriented(near), true));
  return { fill: parts.join(""), outline: outline.join(""), crease: crease.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((b) => b.join("")) };
}

const XF = G.frameOf([0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
function board(name, poly, x0, x1, style = {}, { extra = "", inner = "", bias = 0, holes = [], ref } = {}) {
  const shape = record(A.prism(XF, poly, x0, x1, { name }));
  const cy = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cz = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const dots = holes.length ? Dots(holes.map(([y, z]) => at([x0, y, z])), { size: 0.5, tone: "lo" }) : "";
  put(name, ref ?? [(x0 + x1) / 2, cy, cz], S(prismPaths(XF, poly, x0, x1), { tone: "mid", ...style, inner }) + dots + extra, [shape], { bias });
  return shape;
}
function prism(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, ref } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  put(name, ref ?? centre, S(prismPaths(F, poly, s0, s1), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0 } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, steps, rims, bevel = 0, owner } = {}) {
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), ...(steps ? { steps } : {}), ...(rims ? { rims } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function disc(name, F, s0, s1, r, style = {}, options = {}) {
  if (options.owner === undefined && name.startsWith("crt.")) options = { ...options, owner: "crt" };
  return turned(name, F, [[s0, r], [s1, r]], style, options);
}
function ball(name, c, r, style = {}, { bias = 0, extra = "" } = {}) {
  const shape = record(A.ball(c, r, { name }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 32 }), { tone: "mid", ...style }) + extra, [shape], { bias });
  return shape;
}
function planeMatrix(o, ex, ey) {
  const p0 = at(o);
  const px = at(G.add3(o, ex));
  const py = at(G.add3(o, ey));
  const v = (x) => x.toFixed(4);
  return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
}

const CABLES = [];
function cable(name, points, r = 0.5, { tone = "mid", bend = 3, ends = [true, true], shells = [false, false], rings, maxLength = 16, bias = 0.05, limp = true, touch, bundle } = {}) {
  const route = G.fillet(points, Math.max(bend, r * 2.6), 10, { P, tube: r });
  const total = G.pathLength(route);
  const SHELL = Math.max(1.6, r * 2.4);
  const gaps = [...(shells[0] ? [[0, SHELL]] : []), ...(shells[1] ? [[total - SHELL, total]] : [])];
  R.route(name, route, r, { gaps, limp, touch, bundle, rims: shells.map((on) => (on ? r * 1.9 : r)), piece: "cab" });
  CABLES.push(name);
  tubePieces(route, r, P, { maxLength, spacing: Math.max(0.6, Math.min(1.6, r)), gaps, ...(rings ? { rings } : {}) }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii)], { bias, route: name, chunk: index, attrs: ` data-route="${name}" data-chunk="${index}"` }),
  );
  [0, 1].forEach((index) => {
    const end = index ? route[route.length - 1] : route[0];
    if (shells[index]) {
      const tangent = G.tangentAlong(route, index ? total : 0);
      const F = G.frameAlong(end, tangent);
      const [s0, s1] = index ? [-SHELL, 0] : [0, SHELL];
      const shape = record(A.disc(F, s0, s1, r * 1.9, { name: `${name}.shell${index}`, owner: name }));
      put(`${name}.shell${index}`, G.add3(end, G.mul3(tangent, (s0 + s1) / 2)), S(G.disc(s0, s1, r * 1.9, F, P, { steps: 20, bevel: 0.2 }), { tone: "mid" }), [shape], { bias: bias + 0.1 });
    } else if (ends[index]) {
      put(`${name}.end${index}`, end, Dots([at(end)], { size: Math.max(0.5, r * KS * 0.9), tone: "hi" }), [A.ball(end, Math.max(0.5, r * KS * 0.9) / KS, { name: `${name}.end${index}`, owner: name })], { bias: bias + 0.15 });
    }
  });
  return route;
}

const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const plateScrews = k.corners(PLATE, 10);
back.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(plateScrews.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
const STRIP = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 13, w: PLATE.w - 28, d: 6, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.8, 3.4], P);
back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
const LABEL = { x: 48, y: PLATE.y + PLATE.d - 34, w: 30, d: 13, r: 1.2 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
back.push(Ln([20, 14, 17].map((w, i) => k.lineOnTop([LABEL.x + 4, LABEL.y + 3.4 + i * 3], [LABEL.x + 4 + w, LABEL.y + 3.4 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
back.push(Dots([at([LABEL.x + LABEL.w - 2.6, LABEL.y + 2.4, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d - 2.4, 0.8])], { size: 0.45 }));

const TRAY = { x: -74, y: 188 };
const STACK = 7;
back.push(`<path class="iso-halo" d="${k.haloOf({ x: TRAY.x - 9, y: TRAY.y - 9, w: 18, d: 18, r: 9 }, 0, 2, P)}"/>`);
const COIN_STEP = 0.42;
const stackTop = (n) => 1.6 + n * COIN_STEP;

const { STICK_DATA, PARTS, ENTRIES, FY, SLOT_Z, MECH, CHUTE, WIRE, BOX, METER_FACE, FACE_OFF } = buildArcadeCabinet({ P, V, XI, XW, XF, at, signed, runsOf, record, put, S, Ln, Dots, Faded, path3, f2, prismPaths, board, prism, rect, box, turned, disc, planeMatrix, cable, byDepth });
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

const indexOf = (name) => R.items.findIndex((item) => item.name === name);
const slots = new Map();
slots.set(Math.max(indexOf("chute.floor"), indexOf("chute.far")), `<g data-part="coin-chute"></g><g data-part="wire">${Ln(path3([WIRE.from, G.add3(WIRE.from, [WIRE.length, 0, 0])]), { tone: "hi", free: "end" })}</g>`);
slots.set(Math.max(indexOf("cash.floor"), indexOf("cash.back"), indexOf("cash.far")), `<g data-part="pile"></g><g data-part="coin-fall"></g>`);
const groups = R.items.map((item, index) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>${slots.get(index) ?? ""}`);

const trayF = G.frameOf([TRAY.x, TRAY.y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const tray = S(G.lathe([[0, 0], [0, 9], [1.6, 9], [1.6, 7.6], [0.8, 7.2]], trayF, P, { steps: 48 }), { tone: "lo" });
const stack = Array.from({ length: STACK }, (_, i) => `<g data-stack="${i}">${PARTS.coin([TRAY.x, TRAY.y, stackTop(i) + 0.2], [0, 0, 1], 0, { lit: false })}</g>`).join("");

const LABEL_TEXT =
  "An upright arcade cabinet on a bench with its left side panel off: a CRT turned on its side behind the tilted glass, a marquee lamp and speaker above, a control panel with a joystick and four buttons whose microswitches hang below it, a coin door with two coin mechs, a coin switch, a meter and a cash box, the game board on the far wall, and the power supply on the floor. A stack of quarters sits on a tray on the bench.";
const svg = k.figureSvg({
  width: W,
  height: H,
  label: LABEL_TEXT,
  body: [...back, `<g data-part="tray">${tray}${stack}</g>`, `<g class="ac-cab">${groups.join("")}</g>`, `<g data-part="coin-fly"></g>`, `<g data-part="pulse"></g>`],
});

const DATA = {
  P,
  V,
  stick: STICK_DATA,
  tray: { x: TRAY.x, y: TRAY.y, top: stackTop(STACK - 1) + 0.2, step: COIN_STEP, count: STACK },
  slot: { x: ENTRIES[0], y: FY + 3.8, z: (SLOT_Z[0] + SLOT_Z[1]) / 2 },
  mech: MECH(ENTRIES[0]),
  chute: { ...CHUTE, slope: CHUTE.slope },
  wire: WIRE,
  box: BOX,
  meterFace: METER_FACE,
  screen: { off: FACE_OFF },
  routes: Object.fromEntries(["wire.coin", "cable.video", "cable.power", "loom"].map((name) => [name, R.routes.find((r) => r.name === name).points.map((p) => at(p).map(f2))])),
  meterMatrix: planeMatrix(METER_FACE.o, METER_FACE.ex, METER_FACE.ey),
};

const CSS = readFileSync(join(HERE, "arcade-cabinet.css"), "utf8");
const partsScript = readFileSync(join(HERE, "parts.mjs"), "utf8").replace(/^export /gm, "");
const screenScript = readFileSync(join(HERE, "screen.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const body =
  `<style>${CSS}</style>` +
  k.plateHtml({
    fig: "Fig 4",
    title: "Upright cabinet, side off",
    hint: "C or click the quarters · ← → · space",
    readout: "off · 0 credits",
    keys: [
      { mark: "lit", label: "The picture: drawn in the plane of the CRT behind the tilted glass" },
      { mark: "raised", label: "Coin path: slot, mech, switch wire, meter, cash box" },
      { mark: "edge", label: "Harness from the joystick, buttons and coin switch to the board's edge connector" },
    ],
    caption:
      "An upright cabinet in the style of 1981, 178 cm tall, with the left side panel off. Drop a quarter (24.26 mm) in the left slot: the mech checks it and lets it fall 27 cm past the coin-switch wire into the open cash box. The switch pulses the meter and the board's coin line, and on this machine it also latches the power relay, so the first coin wakes the cabinet: the marquee strikes, the CRT's heater warms for about two seconds, the board runs its RAM and ROM self-test and the attract mode starts. The monitor lies on its side for a vertical game, 224 × 288 pixels on a 15.734 kHz raster, so its scan lines run up and down the glass and it collapses to a vertical line when switched off. Move the stick to see the actuator close a microswitch under the panel.",
    body: `<div class="iso-stage ac-stage" tabindex="0" role="group" aria-label="Arcade cabinet. Press C or click the quarters to insert a coin; left and right arrows move the joystick; space presses the fire button; Escape switches the cabinet off.">${svg}<span class="ac-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const page = k.pageHtml({ title: "Arcade cabinet", theme: THEME, body, script: kitScript() + latheScript() + partsScript + screenScript + LIVE, width: 650 });
const name = THEME === "light" ? "arcade-cabinet-light.html" : "arcade-cabinet.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `scale ${KS.toFixed(3)}`, `${CABLES.length} cables`);

A.auditOrExit(R, P, {});
