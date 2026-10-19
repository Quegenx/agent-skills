# Workflow source, graphs and executions

Automation contracts from [gokapso/agent-skills, automate-whatsapp/references/local-workflow-source.md; graph-contract.md; node-types.md; workflow-reference.md; execution-context.md; triggers.md; workflow-overview.md], corrected against [Kapso Build locally](https://docs.kapso.ai/docs/workflows/build-locally). WhatsApp-native forms remain in [FLOWS.md](FLOWS.md).

## Local source ownership

- The source-sync toolchain is @kapso/cli with @kapso/workflows. link binds the directory to a project; pull writes kapso.yaml, project/remote-map metadata, Functions and workflow source. Review the actual project before any push. [gokapso/agent-skills, automate-whatsapp/references/local-workflow-source.md]
- Author workflow.js or workflow.ts when code is the source of truth; advanced node settings use rawConfig, and local functionSlug/workflowSlug references avoid hardcoded remote IDs. Without code, workflow.yaml and definition.json remain the direct authored representation. [gokapso/agent-skills, automate-whatsapp/references/local-workflow-source.md]
- pull preserves hand-authored code, updates remote-owned YAML/JSON and refuses dirty remote-owned files. pull --diff inspects blocked changes; --overwrite discards them and requires that scope. Use build and push --dry-run to review compiled changes before an authorized push. These are instructions for the user's application, not checks automatically run while maintaining this skills repository. [gokapso/agent-skills, automate-whatsapp/references/local-workflow-source.md]

## Graph updates

- Read the complete current graph and preserve stable IDs, outgoing labels and configuration not owned by the change. Collections in a definition update are replacement collections, so a partial collection can remove existing nodes/edges/triggers. [gokapso/agent-skills, automate-whatsapp/references/graph-contract.md]
- Include the latest lock_version in the PATCH and handle a stale conflict by rereading before recomputing the edit. The source said the API did not enforce it and its helpers only performed a precheck; current [Build locally](https://docs.kapso.ai/docs/workflows/build-locally) requires the version in the update. A GET comparison alone does not guard the later write.
- Source's validator omitted emit_event from its accepted node set. The official [Emit event node](https://docs.kapso.ai/docs/flows/step-types/emit-event-node) supports it; do not use that helper's rejection as proof a graph is invalid.

## Nodes, tools and runtime values

[gokapso/agent-skills, automate-whatsapp/references/node-types.md; execution-context.md; triggers.md]

- Distinguish start, sends, set-variable, waits, decisions, subworkflow calls, webhooks, Functions, agents, handoff and event emission. Edges name the route; make every referenced node and decision label resolve.
- Agent tools belong to the agent node's configuration. Keep tool schema, actual function contract, delivery mode and runtime variable references aligned; discover supported models from the current service rather than copying the source's model example as current availability.
- Function responses merge vars; Decide responses select next_edge. The source suggests always falling back to the first edge; keep that as described source behavior only. An uncertain privileged decision must use the existing [fail-closed rule](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md), not an arbitrary success edge.
- A Jev integration node's wiring belongs here; the general decision technique has one owner in [jev-decisions](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md).

## Inspect and resume

[gokapso/agent-skills, automate-whatsapp/references/workflow-overview.md; workflow-reference.md; execution-context.md; triggers.md]

- Read execution state, active step and events before resuming. A waiting execution, a completed execution and a failed run are not interchangeable restart targets. Preserve the actual execution identity and cursor pagination.
- Inbound routing and observer behavior depend on the trigger/mode. Discoverable context variables describe what is available, not proof that every execution populated them; inspect vars/system/context/metadata for the actual run.
- Project-event-triggered observer workflows cannot emit another Project Event. Event definitions, matching and quota rules are [FUNCTIONS-AND-EVENTS.md](FUNCTIONS-AND-EVENTS.md).

## Prove it

[gokapso/agent-skills, automate-whatsapp/references/graph-contract.md; local-workflow-source.md]

The complete graph retains unrelated identities and collections; lock_version travels with the mutation; local and remote ownership are explicit; every edge/slug resolves. A push acknowledgement is not proof that the intended trigger, wait, route or resume completed at runtime.
