# Forms

Labels, required fields, error messaging, autocomplete, input types, paste and submit behavior. Source: [Jakub Krehel, better-accessibility, forms.md]. Label, error and hint wording is in [anti-slop-copy](../../anti-ai-slop/anti-slop-copy/SKILL.md).

## Labels

[Jakub Krehel, better-accessibility]

Every control needs a programmatic label: `<label for>` pointing at the input's `id`, or a wrapping `<label>`. A placeholder disappears the moment the user types and usually fails contrast, so it never stands in for a label.

```html
<!-- Good: explicit association -->
<label for="email">Email</label>
<input id="email" type="email" autocomplete="email" />

<!-- Good: wrapping label, so label and control share one hit target -->
<label>
  <input type="checkbox" /> Send me updates
</label>
```

Clicking "Send me updates" toggles the checkbox, with no dead zone between them. Mark required fields with native `required` plus a visible indicator explained once per form ("* required").

## Error messaging

[Jakub Krehel, better-accessibility]

Validate on submit, never by disabling submit until the form is valid. The complete pattern:

```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  autocomplete="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error">Enter a valid email address.</p>
```

- `aria-invalid="true"` on the failing field, removed once fixed.
- `aria-describedby` links the field to its inline error so screen readers announce it with the field.
- Errors render inline beside their fields, with an icon or text. Never a red border alone, which is a color-only cue (1.4.1).
- On submit, focus the first invalid field. The focus move is the announcement.
- Accept free text and validate after. Never block typing or filter characters as the user types. Trim values before validating, because autocomplete and text expansion add trailing spaces.
- `role="alert"` is for a form-level error not tied to a field ([SCREEN-READERS.md](SCREEN-READERS.md#choosing-how-to-announce-a-change)).

app-ui does this instead: "**Errors under the field:** one error as text, several as a list, deduplicated, `role="alert"`; the description and the error share one `aria-describedby` id" ([app-ui/CONTROLS.md](../app-ui/CONTROLS.md)).

## Autocomplete and input types

[Jakub Krehel, better-accessibility]

A valid `autocomplete` token on fields about the user is a WCAG requirement (1.3.5 Identify Input Purpose, AA). Pair it with a descriptive `name` attribute, a real `<form>` and no fake inputs, so password managers and 2FA autofill work. The common tokens:

| Field | `autocomplete` |
| --- | --- |
| Name | `name` (or `given-name` / `family-name`) |
| Email | `email` |
| Phone | `tel` |
| Address | `street-address`, `address-line1`, `postal-code`, `country` |
| Card | `cc-number`, `cc-exp`, `cc-csc`, `cc-name` |
| Login | `username`, `current-password` |
| Signup / reset | `username`, `new-password` |
| 2FA code | `one-time-code` |

Prefix with a section where relevant: `autocomplete="shipping street-address"`.

[Vercel, web-design-guidelines] puts "`autocomplete="off"` on non-auth fields to avoid password manager triggers". It is a hint, not a switch. MDN: it tells the browser not to save the data, but "some browsers make exceptions for special cases, such as prompting users to save passwords", and "many modern browsers do not support `autocomplete="off"` for login fields"; "If a browser keeps on making suggestions even after setting autocomplete to off, then you have to change the `name` attribute"; a page where a user sets another person's password uses `autocomplete="new-password"`, which "is a hint to browsers; some may not comply with it". Turning it off on the form still meets 1.3.5 when the fields about the user keep their own `autocomplete` tokens ([MDN: How to turn off form autocompletion](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion)).

Correct `type` and `inputmode` pick the right mobile keyboard:

| Input | Use |
| --- | --- |
| Email, URL, phone | `type="email"`, `type="url"`, `type="tel"` |
| OTP / PIN / card number | `type="text" inputmode="numeric"` (keeps text semantics, no spinner) |
| Money, decimals | `type="text" inputmode="decimal"` |
| True numeric quantity | `type="number"` |

Disable spellcheck on emails, codes and usernames: `spellcheck="false"`.

Never block paste; users paste passwords and one-time codes.

## Submit behavior

[Jakub Krehel, better-accessibility]

- Keep submit enabled until the request starts. While it runs, show a spinner *beside the original label*: "Save" with a spinner, not a bare spinner. The label is what tells assistive tech which button is busy.
- Mark the pending button `aria-disabled="true"` and ignore repeat clicks in the handler. Native `disabled` on the focused button drops focus to `<body>`.
- Announce results. Success goes through a polite live region. On failure, focus the first invalid field, which is itself the announcement.
- Warn on unsaved changes before navigation: "`beforeunload` or router guard" [Vercel, web-design-guidelines]. A re-render or hydration must never reset a field's typed value or move focus out of it.

app-ui does this instead: the pending "button is disabled and `aria-busy`", and "A form in flight disables its `fieldset`" ([app-ui/STATES.md](../app-ui/STATES.md)).

## Prove it

Clicking every label focuses or toggles its control; no input relies on a placeholder for its name; `grep -rn 'disabled={!' src/` finds no submit gated on validity; submitting an empty form focuses the first invalid field, which announces its error with its label; every field about the user has an `autocomplete` token from the table; a phone shows the numeric keypad on code and PIN fields; pasting into every password and code field works; and while a request runs, focus stays on the submit button and a second click sends nothing.
