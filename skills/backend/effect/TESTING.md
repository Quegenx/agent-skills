# Testing Effect code

**Contents:** [Install](#install) · [The helpers](#the-helpers) · [Failures and assertions](#failures-and-assertions) · [Shared layers](#shared-layers) · [Mocking services with test layers](#mocking-services-with-test-layers) · [TestClock](#testclock) · [TestConsole and logs in tests](#testconsole-and-logs-in-tests) · [Deterministic randomness](#deterministic-randomness) · [Property tests](#property-tests) · [Flaky tests](#flaky-tests) · [Vitest fixtures](#vitest-fixtures) · [Porting v3 tests](#porting-v3-tests) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Version: effect and @effect/vitest 4.0.5. Both `@effect/vitest` and the `effect/testing` modules are marked unstable.

## Install

- **Install as dev dependencies:** `npm install -D vitest@^5 @effect/vitest`. It requires Vitest 5 (`>=5.0.0 <6.0.0`), which supports Node `^22.12.0 || ^24.0.0 || >=26.0.0` and Vite 6.4+ in majors 6, 7 and 8.
- **Import Vitest's API from `@effect/vitest` or `vitest`:** `@effect/vitest` re-exports Vitest's public API unchanged (`export * from "vitest"`).
- **Import test services from `effect/testing`:** `import { TestClock } from "effect/testing"` (also `TestConsole`, `TestCrypto`, `TestSchema`).

## The helpers

| Helper | What it does |
|---|---|
| `it.effect` | Runs a scoped test with test services such as `TestClock` and `TestConsole`. |
| `it.live` | Runs a scoped test with the live Effect environment. |
| `it.layer` | Shares a `Layer` between multiple tests. |
| `it.prop` | Runs property tests using Effect `Schema` and `Arbitrary` values. |
| `it.flakyTest` | Retries an Effect that might occasionally fail until it succeeds or reaches the configured timeout. |

- **Signature:** `it.effect("test name", () => EffectContainingAssertions, timeout: number | TestOptions = 5_000)`. The callback is `(...args: TestArgs) => Effect<A, E, R>`; for `it.effect` the argument is `V.TestContext & ExtraContext`.
- **Modifiers** on `it.effect` and `it.live`: `skip`, `skipIf(cond)`, `runIf(cond)`, `only`, `each(cases)`, `fails`, `prop`. `skip` and `only` behave as Vitest's.
- **`it.effect` is the default.** It wraps the test in `Effect.scoped` and provides `TestEnv = Layer.mergeAll(TestConsole.layer, TestClock.layer())`, so each test gets a fresh `Scope` that closes when the test finishes, a `TestClock` starting at `0`, and a `TestConsole`.
- **Use `it.live` for real services:** it is `Effect.scoped` only, and sees the real system clock.
- **Timeouts interrupt the fiber:** the runner passes Vitest's `ctx.signal` to `Effect.runPromise`, so a Vitest timeout or cancel interrupts the test fiber, and on abort it waits for finalizers (implementation reading).
- **Failures are logged first:** the runner logs `Cause.prettyErrors(exit.cause)` with `Effect.logError` for each error before rethrowing the exit (implementation reading).

```ts
import { assert, describe, it } from "@effect/vitest"
import { Effect, Fiber, Schema } from "effect"
import { TestClock } from "effect/testing"

describe("@effect/vitest basics", () => {
  it.effect("runs Effect code with assert helpers", () =>
    Effect.gen(function*() {
      const upper = ["ada", "lin"].map((name) => name.toUpperCase())
      assert.deepStrictEqual(upper, ["ADA", "LIN"])
      assert.strictEqual(upper.length, 2)
      assert.isTrue(upper.includes("ADA"))
    }))

  it.effect.each([
    { input: " Ada ", expected: "ada" },
    { input: " Lin ", expected: "lin" },
    { input: " Nia ", expected: "nia" }
  ])("parameterized normalization %#", ({ input, expected }) =>
    Effect.gen(function*() {
      assert.strictEqual(input.trim().toLowerCase(), expected)
    }))

  it.effect("controls time with TestClock", () =>
    Effect.gen(function*() {
      const fiber = yield* Effect.forkChild(
        Effect.sleep(60_000).pipe(Effect.as("done" as const))
      )
      // Move virtual time forward to complete sleeping fibers immediately.
      yield* TestClock.adjust(60_000)
      const value = yield* Fiber.join(fiber)
      assert.strictEqual(value, "done")
    }))

  it.live("uses real runtime services", () =>
    Effect.gen(function*() {
      const startedAt = Date.now()
      yield* Effect.sleep(1)
      assert.isTrue(Date.now() >= startedAt)
    }))
})
```

**Resources inside a test need no extra scope:** the runner already owns one.

```ts
import { it } from "@effect/vitest"
import { Console, Effect } from "effect"

const acquire = Console.log("acquire resource")
const release = Console.log("release resource")
const resource = Effect.acquireRelease(acquire, () => release)

it.effect("run with scope", () =>
  Effect.gen(function*() {
    yield* resource
  }))
```

## Failures and assertions

- **Capture the outcome with `Effect.exit`** and compare the `Exit`: `expect(result).toStrictEqual(Exit.fail("Cannot divide by zero"))`.
- **Assert on the error channel with `Effect.flip`:** `const error = yield* client.users.getById(...).pipe(Effect.flip); assert.strictEqual(error._tag, "UserNotFound")`.
- **Mark a known-broken test with `it.effect.fails(...)`,** "so that when you fix them, you'll know and can re-enable them before it regresses".
- **Use the helpers in `@effect/vitest/utils`:** `fail`, `deepStrictEqual`, `notDeepStrictEqual`, `strictEqual`, `assertEquals` (uses `Equal.equals`), `doesNotThrow`, `assertInstanceOf`, `assertTrue`, `assertFalse`, `assertInclude`, `assertMatch`, `throws`, `throwsAsync`, `assertNone`, `assertDefined`, `assertUndefined`, `assertSome`, `assertSuccess`, `assertFailure`, `assertExitFailure`, `assertExitSuccess`. They are built on Node's `assert`, Vitest instance checks and Effect equality.
- **`addEqualityTesters()`** invokes the Effect Vitest equality-tester registration hook (in 4.0.5 it calls `V.expect.addEqualityTesters([])`).

## Shared layers

`layer(Layer)(name?, (it) => ...)` "creates one shared layer for the block and tears it down in `afterAll`, so all tests inside can access the same service context."

- **Signature:** `layer<R, E>(layer_: Layer<R, E>, options?: { concurrent?: boolean; memoMap?: Layer.MemoMap; timeout?: Duration.Input; excludeTestServices?: boolean })`, returning a function that takes `(f)` or `(name, f)` with `f: (it: Vitest.MethodsNonLive<R>) => void`.
- **Inside the block, `it` has no `live`:** it is `MethodsNonLive`, with `effect`, `prop`, `flakyTest` and a nested `layer`.
- **Test services are merged in** (`TestConsole` and `TestClock`) unless you pass `excludeTestServices: true`.
- **The layer is built once** with a memo map; each test runs `Effect.scoped` against the built context, and a nested `it.layer` forks the memo map (`Layer.forkMemoMapUnsafe`) (implementation reading).
- **Lifecycle:** a named block is a Vitest `describe` that builds in `beforeAll` and closes the scope in `afterAll`; an anonymous block closes its scope after its last test finishes (implementation reading).
- **A failing layer build becomes a defect** (`Effect.orDie`) (implementation reading).
- **State is shared across the block's tests.** A second test sees what the first created: "because the layer is shared between tests ... the count should be 2, not 1". For isolation, provide the layer per test instead: `.pipe(Effect.provide(TodoService.layerTest))` builds it fresh for each test.
- **Concurrency:** "Both `layer` and `it.layer` accept `{ concurrent: false }` to serialize a named shared-layer suite, or `{ concurrent: true }` to run its tests concurrently. Omitting the option inherits suite concurrency; nested named layers can override it. Anonymous layers always inherit the enclosing suite's concurrency, regardless of the option."
- **In concurrent tests use the callback's `ctx.expect`** so snapshots and assertion counts belong to the right test.

```ts
import { assert, layer } from "@effect/vitest"
import { Effect, Layer, Context } from "effect"

class Foo extends Context.Service<Foo, "foo">()("Foo") {
  static layer = Layer.succeed(Foo, "foo")
}

class Bar extends Context.Service<Bar, "bar">()("Bar") {
  static layer = Layer.effect(
    Bar,
    Effect.map(Foo, () => "bar" as const)
  )
}

layer(Foo.layer)("layer", (it) => {
  it.effect("adds context", () =>
    Effect.gen(function*() {
      const foo = yield* Foo
      assert.strictEqual(foo, "foo")
    }))

  it.layer(Bar.layer)("nested", (it) => {
    it.effect("adds context", () =>
      Effect.gen(function*() {
        const foo = yield* Foo
        const bar = yield* Bar
        assert.strictEqual(foo, "foo")
        assert.strictEqual(bar, "bar")
      }))
  })
})
```

## Mocking services with test layers

- **Give each service three layers:** `layerNoDeps` (the implementation without its dependencies), a live `layer` that provides the real dependencies, and `layerTest = layerNoDeps.pipe(Layer.provideMerge(Dep.layerTest))`.
- **Use `Layer.provideMerge`, not `Layer.provide`, for test dependencies,** "so the tests can also access the test repo directly if needed".
- **Hold fake state in its own service around a `Ref`,** which the in-memory fake reads and writes and the test asserts on with `Ref.get(ref)`:

```ts
export class TodoRepoTestRef extends Context.Service<TodoRepoTestRef, Ref.Ref<Array<Todo>>>()("app/TodoRepoTestRef") {
  static readonly layer = Layer.effect(TodoRepoTestRef, Ref.make(Array.empty()))
}

// in TodoRepo:
static readonly layerTest = Layer.effect(TodoRepo, Effect.gen(function*() {
  const store = yield* TodoRepoTestRef
  // ... create / list against the Ref
  return TodoRepo.of({ create, list })
})).pipe(Layer.provideMerge(TodoRepoTestRef.layer))

// in TodoService:
static readonly layerTest = this.layerNoDeps.pipe(
  Layer.provideMerge(TodoRepo.layerTest)
)
```

- **Mock part of a service with `Layer.mock(Service, partialImpl)`** (also curried, `Layer.mock(Service)(impl)`). "Any missing members that are `Effect`s, `Stream`s, `Channel`s, or functions returning them will fail with an unimplemented defect when used." Non-Effect properties stay required (`PartialEffectful<S>`).

```ts
const testUserLayer = Layer.mock(UserService, {
  config: { apiUrl: "https://test-api.com" }, // Required - non-Effect property
  getUser: (id: string) => Effect.succeed({ id, name: "Test User" }) // Mock implementation
  // deleteUser and updateUser are omitted - will throw UnimplementedError if called
})
```

- **Override a default service per effect:** `Clock`, `ConfigProvider`, `Console`, `Random` and `Tracer` are `Context.Reference`s, so `Effect.provideService` replaces them.
- **Simulate configuration:** `ConfigProvider.layer(ConfigProvider.fromUnknown({ LOG_LEVEL: "Warn" }))`.
- **HttpApi handlers:** use the [HTTP-owned typed-client/middleware test recipe](HTTP.md#testing-httpapi).
- **GraphQL clients:** `GraphQLClient.layerTest` (bound as `GitHub.layerTest({...handlers})`) answers each operation by name. "Nothing is encoded or decoded and no middleware runs. An operation without a handler dies with an `UnimplementedError` defect." To test partial data with errors, or the encode and decode path, build the real client over a scripted `GraphQLProtocol` layer.
- **Isolate metrics:** the default `Metric.MetricRegistry` map is shared, so give each test a fresh one: `Effect.provideService(program, Metric.MetricRegistry, new Map())`.
- **Capture spans** with an in-memory tracer; the pattern is in [OBSERVABILITY.md](OBSERVABILITY.md) (Testing spans).

For per-test resources independent of an enclosing runtime, use `Effect.provide(layer, { local: true })`. Other strategies are the implementation's no-dependencies layer with a test dependency (`FileSystem.layerNoop({...})`), replacing the service with `Effect.provideService(Cache, Cache.of({...}))`, or running the live layer. [Existing SERVICES-AND-LAYERS.md, Testing with layers]

## TestClock

"Imagine `TestClock` as a wall clock that only moves forward when we adjust it manually using the `TestClock.adjust` and `TestClock.setTime` functions." Effects scheduled at or before the new time run, in order. It drives `Effect.sleep`, timeouts, schedules, retries and other time-based operators. Time starts at epoch 0.

- **Fork, adjust, then verify:** "fork the effect being tested, adjust the clock time as needed, and then verify that the expected outcomes have occurred." A sleep "semantically blocks until the time is set".
- **API:** `TestClock.adjust(duration: Duration.Input)`, `TestClock.setTime(timestamp: number)`, `TestClock.withLive(effect)` (run with the live Clock), `TestClock.testClockWith(f)`, `TestClock.make(options?)`, `TestClock.layer(options?)`.
- **Read time with `Clock.currentTimeMillis`;** under `it.effect` or `TestClock.layer()` it is virtual time. v3 had `TestClock.currentTimeMillis`; it is removed.
- **Live time inside `it.effect`:** `TestClock.withLive`. A whole live test: `it.live`.
- **Prefer `TestClock.layer` over `TestClock.make` when forked fibers sleep.** Ordered execution of sleeps registered after several scheduler hops "requires fibers running under `layer`" (which `it.effect` uses); "providing a clock from `make` by hand does not install the tracking scheduler".
- **Heed the hang warning.** Option `{ warningDelay?: Duration.Input }`, default `"1 second"`. It logs "A test is using time, but is not advancing the test clock, which may result in the test hanging. Use TestClock.adjust to manually advance the time." and a second warning when a fiber woken by the test clock keeps running without suspending.
- **Recurring effects:** after each recurrence the next one is scheduled; adjusting 60 minutes on an `Effect.delay("60 minutes")` plus `Effect.forever` loop yields exactly one value per adjust.
- **Test observable behaviour, not the queue:** the pending-sleep queue and clock snapshots are private in v4 (v3 `sleeps` and `save` have no replacement). "Test observable behavior by forking sleepers, adjusting time, and joining or asserting the fibers."

```ts
import { Effect, Fiber, Option } from "effect"
import { TestClock } from "effect/testing"
import * as assert from "node:assert"

const test = Effect.gen(function* () {
  const fiber = yield* Effect.sleep("5 minutes").pipe(
    Effect.map(Option.some),
    Effect.timeoutOrElse({
      duration: "1 minute",
      orElse: () => Effect.succeed(Option.none<void>()),
    }),
    Effect.forkChild,
  )
  yield* TestClock.adjust("1 minute")
  const result = yield* Fiber.join(fiber)
  assert.ok(Option.isNone(result))
}).pipe(Effect.provide(TestClock.layer()))
```

## TestConsole and logs in tests

`TestConsole` captures Effect `Console` calls in memory instead of writing to the host console. Read them with `TestConsole.logLines` (`Console.log` arguments) and `TestConsole.errorLines` (`Console.error` arguments); also `TestConsole.layer`, `TestConsole.make`, `TestConsole.testConsoleWith`.

```ts
const program = Effect.gen(function*() {
  yield* Console.log("Hello, World!")
  yield* Console.error("An error occurred")
  const logs = yield* TestConsole.logLines
  const errors = yield* TestConsole.errorLines
  logs // => ["Hello, World!"]
  errors // => ["An error occurred"]
}).pipe(Effect.provide(TestConsole.layer))
```

- **Logs don't print under `it.effect`.** "By default, `it.effect` suppresses log output ... if you want to enable logging during tests, you can use `it.live` or provide a custom logger." The default logger writes through the fiber's `Console`, which `it.effect` replaces with `TestConsole`, so log lines are captured, not lost, and `TestConsole.logLines` can read them (implementation reading).

```ts
it.effect("providing a logger displays a log", () =>
  Effect.gen(function*() {
    yield* Effect.log("it.effect with custom logger") // Log will be displayed
  }).pipe(
    Effect.provide(Logger.layer([Logger.consolePretty()]))
  ))
```

- **Assert on log output:** provide `Logger.layer([Logger.withConsoleLog(stableFormatter)])` plus `TestConsole.layer`, then read `TestConsole.logLines`.
- **Test a custom logger through the runtime.** v3 `Logger.test` is removed: "Exercise the logger through the runtime and capture its output so it receives a real Fiber, cause, level, and date."

## Deterministic randomness

- **`TestCrypto.make(seed)`** (and its layer) gives deterministic random bytes, numbers, shuffles, UUIDs and ULIDs from a seeded PRNG; digests delegate to a platform `Crypto`. It is not for security, the sequence depends on evaluation order, and UUIDv7 and ULID include the current `Clock` time, which you must control separately.
- **`Random.withSeed("myseed")`** installs a deterministic RNG for an effect.

## Property tests

- **Sync or Effect:** `it.prop(name, arbitraries, fn, timeout?)` and `it.effect.prop(...)`. Arbitraries are an array or record of `Schema.Schema<any> | Arbitrary.Arbitrary<any>`; schemas compile through `Arbitrary.schema`.

```ts
it.effect.prop("reversing twice is identity", [Schema.String], ([value]) =>
  Effect.gen(function*() {
    const reversedTwice = value.split("").reverse().reverse().join("")
    assert.strictEqual(reversedTwice, value)
  }))
```

- **What counts as a failure:** "Property tests shrink callbacks that return `false`, throw, or complete with a non-interruption Effect failure. This includes failed assertions, typed failures, and defects. Effect interruption still interrupts the test. Returning normally with any value other than `false`, including `void`, passes for that generated input."
- **Timeouts:** the Vitest `timeout` interrupts the fiber running generation, evaluation and shrinking; finalizers run, and it is reported as a test timeout, not a falsification. "a timeout cannot preempt a synchronous JavaScript callback that does not return."
- **Options:** pass `{ arbitrary: Arbitrary.CheckOptions }` in the timeout argument. v3 called them `samples` (now `{ arbitrary: { runs } }`) and `shrinks` (now `{ arbitrary: { maxShrinks } }`).
- **Property tests cannot request fixtures;** auto fixtures still run.
- **Schema checks:** `TestSchema.Asserts` (from `effect/testing`) groups decoding, encoding, make, arbitrary generation and round-trip checks; methods with the `Effect` suffix use the calling fiber's services, the Promise methods work with any runner.

## Flaky tests

`it.flakyTest(self, timeout?)` retries up to 10 times (`Schedule.recurs(10)`) while elapsed time is within the timeout (default 30 seconds), then dies on exhausted retries.

```ts
it.effect("retrying until success or timeout", () => it.flakyTest(flaky, "5 seconds"))
```

## Vitest fixtures

- **Build the helpers over fixtures with `makeMethods(test.extend(...))`;** tests destructure the fixtures they receive.

```ts
const it = makeMethods(
  test.extend("db", { scope: "file" }, async ({}, { onCleanup }) => {
    const db = await PGlite.create()
    onCleanup(() => db.close())
    return db
  })
)
```

- **Destructure, don't take `(ctx) =>`:** "Vitest reads those names to decide what to set up, and rejects `(ctx) =>` once any fixture is defined" (`FixtureParseError`).
- **`it.effect.each` passes the context after the test case.**
- **Build `makeMethods` from `test` or `test.extend(...)`,** not from the test a `describe` callback receives, or tests in a named `it.layer` can escape their suite and miss hooks and concurrency.
- **`describeWrapped(name, (it) => ...)`** creates a named suite whose callback receives the helpers.

## Porting v3 tests

| v3 | v4 |
|---|---|
| `it.scoped(...)`, `scoped(...)` | `it.effect(...)`, `effect(...)`: "V4 effect tests are scoped and provide the test environment." |
| `it.scopedLive(...)` | `it.live(...)`: "V4 live tests are scoped automatically." |
| `expect`, `Mock`, `should`, `chai.Should` from `@effect/vitest/index` | import from `vitest`; `@effect/vitest/index` is not a valid v4 route |
| `TestServices` `repeats` / `retries` | Vitest `TestOptions.repeats` / `TestOptions.retry`; to retry an Effect inside a test, use `Effect.retry` |
| `TestContext` | `Layer.mergeAll(TestConsole.layer, TestClock.layer())` |
| `TestServices` union | `TestClock.TestClock \| TestConsole.TestConsole`; `it.effect` provides both, `it.live` neither |
| `TestClock.adjustWith` | `Effect.zipWith(effect, TestClock.adjust(duration), (result) => result, { concurrent: true })` |
| `TestLive`, `provideLive`, `liveServices` | `TestClock.withLive` inside `it.effect`, or `it.live` |
| annotations test service | Vitest metadata, a `Ref` or a `Context.Reference`; `FiberSet` for fiber tracking |
| `TestSized` | a custom `Context.Reference<number>` |
| `TestConfig` | removed |

Vitest 5 itself: replace `test.sequential`, `it.sequential`, `describe.sequential` and `{ sequential: true }` with `{ concurrent: false }`; top-level `bench` is gone (use the test-context `bench` fixture); `Assertion<T>` becomes `Assertion<void, T>` or `Assertion<Promise<void>, T>`; mock call history is cleared before each test; async assertions must be awaited.

## Anti-patterns

- **Wrapping the test body in `Effect.scoped`:** "the test runner already manages its scope."
- **Expecting logs to print under `it.effect`:** they go to `TestConsole`. Use `it.live` or provide a logger.
- **Sleeping under `it.effect` without `TestClock.adjust`:** the test hangs; the 1-second warning names it.
- **Providing a hand-made `TestClock.make` clock when forked fibers sleep:** use `TestClock.layer`.
- **Assuming tests in a `layer` block are isolated:** they share the layer's state; provide per test when isolation matters.
- **Reaching into the clock's sleep queue:** test forked fibers and their results.

## Prove it

The suite runs under Vitest 5 with `@effect/vitest`; no test body is wrapped in `Effect.scoped`; every test that sleeps under `it.effect` forks the sleeper, calls `TestClock.adjust` and joins it, and no TestClock hang warning appears in the output; tests that assert on logs read `TestConsole.logLines`; a `layer` block whose tests mutate state either expects the shared state or is replaced by per-test `Effect.provide`.
