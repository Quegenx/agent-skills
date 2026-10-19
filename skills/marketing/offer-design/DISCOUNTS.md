# Discounts

When a discount helps and when an offer should replace it. From [coreyhaines31/marketingskills, offers] `references/saas-offers.md` and `SKILL.md` (MIT, Copyright (c) 2025 Corey Haines), with the US rules on former prices, "sale" claims, installments and trials from [FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md).

## The rule

[coreyhaines31/marketingskills, offers]

- **Never discount to acquire.** "Offers beat discounts. A discount lowers the price. An offer raises the value - a guarantee, a done-for-you migration, a bonus that removes the switching cost."
- **Discount only in two moments:**

| When | Why it works |
|---|---|
| Upgrades / cross-sells | The customer already values the product. A discount to move up a tier or add a product rewards commitment instead of buying a stranger. |
| Seasonal moments | Black Friday, year-end, an annual-plan push: a real, time-bound, everyone-gets-it window. Not a permanent price cut wearing a costume. |

- **What discounting to acquire does,** per the source: anchors the product as cheap; attracts price-shoppers; trains the market to wait for the next sale.
- **The source's churn figure is a claim, not a measurement:** it says discount-askers "churn at roughly 2× the rate of full-price customers" and gives no study. Quote it as the source's claim if at all. [pricing-strategy MODELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/MODELS.md#low-prices-and-retention) carries the same claim with its attribution.

## When you do run a sale

- **The "was" price must be real:** offered openly for a reasonably substantial period, and not raised just before the sale; an unstated reduction must not be trivial (16 CFR 233.1, [FTC-PRICING-CLAIMS.md](FTC-PRICING-CLAIMS.md#former-prices-and-sales)).
- **A deadline must be real** and end when it says ([SCARCITY.md](SCARCITY.md)).
- **In Stripe,** run a sale as a coupon or promotion code ([stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#coupons-and-promotion-codes)); distinguish changes requiring a new Price from supported maintenance updates in [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#model-the-catalog). The old line said a live Price could not be edited; Stripe permits supported updates, including `active`, `metadata` and `nickname` ([Update a price](https://docs.stripe.com/api/prices/update)).

## Save offers and win-back are a different case

- **A discount in a cancel flow goes to an existing customer,** which is the source's "existing customers" exception. Its limits (20 to 30% for 2 to 3 months, never above 30%, at most two per session) are in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#save-offers).
- **A discounted first period at trial end** (an app practice in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#trials), [eronred]) goes to someone who is not yet a customer, so it conflicts with "never discount to acquire". Both views stand: [coreyhaines31/marketingskills, offers] says don't; [eronred] runs one. Test it rather than assume.

## Replace the discount with an offer

[coreyhaines31/marketingskills, offers] The source's pattern for SaaS: when conversion is stuck, find the real objection first. When prospects fear migrating off an incumbent, a discount does nothing about it; a done-for-you migration with a guarantee on the switching cost ("If your migration isn't live and verified in 14 days, it's free"), plus a bonus that removes the second fear (a deliverability audit and re-warm plan), and capacity-real scarcity (a fixed migration queue) does. Its four SaaS patterns:

| Offer shape | Risk reversal is on | Scarcity type |
|---|---|---|
| A fixed-price paid pilot that credits toward annual | Whether it surfaces an insight the team acts on | Capacity (setup sessions per month) |
| A bundle of tools that only pay off together | Whether it beats the buyer's current workflow | Seasonal (season start) |
| An accelerator: the plan plus a program to the outcome | Whether the outcome (a launched course) happens | Cohort (start date and seat cap) |
| A done-for-you migration | Whether migration is live in 14 days | Capacity (engineer queue) |

The source names real companies for these (AudienceTap, SaberSim, Teachable, Kit) without saying the offers exist; they are kept here as patterns, not as facts about those companies.

## Prove it

No discount goes to a stranger outside a real seasonal window; every sale's "was" price was charged for a substantial period; every deadline ends when stated; save-offer discounts stay within the cancel-flow limits; and a stuck conversion was diagnosed for its real objection before any price was cut.
