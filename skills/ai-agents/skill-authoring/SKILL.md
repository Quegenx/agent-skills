---
name: skill-authoring
description: "Writes Claude Code and Agent Skills skills the way the Claude Code team builds them: picking one of nine skill categories, a description written as a trigger, a Gotchas section grown from real failures, a folder with progressive disclosure, goals instead of railroaded steps, setup config, skill memory, bundled scripts and helper libraries, on-demand hooks, workflows shipped as templates, sharing through the repo or a plugin marketplace, composing skills, and measuring and hillclimbing how often a skill triggers and how well it works. Use when creating, reviewing or improving a skill or SKILL.md, a skill under-triggers or misfires, or deciding how to share skills with a team."
---

# Skill authoring

A skill is a folder of instructions, scripts and resources that an agent discovers and uses to do something more accurately and efficiently, not "just a markdown file": it can hold scripts, assets and data the agent can discover, explore and manipulate, and in Claude Code its frontmatter has many configuration options, including registering dynamic hooks (see the [frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference)). The most effective skills use those options and the folder structure well. Most of the best ones began as a few lines and a single gotcha, then got better because people kept adding to them as Claude hit new edge cases. Start from the [skills documentation](https://code.claude.com/docs/en/skills) and the [example skills](https://github.com/anthropics/skills) to customize.

| The job | Read |
|---|---|
| Choosing what the skill is: the nine categories, examples of each, finding gaps in a library | [CATEGORIES.md](CATEGORIES.md) |
| Writing it: what to leave out, the Gotchas section, the description, the folder and progressive disclosure, goals over steps, simplifying | [WRITING.md](WRITING.md) |
| Giving it code and state: scripts and helper libraries, setup config, memory, on-demand hooks, workflow files | [SCRIPTS-AND-HOOKS.md](SCRIPTS-AND-HOOKS.md) |
| Sharing it: checked into the repo or a plugin marketplace, running a marketplace, composing skills | [DISTRIBUTION.md](DISTRIBUTION.md) |
| Knowing how it does: logging skill usage, under-triggering, evals and hillclimbing a skill | [MEASURING.md](MEASURING.md) |

## The rules

1. **Fit one category.** The best skills fit cleanly into one; the ones that try to do too much straddle several and confuse the agent.
2. **Write the description for the model, not for humans:** it is what Claude scans to decide whether a skill fits the request, so say when to trigger it and include the user's trigger words.
3. **Don't state the obvious.** Leave out what Claude would do by default; keep the opinions, knowledge and practices particular to you, your team or product, and what pushes Claude out of its normal way of thinking.
4. **Build a Gotchas section** from the failure points Claude actually hits, and keep adding to it.
5. **Make the folder do the work:** tell Claude which files the skill has and when to read each; split long skills into many files.
6. **State the goal and the constraints, not every step;** constrain hard only in highly important areas.
7. **Give it code:** scripts and helper libraries, so Claude spends its turns on composition instead of reconstructing boilerplate.
8. **Measure it:** log usage to find skills that are popular or under-triggering, and improve a skill against an eval, not a hunch.

## Prove it

The description reads as when to trigger, with literal trigger phrases, and the skill sits in one category; SKILL.md names every file in the folder and the case for each; a Gotchas section exists and each entry traces to a failure Claude hit; no section restates what Claude does by default; instructions state goals and constraints rather than numbered steps outside high-risk spots; and every file's own Prove it checks pass for the parts you touched.
