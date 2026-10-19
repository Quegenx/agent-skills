# Dashboards

A Grafana dashboard is a JSON document of panels, variables, annotations and links, and every panel is a query plus a visualization type plus field config plus optional transformations. Most outcomes are decided before the first panel: whether the dashboard answers one question for one audience (RED for services, USE for machines), whether one dashboard with variables replaces many copies, and whether the JSON lives in version control and is pushed and verified by `uid`. Query languages are in [PROMQL.md](PROMQL.md), [LOKI.md](LOKI.md) and [TEMPO.md](TEMPO.md); provisioning dashboards from files and the HTTP API are in [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md).

**Contents:** [Design](#design) · [Managing dashboards](#managing-dashboards) · [The JSON model](#the-json-model) · [Push and verify through the API](#push-and-verify-through-the-api) · [Panels and visualizations](#panels-and-visualizations) · [Field config, units and thresholds](#field-config-units-and-thresholds) · [Variables](#variables) · [Transformations and expressions](#transformations-and-expressions) · [Links and annotations](#links-and-annotations) · [SQL and other data source queries](#sql-and-other-data-source-queries) · [Library panels, versions, sharing](#library-panels-versions-sharing) · [Performance](#performance) · [Common problems](#common-problems) · [Prove it](#prove-it)

## Design

### Pick an observability strategy

| Method | Signals | Best for |
|---|---|---|
| RED | Rate (requests per second), Errors (failing requests), Duration (latency distribution) | Services, especially microservices. RED dashboards are good for alerting and SLAs; a well-designed one is a proxy for user experience. |
| USE | Utilization (percent time busy, e.g. node CPU), Saturation (work queued, often queue length or node load), Errors (count of error events) | Hardware resources: CPU, memory, network devices |
| Four Golden Signals | Latency, Traffic, Errors, Saturation | Like RED plus saturation |

- **USE reports causes, RED reports user experience.** "The USE method tells you how happy your machines are, the RED method tells you how happy your users are." Alert on symptoms, so alert from RED dashboards. For each service, instrument the code to expose RED metrics for each component.
- **Reading the graphs** (symptoms before causes, percentiles, CPU against response time, pools, the diagnosis table, incidents and postmortems) lives in the `observability` skill's [observability DIAGNOSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/DIAGNOSE.md).

### Build each dashboard

- **One story or question per dashboard.** Order it from large to small, general to specific. If a dashboard has no goal, ask whether you need it. Show only the data that answers the question (for example only the servers in trouble).
- **Reduce cognitive load.** Check that you can tell exactly what each graph represents, and how long someone else would take to figure it out.
- **Write the monitoring strategy down** (Wikimedia's runbook is a worked example: https://wikitech.wikimedia.org/wiki/Performance/Runbook/Grafana_best_practices).
- **Lay out service hierarchies.** For RED: request and error rate on the left, latency on the right, one row per service, row order following the data flow. Build hierarchical dashboards that drill down to the next level, and cross-reference related dashboards.
- **Compare like to like.** Split service dashboards when the magnitude differs, so aggregated metrics don't drown out important information.
- **Make charts expressive.** Meaningful color (blue good, red bad; thresholds help) and normalized axes (CPU as a percentage, normalized by number of cores). Use left and right Y-axes for series with different units or ranges.
- **Turn stacking off in most cases.** Stacked graphs can mislead and hide important data.
- **Avoid unnecessary refreshing.** If the data changes every hour, you don't need a 30-second refresh rate.
- **Document in place.** Dashboard docs in a Text panel (purpose, links, instructions); panel docs in the panel description (shown on hover over the `i`).
- **Panels that make causes readable:** CPU utilization next to a CPU throttle metric (containers), cache hit rate, per-process event loop lag (Node), queue length or wait time, connection wait time ([observability DIAGNOSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/DIAGNOSE.md)).
- **A weekly comparison panel** draws last week's same-weekday P99 on top of today's. A 1%-a-day decline produces zero alerts over four weeks: "An alert is a way to catch momentary problems, not a way to find slow decline. Comparison is."
- **Split metrics by version label during a canary,** because in a gradual rollout "the metrics of the two versions can blend together"; compare canary and existing "at the same time, under the same traffic conditions."
- **Aim for fewer than 20 panels,** use rows (collapsible) to group, and use folders as RBAC boundaries with consistent tags.

### Maturity model

| Level | Signs |
|---|---|
| Low (default) | Everyone can modify dashboards; lots of copies, little reuse; one-off dashboards that hang around; no version control; lots of browsing and searching; no alerts pointing to the right dashboard |
| Medium (methodical) | Template variables prevent sprawl (no dashboard per node; the data source can be a variable too, reusing one dashboard across clusters and backends); dashboards follow an observability strategy; hierarchical drill-downs; like compared to like; expressive charts; directed browsing ("Template variables make it harder to 'just browse'"; "Most dashboards should be linked to by alerts"; links direct the browsing); dashboard JSON in version control |
| High (optimized) | Sprawl actively reduced (regular review, only approved dashboards in the master list, usage tracked with Enterprise "Usage insights"); consistency by design; dashboards generated from scripting libraries; "No editing in the browser. Dashboard viewers change views with variables."; browsing is the exception; experiment in a separate Grafana instance and promote proven dashboards |

- **Generating dashboards from code:** the best-practices page names grafonnet (Jsonnet) and grafanalib (Python); the observability-as-code page says "Grafonnet is not officially supported by Grafana. Instead, use the Foundation SDK". Confirm in the current docs ([PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#grafana-as-code)).

## Managing dashboards

- **Avoid sprawl.** "Duplicating dashboards and changing 'one thing' (worse: keeping original tags) is the easiest kind of sprawl." Review and remove periodically.
- **Don't copy to customize.** A copy misses updates to the original; link to the master dashboard with URL parameters instead. If you must copy, rename it clearly and don't copy the tags (tags drive search, so copies give false matches).
- **Mark experiments.** Put `TEST` or `TMP` in the name (or prefix `TEST:`), add your name or initials in the name or a tag for ownership, delete when done.
- **Keep a dashboard of dashboards:** dashboard links, panel or data links, a Dashboard list panel (tag or folder search) and a Text panel with markdown.
- **Import** at Dashboards > New > Import: paste JSON, a Grafana.com dashboard ID, or upload a file. Community dashboards are at grafana.com/grafana/dashboards.
- **Settings sections:** General, Annotations, Variables, Links, JSON Model, Versions, Time options.
- **Playlists:** Dashboards > Playlists > New playlist; add by name or tag; set an interval (e.g. 5 minutes); append `?kiosk=1` for kiosk/TV mode.
- **Keyboard:** `Ctrl+S` save, `e` panel editor, `v` fullscreen, `d r` refresh all, `d s` settings, `d k` kiosk, `?` shortcuts.
- **App plugins** embed dashboards with `@grafana/scenes` (not covered here).

## The JSON model

Reference: https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/

| Root field | Notes |
|---|---|
| `uid` | Stable and short; unique across the org; keeps URLs consistent across instances |
| `title`, `tags` | Don't reuse a `title` within a folder |
| `time` | `from`/`to` relative (`now-1h`) or absolute ISO |
| `refresh` | `"30s"`, `"1m"`, `"5m"`, `""` (off) |
| `timezone` | e.g. `"browser"` |
| `schemaVersion` | `41` for Grafana 11+ |
| `templating.list` | Variables |
| `annotations.list` | Annotation queries |
| `panels` | Panels with `gridPos` |

- **Relative time:** `now-5m`, `now-1h`, `now-24h`, `now-7d`, `now/d` (today so far), `now-1d/d` (yesterday).
- **`gridPos` is a 24-column grid.** Widths: full 24, half 12, third 8, quarter 6. Height: 1 unit is about 30 px. `x + w` must be at most 24.

Minimal dashboard with thresholds (the base step has `"value": null`):

```json
{
  "title": "Service Overview",
  "uid": "service-overview",
  "time": { "from": "now-1h", "to": "now" },
  "refresh": "30s",
  "panels": [
    {
      "type": "timeseries",
      "title": "Request Rate",
      "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "datasource": { "type": "prometheus" },
          "expr": "rate(http_requests_total{job=\"$job\"}[5m])",
          "legendFormat": "{{method}} {{status}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "red", "value": 1000 }
            ]
          }
        }
      }
    }
  ]
}
```

A full panel with legend calculations and tooltip:

```json
{
  "id": 1,
  "type": "timeseries",
  "title": "Request Rate",
  "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
  "datasource": { "type": "prometheus", "uid": "${datasource}" },
  "targets": [{
    "expr": "sum(rate(http_requests_total{job=\"$job\"}[5m])) by (status_code)",
    "legendFormat": "{{status_code}}",
    "refId": "A"
  }],
  "fieldConfig": {
    "defaults": {
      "unit": "reqps",
      "thresholds": { "mode": "absolute", "steps": [
        { "color": "green",  "value": null },
        { "color": "yellow", "value": 1000 },
        { "color": "red",    "value": 5000 }
      ]}
    },
    "overrides": []
  },
  "options": {
    "legend":  { "calcs": ["mean","max","last"], "displayMode": "table", "placement": "bottom" },
    "tooltip": { "mode": "multi", "sort": "desc" }
  }
}
```

- **Dashboards v2 / dynamic dashboards** must be provisioned in the Kubernetes resource format (`"kind": "Dashboard"`, `"apiVersion": "dashboard.grafana.app/v1"`); see [PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#dashboard-provisioning).

## Push and verify through the API

The token needs `dashboards:write`. After every push, check the returned `version` and GET the dashboard by `uid`.

```bash
# 1. Build the payload: wrap the dashboard JSON, set folder, mark overwrite
cat > /tmp/dash.json <<'JSON'
{
  "dashboard": {
    "uid": "demo-svc-v1",
    "title": "Demo Service",
    "schemaVersion": 41,
    "tags": ["demo"],
    "time": { "from": "now-1h", "to": "now" },
    "templating": { "list": [] },
    "panels": [{
      "id": 1, "type": "timeseries", "title": "Request Rate",
      "gridPos": { "x": 0, "y": 0, "w": 24, "h": 8 },
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "targets": [{
        "expr": "sum(rate(http_requests_total[5m])) by (status_code)",
        "legendFormat": "{{status_code}}", "refId": "A"
      }],
      "fieldConfig": { "defaults": { "unit": "reqps" }, "overrides": [] }
    }]
  },
  "folderUid": "",
  "overwrite": true,
  "message": "initial push"
}
JSON

# 2. Validate the JSON BEFORE you send it (catches trailing-comma typos)
jq empty /tmp/dash.json && echo "json ok"

# 3. POST
RESP=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$GRAFANA/api/dashboards/db" -d @/tmp/dash.json)
echo "$RESP" | jq '{status, uid, url, version}'
# Expect: status="success", url="/d/demo-svc-v1/...", version=1 (incremented on each push)

# 4. Verify the round-trip: read it back and confirm one panel + the expected title
curl -s -H "Authorization: Bearer $TOKEN" \
  "$GRAFANA/api/dashboards/uid/demo-svc-v1" \
  | jq '{title: .dashboard.title, panels: (.dashboard.panels | length)}'
# Expect: {"title":"Demo Service","panels":1}
```

- **Folder key conflict:** the dashboarding skill sends `"folderUid"`; the Grafana OSS API reference sends `"folderUID"`. Confirm in the current HTTP API docs (https://grafana.com/docs/grafana/latest/developers/http_api/dashboard/).
- **Change an existing dashboard** (for example add a `$job` variable): GET it, append the variable to `templating.list`, change the expr to `rate(http_requests_total{job=~"$job"}[5m])`, POST it back with `overwrite: true`, and check the dropdown appears.
- **Open it in a browser** after the GET round-trip.

## Panels and visualizations

Reference: https://grafana.com/docs/grafana/latest/panels-visualizations/

### Pick the panel

| Data | Panel |
|---|---|
| Anything over time (default) | Time series |
| One number | Stat, Gauge, Bar gauge |
| Categorical | Pie chart, Bar gauge, Table |
| Logs, traces, profiles | Logs, Traces, Flame graph |
| 2D distribution | Heatmap |

| Panel | Notes |
|---|---|
| Time series | Lines, bars or points; stacking None, Normal or 100%; left/right Y axis; supports alerting |
| Stat | Sparkline; color modes value, background, none |
| Gauge, Bar gauge | Bar gauge modes: gradient, retro LCD, basic |
| Table | Sort; cell modes color text, background, gradient gauge; pagination; sparklines |
| Heatmap | Pre-bucketed Prometheus histograms or raw data |
| Pie chart | Pie or donut |
| Logs | Loki; level coloring, dedup, prettify JSON |
| Traces | Tempo; waterfall |
| Flame graph | Pyroscope profiles |
| Node graph | Service dependency maps, network topology; nodes and edges, node color and size configurable by metric |
| Geomap | Markers, heatmap or route layers; GeoJSON |
| Text | Markdown; holds dashboard docs |
| Candlestick | OHLC or min-max-avg |
| Dashboard list | Dashboards by tag or folder search |

Also available: Bar chart, Histogram, Canvas, State timeline, Status history, XY chart, Alert list.

### The panel editor

- **Right sidebar tabs:** Query, Transform, Alert. The "Table view" toggle shows raw results.
- **Query options:** Max data points, Min interval, Interval, Relative time (a panel-only range), Time shift.
- **Panel Inspect:** Data, Stats, JSON, Query.
- **Prometheus legend:** `{{label_name}}`; choose range or instant query.

## Field config, units and thresholds

- **Standard options:** Unit, Min/Max, Decimals, Display name, Color scheme, No value.
- **Thresholds** are absolute or percentage.
- **Value mappings** turn a value, range or regex into text.
- **Field overrides** match by name, name regex, type, or query `refId`.

| Unit id | Meaning |
|---|---|
| `reqps` | Requests per second |
| `ops` | Operations per second |
| `Bps` | Bytes per second |
| `percentunit` | 0.0 to 1.0 shown as % |
| `bytes` | Auto-scales |
| `decbytes` | 1 KB = 1000 B |
| `ms`, `s` | Milliseconds, seconds |
| `dtdurationms` | 1h 2m 3s |
| `short` | 1.2k, 3.4M |
| `none` | Raw number |

## Variables

Reference: https://grafana.com/docs/grafana/latest/dashboards/variables/

- **One dashboard with a variable beats one dashboard per server** ("single-source dashboards"). Changing a variable updates every element using it; variables show as drop-downs or text fields at the top.
- **Usable in** data source queries, panel repeating options, dashboard and panel links, titles, descriptions, transformations. A template is any query containing a variable (text starting with `$`).
- **Two kinds:** variables you create (dashboard-specific) and global variables (time range, dashboard name, organization, signed-in user).
- **Where:** Edit > Dashboard options icon > Variables. Further pages cover chained, multi-property and regex-filtered variables, variable syntax and inspecting variables.

| Type | Use |
|---|---|
| Query | Values from a data source query: server names, metric names, label values |
| Custom | Fixed list |
| Text box | Free-form input |
| Constant | Reusable value viewers don't change |
| Data source | Switch between data source instances |
| Interval | Change the time grouping or aggregation interval |
| Filters | Dashboard-wide key/value filters for supported data sources |
| Switch | Toggle between two configured values |

```json
{
  "templating": {
    "list": [
      {
        "name": "namespace",
        "type": "query",
        "datasource": { "type": "prometheus", "uid": "prom" },
        "definition": "label_values(kube_pod_info, namespace)",
        "includeAll": true,
        "multi": true
      },
      {
        "name": "env",
        "type": "custom",
        "query": "production,staging,dev",
        "current": { "value": "production" }
      },
      {
        "name": "interval",
        "type": "interval",
        "query": "1m,5m,15m,1h",
        "auto": true
      }
    ]
  }
}
```

```json
{ "name":"job", "type":"query", "datasource":{"type":"prometheus","uid":"prometheus"},
  "query":{"query":"label_values(up, job)","refId":"A"},
  "refresh":2, "includeAll":true, "multi":true, "label":"Service" }

{ "name":"cluster", "type":"constant", "query":"production", "label":"Cluster" }

{ "name":"datasource", "type":"datasource", "pluginId":"prometheus",
  "includeAll":false, "label":"Prometheus" }
```

- **Reference with `$variable`:** `rate(http_requests_total{namespace="$namespace"}[$interval])`.
- **Multi-value expands to a regex OR:** `$job=["api","worker"]` becomes `job=~"api|worker"`, so match multi-value variables with `=~`.
- **Chain variables:** `label_values(kube_pod_info{namespace=\"$namespace\"}, pod)`.
- **Variable query syntax is data-source-specific.** Prometheus: `label_values(metric_name, label_name)`, `label_values(label_name)`, `metrics(prefix)`, `query_result(promql_expression)`. Loki: `label_names()`, `label_values(label_name)`, `label_values({job="nginx"}, pod)`.
- **URL sync:** values sync to the URL as `var-<varname>=value`. Set `skipUrlSync: true` in the JSON to keep URLs clean, prevent URL overrides or avoid exposing sensitive values; Constant variables default to `skipUrlSync: true`.

### Built-in variables

| Variable | Value |
|---|---|
| `$__interval` | Auto from range and resolution |
| `$__rate_interval` | For `rate()`; at least 4x the scrape interval. Example: `rate(http_requests_total[${__rate_interval}])` |
| `$__from`, `$__to` | Range bounds, ms epoch |
| `$__range`, `$__range_s`, `$__range_ms` | Range length (e.g. "6h") |
| `${__value.raw}`, `${__field.name}`, `${__field.labels.job}` | In data links |
| `${__url.params}` | Current URL parameters, in links |

## Transformations and expressions

Reference: https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/

- **Transformations run in sequence.** The "Debug" toggle shows each step's input and output.
- **UI names:** Reduce, Filter by name, Filter by value, Organize fields, Merge, Join by field, Group by, Sort by, Limit, Add field from calculation, Convert field type, Rename by regex, Extract fields, Labels to fields, Rows to fields, Prepare time series, Time series to table.
- **JSON ids:** `merge`, `organize`, `rename`, `calculateField`, `filterByValue`, `groupBy`, `sortBy`, `limit`, `labelsToFields`, `seriesToRows`, `partitionByValues`.

```json
"transformations": [
  { "id": "merge", "options": {} },
  { "id": "organize", "options": {
      "renameByName":  { "Value #A": "Request Rate", "Value #B": "Error Rate" },
      "excludeByName": { "Time": true }
  }},
  { "id": "calculateField", "options": {
      "alias": "Error %", "mode": "reduceRow",
      "reduce": { "reducer": "last" },
      "binary": { "left": "errors", "right": "total", "operator": "/" }
  }},
  { "id": "filterByValue", "options": {
      "filters": [{ "fieldName":"Error %", "config":{ "id":"greater", "options":{ "value":0.01 }}}],
      "type": "include", "match": "any"
  }}
]
```

- **Server-side expressions:** Math (`$A + $B`, `$A / $B * 100`), Reduce, Resample, Classic conditions. Error rate: `Expression C (Math): $B / $A * 100`. Alert rules use the same expressions ([ALERTING.md](ALERTING.md)).

## Links and annotations

```json
"links": [
  { "title":"Go to details", "url":"/d/details?var-service=${__field.labels.service}", "targetBlank":false },
  { "title":"Runbook",        "url":"https://wiki.example.com/runbook/${job}", "icon":"external link",
    "targetBlank":true, "type":"link" }
]
```

- **Mark deploys first.** "Half of incident analysis is the question 'did this change happen before the deploy or after' … for the cost, no other monitoring improvement pays off more" ([observability INCIDENT-RESPONSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INCIDENT-RESPONSE.md#the-thirty-minutes-after-a-deploy)).
- **Annotation types:** native (manual: Ctrl/Cmd+click a time series panel) and query annotations. Create them through the API too ([PROVISIONING-AND-API.md](PROVISIONING-AND-API.md#annotations)).

Deploys from Loki:

```json
{ "datasource":{"type":"loki","uid":"loki"},
  "expr":"{job=\"deployments\"} |= \"deployed\"",
  "name":"Deployments", "iconColor":"blue",
  "titleFormat":"{{service}} deployed", "textFormat":"{{version}} by {{author}}" }
```

Deploys from Prometheus:

```json
{ "datasource":{"type":"prometheus","uid":"prometheus"},
  "expr":"changes(kube_deployment_status_observed_generation{namespace=\"production\"}[5m]) > 0",
  "step":"60s", "name":"Deployments", "iconColor":"blue",
  "titleFormat":"Deploy: {{deployment}}" }
```

## SQL and other data source queries

- **SQL macros:** `$__time(column)`, `$__timeFilter(column)`, `$__timeFrom()`, `$__timeTo()`, `$__timeGroup(column, interval)`, `$__timeGroupAlias(column, interval)`, `$__unixEpochFilter(column)`, `$__interval`.

```sql
SELECT
  $__timeGroup(created_at, $__interval) AS time,
  status,
  count(*) AS cnt
FROM orders
WHERE $__timeFilter(created_at)
GROUP BY 1, 2
ORDER BY 1
```

PostgreSQL (SSL mode `disable`, `require`, `verify-ca` or `verify-full`):

```sql
SELECT
  time_bucket('$__interval', time) AS time,
  avg(value)
FROM metrics
WHERE time BETWEEN $__timeFrom() AND $__timeTo()
GROUP BY 1
ORDER BY 1
```

- **SQL annotations** select `time`, `title AS text`, `tags` with `$__timeFilter(time)`.
- **InfluxDB:** 1.x InfluxQL uses `WHERE $timeFilter GROUP BY time($interval)`; 2.x/3.x Flux uses `v.timeRangeStart`, `v.timeRangeStop`, `v.windowPeriod`.
- **PromQL, LogQL, TraceQL:** [PROMQL.md](PROMQL.md), [LOKI.md](LOKI.md), [TEMPO.md](TEMPO.md).

## Library panels, versions, sharing

- **A library panel is reusable in any dashboard;** a change propagates to every instance. It is saved in a folder alongside dashboards, with RBAC permissions.
- **Create:** Edit > panel menu **More > New library panel** > name, folder > Create library panel > save the dashboard (the source panel is converted too, so you must save the original dashboard).
- **Use:** **Use library panel** opens the "Add panel from panel library" drawer. **More > Unlink library panel** changes one instance without affecting others; **More > Replace library panel** swaps it. **Dashboards > Library panels** lists where each is used and deletes them.
- **Versions:** Settings > Versions to diff and restore.
- **Sharing options:**

| Option | Notes |
|---|---|
| Link | Lock the time range, include variable values |
| Snapshot | Read-only, public, rendered data; expiry 1 hour, 1 day, 7 days or never |
| Export | JSON |
| Embed | iframe; requires anonymous access in Grafana config (OSS/Enterprise only) and `[security] allow_embedding = true` |
| Public dashboards | Grafana 10+, enabled per dashboard (`[feature_toggles] enable = publicDashboards`) |

## Performance

- **Limit max data points** and use longer min intervals for historical dashboards.
- **Use `$__interval`, and `$__rate_interval` instead of hard-coded rate windows.**
- **Move expensive queries to recording rules** ([PROMETHEUS.md](PROMETHEUS.md)).
- **Keep under 20 panels** per dashboard.

## Common problems

| Symptom | Cause |
|---|---|
| `412 Precondition Failed` on `POST /api/dashboards/db` | The `uid` exists and `overwrite: true` is not set |
| Panel shows "Datasource not found" | `datasource.uid` in `targets` doesn't match an existing data source UID |
| Panel `gridPos` invalid | `w + x` must be at most 24 on the 24-column grid |
| Variable `query` doesn't work | The `query` field is data-source-specific syntax (PromQL `label_values(...)`, LogQL `{label="..."}`, SQL) |
| `403 Forbidden` on create | Service account lacks Editor on the target folder |
| "Cannot save provisioned dashboard" | The dashboard is file-provisioned with `allowUiUpdates: false` |

## Prove it

- `jq empty dash.json` passes before every push.
- The push response shows `status="success"` and a `version` one higher than before; `GET /api/dashboards/uid/<uid>` returns the expected title and panel count.
- Every panel's `datasource.uid` matches a UID from `GET /api/datasources`, and no panel shows "Datasource not found".
- Every row's `gridPos` widths sum to at most 24.
- Multi-value variables are matched with `=~`, and switching each variable in the browser changes every panel that uses it.
- The dashboard answers one named question, has a Text panel or descriptions documenting it, and at least one alert links to it.
