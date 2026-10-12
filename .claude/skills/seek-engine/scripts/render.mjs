// render.mjs: drives window.seek(t) in headless Chromium (Playwright). Run from the film folder.
//
//   node scripts/render.mjs still 0 2.5 7.9           out/stills/t2.50.png ...   full-resolution stills
//   node scripts/render.mjs sheet --every 0.5         out/sheets/sheet.png       contact sheet, labelled tiles
//   node scripts/render.mjs sheet --at 1,1.2,4.05     exact moments
//   node scripts/render.mjs beats [--offset 0.7]      out/sheets/beats.png       one frame per beat, settled
//   node scripts/render.mjs strip 3.9 4.3             out/sheets/strip.png       EVERY frame in a stretch (pops, overlaps)
//   node scripts/render.mjs full [--sub 4]            out/<format>.mp4           the film, sub-frame motion blur, audio muxed
//
// Options for every mode:
//   --format 16:9|9:16|1:1   (full also takes --format all)      --scale 0.5 (draft) | 2 (supersampled master)
//   --page index.html        --out <path>      --cols 6      --w 320 (tile width)      --style night (a look from STYLES)
// Options for full: --sub 4 (sub-frames per frame; 8 for fast moves), --shutter 240 (degrees, centred on the frame),
//   --workers 6, --range 2:5 (seconds), --fps 60, --audio audio/mix.wav (default: used when it exists), --crf 16,
//   --chunk 10 (render in 10 s segments kept in out/segments/: a crashed or stopped long render resumes where it
//   left off; segments are keyed by a hash of the page and the options, so any edit starts fresh; --fresh forces it)
// --gpu (any mode): draw on the real GPU (Metal on macOS) instead of software WebGL. Measured 9x faster on a
//   shader-heavy frame; for 3D and shader films. Pixels can differ between machines, so keep one machine per film.
// Subtitles: when audio/vo.srt exists (the voiceover skill writes it), a full render from 0 carries it as a
//   selectable track and writes the .srt next to the MP4.
// --grain 0.03 (full): seeded film grain over the whole frame (0.03-0.06 on gradient, photo or 3D films; one level for the
//   whole film; budget the file size, grain encodes large). Never on a flat vector film or over per-element smear.
// --alpha (full): a transparent render for an intro, outro or overlay to composite elsewhere: ProRes 4444 .mov
//   (--alpha webm: VP9 with alpha for the web). The page sees window.__ALPHA__ and paints no background of its own;
//   video only (deliver the sound as its own file), one pass (no --chunk).
// --data record.json (any mode): one film, many outputs. The page reads the record as window.__DATA__ (names, numbers,
//   copy) before its first seek; render each record with its own --out, e.g.
//   for f in data/*.json; do node scripts/render.mjs full --data "$f" --out "out/$(basename "$f" .json).mp4"; done
//   Check one record's stills before rendering them all.
// Motion blur never averages across a hard cut declared in the page's cuts(): those frames stay crisp, never a
// double exposure of two shots.
//
// Every run writes out/cues.json from window.timeline(), and reads audio/beats.json when it exists
// so the page uses the measured beat. A page error fails the run: an error is never a "warning".
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const argv = process.argv.slice(2)
const mode = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'sheet'
const positional = []
const opt = {}
for (let i = mode === argv[0] ? 1 : 0; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=')
    if (v !== undefined) opt[k] = v
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opt[k] = argv[++i]
    else opt[k] = true
  } else positional.push(a)
}
const num = (k, d) => (opt[k] === undefined ? d : Number(opt[k]))
const pagePath = path.resolve(root, opt.page || 'index.html')
const outDir = path.join(root, 'out')
const scale = num('scale', 1)
const beatsFile = path.join(root, 'audio', 'beats.json')
const measured = fs.existsSync(beatsFile) ? JSON.parse(fs.readFileSync(beatsFile, 'utf8')) : null
const pageErrors = []
const dataText = opt.data ? fs.readFileSync(path.resolve(root, opt.data), 'utf8') : null
const DATA = dataText === null ? null : (() => { try { return JSON.parse(dataText) } catch (e) { fail(`render: --data ${opt.data} is not valid JSON (${e.message})`) } })()

