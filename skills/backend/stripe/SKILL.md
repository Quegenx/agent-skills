---
name: stripe
description: "Builds Stripe integrations: Checkout Sessions, PaymentIntents and SetupIntents with dynamic payment methods, Checkout in Next.js, webhooks and fulfillment, Billing with products, prices, subscriptions, trials, prorations, the customer portal and dunning, usage-based billing with Metronome or Meters, Stripe Tax and Managed Payments, Connect with Accounts v2, charge patterns and KYC requirements, keys, Radar and 3D Secure, idempotency, errors and rate limits, API versions and SDK upgrades, sandboxes, test cards, test clocks and the CLI, React Native and Flutter payment sheets, Supabase, Stripe Apps, agent tools and the MCP, revenue metrics and account operations. Use when adding Stripe to an app, taking a payment or starting a subscription, handling Stripe webhooks, building a Connect platform or marketplace, collecting tax, upgrading the Stripe API version or SDK, testing a Stripe flow, building a Stripe App, or auditing a Stripe account's revenue, disputes or payouts."
---

# Stripe

Stripe takes money through a few high-level objects (Checkout Sessions, the Billing APIs, Connect's Accounts v2) and reports what happened afterwards through events. Most outcomes are decided by two choices: picking the highest-level object that fits (Checkout Sessions over hand-built PaymentIntents, Billing over a renewal loop, Accounts v2 fields over legacy account types), and treating webhooks as the source of truth, verified on the raw body and handled idempotently, so that fulfillment and access never depend on the client or the success page. Stripe changes often: pin the API version, use the latest SDK, and read the current docs (`stripe docs`) rather than memory. Some files carry facts from a third-party skill set (appeeky/stripe-skills), tagged [appeeky]; where they disagree with Stripe's own material, the files say so and follow Stripe. For in-app subscriptions sold through the App Store and Google Play, see [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Dispute categories, inquiry versus chargeback, complete evidence, final submission and actual provider outcomes | [DISPUTES.md](DISPUTES.md) |
| Choosing Checkout Sessions, PaymentIntents or SetupIntents, Payment Links, dynamic payment methods, the Payment Element, PCI, stripe-node setup and options, deprecated APIs | [PAYMENTS.md](PAYMENTS.md) |
| Checkout in a Next.js App Router app: the server-only client, the Route Handler, the success page, idempotent fulfillment, conversion | [CHECKOUT-NEXTJS.md](CHECKOUT-NEXTJS.md) |
| Webhooks: event destinations, thin vs snapshot events, the handler contract, Next.js and Express handlers, signature verification, subscription events, retries, ordering, duplicates, recovery | [WEBHOOKS.md](WEBHOOKS.md) |
| Idempotency keys, indeterminate outcomes, status codes, Node error types, rate limits | [IDEMPOTENCY-AND-ERRORS.md](IDEMPOTENCY-AND-ERRORS.md) |
| Billing: the product and price catalog, integration design, the subscription lifecycle and statuses, provisioning access, the customer portal, Smart Retries and dunning | [BILLING.md](BILLING.md) |
| Changing a running subscription: trial offers and free trials, upgrades and downgrades, prorations, the billing cycle anchor, pending updates, canceling, pausing | [SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md) |
| Usage-based billing: Metronome or Billing Meters, Metronome rules, meters, recording usage, meter errors, alerts, billing credits | [USAGE-BASED.md](USAGE-BASED.md) |
| Stripe Tax: setup, tax codes, customer location, per-integration settings, registrations, threshold monitoring, filing, zero-tax diagnosis, Connect, Managed Payments | [TAX.md](TAX.md) |
| Connect: Accounts v2 fields, configurations, creating accounts, direct, destination and separate charges, fees, onboarding, capability gating, embedded components, disputes and reversals | [CONNECT.md](CONNECT.md) |
| Recommending a Connect configuration for a business: discovery questions, decision matrix, compatibility matrix, fee structure, negative balance liability and risk, the plan template | [CONNECT-CHOOSING.md](CONNECT-CHOOSING.md) |
| Which KYC fields a connected account needs, from Stripe's public requirements endpoints | [CONNECT-VERIFICATION.md](CONNECT-VERIFICATION.md) |
| Keys and restricted keys, storing and rotating them, leak scanning, access policies, CSP, OAuth and 2FA, Radar, SCA and 3D Secure, liability shift | [SECURITY-AND-KEYS.md](SECURITY-AND-KEYS.md) |
| API versions, pinning, choosing a target version, SDK and Stripe.js versioning, moving event destinations during an upgrade | [API-VERSIONS.md](API-VERSIONS.md) |
| Sandboxes, test cards and PaymentMethods, test clocks, the billing test checklist, the CLI (login, sandboxes, listen, trigger, logs), integration code review | [TESTING-AND-CLI.md](TESTING-AND-CLI.md) |
| React Native and Flutter: what the app stores allow, app-to-web Checkout, the Payment Sheet, Apple Pay and Google Pay, return URLs, subscriptions from the app | [MOBILE.md](MOBILE.md) |
| Stripe in Supabase: the Stripe Wrapper, the Stripe Sync Engine, webhooks in an Edge Function | [SUPABASE.md](SUPABASE.md) |
| Stripe Apps: extension types, viewports, scaffold and dev loop, authentication, the Secret Store, the UI sandbox and components, script extensions, publishing | [STRIPE-APPS.md](STRIPE-APPS.md) |
| Agent tools: `stripe docs`, Stripe Directory, Stripe Pay, Stripe Projects, the Stripe MCP, feedback | [AGENT-TOOLS.md](AGENT-TOOLS.md) |
| Named MRR conventions, historical churn/cohorts, forecasting, NRR, invoice proxies versus cash and recognition, pricing experiments and coupons [appeeky] | [REVENUE-METRICS.md](REVENUE-METRICS.md) |
| Account operations over the MCP: disputes and refunds, balance and payouts, payout reconciliation, a health dashboard [appeeky] | [OPERATIONS.md](OPERATIONS.md) |

## The rules

1. **Use the highest-level API that fits.** Checkout Sessions for on-session payments (the Payment Element backed by Checkout Sessions for a custom form), SetupIntents to save a payment method, the Billing APIs with Checkout for anything recurring, Metronome for new usage-based billing. Use PaymentIntents only for off-session payments or when the user explicitly asks; never the Charges, Sources or Tokens APIs.
2. **Never pass `payment_method_types`.** Let Stripe choose payment methods dynamically; the only exception is Terminal's `['card_present']`. Customize with `payment_method_configurations` or `excluded_payment_method_types`.
3. **Webhooks are never optional.** Verify every signature against the untouched raw body before processing, return `2xx` fast, deduplicate by event ID, and use the [shared server fulfillment contract](CHECKOUT-NEXTJS.md#fulfillment), never a client callback as proof of payment.
4. **Access follows the subscription status.** Provision on `invoice.paid` once the subscription reads `active`, revoke on `canceled` or `unpaid`, and handle `customer.subscription.*`, `invoice.paid` and `invoice.payment_failed` before calling a subscription integration complete.
5. **Keys stay on the server, scoped.** Recommend a restricted key (`rk_`) per service over a secret key, keep it in a secrets vault (an environment variable only when there is no vault), never in code, logs or an app bundle; clients get only the publishable key. Rotate immediately on any exposure.
6. **Connect means Accounts v2.** Create accounts with `/v2/core/accounts` and explicit `dashboard`, `fees_collector` and `losses_collector`, never the legacy `type`; check v2 capability status before any charge, transfer or payout; and never put `application_fee_amount` on separate charges and transfers.
7. **`automatic_tax` alone collects nothing.** Without an active registration in the customer's jurisdiction Stripe returns zero tax and no error; add a short Stripe Tax note to every Billing answer, and verify with `taxability_reason`, not the amount.
8. **Pin the version and use the latest.** Set `apiVersion` explicitly in code, use the latest API version and SDK unless the user names one, look the version up (`stripe docs /api/versioning`) instead of guessing, and build in general sandboxes, not the shared test mode sandbox.

## Prove it

Use payment and fulfillment checks for payment integrations, signature and replay checks for webhook work, and renewal/test-clock checks for recurring billing. Dispute, account-metric and API-research tasks use their selected topic's evidence without implementing a payment or subscription flow.

In a general sandbox with `stripe listen` forwarding to your handler: a `4242424242424242` payment fulfills exactly once even when the event is resent, a `4000000000009995` decline fulfills nothing, a tampered body gets `400`, a test clock advanced past renewal reaches `invoice.paid` and keeps access only while the subscription reads `active`; the codebase has no `payment_method_types` (outside Terminal), no secret key in source or client bundles, an explicit `apiVersion`, and every file's own Prove it checks pass for the parts you touched.
