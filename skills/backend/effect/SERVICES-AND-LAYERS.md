# Services and layers

**Contents:** [Defining a service](#defining-a-service) · [Service methods](#service-methods) · [Accessing a service](#accessing-a-service) · [Services with defaults](#services-with-defaults-contextreference) · [Layers](#layers) · [Composition](#composition) · [Layers chosen at build time](#layers-chosen-at-build-time) · [Layer errors and tracing](#layer-errors-and-tracing) · [Memoization and sharing](#memoization-and-sharing) · [Providing services to effects](#providing-services-to-effects) · [Keyed resources: LayerMap](#keyed-resources-layermap) · [Testing with layers](#testing-with-layers) · [Structuring an application](#structuring-an-application) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Effect services are the most common way to structure Effect code: they encapsulate behaviour so code stays modular, testable and maintainable. A service is a key plus a shape; a layer is the constructor that builds it, with its own dependencies, errors and resources. Scopes, finalizers, Config and runtimes are in [RESOURCES-AND-CONFIG.md](RESOURCES-AND-CONFIG.md).

## Defining a service

- **Use `Context.Service`, the one way in v4.** It replaces v3's `Context.Tag`, `Context.GenericTag`, `Effect.Tag` and `Effect.Service`. Early v4 betas called the module `ServiceMap` (`ServiceMap.Service`); it was renamed back to `Context`.
- **Class form:** `class X extends Context.Service<Self, Shape>()("id") {}`. **Function form:** `const X = Context.Service<Shape>("id")`. Type parameters come first and the id goes to the returned constructor; v3 passed the id to `Context.Tag(id)` before the type parameters.
- **Name the id after the package and path** of the service file, such as `"myapp/db/Database"`. The string is the runtime identity: two keys with the same string are the same service, which preserves instances across live reloads and unpredictable bundlers, and also means unrelated services reusing a string occupy the same slot in a `Context`.
- **The class is the key.** Yielding it in `Effect.gen` retrieves the service from the current fiber context.
- **Members:** `of(impl)` (only a helper for type inference; a plain object works too), `context(impl)` (a one-service Context), `use(f)`, `useSync(f)`.
- **Get the service type** with `Database["Service"]` or `Context.Service.Shape<typeof Random>`.
- **Attach layers as static fields** on the class.

```ts
// file: src/db/Database.ts
import { Context, Effect, Layer, Schema } from "effect"

export class Database extends Context.Service<Database, {
  query(sql: string): Effect.Effect<Array<unknown>, DatabaseError>
}>()(
  "myapp/db/Database"
) {
  static readonly layer = Layer.effect(
    Database,
    Effect.gen(function*() {
      const query = Effect.fn("Database.query")(function*(sql: string) {
        yield* Effect.log("Executing SQL query:", sql)
        return [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
      })

      return Database.of({
        query
      })
    })
  )
}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  cause: Schema.Defect()
}) {}

export type DatabaseService = Database["Service"]
```

### The `make` option (v3 called it `Effect.Service`)

- **`Context.Service<Self>()("id", { make })` stores the constructor effect on the class as `make` but generates no layer.** Build it yourself with `Layer.effect(this, this.make)`.
- **`make` is any Effect:** `Effect.succeed` (static), `Effect.sync` (synchronous), `Effect.gen` (effectful), or scoped with `Effect.acquireRelease` or `Effect.addFinalizer` inside it (there is no separate scoped option). It may also be a function `(...args) => Effect`.
- **v3's `dependencies` option is gone;** wire dependencies with `Layer.provide`.

```ts
class Cache extends Context.Service<Cache>()("app/Cache", {
  make: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const lookup = (key: string) => fs.readFileString(`cache/${key}`)
    return { lookup } as const
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(NodeFileSystem.layer),
  )
  static readonly layerWithoutDependencies = Layer.effect(this, this.make)
}
```

### Naming layers

- **Name the primary layer `layer`** (v3 used `Default` or `Live`), with suffixes for variants: `layerTest`, `layerConfig`, and `layerNoDeps` for the layer with no dependencies wired. The names are a convention, not part of the API.
- Some v4 docs pages still recommend a `Live` suffix and use `static Live`; the migration guide's `layer` convention is the newer statement.

## Service methods

- **Define methods with `Effect.fn("Service.method")`,** which creates a tracing span. Use `Effect.fnUntraced` when tracing isn't needed, particularly in library code and hot paths. Don't write functions that only wrap and return `Effect.gen`.
- **Keep the `Requirements` parameter of every service operation `never`.** Resolve dependencies when the layer constructs the service, not in method signatures (see Anti-patterns).

## Accessing a service

- **Prefer `yield* Service`.** `Service.use((s) => effect)` returns `Effect<A, E, R | Identifier>` and `Service.useSync((s) => value)` returns `Effect<A, never, Identifier>`, but `use` hides the dependency at the call site and makes it easy to leak service dependencies into return values.
- **v3's static accessors (`Effect.Tag`'s `Notifications.notify("hello")`) are removed.** They were mapped types over the shape and erased generic type parameters and overloads.
- **`Effect.service(key)`** accesses a service; **`Effect.serviceOption(key)`** returns an `Option` and does not add the service to the requirements.

