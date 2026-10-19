# Pricing research

How to learn what buyers will pay and which features belong in which tier: Van Westendorp with its limits, MaxDiff, willingness-to-pay methods, and usage-value correlation. From [coreyhaines31/marketingskills, pricing] `references/research-methods.md` (MIT, Copyright (c) 2025 Corey Haines), checked against the source it cites, Sawtooth Software (https://sawtoothsoftware.com/resources/blog/posts/van-westendorp-pricing-sensitivity-meter). Interviews and surveys in general are in [customer-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md); live price tests in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) and [stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#pricing-experiments-and-price-increases).

**Contents:** [Van Westendorp](#van-westendorp) · [What Van Westendorp can't tell you](#what-van-westendorp-cant-tell-you) · [MaxDiff](#maxdiff) · [Willingness to pay](#willingness-to-pay) · [Usage-value correlation](#usage-value-correlation) · [Prove it](#prove-it)

## Van Westendorp

[coreyhaines31/marketingskills, pricing]

**The four questions:**

1. "At what price would you consider [product] to be so expensive that you would not consider buying it?" (Too expensive)
2. "At what price would you consider [product] to be priced so low that you would question its quality?" (Too cheap)
3. "At what price would you consider [product] to be starting to get expensive, but you still might consider it?" (Expensive)
4. "At what price would you consider [product] to be a bargain - a great buy for the money?" (Cheap / good value)

**Analysis:**

1. **Validate** responses in one currency, billing period and product description. Flag missing, nonnumeric or out-of-order thresholds (`too cheap ≤ cheap ≤ expensive ≤ too expensive`); document exclusions instead of silently changing answers.
2. **Plot** candidate price on x and share of respondents on y:

| Curve | Share to plot at price `p` | Direction |
|---|---|---|
| Too cheap | Respondents whose too-cheap threshold is at or above `p` | Decreasing |
| Cheap / good value | Respondents whose cheap threshold is at or above `p` | Decreasing |
| Expensive | Respondents whose expensive threshold is at or below `p` | Increasing |
| Too expensive | Respondents whose too-expensive threshold is at or below `p` | Increasing |

   Use one endpoint convention for ties and record it. "Do not apply an increasing cumulative distribution to all four questions: it reverses the meaning of the cheap curves."

3. **Intersections:** Point of Marginal Cheapness (PMC), "Too cheap" crosses "Expensive"; Point of Marginal Expensiveness (PME), "Too expensive" crosses "Cheap"; Optimal Price Point (OPP), "Too cheap" crosses "Too expensive"; Indifference Price Point (IDP), "Expensive" crosses "Cheap". The acceptable range is PMC to PME; OPP and IDP are candidates to test, not an optimum.

**Survey tips:** 100 to 300 respondents (the source's figure); segment by persona; realistic product descriptions; add purchase-intent questions.

**Sample output** (the source's):

```
Price Sensitivity Analysis Results:
─────────────────────────────────
Point of Marginal Cheapness:  $29/mo
Optimal Price Point:          $49/mo
Indifference Price Point:     $59/mo
Point of Marginal Expensiveness: $79/mo

Candidate test prices: $49 and $59/mo
Current price: $39/mo
Price changes: +25.6% and +51.3%
Demand, conversion and churn impact: not measured by these four questions
Next step: validate purchase behavior and unit economics before rollout
```

Compute a change on the current price: $39 → $49 is +25.6%.

## What Van Westendorp can't tell you

- **The source:** "The four questions measure price perceptions, not purchase probabilities." Before forecasting demand, add purchase-intent research (the Newton-Miller-Smith extension, with its assumptions stated), a choice study, or real price tests, and compare revenue, margin and retention.
- **Sawtooth goes further:** "the line-crossing approach has largely been criticized and discredited as lacking good theory", and "A key weakness... it doesn't ask consumers to make a choice among the firm's product and available competitors" ([Sawtooth](https://sawtoothsoftware.com/resources/blog/posts/van-westendorp-pricing-sensitivity-meter)). Use it for a range and a shortlist, never as the answer.

## MaxDiff

[coreyhaines31/marketingskills, pricing] Best-worst scaling, for packaging.

1. List 8 to 15 features you could include.
2. Show sets of 4 to 5 at a time.
3. Ask "Which is MOST important? Which is LEAST important?"
4. Repeat until all are compared; statistical analysis gives importance scores.

| Utility score | Packaging decision |
|---|---|
| Top 20% | Include in all tiers (table stakes) |
| 20-50% | Use to differentiate tiers |
| 50-80% | Higher tiers only |
| Bottom 20% | Consider cutting or a premium add-on |

## Willingness to pay

[coreyhaines31/marketingskills, pricing]

- **Direct** ("How much would you pay for [product]?"): simple but biased.
- **Gabor-Granger** ("Would you buy [product] at [$X]?", yes or no, price varied across respondents): builds a demand curve.
- **Conjoint:** respondents choose among bundles at different prices; analysis gives price sensitivity per feature.

## Usage-value correlation

[coreyhaines31/marketingskills, pricing]

1. **Instrument usage:** feature frequency, volume metrics (users, records, API calls), outcome metrics (revenue generated, time saved). Event capture is in [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md).
2. **Correlate with success:** which patterns predict retention, which predict expansion, which customers pay most and why.
3. **Find thresholds:** the usage level where customers "get it", where they expand, and where price should rise.

The source's example: high-LTV customers (>$10k ARR) average 15 monthly active users, 8 projects and 4 integrations; churned ones 3, 2 and 0; insight, value follows team adoption and depth of use; recommendation, "Price per user, gate integrations to higher tiers". A correlation is a hypothesis: confirm it on a later cohort ([onboarding-and-upgrades ACTIVATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/ACTIVATION.md#find-the-aha-moment)).

## Prove it

Van Westendorp answers were validated and exclusions listed; the cheap curves fall and the expensive curves rise; the report gives a range and candidate prices, not "the optimal price", and names the next behavioral test; MaxDiff results map to tiers by the utility table; and any usage threshold used for pricing held on a second cohort.
