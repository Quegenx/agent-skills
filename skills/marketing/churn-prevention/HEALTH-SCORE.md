# Health score, risk signals and churn metrics

The save that happens before the customer clicks Cancel: leading risk signals, a health score built so its parts can be added, interventions, and the metrics and tests that tell you whether retention work pays. From [coreyhaines31/marketingskills, churn-prevention] `SKILL.md` (MIT, Copyright (c) 2025 Corey Haines), which cites Gainsight on weights for unavailable measures. Event capture and funnels are in [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md); billing-side risk (`delinquent`, `past_due`) and Stripe's churn and NRR formulas in [stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#churn); mobile signals in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#subscription-lifecycle).

## Risk signals

[coreyhaines31/marketingskills, churn-prevention] The source's leading indicators; the timings are its own estimates.

| Signal | Risk level | Timeframe |
|---|---|---|
| Login frequency drops 50%+ | High | 2-4 weeks before cancel |
| Key feature usage stops | High | 1-3 weeks before cancel |
| Support tickets spike then stop | High | 1-2 weeks before cancel |
| Email open rates decline | Medium | 2-6 weeks before cancel |
| Billing page visits increase | High | Days before cancel |
| Team seats removed | High | 1-2 weeks before cancel |
| Data export initiated | Critical | Days before cancel |
| Individual recommendation rating is 0-6 (detractor) | Medium | 1-3 months before cancel |

## The health score

[coreyhaines31/marketingskills, churn-prevention]

- **One scale first.** Define every component on "the same 0-100 scale, where higher means healthier", with documented product-specific mappings, before weighting; "do not add login counts, a 1-5 sentiment rating, and a percentage directly".
- **Missing is not zero.** "Treat missing or stale signals as unavailable, rather than automatically healthy or zero." Set freshness windows and a minimum coverage policy first. If the policy allows a partial score, compute `sum(weight × observed score) / sum(observed weights)` and report coverage (the sum of observed weights) beside it; otherwise return "insufficient data". All unavailable means no score.
- **Worked example:** only login (80) and feature usage (60) observed gives `(0.30×80 + 0.25×60)/0.55 = 70.91`, with 55% coverage. Don't act on a partial score that misses the coverage policy. [Gainsight's measure-weight documentation](https://support.gainsight.com/gainsight_nxt/05Scorecards/02Admin_Guides/Measure_Weights_in_Scorecards) explains redistribution for unavailable measures.
- **NPS is two different things:** "An individual rating of 0-6 is a detractor; aggregate NPS (-100 to 100) is a different measure."
- **The illustrative complete-data model** (the weights are "an illustrative starting point, not validated churn predictions"):

```
Health Score = (
  Login frequency score × 0.30 +
  Feature usage score   × 0.25 +
  Support sentiment     × 0.15 +
  Billing health        × 0.15 +
  Engagement score      × 0.15
)
```

| Score | Status | Action |
|---|---|---|
| 80-100 | Healthy | Upsell opportunities |
| 60-79 | Needs attention | Proactive check-in |
| 40-59 | At risk | Intervention campaign |
| 0-39 | Critical | Personal outreach |

- **Validate before use:** "Validate score mappings and intervention thresholds against later observed renewal/churn outcomes before operational use"; the tiers above are illustrative.

## Interventions

[coreyhaines31/marketingskills, churn-prevention]

| Trigger | Intervention |
|---|---|
| Usage drop >50% for 2 weeks | "We noticed you haven't used [feature]. Need help?" email |
| Approaching plan limit | Upgrade nudge, not a wall ([onboarding-and-upgrades UPGRADE-PROMPTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/UPGRADE-PROMPTS.md)) |
| No login for 14 days | Re-engagement email with recent product updates |
| Detractor (0-6) | Personal follow-up within 24 hours |
| Support ticket unresolved >48h | Escalation + proactive status update |
| Annual renewal in 30 days | Value recap email + renewal confirmation |

## Metrics

[coreyhaines31/marketingskills, churn-prevention] The source's formulas; its target ranges are its own and are left out except where noted.

| Metric | Formula |
|---|---|
| Monthly churn rate | Churned customers / Start-of-month customers (the source's target: <5% B2C, <2% B2B) |
| Revenue churn (net) | (Lost MRR - Expansion MRR) / Start MRR (target: negative, net expansion) |
| Cancel flow save rate | Saved / Total cancel sessions |
| Offer acceptance rate | Accepted offers / Shown offers |
| Pause reactivation rate | Reactivated / Total paused |
| Dunning recovery rate | Recovered / Total failed payments |
| Time to cancel | Days from first churn signal to cancel (track the trend) |

- **Two churn formulas.** The Stripe skill's [appeeky] formula divides by `(active_start + new_in_30d)` and calls "under 5% monthly... good for SMB SaaS; under 2%... excellent" ([stripe REVENUE-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/REVENUE-METRICS.md#churn)); this source divides by start-of-month customers and splits B2C and B2B. Say which one a report uses.
- **"A 'saved' customer who churns 30 days later wasn't really saved."** Track the LTV of saved customers, not only the save rate.
- **Cohorts:** segment churn by acquisition channel, plan, tenure (30, 60, 90 days), cancel reason and save-offer type.

## Testing the cancel flow

[coreyhaines31/marketingskills, churn-prevention] "Test one variable at a time":

| Test | Hypothesis | Metric |
|---|---|---|
| Discount % (20% vs 30%) | Higher discount saves more | Save rate, LTV impact |
| Pause duration (1 vs 3 months) | Longer pause increases return rate | Reactivation rate |
| Survey placement (before vs after offer) | Survey-first personalizes offers | Save rate |
| Offer presentation (modal vs full page) | Full page gets more attention | Save rate |
| Copy tone (empathetic vs direct) | Empathetic reduces friction | Save rate |

The source suggests PostHog: feature flags split users into flows server-side and funnels track survey → offer → accept or decline → confirm ([posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md)). Test design and significance are in [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## Prove it

Every score component is on 0 to 100 with a written mapping; an account with one signal missing shows a partial score and its coverage, or "insufficient data", never a score that counts the missing signal as 0; the tiers were checked against later renewals before triggering outreach; each report names its churn formula; and saved customers are followed for at least 30 days before a save counts.
