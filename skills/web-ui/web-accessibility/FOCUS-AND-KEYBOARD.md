# Focus and keyboard

Focus rings, focus that sticky chrome cannot hide, skip links, tabindex, focus trapping and restoration, the APG keyboard patterns and client-side route changes. Source: [Jakub Krehel, better-accessibility, focus-and-keyboard.md], checked against WCAG 2.2 and the APG; additions from fluid-functionalism and transitions.dev are tagged where they appear.

**Contents:** [Focus rings](#focus-rings) · [Focus not obscured](#focus-not-obscured) · [Skip link](#skip-link) · [tabindex rules](#tabindex-rules) · [Focus trapping and restoration](#focus-trapping-and-restoration) · [Keyboard patterns (ARIA APG)](#keyboard-patterns-aria-apg) · [SPA route changes](#spa-route-changes) · [Prove it](#prove-it)

## Focus rings

[Jakub Krehel, better-accessibility]

The browser shows `:focus-visible` for keyboard and assistive-tech focus. It suppresses it for mouse clicks on buttons and links but still shows it in text inputs. An `outline: none` or `focus:outline-none` with no visible replacement leaves sighted keyboard users with no way to see where they are.

The browser's unmodified indicator adapts to platform and forced-color settings without the author predicting every background. Adding only `outline-offset` preserves it. A custom `outline: 2px solid` with no color renders `currentColor`, which may fail against the colors the outline crosses. The preference order:

```css
/* Best: keep the browser ring, just give it breathing room */
:focus-visible {
  outline-offset: 2px;
}

/* Custom ring when the design requires one: use the project's verified token */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

```tsx
// Tailwind: use the project's focus token or established focus-ring utility
<button className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
  Save
</button>
```

- **Why the default ring is the safe choice:** Understanding 1.4.11 says "the default focus style is exempt from contrast requirements (but must still be visible)" ([Understanding Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). An author-styled ring is not exempt.
- **Check a custom ring's whole perimeter** against every adjacent color it crosses: component fills, page surfaces, images, gradients, and hover and selected states, at 3:1 (1.4.11). A token, brand color or `currentColor` passes only when that rendered check does.
- **The AAA target** (2.4.13 Focus Appearance) is a perimeter at least 2 CSS px thick with a 3:1 contrast change between focused and unfocused states. It is a recommendation, not a finding ([REVIEW.md](REVIEW.md#criteria-not-conventions)).
- **Forced colors.** In `forced-colors: active` (Windows High Contrast), keep the default color adjustment or name a system color such as `Highlight`. `forced-color-adjust: none` freezes the authored color, so use it only where you have checked the control stays perceivable. The transparent-border technique for forced colors is in [modern-css QUERIES-AND-PREFERENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/QUERIES-AND-PREFERENCES.md#forced-colors).
- **Group with `:focus-within`** when a wrapper should light up while an inner input has focus, such as a search box with an icon inside the border.
- **One indicator for pointer and keyboard** in a menu or list: the highlighted row is the focus indicator, so keyboard and pointer focus look identical. [fluid-functionalism]

app-ui does this instead: "No control shows a focus ring, outline or focus border, the browser default included: a standing decision recorded in the design doc" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)).

## Focus not obscured

[Jakub Krehel, better-accessibility]

2.4.11 Focus Not Obscured (Minimum), AA: a focused component is not entirely hidden by author-created content. Sticky chrome hides whatever scrolls under it, including the element that just received focus. Pad the scroll container by the sticky element's height:

```css
html {
  scroll-padding-top: 64px; /* the sticky header's height */
}
```

A sticky footer or cookie banner needs `scroll-padding-bottom` the same way.

A non-modal overlay (a slide-in, a sticky bar, a cookie notice) passes 2.4.11 when it is modal, when scroll padding reserves its space, or, for a notification that needs no action, when it closes on losing focus; one that neither takes focus nor closes when focus leaves "will be at risk of failing" where it can cover focusable items ([Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)). Popup rules beyond focus are in [cro POPUPS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/POPUPS.md#accessibility).

**Cookie banners** [c15t]: provider-specific blocking, notice behavior and release checks are in [cookie-consent BANNER-UI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/BANNER-UI.md#blocking-and-non-blocking) and [cookie-consent VERIFY-CONSENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/VERIFY-CONSENT.md). Apply the generic focus-obscuration rule above to any non-blocking banner.

## Skip link

[Jakub Krehel, better-accessibility]

When repeated navigation or chrome precedes the main content, make a "Skip to content" link the first focusable element. Target `<main id="main">` and visually hide the link until focused:

```css
.skip-link {
  position: absolute;
  inset-inline-start: -999px;
}
.skip-link:focus {
  inset-inline-start: 16px;
  inset-block-start: 16px;
}
```

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>…</header>
  <main id="main">…</main>
</body>
```

Give in-page anchor targets `scroll-margin-top`, such as `80px` under a sticky header, so the target isn't hidden when jumped to.

## tabindex rules

[Jakub Krehel, better-accessibility]

- `tabindex="0"`: adds an element to the natural tab order. Only for custom interactive elements that aren't natively focusable.
- `tabindex="-1"`: focusable via JavaScript only (`el.focus()`). Use for headings you move focus to, modal containers and roving-tabindex members.
- Positive `tabindex`: never. It hijacks the tab order for the whole page. Fix the DOM order instead.

### Roving tabindex

Composite widgets, meaning tabs, menus, toolbars and radio groups, occupy one Tab stop. The active item has `tabindex="0"`, all others `tabindex="-1"`, and arrow keys move both focus and the `0`:

```tsx
<div role="tablist">
  {tabs.map((tab, i) => (
    <button
      role="tab"
      tabIndex={i === activeIndex ? 0 : -1}
      aria-selected={i === activeIndex}
      onKeyDown={handleArrowKeys} // ArrowLeft/ArrowRight move activeIndex, wrapping
    >
      {tab.label}
    </button>
  ))}
</div>
```

The `0` goes to the selected item, else the first; without one, "the whole group becomes unreachable by keyboard". [fluid-functionalism]

### aria-activedescendant

A combobox keeps DOM focus in its input instead. Point `aria-activedescendant` on the input at the `id` of the highlighted option and update it on arrow keys. On the last option, the APG says Down Arrow "either returns focus to the combobox or does nothing" ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)); [fluid-functionalism] clears the highlight past the last row (the input is the stop) and wraps on the next press, calling that the APG pattern; the wrap is outside the APG's two options.

