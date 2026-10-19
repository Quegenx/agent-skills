# Supabase server middleware

The portable `@supabase/server` and `@supabase/middleware` package contracts below come from the existing Supabase server/middleware guides and source links. Cookie sessions remain in [AUTH-SESSIONS.md](AUTH-SESSIONS.md#ssr-with-supabasessr); hosted gateway checks and runtime behavior remain in [EDGE-FUNCTIONS.md](EDGE-FUNCTIONS.md#headers-and-the-platform-check).

## `@supabase/server` (`withSupabase`)

[Supabase server package guides; https://supabase.com/docs/reference/server/frameworks; existing EDGE-FUNCTIONS.md, @supabase/server]

```ts
import { withSupabase } from 'npm:@supabase/server@1'
export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, ctx) => {
    return Response.json({ email: ctx.userClaims?.email })
  }),
}
```

| `auth` | Accepts |
|---|---|
| `'user'` | A valid user JWT in `Authorization` |
| `'secret'` | The `default` secret key in `apikey` |
| `'publishable'` | The `default` publishable key in `apikey` |
| `'none'` | Any caller |
| `'secret:<name>'`, `'secret:*'`, `'publishable:<name>'`, `'publishable:*'` | A named key, or any key of that kind. `'secret:<name>'` also points `supabaseAdmin` at that key. |
| `['user', 'secret']` | Tries each in order; `ctx.authMode` says which matched |

- **Context:** `ctx.supabase` (RLS-scoped to the caller), `ctx.supabaseAdmin` (bypasses RLS), `ctx.userClaims` (id, email, role), `ctx.jwtClaims`, `ctx.authMode`.
- **`ctx.supabaseAdmin` on a shared table without a filter on the caller's ID returns every user's rows.** Filter explicitly, or use `ctx.supabase`.
- **`publishable` and `secret` modes read only `apikey`, never `Authorization`;** a caller sending `Authorization: Bearer <key>` gets a bare `401`.
- **Patterns:** service-to-service (cron, workers, pg_net, other functions) uses `auth: 'secret'` with `verify_jwt` off; a public endpoint uses `auth: 'none'` with `verify_jwt = false`.
- **Env it reads:** `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS` (or `SUPABASE_JWKS_URL` for the JWKS config), all provisioned by the platform and the CLI.
- **Errors:** `401 MISSING_CREDENTIALS`, `401 UNUSABLE_CREDENTIAL` (an `sb_` key in `Authorization`), `401 INVALID_JWT`, `500 JWKS_FETCH_FAILED`, `500 JWKS_NOT_CONFIGURED`.
- **Shape your own error** with `createSupabaseContext(req, { auth })`, which returns `{ data, error }`; `error.toJSON()` gives `{ source, code, message, hint, docs, details }`. It doesn't handle CORS.
- **`withClaims()` is not a gate.** With no token it contributes `jwtClaims: null` and continues; the downstream handler determines the status. The old line incorrectly guaranteed `200`. An invalid token still rejects with 401. Use `withRequiredClaims()` to require a caller; composing both conflicts on the same key. [https://github.com/supabase/server/blob/main/src/middleware/claims/index.ts]
- **`@supabase/middleware` 1.0** (2026-09-30; `@supabase/server` builds on it since 1.5.1) provides `pipeline([...], handler)`, `defineMiddleware`, `withCors` and `withFeatureFlag`. Subpaths: `withClaims`, `withRequiredClaims`, `withSupabaseClient`, `withSupabaseAdminClient`, `withPostgresClient`, `withPostgresAdminClient`, and `withOAuthProtectedResource` for MCP OAuth discovery. Per-route auth uses `createContextClient` and `verifyAuth` from `@supabase/server/core`.

```ts
import { pipeline } from 'npm:@supabase/middleware@1'
import { withOAuthProtectedResource, withSupabase } from 'npm:@supabase/server@1'
Deno.serve(
  pipeline(
    [withOAuthProtectedResource(), withSupabase({ auth: 'user' })],
    async (req, { supabase }) => {
      const { data } = await supabase.from('tasks').select('id, title')
      return Response.json(data)
    },
  ),
)
```

- **Breaking change: the framework adapters** `@supabase/server/adapters/{hono,h3,elysia,nestjs}` were deprecated on 2026-10-05 and are removed on December 1, 2026. They are replaced by copied "bridges" (need `@supabase/server` 1.6.0+, Node 22+ and `@supabase/middleware` as a direct dependency). `withSupabase` itself is not deprecated. The routing page still points to the Hono adapter; that is outdated.

## Composable Fetch middleware

[Supabase, Supabase Middleware, 2026-10-15; https://supabase.com/docs/reference/middleware/build-your-own; https://github.com/supabase/middleware/blob/main/docs/authoring-guide.md]

- **Array order is execution order.** `pipeline` accumulates typed contributions on `ctx`; returning a `Response` short-circuits. The engine needs no Supabase project or database. `withSupabase` is a composite of entries, so the article's one-key description is not a rule that every composite adds exactly one key.
- **Author one contribution with `defineMiddleware<Key, Config, In, Contribution>`.** The spec's `key` names it; `run(config)` executes when constructing the stack and returns the per-request function. That function returns the keyed object or a short-circuit Response. Declare required upstream keys in `In`; annotating a config callback alone does not establish prerequisites.
- **Static checks need TypeScript 5.4+.** `pipeline` checks duplicate keys and prerequisites. Manual nesting needs outer `satisfies FetchHandler` for equivalent checks; without it a duplicate can compile and a missing prerequisite can fail on the first request. JavaScript keeps runtime behavior without those checks. An optional property in `In` still requires the key.
- **Plain async run is request-side.** For response hooks use `async function*`: yield a contribution at most once, receive the downstream Response at that yield, then inspect/replace it. `finally` can clean up across downstream failure; returning nothing preserves the response. A rejection returns a Response; misconfiguration may throw.
- **Read portable environment values during requests.** `getEnv` returns `undefined` on Workers before the first request, so initialize env-dependent clients lazily there. This applies to reusable middleware; it does not invalidate ordinary Deno handler env access. Shared middleware can live in a versioned package.
- **Feature flags admit or stop.** `withFeatureFlag` contributes `ctx.featureFlag` on admission; disabled flags default to 404, configurable through `rejectStatus` and `rejectBody`. [https://github.com/supabase/middleware/blob/main/src/middleware/feature-flag/with-feature-flag.ts]

**Direct Postgres scope is per query.** `withPostgresClient` requires upstream `jwtClaims`. Each query opens a transaction, injects claims, applies SET LOCAL role, then commits or rolls back; claims do not persist on the pooled connection. Current accepted roles are `anon`/`authenticated`; unsupported roles return `500 UNSUPPORTED_ROLE`, not an anonymous downgrade. `withPostgresAdminClient` injects no claims, switches no role and runs as the connection-string role; two scoped query calls are not one transaction. [https://github.com/supabase/server/blob/main/src/middleware/postgres/index.ts; https://github.com/supabase/server/blob/main/src/middleware/postgres-admin/index.ts]

**Workers support and package support differ.** The article says Postgres entries cannot run on Workers because pg needs TCP. Cloudflare documents TCP and pg 8.16.3+ with the appropriate Node compatibility configuration. Supabase still documents these entries as unsupported there; keep the HTTP `withSupabaseClient` alternative until actual package/pool compatibility is established. Do not infer middleware support from driver support alone. [https://developers.cloudflare.com/workers/tutorials/postgres/; https://github.com/supabase/server/blob/main/src/middleware/postgres/index.ts]

**Bridges preserve only their documented capabilities.** Copy the bridge into the application; native framework middleware can coexist with it. [https://supabase.com/docs/reference/server/frameworks]

| Bridge | Integration boundary |
|---|---|
| Hono | `toHono(entries)` publishes contributions on `c.var`. Chain `.use()` before gated routes for types; separate entry arrays use sub-apps with `app.route()`. Preserve the bridge's response-clearing line so response hooks remain authoritative. |
| NestJS | Guard bridge has no response phase and forwards no body. Use `app.enableCors()` for preflight/success headers and native middleware for body/signature checks. |
| TanStack Start | Preserve the bridge's error conversion for server functions; otherwise a JSON 401 can resolve as a successful value. Keep module-scope secrets out of client-reachable entry modules. |

### Fetch handler example

The Auth sessions guide uses the same package with a caller-scoped query:

```ts
import { withSupabase } from '@supabase/server'
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    // ctx.supabase is scoped to the caller and respects RLS
    const { data } = await ctx.supabase.from('todos').select()
    return Response.json(data)
  }),
}
```

## Prove it

- **Middleware:** trace entry order, contributed/required keys, actual auth rejection, response-hook behavior and the chosen bridge's body/CORS limits. Verify each Postgres call's transaction and role scope. These are acceptance criteria; this repository runs no tests/builds unless requested. [Supabase, Supabase Middleware, 2026-10-15; https://supabase.com/docs/reference/middleware/build-your-own; user standing rules]
