# Evidence: what a field may say

## Anti-hallucination rules

- **Typography is not a product.** Never infer `product_description`, `industry` or `target_audience` from fonts, the framework (Framer, Next.js, React), the design system or polish.
- **No ICP leakage.** If you don't know what the target does, write `Unknown` instead of pattern-matching it onto the user's ICP. Manufacturing AI is not browser automation just because both use AI.
- **Quote, don't paraphrase from memory.** `product_description` quotes or closely paraphrases TITLE, META_DESCRIPTION, OG_DESCRIPTION, HEADINGS or BODY from the extractor, or an external search result. Otherwise write `Unknown: homepage content not accessible`.
- **Cap scores on thin evidence.** When the description is `Unknown`: `icp_fit_score` 3 or less and `icp_fit_reasoning: Insufficient evidence: homepage returned no readable content`.
- **Inaccessible means** `FETCH_OK: false` and `FALLBACK_TO_BROWSE: false`, or `BODY_CHARS` under 50.
- **The named failure:** a Framer or Next.js landing page with no server-rendered copy, where the subagent pattern-matches visual cues ("design-forward", "Geist Mono", "Framer-built") onto the user's own ICP.
- **A logo doesn't establish a customer relationship.** If the target's homepage shows the user's logo under "trusted by", the user is the target's customer, not the other way round. Call a target an existing customer only if it is in the profile's `existing_customers`; when unsure, describe the relationship neutrally ("shared ecosystem", "possible partnership", "adjacent stack"). Search results that say "X uses Y" are stronger evidence than logos.
- **Fields with no supporting finding stay empty.** Don't guess. A lookup that returned nothing, failed or timed out is `Unknown`, not a negative answer: "Do not reject solely because a provider returned nothing" `[coreyhaines31/marketingskills, revops]`.
- **The SEO version** [open-seo, seo-audit]: "A failed lookup is unknown"; missing data means "no recorded data", not a problem; and "Observations are not causes": similar content, uneven rankings or missing rows "never prove a penalty, an indexing exclusion, or the reason a page ranks where it does." Full rules in [TECHNICAL-AUDIT.md](../../marketing/seo/TECHNICAL-AUDIT.md#ranking-evidence).
- **Observed, inferred, implication** `[coreyhaines31/marketingskills, competitor-profiling]`: "**Observed**: what a source says, with the source and date"; "**Inferred**: your reading of what was observed. Label it, and say how confident you are when it would change a decision"; "**Implication**: what it might mean for your product, framed as a question or option, not a conclusion".
- **Never state motive** `[coreyhaines31/marketingskills, competitor-profiling]`: "Record what changed ("moved SSO to Enterprise"). Don't claim why ("because they're going upmarket") unless they've said so publicly."
- **Check a claim's scale** `[coreyhaines31/marketingskills, competitor-profiling]`: "if they claim "10,000 customers" on site, check if their traffic/backlink profile supports that scale". Named customers are verifiable claims; "industries served" is a positioning statement.
- **Facts first, angle second** `[coreyhaines31/marketingskills, prospecting]`: "Step one collects facts, each with a source URL and date. Step two writes the angle using only those facts. Never let one step do both." "No hook found" is a valid result. Bound the angle to your 3-5 value propositions ([prospecting ACCOUNT-RESEARCH.md](../../marketing/prospecting/ACCOUNT-RESEARCH.md)).
- **Don't fabricate specificity.** An email opens with the most concrete finding and bridges from a challenge or stack finding to the pitch; if only low-confidence findings exist, keep it shorter and more general.
- **The user's own company gets the same rigor.** Filling its matrix row from memory ships false claims to the user's own team: one matrix claimed a competitor had a "published uptime SLA" when it only had a status page, and marked its MIT-licensed SDK as not open source.

## Findings and confidence

- **A finding is a record:** `{subQuestion, fact, sourceUrl, sourceTitle, confidence}`. Competitor lanes use `{lane: "marketing|external|benchmark|strategic", fact, sourceUrl, confidence}`.
- **Confidence levels:**

| Level | Means |
|---|---|
| `high` | Stated on the company's own site or in official press |
| `medium` | Inferred from job posts, third-party articles or indirect signals |
| `low` | Speculative or outdated |

- **Prospecting grades the same labels differently:** by corroboration (two independent sources for `high`), not by source type; both definitions are in [prospecting SKILL.md](../../marketing/prospecting/SKILL.md). Say which one a sheet uses.

- **In markdown:** `- **[confidence]** fact (source: url)`.
- **Other skills use the same three words for other tests.** customer-research grades a theme by corroboration ("3+ independent sources; mentioned unprompted; consistent across segments") and calls it theme confidence ([customer-research](../../marketing/customer-research/SKILL.md#theme-confidence)); prospecting grades a lead ("confirmed by at least two independent sources or official business page") ([prospecting](../../marketing/prospecting/SKILL.md)). The table above grades one fact by its source; don't mix the scales in one file. customer-research also ranks job postings "Low-medium" signal, consistent with `medium` here.
- **How a value was obtained is a second axis** [Jakub Krehel, explain-interface]: the table above grades the source; claims read off a page also carry Measured, Derived or Inferred, and a stack fingerprint is itself an inference that needs its evidence ("A fingerprint that did not fire is not evidence of absence"). The tiers and fingerprints are defined in [browser-automation INSPECT-A-PAGE.md](../browser-automation/INSPECT-A-PAGE.md#measured-derived-inferred). The stack still never stands in for what the company does (the first rule above).

## The research loop

- **Work by priority, then move on:** P1, then P2, then P3; 3-5 findings per sub-question.
- **Run tool calls in parallel.** Rephrase, don't retry. Fetch only the 1-2 most relevant URLs per query. Stop at the step limit. Homepage first. Dedupe findings.
- **Auth walls:** for LinkedIn and YouTube, read the search snippet; don't fetch. A snippet can locate an account but can't qualify it: "never qualify from a search snippet alone" `[coreyhaines31/marketingskills, prospecting]`; qualify from a public page you can read, or leave it `Unknown`.
- **Sub-question priorities for a target company:**

| Priority | Runs in | Sub-questions |
|---|---|---|
| P1 | always | Product and market, ICP fit |
| P2 | deep, deeper | Tech stack, growth signals, pain points |
| P3 | deeper only | Decision makers, competitive landscape, case studies |

- **Query patterns:** `"{company} tech stack engineering blog"`, `"{company} careers software engineer"` (job posts reveal the stack), `"{company} funding round 2025 2026"`, `"{company} VP engineering CTO LinkedIn"`. Job posts as a record of a buyer's pain are in [customer-research SOURCES.md](../../marketing/customer-research/SOURCES.md#linkedin-and-job-posts).
- **Watching news** `[coreyhaines31/marketingskills, public-relations]`: Google News RSS `https://news.google.com/rss/search?q=QUERY&hl=en-US&gl=US&ceid=US:en`; HN Algolia `https://hn.algolia.com/api/v1/search_by_date?query=QUERY&tags=story&numericFilters=created_at_i>${SINCE}`. For Reddit, use its Data API with OAuth, not anonymous `.json` URLs: "Clients must authenticate with a registered OAuth token"; "Traffic not using OAuth or login credentials will be blocked"; the free limit is "100 queries per minute (QPM) per OAuth client id"; the User-Agent is `<platform>:<app ID>:<version string> (by /u/<reddit username>)` ([Reddit Data API Wiki](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)). The source used `curl -s -A "newsjack/1.0" "https://www.reddit.com/r/SUBREDDIT/top.json?t=day&limit=15"`. The newsjacking loop around these feeds is [public-relations NEWSJACKING.md](../../marketing/public-relations/NEWSJACKING.md#monitoring).

## Discovering targets

- **Discovery queries** combine: industry plus stage plus geography; tech stack plus use case; competitor adjacency ("alternatives to X"); buyer persona plus pain point.
- **Keep only homepages.** Drop blog posts and news (globenewswire, techcrunch), directories and aggregators (tracxn, crunchbase, g2), and the user's own competitors and customers. For competitors, the noise list adds seektool.ai, respan.ai, agentsindex.ai, toolradar.com, aitoolsatlas.ai, aidirectory.com, vibecodedthis.com, aichief.com, openalternative.co, cbinsights.com, saasworthy.com, softwareworld.com, capterra.com, trustradius.com.
- **Search command** (`browse` CLI): `browse cloud search "{q}" --num-results 25 --output /tmp/company_discovery_batch_{N}.json`. Competitor discovery uses `--num-results 12`, research 10, person enrichment 5. The output is `{ requestId, query, results: [{ url, title, author, publishedDate }] }` in one version and `{ id, url, title, image, favicon }` in another, so parse both.
- **Clear old batches first:** `rm -f /tmp/company_discovery_batch_*.json` (or `/tmp/competitor_discovery_batch_*.json`).

## Dedup by domain

- **A script, not the model,** reads the batches: `list_urls.mjs <dir> [--prefix company|competitor]` reads `{prefix}_discovery_batch_*.json`, accepts a flat array or `{results:[...]}`, dedupes by hostname with `www.` stripped, prints one URL per line on stdout and `N files, X total results, Y unique domains` on stderr.
- **The competitor version keeps the shallowest path per host,** because the first search hit for a domain is often a blog, doc or comparison path while gating and enrichment want the homepage, and escapes regex metacharacters in the prefix.

## Finding the right pages

- **Sitemap first, never hardcoded paths** (`/pricing` might be `/plans`):
  1. Fetch `/sitemap.xml`, the primary source, which has all pages.
  2. Scan it for keywords: `customer, case-stud, pricing, about, use-case, blog, docs, industry, solution` (for competitors: `pricing, customer, compare, vs, about, features, integrations`).
  3. Optionally fetch `/llms.txt`: bonus context, often incomplete.
  4. Pick the 3-5 most relevant URLs.
- **No sitemap: read the homepage nav, then probe** `[coreyhaines31/marketingskills, competitor-profiling]`: "Fetch the homepage first. Its nav links often reveal the actual paths". Otherwise try pricing `/pricing`, `/plans`, `/packages`, `/pricing-plans`; about `/about`, `/about-us`, `/company`, `/team`; features `/features`, `/product`, `/platform`, `/solutions`; customers `/customers`, `/case-studies`, `/clients`, `/success-stories`; integrations `/integrations`, `/apps`, `/connect`; blog `/blog`, `/resources`, `/insights`. An empty homepage: try the `www.` variant and flag the site as JS-rendered.

## Extracting a page

- **Small structured files fetch raw:** `browse cloud fetch --allow-redirects` is fine for `sitemap.xml`, `robots.txt`, `llms.txt`. HTML that will reach a model goes through an extractor.
- **Don't pipe the fetch through `sed`.** Without `--output`, `browse cloud fetch` returns a JSON envelope with the HTML as an escaped string; a naive `sed` strips `<>` from wrapper and content alike and removes the `<meta>` tags, which on Framer and Next.js single-page apps are often the only readable content.
- **The other reading:** the competitor pipeline treats `browse cloud fetch --allow-redirects` as returning clean markdown by default, adds `--format raw` for HTML and then `sed ... | tr -s ' \n' | head -c 3000`. Responses are limited to 1 MB; for JS-heavy pages use `browse open <url> --remote` then `browse get markdown`. Keep about 3000 characters per page.
- **An extractor script** (`extract_page.mjs`, built on `browse`):
  - `node extract_page.mjs <url> [--max-chars N]`, default 3000 (event triage uses 2000).
  - Fetches with `browse cloud fetch --allow-redirects <url> --output <tmpfile>` into a `mkdtemp` folder that is deleted afterwards.
  - **Thin pages fall back to a browser:** below `THIN_CONTENT_THRESHOLD = 200` body characters, run `browse open <url> --local --headless` and `browse get markdown` in a session named `extract-page-${pid}-${Date.now()}` (via `BROWSE_SESSION`), with 90000 ms timeouts, a 50 MB buffer and `browse stop` in `finally` (15000 ms). Use the markdown only if it is longer than the body.
  - **Tolerate banners:** the CLI can print lines such as "Update available..." before the JSON, so parse from the first `{`, then fall back to a lenient regex `/"markdown"\s*:\s*"((?:\\.|[^"\\])*)"/s`.
  - Extracts `<title>`, `meta name=description`, `og:title` and `og:description` in either attribute order, up to 10 h1-h3 headings, and visible text with script, style, noscript and comments removed and entities decoded.
  - Prints `URL / FETCH_OK / FALLBACK_TO_BROWSE / TITLE / META_DESCRIPTION / OG_TITLE / OG_DESCRIPTION / HEADINGS (" | " joined) / BODY_CHARS / BODY:`.
- **Counters filled by JavaScript** `[coreyhaines31/marketingskills, competitor-profiling]`: headcount, client counts and live stats "return placeholder values" to a plain fetch; "note the gap and flag as "JS-rendered, value unconfirmed" in the profile", or read it through the browser fallback.

```js
if (body.length < THIN_CONTENT_THRESHOLD) {
  const md = browseGetMarkdown(url);
  if (md && md.length > body.length) {
    body = md.replace(/\s+/g, " ").slice(0, maxChars);
    fallbackUsed = true;
  }
}
```

## Prove it

Pick five finished files at random: every `product_description` matches text in the extractor output or a cited search result, or reads `Unknown` with a score of 3 or less; every finding line carries a confidence and a URL; no "existing customer" is missing from the profile's `existing_customers`; the discovery list holds one homepage per domain and none of the noise domains.
