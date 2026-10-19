# Lead scoring

Fit, engagement and negative scoring, example models, and how to set and recalibrate a threshold without fooling yourself. From coreyhaines31/marketingskills, skill `revops` (SKILL.md and references/scoring-models.md, MIT), with HubSpot's Lead Scoring tool documentation where the source's HubSpot details are out of date. The point values are the source's illustrative templates, not benchmarks; the calibration method decides the real ones.

**Contents:** [Dimensions](#dimensions) · [Fit template](#fit-template) · [Engagement template](#engagement-template) · [Negative signals](#negative-signals) · [Example models](#example-models) · [Common mistakes](#common-mistakes) · [Threshold calibration](#threshold-calibration) · [Recalibration](#recalibration) · [HubSpot's Lead Scoring tool](#hubspots-lead-scoring-tool) · [Prove it](#prove-it)

## Dimensions

[coreyhaines31/marketingskills, revops]

- **Explicit (fit), who they are:** company size, industry, revenue; job title, seniority, department; tech stack, geography.
- **Implicit (engagement), what they do:** page visits (especially pricing, demo, case studies); content downloads, webinar attendance; email engagement (opens, clicks); product usage (for PLG).
- **Negative, disqualifying signals:** competitor email domains; student or personal email; unsubscribes, spam complaints; job title mismatches (intern, student).

Building a model:

1. Define your ICP attributes and weight them.
2. Identify high-intent signals from an eligible cohort with won and lost outcomes, using only features available at the qualification decision.
3. Set point values for each attribute and behavior.
4. Set the MQL threshold (the source: "typically 50-80 points on a 100-point scale"; see the scale note in [LIFECYCLE.md](LIFECYCLE.md#mql-criteria-templates)).
5. Freeze the rule and test a later, fully observed holdout against the current routing baseline; report precision, recall, missed wins, false positives, and workload.
6. Pilot with monitoring and rollback; tune on development cohorts and preserve an untouched holdout for each promotion.

## Fit template

[coreyhaines31/marketingskills, revops]

| Attribute | Criteria | Points |
|---|---|---|
| Company size | 1-10 / 11-50 / 51-200 / 201-1000 employees | +5 / +10 / +15 / +20 |
| | 1000+ employees | +15 (unless enterprise-focused, then +25) |
| Industry | Primary / secondary / non-target | +20 / +10 / 0 |
| Revenue | Under $1M / $1M-$10M / $10M-$100M / $100M+ | +5 / +10 / +15 / +20 |
| Geography | Primary / secondary / non-target market | +10 / +5 / 0 |
| Job title | C-suite (CEO, CTO, CMO) / VP / Director / Manager / Individual contributor | +25 / +20 / +15 / +10 / +5 |
| Department | Primary buying / adjacent / unrelated | +15 / +5 / 0 |
| Seniority | Decision maker / influencer / end user | +20 / +10 / +5 |
| Tech stack | Uses complementary tool / uses competitor ("they understand the category") / uses tool you replace | +15 / +10 / +20 |
| Tech maturity | Modern stack (cloud, SaaS-forward) / legacy stack | +10 / +5 |

## Engagement template

[coreyhaines31/marketingskills, revops] The source gives each signal a decay in fixed points per week or month. That is a platform-neutral sketch: HubSpot, for one, decays by a percentage of the original event value at intervals of 1, 3, 6 or 12 months ([HubSpot's Lead Scoring tool](#hubspots-lead-scoring-tool)), so restate the decay in your tool's terms.

| Intent | Signal | Points | Source's decay |
|---|---|---|---|
| High | Demo request | +30 | None |
| High | Pricing page visit | +20 | -5 per week |
| High | Free trial signup | +25 | None |
| High | Contact sales form | +30 | None |
| High | Case study page (2+) | +15 | -5 per 2 weeks |
| High | Comparison page visit | +15 | -5 per week |
| High | ROI calculator used | +20 | -5 per 2 weeks |
| Medium | Webinar registration | +10 | -5 per month |
| Medium | Webinar attendance | +15 | -5 per month |
| Medium | Whitepaper download | +10 | -5 per month |
| Medium | Blog visit (3+ in a week) | +10 | -5 per 2 weeks |
| Medium | Email click | +5 per click | -2 per month |
| Medium | Email open (3+) | +5 | -2 per month |
| Medium | Social media engagement | +5 | -2 per month |
| Low | Single blog visit | +2 | -2 per month |
| Low | Newsletter open | +2 | -1 per month |
| Low | Single email open | +1 | -1 per month |
| Low | Visited homepage only | +1 | -1 per week |
| PLG usage | Created account | +15 | None |
| PLG usage | Completed onboarding | +20 | None |
| PLG usage | Used core feature (3+ times) | +25 | -5 per month inactive |
| PLG usage | Invited team member | +25 | None |
| PLG usage | Hit usage limit | +20 | -10 per month |
| PLG usage | Exported data | +10 | -5 per month |
| PLG usage | Connected integration | +15 | None |
| PLG usage | Daily active for 5+ days | +20 | -10 per 2 weeks inactive |

On email opens, Google notes that low open rates "aren't necessarily an accurate indicator of deliverability" ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md)). Product-usage events come from the product analytics ([posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md)).

## Negative signals

[coreyhaines31/marketingskills, revops]

| Signal | Points | Notes |
|---|---|---|
| Competitor email domain | -50 | Auto-flag for review |
| Student email (.edu) | -30 | May still be valid in some cases |
| Personal email (gmail, yahoo) | -10 | Less relevant for B2B; adjust for SMB |
| Unsubscribe from emails | -20 | Reduce engagement score |
| Bounce (hard) | -50 | Remove from scoring |
| Spam complaint | -100 | Remove from all sequences |
| Job title: Student/Intern | -25 | Low buying authority |
| Job title: Consultant | -10 | May be evaluating for client |
| No website visit in 90 days | -15 | Score decay |
| Invalid phone number | -10 | Data quality signal |
| Careers page visitor only | -30 | Likely a job seeker |

An unsubscribe, hard bounce or complaint is also a suppression, not only a score change: the CRM mirrors the email suppression list ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#suppression-list)) and the contact moves to Suppressed ([LIFECYCLE.md](LIFECYCLE.md#outbound-stages)).

## Example models

[coreyhaines31/marketingskills, revops]

| Model | Weight | Fit criteria | Engagement criteria | Negative | Threshold | Recalibration |
|---|---|---|---|---|---|---|
| PLG SaaS (ACV $500-$5K) | 30% fit / 70% engagement (heavily favor product usage) | Company size 10-500 +15; target industry +10; Manager+ role +10; uses complementary tool +10 | Created free account +15; completed onboarding +20; used core feature 3+ times +25; invited team member +25; hit usage limit +20; pricing page visit +15 | Personal email -10; no login in 14 days -15; competitor domain -50 | 60 | Monthly (fast feedback loop with high volume) |
| Enterprise sales-led (ACV $50K+) | 60% fit / 40% engagement (fit is critical at this ACV) | Company size 500+ +20; revenue $50M+ +15; target industry +15; VP+ title +20; decision maker confirmed +15; uses competitor +10 | Demo request +30; multiple stakeholders engaged +20; attended executive webinar +15; downloaded ROI guide +10; visited pricing page 2+ +15 | Company too small (<100) -30; individual contributor only -15; competitor domain -50 | 75 | Quarterly (longer sales cycles, smaller sample size) |
| Mid-market hybrid (ACV $5K-$25K) | 50% fit / 50% engagement | Company size 50-1000 +15; target industry +10; Manager-VP title +15; target geography +10; uses complementary tool +10 | Demo request or trial signup +25; pricing page visit +15; case study download +10; webinar attendance +10; email engagement (3+ clicks) +10; blog visits (5+ pages) +10 | Personal email -10; no engagement in 30 days -10; competitor domain -50; student/intern title -25 | 65 | Quarterly |

The lifecycle templates in [LIFECYCLE.md](LIFECYCLE.md#mql-criteria-templates) use slightly different weights and thresholds for the same business types (PLG 40/60 at 65, enterprise 60/40 at 70); both are the source's starting points, and calibration replaces them.

## Common mistakes

[coreyhaines31/marketingskills, revops]

- Weighting content downloads too heavily ("research ≠ buying intent").
- Not including negative scoring (lets bad leads through).
- Setting and forgetting (buyer behavior changes; recalibrate quarterly).
- Scoring all page visits equally (pricing page ≠ blog post).

## Threshold calibration

[coreyhaines31/marketingskills, revops] Setting the initial threshold:

1. **Define the decision and outcome first.** For example, score an eligible lead at its first qualification review and predict a win within the next 90 days. Use a horizon appropriate to your sales cycle. Select the full eligible lead cohort, including leads never promoted to MQL; retain won and lost outcomes, and keep unresolved leads separate until their observation window matures.
2. **Reconstruct features as of that decision time.** Use only attributes and events available then, including the time the CRM actually received them. "Current CRM values and a lead's lifetime activity are not historical snapshots." Exclude later stage changes, close status, onboarding, and teammate invitations when they occurred after the scoring cutoff. Product events before the cutoff remain valid PLG signals. If history is missing, collect snapshots prospectively and label the retrospective evaluation incomplete.
3. **Split before tuning.** Use earlier cohorts to develop weights and choose a threshold, and reserve a later, fully observed cohort as an untouched holdout. Development outcome labels must have matured and been available before the first holdout qualification decision; exclude or delay cohorts whose outcome windows cross that training cutoff. Keep related contacts and deals from the same account from leaking across partitions. Freeze feature rules, weights, and threshold before evaluating the holdout; never tune them on its outcomes. See scikit-learn's [data-leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) and [time-ordered validation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html).
4. **Choose a threshold using costs and sales capacity.** On development data, compare precision (wins among flagged leads), recall (flagged wins among all wins), false positives, missed wins, and workload with the current routing rule. "Capturing 80% of wins alone does not establish a useful threshold: it says nothing about how many non-winners sales must work."
5. **Evaluate the frozen rule on the holdout.** Report cohort dates, cutoff and outcome horizon, eligible and resolved counts, precision/recall, false-positive/negative counts, and expected review cost or contribution under labeled assumptions. Compare the same population with the existing rule. Small or incomplete cohorts are inconclusive; "a retrospective score is not proof of incremental revenue." Pilot with monitoring and a rollback before broad promotion.

**Leakage example (illustrative):** a lead has 20 points at qualification, then earns 20 for onboarding and 25 for inviting a teammate after becoming a customer. Scoring today's record yields 65 and seems to clear a 60-point threshold. The historical qualification score was 20; the later 45 points cannot be used to claim the rule would have identified that win.

The same holdout discipline for agent evals and product experiments is in [agent-evals SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md) and [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## Recalibration

[coreyhaines31/marketingskills, revops]

| Business type | Frequency | Why |
|---|---|---|
| PLG / high volume | Monthly | Fast feedback loop, lots of data |
| Mid-market | Quarterly | Moderate cycle length |
| Enterprise | Quarterly to semi-annually | Long cycles, small sample size |

Steps:

1. **Rebuild the eligible cohort with decision-time snapshots** and mature outcomes, including leads below the threshold; MQL-only data cannot measure missed wins among excluded leads.
2. **Compare the frozen model with actual outcomes and the current routing baseline** on the same population. Report precision, recall, false positives and negatives, and sales workload with sample sizes.
3. **Propose weight and threshold changes on development data only.** Separate market drift from missing history, changed definitions, and delayed outcome labels.
4. **Validate the candidate on a new later holdout** before promotion. A holdout used to choose a change becomes development data; retain another untouched cohort for the next decision.
5. **Version the model and preserve the decision record:** feature cutoff rules, cohort dates, weights, threshold, results, owner, and rollback. Communicate changes to sales and monitor the pilot.

Warning signs the model needs recalibration (the source's thresholds):

- MQL-to-SQL acceptance rate drops below 30%.
- Sales consistently rejects MQLs as "not ready".
- High-scoring leads don't convert; low-scoring leads do.
- MQL volume spikes without corresponding revenue.
- New product or market changes since last calibration.

## HubSpot's Lead Scoring tool

From https://knowledge.hubspot.com/scoring/understand-the-lead-scoring-tool unless marked:

- **Objects:** contacts (Marketing Hub only: engagement, fit, or combined scores; AI-built engagement or fit scores on Marketing Hub Enterprise only); companies (Marketing Hub or Sales Hub: engagement, fit, or combined); deals (Sales Hub only: combined).
- **Score properties:** "When you build a score, a corresponding score property is created that stores the values for that score." You name it during setup. A combined score creates three properties: total, engagement only, fit only.
- **Retroactive:** "When a score is first turned on, records are evaluated retroactively", based on current and historical property values or actions. The source's caution: these capabilities "do not by themselves reconstruct what was known at a past qualification decision", so they are not the decision-time backtest above.
- **Limits:** a score limit (the maximum for the overall score; once reached, no more points are added or removed) and per-group limits that contribute to it; group limits may include decimals.
- **Decay** (engagement or combined event groups): "Score decay intervals can be set to every 1, 3, 6, or 12 months, with each month equal to 30 days." Decay is per event, linear, a percentage of the original event value (50% a month on a 10-point form fill leaves 5 points after a month), and "also applies to historical data."
- **AI scores:** "A minimum sample size of 50 contacts, containing 25 converted and 25 non-converted, is required to generate a score."
- **The legacy "HubSpot Score" property is retired.** The source's recipes trigger on `Contact property "HubSpot Score"`. HubSpot announced that from May 1, 2025 no new score properties could be created in the old tool, and on August 31, 2025 the old score properties stopped updating; scores are recreated in the Lead Scoring tool, available on Marketing Hub Professional and Enterprise (HubSpot Community, posts by HubSpot employees: https://community.hubspot.com/t5/Releases-and-Updates/Navigating-the-Transition-Migrating-from-Legacy-Scoring-to/ba-p/1139800). Trigger workflows on the score property (or threshold property) the Lead Scoring tool created.

## Prove it

The model has fit, engagement and negative parts; its threshold was chosen on development cohorts and reported on an untouched later holdout with precision, recall, false positives, missed wins and workload, against the current rule, with counts; features were reconstructed as of the qualification decision (the leakage example would be caught); related contacts from one account sit in one partition; the model version records cutoff rules, cohorts, weights, threshold, owner and rollback; decay is set in the CRM's own terms; no workflow references the retired "HubSpot Score" property.
