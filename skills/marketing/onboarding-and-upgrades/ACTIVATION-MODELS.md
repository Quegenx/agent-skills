# Activation models

How a user gets to experience value before paying, which shapes signup volume, conversion and the whole onboarding path. Pick it before designing the flow. From [coreyhaines31/marketingskills, onboarding] `references/activation-models.md` (MIT, Copyright (c) 2025 Corey Haines), which cites ChartMogul's 2026 conversion report and credits Brian Balfour. Pricing tiers and freemium vs trial from the pricing side are in [pricing-strategy TIERS-AND-TRIALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/TIERS-AND-TRIALS.md#freemium-or-free-trial); store trials and intro offers in [app-growth SUBSCRIPTION-OFFERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SUBSCRIPTION-OFFERS.md).

## The five models

[coreyhaines31/marketingskills, onboarding]

1. **Freemium:** a free tier that never expires, paid tiers for more capacity or features. Best when the free tier delivers real value and naturally hits limits that motivate upgrading. Risk: give away too much and users never pay.
2. **Free trial:** full or near-full access for 3, 7, 14 or 30 days. Shorter trials force faster time to value; longer ones suit complex products with longer setup.
3. **Paid trial:** low-cost paid entry, the source's example "$7-10 for 7 days". Filters out tire-kickers and pre-collects payment details.
4. **Money-back guarantee:** full price up front with a refund window. Works when value arrives faster than the window. "Money back" must refund the full price, with conditions beside it ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#guarantees)).
5. **Consultation / white-glove:** a human conversation gates access (the source's example is Superhuman). For high-touch, high-price or complex products; doesn't scale cheaply.

**On the app stores** a paid trial maps to an introductory "pay up front" or "pay as you go" offer ([app-growth SUBSCRIPTION-OFFERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SUBSCRIPTION-OFFERS.md)), and refunds belong to the store, not the app ([UPGRADE-PROMPTS.md](UPGRADE-PROMPTS.md#store-rules-for-in-app-upgrades)).

## The card decision

[coreyhaines31/marketingskills, onboarding]

- **Card required is a trade-off to test:** it adds signup friction and changes who enters the trial. "A higher trial→paid rate among those who provide a card does not by itself mean more paying customers from the same incoming traffic."
- **Decide on visitor→paid, not trial→paid:** visitor→trial × trial→paid over the same conversion horizon and eligible traffic, including net contribution per visitor, refunds, early churn and support cost. The source's illustration: 10% signup × 10% trial conversion = 1% visitor→paid; 3% signup × 25% = 0.75%, despite the higher trial conversion.
- **Randomize where practical:** eligible visitors split between clearly disclosed trial terms, with complete follow-up before deciding.
- **What the numbers say, labelled:** [ChartMogul's 2026 report](https://chartmogul.com/reports/saas-conversion-report-2/) (200 B2B products) found card-required trials convert about 30% trial→paid, "over 5x" no-card trials, observational and on fewer signups. The pricing source claims "40-50% vs. 15-25%" with no study ([pricing-strategy TIERS-AND-TRIALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/TIERS-AND-TRIALS.md#freemium-or-free-trial)). App-growth quotes its own store-trial figures ([app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#monetization-model-and-pricing)).
- **A trial that converts to paid carries ROSCA's duties:** terms before billing details, express consent, a simple way to stop ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)).

## Model-market fit

[coreyhaines31/marketingskills, onboarding] "Model-Market Fit (Brian Balfour): 'your market dictates your model.'" Price point, buyer sophistication, sales complexity, time to value and competitor norms constrain the model; a self-serve $20/mo tool and a $50k enterprise platform can't use the same one.

## Hook, don't satisfy

[coreyhaines31/marketingskills, onboarding] The source's parable: Evernote gave away so much free that "Free was a destination, not a doorway"; Notion let users experience real value, then hit meaningful limits (blocks, members, features). "The free experience should hook, not satisfy."

## Choosing

[coreyhaines31/marketingskills, onboarding]

1. Start from the market, not your preference.
2. Decide card vs no card explicitly: volume of leads vs quality of leads, judged on visitor→paid.
3. Design the free or trial experience to hook and then limit.
4. Inside any model, build the shortest path to value ([ACTIVATION.md](ACTIVATION.md#minimum-path-to-value)).

## Prove it

The chosen model is justified by the market's price point and sales motion; the card decision compares visitor→paid over the same horizon, including refunds and early churn; any quoted trial conversion names its source and population; and the free tier has a limit that a retained user reaches.
