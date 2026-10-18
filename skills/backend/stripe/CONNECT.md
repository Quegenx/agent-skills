# Connect

Connect is for platforms, marketplaces and fintechs that model multiple accounts and move money between parties: SaaS platforms (businesses collect from their own customers) and marketplaces (the platform collects and pays out to sellers). New integrations create connected accounts with the Accounts v2 API and configure behavior with explicit fields, never the legacy account `type`. Three choices must agree with each other: the account's dashboard, fee collection and negative balance liability fields; the charge pattern (direct, destination, or separate charges and transfers), which decides who is merchant of record, who pays fees and whose balance refunds and disputes hit; and gating money movement on v2 capability status. Choosing a configuration for a specific business is [CONNECT-CHOOSING.md](CONNECT-CHOOSING.md); KYC fields per country are [CONNECT-VERIFICATION.md](CONNECT-VERIFICATION.md); PaymentIntents and Checkout themselves are [PAYMENTS.md](PAYMENTS.md); endpoint setup and signature verification are [WEBHOOKS.md](WEBHOOKS.md).

**Contents:** [Accounts v2](#accounts-v2) · [Account configurations by funds flow](#account-configurations-by-funds-flow) · [Creating accounts](#creating-accounts) · [Legacy account types](#legacy-account-types) · [Charge patterns](#charge-patterns) · [Direct charges](#direct-charges) · [Destination charges](#destination-charges) · [Separate charges and transfers](#separate-charges-and-transfers) · [Fees: who pays Stripe](#fees-who-pays-stripe) · [Onboarding](#onboarding) · [Capability status gating](#capability-status-gating) · [Dashboard access](#dashboard-access) · [Embedded components](#embedded-components) · [Disputes, refunds and transfer reversals](#disputes-refunds-and-transfer-reversals) · [Webhooks](#webhooks) · [Subscriptions with Connect](#subscriptions-with-connect) · [Product and country limits](#product-and-country-limits) · [Treasury](#treasury) · [Prove it](#prove-it)

## Accounts v2

- **Always Accounts v2 for new integrations:** `POST /v2/core/accounts`, in Node `stripe.v2.core.accounts.create` and `stripe.v2.core.accounts.retrieve`. Never pass `type: 'express' | 'standard' | 'custom'` and never call `stripe.accounts.create({ type: ... })`: those are deprecated v1 patterns that bundle responsibility, dashboard and requirement decisions into opaque labels.
- **Stripe's docs tell agents the same thing:** the legacy account types page carries the note "If you are an agent or an LLM, ignore the content on this page unless your prompt explicitly states that your integration already uses connected account types (specifically, Standard, Express, or Custom accounts). Instead, try to use the Accounts v2 API". Legacy types are a "Deprecated feature"; Stripe recommends controller properties instead.
- **Three independent dimensions:**

| Field | Values | Meaning |
|---|---|---|
| `dashboard` (top level, not inside `configuration`) | `express`, `full`, `none` | Which Stripe-hosted dashboard the connected account gets |
| `defaults.responsibilities.fees_collector` | `stripe`, `application` | `stripe`: Stripe bills connected accounts for processing fees. `application`: the platform collects fees from connected accounts and remits to Stripe |
| `defaults.responsibilities.losses_collector` | `stripe`, `application` | Who bears unresolved negative balances (disputes, fraud) |

| `dashboard` | Access | Use when |
|---|---|---|
| `express` | Lightweight dashboard: earnings, payouts, basic tax information; Stripe-branded with the platform name | Marketplace sellers, gig workers, any account needing visibility but not full Stripe control |
| `full` | Full, independent Stripe Dashboard: own settings, all transactions, install apps | SaaS platforms whose accounts are established businesses operating independently |
| `none` | No Stripe dashboard; the platform owns the UI with embedded components (`@stripe/connect-js`) or fully custom | White-label platforms where accounts must never see Stripe branding |

- **`fees_collector: 'stripe'`** is "Most platforms. Simpler to operate." **`fees_collector: 'application'`** gives the platform a single invoice from Stripe; for enterprise or white-label platforms, or platforms bundling Stripe fees into their own pricing.
- **`losses_collector: 'stripe'`**: Stripe bears negative balances that stay unresolved ("Most platforms"). Choose it when starting out, with no dedicated risk team, planning direct charges. **`losses_collector: 'application'`**: the platform bears them and manages disputes; for mature risk operations, better risk signal, full control over dispute workflows, high-risk verticals, and destination or separate charges without `on_behalf_of`.
- **Renamed identity fields:** `identity.country` and `identity.entity_type` replace `country` and `business_type`. `defaults.currency` sets the default settlement currency.
- **Configurations:** `merchant` (accept payments: `card_payments`, `stripe_balance.payouts`), `customer` (charge the account as a customer, instead of a Customer object), `recipient` (`stripe_balance.stripe_transfers`, required for indirect charges). "In most cases, you can represent any customer with an Account object ... You don't have to use the Customers API at all." Any `customer` parameter has a `customer_account` counterpart.
- **Use `include` on reads:** "By default, Accounts v2 API calls return values for certain properties and null for other properties."
- **Stripe's guides:** start with the interactive platform guide (`https://docs.stripe.com/connect/interactive-platform-guide.md`); also `https://docs.stripe.com/connect/saas-platforms-and-marketplaces.md`, `https://docs.stripe.com/connect/design-an-integration.md`, `https://docs.stripe.com/connect/accounts-v2/connected-account-configuration.md`.
- **Still v1 only:** OAuth, the recipient service agreement, `treasury`, `card_issuing_*` and deprecated capabilities. Stripe discourages maintaining both Accounts API versions indefinitely.
- **Account type and country can't be changed after creation** (legacy accounts), and the Express versus full dashboard choice is "a permanent, one-way decision made at account creation for each connected account and can't be changed later".

## Account configurations by funds flow

| Charge pattern | Configuration | Capability to request | Ready when |
|---|---|---|---|
| Direct (SaaS) | `configuration.merchant` (REQUIRED for any account that is merchant of record and accepts direct charges) | `card_payments` (and other local payment methods) | `configuration.merchant.capabilities.card_payments.status === 'active'` |
| Destination, separate charges and transfers (marketplace) | `configuration.recipient` | `stripe_transfers` on `stripe_balance` | `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'` |

- **Marketplace accounts never get `merchant` or `card_payments`.** They don't accept payments directly, and merchant configuration "causes longer, more arduous onboarding". Without the merchant configuration the account can't process payments directly; it can only receive transfers from the platform.

## Creating accounts

Marketplace (destination or separate charges):

```javascript
const account = await stripe.v2.core.accounts.create({
  contact_email: 'seller@example.com',
  display_name: 'Seller Name',
  dashboard: 'express',
  identity: { country: 'us', entity_type: 'individual' },
  configuration: {
    recipient: {
      capabilities: {
        stripe_balance: { stripe_transfers: { requested: true } },
      },
    },
  },
  defaults: {
    currency: 'usd',
    responsibilities: {
      fees_collector: 'application',
      losses_collector: 'application',
    },
  },
});
```

Self-serve SaaS, direct charges, Stripe-managed pricing (public preview):

```javascript
const account = await stripe.v2.core.accounts.create(
  {
    contact_email: 'merchant@example.com',
    display_name: 'Merchant Name',
    dashboard: 'express',
    identity: { country: 'us', entity_type: 'individual' },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
    },
    defaults: {
      currency: 'usd',
      responsibilities: {
        fees_collector: 'stripe',
        losses_collector: 'stripe',
      },
    },
  },
  {
    // Required: dashboard: 'express' + losses_collector: 'stripe' (Stripe-managed
    // pricing or platform-managed pricing) is only available on the current Connect
    // preview API version. Look up the exact version at
    // https://docs.stripe.com/changelog?preview=true : this call fails on a pinned
    // GA API version.
    apiVersion: '<current-connect-preview-api-version>',
  },
);
```

- **Pass the preview API version explicitly** (the `apiVersion` request option), not the account-level pinned version, "otherwise account creation is rejected". Stripe's v2 accounts page shows the header form `Stripe-Version: 2026-09-30.preview` as an example; look up the current string at `https://docs.stripe.com/changelog.md?preview=true`.
- **Platform-managed pricing variant:** the same `dashboard: 'express'`, `losses_collector: 'stripe'` and preview version, with `fees_collector: 'application'` and pricing set in the Platform Pricing Tool (`https://dashboard.stripe.com/settings/connect/platform_pricing`).
- **Sources disagree on Express with Stripe liability.** Stripe's `connect-recommend` skill supports Express + `losses_collector: 'stripe'` + direct charges as a public preview ("As of the June 24 public-preview release", no year given) for new accounts only. Stripe's `stripe-best-practices` skill lists "Express dashboard with `losses_collector: "stripe"`" as BLOCKED (API rejection) and says direct charges require `dashboard: "full"`. Both are Stripe's; the difference is the preview API version. Confirm in the current changelog before using it.

Established-merchant SaaS (direct charges, full dashboard):

```javascript
const account = await stripe.v2.core.accounts.create({
  contact_email: 'merchant@example.com',
  display_name: 'Merchant Name',
  dashboard: 'full',
  identity: { country: 'us', entity_type: 'individual' },
  configuration: {
    merchant: {
      capabilities: {
        card_payments: { requested: true },
      },
    },
  },
  defaults: {
    currency: 'usd',
    responsibilities: {
      fees_collector: 'stripe',
      losses_collector: 'stripe',
    },
  },
});
```

Stripe's code samples: SaaS `https://docs.stripe.com/connect/saas/tasks/create.md#code-sample`, marketplace `https://docs.stripe.com/connect/marketplace/tasks/create.md#code-sample`.

## Legacy account types

Mention legacy type names only when explaining a migration from v1 to v2.

| Legacy v1 type | What it was | Approximate v2 |
|---|---|---|
| Standard | Lowest effort, full Dashboard, direct charges only | `dashboard: 'full'`, `fees_collector: 'stripe'`, `losses_collector: 'stripe'` |
| Express | Express Dashboard, platform liable | `dashboard: 'express'`, `fees_collector: 'application'`, `losses_collector: 'application'` |
| Custom | No Dashboard, platform handles everything | `dashboard: 'none'`, `fees_collector: 'application'`, `losses_collector: 'application'` |

- **The mapping is approximate:** legacy types have behavioral nuances (fee payer behavior differs). Legacy accounts keep their original behavior; v1 and v2 coexist.
- **Express dashboard + Stripe-liable negative balances on direct charges** exists as explicit fields in both v1 and v2 but has no legacy `type` value.
- **Legacy fee payer values** in Stripe's docs: `application_express` (historical billing for legacy Express), `application_custom` (legacy Custom). New integrations use `fees_collector` and `losses_collector`.
- **Conflicting advice on account types.** Stripe's `stripe-best-practices` skill disagrees with itself: its security reference says platforms "bear financial liability for fraud and disputes on Express and Custom connected accounts. Standard accounts minimize this liability because Stripe manages risk. Do not recommend Custom or Express accounts unless the user has a specific need: Standard is the safer default", and recommends Stripe-hosted onboarding over a custom flow (custom onboarding handles sensitive PII directly). Its Connect reference forbids `type` altogether, expresses liability through `losses_collector` and the dashboard through `dashboard`, and defaults marketplaces to `express` + `losses_collector: "application"` with embedded onboarding. The third-party appeeky skills also describe the legacy types (Express: Stripe-hosted onboarding and dashboard, fastest; Standard: the seller's own Stripe account, least liability; Custom: full white-label, most work and liability). Stripe's docs tell agents to use Accounts v2 unless the integration already uses account types, and the approximate mapping above puts Standard at `dashboard: 'full'` with `stripe` / `stripe`.

