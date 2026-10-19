# Edge Functions: long work, local development, deploying and debugging

Moved unchanged from [EDGE-FUNCTIONS.md](EDGE-FUNCTIONS.md) to keep each file under the size cap. Long work (background tasks, streams, WebSockets), data, storage and AI, local development, testing, deploying and debugging

## Long work: background tasks, streams, WebSockets

- **`EdgeRuntime.waitUntil(promise)` keeps the instance alive until the promise settles,** without blocking the response. Call it at top level or in the handler; don't `await` it. It prevents early retirement but does not extend the hard wall-clock limit, and CPU and memory limits still apply. (The shutdown-reasons guide instead says to await background promises before the function returns; the background-tasks guide says not to await `waitUntil`.)
- **Locally, instances end when the request completes,** killing background tasks; set `[edge_runtime] policy = "per_worker"`.
- **Shutdown hooks:** `addEventListener('beforeunload', (ev) => console.log(ev.detail?.reason))`; `addEventListener('unhandledrejection', (ev) => { ...; ev.preventDefault() })`. `unload` handlers may not run.
- **Big uploads:** write to `/tmp`, then process inside `EdgeRuntime.waitUntil(...)` to stay under memory (streaming a zip over 100MB hits the memory limit). Sync filesystem APIs (`Deno.readFileSync` and the rest) work only during initial script evaluation; inside handlers or `setTimeout` they throw "blocklisted on the current context".
- **Stream instead of buffering** to save memory: return a `ReadableStream` with `Content-Type: text/event-stream`. A long proxied stream can end early (no `[DONE]`) at the wall clock or on early retirement; keep the isolate alive with `EdgeRuntime.waitUntil(upstream.body!.pipeTo(writable))` and return `new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } })`. Returning a proxied `fetch()` response directly can fail with `INVALID_RESPONSE_STATUS_CODE`; wrap it in a new `Response`.
- **WebSockets:** serve with `Deno.upgradeWebSocket(req)` (return `400` unless the `upgrade` header is `websocket`) or `npm:ws@^8` with `noServer: true`; outbound WebSockets work too. Locally they need `policy = "per_worker"`.
- **A WebSocket drops at about half the wall clock with `EarlyDrop`** unless you hold the isolate: the HTTP request is complete once `upgradeWebSocket` returns, the supervisor doesn't track the socket, and the isolate counts as idle when the response is returned and all `waitUntil` promises have resolved, open sockets or not.

```ts
const socketClosedPromise = new Promise<void>((resolve) => { socket.onclose = () => resolve() })
EdgeRuntime.waitUntil(socketClosedPromise)
```

- **WebSocket auth is yours.** Browsers can't send custom headers, so serve and deploy with `--no-verify-jwt`; `withSupabase` can't authenticate WebSocket clients. Pass the JWT as a query parameter (it may be logged) or in `Sec-WebSocket-Protocol` as `jwt-TOKEN`, verify it with `supabase.auth.getUser(jwt)` on a secret-key client, and return `403` on failure. For reconnects, read the resumable WebSockets example (`https://supabase.com/docs/guides/functions/examples/resumable-websockets.md`).
- **Idempotency:** isolates can be killed or rerun; use `SB_EXECUTION_ID` to detect duplicate runs and checkpoint progress.

## Data, storage and AI

- **Prefer `withSupabase`'s `ctx.supabase` (RLS) and `ctx.supabaseAdmin`.** Direct Postgres clients (Deno Postgres, Postgres.js with Drizzle through `deno.json`) connect with `SUPABASE_DB_URL`. Deployed functions use SSL to the database automatically; locally set `SSL_CERT_FILE=/path/to/cert.crt` and `DENO_TLS_CA_STORE=mozilla,system` in the env file.
- **Storage:** server-side uploads use a secret-key client. For generated assets, check storage first, otherwise generate and upload with `cacheControl`.
- **Embeddings:** `new Supabase.ai.Session('gte-small')` with `{ mean_pool: true, normalize: true }`; gte-small is English-only and truncates at 512 tokens. LLMs run through self-managed Ollama or Llamafile via `AI_INFERENCE_API_HOST` (locally `http://host.docker.internal:11434`), modes `'ollama'` (default) and `'openaicompatible'`; a hosted LLM is in early access.
- **Rate limiting user traffic:** an example exists using Upstash Redis.

## Local development

