# Grafana Application Observability

Grafana Cloud has three application products on the same OTLP plus Mimir, Loki, Tempo and Pyroscope plumbing: Application Observability (APM from span metrics), Frontend Observability (Faro, in [FRONTEND-FARO.md](FRONTEND-FARO.md)) and AI Observability (OpenLIT). Database monitoring and Supabase metrics are in [DATABASE-OBSERVABILITY.md](DATABASE-OBSERVABILITY.md). The mechanism that decides most outcomes in APM: **its RED metrics come from span metrics, not from a Prometheus scrape**, so a service exists in the UI only if its traces arrive with the right resource attributes and are counted before any sampling. Sending OTLP is [OTLP-GATEWAY.md](OTLP-GATEWAY.md); trace queries are [TEMPO.md](TEMPO.md). Docs: https://grafana.com/docs/grafana-cloud/monitor-applications/

**Contents:** [Application Observability](#application-observability) · [Resource and span attributes](#resource-and-span-attributes) · [Span metrics](#span-metrics) · [Service map](#service-map) · [Service Overview, baselines, SLOs, alerts](#service-overview-baselines-slos-alerts) · [Correlation](#correlation) · [Alloy on Kubernetes for apps](#alloy-on-kubernetes-for-apps) · [AI Observability](#ai-observability) · [Debugging](#debugging) · [Prove it](#prove-it)

## Application Observability

- **What you get:** Service Inventory (RED metrics for every service), Service Overview, Service Map (direction from `span.kind=CLIENT/SERVER`), and an Operations view (per-endpoint p50/p95/p99).
- **Where the metrics come from:** the Tempo metrics-generator (the Cloud default; basic use needs no configuration) or the `spanmetrics` connector in Alloy or the OTel Collector. They are stored in Mimir.
- **Query languages per signal:** RED metrics in PromQL; traces in TraceQL; logs in LogQL; profiles in "ProfileQL"; browser RUM in LogQL/TraceQL; LLM metrics in PromQL.

## Resource and span attributes

| Resource attribute | Becomes |
|---|---|
| `service.name` (minimum required) | The `service_name` label |
| `service.namespace` + `service.name` | `job` (`namespace/service.name`) |
| `deployment.environment` | `deployment_environment`, the environment filter |
| `service.version` | Shown in Service Overview, used to compare releases |
| `telemetry.sdk.language` | The Technology badge |

- **Recommended extras:** `k8s.cluster.name`, `k8s.namespace.name`, `cloud.region`, `host.name`.
- **Span attributes that fill the UI panels:**

| Kind | Attributes |
|---|---|
| HTTP | `http.method`, `http.status_code`, `http.route` (`/api/users/{id}`), `http.url` (sparingly; high cardinality), `http.target`, `http.scheme` |
| RPC | `rpc.system`, `rpc.service`, `rpc.method`, `rpc.grpc.status_code` |
| DB | `db.system`, `db.name`, `db.operation`, `db.statement` (careful with PII) |
| Messaging | `messaging.system`, `messaging.destination`, `messaging.operation` |

## Span metrics

| Generator | Calls | Duration |
|---|---|---|
| Tempo metrics-generator | `traces_spanmetrics_calls_total` | `traces_spanmetrics_duration_seconds` (`_bucket`) |
| OTel Collector connector | `traces_span_metrics_calls_total` | `traces_span_metrics_duration_seconds` |

- **Service graph metrics:** `traces_service_graph_request_total`, `traces_service_graph_request_failed_total`, `traces_service_graph_request_server_seconds`.
- **Labels:** `service_name`, `span_name`, `span_kind`, `status_code` (`STATUS_CODE_OK` / `STATUS_CODE_ERROR` / `STATUS_CODE_UNSET`), `deployment_environment`.
- **Default span-metric dimensions on Tempo:** `service.name`, `service.namespace`, `deployment.environment`, `service.version`, `k8s.cluster.name`, `cloud.region`.
- **Generate span metrics before sampling.** Complete, unsampled traces give accurate RED metrics: App to Alloy (receives all traces) to span metrics to tail sampler to Tempo. The tail sampler is in [OTLP-GATEWAY.md](OTLP-GATEWAY.md#sampling).
- **OTel Collector `spanmetrics` connector:**

```yaml
connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: [1ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 5s]
    dimensions:
      - name: service.namespace
      - name: deployment.environment
      - name: service.version
      - name: http.method
      - name: http.status_code
    exemplars:
      enabled: true
    namespace: "traces.span"
```

  Pipelines: `traces: receivers [otlp] exporters [otlphttp/grafana, spanmetrics]`; `metrics/spanmetrics: receivers [spanmetrics] exporters [prometheusremotewrite/grafana]`. In Alloy the equivalents are `otelcol.connector.spanmetrics` and `otelcol.connector.servicegraph`.

## Service map

- **Edges need both sides:** server spans with `span.kind = SERVER` and `server.address` or `peer.service`, plus client spans with `span.kind = CLIENT` that target another service.
- **Set `peer.service` by hand** when automatic detection fails.
- **In Grafana Cloud the service-graphs generator is on by default.**

## Service Overview, baselines, SLOs, alerts

- **Panels:** Rate, Errors (status code != OK), Duration (p50/p95/p99), Operations, Logs (needs a matching `service.name`), Infrastructure (needs Kubernetes monitoring, [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md)), Profiles button (needs Pyroscope, [PYROSCOPE.md](PYROSCOPE.md)).
- **Baselines and anomaly detection** need `deployment.environment`, **at least 2 weeks of data** for training, and are enabled in Application Observability > Settings.
- **SLO:** Service Overview > "Create SLO" > Availability or Latency > a target (for example 99.9%) and a window (for example 28 days). The generated dashboard comes with error-budget burn-rate alerts.
- **Pre-built alerts:** high error rate, high latency (p95 above the SLO), low request rate. Custom PromQL:

```promql
# Error rate > 5% for any service
(
  sum by (service_name) (rate(traces_spanmetrics_calls_total{status_code="STATUS_CODE_ERROR"}[5m]))
  /
  sum by (service_name) (rate(traces_spanmetrics_calls_total[5m]))
) > 0.05

# p95 latency > 500ms
histogram_quantile(0.95,
  sum by (le, service_name) (
    rate(traces_spanmetrics_duration_seconds_bucket[5m])
  )
) > 0.5
```

Turning these into alert rules and routing them is [ALERTING.md](ALERTING.md).

## Correlation

- **`service.name` joins all signals.**
- **Exemplars** embed trace IDs in metric points: a metric spike opens an exemplar trace.
- **`traceID` in logs;** Faro injects `traceparent` to link frontend and backend.
- **Built-in links:** Service Overview opens logs and "Go to profiles"; App Observability links to Frontend Observability; a DB span links to "View query in Database Observability".
- **Logs correlate** only when Loki labels include `service_name` matching the OTel `service.name` and the data-source settings point to the right Loki.

## Alloy on Kubernetes for apps

- **Run Alloy as a DaemonSet with `hostPort` 4317 and 4318.** Pods reach it through `OTEL_EXPORTER_OTLP_ENDPOINT=http://$(HOST_IP):4317`, with `HOST_IP` taken from `status.hostIP`. Alloy pipelines are [ALLOY.md](ALLOY.md).
- **Why a DaemonSet:** running Alloy on every node enables host-level resource detection. The DaemonSet (`grafana/alloy:latest`, `args: [run, /etc/alloy/config.alloy]`) reads `GRAFANA_CLOUD_OTLP_ENDPOINT`, `GRAFANA_CLOUD_INSTANCE_ID` and `GRAFANA_CLOUD_API_KEY` from the `grafana-cloud-creds` secret and mounts the `alloy-config` ConfigMap at `/etc/alloy`.
- **Application pod configuration**, pointing pods at the node-local Alloy:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://$(HOST_IP):4317"
  - name: HOST_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: OTEL_SERVICE_NAME
    value: "my-api"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "service.namespace=my-team,deployment.environment=production,k8s.pod.name=$(POD_NAME),k8s.namespace.name=$(NAMESPACE)"
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
```

## AI Observability

- **Built on the OTel GenAI semantic conventions plus OpenLIT.** It covers LLM APIs, vector DBs, AI frameworks, MCP servers, GPU usage and evals (hallucination, toxicity, bias).
- **Setup path:** Cloud > Connections > "AI Observability". Credentials from **My Account** > **Stack** > **OpenTelemetry**.
- **The SDK is Python only** (`openlit==1.42.0`, Python 3.10 or later). Env: `OTEL_SERVICE_NAME`, `OTEL_DEPLOYMENT_ENVIRONMENT`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`. The Python code itself was not carried into this skill.
- **Metrics:** `gen_ai_usage_input_tokens_total`, `gen_ai_usage_output_tokens_total`, `gen_ai_usage_cost_USD_sum`, `gen_ai_client_operation_duration`, `gen_ai_client_token_usage`.
- **Span attributes:** `gen_ai.request.model`, temperature/top_p, prompts and completions (configurable), `gen_ai.system`, time-to-first-token.
- **Dashboards:** GenAI Observability, GenAI Evaluations, Vector Database Observability, MCP Observability, GPU Monitoring.
- **No GenAI metrics:** check that the OpenLIT version matches the OTel semantic-conventions version Cloud expects.

For this workflow, read [DATABASE-OBSERVABILITY.md](DATABASE-OBSERVABILITY.md). [existing skills/monitoring/grafana/APP-AND-DB-OBSERVABILITY.md]

## Debugging

| Symptom | Check |
|---|---|
| Service missing from Inventory | `service.namespace` or `deployment.environment` missing (`service.name` is mandatory); traces arrive; `traces_spanmetrics_calls_total` exists |
| Service Map edges missing | `span.kind` or `peer.service` missing |
| RED values wrong | Span metrics use the dotted `deployment.environment` as their source; sampling happens after span metrics; clock skew |
| Log correlation fails | Loki `service_name` label matches `service.name`; data source points to the right Loki |

## Prove it

- **Traces:** TraceQL `{ resource.service.name = "my-api" }` returns spans.
- **Span metrics:** `sum by (job) (rate(traces_spanmetrics_calls_total{service_name="my-api"}[5m]))` is above 0 within about 1 minute, and the service appears in Service Inventory with its environment.
- **Alloy exporter healthy:** `curl -s http://localhost:12345/api/v0/web/components | jq '.[] | select(.id|test("otelcol\\.exporter\\.otlphttp")) | {id, health:.health.state}'`, and `otelcol_receiver_accepted_spans` and `otelcol_exporter_sent_spans` rise.
- **Service map:** a call between two services shows as an edge in the expected direction.
- **AI:** `sum by (gen_ai_request_model) (rate(gen_ai_usage_input_tokens_total[5m]))` returns a series per model.
