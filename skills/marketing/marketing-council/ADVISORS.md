# Custom advisors

Users can extend the bench ("add my own advisor"). A custom dossier has the same fields as the built-in ones in [advisors/](advisors): lens, frameworks, documented positions with sources, signature questions, best for and blind spots, voice notes, key works. Source: [coreyhaines31/marketingskills, marketing-council] `references/advisor-template.md` and SKILL.md "Adding a Custom Advisor" (MIT, Corey Haines), copied with its dashes replaced.

## Where the file lives

Save custom advisors to `.agents/advisors/<kebab-name>.md` in the user's project, "not inside the skill folder", "so it persists and never collides with repo updates" [coreyhaines31/marketingskills, marketing-council].

## Two kinds, two grounding standards

[coreyhaines31/marketingskills, marketing-council]

- **Public figures** (a famous marketer not on the bench): every framework and position must trace to something they published or said. Research before writing (the research pass in [SKILL.md](SKILL.md#live-research-pass)), cite sources, and follow the same grounding rules as the built-in dossiers.
- **Private advisors** (the user's former boss, best customer, CFO): the *user* supplies the positions and heuristics. "The agent must not invent views for a real private person - interview the user to fill the template." What the user already said can be structured ("ship weekly", against paid ads), and the agent asks for more before the dossier is complete (eval 4).

## The template

[coreyhaines31/marketingskills, marketing-council]

```markdown
# [Full Name]

**Lens:** [One sentence - the distinct way they see marketing problems.]

## Core frameworks

- **[Framework name]** ([source, year]): [1-2 sentence accurate definition.]
- ...3-6 total. If it's borrowed from someone else, say so.

## Documented positions

- [A strong opinion they actually hold] - *[source]*
- ...5-8 total. Include at least one contrarian position; a persona with
  no unpopular opinions produces no useful disagreement.

## Signature questions

- [A question they characteristically ask about any marketing problem]
- ...3-5 total. These open the advisor's take in a session.

## Best for / blind spots

**Best for:** [problem types their lens genuinely illuminates]
**Blind spots:** [documented criticisms or acknowledged limits - this is
what makes their dissent honest rather than decorative]

## Voice notes

[2-3 sentences: sentence rhythm, favorite metaphors, tone, tics. Enough
to write in their register without fabricating quotes.]

## Key works

- *[Title]* ([year]) - [one line on what it contributes to the persona]
```

## Seating a custom advisor

Mention them by name when convening ("seat my advisor Maria on this council"). The agent loads the file from `.agents/advisors/` and treats it like any bench dossier, including the grounding rules: no fabricated quotes, no invented endorsements [coreyhaines31/marketingskills, marketing-council].

## Prove it

A custom advisor sits at `.agents/advisors/<kebab-name>.md` in the project, never in the skill folder; it has every template section; a public figure's frameworks and positions each name a source; a private person's positions all came from the user's answers, with gaps asked about rather than filled in; at least one documented position is contrarian.
