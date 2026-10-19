// smoke.mjs: the computational sensor. Runs the film headless across its whole length and counts defects.
// Every counter must read 0 before anyone looks at a frame. Run from the film folder.
//
//   node scripts/smoke.mjs [--gpu] [--format 16:9] [--rate 10] [--safe 0.05] [--dead 1.5] [--page index.html] [--data record.json]
//   --data: a data-driven film (render.mjs --data) is smoked once per record; the longest names and numbers first.
//
//   runtime errors        page errors and console errors while seeking
//   text out of stage     readable text (DOM text, opacity >= 0.5) crossing the frame edge
//   text in margin        readable text inside the safe margin (--safe, fraction of each side)
//   text overlaps         two readable text boxes covering each other (the classic swap bug). Text drawn into an
//                         object (inside [data-drawn], such as a dial's engraved numerals painted in depth order) is
//                         hidden by the parts in front of it, not stacked, so it is left out of this check only
//   nondeterministic      the same t paints different pixels depending on what was seeked before
//   dead stretches        longer than --dead seconds with nothing visibly changing
//   loop seam             (loops only) last frame -> first frame jumps more than the motion around it
//   broken text           visible text showing NaN, undefined, [object ...] or Infinity: a data bug printed on screen
//   text clipped          readable text cut off by a container (overflow hidden) for 0.3 s or more
//   short reads           a line readable for less than readTime(text) = max(0.5 s, 0.3 s per word,
//                         0.25 s + characters / 17): the word rate, plus the source reading formula (17 characters a
//                         second after 0.25 s to find the line) so long words and numbers get their time
//   stalls                motion stops dead for one frame between two moves (stop-hold-go, a repeated rest pose)
//   slow hook             (not loops) nothing visibly moves until after 1.0 s: a muted feed scrolls past
//   single-frame pops     a frame-to-frame change over 3x its neighbours (a snap or flash), scanned at the film's
//                         fps; designed hard cuts declared in timeline().cuts are exempt. --no-pops skips the scan
//   low contrast          readable text (fully opaque, on screen 0.3 s or more) under the film contrast heuristic against what is
//                         drawn behind it: below 3:1, or below 4.5:1 for small lines (under 3% of the frame height).
//                         The ground is measured from the frame's own pixels in the text's box, so it covers text
//                         over photos, gradients and canvases
//   dead seams            a cut declared in timeline().cuts where either side is at rest: the outgoing shot settled
//                         before the cut, or the incoming one starts from a still frame. Both sides must be mid-motion
//
// Text drawn on a canvas is invisible to these counters: keep readable text in the DOM.
// Writes out/qa/smoke.json and exits 1 when any counter is non-zero.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const opt = {}
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
const num = (k, d) => (opt[k] === undefined ? d : Number(opt[k]))
const pagePath = path.resolve(root, opt.page || 'index.html')
const RATE = num('rate', 10), SAFE = num('safe', 0.05), DEAD = num('dead', 1.5)
const beatsFile = path.join(root, 'audio', 'beats.json')
const measured = fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')) : null

const errors = []
// --gpu: the real GPU, as render.mjs --gpu (a WebGPU page draws black in software WebGPU); WebGPU needs the flag in headless
const gpuArgs = process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : ['--use-gl=angle', '--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist']
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', ...(opt.gpu ? gpuArgs : [])] })
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 0.25 })
const DATA = opt.data ? JSON.parse(fs.readFileSync(path.resolve(root, opt.data), 'utf8')) : null
await page.addInitScript((data) => { window.__RENDER__ = true; if (data !== null) window.__DATA__ = data }, DATA)
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('file://' + pagePath)
// load every declared face, used yet or not: fonts.ready alone lets frame 0 paint in a fallback
await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load().catch(() => { throw new Error(`font failed to load: ${f.family} ${f.weight}`) }))).then(() => document.fonts.ready))
await page.evaluate(([b, f, st]) => window.configure({ beat: b, format: f, style: st }), [measured?.beat ?? null, opt.format ?? null, opt.style ?? null])
const tl = await page.evaluate(() => window.timeline())
await page.setViewportSize({ width: tl.size[0], height: tl.size[1] })