## Services with defaults: `Context.Reference`

- **`Context.Reference<T>("id", { defaultValue: () => value })`** is for configuration values, feature flags and any service that has a default. The default is computed lazily, cached on the reference, and overridden by providing a value.
- **v3's `class X extends Context.Reference<X>()(id, opts)` becomes `const X = Context.Reference<T>(id, opts)`;** the identifier type parameter was removed.
- **`FiberRef` is removed; fiber-local state is a `Context.Reference`.** Built-ins live in `References` (`References.CurrentLogLevel`, `References.MinimumLogLevel`, `References.Scheduler`, `References.TracerEnabled`, ...). Read them with `yield*`; scope a value with `Effect.provideService` (v3 called it `Effect.locally`).
- **Default services need no provision:** `Clock.Clock`, `ConfigProvider.ConfigProvider`, `Console.Console`, `Random.Random`, `Tracer.Tracer` are References. Override with `Effect.provideService`, which applies only to the effect provided.
- **`Effect.updateServiceScoped`** updates a service for the current scope and restores the previous value when the scope closes.

## Layers

`Layer<ROut, E, RIn>`: `ROut` the services provided, `E` the construction errors, `RIn` the services required. Layers build services, so dependencies are handled at construction rather than in the service interface. Extract the parts with `Layer.Success<T>`, `Layer.Error<T>`, `Layer.Services<T>` (v3 called the last `Layer.Layer.Context`).

| Constructor | Use |
|---|---|
| `Layer.succeed(key, impl)` / `Layer.succeed(key)(impl)` | an already-built value |
| `Layer.sync(key, () => impl)` | a lazy synchronous value |
| `Layer.succeedContext(ctx)` / `Layer.syncContext` | several services from a Context |
| `Layer.effect(key, effect)` | effectful, dependent or scoped construction |
| `Layer.effectContext(effect)` | several services built effectfully |
| `Layer.effectDiscard(effect)` | run an effect, provide no services |
| `Layer.empty` | a no-op branch when composing conditionally |
| `Layer.suspend(() => layer)` | choose a layer lazily on first build; memoized normally |
| `Layer.unwrap(effect)` | an Effect that produces a Layer, such as one chosen from Config |
| `Layer.mock(key, partial)` | a test layer from a partial implementation |

- **`Layer.effect(key, effect: Effect<S, E, R>): Layer<I, E, Exclude<R, Scope.Scope>>`.** The effect runs in the layer's scope, so resources acquired in it are released when the layer is torn down, and the layer does not require `Scope`.
- **v3's `Layer.scoped`, `Layer.scopedContext`, `Layer.scopedDiscard` merged into `Layer.effect`, `Layer.effectContext`, `Layer.effectDiscard`;** `Layer.unwrapEffect` and `Layer.unwrapScoped` merged into `Layer.unwrap`.
- **Other v3 renames:** `catchAll` to `catch`, `catchAllCause` to `catchCause`, `tapErrorCause` to `tapCause`, `ensure*Type` to `satisfies*Type`, `setConfigProvider` to `ConfigProvider.layer`, `Layer.service` to `Layer.effect(key, key)`, `Layer.fail` to `Layer.unwrap(Effect.fail(error))`, `Layer.retry` to `Effect.retry` on the acquisition effect, `Layer.toRuntime` to `Layer.build` then `Effect.run*With` or `ManagedRuntime.make`. `Layer.memoize`, `Layer.map` and `Layer.zipWith` are gone.
- **`Layer.setClock`, `setRandom`, `setTracer`, `setScheduler` become `Layer.succeed(Clock.Clock, clock)` and so on,** since those are now References.

