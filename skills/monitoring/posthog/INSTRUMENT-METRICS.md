# Instrumenting metrics

PostHog Metrics stores named time series (counters, gauges, histograms) sent over OTLP to `/i/v1/metrics`, either from the PostHog SDKs' `posthog.metrics` API or from any OpenTelemetry client. It is in open alpha: any team enables it via Metrics > **Enable metrics** in onboarding, setup details including the ingestion endpoint may change before GA, and alpha retention is 30 days. Most outcomes are decided by series identity: each metric name, type, service and full attribute set is its own series, so low-cardinality attributes and stable names decide whether metrics stay useful and cheap. Investigating metric changes is in [INVESTIGATING-METRICS.md](INVESTIGATING-METRICS.md); logs in [INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md); cross-signal SQL in [HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md); generic OpenTelemetry metrics in the [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md) skill.

**Contents:** [How it works](#how-it-works) · [Workflow](#workflow) · [Browser](#browser) · [Node.js](#nodejs) · [Any OpenTelemetry client](#any-opentelemetry-client) · [Kubernetes metrics agent](#kubernetes-metrics-agent) · [Viewing and querying](#viewing-and-querying) · [Prove it](#prove-it)

## How it works

- **Metric types.** A counter only accumulates (chart it with `rate` per second or `increase` per bucket); a gauge goes up and down (`avg` or latest); a histogram records a distribution (percentiles `p95`/`p99`). Attributes add dimensions.
- **Metrics are pre-aggregated:** the right tool for trends, capacity, health at a glance and alerting ground truth. A queue growing 2%/hour is invisible in logs and traces; a gauge on queue depth shows it on day one. Error ratio = rate(error counter) / rate(request counter); p95 comes from a duration histogram.
- **Good metrics:** stable names (OTel dotted `http.server.duration` or Prometheus `jobs_processed_total` both work; don't mix them within one system), the right type, low cardinality, units in the name or metadata (`duration_ms` or `unit`).
- **Ingestion:** OTLP over HTTP at `/i/v1/metrics`, JSON or protobuf, project token auth; posthog-js `posthog.metrics` speaks OTLP under the hood. A data point is name, type, value or buckets, timestamp, resource attributes and data point attributes. Ingestion validates, applies quota and writes to a columnar time-series store.
- **Log-based metrics** are generated at ingestion from matching log lines (https://posthog.com/docs/logs/metrics).
- **Series identity = metric name + type** (`gauge`, `sum`, `histogram`, `exponential_histogram`, `summary`) **+ service name + full attribute set.** 10 routes x 5 statuses = 50 series; a user ID with a million values = a million series.
- **Temporality.** Cumulative counters (the OTel default): `rate`/`increase` compute per-series differences, then sum; counter resets are detected the same way Prometheus does. Delta counters are summed as-is (temporality is read from the SDK). Histograms are stored as bucket counts and percentiles are interpolated across buckets. Gauges are stored as reported (`avg`, `sum`, percentiles). A float overflow becomes an explicit null gap.

## Workflow

Supported: Web (JS), Node.js, Python via `posthog.metrics`, Kubernetes via the metrics agent, any language via OTLP.

1. **Detect existing metrics:** prom-client, prometheus_client, StatsD/Datadog, OTel meters, Collector config. Check whether posthog-js, posthog-node or posthog-python is installed.
2. **Pick the capture path.** PostHog SDK present: use `posthog.metrics` (no OTel packages). Already exporting OTel metrics: point the existing OTLP exporter or Collector at PostHog (no app code changes beyond exporter config). Otherwise generic OTel.
3. **Add the PostHog call next to the existing metric,** reusing the same name and attributes, so both systems chart the same series while you evaluate. Do not remove or restructure existing instrumentation; read a file immediately before writing it.
4. **Choose what to measure:** count successes and failures of critical flows, time external calls and jobs with histograms, gauge queue depths and pool sizes. Set an explicit unit on histograms (`ms`, `bytes`), stable dot-separated names (`jobs.processed`, `api.request.duration`) and a service name.
5. **Keep cardinality low.** Every unique combination of attribute values creates a new series. Good attributes: `route`, `status`, `plan`, `queue`. Bad: user IDs, session IDs, request IDs, timestamps; each creates a series per user or per request, which makes charts unreadable and ingestion expensive. Per-user detail goes to logs or traces.
6. **Environment variables:** skip if the SDK is configured (`posthog.metrics` reuses the SDK token). Otherwise use the same `projects-get` and region logic as logs ([INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md#workflow)); the OTLP metrics endpoint is `https://us.i.posthog.com/i/v1/metrics` (US) or `https://eu.i.posthog.com/i/v1/metrics` (EU) with an `Authorization: Bearer` header.
7. **Flush short-lived processes before exit** (`posthog.metrics.flush()`, or OTel `forceFlush()`/`shutdown()`), then verify in the Metrics name picker within a minute.

- **Missing PostHog config must never break the app:** the same rule as for logs ([INSTRUMENT-LOGS.md](INSTRUMENT-LOGS.md#workflow)).

## Browser

- **No metrics-specific setup:** no new packages and no extra authentication; the metrics API uses the project token the SDK already has. Metrics requires an up-to-date SDK, so upgrade an older release. Optional service name:

```javascript
posthog.init('<ph_project_api_key>', {
    api_host: 'https://us.i.posthog.com',
    metrics: {
        serviceName: 'storefront-web',
        environment: 'production',
    },
})
```

```javascript
// Counters only go up: things you count
posthog.metrics.count('checkout.completed')

// Gauges go up and down: current values
posthog.metrics.gauge('cart.items', 3)

// Histograms record distributions: durations, sizes
posthog.metrics.histogram('api.request.duration', 187, { unit: 'ms' })

posthog.metrics.count('checkout.completed', 1, { attributes: { plan: 'pro' } })
```

- **Samples aggregate in memory** and flush as one data point per series every few seconds, so hot paths are cheap.

## Node.js

- **Install:** `npm install posthog-node` (an up-to-date version is required).

```javascript
import { PostHog } from 'posthog-node'

const posthog = new PostHog('<ph_project_token>', {
    host: 'https://us.i.posthog.com',
    metrics: { serviceName: 'billing-worker' },
})

// Counters only go up: things you count
posthog.metrics.count('jobs.processed', 1, { attributes: { queue: 'default' } })

// Gauges go up and down: current values
posthog.metrics.gauge('queue.depth', 7)

// Histograms record distributions: durations, sizes
posthog.metrics.histogram('job.duration', 42, { unit: 'ms' })
```

- **One OTLP data point per series every few seconds:** a burst of 10k `count()` calls costs one data point on the wire.
- **Flush before exit** (required for cron, CLIs and serverless):

```javascript
await posthog.metrics.flush()
// or, when tearing down the whole client:
await posthog.shutdown()
```

## Any OpenTelemetry client

```bash
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="https://us.i.posthog.com/i/v1/metrics"
OTEL_EXPORTER_OTLP_METRICS_HEADERS="Authorization=Bearer <ph_project_token>"
OTEL_SERVICE_NAME="my-app"
```

- **Most OTel SDKs pick up these standard env vars.** Set `OTEL_SERVICE_NAME`: it is attached to every series and used by the Metrics UI for filtering.
- **Token:** the project token (`phc_`, the same one used for capturing events and exceptions), never a personal API key (`phx_`).
- **Or in code:** endpoint `https://us.i.posthog.com/i/v1/metrics`, header `Authorization: Bearer <ph_project_token>` or `?token=<ph_project_token>`.
- **An existing Collector:** add PostHog as an additional exporter.
- **Troubleshoot:** the endpoint ends in `/i/v1/metrics` and the token starts `phc_`.

## Kubernetes metrics agent

- **What it does:** scrapes Prometheus-format `/metrics` from pods and forwards them. A single instance by default; scale with **shards**, not replicas (replicas double-count).
- **Prerequisites:** helm v3; pods annotated `prometheus.io/scrape: "true"`; the chart creates a ClusterRole and ClusterRoleBinding.

```bash
helm install posthog-metrics-agent oci://ghcr.io/posthog/charts/posthog-metrics-agent \
  --set posthog.apiKey=<ph_project_token>
```

- **EU:** `--set posthog.host=https://eu.i.posthog.com`. **Existing secret:** `--set posthog.existingSecret=my-posthog-secret` (Secret key `posthog-api-key`). The token is injected as an env var, never put in a ConfigMap.
- **Annotations:** `prometheus.io/scrape` (opt in), `prometheus.io/path` (default `/metrics`), `prometheus.io/port` (default the pod's container port).
- **Static targets:** `--set 'scrape.staticTargets={my-service:9090,another-service:8080}'`; turn off discovery with `scrape.annotationDiscovery=false`; `scrape.extraScrapeConfigs` is raw Prometheus YAML appended verbatim.
- **Durability and scale:** `--set persistence.enabled=true` keeps buffered samples through restarts; `--set shards=4` makes a StatefulSet in which each target is scraped exactly once.
- **Verify:** `kubectl get pods -l app.kubernetes.io/name=posthog-metrics-agent`, `kubectl logs -l app.kubernetes.io/name=posthog-metrics-agent`; agent self-metrics are on port `8888`.

| Value | Default |
| --- | --- |
| `posthog.apiKey` | `''` |
| `posthog.existingSecret` | `''` (takes precedence over apiKey) |
| `posthog.host` | `https://us.i.posthog.com` |
| `scrape.interval` | `15s` |
| `scrape.annotationDiscovery` | `true` |
| `scrape.staticTargets` | `[]` |
| `scrape.extraScrapeConfigs` | `''` |
| `shards` | `1` |
| `persistence.enabled` / `.size` / `.storageClass` | `false` / `10Gi` / `''` |
| `podEnv` | `{}` |
| `resources.requests.cpu` / `.requests.memory` / `.limits.memory` | `100m` / `256Mi` / `512Mi` |
| `rbac.create` | `true` |
| `serviceAccount.create` / `.name` | `true` / `''` (name required when create is false) |
| `nodeSelector`, `tolerations`, `affinity` | `{}`, `[]`, `{}` |

## Viewing and querying

- **UI:** the Metrics sidebar. The **Overview** tab shows services, metric names and active series over the last day. The **Viewer** tab has a name picker and recommends an aggregation by type (counter: `increase`, gauge: `avg`), group by, `key=value` filter chips, an anomaly badge (shows the change against the baseline and the label values that drove it), auto-refresh (every few seconds, for watching a deploy or incident), save as insight or dashboard, and **New service dashboard** (one insight per metric). Data appears within a minute.
- **Query model:** a shared time grid of about 60 points per range, chosen automatically (1 s buckets up to daily or weekly); the interval can be pinned via the API. Filters support equality, negation and regex on resource or data point attributes. Group by keeps the largest series when there are too many. Formulas run server-side, e.g. `errors / requests`.
- **Anomaly detection** compares the most recent slice against a baseline, finds the onset and ranks label values (the anomaly badge and the biggest-movers panel). Raw samples are kept; the Samples view links each sample to its trace when trace context is present.
- **SQL:** table `posthog.metrics`, in the viewer's SQL tab, joinable with other PostHog data ([HOGQL-EXAMPLES-SIGNALS.md](HOGQL-EXAMPLES-SIGNALS.md)). The MCP server exposes metrics to agents: chart a metric, compare error rates between services, or characterize an anomaly.

## Prove it

- **The metric arrives:** after recording and flushing (`posthog.metrics.flush()` in a short process), the name shows in the Metrics name picker within a minute.
- **Cardinality is bounded:** the Overview tab's active series count for the metric is about the product of its attribute values (10 routes x 5 statuses = 50), not one per user or request.
- **Short processes don't lose data:** a cron or CLI run that calls `flush()` or `shutdown()` before exit shows its data points; one that doesn't may not.
- **The OTel path is wired:** the exporter endpoint ends in `/i/v1/metrics` and the token starts `phc_`.
- **The Kubernetes agent scrapes once:** pods are running, agent logs show no errors, and with shards each target appears once (no doubled counts).
