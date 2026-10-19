# Tempo

Storing and querying traces with Grafana Tempo and TraceQL. Tempo accepts OTLP, Jaeger, Zipkin, OpenCensus and Kafka and stores Parquet blocks in S3, GCS or Azure. A TraceQL query is evaluated one trace at a time as a pipeline, and its speed is decided mostly by the time range, scoped attributes and trace-level intrinsics. Instrumenting services with OpenTelemetry is in [the observability skill](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md); collector pipelines are in [ALLOY.md](ALLOY.md). Docs: https://grafana.com/docs/tempo/latest/ ; TraceQL: https://grafana.com/docs/tempo/latest/traceql/

**Contents:** [Architecture](#architecture) · [Run and send traces](#run-and-send-traces) · [What to put in spans](#what-to-put-in-spans) · [TraceQL](#traceql) · [TraceQL metrics](#traceql-metrics) · [Metrics generator](#metrics-generator) · [Grafana data source](#grafana-data-source) · [HTTP API](#http-api) · [Tuning and troubleshooting](#tuning-and-troubleshooting) · [Prove it](#prove-it)

## Architecture

- **Components:** Distributor (receives spans, routes by traceID hash; 4317 gRPC, 4318 HTTP), Live Store (buffers recent data on local disk), Query Frontend (query orchestrator and sharding; 3200), Querier (executes search against storage), Compactor (merges blocks, retention), Block Builder (final Parquet blocks to object storage), Metrics Generator (RED metrics from spans).
- **Prerequisites:** Docker (quick start) or Kubernetes (production); an object storage bucket (S3/GCS/Azure) for distributed deployments; an OTLP-emitting app or `tempo-cli` for synthetic traffic; a Grafana stack with a Tempo data source.
- **Conflict (write path):** the Tempo skill describes the write path as distributor to live-store to block-builder to object storage, with a component map of Distributor to Kafka to Live Stores, Block Builders and Metrics Generator; its Helm verify step and troubleshooting still list ingesters (distributor, ingester, querier, query-frontend, compactor; `tempo_ingester_*`, `tempo_ingester_live_traces`, `max_block_bytes`). Confirm in the current docs.

| Port | Use |
|---|---|
| 3200 | HTTP API |
| 9095 | gRPC internal |
| 4317 / 4318 | OTLP gRPC / HTTP |
| 14268 | Jaeger Thrift HTTP |
| 14250 | Jaeger gRPC |
| 6831 / 6832 (UDP) | Jaeger Compact / Binary |
| 9411 | Zipkin |
| 7946 | memberlist |

- **Production:** replication factor 3; object storage for distributed mode; dedicated Parquet attribute columns for the most-queried attributes; per-tenant retention via `overrides`; watch `tempo_ingester_live_traces`.
- **Multi-tenancy:** `multitenancy_enabled: true` and the `X-Scope-OrgID` header. OTel Collector: `exporters.otlp.headers.x-scope-orgid: tenant-id`. Grafana data source: `jsonData.httpHeaderName1: "X-Scope-OrgID"`, `secureJsonData.httpHeaderValue1: "tenant-id"`.

## Run and send traces

- **Local:** `git clone https://github.com/grafana/tempo.git`, `cd tempo/example/docker-compose/local`, `mkdir -p tempo-data`, `docker compose up -d`. Check `curl -sf http://localhost:3200/ready`; Grafana is at http://localhost:3000.
- **Send a synthetic OTLP span and read it back:**

```bash
curl -X POST -H 'Content-Type: application/json' \
  http://localhost:4318/v1/traces \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"my-service"}}]},
       "scopeSpans":[{"spans":[{"traceId":"5B8EFFF798038103D269B633813FC700","spanId":"EEE19B7EC3C1B100",
       "name":"my-op","startTimeUnixNano":1689969302000000000,"endTimeUnixNano":1689969302500000000,"kind":2}]}]}]}'
curl -s http://localhost:3200/metrics | grep tempo_distributor_spans_received_total | head
curl -s http://localhost:3200/api/v2/traces/5B8EFFF798038103D269B633813FC700 | jq '.batches | length'
```

- **Then in Grafana:** Explore > Tempo, run `{resource.service.name="my-service"}`.
- **Alloy OTLP forwarder** (verify with `curl -s http://localhost:12345/metrics | grep otelcol_exporter_sent_spans`):

```alloy
// alloy.river
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }
  output { traces = [otelcol.exporter.otlp.tempo.input] }
}

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
    tls { insecure = true }
  }
}
```

- **Kubernetes:** `helm repo add grafana https://grafana.github.io/helm-charts`, `helm install tempo grafana/tempo-distributed --version 1.61.3 --set storage.trace.backend=s3 --set storage.trace.s3.bucket=my-tempo-bucket --set storage.trace.s3.region=us-east-1`, verify every pod is Ready with `kubectl get pods -n default -l app.kubernetes.io/instance=tempo`, then `kubectl port-forward svc/tempo-query-frontend 3200:3200` and `curl -sf http://localhost:3200/ready`.
- **Cost:** tail-sample traces to 5 to 10% and keep errors and slow spans ([CARDINALITY-AND-COST.md](CARDINALITY-AND-COST.md#cost-management)). Grafana Cloud Traces meters GBs processed, written and retained. The old source said spans ingested; span counts remain a telemetry measure, not the current billing unit. [https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/traces/]

## What to put in spans

Docs: https://grafana.com/docs/tempo/latest/set-up-for-tracing/instrument-send/best-practices/

- **Span vs resource attributes.** A span attribute is context for its span (`http.url`, `http.status_code`); a resource attribute is context about how the span was collected and the process that created it (`k8s.namespace`, `k8s.container_name`, `k8s.cluster`).
- **Follow OpenTelemetry semantic conventions** with consistent nested namespaces (`http` with `url` and `status_code`; nested `http.url.protocol`, `http.url.path`).
- **Keep attributes to a minimum:** each adds overhead, and in Grafana Cloud higher tracing cost. Only attributes relevant to the operation; if unsure, leave it out. Don't put metrics or logs in span attributes; no redundant attributes. The OTel default limit is 128 attributes per span.
- **Where to add spans:** determine the smallest piece of work you need to observe; add a span for calls to other services. For a loop, one span with an attribute counting iterations, not one span per call inside it (that makes hundreds or thousands of worthless spans).
- **Span length:** many spans or long-running spans slow queries; ingestion limits are configurable (Cloud Traces users contact Support). Break up complex SQL into spans per significant operation, start a new span per interval for long operations, and use span links for batched later processing.

## TraceQL

Structure: `{ filters } | pipeline`. `{}` selects spans; `{ }` matches everything. Docs: https://grafana.com/docs/tempo/latest/traceql/construct-traceql-queries/

### Scopes, intrinsics and literals

- **Intrinsics use `<scope>:` (colon); attributes use `<scope>.` (period).** Attribute scopes: `span.`, `resource.`, `link.`, `event.`, `instrumentation.`. The `trace` scope has only intrinsics; `resource` has none.
- **Scope your attributes** (`span.http`, `resource.namespace`): Tempo then scans only the data you ask about, which is a significant performance gain.

| Intrinsic | Values or meaning |
|---|---|
| `span:status` | `error`, `ok`, `unset` |
| `span:statusMessage`, `span:name`, `span:id`, `span:parentID` | |
| `span:duration` | span duration |
| `span:kind` | `server`, `client`, `producer`, `consumer`, `internal`, `unspecified` |
| `span:childCount` | vParquet5+ |
| `trace:duration` | max(end) - min(start) |
| `trace:rootName`, `trace:rootService`, `trace:id` | |
| `event:name`, `event:timeSinceStart` | |
| `link:spanID`, `link:traceID` | |
| `instrumentation:name`, `instrumentation:version` | |

The unscoped shorthand also works: `name`, `status`, `duration`, `kind`, `traceDuration`, `rootServiceName`, `rootName`, alongside `span.http.status_code`, `resource.service.name` and `event.name`.

- **Prefer trace-level intrinsics:** they are significantly more performant than span-level ones and faster than aggregations (`trace:duration`, `trace:rootService`).
- **Unscoped `duration` is `span:duration`, not `trace:duration`.** If latency percentiles don't match expectations, check which one you are querying.
- **Quoted names:** `{ span."attribute name with space" = "value" }`; only `\"` and `\\` escapes.
- **Literals:** integers, `minInt`/`maxInt`, durations `ns us ms s m h` (signed allowed), floats, strings, and `nil` (`= nil` missing, `!= nil` present).
- **Operators:** `= != > >= < <=`, `=~ !~` (Go RE2, fully anchored: `=~ "bar"` means `^bar$`, use `.*bar.*` for unanchored), `&& || !`.
- **Arrays (vParquet4+):** `=`/`=~` match if any element matches; `!=`/`!~` only if no element matches.

### Writing queries

- **Start broad, then filter:** begin with `{ }`. Combine conditions on the same span with `&&`; use `|` for aggregations and transformations; group with `by(field)`.
- **Everything inside one `{}` must hold on the same span.** `{ resource.cloud.region = "us-east-1" && resource.cloud.region = "us-west-1" }` returns nothing; use `{…} && {…}`. `{ resource.cloud.region =~ "us-east-1|us-west-1" }` is faster than `{…} || {…}`.
- **Name a specific operation** with both span `name` and `resource.service.name`: `{resource.service.name = "frontend" && name = "POST /api/orders"}`. Across environments, add `resource.service.namespace` and `resource.deployment.environment`.
- **Always include time bounds;** use `attribute != nil` to test existence; scope tag discovery with a TraceQL query.

```traceql
# All errors
{ status = error }

# Slow requests from a service
{ resource.service.name = "frontend" && duration > 1s }

# HTTP 5xx
{ span.http.status_code >= 500 }

# Count errors per trace (>=2)
{ status = error } | count() >= 2

# Select fields
{ status = error } | select(span.http.url, duration, resource.service.name)

# Structural: server span with downstream error
{ kind = server } >> { status = error }

# Both conditions present anywhere
{ span.db.system = "redis" } && { span.db.system = "postgresql" }

# Deterministic most-recent
{ resource.service.name = "api" } with (most_recent=true)
```

More from the docs:

- Outcome of an operation: `{ resource.service.name="frontend" && name = "POST /api/orders" && status = error }`.
- Range: `{ span.http.status_code >= 200 && span.http.status_code < 300 } | count() > 2`.
- Behaviour across spans (cache problems show as DB access ratios): `{span.service.name="frontend" && name = "GET /api/products/{id}"} && {span.db.system="postgresql"}`. Environment leaks: `{ resource.deployment.environment = "production" } && { resource.deployment.environment = "staging" }`.
- `{ span.http.status_code = 200 } | select(resource.service.name)`; `{ trace:duration > 5s }`; `{ resource.deployment.environment = "production" && trace:duration > 2s } | count() > 30`.
- Over-instrumentation: `{ span:duration < 5ms } | count_over_time() by(resource.service.name) | topk(10)`.

### Structural operators

- `>>` descendant, `<<` ancestor, `>` child, `<` parent, `~` sibling. They always return the right-side matches: `{ resource.service.name="frontend" } >> { status = error }`; leaf spans `{ } !< { resource.service.name = "productcatalogservice" }`.
- **Union forms** `&>> &<< &> &< &~` return both sides: `{ span.http.url = "/path/of/api" && status = error } &>> { status = error }`.
- **Experimental negations** `!>> !<< !> !< !~` may return false positives. The last error in a cascade: `{ status = error } !< { status = error }`.
- **Child count (vParquet5+):** `{ span:childCount = 0 }`, `{ span:childCount > 10 }`.
- Use structural operators (`>>`, `&&`) for root-cause questions.

### Aggregates, arithmetic and selection

- Aggregators `count avg max min sum`: `{ span.http.status_code = 200 } | count() > 3`; `{ } | sum(span.bytesProcessed) > 1000000000`.
- Grouping: `{ status = error } | by(resource.service.name) | count() > 1`.
- Arithmetic: `{ span.http.request_content_length > 10 * 1024 * 1024 }`.
- `| select(span.http.status_code, span.http.url)` is cheap: fields are fetched only after the criteria match.
- **`with (most_recent=true)`** (experimental) returns the most recent traces sorted by start time; it uses `most_recent_shards` in `query_frontend` (default 200). The docs say this hint makes search non-deterministic; the vendor skill labels its example "deterministic most-recent". Confirm in the current docs.

## TraceQL metrics

Builds metrics from traces by applying a function to a TraceQL query, like LogQL metric queries. It must be enabled on the Tempo database; querying from Grafana needs Grafana Cloud or Grafana 10.4+. Docs: https://grafana.com/docs/tempo/latest/metrics-from-traces/metrics-queries/

- **Functions:** `rate`, `count_over_time`, `sum_over_time`, `max_over_time`, `min_over_time`, `avg_over_time`, `quantile_over_time`, `histogram_over_time`, `compare`; then `topk`, `bottomk` and comparison operators on results. Arithmetic between parenthesized sub-queries: `100 * ({status=error} | rate()) / ({} | rate())`.

```traceql
# Error rate per service
{ status = error } | rate() by (resource.service.name)

# P99 latency
{ kind = server } | quantile_over_time(duration, .99) by (resource.service.name)
```

- **Exemplars:** set `query_frontend.metrics.max_exemplars`, or the hint `{ span:name = "GET /:endpoint" } | quantile_over_time(duration, .99) by (span.http.target) with (exemplars=true)`.
- **vParquet5** uses a span-only fetch layer by default for metrics queries without structural operators. Opt out with `with (spanonly_fetch=false)` (requires `unsafe_query_hints`) or per tenant with `metrics_spanonly_fetch: false`.
- The metrics generator's Local Blocks processor runs TraceQL metrics on recent data.

## Metrics generator

```yaml
metrics_generator:
  storage:
    path: /var/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true

overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
```

- **Service Graphs** produce `traces_service_graph_request_total`, `traces_service_graph_request_failed_total` and duration histograms.
- **Span Metrics** produce `traces_spanmetrics_calls_total` and `traces_spanmetrics_duration_seconds_*` with `service`, `span_name`, `span_kind`, `status_code`.

## Grafana data source

Traces-to-logs, traces-to-metrics, traces-to-profiles and the service map:

```yaml
datasources:
  - name: Tempo
    type: tempo
    url: http://tempo:3200
    jsonData:
      tracesToLogsV2:
        datasourceUid: loki-uid
        filterByTraceID: true
        tags: [{key: "service.name", value: "app"}]
      tracesToMetrics:
        datasourceUid: prometheus-uid
        tags: [{key: "service.name", value: "service"}]
        queries:
          - name: Error Rate
            query: 'sum(rate(traces_spanmetrics_calls_total{$$__tags, status_code="STATUS_CODE_ERROR"}[5m]))'
      tracesToProfiles:
        datasourceUid: pyroscope-uid
        tags: [{key: "service.name", value: "service_name"}]
      serviceMap:
        datasourceUid: prometheus-uid
```

Dashboards are in [DASHBOARDS.md](DASHBOARDS.md); profiles are in [PYROSCOPE.md](PYROSCOPE.md).

## HTTP API

- `GET /api/search?q={status=error}&limit=20&start=<unix>&end=<unix>`
- `GET /api/traces/<traceID>`, `GET /api/v2/traces/<traceID>`
- `GET /api/search/tags`, `GET /api/search/tag/service.name/values`
- `GET /api/metrics/query_range?q={status=error}|rate()&start=...&end=...&step=60`
- `GET /ready`

```bash
curl -sG --data-urlencode 'q={resource.service.name="frontend" && duration > 1s}' \
  --data-urlencode "start=$(date -d '1h ago' +%s)" --data-urlencode "end=$(date +%s)" \
  http://localhost:3200/api/search | jq '.traces | length'
```

## Tuning and troubleshooting

| Symptom | Fix |
|---|---|
| `/ready` returns 503 | Ingester still joining; check `tempo_ingester_*` metrics and logs |
| 429 on push | Raise `max_outstanding_per_tenant` or the per-tenant ingest limits |
| No traces in Explore | Confirm `X-Scope-OrgID` matches between the writer and the Grafana data source |
| Slow TraceQL | Narrow `start`/`end`, add a `service.name` filter, enable dedicated Parquet columns for hot attributes |
| Slow searches | Scale queriers; scale compactors to reduce block count |
| High querier memory | Reduce `max_concurrent_queries`, lower `target_bytes_per_job` |
| High ingester memory | Reduce `max_block_bytes`, lower per-tenant trace limits |
| Slow attribute queries | Dedicated Parquet columns |
| Cache misses | Increase the cache, tune `cache_min_compaction_level` |
| Memcached errors | Increase memcached connections (`-c 4096`) |

## Prove it

- `/ready` returns ready; after sending the synthetic span, `tempo_distributor_spans_received_total` increases and `/api/v2/traces/<traceID>` returns more than 0 batches.
- `/api/search` with your TraceQL and explicit `start`/`end` returns the expected trace count; every saved query scopes its attributes and filters on `resource.service.name`.
- Latency queries say `span:duration` or `trace:duration` explicitly, and the number matches what you meant to measure.
- With the metrics generator on, `traces_spanmetrics_calls_total` appears in Prometheus and the Tempo data source's Error Rate link returns data.
