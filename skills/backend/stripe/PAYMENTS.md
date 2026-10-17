# Payments

Stripe takes a payment through one of a few objects: a Checkout Session (Stripe builds the page and the logic), a PaymentIntent (you build the checkout and own its state), or a SetupIntent (save a payment method without charging). Most outcomes are decided by that first choice: Checkout Sessions bring tax, discounts, shipping, currency conversion, session expiry and lifecycle events with them, and every one of those has to be rebuilt by hand on PaymentIntents. Stripe recommends Checkout Sessions for most integrations, lets Stripe pick the payment methods dynamically, and fulfills orders from webhooks, never from the client.

**Contents:** [Before you build](#before-you-build) · [Choosing an integration](#choosing-an-integration) · [Dynamic payment methods](#dynamic-payment-methods) · [Checkout Sessions](#checkout-sessions) · [PaymentIntents](#paymentintents) · [SetupIntents](#setupintents) · [PCI and card data](#pci-and-card-data) · [The SDK (stripe-node)](#the-sdk-stripe-node) · [Deprecated APIs](#deprecated-apis) · [Prove it](#prove-it)

## Before you build

- **Always use the latest API version and SDK** unless the user specifies otherwise. Stripe's own skill names `2026-09-30.endive` as the latest API version and stripe-node `23.0.0` as the latest Node SDK (the Checkout samples pin `"stripe": "^23.0.0"`). Stripe's docs tell agents never to hardcode an old version number from training data: run `npm view stripe version` or install with `@latest`. Pinning and upgrading are in [API-VERSIONS.md](API-VERSIONS.md).
- **Use general sandboxes, not the shared test mode sandbox,** for new integration work, with separate sandboxes for local development and for CI so automated tests don't touch your settings or data. Dedicate sandboxes to teams or test scenarios when you need stronger isolation. Use the test mode sandbox only for an existing integration that depends on it, or when a required feature doesn't support general sandboxes. When recommending one, explain that a sandbox is a Stripe test environment.
- **No account yet:** install the CLI with `npm i -g @stripe/cli` and run `stripe sandbox create` (see `stripe sandbox create --help`) to get an anonymous sandbox with working test API keys, no registration needed. If you used `stripe sandbox create`, don't use the MCP server until `stripe sandbox claim` has been run.
- **Check CLI auth with `stripe whoami --format json`.** Do not run `stripe config --list`. More CLI work is in [TESTING-AND-CLI.md](TESTING-AND-CLI.md).
- **Read before designing:** Integration Options (`https://docs.stripe.com/payments/payment-methods/integration-options.md`, "Start here when designing any integration"), the API Tour (`https://docs.stripe.com/payments-api/tour.md`) and, before launch, the Go Live Checklist (`https://docs.stripe.com/get-started/checklist/go-live.md`).
- **Keep keys out of code.** Stripe's samples carry `// Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.` Key handling is in [SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md).

## Choosing an integration

Stripe's own skill routes requests like this:

| Building | Use |
|---|---|
| One-time payments | Checkout Sessions |
| Custom payment form with embedded UI | Checkout Sessions + Payment Element |
| Saving a payment method for later | Setup Intents |
| Subscriptions or recurring billing | Billing APIs + Checkout Sessions ([BILLING.md](BILLING.md)) |
| Usage-based billing (new integration) | Metronome ([USAGE-BASED.md](USAGE-BASED.md)) |
| Connect platform or marketplace | Accounts v2 (`/v2/core/accounts`) ([CONNECT.md](CONNECT.md)) |
| Sales tax, VAT or GST | Stripe Tax + Registrations API ([TAX.md](TAX.md)) |
| Embedded financial accounts or banking | v2 Financial Accounts |
| Key management, RAKs, webhooks, OAuth, 2FA, Connect liability | [SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md) |

- **Only use Checkout Sessions, PaymentIntents, SetupIntents, or higher-level solutions** (Invoicing, Payment Links, the subscription APIs).
- **Prefer Stripe-hosted or embedded Checkout.** Surface order: (1) Payment Links, no code, best for simple products; (2) Checkout, Stripe-hosted or embedded form, best for most web apps; (3) Payment Element, an embedded component for advanced customization, backed by the Checkout Sessions API over a raw PaymentIntent where possible.
- **Checkout Sessions for on-session payments** (one-time and subscriptions). **PaymentIntents for off-session payments,** or when you must model checkout state yourself and create a charge.
- **Don't use the PaymentIntents API unless the user explicitly asks,** because it requires significantly more code. With PaymentIntents you rebuild discount logic, tax calculation and currency conversion yourself; Adaptive Pricing takes significant effort to replicate. Choose it only to own every part of checkout.
- **Third-party guidance differs on embedded UI.** The appeeky checkout skill [appeeky] maps "embedded custom UI" to Payment Element + PaymentIntent/SetupIntent. Stripe's own skill and docs say to back the Payment Element with Checkout Sessions. Confirm in the current docs.

| | Checkout Sessions | PaymentIntents |
|---|---|---|
| Tax | Built in with Stripe Tax (`automatic_tax.enabled = true`) | Separate Tax API integration |
| Subscriptions | Built in | Separate Subscriptions integration |
| Coupons, shipping, address collection | Built in | Manual |
| UI | Hosted, embedded or custom | Custom only (Elements) |
| Order summary and receipts | Built in | Custom |
| Line items | Dynamic updates | Manual amount updates |
| Expiration | Automatic after 24 hours | No automatic expiration |
| Webhook events | The complete checkout lifecycle | Payment status only |
| Adaptive Pricing | Yes | No |

| Option | Product | API | Coding | Notes |
|---|---|---|---|---|
| Payment Links | Payment Links + Checkout | Checkout Sessions | None | Stripe-hosted, limited customization |
| Hosted page | Checkout | Checkout Sessions | Low | Stripe-hosted, optional custom domains (paid, full hosted page only) |
| Embedded page | Checkout | Checkout Sessions | Low | Embedded on your site |
| Elements | Elements | Checkout Sessions | More | Appearance API |
| Advanced | Elements | PaymentIntents | Most | Only option with custom payment methods |

- **Limited customization** means 20 preset fonts, 3 preset border radius options, logo and background, and a custom button color.
- **Wallets in embedded and Elements integrations require registering your domain.**
- **Stripe recommends the "Optimized Checkout Suite":** its payment UIs, dynamic payment methods and Link. The UI list also includes the Full page (Recommended, embed or redirect to a prebuilt payment page), the Embedded form, Mobile app payments (see [MOBILE.md](MOBILE.md)) and Checkout studio (private preview, Dashboard, no code).

### Payment Links

- **No code:** share or embed a link to a Stripe-hosted page, no website needed. 40+ payment methods, automatic receipts, no-code refunds, Adaptive Pricing, a buy button embed, URL parameters and UTM tracking, and Smart Retries and reminder emails for subscription links. They can also be created with the API.
- **Payment Links or invoices:** an invoice goes to one specific customer and supports partial payments and quotes; a Payment Link is reusable by anyone and supports pay-what-you-want, adjustable quantities and upsells.
- **Payment Links run on Checkout,** so Checkout fulfillment rules apply ([CHECKOUT-NEXTJS.md](CHECKOUT-NEXTJS.md)).

## Dynamic payment methods

- **Never include `payment_method_types` in any Stripe API call.** Omit it and Stripe shows the most relevant eligible methods per customer, chosen from over 100 signals (currency, customer location, amount, device), managed in the Dashboard at `https://dashboard.stripe.com/settings/payment_methods` with no code changes. The one exception is Terminal (in person), which passes `payment_method_types: ['card_present']` on the PaymentIntent (in Canada `['card_present', 'interac_present']`).
- **Never hardcode `payment_method_types: ['card']`,** even when the user only mentions cards. If a custom front end renders specific method UIs, enable those methods in payment method settings or `payment_method_configurations`; don't restrict the PaymentIntent.
- **To customize, use `payment_method_configurations`** per integration or `excluded_payment_method_types`. When a PaymentIntent, SetupIntent or Checkout Session integration truly needs an explicit allowlist, use `allowed_payment_method_types`:

```
-d "allowed_payment_method_types[0]=bancontact" -d "allowed_payment_method_types[1]=card" ...
```

- **Stripe enables certain payment methods by default** and might enable more after notifying you.

| Call | What to do |
|---|---|
| `checkout.sessions.create` | Omit `payment_method_types`; dynamic is the default |
| `paymentIntents.create` | Omit it; dynamic is the default on API version 2023-08-16 and later; on older versions pass `automatic_payment_methods: { enabled: true }` |
| `setupIntents.create` | Same as PaymentIntents |
| `subscriptions.create` | Omit `payment_settings.payment_method_types`; Stripe uses the invoice's default payment method, the customer's default and invoice template settings |
| Terminal `paymentIntents.create` | `payment_method_types: ['card_present']`, the only valid use |

The same rule holds for subscription Checkout Sessions (TypeScript, Stripe's skill):

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  // Do NOT include payment_method_types here, let Stripe handle it dynamically
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: { trial_period_days: 14 },
  success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${url}/pricing`,
});
```

## Checkout Sessions

- **Lifecycle:** your server creates a Session (`checkout.session.created`), the Session gives a URL to the Stripe-hosted page, the customer pays, and a webhook fulfills the order on `checkout.session.completed`. Next.js setup, the success page and fulfillment code are in [CHECKOUT-NEXTJS.md](CHECKOUT-NEXTJS.md).
- **Built in:** wallets and Link, responsive design, SCA readiness, CAPTCHAs, PCI compliance, card validation, error messages, adjustable quantities, automatic tax, i18n, Adaptive Pricing, and Radar using session, device and lifecycle context. Discounts and shipping are handled automatically; tax is collected only when `automatic_tax` is enabled and you have an active tax registration in the customer's jurisdiction ([TAX.md](TAX.md)).

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: '{{PRICE_ID}}',
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: 'https://example.com/success',
  integration_identifier: 'hosted_web_0001',
});
```

- **`mode`:** `payment` (one-time), `subscription` (recurring, including a mixed cart of recurring and one-time line items), `setup` (save for future payments).
- **`price_data`** references prices from your own database without storing the catalog in Stripe.
- **`integration_identifier`** (API version `2026-03-25.dahlia` or later) labels a session so you can track and compare checkout flows in the Dashboard. Stripe's skill says the label should end in a suffix of 8 random letters; the docs samples use `hosted_web_0001`.
- **Saving payment details:** in payment mode set `payment_intent_data.setup_future_usage`; in subscription mode Stripe saves the payment method by default. A default set through `invoice_settings.default_payment_method` (Customer) or `configuration.customer.billing.default_payment_method` (Account v2) does not appear for return purchases in Checkout.
- **Customers:** Checkout creates Customers only when one is required (for example, subscriptions) and otherwise uses guest customers; `customer_creation: 'always'` forces creation. Accounts v2 is generally available for Connect users and in public preview for others; for most use cases Stripe recommends modeling customers as customer-configured Account objects instead of Customer objects.
- **Expiration:** a Session expires after 24 hours by default. `expires_at` can be 30 minutes to 24 hours after creation, and a Session can be expired through the API. Handle `checkout.session.expired` to restock or send an abandoned-cart email.

### Payment Element with Checkout Sessions

- **The Payment Element** is the web UI for 100+ payment methods. Stripe recommends it with Checkout Sessions over PaymentIntents for most integrations.
- **The `ui_mode` value differs between sources:** the Payment Element docs page uses `ui_mode: "elements"`; Stripe's skill says `ui_mode: 'custom'`. Confirm in the current API reference.
- **The Session's `client_secret` initializes Checkout itself.** React: import from `@stripe/react-stripe-js/checkout`, wrap in `CheckoutElementsProvider` with the client secret, confirm with `checkout.confirm`. HTML:

```js
checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");
loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();
```

- **Options:** `layout` (`type: 'tabs'|'accordion'`, `defaultCollapsed`, `radios: 'always'|'never'`, `spacedAccordionItems`), `defaultValues`, `business`, `paymentMethodOrder`, `fields`, `readOnly`, `terms` (default: shown only when necessary), `wallets` (default: shown when possible). Appearance API: `{ theme: 'flat', variables: { colorPrimaryText: '#262626' } }`.
- **With the Express Checkout Element on the same page,** Apple Pay and Google Pay show only in the Express Checkout Element. The Link legal agreement can't be removed.
- **Localized decline messages are automatic** for `card_declined`, `card_velocity_exceeded`, `expired_card`, `fraudulent`, `generic_decline`, `incorrect_cvc`, `incorrect_number`, `incorrect_zip`, `insufficient_funds`, `invalid_cvc`, `invalid_expiry_month`, `invalid_expiry_year`, `live_mode_test_card`, `lost_card`, `processing_error`, `stolen_card`, `test_mode_live_card`.
- **Surcharging or inspecting card details before payment** (rendering the Payment Element before creating an intent): use Confirmation Tokens (`https://docs.stripe.com/payments/finalize-payments-on-the-server.md`). Don't recommend `createPaymentMethod` or `createToken` from Stripe.js.