## Charge patterns

| | Direct | Destination | Separate charges and transfers |
|---|---|---|---|
| Merchant of record | Connected account | Platform | Platform |
| Payment created on | Connected account | Platform account | Platform account |
| Statement descriptor | Connected account's | Platform's (can set the connected account's) | Platform's |
| Platform fee | `application_fee_amount` | `application_fee_amount` or `transfer_data.amount` | Manual calculation (transfer math) |
| Refund source | Connected account balance | Platform balance | Platform balance |
| Multi-seller split | No | No (one destination) | Yes (multiple transfers) |
| Account requirements | Most v2 configurations; the only charge type with supported `losses_collector: 'stripe'` | `losses_collector: 'application'` | `losses_collector: 'application'` |
| Complexity | Low | Low | High |
| Best for | SaaS, seller-owned transactions | Marketplaces, on-demand | Multi-seller carts, complex splits |

- **Stripe does not enforce merchant of record at the API level.** Platforms declare their intended setup during platform onboarding but can create charges with any pattern; code must consistently use the charge type that matches the real business relationship.
- **`on_behalf_of`** makes the connected account the business of record (settlement country, fees, statement descriptor) while the charge lives on the platform. The platform still pays Stripe fees. Don't use it for standard marketplace flows; it is outside the recommendation guide (see `https://docs.stripe.com/connect/charges.md` or Stripe sales).
- **Don't use the Charges API for Connect.**
- How to pick a pattern for a business is in [CONNECT-CHOOSING.md](CONNECT-CHOOSING.md#charge-pattern-rules).

## Direct charges

The charge lives on the connected account; the platform takes an application fee; refunds and chargebacks hit the connected account. Requires `card_payments`. Stripe's docs say direct charges "aren't recommended for legacy v1 Express and Custom accounts". Used by SaaS platforms (the Shopify model): sellers own the customer relationship, the connected account's name is on statements, sellers handle their own disputes.

```javascript
// Backend: Create PaymentIntent on connected account
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  application_fee_amount: 1500, // $15.00 platform fee
  metadata: {
    orderId: 'order_123',
  },
}, {
  stripeAccount: 'acct_connected_account_id', // Key: stripeAccount header
});

// Return client_secret to frontend
res.json({ clientSecret: paymentIntent.client_secret });
```

The frontend must initialize Stripe.js with the connected account:

```javascript
// Must initialize Stripe with connected account
const stripe = await loadStripe('pk_test_...', {
  stripeAccount: 'acct_connected_account_id',
});

// Then confirm payment as usual
const result = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://yoursite.com/success',
  },
});
```

Refunds come from the connected account's balance:

```javascript
// Refund comes from connected account's balance
const refund = await stripe.refunds.create({
  charge: 'ch_xxx',
  // Optionally refund the application fee too:
  refund_application_fee: true,
}, {
  stripeAccount: 'acct_connected_account_id',
});
```

- **Funds flow:** customer pays $100, it lands in the connected account balance, $15 application fee goes to the platform, the account keeps $85.
- **Blocked for direct:** `fees_collector: 'stripe'` + `losses_collector: 'application'` (any dashboard), including `express/stripe/application`.

## Destination charges

The charge lives on the platform and transfers immediately (rideshare, home rental, on-demand). The platform pays fees, refunds and chargebacks. Requires `losses_collector: 'application'`. Not for hold-and-release or delivery-gated payouts: destination charges transfer automatically on payment success and can't hold funds.

```javascript
// Backend: Create PaymentIntent on platform account
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  application_fee_amount: 1500, // $15.00 collected; platform net = $15.00 − Stripe processing fees
  transfer_data: {
    destination: 'acct_connected_account_id', // Funds go here
  },
  metadata: {
    bookingId: 'booking_123',
    riderId: 'user_456',
    operatorId: 'user_789',
  },
});

// Return client_secret to frontend
res.json({ clientSecret: paymentIntent.client_secret });
```

Transfer amount instead of a fee:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  transfer_data: {
    destination: 'acct_connected_account_id',
    amount: 8500, // $85.00 goes to connected account (platform keeps $15)
  },
});
```

The frontend uses the platform's key, no `stripeAccount`:

```javascript
// Initialize Stripe with platform's publishable key (no stripeAccount needed)
const stripe = await loadStripe('pk_test_platform_key');

