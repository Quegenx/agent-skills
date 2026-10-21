# Captures and retained evidence

From [morluto/rea, reverse-engineer-anything/references/evidence-workflows.md; references/runtime-observation.md]. Shared proof standards remain in [debugging VERIFICATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/VERIFICATION.md).

## Inspect a saved recording

[morluto/rea, reverse-engineer-anything/SKILL.md; references/runtime-observation.md; references/evidence-workflows.md]

- inspect_web_network_capture reads supported saved captures without fetching their recorded URLs. HAR and native SAZ are historical evidence, not live attribution; encrypted SAZ archives are unsupported.
- Start large captures with summary detail when advertised, then inspect_analysis_view pages for selected records. Preserve original record ordinals and parent Evidence identity.
- The retained HAR api-surface view groups observed method/origin/path-template lines. Those groups infer a client-observed surface, not server handlers, required inputs or a complete schema.
- Optional observed query-parameter names retain original record support. Omitting values does not make a raw parent capture public or establish all required parameters.
- Fiddler Everywhere live traffic uses its separate connected tool surface. Preserve existing sessions and filters, and choose the advertised session source explicitly.
- A normalized comparison of captures establishes only the compared recorded observations. Missing source coverage remains unknown.

## Project an observed API environment

[morluto/rea, docs/web-network-captures.md; src/domain/analysisView/EnvironmentManifestAccumulator.ts; environmentManifestRules.ts; environmentManifestView.ts]

- When advertised, the retained HAR `environment-manifest` view projects primary-origin request groups into named tool candidates with path templates, parameters, observed query names, value-free body shapes and original record pointers. It performs no network activity or replay.
- The selected origin and route templates are projection choices/inferences, not proof of the server's complete API. Opt into `template_rules` only when the recorded identifiers need them, retaining each rule's assumptions and merged siblings.
- A body shape uses top-level JSON key/type names from the group's first recorded request, when it has a qualifying JSON object body. Later requests do not fill a missing first body shape. Observed query names establish neither required fields nor their types.
- Preserve the stated unknown authorization model, response semantics and state transitions. The supplied article asked for an OpenAPI specification and working client from HAR; these finite observations do not establish a complete contract. [art, How To Turn Opus 5.5 Into Your Personal Reverse Engineer (Full Setup Included) .md]
- This projection supports the documented HAR profile, not every saved capture format. Preserve typed refusals when explicit sensitive declarations cannot be rechecked from retained parent evidence; do not bypass that refusal by treating the raw capture as public.

For the separate Browserbase workflow that infers an OpenAPI document and client from recorded samples, read [TRAFFIC-TO-OPENAPI.md](TRAFFIC-TO-OPENAPI.md). Its generator and output-safety limits do not expand this REA projection's coverage. [browserbase/skills, browser-to-api; morluto/rea, docs/web-network-captures.md]

## Preserve the record

[morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]

- Read normalized_result and cite evidence_id. Preserve authority, source selection, limitations and unknowns.
- Use retained views for a summary, section, module or stable page instead of repeating a completed producer.
- Inventory pages expose occurrences, nodes, edges and integrity contradictions. Empty selection and omitted selection have different meanings.
- Keep source_complete separate from page exhaustion. Only complete comparable evidence supports an absence/equivalence claim.
- Export a complete bundle before closing when evidence must persist. A client-truncated preview is not the retained record.
- If the parent ID is lost, use the advertised bundle summary with exact operation, artifact digest or analysis-profile filters to recover its actual Evidence ID. A complete-record retention marker does not resolve unknown metadata or truncated native facets. Inspect exported bundles through their supported summary/filter contract rather than inventing IDs or repeating a completed producer. [morluto/rea, reverse-engineer-anything/SKILL.md]

## Unknowns and finite verification

[morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]

