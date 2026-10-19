import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg, crossingsOf } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { glCamera } from "../../kit/gl.mjs";
import { glScript } from "../../scripts/inline-kit.mjs";
import { buildRaptorSubject } from "./raptor-subject.mjs";
import { buildRaptorBase, buildRaptorFrame } from "./raptor-stand.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const DEG = Math.PI / 180;

const W = 932;
const H = 900;
const AZIMUTH = 38;
const ELEVATION = 27;
const Z_EXIT = 172;
const TOP = 310;
const BEAM_Z = Z_EXIT + TOP + 23;
const BEAM_H = 28;
const DECK = { x: -150, y: -150, w: 300, d: 300, r: 10 };
const DECK_H = 15;
const FOOT_H = 8;
const COLUMN = 24;
const COLUMN_AT = [
  [-124, 124],
  [124, -124],
];
const CONE_TIP = 32;
const CHAMBER_BAR = 300;
const SEA_LEVEL_TF = 230;
const EXIT_M = 1.3;
const BACK_TF = (101325 * Math.PI * (EXIT_M / 2) ** 2) / 9806.65;

const P = k.fitProjection(
  [
    ...k.boxCorners(DECK, -DECK_H - FOOT_H, 0),
    [COLUMN_AT[0][0] - COLUMN, COLUMN_AT[0][1] + COLUMN, BEAM_Z + BEAM_H],
    [COLUMN_AT[1][0] + COLUMN, COLUMN_AT[1][1] - COLUMN, BEAM_Z + BEAM_H],
    [-190 / Math.SQRT2, 190 / Math.SQRT2, BEAM_Z + BEAM_H],
    [190 / Math.SQRT2, -190 / Math.SQRT2, BEAM_Z + BEAM_H],
  ],
  W,
  H,
  { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const FADE = [0.04, 0.42];
const Faded = (list, style) => k.fadedSvg(list, style);

const polar = (deg, r, s, centre = [0, 0]) => [centre[0] + r * Math.cos(deg * DEG), centre[1] + r * Math.sin(deg * DEG), Z_EXIT + s];
const dir = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG), 0];
const ENGINE = G.frameOf([0, 0, Z_EXIT], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const FTP_DEG = -20;
const FTP_AT = [72 * Math.cos(FTP_DEG * DEG), 72 * Math.sin(FTP_DEG * DEG)];
const FTP = G.frameOf([FTP_AT[0], FTP_AT[1], Z_EXIT], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const ftp = (deg, r, s) => G.pointOf(FTP, s, r, deg * DEG);
const DECKF = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const out = (deg, r, z) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG), z];
const LUGS = [
  [135, 185],
  [-45, -45],
];

const PIECES = {
  gimbal: { name: "Gimbal and thrust puck", say: "gimbal · carries 230 tf into the stand", move: [0, 0, 0] },
  otp: { name: "Oxygen turbopump", say: "oxygen turbopump · spun by oxygen-rich gas", move: [0, 0, -26] },
  orpb: { name: "Oxygen-rich preburner", say: "oxygen-rich preburner · all the oxygen", move: [0, 0, -52] },
  lox: { name: "Oxygen duct and main valve", say: "oxygen duct · pump to preburner", move: out(166, 52, -12) },
  chamber: { name: "Injector and main chamber", say: "main chamber · 300 bar · no igniter", move: [0, 0, -80] },
  nozzle: { name: "Nozzle", say: "nozzle · 1.3 m exit · methane cooled", move: [0, 0, -120] },
  ftp: { name: "Methane turbopump and fuel-rich preburner", say: "methane turbopump · spun by fuel-rich gas", move: out(FTP_DEG, 70, -46) },
  hotgas: { name: "Hot-gas manifold", say: "hot-gas manifold · fuel-rich gas to the injector", move: out(FTP_DEG, 36, -62) },
  downcomer: { name: "Downcomer and main fuel valve", say: "downcomer · methane to the cooling jacket", move: out(40, 66, -84) },
  plumbing: { name: "Plumbing", say: "plumbing", move: [0, 0, 0] },
  controller: { name: "Engine controller and harness", say: "engine controller", move: out(70, 70, -28) },
  stand: { name: "Stand", say: "", move: [0, 0, 0] },
};