- **Needs Docker.** `supabase init`, `supabase functions new hello-world`, `supabase start`, `supabase functions serve [name]` (hot reload; ports 54321 and 8081). `supabase status` shows keys and ports; `supabase stop` then `start` restarts.
- **The template:** `supabase functions new` generates `withSupabase({ auth: ['publishable', 'secret'] }, ...)`; `--auth` changes it (the CLI reference lists `--auth <[ none | apikey | user ]>`).
- **The CLI serves with its own Edge Runtime, not the Deno CLI.** Install Deno separately for the LSP, `deno fmt`, `deno lint` and `deno test`. VS Code: the Deno extension (`supabase init` can generate settings) or `{"deno.enablePaths": ["./supabase/functions"], "deno.importMap": "./supabase/functions/deno.json"}`.
- **Serve flags:** `--env-file`, `--import-map`, `--no-verify-jwt`, `--inspect` (same as `--inspect-mode brk`), `--inspect-mode [run|brk|wait]`, `--inspect-main`; `--debug` for detail.
- **Debugger** (CLI v1.171.0+): `supabase functions serve --inspect-mode brk`, open `chrome://inspect`, add `127.0.0.1:8083`, choose "Open dedicated DevTools for Node", and find the source under `file://` > `home/deno/functions/<name>/index.ts`.
- **Local limits mirror hosted ones.**
- **Trouble serving:** port clashes across projects are solved by the experimental `supabase stack` commands (own ports per project); a stale Deno cache by `deno cache --reload /path/to/function/index.ts`. Containers reach the host at `host.docker.internal`.

## Testing

- **Deno's test runner with `@std/testing`** (`@std/testing/bdd`, `@std/testing/mock`). Unit-test pure logic; integration-test the whole function by mocking `globalThis.fetch` to intercept Supabase REST calls (no production code changes) and generating valid RS256 JWTs in a test helper.
- **Run:** `deno test supabase/functions/tests/process-ticket/pricing.test.ts`; `deno test supabase/functions/tests/process-ticket/index.test.ts --allow-env`; or `deno task test`.
- **The Dashboard tester** sends a method, headers, query parameters, body and auth token, and shows status, headers and body.

## Deploying