## Focus trapping and restoration

[Jakub Krehel, better-accessibility]

Native `<dialog>` with `showModal()` makes everything behind it inert and closes on Escape:

```tsx
dialogRef.current.showModal(); // on open
dialogRef.current.close(); // on close
triggerRef.current?.focus(); // return focus to the element that opened it
```

A custom overlay that can't use `<dialog>` needs `role="dialog"`, `aria-modal="true"` and an accessible name via `aria-labelledby`. Put `inert` on everything behind it, which removes background content from the tab order and from assistive tech in one move:

```tsx
// On open
document.getElementById("app-content").inert = true;
const dialog = dialogRef.current;
(dialog.querySelector("[autofocus]") ??
  dialog.querySelector("button, [href], input, select, textarea"))?.focus();

// On close
document.getElementById("app-content").inert = false;
triggerRef.current?.focus();
```

Either way:

- On open, focus the first focusable element. For destructive confirmations, focus the least destructive action instead.
- The APG adds ([Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)): `aria-labelledby` "refers to a visible dialog title"; "It is strongly recommended that the tab sequence of all dialogs include a visible element with role button" that closes it; focus may start on a static element at the top when focusing the first interactive element would scroll the start of the content out of view; "Windows under a modal dialog are inert."
- On close, return focus to the trigger, or to the nearest logical container if the trigger is gone.
- A dialog that opened on its own (a timed, scroll or exit popup) has no trigger. For a missing invoker the APG says "focus is set on another element that provides logical work flow"; reading, not stated by the APG: for a popup that is where focus was before it opened.
- When an inline element (a banner, a chip) is dismissed, focus moves to the next focusable element after it, else the one before, "not back to the top of the page". [fluid-functionalism]
- A closed menu, panel or toast hidden only with `opacity: 0` and `pointer-events: none` stays focusable and in the accessibility tree; hide the closed state with `visibility: hidden` or `inert` as well, as app-ui's disclosure panel does ("Closed panels also get `inert`", [app-ui/reference/styles/ui/display/disclosure-panel.css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/styles/ui/display/disclosure-panel.css), which also sets `visibility: hidden` once closed). [transitions.dev]

