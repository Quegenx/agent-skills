// capture.mjs: the product's screens from its live site, so the film never invents a UI. Run from the film folder.
//
//   node scripts/capture.mjs https://example.com [https://example.com/pricing ...] [--sizes 1440x900,390x844] [--dark]
//
// For each URL and size: a viewport screenshot and a full-page screenshot in assets/screens/ (2x pixels): every page the
// story needs, the mobile view and dark mode. The brand itself (colours by role, fonts, logo, copy, the board) is brand.mjs.
// List what was found before animating anything, and stop to ask when a needed screen is missing.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const args = process.argv.slice(2)
const urls = args.filter((a) => /^https?:\/\//.test(a))
const sizesArg = args.includes('--sizes') ? args[args.indexOf('--sizes') + 1] : '1440x900,390x844'
const sizes = sizesArg.split(',').map((s) => s.split('x').map(Number))
if (!urls.length) { console.error('usage: node scripts/capture.mjs <url> [more urls] [--sizes 1440x900,390x844] [--dark]'); process.exit(1) }

const out = path.join(process.cwd(), 'assets', 'screens')
fs.mkdirSync(out, { recursive: true })
const slug = (u) => new URL(u).pathname.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-/, '') || 'home'
const screenUrls = new Map()
const browser = await chromium.launch()
for (const url of urls) {
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: args.includes('--dark') ? 'dark' : 'light' })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForLoadState('load'))
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(800) // let entrance animations on the site settle before the shot
    const originalBase = `${slug(url)}-${w}x${h}`
    const previousUrl = screenUrls.get(originalBase)
    const base = previousUrl && previousUrl !== url ? `${originalBase}-${createHash('sha256').update(url).digest('hex')}` : originalBase
    screenUrls.set(originalBase, previousUrl || url)
    await page.screenshot({ path: path.join(out, `${base}.png`) })
    await page.screenshot({ path: path.join(out, `${base}-full.png`), fullPage: true })
    console.log(`wrote assets/screens/${base}.png and ${base}-full.png`)
    await page.close()
  }
}
await browser.close()
