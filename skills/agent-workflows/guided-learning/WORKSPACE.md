# A continuing teaching workspace

Matt Pocock's teach formats keep the goal, sources and evidence available across sessions. The paths below are relative to the learner's chosen workspace, not this skill folder. Create learning records and other content when there is actual material to store. [mattpocock/skills, teach/SKILL.md, teach/LEARNING-RECORD-FORMAT.md]

## Mission

[mattpocock/skills, teach/MISSION-FORMAT.md, teach/SKILL.md]

- Use `MISSION.md` for one concrete learning mission: why it matters, observable success, constraints and explicitly excluded adjacent topics.
- Keep it a short compass rather than a full course plan. If the purpose is vague, resolve the underlying outcome before designing lessons around it.
- Unrelated learning goals belong in separate workspaces. When learning changes the goal, confirm the new mission, update it and record the change's effect on future sessions.

## Resources and preferences

[mattpocock/skills, teach/RESOURCES-FORMAT.md, teach/SKILL.md]

- Keep `RESOURCES.md` grouped into knowledge sources and communities for practitioner feedback. Prefer primary material, recognized expertise and well-moderated communities; leave educational marketing masquerading as evidence out.
- Annotate each resource with what it covers and when to use it. State missing source coverage in a gaps section and replace resources that prove wrong, shallow or off-mission.
- Record a preference against community participation so later sessions respect it. Use `NOTES.md` for local teaching preferences and working notes; this workspace is not a replacement definition of an agent's global memory system.

## Learning records

[mattpocock/skills, teach/LEARNING-RECORD-FORMAT.md]

- Create `learning-records/` for the first actual record. Use sequential `0001-slug.md` names, taking the next number after the highest existing record.
- A short title and concise explanation of what was established and why it changes future teaching are enough. Add evidence, implications or status only when useful.
- Record demonstrated nontrivial understanding, stated prior knowledge with its claimed depth, a corrected misconception or a mission shift. Link the mission when the record changes it.
- Do not log every session or turn material merely covered into knowledge learned. Avoid duplicating a definition already owned by the glossary.
- If later understanding contradicts a record, mark the earlier one superseded and link the replacement. Preserve how the understanding changed rather than erase the history.

## Glossary and reference

[mattpocock/skills, teach/GLOSSARY-FORMAT.md, teach/SKILL.md]

- Promote a term only after the learner can use it correctly. This teaching-specific threshold records compressed understanding rather than supplies a dictionary before teaching begins.
- Reuse the canonical-term, short-definition and avoided-alias form in [domain-modeling GLOSSARY-AND-ADRS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/GLOSSARY-AND-ADRS.md#domain-language), applying it to the learning topic. That file owns the glossary technique; the understanding threshold above is the teaching addition.
- Use the glossary's vocabulary throughout lessons, exercises and records. Note how this workspace resolves an ambiguous term and revise a definition when understanding improves.
- Store quick-reference HTML documents under `reference/`, lessons under `lessons/` and actual shared lesson assets under `assets/`. Their design and use are in [LESSONS.md](LESSONS.md).

## Prove it

[mattpocock/skills, teach/MISSION-FORMAT.md, teach/RESOURCES-FORMAT.md, teach/LEARNING-RECORD-FORMAT.md, teach/GLOSSARY-FORMAT.md]

The mission gives observable direction; resource annotations expose both coverage and gaps. Each record states why its evidence or claimed prior knowledge affects the next lesson. Glossary promotion follows demonstrated understanding, superseded records remain traceable, and a later session can find the learner's local preferences.
