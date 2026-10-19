# Compiling the HTML views and CSV

The Browserbase source compilers turn research artifacts into reports. This file documents their source contracts rather than supplying those programs. [browserbase/skills, company-research, competitor-analysis and event-prospecting; existing repository research rules]

## Source workspace prerequisite

The installed skill contains Markdown only: it does not bundle scripts, package manifests, profiles or report templates. Obtain and read the exact source resources for the selected job before using the commands below. Do not invent substitute helpers or assume source-relative paths resolve from this installed folder. [browserbase/skills, source workspace inventories]

| Job | Exact source resources |
| --- | --- |
| Company research | [scripts](https://github.com/browserbase/skills/tree/main/skills/company-research/scripts), [profiles](https://github.com/browserbase/skills/tree/main/skills/company-research/profiles), [references/templates](https://github.com/browserbase/skills/tree/main/skills/company-research/references) |
| Competitor analysis | [scripts](https://github.com/browserbase/skills/tree/main/skills/competitor-analysis/scripts), [references/templates](https://github.com/browserbase/skills/tree/main/skills/competitor-analysis/references) |
| Event prospecting | [scripts](https://github.com/browserbase/skills/tree/main/skills/event-prospecting/scripts), [profiles](https://github.com/browserbase/skills/tree/main/skills/event-prospecting/profiles), [references/templates](https://github.com/browserbase/skills/tree/main/skills/event-prospecting/references) |

These are existing source-workspace contracts, not fresh runtime certification of every helper. Inspect the exact obtained revision and preserve its version boundaries. [browserbase/skills, company-research, competitor-analysis and event-prospecting; existing repository research rules]

## The compiler

- **Source package metadata:** each source `scripts/package.json` is private with `"type": "module"` and no dependencies; the scripts use only Node built-in modules.
- **The compiler never changes the `.md` files,** so after manual edits it can simply be re-run.
- **The competitor compiler opens the output without a shell:** `execFileSync('open', [path])`, so a folder name with shell metacharacters can't break out into command execution. The company and event compilers use `execSync` with an interpolated string, the injection risk that avoids.
- **The company and event compilers fill templates with a function replacer:** `.replace(/\{\{TABLE_ROWS\}\}/g, () => tableRows)`, so a `$` in content (a price string, say) isn't read as `$&`, `$1` or `$$`.

## Company research

- `compile_report.mjs <dir> [--template] [--open]` parses the frontmatter of every `.md` and sorts by score descending.
- **Dedupe by name** with the corporate-suffix regex `/[,\s]+(inc|llc|ltd|corp|co)\.?$/i`, keeping the first (the highest score).
- **Score bands:** 8 and up high, 5 and up medium, else low; low % is 100 minus high % minus medium %.
- **Writes:** `index.html` from template placeholders (`{{TITLE}} {{COMPANY_NAME}} {{META}} {{TOTAL}} {{HIGH_COUNT}} {{MEDIUM_COUNT}} {{LOW_COUNT}} {{HIGH_PCT}} {{MEDIUM_PCT}} {{LOW_PCT}} {{TABLE_ROWS}}`); `companies/{slug}.html` only when the body is over 50 characters; `results.csv` with the priority columns first and the rest alphabetical. A JSON summary goes to stderr, the index path to stdout.

## Competitor analysis

- **Dedupe with a load-bearing `\b`:** `/\s*\b(inc|llc|ltd|corp|co)\b\s*\.?$/i`. Without it the regex strips "co" from inside names like Cisco or Costco.
- **Filter the user's own company out of every competitor view** with normalized exact matching, not fuzzy, or the user appears as a phantom column with every feature false.
- **Normalize source-type aliases** (HackerNews to HN, Twitter to X, unknown to Blog) so every mention has a styled pill.
- **Feature pills** fall back from pipes to `;` or `,` splits, capped at 42 characters.
- **Win and loss without summaries:** winning is a feature the user has and at most one competitor has, sorted by rarity; losing is one the user lacks and at least three competitors have. When summary prose exists, render the prose and hide the count badge.
- **Views:** `index.html`; `competitors/*.html` with the hero screenshot and battle card embedded; `matrix.html` with a sticky first column, filled or dotted cells, the curated axis from `matrix.json` (else the top 18 pipe-split items); `mentions.html` with client-side filter buttons; `results.csv` adding `mention_count` and `benchmark_count`.

## Event prospecting

- **Parse drifted files instead of losing them:** frontmatter ends at a closing `---` or the first `## ` heading, so the file still parses; YAML pipe scalars and nested blocks are read; when subagents drift, fall back to `## Hook`, `## DM Opener` or `## Why the person` sections.
- **Group people by resolved company** (slug, then name, normalized name, slugified name), mapping every variant slug to the dedup winner. Effective score: the company's, else the person's, else -1.
- **Bucket roles carefully:** check VP and Director before Founder and CXO ("Vice President" would otherwise match "president"), and anchor two-letter tokens with `\b` ("development" would otherwise match pm).
- **Escape JS before HTML** for `onerror` initials fallbacks.
- **Pages:** `index.html` grouped by company plus an "Unmatched" group; `people.html` with chips for ICP band, role and company; `companies.html` with expandable attendees; a CSV with one row per person, quoting on comma, quote, LF or bare CR (RFC 4180). A "Copy DM opener" button uses `navigator.clipboard` with an `execCommand` fallback.
- **Inject, don't rewrite the template:** the template's `<table>` is swapped for content, and CSS and JS go in before `</style>` and `</body>`.

## The chat summary

After compiling: the totals, the depth, the score distribution (8-10, 5-7, 1-4), the output path, a top table sorted by score, the top 3-5 with the angle of approach, and an offer to dig deeper or re-run.

## Prove it

After obtaining and inspecting the selected source compiler, run it twice on the same authorized folder and diff the output; the CSV opens with one row per entity and a quoted field containing a comma survives; no company appears twice under a suffix variant ("Acme" and "Acme Inc"), and Cisco keeps its name; the user's company is absent from every competitor column; a price with `$` renders unchanged.
