---
name: reverse-engineering
description: "Investigates shipped JavaScript, Electron, Flutter APK, WASM and SQLite artifacts and observed web features with REA: scoped analysis, source recovery, runtime observation, captures, version comparison and evidence coverage; best-effort API inference from recorded traffic with the separate Browserbase generator. Use when ordinary source is missing, a shipped package differs from source, or a feature needs artifact or runtime evidence."
---

# Reverse engineering

From [morluto/rea, reverse-engineer-anything] and its website-source, Flutter, WASM and SQLite guides, checked against the project's [README](https://github.com/morluto/rea/blob/main/README.md) and tool contracts. Use this for a lawful investigation of the user's identified artifact or web feature. The [recorded-traffic API generator](TRAFFIC-TO-OPENAPI.md) comes from [browserbase/skills, browser-to-api]; it has separate source-workspace prerequisites and sample-based limits. Selected investigation checklists also draw on [JoasASantos/REA-Prompts, README.md]. Ordinary complete-source investigation belongs in [debugging](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md) and [code research](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Decide scope and evidence type | [SKILL.md](SKILL.md) |
| Rebuild a live component, section or animation with the source's exact visuals and behavior | [pixel-reverse-engineer](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/SKILL.md) |
| Connect an available tool surface or repair an observed blocker | [CONNECTION.md](CONNECTION.md) |
| Analyze an ASAR or JS tree, page modules, trace a feature, inventory Electron IPC or compare selected security patches/versions | [JAVASCRIPT.md](JAVASCRIPT.md) |
| Export captured website scripts, map source positions or trace native imports | [CAPTURED-SOURCES.md](CAPTURED-SOURCES.md) |
| Identify a Flutter APK build or inspect bounded Dart AOT facts | [FLUTTER-ARTIFACTS.md](FLUTTER-ARTIFACTS.md) |
| Inspect local WASM interfaces or a coherent SQLite database/WAL snapshot | [OFFLINE-ARTIFACTS.md](OFFLINE-ARTIFACTS.md) |
| Observe a user action, perform a declared scenario or reconcile static/runtime evidence | [RUNTIME.md](RUNTIME.md) |
| Inspect saved captures, retained records, unknowns, finite comparisons and selected behavior/interaction specifications or investigation handoffs | [CAPTURES-AND-EVIDENCE.md](CAPTURES-AND-EVIDENCE.md) |
| Infer a best-effort OpenAPI document from recorded traffic using the separate Browserbase generator | [TRAFFIC-TO-OPENAPI.md](TRAFFIC-TO-OPENAPI.md) |

## The rules

1. **Select the actual target.** Resolve the supplied app name, artifact path or selected browser target. Ask if ambiguous; a nearby fixture or old report does not select the user's app. [morluto/rea, reverse-engineer-anything/SKILL.md]
2. **Use the connected contract.** Discover advertised tools and input schemas; repository main can describe features absent from the installed release. A tool inventory, a provider candidate and the selected provider are different scopes. [morluto/rea, reverse-engineer-anything/SKILL.md]
3. **Match evidence to the question.** Static relationships do not establish runtime execution. Runtime observation needs the declared target and lifecycle; it cannot silently broaden the user's requested actions. [morluto/rea, reverse-engineer-anything/SKILL.md]
4. **Start small and reuse evidence.** Use an overview or summary, then one unanswered question. Page retained records instead of rerunning an identical producer to fit its output in context. [morluto/rea, reverse-engineer-anything/SKILL.md]
5. **Keep effects explicit.** Static JS analysis uses an owned worker and temporary sources; it is not effect-free merely because it does not execute target code. Acquisition, setup, navigation and execution observation have separate effects. [REA JavaScript implementation](https://github.com/morluto/rea/blob/main/src/domain/javascript/javascriptApplicationAnalysis.ts)
6. **Keep interpretation separate from observation.** Cite returned Evidence IDs and preserve limitations, source selection and residual unknowns. Use the shared [verification rules](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/VERIFICATION.md) rather than redefining proof. [morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]
7. **Scope parallel work by question.** Share target identity and existing evidence, assign independent questions, and return conclusions with evidence and unresolved gaps. [morluto/rea, reverse-engineer-anything/SKILL.md]
8. **Finish against the original questions.** Mark each answered, partial or unresolved. A finite reconstruction check does not prove global equivalence. [morluto/rea, reverse-engineer-anything/SKILL.md; references/evidence-workflows.md]

## Gotchas

- Installing this skill does not register an MCP server or install analysis engines. [morluto/rea, reverse-engineer-anything/SKILL.md]
- Summary delivery does not by itself reduce analysis work; exact source selection does. [morluto/rea, reverse-engineer-anything/references/javascript-applications.md]
- A static module or source-map match does not prove that module executed. [morluto/rea, reverse-engineer-anything/references/runtime-observation.md]
- An Electron target can use an unpacked application directory rather than `app.asar`. The supplied REA article said every Electron app kept its code in one ASAR; inspect the actual layout. [Electron packaging](https://github.com/electron/electron/blob/main/docs/tutorial/application-distribution.md); [art, rea article.md]

## Prove it

The report names the target and artifact digest, answers the requested questions with returned evidence, separates observations from inferences, accounts for partial coverage and lists unresolved questions. Any performed action and cleanup outcome are stated. [morluto/rea, reverse-engineer-anything/SKILL.md]
