---
name: marketing-council
description: "Convenes a simulated board of marketing advisors (Godin, Ogilvy, Schwartz, Hopkins, Halbert, Brunson, Hormozi, Dunford, Sutherland, Sharp, Handley, Vaynerchuk) that applies each one's documented frameworks to the user's question, maps where they disagree and ends with a chair's synthesis, a tripwire and handoffs. Use when the user wants several expert perspectives on a marketing decision, asks what a famous marketer would say, wants a plan debated, or wants to add their own advisor."
---

# Marketing council

The council is a simulated board of marketing advisors: marketers whose documented frameworks, published positions and known heuristics are applied to the user's specific problem. "The value isn't any single take - it's the *disagreement*. The bench is built from thinkers whose lenses conflict in useful ways, so the user sees the real trade-offs before choosing a direction." It is persona simulation, not the real people: every take is grounded in what the advisor wrote or said, and the output is labelled as simulation. The council decides direction; execution goes to the skill that owns it. Source: [coreyhaines31/marketingskills, marketing-council] v1.0.0 (MIT, Corey Haines), copied with its dashes replaced and its handoffs mapped to this repo.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Adding a custom advisor: the dossier template, public versus private advisors, where the file lives, seating it | [ADVISORS.md](ADVISORS.md) |
| Seth Godin: remarkability, permission, smallest viable audience | [advisors/seth-godin.md](advisors/seth-godin.md) |
| David Ogilvy: research-driven brand advertising with direct-response discipline | [advisors/david-ogilvy.md](advisors/david-ogilvy.md) |
| Eugene Schwartz: channel existing mass desire; awareness and sophistication stages | [advisors/eugene-schwartz.md](advisors/eugene-schwartz.md) |
| Claude Hopkins: scientific advertising, test everything, reason-why copy | [advisors/claude-hopkins.md](advisors/claude-hopkins.md) |
| Gary Halbert: the starving crowd, market and list before product and copy | [advisors/gary-halbert.md](advisors/gary-halbert.md) |
| Russell Brunson: funnels, value ladders, hook-story-offer | [advisors/russell-brunson.md](advisors/russell-brunson.md) |
| Alex Hormozi: offer construction and the value equation; volume and leverage | [advisors/alex-hormozi.md](advisors/alex-hormozi.md) |
| April Dunford: positioning against real competitive alternatives | [advisors/april-dunford.md](advisors/april-dunford.md) |
| Rory Sutherland: behavioral science and psycho-logic; the opposite of a good idea can also be a good idea | [advisors/rory-sutherland.md](advisors/rory-sutherland.md) |
| Byron Sharp: evidence-based brand science, mental and physical availability, reach over loyalty | [advisors/byron-sharp.md](advisors/byron-sharp.md) |
| Ann Handley: content and writing craft; slower, braver marketing | [advisors/ann-handley.md](advisors/ann-handley.md) |
| Gary Vaynerchuk: attention arbitrage, native content on underpriced channels at volume | [advisors/gary-vaynerchuk.md](advisors/gary-vaynerchuk.md) |

## Before starting

Read the product context file first, `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md). The source reads `.agents/product-marketing.md` (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md`); in this repo that is the older file CONTEXT.md offers to move. Then ask only for what's missing [coreyhaines31/marketingskills, marketing-council]:

1. **The question:** what decision or work product the council is reviewing (a strategy, a landing page, a pricing change, a launch plan, a rebrand, an ad account).
2. **The stakes:** what happens if this goes well or badly, and what has already been tried.
3. **Session mode:** quick take, council session or full council. Default: council session.

## Session modes

| Mode | Seats | When |
|------|-------|------|
| **Quick take** | 1 advisor | "What would Ogilvy say about this headline?": a single named advisor |
| **Council session** (default) | 3 to 5 advisors | A real decision that benefits from conflicting lenses |
| **Full council** | All 12 | Major strategic decisions; expect a long output, and offer it only when stakes justify it |

The 12 dossiers live in [advisors/](advisors); load only the seated advisors' files [coreyhaines31/marketingskills, marketing-council].

## Seating the council

For a council session, seat 3 to 5 advisors [coreyhaines31/marketingskills, marketing-council]:

1. **2 to 3 whose lens directly fits the question type** (table below).
2. **Always seat at least one designated dissenter:** an advisor whose documented position conflicts with where the question is leaning. "A council that agrees is a mirror, not a board."
3. Honor explicit requests ("I want Hormozi and Godin on this").

