# Where telemetry goes

Choose direct export, a local Collector or an agent/gateway arrangement from the existing OpenTelemetry and Collector references below. This guide keeps telemetry destinations, batching, privacy and backend configuration together. [existing observability, COLLECTOR.md]

## Three shapes, by size

The SDK's batching span processor has a bounded queue. The old direct-export row said there was no buffer, which does not describe a configured batching processor. https://opentelemetry.io/docs/specs/otel/trace/sdk/#batching-processor

| Setup | When | Trade-off |
|---|---|---|
| App exports straight to the backend | Getting started, one small service, a hosted backend | SDK buffering depends on the configured processor; bounded queues and failed exports can drop telemetry; every app holds backend addresses and credentials |
| One Collector next to the apps | One machine, a monolith, a single compose file | One place to batch, filter, redact and fan out; apps know one OTLP address |
| An agent Collector on every box plus one gateway | Two or more machines, boxes whose memory is budgeted for real work, browser telemetry, several teams | Local buffering on each box, a single controlled ingest point, backends known only to the gateway |

Moving between these arrangements can keep the same application instrumentation, provided the configured exporter transport matches its receiver. The [Node example](INSTRUMENT.md#the-sdk-loaded-first) explicitly uses HTTP/protobuf; the agent example below enables only gRPC on 4317, so those two displayed configurations cannot be paired directly. The old line said only the endpoint address changes, omitting the transport requirement. [OpenTelemetry HTTP/protobuf exporter](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/exporter-trace-otlp-proto/README.md), [existing observability, COLLECTOR.md, Agent and gateway]

## Agent and gateway

Each application box runs a small Collector on its private compose network. The app exports to it by a local name; the agent batches and forwards to the gateway over a private network; the gateway routes each signal to its store (traces to Tempo, logs to Loki, metrics to a Prometheus scrape endpoint) and Grafana reads them all.

```yaml
# agent: one per box
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 96
    spike_limit_mib: 32
  batch:
exporters:
  otlp/gateway:
    endpoint: ${env:OTEL_GATEWAY_ENDPOINT}   # no default: a missing value fails at startup
    retry_on_failure: { enabled: true }
    sending_queue: { enabled: true, queue_size: 5000 }
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp/gateway] }
    metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp/gateway] }
    logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp/gateway] }
```

```yaml
# gateway: one, on the monitoring box (receivers and processors as in the agent)
exporters:
  otlp/tempo:   { endpoint: tempo:4317 }
  otlphttp/loki: { endpoint: http://loki:3100/otlp }    # Loki ingests OTLP natively
  prometheus:   { endpoint: 0.0.0.0:8889 }              # Prometheus scrapes this
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlp/tempo] }
    metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [prometheus] }
    logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlphttp/loki] }
```

The decisions that matter:

- **The app knows only a local address.** Moving the monitoring stack doesn't touch application deployments.
- **Sending queue plus retry** can absorb a bounded outage. Check the exporter's queue sizing unit: the default `queue_size` counts requests or batches, not individual spans. In-memory queues are lost on Collector restart; persistence requires a configured storage extension. Overflow and exhausted retries can drop telemetry. The old sizing rule multiplied spans per second by seconds without accounting for batches. https://github.com/open-telemetry/opentelemetry-collector/blob/main/exporter/exporterhelper/README.md
- **`memory_limiter` first, with real numbers.** It checks periodically, refuses data above the soft limit and forces garbage collection above the hard limit; memory can exceed the configured limit. The preceding component must retry refused data or it is lost. The removed comment called this a hard memory ceiling. https://github.com/open-telemetry/opentelemetry-collector/blob/main/processor/memorylimiterprocessor/README.md
- **No defaults for endpoints.** A Collector that starts with a wrong or empty endpoint swallows telemetry silently until the next incident shows nothing.
- **Agents publish no host ports;** only the app on the same network can reach them. Nothing exposes an ingest surface it doesn't need.
- **Encrypt the agent-to-gateway hop,** with TLS or a private network that already encrypts (a WireGuard mesh such as Tailscale); then plaintext OTLP inside it is acceptable.
- **New boxes need no monitoring config:** telemetry is pushed, `service.instance.id` tells instances apart, and the agent needs only the gateway address.
- **The gateway is the place** for tail sampling, redaction (drop attributes that may carry personal data), and per-signal routing.

**Browser telemetry** (JavaScript errors, Web Vitals, fetch spans) can go through the same gateway, for example with Grafana Faro, so a browser fetch and the API span it triggered land in one trace through the propagated `traceparent`. That receiver is the one ingest point that must be public; rate-limit it and accept only what browsers send.

## Backends

- **Local development:** the `grafana/otel-lgtm` image runs a Collector, Tempo, Loki, Prometheus and Grafana in one container; Jaeger's all-in-one image is enough for traces alone (UI on 16686, OTLP on 4317).
- **A self-hosted stack:** the Collector with Tempo for traces, Loki for logs, Prometheus (or Mimir) for metrics, and Grafana for dashboards and alerting.
- **Hosted (Grafana Cloud, Honeycomb, Datadog and others):** point the exporter or the gateway at the vendor's OTLP endpoint with three settings: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, and `OTEL_EXPORTER_OTLP_HEADERS` carrying the authorization token. Keep the token out of logs and source control.

## Prove it

A working exporter isn't working monitoring. Check that service names and environments are right, that the sampling rate is what you meant, that logs open from traces, and that you have alerts on the few numbers that matter (error rate, latency percentiles, queue age, saturation) before the first incident needs them.
