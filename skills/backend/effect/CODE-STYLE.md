# Code style

The rules here are the ones the shipped agent guide (`node_modules/effect/AGENTS.md`, copied from the repo's `LLMS.md`) gives, plus the few the docs add. The guide also ships its examples under `node_modules/effect/ai-docs/`. Its own header rule: use that documentation and the installed Effect source, not unrelated copies of Effect or external documentation, which may be outdated. The guide's examples carry comments for illustration; in real code you would not include them.

## Which shape to write

| Writing | Use |
|---|---|
| Inline Effect code | `Effect.gen(function*() { ... })`, behaviour added with `.pipe(...)` |
| A reusable function where tracing is useful | `Effect.fn("name")(function*(...) { ... }, ...transforms)` |
| A reusable function that is not a useful tracing boundary (library code, hot paths) | `Effect.fnUntraced(function*(...) { ... })` |

- **Don't write functions that only wrap and return `Effect.gen`.** Use `Effect.fn` or `Effect.fnUntraced`: they reuse the generator body instead of allocating a fresh generator closure around the arguments on every call.
- **Attach extra behaviour with combinators** around the generator body; the guide calls this more readable and easier to maintain than combinators alone.
- **Generators are optional.** Pipelines are an alternative style, but the guide prefers the generator forms above.

## Effect.gen

Write effectful code that looks like synchronous code. It works like `async/await` but keeps errors, requirements and interruption in the Effect type.

- **Signature:** `gen<Eff extends Effect<any, any, any>, AEff>(f: () => Generator<Eff, AEff, never>)`. `E` and `R` are inferred as the union of the yielded effects. Only `Effect`s can be yielded: turn an `Option` or `Result` into one with `Effect.fromOption` or `Effect.fromResult` (CORE.md).
- **It short-circuits at the first failure;** later steps don't run. To keep going after a failure, wrap the step with `Effect.result`.
- **Plain control flow works inside:** `if`/`else`, `for`, `while`, `break`.
- **Return-type helper:** `Effect.gen.Return<A, E, R>` is `Generator<Effect<any, E, R>, A, any>`.
- **Bind `this` with the `{ self }` overload:** `Effect.gen({ self: this }, function*() { ... })`. v3 wrote `Effect.gen(this, function*() { ... })`.
- **Add behaviour with `.pipe`** on the result, for example `Effect.catch(...)` or `Effect.withSpan("fileProcessing", { attributes: { ... } })`.
- **tsconfig:** generators need `downlevelIteration` or `target` at `es2015` or later. The `effect` README requires TypeScript 5.9 or later (7 recommended), Node 18 or later and `"strict": true`.

### Always `return yield*` a failure

Inside a generator, raise an error with `return yield*`, so TypeScript knows the function will not continue:

```ts
return yield* new FileProcessingError({ ... })
// or
return yield* Effect.fail(...)
```

Without the `return`, the code below still considers a value such as `user` possibly `undefined` (error 18048).

## Effect.fn

- **Signature:** `fn: fn.Traced & { (name: string, options?: SpanOptionsNoTrace): fn.Traced }`.
- **Pass a name, and make it match the function name.** `Effect.fn("name")` improves stack traces and attaches a tracing span (through `Effect.withSpan`) when run. For service methods, name it `"Service.method"`: `Effect.fn("Database.query")`, `Effect.fn("TodoRepo.getById")`.
- **Without a name,** `Effect.fn(body, ...)` gives a generic stack-frame boundary without creating a span.
- **`SpanOptionsNoTrace`** sets the span's attributes, links, parent or root, kind, sampling and log level.
- **Annotate the return type with `Effect.fn.Return<A, E, R>`;** it takes the same type parameters as `Effect.Effect` and works with generics: `function*<A>(value: A): Effect.fn.Return<A>`.
- **Never `.pipe` an `Effect.fn`.** Pass extra behaviour as extra arguments after the body. They act like `pipe` transforms: each receives the previous result and the original function arguments, for example `(effect, value) => effect.pipe(Effect.map(...))`.
- **Bind `this`:** `Effect.fn("Counter.increment")({ self: this }, function*(this: Counter, by: number) { ... })`.

## Effect.fnUntraced

Same body reuse as `Effect.fn`, but it records no Effect stack-frame boundary and creates no tracing span. Prefer it for library functions that do not represent a useful tracing boundary. `Effect.fnUntracedEager` also exists.

The guide's example, both forms:

```ts
import { Effect, Schema } from "effect"

export const effectFunction = Effect.fn("effectFunction")(
  function*(n: number): Effect.fn.Return<string, SomeError> {
    yield* Effect.logInfo("Received number:", n)
    return yield* new SomeError({ message: "Failed to read the file" })
  },
  // **Do not** use .pipe with Effect.fn
  Effect.catch((error) => Effect.logError(`An error occurred: ${error}`)),
  Effect.annotateLogs({
    method: "effectFunction"
  })
)

export const validateBatchSize = Effect.fnUntraced(function*(size: number): Effect.fn.Return<number, SomeError> {
  if (!Number.isInteger(size) || size <= 0) {
    return yield* new SomeError({ message: "Batch size must be a positive integer" })
  }
  return size
})

export class SomeError extends Schema.TaggedError<SomeError>()("SomeError", {
  message: Schema.String
}) {}
```

## How to structure the rest

- **Structure code as services.** The guide calls services the most common way to structure Effect code and prefers them over other approaches: `class X extends Context.Service<X, { ... }>()("pkg/path/X")` with `static readonly layer = Layer.effect(X, Effect.gen(...))`. Define methods with `Effect.fn("X.method")` and return them with `X.of({ ... })`. The service's type is `X["Service"]`. The identifier string includes the package name and the subdirectory path to the service file.
- **Define errors as tagged classes with unique tags.** The guide's examples all use `Schema.TaggedError<Self>()("Tag", { fields })`; a service error wrapping an unknown cause has `cause: Schema.Defect()`. Details in ERRORS.md.
- **Validate and model with `Schema`.** The guide: all validation and domain modeling is done with `Schema`; avoid predicates or manual parsing for untrusted data. It points to `packages/effect/SCHEMA.md`, a large document to read in chunks.
- **Never write your own `isRecord` or `isString`:** use the `Predicate` module's helpers, composed with `Predicate.and`, `Predicate.or`, `Predicate.not` and `Predicate.compose`.
- **Use `DateTime`** instead of `Date` and `Date.now`.
- **Use `_tag` as the discriminant field** of tagged unions, so `catchTag`, `Match.tag` and `Data.TaggedEnum` work on it.
- **Run at the edge.** Call `run*` once, close to the program's edge, and make the process entry point `NodeRuntime.runMain` (or `BunRuntime.runMain`, `BrowserRuntime.runMain`), or `runMain(Layer.launch(appLayer))` for an app built from layers. Embed Effect in a framework with one `ManagedRuntime`, and dispose it. Details in [RESOURCES-AND-CONFIG.md](RESOURCES-AND-CONFIG.md#managedruntime).
- **Recover from typed errors with typed operators;** recover from defects only at boundaries (ERRORS.md).
- **`Effect.sync` and `Effect.promise` must not throw or reject.** When throwing is expected, use `Effect.try` or `Effect.tryPromise` with a `catch` that returns a typed error and never throws (CORE.md).

## Anti-patterns

- **A function that only returns `Effect.gen(...)`.** Use `Effect.fn("name")` or `Effect.fnUntraced`.
- **`.pipe(...)` on an `Effect.fn`.** Pass the transforms as extra arguments.
- **`yield* Effect.fail(...)` without `return`.** TypeScript keeps the narrowed value possibly `undefined`.
- **Tacit (point-free) style:** `Effect.map(fn)` or `flow`. Write `Effect.map((x) => fn(x))`. Overloaded functions in tacit style may erase all generics, it can hurt inference, and stack traces are less clear.
- **Hand-written type guards and manual parsing** of untrusted input. Use `Predicate` and `Schema`.
- **`Date` and `Date.now`.** Use `DateTime`.
- **`Effect.runPromise` as a process entry point.** It gives no graceful teardown on CTRL+C; use `runMain`.

## Prove it

Every reusable effectful function is an `Effect.fn("name")` whose name matches the function (or `"Service.method"`), or an `Effect.fnUntraced`; none has `.pipe` attached; no function only returns `Effect.gen`. Every failure inside a generator is `return yield*`. Errors are tagged classes with unique tags. `run*` appears only at the entry point or in one `ManagedRuntime`, and the type-check passes.
