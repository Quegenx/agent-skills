# Subscription changes: trials, upgrades, prorations, cancel and pause

Everything that alters a running subscription: trials and their end, price and quantity changes, how prorations are computed, moving the billing cycle anchor, applying changes only when payment succeeds, canceling and pausing. The mechanism that decides most outcomes: by default Stripe applies a change even if its payment fails, prorates to the second, and adds rather than replaces a price unless you name the subscription item, so every update names the item, resends the quantity and sets `proration_behavior` on purpose. Catalog, lifecycle, statuses, the portal and dunning are in [BILLING.md](BILLING.md); subscription events in [WEBHOOKS.md](WEBHOOKS.md); test clocks in [TESTING-AND-CLI.md](TESTING-AND-CLI.md). Bullets marked [appeeky] come from a third-party skill set, not from Stripe.

**Contents:** [Trials](#trials) · [Upgrades and downgrades](#upgrades-and-downgrades) · [Prorations](#prorations) · [Billing cycle anchor](#billing-cycle-anchor) · [Pending updates](#pending-updates) · [Canceling](#canceling) · [Pausing](#pausing) · [Prove it](#prove-it)

## Trials

### Trial offers (recommended for new integrations)

- **The Trial Offer API manages free and paid introductory periods** ("1 USD for the first week"): discounted trials, free trials (0 USD item), upgrade trials, item-level trials.
- **Requires API version `2026-09-30.endive` or later and `billing_mode` `flexible`.**
- **You need two recurring Prices:** "one for the trial period and one for the post-trial period." The post-trial price must differ from any price already on the subscription.
- **Create the offer, then the subscription** (Node):

```node
const trialOffer = await stripe.productCatalog.trialOffers.create({
  price: 'price_trial',
  duration: {
    relative: {
      iterations: 1,
    },
    type: 'relative',
  },
  end_behavior: {
    transition: {
      price: 'price_regular',
    },
  },
});

const subscription = await stripe.subscriptions.create({
  customer: '{{CUSTOMER_ID}}',
  billing_mode: {
    type: 'flexible',
  },
  items: [
    {
      current_trial: {
        trial_offer: 'to_123',
      },
      quantity: 1,
    },
  ],
});
```

- **Not supported by:** Checkout Sessions (outside private preview), pricing tables, Payment Links, Elements with Checkout Sessions. Can't combine with legacy `trial_end`. Subscription schedules: public preview, API only, and only with `duration.type: 'timestamp'` (itself public preview) via `phases.items.trial_offer`. The portal can only view, cancel and reactivate subscriptions with trial offers.
- **Limits:** recurring items only; trial length can't change after creation; the offer is removed after the trial ends; trial items don't count toward MRR. Archive an offer with `active: false`. For opt-in renewals, cancel at the end of a paid trial with `cancel_at`.
- **Status:** the subscription is `trialing` only if every item is a 0 USD trial offer; paid trials follow the normal PaymentIntent lifecycle (`active`, `incomplete`, `past_due`). `customer.subscription.updated` fires when an offer moves to its post-trial price.
- **`trial_settings.end_behavior.billing_cycle_anchor`:** `now` (default; resets the anchor at trial end, full invoice, no proration) or `unchanged` (prorates to the original anchor). A trial item's cycle anchors at `trial_start`: a two-month trial from Feb 28 ends April 28.
- **`trial_settings.end_behavior.missing_payment_method`:** `create_invoice` (default; unpaid goes `past_due`), `cancel`, or `pause`. Prebilling overrides it.

### Free trial periods (legacy `trial_end` and `trial_period_days`)

- **Marked legacy;** new integrations use trial offers. Free trial periods still work with classic or flexible billing mode and with Checkout Sessions, pricing tables, Payment Links and Elements with Checkout Sessions, which trial offers don't (except the Checkout private preview). Both support `missing_payment_method`, both send `trial_will_end`, and neither counts toward MRR during the trial.
- **Length:** `trial_end` (timestamp) or `trial_period_days`; "The trial period must be 730 days (2 years) or less." Most businesses use shorter trials such as 30 days; long trials risk expired payment methods and lower conversion.
- **No payment method is needed at creation;** Stripe creates a 0-amount invoice with "Free trial" line descriptions. At trial end (if not `paused`) Stripe creates an invoice, sends `invoice.created`, and "Approximately 1 hour later, we attempt to charge that invoice."
- **End early:** `stripe.subscriptions.update(id, { trial_end: 'now' })`.
- **Usage during a trial isn't billed.** Paused subscriptions accept meter events but don't invoice them. `add_invoice_items` with a trial invoices the one-time fee immediately. `trial_start` reflects the most recent trial for `billing_mode=flexible` (API 2025-04-30+). Trial plus `billing_cycle_anchor` gives a free period, then a prorated period, then the fixed cycle.
- **Trial without a payment method (API):** `trial_period_days: 30, payment_settings: { save_default_payment_method: 'on_subscription' }, trial_settings: { end_behavior: { missing_payment_method: 'cancel' | 'pause' } }`, then listen to `customer.subscription.deleted` (cancel) or `customer.subscription.paused` (pause).
- **Trial without a payment method (Checkout):** Checkout collects one by default; `payment_method_collection: 'if_required'` makes it optional. Checkout params are `subscription_data.trial_period_days` or `subscription_data.trial_end`.

```node
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [
    {
      price: 'price_abc',
      quantity: 1,
    },
  ],
  subscription_data: {
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
    trial_period_days: 30,
  },
  payment_method_collection: 'if_required',
  success_url: 'https://example.com/success',
});
```

- **Block trial abuse.** Free trials without a payment method "can also allow spammers to create lots of fake customers"; require a user account and a captcha before the trial starts.
- **Collect a payment method before the trial ends:** on `customer.subscription.trial_will_end`, if there is no `default_payment_method`, email a link to your site, create a portal session and redirect. A paused-trial subscription can be reactivated in the portal ("Start subscription").
- **Resuming a paused subscription:** updates while paused don't create prorations; resume before adding a new trial; Stripe checks `default_source` and `default_payment_method` on the subscription and the customer. Resuming with `billing_cycle_anchor` `unchanged` creates a debit proration (unless `proration_behavior=none`). The resume invoice "becomes automatically void after 23 hours if the associated payment intent doesn't have a payment method attached and isn't confirmed." Preview with `subscription_details.resume_at`.

### Trial events, reminders and compliance

- **`trial_will_end` timing: sources differ.** The subscription webhooks page says it's "Sent 3 days before the trial period ends" (immediately if the trial is shorter); the trials page says it follows the Dashboard **Trial ending events** setting, which defaults to 3 days. Confirm in the current docs.
- **Stripe-hosted reminder emails go out 7 days before the trial ends;** if the trial is shorter than 7 days, as soon as it begins. During a trial the trial reminder replaces the renewal reminder; receipts and the reminder show a cancellation URL. "We don't send free trial reminder emails in a sandbox."
- **Card network rules apply to trials and promotions.** "Statement descriptors have a 22 character limit, so anything after the 10th character is overwritten with `* TRIAL OVER`." Without Stripe's trial features, listen to `invoice.upcoming` for notices and to `customer.subscription.updated` to set the latest invoice's statement descriptor "within an hour of its creation while it's still in `draft` status."

## Upgrades and downgrades

- **Find the IDs:** `stripe.subscriptions.list({ customer })` gives `id`, `items.data.id` and `items.data.price.id`.
- **Replace the item, don't add a price:** `stripe.subscriptions.update(subId, { items: [{ id: '{{SUB_ITEM_ID}}', price: '{{NEW_PRICE_ID}}' }] })`. "You must specify the subscription item to replace the current price with the new price. Failing to do so results in *adding* the new price so both prices are active". Alternatives: `{ id, deleted: true }` plus `{ price }`, or `stripe.subscriptionItems.update(itemId, { price })`.
- **Send the quantity again.** "Updating a subscription price automatically reverts the quantity to the default value of `1`."
- **Billing dates:** the same interval keeps them; a different interval bills at the new interval from the day of the change (monthly to yearly moves the date); adding a trial moves the date to the trial end. To change at period end, use a subscription schedule.
- **Zero to paid:** a zero-amount price changed to a non-zero price generates an invoice and resets the billing period; zero quantity to non-zero doesn't.
- **Failed immediate payment doesn't roll back.** Stripe attempts payment immediately when the billing cycle anchor resets. "When billing is performed immediately, but the required payment fails, the subscription change request succeeds and the subscription transitions to `past_due`." Combine `proration_behavior: 'always_invoice'` with pending updates so the change applies only if payment succeeds.
- **Usage:** with Billing Meters, `clear_usage` has no effect; with legacy usage records, usage transfers and `clear_usage: true` clears it.
- **Audit plan changes** [appeeky]: check whether the code uses `subscriptions.update` or a new checkout; sample recent `customer.subscription.updated` events and compare `items` price changes; check `proration_behavior` and invoice line items for `proration`. Set `proration_behavior` intentionally on every update.

## Prorations

- **How it adds up:** upgrading 10 USD to 20 USD halfway through gives a -5 USD credit and a 10 USD debit, +5 USD net. "Negative prorations aren't automatically refunded and positive prorations aren't immediately billed".
- **`proration_behavior`:** `create_prorations` (default; items invoiced immediately only under certain conditions), `always_invoice` (invoice now), `none` (per request only: "No parameter turns off all future prorations for a subscription"). With `cancel_at` outside the current period you can't disable proration.
- **What triggers proration:** changing items, price or quantity; adding `trial_end` or `trial_from_plan`; changing `billing_cycle_anchor`; setting `cancel_at` mid-period. **What doesn't:** `automatic_tax`, `default_payment_method`, `payment_behavior`, `collection_method`, `days_until_due`, `retry_settings`, `trial_settings`, `pause_collection`, `proration_date`, metadata, `cancellation_details`, `discounts`, `billing_thresholds`, `cancel_at_period_end`, `add_invoice_items`.
- **Identify proration lines:** `proration` on invoice items; `parent.subscription_item_details.proration` on invoice line items. Classification follows the operation: a subscription created with an anchor exactly one month out is still a proration debit; starting or ending a trial isn't a proration.
- **Granularity:** "By default, Stripe calculates prorations down to the second"; change it with proration customizations or custom proration scripts.
- **Discounts:** prorations use the discounted price and proration lines are `discountable=false`. Changing coupons or discounts alone creates no prorations.
- **Usage-based billing isn't prorated.** Manual prorations: `add_invoice_items` with a negative `unit_amount`.
- **Unpaid invoices:** prorations assume earlier invoices get paid. To avoid crediting unpaid time, set `proration_behavior: 'none'` and either create a one-off invoice or reset `billing_cycle_anchor: 'now'`; void the unpaid invoice to avoid double payment.
- **Billing mode changes the credit:** `classic` credits from the current price (example total `-334`); `flexible` credits from the last price billed (example total `0`). `proration_details.credited_items` (`type` `invoice_item` or `invoice_line_items`) links credits to debits. A coupon spread across items: classic -2.50 USD, flexible -4.17 USD.
- **Preview, then update with the same `proration_date`** (Node). "Because Stripe prorates to the second, prorated amounts might change between the time they're previewed and the time the update is made."

```javascript
// Set proration date to this moment:
const proration_date = Math.floor(Date.now() / 1000);

const subscription = await stripe.subscriptions.retrieve('sub_49ty4767H20z6a');

// See what the next invoice would look like with a price switch
// and proration set:
const items = [{
  id: subscription.items.data[0].id,
  price: 'price_CBb6IXqvTLXp3f', // Switch to new price
}];

const invoice = await stripe.invoices.createPreview({
  customer: 'cus_4fdAW5ftNQow1a',
  subscription: 'sub_49ty4767H20z6a',
  subscription_details: {
    items: items,
    proration_date: proration_date
  },
});
```

## Billing cycle anchor

- **Defaults** to the creation date or the trial end, in UNIX seconds, UTC. A Jan 31 anchor bills Feb 28/29, Mar 31, Apr 30.
- **Prefer `billing_cycle_anchor_config`** (`day_of_month`, `month`, `hour`, `minute`, `second`) for monthly and yearly cycles: it "automatically factors in short months and leap years"; `day_of_month: 31` means end of month. It doesn't support backdated starts. Use a `billing_cycle_anchor` timestamp for daily or weekly cycles.
- **A future anchor creates a prorated first invoice** from creation to the first full invoice date; avoid it with `proration_behavior: 'none'` or a trial ending at the anchor.
- **Checkout:** `subscription_data: { billing_cycle_anchor: 1611008505 }` (subscription mode only). Checkout doesn't support a trial plus an anchor, and one-time prices aren't allowed with `proration_behavior: 'none'`.
- **Reset:** `billing_cycle_anchor=now` with `proration_behavior=create_prorations`. "Disabling proration might result in overcharging your customer." In flexible mode, resetting to `now` doesn't invoice unless `proration_behavior=always_invoice` (or item changes leave non-cancelling prorations); with `billing_mode[type]=flexible` the anchor stays unchanged in the trial-based change scenarios. Change the anchor through a trial with `trial_end` plus `proration_behavior: 'none'`.

## Pending updates

- **By default updates apply even if payment fails.** "If payment fails, rolling back the updates is a manual process."
- **Use `payment_behavior: 'pending_if_incomplete'`** (with `proration_behavior: 'always_invoice'`) on subscription updates and subscription item creates or updates. Requires `collection_method=charge_automatically` and a supported payment method (cards, Link, Apple Pay, Google Pay, PayPal, Klarna and others).
- **On failure** the subscription gets a `pending_update` hash: attach a new payment method and pay the invoice, or run the requires-action flow. Cancel the pending update by voiding the latest invoice.
- **Supported attributes:** `expand`, `payment_behavior`, `proration_behavior`, `proration_date`, `billing_cycle_anchor`, `items` (`price`, `quantity`, `discounts`), `trial_end`, `trial_from_plan`, `metadata`, `discounts`, `cancel_at_period_end`, `coupon`, `promotion_code`, `add_invoice_items`.
- **Expiry:** the earliest of trial end or earliest item period end if within 23 hours, otherwise 23 hours after the request. Also voided by thresholds, schedule phase transitions, and later updates with `billing_cycle_anchor`, nonempty `items`, `trial_end`, `trial_from_plan=true`, or conflicting discounts or cancellation.
- **Events:** `customer.subscription.updated`, `customer.subscription.pending_update_applied`, `customer.subscription.pending_update_expired`.

## Canceling

- **Immediately:** `stripe.subscriptions.cancel(id)`; afterwards only `metadata` and `cancellation_details` are updatable. A custom cancellation date can't come with a refund. Options `prorate` and `invoice_now`; without prorating, "all metered usage gets discarded". To refund credit, issue refunds and reset the customer balance to zero.
- **At period end:** `cancel_at_period_end: true`; reactivate with `false` before the period ends. "You can't reactivate a canceled subscription."
- **At a date:** `cancel_at` shortens `items.current_period_end` and creates prorations; `billing_mode` helpers `min_period_end` and `max_period_end`. Example: 120 USD/year from Jan 1 2024 canceled July 1 gives a 60 USD final subtotal; moving to Oct 1 adds 30 USD; moving to Apr 1 credits -30 USD. Anchor reset behavior is guaranteed only for subscriptions created after June 2024.
- **After N periods:** a subscription schedule with `end_behavior: 'cancel'`.
- **Automatic:** "Subscriptions cancel automatically after up to eight unsuccessful attempts to bill the customer" (configurable).
- **Leftovers:** pending invoice items may still bill, delete them manually; use `clear_usage` to avoid a final usage charge. On cancel, open and draft invoices get `auto_advance=false`.
- **Disputes:** a Dashboard option cancels immediately or at period end after a full-amount card dispute (takes effect after about 1 hour; not compatible with test clocks).
- **Events:** `customer.subscription.updated` (including `cancel_at_period_end` set) and `customer.subscription.deleted` (canceled, including reaching period end).

## Pausing

- **Pause payment collection (grace period):** the subscription stays `active`, invoices keep generating, Stripe doesn't collect, the customer keeps access. To pause access and invoices too, use "Pause subscriptions" (`billing/subscriptions/pause.md`). Invoices created before pausing keep retrying unless voided.
- **`pause_collection[behavior]`:** `keep_as_draft` (drafts with `auto_advance=false`), `mark_uncollectible` (the customer balance still applies first), or `void`. Optional `pause_collection[resumes_at]`. These invoices send no upcoming-invoice emails or webhooks.
- **Resume:** `stripe.subscriptions.update('sub_...', { pause_collection: '' })`, then for drafts `stripe.invoices.list({ subscription, status: 'draft' })` and `stripe.invoices.update(id, { auto_advance: true })`.
- **Schedule phase transitions don't remove** a `pause_collection` set on the subscription.
- **`customer.subscription.paused` and `.resumed` are about status `paused`,** not about pausing collection.
- **Pause as a save offer:** the product policy is in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#save-offers). Removing access means "Pause subscriptions", not pausing collection. [coreyhaines31/marketingskills, churn-prevention]

## Prove it

- **Plan change:** a test upgrade passes the subscription item `id`, keeps the quantity, and the next invoice preview with the same `proration_date` matches the update; the subscription ends with one price, not two.
- **Trial without card:** a Checkout trial with `payment_method_collection: 'if_required'` and `missing_payment_method: 'cancel'` ends in `customer.subscription.deleted` on a test clock (see [TESTING-AND-CLI.md](TESTING-AND-CLI.md)).
- **Failed payment on change:** with `payment_behavior: 'pending_if_incomplete'` and `proration_behavior: 'always_invoice'`, a declining test card leaves a `pending_update` hash and the old price in place.
