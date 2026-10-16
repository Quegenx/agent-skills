# Competitor analysis

**Contents:** [The pipeline](#the-pipeline) · [Discovery waves](#discovery-waves) · [The category gate](#the-category-gate) · [The confirm step](#the-confirm-step) · [Lanes and the merge](#lanes-and-the-merge) · [The feature matrix](#the-feature-matrix) · [The fact-check](#the-fact-check) · [Battle cards](#battle-cards) · [Screenshots](#screenshots) · [Prove it](#prove-it)

## The pipeline

0 setup, 1 self-research (the same five-lane depth as competitors), 2 depth and seeds, 3 discovery (three waves), 4 gate, 4.5 user confirm (mandatory), 5 enrichment (five lanes per competitor), 5b `matrix.json`, 5c fact-check, 5d battle cards, re-merge, 6 screenshots, 7 compile.

- **Start every re-run clean.** The compiler ingests every `{slug}.md` and the merge never deletes slugs dropped from the current set: `rm -f "$OUTPUT_DIR"/*.md && rm -rf "$OUTPUT_DIR"/partials "$OUTPUT_DIR"/screenshots`.

## Discovery waves

Use all three; each finds what the others miss.

| Wave | Queries | Yield |
|---|---|---|
| A, generic alternatives | `"alternatives to {X}"`, `"{X} competitors"` | about 10% real competitors, mostly listicle aggregators |
| B, precise category | the profile's `precise_category` verbatim, plus 2-3 queries from its distinctive tokens | about 35% |
| C, comparison-page graph | `"{X} vs"`, `"{seed} vs"`, then parse "X vs Y" titles | uniquely surfaces named brands |

- **Parse the "vs" graph with a script** (`extract_vs_names.mjs <dir> [--prefix] [--seed "A,B,C"]`): apply `/\b([a-z][\w.\-]{2,})\s+(?:vs\.?|versus)\s+([a-z][\w.\-]{2,})/g` to lowercased titles; drop seeds and stopwords (`the, and, for, with, best, top, better, using, choosing`); count hits.
- **Resolve names to domains:** an exact root-base match wins; otherwise `startsWith(needle)` only when the suffix is in `api, search, app, ai, io, hq, co, dev, tech, cloud, agent, agents, labs, lab`, shortest suffix first. Exclude hosts whose root base equals a seed, or a short token like "exa" matches the user's own domain. Output JSONL `{name, hits, domain, example}`.
- **Unresolved names:** optionally `browse cloud search "{name}" --num-results 3` and take the top root domain; skip it if ambiguous.
- **Merge** filtered URLs, resolved names and seeds, dedupe by hostname, write `/tmp/competitor_candidates.txt`.

## The category gate

- **The profile drives it:**
  - `precise_category`: one sentence, never vague ("tools", "platform"). Good: "AI web search API for agents with neural + keyword retrieval".
  - `category_include_keywords`: 8-15 phrases a direct competitor's hero or title would contain, semantic variants included.
  - `exclusion_list`: phrases that mark a different category, such as `vector database, enterprise search appliance, site search widget, observability, analytics platform, data warehouse, scraping platform, internal knowledge base`.
- **The gate script** (`gate_candidates.mjs`, built on `browse`) reads URLs from stdin or `--input`. Flags: `--include` (required), `--exclude`, `--concurrency 6`, `--hero-chars 800`. Floor concurrency at 1: `--concurrency 0` spawns zero workers and exits "successfully" having gated nothing. It fetches with `browse cloud fetch --allow-redirects --format raw` (raw, because markdown has no `<title>`), timeout 20000 ms, 4 MB buffer, and parses `resp.content`.
- **Use async `execFile`, not `spawnSync`:** `spawnSync` blocks the event loop, which silently turns `--concurrency N` into 1.
- **Classify by position, in this order:**
  1. Include and exclude both in the title: compare counts in the first 200 hero characters. More includes PASS, more excludes REJECT, a tie PASS.
  2. Exclude in the title: REJECT.
  3. Include in the title: PASS.
  4. Include in the first 200 hero characters and no exclude there: PASS.
  5. Exclude in the first 200 hero characters: REJECT.
  6. Include anywhere in the hero, no exclude: PASS.
  7. Include and exclude both in characters 200-800: UNKNOWN, a genuinely ambiguous signal, surfaced for the user.
  8. Otherwise REJECT: no category signal.
  A failed fetch or non-JSON response is UNKNOWN. Output JSONL `{url,status,reason,matched_includes,matched_excludes,title,hero(240)}`, summary on stderr.
- **Measured:** on 12 candidates, 7 of 7 real competitors passed and 4 of 4 wrong-category sites were rejected.
- **Blind spots:** JS-heavy homepages (empty text), Cloudflare challenges (title "Just a moment..."), semantic variants ("search foundation", "retrieval backbone"), apex against product subdomain (`brave.com` against `api-dashboard.search.brave.com`). In one test the gate passed 22 of 101 and missed four real competitors. That is why the next step exists.

## The confirm step

- **Why:** enrichment is expensive. 5 competitors times 5 lane subagents is 25 subagents, about 10-15 minutes of wall clock and about 300 `browse cloud` calls.
- **Show three buckets,** a table each: PASS; UNKNOWN (always surface these, they are the silent misses); and rejected brands, the top 10 or so REJECTs whose titles contain a seed token or recur in the wave C graph.
- **Ask with checkboxes plus a free-text "add more" field** (Claude Code `AskUserQuestion`). Write the ticked set to `/tmp/competitor_enrichment_set.txt`, which is the enrichment input, not the passed list.
- **No answer, or "just run it":** fall back to the passed list and warn.

## Lanes and the merge

- **Five lanes, one subagent each,** writing `partials/{slug}.{lane}.md`:

| Lane | Covers |
|---|---|
| marketing | Owns the canonical frontmatter: pricing, features, positioning, integrations, customers, team, funding, HQ |
| discussion | Reddit, HN, forums, dev.to, hashnode; plus `"{c}" review 2026`, `"{c}" issues OR problems` |
| social | LinkedIn, YouTube, X; snippets only, don't fetch |
| news | Comparisons, tech press, Substack; every mention must have a date |
| technical | GitHub benchmarks, latency, rate limits, SDKs |

- **Classify sources by URL:** reddit Reddit; news.ycombinator HN; linkedin LinkedIn; youtube or youtu.be YouTube; twitter or x X; dev.to DevTo; hashnode Hashnode; `*.substack.com` Substack; Spotify episode, transistor, simplecast Podcast; g2, capterra, trustradius Review; "vs" in URL or title Comparison; techcrunch, theverge, venturebeat, forbes, businesswire, wired, fortune News; else Blog. Dates come from the result's date field, else the year in the title or URL.
- **Mention line:** `- **[SourceType]** Title | Snippet (source: URL, YYYY-MM-DD)`.
- **Body sections, parsed by heading, in order:** Product, Pricing, Features, Positioning, `Comparison vs {user}` (deeper), Mentions, Benchmarks (deeper), Research Findings. The merge writes the Battle Card section after the comparison.
- **The strategic diff is synthesis only,** no new fetches: Overlaps, Gaps, Where they win, Where you win, plus a one-line `strategic_diff`. No ICP score, no threat score.
- **Normalize drift at merge time instead of fighting it in prompts** (`merge_partials.mjs <dir>`):
  - Lanes `marketing, discussion, social, news, technical, battle`; no marketing partial, skip the slug.
  - Mentions: rewrite the observed variant formats into the canonical line, dedupe by URL, sort by date descending with undated last. Benchmarks dedupe by URL, findings by exact text.
  - Frontmatter keeps a whitelist of canonical fields (including `pricing_url`), dropping leaked meta fields such as `notes, searches_run, lane`. Aliases: `competitor/name/company` to `competitor_name`, `homepage/url` to `website`, `price_tiers` to `pricing_tiers`, `pricing` to `pricing_model` (routing it to `pricing_tiers` corrupted the structured tier data). Other lanes fill canonical gaps.
  - Battle: take the whole battle body whatever its heading style, and strip a first heading mentioning "Battle Card" so it isn't duplicated.
- **Parse markdown tolerantly:** CRLF-safe frontmatter, body and section parsing, split on `## `; content before the first heading is dropped.

## The feature matrix

- **Don't split prose into an axis.** Subagents write `key_features` and `integrations` as prose, so a pipe-split axis yields a useless diagonal. The main agent builds a shared taxonomy of 12-20 atomic yes/no features and 10-20 integrations, avoiding features only one competitor has.
- **The user is competitor zero,** with the same evidence rules. Every flag must be traceable to a Research Findings bullet with a cited URL; not mentioned means false.
- **`matrix.json`:** `{category, features:[{name,description}], integrations:[{name}], userCompany:{name, winningSummary, losingSummary, features:{}, integrations:{}}, competitors:{slug:{features:{},integrations:{}}}}`, plus `sources:{Feature:url}` after the fact-check. `userCompany` is required for the win and loss cards.
- **Write in two passes:** draft the summaries first, which tells the fact-checker which cells are high-stakes; after the fact-check, rewrite them to reflect only checked cells.

## The fact-check

- **Spot-check, not a full sweep:** one shell-only subagent with a hard budget of 25 calls.
- **Priority:** cells named in the summaries; compliance (SOC 2, HIPAA, ISO 27001, GDPR); open-source licence claims; pricing numbers; funding and employee counts only if cited.
- **Skip:** universal table stakes (REST, JSON, Python SDK, API-key auth), `false` cells with no claim attached, integrations not in the summaries.
- **Rules:** a `true` cell needs one source URL; flip a `false` cell only on first-party evidence; a status page is not an SLA. Log flips to `matrix_fact_check.md` and report `spot-check: N cells verified, M flipped, B/25 budget used`.
- **Evidence:** one matrix claimed SOC 2 was unique to the user, but three competitors had it. A full sweep of 231 cells got stuck past 111 calls; full-sweep mode is opt-in, at 80 calls.

## Battle cards

- **A sixth lane, synthesis only, after the fact-check;** deep and deeper only. Fresh searches here would bring back the hallucinated-moat problem. Inputs: the five partials, the user's merged `.md` and the fact-checked `matrix.json`; cells without `sources` are rejected. Read all inputs in one `cat`, write one heredoc, about 3-5 Bash calls.
- **Format:**
  - Landmines (3-5): `- **{fact}**: {how an AE uses it}. (source: url)`, preferring third-party evidence.
  - Objection handlers (3-5): `If they say: "..." / You say: ... (evidence: url)`, each citing a confirmed user moat; objections come from the competitor's strongest marketing lines.
  - Talk tracks (2-3): 1-2 sentence pitches, no hyperbole.
- **Self-check before writing:** every URL appears in an input partial; no claim contradicts a sourced matrix cell; no track claims a feature where `userCompany.features[X] = false`; objections are realistic, not strawmen. Three cited landmines beat five half-invented ones.
- **Re-run the merge after this lane,** or the battle cards never reach the report.

## Screenshots

- **A capture script** (`capture_screenshots.mjs <dir> [--mode remote|local] [--concurrency] [--skip-existing]`, `browse` CLI): a dedicated named session (`-s competitor-analysis-shots`) so it never collides with the user's session, since the default session is bound to one mode. Concurrency is clamped to 1, because a shared session would race on one tab. Steps: `browse open`, `viewport 1280 800`, `wait timeout 1500`, `screenshot --path ... --animations disabled`, and `browse stop -s SESSION` at the end (it doesn't accept `--remote` or `--local`). Writes `screenshots/{slug}-hero.png`, about 10-20 s per competitor.
- **Check where the tab landed, not the exit code.** `browse open` exits 0 even when navigation fails and leaves the tab on `chrome-error://chromewebdata/`. Treat `chrome-error://`, `about:blank` or an empty URL as a failure, so a stale page is never saved under another slug.

## Prove it

The enrichment set file holds exactly what the user ticked; every competitor has a marketing partial; `matrix.json` has a `userCompany` and a `sources` entry for every summary cell; `matrix_fact_check.md` ends with the spot-check line within 25 calls; every battle-card URL appears in that competitor's partials; no screenshot was taken from a `chrome-error://` tab.
