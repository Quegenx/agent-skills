# CLI and API

The tools an agent uses to inspect and change a RevenueCat project: the `rc` CLI, the RevenueCat MCP server's tools, the API quick reference that says when to use the SDK and when REST, a project status check, product store state (prices and availability written through reviewable plans), SDK compatibility checks, dashboard links and your own RevenueCat plan. The rule that decides most outcomes: ask the tool, don't guess. Ask the binary for commands and flags, ask `list-sdk-feature-gates` before claiming a version supports something, read store state from the store state tools, and take IDs from results. REST endpoints are in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md); keys are in [ERRORS-AND-SECURITY.md](ERRORS-AND-SECURITY.md); products and entitlements are in [CONCEPTS.md](CONCEPTS.md).

**Contents:** [Docs for agents](#docs-for-agents) · [The rc CLI](#the-rc-cli) · [SDK or REST](#sdk-or-rest) · [Project status overview](#project-status-overview) · [Product store state](#product-store-state) · [SDK compatibility and adoption](#sdk-compatibility-and-adoption) · [Dashboard links](#dashboard-links) · [Your RevenueCat plan and invoices](#your-revenuecat-plan-and-invoices) · [Prove it](#prove-it)

## Docs for agents

- **Index:** `https://www.revenuecat.com/docs/llms.txt`, split by section so every file fits in one agent fetch; each section has its own `llms.txt` (for example `https://www.revenuecat.com/docs/getting-started/llms.txt`). The full docs in one file: `https://www.revenuecat.com/docs/llms-full.txt`.
- **Any page as Markdown:** append `.md` to the docs URL.
- **MCP server, CLI and AI Toolkit pages:** `https://www.revenuecat.com/docs/tools/mcp`, `/docs/tools/cli`, `/docs/tools/ai-toolkit`.

## The rc CLI

- **What it is:** the official RevenueCat CLI. It covers most of the same project, app, product, entitlement, offering, paywall, chart and store-state operations as the RevenueCat MCP server. The CLI adds paywall generate and edit; the MCP server has some SDK feature-gate and experiment tools the CLI does not.
- **Install:**

| Way | Command | Fits |
|---|---|---|
| No install | `npx @revenuecat/cli <command>` | CI and agent sandboxes |
| Homebrew | `brew install RevenueCat/tap/rc` | |
| npm global | `npm install -g @revenuecat/cli` | |

- **Auth:** `rc auth login` (browser OAuth), or non-interactively `--api-key` or the `RC_API_KEY` env var. It uses a secret key (`sk_...`) because the CLI is server-side. Never put that key in an app.
- **Discovery: don't guess a command or flag, ask the binary.**
  - `rc commands --json`: the full tree, with capability IDs in colon form such as `apps:create` and `products:store:plan`.
  - `rc commands --schemas --json`: every flag, argument and example; the most reliable way for an agent.
  - `rc schema <command> --json` takes space-separated tokens (`rc schema apps create`). `rc schema apps:create` silently returns the root schema.
  - `rc --help`, `rc <noun> --help`.
- **Output and scripting:**
  - `--json`: data to stdout, progress to stderr. The envelope is `{ "data": ... }`; lists are usually `data.items[]`, but some differ (charts use `data.names[]`).
  - `--no-input`: fail instead of prompting (scripts, CI, agents).
  - `--yes` / `-y`: skip confirmations.
  - `--project-id <id>` (or `rc projects use`); pass it explicitly in scripts.

| Exit code | Meaning |
|---|---|
| `0` | Success |
| `1` | Error |
| `2` | Bad usage |
| `4` | Auth |
| `5` | Not found |
| `6` | Rate limited |

- **Commands:**

| Area | Commands |
|---|---|
| Projects and apps | `rc projects list\|create\|use`, `rc apps list\|create\|keys` |
| Catalog | `rc products ...`, `rc entitlements ...`, `rc offerings ...`, `rc packages ...` |
| Store setup and state | `rc setup apple\|google`, `rc products store plan\|apply\|sync` |
| Data | `rc charts list\|show`, `rc customers ...` |
| Paywalls | `rc paywalls generate\|edit\|publish` |
| Webhooks | `rc webhooks list` (the MCP `list-webhook-integrations` equivalent) |
| Dashboard | `rc open [section] [id] --print` |
| Anything else | `rc api <METHOD> <path>` |

- **Prefer the specific command.** Drop to `rc api <METHOD> <path>` only for endpoints not yet in the CLI surface. Each MCP `list-*` tool has an `rc <noun> list` equivalent.
- **`rc invoices` lists a customer's invoices,** not your RevenueCat bill (see [Your RevenueCat plan and invoices](#your-revenuecat-plan-and-invoices)).

## SDK or REST

- **Use the SDK** when the code runs in the app: purchase, restore, cached CustomerInfo, offerings, identify and log out, listeners, UI entitlement gating. SDK syntax is in [FLUTTER.md](FLUTTER.md) and [REACT-NATIVE.md](REACT-NATIVE.md).
- **Use REST** when the code runs on your backend, a webhook handler, an admin tool or a scheduled job: grant or revoke a promotional entitlement, override a subscription, look up a subscriber from another service, refund, deliver events to another system, or integrate a system that cannot embed the SDK. Paths and payloads are in [BACKEND-AND-WEBHOOKS.md](BACKEND-AND-WEBHOOKS.md#rest-api-v1).
- **SDK concepts behind the quick reference** (Android SDK 10.x names): configure options `appUserID` (null for anonymous), `showInAppMessagesAutomatically` (default true), `purchasesAreCompletedBy` (default RevenueCat), `entitlementVerificationMode`, `diagnosticsEnabled` (default false), `pendingTransactionsForPrepaidPlansEnabled` (default false); set the log level before configure. Packages carry `webCheckoutURL` for RevenueCat web billing. `EntitlementInfo.isActive` is the main access gate; `willRenew` is false when canceled; `expirationDate` is null for lifetime; `periodType` is `NORMAL`, `TRIAL`, `INTRO` or `PREPAID`; `billingIssueDetectedAt` non-null means grace or hold; `unsubscribeDetectedAt` non-null means canceled; `productPlanIdentifier` is the base plan ID (Google only).

## Project status overview

- **`/revenuecat-status [project_name]`:** the optional name is a case-insensitive partial match (`$ARGUMENTS`).
- **Steps:** `list-projects` (filter; if nothing matches, list the available ones); then per project `list-apps`, `list-products`, `list-entitlements`, `list-offerings`, `list-webhook-integrations`.
- **Present:** apps (platform), products (type), entitlements, offerings (current yes or no), webhooks (name to URL).
- **Flag:** products not attached to any entitlement, offerings without packages, apps without products.

## Product store state

- **The store is the source of truth** for prices, availability, localizations and offers. Reads are immediate. Writes go through a **product store state plan**: create a draft, compute a reviewable diff, then apply. Nothing reaches the store until the plan is applied. Stores: App Store Connect, Google Play Console, RC Billing, Test Store.
- **One active plan per project.** There is at most one active (non-terminal) plan. List plans before creating one; if create fails because one is in progress, fetch it, describe what is pending, and decide with the user whether to continue or discard it.
- **Read with `get-product-store-state`** (CLI `rc products show <product-id> --store-state`). Never infer store prices, availability or trials from `get-product`, `list-products` or offering data: those are the RevenueCat catalog, not store state. Surface any `warnings`.
- **Write prerequisites:** store credentials connected (an App Store Connect API key, or a Google Play service account with the **Manage store presence** permission) and a RevenueCat login with write access. On a credentials or permission error, report what is missing (in the dashboard app settings) instead of retrying.

### MCP write flow

1. **Read** with `get-product-store-state`.
2. **Create** with `create-product-store-state-plan`: one `desired_states` entry per product, targeting a `product_id` or `create_revenuecat_product` (`app_id`, `store_identifier`, `type`, `display_name`, `title`; if only one name is given, use it for both). `store` is `app_store`, `play_store`, `rc_billing` or `test_store`, with a matching `store_state` holding prices, availability, localizations and the review screenshot.
   - App Store subscriptions: send the prices you keep in `territory_prices` plus `common.pricing.equalize_missing_subscription_prices` with `base_territory` (not for App Store one-time products).
   - App Store review screenshot omitted: apply uploads a blank placeholder unless the user supplied one.
   - RC Billing and Test Store pricing is `common.pricing.currency_prices`, create-only; updating an existing currency is rejected.
3. **Plan** with `plan-product-store-state-plan`, then poll `get-product-store-state-plan` until `planned`, `planned_and_finished` or `plan_errored`.
4. **Review with the user.** On failure report `error_message`, per-item errors and the review URL, and do not apply.
5. **Apply** with `apply-product-store-state-plan`, poll until `applied` or `apply_errored`, and report each product's `apply_status` and `apply_error_message`. If the store changed after planning, start a new plan.
6. **App Store only:** offer `submit-products-to-store` (skip for Play Store, RC Billing and Test Store).

- **Abandon** with `discard-product-store-state-plan`. **Change a draft** with `update-product-store-state-plan`, then plan again.

### Confirm before applying

- Summarize `summary` and each `plan_items[*].diff` (before to after).
- Report every warning (`severity`, `field`, `message`). **Never apply if any `plan_items[*].warnings` has `severity: blocker`.**
- Optionally share the review URL `https://app.revenuecat.com/projects/{project_id}/product-catalog/product-editor/review-changes?plan_id={plan_id}`.
- Wait for an explicit go-ahead, per product or as one itemized batch; never fold unrelated changes into a single confirmation. Apply only if `actions` includes `apply`.
- Reads need no confirmation. Submitting to Apple review is a separate confirmed write (`submit-products-to-store`).

### CLI equivalents

`rc products show <product-id> --store-state`; `rc products store plan <app-id> --file <csv|json>`; `rc products store show <plan-id>`; `rc products store apply <plan-id>`; `rc products store discard <plan-id>`. CLI apply waits for completion (no separate poll); still show the diff and confirm first.

### Do not use for writes

These are single-product writes with no previewable plan: `set-product-store-state`, `get-product-store-state-operation`, `create-product-prices`, `upload-product-store-state-screenshot`, `equalize-subscription-prices`.

## SDK compatibility and adoption

- **Call `list-sdk-feature-gates` before any compatibility claim,** and use the matching gate's minimum version per SDK. If no gate matches, say so and name the close ones; consult the docs linked in the tool output. Prefer the most specific gate (for example `experiment-existing-customer-enrollment`, `experiment-exposure-tracking`, `experiment-new-customer-enrollment`); if several jointly matter, name each.
- **`list-sdk-versions`** rows describe subscribers seen in the last 30 days: `sdk_type`, `sdk_version` (the native SDK version, or the native SDK bundled under a wrapper in `platform_flavor` rows), `sortable_sdk_version`, `platform` (`ios`, `android`), `platform_flavor` and `platform_flavor_version` (for example `react-native` `10.0.1`), `subscribers_last_30days`, `pct_of_subscribers`.
- **Group** by `sdk_type` for an SDK family inventory, by `platform` for native iOS against Android, and by `platform_flavor` for React Native, Flutter, Capacitor, Unity, Kotlin Multiplatform and other wrappers, where both the wrapper version and the bundled native SDK version matter.
- **Upgrade impact:** filter to the SDK family, compare with the gate's `min_version`, and sum `subscribers_last_30days` and `pct_of_subscribers` for the rows below it. Say the figures are last-30-days subscribers, not the all-time install base. Use `jq` or code execution for large outputs.
- **Dashboard page:** `/projects/{projectId}/sdk-compatibility`.

## Dashboard links

- **Base:** `https://app.revenuecat.com`. **Do not invent IDs.** Prefer the URL in MCP results (the line starting "Dashboard URL for this result").
- **`{projectId}` is the short hex ID** (for example `56965ae1`), not `proj56965ae1`: strip the `proj` prefix from `list-projects` IDs.
- **No query params** unless the charts or audiences skills say so; filtered chart links belong to `revenuecat-charts`, filtered customer lists to `revenuecat-audiences`.
- **`/customer-lists/{listId}`** takes an audience's `customer_list_id` (`list…`), not its `id` (`aud…`).
- **`rc open [section] [id] --print` sections:** `paywalls`, `customers`, `experiments`, `charts`, `apps`, `overview`, `settings`, `integrations`, `catalog`, `api-keys`, `audit-logs`.
- **Account paths:** `/overview`, `/settings/account`, `/settings/billing`, `/settings/billing/invoices`, `/settings/security` (2FA), `/projects/add`.

Project paths, under `/projects/{projectId}`:

| Area | Paths |
|---|---|
| Project | `/` or `/overview`, `/settings`, `/collaborators`, `/audit-logs`, `/api-keys`, `/sdk-compatibility` |
| Apps | `/apps`, `/apps/{appId}` (store credentials), `/new-app` |
| Catalog | `/product-catalog/entitlements[/{entitlementId}]`, `/product-catalog/products[/{productId}]`, `/product-catalog/product-editor`, `/product-catalog/offerings[/{offeringId}]`, `/product-catalog/virtual-currencies` |
| Paywalls and targeting | `/paywalls`, `/paywalls/{paywallId}/builder`, `/targeting`, `/experiments[/{experimentId}]` |
| Lifecycle | `/lifecycle/customer-center`, `/lifecycle/winback`, `/lifecycle/retention`, `/funnels` (web funnels) |
| Data | `/charts`, `/benchmarks`, `/customer-lists[/{listId}]`, `/customers/{appUserId}` |
| Integrations | `/integrations`, `/integrations/webhooks` |

Examples: `https://app.revenuecat.com/projects/56965ae1/product-catalog/offerings/ofrng_default`, `https://app.revenuecat.com/projects/56965ae1/paywalls/pw_abc123/builder`.

## Your RevenueCat plan and invoices

- **This is your plan with RevenueCat,** not your customers' subscription invoices.
- **MCP tools:** `get-account-billing` (current plan, usage as Monthly Tracked Revenue (MTR), whether a payment method is set up) and `list-account-billing-invoices` (invoices with amount and status). There is no first-class CLI command for account billing; do not use `rc invoices`, which lists a customer's invoices.
- **MTR is not MRR:** it includes revenue from all purchases and renewals, including non-subscription products. Billing periods run from a date to the same date next month (for example July 15 to August 15), not calendar months. Every plan bills on MTR except `enterprise` (custom billing).
- **Who can see it:** only the project `owner` role sees the plan through `get-account-billing`; others should contact the owner (find them with `list-collaborators` and `list-projects`). Enterprise users go to their Customer Success manager. Settings: `https://app.revenuecat.com/settings/billing`.
- **Over the Pro plan's free allowance ($2,500 MTR) with no successful payment,** on an account at least one month old, these are restricted immediately until a payment succeeds: view and filter Charts; create new Customer Lists; export Customer Lists; view Customer History (Customer Details remain); view individual events; add Customer Attributes; create new Experiments; edit running Experiments (viewing results and stopping remain); create new Paywalls; edit existing Paywalls (using existing Paywalls remains).
- **Invoice details** (company name, address, Tax ID or VAT) live under **Invoice details** in billing settings. With no payment method there are no invoices and invoice details can't be changed. For more than one Tax ID, or forwarding invoices to another email, contact RevenueCat support; do not offer this proactively.

## Prove it

- `rc commands --schemas --json` lists every command you plan to run, `rc schema <noun> <verb> --json` returns that command's schema (not the root), and scripted runs use `--json --no-input --project-id <id>` and check the exit code.
- `/revenuecat-status` shows no product outside an entitlement, no offering without packages and no app without products.
- Before any store write, `get-product-store-state` was read, the plan reached `planned`, every diff and warning was shown, no warning has `severity: blocker`, and the user confirmed; after apply, each product's `apply_status` is reported.
- Every compatibility claim names the `list-sdk-feature-gates` gate and its minimum version, and every adoption figure says "last 30 days".
- Every dashboard link uses an ID taken from a tool result, with the `proj` prefix stripped.
