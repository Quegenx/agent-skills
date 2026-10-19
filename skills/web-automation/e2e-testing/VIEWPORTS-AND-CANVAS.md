# Viewports, container widths and canvases

Which screen sizes to check, how to see several widths at once, how to test a container query in a test, and how to prove a WebGL canvas drew something and that the page still works without it. Sources: [responsive-craft] (its testing checklist and preview tool, MIT), [flornkm, prefer-container-queries] (MIT), [webdown-a, 3d-site] (its implementation checklist and scene verification) and [flornkm, webgl-components] (MIT). Fixed-width containers for one component's worst cases are in [WORST-CASE-DATA.md](WORST-CASE-DATA.md); the owner's responsive rules are in [modern-css RESPONSIVE.md](../../frontend/modern-css/RESPONSIVE.md).

## Viewport sizes

- **A 3D or media-heavy page** [webdown-a, 3d-site]: its four sizes and per-size checks are in [webgl LAUNCH-SITES.md](../../frontend/webgl/LAUNCH-SITES.md#prove-it).
- **A wider width list** [responsive-craft], in its priority order: 390, 360, 1920, 768, 1366, 375, 1024, 320, 430, 1440. The source ranks them by market share without naming where the figures come from, so only the widths are kept here.
- **Between the widths** [responsive-craft]: drag from 280px to 2560px instead of jumping between breakpoints; the quotes and the real-phone caveat are in [modern-css RESPONSIVE-FORKS.md](../../frontend/modern-css/RESPONSIVE-FORKS.md#prove-it).
- **At each width** [responsive-craft]: no horizontal scroll ("any at all is a failure"); text overflow from long words, URLs and usernames; images and media inside their boxes; navigation reachable; flex and grid wrapping where expected; positioned elements not overlapping or off-screen; modals, dropdowns and tooltips stacking correctly; sticky elements sticking without overlapping each other. The source also checks "44px minimum" touch targets; this repo's floor is 24px and a target between 24px and 44px is not reported as a failure ([web-accessibility HIT-AREAS.md](../../frontend/web-accessibility/HIT-AREAS.md)).

## Several widths side by side

[responsive-craft, scripts/preview.js] A live preview page puts one iframe per width next to the others (375, 768, 1024 and 1440 by default; `--breakpoints 320,768,1024,1440,1920` overrides). Each iframe gets that exact pixel width, so viewport media queries inside it fire at that width, and each frame scrolls and navigates on its own.

- Serve the preview page over HTTP, not from a file. The source's zero-dependency Node server tries port 8787 and moves up on `EADDRINUSE`, injects a live-reload script into HTML, rejects path traversal, and accepts only `http(s)` target URLs, so a `javascript:` or `data:` URL can't run.
- Start it in the background, so the agent stays free while the user looks (`run_in_background: true` on the shell call).
- **Blank frames:** "The target site may set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'self'`, which blocks iframe embedding."
- **Scope:** viewport media-query coverage, not device emulation. The tool's own plan: "Not trying to simulate real device behavior (touch events, safe areas, browser chrome)".

For automated screenshots per width, the screenshot assertion is in [WRITING-TESTS.md](WRITING-TESTS.md#screenshots).

## A container query in a test

Container queries respond to the parent's width, not the viewport's, so resizing the window doesn't exercise them. Resize the container and assert the computed style [responsive-craft, references/testing-checklist.md]:

```javascript
test('card adapts in narrow container', async ({ page }) => {
  await page.goto('/components/card');
  await page.evaluate(() => {
    const container = document.querySelector('.card-wrapper');
    container.style.width = '300px';
  });
  const card = page.locator('.card');
  await expect(card).toHaveCSS('flex-direction', 'column');
});
```

This is a component test, not a user journey: the project's journey rules (plain-language steps, no selectors) don't apply to it.

Where to resize it (the narrowest real context, not mobile viewport widths) [flornkm, prefer-container-queries]: [modern-css RESPONSIVE.md](../../frontend/modern-css/RESPONSIVE.md#a-fluid-scale-that-keeps-desktop-exact).

## Did the canvas draw

[webdown-a, 3d-site] "Verify canvas has nonblack/nontransparent pixels after load"; the rest of its 3D checks (framing on resize, a missing asset, reduced motion, disposal) are in [webgl LAUNCH-SITES.md](../../frontend/webgl/LAUNCH-SITES.md#prove-it).

- **Read the pixels from a screenshot, or in the same task as the draw.** After the browser composites, a WebGL drawing buffer is cleared unless the context was created with `preserveDrawingBuffer: true`, so a `readPixels`, `toDataURL` or `drawImage` from a later task reads empty (Khronos WebGL 1.0 spec §2.2, https://registry.khronos.org/webgl/specs/latest/1.0/). "All-zero frames from a separate task are a test artefact" ([seek-engine isokit webgl.md](../../videos/seek-engine/templates/isokit/references/webgl.md)).

## The page without WebGL

The fallback is a production surface, so test it on purpose.

- **A stub that turns WebGL off** (this repo's `drive.mjs --no-webgl`, [seek-engine isokit verify.md](../../videos/seek-engine/templates/isokit/references/verify.md)): every `getContext("webgl")` or `"webgl2"` returns `null`. Run it before the page's own scripts (an init script):

  ```javascript
  (()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...rest){if(/webgl/.test(String(kind)))return null;return get.call(this,kind,...rest)}})();
  ```

  Then check that the content still reads and each scene shows its fallback image or layout [webdown-a, 3d-site: "The content must remain usable if the scene system fails"].
- **A real browser with no GPU, and a `forceFallback` prop for a healthy one** [flornkm, webgl-components]: the Chrome command and the docs-page demo are in [webgl WIDGETS.md](../../frontend/webgl/WIDGETS.md#verify-without-eyeballs) ([the fallback](../../frontend/webgl/WIDGETS.md#the-fallback-is-a-production-surface)).

## Prove it

- The screenshots at each listed width show no horizontal scroll and no clipped label, and the drag from 280px to 2560px finds no width that breaks between breakpoints.
- The container-query test fails when the container query is deleted from the CSS and passes with it back.
- With the no-WebGL stub, every scene shows its fallback and every section's text is still on the page; with WebGL on, a screenshot of the canvas has pixels that are neither black nor transparent.