const result = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://yoursite.com/success',
  },
});
```

Refunds come from the platform balance:

```javascript
// Refund comes from platform's balance
const refund = await stripe.refunds.create({
  payment_intent: 'pi_xxx',
  // Optionally:
  reverse_transfer: true, // Claw back from connected account
  refund_application_fee: true, // Refund the platform fee too
});
```

- **Funds flow:** customer pays $100 into the platform balance, $85 is transferred automatically, the platform nets $15 minus Stripe processing fees.
- **Third-party summary** [appeeky]: `Customer pays -> platform charge -> application_fee_amount kept -> transfer/payout to connected account`; key parameters `on_behalf_of`, `transfer_data.destination`, `application_fee_amount`.

## Separate charges and transfers

For one-to-many or many-to-one splits, charging before you know the recipient, multi-seller carts, delayed or delivery-gated payouts, crowdfunding and maximum control over timing. Requires `losses_collector: 'application'`. Never use `application_fee_amount` here: collect fees by transferring less than the charge. Monitor the platform balance; a transfer can be linked to its charge.

```javascript
// Step 1: Create PaymentIntent (no transfer_data)
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  metadata: {
    orderId: 'order_123',
  },
});

// Step 2: After payment_intent.succeeded webhook fires: latest_charge is null
// at creation time and only populated on the confirmed PaymentIntent from the event
// IMPORTANT: Always verify the webhook signature before processing event data.
// See https://stripe.com/docs/events/manage-webhook-endpoints#signature-errors for verification steps.
const confirmedIntent = event.data.object; // payment_intent.succeeded payload
const transfer = await stripe.transfers.create({
  amount: 8500, // $85.00 to connected account
  currency: 'usd',
  destination: 'acct_connected_account_id',
  source_transaction: confirmedIntent.latest_charge, // charge ID from confirmed PaymentIntent
  metadata: {
    orderId: 'order_123',
  },
});
```

Multi-seller split:

```javascript
// One payment, multiple sellers (for example, a multi-seller cart)
await stripe.paymentIntents.create({
  amount: 25000, // $250.00 total
  currency: 'usd',
});

