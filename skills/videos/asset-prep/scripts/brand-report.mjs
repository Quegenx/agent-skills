// Brand report and board from brand.mjs, Apache-2.0; see LICENSE-motionmaxxing.txt.
import fs from 'node:fs';
import path from 'node:path';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cut = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '\u2026' : s; };

export function writeBrandReport({ brand, X, startUrl, theme, monochrome, paletteU, accentCandidates, fontsOut, fontFiles, logo, screens, mediaOut, mediaDropped, ogFile, warnings, out }) {
  // ---------------------------------------------------------- BRAND.md
  const L = [];
  L.push(`# ${brand.name || X.title || startUrl}`, '', `Source: ${X.finalUrl}  |  captured ${brand.capturedAt.slice(0, 10)}  |  theme: **${theme}**${monochrome ? ' (monochrome brand)' : ''}`, '');
  if (brand.tagline) L.push(`Tagline / hero: **${brand.tagline}**`, '');
  if (X.description) L.push(`Description: ${X.description}`, '');
  L.push('## Palette', '', '| hex | role | notes |', '|---|---|---|');
  for (const p of paletteU) L.push(`| \`${p.hex}\` | ${p.role} | ${p.share ? Math.round(p.share * 100) + '% of area' : p.contrast ? 'contrast ' + p.contrast + ':1 on ground' : (p.sources || []).join(', ')} |`);
  if (accentCandidates.length) L.push('', `Accent candidates (from imagery)${monochrome ? ' - the site has no CSS accent' : ''}: ` + accentCandidates.map((a) => `\`${a.hex}\` from ${a.file} (${a.sharePct}% of pixels)`).join(', '));
  if (X.cssVars.length) L.push('', 'Brand CSS variables: ' + X.cssVars.filter((v) => /brand|primary|accent|bg|background|text|fg/i.test(v.name)).slice(0, 10).map((v) => `${v.name}=${v.hex}`).join(', '));
  L.push('', '## Fonts', '');
  for (const [role, f] of Object.entries(fontsOut)) L.push(`- ${role}: **${f.primaryFamily || f.family}** weight ${f.weight}, ${f.size}${f.letterSpacing && f.letterSpacing !== 'normal' ? ', tracking ' + f.letterSpacing : ''}${f.file ? ` -> \`${f.file}\`` : ' (no file: system/fallback)'}`);
  if (fontFiles.length) L.push('', 'Downloaded: ' + fontFiles.map((f) => f.file).join(', '));
  L.push('', '## Logo', '', logo.file ? `- \`${logo.file}\` (${logo.source})${logo.fills.length ? ` fills: ${logo.fills.join(', ')}${logo.onDark ? ' (light mark: place on dark ground)' : ' (dark mark: place on light ground)'}` : ''}` : `- none found${X.textLogo ? `; text wordmark "${X.textLogo.text}" set in ${X.textLogo.font}` : ''}`);
  if (logo.favicon) L.push(`- favicon: \`${logo.favicon}\``); if (logo.appIcon) L.push(`- app icon: \`${logo.appIcon}\``);
  L.push('', '## Copy', '');
  if (X.h1.length) L.push('H1: ' + X.h1.map((t) => `"${t}"`).join(' / '));
  if (X.heroLine && !X.h1.includes(X.heroLine)) L.push(`Hero line: "${X.heroLine}"`);
  if (X.h2.length) L.push('', 'H2:', ...X.h2.map((t) => `- ${t}`));
  L.push('', 'CTAs: ' + (X.ctas.map((c) => `"${c.text}"${c.bg ? ` (${c.bg})` : ''}`).join(', ') || 'none found'), '', 'Nav: ' + (X.nav.join(' | ') || 'none'));
  if (X.sentences.length) L.push('', 'Product sentences:', ...X.sentences.map((t) => `- ${t}`));
  L.push('', '## Assets', '', ...screens.map((s) => `- ${s.file} (scroll ${s.scrollY}px)`), ...mediaOut.map((m) => `- ${m.file}: ${m.kind} ${m.w}x${m.h}${m.alt ? ' "' + m.alt + '"' : ''}${m.flag ? ' **FLAG: ' + m.flag + '**' : ''}`), ...mediaDropped.map((m) => `- (dropped ${m.kind} ${m.w}x${m.h}, ${m.reason}; was captured as ${m.capturedAs}, media/ renumbered)`), ...(ogFile ? [`- ${ogFile} (og:image)`] : []), '- board.png (one-image overview)');
  if (warnings.length) L.push('', '## Warnings', '', ...warnings.map((w) => `- ${w}`));
  fs.writeFileSync(path.join(out, 'BRAND.md'), L.join('\n') + '\n');
}

