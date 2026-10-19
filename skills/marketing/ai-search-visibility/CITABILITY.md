# Citability heuristics and the aeo.js audit

What one open-source scorer measures when it calls a page "citable", and how to run it. Everything here is [aeo.js] (rubenmarcus/aeo.js v0.0.17, HEAD `cf8e3f1a`, 2026-10-06; package.json says MIT, the repo has no LICENSE file), measured from its source. These are **aeo.js heuristics, not platform rules**: no engine publishes a citability formula, and where a check disagrees with an official doc the doc is quoted next to it. Writing the blocks themselves is [CONTENT-BLOCKS.md](CONTENT-BLOCKS.md).

## Four citability dimensions

[aeo.js, src/core/citability.ts] 25 points each.

1. **Answer blocks.** A paragraph qualifies with 20 to 200 words, starting `^[A-Z][a-z]` but not with "This, That, These, Those, It, They, We, He, She, I". Three or more at a ratio of at least 0.5 score 25; two or more at 0.3 score 20; one scores 12; none 0. Paragraphs over 200 words get the hint to split them.
2. **Self-containment.** A paragraph counts as context-dependent when it matches any of:
   - `^(As mentioned|As noted|As described|As shown|As stated|As discussed)\b`
   - `^(However|Furthermore|Moreover|Additionally|In addition|Nevertheless)\b`
   - `\b(above|below|previously|the following|as follows|see also)\b`
   - `^(This|That|These|Those|It) (is|was|are|were|has|have|will|can|should|means)\b`

   A self-contained ratio of at least 0.8 scores 25, 0.6 scores 18, 0.4 scores 12, else 5. The repo's own list of AI-writing tells (some of the same openers) is [anti-slop-writing TELLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/TELLS.md).
3. **Statistical density.** Matches per 100 words of percentages, currencies, years 19xx and 20xx, quantities ("million"), metrics ("users", "customers") and comparisons ("Nx", "% faster"). At least 3 scores 25, 1.5 scores 20, 0.5 scores 12, any match 6. Stats with no evidence signal get "Add source links or attribution"; evidence signals are a URL, `[^1]`, or "according to", "source:", "reported by/in", "study/survey/report by/from", "data from", "cited by", each excluding self-references ("our", "my", "the company", "the team").
4. **Structure.** Headings 7; lists of 3 or more items 6 (1 to 2 items 3); an average paragraph of 167 words or fewer 6 (250 or fewer 3); a summary heading (`summary|tl;dr|overview|introduction|key takeaways|in brief`) 6, or a first paragraph of 60 words or fewer 3.

The source also suggests "aim for 100-167 words" per paragraph; nothing official sets a paragraph length, so it is left out.

## aeo.js scoring rubric

**Remote audit** (`remoteAuditSite`, six categories summing to 100; its CLI docs still say "5-category"):
- **AI Access (16):** robots 3, llms.txt 3, sitemap 3, no blanket disallow 3, 3 of 4 major bots 2, at least 70% of bots allowed 2.
- **Agent Protocols (30):** Link headers 3, Markdown negotiation 3, MCP card 3, WebMCP 2, Web Bot Auth 2, RFC 9728 2, ARD 2, Content-Signal 2, API catalog 2, A2A card 2, RFC 8414 1, auth.md 1, llms-full.txt 1, agent-skills 1, OpenAPI 1, DNS-AID 1, x402 1. None of these was checked against its spec.
- **Content Structure (13):** pages found 2, server-rendered 4, substantial content 2, h1 to h3 headings 2, a 20 to 200-word paragraph 2, alt text on at least 70% of images 1.
- **Schema (15):** JSON-LD 3, Organization name 2, logo 1, sameAs 2, Person 1, FAQPage or HowTo 3, Article, WebPage or BlogPosting 3.
- **Meta (13):** raw `<title>` 10 to 70 chars 3, description 50 to 200 chars 3, Open Graph 2, 80% or more pages titled 2, canonical 3.
- **Citability (13):** a 20 to 200-word paragraph 3, stats 2, FAQ (a `?` line or `<details>`, `<summary>`, `<dt>`) 3, `<ul>` or `<ol>` 2, 500 or more words 3.

