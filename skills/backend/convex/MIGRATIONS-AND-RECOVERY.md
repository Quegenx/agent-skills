# Migrations and recovery

These workflows come from [get-convex/agent-skills, convex-migrate, convex-migrate-rehearse, convex-backup, convex-seed], with official deployment/export rules. Persisted data changes require an explicit migration and a chosen target.

## Expand, migrate, tighten

- **Keep callers compatible while data changes.** Expand the schema, update readers/writers for the transition, migrate old records in resumable batches, verify the result and only then tighten the schema or remove the obsolete path. Do not delete valid persisted data to make validation pass. [get-convex/agent-skills, convex-migrate; repository AGENTS.md]
- **Use the migration component's current contract when already selected.** Inspect installed configuration, migration references, batch behavior and progress before running it. A failed or interrupted migration must have an understood resume path, not an assumption that rerunning starts safely. [get-convex/agent-skills, convex-migrate; https://www.convex.dev/components/migrations]
- **Keep seed data and real snapshots distinct.** Bound seed operations to their chosen deployment and handle sensitive records according to their source; a seed success does not prove compatibility with production-shaped data. [get-convex/agent-skills, convex-seed, convex-migrate-rehearse]

## Rehearsal and snapshots

- **Name snapshot source and restore target explicitly.** Export defaults to development unless an explicit selector or scoped credential selects another deployment. The rehearsal source announced production while using a bare export recipe; that could validate the wrong dataset. Inspect the effective target before exporting and before importing. [https://docs.convex.dev/cli/reference/export]
- **Rehearse the pre-change schema and compatible callers first.** Import the selected snapshot into the chosen isolated target, deploy the change to that same preview and inspect the migration's actual record results. Changing previews between steps invalidates the rehearsal. [get-convex/agent-skills, convex-migrate-rehearse]
- **Preview availability and expiry are plan-specific.** Current docs describe five-day expiry for Free/Starter and fourteen days for Professional/Business/Enterprise; preview creation requires a preview deploy key. The source called previews paid-only and treated roughly five days as universal. [https://docs.convex.dev/production/hosting/preview-deployments; https://docs.convex.dev/cli/reference/deploy]

## Recovery contract

- **Choose recovery point and retention before a restore.** State which snapshot is available, whether storage files are included and what writes occurred after it. Restoring an earlier snapshot can lose post-snapshot data; a successful import is not proof that the application recovered correctly. [get-convex/agent-skills, convex-backup]
- **Verify records and critical application reads after recovery.** Compare the promised data invariants using the actual restored target, schema and callers; keep secrets and private data out of reports. Destructive import/restore and deployment remain subject to the user's authorization. [get-convex/agent-skills, convex-backup, convex-migrate-rehearse; user standing rules]

## Prove it

The plan names source, target, snapshot time, included storage, retention and possible lost writes. The migration has compatible callers, bounded resumable batches, record-level verification and a final tightening step. Rehearsal and restore evidence belongs to the exact chosen deployment; record any unperformed drill instead of claiming recovery readiness. [get-convex/agent-skills, convex-migrate, convex-backup]
