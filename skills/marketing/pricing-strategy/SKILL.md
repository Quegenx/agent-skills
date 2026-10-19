---
name: pricing-strategy
description: "Sets and changes prices for SaaS and web products: the three pricing axes, value-based pricing, a first price you can learn from, the value metric, the eight pricing models and how to combine them, tier count and Good-Better-Best, packaging for personas, freemium versus free trial, enterprise tiers, Van Westendorp with its limits, MaxDiff, Gabor-Granger and usage-value research, when and how to raise prices with a staged rollout, and a two-axis pricing page teardown for human buyers and AI agents. Use when deciding what to charge, choosing a value metric or tiers, choosing freemium or a trial, running pricing research, planning a price increase, or auditing a pricing page."
---

# Pricing strategy

Pricing has three axes: packaging (what's in each tier), the pricing metric (what you charge for) and the price point (how much). "The value metric picks the pricing model", value sets the price between the next best alternative and perceived value, and "The goal of your first price is *learning*, not precision." This skill comes from [coreyhaines31/marketingskills, pricing] (MIT, Copyright (c) 2025 Corey Haines; the teardown's AI-agent lens credited to Kyle Poyar, Growth Unhinged), checked against Sawtooth Software for Van Westendorp, Google Search Central for structured data, OpenAI's and Anthropic's crawler docs, and Apple's and Google Play's price-change rules. It is written for SaaS and web products. App-store pricing, tiers and trials are in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md); in-app upgrade prompts in [onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md); the offer around the price (bonuses, guarantees, deadlines) in [offer-design SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md); Stripe's catalog and price mechanics in [stripe SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md); converting visitors on the pricing page in [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).

Read the product context file first, `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`. Then ask what it doesn't cover [coreyhaines31/marketingskills, pricing]: product type, current pricing, target market (SMB, mid-market, enterprise), go-to-market motion (self-serve, sales-led, hybrid); the primary value, the alternatives customers consider, how competitors price; conversion rate, ARPU, churn, pricing feedback; and the goal (growth, revenue or profitability; moving upmarket or down).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The three axes, value-based pricing, the first price ($10/$100/$1,000, the $9 trap), the value metric, the eight models, combining them, the 10:1 value ratio, low prices and retention | [MODELS.md](MODELS.md) |
| Tier count, Good-Better-Best, tier levers, the example tier table, persona packaging, freemium vs free trial, trial practice, card upfront, reverse trials, enterprise tiers | [TIERS-AND-TRIALS.md](TIERS-AND-TRIALS.md) |
| Van Westendorp (questions, curves, intersections, limits), MaxDiff, Gabor-Granger and conjoint, usage-value correlation | [RESEARCH.md](RESEARCH.md) |
| Signs it's time to raise, the four ways, the staged rollout, grandfathering, App Store and Play consent rules | [PRICE-CHANGES.md](PRICE-CHANGES.md) |
| Pricing page elements and psychology, the 10-dimension two-axis rubric, the paste test, structured data and AI bots, the report template, failure patterns | [PAGE-TEARDOWN.md](PAGE-TEARDOWN.md) |

## The rules

1. **Price on value, not cost or competitors:** between the next best alternative (floor) and perceived value (ceiling); cost to serve is "Only a baseline" [coreyhaines31/marketingskills, pricing] ([MODELS.md](MODELS.md#value-based-pricing)).
2. **Find the value metric first** with "As a customer uses more of [metric], do they get more value?", then let it pick the model; layer a second model only for a segment the first clearly mis-prices [coreyhaines31/marketingskills, pricing].
3. **Start high enough to learn from.** Pick the $10, $100 or $1,000 bucket by who the customer is and avoid the $9 trap; "Round-and-slightly-higher beats clever-and-cheap" [coreyhaines31/marketingskills, pricing].
4. **Tiers follow real segments,** each names who it's for and states its limits in words, and the feature that delivers the core value is never gated ([TIERS-AND-TRIALS.md](TIERS-AND-TRIALS.md)).
5. **Research gives a range, not an answer.** Van Westendorp measures perceptions, not purchase probability, and Sawtooth calls the line-crossing approach "criticized and discredited"; confirm with choice studies or real price tests ([RESEARCH.md](RESEARCH.md#what-van-westendorp-cant-tell-you)).
6. **Roll a price change out:** new customers first, then 5 to 10% of existing ones, then waves; grandfather as a transition, not forever; explain the why months ahead [coreyhaines31/marketingskills, pricing] ([PRICE-CHANGES.md](PRICE-CHANGES.md)).
7. **Store subscriptions follow the store's price-change rules** ([PRICE-CHANGES.md](PRICE-CHANGES.md#app-store-and-google-play-subscriptions)); Stripe amount changes follow the canonical [Price catalog rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#model-the-catalog), distinct from supported maintenance updates.
8. **Every price on the page is real text a machine can read.** Markup follows the requested consumer's eligibility rules, crawler access follows the publisher's purpose-specific policy, and every claim (strikethrough, guarantee, deadline) meets [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md) ([PAGE-TEARDOWN.md](PAGE-TEARDOWN.md)).
9. **Label figures by market.** SaaS figures here (17 to 20% annual discount, 7 to 30 day trials) and app figures in app-growth (40 to 60% annual discount, 3 to 30 day trials) differ; quote each for its own audience.

## Prove it

Given a current price of $39 and candidate prices of $49 and $59, the answer gives +25.6% and +51.3% on the current price and says demand isn't measured by Van Westendorp; a pricing page audit returns two sub-scores and a P0-P3 fix list and leaves conversion optimization to cro; a price increase plan starts with new customers and a 5 to 10% wave; and every file's own Prove it checks pass for the parts you touched.
