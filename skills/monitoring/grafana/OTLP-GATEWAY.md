# Grafana Cloud OTLP gateway

Apps speak OTLP, either through Alloy or directly, to Grafana Cloud: metrics land in Mimir, logs in Loki, traces in Tempo, profiles in Pyroscope. Beyla's eBPF requirements and deployment are in [BEYLA.md](BEYLA.md). Most outcomes come down to the endpoint, the protocol and the credentials matching each other (the Cloud OTLP gateway wants `http/protobuf`, a URL ending in `/otlp` and Basic auth from a numeric instance ID), and to every service setting `service.name`, `service.namespace` and `deployment.environment`. The vendor-neutral SDK setup, custom spans, log correlation and sampling theory are in the [observability INSTRUMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INSTRUMENT.md); Alloy itself is [ALLOY.md](ALLOY.md). Docs: https://grafana.com/docs/opentelemetry/, https://grafana.com/docs/grafana-cloud/send-data/otlp/ and https://grafana.com/docs/beyla/latest/

**Contents:** [Credentials and endpoint](#credentials-and-endpoint) · [Environment variables](#environment-variables) · [Node.js](#nodejs) · [Through Alloy](#through-alloy) · [Kubernetes: the OTel Operator](#kubernetes-the-otel-operator) · [The upstream Collector](#the-upstream-collector) · [Sampling](#sampling) · [Debugging](#debugging) · [Prove it](#prove-it)

## Credentials and endpoint

- **You need three things:** the Cloud OTLP endpoint `https://otlp-gateway-<region>.grafana.net/otlp`, a numeric instance ID, and an API token with `MetricsPublisher` + `LogsPublisher` + `TracesPublisher`. They are under **My Account** > **Stack** > **OpenTelemetry**.
- **Build the Basic auth header** with `echo -n "INSTANCE_ID:API_TOKEN" | base64` (for example `MTIzNDU2OmdsY19leUo...`).
- **Smoke-test the credentials before writing code:**

```bash
# 1. Build the auth header
INSTANCE_ID=123456
API_KEY="glc_eyJ..."
export OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic $(echo -n "${INSTANCE_ID}:${API_KEY}" | base64)"
export OTEL_RESOURCE_ATTRIBUTES="service.name=myapp,service.namespace=myteam,deployment.environment=prod"

# 2. Smoke-test creds with a curl POST against the OTLP traces endpoint (empty body)
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST -H "Content-Type: application/x-protobuf" \
  -H "Authorization: Basic $(echo -n "${INSTANCE_ID}:${API_KEY}" | base64)" \
  "$OTEL_EXPORTER_OTLP_ENDPOINT/v1/traces" --data-binary '\n'
# Expect 400 (malformed payload), NOT 401 (auth) or 404 (wrong endpoint).
```

## Environment variables

| Variable | Example |
|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://otlp-gateway-prod-us-east-0.grafana.net/otlp` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` or `http/protobuf` |
| `OTEL_EXPORTER_OTLP_HEADERS` | `Authorization=Basic <base64>` |
| `OTEL_RESOURCE_ATTRIBUTES` | `service.name=app,service.namespace=team,deployment.environment=prod` |
| `OTEL_SERVICE_NAME` | shorthand for `service.name` |
| `OTEL_TRACES_SAMPLER` / `_ARG` | `parentbased_traceidratio` / `0.1` |

- **Always set `service.name`, `service.namespace` and `deployment.environment`.** `service.name` is unique per service (`payment-api`, `frontend`); `service.namespace` groups related services (`checkout`, `platform`); `deployment.environment` is the tier (`production`, `staging`, `development`). Application Observability depends on them ([APPLICATION-OBSERVABILITY.md](APPLICATION-OBSERVABILITY.md)).
- **Protocols:** `grpc` on 4317 is fastest; `http/protobuf` on 4318 for HTTP-only environments; Grafana Cloud direct is `http/protobuf` on 443 (HTTPS).
- **To a local Alloy:** `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317` and `OTEL_EXPORTER_OTLP_PROTOCOL=grpc`.

## Node.js

### Zero-config auto-instrumentation

```bash
npm install --save @opentelemetry/api @opentelemetry/auto-instrumentations-node
```

```bash
OTEL_TRACES_EXPORTER="otlp" \
OTEL_METRICS_EXPORTER="otlp" \
OTEL_LOGS_EXPORTER="otlp" \
OTEL_NODE_RESOURCE_DETECTORS="env,host,os" \
OTEL_RESOURCE_ATTRIBUTES="service.name=myapp,service.namespace=myteam,deployment.environment=prod" \
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp \
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic $(echo -n '123456:glc_eyJ...' | base64)" \
NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register" \
node app.js
```

- **Bundlers such as `@vercel/ncc` break Node.js auto-instrumentation** because they defeat the require hooks.

### Manual SDK straight to the Cloud gateway (TypeScript, ESM)

Use the single vendor-neutral SDK definition in [observability INSTRUMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INSTRUMENT.md), then configure the Grafana gateway endpoint and credentials above. OpenTelemetry JS 2.x creates resources with `resourceFromAttributes`; the removed example used `new Resource` with unversioned installation instructions, omitted an imported metrics package and mixed loader conventions. Match the installed SDK, resource and ESM loader versions. [OpenTelemetry JS 2.x upgrade](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/upgrade-to-2.x.md)

Manual spans and active-context alternatives are in [observability INSTRUMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INSTRUMENT.md#manual-span); the manual [pino trace-correlation helper](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/INSTRUMENT.md#trace-ids-in-logs-pino) is there too. Use [observability LOGGING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/LOGGING.md) for logging policy. Keep trace and span IDs in content or Loki structured metadata rather than indexed labels; Loki metadata requires the compatible schema/storage configuration in [LOKI.md](LOKI.md#structured-metadata). [existing OPENTELEMETRY-AND-BEYLA.md]

## Through Alloy

- **Minimal Alloy config, every signal to the Cloud OTLP gateway, no processors:**

```alloy
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }
  output {
    metrics = [otelcol.exporter.otlphttp.cloud.input]
    logs    = [otelcol.exporter.otlphttp.cloud.input]
    traces  = [otelcol.exporter.otlphttp.cloud.input]
  }
}

otelcol.exporter.otlphttp "cloud" {
  client {
    endpoint = env("GRAFANA_CLOUD_OTLP_ENDPOINT")
    auth     = otelcol.auth.basic.cloud.handler
  }
}

otelcol.auth.basic "cloud" {
  username = env("GRAFANA_CLOUD_INSTANCE_ID")
  password = env("GRAFANA_CLOUD_API_KEY")
}
```

  Env: `GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp`, `GRAFANA_CLOUD_INSTANCE_ID=123456`, `GRAFANA_CLOUD_API_KEY=glc_eyJ...`. The Alloy syntax reference documents `sys.env` rather than `env` (see [ALLOY.md](ALLOY.md#source-disagreements)).
- **Preserve the unaffected full-pipeline stages:** an OTLP receiver accepts gRPC on 4317 and HTTP on 4318, resource detection enriches telemetry, selected transforms remove unwanted attributes, batching feeds the authenticated OTLP HTTP exporter. The source selected `process.pid` removal for every signal and additionally `process.runtime.description`, `process.runtime.name` and `process.runtime.version` for traces; those are source cleanup choices, not required removals. Its system detector used the OS hostname. Keep these stages on each signal's own path; the corrected host-metric branch below is additional. Component configuration and source detector spelling still require the installed-version checks in [ALLOY.md](ALLOY.md#source-disagreements). [grafana/skills, opentelemetry, references/collector-config.md]
- **Keep a separate trace export path when generating host metrics.** `otelcol.connector.host_info` consumes traces and emits metrics; it does not pass the original traces through. Route original traces to the trace processor/exporter separately, and route generated host metrics into the metrics pipeline. The removed full source configuration sent both original metrics and traces through `host_info`, losing the original trace path. Retain only resource transforms whose removed attributes are actually unwanted. [Alloy host_info connector](https://grafana.com/docs/alloy/latest/reference/components/otelcol/otelcol.connector.host_info/)

- **Run it:**

```bash
# Set required environment variables
export GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
export GRAFANA_CLOUD_INSTANCE_ID=123456
export GRAFANA_CLOUD_API_KEY=glc_eyJ...

# Run
alloy run config.alloy
```

- **Resource detection variants:** other sources use `detectors = ["env", "system", "gcp", "aws", "azure"]` (APM reference) or `["env", "system", "gcp", "ec2", "azure"]` with a batch of `send_batch_size = 8192`, `send_batch_max_size = 0`, `timeout = "200ms"` (APM setup); the sources disagree on `aws` versus `ec2`, so check the `resourcedetection` reference.
- **Docker Compose with Alloy and an app:**

```yaml
services:
  alloy:
    image: grafana/alloy:latest
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "12345:12345" # Alloy UI
    volumes:
      - ./config.alloy:/etc/alloy/config.alloy
    command: run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.alloy
    environment:
      - GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
      - GRAFANA_CLOUD_INSTANCE_ID=123456
      - GRAFANA_CLOUD_API_KEY=glc_eyJ...

  myapp:
    build: .
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_RESOURCE_ATTRIBUTES=service.name=myapp,service.namespace=myteam,deployment.environment=dev
    depends_on:
      - alloy
```

- **Check that Alloy forwarded:** `curl -s http://localhost:12345/metrics | grep otelcol_exporter_sent_spans`.

## Kubernetes: the OTel Operator

- **Install:** `kubectl apply -f https://github.com/open-telemetry/opentelemetry-operator/releases/latest/download/opentelemetry-operator.yaml`
- **Instrumentation CR** (Node.js and shared parts):

```yaml
apiVersion: opentelemetry.io/v1alpha1
kind: Instrumentation
metadata:
  name: grafana-instrumentation
  namespace: default
spec:
  exporter:
    endpoint: http://otelcol-collector.monitoring:4317

  propagators:
    - tracecontext
    - baggage

  sampler:
    type: parentbased_traceidratio
    argument: "0.25"   # 25% sampling

  nodejs:
    env:
    - name: OTEL_EXPORTER_OTLP_PROTOCOL
      value: grpc
```

- **Opt pods in with an annotation:** `instrumentation.opentelemetry.io/inject-nodejs: "true"` (also `inject-java`, `inject-python`, `inject-dotnet`). For an Instrumentation in another namespace: `instrumentation.opentelemetry.io/inject-java: "monitoring/grafana-instrumentation"`. Check with `kubectl describe pod <pod> | grep -A2 'opentelemetry-auto-instrumentation'`.
- **An `OpenTelemetryCollector` CR** takes `mode: daemonset` (or `deployment`, `statefulset`, `sidecar`); its `otlphttp/grafana` exporter sends `headers: authorization: "Basic ${env:GRAFANA_CLOUD_AUTH}"`, with `GRAFANA_CLOUD_OTLP_ENDPOINT` and `GRAFANA_CLOUD_AUTH` taken from the `grafana-cloud-creds` secret's `otlp-endpoint` and `basic-auth-base64` keys.
- **Instrumentation CR per language:** the full CR also has `java`, `python` and `dotnet` blocks, each setting `OTEL_EXPORTER_OTLP_PROTOCOL: grpc`.
- **Credentials secret:**

```bash
kubectl create secret generic grafana-cloud-creds \
  --namespace monitoring \
  --from-literal=otlp-endpoint=https://otlp-gateway-prod-us-east-0.grafana.net/otlp \
  --from-literal=instance-id=123456 \
  --from-literal=api-key=glc_eyJ... \
  --from-literal=basic-auth-base64=$(echo -n '123456:glc_eyJ...' | base64)
```

- **Alloy as a DaemonSet for apps** (hostPort 4317/4318, `HOST_IP`) is in [APPLICATION-OBSERVABILITY.md](APPLICATION-OBSERVABILITY.md); the whole-cluster chart is [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md).

## The upstream Collector

For environments where Alloy cannot be used.

- **Install:**

```bash
# Download otelcol-contrib (includes all components)
curl -L https://github.com/open-telemetry/opentelemetry-collector-releases/releases/latest/download/otelcol-contrib_linux_amd64.tar.gz | tar xz

# Docker
docker run -v /path/to/config.yaml:/etc/otelcol-contrib/config.yaml \
  -p 4317:4317 -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest
```

- **Complete `config.yaml`:** recommended processors are `resourcedetection` (`timeout: 2s`), `batch` (`send_batch_size: 1000`, `timeout: 10s`) and `memory_limiter` (`check_interval: 5s`, `limit_mib: 512`, `spike_limit_mib: 128`), in the order `memory_limiter, resourcedetection, transform, batch`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  # Detect host/cloud resource attributes
  resourcedetection:
    detectors: [env, system, docker]
    system:
      hostname_sources: [os]
    timeout: 2s

  # Remove noisy attributes
  transform:
    error_mode: ignore
    trace_statements:
      - context: resource
        statements:
          - delete_key(attributes, "process.pid")
          - delete_key(attributes, "process.runtime.description")

  # Batch for efficiency
  batch:
    send_batch_size: 1000
    timeout: 10s

  # Memory limiter to prevent OOM
  memory_limiter:
    check_interval: 5s
    limit_mib: 512
    spike_limit_mib: 128

exporters:
  # Send to Grafana Cloud
  otlphttp/grafana:
    endpoint: ${env:GRAFANA_CLOUD_OTLP_ENDPOINT}
    auth:
      authenticator: basicauth/grafana

  # Debug - log to console
  debug:
    verbosity: detailed

extensions:
  basicauth/grafana:
    client_auth:
      username: ${env:GRAFANA_CLOUD_INSTANCE_ID}
      password: ${env:GRAFANA_CLOUD_API_KEY}

  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [basicauth/grafana, health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, transform, batch]
      exporters: [otlphttp/grafana]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlphttp/grafana]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlphttp/grafana]
```

- **Run** with the same three `GRAFANA_CLOUD_*` env vars exported, then `./otelcol-contrib --config config.yaml`.
- **As a Kubernetes DaemonSet:** a `kubeletstats` receiver (`collection_interval: 30s`, `auth_type: serviceAccount`, `endpoint: "https://${env:K8S_NODE_NAME}:10250"`, `insecure_skip_verify: true`) and a `k8sattributes` processor extracting `k8s.pod.name`, `k8s.pod.uid`, `k8s.deployment.name`, `k8s.namespace.name` and `k8s.node.name`, with pod association from resource attribute `k8s.pod.ip`, then from the connection. The DaemonSet (image `otel/opentelemetry-collector-contrib:latest`, `serviceAccountName: otelcol`) reads `GRAFANA_CLOUD_OTLP_ENDPOINT`, `GRAFANA_CLOUD_INSTANCE_ID` and `GRAFANA_CLOUD_API_KEY` from the `grafana-cloud-creds` secret, sets `K8S_NODE_NAME` from `fieldRef: spec.nodeName`, and a Service exposes 4317 and 4318.

## Sampling

- **Head sampling** is cheap and decided at the start, but can lose rare errors: `OTEL_TRACES_SAMPLER=parentbased_traceidratio`, `OTEL_TRACES_SAMPLER_ARG=0.1` (10%). In Alloy: `otelcol.processor.probabilistic_sampler "default" { sampling_percentage = 10 ... }` on the traces path only.
- **Tail sampling** decides after all spans of a trace are collected (it requires buffering), which lets you always keep errors, slow requests or specific services and sample the rest. It needs an Alloy or Collector `tail_sampling` processor:

```alloy
otelcol.processor.tail_sampling "default" {
  // Wait this long after seeing first span before deciding
  decision_wait               = "10s"
  num_traces                  = 100000
  expected_new_traces_per_sec = 100

  // Keep ALL error traces
  policy {
    name = "keep-errors"
    type = "status_code"
    status_code {
      status_codes = ["ERROR"]
    }
  }

  // Keep slow traces (> 500ms)
  policy {
    name = "keep-slow-traces"
    type = "latency"
    latency {
      threshold_ms = 500
    }
  }

  // Sample 10% of remaining
  policy {
    name = "probabilistic-sample"
    type = "probabilistic"
    probabilistic {
      sampling_percentage = 10
    }
  }

  output {
    traces = [otelcol.exporter.otlphttp.cloud.input]
  }
}
```

- **In the upstream Collector** a policy can also keep one service: `type: string_attribute`, `key: service.name`, `values: [payment-service]`, with `processors: [memory_limiter, tail_sampling, batch]`.
- **Generate span metrics before sampling.** Application Observability needs complete, unsampled traces for accurate RED metrics: App to Alloy (receives all traces) to span metrics to tail sampler to Tempo. The APM setup source writes the policies as an attribute list (`policies = [ { name = "errors", type = "status_code", status_code = { status_codes = ["ERROR"] } }, ... ]`), which disagrees with the `policy { }` blocks above; check the `otelcol.processor.tail_sampling` reference.

For this workflow, read [BEYLA.md](BEYLA.md). [existing skills/monitoring/grafana/OPENTELEMETRY-AND-BEYLA.md]

## Debugging

| Symptom | Cause |
|---|---|
| 401 from the OTLP gateway | Instance ID not numeric, or the API key lacks publisher roles |
| 404 | Wrong endpoint; it must end with `/otlp` |
| Spans missing | `OTEL_EXPORTER_OTLP_PROTOCOL` doesn't match the transport: `http/protobuf` for the Cloud gateway, `grpc` for a local Alloy |
| Need to see what the SDK emits | `OTEL_TRACES_EXPORTER=console`, or `curl -v https://otlp-gateway-prod-us-east-0.grafana.net/otlp/v1/traces -H "Authorization: Basic <base64>" -H "Content-Type: application/x-protobuf" --data-binary @empty.bin` |
| Node auto-instrumentation does nothing | A bundler (`@vercel/ncc`) defeated the require hooks |

## Prove it

- **Credentials:** the empty-body curl to `/v1/traces` returns 400, not 401 or 404.
- **Traces arrive:** TraceQL `{ resource.service.name = "myapp" }` in Explore shows spans within about 30 s ([TEMPO.md](TEMPO.md)).
- **Metrics arrive:** PromQL `count by (service_name)({service_name="myapp"})` returns a series.
- **Alloy forwarded:** `otelcol_exporter_sent_spans` rises on `http://localhost:12345/metrics`.
- **Resource attributes:** every service shows `service.name`, `service.namespace` and `deployment.environment` on its spans.
- **Operator injection:** `kubectl describe pod <pod> | grep -A2 'opentelemetry-auto-instrumentation'` shows the operator injected the agent.