export async function makeBoard(tool, B, fontsOut, { out, contrast, sleep }) {
  const b64 = (f) => fs.readFileSync(path.join(out, f)).toString('base64');
  const C = B.colors, g0 = C.ground[0].hex, ink = C.ink.hex, line = ink + '2e';
  const mime = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
  let faceCss = '', hFam = 'system-ui,sans-serif', bFam = 'system-ui,sans-serif';
  const emb = (role, alias) => { const f = fontsOut[role]; if (!f || !f.file) return null; const ff = B.fonts.faces.find((x) => x.file === f.file); faceCss += `@font-face{font-family:"${alias}";src:url(data:${mime[f.file.split('.').pop()]};base64,${b64(f.file)});font-weight:${ff && /^\d+( \d+)?$/.test(String(ff.weight)) ? ff.weight : '100 900'};font-style:normal}`; return `"${alias}"`; };
  const hE = emb('heading', 'BrandH'); if (hE) hFam = hE + ',system-ui,sans-serif'; else if (fontsOut.heading) hFam = fontsOut.heading.family;
  const bE = emb('body', 'BrandB'); if (bE) bFam = bE + ',system-ui,sans-serif'; else if (fontsOut.body) bFam = fontsOut.body.family;
  const sw = B.colors.palette.slice(0, 6).map((p) => { const t = contrast(p.hex, '#000000') > contrast(p.hex, '#ffffff') ? '#000000' : '#ffffff'; return `<div class="sw" style="background:${p.hex};color:${t}"><b>${p.hex}</b><span>${esc(p.role)}</span></div>`; }).join('');
  const tileBg = B.logo.onDark === true ? '#111' : B.logo.onDark === false ? '#f2f2f2' : g0;
  const logoHtml = B.logo.file ? `<img src="data:${B.logo.file.endsWith('.svg') ? 'image/svg+xml' : B.logo.file.endsWith('.png') ? 'image/png' : B.logo.file.endsWith('.webp') ? 'image/webp' : 'image/jpeg'};base64,${b64(B.logo.file)}" style="width:340px;height:170px;object-fit:contain">` : `<div style="font:700 56px ${hFam}">${esc(B.name)}</div>`;
  const pickShots = [0, 1, 2, 3].map((i) => B.screens[Math.min(B.screens.length - 1, Math.round((i * (B.screens.length - 1)) / 3))]).filter(Boolean);
  const shots = pickShots.map((s) => `<img src="data:image/jpeg;base64,${b64(s.file)}">`).join('');
  const ctas = B.copy.ctas.slice(0, 5).map((c) => `<span class="chip" style="${c.bg ? `background:${c.bg};color:${c.color || ink};border-color:${c.bg}` : ''}">${esc(c.text)}</span>`).join('');
  const hf = fontsOut.heading, bf = fontsOut.body;
  const html = `<!doctype html><meta charset=utf-8><style>${faceCss}
*{box-sizing:border-box;margin:0}body{width:1920px;height:1000px;background:${g0};color:${ink};font:16px ${bFam};overflow:hidden}
.board{display:grid;grid-template-columns:420px 1fr 800px;grid-template-rows:330px 290px 254px;gap:22px;padding:34px;height:100%}
.p{border:1px solid ${line};border-radius:14px;padding:22px;overflow:hidden;position:relative}
.lab{position:absolute;top:8px;left:14px;font:600 11px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.5}
.logo{display:flex;align-items:center;justify-content:center;background:${tileBg}}.logo .lab{color:#888;opacity:1}
h1{font:${hf ? hf.weight : 600} 50px/1.08 ${hFam};letter-spacing:-.01em;margin-top:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.sub{margin-top:14px;font-size:19px;line-height:1.4;opacity:.75;max-width:880px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.meta{margin-top:16px;font:13px ui-monospace,monospace;opacity:.6}
.pal{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:10px;padding:14px}.sw{border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid ${line}}.sw b{font:700 18px ui-monospace,monospace}.sw span{font-size:12px;opacity:.85;margin-top:3px}
.spec{display:grid;grid-template-columns:260px 1fr;gap:20px}.big{font:${hf ? hf.weight : 600} 150px/1 ${hFam};letter-spacing:-.02em}.h2{font:${hf ? hf.weight : 600} 34px/1.15 ${hFam};margin-bottom:12px}.bd{font:${bf ? bf.weight : 400} 18px/1.45 ${bFam};opacity:.85;max-width:640px}
.fn{font:12px ui-monospace,monospace;opacity:.6;margin-top:10px;line-height:1.5}
.copy .t{font-size:15px;line-height:1.4;margin-top:8px}.copy .t b{opacity:.55;font:600 11px ui-monospace,monospace;letter-spacing:.1em;margin-right:6px}
.chip{display:inline-block;margin:6px 8px 0 0;padding:7px 14px;border-radius:9px;border:1px solid ${line};font:600 14px ${bFam}}
.shots{grid-column:1/4;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:0;border:0}.shots img{width:100%;height:100%;object-fit:cover;border-radius:12px;border:1px solid ${line}}
</style><div class=board>
<div class="p logo"><div class=lab>logo${B.logo.file ? '' : ' (none found: text)'}</div>${logoHtml}</div>
<div class=p><div class=lab>identity</div><h1>${esc(B.tagline || B.name)}</h1><div class=sub>${esc(cut(B.description || B.copy.sentences[0] || '', 200))}</div><div class=meta>${esc(B.name)} &middot; ${esc(new URL(B.finalUrl).host)} &middot; ${C.theme} theme${C.monochrome ? ' &middot; monochrome' : ''}</div></div>
<div class="p pal"><div class=lab>palette</div>${sw}</div>
<div class="p spec" style="grid-column:1/3"><div class=lab>type</div><div class=big>Aa</div><div><div class=h2>${esc(cut(B.copy.h2[0] || 'The quick brown fox jumps over the lazy dog', 60))}</div><div class=bd>${esc(cut(B.copy.sentences[0] || 'Sphinx of black quartz, judge my vow. 0123456789', 200))}</div><div class=fn>heading: ${esc(hf ? hf.primaryFamily : '-')} ${hf ? hf.weight : ''} ${hf && hf.file ? '' : '(not downloaded: showing fallback)'}<br>body: ${esc(bf ? bf.primaryFamily : '-')} ${bf ? bf.weight : ''} ${bf && bf.file ? '' : '(not downloaded: showing fallback)'}</div></div></div>
<div class="p copy"><div class=lab>copy</div><div class=t><b>H1</b>${esc(cut(B.copy.h1[0] || B.copy.heroLine || '-', 130))}</div><div class=t><b>H2</b>${esc(cut(B.copy.h2.slice(0, 2).join('  /  '), 170) || '-')}</div><div class=t><b>NAV</b>${esc(B.copy.nav.slice(0, 7).join(' | '))}</div><div>${ctas}</div></div>
<div class="p shots">${shots}</div></div>`;
  const ft = await tool.send('Page.getFrameTree');
  await tool.send('Page.setDocumentContent', { frameId: ft.frameTree.frame.id, html });
  await tool.eval('document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>0)))).then(()=>true)', { timeout: 30000 });
  await sleep(150);
  fs.writeFileSync(path.join(out, 'board.png'), await tool.shot({ format: 'png' }));
}