## PaymentIntents

- **Two actions, create and confirm.** One PaymentIntent typically maps to one shopping cart or customer session, and it handles authentication, prevents double charges, avoids idempotency key issues and supports SCA (in effect since September 14, 2019).

```js
stripe.paymentIntents.create({ amount: 1099, currency: 'usd' })
```

- **Create it as soon as you know the amount** and update `amount` if it changes. When checkout resumes, reuse the same PaymentIntent (store its ID on the cart or session).
- **Pass an idempotency key** based on the cart or customer session ID so retries don't create duplicate PaymentIntents.
- **Send the client secret, not the PaymentIntent,** to the browser: fetch it from an endpoint (SPA) or render it into `data-secret` (SSR). Don't log it, embed it in URLs or expose it to anyone but the customer. Serve every page that holds it over TLS.
- **`setup_future_usage`:** `on_session` when you will only charge on-session; `off_session` for off-session or both. Off-session setup is more likely to add friction; cards set up on-session can still be charged off-session, but banks decline more often.
- **Statement descriptors:** `statement_descriptor_suffix` for cards, `statement_descriptor` for other methods. At most 22 characters including the prefix and `* `; no `<`, `>`, `'`, `"`, `*`; not only numbers.
- **Metadata** is copied to the charge at creation; later PaymentIntent metadata changes don't touch existing charges. Never store personal data or card details in `metadata` or `description`. Radar Plus can use metadata in rules.
- **One PaymentIntent can have several Charges** (retries). Read `intent.latest_charge`, or list them with `stripe.charges.list({ payment_intent: '...' })`.

