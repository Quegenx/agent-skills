# Dunning: involuntary churn

Recovering failed payments on the web: the dunning stack, preventing failures, retry strategy, the four dunning emails with their copy, grace periods and access, in-app banners, and what to measure. From [coreyhaines31/marketingskills, churn-prevention] `SKILL.md` and `references/dunning-playbook.md` (MIT, Copyright (c) 2025 Corey Haines); the email and in-app templates are the source's. Stripe's mechanics (Smart Retries, hard declines, retry order, customer emails, what happens after the last retry) are defined in [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning); where the source's Stripe details differ from Stripe's docs, this file says so and follows Stripe. App Store and Play billing retry, grace periods and account hold are in [revenuecat BILLING-AND-RECOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/BILLING-AND-RECOVERY.md#billing-issues-and-grace-periods) and [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#subscription-lifecycle).

**Contents:** [The stack](#the-stack) · [Prevent failures](#prevent-failures) · [Retries](#retries) · [The four emails](#the-four-emails) · [Grace period and access](#grace-period-and-access) · [In-app dunning](#in-app-dunning) · [Webhooks](#webhooks) · [Measure it](#measure-it) · [Prove it](#prove-it)

## The stack

[coreyhaines31/marketingskills, churn-prevention]

```
Pre-dunning → Smart retry → Dunning emails → Grace period → Hard cancel
```

The source's timeline: day -30 to -7 pre-dunning; day 0 payment fails, retry and email 1; days 1 to 3 retry and email 2; day 7 email 3; days 7 to 10 final retry and email 4; days 10 to 14 grace ends and the account is paused or cancelled; day 14+ win-back. The source's share-of-churn and recovery figures ("30-50% of all churn", "$129 billion annually", recovery benchmark tables) carry no source and are left out.

## Prevent failures

[coreyhaines31/marketingskills, churn-prevention]

- **Card expiry emails:** the source sends them 30, 15 and 7 days before expiry, plus an in-app banner at 3 days ("Payment method expiring soon"). Stripe's own expiring-card email goes once, "1 month before expiry" ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning)); the 15- and 7-day ones are yours to send. The source's template:

```
Subject: Your card ending in 4242 expires soon

Hi [Name],

The card on file for your [Product] subscription expires on [date].

Update your payment method now to avoid any interruption:

[Update Payment Method →]

This takes less than 30 seconds.

- [Product] Team
```

- **Card updaters.** The networks' programs (Visa Account Updater, Mastercard Automatic Billing Updater, Amex Cardrefresher) refresh stored numbers and expiry dates. Stripe: it "automatically attempts to update saved card details whenever a customer receives a new card"; this is "widely supported in the United States... International support varies from country to country. It isn't possible to identify cards that support automatic updates" ([Stripe, cards overview](https://docs.stripe.com/payments/cards/overview)). The source's "Reduces hard declines... by 30-50%" is not in Stripe's docs.
- **Backup payment method:** at signup (low conversion), after the first successful payment (better), or "After a failed payment is recovered... (best timing - they felt the pain)". Stripe retries the default payment method fields in a fixed order, so a backup only helps once it is set where Stripe looks ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning)).
- **Pre-billing notice** for annual or high-value plans: 7 days before renewal, the amount, the date, a link to update the card, what the renewal includes. The source says this is "Required by some regulations for auto-renewals" without naming one; ROSCA has no renewal-notice duty and state laws were not checked ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)).

## Retries

