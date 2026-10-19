# PostHog tracing

PostHog Node span instrumentation and APM investigation. Client creation and shutdown stay in [SETUP-SERVER.md](SETUP-SERVER.md); generic OpenTelemetry stays in [observability](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md). [PostHog skills, SETUP-SERVER.md; LOGS-AND-APM.md]

## Distributed tracing

[PostHog skills, SETUP-SERVER.md]

posthog-node 5.52.0+. The span API is experimental and may change in a minor release.

- **Off until you set `traces`;** no OpenTelemetry dependency. Set `serviceName`: PostHog groups operations by service and span name.

```typescript
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  traces: {
    serviceName: 'checkout-api',
  },
})
```

- **`withSpan(name, [options], callback)`** makes the span active and ends it when the callback returns or its promise settles; nested spans become children. A throw or rejection records the exception, sets status `error` and propagates the original error. The exception includes a stack trace with server file paths; delete `exception.stacktrace` in `beforeSpanSend` if you don't want them. A callback that ends the span itself gets the rethrow but not the recording.

```typescript
await posthog.withSpan('POST /checkout', async (span) => {
  span.setAttribute('plan', user.plan)

  const order = await posthog.withSpan('create-order', () => createOrder(cart))
  await posthog.withSpan('charge-card', () => stripe.charge(order))

  return order
})
```

- **`startSpan` does not make the span active:** pass `parent` explicitly and call `end()` yourself. `getActiveSpan()` returns the active span or `null`.

```typescript
const span = posthog.startSpan('background-sync', { attributes: { queue: 'emails' } })

// Explicitly parent a child to a span that isn't active.
const child = posthog.startSpan('send-batch', { parent: span })
child.end()

span.end()
```

- **`startSpan` always returns a handle.** Without `traces`, with the SDK disabled or the user opted out, the handle is inert and nothing is exported; an inert handle given a `parent` header still returns it from `traceparent()`, so a service with tracing off passes a distributed trace through.
- **Low-cardinality names** (`GET /users/:id`, not `GET /users/123`); variable values go in attributes (strings, numbers, booleans, BigInt, arrays of those).
- **Span methods:** `setAttribute(key, value)`, `setAttributes(attributes)`, `addEvent(name, attributes?, timestamp?)`, `setStatus(status, message?)` (`'ok'` or `'error'`), `recordException(error)`, `updateName(name)`, `traceparent()`, `tracestate()` (or null), `end(endTime?)`.
- **Span options:** `kind` (`'internal'` default, `'server'`, `'client'`, `'producer'`, `'consumer'`), `attributes`, `parent` (a span handle or an inbound W3C `traceparent` string), `tracestate` (ignored when `parent` is a handle), `startTime` (ms epoch or `Date`; the server clamps a start more than 24 hours old to the receive time, and with `debug` on the SDK warns).
- **W3C Trace Context across services.** A missing or malformed `traceparent` starts a new trace instead of throwing. A continued trace propagates the sampled flag; PostHog itself doesn't sample.

```typescript
app.post('/checkout', async (req, res) => {
  await posthog.withSpan('POST /checkout', { kind: 'server', parent: req.get('traceparent') }, async (span) => {
    const traceparent = span.traceparent()

    await fetch('https://payments.internal/charge', {
      method: 'POST',
      headers: traceparent ? { traceparent } : {},
    })

    res.json({ status: 'ok' })
  })
})
```

```node
// Propagate the trace to another service
const traceparent = posthog.getActiveSpan()?.traceparent()
await fetch(url, { headers: traceparent ? { traceparent } : {} })
```

- **Inside a request context** (Express middleware or `withContext`) spans carry `posthogDistinctId` and `sessionId` attributes; outside they don't.
- **`beforeSpanSend`** edits a span in place or returns `null` to drop it. It sees plain values (not OTLP encoding) and runs after `posthogDistinctId` and `sessionId` are attached; `traceId`, `spanId`, `parentSpanId` are read-only (assignments ignored). A hook that throws drops the span. An array of hooks runs left to right and the first `null` stops the chain.

```typescript
const posthog = new PostHog('<ph_project_token>', {
  host: 'https://us.i.posthog.com',
  traces: {
    serviceName: 'checkout-api',
    beforeSpanSend: (span) => {
      if (span.attributes['http.route'] === '/health') return null

      delete span.attributes['http.request.header.authorization']
      return span
    },
  },
})
```

