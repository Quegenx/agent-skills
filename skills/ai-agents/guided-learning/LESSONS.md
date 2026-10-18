# Lessons, practice and reference sheets

Matt Pocock's teach skill uses short interactive HTML lessons tied to a continuing mission. The methods below are its teaching choices; they do not assert a measured learning effect or a universal lesson duration. [mattpocock/skills, teach/SKILL.md]

## Choose and source one capability

[mattpocock/skills, teach/SKILL.md]

- Read the mission, learning records and trusted resources before choosing the next step. Fit it to the user's explicit request and current ability.
- Give the lesson one tangible result relevant to the mission. Introduce only the knowledge needed for that skill, then provide a chance to use it.
- Fetch and read the supporting resources, cite taught claims and recommend the most useful primary source for deeper study. When source coverage is missing, fill that gap before presenting the claim as known.

## Lesson and assets

[mattpocock/skills, teach/SKILL.md]

- The source's lesson artifact is a self-contained HTML lesson under `lessons/`, with sequential `0001-slug.html` names. Make it short, readable and easy to revisit, with links to related lessons and references.
- Inspect existing `assets/` first. Reuse styles, quiz widgets, simulations and diagram helpers; put actually shared new behavior there rather than duplicate it across lessons.
- Use a shared stylesheet so the workspace reads as one course. Create further reusable components when lessons need them, within the repository's existing simplicity and dependency rules.
- Remind the learner that they can ask follow-up questions. Present or open the lesson using the available authorized local workflow.

## Practice with feedback

[mattpocock/skills, teach/SKILL.md]

- Pair explanations with an exercise, quiz or lightweight browser interaction that lets the learner apply the skill and receive prompt feedback.
- The source suggests retrieval from memory, practice spread over time and mixing related skills during practice. Treat these as its lesson-design preferences, without adding unsupported scientific guarantees or numeric schedules.
- Avoid answer clues in quiz formatting and order. The source prefers equal answer word counts, similar character lengths when possible, and varying the correct answer's position; preserve accurate meaning while applying that formatting preference.
- For judgment that needs practitioner experience, find an appropriate community when the learner wants one. Explain the source and purpose of the recommendation, then leave participation to the learner.

## Reference material

[mattpocock/skills, teach/SKILL.md]

Create a reference sheet when the lesson yields material worth retrieving later: a supported syntax reference, algorithm, process diagram or topic glossary. Keep it concise, easy to scan and printable, with links from the lessons that use it. Source any included snippets; do not invent code merely to make the sheet look complete. Glossary promotion and learning records follow [WORKSPACE.md](WORKSPACE.md), rather than treating lesson completion as proof of understanding.

## Prove it

[mattpocock/skills, teach/SKILL.md]

The lesson teaches one mission-relevant capability with sourced claims, then gives the learner a way to apply it and see feedback. Existing assets are reused, shared content has one owner, and reference sheets support quick future use. The recorded learning result matches what the learner actually demonstrated.