// pixel diffs run in a helper page: mean absolute difference per channel, 0-255
const diffPage = await browser.newPage()
await diffPage.setContent('<canvas id="a"></canvas><canvas id="b"></canvas>')
async function diff(a, b) {
  return diffPage.evaluate(async ([a64, b64]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s })
    const [ia, ib] = await Promise.all([load(a64), load(b64)])
    const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data }
    const A = px(ia), B = px(ib)
    let s = 0
    for (let i = 0; i < A.length; i += 4) s += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])
    return s / (A.length / 4) / 3
  }, [a.toString('base64'), b.toString('base64')])
}
// Sampled contrast heuristic for each text box against the frame behind it: the ground is the median colour of the box's pixels
// that differ clearly from the text colour (the glyphs themselves are excluded)
async function contrasts(img, boxes) {
  return diffPage.evaluate(async ([b64, boxes, W]) => {
    const i = await new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = 'data:image/png;base64,' + b64 })
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0)
    const k = i.width / W
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b)
    return boxes.map((b) => {
      const m = b.color.match(/[\d.]+/g); if (!m) return null
      const [tr, tg, tb] = m.map(Number)
      const x = Math.max(0, Math.floor(b.x * k)), y = Math.max(0, Math.floor(b.y * k)), w = Math.max(1, Math.min(i.width - x, Math.ceil(b.w * k))), h = Math.max(1, Math.min(i.height - y, Math.ceil(b.h * k)))
      const d = g.getImageData(x, y, w, h).data, ground = []
      for (let j = 0; j < d.length; j += 4) if (Math.abs(d[j] - tr) + Math.abs(d[j + 1] - tg) + Math.abs(d[j + 2] - tb) > 90) ground.push(lum(d[j], d[j + 1], d[j + 2]))
      if (ground.length < 4) return null
      ground.sort((p, q) => p - q)
      const L1 = lum(tr, tg, tb), L2 = ground[ground.length >> 1]
      return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    })
  }, [img.toString('base64'), boxes, W])
}
const lowStreak = new Map()
async function shot(t) {
  try { await page.evaluate((tt) => window.seek(tt), t) } catch (e) { errors.push(`seek(${t.toFixed(3)}): ${e.message.split('\n')[0]}`) }
  return page.locator('#stage').screenshot({ type: 'png', animations: 'disabled', scale: 'device' })
}
// readable text leaves with their boxes in stage pixels
function textBoxes() {
  return page.evaluate(() => {
    const stage = document.getElementById('stage').getBoundingClientRect()
    const out = []
    const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o }
    for (const el of document.querySelectorAll('#stage *')) {
      // a numberFlow number is one read: its digit columns are skipped and the element reports its whole value
      if (el.closest('[data-flow-text]') && !el.hasAttribute('data-flow-text')) continue
      const own = el.hasAttribute('data-flow-text') ? el.dataset.flowText
        : [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
      if (!own) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || opacityOf(el) < 0.5) continue
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      // the nearest clipping container below the stage: how much of this text it hides
      let clipped = 0
      if (cs.overflow !== 'visible' && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
        clipped = 1 - (el.clientWidth * el.clientHeight) / (el.scrollWidth * el.scrollHeight)  // its own box cuts it off
      } else for (let a = el.parentElement; a && a.id !== 'stage'; a = a.parentElement) {
        const ac = getComputedStyle(a)
        if (ac.overflow === 'visible' && ac.overflowX === 'visible' && ac.overflowY === 'visible') continue
        const c = a.getBoundingClientRect()
        const iw = Math.max(0, Math.min(r.right, c.right) - Math.max(r.left, c.left)), ih = Math.max(0, Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top))
        clipped = 1 - (iw * ih) / (r.width * r.height)
        break
      }
      el.__smokeId ??= (window.__smokeIds = (window.__smokeIds || 0) + 1)
      out.push({ id: el.__smokeId, text: own, x: r.left - stage.left, y: r.top - stage.top, w: r.width, h: r.height, clipped, drawn: !!el.closest('[data-drawn]'), color: cs.color, op: opacityOf(el) })
    }
    return out
  })
}

const counters = { 'runtime errors': 0, 'text out of stage': 0, 'text in margin': 0, 'text overlaps': 0, 'text clipped': 0, 'broken text': 0, 'short reads': 0, stalls: 0, 'slow hook': 0, nondeterministic: 0, 'dead stretches': 0, 'loop seam': 0, 'single-frame pops': 0, 'dead seams': 0, 'low contrast': 0 }
const findings = []
const note = (k, t, detail) => { counters[k]++; if (findings.filter((f) => f.counter === k).length < 8) findings.push({ counter: k, t: +t.toFixed(3), detail }) }
const [W, H] = tl.size
const mx = W * SAFE, my = H * SAFE

