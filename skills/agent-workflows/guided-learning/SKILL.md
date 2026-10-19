---
name: guided-learning
description: "Teaches a topic across sessions through a concrete mission, cited resources, short interactive lessons and records of demonstrated understanding. Use when a user wants a continuing learning workspace or lessons adapted to their goals and prior knowledge."
---

# Guided learning

Build lessons around what the learner wants to be able to do, using trusted material and an explicit record of understanding. The source is Matt Pocock's teach skill and its mission, resource, learning-record and glossary formats. Its pedagogical methods are source preferences, without imported claims about neuroscience or guaranteed retention.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Establish the teaching loop and choose the next lesson | [SKILL.md](SKILL.md) |
| Maintain the mission, resources, learning evidence and workspace | [WORKSPACE.md](WORKSPACE.md) |
| Build short lessons, practice, reference sheets and reusable assets | [LESSONS.md](LESSONS.md) |

## Selected references

When maintaining a glossary, read [domain-modeling glossary form](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/GLOSSARY-AND-ADRS.md#domain-language) as required by WORKSPACE.md. Presentation uses the learner's available authorized workflow; no product-agent runtime or coding-host configuration is required. [mattpocock/skills, teach; existing guided-learning, WORKSPACE.md and LESSONS.md]

## The rules

1. **Tie teaching to a concrete mission.** Establish why the learner wants the topic, what observable capability would count as success, constraints and non-goals. Confirm a changed mission with the learner before updating it. [mattpocock/skills, teach/SKILL.md, teach/MISSION-FORMAT.md]
2. **Source the knowledge before teaching it.** Populate a trusted resource list, annotate when each resource is useful, and link claims in lessons to the supporting material. Gaps remain gaps rather than being filled from model memory. [mattpocock/skills, teach/SKILL.md, teach/RESOURCES-FORMAT.md]
3. **Choose the next step from evidence.** Read the mission and learning records. Use demonstrated understanding and the depth of stated prior knowledge to choose a relevant challenge; exposure alone does not establish mastery. [mattpocock/skills, teach/SKILL.md, teach/LEARNING-RECORD-FORMAT.md]
4. **Teach one useful thing, then practice it.** Keep each lesson short and focused, supplying the knowledge needed for its skill and an interactive feedback loop. Make the tangible result relevant to the mission. [mattpocock/skills, teach/SKILL.md]
5. **Keep durable learning artifacts distinct.** Lessons teach; reference sheets support quick reuse; learning records capture consequential understanding; the glossary owns settled terminology. Follow [WORKSPACE.md](WORKSPACE.md) rather than duplicate the same definition in a record and reference. [mattpocock/skills, teach/SKILL.md, teach/LEARNING-RECORD-FORMAT.md]
6. **Respect the learner's preferences.** Record local teaching preferences, adapt the next lesson and honor an opt-out from community suggestions. A community recommendation is an invitation for the learner, not authorization to contact anyone. [mattpocock/skills, teach/SKILL.md, teach/RESOURCES-FORMAT.md]

## Session loop

[mattpocock/skills, teach/SKILL.md]

Read the mission, relevant records, resource list, glossary and available assets. If the learner named the topic, fit it to that context; otherwise select the most relevant next capability within their current reach. Teach from fetched sources, offer practice with feedback, and record only what the learner's response actually establishes. Update reference material when it will help future use.

## Gotchas

- A finished lesson is not evidence the learner can use the concept. Wait for understanding before adding a learning record or promoting a term into the glossary. [mattpocock/skills, teach/LEARNING-RECORD-FORMAT.md, teach/GLOSSARY-FORMAT.md]
- Recommending resources without explaining their use produces a list the next session cannot navigate. Annotate coverage and purpose. [mattpocock/skills, teach/RESOURCES-FORMAT.md]
- Repeatedly proposing a community after an opt-out ignores a recorded preference. Keep that choice visible to later sessions. [mattpocock/skills, teach/RESOURCES-FORMAT.md]

## Prove it

[mattpocock/skills, teach/SKILL.md, teach/LEARNING-RECORD-FORMAT.md]

The learner can connect the lesson to their mission, inspect the sources and try the skill with feedback. The next session can distinguish what was taught, what the learner demonstrated and what they merely said they already knew. Records and references support the next lesson without claiming unobserved mastery.
