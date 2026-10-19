# Pages at scale (programmatic SEO)

Programmatic SEO builds many similar pages from a template and a dataset, one per keyword pattern (`[service] in [city]`, `[x] vs [y]`, `[product] for [audience]`). It works when each page answers a real search with data no other page has, and becomes scaled content abuse when pages differ only by the swapped variable. The playbooks, framework and checklists come from coreyhaines31/marketingskills `programmatic-seo` v2.1.0 (MIT, verbatim where quoted); the playbooks are that author's own frameworks, not Google guidance. Google's spam policies, sitemap rules and crawl-budget guidance are quoted from Search Central where the source is silent or wrong. Hubs, URL hierarchy and navigation are in [site-architecture SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/SKILL.md); comparison and alternative pages in depth in [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md); markup for the template in [STRUCTURED-DATA.md](STRUCTURED-DATA.md).

**Contents:** [Assess first](#assess-first) · [Principles](#principles) · [What Google calls spam](#what-google-calls-spam) · [The 12 playbooks](#the-12-playbooks) · [Choosing a playbook](#choosing-a-playbook) · [Building the set](#building-the-set) · [Linking](#linking) · [Sitemaps](#sitemaps) · [Indexation and crawl budget](#indexation-and-crawl-budget) · [Choosing the platform](#choosing-the-platform) · [Checklists](#checklists) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## Assess first

[coreyhaines31/marketingskills, programmatic-seo] Read `.agents/product-context.md` first ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md); the source calls it `.agents/product-marketing.md`), then answer:

1. **Business context:** the product or service, the target audience, the conversion goal for these pages.
2. **Opportunity:** what search patterns exist, how many potential pages, the search volume distribution.
3. **Competitive landscape:** who ranks for these terms now, what their pages look like, whether you can realistically compete.

Task questions: what keyword patterns are you targeting; what data do you have (or can acquire); how many pages are you planning; what does your site's authority look like; who currently ranks for these terms; what's your technical stack.

## Principles

[coreyhaines31/marketingskills, programmatic-seo]

1. **Unique value per page.** "Not just swapped variables in a template."
2. **Proprietary data wins.** "Hierarchy of data defensibility: 1. Proprietary (you created it) 2. Product-derived (from your users) 3. User-generated (your community) 4. Licensed (exclusive access) 5. Public (anyone can use, weakest)".
3. **Genuine search intent match.** "Pages must actually answer what people are searching for."
4. **Quality over quantity.** "Better to have 100 great pages than 10,000 thin ones."
5. **No doorway pages, keyword stuffing or duplicate content;** genuine utility for users.

The source's SKILL.md also says "Use subfolders, not subdomains: subfolders consolidate domain authority while subdomains split it". Its own platforms reference and evals contradict that ("Google doesn't rank one above the other"), and no Google page backs the authority claim. Google: it "generally doesn't look at the structure of URLs to work out the structure of a site. Instead, it analyzes the linkages between pages" ([ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)). Decide subpath or subdomain on effort ([Choosing the platform](#choosing-the-platform)).

## What Google calls spam

