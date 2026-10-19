# Streams: Stream, Sink, Channel and backpressure

**Contents:** [The model](#the-model) · [Creating streams](#creating-streams) · [Concurrency inside a stream](#concurrency-inside-a-stream) · [Backpressure, buffering and fan-out](#backpressure-buffering-and-fan-out) · [Timing and rate](#timing-and-rate) · [Resources and errors](#resources-and-errors) · [Consuming](#consuming) · [Sink](#sink) · [Channel and Pull](#channel-and-pull) · [Porting v3 streams](#porting-v3-streams) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Everything here targets Effect v4. Queue, PubSub and SubscriptionRef are in [STATE-AND-COORDINATION.md](STATE-AND-COORDINATION.md); schedules are in [SCHEDULING.md](SCHEDULING.md).

## The model

- **`Stream<A, E, R>`** can emit many `A` values, fail with `E`, and require services `R` while it is consumed. Streams can replace observables, Node streams and AsyncIterables.
- **Pull-based with backpressure:** the downstream consumer controls the rate at which it requests elements.
- **Chunked:** streams emit chunks to amortize effect evaluation. In v4 a chunk is a `NonEmptyReadonlyArray`, not a `Chunk`. `Stream.DefaultChunkSize` (= `Channel.DefaultChunkSize`) is 4096.

## Creating streams

- **From values:** `make`, `empty`, `succeed`, `range`, `iterate`, `fromIterable`, `fromIterableEffect`, `fromArray`, `fromArrays`.
- **From effects and schedules:** `fromEffect`, `fromEffectRepeat` (v3 `repeatEffect`), `fromEffectSchedule` (v3 `repeatEffectWithSchedule`), `tick(interval)`, `fromSchedule`.
- **From state:** `unfold` emits one value per step; `paginate` returns an array per step plus the next cursor, the shape of a paginated API.
- **From the platform:** `fromAsyncIterable(iterable, onError)`, `fromReadableStream`, `fromEventListener`.
- **From Effect primitives:** `fromQueue`, `fromPubSub`, `fromSubscription`, `fromPubSubTake`, `fromPull`. `Stream.fromQueue(dequeue)` ends when the queue fails with `Cause.Done`; other failures propagate.
- **Wrapping:** `unwrap`, `scoped`.

### Callbacks: Stream.callback

`Stream.callback((queue) => Effect, { bufferSize?, strategy? })` replaces v3 `async`, `asyncEffect`, `asyncPush` and `asyncScoped`.

- **Emit** with `Queue.offer` or `Queue.offerUnsafe`; **end** with `Queue.end` or `Queue.endUnsafe`; **fail** with `Queue.fail` or `Queue.failCause`.
- **Register and unregister in the same effect:** the register effect may use `Scope` (it is excluded from `R`) to acquire and release the subscription.
- **The default buffer is unbounded;** pass `bufferSize` and `strategy` to bound it.

```ts
export const callbackStream = Stream.callback<PointerEvent>(Effect.fn(function*(queue) {
  function onEvent(event: PointerEvent) {
    Queue.offerUnsafe(queue, event)
  }
  yield* Effect.acquireRelease(
    Effect.sync(() => button.addEventListener("click", onEvent)),
    () => Effect.sync(() => button.removeEventListener("click", onEvent))
  )
}))
```

## Concurrency inside a stream

- **`Stream.mapEffect(f, { concurrency?, unordered? })`:** with `concurrency`, results are still emitted in their original order unless `unordered`.
- **`Stream.flatMap(f, { concurrency?, bufferSize? })`:** sequential by default (inner streams concatenated in order); with concurrency above 1, outputs are merged as they arrive.
- **`Stream.switchMap(f, { concurrency?, bufferSize? })`** interrupts the previous inner stream when a new element arrives. Some docs mention a `switch` option on `flatMap`; the v4 `flatMap` has none, use `switchMap`.
- **`Stream.merge(that, { haltStrategy? })`** with `HaltStrategy = "left" | "right" | "both" | "either"`, default `"both"`. `Stream.mergeResult` merges into results (v3 `mergeEither`).
- **`Stream.mergeAll(streams, { concurrency, bufferSize? })`:** `concurrency` is required.
- **`Stream.race` and `raceAll`** race until the first emission, then mirror the winner.
- **`Stream.drainFork(other)`** runs a background stream, interrupted when this stream completes.
- **`Stream.groupBy(f, { bufferSize?, idleTimeToLive? })` and `groupByKey`** return a plain `Stream<readonly [K, Stream<V>]>` (the v3 `GroupBy` type is gone). Process the groups with `Stream.flatMap(..., { concurrency: "unbounded" })`.
- **`Stream.partition(filter, { capacity? })`** returns a scoped `[passes, fails]` (v3 had the order reversed). Default capacity is 16; the faster stream may advance up to `capacity` elements ahead of the slower one.

## Backpressure, buffering and fan-out

- **Concurrent mapping drops nothing:** inside `Channel` it uses `Queue.bounded(0)` output queues, so every offer blocks until a downstream consumer takes, and ordered concurrency blocks the upstream pull when its slots are full.
- **`Stream.buffer({ capacity: number, strategy?: "suspend" | "dropping" | "sliding" } | { capacity: "unbounded" })`:** `"suspend"` applies backpressure; `"dropping"` and `"sliding"` may discard. It destroys chunking; follow it with `Stream.rechunk`.
- **`Stream.bufferArray`** buffers whole chunks, preserves chunking, and works best with power-of-two capacities.
- **Into a queue:** `Stream.toQueue({ capacity, strategy? })` gives a scoped `Queue.Dequeue<A, E | Cause.Done>`; `Stream.runIntoQueue(queue)` offers plain values and ends with `Cause.Done`.
- **Broadcast:** `Stream.broadcast({ capacity, strategy?, replay? })` returns `Effect<Stream<A, E>, never, Scope | R>` for dynamic subscribers (v3 `broadcastDynamic`); `Stream.broadcastN({ n, capacity })` gives a fixed tuple (v3 `broadcast(n)`). `capacity` limits how far upstream can get ahead before slowing to the slowest downstream.
- **`Stream.share({ capacity, ..., idleTimeToLive? })`** subscribes upstream on the first consumer and finalizes after the last one exits; `idleTimeToLive` keeps upstream alive for late subscribers.
- **Into a PubSub:** `Stream.toPubSub` (`shutdownOnEnd` defaults to true); `runIntoPubSub` publishes plain elements, not `Take`.
- **Splitting a stream:** v3 `distributedWith` was removed; use `broadcastN` with a filter, or `partition`.

## Timing and rate

- **`Stream.schedule(schedule)`** paces elements (v3 `scheduleWith` was removed).
- **`Stream.debounce(duration)`** emits only the latest element after a pause.
- **`Stream.throttle({ cost, units, duration, burst?, strategy?: "enforce" | "shape" })`** is a token bucket: the default `"shape"` delays chunks, `"enforce"` drops them. It works on chunks, not individual elements. `throttleEffect` takes an effectful cost.
- **`Stream.groupedWithin(n, duration)`:** the duration starts at the first element, so an idle stream does not wake up.
- **`Stream.aggregateWithin(sink, schedule)`:** time-based schedules such as `fixed` and `upTo({ duration })` count only time spent aggregating; use `Schedule.spaced` for a flush timer.
- **`Stream.timeout(d)`** ends the stream if no value arrives within `d`; `Stream.timeoutOrElse({ duration, orElse })` switches to a fallback, which is not timed after the switch.
- **Stopping:** `Stream.interruptWhen(effect)` interrupts, including an in-progress pull; `Stream.haltWhen(effect)` stops after the current pull and does not interrupt or truncate it. v3 `interruptAfter(d)` is `interruptWhen(Effect.sleep(d))`; `haltAfter(d)` is `haltWhen(Effect.sleep(d))`.
- **`Stream.retry(schedule)` retries the entire stream,** re-executing all its acquire operations; the schedule resets once an element passes again.
- **`Stream.repeat(schedule)`** repeats the whole stream; `Stream.forever`.

## Resources and errors

- **Acquire resources with `Stream.scoped(Stream.fromEffect(Effect.acquireRelease(acquire, release)))`;** v3 `Stream.acquireRelease` was removed. Use `Stream.ensuring` for finalizers only.
- **Errors:** `Stream.catch` (v3 `catchAll`), `catchCause`, `catchTag`, `catchTags`, `catchFilter`, `catchCauseFilter`, `onError`, `orElseSucceed`.
- **`Stream.onEnd(effect)`** (v3 `onDone`) now takes an Effect value.

## Consuming

- **Run:** `runCollect`, `runDrain`, `runForEach`, `runForEachArray`, `runForEachWhile`, `runFold(() => init, f)`, `runHead`, `runLast`, `runCount`, `run(sink)`.
- **Manual scoped consumption uses `Stream.toPull`:** it gives a scoped pull that fails with `Cause.Done` when the stream ends. `runScoped` and `runForEachScoped` are gone.
- **Interop:** `Stream.toAsyncIterable`, `toReadableStream`.
- **`Stream.scan(() => initial, step)`:** the initial state is a thunk evaluated per run; allocate mutable initial state inside it so runs don't share state.
- **Encoding and decoding:** `Stream.pipeThroughChannel(Ndjson.decodeSchemaString(Schema)())`.

## Sink

- **`Sink<A, In, L, E, R>`** consumes a variable number of `In`, may fail with `E`, and yields `A` with leftovers `L`. `Sink.End<A, L> = readonly [value: A, leftover?: NonEmptyReadonlyArray<L>]`.
- **Pull-based in v4:** `transform: (upstream: Pull<NonEmptyReadonlyArray<In>>, scope) => Effect<End<A, L>>`. The low-level constructor is `Sink.fromTransform` (v3 `fromPush` was removed).
- **Constructors:** `collect` (v3 `collectAll`), `take(n)` (v3 `collectAllN`; returns leftovers), `head`, `last` (never completes on a stream that doesn't end), `sum`, `count`, `forEach`, `forEachArray`, `fold(init, cont, f)` (leftovers when it stops mid-array), `foldUntil`, `reduce(() => s, f)` (v3 `foldLeft`), `reduceWhile`, `drain`, `timed`, `succeed`, `fail`, `fromQueue`, `fromPubSub`, `make<In>()`.
- **Leftovers:** expose them with `Sink.mapEnd`, drop them with `Sink.ignoreLeftover`.
- **Transform:** `Sink.mapInput`, `Sink.map`. Filter input on the stream before `Stream.transduce`.
- **Removed:** the `foldWeighted` family (use `Sink.fold` with the cost in the state), the `zip` family (use `Sink.flatMap`), and `race` (broadcast, then `Effect.race` the run effects).

## Channel and Pull

Streams and sinks are built on channels; most application code uses those higher-level modules instead.

- **`Channel<OutElem, OutErr, OutDone, InElem, InErr, InDone, Env>`:** v4 reorders the type parameters from v3's `<OutElem, InElem, OutErr, InErr, OutDone, InDone, Env>`.
- **Compose** by piping (`pipeTo`), sequencing and concatenating.
- **Reads:** the v3 instruction AST (`read`, `readWith`) was removed; implement reads with `Channel.fromTransform` and Pull matching, including `Cause.Done`.
- **`Channel.toPull`** requires a `Scope`; pulls are serialized, so only one is evaluated at a time.
- **`Pull<A, E, Done, R>`** is an Effect that produces one `A`, fails with `E`, or signals the end with `Cause.Done<Done>`. Helpers: `Pull.catchDone`, `isDoneCause`, `filterDone`, `matchEffect`, `doneExitFromCause`.
- **`Take<A, E, Done>`** is the plain union `NonEmptyReadonlyArray<A> | Exit<Done, E>`.
- **Renames from v3:** `concatMap` is `flatMap`, `mapOut` is `map`, `mapOutEffectPar` is `mapEffect(self, f, { concurrency: n })` (ordered output by default), `write` is `succeed`, `writeAll` is `fromArray`, `run` is `runDrain`, `unwrapScoped` is `unwrap`, `toStream` is `Stream.fromChannel`, `toSink` is `Sink.fromChannel`.

## Porting v3 streams

| v3 | v4 |
|---|---|
| `mapChunks`, `fromChunk`, `runForEachChunk`, `flattenChunks`, `bufferChunks` | `mapArray`, `fromArray`, `runForEachArray`, `flattenArray`, `bufferArray` |
| `async`, `asyncEffect`, `asyncPush`, `asyncScoped` | `Stream.callback` |
| `repeatEffect`, `repeatEffectWithSchedule` | `fromEffectRepeat`, `fromEffectSchedule` |
| `mergeWith` | map both sides, then `Stream.merge` |
| `mergeEither` | `Stream.mergeResult` |
| `broadcastDynamic`, `broadcast(n)` | `broadcast`, `broadcastN` |
| `distributedWith` | `broadcastN` + filter, or `partition` |
| `scheduleWith` | removed; `Stream.schedule` |
| `interruptAfter(d)`, `haltAfter(d)` | `interruptWhen(Effect.sleep(d))`, `haltWhen(Effect.sleep(d))` |
| `acquireRelease` | `Stream.scoped(Stream.fromEffect(Effect.acquireRelease(...)))` |
| `catchAll`, `onDone` | `catch`, `onEnd` |
| `runScoped`, `runForEachScoped` | `Stream.toPull` |
| `GroupBy` type | plain `Stream<readonly [K, Stream<V>]>` |

## Anti-patterns

- **`Stream.buffer` without `Stream.rechunk`** where chunking matters.
- **`flatMap` with a `switch` option:** use `Stream.switchMap`.
- **Shared mutable state in `Stream.scan`'s initial value** created outside the thunk.
- **`Sink.last` on a stream that never ends:** it never completes.
- **Expecting `Stream.retry` to resume where it failed:** it reruns the whole stream, acquisitions included.
- **`Schedule.fixed` or `upTo({ duration })` as a flush timer in `aggregateWithin`:** use `Schedule.spaced`.
- **An unbounded `Stream.callback` buffer for a fast producer:** set `bufferSize` and `strategy`.

## Prove it

- No `Chunk`-named stream operators, `Stream.async*`, `Stream.acquireRelease` or `runScoped` remain.
- Each `Stream.callback` releases its listener in the register effect's scope, and a test that interrupts the consumer shows the release ran.
- Each `buffer`, `toQueue`, `broadcast` and `callback` states its capacity and strategy, and dropping or sliding is a deliberate choice.
- A test of the stream with `Stream.runCollect` shows the expected elements, in order where `mapEffect` runs with `concurrency`.
