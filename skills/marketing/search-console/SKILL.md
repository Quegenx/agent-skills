---
name: search-console
description: "Reads a site's own Google Search Console data and says only what it shows: why clicks dropped, quick wins, low CTR, striking-distance queries, content decay, cannibalization, index status with URL Inspection, comparing before and after a change, Bing kept apart, the Search Analytics and URL Inspection APIs with their row caps, data loss, Pacific-time dates and quotas, CSV export limits, an OAuth app for a self-hosted tool, and the seo CLI and MCP server. Use when organic traffic or clicks changed, looking for existing pages to improve, checking whether a page is indexed, pulling Search Console data through the API or an agent, or judging an SEO tool's claims about a site."
---

# Search Console

Search Console is the record of what a site actually got from Google Search: clicks, impressions, CTR and average position by query, page, country, device and date, plus the indexed state of a URL. Everything else (provider volumes, traffic estimates, curve-based flags) is an estimate laid beside it. The evidence rules and the common jobs come from iannuttall/seo, an agent skill with a Search Console CLI and MCP server (Apache-2.0, Copyright 2026 Ian Nuttall); the Search Console parts of every-app/open-seo (MIT, Copyright (c) 2026 Ben Senescu) add the self-hosting and export notes; limits and behaviour are quoted from Google's Search Console API docs. Choosing keywords from this data is [keyword-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md); technical and on-page SEO is [seo SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md); Google Analytics is [google-analytics SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Search Analytics and URL Inspection requests, scopes, row caps and data loss, PT dates and freshness, quotas, errors, CSV exports, a self-hosted OAuth app | [API.md](API.md) |
| What quick wins, low CTR, striking distance and the other sections compute: position bands, the CTR curve, minimum impressions, the striking-distance score, query coverage, questions worth asking | [OPPORTUNITY-SECTIONS.md](OPPORTUNITY-SECTIONS.md) |
| The seo CLI and MCP server: install, sign-in, commands, flags, research keys, Analytics and Clicky, CI with a service account | [SEO-CLI.md](SEO-CLI.md) |

## Common jobs

[iannuttall/seo, SKILL.md] Commands are the seo CLI's ([SEO-CLI.md](SEO-CLI.md)); with another tool, run the same reads.

| Job | Commands |
|---|---|
| Traffic or clicks dropped | `report`, then `compare` with the date the drop started, then `page` |
| More clicks from existing pages | `report` with the quick-wins, low-ctr or striking-distance section, then `page` |
| Pages losing clicks over time | `report` with the content-decay section, then `index` |
| Page missing from Google or lost all its clicks | `index`, then `page` |
| Two pages compete for one query | `report` with the cannibalization section, then `page` on each URL |
| A site change or Google update | `compare` with its date |
| Keyword and competitor research | `research` with keyword_metrics, serp, ranked_keywords or competitors |
| Backlinks | `research` with backlinks |
| Technical issues on a site | `crawl` |
| Internal links to a page | `internal-links` |
| A question the report does not answer | `data` |

## The rules

1. **Name missing, partial, capped or filtered data before you interpret it.** "It never supports a zero or an all-clear." The API returns top rows, not all rows, caps a day at 50,000 rows per search type and drops data when grouped by page or query ([API.md](API.md#what-a-pull-can-miss)) [iannuttall/seo, SKILL.md].
2. **Keep sources apart.** "Keep Search Console, analytics, live page checks and provider estimates apart. Query rows do not add up to site totals." Keep each source's metric names: "A Clicky visit is not a Google Analytics session or user" [iannuttall/seo, SKILL.md; AGENTS.md].
3. **Keep zero, missing, unavailable, filtered, partial and capped as distinct states,** and "Do not claim causation, ranking impact or indexing unless the evidence shows that exact thing" [iannuttall/seo, AGENTS.md]. Missing Search Console access "is a coverage gap, not a blocker" [open-seo, seo-audit].
4. **Flags are heuristics.** "Flags such as likely-automated queries and curve-based CTR gaps are heuristics. They point to rows worth a look; they prove nothing" ([OPPORTUNITY-SECTIONS.md](OPPORTUNITY-SECTIONS.md)) [iannuttall/seo, SKILL.md].
5. **"A Google update in the same window is timing, not cause."** [iannuttall/seo, SKILL.md]
6. **Intentional `noindex`, canonicals and redirects are observations** "until the person says they are wrong." landing-page-ui sets "`noindex, follow` for pages that should not rank" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)); an audit reports such a page, it does not "fix" it [iannuttall/seo, SKILL.md].
7. **Never add Bing to Google.** "Bing lists only its top rows by week, so a missing row is unknown, not zero" [iannuttall/seo, SKILL.md].
8. **URL Inspection reports the indexed version only.** "you cannot test the indexability of a live URL" with it, so pair it with a live check of the page ([index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)).
9. **Rankings come from Search Console or a licensed SERP provider, never from scraping Google,** which its spam policies forbid: "scraping results for rank-checking purposes or other types of automated access to Google Search conducted without permission" ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).
10. **"Show the facts in a table and ask before you edit any page."** [iannuttall/seo, SKILL.md]
11. **Check a change by running the same read again** "over a later, complete window." "Nothing here promises clicks, rankings or indexing" [iannuttall/seo, README.md].
12. **Read only what you need:** a read-only scope (`webmasters.readonly`), the summary before rows, and the property listed before the first call ([API.md](API.md#search-analytics); [SEO-CLI.md](SEO-CLI.md#flags)).

Search Console's Generative AI performance report is in [ai-search-visibility MEASUREMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/MEASUREMENT.md); visibility in AI assistants generally is [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).

## Prove it

Every claim in the write-up names its source (Search Console, analytics, live check or provider estimate) and its window; capped, filtered or missing data is named before any conclusion and no "zero" rests on a missing row; Bing numbers sit beside Google's, never added; a drop that coincides with a Google update is called timing; intentional noindex pages are listed as observations; index claims come from URL Inspection plus a live check; no ranking came from scraping Google; no page was edited before the user saw the table and agreed; and the fix is checked by the same read over a later complete window.
