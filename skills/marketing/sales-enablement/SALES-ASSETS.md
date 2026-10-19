# ROI calculators, personas, case studies, proposals and playbooks

The smaller sales assets. From coreyhaines31/marketingskills, skill `sales-enablement` (SKILL.md, MIT), plus the FTC Endorsement Guides FAQ for results claims. Persona facts start from the Buyers section of the product context file ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); pricing and packaging decisions are in [pricing-strategy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md).

## ROI calculators

[coreyhaines31/marketingskills, sales-enablement]

- **Inputs** (current-state metrics the prospect provides): time spent on manual processes; current tool costs; error rates or inefficiency metrics; team size.
- **Calculations** (your formula for value): time saved per week, month or year; cost reduction (tools, headcount, errors); revenue impact (faster deals, higher conversion).
- **Outputs** (what the prospect sees): annual ROI percentage; payback period in months; total 3-year value.

Implementation options:

- **Spreadsheet:** fastest to build, easy to customize per deal. Works for inside sales.
- **Web tool:** more polished, captures leads, scales better. Worth building if deal volume is high.
- **Slide-based:** the ROI story embedded in the deck ([SALES-DECKS.md](SALES-DECKS.md)). Good for executive presentations.

"Show the math, not just the conclusion" and "use conservative estimates (executives discount inflated numbers)"; "ROI without showing your math" is an anti-pattern on the ROI slide. The deliverable is input fields, formulas and the output display with sample data. Lead capture in general: [lead-magnets SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md).

## Value proposition by persona

[coreyhaines31/marketingskills, sales-enablement]

| Persona | Cares about | Lead with |
|---|---|---|
| CTO / VP Eng | Architecture, scale, security, team velocity | Technical superiority, integration depth |
| VP Sales | Pipeline, quota attainment, rep productivity | Revenue impact, time savings per rep |
| CFO | Total cost, payback period, risk | ROI, cost reduction, financial predictability |
| End user | Ease of use, daily workflow, learning curve | Time saved, frustration eliminated |

## Buyer persona cards

[coreyhaines31/marketingskills, sales-enablement] One page per persona.

| Field | Description |
|---|---|
| Role / title | Common titles and reporting structure |
| Goals | What success looks like for them |
| Pains | What frustrates them daily |
| Top objections | The 3-5 objections you'll hear from this role ([OBJECTION-HANDLING.md](OBJECTION-HANDLING.md)) |
| Evaluation criteria | How they judge solutions |
| Buying process | Their role in the decision, who they influence |
| Messaging angle | The one sentence that resonates most |

Persona types:

- **Economic buyer:** signs the check. Cares about ROI and risk.
- **Technical buyer:** evaluates the product. Cares about capabilities and integration.
- **End user:** uses it daily. Cares about ease and workflow fit.
- **Champion:** advocates internally. Needs ammunition to sell for you.
- **Blocker:** opposes the purchase. Understand their concern to neutralize it.

The context file's buyer row lists user, champion, decision maker, budget holder, technical evaluator and blocker.

## Case study briefs (sales format)

[coreyhaines31/marketingskills, sales-enablement] "Marketing case studies tell a story. Sales case studies arm reps with fast-access proof." Keep them short, outcome-focused, and tagged for retrieval.

1. **Customer profile:** industry, company size, buyer role.
2. **Challenge:** what they were struggling with (2-3 sentences).
3. **Solution:** what they implemented (1-2 sentences).
4. **Results:** 3 specific metrics (before/after).
5. **Pull quote:** one sentence from the customer.
6. **Tags:** industry, use case, company size, persona.

Organize them so reps find the right one instantly: by industry ("Show me a case study for healthcare"), by use case ("Show me someone who used us for X"), by company size ("Show me an enterprise example").

Only real customers who agreed to be named, and results claims that reach prospects (in decks, one-pagers and proposals) follow the FTC typical-results rule, both defined on the Testimonials line of [anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md). The source does not cover this; the FTC rules for pricing, free, guarantee and scarcity claims are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).

## Proposals

[coreyhaines31/marketingskills, sales-enablement]

1. **Executive summary:** their challenge, your solution, expected outcome (1 page max).
2. **Proposed solution:** what you'll deliver, mapped to their requirements.
3. **Implementation plan:** timeline, milestones, responsibilities.
4. **Investment:** pricing, payment terms, what's included.
5. **Next steps:** how to move forward, decision timeline.

Customize: mirror their language from discovery calls; reference specific pain points they mentioned; include only relevant case studies (same industry or use case); name the stakeholders you've spoken with.

Common mistakes:

- **Too long:** "If it's over 10 pages, it won't get read. Aim for 5-7."
- **Too generic:** templated proposals signal low effort. Customize the exec summary at minimum.
- **Burying the price:** don't make them hunt for it. Be transparent and confident.

Non-standard discounts or terms in a proposal go through the deal desk ([revops PIPELINE-AND-METRICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/PIPELINE-AND-METRICS.md#deal-desk)).

## Sales playbooks

[coreyhaines31/marketingskills, sales-enablement] What goes in:

- **Buyer profile:** who you're selling to, their goals and pains.
- **Qualification criteria:** BANT, MEDDIC, or your framework. The source names these without defining them; the revops SQL stage asks for budget, authority, need or timeline confirmed (at least 2 of 4) ([revops LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/LIFECYCLE.md#stage-templates)).
- **Discovery questions:** organized by topic, not a script ([DEMO-SCRIPTS.md](DEMO-SCRIPTS.md#discovery-call)).
- **Objection handling:** top 10 objections with responses.
- **Competitive positioning:** how you win against each competitor ([BATTLE-CARDS.md](BATTLE-CARDS.md)).
- **Demo flow:** recommended sequence for each persona.
- **Email templates:** follow-up, proposal, check-in, breakup ([cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md)).

When to build: a new product launch (reps need a single source of truth); a new market segment (different buyers need different approaches); new hire ramp (the source says playbooks "cut ramp time significantly", with no figure).

"Playbooks die when they're not updated." Review quarterly, get input from top reps, remove anything outdated, and assign an owner: "if nobody owns it, it rots." The deliverable is a structured document with a table of contents and sections.

## Prove it

The calculator shows its formulas and conservative inputs; each persona card has all seven fields and 3-5 objections; each case-study brief has three before/after metrics, a quote the customer approved and the four tags; a results claim that isn't typical carries what customers generally achieve; the proposal is 5-7 pages with the price in its own section; the playbook names an owner and a quarterly review date.
