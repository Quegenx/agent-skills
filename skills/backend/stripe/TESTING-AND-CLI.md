# Testing and the Stripe CLI

Stripe integrations are tested in sandboxes: isolated environments with their own keys, objects and settings, where test cards simulate every payment outcome and test clocks move subscriptions through time. The Stripe CLI provisions sandboxes, forwards and triggers webhook events, and tails request logs. Most outcomes come down to testing in a general sandbox (not the test mode sandbox, which shares settings with live), using test PaymentMethods instead of raw card numbers in code, and remembering that `stripe trigger` makes real API calls with side effects. Webhook handling is in [WEBHOOKS.md](WEBHOOKS.md), subscription flows in [BILLING.md](BILLING.md).

**Contents:** [Sandboxes](#sandboxes) · [Test cards and PaymentMethods](#test-cards-and-paymentmethods) · [Test clocks](#test-clocks) · [Billing test checklist](#billing-test-checklist) · [Install and log in](#install-and-log-in) · [Sandboxes from the CLI](#sandboxes-from-the-cli) · [Listen, trigger, resend](#listen-trigger-resend) · [Logs and fixtures](#logs-and-fixtures) · [Integration code review](#integration-code-review) · [Prove it](#prove-it)

## Sandboxes

- **Use general sandboxes for new integrations,** not your test mode sandbox. Use separate sandboxes for local development and CI so automated tests don't affect your settings or data. Use the test mode sandbox only for existing integrations that depend on it or when a required feature doesn't support general sandboxes.

| | Test mode sandbox | General sandboxes |
|---|---|---|
| Count | One | Up to five (test mode doesn't count) |
| Settings | Shared with live: assume any change affects live mode settings (unless you see a test data banner) | Isolated, copied from live at creation |
| API | Partial v2 support | API v1 and v2 |
| Deletable | No | Yes |
| Access | All users get the same roles and access as live mode | Access levels Private (default for new sandboxes; only administrators automatically), Developer (administrators, developers and sandbox administrators inherit the Administrator role), All team members (same roles and access) |

- **Limits:** you can't test IC+ pricing in a sandbox, and you can't connect a platform sandbox to connected-account sandboxes.
- **Modes are separate:** sandbox and live have separate keys and objects; objects in one aren't accessible in the other.
- **Search is eventually consistent.** Don't retry the request that created an object because search doesn't show it yet (that can create duplicates); retrieve it by a deterministic ID (for example the Checkout Session ID) or a list endpoint.
- **Clean up:** delete test data from Developers > Overview. Meters must be deleted manually.
- **Emails:** Stripe doesn't email customers in sandboxes by default; use a team member's email or `receipt_email`.
- **Rate limits are stricter than live** (25 requests/second global). Don't load test in sandboxes; mock Stripe instead ([IDEMPOTENCY-AND-ERRORS.md](IDEMPOTENCY-AND-ERRORS.md#rate-limits)).
- **Webhook retries in sandboxes:** three times over the course of a few hours (live: up to three days).
- **Auditing a marketing or signup page:** use synthetic identities and sandbox payments, never real customer data or real charges [freescan]; the SaaS audit boundary is in [site-audit LAUNCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/LAUNCH.md#saas-audits).

## Test cards and PaymentMethods

- **Interactive checkout:** `4242 4242 4242 4242`, any future date such as 12/34, any 3-digit CVC (4 digits for Amex).
- **In code, use test PaymentMethods** such as `pm_card_visa`, not card numbers. Stripe doesn't recommend card numbers in API calls or server-side code even in testing: your code might not be PCI-compliant when you go live. Using real card details in live testing is prohibited by the Stripe Services Agreement.
- **Card state carries over between tests;** use a different card per independent scenario.

| Brand | Number |
|---|---|
| Visa | 4242424242424242 |
| Visa debit | 4000056655665556 |
| Mastercard | 5555555555554444 |
| Mastercard 2-series | 2223003122003222 |
| Mastercard debit | 5200828282828210 |
| Mastercard prepaid | 5105105105105100 |
| Amex | 378282246310005, 371449635398431 |
| Discover | 6011111111111117 |
| Diners | 3056930009020004 |
| JCB | 3566002020360505 |
| UnionPay | 6200000000000005 |

| Decline | Number |
|---|---|
| Generic (`card_declined` / `generic_decline`) | 4000000000000002 |
| Insufficient funds | 4000000000009995 |
| Lost card | 4000000000009987 |
| Stolen card | 4000000000009979 |
| Expired (`expired_card`) | 4000000000000069 |
| Incorrect CVC | 4000000000000127 |
| Processing error | 4000000000000119 |
| Incorrect number | 4242424242424241 |
| Velocity limit | 4000000000006975 |
| Decline after attaching | 4000000000000341 |

- **Issuer-decline cards can't be attached to a Customer.** To test a saved card that later declines, use "Decline after attaching" (4000000000000341).

| Radar | Number |
|---|---|
| Always blocked | 4100000000000019 |
| Highest risk | 4000000000004954 |
| Elevated risk | 4000000000009235 |
| Free trial abuse | 4001858821843804 |
| Adaptive 3DS | 4000008405600003 |
| CVC check fails | 4000000000000101 |
| Postal code check fails | 4000000000000036 |

Blocked payments are card errors with code `fraud`. PaymentMethods: `pm_card_chargeDeclinedFraudulent`, `pm_card_radarBlock`.

| Dispute | Number |
|---|---|
| Fraudulent (protected after 3DS) | 4000000000000259 |
| Not received (not protected after 3DS) | 4000000000002685 |
| Inquiry | 4000000000001976 |
| Early fraud warning | 4000000000005423 |

| 3D Secure | Number | PaymentMethod |
|---|---|---|
| Authenticate unless set up | 4000002500003155 | `pm_card_authenticationRequiredOnSetup` |
| Always authenticate | 4000002760003184 | `pm_card_authenticationRequired` |
| Already set up | 4000003800000446 | |
| Insufficient funds after authentication | 4000008260003178 | |
| 3DS required, succeeds | 4000000000003220 (IE), 4000008400000027 (US) | `pm_card_threeDSecure2Required` |
| 3DS required, declined | 4000008400001629 | |
| 3DS required, error | 4000008400001280 | |
| 3DS supported, succeeds | 4000000000003055 | |
| Unenrolled | 4242424242424242 | |
| Not supported | 378282246310005 | |
| Frictionless | 4000000032200000 | |
| Mobile challenge: OOB | 4000582600000094 | |
| Mobile challenge: OTP | 4000582600000045 | |
| Mobile challenge: single select | 4000582600000102 | |
| Mobile challenge: multi select | 4000582600000110 | |

- **3D Secure redirects don't occur for payments created directly in the Stripe Dashboard.**

## Test clocks

- **Simulations use test clocks to control time.** Use a separate sandbox for CI so clocks don't interfere with local development.
- **Create:** `stripe.testHelpers.testClocks.create({ frozen_time: 1635750000, name: 'Annual renewal' })`. Frozen time can be in the past or future, but only moves forward.
- **Attach a customer:** `stripe.customers.create({ email, test_clock: '{{CLOCK_ID}}', payment_method: 'pm_1234', invoice_settings: { default_payment_method: 'pm_1234' } })`. Subscriptions inherit the clock through the customer. Accounts v2: set the test clock ID when first adding the `customer` configuration; it can't be added later.
- **Advance:** `stripe.testHelpers.testClocks.advance('{{CLOCK_ID}}', { frozen_time: 1667286000 })`. Advance in intervals of up to two of the shortest service period (monthly subscriptions: up to two months; no subscriptions: up to two years). It takes a few seconds: wait for `test_helpers.test_clock.advancing` then `test_helpers.test_clock.ready`, or poll `retrieve` and check `status`.
- **Delete:** `stripe.testHelpers.testClocks.del(id)` deletes its customers and cancels subscriptions. Clocks are deleted automatically 30 days after creation.
- **Limits:** three customers per clock, three subscriptions (including schedules) per customer, ten unattached quotes. Existing customers can't be backdated, can't have Automations configured, and can't be removed later.
- **List endpoints omit test clock objects** unless filtered (for example by customer or `test_clock`).
- **Rate limits:** many updates on a clocked subscription can hit them; advance a few minutes between requests.

## Billing test checklist

Confirm your handler receives each group:

- **Sign-up:** `customer.created`, `customer.subscription.created` (plus the Accounts v2 events).
- **Invoicing:** `invoice.created`, `invoice.finalized`, `invoice.finalization_failed`, `invoice.paid`, `invoice.payment_action_required`, `invoice.payment_failed`, `invoice.upcoming`, `invoice.updated`.
- **Management:** `customer.subscription.deleted`, `.paused`, `.resumed`, `.updated`.
- **Trials:** `customer.subscription.trial_will_end`, `customer.subscription.updated`.
- **Failures:** decline and 3DS cards from the tables above.

Drive these with sandbox actions and test cards, or with `stripe trigger` and Stripe for VS Code.

## Install and log in

- **Install:** `npm install -g @stripe/cli` (Node.js >= 18) or `npx @stripe/cli login`; `brew install stripe`; `winget install Stripe.StripeCLI`; Docker `stripe/stripe-cli`. Upgrade: `brew upgrade stripe`.
- **Auto-update:** script installs update automatically within the major version. Disable with `STRIPE_NO_AUTO_UPDATE=1` or `auto_update = false` in `~/.config/stripe/config.toml`.
- **`stripe login`** runs a browser pairing flow and stores credentials in the OS secure credential store. For CLI versions newer than v1.50.0, an Administrator or IAM Admin must enable CLI access first (Settings > Team and security > MCP and CLI access). Flags: `-i`/`--interactive` (if you can't open a browser and want to provide an API key manually), `--non-interactive` (prints the browser URL, verification code and next command as JSON (`browser_url`, `verification_code`, `next_step`), then exits; activates automatically when standard input isn't a terminal; run the returned `next_step` right after approving in the browser), `--complete=<poll-url>` (polls the URL from `next_step` until you approve, then saves the credentials), `--new-session` (revokes the current authentication and logs in to a new session; without it, `stripe login` keeps an existing session). Related: `stripe login list`, `stripe switch [acct] [--live]`, `stripe reauth`, `stripe logout [--all]`.
- **API key instead:** `stripe login --interactive`, `stripe config --set test_mode_api_key sk_test_123`, the global `--api-key`, or env `STRIPE_API_KEY` and `STRIPE_DEVICE_NAME` (env takes precedence).
- **`stripe agent setup`** installs the Stripe plugin, skills and MCP server for Claude Code, Codex and Cursor (`--client`, `--skills`, `--skills-scope local|global`, `--status`, `--json`, `-y`).

## Sandboxes from the CLI

- **No account needed:** coding agents should install the CLI (`npm i -g @stripe/cli`) and run `stripe sandbox create --help`. `stripe sandbox create --email you@example.com` (or `--from-git`, `--non-interactive`) provisions a sandbox after a proof-of-work challenge and returns `secret_key` (for example `rkcs_test_...`), `publishable_key`, `claim_url`, `account_id` and `expires_at`.
- **Sandbox environments expire after 7 days.** Claim one with `stripe sandbox claim`.

## Listen, trigger, resend

- **`stripe listen`** forwards events without a Dashboard endpoint. The signing secret it prints doesn't change between restarts. By default it accepts all snapshot events and displays them in the terminal; thin events must be passed with `--thin-events`.

| `stripe listen` flag | What it does (https://docs.stripe.com/cli/listen.md) |
|---|---|
| `-e`, `--events` | Comma-separated snapshot events to listen for (default `[*]`, all). Example `stripe listen --events=payment_intent.succeeded` |
| `-f`, `--forward-to <url>` | URL snapshot events are forwarded to; returns a webhook signing secret for your app's configuration. Can't be used in the Workbench Shell |
| `-H`, `--headers` | Comma-separated custom HTTP headers to forward, `"Key1:Value1, Key2:Value2"` |
| `-c`, `--forward-connect-to <url>` | URL Connect events are forwarded to; by default the same URL as all snapshot events |
| `--connect-headers` | Comma-separated custom headers to forward to any connected accounts; useful when testing a Connect platform |
| `--thin-events` | Comma-separated thin events to listen for; `*` for all (default none) |
| `--forward-thin-to <url>` | URL thin events are forwarded to; returns a webhook signing secret. Example `--forward-thin-to localhost:4242/webhook --thin-events "*"` |
| `--forward-thin-connect-to <url>` | URL thin Connect events are forwarded to; by default the same URL as all thin events |
| `-l`, `--latest` | Receive events used in the latest API version; by default events follow the account's default API version |
| `--live` | Make a live request; requests run in a sandbox by default |
| `-a`, `--load-from-webhooks-api` | Listen for all events based on your existing webhook endpoints configured in the Dashboard and API |
| `-j`, `--print-json` | Print JSON objects to stdout |
| `--print-secret` | Only print the webhook signing secret and exit |
| `--skip-verify` | Skip certificate verification when forwarding to HTTPS endpoints |

- **`stripe trigger <event>`** issues real HTTP requests against the Stripe API, so it causes side effects: triggering `payment_intent.succeeded` also triggers `payment_intent.created`.

| `stripe trigger` flag | What it does (https://docs.stripe.com/cli/trigger.md) |
|---|---|
| `--stripe-account` | Set a header identifying the connected account |
| `--override [resource]:[path1].[path2]=[value]` | Override the param at `path1.path2` for the resource, for example `--override plan:product.name=overrideName`; index arrays with brackets, `--override "checkout_session:line_items[0].quantity=10"` (some shells need the quotes) |
| `--add [resource]:[path1].[path2]=[value]` | Add the param, for example `--add payment_intent:customer=customerId` |
| `--remove [resource]:[path1].[path2]` | Remove the param, for example `--remove customer:description` |
| `--skip [param]` | Skip specific steps in the trigger, for example `--skip cus_jenny_rosen` |
| `--edit` | Edit the fixture in your default IDE before triggering; can't be combined with `--add`, `--remove`, `--override` or `--skip` |

- `stripe trigger --help` lists supported events, including `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `payment_intent.*` and `charge.dispute.created`.
- **`stripe events resend <evt> --webhook-endpoint=we_...`** resends events from the last 30 days. For an event sent to a Connect webhook endpoint on a platform, set `--account=<account_id>` to the connected account ID associated with the event; you can't use `--stripe-account` with Connect (https://docs.stripe.com/cli/events/resend.md).

## Logs and fixtures

- **`stripe logs tail`** (sandbox only) tails API request logs in real time. A log entry must match every filter given; within one filter, comma-separated values match any (https://docs.stripe.com/cli/logs/tail.md):
  - `--filter-account`: `connect_in` (incoming Connect requests), `connect_out` (outgoing Connect requests), `self` (non-Connect requests).
  - `--filter-http-method`: `GET`, `POST`, `DELETE`.
  - `--filter-ip-address`; `--filter-request-path` (requests that directly match a Stripe path, for example `/v1/charges`).
  - `--filter-request-status`: `SUCCEEDED` (HTTP 200, 201, 202), `FAILED` (HTTP 4xx and 5xx).
  - `--filter-source`: `API` (created with the Stripe API), `DASHBOARD` (created from the Dashboard).
  - `--filter-status-code`; `--filter-status-code-type`: `2XX`, `4XX`, `5XX`.
  - `--format JSON` outputs logs as JSON.
- **`stripe fixtures <file.json>`** supports `${name:json_path}` and `${.env:VAR|default}` references.

## Integration code review

The integration review below comes from a third-party skill [appeeky].

- **Search for:** `new Stripe(`, `stripe.subscriptions`, `stripe.checkout`, `stripe.webhooks`, `apiVersion`, `idempotencyKey`.
- **Check:**
  - API version pinned explicitly, not floating ([API-VERSIONS.md](API-VERSIONS.md)).
  - `idempotencyKey` on create calls so retries are safe ([IDEMPOTENCY-AND-ERRORS.md](IDEMPOTENCY-AND-ERRORS.md)).
  - Webhook signatures verified with `constructEvent` ([WEBHOOKS.md](WEBHOOKS.md)).
  - Race conditions: an existing-subscription check before create (no double-bill).
  - Stripe errors caught by type, with user-friendly messages.
  - Amounts follow the [currency contract](AGENT-TOOLS.md#the-stripe-mcp), with no float rounding bugs.
  - Secrets from env, never hardcoded.
  - `proration_behavior` set intentionally on subscription updates ([BILLING.md](BILLING.md)).
- **Report** as Critical (file:line, issue, fix), Improve, Good, and Top fix. Use the Stripe MCP only to confirm suspicions against live behavior (for example duplicate subscriptions).

## Prove it

- Local development and CI each run against their own general sandbox, not the test mode sandbox.
- No card number appears in server code or API calls; tests use `pm_card_*` PaymentMethods.
- A test clock advanced past a renewal produces `invoice.created`, `invoice.paid` and `customer.subscription.updated` at your handler, and a decline card produces `invoice.payment_failed`.
- `stripe listen --forward-to <your route>` plus `stripe trigger checkout.session.completed` reaches the handler and returns `200`.
- `stripe logs tail --filter-status-code-type 4XX` shows no unexpected errors during a test run.
- The review checklist above has no Critical items left open.
