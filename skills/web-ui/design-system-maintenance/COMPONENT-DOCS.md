# Document a canonical component

Produce one draft entry from implementation, props, styles, stories and real consumers. Sources: the supplied `component-docs/SKILL.md` and `references/doc-format.md`, with registry and readiness context from `build-design-system/references/components.md`. General developer writing stays in [developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md).

## Establish the source contract

[supplied design skills, component-docs/SKILL.md, Steps and Stops]

- Read the component code, props type, styles and stories. Record their paths, then find two real call sites where available. One real use, a planned use or a deprecated predecessor is valid evidence when labeled accurately.
- Stop the unsupported part when code, a variant definition or any real or planned use cannot be found. Return the sourced facts and the smallest missing input; do not invent an example to complete the page.
- A props type with no variant prop means the variant list is empty. It does not justify guessing variants from a neighboring component.
- Trace every example, variant, prop, state and token to a named source. Record disagreements under Conflicts with the project rule that resolves them, or state that no rule chose a side.
- Describe a suspected defect as implemented, then add a Defect line naming the user-visible failure and proposed smallest fix. Writing documentation does not authorize changing the code being documented.

## The entry's order

[supplied design skills, component-docs/references/doc-format.md, Headings and What goes in each]

| Section | Content |
|---|---|
| Description | One sentence naming the job, then import, client/server ownership, source path and registry status; independently usable parts get a Parts subsection |
| Examples | A real default example and source path, followed by example-file coverage for variant values, visibly or behaviorally distinct states and composition |
| Variants | One subsection per actual prop axis; state None when there is no variant prop |
| States | What the user can do in each implemented state; name visual cues and state precedence only when source establishes them |
| Props | Name, type, default and when to change it, from code; state NOT SUPPLIED when no props type was read |
| Usage | When to use, When not to use, Rules, Content, Anti-slop and Limits |
| Accessibility | Native element or primitive, role, keys, focus destination and accessible name, distinguishing code evidence from rendered evidence |
| Tokens | Exact names read from style references, grouped by what they control |
| Related | Components people confuse with this one and the condition for choosing each |

Copy examples from a story or example file. If only a real call site exists, remove unrelated props only and label the result Simplified from its path. This does not permit new example code assembled from memory. [supplied design skills, component-docs/SKILL.md, rule 1; references/doc-format.md, Examples]

Record a section with no sourced content as Not applicable with a reason, rather than filling the structure with invented states or defaults. The supplied worked Toast example is explicitly fictional and partial; it is a format illustration, not evidence that the project's Toast has those props, timers or semantics. [supplied design skills, component-docs/SKILL.md, Done; references/doc-format.md, Worked example]

## Usage rules that can be checked

[supplied design skills, component-docs/SKILL.md, step 6; references/doc-format.md, Rule shape]

- Give each rule a stable component-specific identifier, condition, action, reason, evidence and check. Use the project's existing vocabulary.
- Ground the reason in actual consumers, a recorded measurement, a named principle or the person's words. A single observed use stays labeled single use.
- A Don't example comes from real code; a Do example requires a sourced implementation too. Cut a rule that cannot identify an observable violation rather than inventing one to satisfy the template.
- Sweep the real consumer set: each follows the rule or is a recorded exception. A rule not exercised by the available check remains unproven.
- Document content rules by slot and limits below a measured break. An unmeasured limit says NEEDS REVIEW and names what must be measured.
- The source's Anti-slop section compares a fresh agent's use with real consumers. Perform that comparison only when requested or justified by the task; otherwise state that it was not evaluated rather than claiming a result.

## Close the draft

[supplied design skills, component-docs/SKILL.md, Output and Done]

Deliver the draft with Sources, Conflicts and Guessed at records. Name unsupported or planned behavior plainly. Preserve the team's documentation format and destination where one exists; the supplied default is `docs/system/<name>.md` with a draft marker. Publishing remains a separate action.

## Prove it

Every documented API, state, token and example has a source path; each conflict and judgment call is explicit; behavior is described as implemented; missing evidence remains visible; and no component or story was changed merely to make its documentation complete. [supplied design skills, component-docs/SKILL.md]
