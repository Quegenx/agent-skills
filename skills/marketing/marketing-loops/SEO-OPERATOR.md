# The SEO operator

A recipe for handing an agent the whole SEO job for one site, run from the site's own repo on a schedule. It doesn't add new mechanics. It bundles the SEO loops from the catalog, gives them one shared memory, and sets the rules that keep an always-on agent useful instead of busy.

Source: [coreyhaines31/marketingskills, marketing-loops] `references/seo-operator.md` (v1.6.0, MIT, Corey Haines), copied with its dashes replaced, skill names mapped to this repo, and `.agents/product-marketing.md` written as this repo's `.agents/product-context.md`.

Use it when the user wants SEO run for them rather than advice about SEO, and the agent can work in the repo that builds the marketing site. If the site lives in a hosted builder with no repo access, run the same loops in draft mode and hand the changes to a human.

## Before the first run

Settle five things with the owner and write them at the top of the operator brief (below):

| Setting | What to capture |
|---------|-----------------|
| **Site** | The production URL |
| **Conversion** | The one action that counts (trial, demo request, purchase). Traffic that never reaches it isn't the goal |
| **Competitors** | 3 to 8 names, or permission to find them from the SERPs and AI answers |
| **Ship mode** | Stage site changes for review by default; publishing requires the owner's explicit authorization; see [LOOP-GUARDRAILS.md](LOOP-GUARDRAILS.md) |
| **Data access** | Which of Search Console, analytics, a rank or backlink tool, and an AI-visibility tool the agent can read |

Then confirm the foundation: tracking works (the tracking-QA loop), and `.agents/product-context.md` exists. If it doesn't, build it with [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md) first. The operator reads product facts from there; it doesn't keep a second copy.

## Shared memory

Agents start every run with no memory, so everything the operator knows lives in files. Use the loop-state convention (`.agents/loops/`) for run logs, plus one folder for SEO working files:

```
.agents/seo/
  brief.md          # the five settings above + any owner preferences
  claims.md         # claims ledger: each customer-facing fact, its source of truth, the pages that state it
  queries.csv       # query map: query, intent, page, status (live / planned / gap), position, last checked
  queue.md          # work queue, ranked by expected conversions per hour of effort
  prompts.md        # AI prompt panel by awareness stage, with each run's results
  snapshots/        # competitor sitemaps and key pages, for diffing
  reports/          # one file per weekly report
.agents/loops/seo-operator.log   # one line per run, acted or not
```

