# Beyla eBPF instrumentation

Use for Beyla kernel and capability requirements, deployment, discovery, route cardinality and telemetry verification. The Grafana Cloud OTLP gateway is [OTLP-GATEWAY.md](OTLP-GATEWAY.md). [existing skills/monitoring/grafana/OPENTELEMETRY-AND-BEYLA.md]

## Beyla

[existing OPENTELEMETRY-AND-BEYLA.md]

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

[existing OPENTELEMETRY-AND-BEYLA.md]

| Symptom | Check |
|---|---|
| Beyla `failed to load BPF object` | Kernel older than 5.8, or BTF missing |
| Beyla metrics but no spans | Endpoint, protocol (http vs grpc) and port (4318 http / 4317 grpc) |
| Beyla route cardinality explodes | `routes.unmatched: heuristic` and add patterns |
| Beyla `CrashLoopBackOff` | `hostPID` or `privileged` missing |

## Prove it

[existing OPENTELEMETRY-AND-BEYLA.md]

- **Beyla:** `/sys/kernel/btf/vmlinux` exists, `http_server_request_duration` series appear on its metrics port, the DaemonSet rollout completes and its logs show no `btf` errors, and `http.route` values are templates (`/user/{id}`), not raw paths.
