import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";

export function buildRaptorBase({ P, KS, BEAM_Z, DECK, DECK_H, FOOT_H, COLUMN, COLUMN_AT, CONE_TIP, DEG, DECKF, record, at, S, Ln, Dots }) {
  const back = [];
  back.push(`<path class="iso-halo" d="${k.haloOf(DECK, -DECK_H - FOOT_H, DECK_H, P)}"/>`);
  const FEET = [
    [-132, -132],
    [132, -132],
    [-132, 132],
    [132, 132],
    [0, -132],
    [0, 132],
    [-132, 0],
    [132, 0],
  ].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of FEET) {
    back.push(S(k.cylinder(x, y, 10, -DECK_H - FOOT_H, 2, P, 28), { tone: "lo" }));
    back.push(S(k.cylinder(x, y, 7.5, -DECK_H - FOOT_H + 2, FOOT_H - 2, P, 28), { tone: "mid" }));
  }
  back.push(S(k.slabOf(DECK, -DECK_H, DECK_H, P, 8, 1.6), { tone: "mid" }));
  const FRAME = { owner: "stand.frame" };
  record(A.box([DECK.x, DECK.y, -DECK_H], [DECK.x + DECK.w, DECK.y + DECK.d, 0], { name: "stand.deck", ...FRAME }));
  back.push(Ln(k.planOutline(k.insetPlan(DECK, 7), 0, P), { tone: "lo" }));
  const DECK_SCREWS = k.corners(DECK, 15);
  back.push(Ln(DECK_SCREWS.map(([x, y]) => k.ring(x, y, 3, 0, P, 18)).join(""), { tone: "lo" }));
  back.push(Dots(DECK_SCREWS.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  back.push(Ln(k.sideTicks(DECK.x + 20, DECK.x + DECK.w - 20, 10, 5, DECK.x + DECK.w, 0, [2.4, 4.6], P, "y").minor, { tone: "lo" }));
  back.push(Ln(k.sideTicks(DECK.x + 20, DECK.x + DECK.w - 20, 10, 5, DECK.x + DECK.w, 0, [2.4, 4.6], P, "y").major, { tone: "mid" }));

  const GRATE = { x: -98, y: -98, w: 196, d: 196, r: 6 };
  back.push(Ln(k.planOutline(GRATE, 0, P), { tone: "lo" }));
  for (let x = GRATE.x + 14; x < GRATE.x + GRATE.w - 4; x += 14) back.push(Ln(k.lineOnTop([x, GRATE.y], [x, GRATE.y + GRATE.d], 0, P), { tone: "faint" }));

  const STRIP = { x: -128, y: DECK.y + DECK.d - 15, w: 196, d: 8, r: 1 };
  back.push(S(k.slabOf(STRIP, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 1, 0.8, [2.2, 4.4], P);
  back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
  back.push(Dots([at([STRIP.x + 2.2, STRIP.y + 4, 0.8]), at([STRIP.x + STRIP.w - 2.2, STRIP.y + 4, 0.8])], { size: 0.45 }));

  const LABEL = { x: DECK.x + DECK.w - 21, y: -94, w: 12, d: 60, r: 1.5 };
  back.push(S(k.slabOf(LABEL, 0, 1, P, 3), { tone: "mid" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.8), 1, P), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 7.4, LABEL.y + LABEL.d - 5], 1, P, "y"), "RAPTOR 2", { size: 4.2, tone: "lo" }));
  back.push(Ln([0, 1].map((row) => k.onTop([[LABEL.x + 3 + row * 2.2, LABEL.y + 5], [LABEL.x + 3 + row * 2.2, LABEL.y + (row ? 16 : 21)]], 1, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 2.6, 1]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 2.6, 1])], { size: 0.45 }));

  const deckTop = k.slabOf(k.insetPlan(DECK, 1), 0, 0.01, P, 8).fill;
  const deckCentre = at([0, 0, 0]);
  back.push(`<defs><radialGradient id="rp-deck" gradientUnits="userSpaceOnUse" cx="${deckCentre[0].toFixed(1)}" cy="${deckCentre[1].toFixed(1)}" r="${(150 * KS).toFixed(1)}" gradientTransform="translate(${deckCentre[0].toFixed(1)} ${deckCentre[1].toFixed(1)}) scale(1 ${k.cameraOf(P).sinE.toFixed(3)}) translate(${(-deckCentre[0]).toFixed(1)} ${(-deckCentre[1]).toFixed(1)})"><stop offset="0" class="rp-stop-0"/><stop offset=".28" class="rp-stop-1"/><stop offset=".7" class="rp-stop-2"/><stop offset="1" class="rp-stop-3"/></radialGradient></defs><path class="rp-deckglow" fill="url(#rp-deck)" d="${deckTop}"/>`);
  back.push(`<path class="iso-halo rp-shadow" d="${k.haloOf({ x: -56, y: -56, w: 112, d: 112, r: 56 }, 0, 0.1, P)}"/>`);
  back.push(S(G.disc(0, 4, 56, DECKF, P, { bevel: 1.2 }), { tone: "mid" }));
  record(A.disc(DECKF, 0, 4, 56, { name: "stand.cone-plate", ...FRAME }));
  back.push(Dots(G.dotsOf(DECKF, 4, 52, 28, P, { all: true }), { size: 0.45, tone: "mid" }));
  const CONE_Q = 0.8;
  const coneShare = (s) => Math.max(1e-4, 1 - (s - 4) / (CONE_TIP - 4));
  const cone = (s) => 48 * coneShare(s) ** CONE_Q;
  const coneSlope = (s) => ((-48 * CONE_Q) / (CONE_TIP - 4)) * coneShare(s) ** (CONE_Q - 1);
  const CONE = Array.from({ length: 33 }, (_, index) => {
    const s = 4 + (CONE_TIP - 4) * (1 - (1 - index / 32) ** 2);
    return index === 32 ? [CONE_TIP, 0] : [s, cone(s), index ? 1 : 0];
  });
  back.push(S(G.solidOf(CONE, DECKF, P, { smooth: { slope: coneSlope, rows: 5 } }), { tone: "hi", inner: Ln([13, 22].map((s) => G.arcOf(DECKF, s, cone(s), P, { slope: coneSlope(s) })).join(""), { tone: "faint" }) }));
  record(A.solid(DECKF, CONE, { name: "stand.cone", ...FRAME }));

  const DELUGE = G.arcPoints(DECKF, 6.4, 68, 0, Math.PI * 2, 72);
  for (const part of tubePieces(DELUGE, 2.1, P, { maxLength: 400, spacing: 2, closed: true })) back.push(tubeSvg(part, { tone: "mid" }));
  back.push(Dots(G.dotsOf(DECKF, 8.6, 68, 36, P, { all: true }), { size: 0.5, tone: "hi" }));
  record(A.tube(DELUGE, 2.1, { name: "stand.deluge", ...FRAME }));
  const TEE_DEG = -12;
  const TEE_R = 2.9;
  const TEE_F = G.frameAlong(G.pointOf(DECKF, 6.4, 68, TEE_DEG * DEG), G.tangentOf(DECKF, TEE_DEG * DEG));
  back.push(S(G.disc(-2.4, 2.4, TEE_R, TEE_F, P, { bevel: 0.3 }), { tone: "mid" }));
  record(A.disc(TEE_F, -2.4, 2.4, TEE_R, { name: "stand.deluge-tee", ...FRAME }));
  const FEED = G.fillet([G.pointOf(DECKF, 6.4, 68 + TEE_R - 0.2, TEE_DEG * DEG), [100, -14, 6.4], [139, -14, 6.4], [139, -14, 1.5]], 6);
  for (const part of tubePieces(FEED, 2.1, P, { maxLength: 400, caps: [false, true] })) back.push(tubeSvg(part, { tone: "mid" }));
  record(A.tube(FEED, 2.1, { name: "stand.deluge-feed", ...FRAME }));
  back.push(S(k.slabOf({ x: 132, y: -22, w: 13, d: 16, r: 2 }, 0, 4, P, 3, 0.6), { tone: "mid" }));
  back.push(Dots([at([135, -19, 4]), at([142, -9, 4])], { size: 0.45 }));

  for (const [cx, cy] of COLUMN_AT) {
    const base = { x: cx - 23, y: cy - 23, w: 46, d: 46, r: 3 };
    back.push(S(k.slabOf(base, 0, 5, P, 3, 0.8), { tone: "mid" }));
    record(A.box([base.x, base.y, 0], [base.x + base.w, base.y + base.d, 5], { name: "stand.column-base", ...FRAME }));
    back.push(Dots(k.corners(base, 6).map(([x, y]) => at([x, y, 5])), { size: 0.55 }));
    back.push(Ln(k.corners(base, 6).map(([x, y]) => k.ring(x, y, 2.4, 5, P, 14)).join(""), { tone: "lo" }));
    const column = { x: cx - COLUMN / 2, y: cy - COLUMN / 2, w: COLUMN, d: COLUMN, r: 1.5 };
    back.push(S(k.slabOf(column, 5, BEAM_Z - 5, P, 3, 0.8), { tone: "mid" }));
    record(A.box([column.x, column.y, 5], [column.x + column.w, column.y + column.d, BEAM_Z], { name: "stand.column", ...FRAME }));
    const edge = [cx + COLUMN / 2 - 1.5 + 1.5 * Math.SQRT1_2, cy + COLUMN / 2 - 1.5 + 1.5 * Math.SQRT1_2];
    back.push(Ln(k.segment([...edge, 5], [...edge, BEAM_Z], P), { tone: "faint" }));
    for (const z of [124, 248, 372]) {
      const splice = k.insetPlan(column, -2.2);
      back.push(S(k.slabOf(splice, z, 13, P, 3, 0.5), { tone: "mid" }));
      record(A.box([splice.x, splice.y, z], [splice.x + splice.w, splice.y + splice.d, z + 13], { name: "stand.splice", ...FRAME }));
      back.push(Dots([at([splice.x + splice.w, cy - 6, z + 4]), at([splice.x + splice.w, cy + 6, z + 4]), at([splice.x + splice.w, cy - 6, z + 9]), at([splice.x + splice.w, cy + 6, z + 9]), at([cx - 6, splice.y + splice.d, z + 4]), at([cx + 6, splice.y + splice.d, z + 4]), at([cx - 6, splice.y + splice.d, z + 9]), at([cx + 6, splice.y + splice.d, z + 9])], { size: 0.42 }));
    }
  }
  const TRAY_X = COLUMN_AT[1][0] - COLUMN / 2 - 6;
  back.push(S(k.slabOf({ x: TRAY_X, y: COLUMN_AT[1][1] + 2, w: 6, d: 9, r: 0.6 }, 28, BEAM_Z - 36, P, 2), { tone: "mid" }));
  for (let z = 52; z < BEAM_Z - 20; z += 40) back.push(S(k.slabOf({ x: TRAY_X - 0.8, y: COLUMN_AT[1][1] + 1, w: 7.6, d: 11, r: 0.6 }, z, 3, P, 2), { tone: "mid" }));
  const LADDER_Y = COLUMN_AT[0][1] + COLUMN / 2;
  for (const x of [COLUMN_AT[0][0] - 9, COLUMN_AT[0][0] + 9]) back.push(S(k.slabOf({ x: x - 1.3, y: LADDER_Y + 8, w: 2.6, d: 2.6, r: 0.6 }, 18, BEAM_Z - 52, P, 2), { tone: "mid", crease: "none" }));
  for (let z = 40; z < BEAM_Z - 38; z += 28) back.push(Ln(k.segment([COLUMN_AT[0][0] - 9, LADDER_Y + 10.6, z], [COLUMN_AT[0][0] + 9, LADDER_Y + 10.6, z], P), { tone: "mid" }));
  for (const z of [52, BEAM_Z - 56]) for (const x of [COLUMN_AT[0][0] - 9, COLUMN_AT[0][0] + 9]) back.push(S(k.slabOf({ x: x - 1, y: LADDER_Y, w: 2, d: 9, r: 0.4 }, z, 2, P, 2), { tone: "mid", crease: "none" }));
  return { back };
}