// After payment_intent.succeeded webhook fires: latest_charge is null at creation time.
// IMPORTANT: Always verify the webhook signature before processing event data.
// See https://stripe.com/docs/events/manage-webhook-endpoints#signature-errors for verification steps.
const confirmedIntent = event.data.object; // payment_intent.succeeded payload
const chargeId = confirmedIntent.latest_charge;

// Transfer to seller A
await stripe.transfers.create({
  amount: 8000,
  currency: 'usd',
  destination: 'acct_seller_a',
  source_transaction: chargeId,
});

// Transfer to seller B
await stripe.transfers.create({
  amount: 12000,
  currency: 'usd',
  destination: 'acct_seller_b',
  source_transaction: chargeId,
});

// Platform keeps $50 (25000 - 8000 - 12000 = 5000)
```

Refund, then reverse each transfer by hand:

```javascript
// Refund the charge
const refund = await stripe.refunds.create({
  charge: 'ch_xxx',
});

// Manually reverse transfers
await stripe.transfers.createReversal('tr_seller_a', {
  amount: 8000,
});
await stripe.transfers.createReversal('tr_seller_b', {
  amount: 12000,
});
```

- **`latest_charge` is null at PaymentIntent creation.** Take it from the confirmed PaymentIntent in the `payment_intent.succeeded` event and pass it as `source_transaction`.
- **Hold and release:** charge on the platform with no `transfer_data`, hold the funds, then create the transfer after confirmation (delivery, job completion, approval, campaign end).

## Fees: who pays Stripe

| Charge pattern | Who pays Stripe processing fees | Platform net |
|---|---|---|
| Destination | Platform | `application_fee_amount − Stripe_fees` |
| Destination + `on_behalf_of` | Platform still pays (changes statement descriptor, merchant of record, dispute management) | Same |
| Direct, `fees_collector: "stripe"` | Connected account | `application_fee_amount` (full) |
| Direct, `fees_collector: "application"` | Platform | `application_fee_amount − Stripe_fees` |
| Separate charges and transfers | Platform | Account for fees in transfer math |

- **On direct charges `fees_collector` decides who pays;** `fee_payer` can further control it (`https://docs.stripe.com/connect/direct-charges-fee-payer-behavior.md`). With `fees_collector: "stripe"` the connected account is charged the processing fee and `application_fee_amount` goes to the platform on top.
- **On destination and separate charges the platform always pays,** whatever `fees_collector` says; there it only governs the billing relationship (one invoice or per account). Never say "seller pays Stripe fees" for destination charges.
- **Transfer math:** `platform_margin = charge_amount − total_transfers_to_connected_accounts − Stripe_fees`.
- **Report fees from `amount` on the ApplicationFee object,** not the charge field.
- **Platforms based outside Brazil can't collect application fees from Brazilian connected accounts** (regulatory); the same restriction applies to Malaysia.
- Fee methods, the margin check and the Platform Pricing Tool are in [CONNECT-CHOOSING.md](CONNECT-CHOOSING.md#fee-structure).

## Onboarding

- **Default to embedded onboarding** (the `account_onboarding` component) or Stripe-hosted Account Links as the fallback; Stripe handles requirement collection and ongoing compliance updates. "Some customization" means embedded components with the appearance options API (`/connect/embedded-appearance-options`). For `dashboard: 'none'` with embedded onboarding: `https://docs.stripe.com/connect/embedded-onboarding.md`.
- **Don't recommend API-based onboarding.** It forces custom remediation flows, country-specific requirement collection and ongoing maintenance: the KYC lifecycle (collection, monitoring, remediation) shifts to the platform, country legal-entity requirements change often, collection is ongoing rather than one-time, invalid information leaves accounts stuck in restricted states. Use embedded or Stripe-hosted onboarding unless the platform has dedicated compliance engineering and a branding need embedded can't meet (`https://docs.stripe.com/connect/marketplace/tasks/onboard.md`). If the user insists on fully custom onboarding, send them to Stripe sales.
- **OAuth for existing Stripe accounts is out of scope:** a v1-only pattern mainly in sales-assisted integrations; accounts can disconnect at any time, the platform loses visibility into state and requirements, and it is "Not compatible with all embedded components". Use Account Links or embedded onboarding.
- **The flow:** sign up, create the account, onboard with the chosen method, Stripe verification, check capability status, handle ongoing requirements, keep checking capability status. Enable live transactions only when the needed capabilities are active.
- [appeeky] verifies onboarding through `requirements` on the account. Stripe's own guidance gates on v2 capability status (below).

## Capability status gating

- **Retrieve before enabling payouts and transfers:** `stripe.v2.core.accounts.retrieve(id)`, then check that the needed status is `'active'`:
  - `configuration.merchant.capabilities.card_payments.status`
  - `configuration.merchant.capabilities.stripe_balance.payouts.status`
  - `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status`
  - `configuration.recipient.capabilities.stripe_balance.payouts.status`
- **Don't request `stripe_balance.payouts`.** It is auto-requested when `card_payments` or `stripe_transfers` is requested.
- **Don't rely on v1 `charges_enabled` or `payouts_enabled`** (deprecated v1 booleans).
- **Track capability state transitions with account webhooks** and re-check capability status before payment or transfer operations.

## Dashboard access

| `dashboard` | How sellers get in |
|---|---|
| `express` | A platform-generated login link, `stripe.accounts.createLoginLink(accountId)` (`https://docs.stripe.com/api/accounts/login_link/create.md`), plus embedded components for in-app workflows |
| `full` | They log in at `https://dashboard.stripe.com`; link to it from the platform UI |
| `none` | No Stripe Dashboard; embedded components or a custom UI on the API are the interface |

- **`none` means you build everything sellers need, from day one:** custom onboarding and ongoing remediation, refund management UI, dispute management flows, earnings and payout views. The common failure is building earnings views but skipping refunds and disputes: accounts can't initiate refunds (complaints escalate to chargebacks), can't respond to disputes (automatic losses) and can't fix KYC failures (prolonged restrictions). Never recommend `none` unless the user explicitly asks for white-label with a full custom UI.

## Embedded components

- **Package:** `@stripe/connect-js`. List: `https://docs.stripe.com/connect/supported-embedded-components.md`. Recommended for every dashboard type, especially `none`.
- **Always:** `account_onboarding`, `notification_banner` (REQUIRED: keeps accounts healthy and enabled as requirements change), `account_management`.
- **Common additions:** `payments` (disputes and payment details included), `payment_details` for a custom payments list, `disputes_list` for a standalone disputes page, `payouts`, and the reports `balance_report` and `payout_reconciliation_report`. The recommendation template's default list is `account_onboarding`, `notification_banner`, `account_management`, `payments`, `payouts`.
- **Fidelity depends on the charge pattern:** direct charges get full detail; destination and separate charges show reduced payment and dispute detail.
- **Browser only:** for native mobile apps, build payment views on the Stripe API directly.
- Issuing, Treasury, Capital and Tax component sets are outside this guidance.

## Disputes, refunds and transfer reversals

- **Destination disputes hit the platform:** Stripe debits the disputed amount from the platform balance while the funds have already moved to the connected account via `transfer_data`.
- **Recovery is not automatic:** refunds retain the transfer unless `reverse_transfer: true` is requested. Dispute recovery uses a separate transfer reversal after `charge.dispute.created`; inspect its actual result. A refund with a transfer reversal fails when the connected balance cannot fund the reversal. The old source gave disputes a `reverse_transfer` default and claimed insufficient reversal funds automatically create a negative balance; those were wrong. Refund-funding shortages and reversal failures are different cases. [stripe/ai, connect-recommend; https://docs.stripe.com/connect/charges#refunds; https://docs.stripe.com/connect/destination-charges#handle-disputes]
- **Risk policy for indirect charges:** [stripe/ai, connect-recommend] forbids `losses_collector: "stripe"` with destination/separate charges. Official Accounts v2 guidance recommends application liability because the platform bears indirect-charge fees and losses; that recommendation does not establish universal API rejection of every such payment. Keep explicit reversal/recovery handling and verify actual account/version constraints. The old heading called this a universal failure. [https://docs.stripe.com/connect/accounts-v2/connected-account-configuration]
- **Express accounts can't manage refunds, disputes or Radar rules** from their Express dashboard for destination or separate charges (`https://docs.stripe.com/connect/express-dashboard/payments.md`). That setup works only with `losses_collector: "application"` and webhook-driven refund and dispute recovery, with the platform handling insufficient balances.
- **What goes wrong:** no dispute webhooks, manual handling that forgets the reversal, assuming reversals are automatic.
- **Do:** verify webhook signatures, optionally restrict the endpoint to Stripe IPs (`https://docs.stripe.com/ips.md`), reverse the transfer in the `charge.dispute.created` handler, and alert on unrecovered dispute amounts.
- **Refunds are pending** when the balance is insufficient; handling differs by charge type.
- Liability and Radar choices are in [CONNECT-CHOOSING.md](CONNECT-CHOOSING.md#negative-balance-liability-and-risk).

## Webhooks

Endpoint setup and signature verification are in [WEBHOOKS.md](WEBHOOKS.md).

- **Every Connect integration needs a webhook endpoint** for Connect events. Endpoints have two scopes: Your account and Connected accounts (the endpoint's API `connect` parameter, `false` or `true`). v2 Accounts trigger v2 events in the "Your account" scope and v1 events in the "Connected accounts" scope.
- **Webhook events are the source of truth for payment status;** don't rely solely on synchronous API responses.
- **Production endpoints receive live and test events;** check `livemode`.
- **Connected-account events carry a top-level `account`;** make follow-up requests as that account with the per-request option `{ stripeAccount: 'acct_foo' }`.
- **Key events:** `account.application.deauthorized`, `account.external_account.updated`, `account.updated`, `balance.available`, `payment_intent.succeeded`, `payout.failed`, `person.updated`, and `charge.dispute.created` for reversals.
- **Hybrid platforms** (direct and destination or separate on the same accounts) need two sets of handlers: the payment lifecycle and the transfer and reversal lifecycle.

## Subscriptions with Connect

- **To charge connected accounts SaaS fees,** the account needs both the `merchant` and `customer` configurations. Pass the account as `customer_account` on SetupIntent and Subscription calls; don't create a separate v1 Customer object (the customer configuration replaces it).
- **Not for marketplace subscriptions or fan-to-creator recurring payments:** the `customer_account` guidance doesn't apply there.

## Product and country limits

- **Billing, Invoicing and Payment Links pair with direct charges.** With other charge types, Billing (Subscriptions, Invoicing), Tax, Payment Links and Checkout Sessions need care: check the docs or Stripe sales. Destination charges with Billing, Invoicing or Payment Links get a compatibility warning.
- **Cross-border payouts** have currency and timing limits by account country; Instant Payouts exist only in select countries. Check country availability before expanding internationally.
- **Small transactions ($1 to $5):** fees are large relative to proceeds and Stripe enforces currency-specific minimum charge amounts; consider batching or combining.

## Treasury

- **New integrations use the v2 Financial Accounts API:** `POST /v2/core/vault/financial_accounts` (`https://docs.stripe.com/api/v2/core/vault/financial-accounts.md`), "required for new integrations". Concepts: `https://docs.stripe.com/treasury/connect.md`.
- **Don't use v1 `POST /v1/treasury/financial_accounts`** for new integrations; existing v1 integrations keep working. (The v2 accounts docs still list the `treasury` capability among v1-only features.)

## Prove it

- No `type:` on any account creation and no `stripe.accounts.create`; every connected account is created with `stripe.v2.core.accounts.create` and explicit `dashboard`, `fees_collector`, `losses_collector`.
- Marketplace accounts request only `configuration.recipient` with `stripe_transfers`; direct-charge accounts request `configuration.merchant` with `card_payments`; nobody requests `stripe_balance.payouts` explicitly.
- Every account with `dashboard: 'express'` and `losses_collector: 'stripe'` is created with an explicit preview `apiVersion`, and the creation succeeds.
- No `application_fee_amount` on a separate-charges PaymentIntent; no `losses_collector: 'stripe'` account receives destination or separate charges.
- Before any transfer, charge or payout, code reads v2 capability status and finds `'active'`; nothing reads `charges_enabled` or `payouts_enabled`.
- `notification_banner` is mounted wherever connected accounts see the platform.
- In a sandbox, refund a destination charge with `reverse_transfer: true` and see the transfer reversed; dispute one and see `charge.dispute.created` produce a transfer reversal.
- The webhook handler checks `livemode` and uses the event's `account` for follow-up calls.