const STAGGER = ["nozzle", "downcomer", "controller", "plumbing", "lox", "ftp", "hotgas", "chamber", "orpb", "otp", "gimbal", "stand"];
const SPRING = { stagger: 0.035, stiffness: 64, damping: 14.2, substeps: 4 };
const R = A.recorder(P, { order: STAGGER, spring: SPRING });
const { items, nameFor } = R;
const record = R.solid;
const rideOf = (piece, move) => (move ? Object.keys(PIECES).find((id) => PIECES[id].move === move) ?? piece : piece);
function put(piece, ref, svg, { bias = 0, move, ride, shapes = [], name, route, chunk } = {}) {
  R.put({ piece, ride: ride ?? rideOf(piece, move), at: ref, bias, svg, move: move ?? PIECES[piece].move, shapes, name: name ?? nameFor(`${piece}.item`), route, chunk });
}
function tubeItems(piece, route, r, { name, tone = "hi", bias = 0, move, maxLength, spacing, closed = false, owner, touch, bundle, limp = false, breaks = [], gaps = [], caps = true, ends = [true, true], rims, free = [false, false] } = {}) {
  const id = nameFor(name ?? `${piece}.tube`);
  R.route(id, route, r, { owner: owner ?? id, touch, bundle, limp, gaps, closed, ends, rims, free, piece, move: move ?? PIECES[piece].move, ride: rideOf(piece, move) });
  tubePieces(route, r, P, { maxLength, spacing, closed, breaks, gaps, caps }).forEach((part, index) =>
    put(piece, part.mid, tubeSvg(part, { tone }), { bias, move, name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] }),
  );
  return id;
}

const ex = (F, s) => [F.o[0], F.o[1], F.o[2] + s];

function turned(piece, F, profile, style = {}, { extra = "", inner = "", bias = 0, move, rims, bevel = 0, steps, name, owner, smooth = profile.some((point) => point[2]) } = {}) {
  const paths = G.solidOf(profile, F, P, { bevel, smooth: smooth === true ? { rows: Math.max(...profile.map(([, r]) => r)) < 20 ? 3 : 5 } : smooth, ...(rims ? { rims } : {}), ...(steps ? { steps } : {}) });
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const id = nameFor(name ?? `${piece}.turned${Math.round(profile[0][0])}`);
  const shape = record(A.solid(F, profile, { name: id, owner, curve: smooth && !smooth.slope ? profile : undefined }));
  put(piece, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "hi", ...style, inner: inner ? Ln(inner, { tone: "faint" }) : "" }) + extra, { bias, move, name: id, shapes: [shape] });
  return shape;
}

function band(piece, F, s0, s1, r, style = {}, options = {}) {
  return turned(piece, F, [
    [s0, r],
    [s1, r],
  ], style, options);
}

function flangeAt(piece, centre, axis, r, thick, { bolts = 8, tone = "hi", move, bias = 0, boltR, name, owner } = {}) {
  const F = G.frameAlong(centre, axis);
  const id = nameFor(name ?? `${piece}.flange`);
  const paths = G.disc(-thick / 2, thick / 2, r, F, P);
  const faces = [];
  const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
  if (Math.abs(G.dot3(F.a, V)) > 0.12 && bolts) faces.push(Dots(G.dotsOf(F, towards, boltR ?? r * 0.74, bolts, P, { all: true }), { size: 0.42, tone: "mid" }));
  put(piece, centre, S(paths, { tone }) + faces.join(""), { bias, move, name: id, shapes: [record(A.disc(F, -thick / 2, thick / 2, r, { name: id, owner }))] });
}

