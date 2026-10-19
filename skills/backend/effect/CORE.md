# Core

**Contents:** [The Effect type](#the-effect-type) · [Creating effects](#creating-effects) · [pipe and dual APIs](#pipe-and-dual-apis) · [Sequencing and combining](#sequencing-and-combining) · [Running effects](#running-effects) · [Entry points](#entry-points) · [ManagedRuntime](#managedruntime) · [Option and Result](#option-and-result) · [Data](#data) · [Match](#match) · [Duration](#duration) · [Brand](#brand) · [Stability](#stability) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Effect 4.x is the target. `Effect.gen` and `Effect.fn` are in CODE-STYLE.md; errors, `Cause` and `Exit` are in ERRORS.md.

## The Effect type

`Effect<A, E, R>` can succeed with an `A`, fail with an `E`, and require services `R`. Creating an effect does not perform the work: it builds a value that can be composed, provided with services, retried, interrupted, run concurrently or inspected by the runtime.

- **Signature:** `interface Effect<out A, out E = never, out R = never> extends Pipeable, Inspectable`. It is iterable (`[Symbol.iterator](): EffectIterator<...>`), which is what makes `yield*` work.
- **Lazy and immutable:** every function in the library produces a new `Effect` value. Running it needs a runtime, ideally at a single entry point. Effect runs on fibers, with scheduling, fine-grained interruption and structured concurrency built in.
- **Reading the channels:** a success of `void` carries no useful information and `never` means it runs forever; an error of `never` means it cannot fail; requirements of `never` means it needs nothing and its `Context` is empty.
- **Mental model:** roughly `(context: Context<R>) => E | A`, though effects are not actually functions.
- **Extract the parameters** with `Effect.Success<T>`, `Effect.Error<T>` and `Effect.Services<T>` (a non-Effect input resolves to `never`).
- **Check types without changing behaviour:** `Effect.satisfiesErrorType<E>()`, `satisfiesSuccessType`, `satisfiesServicesType` are compile-time only.

## Creating effects

| Constructor | Gives | Note |
|---|---|---|
| `Effect.succeed(value)` | `Effect<A>` | Also `succeedNone`, `succeedSome`, and the constants `Effect.void`, `Effect.undefined` |
| `Effect.fail(error)` | `Effect<never, E>` | A recoverable, typed error. `failSync(() => e)` builds the error each time the effect runs; `failCause` and `failCauseSync` take a whole `Cause` |
| `Effect.die(defect)` | `Effect<never>` | A defect: a critical, unexpected error, not in the error channel |
| `Effect.sync(() => a)` | `Effect<A>` | The function must not throw; a throw becomes a defect |
| `Effect.try(() => a)` | `Effect<A, Cause.UnknownError>` | `Effect.try({ try, catch })` gives `Effect<A, E>` |
| `Effect.promise((signal) => p)` | `Effect<A>` | The promise must not reject; a rejection becomes a defect |
| `Effect.tryPromise((signal) => p)` | `Effect<A, UnknownError>` | `{ try, catch }` gives `Effect<A, E>` |
| `Effect.callback(register)` | `Effect<A, E, R>` | Wraps a callback API |
| `Effect.suspend(() => effect)` | the inner effect | Delays construction |
| `Effect.fromNullishOr(value)` | `Effect<NonNullable<A>, Cause.NoSuchElementError>` | |
| `Effect.fromOption(option, onNone?)` | `Effect<A, NoSuchElementError>` or the `onNone` error | `onNone` runs per execution; if it throws, the effect dies |
| `Effect.fromResult(result)` | `Effect<A, E>` | |

- **Use `try` when throwing is expected,** not `sync`. Same for promises: `tryPromise`, not `promise`.
- **The `catch` of `try` and `tryPromise` returns the error, never throws it.** A throw inside `catch` is a defect.
- **Interruption aborts the `AbortSignal`** passed to `promise`, but the underlying operation only stops if it observes that signal.
- **`callback`:** the signature is `callback<A, E = never, R = never>(register: (this: Scheduler, resume, signal: AbortSignal) => void | Effect<void, never, R>)`. Annotate the type parameters, because TypeScript cannot infer them from the body. Call `resume` once; later calls are ignored. Return an optional cleanup effect to run if the fiber is interrupted.
- **`suspend` for:** lazy side effects (an `Effect.succeed(i++)` is evaluated once, at construction), recursion (to avoid a stack or heap blowup), and unifying return types when branches build different effects.
- **Why not throw:** a function's type signature doesn't say it can throw; `Effect.fail` puts the error in the type.

From the guide's examples:

```ts
Effect.fn("parsePayload")((input) =>
  Effect.try({ try: () => JSON.parse(input), catch: (cause) => new InvalidPayload({ input, cause }) })
)
// InvalidPayload declares cause: Schema.Defect()

Effect.fromNullishOr(map.get(k)).pipe(Effect.mapError(() => new MissingWorkspaceId()))
```

## pipe and dual APIs

- **`pipe(a, ab, bc, ...)`** runs left to right. Each function after the first value must accept a single argument.
- **`flow(ab, bc, ...)`:** the first function may have any arity; every following one must be unary.
- **The `.pipe(f, g, h)` method** (`Pipeable`) is on every effect and many data types, so you rarely import `pipe`. `Pipeable.Class` is a base constructor for your own pipeable classes.
- **Functions instead of methods** keep the library tree-shakable and let you add "extension methods" as plain functions.
- **Dual APIs** take either style with the same result: data-last `pipe(effect, Effect.map(f))`, or data-first `Effect.map(effect, f)`, which reads well for a single operation.
- **Write your own with `dual(arity | predicate, body)`.** Arity is the common case; use a predicate when optional arguments make arity ambiguous.

```ts
const sum: {
  (that: number): (self: number) => number
  (self: number, that: number): number
} = Function.dual(2, (self: number, that: number): number => self + that)
```

## Sequencing and combining

- **`map`** transforms the value; **`flatMap`** continues with an Effect; **`andThen`** takes an Effect (discarding the first value) or a function returning one; **`tap`** runs a side effect and keeps the value (if the side effect fails, the chain fails). Also `as`, `asVoid`, `flip`.
- **Every effect in a `flatMap` must contribute to the result.** An `Effect.sync` you create and don't chain never runs.
- **`Effect.all(arg, { concurrency?, discard?, mode? })`** takes a tuple, iterable or record and returns the same shape. Sequential by default; fails on the first failure. When concurrent, effects already started may be interrupted and ones not yet started are skipped. `mode: "result"` collects a `Result` per element; `discard: true` returns void.
- **`Effect.forEach(iterable, (a, i) => effect, { concurrency?, discard? })`** is sequential by default and short-circuits. `zip` and `zipWith` take `{ concurrent: true }`.
- **Do notation** exists: `Effect.Do`, `bind`, `bindTo`, `let`.

## Running effects

Keep the logic in effects and run them at the program's edge: an app ideally makes a single call to its main effect.

| Runner | Returns | On failure |
|---|---|---|
| `Effect.runPromise(effect, options?)` | `Promise<A>` | Rejects |
| `Effect.runPromiseExit` | `Promise<Exit<A, E>>` | Resolves with the `Exit` |
| `Effect.runFork(effect, options?)` | `Fiber<A, E>` | Runs in the background; stop it with `Effect.runFork(Fiber.interrupt(fiber))` |
| `Effect.runCallback(effect, { onExit })` | an interruptor `(interruptor?: number) => void` | Reports through `onExit` |
| `Effect.runSync(effect)` | `A` | Throws the squashed cause; typed errors are thrown directly, including non-`Error` values. Async work throws `Cause.AsyncFiberError` |
| `Effect.runSyncExit` | `Exit<A, E>` | Async work gives an `Exit.Failure` with a `Die` ("An asynchronous Effect was executed with Effect.runSync") |

- **Default to `runPromise` or `runFork`;** `runFork` unless you specifically need a `Promise` or a synchronous result. Use `runSync` only when necessary: there is no built-in way to know in advance whether an effect runs synchronously.
- **`RunOptions`:** `{ signal?: AbortSignal; scheduler?; uninterruptible?; onFiberStart? }`. The `signal` interrupts the fiber.
- **The runners need `R = never`.** For an effect with requirements and a `Context<R>` you already hold, use `Effect.runPromiseWith(context)(effect)`, `runForkWith`, `runSyncWith` and the `*Exit*With` variants.
- **v4 removed `Runtime<R>`:** use `Context<R>`; the run functions live on `Effect`. v3's `Runtime.runFork(runtime)` is now `Effect.runForkWith(services)`, with the services from `yield* Effect.context<R>()`. The `Runtime` module now holds only `Teardown`, `defaultTeardown`, `makeRunMain` and the `errorExitCode` and `errorReported` markers.
- **Scope configuration locally:** `Effect.provide(layer)` on a sub-effect overrides configuration (a `Logger`, say) only for that region.

## Entry points

See [process entry points, teardown and exit codes](RESOURCES-AND-CONFIG.md#entry-points).

## ManagedRuntime

See [ManagedRuntime construction, sharing and disposal](RESOURCES-AND-CONFIG.md#managedruntime).

## Option and Result

**v4 has no `Either` module: `Result` replaces it.**

- **`Result<A, E = never> = Success<A, E> | Failure<A, E>`,** read with `.success` and `.failure`. It is plain data; inspecting it runs nothing.
- **Result API:** `succeed`, `fail`, `void`, `try(() => ...)` or `try({ try, catch })` (a synchronous throw becomes a `Failure`; the single-function form has error type `unknown`), `match({ onFailure, onSuccess })`, `map`, `mapError`, `mapBoth`, `flatMap`, `andThen`, `all`, `gen`, `getOrElse`, `getOrThrow`, `getSuccess`, `getFailure`, `fromOption`, `fromNullishOr`, `isSuccess`, `isFailure`, `merge`, `flip`, `liftPredicate`, `filterOrFail`.
- **`Option<A> = None<A> | Some<A>`.** `Option.some(v)` does not filter `null` or `undefined`; use `fromNullishOr`. `Option.none()` returns a singleton.
- **Option API:** reading: `match({ onNone, onSome })`, `getOrElse(() => d)` (lazy), `getOrNull`, `getOrUndefined`, `getOrThrow` (throws `Error("getOrThrow called on a None")`), `getOrThrowWith`. Building: `fromNullishOr`, `fromNullOr`, `fromUndefinedOr`, `liftPredicate`, `liftNullishOr`, `liftThrowable`. Combining: `map`, `flatMap`, `filter`, `orElse`, `firstSomeOf`, `zipWith`, `all`, `gen`. Comparing: `makeEquivalence`, `makeOrder`.
- **An optional field typed `Option<string>`** keeps its key present on the object.
- **`Option.gen` and `Result.gen` run eagerly and synchronously,** unlike `Effect.gen`. Keep side effects out of them.
- **Prefer `Exit` over `Result`** when the outcome needs detailed error information (ERRORS.md).

### They are not Effects

`Option` and `Result` cannot be yielded in `Effect.gen` and have no `.asEffect()`. Convert explicitly:

```ts
const program2 = Effect.gen(function*() {
  const n = yield* Effect.fromOption(Option.some(42))
  return n + 1
})
const missing = Effect.fromOption(Option.none(), () => "missing")
```

Some docs pages say `Option` and `Result` implement a `Yieldable` trait and can be yielded directly. The 4.x source and migration notes say there is no such trait, and their prototypes carry no Effect type ID: follow the source.

The same v4 change applies to `Ref`, `Deferred` and `Fiber`: they are no longer Effects, so use `Ref.get`, `Deferred.await` and `Fiber.join`. `Config` and `Context.Service` are still Effects and can be yielded. (In v3, `Effect.all` could take an array of refs and silently read them all.)

## Data

Helpers for small immutable models with readonly fields: plain classes, tagged classes, tagged unions and typed errors (errors in ERRORS.md).

- **`Data.Class<{ readonly name: string }>`:** readonly, pipeable instances with value equality. With no fields the argument is optional.
- **`Data.TaggedClass("Person")<{ ... }>`** adds `readonly _tag`, left out of the constructor argument.
- **`Data.TaggedEnum<{ BadRequest: { ... }; NotFound: { ... } }>`** is the union type; `Data.taggedEnum<HttpError>()` gives the constructors plus `$is(tag)` and `$match`. Generic variants use `TaggedEnum.WithGenerics<N>` (up to 4).
  - Variant records must not include a `_tag` property.
  - Constructors produce plain objects, not class instances.
  - `$is(tag)` only checks `_tag`; validate untrusted input with `Schema` first.
- **v4 equality is structural by default:** `Equal.equals` compares plain objects, arrays, `Map`, `Set`, `Date` and `RegExp` by value (v3 compared them by reference), and `Equal.equals(NaN, NaN)` is `true`. Opt out with `Equal.byReference(obj)` or `byReferenceUnsafe`. v3's `Equal.equivalence` is now `Equal.asEquivalence`.
- **So a plain factory function is enough** for value-equal data; reach for `Data.Class` or `TaggedClass` when you want methods or getters.

```ts
Equal.equals(new Person({ name: "Mike" }), new Person({ name: "Mike" })) // true
```

## Match

Pattern matching for TypeScript values: `Match.type<T>()` defines a reusable matcher, `Match.value(v)` matches one value now.

- **Three steps:** create (`type`, `value`), add patterns (`when`, `not`, `tag`, `tags`, `whenOr`, `whenAnd`), then complete (`exhaustive`, `orElse`, `option`, `result`, `orElseAbsurd`).
- **`Match.withReturnType<T>()` must be the first step.** Later in the pipeline, TypeScript does not enforce type consistency correctly.
- **`Match.when(pattern, handler)`** takes literals, predicates and object shapes (`{ age: (n) => n > 18 }`); the matched input is removed from the remaining cases.
- **`Match.tag("a", "b", handler)`** relies on `_tag` (use `discriminator` for another field). `Match.tags({ ... })` with `Match.exhaustive`, or `Match.tagsExhaustive({ ... })`, requires every case. `Match.valueTags(value, { ... })` matches immediately.
- **End with `Match.exhaustive`** so a missing case is a type error. `Match.option` and `Match.result` turn an unmatched input into `None` or a `Failure`.
- **Built-in predicates:** `Match.string`, `nonEmptyString`, `number`, `boolean`, `bigint`, `symbol`, `date`, `record`, `null`, `undefined`, `defined`, `any`, `is(...literals)`, `instanceOf(Class)`.

## Duration

An immutable span of time: finite, positive infinity or negative infinity. It is the standard type for delays, timeouts, intervals and time-to-live values. (Some docs say durations are non-negative; the source has `negativeInfinity`, `negate`, `isNegative` and `abs`.)

- **Effect APIs accept `Duration.Input` directly:** `Effect.sleep("1 second")`, `Schedule.spaced("1 second")`.
- **`Duration.Input`** is a `Duration`, a `number` (millis), a `bigint` (nanos), `readonly [seconds, nanos]`, a `` `${number} ${Unit}` `` string, `"Infinity"`, `"-Infinity"`, or a `DurationObject` `{ weeks?, days?, hours?, minutes?, seconds?, milliseconds?, microseconds?, nanoseconds? }`. Units: `nano(s)`, `micro(s)`, `milli(s)`, `second(s)`, `minute(s)`, `hour(s)`, `day(s)`, `week(s)`. Fractions round to the nearest nanosecond, ties away from zero.
- **Decode untrusted input with `fromInput(input): Option<Duration>`;** `fromInputUnsafe` throws on bad input and is for trusted sources.
- **Constructors:** `nanos`, `micros`, `millis`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `infinity`, `zero`.
- **Getters:** `toMillis` (accepts `Input`), `toSeconds`, `toNanos` (an `Option<bigint>`, since it may be infinite), `toNanosUnsafe` (throws for infinite), `toHrTime`, `parts`.
- **Also:** `format` (`"1s 1ms"`), comparisons (`isLessThan` and the rest), `sum`, `times`, `subtract`, `divide`, `clamp`, `between`, `min`, `max`, `Order`, `Equivalence`.

## Brand

Compile-time names on ordinary values, so structurally identical values can't be mixed by accident. A branded value has the same runtime representation as the unbranded one; assigning a raw `number` to a branded type is a compile error.

- **Type:** `type UserId = number & Brand.Brand<"UserId">`, or `Brand.Branded<A, Key>`.
- **`Brand.nominal<UserId>()`** applies no runtime checks.
- **Validate at runtime with `Brand.make`:** `` Brand.make<Int>((n) => Number.isInteger(n) || `Expected ${n} to be an integer`) ``. The filter returns `true` or a message.
- **`Brand.check(...schemaChecks)`** builds a constructor from Schema checks.
- **Combine with `Brand.all(Int, Positive)`;** `type PositiveInt = Brand.Brand.FromConstructor<typeof PositiveInt>`.
- **Every constructor has four forms:** the call throws on invalid input; `.option(x)` gives `Option<B>`; `.result(x)` gives `Result<B, BrandError>`; `.is(x)` is a type guard.
- **`BrandError` does not extend `Error`.** It wraps a `SchemaIssue.Issue` and formats as `BrandError(<message>)`.

## Stability

- **Every module and export declares a stability:** `stable` follows strict semver; `unstable` may break in minor releases; `experimental` may break in patch releases. The core modules here (`Effect`, `Cause`, `Exit`, `Option`, `Result`, `Data`, `Match`, `Duration`, `Brand`, `Function`, `Pipeable`, `Runtime`, `ManagedRuntime`) are stable. Unstable namespaces include `ai`, `cli`, `cluster`, `http`, `http-api`, `rpc`, `schema`, `sql` and `workflow`.
- **The Effect language service warns** on unstable or experimental API use (`allowedUnstableApis`, `allowedExperimentalApis`).
- **v3's `effect/unstable/<x>` imports are now `effect/<x>`,** with no compatibility exports.
- **4.x is long-term support:** bug fixes until September 2029 or one year after 5.0 ships, whichever is later.

## Anti-patterns

- **`Effect.sync` around code that throws,** or `Effect.promise` around a promise that can reject: both become defects. Use `try` or `tryPromise`.
- **Throwing inside the `catch` of `try` or `tryPromise`.** Return the error value.
- **Calling `run*` deep inside the program.** Run once at the edge, through `runMain` or one `ManagedRuntime`.
- **`runSync` on an effect that may go async.** It throws `AsyncFiberError`.
- **A `ManagedRuntime` per request,** or one that is never disposed.
- **`yield*` on an `Option` or `Result` inside `Effect.gen`.** Wrap with `Effect.fromOption` or `Effect.fromResult`.
- **Importing `Either`.** It is `Result` in v4.
- **An effect created inside `flatMap` and not chained.** It never runs.
- **`Match.withReturnType` after another step,** or a matcher without `Match.exhaustive` where every case must be handled.
- **`Brand.nominal` for a value that needs validation.** Use `Brand.make` or `Brand.check`.

## Prove it

The project type-checks with `"strict": true`. A matcher missing a case fails the type-check under `Match.exhaustive`. Assigning a raw value to a branded type fails it (`TS2322` or `TS2345`). The process exits `130` on CTRL+C through `runMain` and the main effect's finalizers run; an error carrying `[Runtime.errorExitCode] = 42` exits `42`. Every `ManagedRuntime` has a `dispose` on shutdown. No `Either` import, and no `Option` or `Result` yielded directly in `Effect.gen`.
