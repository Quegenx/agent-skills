---
name: effect
description: "Writes Effect v4 TypeScript the way its own guide prescribes: setup so agents read the shipped guide and source, code style (Effect.gen, Effect.fn), errors and Cause, services and layers, resources and Config, concurrency, scheduling, state, caching and batching, streams, Schema, HTTP, SQL, RPC, AI, CLI and the platform packages, testing with @effect/vitest, and logging, tracing and metrics. Use when writing, reviewing or debugging Effect code, adding Effect to a repo, or porting v3 code to v4 APIs."
---

# Effect

Effect ships its own agent guide (`node_modules/effect/AGENTS.md`) and its full source in the installed package; that guide sets the style this skill follows. Everything here targets v4, where every package shares one 4.x version and the HTTP, SQL, RPC, AI and CLI modules live in `effect` itself (`effect/http`, `effect/sql`, ...). Code written from memory of v3 names (`Either`, `catchAll`, `Context.Tag`, `effect/unstable/*`) is the most common source of APIs that don't exist; each file maps the v3 names it replaces.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Installing Effect and pointing agents at the shipped guide and source | [SETUP.md](SETUP.md) |
| The guide's rules: `Effect.gen`, `Effect.fn`, `Effect.fnUntraced`, `return yield*`, services, Schema, Predicate, DateTime | [CODE-STYLE.md](CODE-STYLE.md) |
| The Effect type, constructors, pipe and dual APIs, `Effect.all`, basic runners, Option, Result, Data and equality, Match, Duration, Brand | [CORE.md](CORE.md) |
| Expected errors and defects, tagged errors, the catch family, Cause, Exit | [ERRORS.md](ERRORS.md) |
| Services with `Context.Service`, layers, composition and memoization, `LayerMap`, structuring an app | [SERVICES-AND-LAYERS.md](SERVICES-AND-LAYERS.md) |
| Scope, `acquireRelease` and finalizers, resources in layers, Config and ConfigProvider, entry points, teardown and `ManagedRuntime` | [RESOURCES-AND-CONFIG.md](RESOURCES-AND-CONFIG.md) |
| Fibers and forking, `all`/`forEach` options, interruption, racing, timeouts, FiberSet, FiberMap, FiberHandle | [CONCURRENCY.md](CONCURRENCY.md) |
| Schedule, `retry`, `repeat`, retry recipes, TestClock | [SCHEDULING.md](SCHEDULING.md) |
| Ref, SynchronizedRef, SubscriptionRef, transactions, Deferred, Semaphore, Latch, Queue, PubSub and References | [STATE-AND-COORDINATION.md](STATE-AND-COORDINATION.md) |
| Atom reactive state, async results, lifetime, hydration, HTTP/RPC atoms and React bindings | [ATOMS-AND-REACTIVITY.md](ATOMS-AND-REACTIVITY.md) |
| `Effect.cached`, Cache, ScopedCache, Request and RequestResolver batching | [CACHING-AND-BATCHING.md](CACHING-AND-BATCHING.md) |
| Streams, backpressure, broadcast, Sink, Channel and Pull | [STREAMS.md](STREAMS.md) |
| Defining schemas: structs, optional fields, unions, recursion, filters, brands, v3 name map | [SCHEMA.md](SCHEMA.md) |
| Schema constructors, `Schema.Class`, `TaggedClass`, `TaggedError`, `Schema.Defect` | [SCHEMA-CLASSES.md](SCHEMA-CLASSES.md) |
| Decoding and encoding, `SchemaError`, transformations, formats, codecs, error messages | [SCHEMA-TRANSFORMS.md](SCHEMA-TRANSFORMS.md) |
| Annotations, JSON Schema, representation/optics, Arbitrary generators, Config and form adapters; routes to HTTP/RPC/SQL owners | [SCHEMA-INTEGRATIONS.md](SCHEMA-INTEGRATIONS.md) |
| HttpClient and HttpApi servers: endpoints, errors, middleware, security, the typed client, OpenAPI, tests | [HTTP.md](HTTP.md) |
| SqlClient and drivers, Model, repositories, SqlSchema, transactions, migrations | [SQL.md](SQL.md) |
| RPC contracts, transports, middleware and serialization | [RPC.md](RPC.md) |
| AI LanguageModel, providers, tools, chat and MCP server | [AI-AND-MCP.md](AI-AND-MCP.md) |
| Typed CLI commands, flags and arguments | [CLI.md](CLI.md) |
| Node, Bun, Deno and browser runtimes, FileSystem, Path, Terminal, KeyValueStore, child processes, cluster and workflows | [PLATFORM.md](PLATFORM.md) |
| `@effect/vitest`, shared layer blocks, test layers and `Layer.mock`, TestClock, TestConsole | [TESTING.md](TESTING.md) |
| Logging, tracing with `Effect.fn` and spans, metrics, OTLP export, ErrorReporter, DevTools | [OBSERVABILITY.md](OBSERVABILITY.md) |

## The rules

1. **Read `node_modules/effect/AGENTS.md` completely before writing Effect code,** and search `node_modules/effect/src` for anything it doesn't cover.
2. **Write inline code with `Effect.gen`; reusable functions with `Effect.fn("name")`,** named like the function, and never `.pipe` an `Effect.fn`: pass extra behaviour as extra arguments.
3. **Fail with `return yield*`** inside a generator.
4. **Structure code as services** and wire them with layers.
5. **Model and validate with Schema;** define errors as tagged classes with unique tags, and use `Predicate` helpers and `DateTime` instead of hand-written checks and `Date`.
6. **Recover from typed errors with typed operators;** handle defects only at boundaries.
7. **Run at the edge:** one `run*` close to the entry point, `NodeRuntime.runMain` (or the Bun or browser equivalent) for a process.
8. **Use v4 names and paths,** and confirm any API you're unsure of in the installed source rather than guessing.

## Prove it

The project type-checks; `Effect.fn` functions carry names; no generator fails without `return yield*`; services are provided through layers; tests run under `@effect/vitest`; and every file's own Prove it checks pass for the parts you touched.
