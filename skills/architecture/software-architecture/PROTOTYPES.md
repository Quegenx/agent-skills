# Logic prototypes

Use a throwaway program to answer one unresolved state or business-logic question that is hard to settle in prose. Matt Pocock's prototype/LOGIC.md supplies the shareable state demo; obra's brainstorming treats an agreed spike as a way to learn before committing to a design. [mattpocock/skills, prototype/SKILL.md, prototype/LOGIC.md] [obra/superpowers, brainstorming/SKILL.md]

## Choose the question

[mattpocock/skills, prototype/SKILL.md, prototype/LOGIC.md]

- State the model and question in a short visible introduction so the recipient can judge whether the demo answers it. Ambiguous logic-versus-appearance questions need a scope decision before selecting the artifact.
- Keep the code clearly marked as a prototype and easy to run. For a shareable logic demo, the source uses one HTML file with inline HTML, CSS and JavaScript, requiring no framework, bundler or server.
- Use in-memory state by default. Persistence belongs only when it is itself under investigation, with an explicitly disposable destination.

## Keep the logic portable

[mattpocock/skills, prototype/LOGIC.md]

Choose the smallest model that fits the question: a pure reducer for discrete actions on state, a state machine for legal transitions, pure functions for transformations, or a module that actually owns ongoing state. Isolate it from DOM access and button handlers. The page calls the model and displays its results; the model does not reach back into the page.

## Make the cases explorable

[mattpocock/skills, prototype/LOGIC.md]

- Use domain-language labels and render relevant state as readable fields rather than a raw dump. Update it after every action and make meaningful changes easy to see.
- Provide free-play actions and guided scenarios. Each scenario explains its starting situation and what to watch, then offers the actual ordered actions. Reset to a known state when starting it.
- Include the ordinary path, an awkward edge case and an attempted illegal transition where those are the questions being explored. Feedback that an operation should be impossible or differs from the recipient's expectation is evidence about the design.
- Keep presentation restrained so the question and state stay central. The source's generic styling and UI-variant workflow do not replace this repository's [app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md), [landing-page-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) or [agent-chat-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/SKILL.md) production design.

## Capture the answer

[mattpocock/skills, prototype/SKILL.md, prototype/LOGIC.md] [obra/superpowers, brainstorming/SKILL.md]

Record the question, result and design consequence. A validated reducer or state model may inform the real implementation, while its manual demo shell remains a prototype. The source deliberately omits speculative generalization and production hardening from a spike; keeping the artifact in the product requires an explicit production decision and the normal implementation standards. Follow existing artifact-retention conventions rather than introduce a second production path.

## Prove it

[mattpocock/skills, prototype/LOGIC.md]

The recipient can state the question, open the demo, run a guided scenario from a known state and inspect each transition in domain language. Free play can expose an invalid design assumption. The logic has no dependency on its display shell, and the captured result distinguishes what was learned from what is ready for production.
