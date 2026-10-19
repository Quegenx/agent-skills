# kitcn HTTP routes and webhooks

HTTP guidance comes from [udecode/kitcn, SKILL.md, references/features/http.md, references/setup/server.md] and the [current HTTP docs](https://kitcn.dev/docs/server/http). Use this for selected cRPC REST/Hono integration. The native [HTTP action boundary](FUNCTIONS-AND-DATA.md#http-storage-and-scheduled-work), [authorization](AUTH.md) and [generated Caller contract](KITCN.md#generated-call-boundaries) remain in force.

## Registration and middleware

[udecode/kitcn, references/features/http.md, Setup; https://kitcn.dev/docs/server/http]

- Define `publicRoute`, `authRoute`, optional-auth routes and `router` from the application's cRPC HTTP builder. Export the combined router as **`httpRouter`**, not appRouter, so codegen discovers it.
- Hono supplies route handling, middleware and CORS; `createHttpRouter(app, httpRouter)` bridges Hono/cRPC into the Convex HTTP router.
- Import auth HTTP helpers from `kitcn/auth/http`; this entry installs the Convex-safe MessageChannel polyfill. `authMiddleware(getAuth)` handles the Better Auth routes, not every application's protected endpoint. The live-session distinction belongs in [KITCN-AUTH.md](KITCN-AUTH.md).
- The source's `/api/*` CORS configuration uses the app's `SITE_URL`, credentials, allowed `Content-Type`, `Authorization`, `Better-Auth-Cookie`, and exposed `Set-Better-Auth-Cookie`. Preserve the actual app-origin and cookie contract when wiring auth.
- Compose feature endpoints with `router({ endpoint })`; use generated module Callers in HTTP handlers for the chosen application API. HTTP responses are not ordinary serializable function return values.

The source admin endpoint adds role metadata to an authRoute that checks identity only. Metadata does not enforce that role; follow [the procedure enforcement boundary](KITCN.md#metadata-and-authorization) and [official Convex authorization](https://docs.convex.dev/auth/functions-auth). The source's update/delete examples also do not establish target ownership merely by accepting an ID. [udecode/kitcn, references/features/http.md, Metadata and middleware, POST/PATCH/DELETE]

## Routes, validation and arguments

[udecode/kitcn, references/features/http.md, Routes and API reference; https://kitcn.dev/docs/server/http]

| Builder | Source use |
|---|---|
| `.get(...).query(...)` | Reads |
| `.post(...).mutation(...)` | Creates |
| `.patch(...).mutation(...)` | Partial updates |
| `.delete(...).mutation(...)` | Deletes |
| `.params(...)` | Path parameters |
| `.searchParams(...)` | URL query parameters |
| `.input(...)` | JSON body |
| `.form(...)` | FormData, including validated File fields |
| `.output(...)`, `.meta(...)`, `.use(...)` | Output schema, metadata and middleware |

The source convention leaves JSON bodies off GET/DELETE. Path/query/body/form schemas can be combined; handlers receive their distinct validated values. Zod failures return 400 with validation details; expected application failures use [the shared CRPCError mapping](KITCN.md#errors).

URL query values arrive as strings. `z.coerce.number()` is the source's numeric parser, but do not transfer that pattern blindly to booleans: official Zod coercion calls Boolean(input), so the nonempty string `"false"` becomes true. Use the documented Zod 4 `z.stringbool()` contract when parsing supported string booleans. The source's combined-schema example used `z.coerce.boolean()` for notify. [udecode/kitcn, references/features/http.md, Combined schemas; https://zod.dev/api; https://zod.dev/v4]

| Client argument | Placement |
|---|---|
| Path values | `params` object |
| Query values | `searchParams` object, serialized as strings |
| JSON body | Root input fields, alongside params when needed |
| Upload | `form` object |
| Request overrides | `fetch`, `init`, `headers` |

`queryOptions`, `staticQueryOptions`, `mutationOptions`, `queryKey` and `queryFilter` are available on generated route clients. Their cache behavior, render-only hook distinction and RSC hydration have one owner in [KITCN-REACT.md](KITCN-REACT.md#query-methods-and-cache-ownership). Downloads/exports can use mutation options as an imperative uncached fetch. Server-side callers use the request headers through the application's server context. [udecode/kitcn, references/features/http.md, React client and Server-side calls]

## Custom responses

[udecode/kitcn, references/features/http.md, Custom responses; https://kitcn.dev/docs/server/http]

Handlers receive Hono context `c` for `c.json(data)`, `c.text(str)`, `c.redirect(url, status?)`, response `c.header(name, value)`, request `c.req.header(name)` and raw-body `c.req.text()`. The source download sets Content-Disposition and Cache-Control; that response decoration does not validate the exported fields or serializer.

The source CSV interpolates titles directly into comma-separated rows. RFC 4180 describes quoting fields containing commas, line breaks or quotes and doubling embedded quotes; it is an Informational RFC. Omit that unescaped example rather than inventing a replacement serializer. [udecode/kitcn, references/features/http.md, File download; https://www.rfc-editor.org/rfc/rfc4180.html#section-2]

## Webhook verification and rate limiting

[udecode/kitcn, references/features/http.md, Webhooks and Rate limiting]

- Verify the provider's signature over the raw body before parsing or applying side effects. Stripe's provider contract stays in [the Stripe skill](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md), rather than importing an app-specific verify/markPaid helper as a complete implementation.
- Discord's `verifyKey(body, signature, timestamp, publicKey)` returns Promise<boolean> in its official implementation. **Await it before testing the result.** The source negates the Promise without awaiting; that branch does not reject a failed signature. Its signature/timestamp headers are `X-Signature-Ed25519` and `X-Signature-Timestamp`. [https://github.com/discord/discord-interactions-js/blob/main/src/index.ts]
- Apply selected rate-limit policy to public/heavy routes before expensive effects. The source's custom `createRatelimitCaller(...).check(...)` implementation is absent, so it is not proof of consumed quota. Kitcn's actual check/limit accounting, identifier signals and failure modes are owned by [KITCN-RATELIMIT.md](KITCN-RATELIMIT.md).
- The source's direct storage upload checks only JWT identity in its displayed authRoute. Do not claim this performs a live-session-row check; use [the actual auth middleware/session path](KITCN-AUTH.md) and [storage authorization](FUNCTIONS-AND-DATA.md#http-storage-and-scheduled-work).

## Streaming boundaries

[udecode/kitcn, references/features/http.md, Streaming; https://docs.convex.dev/functions/http-actions; https://hono.dev/docs/helpers/streaming]

| Hono helper | Response contract |
|---|---|
| `stream` | Streaming Response with byte writes or a readable-stream pipe |
| `streamText` | Text response, sets Content-Type to text/plain |
| `streamSSE` | SSE response with `writeSSE` |

The source manually sets text/event-stream then calls streamText. The kitcn-pinned Hono 4.12.9 implementation replaces that header with text/plain; use the documented SSE helper/contract. [https://github.com/honojs/hono/blob/v4.12.9/src/helper/streaming/text.ts; https://hono.dev/docs/helpers/streaming]

The source AI example expects a ReadableStream from `caller.actions.streamResponse`. Generated action calls cross `ctx.runAction`, whose arguments/results must be Convex values; a ReadableStream cannot cross that boundary. HTTP actions can instead stream a Response directly. Keep the stream in the documented HTTP response boundary rather than inventing a stream-valued registered action. [https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/server/procedure-caller.ts; https://docs.convex.dev/database/types; https://docs.convex.dev/functions/http-actions]

Once the streaming callback runs, the response has started. Hono's ordinary onError cannot replace it; its streaming helper has a separate optional error callback and closes after callback completion. Do not promise an ordinary error response after data has already been sent. [https://hono.dev/docs/helpers/streaming]

## Prove it

[udecode/kitcn, SKILL.md, section 9; references/features/http.md]

Read the registered httpRouter, actual route method/path, distinct params/query/body/form contracts and generated client arguments. Trace enforced authentication, target permission, rate-limit accounting and signature verification before effects. Confirm cookie/CORS headers and the selected HTTP origin. Read the response Content-Type produced by the helper, keep streams outside Convex function values, and do not use the held CSV or app-owned webhook helpers as executable proof. Record unperformed runtime validation; tests/builds are not automatic maintenance steps.
