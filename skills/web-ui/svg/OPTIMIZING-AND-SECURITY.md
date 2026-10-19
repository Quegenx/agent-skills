# Optimizing and securing SVG

Files from vector editors carry editor metadata, comments, hidden elements and default or suboptimal values that can be removed without changing rendering; SVGO does that, but a few of its plugins change behavior (scaling, accessible names, ids, standalone use), so know which ones run, including through SVGR. On the security side, an SVG is a document that can carry scripts: they never run when it is used as an image (`<img>`, CSS backgrounds, SVG `<image>`), but they do run inline, when the file is opened directly, or when embedded with `<object>`, `<iframe>` or `<embed>`. Treat any SVG not from a trusted source as active content: sanitize it and serve it with headers that stop scripts. General upload rules (type checks, storage, file names) are in [secure-coding SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).

**Contents:** [Optimizing with SVGO](#optimizing-with-svgo) · [Risky plugins](#risky-plugins) · [SVGR's defaults](#svgrs-defaults) · [Rendering performance](#rendering-performance) · [Where scripts hide in SVG](#where-scripts-hide-in-svg) · [Content-Type and serving](#content-type-and-serving) · [User-uploaded SVG](#user-uploaded-svg) · [Sanitizing with DOMPurify](#sanitizing-with-dompurify) · [Prove it](#prove-it)

## Optimizing with SVGO

- **CLI:** `svgo one.svg two.svg -o one.min.svg two.min.svg`; recursive: `svgo -rf path/to/directory_with_svgs -o path/to/output_directory`. Config goes in `svgo.config.mjs` or is passed with `--config`.

```js
export default {
  multipass: false, // boolean
  datauri: 'base64', // 'base64'|'enc'|'unenc'
  js2svg: { indent: 4, pretty: false },
  plugins: [
    'preset-default', // built-in plugins enabled by default
    'prefixIds',
    { name: 'prefixIds', params: { prefix: 'uwu' } },
  ],
};
```

- **Tune the preset with `overrides`:** `false` disables a plugin, an object sets its params.

```js
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          inlineStyles: { onlyMatchedOnce: false },
        },
      },
    },
  ],
};
```

- **API:** `import { optimize } from 'svgo'; const result = optimize(svgString, { path: 'path-to.svg', multipass: true }); result.data`. In the browser: `import { optimize } from 'svgo/browser'`. v4 has only named exports and requires Node >=16 (README on main: 4.1.0).
- **`preset-default`, in execution order:** removeDoctype, removeXMLProcInst, removeComments, removeMetadata, removeEditorsNSData, cleanupAttrs, mergeStyles, inlineStyles, minifyStyles, cleanupIds, removeUselessDefs, cleanupNumericValues, convertColors, removeUnknownsAndDefaults, removeNonInheritableGroupAttrs, removeUselessStrokeAndFill, cleanupEnableBackground, removeHiddenElems, removeEmptyText, convertShapeToPath, convertEllipseToCircle, moveElemsAttrsToGroup, moveGroupAttrsToElems, collapseGroups, convertPathData, convertTransform, removeEmptyAttrs, removeEmptyContainers, removeUnusedNS, mergePaths, sortAttrs, sortDefsChildren, removeDesc.
- **Tools that wrap SVGO (like SVGR) may run different defaults** from the preset.
- **v4.0.0 (2025-06-21):** `removeViewBox` is no longer a default plugin (to preserve scalability); `removeTitle` is no longer a default plugin (to preserve accessibility); `removeScriptElement` is renamed `removeScripts`.

### What the preset does to your markup

- **removeUnknownsAndDefaults:** removes unknown elements and attributes, and attributes set to their default values.
- **removeHiddenElems:** removes hidden or invisible elements (zero width or height, hidden with CSS); leaves non-rendering elements like `<clipPath>` and `<linearGradient>` alone unless they are unused.
- **convertShapeToPath, mergePaths, collapseGroups, convertPathData:** turn shapes into `<path>`, merge paths, flatten groups that do nothing (removeEmptyContainers removes empty ones), and rewrite path data (relative or absolute, whichever is shorter; converted and redundant commands removed; delimiters trimmed; numbers rounded).
- **inlineStyles:** merges `<style>` declarations into `style` attributes.
- **removeMetadata:** removes `<metadata>`. An export that stores data there, such as [technical-drawing](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/technical-drawing/SKILL.md)'s JSON record of the drawing's concept status, parameters and colors [Jakub Krehel, technical-drawing], loses it silently when run through `preset-default`; disable the plugin for those files.
- **removeDesc:** removes `<desc>` only if it is empty or seems to hold only editor attribution, never indiscriminately, because it is a crucial part of accessibility.

## Risky plugins

| Plugin | In `preset-default` (v4) | Risk |
|---|---|---|
| `removeViewBox` | No (removed in v4) | Removes `viewBox` when it matches width and height; the SVG then can't scale, won't fill its container, or clips when the container is too small (svg/svgo#1128) |
| `removeTitle` | No (removed in v4) | May have significant accessibility implications; sensible only if the SVG is purely aesthetic or accessibility is handled elsewhere, such as `aria-label` or `aria-describedby` |
| `cleanupIds` | Yes | Removes unused ids and minifies referenced ones. Known to cause problems when inlining several SVGs in one page: its predictable algorithm gives separately optimized files clashing ids. Enable `prefixIds` or set `minify: false`. It backs off when `<script>` or `<style>` is present (`force: true` overrides) |
| `prefixIds` | No | Prefixes ids and class names with the file name or a string. Don't use counter or random prefixes: unpredictable ids cause client and server HTML mismatches in React and Next.js with prerendering or SSR. Prefer reproducible prefixes |
| `removeDimensions` | No | Removes root `width`/`height` and adds `viewBox` if missing; the opposite of `removeViewBox`, so make sure that one is disabled |
| `removeXMLNS` | No | Recommended for SVGs you inline into HTML (pair with `removeXlink`), but makes them unusable as standalone files, in `<img>` or in CSS pseudo-elements |
| `removeScripts` | No | Strips scripts (see below); breaks interactive SVGs that rely on JavaScript |

## SVGR's defaults

- **SVGR's SVGO config** (`@svgr/plugin-svgo` 8.1.0, depending on `svgo ^3.0.2`) is `preset-default` plus `prefixIds`, and it sets `removeViewBox: false` only when `icon` is set or `dimensions` is `false`. A user `svgoConfig` replaces this config entirely.

```ts
const getSvgoConfigFromSvgrConfig = (config: Config): any => {
  const params = { overrides: {} as any }
  if (config.icon || config.dimensions === false) {
    params.overrides.removeViewBox = false
  }
  if (config.native) {
    params.overrides.inlineStyles = { onlyMatchedOnce: false }
  }
  return { plugins: [{ name: 'preset-default', params }, 'prefixIds'] }
}
```

- **SVGO v4 (2025-06-21) dropped `removeViewBox` from the default plugins** to preserve scalability (see [Optimizing with SVGO](#optimizing-with-svgo)).

## Rendering performance

- **DOM size.** Inline SVG typically means more DOM nodes (or larger bundles with React); the more nodes, the longer layout takes. Lighthouse 12's `dom-size` audit warns above about 800 body nodes and errors above about 1,400; web.dev calls a DOM excessive past 1,400 nodes. Lighthouse 13 replaced `dom-size` with `dom-size-insight` ([moving Lighthouse to insights](https://developer.chrome.com/blog/moving-lighthouse-to-insights)); this line used to name the audit without its version, and Lighthouse 13 no longer has `dom-size`. Lighthouse's advice: create nodes only when needed, and in React use windowing (`react-window`) and `React.memo` to cut repeated nodes and re-renders.
- **Reuse instead of repeating.** `<symbol>` and `<use>` define a graphic once and instance it many times; `<img>` and CSS `url()` SVGs are cached and keep bundles small.
- **Filters:** blurring is computation heavy; use it sparingly, especially on elements that scroll or animate (see [FILTERS.md](FILTERS.md)).
- **Animation cost.** Code-based animations (CSS, SVG, canvas, WebGL, JavaScript) can consume CPU and cause jank even with a small bandwidth footprint. `transform` and `opacity` render in their own layer and don't trigger repaint; `color` triggers style recalculation and repaint; geometry properties trigger layout.
- **`will-change` is a last resort** for existing problems, never for anticipated ones. It can help elements with frequent repaints and reflows or effects like `box-shadow` and `clip-path`. Don't apply it to many elements; it affects the whole subtree (bad on large sections like `<body>`); switch it on and off from script around the change; values that create a stacking context (such as `opacity`) create it up front; don't put it inside `@keyframes`, because animated properties are already treated as included.
- **`shape-rendering`:** `auto` (default), `optimizeSpeed`, `crispEdges`, `geometricPrecision`. `optimizeSpeed` may turn off anti-aliasing.
- **Not covered by the sources:** measured per-primitive filter costs and SVG-specific `will-change` guidance.

## Where scripts hide in SVG

- **Where they run:** an SVG's own `<script>` runs when the file is opened directly or embedded with `<object>`, `<iframe>` or `<embed>`; inline SVG scripts are page scripts. In `<img>`, SVG `<image>` and CSS `background-image`, scripts never run and links can't be activated. Those image-mode restrictions (no JS, no external resources, no `:visited` styles) exist for security and don't apply to direct viewing or document embeds.
- **The vectors SVGO's `removeScripts` strips:** `<script>` elements; SVG event attributes (`onload`, `onclick`, `oninput` and others); HTML inside `<foreignObject>` (event attributes, `srcdoc`, executable URLs in `action`, `data`, `formaction`, `href`, `src`); and `<a>` elements with `javascript:`, `vbscript:` or executable `data:` URLs (`text/html`, `application/xhtml+xml`, `image/svg+xml`), which it collapses. Unless the SVG comes from a trusted source, strip JavaScript to avoid XSS. `removeScripts` is not in `preset-default`.
- **`<use href="data:...">` is deprecated for security reasons,** and cross-origin `<use>` may be refused with no way to set a cross-origin policy.
- **Top-level navigation to `data:` URLs is blocked** in all modern browsers.

## Content-Type and serving

- **MIME type `image/svg+xml`,** extension `.svg`.
- **Serve `.svg` with `Content-Type: image/svg+xml` and `Vary: Accept-Encoding`;** compressed `.svgz` also needs `Content-Encoding: gzip`. Server misconfiguration is a very common reason SVGs fail to load: Firefox then shows the markup as text or garbage, or asks which app to open it with.
- **Never trust an upload's Content-Type.** The client supplies it and it is trivial to spoof; validate the file type yourself.

## User-uploaded SVG

- **`next/image` doesn't optimize SVG by default** because SVG has many of the same features as HTML and CSS, which can lead to vulnerabilities without proper CSP headers. Use `unoptimized` for SVG (automatic when `src` ends with `.svg`).
- **If you enable `dangerouslyAllowSVG`,** also set `contentDispositionType` to force download and `contentSecurityPolicy` to stop embedded scripts:

```js
module.exports = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}
```

| Next.js option | Since | Note |
|---|---|---|
| `dangerouslyAllowSVG`, `contentSecurityPolicy` | v12.1.0 | |
| `contentDispositionType` | v13.2.0 | Default `attachment` since v15.0.0: visiting the image URL directly downloads it |

- **CSP is not a substitute for sanitizing.** Sanitize input and set a CSP, for defense in depth against XSS.
- **Store and name uploads safely:** keep them on a different server or outside the webroot, generate the file name, and for images decode and re-encode to an allowed format. More in [secure-coding SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).
- **[secondary] A header set for serving original SVGs as download-only:**

```
Content-Type: image/svg+xml; charset=utf-8
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Content-Disposition: attachment; filename="uploaded.svg"
Referrer-Policy: no-referrer
```

- **[secondary] Host uploads on a dedicated origin** that shares no cookies or local storage with the application; sanitize server-side with a vetted sanitizer before storage; never write regex-based sanitization yourself.
- **[secondary] Consider converting SVG to PNG on upload.**

## Sanitizing with DOMPurify

- **DOMPurify is a DOM-only XSS sanitizer for HTML, MathML and SVG;** by default it permits all three (README at v3.4.17).

```js
DOMPurify.sanitize('<svg><g/onload=alert(2)//<p>'); // becomes <svg><g></g></svg>
// allow all safe SVG elements and SVG Filters, no HTML or MathML
const clean = DOMPurify.sanitize(dirty, {
  USE_PROFILES: { svg: true, svgFilters: true },
});
// change the default namespace from HTML to something different
const clean = DOMPurify.sanitize(dirty, { NAMESPACE: 'http://www.w3.org/2000/svg' });
```

- **Don't combine `USE_PROFILES` with `ALLOWED_TAGS`:** the profile overrides it.
- **Leave `SAFE_FOR_XML` on.** Set it to `false` only if you handle nothing but HTML (no SVG, no MathML); otherwise it leads to XSS.
- **SVGO `removeScripts` is the optimizer-side option** for the same vectors; it runs only when you opt in.

## Prove it

- **viewBox survives the build:** after SVGO or SVGR, every SVG meant to scale still has its `viewBox`; resize its container and it fills it without clipping.
- **Names survive:** informative SVGs keep `<title>` and non-empty `<desc>` after optimization.
- **No id clashes:** with several optimized SVGs inlined on one page, every id is unique and each `url(#id)` paints the right gradient, clip or filter; prefixes are reproducible, and an SSR page shows no hydration mismatch.
- **Standalone files work:** any SVG served to `<img>` or CSS was not run through `removeXMLNS`.
- **DOM budget:** on pages with many inline icons, Lighthouse 12's `dom-size` audit stays under its warning (about 800 nodes), or `dom-size-insight` passes on Lighthouse 13 ([moving Lighthouse to insights](https://developer.chrome.com/blog/moving-lighthouse-to-insights); this line said "Lighthouse's DOM size audit", an id Lighthouse 13 removed). Gating it in CI: [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#audit-ids-in-lighthouse-12-and-13).
- **Scripts can't run:** a test upload containing `<script>`, an `onload` attribute and a `javascript:` link is clean after sanitizing (DOMPurify output has no event attributes), and opening its URL directly downloads it (`Content-Disposition: attachment`) or runs nothing under the CSP.
- **Headers:** the response for an SVG carries `Content-Type: image/svg+xml`; on an uploaded one also the CSP and `Content-Disposition` you set.
- **Type check ignores the client:** an upload with a spoofed `Content-Type` is rejected by your own file-type validation.
- **Metadata kept where needed:** an SVG whose `<metadata>` carries data still has it after the SVGO run.
