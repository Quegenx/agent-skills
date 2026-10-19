# Measuring a running page against UI invariants

A headless browser loads a route, moves a real pointer and prints what the rendered page does: whether a list's hover glides or blinks off between rows, whether selecting a tab shoves its neighbours, which transition durations survive the cascade, which control heights ship, which loaded font descriptors have a weight range, and what overflows. Source: [fluid-functionalism], `scripts/audit.mjs` and `references/stack-audit.md`, a Playwright script written for its own component system; the code below is copied from it with the system's token values marked as the ones to swap for the project's. It answers part of what a lint-style checker lists as blind spots, such as "layout at each viewport, overflow at 390px" ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md#a-checker-in-ci)). Turning its lines into advice goes through the evidence gate in [anti-slop-ui: UI improvement shortlist](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/IMPROVEMENT-SHORTLIST.md#the-evidence-gate).

## Why measure

"Source shows what a component asks for; only the rendered page shows what it does." "Most FF advice turns on questions source cannot settle", so "When the app runs, measure those instead of inferring them" [fluid-functionalism, stack-audit.md]. The script "reports; it does not judge. Every line is evidence for the gate … never a recommendation on its own: a per-row hover can be the right call, and a 150ms transition can be a documented exception." [fluid-functionalism, audit.mjs]

## What it reports, per viewport

[fluid-functionalism, stack-audit.md]:

- **HOVER:** "each labelled list of 3+ rows, classified by moving a real pointer: `glide` (FF's hook, identified by `data-fluid-hover-active-index`), `custom-glide` (a moving overlay that is not FF's hook), `per-row` (each row repaints its own fill, with whether it goes dark in the gap between rows), or `none`; plus any row that moves when a neighbour is hovered."
- **SELECT:** "whether selecting a tab moves the other tabs (a weight change without a ghost span)."
- **TRANSITIONS:** "CSS durations off FF's tokens (0/60/80/120/160/180/240ms) and `transition-property: all`, with example elements." The comment on the token list: "Anything else is off the system: Tailwind's bare `transition` class is 150ms, the usual culprit." [fluid-functionalism, audit.mjs] For another project, pass its own duration tokens.
- **LADDER:** "the distribution of control heights against 36 / 28px" (the system's two densities; pass the project's own control heights).
- **FONT:** a source heuristic for families using `font-variation-settings: 'wght'`, based on loaded `FontFace.weight` descriptors. This does not prove which axes the font file contains or that a rendered weight change works. [fluid-functionalism, audit.mjs; MDN FontFace.weight]
- **OVERFLOW:** "horizontal overflow and the element causing it."

**Upstream-only invocation:** `scripts/audit.mjs` and its package manifest are not shipped in this skill. The following is the source workspace command, not an executable local path; its extracted fragments below are not a complete replacement script. Inspect the actual upstream asset before using it, and do not install dependencies automatically. [fluid-functionalism, scripts/audit.mjs; local file inventory]

```bash
cd <skill>/scripts && npm install        # once: playwright-core
node audit.mjs http://localhost:3000/<route> [--widths 1280,390] [--json out.json]
```

"Point it at the surfaces with the most exposure, the ones the shortlist is going to be about, not at every route." The pointer checks run at the first width only; the CSS probes run at every width [fluid-functionalism, audit.mjs].

## Finding the lists

A list is a parent holding 3 or more visible, labelled click targets that share a left edge (axis `y`) or a top edge (axis `x`), with heights within 1.6× of each other. Nested targets are skipped, and an `<li>` wrapper counts its own parent as the list. The `ITEM` selector, then the filter inside `tagLists()` [fluid-functionalism, audit.mjs]:

```js
const ITEM =
  'a[href], button, [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"], [role="tab"], [role="row"], [role="radio"], [role="checkbox"], tr';
if (items.length < 3) continue;
const rects = items.map((i) => i.getBoundingClientRect());
const hs = rects.map((r) => r.height);
if (Math.max(...hs) > Math.min(...hs) * 1.6) continue;
const sharedLeft = rects.every((r) => Math.abs(r.left - rects[0].left) <= 2);
const sharedTop = rects.every((r) => Math.abs(r.top - rects[0].top) <= 2);
if (!sharedLeft && !sharedTop) continue;
lists.push({ container, items, axis: sharedLeft ? "y" : "x" });
```

