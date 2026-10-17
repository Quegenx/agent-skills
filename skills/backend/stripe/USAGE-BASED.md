# Usage-based billing, meters and Metronome

Usage-based billing charges for what a customer consumed. Stripe offers two paths: Metronome, "Stripe's primary usage-based billing platform and the recommended starting point for all new integrations", and basic usage-based billing on the Meters API, "a lower-level primitive that remains fully supported for existing integrations." The choice decides most outcomes, so pick it first; then every usage event needs a stable idempotency identifier and must arrive before the invoice finalizes, because finalized invoices ignore late usage. Subscriptions are in [BILLING.md](BILLING.md), prorations and trials in [SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md); webhook handling in [WEBHOOKS.md](WEBHOOKS.md); the CLI in [TESTING-AND-CLI.md](TESTING-AND-CLI.md). Bullets marked [appeeky] come from a third-party skill set, not from Stripe.

**Contents:** [Pick Metronome or Meters](#pick-metronome-or-meters) · [Metronome with Stripe](#metronome-with-stripe) · [Metronome rules](#metronome-rules) · [Meters: configure](#meters-configure) · [Meters: pay as you go](#meters-pay-as-you-go) · [Recording usage](#recording-usage) · [Meter errors](#meter-errors) · [Alerts and thresholds](#alerts-and-thresholds) · [Billing credits](#billing-credits) · [Legacy usage records](#legacy-usage-records) · [Prove it](#prove-it)

## Pick Metronome or Meters

- **New usage-based integration, any complexity: recommend Metronome** (https://docs.stripe.com/billing/usage-based.md), not the Billing Meters API. Metronome provides real-time metering, pricing (rating), billing and reporting, enterprise contracts, prepaid credits and real-time usage visibility.
- **Route to Metronome for:** new usage billing; prepaid credits and burndown; enterprise contracts, commits and ramp schedules; dimensional or composite pricing; high-volume event ingestion; real-time usage visibility and reporting; a SaaS or AI product with usage pricing.
- **Usage on top of an existing flat-rate or per-seat Subscription** with no Billing Meters usage: "Metronome with Stripe Subscriptions". Keep the subscription, Checkout and the Customer Portal; Metronome bills only the usage. An existing Stripe Subscription alone isn't a reason to choose Billing Meters.
- **Stay on Billing Meters when** you already bill through them with simple pay-as-you-go needs ("you don't need to migrate"), or when the usage price must work with Connect, Adaptive Pricing or Workflows, which Metronome doesn't support.
- **Compatibility** (https://docs.stripe.com/billing/subscriptions/usage-based/compare-metronome.md):

| Feature | Metronome | Basic (Meters) |
|---|---|---|
| Checkout | Limited: "Requires custom API calls and webhook configuration" | Supported |
| Connect | Not supported | Supported |
| Adaptive Pricing | Not supported | Supported |
| Workflows | Not supported | Supported |
| Stripe Dashboard | Not supported | Supported |
| Automatic Tax | Supported | Supported |
| Credits | Real-time | Reconcile only at invoice time: "Customers can exceed their balance during the cycle" |

- **Payment links don't support usage-based billing,** and Payment Links reject usage-based prices.
- **Models** [appeeky]: pure metered (meter plus usage-based price, bill actual usage); prepaid credits (a credit grant burns down with usage); hybrid (base subscription plus overage above an included quota).
- **The [appeeky] skill says modern Stripe usage billing means Meters and Meter Events.** Stripe's own docs and skill recommend Metronome for new integrations and mark the Meters pay-as-you-go guide "Not Recommended" for new integrations; the [appeeky] skill mentions Metronome only for complex credit or commit models. Follow Stripe's recommendation.

## Metronome with Stripe

- **Before any Metronome implementation answer or code, load the `metronome` skill;** if it isn't installed, read https://docs.stripe.com/.well-known/skills/metronome/SKILL.md. Read the linked doc before naming any endpoint, field or amount. Stripe's guide: https://docs.stripe.com/billing/how-metronome-works-with-stripe.md
- **Flat or per-seat fee plus usage:** keep the fee on the Stripe Subscription; create the Metronome customer with the Stripe Customer ID (for example from the `customer.subscription.created` webhook); Metronome pushes a separate usage invoice to the same Stripe Customer. Don't cancel the existing subscription when adding usage.
- **"Metronome independently"** (the fee moves to Metronome too) only when the user wants Metronome contract and commit features and doesn't need Checkout or Payment Links for signup.
- **API:** base `https://api.metronome.com`, Bearer token in the `Authorization` header. Sandbox and production share the base URL; the token decides the environment.
- **Use Contracts, not legacy Plans,** for new integrations: Plans are deprecated and lack rate card overrides, commits and flexible scheduling. Don't propose migrating an existing Plans integration unless asked; when migrating, move credit balances with `POST /v1/credits/migrateToContracts`.
- **Routing:**

| Task | API | Docs |
|---|---|---|
| Ingest usage | `POST /v1/ingest` (batch) | https://docs.metronome.com/guides/events/send-usage-events.md, https://docs.metronome.com/api-reference/usage/ingest-events.md, ingest aliases https://docs.metronome.com/api-reference/customers/create-or-update-customer-ingest-aliases.md, quickstart https://docs.metronome.com/guides/get-started/api-quickstart.md |
| What to measure | Billable Metrics API | https://docs.metronome.com/guides/implement-metronome/core-concepts/create-billable-metrics.md |
| Enterprise pricing | Contracts and Rate Cards | https://docs.metronome.com/guides/implement-metronome/core-concepts/provision-contract.md, https://docs.metronome.com/guides/implement-metronome/core-concepts/create-manage-rate-cards.md, https://docs.metronome.com/api-reference/contracts/create-a-contract.md, https://docs.metronome.com/api-reference/rate-cards/add-rates.md |
| Mid-term changes | Contract Edits | https://docs.metronome.com/guides/pricing-packaging/make-pricing-changes/edit-contract.md, https://docs.metronome.com/guides/pricing-packaging/make-pricing-changes/edit-or-override-a-contract.md, https://docs.metronome.com/guides/customers-billing/manage-customers/manage-customer-lifecycle.md |
| Invoices | | https://docs.metronome.com/guides/implement-metronome/core-concepts/how-invoicing-works.md |
| Commits and credits (prepaid, postpaid, top-ups) | | https://docs.metronome.com/guides/pricing-packaging/apply-credits-and-commits/create-a-pre-paid-commit.md, https://docs.metronome.com/guides/pricing-packaging/apply-credits-and-commits/manual-payment-gated-commits.md |
| Stripe invoice sync | Stripe billing provider config | https://docs.metronome.com/integrations/invoice-integrations/stripe.md |
| Prepaid balances, auto-recharge, spend alerts, thresholds | Notifications API | https://docs.metronome.com/guides/customers-billing/optimize-customer-experience/prepaid-balance-thresholds.md, https://docs.metronome.com/guides/customers-billing/optimize-customer-experience/set-customer-spend-control.md, https://docs.metronome.com/guides/pricing-packaging/apply-credits-and-commits/alerts.md |

- **Metronome's operational skills** live at `https://docs.metronome.com/.well-known/skills/<name>/SKILL.md`. Read the one you use in full; confirm which environment the token targets and get explicit confirmation before any write. Where a step writes to Stripe (for example a migration cutover that ends subscriptions), identify the Stripe account and mode (for example `GET /v1/account`) and confirm those writes separately.

| Skill | Does |
|---|---|
| `stripe-to-metronome-migration` | Migrates from Stripe Billing Meters, Subscriptions and Credit Grants: creates customers, contracts and credits, flips billable status, ends Stripe subscriptions at cutover; covers scoping, concept mapping, group key design, parallel run, rollback. |
| `metronome-group-keys` | Designs `group_keys`, `pricing_group_key`, `presentation_group_key`. A compound key costs the product of each dimension's cardinality; `group_keys` is immutable. |
| `metronome-setup-catalog` | End-to-end setup to a verified draft invoice. |
| `metronome-create-customer` | Duplicate check and preview, then `POST /v1/customers` with name, ingest alias, Salesforce ID, Slack channel. |
| `metronome-create-contract` | Commits, credits, rate overrides including commit-specific discounts on a new contract. |
| `metronome-token-billing` | AI token billing: a managed rate card with markup over Stripe's model catalog. |
| `metronome-plg-billing` | Self-serve billing; start-billing and change-pricing modes write, customer-story mode is read-only. |
| `metronome-csm-reviews` | Read-only, for Metronome's account team. |

## Metronome rules

- **Edit contracts with `POST /v2/contracts/edit`,** not the deprecated Amendments `/v1/contracts/amend`; Edits are required for v2 subscription features. Create a new contract with `transition: {type: "renewal", from_contract_id}` only for renewals.
- **Batch ingestion in production:** the `POST /v1/ingest` body is a bare JSON array of 1 to 100 events, not wrapped in an object. Single-event ingestion is for testing only.
- **`200` means accepted, not rated.** Events whose `event_type` matches no billable metric are stored but excluded from usage, so create billable metrics first.
- **One `transaction_id` per event, fixed at record time** and re-sent unchanged on retries (a UUID stored with the event or derived from the source record). Regenerating it per attempt defeats idempotency.
- **Deliver usage before the grace period ends:** 24 hours after `billing_period_end_date` by default. Finalized invoices ignore late events; correct them only by voiding and regenerating. Lengthening the grace period goes through Metronome support, not the API.
- **Several concurrent contracts per customer:** set `usage_filter` (`group_key`, `group_values`) on each; the group key must be a group key on the streaming billable metric (an event property for SQL metrics).
- **Never schedule a contract-level commit or credit access segment past the contract's `ending_before`;** end the last segment at the contract term and use `rollover_fraction` to carry the balance into a renewal.
- **`spend_threshold_configuration` commits take only** `product_id`, `name`, `description`, `priority` (no `applicable_product_ids`, `applicable_product_tags`, `specifiers`); only `prepaid_balance_threshold_configuration` commits accept product filters.
- **Never process several Metronome invoices for the same Stripe customer at once:** pending line items race.
- **Never hardcode pricing in contracts;** define it in rate cards and use contract-level overrides.
- **USD amounts are in cents** (`1000` = 10.00 USD) for thresholds, commits, credits and rate or override prices; other currencies use whole units.
- **Never finalize a Stripe invoice before tax calculation completes** (Stripe Tax, Avalara, Anrok).
- **Max 250 line items per Stripe invoice;** more collapses everything into one entry. Use composite products for high-cardinality metrics.
- **Reconcile payments against the Stripe invoice total,** never the Metronome invoice `total`: Metronome sends untaxed lines, Stripe adds tax, and sub-cent rounding differs.
- **Never set NetSuite as both** `billing_provider_configuration` and `revenue_system_configuration`.

## Meters: configure

- **A meter is fixed after configuration:** "After you configure the meter, you can't make any changes aside from the display name."
- **Aggregation:** `sum`, `count` or `last`.
- **Ingestion:** Raw (default) or Pre-aggregated (the latest event per hourly or daily UTC window wins).
- **Payload keys** default to `value` and `stripe_customer_id`; override with `value_settings` and `customer_mapping`.
- **"You can only use an event name with a single meter."**
- **Fix usage** with a Meter Event Adjustment `type=cancel` and `cancel[identifier]`. "You can only cancel events sent to Stripe within the last 24 hours"; finalized invoices aren't corrected. Negative quantities are allowed; negative cycle usage is reported as 0.
- **Design checklist** [appeeky]: meter defined with an aggregation (sum, count, last); price linked to the meter; usage events sent reliably (idempotent, retried); included quota vs overage tiers; customer-facing usage visibility. Review metered prices (`usage_type`, meter-linked) with `GetPrices`; meter definitions are at Dashboard > Billing > Meters; verify the code sends a meter event on each usage.

## Meters: pay as you go

The pay-as-you-go guide on Billing Meters is marked "Not Recommended" for new integrations (use Metronome). For existing Meters integrations, the full flow in Node: create a meter, a metered price, send an event, preview the invoice, read summaries.

```node
const meter = await stripe.billing.meters.create({
  display_name: 'Hypernian tokens',
  event_name: 'hypernian_tokens',
  default_aggregation: {
    formula: 'sum',
  },
  customer_mapping: {
    event_payload_key: 'stripe_customer_id',
    type: 'by_id',
  },
  value_settings: {
    event_payload_key: 'value',
  },
});

const price = await stripe.prices.create({
  currency: 'usd',
  unit_amount: 4,
  billing_scheme: 'per_unit',
  transform_quantity: {
    divide_by: 100,
    round: 'up',
  },
  recurring: {
    usage_type: 'metered',
    interval: 'month',
    meter: '{{METER_ID}}',
  },
  product_data: {
    name: 'Hypernian tokens',
  },
});

const meterEvent = await stripe.billing.meterEvents.create({
  event_name: 'hypernian_tokens',
  payload: {
    stripe_customer_id: '{{CUSTOMER_ID}}',
    value: '25',
  },
});

const invoice = await stripe.invoices.createPreview({
  subscription: '{{SUBSCRIPTION_ID}}',
});

const meterEventSummaries = await stripe.billing.meters.listEventSummaries(
  '{{METER_ID}}',
  {
    customer: '{{CUSTOMER_ID}}',
    start_time: 1717249380,
    end_time: 1717249440,
  }
);
```

- **First invoice:** `billing_mode=flexible` leaves metered items off the first invoice; `billing_mode=classic` adds a zero-value line item per metered item.
- **Accounts v2:** subscriptions use `customer_account`; create the customer with `stripe.v2.core.accounts.create({ contact_email, display_name, configuration: { customer: {} }, include: ['configuration.customer'] })`.
- **Usage-based items aren't prorated;** usage during a trial isn't billed; paused subscriptions accept meter events but don't invoice them. On cancel without prorating, "all metered usage gets discarded"; `clear_usage` has no effect with Billing Meters. See [SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md).

## Recording usage

- **Processing is asynchronous:** event summaries and upcoming invoices may lag behind what you sent.
- **Idempotency:** "Use idempotency keys to prevent reporting usage for each event more than one time." Each meter event has an `identifier` (auto-generated if you omit it).
- **Timestamps:** within the past 35 calendar days and no more than 5 minutes in the future (allows for clock drift). Report usage before the period's invoice finalizes; late events may be accepted but not invoiced. Threshold invoices include only usage received before the invoice was created.
- **Values may be decimals.**
- **Dimension cardinality:** up to 10,000 unique combinations per meter per hour and up to 100 per customer per meter; more fails with `meter_event_dimension_count_too_high`.
- **Rate limits (v1 Meter Event endpoint):** live mode 1000 calls/second per account, separate from the global limit; one concurrent call per customer per meter; in a sandbox it counts against the global limit; Connect requests with `Stripe-Account` are held to the regular 100 operations/second. Handle `429` with exponential backoff, or pre-aggregate.
- **High volume, API v2 meter event streams:** up to 10,000 events/second, live mode only (contact sales for 200,000). Create a session with `client.v2.billing.meterEventSession.create()`; its token is valid 15 minutes; send with `new Stripe(meterEventSession.authentication_token).v2.billing.meterEventStream.create({ events: [meterEvent] })`. Stream events don't show in Workbench Logs.

## Meter errors

- **Errors arrive as thin events:** `v1.billing.meter.error_report_triggered` and `v1.billing.meter.no_meter_found`.
- **Codes:** `meter_event_customer_not_found`, `meter_event_no_customer_defined`, `meter_event_dimension_count_too_high`, `archived_meter`, `timestamp_too_far_in_past`, `timestamp_in_future`, `meter_event_value_not_found`, `meter_event_invalid_value`, `no_meter`.
- **Parsing: sources differ.** The usage recording page's handler uses `client.parseThinEvent(req.body, sig, webhookSecret)`, then `client.v2.core.events.retrieve(thinEvent.id)` and `event.fetchRelatedObject()`; the general webhooks page uses `parseEventNotification`. Check the current stripe-node docs; see [WEBHOOKS.md](WEBHOOKS.md).
- **Test locally:** `stripe listen --forward-thin-to localhost:4242/webhooks --thin-events "*"`, then `stripe trigger v1.billing.meter.error_report_triggered --api-key <your-secret-key>`.

## Alerts and thresholds

- **Usage alerts:** `alert_type=usage_threshold`, `usage_threshold[meter]`, `usage_threshold[gte]=100`, `usage_threshold[recurrence]=one_time`, optional customer filter; fires `billing.alert.triggered`. Max 25 alerts per meter and customer combination. "Alerts currently don't work with test clocks." Evaluation includes usage reported before the alert was created.
- **Billing thresholds** invoice early when usage runs up: `billing_thresholds[amount_gte]` on subscriptions (smallest currency unit, at least 50 units); `billing_thresholds[usage_gte]` on subscription items (API only); `billing_thresholds[reset_billing_cycle_anchor]` defaults to false.
- **Volume tiers plus thresholds can credit the customer:** with a 5,000 USD threshold, 10,001 units at 0.40 USD = 4,000.40 USD, so 999.60 USD is credited as negative line items or customer balance.

## Billing credits

- **Credit Grants** prepay or promote usage. Not allowed for gift cards, stored value, third-party payments or digital wallets.
- **States:** pending, granted, depleted, expired (only if `expires_at` is set or expired via the API), voided (only if never applied).
- **Scope:** only metered prices reporting through Meters; not one-off invoices or one-time items. Credits apply after discounts, before taxes and `invoice_credit_balance`, and only at finalization. Credit notes don't restore credit grants.
- **Priority:** lower `priority` number first, then earlier `expires_at`, then the `promotional` category, then earlier `effective_at`, then earlier `created`.
- **Max 100 unused credit grants per customer** (based on ledger balance).

## Legacy usage records

- **"Use Metronome instead for new integrations."** On SDKs that deprecated UsageRecords you can pin a pre-Basil API version through a raw request.
- **Legacy records transfer on a price change;** `clear_usage: true` clears them.

## Prove it

- **Path chosen on purpose:** a new integration uses Metronome, or the reason for Meters is written down (existing Meters billing, or Connect, Adaptive Pricing or Workflows needed).
- **Idempotent retries:** re-sending the same usage after a simulated failure uses the same `transaction_id` (Metronome) or `identifier` (Meters), and the billed quantity doesn't double.
- **Metronome ingest:** `POST /v1/ingest` gets a bare array of at most 100 events, every `event_type` matches a billable metric, and a draft invoice shows the usage (not just a `200`).
- **Meters round trip:** after a meter event, `stripe.invoices.createPreview({ subscription })` and `listEventSummaries` show the usage (allow for async lag).
- **Errors reach you:** `stripe trigger v1.billing.meter.error_report_triggered` arrives at your thin-event handler through `stripe listen --forward-thin-to`.
- **Timing:** no code path sends timestamps older than 35 days or more than 5 minutes ahead; usage flushes before invoice finalization (Meters) or within 24 hours of `billing_period_end_date` (Metronome).
- **Reconciliation:** Metronome payments are matched against the Stripe invoice total.
