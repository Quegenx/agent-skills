# Patterns and i18n

This file holds how to approach a template request (what to ask first, props instead of `{{mustache}}` placeholders, the footer), the vendor skill's ready patterns, internationalization with next-intl, react-i18next and React Intl. For i18n the template loads its own messages from a `locale` prop; with next-intl only `createTranslator` works, because the preview server has no access to the next-intl context.

**Contents:** [Before writing a template](#before-writing-a-template) · [Props, not placeholders](#props-not-placeholders) · [Footer](#footer) · [Ready patterns](#ready-patterns) · [Internationalization](#internationalization) · [Prove it](#prove-it)

## Before writing a template

- **Ask first, if not provided:**
  1. Brand colors: the primary hex (for example `#007bff`); the full color list is in [STYLING.md](STYLING.md#brand-config).
  2. Logo file and format: PNG or JPG only; warn if it's SVG or WEBP.
  3. Style preference. The skill words it as professional, casual or minimal tone; the styling reference as modern/minimal or classic/traditional.
  4. The production URL where static assets will be hosted.
- **The styling reference's intake prompt:** "Before I create your email template, I need some brand information to ensure consistency. Could you provide: 1. Your primary brand color (hex code, e.g., #007bff) 2. Your logo URL (must be a publicly accessible PNG or JPEG) 3. Any secondary colors you'd like to use 4. Style preference (modern/minimal or classic/traditional)"
- **When iterating, change only what the user asked for** and keep the rest intact.
- **Ask for the verified sending domain** before writing send code ([RENDERING-AND-SENDING.md](RENDERING-AND-SENDING.md#sending-with-resend)).

## Props, not placeholders

- **Never put template variables such as `{{name}}` in TypeScript code;** reference the underlying props.
- **If the user explicitly wants `{{variableName}}`,** put the mustache string only in `PreviewProps`, never in the component JSX:
  ```typescript
  const EmailTemplate = (props) => {
    return (
      <h1>Hello, {props.variableName}!</h1>
    );
  }

  EmailTemplate.PreviewProps = {
    variableName: "{{variableName}}",
  };

  export default EmailTemplate;
  ```
- **If they insist on it in the structure,** explain that it would make the template invalid.

## Footer

- **Include the physical address, an unsubscribe link and the current year:**
  ```tsx
  <Section className="text-center text-gray-500 text-sm">
    <Text className="m-0">123 Main St, City, State 12345</Text>
    <Text className="m-0">&copy; {new Date().getFullYear()} Company Name</Text>
    <Link href={unsubscribeUrl}>Unsubscribe</Link>
  </Section>
  ```
  The vendor skill's newsletter pattern hardcodes "© 2026 Company Name. All rights reserved." instead of computing the year as the styling reference does.
- **Unsubscribe and compliance requirements** are in [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md) and, for sending with Resend, [resend SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md).

## Ready patterns

The vendor skill ships five full templates using Tailwind, `pixelBasedPreset`, typed props and preview props. Their full code is in [TEMPLATES.md](TEMPLATES.md):

| Pattern | Props |
|---|---|
| [Password reset](TEMPLATES.md#password-reset-email) | `resetUrl`, `email`, `expiryHours = 1` |
| [Order confirmation](TEMPLATES.md#order-confirmation-with-product-list) | `orderNumber`, `orderDate`, `items: Product[]` (`name`, `price`, `quantity`, `image`, `sku?`), `subtotal`, `shipping`, `tax`, `total`, `shippingAddress` |
| [Notification with code block](TEMPLATES.md#notification-email-with-code-block) | `title`, `message`, `severity: 'info' \| 'warning' \| 'error' \| 'success'`, `timestamp`, `logData?`, `actionUrl?`, `actionLabel = 'View Details'` |
| [Multi-column newsletter](TEMPLATES.md#multi-column-newsletter) | `articles: Article[]` (`title`, `excerpt`, `image`, `url`, `author`, `date`), `unsubscribeUrl` |
| [Team invitation](TEMPLATES.md#team-invitation-email) | `inviterName`, `inviterEmail`, `teamName`, `role`, `inviteUrl`, `expiryDays` |

- **Where the patterns differ from the skill's own rules:** their top `Heading`s have no explicit `as="h1"` (the skill says open with `<Heading as="h1">`); their images point at `https://via.placeholder.com/...`; the newsletter hardcodes the footer year; the notification wraps `CodeBlock` in a `Section` and renders its action as a styled `Link`, not a `Button`; `PreviewProps` use `as XProps`, not `satisfies`. Apply [COMPONENTS.md](COMPONENTS.md#accessibility) when adapting them.

## Internationalization

React Email supports next-intl, react-i18next and React Intl. The pattern is the same for all three: add a `locale` prop to the template and to `PreviewProps`, load the messages for that locale inside the template, and pass `locale` when you build the element to send.

| Library | Choose it for | Install |
|---|---|---|
| next-intl | Next.js applications | `npm install next-intl` |
| React Intl (FormatJS) | Complex formatting: plurals, dates, numbers | `npm install react-intl` |
| react-i18next | Non-Next.js applications, or more control | `npm install react-i18next i18next i18next-resources-to-backend` |

### next-intl

- **Messages** in `messages/en.json`, keyed by a namespace per template (`"welcome-email"`).
- **Use `createTranslator` inside an `async` template.** No other next-intl API works here: the preview server has no access to the next-intl context.
  ```tsx
  export default async function WelcomeEmail({
    name,
    verificationUrl,
    locale
  }: WelcomeEmailProps) {
    const t = createTranslator({
      messages: await import(`../messages/${locale}.json`),
      namespace: 'welcome-email',
      locale
    });

    return (
      <Html lang={locale}>
        <Tailwind config={{ presets: [pixelBasedPreset] }}>
          <Head />
          <Body className="bg-gray-100 font-sans">
            <Preview>{t('subject')}</Preview>
            <Container className="mx-auto py-10 px-5 max-w-xl">
              <Heading className="text-2xl font-bold text-gray-800">
                {t('subject')}
              </Heading>
              <Text className="text-base leading-7 text-gray-800 my-4">
                {t('greeting')} {name},
              </Text>
              <Text className="text-base leading-7 text-gray-800 my-4">
                {t('body')}
              </Text>
              <Button
                href={verificationUrl}
                className="bg-blue-600 text-white px-5 py-3 rounded block text-center no-underline box-border"
              >
                {t('cta')}
              </Button>
              <Hr className="border-solid border-gray-200 my-5" />
              <Text className="text-sm text-gray-500">
                {t('footer')}
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }
  ```
- **Send it** with `react: <WelcomeEmail name="Jean" verificationUrl="..." locale="fr" />`.
- **Log missing translations** with `onError: (error) => { console.warn('Translation missing:', error); }`.

### React Intl

- **Messages** per template: `messages/en/welcome-email.json`, with ICU plurals such as `"itemCount": "{count, plural, one {# item} other {# items}}"`.
- **In the template:** ``const { formatMessage } = createIntl({ locale, messages: await import(`../messages/${locale}/welcome-email.json`) });``, then `formatMessage({ id: 'itemCount' }, { count: itemCount })` or `formatMessage({ id: 'header' })`.

### react-i18next

- **Config and a `getT` helper:**
  ```js
  // i18n.js
  import i18next from 'i18next';
  import resourcesToBackend from 'i18next-resources-to-backend';
  import { initReactI18next } from 'react-i18next';

  i18next
    .use(initReactI18next)
    .use(resourcesToBackend((language, namespace) =>
      import(`./messages/${language}/${namespace}.json`)
    ))
    .init({
      supportedLngs: ['en', 'es', 'fr', 'de'],
      fallbackLng: 'en',
      lng: undefined,
      preload: ['en', 'es', 'fr', 'de']
    });

  export { i18next };
  ```
  ```js
  // get-t.js
  import { i18next } from './i18n';

  export async function getT(namespace, locale) {
    if (locale && i18next.resolvedLanguage !== locale) {
      await i18next.changeLanguage(locale);
    }
    if (namespace && !i18next.hasLoadedNamespace(namespace)) {
      await i18next.loadNamespaces(namespace);
    }
    return {
      t: i18next.getFixedT(
        locale ?? i18next.resolvedLanguage,
        Array.isArray(namespace) ? namespace[0] : namespace
      ),
      i18n: i18next
    };
  }
  ```
- **In the template:** `const { t } = await getT('welcome-email', locale);`.
- The vendor skill's React Intl and react-i18next templates leave out `<Head />` and `<Preview>`; keep both when adapting them ([COMPONENTS.md](COMPONENTS.md#structure-rules)).

### Rules for every library

- **Organize messages by namespace** (recommended: one `messages/<locale>.json` with a namespace per template) or per template (`messages/<locale>/<template>.json`). Use descriptive, hierarchical keys: `subject`, `preview`, `header.title`, `body.greeting`, `cta.primary`, `footer.unsubscribe`.
- **Make `locale: string` a required prop,** and always set `<Html lang={locale}>`.
- **Right-to-left:** `const isRTL = ['ar', 'he', 'fa'].includes(locale);` then `<Html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>`. The vendor skill's complete example checks only `['ar', 'he']`. Set the same `lang` and `dir` on `Body` ([COMPONENTS.md](COMPONENTS.md#document-components)).
- **Fall back to English** when a locale file is missing: ``await import(`../messages/${locale}.json`).catch(() => import('../messages/en.json'))``.
- **Keep the same keys in every locale file** (bad: `"button"` in `en`, `"cta"` in `es`).
- **Translate the subject:** `subject: t('subject')` in `resend.emails.send`.
- **Format with `Intl`,** since dates (MM/DD/YYYY or DD/MM/YYYY), times (12h or 24h), numbers (1,234.56 or 1.234,56) and currency ($100 or 100$) differ by locale. The skill's multi-locale order confirmation uses `new Intl.NumberFormat(locale, { style: 'currency', currency })` and `new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })`, with namespace `order-confirmation` and keys `preview`, `title`, `order-number`, `order-date`, `total`, `view-order`, `footer`.
- **Test every locale** by changing `locale` in `PreviewProps`.

The embeddable visual editor API, export, themes and extensions are in [EDITOR.md](EDITOR.md).

## Prove it

- The template uses the brand config and the production asset URL the user gave, and its logo is PNG or JPG.
- No `{{...}}` string appears in component JSX; any mustache value is only in `PreviewProps`.
- Templates have a footer with the physical address, an unsubscribe link and a computed year.
- Every localized template takes a required `locale`, sets `<Html lang>` (and `dir` for right-to-left locales), falls back to `en`, and renders in the preview for each locale with no missing-translation warnings.
- Every locale file has the same keys, and the sent subject is translated.