Quoted from [spam policies](https://developers.google.com/search/docs/essentials/spam-policies); this is the line a page set must stay on the right side of.

- **Doorway abuse** "is when sites or pages are created to rank for specific, similar search queries". Examples include "multiple domain names or pages targeted at specific regions or cities that funnel users to one page" and "substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy".
- **Scaled content abuse:** "many pages are generated for the primary purpose of manipulating search rankings". Examples: "Using generative AI tools or other similar tools to generate many pages without adding value for users"; "Scraping feeds, search results, or other content to generate many pages"; "Stitching or combining content from different web pages without adding value".
- **Thin affiliation:** copied merchant descriptions and "cookie-cutter sites or templates".
- "Sites that violate our policies may rank lower in results or not appear in results at all."

The same pattern applies to AI answers: near-duplicate pages per prompt wording ("prompt-variant doorway pages") are an anti-pattern; build a subject hub with supporting pages that answer materially different questions [freescan, /blog/ai-search-optimization-guide]. More in [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).

## The 12 playbooks

[coreyhaines31/marketingskills, programmatic-seo playbooks.md]

| Playbook | Pattern | Value requirements | URL structure |
|---|---|---|---|
| Templates | "[Type] template", "free [type] template" | Actually usable templates (not just previews); multiple variations per type; quality comparable to paid options; easy download or use flow | `/templates/[type]/` or `/templates/[category]/[type]/` |
| Curation | "best [category]", "top [number] [things]" | Genuine evaluation criteria; real testing or expertise; regular updates (date visible); "Not just affiliate-driven rankings" | `/best/[category]/` or `/[category]/best/` |
| Conversions | "[X] to [Y]", "[amount] [unit] in [unit]" | Accurate, real-time data; fast, functional tool; related conversions suggested; mobile-friendly | `/convert/[from]-to-[to]/` or `/[from]-to-[to]-converter/` |
| Comparisons | "[X] vs [Y]", "[X] alternative" | "Honest, balanced analysis"; actual feature comparison data; clear recommendation by use case; updated when products change | `/compare/[x]-vs-[y]/` or `/[x]-vs-[y]/` |
| Examples | "[type] examples", "[category] inspiration" | Real, high-quality examples; screenshots or embeds; categorization and filtering; analysis of why they work | `/examples/[type]/` or `/[type]-examples/` |
| Locations | "[service/thing] in [location]" | "Actual local data (not just city name swapped)"; local providers listed; location-specific insights (pricing, regulations) | `/[service]/[city]/` or `/locations/[city]/[service]/` |
| Personas | "[product] for [audience]", "[solution] for [role/industry]" | Genuine persona-specific content; relevant features; testimonials from that segment; audience-specific use cases | `/for/[persona]/` or `/solutions/[industry]/` |
| Integrations | "[your product] [other product] integration" | Real integration details; setup instructions; use cases for the combination; "Working integration (not vaporware)" | `/integrations/[product]/` or `/connect/[product]/` |
| Glossary | "what is [term]", "[term] definition" | Clear, accurate definitions; examples and context; related terms linked; more depth than a dictionary | `/glossary/[term]/` or `/learn/[term]/` |
| Translations | The same content in other languages | Quality translation (not just machine translation); cultural localization; hreflang; native speaker review | `/[lang]/[page]/` |
| Directory | "[category] tools", "[type] software" | Comprehensive coverage; useful filtering and sorting; details per listing (not just names); regular updates | `/directory/[category]/` or `/[category]-directory/` |
| Profiles | "[person/company name]", "[entity] + [attribute]" | "Accurate, sourced information"; regularly updated; unique insights or aggregation; not a Wikipedia rehash | `/people/[name]/`, `/companies/[name]/` |

Translations need hreflang that Google accepts: each version lists itself and all others, `x-default` as the fallback, fully qualified URLs, an ISO 639-1 language with an optional ISO 3166-1 region (never a country alone), in HTML, an HTTP `Link` header or the sitemap ([localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)). The owner's head design already does this ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)). A glossary can carry schema.org `DefinedTerm`; Google has no rich result for it, so it is semantic markup only.

## Choosing a playbook

[coreyhaines31/marketingskills, programmatic-seo]

| If you have... | Consider... |
|---|---|
| Proprietary data | Directories, Profiles |
| Product with integrations | Integrations |
| Design or creative product | Templates, Examples |
| Multi-segment audience | Personas |
| Local presence | Locations |
| Tool or utility product | Conversions |
| Content or expertise | Glossary, Curation |
| International potential | Translations |
| Competitor landscape | Comparisons |

Playbooks layer: Locations + Personas ("Marketing agencies for startups in Austin"), Curation + Locations ("Best coworking spaces in San Diego"), Integrations + Personas ("Slack for sales teams"), Glossary + Translations.

## Building the set

[coreyhaines31/marketingskills, programmatic-seo]

1. **Keyword pattern.** The repeating structure, the variables, how many unique combinations exist. Validate demand: aggregate search volume, volume distribution (head vs long tail), trend direction. Demand research: [keyword-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md).
2. **Data.** What data populates each page, where it comes from (first-party, licensed, public), how it is updated. Collect only data you are allowed to use, within the law and the source's terms ([web-scraping SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/SKILL.md)); scraping other sites' content to fill pages is a listed spam example (above).
3. **Template.** Header with the target keyword; a unique intro (not just variables swapped); data-driven sections; related pages and internal links; CTAs matched to intent. Uniqueness comes from conditional content based on the data and original insight or analysis per page.
4. **Output.** A strategy document (opportunity analysis, implementation plan, content guidelines) and a page template (URL structure, title and meta templates, content outline, schema).

## Linking

- **Hub and spoke:** use the [canonical linking pattern](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/URLS-AND-LINKS.md#hub-and-spoke). No orphans: every page reachable from the main site, in the XML sitemap, with breadcrumbs. [coreyhaines31/marketingskills, programmatic-seo]
- Google learns page importance from "the linkages between pages"; use `<a href>` links rather than JavaScript events, and when linking isn't feasible, sitemaps or Merchant Center feeds ([ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)). "Google can only crawl your link if it's an `<a>` HTML element" with an `href` ([crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).

## Sitemaps

From [build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap):

- "All formats limit a single sitemap to 50MB (uncompressed) or 50,000 URLs"; a sitemap index groups several. Separate sitemaps per page type make Search Console tracking easier [coreyhaines31/marketingskills, programmatic-seo].
- "Google ignores `<priority>` and `<changefreq>`". `<lastmod>` is used only if "consistently and verifiably" accurate: the main content, structured data or links changed, not a copyright year.
- Absolute canonical URLs only. The owner commits a static sitemap that "always name[s] the production origin" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)); these rules apply to it too.

