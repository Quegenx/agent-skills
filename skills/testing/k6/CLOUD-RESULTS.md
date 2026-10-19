# Reading and investigating cloud runs

A Grafana Cloud k6 run leaves four kinds of evidence: its metrics (the v5 metrics API), its logs (Loki), and for browser runs its traces (Tempo) and screenshots (the files API), plus Insights audits. A run's verdict lives in three separate layers (`result` from thresholds, `status` from how it finished, and per-check ratios), and most wrong conclusions come from reading only one of them, from not paginating the run list, or from reading the current script instead of the snapshot the run used. API mechanics (auth, the proxy prefix, `gcx api` quirks, pagination) are in [CLOUD.md](CLOUD.md).

**Contents:** [Investigation workflow](#investigation-workflow) · [Pass and fail: three layers](#pass-and-fail-three-layers) · [Metrics API (v5)](#metrics-api-v5) · [Logs](#logs) · [Browser screenshots](#browser-screenshots) · [Browser traces](#browser-traces) · [Insights audits](#insights-audits) · [Reports](#reports) · [Prove it](#prove-it)

## Investigation workflow

Triggers include a pasted `/a/k6-app/tests/<id>` or `/a/k6-app/runs/<id>` URL. All calls go through `gcx api` against the plugin proxy: v6 for REST, v5 for metrics.

Prerequisite: `gcx --context <stack> config check` prints `✔ Connectivity: online`.

1. **Identify the test or run** from the URL: `/a/k6-app/tests/<id>` is a load test (the parent of many runs), `/a/k6-app/runs/<id>` a specific run. From a run, `gcx --context <stack> api /api/plugins/k6-app/resources/cloud/cloud/v6/test_runs/<run_id>` and read `.test_id`.
2. **Fetch metadata and the script:** `gcx --context <stack> k6 load-tests get <test_id> -o json`, and back the script up if you'll edit later. When the question involves "what changed", "why did this run fail", or a run more than a few days old, also fetch the run's bundled snapshot (`/cloud/v6/test_runs/{id}/script`) and diff it against the current script or another run's snapshot.
3. **List runs with pagination** (the `@nextLink` loop in [CLOUD.md](CLOUD.md#listing-and-pagination)) against `/cloud/v6/load_tests/<test_id>/test_runs`, then:

```python
print(f"Total: {len(all_runs)}")
runs_sorted = sorted(all_runs, key=lambda r: r['created'], reverse=True)
for r in runs_sorted[:10]:
    print(f"  {r['created']:30s} id={r['id']:>8} status={r['status']:<10} result={r.get('result','?')}")
```

   Report the total, the date range and the latest date, and call it out if the latest run is more than a day old: the user may believe the schedule is firing when it isn't.
4. **Filter by date,** not by count: "last 7 days" is not "last 7 runs". `last7 = [r for r in all_runs if r['created'] >= '<today_minus_7_days_iso>']`; if it's empty, tell the user at once and don't proceed with stale data.
5. **Pass and fail** across the three layers below.
6. **Metrics:** list the run's metrics, then a metric's labels, then a time series with the method that matches its type, then a whole-run aggregate:

```bash
gcx --context <stack> api /api/plugins/k6-app/resources/cloud/cloud/v5/test_runs/<run_id>/metrics
gcx --context <stack> api \
  "/api/plugins/k6-app/resources/cloud/cloud/v5/test_runs/<run_id>/labels?match[]=http_req_duration"
gcx --context <stack> api \
  "/api/plugins/k6-app/resources/cloud/cloud/v5/test_runs/<run_id>/query_range_k6(query='histogram_quantile(0.95) by (name,status)',metric='http_req_duration',step=10)"
gcx --context <stack> api \
  "/api/plugins/k6-app/resources/cloud/cloud/v5/test_runs/<run_id>/query_aggregate_k6(query='increase',metric='http_reqs')"
```

   For browser tests the URL and status breakdown comes from `labels` plus `label/{name}/values`, not a separate tags endpoint: `.../labels?match[]=browser_http_req_duration`, `.../label/url/values?match[]=browser_http_req_duration`, `.../label/status/values?match[]=browser_http_req_duration`.
7. **Logs** ([Logs](#logs)); save to `/tmp/run_<id>_logs.json` and summarise from the file. 8. **Safe edit,** only if asked ([CLOUD.md](CLOUD.md#editing-a-cloud-script-safely)). 9. **Report.**

- **Read before write:** GET before any PUT. `gcx k6 load-tests update-script` replaces the live script with whatever file you pass; running it "just to see the URL it hits" has cost users their production scripts. Learn URLs with `-vvv --log-http-payload` on a non-mutating command. `check()` does not fail runs.

| Symptom | Cause |
|---|---|
| Latest run is months old despite a daily schedule | You didn't paginate |
| "Last 7 days" contains old runs | You filtered by count |
| Thresholds pass but checks fail | Zero observations, or no threshold on `checks` |
| `result: error` with clean logs | A platform abort code in `status_history` |
| Reading the current script for a past run | Use the bundled snapshot |
| You overwrote a script with `update-script` | Restore the backup taken in step 2 |
| CLI `--iterations 1` breaks browser scenarios | It overrides the scenario block; use `--once` on k6 v2.3+, or edit `iterations:` in the file with sed on older k6 |

- **Signals from a worked example:** browser log `navigating page: navigating frame to "...": net::ERR_ADDRESS_UNREACHABLE`; the warning `The options.ext.loadimpact option is deprecated, please use options.cloud instead` (k6 v1.x only: v2.0.0 removed the option, [VERSIONS.md](VERSIONS.md)); `browser_http_req_duration` clustering at exactly 3 s means a connection timeout. Its browser run reported `checks`, `iterations`, `iteration_duration`, `browser_http_req_duration`, `browser_web_vital_ttfb`, `browser_web_vital_fcp` and `browser_data_received`, and its `script completed without exception` check at ratio 0.0 against `rate==1.0` is what flipped `result` to `failed`.

## Pass and fail: three layers

| Layer | Field | Values |
|---|---|---|
| Thresholds | `result` | `passed` (all thresholds passed, or none defined), `failed` (at least one failed), `error`, `aborted` (user or system abort) |
| Orderly finish | `status` | `completed`, `aborted` |
| Per check | v5 `checks` by the `check` label | Success ratio per check |

- **`result: error`** means the script crashed before finishing (for example the browser wouldn't launch) or Grafana Cloud k6 aborted it platform-side. Check `status_history[*].extra.code`: non-null is a platform abort, for example `8016` "Test run max lifetime exceeded" during `processing_metrics` (a 1 h cap). Platform aborts are not your code's fault even though they surface as `error`.
- **A run the user thinks is failing reports `result: passed`:** check the third layer. Typically every `check()` returns false but no threshold is defined on `checks`, so failing checks are invisible to `result`.
- **The vocabulary differs between sources:** the investigation skill uses `status` `completed`/`aborted` and `result` `passed`/`failed`/`error`/`aborted`; the trend skill lists `result` `passed`/`failed`/`timed_out` and `status` `created`/`queued`/`initializing`/`running`/`finished`/`aborted` and discards runs that didn't reach `finished`; the management skill polls until `completed` or `aborted`. Read the values your runs actually return.
- **Per-check breakdown:**

```bash
gcx --context <stack> api \
  "/api/plugins/k6-app/resources/cloud/cloud/v5/test_runs/<run_id>/query_aggregate_k6(query='ratio by (check)',metric='checks')"
```

  Each result entry carries a `check` label and one value, the success ratio (0.0 to 1.0). For raw counts query `increase_nz by (check)` (successes) and `increase_z by (check)` (failures).

## Metrics API (v5)

Reference: `https://grafana.com/docs/grafana-cloud/testing/k6/reference/cloud-rest-api/metrics/`.

| Endpoint | Returns |
|---|---|
| `GET /cloud/v5/test_runs/{id}/metrics` | Metrics: `id`, `name`, `origin` (for example `builtin`), `test_run_id`, `type` (`counter`, `gauge`, `trend`, `rate`) |
| `GET /cloud/v5/load_tests/{id}/metrics(test_run_count={n})` (default 30) or `(test_run_ids=[...])` | `name`, `type` (the latest run's type wins), the union of `labels`; alphabetised |
| `GET /cloud/v5/test_runs/{id}/series?match[]=<selector>` | Series; at least one `match[]` required |
| `GET /cloud/v5/test_runs/{id}/labels?match[]=` | Label names (`match[]` optional) |
| `GET /cloud/v5/test_runs/{id}/label/{labelName}/values?match[]=` | Label values |
| `GET /cloud/v5/test_runs/{id}/query_range_k6(query='...',metric='...',step=...,start=...,end=...)` | A matrix; `step` in seconds; `start`/`end` ISO 8601, defaulting to the run's start and end |
| `GET /cloud/v5/test_runs/{id}/query_aggregate_k6(...)` | A vector |
| `GET /cloud/v5/load_tests/{id}/query_aggregate_k6(..., test_run_count=N \| test_run_ids=[...])` | A vector across runs, with a `test_run_id` label |

- **Parameters go inside the parentheses** (OData function-call syntax), not after `?`. Wrap the whole `gcx api` path in double quotes so the single quotes survive. Load-test-level endpoints also have an `/ms` alias (the k6 UI uses it to dodge ad blockers).
- **Selectors:** operators `=`, `!=`, `=~`, `!~`, for example `http_req_duration{status="200"}`, `http_req_duration{status=~"(2|3)\d\d"}`, `http_req_duration{status!="0",name="login page"}`.
- **The method must match the metric type,** or you get an error or nothing:

| Type | Methods |
|---|---|
| Counter | `increase`, `rate`, `value`, `cumrate`, `max_rate(<interval>)` |
| Gauge | `last`, `min`, `max`, `avg`, `last_time` |
| Rate | `increase_total`, `rate_total`, `value_total`, `increase_nz`, `rate_nz`, `value_nz`, `increase_z`, `rate_z`, `value_z`, `ratio` |
| Trend | `histogram_max`, `histogram_min`, `histogram_avg`, `histogram_stddev`, `histogram_quantile(<q>)` (q in [0,1]), `histogram_count_increase`, `histogram_count_value` |

- **Aggregate** with `<method> by (l1,l2)` and wrap in `min|max|sum|avg`: `sum(last by (instance_id))`, `avg(rate by (name, method)) by (method)`.
- **Common metrics:** `http_req_duration` (trend), `http_reqs` (counter), `vus` (gauge), `data_sent` (counter), `iteration_duration` (trend), `load_generator_file_handles` (gauge), `load_generator_cpu_percent` (gauge). Labels on `http_req_duration`: `__name__`, `expected_response`, `group`, `load_zone`, `method`, `name`, `proto`, `scenario`, `status`, `test_run_id`, `url`.
- **Worked queries:**

```text
query_range_k6(metric='vus', query='sum(last by (instance_id))')
query_range_k6(metric='http_reqs', query='rate')
query_range_k6(metric='http_reqs{status!="0"}', query='rate by (name,method)')
query_range_k6(metric='http_req_duration', query='histogram_quantile(0.95) by (name,method,status)', step=10)
query_aggregate_k6(metric='http_reqs', query='increase')
query_aggregate_k6(metric='http_reqs', query='increase', start=2021-08-09T12:01:10Z, end=2021-08-09T12:09:13Z)
query_aggregate_k6(metric='http_req_duration', query='histogram_quantile(0.95) by (name,method,status)')
query_aggregate_k6(metric='http_reqs{status=~"[23][0-9]{2}"}', query='max_rate(5) by (name)')
query_aggregate_k6(metric='load_generator_cpu_percent', query='avg(max by (instance))')
query_aggregate_k6(metric='vus', query='sum(max by (instance_id))')
```

- **Across runs, the latest run's metric type wins;** an aggregation using the older type's method silently breaks.

## Logs

```bash
RUN_ID="<run_id>"

# Scope the log window to the run itself: `created` for start, `ended`
# for end. If `ended` is null the run is still in progress, fall back
# to "now". Use a wider hard-coded window only when the run object's
# timestamps don't fit what you're investigating.
RUN=$(gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/test_runs/$RUN_ID 2>/dev/null)
# k6 emits sub-second precision (e.g. "...:58.984041Z"); jq's
# fromdateiso8601 only accepts whole seconds, so strip the fraction.
START=$(echo "$RUN" | jq -r '.created | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601')
END=$(echo "$RUN"   | jq -r 'if .ended then (.ended | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) else (now | floor) end')

QUERY=$(printf '{test_run_id="%s"}' "$RUN_ID" | jq -sRr @uri)

# Save the raw response to /tmp/: log payloads can be large; streaming
# them inline burns context. Summarise from the file, then jq into
# specific entries only when needed.
gcx api "/api/plugins/k6-app/resources/logs/api/v1/query_range?query=${QUERY}&direction=backward&start=${START}&end=${END}&limit=1000" \
  -H "X-K6TestRun-Id: $RUN_ID" 2>/dev/null > /tmp/run_${RUN_ID}_logs.json

# Tight summary: counts and stream labels only:
jq '{status, streams: (.data.result | length),
     total_entries: ([.data.result[].values | length] | add),
     stream_labels: [.data.result[].stream]}' /tmp/run_${RUN_ID}_logs.json
```

- **Pull individual entries from the saved file** (for example `jq '.data.result[].values[]' …`) rather than re-running the query.
- **Every LogQL query includes `{test_run_id="<run_id>"}`:** the plugin proxy partitions logs by run and rejects (or returns nothing for) queries without it. Layer filters on top: `{test_run_id="<run_id>"} | level=~"(error|warn)"`, `{test_run_id="<run_id>"} |= "specific text"`. Without the `X-K6TestRun-Id` header you get nothing.
- **Scope `start`/`end` to the run's `created`/`ended`,** not wall-clock "last hour", or queries silently miss anything outside the window. `direction=forward` with `start = run.created` for the first errors, `direction=backward` with `end = run.ended` (or now, if still running) for the latest. Loki retention usually outlives k6's cascade deletes, so a deleted child run's logs may still be queryable for a while.

## Browser screenshots

Browser runs write screenshot PNGs to per-run S3 storage, the only artifact type the files API surfaces. Both calls need `X-K6TestRun-Id` (missing header: HTTP 422).

```bash
RUN_ID="<run_id>"

# 1. Index: JSON array of screenshot paths owned by this run. Empty
#    array if the run took none (e.g. non-browser tests, or browser
#    runs that didn't call page.screenshot()).
gcx api /api/plugins/k6-app/resources/cloud/cloud-resources/v1/files/index \
  -H "X-K6TestRun-Id: $RUN_ID" -o json 2>/dev/null > /tmp/files_${RUN_ID}.json

# Each entry looks like:
#   "7542817/files/screenshots/screenshots/login-success.png"
# The doubled "screenshots/screenshots/" segment is real, not a typo,
# pass the path back unchanged to step 2.

# 2. Request pre-signed download URLs for the files you want. The
#    request body must be JSON; Content-Type matters.
FILES=$(jq -c '[.[] | {name: .}]' /tmp/files_${RUN_ID}.json)
PAYLOAD=$(jq -nc --argjson files "$FILES" \
  '{service:"aws_s3", operation:"download", files:$files}')

gcx api /api/plugins/k6-app/resources/cloud/cloud-resources/v1/files/generate-pre-signed-url \
  -X POST \
  -H "X-K6TestRun-Id: $RUN_ID" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" -o json 2>/dev/null > /tmp/presigned_${RUN_ID}.json

# 3. Download each pre-signed URL directly, they're plain S3 GETs, no
#    gcx and no auth header (the signature is in the URL). The URLs
#    are valid for 24h (X-Amz-Expires=86400); re-run step 2 if they
#    expire.
mkdir -p /tmp/run_${RUN_ID}_files
jq -r '.urls[] | [.name, .pre_signed_url] | @tsv' /tmp/presigned_${RUN_ID}.json |
  while IFS=$'\t' read -r NAME URL; do
    curl -sS -o "/tmp/run_${RUN_ID}_files/$(basename "$NAME")" "$URL"
  done
```

- **Always derive names from `files/index`:** the sign call doesn't check existence, so a wrong name fails only at download with 404 `NoSuchKey`.
- **Batch the sign request:** `files` is an array, so sign every URL in one POST; the same 24 h expiry covers the batch.
- **Only runs that called `page.screenshot()` have entries;** a protocol run returns `[]`.

## Browser traces

Browser runs emit OTel spans for every iteration, navigation, locator click, screenshot and web-vital observation. The plugin proxies Tempo under the same `/logs/` prefix as Loki: search with TraceQL, then fetch a full trace by ID.

```bash
RUN_ID="<run_id>"

# 1. Find the run's start/end window and pick the scenario name.
#    Same caveat as §4: strip the sub-second fraction before
#    fromdateiso8601, and fall back to "now" if the run is still
#    running. Add a small buffer because spans can land slightly
#    after the run object reports `ended`.
RUN=$(gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/test_runs/$RUN_ID 2>/dev/null)
START=$(echo "$RUN" | jq -r '.created | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601')
END=$(  echo "$RUN" | jq -r 'if .ended then (.ended | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) else (now|floor) end')
START=$((START - 60))
END=$((END + 60))

SCENARIO="ui"  # whatever your scenario is named; check run.ui.exec / k6 script

# 2. Search for iteration root spans. TraceQL goes in `q`; URL-encode
#    it. `start`/`end` must be unix seconds: RFC3339 returns
#    HTTP 400 `invalid start: strconv.ParseUint`. limit=500 caps the
#    result, enough to cover several thousand iterations.
Q=$(printf '{ name = "iteration" && span.test.iteration.number >= 0 && span.test.vu >= 0 && span.test.scenario = "%s" }' "$SCENARIO")
QE=$(printf '%s' "$Q" | jq -sRr @uri)

gcx api "/api/plugins/k6-app/resources/logs/api/v1/tempo/api/search?start=${START}&end=${END}&q=${QE}&limit=500" \
  -H "X-K6TestRun-Id: $RUN_ID" -o json 2>/dev/null > /tmp/traces_${RUN_ID}.json

# Each entry has: traceID (32-char hex), rootServiceName ("k6"),
# rootTraceName ("iteration"), durationMs, startTimeUnixNano, and a
# spanSet preview of the iteration root span's attributes
# (test.iteration.number, test.vu, test.scenario).

# 3. Fetch a full trace. The response is OTLP-shaped:
#    { "batches": [ { "resource": {...}, "scopeSpans": [ { "spans": [...] } ] } ] }
TRACE_ID=$(jq -r '.traces[0].traceID' /tmp/traces_${RUN_ID}.json)
gcx api "/api/plugins/k6-app/resources/logs/api/v1/tempo/api/traces/$TRACE_ID" \
  -H "X-K6TestRun-Id: $RUN_ID" -o json 2>/dev/null > /tmp/trace_${TRACE_ID}.json
```

- **The header is mandatory:** without `X-K6TestRun-Id` both `/search` and `/traces/<id>` return HTTP 401 `"Test run ID missing"`; it scopes the query to the run's tenant.
- **`start`/`end` are unix seconds** and optional, but a window matching the run's `created`/`ended` plus about 60 s keeps the query fast and avoids matching unrelated runs that share the scenario name.
- **TraceQL, not LogQL:** span predicates are `span.<attribute>` joined with `&&`. Broaden by dropping `test.scenario`; narrow to one iteration on one VU with `span.test.vu = 3 && span.test.iteration.number = 5`.
- **Scenario names** are the keys of the run's `.options.scenarios`: `gcx api /api/plugins/k6-app/resources/cloud/cloud/v6/test_runs/$RUN_ID --json options 2>/dev/null | jq -r '.options.scenarios | keys[]'`. The default scenario is `default`; browser tests often name it `ui` or `browser`.
- **IDs:** the search `traceID` is hex (the form `/traces/<id>` accepts); the inner `traceId`, `spanId` and `parentSpanId` are base64. Correlate parent and child with `parentSpanId == spanId`, both base64, without decoding.
- **Size:** a full trace is about 100 KB pretty-printed for a 120-span iteration (about 50 KB compact). Span names include `iteration`, `navigation`, `page.waitForNavigation`, `web_vital`. Attribute keys worth surfacing: `navigation.url`, `page.goto.url`, `screenshot.path`, `web_vital.name`, `web_vital.value`, `web_vital.rating`, `test.scenario`, `test.vu`, `test.iteration.number`, `k6.test_run_id`, in the OTel envelope `{stringValue|intValue|boolValue|doubleValue}`.
- **Collapse a trace to about 1 to 2 KB** before reading it (span-name rollup, slowest spans, web-vital ratings, span errors):

```bash
jq -r '
  # OTel value envelope: pick by key presence, not //-chaining, jq's //
  # treats `false` as missing and would drop legitimate boolValue:false.
  def attrval:
    if   has("stringValue") then .stringValue
    elif has("intValue")    then .intValue
    elif has("boolValue")   then .boolValue
    elif has("doubleValue") then .doubleValue
    else null end;
  def attrs: [.attributes[] | {(.key): (.value | attrval)}] | add // {};
  def dur:   (((.endTimeUnixNano|tonumber) - (.startTimeUnixNano|tonumber)) / 1000000 | floor);

  [.batches[].scopeSpans[].spans[] | {name, dur: dur, a: attrs, status: (.status.code // "OK")}] as $spans

  | "── span-name rollup (count · total ms · max ms) ──",
    ([$spans[] | {name, dur}]
       | group_by(.name) | map({name: .[0].name, n: length,
                                t: (map(.dur)|add), m: (map(.dur)|max)})
       | sort_by(-.t)[]
       | "  \(.n|tostring|.+"      "|.[0:4])  \(.t|tostring|.+"        "|.[0:7])  \(.m|tostring|.+"      "|.[0:6])  \(.name)"),

    "\n── slowest spans (ms · name · navigation.url / page.goto.url) ──",
    ([$spans[] | select(.name != "iteration")] | sort_by(-.dur) | .[0:8][]
       | "  \(.dur|tostring|.+"        "|.[0:7])  \(.name)\(if .a["navigation.url"] // .a["page.goto.url"] then "  " + (.a["navigation.url"] // .a["page.goto.url"]) else "" end)"),

    "\n── web-vital ratings ──",
    ([$spans[] | select(.name == "web_vital")
       | {n: .a["web_vital.name"], v: .a["web_vital.value"], r: .a["web_vital.rating"]}]
       | group_by(.n) | map({name: .[0].n,
                             ratings: ([.[].r] | group_by(.) | map({(.[0]): length}) | add)})[]
       | "  \(.name)  \(.ratings)"),

    "\n── span errors ──",
    ([$spans[] | select(.status != "OK" and .status != null)] | length | "  count: \(.)")
' /tmp/trace_${TRACE_ID}.json
```

  TraceQL in general is in [grafana TEMPO.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/grafana/TEMPO.md).

## Insights audits

- **Calls** (no extra header needed):

```bash
RUN_ID="<run_id>"
BASE="/api/plugins/k6-app/resources/insights/insights/api/v1/testrun/$RUN_ID"

# 1. List executions for the run, take the most recent. The response
#    is { "executions": [ {id, version}, ... ] }: NOT a bare array.
#    Pick the last entry; insights re-runs append, and the newest one
#    reflects the current set of audits/scores.
EXEC_ID=$(gcx api "$BASE/executions" -o json 2>/dev/null \
  | jq -r '.executions[-1].id')

# 2. Audit definitions (id, title, description, weight). ~15 items.
gcx api "$BASE/executions/$EXEC_ID/audits" -o json 2>/dev/null \
  > /tmp/insights_audits_${RUN_ID}.json

# 3. Audit results (audit_id, status, score, explanation, actions).
gcx api "$BASE/executions/$EXEC_ID/audits/results" -o json 2>/dev/null \
  > /tmp/insights_results_${RUN_ID}.json
```

- **Join them:** both responses use the top-level key `audits`, but step 2 is the catalog and step 3 is what each audit found on this run; join on `result.audit_id == audit.id` (1:1 in practice). The raw pair is about 10 KB; this join emits about 5 KB for a 15-audit run:

```bash
jq -nr \
  --slurpfile a /tmp/insights_audits_${RUN_ID}.json \
  --slurpfile r /tmp/insights_results_${RUN_ID}.json '
  ($a[0].audits | INDEX(.id)) as $defs
  | $r[0].audits
  | map({
      title:         ($defs[.audit_id].title // "?"),
      description:   ($defs[.audit_id].description // ""),
      status:        .status,
      status_reason: .status_reason,
      score: (
        if .score == null            then "n/a"
        elif .score.type == "binary" then (if .score.value then "pass" else "fail" end)
        else (.score.value | tostring)
        end),
      explanation: (.explanation // "" | gsub("\n+"; " ") | .[0:300]),
      actions:     (.actions // [])
    })
  | .[]
  | "── \(.title) - score: \(.score)\(if .status == "failed" then " [audit did not run: \(.status_reason // "unknown")]" else "" end)\n  \(.description)\n  → \(.explanation)\(if (.actions|length) > 0 then "\n  actions:\n    - " + (.actions|join("\n    - ")) else "" end)\n"
'
```

- **Pick the last execution, not the first:** `.executions[]` is chronological and re-runs append; older executions reflect older audit logic. Insights is post-run analysis: the list may be empty until the run finishes (or if it never produced enough data), so bail out on `length == 0`.
- **Audits check** for example high cardinality, web-vital regressions, missing thresholds, overutilised load generators.
- **Reading them:** `status: "succeeded"` means the audit ran; the verdict is `score` (`binary` true/false, or `numeric` 0 to 1 with 1 best). `status: "failed"` means it couldn't run (for example `status_reason: "missing data"`, such as the HTTP Spans audit on a non-tracing test) and has no `score`: treat it as no signal, not a failure. There is no global score cutoff: quote `explanation` verbatim and lead with audits that have non-empty `actions`.

## Reports

- **Single run:** test, run, logs (streams and lines), key metrics, per-check breakdown, diagnosis.
- **Comparing runs:** a table `Run ID | Created (UTC) | Result | exec_duration | processing_duration | k6 build | error code | key check ratios`, then the differences, the script diff, and a diagnosis attributing the cause to the test side, the system under test, or the platform.
- **Keep raw dumps** under `/tmp/k6inv/run<id>/`.

## Prove it

- The run list you reasoned from was fully paginated, its date range is stated, and a stale latest run is called out.
- The verdict cites all three layers: `result`, `status` (with `status_history[*].extra.code` checked for `error`), and the `ratio by (check)` breakdown.
- Logs were queried with `{test_run_id=...}`, the `X-K6TestRun-Id` header and the run's own `created`/`ended` window, and the summary comes from the saved file.
- Any script claim about a past run comes from `/cloud/v6/test_runs/{id}/script`, not the load test's current script.
