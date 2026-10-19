# Components

React Email's components render the table-based, inline-styled HTML that email clients accept, and they were tested in Gmail, Apple Mail, Outlook, Yahoo! Mail, HEY and Superhuman. All of them are imported from `react-email` (since 6.0): Body, Button, CodeBlock, CodeInline, Column, Container, Font, Head, Heading, Hr, Html, Img, Link, Markdown, Preview, Row, Section, Tailwind, Text, plus CodeBlock themes such as `dracula`, `github` and `nord`. The structure the sources prescribe: `Html`, then `Tailwind`, then `Head` and `Body`, with `Preview` first inside `Body`, one `Container`, and layout built from `Section`, `Row` and `Column` rather than CSS layout.

**Contents:** [The canonical template](#the-canonical-template) · [Structure rules](#structure-rules) · [Document components](#document-components) · [Layout components](#layout-components) · [Content components](#content-components) · [Code and Markdown](#code-and-markdown) · [Accessibility](#accessibility) · [Changes by version](#changes-by-version) · [Prove it](#prove-it)

## The canonical template

The vendor skill's welcome email: a props interface, a default export plus a named export, Tailwind with `pixelBasedPreset`, and `PreviewProps` for the preview server.

```tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Tailwind,
  pixelBasedPreset
} from 'react-email';

interface WelcomeEmailProps {
  name: string;
  verificationUrl: string;
}

export default function WelcomeEmail({ name, verificationUrl }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: '#007bff',
              },
            },
          },
        }}
      >
        <Head />
        <Body className="bg-gray-100 font-sans">
          <Preview>Welcome - Verify your email</Preview>
          <Container className="max-w-xl mx-auto p-5">
            <Heading className="text-2xl text-gray-800">
              Welcome!
            </Heading>
            <Text className="text-base text-gray-800">
              Hi {name}, thanks for signing up!
            </Text>
            <Button
              href={verificationUrl}
              className="bg-brand text-white px-5 py-3 rounded block text-center no-underline box-border"
            >
              Verify Email
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Preview props for testing
WelcomeEmail.PreviewProps = {
  name: 'John Doe',
  verificationUrl: 'https://example.com/verify/abc123'
} satisfies WelcomeEmailProps;

export { WelcomeEmail };
```

## Structure rules

- **`<Head />` goes inside `<Tailwind>`** whenever Tailwind is used. Since 6.1.0 a `<Head>` outside `<Tailwind>` gives a clearer error.
  ```tsx
  <Html>
    <Tailwind config={{ presets: [pixelBasedPreset] }}>
      <Head />
      <Body>...</Body>
    </Tailwind>
  </Html>
  ```
- **`<Preview>` is always the first element inside `<Body>`.**
- **One `Container` per email,** as the outermost centering wrapper. Use `Section` for interior blocks inside it.
- **Type every template's props** with an interface, and give every template `.PreviewProps` holding only the props it uses.
- **Fixed width and height for known-size elements** (logos, icons); responsive sizing (`w-full`, `h-auto`) for content images.
- **No CSS layout:** build columns with `Row` and `Column` (or tables), never flexbox or grid ([STYLING.md](STYLING.md)).

## Document components

- **Html:** the root wrapper, always outermost. Props `lang` (default `en`, for example `es`, `fr`) and `dir` (default `ltr`, or `rtl`); override them per locale. When you change `lang` or `dir`, set the same values on `Body`: some email clients strip the `html` or `body` tag, so both need them.
- **Head:** holds head children such as `<style>`, `<meta>` and `<title>`, and `Font`.
  ```tsx
  <Head>
    <title>Email Title</title>
  </Head>
  ```
- **Body:** wraps the email, for example `className="bg-gray-100 font-sans"`. Props `lang` (default `en`) and `dir` (default `ltr`).
- **Preview:** the inbox preview text, compelling and action-oriented. Props `children` (`string | string[]`) and `useTitleTag?: boolean` (default true: also emits a `<title>` with the text). Its hidden div carries `data-skip-in-text`, so it stays out of the plain-text version. The source's `PREVIEW_MAX_LENGTH = 200` truncates the text to 200 characters and pads it to 200 with whitespace codes.
- **Preview length, sources disagree:** the Preview docs say keep it under 90 characters; the vendor skill's components reference says under 140; the source truncates at 200. Confirm in the current docs.
- **Font:** props `fontFamily` (required), `fallbackFontFamily`, `webFont` (`{ url: string, format: string } | undefined`), `fontWeight` (number or string), `fontStyle`. Formats: `woff2` (recommended), `woff`, `truetype`, `opentype`. Place it inside `<Head>`. Not every client supports web fonts (caniemail `css-at-font-face`), so always set `fallbackFontFamily`. Web font URLs can come from Google Fonts, Adobe Fonts or your own host.
  ```tsx
  <Head>
    <Font
      fontFamily="Roboto"
      fallbackFontFamily="Arial, sans-serif"
      webFont={{
        url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
        format: "woff2"
      }}
    />
  </Head>
  ```

## Layout components

- **Container:** centers content horizontally on a breaking point, with a built-in `max-width: 37.5em`. It renders `<table align="center" width="100%" border=0 cellPadding="0" cellSpacing="0">`, accepts `tdClassName`, and moves `padding*` styles onto the inner `td` for compatibility with Klaviyo and Outlook. Example `className="max-w-xl mx-auto p-5"`.
- **Section:** a plain block or one formatted with `Row` and `Column`; no built-in max-width.
- **Row and Column:** `Row` separates content horizontally; `Column` must be used inside a `Row`. Give columns percentage widths (`w-1/2`, `w-1/3`) or Tailwind width utilities that add up to 100% or the container width.
  ```tsx
  <Section>
    <Row>
      <Column className="w-1/2 p-2 align-top">
        Left column content
      </Column>
      <Column className="w-1/2 p-2 align-top">
        Right column content
      </Column>
    </Row>
  </Section>
  ```
- **Layout tables are presentational:** `<Section>`, `<Row>`, `<Container>` and `<Markdown>` tables render `<table role="presentation">` by default. Add `role="presentation"` yourself to any raw `<table>` used for layout.
- **Hr:** a divider. It needs a border style:
  ```tsx
  <Hr className="border-solid border-gray-200 my-5" />
  ```

## Content components

- **Heading:** prop `as` (default `h1`; `h1` to `h6`) and margin shortcuts `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml` (strings).
- **Text:** a block of text.
- **Button:** an `<a>` tag styled like a button, with a workaround for Outlook padding issues. Props `href` (required) and `target` (default `_blank`). Use `block` for full width, `text-center`, `no-underline`, and always `box-border` (stops padding from overflowing the button width).
  ```tsx
  <Button
    href="https://example.com/verify"
    target="_blank"
    className="bg-blue-600 text-white px-5 py-3 rounded block text-center no-underline font-medium box-border"
  >
    Verify Email Address
  </Button>
  ```
- **Link:** props `href` (required) and `target` (default `_blank`).
- **Img:** props `src` (required, absolute), `alt` (defaults to `""`), `width` and `height` (pixels).
  - Use absolute URLs on a reliable CDN; local files must go through the static base URL pattern in [SETUP.md](SETUP.md#project-layout).
  - Use PNG, GIF or JPG. All clients display them; SVG is not well supported however it is referenced, and the vendor skill also rules out WEBP.
  - Set `width` and `height` to prevent layout shift, and add the `block` class to avoid spacing issues.
  - Alt text rules are under [Accessibility](#accessibility).

## Code and Markdown

- **CodeBlock:** Prism.js highlighting. Props `code` (required, a plain string with its indentation), `language` (required, a `PrismLanguage` such as `javascript`, `python`, `typescript`), `theme` (required, a Prism theme object whose `base` styles the `pre`, for example `dracula`, `github`, `nord`), `fontFamily` (optional), `lineNumbers` (optional boolean, default false; don't use it unless asked). Wrap it in a `div` with `overflow-auto` to stop padding overflow. Convert other Prism themes with github.com/gabrielmfern/from-prismjs-to-react-email-code-block-theme.
  ```tsx
  import { CodeBlock, dracula } from 'react-email';

  const Email = () => {
    const code = `export default async (req, res) => {
    try {
      const html = await render(
        <EmailTemplate firstName="John" />
      );
      return NextResponse.json({ html });
    } catch (error) {
      return NextResponse.json({ error });
    }
  }`;

    return (
      <div className="overflow-auto">
        <CodeBlock
          fontFamily="monospace"
          theme={dracula}
          language="javascript"
          code={code}
        />
      </div>
    );
  };
  ```
  The vendor skill's notification pattern wraps it in `<Section className="overflow-auto mx-6">` instead of a `div`.
- **CodeInline:** predictable inline code that works in all email clients.
  ```tsx
  <Text className="text-base text-gray-800">
    Run <CodeInline className="bg-gray-100 px-1 rounded">npm install</CodeInline> to get started.
  </Text>
  ```
- **Markdown:** converts a markdown string to email markup. Props `children` (the markdown string), `markdownCustomStyles` (default `{}`; overrides per element such as `h1`, `h2`, `p`, `a`, `codeInline`, `th`, and passing one replaces that element's default styles) and `markdownContainerStyles` (default `{}`).
  ```tsx
  <Markdown
    markdownCustomStyles={{
      h1: { color: "red" },
      h2: { color: "blue" },
      codeInline: { background: "grey" },
    }}
    markdownContainerStyles={{
      padding: "12px",
      border: "solid 1px black",
    }}
  >{`# Hello, World!`}</Markdown>

  {/* OR */}

  <Markdown children={`# This is a ~~strikethrough~~`} />
  ```

## Accessibility

Defaults React Email gives you (since 6.5.0, 2026-05-27; upgrade with `npm install react-email@latest`):

- `<Html>` sets `lang` and `dir` (`lang="en" dir="ltr"`), and `Body` takes them too.
- `<Img>` defaults to `alt=""`.
- `<Markdown>` renders layout tables with `role="presentation"`.
- `<Preview>` also emits a `<title>`.

The author applies [email-practices ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/ACCESSIBILITY.md) to the rendered content. Component-specific mappings remain:

- **Linked images are never decorative:** inside a `<Link>` or `<Button>` the alt describes where the link goes (`alt="View order #123"`); `alt=""` leaves the link without an accessible name.
- **Link text names the destination:** `<Button>Read the report</Button>`, not "click here".
- **`role="presentation"`** on hand-built layout tables outside `<Markdown>`.
- **Non-English emails:** `<Html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>` ([PATTERNS.md](PATTERNS.md#internationalization)).
- **Send a plain-text version** ([RENDERING-AND-SENDING.md](RENDERING-AND-SENDING.md)).

## Changes by version

- **Body:** 0.1.0 (Jul 31, 2025) applies the body's styles to an inner table cell so they work on Yahoo and AOL; 0.2.0 resets `margin` when you define it; 0.3.0 (Mar 11, 2026) resets padding properties when you define padding.
- **Button:** 0.2.0 respects the order of padding properties; 6.6.6 (2026-07-02) fixed `mso-text-raise` emitted without a unit for Outlook.
- **Preview:** `useTitleTag` added in 6.6.0 (2026-06-09); padding raised to 200 characters for better Gmail preview text (6.3.2, 2026-05-22); since 6.11.2 (2026-10-14) the padding leaves out U+200E and U+200F so spam filters such as rspamd no longer score it as hidden text.
- **Markdown:** `markdownCustomStyles.th` applied to table header cells (6.11.1); double quotes escaped in link `href` and `title` (6.6.7) and in custom styles (6.6.1).

## Prove it

- Every template has a props interface, a default export, `PreviewProps` with only used props, and renders in `email dev`.
- In every template using Tailwind, `<Head />` sits inside `<Tailwind>` and `<Preview>` is the first child of `<Body>`.
- Exactly one `Container` per template; every `Column` is inside a `Row`.
- Every `Button` has `box-border`; every `Hr` and border has a border style.
- Every `Img` has an absolute PNG, GIF or JPG `src`, `width` and `height`, and an `alt` that is descriptive, `""` for decoration, or describes the link destination when linked.
- One `Heading as="h1"` per email (unless it is SMS-style), and no "click here" link text.
- Every `CodeBlock` sits in an `overflow-auto` wrapper; every `Font` has a `fallbackFontFamily`.
