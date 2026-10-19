# Sample size and duration

How many units a test needs and how long collecting them takes, fixed before launch. The method is [coreyhaines31/marketingskills, ab-testing] (references/sample-size-guide.md, MIT); the table of values is recomputed from the standard formula because the source's own tables were wrong. PostHog's running-time calculator and its `N = (16 × variance) / d²` approximation are in [posthog EXPERIMENT-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-METRICS.md#sample-size-and-running-time).

**Contents:** [Required inputs](#required-inputs) · [Sample per variant](#sample-per-variant) · [Duration](#duration) · [Minimum and maximum duration](#minimum-and-maximum-duration) · [Multiple variants](#multiple-variants) · [Common sample-size mistakes](#common-sample-size-mistakes) · [When the sample is too high](#when-the-sample-is-too-high) · [Sequential testing](#sequential-testing) · [Calculators](#calculators) · [Can I run this test?](#can-i-run-this-test) · [Prove it](#prove-it)

## Required inputs

[coreyhaines31/marketingskills, ab-testing]

1. **Baseline conversion rate:** your current rate. If the page converts at 5%, that's the baseline.
2. **Minimum detectable effect (MDE):** the smallest improvement you care about detecting. Set it from business impact (is a 5% lift meaningful?), implementation cost (worth the effort?) and realistic expectations (what have past tests shown?). PostHog's default MDE is 30% where the project sets none ([posthog EXPERIMENT-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-METRICS.md#sample-size-and-running-time)).
3. **Significance level, usually α = 0.05:** for the planned test and its assumptions, it limits the long-run probability of rejecting a true null hypothesis to 5%. It is not the probability that an observed difference is "due to chance." Repeated unadjusted looks or multiple comparisons do not retain that error rate ([ASA statement](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf)).
4. **Statistical power, usually 80% (β = 0.20):** if there's a real effect of size MDE, you have an 80% chance of detecting it.

## Sample per variant

Per variant, two-sided α = 0.05, 80% power, MDE as a relative lift on the baseline, computed with the standard two-proportion normal approximation, n = (z₁₋α/₂ √(2 p̄(1 − p̄)) + z₁₋β √(p₁(1 − p₁) + p₂(1 − p₂)))² / (p₂ − p₁)², where p̄ is the mean of p₁ and p₂ (recomputed for this skill, rounded):

| Baseline | +5% | +10% | +20% | +50% | +100% |
|---|---|---|---|---|---|
| 1% | 637,000 | 163,000 | 42,700 | 7,750 | 2,320 |
| 3% | 208,000 | 53,200 | 13,900 | 2,520 | 750 |
| 5% | 122,000 | 31,200 | 8,160 | 1,470 | 435 |
| 10% | 57,800 | 14,800 | 3,840 | 690 | 200 |
| 20% | 25,600 | 6,510 | 1,680 | 294 | 82 |

- **What the source said:** references/sample-size-guide.md gave 380,000 per variant for 1% at +10%, 72,000 for 5% at +10% and 1,500 for 10% at +50% (about 2 to 2.4 times these values); its SKILL.md quick reference gave 150k, 27k and 550 for the same cells. The two files disagreed with each other; neither is used here.
- **PostHog's approximation** `N = (16 × variance) / d²` runs a little below this formula: at p = 0.1 and MDE 20% it gives 3,600 against 3,841.
- **[Evan Miller's calculator](https://www.evanmiller.org/ab-testing/sample-size.html)** uses the baseline rate p₁ instead of p̄ in the first term ([its code](https://www.evanmiller.org/ab-testing/sample-size-fixed.js)), so it returns a little less: 30,245 for 5% at +10% against 31,234 here, 3,623 for 10% at +20% against 3,841.
- **Halving the effect multiplies the sample by about 3.8 to 3.9** in this table (the +10% column against the +20% column).
- For any other cell, compute it with the formula or a calculator and state the settings.

## Duration

[coreyhaines31/marketingskills, ab-testing]

```
Duration (days) = (Sample per variant × Number of variants) / (Daily traffic × % exposed)

For unequal allocation, calculate each arm separately:
Days per arm = Required sample for that arm / (Daily eligible traffic × Exposure fraction × Arm allocation fraction)
Total collection time = longest arm duration
```

- Use fractions for exposure and allocation (50% = 0.5). Count eligible randomized units consistently with the sample-size calculation; repeat pageviews are not additional participants. The balanced formula assumes equal sample requirements and equal allocation.
- **High-traffic page:** 10,000 per variant (20,000 total), 5,000 visitors a day, 100% exposed: 20,000 / 5,000 = **4 days**.
- **Medium-traffic page:** 30,000 per variant (60,000 total), 2,000 a day, 100% exposed: **30 days**.
- **Low traffic, partial exposure:** 15,000 per variant (30,000 total), 500 a day, 50% exposed (250 effective a day): **120 days**, too long.
- **Unequal split check:** 2,000 participants required per arm and 1,000 eligible a day: two arms at 50/50 with full exposure take four days, not two; at 50% exposure, eight days; with full exposure at 90/10, the smaller arm needs 20 days to reach 2,000. These are collection estimates; honor planned business cycles and the analysis stopping rule.
- In PostHog the same arithmetic is `exposure_rate_per_day` times the rollout share ([posthog EXPERIMENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENTS.md#running-time)).

## Minimum and maximum duration

[coreyhaines31/marketingskills, ab-testing]

- **Run at least 1 full week** to capture day-of-week variation; **2 business cycles** if B2B (weekday vs weekend patterns); **through paydays** if e-commerce (beginning and end of month). PostHog's agent skills say "Experiments typically need 1-2 weeks minimum for reliable results".
- **Avoid running longer than 4 to 8 weeks:** novelty effects wear off, external factors intervene, and other tests wait. This is the source's practice, not a statistical rule; PostHog's running-time guidance says to call out anything over about 8 weeks and propose a more frequent earlier event as primary.

## Multiple variants

[coreyhaines31/marketingskills, ab-testing], clarified:

- **Total sample grows with the number of arms** at the same per-arm n: 3 arms need 1.5 times the total of 2, 4 arms need 2 times. With 5 or more, consider reducing variants.
- **Correcting for multiple comparisons raises the per-arm n on top of that.** More comparisons (A vs B, A vs C, sometimes B vs C) raise the chance of a false positive. With Bonferroni at α/2 for two comparisons, 5% at +10% rises from about 31,200 to about 37,800 per arm (about 1.2 times; recomputed). The source's table ("3 variants ~1.5x, 4 ~2x") blended the two increases and attributed them to false positives.
- Apply Bonferroni or use a tool that handles it; PostHog applies no correction ([posthog EXPERIMENT-SIGNIFICANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c4-multiple-comparisons-high)).

## Common sample-size mistakes

[coreyhaines31/marketingskills, ab-testing]

1. **Underpowered tests:** not enough sample to detect realistic effects. Be realistic about the MDE, get more traffic, or don't test.
2. **Overpowered tests:** waiting for the sample size when you already have significance. "This is actually fine - you committed to sample size, honor it."
3. **Wrong baseline:** use the specific metric and page, not site-wide averages.
4. **Ignoring segments:** if you plan segment analysis, calculate the sample for the smallest segment.
5. **Testing too many things:** dividing traffic too many ways. Prioritize ruthlessly; run fewer concurrent tests.

## When the sample is too high

[coreyhaines31/marketingskills, ab-testing]

1. **Increase the MDE:** accept only detecting larger effects (20%+ lift).
2. **Lower confidence:** use 90% instead of 95% (risky; document it).
3. **Reduce variants:** test only the most promising one.
4. **Combine traffic:** test across multiple similar pages.
5. **Test upstream:** earlier in the funnel, where traffic is higher. PostHog's version: make a more frequent earlier event the primary and keep the rare one secondary.
6. **Don't test:** decide on qualitative data instead.
7. **Longer test:** accept weeks or months.

## Sequential testing

- [coreyhaines31/marketingskills, ab-testing] A method that adjusts for multiple looks at the data. Use it for high-risk changes, to stop bad variants early, or for time-sensitive decisions. The trade-off: more flexibility to stop early, a slightly larger sample, a more complex analysis.
- **Which tools have it.** The source listed "Optimizely (Stats Accelerator), VWO (SmartStats), PostHog (Bayesian approach)"; two of those are wrong:
  - **Optimizely:** "Stats Accelerator's statistical model is a variation of a multi-armed bandit" ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/experimentation-distribution-methods)), and its modes "dynamically change a test's traffic allocation" ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/history-of-stats-accelerator-and-multi-armed-bandits)); "Sequential testing at Optimizely is based on Optimizely's proprietary Stats Engine" ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/statistical-analysis-methods-overview)), which controls the false discovery rate ([Optimizely](https://docs.optimizely.com/experimentation-strategy/docs/false-discovery-rate-control)).
  - **PostHog:** sequential testing is a Frequentist option that produces confidence sequences, based on Waudby-Smith et al. 2023 ([posthog.com](https://posthog.com/docs/experiments/statistics-frequentist)); Bayesian has no sequential mode ([posthog EXPERIMENT-SIGNIFICANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c1-peeking-high)).
  - **VWO SmartStats** is VWO's Bayesian engine; whether it is sequential was not checked against VWO's docs.
- Turn sequential testing on before launch ([posthog EXPERIMENT-SIGNIFICANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EXPERIMENT-SIGNIFICANCE.md#c1-peeking-high)).

## Calculators

[coreyhaines31/marketingskills, ab-testing] (URLs as the source gives them):

- Evan Miller: https://www.evanmiller.org/ab-testing/sample-size.html
- Optimizely: https://www.optimizely.com/sample-size-calculator/
- AB Test Guide (includes a Bayesian option): https://www.abtestguide.com/calc/
- VWO duration calculator: https://vwo.com/tools/ab-test-duration-calculator/

## Can I run this test?

[coreyhaines31/marketingskills, ab-testing]

```
Daily eligible traffic (randomization units): _____
Fraction exposed to the experiment: _____
Number of arms (including control): _____
Allocation fraction for each arm: _____
Baseline conversion rate: _____
MDE I care about: _____

Sample needed per variant: _____ (from a calculator, settings stated)
Balanced allocation: Days = Sample per arm × Number of arms / (Daily eligible traffic × Exposure fraction)
Unequal allocation: Days = max across arms of [Sample required for arm / (Daily eligible traffic × Exposure fraction × Arm allocation)]
Round collection time up, then apply the minimum-duration rules above.

If days > 60: Consider alternatives
If days > 30: Acceptable for high-impact tests
If days < 14: Likely feasible
If days < 7: Easy to run, consider running longer anyway
```

The day thresholds are the source's heuristic.

## Prove it

The sample size in a plan states its baseline (for that page and metric), MDE, α, power and the calculator used, and matches a recomputation; the duration uses eligible randomized units, the exposure fraction and the smallest arm's allocation; it covers at least one full week (two business cycles for B2B); a plan with segment analysis is sized for the smallest segment; and any sequential-testing claim names a tool that actually offers it.
