# Concurrency: fibers, interruption, racing and timeouts

**Contents:** [The model](#the-model) · [Running many effects](#running-many-effects) · [Forking fibers](#forking-fibers) · [Observing fibers](#observing-fibers) · [Interruption](#interruption) · [Racing](#racing) · [Timeouts and sleeping](#timeouts-and-sleeping) · [FiberSet, FiberMap, FiberHandle](#fiberset-fibermap-fiberhandle) · [Process keep-alive and running](#process-keep-alive-and-running) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Everything here targets Effect v4. Where a v3 name differs, it is given as "v3 called it X" so ported code is recognisable. Semaphore, Latch, Deferred, Queue and PubSub are in [STATE-AND-COORDINATION.md](STATE-AND-COORDINATION.md); concurrency inside streams is in [STREAMS.md](STREAMS.md).

## The model

- **An `Effect` is lazy** and runs on fibers: a fiber is created any time an effect is run, one per concurrent effect, and there is always at least one "main" fiber.
- **`Types.Concurrency = number | "unbounded"`:** a number means at most N at once, `"unbounded"` means no limit. There is no `"inherit"` value in v4.
- **The default is sequential.** If you don't pass `concurrency`, effects run one after another; `Effect.forEach` is sequential by default too.
- **Pass `concurrency` at the call site.** Ambient concurrency was removed: v3 `Effect.withConcurrency` has no v4 equivalent; pass `concurrency` directly to `Effect.all`, `Effect.forEach` and related combinators. The options apply to many APIs beyond `Effect.all`.
- **Fibers have no requirements type parameter,** because they only run effects whose requirements are already provided.

## Running many effects

### Effect.all

```ts
all<
  const Arg extends Iterable<Effect<any, any, any>> | Record<string, Effect<any, any, any>>,
  O extends { concurrency?: Concurrency; discard?: boolean; mode?: "default" | "result" }
>(arg, options?) => All.Return<Arg, O>
```

- **Shape in, shape out:** tuple and iterable inputs collect results in order; record inputs collect under the same keys.
- **Fails on the first failure by default:** with concurrent execution, effects already started may be interrupted, and effects not yet started are skipped.
- **`mode: "result"`** runs every effect and collects each success or failure as a `Result` in the same shape.
- **`discard: true`** ignores successes and returns `void`.
- **Porting v3:** `allSuccesses` becomes `Effect.all` with `{ mode: "result" }`, then keep the `Result.Success` values; `parallelErrors` becomes `{ mode: "result", concurrency: "unbounded" }` and collect the failures explicitly; `allWith` becomes a lambda wrapping `Effect.all(values, options)`.

```ts
const numbered = Effect.all([task1, task2, task3, task4, task5], {
  concurrency: 2,
})
```

### forEach, partition, validate, replicateEffect, zip

- **`Effect.forEach(iterable, (a, i) => Effect, { concurrency?, discard? })`** stops at the first failure (short-circuiting); `discard: true` makes the result `void`. When one concurrent effect in it is interrupted, all of them are.
- **`Effect.partition(elements, f, { concurrency? })`** returns `[passes, fails]`, runs every effect and never fails.
- **`Effect.validate`** always evaluates every element; if at least one fails, all failures are returned as a non-empty array and the successes are discarded.
- **`Effect.replicateEffect(n)`** runs the effect `n` times with `Effect.all` semantics and the `concurrency` and `discard` options.
- **`Effect.zip(that, { concurrent: true })`** runs the two effects concurrently.

## Forking fibers

| v3 | v4 | The fiber is |
|---|---|---|
| `Effect.fork` | `Effect.forkChild` | a child of the current fiber |
| `Effect.forkDaemon` | `Effect.forkDetach` | detached from its parent |
| `Effect.forkScoped` | `Effect.forkScoped` | tied to the current `Scope` |
| `Effect.forkIn` | `Effect.forkIn` | tied to a given `Scope` |
| `Effect.forkAll` | removed | use `Effect.forEach` + `Effect.forkChild`, or a higher-level combinator |
| `Effect.forkWithErrorHandler` | removed | use `Effect.forkChild` + `Fiber.await` |

- **Prefer structured children: `Effect.forkChild`** returns the fiber immediately without waiting for it to start, and attaches it to the parent's scope: when the parent terminates, the child is terminated too, so no fibers leak ("auto supervision").
- **`Effect.forkDetach`** attaches to the global scope: the forked fiber keeps running after the fiber that forked it terminates, and stops when the global scope closes or it completes naturally. v3 `Effect.disconnect` maps to it.
- **`Effect.forkScoped`** forks into the current `Scope` and interrupts the fiber when the scope closes; its return type adds `Scope` to the requirements, and the fiber can outlive its parent fiber.
- **`Effect.forkIn(self, scope, options?)`** interrupts the fiber when that scope closes.
- **Every fork variant takes `{ startImmediately?: boolean; uninterruptible?: boolean | "inherit" }`.** `startImmediately: true` begins execution immediately instead of deferred (the default is `undefined`, deferred); `uninterruptible: true` makes the fiber uninterruptible, `"inherit"` inherits the parent's interruptibility.
- **Both call styles work:** `Effect.forkChild(myEffect, { startImmediately: true })` and `myEffect.pipe(Effect.forkChild({ startImmediately: true }))`.
- **Wait for children with `Effect.awaitAllChildren(self)`:** it waits for every child fiber forked by `self`; children that existed before the wrapped effect started are not awaited. v3 `daemonChildren` and `ensuringChildren` map to it.
- **Attach a manually managed fiber with `Fiber.runIn(fiber, scope)`:** if the scope is already closed the fiber is interrupted immediately; it does not wait for the fiber. v3 `Fiber.scoped` maps to it.
- **Track fibers explicitly.** The Supervisor module was removed (ambient supervision is gone): use structured concurrency, or `FiberSet` and `FiberMap`. v3 `Effect.supervised` maps to `FiberSet`.

```ts
const parent = Effect.gen(function* () {
  console.log("parent: started!")
  // Child fiber is supervised by the parent
  yield* Effect.forkChild(child)
  yield* Effect.sleep("3 seconds")
  console.log("parent: finished!")
})
```

### When a forked fiber starts

- **Forked fibers begin after the current fiber completes or yields.** A `SubscriptionRef.changes` stream forked with `Effect.forkChild`, followed by two `set`s, captures only `2`; an `Effect.sleep` or `Effect.yieldNow` after the fork lets it start first.
- **Don't rely on timing:** fiber execution order is not deterministic, and a single yield does not guarantee a fiber begins at a particular time. Synchronise with a `Deferred` or `Latch` (STATE-AND-COORDINATION.md) when order matters.

## Observing fibers

- **A v4 `Fiber` is a runtime handle, not an Effect:** `yield* fiber` no longer works; use `Fiber.join` or `Fiber.await`.
- **`Fiber.join(fiber): Effect<A, E>`** when the forked fiber's failure should fail the current effect; joining a failed fiber propagates its Cause.
- **`Fiber.await(fiber)`** returns an Effect of the fiber's `Exit`.
- **`Fiber.awaitAll(fibers)`** returns the Exits in input order, with failures captured as `Exit.Failure`.
- **`Fiber.joinAll(fibers)`** fails with the first failing fiber's cause and stops waiting, but does not interrupt the remaining fibers: call `Fiber.interruptAll` separately. It replaces v3 `Fiber.all`.
- **Compose by joining:** v4 removed composite fibers and `Fiber.map`, `Fiber.zip`, `Fiber.orElse`; compose the join effects instead:

```ts
Effect.zip(Fiber.join(fiber1), Fiber.join(fiber2))
Effect.catchCause(Fiber.join(fiber1), () => Fiber.join(fiber2))
```

- **Fiber identity:** IDs are numbers on `fiber.id`; `Effect.fiberId: Effect<number>` (v3 `Effect.descriptor` maps to it); `Effect.fiber` gives the current fiber; `Fiber.getCurrent(): Fiber | undefined` is synchronous and returns `undefined` outside a fiber (v3 `getCurrentFiber` returned an Option).
- **Status:** `Fiber.status` and `Fiber.poll` are gone; `fiber.pollUnsafe()` returns `undefined` while not done. `Fiber.dumpAll`, `Fiber.roots` and `Fiber.children` are removed; keep explicit handles in `FiberSet` or `FiberMap` when tracking is needed.
- **Prefer the module functions over `interruptUnsafe` and `pollUnsafe`:** the unsafe methods are immediate runtime hooks without the Effect-based sequencing guarantees.

## Interruption

- **Interruption is asynchronous and cooperative:** the target fiber does not poll for it, and during critical sections it disables interruptibility for those regions. A fiber can keep running while inside uninterruptible work or finalizers.
- **`Fiber.interrupt(fiber): Effect<void>`** completes only after the interrupted fiber has completed. This back-pressures: no new fibers start before the previous ones finish. To not wait, fork the interruption: `yield* Effect.forkChild(Fiber.interrupt(fiber))`.
- **`fiber.interruptUnsafe()`** is fire-and-forget and does not wait for the fiber's finalizers. v3 `Fiber.interruptFork` maps to it.
- **`Fiber.interruptAll`** waits for all. `Fiber.interruptAs` and `interruptAllAs` record a specific fiber ID as the interruptor but neither makes interruption synchronous nor stops uninterruptible regions early.
- **`Effect.interrupt: Effect<never>`** interrupts the current fiber immediately; v3 `interruptWith(fiberId)` maps to it (explicit FiberId was removed).
- **`Effect.onInterrupt(effect, finalizer)`** runs only on interruption, not on success or failure.
- **Control regions:** `Effect.uninterruptible`, `Effect.interruptible`, `Effect.uninterruptibleMask((restore) => ...)` (where `restore` re-enables interruptibility for a part) and `Effect.interruptibleMask((restore) => ...)`.
- **Interruptible checkpoint:** v3 `Effect.allowInterrupt` maps to `Effect.yieldNow`.

### Resources under interruption

- **`Effect.acquireRelease`:** acquisition runs in an uninterruptible region by default; pass `{ interruptible: true }` to allow interrupting it. Release is guaranteed when the scope closes and receives the closing `Exit`.
- **`Effect.acquireUseRelease`:** acquire and release are not interrupted; if release fails, the whole effect fails even when use succeeded.
- **`Effect.ensuring`:** once the effect starts, the finalizer runs on success, failure or interruption. Don't use it to release resources; use `acquireRelease`.

### Interruption at the edges

- **`Effect.promise` and `Effect.tryPromise` pass an `AbortSignal`.** Interruption aborts it, but the underlying operation only stops if it observes that signal, so pass the signal on to the operation.
- **`Effect.callback((resume, signal?) => cleanup?)`** (v3 `Effect.async` and `asyncEffect`): call `resume` at most once (later calls are ignored), and return an optional cleanup effect that runs on interruption.
- **`Effect.abortSignal: Effect<AbortSignal, never, Scope>`** creates a fresh controller that is aborted when the scope closes.

## Racing

- **`Effect.race(self, that, { onWinner? })`:** the first success wins and the other is interrupted; if both fail, the race fails (with a cause containing all the errors).
- **`Effect.raceFirst(self, that, { onWinner? })`:** the first completion, success or failure, wins and the loser is interrupted. The race waits for the loser's interruption finalizer before continuing. v3 `raceWith` maps to `Effect.raceFirst` plus Fiber APIs.
- **`onWinner({ fiber, index, parentFiber })`** is observational only.
- **`Effect.raceAll(iterable, { onWinner? })`:** early failures are ignored until one succeeds or all fail; on success the rest are interrupted. When all fail, the source (JSDoc) says it fails with a cause containing the collected failure reasons; some docs say it fails with the last error.
- **`Effect.raceAllFirst(iterable)`** (new in 4.0): the first to settle wins, the rest are interrupted.
- **Take whichever finishes first as data:** wrap each side of `race` in `Effect.result`.
- **The `forkChild` JSDoc mentions `raceWith` and `zipPar`;** neither is exported from v4 `Effect.ts`. Use the race functions above and `Effect.all` or `Effect.zip(..., { concurrent: true })`.

## Timeouts and sleeping

- **`Effect.timeout(duration)`** adds `Cause.TimeoutError` to the error channel; if the timeout wins, the source effect is interrupted.
- **`Effect.timeoutOption(duration)`** gives `Option.some(value)` or `Option.none()` on timeout and keeps source failures. Use it only when a timeout genuinely means absence.
- **`Effect.timeoutOrElse({ duration, orElse: () => Effect })`** (new in 4.0) interrupts the source, then lazily runs the fallback. v3 `timeoutFail`, `timeoutFailCause` and `timeoutTo` map to it.
- **Reserve a defect on timeout** (`Effect.die` in the fallback) for when timing out violates an invariant.
- **Uninterruptible work stretches a timeout:** the region defers the interruption until it becomes interruptible again, so the caller may wait longer than the configured duration.
- **Retry deadlines:** where `Effect.timeout` sits relative to `Effect.retry` decides what it bounds; see SCHEDULING.md.
- **`Effect.sleep(duration)`** suspends without blocking a JS thread; also `Effect.delay`, and `Effect.timed`, which pairs the duration with the result.
- **`Effect.never`** never completes; **`Effect.yieldNow`** yields to other fibers.

## FiberSet, FiberMap, FiberHandle

Use these when fibers must be tracked beyond one parent, for example one fiber per connected client, keyed by client ID.

- **`FiberSet<A, E>`:** tracks fibers, removes each on completion, and interrupts all of them when its scope closes. `FiberSet.make(): Effect<FiberSet, never, Scope>`.
- **`FiberSet.run(set, effect, { startImmediately?, propagateInterruption? })` starts the effect immediately by default,** unlike `Effect.forkChild`, which defers.
- **`FiberSet.join`** fails with the first recorded failure. Interruption-only exits are not recorded unless `propagateInterruption: true`.
- **Other `FiberSet` functions:** `add`, `addUnsafe` (a closed set interrupts the fiber immediately), `clear`, `size`, `awaitEmpty`, `makeRuntime`, `makeRuntimePromise`, `runtime`, `runtimePromise`.
- **`FiberMap<K, A, E>`** is keyed: setting a key that already has a fiber interrupts the previous one, unless `onlyIfMissing`, in which case the new fiber is interrupted and the existing one kept.
- **`FiberHandle<A, E>`** holds at most one fiber: installing a new one interrupts the previous unless `onlyIfMissing`; closing the scope interrupts it.

## Process keep-alive and running

- **The v4 runtime keeps Node alive by itself:** a reference-counted keep-alive timer means a fiber waiting on `Deferred.await` keeps the process alive without `runMain`.
- [Entry points and managed runtimes](RESOURCES-AND-CONFIG.md#entry-points) own signals, shutdown, runners and the removed Runtime API. [Service/layer structure](SERVICES-AND-LAYERS.md#structuring-an-application) owns background worker layers.

## Anti-patterns

- **Forgetting `concurrency`:** `Effect.all` and `Effect.forEach` run sequentially unless told otherwise, and there is no ambient setting to fall back on.
- **Assuming `Fiber.joinAll` cleans up:** it stops waiting on the first failure and leaves the other fibers running.
- **Detaching to make a timeout return early:** detached work keeps consuming resources after the caller has moved on.
- **Relying on a yield to order fibers:** timing is not deterministic.
- **Calling `interruptUnsafe` or `pollUnsafe` in Effect code:** they skip the sequencing guarantees of `Fiber.interrupt` and friends.
- **`Effect.ensuring` to free resources:** use `Effect.acquireRelease`.
- **Ignoring the `AbortSignal` from `Effect.tryPromise`:** the promise keeps running after interruption.

## Prove it

- `Effect.all` and `Effect.forEach` calls that are meant to run concurrently pass `concurrency`; no `Effect.withConcurrency`, `Effect.fork`, `Effect.forkDaemon` or Supervisor remains.
- No `yield* fiber`: every fiber result goes through `Fiber.join` or `Fiber.await`, and every `Fiber.joinAll` that can fail is paired with `Fiber.interruptAll` where leftover fibers matter.
- Each promise passed to `Effect.tryPromise` or `Effect.promise` receives the `AbortSignal`.
- A test that interrupts the program shows the `onInterrupt` or release finalizers ran, and that a `forkChild` fiber stopped with its parent.
