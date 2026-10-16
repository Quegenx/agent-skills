# Evidence: what a field may say

## Anti-hallucination rules

- **Typography is not a product.** Never infer `product_description`, `industry` or `target_audience` from fonts, the framework (Framer, Next.js, React), the design system or polish.
- **No ICP leakage.** If you don't know what the target does, write `Unknown` instead of pattern-matching it onto the user's ICP. Manufacturing AI is not browser automation just because both use AI.
- **Quote, don't paraphrase from memory.** `product_description` quotes or closely paraphrases TITLE, META_DESCRIPTION, OG_DESCRIPTION, HEADINGS or BODY from the extractor, or an external search result. Otherwise write `Unknown: homepage content not accessible`.
- **Cap scores on thin evidence.** When the description is `Unknown`: `icp_fit_score` 3 or less and `icp_fit_reasoning: Insufficient evidence: homepage returned no readable content`.
- **Inaccessible means** `FETCH_OK: false` and `FALLBACK_TO_BROWSE: false`, or `BODY_CHARS` under 50.
- **The named failure:** a Framer or Next.js landing page with no server-rendered copy, where the subagent pattern-matches visual cues ("design-forward", "Geist Mono", "Framer-built") onto the user's own ICP.
- **A logo doesn't establish a customer relationship.** If the target's homepage shows the user's logo under "trusted by", the user is the target's customer, not the other way round. Call a target an existing customer only if it is in the profile's `existing_customers`; when unsure, describe the relationship neutrally ("shared ecosystem", "possible partnership", "adjacent stack"). Search results that say "X uses Y" are stronger evidence than logos.
- **Fields with no supporting finding stay empty.** Don't guess.
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

- **In markdown:** `- **[confidence]** fact (source: url)`.

## The research loop

- **Work by priority, then move on:** P1, then P2, then P3; 3-5 findings per sub-question.
- **Run tool calls in parallel.** Rephrase, don't retry. Fetch only the 1-2 most relevant URLs per query. Stop at the step limit. Homepage first. Dedupe findings.
- **Auth walls:** for LinkedIn and YouTube, read the search snippet; don't fetch.
- **Sub-question priorities for a target company:**

| Priority | Runs in | Sub-questions |
|---|---|---|
| P1 | always | Product and market, ICP fit |
| P2 | deep, deeper | Tech stack, growth signals, pain points |
| P3 | deeper only | Decision makers, competitive landscape, case studies |

- **Query patterns:** `"{company} tech stack engineering blog"`, `"{company} careers software engineer"` (job posts reveal the stack), `"{company} funding round 2025 2026"`, `"{company} VP engineering CTO LinkedIn"`.

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
