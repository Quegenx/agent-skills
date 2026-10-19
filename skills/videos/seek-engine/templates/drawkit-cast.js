// Drawing kit bean, bug, chibi and critter. Load after drawkit.js; bean drawing also needs pen.js.
// [buildwithhanif/claude-animation-skill, lib/rigs/{bean,bug,chibi,critter}.mjs]
// MIT licence, see LICENSE-pen.txt. Classic browser wrappers; shared helpers stay in Draw.core.
(() => {
const Draw = window.Draw
// ---------------------------------------------------------------- rigs/bean.mjs
Draw.rigs.bean = (() => {
// bean.mjs  -  the brush-ink + watercolour cast: a bean-bodied person with stick limbs, a head-and-
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
// bug.mjs  -  a beetle-ish enemy: glossy domed shell with spots, head with glowing eyes and mandibles, six
// legs that scuttle, antennae. Same textured style as the ant (gradient, hatch, specular, rim light).
//
// LOCAL SPACE: facing -x (it walks toward a hero on its left), origin on the ground under the shell,
// feet on y = 0. Shell ≈ 170 × 90 at s = 1.   bug(ctx, x, groundY, s, pose)
// pose: { shell: colour, flip (face +x), gait, rot, squash (0..1 flattened), flash, jaw (0..1), angry,
//         hurt (x eyes), horns (boss), t }
const { shade, clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, hatch, INK } = Draw.core;

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
// chibi.mjs  -  a big-head cartoon person with real joints (front / three-quarter view), built to be styled
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
const { shade, clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, smooth, rrect, INK } = Draw.core;
const ARM_PRESETS = {
  rest: [[12, 10], [12, 10]], up: [[150, 15], [150, 15]], cheer: [[128, 34], [128, 34]], wave: [[12, 10], [145, 30]],
  pointR: [[12, 10], [92, -4]], pointL: [[92, -4], [12, 10]], hips: [[40, 110], [40, 110]], shrug: [[55, 80], [55, 80]], carry: [[20, 60], [20, 60]],
};

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
// critter.mjs  -  a blocky little hero built for action: squash & stretch, run, jump, flip, punch, kick,
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
const { shade, clamp, lerp, rad, ellipse, stroke, fill, line, at, poly, rrect, hatch, INK } = Draw.core;

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