const n = Math.max(2, Math.round(tl.duration * RATE))
let prev = null, still = 0, stillFrom = 0
const clipStreak = new Map()
const shown = new Map() // element -> { text, from }: when its current read began
// Typing (each text extends the last) and a rolling number (only digits change) are one read that grows,
// not a run of short reads: the reader reads the line it settles on.
const digitless = (s) => s.replace(/[\d.,]/g, '')
const sameRead = (a, b) => a.startsWith(b) || b.startsWith(a) || (digitless(a) === digitless(b) && /\d/.test(a) && /\d/.test(b))
const readTime = (text) => Math.max(0.5, 0.3 * text.split(/\s+/).filter(Boolean).length, 0.25 + text.replace(/\s+/g, ' ').trim().length / 17)
const endRead = (r, t) => {
  const dur = t - r.from, need = readTime(r.text)
  if (dur < need) note('short reads', r.from, `"${r.text}" readable for ${dur.toFixed(2)} s, needs ${need.toFixed(2)} s`)
}
const diffs = []
for (let i = 0; i <= n; i++) {
  const t = Math.min(tl.duration - (tl.loop ? 1 / RATE : 0), i / RATE)
  const img = await shot(t)
  const boxes = await textBoxes()
  for (const b of boxes) {
    if (b.drawn) continue   // text drawn into an object (a tile's engraving) may leave the frame with it on a camera move
    if (b.x < 0 || b.y < 0 || b.x + b.w > W || b.y + b.h > H) note('text out of stage', t, b.text)
    else if (b.x < mx || b.y < my || b.x + b.w > W - mx || b.y + b.h > H - my) note('text in margin', t, b.text)
  }
  const now = new Map(boxes.map((b) => [b.id, b.text]))
  for (const [id, r] of [...shown]) {
    const text = now.get(id)
    if (text === undefined) { endRead(r, t); shown.delete(id) }
    else if (text !== r.text) { if (sameRead(r.text, text)) r.text = text; else { endRead(r, t); shown.set(id, { text, from: t }) } }
  }
  for (const b of boxes) if (!b.drawn && !shown.has(b.id)) shown.set(b.id, { text: b.text, from: t })
  for (const b of boxes) if (/\bNaN\b|\bundefined\b|\[object |\bInfinity\b/.test(b.text)) note('broken text', t, `"${b.text}"`)
  const seen = new Set()
  for (const b of boxes) {
    if (b.clipped <= 0.1) continue
    seen.add(b.text)
    const k = (clipStreak.get(b.text) || 0) + 1
    clipStreak.set(b.text, k)
    if (k === Math.max(2, Math.round(0.3 * RATE))) note('text clipped', t, `"${b.text}" ${(b.clipped * 100).toFixed(0)}% hidden by its container`)
  }
  for (const k of [...clipStreak.keys()]) if (!seen.has(k)) clipStreak.delete(k)
  const opaque = boxes.filter((b) => b.op >= 0.9 && !b.drawn), ratios = await contrasts(img, opaque), low = new Set()
  opaque.forEach((b, j) => {
    const r = ratios[j], need = b.h < 0.03 * H ? 4.5 : 3
    if (r === null || r >= need) return
    low.add(b.id)
    const k = (lowStreak.get(b.id) || 0) + 1
    lowStreak.set(b.id, k)
    if (k === Math.max(2, Math.round(0.3 * RATE))) note('low contrast', t, `"${b.text}" ${r.toFixed(1)}:1 against its ground, needs ${need}:1`)
  })
  for (const k of [...lowStreak.keys()]) if (!low.has(k)) lowStreak.delete(k)
  for (let a = 0; a < boxes.length; a++) for (let c = a + 1; c < boxes.length; c++) {
    const p = boxes[a], q = boxes[c]
    if (p.drawn || q.drawn) continue
    const ix = Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)), iy = Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y))
    if (ix * iy > 0.1 * Math.min(p.w * p.h, q.w * q.h)) note('text overlaps', t, `"${p.text}" / "${q.text}"`)
  }
  if (prev) {
    const d = await diff(prev, img)
    diffs.push(d)
    if (d < 0.15) { if (!still) stillFrom = t - 1 / RATE; still += 1 / RATE }
    else { if (still > DEAD) note('dead stretches', stillFrom, `${still.toFixed(1)} s with nothing changing`); still = 0 }
  }
  prev = img
}
for (const r of shown.values()) endRead(r, tl.duration)
if (still > DEAD) note('dead stretches', stillFrom, `${still.toFixed(1)} s with nothing changing`)

// determinism: same t, different seek history, must paint identical pixels
const r = (k) => ((Math.sin(k * 12.9898) * 43758.5453) % 1 + 1) % 1
for (let k = 1; k <= 6; k++) {
  const t = r(k) * tl.duration, other = r(k + 50) * tl.duration
  const a = await shot(t)
  await shot(other)
  const b = await shot(t)
  const d = await diff(a, b)
  if (d > 0.001) note('nondeterministic', t, `differs by ${d.toFixed(3)} after seeking ${other.toFixed(2)} s first`)
}

