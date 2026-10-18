# Writing memory

## What triggers a write

- **Explicit saves only** ("remember that I...") feel like an assistant that took three notes and forgot the rest. Most of what matters is said in passing.
- **Background extraction** over finished conversations catches it: run after the reply, over the new messages, with the recent context to resolve references.
- **A save tool** for the agent stays useful for what the user asks it to remember now, and for the agent's own durable learnings. Decide what to keep with a narrow question over what the user or staff wrote, not over what the agent guessed about them.

## The extraction input

Give the extractor, in this order:

- **A short profile** of what is already known (names, places, relationships), to enrich new facts.
- **The facts already extracted from this conversation,** so it doesn't repeat them.
- **Existing related memories,** found by searching with the new messages, for deduplication and linking only. Show them with short local ids (0, 1, 2) and map back to the real ids in code: models mangle long ids.
- **The last few messages before the new ones** (each cut to a few hundred characters), to resolve "he" and "that one".
- **The new messages,** the only source of new facts.
- **When the conversation took place** and **today's date** as separate fields. Relative dates resolve against when it was said: "Paris last week" becomes "Paris, the week of 15 May 2023", which still means something a year later.

## What to extract

- **From the user:** facts, preferences, plans, constraints, relationships, work context, firsts and milestones. Especially the incidental facts inside a request: "my daughter Sara loves painting, find me art classes" holds a lasting fact the request does not.
- **From the agent:** concrete recommendations it gave, plans or schedules it made, agreements reached, actions it took ("sent the quote on 3 May"). Not its guesses about the user ("you seem stressed") unless the user confirms them, not pleasantries, not its echo of what the user just said.
- **From shared material:** the content itself (the dates and findings of the case, the numbers in the table), never "user shared a document".
- **Every topic in the conversation.** The common failure is the first topic crowding out the rest; a long conversation with four topics yields facts on all four.
- **Not:** greetings and filler, momentary state (what is on screen now), secrets, card numbers, anything the product mustn't keep.

## How a good fact reads

- **Self-contained:** names, not pronouns; one or two sentences.
- **With its context:** "User has a dog named Poppy; their morning walks are the best part of the day", not "User has a dog".
- **Changes carry both sides:** "switched from in-person French to online Spanish on Wednesdays after moving". Mark a trial or a temporary change as one.
- **Exact:** the title, the model number, "assistant manager" not "manager", "416 pages" not "about 400". The specific word is what later searches hit.
- **Faithful:** "used to love hiking" is not a current love; "didn't get to bed until 2 a.m." is a late bedtime. No detail imported from an existing memory the new message didn't mention.
- **No inferred attributes:** never gender, age, origin or health from a name or a hint.
- **Attributed by speaker:** each fact records who stated it. The agent's own actions are its experience; a user's "I bought a car" is a fact about the user. Tell the extractor who each speaker is, so a customer's first person is never stored as the agent's.

## Turning conversation evidence into working preferences

[cursor/plugins, workflow-from-chats/SKILL.md]

- Inventory the relevant parent conversations, approximate dates, completion state and associated workers. A worker's behavior can support the investigation, but cite the parent conversation for the user's preference; do not expose private transcript paths or customer content in the resulting guidance.
- Extract a preference atom: its trigger, workflow step, decision rule, quality bar, stop condition, evidence and confidence. Cluster atoms by recurring workflow rather than writing one summary per chat.
- Distinguish explicit preferences and corrections from behavior the agent chose without feedback. Repeated accepted use is stronger evidence than a single ambiguous or task-specific action; incompatible evidence remains contradicted and pending rather than becoming a silent rule.
- Choose the artifact by the job: a recurring procedure with a clear trigger can become a skill; broad behavior a rule; useful context without a reliable trigger a workflow document; stale, situational or weak observations no artifact. Show adopt, consider and dismissed separately.
- Keep the user's preference store read-only under [SKILL.md](SKILL.md#the-shape) rule 8. This source mines candidate guidance; it does not authorize the agent to rewrite a user-owned preference or resolve a contradiction on their behalf.

## Duplicates and links

- **Skip what is already captured,** but a known entity is not a captured event: "has a dog named Max" does not cover "camped with Max last summer".
- **Hash the normalised text** and drop exact repeats in code; leave near-duplicates to consolidation.
- **Link** a new fact to the existing ones about the same entity, a changed preference, a continuation or a contradiction; not to ones that only share a theme.
- **Entities** (people, places, products, projects) extracted and resolved: "Alice", "Alice Chen" and "Alice C." are one person. Resolution can also go wrong the other way on a large store, absorbing a new person into an old one; let a person check merges that matter.

## Failures that must be visible

- **A failed extraction call raises.** Returning an empty list makes "the model was down" look like "nothing worth remembering".
- **Report only what was stored;** a write the store rejected is not a memory.
- **A conversation that produced no facts is a signal, not an error:** count them, and retry the borderline ones (extraction isn't deterministic).
- **Keep an audit log per memory:** created, changed, deleted, with the old and new text and the source.

## Consolidating facts into beliefs

Raw facts pile up. A background pass merges them into beliefs, each one holding its supporting facts and their count:

- **One belief per facet:** a count, a named thing, a relationship, a decision. Different facets never merge, even about the same person.
- **Update rather than duplicate** when a new fact is more evidence for the same thing; create when nothing covers that facet yet.
- **A state change updates every belief it touches:** someone leaving a company also ends "commutes to its office".
- **No arithmetic:** "has 2 dogs" and then "has a dog named Rex" does not make 3. Only an explicitly stated count changes a count.
- **Order by when it was said, not when it arrived:** an old document processed today is old news; it becomes the earlier state, never the current one.
- **History stays:** "favourite is Svelte; earlier it was React". Delete a belief only when it is restated elsewhere or empty.
- **Names a letter apart stay apart** ("Maria" and "Mario").
- **Each change carries a one-line reason,** checked for duplicate creations; an update copies the old text before editing it, and a belief takes at most one update per pass.
- **Edit long-lived summaries in place,** applying only the change. Regenerating a document on every refresh drifts its wording until it says something else.

Keep the consolidation instructions the same for every account and pass the account's own focus in the message, so the cached prefix is shared.

## Prove it

[cursor/plugins, workflow-from-chats/SKILL.md]

- Each proposed working preference has parent-conversation evidence, trigger, decision/quality/stop conditions and confidence.
- Agent-chosen behavior without feedback remains weak evidence, and contradictory preferences stay pending.
- The artifact fits the recurrence and trigger; no artifact is a valid outcome for a situational observation.
- User-owned preferences are unchanged unless the user authorizes their update.
