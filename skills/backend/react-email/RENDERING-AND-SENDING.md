# Rendering and sending

Any email provider needs the React template converted into an HTML string, which the async `render` utility does; a plain-text version comes from `toPlainText`. Resend's Node SDK is the exception: pass the element as `react` and it renders both for you. The preferred moment to render is the moment of sending, with real data passed in as props. This file covers the React Email side; the Resend API itself (domains, idempotency, batch, webhooks) is in [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md), and deliverability and compliance are in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

**Contents:** [render](#render) · [Plain text](#plain-text) · [Runtimes](#runtimes) · [Sending with Resend](#sending-with-resend) · [Sending with other providers](#sending-with-other-providers) · [Render changes by version](#render-changes-by-version) · [Prove it](#prove-it)

## render

- **`render` is async** and lives in `react-email`:
  ```tsx
  import { render } from 'react-email';
  import { WelcomeEmail } from './emails/welcome';

  const html = await render(
    <WelcomeEmail name="John" verificationUrl="https://example.com/verify" />
  );
  ```
- **Options:** `pretty` (boolean), `plainText` (boolean, deprecated), `htmlToTextOptions` (html-to-text options). The source also has `unstableTextConversion: true`, an in-house formatter that takes no `htmlToTextOptions`.
- **Beautify with the standalone `pretty`:** the `pretty` option on `render` is deprecated in its favor (Render 1.1.0, May 1, 2025).
  ```tsx
  const html = await pretty(await render(<MyTemplate />));
  ```
- **`renderAsync` is gone:** deprecated when `render` became always async (Render 0.0.14, Aug 22, 2024) and removed in Render 2.0.0 (Nov 7, 2025).
- **Render, don't export:** prefer `render` at send time over `email export` ([SETUP.md](SETUP.md#the-preview-server-and-cli)).

## Plain text

- **Send a plain-text version** so the message can be read even when the recipient can't view the HTML; the vendor skill calls it required for accessibility.
- **Use `toPlainText`:**
  ```jsx
  import { MyTemplate } from './email';
  import { toPlainText, render } from 'react-email';

  const html = await render(<MyTemplate />);
  const text = toPlainText(html);
  ```
- **`plainText: true` on `render` is deprecated** since Render 1.2.0 (Aug 6, 2025), which added `toPlainText`. The vendor skill still shows `await render(<WelcomeEmail ... />, { plainText: true })`; use `toPlainText` instead.
- **`toPlainText(html, options?: HtmlToTextOptions)` defaults** (source): `wordwrap: false` (since Render 1.4.0, Oct 17, 2025); skips `img` and `[data-skip-in-text=true]`; links use `linkBrackets: false, hideLinkHrefIfSameAsText: true`; `[data-text-format="dataTable"]` is formatted as a data table.
- **Link brackets, sources disagree:** the render docs show output `Some title\n---\nClick me [https://example.com]`; the source sets `linkBrackets: false`. Check your actual output.
- **Leave an element out of the text version** with `data-skip-in-text="true"`; it still appears in the HTML. `Preview` uses this.
- **Tables as aligned columns:** `data-text-format="dataTable"` renders a table as aligned columns in plain text. Render 2.1.0 (2026-07-10) also added `unstableToPlainText` and `unstableTextConversion`, which sidestep html-to-text.

## Runtimes

- **Builds for browser, edge and node** ship in `packages/render/src/{browser,edge,node}`. Convex uses the edge exports (Render 1.2.3; export map ordering between convex and node fixed in 2.0.7).
- **Safari and iOS browsers** need the `ReadableByteStreamController` API polyfilled: `npm i web-streams-polyfill` and `import "web-streams-polyfill/polyfill";`.
- **Next.js dev with Turbopack on Bun:** since Render 2.1.1 (2026-10-16) `render` loads `prettier` only when `pretty: true`, fixing "Failed to load external module prettier".

## Sending with Resend

Resend was built by the same team as React Email. Install `npm install resend react-email`.

- **Use a verified domain in `from`.** Ask the user for theirs; if they have none, ask them to verify one with their email service provider. Domain setup is in [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md).
- **Node SDK: pass the element as `react`.** The SDK renders HTML and plain text itself. Check `error`:
  ```tsx
  import { Resend } from 'resend';
  import { WelcomeEmail } from './emails/welcome';

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['user@example.com'],
    subject: 'Welcome to Acme',
    react: <WelcomeEmail name="John" verificationUrl="https://example.com/verify" />
  });

  if (error) {
    console.error('Failed to send:', error);
  }
  ```
- **Resend MCP server, when available:** render `html` and `text` yourself, then call the MCP `send-email` tool with `to`, `subject`, `html` and `text`.
- **Uploaded Resend template:** after uploading from the preview ([SETUP.md](SETUP.md#the-preview-server-and-cli)), send by its id:
  ```tsx
  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['user@example.com'],
    subject: 'Welcome to Acme',
    template: {
      id: '1245-1256-1234-1234',
    }
  });
  ```
- **Translate the subject too** when the template is localized: `subject: t('subject')` ([PATTERNS.md](PATTERNS.md#internationalization)).

## Sending with other providers

React Email works with any provider: render to HTML, then hand the string over. The vendor skill shows Nodemailer, Mailgun and SendGrid (its SKILL.md names only Resend, Nodemailer and SendGrid). The docs also have integration pages for Postmark, AWS SES, Azure Communication Email, MailerSend, Scaleway, Plunk, Lettermint, eusend, Brevo, Mailtrap, ZeptoMail, Mailchimp Transactional and Inbound, all following the same render-then-send pattern.

These examples send only `html`, while the vendor skill also calls a plain-text version required ([Plain text](#plain-text)).

- **Nodemailer** (`npm install nodemailer react-email`):
  ```tsx
  import { render } from 'react-email';
  import nodemailer from 'nodemailer';

  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const html = await render(<WelcomeEmail name="John" verificationUrl="https://example.com/verify" />);

  await transporter.sendMail({
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject: 'Welcome',
    html
  });
  ```
- **Mailgun:**
  ```tsx
  import { render } from 'react-email';
  import FormData from 'form-data';
  import Mailgun from 'mailgun.js';
  import { WelcomeEmail } from './emails/welcome';

  const mailgun = new Mailgun(FormData);
  const client = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });

  const html = await render(<WelcomeEmail name="John" verificationUrl="https://example.com/verify" />);

  await client.messages.create(process.env.MAILGUN_DOMAIN, {
    from: 'noreply@example.com',
    to: ['user@example.com'],
    subject: 'Welcome',
    html,
  });
  ```
- **SendGrid:**
  ```tsx
  import { render } from 'react-email';
  import sgMail from '@sendgrid/mail';

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const html = await render(<WelcomeEmail name="John" verificationUrl="https://example.com/verify" />);

  await sgMail.send({
    to: 'user@example.com',
    from: 'noreply@example.com',
    subject: 'Welcome',
    html
  });
  ```

## Render changes by version

- **Render 2.1.1 (2026-10-16):** `prettier` loaded only when `pretty: true`.
- **Render 2.1.0 (2026-07-10):** `unstableToPlainText`, `unstableTextConversion`, `data-text-format="dataTable"`.
- **Render 2.0.10:** strips React's auto-injected `<link rel="preload" as="image">`.
- **Render 2.0.8:** strips nul bytes from React 18 `renderToPipeableStream` output (multi-byte truncation).
- **Render 2.0.0 (Nov 7, 2025):** `renderAsync` removed.
- **Render 1.4.0 (Oct 17, 2025):** `wordwrap` disabled by default in `toPlainText`.
- **Render 1.2.0 (Aug 6, 2025):** `toPlainText` added; `plainText` option deprecated.
- **Render 1.1.0 (May 1, 2025):** `pretty` option deprecated for the standalone `pretty`.
- **Render 1.0.0 (Aug 22, 2024):** `render` returns a promise.

## Prove it

- Every `render` call is awaited; no `renderAsync`, no `render(..., { plainText: true })` and no `pretty` option remain.
- Every send carries a plain-text body: `react` with the Resend Node SDK, or `toPlainText(html)` passed to the provider.
- Rendering one template with its `PreviewProps` produces HTML with no unresolved `{{...}}` placeholders and no `localhost` URLs.
- `from` uses a verified domain, and the Resend call checks `error`.
- In Safari or iOS browsers, rendering works with `web-streams-polyfill` loaded.
