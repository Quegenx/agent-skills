# Revenue metrics, invoices and pricing experiments

Measuring a Stripe business means reading Subscriptions, Invoices, Prices and Coupons through the API (often the Stripe MCP) and normalizing them yourself: MRR comes from active subscription items converted to a monthly amount, churn from canceled subscriptions, cash from paid invoices. Most wrong numbers come from three mistakes: stopping before pagination ends, counting trials or `past_due` as paid revenue, and treating cash collected as recognized revenue. Almost every formula and threshold here comes from a third-party skill set (marked [appeeky]), not from Stripe; the Stripe facts they rest on are unmarked. Subscription statuses and lifecycle are in [BILLING.md](BILLING.md); usage revenue in [USAGE-BASED.md](USAGE-BASED.md).

**Contents:** [Reading data over the Stripe MCP](#reading-data-over-the-stripe-mcp) · [MRR and ARR](#mrr-and-arr) · [Subscription counts and risk](#subscription-counts-and-risk) · [Churn](#churn) · [Cohorts](#cohorts) · [Forecasting](#forecasting) · [Expansion and NRR](#expansion-and-nrr) · [Segmentation and customer 360](#segmentation-and-customer-360) · [Invoices and cash](#invoices-and-cash) · [Revenue recognition](#revenue-recognition) · [Pricing experiments and price increases](#pricing-experiments-and-price-increases) · [Coupons and promotion codes](#coupons-and-promotion-codes) · [Health dashboard](#health-dashboard) · [Prove it](#prove-it)

## Reading data over the Stripe MCP

All [appeeky].

- **Connect the Stripe MCP** via OAuth or a restricted key (https://docs.stripe.com/mcp). Call `GetMcpTools` (server `user-Stripe` or `plugin-stripe-stripe`) before any `CallMcpTool`.
- **Prefer `stripe_api_search`, then `stripe_api_details`, then `stripe_api_read`** for list and retrieve. Example: `stripe_api_read GetSubscriptions { status: "active", limit: 100 }`.
- **Always paginate:** `limit: 100`, follow `has_more` with `starting_after`.
- **Search caps at 100 results.** `search_stripe_resources` with `subscriptions:status:"canceled"` stops at 100; use `GetSubscriptions` with pagination (list and filter) instead.
- **Other tools:** `search_stripe_resources`, `fetch_stripe_resources` (by `cus_` or `sub_` id), `search_stripe_documentation`, `get_stripe_account_info`.
- **Amounts are in cents** unless noted. Never expose secret keys; never print card numbers or PII beyond last4 and country. Read-only for audits; confirm before writes.

## MRR and ARR

- **Fetch** `GetSubscriptions` with `expand: ["data.items.data.price"]`, `status: active`, `limit: 100`, paginating until `has_more: false`. [appeeky]
- **Normalize each item to a month** [appeeky]:

| `recurring.interval` | Monthly amount |
|---|---|
| month | `unit_amount × quantity / interval_count` |
| year | `unit_amount × quantity / (12 × interval_count)` |
| week | `unit_amount × quantity × 52 / (12 × interval_count)` |

- **Sum to MRR, × 12 for ARR;** group by `price.id` and product name. [appeeky]
- **Exclude trials from paid MRR** unless the user asks for "pipeline MRR". [appeeky] This matches Stripe: trial offer items and free trial periods don't count toward MRR during the trial.
- **`past_due` is "MRR at risk",** reported separately if included. [appeeky]
- **Multi-currency:** report per currency, or convert with a stated FX rate. [appeeky]
- **Multi-item subscriptions** count once per subscription; sum their line items. [appeeky]

## Subscription counts and risk

All [appeeky].

- **Paid subscriptions** = active (+ optionally past_due). **Trial pipeline** = trialing count. **At risk** = past_due + unpaid. `items.data.length` gives line items per subscription (multi-product subscriptions).
- **Flag when `past_due` exceeds 5% of active** and investigate the dunning setup ([BILLING.md](BILLING.md#smart-retries-and-dunning)).
- **Status meanings differ from Stripe's for two values:** this skill set reads `paused` as "collection paused" and `unpaid` as "retries exhausted". Stripe's docs say pausing collection keeps the status `active`, and `unpaid` appears only when your retry settings choose it. Use Stripe's definitions ([BILLING.md](BILLING.md#statuses)).

## Churn

All [appeeky].

- **Classify churn:** voluntary = `cancellation_details.reason`, user canceled, feedback; involuntary = was `past_due` then `canceled`, `invoice.payment_failed`; payment method = debit or prepaid card plus failed charges.
- **Sample canceled subscriptions** with `GetSubscriptionsSubscriptionExposedId`, expanding `cancellation_details`.
- **Monthly churn:** `Monthly churn % ≈ canceled_in_30d / (active_start + new_in_30d) × 100`.
- **Benchmark:** under 5% monthly is good for SMB SaaS; under 2% is excellent.
- **If involuntary churn exceeds 40% of churn,** audit payment failures ([BILLING.md](BILLING.md#audits-over-the-stripe-mcp)).
- **A second formula** [coreyhaines31/marketingskills, churn-prevention]: monthly churn = churned customers / start-of-month customers, with targets of under 5% for B2C and under 2% for B2B, and net revenue churn = (lost MRR - expansion MRR) / start MRR. The denominators differ from the [appeeky] formula above, so a report names which it uses. Save rate, offer acceptance and the health score are in [../../marketing/churn-prevention/HEALTH-SCORE.md](../../marketing/churn-prevention/HEALTH-SCORE.md#metrics).

## Cohorts

[appeeky]

- **List subscriptions of all statuses** with `created` and `canceled_at` or `ended_at`; bucket by signup month; compute the % still active at M1, M2, M3 and onward.
- **Optionally weight by MRR** for revenue retention. Flag the month with the steepest drop.

## Forecasting

[appeeky]

- **Model:** `Next month MRR = current_MRR * (1 - churn_rate) + new_MRR_added`; project 3, 6 and 12 months.
- **Inputs:** current MRR; new subscriptions per month (active subscriptions created in the last 30, 60 or 90 days via the `created` filter); monthly churn %; average new MRR per subscription.
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

- **Invoice statuses** [appeeky]: `open` awaiting payment (check past_due subscriptions); `paid` collected; `uncollectible` written off, a churn signal; `void` canceled.
- **Cash collected** = the sum of `amount_paid` on paid invoices (`GetInvoices` by `status`). The gap to MRR comes from one-time charges, prorations and credits. [appeeky]
- **Subscription vs one-off invoices:** check the invoice's `subscription` property.
- **Proration lines** carry `proration` on invoice items and `parent.subscription_item_details.proration` on invoice line items; negative prorations aren't refunded automatically and positive ones aren't billed immediately ([SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md#prorations)).
- **Rounding is per invoice line item.**
- **Metronome usage:** reconcile payments against the Stripe invoice total, never the Metronome invoice `total` (Metronome sends untaxed lines, Stripe adds tax, sub-cent rounding differs).

## Revenue recognition

[appeeky]

- **Cash isn't recognized revenue.** An annual plan bills 120 USD upfront but recognizes 10 USD a month over 12 months; the unrecognized part is deferred revenue (a liability).
- **Recognized (period)** = MRR × months elapsed; **deferred balance** = prepaid - recognized.
- **For audited books** use Stripe Revenue Recognition (Dashboard > Revenue; https://docs.stripe.com/revenue-recognition).

## Pricing experiments and price increases

- **Never mutate a live Price; create a new one.** Stripe's docs: after creation only `metadata`, `nickname` and `active` are updatable; to change a price, create a new Price and archive the old one. Archived prices keep existing subscriptions running until canceled, and deactivate payment links that use them.
- **Move a lookup key to the new price** with `transfer_lookup_key: true` so code that reads `prices.list({ lookup_keys: [...] })` picks it up.
- **Test design** [appeeky]: a new Price object; split traffic at checkout (price ID by cohort or flag); grandfather existing subscriptions on the old price; compare conversion %, ARPU and churn at 30 and 60 days.
- **Price increase playbook** [appeeky]: (1) create the new higher price; (2) send new customers to it; (3) keep existing customers or migrate them with notice (email plus `subscriptions.update`); (4) measure the churn delta. When migrating, replace the subscription item by `id` and resend the quantity ([SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md#upgrades-and-downgrades)).
- **Grandfathering: the sources differ.** [appeeky] grandfathers existing subscriptions on the old price during a test. [coreyhaines31/marketingskills, pricing] grandfathers "as a *transition* (a grace period), not a permanent exemption" and migrates existing customers in waves, 5 to 10% first, with the reason explained months ahead ([../../marketing/pricing-strategy/PRICE-CHANGES.md](../../marketing/pricing-strategy/PRICE-CHANGES.md#rollout)). Both views stand, each for its own job (testing a price versus migrating the base).
- **Catalog audit** [appeeky]: `GetProducts` with `active: true`; `GetPrices` with `active: true`, `type: recurring`; count active subscriptions per `price.id`; flag orphan prices (no active subscriptions), legacy prices still in use, and the annual vs monthly mix.
- **Checkout conversion** [appeeky]: from `GetCheckoutSessions` (paginated), `Conversion % = complete / (complete + expired) × 100`. Segment sessions by `status` (`complete`, `expired`, `open`) over a recent window; for `mode: subscription` link the `subscription` id; check `payment_status` on completed sessions. Cross-check the code for `/api/checkout`, `checkout.sessions.create`, `success_url`, `cancel_url`; common issues are missing customer reuse (double subscription risk) and no promotion code tracking.

## Coupons and promotion codes

- **Audit** [appeeky]: `GetCoupons` with `limit: 100`; `GetPromotionCodes` active; check the `discount` or `discounts` array on active subscriptions; estimate the discounted MRR impact. Risk: lifetime discounts on annual plans.
- **Checkout:** `allow_promotion_codes: true` [appeeky]. All coupons in a session must share the session's default currency or creation errors.
- **No limit** on the number of coupons.
- **Proration with discounts:** prorations use the discounted price and proration lines are `discountable=false`; changing coupons or discounts alone creates no prorations.
- **Billing credits apply after discounts,** before taxes.
- **Cancellation deflection:** the Customer Portal can offer a coupon and collect cancellation reasons.
- **The portal's cancel page** (https://docs.stripe.com/customer-management/cancellation-page): cancel in the portal "is enabled by default". Reasons you can enable: "It's too expensive", "I need more features", "I found an alternative", "I no longer need it", "Customer service was less than expected", "Ease of use was less than expected", "Quality was less than expected", "Other reason" (free text). They show on the subscription page, in Sigma, and in "The `subscription.updated` webhook". The coupon is set at Settings > customer portal > Cancellations > "Retention Coupon". Period-end cancellation behaves differently by billing mode ([BILLING.md](BILLING.md#customer-portal)). Matching offers to reasons and the discount limits are in [../../marketing/churn-prevention/CANCEL-FLOWS.md](../../marketing/churn-prevention/CANCEL-FLOWS.md#match-the-offer-to-the-reason).

## Health dashboard

[appeeky]

- **Run order:** (1) `get_stripe_account_info`; (2) MRR (active, with past_due as at risk); (3) subscription status table; (4) top 5 past_due by MRR; (5) payment failures over the last 30 days; (6) card mix, active vs past_due; (7) open disputes from `GetDisputes`; (8) available balance from `GetBalance`.
- **Traffic lights** for MRR trend, churn and past due, payment failures, webhooks and emails (manual or code check), fraud and Radar; end with "Top 3 actions this week". Load `stripe-billing-context.md` if present for target comparisons.

## Prove it

- **Pagination:** the subscription count you report equals the number of rows across all pages until `has_more: false`, not 100.
- **MRR:** a yearly 1200 USD item contributes 100 USD; a trialing subscription contributes 0 to paid MRR; past_due appears only as MRR at risk.
- **Currencies:** MRR is either split per currency or carries the FX rate used.
- **Cash vs MRR:** the difference between paid invoice `amount_paid` and MRR is explained by one-time charges, prorations and credits.
- **Pricing change:** the old Price is archived, not edited; existing subscriptions still show the old `price.id` unless deliberately migrated.
- **Churn split:** canceled subscriptions are classified voluntary or involuntary from `cancellation_details` and `past_due` history, and the total matches the canceled count.