Labels come from `innerText`: "innerText skips visibility:hidden text, which is what FF's ghost spans are; textContent would read every weight-changing label twice." [fluid-functionalism, audit.mjs]

## The hover probe

For rows 1 to 3 of each list: park the pointer in the bottom-right corner, read the list, move to the row's centre in 4 steps, wait 280ms, read again, then move into the gap after the row and read a third time. A row "repaints its own fill" when its own or its first child's `backgroundColor` changed; an "overlay moved" when any absolutely positioned element inside the list that is not a row changed its rect, `opacity` or `transform`; neighbour shift is the largest rect change above 0.5px [fluid-functionalism, audit.mjs]:

```js
export function classifyHover({ ffAttr, overlayMoved, rowFill }) {
  if (ffAttr) return "glide";
  if (overlayMoved) return "custom-glide";
  if (rowFill) return "per-row";
  return "none";
}

// The gap after this row: glide keeps something lit there, per-row goes dark.
const next = hovered.rects[j + 1];
const cur = hovered.rects[j];
const gap = list.axis === "y" ? next[1] - (cur[1] + cur[3]) : next[0] - (cur[0] + cur[2]);
if (gap >= 2) {
  const gx = list.axis === "y" ? cur[0] + cur[2] / 2 : cur[0] + cur[2] + gap / 2;
  const gy = list.axis === "y" ? cur[1] + cur[3] + gap / 2 : cur[1] + cur[3] / 2;
  await page.mouse.move(gx, gy, { steps: 2 });
  await settle(page);
  const inGap = await page.evaluate(readList, list.index);
  const lit = inGap.ffAttr || inGap.overlays !== base.overlays || inGap.fills.some((f, k) => f !== base.fills[k]);
  seen.gap = Math.max(seen.gap, Math.round(gap));
  seen.gapDark = (seen.gapDark ?? false) || !lit;
}
```

`ffAttr` is the system's own marker (`data-fluid-hover-active-index`); in another codebase it stays false and a shared highlight shows up as `custom-glide`.

## The tab-select probe

In up to 3 visible `[role="tablist"]` elements with 2 or more tabs: record every tab's bounding box, click the first visible tab whose `aria-selected` is not `"true"`, wait 400ms, record again, and report the largest move of any other tab. If the click navigated away, reload the route and skip that tablist [fluid-functionalism, audit.mjs]:

```js
function maxShift(before, after, skip) {
  let worst = { delta: 0, index: -1 };
  before.forEach((r, k) => {
    if (k === skip) return;
    const d = Math.max(...r.map((v, n) => Math.abs(v - after[k][n])));
    if (d > worst.delta) worst = { delta: d, index: k };
  });
  return worst;
}
```

A shift above 0.5px prints as `selecting tab 2 moved tab 3 by 2.8px`.

## The page-side probes

Each runs inside the page through `page.evaluate`, after `document.fonts.ready` and an 800ms settle [fluid-functionalism, audit.mjs]. `path(el)` is a helper that builds a short selector from up to four ancestors (id, `data-slot`, `aria-label` or two classes).

**Transitions off the token set:**

```js
function probeTransitions(tokens) {
  const { path } = window.__ffa;
  const parse = (v) =>
    String(v)
      .split(",")
      .map((s) => s.trim())
      .map((s) => (s.endsWith("ms") ? parseFloat(s) : s.endsWith("s") ? parseFloat(s) * 1000 : NaN))
      .map(Math.round);
  const off = {};
  let all = 0;
  const allExamples = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    const durs = parse(cs.transitionDuration);
    if (!durs.some((d) => d > 0)) continue;
    const props = cs.transitionProperty.split(",").map((s) => s.trim());
    const offHere = new Set();
    props.forEach((p, k) => {
      const d = durs[k % durs.length];
      if (!(d > 0)) return;
      if (p === "all" && !offHere.has("all")) {
        offHere.add("all");
        all++;
        if (allExamples.length < 3) allExamples.push(path(el));
      }
      if (!tokens.includes(d) && !offHere.has(d)) {
        offHere.add(d);
        off[d] ??= { count: 0, examples: [] };
        off[d].count++;
        if (off[d].examples.length < 3) off[d].examples.push(`${path(el)} (${p})`);
      }
    });
  }
  return { off, all, allExamples };
}
```

