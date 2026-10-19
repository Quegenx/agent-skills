# Resources, config and runtimes

**Contents:** [Scope](#scope) · [Acquiring and releasing](#acquiring-and-releasing) · [Resources inside layers](#resources-inside-layers) · [Config](#config) · [ConfigProvider](#configprovider) · [Entry points](#entry-points) · [ManagedRuntime](#managedruntime) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

A resource is acquired once and released no matter how the work ends; Effect ties that release to a scope. Config describes what to read and how to decode it; the runtime decides how the whole program starts and shuts down. Services and layers themselves are in [SERVICES-AND-LAYERS.md](SERVICES-AND-LAYERS.md).

## Scope

- **A scope is a lifetime boundary.** Code registers cleanup effects on it, and closing it runs them with the `Exit` that ended the work. Most application code uses `Effect.scoped` and `Layer` rather than scopes directly.
- **Finalizers run in reverse order of registration,** like stack unwinding; with the `"parallel"` strategy they run concurrently.
- **API:** `Scope.make(strategy?: "sequential" | "parallel")`, `Scope.addFinalizer`, `Scope.addFinalizerExit`, `Scope.close(scope, exit)`, `Scope.fork`, `Scope.use`, `Scope.provide`.
- **`Scope.close` runs finalizers uninterruptibly by default,** so interrupting the closing fiber waits for them to finish.
- **A finalizer added to an already-closed scope runs immediately.**
- **Closing a scope doesn't interrupt a task still running in it:** the task carries on, and any finalizer it registers runs right after registration.
- **Scoped tasks in one workflow share one scope by default.** To close them at different times, create separate scopes with `Scope.make` and `Scope.provide`.
- **v3 renames:** `Scope.extend` is `Scope.provide` (provides a Scope without closing it when the effect completes); `Scope.CloseableScope` is `Scope.Closeable`.

## Acquiring and releasing

- **`Effect.scoped(effect)`** runs with a scope that closes when the effect completes by success, failure or interruption.
- **`Effect.acquireRelease(acquire, release, { interruptible? })`** with `release: (a, exit) => Effect<unknown, never, R2>` returns `Effect<A, E, R | R2 | Scope>`. Once acquisition succeeds, release is guaranteed to run when the scope closes. Acquisition is uninterruptible by default.
- **`Effect.acquireUseRelease(acquire, use, release)`** brackets in one effect. If `release` fails, the whole effect fails even when `use` succeeded.
- **`Effect.acquireDisposable`** uses `Symbol.dispose` / `Symbol.asyncDispose`.
- **`Effect.addFinalizer((exit) => ...)`** registers low-level cleanup in the current scope.
- **Observe the exit:** `Effect.onExit` (cleanup with the Exit, uninterruptible), `Effect.onError` (only on failure, including interruption), `Effect.onInterrupt`.
- **Fibers and scopes:** `Effect.forkScoped` ties a fiber to the current scope, interrupted when it closes; `Effect.forkIn(scope)` ties it to a given scope; `Effect.forkDetach` attaches it to the global scope, so it outlives its parent.
- **Roll back multi-step work** by chaining `acquireRelease` steps whose release checks `Exit.isFailure(exit) ? delete(x) : Effect.void`, wrapped in `Effect.scoped`: a later failure undoes the earlier steps in reverse order.

## Resources inside layers

- **Acquire with `Effect.acquireRelease` inside `Layer.effect`.** The resource is created when the layer is built and closed when the layer is torn down; the layer does not require `Scope`.

```ts
const transporter = yield* Effect.acquireRelease(
  Effect.sync(() =>
    NodeMailer.createTransport({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user, pass: Redacted.value(pass) }
    })
  ),
  (transporter) => Effect.sync(() => transporter.close())
)
```

- **Then provide the dependency locally** so the layer has no requirements left: `static readonly layer = this.layerNoDeps.pipe(Layer.provide(Smtp.layer))`.
- **Order with a scoped `make`:** acquire, use, then finalizers in reverse (`Shutting down` before `Releasing...`).
- **Background work with no service:** `Layer.effectDiscard` plus `Effect.forkScoped`; the fiber is interrupted when the layer scope closes.

```ts
const BackgroundTask = Layer.effectDiscard(Effect.gen(function*() {
  yield* Effect.logInfo("Starting background task...")
  yield* Effect.gen(function*() {
    while (true) {
      yield* Effect.sleep("5 seconds")
      yield* Effect.logInfo("Background task running...")
    }
  }).pipe(
    Effect.onInterrupt(() => Effect.logInfo("Background task interrupted: layer scope closed")),
    Effect.forkScoped
  )
}))

BackgroundTask.pipe(
  Layer.launch,
  NodeRuntime.runMain
)
```

- **Build a layer by hand** with `Layer.build(layer)` (into a scoped `Context`) or `Layer.buildWithScope(layer, scope)` (resources tied to the scope you pass).

## Config

- **A `Config<T>` describes what to read and how to decode it; a `ConfigProvider` reads the raw data.** A Config is also an `Effect<T, ConfigError>`, so `yield*` it.
- **Constructors:** `String`, `NonEmptyString`, `Number`, `Finite`, `Int`, `Boolean` (true/false, yes/no, on/off, 1/0, y/n), `Port` (1 to 65535), `URL`, `Date`, `Duration`, `LogLevel`, `Redacted`, `Literal`, `Literals`, `Array`, `Record`.
- **Structured config:** `Config.schema(Schema.Struct({...}), "path?")`; raw strings decode to their targets (`"8080"` to `8080`).
- **Combinators:** `Config.all` (record, tuple, iterable), `Config.nested(prefix)`, `Config.map`, `Config.mapEffect`, `Config.withDefault`, `Config.option`, `Config.orElse`.
- **`withDefault` and `option` handle only absence;** validation errors and `SourceError` still propagate. `orElse` handles absence and every `ConfigError`.
- **Put `withDefault` on individual children, not on a `Config.all` group:** a group default replaces the whole group when any child is absent, discarding the values that were supplied.
- **There is no public `Config.make`.** Build custom logic from the constructors with `map` / `mapEffect`, or write a `ConfigProvider.make` for a new source.
- **Secrets:** `Config.Redacted` gives a `Redacted<string>` that prints `<redacted>`; read it with `Redacted.value`. `Config.schema(Schema.RedactedFromValue(...))` decodes, then wraps.
- **Errors:** `ConfigError` wraps a `SourceError` or a `SchemaError`; check `error.cause._tag`.

## ConfigProvider

- **`ConfigProvider.ConfigProvider` is a `Context.Reference` defaulting to `fromEnv()`,** which reads `process.env`, merged with `import.meta.env` when available.
- **Env nesting uses `_`:** `DATABASE_HOST` is reachable as `["DATABASE_HOST"]` and as `["DATABASE", "HOST"]`.
- **Providers:** `fromEnv`, `fromUnknown` (plain objects, ideal for tests), `fromDotEnvContents`, `fromDotEnv` (needs `FileSystem`), `fromDir` (needs `Path` and `FileSystem`; for Kubernetes ConfigMap and Secret mounts), `make`. Built-in providers treat empty strings as missing unless `{ preserveEmptyStrings: true }`.
- **Provider combinators:** `orElse` (only on not-found; it does not catch `SourceError`), `nested`, `constantCase` (after `nested`, so the prefix converts too), `mapInput`.
- **Install one:** `ConfigProvider.layer(provider)` replaces the active provider for downstream effects (v3 called it `Layer.setConfigProvider`); it takes a provider or an Effect producing one, evaluated once at build. `ConfigProvider.layerAdd(provider, { asPrimary? })` adds a fallback by default. For a one-off override, `Effect.provideService(ConfigProvider.ConfigProvider, provider)`.
- **Test config** with `ConfigProvider.layer(ConfigProvider.fromUnknown({...}))`, or call `config.parse(provider)` directly.

## Entry points

- **A process: `NodeRuntime.runMain(effect, { disableErrorReporting?, teardown? })`.** It interrupts the fiber on `SIGINT` or `SIGTERM` and calls the teardown to pick the exit code. It is dual. Bun has the same shape (`BunRuntime.runMain(program, { disableErrorReporting: true })`); the browser has `BrowserRuntime.runMain` from `@effect/platform-browser`. Errors log in the pretty format by default. Disable error reporting only if the app already centralizes it.
- **Still use `runMain` in v4.** The core runtime now keeps the Node process alive while fibers are suspended (v3 needed `runMain` for that), but `runMain` still gives signal handling (graceful interrupt of the root fiber), exit codes (`process.exit(code)`) and error reporting.
- **Put teardown logic in the main effect.** `runMain` handles the interrupt and finalizers run; `Effect.runPromise` gives no graceful teardown on CTRL+C.
- **An app made of layers: `NodeRuntime.runMain(Layer.launch(HttpServerLive))`.** `Layer.launch(layer)` builds the layer, keeps it alive until interrupted, then closes its scope and runs every finalizer. It turns the layer into a long-running `Effect<never>`; this suits an HTTP server plus background workers. A worker layer is `Layer.effectDiscard(Effect.gen(... Effect.forkScoped(loop)))`.
- **Exit codes from `Runtime.defaultTeardown`:** `0` on success; `130` for interruption-only failures (a mixed cause takes the squash path); the squashed error's `[Runtime.errorExitCode]` if present; otherwise `1`.
- **Set an error's exit code or silence its report** with the markers, both read from `Cause.squash(cause)`:

```ts
class MyError extends Data.TaggedError("MyError") {
  readonly [Runtime.errorExitCode] = 42
}
// already reported elsewhere: readonly [Runtime.errorReported] = false
```

- **`Runtime.makeRunMain(({ fiber, teardown }) => ...)`** is for platform adapters; most applications use a platform runner.

- The removed `Runtime<R>` migration and context-based runners are defined with [basic runners](CORE.md#running-effects).

### Custom teardown

The platform guide's original teardown example:

```ts
NodeRuntime.runMain(failure, {
  teardown: function customTeardown(exit, onExit) {
    if (exit._tag === "Failure") { onExit(1) } else { onExit(0) }
  }
})
```

## ManagedRuntime

- **Bridge Effect into non-Effect code with one `ManagedRuntime` built from the application layer,** for web handlers, framework hooks, worker queues, legacy callback APIs, and frameworks like React where you don't control the entry point.
- **`ManagedRuntime.make(layer, { memoMap? })`** takes a layer with no requirements (`Layer<R, ER, never>`). The layer is built lazily on first use and its context cached for later runs.
- **Runners:** `runPromise`, `runPromiseExit`, `runSync` (synchronous edges), `runSyncExit`, `runFork`, `runCallback` (callback-only APIs). The same bridge works for Hono, Express, Fastify and Koa.
- **Release with `dispose()` / `disposeEffect`,** or `await using` through `Symbol.asyncDispose`. Disposing closes the runtime's fiber scope, which interrupts and awaits every fiber the runtime started. A disposed runtime cannot be reused, and `isManagedRuntime` doesn't prove it is still usable.
- **Several runtimes share one memo map,** or memoization doesn't work across them.
- **v4 changes:** `ManagedRuntime` no longer extends `Effect`; `runtimeEffect` / `runtime` became `contextEffect` / `context`.

```ts
export const appMemoMap = Layer.makeMemoMapUnsafe()

export const runtime = ManagedRuntime.make(TodoRepo.layer, {
  memoMap: appMemoMap
})

app.get("/todos", async (context) => {
  const todos = await runtime.runPromise(
    TodoRepo.use((repo) => repo.getAll)
  )
  return context.json(todos)
})

const shutdown = () => {
  void runtime.dispose()
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
```

### Service lookup bridge

The core guide uses this service lookup and error-recovery form:

```ts
export const appMemoMap = Layer.makeMemoMapUnsafe()
const runtime = ManagedRuntime.make(TodoRepo.layer, { memoMap: appMemoMap })

// in a handler
await runtime.runPromise(
  TodoRepo.use((repo) => repo.getById(id)).pipe(
    Effect.catchTag("TodoNotFound", () => Effect.succeed(null))
  )
)

process.once("SIGINT", () => void runtime.dispose())
```

## Anti-patterns

- **`Effect.ensuring` to release resources:** its finalizers are low-level; use the `acquireRelease` family.
- **Expecting a closed scope to stop a running task:** it doesn't interrupt it.
- **Ignoring the effect `Scope.closeUnsafe` returns:** finalizers are skipped; run it, uninterruptibly.
- **Assuming `acquireUseRelease` succeeds when `use` did:** a failing `release` fails the whole effect.
- **`Config.withDefault` to catch invalid values,** or a default on a whole `Config.all` group.
- **`ConfigProvider.orElse` to recover from a `SourceError`:** it only handles not-found.
- **`Effect.runPromise` as the main entry point:** no graceful shutdown; use `runMain`.
- **Reusing a disposed `ManagedRuntime`.**

## Prove it

Interrupting the program (CTRL+C under `runMain`, or `dispose()` on a ManagedRuntime) logs every finalizer, in reverse order of acquisition, before the process exits; a failure partway through a rollback chain undoes the earlier steps. Config tests run against `ConfigProvider.fromUnknown` with no environment variables set, and a missing required key fails with a `ConfigError` naming it.
