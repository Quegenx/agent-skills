# Website suite: thresholds, load tests, runs and the report

Steps 5 to 10 of the website workflow in [WEBSITE-PERF-TEST.md](WEBSITE-PERF-TEST.md): SLO thresholds in four layers, one hybrid load test file per test type (a protocol scenario that drives load plus one browser VU as a canary user), local runs with a load-generator monitor, cloud runs for scale, backend investigation when the user owns it, and a neutral, evidence-cited report. Two things decide whether the numbers mean anything: per-endpoint thresholds (the global p95 hides slow critical endpoints) and a load generator that wasn't saturated.

**Contents:** [SLOs and thresholds](#slos-and-thresholds) · [Hybrid load tests](#hybrid-load-tests) · [Test type defaults](#test-type-defaults) · [The LG monitor sidecar](#the-lg-monitor-sidecar) · [Local vs Grafana Cloud k6](#local-vs-grafana-cloud-k6) · [Investigating the backend](#investigating-the-backend) · [The report](#the-report) · [Prove it](#prove-it)

## SLOs and thresholds

Four layers: global SLOs; per-endpoint thresholds (tag every protocol request, threshold per tag); per-iteration (workflow time and completion rate); Web Vitals LCP, INP and CLS only, plus a custom action Trend.

- **Global defaults:** `http_req_failed: ['rate<0.01']`, `http_req_duration: ['p(95)<500']`, `checks: ['rate>0.99']`. Common adjustments: heavy-CDN public site `p(95) < 300ms`; API gateway with downstream calls `p(95) < 800ms`; high-error-budget app `http_req_failed rate < 0.05`.
- **Per endpoint:** the global p95 is dominated by fast, frequent endpoints (static assets, small JSON), so slow critical ones hide in the aggregate. Give one tag per business action its own SLO; static assets and incidental fetches (images, fonts) need no tag of their own, since the global threshold already covers them. Name tags `<HTTP-verb><Resource>` in PascalCase with no hyphens or slashes (`GetRecommendation`, not `get-/recommend`). `http.get(\`${BASE_URL}/api/things\`, { tags: { name: 'GetThings' } });` with `'http_req_duration{name:GetThings}': ['p(95)<400', 'p(99)<800']`. More examples: `GetRecommendation` `['p(95)<1000', 'p(99)<1500']`, `CreateOrder` `['p(95)<800']`, `GetCatalogue` `['p(95)<400']`, `GetConfig` `['p(95)<300']`.
- **Per iteration:** `'iteration_duration{scenario:browser}': ['p(95)<10000']` (10 s, roughly 2x the smoke median) and `'iteration_completed{scenario:browser}': ['rate>0.99']`.
- **Web Vitals ("good" thresholds):** `browser_web_vital_lcp: ['p(95)<2500']`, `browser_web_vital_inp: ['p(95)<200']`, `browser_web_vital_cls: ['p(95)<0.1']`. Dropped: FCP (superseded by LCP), TBT (noisy under load), TTFB (measure it through `http_req_duration`). The browser-test skill uses the same limits at p(75) ([BROWSER.md](BROWSER.md#browser-load-tests-and-web-vitals)).
- **CLS may go to `< 0.2`** for a deterministic, accepted layout shift, but flag it in the report (workflow, selector, the deterministic CLS value, the customer's decision). Silent loosening is the #1 way perf tests stop catching regressions.
- **`group()` is unreliable in async browser code** (`group_duration` won't match). Time actions with `performance.mark/measure` inside `page.evaluate()` and a custom Trend:

```js
import { Trend } from 'k6/metrics';
const timeToResult = new Trend('time_to_result', true);

await page.evaluate(() => performance.mark('action-start'));
await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/action')),
  button.click(),
]);
await resultLocator.waitFor({ state: 'visible' });

const ms = await page.evaluate(() => {
  performance.mark('action-end');
  return performance.measure('action', 'action-start', 'action-end').duration;
});
timeToResult.add(ms);
```

  with `time_to_result: ['p(95)<3000']`. From k6 v2.3.0, the experimental `k6 run --features async-metric-context script.js` lets `await group('browse', async () => {...})` keep requests and checks in the group across `await`, with `group_duration` measured until the callback's promise settles (before, `group()` rejected async functions) ([k6 release notes v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md)); keep `performance.mark/measure` as the default while the flag is experimental. The templates ship `timeToResult.add()` commented out, and a threshold on a metric with zero samples passes vacuously: wire it up or delete the threshold.
- **In sync protocol code `group()` works:** `group('checkout', () => {...})` with `'group_duration{group:::checkout}': ['p(95)<2000']`.
- **A thrown browser iteration shows as "interrupted", not "failed",** so record completion yourself:

```js
import { Rate } from 'k6/metrics';
const iterationCompleted = new Rate('iteration_completed');

export async function browserIteration() {
  const page = await browser.newPage();
  let success = true;
  try {
    // ... workflow body ...
  } catch (e) {
    success = false;
    console.error(`browser iteration failed: ${e?.message || e}`);
    throw e;          // re-throw so k6 also marks iteration interrupted
  } finally {
    iterationCompleted.add(success);
    await page.close();
  }
}
```

- **Breakpoint thresholds abort on fail:** `http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' }]`, `http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '30s' }]`, `checks: ['rate>0.95']`. `delayAbortEval` keeps momentary fluctuations from aborting.
- **Expected response statuses:** k6 normally treats HTTP 200 to 399 as expected. Set the documented global or per-request `responseCallback` with `http.expectedStatuses` when a particular response is expected. Tags select metric samples; they do not change response classification or remove requests from an existing global threshold. A failed-request rate below 1 permits some failures, rather than excluding the tagged requests. The source's tagged-threshold alternative did not fix the global failure rate. [k6 response callback](https://grafana.com/docs/k6/latest/javascript-api/k6-http/set-response-callback/), [thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- **Tuning:** start with the defaults; run smoke and read the actual results; set non-critical endpoints to 2x the smoke p95 and critical ones to the user's SLO; run average and stress (expect failures under stress). Failing thresholds are findings. Don't loosen to pass: confirm with the user that the SLO shifted (and document it), or report the failure and stop.

## Hybrid load tests

- **Each file has two scenarios:** a protocol scenario that drives load (`exec: 'protocolIteration'`) and a browser scenario (`executor: 'constant-vus'`, `exec: 'browserIteration'`, `vus: 1`, duration matching the protocol one, `options: { browser: { type: 'chromium' } }`). Breakpoint is protocol-only. Options merge `thresholds: { ...BACKEND_THRESHOLDS, ...BROWSER_THRESHOLDS }` and set `userAgent: USER_AGENT`.
- **Why hybrid:** protocol-only says nothing about the page users see; browser-only hits VU ceilings (about 1 GB RSS per browser VU). One browser VU is a canary user for LCP, INP, CLS and iteration duration; more browser VUs multiply LG memory without better signal.
- **Protocol body:** `check()` not `expect()`, per-endpoint tags, randomised think time `sleep(Math.random() * 3 + 1)` between actions and no trailing sleep (closed-model executors pace through the VU count). Browser think time: `page.waitForTimeout(1000 + Math.random() * 3000)`.
- **One file per type,** not a `LOAD_TYPE=__ENV.LOAD_TYPE` dispatcher: self-documenting options, per-type tuning, per-file `cloud { distribution }`, one type run at a time, confined git diffs.
- **No shared `tests/lib/`** (about 8 copies of the body per workflow): readability during incident review, per-file thresholds and tags (`expect` vs `check`), different sleeps, async vs sync bodies, per-file tuning. Share only through `__ENV` or the top of each file: `BASE_URL`, `USER_AGENT`, test credentials, a canonical request body. Never share the iteration body, the threshold dictionary or scenario options. When the workflow body changes, update the files in lock-step.

The source's "No shared `tests/lib/`" is a website-suite review preference [grafana/skills, k6-perf-test-website]. Generic refactoring instead reads both spans and their differences before deciding whether extraction helps, and can retain intentional test boilerplate [kucherenko/jscpd, dry-refactoring]: [refactoring DUPLICATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DUPLICATION.md#read-before-extracting). Keep each view scoped rather than making either a universal copying or extraction rule.

## Test type defaults

| Type | Executor | Shape | Browser scenario |
|---|---|---|---|
| Smoke | `constant-vus` | 3 VUs for 1m | 1m |
| Average | `ramping-vus` | 0 to 20 to 0 over 14m (2m / 10m / 2m) | 14m |
| Stress | `ramping-vus` | 0 to 50 to 0 over 20m (5m / 10m / 5m) | 20m |
| Spike | `ramping-vus` | 0 to 100 to 0 over 2m (30s / 1m / 30s) | 2m |
| Soak | `ramping-vus` | 0 to 10 to 0 over 70m (5m / 60m / 5m) | 70m |
| Breakpoint | `ramping-arrival-rate` | 5/s to 500/s over 20m, abortOnFail: `startRate: 5`, `timeUnit: '1s'`, `preAllocatedVUs: 50`, `maxVUs: 500`, `stages: [{ duration: '20m', target: 500 }]` | None |

Tune after smoke. The official per-type guidance (durations, ramp ratios) is in [LOAD-AND-THRESHOLDS.md](LOAD-AND-THRESHOLDS.md#test-types).

- **Smoke** sanity-checks the script and thresholds and always runs first. "Smoke is not a measurement."
- **Average** is expected production load; every SLO must hold.
- **Stress** finds where SLOs break; report each failure with its tag, the peak VU count and a timestamp.
- **Spike** verifies recovery; cold caches, connection-pool warm-up and autoscaler latency surface here. Run it if surges matter (launches, campaigns, news cycles).
- **Soak** finds memory leaks, connection drift, scheduled-job interference and cache eviction: watch whether `iteration_duration` stays flat or trends, k6 RSS, and periodic spikes from cron, GC or log rotation. Run it before deployments that introduce persistent state (caches, connection pools). A climbing RSS may be k6's own metric accumulation (it keeps every sample for the summary); check backend memory before reporting a leak.
- **Breakpoint** finds the ceiling: read the arrival rate at the abort point. Use arrival rate because the cliff is in requests per second, and VU ramps are bounded by iteration duration. No think-time `sleep()`: a 1 to 4 s sleep makes iterations about 2.5 s, so one VU serves about 0.4 iterations/s. With no think time and a 0.2 s iteration, 500/s needs about 100 VUs; if `maxVUs` is below `target_rate × iteration_seconds`, k6 logs `Insufficient VUs, reached N active VUs and cannot initialize more` and emits `dropped_iterations`, and you found your VU ceiling, not the server's.
- **Order:** smoke, average, stress, spike, soak, breakpoint (when you want "the system handles X req/s before degrading").

## The LG monitor sidecar

A saturated load generator silently throttles its own request rate: lower RPS, higher latency, "iterations interrupted".

- **Run:** `./tools/run-with-monitor.sh tests/wN-<short-name>/smoke.js`; finer sampling `INTERVAL=2 tools/run-with-monitor.sh .../spike.js`. It writes `/tmp/perf-lg-monitor/<workflow>-<test-type>-<timestamp>.csv` and `.k6.log`, takes a 2 s baseline sample, passes extra args to `k6 run`, exits with k6's return code, and needs python3 for its summary (otherwise it prints the raw CSV path). Default `INTERVAL` is 5 s.
- **When it's required:** the overview says always; the monitoring reference says every test type beyond smoke (smoke is short enough that saturation is unlikely). Both require it beyond smoke.

| Minimum `sys_cpu_idle` | Verdict |
|---|---|
| 30% or more | OK |
| 10% to 30% | NOTE |
| Under 10% | WARNING: LG saturated, k6 numbers unreliable |

  A WARNING run is inconclusive: reduce VUs, move to cloud or split across LGs, and never report findings from it.
- **CSV header:** `timestamp_iso,uptime_s,sys_cpu_user,sys_cpu_sys,sys_cpu_idle,k6_cpu,k6_mem_pct,k6_rss_kb,chrome_cpu_total,chrome_mem_pct_total,chrome_rss_kb_total,chrome_proc_count,nic,nic_rx_bytes,nic_tx_bytes,nic_rx_bytes_per_s,nic_tx_bytes_per_s`. (The investigation reference calls these per-second samples; the script defaults to 5 s.)
- **Process detection:** test-spawned Chromium by its `--headless` flag (your regular Chrome is excluded; with `K6_BROWSER_HEADLESS=false` the chromium columns are empty); k6 with `pgrep -fn "k6 run "` guarded by `|| true` so `set -e` callers survive no match.
- **Platforms:** branches on `uname -s`. The reference doc lists macOS `top -l 1 -s 0`, `netstat -ib` and `route get default`, and Linux `top -bn1` or `mpstat 1 1`, `/proc/net/dev` or `ip -s link`, and `ip route show default`. The script uses `top -l 1 -s 0 -n 0` and `netstat -ibn` on macOS, `/proc/stat` read twice 1 s apart and `/proc/net/dev` on Linux, falling back to NIC `en0`. Windows is unsupported; use WSL2. macOS ships bash 3.2, where `${arr[-1]}` fails with `bad array subscript`; use `LAST_INDEX=$(( ${#arr[@]} - 1 ))`.
- **Read a CSV:** idle timeline `awk -F, 'NR==1{print; next} $5 != "" {print $1, $5}' /tmp/perf-lg-monitor/wN-stress-*.csv`; max Chromium RSS `awk -F, 'NR>1 && $11 != "" {print $11}' /tmp/perf-lg-monitor/wN-soak-*.csv | sort -n | tail -1`; for soaks, plot `k6_rss_kb` over time.
- **Limits:** sampled, not integrated (short spikes are missed; lower `INTERVAL`); NIC counted per interface (VPN tunnels and loopback invisible, a `localhost` target reads about 0); under 1% overhead. It doesn't apply to cloud runs: read the LG utilisation panels in the cloud run UI.

## Local vs Grafana Cloud k6

Local is for validation, cloud is for scale. Trust cloud for measurement and local for script validation; don't blend them.

- **Laptop limits:** CPU (Chromium about 1 core per browser VU; 50 protocol VUs plus 1 browser VU often pegs an 8-core laptop), memory (about 1 GB RSS per browser VU; past 2 to 3 browser VUs you swap), NIC (1 Gbit rarely before CPU), TCP ephemeral ports (about 28k by default on many OSes). A 10-node cloud fleet lifts these about 10x.
- **Cost in VUh:** 1 protocol VU-hour is 1 VUh, 1 browser VU-hour is 10 VUh. Estimates: smoke about 0.22, average about 7, spike about 3.6 (safe); stress about 20 (moderate); soak about 23 (moderate to high: `(10 × 70/60) + (1 × 70/60 × 10) = 11.67 + 11.67 = 23.3 VUh`; the soak template says the 70-minute browser VU alone is about 12 VUh); breakpoint about 30 to 100+ (high, variable). With 100 protocol VUs plus one browser VU running for 60 minutes, the unadjusted total is 110 VUh: 100 + 10. The source said about 150. Actual billing also depends on the current plan and execution configuration. [Grafana Cloud k6 billing](https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/performance-testing/) Free-tier limits change; check the Grafana Cloud k6 UI or `gcx`. Confirm with the user before browser-heavy soaks in the cloud.
- **Typical matrix** (every cell is the customer's call): smoke local; average cloud; stress cloud; spike local or cloud by target rate; soak local (cheap) or cloud (real LGs); breakpoint cloud.
- **Validate, then measure:** local smoke (always); a short local run of the assigned type (for example a 2-minute slice of stress); the cloud run; analysis in the UI or with `gcx`. Skipping the second step is "10 VUh burned for a typo".
- **Push:** confirm `k6 cloud login` works (on auth errors, pause and ask the user to authenticate), smoke locally, then `k6 cloud run tests/wN-<short-name>/<type>.js` and capture the run URL. The binary uploads the script, provisions LGs per `options.cloud.distribution` or the default region, streams results and prints the URL. Cloud details: [CLOUD.md](CLOUD.md).
- **When cloud and local disagree:** the local LG was saturated; a different network path or CDN edge; `options.cloud.distribution` spread VUs geographically; IP allow-lists or WAFs treat cloud LG IPs differently.
- **Read a failed cloud run** in the UI (thresholds tab, per-metric timeline, failed checks); use `gcx` for listing recent runs, programmatic threshold queries and downloading summaries ([CLOUD-RESULTS.md](CLOUD-RESULTS.md)).

## Investigating the backend

Only when the user owns the backend and has Grafana access. Don't guess the language, datasources, service label keys (`service_name`, `service`, `app`, `job`, `namespace`, `container`) or metric names: discover them. Vendor-neutral instrumentation is the observability skill ([observability SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md)).

1. **Datasources:** `mcp-grafana` `list_datasources()`, or `gcx datasources list -o json`. Record UIDs and types. Neither configured: pause and ask the user to authenticate one.
2. **Labels:** ask for the exact key and value and confirm with `up{<label_key>="<label_value>"}` (no series means the wrong label), or `list_label_names(datasource_uid=...)` and `list_label_values(datasource_uid=..., label="service_name")`.
3. **Window:** use the exact k6 start and end timestamps as `from`/`to` in every query, never "last 1h". Pyroscope needs explicit `from`/`to`.
4. **Query RED metrics** (find metric names with `gcx metrics query -d <prom-uid> 'group by (__name__) ({<label>="<value>"})' -o json`):

```promql
# Request rate
sum by (route) (
  rate(<your-http-request-counter>{<label>="<value>"}[1m])
)

# Error rate
sum by (route) (
  rate(<your-http-request-counter>{<label>="<value>",status=~"5.."}[1m])
) /
sum by (route) (
  rate(<your-http-request-counter>{<label>="<value>"}[1m])
)

# Latency p95
histogram_quantile(0.95,
  sum by (route, le) (
    rate(<your-http-request-duration-bucket>{<label>="<value>"}[1m])
  )
)
```

5. **Logs:** `{<label>="<value>"} |= "error" | line_format ...`; structured `{<label>="<value>"} | json | level="error"`. **Traces:** `gcx traces query -d <tempo-uid> --query '{service.name="<value>" && duration > 1s}' --start <iso> --end <iso>`. **Profiles:** `gcx pyroscope query-profile -d <pyro-uid> --query '<profile-type>{<label>="<value>"}' --from <iso> --to <iso>`; report the top frames without interpreting them.

- **Verify absence before reporting it,** all three: (1) the label endpoint `gcx <product> labels -d <uid>` (or `-l <key>`): any values (for example `resource.service.name`) mean your query is wrong; (2) re-run without `--json <field>` and read the raw output (a wrong field name yields `{"<field>": null}`; gcx hints `use --json list to discover fields, --json field1,field2 to select`); (3) a 10x wider window (for example `--from now-24h`): data appearing means a clock-skew, retention-edge or time-zone bug. Optionally re-run through the other tool. A recorded failure: `gcx traces query ... --json data` returned `{"data": null}` because the field is `traces`, while Tempo had full coverage.
- **Tool choice:** a single structured in-session query, `mcp-grafana`; scripted shell, multiple contexts or CI, `gcx`; Tempo trace selectors, mcp-grafana has richer support. Don't argue with the user's preferred tool.
- **Not owned:** state verbatim "Backend-side investigation was not performed because the customer does not own the backend. Findings are limited to what k6 can observe from the client side: response status, latency, body, and Web Vitals."

## The report

- **Sections:** Summary (workflows, test types local or cloud, backend investigated or not, outcome pass / pass-with-findings / fail); SLOs and threshold results table (PASS/FAIL plus notes); Findings (severity-ordered: observation, evidence, neutral next step); Loosened or skipped thresholds (Threshold, Original, Loosened to, Cause); Evidence index (k6 logs, LG CSVs, cloud run URLs, Grafana datasource UIDs, service labels, run windows; on k6 v2 a local run can add the built-in HTML report from `K6_WEB_DASHBOARD_EXPORT`, [SCRIPTS.md](SCRIPTS.md#results-output)); Methodology notes (k6 and Node versions, LG host spec, sidecar interval, scenario shape, threshold strategy); Suggested next steps (including adding thresholds to CI via `k6 run --threshold=...`, a quarterly re-run).
- **Severity:** map the source's critical/high/medium/low to P0/P1/P2/P3 for findings; informational observations carry no defect severity. Preserve evidence of actual user impact when assigning the priority. [grafana/skills, k6-perf-test-website/SKILL.md; owner P0 to P3 rule]
- **Rules:** be specific (metric, window, evidence path); every number cites a file path or URL; stay neutral ("Customer should investigate whether X can be optimised", never "fix X by doing Y"); don't recommend code changes; don't infer backend findings from client-side signals ("the database is slow" needs the backend investigation). Good: "GetPizza p(95) hit 1.4s at iteration ~200; correlated with sustained 100% CPU on the recommender service per Grafana panel link".

## Prove it

- Every business request carries a `name` tag with its own `http_req_duration{name:...}` threshold, and no threshold references a metric that is never recorded (`time_to_result` is wired up or deleted).
- Each load file has the protocol scenario plus one `constant-vus` browser VU (except breakpoint), and smoke ran green before any longer type.
- Every reported local run has an LG CSV whose minimum `sys_cpu_idle` is not a WARNING.
- Every loosened threshold appears in the report's loosened table with the user's decision, and every numeric claim cites a log, CSV, run URL or Grafana query window.