- **Span limits:** 128 attributes, 128 events, 128 attributes per event, 8192 characters per string attribute value. The endpoint rejects a too-large span whole. Past a cap the earliest are kept and the dropped count is reported (`droppedEventsCount`). `posthogDistinctId` and `sessionId` don't count. The SDK-recorded `exception` event takes a normal slot, so raise `maxEventsPerSpan` for spans with many events that can fail. Caps are re-applied after `beforeSpanSend`.

| `traces` option | Default |
|---|---|
| `serviceName`, `serviceVersion`, `environment` | none |
| `resourceAttributes` | none (takes precedence over the three above) |
| `flushIntervalMs` | `5000` |
| `maxExportBatchSize` | `512` |
| `maxQueueSize` | `2048` (beyond it, dropped) |
| `maxLiveSpans` | `10000` (at the limit `startSpan` returns an inert handle) |
| `maxSpanAgeMs` | `3600000` (older open spans are treated as leaked and never exported) |
| `beforeSpanSend` | none |
| `maxAttributesPerSpan`, `maxEventsPerSpan` | `128` |
| `maxAttributeValueLength` | `8192` |

- **Flush and shutdown export ended spans.** A span still open at `flush()` is exported once it ends; one open at `shutdown()` is discarded.
- **Edge runtimes can't track the active span across `await`.** Node uses `AsyncLocalStorage`; the edge build tracks synchronously, so after an `await` `getActiveSpan()` returns null. Pass `{ parent: span }` explicitly:

```typescript
await posthog.withSpan('handler', async (span) => {
  const user = await loadUser()
  await posthog.withSpan('render', { parent: span }, () => render(user))
})
```

## APM traces

[PostHog skills, LOGS-AND-APM.md]

These are OpenTelemetry spans: not AI observability traces (`$ai_*` events) and not logs. Each trace is a tree of spans.

- **Governed metric first:** for SLO burn, call `posthog:metric-list` and look for `slo_explicit_burn_by_operation`; run an approved, non-drifted match with `posthog:data-catalog-metric-run` for the canonical headline. Otherwise label a derived measure as noncanonical.

| Tool | Use |
| --- | --- |
| `posthog:query-apm-spans` | Search and filter spans (compact) |
| `posthog:apm-trace-get` | The full span list for one hex `trace_id` |
| `posthog:apm-spans-aggregate` | Per-operation count, p50/p95, errors |
| `posthog:apm-spans-tree` | Call-tree aggregates per `(parent, child)` edge |
| `posthog:apm-spans-count` | Scalar pre-flight |
| `posthog:apm-spans-sparkline` | Zero-filled counts over time |
| `posthog:apm-spans-duration-histogram` | Trace counts per log-scale duration bucket |
| `posthog:apm-attribute-breakdown` | Counts grouped by one attribute |
| `posthog:apm-services-list`, `posthog:apm-attributes-list`, `posthog:apm-attribute-values-list` | Discovery |

- **Links:** `apm-trace-get` returns `{ results: [span, ...], _posthogUrl: "..." }` as a flat list; always include `_posthogUrl` in the response. `query-apm-spans` returns no `_posthogUrl`: feed its `trace_id` to `apm-trace-get`. Never hand-construct PostHog URLs.
- **Rebuild the tree:** roots have `is_root_span` true (or a zero `parent_span_id`); a span's parent is the span whose `span_id` equals its `parent_span_id`. Prefer `is_root_span` over string-matching zeros.
- **Use the aggregate tools for aggregates,** not SQL. Always set `dateRange` on `query-apm-spans` (default `-1h`).

### Questions

[PostHog skills, LOGS-AND-APM.md]

