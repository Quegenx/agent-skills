# Price, value metric and pricing models

What to charge for and roughly how much: the three pricing axes, value-based pricing, a first price you can learn from, the value metric, and the eight ways to structure how you charge. From [coreyhaines31/marketingskills, pricing] `SKILL.md` and `references/pricing-models.md` (MIT, Copyright (c) 2025 Corey Haines), copied with light edits; named claims keep the people the source credits. Billing mechanics for each model are in [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md) and [stripe USAGE-BASED.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/USAGE-BASED.md); app-store models (paid upfront, consumables, ads, hybrid) are in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#monetization-model-and-pricing).

**Contents:** [The three axes](#the-three-axes) · [Value-based pricing](#value-based-pricing) · [A first price you can learn from](#a-first-price-you-can-learn-from) · [The value metric](#the-value-metric) · [The eight models](#the-eight-models) · [Combining models](#combining-models) · [The value/price ratio](#the-valueprice-ratio) · [Low prices and retention](#low-prices-and-retention) · [Prove it](#prove-it)

## The three axes

[coreyhaines31/marketingskills, pricing]

1. **Packaging:** what's in each tier (features, limits, support level) and how tiers differ ([TIERS-AND-TRIALS.md](TIERS-AND-TRIALS.md)).
2. **Pricing metric:** what you charge for (per user, per usage, flat fee) and how price scales with value.
3. **Price point:** how much, the actual amounts, perceived value against cost.

## Value-based pricing

[coreyhaines31/marketingskills, pricing]

- **Customer's perceived value** is the ceiling; **the next best alternative** is the floor for differentiation; **your cost to serve** is "Only a baseline, not the basis". "Price between the next best alternative and perceived value."
- **Not competitor-based:** "matching a competitor's price copies their strategy, not their economics. It's a data point, not a target." **Not cost-based:** "cost is a floor, never the basis."

## A first price you can learn from

[coreyhaines31/marketingskills, pricing] "On day one you don't have a price to optimize - you have a bet to place. The goal of your first price is *learning*, not precision."

- **The $10 / $100 / $1,000 rule of thumb:** ~$10/mo for prosumer or individual, high volume, low touch; ~$100/mo for SMB or team tools, "the SaaS default"; ~$1,000/mo for mid-market, business-critical or sales-assisted. Pick the bucket by who the customer is and how much value you deliver, then start near the round number.
- **This is a SaaS rule.** For consumer apps, [eronred] in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#monetization-model-and-pricing) gives per-category store prices ("Productivity | $4.99-$9.99 | $29.99-$49.99"). Both stand, each for its audience.
- **Avoid the $9 trap.** Ultra-low pricing "Creates false traction" (signups from people who'd never pay a real price) and "Traps you - it's far harder to raise a price 5-10x later". "Round-and-slightly-higher beats clever-and-cheap."
- **"Just charge $50 and see what happens"** was, per the source, Jason Fried's advice to early Intercom: stop modeling, get a real signal; raise it if people pay without flinching.

## The value metric

[coreyhaines31/marketingskills, pricing] What you charge for; it should scale with the value customers receive. Good value metrics align price with value, are easy to understand, scale as the customer grows, and are hard to game.

| Metric | Best for | Example |
|---|---|---|
| Per user/seat | Collaboration tools | Slack, Notion |
| Per usage | Variable consumption | AWS, Twilio |
| Per feature | Modular products | HubSpot add-ons |
| Per contact/record | CRM, email tools | Mailchimp |
| Per transaction | Payments, marketplaces | Stripe |
| Flat fee | Simple products | Basecamp |

- **The test:** "As a customer uses more of [metric], do they get more value?" If no, price doesn't align with value.
- **"The value metric picks the pricing model."** Find the metric from data with the usage-value analysis in [RESEARCH.md](RESEARCH.md#usage-value-correlation).

## The eight models

[coreyhaines31/marketingskills, pricing] Distinct from the value metric (the unit) and the tier structure (the packaging); most real products combine two or more.

| Model | How it works | Best when | Reference |
|---|---|---|---|
| Flat-rate | One price, one product, everyone pays the same | Simple product, one persona, you want zero pricing friction | Basecamp |
| Usage-based | Pay for what you consume (metered) | Value scales directly with volume; consumption is variable and easy to meter | Stripe |
| Tier-based | Good-better-best packages at set prices | Distinct segments with different needs and budgets | Kinsta |
| User-based | Price per seat/user | Value grows as more people in the org use it (collaboration) | Notion |
| Feature-based | Price gated by which capabilities are unlocked | Clear feature tiers map to willingness to pay | Intercom |
| Credit-based | Buy a bucket of credits, spend them on actions | Usage is lumpy or bursty; you want prepaid commitment and simple mental accounting | Audible |
| Outcome-based | Pay per result delivered (resolution, task completed) | You can measure and attribute the outcome, and the outcome is what the buyer actually wants | Intercom Fin, Zapier |
| Hybrid | Deliberate mix (platform fee + usage, or seats + credits) | A single model under- or over-charges different customers | Drift |

- **Flat-rate:** "reach for it first if you can"; easiest to sell, understand and forecast; "you leave money on the table with your biggest customers".
- **Usage-based:** the fairest when consumption tracks value, but revenue is less predictable and "buyers fear a surprise bill. Pair with spend caps or alerts." Stripe's usage alerts are in [stripe USAGE-BASED.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/USAGE-BASED.md).
- **Tier-based:** the default for self-serve SaaS.
- **User-based:** "only if value genuinely rises with headcount. If it doesn't, seats punish adoption (teams share logins to avoid paying)."
- **Feature-based:** "don't gate the feature that delivers your core value; gate the ones that separate casual from serious users."
- **Credit-based:** "good for AI/actions-based products where each action has a cost"; credits decouple price from a single unit and make prepayment feel natural. [ApparenceKit] in app-growth agrees for apps (consumables "suit AI apps").
- **Outcome-based:** the source calls it the emerging model for AI agents (per resolved ticket, per automation run), "only viable when the outcome is measurable and clearly attributable to you".
- **Hybrid:** where most mature products end up: a base platform fee for predictability plus a usage or outcome component.

## Combining models

[coreyhaines31/marketingskills, pricing] Tiers + per-user (most B2B SaaS); platform fee + usage (Twilio-style); seats + credits; feature tiers + outcome. "Pick the primary model from the value metric, then layer a second only if a single model clearly mis-prices a real segment." A Stripe base fee plus overage is in [stripe USAGE-BASED.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/USAGE-BASED.md).

## The value/price ratio

[coreyhaines31/marketingskills, pricing] The source credits Ryan Kulp with aiming for "roughly a 10:1 value-to-price ratio": the customer perceives about 10x more value than they pay, which makes the purchase feel obvious and leaves headroom to raise prices. "If you can't articulate 10x value, the problem is usually the offer or the positioning, not the price point." Fix the offer with [offer-design SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md).

## Low prices and retention

[coreyhaines31/marketingskills, pricing] The source says "Low prices hurt retention" and credits "Patrick Campbell / ProfitWell data, echoed by operators like Josh Pigford of SpyFu and Tyler Tringas": under-priced customers churn more, because a low price signals low value and attracts the least committed buyers. It adds that discount-askers churn at "roughly 2x" the rate of full-price customers. Neither figure comes with a study in the source; quote them as its claims. Its implication: "when in doubt, price higher". The discount rules are in [offer-design DISCOUNTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/DISCOUNTS.md).

## Prove it

The chosen metric passes the "uses more, gets more value" test against real usage data; the model was picked from the metric, with a second layer only for a named mis-priced segment; the first price sits in the bucket for the stated customer, not at the $9 floor; and a usage-based plan ships with spend caps or alerts.