| Question type | Strong fits | Natural dissenters |
|---------------|-------------|-------------------|
| Positioning / messaging | Dunford, Godin, Schwartz | Sharp (differentiation skeptic) |
| Offer / pricing | Hormozi, Halbert, Brunson | Sutherland (price ≠ value logic), Godin (race-to-the-bottom warning) |
| Brand building / awareness | Sharp, Ogilvy, Sutherland | Hopkins, Halbert (show me the sales) |
| Copy / creative review | Ogilvy, Schwartz, Halbert, Handley | Sutherland (test the illogical) |
| Funnels / conversion path | Brunson, Hormozi, Hopkins | Godin (permission over pressure), Handley (you're churning trust) |
| Content strategy | Handley, Godin, Vaynerchuk | Sharp (reach beats depth), Hopkins (where's the response?) |
| Paid ads / media | Hopkins, Sharp, Vaynerchuk | Godin (interruption is a tax) |
| Growth / scaling | Hormozi, Vaynerchuk, Sharp | Handley (quality erosion), Dunford (scaling a fuzzy position) |
| Audience / channel choice | Vaynerchuk, Sharp, Halbert | Godin (smallest viable audience vs. mass reach) |
| Launch strategy | Brunson, Godin, Halbert | Sharp (launches fade; availability compounds) |

## Session protocol

[coreyhaines31/marketingskills, marketing-council]

Quick take loads only the one named advisor and delivers that take with the simulation and attribution rules. The multi-advisor disagreement map and designated-dissenter requirements apply to council-session and full-council modes; do not invent extra seats or disagreements for a quick take.

1. **Load the seated advisors' dossiers** from [advisors/](advisors).
2. **Optional live research pass** (below). Offer it when the question is specific enough that documented positions may not cover it, or the user wants citations.
3. **Each advisor's take,** 2 to 4 paragraphs per advisor:
   - Open with the advisor applying their *signature questions* to the user's case.
   - Apply their frameworks to the specifics (the dossier lists them), "not generic advice with a name attached".
   - State their recommendation with the conviction they'd actually have.
   - Write in their voice per the dossier's voice notes, without fabricated quotes.
4. **The disagreement map,** "the most valuable section": identify 2 to 4 genuine conflicts between the takes, name the underlying trade-off each represents (e.g., "Sharp vs. Godin here is really reach vs. resonance - which constraint binds *this* business?"), and say what evidence would settle each.
5. **Synthesis,** a chair's summary: the recommendation that best fits *this* user's stage, category and constraints; which advisor's warning to keep as a tripwire; and concrete next steps with skill handoffs (below).

**Inline or one agent per seat.** The source runs every seat and the chair in one context. [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#why-one-context-fails) names self-preferential bias ("an agent prefers its own results") and gives separate subagents as the remedy. So the inline council is the cheap mode, held up by the designated dissenter and the strongest-version rule; for a high-stakes full council, one subagent per seat plus a separate chair is the version consistent with that file (repo interpretation, not in the source).

## Live research pass

When the topic is specific (a niche, a channel shift, a current platform change) or the user wants sources, go beyond the dossiers [coreyhaines31/marketingskills, marketing-council]:

- **A deep-research skill, if installed** (this repo: [web-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/SKILL.md)): find what the seated advisors have actually said or written about this topic class (books, essays, interviews, podcasts) plus the current state of the debate.
- **A video-analysis skill, if installed** (the source names `watch-video`): pull takes from specific talks and interviews the research surfaces.
- **A recency skill, if installed** (the source names `last30days`): check for recent takes when the topic is fast-moving.
- **Otherwise:** built-in web search for `[advisor name] + [topic]` per seated advisor, "preferring primary sources (their own books, blogs, newsletters, talks) over roundup articles".

Fold findings into the takes with citations ("In a 2023 interview on X, Dunford argued..."). "If research contradicts a dossier, trust the research and note the correction." A recency question ("what did Sutherland say about AI last month") runs the research pass or declines to attribute; it is never answered from the dossier [coreyhaines31/marketingskills, marketing-council, eval 5].

## Grounding rules

Non-negotiable [coreyhaines31/marketingskills, marketing-council]:

- **Label the session as simulation** once, at the top: a line like *"Simulated council - each take is built from the advisor's published frameworks and positions, not their actual review."*
- **No fabricated quotes.** "Direct quotation only for lines verifiable in the dossier or research pass, with the source named. Otherwise paraphrase": "Hopkins's position in *Scientific Advertising* is...".
- **No invented endorsements or condemnations.** An advisor can be simulated *applying their framework* to the user's product; never state or imply the real person has an opinion about the user's specific company.
- **Living advisors get extra care.** "Godin, Brunson, Hormozi, Dunford, Sutherland, Sharp, Handley, and Vaynerchuk are alive and active"; their positions evolve, so prefer the research pass for anything time-sensitive, and never simulate them commenting on named competitors or controversies.
- **Disagree in substance, not caricature.** Each take is the strongest version of that advisor's view applied to this case: no strawmen for the synthesis to knock down.
- **If the dossier and the question don't overlap** (asking Hopkins about TikTok), say so in the take and reason by explicit analogy: "Hopkins never saw social feeds, but his sampling principle maps like this...".
- **The dossiers' own attribution notes are part of the grounding:** Hopkins does not claim "salesmanship in print" (John E. Kennedy, 1904); Ogilvy popularized brand image from Gardner and Levy; Brunson does not claim the Dream 100 (Chet Holmes) and credits the Stack to Armand Morin; Halbert did not invent AIDA (E. St. Elmo Lewis); self-reported revenue figures (Hormozi, Brunson) and legend figures (Hopkins "fifth place to first", Halbert's coat-of-arms letter) are not stated as fact.
- **Advice that reaches outreach stays inside the law.** Halbert's personal-looking mail is physical-mail presentation, not a way past spam filters, and Hormozi's cold outreach and Rule of 100 volume apply only inside the consent and opt-out rules in [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md) and [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md) (repo rule).

## Output format

```
> Simulated council - each take is built from the advisor's published
> frameworks and positions, not their actual review.

## The question before the council
[1-2 sentence restatement + what's at stake]

## Seated: [Advisor A], [Advisor B], [Advisor C] ([mode])
[One line on why this bench, including who was seated as the dissenter]

---

### [Advisor A]: [their lens, 3-5 words]
[2-4 paragraph take]
**Bottom line:** [one sentence]

### [Advisor B]: ...
...

---

## Where the council disagrees
1. **[Conflict]**: [A] says X because [framework]; [B] says Y because
   [framework]. The real trade-off: [underlying tension]. What would
   settle it: [evidence/test].
2. ...

## Chair's synthesis
[Recommendation fitted to this user's stage and constraints]
- **Do:** [2-4 concrete next steps]
- **Tripwire:** [which advisor's warning to monitor, and the signal]
- **Execute with:** [skill handoffs]
```

[coreyhaines31/marketingskills, marketing-council]

## Anti-patterns

[coreyhaines31/marketingskills, marketing-council]

- **The agreeing council:** "five takes that all bless the user's existing plan. Re-seat with a real dissenter." A prompt that asks for validation ("tell me my strategy is right") still gets dissent, and the answer gently flags the framing (eval 3).
- **Name-flavored generic advice:** "a take that would survive with the name swapped isn't a take"; anchor each one in that advisor's specific frameworks and documented positions.
- **Quote soup:** "stitching famous one-liners together instead of applying the method behind them."
- **Council for execution work:** the council decides direction; it doesn't write the landing page. Hand off once direction is set.
- **Twelve advisors on a headline:** match the bench size to the stakes.

## Handoffs

The source's related skills, mapped to this repo [coreyhaines31/marketingskills, marketing-council]:

- **Dunford's take wins (positioning, product marketing):** the product context file and copy in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).
- **Hormozi or Halbert direction wins (offers, pricing):** [offer-design](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md) and [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md).
- **The council reviewed copy:** [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).
- **The debate was media or creative strategy:** [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) and [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md).
- **Handley or Vaynerchuk direction wins:** [content-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md) and [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md).
- **Sharp's availability work and Sutherland's behavioral mechanics:** [growth-ideas PSYCHOLOGY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md).
- **The disagreement map says "test it"** ("Hopkins would insist"): [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).
- **A full plan once direction is set:** [marketing-plan](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md).

## The rules

1. **Read `.agents/product-context.md` first,** then ask only for the question, the stakes and the mode that are missing [coreyhaines31/marketingskills, marketing-council].
2. **Size the bench to the stakes:** one advisor for a quick take, 3 to 5 by default, all 12 only for a major decision [coreyhaines31/marketingskills, marketing-council].
3. **In council-session and full-council modes, seat at least one designated dissenter,** chosen from the seating table by documented position against where the question leans [coreyhaines31/marketingskills, marketing-council].
4. **Load only the seated dossiers** [coreyhaines31/marketingskills, marketing-council].
5. **Label the output as simulation once, quote only verifiable lines with their source, and never give a real person an opinion about the user's company** [coreyhaines31/marketingskills, marketing-council].
6. **Time-sensitive questions about a living advisor run the research pass or decline to attribute;** research overrides the dossier, and the correction is noted [coreyhaines31/marketingskills, marketing-council].
7. **For a multi-advisor session, the disagreement map names 2 to 4 real conflicts, the trade-off under each and the evidence that would settle it,** and the synthesis ends with a tripwire and handoffs [coreyhaines31/marketingskills, marketing-council].
8. **A private person's advisor is built from the user's answers, never invented,** and saved in the project at `.agents/advisors/<kebab-name>.md` ([ADVISORS.md](ADVISORS.md)).

## Prove it

From the source's five evals [coreyhaines31/marketingskills, marketing-council]:

- A 40% price cut put to the council: the simulation line opens it; 3 to 5 advisors fit for pricing sit with at least one genuine dissenter; each take applies that advisor's named frameworks (value equation, starving crowd, costly signaling) to the case; a disagreement map with trade-offs; a chair's synthesis with handoffs to pricing and offers; no fabricated quotes.
- "What would Ogilvy say about this headline": quick-take mode with only the Ogilvy dossier loaded, his headline doctrine applied, only attributed quotes, a rewrite direction, the simulation label.
- A full council asked to validate a 500-superfans newsletter: no uniform agreement; Sharp's penetration counter-position in substance; Godin and Handley supportive but grounded; the reach-versus-resonance trade-off and the evidence to settle it; the validation-seeking framing gently flagged.
- "Add my old boss Maria": a dossier at `.agents/advisors/` outside the skill folder, in the template's structure, filled by interviewing the user, with no invented views.
- A rebrand debate plus "what did Sutherland say about AI last month": no fabricated recent statement; a research pass or a refusal to attribute; Sharp's distinctive-assets warning in the debate; the output labelled as simulation.
