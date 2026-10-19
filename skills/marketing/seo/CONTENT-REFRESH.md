# Content refresh

A content refresh edits a published page that has decayed (outdated stats, stale examples, drifted voice, shifted search intent) while keeping the signals that already make it rank. The method comes from coreyhaines31/marketingskills `copy-editing` v2.2.0, `references/content-refresh.md` (MIT, verbatim where quoted); Google's rules on dates, redirects and word counts are added where the source is incomplete. The sentence-level editing is in [anti-slop-writing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md); planning what to publish next is in [content-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md).

## When to refresh

[coreyhaines31/marketingskills, copy-editing content-refresh.md]

- Traffic declining on a page that used to perform well (Search Console's page report: [search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md)).
- Stats or data more than 12 months old (the source's threshold, not a standard).
- The product changed: features, pricing or positioning no longer match.
- Competitors updated their version of the same content.

The source also says "outdated content gets cited less" by AI search; it gives no source and none was found, so it is not a reason here.

Never refresh only to look fresh. Google's helpful-content questions name it as a warning sign: "Are you changing the date of pages to make them seem fresh when the content has not substantially changed?" and "Are you adding a lot of new content or removing a lot of older content primarily because you believe it will help your search rankings overall by somehow making your site seem "fresh?" (No, it won't)" ([helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

## Refresh or rewrite

| Signal | Action |
|---|---|
| Core message still valid, details outdated | Refresh (update facts, stats, examples) |
| Brand voice has evolved significantly | Refresh + voice rewrite |
| Topic angle or audience has shifted | Full rewrite |
| Page structure doesn't match current search intent | Full rewrite |
| Just needs updated stats and links | Light refresh |

[coreyhaines31/marketingskills, copy-editing content-refresh.md]

## Find the gap first

"A refresh aimed at a ranking page should start from the results page. The first question to answer is why the pages above yours are winning." [coreyhaines31/marketingskills, copy-editing content-refresh.md]

1. **Read the results page for the post's main query.** Note the dominant format (list, guide, tool, comparison), the featured snippet and its format, People Also Ask questions and related searches.
2. **Pick five competitors:** "the top three results, plus any direct competitor or recently updated page ranking near you".
3. **Map coverage** in a grid with your post as the first column:

| Subtopic / element | Your post | Comp 1 | Comp 2 | Comp 3 | Comp 4 | Comp 5 |
|--------------------|:---------:|:------:|:------:|:------:|:------:|:------:|
| [Subtopic A] | ✗ | ✓ | ✓ | ✓ | ✓ | n/a |
| Comparison table | ✗ | ✓ | n/a | ✓ | n/a | n/a |
| Current-year data | ✗ | ✓ | ✓ | n/a | ✓ | ✓ |

4. **Rank what's missing** by how many competitors cover it:
   - **Expected** (4 to 5 of 5): "searchers assume it's there. Add it."
   - **Common** (2 to 3): "add it if it serves your reader."
   - **Distinctive** (1): "add it only if it's genuinely useful, not to copy one page."
   - **Uncovered** (0): "the angle nobody has. Your best chance to be the result worth citing."
5. **Match coverage.** "Ignore competitors' word counts. Close the gaps that matter, and stop when the reader's question is answered." Google agrees: on a preferred word count, "(No, we don't.)", and it warns against "mainly summarizing what others have to say without adding much value" ([helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

"Present the gap grid and a proposed outline before rewriting. Mark each section **Keep**, **Revise**, or **New**, propose 2 to 3 title options ... and wait for approval. Don't promise a ranking or traffic outcome."

Read the results page by hand or through a licensed SERP data source, not by scraping Google ([TECHNICAL-AUDIT.md](TECHNICAL-AUDIT.md#ranking-evidence)).

## The six passes

[coreyhaines31/marketingskills, copy-editing content-refresh.md]

1. **Freshness:** update all dates, stats and examples; replace "in 2024" with current data; remove references to deprecated features or tools.
2. **Accuracy:** verify all claims are still true; check that linked resources still exist; confirm pricing and feature descriptions match the current state.
3. **Voice:** does the tone match the current brand voice? Older content often reflects an earlier stage of the company ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md) holds the voice).
4. **SEO:** has search intent shifted; are there new keywords or questions to address; add a visible date (below).
5. **Proof:** newer testimonials, case studies or data that didn't exist at first publication, real ones only.
6. **Structure:** comparison tables, FAQ sections or other scannable formats. A visible FAQ helps readers; its markup earns no Google rich result any more ([STRUCTURED-DATA.md](STRUCTURED-DATA.md)).

## Keep what already works

"A page that ranks has signals worth protecting" [coreyhaines31/marketingskills, copy-editing content-refresh.md]:

- **Keep the URL.** The source: "If it must change, 301 the old one." Google adds: "use HTTP permanent redirects if possible, such as `301` and `308`", "Keep the redirects for as long as possible, generally at least 1 year", and "consider keeping redirects indefinitely" ([site move with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)).
- **Keep heading anchors** other pages link to, and the sections that rank for their own queries ("check Search Console's query list for the page").
- **Keep the voice.** "A refresh shouldn't read like a different author wrote it."
- **Show the update:** "a visible "Last updated" date, with the year next to every statistic."

## Dates

Google's rules for the date the source asks you to show ([publication dates](https://developers.google.com/search/docs/appearance/publication-dates)):

- "Add a user-visible date to the page and feature it prominently", labelled "with text like "Publish" or "Last updated"".
- Match it to `datePublished` and `dateModified` in the page's structured data.
- "Don't specify future dates"; "Minimize the presence of other dates on the page".
- Change the date only when the content substantially changed (the helpful-content warning above).

The owner's blog markup carries `BlogPosting` "with its publish date" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)); it has no `dateModified`, which is absent rather than wrong.

## Hand-off and cadence

When the refresh goes to whoever publishes it, include "the new meta description, schema types to add, internal links to add to and from the post, images or screenshots needed, and the URL plan." [coreyhaines31/marketingskills, copy-editing content-refresh.md]

The source's cadence (its opinion, no official basis): pricing and product pages every quarter or when pricing or features change; high-traffic blog posts every 6 months; comparison and alternatives pages every 3 to 6 months; evergreen guides annually unless traffic drops sooner; low-traffic pages only when traffic data suggests an opportunity. A recurring content-decay check is in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md).

## Prove it

The refresh started from a gap grid of five competitors and an approved Keep, Revise or New outline; every statistic has its year and source; every link resolves; the URL and the heading anchors other pages link to are unchanged, or the old URL returns a 301 or 308 kept for at least a year; the visible "Last updated" date matches `dateModified` and moved only because the content substantially changed; no promise of a ranking or traffic outcome was made.