// loop seam: the jump from the last frame to the first should look like any other frame step
if (tl.loop) {
  const fps = tl.fps || 60, D = tl.duration
  const times = [-3, -2, -1, 0, 1, 2].map((k) => (k < 0 ? D + k / fps : k / fps))
  const imgs = []
  for (const t of times) imgs.push(await shot(t))
  const steps = []
  for (let i = 0; i + 1 < imgs.length; i++) steps.push(await diff(imgs[i], imgs[i + 1]))
  const seam = steps[2], around = [...steps.slice(0, 2), ...steps.slice(3)].sort((a, b) => a - b)
  const median = (around[1] + around[2]) / 2
  if (seam > Math.max(0.4, 2 * median)) note('loop seam', D, `seam step ${seam.toFixed(2)} vs ${median.toFixed(2)} around it`)
}

// single-frame pops: scan every frame; a step 3x larger than the steps around it is a snap or a flash
if (!opt['no-pops']) {
  const fps = tl.fps || 60, D = tl.duration
  const n = Math.round(D * fps) - (tl.loop ? 1 : 0)
  const declared = (tl.cuts || []).map((c) => Math.round(c * fps))
  const steps = []
  let last = await shot(0)
  for (let f = 1; f <= n; f++) {
    const img = await shot(Math.min(D, f / fps))
    steps.push(await diff(last, img))
    last = img
  }
  for (let i = 1; i + 1 < steps.length; i++) {
    if (steps[i] < 0.05 && steps[i - 1] > 0.8 && steps[i + 1] > 0.8 && !declared.some((c) => Math.abs(c - (i + 1)) <= 1)) note('stalls', (i + 1) / fps, `frame ${i + 1} holds still between two moving frames (${steps[i - 1].toFixed(2)} / ${steps[i].toFixed(3)} / ${steps[i + 1].toFixed(2)})`)
  }
  if (!tl.loop) {
    const moving = steps.filter((d) => d > 0.05).sort((a, b) => a - b)
    const ref = Math.max(0.05, 0.3 * (moving[Math.floor(moving.length / 2)] || 0))
    const first = steps.findIndex((d) => d > ref)
    if (first < 0 || (first + 1) / fps > 1.0) note('slow hook', 0, first < 0 ? 'nothing moves at all' : `first visible change at ${((first + 1) / fps).toFixed(2)} s`)
  }
  for (let i = 0; i < steps.length; i++) {
    const around = [...steps.slice(Math.max(0, i - 3), i), ...steps.slice(i + 1, i + 4)].sort((a, b) => a - b)
    if (!around.length) continue
    const med = around[Math.floor(around.length / 2)]
    const f = i + 1
    if (steps[i] > 1 && steps[i] > 3 * Math.max(med, 0.2) && !declared.some((c) => Math.abs(c - f) <= 1)) note('single-frame pops', f / fps, `frame ${f}: step ${steps[i].toFixed(2)} vs ${med.toFixed(2)} around it (declare it in cuts() if it is a designed cut)`)
  }
}

// dead seams: across a declared cut both sides keep moving (the outgoing frame pair before it, the incoming pair after)
{
  const fps = tl.fps || 60
  for (const c of (tl.cuts || []).filter((c) => c > 1 / fps && c < tl.duration - 2 / fps)) {
    const f = Math.round(c * fps)
    const [a, b, d, e] = [await shot((f - 2) / fps), await shot((f - 1) / fps), await shot(f / fps), await shot((f + 1) / fps)]
    const out = await diff(a, b), inn = await diff(d, e)
    if (out < 0.05 || inn < 0.05) note('dead seams', c, `${out < 0.05 ? 'outgoing shot at rest' : ''}${out < 0.05 && inn < 0.05 ? ', ' : ''}${inn < 0.05 ? 'incoming shot starts at rest' : ''} (steps ${out.toFixed(3)} / ${inn.toFixed(3)}): cut on motion, both sides moving`)
  }
}

for (const e of errors) note('runtime errors', 0, e)
await browser.close()

const width = Math.max(...Object.keys(counters).map((k) => k.length))
console.log(`smoke ${tl.format} ${W}x${H}, ${tl.duration.toFixed(2)} s, sampled at ${RATE} fps`)
for (const [k, v] of Object.entries(counters)) console.log(`  ${k.padEnd(width)}  ${v}`)
for (const f of findings) console.log(`  - ${f.counter} @ ${f.t}s: ${f.detail}`)
fs.mkdirSync(path.join(root, 'out', 'qa'), { recursive: true })
fs.writeFileSync(path.join(root, 'out', 'qa', 'smoke.json'), JSON.stringify({ format: tl.format, counters, findings }, null, 2))
process.exit(Object.values(counters).some((v) => v > 0) ? 1 : 0)
