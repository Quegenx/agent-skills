# Semantics and ARIA

Native elements first, landmarks, accessible names, ARIA states for custom widgets and disabled controls. Source: [Jakub Krehel, better-accessibility, semantics-and-aria.md], with the rules of ARIA restated from the W3C note and state rules from MDN; additions are tagged where they appear.

## The rules of ARIA

The W3C note [Using ARIA](https://www.w3.org/TR/using-aria/) states four rules. It is now a "W3C Discontinued Draft 24 February 2026", and says "the four rules of ARIA are kept for historical purposes and for easier reference":

1. **First rule:** "If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so."
2. **Second rule:** "Do not change native semantics, unless you really have to."
3. **Third rule:** "All interactive ARIA controls must be usable with the keyboard."
4. **Fourth rule:** "Do not use role="presentation" or aria-hidden="true" on a focusable element."

The source listed a fourth rule, "All interactive elements must have an accessible name"; the W3C note has no numbered rule saying that. The requirement itself stands on its own (a name for every control, below), and the real fourth rule is the `aria-hidden` one in [SCREEN-READERS.md](SCREEN-READERS.md#aria-hidden).

No ARIA is better than bad ARIA. A screen reader trusts your roles, so a wrong one is worse than none. [Jakub Krehel, better-accessibility]

## Button vs link vs div

[Jakub Krehel, better-accessibility]

| Element | Use for | Why |
| --- | --- | --- |
| `<a href>` | Navigation: anything that goes somewhere or changes the URL | Free Cmd/Ctrl/middle-click, right-click to copy link, Enter activation |
| `<button>` | Actions: submit, toggle, open, delete | Free focus, Enter *and* Space activation, form semantics |
| `<div onClick>` | Nothing | No role, no focus, no keyboard; screen readers see plain text |

```tsx
// Bad: invisible to keyboard and screen readers
<div onClick={openSettings}>Settings</div>

// Good: focus, Enter/Space activation and semantics for free
<button onClick={openSettings}>Settings</button>
```

A "button" that navigates is a styled `<a>`, and a "link" that performs an action is a styled `<button>`.

Where a native element is truly impossible, the full polyfill is `role="button"` plus `tabindex="0"` plus Enter and Space handlers, which is why the native element is always less code.

## Landmarks and headings

[Jakub Krehel, better-accessibility]

- `<header>`, `<nav>`, `<main>`, `<aside>` and `<footer>` map to landmarks screen-reader users jump between. Expose one visible primary `<main>`.
- Multiple landmarks of the same type need distinguishing labels: `<nav aria-label="Primary">`, `<nav aria-label="Breadcrumbs">`.
- Headings are structure, not styling. Style a heading level with CSS instead of picking the tag by size. Headings describe their sections and form a coherent outline; one `<h1>` and no skipped levels are conventions, not WCAG criteria ([REVIEW.md](REVIEW.md#criteria-not-conventions)).
- `<title>` matches the current context, most specific first: `Billing · Settings · Acme` (2.4.2 Page Titled).

## Accessible names

[Jakub Krehel, better-accessibility]

Name precedence: `aria-labelledby` > `aria-label` > native label (`<label>`, text content, `alt`) > `title` attribute.

- Prefer visible text or `aria-labelledby` over `aria-label`, which is invisible, drifts out of sync with the UI and is handled inconsistently by translation tools.
- Icon-only buttons always need a name: `<button aria-label="Close">` with the icon `aria-hidden="true"`.
- WCAG 2.5.3 Label in Name: a button showing "Send" with `aria-label="Submit message"` breaks voice control users who say "click Send". Start the name with the visible text.

```tsx
// Good: name from visible text, icon hidden
<button>
  <TrashIcon aria-hidden="true" /> Delete
</button>

// Good: icon-only, explicit name
<button aria-label="Delete">
  <TrashIcon aria-hidden="true" />
</button>
```

SVG icons and their names are covered in depth in [svg/ACCESSIBILITY.md](../svg/ACCESSIBILITY.md#icons-in-buttons).

## Common ARIA mistakes

[Jakub Krehel, better-accessibility]

| Mistake | Why it fails |
| --- | --- |
| `aria-label` on a plain `<div>` or `<span>` | ARIA 1.2 prohibits naming the `generic` role, and most screen readers ignore it |
| `<button role="button">` | Redundant role; adds noise, no benefit |
| `aria-labelledby`/`aria-describedby` pointing at a missing ID | Silently produces no name or description |
| `role="menu"` on a nav list | `menu` promises app-style arrow-key behavior; site navigation is `<nav>` with a list |
| `role="switch"` with no `aria-checked` | MDN: "The `aria-checked` attribute is required when using the `switch` role" ([MDN switch role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/switch_role)). [transitions.dev] |
| A toggle button (a like button) with no `aria-pressed` | The on state is visible only. [transitions.dev] |
| `aria-current="true"` on buttons that choose an option | Valid for "the current item within a set", but MDN: "When something is selected rather than current ... use `aria-selected`" ([MDN aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)). [Emil Kowalski, prototype] uses `aria-current`; app-ui's preset tags are "toggle pills (`aria-pressed`)" ([app-ui/CONTROLS.md](../app-ui/CONTROLS.md)), and "A router marks every link to the current page `aria-current="page"`" ([app-ui/MENUS.md](../app-ui/MENUS.md)) |

A switch built on `<button role="switch" aria-checked>` toggles on Space and Enter; [feel]'s heavy toggle adds ArrowRight for on and ArrowLeft for off. A slider built on `role="slider"` carries `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and a human `aria-valuetext` (feel's knob: `"i+1 of n"` over its 11 detents), with arrows and Home/End. [feel]

## Disabled states

[Jakub Krehel, better-accessibility]

Native `disabled` supplies the platform's complete disabled behavior. It removes the control from the tab order, suppresses activation, applies `:disabled` and excludes form controls from submission. `aria-disabled="true"` only announces the state, changing neither focusability, nor behavior, nor styling.

- Never disable submit to gate validation. Validate on submit instead ([FORMS.md](FORMS.md#submit-behavior)).
- A natively `disabled` control suppresses pointer events and leaves the tab order, so a tooltip on it never opens for keyboard or touch users. Put the reason in visible text beside the control, or switch to `aria-disabled="true"`, which keeps it focusable and hoverable.
- Use `aria-disabled="true"` where keeping a control discoverable in the tab order is intentional, or where a custom control cannot use native `disabled`.
- With `aria-disabled="true"`, block pointer and keyboard activation in the handler and prevent form submission where applicable. Add explicit styling, including forced-colors support, and explain nearby why the action is unavailable.
- Never set both `disabled` and `aria-disabled` on the same element.
- Disabled controls are exempt from contrast minimums. Understanding 1.4.3: "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements" ([Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). [Jakub Krehel, break] lists "Contrast collapse" under Disabled as a break; under WCAG it is a design choice, and only the focus behavior of a disabled control is a finding.

app-ui does this instead: "Search submit is disabled until the query has non-space text" ([app-ui/DATA-VIEWS.md](../app-ui/DATA-VIEWS.md)).

## Prove it

Every clickable element is a `<button>` or `<a href>` (`grep -rnE '<(div|span)[^>]*onClick' src/` is empty, or each hit has `role`, `tabindex="0"` and Enter and Space handlers); the accessibility tree shows one `<main>`, a label on every repeated landmark, and a page title that changes per view; each control's computed name starts with its visible text; no `aria-labelledby` or `aria-describedby` points at a missing id; every `role="switch"` has `aria-checked` and every toggle button `aria-pressed`; and no element carries both `disabled` and `aria-disabled`.
