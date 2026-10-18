# OpenTelemetry and Beyla

Apps speak OTLP, either through Alloy or directly, to Grafana Cloud: metrics land in Mimir, logs in Loki, traces in Tempo, profiles in Pyroscope. Beyla is the alternative when you can't touch the code: it instruments HTTP, gRPC and database traffic with eBPF. Most outcomes come down to the endpoint, the protocol and the credentials matching each other (the Cloud OTLP gateway wants `http/protobuf`, a URL ending in `/otlp` and Basic auth from a numeric instance ID), and to every service setting `service.name`, `service.namespace` and `deployment.environment`. The vendor-neutral SDK setup, custom spans, log correlation and sampling theory are in the [observability skill's INSTRUMENT.md](../../backend/observability/INSTRUMENT.md); Alloy itself is [ALLOY.md](ALLOY.md). Docs: https://grafana.com/docs/opentelemetry/, https://grafana.com/docs/grafana-cloud/send-data/otlp/ and https://grafana.com/docs/beyla/latest/

**Contents:** [Credentials and endpoint](#credentials-and-endpoint) · [Environment variables](#environment-variables) · [Node.js](#nodejs) · [Through Alloy](#through-alloy) · [Kubernetes: the OTel Operator](#kubernetes-the-otel-operator) · [The upstream Collector](#the-upstream-collector) · [Sampling](#sampling) · [Beyla](#beyla) · [Debugging](#debugging) · [Prove it](#prove-it)

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

- **Always set `service.name`, `service.namespace` and `deployment.environment`.** `service.name` is unique per service (`payment-api`, `frontend`); `service.namespace` groups related services (`checkout`, `platform`); `deployment.environment` is the tier (`production`, `staging`, `development`). Application Observability depends on them ([APP-AND-DB-OBSERVABILITY.md](APP-AND-DB-OBSERVABILITY.md)).
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

Use the single vendor-neutral SDK definition in [INSTRUMENT.md](../../backend/observability/INSTRUMENT.md), then configure the Grafana gateway endpoint and credentials above. OpenTelemetry JS 2.x creates resources with `resourceFromAttributes`; the removed example used `new Resource` with unversioned installation instructions, omitted an imported metrics package and mixed loader conventions. Match the installed SDK, resource and ESM loader versions. [OpenTelemetry JS 2.x upgrade](https://github.com/open-telemetry/opentelemetry-js/blob/main/doc/upgrade-to-2.x.md)

### Manual span

```typescript
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('myapp');

async function handleRequest(req: Request) {
  const span = tracer.startSpan('handleRequest', {
    attributes: {
      'http.method': req.method,
      'user.id': req.userId,
    },
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await processRequest(req);
      return result;
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
```

### Trace IDs in logs (pino)

```javascript
const { trace } = require('@opentelemetry/api');

// In your logging middleware/utility:
function getTraceContext() {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const { traceId, spanId } = span.spanContext();
  return { traceId, spanId };
}

logger.info({ ...getTraceContext(), userId: '123' }, 'User logged in');
// Output: {"traceId":"abc123","spanId":"def456","userId":"123","msg":"User logged in"}
```

Keep trace and span IDs in log content or Loki structured metadata, rather than indexed labels. Structured metadata requires the documented compatible storage configuration (chunk format V4, schema v13 or later). The APM source promoted `traceId` and `spanId` to indexed labels, creating high cardinality. [Loki structured metadata](https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/); the canonical Loki guidance is [LOKI.md](LOKI.md).

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

- **Alloy as a DaemonSet for apps** (hostPort 4317/4318, `HOST_IP`) is in [APP-AND-DB-OBSERVABILITY.md](APP-AND-DB-OBSERVABILITY.md); the whole-cluster chart is [INFRA-AND-CLOUD.md](INFRA-AND-CLOUD.md).

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

## Beyla

Beyla instruments HTTP, gRPC and DB traffic with eBPF: no code changes, no SDK, no restart. It emits OTLP traces and Prometheus metrics.

### Requirements

- **Linux kernel 5.8+ with BTF:** `ls /sys/kernel/btf/vmlinux` must exist.
- **Root or `CAP_SYS_ADMIN`** (on Kubernetes, `privileged: true` plus `hostPID: true`); x86_64 or ARM64; a reachable OTLP receiver.

| Runtime | Covered |
|---|---|
| Node.js | HTTP only (no gRPC, no DB queries) |
| Go, Java | HTTP, gRPC, DB |
| Python, .NET, Rust | HTTP, gRPC |
| Ruby, C/C++, PHP | HTTP only |

### Run

```bash
docker run --privileged --pid=host \
  -v /sys/kernel/debug:/sys/kernel/debug:ro \
  -e BEYLA_OPEN_PORT=8080 \
  -e BEYLA_PROMETHEUS_PORT=8999 \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318 \
  -p 8999:8999 \
  grafana/beyla
```

- **The app must already be running** and listening on the port. Generate some traffic (`curl http://localhost:8080/ ; curl http://localhost:8080/api/users/42`).
- **Verify:** `curl -s http://localhost:8999/metrics | grep -E '^http_(server|client)_request_duration'` should list `http_server_request_duration_seconds` and counters. For traces, search Tempo in Explore by `service.name`; the default is the process name.
- **The opentelemetry skill's variant** (`grafana/beyla:latest` with `--rm -it`) mounts `/sys/kernel/security` and `/sys/fs/cgroup` instead of `/sys/kernel/debug`, uses `--network host`, sets `-e BEYLA_SERVICE_NAME=myapp` and `-e OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4317`, and verifies with `curl http://localhost:9090/metrics | grep beyla_build_info`.

### Configuration

```yaml
log_level: INFO

discovery:
  services:
    - name: my-app
      open_port: 8080
      # or by process name:
      # exe_path: /usr/bin/myapp
      # or by K8s metadata (auto-detected in K8s)

ebpf:
  wakeup_len: 100              # batch size for events
  track_request_headers: false # HTTP headers: high cardinality risk
  high_request_volume: false   # optimize for high-traffic services

# Distributed tracing output (OTLP)
otel_traces_export:
  endpoint: http://tempo:4318  # HTTP OTLP
  # Or gRPC:
  # endpoint: tempo:4317
  # protocol: grpc

# Metrics output (Prometheus)
prometheus_export:
  port: 9090
  path: /metrics

# Or metrics via OTLP
otel_metrics_export:
  endpoint: http://prometheus-otlp:9090
```

- **Env vars:** `BEYLA_OPEN_PORT` (`8080` or `8080-8090`), `BEYLA_EXECUTABLE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL` (`grpc` or `http/protobuf`, the default), `OTEL_SERVICE_NAME`, `BEYLA_LOG_LEVEL` (`DEBUG`/`INFO`/`WARN`/`ERROR`), `BEYLA_PROMETHEUS_PORT`, `BEYLA_PROMETHEUS_PATH` (default `/metrics`).
- **Control route cardinality:**

```yaml
routes:
  patterns:
    - /user/{id}
    - /api/v1/resources/{resource_id}
  ignored_patterns:
    - /health
    - /metrics
  ignore_mode: traces       # or metrics, both
  unmatched: heuristic      # or path, wildcard, low-cardinality
```

| `unmatched` | Behavior |
|---|---|
| `heuristic` | Replaces numeric IDs; the best default |
| `low-cardinality` | Collapses past a threshold |
| `wildcard` | `/**` |
| `path` | The real path; risks a cardinality explosion |

- **Trace sampling:** `otel_traces_export.sampler: { name: "parentbased_traceidratio", arg: "0.1" }`; the arg is a quoted string. Samplers: `always_on`, `always_off`, `traceidratio`, `parentbased_always_on` (default), `parentbased_traceidratio`.
- **Metrics it generates** (histograms): `http.server.request.duration`, `http.client.request.duration`, `rpc.server.duration`, `rpc.client.duration`, `db.client.operation.duration`, with labels `http.method`, `http.route`, `http.response.status_code`, `service.name`, `service.namespace`.
- **Through Alloy:** set `otel_traces_export: { endpoint: http://alloy:4318 }` and `otel_metrics_export: { endpoint: http://alloy:4318 }` in `beyla-config.yml`, received by:

```alloy
otelcol.receiver.otlp "beyla" {
  http { endpoint = "0.0.0.0:4318" }
  output {
    traces  = [otelcol.exporter.otlp.grafana_cloud.input]
    metrics = [otelcol.exporter.prometheus.local.input]
  }
}
```

  Verify in the Alloy UI (`localhost:12345`) that `otelcol.receiver.otlp.beyla` shows received spans and metrics above 0. Alloy also embeds Beyla as `beyla.ebpf` ([ALLOY.md](ALLOY.md#profiles-beyla-faro-and-clustering)).

### Kubernetes

- **DaemonSet and RBAC:**

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: beyla
  namespace: monitoring
spec:
  selector:
    matchLabels: { app: beyla }
  template:
    metadata:
      labels: { app: beyla }
    spec:
      hostPID: true                # required for eBPF
      serviceAccountName: beyla
      containers:
        - name: beyla
          image: grafana/beyla:latest
          securityContext:
            privileged: true       # or specific caps:
            # capabilities: { add: [SYS_ADMIN, SYS_PTRACE, NET_ADMIN] }
          env:
            - { name: BEYLA_OPEN_PORT,             value: "8080" }
            - { name: OTEL_EXPORTER_OTLP_ENDPOINT, value: "http://alloy:4318" }
          volumeMounts:
            - { name: sys-kernel-debug, mountPath: /sys/kernel/debug, readOnly: true }
      volumes:
        - name: sys-kernel-debug
          hostPath: { path: /sys/kernel/debug }
```

```yaml
apiVersion: v1
kind: ServiceAccount
metadata: { name: beyla, namespace: monitoring }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata: { name: beyla }
rules:
  - apiGroups: [""]
    resources: [nodes, pods, services, endpoints, namespaces]
    verbs: [get, list, watch]
```

- **The opentelemetry skill's DaemonSet** sets `BEYLA_SERVICE_NAME=auto`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy.monitoring:4317` and `BEYLA_KUBE_METADATA_ENABLE=true`, and mounts `/sys/kernel/security` instead.
- **Discovery filters:**

```yaml
discovery:
  services:
    - k8s_namespace: "production"     # all pods in namespace
    - k8s_pod_name: "frontend.*"      # by pod name regex
    - k8s_deployment_name: "api"      # by deployment name
    - open_port: 8080                 # any pod with that port
```

  Spans get `k8s.namespace.name`, `k8s.pod.name`, `k8s.node.name` and `k8s.deployment.name`.
- **Helm:** `helm install beyla grafana/beyla --version 1.16.7 --set discovery.services[0].open_port=8080 --set otelTraces.endpoint=http://tempo:4318`.
- **Verify:**

```bash
# 1. Verify DaemonSet rollout
kubectl -n monitoring rollout status ds/beyla

# 2. Verify pods are Running, one per node
kubectl -n monitoring get pods -l app=beyla -o wide

# 3. Verify eBPF probes attached (no errors mentioning BTF or "permission denied")
kubectl -n monitoring logs ds/beyla --tail=50 | grep -Ei 'error|fail|btf' || echo "clean"

# 4. Verify telemetry is flowing: check the Tempo/Alloy receiver for spans from the cluster
#    Or scrape one pod directly:
kubectl -n monitoring port-forward ds/beyla 8999:8999 &
curl -s localhost:8999/metrics | head
```

## Debugging

| Symptom | Cause |
|---|---|
| 401 from the OTLP gateway | Instance ID not numeric, or the API key lacks publisher roles |
| 404 | Wrong endpoint; it must end with `/otlp` |
| Spans missing | `OTEL_EXPORTER_OTLP_PROTOCOL` doesn't match the transport: `http/protobuf` for the Cloud gateway, `grpc` for a local Alloy |
| Need to see what the SDK emits | `OTEL_TRACES_EXPORTER=console`, or `curl -v https://otlp-gateway-prod-us-east-0.grafana.net/otlp/v1/traces -H "Authorization: Basic <base64>" -H "Content-Type: application/x-protobuf" --data-binary @empty.bin` |
| Node auto-instrumentation does nothing | A bundler (`@vercel/ncc`) defeated the require hooks |
| Beyla `failed to load BPF object` | Kernel older than 5.8, or BTF missing |
| Beyla metrics but no spans | Endpoint, protocol (http vs grpc) and port (4318 http / 4317 grpc) |
| Beyla route cardinality explodes | `routes.unmatched: heuristic` and add patterns |
| Beyla `CrashLoopBackOff` | `hostPID` or `privileged` missing |

## Prove it

- **Credentials:** the empty-body curl to `/v1/traces` returns 400, not 401 or 404.
- **Traces arrive:** TraceQL `{ resource.service.name = "myapp" }` in Explore shows spans within about 30 s ([TEMPO.md](TEMPO.md)).
- **Metrics arrive:** PromQL `count by (service_name)({service_name="myapp"})` returns a series.
- **Alloy forwarded:** `otelcol_exporter_sent_spans` rises on `http://localhost:12345/metrics`.
- **Resource attributes:** every service shows `service.name`, `service.namespace` and `deployment.environment` on its spans.
- **Operator injection:** `kubectl describe pod <pod> | grep -A2 'opentelemetry-auto-instrumentation'` shows the operator injected the agent.
- **Beyla:** `/sys/kernel/btf/vmlinux` exists, `http_server_request_duration` series appear on its metrics port, the DaemonSet rollout completes and its logs show no `btf` errors, and `http.route` values are templates (`/user/{id}`), not raw paths.