- **By decline type** [coreyhaines31/marketingskills, churn-prevention]: soft declines (insufficient funds, processor timeout) are retried; hard declines (card stolen, account closed) need a new card; authentication-required sends the customer to authenticate.
- **On Stripe, use Smart Retries** with the [canonical Dashboard, window and attempt settings](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning), not the source's settings. Its old Dashboard path and attempt/window claims are recorded there.
- **Custom schedules depend on the provider.** The source's manual schedule has five retries (days 1, 3, 5, 7, 10), and also says "Retry 3-5 times over 7-10 days". Use five only on a provider that allows it; Stripe's limit is in [the retry settings](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning).
- **Retry timing tips** in the source (same day of month as the last success, after the 1st and 15th, not on weekends, 8 to 10am) are the author's; the source credits the first to Stripe Smart Retries, but it is not among the signals Stripe documents.
- **Use [Stripe's hard-decline list](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning),** including its `expired_card` correction and the distinction between scheduled and executed retries. The source classified `expired_card` as Hard.

## The four emails

[coreyhaines31/marketingskills, churn-prevention] Rules: a direct link to the payment update page ("no login required if possible"); show what they'll lose; "Don't blame ('your payment failed' not 'you failed to pay')"; include a support contact. The source's "Plain text performs better" is its opinion. Stripe can send the failed-payment email and host the update page itself ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning)); the content a payment-failed email must carry is in [email-practices EMAIL-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/EMAIL-TYPES.md#what-each-transactional-email-contains).

### Lifecycle-email schedule variant

[coreyhaines31/marketingskills, emails] The emails source uses the following 3 to 4-email schedule; its final notice at day 10 to 14 differs from the day-10 copy below. Choose the schedule before using either template.

- **Failed payment recovery,** 3-4 emails over 7-14 days:

| Day | Email |
|---|---|
| 0 | Friendly notice, update payment link |
| 3 | Reminder, service may be interrupted |
| 7 | Urgent, account will be suspended |
| 10-14 | Final notice, what they'll lose |

  "Assume it's an accident (card expired, etc.)"; clear, direct, no guilt; one CTA to update payment; explain what happens if it isn't resolved. Key metrics: recovery rate, time to recovery.

**Email 1, day 0 (friendly, matter-of-fact):**

```
Subject: Action needed - your payment didn't go through

Hi [Name],

We tried to charge your [card type] ending in [last 4] for your
[Product] subscription ($[amount]), but it didn't go through.

This happens sometimes - usually a quick card update fixes it.

[Update Payment Method →]

Your access isn't affected yet. We'll retry automatically, but
updating your card is the fastest fix.

Need help? Just reply to this email.

- [Product] Team
```

**Email 2, day 3 (helpful, slightly more urgent):**

```
Subject: Quick reminder - update your payment for [Product]

Hi [Name],

Just a heads-up - we still haven't been able to process your
$[amount] payment for [Product].

[Update Payment Method →]

Takes less than 30 seconds. Your [data/projects/team access]
is safe, but we'll need a valid payment method to keep your
account active.

Questions? Reply here and we'll help.

- [Product] Team
```

**Email 3, day 7 (direct, clear consequences):**

```
Subject: Your [Product] account will be paused in 3 days

Hi [Name],

We've tried to process your payment several times, but your
[card type] ending in [last 4] keeps getting declined.

If we don't receive payment by [date], your account will be
paused and you'll lose access to:

• [Key feature/data they use]
• [Their projects/workspace]
• [Team access for X members]

[Update Payment Method Now →]

Your data won't be deleted - you can reactivate anytime by
updating your payment method.

- [Product] Team
```

**Email 4, day 10 (final, clear, no guilt):**

```
Subject: Last chance to keep your [Product] account active

Hi [Name],

This is our last reminder. Your payment of $[amount] is past
due, and your account will be paused tomorrow ([date]).

[Update Payment Method →]

After pausing:
• Your data is saved for [90 days]
• You can reactivate anytime
• Just update your card to restore access

If you intended to cancel, no action needed - your account
will be paused automatically.

- [Product] Team
```

Match each date in the copy to your real retry and grace schedule; the deadline in email 3 and 4 is a real one.

**The source's timing examples conflict.** Email 3 is labelled day 7 and says "paused in 3 days", which points to day 10; email 4 is labelled day 10 and says "paused tomorrow", which points to day 11. The stack's day-10-to-14 pause and the later recommendation of 7 to 14 days of grace after the final retry are also separate source illustrations, not one configured schedule. Select one actual pause date and align every template and the product's grace policy before using them. The original templates above are retained for comparison. [coreyhaines31/marketingskills, churn-prevention]

## Grace period and access

[coreyhaines31/marketingskills, churn-prevention]

| Setting | The source's recommendation |
|---|---|
| Duration | 7-14 days after final retry |
| Access | Degraded (read-only) or full access |
| Visibility | In-app banner: "Payment past due - update to continue" |
| Retry | Continue background retries during grace |
| Communication | Dunning emails continue |

- **Option A, full access** (the source recommends it for B2B): lower friction, higher recovery; some customers exploit it.
- **Option B, read-only** (recommended for B2C): view but not create or edit; "Update payment to resume full access".
- **Option C, immediate lockout** (not recommended): only for very low-cost plans.
- **After grace:** pause the account, don't delete it; emails on day 1 ("Your account has been paused"), day 7 ("Your data is still here"), day 30 (win-back with a new offer), day 60 (final win-back), day 90 (data deletion warning, if applicable).
- **In Stripe,** access follows the subscription status, and after the last retry you choose cancel, mark `unpaid`, leave `past_due`, or pause; Stripe allows pausing eligible subscriptions "after the first renewal payment failure or after retries are exhausted" ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning)). This "grace period" is yours; the stores' billing grace period is a separate mechanism ([revenuecat BILLING-AND-RECOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/BILLING-AND-RECOVERY.md#billing-issues-and-grace-periods)).

