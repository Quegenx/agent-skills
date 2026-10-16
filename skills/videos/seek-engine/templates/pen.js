(() => {
// pen.js: the hand. Brush ink, pencil, watercolour and self-writing lettering on a Canvas 2D context, as
// pure functions of time. MIT licence, see LICENSE-pen.txt beside this file; modified for the browser and seek(t).
//
//   <script src="pen.js"></script>   (a classic script: pages render from file://, where ES modules are blocked)
//   const pen = new Pen(ctx)
//   pen.draw('hero/body', reveal, (p) => {          // reveal 0..1 draws the marks on in order
//     p.stroke(points, { w: 5 })                    // tapered brush line, drawn on by a round nib
//     p.wash(points, '#7DB26A')                     // watercolour that blooms outward, multiplied, pooled edge
//     p.pencil(points, { w: 1.6 })                  // three thin broken passes, gaps where pressure is low
//     p.ring(cx, cy, rx, ry); p.box(x, y, w, h)     // hand-drawn ellipse and box, overshooting their ends
//     p.text('Hello', x, y, { size: 44, font: 'Caveat' })   // lettering that writes itself left to right
//   }, { boil: 10, t })                             // boil: redraws per second (0 or omitted = held still)
//
// Every mark is seeded from the drawing's NAME, never from the frame, so a held drawing keeps its marks and
// a re-render is identical. Boil is a decision: hold still drawings still unless the look calls for life.
// Unlike the original, draw() learns how many marks a drawing has in a silent first pass, so a mid-reveal
// frame renders the same whatever was seeked before it (the seek(t) contract).

const INK = '#1E1612'
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a, b, k) => a + (b - a) * k
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1 }
const eOut = (k) => 1 - Math.pow(1 - clamp(k), 3)
const eBack = (k, s = 1.8) => { k = clamp(k) - 1; return 1 + (s + 1) * k * k * k + s * k * k }
const centroid = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]
const idHash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) % 100000 }

// dense points through control points (Catmull-Rom), or straight segments split every `step` px
function catmull(P, closed = false, step = 7) {
  const out = [], n = P.length, g = (i) => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)]
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
    for (let s = 0; s < m; s++) {
      const t = s / m, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)))
    }
  }
  out.push(closed ? [...P[0]] : [...P[n - 1]])
  return out
}
function densify(P, step = 7) {
  const out = []
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1], m = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step))
    for (let s = 0; s < m; s++) out.push([lerp(x0, x1, s / m), lerp(y0, y1, s / m)])
  }
  out.push([...P[P.length - 1]])
  return out
}
// printed-paper grain tile: seeded, built once
function grainCanvas(sz = 256, amt = 60, seed = 3) {
  const c = document.createElement('canvas'); c.width = c.height = sz
  const x = c.getContext('2d'), d = x.createImageData(sz, sz)
  let s = Math.max(1, seed) % 2147483647
  for (let i = 0; i < sz * sz; i++) {
    s = (s * 16807) % 2147483647
    const v = 255 - Math.floor(Math.pow(s / 2147483647, 2.2) * amt)
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255
  }
  x.putImageData(d, 0, 0)
  return c
}

class Pen {
  constructor(ctx) { this.ctx = ctx; this.grain = ctx.createPattern(grainCanvas(256, 70, 11), 'repeat'); this.weights = new Map(); this.begin('', 1) }
  // draw a named drawing at reveal 0..1. opts: { boil (redraws/s), t (seconds, needed with boil), jitter }
  draw(name, reveal, fn, opts = {}) {
    if (!this.weights.has(name)) {                    // silent first pass: count the marks, draw nothing
      this.begin(name, 1, opts); this.counting = true; fn(this); this.counting = false
      this.weights.set(name, Math.max(this.c, 0.5))
    }
    this.begin(name, reveal, opts); fn(this)
  }
  begin(name, reveal = 1, opts = {}) {
    this.name = name; this.seed = idHash(name); this.rv = clamp(reveal); this.c = 0
    this.Wt = this.weights.get(name) || 1; this.boilIx = opts.boil ? Math.floor((opts.t ?? 0) * opts.boil) : 0; this.jitAmp = opts.jitter ?? 1
    return this
  }
  next(wt = 1) {
    const OV = 1.6, c = this.c; this.c += wt
    if (this.counting) return 0
    if (this.rv >= 1) return 1
    return clamp((this.rv * (this.Wt + OV) - c) / (OV * wt))
  }
  J(i, amp) { return (hash(this.seed * 91.7 + this.boilIx * 13.37 + i * 7.13) - 0.5) * 2 * amp * this.jitAmp }

