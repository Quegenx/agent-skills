# Error boundaries and Suspense

Where a React tree catches its failures and its waits: an error boundary swaps a crashed subtree for a fallback, a Suspense boundary swaps a loading one for a placeholder, and both are placed by deciding which parts of the screen should fail or appear together. The rules and caveats come from react.dev; the Server Component placement pattern comes from Vercel's react-best-practices skill (MIT), and the audit prompt from React Doctor's improve-react. Reporting caught errors to Sentry is in [the sentry skill's REACT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/sentry/REACT.md#error-boundaries); loading states, skeletons and prefetching are in [web-performance's BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#loading-states).

**Contents:** [Error boundaries](#error-boundaries) · [What a boundary does not catch](#what-a-boundary-does-not-catch) · [Where error boundaries go](#where-error-boundaries-go) · [What activates Suspense](#what-activates-suspense) · [Where Suspense boundaries go](#where-suspense-boundaries-go) · [Keep revealed content on screen](#keep-revealed-content-on-screen) · [Suspense on the server](#suspense-on-the-server) · [Prove it](#prove-it)

## Error boundaries

[https://react.dev/reference/react/Component](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) "By default, if your application throws an error during rendering, React will remove its UI from the screen. To prevent this, you can wrap a part of your UI into an *Error Boundary*." It needs `static getDerivedStateFromError` to switch to the fallback, and optionally `componentDidCatch` to report:

```js
import * as React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logErrorToMyService(
      error,
      // Example "componentStack":
      //   in ComponentThatThrows (created by App)
      //   in ErrorBoundary (created by App)
      //   in div (created by App)
      //   in App
      info.componentStack,
      // Warning: `captureOwnerStack` is not available in production.
      React.captureOwnerStack(),
    );
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

```js
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  <Profile />
</ErrorBoundary>
```

- **Only a class can be one:** "There is currently no way to write an Error Boundary as a function component. However, you don't have to write the Error Boundary class yourself. For example, you can use `react-error-boundary` instead." Or write one `ErrorBoundary` class and reuse it everywhere.
- `getDerivedStateFromError` "should be a pure function"; side effects such as analytics go in `componentDidCatch`. Calling `setState` in `componentDidCatch` to show the fallback "is deprecated".
- **Development and production differ:** in development, caught errors still bubble to `window`, so `window.onerror` sees them; in production they don't, and "any ancestor error handler will only receive errors not explicitly caught by `componentDidCatch`."
- **What reaches a boundary besides render errors:** a rejected promise read with `use` ("the fallback of the nearest Error Boundary will be displayed", [https://react.dev/reference/react/use](https://react.dev/reference/react/use)); a function passed to `startTransition` that "throws an error or returns a rejected Promise", if the component calling `useTransition` is inside the boundary ([https://react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-error-boundary)); and a throwing `dispatchAction` from `useActionState`, which "cancels all queued actions and shows the nearest Error Boundary". The Actions behind these are in [REACT-19.md](REACT-19.md#actions).

## What a boundary does not catch

[https://react.dev/reference/react/Component](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) "Error boundaries do not catch errors for:"

- Event handlers.
- Server side rendering.
- "Errors thrown in the error boundary itself (rather than its children)".
- "Asynchronous code (e.g. `setTimeout` or `requestAnimationFrame` callbacks); an exception is the usage of the `startTransition` function returned by the `useTransition` Hook."

So errors in event handlers and in async code outside a Transition need their own handling; a boundary is not a net for them.

## Where error boundaries go

- [https://react.dev/reference/react/Component](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) "You don't need to wrap every component into a separate Error Boundary. When you think about the granularity of Error Boundaries, consider where it makes sense to display an error message. For example, in a messaging app, it makes sense to place an Error Boundary around the list of conversations. It also makes sense to place one around every individual message. However, it wouldn't make sense to place a boundary around every avatar."
- A boundary must sit above the component that throws, since it doesn't catch its own errors.
- [React Doctor, improve-react] An audit hunts "missing error and Suspense boundaries around failure-prone or loading-sensitive subtrees", and lists "an error boundary around a crash-prone subtree" and "a Suspense boundary to remove a layout jump" as missed opportunities, apart from defects.

## What activates Suspense

[https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense#what-activates-a-suspense-boundary) A boundary shows its `fallback` while its children aren't ready, triggered by:

- "Lazy-loading component code with `lazy`."
- "Reading a Promise with `use`, including data streamed from Server Components or loaded through a Suspense-enabled framework." Without a framework, the promise must be "cached so the same instance is reused across renders" ([REACT-19.md](REACT-19.md#use-reads-a-promise)).

Caveats from the same page:

- "Suspense does not detect when data is fetched inside an Effect or event handler."
- "React does not preserve any state for renders that got suspended before they were able to mount for the first time." It retries the tree from scratch.
- Content already on screen that suspends again goes back to the fallback "unless the update causing it was caused by `startTransition` or `useDeferredValue`."
- When visible content hides again, React cleans up its layout Effects and fires them again when it reappears, so DOM measurements don't run while it is hidden.
- If the `fallback` itself suspends, the closest parent boundary takes over.

## Where Suspense boundaries go

- **One boundary, one reveal** ([https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense#revealing-content-together-at-once)): "By default, the whole tree inside Suspense is treated as a single unit." If one child suspends, all of them show the fallback, and "after all of them are ready to be displayed, they will all appear together at once." The loaders don't have to be direct children; whatever shares the closest boundary reveals together.
- **Nested boundaries, a sequence:** "When a component suspends, the closest parent Suspense component shows the fallback." Nesting gives a loading sequence:

  ```js
  <Suspense fallback={<BigSpinner />}>
    <Biography />
    <Suspense fallback={<AlbumsGlimmer />}>
      <Panel>
        <Albums />
      </Panel>
    </Suspense>
  </Suspense>
  ```

  "With this change, displaying the `Biography` doesn't need to 'wait' for the `Albums` to load."
- **Not around every component:** "Don't put a Suspense boundary around every component. Suspense boundaries should not be more granular than the loading sequence that you want the user to experience. If you work with a designer, ask them where the loading states should be placed."
- **Around the part that waits, not the page** [Vercel, react-best-practices]: "Instead of awaiting data in async components before returning JSX, use Suspense boundaries to show the wrapper UI faster while data loads." These are Server Components: "Async Components are a new feature of Server Components that allow you to `await` in render" ([https://react.dev/reference/rsc/server-components](https://react.dev/reference/rsc/server-components)).

  **Incorrect: wrapper blocked by data fetching**

  ```tsx
  async function Page() {
    const data = await fetchData() // Blocks entire page

    return (
      <div>
        <div>Sidebar</div>
        <div>Header</div>
        <div>
          <DataDisplay data={data} />
        </div>
        <div>Footer</div>
      </div>
    )
  }
  ```

  **Correct: wrapper shows immediately, data streams in**

  ```tsx
  function Page() {
    return (
      <div>
        <div>Sidebar</div>
        <div>Header</div>
        <div>
          <Suspense fallback={<Skeleton />}>
            <DataDisplay />
          </Suspense>
        </div>
        <div>Footer</div>
      </div>
    )
  }

  async function DataDisplay() {
    const data = await fetchData() // Only blocks this component
    return <div>{data.content}</div>
  }
  ```

  Or start one fetch in the Server Component without awaiting it and hand the promise to several children that each call `use(dataPromise)`: "Both components share the same promise, so only one fetch occurs." That form relies on the promise being created in a Server Component; a Client Component can't create it in render (see [REACT-19.md](REACT-19.md#use-reads-a-promise)).

  When not to [Vercel, react-best-practices]: "Critical data needed for layout decisions (affects positioning)", "SEO-critical content above the fold", "Small, fast queries where suspense overhead isn't worth it", and "When you want to avoid layout shift (loading → content jump)". "**Trade-off:** Faster initial paint vs potential layout shift."

## Keep revealed content on screen

[https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense#preventing-already-revealed-content-from-hiding)

- **Navigate in a Transition:** a page that suspends near a root boundary replaces the whole layout with its fallback. Wrapping the navigation update in `startTransition` "tells React that the state transition is not urgent, and it's better to keep showing the previous page instead of hiding any already revealed content." "A Transition doesn't wait for *all* content to load. It only waits long enough to avoid hiding already revealed content"; a new nested boundary still shows its fallback. "Suspense-enabled routers are expected to wrap the navigation updates into Transitions by default." `useTransition` adds `isPending` for an indicator.
- **Reset on different content with a `key`:** for another user's profile, the fallback is right, not the previous profile: `<ProfilePage key={queryParams.id} />`. "The `key` can go on the boundary itself or on a component above it. Suspense-integrated routers should do this automatically."
- **Stale results while new ones load:** pass `useDeferredValue(query)` to the suspending list so the previous results stay up, and dim them while `query !== deferredQuery`. "Transitions mark the whole update as non-urgent so they are typically used by frameworks and router libraries for navigation. Deferred values, on the other hand, are mostly useful in application code where you want to mark a part of UI as non-urgent and let it 'lag behind' the rest of the UI."

## Suspense on the server

[https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content) With streaming server rendering, "If a component throws an error on the server, React will not abort the server render. Instead, it will find the closest `<Suspense>` component above it and include its fallback (such as a spinner) into the generated server HTML." The client renders it again: if it errors there too, the closest error boundary shows; if not, the user never sees the server error.

## Prove it

- Throw from a component under each error boundary (a temporary `throw` in development): the fallback replaces only that region, and the error reaches the reporter in `componentDidCatch` or the root handler.
- Every boundary is a class or `react-error-boundary`; none is expected to catch an event handler, a `setTimeout` or its own render.
- Failures in event handlers and in async work outside a Transition are handled in that code, not left for a boundary.
- Each Suspense boundary matches a loading state the design shows; parts that must appear together share one, and nothing is wrapped one component at a time.
- Navigating keeps the layout on screen (the update runs in a Transition or a Suspense-enabled router), and moving to different content of the same kind resets the boundary through a `key`.
- No data fetched in an Effect is expected to trigger Suspense.
