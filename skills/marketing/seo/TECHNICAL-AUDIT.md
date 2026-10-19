# Technical audit and choosing what to fix

A technical SEO audit answers two questions in order: can search engines reach, read and index the pages that matter, and which few changes would grow organic traffic that converts. The check catalogue and its logic come from OpenSEO's audit engine (every-app/open-seo, MIT, `src/shared/audit-issues.ts`, `page-reporters.ts`, `multipage-checks.ts`); the audit order and verification steps from FreeScan's public check library (freescan.app, no licence, so paraphrased); the opportunity method from OpenSEO's `seo-audit` skill (MIT). Where a tool's threshold disagrees with Google's docs, both are given and Google's wins. Scoring a whole site across SEO, security, accessibility and design, and writing fix briefs, is in [site-audit SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SKILL.md); Lighthouse runs are in [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md); Search Console data and URL Inspection are in [search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md).

**Contents:** [Severity](#severity) · [Check the crawl first](#check-the-crawl-first) · [Audit order](#audit-order) · [Tool thresholds are not Google rules](#tool-thresholds-are-not-google-rules) · [The issue catalogue](#the-issue-catalogue) · [Check logic](#check-logic) · [Triage into a work order](#triage-into-a-work-order) · [Index bloat](#index-bloat) · [Finding the few changes worth making](#finding-the-few-changes-worth-making) · [Ranking evidence](#ranking-evidence) · [OpenSEO as the tool](#openseo-as-the-tool) · [Prove it](#prove-it)

## Severity

Findings use the repo's one scale, P0 to P3, as defined in [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md). OpenSEO's three tiers are written here as critical = P1, warning = P2, info = P3; a finding that keeps a page that should rank out of Search (a block, a 5xx, a stray `noindex` on a money page) is P0 whatever the tool called it.

## Check the crawl first

- **Is the crawl describing the site or the edge?** "If `fetchClass` is anything other than `ok`, or if a page you know has 2,000 words comes back with a word count of zero, the crawl is describing the edge and not the site." CDNs may serve non-browser clients different content, and "a blocked page reports no title and zero words and will look exactly like thin content." [openseo.so, /library/site-audit/technical-seo-audit-checklist and /index-bloat]
- **Validate every response before crediting it.** Soft 404s and SPA fallbacks return HTTP 200 with unrelated HTML; before counting a robots.txt, sitemap or `llms.txt` as present, check the final URL, content type, title, body and expected format. [freescan, /blog/technical-seo-audit-checklist]
- **A broken or near-empty crawl comes first** (certificate error, 5xx, one page): check redirects and certificate variants yourself and search for the business; "a dead domain with a live successor flips the whole recommendation to 'redirect the old domain'." [open-seo, seo-audit]
- **A JavaScript shell is a coverage gap, not thin content.** "The initial app shell cannot establish what the rendered page is missing. Report the coverage gap instead of thin-content/missing-heading claims." [open-seo, page-reporters.ts] Re-run with JavaScript rendering, and serve important content and navigation in the initial HTML.
- **Blocks are reported, never bypassed.** OpenSEO's remedy is the site owner's consent: allowlist the crawler's user agent (`OpenSEO-Audit`) in the WAF, or Shopify's "Crawler access" signature [open-seo, audit-issues.ts]; how it classifies 429s and challenge pages is in [web-scraping CRAWLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/CRAWLING.md#blocked-responses). A crawler-specific block can be "a deliberate licensing or traffic-control decision" [freescan, /checks/seo/crawler-access]. Polite crawling (backoff, `Retry-After`, stopping and marking the report incomplete) is in [web-scraping CRAWLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/CRAWLING.md); evading bot protection is a do-not.

## Audit order

The order FreeScan's technical checklist gives [freescan, /blog/technical-seo-audit-checklist]: **reachability**, then **control** (robots.txt, meta robots, `X-Robots-Tag`, authentication, environment rules), then **canonical identity**, then **interpretation** (title, description, H1, copy, language, schema all about one subject), then **discovery** (linked from crawlable pages, listed in the right sitemap). Its named mistakes: trusting the status code alone, fixing only the canonical tag, and shipping staging robots rules to production.

| Check | What passes | Source |
|---|---|---|
| HTTPS | Final URL is HTTPS, HTTP redirects straight to HTTPS without a loop, the certificate covers every public hostname, canonicals and internal links use HTTPS | [freescan, /checks/security/https-and-mixed-content] |
| robots.txt | Served from the root; controls crawl access, not indexing; a broad `Disallow: /` also hides canonical and `noindex` directives from crawlers; lists canonical sitemap URLs; test public and private paths per user-agent group | [freescan, /checks/seo/robots-txt] |
| Indexability | Look for `noindex` in both `<meta name="robots">` and the `X-Robots-Tag` header, on the final response after redirects; a robots.txt block can hide a page-level `noindex`; thank-you, account and duplicate utility pages may be `noindex` on purpose | [freescan, /checks/seo/indexability] |
| Canonical | Exactly one absolute, indexable canonical in the head; it returns 200 HTML with no redirect chain; internal links and sitemap entries use the same URL; canonicals injected by JavaScript may be missing from raw HTML | [freescan, /checks/seo/canonical-tag] |
| Canonical is a hint | "indicating a canonical preference is a hint, not a rule ... Google may choose a different page as canonical than you do"; redirects, sitemap inclusion, internal links, protocol, host and parameters all count, so fix the source of conflicting variants | [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization); [freescan] |
| One canonical method | "Don't specify different URLs as canonical for the same page using different canonicalization techniques"; HTML or the HTTP header, because "using both methods at the same time is more error prone" | [consolidate-duplicate-urls](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| Sitemap | Only successful, canonical, indexable URLs (no redirects, duplicates, errors, `noindex` pages or preview links); referenced from robots.txt or a sitemap index; omit `lastmod` when no trustworthy modification time exists. Google's limits and `lastmod` rules are in [PAGES-AT-SCALE.md](PAGES-AT-SCALE.md#sitemaps) | [freescan, /checks/seo/xml-sitemap] |
| Title | Describes the page's unique purpose first, site name used consistently, distinct on every indexable page; engines may rewrite even a strong title | [freescan, /checks/seo/page-title] |
| Description | Unique per indexable page and consistent with the visible content. Google: "Identical or similar descriptions on every page ... aren't helpful" | [snippet](https://developers.google.com/search/docs/appearance/snippet) |
| Headings | One descriptive H1, H2 sections, H3 below; size with CSS, not heading levels. For ranking, Google says heading order "doesn't matter"; the order matters for accessibility ([web-accessibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md)) | [freescan, /checks/seo/heading-structure]; [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) |
| Internal links | Standard `<a href>` with descriptive anchor text, never `<div onclick>`; priority pages reachable "through a short, logical path"; repair broken, redirected and orphaned targets | [freescan, /checks/seo/internal-links] |
| Images | Google's image rules (formats, filenames, CSS images, `srcset` fallback, image sitemaps, alt text) are defined in [marketing-images](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/SKILL.md#images-on-your-own-site) | [Google Images](https://developers.google.com/search/docs/appearance/google-images) |
| Structured data and link previews | Types that match the visible page, required properties, a JSON encoder, the retired features | [STRUCTURED-DATA.md](STRUCTURED-DATA.md), [LINK-PREVIEWS.md](LINK-PREVIEWS.md) |

The owner's own head design (canonical per language, alternates with `x-default`, robots `index, follow, max-image-preview:large`) is in [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md); an audit verifies it, it doesn't redesign it.

## Tool thresholds are not Google rules

Audit tools ship character and word thresholds. Record them as the tool's heuristic, never as Google's limit.

| Tool threshold | What Google says |
|---|---|
| Title above 60 or below 10 characters [open-seo, page-reporters.ts `TITLE_MAX_CHARS=60`, `TITLE_MIN_CHARS=10`] | "there's no limit on how long a `<title>` element can be"; the title link is "truncated ... as needed, typically to fit the device width" ([title-link](https://developers.google.com/search/docs/appearance/title-link)). OpenSEO's own SERP simulator agrees that "character count alone does not tell you whether a title will fit" and uses a 600px desktop guide [openseo.so, /serp-simulator] |
| Meta description 70 to 160 characters [open-seo]; 50 to 170 [freescan, /checks/seo/meta-description] | "There's no limit on how long a meta description can be"; it is "truncated ... as needed" ([snippet](https://developers.google.com/search/docs/appearance/snippet)) |
| Thin content below 150 words, "Thin pages rarely rank" [open-seo, `THIN_CONTENT_WORDS=150`] | "The length of the content alone doesn't matter for ranking purposes ... no magical word count target, minimum or maximum" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)); on a preferred word count: "(No, we don't.)" ([helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)) |
| Multiple H1 "dilutes the main-topic signal"; skipped heading levels weaken structure [open-seo] | Headings out of order: "it doesn't matter if you're using them out of order"; "no magical, ideal amount of headings"; the guide doesn't mention H1 count ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)) |
| Slow response above 1,500 ms of total HTML time [open-seo, `SLOW_RESPONSE_MS=1500`] | "Good TTFB values are 0.8 seconds or less ... poor values are greater than 1.8 seconds" ([web.dev TTFB](https://web.dev/articles/ttfb)); 1.5 s sits in "needs improvement", and total response time is not field TTFB |
| Broken links and redirects "waste crawl budget" [open-seo] | The crawl budget guide is for sites with 1M+ pages, or 10,000+ pages changing daily; "If your site doesn't have a large number of pages that change rapidly ... you don't need to read this guide" ([crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget)). OpenSEO's own library agrees: "Neither is urgent on its own" |

The owner appends the brand to every title (DISCOVERY.md: "**Title** with the brand appended unless it already contains it"); a tool's 60-character info flag on those titles is not a defect.

## The issue catalogue

OpenSEO's registry has 30 issue types: 4 critical, 17 warning, 9 info [open-seo, src/shared/audit-issues.ts, as of 2026-10-01]. Its library article says 27 types; the source has 30, so count from source. The fix column follows the source's `howToFix`, corrected where marked.

| Issue | Tier | Fix |
|---|---|---|
| `blocked-page` | P1 | The page returned a challenge or access denial. If you own the site, allowlist the crawler's user agent in the WAF, then re-run. Search engines may face the same friction |
| `server-error` (5xx) | P1 | Fix the error from the server logs; if the page is gone, return 404 or 410 or redirect to a relevant page instead of erroring |
| `broken-internal-link` | P1 | Point the link at the correct live URL or remove it; link straight to a moved page's new URL rather than through a redirect |
| `missing-title` | P1 | Add a unique, descriptive `<title>` with the page's main topic. The source's "roughly 50 to 60 characters" is its heuristic (see above) |
| `javascript-rendering-suspected` | P2 | Re-audit with JavaScript rendering; serve important content and navigation in the initial HTML. "This warning does not prove that search engines cannot index the page" |
| `rate-limited-page` (429) | P2 | Raise the crawler rate limit or allowlist the audit user agent, or re-run with fewer pages |
| `crawl-rate-limited` | P2 | The crawl stopped early; "URLs we did not fetch are not recorded as broken or rate limited." Re-run after the limit resets |
| `broken-page` (4xx) | P2 | Restore the page, or remove it from the sitemap and internal links and consider a 301 to the closest live page |
| `duplicate-title` | P2 | A unique title per page; templated pages include the distinguishing attribute (name, category, location) |
| `duplicate-meta-description` | P2 | Write unique ones, or remove the duplicate: a generated snippet "beats a wrong duplicate" |
| `duplicate-content` | P2 | Pick the canonical URL, `rel=canonical` from the others, 301 duplicates where possible (trailing slash, parameters, http/https, www). Google: "Some duplicate content on a site is normal and it's not a violation of Google's spam policies" ([canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization)) |
| `missing-meta-description` | P2 | Add a description that summarizes the page and gives a reason to click (length: see above) |
| `missing-h1` | P2 | One H1 stating the main topic, consistent with the title |
| `multiple-h1` | P2 | Keep one H1, demote the rest; usually a template mistake (a logo marked up as H1). Ranking claim corrected above |
| `redirect-chain` | P2 | Point the first URL and internal links straight at the destination, at most one redirect |
| `redirect-loop` | P2 | Break the cycle so the chain ends at a 200 page |
| `canonical-conflict` | P2 | Declare one canonical in one place and align or remove the other. The source says engines then "ignore both"; Google says only not to mix techniques (above) |
| `thin-content` | P2 | Expand with useful content, `noindex` it, or consolidate it into a stronger page; if JavaScript renders the text, server-render it. The 150-word trigger is not a ranking threshold |
| `images-missing-alt` | P2 | Descriptive alt on meaningful images; `alt=""` only for decorative ones |
| `orphan-page` | P2 | Only found through the sitemap: link it from relevant pages, or drop it from the sitemap if it shouldn't be indexed |
| `no-outgoing-links` | P2 | Add links to related pages or the parent; make JavaScript navigation exist in the server-rendered HTML |
| `title-too-long`, `title-too-short` | P3 | Tool heuristic only (see above) |
| `meta-description-too-long`, `meta-description-too-short` | P3 | Tool heuristic only |
| `heading-order-skip` | P3 | An accessibility fix, not a ranking one |
| `slow-response` | P3 | Investigate server, database and caching time; use web.dev's bands, not 1.5 s |
| `noindex-page` | P3 | Remove `noindex` if the page should rank; otherwise intentional |
| `canonicalized-page` | P3 | If the page should rank on its own, make its canonical self-referencing |
| `deep-page` (5+ clicks from home) | P3 | Link it from hubs, categories or navigation |

## Check logic

How OpenSEO avoids false findings [open-seo, page-reporters.ts, multipage-checks.ts]:

- Blocked or rate-limited pages short-circuit every other check. Then 5xx, 4xx and 3xx; redirects alone aren't issues.
- Content checks run only on HTML: "a PDF has no title tag to miss". A JavaScript shell skips them (above).
- Duplicate groups exclude `noindex` and canonicalized-away pages: "flagging them tells the user to fix something they already fixed". Duplicate content compares a hash of visible text, only for pages with more than 0 words.
- Redirect chains are walked from chain heads, "so a 5-hop chain yields one issue, not five"; cycles are detected separately.
- Issue rows carry a deterministic dedupe key "so step retries don't duplicate issues".

## Triage into a work order

From OpenSEO's checklist article [openseo.so, /library/site-audit/technical-seo-audit-checklist]:

- Sort by severity before reading URLs. Its worked example: 1,180 issues on a 318-page site, 35 critical, all broken internal links, 32 of them from 11 hubs pointing at 4 dead URLs.
- "Group the report by issue type first and by page second. Twenty-six 'title too long' rows are one templating decision, not twenty-six tasks."
- Output "a work order", ordered "by how many pages each task fixes", with the info tier as one line. Cross the critical list against Search Console performance to rank by revenue.
- Ask for work, not a grade: "Ask for a score and you get a number to argue about; ask for a task list and you get work."
- Cadence: before and after any migration, template change or platform upgrade; otherwise quarterly. "Auditing monthly on a site nobody is changing produces the same report every month and trains everyone to ignore it."

## Index bloat

[openseo.so, /library/site-audit/index-bloat]

- Bloat is "a property of the set"; a crawler "grades pages one at a time". Prompt for a number that can come back as zero: "Ask an agent to find index bloat and it will find index bloat. Ask it what fraction of the suspects are in the index and you get a number that can come back as zero."
- Before deleting anything, URL-inspect a sample and bucket the results: unknown to Google, canonicalized away, crawled but not indexed, indexed. In OpenSEO's 867-page example, 5 of 6 inspected URLs were "URL is unknown to Google", so there was nothing to remove.
- "if most of your indexed URLs get no impressions in a year, the set is larger than the site can support." Removing a URL from the sitemap alone does not deindex it; discovery also comes from feeds, internal links and other sites.
- Choosing the fix. The source: `noindex` when the page has a purpose for users, 410 or 301 when it has none. Google adds: for duplicates use `rel=canonical`, not `noindex`, because `noindex` "will completely block the page from Search", and "Don't use the robots.txt file for canonicalization purposes" ([consolidate-duplicate-urls](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)). `noindex` is for pages that should not be in Search at all.
- Never delete, `noindex` or redirect a page with traffic or backlinks without the owner's approval [coreyhaines31/marketingskills, marketing-loops seo-operator].

## Finding the few changes worth making

OpenSEO's `seo-audit` method [open-seo, seo-audit]. Goal: "Research broadly; recommend selectively." The report leads with "one to three recommendations that either capture meaningfully more qualified search demand or stop a real loss."

1. **Orient.** Start the crawl; meanwhile read the backlink and domain overviews, a ranked-keyword sample, the sitemap and the navigation. "Write down the site's page families from the sitemap, not just the crawl sample": product, pricing, comparison or alternative, tools and templates, guides, categories, services, locations.
2. **Investigate each family that could bring buyers.** Read the main content of at least two pages: the best performer and one worst or typical page. Ask whether the page answers the searcher's decision "with specific, accurate, sourced information, or does it substitute a name, location, or keyword into a shared answer?" Compare it with the leading results. On SaaS sites, competitor comparison pages and competitor pricing pages are two separate families; "a sibling that already ranks near the top is something to protect rather than rewrite." For any page you might name, check status, canonical, index directives and how visitors reach it internally.
3. **Shortlist** in a working file, `opportunities.md`: five to ten rows from at least three of these kinds: an existing page underperforming its demand; real demand with no page; a winning page to protect or correct; an access, indexing or redirect defect costing visits; helping existing visitors take the next step. Columns, verbatim: "pages | problem observed | evidence (query cluster with US monthly volumes, spot and page or "not in the first 20 results", date) | proposed change | who searches and why they matter to this business | plausible benefit | effort | main uncertainty." If one more lookup would change a row's rank, do it first.
4. **Choose.** "Prefer a bounded change that directly fixes a demonstrated problem for searchers likely to become customers." A genuine access or indexing blocker, a measured traffic loss or a dead domain jumps the queue. These never decide alone: "the volume of one sampled query; how easy the fix is; a crawler warning; a hypothetical position-one traffic figure; a navigation or redirect repair with no demonstrated traffic loss." "Do not recommend rewriting a page that already ranks near the top for its target query." Every rejected row gets a real reason ("'Later, if sales asks for it' is not a reason"), and one sentence says why the leader beats the runner-up.
5. **Size the benefit honestly.** Name the mechanism: a new ranking, a higher position, or more clicks at the same position; "A page that already ranks already receives part of the volume". Size against the query cluster without adding overlapping variants. US figures stay US: "never multiply into an invented global number". "Search volume is not visits": use a stated click-share assumption in a scenario table and label position one hypothetical. With an unknown baseline, say "total potential visits". "Never invent a conversion rate or revenue"; with no number, give a directional reason ("already third for its main query, so headroom is small").
6. **Review, then write.** A second agent or a fresh self-review argues the case for the strongest rejected row, confirms every diagnosis survived as a recommendation or a "What else we checked" row, and checks dates, geography and rank conventions.

Keyword demand, clustering and SEO competitors are in [keyword-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md).

## Ranking evidence

[open-seo, seo-audit]

- Tool `rank` counts every result block; count organic listings yourself. Write "#10 (page 1)", "#11 (page 2)", ten per page. Request depth 20; a page not seen is "not in the first 20 results". "A failed lookup is unknown". Never "10/17", arrows or listing counts.
- Log the exact query, country, language, date, the number of organic listings returned and the matching URL. Re-run the queries behind the leading recommendation; when two checks disagree, write "#10, page 1 (first check: not in the first 20 results)": "that spread is same-day variation, not a trend. One snapshot is not a baseline."
- "Retrieval date is not observation date." Provider traffic and keyword counts are estimates, "not measured visits"; a page missing from a limited sample "is not proof it has no rankings"; missing data means "no recorded data".
- "Observations are not causes": similar content, uneven rankings, a crawler warning or missing rows "never prove a penalty, an indexing exclusion, or the reason a page ranks where it does."
- Get live SERP listings from a licensed SERP data provider; Search Console provides own-property performance and average position, not the result-page listing. The old line treated both as interchangeable ranking evidence; keep the [official evidence distinction](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/KEYWORDS.md#search-console-and-serp-evidence). Google's spam policies list "scraping results for rank-checking purposes or other types of automated access to Google Search conducted without express permission" as machine-generated traffic ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies)).

## OpenSEO as the tool

Facts from openseo.so and the repo README, as of 2026-10; confirm prices on the pricing page before quoting them.

- Keyword, SERP, ranking, backlink, local and AI-visibility data come from DataForSEO; Search Console and GA4 data from Google: "It's the same data. OpenSEO decides which fields your agent gets and how they're formatted." [openseo.so, /openseo-vs-dataforseo]
- The hosted plan is $10 a month with $10 of usage included, and adds a 28% fee on DataForSEO requests; GSC and GA reads, project context, reports and standard site audits cost no credits. Site audits cap at 50 pages per crawl on the free plan and 10,000 on the $10 plan, with optional Lighthouse on up to 10 pages. [openseo.so, /pricing, library FAQ]
- MCP: `claude mcp add --transport http --scope user openseo https://app.openseo.so/mcp` (Streamable HTTP, OAuth on first connect); for headless runs an API key `oseo_...` as `Authorization: Bearer`. "API keys are personal: anything an agent does with your key acts as you in your workspace." [openseo.so, /docs/mcp]
- The audit user agent is `OpenSEO-Audit/1.0`; robots.txt is parsed with `robots-parser`, read up to 500 KiB as RFC 9309 section 2.5 allows. [open-seo, url-policy.ts, discovery.ts]

## Prove it

The crawl's fetch classes are all `ok` (or each block is reported, not counted as thin content); every finding carries P0 to P3 and a fix; no title, description or word-count threshold is stated as Google's rule; issues are grouped by type into a work order ranked by pages fixed; index-bloat decisions rest on a URL Inspection sample; the report leads with one to three recommendations, each with its evidence, mechanism and uncertainty, and every rejected shortlist row has a reason; every live SERP ranking is written "#N (page P)" with query, country, date and listings returned, while Search Console positions are identified as averages; no ranking came from scraping Google.
