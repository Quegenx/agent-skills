# Opportunity sections and their heuristics

What the usual Search Console opportunity sections (quick wins, low CTR, striking distance, decay, cannibalization) actually compute, using iannuttall/seo's source as the worked example (Apache-2.0, Copyright 2026 Ian Nuttall; `packages/core/src/analyze/site-ctr-curve.ts`, `opportunity-primitives.ts`, `min-impressions-policy.ts`, `striking-distance-analysis-primitives.ts`, `shared.ts`). Every threshold, curve and score below is the tool's own heuristic, labelled as such in its code; none is a Google number. They point at rows worth a look and prove nothing ([SKILL.md](SKILL.md#the-rules)). Running the tool is [SEO-CLI.md](SEO-CLI.md).

## The sections

[iannuttall/seo, SKILL.md] `overview`, `quick-wins`, `low-ctr`, `striking-distance`, `second-page`, `content-decay`, `cannibalization`, `traffic-drop`, `bing`. Run the report without a section first: it shows totals against the previous period, the pages and queries that moved, and a short count with top rows per section; then pick the one section that matters. "Page sections check their top 20 URLs live and merge same-site redirects."

## Position bands

[iannuttall/seo, site-ctr-curve.ts]
- **low-ctr** (CTR underperformers): average position below 4, where "the open question is the title, snippet and result features".
- **quick-wins:** average position 4 to 10, "a near-top gain to review".
- **striking-distance** and **second-page:** "positions above 10 through 20".

Other tools draw the band differently: OpenSEO's keyword research uses position 5 to 20 with at least 50 impressions [open-seo, keyword-research]. State the band you used.

## Expected CTR by position

[iannuttall/seo, shared.ts `CTR_BASELINE`] The fallback curve, labelled `built_in_heuristic` in the code (no official source exists for these numbers):

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| CTR | 0.27 | 0.15 | 0.10 | 0.07 | 0.05 | 0.035 | 0.025 | 0.02 | 0.015 | 0.012 |

Positions are rounded and clamped to 1 to 10, with 0.01 when nothing matches.

[iannuttall/seo, site-ctr-curve.ts; opportunity-primitives.ts] The tool prefers a curve from the site's own rows (method `position_bucket_url_p75_v2`):
1. Take non-brand, actionable query and page rows at positions 1 to 10 and bucket them by rounded position.
2. Per URL, sum clicks and impressions; count a URL only at 30 or more impressions.
3. Use the bucket's 75th-percentile URL CTR only when it has at least 1,000 qualified impressions, at least 5 URL samples and at least 3 URLs with positive CTR; otherwise use the fallback.
4. Clamp the site value to 0.5x to 1.5x of the fallback, smooth it so CTR never rises as position gets worse, and leave the target URL out of its own benchmark.

## Minimum impressions per row

[iannuttall/seo, min-impressions-policy.ts] Default: 1 row per 5,000 retained impressions (share 0.0002), rounded up, then bounded. Position sections use a floor of 10 and a ceiling of 100; CTR sections (quick-wins, low-ctr) a floor of 30 and a ceiling of 200. The reasoning: "At 10 impressions one click moves CTR by ten points, and a row at position 3 with zero clicks is flagged about a third of the time by chance." Low CTR means below 0.6x the expected CTR, and "a row exactly at a 10% expected CTR falls below the 0.6x low-ctr threshold about 18% of the time", so those items "stay low confidence".

## Striking-distance priority

[iannuttall/seo, striking-distance-analysis-primitives.ts]
- `score = impressions × clamp((21 − position) / 10, 0.1, 1)`, method `impressions_x_position_proximity`, flagged `heuristic: true` and `estimatedClickLift: false`: it ranks rows, it does not predict clicks.
- Valid rows need clicks no greater than impressions, CTR between 0 and 1, and position above 0.
- The default action: "Inspect indexability, canonical state, current query coverage, competing URLs, and relevant internal links for <url> before choosing a change."
- Rows are grouped by URL template; a shared-template change is suggested only when the template confidence is not low and the group has at least 2 URLs.

## Query coverage check

[iannuttall/seo, opportunity-primitives.ts] Checks whether the query's tokens longer than 2 characters appear in the title, meta description, H1 and opening copy. For scripts where no token qualifies it reports `coverage_not_evaluated_for_script` and gives no verdict. When every field already matches: "Avoid a blind rewrite; compare SERP intent, snippets, and competing titles before changing the page." Title and snippet rules themselves are in [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md).

## Questions worth asking the data

[openseo.so, /google-search-console-mcp] Page-two queries close to page one (striking distance); impressions up while clicks stay flat (a title or meta problem to check); posts competing for the same query (cannibalization; mapping the fix is [keyword-research CLUSTERING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/CLUSTERING.md)); "Is /pricing indexed?"; the biggest click losers over 28 days. The data is clicks, impressions, CTR and position by query, page, country, device and date, and the most recent few days "can be incomplete".

## Prove it

Every flagged row names its band, its expected CTR source (site curve or fallback) and its impressions against the floor; the write-up calls each flag a heuristic and claims no click lift; a low-CTR row near the threshold is marked low confidence; no page was rewritten on a coverage gap without comparing the SERP first; and the window excludes the last incomplete days.