## Composition

- **Build focused service layers, then compose them with `Layer.provide` and `Layer.provideMerge`** by what you want to expose.
- **`Layer.merge(a, b)` / `Layer.mergeAll(...layers)`** combine independent layers: inputs, errors and outputs union, and all of them build concurrently.
- **`Layer.provide(dep)`** builds `dep` first, feeds its outputs into this layer's requirements, and exposes only this layer's services: use it to hide an implementation dependency from callers. It also takes an array of layers.
- **`Layer.provideMerge(dep)`** does the same but exposes both sets of services. Prefer `provide` when the dependency should stay private.
- **Sequence and observe** with `Layer.flatMap`, `Layer.tap`, `Layer.tapError`, `Layer.tapCause`, `Layer.updateService`; `tap` callbacks don't change the output.

```ts
export class UserRepository extends Context.Service<UserRepository, {
  findById(id: string): Effect.Effect<
    Option.Option<{ readonly id: string; readonly name: string }>,
    UserRespositoryError
  >
}>()("myapp/UserRepository") {
  static readonly layerNoDeps: Layer.Layer<UserRepository, never, SqlClient.SqlClient> =
    Layer.effect(UserRepository, Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient
      // ... define findById with Effect.fn, using sql
      return UserRepository.of({ findById })
    }))

  // exposes only UserRepository
  static readonly layer: Layer.Layer<UserRepository, Config.ConfigError | SqlError.SqlError> =
    this.layerNoDeps.pipe(Layer.provide(SqlClientLayer))

  // exposes UserRepository and SqlClient
  static readonly layerWithSqlClient: Layer.Layer<
    UserRepository | SqlClient.SqlClient,
    Config.ConfigError | SqlError.SqlError
  > = this.layerNoDeps.pipe(Layer.provideMerge(SqlClientLayer))
}
```

## Layers chosen at build time

- **Read Config inside an Effect and return the concrete layer with `Layer.unwrap`.** `unwrap(self: Effect<Layer<A, E1, R1>, E, R>): Layer<A, E | E1, R1 | Exclude<R, Scope>>`: the errors and requirements of both levels combine.

```ts
static readonly layer = Layer.unwrap(
  Effect.gen(function*() {
    const useInMemory = yield* Config.Boolean("MESSAGE_STORE_IN_MEMORY").pipe(
      Config.withDefault(false)
    )
    if (useInMemory) {
      return MessageStore.layerInMemory
    }
    const remoteUrl = yield* Config.URL("MESSAGE_STORE_URL")
    return MessageStore.layerRemote(remoteUrl)
  })
)
```

- **Config can also be read directly inside `Layer.effect`** (`yield* Config.String("SMTP_USER")`). Driver layers ship config variants, such as `PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") })`.

## Layer errors and tracing

- **`Layer.catch`** recovers all typed errors by switching to another layer, such as falling back to an in-memory database when Postgres config fails: `postgresDatabaseLayer.pipe(Layer.catch(() => inMemoryDatabaseLayer))`. **`Layer.catchTag`** handles specific tags; **`Layer.catchCause`** sees the full Cause. Finalizers for resources the failed layer acquired still run before the fallback is acquired.
- **`Layer.orDie`** turns construction failures into defects; use it only when they really are unrecoverable.
- **A missing env var in a layer** surfaces as `(Missing data at HOST: "Expected HOST to exist in the process context")`.
- **`Layer.withSpan(name)` / `Layer.span`** put layer construction in a named span that ends when the layer scope closes; `Layer.parentSpan` and `Layer.withParentSpan` attach to an existing span without ending it.

## Memoization and sharing