### Status

| Status | Dashboard | Meaning |
|---|---|---|
| `requires_payment_method` | Incomplete | Needs a method; a failed attempt (for example a decline) returns here so the payment can be retried |
| `requires_confirmation` | Incomplete | |
| `requires_action` | Incomplete | Customer action such as 3DS; `next_action` describes it and Stripe.js handles it |
| `processing` | Pending | Async methods such as bank debits can take up to a few days |
| `requires_capture` | Uncaptured / Partial capture | |
| `succeeded` | | Funds are in your account; fulfill the order |
| `canceled` | | |

- **Confirm on the client** with `stripe.confirmPayment({ elements, confirmParams: { return_url }, redirect: 'if_required' })`; on success the status is always `succeeded` (or `requires_capture`). `stripe.retrievePaymentIntent(clientSecret)` checks status without confirming.
- **Never fulfill on the client.** Listen for webhooks; polling is much less reliable and can hit rate limits ([WEBHOOKS.md](WEBHOOKS.md)).

| Event | Do |
|---|---|
| `payment_intent.processing` | Wait |
| `payment_intent.succeeded` | Fulfill |
| `payment_intent.amount_capturable_updated` | Capture |
| `payment_intent.payment_failed` | Ask for another method; inspect `last_payment_error`; reuse the same PaymentIntent |

