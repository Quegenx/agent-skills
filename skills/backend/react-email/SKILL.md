---
name: react-email
description: "Builds HTML emails with React Email: install and the preview server, the components and their props, Tailwind with pixelBasedPreset, dark mode and email client limits, render and plain text, sending with Resend, Nodemailer, Mailgun or SendGrid, ready templates, i18n with next-intl, react-i18next and React Intl, and the embeddable @react-email/editor. Use when writing or reviewing an email template, setting up or upgrading React Email, rendering an email to HTML or text, or adding a visual email editor."
---

# React Email

React Email builds emails from React and TypeScript components and turns them into the table-based, inline-styled HTML email clients accept. Since 6.0 (April 16, 2026) everything comes from one package, `react-email`, with the preview server in `@react-email/ui`; the old `@react-email/components` imports, `renderAsync` (removed) and the `plainText` render option (deprecated) belong to earlier versions. The styling rules exist because email clients support only part of CSS. Sending through the Resend API is the [resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md) skill; deliverability, unsubscribe and compliance are the [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md) skill.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Versions and Node, install (new, existing, monorepo), project layout, static files, `PreviewProps`, the `email` CLI and preview server, esbuild plugins, deploying the preview, changes by version and the 6.0 migration | [SETUP.md](SETUP.md) |
| The canonical template, structure rules, every component and its props, accessibility defaults and duties | [COMPONENTS.md](COMPONENTS.md) |
| Tailwind and `pixelBasedPreset`, what doesn't inline, required classes, borders, layout and images, tagged email-design alternatives, the brand config, dark mode, client support caveats | [STYLING.md](STYLING.md) |
| `render`, `pretty`, `toPlainText`, runtimes, sending with Resend (SDK, MCP, uploaded templates) and with other providers | [RENDERING-AND-SENDING.md](RENDERING-AND-SENDING.md) |
| What to ask before building, props instead of `{{placeholders}}`, the footer, the ready templates' props and caveats, internationalization | [PATTERNS.md](PATTERNS.md) |
| The embeddable `@react-email/editor`: setup, API, export, themes and custom extensions | [EDITOR.md](EDITOR.md) |
| Full code of the five ready templates: password reset, order confirmation, notification with code block, multi-column newsletter, team invitation | [TEMPLATES.md](TEMPLATES.md) |

Current docs as markdown for agents: https://react.email/docs/llms.txt. Client CSS support: https://www.caniemail.com.

## The rules

1. **Import everything from `react-email`** (6.0+), never from `@react-email/components`, and run Node 20.19 or later.
2. **Put `<Head />` inside `<Tailwind>` and `<Preview>` first in `<Body>`,** with one `Container` per email and layout from `Section`, `Row` and `Column`.
3. **Use `pixelBasedPreset` and only inlinable styles:** no `rem`, flexbox, grid, media-query or `hover:` utilities; always give borders a style and `Button` the `box-border` class.
4. **Images are absolute PNG, JPG or GIF URLs** with width, height and correct alt text; local `static/` files need a production base URL.
5. **Data flows through typed props,** never `{{mustache}}` strings in JSX, with `.PreviewProps` holding only the props the template uses.
6. **Render at send time with `await render`,** and send a plain-text version (`toPlainText`, or `react` with the Resend Node SDK).
7. **Send from a verified domain,** and keep the email under 102KB because Gmail clips larger ones.
8. **Ask for brand colors, logo, style and the asset host before building,** and when iterating change only what was asked.

## Prove it

Every template renders in `email dev` with its `PreviewProps`, raises no compatibility warnings for the clients you target, stays under 102KB, and produces both HTML and plain text; no import from `@react-email/components` or call to `renderAsync` remains; and every file's own Prove it checks pass for the parts you touched.
