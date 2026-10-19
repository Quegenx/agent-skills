# Measuring a referral program

What to track, the formulas, and how to report a return without claiming more than the data shows. From [coreyhaines31/marketingskills, referrals] unless tagged; its benchmark ranges and outcome claims come without studies.

## What to track

- **Program health:** active referrers ("referred someone in last 30 days"); referral conversion rate; rewards earned and paid.
- **Business impact:** % of new customers from referrals; CAC via referral against other channels; LTV of referred customers; program ROI.
- **Separately:** cost per referred customer; LTV of referred customers; payback period for rewards.

Event names for an app (`invite_sent` through `reward_issued`) are in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md#referral-programs); funnels and cohorts are built in [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md); attribution models are in [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## K-factor

```
K = Invitations × Conversion Rate

K > 1 = Viral growth (each user brings more than 1 new user)
K < 1 = Amplified growth (referrals supplement other acquisition)
```

Example: 3 invitations per customer, 15% convert, K = 3 × 0.15 = 0.45. The mobile source uses the same formula with finer bands [eronred, referral-programs]: "Under 0.15 is nice-to-have; 0.15-0.5 meaningful; 0.5-1.0 a strong amplifier; over 1.0 true viral (extremely rare). A realistic target is 0.2-0.4"; above 0.5 only with very strong network effects. These are the source's thresholds, not a second definition in app-growth.

## Referral rate

```
Referral Rate = (Customers who refer) / (Total customers)
```

The source's benchmarks, unsourced: good 10-25% of customers refer, great 25-50%, exceptional 50%+; referrals per referrer average 1-2, good 2-5, exceptional 5+. app-growth's figures measure something else, the share of installs: "a mature program to bring 5-20% of net-new installs", and "one prompt at install gets about 2% adoption; 3+ contextual prompts get 15-25%" [eronred]. Both are author claims; compare a program only with its own history.

## Return

```
Referral program return = (Incremental contribution before program costs - Program costs) / Program costs

Contribution before program costs = Net referred revenue - Serving / product costs
Program costs = Reward economic cost + Allocated tool / campaign costs + Management hours × Loaded hourly cost
```

- Use the same cohort and window for revenue and costs. Net revenue accounts for refunds and discounts; don't subtract a discount in both net revenue and reward cost. With zero program cost the ratio is undefined: report contribution and costs separately.
- **Revenue is not profit:** $10,000 net referred revenue at 20% contribution margin is $2,000; with $3,000 program cost the return is ($2,000 - $3,000) / $3,000 = -33.3%, "despite a revenue-minus-program-cost ratio of +233.3%". The source cites [Google's ROI explanation](https://support.google.com/google-ads/answer/1722066?hl=en). Revenue-based ROAS for paid channels is in [app-growth BUDGET-AND-ROAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/BUDGET-AND-ROAS.md).
- **Attribution is not incrementality:** "Referral attribution does not prove all referred sales are incremental. Estimate the counterfactual with a suitable holdout or other defensible design. If you only have attributed sales, label the result attributed contribution return, state the incrementality assumption, and do not claim causal program ROI." Separate observed cash recovery from projected lifetime contribution. Holdout design is in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## Claimed outcomes

The source lists as "Typical Findings", with no study: referred customers have 16-25% higher LTV, 18-37% lower churn, and refer others at 2-3x the rate. Use them, if at all, as "[coreyhaines31/marketingskills] reports"; measure your own referred cohort against others before claiming any of them.

## Prove it

Every reported rate names its numerator, denominator, cohort and window; K-factor and referral rate are reported separately; the return counts contribution, not revenue; and a return without a holdout is labelled "attributed contribution return".