function pipe(piece, control, r, { bend = 2.6, tone = "hi", flanges = [true, true], flangeR = 1.55, coupling = false, bands = [], bellows = null, valve = null, move, bias = 0, maxLength = 26, spacing, name, touch, breaks = [], gaps: extra = [], free } = {}) {
  const flangeRs = [flangeR].flat().length > 1 ? [flangeR].flat() : [flangeR, flangeR].flat();
  if (coupling) flanges = [flanges[0], false];
  const line = G.fillet(control, Math.max(r * bend, 3), r > 3 ? 24 : 12, { P, tube: r });
  const total = G.pathLength(line);
  const collars = [];
  [[0, -1], [total, 1]].forEach(([along, sign], index) => {
    if (!flanges[index]) return;
    const thick = Math.max(0.9, r * 0.55);
    const tangent = G.tangentAlong(line, along);
    collars.push({ kind: "flange", centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * flangeRs[index], thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
  });
  if (coupling) {
    const thick = Math.max(1.6, r * 1.4);
    collars.push({ kind: "coupling", centre: G.pointAlong(line, total - thick / 2), tangent: G.tangentAlong(line, total), radius: r * 1.5, thick, gap: [total - thick, total] });
  }
  const ring = (along, radius, thick, kind) => collars.push({ kind, centre: G.pointAlong(line, along), tangent: G.tangentAlong(line, along), radius, thick, gap: [along - thick / 2, along + thick / 2] });
  for (const share of bands) ring(total * share, r * 1.18, Math.max(0.8, r * 0.7), "band");
  if (bellows) {
    const [from, to, count] = bellows;
    for (let index = 0; index < count; index++) ring(total * (from + ((to - from) * index) / (count - 1)), r * 1.26, Math.max(0.6, r * 0.3), "bellows");
  }
  const gaps = [...collars.map(({ gap }) => gap), ...extra];
  if (valve) {
    const along = valve[0] > 1 ? valve[0] : total * valve[0];
    gaps.push([along - valve[1] * 2.4, along + valve[1] * 2.4]);
  }
  const owner = tubeItems(piece, line, r, { name: name ?? `${piece}.pipe`, tone, bias, move, maxLength, spacing: spacing ?? Math.max(0.8, Math.min(2.4, r * 0.18)), touch, gaps, breaks, free, rims: flanges.map((flanged, index) => (flanged ? r * flangeRs[index] : index && coupling ? r * 1.5 : r)) });
  for (const { kind, centre, tangent, radius, thick } of collars)
    flangeAt(piece, centre, tangent, radius, thick, { bolts: kind === "flange" && r > 3 ? 8 : 0, tone: kind === "flange" || kind === "coupling" ? tone : "mid", move, bias, name: `${owner}.${kind}`, owner });
  line.owner = owner;
  return line;
}

function boxAt(piece, plan, z, h, style = {}, { extra = "", bias = 0, move, bevel = 0.5, steps = 3, name, owner } = {}) {
  const centre = [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];
  const id = nameFor(name ?? `${piece}.box`);
  put(piece, centre, S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "hi", ...style }) + extra, { bias, move, name: id, shapes: [record(A.box([plan.x, plan.y, z], [plan.x + plan.w, plan.y + plan.d, z + h], { name: id, owner }))] });
}

