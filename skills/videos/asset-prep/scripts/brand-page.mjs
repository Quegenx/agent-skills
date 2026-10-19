// Browser probes from brand.mjs, Apache-2.0; see LICENSE-motionmaxxing.txt. Serialized functions keep their own page dependencies.
// ====================================================================== in-page functions (serialised into the page)
export function pageDismiss() {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const txt = (e) => (e.innerText || e.value || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const accept = /^(accept( all)?( cookies)?|allow( all)?( cookies)?|i (agree|accept)|agree|got it|ok(ay)?|continue|accept (&|and) close|yes,? i agree|understood|allow all|accept all cookies|agree (&|and) continue)$/;
  const ctr = '[id*=cookie i],[class*=cookie i],[id*=consent i],[class*=consent i],[class*=gdpr i],[id*=onetrust],[id*=usercentrics],[class*=cc-],[id*=cmp],[class*=cmp-],[aria-label*=cookie i],[aria-label*=consent i],[role=dialog],[aria-modal=true]';
  const direct = ['#onetrust-accept-btn-handler', '#truste-consent-button', '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', '#accept-all-cookies', '.cc-allow', '.cc-dismiss', '[data-testid="uc-accept-all-button"]', 'button[id*=accept][id*=cookie i]', 'button[class*=accept][class*=cookie i]'];
  let clicked = null;
  for (const s of direct) { const b = document.querySelector(s); if (b && vis(b)) { b.click(); clicked = s; break; } }
  if (!clicked) {
    for (const b of document.querySelectorAll('button,[role=button],a[role=button],a.button,a.btn,input[type=button],input[type=submit]')) {
      if (!vis(b)) continue;
      const t = txt(b);
      if (accept.test(t) && (b.closest(ctr) || /accept|allow|agree/.test(t) && /cookie/.test(t))) { b.click(); clicked = t; break; }
    }
  }
  for (const e of document.querySelectorAll(ctr)) {
    const p = getComputedStyle(e).position;
    if ((p === 'fixed' || p === 'sticky') && e.getBoundingClientRect().height < innerHeight * 0.9 || e.matches('[class*=cookie i],[id*=cookie i],[id*=onetrust],[id*=usercentrics]') && p === 'fixed') e.style.setProperty('display', 'none', 'important');
  }
  document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
  document.body && document.body.style.removeProperty('overflow');
  return clicked;
}

export async function pageScroll() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const step = Math.round(innerHeight * 0.7); let y = 0, n = 0;
  while (n++ < 70 && y < Math.min(document.documentElement.scrollHeight, 26000)) { scrollTo(0, y); await sleep(170); y += step; }
  await sleep(500); scrollTo(0, 0); await sleep(300);
  try { await document.fonts.ready; } catch (e) {}
  return Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
}

