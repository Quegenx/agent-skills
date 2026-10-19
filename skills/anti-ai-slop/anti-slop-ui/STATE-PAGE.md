# State page: every state of one component, a keypress apart

A throwaway page inside the app that renders one real component in every state its code can reach, fed by mock data, with a switcher to flip between states while you work on the visuals. It is Jakub Krehel's `state-machine` skill (jakubkrehel/skills: SKILL.md and switcher.md). This skill's rule "map every state the screen can reach and only those" ([SKILL.md](SKILL.md#3-absolute-no-purpose-excuses-these)) says what; this file is how. The owner's app prescribes what each state looks like in [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md); a Flutter app gets the same from widget previews ([flutter AGENT-TOOLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#widget-previews)).

**Contents:** [What it is for](#what-it-is-for) · [1. Scope one component](#1-scope-one-component) · [2. Find the states in the code](#2-find-the-states-in-the-code) · [3. Build the throwaway page](#3-build-the-throwaway-page) · [4. Feed each state at the data boundary](#4-feed-each-state-at-the-data-boundary) · [5. The switcher](#5-the-switcher) · [6. Confirm every state, then hand over](#6-confirm-every-state-then-hand-over) · [Remove it](#remove-it-in-one-step-on-the-users-word) · [Where the owner's app differs](#where-the-owners-app-differs) · [Before you finish](#before-you-finish) · [Prove it](#prove-it)

## What it is for

[Jakub Krehel, state-machine] "It is a workbench, not a review. The page stays up while the user works on the visuals, one state on screen and every other a keypress away." In the source, stacking hostile scenarios on one page is its `break` skill (here the nearest is [browser-ui-qa ADVERSARIAL-UI-QA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/ADVERSARIAL-UI-QA.md) in e2e-testing), exploring alternative designs is [VARIANTS.md](VARIANTS.md), and reviewing finished work is [REVIEW.md](REVIEW.md). The source runs only when the user invokes it.

## 1. Scope one component

[Jakub Krehel, state-machine]
- "One component per run: the audit log table, the network panel, the billing card. 'The settings page' spans several, so list them and ask which one."
- "Restate it in one sentence: what the component shows, where it renders in production and where its data comes from."

## 2. Find the states in the code

[Jakub Krehel, state-machine] "The states are the branches the component already has. Read it and its data hooks for every one:"

| Kind | States |
| --- | --- |
| Data | Loading, empty, error, one item, a typical set, a set long enough to scroll or paginate, some requests resolved and others pending, stale data refetching |
| Account | Plan tier, role and permission checks, an owner versus a member |
| Feature | Flags, trials, limits reached, a disabled or locked feature |

- "A state the code cannot reach is not a state. Do not add a branch to render one. Where the design shows a state the code lacks, list it as missing and leave it out."
- "Write the set down before building, one line each, named the way the product talks about it: `empty`, `enterprise`, `member-no-access`."
- "Group them under headings in the product's words, by what changes. Use `Data` and `Account` or narrower ones such as `Connection` or `Access`." The switcher shows these groups.
- "Say which kinds you dropped and why in one line."
- "Combine kinds only where the code branches on the combination, such as `member-empty`, never as a cross product."

## 3. Build the throwaway page

[Jakub Krehel, state-machine]
- "A scratch route inside the app holds the real component, imported from the project and untouched. The route inherits the app's layout, fonts, global styles and providers for free."
- "Where the framework splits server from client components, the page is client code, `"use client"` in Next. Otherwise fixture data can silently vanish crossing that boundary, and the page renders empty." The silent loss is the author's experience; the Next.js docs say only that "Props passed to Client Components need to be serializable by React" ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)).
- **Wrap the switcher's `useSearchParams` in `Suspense`.** The source leaves this out. The page reads `__state`, and "During production builds, a static page that calls `useSearchParams` from a Client Component must be wrapped in a `Suspense` boundary, otherwise the build fails". Development hides it: "`useSearchParams` doesn't suspend and things may appear to work without `Suspense`" ([useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)).
- "Render one instance in a container as wide as the component is in production. The container, the fixtures and the switcher are everything the page adds, with no fonts, styles or themes of its own."
- "Keep the page, its fixtures and its switcher in one folder, such as `/states/audit-log`, so removal is one delete."

## 4. Feed each state at the data boundary

[Jakub Krehel, state-machine] "Supply the data where the component receives it, from the page, without editing the component." In order of preference:

1. Props, where the component takes its data as props.
2. "The app's own data seam: a seeded query cache, a mock provider or the project's request mocks."

- "A fixture threaded through props five levels down tests a path production never takes. Where the only way in is editing the component, say so and ask before adding a seam." The same line as e2e-testing's "**Mock only where a production boundary already isolates the external system.**" ([tester-army-e2e VERIFICATION-SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/VERIFICATION-SKILL.md)).
- "Make the data look like the product. Real-shaped names, timestamps, amounts and the item counts users actually have. Three rows of 'Test item' make every state look fine." This skill says the same of marketing demos ([PATTERNS.md](PATTERNS.md#content-and-function), "Pristine demo"); here it covers development fixtures too.
- "Loading and pending states hold still. Keep them pending until the switcher moves, rather than resolving after a timeout."

## 5. The switcher

[Jakub Krehel, state-machine] "A grouped list beside the component flips the `__state` search param, so every state is a link. Where there is no room beside the component, it moves above it as a select with the same groups. The double underscore keeps it clear of any param the app's layout reads." switcher.md: "It sits beside the thing being judged, so build the spec below and leave it alone."

### Deliberately outside the design system

[Jakub Krehel, state-machine, switcher.md] "Never style the switcher with the project's tokens, fonts or colors. One that looks native to the product becomes part of what you are looking at." "One dark neutral surface, the system font stack and no project variables. It does not follow the theme, because dark reads as chrome over both light and dark pages."

### A grouped list, so it scales

[Jakub Krehel, state-machine, switcher.md] "A row of tabs runs off the screen past about seven states; a grouped list stays scannable at thirty."
- "Every group has a heading, even when there is only one, and every heading carries the same small arrow icon."
- "States and groups keep the order they were written down in."

### Behavior

[Jakub Krehel, state-machine, switcher.md]
- "It sets a `__state` search param and reads the active state back from it. The URL is the source of truth, so every state is a link."
- "The arrow keys, up and down or left and right, step through every state in list order, across groups."
- "`H` hides and shows the switcher, list and select alike, for screenshots and screen recordings."
- "Key handling ignores events with a modifier key, events already `defaultPrevented` and events from inputs, textareas, selects and contenteditable elements."
- "The active button carries `aria-pressed="true"` and scrolls into view inside the list. The list carries a label, and each group is a `role="group"` labelled by its heading."
- "The component switches instantly and keeps the scroll position. Only the active label eases its font weight." Font weight does interpolate: MDN lists its animation type as "by computed value type" ([font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight)).
- "The list and the select are both always rendered, and a container query shows one, so the active state survives a resize."

**The selected state and WCAG 1.4.11.** SC 1.4.11 Non-text Contrast requires 3:1 against adjacent colors for "any visual information necessary to indicate state, such as whether a component is selected" ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). The switcher falls short, the same gap as the variant picker's ([VARIANTS.md](VARIANTS.md#the-contrast-gap)). Compositing the list (`rgb(20 20 20 / 0.92)`) over a white or a black page, the active background (white at 14%) is 1.56:1 and 1.49:1 against the list, and the active text (`rgb(255 255 255)`) against inactive text (60% white) is 2.36:1 and 2.60:1. The other change, font weight 500, is not a color. The source gives no fix and this file adds none.

**`aria-pressed` or `aria-current`.** MDN defines `aria-pressed` as "the current 'pressed' state of a toggle button" ([aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)); pressing a toggle again releases it, and pressing the active state here does not. For one current item in a set, MDN's `aria-current` fits: "the current item within a container or set of related elements ... Only mark one element in a set of elements as current" ([aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)). So `aria-pressed` here is questionable, not invalid. The owner's app makes the same choice: its range presets are "each `aria-pressed` when the range matches it" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md#date-range-picker)). The variant picker uses `aria-current` ([VARIANTS.md](VARIANTS.md#notes-on-the-picker)).

### Structure

[Jakub Krehel, state-machine, switcher.md]

```html
<div class="state-page">
  <div class="state-layout">
    <nav class="state-switcher" aria-label="States">
      <!-- one group per heading -->
      <div class="state-switcher-group" role="group" aria-labelledby="states-data">
        <span class="state-switcher-heading" id="states-data">
          <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v4a3 3 0 0 0 3 3h7" /><path d="m10 7 3 3-3 3" /></svg>
          Data
        </span>
        <button type="button" data-state="loading" aria-pressed="false">Loading</button>
        <button type="button" data-state="empty" aria-pressed="true">Empty</button>
      </div>
    </nav>

    <div class="state-switcher-select">
      <select aria-label="State">
        <optgroup label="Data">
          <option value="loading">Loading</option>
          <option value="empty" selected>Empty</option>
        </optgroup>
      </select>
      <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4" /></svg>
    </div>

    <div class="state-stage">
      <!-- the component, in a container as wide as it is in production -->
    </div>
  </div>
</div>
```

### Placement and styling

[Jakub Krehel, state-machine, switcher.md] A container query on the page picks the layout:
- "**Room for the list beside the component:** two columns, the list then the component at its production width. The list is sticky and scrolls inside itself once it outgrows the viewport, so it stays put while you flip states."
- "**No room:** the select sits above the component, in the page flow. A phone opens its native menu for it, which suits a long list."

"The page spans the full viewport width, because an app's layout often caps content near the component's own width. The query measures the page inside its padding, so the breakpoint is the list and the gap plus the component, which is 232px plus the production width. The CSS below uses a 644px component. Put the production width in `max-width` and the grid column, and set the query to 232px plus it."

"The list's 6px padding keeps its own scrolling from clipping focus rings. The reset strips the select's native arrow, so the chevron is what shows it opens."

```css
.state-page {
  container: state-page / inline-size;
  margin-inline: calc(50% - 50vw);
  padding: 24px;
}

.state-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 644px;
  margin-inline: auto;
}

.state-switcher {
  all: unset;
  display: none;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  scrollbar-width: none;
  padding: 6px;
  border-radius: 14px;
  background: rgb(20 20 20 / 0.92);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  font: 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  user-select: none;
}

.state-switcher-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.state-switcher-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 6px;
  font-size: 11px;
  font-weight: 500;
  color: rgb(255 255 255 / 0.45);
}

.state-switcher button {
  all: unset;
  flex: none;
  padding: 8px 10px;
  border-radius: 8px;
  font: inherit;
  color: rgb(255 255 255 / 0.6);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 200ms ease-out, font-weight 200ms ease-out;
}

.state-switcher button:hover {
  color: rgb(255 255 255 / 0.85);
}

.state-switcher button[aria-pressed="true"] {
  background: rgb(255 255 255 / 0.14);
  color: rgb(255 255 255);
  font-weight: 500;
}

.state-switcher button:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.7);
  outline-offset: 2px;
}

.state-switcher-select {
  position: relative;
  align-self: flex-start;
  max-width: 100%;
  color: rgb(255 255 255);
}

.state-switcher-select select {
  all: unset;
  box-sizing: border-box;
  max-width: 100%;
  padding: 10px 36px 10px 16px;
  border-radius: 999px;
  background: rgb(20 20 20 / 0.92);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
  font: 500 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  cursor: pointer;
}

.state-switcher-select select:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.7);
  outline-offset: 2px;
}

.state-switcher-select svg {
  position: absolute;
  top: 50%;
  right: 14px;
  translate: 0 -50%;
  pointer-events: none;
  color: rgb(255 255 255 / 0.6);
}

/* 208px list + 24px gap + 644px component */
@container state-page (min-width: 876px) {
  .state-layout {
    display: grid;
    grid-template-columns: 208px 644px;
    justify-content: center;
    gap: 24px;
    align-items: start;
    max-width: none;
  }

  .state-switcher {
    display: flex;
    position: sticky;
    top: 24px;
  }

  .state-switcher-select {
    display: none;
  }
}
```

"`all: unset` keeps the project's global button, nav and select styles out. In a framework, keep the class names and the structure and change only the rendering syntax." MDN: `all` is "shorthand for all CSS properties except for `unicode-bidi`, `direction`, and custom properties", and `unset` resets each property "to their inherited values if they inherit by default, or to their initial values if not" ([all](https://developer.mozilla.org/en-US/docs/Web/CSS/all)).

## 6. Confirm every state, then hand over

[Jakub Krehel, state-machine]
- "Load the page once in a browser already at hand and flip through every state. The component shows the mock data, not the real data and not a blank region. Mock data that never appears is the common failure here. Live sync, a cache that refetches over the seed or a server boundary dropping the fixture all cause it. Fix the plumbing before handing over."
- "With no browser at hand, say so and hand the URL over for the user to check."
- "Then hand over the URL, the state list and the switcher keys. Stop there. Changing how a state looks is the user's next request, not part of this one."
- **Re-check after each change:** "After a visual change, flip through every state again, since a fix for one state often breaks another."

## Remove it in one step, on the user's word

[Jakub Krehel, state-machine] "Delete the page folder and any seam the user approved. Then search the codebase for the route and fixture names, and check that the diff touches nothing else of the setup. Commit only when asked." Never in the same turn it was built: "Remove it only on the user's word."

## Where the owner's app differs

The page is temporary, so these matter only while it exists; each needs the owner's call if a state page lands in the owner's app. Two ways out: exclude the `/states/` folder from the checker while the page lives, or write the switcher in rem and logical properties.

- **Focus ring.** The switcher draws `outline: 2px solid rgb(255 255 255 / 0.7)` on `:focus-visible`. app-ui has "no focus ring anywhere (a recorded design decision, the browser default included: `:focus, :focus-visible { outline: none }` in the base layer)" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)). The switcher's own rule overrides that base-layer rule, so a ring shows on the scratch page.
- **Raw colors.** Every switcher color is a raw `rgb()`. app-ui's checker flags "hex, `rgb()`, `hsl()`, `oklch()` outside a token definition line in a token source file" (`rule/raw-value`, [app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md)).
- **Units.** The switcher sizes spacing, type and its breakpoint in px (`padding: 24px`, `font: 13px/1`, `grid-template-columns: 208px 644px`, `min-width: 876px`). [modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md#units): "`px` | only thin borders (hairlines, outlines) and shadows (the owner's rule)". Its full-bleed `margin-inline: calc(50% - 50vw)` does belong to the whole screen, which `vw` allows, but the check wants that rule marked as belonging to the whole screen ([modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md#enforce-what-a-script-can-see)).
- **Physical properties.** `right: 14px`, `top: 50%`, `top: 24px`. app-ui: "**Logical properties and both directions.** `inline-start` not `left`" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md#the-rules)). In right-to-left the select's chevron sits on the wrong side.

## Before you finish

[Jakub Krehel, state-machine]

| Mistake | Fix |
| --- | --- |
| The component edited to accept fixtures | Feed data from the page through props or the app's data seam; ask before adding a seam |
| A rebuilt lookalike component on the page | Import the real component from the project |
| The page restyles or re-themes the component | The app's layout, fonts and tokens as they are |
| Fixtures passed as props deep in the tree | Supply the data where the component receives it |
| A branch added to the component to show a state | Leave out states the code cannot reach, and list missing ones |
| "Item 1", "Test user", three rows | Product-shaped data in real quantities |
| Loading resolves after a timeout | Hold it until the switcher moves |
| Handed over without loading each state | Load every state; a blank or real-data state means broken plumbing |
| Switcher styled with the project's tokens | Keep it visibly outside the design system |
| One long row of tabs, one per state | A grouped list beside the component that scrolls on its own; a select above it where the list does not fit |
| Visuals changed unasked | Hand over and wait |
| Page deleted in the same turn it was built | Remove it only on the user's word |
| Route or fixture names left behind | Search for both after removal |

## Prove it

Run a production build of the state page (in Next, this catches a `useSearchParams` with no `Suspense`). Open it and step through every state with the arrow keys: each shows mock data, never real data or a blank region, and loading states stay pending. Copy a state's URL into a new tab: it opens on that state. Resize across the breakpoint: the list and the select swap and the active state survives. Press `H`: the switcher hides. After removal, search for the route and fixture names: nothing left.
