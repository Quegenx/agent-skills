# Account research

"Research before outreach has one job: find a true, specific reason this account should care right now, and the person who owns that problem." [coreyhaines31/marketingskills, prospecting] references/account-research.md. Competitor dossiers and feature matrices are in [web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md); the anti-hallucination rules for any research field are in [web-research EVIDENCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/EVIDENCE.md).

## Research per tier

[coreyhaines31/marketingskills, prospecting]

| Tier | Time per account | Output |
|---|---|---|
| Tier 1 | 10 to 20 minutes, or an agent run reviewed by a human | The full brief (below) |
| Tier 2 | 2 to 3 minutes per account, plus shared segment research | One sourced hook per contact + the segment brief |
| Tier 3 | None per account | The segment brief only |

Tiers are defined in [SIGNALS.md](SIGNALS.md#account-tiers).

## Where the useful facts are

[coreyhaines31/marketingskills, prospecting] In rough order of usefulness:

1. **Their job posts.** The problem in their own words, the tools they use, their priorities ("own our experimentation roadmap").
2. **Their own pages.** Pricing, landing pages, changelog, careers, case studies. "For a services pitch, the page you'd improve is the research."
3. **What leaders say publicly.** LinkedIn posts, podcasts, conference talks, interviews.
4. **Company news.** Funding, launches, acquisitions, leadership changes, new markets.
5. **Filings and reports.** For public companies, the 10-K risk factors and earnings calls name priorities explicitly.
6. **Reviews of their product.** What their customers complain about shows what they're under pressure to fix.

Read the original public page, not a search snippet, before qualifying on it ([FIRST-CUSTOMERS.md](FIRST-CUSTOMERS.md#step-2-mine-the-five-signal-buckets)). web-research's rule for auth-walled sites, "for LinkedIn and YouTube, read the search snippet; don't fetch" ([web-research EVIDENCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/EVIDENCE.md#the-research-loop)), fits with it: a snippet can locate an account but can't qualify it.

## The Tier 1 brief

[coreyhaines31/marketingskills, prospecting]

```markdown
## [Company] account brief
**Fit:** [ICP criteria met, with any gaps]
**Signal:** [what happened, date, source URL]
**Likely priority:** [the problem the signal implies, in their words where possible]
**Evidence:** [2-4 facts, each with a source URL]
**Who owns it:** [name, title, why them; a second contact if multi-threading]
**Angle:** [one sentence connecting their situation to what you offer]
**Proof to use:** [the closest case study or result]
**Don't mention:** [anything sensitive, stale, or creepy, e.g. tracked website visits]
**Hook found:** yes / no
```

## Rules for agent research

[coreyhaines31/marketingskills, prospecting] "AI makes research cheap, and it also makes invented hooks cheap."

1. **Facts first, angle second.** "Step one collects facts, each with a source URL and date. Step two writes the angle using only those facts. Never let one step do both."
2. **"No hook found" is a valid result.** Drop the account to the segment message. "A generic hook dressed up as personal research is worse than an honest segment message."
3. **Bound the angles.** "Give the agent your 3-5 value propositions and require the angle to map to one of them. Unbounded creativity produces promises you can't keep."
4. **Date everything.** Discard anything older than its freshness window ([SIGNALS.md](SIGNALS.md#freshness-windows)).
5. **Quote, don't paraphrase, when it matters.** If the hook rests on something a leader said, keep the exact quote and link.
6. **Never use sensitive traits** (health, finances, politics, religion, family) even when public ([LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#sensitive-traits)).

## Segment briefs (Tier 2 and 3)

[coreyhaines31/marketingskills, prospecting] Research the shared situation instead of each account:

- what the accounts have in common (the segment definition);
- the pain that commonality creates, with 2 to 3 public examples;
- the proof that speaks to it;
- the one-line opener each contact gets, plus the slot for a per-contact detail (Tier 2).

"A tight segment does the personalization work. 'Series A SaaS companies that just posted their first growth marketer role' needs little per-account research, because the segment already explains why you're writing."

## Prove it

Every Tier 1 account has a brief with every field filled or marked, each evidence line carries a URL and a date, and "Hook found" is answered; the angle maps to one of your stated value propositions; facts and angle came from separate steps; nothing in the brief is older than its freshness window or touches a sensitive trait; and accounts with "Hook found: no" get the segment message.
