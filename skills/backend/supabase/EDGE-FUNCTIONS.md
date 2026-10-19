# Edge Functions

Edge Functions are server-side TypeScript handlers (webhook receivers, low-latency HTTP endpoints, image or OG generation, small AI calls, transactional email, chat bots) run by the Supabase Edge Runtime, a Deno-compatible runtime. Most outcomes are decided by two things: the gateway in front of your code, which checks the `Authorization` header (`verify_jwt`) and can reject a request before your code runs, and the isolate that runs it, which is short-lived, stateless and killed at fixed CPU, memory and wall-clock limits. Design for short, idempotent work; move heavy long-running jobs to background workers.

**Contents:** [How a request flows](#how-a-request-flows) · [Limits](#limits) · [Project layout and config](#project-layout-and-config) · [Dependencies](#dependencies) · [Secrets and environment](#secrets-and-environment) · [Auth](#auth) · [Fetch middleware](#composable-fetch-middleware) · [CORS](#cors) · [Calling a function](#calling-a-function) · [From the database: cron, pg_net, webhooks](#from-the-database-cron-pg_net-webhooks) · [Long work: background tasks, streams, WebSockets](EDGE-FUNCTIONS-OPERATIONS.md#long-work-background-tasks-streams-websockets) · [Data, storage and AI](EDGE-FUNCTIONS-OPERATIONS.md#data-storage-and-ai) · [Local development](EDGE-FUNCTIONS-OPERATIONS.md#local-development) · [Testing](EDGE-FUNCTIONS-OPERATIONS.md#testing) · [Deploying](EDGE-FUNCTIONS-OPERATIONS.md#deploying) · [Debugging](EDGE-FUNCTIONS-OPERATIONS.md#debugging) · [Prove it](#prove-it)

## How a request flows

- **Gateway, then runtime.** The edge gateway routes the request by the caller's IP to the nearest edge location, applies the JWT check and policies, then the Edge Runtime runs the function on a node near the user. The function calls Supabase APIs or third parties, logs are emitted, and the response returns through the gateway, which records request metadata.
- **Deploys ship an ESZip.** The CLI bundles the function and its dependencies into an ESZip (Deno's compact format with the full module graph), uploads it, and the bundle is distributed to every edge location.
- **No state between runs.** Each isolate has its own heap and thread; nothing persists. The pages disagree on reuse: the architecture page says a new V8 isolate is spun up per invocation; the limits and CPU-limits pages say a worker can serve multiple requests during its wall-clock lifetime; the 546 guide says each isolate handles one request at a time, is bound to one function, and the runtime sends a request to a free isolate or starts a new one when all are busy. Never rely on state surviving between runs.
- **Cold starts happen.** Each function boots before it serves. Fewer, larger functions ("fat functions") mean fewer cold starts.
- **Treat Postgres as a remote, pooled service.** Use connection pools or serverless-friendly drivers.
- **Language.** Functions are TypeScript files that export a handler. With a custom `entrypoint` (below) a function can also be `.js`, `.tsx`, `.jsx` or `.mjs`. WASM is supported. Dart Edge is not actively maintained.
- **No static egress IPs.** For an allowlist, use an outbound proxy with a static IP (preferred), a shared-secret header for servers you control, or self-host the edge runtime. (One troubleshooting page still says the platform runs on Deno Deploy; that is outdated.)

## Limits

| Limit | Value |
|---|---|
| Memory | 256MB (limits page). The 546 guide says 250MB; an old example comment says 150MB (outdated). |
| Wall clock (how long a worker stays alive) | Free 150s, paid 400s. The shutdown-reasons guide says 400s with no plan split. Configurable per project is planned; today only by self-hosting. |
| CPU time | 2s per request (2000 ms), excluding async I/O |
| Request idle timeout | 150s; no response by then returns `504`. Cannot be increased. |
| Function size | 20MB bundled locally by the CLI; 5MB bundled server-side (`--use-api`, Management API, Dashboard). Error: `Function source code exceeds the maximum deployment size` |
| Functions per project | Free 100, Pro 1000, Team 2000, Enterprise unlimited |
| Secrets | 100 per project, name up to 256 chars, value up to 48 KiB (24,576 characters), names must not start with `SUPABASE_` |
| Log message | 10,000 characters; 100 log events per 10 seconds |
| Function-to-function calls | 30 requests per trace within 60s (limits and recursive-functions pages). The 2026-03-11 changelog says each request chain has a minimum budget of 5,000 requests per minute, higher in busy regions. Check the current docs. |
| `/tmp` storage | Free up to 256MB, paid up to 512MB; resets each invocation. Mounted S3 buckets have no limit. |
| HTTP methods | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`; anything else returns `405` |
| Request body size | Not documented. Express's default `express.json()` caps at 100kb; raise it with `express.json({ limit: "300kb" })`. |

- **Outbound connections to ports 25 and 587 are not allowed.**
- **HTML needs a custom domain.** Otherwise `GET` responses with `text/html` are rewritten to `text/plain`.
- **Not available:** the Web Worker API, Node's `vm` API, and Node libraries that need multithreading (libvips, sharp).
- **Static files need Docker on the CLI;** they can't be deployed with the API flag.
- **CPU soft and hard limits.** At the soft limit the isolate retires: it takes no new requests and finishes in-flight ones until it hits the hard CPU limit or the wall clock; new requests go to a new isolate. Once an isolate uses 50% of any resource it finishes the current request and shuts down; if that request exhausts CPU or memory it is killed at once with `546`.
- **CPU and wall clock are separate budgets.** The supervisor enforces wall clock (`worker_timeout_ms`), CPU (soft and hard) and memory independently.
- **"wall clock time limit reached" is printed whenever a worker terminates,** even below the limit. It matters only alongside a `546`.

### Deno version

- **Hosted functions run Deno 2.1 in every region** (2025-08-15; 2.1.4 is the compatible release). Fall back to Deno 1.45 with the `forceDenoVersion=1` query parameter or the `x-deno-version: 1` header. The Wasm page still says Deno 1.46; that is outdated.
- **Locally,** set `[edge_runtime] deno_version = 2` in `config.toml` (the CLI template's default).
- **Deno 2.9+ applies a minimum dependency age to npm packages.** To use a release published the same day, pass `--minimum-dependency-age 0` to `deno check`.

## Project layout and config

```
└── supabase
    ├── functions
    │   ├── deno.json           # Top-level Deno configuration
    │   ├── _shared             # Shared code (underscore prefix)
    │   │   ├── supabaseAdmin.ts # Supabase client with SECRET key
    │   │   ├── supabaseClient.ts # Supabase client with PUBLISHABLE key
    │   │   └── cors.ts         # Reusable CORS headers
    │   ├── function-one        # Use hyphens for function names
    │   │   └── index.ts
    │   └── function-two
    │       └── index.ts
    ├── tests
    │   ├── function-one-test.ts
    │   └── function-two-test.ts
    ├── migrations
    └── config.toml
```

- **Name functions with hyphens; put shared code in an `_`-prefixed folder.** The unit-test guide uses a different layout: tests under `supabase/functions/tests/<fn>/*.test.ts` with pure logic beside the function (`process-ticket/pricing.ts`). Follow whichever the project already uses.
- **Two equivalent handler forms:** `export default { fetch }` and `Deno.serve(...)`; both are supported.
- **Per-function settings live in `supabase/config.toml`:**

```toml
[functions.stripe-webhook]
verify_jwt = false

[functions.image-processor]
import_map = './functions/image-processor/import_map.json'

[functions.legacy-processor]
entrypoint = './functions/legacy-processor/index.js'
```

| Key | Default | Notes |
|---|---|---|
| `functions.<name>.enabled` | `true` | `false` skips deploy and local serve |
| `functions.<name>.verify_jwt` | `true` | `--no-verify-jwt` overrides it |
| `functions.<name>.import_map` | `supabase/functions/<name>/deno.json` | `--import-map` overrides it |
| `functions.<name>.entrypoint` | `supabase/functions/<name>/index.ts` | CLI 1.215.0+. The function-configuration page says the path is relative to `config.toml`; the config reference says relative to the project root. Check the current docs. |
| `functions.<name>.static_files` | none | Array of paths, only inside the `functions` directory. CLI 2.7.0+. Wasm modules and HTML templates read with Deno APIs. |
| `edge_runtime.enabled` | `true` | |
| `edge_runtime.inspector_port` | `8083` | |
| `edge_runtime.policy` | see below | `oneshot` or `per_worker` |
| `edge_runtime.deno_version` | `2` | Deno major version |

```toml
[functions.wasm-add]
static_files = [ "./functions/wasm-add/add-wasm/pkg/*"]
```

- **`edge_runtime.policy` is documented three ways.** The config reference says the default is `oneshot` (development, hot reload) with `per_worker` for load testing. The CLI's `config.toml` template sets `per_worker` as the default with hot reload and `oneshot` as a fallback when hot reload misbehaves (large repos, symlinks). The WebSockets page says functions don't auto-reload under `per_worker`, and the CLI reference says `oneshot` runs one request per worker so edits show immediately. Check the current docs and your CLI version. Background tasks and WebSockets need `per_worker` locally either way.

## Dependencies

```ts
// NPM packages (recommended)
import { createClient } from 'npm:@supabase/supabase-js@2'
// Node.js built-ins
import process from 'node:process'
// JSR modules (Deno's registry)
import path from 'jsr:@std/path@1.0.8'
```

- **A `deno.json` per function is the deployment recommendation** (CLI 1.215.0+), so functions don't share dependency versions. A single `supabase/functions/deno.json` works locally but is not recommended for deployment, though the development-environment page's layout shows one.

```json
{
  "imports": {
    "supabase": "npm:@supabase/supabase-js@2",
    "lodash": "https://cdn.skypack.dev/lodash"
  }
}
```

- **`import_map.json` is legacy.** When both exist, `deno.json` wins. Override with `--import-map <string>` on serve or deploy, or `import_map` in `config.toml`. VS Code with an import map:

```json
{
  "deno.enable": true,
  "deno.unstable": ["bare-node-builtins", "byonm"],
  "deno.importMap": "./supabase/functions/function-one/import_map.json"
}
```

- **Private npm packages:** an `.npmrc` in the function's directory (CLI 1.207.9+). The directory must also hold a `deno.json` or `package.json` (empty is fine), or `.npmrc` is ignored.

```bash
@myorg:registry=https://npm.registryhost.com
//npm.registryhost.com/:_authToken=VALID_AUTH_TOKEN
```

- **Custom npm registry:** set `NPM_CONFIG_REGISTRY` in the project `.env` or on deploy (CLI 2.2.8+): `NPM_CONFIG_REGISTRY=https://custom-registry/ supabase functions deploy my-function`.
- **Types:** `// @deno-types="npm:@types/express@^4.17"` above an import; `/// <reference types="npm:@types/node" />` for Node; `import 'jsr:@supabase/functions-js/edge-runtime.d.ts'` for `EdgeRuntime` and `Supabase.ai`.
- **esm.sh imports that error:** add `?target=deno`, e.g. `import Stripe from "https://esm.sh/stripe@11.2.0?target=deno";`.
- **Optional peer dependencies must be imported.** Deno resolves an optional peer only when code imports it: `@supabase/server/middleware/postgres` needs `pg`, and pinning it in `deno.json` alone fails at startup with `Could not find package 'pg'`. Add `import 'pg'` at the top of the entry module.
- **Keep the bundle small.** Measure with `deno info /path/to/function/index.ts` (add `--import-map=` if you use one) and read "size". Import narrowly (`npm:@googleapis/sheets`, not `npm:googleapis`), pin versions (`npm:package@1.2.3`), and avoid the full AWS SDK, Moment.js, all of Lodash and the full Google APIs.
- **Monorepos:** `--use-api` (CLI 2.13.3) deploys without Docker and can import files outside `supabase/`.

## Secrets and environment

- **Local:** functions read `supabase/functions/.env`, loaded on `supabase start` (a `.env.example` is not enough). Another file, e.g. `.env.local`, is read only with `supabase functions serve --env-file`. The root `.env` feeds `env()` in `config.toml`; a variable the function reads must also be in `supabase/functions/.env`. Git-ignore every env file. A secret empty locally: restart the stack or run `supabase functions serve hello-world --env-file supabase/functions/.env`.

```toml
[edge_runtime.secrets]
STRIPE_SECRET_KEY = "env(STRIPE_SECRET_KEY)"
```

- **Production:** the Dashboard's Edge Function Secrets page (paste several at once) or `supabase secrets set --env-file .env`, `supabase secrets set NAME=value`, `supabase secrets list`, `supabase secrets unset [NAME]`. Functions read a new secret immediately; no redeploy. Only Owners and Administrators can create or delete secrets; Developers can view them.
- **Read with `Deno.env.get('NAME_OF_SECRET')`.** For a Deno script outside serve: `deno run --allow-env --env-file=supabase/functions/.env script.ts`.
- **The `SUPABASE_` prefix is reserved;** the Dashboard and Management API reject it.
- **Provided automatically:**

| Variable | Contents |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_DB_URL` | Direct Postgres connection string |
| `SUPABASE_PUBLISHABLE_KEYS` | JSON dictionary of publishable keys; differs between development and production |
| `SUPABASE_SECRET_KEYS` | JSON dictionary of secret keys; bypass RLS, never in a browser |
| `SUPABASE_JWKS` | Same as `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Legacy keys; work until the end of 2026 |
| `SB_REGION` | Region (hosted only) |
| `SB_EXECUTION_ID` | UUID of the function instance (hosted only) |
| `DENO_DEPLOYMENT_ID` | `{project_ref}_{function_id}_{version}` (hosted only) |

```ts
const SUPABASE_PUBLISHABLE_KEYS = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!)
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, SUPABASE_PUBLISHABLE_KEYS['default'])
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, SUPABASE_SECRET_KEYS['default'])
```

- **The local CLI uses a single key pair;** `@supabase/server` falls back to `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
- **More than 100 secrets:** the limit isn't raised. Bundle them into one JSON secret (`supabase secrets set API_KEYS='{"stripe":"sk_live_xxx",...}'`, then `JSON.parse(Deno.env.get('API_KEYS'))`); there are no partial updates and the 48 KiB cap still applies. Per-row secrets go in Vault, at the cost of a database round-trip.
- **Through MCP, `create_edge_function_secret` opens a Dashboard URL** where the user enters the value. Never put a secret value in chat or tool arguments. It needs the Edge Functions tools enabled, a non-read-only connection and secret read/write permission; it can't be listed in `skip_elicitations`, and cancelling doesn't undo a saved secret.
- **Never log a secret;** log a truncated value (e.g. `.slice(0, 15)`) if you must.
- **S3 mount:** set `S3FS_ENDPOINT_URL`, `S3FS_REGION`, `S3FS_ACCESS_KEY_ID`, `S3FS_SECRET_ACCESS_KEY`; buckets appear at `/s3/YOUR-BUCKET-NAME`.

## Auth

### Headers and the platform check

- **Two headers, two credentials.** `Authorization: Bearer <user-jwt>` carries a signed-in user; `apikey: sb_publishable_...` or `sb_secret_...` carries a client or service. The new API keys are not JWTs and belong in `apikey`. Both can be sent together (supabase-js sends the session JWT in `Authorization` and the publishable key in `apikey`). The wrong credential in the wrong header is the most common cause of `401`.
- **`verify_jwt` (on by default) runs before your code.** A missing, malformed or wrong-key `Authorization` returns `401` and your code never runs. It validates legacy HS256 JWTs and asymmetric signing-key JWTs. What it does with API keys is documented two ways: the live auth-headers page says that, for migration, it accepts publishable and secret keys on either header, so a key on `apikey` passes and the check alone doesn't authenticate a caller that sends only an API key; the docs search index's copy says it doesn't accept API keys and callers sending one in `Authorization` fail. Check the current docs. The 401 troubleshooting guide also calls it a legacy check, recommends turning it off and verifying in code, and says projects on asymmetric keys hit "Incompatible key format", which contradicts the auth-headers page.
- **Leave `verify_jwt` on for functions called only with a user JWT** (e.g. `supabase.functions.invoke`). Turn it off for external webhooks and service-to-service calls with API keys, and whenever `withSupabase` uses `auth: 'none' | 'publishable' | 'secret'`. Turning it off removes the platform check, so your code is then the only thing verifying the caller. Don't turn it off just to clear a `401` in development.
- **Ways to turn it off:** `verify_jwt = false` in `config.toml`; `supabase functions deploy NAME --no-verify-jwt`; `supabase functions serve NAME --no-verify-jwt`; the Dashboard toggle on the function; the Management API:

```sh
curl 'https://api.supabase.com/v1/projects/PROJECT_ID/functions/FUNCTION_NAME' \
  --request PATCH \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN' \
  --data '{"verify_jwt": false}'
```

- **Tell the platform's 401 from yours.** The platform returns `{ "code": 401, "message": "Invalid Token or Protected Header formatting" }` or `{ "code": 401, "message": "Missing authorization header" }`. A custom message or an empty body came from your own code.

### `@supabase/server` (`withSupabase`)

Use [SERVER-MIDDLEWARE.md](SERVER-MIDDLEWARE.md#supabaseserver-withsupabase) for auth modes, typed context, package middleware and framework bridges.

### Composable Fetch middleware

Use the [portable middleware contract](SERVER-MIDDLEWARE.md#composable-fetch-middleware).

### Without `@supabase/server`

- **Create the client per request inside the handler** and forward the caller's `Authorization` header so RLS applies:

```js
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
);
const token = authHeader.replace('Bearer ', '')
const { data } = await supabaseClient.auth.getUser(token)
```

- **`getClaims()` verifies the JWT against the project JWKS** (cached). With asymmetric keys verification is local through WebCrypto, usually with no network request; with a symmetric secret it always calls the Auth server, like `getUser()`. In an ephemeral environment such as a function, each new invocation sends a network request (a network-edge cache exists). It can't detect server-side session revocation; call `getUser()` where that matters.
- **Verifying with jose:**

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'
const PROJECT_JWKS = createRemoteJWKSet(new URL('https://project-id.supabase.co/auth/v1/.well-known/jwks.json'))
async function verifyProjectJWT(jwt: string) { return jwtVerify(jwt, PROJECT_JWKS) }
```

- **`getAuthenticatorAssuranceLevel(jwt)`** makes a network request when passed a JWT, as it must be in a function with no stored session.
- **Stripe webhooks** must use `constructEventAsync` with `Stripe.createSubtleCryptoProvider()`; the sync `constructEvent()` throws "SubtleCryptoProvider cannot be used in a synchronous context".

## CORS

- **A browser caller needs the preflight answered.** `withSupabase` answers every `OPTIONS` with `204` and adds CORS headers (`cors: 'disabled'` turns that off). A bare `@supabase/middleware` pipeline answers no preflight; put `withCors` from `@supabase/middleware/cors` ahead of the gate.
- **Without it, use the headers from supabase-js** (v2.95.0+), which list every header the client libraries send, all standard methods and a wildcard origin, and stay current after an upgrade and redeploy:

```ts
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'
export default {
  fetch: async (req) => {
    if (req.method === 'OPTIONS') {
      return Response.json({ ok: true }, { headers: corsHeaders })
    }
    try {
      const { name } = await req.json()
      return Response.json({ message: `Hello ${name}!` }, { headers: corsHeaders })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return Response.json({ error: message }, { status: 400, headers: corsHeaders })
    }
  },
}
```

- **Before v2.95.0, hardcode them in `_shared/cors.ts`.** Older pages list only `authorization, x-client-info, apikey, content-type`; that list is outdated.

```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}
```

- **What the client sends:** `authorization`, `apikey`, `x-client-info` on every request; `content-type` with a body; `x-retry-count` only on automatic retries (postgrest-js retries failed idempotent requests by default); `traceparent`, `tracestate`, `baggage` only when the client opts in with `tracePropagation: true`. The supabase-js list includes the trace headers since v2.112.3; functions deployed with an older version need a redeploy for browsers with trace propagation on.
- **A "CORS error" is often something else.** A missing `OPTIONS` handler shows `SyntaxError: Unexpected end of JSON input` in the logs; an error thrown before the CORS handling, or a platform `404`, reaches the browser as a CORS error (supabase-js: `Failed to send a request to the Edge Function`). Read the function's logs.

## Calling a function

- **URL:** `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/<name>`; locally `http://localhost:54321/functions/v1/<name>`. A plain `fetch` sends `apikey: '<SUPABASE_PUBLISHABLE_KEY>'` and a JSON body.
- **From supabase-js:** `supabase.functions.invoke('hello-world', { body: { name: 'JavaScript' } })`. It sends the API key in `apikey` and keeps `Authorization` for the signed-in user's JWT (with no session, a new-format key is not sent as Bearer). `functions.setAuth(session.access_token)` updates the authorization header.
- **Bodies:** `Blob`, `ArrayBuffer`, `File`, `FormData` and `String` get their Content-Type automatically; anything else is JSON-serialized as `application/json`. Pass your own `Content-Type` to override. Responses are parsed as `json`, `blob` or `form-data` by their Content-Type, `text` otherwise.
- **Options:** `headers`, `body`, `method` (e.g. `'DELETE'`, `'GET'`), `region: FunctionRegion.UsEast1`.
- **Errors:** `FunctionsHttpError` means the function returned 4xx/5xx (read `await error.context.json()`); `FunctionsRelayError` is a network problem between client and Supabase; `FunctionsFetchError` means the function couldn't be reached.

### Routing inside a function

- **Every request arrives at `/<function-name>/*`.** Prefix all routes with the function name; route parameters come after it.
- **Frameworks:** Express (`npm:express@^5`), Oak (`jsr:@oak/oak@^17`), Hono (`jsr:@hono/hono@^4` with `new Hono().basePath('/tasks')` and `export default { fetch: app.fetch }`), or the URL Pattern API for small apps.

### Regions

- **Default is the region nearest the caller.** For database- or storage-heavy work, invoke near the database.
- **Regions:** ap-northeast-1, ap-northeast-2, ap-south-1, ap-southeast-1, ap-southeast-2, ca-central-1, us-east-1, us-west-1, us-west-2, eu-central-1, eu-central-2, eu-west-1, eu-west-2, eu-west-3, sa-east-1.
- **Pin one** with the `x-region` header, `region: FunctionRegion.UsEast1` in `invoke`, or the `forceFunctionRegion` query parameter (for CORS and webhooks). Confirm with the `x-sb-edge-region` response header, log metadata or `SB_REGION`. An explicitly chosen region is not re-routed during an outage.

### Function to function

- **Outbound `fetch()` from one function to another in the project is rate-limited per trace** (recursion, chaining, circular calls, fan-out); inbound and external API calls don't count. Over the budget, `Deno.errors.RateLimitError` is thrown with `retryAfterMs` (`RateLimitError: "Rate limit exceeded for trace ..."`, platform code `RATE_LIMIT_EXCEEDED`). The limit started March 06 2026, 08:00 UTC.
- **Avoid it:** batch, cap recursion depth, use Queues, share code through `_shared` instead of HTTP, add delays. The budget is the same on every plan; support can raise it.

## From the database: cron, pg_net, webhooks

- Schedule through the [Cron-to-Edge-Function contract](CRON-AND-QUEUES.md#cron-calling-an-edge-function), which owns Vault setup and the original SQL.

- **Which key?** This scheduling example sends a publishable key, while the auth guide says cron and pg_net calls should send a secret key on `apikey` to a function using `auth: 'secret'`. Match the key to the function's `auth` mode, and check the current docs.
- **pg_net:** read the [canonical API/limits](CRON-AND-QUEUES.md#pg_net-async-http-from-sql) and [credential boundary](CRON-AND-QUEUES.md#pg_net-security).
- **Database Webhooks:** use the [trigger, payload and local URL contract](DATABASE.md#database-webhooks-and-pg_net).
- **Push notifications:** "Supabase cannot send notifications directly", so ApparenceKit's template saves a notification row and an Edge Function sends it through Firebase Cloud Messaging; the app reads history, read status and the unread counter from that table in realtime ([ApparenceKit](https://apparencekit.dev/blog/supabase-flutter-template-released/), no code given). FCM device tokens refresh, so the app listens for token updates and rewrites its row; ApparenceKit keys tokens by its own device ID so logout removes the right one, and says one send takes at most 500 tokens ([ApparenceKit](https://apparencekit.dev/blog/flutter-notifications-push-and-locale/), undated). Sending through OneSignal instead: ../onesignal/SERVER-AND-SUPABASE.md.

**Moved:** long work (background tasks, streams, WebSockets), data, storage and AI, local development, testing, deploying and debugging is now in [EDGE-FUNCTIONS-OPERATIONS.md](EDGE-FUNCTIONS-OPERATIONS.md).

## Prove it

- **Middleware:** follow the [server middleware acceptance criteria](SERVER-MIDDLEWARE.md#prove-it).
- **Auth:** call the function with no headers, with only `apikey`, and with a user JWT in `Authorization`. Each returns what its `auth` mode and `verify_jwt` setting say it should, and a `401` body tells you whether the platform or your code refused it. With `verify_jwt` off, a request with no credential is refused by your code unless the mode is `auth: 'none'`.
- **Data scope:** as two different users, the function returns only each caller's rows; grep the function for `supabaseAdmin` and confirm every query on a shared table filters by the caller's ID.
- **CORS:** a browser call from the real origin succeeds, and an `OPTIONS` request returns the CORS headers without running the body parser.
- **Secrets:** `supabase secrets list` shows every name the code reads with `Deno.env.get`, none prefixed `SUPABASE_`, and no secret value appears in the logs.
- **Limits:** the Metrics tab shows CPU and memory well under the limits; in Logs Explorer, `function_logs` shows no `reason` of `Memory`, `CPUTime` or `WallClockTime` for the current `version`, and `function_edge_logs` shows no `546` or `504` for it.
- **Long work:** a background task or WebSocket survives past half the wall clock locally under `policy = "per_worker"`, and logs end in a deliberate shutdown, not `EarlyDrop` mid-work.
- **Database callers:** after a cron or webhook fires, `select * from net._http_response where "status_code" >= 400 or "error_msg" is not null order by "created" desc;` returns no rows.
- **Tests:** `deno test` (or `deno task test`) passes with `globalThis.fetch` mocked, and `deno check` passes before deploy.
