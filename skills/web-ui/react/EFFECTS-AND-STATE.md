# Effects and state

An Effect is for synchronizing with something outside React. This file holds react.dev's rules for when an Effect is not needed, dependencies, `useEffectEvent`, state updates, refs, keys and component identity, controlled inputs, and reads that must agree between the server render and hydration. Code comes from Vercel's react-best-practices rules and React Doctor's improve-react catalog, each checked against react.dev; where a source disagrees with react.dev, the official form is written here and the line says what the source said. Severity uses the P0 to P3 scale of [code-review REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md): Vercel's CRITICAL and HIGH are written as P1, MEDIUM-HIGH and MEDIUM as P2, LOW-MEDIUM and LOW as P3.

**Contents:** [You might not need an Effect](#you-might-not-need-an-effect) · [Dependencies](#dependencies) · [useEffectEvent](#useeffectevent) · [State updates](#state-updates) · [Refs](#refs) · [Keys and component identity](#keys-and-component-identity) · [Controlled inputs](#controlled-inputs) · [Hydration-safe reads](#hydration-safe-reads) · [Prove it](#prove-it)

## You might not need an Effect

https://react.dev/learn/you-might-not-need-an-effect: "Use Effects only for code that should run *because* the component was displayed to the user."

- **Derive during render (P2).** "When something can be calculated from the existing props or state, don't put it in state. Instead, calculate it during rendering." [Vercel, rerender-derived-state-no-effect]

  ```tsx
  // Incorrect: redundant state and effect
  function Form() {
    const [firstName, setFirstName] = useState('First')
    const [lastName, setLastName] = useState('Last')
    const [fullName, setFullName] = useState('')

    useEffect(() => {
      setFullName(firstName + ' ' + lastName)
    }, [firstName, lastName])

    return <p>{fullName}</p>
  }

  // Correct: derive during render
  function Form() {
    const [firstName, setFirstName] = useState('First')
    const [lastName, setLastName] = useState('Last')
    const fullName = firstName + ' ' + lastName

    return <p>{fullName}</p>
  }
  ```

  React Doctor flags the same thing as `no-mirror-prop-effect` ("Prop mirrored into state via effect") [React Doctor, improve-react]. Its own PLAN-TEMPLATE.md example fixes `useEffect(() => { setResults(filter(items, query)); }, [items, query])` by completing the deps; react.dev's form is `const results = filter(items, query);`, with `useMemo` if it is slow.
- **A slow derivation gets `useMemo`, after measuring.** react.dev: if the logged time "adds up to a significant amount (say, `1ms` or more), it might make sense to memoize that calculation"; measure in a production build, since Strict Mode renders each component twice in development (https://react.dev/reference/react/useMemo). When to memoize is in [RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#when-manual-memoization-pays).
- **Reset all state with a key, not an Effect.** Rendering `<Profile userId={userId} key={userId} />` gives each user a fresh subtree; "You can force a subtree to reset its state by giving it a different key" (https://react.dev/learn/preserving-and-resetting-state).
- **Adjust part of the state during render, guarded.** react.dev's form stores the previous prop and compares:

  ```js
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelection(null);
  }
  ```

  "A condition like `items !== prevItems` is necessary to avoid loops", and only the rendering component's own state may change this way. https://react.dev/reference/react/useState calls it "hard to understand and is usually best avoided. However, it's better than updating state in an effect." React Doctor's `no-set-state-in-render` ("State update during render; render-loop risk") should not flag this guarded form; an unconditional set is the bug ("Too many re-renders") [React Doctor, improve-react].
- **Work caused by an action goes in its handler (P2).** "If a side effect is triggered by a specific user action (submit, click, drag), run it in that event handler. Do not model the action as state + effect" [Vercel, rerender-move-effect-to-event]; React Doctor's `no-event-handler` ("Event logic handled in an effect") [React Doctor, improve-react].

  ```tsx
  // Incorrect: event modeled as state + effect
  function Form() {
    const [submitted, setSubmitted] = useState(false)
    const theme = useContext(ThemeContext)

    useEffect(() => {
      if (submitted) {
        post('/api/register')
        showToast('Registered', theme)
      }
    }, [submitted, theme])

    return <button onClick={() => setSubmitted(true)}>Submit</button>
  }

  // Correct: do it in the handler
  function Form() {
    const theme = useContext(ThemeContext)

    function handleSubmit() {
      post('/api/register')
      showToast('Registered', theme)
    }

    return <button onClick={handleSubmit}>Submit</button>
  }
  ```
- **Subscribe to an external store with `useSyncExternalStore`.** react.dev: "React has a purpose-built Hook for subscribing to an external store that is preferred instead." Declare `subscribe` outside the component: "If a different `subscribe` function is passed during a re-render, React will re-subscribe" (https://react.dev/reference/react/useSyncExternalStore). Its server snapshot is in [Hydration-safe reads](#hydration-safe-reads).
- **A fetch in an Effect needs cleanup against races.** Typing "hello" fast kicks off separate fetches with "no guarantee about which order the responses will arrive in"; "To fix the race condition, you need to add a cleanup function to ignore stale responses", the `let ignore = false;` flag set to `true` in cleanup. react.dev recommends a framework's data fetching or a client-side cache instead ("TanStack Query, useSWR, and React Router 6.4+", https://react.dev/reference/react/useEffect); data loading is in [DATA-AND-BUNDLES.md](DATA-AND-BUNDLES.md). React Doctor lists "async races, cancellation on unmount" under "Beyond the scan" [React Doctor, improve-react].
- **Initialize the app once, not per mount (P3).** "Components can remount and effects will re-run. Use a module-level guard or top-level init in the entry module instead." [Vercel, advanced-init-once]

  ```tsx
  let didInit = false

  function Comp() {
    useEffect(() => {
      if (didInit) return
      didInit = true
      loadFromStorage()
      checkAuthToken()
    }, [])

    // ...
  }
  ```

  react.dev's second form runs at module top level, `if (typeof window !== 'undefined') { // Check if we're running in the browser.` and then the init calls, with the caution "don't overuse this pattern. Keep app-wide initialization logic to root component modules like `App.js` or in your application's entry point."
- **An Effect that loops** updates some state, and "That state leads to a re-render, which causes the Effect's dependencies to change." First ask whether it syncs with an external system at all; "If you need to keep track of some data that isn't used by rendering, a ref (which doesn't trigger re-renders) might be more appropriate" (https://react.dev/reference/react/useEffect). React Doctor names this `no-self-updating-effect` [React Doctor, improve-react].

## Dependencies

- **Never suppress the dependency linter.** https://react.dev/reference/react/useEffect: "When dependencies don't match the code, there is a high risk of introducing bugs. By suppressing the linter, you 'lie' to React about the values your Effect depends on." Remove a dependency by proving it unnecessary (move the object or function inside the Effect or outside the component, or read it from an Effect Event). improve-react's Hard Rule 5 treats a deliberate `// eslint-disable-next-line react-doctor/…` as settled ("respect it, note it, don't report it") [React Doctor, improve-react]; for `exhaustive-deps`, react.dev's rule wins and a suppression is a lead to check. Missing deps mean "closures observe stale state" (`exhaustive-deps`, the source's HIGH, P1 here).
- **Depend on primitives (P3).** "Specify primitive dependencies instead of objects to minimize effect re-runs." [Vercel, rerender-dependencies]

  ```tsx
  // Incorrect: re-runs on any user field change
  useEffect(() => {
    console.log(user.id)
  }, [user])

  // Correct: re-runs only when id changes
  useEffect(() => {
    console.log(user.id)
  }, [user.id])

  // Incorrect: runs on width=767, 766, 765...
  useEffect(() => {
    if (width < 768) {
      enableMobileMode()
    }
  }, [width])

  // Correct: runs only on boolean transition
  const isMobile = width < 768
  useEffect(() => {
    if (isMobile) {
      enableMobileMode()
    }
  }, [isMobile])
  ```

  react.dev's reason: "If your Effect depends on an object or a function created during rendering, it might run too often" (https://react.dev/reference/react/useEffect).
- **One hook per independent task (P2).** "A combined hook reruns all tasks when any dependency changes, even if some tasks don't use the changed value." [Vercel, rerender-split-combined-hooks]

  ```tsx
  // Incorrect: both effects run when either dependency changes
  useEffect(() => {
    analytics.trackPageView(pathname)
    document.title = `${pageTitle} | My App`
  }, [pathname, pageTitle])

  // Correct: effects run independently
  useEffect(() => {
    analytics.trackPageView(pathname)
  }, [pathname])

  useEffect(() => {
    document.title = `${pageTitle} | My App`
  }, [pageTitle])
  ```

  The same split applies to a `useMemo` that filters and then sorts: filter on `[products, category]`, sort the filtered result on `[filteredProducts, sortOrder]`.
- **Strict Mode runs setup and cleanup one extra time in development.** "Even with empty dependencies, setup and cleanup will run one extra time in development to help you find bugs"; if that causes visible issues, "your cleanup function is missing some logic" (https://react.dev/reference/react/useEffect).

## useEffectEvent

`useEffectEvent` shipped in React 19.2 (https://react.dev/blog/2025/10/01/react-19-2). It splits the "event" part out of an Effect, so a value the event reads (a theme, a callback prop) stops being a dependency: "Similar to DOM events, Effect Events always 'see' the latest props and state." The blog's reason: without it, "most users just disable the lint rule and exclude the dependency. But that can lead to bugs".

- **Never list it in the deps (P3).** https://react.dev/reference/react/useEffectEvent: "Effect Event functions do not have a stable identity. Their identity intentionally changes on every render." Listing one "makes the effect re-run every render and triggers the React Hooks lint rule". [Vercel, advanced-effect-event-deps]

  ```tsx
  import { useEffect, useEffectEvent } from 'react'

  function ChatRoom({ roomId, onConnected }: {
    roomId: string
    onConnected: () => void
  }) {
    const handleConnected = useEffectEvent(onConnected)

    useEffect(() => {
      const connection = createConnection(roomId)
      connection.on('connected', handleConnected)
      connection.connect()

      return () => connection.disconnect()
    }, [roomId])
  }
  ```
- **Its limits.** "Effect Events can only be called from inside Effects or other Effect Events. Do not call them during rendering or pass them to other components or Hooks. The `eslint-plugin-react-hooks` linter enforces this restriction." "If you need a callback for event handlers or to pass to children, use a regular function or `useCallback` instead." Registering one as a listener inside the Effect is react.dev's own pattern (`window.addEventListener('pointermove', onMove)` inside `useEffect` with `[]`).
- **A latest callback inside a timer (P3).** [Vercel, advanced-use-latest] (the source titles it "useEffectEvent for Stable Callback Refs"; per react.dev above, the function is not stable, it reads the latest values):

  ```tsx
  function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
    const [query, setQuery] = useState('')
    const onSearchEvent = useEffectEvent(onSearch)

    useEffect(() => {
      const timeout = setTimeout(() => onSearchEvent(query), 300)
      return () => clearTimeout(timeout)
    }, [query])
  }
  ```
- **A window listener that subscribes once per event name (P3).** [Vercel, advanced-event-handler-refs] (the source says `useEffectEvent` "creates a stable function reference"; react.dev says the opposite, and the subscription is stable because the Effect's deps leave it out):

  ```tsx
  function useWindowEvent(event: string, handler: (e) => void) {
    const onEvent = useEffectEvent(handler)

    useEffect(() => {
      window.addEventListener(event, onEvent)
      return () => window.removeEventListener(event, onEvent)
    }, [event])
  }
  ```

  Before React 19.2, the same rule's ref form keeps the latest handler in a ref written in an Effect, and the listener reads `handlerRef.current(e)`:

  ```tsx
  function useWindowEvent(event: string, handler: (e) => void) {
    const handlerRef = useRef(handler)
    useEffect(() => {
      handlerRef.current = handler
    }, [handler])

    useEffect(() => {
      const listener = (e) => handlerRef.current(e)
      window.addEventListener(event, listener)
      return () => window.removeEventListener(event, listener)
    }, [event])
  }
  ```

## State updates

- **Updates that depend on current state use the updater form (P2).** "This prevents stale closures, eliminates unnecessary dependencies, and creates stable callback references." [Vercel, rerender-functional-setstate]

  Incorrect (requires state as dependency):

  ```tsx
  function TodoList() {
    const [items, setItems] = useState(initialItems)
    
    // Callback must depend on items, recreated on every items change
    const addItems = useCallback((newItems: Item[]) => {
      setItems([...items, ...newItems])
    }, [items])  // ❌ items dependency causes recreations
    
    // Risk of stale closure if dependency is forgotten
    const removeItem = useCallback((id: string) => {
      setItems(items.filter(item => item.id !== id))
    }, [])  // ❌ Missing items dependency - will use stale items!
    
    return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
  }
  ```

  Correct (stable callbacks, no stale closures):

  ```tsx
  function TodoList() {
    const [items, setItems] = useState(initialItems)
    
    // Stable callback, never recreated
    const addItems = useCallback((newItems: Item[]) => {
      setItems(curr => [...curr, ...newItems])
    }, [])  // ✅ No dependencies needed
    
    // Always uses latest state, no stale closure risk
    const removeItem = useCallback((id: string) => {
      setItems(curr => curr.filter(item => item.id !== id))
    }, [])  // ✅ Safe and stable
    
    return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
  }
  ```

  Direct sets are fine for "a static value: `setCount(0)`" or "props/arguments only: `setName(newName)`". With the React Compiler, "functional updates are still recommended for correctness". The source's "reduces memory leaks" has no react.dev backing and is left out. react.dev: the updater "must be pure, should take the pending state as its only argument", and React queues updaters and applies them in order (https://react.dev/reference/react/useState).
- **Expensive initial state goes in an initializer (P2).** "Without the function form, the initializer runs on every render even though the value is only used once." Use it for storage reads, "building data structures (indexes, maps), reading from the DOM, or performing heavy transformations"; skip it for `useState(0)`, `useState(props.value)` or `useState({})`. [Vercel, rerender-lazy-state-init]

  ```tsx
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(items))
  ```

  The source's other example reads `localStorage` in the initializer. Initializers run during render, which on a server-rendered page includes the server, where react.dev says `localStorage` data "can't possibly" be read; on an SSR page use [Hydration-safe reads](#hydration-safe-reads) instead.
- **Initializers and updaters run twice in Strict Mode** in development; "If your initializer function is pure (as it should be), this should not affect the behavior" (https://react.dev/reference/react/useState).
- **Don't mutate state or props, including when sorting.** `.sort()` inside `useMemo` mutates the `users` prop; use `.toSorted()` (or `[...items].sort()` for older targets), with `.toReversed()`, `.toSpliced()` and `.with()` for the other in-place methods [Vercel, js-tosorted-immutable]. MDN marks `toSorted()` Baseline Widely available since July 2023.

## Refs

- **A value that changes often and never shows on screen lives in a ref (P2).** "Updating a ref does not trigger a re-render." [Vercel, rerender-use-ref-transient-values]

  ```tsx
  function Tracker() {
    const lastXRef = useRef(0)
    const dotRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const onMove = (e: MouseEvent) => {
        lastXRef.current = e.clientX
        const node = dotRef.current
        if (node) {
          node.style.transform = `translateX(${e.clientX}px)`
        }
      }
      window.addEventListener('mousemove', onMove)
      return () => window.removeEventListener('mousemove', onMove)
    }, [])

    return (
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          background: 'black',
          transform: 'translateX(0px)',
        }}
      />
    )
  }
  ```

  The motion version (motion values, or a ref that writes the style) is in [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md#react-animate-without-re-rendering).
- **Don't read or write `ref.current` during render.** https://react.dev/reference/react/useRef: "Do not write _or read_ `ref.current` during rendering, except for initialization. This makes your component's behavior unpredictable." "Information that's used for rendering should be state instead."
- **Read a value at its point of use (P2).** "Don't subscribe to dynamic state (searchParams, localStorage) if you only read it inside callbacks." [Vercel, rerender-defer-reads]

  ```tsx
  function ShareButton({ chatId }: { chatId: string }) {
    const handleShare = () => {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      shareChat(chatId, { ref })
    }

    return <button onClick={handleShare}>Share</button>
  }
  ```

  The source's incorrect form calls `useSearchParams()` in the component and reads it only in the handler, which "subscribes to all searchParams changes".

## Keys and component identity

- **Keys come from the data.** https://react.dev/learn/rendering-lists: "Keys must be unique among siblings", and "Keys must not change or that defeats their purpose! Don't generate them while rendering." React Doctor's `no-array-index-as-key` ("insertion and reordering can attach state to the wrong row"), `no-random-key` ("every render remounts the item") and `jsx-key` ("React cannot reconcile siblings reliably") are its Bugs category [React Doctor, improve-react].
  - Index keys: "Index as a key often leads to subtle and confusing bugs." react.dev's exception: "a rare case where index as a key is acceptable because a poem's lines will never reorder."
  - Random keys: "do not generate keys on the fly, e.g. with `key={Math.random()}`", which recreates every component and DOM node and will "lose any user input inside the list items".
  - app-ui does the same for tables: "**Key rows by a stable id** (`getRowId: row => row.id`), so selection follows the item across sort, page and filter" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).
- **Never define a component inside a component (P1).** "Defining a component inside another component creates a new component type on every render. React sees a different component each time and fully remounts it, destroying all state and DOM." [Vercel, rerender-no-inline-components] react.dev: "always declare component functions at the top level, and don't nest their definitions" (https://react.dev/learn/preserving-and-resetting-state). React Doctor: `no-nested-component-definition` [React Doctor, improve-react].

  Incorrect (remounts on every render):

  ```tsx
  function UserProfile({ user, theme }) {
    // Defined inside to access `theme` - BAD
    const Avatar = () => (
      <img
        src={user.avatarUrl}
        className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'}
      />
    )

    // Defined inside to access `user` - BAD
    const Stats = () => (
      <div>
        <span>{user.followers} followers</span>
        <span>{user.posts} posts</span>
      </div>
    )

    return (
      <div>
        <Avatar />
        <Stats />
      </div>
    )
  }
  ```

  Correct (pass props instead):

  ```tsx
  function Avatar({ src, theme }: { src: string; theme: string }) {
    return (
      <img
        src={src}
        className={theme === 'dark' ? 'avatar-dark' : 'avatar-light'}
      />
    )
  }

  function Stats({ followers, posts }: { followers: number; posts: number }) {
    return (
      <div>
        <span>{followers} followers</span>
        <span>{posts} posts</span>
      </div>
    )
  }

  function UserProfile({ user, theme }) {
    return (
      <div>
        <Avatar src={user.avatarUrl} theme={theme} />
        <Stats followers={user.followers} posts={user.posts} />
      </div>
    )
  }
  ```

  Symptoms: "Input fields lose focus on every keystroke", "Animations restart unexpectedly", "`useEffect` cleanup/setup runs on every parent render", "Scroll position resets inside the component".
- **No number on the left of `&&` (P3).** https://react.dev/learn/conditional-rendering: "Don't put numbers on the left side of `&&`." "if the left side is `0`, then the whole expression gets that value (`0`), and React will happily render `0` rather than nothing." Fix: `messageCount > 0 && <p>New messages</p>`. Vercel uses a ternary, `{count > 0 ? <span className="badge">{count}</span> : null}`, and adds `NaN` [Vercel, rendering-conditional-render]. In React Native a stray string outside `<Text>` crashes the app; that rule is in [REACT-NATIVE.md](REACT-NATIVE.md#render-crashes).

## Controlled inputs

React Doctor's `no-uncontrolled-input` says only "controlled behavior drifts" [React Doctor, improve-react]. react.dev's rules are exact (https://react.dev/reference/react-dom/components/input):

- "An input cannot switch between being controlled or uncontrolled over its lifetime." A value loaded from an API or state "might be initialized to `null` or `undefined`. In that case, either set it to an empty string (`''`) initially, or pass `value={someValue ?? ''}`".
- "Every controlled input needs an `onChange` event handler that synchronously updates its backing value." `value` without `onChange` "will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`." Checkboxes use `checked` and `defaultChecked`.
- An input that only needs an initial value is uncontrolled: `<input defaultValue={something} />`.
- "When you use a controlled input, you set the state on every keystroke." If its owner re-renders a large tree, keep the state close to the input, or use `useDeferredValue` for the slow part ([RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#usedeferredvalue)). "Transition updates can't be used to control text inputs" (https://react.dev/reference/react/useTransition).

## Hydration-safe reads

https://react.dev/reference/react-dom/client/hydrateRoot: "`hydrateRoot()` expects the rendered content to be identical with the server-rendered content. You should treat mismatches as bugs and fix them." In the worst case, "event handlers can get attached to the wrong elements."

- **Reading `localStorage` in render breaks SSR.** "Server-side rendering will fail because `localStorage` is undefined." [Vercel, rendering-hydration-no-flicker]
- **A value from a browser store: `useSyncExternalStore` with a server snapshot.** `getServerSnapshot` "will be used only during server rendering and during hydration", "must be the same between the client and the server", and "If you omit this argument, rendering the component on the server will throw an error" (https://react.dev/reference/react/useSyncExternalStore). app-ui reads the theme this way: "Read the saved theme with `useSyncExternalStore` whose server snapshot is `"system"`, so server render and hydration agree" ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md)).
- **Different output on the client: two passes.** "Components that render something different on the client can read a state variable like `isClient`, which you can set to `true` in an Effect" (hydrateRoot page). The useEffect page's version is `didMount`, with: "Use this pattern sparingly. Keep in mind that users with a slow connection will see the initial content for quite a bit of time", and "In many cases, you can avoid the need for this by conditionally showing different things with CSS."
- **Text that legitimately differs: `suppressHydrationWarning` on that element only (P3).** For "random IDs, dates, locale/timezone formatting": `<span suppressHydrationWarning>{new Date().toLocaleString()}</span>`; "Do not use this to hide real bugs." [Vercel, rendering-hydration-suppress-warning] react.dev: "This only works one level deep, and is intended to be an escape hatch. Don't overuse it. React will **not** attempt to patch mismatched text content." React Doctor: "Do not use hydration-warning suppression as a flicker fix." [React Doctor, react-doctor-agent playbook]
- **Two views on a stored preference that flashes the default.**
  - Vercel: restoring in `useEffect` updates after hydration, "causing a visible flash of incorrect content"; its fix is an inline `<script dangerouslySetInnerHTML>` placed after the element that sets `className` from `localStorage` inside `try {} catch (e) {}` before React hydrates, and it claims "No flickering, no hydration mismatch" [Vercel, rendering-hydration-no-flicker]. The script rewrites an attribute React rendered, so the client DOM differs from the server render; react.dev's sanctioned routes are the three above.
  - app-ui (the owner's design, kept): "**Restore once, after mount,** so the server render and the first browser render match (both show the default; stored values in `localStorage` show after hydration)" ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#saving-and-persisted-view-state)). For the locale switch the owner does use a pre-hydration script: "A head script sets `html[data-locale-transition="reveal"]` before hydration, so the reloaded page paints already covered and then uncovers" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)).
- **Version and minimize what you store (P2).** Prefix the key with a version (`userConfig:${VERSION}`), migrate the old key and remove it, store only the fields the UI needs ("prevents storing tokens/PII/internal flags"), and wrap every `getItem` and `setItem` in try/catch [Vercel, client-localstorage-schema]. The source's reason that `getItem()` and `setItem()` "throw in incognito/private browsing (Safari, Firefox)" is not what MDN says: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage lists `SecurityError` for an invalid origin or when "the user has configured the browsers to prevent the page from persisting data", and says private-mode data "is cleared when the last 'private' tab is closed". Keep the try/catch for blocked storage and the source's other cases ("when quota exceeded, or when disabled").

## Prove it

Every Effect in the change syncs with something outside React (a subscription, a timer, the DOM, the network) and nothing it sets could be computed during render; `eslint-plugin-react-hooks` reports no dependency or Effect Event errors and the diff adds no `eslint-disable` for them; no `useEffectEvent` result appears in a deps array or is passed to a child; every Effect that fetches ignores stale responses, shown by typing fast and seeing the last query's result; with Strict Mode on, mounting twice leaves one subscription and no duplicate request; list items keep their input and focus across insert, delete and reorder; no component is declared inside another; a count of `0` renders nothing; each controlled input types normally and never logs the controlled-to-uncontrolled warning; and a server-rendered page hydrates with no mismatch warning in the console, including with a stored preference set.