- **"Where is time going?"** Sort by `self_time_nano` (only from `apm-trace-get`): the duration not covered by children, computed as an interval union so parallel children count once. A parent with a large self time is an uninstrumented gap. In `apm-spans-tree`, `calls_per_parent_invocation` separates a slow-per-call child from one that runs 20x per parent.
- **"Where did the error happen?"** Find `status_code == 2`, then walk up via `parent_span_id`. Error detail is in the span `attributes` (`exception.message`, `exception.type`).
- **"Did the request hit service X?"** Check the services in the trace; if X is missing, check `apm-services-list` for recent spans.
- **"What's different about bad spans?"** Scope the bad set (`status_code = Error` or a `duration` threshold); pick candidate keys (`server.address`, `http.response.status_code`, `db.system`, `k8s.pod.name`, `service.version`); run `apm-attribute-breakdown` per key and confirm over-representation against all traffic. A value at 95% of errors but 10% of traffic is the culprit; one at 95% of both is just volume.
- **"When did it spike?"** `apm-spans-sparkline` (about 50 adaptive buckets) in total and again with `statusCodes: [2]`; error rate = errors / total per bucket. Zoom with a narrower `dateRange`, then `query-apm-spans`.
- **Latency distribution:** `apm-spans-duration-histogram` of the root span, in log-scale 1-2-5 buckets. A second hump or fat tail is a slow population (`bucket_ns`): fetch it with a `duration` filter (ns) and `orderBy: "duration"`.
- **Fan-out:** wide trees are parallel, deep ones sequential. A `Client` (3) span followed by a `Server` (2) span on the callee is a synchronous downstream call.
- **Discover before filtering:** `apm-services-list`, then `apm-attributes-list` (`attribute_type: "span"` or `"resource"`), then `apm-attribute-values-list`. Custom attributes can't be guessed.

```json
posthog:query-apm-spans
{
  "query": {
    "serviceNames": ["api-gateway"],
    "dateRange": {"date_from": "-1h"},
    "filterGroup": [
      {"key": "http.status_code", "operator": "gt", "type": "span_attribute", "value": "499"}
    ]
  }
}
```

### Span fields and gotchas

[PostHog skills, LOGS-AND-APM.md]

- **Fields:** `uuid`, `trace_id` (32-char hex), `span_id` (16-char hex), `parent_span_id`, `name`, `kind`, `service_name`, `status_code`, `timestamp`, `end_time` (ISO 8601), `duration_nano`, `is_root_span`, `matched_filter` (1 matched the `query-apm-spans` filter, 0 only shares the trace), `attributes` (span-level OTel attributes such as `http.method`, `db.statement`, `net.peer.name`), `self_time_nano`. Resource attributes (k8s labels, `service.version`) are not in the payload.
- **Filter `type` values:** `span` (built-ins `trace_id`, `span_id`, `duration`, `name`, `kind`, `status_code`, `is_root_span`), `span_attribute`, `span_resource_attribute`. `is_root_span` true isolates entry spans (RED request counts).
- **Durations are nanoseconds:** 1 s = `1_000_000_000` (the frontend translates `1000ms`).
- **`status_code`:** 0 Unset, 1 OK, 2 Error. The UI's `OK` matches {0,1}; programmatically treat `== 2` as the error set.
- **`kind`:** 0 Unspecified, 1 Internal, 2 Server, 3 Client, 4 Producer, 5 Consumer.
- **A root's `parent_span_id` is `"0000000000000000"`** (16 zero hex chars, the 8-byte span ID width), not null.

### Large traces

[PostHog skills, LOGS-AND-APM.md]

**Upstream-only prerequisite:** the helper scripts described in this section are not included in this skill. Obtain and read the exact source helper before using its commands or depending on its output; if unavailable, report that step as unverified. Do not invent a replacement or assume these paths exist in the project. [PostHog skills, TRACING.md]

Claude Code persists large results as `[{ "type": "text", "text": "{\"results\": [...], \"_posthogUrl\": \"...\"}" }]`; the helper scripts unwrap it (`_common.load_trace_file` looks for the keys `trace_spans`, `spans`, `results`). `MAX_LEN=0` means unlimited.

| Script | Output |
| --- | --- |
| `python3 scripts/print_summary.py FILE` | Services, kinds, roots, top-5 slowest by `duration_nano`, error spans (`MAX_LEN` default 100) |
| `print_timeline.py` | DFS tree sorted by timestamp, renders orphan subtrees (default 120) |
| `SPAN="name" python3 scripts/extract_span.py FILE` | Case-insensitive substring match: full row, parent and children (default 0, unlimited) |
| `SEARCH="kw" python3 scripts/search_spans.py FILE` | Scans `name`, `service_name`, `span_id`, `trace_id`, `parent_span_id`, `uuid`, not attributes (default 200) |
| `show_structure.py` | Keys and types, depth 3 |

## Prove it

[PostHog skills, SETUP-SERVER.md; LOGS-AND-APM.md]

- **Spans export:** with `traces.serviceName` set, a `withSpan` call appears under that service, a thrown error marks it `error`, and a downstream service receives `traceparent`.
- **A trace answer links back:** the reply includes the `_posthogUrl` from `apm-trace-get`, and every error claim points to a span with `status_code == 2`.
- **Duration filters are in nanoseconds:** a 1 s threshold is written `1000000000`.
