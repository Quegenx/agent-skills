# Effect RPC

Effect v4 package guidance from the shipped `LLMS.md` and `ai-docs/`. These modules remain unstable. The effect.website v4 docs have no pages for these modules. The [setup guide](SETUP.md#v4-module-paths) owns the removed beta/v3 import paths.

## RPC

[Effect v4 package, LLMS.md and ai-docs/]

- **An `Rpc` records tag, payload, success, error and defect schemas, middleware and annotations;** client and server read the same declaration, so the contract doesn't depend on the transport.
- **`Rpc.make(tag, { payload?, success?, error?, defect?, stream?, primaryKey? })`** (unstable). `payload` is a schema or struct fields (fields become a `Schema.Struct`). Defaults: `success: Schema.Void`, `error: Schema.Never`, `defect: Schema.Defect()`. `stream: true` wraps success and error in `RpcSchema.Stream(success, error)` and sets the normal error schema to `Schema.Never`. `primaryKey` makes the payload a `Schema.Class` with a `PrimaryKey` derived from it.
  Example: `Rpc.make("Increment", { payload: { amount: Schema.Int }, success: Schema.Int })`.
- **Handler wrappers:** `Rpc.fork` runs a handler concurrently regardless of the server concurrency setting; `Rpc.uninterruptible` runs it uninterruptibly. `Rpc.custom<...>(schemas => ...)` builds custom constructors (for example a paginated one wrapping `success` in `{ offset, total, results }`).
- **`RpcGroup.make(...rpcs)`** with `add`, `merge`, `omit`, `middleware` (applies to the procedures added so far), `prefix`, `toHandlers`, `toLayer(handlers | Effect<handlers>)`, `of`, `toLayerHandler(tag, handler)`, `accessHandler`, `annotate`.
- **Server:** `RpcServer.layer(group, { disableTracing?, spanPrefix?, spanAttributes?, concurrency?: number | "unbounded", disableFatalDefects? })` starts a server on the current `Protocol`; it requires `Protocol | Rpc.ToHandler | Rpc.Middleware | Rpc.ServicesServer`. `RpcServer.layerHttp` registers a route on `HttpRouter`, websockets by default, HTTP if configured. Protocols: `layerProtocolHttp` (HTTP POST), `layerProtocolWebsocket`, `layerProtocolSocketServer`, `layerProtocolStdio`, `layerProtocolWorkerRunner`; also `toHttpEffect`, `toHttpEffectWebsocket`.
- **Client:** `RpcClient.make(group)` uses the current client `Protocol`. Protocols: `layerProtocolHttp` (over `HttpClient`, to the configured URL, optionally transforming the client), `layerProtocolSocket` (`pingInterval` defaults to 5 seconds, `pingTimeout` to the interval, `retryPolicy` for retries after socket errors), `layerProtocolWorker`. Headers: `RpcClient.withHeaders`, `CurrentHeaders`.
- **RPC over HTTP end to end; both sides must share `RpcSerialization.RpcSerialization`:**

```ts
// server
RpcServer.layerHttp({ group: Rpcs, path: "/rpc", protocol: "http" }).pipe(
  Layer.provide(Handlers),
  Layer.provide(layerSerialization)
)

// client
RpcClient.make(Rpcs).pipe(
  Effect.provide(RpcClient.layerProtocolHttp({ url: "http://test/rpc" }).pipe(
    Layer.provide(layerSerialization),
    Layer.provide(HttpClientLayer) // any HttpClient layer
  ))
)
```

- **Serialization:** `json`, `ndjson`, `jsonRpc`, `ndJsonRpc`, SchemaBinary; layers `layerJson`, `layerNdjson`, `layerNdjsonWith`, `layerJsonRpc`, `layerNdJsonRpc`, `layerSchemaBinary`; error `MaxBufferSizeExceeded`. There is no MessagePack serializer; a beta recap mentions `makeMsgPack`, but it was removed.
- **Middleware:** `RpcMiddleware.Service` creates a typed middleware class with optional requirements, provided services, error schema and client-side requirement metadata; `RpcMiddleware.layerClient` provides the client side.
- **Test without transport:** `RpcTest.makeClient(group)` connects a client straight to the group's handlers, with no HTTP, socket, worker or serializer.
- **Workers:** `RpcWorker.InitialMessage` / `layerInitialMessage` send one schema-encoded value before normal requests. Transports `NodeSocket`, `NodeSocketServer`, `NodeWorker`, `NodeWorkerRunner` (and Bun and browser equivalents) live in the platform packages.
- **Entities and workflows build on `Rpc`** (PLATFORM.md).

### Schema codec and cluster persistence

The `RpcSerialization` service exposes `codecFor: <S>(schema: S) => Schema.Codec<S["Type"], unknown, ...>`; JSON serializers use `Schema.toCodecJson`, so the encoded side is JSON. Cluster messages use the same Rpc definitions and opt into persistence with `.annotate(ClusterSchema.Persisted, true)`. [Existing SCHEMA-INTEGRATIONS.md, RPC]

## Porting from v3

[Effect v4 package, LLMS.md and ai-docs/]

- **RPC:** `RpcServer.layerHttpRouter` is `RpcServer.layerHttp` (an HTTP or WebSocket route on the v4 `HttpRouter`); `toHttpApp` is `toHttpEffect`; `RpcServer.toWebHandler` is gone, use `HttpRouter.toWebHandler(RpcServer.layerHttp(options).pipe(Layer.provide(options.layer)))`; `RpcServer.fiberIdClientInterrupt` is `RpcSchema.ClientAbort` (a Cause annotation); MessagePack serialization is gone, use `layerSchemaBinary` or `layerNdjson`.

## Anti-patterns

[Effect v4 package, LLMS.md and ai-docs/]

- **Giving client and server different `RpcSerialization` layers.**

## Prove it

[Effect v4 package, LLMS.md and ai-docs/]

RPC: an `RpcTest.makeClient(group)` test calls every procedure, and the HTTP setup round-trips with one shared serialization layer.
