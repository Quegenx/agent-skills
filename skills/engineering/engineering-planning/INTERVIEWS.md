# Decision interviews and questionnaires

Use a conversation to resolve decisions, or prepare questions for a recipient who has facts the requester lacks. Matt Pocock supplies the decision-frontier and questionnaire methods; obra/superpowers supplies an alternative conversational cadence and intent-to-builder handoff. [mattpocock/skills, grilling/SKILL.md, to-questionnaire/SKILL.md] [obra/superpowers, brainstorming/SKILL.md, brainstorming/builder-check-prompt.md]

## Prepare the decision

[obra/superpowers, brainstorming/SKILL.md]

- Read the relevant code and existing decisions. Identify the user's intent, desired outcome, non-goals, constraints, prior art and resources.
- Separate decisions the user has made from implementation choices left to the builder. Label open questions rather than silently convert assumptions into requirements.
- When an experiment would settle the question better than more discussion, agree the question and use a small [prototype](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/software-architecture/PROTOTYPES.md).
- For a builder handoff, have the intended executor inspect whether the brief leaves a material decision unanswered. Fill discoverable facts from the repository, make and label routine implementation choices, and return only consequential user decisions to the user.

## Work the unsettled frontier

[mattpocock/skills, grilling/SKILL.md]

- Treat the design as dependent decisions. The frontier contains questions whose prerequisites are settled; a question downstream of an unresolved answer waits.
- Matt's method asks the independent frontier together in a numbered round, each with a recommended answer. Recompute after the user's answers reshape the tree.
- Investigate environment facts yourself. An investigation still running is an unsettled prerequisite for its downstream question, while other independent decisions can proceed.
- Stop the interview when the relevant branches are resolved and the user and agent share the intended outcome. The source asks for explicit confirmation before acting on the interview; use existing task authorization when it already covers the agreed action.

Obra's alternative is one open question at a time, with a recommendation and plain tradeoffs, then small sections of a concrete design. These are different source interaction preferences. Choose the cadence that fits the user's request and the dependency structure; neither creates a new approval requirement for already authorized work. [obra/superpowers, brainstorming/SKILL.md] [mattpocock/skills, grilling/SKILL.md]

## Prepare a questionnaire

[mattpocock/skills, to-questionnaire/SKILL.md]

- Ask the requester about the send: recipient role, expertise and relationship, then the facts or decisions the requester needs back. Do not ask them to supply the specialist knowledge the questionnaire is intended to obtain.
- Explain purpose, sender and recipient, how answers will be used, and enough context for someone outside the conversation.
- Give the deadline and expected effort only when known. Say partial answers and explicit uncertainty are useful.
- Order questions by importance, group by theme when needed, and give each question one idea with an answer space directly beneath it. Explain why a question matters when its purpose might be misunderstood.
- Check that every requested outcome has a question, and finish with an invitation to add material omissions. Draft the document for the user; sending it requires the applicable authorization.

## Prove it

[mattpocock/skills, grilling/SKILL.md, to-questionnaire/SKILL.md] [obra/superpowers, brainstorming/builder-check-prompt.md]

Every live question has settled prerequisites and cannot be resolved by a repository lookup. Recommendations expose the choice rather than answer for the user. A questionnaire fits its recipient and covers each fact or decision needed back. The handoff distinguishes accepted decisions, builder choices and unresolved material questions.
