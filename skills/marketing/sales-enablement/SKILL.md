---
name: sales-enablement
description: "Writes the internal collateral a B2B sales team uses to close deals: sales decks with persona variants, one-pagers and leave-behinds, objection libraries and answers for one live deal, battle cards, win-loss analysis, demo scripts and talk tracks, cold call openers and voicemails within the telemarketing rules, ROI calculators, persona cards, sales case-study briefs, proposals and playbooks. Use when making a pitch deck, one-pager, objection doc, battle card, demo script, cold call script or sales playbook, answering an objection a prospect just raised, or finding out why deals are won and lost."
---

# Sales enablement

Collateral that reps actually use: decks, one-pagers, objection docs, demo scripts and playbooks that help close deals. Everything here comes from coreyhaines31/marketingskills, skill `sales-enablement` v2.4.0 (MIT, Corey Haines), copied with its wording kept and tagged `[coreyhaines31/marketingskills, sales-enablement]`, plus the FTC and FCC pages cited where a rule touches the law. Public, SEO-facing comparison pages are a different job ([comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)); so are buyer interviews and churn research ([customer-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md)), website copy ([anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)), cold emails ([cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md)), the offer itself (bonuses, guarantees, pricing structure: [offer-design SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md)) and lead stages, scoring and routing ([revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md)).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The 11-slide deck, the Situation, Complication, Resolution arc, per-slide include, avoid and copy prompts, technical, economic and champion variants, deck anti-patterns | [SALES-DECKS.md](SALES-DECKS.md) |
| One-pager structure and the four templates (product overview, use case, post-meeting leave-behind, champion enablement), print layout and file formats | [ONE-PAGERS.md](ONE-PAGERS.md) |
| Objection categories, the response framework, answering one objection from a live deal, the quick-reference table and the detailed objection library | [OBJECTION-HANDLING.md](OBJECTION-HANDLING.md) |
| A one-competitor battle card: when to ask which competitor, the eight sections, keeping it current | [BATTLE-CARDS.md](BATTLE-CARDS.md) |
| Win-loss analysis: sources and their bias, the coding scheme, interview questions, reading results with counts, the report and which asset each finding updates | [WIN-LOSS-ANALYSIS.md](WIN-LOSS-ANALYSIS.md) |
| Discovery, first demo, technical deep-dive and executive scripts scene by scene, interaction points, questions not to ask, "can you show me X?" | [DEMO-SCRIPTS.md](DEMO-SCRIPTS.md) |
| The first 30 seconds of a cold call, openers to avoid, first-minute pushback, voicemail, gatekeepers, reviewing calls, and the Do Not Call and AI-voice rules it must keep | [COLD-CALLS.md](COLD-CALLS.md) |
| ROI calculators, value props by persona, buyer persona cards, sales case-study briefs and the FTC results rule, proposals, playbooks | [SALES-ASSETS.md](SALES-ASSETS.md) |

## Before starting

