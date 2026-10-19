---
name: pixel-reverse-engineer
description: Reverse-engineer live website sections and components with pixel-perfect accuracy by inspecting their actual HTML, CSS, assets, JavaScript, libraries, and runtime behavior rather than guessing from screenshots. Use when the user asks to clone, recreate, port, or reverse-engineer a component, section, page, interaction, animation, or visual effect from an existing website. Also use when they ask how a live page or visual effect was built, or run /pixel-reverse-engineer.
---

# Pixel Reverse Engineer

Rebuild a live website section or component in the target project with **1:1 visual and behavioral fidelity**. From the owner's supplied `pixel-reverse-engineer/SKILL.md`. Inspect the actual HTML, CSS, assets, JavaScript, libraries, responsive behavior and animation logic, then adapt the implementation cleanly to the target project's existing stack.

For an explanation-only question, use [INSPECTION.md](INSPECTION.md): report the mechanism, evidence tiers and unknowns without implementing a copy. The reconstruction rules and [WORKFLOW.md](WORKFLOW.md) apply when a recreation is requested. [Jakub Krehel, explain-interface]; [pixel-reverse-engineer, SKILL.md]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Set fidelity, evidence and target-project constraints | [SKILL.md](SKILL.md) |
| Inspect, extract, implement and compare the requested live component or animation | [WORKFLOW.md](WORKFLOW.md) |
| Explain how a live page or effect was built without reconstructing it; inspect styles, layers and motion; distinguish measured, derived and inferred evidence | [INSPECTION.md](INSPECTION.md) |
| Investigate shipped JS/Electron artifacts or reconcile static and runtime evidence | [Reverse engineering](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/reverse-engineering/SKILL.md) |
| Build from Figma or a design image instead of a live implementation | [Building from a design file](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/FROM-DESIGN.md) |

## The rules

1. **Source first.** Inspect the real implementation before writing code. Do not guess from screenshots when the live implementation can be inspected. [pixel-reverse-engineer, SKILL.md]
2. **1:1 means 1:1.** Preserve dimensions, spacing, typography, colors, assets, structure, breakpoints, states, transitions, animation timing and interaction behavior. [pixel-reverse-engineer, SKILL.md]
3. **Do not approximate values that can be extracted from the source.** [pixel-reverse-engineer, SKILL.md]
4. **Do not invent motion, states, interactions or behavior.** [pixel-reverse-engineer, SKILL.md]
5. **Do not redesign or "improve" the source** unless the user explicitly asks. [pixel-reverse-engineer, SKILL.md]
6. **Adapt implementation, not appearance.** The code should fit the target repo while the rendered result remains faithful to the source. [pixel-reverse-engineer, SKILL.md]
7. Prefer a maintainable implementation **only when it preserves identical rendered output and behavior**. Source fidelity takes precedence over refactoring, abstraction, framework conventions or implementation elegance. This is the priority within the requested reconstruction, not permission to change protected owner designs or override existing domain rules; see the [tagged conflicts](WORKFLOW.md#existing-components). [pixel-reverse-engineer, SKILL.md]; [owner standing rules]
8. **No implicit defaults. No values mentioned in this skill are defaults.** Every timing, dimension, spacing value, breakpoint, color, easing curve, spring parameter, animation value, selector, asset, library configuration, state transition and behavioral value must derive from the **current source** or the **current target repository**. Never carry implementation values from examples, previous websites, previous reverse-engineering tasks, framework defaults or memory into a new recreation. Discover extractable values; never silently guess. [pixel-reverse-engineer, SKILL.md]
9. **Keep missing evidence explicit.** The source permits the smallest defensible inference only when necessary and isolated from verified behavior. Under the owner's evidence-only rule, an unresolved factual value stays unknown or needs the missing source; never present an inference as an extracted fact. Use the existing [evidence tiers](INSPECTION.md#measured-derived-inferred), rather than inventing values. [pixel-reverse-engineer, SKILL.md]; [owner standing rules]
10. **Inspect the target project before implementing.** Determine its framework/runtime, component structure, styling system, design tokens, animation libraries, icon system, localization and RTL setup, routing, asset handling, package manager, lint/format/typecheck/test setup and build commands. Use existing conventions when they reproduce the source accurately; do not force another styling system. [pixel-reverse-engineer, SKILL.md]
11. Prefer an equivalent existing dependency **only when it can reproduce the source exactly**. If exact behavior depends on a source library that cannot reasonably be reproduced with the target stack, use the original library when appropriate and authorized. A source dependency is not automatic permission to install one; follow the target project's approval requirements. [pixel-reverse-engineer, SKILL.md]; [AGENTS.md, Pause and confirm]

## Prove it

The requested target and its materially relevant dependencies are identified. Values come from the current source or target repository; unknowns and inferences remain explicit. Compare the local result against the source for structure, pixels, motion, responsive states, outside dependencies and runtime behavior using the [verification checklist](WORKFLOW.md#11-verify-against-the-source). State what was actually inspected, what remains different and what remains unverified; the 1:1 goal is not itself proof of a match. [pixel-reverse-engineer, SKILL.md]; [reverse-engineering, SKILL.md]
