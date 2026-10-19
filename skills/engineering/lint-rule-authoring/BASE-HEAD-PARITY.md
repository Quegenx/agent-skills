# Base and head parity: run a checker on both sides and diff its output

When a change touches a checker (a lint rule, a detector, an evaluator) the question is whether the change made the checker's output worse, and the answer is a differential run: the checker at the pull request's base commit and at its head commit, over the same pinned inputs, with the two outputs diffed. Source: [React Doctor, run-parity], React Doctor's own skill and scripts for comparing its diagnostics on a pull request (`compare-parity.mjs`, `find-impacted-rules.mjs`, `baseline-cache-provenance.mjs`, `verify-matrix-artifact.mjs`, `compare-parity-performance.mjs`, `validate-parity-input.jq` and their tests). Their evaluator flags, corpus and report schema are left out; the method is kept. Resolving the reviewed range and its blast radius for reading is [code-review CHANGE-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md); this file is the run-it-twice version for deciding what changed in a tool's output.

**Contents:** [Pin both sides](#pin-both-sides) · [Run the pair](#run-the-pair) · [Canonical identity](#canonical-identity) · [Coverage before diagnostics](#coverage-before-diagnostics) · [Exit codes](#exit-codes) · [Scope by import trace](#scope-by-import-trace) · [Cached baselines](#cached-baselines) · [Slowdown thresholds](#slowdown-thresholds) · [Running it in Vercel Sandbox](#running-it-in-vercel-sandbox) · [Testing the comparator](#testing-the-comparator) · [Prove it](#prove-it)

## Pin both sides

Source: [React Doctor, run-parity].

- **Resolve to commits, never branch names.** "Use the returned commit hashes, not branch names."

```sh
gh pr view <pr-number-or-url> \
  --json number,url,baseRefOid,headRefOid,headRepository,headRepositoryOwner
```

- "Derive the base repository from the pull request URL. Derive the head repository from `headRepositoryOwner.login` and `headRepository.name`." That is what makes a fork's head runnable, not only diffable ([code-review CHANGE-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#pull-requests) reads `baseRefOid` for the diff).
- **Pin the inputs as well as the tool.** Every target record carries an org, a name, a 40-character `ref` and a `rootDir`; unpinned refs such as `HEAD` or `main` are rejected. "The baseline records resolved repository hashes. Reusing the baseline as the candidate corpus prevents default branches from moving between runs." The head run reads the baseline's own output as its list of targets.
- **A path inside a record is untrusted input.** `rootDir` must be non-empty, relative, already normalized (`posix.normalize(x) === x`), not `..` or under `../`, and free of shell metacharacters (`"`, `'`, backtick, `$`, `;`, `&`, `|`, `<`, `>`, backslash) and of CR or LF.
- **Keep the run directory.** "Create `tmp/parity-pr-<number>-<head-short-sha>` and preserve it after the run."
- **Stream-validate the baseline before the head run** with a `jq` program that uses `reduce inputs`, so memory stays flat; empty input, a duplicate project or one bad record fails it. "This rejects unpinned repositories, evaluation errors, malformed reports, and incomplete projects without loading the NDJSON corpus into memory."

```sh
jq -e -n -f validate-parity-input.jq <run-directory>/baseline.ndjson >/dev/null
```

- "If the baseline command exits non-zero or the check fails, inspect its failed records and stop."

## Run the pair

Source: [React Doctor, run-parity].

- **Both sides finish, or there is no comparison.** "Require both commands to exit zero and report 100% completion. Otherwise, report the failed projects and stop the comparison."
- **Paired runs share one machine, not one workspace.** "Paired sandboxes fetch each target repository once into one object store, then scan isolated base/treatment target worktrees with isolated detector installs, config files, and report paths."
- "A project pair is emitted only after both sides succeed, so retries cannot leave a partial successful pair in either output. Paired writes use one single-writer queue and roll the baseline back if either sink fails. Any nonzero paired evaluator run still makes both output artifacts invalid and non-reusable; discard them instead of feeding them to the comparator or cache."
- **Timing evidence needs the two sides run one after the other.** Sequential execution is "for the controlled sequential benchmark and the performance comparison"; parallel "only for diagnostic-only parity where timing evidence will be discarded". "A full-versus-scoped shadow run remains valid diagnostic evidence but not performance evidence." Lanes that run concurrently "remain diagnostic evidence; do not feed matrix artifacts to the performance comparator."
- **Retry only what failed, at falling concurrency.** The initial run uses 200, then retries failed projects at 50, then 10 (several-PR runs: 50, 10, then 2), keeping every success. "The evaluator retries incomplete reports instead of recording them as successful."
- **A deadline budget.** "Every run keeps its hard outer timeout. Short evaluator budgets cap aggregate retry reserve at 25% of the time remaining when an attempt starts, leaving at least 75% for active work". "Each paired scan has a five-minute command cap so a small number of stuck sandboxes cannot consume the whole attempt budget".
- **Several PRs, one base.** "PRs may share that immutable baseline, but never combine their candidate heads or deltas." Each PR is an immutable descriptor with a unique safe id and its own artifact directory, and every descriptor carries the exact same group object (base commit, corpus hashes, evaluator hash, contracts). "A missing base marks successful treatments blocked rather than making an independent merge decision."

## Canonical identity

Source: [React Doctor, run-parity], `compare-parity.mjs`.

- **Rewrite every finding into one canonical object before diffing.** Paths become report-relative (`\` to `/`, `./` stripped, absolute paths resolved against the project root, related-location paths too), tags are sorted, optional fields appear only when present, and the identity is `JSON.stringify` of that object. So "overlapping workspace scans do not inflate counts and schema upgrades do not appear as diagnostic churn", and the same finding under `/workspace/target` and `C:\workspace\target` is one finding.
- **Every semantic field is part of identity:** help text, category, tags, title, URL, span length, related locations and fix group. A change to any of them counts as one removed plus one added.
- **Count, don't dedupe.** Per identity, `matching = min(base, head)` and the rest are added or removed: two on base and four on head is +2. The scoped comparator "preserves duplicate multiplicity".
- **Byte-identical output whatever the input order.** Sort added and removed by project key, identity and JSON; sort skipped projects; sort the per-rule summary by count, then name. Its test feeds records and diagnostics in reverse and asserts the same stdout.
- **Locale-free sorting.** Compare strings by code unit (`a < b`), never `localeCompare`; a test replaces `String.prototype.localeCompare` with one that throws to prove it is never called.
- **Stream large runs.** "The comparator streams both NDJSON inputs, stages baseline records in the system temporary directory, and writes large detail arrays incrementally." Each baseline record is staged as one file per project and deleted when its head partner arrives; leftovers are "missing candidate", a duplicate project key on either side is a hard error, and writes honor `stdout` backpressure (`drain`). "Leave temporary-disk and output capacity proportional to the run size."

## Coverage before diagnostics

Source: [React Doctor, run-parity].

- **An absent result is not a clean result unless coverage proves the thing was looked at.** Each project gets a coverage fingerprint (directory, package root, framework, the sorted list of analyzed files and their counts). A head run that silently drops a zero-hit file or a zero-hit project is "coverage differs", which is invalid input, never "no new diagnostics". A different file order is fine.
- **Validate completeness, not just shape:** `ok === true`, `error === null`, at least one project, every project complete, no skipped checks or skip reasons, scanned file count equal to analyzed file count, and the stored summary equal to the counts recomputed from the diagnostics. "The comparator validates both inputs again and exits with invalid-input status if either side contains an evaluation error, a malformed report, a missing completion marker, or a partial legacy report."
- The same rule for a scanner's "no findings" in one change is in [code-review SCANNER-TRIAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md#when-a-scan-may-be-called-clean).

## Exit codes

Source: [React Doctor, run-parity].

- "`0`: diagnostics match"
- "`1`: comparison succeeded with diagnostic changes"
- "`2`: inputs are incomplete or invalid"

Invalid evidence outranks a diff: any skipped project forces `2` even when differences exist. "For exit code `1`, inspect affected source locations before classifying changes."

**The report:** a summary (base, head, compared and skipped projects, base and head diagnostic totals, added, removed, unchanged), added and removed counts per rule, the full added and removed lists, and each skipped project with each side's error, plus one stderr line, `Parity: +A -R, unchanged U, skipped projects S`. The human report gives "the pull request URL, commit hashes, compared and skipped project counts, diagnostic totals, added and removed counts, largest rule deltas, and artifact paths."

## Scope by import trace

Source: [React Doctor, run-parity], `find-impacted-rules.mjs`. When only some checks changed, run only those, but decide that mechanically and fall back to the full run on any doubt. [code-review CHANGE-SCOPE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/CHANGE-SCOPE.md#blast-radius) expands one hop by hand for reading; this is the transitive version for deciding what to run.

1. **List changed paths both ways,** `git diff --name-only -z` base to head and head to base, unioned; docs, changesets, tests and snapshots are ignored.
2. **Build the runtime import graph of both trees** from `git ls-tree` and `git show`, never the working tree, with the TypeScript parser: static imports (type-only imports excluded), `import x = require()`, `export ... from`, dynamic `import()` and `require()`, side-effect imports, `.js` resolved to `.ts`/`.tsx`, extensionless and `index.*` paths, JSON modules.
3. **Walk reverse dependencies** from each changed file to the check files that reach it, then add known interaction groups (checks whose results affect each other).
4. **A fingerprint per check:** sha256 over a version tag plus the path and contents of every file it imports transitively, sorted, on both sides. Equal fingerprints mean its code did not change.
5. **Incremental only with zero fallback reasons.** Each of these sends the run to full, with the reason recorded: a non-literal dynamic import, an unresolved relative module, a parse failure, a duplicate check id, a changed file that maps to no check, a shared utility also reached by a global host module, a global runtime, config, report or registry change, a security-scan check, a removed or renamed check id, a check with cross-check suppression. "A manifest with no runtime rule impact uses full mode; never construct an empty incremental rule scope." A file-only rename that keeps the id stays incremental.
6. **The scoped compare rejects output outside its scope.** It filters the full baseline to the changed checks plus an always-on invariant set (parser and environment checks stay in every scope) and fails on a head finding outside it, instead of ignoring it.
7. **Regenerate before trusting a manifest.** "Before Vercel Sandbox starts, the matrix runner fetches the pinned base and head commits, reruns the current generator, and requires byte-identical manifest output."
8. **Shadow the shortcut before it gates.** "Until incremental parity has enough shadow history to become a required gate, run one full candidate at the exact same head/corpus/concurrency policy and require its rule-filtered output to match the scoped candidate exactly. Report measured wall time and project latency; do not project a speedup from samples."

A test-selection shortcut fails toward running more.

## Cached baselines

Source: [React Doctor, run-parity], `baseline-cache-provenance.mjs`, `verify-matrix-artifact.mjs`.

- **The cache key is everything that could change the output.** "Cache a successful baseline only under its exact React Doctor commit, corpus manifest hash, evaluator schema, and ruleset/config hash." Every record is stamped with its producer (repository, commit, config contract, rule-set hash, rule keys, evaluator source hash). "Never cache an older unstamped run."
- **A provenance file next to the artifact** records its sha256, byte length, record count, the corpus manifest's sha256, a project-set sha256 (over sorted canonical tuples, so manifest order does not matter) and the producer.
- **Verify on every reuse.** "Verification streams the raw NDJSON bytes, requires full-baseline `ruleKeys: []`, checks every record's producer, and independently requires the exact pinned corpus project set to match its manifest. Any mismatch is a cache miss." One appended space in the NDJSON fails it; so does a different producer in the second record.
- **Exact key sets.** Every provenance and descriptor object has exactly the expected keys; an added field fails as "unexpected fields". "Treat each published treatment directory as self-contained evidence." "Never follow a shared cache or scoped-base source path from provenance".
- **Tamper tests assume an adversary who rehashes:** an artifact truncated and then rehashed still fails on record count, a matching pair rebound to another project set fails on project set, and a producer outside the descriptor fails. A verifier checks meaning, not only digests.
- **Write once.** Provenance is written to `<path>.tmp` with flag `wx` (fail if it exists) and then renamed; "The baseline output path is created exclusively and never overwrites an existing artifact."
- **Many comparisons of one artifact:** a hash tree per project and rule bucket, then per rule, then the whole run. "Equal whole-run roots stop immediately. Differing roots descend through rule hashes and then project buckets. Empty project/rule buckets are explicit, and scope or coverage metadata drift fails closed." Use it only "when the same baseline or candidate will be compared more than once".

## Slowdown thresholds

Source: [React Doctor, run-parity], `compare-parity-performance.mjs`.

Preconditions, or exit `2`: complete reports, identical project coverage, rule scope, config contract and evaluator source on both sides, and a paired sequential run, "so base and candidate share the same Vercel Sandbox sandbox without competing for CPU".

| Threshold | Value |
|---|---|
| Ignore a project whose base scan is under | 1,000 ms |
| A project regresses when it is slower by both | a ratio of at least 1.5 and at least 2,000 ms |
| The whole run regresses only with | at least 10 eligible projects, a ratio of at least 1.2 and at least 10,000 ms of aggregate added time |

It reports the median and p95 per-project ratio (nearest-rank percentile) and echoes the thresholds in its output. Exit `0` within thresholds, `1` a project or aggregate regression, `2` invalid evidence. Its tests: 10 s to 16 s fails; 0.5 s to 2 s is ignored as too small; ten projects each 25% slower fail on the aggregate though none fails alone. "Inspect the emitted measurements before attributing a cause."

Two views, each under its own conditions: [performance-and-caching MEASURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#deterministic-counts-and-ratchets) prefers deterministic counts for a CI gate because milliseconds are too flaky; run-parity gates on wall clock only from paired sequential runs with a ratio and an absolute floor together, a minimum base duration and a minimum project count.

## Running it in Vercel Sandbox

The source runs each pair in Vercel Sandbox microVMs. Checked against [vercel.com/docs/sandbox](https://vercel.com/docs/sandbox); where the source differs, the documented form is written here and the source's line follows.

- **Authentication** ([concepts/authentication](https://vercel.com/docs/sandbox/concepts/authentication)): OIDC locally with `vercel link` and `vercel env pull`, which writes `VERCEL_OIDC_TOKEN`; "The token expires after 12 hours, so run `vercel env pull` again if you see authentication errors." Where OIDC is unavailable, "such as in external CI/CD systems", set `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` and `VERCEL_TOKEN` and pass them to `Sandbox.create({ teamId, projectId, token })`. The source also accepts `VERCEL_ORG_ID`, which the Sandbox page does not name; use `VERCEL_TEAM_ID`.
- **Resources** ([pricing and quotas](https://vercel.com/docs/sandbox/pricing)): `resources.vcpus` is the "Number of vCPUs (2048 MB RAM per vCPU). Defaults to 2.", "Each vCPU includes 2 GB of memory", so the source's four cores and eight GiB match a 4-vCPU sandbox. Maximum vCPUs per sandbox: Hobby 4, Pro 8, Enterprise 32. Disk: "Each sandbox created with Sandbox SDK 3.0.0 or above, or from a custom image, is automatically provisioned 64 GB of ephemeral NVMe storage. Sandboxes created with runtimes (deprecated) receive 32 GB." The source's "twenty GiB of disk" is its own requirement, not a Sandbox parameter.
- **Timeout:** "The default timeout is 5 minutes. You can configure this using the `timeout` option when creating a sandbox, and extend it using `sandbox.extendTimeout()`." Maximum session duration: Hobby 45 minutes, Pro and Enterprise 24 hours.
- **Documented limits:** concurrent sandboxes Hobby 10, Pro and Enterprise 10,000. vCPU allocation is a rate: Hobby starts at 20 vCPUs per minute (maximum 40); Pro and Enterprise start at 150, ramp by 500 per minute, maximum 5,000. "Control plane operations such as running commands or reading files use a fixed per-minute quota instead of a dynamic quota." "Deleting a sandbox, snapshot, or drive is limited to 20 requests per second per team on all plans." The source's creation cap of 20, its concurrency of 50 ("below the observed capacity ceiling for four-core sandboxes") and 200, and its "400-CPU envelope" are its own settings, not documented limits.
- **Cleanup by tag** ([SDK reference](https://vercel.com/docs/sandbox/sdk-reference)): `Sandbox.create()` takes `tags`, "Up to five key-value tags"; `Sandbox.list()` takes `tags` to "Filter by a single tag", and its result is async-iterable, auto-paginating. The source's paired and sequential modes share "exact evaluation-label cleanup". `persistent` "Defaults to `true`" and auto-snapshots the filesystem on stop.
- **The pinned target:** "Pass `source.depth` when cloning large repositories to shorten setup time." The source instead fetches each target once into one object store and adds a worktree per side.

## Testing the comparator

Source: [React Doctor, run-parity], `*.test.mjs`. Each script is driven as a CLI subprocess (`spawnSync(process.execPath, [script, ...])`) with temp files from `mkdtemp` removed in `finally`, asserting the exit code and the parsed stdout; impact tests build a throwaway git repository with two commits per scenario; each rejection is one row of a mutation table (`for (const [name, mutate] of [...]) test(...)`). They run with `node --test`.

## Prove it

The run names both 40-character SHAs and the head repository; the head run read the baseline's own pinned targets; both sides reported 100% completion and identical coverage before any diagnostic was compared; the comparator exits `0`, `1` or `2`, with `2` winning over a diff, and its output is byte-identical when the input order is reversed; a scoped run listed zero fallback reasons and a full shadow run matched it; a reused baseline passed provenance verification in this run; a timing verdict came only from a paired sequential run with the thresholds echoed; and the run's sandboxes were cleaned up by its evaluation label.
