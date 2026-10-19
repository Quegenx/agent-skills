# Answer accuracy: what AI says about you

Visibility counts whether you appear; this checks what the answer says once you do. A brand can show up in every answer and still be described with last year's pricing, a missing integration or a limit it fixed months ago. The ledger, verdicts and fix order are [coreyhaines31/marketingskills, ai-seo, answer-accuracy] (MIT; adapted there from Profound's MIT ai-answer-accuracy-auditor). The scheduled version of this audit is a loop in [marketing-loops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md).

## When to run it

- An assistant states a wrong price, plan limit, feature or compatibility claim.
- Sales hears prospects repeat something false that "ChatGPT said".
- After a repositioning, pricing change, rebrand or product retirement.
- Quarterly for any brand with a regulated, safety or pricing-sensitive product.

## The claim ledger

Capture answers first, then log one row per claim. Record engine, model or surface, locale, prompt and capture date for every answer; "a claim you can't reproduce is hard to fix."

| Field | What goes in it |
|---|---|
| Engine and date | ChatGPT (search on), Gemini, AI Overviews, Perplexity, Copilot, Claude; capture date |
| Prompt | Exact wording, plus its prompt family ([PROMPT-RESEARCH.md](PROMPT-RESEARCH.md)) |
| Claim | The sentence as the model wrote it |
| Claim type | Price, availability, compatibility, feature, limitation, comparison, ranking, recommendation, caveat, sentiment |
| Verdict | One of the seven below |
| Evidence | The current source that confirms or contradicts it |
| Likely source | Your page, docs, a feed, a profile, a third-party article, a forum thread, or unknown |
| Severity | P0 to P3 (below) |
| Owner | Who fixes the source |

Extract every claim that could change a buying decision, including ones the user didn't ask about: "A question about pricing that comes back with an unprompted 'but it lacks SSO' is two claims."

**Seven verdicts:**
1. Accurate and current
2. Accurate but incomplete: true, but missing the fact that matters
3. Ambiguous: could be read as true or false
4. Stale: was true, isn't now
5. False
6. Subjective framing: an opinion stated as fact ("best for small teams", "hard to set up")
7. Unverifiable: no current source either way

Check first-party facts against your current product material and claims about the outside world against reliable independent sources. "Your preferred marketing wording is not evidence."

## Severity

The source's Critical, High, Medium and Low are written here as P0 to P3, the repo's scale ([code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md)).

| Level | Examples |
|---|---|
| **P0** (source: Critical) | Safety, legal, eligibility, price, availability or compatibility errors that could cause a bad purchase or real harm |
| **P1** (High) | False comparisons, invented limitations, stale product facts in high-value prompt families |
| **P2** (Medium) | Incomplete or slanted framing that could plausibly change a decision |
| **P3** (Low) | Tone and wording that don't change the decision |

Weight by exposure too: a P2 error in every run of the top commercial prompt outranks a P1 in one obscure prompt. A wrong local price in another market is P0 ([CITATION-SURFACES.md](CITATION-SURFACES.md#other-languages-and-markets)).

## Fix the source first

"The answer is downstream of what the model retrieved or learned."
1. **Trace it.** Search the claim's wording, check which sources the engine cited, find the page where the wrong fact lives.
2. **Fix your own sources.** State the correct fact plainly, with a date, on the page that should own it (pricing, docs, changelog, comparison page, help center). Remove or redirect the outdated page. Update feeds and structured data that carry the same fact.
3. **Fix your profiles.** Review sites, app marketplaces, company databases, LinkedIn and partner directories often hold the stale version.
4. **Ask third parties for factual corrections only,** with the correct fact and a source. Don't ask them to remove legitimate criticism.
5. **Retest** the same prompts after a set window (the source suggests 4 to 8 weeks) with a few controlled variants. "One clean run proves nothing."

"Never promise that a source fix will change the answer. Models retrain and re-retrieve on their own schedules."

**Off limits:** fabricated corrections, editing Wikipedia about yourself, astroturfed forum posts, and pressuring publishers to pull fair criticism.

## The report

1. Accuracy rate across the cohort, the riskiest narrative and the main source problem
2. The claim ledger
3. Owned-source fixes, each with the exact fact and the page that should state it
4. Third-party correction requests, factual and sourced
5. The retest plan and date
6. Unknowns

Accuracy fixes wrong facts; positioning fixes the wrong story ([CITATION-SURFACES.md](CITATION-SURFACES.md#positioning-moves-slowly)).

## Prove it

Every ledger row has engine, date, exact prompt and a current evidence link; every P0 and P1 row names the owning page and an owner; the corrected fact appears with a date on that page and in its feeds and structured data; third-party requests contain only factual corrections; and the retest date is set with the same prompts.