**Local audit** (`auditSite`): five categories of 20 points (AI Access, Content Structure, Schema, Meta, Citability), each made of 4-point checks. **Grades:** 90 or more Excellent, 75 Good, 50 Fair, 25 Needs Work, below Poor.

Where the rubric disagrees with official docs:
- **FAQPage and HowTo points.** aeo.js's hints say "Google AI Overviews heavily rely on structured data" and "Add FAQPage or HowTo structured data to boost AI citation rate". Google: "There are no additional requirements to appear in AI Overviews or AI Mode", "no special schema.org structured data that you need to add" [https://developers.google.com/search/docs/appearance/ai-features]; the FAQ rich result is not shown from 2026-05-07 and HowTo from 2023-09-14 [https://developers.google.com/search/updates]. Those points measure nothing Google uses.
- **llms.txt points.** Lighthouse marks a missing llms.txt N/A, not a failure ([LLMS-TXT.md](LLMS-TXT.md#lighthouses-check)).
- **Meta lengths.** Title 10 to 70 and description 50 to 200 are aeo.js's numbers. Google: "There's no limit on how long a meta description can be" [https://developers.google.com/search/docs/appearance/snippet]. The repo's docs rule quotes c15t's house limits (60 and 160, "no standard sets them") in [developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#frontmatter-for-search-and-agents). Both are house numbers.

## Running it

[aeo.js, README, cli.mdx, mcp.mdx] Node 18+.
- `npx aeo.js check <domain>` (no install), `report <url> [--json]`, `init --url ... --yes`, `generate --url --title --out`, `mcp`. `check <url>` exits 1 when the target is invalid or unreachable.
- MCP: `claude mcp add aeo -- npx -y aeo.js mcp`, exposing `audit_url`, `score_citability` and `generate_aeo_files` (newline-delimited JSON-RPC over stdio, protocol `2025-03-26`, logs to stderr). `generate_aeo_files` rejects an `outDir` outside the working directory. Review generated files against [LLMS-TXT.md](LLMS-TXT.md#anti-patterns-measured-in-aeojss-generator) and [AI-CRAWLERS.md](AI-CRAWLERS.md#errors-in-the-sources) before committing them.
- A CI gate on the local setup score, copied from the source:

```bash
SCORE=$(npx aeo.js check --json | jq '.audit.score')
[ "$SCORE" -ge 70 ] || { echo "GEO score $SCORE below 70"; exit 1; }
```

- For a deployed preview, the official remote form is `npx aeo.js check https://mysite.com --json`, with the actual target URL. The old Prove it line incorrectly described the local no-URL block as checking a deployed preview. [aeo.js CLI docs](https://github.com/rubenmarcus/aeo.js/blob/main/website/src/content/docs/features/cli.mdx)
- Its crawler: 12 s timeout, homepage plus 10 inner pages, at most 20 sitemap URLs, concurrency 5, UA `aeo.js (+https://aeojs.org)`, 1 MB body cap, manual redirects (at most 5, each re-checked), and the first 5 same-origin links when there is no sitemap. Its private-URL guard checks hostname strings only and never resolves DNS; the repo's SSRF rule resolves and checks the address ([secure-coding CATALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/CATALOG.md)).

A score is a worklist, not a result to report: gate on the checks you agree with, and drop the ones above that measure nothing a platform uses.

## Prove it

Every citability failure you fix is a real paragraph that now reads alone, not a regex dodged by rewording; the CI gate, if added, names whether it checks local setup or a deployed URL, uses the matching command and fails the build below the agreed score; and any report that quotes an aeo.js score says it is aeo.js's heuristic and which checks were excluded.