- **CLI:** `supabase login`, `supabase link --project-ref <id>`, `supabase functions deploy [name]` (every function when no name; since CLI v1.62.0). Without Docker the CLI falls back to API deploys. `--use-api` bundles server-side (5MB limit); `--use-docker` forces local bundling (20MB), though it is missing from the CLI reference's flag list (`--import-map`, `-j/--jobs`, `--no-verify-jwt`, `--project-ref`, `--prune`, `--use-api`). `--prune` deletes remote functions missing locally; `-j, --jobs` sets parallel jobs.
- **Other commands:** `supabase functions list`, `download` (`--use-api` unbundles server-side), `delete` (doesn't remove the local copy). To move a function between projects: `download` from the source, `link` the target, `deploy`.
- **GitHub Actions:**

```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  PROJECT_ID: your-project-id
steps:
  - uses: actions/checkout@v4
  - uses: supabase/setup-cli@v1
    with:
      version: latest
  - run: supabase functions deploy --project-ref $PROJECT_ID
```

  GitLab CI and Bitbucket use `npx supabase functions deploy --debug` with a docker service.
- **Never deploy the same function concurrently** (e.g. overlapping CI runs); it causes `NOT_FOUND_FUNCTION_BLOB`.
- **Deploy failures:** retry with `--debug` (shows `script size`), try `--use-api` or `--use-docker`, run `deno check` locally, upgrade the CLI.
- **The Dashboard editor** ("Deploy a new function" > "Via Editor" with templates, or "Via AI Assistant") deploys in about 10 to 30 seconds but has no version control, versioning or rollback: prototypes only. It can download a function, and a zip dragged into the editor imports one.
- **Management API:** endpoints deploy a single function and bulk-update atomically; `/deploy?bundleOnly=true` supports a batch flow.
- **MCP:** `list_edge_functions`, `get_edge_function`, `deploy_edge_function`, `create_edge_function_secret`, in the "Edge Functions" feature group (on by default; restrict with `?features=`).
- **TLS:** a subset of TLS 1.2 ciphers is disabled on project HTTP APIs, Edge Functions included, on November 10, 2026.

## Debugging

- **Where to look:** each function's **Invocations** (request and response with headers, body, status, duration), **Logs** (platform events, uncaught exceptions, your logs, boot and shutdown) and **Metrics** (CPU, memory, execution time). The advisors include Edge Function error-rate health checks.
- **Logging:** `console.log`, `warn` and `error` become log events; `console.time`/`console.timeEnd` labels show in the Log tab. `JSON.stringify(req.headers)` prints `{}`; use `Object.fromEntries(req.headers)`.
- **Logs Explorer sources:** `function_edge_logs` (attributes `request.pathname`, `response.status_code`, `execution_id`, `function_id`, `version`, `execution_time_ms`, `request.headers.content_length`, `request.method`, `request.sb.apikey.apikey.prefix`, `request.sb.jwt.authorization.payload.algorithm`) and `function_logs` (`level`, `event_type` such as `Log`, `UncaughtException`, `BootFailure`, and `reason` such as `Memory`, `CPUTime`). An empty `execution_id` means the request was rejected before your code ran. The version increments on every deploy, so compare error rates by `log_attributes['version']`.

```sql
select timestamp, log_attributes['request.pathname'] as pathname,
  log_attributes['response.status_code'] as status_code,
  toFloat64OrZero(log_attributes['execution_time_ms']) as execution_time_ms
from logs
where source = 'function_edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) = 504
order by timestamp desc limit 20;
```

- **Every error response carries an `sb-error-code` header.** For codes not below, read `https://supabase.com/docs/guides/functions/error-codes.md`.

| Status | Code | Cause and first move |
|---|---|---|
| 3XX | | `Response.redirect()` |
| 401 | `UNAUTHORIZED_NO_AUTH_HEADER`, `UNAUTHORIZED_INVALID_JWT_FORMAT` (not `Bearer <JWT>`), `UNAUTHORIZED_LEGACY_JWT` (bad HS256), `UNAUTHORIZED_ASYMMETRIC_JWT` (bad ES256/RS256), `UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM` | The `verify_jwt` check. Check which header carries which credential ([function auth](EDGE-FUNCTIONS.md#auth)). |
| 404 | `NOT_FOUND` (`Requested function was not found`) | Missing function or wrong path. |
| 404 | `NOT_FOUND_FUNCTION_BLOB` | The bundle is missing, even while the Dashboard shows ACTIVE; usually concurrent deploys. The 404 guide gives the message `Function deployment bundle not found`; the error-codes page says it reuses the `NOT_FOUND` message. |
| 405 | | Method not in the allowed list. |
| any | `RATE_LIMIT_EXCEEDED` | Function-to-function budget per trace. |
| 500 | `WORKER_ERROR`, `EDGE_FUNCTION_ERROR` | Uncaught exception (e.g. thrown outside the handler) or unhandled 5XX. |
| 503 | `BOOT_ERROR` (`Function failed to start (please check logs)`), `LOAD_FUNCTION_*` | Boot failure. Filter logs for `worker boot error:` ("Identifier 'x' has already been declared", "Unexpected reserved word", "does not provide an export named"). A 503 with empty `execution_id` and `function_id` is gateway overload (`internal_failure`). |
| 504 | `IDLE_TIMEOUT` | No response within 150s, or a cold start timing out. |
| 546 | `WORKER_RESOURCE_LIMIT` (formerly `WORKER_LIMIT`; `Function failed due to not having enough compute resources (please check logs)`) | CPU, memory or wall clock. Logs say `Memory limit exceeded` or `CPU Time exceeded`. |
| any | `INVALID_RESPONSE_STATUS_CODE` | Status not 101 and outside 200 to 599; often a proxied `fetch()` response. |
| any | `INVALID_URL` | Malformed request URL. |

- **Shutdown reasons** (`ShutdownEvent.reason`, with `cpu_time_used` in ms, `memory_used` {total, heap, external} and `execution_id`): `EventLoopCompleted` (normal), `EarlyDrop` (most common: work done, runtime drops the worker early), `WallClockTime`, `CPUTime`, `Memory`, `TerminationRequested` (deploys, maintenance). Other events: BootEvent, BootFailure, UncaughtException, LogEvent, WorkerMemoryUsed.
- **546 rate:** under 5% is an edge case, 5 to 50% is meaningful, over 50% means the function needs significant work. Stream responses instead of buffering to cut memory.
- **Cold-start 504s or worker-creation timeouts on the first request after idle** come from large dependency trees or expensive top-level setup: avoid slow top-level `await`, create heavy clients lazily inside the handler, shrink the bundle, keep critical functions warm. Slow boots: look for `booted` events; if only some are slow, note their `region` and contact support.
- **Error tracking with Sentry:** `npm:@sentry/deno@^8` with `defaultIntegrations: false` (there's no `Deno.serve` instrumentation, so no per-request scope separation); use `withScope`, tag `SB_REGION` and `SB_EXECUTION_ID`, and `await Sentry.flush(2000)`.
- **When the limits don't fit,** move the work to another server-side runtime or self-host edge functions.

## Prove it

Use the [Edge Functions acceptance checks](EDGE-FUNCTIONS.md#prove-it) for long work, resource limits, database callers and the existing test commands.
