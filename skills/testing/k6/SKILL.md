---
name: k6
description: "Writes, runs and maintains k6 load and performance tests: scripts for HTTP, WebSocket, gRPC and xk6 extensions, test types, executors, scenarios, thresholds and checks, k6 browser tests with Web Vitals, a full website performance suite (workflow elicitation, Playwright recording, hybrid load tests, load-generator monitoring, reporting), Grafana Cloud k6 runs managed and investigated through gcx and its API, test maintenance, k6 v2 migration and multi-run trend analysis. Use when load, stress, spike, soak, smoke or breakpoint testing a service or website, writing or fixing a k6 script, setting k6 thresholds, running or investigating Grafana Cloud k6 tests, tracking performance across runs, or upgrading scripts to k6 v2."
---

# k6

k6 runs JavaScript test scripts as load: `options` (or `options.scenarios`) set how many virtual users or iterations per second hit the system, the default export is one iteration, and `thresholds` alone decide whether the run passes (exit 0) or fails (exit 99). That makes most k6 bugs silent: a `check()` that fails without a threshold on `checks`, a threshold that passes because its metric got zero samples, a VU ramp that throttles itself as latency rises, or a load generator so busy that it measures itself. k6 is for load and performance; functional end-to-end tests are the e2e-testing skill ([e2e-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md)), always-on probing is Synthetic Monitoring in the grafana skill ([grafana SYNTHETIC-MONITORING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/SYNTHETIC-MONITORING.md)), and service instrumentation is the observability skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Writing a script: the authoring and validation workflow, rules for every script, HTTP, data, lifecycle, custom metrics, `handleSummary`, HTML, crypto, WebSocket, gRPC, xk6 extensions, jslib pins, `k6 x docs` | [SCRIPTS.md](SCRIPTS.md) |
| Test types (smoke to breakpoint), executors, open vs closed models, scenarios and `--scenario`, thresholds, checks and the zero-samples trap, exit codes, automating tests per environment | [LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md) |
| k6 browser tests: selectors, waits, consent banners, `expect()`, async checks, screenshots, Web Vitals thresholds, exploring a live site for selectors, validating | [BROWSER.md](BROWSER.md) |
| A full website suite, steps 1 to 4: eliciting workflows, the scaffold, recording with Playwright and har-to-k6, functional protocol and browser tests, assertion libraries | [WEBSITE-PERF-TEST.md](WEBSITE-PERF-TEST.md) |
| The website suite, steps 5 to 10: SLO thresholds, hybrid load tests, per-type defaults, the load-generator monitor, local vs cloud and VUh, backend investigation in Grafana, the report | [WEBSITE-LOAD-AND-REPORT.md](WEBSITE-LOAD-AND-REPORT.md) |
| Grafana Cloud k6: `options.cloud`, load zones, cloud run commands, generic automation gates, gcx auth, the API proxy and its quirks, pagination, managing tests, runs and schedules, editing cloud scripts safely, gotchas | [CLOUD.md](CLOUD.md) |
| Reading and investigating cloud runs: the investigation workflow, result vs status vs checks, the v5 metrics API, Loki logs, screenshots, Tempo traces, Insights audits, run reports | [CLOUD-RESULTS.md](CLOUD-RESULTS.md) |
| Maintaining existing tests: change control, verification classes, tightening thresholds, migrations, service changes and audits | [MAINTENANCE.md](MAINTENANCE.md) |
| Historical run trends, grouping, metric direction, headroom and script/version evidence at inflection points | [TRENDS.md](TRENDS.md) |
| Which k6 version a behavior needs: the v2.0.0 migration checklist, v1.7 to v2.3 changes, feature flags, version boundaries in trend data | [VERSIONS.md](VERSIONS.md) |

## The rules

1. **Every load test has thresholds,** at least `http_req_duration` and `http_req_failed` (or the protocol's equivalent), plus a threshold on `checks` wherever checks matter: `check()` never fails a run, and without thresholds the run cannot fail in CI.
2. **Guard against zero-sample passes:** a threshold on a metric with no samples passes, so record that the iteration completed (a completion check or an `iteration_completed` Rate) and delete thresholds on metrics nothing records.
3. **Smoke first, then larger tests;** never run a load profile with an untested script. Validate locally (`k6 inspect` for ramping and arrival-rate profiles, a single run otherwise). On k6 v2.3+ run once with `--once`, which keeps the scenario's function and browser options ([VERSIONS.md](VERSIONS.md)); on older k6 edit `iterations:` in a copy rather than passing `--iterations 1` to a scenario script.
4. **Find breakpoints by offered load:** `ramping-arrival-rate` with `abortOnFail` and `delayAbortEval`, no think time, and enough `maxVUs` that k6 reports no `dropped_iterations`.
5. **Don't trust a saturated load generator:** monitor it (minimum CPU idle under 10% makes the run inconclusive), keep browser VUs few, and use the cloud for measurement at scale.
6. **Never loosen a threshold to get a green run.** Tighten from observed data with 10 to 20% headroom; loosen only when the user asks, and record it.
7. **Read before you write in Grafana Cloud k6:** GET and back up before any PUT, verify script PUTs by sha256 and other mutations by re-GET, paginate run lists newest first, and investigate past runs with their bundled script snapshot.
8. **Treat behavioral edits as proposals:** threshold, scenario, URL, check and `sleep()` changes go to the user as a diff with a rationale; only syntactic cleanups apply directly.

## Prove it

The script validates with the command its type requires; a deliberately broken request makes the run exit 99; the summary shows every threshold with samples behind it; the load generator's minimum CPU idle stayed above 10% for any run you report; every cloud mutation was verified by re-GET or sha256; and each file's own Prove it checks pass for the parts you touched.
