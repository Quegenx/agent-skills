# Revenue metrics, invoices and pricing experiments

Measuring a Stripe business means reading Subscriptions, Invoices, Prices and Coupons through the API (often the Stripe MCP) and normalizing them yourself: MRR comes from active subscription items converted to a monthly amount, churn from canceled subscriptions, and paid-invoice totals serve as a declared collection proxy. Most wrong numbers come from incomplete pagination, mixing metric conventions and confusing invoices, cash and recognized revenue. Almost every formula and threshold here comes from a third-party skill set (marked [appeeky]), not from Stripe; the Stripe facts they rest on are unmarked. Subscription statuses and lifecycle are in [BILLING.md](BILLING.md); usage revenue in [USAGE-BASED.md](USAGE-BASED.md).

**Contents:** [Reading data over the Stripe MCP](#reading-data-over-the-stripe-mcp) · [MRR and ARR](#mrr-and-arr) · [Subscription counts and risk](#subscription-counts-and-risk) · [Churn](#churn) · [Cohorts](#cohorts) · [Forecasting](#forecasting) · [Expansion and NRR](#expansion-and-nrr) · [Segmentation and customer 360](#segmentation-and-customer-360) · [Invoices and cash](#invoices-and-cash) · [Revenue recognition](#revenue-recognition) · [Pricing experiments and price increases](#pricing-experiments-and-price-increases) · [Coupons and promotion codes](#coupons-and-promotion-codes) · [Health dashboard](#health-dashboard) · [Prove it](#prove-it)

## Reading data over the Stripe MCP

Use the shared [Stripe MCP read contract](AGENT-TOOLS.md#the-stripe-mcp): discover actual host tools, confirm account/project and read scope, paginate each endpoint correctly and preserve currency minor units. The [appeeky/stripe-skills] wrappers below are examples from that host, not universal tool names.

## MRR and ARR

- **Fetch** `GetSubscriptions` with `expand: ["data.items.data.price"]`, `status: active`, `limit: 100`, paginating until `has_more: false`. [appeeky]
- **Normalize flat recurring items to a month** [appeeky]. The table assumes flat `unit_amount` and quantity; weekly normalization is an approximation. Tiered, transformed, decimal, metered and day-based prices need their actual billing model rather than this formula. [https://docs.stripe.com/billing/subscriptions/analytics]

| `recurring.interval` | Monthly amount |
|---|---|
| month | `unit_amount × quantity / interval_count` |
| year | `unit_amount × quantity / (12 × interval_count)` |
| week | `unit_amount × quantity × 52 / (12 × interval_count)` |

- **Sum to MRR, × 12 for ARR;** group by `price.id` and product name. [appeeky]
- **Exclude trials from paid MRR** unless the user asks for "pipeline MRR". [appeeky] This matches Stripe: trial offer items and free trial periods don't count toward MRR during the trial.
- **Two measures:** [appeeky] uses active-only MRR and reports past_due separately as at risk. Stripe Billing Analytics includes active and past_due with positive normalized MRR, excluding trials, free plans, tax and metered products, with configurable discount treatment. Name the convention; do not claim the active-only snapshot equals the Dashboard. Stripe active subscribers counts a customer with several subscriptions once. [https://docs.stripe.com/billing/subscriptions/analytics]
- **Multi-currency:** report per currency, or convert with a stated FX rate. [appeeky]
- **Multi-item subscriptions** count once per subscription; sum their line items. [appeeky]

## Subscription counts and risk

All [appeeky].

- **Subscription counts by status:** active, trialing, past_due and unpaid are distinct counts; active status is not a payment ledger. [appeeky] optionally includes past_due in its active-style measure and calls past_due plus unpaid at risk. State that convention rather than labeling the sum paid subscriptions. [https://docs.stripe.com/billing/subscriptions/overview#subscription-statuses]
- **Flag when `past_due` exceeds 5% of active** and investigate the dunning setup ([BILLING.md](BILLING.md#smart-retries-and-dunning)).
- **Status meanings differ from Stripe's for two values:** this skill set reads `paused` as "collection paused" and `unpaid` as "retries exhausted". Stripe's docs say pause_collection preserves the subscription's status and continues invoice behavior, while a paused subscription stops invoicing, and `unpaid` appears only when your retry settings choose it. Use Stripe's definitions ([BILLING.md](BILLING.md#statuses)).

## Churn

All [appeeky].

- **Classify churn:** voluntary = `cancellation_details.reason`, user canceled, feedback; involuntary = was `past_due` then `canceled`, `invoice.payment_failed`; payment method = debit or prepaid card plus failed charges.
- **Sample canceled subscriptions** with `GetSubscriptionsSubscriptionExposedId`, expanding `cancellation_details`.
- **Monthly churn:** `Monthly churn % ≈ canceled_in_30d / (active_start + new_in_30d) × 100`.
- **Benchmark:** under 5% monthly is good for SMB SaaS; under 2% is excellent.
- **If involuntary churn exceeds 40% of churn,** audit payment failures ([BILLING.md](BILLING.md#audits-over-the-stripe-mcp)).
- **A second formula** [coreyhaines31/marketingskills, churn-prevention]: monthly churn = churned customers / start-of-month customers, with targets of under 5% for B2C and under 2% for B2B, and net revenue churn = (lost MRR - expansion MRR) / start MRR. The denominators differ from the [appeeky] formula above, so a report names which it uses. Save rate, offer acceptance and the health score are in [churn-prevention HEALTH-SCORE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/HEALTH-SCORE.md#metrics).

## Cohorts

[appeeky]

- **List subscriptions of all statuses** with `created` and `canceled_at` or `ended_at`; bucket by signup month; compute the % still active at M1, M2, M3 and onward.
- **Declare the retention unit, observation cutoff and cohort maturity.** Customer and subscription retention are different measures; current snapshots alone cannot reconstruct every historical revenue level. Use observed change history for revenue retention and state unavailable history. The source's optional current-MRR weighting is not proof of historical cohort revenue. [appeeky; https://docs.stripe.com/data/query-billing-data]

## Forecasting

[appeeky]

- **Model:** `Next month MRR = current_MRR * (1 - churn_rate) + new_MRR_added`; project 3, 6 and 12 months.
- **Inputs:** current MRR, historically observed new acquisitions and their MRR, and the declared churn measure. Count acquisitions across later outcomes using change history, separating new, reactivated, expanded, contracted and churned activity. The old source counted only currently active recent subscriptions, excluding those already churned. [appeeky; https://docs.stripe.com/data/query-billing-data]
- **Scenarios:** best, base and worst = churn ±2 percentage points, growth ±20%. State every assumption; quality degrades past 6 months.

## Expansion and NRR

[appeeky]

- **NRR** = (start MRR + expansion - contraction - churn) / start MRR; above 100% is expansion-positive.
- **Expansion segments:** single-plan subscriptions (higher tier, add-ons); users near usage or seat limits (if metadata tracks it); long-tenure subscriptions on legacy low prices.

## Segmentation and customer 360

[appeeky]

- **Segment axes:** plan (`price.id`); country (`card.country` or customer address); card funding (`card.funding`); tenure (`created`, bucketed); value (MRR tiers: whale, mid, low). Per segment report count, MRR, share and past_due rate.
- **Concentration:** flag if the top 10% of customers hold more than 50% of MRR.
- **Customer 360:** resolve the customer with `search_stripe_resources` by email or `fetch_stripe_resources` by `cus_` or `sub_` id; pull the customer (created, currency, delinquent), subscriptions, invoices (paid total as an LTV proxy; open and uncollectible), default payment method (brand, funding, expiry) and discounts.
- **Churn-risk signals:** `delinquent: true` High; a past_due subscription High; a prepaid or expiring card Medium; long-tenure active Low (protect).

## Invoices and cash

- **Invoice statuses** [appeeky]: open awaits payment; paid is a recorded invoice state, not proof of a Stripe cash transfer (out-of-band and zero-value invoices exist); uncollectible is written off; void is canceled. [https://docs.stripe.com/invoicing/automatic-reconciliation]
- **Paid-invoice amount is a declared proxy.** The source sums `amount_paid` on paid invoices; reconcile actual payments, out-of-band marking, refunds, customer balances and timing before calling it Stripe settlement or bank cash. For a payment-time metric use `paid_at`, not invoice creation time. The old source labeled that invoice sum cash collected. [https://docs.stripe.com/invoicing/automatic-reconciliation]
- **Subscription vs one-off invoices:** check the invoice's `subscription` property.
- **Proration lines** carry `proration` on invoice items and `parent.subscription_item_details.proration` on invoice line items; negative prorations aren't refunded automatically and positive ones aren't billed immediately ([SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md#prorations)).
- **Rounding is per invoice line item.**
- **Metronome usage:** reconcile payments against the Stripe invoice total, never the Metronome invoice `total` (Metronome sends untaxed lines, Stripe adds tax, sub-cent rounding differs).

## Revenue recognition

[appeeky]

- **Cash isn't recognized revenue.** An annual plan bills 120 USD upfront but recognizes 10 USD a month over 12 months; the unrecognized part is deferred revenue (a liability).
- **Recognize actual service obligations over their service periods.** Use finalized invoice lines, the selected amortization granularity and credit/refund treatment; current MRR times elapsed months is not a general accounting formula. The old source presented it as one. The annual example above is a simplified equal-month illustration, not a substitute for invoice-period accounting. [https://docs.stripe.com/revenue-recognition/methodology/subscriptions-and-invoicing; https://docs.stripe.com/revenue-recognition/examples/subscriptions]
- **For audited books** use Stripe Revenue Recognition (Dashboard > Revenue; https://docs.stripe.com/revenue-recognition).

## Pricing experiments and price increases

- **Price mutations and lookup-key transfers:** follow the [catalog contract](BILLING.md#model-the-catalog).

- **Test design** [appeeky]: a new Price object; split traffic at checkout (price ID by cohort or flag); grandfather existing subscriptions on the old price; compare conversion %, ARPU and churn at 30 and 60 days.
- **Price increase playbook** [appeeky]: (1) create the new higher price; (2) send new customers to it; (3) keep existing customers or migrate them with notice (email plus `subscriptions.update`); (4) measure the churn delta. When migrating, replace the subscription item by `id` and resend the quantity ([SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md#upgrades-and-downgrades)).
- **Grandfathering: the sources differ.** [appeeky] grandfathers existing subscriptions on the old price during a test. [coreyhaines31/marketingskills, pricing] grandfathers "as a *transition* (a grace period), not a permanent exemption" and migrates existing customers in waves, 5 to 10% first, with the reason explained months ahead ([pricing-strategy PRICE-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PRICE-CHANGES.md#rollout)). Both views stand, each for its own job (testing a price versus migrating the base).
- **Catalog audit** [appeeky]: `GetProducts` with `active: true`; `GetPrices` with `active: true`, `type: recurring`; count active subscriptions per `price.id`; flag orphan prices (no active subscriptions), legacy prices still in use, and the annual vs monthly mix.
- **Checkout conversion** [appeeky]: from `GetCheckoutSessions` (paginated), `Conversion % = complete / (complete + expired) × 100`. Segment sessions by `status` (`complete`, `expired`, `open`) over a recent window; for `mode: subscription` link the `subscription` id; check `payment_status` on completed sessions. Cross-check the code for `/api/checkout`, `checkout.sessions.create`, `success_url`, `cancel_url`; common issues are missing customer reuse (double subscription risk) and no promotion code tracking.

## Coupons and promotion codes

- **Audit** [appeeky]: `GetCoupons` with `limit: 100`; `GetPromotionCodes` active; check the `discount` or `discounts` array on active subscriptions; estimate the discounted MRR impact. Risk: lifetime discounts on annual plans.
- **Checkout:** `allow_promotion_codes: true` [appeeky]. All coupons in a session must share the session's default currency or creation errors.
- **No limit** on the number of coupons.
- **Proration with discounts:** prorations use the discounted price and proration lines are `discountable=false`; changing coupons or discounts alone creates no prorations.
- **Billing credits apply after discounts,** before taxes.
- **Cancellation deflection:** the Customer Portal can offer a coupon and collect cancellation reasons.
- **Portal cancellation reasons and retention-coupon settings:** see [Customer portal](BILLING.md#customer-portal); matching offers to reasons remains in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#match-the-offer-to-the-reason).

## Health dashboard

The complete [account-health runbook](OPERATIONS.md#health-dashboard) owns the eight-step sequence, traffic lights and three weekly actions. [appeeky]

## Prove it

- **Pagination:** totals exhaust the selected endpoint's actual list/search pagination and disclose unavailable history or wrapper caps. [https://docs.stripe.com/api/pagination/search]
- **MRR:** a yearly 1200 USD item contributes 100 USD; a trialing subscription contributes 0 to paid MRR; past_due treatment is named as either the appeeky convention or Stripe Analytics convention above. [https://docs.stripe.com/billing/subscriptions/analytics]
- **Currencies:** MRR is either split per currency or carries the FX rate used.
- **Invoices, cash and recognition:** the report distinguishes paid-invoice proxy totals, actual payment/settlement evidence and service-period recognition. [https://docs.stripe.com/invoicing/automatic-reconciliation; https://docs.stripe.com/revenue-recognition/methodology/subscriptions-and-invoicing]
- **Pricing change:** an amount/interval change creates a new Price; supported maintenance updates remain allowed; existing subscriptions still show the old `price.id` unless deliberately migrated.
- **Churn split:** canceled subscriptions are classified voluntary or involuntary from `cancellation_details` and `past_due` history, and the total matches the canceled count.