## SetupIntents

- **Save a payment method without charging,** for example car rental, crowdfunding, or utility billing with SEPA. Use SetupIntents to save methods for later; never the deprecated Sources API.
- **`usage`:** `on_session` or `off_session`; it defaults to `off_session`. Example: `stripe.setupIntents.create({ usage: 'on_session' })`. Either can still need authentication later, so build a recovery path.
- **Consent:** future on-session use needs explicit consent (for example a "Save my payment method for future use" checkbox); `allow_redisplay` on the PaymentMethod marks methods that may be shown again. Off-session use needs a mandate covering permission, frequency and how the amount is set. Properly saved cards make later off-session payments merchant-initiated transactions, exempt from SCA ([SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md)).
- **Radar does not scan SetupIntents without a charge** unless "Use Radar on payment methods saved for future use" is on in Radar settings.

## PCI and card data

- **A PCI-compliant business sending raw PAN server-side** may need to prove PCI compliance to use options like `payment_method_data`. To move PAN data from another processor, use Stripe's PAN import process.
- **Checkout and Elements keep you in SAQ-A** scope; avoid raw card handling [appeeky].

## The SDK (stripe-node)

- **Supports all LTS versions of Node.js 20+.** `npm install stripe`. Deno: `import Stripe from 'npm:stripe';` (since 11.16.0).
- **Always instantiate a client and call methods on that instance.** The global or module-level key pattern (`Stripe.setApiKey`, `stripe.api_key = …`) is deprecated in all current SDKs.