  // tapered, pressure-wobbled brush line
  stroke(pts, o = {}) {
    const r = this.next(o.wt ?? 1); if (r <= 0 || pts.length < 2) return
    const { w = 5, color = INK, taper = 0.75, jit = 1.4, closed = false, alpha = 1, smooth = true, cap = true } = o
    const k0 = this.c * 31 + this.seed
    let P = pts.map(([x, y], i) => [x + this.J(k0 + i * 2, jit), y + this.J(k0 + i * 2 + 1, jit)])
    if (closed) P = [...P, P[0]]
    const D = smooth && P.length > 2 ? catmull(P, false) : densify(P)
    const cum = [0]; for (let i = 1; i < D.length; i++) cum.push(cum[i - 1] + Math.hypot(D[i][0] - D[i - 1][0], D[i][1] - D[i - 1][1]))
    const L = cum[cum.length - 1] || 1, Lr = r * L
    const wAt = (s) => { const u = s / L, e = (u < 0.14 ? u / 0.14 : 1) * (u > 0.84 ? (1 - u) / 0.16 : 1); return w * (1 - taper + taper * e) * (1 + 0.14 * noise1(s * 0.025 + k0)) }
    const Lp = [], Rp = []; let tip = null, tw = w
    for (let i = 0; i < D.length; i++) {
      let [x, y] = D[i], s = cum[i]
      if (s > Lr) { if (i === 0) break; const k = (Lr - cum[i - 1]) / ((s - cum[i - 1]) || 1); x = lerp(D[i - 1][0], x, k); y = lerp(D[i - 1][1], y, k); s = Lr }
      const a = D[Math.max(0, i - 1)], b = D[Math.min(D.length - 1, i + 1)]
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl
      const ww = wAt(s) / 2; Lp.push([x + nx * ww, y + ny * ww]); Rp.push([x - nx * ww, y - ny * ww]); tip = [x, y]; tw = ww
      if (s >= Lr) break
    }
    if (!tip) return
    const ctx = this.ctx; ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color
    ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]); for (const q of Lp) ctx.lineTo(q[0], q[1]); for (let i = Rp.length - 1; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]); ctx.closePath(); ctx.fill()
    if (cap) { ctx.beginPath(); ctx.arc(tip[0], tip[1], Math.max(tw, r < 1 ? w * 0.45 : 0), 0, Math.PI * 2); ctx.fill() }   // the nib
    ctx.restore()
  }
  // graphite: three thin offset passes, broken where "pressure" (noise) is low
  pencil(pts, o = {}) {
    const { w = 1.5, color = '#3A3430', passes = 3, alpha = 0.8 } = o; const r = this.next(o.wt ?? 1); if (r <= 0) return
    const D = catmull(pts, false, 3), n = Math.max(2, Math.floor(D.length * r)), ctx = this.ctx; ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'
    for (let p = 0; p < passes; p++) {
      const off = (p - 1) * w * 0.6; ctx.lineWidth = w * (p === 1 ? 1 : 0.6); ctx.beginPath(); let down = false
      for (let i = 0; i < n; i++) {
        const pres = noise1(i * 0.09 + p * 7.3 + this.seed); if (pres < -0.55) { down = false; continue }
        ctx.globalAlpha = alpha * (0.55 + 0.45 * (pres + 1) / 2)
        const x = D[i][0] + this.J(i * 3 + p, 0.6) + off * 0.3, y = D[i][1] + this.J(i * 3 + p + 1, 0.6) + off
        down ? ctx.lineTo(x, y) : ctx.moveTo(x, y); down = true
      }
      ctx.stroke()
    }
    ctx.restore()
  }
  // a hand-drawn ellipse: starts at a seeded angle, overshoots its own start
  ring(cx, cy, rx, ry, o = {}) {
    const a0 = o.a0 ?? (-2.3 + hash(this.seed + this.c) * 0.8), n = Math.max(12, Math.round((rx + ry) / 7)), over = o.over ?? 1.07, pts = []
    for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI * 2 * over, q = 1 + 0.025 * Math.sin(a * 3 + this.seed); pts.push([cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q]) }
    this.stroke(pts, { taper: 0.5, ...o })
  }
  // a box drawn edge by edge, each edge overshooting the corner a little
  box(x, y, w, h, o = {}) {
    const ov = o.over ?? 8, C = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
    for (let i = 0; i < 4; i++) {
      const a = C[i], b = C[(i + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
      this.stroke([[a[0] - dx / l * ov * hash(this.seed + i), a[1] - dy / l * ov * hash(this.seed + i)], [b[0] + dx / l * ov * hash(this.seed + i + 9), b[1] + dy / l * ov * hash(this.seed + i + 9)]], { smooth: false, taper: 0.5, ...o, wt: (o.wt ?? 1) / 4 })
    }
  }
  // watercolour: blooms outward from (ox, oy), three offset translucent passes multiplied, pooled edge, grain.
  // { over: true } paints opaque on dark shapes (multiply goes muddy there); short polygons stay sharp.
  wash(pts, color, o = {}) {
    const r = this.next(o.wt ?? 0.8); if (r <= 0) return
    const { alpha = 0.8, ox, oy, solid = false, over = false } = o
    const sharp = o.sharp ?? (pts.length <= 6 && !o.round), ctx = this.ctx
    const p = new Path2D(); const D = sharp ? pts : catmull(pts, true); D.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath()
    ctx.save()
    if (r < 1) {
      const [cx, cy] = ox != null ? [ox, oy] : centroid(pts); let R = 0; for (const q of pts) R = Math.max(R, Math.hypot(q[0] - cx, q[1] - cy)); R *= 1.12 * eOut(r)
      const b = new Path2D()
      for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, rr = R * (1 + 0.16 * noise1(a * 2.2 + this.seed + this.c)); i ? b.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : b.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) }
      b.closePath(); ctx.clip(b)
    }
    ctx.globalCompositeOperation = over ? 'source-over' : 'multiply'; ctx.fillStyle = color
    if (solid) { ctx.globalAlpha *= alpha; ctx.fill(p) }
    else {
      const a0 = ctx.globalAlpha, base = this.seed * 7 + this.c * 13
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate((hash(base + k * 3) - 0.5) * 7, (hash(base + k * 5 + 1) - 0.5) * 7); ctx.globalAlpha = a0 * alpha * 0.45; ctx.fill(p); ctx.restore() }
      ctx.globalAlpha = a0 * alpha * 0.35; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(p)
      ctx.globalAlpha = a0 * 0.55; ctx.save(); ctx.clip(p); ctx.fillStyle = this.grain; ctx.fillRect(-4000, -4000, 8000, 8000); ctx.restore()
    }
    ctx.restore()
  }
  // lettering that writes itself left to right
  text(str, x, y, o = {}) {
    const r = this.next(o.wt ?? 2); if (r <= 0) return
    const { size = 44, font = 'sans-serif', color = INK, align = 'center', rot = 0, alpha = 1 } = o, ctx = this.ctx; ctx.save(); ctx.font = `${size}px "${font}"`
    const w = ctx.measureText(str).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
    ctx.translate(x0 + this.J(this.c * 3, 0.9), y + this.J(this.c * 3 + 1, 0.9)); ctx.rotate(rot + this.J(this.c * 3 + 2, 0.006))
    if (r < 1) { ctx.beginPath(); ctx.rect(-10, -size * 1.3, (w + 20) * r, size * 2); ctx.clip() }
    ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.fillText(str, 0, 0); ctx.restore()
  }
  dot(x, y, rr, color = INK, wt = 0.3) { const r = this.next(wt); if (r <= 0) return; const c = this.ctx; c.fillStyle = color; c.beginPath(); c.arc(x + this.J(this.c, 0.6), y + this.J(this.c + 1, 0.6), rr * eBack(r), 0, Math.PI * 2); c.fill() }
  poly(pts, o) { this.stroke(pts, { closed: true, smooth: false, taper: 0.35, ...o }) }
  blob(pts, o) { this.stroke(pts, { closed: true, taper: 0.4, ...o }) }
}

window.Pen = Pen
window.PenKit = { INK, catmull, grainCanvas }
})()
