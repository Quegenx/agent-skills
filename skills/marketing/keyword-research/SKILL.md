---
name: keyword-research
description: "Finds the search demand a site can win and maps it to pages: keyword research from Search Console striking-distance queries and provider metrics, prioritizing by fit and intent rather than volume, local demand, rank-tracking sets, clustering by SERP intent with page mapping and cannibalization checks, SEO competitor landscapes and single-competitor analysis. Use when choosing keywords or topics to target, mapping keywords to pages, finding who wins a search market and why, studying a competitor's organic footprint."
---

# Keyword research

Keyword work decides what a site should try to rank for and which page should do it. The demand that matters most is the demand the site already touches: Search Console shows the queries earning impressions, and provider metrics (volume, keyword difficulty, CPC, intent) are estimates layered on top. The workflows come from every-app/open-seo's agent skills `keyword-research`, `keyword-clustering`, `competitive-landscape` and `competitor-analysis` (MIT, Copyright (c) 2026 Ben Senescu), with OpenSEO's tool calls reduced to the job they do so they work with any keyword-data provider; facts are checked against Google's Search Console API and Search Central docs. OpenSEO keeps project facts in its own project context; here they live in `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). Search Console data itself (what the reports mean, the API, its limits) is [search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md); on-page and technical SEO is [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md); demand in AI assistants is [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Seeds to a prioritized keyword set: Search Console striking-distance queries first, the workflow, local demand, prioritizing by fit, rank-tracking sets, the report | [KEYWORDS.md](KEYWORDS.md) |
| Grouping keywords by SERP intent, mapping each cluster to an existing, new or later page, confirming cannibalization from query and page rows | [CLUSTERING.md](CLUSTERING.md) |
| Who wins a search market (query set, domain types, local pack), one competitor's footprint, themes and weak spots, SEO vs business competitors | [SEO-COMPETITORS.md](SEO-COMPETITORS.md) |

Shared SEO [project context and research reuse](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md) and [report delivery](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md), including the [HTML starter](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/REPORT-TEMPLATE.html), live with SEO.

## The rules

1. **Start from first-party demand.** With Search Console connected, pull queries at position 5 to 20 with at least 50 impressions and work them before broad discovery; the API cannot filter by position, so filter after fetching [open-seo, keyword-research; [Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)].
2. **Prioritize by practical opportunity, not volume alone:** product fit, clear intent, reasonable difficulty, a SERP the site can plausibly compete in; "Prefer business-fit and intent-fit over chasing the largest volume term" [open-seo, keyword-research].
3. **SERP intent wins over shared words.** Same intent and similar ranking pages share a cluster; different intent, buyer stage or SERP format split; every cluster maps to one page or the later bucket [open-seo, keyword-clustering].
4. **Claim cannibalization only from evidence:** the same query sending impressions to several URLs in Search Console query and page rows [open-seo, keyword-clustering].
5. **SEO competitors are whoever recurs in the results,** labelled by type (product, publisher, marketplace, community, documentation); "Do not assume a publisher is a product competitor" [open-seo, competitive-landscape].
6. **Never invent a metric.** A value the provider did not return is `unknown`; provider traffic is an estimate, not measured visits; a small query set makes a directional read [open-seo, keyword-research; competitive-landscape].
7. **Separate evidence from inference.** Page-level claims about a competitor need a SERP or the page, not keyword rows alone; recommend a stronger answer to the same intent, never copying [open-seo, competitor-analysis].
8. **Get live SERP listings from a licensed provider;** keep Search Console's own-site metrics and average positions separate ([evidence distinction](KEYWORDS.md#search-console-and-serp-evidence)). Google's spam policies forbid "scraping results for rank-checking purposes" without permission ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).
9. **Reuse before you buy, and log what you bought.** Check the research log for the same research within 30 days; append `<Workflow>: <inputs>. Verdict: <conclusion>` on finish [open-seo, all research skills].
10. **Ask just enough, confirm before saving.** Fill only the missing context a workflow needs; never front-load the full interview; save keywords, tags and facts only after the user confirms [open-seo, seo-project-setup; keyword-research].
11. **Deliver one report with one spine:** verdict first, a few findings, every number printed, and "How this report was made" last; chat gets three bullets and the link [open-seo, seo-report].

## Prove it

The shortlist starts from Search Console rows when they exist and every keyword has a target page and filled or `unknown` metrics; each cluster has one intent and one target; each cannibalization row cites query and page data; each competitor domain has a type and each page-level claim a SERP or page; no SERP was scraped from Google; the research log shows this run and no repeat purchase within 30 days; nothing was saved without a yes; and the report passes the checks in [seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md#prove-it).
