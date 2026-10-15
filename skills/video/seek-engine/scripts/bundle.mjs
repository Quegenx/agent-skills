// bundle.mjs: turn a page that imports modules (three.js, its addons, your own files) into one self-contained
// page. Pages render from file://, where Chromium blocks module imports, and three.js now ships only as ES
// modules; an inline module has nothing to fetch, so it runs.
//
//   npm i three esbuild                              once per film that needs them
//   node scripts/bundle.mjs src.html index.html      every <script type="module" src="..."> in src.html is
//                                                    bundled (imports resolved, minified) and inlined
//
// Write the film in src.html + src/*.js with normal imports (import * as THREE from 'three'), keep the seek(t)
// contract, then bundle before previewing or rendering. Re-run after every edit.
import fs from 'node:fs'
import path from 'node:path'

const [srcHtml, outHtml = 'index.html'] = process.argv.slice(2)
if (!srcHtml) { console.error('usage: node scripts/bundle.mjs src.html [index.html]'); process.exit(1) }
let esbuild
try { esbuild = await import('esbuild') } catch { console.error('bundle: esbuild is missing. Run: npm i esbuild'); process.exit(1) }

const base = path.dirname(path.resolve(srcHtml))
let html = fs.readFileSync(srcHtml, 'utf8')
const tags = [...html.matchAll(/<script\s+type=["']module["']\s+src=["']([^"']+)["']\s*>\s*<\/script>/g)]
if (!tags.length) { console.error(`bundle: no <script type="module" src="..."> in ${srcHtml}`); process.exit(1) }
for (const [tag, src] of tags) {
  const res = await esbuild.build({ entryPoints: [path.resolve(base, src)], bundle: true, format: 'esm', minify: true, write: false, target: 'es2022', legalComments: 'none', logLevel: 'warning' })
  const js = res.outputFiles[0].text.replace(/<\/script/g, '<\\/script')
  html = html.replace(tag, () => `<script type="module">\n${js}</script>`)
  console.log(`bundled ${src} (${(js.length / 1024).toFixed(0)} KB)`)
}
fs.writeFileSync(outHtml, html)
console.log(`wrote ${outHtml}`)
