# The competitive asset audit

Checking existing pages and sales assets for claims that went stale or were never true. From coreyhaines31/marketingskills `competitors` (MIT). It audits published assets over time; web-research's fact-check checks a fresh feature matrix once, on a 25-call budget ([web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md#the-fact-check)).

## Scope

`[coreyhaines31/marketingskills, competitors]` Every asset that makes claims about competitors: vs and alternative pages, battle cards, talk tracks, objection docs, comparison tables in decks.

## Steps

`[coreyhaines31/marketingskills, competitors]` Verbatim:
1. "**List each claim** about a competitor, with the asset and line it lives in."
2. "**Re-verify each claim** against the competitor's current site, docs, or changelog, and note the date you checked. If you can't browse, mark claims unchecked and list what to verify. Never mark one Current without a check date."
3. **Mark each one:**
   - **Current:** still true, source and date updated.
   - **Changed:** now wrong, with what it says now.
   - **Unverifiable:** had a source once, but nothing current confirms or rules it out. Soften to "not listed (as of date)" or remove.
   - **Overclaimed:** "stated as fact with no source behind it (an unconfirmed ✗, a guessed motive, a "why we win" with no evidence)". Rewrite to what the evidence supports or remove.
4. "**Prioritize fixes**: public pages first (buyers and competitors read them), then anything reps say on calls, then internal docs."
5. "**Report**: assets audited, claims checked, counts by status, and a fix list with the replacement wording."

Apply the evidence rules ([SKILL.md](SKILL.md#evidence-discipline)) to internal sales assets too. "Where several assets repeat one fact, fix it in the centralized competitor data so the fix carries through" ([DATA-AND-HUB.md](DATA-AND-HUB.md)).

The source ranks fixes by audience (public, reps, internal); keep that ordering and assign every finding P0 to P3 severity separately. This file formerly treated audience order as a replacement for severity, contrary to the owner's one-scale rule. [coreyhaines31/marketingskills, competitors; repository owner severity policy]

## Refresh cadence

`[coreyhaines31/marketingskills, competitors]`
- **Quarterly:** verify pricing, check for major feature changes.
- **When notified:** a customer mentions a competitor change.
- **Annually:** full refresh of all competitor data.

Re-verify before any republish; update `last_verified` only after a real check.

## Prove it

Every claim row has a check date or reads Unchecked; no row is Current without one; the report gives assets audited, claims checked and counts by status; every Changed, Unverifiable and Overclaimed row has replacement wording; public-page rows come first in the fix list; each fix to a repeated fact lands in the data file.