function valveOn(piece, line, share, r, { move, tone = "hi", name, side = [0, 0, 1] } = {}) {
  const total = G.pathLength(line);
  const along = share > 1 ? share : total * share;
  const centre = G.pointAlong(line, along);
  const tangent = G.tangentAlong(line, along);
  const F = G.frameAlong(centre, tangent);
  const body = r * 1.85;
  const id = nameFor(name ?? `${line.owner}.valve`);
  const owner = line.owner;
  const crown = body * 1.08;
  const bulge = (x) => r * 1.45 + (crown - r * 1.45) * Math.sqrt(Math.max(0, 1 - (x / (r * 1.6)) ** 2));
  const bulgeSlope = (x) => {
    if (Math.abs(x) >= r * 1.6 - 1e-9) return 0;
    const t = Math.max(-0.995, Math.min(0.995, x / (r * 1.6)));
    return (-(crown - r * 1.45) * t) / (r * 1.6 * Math.sqrt(1 - t * t));
  };
  const meridian = [
    [-r * 2.4, 0],
    [-r * 2.4, r * 1.45],
    ...Array.from({ length: 17 }, (_, index) => {
      const x = r * 1.6 * Math.sin(((index - 8) / 8) * (Math.PI / 2));
      return [x, bulge(x), index && index < 16 ? 1 : 0];
    }),
    [r * 2.4, r * 1.45],
    [r * 2.4, 0],
  ];
  put(
    piece,
    centre,
    S(G.lathe(meridian, F, P, { steps: 36, smooth: { slope: bulgeSlope, rows: 3 } }), { tone }) + Dots([...G.dotsOf(F, -r * 2.4, r * 1.2, 8, P, { all: true }), ...G.dotsOf(F, r * 2.4, r * 1.2, 8, P, { all: true })].filter((_, index) => index % 2 === 0), { size: 0.4, tone: "mid" }),
    { move, name: id, shapes: [record(A.body(F, meridian, { name: id, owner }))] },
  );
  const up = G.unit3(side);
  const NF = G.frameAlong(centre, up);
  const s0 = body * 1.08 - 0.25;
  const s1 = body * 1.08 + body * 0.45;
  put(piece, G.add3(centre, G.mul3(up, (s0 + s1) / 2)), S(G.disc(s0, s1, r * 0.5, NF, P), { tone }), { move, bias: 0.2, name: `${id}.neck`, shapes: [record(A.disc(NF, s0, s1, r * 0.5, { name: `${id}.neck`, owner }))] });
  if (up[2] > 0.99) {
    const top = G.add3(centre, [0, 0, s1]);
    const plan = { x: top[0] - r * 1.5, y: top[1] - r * 1.5, w: r * 3, d: r * 3, r: 0.8 };
    const lid = top[2] + r * 2.2;
    boxAt(piece, plan, top[2], r * 2.2, { tone }, {
      move,
      bias: 0.3,
      name: `${id}.actuator`,
      owner,
      extra: Ln(k.planOutline(k.insetPlan(plan, 0.8), lid, P, 2), { tone: "faint" }) + Dots([at([plan.x + 1.2, plan.y + 1.2, lid]), at([plan.x + plan.w - 1.2, plan.y + plan.d - 1.2, lid])], { size: 0.4 }),
    });
    const port = [top[0], top[1], lid];
    return { port, approach: G.add3(port, [0, 0, 5]), lid };
  }
  const can = [[s1, 0], [s1, r * 1.5], [s1 + r * 2.2, r * 1.5], [s1 + r * 2.2, 0]];
  const end = s1 + r * 2.2;
  put(piece, G.add3(centre, G.mul3(up, (s1 + end) / 2)), S(G.lathe(can, NF, P, { steps: 32, bevel: 0.6 }), { tone }) + Ln(G.circleOf(NF, end, r * 1.1, P, 24), { tone: "faint" }) + Dots(G.dotsOf(NF, end, r * 1.25, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.4 }), { move, bias: 0.3, name: `${id}.actuator`, shapes: [record(A.body(NF, can, { name: `${id}.actuator`, owner }))] });
  const port = G.add3(centre, G.mul3(up, end));
  return { port, approach: G.add3(port, G.mul3(up, 5)) };
}

function ballAt(piece, centre, r, { move, tone = "mid", bias = 0, name, owner } = {}) {
  const F = G.frameAlong(centre, [0, 0, 1]);
  const id = nameFor(name ?? `${piece}.ball`);
  put(piece, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32) }), { tone }), { move, bias, name: id, shapes: [record(A.ball(centre, r, { name: id, owner }))] });
}

