# Setup, subagents and the fan-out

## The pipeline shape

- **One orchestrator, many research subagents:** the orchestrator does one-time setup and is the only one that talks to the user; subagents research in parallel and each writes one markdown file per entity (YAML frontmatter plus body sections); a deterministic Node script compiles the HTML views and a CSV.
- **Fix the interaction points.** Company research asks once: "This is the ONLY user interaction. After this, execute silently until results are ready." Competitor analysis asks at setup and then has a mandatory confirm before enrichment (COMPETITORS.md). Event prospecting asks once, about enrichment scope (EVENTS.md).

## Profiles of the user's company

- **Keep one shared marketing context.** [browserbase/skills, company-research/SKILL.md; repository context convention] Read `.agents/product-context.md` as defined in [CONTEXT.md](../../anti-ai-slop/anti-slop-copy/CONTEXT.md). The source's research profiles below are job artifacts, not a second definition of shared marketing context; confirm any run-specific ICP against that context instead of silently replacing it.
- **Store one profile per company** at `profiles/{slug}.json`, the same shape for every research job: `company, website, product, icp_description, existing_customers[], competitors[], use_cases[], researched_at`. Competitor analysis adds `precise_category`, `category_include_keywords` and `exclusion_list` (COMPETITORS.md).
- **Keep profiles out of git:** `.gitignore` with `profiles/*.json` and `!profiles/example.json`.
- **A profile is a fact sheet:** Company, Product, Existing Customers, Competitors, Use Cases. Don't put the ICP, the pitch angle or sub-verticals in it; those are per-run targeting decisions.
- **Research the user's own company properly.** A thin profile produces generic search queries, weak lead scoring and cookie-cutter emails. The scoring spec those leads feed is [revops LEAD-SCORING.md](../../marketing/revops/LEAD-SCORING.md).
- **Reuse with a confirm:** "I have your profile from {researched_at}. Still accurate?" If yes, skip self-research. For competitor analysis, still run the lane enrichment on the user's company so the matrix has fresh evidence.
- **Resolve the profile without guessing** (event prospecting): an explicit `--user-company <slug>` first; otherwise list `profiles/*.json` excluding `example.json`. Exactly one: use it and say which. Several: ask. None: fail loudly with instructions. Never look outside the skill's `profiles/` folder, and never use `example.json`, which is a template.

## Subagent prompts

- **Embed context verbatim in every prompt:** the confirmed ICP description, the full literal output path, the user's company name, product and key features, and from the profile `company, product, icp_description, existing_customers`.
- **Subagents report counts, not data:** "Batch {batch_id}: {succeeded}/{total} researched, {findings_count} total findings." Discovery subagents report only the count of results per batch. The main agent never reads raw discovery JSON; it dedupes with a script (EVIDENCE.md).

## Tools and permission prompts

- **Shell only in subagents** (Claude Code): subagents may use only Bash. WebFetch, WebSearch, Write, Read, Glob and Grep are banned, and using any one fails the run.
- **One CLI for the web** (Browserbase `browse` CLI): every search goes through `browse cloud search`, every fetch through `browse cloud fetch` or the extractor script (EVIDENCE.md), never the built-in web tools.
- **One Bash call is one permission prompt.** Batch all of a subagent's file writes into a single Bash call of chained heredocs, and chain searches and fetches with `&&`.
- **Write files with a quoted heredoc delimiter** so the shell expands nothing, one delimiter per file kind (`COMPANY_MD`, `COMPETITOR_MD`, `PERSON_MD`, `BATTLE_MD`). Never the Write tool or `python3 -c`.

```bash
cat << 'COMPANY_MD' > {OUTPUT_DIR}/{slug}.md
...
COMPANY_MD
```

- **Use full literal paths** (Claude Code): `~` and `$HOME` trigger "shell expansion syntax" approval prompts. Resolve the home directory once and replace `{SKILL_DIR}` with the literal path in subagent prompts.
- **Offer a permanent allowlist** (Claude Code, `~/.claude/settings.json` under `permissions.allow`): `"Bash(browse:*)", "Bash(bunx:*)", "Bash(bun:*)", "Bash(node:*)", "Bash(cat:*)", "Bash(mkdir:*)", "Bash(sed:*)", "Bash(head:*)", "Bash(tr:*)", "Bash(rm:*)"`.

## Depth modes

Company research:

| Mode | Research per company | Best for |
|---|---|---|
| quick | Homepage plus 1-2 searches (2-3 calls); skips the planning step | about 100 companies |
| deep | 2-3 sub-questions, 5-8 calls | about 50 companies |
| deeper | 4-5 sub-questions, 10-15 calls | about 25 companies |

