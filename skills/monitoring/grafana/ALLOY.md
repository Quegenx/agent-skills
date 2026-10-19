# Alloy

Alloy is Grafana's OpenTelemetry Collector distribution with built-in Prometheus pipelines and native Loki and Pyroscope support: one binary that collects metrics, logs, traces and profiles and ships them to Grafana Cloud, Prometheus, Loki, Tempo and Pyroscope. Grafana Labs calls it the recommended collector and the recommended path for all signals. Every pipeline has the shape `discovery / receive` to `process / relabel` to `write / export`, and components connect by referencing each other's exports, so most outcomes come down to two things: whether each component points at the right export of the next one (`.receiver` or `.input`), and whether each write endpoint has the right URL and credentials. Vendor-neutral collector shapes (agent and gateway, direct export) are in the [observability COLLECTOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/COLLECTOR.md); sending OTLP from apps is [OTLP-GATEWAY.md](OTLP-GATEWAY.md).

**Contents:** [How it works](#how-it-works) · [Install](#install) · [Syntax](#syntax) · [Write, validate, run, verify](#write-validate-run-verify) · [Component catalog](#component-catalog) · [Metrics pipelines](#metrics-pipelines) · [Log pipelines](#log-pipelines) · [OTLP pipelines](#otlp-pipelines) · [Profiles, Beyla, Faro and clustering](#profiles-beyla-faro-and-clustering) · [Sending data to Grafana Cloud](#sending-data-to-grafana-cloud) · [Fleet Management](#fleet-management) · [Source disagreements](#source-disagreements) · [Debugging](#debugging) · [Prove it](#prove-it)

## How it works

- **Components have arguments and exports.** Arguments are what you write; exports are what other components read, referenced as `BLOCK_TYPE.LABEL.export_name` (for example `local.file.my_config`). The name and label pair must be unique. When a referenced export changes, Alloy re-evaluates and restarts the dependent components on its own.
- **Usual export names:** `.receiver`, `.input`, `.targets`, `.output`, `.handler`, `.content`.
- **Forward to the recipient's input export:** usually `.receiver` for Prometheus, Loki and Pyroscope components, and `.input` for `otelcol` components.
- **Examples** of complete setups: https://github.com/grafana/alloy-scenarios. Migration paths exist from the OpenTelemetry Collector, Prometheus Agent and Grafana Agent.
- **Docs:** https://grafana.com/docs/alloy/latest/ and the full component list at https://grafana.com/docs/alloy/latest/reference/components/. Migrating from Grafana Agent: https://grafana.com/docs/alloy/latest/set-up/migrate/from-agent/

## Install

- **Packages:** `brew install grafana/grafana/alloy` (macOS), `sudo apt-get install alloy` (Debian/Ubuntu), or the `grafana/alloy` Docker image. You need an endpoint, plus an API key and username exported as env vars such as `GRAFANA_API_KEY`.

```bash
# Docker
docker run -v /path/to/config.alloy:/etc/alloy/config.alloy \
  -p 4317:4317 -p 4318:4318 \
  grafana/alloy run /etc/alloy/config.alloy
```

- **Kubernetes with Helm:**

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install alloy grafana/alloy \
  --set-file alloy.configMap.content=config.alloy
```

For whole-cluster monitoring use the `k8s-monitoring` chart in [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md).

## Syntax

- **Files** use the `.alloy` extension and UTF-8. Whitespace does not matter. A file holds one or more components. Comments are `//` and `/* ... */`.
- **Blocks:** `BLOCK_TYPE "LABEL" { attribute = value  nested_block { ... } }`. The block type is dotted. The unlabeled top-level blocks are `logging`, `http`, `tracing`, `remotecfg` and `clustering`, each at most once.
- **Types:** `number`, `string` (raw multi-line `"""..."""`), `bool`, `null`, `array`, `object`, `function`, `capsule` (an opaque type such as receivers and handlers).
- **Object keys** need quotes only when they are not valid identifiers: a hyphen (`"node-name"`) or a leading digit. `__address__` is valid unquoted; quoting it is only a Prometheus-style convention.
- **Expressions:** arithmetic, comparison, logical operators, `+` string concatenation, component references, function calls, indexing (`my_array[0]`, `my_object["field-with-dash"]`). Precedence, highest first: unary `!` `-`; `*` `/` `%`; `+` `-`; `<` `<=` `>` `>=`; `==` `!=`; `&&`; `||`.
- **Stdlib (namespaced):** `sys.env("VAR")`; `constants.hostname` / `.os` / `.arch`; `array.concat`, `array.combine_maps`; `convert.nonsensitive`; `encoding.from_json`, `encoding.from_yaml`; `file.path_join`; `string.to_upper` / `to_lower` / `replace` / `split`. Top level: `coalesce(a, b, c)` (first non-null or non-empty argument) and `json_path(doc, "$.field")`. Reference: https://grafana.com/docs/alloy/latest/reference/stdlib/
- **Durations** are Go-style strings (`"30s"`, `"1m"`, `"500ms"`, `"2h30m"`). **Sizes** take IEC/SI suffixes (`"512MiB"`, `"1GB"`).
- **Trailing commas** are allowed and recommended.
- **Reference a component by its full name:** `prometheus.scrape "api"` is `prometheus.scrape.api.<export>`, never `api.<export>`.

### Top-level blocks

```alloy
logging {
  level  = "info"     // debug | info | warn | error
  format = "logfmt"   // logfmt | json
}

http {
  listen_addr = "0.0.0.0:12345"   // Alloy UI + /metrics endpoint
}

tracing {
  sampling_fraction = 0.1
  write_to          = [otelcol.exporter.otlp.default.input]
}

remotecfg {
  url = "https://fleet-management.grafana.net"
  basic_auth {
    username = sys.env("FM_USERNAME")
    password = sys.env("FM_TOKEN")
  }
  poll_frequency = "1m"
}

clustering {
  enabled = true
}
```

The remote configuration setting is `poll_frequency`; the old example used `poll_interval`. [Alloy remotecfg](https://grafana.com/docs/alloy/latest/reference/config-blocks/remotecfg/)

### Modules and secrets

- **Import modules:** `import.file "utils" { filename = "./modules/utils.alloy" }`, `import.git "k8s" { repository = "https://github.com/grafana/alloy-modules"  revision = "main"  path = "modules/kubernetes/" }`, `import.http "shared" { url = "..."  poll_frequency = "5m" }`, and `import.string` for inline declarations. Call an imported component as `utils.my_component "example" { arg = "value" }`; for a git module, `k8s_monitoring.pods "default" { forward_to = [prometheus.remote_write.default.receiver] }`.
- **Declare a reusable component locally** with `declare`:

```alloy
declare "wrapped_scrape" {
  argument "target" { optional = false }
  argument "receiver" { optional = false }

  prometheus.scrape "inner" {
    targets    = [{__address__ = argument.target.value}]
    forward_to = [argument.receiver.value]
  }
}
```

- **Read a secret from a file:** `local.file "api_key" { filename = "/etc/secrets/api.key" }`, then `password = local.file.api_key.content`.

## Write, validate, run, verify

```bash
# 1. Format + syntax-check (catches typos before run)
alloy fmt config.alloy
alloy validate config.alloy

# 2. Run it
alloy run config.alloy
# or as a service: systemctl restart alloy

# 3. Verify all components are healthy via the UI on port 12345
curl -s http://localhost:12345/api/v0/web/components \
  | jq '.[] | select(.health.state != "healthy") | {id, state:.health.state, msg:.health.message}'
# Expect: empty (nothing unhealthy). Otherwise the row shows the failing component + reason.

# 4. Verify samples are flowing
curl -s http://localhost:12345/metrics \
  | grep -E '^prometheus_remote_storage_(samples_total|enqueue_retries_total)' | head
# samples_total should be > 0 and rising; retries should be 0.
```

- **`alloy fmt`** rewrites in place or errors with a line number. **`alloy validate`** is a full semantic check (newer Alloy releases).
- **Run flags:**

```bash
alloy run /etc/alloy/config.alloy \
  --server.http.listen-addr=0.0.0.0:12345 \
  --storage.path=/var/lib/alloy/data \
  --cluster.enabled=true \
  --cluster.join-addresses=alloy-headless.alloy.svc:12345
```

- **Reload** with `SIGHUP` (`kill -HUP <pid>`) or `curl -XPOST http://localhost:12345/-/reload`.
- **The UI** at `http://localhost:12345/` has Graph, Components and Clustering tabs.

## Component catalog

| Family | Components |
|---|---|
| Discovery (each exports `targets`) | `discovery.kubernetes`, `.docker`, `.dockerswarm`, `.ec2`, `.gce`, `.azure`, `.dns`, `.consul`, `.nomad`, `.file` (file_sd), `.http` (http_sd), `.relabel`, `.process` (used with Beyla and Pyroscope eBPF) |
| Prometheus | `prometheus.scrape`, `.remote_write`, `.relabel`, `.operator.podmonitors`, `.operator.servicemonitors`, `.operator.probes`, `.receive_http` (accepts remote-write for proxy or fan-out) |
| Prometheus exporters | `prometheus.exporter.unix`, `.windows`, `.mongodb`, `.mysql`, `.postgres`, `.redis`, `.snmp`, `.blackbox`, `.cloudwatch`, `.kafka`, `.process` |
| Loki sources | `loki.source.file`, `local.file_match`, `loki.source.kubernetes`, `.kubernetes_events`, `.journal`, `.docker`, `.syslog` (RFC5424/RFC3164), `.gcplog`, `.awsfirehose`, `.azure_event_hubs`, `.cloudflare`, `.api` (generic HTTP push) |
| Loki processing and output | `loki.echo` (debugging), `loki.process`, `loki.relabel`, `loki.write` |
| `loki.process` stages | `stage.json`, `stage.logfmt`, `stage.regex`, `stage.labels`, `stage.static_labels`, `stage.label_drop`, `stage.label_keep`, `stage.drop`, `stage.timestamp`, `stage.output`, `stage.template`, `stage.multiline`, `stage.match`, `stage.replace` |
| otelcol receivers | `otelcol.receiver.otlp` (gRPC 4317, HTTP 4318), `.jaeger`, `.zipkin`, `.prometheus`, `.loki`, `.kafka`, `.opencensus`, `.vcenter`, `.datadog` |
| otelcol processors | `batch`, `memory_limiter`, `transform` (OTTL), `attributes`, `resourcedetection` (k8s/aws/gcp/azure), `k8sattributes`, `filter` (OTTL), `tail_sampling`, `probabilistic_sampler` (head), `span`, `deltatocumulative` |
| otelcol exporters | `otlp` (gRPC), `otlphttp`, `prometheus` (to `prometheus.remote_write`), `loki` (to `loki.write`), `loadbalancing` (consistent hashing), `kafka`, `debug` (stderr), `faro` |
| otelcol auth and connectors | `otelcol.auth.basic`, `.bearer`, `.headers`, `.oauth2`, `.sigv4`; `otelcol.connector.spanmetrics` (RED metrics from spans), `otelcol.connector.servicegraph`, `otelcol.connector.host_info` |
| Pyroscope | `pyroscope.scrape`, `.ebpf`, `.java`, `.relabel`, `.write`, `.receive_http` |
| Other | `beyla.ebpf`, `faro.receiver`, `otelcol.exporter.faro`, `database_observability.mysql` and `.postgres`, `mimir.rules.kubernetes` (syncs `PrometheusRule` CRDs into the Mimir ruler) |
| Local and remote helpers | `local.file` (exposes `.content`, watches for changes), `local.file_match`, `remote.http`, `remote.s3`, `remote.kubernetes.configmap`, `remote.kubernetes.secret`, `remote.vault` |

- **`discovery.kubernetes` roles:** `pod`, `service`, `endpoints`, `endpointslice`, `node`, `ingress`.
- **Metrics chain:** `discovery.*` to `discovery.relabel` to `prometheus.scrape` to `prometheus.relabel` to `prometheus.remote_write` (`.receiver`).
- **Logs chain:** `discovery.*` to `loki.source.*` to `loki.process` to `loki.write` (`.receiver`).
- **OTel chain:** `otelcol.receiver.*` to `otelcol.processor.*` to `otelcol.exporter.*`, wired through `output { traces = ..., metrics = ..., logs = ... }` blocks into each next component's `.input`.

## Metrics pipelines

### Scrape and remote_write

```alloy
prometheus.scrape "custom_targets" {
  targets = [
    {__address__ = "prometheus:9090"},
    {__address__ = "custom-app:80", __metrics_path__ = "/custom-metrics-path", __scheme__ = "https"},
    {__address__ = "app:12345", environment = "production"},
  ]
  forward_to      = [prometheus.remote_write.default.receiver]
  scrape_interval = "30s"
}

prometheus.remote_write "default" {
  endpoint {
    url = sys.env("PROMETHEUS_URL")
    basic_auth {
      username = sys.env("PROMETHEUS_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
  external_labels = {
    cluster = "prod-us-east",
    env     = "production",
  }
}
```

- **Labels starting with `__` are removed after relabeling;** they control the scrape, not the output. `__scheme__` defaults to `http` and `__metrics_path__` to `/metrics`.
- **Fan out** by adding several `endpoint` blocks to one `prometheus.remote_write`.

### Kubernetes pods: discover, relabel, scrape

```alloy
discovery.kubernetes "pods" {
  role = "pod"
}

discovery.relabel "pods" {
  targets = discovery.kubernetes.pods.targets

  rule {
    source_labels = ["__meta_kubernetes_pod_label_app"]
    target_label  = "app"
  }
  rule {
    source_labels = ["__meta_kubernetes_namespace"]
    target_label  = "namespace"
  }
  // Drop pods that didn't set the "app" label
  rule {
    source_labels = ["__meta_kubernetes_pod_label_app"]
    regex         = ""
    action        = "drop"
  }
}

prometheus.scrape "k8s_pods" {
  targets    = discovery.relabel.pods.output
  forward_to = [prometheus.remote_write.default.receiver]
}
```

### Drop metrics and add a label

```alloy
prometheus.relabel "filter" {
  forward_to = [prometheus.remote_write.default.receiver]

  rule {
    source_labels = ["__name__"]
    regex         = "go_.*"
    action        = "drop"
  }
  rule {
    target_label = "environment"
    replacement  = "production"
  }
}
```

Metric naming, cardinality and PromQL are [PROMETHEUS.md](PROMETHEUS.md). Host and container exporters are [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md); the Postgres exporter is [DATABASE-OBSERVABILITY.md](DATABASE-OBSERVABILITY.md).

## Log pipelines

Label choice and LogQL are [LOKI.md](LOKI.md).

### Files

```alloy
loki.source.file "app_logs" {
  targets    = [{ __path__ = "/var/log/app/*.log", job = "app" }]
  forward_to = [loki.write.cloud.receiver]
}

loki.write "cloud" {
  endpoint {
    url = sys.env("LOKI_URL")
    basic_auth {
      username = sys.env("LOKI_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
}
```

### Kubernetes pod logs

Tail container logs from the node Alloy runs on: the `selectors` block limits discovery to that node, and the relabel rules set `namespace`, `pod`, `container`, `app`, `job` (`namespace/container`) and `__path__`.

```alloy
loki.write "default" {
  endpoint {
    url = sys.env("LOKI_URL")
    basic_auth {
      username = sys.env("LOKI_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
}

discovery.kubernetes "pod" {
  role = "pod"
  selectors {
    role  = "pod"
    field = "spec.nodeName=" + coalesce(sys.env("HOSTNAME"), constants.hostname)
  }
}

discovery.relabel "pod_logs" {
  targets = discovery.kubernetes.pod.targets

  rule { source_labels = ["__meta_kubernetes_namespace"]                  target_label = "namespace"  action = "replace" }
  rule { source_labels = ["__meta_kubernetes_pod_name"]                   target_label = "pod"        action = "replace" }
  rule { source_labels = ["__meta_kubernetes_pod_container_name"]         target_label = "container"  action = "replace" }
  rule { source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"] target_label = "app"  action = "replace" }

  rule {
    source_labels = ["__meta_kubernetes_namespace", "__meta_kubernetes_pod_container_name"]
    target_label  = "job"
    separator     = "/"
    replacement   = "$1"
    action        = "replace"
  }

  rule {
    source_labels = ["__meta_kubernetes_pod_uid", "__meta_kubernetes_pod_container_name"]
    target_label  = "__path__"
    separator     = "/"
    replacement   = "/var/log/pods/*$1/*.log"
    action        = "replace"
  }
}

loki.source.kubernetes "pod_logs" {
  targets    = discovery.relabel.pod_logs.output
  forward_to = [loki.process.pod_logs.receiver]
}

loki.process "pod_logs" {
  forward_to = [loki.write.default.receiver]
  stage.static_labels {
    values = { cluster = "prod-us-east" }
  }
}
```

### Cluster events, node logs, journal

```alloy
loki.source.kubernetes_events "cluster_events" {
  job_name   = "integrations/kubernetes/eventhandler"
  log_format = "logfmt"
  forward_to = [loki.process.cluster_events.receiver]
}

loki.process "cluster_events" {
  forward_to = [loki.write.default.receiver]
  stage.static_labels {
    values = { cluster = "prod-us-east" }
  }
  stage.labels {
    values = { kubernetes_cluster_events = "job" }
  }
}

local.file_match "node_logs" {
  path_targets = [{
    __path__  = "/var/log/syslog",
    job       = "node/syslog",
    node_name = sys.env("HOSTNAME"),
    cluster   = "prod-us-east",
  }]
}

loki.source.file "node_logs" {
  targets    = local.file_match.node_logs.targets
  forward_to = [loki.write.default.receiver]
}

loki.source.journal "system" {
  forward_to = [loki.write.default.receiver]
  labels     = { job = "systemd-journal" }
  // optional: relabel_rules, matches, format_as_json
}
```

### Parse JSON, lift a field to a label, drop health checks

```alloy
loki.process "json_parse" {
  forward_to = [loki.write.default.receiver]

  stage.json {
    expressions = { level = "level", msg = "message" }
  }
  stage.labels {
    values = { level = "" }
  }
  stage.drop {
    expression = ".*health check.*"
  }
}
```

## OTLP pipelines

### Traces to Tempo over gRPC

```alloy
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }
  output { traces = [otelcol.exporter.otlp.tempo.input] }
}

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo-xxx.grafana.net/tempo:443"
    auth     = otelcol.auth.basic.grafana_cloud.handler
  }
}

otelcol.auth.basic "grafana_cloud" {
  username = sys.env("TEMPO_USER")
  password = sys.env("GRAFANA_API_KEY")
}
```

The send-data skill shows the same idea with `endpoint = "tempo-prod-xx.grafana.net:443"`.

### OTLP to every LGTM backend, split per signal

```alloy
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }

  output {
    metrics = [otelcol.processor.batch.default.input]
    logs    = [otelcol.processor.batch.default.input]
    traces  = [otelcol.processor.batch.default.input]
  }
}

otelcol.processor.batch "default" {
  output {
    metrics = [otelcol.exporter.prometheus.grafana_cloud_metrics.input]
    logs    = [otelcol.exporter.loki.grafana_cloud_logs.input]
    traces  = [otelcol.exporter.otlphttp.grafana_cloud_traces.input]
  }
}

otelcol.exporter.otlphttp "grafana_cloud_traces" {
  client {
    endpoint = "https://tempo-us-central1.grafana.net:443"
    auth     = otelcol.auth.basic.grafana_cloud.handler
  }
}

otelcol.exporter.prometheus "grafana_cloud_metrics" {
  forward_to = [prometheus.remote_write.grafana_cloud.receiver]
}

otelcol.exporter.loki "grafana_cloud_logs" {
  forward_to = [loki.write.grafana_cloud.receiver]
}

otelcol.auth.basic "grafana_cloud" {
  username = sys.env("GRAFANA_CLOUD_INSTANCE_ID")
  password = sys.env("GRAFANA_CLOUD_API_KEY")
}

prometheus.remote_write "grafana_cloud" {
  endpoint {
    url = "https://prometheus-us-central1.grafana.net/api/prom/push"
    basic_auth {
      username = sys.env("GRAFANA_CLOUD_METRICS_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
}

loki.write "grafana_cloud" {
  endpoint {
    url = "https://logs-prod-us-central1.grafana.net/loki/api/v1/push"
    basic_auth {
      username = sys.env("GRAFANA_CLOUD_LOGS_USER")
      password = sys.env("GRAFANA_CLOUD_API_KEY")
    }
  }
}
```

- **In production, put a memory limiter in front of `batch`** and point the receiver's `output.*` at `otelcol.processor.memory_limiter.default.input`:

```alloy
otelcol.processor.memory_limiter "default" {
  check_interval   = "1s"
  limit_percentage = 80
  output {
    metrics = [otelcol.processor.batch.default.input]
    logs    = [otelcol.processor.batch.default.input]
    traces  = [otelcol.processor.batch.default.input]
  }
}
```

The single-exporter variant that sends every signal to the Grafana Cloud OTLP gateway, sampling, and the tail sampler are in [OTLP-GATEWAY.md](OTLP-GATEWAY.md). Span metrics for Application Observability are in [APPLICATION-OBSERVABILITY.md](APPLICATION-OBSERVABILITY.md).

## Profiles, Beyla, Faro and clustering

```alloy
pyroscope.scrape "default" {
  targets = [
    {__address__ = "localhost:6060", service_name = "myapp"},
  ]
  forward_to = [pyroscope.write.default.receiver]
}

pyroscope.write "default" {
  endpoint {
    url = sys.env("PYROSCOPE_URL")
    basic_auth {
      username = sys.env("PYROSCOPE_USER")
      password = sys.env("GRAFANA_API_KEY")
    }
  }
}

beyla.ebpf "default" {
  open_port = "8080"   // or attach_pid, executable_name, k8s selectors

  output {
    metrics = [otelcol.processor.batch.default.input]
    traces  = [otelcol.processor.batch.default.input]
  }
}

faro.receiver "default" {
  server {
    listen_address = "0.0.0.0"
    listen_port    = 12347
    // Replace with your actual web origins before deploying: wildcard "*" lets any site send
    // telemetry to this endpoint and is not suitable for production.
    cors_allowed_origins = ["https://app.example.com"]
  }

  output {
    logs   = [loki.write.grafana_cloud.receiver]
    traces = [otelcol.processor.batch.default.input]
  }
}

clustering {
  enabled = true
}

prometheus.scrape "cluster_aware" {
  targets    = discovery.kubernetes.pods.targets
  forward_to = [prometheus.remote_write.default.receiver]
  clustering { enabled = true }
}
```

- **Beyla** details (kernel requirements, routes, sampling) are in [BEYLA.md](BEYLA.md); the full `faro.receiver` options are in [FRONTEND-FARO.md](FRONTEND-FARO.md).
- **Clustering** runs multiple Alloy replicas that shard targets among themselves. It uses memberlist to find peers; set peer addresses with the `--cluster.*` flags on `alloy run`, for example `--cluster.join-addresses=alloy-headless:12345`.

## Sending data to Grafana Cloud

- **Credentials** live in the Grafana Cloud portal under **My Account** > **Stack** > **Details**. Each signal has its own URL, username and password or API key: metrics (Prometheus remote write URL), logs (Loki URL), traces (Tempo OTLP endpoint), profiles (Pyroscope URL). OTLP credentials are under **My Account** > **Stack** > **OpenTelemetry**. Docs: https://grafana.com/docs/grafana-cloud/send-data/
- **URL shapes:**

| Signal | URL |
|---|---|
| Prometheus push | `https://prometheus-prod-xx.grafana.net/api/prom/push`, `https://prometheus-us-central1.grafana.net/api/prom/push`, `https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push` |
| Loki push | `https://logs-prod-xx.grafana.net/loki/api/v1/push` |
| Tempo | `tempo-prod-xx.grafana.net:443` (gRPC OTLP); `https://tempo-us-central1.grafana.net:443` (otlphttp) |
| OTLP gateway | `https://otlp-gateway-<region>.grafana.net/otlp`, for example `https://otlp-gateway-prod-us-east-0.grafana.net/otlp` |

- **Ingestion roles:** `MetricsPublisher`, `LogsPublisher`, `TracesPublisher`, `ProfilesPublisher`. The infrastructure skill names the scopes `metrics:write`, `logs:write`, `traces:write` instead; check the current docs for the token you create.
- **Create an API key through the Grafana API:**

```bash
curl -X POST https://yourstack.grafana.net/api/auth/keys \
  -H "Content-Type: application/json" \
  -u "admin:adminpassword" \
  -d '{"name": "alloy-writer", "role": "MetricsPublisher", "secondsToLive": 0}'
```

### Without Alloy

- **Prometheus remote write directly:**

```yaml
# prometheus.yml
remote_write:
  - url: https://prometheus-prod-xx.grafana.net/api/prom/push
    basic_auth:
      username: "123456"
      password: "your-api-key"
    write_relabel_configs:
      - source_labels: [__name__]
        regex: "go_.*"
        action: drop   # optional: drop high-cardinality metrics
```

- **Loki push with curl:**

```bash
curl -X POST https://logs-prod-xx.grafana.net/loki/api/v1/push \
  -H "Content-Type: application/json" \
  -u "123456:your-api-key" \
  -d '{
    "streams": [{
      "stream": { "app": "myapp", "env": "prod" },
      "values": [
        ["1706745600000000000", "application started"]
      ]
    }]
  }'
```

Hosted integrations (CloudWatch, Azure, the integrations catalog API) are in [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md).

## Fleet Management

Fleet Management distributes pipelines remotely to Alloy collectors over OpAMP: author once, target with matchers, and the config applies without a restart. A **collector** is an Alloy instance with an ID and attributes; a **pipeline** is a named Alloy config; a **matcher** is an attribute selector. Docs: https://grafana.com/docs/grafana-cloud/send-data/fleet-management/

- **Prerequisites:** a Grafana Cloud stack with Fleet Management enabled; an API token with Fleet Management access (`Authorization: Bearer <STACK_ID>:<TOKEN>`); Alloy 1.0 or later on the targets (standalone or through the `grafana/alloy` Helm chart); the `alloy` CLI locally for `alloy fmt`.
- **The bootstrap `remotecfg` block is the only local config required.** The fleet server delivers the rest as modules that Alloy imports on its own.

```alloy
remotecfg {
  url = "https://<FLEET_MANAGEMENT_HOST>"
  basic_auth { username = "<STACK_ID>"; password = env("GRAFANA_CLOUD_API_KEY") }
  poll_frequency = "1m"
  attributes = { "env" = env("ENVIRONMENT"), "team" = "platform" }
}
```

  The API reference form also sets `id = ""`, with the comment "Auto-generated; persist across restarts for stable ID". This block uses `poll_frequency` and `env()`; other sources write `poll_interval` and `sys.env()` (see [Source disagreements](#source-disagreements)).
- **Helm:** put the bootstrap in `alloy.configMap.content` and the credentials in `alloy.extraEnv` from a `secretKeyRef`:

```yaml
alloy:
  configMap:
    content: |
      remotecfg {
        url = "https://<FLEET_MANAGEMENT_HOST>"
        basic_auth {
          username = "<STACK_ID>"
          password = env("GRAFANA_CLOUD_API_KEY")
        }
        poll_frequency = "1m"
        attributes = {
          "env"     = "production",
          "cluster" = env("CLUSTER_NAME"),
        }
      }
  extraEnv:
    - name: GRAFANA_CLOUD_API_KEY
      valueFrom:
        secretKeyRef:
          name: grafana-cloud-credentials
          key:  api-key
```

- **Kubernetes auto-attributes:** pass `K8S_NODE_NAME` (`fieldRef: { fieldPath: spec.nodeName }`) and `K8S_NAMESPACE` (`fieldRef: { fieldPath: metadata.namespace }`) as env vars and set `"k8s.node.name" = sys.env("K8S_NODE_NAME")` and `"k8s.namespace" = sys.env("K8S_NAMESPACE")` in `attributes`.
- **The API is gRPC-Web:** `POST` JSON to `<host>/<service>.<RPC>`, for example `BASE=https://fleet-management-prod-us-east-0.grafana.net` with `TOKEN=<STACK_ID>:<API_TOKEN>`.

| Service | RPCs |
|---|---|
| `collector.v1.CollectorService` | `ListCollectors`, `UpdateCollector` |
| `pipeline.v1.PipelineService` | `ListPipelines`, `CreatePipeline`, `UpdatePipeline`, `ListPipelineRevisions`, `RollbackPipeline` |
| `tenant.v1.TenantService` | `GetLimits` |

- **Create a pipeline; contents are plain-text Alloy, not base64:**

```bash
PAYLOAD=$(jq -n --rawfile c pipeline.alloy '{
  name:"k8s-metrics", contents:$c,
  matchers:[{name:"env",value:"production",type:"EQUAL"}]
}')
curl -s -X POST "$BASE/pipeline.v1.PipelineService/CreatePipeline" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq
```

- **Verify the rollout:** every targeted collector should report APPLIED within 1 to 2 polls.

```bash
curl -s -X POST "$BASE/collector.v1.CollectorService/ListCollectors" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' \
  | jq '.collectors[] | select(.attributes[]?.value=="production")
        | {name, remoteConfigStatus}'
# Expect every row: remoteConfigStatus == "REMOTE_CONFIG_STATUS_APPLIED"
```

- **Set collector attributes** (matchers target these) with `UpdateCollector`:

```bash
curl -s -X POST "$BASE/collector.v1.CollectorService/UpdateCollector" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "id": "<COLLECTOR_ID>",
    "attributes": [
      {"name":"env",   "value":"production"},
      {"name":"team",  "value":"platform"},
      {"name":"region","value":"us-east-1"}
    ]
  }'
```

- **Matchers:** `EQUAL`, `NOT_EQUAL`, `REGEX` (RE2), `NOT_REGEX`; the UI forms are `=` (`env="production"`), `!=` (`env!="dev"`), `=~` (`region=~"us-.*"`), `!~` (`region!~"eu-.*"`). **A pipeline with no matchers is saved but deployed to zero collectors.** Collectors set `platform`, `arch` and `alloy_version` on registration.
- **Every `UpdatePipeline` creates a revision;** `RollbackPipeline` rolls back to a previous one:

```bash
# List revisions
curl -X POST $BASE/pipeline.v1.PipelineService/ListPipelineRevisions \
  -H "Authorization: Bearer $TOKEN" -d '{"pipelineId": "pipeline-id"}'

# Roll back to a previous revision
curl -X POST $BASE/pipeline.v1.PipelineService/RollbackPipeline \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"pipelineId": "pipeline-id", "revisionId": "revision-id"}'
```

- **Tenant limits** (example): `maxCollectors 1000`, `maxPipelines 100`, `maxPipelineSizeBytes 1048576`, `maxMatchersPerPipeline 10`.
- **Status:** `REMOTE_CONFIG_STATUS_APPLIED` or `REMOTE_CONFIG_STATUS_FAILED` with `remoteConfigStatusMessage`. Expect APPLIED within 1 to 2 polls.
- **Patterns:** staged rollout with a canary pipeline matched on `canary=true`, then set that attribute on one collector; on-demand debug with a pipeline matched on `id` that contains `logging { level = "debug" }`, deleted when done.
- **Grafana Assistant tools:** `fleetManagementRead`, `fleetManagementWrite`, `alloyConfigValidation`.

| Failure message | Fix |
|---|---|
| `syntax error at line N` | Run `alloy fmt` |
| `component not found: X` | Upgrade Alloy |
| `failed to unmarshal config` | You sent base64; send plain text |
| `authentication failed` | Rotate the token |
| `connection refused` | Open egress to the Fleet Management host |

- **Troubleshoot a `REMOTE_CONFIG_STATUS_FAILED` collector:** surface the message, re-validate the pipeline locally with `alloy fmt pipeline.alloy`, check the collector's UI at `http://<COLLECTOR_HOST>:12345` (Graph / Components / Clustering tabs) and its logs, then re-push and confirm the row flips to APPLIED:

```bash
curl -s -X POST "$BASE/collector.v1.CollectorService/ListCollectors" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' \
  | jq '.collectors[] | select(.remoteConfigStatus=="REMOTE_CONFIG_STATUS_FAILED")
        | {name, msg:.remoteConfigStatusMessage}'

kubectl -n monitoring logs -l app.kubernetes.io/name=alloy --tail=100 | grep -iE 'remote|error'
```

## Source disagreements

Check the current Alloy reference for each before relying on it.

- **Env function:** the alloy, send-data, database-observability and fleet-management API references use `sys.env("VAR")`; the opentelemetry collector config, app-observability files and the fleet-management overview and bootstrap use `env("VAR")`. The Alloy syntax reference documents only `sys.env`.
- **`remotecfg` poll key:** the source Alloy syntax, collection-patterns and fleet-management API references said `poll_interval`; the fleet-management overview and bootstrap used the documented `poll_frequency`. Use the official key as corrected above. [https://grafana.com/docs/alloy/latest/reference/config-blocks/remotecfg/]
- **Language name:** the app-observability files fence configs as `river`; others use `alloy`.

## Debugging

| Symptom | Check |
|---|---|
| `alloy validate` says "component not found" | Alloy is too old: `alloy --version`, then upgrade |
| A component is `unhealthy` in the UI | Open it at http://localhost:12345 to see the live error |
| `prometheus_remote_storage_samples_dropped_total` rising | `enqueue_retries_total`, the remote_write URL and credentials |
| No spans in Tempo | `otelcol_receiver_refused_spans`, `otelcol_exporter_sent_spans`, `otelcol_exporter_send_failed_spans`; watch the receiver with `curl -s http://localhost:12345/metrics \| grep otelcol_receiver_accepted_spans` |
| Logs empty | `/var/log/app/*.log` exists and the alloy user can read it; the "Targets" tab of `loki.source.file.app_logs` in the UI; query `{job="app"}` in Explore |
| Fleet pipeline not applied | Collector status `REMOTE_CONFIG_STATUS_FAILED` and its `remoteConfigStatusMessage`; the pipeline has matchers |

## Prove it

- **Config is valid:** `alloy fmt config.alloy` and `alloy validate config.alloy` both pass.
- **Every component healthy:** the `/api/v0/web/components` jq filter above returns nothing.
- **Metrics flow:** `prometheus_remote_storage_samples_total` is above 0 and rising, `enqueue_retries_total` is 0, `prometheus_remote_storage_samples_dropped_total` is flat.
- **Traces flow:** `otelcol_receiver_accepted_spans` and `otelcol_exporter_sent_spans` rise; `otelcol_exporter_send_failed_spans` stays flat.
- **Logs arrive:** `{job="app"}` returns lines in Explore.
- **Fleet bootstrap:** `curl -s http://localhost:12345/api/v0/web/components | jq '.[] | select(.id=="remotecfg") | {id, health:.health.state}'` reports healthy, and each targeted collector shows `REMOTE_CONFIG_STATUS_APPLIED` within 1 to 2 polls.
- **No wildcard CORS:** no `faro.receiver` has `"*"` in `cors_allowed_origins`.