## In-app dunning

[coreyhaines31/marketingskills, churn-prevention] Don't rely on email alone.

```
┌──────────────────────────────────────────────────────┐
│ ⚠ Your payment of $29 failed. Update your card to    │
│ avoid losing access. [Update Payment →]  [Dismiss]   │
└──────────────────────────────────────────────────────┘
```

- Show the banner on every page load during dunning; allow dismiss but show it again next session; link straight to the payment update; "Don't block the product".
- The final warning as a modal:

```
┌─────────────────────────────────────┐
│                                     │
│  Your account will be paused        │
│  on [date]                          │
│                                     │
│  Update your payment method to      │
│  keep access to your [X] projects   │
│  and [Y] team members.              │
│                                     │
│  [Update Payment Method]            │
│  [Remind Me Later]                  │
│                                     │
└─────────────────────────────────────┘
```

Where these notices sit in the product UI is the job of [app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md).

## Webhooks

- **Stripe** [coreyhaines31/marketingskills, churn-prevention]: `invoice.payment_failed` starts dunning, `invoice.paid` triggers a check of the current subscription status or active entitlements before access is restored, `customer.subscription.updated` carries status changes, `customer.subscription.deleted` is the final cancellation. Handlers and `attempt_count` are in [stripe WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/WEBHOOKS.md) and [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning).
- **A paid invoice is not complete account recovery.** With Stripe's All invoices status resolution, another applicable outstanding invoice can leave the subscription `past_due` or `unpaid`. Use the [canonical access checks](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#provision-and-revoke-access); a single invoice payment does not by itself prove that the recovery sequence can stop. The old line said `invoice.paid` stops dunning and restores access unconditionally. [Stripe subscription lifecycle and status resolution](https://docs.stripe.com/billing/subscriptions/overview)
- **Paddle Billing** [coreyhaines31/marketingskills, churn-prevention], names confirmed against [Paddle's webhook overview](https://developer.paddle.com/webhooks/overview): `transaction.payment_failed` (use its `subscription_id`; a failed one-off transaction is not subscription churn), `subscription.past_due`, `subscription.canceled`; a cancellation scheduled for the next period emits `subscription.updated` first, which Paddle describes as "a catch-all that also covers cancellations and pauses". `subscription.payment_failed` and `subscription.cancelled` are not Paddle Billing event types.
- **Chargebee, Recurly and Braintree** setup paths in the source were not checked against their docs and are left out.

## Measure it

[coreyhaines31/marketingskills, churn-prevention] Recovery rate (recovered / total failed), by decline type; time to recovery (days from failure to success); pre-dunning prevention rate; per-email open and click; revenue recovered per month; revenue lost to involuntary churn. The source's targets for these have no source; set your own baseline. Stripe's recovery analytics are built in ([stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#smart-retries-and-dunning)).

## Prove it

On a Stripe test clock, a renewal with a declining card fires `invoice.payment_failed`, the four emails go out on the dates their copy states, the banner shows on every session until the card is updated, `invoice.paid` leads to a current status/entitlement check, and access is restored only when eligible, and the account after grace is paused, not deleted; Smart Retries uses Stripe's settings; and no copy promises a deadline the schedule doesn't keep.
