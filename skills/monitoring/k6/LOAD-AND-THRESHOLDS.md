# Load shapes, scenarios and thresholds

A k6 test's load lives in `options` (or `options.scenarios`), separate from the iteration logic, and its verdict lives in `thresholds`: a failed threshold ends the run with a failed status and a non-zero exit code, while `check()` alone never fails anything. Two traps recur: the load model (closed VU ramps that throttle themselves as latency rises) and from thresholds that pass because their metric has no samples.

**Contents:** [Test types](#test-types) · [Executors](#executors) · [Scenarios](#scenarios) · [Thresholds](#thresholds) · [Checks and the zero-samples trap](#checks-and-the-zero-samples-trap) · [Exit codes](#exit-codes) · [Automating performance tests](#automating-performance-tests) · [Prove it](#prove-it)

## Test types

Start with smoke tests, then progress to higher loads and longer durations. No single test type eliminates all risk, and the categories are relative to your use case. Stick to simple load patterns (ramp-up, plateau, ramp-down); avoid "rollercoaster" series where load rises and falls several times.

| Type | Load | Duration | When |
|---|---|---|---|
| Smoke | Low | Short (seconds or minutes) | When the relevant system or application code changes; it checks functional logic, baseline metrics and deviations |
| Average-load | Average production | Mid (5 to 60 minutes) | Often, to check the system maintains performance with average use |
| Stress | High (above average) | Mid (5 to 60 minutes) | When the system may receive above-average loads, to check how it manages |
| Soak | Average | Long (hours) | After changes, to check the system under prolonged continuous use |
| Spike | Very high | Short (a few minutes) | When the system prepares for seasonal events or receives frequent traffic peaks |
| Breakpoint | Increases until break | As long as necessary | A few times, to find the upper limits of the system |

- **Smoke:** a few VUs (more than 5 VUs could be considered a mini-load test): 2 to 20 VUs, 30 seconds to 3 minutes. Run it whenever a script is created or updated or app code changes. Avoid running other test types with untested scripts. A smoke test can also serve as synthetic monitoring. Example: `options = { vus: 3, duration: '1m' }` with `check(urlRes, { 'status returned 200': (r) => r.status == 200 })`.

- **Average-load:** know your users and throughput from APM, analytics or business estimates. Ramp-up is 5% to 15% of the total duration, the plateau at least 5x the ramp-up, ramp-down about as long as ramp-up. The first time, start small with a slow ramp-up. `stages: [{ duration: '5m', target: 100 }, { duration: '30m', target: 100 }, { duration: '5m', target: 0 }]`.
- **Stress:** there is no fixed percentage above average (sometimes a few percent, 50 to 100%, or orders of magnitude). Run it only after average-load, reuse that script, and lengthen the ramp-up in proportion to the load: `stages: [{ duration: '10m', target: 200 }, { duration: '30m', target: 200 }, { duration: '5m', target: 0 }]`.
- **Soak:** typical durations 3, 4, 8, 12, 24, 48 to 72 hours; reuse the average-load script. It finds response-time degradation, memory and resource leaks, data saturation and storage depletion. Backend monitoring is especially important here. Example plateau `{ duration: '8h', target: 100 }`.
- **Spike:** very short or no ramp-up and no or a brief plateau; focus on key processes. The test often won't finish: run, tune, repeat, and monitor. `stages: [{ duration: '2m', target: 2000 }, { duration: '1m', target: 0 }]`.
- **Breakpoint:** avoid it in elastic cloud environments (turn elasticity off). Increase load gradually, define failure points first (degraded, troublesome, timeouts, errors, system failure), and run it only after all other types pass. Stop it manually or with `abortOnFail`. Example `stages: [{ duration: '2h', target: 20000 }]`.
- **Breakpoints ramp offered load, not VUs:** use `ramping-arrival-rate`. A closed model (`ramping-vus`) throttles itself as latency rises and masks the breaking point. Pair its thresholds with `abortOnFail: true` and a short `delayAbortEval`.

The website suite's default shapes per type (smoke 3 VUs for 1m through breakpoint 5/s to 500/s) are in [WEBSITE-LOAD-AND-REPORT.md](WEBSITE-LOAD-AND-REPORT.md).

## Executors

Model load by VUs (closed) or by iterations per second (open): `https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/`.

| Executor | Drives | Model |
|---|---|---|
| `shared-iterations` | A total iteration budget shared across VUs | By iterations |
| `per-vu-iterations` | Each VU runs exactly N iterations | By iterations |
| `constant-vus` | A fixed VU count for a duration | Closed (VUs) |
| `ramping-vus` | A variable VU count | Closed (VUs) |
| `constant-arrival-rate` | A fixed iteration rate regardless of response time | Open (rate) |
| `ramping-arrival-rate` | A variable iteration rate | Open (rate) |

`externally-controlled` was removed in v2.0.0 and a script that uses it fails to start; move to the executor that fits the load profile ([k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md); the [Scenarios docs](https://grafana.com/docs/k6/latest/using-k6/scenarios/) list the six above). This table used to list it as "VU count changed at runtime through the k6 REST API".

Option shapes, with the commented alternatives:

```javascript
  //   steady: { executor: 'constant-vus', vus: 10, duration: '30s' },
  scenarios: {
    dinner_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 20  },  // 5-6pm: background traffic
        { duration: '15m', target: 80  },  // 6-7pm: building
        { duration: '30m', target: 150 },  // 7-8pm: dinner peak
        { duration: '15m', target: 40  },  // 8-9pm: tapering
        { duration: '10m', target: 0   },  // 9pm: quiet
      ],
      gracefulRampDown: '2m',
    },
  },
  //   steady_orders: {
  //     executor: 'constant-arrival-rate',
  //     rate: 30,
  //     timeUnit: '1s',        // 30 iterations per second
  //     duration: '5m',
  //     preAllocatedVUs: 50,   // initial VU pool
  //     maxVUs: 200,           // hard cap
  //   },
  //   lunch_ramp: {
  //     executor: 'ramping-arrival-rate',
  //     startRate: 5,
  //     timeUnit: '1s',
  //     stages: [
  //       { duration: '3m', target: 50 },
  //       { duration: '5m', target: 50 },
  //       { duration: '2m', target: 0  },
  //     ],
  //     preAllocatedVUs: 30,
  //     maxVUs: 150,
  //   },
  //   user_journey: { executor: 'per-vu-iterations', vus: 10, iterations: 5, maxDuration: '5m' },
  //   smoke: { executor: 'shared-iterations', vus: 5, iterations: 50, maxDuration: '2m' },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed:   ['rate<0.02'],
  },
```

- **Arrival-rate VU pools:** when `maxVUs` is below `target_rate × iteration_seconds`, k6 logs `Insufficient VUs, reached N active VUs and cannot initialize more` and emits `dropped_iterations`: the run found your VU ceiling, not the server's.

## Scenarios

- **`options.scenarios.<unique name>`** with a required `executor`. Scenarios run in parallel; sequence them with `startTime`. Each can carry its own `env` and `tags`.

| Common option | Default |
|---|---|
| `startTime` | `"0s"` |
| `gracefulStop` | `"30s"` |
| `exec` | `"default"` |
| `env` | `{}` |
| `tags` | `{}` |
| `options` (browser options) | `{}` |

- **Select scenarios** (k6 v2.3.0+, [k6 release notes v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md)) with `k6 run --scenario checkout scenarios.js` or `--scenario api,checkout`. It cannot be combined with `--vus`, `--duration`, `--iterations` or `--stage`; thresholds tagged for excluded scenarios are removed with a warning. It works with `k6 cloud run`, `--local-execution` and `k6 archive`. `--scenario api,checkout --once` runs one iteration of each; `--once` alone rejects multi-scenario scripts.
- **CLI `--vus`, `--duration`, `--iterations` and `--stage` replace a script's scenarios, they don't tune them:** `--vus N` alone creates one `shared-iterations` scenario with N VUs and N iterations and prints a warning (v2.1.0+; before, a lone `--vus` was silently ignored when the script defined scenarios), so the scenario's `exec` function and browser options are lost, which breaks browser scenarios ([options reference](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/), [k6 release notes v2.1.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md), [v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md)). This line used to say the flags "don't apply to scenario configs". To smoke a scenario script on k6 v2.3+, use `k6 run --once script.js` (`--scenario a,b --once` for several scenarios); it keeps the scenario's function and browser options ([VERSIONS.md](VERSIONS.md)). On older k6, edit `iterations:` in a local copy (`sed 's/iterations: [0-9]\+/iterations: 1/' ...`); `--scenario` also arrived in v2.3.0, so a temporary `smoke` scenario run with `--scenario smoke` needs v2.3+ too.

## Thresholds

Thresholds codify SLOs (for example under 1% errors, p95 under 200 ms, p99 under 400 ms). For automation: give the test a threshold, automate execution, alert on failures.

```javascript
import http from 'k6/http';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
};

export default function () {
  http.get('https://quickpizza.grafana.com');
}
```

- **Expression format** `<aggregation_method> <operator> <value>`: `avg < 200`, `count >= 500`, `p(90) < 300`. Operators `<`, `>`, `<=`, `>=`; `==` and `!=` also work. For rate metrics `rate==1.0` means every observation was non-zero, `rate==0` all zero.

| Metric type | Aggregations |
|---|---|
| Counter | `count`, `rate` |
| Gauge | `value` |
| Rate | `rate` |
| Trend | `avg`, `min`, `max`, `med`, `p(N)` (N from 0.0 to 100, for example `p(99.99)`; values in milliseconds) |

  A percentile outside 0 to 100 or NaN fails parsing before the run (since v2.1.0; earlier versions accepted it silently, [VERSIONS.md](VERSIONS.md)).
- **Repeat a metric key and the rest are silently ignored.** Put several thresholds for one metric in one array: `http_req_duration: ['p(90) < 400', 'p(95) < 800', 'p(99.9) < 2000']`.
- **Short and long format:** an array of strings, or objects `{ threshold, abortOnFail, delayAbortEval }`. `abortOnFail: true` stops the run as soon as the threshold fails; `delayAbortEval: '10s'` (relative time strings like `10s`, `1m`) delays the evaluation to let some metric samples be collected, so a test that fails a threshold early doesn't abort before it generates significant data. Tightening an `abortOnFail` threshold makes runs abort earlier; warn the user.
- **In Grafana Cloud k6, thresholds are evaluated every 60 seconds,** so `abortOnFail` can lag up to 60 s. On runs under 60 s the abort may not fire, though `result` still flips to `failed` at the end.
- **Sub-metrics by tag:** tag requests `tags: { type: 'API' }` and threshold `'http_req_duration{type:API}': ['p(95)<500']`. Groups: `'group_duration{group:::individualRequests}': ['avg < 400']`.
- **Custom metrics:** `import { Trend, Rate, Counter, Gauge } from 'k6/metrics';`, for example `new Trend('RTT')` with `RTT: ['p(99)<300', 'p(70)<250', 'avg<200', 'med<150', 'min<100']`.
- **Reference values from the examples:** `http_req_duration: ['p(95)<500', 'p(99)<1000']`, `http_req_failed: ['rate<0.01']`, `checks: ['rate>0.99']`; gRPC `grpc_req_duration: ['p(95)<500']`; WebSocket `ws_session_duration: ['p(95)<5000']`.

## Checks and the zero-samples trap

- **Checks don't fail runs; only thresholds do.** A check records into the built-in `checks` rate metric. Without a threshold on `checks`, failing checks never reach the result. Add `checks: ['rate>0.9']`, or per tag `'checks{myTag:hola}': ['rate>0.9']`.
- **A threshold on a metric with zero samples passes.** Output looks like `checks{check:response is 200}` with `✓ 'rate==1.0' rate=0.00%`. It bites when the script throws before reaching `check()`. Record completion explicitly:

```javascript
try {
  const r = await page.goto(URL);
  check(r, { "response is 200": x => x.status() === 200 });
  // ... rest of iteration body
  check(true, { "script completed without exception": () => true });
} catch (e) {
  console.error(e);
  check(null, { "script completed without exception": () => false });
} finally {
  await page.close();
}
```

  with the threshold `'checks{check:script completed without exception}': ['rate==1.0']`.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Pass |
| `99` | A threshold failed |
| `97` | A cloud run aborted by system, limit, script error, user or timeout (v2.0.0+; before, these exited `0`) |
| Anything else | Script or runtime error |

Treat `97` as a failure in CI: on k6 v1.x a cloud abort exited `0` and looked like a pass ([k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md)). The v2.3.0 notes' `/v1/status` example shows `"exit_code": 108` after `exec.test.abort()`.

A k6 cloud run reporting `ABORTED_THRESHOLD` means a threshold tripped; inspect the run page.

## Automating performance tests

- **Automation is not only CI/CD:** cron, Grafana Cloud k6 scheduling, test management tools and manual release-checklist steps count too.
- **Modularize:** separate scenario and workload logic, and name files by workload prefix (`smoke-get-api.js`, `load-get-api.js`, `stress-get-api.js`). Always create average-load tests for baseline comparisons and smoke tests to catch script errors before larger tests.

| Environment | What to run |
|---|---|
| Dev | Smoke |
| QA | Smoke in CI; unsuitable for performance or scalability |
| Pre-release | Larger tests with threshold quality gates; keep the environment for hours or days; average, stress and spike tests, each at least twice consecutively, every 4 or 8 hours |
| Staging | Scheduled KPI tests 2 to 3 times per week, workload scaled to staging |
| Production | Smoke as synthetic monitoring every five minutes, alerting for example after six consecutive failures; load-test Green/Canary; weekly half-average-traffic tests at low traffic |

- **Pre-release thresholds:** `'http_req_failed': ['rate<0.01']`, `'http_req_duration': ['p(90)<600']`, `'http_req_duration{type:staticContent}': ['p(99)<250']`, `'my_custom_metric': ['rate<0.05']`.
- **Compare identical runs:** same workload, scenario, data and environment. If something must change, rename it or create a new test. Run the same test twice almost consecutively. Manual cadence examples: soak quarterly; heavy stress 2 months before a seasonal event.
- **Quality gates in CI/CD may give false assurance.** Don't rely entirely on pass/fail until the tests are mature; start with warnings. Load tests take 3 to 15+ minutes, so keep larger tests out of auto-deploy pipelines and plan days for pre-release performance testing.
- **Keep results:** pick a storage backend and a deletion policy that keeps baselines; track metric trends ([TRENDS.md](TRENDS.md)); build dashboards and alerts; correlate with observability (traces from tests through the `http-instrumentation-tempo` jslib). Stop risky tests with `abortOnFail` or from the CLI or Cloud.
- **For always-on probing** of production (uptime, scheduled API health checks), use Synthetic Monitoring in the grafana skill: [grafana SYNTHETIC-MONITORING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/SYNTHETIC-MONITORING.md).

## Prove it

- Every load test has thresholds on `http_req_duration` and `http_req_failed` (or the protocol's metric) and, where checks matter, on `checks`; no metric key appears twice in `thresholds`.
- A deliberately broken request makes the run exit 99, and a script that throws early fails the `script completed without exception` threshold instead of passing on zero samples.
- Breakpoint tests use `ramping-arrival-rate` with `abortOnFail` and `delayAbortEval`, and the run log shows no `Insufficient VUs` line and no `dropped_iterations`.
- Scenario scripts were smoked with `--once` (k6 v2.3+), or by editing `iterations:` on older k6, never with `--iterations 1` or `--vus 1`.
- CI treats exit `97` from a cloud run as a failure, and no scenario uses `externally-controlled`.
