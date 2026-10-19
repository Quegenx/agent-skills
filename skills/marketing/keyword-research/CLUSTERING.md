# Keyword clustering

Group keywords into page-level clusters and decide which existing or new page targets each one. In the source's words it is "a keyword mapping workflow, not just a semantic grouping exercise": every cluster ends at a page. The workflow is every-app/open-seo's `keyword-clustering` skill (MIT, Copyright (c) 2026 Ben Senescu), with its OpenSEO tool calls reduced to the job they do.

## Inputs

[open-seo, keyword-clustering]
- A keyword list, a saved keyword tag, a seed topic or a target domain. Without a list, use saved keywords, run discovery on the seed ([KEYWORDS.md](KEYWORDS.md)), or pull the domain's ranked keywords.
- Optional existing URLs to map against.
- The key pages from the context file: they are the existing pages clusters map to, and the business and goal decide which clusters are worth targeting. If none are saved, run the minimal inline setup in [seo PROJECT-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md#minimal-inline-setup): ask for the pages that matter, or propose a shortlist from the site, an audit or Search Console and confirm it.

## The workflow

[open-seo, keyword-clustering]
1. Gather the candidate set. With Search Console connected, pull real queries with the dimensions query and page, to start from real queries and the pages already ranking for them ([search-console API.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/API.md)). Use ranked keywords for domain or page driven clustering. Use local business and local SERP results when proximity, local packs or Google Business results decide whether terms belong on location pages.
2. "Remove duplicates, irrelevant terms, and terms that clearly require a different product or audience."
3. Build clusters around intent and page type:
   - "Same SERP intent and similar ranking pages belong together."
   - "Different intent, buyer stage, or SERP format should be split."
   - "Similar words do not guarantee the same cluster."
4. For important borderline terms, check SERP overlap with a small batch of live SERPs (from a licensed provider; see [KEYWORDS.md](KEYWORDS.md#the-workflow) step 8).
5. Assign each cluster to one of:
   - an existing URL, if supplied and appropriate;
   - a new page recommendation, if no existing page fits;
   - a do-not-target or later bucket, if weak or off-strategy.
6. Name cannibalization risk "when multiple pages would target the same intent." With Search Console connected, confirm it from real data with the dimensions query and page: "the same query sending impressions to multiple URLs." Report it only with that evidence. One Search Console tool's cannibalization section is described in [search-console OPPORTUNITY-SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/OPPORTUNITY-SECTIONS.md#the-sections).
7. Ask before applying cluster tags.

Query and page grouping has a data cost: Google says "when you group by page and/or query, our system may drop some data" ([all your data](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data)). A query that sends impressions to two URLs is evidence; a query missing from the rows is not evidence of anything.

## The report

[open-seo, keyword-clustering] `h1`: the site or keyword set. Sections in this order:

1. **The map:** one or two opening sentences: how many clusters, how many pages to create, how many to update, and any cannibalization found.
2. **Clusters:** a table of cluster, primary keyword, intent, target page and priority. "Keep secondary keywords in the per-cluster briefs, not in this table."
3. **Page briefs:** one finding per cluster: the page type and the searcher's problem, then the page to create or update. List required sections and internal links underneath. Writing the page itself is [content-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md); comparison and alternatives clusters go to [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md).
4. **Cannibalization:** a table of the query, the competing URLs and which one to keep, "only when there is real evidence for it."
5. **What to do next:** an ordered list, including the tag suggestions and the explicit ask before applying them.
6. **How this report was made:** where the keywords came from, and a note labelling target pages as proposed when no URL data was supplied ([seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md#how-this-report-was-made)).

## Guardrails

[open-seo, keyword-clustering]
- "Do not over-cluster tiny keyword sets. If there are fewer than 10 usable terms, produce a simple map."
- "Do not rely on lexical similarity alone. SERP intent wins."
- "Do not replace tags broadly without explicit confirmation."
- "If existing URL data is missing, label target pages as proposed."

## Prove it

Every cluster has one primary keyword, an intent and exactly one target (existing URL, proposed page, or the later bucket); clusters that merged on shared words alone were checked against SERP overlap; every cannibalization row names the query, at least two URLs from Search Console query and page rows, and the URL to keep; a set under 10 terms got a simple map; and no tag was written before the user said yes.
