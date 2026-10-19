# Adversarial UI QA with sub-agents

QA of a change in a real browser: try to break things, not confirm they work. The main agent coordinates and sub-agents test; every step emits one marker backed by evidence, with a screenshot taken at the moment of failure. The browser commands below use the Browserbase `browse` CLI.

**Contents:** [Coordinator and workers](#coordinator-and-workers) · [The assertion protocol](#the-assertion-protocol) · [Testing a diff](#testing-a-diff) · [Deterministic checks](#deterministic-checks) · [Adversarial patterns](#adversarial-patterns) · [Test categories](#test-categories) · [Design consistency](#design-consistency) · [UX heuristics](#ux-heuristics) · [The report](#the-report) · [Browser sessions for QA](#browser-sessions-for-qa) · [Prove it](#prove-it)

## Coordinator and workers

- **The main agent coordinates:** it plans, delegates and merges. Sub-agents execute their assigned tests only. The main agent does not drive the browser itself except to check the dev server is up.
- **Three planning rounds, done and output before launching any sub-agent:**
  1. **Functional:** action, then expected result.
  2. **Adversarial:** roles, error paths, empty states, races, edge inputs (empty, huge, special characters, rapid clicks). Realistic worst-case data for one component is [WORST-CASE-DATA.md](WORST-CASE-DATA.md).
  3. **Coverage gaps:** accessibility (axe-core plus keyboard-only), mobile viewports, console errors, visual consistency.
  Deduplicate into one numbered list, assign groups, execute once.
- **Splitting:** sub-agents run assigned tests, not exploration. The slowest agent is the bottleneck, so many small groups beat a few large ones. Size the effort to the change. No early stopping on failures.
- **Sub-agents get the full test steps and the assertion protocol;** they don't have the skill's context.
- **Every sub-agent prompt states a step budget,** because sub-agents do not limit themselves: about 25 steps for a few targeted checks, about 40 for a full page (functional, adversarial and accessibility), about 75 for several pages or a broad category. On hitting the budget, accept partial results, do not re-run, and list the rest as SKIPPED.

```
You have a budget of N browse steps (each `browse` command = 1 step). Count your steps as you go. When you reach N, stop immediately and report:
- STEP_PASS/STEP_FAIL for every test you completed
- STEP_SKIP|<test-id>|budget reached for every test you didn't get to

Do not retry or continue after hitting the budget.
Run only these tests: [numbered list from the merged plan]
Do not explore beyond the assigned tests.
Do NOT generate an HTML report or write any files. Return only step markers and your findings as text.
```

- **Summary lines:** per sub-agent `Tests: 8 | Passed: 5 | Failed: 2 | Skipped: 1 | Pages visited: 2`; final `Tests: 20 | Passed: 14 | Failed: 4 | Skipped: 2 | Agents: 3 | Pass rate: 70%`. Do not report steps used; that is plumbing.

## The assertion protocol

- **One marker per step:** `STEP_PASS|<step-id>|<evidence>` or `STEP_FAIL|<step-id>|<expected> → <actual>|<screenshot-path>`. Step ids read like `homepage-cta`, `form-validation-error`, `modal-cancel`. No freeform "this looks good".
- **Never report PASS without concrete evidence** from the accessibility tree or a deterministic check.
- **Evidence, strongest first:**
  1. **A deterministic check:** an eval returning structured data (axe violation count, `document.title`, a field value, the console error array, an element count).
  2. **A snapshot element match by ref** (`@0-12 button "Save"`).
  3. **A before and after comparison.**
  4. **A screenshot and visual judgment,** weakest, only for color, spacing and layout, always saying what is being evaluated.
- **Core loop:** snapshot BEFORE, act, snapshot AFTER, compare, write the marker.
- **Screenshot every failure at the moment it happens** (the broken state, not after recovery) to `.context/ui-test-screenshots/<step-id>.png`; in parallel runs `<session>-<step-id>.png`; layout bugs also get `<step-id>-baseline.png`. Run `mkdir -p .context/ui-test-screenshots` at the start.
- **A failure report** gives the exact action, expected, actual, the screenshot path and a suggested fix.

## Testing a diff

1. **Read the agreed change scope and its diff,** then categorize the changed UI. Use the existing [code-review: scope-resolution contract](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#resolving-the-scope) when the intended change is unclear. [Browserbase, qa; Jakub Krehel, interface-review]

| Pattern | Impact | Test |
|---|---|---|
| `*.tsx/jsx` | component | render, interaction, state, edge cases |
| `pages/**`, `app/**`, `src/routes/**` | route | navigation, load, content, 404 |
| `*.css/scss/module.css` | style | screenshot, responsive |
| `*form*`, `*input*`, `*field*` | form | validation, submission, empty, long and special input |
| `*modal*`, `*dialog*`, `*dropdown*` | interactive | open and close, Escape, focus trap, cancel vs confirm |
| `*nav*`, `*menu*`, `*header*` | navigation | links, active states, routing, keyboard |
| non-UI only | none | report "no UI tests needed" |

2. **Map files to actual routes:** inspect Next.js App/Pages Router or the React router configuration and the configured server port. The source's Vue/Nuxt, SvelteKit and Angular examples are excluded from this stack. [Browserbase, qa; owner stack rule]
3. **Make sure the intended local code is rendered.** Use the project's configured dev server only when execution is authorized. A Next.js dev response can be HTTP 200 while displaying a build-error dialog; inspect the rendered state before calling it a working application. Do not install dependencies or alter the user's checkout as an automatic QA prerequisite. [Browserbase, qa; Jakub Krehel, interface-review; owner authorization rule]
4. **Plan happy and adversarial tests per changed area** (for an email field: valid email, invalid email, empty submit, XSS, a rapid double submit, keyboard-only).
5. **Execute with before and after snapshots,** then write the text report and, if wanted, the HTML report.

## Deterministic checks

- **`browse eval` has no top-level `await`:** use `.then()` or split the calls.
- **Accessibility:** inject `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`, `browse wait timeout 3000`, then:

```js
axe.run().then(r => JSON.stringify({ violations: r.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length, help: v.helpUrl })), passes: r.passes.length, incomplete: r.incomplete.length }))
```

  Assert `violations.length === 0` for the selected rendered state. Map source axe impact labels once for reporting: critical to P0, serious to P1, moderate to P2 and minor to P3; keep the native `impact` field as evidence and justify priority against actual task impact. Null impact remains unclassified. The old guidance used the source labels without this mapping. [Browserbase, qa; owner P0 to P3 rule]
  Triage critical and serious first, fix the shared component instead of each generated instance, record any justified exception with its scope and owner, treat `incomplete` results as items for a manual check, and rerun on the same rendered state; a third-party widget may need a vendor fix or a narrowly scoped suppression with evidence [freescan, /checks/accessibility/rendered-axe-violations].
- **Performance:** read the navigation and paint entries (`domContentLoaded`, `loadComplete`, `firstPaint`, `firstContentfulPaint`, `transferSize`, `domInteractive`). FCP of 1.8 s or less is good, above 1.8 s through 3 s needs improvement, and above 3 s is poor; load under 3 s is good for SaaS; DOM interactive under 400 ms feels instant (Doherty). A gated, repeatable version of these numbers in CI is [web-performance Lighthouse CI guide](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md).
- **FCP interpretation:** the [official target](https://web.dev/articles/fcp) is the 75th percentile of page loads, segmented mobile/desktop. A single navigation sample does not establish that percentile. The old QA line used exclusive cutoffs and did not name this population; its SaaS-load and Doherty numbers remain source heuristics, not FCP standards. Canonical measurement is in [web-performance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/SKILL.md). [Browserbase, qa; Google FCP]
- **Resource Timing limits:** a cross-origin resource can have `transferSize` zero because `Timing-Allow-Origin` did not expose the size, as well as because of local caching. The source's raw timing values cannot prove that no network request or data transfer occurred. Distinguish restricted fields from measured absence. [MDN transferSize](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize)
- **Broken images:** `img` elements where `!i.complete || i.naturalWidth === 0`.
- **Console errors:** injecting a capture on `about:blank` and then navigating wipes it. Either read failed resources with `performance.getEntries().filter(e => e.entryType === 'resource' && e.responseStatus >= 400)`, or inject on the page itself, wrapping `console.error` / `console.warn` and adding `error` and `unhandledrejection` listeners that push into `window.__logs`, then interact, then read.
  Count the site's own console errors and uncaught page errors apart from failed-resource noise and browser-extension noise; reproduce the first site error with source maps and fix it before the errors it cascades into, and where an external dependency fails, add a fallback or error boundary [freescan, /checks/design/runtime-console-health].
- **Keyboard navigation:** `press Tab`, then eval `document.activeElement` (tag, text, role, aria-label, and computed outline/shadow as a candidate focus signal); the source stops when focus returns to BODY on its simple-page traversal. Every interactive element is reachable, the order follows the visual layout, and the focused control has a visible keyboard indicator. Merely having an outline or shadow does not prove visibility: inspect the rendered focused state. The source treated the CSS presence check as proof. [WCAG Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- **Focus traversal limit:** [MDN activeElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement) can return `body` or `documentElement` when nothing is focused, a nested tree's root, or `null` for another document tree. BODY alone does not prove complete keyboard coverage; use the [web-accessibility: canonical focus checks](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md). The old procedure treated that sentinel as the completion condition.
- **Focus trap:** Tab repeatedly inside an open dialog and eval the active element; focus must cycle within the dialog.
- **Responsive sweep:** 375x812 (iPhone SE), 768x1024 (iPad), 1440x900 (desktop), `wait timeout 1000`, full-page screenshots, then look at them. Overflow: `document.documentElement.scrollWidth > document.documentElement.clientWidth` is a FAIL. Touch targets: 44 by 44 CSS pixels is the source's enhanced/project target, not the universal AA minimum. WCAG 2.2 AA 2.5.8 uses 24 by 24 CSS pixels with spacing, equivalent, inline, user-agent and essential exceptions; AAA 2.5.5 uses 44 by 44 with its own exceptions. Report which contract and exception were checked. [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). Add 320 px wide, the width WCAG 2.2 SC 1.4.10 Reflow names ("a width equivalent to 320 CSS pixels", [Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)), and browser zoom at 200% "because text grows and boxes don't" [Emil Kowalski, break-ui]. For one component, check it at its real container width as well, or render fixed-width containers (320 px, squeezed by a sibling, very wide) on one page so a single load shows them all ([WORST-CASE-DATA.md](WORST-CASE-DATA.md#scenario-axes-and-their-cues)).
- **Links and forms:** list `a[href]` with `isExternal` and `opensNewTab`; list inputs with `required`, `hasLabel` (labels, aria-label, aria-labelledby) and placeholder; every input has a label or an aria-label.
- **Empty state:** screenshot and snapshot, then look for a message, an illustration and a call to action.
- **XSS:** the payload shows in the snapshot as StaticText inside the input, which is only its value. The real checks are whether validation rejects it and whether it renders as HTML outside the input.

## Adversarial patterns

- **Forms:** empty submit; 500+ characters; `<script>alert('xss')</script>` and `'; DROP TABLE users;--`; a double submit.
- **Modals, the full lifecycle:** open (a dialog role appears), Escape closes, cancel closes with no side effects, confirm closes with the side effect.
- **Navigation:** click a link and check the URL changed and the destination content shows; back returns the URL and content.
- **Error states:** a page with empty data, a nonexistent route, invalid data (is the error helpful, is the input preserved).
- **Keyboard:** use the focus traversal checks and limits above; Enter activates. [Browserbase, qa; MDN activeElement]
- **Stress:** click twice rapidly, submit empty, paste 500 characters, press Escape mid-flow.
- **Both views on long input:** the lengths above are fixed; `break-ui` uses the field's schema, column or API limit and reports "unbounded" when there is none [Emil Kowalski, break-ui] ([WORST-CASE-DATA.md](WORST-CASE-DATA.md#the-stance)).

## Test categories

| Category | Method |
|---|---|
| Accessibility | axe plus keyboard; deterministic |
| Visual quality | screenshot plus heuristics; weakest |
| Responsive | the sweep plus the overflow check |
| Console health | deterministic |
| UX heuristics | cite the specific heuristic |
| Error states | before and after |
| Data display | element match |
| Design consistency | cite the property |
| Exploratory | Optional [tester-army-e2e bug bash](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/BUG-BASH.md), when selecting that runner |

## Design consistency

**Owner conflict:** the source asks for visible custom focus, while the owner app-ui rule says "no focus ring anywhere". Report that specific conflict with the focus evidence and WCAG criterion; leave the owner production files unchanged unless the user approves that change. [Browserbase, qa; app-ui/SKILL.md; WCAG Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)

- **If the project has a design system document, it is ground truth;** a deviation is a `STEP_FAIL` (`design system specifies 8px grid → new modal uses 6px gap`). A template lists colors, typefaces, radius tiers, a spacing unit, button sizes, focus and disabled styles; copy it and replace the values with the project's.
- **Otherwise learn from the app:** screenshot 2 or 3 unchanged pages as a baseline, then the changed page, and compare spacing rhythm, border radius, button styles, typography, color usage and component patterns (inline confirm vs modal).
- **Always name the page, the element and the property.**

## UX heuristics

- **Laws of UX:** Fitts (the primary CTA is largest; destructive no larger than constructive; tap targets 44x44 Apple, 48x48 Material; full-width submit on mobile); Hick (more than 7±2 nav items get grouped; a dropdown of 15+ needs search; one clear action per modal); Miller (chunks of 5 to 9; 3 to 5 key metrics; wizards of no more than 5 to 7 steps); Jakob (conventional placement: logo goes home, avatar top right, sidebar left); aesthetic-usability (consistent radius, 3 to 4 primary colors at most, a 4 or 8 px rhythm); Doherty (under 400 ms; a loading indicator past 1 s; optimistic UI; skeletons); Von Restorff; Zeigarnik (progress indicators).
- **Nielsen H1 to H10 with concrete checks,** for example H3: a modal closes with Escape and with an outside click; H5: destructive actions confirm, and unsaved changes prompt "Leave page?"; H9: errors sit next to the field, input is preserved, no stack traces or raw JSON, a 404 suggests alternatives.
- **Error states and edge cases:** designed empty states with a CTA; "No results match your filters"; error boundaries; an offline indicator; an expired session redirects with a message and returns the user to where they were; form edge cases (paste, negatives, decimals, zero, time zone in date pickers); loading states; actions the user can't perform are hidden.
- **Data display:** tables (numbers right-aligned, sort indicators, "Showing 1-25 of 142", a mobile scroll or cards); charts (axis labels, a legend, a zero-data message, bar y-axis from zero, not color alone); metrics (1.2K, direction arrows); filters (removable, clear all, persisted, start before end); pagination (the URL holds the page, back preserves scroll); formatting (no `null` or `undefined`, no 33.333333%, "2h 15m").
- **Visual:** body text 16 px desktop and 14 px mobile at least; line height 1.4 to 1.6; lines of 60 to 80 characters; 2 to 3 font families at most; WCAG AA contrast 4.5:1 for normal text and 3:1 for large (18 pt+, or 14 pt+ bold; "14pt and 18pt are equivalent to approximately 18.5px and 24px", [Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)); semantic status colors; hover, focus and disabled states; loading buttons prevent double clicks.
- **Accessibility:** Tab reach and order, a visible custom focus, Escape closes, Enter and Space activate, arrow keys within groups, a skip link, focus trapped in modals and returned to the trigger; alt text, labels rather than placeholders, heading hierarchy, landmarks, live regions; `prefers-reduced-motion`, no more than 3 flashes per second; information never by color alone.

## The report

- **Text first:** the markers and the summary line. An optional HTML report goes to `.context/ui-test-report.html`.
- **HTML report rules:** `<details>` cards with failures `open` and listed first, passes collapsed; every failure card embeds its screenshot as base64 (`base64 -i <png> | tr -d '\n'`) or says it is missing, and carries a fix suggestion; the pass-rate class is good at 90% or more, warn at 70 to 89%, bad below 70%; the file works offline and stays under 5 MB.
- **The sources disagree on two points:** the rule says no CDN links or external assets, while the shipped template links Google Fonts (falling back to system fonts offline); and one description says the workflow writes no artifacts, while it does write the HTML report and screenshots.

## Browser sessions for QA

Use the existing [browser-automation: browser command and snapshot contract](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SNAPSHOT-AND-ACT.md#tools), [browser-automation: local/attached/cloud selection](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/LOCAL-AND-CLOUD.md) and [browser-automation: signed-in session scope](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SIGNED-IN-SESSIONS.md). The old QA summary sent every deployed site to Browserbase; the browser owner also permits local public-site reads and requires approval for paid browser use. Keep that established owner contract. [Browserbase, qa; browser-automation owner]

- **Parallel sessions:** prefix every command with `BROWSE_SESSION=<name>`; each name gets its own browser. Named sessions work locally as well as on remote Browserbase browsers. Tests within a group run in sequence and groups run in parallel: parallel for different pages or independent audits, sequential for dependent steps or an ordered before and after.

- **Source SPA workaround:** when a deep link returns 404, open `/` and click through. [Browserbase, qa]
- **Always `browse stop` when done,** for every named session.

## Prove it

Every planned test ends in exactly one marker; every `STEP_PASS` carries evidence from a deterministic check, a ref match or a before and after comparison; every `STEP_FAIL` has a screenshot of the broken state; skipped tests are listed as SKIPPED; and the summary's counts add up.