function elbow(piece, face, normal, faceR, toward, ball, rim, { name, owner } = {}) {
  const centre = G.add3(face, G.mul3(normal, Math.sqrt(ball ** 2 - faceR ** 2)));
  ballAt(piece, centre, ball, { tone: "hi", name, owner });
  const axis = G.unit3(G.sub3(toward, centre));
  return G.add3(centre, G.mul3(axis, Math.sqrt(ball ** 2 - rim ** 2)));
}

const sideOn = (d) => G.unit3(G.cross3(G.unit3(G.sub3(V, G.mul3(d, G.dot3(V, d)))), d));

function boss(piece, centre, outward, r, length, { move, tone = "hi", bias = 0.1, name, host, ring = true, owner } = {}) {
  if (host) return padOn(piece, host, centre, outward, r, length, { move, tone, bias, name: name ?? `${piece}.boss`, ring, owner });
  const F = G.frameAlong(centre, outward);
  const id = nameFor(name ?? `${piece}.boss`);
  put(piece, G.add3(centre, G.mul3(F.a, length / 2)), S(G.disc(0, length, r, F, P), { tone }) + (ring && G.dot3(F.a, V) > 0.15 ? Ln(G.circleOf(F, length, r * 0.55, P, 16), { tone: "faint" }) : ""), { bias, move, name: id, shapes: [record(A.disc(F, 0, length, r, { name: id, owner }))] });
  return G.add3(centre, G.mul3(F.a, length));
}

function padOn(piece, host, point, outward, a, h, { move, name, tone = "hi", bias = 0.1, owner, ring = false } = {}) {
  const hosts = [host].flat();
  const inside = (p) => hosts.some((shape) => A.sdf(shape, p) < 0);
  const axis = G.unit3(outward);
  const F = G.frameAlong(point, axis);
  const start = (angle) => {
    let lo = -2.5 * a;
    let hi = h;
    if (!inside(G.pointOf(F, lo, a, angle))) return 0;
    for (let step = 0; step < 40; step++) {
      const mid = (lo + hi) / 2;
      if (inside(G.pointOf(F, mid, a, angle))) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const low = Math.min(...Array.from({ length: 48 }, (_, index) => start((index / 48) * Math.PI * 2)));
  const id = nameFor(name ?? `${piece}.pad`);
  const face = ring && G.dot3(axis, V) > 0.15 ? Ln(G.circleOf(F, h, a * 0.55, P, 16), { tone: "faint" }) : "";
  put(piece, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone }) + face, { bias, move, name: id, shapes: [record(A.disc(F, low - 0.05, h, a, { name: id, owner, seated: true, cut: hosts }))] });
  return G.add3(point, G.mul3(axis, h));
}

const CABLES = [];
function cable(piece, points, { move, bias = 0.2, r = 0.62, bend = 6, name, bundle, touch, clamps = [], shells = [false, false], free } = {}) {
  const route = G.fillet(points, bend, 12, { P, tube: r });
  CABLES.push({ piece, route });
  const total = G.pathLength(route);
  const SHELL = 2.2;
  const gaps = [...clamps.flatMap(({ centre, axis, radius }) => crossingsOf(route, centre, axis, radius).map((at) => [at - CLAMP_HALF - 0.05, at + CLAMP_HALF + 0.05])), ...(shells[0] ? [[0, SHELL]] : []), ...(shells[1] ? [[total - SHELL, total]] : [])];
  const id = tubeItems(piece, route, r, { name: name ?? `${piece}.cable`, tone: "mid", bias, move, maxLength: 14, spacing: 1, bundle, touch, gaps, free, limp: true, rims: shells.map((on) => (on ? r * 2 : r)) });
  [0, 1].forEach((index) => {
    const end = index ? route[route.length - 1] : route[0];
    if (!shells[index]) {
      put(piece, end, Dots([at(end)], { size: 0.5, tone: "hi" }), { bias: bias + 0.15, move, name: `${id}.end`, shapes: [A.ball(end, 0.5 / KS)] });
      return;
    }
    const tangent = G.tangentAlong(route, index ? total : 0);
    const F = G.frameAlong(end, tangent);
    const [s0, s1] = index ? [-SHELL, 0] : [0, SHELL];
    const outer = index ? s0 : s1;
    put(piece, G.add3(end, G.mul3(tangent, (s0 + s1) / 2)), S(G.disc(s0, s1, r * 2, F, P, { bevel: 0.25 }), { tone: "mid" }) + (G.dot3(G.mul3(F.a, index ? -1 : 1), V) > 0.2 ? Ln(G.circleOf(F, outer, r * 1.1, P, 12), { tone: "faint" }) : ""), { bias: bias + 0.1, move, name: `${id}.shell`, shapes: [record(A.disc(F, s0, s1, r * 2, { name: `${id}.shell`, owner: id }))] });
  });
  return route;
}

