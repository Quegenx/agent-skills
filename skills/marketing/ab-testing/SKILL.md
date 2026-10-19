---
name: ab-testing
description: "Designs and reads A/B tests and runs an experimentation program, tool-agnostic: the hypothesis, test types and their traffic, primary, secondary and guardrail metrics, sample size from the standard formula and duration with unequal splits, peeking and sequential testing, reading p-values and intervals the ASA way, inconclusive results, test plans and result write-ups, ICE scoring, velocity and cadence. Use when planning an A/B or multivariate test, asking how long to run one or whether a result is significant, writing a test plan or result, or building an experiment backlog."
---

# A/B testing

A test only answers the question it was designed for: a hypothesis written before launch, one primary metric, a sample size and stopping rule fixed in advance, and an analysis that reads the p-value and interval for what they are. This skill is the tool-agnostic method, from [coreyhaines31/marketingskills, ab-testing] (MIT, (c) 2025 Corey Haines, copied with its notice). Its sample-size tables are replaced by values computed from the standard two-proportion formula (see [SAMPLE-SIZE.md](SAMPLE-SIZE.md)). Running a test in PostHog (flags, exposures, its statistics engine and health checks) is [posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md) and the files it links. Test ideas for a page are [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md); variant copy is [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md). Store experiments are [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md); paywall tests are [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).

