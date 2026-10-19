# Stripe Apps

Stripe Apps extend the Dashboard and Stripe's own logic: UI extensions in a sandboxed iframe, backends that react to events, full-stack apps, script extensions that run inside billing and payments, and embedded apps for Connect platforms. Most outcomes come down to four things: picking the right extension type and viewport, staying inside the UI sandbox (React 17, SDK components only, token-only `css`), declaring every permission and every external URL in the manifest, and uploading a version before anything that needs a signing secret (`fetchStripeSignature`, the Secret Store). For payments, subscriptions and webhook handling outside an app, see [PAYMENTS.md](PAYMENTS.md), [BILLING.md](BILLING.md) and [WEBHOOKS.md](WEBHOOKS.md).

**Contents:** [How to approach a task](#how-to-approach-a-task) · [Extension types](#extension-types) · [Discovery questions](#discovery-questions) · [Viewports](#viewports) · [Scaffold and dev loop](#scaffold-and-dev-loop) · [Authentication](#authentication) · [Backend](#backend) · [Secret Store](#secret-store) · [Webhooks for apps](#webhooks-for-apps) · [UI extensions: the sandbox](#ui-extensions-the-sandbox) · [UI composition](#ui-composition) · [Onboarding](#onboarding) · [Script extensions](#script-extensions) · [Versioning and publishing](#versioning-and-publishing) · [Upload errors](#upload-errors) · [Canonical docs](#canonical-docs) · [Prove it](#prove-it)

## How to approach a task

- **Canonical docs are the source of truth.** Don't reproduce code from memory; if training data conflicts with the docs, the docs win. If the docs are inaccessible, ask the user for current patterns. Prefer `stripe docs` (see [AGENT-TOOLS.md](AGENT-TOOLS.md)), including for pages that need account access.
- **Product docs say what an extension can do; implementation guides say how.** Load the applicable references and product docs before recommending or coding.
- **For capability questions, check native Stripe features and documented limitations.** Don't infer support from an extension's name or from a scaffold existing. If the docs don't establish that an extension meets a requirement, state what's unknown or unsupported.
- **Use current product docs and the installed SDK types for contracts.** If a reference example disagrees, check the version and follow the canonical docs.
- **For an existing app, inspect first:** the manifest, packages, the installed SDK and local agent instructions.

Capability docs:

| Topic | Doc |
|---|---|
| Extension points, how extensions work | https://docs.stripe.com/extensions/extension-points.md , https://docs.stripe.com/extensions/how-extensions-work.md |
| Billing scripts | item handling https://docs.stripe.com/billing/scripts/item-handling.md ; prorations (native) https://docs.stripe.com/billing/subscriptions/prorations.md and (extension) https://docs.stripe.com/billing/scripts/prorations.md ; customer balance https://docs.stripe.com/billing/scripts/customer-balance.md ; discount calculation https://docs.stripe.com/billing/scripts/discount-calculation.md |
| Workflows and custom actions | https://docs.stripe.com/workflows/define-workflows.md#actions , https://docs.stripe.com/workflows/custom-actions.md , https://docs.stripe.com/extensions/custom-actions/how-custom-actions-work.md ; build with script https://docs.stripe.com/extensions/custom-actions/build-with-script.md ; with a remote function https://docs.stripe.com/extensions/custom-actions/build-with-remote-function.md |
| Secrets (also for apps without a self-hosted backend) | https://docs.stripe.com/stripe-apps/store-secrets.md |

## Extension types

| Type | What it is | Constraints and notes |
|---|---|---|
| UI extension | Custom UI in the Dashboard, in a sandboxed iframe: page-specific panels (customer, payment, invoice, subscription, product), the everywhere side panel, a full-screen page, an onboarding screen, a settings page | React 17 only; only `@stripe/ui-extension-sdk/ui` components; no `window`, `document`, `localStorage`; must use the SDK's Stripe API client |
| Backend-only app | Your server receives webhooks and calls the Stripe API "using platform keys (no manual key-sharing with merchants)" | See [Authentication](#authentication) for the key-type choice |
| Full-stack | UI plus backend | The UI authenticates to the backend with `fetchStripeSignature` |
| Extension interfaces | Billing (discount calculation, proration calculation, customer balance, recurring billing item handling) and payments orchestration (custom payment routing) | Check the catalog for applicability and access; don't assume all interfaces are private preview |
| Embedded apps (private preview) | For Connect platforms hosting third-party apps (QuickBooks, Xero, Mailchimp) | Point to https://docs.stripe.com/stripe-apps/embedded-apps |

## Discovery questions

- **Ask one unresolved question at a time, in plain language.** Skip what's already answered; proceed when the path is clear.
- **Q1, what should it do?**
  1. Show UI in the Dashboard: go to Q2.
  2. React to events: backend-only; go to Q3; read the backend, webhooks, authentication and workflow material.
  3. Both: full-stack.
  4. Let merchants connect without sharing keys: app-as-authentication; read authentication and workflow.
  5. Custom billing or routing logic: the extension-point catalog.
  6. Unsure: ask what problem they're solving.
- **Q2, where?** Pick a viewport (next section).
- **Q3, who installs it?** Private (no marketplace) or public (needs a verified email and business details).
- **Q3b, auth type:** only for public apps that need backend access; restricted API keys (RAKs) are the recommended default.
- **Q4, does it remember things or talk to other services?** Yes: a backend or the Secret Store. Only Stripe data: front-end only.
- **Feature access:** custom objects (https://docs.stripe.com/custom-objects.md) and extension interfaces need access. Without it, use the Secret Store or your own backend instead of custom objects, and a webhook-based approach instead of extension interfaces.

## Viewports

| Viewport | Root view |
|---|---|
| `stripe.dashboard.{customer,payment,invoice,subscription,product}.detail` and `.list` (page-specific) | `ContextView` |
| `stripe.dashboard.drawer.default` (everywhere) | `ContextView` |
| `stripe.dashboard.fullpage` | `FullPageView` |
| `stripe.dashboard.home.overview` | |
| `settings` | `SettingsView` |
| `onboarding` | `OnboardingView` |

- **The UI reference also lists `stripe.dashboard.{object_type}.overview`** for page-specific views. Reference: https://docs.stripe.com/stripe-apps/reference/viewports.md
- **Lead with full-page when the app is a destination with more than one section;** page-specific for glanceable context; `drawer.default` only when the app truly belongs everywhere.

## Scaffold and dev loop

The source workflow below is conditional on the user authorizing its setup, tests/builds and outward actions; it does not grant that permission. Feedback is prepared or sent only when explicitly requested. [stripe/ai, stripe-apps/references/workflow.md; user standing rules]

The source sequence:

```
1. stripe plugin install apps && stripe plugin install generate   ← one-time CLI setup
2. stripe generate app <name> && cd <name>                       ← scaffold (NOT `stripe apps create`)
3. pnpm install                                                   ← install deps
4. [modify scaffolded files + create missing ones]               ← implement (only add what scaffold doesn't provide)
5. pnpm build                                                     ← compile UI and scripts (skip for backend-only apps)
6. pnpm test                                                      ← run tests
7. stripe apps start                                             ← local preview for Dashboard UI extensions
8. stripe apps upload                                            ← publish version (REQUIRED before Secret Store or fetchStripeSignature work)
9. Install in a sandbox using the private or public flow below  ← test the installed app
10. Dashboard → Apps → Submit for review                         ← marketplace publishing (optional)
11. Optional feedback only on the user's explicit request (see AGENT-TOOLS.md#feedback)
```

- **Never use `stripe apps create`:** it doesn't scaffold correctly. Don't hand-create files the scaffold provides. The CLI must be 1.25.0 or newer (`stripe version`).
- **The V2 workspace scaffold contains** `stripe-app.yaml`, `package.json`, `pnpm-workspace.yaml`, `ui/package.json`, `ui/src/views/App.tsx`, `extensions/` (one subdirectory per script extension) and `README.md`.
- **`stripe apps start`** opens the Dashboard with hot reload. Safari is not supported (use Chrome or Firefox). It is not persistent and the app is not installed. The Secret Store is not available, and `fetchStripeSignature` works only after at least one upload.
- **Backend local dev:** terminal 1 runs `stripe apps start`, terminal 2 runs `node server.js`.
- **Log in to the right account before uploading** with `stripe login`: a private app, the sandbox you'll test in; a public app, your live account. For a public app tested in a general sandbox, first update the manifest for sandbox installs (https://docs.stripe.com/stripe-apps/enable-sandbox-support.md#update-the-app-manifest).
- **`stripe apps upload`** creates a version, generates the signing secret used by `fetchStripeSignature` and the Secret Store, and makes the version installable.
- **Install a private app after upload:** Created apps (https://dashboard.stripe.com/test/apps/created), then the app, the Versions tab, Install or Change version.
- **Install a public app for testing:** enable general sandbox support, create an external test link (https://docs.stripe.com/stripe-apps/test-app.md), open a general sandbox and visit the link.
- **Install a private app in live mode:** log in to the live account and run `stripe apps upload` again; then Dashboard, Apps, the app, "Private to your account", the version, Install.
- **Never skip sandbox testing:** upload, install in a sandbox, test, then install in live mode. Each sandbox has its own app installation and signing secrets; create sandboxes from Dashboard, Sandboxes.

## Authentication

- **The manifest key is `stripe_api_access_type`:** `restricted_api_key` (recommended), `platform` or `oauth`. Canonical: https://docs.stripe.com/stripe-apps/api-authentication
- **Default to RAKs:** simpler, scoped, no Connect-style relationship. Stripe generates a scoped key at install and the merchant copies it into your system; there is no Connect webhook fanout.
- **Use platform keys** when you need Connect webhook fanout or a public marketplace app acting across many merchants. They use the Connect `Stripe-Account` header, but installers are not onboarded as connected accounts in the traditional sense.
- **Use OAuth** only when the merchant must be merchant-of-record. Implementation: https://docs.stripe.com/stripe-apps/pkce-oauth-flow
- **The sources disagree on the default.** The authentication and discovery references call RAKs the recommended default; the same authentication reference also says "Most apps do NOT need OAuth. Use platform keys unless you specifically need this", and the extension-types reference says backend-only apps call the API using platform keys. All are Stripe's; confirm the choice in https://docs.stripe.com/stripe-apps/api-authentication.

Platform keys (Node):

```javascript
// Use a restricted API key when possible; fall back to secret key only for platform-key apps
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

await stripe.customers.list({}, {
  stripeAccount: "acct_xxxxx", // the merchant's account ID
});
```

- **Get the merchant's account ID from** `event.account`, the `account_id` in `fetchStripeSignature` signed data, or `userContext.account.id` in the UI.
- **Grant permissions with the CLI** (it updates `stripe-app.yaml`):

```bash
stripe apps grant permission "customer_read" "Read customer data to show in the Dashboard"
stripe apps grant permission "event_read" "Receive webhook events"
```

- **Handle install and uninstall:** on `account.application.authorized` store `event.account`; on `account.application.deauthorized` clean up stored data.
- **Changing permissions:** update the manifest, bump the version, upload. Users are notified by email, and the "Review Permissions" button appears only on the Apps page (https://dashboard.stripe.com/apps), not inside the app. Calls fail with an invalid-request error until the user re-authorizes. Always warn users, and consider an in-app banner that detects the missing permission.

### fetchStripeSignature (UI to your backend)

- **It proves a request came from a legitimate installation.** The signed payload contains `user_id` and `account_id` by default (field order matters); add data with `fetchStripeSignature(extraPayload)`.
- **Verify on the backend with `stripe.webhooks.signature.verifyHeader()`.** The signing secret starts with `absec_...` and is generated on the first `stripe apps upload`. Full pattern: https://docs.stripe.com/stripe-apps/build-backend
- **CORS:** send `Access-Control-Allow-Origin: *` only on endpoints the UI calls. The iframe has a `null` origin, so origin allowlisting won't work. Webhook endpoints need no CORS. Stripe IPs for firewall allowlisting: https://docs.stripe.com/ips

## Backend

- **You need one for** long-term storage, server-side secrets, logic that runs when the user isn't in the Dashboard (webhooks, scheduled jobs), secure third-party calls and long-running actions.
- **You don't need one** if the app only reads and displays Stripe data, or stores small sensitive values (use the Secret Store).

## Secret Store

- **Two scopes:** `account` (shared across the account's users, for example a business's email-service API key) and `user` (per user, for example an OAuth token).
- **At most 10 secrets per scope,** counted per scope. Near the limit, list and delete before adding.
- **Never store PCI-sensitive data** (card numbers, CVVs, bank account numbers).
- **It requires an uploaded version;** it is not available under `stripe apps start`.
- **Declare the permission:**

```yaml
declarations:
  stripe_api_access:
    permissions:
      - permission: secret_write
        purpose: Store third-party credentials for the app
```

## Webhooks for apps

General webhook handling lives in [WEBHOOKS.md](WEBHOOKS.md). Canonical for apps: https://docs.stripe.com/stripe-apps/events

| App kind | Endpoints |
|---|---|
| Private app | One standard endpoint |
| Public app with platform keys | One endpoint with "Listen to events on Connected accounts" |
| Public app with RAKs | No Connect fanout; each merchant manages their own |

- **A second test-mode endpoint** is recommended for public apps but not required.
- **Permissions:** `event_read`, plus a read permission per event type (for example `payment_intent_read`, `customer_read`).
- **Verify with `stripe.webhooks.constructEvent()`** using the raw request body and the signing secret. For platform-key apps check `event.account`, and pass the `stripeAccount` option to act on the merchant's behalf (platform keys only). Return 200 quickly and process asynchronously if needed.
- **Local testing, when authorized:** `stripe listen --forward-to localhost:<PORT>/webhook` is for your account; `--forward-connect-to` handles connected accounts. The trigger command requires both its event argument and a string account ID after `--stripe-account`; the old source supplied the event where the account ID belonged and omitted the event argument. Do not copy that malformed command. [stripe/ai, stripe-apps/references/webhooks.md; https://github.com/stripe/stripe-cli/blob/master/pkg/cmd/trigger.go]
- **Dashboard setup:** Developers, Webhooks (https://dashboard.stripe.com/webhooks), Add endpoint, the URL, the events, (public platform-key apps) check "Listen to events on Connected accounts", then copy the signing secret into env vars.

## UI extensions: the sandbox

- **The iframe runs React 17.0.2 and renders only SDK components.** Blocked:
  - any HTML tag (use `Box`, `Button`, `TextField`);
  - CSS, Tailwind, MUI, styled-components (use the `css` prop with tokens);
  - React 18+ APIs `useId`, `useTransition`, `useDeferredValue`;
  - `window`, `document`, `localStorage`, `sessionStorage`;
  - `react-hook-form` and other ref-based form libraries;
  - arbitrary `fetch()` to external URLs (use `fetchStripeSignature` for your backend and the SDK client for Stripe).
- **CSP:** calling an undeclared URL fails; add it to `content_security_policy.connect-src` in `stripe-app.yaml`.
- **Data access:** `createHttpClient` from `@stripe/ui-extension-sdk/http_client` plus the `STRIPE_API_KEY` constant (a sentinel, not a real key; it uses the granted permissions). Every resource you call must be a declared permission or the call fails with invalid-request.
- **Context:** the current object is `environment.objectContext` (for example `.id` = `"cus_…"`); the signed-in user is `userContext`, a top-level prop, not under `environment`. Docs: https://docs.stripe.com/stripe-apps/how-ui-extensions-work.md , https://docs.stripe.com/stripe-apps/reference/extensions-sdk-api.md
- **Import from the right subpath:** `@stripe/ui-extension-sdk/ui`, `/ui/next` or `/ui/experimental`. A wrong subpath gives an `undefined` component and a hard crash, `Element type is invalid`. `DataTable` and `DetailPage` are under `/ui/experimental`; charts and `Tabs` under `/ui/next`.
- **Fetch each component's doc before using it:** `https://docs.stripe.com/stripe-apps/components/<name>.md` (append `?app-sdk-version=9Next` for `Tabs`, `LineChart`, `BarChart`). Copy the import and props exactly, and re-check before finishing. Index (about 40 components: Views, Layout, Navigation, Content, Forms, Charts): https://docs.stripe.com/stripe-apps/components.md . Patterns: https://docs.stripe.com/stripe-apps/patterns.md

## UI composition

### Full-page build order

1. The manifest registers `stripe.dashboard.fullpage` (CLI `add view` adds a full-page view; needs `@stripe/ui-extension-sdk` 9.2 or newer).
2. A `FullPageView` shell: header (app name and icon) comes from `stripe-app.json` (see the manifest note below); one `pageAction` only if there's a single clear top action.
3. Routing: `createRoutes` plus `AppRouter`; read with `useAppRoute`, navigate with `useNavigation`; the `/:tabId?` pattern for bookmarkable tabs (https://docs.stripe.com/stripe-apps/routing.md).
4. `Tabs` and `Tab` (no nesting).
5. `OverviewPage` with `primaryColumn` and `secondaryColumn` holding `PageModule`s.
6. `DataTable`.
7. `DetailPage` with `breadcrumbs`.
8. `FocusView` for create and edit.

Walkthrough: https://docs.stripe.com/stripe-apps/patterns/full-page-apps.md

- **Manifest file name:** the UI reference says the `FullPageView` header comes from `stripe-app.json`, while the workflow and publishing references name the manifest `stripe-app.yaml` throughout. Both are Stripe's; confirm in the current docs.
- **Drawer and page-specific views:** a `ContextView` root, single-column and dense. Link out to the full-page experience instead of cramming workflows in.

### Styling with tokens (required)

- **`css` values are tokens; raw CSS values are a hard runtime error.** Spacing: tokens `xxsmall` to `xxlarge` only (no px, rem or %). Layout: `stack: "x" | "y"` plus `gap` (no `display: flex/grid`). Width: a fraction (`"1/2"`, `"1/3"`) or `"fill"`. Height: a bare number of pixels (for example `height: 180`). Colors: semantic (`backgroundColor: "surface" | "container"`, `color: "secondary"`). Style reference: https://docs.stripe.com/stripe-apps/style.md

| Token | Size | Default use |
|---|---|---|
| `xxsmall` | 2px | label to value |
| `xsmall` | 4px | icon to text |
| `small` | 8px | sibling cards |
| `medium` | 16px | card padding, field gaps |
| `large` | 24px | sections |
| `xlarge` | 32px | major columns |
| `xxlarge` | 48px | rare page break |

- **Typography:** `font` takes only `body`, `bodyEmphasized`, `caption`, `heading`, `subheading`, `subtitle`, `title`, `kicker`, `lead` (values like `"heading4"` or `"title2"` crash). `fontWeight` takes only `regular`, `semibold`, `bold`; use `semibold` for emphasis and avoid `bold` (accepted but reserved). Labels: `font: "caption"` plus `color: "secondary"`.
- **Cards:** `backgroundColor: "surface"`, `borderRadius: "medium"`, `padding: "medium"`. Trays: `"container"`, `"medium"`, `padding: "small"`. `borderRadius` takes `none | xsmall | small | medium | large | rounded`.
- **No wrapper padding inside tabs:**

```tsx
// Incorrect: inset; content no longer aligns to the tabs
<Box css={{ stack: "y", gap: "large", padding: "large" }}>…</Box>
// Correct: flush to the tab's left edge
<Box css={{ stack: "y", gap: "large" }}>…</Box>
```

### Pages

- **Render `OverviewPage` directly as the tab content.** One column (`primaryColumn` only) or two (`primaryColumn` plus `secondaryColumn`), never mixed. The KPI row is the first `PageModule` of `primaryColumn`.
- **Overview density:** a horizontal KPI row of 3 to 5 equal tiles (never stacked full-width); use both columns (or `stack: "x", gap: "xlarge"` with `width: "2/3"` and `"1/3"`); aim for 3 or more modules.
- **`DetailPage` is its own root route (required),** for example `route("/members/:memberId", …)`, never inside `FullPageView` (that gives a double header). Use `DetailPage` plus `PropertyList` for key/value data.
- **List pages:** the table is the hero; search and filters above, pagination below, an empty state; no KPI tiles or charts.
- **Stat tile:**

```tsx
// row wrapper: <Box css={{ stack: "x", gap: "medium" }}> … one card per KPI …
<Box css={{ width: "fill", stack: "y", gap: "xxsmall", padding: "medium", borderRadius: "medium", backgroundColor: "surface" }}>
  <Inline css={{ font: "caption", color: "secondary" }}>{label}</Inline>
  <Inline css={{ font: "subtitle", fontWeight: "semibold" }}>{value}</Inline>
</Box>
```

- **Two-column detail:** outer `stack: "x", gap: "xlarge"`; columns `width: "1/2", stack: "y", gap: "medium"`; fields `stack: "y", gap: "xxsmall"` with a semibold label.
- **Charts:** give them an explicit height in a `Box` (about 180, https://docs.stripe.com/stripe-apps/patterns/chart-layout.md) inside a `PageModule`. `LineChart` for trends (monthly or weekly; daily over long ranges is noisy); small breakdowns as `List` rows or a `MeterChart`; `BarChart` only for genuine multi-bar or time-series data. Read the `data` shape: a wrong shape is a runtime error.

```tsx
import { List, ListItem, Inline } from "@stripe/ui-extension-sdk/ui";
<List>
  {tiers.map((t) => (
    <ListItem key={t.name} id={t.name} title={<Inline>{t.name}</Inline>} value={<Inline>{`${t.count} members`}</Inline>} />
  ))}
</List>
```

- **Loading:** inside the content region (keep the header and tab bar), a centered `Spinner` (https://docs.stripe.com/stripe-apps/patterns/loading.md).
- **Empty states:** an object with a CTA when there's no data; a plain string when filters return zero (https://docs.stripe.com/stripe-apps/patterns/empty-state.md).
- **Forms can use controlled or uncontrolled SDK inputs.** TextField supports `value` with an updating `onChange`, or the documented uncontrolled form; ref-based libraries remain constrained by the sandbox. The old source required uncontrolled forms even while permitting useState, and the UI extension SDK removed the value/checked deprecation in 8.9.0. In FocusView, show pending state on save. [https://docs.stripe.com/stripe-apps/components/textfield; https://docs.stripe.com/stripe-apps/upgrade-stripes-ui-extension-sdk]

## Onboarding

Canonical: https://docs.stripe.com/stripe-apps/patterns/onboarding-experience

- **Zero-touch:** use `fetchStripeSignature` to identify the user, no login.
- **`OnboardingView` in the `onboarding` viewport,** not `ContextView`, with required props such as `completed`, `tasks`, `title`.
- **`SignInView` for a third-party login,** saving the OAuth token in the Secret Store.

```yaml
ui_extension:
  views:
    - viewport: onboarding
      component: OnboardingView
    - viewport: stripe.dashboard.customer.detail
      component: App
```

- **Check onboarding status at the start of every page-specific view.** Store onboarding state in the Secret Store (`user` scope per user, `account` scope account-wide; at most 10 per scope).

## Script extensions

- **Before writing, read the extension point guide and the installed `@stripe/extensibility-sdk` types.** Confirm script support, request and result types, required methods, error behavior, constraints the types don't express (units, ranges, precision, field relationships, runtime APIs), and whether configuration, schemas or endpoint access are needed. Docs: https://docs.stripe.com/extensions/extension-points , https://docs.stripe.com/extensions/how-extensions-work#scripts , https://docs.stripe.com/extensions/scripts/define-config-and-schemas , https://docs.stripe.com/extensions/invoke-endpoints . Prorations walkthrough: https://docs.stripe.com/extensions/scripts/build-prorations-extension
- **Scaffold:**

```bash
stripe generate info extension-point-ids
stripe generate extension <extension-point-id> <extension-id> script --name "<extension-name>" --non-interactive
```

- **Preserve the entrypoint, SDK interface, method signatures and manifest method key** (it may differ from the TypeScript method name). The manifest identifies the method but not necessarily the source path; don't add undocumented manifest fields.
- **Don't guess package names, subpaths or peer dependencies.** Use only public exports; use a `workspace:` range only for packages actually in the local workspace.
- **Lint with `@stripe/extensibility-eslint-plugin`.** The root and extension-point default exports are flat-config arrays (spread them directly; there is no `configs.recommended`). It needs the `typescript-eslint` parser and plugin. Order the JS and TS base configs before the Stripe Apps base and extension-point configs. Type-aware linting covers production and test projects; ignore generated and build output and dependencies.
- **Typecheck:** production uses restricted libraries and globals from `@stripe/extensibility-sdk`; with `noLib: true` keep the generated `skipLibCheck: true`. Keep production and test TS configs separate.
- **Implementation:** explicit SDK request and result types, no `any` or double casts. Preserve SDK scalar types (precision, rounding, signs, units, time sources). Keep module-scope constants as strings or primitives and construct SDK scalars at the point of use. A passing Node test doesn't prove runtime support. Call endpoints only where supported. Keep secrets out of source and config.
- **Config:** define it in the SDK configuration type and regenerate schemas with the generated script; never hand-edit schemas; implement runtime defaults explicitly. Keep the generated empty config interface with its `@typescript-eslint/no-empty-object-type` suppression; `Record<string, unknown>` can break schema generation.
- **Tests:** keep the generated acceptance suite. Add focused tests for the activation condition, out-of-scope input, boundaries, optional config, invalid input and dependency failures. Run the build, typecheck, lint, schema, focused, acceptance and full-test scripts separately; record each command, its exit status and test counts. Don't change published fixtures or disable checks.
- **After upload and install, activate the extension at its extension point before testing.** Debug runs in Workbench: https://docs.stripe.com/workbench/guides#view-extension-runs

## Versioning and publishing

- **Bump `version` in `stripe-app.yaml` before each upload,** semver: 1.0.0 initial, 1.0.1 fix, 1.1.0 feature, 2.0.0 breaking.
- **Upload versions in order.** Uploading 2.0.0 before 1.0.0 leaves 2.0.0 unavailable for release. You can upload several versions and choose which to install.
- **Stripe auto-upgrades installed users to the latest release** unless permissions changed (see [Authentication](#authentication) for the re-authorization flow).
- **Release:** `stripe apps upload`, then Dashboard, Apps, the app, version history, "Set as external test version" or "Release".
- **Marketplace requirements:** a verified email, business details (legal name, address), and passing https://docs.stripe.com/stripe-apps/review-requirements.md . Connect platform accounts cannot publish marketplace apps.
- **Submit:** Dashboard, Apps, the app, Submit for review. Review needs the app to work in supported sandboxes and live mode, no prohibited content or misleading claims, a privacy policy URL, a support contact, an icon and screenshots. Listed apps appear at https://marketplace.stripe.com/

## Upload errors

| Error | Fix |
|---|---|
| `Invalid manifest` / validation failed | Missing fields or malformed YAML: check indentation; `id:`, `version:`, `name:` present |
| `Build failed` / TypeScript errors | Run `pnpm build` locally |
| `Version already exists` | Bump `version` (0.0.1 to 0.0.2) |
| `Permission denied` / `Not authenticated` | `stripe login`, verify with `stripe whoami --format json`; the old `config --list` check can print retained credentials [https://github.com/stripe/stripe-cli/blob/master/pkg/config/config.go; stripe/ai, stripe-best-practices/SKILL.md] |
| `connect-src` / CSP error | Add the URL to `content_security_policy.connect-src` in `stripe-app.yaml` |
| `extensions field required` | Add `extensions: []` even without backend extensions |
| `Component not found` | `component:` must match your default export name |

- **Success looks like** `Uploading... Done` and `Your app has been uploaded to version 0.0.1.` Otherwise check file paths (`ui/src/views/App.tsx`) and rerun with `stripe apps upload --verbose`.
- **Feedback:** follow the [shared feedback authorization and command contract](AGENT-TOOLS.md#feedback).

## Canonical docs

All under https://docs.stripe.com/stripe-apps/ : `create-app`, `reference/app-manifest`, `reference/permissions`, `build-backend`, `api-authentication`, `events`, `how-ui-extensions-work`, `components`, `reference/extensions-sdk-api`, `store-secrets`, `versions-and-releases`, `publish-app`, `patterns/onboarding-experience`, `patterns/full-page-apps`, `reference/viewports`, `enable-sandbox-support`.

## Prove it

- `stripe version` reports 1.25.0 or newer, and the app was scaffolded with `stripe generate app`, not `stripe apps create`.
- `pnpm build` and `pnpm test` pass; for script extensions the build, typecheck, lint, schema, focused, acceptance and full-test scripts each pass, with commands, exit statuses and test counts recorded.
- No HTML tags, raw CSS values, `window`/`document`/`localStorage`, React 18 APIs or external `fetch()` in `ui/`; every `font` value is in the allowed list; every component import matches its `components/<name>.md` doc.
- Every Stripe resource the app calls has a declared permission, and every external URL is in `content_security_policy.connect-src`.
- `stripe apps upload` prints `Your app has been uploaded to version <x>`, with `version` bumped since the last upload.
- The app installs in a sandbox and works there before any live install; a backend request signed with `fetchStripeSignature` verifies with `stripe.webhooks.signature.verifyHeader()`.
- `stripe trigger payment_intent.succeeded` reaches the app's webhook handler through `stripe listen`, and the handler returns 200 after `stripe.webhooks.constructEvent()` succeeds.
- Installing fires `account.application.authorized` and the app stores `event.account`; uninstalling fires `account.application.deauthorized` and the stored data is cleaned up.