if (!fs.existsSync(pagePath)) fail(`render: no page at ${pagePath}. Run from the film folder or pass --page.`)

function fail(msg) { console.error(msg); process.exit(1) }
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] })
    p.on('error', reject)
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

async function openPage(browser, format, tag = '') {
  const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: scale })
  await page.addInitScript(([alpha, data]) => {
    window.__RENDER__ = true
    if (data !== null) window.__DATA__ = data
    // alpha renders: the page paints no background; the document's own background goes transparent too
    if (alpha) { window.__ALPHA__ = true; addEventListener('DOMContentLoaded', () => document.head.append(Object.assign(document.createElement('style'), { textContent: 'html,body{background:transparent!important}' }))) }
  }, [!!opt.alpha, DATA])
  page.on('pageerror', (e) => { pageErrors.push(e.message); console.error(`[page error${tag}] ${e.message}`) })
  page.on('console', (m) => { if (m.type() === 'error') { pageErrors.push(m.text()); console.error(`[console error${tag}] ${m.text()}`) } })
  await page.goto('file://' + pagePath)
  // load every declared face, used yet or not: fonts.ready alone lets frame 0 paint in a fallback
  await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load().catch(() => { throw new Error(`font failed to load: ${f.family} ${f.weight}`) }))).then(() => document.fonts.ready))
  const missing = await page.evaluate(() => ['seek', 'configure', 'timeline'].filter((k) => typeof window[k] !== 'function'))
  if (missing.length) fail(`render: the page does not expose window.${missing.join(', window.')} (see the seek-engine render contract)`)
  await page.evaluate(([b, f, st]) => window.configure({ beat: b, format: f, style: st }), [measured?.beat ?? null, format ?? null, opt.style ?? null])
  const tl = await page.evaluate(() => window.timeline())
  await page.setViewportSize({ width: tl.size[0], height: tl.size[1] })
  // load every declared face, used yet or not: fonts.ready alone lets frame 0 paint in a fallback
  await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load().catch(() => { throw new Error(`font failed to load: ${f.family} ${f.weight}`) }))).then(() => document.fonts.ready))
  return { page, tl }
}

async function frameAt(page, t, type = 'png') {
  await page.evaluate((tt) => window.seek(tt), t)
  return page.locator('#stage').screenshot({ type, animations: 'disabled', scale: 'device', omitBackground: !!opt.alpha && type === 'png', ...(type === 'jpeg' ? { quality: 92 } : {}) })
}

// Contact sheet composed in the browser: labelled tiles, no ffmpeg font dependency.
async function writeSheet(browser, tiles, file, cols, tileW) {
  const page = await browser.newPage({ viewport: { width: cols * (tileW + 8) + 8, height: 200 } })
  const cells = tiles.map(({ buf, label }) => `<figure><img src="data:image/png;base64,${buf.toString('base64')}"><figcaption>${label}</figcaption></figure>`).join('')
  await page.setContent(`<style>body{margin:0;background:#1b1b1a;font:600 13px/1 ui-monospace,Menlo,monospace;color:#f2f0ea}
    main{display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:8px;padding:8px}
    figure{margin:0;position:relative}img{width:${tileW}px;display:block}
    figcaption{position:absolute;left:4px;top:4px;background:rgba(0,0,0,.72);padding:3px 5px;border-radius:3px}</style><main>${cells}</main>`)
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())))
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.locator('main').screenshot({ path: file })
  await page.close()
  console.log(`wrote ${path.relative(root, file)} (${tiles.length} frames)`)
}

function writeCues(tl) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'cues.json'), JSON.stringify(tl, null, 2))
}

