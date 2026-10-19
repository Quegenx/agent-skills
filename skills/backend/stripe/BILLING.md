# Billing and subscriptions

Stripe Billing turns a catalog of Products and Prices into Subscriptions that invoice, collect, retry and cancel on their own. Most outcomes come down to three things: whether the catalog is modeled as one Product per pricing-page row with Prices only for billing variants, whether access follows the subscription `status` (never a paid invoice alone), and whether every change names the subscription item and sets `proration_behavior` on purpose. Trials, plan changes, prorations, cancel and pause are in [SUBSCRIPTION-CHANGES.md](SUBSCRIPTION-CHANGES.md); subscription events and their handlers live in [WEBHOOKS.md](WEBHOOKS.md); one-time payments in [PAYMENTS.md](PAYMENTS.md); test clocks and the CLI in [TESTING-AND-CLI.md](TESTING-AND-CLI.md); meters and Metronome in [USAGE-BASED.md](USAGE-BASED.md); tax in [TAX.md](TAX.md). Bullets marked [appeeky] come from a third-party skill set, not from Stripe.

**Contents:** [Use Billing, not a renewal loop](#use-billing-not-a-renewal-loop) · [Model the catalog](#model-the-catalog) · [Design the integration](#design-the-integration) · [Subscription lifecycle](#subscription-lifecycle) · [Statuses](#statuses) · [Provision and revoke access](#provision-and-revoke-access) · [Customer portal](#customer-portal) · [Smart Retries and dunning](#smart-retries-and-dunning) · [Audits over the Stripe MCP](#audits-over-the-stripe-mcp) · [Prove it](#prove-it)

## Use Billing, not a renewal loop

- **Recurring revenue goes through the Billing APIs.** Subscriptions, usage-based and seat-based pricing use Billing (plan with https://docs.stripe.com/billing/subscriptions/design-an-integration.md) instead of a direct PaymentIntent integration. Review the Subscription Use Cases (https://docs.stripe.com/billing/subscriptions/use-cases.md) and the SaaS guide (https://docs.stripe.com/saas.md).
- **Pair Billing with Checkout.** Checkout Sessions support `mode: 'subscription'` and handle the initial payment, trial management and proration.
- **Self-service goes to the Customer Portal:** upgrades, downgrades, cancellation and payment method updates.
- **Always add a short Stripe Tax note** to any answer about Billing setup or subscriptions, without waiting to be asked: if you'll charge US or EU customers, consider enabling Stripe Tax alongside Billing (https://docs.stripe.com/billing/taxes/collect-taxes.md). See [TAX.md](TAX.md).
- **Anti-patterns:**
  - Manual renewal loops with raw PaymentIntents. Billing handles renewal, retry logic and dunning.
  - The deprecated `plan` object. Use Prices (https://docs.stripe.com/api/prices.md).
  - Prices for different tiers on one Product (see below).
  - Skipping tax setup or assuming `automatic_tax` is enough: Stripe collects no tax and returns no error until an active registration exists.
  - Creating a new subscription instead of updating the existing one: double billing. Guard with an `alreadyOnPlan` check, check for an existing `stripe_customer_id` before creating, and use `subscriptions.update` for plan changes. [appeeky]

## Model the catalog

- **Products are what you sell; Prices are how much and how often.** Unlike most Stripe resources, you can choose a Product's ID yourself. A Product can carry a Stripe Tax code.
- **One Product per pricing-page row.** "If two options appear as different rows on your pricing page, they must be different products. If they're the same row billed at a different interval (monthly versus annual), they're different prices on one product." Starter, Professional and Enterprise are 3 products with 2 prices each (monthly, annual). "Don't attach prices for different tiers to a single product": Checkout Sessions and invoices show the Product name on each line item, so shared tiers look identical.
- **New Product when** the name, the features or entitlements, the tax code or the line item differs. **New Price when** the interval, the currency or the amount changes.
- **Prices are one-time or recurring.** Selling one service at several intervals: create several recurring Prices on the same Product. One Price can hold several currencies. No limit on the number of customers, coupons, products or prices.
- **Changing the recurring amount, currency or interval needs a new Price.** Supported maintenance updates remain allowed, including documented lookup-key, tax-behavior and currency-options updates subject to their constraints. The old line incorrectly limited all updates to metadata, nickname and active. Inspect the current update schema before changing a live object. [https://docs.stripe.com/api/prices/update]
- **You archive, you don't delete.** Set `active: false`. Existing subscriptions on an archived price stay active until canceled; payment links using it are deactivated. Delete only products with no prices and prices never used.
- **Amounts are in the lowest currency unit:** 10 USD = `1000`.
- **Create a Product and its default Price in one call** (Node):

```node
const product = await stripe.products.create({
  name: 'Basic Dashboard',
  default_price_data: {
    unit_amount: 1000,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  },
  expand: ['default_price'],
});
```

- **Lookup keys** decouple code from price IDs: set `lookup_key: 'standard_monthly'` on create, read with `stripe.prices.list({ lookup_keys: ['standard_monthly'] })`, move the key to a new price with `transfer_lookup_key: true`. Cache the result.
- **Multi-currency:** `currency` is the default; add `currency_options: { eur: { unit_amount: 9000 }, jpy: { unit_amount: 12000 } }`; expand `currency_options` to render, and cache the price instead of re-fetching it every time. Checkout picks the local currency from the IP when supported. All prices, coupons and shipping rates in one session must share the default currency or creation errors.
- **Inline prices** (`price_data`, API only) create temporary Price objects that don't appear in Dashboard lists and can't be updated or reused (they are effectively `active=false`). On a subscription: `items: [{ price_data: { unit_amount: 5000, currency: 'usd', product: '{{PRODUCT_ID}}', recurring: { interval: 'month' } } }]`.
- **Subscription constraints:** the price must be recurring; several prices on one subscription need the same interval unless the subscription uses flexible billing mode (mixed interval). The maximum price interval is 3 years.
- **Pricing models:** flat rate, per-seat, package, tiered (volume or graduated), customer chooses price (pay what you want, not for recurring), usage-based (fixed fee and overage, pay as you go, credit burndown). Package pricing rounds up by default: 25 USD per 5 units bills 8 units as 50 USD.
- **Tiered math:** with tiers 1-10 seats 15 USD, 11-20 seats 12 USD, 21+ 10 USD:

| Seats | Volume (all units at the reached tier) | Graduated (each tier at its own rate) |
|---|---|---|
| 18 | 18 × 12 = 216 USD | (10 × 15) + (8 × 12) = 246 USD |
| 25 | 250 USD | 150 + 120 + 50 = 320 USD |

- **Rounding happens per invoice line item:** `unit_amount_decimal = 0.05` × 30 = 1.5, billed as 2 cents.
- **Compatibility:** Payment Links don't allow tiered, decimal or usage-based prices. "Customer chooses price" works only with Checkout and Payment Links. Product images are JPEG, PNG or WEBP under 2MB.

## Design the integration

- **Decide three things:** the pricing model, the checkout interface, and when customers pay.
- **Checkout interfaces:** Stripe-hosted page, embedded payment page, custom payment form (Elements, Appearance API), pricing table (redirects to the hosted page), one-click buttons (Express Checkout Element: Link, Apple Pay, Google Pay, PayPal, Klarna, Amazon Pay), payment link, mobile app (prebuilt sheet or drop-in component). Payment links don't support usage-based billing. A React Native subscription guide exists at `build-subscriptions.md?payment-ui=mobile&platform=react-native`.
- **Billing models:** pay up front; free trial (collect a payment method, don't charge, invoice at trial end); freemium (no payment method, collect one before the trial ends).
- **Checkout Session essentials for subscriptions** [appeeky]: `mode: subscription`; `line_items` with price and quantity; `customer` or `customer_email` (reuse the existing customer to avoid duplicates); `success_url` and `cancel_url`; `allow_promotion_codes: true`; `subscription_data` metadata with `user_id` for webhook provisioning; `automatic_tax` enabled when using Stripe Tax. Validate price IDs server-side against a whitelist.

## Subscription lifecycle

- **Immediate payment** creates an Invoice and a PaymentIntent. The subscription starts `incomplete` and becomes `active` once the first invoice is paid. With a trial it starts `trialing` and becomes `active` when the trial ends and payment succeeds. `payment_behavior` overrides the default collection and failure handling.
- **`charge_automatically`:** the first invoice is `open` and "Your customer has 23 hours to pay." Unpaid after 23 hours, the subscription becomes `incomplete_expired` and the invoice `void`; create a new subscription to reactivate.
- **`send_invoice`:** the invoice is emailed with a due date; without a trial the subscription starts `active` even if the first invoice is unpaid.
- **Confirm payment** by listening for `invoice.paid` or checking that the status is `active`. `current_period_start` is set when the initial invoice is created; paying later doesn't shift it.
- **Checkout:** "you can't update the subscription or its invoice if the session's subscription is `incomplete`". Update after `checkout.session.completed`, or expire the session.
- **Payment outcomes:**

| Outcome | PaymentIntent | Invoice | Subscription |
|---|---|---|---|
| Success | `succeeded` | `paid` | `active` (if the governing invoices are settled) |
| Card error | `requires_payment_method` | `open` | `incomplete` |
| Needs authentication | `requires_action` | `open` | `incomplete` |

- **Delayed methods (ACH Direct Debit)** can take the subscription straight to `active`, bypassing `incomplete`. "If the payment fails later, Stripe voids the invoice but the subscription remains `active`." The PaymentIntent may be `processing` on an active subscription.
- **Initial card failure:** notify the customer, collect a new payment method, confirm the PaymentIntent, update `default_payment_method`. Stripe retries through Smart Retries or custom rules; read `invoice.payment_failed` and `next_payment_attempt`.
- **Recurring failure:** listen to `invoice.payment_failed`, watch for transitions to `past_due` or `unpaid`, notify the customer.
- **Requires action (3DS):** on `invoice.payment_action_required`, pass the PaymentIntent client secret to `stripe.handleNextAction`, then confirm `invoice.paid` and the active status or entitlements before provisioning.
- **Unpaid:** Stripe pauses collection, later invoices stay `draft`, and the status becomes `past_due` or `unpaid` per your failed-payment settings.
- **Canceled:** no new invoices, no automatic collection; only `metadata` and `cancellation_details` stay updatable. Resubscribing needs new payment details and a new subscription.

## Statuses

| Status | Meaning |
|---|---|
| `trialing` | In trial; "you can safely provision". |
| `active` | Current. Doesn't necessarily mean every invoice is paid. |
| `incomplete` | First payment pending: the 23-hour window, requires action, or PaymentIntent `processing`. |
| `incomplete_expired` | First payment never succeeded; no billing; kept for tracking. |
| `past_due` | The latest finalized invoice failed or wasn't attempted. "Doesn't guarantee another payment attempt." After all retries it becomes `canceled`, `unpaid`, or stays `past_due`, per settings. |
| `canceled` | Terminal. Unpaid invoices get `auto_advance=false`. |
| `unpaid` | Only if your settings choose it: invoices are generated but no payment is attempted. "Revoke access to your product when the subscription is `unpaid`." |
| `paused` | A trial ended without a default payment method and `trial_settings.end_behavior.missing_payment_method` is `pause`. No invoices; resume after attaching a payment method. |

- **Two [appeeky] meanings differ from Stripe's.** The [appeeky] audit skill defines `paused` as "collection paused" and `unpaid` as "retries exhausted". Stripe's docs say pausing payment collection does not change the status (it stays `active`), `paused` comes from a trial ending without a payment method, and `unpaid` happens only when your retry settings choose it. Follow Stripe's definitions.
- **Status resolution setting:** "Most recent invoice" (default) or "All invoices". Stripe checks applicable invoices from the previous 37 months; uncollectible invoices block only with reason `max_payment_attempts` or `payment_not_received` (not `user_forgiven`). Changing the setting doesn't immediately reevaluate existing subscriptions.

## Provision and revoke access

- **On `active`, Stripe creates active entitlements** for each feature of the product; or track active subscriptions through webhooks (handlers in [WEBHOOKS.md](WEBHOOKS.md)).
- **Extend access only after checking the status.** Store an access-expiration timestamp per customer; on `invoice.paid`, retrieve the subscription and confirm its status is `active` before extending. A paid invoice doesn't necessarily make the subscription `active` when status resolution uses all invoices.
- **Revoke on `canceled` or `unpaid`.** Notify on `past_due`. On `customer.subscription.trial_will_end`, verify a payment method exists.
- **Pausing collection is not a status change.** Use the subscription status as the trigger for starting or stopping service.

## Customer portal

- **Steps:** configure in the Dashboard, redirect, listen to webhooks, launch. With Connect, configure the portal for the platform, not a connected account. Live mode and each sandbox need their own configuration.
- **Configurations:** the Dashboard manages only the default; create more with `stripe.billingPortal.configurations.create({ features: { invoice_history: { enabled: true } } })` and pass `configuration: '{{CONFIGURATION_ID}}'` on the session (Connect: `on_behalf_of`). A shareable link per configuration via `login_page`; deep links available.
- **Plan switching needs a product catalog;** price amount, currency and interval are fixed. Max 10 products. Two Prices with the same `product` and `recurring.interval` aren't allowed (make a separate product, such as a student version). Tax ID collection is a toggle (Stripe Tax).
- **Authenticate first, then create the session.** "Make sure to authenticate customers on your site before creating sessions for them." Use a POST form: `<form method="POST" action="/create-customer-portal-session"><button type="submit">Manage billing</button></form>`, then `stripe.billingPortal.sessions.create({ customer: '{{CUSTOMER_ID}}', return_url: 'https://example.com/account' })` (or `customer_account`) and redirect to the short-lived `url`. `return_url` is required unless a default is set.
- **Sessions expire:** "New portal sessions expire after a 5 minute period. If a customer uses it within that time period, the session expires within 1 hour of the most recent activity." "You can't display the customer portal inside an iframe."
- **Features:** billing info and tax IDs, payment methods, subscriptions, cancel immediately or at period end, invoice history, cancellation deflection with a coupon and reasons, localization, branding. Works with Checkout, pricing table, Payment Links, Managed Payments, Connect, Invoices, Billing and Tax.
- **Limits:** the portal can cancel but not update subscriptions with multiple products, usage-based billing, trial offers, `send_invoice`, or unsupported payment methods; it can't update or cancel a subscription with a scheduled schedule update. Immediate changes use the Subscriptions API; end-of-period changes use Subscription Schedules.
- **Trials end on change:** modifying a `trialing` subscription ends the trial and invoices immediately unless `features.subscription_update.trial_update_behavior` is `continue_trial`.
- **Payment methods:** `card` (including Apple Pay and Google Pay), `link`, `us_bank_account` (customers can't manually enter a new bank account), `sepa_debit`, `paypal` (requires approval), `klarna`, `affirm` and others.
- **Webhooks to handle:** `customer.subscription.updated` (plan via `subscription.items.data[0].price`, quantity via `items.data[0].quantity`), `customer.subscription.deleted` (revoke), `payment_method.attached` and `.detached`, `customer.updated` (check `invoice_settings.default_payment_method`), `v2.core.account[configuration.customer].updated`, `customer.tax_id.created|deleted|updated`, `billing_portal.configuration.created|updated`, `billing_portal.session.created`. Detect cancel-at-period-end: flexible billing mode, `cancel_at` not `null`; classic, `cancel_at_period_end` `true`; reactivation reverses it. "Don't use the customer billing email address as a login credential."
- **Audit the configuration** [appeeky]: read `GetBillingPortalConfigurations` and verify `payment_method_update`, `invoice_history`, `subscription_cancel` (with retention offers if available) and `subscription_update` with its proration behavior; search the code for `billingPortal.sessions.create`. Without payment method update, `past_due` recovery suffers.

- **The portal's cancel page** (https://docs.stripe.com/customer-management/cancellation-page): cancel in the portal "is enabled by default". Reasons you can enable: "It's too expensive", "I need more features", "I found an alternative", "I no longer need it", "Customer service was less than expected", "Ease of use was less than expected", "Quality was less than expected", "Other reason" (free text). They show on the subscription page, in Sigma, and in "The `subscription.updated` webhook". The coupon is set at Settings > customer portal > Cancellations > "Retention Coupon". Period-end cancellation behaves differently by billing mode ([BILLING.md](#customer-portal)). Matching offers to reasons and the discount limits are in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#match-the-offer-to-the-reason).

## Smart Retries and dunning

- **Revenue recovery needs no code:** recovery analytics, Smart Retries, email notifications, no-code Automations (such as custom dunning for annual subscribers) and automatic card updates.
- **Automatic card updates:** Stripe "automatically attempts to update saved card details whenever a customer receives a new card"; it is "widely supported in the United States... International support varies from country to country. It isn't possible to identify cards that support automatic updates." Listen for `payment_method.automatically_updated`, which "notifies you of automatic card updates from the network" with the new expiry and last4; "If the card update includes a new card number, the fingerprint changes." (https://docs.stripe.com/payments/cards/overview)
- **Turn on Smart Retries** (Dashboard: Billing > Revenue recovery > Retries). "Stripe recommends using Smart Retries." It uses AI timing signals over a window of 1 week, 2 weeks, 3 weeks, 1 month or 2 months; "The recommended default setting is 8 tries within 2 weeks." A custom schedule allows up to three retries, each N days after the previous.
- **What the churn-prevention source said:** enable Smart Retries in "Dashboard → Billing → Settings", with "4-8 retry attempts over 3-4 weeks" and a manual schedule of five retries (days 1, 3, 5, 7, 10). Those are not Stripe's settings; use the official form above. Its "Recovers ~15% more" has no figure in Stripe's docs and is not adopted. [coreyhaines31/marketingskills, churn-prevention; https://docs.stripe.com/billing/revenue-recovery/smart-retries]
- **No retries when:** the customer has no payment methods, a hard decline, an India-issued card, or a disconnected Connect account.
- **Hard decline codes** (no automatic retry without a new payment method): `incorrect_number`, `lost_card`, `pickup_card`, `stolen_card`, `revocation_of_authorization`, `revocation_of_all_authorizations`, `authentication_required`, `highest_risk_level`, `transaction_not_allowed`.
- **Hard-declined retries stay on the schedule:** they "continue to be scheduled, and `attempt_count` continues to increment, but retries only execute after detecting a new payment method. Unexecuted retries don't create a new Charge." (https://docs.stripe.com/billing/revenue-recovery/smart-retries) `expired_card` is not on the hard list; a third-party playbook that marks it hard ([churn-prevention DUNNING-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md#retries)) is wrong for Stripe.
- **Retry order of payment methods:** `subscription.default_payment_method`, then `subscription.default_source`, then the customer's `invoice_settings.default_payment_method` (or the Account's `configuration.customer.billing.default_payment_method`), then legacy `customer.default_source`. "When you update payment methods after a failed payment attempt, update the field where the previous payment failed."
- **Track attempts:** `invoice.payment_failed` carries `attempt_count`; the invoice's `next_payment_attempt` says when the next one is (with Automations it is set in `invoice.updated`, not `invoice.payment_failed`).
- **After the last retry:** cancel, mark `unpaid` (draft invoices continue), leave `past_due`, or pause (if eligible). "Changing your subscription settings only affects future retries." Pausing doesn't have to wait for the last retry: "You can pause eligible subscriptions after the first renewal payment failure or after retries are exhausted." (https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- **Local payment method retries are off by default:**

| Method | Retries / days |
|---|---|
| ACH Direct Debit | 2 / 40 |
| Canadian PAD | 1 / 30 |
| AU BECS | 4 / 30 |
| Bacs | 2 / 30 |
| NZ BECS | 1 / 30 |
| SEPA | 2 / 30 (insufficient funds only) |

- **Customer emails:** at minimum, payment confirmation and failed payment. Others: unpaid recurring invoice reminders for `send_invoice`; trial ending reminder 7 days before; renewal reminders only for `charge_automatically` (timing from "Upcoming renewal events"); 3DS and Boleto confirmation emails and reminders; expiring card email 1 month before expiry. Links go to a Stripe-hosted page or portal, or your own page.
- **Hosted links stop working** 30 days after a trial ending email, when the status is `cancelled`, `incomplete_expired` or `unpaid`, after a trial ended with a payment method provided, or when the renewal period expired.
- **Sandbox emails:** "In sandbox, Stripe doesn't automatically send customer emails" except to verified email domain addresses or active team members. Email logs cover the last 60 days.
- **Dunning checklist** [appeeky]: Smart Retries on; customer emails for failed payment and expiring card on (Settings > Billing > Customer emails, verify toggles are ON for production); portal payment method update enabled; `invoice.payment_failed` handled in the app with a custom email that links to the portal.
- **Email sequence** [appeeky]: Day 0 failure, Stripe retries; Day 3 custom email with portal link; Day 7 final notice.
- **Dunning copy, grace-period access and expiring-card reminders** [coreyhaines31/marketingskills, churn-prevention]: four emails on days 0, 3, 7 and 10 with templates, read-only or full access during grace, and card-expiry emails at 30, 15 and 7 days (Stripe's own expiring-card email goes once, 1 month before; the others are yours to send) are in [churn-prevention DUNNING-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md).
- **Decline reasons and fixes** [appeeky]: `insufficient_funds`, debit balance and dunning email; `card_declined`, generic, retry and update the payment method; `expired_card`, expiring card email; `authentication_required`, enable 3DS on setup; Radar block, review Radar rules.

## Audits over the Stripe MCP

All [appeeky]. Follow the shared [Stripe MCP read contract](AGENT-TOOLS.md#the-stripe-mcp) for actual host tools, account scope, endpoint pagination, currency units and read-only audits.

- **Active subscriptions:** `stripe_api_read GetSubscriptions { status: "active", limit: 100 }`. Apply the [subscriber-count definitions](REVENUE-METRICS.md#subscription-counts-and-risk); `items.data.length` gives line items per sub. Flag when `past_due` exceeds 5% of active.
- **Past due:** `GetSubscriptions` with `status: past_due` and `status: unpaid`, expanding `default_payment_method` and `latest_invoice`; record `latest_invoice.attempt_count`, `amount_due`, `status`, card brand, last4, `funding`, country and wallet type; sum the MRR at risk.
- **Payment failures:** failed charges via `search_stripe_resources` `charges:status:"failed"`; `GetPaymentIntents` with status `requires_payment_method`; `GetInvoices` `status: open` with `subscription` set. Group by `outcome.reason` or decline code, `card.funding`, `card.country`, wallet vs direct card.
- **Code search:** `payment_failed`, `payment-failed`, `invoice.payment_failed`, `sendPaymentFailed`, Resend, SendGrid, Postmark.

## Prove it

- **Catalog:** every pricing-page row is its own Product; no Product holds prices for two tiers; no code path updates `unit_amount`.
- **Access:** a paid `invoice.paid` with status resolution "All invoices" doesn't extend access until the subscription reads `active`; `canceled` and `unpaid` revoke access.
- **Portal:** the session is created only for a signed-in user, opens outside an iframe, and a cancel at period end shows `cancel_at` (flexible) or `cancel_at_period_end: true` (classic).
- **Recovery:** Smart Retries is on, failed payment and expiring card emails are on in live mode, and `invoice.payment_failed` reaches your handler.
