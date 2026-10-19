# Platform

In v4 the platform services (FileSystem, Path, Terminal, Stdio, child processes, key-value storage) live inside the `effect` package, written once against service interfaces; a runtime package (`@effect/platform-node`, `-bun`, `-deno`, `-browser`) supplies the layers when the app is assembled. The same package also holds cluster entities, durable workflows and the Atom reactive state used by the `@effect/atom-*` bindings. Beta-era examples import from `effect/unstable/*`; `4.0.0-rc.118` moved those modules to `effect/*` and removed the old paths, so drop the `unstable` segment.

**Contents:** [Packages and versions](#packages-and-versions) · [Runtimes and entrypoints](#runtimes-and-entrypoints) · [FileSystem](#filesystem) · [Path, Terminal, Stdio, errors, file logs](#path-terminal-stdio-errors-file-logs) · [KeyValueStore](#keyvaluestore) · [Child processes](#child-processes) · [Cluster](#cluster) · [Workflows](#workflows) · [Atoms and reactivity](ATOMS-AND-REACTIVITY.md#atoms-and-reactivity) · [Porting from v3](#porting-from-v3) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## Packages and versions

- **All Effect packages share one version and release together:** `effect@4.0.0-beta.0` matches `@effect/sql-pg@4.0.0-beta.0`.
- **Inside `effect`, as subpath exports:** `effect/ai`, `effect/cli`, `effect/cluster`, `effect/devtools`, `effect/encoding`, `effect/eventlog`, `effect/http`, `effect/http-api`, `effect/net`, `effect/observability`, `effect/persistence`, `effect/process`, `effect/reactivity`, `effect/graphql`, `effect/rpc`, `effect/schema`, `effect/socket`, `effect/sql`, `effect/workflow`, `effect/workers`, `effect/testing`. Top-level modules such as `FileSystem`, `Path`, `Terminal`, `Stdio`, `PlatformError` import from `effect`.
- **Still separate packages:** `@effect/platform-*` (runtimes), `@effect/sql-*` (drivers, SQL.md), `@effect/ai-*` (providers, [AI-AND-MCP.md](AI-AND-MCP.md)), `@effect/atom-*` (framework bindings), `@effect/opentelemetry`, `@effect/vitest`.
- **Runtime packages:** `@effect/platform-node` (file system, HTTP client and server, sockets, workers, terminal), `@effect/platform-bun` (the same for Bun), `@effect/platform-deno` (the same for Deno, including HTTP, sockets, cluster transports, multipart and `DenoServices`), `@effect/platform-browser` (HTTP client, workers, key-value storage, IndexedDB, clipboard, geolocation). `@effect/platform-node-shared` is internal to the Node, Bun and Deno packages. Install with `npm install effect @effect/platform-node`.
- **Stability:** the effect.website table marks FileSystem, Path, PlatformLogger, Runtime and Terminal as Stable, but the JSDoc of every module here (and of the platform packages) says `@stability unstable`, `@since 4.0.0`. Treat them as unstable.
- **The v4 docs site covers only** Platform Introduction, FileSystem, Path, PlatformLogger, Runtime and Terminal. For the rest, read the package's `LLMS.md`, `ai-docs/` and source.

## Runtimes and entrypoints

- **Provide one services layer per runtime:**

```ts
NodeRuntime.runMain(program.pipe(Effect.provide(NodeServices.layer)))
BunRuntime.runMain(program.pipe(Effect.provide(BunServices.layer)))
Effect.runSync(program.pipe(Effect.provide(Path.layer)))
```

  Deno: `deno run -RE index.ts` grants Read and Environment permissions.
- **`NodeServices.layer` provides `ChildProcessSpawner | Crypto | FileSystem | Path | Stdio | Terminal`** (it merges `NodeFileSystem`, `NodeCrypto`, `NodePath`, `NodeStdio`, `NodeTerminal` under `NodeChildProcessSpawner`). Add `NodeWorker` separately when needed.
- The [runtime lifecycle contract](RESOURCES-AND-CONFIG.md#entry-points) owns signals, exit codes, error reporting and custom teardown.
- For long-running servers/workers, use the [app-as-layers lifecycle](RESOURCES-AND-CONFIG.md#entry-points).
- **Node modules:** NodeAddressResolver, NodeChildProcessSpawner, NodeClusterHttp, NodeClusterSocket, NodeCrypto, NodeDatagramSocket, NodeDns, NodeFileSystem, NodeHttpClient, NodeHttpIncomingMessage, NodeHttpPlatform, NodeHttpServer, NodeHttpServerRequest, NodeMultipart, NodeMultipartParser, NodePath, NodeRedis, NodeRuntime, NodeServices, NodeSink, NodeSocket, NodeSocketServer, NodeStdio, NodeStream, NodeTerminal, NodeWorker, NodeWorkerRunner, Undici. Bun has the parallel `Bun*` set with `BunServices`; Deno the `Deno*` set with `DenoKeyValueStore` and `DenoServices`.
- **Browser modules:** BrowserCrypto, BrowserHttpClient, BrowserKeyValueStore, BrowserPersistence, BrowserRuntime, BrowserSocket, BrowserStream, BrowserWorker, BrowserWorkerRunner, Clipboard, Geolocation, IndexedDb (with IndexedDbDatabase, IndexedDbQueryBuilder, IndexedDbTable, IndexedDbVersion), Permissions. `BrowserHttpClient.layerXMLHttpRequest` is an XHR client (`CurrentXHRResponseType`, `withXHRArrayBuffer`).
- **`NodeHttpServer.layer(evaluate: LazyArg<Http.Server>, options)`** provides `HttpServer | NodeServices | HttpPlatform | Etag.Generator` (error `ServeError`). `options` extends `Net.ListenOptions` with `disablePreemptiveShutdown?`, `gracefulShutdownTimeout?: Duration.Input` and `websocket?` (ws `ServerOptions`, such as `{ perMessageDeflate: true }`). `layerConfig(evaluate, Config.Wrap<Options>)` reads options from Config. `layerTest` listens on an ephemeral port with a fetch `HttpClient` for integration tests. The server closes during scope finalization, with optional graceful shutdown, and a request fiber is interrupted if the client closes the response early. `BunHttpServer` exports `make`, `layerServer`, `layerHttpServices`, `layer`, `layerTest`, `layerConfig`. HTTP itself is HTTP.md.
- **`NodeHttpClient` transports:** fetch (`Fetch`, `RequestInit`, `layerFetch`), Undici (`layerUndici`, `layerUndiciOptions`, `layerUndiciNoDispatcher`, `Dispatcher`, `layerDispatcher`, `dispatcherLayerGlobal`, `UndiciOptions`) and `node:http`/`node:https` (`layerNodeHttp`, `layerNodeHttpOptions`, `layerNodeHttpNoAgent`, `HttpAgent`, `layerAgent`).

## FileSystem

- **`FileSystem` is the boundary to the host file system;** operations return `Effect`, `Stream` or `Sink` and fail with `PlatformError`:

```ts
import { FileSystem } from "effect"

const fs = yield* FileSystem.FileSystem
const text = yield* fs.readFileString("./index.ts", "utf8")
// Effect<..., PlatformError, FileSystem>
```

  Provide it with `NodeServices.layer` (or `NodeFileSystem.layer`, `BunServices.layer`).
- **Operations:** `access`, `copy` (like `cp -r`; `overwrite`, `preserveTimestamps`), `copyFile`, `chmod`, `chown`, `glob(pattern, { root, exclude })`, `exists`, `link`, `makeDirectory(path, { recursive, mode })`, `makeTempDirectory`, `makeTempDirectoryScoped`, `makeTempFile`, `makeTempFileScoped`, `open(path, { flag, mode, noFollow })`, `readDirectory(path, { recursive })`, `readFile` (Uint8Array), `readFileString(path, encoding?)`, `readLink`, `realPath`, `remove(path, { recursive, force })`, `rename`, `sink(path, { flag, mode })`, `stat`, `stream(path, { bytesToRead, chunkSize, offset })`, `symlink`, `truncate`, `utimes`, `watch(path, { recursive, onReady })`, `writeFile`, `writeFileString`.
- **Scoped resources:** `open` requires a `Scope` and closes the handle when it closes; `makeTempDirectoryScoped` and `makeTempFileScoped` delete on scope close.
- **Defaults and gotchas:**
  - `stream`: `bufferSize` defaults to `4`, `chunkSize` to 64kb.
  - `truncate` without a length truncates to 0.
  - `watch` reports only direct children unless `recursive: true`; constructing the stream alone does not install a watcher (`onReady`).
  - `noFollow` rejects symlinks only at the final path component; Node and Bun support it on POSIX, and Windows and Deno fail with `BadArgument`.
- **`OpenFlag`:** `"r" | "r+" | "w" | "wx" | "w+" | "wx+" | "a" | "ax" | "a+" | "ax+"` with POSIX meanings (`"wx"` is like `"w"` but fails if the file exists). `WatchEvent` is Create, Update or Remove, each with `path`.
- **Test with a no-op file system:**

```ts
Effect.provide(program, FileSystem.layerNoop({
  readFileString: (path) => Effect.succeed("mocked content"),
  exists: () => Effect.succeed(true)
}))
```

  Unimplemented methods fail with a not-found `PlatformError` (`readFile`, for example), except `exists` (succeeds `false`), `remove` (succeeds) and `makeDirectory` / `makeTemp*` (die "not implemented"). Also `FileSystem.makeNoop(partial)`. `FileSystem.make(partial)` derives `exists`, `readFileString`, `stream`, `sink` and `writeFileString` from the core methods.

## Path, Terminal, Stdio, errors, file logs

- **`Path.Path`** (key `"effect/Path"`): `sep`, `basename`, `dirname`, `extname`, `format`, `fromFileUrl` (an Effect, fails with `BadArgument`), `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `resolveWithin(root, input): Option<string>`, `toFileUrl`, `toNamespacedPath`. `Path.layer` is POSIX only; use `NodePath.layer` (via `NodeServices.layer`) where Windows paths matter.
- **`Terminal`** queries dimensions, reads input and displays text: `columns`, `rows`, `readInput: Effect<Queue.Dequeue<UserInput, Cause.Done>, never, Scope>`, `readLine: Effect<string, QuitError>`, `display(text): Effect<void, PlatformError>`. `UserInput` is `{ input: Option<string>, key: Key }` with `Key` `{ name, ctrl, meta, shift }`. `QuitError` means the user quit a prompt (usually ctrl+c); guard with `Terminal.isQuitError`. Example: `yield* terminal.display("a message\n")`, `const input = yield* terminal.readLine`, provided by `NodeTerminal.layer`, error type `Terminal.QuitError | PlatformError`.
- **`Stdio`** puts standard I/O in the environment instead of global process handles: `args`, `stdinIsTerminal`, `stdoutIsTerminal`, `stderrIsTerminal`, stdout and stderr as `Sink`s, `stdin: Stream<Uint8Array, PlatformError>`. Test with `Stdio.layerTest(partial)`.
- **`PlatformError`** (`import type { PlatformError } from "effect/PlatformError"`) records whether the problem was a bad argument or the operating system, with module, method, path, descriptor, description and cause.
- **Log to a file** with `Logger.toFile(path)`, which needs a `FileSystem` and may fail with `PlatformError`; a `batchWindow` duration batches writes:

```ts
Logger.layer([Logger.formatLogFmt.pipe(Logger.toFile("/tmp/log.txt"))]).pipe(
  Layer.provide(NodeFileSystem.layer)
)
// console and file: Logger.layer([Logger.consolePretty(), fileLogger])
```

## KeyValueStore

- **`KeyValueStore` (`effect/persistence`) stores string or binary values by key:** lightweight durable state, browser storage, local files, SQL tables, tests, and a building block for higher-level persistence.
- **Interface:** `get(key): Effect<string | undefined, KeyValueStoreError>`, `getUint8Array`, `set(key, value: string | Uint8Array)`, `remove`, `clear`, `size`, `modify(key, f)` (only if the key exists), `modifyUint8Array`, `has`, `isEmpty`. `KeyValueStoreError` carries `method`, `key?`, `message`, `cause?`.
- **Constructors:** `make(options)` (primitives required; `has`, `isEmpty`, `modify` defaulted), `makeStringOnly` (binary values Base64-encoded on `set`), `prefix(self, "p:")` (a view with a key prefix).
- **Layers:**
  - `layerMemory`: process-local, backed by a `Map`.
  - `layerFileSystem(directory): Layer<KeyValueStore, PlatformError, FileSystem | Path>`: one percent-encoded file per key; empty keys, `.` and `..` are rejected; keys are only distinct on case-sensitive file systems; `clear` deletes the directory recursively, so give it a directory of its own.
  - `layerSql({ table? }): Layer<KeyValueStore, never, SqlClient>`: table defaults to `"effect_key_value_store"` and is created if missing.
  - `layerStorage(() => storage)` for Web Storage.
- **Typed values:** `toSchemaStore(store, schema)` adapts the store with the schema's JSON codec; `get` returns `Option<Type>` and may fail with `Schema.SchemaError`.
- **Browser:** `BrowserKeyValueStore.layerLocalStorage` (small origin-scoped values that survive reloads and restarts), `layerSessionStorage` (tab or page-session state), `layerIndexedDb({ database? })` (default database `"effect_key_value_store"`, needs the `IndexedDb` service). IndexedDB may be unavailable or blocked (browser settings, private browsing, quota, restricted contexts), and the string and `Uint8Array` accessors don't coerce values stored as the other type.
- **Other `effect/persistence` modules:** Persistable, PersistedCache, PersistedQueue, Persistence, RateLimiter, Redis.

## Child processes

- **Define processes with `ChildProcess` and run them through the `ChildProcessSpawner` service** (`effect/process`):

```ts
import { NodeServices } from "@effect/platform-node"
import { ChildProcess, ChildProcessSpawner } from "effect/process"

const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
const version = yield* spawner.string(ChildProcess.make("node", ["--version"]))
const files = yield* spawner.lines(ChildProcess.make("git", ["diff", "--name-only", `${baseRef}...HEAD`]))
```

- **Pipelines:** `ChildProcess.make("git", [...]).pipe(ChildProcess.pipeTo(ChildProcess.make("head", ["-n", "5"])))` runs `git log ... | head -n 5`.
- **Stream a running process:**

```ts
const handle = yield* spawner.spawn(
  ChildProcess.make("pnpm", ["lint-fix"], { env: { FORCE_COLOR: "1" }, extendEnv: true })
)
yield* handle.all.pipe(Stream.decodeText(), Stream.splitLines, Stream.runForEach(...))
const exitCode = yield* handle.exitCode
// compare with ChildProcessSpawner.ExitCode(0)
```

- **`spawner.spawn` adds a `Scope` requirement** for the process lifecycle; wrap with `Effect.scoped` to close it when the effect completes.
- **Provide a spawner:** `Layer.provide(NodeServices.layer)` on the service layer in Node.

## Cluster

- **Model stateful services as entities distributed across machines** (`effect/cluster`). Entity messages are [`Rpc`s](RPC.md#rpc):

```ts
const Increment = Rpc.make("Increment", { payload: { amount: Schema.Int }, success: Schema.Int })
const Counter = Entity.make("Counter", [Increment, GetCount])
```

  Messages are volatile (network only) by default; opt in to persistence with `.annotate(ClusterSchema.Persisted, true)`.
- **Handlers keep in-memory state while the entity is active:**

```ts
Counter.toLayer(Effect.gen(function*() {
  const count = yield* Ref.make(0)
  return Counter.of({
    Increment: ({ payload }) => ...,
    GetCount: () => Ref.get(count).pipe(Rpc.fork)
  })
}), { maxIdleTime: "5 minutes" })
```

  `maxIdleTime` passivates an idle entity, which is recreated on demand. Handlers for one entity run sequentially; `Rpc.fork` opts a handler out.
- **Client:** `const clientFor = yield* Counter.client; const counter = clientFor("counter-123"); yield* counter.Increment({ amount: 1 })`. The cluster picks a shard from the id and routes to the owning runner.
- **Runners:**
  - Production: `NodeClusterSocket.layer().pipe(Layer.provide(SqlClientLayer))` (needs a `SqlClient`); `NodeClusterHttp` and the Bun and Deno equivalents also exist.
  - `SingleRunner.layer`: local, embedded or small single-node setups and dev, keeping the entity runtime model; it still needs SQL because mailbox messages and replies are stored there.
  - `TestRunner.layer`: one process, no network, in-memory storage, always-healthy checks. Use `Layer.provideMerge(ClusterLayerTest)` so tests can reach storage and cluster services.
  - Launch: `Layer.launch(EntitiesLayer.pipe(Layer.provide(ClusterLayer))).pipe(NodeRuntime.runMain)`.
- **More:** `Entity.fromRpcGroup`, `Entity.makeTestClient`, `Entity.keepAlive`; `Singleton.make` runs an effect on the runner owning its shard and interrupts it when ownership moves or the scope closes; `ClusterCron.make` runs one recurring `Cron` job across the cluster.

## Workflows

- **A `Workflow` has a stable tag, payload, success and failure schemas, and an idempotency key** that derives execution ids. It can be executed, discarded, polled, interrupted, resumed and registered with a handler layer: `Workflow.make(tag, { payload, idempotencyKey, success?, error?, suspendedRetrySchedule?, annotations? })` (success defaults to `Schema.Void`, error to `Schema.Never`); handler via `MyWorkflow.toLayer(Effect.fnUntraced(function*() { ... }))`.
- **Activities:** `Activity.make` runs an effect with schemas for durable results. Only completed results are memoized: if the activity suspends on a child workflow or durable clock, its body reruns when the parent replays, so side effects before the suspension can repeat; make them idempotent. Also `Activity.retry` (updates `CurrentAttempt`), `Activity.idempotencyKey` (from execution id and name, plus attempt), `Activity.raceAll`.
- **Compensation:** `Workflow.withCompensation` runs its finalizer if the whole workflow fails; it registers only for top-level effects, not nested activities.
- **Durable waits:** `DurableClock.sleep` ignores zero, runs short sleeps in memory and schedules long ones through the `WorkflowEngine`. `DurableDeferred` is a named wait point whose token lets outside code complete it later.
- **`DurableQueue`:** the workflow calls `DurableQueue.process(queue, payload)` and suspends; `DurableQueue.worker(queue, handler, { concurrency: 5 })` processes. Delivery is at-least-once (a crash between success and acknowledgement redelivers), so handlers must be idempotent. Dead-lettered items leave the workflow parked. Run `PersistedQueue.layerCleanup` in one instance to prune completed items.
- **Engines:** `WorkflowEngine.layerMemory` for tests and local development only (no durability); `ClusterWorkflowEngine` for production, on cluster sharding and message storage.
- **Expose workflows** (each gets execute, discard and resume):

```ts
class MyRpcs extends WorkflowProxy.toRpcGroup(myWorkflows) {}
RpcServer.layer(MyRpcs).pipe(Layer.provide(WorkflowProxyServer.layerRpcHandlers(myWorkflows)))

// or over HttpApi
HttpApi.make("api").add(WorkflowProxy.toHttpApiGroup("workflows", myWorkflows))
WorkflowProxyServer.layerHttpApi(MyApi, "workflows", myWorkflows)
```

## Atoms and reactivity

See [Atom state, hydration, reactivity and React bindings](ATOMS-AND-REACTIVITY.md#atoms-and-reactivity).

## Porting from v3

- **`@effect/platform`** is folded into `effect`: core services in root modules (`effect/FileSystem`, `effect/Path`), HTTP in `effect/http`. `@effect/cluster` and `@effect/workflow` are `effect/cluster` and `effect/workflow`; `@effect/experimental` is split across `effect/*` (devtools, eventlog, persistence, reactivity and more).
- **`NodeContext.layer`** is `NodeServices.layer`.
- **`Command`** is `ChildProcess` in `effect/process/ChildProcess`, directly Effectable to spawn a `ChildProcessHandle`. `Command.env` is `ChildProcess.setEnv`; `Command.feed` is gone (pass a `Stream` as stdin when constructing); `Command.runInShell` is the `shell` option of `ChildProcess.make`; `Command.lines` and `exitCode` are methods on the `ChildProcessSpawner` service. `CommandExecutor` is `ChildProcessSpawner.ChildProcessSpawner`; `Process` is `ChildProcessSpawner.ChildProcessHandle`.
- **`KeyValueStore`** is `effect/persistence/KeyValueStore`: missing values are `undefined`, failures are `KeyValueStoreError`. `layerSchema` is `KeyValueStore.toSchemaStore` (define the `Context.Service` and layer yourself). `NodeKeyValueStore.layerFileSystem` is the platform-neutral `KeyValueStore.layerFileSystem(directory)` with FileSystem and Path from `NodeServices.layer` or `NodeFileSystem.layer` plus `NodePath.layer`.
- **FileSystem option interfaces** such as `CopyOptions` are inline in the v4 service.

## Anti-patterns

- **Importing from `effect/unstable/*`** or `@effect/platform`.
- **Calling a platform service without providing a runtime layer** (`NodeServices.layer`, `BunServices.layer`).
- **`spawner.spawn` without a `Scope`.**
- **Sharing a `KeyValueStore.layerFileSystem` directory with other data;** `clear` deletes it.
- **Non-idempotent side effects in activities or `DurableQueue` handlers.**
- **`WorkflowEngine.layerMemory` or `TestRunner.layer` in production.**

## Prove it

Apply only the checks for the runtime and subsystem changed by the task. The Node example below does not require a browser, Bun or Deno task to add Node services. Atom state uses [its own acceptance](ATOMS-AND-REACTIVITY.md#prove-it). [existing PLATFORM.md, Runtimes and entrypoints, Atoms and reactivity and Prove it; owner verification rule]

For a Node entrypoint, the program runs under `NodeRuntime.runMain` with `NodeServices.layer` and exits `0`, and `1` on a failure; other runtimes use their selected services and lifecycle contract. For file-system work, code passes a test on `FileSystem.layerNoop` with only the methods it uses overridden. For a spawned process, its exit code matches `ChildProcessSpawner.ExitCode(0)`. For cluster entities, use `TestRunner.layer`; for workflows, use `WorkflowEngine.layerMemory` before the production runner and `ClusterWorkflowEngine` are wired.