## Indexation and crawl budget

The source says "Noindex very thin variations" and "Manage crawl budget thoughtfully". Google's crawl budget guide is for "Large sites (1 million+ unique pages) with content that changes moderately often", "Medium or larger sites (10,000+ unique pages) with very rapidly changing content (daily)", or sites with many URLs in "Discovered - currently not indexed" ([crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget)). Below that, crawl budget is not the problem to solve. The same guide:

- Don't use `noindex` for crawl control: Google still requests the page, then drops it. `noindex` removes a thin page from the index; it saves no crawl budget.
- Block crawling with robots.txt, but don't use robots.txt to free budget temporarily for other pages.
- Fix soft 404s and consolidate duplicates.

Prioritize the high-volume patterns, and launch the strongest pages first: "Launch the 20 to 50 strongest pages first, check they index and rank, then scale" (the source author's heuristic) [coreyhaines31/marketingskills, programmatic-seo implementation-platforms.md].

## Choosing the platform

What the platform has to do [coreyhaines31/marketingskills, programmatic-seo implementation-platforms.md]:

| Requirement | Why it matters | What to check |
|---|---|---|
| Enough items | Every page is usually one CMS item or database row | The plan's item or row limit at the volume you'll reach in a year, not today's |
| Data refresh | Stale data makes pages wrong and thin | How rows get updated (CSV re-import, API, sync tool, webhook) and whether pages update without a full rebuild |
| Server-rendered HTML | "Crawlers and AI engines need the content in the initial HTML" | Pages render on the server or at build time, not only in client-side JavaScript |
| Conditional sections | Unique value per page depends on showing or hiding sections by data | The template can branch on field values, not just print them |
| Per-page indexation control | You'll `noindex` thin variations and split sitemaps | Per-item `noindex`, canonical overrides, sitemaps split by page type |
| Internal linking | Hubs, spokes and related links drive discovery | Templates can query related items (same category, nearby location) |
| Build and publish time | Thousands of pages can make every publish slow | Whether publishing regenerates everything or only changed pages |

Choosing:

1. **Start with the site you already have** if its CMS can hold the page count and the template logic.
2. **If it can't, decide subpath or subdomain on effort.** A reverse-proxied subpath keeps the set inside the main site's structure and links but adds proxy setup; a subdomain is simpler but needs its own internal links and sitemap. Note that Google's site names work per domain or subdomain, not per subdirectory ([site names](https://developers.google.com/search/docs/appearance/site-names)).
3. **Size for the next year,** with headroom for variations you'll add.
4. **Prove it on a small batch** (above).

The source's platform rows (Webflow CMS, WordPress with custom fields, Framer CMS, Next.js or Astro static or incremental builds, a headless CMS, AI-native site builders) are dated "As of 2026-10"; confirm item limits and pricing on each vendor's current plan page. One of its rows is a vendor its repository marks as a Verified Partner, a disclosure the source asks to keep when naming it.

## Checklists

[coreyhaines31/marketingskills, programmatic-seo]

**Before launch.** Content: each page provides unique value, answers the search intent, is readable and useful. Technical: unique titles and meta descriptions, proper heading structure, schema implemented, page speed acceptable. Linking: connected to the site architecture, related pages linked, no orphans. Indexation: in the XML sitemap, crawlable, "No conflicting noindex".

**After launch.** Track indexation rate, rankings, traffic, engagement and conversion. Watch for thin content warnings, ranking drops, manual actions and crawl errors (Search Console: [search-console SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md)). A recurring quality pass that escalates mass-`noindex` or prune decisions is in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md).

## Common mistakes

[coreyhaines31/marketingskills, programmatic-seo]

- **Thin content:** "Just swapping city names in identical content".
- **Keyword cannibalization:** multiple pages targeting the same keyword.
- **Over-generation:** pages with no search demand.
- **Poor data quality:** outdated or incorrect information.
- **Ignoring UX:** "Pages exist for Google, not users".

## Prove it

Each page in a sample of the set has data or analysis no sibling has (diff two siblings: more than the variable changed); no page funnels to another or reads as a search results page; the first batch of 20 to 50 pages is indexed and ranking before the rest ship; every page is linked from a hub with `<a href>` and listed in a sitemap under 50,000 URLs with honest `lastmod`; content is in the initial HTML; no `noindex` is used as crawl control on a site under Google's crawl-budget sizes; every data source is first-party, licensed or public and lawfully collected.