The `<dialog>`, `closedby` and `inert` details and their browser support are in [modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md).

## Keyboard patterns (ARIA APG)

[Jakub Krehel, better-accessibility], corrected against the APG pattern pages.

Native elements come with these behaviors; custom widgets must implement them.

| Widget | Keys |
| --- | --- |
| Dialog | Tab/Shift+Tab cycle inside (wrap at ends); Escape closes |
| Tabs | Left/Right Arrow move between tabs (wrapping); Tab exits to the panel; Home/End jump to first/last. Each tab has `aria-controls` pointing at its `tabpanel`, and each panel has `aria-labelledby` pointing back at its tab ([APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)) |
| Menu button | Enter and Space open the menu and focus an item. Down Arrow (open, focus first item) and Up Arrow (open, focus last item) are marked "(Optional)" in the APG ([APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)); inside the menu, arrows navigate and Escape closes and refocuses the button |
| Disclosure / accordion | Header is a `<button aria-expanded>`; Enter and Space toggle |
| Combobox | Down Arrow opens or moves into the list; Enter accepts; Escape closes and returns to the input; typing filters |
| Listbox / radio group | Arrow keys move selection; one Tab stop for the whole group |
| Tooltip | Escape dismisses the tooltip ([APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)); see 1.4.13 in [MOTION-AND-ZOOM.md](MOTION-AND-ZOOM.md#content-on-hover-or-focus) |

The source's table listed ArrowDown and ArrowUp beside Enter and Space as the menu button pattern; the APG requires Enter and Space and marks the arrows optional. A tabs widget built with `role="tablist"` and `role="tab"` that responds to clicks only is missing the APG arrow keys, `aria-controls` and the panel's `aria-labelledby`. [transitions.dev]

Universal rules:

- Escape dismisses whatever opened last: tooltip, then menu, then dialog.
- Tabs choose activation mode: automatic (panel switches on arrow focus) when panels render instantly, manual (Enter/Space to activate) when switching is expensive.
- Enter in a single-line text input submits its form natively. In `<textarea>`, Enter inserts a newline, and Cmd/Ctrl+Enter submits only if you implement it.

## SPA route changes

[Jakub Krehel, better-accessibility]

Client-side navigation doesn't reset focus or announce anything. On route change, update `document.title` to match the new context, then move focus to the new view's `<h1>` (given `tabindex="-1"`) or to `<main>`. Restore scroll position on history traversal with back and forward, and scroll to top on a new navigation.

## Prove it

With the mouse unplugged, every flow completes, every stop shows a focus indicator, and the order matches the screen; no `tabindex` above 0 exists (`grep -rnE 'tabindex="[1-9]|tabIndex=\{[1-9]' src/` is empty); a focused field never sits fully under the sticky header, a sticky bar or a non-modal cookie banner; the skip link appears on the first Tab and lands in `<main>`; each composite widget is one Tab stop and the arrows move inside it; every dialog has a visible title and a visible close button, takes focus on open, holds it, closes on Escape and returns focus to its trigger; a closed overlay cannot be reached by Tab; and after a client-side navigation the tab title has changed and focus sits on the new heading or `<main>`.
