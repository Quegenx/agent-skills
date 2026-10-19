# Variants: several real directions behind a picker

Build three to five genuinely different versions of one described UI piece, put them behind a fixed picker on an isolated route or in one HTML file, stop so the user can choose, then promote the pick and delete the rest. It is Emil Kowalski's `prototype` skill (emilkowalski/skills: SKILL.md and PICKER.md), whose picker's selected state falls short of WCAG 1.4.11 ([The contrast gap](#the-contrast-gap)). It answers this skill's no-direction case ([SKILL.md](SKILL.md#1-direction-first)) a second way: build named directions and let the user pick. Every state of one component is [STATE-PAGE.md](STATE-PAGE.md); reviewing finished work is [REVIEW.md](REVIEW.md). The source runs only when the user invokes it.

**Contents:** [Posture](#posture) · [Hard rules](#hard-rules) · [Workflow](#workflow) · [The picker](#the-picker) · [The contrast gap](#the-contrast-gap) · [Notes on the picker](#notes-on-the-picker) · [Invocations](#invocations) · [Tone](#tone) · [Prove it](#prove-it)

## Posture

[Emil Kowalski, prototype]
- It "does ONE thing: take a described piece of UI ('a toast', 'the pricing card', 'a hold-to-delete button'), build several genuinely different versions of it, and put them behind a visual picker so the user can flip through them live and choose a winner." Reviewing, planning fixes and choosing dependencies are other jobs.
- "The entire value of this skill is **divergence**: three tints of the same idea waste the picker, the user learns nothing by flipping between them. Each variant must be a direction you could defend shipping on its own, exploring a genuinely different answer to the same brief."
- **The craft bar:** "Every variant individually meets Emil Kowalski's standards: right easing (`ease-out` on entrances, never `ease-in`), sub-300ms UI motion, correct `transform-origin`, `transform`/`opacity` only, reduced-motion handled. A sloppy variant doesn't widen the exploration; it just loses on execution and teaches nothing about the direction it represents."
  - **Durations, both ways.** "sub-300ms UI motion" is the source's bar. ui-animation's: "A toggle is 120-180 ms, a modal 300-400 ms, a page transition 400-600 ms" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md#the-rules)). ui-animation's ranges stand here; app-ui does 350ms and 400ms panels instead (`--duration-medium: 350ms; /* panel close, toast close */`, `--duration-slow: 400ms; /* panel open, input clear */`, in [motion-tokens.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/base/motion-tokens.css)).
  - **Entrance curve:** ease-out arrivals are also the table's side in [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md#curves).

## Hard rules

[Emil Kowalski, prototype]
1. "**Never touch production code during exploration.** Everything lives in an isolated prototype surface (see Phase 4). Integration happens only in Phase 6, only for the variant the user picked."
2. "**Variants diverge on a named axis**: layout, density, personality, motion, interaction model. Before building, you must be able to state each variant's axis in a phrase. Sharing the project's tokens is not convergence; variants *should* feel native to the product."
3. "**Every variant fully works.** Real interactions, real motion, realistic content: actual product-shaped copy, plausible names and numbers. No lorem ipsum, no dead buttons, no 'imagine this part'."
4. "**The picker is chrome, not a contestant.**" Its exact markup, styles and behavior are in [The picker](#the-picker): copy them verbatim. "Its look is not a design decision and never adapts to the project."
5. "**Clean up after the choice.** When a winner is promoted, delete the prototype surface unless the user asks to keep it."

## Workflow

### Phase 1: Scope

[Emil Kowalski, prototype] "One thing per run. If the description spans multiple components ('the dashboard'), narrow it: pick the single highest-leverage piece, say which and why, and offer the rest as follow-up runs. Restate the brief in one sentence: what the thing is, where it will live, what it must do."

### Phase 2: Recon

[Emil Kowalski, prototype] Before designing anything:
- "**Stack**: framework, styling system (Tailwind, CSS modules, vanilla), motion library if any."
- "**Tokens**: colors, radii, spacing, fonts, easing/duration variables. Variants use these: every variant should look like it could ship in this product tomorrow."
- "**Personality**: playful consumer app or crisp dashboard? This bounds how far the boldest variant may go."
- "**Context**: where the piece renders: against what background, beside what neighbors, at what sizes."

**No project, both ways.** The source: "If there is no project (empty directory, or the user is just exploring), skip to the standalone branch in Phase 4 and choose a restrained default look: neutral grays, one accent, system font stack." This skill names that look a pattern, "Sterile default | Near-white, thin grey borders, small radius, generic font, no identity" ([PATTERNS.md](PATTERNS.md#color-and-surface)), and labels direction-less work "**draft without direction**" ([SKILL.md](SKILL.md#1-direction-first)). This skill's rule stands: label the set a draft without direction.

### Phase 3: Choose directions

[Emil Kowalski, prototype]
- "Default **3 variants**; up to 5 when the user asks or the design space is genuinely wide. More than 5 dilutes the comparison."
- "Before writing any code, list the set: a name and an axis for each. Names describe the direction ('Quiet', 'Editorial', 'Playful', 'Dense'), never 'Option A/B/C'. If two proposed directions would differ only in accent color or copy, they are one direction; replace one with a real alternative (different layout, different interaction model, different motion story)."
- "**Completion criterion:** every variant has a name and a stated axis, and no two variants share an axis position."

### Phase 4: Build the picker harness

[Emil Kowalski, prototype]
- "**In a project with a dev server**: an isolated route or page (`/prototypes/<slug>`, or the framework's equivalent), one file per variant plus a small harness file. Nothing imports from the prototype surface into production code."
- "**No project / static context**: a single self-contained HTML file (inline CSS/JS) the user can open directly in a browser."
- The harness renders "**one variant at a time, full size, in realistic surrounding context**: a toast needs a page behind it, a card needs siblings, a button needs a form. Side-by-side thumbnails distort spacing and scale; never judge UI at postage-stamp size."
- "Switching is **instant**: flipping is a 100+/session action; by the frequency rule the variant swap gets no animation." ui-animation keeps frequent motion short rather than removing it ("Anything a user triggers dozens of times a day stays near the bottom of its range"); at 100+ a session the source goes to none.

### Phase 5: Verify and hand off

[Emil Kowalski, prototype] "Run the harness. Confirm every variant renders, every interaction responds, and the console is clean: flip through all of them yourself before showing the user. If browser tooling is available, screenshot each variant." Then present the set and "**stop: the choice belongs to the user**":

| # | Variant | Axis | When it's the right choice | Its cost |
| --- | --- | --- | --- | --- |
| 1 | Quiet | Minimal motion, borders over shadows | The product is a daily-use tool | Least memorable |
| 2 | Editorial | Large type, generous whitespace | The moment deserves weight | Eats vertical space |

"Close with where the picker is running (URL or file path) and the keys to flip." "**Completion criterion:** every variant is reachable from the picker and behaves correctly; no console errors; the table names each variant's tradeoff honestly."

### Phase 6: Promote on selection

[Emil Kowalski, prototype] "When the user picks: integrate that variant where it belongs, following the project's existing conventions (file layout, naming, token usage), then delete the prototype surface per Hard Rule 5. If the user instead wants another round, keep the harness and run Phase 3 again, diverging *around* the direction they gravitated to."

## The picker

[Emil Kowalski, prototype, PICKER.md] "The picker's appearance is **not a design decision**: it is this spec. Copy the markup, CSS, and wiring below verbatim; the only values that change per run are the variant names and count. It stays identical across every project so it always reads as harness chrome, never as part of the design being judged. Do not restyle it with the project's tokens, fonts, or colors." "It is a floating dark pill, bottom-center. Dark glass works on top of any page, light or dark, which is why it is not theme-aware."

### Markup

"The sliding highlight span first, one button per variant, a hairline divider, then the replay button (only when at least one variant has motion to re-trigger)":

```html
<nav class="proto-picker" aria-label="Prototype variants">
  <span class="proto-picker-highlight" aria-hidden="true"></span>
  <button class="proto-picker-item" data-active aria-current="true">Quiet</button>
  <button class="proto-picker-item">Editorial</button>
  <button class="proto-picker-item">Playful</button>
  <span class="proto-picker-divider" aria-hidden="true"></span>
  <button class="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)">↻</button>
</nav>
```

"In a framework, keep the class names and structure; only the rendering syntax changes."

### Styles

```css
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  will-change: transform;
}

/* The slide is enabled only after first paint (data-ready), so load doesn't animate. */
.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

.proto-picker-item {
  position: relative; /* sits above the highlight */
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.proto-picker-item:hover {
  color: rgba(255, 255, 255, 0.85);
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}
```

### Rules

[Emil Kowalski, prototype, PICKER.md]
- "**Verbatim.** These values are the spec. No project fonts, no brand colors, no theme switching, no extra shadows or borders."
- "**The highlight slides; the variant swap stays instant.** The active pill animates between buttons (250ms, strong ease-out) as spatial feedback on the picker itself, but the variant being previewed still switches with no transition. The `width` transition is a deliberate exception to the transform/opacity rule: the element is 28px tall, absolutely positioned, and has no layout dependents, so the paint cost is negligible." That names when ui-animation's "**Only transform and opacity move,**" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md#the-rules)) can bend.
- "**One allowed modification:** if a variant occupies the bottom-center of the screen (a toast stack, a bottom sheet, a dock), set `data-position="top"` so the picker never covers the work. Nothing else about it may move or change."
- "**Replay is conditional.** Render the replay button and its divider only when at least one variant has an entrance or state animation worth re-triggering; a static comparison gets a shorter pill."

### Behavior contract

[Emil Kowalski, prototype, PICKER.md] "The contract is fixed regardless of how the harness renders:"
- "Number keys `1` to `N` and `←`/`→` switch variants; `R` replays. Ignore key events when focus is in an input, textarea, select, or contenteditable, or when a modifier is held."
- "Clicking an item switches to it; exactly one item carries `data-active` and `aria-current="true"` at all times, and the highlight slides to it."
- "Selection persists across reload via a URL param (`?v=2`), falling back to variant 1. The highlight takes its initial position without animating (`data-ready` is added after first paint)."
- "Switching re-mounts the variant (so entrance animations re-run); the replay key re-mounts without switching."

### Reference wiring

"Verbatim for the standalone-HTML branch; in a framework, keep the same behavior but express it idiomatically (state instead of `innerHTML`, a keyed re-mount instead of `requestAnimationFrame`, refs + a layout effect for the highlight measurement)."

```js
// `variants` is an array of render functions, one per variant, in picker order.
const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;

function moveHighlight() {
  const el = items[current];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}

function mount(i) {
  stage.innerHTML = '';
  // Clear first, render next frame, so entrance animations re-run.
  requestAnimationFrame(() => { stage.innerHTML = variants[i](); });
}

function setActive(i) {
  if (i < 0 || i >= variants.length) return;
  current = i;
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight();
  const url = new URL(location);
  url.searchParams.set('v', i + 1);
  history.replaceState(null, '', url);
  mount(i);
}

items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= variants.length) setActive(num - 1);
  else if (e.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (e.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (e.key === 'r' || e.key === 'R') mount(current);
});

setActive((parseInt(new URLSearchParams(location.search).get('v'), 10) || 1) - 1);
// Enable the slide only after first paint, so load doesn't animate.
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));
```

## The contrast gap

WCAG 2.2 SC 1.4.11 Non-text Contrast requires 3:1 against adjacent colors for "any visual information necessary to indicate state, such as whether a component is selected" ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). The source's picker falls short. Compositing the pill (`rgba(10, 10, 10, 0.82)`) over a white page gives `#363636`, over a black page `#080808` (the blur ignored); the active highlight (white at 12%) on it is `#4e4e4e` and `#262626`, which is **1.45:1** and **1.32:1** against the pill. The active text (`#fff`) against inactive text (55% white) is 2.48:1 over a white page and 3.19:1 over a black one. Over a light page no cue for the selected state reaches 3:1. The source gives no fix and this file adds none; the passing pairs are inactive text on the pill, 4.88:1 (white page) and 6.26:1 (black page), and the focus ring (white at 40%), 3.33:1 and 3.75:1.

## Notes on the picker

Where the picker meets this repo's other rules. The picker is harness chrome and is deleted after the choice; each note says which way it goes here.

- **z-index, both ways.** The picker sets `z-index: 2147483647` on a fixed element. This repo's rule: "a floating layer that needs one should be a `popover` or a modal `<dialog>` instead" ([modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md#use-them-and-the-top-layer)), since max int "wins the number, not the stacking context" ([DETAILS.md](DETAILS.md#stacking-without-z-index-wars)). The repo's rule stands.
- **`aria-current` on buttons.** MDN allows `aria-current="true"` for "the current item within a set", and says "When something is selected rather than current ... use `aria-selected`" ([aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)). app-ui marks pick buttons with `aria-pressed` instead ("preset tags are toggle pills (`aria-pressed`)", [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#badges-counts-and-avatars)), and the state page does the same ([STATE-PAGE.md](STATE-PAGE.md#behavior)).
- **Resize animates the highlight.** The wiring calls `moveHighlight` on `resize` once `data-ready` is set, so the highlight slides on a resize. app-ui does this instead: "Only a user's pick springs it, by pointer or keyboard. A saved value arriving, a reset, or a resize places it instantly" ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#segmented-tabs)).
- **The key guard checks tags only.** A custom `role="slider"` or `listbox` inside a variant still loses its arrow keys to the picker, and `e.repeat` is not filtered. The same modifier guard is app-ui's for global shortcuts ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#a-menu-that-is-its-trigger-grown)).
- **The press scale snaps.** `:active { transform: scale(0.97) }` has no transition on `transform`.

## Invocations

[Emil Kowalski, prototype]

| Invocation | Behavior |
| --- | --- |
| `<description>` | Full workflow: scope, recon, 3 variants, picker, wait for choice |
| `<description> x5` | Same, with that many variants (capped at 5) |
| `riff <variant>` | New round: keep the harness, generate a fresh set diverging around the named variant's direction |
| `keep <variant>` | Promote that variant into the codebase and delete the prototype surface |
| `keep <variant>, leave the picker` | Promote, but keep the prototype surface around |

## Tone

[Emil Kowalski, prototype] "Sell each variant honestly: one line on when it wins, one on what it costs. Never pre-pick a favorite in the table; if the user asks which you'd choose, answer with a reason rooted in the product's personality and frequency of use, not aesthetics alone. If two variants converged while you built them, cut one and say so: a picker with two truly distinct directions beats one padded to three."

## Prove it

Before building, the set lists a name and an axis per variant with no two on the same axis position. Run the harness: press `1` to `N` and the arrows, and each variant mounts full size in context with a clean console; `R` re-runs its entrance; reload keeps `?v=`; with reduced motion on, the highlight jumps instead of sliding. After `keep`, nothing in production imports from the prototype surface and the surface is gone.
