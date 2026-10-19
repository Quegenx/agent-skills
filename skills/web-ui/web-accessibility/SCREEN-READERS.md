# Screen readers

Visually hidden content, choosing how to announce a change, live regions, `aria-hidden`, alt text and media. Source: [Jakub Krehel, better-accessibility, screen-readers.md], with 1.4.2 restated from WCAG; SVG specifics are in [svg ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/ACCESSIBILITY.md).

## Visually hidden content

[Jakub Krehel, better-accessibility]

The canonical `.sr-only` pattern hides content visually while keeping it in the accessibility tree:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

Use `1px` boxes, not `0`, because some screen readers skip zero-sized elements. `white-space: nowrap` stops words being read as one run-together string. Never `display: none` or `visibility: hidden`, which remove the content from assistive tech entirely.

Tailwind ships this as `sr-only`. The skip-link recipe is in [FOCUS-AND-KEYBOARD.md](FOCUS-AND-KEYBOARD.md#skip-link).

Use it for context sighted users get visually: `<span class="sr-only">Opens in new tab</span>`, table captions or an icon-only control's label where `aria-label` isn't an option.

## Choosing how to announce a change

[Jakub Krehel, better-accessibility]

Work down this list and stop at the first match:

1. **Focus moves there anyway**, as with an opened modal or the first invalid field. Nothing extra needed; the focus move is the announcement.
2. **Tied to a specific control**, such as a field error or character count: `aria-describedby` on the control, announced with the field.
3. **Non-urgent, not tied to a control**, such as a toast, "Saved", a result count or a loading state: a polite live region, `role="status"`.
4. **Urgent and not tied to a control**, such as a form-level failure or session expiry: `role="alert"`.

app-ui does this instead: field errors carry `role="alert"` as well as the shared `aria-describedby` id ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).

## Live regions

[Jakub Krehel, better-accessibility]

| Mechanism | Politeness | Use for |
| --- | --- | --- |
| `role="status"` (= `aria-live="polite"` + `aria-atomic="true"`) | Waits for a pause | Toasts, "Saved", result counts, loading updates |
| `role="alert"` (= `aria-live="assertive"` + `aria-atomic="true"`) | Interrupts immediately | Errors and urgent problems only |

Rules for reliable announcements:

- For repeated polite updates, keep a stable empty region in the DOM before changing its text. Inserting a new polite region with its content is announced inconsistently.
- Dynamically inserted `role="alert"` content is usually announced, but behavior varies. Test the target browser and screen-reader combinations.
- Default to polite. `assertive` interrupts whatever the user was reading.
- Keep messages short and self-contained. `aria-atomic="true"` re-reads the whole region on change.
- Never move focus to a toast. Announce it and leave focus where the user is working.

```tsx
// Region rendered from the start, message injected later
<div role="status" className="sr-only">
  {statusMessage}
</div>
```

For loading states: set `aria-busy="true"` on the updating region, announce "Loading..." politely, then announce the outcome ("Loaded, 12 results").

A status animation drawn on a `<canvas>` gets `role="img"` and a label for its state ("Searching…", "Clover bot, working"); pass a label that names the real task, or `aria-hidden="true"` when the text beside it already says it, "so screen readers do not read them twice". The canvas is not a live region: "If the status change must be announced, put the text in your own `role="status"` element." [Libraries.dev]

A looping visual (a thinking indicator whose words cycle) stays `aria-hidden`, and screen readers hear one static "Thinking..." under `role="status"`; a copy button keeps its label and says "Copied" through a visually hidden `aria-live="polite"` span. [fluid-functionalism]

## aria-hidden

[Jakub Krehel, better-accessibility]

`aria-hidden="true"` removes an element and its whole subtree from assistive tech. Use it for decorative icons and content duplicated for visual effect. Never put it on or above a focusable element, which creates stops you can Tab to that do not exist for a screen reader. This is the fourth rule of ARIA: "Do not use role="presentation" or aria-hidden="true" on a focusable element" ([W3C Using ARIA](https://www.w3.org/TR/using-aria/)). Hiding something interactive means removing it from the tab order too, or making the subtree `inert`.

## Alt text

[Jakub Krehel, better-accessibility]

Choose by purpose, not by what the image looks like:

| Purpose | Alt | Example |
| --- | --- | --- |
| Decorative, or redundant with adjacent text | `alt=""` (empty, but present) | Logo next to the company name in text |
| Informative | Describe the meaning it adds | `alt="Ticket QR code"` |
| Functional (image is the link/button) | Describe the action or destination | Search icon: `alt="Search"`, not `alt="magnifying glass"` |
| Image of text | The exact text (better: use real text) | `alt="50% off everything"` |
| Complex (chart, diagram) | Short summary in `alt`, full data as a table or text nearby | `alt="Revenue by quarter, described below"` |

A missing `alt` is worse than an empty one, because screen readers fall back to reading the file name.

- **Alt is not a keyword slot.** Google: "The most important attribute when it comes to providing more metadata for an image is the alt text", and "Avoid filling `alt` attributes with keywords", which "may cause your site to be seen as spam" ([Google Images SEO](https://developers.google.com/search/docs/appearance/google-images)). Describe the purpose, as in the table.
- **Alt is written in the page's language.** A localized route translates its alt text along with the copy; check each language's pages, not only the default one [freescan].

An image painted into a `<canvas>` (a generation reveal, a shader effect) has no alt text: "If the result matters to screen readers, render a visually hidden description or an `<img>` elsewhere." [Libraries.dev]

SVG: decorative gets `aria-hidden="true"`; meaningful inline SVG gets `role="img"` plus a name; `<img src="icon.svg" alt="...">` is the most reliable delivery for simple cases. The full treatment is in [svg ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/ACCESSIBILITY.md).

## Video and audio

[Jakub Krehel, better-accessibility], corrected for 1.4.2.

- Prerecorded video needs captions (1.2.2), and prerecorded audio needs a transcript (1.2.1). Always render controls.
- 1.4.2 Audio Control (Level A): audio that plays automatically for more than 3 seconds needs a mechanism to pause or stop it, or a mechanism to control its volume independently from the overall system volume ([WCAG 2.2, 1.4.2](https://www.w3.org/TR/WCAG22/#audio-control)). The source wrote "Never autoplay with sound (1.4.2)"; autoplay with sound is not itself a failure, autoplay over 3 seconds with no such mechanism is.

## Prove it

With a screen reader on: every status change ("Saved", a result count, a loading outcome) is spoken once without moving focus; repeated updates in the same region are each announced; only urgent untied errors interrupt; the `role="status"` region exists in the DOM before its first message (`grep -rnE '&& <div role="status"' src/` is empty); no focusable element sits inside an `aria-hidden` subtree; every `<img>` has an `alt` attribute, empty for decoration, in the page's own language and free of keyword lists; every prerecorded video has captions and controls; and no audio autoplays for more than 3 seconds without a pause or volume control.
