# Personas

Personas are built from research, never invented. From coreyhaines31/marketingskills `customer-research` (MIT). The product context file's Audience and Buyers sections hold the result ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)).

## The minimum

`[coreyhaines31/marketingskills, customer-research]` "Don't create a persona until you have at least 5-10 data points (interviews, reviews, or community posts) from a consistent segment."

## When there are no reviews yet

`[coreyhaines31/marketingskills, customer-research]` Walk outward through proxy sources, in order:
1. **Your own differentiator:** what the product does differently defines who feels it most; write it down as a hypothesis.
2. **Direct competitors' reviews:** their customers describe the problem space in their words (note what's praised and what's missing).
3. **Comparable products on marketplaces:** Amazon and app-store reviews for adjacent solutions to the same job.
4. **Adjacent brands sharing the audience:** what else this buyer buys; their reviews show the buyer's wider language and values.

Personas built this way are provisional: tag each with its proxy source and replace proxy evidence with first-party evidence as real reviews arrive. For a product with no research at all, the source's minimum plan is hypotheses first, then 5 to 10 interviews plus a watering-hole scan ([SOURCES.md](SOURCES.md)), and no personas until the data exists.

## Optional profile questions

[more skills, copywriting-playbook.md] For a specific buyer segment, the guide proposes age, location, work and income, plus the person's routine, recurring complaints, attempted alternatives, why those attempts failed, fears, desired success and whom they blame. Use these as research questions where relevant, with evidence behind every answer. The existing minimum and no-invented-details rule still apply; an imagined day or an inference from a photograph is not a finding. Keep the result in the shared product context.

## The template

`[coreyhaines31/marketingskills, customer-research]`

```
## [Persona Name], [Role/Title]

**Profile**
- Title range: [e.g., "Marketing Manager to VP of Marketing"]
- Company size: [e.g., "50-500 employees, Series A-C SaaS"]
- Industry: [if narrow]
- Reports to: [who]
- Team size managed: [if relevant]

**Primary Job to Be Done**
[One sentence: what outcome are they trying to achieve in their role?]

**Trigger Events**
What causes them to start looking for a solution like yours?
- [trigger 1]
- [trigger 2]

**Top Pains**
1. [Pain, in their words if possible]
2. [Pain]
3. [Pain]

**Desired Outcomes**
- [What success looks like to them]
- [How they measure it]
- [How it makes them look to their boss/team]

**Objections and Fears**
- [What makes them hesitate to buy or switch]

**Alternatives They Consider**
- [Competitor, DIY, do nothing, hire someone]

**Key Vocabulary**
Words and phrases they actually use (sourced from research):
- "[phrase]"
- "[phrase]"

**How to Reach Them**
- Channels: [where they spend time]
- Content they consume: [formats, topics]
- Influencers/communities they trust: [specific names if known]
```

## Anti-patterns

`[coreyhaines31/marketingskills, customer-research]`
- **Don't name them cutely** ("Marketing Mary") unless the team finds it helpful; it's often a distraction.
- **Don't average across segments:** "a persona that represents everyone represents no one".
- **Don't invent details:** without data on a field, leave it blank (the same rule as web-research's "Fields with no supporting finding stay empty", [web-research EVIDENCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/EVIDENCE.md#anti-hallucination-rules)).
- **Revisit quarterly:** personas decay as the market and product change.

## Prove it

Each persona lists the data points behind it (at least 5, one consistent segment); a proxy-derived persona is also tagged provisional with its proxy source; every Key Vocabulary phrase has a source; empty fields are blank, not filled; the persona's review date is within the last quarter.

**Two source expectations:** the old acceptance line allowed the five-point evidence requirement "or" a provisional proxy tag; the minimum above and the skill hub require evidence before creating a persona. Keep that minimum for provisional personas too; their tag records provenance rather than waiving the evidence floor. [coreyhaines31/marketingskills, customer-research; existing PERSONAS.md and SKILL.md]