Product context: read `.agents/product-context.md` first if it exists (defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)) and ask only for what it doesn't cover. The source names this file `.agents/product-marketing.md`.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The required inputs, a sample-size table computed from the formula, duration with equal and unequal splits, minimum and maximum duration, multiple variants, too-high samples, sequential testing, calculators, the can-I-run-this check | [SAMPLE-SIZE.md](SAMPLE-SIZE.md) |
| Test plan, results write-up, test repository row, quick brief, stakeholder update, prioritization scorecard, hypothesis bank, playbook entry | [TEMPLATES.md](TEMPLATES.md) |
| The experiment loop, hypothesis sources, ICE scoring, velocity, cadence, common mistakes, the questions to ask | [PROGRAM.md](PROGRAM.md) |
| Running it in PostHog: plan, rollout and split, metrics, running time, statistics, health checks | [posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md) |
| Screening headlines in ads, then proving the winner on the landing page with a fresh randomized test | [paid-ads CAMPAIGN-PLANNING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/CAMPAIGN-PLANNING.md#landing-page-continuity) |

## Before designing

[coreyhaines31/marketingskills, ab-testing] Understand three things first:

1. **Test context:** what are you trying to improve, and what change are you considering?
2. **Current state:** baseline conversion rate and current traffic volume.
3. **Constraints:** technical complexity, timeline, tools available.

## The hypothesis

[coreyhaines31/marketingskills, ab-testing] Not "let's see what happens": a specific prediction, based on reasoning or data.

```
Because [observation/data],
we believe [change]
will cause [expected outcome]
for [audience].
We'll know this is true when [metrics].
```

- **Weak:** "Changing the button color might increase clicks."
- **Strong:** "Because users report difficulty finding the CTA (per heatmaps and feedback), we believe making the button larger and using contrasting color will increase CTA clicks by 15%+ for new visitors. We'll measure click-through rate from page view to signup start."
- [coreyhaines31/marketingskills, ad-creative] For a creative test the hypothesis names a metric, a comparison (the control, the audience) and a direction, plus a magnitude when a baseline exists: "beats the control on CTR among renters". Ad creative itself is [ad-creative SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md).

## Test types

[coreyhaines31/marketingskills, ab-testing]

| Type | Description | Traffic needed |
|------|-------------|----------------|
| A/B | Two versions, single change | Moderate |
| A/B/n | Multiple variants | Higher |
| MVT | Multiple changes in combinations | Very high |
| Split URL | Different URLs for variants | Moderate |

- **MVT combinations multiply:** 2 headlines x 2 images x 2 CTAs = 8 combinations. When traffic can't support that, run sequential A/B tests instead.

## Metrics

[coreyhaines31/marketingskills, ab-testing]

- **Primary:** the single metric that matters most, directly tied to the hypothesis; what you use to call the test.
- **Secondary:** support the primary's interpretation; explain why or how the change worked.
- **Guardrail:** things that shouldn't get worse; stop the test if one is significantly negative. PostHog's docs call these "counter metrics" ([posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md#plan-the-experiment)).
- **Example, pricing page test:** primary plan selection rate; secondary time on page and plan distribution; guardrail support tickets and refund rate.
- **Example, longer signup form** (company size and role added): primary form completion rate; secondary lead quality (SQL conversion rate, activation after signup); guardrail total signup volume. The quantity and quality trade off, and the downstream metrics need a longer observation window.
- [coreyhaines31/marketingskills, marketing-loops] For pricing-page tests: "Judge winners on revenue per visitor, plan mix, refunds, downgrades, churn, and support load - not conversion rate alone." "Do not promote a variant that lifts conversion but lowers revenue-per-visitor or raises refunds/churn."

## Traffic allocation

- [coreyhaines31/marketingskills, ab-testing] Standard 50/50 is the default for A/B; conservative 90/10 or 80/20 limits the risk of a bad variant; ramping starts small and increases, for technical risk. Users see the same variant on return; balance exposure across time of day and week.
- [PostHog, ../../monitoring/posthog/EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md#rollout-and-split) "Always default to an equal split unless the user explicitly requests otherwise", and limit risk by reducing the overall rollout instead: in PostHog an uneven split with the default "Exclude from analysis" can bias the smaller variant. In PostHog, follow PostHog's rule.
- [coreyhaines31/marketingskills, ab-testing] Client-side changes the page after load: quick, can flicker. Server-side picks the variant before render: no flicker, needs dev work. PostHog's flicker fixes are [posthog FLAG-EVALUATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/FLAG-EVALUATION.md).

## Running the test

[coreyhaines31/marketingskills, ab-testing]

- **Pre-launch:** hypothesis documented, primary metric defined, sample size calculated, variants implemented correctly, tracking verified, QA completed on all variants. The full list is in the test plan ([TEMPLATES.md](TEMPLATES.md#test-plan)).
- **During:** monitor for technical issues, check segment quality, document external factors. Don't peek at results and stop early, change variants, or add traffic from new sources.
- **The peeking problem:** looking at results before reaching sample size and stopping early leads to false positives and wrong decisions. Pre-commit to the sample size, or use a sequential method built for repeated looks ([SAMPLE-SIZE.md](SAMPLE-SIZE.md#sequential-testing)).
- **Guardrails during the run:** "Don't call winners early - but do stop tests where guardrails are significantly negative."

## Reading the result

[coreyhaines31/marketingskills, ab-testing], following the [American Statistical Association's p-value statement](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf):

- For a pre-specified fixed-horizon test, compare its p-value with the chosen significance level (commonly α = 0.05).
- A p-value describes how incompatible the data are with the null model: the probability, **assuming that model and its assumptions**, of a result at least as extreme as the observed one. It is not the probability that the result is random, that the null is true, or that a variant will win again.
- A 95% confidence interval comes from a procedure with 95% coverage over repeated samples under its assumptions. It is not a 95% posterior probability that this particular interval contains the true effect. Report the interval and effect size alongside the p-value.
- Use the planned analysis and stopping rule. Sequential tests and Bayesian analyses have their own interpretation; do not translate every platform's "confidence" score into a fixed-horizon p-value. PostHog's Bayesian "chance to win" is read in [posthog EXPERIMENT-SIGNIFICANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c5-bayesian-traps-high).
- Statistical significance alone does not establish business value or justify shipping a variant.

Analysis checklist:

1. **Reached sample size?** If not, the result is preliminary.
2. **Statistically significant?** Check confidence intervals.
3. **Effect size meaningful?** Compare to the MDE; project the impact.
4. **Secondary metrics consistent?** Do they support the primary?
5. **Guardrail concerns?** Did anything get worse?
6. **Segment differences?** Mobile vs desktop, new vs returning.

| Result | Conclusion |
|--------|------------|
| Significant winner | Check effect size, uncertainty and guardrails before implementing |
| Significant loser | Keep control, learn why |
| No significant difference | Report the effect interval: it may still allow meaningful benefit and harm, or may exclude effects worth pursuing. Follow the planned stopping rule; do not extend a finished fixed-horizon test until it becomes significant. Plan a new test if needed. |
| Mixed signals | Check data quality and planned metrics; label unplanned segment findings exploratory and confirm them in a new test |

- **Two views on a borderline result.** [coreyhaines31/marketingskills, ab-testing] says the row above. [PostHog agent skills, ../../monitoring/posthog/EXPERIMENT-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-METRICS.md#interpreting-results) says "Borderline: Continue, or end as inconclusive" and "Recommend shipping only when the result is statistically significant", and allows shipping an inconclusive result under three conditions ([C8](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c8-shipping-an-inconclusive-result-medium)).
- **Multiple comparisons.** PostHog applies no correction across metrics or variants ([C4](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c4-multiple-comparisons-high)); Optimizely's Stats Engine controls the false discovery rate with a tiered Benjamini-Hochberg procedure ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/false-discovery-rate-control)). Bonferroni is the manual correction ([SAMPLE-SIZE.md](SAMPLE-SIZE.md#multiple-variants)).

## The rules

1. **Write the hypothesis before building anything,** in the five-line template, with the metric that will prove it. [coreyhaines31/marketingskills, ab-testing]
2. **Test one thing,** bold enough to make a difference; more variants or an MVT only when traffic supports the multiplied sample. [coreyhaines31/marketingskills, ab-testing]
3. **Fix the sample size, duration and stopping rule before launch,** from the baseline of the specific page and metric; never from the source's old lookup tables. [coreyhaines31/marketingskills, ab-testing; SAMPLE-SIZE.md]
4. **Name one primary, a few secondary and the guardrails up front;** stop on a significantly negative guardrail. [coreyhaines31/marketingskills, ab-testing]
5. **Don't peek and stop early** unless the method is sequential and was turned on before launch. [coreyhaines31/marketingskills, ab-testing; ../../monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md]
6. **Read p-values and intervals as the ASA statement describes:** never "a 96% chance it works" from p = 0.04, never "a 4% chance it was random". [coreyhaines31/marketingskills, ab-testing]
7. **Don't extend a finished fixed-horizon test until it turns significant;** report the interval and plan a new test. [coreyhaines31/marketingskills, ab-testing]
8. **Unplanned segment findings are exploratory;** confirm them in a new test with its own plan. [coreyhaines31/marketingskills, ab-testing]
9. **Document every test** with hypothesis, variants with screenshots, results (sample, metrics, significance), decision and learnings ([TEMPLATES.md](TEMPLATES.md)). [coreyhaines31/marketingskills, ab-testing]

## Prove it

From the source's evals: a test plan for "15,000 visitors a month at 3.2%" uses the hypothesis template, names primary, secondary and guardrail metrics, sizes the test from the baseline and warns about peeking; four button colors are flagged as an A/B/n test with a larger sample and a question about whether color is the high-impact change; "3 days in, 95% confidence, call it?" gets the peeking answer, day-of-week effects and sequential testing as the alternative; an MVT request counts its combinations and offers sequential A/B tests when traffic is short; 252/12,000 vs 288/12,000 is computed as p ≈ 0.117 (two-sided pooled z-test), not called significant at 0.05, and not extended; p = 0.04 with a +0.1% to +3.9% interval and a higher refund rate is never told to a CEO as "96% chance it works", and the refund guardrail is weighed before rollout; and a request to write page copy is routed to the copy skill.
