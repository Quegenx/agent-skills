# Evidence: what a field may say

Research evidence rules from Browserbase's company/competitor/event workflows and the existing marketing sources tagged below. Fetch/search transport has its own scraping owner; this topic keeps what a research field may claim. [browserbase/skills, company-research, competitor-analysis and event-prospecting; existing repository research rules]

## Anti-hallucination rules

- **Typography is not a product.** Never infer `product_description`, `industry` or `target_audience` from fonts, the framework (Framer, Next.js, React), the design system or polish.
- **No ICP leakage.** If you don't know what the target does, write `Unknown` instead of pattern-matching it onto the user's ICP. Manufacturing AI is not browser automation just because both use AI.
- **Quote, don't paraphrase from memory.** `product_description` quotes or closely paraphrases TITLE, META_DESCRIPTION, OG_DESCRIPTION, HEADINGS or BODY from the extractor, or an external search result. Otherwise write `Unknown: homepage content not accessible`.
- **Cap scores on thin evidence.** When the description is `Unknown`: `icp_fit_score` 3 or less and `icp_fit_reasoning: Insufficient evidence: homepage returned no readable content`.
- **Inaccessible means** `FETCH_OK: false` and `FALLBACK_TO_BROWSE: false`, or `BODY_CHARS` under 50.
- **The named failure:** a Framer or Next.js landing page with no server-rendered copy, where the subagent pattern-matches visual cues ("design-forward", "Geist Mono", "Framer-built") onto the user's own ICP.
- **A logo doesn't establish a customer relationship.** If the target's homepage shows the user's logo under "trusted by", the user is the target's customer, not the other way round. Call a target an existing customer only if it is in the profile's `existing_customers`; when unsure, describe the relationship neutrally ("shared ecosystem", "possible partnership", "adjacent stack"). Search results that say "X uses Y" are stronger evidence than logos.
- **Fields with no supporting finding stay empty.** Don't guess. A lookup that returned nothing, failed or timed out is `Unknown`, not a negative answer: "Do not reject solely because a provider returned nothing" `[coreyhaines31/marketingskills, revops]`.
- **The SEO version** [open-seo, seo-audit]: "A failed lookup is unknown"; missing data means "no recorded data", not a problem; and "Observations are not causes": similar content, uneven rankings or missing rows "never prove a penalty, an indexing exclusion, or the reason a page ranks where it does." Full rules in [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md#ranking-evidence).
- **Observed, inferred, implication** `[coreyhaines31/marketingskills, competitor-profiling]`: "**Observed**: what a source says, with the source and date"; "**Inferred**: your reading of what was observed. Label it, and say how confident you are when it would change a decision"; "**Implication**: what it might mean for your product, framed as a question or option, not a conclusion".
- **Never state motive** `[coreyhaines31/marketingskills, competitor-profiling]`: "Record what changed ("moved SSO to Enterprise"). Don't claim why ("because they're going upmarket") unless they've said so publicly."
- **Check a claim's scale** `[coreyhaines31/marketingskills, competitor-profiling]`: "if they claim "10,000 customers" on site, check if their traffic/backlink profile supports that scale". Named customers are verifiable claims; "industries served" is a positioning statement.
- **Facts first, angle second** `[coreyhaines31/marketingskills, prospecting]`: "Step one collects facts, each with a source URL and date. Step two writes the angle using only those facts. Never let one step do both." "No hook found" is a valid result. Bound the angle to your 3-5 value propositions ([prospecting ACCOUNT-RESEARCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ACCOUNT-RESEARCH.md)).
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

- **Prospecting grades the same labels differently:** by corroboration (two independent sources for `high`), not by source type; both definitions are in [prospecting SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md). Say which one a sheet uses.

- **In markdown:** `- **[confidence]** fact (source: url)`.
- **Other skills use the same three words for other tests.** customer-research grades a theme by corroboration ("3+ independent sources; mentioned unprompted; consistent across segments") and calls it theme confidence ([customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md#theme-confidence)); prospecting grades a lead ("confirmed by at least two independent sources or official business page") ([prospecting](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md)). The table above grades one fact by its source; don't mix the scales in one file. customer-research also ranks job postings "Low-medium" signal, consistent with `medium` here.
- **How a value was obtained is a second axis** [Jakub Krehel, explain-interface]: the table above grades the source; claims read off a page also carry Measured, Derived or Inferred, and a stack fingerprint is itself an inference that needs its evidence ("A fingerprint that did not fire is not evidence of absence"). The tiers and fingerprints are defined in [pixel-reverse-engineer INSPECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/INSPECTION.md#measured-derived-inferred). The stack still never stands in for what the company does (the first rule above).

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

- **Query patterns:** `"{company} tech stack engineering blog"`, `"{company} careers software engineer"` (job posts reveal the stack), `"{company} funding round 2025 2026"`, `"{company} VP engineering CTO LinkedIn"`. Job posts as a record of a buyer's pain are in [customer-research SOURCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SOURCES.md#linkedin-and-job-posts).
- **Watching news:** use the existing [Google News, HN and compliant Reddit monitoring owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/NEWSJACKING.md#monitoring). That chapter keeps the complete feed/API definitions and old-source correction; research findings still need their URL, date and confidence here. [coreyhaines31/marketingskills, public-relations]

## Discovering targets

- **Discovery queries** combine: industry plus stage plus geography; tech stack plus use case; competitor adjacency ("alternatives to X"); buyer persona plus pain point.
- **Keep only homepages.** Drop blog posts and news (globenewswire, techcrunch), directories and aggregators (tracxn, crunchbase, g2), and the user's own competitors and customers. For competitors, the noise list adds seektool.ai, respan.ai, agentsindex.ai, toolradar.com, aitoolsatlas.ai, aidirectory.com, vibecodedthis.com, aichief.com, openalternative.co, cbinsights.com, saasworthy.com, softwareworld.com, capterra.com, trustradius.com.
- **Search adapter and source quotas:** use [web-scraping WEB-SEARCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/WEB-SEARCH.md#research-cli-adapter) for the source command and envelope versions. The research source requests 25 results in its discovery example, 12 for competitor discovery, 10 for research and 5 for person enrichment; those are source/mode quotas, not platform defaults or new call authorization. [browserbase/skills, research workflows]
- **Batch cleanup:** apply the [authorized run-owned cleanup boundary](COMPETITORS.md#the-pipeline). The old source cleared shared temporary batch globs; do not delete another run's or the user's files. [browserbase/skills, source discovery workflow; user standing rules]

## Dedup by domain

- **A script, not the model,** reads the batches: `list_urls.mjs <dir> [--prefix company|competitor]` reads `{prefix}_discovery_batch_*.json`, accepts a flat array or `{results:[...]}`, dedupes by hostname with `www.` stripped, prints one URL per line on stdout and `N files, X total results, Y unique domains` on stderr.
- **The competitor version keeps the shallowest path per host,** because the first search hit for a domain is often a blog, doc or comparison path while gating and enrichment want the homepage, and escapes regex metacharacters in the prefix.

## Finding the right pages

- **Sitemap first, never hardcoded paths** (`/pricing` might be `/plans`):
  1. Fetch `/sitemap.xml` as a discovery source. A sitemap lists the URLs the publisher considers important; it is not an exhaustive inventory. [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) corrects the source and this file's former claim that it "has all pages".
  2. Scan it for keywords: `customer, case-stud, pricing, about, use-case, blog, docs, industry, solution` (for competitors: `pricing, customer, compare, vs, about, features, integrations`).
  3. Optionally fetch `/llms.txt`: bonus context, often incomplete.
  4. Pick the 3-5 most relevant URLs.
- **No sitemap: read the homepage nav, then probe** `[coreyhaines31/marketingskills, competitor-profiling]`: "Fetch the homepage first. Its nav links often reveal the actual paths". Otherwise try pricing `/pricing`, `/plans`, `/packages`, `/pricing-plans`; about `/about`, `/about-us`, `/company`, `/team`; features `/features`, `/product`, `/platform`, `/solutions`; customers `/customers`, `/case-studies`, `/clients`, `/success-stories`; integrations `/integrations`, `/apps`, `/connect`; blog `/blog`, `/resources`, `/insights`. If the homepage is unreadable, a permitted `www.` or rendered fetch can supply further evidence; report the cause as unknown until observed. The old source said to flag an empty homepage as JS-rendered, which conflicts with this topic's observations-are-not-causes rule. [coreyhaines31/marketingskills, competitor-profiling; existing research evidence rule]

## Extracting a page

Use the canonical [research extractor transport and source-workspace contract](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/FETCHING.md#option-research-extractor-helper-vendor). It preserves both tagged CLI output readings, browser fallback and the source snippet; this research file owns the evidence fields and run budgets. [browserbase/skills, company-research and competitor-analysis]

- **Research text budget:** the source helper defaults to 3000 characters per page; event triage uses 2000. Keep the run's chosen limit explicit. [browserbase/skills, company-research and event-prospecting]
- **Evidence fields:** `URL / FETCH_OK / FALLBACK_TO_BROWSE / TITLE / META_DESCRIPTION / OG_TITLE / OG_DESCRIPTION / HEADINGS (" | " joined) / BODY_CHARS / BODY:`. [browserbase/skills, extract_page.mjs]
- **Counters filled by JavaScript** `[coreyhaines31/marketingskills, competitor-profiling]`: headcount, client counts and live stats "return placeholder values" to a plain fetch; "note the gap and flag as "JS-rendered, value unconfirmed" in the profile", or read it through the browser fallback.

## Prove it

Pick five finished files at random: every `product_description` matches text in the extractor output or a cited search result, or reads `Unknown` with a score of 3 or less; every finding line carries a confidence and a URL; no "existing customer" is missing from the profile's `existing_customers`; the discovery list holds one homepage per domain and none of the noise domains.
