# Viewports and container widths

Which screen sizes to check, how to see several widths at once, and how to test a container query in a test. Sources: [responsive-craft] (its testing checklist and preview tool, MIT), [flornkm, prefer-container-queries] (MIT), [webdown-a, 3d-site] (its implementation checklist and scene verification). Fixed-width containers for one component's worst cases are in [WORST-CASE-DATA.md](WORST-CASE-DATA.md); the owner's responsive rules are in [modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md).

## Viewport sizes

- **A 3D or media-heavy page:** the old topic and [webgl: launch-page acceptance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/LAUNCH-SITES.md#prove-it) pointed at each other for the source's four sizes, but neither contained the list. That source-specific list is unavailable in this copy; do not substitute the unrelated responsive-craft widths below. Canvas proof is [webgl: owned by WebGL](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/WIDGETS.md#nonblank-canvas-proof). [webdown-a, 3d-site; local source-coverage review]
- **A wider width list** [responsive-craft], in its priority order: 390, 360, 1920, 768, 1366, 375, 1024, 320, 430, 1440. The source ranks them by market share without naming where the figures come from, so only the widths are kept here.
- **Between the widths** [responsive-craft]: drag from 280px to 2560px instead of jumping between breakpoints; the quotes and the real-phone caveat are in [modern-css RESPONSIVE-FORKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE-FORKS.md#prove-it).
- **At each width** [responsive-craft]: no horizontal scroll ("any at all is a failure"); text overflow from long words, URLs and usernames; images and media inside their boxes; navigation reachable; flex and grid wrapping where expected; positioned elements not overlapping or off-screen; modals, dropdowns and tooltips stacking correctly; sticky elements sticking without overlapping each other. The source also checks "44px minimum" touch targets; this repo's floor is 24px and a target between 24px and 44px is not reported as a failure ([web-accessibility HIT-AREAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/HIT-AREAS.md)).

## Several widths side by side

[responsive-craft, scripts/preview.js] A live preview page puts one iframe per width next to the others (375, 768, 1024 and 1440 by default; `--breakpoints 320,768,1024,1440,1920` overrides). Each iframe gets that exact pixel width, so viewport media queries inside it fire at that width, and each frame scrolls and navigates on its own.

- Serve the preview page over HTTP, not from a file. The source's zero-dependency Node server tries port 8787 and moves up on `EADDRINUSE`, injects a live-reload script into HTML, rejects path traversal, and accepts only `http(s)` target URLs, so a `javascript:` or `data:` URL can't run.
- Start it in the background, so the agent stays free while the user looks (`run_in_background: true` on the shell call).
- **Blank frames:** "The target site may set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'self'`, which blocks iframe embedding."
- **Scope:** viewport media-query coverage, not device emulation. The tool's own plan: "Not trying to simulate real device behavior (touch events, safe areas, browser chrome)".

For automated screenshots per width, the screenshot assertion is in [tester-army-e2e: WRITING-TESTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/WRITING-TESTS.md#screenshots).

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

Where to resize it (the narrowest real context, not mobile viewport widths) [flornkm, prefer-container-queries]: [modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md#a-fluid-scale-that-keeps-desktop-exact).

## Prove it

- The screenshots at each listed width show no horizontal scroll and no clipped label, and the drag from 280px to 2560px finds no width that breaks between breakpoints.
- The container-query test fails when the container query is deleted from the CSS and passes with it back.
- Canvas and no-WebGL acceptance use the [webgl: canonical renderer verification](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/WIDGETS.md#nonblank-canvas-proof). [webdown-a, 3d-site; flornkm, webgl-components]
