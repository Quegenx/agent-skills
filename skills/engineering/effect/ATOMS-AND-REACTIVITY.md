# Effect Atom state and React bindings

Effect v4 Atom state, async results, lifetime, hydration and React bindings, from the existing Effect package guide and source references. This is the reactive UI branch of the same versioned Effect library; shared runtime layers, Schema and coordination primitives keep their own topic owners. Read the installed package guide and source before using an uncertain API. [Effect v4 package, LLMS.md, ai-docs/ and installed AGENTS.md; existing STATE-AND-COORDINATION.md, Atoms and reactivity]

The source also names Solid and Vue bindings in its package catalog. Their usage is skipped for the owner's selected stack; this topic uses the Effect core and React branch. [Effect v4 package guide; owner stack rule]

## Atoms and reactivity

[Effect v4 package, LLMS.md and ai-docs/; existing STATE-AND-COORDINATION.md, Atoms and reactivity]

- **Core in `effect/reactivity`;** bindings in `@effect/atom-react` (hooks plus SSR hydration helpers), `@effect/atom-solid`, `@effect/atom-vue`.
- **An `Atom` describes one piece of reactive state;** the `AtomRegistry` runs reads, remembers values, tracks dependencies, starts effects and streams, and cleans up unused atoms. Each registry is independent.
- **Constructors:** `Atom.make` takes a value or read function (plain values make writable state), or an `Effect` / `Stream` exposed as an `AsyncResult`. `Atom.fn`: writing an argument starts the computation, state as `AsyncResult`. `Atom.family`: memoized factory, same object for the same argument.
- **`AsyncResult<A, E>`** is no value yet, success `A` or failure `E`, each with a `waiting` flag so the UI keeps the current value while newer work loads.
- **Lifetime:** atoms auto-dispose by default; `Atom.keepAlive` keeps one mounted without subscribers (`autoDispose` undoes it); `Atom.setIdleTTL` disposes after a finite idle time.
- **Run effects that need services** with `Atom.runtime(layer | (get) => layer)`, which returns an `AtomRuntime<R, E>`; also `addGlobalLayer` and `withReactivity(keys)` (refresh when the keys change).
- **Combinators:** `readable`, `writable`, `subscriptionRef`, `fnSync`, `pull`, `withFallback`, `map`, `mapResult`, `transform`, `debounce`, `withRefresh`, `swr` (`revalidateOnMount`, `revalidateOnFocus`: `true` respects `staleTime`, `"always"` forces), `optimistic` / `optimisticFn` (failures roll back to the latest source value), `batch`, `refreshOnWindowFocus`, `kvs` (backed by a schema-encoded `KeyValueStore` entry), `searchParam` (a schema passed here must be synchronous with no context), `serializable` (schema plus stable key for hydration), `withServerValue`, `withEquality`, `withLabel`, `toStream`, `get`, `set`, `update`, `modify`, `refresh`, `mount`.
- **Hydration:** `Hydration.dehydrate` / `hydrate` move `Atom.serializable` values between registries. **`Reactivity`** caches nothing; it registers handlers for keys, invalidates keys and wraps successful mutations so they invalidate.
- **API clients as atoms:** `AtomHttpApi.Service<Self>()(id, { api, httpClient, transformClient?, transformResponse?, baseUrl?, runtime? })` gives query atoms (`reactivityKeys`, `timeToLive`, `serializationKey`) and mutations that invalidate reactivity keys on success. It turns `SchemaError` and `HttpClientError` into defects. `AtomRpc.Service` is the RPC equivalent.
- **React hooks:** `useAtomValue(atom, selector?)`, `useAtom`, `useAtomSet` (`promise` / `promiseExit` modes for `AsyncResult` atoms), `useAtomSuspense`, `useAtomMount`, `useAtomRefresh`, `useAtomSubscribe`, `useAtomInitialValues`, `useAtomRef`, `useAtomRefProp`, `useAtomRefPropValue`; `RegistryProvider` / `RegistryContext`; `HydrationBoundary`; `ScopedAtom.make` for provider-owned atoms (`const Counter = make(() => Atom.make(0))`, `<Counter.Provider>`, `Counter.use()`).
- **Hook gotchas:** `useAtomSuspense` has `suspendOnWaiting` default `false`, and without `includeFailure` it throws failures with `Cause.squash(result.cause)`, so wrap callers in an error boundary. Late Suspense boundaries hydrate with the same snapshot as earlier readers, then update to the live value.

## Anti-patterns

[Effect v4 package, LLMS.md and ai-docs/; existing STATE-AND-COORDINATION.md, Anti-patterns]

- **`useAtomSuspense` without an error boundary** when `includeFailure` is off.

## Related contracts

- Shared runtime layers and lifecycle: [RESOURCES-AND-CONFIG.md](RESOURCES-AND-CONFIG.md) and [PLATFORM.md](PLATFORM.md). [Effect v4 package, LLMS.md and ai-docs/]
- Shared Ref, Queue and other fiber coordination primitives: [STATE-AND-COORDINATION.md](STATE-AND-COORDINATION.md). [Effect v4 package, LLMS.md and ai-docs/]

## Prove it

For the selected Atom or React work, match the installed v4 contract and preserve the documented async-result, hydration and failure behavior. An effectful atom provides the services its runtime needs; `useAtomSuspense` callers keep the documented error boundary when `includeFailure` is off. State which checks were actually performed rather than requiring unrelated Queue or Node-runtime exercises. [Effect v4 package, LLMS.md and ai-docs/; existing STATE-AND-COORDINATION.md, Atoms and reactivity; owner verification rule]
