# HTTP

Effect v4 does HTTP from one model on both sides: `HttpClient` executes immutable `HttpClientRequest` values, and `HttpApi` turns one schema-first definition into a server, a typed client and OpenAPI docs. Most mistakes come from beta-era examples: in `4.0.0-rc.118` the modules moved from `effect/unstable/*` paths (such as `effect/unstable/http`) to `effect/http` and `effect/http-api`, and the old paths were removed. Every module here is still tagged `@stability unstable` (`@since 4.0.0`) in its JSDoc.

**Contents:** [Imports](#imports) · [HttpClient](#httpclient) · [HttpApi: defining the API](#httpapi-defining-the-api) · [Request schemas](#request-schemas) · [Response schemas](#response-schemas) · [Errors](#errors) · [Middleware and security](#middleware-and-security) · [Implementing handlers](#implementing-handlers) · [Serving](#serving) · [Typed client](#typed-client) · [OpenAPI and docs](#openapi-and-docs) · [Testing HttpApi](#testing-httpapi) · [Plain HttpRouter and HttpServer](#plain-httprouter-and-httpserver) · [Porting from v3](#porting-from-v3) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## Imports

- **HTTP modules:** `effect/http` (Cookies, Etag, FetchHttpClient, Headers, HttpBody, HttpClient, HttpClientError, HttpClientRequest, HttpClientResponse, HttpEffect, HttpMiddleware, HttpRouter, HttpServer, HttpServerError, HttpServerRequest, HttpServerResponse, HttpStaticServer, HttpStatus, Multipart, Url, UrlParams and more).
- **HttpApi modules:** `effect/http-api` (HttpApi, HttpApiBuilder, HttpApiClient, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiMiddleware, HttpApiScalar, HttpApiSchema, HttpApiSecurity, HttpApiSwagger, HttpApiTest, OpenApi).
- **Runtime-specific servers and clients** come from `@effect/platform-node` (`NodeHttpServer`, `NodeHttpClient`, `NodeRuntime`), `@effect/platform-bun` (`BunHttpServer`, `BunHttpClient`) and `@effect/platform-browser` (`BrowserHttpClient`). See PLATFORM.md.
- **The effect.website v4 docs have no HttpApi or HttpClient pages.** The official sources are the package's `LLMS.md`, `ai-docs/` and `HTTPAPI.md` (search `node_modules/effect` for them).

## HttpClient

- **Wrap the client in a service and configure it once:**

```ts
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http"

const client = (yield* HttpClient.HttpClient).pipe(
  HttpClient.mapRequest(flow(
    HttpClientRequest.prependUrl("https://jsonplaceholder.typicode.com"),
    HttpClientRequest.acceptJson
  )),
  // Fail if the response status is not 2xx
  HttpClient.filterStatusOk,
  // Retry transient errors (network issues, 5xx responses) with an exponential backoff.
  HttpClient.retryTransient({
    schedule: Schedule.exponential(100),
    times: 3
  })
)
```

  The service is a `Context.Service` whose `static readonly layer = Layer.effect(...)` yields `HttpClient.HttpClient`, builds the client as above, and ends with `Layer.provide(FetchHttpClient.layer)`. `NodeHttpClient` or `BunHttpClient` can replace the fetch transport.
- **Decode bodies with a schema and wrap failures in a domain error:**

```ts
client.get("/todos").pipe(
  Effect.flatMap(HttpClientResponse.schemaBodyJson(Schema.Array(Todo))),
  Effect.mapError((cause) => new JsonPlaceholderError({ cause })),
  Effect.withSpan("JsonPlaceholder.allTodos")
)

class JsonPlaceholderError extends Schema.TaggedError<JsonPlaceholderError>()(
  "JsonPlaceholderError", { cause: Schema.Defect() }
) {}
```

- **Per-request options:** `` client.get(`/todos/${id}`, { urlParams: { format: "json" } }) ``; there are options for query parameters, request body, headers and more.
- **Build complex requests with `HttpClientRequest`:** `HttpClientRequest.post("/todos").pipe(HttpClientRequest.setUrlParams({ format: "json" }), HttpClientRequest.bodyJsonUnsafe(todo), client.execute, Effect.flatMap(HttpClientResponse.schemaBodyJson(Todo)))`.
- **Name methods for telemetry:** `Effect.fn("Service.method")` and `Effect.annotateCurrentSpan({ id })`.
- **Client exports:** `execute`, `get`, `query`, `head`, `post`, `patch`, `put`, `del`, `options`, `transform`, `transformResponse`, `catchTag`, `catchTags`, `filterOrElse`, `filterOrFail`, `filterStatus`, `filterStatusOk`, `make`, `makeWith`, `mapRequest`, `mapRequestEffect`, `mapRequestInput`, `mapRequestInputEffect`, `retry`, `retryTransient`, `withRateLimiter`, `tap`, `tapError`, `tapRequest`, `withCookiesRef`, `withScope`, `followRedirects`, `TracerDisabledWhen`, `TracerHeaderFilter`, `TracerPropagationEnabled`, `SpanNameGenerator`, `layerMergedContext`.
- **`HttpClient.retryTransient(options)`** retries rate limiting, timeouts and network issues. Options `{ retryOn?: "errors-only" | "response-only" | "errors-and-responses", while?, schedule?, times? }`; `retryOn` defaults to `"errors-and-responses"`; a bare `Schedule` is also accepted. A `while` predicate marks other errors as transient and is ignored in `"response-only"` mode. A `Retry-After` header on a transient or status-error response sets the minimum delay before the next attempt.
- **`HttpClient.withRateLimiter`** uses the `RateLimiter` service, inspects rate limit headers and retries HTTP `429`. Those retries are unlimited unless `times` is set; disabling response inspection does not disable them. Set `times` to `0` to return or fail with the first `429`.
- **Match failures on the reason.** `HttpClientError` wraps request construction, transport, status-code validation and decoding failures, keeping the failed request and the reason together; match the reason `_tag` for retry policy, logging, metrics and user messages.
- **`FetchHttpClient.layer`** is the transport for browsers, edge runtimes and Node.js where `globalThis.fetch` exists. The `Fetch` reference defaults to `globalThis.fetch`; an optional `RequestInit` service supplies defaults that request fields override. CORS, cookies, redirects, abort handling and streaming vary by platform. Trace propagation is on by default, and a browser preflight fails unless the target allows `b3` and `traceparent`; use `HttpClient.TracerPropagationEnabled` to leave those headers off. Stream bodies are sent as Web streams with `duplex: "half"` and any `content-length` header is removed.

## HttpApi: defining the API

- **Keep the API definition apart from the server implementation,** ideally in its own monorepo package, so server and client share it without leaking server code into clients. Do the same for middleware: the definition lives with the API, the implementation on the server. The official example lays it out as `api/{Api,Authorization,System,Users}.ts`, `domain/{User,UserErrors}.ts`, `server/{Authorization,Users}.ts` and `server/Users/http.ts`.
- **Three building blocks:** `HttpApiEndpoint` (one route, path plus method, with request and response schemas), `HttpApiGroup` (related endpoints) and `HttpApi` (combines groups). One definition powers the server, docs and client.
- **Schemas first, metadata on schemas.** Path params, query, headers, payloads, responses and errors are all schemas; status codes and content types are annotations on the schema, not settings on the endpoint.
- **Root API:**

```ts
export class Api extends HttpApi.make("user-api")
  .add(UsersApiGroup)
  .add(SystemApi)
  .annotateMerge(OpenApi.annotations({
    title: "Acme User API"
  }))
{}
```

- **Compose APIs** with `HttpApi.make("api").addHttpApi(AnotherApi)`.
- **Endpoint constructors:** `HttpApiEndpoint.get(name, path, { query, params, headers, payload, success, error })`, `.post`, `.patch`, `.delete`. The name becomes the client method name. Options take schemas, with structs as plain records: `query: { search: Schema.optional(Schema.String) }`.
- **Endpoint anatomy:**

```ts
HttpApiEndpoint.patch("updateUser", "/user/:id", {
  params: { id: Schema.String },                       // record of fields or a full schema
  query: { mode: Schema.Literals(["merge", "replace"]) },
  headers: { "x-api-key": Schema.String, "x-request-id": Schema.String },
  // single schema or array; default JSON; default success status 200; for GET must be a record of schemas
  payload: [Schema.Struct({ name: Schema.String }), Schema.String.pipe(HttpApiSchema.asText())],
  success: [User, Schema.String.pipe(HttpApiSchema.status(206), HttpApiSchema.asText())],
  error: [
    Schema.Finite,                                     // default 500 with JSON
    Schema.String.pipe(HttpApiSchema.status(404), HttpApiSchema.asText()),
    Schema.Void.pipe(HttpApiSchema.status(401))        // encodes to Void => "no content"
  ]
})
```

- **Group modifiers:** `.middleware(Authorization)` on a whole group (or on single endpoints for finer control), `.prefix("/users")`, `.annotateMerge(OpenApi.annotations({ title: "Users", description: "User management endpoints" }))`. OpenAPI annotations on groups, endpoints, parameters and bodies are merged.
- **Top-level groups** sit at the client root and are not prepended to operation IDs: `HttpApiGroup.make("system", { topLevel: true }).add(HttpApiEndpoint.get("health", "/health", { success: HttpApiSchema.NoContent }))` gives `client.health()`.
- **Prefixes at three levels** stack: endpoint `.prefix("/endpointPrefix")`, group `.prefix("/groupPrefix")`, API `.prefix("/apiPrefix")` give `/apiPrefix/groupPrefix/endpointPrefix/a`.
- **Catch-all path `"*"`** must be the last endpoint in its group and is left out of the OpenAPI spec.
- **Use `Model.Class` variants at the boundary** (SQL.md): `success: User.json`, `payload: User.jsonCreate` (only the fields clients may set, so generated ids and timestamps can't be), `payload: User.jsonUpdate`.

## Request schemas

- **GET payloads use the query string; POST payloads use the body,** JSON by default.
- **Request encodings:** `HttpApiSchema.asJson` (default), `asFormUrlEncoded`, `asText`, `asUint8Array`, `asMultipart`, `asMultipartStream`. A payload array can mix JSON, `asFormUrlEncoded()` and `asMultipart()` variants.
- **Write natural domain types; coercion is automatic.** Path, query and header schemas go through `Schema.toCodecStringTree`; JSON payload, success and error schemas through `Schema.toCodecJson`. `params: { id: UserId }` on `"/:id"` works even when `UserId` decodes from a number.
- **Query:** `query: { page: Schema.optionalKey(Page), sort: Schema.optionalKey(Schema.Literals(["id", "name"])) }` with `const Page = Schema.Int.check(Schema.isGreaterThan(0))`. Repeated values: `a: Schema.optionalKey(Schema.Array(Schema.String))` accepts `?a=1&a=2`, `?a=1` and none.
- **Headers are normalized to lowercase;** always declare lowercase keys.
- **Multipart uploads:** `payload: HttpApiSchema.asMultipart(Schema.Struct({ files: Multipart.FilesSchema }))` (`Multipart` from `effect/http`). Files are persisted to disk automatically; the handler sees `readonly Multipart.PersistedFile[]`. Streaming uploads: `Schema.Struct({ file: Multipart.SingleFileSchema }).pipe(HttpApiSchema.asMultipartStream())`, and the handler consumes `payload` as a `Stream` filtered with `Multipart.isFile`.
- **Form encoding:** `payload: Schema.Struct({...}).pipe(HttpApiSchema.asFormUrlEncoded())`.
- **Cookies have no endpoint option.** For validated cookies, define `HttpApiSecurity.apiKey` with `in: "cookie"` on a middleware; the value reaches the security handler as a `Redacted` credential. Unvalidated access is `ctx.request.cookies.lang`, which stays out of the OpenAPI spec.
- **Raw streaming requests:** `handlers.handleRaw("acceptStream", (ctx) => ctx.request.stream.pipe(Stream.runFold(() => 0, (total, chunk) => total + chunk.length), Effect.map(...), Effect.orDie))`. `.handleRaw` skips payload decoding and exposes the raw `HttpServerRequest`, so the declared content type is no longer enforced: a different `Content-Type` is not rejected with `415`, and checking it is up to the handler. `request.stream` fails with `HttpServerError`.

## Response schemas

- **Status** with `HttpApiSchema.status(206)` or an `httpApiStatus` annotation; success defaults to `200 OK`. Without a success schema, `HTTPAPI.md` says in one passage "200 OK with no content" and in its GET section "`204 No Content`"; check the installed source if the exact code matters.
- **No content:** any schema that encodes to `Schema.Void` is "no content".
- **Encodings:** `asJson` (default, `application/json`), `asFormUrlEncoded`, `asText` (`text/plain`), `asUint8Array` (`application/octet-stream`).
- **Several encodings for one endpoint:** `success: [Schema.Array(User.json), Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/csv" }))]`.
- **Typed response headers:** `success: HttpApiSchema.WithHeaders(Schema.Array(User), { "x-total-count": Schema.Int })`; the handler returns `HttpApiSchema.withHeaders({ body: [...], headers: { "x-total-count": 1 } })` and the client gets `{ body, headers }`. Values are stringified at the boundary and `undefined` is omitted. Status and encoding annotations resolve from the wrapper first, then the inner schema. Declared headers apply after body encoding and win on collision, `content-type` included. Stream schemas can be wrapped. Only one header-carrying response schema per status.
- **Fold headers into a domain type** with `HttpApiSchema.encodeToWithHeaders({ body: HttpApiSchema.Empty(404), headers: { "x-user-id": Schema.Int } }, { decode: ({ headers }) => new UserNotFound({ userId: headers["x-user-id"] }), encode: (error) => ({ headers: { "x-user-id": error.userId }, body: undefined }) })`. The body schema is authoritative for everything wire-level; the mappings are pure total functions; wrap streams with `WithHeaders` instead of burying them here.
- **Untyped headers** bypass schemas, OpenAPI and the client: `yield* HttpEffect.appendPreResponseHandler((_req, response) => Effect.succeed(HttpServerResponse.setHeader(response, "x-custom", "hello")))`.
- **Cookies:** `HttpServerResponse.setCookieUnsafe(response, "my-cookie", "my-value", { httpOnly: true, secure: true, path: "/" })` inside `appendPreResponseHandler`. For a cookie tied to an `HttpApiSecurity.apiKey`, use `HttpApiBuilder.securitySetCookie(security, Redacted.make("keep me secret"))`, which sets `HttpOnly` and `Secure` by default.
- **Redirects:** return `HttpServerResponse.redirect("/new", { status: 302 })` from the handler; the redirect is not modeled in the schema.
- **Streaming:** `success: HttpApiSchema.StreamUint8Array()` (handler returns `Effect.succeed(stream)` of `Uint8Array`) or `success: HttpApiSchema.StreamSse({ data: Message })` (each element JSON-encoded into SSE `data`; an `events` schema gives the full event shape: `data` string, optional `id`, `event`). The client gets a typed `Stream`. With `StreamSse({ data, error: StreamError })` the server encodes the full `Cause` into a reserved `effect/http-api/stream/failure` event and the client fails the stream with the original cause. At most one streaming success schema per endpoint, none on `HEAD`, none in error responses.

## Errors

- **Errors are schemas with a status.** Set it inline on the class: `Schema.TaggedError<UserNotFound>()("UserNotFound", {}, { httpApiStatus: 404 })`, or on the schema: `UserNotFound.pipe(HttpApiSchema.status(404))`. Errors without one default to `500` with JSON.
- **Several errors per endpoint:** `error: [SearchQueryTooShort.pipe(HttpApiSchema.asNoContent({ decode: () => new SearchQueryTooShort() })), HttpApiError.RequestTimeoutNoContent]`. `asNoContent` returns no body and needs a decoder that rebuilds the error.
- **Built-in `HttpApiError`s:** `HttpApiDecodeError` 400, `BadRequest` 400, `Unauthorized` 401, `Forbidden` 403, `NotFound` 404, `MethodNotAllowed` 405, `NotAcceptable` 406, `RequestTimeout` 408, `Conflict` 409, `Gone` 410, `InternalServerError` 500, `NotImplemented` 501, `ServiceUnavailable` 503, each with a `...NoContent` variant. Fail with `new HttpApiError.NotFound({})` or `return yield* new HttpApiError.RequestTimeout()`.
- **One wrapper error per API area** keeps services and endpoints from collecting error types: `class UsersError extends Schema.TaggedError<UsersError>()("UsersError", { reason: Schema.Union([UserNotFound, SearchQueryTooShort]) }) {}`. Narrow it in the handler (below).
- **Decode failures default to an empty `400 Bad Request`.** The generated OpenAPI lists a 400 "The request or response did not match the expected schema" with `_tag: "HttpApiSchemaError"` and `message`. To return your own error:

```ts
class SchemaErrorHandler extends HttpApiMiddleware.Service<SchemaErrorHandler>()("api/SchemaErrorHandler", {
  error: ValidationError.pipe(HttpApiSchema.status(422))
}) {}

const SchemaErrorHandlerLayer = HttpApiMiddleware.layerSchemaErrorTransform(
  SchemaErrorHandler,
  (schemaError) => Effect.fail(new ValidationError({ message: `Invalid request: ${schemaError.message}` }))
)
```

  Attach with `.middleware(SchemaErrorHandler)` on an endpoint, group or API, and `Layer.provide(SchemaErrorHandlerLayer)`.

### Schema error representation

The schema integration guide's status-tagged error form:

```ts
  class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {}, { httpApiStatus: 404 }) {}
```

The schema integration guide also gives the struct form `Schema.Struct({ _tag: Schema.tag("UserNotFound"), message: Schema.String }).pipe(HttpApiSchema.status(404))`, failed with `UserNotFound.make({...})`. [Existing SCHEMA-INTEGRATIONS.md, HTTP (HttpApi)]

The integration guide's other forms are `HttpApiSchema.asNoContent({ decode: () => new UserNotFound() })`, `.annotate({ description: "A user", identifier: "User" })` and the branded id `Schema.String.pipe(Schema.brand("UserId"))`. [Existing SCHEMA-INTEGRATIONS.md, HTTP (HttpApi)]

A request decode failure returns an empty 400 and is ignored by error reporters; response encoding failure returns an empty 500 and is reported. Both raise `HttpApiSchemaError`, with `kind: "Params" | "Headers" | "Query" | "Body" | "Payload" | "ResponseHeaders"` and `cause: Schema.SchemaError`. The existing `layerSchemaErrorTransform` example above customizes it at endpoint, group or API level. `OpenApi.fromApi(api, options)` forwards `referencePolicy` when extracting schema components. [Existing SCHEMA-INTEGRATIONS.md, HTTP (HttpApi)]

## Middleware and security

- **Define middleware as a class extending `HttpApiMiddleware.Service`,** implement it as a `Layer`, attach it to an endpoint, group or API:

```ts
export class CurrentUser extends Context.Service<CurrentUser, User>()("acme/HttpApi/Authorization/CurrentUser") {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  { message: Schema.String },
  { httpApiStatus: 401 }
) {}

export class Authorization extends HttpApiMiddleware.Service<Authorization, {
  provides: CurrentUser
  requires: never
}>()("acme/HttpApi/Authorization", {
  requiredForClient: true,
  security: {
    bearer: HttpApiSecurity.bearer
  },
  error: Unauthorized
}) {}
```

  `provides` injects services (here the current user) into later middleware and endpoints; `requires` names services from other middleware; `requiredForClient: true` makes clients supply an implementation too (to inject the token); `security` drives the OpenAPI docs and decodes credentials; `error` declares what it can fail with (default `500` with JSON).
- **Server implementation:** each security handler receives `(httpEffect, { credential })`, the credential `Redacted`, and provides the resource the middleware promises:

```ts
export const AuthorizationLayer = Layer.effect(
  Authorization,
  Effect.gen(function*() {
    yield* Effect.logInfo("Starting Authorization middleware")
    return Authorization.of({
      bearer: Effect.fn(function*(httpEffect, { credential }) {
        const token = Redacted.value(credential)
        if (token !== "dev-token") {
          return yield* new Unauthorized({ message: "Missing or invalid bearer token" })
        }
        return yield* Effect.provideService(httpEffect, CurrentUser, devUser)
      })
    })
  })
)
```

  A `Layer.succeed(Authorization, { myBearer: (effect, opts) => Effect.provideServiceEffect(effect, CurrentUser, ...) })` form works too.
- **Client implementation** adds tokens and headers: `HttpApiMiddleware.layerClient(Authorization, Effect.fn(function*({ next, request }) { return yield* next(HttpClientRequest.bearerToken(request, "dev-token")) }))`.
- **Plain middleware** returns `(res) => Effect.gen(function*() { const request = yield* HttpServerRequest.HttpServerRequest; ...; return yield* res })`.
- **Order matters: the middleware that `requires` a service comes BEFORE the one that `provides` it,** because the earlier wraps the later: `.middleware(RequireAuth).middleware(LoadAuth)` where `LoadAuth` declares `{ readonly provides: AuthInfo }` and `RequireAuth` `{ readonly requires: AuthInfo }`.
- **Schemes:** `HttpApiSecurity.apiKey` (header, query or cookie), `HttpApiSecurity.basic`, `HttpApiSecurity.bearer`. Several entries in `security: {...}` are tried in the order defined. Document one with `HttpApiSecurity.bearer.pipe(HttpApiSecurity.annotate(OpenApi.Description, "my description"))`.

## Implementing handlers

- **One group, all handlers:**

```ts
HttpApiBuilder.group(Api, "users", Effect.fn(function*(handlers) {
  const users = yield* Users
  return handlers.handleAll({
    list: ({ query }) => ...,
    getById: ({ params }) => ...,
    create: ({ payload }) => ...,
    me: () => CurrentUser
  })
}))
```

  `.handle(name, fn)` registers one; `.handleAll` registers all, keyed by endpoint name. The handler context has `params`, `query`, `payload` and `request` (the raw `HttpServerRequest`). Because `group` returns an `Effect`, yield services directly; services provided by middleware are read directly (`me: () => CurrentUser`).
- **An endpoint with no declared errors** converts failures to a 500 with `Effect.orDie`.
- **Narrow a wrapper error to the endpoint's declared errors:** `Effect.catchReason("UsersError", "SearchQueryTooShort", Effect.fail, Effect.die)`, `Effect.catchReasons("UsersError", { UserNotFound: (e) => Effect.fail(e) }, Effect.die)`, or `Effect.unwrapReason("UsersError")` then `Effect.catchTags`.
- **Export a no-deps layer for tests:** `UsersApiHandlersNoDeps`, and `UsersApiHandlers = UsersApiHandlersNoDeps.pipe(Layer.provide([Users.layer, AuthorizationLayer]))`. Service layers follow the same split: `layerNoDeps` (needs `SqlClient`), `layer: Layer.Layer<Users>` (fully provided, `Layer.orDie`), `layerMemory` (in-memory for tests).

## Serving

```ts
const SystemApiHandlers = HttpApiBuilder.group(Api, "system", Effect.fn(function*(handlers) {
  return handlers.handleAll({ health: () => Effect.void })
}))

const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json"
}).pipe(
  Layer.provide([UsersApiHandlers, SystemApiHandlers])
)

const DocsRoute = HttpApiScalar.layer(Api, { path: "/docs" })

const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute)

export const HttpServerLayer = HttpRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)

Layer.launch(HttpServerLayer).pipe(NodeRuntime.runMain)

// Or create a web handler, which can be used in serverless environments
export const { handler, dispose } = HttpRouter.toWebHandler(AllRoutes.pipe(
  Layer.provide(HttpServer.layerServices)
))
```

- **`BunHttpServer` replaces `NodeHttpServer`** with the same shape.
- **Web handler:** `HttpRouter.toWebHandler` returns `{ handler, dispose }`; `handler` takes a `Request` and returns a `Response`; call `dispose()` on shutdown. `HTTPAPI.md` prose names `HttpApiBuilder.toWebHandler`, but its code and the v4 source use `HttpRouter.toWebHandler`.

## Typed client

```ts
export class ApiClient extends Context.Service<ApiClient, HttpApiClient.ForApi<typeof Api>>()("acme/ApiClient") {
  static readonly layer = Layer.effect(
    ApiClient,
    HttpApiClient.make(Api, {
      transformClient: (client) =>
        client.pipe(
          HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("http://localhost:3000"))),
          HttpClient.retryTransient({ schedule: Schedule.exponential(100), times: 3 })
        )
    })
  ).pipe(
    Layer.provide(AuthorizationClient),
    Layer.provide(FetchHttpClient.layer)
  )
}
```

- **`transformClient`** sets the base URL and retry policy; `HttpApiClient.make(Api, { baseUrl: "http://localhost:3000" })` also works.
- **Methods mirror the definition,** grouped by group name, so renames and schema changes are checked at compile time: `client.health()`, `client.users.create({ payload })`, `client.users.getById({ params: { id } })`, `client.users.list({ query: {} })`.
- **`HttpApiClient.makeWith(Api, { httpClient })`** takes an explicit client instead of the one in context.

## OpenAPI and docs

- **Serve the spec** with the `openapiPath` option of `HttpApiBuilder.layer`; generate it with `OpenApi.fromApi(api)` (`"openapi": "3.1.0"`, default title "Api", version "0.0.1").
- **Docs UIs:** `HttpApiScalar.layer(Api)` or `HttpApiSwagger.layer(Api)`; the default path is `"/docs"`.
- **Schema annotations `{ description, identifier }`** only enrich the docs (`identifier` feeds Scalar's Model section). The default response description is "Success"; override with `.annotate({ description: "Returns an array of users" })`.
- **Annotations, applied with `.annotate(OpenApi.X, value)`:** on the API `HttpApi.AdditionalSchemas` (only schemas with an `identifier`), `OpenApi.Description`, `Title`, `Version`, `License`, `Summary`, `Servers`, `Override` (merges fields), `Transform` (function on the final spec); on groups `Description`, `ExternalDocs`, `Override`, `Transform`, `Exclude`; on endpoints `Description`, `Summary`, `Deprecated`, `ExternalDocs`, `Override`, `Transform`, `Exclude`.
- **Operation IDs are `group.endpoint`,** without the group for `topLevel` groups.

## Testing HttpApi

- **Test handlers through an in-memory typed client with `HttpApiTest`,** no HTTP server and no real database. `HttpApiTest.groups(Api, ["users"])` wires a typed client straight to the selected groups' handlers with the same encoding, routing and decoding as a real server.
- **Provide `HttpServer.layerServices`** for the platform services the pipeline needs (`HttpPlatform`, `Path`, a weak ETag generator, a no-op `FileSystem`).
- **`Layer.provideMerge` the middleware,** because the pipeline also resolves it when routes are built: `UsersApiHandlersNoDeps.pipe(Layer.provide(Users.layerMemory), Layer.provideMerge(AuthorizationLayer))`.
- **Swap the client middleware per test** (good token, no token, wrong token) to cover authorized and unauthorized paths; assert errors with `Effect.flip` then `error._tag`, inside `layer(...)("UsersApi", (it) => { it.effect(...) })` from `@effect/vitest`.
- **Real-server integration tests:** `NodeHttpServer.layerTest` (ephemeral port plus a fetch `HttpClient`) or `HttpServer.layerTestClient`.

## Plain HttpRouter and HttpServer

- **Routes without HttpApi:**

```ts
export const HealthRoutes = HttpRouter.use(Effect.fn(function*(router) {
  yield* router.add("GET", "/health", Effect.succeed(HttpServerResponse.text("ok")))
  yield* router.add("GET", "/healthz", Effect.succeed(HttpServerResponse.text("ok")))
}))
export const HttpServerLive = HttpRouter.serve(HealthRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)
export const main = Layer.launch(HttpServerLive)
NodeRuntime.runMain(main)
```

  `HttpRouter.add("GET", "/hello", HttpServerResponse.text("Hello, World!"))` is itself a Layer.
- **Router exports:** `make`, `RouterConfig`, `RouteContext`, `params`, `schemaJson`, `schemaNoBody`, `schemaParams`, `schemaPathParams`, `use`, `add`, `addAll`, `layer`, `toHttpEffect`, `route`, `prefixPath`, `prefixRoute`, `middleware`, `cors`, `disableLogger`, `provideRequest`, `serve`, `toWebHandler`. `schemaJson` decodes from method, URL, headers, cookies, path params, search params and the JSON body.
- **`HttpRouter.middleware(fn)` affects only the routes it is provided to:** `HttpRouter.middleware(...).layer` then `Layer.provide(RouteMiddleware)` on routes. Pass `{ global: true }` and merge it with the routes to apply everywhere.
- **`HttpRouter.serve` keeps layers built inside it private to that server;** provide shared services outside `serve`. It builds with a forked `MemoMap`, so calling `serve` twice builds the same layer twice.
- **`HttpRouter.toWebHandler(layer, { disableLogger? })`** builds the layer immediately; if the build fails, every request rejects with the build error. On Cloudflare Workers, build the handler at module scope (fibers started inside `fetch` capture that request's async context), keep request-time I/O out of layer construction, and provide `Layer.succeed(Scheduler.Scheduler, new Scheduler.MixedScheduler("sync"))` via `Layer.provideMerge`.
- **`HttpServer.serve`** still requires the server, a scope and non-request dependencies.
- **`HttpMiddleware`** maps one server app effect to another: `logger`, `tracer`, `xForwardedHeaders`, `searchParamsParser`, `cors`, `compression`, `decompression`, `withLoggerDisabled`, `layerTracerDisabledForUrls`.

## Porting from v3

- **v3 `@effect/platform` HTTP** is now `effect/http` (and `effect/http-api`).
- **`HttpApi.make`** lost its API-wide error and service parameters: declare errors on endpoints and attach middleware. **`HttpApiGroup.make`** lost its error and context generics; `add` is variadic. **`HttpApiEndpoint.get(identifier, path, options?)`** replaces tagged templates and fluent schema setters.
- **HttpApiBuilder:** v3 `HttpApiBuilder.api` is `HttpApiBuilder.layer` (provide the group layers; it registers with `HttpRouter`); `middlewareOpenApi` is the `openapiPath` option; `middleware` is `HttpRouter.middleware`; `middlewareCors` is `HttpRouter.cors` or route-scoped `HttpMiddleware.cors` via `HttpRouter.middleware`; `httpApp` is `HttpRouter.toHttpEffect`; `toWebHandler` is `HttpRouter.toWebHandler`; `Router` is the shared `HttpRouter.HttpRouter` service; `buildMiddleware` is gone (declared middleware applies while routes are built).
- **HttpRouter:** `HttpRouter.Default` and `Tag` are gone (one router service); `empty` is `Layer.empty`; `toHttpApp` is `HttpRouter.toHttpEffect`. In `HttpServer.serve` the app is an Effect producing `HttpServerResponse`, not the separate `HttpApp` model.

## Anti-patterns

- **Importing from `effect/unstable/*` paths such as `effect/unstable/http`.** Those paths were removed in `4.0.0-rc.118`.
- **Defining the API in the server package,** which leaks server code into clients.
- **Providing middleware with `Layer.provide` in `HttpApiTest` tests** instead of `Layer.provideMerge`.
- **Putting a `provides` middleware before the `requires` one.**
- **Relying on `.handleRaw` to enforce the content type.**
- **Leaving `withRateLimiter` without `times`** where unlimited `429` retries are not acceptable.

## Prove it

Imports resolve from `effect/http` and `effect/http-api` with no `effect/unstable/*`. Each group is covered by an `HttpApiTest.groups` test that runs both an authorized and an unauthorized request and asserts error `_tag`s with `Effect.flip`. The served `openapiPath` returns a spec listing every endpoint as `group.endpoint`, and the project type-checks with the derived client in use.