Competitor analysis: quick runs lane 1 only for about 30-50 competitors; deep runs lanes 1 and 2 for about 15-25 and yields 5-10 mentions across source types; deeper runs all 4 lanes for about 5-15. Profiling one competitor (competitor-profiling) defaults the other way round: "Default to **quick scan** unless the user requests deep profiling or specifies a small number of competitors (3 or fewer)." Its quick scan is homepage and pricing plus a domain rank and ranked-keywords summary, skipping reviews, tech stack and backlink details; deep adds every key page, review sites, full backlinks and keywords, competitor discovery, tech stack, content strategy and review mining `[coreyhaines31/marketingskills, competitor-profiling]`.

## Hard call caps

- **Per entity:** competitor analysis caps quick at 3, deep at 8, deeper at 12 browse calls per competitor, with a per-lane budget in the fan-out of 5-8 (deep) and 10-15 (deeper). Event prospecting caps ICP triage at 1 call per company, deep research at 5 per company, and person enrichment at 4 per person (2 in deep mode, 4 in deeper).
- **Count in the call:** prepend a counter comment to every Bash call and reset N for each entity: `# browse call N/8 (deep mode)`, `# browse call N/{TOTAL}`, `# browse call N/5 (company: {slug})`, `# browse call N/{LANES} (person: {slug})`.
- **At the cap, write what you have.** Never a 9th call in deep mode "to be thorough". If a lane fails, don't compensate with an extra call; in triage, don't make a second call to "save" a company. Partial output beats blocking the pipeline.
- **Why it matters:** in one competitor run two lanes hit 29-30 calls each and took the wall clock of the whole 30-agent fan-out from 5 to 12 minutes.
- **Price the run.** A sample event: 99 seed companies, about 30 ICP fits, about 50 people. Triage 100 calls plus deep research 150 plus people 100 is about 350 tool calls.

## Waves and parallelism

The sources disagree on batching:

- **Waves of about 6:** company research and event prospecting launch up to about 6 Agent calls per message and send the rest in a second wave after the first returns.
- **Everything in one message:** competitor analysis, from measured runs, launches all subagents for a phase in one message with no cap per message, because the Agent tool runs them in parallel and the wall clock equals the slowest single agent. Splitting 50 subagents into 5 batches of 10 cost an extra 20 minutes; elsewhere it records 25 minutes in five rounds of 10 against 5 minutes in one message.

Either way:

- **Don't spawn subagents for small work.** Competitor discovery runs as 3 parallel Bash calls (one per wave) in one message: agent cold start and tool reasoning cost more than the work, and parallel Bash saves about 1-2 minutes per run.
- **Track background agents:** keep a returned-against-spawned tally, print "All N agents returned" before the next step, and answer "still running?" from the tally.

## Sizing

[browserbase/skills, company-research/references/workflow.md; competitor-analysis sizing recorded in COMPETITORS.md; event-prospecting/references/workflow.md] The source's batching quantities below are estimates; use observed retained counts for deliverable coverage.

| Job | Discovery | Research subagents | Over-discover |
|---|---|---|---|
| Company research | Count actual unique eligible homepages after deduplication and filtering | quick `ceil(urls/10)`, deep `/5`, deeper `/3` | Source estimates 2-3x discovery and 50-70% filtering loss; neither guarantees the requested count |
| Competitor analysis | Count actual unique candidates and the confirmed gated list | quick `/8`, deep `/4`, deeper `/2` | Source estimates about 3x discovery and 40-60% gate loss; neither guarantees the requested count |
| Event prospecting | | `triage = ceil(seed/10)`, `deep = ceil(icp_fits/5)`, `person = ceil(people/5)` | |

[browserbase/skills, company-research/SKILL.md and references/workflow.md; repository count correction] The old company recipe `ceil(requested/35)*20` does not ensure even `requested` raw URLs, so it cannot ensure the stated over-discovery after filtering. The competitor recipe `ceil(requested/20)*15` has the same shortfall. Treat source yield percentages as planning estimates; compare observed retained counts with the requested deliverable, report a shortfall and keep the agreed call budget. Do not silently equate expected raw URLs with completed research.

## Failures and counts

- **A subagent fails: log it and continue.** If more than 50% of a wave fail, pause and tell the user.
- **Missing content, two readings:** event prospecting still writes the file (`Unknown`, score 3 or less) because the file must exist for the compiler to render the row; company research skips the company and marks `product_description` as `Unknown`.
- **Check counts after each fan-out:** `ls companies/*.md | wc -l` equals `wc -l seed_companies.txt`, and `grep -l "triage_only: false" ... | wc -l` equals `wc -l icp_fits.txt`.

## Prove it

The profile in use is named in chat and isn't `example.json`; shared marketing context remains `.agents/product-context.md`; every subagent prompt contains the profile fields and the literal output path; each subagent's calls carry a counter that never exceeds its cap; retained entity counts are checked against the requested deliverable and any shortfall is reported; each wave's file count matches its input list; a wave with more than half its subagents failed stopped and asked.
