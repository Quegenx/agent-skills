# k6 versions: v1.7 to v2.3

k6 v2.0.0 removed long-deprecated commands, options and modules, and v2.1 to v2.3 changed how several flags behave, so advice written for k6 v1.x can now fail to start a test or quietly change what it measures. This file is the one place that says which k6 version a behavior needs; the other files link here. Everything below is paraphrased from the k6 release notes in the grafana/k6 repo (`release notes/v<version>.md`, for example [v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md)) and the k6 docs at `https://grafana.com/docs/k6/latest/`. k6 is AGPL-3.0 and the docs are Grafana Labs ©: paraphrase and cite, copy only short commands and options. Check the installed version with `k6 version` before applying any version-gated advice.

## v2.0.0 migration checklist

Every row is a breaking change: the left column stops working on v2.0.0 [k6 release notes v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md).

| Removed or changed | Do instead |
|---|---|
| `executor: 'externally-controlled'` (the test fails to start) | Another executor that fits the load profile, for example `ramping-vus`, `constant-vus` or `constant-arrival-rate`; there is no replacement for runtime VU control |
| `k6 pause`, `k6 resume`, `k6 scale`, `k6 status` | No replacement (they relied on `externally-controlled`) |
| `k6 login`, `k6 login cloud`, `k6 login influxdb` | `k6 cloud login`; InfluxDB through `K6_INFLUXDB_*` environment variables |
| `k6 cloud script.js` (positional form) | `k6 cloud run script.js` |
| `k6 cloud --upload-only` | `k6 cloud upload script.js` |
| A token alone for `k6 cloud` commands | A stack is mandatory for `k6 cloud run`, `k6 cloud upload` and `--local-execution`; `k6 cloud login` needs both token and stack (or set `K6_CLOUD_STACK_ID`, or the `stackID` script option) |
| `options.ext.loadimpact` | `options.cloud` with the same fields |
| `--no-summary` | `--summary-mode=disabled` |
| `--summary-mode=legacy` | `compact` (default) or `full`; there is no equivalent of the legacy format |
| `k6/experimental/redis` | `k6/x/redis` (auto extension resolution provisions xk6-redis) |
| `browser_web_vital_fid` (web-vitals library moved from v3 to v5.1.0) | `browser_web_vital_inp` in dashboards, alerts and thresholds |
| Cloud runs aborted by system, limit, script error, user or timeout exited `0` | They now exit `97`; review CI logic that treats `0` as success for cloud runs |
| The REST API server listened on `localhost:6565` by default | It starts only with `--address=localhost:6565` or `K6_ADDRESS` |
| `K6_OTEL_EXPORTER_TYPE` | `K6_OTEL_EXPORTER_PROTOCOL` (`grpc` or `http/protobuf`) |
| `K6_OTEL_SINGLE_COUNTER_FOR_RATE` and the pair-of-counters rate format | Rate metrics export as one counter with a `condition` attribute (`nonzero` or `zero`); update dashboards and queries |
| `K6_BINARY_PROVISIONING`, `K6_ENABLE_COMMUNITY_EXTENSIONS` | Remove them; auto extension resolution is on by default (disable with `K6_AUTO_EXTENSION_RESOLUTION=false`) |
| Config at `{USER_CONFIG_DIR}/loadimpact/config.json` (no longer migrated) | Move it to `{USER_CONFIG_DIR}/k6/config.json`, or re-run `k6 cloud login` |
| Go module `go.k6.io/k6` (extension authors) | `go.k6.io/k6/v2`; easyjson-generated methods on k6 types are gone (stdlib `encoding/json`) |

## What each version added or changed