export function buildRaptorFrame({ P, Z_EXIT, TOP, BEAM_Z, BEAM_H, AZIMUTH, DEG, FTP, FTP_AT, DECKF, LUGS, nameFor, record, at, S, Ln, Dots, FADE, Faded, polar, dir, ex, put, tubeItems, pipe, boxAt, ballAt, LUG_BALL, lugBall }) {


  const FEED_TOP = BEAM_Z - 6;
  pipe("stand", [ex(FTP, 265), ex(FTP, 290), [FTP_AT[0], FTP_AT[1], FEED_TOP]], 7.2, { bend: 2, bellows: [0.12, 0.32, 7], bands: [0.62], maxLength: 14, name: "stand.feed", free: [true, false] });
  const BRACKET = { x: FTP_AT[0] - 13, y: FTP_AT[1] - 13, w: 26, d: 26, r: 2 };
  boxAt("stand", BRACKET, FEED_TOP, 6, {}, { bias: 2, name: "stand.feed-bracket", extra: Dots(k.corners(BRACKET, 3).map(([x, y]) => at([x, y, FEED_TOP + 6])), { size: 0.45 }) });
  for (const [deg, reach] of [[135, 50], [-45, 46]]) {
    const quick = polar(deg, reach, TOP + 21);
    boxAt("stand", { x: quick[0] - 4, y: quick[1] - 4, w: 8, d: 8, r: 1 }, quick[2], BEAM_Z - quick[2], {}, { bias: 1, name: "stand.quick-disconnect" });
  }

  const CLEVIS_BALL = 4.6;
  for (const [deg, foot] of LUGS) {
    const lug = lugBall(foot);
    const top = [Math.cos(deg * DEG) * 92, Math.sin(deg * DEG) * 92, BEAM_Z];
    const id = nameFor("stand.actuator");
    boxAt("stand", { x: top[0] - 5, y: top[1] - 5, w: 10, d: 10, r: 1 }, BEAM_Z - 3, 3, {}, { name: `${id}.mount`, bevel: 0.4 });
    const pivot = G.add3(top, [0, 0, -3 - CLEVIS_BALL]);
    ballAt("stand", pivot, CLEVIS_BALL, { tone: "hi", name: `${id}.pivot`, owner: id });
    const axis = G.unit3(G.sub3(lug, pivot));
    const span = G.len3(G.sub3(lug, pivot));
    const F = G.frameAlong(pivot, axis);
    const clevisFrom = Math.sqrt(CLEVIS_BALL ** 2 - 3 ** 2);
    put("stand", G.add3(pivot, G.mul3(axis, 5)), S(G.disc(clevisFrom, 9, 3, F, P), { tone: "mid" }), { name: `${id}.clevis`, shapes: [record(A.disc(F, clevisFrom, 9, 3, { name: `${id}.clevis`, owner: id }))] });
    const side = G.unit3(G.cross3(axis, [0, 0, 1]));
    const SF = { o: pivot, a: axis, u: side, v: G.cross3(axis, side) };
    const head = [[9, 0], [9, 6.2], [11, 6.6], [13, 6.6], [13, 0]];
    const barrel = [[15, 0], [15, 6.6], [35, 6.6], [37, 6.2], [39, 4], [39, 0]];
    put("stand", G.add3(pivot, G.mul3(axis, 11)), S(G.lathe(head, F, P, { steps: 40 }), { tone: "hi" }), { name: `${id}.head`, shapes: [record(A.body(F, head, { name: `${id}.head`, owner: id }))] });
    put("stand", G.add3(pivot, G.mul3(axis, 14)), S(G.prismOf(SF, G.stadium(7.4, 5, 10.9), 13, 15, P), { tone: "mid" }) + Dots([G.pointOf(SF, 15, 0, 0), G.add3(G.pointOf(SF, 15, 0, 0), G.mul3(side, 10.9))].map((p) => at(p)), { size: 0.42 }), { name: `${id}.gearbox`, shapes: [record(A.disc(F, 13, 15, 7.4, { name: `${id}.gearbox`, owner: id })), record(A.disc(G.frameAlong(G.add3(pivot, G.mul3(side, 10.9)), axis), 13, 15, 5, { name: `${id}.gearbox`, owner: id })), record(A.orientedBox(G.add3(G.add3(pivot, G.mul3(axis, 14)), G.mul3(side, 5.45)), [side, SF.v, axis], [5.45, 5, 1], { name: `${id}.gearbox`, owner: id }))] });
    put("stand", G.add3(pivot, G.mul3(axis, 25)), S(G.lathe(barrel, F, P, { steps: 40 }), { tone: "hi", inner: Ln([21, 27, 32].map((s) => G.arcOf(F, s, 6.6, P)).join(""), { tone: "faint" }) }), { name: `${id}.barrel`, shapes: [record(A.body(F, barrel, { name: `${id}.barrel`, owner: id }))] });
    const MF = G.frameAlong(G.add3(pivot, G.mul3(side, 10.9)), axis);
    put("stand", G.pointOf(MF, 22, 0, 0), S(G.disc(15, 29, 4.2, MF, P), { tone: "mid" }) + Faded(G.ribsOf(MF, 15, 29, 4.2, 14, P, { fade: [0.1, 0.55] }), { tone: "lo" }), { bias: -0.5, name: `${id}.motor`, shapes: [record(A.disc(MF, 15, 29, 4.2, { name: `${id}.motor`, owner: id }))] });
    const rodEnd = span - Math.sqrt(LUG_BALL ** 2 - 2.1 ** 2);
    put("stand", G.add3(pivot, G.mul3(axis, (39 + rodEnd) / 2)), S(G.disc(39, rodEnd, 2.1, F, P), { tone: "hi" }), { name: `${id}.rod`, shapes: [record(A.disc(F, 39, rodEnd, 2.1, { name: `${id}.rod`, owner: id }))] });
    ballAt("stand", lug, LUG_BALL, { name: `${id}.eye`, owner: id });
  }

  const BEAM_HALF = 14;
  const along = G.unit3([1, -1, 0]);
  const across = G.unit3([1, 1, 0]);
  const beamEnd = 196;
  const beamRing = [
    G.add3(G.mul3(along, -beamEnd), G.mul3(across, -BEAM_HALF)),
    G.add3(G.mul3(along, beamEnd), G.mul3(across, -BEAM_HALF)),
    G.add3(G.mul3(along, beamEnd), G.mul3(across, BEAM_HALF)),
    G.add3(G.mul3(along, -beamEnd), G.mul3(across, BEAM_HALF)),
  ].map(([x, y]) => [x, y]);
  const beamTop = BEAM_Z + BEAM_H;
  const beamLine = (offset, z) => k.onTop([G.add3(G.mul3(along, -beamEnd), G.mul3(across, offset)), G.add3(G.mul3(along, beamEnd), G.mul3(across, offset))].map(([x, y]) => [x, y]), z, P);
  const beamBolts = [];
  for (let t = -176; t <= 176; t += 32) for (const side of [-1, 1]) beamBolts.push(at([...G.add3(G.mul3(along, t), G.mul3(across, side * 8.5)).slice(0, 2), beamTop]));
  const beamFace = [];
  for (let t = -168; t <= 168; t += 56) {
    const p = G.add3(G.mul3(along, t), G.mul3(across, BEAM_HALF));
    beamFace.push(k.segment([p[0], p[1], BEAM_Z], [p[0], p[1], beamTop], P));
  }
  put("stand", [0, 0, BEAM_Z - 13], S(k.cylinder(0, 0, 12.6, Z_EXIT + TOP, BEAM_Z - 8 - Z_EXIT - TOP, P, 40), { tone: "mid" }) + Ln(k.knurl(0, 0, 12.6, Z_EXIT + TOP + 4, Z_EXIT + TOP + 10, 40, P), { tone: "lo" }) + Ln(k.sideArc(0, 0, 12.6, Z_EXIT + TOP + 11.5, P, 24), { tone: "faint" }), { bias: 50, name: "stand.loadcell", shapes: [record(A.disc(DECKF, Z_EXIT + TOP, BEAM_Z - 8, 12.6, { name: "stand.loadcell" }))] });
  put("stand", [0, 0, BEAM_Z - 4], S(k.cylinder(0, 0, 34, BEAM_Z - 8, 8, P, 72, 0.8), { tone: "mid" }) + Dots(G.dotsOf(DECKF, BEAM_Z, 29.5, 16, P, { fade: FADE }), { size: 0.4 }), { bias: 60, name: "stand.crosshead", shapes: [record(A.disc(DECKF, BEAM_Z - 8, BEAM_Z, 34, { name: "stand.crosshead" }))] });
  const GLAND_DEG = AZIMUTH - 90;
  const gland = [Math.cos(GLAND_DEG * DEG) * 12.6, Math.sin(GLAND_DEG * DEG) * 12.6, Z_EXIT + TOP + 7];
  put("stand", gland, S(G.disc(0, 4, 2, G.frameAlong(gland, dir(GLAND_DEG)), P), { tone: "mid" }), { bias: 61, name: "stand.gland", shapes: [record(A.disc(G.frameAlong(gland, dir(GLAND_DEG)), 0, 4, 2, { name: "stand.gland" }))] });
  tubeItems("stand", G.fillet([G.add3(gland, G.mul3(dir(GLAND_DEG), 4)), G.add3(gland, G.mul3(dir(GLAND_DEG), 11)), [...G.add3(gland, G.mul3(dir(GLAND_DEG), 11)).slice(0, 2), BEAM_Z - 8]], 4), 0.62, { name: "stand.loadcell-cable", tone: "mid", bias: 61, maxLength: 60, spacing: 1 });
  put("stand", [0, 0, BEAM_Z + BEAM_H / 2], S(k.extrude(beamRing, BEAM_Z, BEAM_H, P, { bevel: 0.9 }), { tone: "mid" }) + Ln(beamLine(-BEAM_HALF + 5, beamTop) + beamLine(BEAM_HALF - 5, beamTop), { tone: "lo" }) + Ln(beamFace.join(""), { tone: "faint" }) + Dots(beamBolts, { size: 0.45 }), { bias: 200, name: "stand.beam", shapes: [record(A.orientedBox([0, 0, BEAM_Z + BEAM_H / 2], [along, across, [0, 0, 1]], [beamEnd, BEAM_HALF, BEAM_H / 2], { name: "stand.beam" }))] });
}
