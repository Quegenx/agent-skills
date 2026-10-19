# SEO competitors

Who wins a search market, why, and where the openings are; then one named competitor in depth. SEO competitors are whoever keeps showing up in the results for the queries you want; "Distinguish SEO competitors from business competitors" [open-seo, competitive-landscape]. The two workflows are every-app/open-seo's `competitive-landscape` and `competitor-analysis` skills (MIT, Copyright (c) 2026 Ben Senescu), with OpenSEO tool calls reduced to the job they do. Business competitors (feature matrix, pricing, battle cards) are [web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md); pages that compare you with them are [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md).

## Which workflow

[open-seo, competitive-landscape; competitor-analysis]
- **Landscape:** "Who is winning this SEO market, what content is working for them, and where are the openings?" Use it for a market-level view across several competitors, or when the market is unclear.
- **One competitor:** analyze one domain "deeply enough to decide what to learn from, avoid, counter-position against, or outrank." Use it for a named competitor.

Both need competitors from the context file. If none are saved, run the minimal inline setup in [seo PROJECT-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md#minimal-inline-setup): ask who they compete with, or infer a shortlist from the SERPs and confirm it. When the user's own domain is in the comparison and Search Console is connected, anchor it with first-party clicks, impressions, CTR and position "rather than third-party estimates" ([search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md)).

## The landscape

[open-seo, competitive-landscape]
1. **Define the query set:** 5 to 10 representative queries of mixed intent: informational, commercial, comparison, and tool or software terms when they apply. For local SEO, add neighbourhood, city and service-area queries and identify the priority locations or coordinates.
2. If the query set is already known, validate relative demand and difficulty, and find the domains that recur across it.
3. **Local:** get local business and local pack results for the highest-priority locations "before synthesizing winners." Organic SERPs complement them; they are not the only local evidence ([seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md)).
4. Inspect live SERPs for representative queries when composition, ranking URLs or SERP features matter (from a licensed provider; keep [Search Console metrics separate](KEYWORDS.md#search-console-and-serp-evidence)). Google's [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) forbid scraping its results for rank checking.
5. Group the recurring domains by type:
   - direct product competitors;
   - publishers and media;
   - marketplaces and directories;
   - communities and forums;
   - documentation and resources.
6. Size the organic footprint of the strongest recurring domains; "default to the top 3-5 domains before expanding."
7. Pull ranked keywords for direct competitors and relevant publishers.
8. Look at backlinks when authority seems to explain the winners or the user asks; continue on SERP and domain evidence if backlink data is unavailable.
9. Synthesize: "content types, themes, SERP formats, local-pack signals, authority advantages, and underserved angles."

**Report** (`h1`: the market or category):
1. **The market read:** one or two sentences naming the leaders, the most winnable area and the biggest barrier.
2. **Who is winning:** a table of domain, type, organic footprint, winning themes and the gap. "Label domain types explicitly."
3. **Why they win:** one finding per pattern, the fix pointing at what the user should do instead.
4. **Gaps and openings:** a table of theme, demand and who currently owns it, plus a bar chart when a handful of themes carry the demand.
5. **What to do next:** an ordered list ending in the next workflow: one competitor in depth, [CLUSTERING.md](CLUSTERING.md), or a content brief.
6. **How this report was made:** the query set used, and "a note calling the read directional when the query set was small."

## One competitor

[open-seo, competitor-analysis]
1. Get the competitor's domain overview (traffic estimate and keyword count) for the given location and language.
2. When comparing, get the user's domain overview too, and with Search Console connected use it as the user's real baseline.
3. Pull the competitor's ranked keywords, filtered to keep rows relevant: maximum rank, minimum search volume, brand terms excluded, chosen result types.
4. When comparing, pull the user's ranked keywords too, or check the shared terms' SERPs "when a lighter check is enough."
5. **Local:** get local business and local SERP results around the relevant locations "before drawing local-pack conclusions." This file formerly excluded all profile Q&A from the old API's shutdown; use the corrected provider/market/availability distinction in [seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md#workflow) for optional Q&A evidence. [open-seo, competitor-analysis]
6. When the user supplied the competitor but its search overlap is unclear, check whether it really competes across the target keyword set.
7. Group its keywords into themes:
   - product and category terms;
   - alternatives and comparisons;
   - templates, tools and calculators;
   - educational guides;
   - branded demand;
   - local and neighbourhood terms when relevant.
8. Look at its backlinks, especially if authority seems to explain rankings; continue without them if unavailable.
9. Check SERPs for important shared or target keywords to compare positioning.
10. Produce a plan: what they do well, where they are vulnerable, which pages and keywords to pursue, what to avoid copying.

**Report** (`h1`: the competitor domain):
1. **Snapshot:** one or two sentences, then a table of the competitor's organic footprint (traffic estimate, keyword count, referring domains), with the user's domain as a second row when comparing.
2. **The biggest lesson:** one finding.
3. **Where they are vulnerable:** one finding per opening, "ordered by how winnable it is."
4. **Keyword themes:** a table of theme, example keywords, volume, and whether the user competes there; a bar chart when a few themes dominate.
5. **Content patterns and authority:** prose, "with a note for anything inferred from keyword rows rather than seen on a page."
6. **What to do next:** an ordered list, shortest useful.
7. **How this report was made:** which tools reported what, and what you checked yourself ([seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md#how-this-report-was-made)).

**The SEO data a competitor profile pulls** [coreyhaines31/marketingskills, competitor-profiling]: a backlinks summary (domain rank, total backlinks, referring domains, spam score) and the referring domains list; ranked keywords (total, top 3, 10 and 100, estimated traffic); a domain rank overview (traffic value, top keywords); keywords for the site (content gaps); competitors by keyword overlap ("may reveal competitors you haven't considered"); the domain intersection with the user's domain; relevant pages (highest traffic); technology detection. The source maps each to a vendor tool; those names are not verified here, so use whatever SEO data source you have and mark a missing field "unavailable". Business-competitor profiles are [web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md).

## Guardrails

[open-seo, competitive-landscape; competitor-analysis]
- "Distinguish SEO competitors from business competitors."
- "Do not assume a publisher is a product competitor; label domain types clearly."
- "Do not overstate exact traffic when OpenSEO returns estimates." Any provider's traffic is an estimate, not measured visits.
- "If using a small query set, call the result directional."
- "For local markets, distinguish organic-page winners from Maps/local-pack winners." Do not infer local-pack strength "from national organic domain metrics alone."
- "Do not treat all competitor keywords as desirable. Filter for business fit."
- "Separate evidence from inference." "Do not infer competitor page/content-type patterns from keyword rows alone; use SERP or web evidence for page-level claims."
- "Do not recommend copying content; recommend a stronger angle or better answer to the same intent."
- "If the user's domain is unavailable, frame the analysis as competitor-only."

## Prove it

Every domain in the landscape table carries one of the five types; the query set mixes intents and its size is stated, with "directional" when it is small; local winners come from local pack results, not national metrics; every claim about a competitor's pages cites a SERP or the page, not keyword rows alone; the user's own numbers come from Search Console when it is connected; and no recommendation tells the user to copy a competitor's content.
