# Captures and retained evidence

From [morluto/rea, reverse-engineer-anything/references/evidence-workflows.md; references/runtime-observation.md]. Shared proof standards remain in [debugging/VERIFICATION.md](../debugging/VERIFICATION.md).

## Inspect a saved recording

[morluto/rea, reverse-engineer-anything/SKILL.md; references/runtime-observation.md; references/evidence-workflows.md]

- inspect_web_network_capture reads supported saved captures without fetching their recorded URLs. HAR and native SAZ are historical evidence, not live attribution; encrypted SAZ archives are unsupported.
- Start large captures with summary detail when advertised, then inspect_analysis_view pages for selected records. Preserve original record ordinals and parent Evidence identity.
- The retained HAR api-surface view groups observed method/origin/path-template lines. Those groups infer a client-observed surface, not server handlers, required inputs or a complete schema.
- Optional observed query-parameter names retain original record support. Omitting values does not make a raw parent capture public or establish all required parameters.
- Fiddler Everywhere live traffic uses its separate connected tool surface. Preserve existing sessions and filters, and choose the advertised session source explicitly.
- A normalized comparison of captures establishes only the compared recorded observations. Missing source coverage remains unknown.

## Preserve the record

[morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]

- Read normalized_result and cite evidence_id. Preserve authority, source selection, limitations and unknowns.
- Use retained views for a summary, section, module or stable page instead of repeating a completed producer.
- Inventory pages expose occurrences, nodes, edges and integrity contradictions. Empty selection and omitted selection have different meanings.
- Keep source_complete separate from page exhaustion. Only complete comparable evidence supports an absence/equivalence claim.
- Export a complete bundle before closing when evidence must persist. A client-truncated preview is not the retained record.

## Unknowns and finite verification

[morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]

- record_unknown names the unresolved question, missing authority/environment and supporting or contradicting Evidence.
- update_unknown requires the current revision. After a stale revision, reread rather than blindly retry.
- Artifact, function and bundle comparisons have different identity scopes. find_changed_behavior combines existing comparisons; a static difference remains a candidate rather than causal proof.
- A call path needs explicit dossiers from the same artifact/provider. An incomplete frontier cannot establish no path.
- verify_reconstruction checks a finite typed specification. A pass covers only the declared comparable claims.
- Process captures are opt-in behavioral evidence and are not a security sandbox. Distinguish root exit, descendant settlement, finalization and recorded exit status; follow the connected contract rather than inferring successful completion from one signal.

## Prove it

Each claim traces to an original record or Evidence ID, names its coverage and inference boundary, and preserves unresolved questions. No historical URL was replayed merely to inspect a capture, no partial preview was treated as complete, and finite verification was not described as global equivalence. [morluto/rea, reverse-engineer-anything/references/evidence-workflows.md]
