# Instrumentation

What to emit once Sentry is installed, and how to name it: which signal answers which question, where the deliberate instrumentation goes, and the attribute keys Sentry understands. Setup per platform lives in the platform files ([BROWSER.md](BROWSER.md), [REACT.md](REACT.md), [NEXTJS.md](NEXTJS.md), [NODE.md](NODE.md), [NESTJS.md](NESTJS.md), [CLOUDFLARE.md](CLOUDFLARE.md), [REACT-NATIVE.md](REACT-NATIVE.md), [FLUTTER.md](FLUTTER.md)); what each signal is for is in [SIGNALS.md](SIGNALS.md) and per-signal practice in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md), LLM calls in [AI-MONITORING.md](AI-MONITORING.md). The mechanism that decides most outcomes: about 80% of spans come from auto-instrumentation, and the deliberate 20% is a span attribute or two, a decision-point log and a metric, each put in the signal whose workflow you actually need. All four signals share a `trace_id` and correlate automatically.

**Contents:** [Choose the signal](#choose-the-signal) · [Tiebreakers](#tiebreakers) · [Gotchas](#gotchas) · [Sampling per signal](#sampling-per-signal) · [Scope of the task](#scope-of-the-task) · [Instrumentation example](#instrumentation-example) · [Automatic browser instrumentation](#automatic-browser-instrumentation) · [Integrations](#integrations) · [Attribute semantics](#attribute-semantics) · [Prove it](#prove-it)

## Choose the signal

| Signal | The one question it answers | Docs |
|---|---|---|
| Errors | "What just broke?" A stack trace and exception type grouped into a deduplicated Issue. "If your code threw, it's an error." | https://docs.sentry.io/product/issues/ |
| Traces | "Did the request flow the way it was supposed to?" Mostly auto-instrumented. | https://docs.sentry.io/product/explore/trace-explorer/ |
| Logs | "What was true at this point in the code, and why?" | https://docs.sentry.io/product/explore/logs/ |
| Metrics | "How's this trending over time?" Counters, gauges, distributions. | https://docs.sentry.io/product/explore/metrics/ |

- **The mental split:** "a log is one request's story (the needle), a metric is the aggregate (whether the haystack is normal), a trace is where the time went, and an error is the thing that needs a stack trace and an owner."

| You want to know | Use |
|---|---|
| It crashed, I need a stack trace | Error |
| How long it took, which step was slow | Traces |
| Whether the request went through the expected steps | Traces |
| The state when the code made a decision | Log |
| What a function received and returned | Log |
| How often, whether the rate is normal | Metric |
| Whether something changed after a deploy | Metric |

- **The trace waterfall** is "a format a coding agent can reason about directly": read it to find work that could run in parallel.
- **Logs and metrics are the two pillars most projects haven't turned on yet,** and both are included on every plan.

## Tiebreakers

- **Span attribute or metric:** a value read while viewing one request's trace is a span attribute; a value you chart, alert on or slice across all requests is a metric. The same number can be both (`candidate_count` on the span, `recommendations.served` as a metric). "If a value only makes sense in the context of a specific span, it lives on the span."
- **Log or span:** a span is a timed node (rarely hand-written); a log is the state at a decision point inside it (always on purpose). Don't put decision state only on span attributes: "traces are sampled, and the one request a customer is complaining about usually turns out to be the one that got sampled out ... Logs aren't sampled."
- **Log or metric:** "Don't derive a rate by counting log lines; emit the metric directly." Emit both when you need the rate and the reconstruction.
- **Error or log:** a stack trace plus a tracked Issue is an error; an unexpected but handled condition is a log.
- **Emit wide into the signal whose workflow you need.** One fat event can't group into an Issue, render a waterfall or fire a real-time alert.

## Gotchas

- **A successful request is not an error.** Zero rows is a success; the error feed can be empty while users are unhappy.
- **A clean trace can hide a wrong outcome.**
- **Logs are most valuable when wide** (one event per operation with all its context; [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#logs)).
- **Keep metric attribute cardinality low.** "High-cardinality attributes (like raw `user_id`) degrade backend performance; that level of detail belongs on a log, not a metric dimension." The sources disagree: the AI-monitoring sampling fallback uses `user_id` as a metric attribute ([AI-MONITORING.md](AI-MONITORING.md)), and the metrics concept calls high cardinality fine, "a key benefit" (user IDs, request IDs, URLs; [SIGNALS.md](SIGNALS.md)).
- **A worked investigation:** `/recommendations/{user_id}` returned 200, the error feed was empty and the trace looked normal. The metric `recommendations.served`, tagged by `ranking_version` and `outcome`, showed a v2 fallback spike after a flag rollout; the log for one `user_id` showed `candidate_count` 0 from `recommendations_v2` (rows never backfilled). "No single signal cracked it; each ruled something out."

## Sampling per signal

| Signal | Sampled | Filter with |
|---|---|---|
| Traces | Yes (`tracesSampleRate`: higher in dev, lower in production) | `tracesSampler` |
| Errors | Captured by default | `beforeSend` |
| Logs | No | `beforeSendLog` |
| Metrics | No | `beforeSendMetric` ("drop noisy metrics by name, not by random fraction") |

## Scope of the task

- **Pick one scope; when in doubt, first error.** *First error:* a brand-new install (detect who owns setup, provision, install the base, verify a real error; defer extra signals). *Add a signal:* keep the base install, run ownership detection, wire only that signal. *Full setup* ("set it up properly"): base setup, then propose releases, source maps, an uptime monitor once there is a production URL, and the signals that fit.
- **Never over-instrument.** No logging, replay, profiling or metrics up front when the ask is only to get Sentry working. "The base `init` includes tracing; that's the SDK's recommended default, not over-instrumentation."
- **One owner per runtime.** Run setup-ownership detection for every scope. "Choose one owner for each AI runtime, preserve existing instrumentation where possible, and never create a second Sentry initialization, OTLP exporter, or AI span producer."
- **Signals that can be wired:** errors, tracing, profiling (requires tracing, per the instrument skill; the profiling concept says the default `manual` lifecycle runs independently of tracing, [SIGNALS.md](SIGNALS.md)), logging, metrics, cron check-ins, Session Replay, User Feedback, uptime monitors, AI/LLM monitoring.
- **Per signal, WHY then HOW.** Explain why only if the user is unsure (skip it when they said "you pick the defaults"), then fetch the platform's docs page for that signal.
- **Uptime has no SDK code.** Confirm the production URL and create the monitor with the MCP tool `create_uptime_monitor`.
- **Verify in Sentry, not on the dashboard.** Trigger the signal through the real code path, poll the MCP, give the user the direct issue URL and confirm the stack trace is readable. "The task isn't done until the event is seen in Sentry; don't stop at 'go check your dashboard.'"
- **Suggest, don't auto-run, the next steps:** ship to production; an uptime monitor if there is a production host; logging, replay, profiling; source maps and releases ("the `release`/`environment` tag at minimum (a one-option change worth making before anything ships)"). After JS/TS AI monitoring setup, offer the `dataCollection` options page for the guide (`https://docs.sentry.io/platforms/javascript/guides/<guide>/configuration/options/#dataCollection`, for example `cloudflare`, `nextjs`, `node`; fallback `https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection`); not for Python, PHP, unknown SDKs or framework-owned OTLP setups without a JS Sentry SDK.
- **These APIs are illustrative.** Verify exact signatures and minimum versions against docs.sentry.io.

## Instrumentation example

Node/Express. The example says logs require `enableLogs: true` at init; the JS logs page says logs are on by default from SDK `10.71.0` and need `enableLogs: true` below it ([SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#logs)).

```typescript
import * as Sentry from "@sentry/node";

// The route is auto-instrumented. The framework gives you the request span;
// the DB integration gives you a span for every query below. You write none of it.
app.get("/recommendations/:userId", async (req, res) => {
  const userId = Number(req.params.userId);

  const user = await db.getUser(userId);                 // auto-instrumented db span
  const useV2 = flagEnabled("ranking_v2", user);
  const rankingVersion = useV2 ? "v2" : "v1";

  const candidates = await db.personalizedRecs(userId, rankingVersion); // auto db span
  const outcome = candidates.length ? "personalized" : "fallback";
  const items = candidates.length ? candidates : await db.popularItems(); // auto db span

  // SPAN ATTRIBUTE: context about THIS request's flow, read inside the trace.
  // It rides on the auto-instrumented request span; no new span needed.
  Sentry.getActiveSpan()?.setAttributes({
    ranking_version: rankingVersion,
    "recommendation.outcome": outcome,
  });

  // LOG: the state at the moment the code chose personalized vs. fallback.
  // Requires `enableLogs: true` in Sentry.init(). The only signal that records *why*.
  Sentry.logger.info("recommendations lookup", {
    user_id: userId,
    ranking_version: rankingVersion,
    "flag.ranking_v2": useV2,
    source_table: `recommendations_${rankingVersion}`,
    candidate_count: candidates.length,
    outcome,
  });

  // METRIC: the rate across all requests, sliceable by version and outcome.
  Sentry.metrics.count("recommendations.served", 1, {
    attributes: { ranking_version: rankingVersion, outcome },
  });

  res.json(items);
});
```

A custom span, for a meaningful business operation:

```typescript
const ranked = await Sentry.startSpan(
  { name: "rank_candidates", op: "rank" },
  (span) => {
    span.setAttribute("candidate_count", candidates.length);
    return rank(candidates);
  },
);
```

- **One `setUser()` follows the user** across errors, spans, logs and metrics; frontend SDKs also tag everything with browser, OS and release. The example above puts `user_id` on the log, while the logging guide says to strongly prefer `setUser` over repeating user identifiers as log attributes; both are in the sources.

## Automatic browser instrumentation

`browserTracingIntegration` captures page loads (LCP, CLS, TTFB), navigations, fetch/XHR, INP and long tasks (over 50 ms): one transaction per page load or navigation, with child spans for fetch and XHR. Wiring per framework is in [BROWSER-TRACING.md](BROWSER-TRACING.md) and [REACT-TRACING.md](REACT-TRACING.md).

- **`tracePropagationTargets` default disagrees between pages:** the automatic-instrumentation page lists `['localhost', /^\/$/]` ("tracing headers are only attached to requests containing `localhost` or starting with `/`"); the options page says all same-origin requests are propagated. Flutter, unset, attaches to every outgoing request from the instrumented client. The automatic-instrumentation page's example: `["localhost", /^https:\/\/api\.example\.com/]`. The server must allow the headers: `Access-Control-Allow-Headers: sentry-trace, baggage`.
- **Parameterize span names so they group:** `beforeStartSpan: (options: StartSpanOptions) => StartSpanOptions`, for example `/users/12312012` to `/users/:userid`, or replacing `/[a-f0-9]{32}/` with `/<hash>` and `/\d+/` with `/<digits>`.
- **Skip noise:** `shouldCreateSpanForRequest: (url) => !url.match(/\/health\/?$/)` for health and analytics requests; `ignoreResourceSpans` (9.23.0, for example `["resource.css", "resource.script"]`); `webVitals` (11.0.0, for example `webVitals: { ignore: ["inp"] }`; `enableInp` is deprecated in v11).
- **Custom routing:** set `instrumentPageLoad` and `instrumentNavigation` to `false` and create spans by hand.

| Option | Default |
|---|---|
| `idleTimeout` / `finalTimeout` / `childSpanTimeout` | `1000` / `30000` / `15000` |
| `instrumentPageLoad`, `instrumentNavigation` | `true` |
| `instrumentBfcacheRestore` | `true` (11.0.0) |
| `enableLongTask` | `true` |
| `enableLongAnimationFrame` | `true` (8.18.0) |
| `markBackgroundSpan` | `true` ("Recommended to keep enabled") |
| `enableReportPageLoaded` | `false` (10.13.0; enables `Sentry.reportPageLoaded()`) |
| `traceFetch`, `traceXHR`, `enableHTTPTimings` | `true` |
| `linkPreviousTrace` | `'in-memory'` (`'session-storage'`, `false`) |
| `onRequestSpanStart(span, { headers })` | hook |

- **`userTimingIntegration({ ignore: ["myMeasurement", /myMark/] })`** captures `performance.mark` and `performance.measure`. The interactions integration captures clicks as spans.
- **The sample comment** says to adjust the rate in production "or using tracesSampler for finer control".

## Integrations

- **Prefer the `integrations` option.** `defaultIntegrations: false` disables every default; override one default by passing a new configured instance, for example `Sentry.breadcrumbsIntegration({ dom: false })` to stop click and keypress breadcrumbs. Use `Sentry.addIntegration()` only for environment-specific or lazy loading ("For all other cases, we recommend you use the `integrations` option"). Loader v8: `Sentry.lazyLoadIntegration("reportingObserverIntegration")`.
- **`breadcrumbsIntegration`** (on by default) wraps `dom`, `fetch`, `history`, `xhr` (and the `sentry` option); `dom` accepts `{ serializeAttribute: string | string[] }`. Console breadcrumbs come from the default `consoleIntegration`.
- **Install from a package manager** rather than the Loader Script or CDN; the `tunnel` option keeps ad blockers from blocking events.

## Attribute semantics

- **Prefer Sentry's stable keys over invented names.** When naming a custom span or log attribute, open only the matching domain; deprecated attributes are omitted. Span names stay low-cardinality and templated (`GET /users/:id`, not `/users/12345`). The full catalog is `https://github.com/getsentry/sentry-conventions/`. LLM keys (`gen_ai.*`) are in [AI-MONITORING.md](AI-MONITORING.md#attributes).

| Domain | Keys |
|---|---|
| http | `http.request.method`, `http.response.status_code` (integer), `http.route` ("path template in the format used by the respective server framework"), `http.request.header.<key>` / `http.response.header.<key>` (string[], lowercase name), `http.request.body.data`, `http.response.body.size` (encoded), `http.decoded_response_content_length`, `http.response.size` (transfer), `http.response.header.content-length`, `http.query` (with leading `?`), `http.fragment` (with leading `#`), `http.request.resend_count`, `http.request.same_origin`, `http.request.time_to_first_byte` (seconds), resource-timing UNIX timestamps (`http.request.connect_start`, `connection_end`, `domain_lookup_start/end`, `fetch_start`, `redirect_start/end`, `request_start`, `response_start/end`, `secure_connection_start`, `worker_start`), `http.server.request.time_in_queue` (ms, from `X-Request-Start`) |
| url | `url.full`, `url.path`, `url.query` (no `?`), `url.fragment` (no `#`), `url.scheme`, `url.domain`, `url.port`, `url.path.parameter.<key>`, `url.template` ("low-cardinality template") |
| db | `db.system.name`, `db.namespace`, `db.collection.name`, `db.operation.name`, `db.operation.batch.size` ("SHOULD never be 1"), `db.query.text` (parameterized; values replaced with placeholders), `db.query.parameter.<key>`, `db.query.summary` ("must be low-cardinality and should only contain the operation table names"), `db.response.status_code`, `db.stored_procedure.name`, `db.driver.name`, `db.user`, `db.redis.connection/key/parameters` |
| cache | `cache.hit` (boolean), `cache.item_size` (bytes), `cache.key` (string[]), `cache.operation`, `cache.ttl` (seconds), `cache.write` (boolean) |
| messaging | `messaging.system`, `messaging.destination.name/connection/partition.id`, `messaging.message.id/body.size/envelope.size/conversation_id/receive.latency/retry.count`, `messaging.operation.name/type`, `messaging.batch.message_count`, `messaging.kafka.message.key/tombstone`, `messaging.kafka.offset`, `messaging.rabbitmq.destination.routing_key` |
| sentry | `sentry.op`, `sentry.origin`, `sentry.description`, `sentry.status` ("ok" or "error"; specific errors deprecated), `sentry.trace.status`, `sentry.release`, `sentry.environment`, `sentry.dist`, `sentry.platform`, `sentry.sdk.name/version/integrations`, `sentry.client_sample_rate`, `sentry.server_sample_rate`, `sentry.dsc.*` (environment, project_id, public_key, release, sample_rate, sampled, trace_id, transaction), `sentry.segment.id/name/name.source` (`'custom'`, `'url'`, `'route'`, `'component'`, `'view'`, `'task'`), `sentry.exclusive_time` (ms), `sentry.replay_id`, `sentry.replay_is_buffering`, `sentry.profile_id` (transaction-based only), `sentry.profiler_id` (continuous), `sentry.message.template`, `sentry.message.parameter.<key>`, `sentry.timestamp.sequence`, `sentry.trace_lifecycle` (stream or static), `sentry.nextjs.ssr.function.route/type`, `sentry.category` (known values include 'ai', 'ai.pipeline', 'db', 'http', 'cache', 'queue', 'ui.react', 'function.nextjs', 'websocket'), grouping keys `sentry.group`, `sentry.normalized_description`, `sentry.normalized_db_query[.hash]`. `sentry.main_thread` and `sentry.mobile` are "Computed by Relay and should not be set by SDKs" |
| cloudflare | `cloudflare.d1.duration/rows_read/rows_written`; `cloudflare.durable_object.query.bindings`, `cloudflare.durable_object.response.rows_read/rows_written`; `cloudflare.r2.bucket/operation/request.delimiter/request.key/request.part_number/request.prefix`; `cloudflare.workflow.attempt/retries.backoff/retries.delay/retries.limit/timeout` |
| vercel | `vercel.branch`, `vercel.build_id`, `vercel.deployment_id`, `vercel.project_id/project_name`, `vercel.request_id`, `vercel.source` (build, edge, lambda, static, external, firewall), `vercel.status_code` ("-1 means no response returned and the lambda crashed"), `vercel.edge_type`, `vercel.entrypoint`, `vercel.execution_region`, `vercel.proxy.*` (cache_id, client_ip, host, lambda_region, method, path, path_type[_variant], referer, region, response_byte_size, scheme, status_code, timestamp, user_agent, vercel_cache, vercel_id, waf_action, waf_rule_id), `vercel.ja3_digest`, `vercel.ja4_digest`, `vercel.log_type`, `vercel.path`, `vercel.id`, `vercel.destination` |
| mcp | `mcp.method.name`, `mcp.session.id`, `mcp.protocol.version/ready`, `mcp.client.name/title/version`, `mcp.server.name/title/version`, `mcp.request.argument.<key>` (JSON-stringified), `mcp.request.argument.name/uri`, `mcp.resource.uri`, `mcp.tool.result.content_count`, `mcp.prompt.result.description/message_content/message_count/message_role`, `mcp.progress.current/total/percentage/message/token`, `mcp.cancelled.reason/request_id`, `mcp.lifecycle.phase`, `mcp.logging.data_type/level/logger/message` |
| browser | `browser.name/version`; web vitals `browser.web_vital.{cls,fcp,fp,inp,lcp,ttfb}.value`, `browser.web_vital.cls.report_event/source.<key>`, `browser.web_vital.lcp.element/id/load_time/render_time/report_event/size/url`, `browser.web_vital.ttfb.request_time`; bfcache `browser.bfcache.outcome` ('hit'/'miss'), `.reason`, `.frame`, `.not_restored_reason_count`; `browser.performance.navigation.activation_start`, `browser.performance.time_origin`; `browser.script.invoker/invoker_type/source_char_position`; `browser.report.type` |
| app (mobile, desktop) | `app.build/identifier/in_foreground/name/start_time/version`; `app.vitals.frames.{delay.value,frozen.count,frozen.rate,slow.count,slow.rate,total.count}`; `app.vitals.stall.duration/percentage` ("Only applies to React Native"); `app.vitals.start.cold.value/warm.value/prewarmed/reason/screen/type`; `app.vitals.ttfd.value`, `app.vitals.ttid.value` (ms) |
| ui | `ui.component_name`, `ui.contributes_to_ttfd/ttid`, `ui.element.height/id/identifier/load_time/paint_type ('image-paint'/'text-paint')/render_time/type/url/width` |
| device, os | `device.brand`, `device.model`, `device.class` ("Typically inferred by Relay"), `device.memory.estimated_capacity` ("capped at 8 GB" in browsers), `device.thermal_state` (`nominal`, `fair`, `serious`, `critical`), battery, storage and screen keys; `os.name/version/build_id/kernel_version/description/raw_description/rooted/theme/type` |
| user | `user.email/full_name/geo.city/geo.country_code/geo.region/geo.subdivision/hash/id/ip_address/name/roles`; `user_agent.original` |
| otel | `otel.scope.name/version`, `otel.status_code` ("OK"/"ERROR", MUST NOT be set if UNSET), `otel.status_description` |
| score | `score.<key>` (= `score.weight.<key>` * `score.ratio.<key>`), `score.ratio.<key>`, `score.total`, `score.weight.<key>` |

- **Smaller domains:** `client.address/port`; `server.address/port`; `cloud.account.id/availability_zone/platform/provider/region/resource_id`; `code.file.path/function/function.name/line.number/namespace`; `culture.calendar/display_name/is_24_hour_format/locale/timezone`; `error.type`; `event.id/name`; `exception.escaped/message/stacktrace/type`; `faas.coldstart/cron/duration_in_ms/entry_point/identity/invocation_id/invoked_name/invoked_provider/invoked_region/name/time/trigger/version`; `file.path/size`; `flag.evaluation.<key>` (boolean); `gcp.function.context.*`, `gcp.project.id`; general `blocked_main_thread`, `channel`, `id`, `previous_route`, `type`; `graphql.document/operation.name/operation.type`; `grpc.error.*` (several "only when sendDefaultPii is enabled or dataCollection is configured"); `jsonrpc.protocol.version/request.id`; `koa.type`; `logger.name`; `middleware.name`; `navigation.origin/route.id/type`; `nel.elapsed_time/phase/referrer/sampling_function/type`; `network.connection.effective_type/rtt/type`, `network.local.*`, `network.peer.*`, `network.protocol.name/version`, `network.transport`, `network.type`; `params.<key>`; `process.command_args/executable.name/pid/runtime.*`; `react.version`; `remix.action_form_data.<key>`; `resource.render_blocking_status`; `rpc.method/response.status_code/service/system.name`; `service.name/version`; `session.id`; `state.type`; `thread.id/name`; `trpc.procedure_path/procedure_type`; AWS keys (`aws.dynamodb.*`, `aws.lambda.*`, `aws.s3.bucket`, `aws.request_id`).

## Prove it

- **Each deliberate signal lands:** after exercising the real route, the trace shows the auto spans plus your attribute (`ranking_version` on the request span), Logs shows the decision-point log with its attributes and the same `trace_id`, and Metrics shows the count sliceable by its attributes.
- **Every new item has a reason:** each span attribute, log and metric answers one question from [Choose the signal](#choose-the-signal), and no rate is derived by counting log lines.
- **Names follow the conventions:** custom attribute keys use the stable keys above where one exists, span names are templated, and metric attributes follow the cardinality rule in [Gotchas](#gotchas).
- **Nothing doubled:** the runtime has one Sentry initialization, one OTLP exporter at most and one AI span producer.
- **Propagation works:** a request from the browser to your API carries `sentry-trace` and `baggage`, the server allows them in CORS, and the backend spans join the browser trace.