The source reads `.agents/product-marketing.md` (or `.claude/product-marketing.md`, or the older `product-marketing-context.md`). In this repo the file is `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md); read it first and ask only for what it doesn't cover. [coreyhaines31/marketingskills, sales-enablement]

Gather (ask if not provided):

1. **Value proposition and differentiators:** what you sell and who it is for; what makes you different from the next best alternative; what outcomes you can prove.
2. **Sales motion:** self-serve, inside sales, field sales or hybrid; average deal size and sales cycle length; the personas in the buying decision.
3. **Collateral needs:** which assets, for which funnel stage, used by whom (AE, SDR, champion, prospect).
4. **Current state:** what exists today, what works and what doesn't, what reps ask for most.

If context is still missing, ask: which collateral; who will use it; which sales stage (prospecting, discovery, demo, negotiation, close); the target persona (title, seniority, department); the top 3 objections heard most.

## The rules

1. **Sales uses what sales trusts.** Involve reps in creation and use their language, not marketing's. "If reps rewrite your deck before sending it, you wrote the wrong deck." Test drafts with your top performers first. [coreyhaines31/marketingskills, sales-enablement]
2. **Situation-specific, not generic.** Tailor to persona, deal stage and use case: a deck for a CTO looks different from one for a VP of Sales; a post-meeting one-pager serves a different purpose than a trade-show one. [coreyhaines31/marketingskills, sales-enablement]
3. **Scannable over comprehensive.** "Reps need information in 3 seconds, not 30." Bold headers, short bullets, visual hierarchy. "If a rep can't find the answer mid-call, the doc has failed." [coreyhaines31/marketingskills, sales-enablement]
4. **Tie every claim to revenue, efficiency or risk reduction.** Features mean nothing without the "so what": replace "AI-powered analytics" with the outcome ("cut reporting time by [real measured %]"). The source's example figure is 80%; the number you write must be one you have, per the repo rule "Never invent a number" ([anti-slop SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop/SKILL.md)). [coreyhaines31/marketingskills, sales-enablement]
5. **Claims reps can defend.** "Reps repeat what you write to buyers who can check it. Anything a buyer can disprove in a minute costs more than it gains." [coreyhaines31/marketingskills, sales-enablement]
   - "Why we win" needs evidence: win/loss interviews, call recordings, customer quotes, or CRM reasons backed by one of those ([WIN-LOSS-ANALYSIS.md](WIN-LOSS-ANALYSIS.md)). Without it, write advantages as hypotheses for reps to test, and say what evidence would confirm them.
   - Competitor claims are dated and sourced, say "not listed on their site" rather than "they don't have it", and never state a competitor's motives as fact. Reps can reason about why a competitor did something, labelled as a guess.
   - Include where you lose. A competitive doc that admits when the competitor is the better fit is one reps will trust in front of a buyer.
6. **Proof is real or absent.** A certification slot ("[SOC 2 Type II / ISO 27001 / etc.] certified") is filled only with one the company holds, matching the repo ban on invented certifications ([anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md)). A results claim in a case study or deck follows the FTC typical-results rule ([SALES-ASSETS.md](SALES-ASSETS.md#case-study-briefs-sales-format)).
7. **Ask which competitor before a battle card.** A polished card about the wrong competitor looks finished, so nobody questions it ([BATTLE-CARDS.md](BATTLE-CARDS.md)). [coreyhaines31/marketingskills, sales-enablement]
8. **Answer the live deal, not with a generic doc,** when a rep brings one objection with a call coming up ([OBJECTION-HANDLING.md](OBJECTION-HANDLING.md#live-deal-objection)). [coreyhaines31/marketingskills, sales-enablement]
9. **Cold calls stay inside the law and honest:** no pretending you've met, a removal request is honoured, and the Do Not Call and AI-voice rules apply ([COLD-CALLS.md](COLD-CALLS.md)).

## Output format

[coreyhaines31/marketingskills, sales-enablement]

| Asset | Deliverable |
|---|---|
| Sales deck | Slide-by-slide outline with headline, body copy and speaker notes |
| One-pager | Full copy with layout guidance (visual hierarchy, sections) |
| Objection doc | Table format: objection, response, proof point, follow-up |
| Live objection | Likely concern, one response the rep can say as written, proof, follow-up question |
| Battle card | The eight sections on one page, every competitor fact with its source and date |
| Win-loss report | Scope, findings with counts and quotes, by-competitor breakdown, asset updates |
| Demo script | Scene-by-scene with timing, talk track and interaction points |
| ROI calculator | Input fields, formulas, output display with sample data |
| Playbook | Structured document with table of contents and sections |
| Persona card | One-page card format per persona |
| Proposal | Section-by-section copy with customization notes |

## Prove it

From the source's evals: a request for a public "us vs two named competitors" page is routed to [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md), not written as a battle card; a battle-card request that names no competitor gets one short question and no draft; a "why we win" line with no evidence is written as a hypothesis with the evidence that would confirm it; a live objection gets the likely concern, one sayable response, one defensible proof point and a question, without repeating the buyer's competitor claim as fact; a win-loss report states n on every finding and calls a slice under about 5 deals a signal; a cold call opener names the caller, gives a reason specific to the prospect, asks permission and ends on a question. Every number, logo, quote and certification in the output traces to the user's material or is a visible placeholder.
