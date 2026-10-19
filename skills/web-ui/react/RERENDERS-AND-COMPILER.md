# Re-renders and the React Compiler

A re-render is only a problem when it costs the user something: React Doctor's runtime guide says "A high render count is evidence, not a defect. Pair it with duration and user impact", and "A slow interaction can be browser-bound even when every component render is cheap" [React Doctor, performance]. So measure the interaction first (the trace method is in [web-performance RUNTIME-TRACE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/RUNTIME-TRACE.md)), check whether the React Compiler already memoizes the component, and only then reach for `memo`, `useMemo`, context splits, transitions or deferred values. Sources are Vercel's react-best-practices rules and React Doctor's improve-react and runtime guides, each checked against react.dev; severity uses the P0 to P3 scale of [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md) (Vercel's CRITICAL and HIGH as P1, MEDIUM-HIGH and MEDIUM as P2, LOW-MEDIUM and LOW as P3).

**Contents:** [The React Compiler](#the-react-compiler) · [When manual memoization pays](#when-manual-memoization-pays) · [Memoization traps](#memoization-traps) · [Context](#context) · [Transitions](#transitions) · [useDeferredValue](#usedeferredvalue) · [Lists](#lists) · [Prove it](#prove-it)

## The React Compiler

- **Status.** React Compiler 1.0 is the first stable release (https://react.dev/blog/2025/10/07/react-compiler-1); it "works on both React and React Native" (that post), and supports React 17, 18 and 19 (https://react.dev/learn/react-compiler/introduction). It is "a new build-time tool" that "automatically applies the equivalent of manual memoization", and "React Compiler automatically applies the equivalent of `memo` to all components" (https://react.dev/reference/react/memo).
- **Its lint rules need no compiler.** "Compiler-powered lint rules ship in `eslint-plugin-react-hooks`'s `recommended` and `recommended-latest` preset", and "The linter does not require the compiler to be installed" (compiler 1.0 post).
- **Manual memoization stays as an escape hatch.** "The `useMemo` and `useCallback` hooks can continue to be used with React Compiler as an escape hatch to provide control over which values are memoized. A common use-case for this is if a memoized value is used as an effect dependency". "For existing code, we recommend either leaving existing memoization in place (removing it can change compilation output) or carefully testing before removing the memoization." React Doctor adds: "With React Compiler, confirm the component is compiled before changing memoization. Existing manual memoization may encode observable identity or comparator behavior; remove it only with focused testing." [React Doctor, react-doctor-agent playbook]
- **Record whether it is on before auditing.** improve-react's recon names "version (hooks / Compiler / RSC)" [React Doctor, improve-react], and it hunts new-object, new-array and new-function props (`jsx-no-new-object-as-prop` and siblings); react.dev's memo page: "When you enable React Compiler, you typically don't need `React.memo` anymore." Vercel marks the same rules as unneeded with the compiler: manual `memo()` and `useMemo()` ("not necessary"), hoisting static JSX ("the compiler automatically hoists static JSX elements"), and split hooks ("may handle some of these cases") [Vercel, rerender-memo, rendering-hoist-jsx, rerender-split-combined-hooks].
- **Where the compiler goes wrong in the owner's app.** app-ui: "With a table library that passes the same row and header objects across renders, a compiler that memoizes components (React Compiler) keeps stale output: opt the table files out (`"use no memo"`)" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## When manual memoization pays

Without the compiler, https://react.dev/reference/react/useMemo says memoizing is "only valuable in a few cases":

- "The calculation you're putting in `useMemo` is noticeably slow, and its dependencies rarely change."
- "You pass it as a prop to a component wrapped in `memo`."
- "The value you're passing is later used as a dependency of some Hook."

"There is no benefit to wrapping a calculation in `useMemo` in other cases. There is no significant harm to doing that either", but "code becomes less readable", and "a single value that's 'always new' is enough to break memoization for an entire component." improve-react also calls premature memo a source of "dependency hazards" [React Doctor, improve-react]; that part is the source's claim, not react.dev's. Its leverage rule: "Reject premature `useMemo`/`memo` on cold paths".

react.dev's principles that make most memoization unnecessary:

1. "When a component visually wraps other components, let it accept JSX as children."
2. "Prefer local state and don't lift state up any further than necessary."
3. "Keep your rendering logic pure. If re-rendering a component causes a problem or produces some noticeable visual artifact, it's a bug in your component!"
4. "Avoid unnecessary Effects that update state. Most performance problems in React apps are caused by chains of updates originating from Effects" ([EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#you-might-not-need-an-effect)).
5. "Try to remove unnecessary dependencies from your Effects. For example, instead of memoization, it's often simpler to move some object or a function inside an Effect or outside the component."

On `memo`: it "is only valuable when your component re-renders often with the same exact props, and its re-rendering logic is expensive", it "is completely useless if the props passed to your component are *always different*", and "memoization is a performance optimization, not a guarantee" (https://react.dev/reference/react/memo). A memoized component still re-renders when its own state or a context it reads changes. A custom `arePropsEqual` "must compare every prop, including functions", or handlers see stale props.

## Memoization traps

- **Move expensive work into a memoized child so an early return skips it (P2).** [Vercel, rerender-memo]

  ```tsx
  // Incorrect: computes avatar even when loading
  function Profile({ user, loading }: Props) {
    const avatar = useMemo(() => {
      const id = computeAvatarId(user)
      return <Avatar id={id} />
    }, [user])

    if (loading) return <Skeleton />
    return <div>{avatar}</div>
  }

  // Correct: skips computation when loading
  const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
    const id = useMemo(() => computeAvatarId(user), [user])
    return <Avatar id={id} />
  })

  function Profile({ user, loading }: Props) {
    if (loading) return <Skeleton />
    return (
      <div>
        <UserAvatar user={user} />
      </div>
    )
  }
  ```
- **A non-primitive default prop breaks `memo()` (P2).** "new value instances are created on every rerender, and they do not pass strict equality comparison in `memo()`." [Vercel, rerender-memo-with-default-value]

  ```tsx
  const NOOP = () => {};

  const UserAvatar = memo(function UserAvatar({ onClick = NOOP }: { onClick?: () => void }) {
    // ...
  })
  ```
- **Don't `useMemo` a simple expression with a primitive result (P3).** "Calling `useMemo` and comparing hook dependencies may consume more resources than the expression itself." Write `const isLoading = user.isLoading || notifications.isLoading` [Vercel, rerender-simple-expression-in-memo].
- **Static values and pure functions live at module scope.** React Doctor's `prefer-module-scope-static-value` ("Static value rebuilt every render") and `prefer-module-scope-pure-function` ("Pure function rebuilt every render") [React Doctor, improve-react]; react.dev principle 5 above.
- **Hoist static JSX (P3).** `const loadingSkeleton = (<div className="animate-pulse h-20 bg-gray-200" />)` at module scope, "especially helpful for large and static SVG nodes"; unneeded with the compiler [Vercel, rendering-hoist-jsx].
- **Don't build a `RegExp` in render (P3).** Hoist it to module scope or `useMemo` it on its inputs. "Global regex (`/g`) has mutable `lastIndex` state": `regex.test('foo')` returns `true`, then `false` [Vercel, js-hoist-regexp]. The source's ``useMemo(() => new RegExp(`(${escapeRegex(query)})`, 'gi'), [query])`` calls an `escapeRegex` helper it never defines; supply your own.

## Context

- **Every consumer re-renders when the provider gets a new value.** https://react.dev/reference/react/useContext: React re-renders "all the children that use a particular context starting from the provider that receives a different `value`", compared with `Object.is`, and "Skipping re-renders with `memo` does not prevent the children receiving fresh context values." React Doctor's `jsx-no-constructed-context-values` ("Unstable context provider value; all consumers can re-render when the provider renders") is HIGH (P1 here) when it is "an unstable provider value re-rendering the whole tree" [React Doctor, improve-react].
- **Memoize an object value.** react.dev: "you may wrap the `login` function with `useCallback` and wrap the object creation into `useMemo`. This is a performance optimization", so consumers don't re-render "unless `currentUser` has changed." The owner's sidebar context builds its value this way (`contextValue` with `useMemo` in app-ui's reference `sidebar-context.tsx`).
- **Split a context by how often its parts change.** react.dev's reducer example puts state and dispatch in two contexts, `TasksContext` and `TasksDispatchContext` (https://react.dev/learn/scaling-up-with-reducer-and-context), so a component that only dispatches doesn't read the changing list. improve-react lists "splitting a context" among missed opportunities and "context fan-out" and "overloaded providers" under Beyond the scan [React Doctor, improve-react].
- **Read only part of a context: split the component.** "To make your component re-render only when a _part_ of some context changes, split your component in two. Read what you need from the context in the outer component, and pass it down to a memoized child as a prop." (https://react.dev/reference/react/memo)
- **Subscribe to the derived value, not the continuous one (P2).** `useMediaQuery('(max-width: 767px)')` re-renders when the boolean flips; `useWindowWidth()` "re-renders on every pixel change" [Vercel, rerender-derived-state]. Neither hook is React's, and the source does not define them.
- Context design (props first, then children, then context; the state, actions and meta interface) is in [COMPOSITION.md](COMPOSITION.md); reading context with `use()` is in [REACT-19.md](REACT-19.md).

## Transitions

A Transition marks state updates as non-blocking. https://react.dev/reference/react/useTransition:

- "The function you pass to `startTransition` is called immediately, marking all state updates that happen while it executes as Transitions. If you try to perform state updates in a `setTimeout`, for example, they won't be marked as Transitions."
- "A state update marked as a Transition will be interrupted by other state updates."
- "Transition updates can't be used to control text inputs."
- **State set after `await` is not a Transition.** "You must wrap any state updates after any async requests in another `startTransition` to mark them as Transitions. This is a known limitation that we will fix in the future." The official form:

  ```js
  startTransition(async () => {
    await someAsyncFunction();
    // ✅ Using startTransition *after* await
    startTransition(() => {
      setPage('/about');
    });
  });
  ```

  Vercel's rendering-usetransition-loading calls `setResults(data)` straight after `await` inside `startTransition(async () => ...)` and claims "New transitions automatically cancel pending ones"; react.dev says the opposite on both: the set needs its own `startTransition`, and "Actions within a Transition do not guarantee execution order". For ordering, react.dev points to "`useActionState` and `<form>` actions", or "your own queuing and abort logic".
- **What a Transition does not do.** React Doctor: "Do not claim `startTransition` debounces, cancels network work, moves computation off-thread, or reduces total work." [React Doctor, react-doctor-agent playbook]
- **Pending state.** `isPending` "switches to `true` at the first call to `startTransition`, and stays `true` until all Actions complete". app-ui owns pending this way: "Own pending with a transition (`useTransition`), so it clears however the action ends" ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md)). The standalone `startTransition` has no `isPending`, and "an Error Boundary cannot handle errors from its Transition"; React reports them with `reportError` (https://react.dev/reference/react/startTransition). Boundaries for Transitions that throw are in [BOUNDARIES-AND-SUSPENSE.md](BOUNDARIES-AND-SUSPENSE.md).
- **Frequent, non-urgent updates (P2).** Wrap a scroll-driven `setScrollY(window.scrollY)` in `startTransition` inside a `{ passive: true }` listener [Vercel, rerender-transitions]. If nothing renders from the value, keep it in a ref instead ([EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#refs)). How React's scheduler yields is in [web-performance MAIN-THREAD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/MAIN-THREAD.md#prioritize-and-defer).

## useDeferredValue

Use it when input drives an expensive render: the input updates at once and the result lags (P2) [Vercel, rerender-use-deferred-value]. react.dev's requirement the source leaves out: the slow child must be wrapped in `memo`, "Without `memo`, it would have to re-render anyway, defeating the point of the optimization" (https://react.dev/reference/react/useDeferredValue). The source's example with that fix:

```tsx
const ResultsList = memo(function ResultsList({ results }: { results: Item[] }) {
  // ...
})

function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filtered = useMemo(
    () => items.filter(item => fuzzyMatch(item, deferredQuery)),
    [items, deferredQuery]
  )
  const isStale = query !== deferredQuery

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <ResultsList results={filtered} />
      </div>
    </>
  )
}
```

The `useMemo` keeps `filtered` the same object while `deferredQuery` is unchanged, so `memo` can skip. Vercel's note: "Wrap the expensive computation in `useMemo` with the deferred value as a dependency, otherwise it still runs on every render." react.dev's caveats:

- Signature `useDeferredValue(value, initialValue?)`; without `initialValue` "`useDeferredValue` will not defer during the initial render".
- Pass "primitive values (like strings and numbers) or objects created outside of rendering"; a new object each render causes "unnecessary background re-renders".
- "When an update is inside a Transition, `useDeferredValue` always returns the new `value`".
- "There is no fixed delay", the background render is interruptible, and it "does not by itself prevent extra network requests". Unlike debouncing or throttling, the result lags "proportionally to how slow the device is".
- react.dev's stale styling is `opacity: isStale ? 0.5 : 1` with `transition: isStale ? 'opacity 0.2s 0.2s linear' : 'opacity 0s 0s linear'`, so a fast update never dims.

## Lists

- **Keys** are in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#keys-and-component-identity).
- **Rows that skip re-rendering** need `memo` and props that keep their identity: the item or primitives, no inline objects, a module-level default ([Memoization traps](#memoization-traps)). app-ui: "While loading, pass one module-level empty array, so the rows keep their identity" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).
- **Sort a copy.** `users.sort(...)` inside `useMemo` "Mutates the users prop array!"; use `users.toSorted(...)` [Vercel, js-tosorted-immutable].
- **Leverage sets severity.** improve-react: "A perf finding on a 10,000-row table is HIGH; the identical finding on a page shown once is noise." [React Doctor, improve-react]
- **Render only what is visible:** virtualization and `content-visibility: auto` with `contain-intrinsic-size` are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#long-lists); React Native lists are in [REACT-NATIVE.md](REACT-NATIVE.md).

## Prove it

Before and after each change, the same interaction is recorded in a production build ("To get the most accurate timings, build your app for production", useMemo page) with the React DevTools Profiler, and the change lands only if the measured interaction got faster; the audit records whether the React Compiler is on and no compiled component lost memoization without a focused test; each provider high in the tree passes a value that keeps its identity across unrelated renders; no `memo` child receives a prop that is new every render; every state set after an `await` inside a Transition is wrapped in its own `startTransition`; typing into a deferred search stays responsive while the results dim and catch up; and memoized list rows do not re-render when an unrelated row changes, seen in the Profiler.