Two rules make the query map work. **Every page owns one primary query**, and **every query has at most one page.** Two pages chasing the same query is a defect: merge them and redirect the weaker one. (This is the source's practice; Google Search Central states no one-query-per-page rule.) A query with no page is a gap and goes in the queue. [coreyhaines31/marketingskills, marketing-loops, seo-operator.md]

The canonical [intent-cluster mapping](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/CLUSTERING.md#the-workflow) groups related queries by intent into a page and requires actual query/page evidence before calling cannibalization. Keep the operator's one-primary-query convention as its tagged practice; do not merge or redirect from query overlap alone, and retain the approval boundary for pages with traffic or backlinks below. [open-seo, keyword-clustering]

Every fact in `claims.md` cites where it came from (a file in the product repo, the live pricing page). Facts from memory don't go in.

## Run schedule

The loops it bundles are in [SEO-LOOPS.md](SEO-LOOPS.md) and [OPS-LOOPS.md](OPS-LOOPS.md) (claim drift, tracking-QA).

| Every run (daily, or on each deploy) | Weekly | Monthly |
|---|---|---|
| Site health crawl | Striking-distance push | Rebuild the query map (keyword-gap) |
| Claim drift | Ranking-drop watch | Content decay |
| Ship the top item in the queue | Indexing check | Comparison-page review ([comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md) asset audit) |
| Append to the run log | Internal linking | Backlink prospecting + directory submissions |
| | AI-answer check | One free-tool candidate ([lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md)) |
| | Competitor watch (sitemap diff) | |
| | Weekly report | |

Each cell is a catalog loop or a step defined below; run it with that loop's self-check, state, and stop rules. Skip any loop whose data isn't connected and say so in the report.

**Site health crawl.** Fetch the sitemap and request every URL. Flag non-200s, redirect chains, wrong canonicals, stray `noindex`, robots blocks, broken internal links, orphan pages, duplicate or missing titles and descriptions, and pages whose main content isn't in the server-rendered HTML. The [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md) skill covers each check.

**Indexing check.** Compare the sitemap to what Search Console reports as indexed. For each unindexed URL, find the cause (thin, duplicate, orphaned, blocked, canonicalized elsewhere) and fix that, not the symptom. If indexing can't be verified, report "not verified." Never report a page as indexed without checking.

**Competitor watch.** Diff each competitor's sitemap against last week's snapshot to see what they published, then check which of those pages rank. Queue a response only where you can build a better page, not for every page they ship.

## The first run

1. **Learn the repo.** How routes and posts are created, and where titles, meta descriptions, canonicals, the sitemap, robots.txt, and structured data come from. Add pages the way the repo already does.
2. **Learn the product** from the code and the live site until you can explain it better than the homepage does. Fill `claims.md`.
3. **Build the query map** from buyers, not search volume: the problems they search, category terms, competitor names, "alternative" and "vs" queries, integrations, use cases, pre-purchase questions.
4. **Crawl the site** and log every problem.
5. **Write the queue**, then ship the top three fixes in the agreed ship mode, so the first run ends with real changes instead of a plan.

## Operating rules

- **The output is changes to the site.** A memo recommending a fix isn't progress; a staged site change with the fix is. Research earns its place only when it produces a change.
- **Finish before starting.** Ship the change in progress before opening the next one. Half-done drafts don't rank.
- **No guessing past missing data.** When a source isn't connected, note it in the report with what connecting it would make possible, then work with what exists. Don't fill gaps with estimates presented as data.
- **The product is the source of truth.** When a page and the product disagree, change the page. Never change the product, its pricing, or its claims to match marketing.
- **Escalate repeat failures.** If the same fix fails twice, stop, record what was tried, and raise it in the report.
- **Check before shipping.** Run the repo's lint, type check, and build, then load each changed page and look at it.
- **Don't break what earns.** Never delete, noindex, or redirect a page that gets traffic or has backlinks without the owner's approval.
- **Drafts only for anything outward-facing.** Outreach emails, directory listings, social posts, and new accounts are drafted for the owner to send. See [LOOP-GUARDRAILS.md](LOOP-GUARDRAILS.md).

## The writing gate

Before writing any new page, read the current top results for its query and write one sentence on what the new page will have that none of them do: original data, a real example from the product, a working tool, a clearer answer. If you can't write that sentence, don't write the page. This is the same information-gain test as in [content-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md).

Then:
- Answer the query in the first two sentences, then add detail.
- Use what only this company has: product screenshots, real numbers, the owner's opinions. If none exist for a topic, ask for them in the report rather than writing around the gap.
- Never invent a statistic, quote, customer, review, price, or benchmark.
- Ship each new page with the checklist in the source's seo-audit [rankings push reference](https://github.com/coreyhaines31/marketingskills/blob/main/skills/seo-audit/references/rankings-push.md) (this repo's on-page rules: [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md)): internal links from at least three existing pages, title, meta description, canonical, sitemap entry, structured data where it fits.
- Draft one social post per new article, built on its single most useful point ([social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md)).

## The weekly report

One screen, written to `.agents/seo/reports/YYYY-MM-DD.md`:

```markdown
## SEO week of [date]
**Shipped:** [each change, with its URL]
**Moved:** [clicks, impressions, positions, conversions vs last week, each with its source]
**Broken:** [open problems, worst first]
**Next:** [top 3 queue items]
**Need from you:** [at most 3 asks: data access, approvals, facts or screenshots only the owner has]
```

If a number can't be sourced, leave it out rather than estimating it.

## When not to run an operator

- **The site has almost no search demand to win** (a brand-new category, a tiny niche). Spend on positioning and distribution first.
- **No one will review staged changes.** Unreviewed changes accumulate; use a weekly manual run instead. [coreyhaines31/marketingskills, marketing-loops; owner exclusion of GitHub lifecycle workflows]
- **Tracking is broken.** Fix it first. Every loop above reads from it.

## Prove it

The brief holds the five settings before the first run; ship mode stages changes for review unless the owner authorized publishing; everything the operator knows is in `.agents/seo/` and the run log, never memory; the query map labels its source convention and checks cannibalization against the canonical intent-cluster evidence; no page is reported as indexed without a Search Console check; the first run ends with three shipped fixes; no page with traffic or backlinks was deleted, noindexed or redirected without approval; every new page passed the one-sentence information-gain test and invents no statistic, quote, customer, review, price or benchmark; outreach, listings and posts stayed drafts; the weekly report fits one screen and every number in it has a source.
