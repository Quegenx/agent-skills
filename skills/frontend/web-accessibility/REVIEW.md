# Accessibility review

How to review a screen, a component or a change for accessibility: the two walks, what counts as a finding, severity on the repo's P0 to P3 scale, verification, the report and the grep table. Sources: [Jakub Krehel, better-accessibility, SKILL.md] for the method, [Jakub Krehel, better-interface] for the escalation triggers and the fix ladder, [Jakub Krehel, interface-review] for the removed-signals pass, corrected against WCAG 2.2. Severity uses the scale in [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md).

**Contents:** [Two walks](#two-walks) · [Criteria, not conventions](#criteria-not-conventions) · [Severity](#severity) · [Fix the cheapest way](#fix-the-cheapest-way) · [Verification](#verification) · [The report](#the-report) · [Reviewing a change: removed signals](#reviewing-a-change-removed-signals) · [Before you finish](#before-you-finish) · [Prove it](#prove-it)

## Two walks

[Jakub Krehel, better-accessibility]

1. **Keyboard only:** every flow completes without a mouse.
2. **Screen reader:** every control announces a name, a role and its state.

When unsure, take the platform default over a custom rebuild, and remove ARIA rather than add it.

## Criteria, not conventions

[Jakub Krehel, better-accessibility]

A finding cites a WCAG 2.2 Level A or AA criterion by number, or a concrete task an assistive-technology user cannot complete. Everything else is a recommendation, ranked P2 or P3 at most: AAA criteria (2.3.3 Animation from Interactions, 2.4.13 Focus Appearance, 2.5.5, 44 by 44 px), APG conventions, the one-`<h1>` and no-skipped-levels outline, and the 44px and 40px targets. The criterion thresholds are exact. The larger targets are heuristics, so keep an established, usable density.

Evidence, not taste: a density, radius or voice you merely disagree with is not a finding. A documented project convention settles taste, but never excuses a criterion failure. [Jakub Krehel, better-interface]

In the owner's apps, four departures are recorded design decisions, each noted where it applies: no focus ring ([FOCUS-AND-KEYBOARD.md](FOCUS-AND-KEYBOARD.md#focus-rings)), `role="alert"` on field errors ([FORMS.md](FORMS.md#error-messaging)), a search submit disabled until there is a query ([SEMANTICS-AND-ARIA.md](SEMANTICS-AND-ARIA.md#disabled-states)) and native `disabled` while pending ([FORMS.md](FORMS.md#submit-behavior)). Report them, if at all, as recorded decisions with their risk, not as bugs.

## Severity

The source ranks `HIGH`, `MEDIUM` and `LOW` and ends `Block` or `Approve`. This skill maps that onto P0 to P3 once, here: `HIGH` is **P0** when it blocks the primary task or is a severe accessibility failure, otherwise **P1**; `MEDIUM` is **P2**; `LOW` is **P3**. `Block` means a P0 or P1 remains; `Approve` means none does, leaving P2 and P3 as work to do.

- **P0 or P1** prevents a task, hides content from assistive technology or is a systemic failure (one shared token or component behind many locations). [Jakub Krehel, better-accessibility]
- **P2** makes an interaction meaningfully harder. **P3** is isolated polish.
- Within a level, rank by reach: a token or shared-component fix outranks the same symptom in one leaf. [Jakub Krehel, better-interface]

**On sight, P1 at least, never averaged down because the surface is minor** [Jakub Krehel, better-accessibility and better-interface], each with the criterion it breaks:

| Trigger | Criterion |
| --- | --- |
| An interactive control with no accessible name | 4.1.2 Name, Role, Value |
| A keyboard-reachable control with no visible focus indicator | 2.4.7 Focus Visible |
| Reachable by pointer but not by keyboard | 2.1.1 Keyboard |
| Autoplaying motion over five seconds, in parallel with other content, with no pause, stop or hide mechanism | 2.2.2 Pause, Stop, Hide, A |
| Clipped, overlapped or unreachable at 320 CSS px wide or at 200% text | 1.4.10 Reflow and 1.4.4 Resize Text, AA |
| Body or control text whose rendered contrast pair fails | 1.4.3 Contrast (Minimum), AA |
| State or meaning carried by color alone | 1.4.1 Use of Color |

The source's own list also put "motion ignoring reduced motion" HIGH on sight, which contradicts its rule that AAA is never HIGH: interaction motion falls under 2.3.3, Level AAA ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)). Here, interaction motion that ignores `prefers-reduced-motion` is a P2 recommendation, and only the autoplay case above is a trigger ([MOTION-AND-ZOOM.md](MOTION-AND-ZOOM.md#which-criterion-motion-falls-under)).

A cap may shorten a report; it may never be why a blocker went unreported. List triggers first. [Jakub Krehel, better-interface]

## Fix the cheapest way

[Jakub Krehel, better-interface]

Take the earliest rung that works: (1) delete (an ARIA attribute a native element makes redundant); (2) use the platform (a native element or control, the browser's own focus ring); (3) reuse a project token; (4) correct the value; (5) add. When the code under review adds what Delete would fix, that is a finding, and its After is the deletion.

## Verification

[Jakub Krehel, better-accessibility]

- **Without a browser:** accessible names on every interactive element, keyboard handlers on non-native controls, focus styles, `prefers-reduced-motion` guards and form labels bound to their inputs.
- **With one:** tab the flow in order, read computed names and roles from the accessibility tree, confirm a visible focus indicator at every stop and run an automated audit.
- **Triage an automated audit** [freescan]: work axe's critical and serious results first; fix the shared component, not each page it appears on; record each accepted exception with its scope and an owner; and treat the "incomplete" results as a list for manual review, neither passes nor failures.
- **Scope and environment** [freescan]: audit by template, state and task rather than by URL alone, and record browser, OS, viewport, zoom, assistive technology, input method, signed-in state, date and code version with the results.
- Report every check you could not run as `Not verified`, never as a finding. A source-only claim about rendering needs the rendered page, and a screenshot alone cannot support a code finding. [Jakub Krehel, better-interface]

## The report

[Jakub Krehel, better-accessibility]

Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| P1 | `src/Dialog.tsx:42` | `<button><XIcon /></button>` | Add `aria-label="Close"` and hide the icon from the accessibility tree | 4.1.2: the close control has no accessible name |

`Location` is `path/to/file:line`. `Why` names the WCAG criterion or principle and the user impact. (The example row is better-interface's, with its `HIGH` mapped to P1.)

End with `Block` when any P0 or P1 remains, `Approve` otherwise. Never `Approve` coverage you did not inspect. With nothing to report, state "No actionable accessibility findings" and report verification.

## Reviewing a change: removed signals

[Jakub Krehel, interface-review, removed-signals.md]

Regressions are invisible in the post-change state, so read the `-` side of every hunk. "A signal is a lead, not a finding. A removal is a regression only when nothing in the change replaces it."

| Removed | What to check |
| --- | --- |
| `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-live`, `role=` | A lost name, description or announcement |
| `alt=`, `<label`, `for=`, `htmlFor`, `scope=` | A lost association |
| `<button>`, `<a>`, `<nav>`, `<main>`, `<ul>` replaced by `div` or `span` | Keyboard and assistive-tech behavior traded for styling |
| `:focus-visible`, `:focus`, `outline`, `tabindex` | The focus indicator or the tab order |
| `prefers-reduced-motion` | The reduced-motion path |

Replacements that clear a signal: `aria-label` to `aria-labelledby` pointing at visible text; `role` dropped because the element became native (`role="button"` going when a `div` becomes `<button>`); `outline` to a `box-shadow` ring on the same `:focus-visible` selector; `tabindex="0"` dropped from a now natively focusable element.

```bash
git diff -U0 "$BASE" <head-ref> -- . <exclusions> \
  | grep -E '^-' | grep -vE '^--- (a/|/dev/null)' \
  | grep -E 'aria-|role=|alt=|htmlFor|for=|scope=|focus|outline|tabindex|prefers-|lang=|dir=|text-wrap|line-clamp|overflow-wrap|tabular-nums|font-feature|inset-|-inline|-block'
```

Leave `<head-ref>` off when uncommitted work is in the target. "`-U0` deliberately hides that context", so read the surrounding hunk before deciding.

## Before you finish

[Jakub Krehel, better-accessibility]

| Pattern | Fix |
| --- | --- |
| `outline: none` or `outline-none` with no `focus-visible` replacement nearby | Restore the browser ring or add a verified custom one |
| `<div onClick` or `<span onClick` | Use `<button>`, or `<a href>` when it navigates |
| `role="button"` or `role="tab"` with no `onKeyDown` | Use the native element, or implement the APG key map |
| `role="switch"` with no `aria-checked` | Add it; MDN marks it required ([SEMANTICS-AND-ARIA.md](SEMANTICS-AND-ARIA.md#common-aria-mistakes)) |
| `tabIndex={1}` or any positive `tabindex` | Fix the DOM order and use `0` |
| `disabled={!isValid}` on a submit button | Keep it enabled and validate on submit |
| `{msg && <div role="status">`, region mounted with its text | Render the empty region first and update its text |
| `aria-live="assertive"` on a success toast | `role="status"` |
| `<img` with no `alt` attribute | `alt=""` if decorative, otherwise describe the purpose |
| `aria-label` whose text omits the visible label | Start the name with the visible text |
| `aria-hidden` on an ancestor of a button, link or input | Remove it, or make the subtree inert |
| `maximum-scale=1` or `user-scalable=no` | Remove it |
| `position: sticky` header with no `scroll-padding-top` on the scroller | Pad the scroller by the header height |
| Tooltip on a natively `disabled` control | Text beside it, or `aria-disabled` so it stays focusable |
| A hover tooltip with no Escape handler | Close on Escape and keep it open while hovered (1.4.13) |
| `onDragStart` or a drag library with no button alternative | Add a single-pointer path to the same result |

The `role="switch"` and tooltip rows come from [transitions.dev] findings, not the source table.

## Prove it

Every finding in the report cites a WCAG 2.2 A or AA criterion or a task that cannot be completed, or is ranked P2 or P3; no AAA criterion is ranked P0 or P1; every trigger in the table above that was found is ranked P1 or higher and listed first; every check that was not run is marked `Not verified`, and the report records its environment; each root cause is one row with all its locations; for a change review, the removed-signals command was run and each hit is either a finding or named as replaced; and the verdict is `Block` exactly when a P0 or P1 remains.
