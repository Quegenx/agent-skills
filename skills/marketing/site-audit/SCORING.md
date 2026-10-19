# Statuses and scores

A score directs attention; the evidence behind each check explains the work. Two pages with the same total can carry completely different risk: one a public exposure, the other a few metadata gaps [freescan]. This file covers how to report what a check found, how the tools compute their numbers, and what the numbers do not say. FreeScan's method (freescan.app blog, "website audit scoring methodology"; no licence) is restated, not copied; squirrelscan's table is MIT ([squirrelscan/skills](https://github.com/squirrelscan/skills)).

## Statuses

[freescan] Keep six statuses distinct and never fold them into pass or fail:

| Status | Means |
|---|---|
| pass | The check ran and the evidence meets it |
| fail | The check ran and the evidence fails it |
| review | Evidence exists but needs a human judgement |
| unknown | The signal could not be verified safely; manual review or a later scan may be the right response |
| N/A | The check does not apply to this page's role (a legal page needs no hero CTA) |
| skipped | The check did not run |

"Missing, unknown, skipped, review, and not-applicable checks are not passes" [freescan]. squirrelscan says the same of its own tools: `analyzed: false` means the rules never ran, so empty findings are "an absence of evidence, not a clean result", and a capped list looks identical to a complete one unless you read `truncation` [squirrelscan]. A passive squirrelscan run skips the rules that probe (`security/graphql-introspection`, `security/graphql-get-mutations`), so it "has not checked for those issues" [squirrelscan]. Print the counts per status beside every score, as FreeScan's fix-prompt files do ("Recorded checks: 40", then fail, review, unknown, skipped, not_applicable and pass counts).

A page that returns HTML but renders no meaningful visible content is failed and left unscored [freescan].

## How FreeScan scores

[freescan, scoring methodology] Restated:

- **Category score** is earned rule points over available rule points, times 100, rounded down. **Overall** is the mean of four equally weighted categories (SEO and answer engines, security, accessibility, design), minus readiness deductions, rounded down. Results are truncated, so 89.9 shows as 89.
- **Unknowns cost points.** An applicable unknown deducts 2, 4, 6 or 8 points by severity, capped at 20 per category.
- **Confidence caps.** High-impact unknown evidence caps the category at 85, high-impact review evidence at 90, and lower-impact unresolved evidence at 88 to 94; the overall score carries a confidence cap of 94 to 98.
- **Bands:** 90 to 100 strong, 70 to 89 needs attention, 0 to 69 high priority, which FreeScan says are "not industry benchmarks".
- **Recommendation rank** combines four inputs, so the first recommendation is not picked by raw point loss alone: severity, the normalized category score loss, a category urgency weight (SEO and security 1.15, accessibility 1.05, design 1.0) and a remediation priority number, where lower is more urgent. The page gives no formula.
- **Rule points lost are not a promise.** Each fix brief states its impact as points lost and "not a predicted overall-score gain".

## A manual marketing-audit alternative

[Yuzzyuk/marketing-os, references/audit-rubric.md] treats unknown evidence as lost coverage, never as scored failure. Its manual rubric renormalizes the score over inspected applicable weight, reporting coverage separately: at least 80% permits a full score, 60 to 79% a provisional score and below 60% no headline score. These are that source's heuristic gates, not industry standards. Keep FreeScan's unknown deductions above as FreeScan's actual method; never blend the two formulas or silently apply one tool's score to another. Findings still use P0 to P3 severity.

## squirrelscan's grade and targets

squirrelscan returns an overall 0 to 100 score with a letter grade (A to F) and a score per category [squirrelscan, OUTPUT-FORMAT.md]. Its targets for the fix loop [squirrelscan, audit-website]:

| Starting score | Target | Expected work |
|---|---|---|
| < 50 (F) | 75+ (C) | Major fixes |
| 50-70 (D) | 85+ (B) | Moderate fixes |
| 70-85 (C) | 90+ (A) | Polish |
| > 85 (B+) | 95+ | Fine-tuning |

Rules carry a level (error, warning, notice) and a rank from 1 to 10: errors first, then high-rank warnings. Its output format documents the levels as `error`, `warning` and `info`, so expect either spelling [squirrelscan]. Sign off against a full crawl, since the quick pass samples only part of the site. A published squirrelscan report "still counts every check the audit ran" but lists only a sample of affected pages, so fix from the local report, not the published one [squirrelscan].

## Audit Kit's scorecard

A hand-scored line per area, each out of 10, then "Overall:" and "Notes:" [audit-kit, src/workspace.ts]: Performance, UX clarity, Conversion path, SEO basics, Trust signals, Mobile experience. Its automated HTML and security scores start at 100 and subtract fixed weights ([CHECKLIST.md](CHECKLIST.md#html-checks-and-what-google-actually-says)).

## Lighthouse bands

Lighthouse's own report colours a category "0 to 49 (red): Poor", "50 to 89 (orange): Needs Improvement" and "90 to 100 (green): Good" ([performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)). Audit Kit tones its Lighthouse numbers at 85 and 65 instead, so an 86 shows green there and orange in Lighthouse: report Lighthouse's bands. Weights, budgets and CI gates: [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md).

## What a score is not

- **Not the work.** "Chasing 100 before fixing the critical path" is a named mistake: a polished total cannot compensate for a blocked form, an exposed secret, a broken canonical or an unusable control [freescan]. Ask for a work order, not a number ([seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md)).
- **Not conformance.** An accessibility score is not WCAG conformance, and an automated public check proves neither accessibility nor security; those need human evaluation and, for security, authenticated review or a penetration test [freescan].

## Benchmarks, disclosed

When a report compares a site against other sites, disclose the population the way FreeScan's 2026 benchmark does [freescan, research/website-audit-benchmarks-2026]: the number of eligible reports and the date window, the method version, one latest report per canonical page, failure rates computed only over reports that contain the check, a floor for a check to appear (FreeScan uses at least 25% of reports and at least 50 reports), and that the dataset is self-selected, not a random sample. FreeScan reports a median overall of 78 (middle half 69 to 85) over 2,017 reports from Jun 29 to Oct 18 2026; quote it only with that label.

## Prove it

Every score in the report sits beside its per-status counts and the scope it covered; no unknown, skipped, review or N/A check is counted as passed; a run that skipped rules (passive probing, discovery probes off, a capped credit budget) says which; Lighthouse numbers use 90 and 50 as the band edges; the before and after scores come from the same tool, level and page scope; and any benchmark comparison states its population, window and selection.
