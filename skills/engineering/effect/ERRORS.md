# Errors, Cause and Exit

**Contents:** [Expected errors and defects](#expected-errors-and-defects) · [Defining errors](#defining-errors) · [Catching](#catching) · [Transforming and observing](#transforming-and-observing) · [Turning errors into values](#turning-errors-into-values) · [Cause](#cause) · [Exit](#exit) · [v3 to v4 names](#v3-to-v4-names) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## Expected errors and defects

| | Expected error | Defect |
|---|---|---|
| Is | A failure that is part of the domain: invalid input, a missing record, a rejected request | A failed assertion, an impossible state, a bug in third-party code |
| Tracked in | The `E` channel | Not in `E`; kept in the `Cause` |
| Made by | `Effect.fail`, `return yield* new MyError(...)` | `Effect.die`, a throw inside `Effect.sync` and similar callbacks, a rejected `Effect.promise` |
| Recover with | `Effect.catch`, `catchTag` and the typed family | Only at boundaries: `Effect.exit`, `catchDefect`, `catchCause` |

- **Errors accumulate as a union:** composing an `Effect<_, InvalidInput>` with an `Effect<_, UserNotFound>` gives `E = InvalidInput | UserNotFound`.
- **Report defects and let them end the fiber.** Recover from them only at a boundary where continuing is explicitly safe (dynamically loaded plugins, for example).
- **Pass `Effect.die` a string or, better, an `Error`** with a useful message.

## Defining errors

**Define every error as a tagged class with a unique `_tag`.** Use tagged errors for domain errors that callers may need to tell apart.

### Schema.TaggedError (the guide's choice)

The shipped agent guide uses `Schema.TaggedError` for every error: a schema-backed, yieldable error class with an automatically filled `_tag`, validated by the schema, yielded in `Effect.gen` and matched as a tagged union member.

```ts
export class SomeError extends Schema.TaggedError<SomeError>()("SomeError", {
  message: Schema.String
}) {}
```

- **Signature:** `TaggedError<Self = never, Brand = {}>(identifier?: string)`, then `(tag, fields, annotations?)`. Leaving out `Self` gives the `MissingSelfGeneric<"Schema.TaggedError">` type error.
- **The tag doubles as the identifier** by default; an explicit identifier as the first argument overrides it. `Schema.Error<E>("E")({ ... })` is the untagged version. All `Class` features work: `extend`, `annotate`, `check`.
- **Wrap an unknown cause with `cause: Schema.Defect()`.** It encodes JavaScript `Error`s to `{ name, message, cause? }` JSON (`{ includeStack: true }` adds stacks). It carries defects across JSON boundaries; it does not preserve every JavaScript value exactly.

`Schema.Error` is a Class and YieldableError whose `name` is its identifier; tagged error instances have `stack`. The schema-class guide gives `Schema.Error<E>("E")({ id: Schema.Number })` as the untagged constructor example. The schema-class guide also uses this cause-wrapper form:

```ts
  class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", { cause: Schema.Defect() }) {}
```

`Schema.Defect(options?)` encodes to Json: JSON objects with a string `message` decode to Error values; `{ excludeCause: true }` omits the cause. `ErrorInstance` accepts only Error values. [Existing SCHEMA-CLASSES.md, Errors]

### Data.TaggedError

`Data.TaggedError("Tag")<{ fields }>` is for domain errors with discriminated-union handling, and the docs' error pages use it throughout. It extends `Cause.YieldableError`; `_tag` is left out of the constructor argument. `Data.Error<{ ... }>` is for yieldable errors that don't need a tag; a `message` field becomes the error's `.message`. Data errors can carry a `cause` that integrates with JavaScript's `Error.cause`.

Both are official. No source gives a rule for choosing beyond this: `Schema.TaggedError` is schema validated, `Data.TaggedError` is the plain Data class. The shipped guide's examples choose `Schema.TaggedError`.

### Yielding and tags

- **`return yield* new NotFound({ id })`** is the same as `Effect.fail(new NotFound({ id }))`; the `return` lets TypeScript narrow (CODE-STYLE.md).
- **Tags must be unique.** TypeScript can't enforce it: if two classes share a tag, `catchTag` and `catchTags` catch both, and neither the compiler nor the runtime warns.

### Nested reasons

Group related failures under one parent error with a `reason` union, then catch by reason:

```ts
class AiError extends Schema.TaggedError<AiError>()("AiError", {
  reason: Schema.Union([RateLimitError, QuotaExceededError, SafetyBlockedError])
}) {}
```

### Mapping decode errors at the edge

```ts
  export const decodeUser = Schema.decodeUnknownEffect(User)
  export const parseUserPayload = Effect.fn("parseUserPayload")((input: unknown) =>
    decodeUser(input).pipe(
      Effect.mapError((error) => new InvalidUserPayload({ message: error.message }))
    )
  )
```

HTTP status annotations remain in [HTTP.md](HTTP.md#errors).

## Catching

| Operator | Catches | Note |
|---|---|---|
| `Effect.catch(f)` | Every typed error | Not defects |
| `Effect.catchTag(tag \| [tags...], f, orElse?)` | Errors whose readonly `_tag` matches | Removes them from `E` |
| `Effect.catchTags({ Tag: handler, ... }, orElse?)` | Several tags, one handler each | An unknown key is a type error |
| `Effect.catchIf(refinement \| predicate, f, orElse?)` | Errors matching the predicate | Others re-fail with the original cause; defects and interrupts are not caught |
| `Effect.catchFilter(Filter, f, orElse?)` | Errors passing a `Filter`, e.g. `Filter.tagged("NotFound")` | A narrowing filter removes the subtype |
| `Effect.catchReason("AiError", "RateLimitError", handler, orElse?)` | One reason of a parent error | Unmatched reasons keep the parent error |
| `Effect.catchReasons("AiError", { RateLimitError: ..., ... }, orElse?)` | Several reasons | |
| `Effect.unwrapReason("AiError")` | (nothing) | Replaces the parent in `E` with its reason union, ready for `catchTags` |
| `Effect.catchNoSuchElement` | `NoSuchElementError` | Turns it into `Option.none`; other errors stay |
| `Effect.catchCause(f)` | The full `Cause`: failures, defects, interrupts | Boundaries only |
| `Effect.catchDefect(f)` | Defects only | Report or translate defects at integration boundaries |
| `Effect.catchEager` | As `catch` | Runs synchronous recovery immediately; use when the handler cannot fail |

- **Specific first, then a catch-all:**

```ts
.pipe(
  Effect.catchTag("ReservedPortError", ...),
  Effect.catch((_) => Effect.succeed(3000))
)
```

- **Several tags, one handler:** `Effect.catchTag(["ParseError", "ReservedPortError"], (_) => Effect.succeed(3000))`.
- **Typed operators for domain errors;** `catchDefect` or `catchCause` only where recovering from unexpected failures is intentional and safe.

## Transforming and observing

- **`mapError(f)`** changes only the error; **`mapBoth`** changes both channels (`mapErrorEager` and `mapBothEager` are optimizations).
- **`orDie`** turns typed failures into defects, for an unrecoverable bug or invalid state. To customize the defect, `mapError` first, then `orDie`.
- **`orElseSucceed(f)`** replaces typed failures with a value; it does not recover defects or interruptions. If only absence or one specific error should fall back, narrow first with a selective catch.
- **`firstSuccessOf(effects)`** runs them in order until one succeeds; an empty iterable is a defect ("Received an empty collection of effects").
- **`filterOrFail` and `filterOrElse`** turn an invalid success value into a typed failure.
- **Observe without handling:** `tapError` (all typed errors), `tapErrorTag` (one tag), `tapCause` (the full cause), `tapDefect` (defects only). If the tap fails, its error joins `E`.
- **`Effect.flip`** swaps the channels, though `mapError` or a catch usually says the intent more directly.
- **`Effect.withErrorReporting(effect, { defectsOnly? })`** reports to the configured `ErrorReporter`s.
- **Many validation errors are data,** not several `Cause` reasons: collect them all with `Effect.validate`, or keep failures and successes with `Effect.partition`.

## Turning errors into values

| Operator | Gives | Keeps |
|---|---|---|
| `Effect.result` | `Effect<Result<A, E>, never, R>` | Typed failures only; defects and interruptions still fail the effect |
| `Effect.option` | An `Option` of the value | Discards the error value |
| `Effect.exit` | `Effect<Exit<A, E>, never, R>` | The full `Cause` |
| `Effect.match({ onFailure, onSuccess })` | Pure handlers | Does not handle defects; `matchEffect` takes effectful handlers |
| `Effect.matchCause`, `matchCauseEffect` | Handlers receive the full `Cause` | Everything |
| `Effect.ignore` | Discards success and typed errors | Defects and interruptions; options `{ log?: boolean \| Severity, message? }` |
| `Effect.ignoreCause` | Discards everything | Nothing: use it sparingly, it can hide defects |
| `Effect.sandbox` | `Effect<A, Cause<E>, R>` | Restore with `Effect.catch(Effect.failCause)` |

- **`result` when the error value matters, `option` only when every typed failure means absence.**
- **`exit` at application boundaries, in tests, and for APIs that need an explicit value for every outcome.**
- **For one recovery step, `catchCause` is usually simpler than `sandbox`.**

## Cause

A `Cause<E>` records the full reason an effect failed: typed failures, defects, interruptions and annotations.

- **v4 structure is flat:** `interface Cause<E> { readonly reasons: ReadonlyArray<Reason<E>> }`, with `Reason<E> = Fail<E> | Die | Interrupt`. `Fail.error: E`, `Die.defect: unknown`, `Interrupt.fiberId: number | undefined`. v3's `Empty`, `Sequential` and `Parallel` are gone; an empty cause has an empty array. `Cause` compares by value (`Equal`).
- **Walk it:**

```ts
for (const reason of cause.reasons) {
  switch (reason._tag) {
    case "Fail": // reason.error
    case "Die": // reason.defect
    case "Interrupt": // reason.fiberId
  }
}
```

- **Guards:** on a cause, `hasFails`, `hasDies`, `hasInterrupts`, `hasInterruptsOnly`; on a reason, `isFailReason`, `isDieReason`, `isInterruptReason`. There is no `isEmpty`: check `cause.reasons.length === 0`.
- **Extractors:** `findError(cause): Result<E, Cause<never>>`, `findErrorOption(cause): Option<E>`, `findDefect`, `findFail`, `findDie`, `findInterrupt` (`Result`-based), `interruptors`. v3's `failures` is `cause.reasons.filter(Cause.isFailReason)`.
- **`Cause.squash` is lossy.** It collapses a cause to one `unknown`: the first `Fail` error, else the first `Die` defect, else `Error("All fibers interrupted without error")`, else `Error("Empty cause")`. `runPromise` and `runSync` use it to decide what to throw. When you need every failure, use `prettyErrors` or iterate `cause.reasons`.
- **`Cause.pretty(cause): string`** is human-readable, with stacks and nested `[cause]` chains (`""` for an empty cause); **`prettyErrors`** gives `Array<Error>`.
- **Constructors:** `Cause.empty`, `fail`, `die`, `interrupt`, `combine(left, right)` (concatenates the reasons; replaces v3's sequential and parallel), `fromReasons`, `makeFailReason`, `makeDieReason`, `makeInterruptReason`, `annotate`.
- **Built-in yieldable errors** (v3's `*Exception` names are now `*Error`): `NoSuchElementError`, `TimeoutError` (from `Effect.timeout`), `IllegalArgumentError`, `ExceededCapacityError`, `AsyncFiberError`, and `UnknownError` (`new UnknownError(cause, message?)`, holding the original in `Error.cause`). `RuntimeException` and `InterruptedException` were removed.
- **Avoid `NoSuchElementError` for expected absence:** prefer APIs that return `Option` or a typed failure.
- **`Cause.Done`** is a graceful completion signal for queues and streams.

## Exit

- **`Exit<A, E> = Success<A, E> | Failure<A, E>`,** with `Success.value: A` and `Failure.cause: Cause<E>`. Think of it as `Result<A, Cause<E>>`, except the cause also holds interrupts, defects and combined causes.
- **`Exit` is an `Effect`:** you can yield it inside `Effect.gen`. `Effect.succeed` is essentially `Exit.succeed`.
- **API:** `Exit.succeed`, `fail`, `failCause`, `die`, `interrupt`, `isSuccess`, `isFailure`, `match(exit, { onSuccess, onFailure })`, `getCause`, `getSuccess`, `hasDies`, `hasFails`, `hasInterrupts`, `map`, `mapError`, `mapBoth`. `findErrorOption` returns only the first `Fail`; other typed errors are ignored.
- **`Exit` is the preferred result type within Effect.** `Result` is not recommended as the main result type where detailed error information matters.
- **Get one from a run** with `Effect.runPromiseExit` or `Effect.runSyncExit` (CORE.md).

## v3 to v4 names

| v3 | v4 |
|---|---|
| `catchAll` | `catch` |
| `catchAllCause` | `catchCause` |
| `catchAllDefect` | `catchDefect` |
| `catchSome` | `catchFilter` (with the `Filter` module, e.g. `Filter.fromPredicate`) |
| `catchSomeCause` | `catchCauseFilter` |
| `catchSomeDefect` | removed |
| `catchTag`, `catchTags`, `catchIf` | unchanged |
| `Cause` `Empty`, `Sequential`, `Parallel` | a flat `reasons` array; `Cause.combine` |
| `Cause.failures` | `cause.reasons.filter(Cause.isFailReason)` |
| `*Exception` errors | `*Error` (`NoSuchElementError`, `TimeoutError`, ...) |
| `RuntimeException`, `InterruptedException` | removed |

## Anti-patterns

- **Two error classes with the same tag.** `catchTag` silently catches both.
- **Recovering from defects in domain logic** with `catchCause`, `catchDefect` or `ignoreCause`. Keep them at boundaries.
- **`Effect.result` expected to catch defects.** It captures typed failures only; use `Effect.exit`.
- **`Effect.option` where the error carries information.** Use `result`.
- **`orElseSucceed` as a blanket default** when only one error means "use the default". Narrow with a selective catch first.
- **Reading one `Cause.squash` value** when several failures matter. Iterate `cause.reasons`.
- **Leaving out `Self` in `Schema.TaggedError<Self>()`.** It is a type error.
- **Throwing from a `catch` mapper** in `Effect.try` or `tryPromise`. That throw becomes a defect.
- **`firstSuccessOf([])`.** An empty list is a defect.

## Prove it

A test per domain error forces the failure and asserts the `_tag` the caller sees, and `E` in the type-check lists exactly the errors left after each catch. A defect test (`Effect.die` or a throw in `Effect.sync`) shows it passing through `Effect.catch` and `Effect.result`, and showing up in `Effect.exit` as a `Die` reason. `catchCause`, `catchDefect` and `ignoreCause` appear only at boundaries. No two error classes share a tag.
