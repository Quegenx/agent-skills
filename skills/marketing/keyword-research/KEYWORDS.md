# Keyword research

Turn seed topics into a prioritized set of keywords the site can win, each tied to the page that should rank for it. The workflow is every-app/open-seo's `keyword-research` skill (MIT, Copyright (c) 2026 Ben Senescu), with its OpenSEO tool calls reduced to the job they do; the data provider behind OpenSEO is DataForSEO, and the same steps work with any keyword-data provider. Project facts come from the context file in [seo PROJECT-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md); the report is written as in [seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md).

## Inputs

[open-seo, keyword-research]
- One or more seed topics, products, pages, competitors or audience problems.
- Optional market, location and language. If they are unclear and "would materially affect keyword metrics, ask the user; otherwise use the MCP tool defaults."
- The business overview and current goal from the context file. If either is empty, run the minimal inline setup in [seo PROJECT-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PROJECT-SETUP.md#minimal-inline-setup) and continue.
- Check the research log first: if the same research ran within the last 30 days, reuse it and say so.

## Start from first-party demand

[open-seo, keyword-research] When Search Console is connected, start from the site's real demand: queries already earning impressions and near-ranking ("striking distance") terms. The source's filter is position 5 to 20 with at least 50 impressions. Attach difficulty (KD) and intent to those queries, and "work it before broad discovery": that ranked list is the fastest opportunity set.

- The Search Console API cannot do this filter for you. It filters only on country, device, page, query and searchAppearance, and "Results are sorted by click count, in descending order, unless you group by date" ([Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)). Fetch the query rows, then filter by position and impressions yourself. The source says the same: "Google sorts by clicks and can't filter by position itself".
- How to pull the rows, and the limits that make a fetch partial, are in [search-console API.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/API.md). The striking-distance and quick-win bands one Search Console tool uses are in [search-console OPPORTUNITY-SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/OPPORTUNITY-SECTIONS.md#position-bands).

## The workflow

[open-seo, keyword-research]
1. Normalize the seeds into a small set of distinct research angles. Pull the striking-distance queries first (above).
2. **Local requests:** identify the business, its location or coordinates or service area, and its local categories. Research volume for that city or county, and check the local pack and Maps for the most important location and keyword set "instead of relying only on national keyword/SERP data." With DataForSEO through OpenSEO, a city, county or region location makes "volume, CPC, and competition become local; keyword ideas, KD, and intent stay national" (a provider behaviour, not a rule of search). Local pack work is in [seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md).
3. Run discovery on the exploratory seeds, in bulk where the provider allows.
4. Attach volume, KD and intent to any fixed list (including the striking-distance queries) before prioritizing.
5. When the user gives a domain or page and wants opportunities from current rankings, near-misses or competitor-owned terms, pull that domain's ranked keywords ([SEO-COMPETITORS.md](SEO-COMPETITORS.md)).
6. "Remove irrelevant, duplicate, branded-only, and off-intent terms."
7. Prioritize "by practical opportunity, not volume alone":
   - strong match to the user's product, page or topic;
   - clear search intent;
   - reasonable difficulty;
   - a useful volume or CPC signal;
   - a SERP where the user can plausibly compete;
   - for local SEO, local-pack and Maps visibility and proximity fit.
8. Check the live SERP for high-potential or ambiguous keywords "when SERP intent would change the recommendation; keep the default check small." Get live SERP listings from a licensed SERP data provider, never by scraping Google: its spam policies list "scraping results for rank-checking purposes or other types of automated access to Google Search conducted without permission" ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).
9. Present a shortlist and a longer opportunity table.
10. Ask before saving keywords. When saving, suggest concise tags such as `topic:<topic>`, `intent:<intent>` or `page:<slug>`.

Then, if the keywords need mapping to pages, run [CLUSTERING.md](CLUSTERING.md).

### Search Console and SERP evidence

Search Console supplies the owned site's query/page performance and average position; it does not supply a complete current listing of competitors and SERP features. The old line called Search Console a source of live SERPs. Keep that evidence separate from a licensed provider's result-page listing. [Google Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query); [Search Console API](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/API.md)

## Rank tracking

[openseo.so, /features/rank-tracking and /docs/mcp] OpenSEO's guidance for what to track: "Twenty to fifty terms from Search Console, priced before they go in." Tracking runs desktop, mobile or both per tracked domain. A local business "needs a grid before a tracker" (the Maps rank at each point of a grid around the business; see [seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md)). Only these headlines were read; the library article behind them was not.

## The report

[open-seo, keyword-research] `h1`: the site or topic. Sections in this order:

1. **The opportunity:** one or two opening sentences naming the best theme and why the site can win it now.
2. **Target these now:** a table of keyword, intent, volume, KD, CPC and the page to make, plus a bar chart comparing the shortlist's volumes.
3. **Why these:** one finding per keyword that needs justifying: the SERP or metric evidence, then the page to build.
4. **The longer opportunity list:** a second table, same columns.
5. **Risks and caveats:** SERP intent that would change the recommendation, missing metrics written as `unknown`, "close-variant volumes that are one bucket rather than several."
6. **What to do next:** an ordered list, including whether to run keyword clustering, write a content brief ([content-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md)) or save the chosen keywords.
7. **How this report was made:** which tools returned what ([seo SEO-REPORTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SEO-REPORTS.md#how-this-report-was-made)).

## Guardrails

[open-seo, keyword-research]
- "Do not invent metrics." If the provider does not return a value, write `unknown`.
- Do not save keywords without explicit confirmation.
- "Prefer business-fit and intent-fit over chasing the largest volume term."
- [iannuttall/seo, SKILL.md; README.md] Provider numbers are estimates; "Search Console stays the record of what your own site actually got" ([search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md)).

## Prove it

Every shortlisted keyword has intent, volume, KD and CPC filled or written `unknown`, and a target page; the striking-distance rows were filtered after fetching and the report says which window and filter; no keyword is ranked on volume alone; branded-only and off-intent terms are gone; every live SERP listing came from a licensed provider and Search Console positions are identified as averages; nothing was saved or tagged before the user confirmed; and the research log has one line for this run.