export function pageExtract() {
  const W = innerWidth, H = innerHeight, SY = scrollY;
  const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const txt = (e) => clean(e.innerText || e.textContent);
  const meta = (s) => { const m = document.querySelector(s); return m ? clean(m.getAttribute('content')) || null : null; };
  const cls = (e) => (e.getAttribute && e.getAttribute('class')) || '';
  const isVis = (e) => { try { return e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0; } catch (x) { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; } };
  const doc = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left + scrollX), y: Math.round(r.top + SY), w: Math.round(r.width), h: Math.round(r.height) }; };
  // --- colour parsing (any CSS colour -> #rrggbb + alpha) via canvas fallback
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const col = (s) => {
    if (!s) return null; if (cache.has(s)) return cache.get(s);
    let r = null;
    const m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/.exec(s);
    if (m) { let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]); r = { r: Math.round(m[1]), g: Math.round(m[2]), b: Math.round(m[3]), a }; }
    else if (s !== 'transparent' && s !== 'currentcolor' && s !== 'inherit' && s !== 'initial') {
      try { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#010203'; const before = cx.fillStyle; cx.fillStyle = s; if (cx.fillStyle !== before || /^#010203$/i.test(s)) { cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; r = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; } } catch (x) {}
    } else r = { r: 0, g: 0, b: 0, a: 0 };
    if (r) r.hex = '#' + [r.r, r.g, r.b].map((v) => v.toString(16).padStart(2, '0')).join('');
    cache.set(s, r); return r;
  };
  const colsIn = (s) => { const out = []; for (const m of (s || '').matchAll(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|(?:oklch|oklab|lab|lch|hsl|color)\([^)]*\))/gi)) { const c = col(m[1]); if (c && c.a > 0.3) out.push(c.hex); } return out; };

  // --- meta / names
  const title = clean(document.title);
  const nameMeta = meta('meta[property="og:site_name"]') || meta('meta[name="application-name"]') || meta('meta[name="apple-mobile-web-app-title"]');
  const titleParts = title.split(/\s+[|\u2013\u2014\u00b7:-]\s+|\s*[|\u00b7]\s*/).map(clean).filter((p) => p.length > 1 && !/^(home|welcome|homepage|official site|official website)$/i.test(p));
  const description = meta('meta[name="description"]') || meta('meta[property="og:description"]') || meta('meta[name="twitter:description"]');

  // --- headings, hero line, paragraphs
  const collapse = (t) => { const h = t.length >> 1, a = t.slice(0, h).trim(); return a.length > 3 && t.slice(h).trim() === a ? a : t; };
  const heads = (sel, max, maxLen) => { const seen = new Set(), o = []; for (const e of document.querySelectorAll(sel)) { if (!isVis(e)) continue; const t = collapse(txt(e)); if (t.length < 2 || t.length > maxLen || seen.has(t)) continue; seen.add(t); o.push(t); if (o.length >= max) break; } return o; };
  const h1 = heads('h1', 4, 220), h2 = heads('h2', 12, 160), h3 = heads('h3', 8, 120);
  let heroEl = null, heroSize = 0;
  const textEls = [];
  const all = [...document.querySelectorAll('body *')].slice(0, 9000);
  const fam = {};
  const txtCol = new Map();
  for (const e of all) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'TEMPLATE'].includes(e.tagName.toUpperCase())) continue;
    let own = ''; for (const n of e.childNodes) if (n.nodeType === 3) own += n.textContent; own = clean(own);
    if (own.length < 2) continue;
    if (!isVis(e)) continue;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(), fs = parseFloat(cs.fontSize) || 16;
    if (r.top + SY > docH) continue;
    const c = col(cs.color);
    const wgt = own.length * fs;
    if (c && c.a > 0.2) { const k = c.hex; const o = txtCol.get(k) || { w: 0, n: 0 }; o.w += wgt; o.n += own.length; txtCol.set(k, o); }
    const f = clean(cs.fontFamily.split(',')[0]).replace(/^["']|["']$/g, ''); const fk = f + '|' + cs.fontWeight; fam[fk] = (fam[fk] || 0) + wgt;
    if (r.top + SY < H * 1.6 && own.length >= 6 && own.length <= 160 && fs > heroSize && !e.closest('nav,header a,button,a')) { heroSize = fs; heroEl = e; }
  }
  const heroLine = heroEl ? clean(heroEl.innerText) : null;
  // headline ink: colour of the largest visible heading (h1, else the hero element), weighted by text length inside it
  let inkEl = null, inkSize = 0;
  for (const e of document.querySelectorAll('h1')) { if (!isVis(e)) continue; const f = parseFloat(getComputedStyle(e).fontSize) || 0; if (f > inkSize && clean(e.innerText).length > 1) { inkSize = f; inkEl = e; } }
  const inkSrc = inkEl ? 'h1' : (heroEl ? 'hero line' : null);
  if (!inkEl) inkEl = heroEl;
  let heroInk = null;
  if (inkEl) {
    const hist = {};
    for (const x of [inkEl, ...inkEl.querySelectorAll('*')]) {
      let own = ''; for (const n of x.childNodes) if (n.nodeType === 3) own += n.textContent; own = clean(own); if (!own.length) continue;
      const c = col(getComputedStyle(x).color); if (!c || c.a < 0.2) continue; hist[c.hex] = (hist[c.hex] || 0) + own.length;
    }
    const top = Object.entries(hist).sort((a, b) => b[1] - a[1])[0];
    const own = col(getComputedStyle(inkEl).color);
    heroInk = { hex: top ? top[0] : (own && own.a > 0.2 ? own.hex : null), size: inkSize || parseFloat(getComputedStyle(inkEl).fontSize) || 0, source: inkSrc, text: clean(inkEl.innerText).slice(0, 60), all: Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([h]) => h) };
    if (!heroInk.hex) heroInk = null;
  }
  const sentences = []; const seenS = new Set();
  for (const e of document.querySelectorAll('p, main li, [class*=description i], [class*=subtitle i], [class*=subhead i]')) {
    if (sentences.length >= 8) break;
    if (!isVis(e) || e.closest('footer,nav,header,[aria-hidden=true],[class*=cookie i],[id*=cookie i],[class*=consent i],[class*=mock i],form,button,a[href],code,pre')) continue;
    if (parseFloat(getComputedStyle(e).fontSize) < 15) continue;
    const t = collapse(txt(e)); if (t.length < 40 || t.length > 260 || t.split(' ').length < 7 || t === t.toUpperCase() || /cookie|©|all rights reserved|privacy policy|terms of/i.test(t)) continue;
    if (e.children.length > 3 || [...seenS].some((x) => x.includes(t) || t.includes(x))) continue;
    seenS.add(t); sentences.push(t);
  }

  // --- CTAs
  const isBtnCls = /(^|[\s_-])(btn|button|cta)([\s_-]|$)/i;
  const top0 = (r) => r.top + SY;
  const ctas = []; const ctaEls = [];
  for (const e of document.querySelectorAll('button, a, [role=button], input[type=submit], input[type=button]')) {
    if (!isVis(e)) continue;
    const t = collapse(clean(e.value || e.innerText || e.getAttribute('aria-label'))); if (t.length < 2 || t.length > 34 || t.split(' ').length > 6) continue;
    if (/cookie|consent|reject|decline|toggle menu|open menu|close|^menu$|^search$/i.test(t) || e.closest('[aria-hidden=true],[inert]') || parseFloat(getComputedStyle(e).fontSize) < 12) continue;
    const cs = getComputedStyle(e), bg = col(cs.backgroundColor), bc = col(cs.borderTopColor), r = e.getBoundingClientRect();
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), rad = parseFloat(cs.borderTopLeftRadius) || 0, bw = parseFloat(cs.borderTopWidth) || 0;
    const filled = !!bg && bg.a > 0.5;
    const like = e.tagName === 'BUTTON' || e.getAttribute('role') === 'button' || isBtnCls.test(cls(e)) || (filled && padX >= 14 && r.height >= 24) || (bw > 0 && rad >= 4 && padX >= 14 && r.height >= 24);
    if (!like) continue;
    if (e.tagName === 'BUTTON' && !filled && bw === 0 && !isBtnCls.test(cls(e)) && !e.closest('header,nav') && r.width < 90) continue;
    const top = r.top + SY;
    const verb = /^(get|start|try|book|sign|log|demo|contact|buy|join|download|request|talk|watch|learn|explore|see|view|install|create|schedule|apply|shop|subscribe|read|build|deploy|launch|open|use|begin|claim|order)/i.test(t);
    const border = bw > 0 && bc && bc.a > 0.3;
    if (!filled && !border && !verb && !isBtnCls.test(cls(e))) continue;
    if (e.tagName === 'BUTTON' && !filled && !border && e.closest('header,nav')) continue;
    if (!(top0(r) < H * 1.3) && !filled && !verb) continue;
    ctas.push({ text: t, verb, bg: filled ? bg.hex : null, color: (col(cs.color) || {}).hex || null, border: bw > 0 && bc && bc.a > 0.3 ? bc.hex : null, radius: Math.round(rad), filled, inHeader: !!e.closest('header,nav,[role=banner]'), inHero: top < H * 1.3, top: Math.round(top), w: Math.round(r.width), h: Math.round(r.height), _e: e });
  }
  const seenC = new Set(); const ctaOut = [];
  ctas.sort((a, b) => (b.inHero - a.inHero) || (b.filled - a.filled) || (b.verb - a.verb) || (a.top - b.top));
  for (const c of ctas) { const k = c.text.toLowerCase(); if (seenC.has(k)) continue; seenC.add(k); ctaEls.push(c._e); const { _e, verb, ...rest } = c; ctaOut.push(rest); if (ctaOut.length >= 12) break; }

  // --- nav
  const nav = []; const seenN = new Set(); const ctaSet = new Set(ctaOut.map((c) => c.text.toLowerCase()));
  for (const a of document.querySelectorAll('header a, nav a, [role=navigation] a, [role=banner] a, header button, nav button')) {
    if (!isVis(a)) continue; const r = a.getBoundingClientRect(); if (r.top + SY > 180) continue;
    const t = collapse(clean(a.innerText)); if (t.length < 2 || t.length > 26 || /^(menu|search|close|open|toggle)/i.test(t) || seenN.has(t.toLowerCase()) || ctaSet.has(t.toLowerCase())) continue;
    seenN.add(t.toLowerCase()); nav.push(t); if (nav.length >= 14) break;
  }

  // --- links colour
  const linkHist = {};
  for (const a of document.querySelectorAll('a[href]')) {
    if (!isVis(a) || a.closest('button,[role=button]') || isBtnCls.test(cls(a))) continue;
    const c = col(getComputedStyle(a).color); if (!c) continue;
    const w = (a.closest('p,li,article,main') ? 3 : 1) * Math.min(txt(a).length, 40); linkHist[c.hex] = (linkHist[c.hex] || 0) + w;
  }
  const link = Object.entries(linkHist).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // --- backgrounds (area weighted, minus opaque children)
  const infos = new Map();
  const consider = [document.documentElement, document.body, ...all];
  for (const e of consider) {
    if (!e || e.tagName === 'SCRIPT' || e.tagName === 'STYLE') continue;
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect(); let w = Math.min(r.right, W) - Math.max(r.left, 0), h = r.height;
    const isRoot = e === document.documentElement || e === document.body;
    if (isRoot) { w = W; h = docH; }
    if (w < 8 || h < 8) continue;
    const bg = col(cs.backgroundColor); const grad = cs.backgroundImage && cs.backgroundImage !== 'none' ? colsIn(cs.backgroundImage) : [];
    if ((!bg || bg.a < 0.04) && !grad.length) continue;
    infos.set(e, { bg: bg && bg.a >= 0.04 ? bg : null, grad, area: w * Math.min(h, docH), opaque: !!bg && bg.a > 0.9 });
  }
  const bgW = new Map();
  for (const [e, i] of infos) {
    let own = i.area; for (const c of e.children) { const ci = infos.get(c); if (ci && ci.opaque) own -= ci.area; }
    own = Math.max(own, 0);
    if (i.bg) bgW.set(i.bg.hex, (bgW.get(i.bg.hex) || 0) + own * i.bg.a);
    if (i.grad.length) for (const g of i.grad) bgW.set(g, (bgW.get(g) || 0) + own * 0.25 / i.grad.length);
  }

  // --- CSS variables, @font-face, blocked sheets
  const faces = [], blocked = [], varNames = new Set();
  const walk = (sheet, depth) => {
    let rules; try { rules = sheet.cssRules; } catch (x) { if (sheet.href) blocked.push(sheet.href); return; }
    const base = sheet.href || document.baseURI;
    for (const r of rules) {
      if (r.type === 3 && r.styleSheet && depth < 3) walk(r.styleSheet, depth + 1);
      else if (r.type === 5) {
        const s = r.style, src = s.getPropertyValue('src'); const urls = [];
        for (const m of src.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)(?:\s*format\(\s*["']?([\w-]+)["']?\s*\))?/g)) { try { urls.push({ url: m[2].startsWith('data:') ? m[2] : new URL(m[2], base).href, format: m[3] || null }); } catch (x) {} }
        faces.push({ family: clean(s.getPropertyValue('font-family')).replace(/^["']|["']$/g, ''), weight: s.getPropertyValue('font-weight') || '400', style: s.getPropertyValue('font-style') || 'normal', range: s.getPropertyValue('unicode-range') || null, urls });
      } else if (r.cssRules && r.cssRules.length && r.type !== 1) { for (const rr of r.cssRules) { if (rr.type === 5) walk({ cssRules: [rr], href: sheet.href }, depth + 1); } }
      else if (r.type === 1 && /^(:root|html|body|\*|:host)\b/.test(r.selectorText || '')) { for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) varNames.add(r.style[i]); }
    }
  };
  for (const s of document.styleSheets) walk(s, 0);
  const rootCs = getComputedStyle(document.documentElement); const cssVars = [];
  for (const n of varNames) {
    const v = rootCs.getPropertyValue(n).trim(); if (!v || v.length > 90 || /^[\d.]+(px|rem|em|%|s|ms)?$/.test(v)) continue;
    if (!/^(#|rgb|hsl|oklch|oklab|lab|lch|color\()/i.test(v)) continue;
    const c = col(v); if (c && c.a > 0.3) cssVars.push({ name: n, value: v, hex: c.hex });
  }

  // --- fonts per role
  const fontOf = (e) => { if (!e) return null; const cs = getComputedStyle(e); return { family: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize, style: cs.fontStyle, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, textTransform: cs.textTransform, color: (col(cs.color) || {}).hex }; };
  const q1 = (s) => [...document.querySelectorAll(s)].find(isVis) || null;
  const firstP = [...document.querySelectorAll('p')].find((p) => isVis(p) && txt(p).length > 40);
  const fonts = { h1: fontOf(q1('h1') || heroEl), h2: fontOf(q1('h2')), body: fontOf(firstP || document.body), button: fontOf(ctaEls[0]), nav: fontOf([...document.querySelectorAll('nav a, header a')].find(isVis)) };
  const loaded = [...document.fonts].map((f) => ({ family: clean(f.family).replace(/^["']|["']$/g, ''), weight: f.weight, style: f.style, status: f.status }));

  // --- logo
  const logoRe = /logo|brand|wordmark|logotype|site-title|navbar-brand|masthead/i;
  const badRe = /arrow|chevron|caret|menu|search|close|hamburger|burger|social|twitter|facebook|linkedin|github|youtube|instagram|tiktok|spinner|check|star|play|avatar|flag|payment|visa|mastercard/i;
  const attrs = (e) => [e.id, cls(e), e.getAttribute('aria-label'), e.getAttribute('alt'), e.getAttribute('title'), e.getAttribute('src'), e.getAttribute('data-testid'), e.getAttribute('name')].join(' ');
  const isHome = (a) => { try { const u = new URL(a.href, location.href); return u.origin === location.origin && (u.pathname === '/' || /^\/(index|home)(\.html?)?\/?$/i.test(u.pathname) || /^\/[a-z]{2}([-_][a-z]{2})?\/?$/i.test(u.pathname)); } catch (x) { return false; } };
  const STY = ['fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity', 'opacity', 'fill-rule', 'clip-rule', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'color'];
  const GFX = /^(svg|g|path|circle|rect|ellipse|line|polyline|polygon|text|tspan|use)$/i;
  const styled = (el) => {
    const c = el.cloneNode(true), o = [el, ...el.querySelectorAll('*')], n = [c, ...c.querySelectorAll('*')];
    o.forEach((e, i) => {
      const t = n[i]; if (!t.style) return; const cs = getComputedStyle(e);
      if (cs.display === 'none' && !/^(defs|symbol|clippath|mask|lineargradient|radialgradient|pattern|filter)$/i.test(e.tagName)) { t.setAttribute('display', 'none'); return; }
      if (GFX.test(e.tagName)) for (const p of STY) { const v = cs.getPropertyValue(p); if (v) t.style.setProperty(p, v); }
      if (e.tagName.toLowerCase() === 'text' || e.tagName.toLowerCase() === 'tspan') for (const p of ['font-family', 'font-size', 'font-weight', 'letter-spacing']) t.style.setProperty(p, cs.getPropertyValue(p));
      t.removeAttribute('class'); t.removeAttribute('data-testid');
      for (const a of [...t.attributes]) if (/^on/i.test(a.name)) t.removeAttribute(a.name);
    });
    return c;
  };
  const refIds = (clone) => { const ids = new Set(); for (const e of [clone, ...clone.querySelectorAll('*')]) { const blob = (e.getAttribute('style') || '') + ' ' + ['fill', 'stroke', 'clip-path', 'mask', 'filter'].map((a) => e.getAttribute(a) || '').join(' '); for (const m of blob.matchAll(/url\(\s*["']?#([^)"'\s]+)/g)) ids.add(m[1]); const h = e.getAttribute('href') || e.getAttribute('xlink:href'); if (h && h[0] === '#') ids.add(h.slice(1)); } return ids; };
  const withRefs = (clone) => { // pull in gradients / clipPaths / symbols that live outside the clone
    const have = new Set([...clone.querySelectorAll('[id]')].map((x) => x.id)); let defs = null;
    for (let round = 0; round < 6; round++) {
      const miss = [...refIds(clone)].filter((i) => !have.has(i)); if (!miss.length) break;
      for (const id of miss) { have.add(id); const t = document.getElementById(id); if (!t) continue; if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); clone.insertBefore(defs, clone.firstChild); } const rc = t.cloneNode(true); rc.querySelectorAll('[class]').forEach((x) => x.removeAttribute('class')); defs.appendChild(rc); }
    }
    return clone;
  };
  const svgString = (svg) => {
    const r = svg.getBoundingClientRect(); let c = withRefs(styled(svg));
    if (!c.getAttribute('viewBox')) { let vb = null; try { const b = svg.getBBox(); if (b.width && b.height) vb = [b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)).join(' '); } catch (x) {} c.setAttribute('viewBox', vb || `0 0 ${parseFloat(svg.getAttribute('width')) || r.width} ${parseFloat(svg.getAttribute('height')) || r.height}`); }
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    c.setAttribute('width', Math.round(r.width * 100) / 100); c.setAttribute('height', Math.round(r.height * 100) / 100);
    c.querySelectorAll('script').forEach((s) => s.remove());
    return new XMLSerializer().serializeToString(c);
  };
  const fillsOf = (svg) => { const s = new Set(); for (const e of svg.querySelectorAll('path,circle,rect,ellipse,polygon,polyline,text,use')) { const cs = getComputedStyle(e); if (e.tagName.toLowerCase() === 'use') { const h = (e.getAttribute('href') || e.getAttribute('xlink:href') || '').slice(1); const t = h && document.getElementById(h); if (t && (t.getAttribute('fill') === 'currentColor' || t.querySelector('[fill=currentColor],[stroke=currentColor]'))) { const c = col(cs.color); if (c && c.a > 0.3) s.add(c.hex); continue; } } for (const p of [cs.fill, cs.stroke]) { const c = col(p); if (c && c.a > 0.3) s.add(c.hex); } } const rc = col(getComputedStyle(svg).fill); if (!s.size && rc) s.add(rc.hex); return [...s]; };
  const groups = new Map();
  for (const e of document.querySelectorAll('svg, img, [class*=logo i], [id*=logo i], [class*=brand i]')) {
    const tag = e.tagName.toLowerCase();
    if (tag === 'svg' && e.closest('svg') !== e) continue;
    if (!isVis(e)) continue;
    const r = e.getBoundingClientRect(); const top = r.top + SY;
    let bgUrl = null;
    if (tag !== 'svg' && tag !== 'img') { const m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(e).backgroundImage || ''); if (!m || !logoRe.test(attrs(e))) continue; bgUrl = new URL(m[1], location.href).href; }
    if (r.width < 8 || r.height < 8) continue;
    let s = 0; const why = [];
    let anc = e; for (let i = 0; i < 4 && anc && anc !== document.body; i++) { if (logoRe.test(attrs(anc))) { s += 5; why.push('logo-attr'); break; } anc = anc.parentElement; }
    if (tag === 'svg') { const t = e.querySelector('title'); if (t && /logo/i.test(t.textContent)) { s += 4; why.push('svg-title'); } }
    const a = e.closest('a'); if (a && isHome(a)) { s += 4; why.push('home-link'); }
    if (e.closest('header,nav,[role=banner]')) { s += 3; why.push('header'); }
    if (top < 160) { s += 2; why.push('top'); }
    if (r.width >= 20 && r.width <= 420 && r.height >= 12 && r.height <= 140) s += 2; else if (r.width > 700 || r.height > 240) s -= 6;
    if (e.closest('button,[role=button]') && !why.includes('logo-attr')) s -= 4;
    let pa = e, bad = false; for (let i = 0; i < 3 && pa; i++) { if (badRe.test(attrs(pa)) && !logoRe.test(attrs(pa))) bad = true; pa = pa.parentElement; } if (bad) s -= 6;
    if (e.closest('footer')) s -= 3;
    if (top > 900) s -= 3;
    if (s <= 2) continue;
    const container = (a && (isHome(a) || logoRe.test(attrs(a)))) ? a : (anc && anc !== document.body && logoRe.test(attrs(anc)) ? anc : e);
    const g = groups.get(container) || { score: 0, why: new Set(), members: [], el: container };
    g.score = Math.max(g.score, s) + (g.members.length ? 1 : 0); why.forEach((w) => g.why.add(w));
    g.members.push({ el: e, tag, bgUrl, s });
    groups.set(container, g);
  }
  const glist = [...groups.values()].sort((a, b) => b.score - a.score).slice(0, 4).map((g) => {
    const members = g.members.map((m) => {
      const r = doc(m.el); const o = { tag: m.tag, rect: r, score: m.s };
      if (m.tag === 'svg') { try { o.svg = svgString(m.el); o.fills = fillsOf(m.el); } catch (x) { o.err = String(x); } }
      else if (m.tag === 'img') { o.src = m.el.currentSrc || m.el.src; o.alt = m.el.alt || null; o.natural = [m.el.naturalWidth, m.el.naturalHeight]; }
      else o.src = m.bgUrl;
      return o;
    });
    const lab = [g.el, ...g.members.map((m) => m.el)].map((e) => clean(e.getAttribute('aria-label') || e.getAttribute('alt') || e.getAttribute('title') || (e.querySelector && e.querySelector('title') ? e.querySelector('title').textContent : ''))).find((x) => x && !/^logo$/i.test(x));
    const out = { score: g.score, why: [...g.why], rect: doc(g.el), members, label: lab ? clean(lab.replace(/\b(logo|home(page)?|go to|link|wordmark)\b/gi, '')) : null };
    const svgs = members.filter((m) => m.svg);
    if (svgs.length > 1 && svgs.length === members.length) { // lockup: nested svgs positioned in the container box
      const R = out.rect; const parts = svgs.map((m) => { const d = new DOMParser().parseFromString(m.svg, 'image/svg+xml').documentElement; d.setAttribute('x', m.rect.x - R.x); d.setAttribute('y', m.rect.y - R.y); return new XMLSerializer().serializeToString(d); });
      out.lockup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${R.w} ${R.h}" width="${R.w}" height="${R.h}">${parts.join('')}</svg>`;
    }
    const home = g.el.closest && g.el.closest('a'); const t = home ? clean(home.innerText) : '';
    if (!members.length && t) out.text = t;
    return out;
  });
  // text-only logo (home link with text, no svg/img)
  let textLogo = null;
  const hl = [...document.querySelectorAll('a[href]')].find((a) => isHome(a) && isVis(a) && a.getBoundingClientRect().top + SY < 200 && clean(a.innerText).length > 1 && !a.querySelector('svg,img'));
  if (hl) { const cs = getComputedStyle(hl); textLogo = { text: clean(hl.innerText), font: cs.fontFamily, weight: cs.fontWeight, size: cs.fontSize, color: (col(cs.color) || {}).hex }; }

  // --- icons / social images
  const icons = [...document.querySelectorAll('link[rel*=icon i], link[rel=mask-icon i]')].map((l) => ({ rel: l.rel, href: l.href, sizes: l.getAttribute('sizes'), type: l.type || null })).filter((i) => i.href);
  const manifest = (document.querySelector('link[rel=manifest]') || {}).href || null;
  const ogImage = meta('meta[property="og:image"]') ? new URL(meta('meta[property="og:image"]'), location.href).href : null;

  // --- large media
  const media = []; const seenM = new Set();
  for (const e of document.querySelectorAll('img, video, canvas, picture img')) {
    if (!isVis(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 500 || r.height < 140) continue;
    if (e.closest('header,nav,footer')) continue;
    const src = e.currentSrc || e.src || e.poster || ''; const k = src || (e.tagName + Math.round(r.width) + Math.round(r.height) + Math.round(r.top + SY)); if (seenM.has(k)) continue; seenM.add(k);
    const d = doc(e); media.push({ kind: e.tagName.toLowerCase(), src: src || null, alt: e.alt || null, rect: d, area: d.w * d.h });
  }
  media.sort((a, b) => b.area - a.area);

  return {
    finalUrl: location.href, lang: document.documentElement.lang || null, title, nameMeta, titleParts, description, themeColorMeta: meta('meta[name="theme-color"]'), colorScheme: meta('meta[name="color-scheme"]'),
    h1, h2, h3, heroLine, heroInk, sentences, ctas: ctaOut, nav, link, bgW: [...bgW].sort((a, b) => b[1] - a[1]).slice(0, 24), txtCol: [...txtCol].map(([h, o]) => [h, o.w]).sort((a, b) => b[1] - a[1]).slice(0, 12),
    faces, blocked, cssVars, fonts, loaded, fam: Object.entries(fam).sort((a, b) => b[1] - a[1]).slice(0, 8), logoGroups: glist, textLogo, icons, manifest, ogImage, media: media.slice(0, 14), docH, W, H,
  };
}

// Hide everything except one media element (and its contents) so fixed navs / hero text on top of it are not captured with it.
export function pageIsolate(rect, kind, src) {
  const cands = [...document.querySelectorAll(kind === 'img' ? 'img' : kind)];
  const el = cands.find((e) => (src ? (e.currentSrc || e.src || e.poster) === src : false)) || cands.find((e) => { const r = e.getBoundingClientRect(); return Math.abs(r.width - rect.w) < 3 && Math.abs(r.height - rect.h) < 3 && Math.abs(r.top + scrollY - rect.y) < 6; });
  if (!el) return false;
  document.querySelectorAll('[data-md-el],[data-md-anc]').forEach((n) => { n.removeAttribute('data-md-el'); n.removeAttribute('data-md-anc'); });
  el.setAttribute('data-md-el', '1'); for (let p = el.parentElement; p; p = p.parentElement) p.setAttribute('data-md-anc', '1');
  const st = document.createElement('style'); st.id = '__md_iso';
  st.textContent = 'html *:not([data-md-anc]):not([data-md-el]):not([data-md-el] *){visibility:hidden!important}[data-md-anc]{background-image:none!important;box-shadow:none!important}';
  document.head.appendChild(st);
  return true;
}

// Per image: luma std-dev (blank test), top-8% luma strip (nav match) and the saturated dominant colours. Runs in a scratch page.
export async function pageImageStats(items) {
  const cv = document.createElement('canvas'); const cx = cv.getContext('2d', { willReadFrequently: true }); const res = [];
  for (const it of items) {
    const img = new Image(); img.src = it.url; await img.decode();
    const w = Math.min(640, img.width), h = Math.max(8, Math.round(w * img.height / img.width)); cv.width = w; cv.height = h; cx.drawImage(img, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data, N = w * h;
    let sum = 0, sq = 0; const lumArr = new Float32Array(N);
    const bk = new Map(); let satN = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const r = d[i], g = d[i + 1], b = d[i + 2]; const L = 0.2126 * r + 0.7152 * g + 0.0722 * b; lumArr[p] = L; sum += L; sq += L * L;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn >= 45 && (mx - mn) / mx >= 0.45 && mx >= 100) { satN++; const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4); let e = bk.get(k); if (!e) { e = [0, 0, 0, 0]; bk.set(k, e); } e[0]++; e[1] += r; e[2] += g; e[3] += b; }
    }
    const mean = sum / N, std = Math.sqrt(Math.max(0, sq / N - mean * mean));
    // top 8% strip, 96 columns x 8 rows, area-averaged
    const sh = Math.max(1, Math.round(h * 0.08)), strip = [];
    for (let ry = 0; ry < 8; ry++) for (let cxn = 0; cxn < 96; cxn++) {
      const x0 = Math.floor(cxn * w / 96), x1 = Math.max(x0 + 1, Math.floor((cxn + 1) * w / 96)), y0 = Math.floor(ry * sh / 8), y1 = Math.max(y0 + 1, Math.floor((ry + 1) * sh / 8));
      let t = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { t += lumArr[y * w + x]; n++; } strip.push(Math.round(t / n));
    }
    const list = [...bk.values()].map((e) => ({ n: e[0], r: e[1] / e[0], g: e[2] / e[0], b: e[3] / e[0] })).sort((a, b) => b.n - a.n);
    const cl = [];   // cluster buckets; the cluster colour is its purest member (n x chroma^2), not the dull mean of antialiased edges
    for (const e of list) {
      const ch = Math.max(e.r, e.g, e.b) - Math.min(e.r, e.g, e.b), sc = e.n * ch * ch;
      const c = cl.find((c) => Math.hypot(c.r - e.r, c.g - e.g, c.b - e.b) < 48);
      if (c) { c.n += e.n; if (sc > c.sc) { c.sc = sc; c.r = e.r; c.g = e.g; c.b = e.b; } } else if (cl.length < 40) cl.push({ ...e, sc });
    }
    res.push({ file: it.file, w: img.width, h: img.height, std: +std.toFixed(2), mean: +mean.toFixed(1), strip, satShare: satN / N, sat: cl.sort((a, b) => b.n - a.n).slice(0, 4).map((c) => ({ rgb: [Math.round(c.r), Math.round(c.g), Math.round(c.b)], n: c.n, share: c.n / N })) });
  }
  return res;
}

export async function pagePixels(urls) {
  const buckets = new Map(); let total = 0;
  const cv = document.createElement('canvas'); const cx = cv.getContext('2d', { willReadFrequently: true });
  for (const u of urls) {
    const img = new Image(); img.src = u; await img.decode();
    const w = 240, h = Math.max(1, Math.round(240 * img.height / img.width)); cv.width = w; cv.height = h; cx.drawImage(img, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); let e = buckets.get(k); if (!e) { e = [0, 0, 0, 0]; buckets.set(k, e); } e[0]++; e[1] += d[i]; e[2] += d[i + 1]; e[3] += d[i + 2]; total++; }
  }
  const list = [...buckets.values()].map((e) => ({ n: e[0], r: e[1] / e[0], g: e[2] / e[0], b: e[3] / e[0] })).sort((a, b) => b.n - a.n);
  const cl = [];
  for (const e of list) { const c = cl.find((c) => Math.hypot(c.r - e.r, c.g - e.g, c.b - e.b) < 24); if (c) { const t = c.n + e.n; c.r = (c.r * c.n + e.r * e.n) / t; c.g = (c.g * c.n + e.g * e.n) / t; c.b = (c.b * c.n + e.b * e.n) / t; c.n = t; } else if (cl.length < 60) cl.push({ ...e }); }
  return cl.sort((a, b) => b.n - a.n).slice(0, 16).map((c) => ({ rgb: [Math.round(c.r), Math.round(c.g), Math.round(c.b)], share: c.n / total }));
}
