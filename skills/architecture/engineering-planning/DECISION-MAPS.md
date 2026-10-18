# Maps for unresolved decisions

Matt Pocock's wayfinder is for an effort larger than one session whose route is still unclear. Its map organizes questions to resolve, while [SPECS-AND-TICKETS.md](SPECS-AND-TICKETS.md) organizes implementation deliverables. Platform-specific issue and branch operations are omitted. [mattpocock/skills, wayfinder/SKILL.md]

## Name the destination

[mattpocock/skills, wayfinder/SKILL.md]

- State what reaching the end means: an agreed specification, a consequential decision or another explicitly named result. That destination fixes the scope of every question.
- Survey the breadth of unresolved choices before going deep. If the route is already clear and small enough for one session, use a simpler plan rather than scaffold a map.
- Keep the map as an index: destination, notes and standing context, brief linked decisions, not-yet-specified areas, and out-of-scope work. Detailed answers live once in the corresponding ticket.

## Represent the questions

[mattpocock/skills, wayfinder/SKILL.md]

Give each decision ticket a descriptive name, a precise question, its blockers and a type. Keep it small enough to investigate within a working session. Link assets instead of pasting them into the map.

| Type | What resolves it |
|---|---|
| Research | Evidence from documentation, code or another relevant resource |
| Prototype | A concrete artifact and the human's reaction to the question it tests |
| Interview | The decision owner's live answer, using [INTERVIEWS.md](INTERVIEWS.md) |
| Prerequisite task | Actual completion of work needed to make a decision, with resulting facts recorded |

An agent can research facts, but it cannot simulate the human side of a decision or mark an interview resolved by answering itself. A prerequisite task earns its place by unblocking a question; it is not a disguised delivery ticket.

## Separate blockers, fog and scope

[mattpocock/skills, wayfinder/SKILL.md]

- A precise question is a ticket even when blocked. A vague future area that cannot yet be phrased precisely belongs under not yet specified.
- Work beyond the destination belongs out of scope, regardless of how well it is understood. It does not later become active merely because other questions were resolved.
- The available frontier consists of open, unblocked, unclaimed questions. Record ownership before work so concurrent sessions do not duplicate the investigation.
- Follow existing storage and ownership conventions. A local Markdown tracker is sufficient; a map does not require a hosted issue platform.

## Resolve and update

[mattpocock/skills, wayfinder/SKILL.md]

- Load the map, choose the named question or an available frontier question, and fetch detailed related tickets only as needed.
- Record the answer, supporting artifacts and resulting facts on that ticket. Mark it resolved and add only a short linked gist to the map.
- Turn newly precise areas into questions, add actual blockers, and remove their former fog entry so the same question has one owner. Revisit questions invalidated by the new decision.
- When a question proves beyond scope, mark that outcome and link it from the out-of-scope section rather than list it as a decision on the route.
- Matt limits human decision work to one ticket per session, with research excepted. Treat this as the source's pacing preference, not a universal token budget or a reason to halt work the user authorized.
- When no consequential questions remain on the route, hand off the decisions to a specification or execution plan. The default map finds the way; it does not automatically authorize building the destination.

## Prove it

[mattpocock/skills, wayfinder/SKILL.md]

The destination determines scope. Every precise question has one ticket; every answer has one detailed home. The available frontier excludes blocked or already claimed work. New findings update the route without duplicating answers, and the final handoff distinguishes decisions reached from implementation performed.
