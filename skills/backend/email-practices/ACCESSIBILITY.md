# Accessibility

Emails must be readable by screen readers, dark-mode clients, translation tools and AI agents, and "most emails fail basic accessibility checks." The rules are mechanical: apply them every time, and when you can't fix everything, fix them in the priority order below. Template components that apply some of these by default are in [react-email SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/SKILL.md).

**Contents:** [Rules by severity](#rules-by-severity) · [Language and direction](#language-and-direction) · [Layout tables](#layout-tables) · [Headings](#headings) · [Links](#links) · [Images and alt text](#images-and-alt-text) · [The title tag](#the-title-tag) · [Contrast and dark mode](#contrast-and-dark-mode) · [Plain text](#plain-text) · [React Email defaults](#react-email-defaults) · [Testing](#testing) · [Prove it](#prove-it)

## Rules by severity

| Priority | Severity | Rule |
|---|---|---|
| 1 | Critical | Missing or misused `alt` on images |
| 2 | Serious | `lang` and `dir`; presentational layout tables; discernible link text; a `<title>`; contrast |
| 3 | Moderate | Link text describes the destination |
| 4 | Mild | Missing `<h1>` (skip the fix for very short messages) |

## Language and direction

- **Set `lang` and `dir` on `<html>` and on `<body>`'s direct children** (Serious). "Several email clients strip the attributes from `<html>`", and not duplicating them on the body's children is "the single most common accessibility failure in production email."

```html
<html lang="en" dir="ltr">
  <head>
    <title>Your weekly product updates</title>
  </head>
  <body>
    <div lang="en" dir="ltr">
      <!-- email content -->
    </div>
  </body>
</html>
```

- **`lang` is a BCP 47 tag** (`en`, `pt-BR`, `ja`, `ar`); **`dir` is `ltr`, `rtl` or `auto`.** Fall back to `dir="auto"` (lets the user agent infer direction from content) and `lang="und"` (marks the language as undetermined) only when you genuinely don't know; both are worse than the correct value but much better than nothing.
- **Multi-locale templates pass the locale through;** don't hardcode `en`.

## Layout tables

- **Give layout tables `role="presentation"` (or `role="none"`)** (Serious); otherwise screen readers announce "table, row 1 of N" for every layout row and the email becomes unusable. Prefer avoiding layout tables.

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>...</td>
  </tr>
</table>
```

- **Leave the role off only for genuinely tabular data** (line items, comparison rows), which also uses `<th scope="col">` for column headers.

## Headings

- **One `<h1>` that names the email, subheadings nested in order `<h1>`, `<h2>`, `<h3>`, never skipping levels** (Mild). Never fake a heading with a bold `<p>`. Headings are how assistive tech and AI clients navigate and summarize the email.

```html
<h1>Order confirmation</h1>
  <h2>Items</h2>
  <h2>Shipping</h2>
    <h3>Address</h3>
    <h3>Tracking</h3>
```

- **Exception:** very short messages (SMS-style notifications, single-sentence alerts) may not need a heading at all. If the body is one or two sentences, skip the `<h1>` rather than wrap a heading around the only content.

## Links

- **Every link has discernible text** (Serious): text a screen reader can announce. The most common failure is a linked image with no alt text. A linked image is never decorative: it is functional, so its `alt` describes what clicking does, not just what the image looks like.

```html
<!-- Wrong: linked image with no accessible name -->
<a href="/order/123">
  <img src="view-order.png" alt="">
</a>

<!-- Right: alt describes the action -->
<a href="/order/123">
  <img src="view-order.png" alt="View order #123">
</a>

<!-- Also right: visible text alongside the image -->
<a href="/order/123">
  <img src="icon.png" alt="">
  View order #123
</a>
```

- **When the visible link text can't carry enough information,** add visually hidden text inside the `<a>` (https://www.goodemailcode.com/email-accessibility/visually-hidden-text). `aria-label` and `title` on `<a>` have limited support in email clients; prefer real text or visually hidden text.
- **Link text describes the destination** (Moderate): never "click here", "learn more", "read more" or bare URLs; screen reader users often navigate by jumping between link texts with no surrounding context. Right: `<a href="...">Read the 2026 accessibility report</a>`.

## Images and alt text

- **`alt` is always present** (Critical).
- **Meaningful images** (product shots, charts, screenshots, anything carrying information): give the purpose and the key details. Wrong: `alt="image"`, `alt="photo of a bike"`. Right: `alt="Red bicycle leaning against a brick wall on a rainy street"`.
- **Decorative images** (spacers, dividers, background flourishes, pure branding ornaments): `alt=""`, which tells screen readers to skip them, for example `<img src="divider.png" alt="" role="presentation">`. Omitting `alt` is not the same: some screen readers announce the filename. An image that conveys no information not already in the surrounding text is decorative; an image inside an `<a>` is not.

The React Email source’s meaningful-image example is `alt="Red bicycle leaning against a brick wall"` rather than `alt="image"`; a linked image uses `alt="View order #123"` [resend/react-email]. Component defaults remain in [react-email COMPONENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/COMPONENTS.md#accessibility).

## The title tag

- **Include a `<title>`** (Serious). Many clients and assistive technologies read it first, and it shows when the email is viewed as a web page.
- **Write it like the subject line, not the brand name.** Fallback: `"Email from {Brand Name}"`.

## Contrast and dark mode

- **Contrast** (Serious): body text and links at least 4.5:1 (WCAG AA); large text (18pt or more, or 14pt bold or more) at least 3:1. Check with the WebAIM Contrast Checker, https://webaim.org/resources/contrastchecker/, or browser devtools.
- **Never use color alone** to carry meaning (error states, status badges); pair it with text or an icon.
- **Dark mode:** Outlook, Apple Mail and others force dark mode and derive dark colors from your light ones; healthy starting contrast keeps the auto-inverted version readable. Always preview in dark mode.
- **Minimum button, text and OTP sizes** are in [EMAIL-TYPES.md](EMAIL-TYPES.md#designing-transactional-emails).

## Plain text

- **Send a plain-text alternative alongside the HTML version** (authoring checklist).

## React Email defaults

Component defaults and their limits are maintained in [react-email COMPONENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/react-email/COMPONENTS.md#accessibility); the author still applies the content rules above.

## Testing

- **Automated check:** the Parcel accessibility checker, https://parcel.io/docs/dev-tools/accessibility-checker (free plan; the same tool the EMC report uses). It catches most of the rules above.
- **Screen readers:** macOS VoiceOver (`Cmd+F5`) or NVDA on Windows. Listen top to bottom; if anything is confusing, fix the markup.
- **Dark mode:** Outlook (Windows and web), Apple Mail in dark mode, Gmail on iOS and Android.
- **Automation is "a floor, not a ceiling."** Automated tests won't tell you whether alt text matches the image, whether headings make semantic sense, or whether text inside an image is readable on narrow viewports. In the EMC 2026 report, three brands that passed every automated check still had generic alt text on decorative images, alt text that didn't match the image, and 10px footer text.

## Prove it

- `lang` and `dir` appear on `<html>` and on the body's direct child, with the template's real locale.
- Every `<img>` has an `alt` attribute; no linked image has `alt=""` without visible link text.
- Every layout `<table>` has `role="presentation"` or `role="none"`; data tables use `<th scope="col">`.
- There is at most one `<h1>` (none for very short messages) and no skipped heading levels.
- No link reads "click here", "learn more", "read more" or a bare URL.
- A `<title>` is set, specific to this email (like the subject line, not the brand name).
- Text contrast passes 4.5:1 (3:1 for large text) in the WebAIM checker, and the email reads correctly in Outlook, Apple Mail and Gmail dark mode.
- The Parcel checker passes, a VoiceOver or NVDA pass reads the email in a sensible order, and a plain-text part is sent.
