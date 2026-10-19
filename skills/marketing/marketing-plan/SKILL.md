---
name: marketing-plan
description: "Builds a 12-month marketing plan for a company or client in 13 AARRR-structured sections (Acquisition, Activation, Retention, Referral, Revenue), fitted to its real budget, team, stage and funding milestones: intake, a 17-section current-state rubric, budget math, market sizing, a 90-day roadmap with owners, the skills and tools that execute each move, the 139-idea bank, measurement and RACI, resumable from a progress file. Use when the user wants a marketing, growth or go-to-market plan, a 90-day or 12-month roadmap, a fractional CMO plan, a marketing budget, or a TAM, SAM and SOM market sizing."
---

# Marketing plan

The deliverable is one markdown document, the kind of strategy artifact a fractional CMO presents to founders: specific to the client, exhaustive across the tactical surface, and "operationally honest (reflects what their team can actually execute with their current stack and headcount)". AARRR gives the plan its structure; "marketing as investing" gives it its spine. Source: [coreyhaines31/marketingskills, marketing-plan] v1.2.2 (MIT, Corey Haines; its investing principles, budget methods, growth patterns and team model credit *Founding Marketing* by Corey Haines; its market sizing credits @imMamdouhaboammar, PR #418), copied with its dashes replaced and its skills mapped to this repo. The source reads `.agents/product-marketing.md`; this repo's file is `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The three phases: folder layout, `progress.md` schema, the resumption tree, path safety, live data pulls, the ten-topic intake, `research.md`, the section review loop, the brand-voice gate, the six FINALIZE checks and finalized state | [METHODOLOGY.md](METHODOLOGY.md) |
| The 13 sections: title block, purpose, length and structure of each, the unit-economics table, the 90-day sprints, RACI, open decisions, "is this section done?" | [PLAN-TEMPLATE.md](PLAN-TEMPLATE.md) |
| AARRR stages and metrics, the signup boundary, choosing the binding-constraint stage, stage patterns, assigning a move to a stage | [AARRR.md](AARRR.md) |
| Revenue-based and goal-based budgets (the corrected four-step formula), the experimental buffer, 3-3-2-2-2, blended CAC, forecasting honesty | [BUDGET.md](BUDGET.md) |
| The five funding tiers, category adjustments, Tier 1 tooling with store fees corrected, talking to founders about tier limits, tier skips | [FUNDING-STAGES.md](FUNDING-STAGES.md) |
| Growth phases, linear versus step growth, channel, product and market S-curves, 70/20/10, weekly plateau alerts | [GROWTH-PATTERNS.md](GROWTH-PATTERNS.md) |
| The 17-section current-state rubric with 0 to 5 anchors, common shapes, subjectivity tiers, ingesting a prior audit | [CURRENT-STATE-RUBRIC.md](CURRENT-STATE-RUBRIC.md) |
| Seven client archetypes and what each changes in Sections 4 to 8 | [CLIENT-TYPES.md](CLIENT-TYPES.md) |
| Market definition, TAM, SAM and SOM, four sizing methods, triangulation, confidence and evidence, the attractiveness scorecard | [MARKET-SIZING.md](MARKET-SIZING.md) |
| North stars by business model, leading indicators, review cadence, KPI targets, kill criteria and guardrails, data sources | [MEASUREMENT.md](MEASUREMENT.md) |
| Strategy in-house, execution outsourced; the three functions, the π-shaped first hire, titles, agencies, scaling the model | [TEAM-AND-AGENCIES.md](TEAM-AND-AGENCIES.md) |
| Section 11: this repo's skills per stage, tools per stage (MCP limits corrected), capability unlocks, the concrete-example test | [OPS-STACK.md](OPS-STACK.md) |
| Section 12: all 139 ideas mapped to a stage with their typical timing, and the five steps to apply them | [IDEA-CROSS-REFERENCE.md](IDEA-CROSS-REFERENCE.md) |
| The source's worked plan, condensed to the patterns worth copying and the numbers not to | [EXAMPLE-PLAN.md](EXAMPLE-PLAN.md) |

## When to use it

[coreyhaines31/marketingskills, marketing-plan]

- A new fractional CMO or consulting engagement; a founder who needs a 12-month roadmap to share with the team or investors; scattered marketing work (SEO research, voice docs, audit findings) to consolidate; an existing scored audit to sequence into action.
- **Not** for a single-channel tactical document (that goes to the channel's skill, such as [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md), [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md), [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md) or [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md)), and not for ideas without a plan ([growth-ideas](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/SKILL.md)).
- **A "quick, short plan" request** is resisted and explained rather than silently answered with a stripped-down plan: the plan is the comprehensive artifact, and a quick single-channel plan belongs to that channel's skill (the source's eval 6).

## The three phases

[coreyhaines31/marketingskills, marketing-plan]; detail in [METHODOLOGY.md](METHODOLOGY.md).

1. **INIT (research and intake):** read every material, pull data from wired tools ("Don't ask the user to copy/paste data that can be pulled directly"), run the ten-topic intake, score Section 3 with the rubric, save `research.md`.
2. **REVIEW:** draft Sections 2 to 13 in order, then Section 1; present each in chat ("Approve, adjust, or expand?"), save each confirmed section to `sections/NN.md`, tick it in `progress.md`.
3. **FINALIZE:** compile `final_plan.md` in order 1 to 13, run the six verification checks, set `phase: finalized`.

State lives in `~/marketing-plans/{client-slug}/` (`materials/`, `research.md`, `progress.md`, `sections/01.md`..., `final_plan.md`), so the plan resumes where it stopped. **A finalized plan is never silently overwritten:** ask whether to revise as v{N+1}, start fresh, or re-open a section. **Path safety:** build `{client-slug}` only by slugifying to lowercase `[a-z0-9-]`, reject `..`, `/` and absolute paths, and never read or write outside `~/marketing-plans/`, which "keeps one client's plan - and their data - from leaking into another client's context" (the same rule as path traversal in [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md)).

## The 13 sections

[coreyhaines31/marketingskills, marketing-plan]; templates in [PLAN-TEMPLATE.md](PLAN-TEMPLATE.md).

1. **Executive summary:** 3 big bets, 90-day priorities, the 12-month outcome; liftable into an investor or board update and readable in 60 seconds.
2. **Strategic frame:** category claim, ICP, business-model logic, brand-voice non-negotiables, the market-quality quadrant.
3. **Current state:** team, budget, done, in flight, stuck, scored with the 17-section rubric.
4. to 8. **Acquisition, Activation, Retention, Referral, Revenue:** current state, numbered moves, 90-day moves, 12-month outlook, skills and tools.
9. **90-day roadmap:** Weeks 1 to 2 Unblock, 3 to 4 Foundation, 5 to 8 Velocity, 9 to 12 Compound; AARRR-tagged, every row with an owner.
10. **12-month outlook:** quarterly milestones tied to funding-stage unlocks, with the budget method and its math.
11. **Marketing operations stack:** skills and tools per stage, capability unlocks, RACI by function.
12. **Tactical idea bank:** all 139 ideas with status Now / Q2 / Q3+ / Q4+ / Skip.
13. **Measurement, RACI, open decisions, appendix.**

Format: one markdown file, H2 headers (`## 1. Executive summary`), tables for RACI, the idea bank and the ops stack, cross-references written `§N`, about 8,000 to 12,000 words. "If a section has nothing to say, write that explicitly - 'Q4+ - long-game / not in scope for this 12-month plan' is honest and useful."

## Marketing as investing

The spine, from *Founding Marketing* ch. 1 [coreyhaines31/marketingskills, marketing-plan]:

- **Marketing is like investing:** a compounding portfolio, not a campaign calendar; buy-and-hold assets (SEO content, a newsletter, a community, a referral loop) over spikes; diversify; "Time in market beats timing the market."
- **No silver bullets, a hundred golden pellets.** "Be suspicious of any recommendation that promises to be *the* thing."
- **One asset, many returns:** sequence moves by downstream reuse (a cornerstone piece ranks, earns links, feeds the newsletter, seeds social, becomes a talk).
- **Audition, not an auction:** marketing is non-deterministic, so the plan runs a portfolio of bets and doubles down on what works.
- **Hope is not a strategy:** every move names its mechanism and its leading indicator; a move that can't be tied to a measurable is an experiment with a kill criterion.

The same compounding-over-rented idea, from a buyer's side, is in [revenuecat FORECASTING-AND-VALUATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/FORECASTING-AND-VALUATION.md) (distribution tiers); keep both.

### The market-quality gate

Score the core problem on size and frequency, and name the quadrant in Section 2 [coreyhaines31/marketingskills, marketing-plan]:

|  | **Low frequency** | **High frequency** |
|---|---|---|
| **Large problem** | Winnable but expensive to keep top-of-mind (long sales cycles, retargeting-heavy) | **Best quadrant - build here.** Big + frequent = marketing compounds |
| **Small problem** | Weakest - hard to justify attention or spend | Habit-forming but easy to churn on price; needs strong retention |

A weaker quadrant constrains CAC, channel mix and the budget math, and goes to Section 13's open decisions "rather than being papered over". "Is this market big enough?" is answered with [MARKET-SIZING.md](MARKET-SIZING.md).

## What every plan must customize

[coreyhaines31/marketingskills, marketing-plan]

1. **The current budget:** exact $/mo by line (paid, tools, headcount, retainers), blended CAC including salaries, content, tools and retainers, and the %-of-ARR allocation.
2. **Unit economics:** ARPC, annual retention, LTV.
3. **The team and its surface area,** and whether the strategic owner is π-shaped, T-shaped or tactical-only.
4. **Current channels,** each working / not / TBD.
5. **Past work to acknowledge.**
6. **The growth phase:** $0 to 10K ARR, $10K to 100K, $100K to 1M, $1M+.
7. **The next funding milestone** and what it unlocks.
8. **The skill that executes each move** (this repo's: [OPS-STACK.md](OPS-STACK.md)).
9. **The tool connection that enables each move.**

Anything unconfirmed in INIT goes to Section 13's open decisions. "**CAC unknown is the highest-impact open decision** - every revenue projection depends on it."

## Quality bar

Failure modes to avoid [coreyhaines31/marketingskills, marketing-plan]: listing tactics without sequencing; recommending what the team can't execute at its size; pretending paid budget exists before the round closes; glossing over uncomfortable metrics (churn) instead of naming them as open decisions; generic language ("build a community," "improve SEO") without specific moves; ignoring brand voice; padding with skills or ideas the client doesn't need; not acknowledging work already done.

**Tone:** "Write like a thoughtful colleague, not a deck-slide-writer. No jargon for jargon's sake. Direct claims, named tradeoffs, explicit assumptions. When unsure, name the open question rather than guessing." Prose rules: [anti-slop-writing](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md).

## The rules

1. **Read `.agents/product-context.md` first, then run the full intake** unless the user waives it ([METHODOLOGY.md](METHODOLOGY.md)) [coreyhaines31/marketingskills, marketing-plan].
2. **Every move names its AARRR stage, its owner, its skill and its tool** ([AARRR.md](AARRR.md), [OPS-STACK.md](OPS-STACK.md)) [coreyhaines31/marketingskills, marketing-plan].
3. **Fix the leak before pouring water in:** sequence the binding-constraint stage first, and layer paid only on a working organic baseline [coreyhaines31/marketingskills, marketing-plan].
4. **Tie every move to a funding tier;** never plan spend the client doesn't have ([FUNDING-STAGES.md](FUNDING-STAGES.md)) [coreyhaines31/marketingskills, marketing-plan].
5. **Set the budget by one method with its math shown;** the goal-based method is the four-step version in [BUDGET.md](BUDGET.md), not the source's older one-line formula [coreyhaines31/marketingskills, marketing-plan].
6. **Every rate divides matching closed windows;** a trial still in its window is pending, not failed ([MEASUREMENT.md](MEASUREMENT.md)) [coreyhaines31/marketingskills, marketing-plan].
7. **Unknown numbers are `[TBD - to confirm with team]` and open decisions,** never guesses; market sizes are ranges with confidence labels ([MARKET-SIZING.md](MARKET-SIZING.md)) [coreyhaines31/marketingskills, marketing-plan].
8. **Never overwrite a finalized plan, and keep every path inside `~/marketing-plans/{client-slug}/`** [coreyhaines31/marketingskills, marketing-plan].
9. **No tool is credited with what its official docs don't list,** and no figure from the source's examples is reused as a benchmark ([OPS-STACK.md](OPS-STACK.md), [EXAMPLE-PLAN.md](EXAMPLE-PLAN.md)).

## Prove it

From the source's nine evals [coreyhaines31/marketingskills, marketing-plan]:

- A Series A B2B SaaS at $2M ARR: the context file is read, INIT runs the intake, the 13 sections follow AARRR, Section 3 uses the rubric, Section 9 has owners, Section 10 names funding unlocks, Section 11 maps skills and tools, Section 12 covers all 139 ideas, and the plan is specific to the client.
- A pre-seed, $0, beta D2C app: Tier 1, no paid moves until budget unlocks, organic, lifecycle and ambassador acquisition, what seed unlocks named, the binding stage identified, an executive summary fit for investors.
- "Turn our audit into a plan": the audit's scores go into Section 3 with their date, nothing is re-scored, and the full 13 sections still follow.
- "Pick up where we left off": `progress.md` is read and the plan resumes; a finalized plan prompts revise / fresh / re-open.
- A hybrid hardware and software company at Series A: the hybrid archetype's emphasis in every stage, Series A budgets, skips with reasons.
- "Just give me a quick plan": resisted with the reason and the alternatives.
- A founder asking for the one channel: answered with the investing framing, the size and frequency gate, 70/20/10 and weekly plateau alerts, mapped to §2, §10 and §13.
- A "$12B market" claim: the market is defined, TAM, SAM and SOM are separated, two methods are triangulated with visible math, and ranges carry confidence labels and the assumption to test.
- $1M to $2M at $50 ARPC, $100 CAC and 85% retention on both cohorts: 2,255 customers, $225,500 before the buffer, a check of $2,000,050.