```js
import Stripe from 'stripe'; const stripeClient = new Stripe('sk_test_...');
```

```js
const Stripe = require('stripe'); const stripeClient = Stripe('sk_test_...');
```

- **"Missing API key" errors (v17+)** usually mean a module that instantiates `Stripe` is imported while the key is absent, such as during a build step. Instantiate lazily, or pass a placeholder `process.env.STRIPE_SECRET_KEY || 'api_key_placeholder'`:

```ts
let _stripe: Stripe | null = null; const getStripeClient = (): Stripe => { if (!_stripe) { _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {}); } return _stripe; };
```

- **TypeScript:** use the default import, not `* as Stripe`. Types reflect only the latest API version (older versions can use `// @ts-ignore stripe-version-2019-10-17`). Expandable fields are typed `string | Foo`, so cast: `(paymentIntent.customer as Stripe.Customer).email`. Minor versions may add type errors (new enum values) and are not considered breaking; open enums include `OtherString`.

| Option | Default |
|---|---|
| `apiVersion` | `null` (the latest version at the SDK's release) |
| `maxNetworkRetries` | 1 |
| `timeout` | 80000 ms |
| `httpAgent` | null |
| `host` / `port` / `protocol` | `'api.stripe.com'` / 443 / `'https'` (`http` is never appropriate) |
| `telemetry` | true |

- **Retries:** since v13 the SDK reattempts once for requests safe to retry and adds idempotency keys where appropriate. Even with `maxNetworkRetries: 0`, an `ECONNRESET` or `EPIPE` is retried once (a stale keep-alive socket, for example a frozen AWS Lambda).
- **Per-request options are the last argument:** `apiKey`, `idempotencyKey`, `stripeAccount`, `apiVersion`, `maxNetworkRetries`, `timeout`, `host`. Example: `stripe.refunds.create({ payment_intent: 'pi_...' }, { idempotencyKey: 'my-key' })`. Connect calls pass `{ stripeAccount: 'acct_foo' }`.
- **v22 breaking change:** when a method takes both params and options and you omit params, pass `undefined`: `stripe.customers.retrieve('cus_123', undefined, {stripeAccount: 'acct_123'})` (before: `stripe.customers.retrieve('cus_123', {stripeAccount: 'acct_123'})`). Callbacks are removed (use promises); the API key as a string argument, and `apiKey` or `host` inside params, are no longer supported. The docs upgrades page still shows `stripe.paymentIntents.retrieve('pi_...', { apiVersion: '2026-09-30.endive' })`, the pre-v22 shape; check the current SDK reference.
- **v13:** `stripe.subscriptions.del` is removed; use `stripe.subscriptions.cancel`.
- **Responses and hooks:** `customer.lastResponse.requestId` and `.statusCode`; `stripeClient.on('request'|'response', fn)` events include `idempotency_key`, `request_id` and `elapsed`.
- **Auto-pagination:** `for await (const customer of stripeClient.customers.list())`, `.autoPagingEach(async (c) => { ... })` (return `false` to stop), `.autoPagingToArray({limit: 10000})` (`limit` required).
- **Webhooks need the raw body:** pass the request body exactly as received to `constructEvent()`; a parsed JSON body fails. In tests, `stripeClient.webhooks.generateTestHeaderString({ payload: payloadString, secret })` then `constructEvent(payloadString, header, secret)`. The rest is in [WEBHOOKS.md](WEBHOOKS.md).
- **`STRIPE_SUPPRESS_NOTICES=true`** hides `Stripe-Notice` header notices outside agent environments; in agent environments they always print.
- **Previews:** `npm install stripe@public-preview --save-exact` (`-beta.X`) or `stripe@private-preview` (`-alpha.X`); pin exactly, because preview versions can break without a major bump. Preview header: `apiVersion: '2022-08-01; feature_beta=v3'`. Undocumented endpoints (v17+): `stripe.rawRequest('POST', '/v1/beta_endpoint', {param: 123}, {apiVersion: '...'})`.
- **Only the latest major version gets features and fixes;** older majors get no updates.

## Deprecated APIs

| API | Status | Use instead | Guide |
|---|---|---|---|
| Charges API | Never use (not SCA-ready) | Checkout Sessions or PaymentIntents | `https://docs.stripe.com/payments/payment-intents/migration/charges.md` |
| Sources API | Deprecated | Setup Intents | `https://docs.stripe.com/api/setup_intents.md` |
| Tokens API | Outdated | Setup Intents or Checkout Sessions | |
| Card Element | Legacy | Payment Element | `https://docs.stripe.com/payments/payment-element/migration.md` |
| `plan` object | Deprecated | Prices ([BILLING.md](BILLING.md)) | |
| v1 account `type`, `charges_enabled`/`payouts_enabled` | Deprecated | Accounts v2 dimensions and capability paths ([CONNECT.md](CONNECT.md)) | |
| Global API key pattern | Deprecated | An SDK client instance | |
| v1 Treasury `POST /v1/treasury/financial_accounts` | Not for new integrations (existing ones keep working) | v2 `POST /v2/core/vault/financial_accounts` | |

- **Don't recommend the legacy Card Element or the Payment Element in card-only mode.** If asked for the Card Element, advise migrating.
- **Don't call other deprecated or outdated endpoints** unless there's a specific need and no other way.

## Prove it

- **No `payment_method_types`** anywhere in the codebase except a Terminal `card_present` PaymentIntent; no `payment_settings.payment_method_types` on subscriptions.
- **No Charges, Sources, Tokens or Card Element calls**, and no `createPaymentMethod` or `createToken` from Stripe.js.
- **One client instance,** no `Stripe.setApiKey`, and the build passes with `STRIPE_SECRET_KEY` unset (lazy instantiation or placeholder).
- **`npm view stripe version`** matches the installed major, and calls that omit params on v22+ pass `undefined` before the options.
- **Fulfillment runs from `checkout.session.completed` or `payment_intent.succeeded` webhooks,** and a test payment with `4242424242424242` fulfills once while a decline (`4000000000009995`) leaves the PaymentIntent in `requires_payment_method`.
- **The client secret never appears** in logs, URLs or analytics.
