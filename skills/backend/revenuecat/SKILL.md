---
name: revenuecat
description: "Builds in-app subscriptions and purchases with RevenueCat for Flutter, React Native, Expo and web: the object model (products, entitlements, offerings, packages, CustomerInfo), store setup in App Store Connect and Google Play Console, SDK install, configure, identity and purchase flows, RevenueCat Paywalls and Customer Center, Test Store and store sandboxes, errors and Trusted Entitlements, webhooks and the REST API for your backend, billing issues, refunds, plan changes and web billing, migration and SDK upgrades, the rc CLI and MCP server, charts, audiences, experiments, forecasting and valuation. Use when adding RevenueCat to an app, gating features on a subscription, building or presenting a paywall, wiring purchase webhooks to a backend, testing purchases, debugging empty offerings or missing entitlements, or answering a question about a RevenueCat project's data."
---

# RevenueCat

RevenueCat sits between the app and the stores: its SDK runs the store purchase sheet and posts every purchase token to the RevenueCat backend for verification before the app sees confirmation, and the backend computes which access the customer owns. Most outcomes come down to keeping two reads apart: Offerings say what to sell, CustomerInfo says what the user owns, and access is gated on one thing, an active entitlement. Most failures are configuration mismatches (wrong key for the platform, a bundle ID or package name that doesn't match, a current offering with no packages, store products still in draft), not code bugs. These files cover Flutter (`purchases_flutter`), React Native and Expo (`react-native-purchases`) and the Web SDK; some sources are chapters of RevenueCat's Android SDK handbook, and names from it are tagged [Kotlin]. For card payments and subscriptions on the web through Stripe itself, see [stripe SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The object model, what RevenueCat replaces, CustomerInfo and EntitlementInfo fields, caching and offline, subscription states, the purchase call, one-time products | [CONCEPTS.md](CONCEPTS.md) |
| Creating the project, MCP or `rc` bootstrap, app configs, API keys, App Store Connect (In-App Purchase Key, products), Google Play Console (service credentials, products), store server notifications, the dashboard catalog and the restore-policy link | [STORE-SETUP.md](STORE-SETUP.md) |
| Flutter: install, configure, current identity and direct account switching, entitlement gates and the listener, offerings, purchase and restore, Flutter Web, breaking changes by version | [FLUTTER.md](FLUTTER.md) |
| React Native and Expo: install, development builds, configure, current identity and direct account switching, entitlement gates, offerings, purchase and restore, React Native Web, breaking changes by version | [REACT-NATIVE.md](REACT-NATIVE.md) |
| Choosing RevenueCat Paywalls or a custom paywall, presenting paywalls in Flutter, React Native and web, paywall options, creating and editing dashboard paywalls with MCP or `rc`, design and audit rules | [PAYWALLS.md](PAYWALLS.md) |
| Existing-subscriber management: Customer Center configuration, platform differences, callbacks and Flutter/React Native views | [CUSTOMER-CENTER.md](CUSTOMER-CENTER.md) |
| Shared identity, aliases, account switching, restore-transfer policy and customer attributes | [IDENTITY.md](IDENTITY.md) |
| RevenueCat Web billing engines, the Web SDK, Stripe Billing compatibility and purchase redemption links | [WEB-BILLING.md](WEB-BILLING.md) |
| Testing channels, the Test Store and its key, keys per build, Flutter and Expo test builds, App Store sandbox and StoreKit files, Google Play licensed debug and test-track paths, accelerated renewals, test cases, confirming on the dashboard | [TESTING.md](TESTING.md) |
| The debug log, the universal checklist, symptoms and fixes, SDK error codes, iOS and Android specifics, Flutter and Expo specifics, known platform issues, App Store rejections, dashboard inspection | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| SDK error handling and user messages, REST API errors, API keys and rotation, supported Trusted Entitlements modes, the server as the authority, user identity, Customer Authentication | [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md) |
| What your backend owns, REST or webhooks per endpoint, webhook setup, authentication and HMAC signing, the idempotent handler, event types, fields and flows, REST API v1 and v2, rate limits, Supabase and other backends | [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md) |
| Billing issues and grace periods, cancellations, pauses, win-back, refunds and Refund Control, plan and price changes, Google Play alternative billing | [BILLING-AND-RECOVERY.md](BILLING-AND-RECOVERY.md) |
| Adopting RevenueCat over existing purchase code (observer mode, `purchasesAreCompletedBy`), keeping users continuous, cutting over, upgrading across SDK majors | [MIGRATION.md](MIGRATION.md) |
| Docs for agents, the `rc` CLI, SDK or REST, project status, product store state plans, SDK feature gates and adoption, dashboard links, your own RevenueCat plan | [CLI-AND-API.md](CLI-AND-API.md) |
| Charts through MCP: the schema-first query workflow, reading output, chart IDs, metric definitions, investigating a metric shift, comparisons, chart links | [CHARTS-AND-METRICS.md](CHARTS-AND-METRICS.md) |
| Filtering, ranking and counting customers with audiences, filter rules, fields and operators, project-specific values, audience links | [AUDIENCES.md](AUDIENCES.md) |
| A/B testing offerings and paywalls: control and treatments, the experiment lifecycle, analyzing results | [EXPERIMENTS.md](EXPERIMENTS.md) |
| MRR, revenue and subscriber forecasts with the churn line, run-rates and scenarios, valuing and selling a subscription app | [FORECASTING-AND-VALUATION.md](FORECASTING-AND-VALUATION.md) |

## The rules

1. **Gate access on an entitlement, never on a product ID or a transaction.** Read `customerInfo.entitlements.active` (`isActive`, "Nothing else"), fetch it on launch and keep it current with the customer info update listener, removed on dispose; don't unlock inside the purchase callback, and don't compute access from dates on the client or mirror the seven store states in your database.
2. **Sell from the `current` offering (or a placement), never hardcoded product IDs.** Build the paywall dynamically from packages, take prices from the store product, and let the dashboard swap products, offerings and targeting without an app release.
3. **Configure once, early, with the right public key for each platform.** `appl_` for iOS, `goog_` for Android; never put a secret `sk_` key in any client or commit it; use the Test Store `test_` key only in debug builds, because release builds crash on purpose when they find it.
4. **Identify real users with `logIn` and a stable, opaque, non-guessable ID** after your auth confirms the session; never an email, phone number, sequential ID or hardcoded string. Restore only from a visible, user-triggered button; programmatic sync uses `syncPurchases`.
5. **Give every purchase exactly one owner.** A RevenueCat Paywall runs the purchase itself, so never call `purchase` alongside it; with your own purchase code, exactly one side, your code or RevenueCat, finishes and acknowledges each transaction. User cancellation is not an error: check `userCancelled` first and return silently, and add no retry loops, since the SDK already retries transient failures.
6. **The server is the authority for paid content, not the client.** Never trust `customerInfo` or a header the client sends; each premium endpoint either calls the REST API per request or reads a flag your webhooks maintain, one documented mechanism per endpoint.
7. **Webhooks: authenticate, deduplicate by `event.id`, acknowledge with 200 inside 60 seconds, and revoke only on `EXPIRATION`.** `CANCELLATION`, `BILLING_ISSUE` and `SUBSCRIPTION_PAUSED` are not access changes, and the grant on `RENEWAL` must be additive so a resubscribed user regains access.
8. **Ask the tool, don't guess.** Read each chart's options schema before `get-chart-data`, store prices and availability from `get-product-store-state`, SDK support from `list-sdk-feature-gates`, commands from `rc commands --schemas --json`, and dashboard IDs from tool results; confirm with the user before any write that reaches customers or the stores.

## Prove it

Apply SDK, offering and purchase checks to the selected client platforms and purchase flow; apply webhook checks when implementing or changing that endpoint. Chart, audience and forecast work uses its query evidence and selected topic's checks without requiring a native test purchase.

The native console shows the `Purchases is configured` banner on each platform with no auth error when offerings load; `getOfferings()` returns a non-null `current` with packages; a test purchase lands in the dashboard Sandbox view on the expected App User ID and flips the gated UI through the listener; a release build carries no `test_` key and the app source has no `sk_` key; no code path grants access from a product ID or a client-sent claim; the webhook endpoint rejects a request without the configured authorization, treats a replayed `event.id` as a no-op and revokes only on `EXPIRATION`; and every file's own Prove it checks pass for the parts you touched.