const CLAMP_HALF = 0.9;
function clampAt(piece, centre, axis, r, { move, bias = 0.3, name = `${piece}.clamp`, bundle } = {}) {
  const F = G.frameAlong(centre, axis);
  const id = nameFor(name);
  put(piece, centre, S(G.disc(-CLAMP_HALF, CLAMP_HALF, r, F, P), { tone: "mid" }), { bias, move, name: id, shapes: [record(A.disc(F, -CLAMP_HALF, CLAMP_HALF, r, { name: id, anchor: false, bundle, fitting: true }))] });
}


const { back } = buildRaptorBase({ P, KS, BEAM_Z, DECK, DECK_H, FOOT_H, COLUMN, COLUMN_AT, CONE_TIP, DEG, DECKF, record, at, S, Ln, Dots });

const { LIP, senses, LINES, LUG_BALL, lugBall } = buildRaptorSubject({ P, KS, Z_EXIT, TOP, BEAM_Z, AZIMUTH, DEG, ENGINE, FTP, ftp, FTP_DEG, PIECES, LUGS, R, nameFor, record, at, S, Ln, Dots, FADE, Faded, polar, dir, out, ex, put, tubeItems, turned, band, flangeAt, pipe, boxAt, valveOn, ballAt, elbow, sideOn, boss, cable, clampAt });

buildRaptorFrame({ P, Z_EXIT, TOP, BEAM_Z, BEAM_H, AZIMUTH, DEG, FTP, FTP_AT, DECKF, LUGS, nameFor, record, at, S, Ln, Dots, FADE, Faded, polar, dir, ex, put, tubeItems, pipe, boxAt, ballAt, LUG_BALL, lugBall });


PIECES.plumbing.say = `plumbing · ${senses.length} sense lines into a block · ${LINES.length - senses.length} feed, purge and igniter lines`;
PIECES.controller.say = `engine controller · ${CABLES.filter((entry) => entry.piece === "controller").length} cables`;

const CROWD_OK = [["plumbing.lox-to-frpb", "controller.cable-block"], ["plumbing.lox-to-frpb", "controller.harness-frpb"]];
A.settle(R, P);
items.sort((a, b) => a.key - b.key);
const groups = items.map((item, index) => {
  const [mx, my, mz] = item.move;
  return `<g class="it" data-piece="${item.piece}"${item.ride !== item.piece ? ` data-ride="${item.ride}"` : ""} data-k="${item.key.toFixed(2)}" data-m="${mx.toFixed(1)},${my.toFixed(1)},${mz.toFixed(1)}" data-i="${index}">${item.svg}</g>`;
});

const LABEL_TEXT =
  "SpaceX Raptor 2 hanging from a vertical test stand: a deck on feet with a flame cone and deluge ring, two columns, and a crosshead with a load cell and two gimbal actuators. Below the gimbal sit the oxygen turbopump, the oxygen-rich preburner, the injector and main chamber, and the bell nozzle with its cooling manifold; the methane turbopump and fuel-rich preburner hang on the right, joined by the hot-gas manifold, a downcomer, ducts, sense lines and the engine controller's harness.";

