# Price changes

When to raise prices, the ways to do it, and how to roll a change out without a churn spike. From [coreyhaines31/marketingskills, pricing] `SKILL.md` (MIT, Copyright (c) 2025 Corey Haines). Stripe amount changes and supported maintenance updates follow [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#model-the-catalog); price-test mechanics are in [stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#pricing-experiments-and-price-increases). On the app stores the store, not you, sets the notice and consent rules (below).

## Signs it's time

[coreyhaines31/marketingskills, pricing]

- **Market:** competitors have raised prices; prospects don't flinch at the price; "It's so cheap!" feedback.
- **Business:** very high conversion (the source says >40%); very low churn (<3% monthly); strong unit economics.
- **Product:** significant value added since the last change; the product is more mature and stable.

## Ways to raise

[coreyhaines31/marketingskills, pricing]

1. **Grandfather existing customers:** the new price for new customers only.
2. **Delayed increase:** announce 3 to 6 months out.
3. **Tied to value:** raise the price and add features.
4. **Plan restructure:** change the plans entirely.

## Rollout

[coreyhaines31/marketingskills, pricing] "A price change is a rollout, not a switch you flip."

1. **Test on new customers first.** They have no anchor and no relationship at stake, so they give a clean read before you touch an existing account.
2. **Don't reflexively grandfather forever.** A customer paying $50/mo who should be at $250/mo is a $2,400/yr gap per customer. "Grandfather as a *transition* (a grace period), not a permanent exemption."
3. **Roll out small, then in waves.** Move 5 to 10% of existing customers first, watch churn and support volume for a cycle, then expand in staggered waves.
4. **Communicate the why, months ahead, with a generous option:** lock the old price if they switch to annual now, an extended grace window, or a one-time credit.

Expect some churn; the source says the accounts most likely to leave over a justified increase are usually the least profitable, highest-support, most price-sensitive ones.

- **This conflicts with a line in the Stripe skill.** [appeeky] in [stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#pricing-experiments-and-price-increases) designs price tests to "grandfather existing subscriptions on the old price"; the pricing source grandfathers only as a transition. Both views stand, each for its own job (testing a price versus migrating the base).
- **Measure** conversion, ARPU and churn at 30 and 60 days per cohort ([stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#pricing-experiments-and-price-increases)); test design is in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## App Store and Google Play subscriptions

The rollout above is for prices you bill yourself. For store subscriptions the store controls notice and consent, so check its rules before any increase reaches existing subscribers:

- **Apple** asks subscribers to consent to an increase in some cases (a region that requires it, an increase above set thresholds, or a second increase within 12 months) and otherwise notifies them before renewal ([Apple, Manage pricing for auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions)).
- **Google Play:** "By default, price increases are opt-in changes for existing subscribers. Users must explicitly accept the higher price before it is first charged, or Google Play automatically cancels their subscription" ([Google Play, Change subscription prices](https://developer.android.com/google/play/billing/price-changes)).
- **The exact thresholds and notice periods** belong in [app-store-connect PRICING-AND-SUBSCRIPTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#price-increases-for-existing-subscribers) and [google-play PRICING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/PRICING.md#existing-subscribers). Store churn from an increase shows up as the `PRICE_INCREASE` reason in RevenueCat ([revenuecat BILLING-AND-RECOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/BILLING-AND-RECOVERY.md)).

## A scheduled increase is a claim

Announcing "on November 1 the price moves to $X" is an advance-sale claim under 16 CFR 233.5: raise it when you said you would ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#advance-sales-and-limited-offers)).

## Prove it

The new price ran on new customers before any existing one moved; the first existing wave was 5 to 10% and its churn and support volume were read before the next; grandfathering has an end date; customers heard the reason months ahead with a generous option; store subscribers were handled by the store's consent rules; and an announced increase happened on its date.