| Version | Change | Source |
|---|---|---|
| v1.7.0 | `k6 x <subcommand>` extensions are provisioned on demand the first time you call them | [v1.7.0](https://github.com/grafana/k6/blob/master/release%20notes/v1.7.0.md) |
| v1.7.0 | `K6_SECRET_SOURCE` environment variable; the OpenTelemetry output is recommended over InfluxDB | [v1.7.0](https://github.com/grafana/k6/blob/master/release%20notes/v1.7.0.md) |
| v2.0.0 | The web dashboard is built into the binary (no extension) | [v2.0.0 #5775](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md) |
| v2.0.0 | Locator actions auto-retry in the browser module | [v2.0.0 #5657](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md) |
| v2.0.0 | `k6 cloud project list [--format=json]`; cloud secrets available by default under `k6 cloud run --local-execution` (`--no-cloud-secrets` opts out) | [v2.0.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.0.0.md) |
| v2.1.0 | `--vus N` on its own creates one `shared-iterations` scenario with N VUs and N iterations, overriding the script's scenarios with a warning, like `--duration`, `--iterations` and `--stage` (before, it was silently ignored when the script defined scenarios) | [v2.1.0 #5794](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md), [options reference](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/) |
| v2.1.0 | A threshold percentile outside 0 to 100, or NaN, fails parsing before the run (earlier versions accepted it silently) | [v2.1.0 #6013](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md) |
| v2.1.0 | `k6 x` lists `agent`, `docs`, `explore` and `mcp` | [v2.1.0 #5972](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md) |
| v2.1.0 | `k6 cloud test list [--project-id N] [--json]`; the project comes from `--project-id`, then `K6_CLOUD_PROJECT_ID`, then the stack default set by `k6 cloud login` | [v2.1.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md) |
| v2.1.0 | Browser: `browser.newContext({ proxy: { server, bypass } })`, `locator.isInViewport({ ratio })`; `Selection.single(selector)` in `k6/html`; the `native-histograms` feature flag | [v2.1.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.1.0.md) |
| v2.2.0 | `k6 cloud --vus 10 script.js` fails with `unknown flag` and a non-zero exit | [v2.2.0 #6208](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md) |
| v2.2.0 | `handleSummaryTimeout` (default 120 s) | [v2.2.0 #5854](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md) |
| v2.2.0 | `k6 cloud load-zone list [--json]`; `--local-execution` streams logs to the cloud run (`--no-cloud-logs` opts out) and moved to the v6 API, while `k6 run --out cloud` stays on the legacy API | [v2.2.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md) |
| v2.2.0 | Browser: `chromium.connectOverCDP(wsEndpoint)`; `TextEncoder` and `TextDecoder` globals; `WritableStream` in `k6/experimental/streams` | [v2.2.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.2.0.md) |
| v2.3.0 | `--scenario name` or `--scenario a,b` runs only the named scenarios, each keeping its settings; it can't be combined with `--vus` or `--duration` | [v2.3.0 #6360](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | `--once` is the recommended single run for protocol and browser tests, keeping the scenario's function and browser options; at most one scenario; works with `k6 run`, `k6 cloud run` and `k6 archive` | [v2.3.0 #6338](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md), [options reference](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/) |
| v2.3.0 | `--features async-metric-context` (experimental): `await group(...)` keeps requests and checks in the group across `await` | [v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | `/v1/status` reports `execution_result.exit_code` (use with `--linger`); its example shows `"exit_code": 108` after `exec.test.abort()` | [v2.3.0 #6388](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | `tlsAIAFetch: true` (opt-in, HTTP and gRPC) for servers that work in browsers but omit an intermediate certificate; no effect with `insecureSkipTLSVerify` | [v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | `Uint8Array.fromHex()` and `.toBase64()`; Set `difference`, `intersection`, `union`; `JSON.rawJSON('9007199254740993')` for exact big numbers; `WebSocket.OPEN` and the other ready-state constants | [v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | `--log-ns-timestamps` orders logs: `k6 --log-ns-timestamps --log-format=json run script.js` | [v2.3.0](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |
| v2.3.0 | Remote screenshot paths use forward slashes on Windows | [v2.3.0 #6235](https://github.com/grafana/k6/blob/master/release%20notes/v2.3.0.md) |

## Feature flags

Turn experimental behavior on with `--features a,b`, `K6_FEATURES`, or `features` in config.json; list what your build has with `k6 features [--json]` [k6 release notes v2.1.0 to v2.3.0](https://github.com/grafana/k6/tree/master/release%20notes).

| Flag | Effect |
|---|---|
| `native-histograms` | Native histograms for trend metrics (v2.1) |
| `merge-run-tags` | `options.tags` is no longer silently discarded when `--tag` or `K6_TAGS` is set |
| `freeze-env` | Writes to `__ENV` throw a `TypeError` instead of persisting across iterations |
| `async-metric-context` | Added in v2.3; `group_duration` measures until the async callback's promise settles (before, `group()` rejected async functions) |

## Version boundaries in trend data

These fixes change the numbers a run reports, so a multi-run trend that crosses one can shift without the system changing [k6 release notes](https://github.com/grafana/k6/tree/master/release%20notes):

- **v2.0.0:** `browser_web_vital_fid` stops being recorded.
- **v2.2.0:** a counter `rate` threshold no longer fails spuriously on zero duration (#6200); `SharedArray` memory dropped from about 1 GB to 100 MB in one reproduction (#6140).
- **v2.3.0:** a `ramping-vus` scenario that can't start a VU now errors instead of silently stopping and reporting success (#5922); HTTPS-through-HTTPS-proxy timings were inflated before (#6349); Web Vitals from intermediate pages in a tab that navigates several times are now kept instead of lost (#6163).

Record the k6 version of each run with the trend (the run report's `k6 build` column in [CLOUD-RESULTS.md](CLOUD-RESULTS.md#reports)) and split the history at these versions as you would at a script change ([TRENDS.md](TRENDS.md#trend-analysis)).

## Prove it

- `k6 version` was checked, and no version-gated command or option is used below the version this file names for it.
- On k6 v2.x, `grep -nE "externally-controlled|ext\.loadimpact|experimental/redis|--no-summary|browser_web_vital_fid|k6 cloud [a-z./-]+\.js" <scripts and CI files>` finds nothing (`k6 cloud run`, `upload` and `login` don't match a bare script path).
- CI that runs cloud tests treats `97` as a failure.
