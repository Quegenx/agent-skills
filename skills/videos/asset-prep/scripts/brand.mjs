#!/usr/bin/env node
// brand.mjs (Apache-2.0, see LICENSE-motionmaxxing.txt; modified) - capture a website's brand (copy, colours, fonts, logo, screenshots) with headless Chrome over CDP.
//
// Usage:  node brand.mjs <url> [outDir=brand]        (Node 22+; zero dependencies; needs Google Chrome)
//
// Loads the page at 1920x1080, dismisses cookie banners when trivial, scrolls through to trigger lazy content, then writes:
//   outDir/brand.json   everything (copy, colour roles, fonts, logo candidates, warnings)
//   outDir/BRAND.md     human-readable summary (palette with role guess, fonts, logo path, copy lines, CTA texts)
//   outDir/board.png    ONE image to look at: palette, font specimen (real font if downloaded), logo, 4 screenshots, key copy
//   outDir/logo/        logo.svg|png (best candidate; inline SVG gets computed fills), favicon.*, app-icon.*
//   outDir/fonts/       downloaded .woff2/.woff/.ttf/.otf that the page actually uses
//   outDir/screens/NN.jpg   hero viewport + 3-5 viewports down the page
//   outDir/media/NN.jpg     element screenshots of large imagery / app UI (img, video, canvas > 500px wide), plus og-image
// Colour roles: ground(s) = area-weighted backgrounds (DOM + screenshot pixels),
//   ink = the computed colour of the LARGEST HEADING (h1 / hero line; text-volume weighted inside it) = headline / logo ink,
//   ink-soft = the most used body-text colour when it differs from ink (body copy grey on dark sites), ink muted = a third, dimmer neutral,
//   accent(s) = CTA background / brand CSS variables / link / logo / saturated pixels; theme = dark|light from the main ground.
//   When no CSS accent exists (monochrome sites) saturated dominant colours are sampled from screens/ and media/ images in a small
//   in-page canvas and listed as "accent candidates (from imagery)" with their source file (colors.accentCandidates in brand.json).
// Media hygiene: blank images (pixel std-dev ~0, e.g. a WebGL canvas that did not paint) are dropped; images whose top 8% matches the
//   site nav strip of a screenshot are kept but flagged "screenshot, not product media"; near-blank dark gradients (std < 8, mean luma < 40)
//   are flagged "near-blank" (brand.json media[].flag, BRAND.md).
//   <img>/<canvas>/<video> element shots are taken isolated (everything else on the page hidden) so fixed navs and hero text do not leak in.
// Exit: 0 ok (warnings are listed in brand.json and printed), 1 when the page cannot be loaded.
import fs from 'node:fs';
import path from 'node:path';
import { launchChrome, parseArgs, die, helpFrom } from './_cdp.mjs';
import { pageDismiss, pageScroll, pageExtract, pageIsolate, pageImageStats, pagePixels } from './brand-page.mjs';
import { writeBrandReport, makeBoard } from './brand-report.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2), { help: 'bool' });
if (opt.help || !pos[0]) { console.log(helpFrom(import.meta.url)); process.exit(opt.help ? 0 : 1); }
let startUrl = pos[0]; if (!/^(https?|file):/i.test(startUrl)) startUrl = 'https://' + startUrl;
const out = path.resolve(pos[1] || 'brand');
const warnings = [];
const warn = (m) => { warnings.push(m); console.error('warn: ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('error: overall timeout (180s)'); process.exit(1); }, 180000).unref();

// ====================================================================== colour helpers (node side)
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const lum = (h) => { const [r, g, b] = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const dist = (a, b) => { const p = hex2rgb(a), q = hex2rgb(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
const hsl = (h) => { let [r, g, b] = hex2rgb(h).map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)); const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(hh * 60 + 360) % 360, s, l]; };
const chromatic = (h) => { const [, s, l] = hsl(h); return s > 0.3 && l > 0.12 && l < 0.88; };
function mergeColors(cands, thr = 18) { // [{hex,w,src}] -> clusters sorted by weight
  const cl = [];
  for (const c of [...cands].sort((a, b) => b.w - a.w)) {
    const m = cl.find((x) => dist(x.hex, c.hex) < thr);
    if (m) { m.w += c.w; m.src.push(...[].concat(c.src)); } else cl.push({ hex: c.hex, w: c.w, src: [].concat(c.src) });
  }
  return cl.sort((a, b) => b.w - a.w);
}


// ====================================================================== node-side helpers
const UA_HDR = (ref) => ({ 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', accept: '*/*', ...(ref ? { referer: ref } : {}) });
async function fetchBuf(u, ref, max = 12e6) {
  if (u.startsWith('data:')) { const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u); if (!m) throw new Error('bad data uri'); return { buf: m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3])), type: m[1] }; }
  const r = await fetch(u, { headers: UA_HDR(ref), signal: AbortSignal.timeout(20000), redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const ab = Buffer.from(await r.arrayBuffer()); if (ab.length > max) throw new Error('too large');
  return { buf: ab, type: (r.headers.get('content-type') || '').split(';')[0] };
}
const slug = (s) => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';
const extOf = (u, type, buf) => {
  if (buf && buf.slice(0, 4).toString() === 'wOF2') return 'woff2'; if (buf && buf.slice(0, 4).toString() === 'wOFF') return 'woff';
  if (buf && buf.slice(0, 4).toString('hex') === '00010000') return 'ttf'; if (buf && buf.slice(0, 4).toString() === 'OTTO') return 'otf';
  if (buf && buf.slice(0, 5).toString().toLowerCase() === '<?xml' || buf && /<svg/i.test(buf.slice(0, 400).toString())) return 'svg';
  if (buf && buf[0] === 0x89 && buf[1] === 0x50) return 'png'; if (buf && buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'; if (buf && buf.slice(0, 4).toString() === 'RIFF') return 'webp'; if (buf && buf.slice(0, 3).toString() === 'GIF') return 'gif';
  if (buf && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) return 'ico';
  const m = /\.(woff2|woff|ttf|otf|svg|png|jpe?g|webp|gif|ico|avif)(?:[?#]|$)/i.exec(u || ''); if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  return ({ 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' })[type] || 'bin';
};
const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|blinkmacsystemfont|emoji|math|fangsong|inherit|initial)$/i;
const firstFamily = (stack) => { for (const f of (stack || '').split(',')) { const n = f.trim().replace(/^["']|["']$/g, ''); if (n && !generic.test(n)) return n; } return null; };
const normFam = (s) => String(s || '').toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
const wnum = (w) => { const n = parseFloat(String(w).split(' ')[0]); return Number.isFinite(n) ? n : (w === 'bold' ? 700 : 400); };
const wcover = (w, want) => { const p = String(w).trim().split(/\s+/).map(wnum); return p.length > 1 ? (want >= p[0] && want <= p[1] ? 0 : Math.min(Math.abs(want - p[0]), Math.abs(want - p[1]))) : Math.abs(p[0] - want); };

// ====================================================================== main
(async () => {
  fs.mkdirSync(out, { recursive: true });
  for (const d of ['logo', 'fonts', 'screens', 'media']) fs.mkdirSync(path.join(out, d), { recursive: true });
  const br = await launchChrome({ width: 1920, height: 1080 });
  try { await run(br); } finally { await br.close(); }
})().catch((e) => { console.error('error: ' + e.message); process.exit(1); });

async function run(br) {
  const page = await br.newPage({ width: 1920, height: 1080 });
  const ua = (await br.cdp.send('Browser.getVersion')).userAgent.replace('HeadlessChrome', 'Chrome');
  await page.send('Network.enable');
  await page.send('Network.setUserAgentOverride', { userAgent: ua, acceptLanguage: 'en-US,en;q=0.9' });
  const fontReqs = new Map(); let inflight = 0;
  page.on('Network.requestWillBeSent', () => { inflight++; });
  page.on('Network.loadingFinished', () => { inflight = Math.max(0, inflight - 1); });
  page.on('Network.loadingFailed', () => { inflight = Math.max(0, inflight - 1); });
  page.on('Network.responseReceived', (p) => { if (p.type === 'Font') fontReqs.set(p.response.url, p.response.mimeType); });
  page.on('Page.javascriptDialogOpening', () => page.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}));
  const idle = async (max = 5000) => { const t0 = Date.now(); let quiet = 0; while (Date.now() - t0 < max) { quiet = inflight <= 2 ? quiet + 150 : 0; if (quiet >= 700) return true; await sleep(150); } return false; };

  console.error(`loading ${startUrl} ...`);
  let loaded;
  try { loaded = await page.goto(startUrl, { timeout: 35000 }); } catch (e) { die(e.message); }
  if (!loaded) warn('load event did not fire in 35s; continuing with what rendered');
  await idle(6000); await sleep(1200);
  const clicked = await page.eval(`(${pageDismiss})()`).catch(() => null);
  if (clicked) { console.error('cookie banner dismissed: ' + clicked); await sleep(600); }
  const docH = await page.eval(`(${pageScroll})()`, { timeout: 90000 }).catch((e) => { warn('scroll step failed: ' + e.message); return 3000; });
  await idle(4000);
  await page.eval(`(${pageDismiss})()`).catch(() => {});
  await sleep(600);

  const X = await page.eval(`(${pageExtract})()`, { timeout: 90000 });
  if (!X || (!X.h1.length && !X.h2.length && !X.title)) warn('page looks empty (blocked or JS-only?)');
  const origin = new URL(X.finalUrl).origin;
  const hostLabel = (() => { try { const h = new URL(X.finalUrl).hostname.replace(/^www\./, '').split('.'); return (h.length > 1 ? h[h.length - 2] : h[0]).toLowerCase(); } catch { return ''; } })();
  const nk = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const lab = (X.logoGroups.find((g) => g.label) || {}).label;
  X.name = X.nameMeta || X.titleParts.find((p) => hostLabel.length > 2 && (nk(p).includes(hostLabel) || hostLabel.includes(nk(p)))) || (lab && X.titleParts.find((p) => nk(p) === nk(lab) || nk(p).includes(nk(lab)))) || (lab && lab.length < 30 ? lab : null) || (X.titleParts[0] && X.titleParts[0].length <= 28 ? X.titleParts[0] : [...X.titleParts].sort((a, b) => a.length - b.length)[0]) || (hostLabel ? hostLabel[0].toUpperCase() + hostLabel.slice(1) : null);
  console.error(`extracted: "${X.name}" docH=${docH} h1=${X.h1.length} ctas=${X.ctas.length} logoGroups=${X.logoGroups.length}`);

  // ---------------------------------------------------------- screenshots
  const screens = [];
  const vh = 1080, maxY = Math.max(0, docH - vh);
  const nShots = Math.min(5, Math.max(0, Math.ceil(docH / vh) - 1));
  const ys = [0]; for (let i = 1; i <= Math.max(nShots, Math.min(3, nShots)); i++) ys.push(Math.round((maxY * i) / nShots));
  for (let i = 0; i < ys.length; i++) {
    await page.eval(`scrollTo(0, ${ys[i]})`); await sleep(i === 0 ? 900 : 750);
    const f = `screens/${String(i + 1).padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(out, f), await page.shot({ format: 'jpeg', quality: 86 }));
    screens.push({ file: f, scrollY: ys[i] });
  }
  if (screens.length < 4) warn(`page is short (${docH}px): only ${screens.length} screenshots`);

  // ---------------------------------------------------------- media element screenshots
  const mediaOut = []; let mi = 0;
  for (const m of X.media) {
    if (mi >= 6) break;
    const r = m.rect; const clip = { x: Math.max(0, r.x), y: r.y, width: Math.min(r.w, 1920), height: Math.min(r.h, 1400), scale: 1 };
    try {
      await page.eval(`scrollTo(0, ${Math.max(0, r.y - 100)})`); await sleep(500);
      const f = `media/${String(++mi).padStart(2, '0')}.jpg`;
      const isolated = process.env.BRAND_NO_ISOLATE ? false : await page.eval(`(${pageIsolate})(${JSON.stringify(m.rect)}, ${JSON.stringify(m.kind)}, ${JSON.stringify(m.src)})`).catch(() => false);
      if (isolated) await sleep(120);
      try { fs.writeFileSync(path.join(out, f), await page.shot({ format: 'jpeg', quality: 88, clip, beyond: true })); }
      finally { if (isolated) await page.eval('(() => { const s = document.getElementById("__md_iso"); if (s) s.remove(); document.querySelectorAll("[data-md-el],[data-md-anc]").forEach((n) => { n.removeAttribute("data-md-el"); n.removeAttribute("data-md-anc"); }); })()').catch(() => {}); }
      mediaOut.push({ file: f, kind: m.kind, src: m.src, alt: m.alt, w: r.w, h: r.h });
    } catch (e) { warn(`media screenshot failed (${m.src || m.kind}): ${e.message}`); mi--; }
  }
  await page.eval('scrollTo(0,0)');

  // ---------------------------------------------------------- logo
  const logo = { file: null, kind: null, source: null, fills: [], onDark: null, favicon: null, appIcon: null, text: X.textLogo, candidates: [] };
  X.logoGroups.forEach((g) => logo.candidates.push({ score: g.score, why: g.why, members: g.members.map((m) => `${m.tag} ${m.rect.w}x${m.rect.h} ${m.src || ''}`.trim()), lockup: !!g.lockup }));
  const saveLogo = (buf, ext, source, kind) => { for (const f of fs.readdirSync(path.join(out, 'logo'))) if (/^logo\./.test(f)) fs.unlinkSync(path.join(out, 'logo', f)); logo.file = `logo/logo.${ext}`; logo.kind = kind; logo.source = source; fs.writeFileSync(path.join(out, logo.file), buf); };
  for (const g of X.logoGroups) {
    if (logo.file) break;
    try {
      if (g.lockup) { saveLogo(g.lockup, 'svg', 'inline svg lockup (' + g.why.join(',') + ')', 'svg'); logo.fills = [...new Set(g.members.flatMap((m) => m.fills || []))]; break; }
      const svg = g.members.filter((m) => m.svg).sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h)[0];
      if (svg) { saveLogo(svg.svg, 'svg', 'inline svg (' + g.why.join(',') + ')', 'svg'); logo.fills = svg.fills || []; break; }
      const img = g.members.filter((m) => m.src).sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h)[0];
      if (img) {
        try { const { buf, type } = await fetchBuf(img.src, X.finalUrl); const ext = extOf(img.src, type, buf); if (ext === 'bin' || ext === 'ico') throw new Error('unusable type ' + type); saveLogo(buf, ext, 'img ' + img.src, ext === 'svg' ? 'svg' : 'raster'); break; }
        catch (e) { // fall back to an element screenshot
          const r = g.rect; saveLogo(await page.shot({ format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 }, beyond: true }), 'png', `screenshot of ${img.src} (download failed: ${e.message})`, 'raster'); break;
        }
      }
    } catch (e) { warn('logo candidate failed: ' + e.message); }
  }
  // icons
  const best = (arr) => arr.sort((a, b) => (parseInt((b.sizes || '0').split('x')[0]) || 0) - (parseInt((a.sizes || '0').split('x')[0]) || 0));
  const apple = best(X.icons.filter((i) => /apple-touch/i.test(i.rel)))[0];
  const fav = X.icons.find((i) => /svg/.test(i.type || '') || /\.svg(\?|$)/i.test(i.href)) || best(X.icons.filter((i) => !/apple|mask/i.test(i.rel)))[0] || (origin !== 'null' ? { href: origin + '/favicon.ico' } : null);
  for (const [item, name, key] of [[fav, 'favicon', 'favicon'], [apple, 'app-icon', 'appIcon']]) {
    if (!item) continue;
    try { const { buf, type } = await fetchBuf(item.href, X.finalUrl, 3e6); const ext = extOf(item.href, type, buf); if (ext === 'bin') throw new Error('unknown type'); const f = `logo/${name}.${ext}`; fs.writeFileSync(path.join(out, f), buf); logo[key] = f; } catch (e) { warn(`${name} fetch failed (${item.href}): ${e.message}`); }
  }
  if (!logo.file) {
    const fb = logo.appIcon || logo.favicon;
    if (fb) { const ext = fb.split('.').pop(); fs.copyFileSync(path.join(out, fb), path.join(out, `logo/logo.${ext}`)); logo.file = `logo/logo.${ext}`; logo.kind = ext === 'svg' ? 'svg' : 'raster'; logo.source = 'FALLBACK: ' + fb + ' (no page logo found)'; warn('no logo found in page; used icon as fallback'); }
    else warn('no logo found at all' + (X.textLogo ? ` (text wordmark "${X.textLogo.text}" in ${X.textLogo.font})` : ''));
  }
  if (logo.fills.length) { const ls = logo.fills.map(lum); logo.onDark = ls.reduce((a, b) => a + b, 0) / ls.length > 0.5; } // true = light mark meant for dark grounds
  // og:image + manifest
  let ogFile = null;
  if (X.ogImage) { try { const { buf, type } = await fetchBuf(X.ogImage, X.finalUrl, 8e6); ogFile = `media/og-image.${extOf(X.ogImage, type, buf)}`; fs.writeFileSync(path.join(out, ogFile), buf); } catch (e) { warn('og:image fetch failed: ' + e.message); } }
  let manifest = null;
  if (X.manifest) { try { const j = JSON.parse((await fetchBuf(X.manifest, X.finalUrl, 1e6)).buf.toString()); manifest = { name: j.name, short_name: j.short_name, theme_color: j.theme_color, background_color: j.background_color }; } catch (e) { /* optional */ } }

  // ---------------------------------------------------------- pixels (board + palette truth)
  const tool = await br.newPage({ width: 1920, height: 1000 });
  const shotUrls = screens.map((s) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(out, s.file)).toString('base64'));
  let px = [];
  try { px = (await tool.eval(`(${pagePixels})(${JSON.stringify(shotUrls)})`, { timeout: 60000 })).map((c) => ({ hex: rgb2hex(...c.rgb), share: c.share })); } catch (e) { warn('pixel analysis failed: ' + e.message); }

  // ---------------------------------------------------------- image hygiene (blank / nav screenshots) + imagery colours
  let imgStats = [];
  try {
    const items = [...screens, ...mediaOut].map((m) => ({ file: m.file, url: 'data:image/jpeg;base64,' + fs.readFileSync(path.join(out, m.file)).toString('base64') }));
    imgStats = await tool.eval(`(${pageImageStats})(${JSON.stringify(items)})`, { timeout: 90000 });
  } catch (e) { warn('image analysis failed: ' + e.message); }
  const stat = new Map(imgStats.map((x) => [x.file, x]));
  const mediaDropped = [], mediaFlagged = [];
  {
    const keep = [];
    for (const m of mediaOut) {
      const st = stat.get(m.file);
      if (st && st.std < 3) { mediaDropped.push({ capturedAs: m.file, kind: m.kind, w: m.w, h: m.h, src: m.src, reason: `blank (pixel std-dev ${st.std})` }); warn(`dropped a blank ${m.kind} ${m.w}x${m.h} (captured as ${m.file}, pixel std-dev ${st.std}); media/ is renumbered`); try { fs.unlinkSync(path.join(out, m.file)); } catch {} stat.delete(m.file); }
      else keep.push({ m, st });
    }
    mediaOut.length = 0;
    keep.forEach(({ m, st }, i) => {          // renumber so media/ stays contiguous (new index <= old index, ascending: no collisions)
      const nf = `media/${String(i + 1).padStart(2, '0')}.jpg`;
      if (nf !== m.file) { fs.renameSync(path.join(out, m.file), path.join(out, nf)); stat.delete(m.file); if (st) stat.set(nf, { ...st, file: nf }); m.file = nf; }
      mediaOut.push(m);
    });
    for (const m of mediaOut) { const st = stat.get(m.file); if (st && st.std < 8 && st.mean < 40) { m.flag = `near-blank dark image (pixel std-dev ${st.std}, mean luma ${st.mean}): background art, not product media`; warn(`${m.file}: ${m.flag}`); } }
    const scr = screens.map((x) => stat.get(x.file)).filter(Boolean);
    // nav match: horizontal luma profile of the top 8% (rows averaged, so a few px of vertical offset or a top banner do not matter)
    const profile = (st) => Array.from({ length: 96 }, (_, c) => { let t = 0; for (let r = 0; r < 8; r++) t += st.strip[r * 96 + c]; return t / 8; });
    const sd = (a) => { const mu = a.reduce((p, q) => p + q, 0) / a.length; return Math.sqrt(a.reduce((p, q) => p + (q - mu) ** 2, 0) / a.length); };
    for (const m of mediaOut) {
      const st = stat.get(m.file); if (!st || m.flag || st.w < 0.8 * 1920) continue;     // the nav spans the full page width
      const a = profile(st), sa = sd(a); if (sa < 2.5) continue;
      for (const sc of scr) {
        const b = profile(sc), sb = sd(b); if (sb < 2.5) continue;
        const ma = a.reduce((p, q) => p + q, 0) / a.length, mb = b.reduce((p, q) => p + q, 0) / b.length;
        const corr = a.reduce((p, q, i) => p + (q - ma) * (b[i] - mb), 0) / (a.length * sa * sb);
        if (corr > 0.85) { m.flag = 'screenshot, not product media'; m.matchesScreen = sc.file; mediaFlagged.push(m.file); warn(`${m.file} contains the site nav (top 8% profile matches ${sc.file}, r=${corr.toFixed(2)}): screenshot, not product media`); break; }
      }
    }
  }
  // saturated dominant colours of the imagery (product media 1.0, page screenshots 0.7; blank/nav shots skipped)
  const imgAc = [];
  for (const f of [...screens.map((x) => [x.file, 0.7]), ...mediaOut.filter((m) => !m.flag).map((x) => [x.file, 1.0])]) {
    const st = stat.get(f[0]); if (!st) continue;
    for (const c of st.sat) {
      if (c.n < 6) continue; const hex = rgb2hex(...c.rgb);
      if (dist(hex, '#000000') < 60 || dist(hex, '#ffffff') < 60) continue;
      const hit = imgAc.find((x) => dist(x.hex, hex) < 40);
      const sc = c.share * f[1];
      if (hit) { hit.w += sc; if (sc > hit.best) { hit.best = sc; hit.file = f[0]; hit.share = c.share; } } else imgAc.push({ hex, w: sc, best: sc, file: f[0], share: c.share });
    }
  }
  imgAc.sort((a, b) => b.w - a.w);

  // ---------------------------------------------------------- colour roles
  const bgTot = X.bgW.reduce((s, [, w]) => s + w, 0) || 1, pxTot = px.reduce((s, c) => s + c.share, 0) || 1;
  const groundCands = [...X.bgW.map(([hex, w]) => ({ hex, w: (w / bgTot) * 0.5, src: ['dom'] })), ...px.map((c) => ({ hex: c.hex, w: (c.share / pxTot) * 0.5, src: ['pixels'] }))];
  const grounds = mergeColors(groundCands, 16).slice(0, 6);
  const primary = grounds[0] ? grounds[0].hex : '#ffffff';
  const groundOut = grounds.filter((g, i) => i === 0 || g.w > 0.05).slice(0, 3).map((g) => ({ hex: g.hex, share: +g.w.toFixed(3), sources: [...new Set(g.src)] }));
  const theme = contrast(primary, '#ffffff') > contrast(primary, '#000000') ? 'dark' : 'light';
  const txtTot = X.txtCol.reduce((s, [, w]) => s + w, 0) || 1;
  const textCl = mergeColors(X.txtCol.map(([hex, w]) => ({ hex, w: w / txtTot, src: ['text'] })), 14).filter((c) => contrast(c.hex, primary) >= 1.6);
  const topW = textCl.length ? textCl[0].w : 0;
  const inkPool = textCl.filter((c) => c.w >= topW * 0.25 && contrast(c.hex, primary) >= 3).sort((a, b) => contrast(b.hex, primary) - contrast(a.hex, primary));
  const bodyInk = inkPool[0] || textCl.filter((c) => contrast(c.hex, primary) >= 3)[0] || textCl[0] || { hex: theme === 'dark' ? '#ffffff' : '#000000', w: 0 };
  // ink = colour of the largest heading (headline / logo ink); body copy is "ink-soft"
  const hi = X.heroInk && X.heroInk.hex && contrast(X.heroInk.hex, primary) >= 3 ? X.heroInk : null;
  const ink = hi ? { hex: hi.hex, w: bodyInk.w } : bodyInk;
  const inkSource = hi ? `computed colour of the largest heading (${hi.source}${hi.text ? ' "' + hi.text + '"' : ''}, ${Math.round(hi.size)}px)` : 'most used text colour (no heading colour found)';
  const soft = textCl.find((c) => c.w >= topW * 0.4 && dist(c.hex, ink.hex) > 12 && contrast(c.hex, primary) >= 3 && !chromatic(c.hex)) || null;
  const muted = textCl.find((c) => !chromatic(c.hex) && dist(c.hex, ink.hex) > 20 && (!soft || dist(c.hex, soft.hex) > 14) && contrast(c.hex, primary) >= 2 && contrast(c.hex, primary) < contrast((soft || ink).hex, primary));
  const primaryCta = X.ctas.find((c) => c.inHero && c.filled && c.bg) || X.ctas.find((c) => c.filled && c.bg) || null;
  const ac = [];
  const add = (hex, w, src) => { if (hex) ac.push({ hex, w, src }); };
  if (primaryCta) add(primaryCta.bg, chromatic(primaryCta.bg) ? 100 : 30, 'CTA background');
  for (const c of X.ctas) if (c.filled && c.bg && chromatic(c.bg)) add(c.bg, 25, 'button');
  for (const v of X.cssVars) if (/(^|-)(brand|primary|accent)(-|$)/i.test(v.name) && !/text|bg|background|border|gray|grey|neutral|highlight|console|syntax|chart|code|shadow|ring|focus|selection/i.test(v.name)) add(v.hex, chromatic(v.hex) ? 60 : 5, 'css var ' + v.name);
  X.link.forEach(([hex, w], i) => { if (chromatic(hex) && hex !== '#0000ee') add(hex, i === 0 ? 45 : 15, 'link'); });
  for (const f of logo.fills) if (chromatic(f)) add(f, 55, 'logo');
  for (const [hex, w] of X.bgW) if (chromatic(hex)) add(hex, Math.min(40, (w / bgTot) * 400), 'background');
  for (const [hex, w] of X.txtCol) if (chromatic(hex)) add(hex, Math.min(30, (w / txtTot) * 120), 'text');
  for (const c of px) if (chromatic(c.hex)) add(c.hex, Math.min(60, c.share * 300), 'screenshot pixels');
  if (X.themeColorMeta) { const t = X.themeColorMeta; if (/^#[0-9a-f]{6}$/i.test(t) && chromatic(t.toLowerCase())) add(t.toLowerCase(), 20, 'meta theme-color'); }
  if (manifest && manifest.theme_color && /^#[0-9a-f]{6}$/i.test(manifest.theme_color) && chromatic(manifest.theme_color.toLowerCase())) add(manifest.theme_color.toLowerCase(), 20, 'manifest theme_color');
  const merged = mergeColors(ac.filter((a) => dist(a.hex, primary) > 30 && dist(a.hex, ink.hex) > 12 || a.src === 'CTA background'), 26);
  const corroborated = merged.filter((c) => c.src.some((x) => !/^css var/.test(x)));
  const accentsRaw = (corroborated.length ? corroborated : merged).filter((c) => c.w >= 10).slice(0, 4).map((c, i) => ({ hex: c.hex, role: i === 0 ? 'accent (primary)' : 'accent ' + (i + 1), score: Math.round(c.w), sources: [...new Set(c.src)] }));
  let accents = accentsRaw;
  const monochrome = !accents.some((a) => chromatic(a.hex) && a.score >= 25);
  if (monochrome) accents.forEach((a) => { if (!chromatic(a.hex)) a.role += ' [neutral]'; });
  if (!accents.length && primaryCta && primaryCta.bg) accents = [{ hex: primaryCta.bg, role: 'accent (neutral CTA colour)', score: 0, sources: ['CTA background'] }];
  const accentCandidates = imgAc.filter((c) => dist(c.hex, primary) > 40 && dist(c.hex, ink.hex) > 40).slice(0, 4).map((c) => ({ hex: c.hex, file: c.file, share: +c.share.toFixed(5), sharePct: +(c.share * 100).toFixed(2) }));
  const palette = [
    ...groundOut.map((g, i) => ({ hex: g.hex, role: i === 0 ? `ground (${theme} theme)` : `surface/ground ${i + 1}`, share: g.share })),
    { hex: ink.hex, role: hi ? 'ink (headline / logo ink)' : 'ink (main text)', contrast: +contrast(ink.hex, primary).toFixed(1) },
    ...(soft ? [{ hex: soft.hex, role: 'ink-soft (body copy)', contrast: +contrast(soft.hex, primary).toFixed(1) }] : []),
    ...(muted ? [{ hex: muted.hex, role: 'ink muted', contrast: +contrast(muted.hex, primary).toFixed(1) }] : []),
    ...accents.map((a) => ({ hex: a.hex, role: a.role, sources: a.sources })),
    ...(monochrome ? accentCandidates.map((a) => ({ hex: a.hex, role: 'accent candidate (from imagery)', sources: [`${a.file} ${a.sharePct}% of pixels`] })) : []),
  ];
  const seenH = new Set(); const paletteU = palette.filter((p) => !seenH.has(p.hex) && seenH.add(p.hex));

  // ---------------------------------------------------------- fonts
  const faces = X.faces.slice();
  for (const href of [...new Set(X.blocked)]) { // cross-origin stylesheets: parse @font-face from the css text
    try {
      const css = (await fetchBuf(href, X.finalUrl, 3e6)).buf.toString();
      for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
        const b = m[1], g = (p) => ((new RegExp(p + '\\s*:\\s*([^;]+)', 'i').exec(b)) || [])[1]; const urls = [];
        for (const u of (g('src') || '').matchAll(/url\(\s*(["']?)(.*?)\1\s*\)(?:\s*format\(\s*["']?([\w-]+)["']?\s*\))?/g)) { try { urls.push({ url: u[2].startsWith('data:') ? u[2] : new URL(u[2], href).href, format: u[3] || null }); } catch {} }
        faces.push({ family: (g('font-family') || '').trim().replace(/^["']|["']$/g, ''), weight: (g('font-weight') || '400').trim(), style: (g('font-style') || 'normal').trim(), range: (g('unicode-range') || null), urls });
      }
    } catch (e) { warn(`could not read stylesheet ${href}: ${e.message}`); }
  }
  const roles = { heading: X.fonts.h1 || X.fonts.h2, body: X.fonts.body, button: X.fonts.button, nav: X.fonts.nav };
  const want = new Map(); // family(norm) -> Set(weights)
  for (const f of Object.values(roles)) { if (!f) continue; const fam = firstFamily(f.family); if (!fam) continue; const k = normFam(fam); if (!want.has(k)) want.set(k, new Set()); want.get(k).add(wnum(f.weight)); }
  for (const [k, v] of X.fam.slice(0, 3).map(([fw]) => fw.split('|'))) { const nk = normFam(k); if (!want.has(nk)) want.set(nk, new Set()); want.get(nk).add(wnum(v)); }
  const pickUrl = (f) => (f.urls.find((u) => /woff2/i.test(u.format || u.url)) || f.urls.find((u) => /woff|ttf|otf|truetype|opentype/i.test((u.format || '') + u.url)) || f.urls[0] || {}).url;
  const latin = (f) => !f.range || /U\+0(000|020)|U\+00[0-9a-f]{2}-/i.test(f.range) || /U\+0000-00FF/i.test(f.range);
  const chosen = new Map();
  for (const f of faces) {
    const k = normFam(f.family); const u = pickUrl(f); if (!u) continue;
    const used = [...fontReqs.keys()].includes(u);
    const w = want.get(k);
    if (w && latin(f) && ([...w].some((x) => wcover(f.weight, x) < 1) || used)) chosen.set(u, { ...f, url: u, used });
    else if (used && !chosen.has(u)) chosen.set(u, { ...f, url: u, used });
  }
  for (const [u, mime] of fontReqs) if (!chosen.has(u) && chosen.size < 14) chosen.set(u, { family: null, weight: '400', style: 'normal', url: u, used: true, mime });
  const fontFiles = []; let fi = 0;
  for (const f of [...chosen.values()].slice(0, 14)) {
    try {
      const { buf, type } = await fetchBuf(f.url, X.finalUrl, 6e6); const ext = extOf(f.url, type, buf); if (!['woff2', 'woff', 'ttf', 'otf'].includes(ext)) throw new Error('not a font (' + type + ')');
      const name = `${slug(f.family || path.basename(f.url.split('?')[0]).replace(/\.[a-z0-9]+$/i, ''))}-${slug(String(f.weight))}${/italic|oblique/.test(f.style) ? '-italic' : ''}${fi++ ? '' : ''}.${ext}`;
      let fn = name, n = 1; while (fs.existsSync(path.join(out, 'fonts', fn))) fn = name.replace(/(\.[a-z0-9]+)$/, `-${++n}$1`);
      fs.writeFileSync(path.join(out, 'fonts', fn), buf); fontFiles.push({ family: f.family, weight: f.weight, style: f.style, url: f.url.startsWith('data:') ? 'data-uri' : f.url, file: `fonts/${fn}`, bytes: buf.length, used: f.used, range: f.range });
    } catch (e) { warn(`font download failed (${f.url.slice(0, 80)}): ${e.message}`); }
  }
  // platform fonts actually used at h1/body (CDP)
  const platform = {};
  try {
    await page.send('DOM.enable'); await page.send('CSS.enable'); const doc = await page.send('DOM.getDocument', { depth: 0 });
    for (const [k, sel] of [['h1', 'h1'], ['body', 'p']]) { try { const n = await page.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); if (!n.nodeId) continue; const pf = await page.send('CSS.getPlatformFontsForNode', { nodeId: n.nodeId }); platform[k] = pf.fonts.map((f) => ({ family: f.familyName, custom: f.isCustomFont, glyphs: f.glyphCount })); } catch {} }
  } catch {}
  const matchFile = (fontRole) => {
    if (!fontRole) return null; const fam = firstFamily(fontRole.family); if (!fam) return null; const k = normFam(fam), w = wnum(fontRole.weight);
    const it = /italic|oblique/.test(fontRole.style || ''); const c = fontFiles.filter((f) => f.family && normFam(f.family) === k && /^woff2?$|ttf|otf/.test(f.file.split('.').pop()) && (!f.range || latin(f)) && /italic|oblique/.test(f.style || '') === it); if (!c.length) return null;
    return c.sort((a, b) => wcover(a.weight, w) - wcover(b.weight, w) || (/woff2$/.test(a.file) ? -1 : 1))[0];
  };
  const fontsOut = {};
  for (const [role, f] of Object.entries(roles)) if (f) { const m = matchFile(f); fontsOut[role] = { ...f, primaryFamily: firstFamily(f.family) || f.family.split(',')[0].replace(/["']/g, '').trim(), file: m ? m.file : null, fileWeight: m ? m.weight : null }; }
  for (const r of ['heading', 'body']) if (fontsOut[r] && !fontsOut[r].file) warn(`${r} font "${fontsOut[r].primaryFamily}" has no downloadable file (system font or blocked)`);

  // ---------------------------------------------------------- brand.json
  const brand = {
    url: startUrl, finalUrl: X.finalUrl, capturedAt: new Date().toISOString(), viewport: { w: 1920, h: 1080 }, docHeight: docH,
    name: X.name, title: X.title, description: X.description, tagline: (X.h1[0] ? (X.h1[0].length <= 140 ? X.h1[0] : (X.h1[0].match(/^.{12,140}?[.!?](?=\s|$)/) || [null])[0]) : null) || (!X.h1.length ? X.heroLine : null) || (X.description || '').split(/(?<=[.!?])\s/)[0] || null,
    lang: X.lang, themeColorMeta: X.themeColorMeta, colorSchemeMeta: X.colorScheme, manifest,
    copy: { h1: X.h1, h2: X.h2, h3: X.h3, heroLine: X.heroLine, ctas: X.ctas, nav: X.nav, sentences: X.sentences },
    colors: { theme, monochrome, ground: groundOut, ink: { hex: ink.hex, contrastOnGround: +contrast(ink.hex, primary).toFixed(2), source: inkSource }, inkSoft: soft ? { hex: soft.hex, contrastOnGround: +contrast(soft.hex, primary).toFixed(2), note: 'body copy' } : null, accentCandidates: { note: monochrome ? 'no CSS/DOM accent: saturated dominant colours sampled from screens/ and media/ imagery' : 'saturated colours sampled from imagery (a CSS/DOM accent exists, these are extra)', items: accentCandidates }, inkMuted: muted ? { hex: muted.hex, contrastOnGround: +contrast(muted.hex, primary).toFixed(2) } : null, accents, ctaBg: primaryCta ? primaryCta.bg : null, link: (X.link.find(([h]) => h !== '#0000ee') || [null])[0], palette: paletteU, pixelPalette: px.slice(0, 10).map((c) => ({ hex: c.hex, share: +c.share.toFixed(3) })), domBackgrounds: X.bgW.slice(0, 10).map(([hex, w]) => ({ hex, share: +(w / bgTot).toFixed(3) })), textColors: X.txtCol.slice(0, 8).map(([hex, w]) => ({ hex, share: +(w / txtTot).toFixed(3) })), cssVars: X.cssVars.slice(0, 60) },
    fonts: { roles: fontsOut, faces: fontFiles, loadedByPage: X.loaded, mostUsed: X.fam.map(([k, w]) => ({ key: k, weight: Math.round(w) })), platformFonts: platform },
    logo, ogImage: ogFile, screens, media: mediaOut, mediaDropped, warnings,
  };
  fs.writeFileSync(path.join(out, 'brand.json'), JSON.stringify(brand, null, 1));

  writeBrandReport({ brand, X, startUrl, theme, monochrome, paletteU, accentCandidates, fontsOut, fontFiles, logo, screens, mediaOut, mediaDropped, ogFile, warnings, out });

  // ---------------------------------------------------------- board.png
  await makeBoard(tool, brand, fontsOut, { out, contrast, sleep });
  console.log(JSON.stringify({ out, name: brand.name, theme, ground: groundOut[0].hex, ink: ink.hex, inkSoft: soft ? soft.hex : null, accents: accents.map((a) => a.hex), accentCandidates: accentCandidates.map((a) => `${a.hex} (${a.file})`), mediaDropped: mediaDropped.map((m) => `${m.kind} ${m.w}x${m.h} (was ${m.capturedAs})`), mediaFlagged, fonts: Object.fromEntries(Object.entries(fontsOut).map(([k, v]) => [k, v.primaryFamily + (v.file ? '' : ' (no file)')])), logo: logo.file, screens: screens.length, media: mediaOut.length, fontFiles: fontFiles.length, warnings: warnings.length }, null, 1));
}
