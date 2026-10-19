# State and coordination: Ref, Deferred, Semaphore, Latch, Queue, PubSub, References

**Contents:** [Ref](#ref) · [SynchronizedRef](#synchronizedref) · [SubscriptionRef](#subscriptionref) · [Transactions](#transactions) · [Deferred](#deferred) · [Semaphore](#semaphore) · [Latch](#latch) · [Queue](#queue) · [PubSub](#pubsub) · [Fiber-local values: References](#fiber-local-values-references) · [Atoms and reactivity](ATOMS-AND-REACTIVITY.md#atoms-and-reactivity) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Everything here targets Effect v4. In v4, `Ref`, `Deferred`, `Queue` and `Fiber` are no longer Effects: `yield* ref` or `yield* deferred` no longer works, because passing such a value to an Effect combinator would read it instead of treating it as a value. Use the module functions (`Ref.get`, `Deferred.await`, `Queue.take`). Fibers and FiberSet are in [CONCURRENCY.md](CONCURRENCY.md).

## Ref

- **`Ref<A>` holds one value** and exposes reads, writes and atomic transformations as effects.
- **API:** `make`, `makeUnsafe`, `get`, `getUnsafe`, `set`, `getAndSet`, `getAndUpdate`, `getAndUpdateSome`, `setAndGet`, `modify`, `modifySome`, `update`, `updateAndGet`, `updateSome`, `updateSomeAndGet`.
- **Read with `Ref.get`;** v3 `yield* ref` no longer works. v3 `Ref.unsafeMake` is `Ref.makeUnsafe`.
- **Compute a result and the next value in one atomic step** with `Ref.modify(ref, (a) => [result, next])`: it returns `result` and stores `next`.
- **Provide a Ref as a service** with `Effect.provideServiceEffect(MyState, Ref.make(0))`, because creating it is effectful.

## SynchronizedRef

- **Use it when the next value is computed by an effect:** update and modify operations are serialized, so each change sees a consistent current value.
- **`SynchronizedRef.updateEffect`** runs the effectful update while holding the ref's semaphore.
- **v4 `SynchronizedRef` no longer extends `Ref`.** The curried `modifySomeEffect` takes only the callback, which returns `Effect<[result, Option<newValue>]>`.

## SubscriptionRef

- **Stores the latest value and publishes the initial value and every committed update.** `SubscriptionRef.changes` is a stream that emits the current value at subscription, then later changes.
- **v4 `SubscriptionRef` no longer extends `SynchronizedRef` or `Subscribable`.** Some docs still describe it as a specialized SynchronizedRef; follow the source.
- **`SubscriptionRef.getUnsafe`** reads the underlying reference without any synchronization.
- **Subscribe before you update:** a `changes` stream forked with `Effect.forkChild` starts only after the current fiber yields (CONCURRENCY.md, When a forked fiber starts).

## Transactions

- **v4 replaces STM with `Effect.tx` and the `TxRef` and `Tx*` modules.** Transactions are all or nothing and optimistic with retry; a nested `tx` reuses the outer journal; `Effect.txRetry` retries. `TxSemaphore` exists for use in transactions.

## Deferred

- **A `Deferred` is completed exactly once** with a success, failure, defect or interruption, and any number of fibers can wait on it; awaiting suspends the fiber, not an OS thread.
- **Use it to** coordinate fibers, synchronise them, hand over work, or suspend until a condition holds.
- **Wait with `Deferred.await`.** Some docs still call `Deferred` a subtype of `Effect`; in v4 it is not.
- **Create and complete:** `Deferred.make<A, E>()`, then `succeed`, `sync`, `fail`, `failSync`, `failCause`, `failCauseSync`, `die`, `dieSync`, `done(exit)`, `complete(effect)`, `completeWith(effect)`, `interrupt`, `interruptWith` or `into(effect)`. Each returns `Effect<boolean>`: `true` if this call completed it.
- **`complete(effect)` memoizes the result; `completeWith(effect)` does not:** each awaiter may run the stored effect independently, so use it carefully.
- **Inspect:** `Deferred.poll` returns `Option<Effect<A, E>>`; `Deferred.isDone` returns `Effect<boolean>`; also `isDoneUnsafe`, `doneUnsafe`, `makeUnsafe`.

## Semaphore

Module `effect/Semaphore`, new in 4.0. v3 `Effect.makeSemaphore` is `Semaphore.make`.

- **API:** `Semaphore.make(permits): Effect<Semaphore>`, `makeUnsafe`, `withPermits(n)`, `withPermit`, `withPermitsIfAvailable(n)` (returns `Option.none` without running when permits are unavailable), `take(n)`, `takeIfAvailable(n)` (boolean), `release(n)`, `releaseAll`, `resize(n)`.
- **Prefer `withPermit` or `withPermits`:** they release even if the task fails or is interrupted. The method form `mutex.withPermits(1)(task)` works too. Manual `take` and `release` must keep permit counts balanced.
- **`releaseAll` can overshoot:** effects running under `withPermit(s)` still release when they finish, so the available count can exceed the configured number of permits.
- **`resize`** keeps existing acquisitions taken; if the new total is below what is taken, new acquisitions wait.
- **`PartitionedSemaphore`** (unstable) shares one permit pool with waiters grouped by partition key, so one busy group doesn't monopolize released permits.

## Latch

Module `effect/Latch`, new in 4.0. v3 `Effect.makeLatch` is `Latch.make`.

- **API:** `Latch.make(open = false)`; `open` releases current and future waiters; `release` releases only current waiters without opening; `close` makes future waiters suspend; `await`; `whenOpen(effect)`; `isOpen`; unsafe `makeUnsafe`, `openUnsafe`, `closeUnsafe`.
- **Latch or semaphore:** use a latch to gate a set of fibers on a specific event; use a semaphore with one permit to keep only one fiber at a time in a critical section.

## Queue

A `Queue` hands each value to one consumer in offer order, and can complete, fail, interrupt or shut down.

- **`Queue<A, E = never>` has an error parameter and completion signalling.** v3 `Mailbox` was folded into it: `Mailbox<A, E>` becomes `Queue.Queue<A, E | Cause.Done>`.
- **Create with `Queue.make({ capacity?, strategy?: "suspend" | "dropping" | "sliding" })`;** the default is unbounded with `"suspend"`. Shortcuts: `bounded(n)` (backpressure), `dropping(n)` (new offers dropped, `offer` returns `false`), `sliding(n)` (oldest dropped), `unbounded()`. `Queue.make({ capacity: 0 })` is the closest thing to rendezvous backpressure. v3 strategy values (`backPressureStrategy` and the rest) and custom `BackingQueue` were removed.
- **Offer:** `Queue.offer` returns `false` if the queue is done; `offerAll` returns the messages that were not added.
- **Take:** `take` waits and fails with `Done` when done; `poll` returns an Option and never waits; `takeAll` waits for at least one message and returns a non-empty array; `takeN(n)` may wait; `takeBetween(min, max)`; `peek`; `clear` returns everything buffered without waiting (an empty array when empty); `collect` takes until done.
- **`Queue.takeAll` waits.** Some docs say it completes immediately with an empty collection; the source waits until at least one message is available and returns `Arr.NonEmptyArray<A>`. Drain without waiting with `Queue.clear`. v3 `takeUpTo` maps to a `Queue.poll` loop or `Queue.clear` (a docs section titled "takeUpTo" actually uses `Queue.takeBetween(queue, 1, 2)`).
- **Lifecycle:** `end(queue)` stops offers and lets buffered messages drain (requires `Cause.Done` in `E`); `fail`; `failCause`; `interrupt` is graceful (drain, then Done with an interrupt cause); `shutdown` immediately discards buffered messages and resumes pending operations. `Queue.await` resumes at `Done`, not at the first completion signal; after `shutdown` it is interrupted rather than succeeding, so use `Effect.onExit` and `Fiber.await` for cleanup.
- **Size:** `Queue.size` includes buffered messages while `Closing` and reports 0 when `Done`; `isFull`.
- **Capabilities:** `Queue.Enqueue<A, E>` is the write side, `Queue.Dequeue<A, E>` the read side. `asEnqueue` and `asDequeue` are type-level only: they don't hide read operations at runtime.
- **Synchronous callbacks** use the unsafe operations: `offerUnsafe` (returns `false` when closing or done, or when full with `"suspend"` or `"dropping"`), `offerAllUnsafe`, `endUnsafe`, `failCauseUnsafe`, `shutdownUnsafe`, `takeUnsafe`, `flush` and `flushUnsafe`.
- **`Queue.into`** runs an effect into a queue: success ends it, failure fails it.

```ts
const program = Effect.gen(function*() {
  const queue = yield* Queue.make<number, string | Cause.Done>()
  yield* Queue.offer(queue, 1)
  yield* Queue.offer(queue, 2)
  yield* Queue.offerAll(queue, [3, 4, 5])
  const messages = yield* Queue.takeAll(queue)
  yield* Queue.end(queue)
  const done = yield* Effect.flip(Queue.take(queue))
  const failedQueue = yield* Queue.make<number, string>()
  const failed = yield* Queue.fail(failedQueue, "boom")
  return { messages, done, failed }
})
```

## PubSub

Each active `Subscription` receives its own copy of every accepted message; unlike a queue, subscribers don't compete for messages.

- **Constructors:** `bounded(capacity | { capacity, replay? })` (publishers suspend at capacity), `dropping`, `sliding`, `unbounded({ replay? })`. Capacity must be a positive integer or `Infinity`; an invalid capacity dies. For dropping and sliding, powers of two perform best.
- **Pick the strategy by who may lose:** bounded means a slow subscriber can slow down publishers and other subscribers; dropping means subscribers may miss messages; sliding means slow subscribers may miss older messages. Prefer bounded, dropping or sliding over unbounded unless you have a specific reason.
- **Subscribe before publishing:** `PubSub.subscribe(pubsub): Effect<Subscription<A>, never, Scope>`. A subscriber only receives messages published while it is subscribed; a `replay` buffer lets late subscribers receive recent messages.
- **Take:** `PubSub.take`, `takeAll`, `takeUpTo` (non-suspending), `takeBetween`, `remaining`.
- **Publish:** `publish` returns whether the message was accepted (`false` after shutdown); `publishAll`; `publishUnsafe` skips the strategy's effectful surplus handling.
- **End:** `PubSub.end(pubsub, final)` gives subscribers the buffered messages, then the final message, which is sticky: later takes return it again.
- **Shutdown:** `shutdown` interrupts suspended publishers and subscribers; `awaitShutdown`, `isShutdown`, `capacity` (a number), `size` (an Effect).
- **v4 PubSub no longer extends `Queue.Enqueue`.**
- **As a service:** create it in `Layer.effect`, shut it down in a finalizer, and expose subscribing as a stream:

```ts
const pubsub = yield* PubSub.bounded<OrderEvent>({
  capacity: 256,
  replay: 50
})
yield* Effect.addFinalizer(() => PubSub.shutdown(pubsub))
const subscribe = Stream.fromPubSub(pubsub)
```

## Fiber-local values: References

- **`FiberRef`, `FiberRefs`, `FiberRefsPatch` and `Differ` were removed;** fiber-local state is `Context.Reference`.
- **Read** with `yield* References.CurrentLogLevel`.
- **Override for a scope** with `Effect.provideService(effect, References.CurrentLogLevel, "Debug")` (v3 `Effect.locally`, and `FiberRef.set` around the effect). v3 `locallyWith` is `Effect.updateService`; `locallyScopedWith` is `Effect.updateServiceScoped`.
- **Overrides are inherited:** providing a reference changes behaviour for the provided effect and the fibers it starts.
- **Built-ins:** `CurrentLogLevel`, `MinimumLogLevel`, `CurrentLogAnnotations`, `CurrentLogSpans`, `Scheduler` (default `MixedScheduler`), `MaxOpsBeforeYield` (default 2048), `PreventSchedulerYield` (default false; it can let long-running fibers monopolize the JavaScript thread), `TracerEnabled`, `TracerTimingEnabled`, `TracerSpanAnnotations`, `TracerSpanLinks`, `CurrentTraceLevel`, `MinimumTraceLevel`, `DisablePropagation`, `Tracer`, `UnhandledLogLevel` (default `"Error"`; `undefined` suppresses), `CurrentLoggers`, `LogToStderr`, `CurrentStackFrame`.
- **Scheduler tuning:** v3 `FiberRef.currentMaxOpsBeforeYield` and `currentScheduler` map to `References.MaxOpsBeforeYield` and `References.Scheduler`, set with `Effect.provideService`. The per-function migration notes for `Effect.withMaxOpsBeforeYield` and `Effect.withScheduler` say there is no direct public replacement; the References above are what the FiberRef guide and source provide.
- **Define your own** with `Context.Reference` for config values or feature flags that have a default.

## Atoms and reactivity

Reactive UI state, hydration and React hooks are defined in [ATOMS-AND-REACTIVITY.md](ATOMS-AND-REACTIVITY.md). [Effect v4 package, LLMS.md and ai-docs/]

## Anti-patterns

- **`yield* ref`, `yield* deferred`, `yield* queue`:** v4 values are not Effects; use `Ref.get`, `Deferred.await`, `Queue.take`.
- **`completeWith` when awaiters must share one run:** it reruns the effect per awaiter; use `complete`.
- **Manual `Semaphore.take` and `release`** where `withPermits` fits.
- **Expecting `Queue.takeAll` to return empty:** it waits; use `Queue.clear`.
- **Publishing before subscribing** without a `replay` buffer: those messages are gone.
- **Unbounded PubSub by default.**
- **Treating `asDequeue` as a runtime guard:** it is a type only.

## Prove it

Apply only the checks for the coordination primitives changed by the task. Atom-only work uses [its own acceptance](ATOMS-AND-REACTIVITY.md#prove-it). [existing STATE-AND-COORDINATION.md, Prove it; owner verification rule]

- No `yield*` on a `Ref`, `Deferred`, `Queue` or `Fiber`; no `FiberRef`, `Mailbox`, `Effect.makeSemaphore`, `Effect.makeLatch` or `Effect.locally` remains.
- For Queue or PubSub work, state its capacity and strategy. For Queue completion, a test shows consumers end on `Cause.Done` after `Queue.end`.
- For effectful synchronized updates, use `SynchronizedRef.updateEffect`, and a concurrent test (`Effect.forEach` with `concurrency`) shows no lost update.