**Control heights:** every visible `button, [role="button"], select, [role="tab"], [role="combobox"], [role="option"], [role="menuitem"]`, text-like `input` and boxed `a` (a link counts only when it has a background or a top border and is not `display: inline`), bucketed by rounded height and compared with the ladder at ±1px; up to four off-ladder heights print, each with an example path [fluid-functionalism, audit.mjs].

**Loaded font descriptors, a heuristic:**

```js
function probeFonts() {
  const norm = (f) => f.replace(/["']/g, "").trim().toLowerCase();
  const loaded = [...document.fonts].filter((f) => f.status === "loaded");
  const ranged = new Set(loaded.filter((f) => /\d+\s+\d+/.test(f.weight)).map((f) => norm(f.family)));
  const known = new Set(loaded.map((f) => norm(f.family)));
  const users = {};
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (!/wght/.test(cs.fontVariationSettings)) continue;
    const fam = norm(cs.fontFamily.split(",")[0]);
    users[fam] = (users[fam] || 0) + 1;
  }
  return Object.entries(users).map(([family, count]) => ({
    family,
    count,
    face: ranged.has(family) ? "variable" : known.has(family) ? "static" : "not-loaded",
  }));
}
```

The source prints "variable face loaded: weight changes can render", "only static faces loaded: weight changes cannot render" and "no matching web font loaded: the system fallback decides". Those labels overstate this probe. `FontFace.weight` is the CSS descriptor, and `@font-face` weight ranges can describe static or variable files; the range is not proof of file capabilities. Check the actual font and rendered change before making that stronger claim. The old topic repeated the source verdict as proof. [FontFace.weight](https://developer.mozilla.org/en-US/docs/Web/API/FontFace/weight), [font-weight descriptor](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-weight). General font-property/fallback behavior is [modern-css: defined once here](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/FONTS-AND-TEXT-DETAILS.md#properties-over-raw-tags).

**Horizontal overflow and its widest cause:**

```js
function probeOverflow() {
  const doc = document.documentElement;
  const width = doc.clientWidth;
  if (doc.scrollWidth <= width + 1) return null;
  let widest = null;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.right > width + 1 && (!widest || r.right > widest.right)) widest = { right: Math.round(r.right), path: window.__ffa.path(el) };
  }
  return { scrollWidth: doc.scrollWidth, width, widest };
}
```

This is the same `scrollWidth > clientWidth` test as the responsive sweep in [ADVERSARIAL-UI-QA.md](ADVERSARIAL-UI-QA.md#deterministic-checks), plus the element to blame.

## Launching a browser

`playwright-core` with a fallback chain, so it runs wherever any Chromium exists: `CHROME_PATH` if set, then Playwright's default, then `{ channel: "chrome" }`, then every `chromium-*` build under `PLAYWRIGHT_BROWSERS_PATH`, `~/.cache/ms-playwright` and `~/Library/Caches/ms-playwright`, newest first. When all fail: "No Chromium could be launched. Install Chrome, run `npx playwright install chromium`, or set CHROME_PATH." [fluid-functionalism, audit.mjs] Each width gets its own context with a 900px-tall viewport, closed after its probes.

## What it cannot see

"What it cannot see, so do not read silence as a pass: Motion springs (they run in JS, not CSS transitions), popups and menus closed at load, states behind auth, reduced-motion behavior, and taste. Screenshots at the same widths still carry the judgment call; the numbers carry the claims." [fluid-functionalism, stack-audit.md]

"Run it in bounded passes: once before advising, once after a change to confirm it, then stop. If the app cannot run (no dev server, no browser), say so and file any entry that depended on a measurement as a `check:` question rather than a finding." After a change, "re-run `audit.mjs` on the route it touched and call the item done only when the line that justified it is gone. One confirming run, not a loop." [fluid-functionalism, stack-audit.md]

## Prove it

Every claim about hover, tab shift, durations, control heights, font descriptors or overflow quotes a printed line with its route and width; a font-capability claim also has actual font/render evidence, and a missing upstream script is reported as unavailable; the duration and height lists passed in are the project's own tokens, not the source's; the report names the blind spots it did not cover (JS springs, closed popups, auth, reduced motion); and after a fix, one re-run on the same route no longer prints the line that justified it.