const backSvg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: back, className: "rp-back" });
const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg rp-front" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g class="rp-engine">${groups.join("")}</g></svg>`;

const unit = (vector) => {
  const o = at([0, 0, 0]);
  const p = at(vector);
  return [p[0] - o[0], p[1] - o[1]];
};
const DATA = {
  W,
  H,
  V,
  EX: unit([1, 0, 0]),
  EY: unit([0, 1, 0]),
  EZ: unit([0, 0, 1]),
  camera: glCamera(P),
  exit: at([0, 0, Z_EXIT]),
  zExit: Z_EXIT,
  exitR: 64.6,
  coneTip: CONE_TIP,
  plumeLength: Z_EXIT - CONE_TIP,
  chamberBar: CHAMBER_BAR,
  vacuumTf: SEA_LEVEL_TF + BACK_TF,
  backTf: BACK_TF,
  columns: COLUMN_AT,
  columnHalf: COLUMN / 2 + 0.4,
  columnTop: BEAM_Z + BEAM_H,
  pieces: Object.fromEntries(Object.entries(PIECES).map(([id, piece]) => [id, { name: piece.name, say: piece.say }])),
  stagger: STAGGER,
  spring: SPRING,
  order: ["gimbal", "otp", "orpb", "lox", "controller", "chamber", "hotgas", "ftp", "downcomer", "plumbing", "nozzle"],
};

const PARTS = DATA.order.map((id, index) => `<button type="button" class="rp-part" data-part="${id}"><span class="rp-num">${String(index + 1).padStart(2, "0")}</span>${PIECES[id].name}</button>`).join("");
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">Raptor 2 · test stand</span><span class="iso-plate-corner" data-corner="readout" data-readout>1,630 kg · cold</span></div>`;
const controls = `<div class="rp-controls"><button type="button" class="rp-fire" data-fire><span class="rp-lamp" aria-hidden="true"></span><span data-fire-label>Ignite</span></button><span class="rp-hint">Hover the engine to take it apart</span><span class="rp-live" aria-live="polite" data-live></span></div>`;
const glowSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg rp-glow" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g class="rp-glow-g"><path class="rp-rim rp-rim-soft" d="${LIP}"/><path class="rp-rim" d="${LIP}"/></g></svg>`;
const stage = `<div class="rp-stage" tabindex="0" role="slider" aria-label="Raptor 2 on a test stand. Hover or use the arrow keys to take the engine apart part by part; press I or the Ignite button to fire it, Escape to put it back together." aria-valuemin="0" aria-valuemax="${DATA.order.length}" aria-valuenow="0" aria-valuetext="Assembled, cold">${backSvg}<canvas class="rp-plume" aria-hidden="true"></canvas>${frontSvg}${glowSvg}<canvas class="rp-veil" aria-hidden="true"></canvas><div class="rp-flash" aria-hidden="true"></div></div>`;
const caption =
  "Raptor 2 is SpaceX's full-flow staged-combustion engine: liquid oxygen and methane at a mixture ratio of 3.6, 300 bar in the main chamber, 230 tf at sea level, 1,630 kg dry. Every drop of oxygen passes through an oxygen-rich preburner that spins the oxygen pump, and every drop of methane through a fuel-rich preburner that spins the methane pump; the two hot gases meet in the main chamber, which has no igniter of its own. The load cell above the gimbal reads the thrust while it burns.";
const body = `<figure class="iso-figure rp"><div class="iso-plate">${corners}${stage}${controls}</div><figcaption class="iso-legend"><span class="rp-parts">${PARTS}</span><span class="iso-caption">${caption}</span></figcaption></figure>`;

const CSS = readFileSync(join(HERE, "raptor.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const page = k.pageHtml({ title: "Raptor 2", theme: THEME, body: `<style>${CSS}</style>${body}`, script: glScript() + LIVE, width: 980 });
const name = THEME === "light" ? "raptor-engine-light.html" : "raptor-engine.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${items.length} items`);

A.auditOrExit(R, P, { crowd: CROWD_OK });
