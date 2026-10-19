// add-font.mjs: vendor a Google Fonts family into the film, so no frame depends on the network.
// Run from the film folder.
//
//   node scripts/add-font.mjs "Inter" [--weights 400,600,700] [--italic]
//   node scripts/add-font.mjs "Karantina" --weights 400,700        Hebrew and Latin subsets both come down
//
// Writes every returned font as assets/fonts/<slug>-<n>.<extension> and assets/fonts/<slug>.css with @font-face rules
// (font-display: block) pointing at them. Add <link rel="stylesheet" href="assets/fonts/<slug>.css"> to index.html.
// Requests discrete weight styles, not a continuous variable-axis range (old header promised a whole range).
// Google Fonts range syntax uses two dots: https://developers.google.com/fonts/docs/css2
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const family = args.find((a) => !a.startsWith('--'))
if (!family) { console.error('usage: node scripts/add-font.mjs "<Family Name>" [--weights 400,700] [--italic]'); process.exit(1) }
const weights = (args.includes('--weights') ? args[args.indexOf('--weights') + 1] : '400,700').split(',').map(Number).sort((a, b) => a - b)
const italic = args.includes('--italic')
const axis = italic ? `ital,wght@${[0, 1].flatMap((i) => weights.map((w) => `${i},${w}`)).join(';')}` : `wght@${weights.join(';')}`
const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${axis}&display=block`
// Identify this helper honestly; vendor the font format returned by the API.
const UA = 'agent-skills/add-font'

const res = await fetch(url, { headers: { 'User-Agent': UA } })
if (!res.ok) {
  console.error(`add-font: Google Fonts returned ${res.status} for "${family}" at weights ${weights.join(',')}. Check the exact family name and which weights it has on fonts.google.com.`)
  process.exit(1)
}
let css = await res.text()
const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const dir = path.join(process.cwd(), 'assets', 'fonts')
fs.mkdirSync(dir, { recursive: true })
const files = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))]
for (const [i, u] of files.entries()) {
  const name = `${slug}-${i}${path.extname(new URL(u).pathname)}`
  const r = await fetch(u)
  if (!r.ok) { console.error(`add-font: could not download ${u}`); process.exit(1) }
  fs.writeFileSync(path.join(dir, name), Buffer.from(await r.arrayBuffer()))
  css = css.split(u).join(name)
}
fs.writeFileSync(path.join(dir, `${slug}.css`), `/* ${family} from Google Fonts (check its licence on fonts.google.com; most are OFL) */\n${css}`)
const subsets = [...css.matchAll(/\/\* ([\w-]+) \*\//g)].map((m) => m[1])
console.log(`wrote assets/fonts/${slug}.css and ${files.length} font files (${[...new Set(subsets)].join(', ') || 'one subset'})`)
console.log(`add to index.html: <link rel="stylesheet" href="assets/fonts/${slug}.css">  then font-family: '${family}'`)
