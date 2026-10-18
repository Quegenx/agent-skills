# Maintaining tests and reading trends

Existing k6 tests need five kinds of upkeep (tightening thresholds, migrating to a new k6 version, adapting to service changes, refactoring, auditing against best practices), and their run history answers whether performance is drifting. The core is change control: syntactic edits apply directly, behavioral edits (anything that changes what the test measures or when it fails) are proposed as a diff and confirmed, and every change is verified in proportion to its risk. New tests start in [SCRIPTS.md](SCRIPTS.md) or [BROWSER.md](BROWSER.md); a single run's deep dive is [CLOUD-RESULTS.md](CLOUD-RESULTS.md).

**Contents:** [Change control](#change-control) · [Verifying a change](#verifying-a-change) · [Tightening thresholds](#tightening-thresholds) · [Version migration](#version-migration) · [Service changes](#service-changes) · [Refactoring and audits](#refactoring-and-audits) · [Trend analysis](#trend-analysis) · [Prove it](#prove-it)

## Change control

- **Syntactic changes apply directly:** renames, `let` to `const`, removing unused imports, comments, formatting.
- **Behavioral changes are proposed** as a diff with the rationale and need confirmation: threshold values, adding `sleep()`, URLs, checks, scenarios, new thresholds. If in doubt, treat it as behavioral.
- **The loop for every edit:** `k6 inspect <script>` (plus mcp-k6 `validate_script` if available); a local smoke `k6 run --once <script>` on k6 v2.3+ (`k6 run --vus 1 --iterations 1 <script>` for non-browser scripts on older k6); classify the change; verify it per the matrix below; push cloud scripts through the safe-edit recipe ([CLOUD.md](CLOUD.md#editing-a-cloud-script-safely)).
- **Browser scripts can't be smoked without a browser:** use `k6 inspect` or `validate_script`. `--iterations` doesn't tune a scenario-based config, it replaces its scenarios and drops their `exec` and browser options; from v2.1.0 a lone `--vus` does the same with a warning (before, it was silently ignored, which is what this line used to say; see [LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md#scenarios)). For a smoke, use `--once` on k6 v2.3+ (`--scenario a,b --once` for several scenarios); on older k6 edit `iterations:` in a local copy (`--scenario`, needed to run a temporary `smoke` scenario alone, also arrived in v2.3.0).
- **`k6 x docs` serves the installed version's docs,** which may lag the version you're migrating to.

## Verifying a change

- **Class A** is declarative configuration only (for example `p(95)<500` to `p(95)<420`). **Class B** is runtime logic, or `scenarios.*.vus`, `iterations`, `duration` or `executor`. Migration edits are Class B.

| Change | Verify with |
|---|---|
| Class A, any duration | sha256, `k6 inspect`, and a historical pass/fail prediction |
| Class B, short test (under 5 min) | sha256, `k6 inspect`, and a full cloud run |
| Class B, long test (5 min or more) | sha256, `k6 inspect`, a local 1-iteration smoke, and a cloud smoke of a local copy (`k6 cloud run --once script.js` on k6 v2.3+, which keeps scenario and browser options; `k6 cloud run --vus 1 --iterations 1 script.js` on older k6 replaces the scenarios); PUT only after the cloud smoke passes |

- **`POST /start` accepts no runtime overrides:** a saved test always runs as defined for its full duration, which is why long Class B changes are smoked from a local copy.
- **Class A prediction:** query the metric across the last N runs with the multi-run aggregate endpoint, using the same method as the threshold, and tabulate `| Run | Observed p95 | < 500 (old) | < 800 (new) |`. Soft-warn when the headroom over the observed peak is small. Loosen only when the user asks, and show which past failing runs the loosening would hide.

## Tightening thresholds

- **Report** the current value, the proposed value, the observed justification ("P95 is currently 380ms, proposing p(95)<450 to give 18% headroom") and the downstream impact (`abortOnFail`, CI gates, SLOs). Tightening an `abortOnFail` threshold makes runs abort earlier; warn the user.
- **Recommendations only tighten,** never loosen unless asked. Target 10 to 20% headroom above the recent P95, using the second-half mean as the baseline. Headroom above 100% may be intentional. Consider per-endpoint thresholds on tags, for example `http_req_duration{name:homepage}`.

## Version migration

- **Look for** deprecated imports, removed or renamed APIs, and option format changes (for example `ext.loadimpact` to `cloud`, which stopped working entirely in v2.0.0).
- **Upgrading to k6 v2:** walk the [v2.0.0 migration checklist](VERSIONS.md#v200-migration-checklist): `externally-controlled`, `k6 cloud script.js`, a stack for every `k6 cloud` command, `--no-summary`, `k6/experimental/redis`, `browser_web_vital_fid`, cloud exit code `97`, the REST API off by default, and the OpenTelemetry option renames. Each is a Class B change.
- **WebSocket imports:** the maintenance workflow's example migrates `k6/ws` to `k6/experimental/websockets`, but the k6 skill and its WebSocket example say both are deprecated and the target is `k6/websockets`.
- **Browser deprecations:** `waitForNavigation`, `networkidle`, `type()` instead of `fill()`.

## Service changes

| Service change | Script impact |
|---|---|
| Endpoint URL changed | Update the URL (simple) |
| Response field renamed | Update the checks (moderate) |
| New required header or parameter | Moderate |
| Auth mechanism changed | Rewrite the auth (complex) |
| Response schema restructured | Complex |
| Endpoint removed or replaced | Complex |

## Refactoring and audits

- **Refactors:** auto-apply the syntactic fixes; propose the behavioral ones (adding `try/finally`, restructuring scenarios, changing group boundaries, reordering) in the report. The output script contains only the syntactic fixes.
- **Look up the docs before auditing** (not optional): `k6 x docs using-k6-browser/recommended-practices`, `k6 x docs javascript-api k6-browser page`, `k6 x docs javascript-api k6-browser locator`.
- **Audit checklist:**
  - Thresholds and assertions: thresholds defined (at minimum `http_req_duration` and `http_req_failed` for HTTP tests); `check()` or `expect()` on every response; thresholds realistic for the test type.
  - Load design: `sleep()` present in load tests (required for realistic think time); executors appropriate for the test type; a reasonable VU and iteration count.
  - Resource management: browser tests use `try/finally` with `page.close()` in `finally`; gRPC tests call `client.close()` after each iteration; file handles and connections closed.
  - Code quality: `const` instead of `let`/`var` at module level; no deprecated imports; no hardcoded secrets (use `__ENV` or environment variables); `SharedArray` for test data files.
  - Browser-specific (the script imports `k6/browser`): `getBy*` APIs instead of generic `page.locator()` where possible; no `waitFor()` before interactions; no `waitForLoadState()` after navigation; `page.waitForTimeout()` instead of `sleep()`.
- **Audit report format:** Passed / Needs attention (behavioral) / Auto-applied (syntactic), each item citing its doc page.

## Trend analysis

Multi-run trends for one load test. Not for deep-diving one run, editing scripts, creating them, or querying service metrics directly (hand those to backend investigation, [WEBSITE-LOAD-AND-REPORT.md](WEBSITE-LOAD-AND-REPORT.md#investigating-the-backend)).

- **Window:** the last 30 days by default; widen if there are fewer than 5 runs; ask if there are more than 200. Fewer than 3 usable runs: a trend isn't meaningful. Exclude aborted and timed-out runs by default. List tests with `gcx k6 tests list`.
- **Method per type:** trend `histogram_quantile(0.95)` (P95), `histogram_quantile(0.5)`, `histogram_avg`, and query P50, P90, P95 and P99; counter `increase`; rate `ratio`; gauge `max`.
- **Group by default:** `browser_web_vital_*` (LCP, FCP, CLS, TTFB, INP; FID only in runs before k6 v2.0.0, which removed `browser_web_vital_fid`) `by (url)`; `http_req_duration`, `http_req_failed`, `http_reqs` `by (name, status)` when requests are tagged with `name`, else `by (url, status)`; `iteration_duration` `by (scenario)`; custom trends `by (<tag>)`. Discover labels through the labels endpoints rather than assuming them from the script. Batch run IDs in groups of 50 when URLs get too long.

```bash
gcx --context <ctx> api "/api/plugins/k6-app/resources/cloud/cloud/v5/load_tests/$LT/query_aggregate_k6(query='histogram_quantile(0.95)',metric='http_req_duration',test_run_ids=[$IDS])" -o json
```

- **Metric types can collide across runs:** the latest run's type wins and aggregations using the older type's method silently break.

| Classification | Rule |
|---|---|
| Degrading | Second-half mean worse than the first half by more than 10% |
| Improving | Better by more than 10% |
| Stable | Within 10% |
| Volatile | Standard deviation above 25% of the mean |
| Anomaly | A run more than 2 standard deviations from the mean |

- **Formulas:** baseline is the oldest run or the mean of the first 3 runs. Rate of change `((recent_mean - baseline_mean) / baseline_mean) * 100 / weeks_in_window`. Headroom `((threshold_value - current_value) / threshold_value) * 100`: Comfortable above 50%, Adequate 20 to 50%, Thin under 20%, Breached under 0%. `weeks_until_breach = headroom_absolute / rate_of_change_per_week` is a rough projection. For rate metrics, "degrading" means decreasing.
- **Overall health** is Healthy, Watch, Degrading or Critical, taken from the worst-case metric.
- **Inflection points:** sha256-diff the run-bundled scripts (`/cloud/v6/test_runs/{id}/script`) on either side of the change. Different scripts: split the history into eras. Same script: the regression is external, unless the k6 version changed across a boundary that shifts the numbers ([VERSIONS.md](VERSIONS.md#version-boundaries-in-trend-data)); split there too.
- **Load generator resources trending up** (`load_generator_cpu_percent`, `load_generator_file_handles`) can mean the test is outgrowing its load generator, not that the service is degrading.
- **When the service has no observability,** correlate client-side: Tempo traces for browser tests; for protocol tests compare `http_req_duration by (name, status)` and `http_req_failed by (name, status)`, and split `http_req_waiting` (server time) from `http_req_receiving` (transfer). Latency up with payload up suggests a content change; latency up with payload stable, a processing change; an intermittent payload, a flaky cache or an A/B test.

## Prove it

- Every behavioral change was shown as a diff and confirmed before it shipped; syntactic ones are listed as auto-applied.
- Each change has the verification its class and duration require, ending with matching sha256 sums for cloud scripts.
- A tightened threshold comes with a table of recent runs showing which would have passed and failed under old and new values.
- A trend verdict states the window, the number of usable runs (at least 3), the exclusions, and the script-hash comparison at any inflection point.