- record_unknown names the unresolved question, missing authority/environment and supporting or contradicting Evidence.
- update_unknown requires the current revision. After a stale revision, reread rather than blindly retry.
- Artifact, function and bundle comparisons have different identity scopes. find_changed_behavior combines existing comparisons; a static difference remains a candidate rather than causal proof.
- A call path needs explicit dossiers from the same artifact/provider. An incomplete frontier cannot establish no path.
- verify_reconstruction checks a finite typed specification. A pass covers only the declared comparable claims.
- One matching input does not prove equivalence. The supplied rule-rebuild prompts asked for "one input that proves it matches the original"; retain the finite declared-specification boundary above and report cases passed, divergences and untested behavior. [https://github.com/morluto/rea/blob/main/docs/mcp-prompts.md; JoasASantos/REA-Prompts, README.md, Recover a rule and rebuild it; n, rea prompts.md, Recover a rule and rebuild it]
- Process captures are opt-in behavioral evidence and are not a security sandbox. Distinguish root exit, descendant settlement, finalization and recorded exit status; follow the connected contract rather than inferring successful completion from one signal.
- If using reconstruction obligation/coverage tools, retain each required claim's concrete owner, original authority, required case kinds, fixture/verifier links, dependencies and residual unknowns. A passing unit result cannot close a runtime/package claim requiring stronger authority; blocked or out-of-scope dispositions are not verified closure. [morluto/rea, docs/reconstruction-obligation-ledgers.md; docs/reconstruction-coverage.md]
- When an investigation handoff file is requested, keep `INVESTIGATION.md` with findings, evidence, discarded hypotheses and next steps prioritized by the uncertainty they can reduce. This is a selected handoff artifact, not a requirement to persist every investigation. [JoasASantos/REA-Prompts, README.md, Continue where you left off; https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SECURITY-AUDITS.md#execution-and-artifacts]
- If using the guided `audit_residual_unknowns` workflow, discover it through MCP `prompts/list` and retrieve it through `prompts/get`. It is a prompt, not a tool that runs an audit by itself; the same prompt/tool distinction applies when selecting the `compare_application_versions` or `verify_reconstruction` guided prompts. [https://github.com/morluto/rea/blob/main/docs/mcp-prompts.md]

## Optional behavior-only handoff

[art, rea article.md]

- When the requested reconstruction calls for independent implementation from behavior, separate the reader and builder sessions/workspaces. The reader produces a specification of behavior, inputs, outputs, edge cases and explicit unknowns; the builder receives that specification alone, excluding original code, addresses, identifiers and assets.
- For the selected reconstruction scope, cover user-visible features, screens and state machines; settings and persistence; file formats and network protocols; and error behavior. Cite the evidence for each requirement and mark unconfirmed behavior `UNKNOWN`. A full-application checklist does not expand a requested single-feature investigation. [JoasASantos/REA-Prompts, README.md, Full application clone (behavioral); existing SKILL.md, Select the actual target]
- When interaction semantics are part of that scope, document layout logic, keyboard shortcuts, command dispatch, undo/redo behavior and clipboard formats, with the original implementation evidence for each rule. This behavior checklist does not replace the requested visual-fidelity scope. [JoasASantos/REA-Prompts, README.md, UI/UX behavior cloning without assets; existing CAPTURES-AND-EVIDENCE.md, Optional behavior-only handoff]
- The setup article instead labels findings `CONFIRMED` when seen in code, otherwise `GUESS`. Keep the existing [observation/inference/unknown distinction](SKILL.md#the-rules): source-code presence does not establish runtime confirmation. [art, How To Turn Opus 5.5 Into Your Personal Reverse Engineer (Full Setup Included) .md]; [morluto/rea, reverse-engineer-anything/SKILL.md]
- This is a chosen project constraint, not a conclusion that a reconstruction is lawful or a replacement for a requested [pixel reconstruction](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/SKILL.md). Preserve the actual target rights and the user's requested fidelity/scope.
- Derive acceptance checks from the behavior specification and use the existing [independent-evidence](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#independent-evidence) and [mutation](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md#the-rules) guidance. Do not create another definition of an oracle or impose the article's example test/turn quotas.
- The article's prompts run tests and builds. Apply task authorization: this skills repo permits reading and `node --check` for changed JavaScript, with tests/builds only when asked. Report unperformed checks rather than claiming reconstruction equivalence. [owner standing rules, verification]

## Prove it

Each claim traces to an original record or Evidence ID, names its coverage and inference boundary, and preserves unresolved questions. No historical URL was replayed merely to inspect a capture, no partial preview was treated as complete, and finite verification was not described as global equivalence. [morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]
