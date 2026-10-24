---
name: code-research
description: "Investigates code questions from exact source, callers, history and observed results, preserving evidence, version identity, confidence and coverage limits. Use when locating an implementation, explaining behavior or historical rationale, tracing dependencies, comparing a change or researching an installed dependency."
---

# Code research

Find the source that settles the question and report what the evidence supports. Sources: [bgauryy/octocode, octocode-research], [JuliusBrussee/caveman, caveman-explore and cavecrew], and [dzhng/jevgrep, jevgrep]. The [debugging skill](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md) owns causal diagnosis; [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) owns delegation.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choose the research boundary and evidence requirements | [SKILL.md](SKILL.md) |
| Locate source, establish behavior or historical motivation, keep a confidence ledger and explain the observed flow | [SOURCE-RESEARCH.md](SOURCE-RESEARCH.md) |

## The rules

1. **Start from the strongest supplied handle.** Use the exact path, identifier, code shape or installed revision before repeating discovery. [bgauryy/octocode, octocode-research/references/algorithm.md and researcher-mindset.md]
2. **Match proof to the claim.** Cross-check consequential conclusions using exact source and the relevant structure or connections; preserve failed, partial and unavailable searches as coverage limits. [bgauryy/octocode, octocode-research/references/code-research.md]
3. **Record the actual revision and scope.** A requested ref can differ from the resolved ref; an inventory and search need matching roots and exclusions. [bgauryy/octocode, octocode-research/references/algorithm.md; dzhng/jevgrep, jevgrep/SKILL.md]
4. **Track alternatives and stop on evidence.** Keep the decisive anchors, confidence, unresolved explanation and next check; another call must be able to change the conclusion. [bgauryy/octocode, octocode-research/references/loop-mode.md]
5. **Return locations actually read.** Preserve exact paths, ranges and continuation handles, and distinguish localization from a broader architecture proposal. [JuliusBrussee/caveman, caveman-explore/SKILL.md and cavecrew/SKILL.md]

## Prove it

Use [SOURCE-RESEARCH.md](SOURCE-RESEARCH.md#prove-it) to check each conclusion's anchors, coverage, revision and unresolved alternatives. [bgauryy/octocode, octocode-research/references/code-research.md and loop-mode.md]
