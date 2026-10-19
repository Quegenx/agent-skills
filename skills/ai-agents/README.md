# AI agent skills

Build AI agents and AI features: the agent's loop and checks (`agent-harness`), testing it (`agent-evals`), long-term memory (`agent-memory`), its chat interface (`agent-chat-ui`), how its code is laid out (`agent-codebase`), writing skills (`skill-authoring`), Jev classifiers inside it (`jev-decisions`), and search, RAG and extraction (`ai-features`). Details in the [main README](../../README.md#ai-agents).

10 skills.

## Skills

Building agents that stay reliable, and the AI features around them. Start with `agent-harness`; it routes to the rest.

| Skill | Covers |
|---|---|
| [agent-harness](./agent-harness/SKILL.md) | Reliable LLM agents: rule placement, prompts, code gates, tool contracts, history, compaction, multi-agent workflows, scheduled agents and AI SDK runtime. Source research, authority binding, coverage, exact cleanup ownership, cancellation, context-cost measurement, cost per accepted result, plan handoffs and session diagnosis. |
| [agent-evals](./agent-evals/SKILL.md) | Eval suites that run the real agent with outside services faked, code checks and calibrated judges, simulated users, the fix loop to a clean run, hillclimbing with keep-or-revert rounds and a noise check, checks that the eval itself is sound, release gates, and auditing docs or a SKILL.md with subagents, evaluating a skill against a run without it. Also: Graph outcomes and node diagnostics, trajectory comparison modes, goal-linked metrics, guardrails and fixed experimental harnesses. Updated coverage: Real-agent evals, calibrated judges, review taxonomies, managed/local boundaries, DeepEval and evidence-based documentation audits. |
| [skill-authoring](./skill-authoring/SKILL.md) | Writing skills the way the Claude Code team does: nine skill categories, descriptions written as triggers, Gotchas sections, progressive disclosure, setup config and skill memory, scripts and on-demand hooks, sharing through a repo or marketplace, measuring how often a skill triggers and hillclimbing it, observable decisions and rule records, linter or guidance, keeping a skill current from real use; manual-only invocation and skills that audit a project without leaving state; turning a course or content archive into a skill. Also: Co-located constraints and branch-triggered references, capability-plus-use-condition descriptions and source-based pressure/evaluation expectations. |
| [agent-memory](./agent-memory/SKILL.md) | Long-term agent memory: what to remember and where, background extraction, consolidation, an always-on profile plus search, staying current, forgetting, user controls and memory evals. Also: Parent-conversation evidence, trigger/decision/quality/stop-condition preference atoms and explicit confidence. |
| [agent-chat-ui](./agent-chat-ui/SKILL.md) | An agent's chat interface: the live status line and folded work log, smooth streaming text, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, the conversation list, every timing and size. Ships the production source in `reference/` |
| [agent-codebase](./agent-codebase/SKILL.md) | An agent's code layout: transport, core, memory, skills and tools folders, names, dependency direction, test mirror and eval seams. Also: Search phrases beside implementation details and searchable domain conventions. |
| [jev-decisions](./jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`., the decide API names by AI SDK version |
| [ai-features](./ai-features/SKILL.md) | Vector and hybrid search, RAG with citations, structured extraction, AI jobs |
| [guided-learning](./guided-learning/SKILL.md) | Learning missions, cited resources, observed evidence, interactive lessons and reusable reference material. |
| [langfuse](./langfuse/SKILL.md) | Tracing, prompt management, evaluations and source-grounded migration between telemetry systems. |
