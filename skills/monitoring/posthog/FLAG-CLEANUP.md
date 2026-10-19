# Flag Cleanup

Keeping a PostHog project's flags and experiments healthy after they ship: removing stale flags from code, copying flags between projects, finding who deleted a flag and when, and auditing flags and experiments for correctness and waste. All of it runs through the PostHog MCP tools. Writing flag code is [FEATURE-FLAGS.md](FEATURE-FLAGS.md) and [FLAG-EVALUATION.md](FLAG-EVALUATION.md); experiment design is [EXPERIMENTS.md](EXPERIMENTS.md); SDK setup is [SETUP-WEB.md](SETUP-WEB.md). The rule that decides most outcomes is order: code first, deploy, and only then change the flag in PostHog. Archiving or disabling a flag while deployed code still checks it makes that code path silently stop working.

**Contents:** [Removing stale flags](#removing-stale-flags) · [Copying flags across projects](#copying-flags-across-projects) · [Finding deleted flags](#finding-deleted-flags) · [Auditing flags and experiments](#auditing-flags-and-experiments) · [MCP tools](#mcp-tools) · [Prove it](#prove-it)

## Removing stale flags

### What counts as stale

- **Usage-based:** the flag has a `last_called_at` but hasn't been evaluated in 30+ days. Local evaluation or disabled exposure capture can hide real use.
- **Configuration-based:** `last_called_at` is null, the flag is 30+ days old and 100% rolled out (a boolean at 100% with no property filters, or a multivariate flag with one variant at 100%).
- **Disabled flags (`active: false`) are not stale.**
- **Stale is a candidate, never proof of safety.** A flag at 100% with no targeting has done its job and keeps making billable `/flags` requests; remove it and hardcode the winning path, or at least archive it.

### Find candidates

- **A named flag:** `posthog:feature-flag-get-definition-by-key` returns its id and definition.
- **Otherwise:** `posthog:feature-flag-get-all` with `active: "STALE"`. A page holds at most 100; `count` is the total; page with `offset` for a full audit.
- **A shape the filter misses:** a flag with no release conditions that was never called. The server matches empty `filters` only as null or `{}`, not `{"groups": []}`.

### Four reads per candidate (run in parallel)

| Tool | What it tells you |
|---|---|
| `posthog:feature-flags-status-retrieve` | Status, `reason`, `rollout` { `effectively_full_rollout`, `has_targeting_conditions`, `max_rollout_percentage`, `is_multivariate` } |
| `posthog:feature-flag-get-definition` | `experiment_set`, surveys, early access, replay settings, variants, filters, `payloads`, `evaluation_runtime`, `evaluation_contexts` |
| `posthog:feature-flags-dependent-flags-retrieve` | Flags that depend on this one |
| `posthog:scheduled-changes-list` with `model_name: "FeatureFlag"`, `record_id` | Pending scheduled changes |

### Exclusions (no overrides)

- **Linked to an experiment;** used by a survey, early access, session replay or remote config.
- **Kill switches and tier gates.**
- **Disabled, archived or deleted.**
- **Created or updated within 30 days,** including metadata-only updates.
- **Scheduled to change.**
- **Depended on by active flags.**
- **Product tours** can link a flag with no read tool reporting it: ask the user and wait for the answer.

### Decide which path to keep (from `rollout`)

| State | Signals | Keep |
|---|---|---|
| Fully rolled out boolean | `effectively_full_rollout: true`, `is_multivariate: false`, `has_targeting_conditions: false`, `max_rollout_percentage` 100 | The enabled path |
| Fully rolled out multivariate | One variant at 100% | The winning variant: the first fully rolled-out condition's `variant` override first, else the 100% variant. Stop if they differ. Never take it from `reason` |
| Effectively off | `max_rollout_percentage` 0 or null with no conditions (reports `effectively_full_rollout: true` but evaluates false) | The disabled path |
| Partial or ambiguous | Anything else, including holdouts, super groups, early-exit conditions, flag dependencies | No edits |

- **Narrowed scope:** if `evaluation_runtime` is `server` or `client`, or `evaluation_contexts` is non-empty, every call site you edit must be inside that scope.

### Edit the code

- **Find references** by exact key, then constants, enums and wrappers (`useFlag('...')`, `Flags.SOME_KEY`), including independently deployed directories.
- **Payload reads** (for example `getFeatureFlagPayload`) have no retained path: leave them and report them. Only payload reads, or no references at all, means a no-op.
- **Re-run the four reads** before the first edit and again before the final cleanup; compare `version`, `updated_at` and `rollout`. If anything changed, revert and restart.
- **Remove flag-specific dead code.** Keep general helpers that lost their last caller and name them in the report, except module-private helpers the linter flags.
- **Validation outcome** is Passed, Failed or Could not run; only Passed allows completing the cleanup.
- **Then change the flag in PostHog, after deploy.** Archive is the default end state (`posthog:feature-flag-archive` disables and archives and keeps history); `posthog:delete-feature-flag` soft-deletes and is for explicit requests only. The cleanup workflow itself doesn't archive: "This skill does not archive a flag, and no skill does yet."

### Handoff prompt (read-only access)

- **Interpolate a value** only if it matches `^[a-zA-Z0-9_./:-]+$`. Variant keys accept any characters up to 400, so don't interpolate them unchecked.
- **One block per flag** with the assessed state (`version`, `updated_at`, `rollout`), the product tour answer with its date, and "Assessment made on".
- **Templates** for the boolean, multivariate, effectively-off and partial cases.

## Copying flags across projects

- **Scope:** same organization only; one flag per call; up to 50 target project ids per call; success or failure reported per target.
- **Steps:**
  1. Resolve the source flag key and project. Ask; don't assume the active MCP project.
  2. `posthog:projects-get` for the target projects.
  3. `posthog:feature-flag-get-definition` for the source flag.
  4. Always `posthog:feature-flags-copy-dependencies-check` (`feature_flag_key`, `from_project`, `target_project_ids`). It returns `copied_dependency_keys`, `reused_dependency_keys` and `warnings`. `can_copy_dependencies: false` also appears when there is nothing to copy; report only non-empty `warnings`.
  5. `posthog:feature-flags-copy-flags-create`. The response has `success` and `failed` arrays.
- **Safe defaults:** `disable_copied_flag: true`, `copy_schedule: false`, `copy_dependencies: false`. Omitting `copy_dependencies` silently skips dependencies.
- **What gets remapped:** cohorts (created or reused in the target); encrypted payloads (`has_encrypted_payloads`, `is_remote_configuration`) are re-encrypted under the target's key; scheduled cohort references are remapped when `copy_schedule: true`.
- **Auth:** the API key needs explicit `feature_flag:write` (or `feature_flag:*`); keys scoped only `*` are rejected (it is an INTERNAL viewset); team-scoped keys can't reach it, so use an org-scoped or unscoped key. You need editor access on the source; targets you can't see are silently dropped; targets you can't edit land in `failed`.
- **No undo,** and a copy may overwrite a flag with the same key in the target.

## Finding deleted flags

- **`system.feature_flags` exposes a `deleted` boolean** but not `deleted_at`, `updated_at` or `last_modified_at` (asking for them fails with `Unable to resolve field`). The deletion time lives only in each flag's activity log, via `posthog:feature-flags-activity-retrieve`; there is no bulk endpoint.
- **List deleted flags** with HogQL through `posthog:execute-sql`:

  ```sql
  SELECT id, key, created_at
  FROM system.feature_flags
  WHERE team_id = <team_id> AND deleted = true
  ORDER BY created_at DESC
  LIMIT 100
  ```

  `created_at DESC` is a heuristic (deletions cluster near creation), not a guarantee.
- **Read activity in parallel:** `feature-flags-activity-retrieve {"id": <flag_id>, "limit": 5, "page": 1}`. Batch size by window: 7 days, the top 20 to 25; 30 days, 50; 90 days, about 100. In an entry with `activity == "deleted"`, `created_at` is the deletion time and `user.email` / `user.first_name` is who deleted it.
- **Tombstoned keys:** soft-deleted flags that were referenced are renamed `<original>:deleted:<flag_id>`. Strip that suffix to get the original key (mirroring `FeatureFlag.key_without_tombstone()`); don't recover it from `detail.changes` or `detail.name`.
- **Cutoffs:** compute them in UTC ("last week" is ambiguous), and surface borderline flags within about 1 hour of the cutoff.

## Auditing flags and experiments

- **Tools:** `experiment-get`, `experiment-list`, `feature-flag-get-definition`, `feature-flag-get-all`; activity checks need `feature-flags-activity-retrieve`.
- **Modes:** quick check, scoped audit, full audit. With more than 5 entities with findings, write the result to a notebook. Link entities as `[Experiment: name](/experiments/id)` and `[Flag: key](/feature_flags/id)`.
- **Phase 1 is read-only;** remediation comes after.
- **Severity mapping:** the source audit's CRITICAL, WARNING and INFO map to P1, P2 and P3 here. Category caps: Correctness up to P1; Waste, Process, Complexity and Security up to P2; Cleanup P3. [PostHog skills, FLAG-CLEANUP.md] Order findings by severity, then entity, then category (Correctness, Waste, Process, Complexity, Cleanup, Security).

### Experiment checks

| Check | Severity |
|---|---|
| No metrics | P1 |
| Secondary metrics only | P2 |
| Missing flag | P1 |
| Inactive flag | P2 |
| Deleted flag | P1 |
| Variants don't sum to 100 | P2 |
| Fewer than two variants | P1 |
| Conclusion contradicts the shipped variant (`parameters.recommended_variant`) | P2 |
| Concluded but still splitting traffic | P2 (Waste) |
| Draft older than 7 days | P3 |
| No hypothesis in `description` | P3 |
| Ended but its flag is active and splitting | P2 |
| Duration under 7 days | P2 |
| Duration 7 to 14 days | P3 |
| Running more than 30 days | P3 |
| Activity: changes before the run | P3 |
| Activity: rollout changed mid-run | P2 |
| Activity: variant added or removed mid-run | P1 |
| Activity: toggled mid-run | P2 |
| Activity: targeting changed mid-run | P2 |

### Flag checks

| Check | Severity |
|---|---|
| Boolean fully rolled out | P3 |
| `last_called_at` more than 30 days ago | P3 |
| Stale draft: inactive more than 30 days, never activated | P3 |
| Orphaned experiment flag | P3 |
| Variants don't sum to 100 | P2 |
| Dead variant at 0% on a non-experiment flag | P3 |
| Dead condition at 0% | P3 |
| Manual rollout on an experiment flag | P3 (Process) |
| Toggled more than 3 times | P2 |
| More than 20 activity entries and more than 0.5 changes per day | P2 |

### Cross-entity patterns (always P3)

- 3+ experiments with Process findings.
- 5+ flags with Cleanup findings.
- An experiment stopped with its flag still active, plus a mid-run change.

### Remediation conflict

The audit's flag checks say to delete a possibly unused flag ("If not, delete it") and to "Delete the flag" for stale drafts; the stale-flag cleanup workflow says archive rather than delete, and delete only on explicit request. Confirm in the current docs.

## MCP tools

| Tool | Job |
|---|---|
| `posthog:projects-get` | Project ids, `api_token`, region |
| `posthog:feature-flag-get-all` | List flags (`active: "STALE"`, `offset` paging) |
| `posthog:feature-flag-get-definition`, `posthog:feature-flag-get-definition-by-key` | One flag's full definition |
| `posthog:feature-flags-status-retrieve` | Status and `rollout` summary |
| `posthog:feature-flags-dependent-flags-retrieve` | Dependents |
| `posthog:scheduled-changes-list` | Scheduled changes |
| `posthog:feature-flags-activity-retrieve` | Activity log, deletions |
| `posthog:feature-flag-archive`, `posthog:feature-flag-unarchive` | Archive (disable and archive, keeps history) or restore |
| `posthog:feature-flag-disable`, `posthog:feature-flag-enable` | Toggle |
| `posthog:delete-feature-flag` | Soft-delete, explicit request only |
| `posthog:feature-flags-copy-dependencies-check`, `posthog:feature-flags-copy-flags-create` | Copy across projects |
| `posthog:execute-sql` | HogQL over `system.feature_flags` |
| `experiment-get`, `experiment-list` | Experiments for audits |

## Prove it

- Before touching a flag in PostHog, the deployed build contains the removal of its last reference.
- A search for the exact key, its constants and wrappers across every deployed directory returns only payload reads you reported, or nothing.
- The four reads re-run just before the final cleanup show the same `version`, `updated_at` and `rollout` as at assessment.
- After a copy, every target appears in `success` or `failed`, copied flags are disabled, and `warnings` from the dependency check were reported.
- For a deleted flag, the answer names the activity entry with `activity == "deleted"`, its `created_at` in UTC and the deleter.
- An audit lists every finding with a severity inside its category cap, ordered by severity, entity and category.