- **Layers are shared by default.** Provided globally, each layer in the graph is built once and shared by everything that depends on it: in `Layer.merge(Layer.provide(L2, L1), Layer.provide(L3, L1))`, `L1` is allocated once.
- **Memoization is by reference equality.** If a layer comes from a function call `f()`, call `f` once and reuse the result. Reuse one named layer value when services must share a resource, such as one database pool.
- **Nested `Effect.provide` reuses what an enclosing provide or runtime already built** (in v3 every `Effect.provide` had its own memo scope and built it again). Each call forks the ambient `MemoMap`: it can read parent entries but doesn't write new builds back, so **sibling `Effect.provide` calls build their own copies**.
- **Compose layers before providing.** Reuse of enclosing builds is not a substitute for composition and doesn't deduplicate independent siblings.
- **Opt out deliberately:** `Layer.fresh(layer)` always builds with a fresh memo map, for when two parts of the app need separate instances (two independent client sessions), not to work around confusing composition. `Effect.provide(layer, { local: true })` (new in v4) builds the whole subtree with a local memo map, for when each test needs independent resources.
- **Manual memoization:** `Layer.makeMemoMap`, `Layer.buildWithMemoMap(layer, memoMap, scope)` (building the same layer twice against one map reuses the first result), `Layer.forkMemoMap` / `forkMemoMapUnsafe` for child maps that see parent entries without writing back. `Layer.CurrentMemoMap` is the service holding the current map.

## Providing services to effects

- **`Effect.provide(effect, layer | [layers] | context, { local? })`** provides for one region; the configuration reverts after it (for example, a `Logger.layer([...])` override for one nested block).
- **`Effect.provideService(effect, key, impl)`** satisfies one requirement with a built value; **`Effect.provideServiceEffect`** acquires it effectfully and keeps the acquisition errors.
- **`Effect.provideContext(ctx)`** provides several services; **`Effect.setContext`** replaces the whole context, and services from an outer context are not inherited.
- **A program missing a service fails type-checking** where it is run.
- **Build contexts** with `Context.make`, `Context.add`, `Context.merge` (later wins), `Context.pick`, `Context.omit`, and read them with `Context.get`, `Context.getOption`. `Context.makeUnsafe` keeps the map without copying, so it must not be mutated after construction.

## Keyed resources: LayerMap

- **`LayerMap.Service<Self>()("id", { lookup | layers, idleTimeToLive, dependencies?, preloadKeys? })`** builds one layer per key on demand, for tenant clients or regional connections. It exposes `.get(key)` (a Layer), `.invalidate(key)`, `.layer` and `.layerNoDeps`.
- **The first `PoolMap.get("acme")` builds the pool;** later calls reuse it until it is idle too long or invalidated.
- **Preloaded entries are kept only for their idle TTL;** keys whose idle TTL is zero (including when none is set) are not preloaded.

## Testing with layers

See [test scopes, shared layers and service fakes](TESTING.md#mocking-services-with-test-layers).

## Structuring an application

- **One service per file,** its layers as static fields (`layer`, `layerNoDeps`, `layerTest`), its id naming the package and path.
- **Expose `layerNoDeps` for tests and composition, and `layer` with dependencies wired by `Layer.provide`,** so callers see no requirements. Use `provideMerge` only when callers (often tests) need the dependency too.
- **Compose the graph once and provide it once at the edge;** don't rely on several nested provides.
- **Keep each layer a single named constant** so reference memoization works; never call a layer factory twice for a shared resource.
- **Long-running apps:** model servers and workers as layers and run them with `Layer.launch` and `runMain`. **Inside a non-Effect host:** one `ManagedRuntime` from the app layer. Both are in RESOURCES-AND-CONFIG.md.
- **Per-tenant or keyed resources:** `LayerMap.Service` with `idleTimeToLive`.
- **No point-free calls:** write `Effect.map((x) => fn(x))`, not `Effect.map(fn)`; tacit calls can erase generics on overloaded functions and hurt inference and stack traces.

## Anti-patterns

- **Requirements in a service method's type.** `readonly query: (sql: string) => Effect.Effect<unknown, never, Config | Logger>` leaks implementation details into the interface, makes `Database` aware of its dependencies, and makes it hard to mock. Resolve them in the layer.
- **Reusing an id string** for unrelated services: they share one slot.
- **`Service.use` everywhere:** it hides dependencies; prefer `yield*`.
- **Calling a layer factory twice,** or providing the same layer in sibling `Effect.provide` calls: two instances.
- **`Layer.fresh` as a fix for confusing composition.**
- **`Effect.scoped` around an `it.effect` body.**

## Prove it

The program type-checks with every requirement satisfied at the single edge where layers are provided. Each service has an id naming its package and path, method signatures with `never` requirements, and `layer` typed with no requirements. A shared resource (a pool) is built once: its acquisition log or span appears once per run, not once per dependent or per `Effect.provide`. Each `layerTest` lets an `it.effect` test run without live dependencies.
