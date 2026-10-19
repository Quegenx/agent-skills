# Experimentation program

Individual tests are valuable; a continuous program compounds. This file is the loop that keeps one running, from [coreyhaines31/marketingskills, ab-testing] (SKILL.md, MIT). The targets below are the source's, with no study cited; treat them as practice, not benchmarks.

## The experiment loop

[coreyhaines31/marketingskills, ab-testing]

```
1. Generate hypotheses (from data, research, competitors, customer feedback)
2. Prioritize with ICE scoring
3. Design and run the test
4. Analyze results with statistical rigor
5. Promote winners to a playbook
6. Generate new hypotheses from learnings
→ Repeat
```

## Hypothesis sources

[coreyhaines31/marketingskills, ab-testing]

| Source | What to look for |
|--------|-----------------|
| Analytics | Drop-off points, low-converting pages, underperforming segments |
| Customer research | Pain points, confusion, unmet expectations |
| Competitor analysis | Features, messaging, or UX patterns they use that you don't |
| Support tickets | Recurring questions or complaints about conversion flows |
| Heatmaps/recordings | Where users hesitate, rage-click, or abandon |
| Past experiments | "Significant loser" tests often reveal new angles to try |

Funnels and drop-offs are [posthog INVESTIGATING-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/INVESTIGATING-METRICS.md); heatmaps and recordings are [posthog WEB-ANALYTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/WEB-ANALYTICS.md) and [posthog SESSION-REPLAY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SESSION-REPLAY.md); customer research is [customer-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md).

## ICE prioritization

[coreyhaines31/marketingskills, ab-testing] Score each hypothesis 1 to 10 on three dimensions:

| Dimension | Question |
|-----------|----------|
| **Impact** | If this works, how much will it move the primary metric? |
| **Confidence** | How sure are we this will work? (Based on data, not gut.) |
| **Ease** | How fast and cheap can we ship and measure this? |

**ICE Score** = (Impact + Confidence + Ease) / 3

Run the highest-scoring experiments first and re-score monthly as context changes. The weighted five-factor scorecard in [TEMPLATES.md](TEMPLATES.md#prioritization-scorecard) is the source's alternative.

## Velocity

[coreyhaines31/marketingskills, ab-testing] The source's targets:

| Metric | Target |
|--------|--------|
| Experiments launched per month | 4 to 8 for most teams |
| Win rate | "20-30% is common for mature programs (sustained higher rates may indicate conservative hypotheses)" |
| Average test duration | 2 to 4 weeks |
| Backlog depth | 20+ hypotheses queued |
| Cumulative lift | Compound gains from all winners |

## Cadence

[coreyhaines31/marketingskills, ab-testing]

- **Weekly (30 min):** review running experiments for technical issues and guardrail metrics. Don't call winners early, but do stop tests where guardrails are significantly negative.
- **Bi-weekly:** conclude completed experiments, analyze results, update the playbook ([TEMPLATES.md](TEMPLATES.md#playbook-entry)), launch the next experiment from the backlog.
- **Monthly (1 hour):** review velocity, win rate and cumulative lift; replenish the backlog; re-prioritize with ICE.
- **Quarterly:** audit the playbook. Which patterns have been applied broadly? Which winning patterns haven't been scaled yet? Which areas of the funnel are under-tested?

## Common mistakes

[coreyhaines31/marketingskills, ab-testing]

- **Design:** testing too small a change (undetectable), too many things (can't isolate), no clear hypothesis.
- **Execution:** stopping early, changing things mid-test, not checking the implementation. Mid-run changes in PostHog are [posthog EXPERIMENT-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-CHANGES.md).
- **Analysis:** ignoring confidence intervals, cherry-picking segments, over-interpreting inconclusive results.

## Questions to ask

[coreyhaines31/marketingskills, ab-testing]

1. What's your current conversion rate?
2. How much traffic does this page get?
3. What change are you considering and why?
4. What's the smallest improvement worth detecting?
5. What tools do you have for testing?
6. Have you tested this area before?

## Prove it

The backlog has scored hypotheses with their source named; each running test has a weekly guardrail check on record and no winner called before its planned sample; concluded tests are in the playbook; and the monthly review reports launched, concluded and win rate from the repository rows, not from memory.
