# Maintaining k6 tests

Existing k6 tests need five kinds of upkeep (tightening thresholds, migrating to a new k6 version, adapting to service changes, refactoring, auditing against best practices). Their run history is interpreted in [TRENDS.md](TRENDS.md). The core is change control: syntactic edits apply directly, behavioral edits (anything that changes what the test measures or when it fails) are proposed as a diff and confirmed, and every change is verified in proportion to its risk. New tests start in [SCRIPTS.md](SCRIPTS.md) or [BROWSER.md](BROWSER.md); a single run's deep dive is [CLOUD-RESULTS.md](CLOUD-RESULTS.md).

**Contents:** [Change control](#change-control) · [Verifying a change](#verifying-a-change) · [Tightening thresholds](#tightening-thresholds) · [Version migration](#version-migration) · [Service changes](#service-changes) · [Refactoring and audits](#refactoring-and-audits) · [Prove it](#prove-it)

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

- **Report** the current value, the proposed value, the observed justification ("P95 is currently 380ms, proposing p(95)<450 to give about 15.6% headroom against the threshold") and the downstream impact (`abortOnFail`, CI gates, SLOs). Tightening an `abortOnFail` threshold makes runs abort earlier; warn the user.
The source called the 380ms-to-450ms example 18% headroom. Using its threshold-based definition gives `(450 - 380) / 450 * 100`, about 15.6%; dividing by 380 instead measures uplift over the observation. The canonical formula and upper-bound scope are in [TRENDS.md](TRENDS.md#trend-analysis). [existing MAINTENANCE-AND-TRENDS.md; arithmetic recomputation]

- **Recommendations only tighten,** never loosen unless asked. The maintenance source targets 10 to 20% above the recent P95, using the second-half mean as the baseline, and says "Headroom above 100% may be intentional." That observation-based uplift convention differs from the [canonical threshold-based headroom](TRENDS.md#trend-analysis), which cannot exceed 100% for nonnegative latency and a positive threshold. Label the denominator when reporting either view. Consider per-endpoint thresholds on tags, for example `http_req_duration{name:homepage}`. [existing MAINTENANCE-AND-TRENDS.md, Tightening thresholds and Trend analysis]

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
  - Load design: follow the [load-model-specific think-time rule](SCRIPTS.md#rules-for-every-script), with the intended executor, VU pool and iteration count. The old checklist required sleep in every load test; arrival-rate executors already pace iteration starts and need no trailing sleep. [https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/]
  - Resource management: browser tests use `try/finally` with `page.close()` in `finally`; gRPC tests call `client.close()` after each iteration; file handles and connections closed.
  - Code quality: `const` instead of `let`/`var` at module level; no deprecated imports; no hardcoded secrets (use `__ENV` or environment variables); `SharedArray` for test data files.
  - Browser-specific (the script imports `k6/browser`): `getBy*` APIs instead of generic `page.locator()` where possible; no `waitFor()` before interactions; no `waitForLoadState()` after navigation; `page.waitForTimeout()` instead of `sleep()`.
- **Audit report format:** Passed / Needs attention (behavioral) / Auto-applied (syntactic), each item citing its doc page.

For this workflow, read [TRENDS.md](TRENDS.md). [existing skills/monitoring/k6/MAINTENANCE-AND-TRENDS.md]

## Prove it

- Every behavioral change was shown as a diff and confirmed before it shipped; syntactic ones are listed as auto-applied.
- Each change has the verification its class and duration require, ending with matching sha256 sums for cloud scripts.
- A tightened threshold comes with a table of recent runs showing which would have passed and failed under old and new values.
