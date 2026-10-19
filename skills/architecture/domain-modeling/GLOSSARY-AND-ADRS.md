# Glossaries and decision records

Capture settled domain language and the reasons for consequential choices as they become clear. Matt Pocock's domain-modeling supplies lightweight glossary and ADR formats; Octocode's ADR reference adds convention checks and explicit decision lifecycle. [mattpocock/skills, domain-modeling/SKILL.md, domain-modeling/GLOSSARY-FORMAT.md, domain-modeling/ADR-FORMAT.md] [bgauryy/octocode, octocode-documentation/references/adr.md]

## Domain language

[mattpocock/skills, domain-modeling/SKILL.md, domain-modeling/GLOSSARY-FORMAT.md]

- Resolve overloaded or vague terms against concrete domain scenarios and actual code. If conversation and implementation disagree, surface both rather than silently choose one.
- Give each concept one canonical term, a short definition and the synonyms to avoid; group terms when the domain supplies useful clusters.
- Use established glossary terms inside new definitions. [mattpocock/skills, teach/GLOSSARY-FORMAT.md]
- Include project-specific domain concepts. Keep implementation choices, general programming concepts, work plans and unresolved notes outside the glossary.
- Update the glossary when the terminology is settled, while the meaning is still available. Existing ubiquitous-language rules remain in [STRATEGIC.md](STRATEGIC.md#ubiquitous-language).

## Layout and consumers

[mattpocock/skills, domain-modeling/GLOSSARY-FORMAT.md, setup-matt-pocock-skills/domain.md]

- Match existing files first. For a single context, the source's simple layout is a root `GLOSSARY.md`; multiple contexts use a root `GLOSSARY-MAP.md` linking context glossaries and describing their relationships.
- Create a glossary lazily when the first term is resolved. A missing glossary is not a reason to scaffold empty documentation before work can start.
- Before exploring an area, read its glossary and applicable decisions. Follow the map when it exists and ask which context applies only when that remains materially unclear.
- Use the context's language in names, hypotheses, plans and test descriptions. A term absent from the glossary can indicate an actual vocabulary gap or an invented name to reconsider.

## When to record a decision

[mattpocock/skills, domain-modeling/ADR-FORMAT.md]

Offer an architectural decision record when all three apply: changing the choice later carries meaningful cost, a future reader would find it surprising without context, and real alternatives led to a tradeoff. Record durable scope boundaries and rejected alternatives when their rationale prevents repeated debate. Easy-to-reverse, obvious or temporary choices do not need a record.

## Format and lifecycle

[mattpocock/skills, domain-modeling/ADR-FORMAT.md] [bgauryy/octocode, octocode-documentation/references/adr.md]

- Match the repository's location, numbering and markup. A second scheme makes decisions harder to find. With no convention, Matt uses `docs/adr/` and sequential `0001-slug.md` names, creating the directory only for the first actual record.
- Matt's minimum is a title and a short paragraph stating context, decision and reason. Add status, considered alternatives and consequences when they help; find the highest current number before assigning the next one.
- Octocode instead defaults to `docs/decisions/ADR-NNN-short-title.md` and requires Status, Date, Context, Decision, Alternatives considered and Consequences. Both are source conventions, not standards. Keep an established local convention; the lightweight form above is the default here when none exists.
- Keep accepted decisions accurate. When a later decision replaces one, link the replacement and mark the old record superseded or deprecated rather than erase why it existed. Link decision records from relevant architecture documentation or agent guidance when that prevents reopening settled questions.
- Store the rationale, not pasted implementation. An [RFC](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/RFC.md) can investigate a choice; the ADR retains the accepted decision and its lasting context.

## Prove it

[mattpocock/skills, domain-modeling/GLOSSARY-FORMAT.md, domain-modeling/ADR-FORMAT.md] [bgauryy/octocode, octocode-documentation/references/adr.md]

Each glossary entry names a domain concept, defines one meaning and makes avoided aliases explicit. A record matches the current convention, explains the tradeoff that qualified it for recording, and points to any superseding choice. An explorer can find the relevant context and distinguish an accepted decision from a proposal.
