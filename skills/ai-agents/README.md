# AI agent skills

Build AI agents and AI features: the agent's loop and checks (`agent-harness`), testing it (`agent-evals`), auditing agent-facing docs and SDK onboarding (`agent-dx-audit`), long-term memory (`agent-memory`), its chat interface (`agent-chat-ui`), how its code is laid out (`agent-codebase`), writing skills (`skill-authoring`), Jev classifiers inside it (`jev-decisions`), and search, RAG and extraction (`ai-features`). Details in the [main README](../../README.md#ai-agents).

11 skills.

## Skills

Building agents that stay reliable, and the AI features around them. Start with `agent-harness`; it routes to the rest.

| Skill | Covers |
|---|---|
| [agent-harness](./agent-harness/SKILL.md) | Reliable LLM agents: rule placement, prompts, gates, tool contracts and authorization, conversation history/replay and compaction, multi-agent workflows, scheduled agents, runtime, context/cost measurement, harness refinement and session diagnosis. Source research and plan execution route to their architecture owners. |
| [agent-evals](./agent-evals/SKILL.md) | Real-agent suites with outside services faked, code checks and calibrated judges, graph and trajectory evidence, fix loops, release gates, review taxonomies, managed/local tooling and DeepEval. Component-use, document-read and resumed-result evidence stay distinct; ambiguous judge responses are grader errors. Docs/SDK onboarding audits route to agent-dx-audit. |
| [skill-authoring](./skill-authoring/SKILL.md) | Skill categories, capability/use-condition descriptions, progressive disclosure, Gotchas, observable decisions, scripts/hooks, distribution, measurement and source-cited archive packaging. Audit-skill contracts route execution policy to repository review, UI shortlists and telemetry audit owners. |
| [agent-dx-audit](./agent-dx-audit/SKILL.md) | Task-based audits of agent-facing docs, SDKs and skills: target/goal intake, personas, scoped credentials, discovery traces, onboarding scores and an evidence-backed HTML report. |
| [agent-memory](./agent-memory/SKILL.md) | Long-term agent memory: extraction, consolidation, profiles and retrieval, a bounded minimal store, expiry, forgetting, user controls and memory evals. Parent-conversation evidence and confidence remain explicit. |
| [agent-chat-ui](./agent-chat-ui/SKILL.md) | An agent's chat interface: the live status line and folded work log, smooth streaming text, approval and question cards, results as the product's own components, follow-ups, the composer with files, voice and a queue, the conversation list, every timing and size. Ships the production source in `reference/` |
| [agent-codebase](./agent-codebase/SKILL.md) | An agent's code layout: transport, core, memory, skills and tools folders, names, dependency direction, test mirror and eval seams. Also: Search phrases beside implementation details and searchable domain conventions. |
| [jev-decisions](./jev-decisions/SKILL.md) | Yes/no, choice and score questions, facts kept apart from evidence, thresholds and gates, agent tool gates and stop hooks, trace judges, calibration and evals, plus worked recipes (value and date extraction, search, re-ranking, taxonomies, record matching, guardrails, memory, tool suggestion). TypeScript with `@typesafe-ai/sdk`., the decide API names by AI SDK version |
| [ai-features](./ai-features/SKILL.md) | Vector and hybrid search, RAG with citations, structured extraction, AI jobs |
| [guided-learning](./guided-learning/SKILL.md) | Learning missions, cited resources, observed evidence, interactive lessons and reusable reference material. |
| [langfuse](./langfuse/SKILL.md) | Tracing, prompt management, evaluations and source-grounded migration between telemetry systems. |
