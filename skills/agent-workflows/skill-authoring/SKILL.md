---
name: skill-authoring
description: "Writes Claude Code and Agent Skills skills the way the Claude Code team builds them: picking one of nine skill categories, a description with capability and triggers, a Gotchas section grown from real failures, a folder with progressive disclosure, goals instead of railroaded steps, manual-only and model-only invocation, setup config, skill memory, skills that audit a project without leaving state, bundled scripts and helper libraries, on-demand hooks, workflows shipped as templates, sharing through the repo or a plugin marketplace, composing skills, observable decision records, linter or guidance, and measuring and hillclimbing skill triggering and quality, with and without the skill, keeping it current from real use, and packaging a course, podcast or newsletter archive as a source-cited knowledge skill. Use when creating, reviewing or improving a skill or SKILL.md, a skill under-triggers or misfires, deciding how to share skills with a team, or turning a course or content archive into a skill."
---

# Skill authoring

A skill is a folder of instructions, scripts and resources that an agent discovers and uses to do something more accurately and efficiently, not "just a markdown file": it can hold scripts, assets and data the agent can discover, explore and manipulate, and in Claude Code its frontmatter has many configuration options, including registering dynamic hooks (see the [frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference)). The most effective skills use those options and the folder structure well. Most of the best ones began as a few lines and a single gotcha, then got better because people kept adding to them as Claude hit new edge cases. Start from the [skills documentation](https://code.claude.com/docs/en/skills) and the [example skills](https://github.com/anthropics/skills) to customize.

Branch-triggered references and observable completion also draw on [mattpocock/skills, writing-for-agents]; pressure checks on [obra/superpowers, writing-skills]; navigation and routing negatives on [bgauryy/octocode, octocode-skills]. Official description requirements take precedence over source preferences.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choosing what the skill is: the nine categories, examples of each, finding gaps in a library | [CATEGORIES.md](CATEGORIES.md) |
| Writing it: what to leave out, observable decisions, the Gotchas section and decision records, the description and persistent triggers, who may invoke it (`disable-model-invocation`, `user-invocable`) and namespaced commands, the folder, request modes and rule ids, goals over steps, decision authority, linter or guidance, rule files with Incorrect and Correct pairs ranked by impact, checking a compiled file against its sources, small topic files injected by kind, rules fetched at run time and their risk, a library reference skill, simplifying | [WRITING.md](WRITING.md) |
| Giving it code and state: scripts and helper libraries, scripts that feed an agent (deterministic JSON, exit codes, no clobbering, wrong-context failures, plug-in scanners, generated docs with a freshness gate), published primitives kept out of context, lint rules, setup config, user extensions kept in the project, memory, on-demand hooks, workflow files | [SCRIPTS-AND-HOOKS.md](SCRIPTS-AND-HOOKS.md) |
| Author an audit skill with explicit evidence and persistence contracts, routing UI and telemetry execution to their domain owners | [PROJECT-AUDITS.md](PROJECT-AUDITS.md) |
| Sharing it: checked into the repo or a plugin marketplace, a public registry or a single public URL, an uploaded ZIP for Claude, a skill handed to an audience, skills and docs bundled inside a package, running a marketplace, composing skills (a missing dependency is a stop, a manual-only chain of skills) | [DISTRIBUTION.md](DISTRIBUTION.md) |
| Knowing how it does: logging usage, triggering, evals with and without the skill, frozen scenarios, blind A/B, hillclimbing and evidence-based session reflection with judgment, tooling and divergent lenses | [MEASURING.md](MEASURING.md) |
| Turning an owned course, webinar series, podcast or newsletter archive into a skill: the pilot, the source register and rights, lesson and reference layers, claim records, the question router, context budget, the eight answer tests, packaging and an honest status table | [CONTENT-TO-SKILL.md](CONTENT-TO-SKILL.md) |

## Selected references

For a full evaluation suite, read [agent-evals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/SKILL.md); for an attempted onboarding audit, read [agent-dx-audit](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/agent-dx-audit/SKILL.md). These are selected evaluation branches, not prerequisites for writing a skill. Product-embedded skill visibility and routing remain in [agent-harness PROMPT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/PROMPT.md#skills). [existing skill-authoring, MEASURING.md and WRITING.md]

## The rules

1. **Fit one category.** The best skills fit cleanly into one; the ones that try to do too much straddle several and confuse the agent.
2. **Write the description for the model:** say what the skill does and when to use it, with the user's trigger words, as required by the [Agent Skills specification](https://agentskills.io/specification#description-field). The routing purpose remains; it does not replace the capability description.
3. **Don't state the obvious.** Leave out what Claude would do by default; keep the opinions, knowledge and practices particular to you, your team or product, and what pushes Claude out of its normal way of thinking.
4. **Build a Gotchas section** from the failure points Claude actually hits, and keep adding to it.
5. **Make the folder do the work:** tell Claude which files the skill has and when to read each; split long skills into many files.
6. **State the goal and the constraints, not every step;** constrain hard only in highly important areas.
7. **Give it code when the job needs it:** scripts and helper libraries, so Claude spends its turns on composition instead of reconstructing boilerplate.
8. **Measure it:** log usage to find skills that are popular or under-triggering, and improve a skill against an eval, not a hunch; a skill earns its place only if the agent does the job better with it than without it.

## Prove it

Check the authoring decisions and resources used by this skill. Measurement guidance describes the evaluation branch; report unperformed evaluations rather than treating authoring as permission to run them.

The description reads as when to trigger, with literal trigger phrases, and the skill sits in one category; SKILL.md names every file in the folder and the case for each; a Gotchas section exists and each entry traces to a failure Claude hit; no section restates what Claude does by default; instructions state goals and constraints rather than numbered steps outside high-risk spots; and every file's own Prove it checks pass for the parts you touched.