async function renderFull(browser, format) {
  const fps = num('fps', null)
  const probe = await openPage(browser, format)
  const tl = probe.tl
  writeCues(tl)
  await probe.page.close()
  const FPS = fps || tl.fps || 60, SUB = Math.max(1, num('sub', 4)), WORKERS = Math.max(1, num('workers', 6))
  const SHUTTER = num('shutter', 240) / 360, CUTS = (tl.cuts || []).slice().sort((x, y) => x - y)
  // sample k of output frame fi: spread over the shutter, centred on the frame, never across a declared cut
  const sampleTime = (fi, k) => {
    const c = fi / FPS
    let t = SUB > 1 ? c + ((k + 0.5) / SUB - 0.5) * SHUTTER / FPS : c
    for (const cut of CUTS) {
      if (c < cut && t >= cut) t = cut - 1e-4
      if (c >= cut && t < cut) t = cut
    }
    return t
  }
  const [a, b] = opt.range ? String(opt.range).split(':').map(Number) : [0, tl.duration]
  const first = Math.round(a * FPS), frames = Math.round(b * FPS) - first
  const tag = tl.format.replace(':', 'x') + (opt.style ? '-' + opt.style : '')
  console.log(`full ${tl.format}${opt.style ? ' ' + opt.style : ''} ${tl.size.join('x')} @${FPS}fps x${SUB} sub-frames (${Math.round(SHUTTER * 360)}° shutter), ${frames} frames, ${WORKERS} workers${opt.gpu ? ', gpu' : ''}`)
  const blur = SUB > 1 ? `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB),` : ''
  const ALPHA = opt.alpha ? (opt.alpha === 'webm' ? 'webm' : 'mov') : null
  if (ALPHA && opt.chunk) fail('render: --alpha renders in one pass; drop --chunk')
  const pix = ALPHA === 'mov' ? 'yuva444p10le' : ALPHA === 'webm' ? 'yuva420p' : 'yuv420p'
  // --grain 0.03: film grain over the whole frame, after the motion blur; seeded, so a re-render is identical (each
  // --chunk segment seeds from its first frame, so the grain never repeats between segments). Luma only, and held at
  // 12 Hz like real film grain: a fresh pattern every frame defeats inter-frame compression (one test film went from
  // 9 MB to 85 MB; after product-launch-motion's trap 25, MIT)
  const GRAIN = num('grain', 0)
  const grain = (seed) => `format=yuv444p,split[m][g0];[g0]fps=12,lutyuv=y=128:u=128:v=128,noise=c0_seed=${seed}:c0s=${Math.round(GRAIN * 255)}:c0f=t,fps=${FPS}[g];[m][g]blend=all_mode=grainmerge,`
  const vf = (seed = 7) => `${blur}${GRAIN > 0 ? grain(seed) : ''}scale=out_color_matrix=bt709:out_range=tv,format=${pix},setsar=1,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv`
  const codec = ALPHA === 'mov' ? ['-c:v', 'prores_ks', '-profile:v', '4444', '-vendor', 'apl0']
    : ALPHA === 'webm' ? ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(num('crf', 24)), '-row-mt', '1']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(num('crf', 16)), ...(GRAIN > 0 ? ['-tune', 'film'] : [])]
  const venc = ['-r', String(FPS), ...codec, '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
  const pages = await Promise.all(Array.from({ length: WORKERS }, (_, w) => openPage(browser, format, ` #${w}`)))
  const started = Date.now()
  // render frames [f0, f0 + n) as sub-frame PNGs into dir
  const renderFrames = async (f0, n, dir) => {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    const total = n * SUB
    let done = 0
    await Promise.all(pages.map(async ({ page }, w) => {
      for (let i = w; i < total; i += WORKERS) {
        const t = sampleTime(f0 + Math.floor(i / SUB), i % SUB)
        fs.writeFileSync(path.join(dir, `${String(i).padStart(7, '0')}.png`), await frameAt(page, t))
        if (++done % (FPS * SUB) === 0) {
          const el = (Date.now() - started) / 1000
          console.log(`  ${done}/${total} sub-frames  ${(el / done * 1000).toFixed(0)} ms each`)
        }
      }
    }))
  }
  const encode = (dir, n, out, extra = [], seed = 7) => run('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS * SUB), '-i', path.join(dir, '%07d.png'),
    ...extra.slice(0, extra.indexOf('--')), '-vf', vf(seed), ...venc, ...extra.slice(extra.indexOf('--') + 1), '-frames:v', String(n), ...(ALPHA === 'webm' ? [] : ['-movflags', '+faststart']), out])
  const audio = opt.audio ? path.resolve(root, opt.audio) : path.join(root, 'audio', 'mix.wav')
  const withAudio = !ALPHA && opt.audio !== 'none' && fs.existsSync(audio)
  const srt = path.join(root, 'audio', 'vo.srt')
  const withSubs = !ALPHA && fs.existsSync(srt) && first === 0
  const out = opt.out && format !== 'all' ? path.resolve(root, opt.out) : path.join(outDir, `${tag}${opt.range ? `_${a}-${b}` : ''}${ALPHA ? '-alpha.' + ALPHA : '.mp4'}`)
  // no mix yet: a silent AAC track, because feeds (Instagram, TikTok, LinkedIn) mishandle a video with no audio
  // stream; --audio none keeps the file video-only (scene pages joined and mixed later)
  const silent = !ALPHA && !withAudio && opt.audio !== 'none'
  const muxIn = [...(withAudio ? ['-ss', String(a), '-i', audio] : silent ? ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'] : []), ...(withSubs ? ['-i', srt] : [])]
  const muxMap = [...(withAudio ? ['-map', '1:a', '-af', 'apad', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : silent ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '128k'] : []),
    ...(withSubs ? ['-map', `${withAudio || silent ? 2 : 1}:s`, '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng'] : []), '-t', String(frames / FPS)]
  const CHUNK = opt.chunk ? Math.max(1, Math.round(num('chunk', 10) * FPS)) : 0
  if (!CHUNK) {
    const dir = path.join(root, '.frames', tag)
    await renderFrames(first, frames, dir)
    await encode(dir, frames, out, [...muxIn, '--', '-map', '0:v', ...muxMap])
    fs.rmSync(dir, { recursive: true, force: true })
  } else {
    // segments keyed by everything that changes their pixels: page source, options, measured beat
    const key = crypto.createHash('sha1').update(fs.readFileSync(pagePath)).update(JSON.stringify([format, opt.style, scale, FPS, SUB, SHUTTER, num('crf', 16), CHUNK, measured?.beat ?? null, dataText, GRAIN])).digest('hex').slice(0, 10)
    const segDir = path.join(outDir, 'segments', `${tag}-${key}`)
    if (opt.fresh) fs.rmSync(segDir, { recursive: true, force: true })
    fs.mkdirSync(segDir, { recursive: true })
    const segs = []
    for (let f = first; f < first + frames; f += CHUNK) segs.push([f, Math.min(CHUNK, first + frames - f)])
    let reused = 0
    for (const [f0, n] of segs) {
      const seg = path.join(segDir, `${String(f0).padStart(7, '0')}-${n}.mp4`)
      if (fs.existsSync(seg)) { reused++; continue }
      const dir = path.join(root, '.frames', `${tag}-${f0}`)
      await renderFrames(f0, n, dir)
      await encode(dir, n, seg + '.part.mp4', ['--', '-an'], 7 + f0)
      fs.renameSync(seg + '.part.mp4', seg)            // a segment exists only once it is complete
      fs.rmSync(dir, { recursive: true, force: true })
      console.log(`  segment ${segs.indexOf(segs.find((x) => x[0] === f0)) + 1}/${segs.length} done (${((Date.now() - started) / 1000).toFixed(0)} s)`)
    }
    if (reused) console.log(`  reused ${reused}/${segs.length} finished segments from ${path.relative(root, segDir)}`)
    const list = path.join(segDir, 'list.txt')
    fs.writeFileSync(list, segs.map(([f0, n]) => `file '${String(f0).padStart(7, '0')}-${n}.mp4'`).join('\n'))
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, ...muxIn, '-map', '0:v', '-c:v', 'copy', ...muxMap, '-movflags', '+faststart', out])
  }
  await Promise.all(pages.map(({ page }) => page.close()))
  if (withSubs) fs.copyFileSync(srt, out.replace(/\.mp4$/, '.srt'))
  // <out>.events.json: the timeline's declared cuts, relative to the file's first frame; frame-review look.py reads it
  // as the authoritative cut list instead of detecting cuts from pixels
  const cutEvents = CUTS.filter((c) => c > a && c < b).map((c) => ({ t: +(c - a).toFixed(4), type: 'cut' }))
  if (cutEvents.length) fs.writeFileSync(out + '.events.json', JSON.stringify(cutEvents))
  console.log(`wrote ${path.relative(root, out)}${withAudio ? ` with ${path.relative(root, audio)}` : silent ? ' with a silent audio track' : ALPHA ? ' (alpha, video only)' : ' (no audio)'}${withSubs ? ' and subtitles' : ''} in ${((Date.now() - started) / 1000).toFixed(0)} s`)
}

// --gpu: the real GPU through ANGLE (Metal on macOS, Vulkan elsewhere); default is software WebGL (SwiftShader)
const gpuArgs = process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal'] : ['--use-gl=angle', '--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist']
const browser = await chromium.launch(opt.gpu ? { args: gpuArgs } : {})
try {
  const format = opt.format && opt.format !== 'all' ? opt.format : null
  const cols = num('cols', 6), tileW = num('w', 320)
  if (mode === 'full') {
    if (opt.format === 'all') {
      const { page, tl } = await openPage(browser, null)
      const names = await page.evaluate(() => Object.keys(window.timeline().formats || {}))
      await page.close()
      const list = names.length ? names : [tl.format]
      for (const f of list) await renderFull(browser, f)
    } else await renderFull(browser, format)
  } else {
    const { page, tl } = await openPage(browser, format)
    writeCues(tl)
    const fps = num('fps', tl.fps || 60)
    const label = (t) => `${t.toFixed(2)}s  f${Math.round(t * fps)}`
    if (mode === 'still') {
      const times = positional.length ? positional.map(Number) : [0]
      fs.mkdirSync(path.join(outDir, 'stills'), { recursive: true })
      for (const t of times) {
        const file = opt.out && times.length === 1 ? path.resolve(root, opt.out) : path.join(outDir, 'stills', `t${t.toFixed(2)}.png`)
        fs.writeFileSync(file, await frameAt(page, t))
        console.log(`wrote ${path.relative(root, file)}`)
      }
    } else if (mode === 'sheet' || mode === 'beats' || mode === 'strip') {
      let times
      if (mode === 'beats') {
        const off = num('offset', 0.7)
        const n = Math.floor(tl.duration / tl.beat + 1e-6)
        times = Array.from({ length: n }, (_, i) => (i + off) * tl.beat)
      } else if (mode === 'strip') {
        const [a, b] = positional.length >= 2 ? positional.map(Number) : [0, 0.5]
        times = []
        for (let f = Math.round(a * fps); f <= Math.round(b * fps); f++) times.push(f / fps)
      } else if (opt.at) times = String(opt.at).split(',').map(Number)
      else {
        const every = num('every', 0.5), from = num('from', 0), to = num('to', tl.duration)
        times = []
        for (let t = from; t <= to + 1e-6; t += every) times.push(Math.min(t, tl.duration))
      }
      const tiles = []
      for (const t of times) tiles.push({ buf: await frameAt(page, t), label: mode === 'beats' ? `beat ${tiles.length}  ${label(t)}` : label(t) })
      const file = opt.out ? path.resolve(root, opt.out) : path.join(outDir, 'sheets', `${mode}${format ? '-' + format.replace(':', 'x') : ''}.png`)
      await writeSheet(browser, tiles, file, mode === 'strip' ? num('cols', 8) : cols, tileW)
    } else fail(`render: unknown mode "${mode}". Modes: still, sheet, beats, strip, full.`)
  }
} finally {
  await browser.close()
}
if (pageErrors.length) fail(`render: ${pageErrors.length} page error(s). Fix them: an error in seek(t) is a broken frame.`)
