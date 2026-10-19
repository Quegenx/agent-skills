# React 19 APIs

What React 19 changed in everyday component code: `ref` is a plain prop, ref callbacks return a cleanup, `<Context>` renders as its own provider, `use` reads a promise or a context (conditionally), and Actions handle pending state, errors, forms and optimistic updates through `useTransition`, `useActionState`, `useFormStatus` and `useOptimistic`. Every claim is checked against react.dev; Vercel's composition-patterns skill (MIT) supplied the `ref` and `use` rules, and its claim that "`use()` replaces `useContext()`" is corrected below. Where errors from Actions and `use` land is in [BOUNDARIES-AND-SUSPENSE.md](BOUNDARIES-AND-SUSPENSE.md); composing components around context is in [COMPOSITION.md](COMPOSITION.md).

**Contents:** [ref as a prop](#ref-as-a-prop) · [Ref callback cleanup](#ref-callback-cleanup) · [Context as a provider](#context-as-a-provider) · [use() reads context conditionally; it does not replace useContext](#use-reads-context-conditionally-it-does-not-replace-usecontext) · [use() reads a promise](#use-reads-a-promise) · [Actions](#actions) · [useActionState](#useactionstate) · [Form actions and useFormStatus](#form-actions-and-useformstatus) · [useOptimistic](#useoptimistic) · [Prove it](#prove-it)

The source gates its React 19 rule with "**React 19+ only.** Skip this if you're on React 18 or earlier." [Vercel, composition-patterns]; everything in this file needs React 19.

## ref as a prop

[https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop) "Starting in React 19, you can now access `ref` as a prop for function components." "New function components will no longer need `forwardRef` ... In future versions we will deprecate and remove `forwardRef`." The forwardRef page ([https://react.dev/reference/react/forwardRef](https://react.dev/reference/react/forwardRef)): "In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead. `forwardRef` will be deprecated in a future release."

[Vercel, composition-patterns]

**Incorrect: forwardRef in React 19**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**Correct: ref as a regular prop**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

Class components are the exception: "`ref`s passed to classes are not passed as props since they reference the component instance." (React 19 blog)

## Ref callback cleanup

[https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs) "We now support returning a cleanup function from `ref` callbacks":

```js
<input
  ref={(ref) => {
    // ref created
    // NEW: return a cleanup function to reset
    // the ref when element is removed from DOM.
    return () => {
      // ref cleanup
    };
  }}
/>
```

- "When the component unmounts, React will call the cleanup function returned from the `ref` callback. This works for DOM refs, refs to class components, and `useImperativeHandle`."
- Without a cleanup, React still calls the callback with `null` when the ref detaches; with one, it skips that call. "In future versions, we will deprecate calling refs with `null` when unmounting components."
- **TypeScript rejects implicit returns:** "returning anything else from a `ref` callback will now be rejected by TypeScript. The fix is usually to stop using implicit returns": `<div ref={current => (instance = current)} />` becomes `<div ref={current => {instance = current}} />`. The codemod is `no-implicit-ref-callback-return` from types-react-codemod.
- **A new function each render re-runs it** ([https://react.dev/reference/react-dom/components/common](https://react.dev/reference/react-dom/components/common#ref-callback)): "When you pass a *different* `ref` callback, React will call the *previous* callback's cleanup function if provided." An inline arrow is a different function on every render, so it is cleaned up and set up again on every re-render "unless you pass the same function reference".
- **Strict Mode:** React "will **run one extra development-only setup+cleanup cycle** before the first real setup", so the cleanup must undo whatever the setup did.

## Context as a provider

[https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#context-as-a-provider) "In React 19, you can render `<Context>` as a provider instead of `<Context.Provider>`":

```js
const ThemeContext = createContext('');

function App({children}) {
  return (
    <ThemeContext value="dark">
      {children}
    </ThemeContext>
  );
}
```

"New Context providers can use `<Context>` and we will be publishing a codemod to convert existing providers. In future versions we will deprecate `<Context.Provider>`." The createContext page calls `SomeContext.Provider` "a legacy way to provide the context value before React 19" ([https://react.dev/reference/react/createContext](https://react.dev/reference/react/createContext)). It is not deprecated yet. app-ui still uses `<SidebarContext.Provider value={contextValue}>` ([sidebar-context.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/navigation/sidebar/sidebar-context.tsx)); agent-chat-ui uses the new form, `<AgentChatLinkDetailsContext value={agentChatLinkDetailsOf(messages)}>`.

## use() reads context conditionally; it does not replace useContext

The source says "`use()` replaces `useContext()`" and its quick reference says "use `use()` instead of `useContext()`" [Vercel, composition-patterns]. react.dev says neither: the `use` and `useContext` pages ([https://react.dev/reference/react/use](https://react.dev/reference/react/use), [https://react.dev/reference/react/useContext](https://react.dev/reference/react/useContext)) don't deprecate `useContext` or prefer `use`. Both are current. What `use` adds:

- "Unlike `useContext`, `use` can be called within loops and conditional statements like `if`." The React 19 blog's example reads context after an early return, which "would not work with useContext":

  ```js
  function Heading({children}) {
    if (children == null) {
      return null;
    }

    // This would not work with useContext
    // because of the early return.
    const theme = use(ThemeContext);
    return (
      <h1 style={{color: theme.color}}>
        {children}
      </h1>
    );
  }
  ```

- The value comes from the closest provider above; with none, it is the `defaultValue` passed to `createContext`.
- Caveats from the `use` page: "`use` must be called inside a Component or a Hook." and "Reading context with `use` is not supported in Server Components."

app-ui and agent-chat-ui read context with `useContext` (`const context = useContext(SidebarContext);` in sidebar-context.tsx); agent-chat-ui's markdown reads `use(AgentChatLinkDetailsContext)`. Neither is stale.

## use() reads a promise

[https://react.dev/reference/react/use](https://react.dev/reference/react/use#use-promise) "The component calling `use` *suspends* while the Promise is pending. Despite its name, `use` is not a Hook." Inside a Suspense boundary the fallback shows while it is pending; "If the Promise is rejected, the fallback of the nearest Error Boundary will be displayed."

```js
function Comments({commentsPromise}) {
  // `use` will suspend until the promise resolves.
  const comments = use(commentsPromise);
  return comments.map(comment => <p key={comment.id}>{comment}</p>);
}

function Page({commentsPromise}) {
  // When `use` suspends in Comments,
  // this Suspense boundary will be shown.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

- **The promise must be cached:** "Promises passed to `use` must be cached so the same Promise instance is reused across re-renders." The React 19 blog: "`use` does not support promises created in render", and React warns "A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework."
- "`use` cannot be called inside a try-catch block. Instead, wrap your component in an Error Boundary".
- "When passing a Promise from a Server Component to a Client Component, its resolved value must be serializable."

## Actions

[https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#actions) "In React 19, we're adding support for using async functions in transitions to handle pending states, errors, forms, and optimistic updates automatically." "By convention, functions that use async transitions are called 'Actions'."

```js
// Using pending state from Actions
function UpdateName({}) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    })
  };

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

- "The async transition will immediately set the `isPending` state to true, make the async request(s), and switch `isPending` to false after any transitions."
- What Actions manage: a pending state that "automatically resets when the final state update is committed"; optimistic updates through `useOptimistic`; error handling "so you can display Error Boundaries when a request fails, and revert optimistic updates to their original value automatically"; and forms, whose `action` and `formAction` props take functions.
- **State set after `await` is not a Transition,** and "Actions within a Transition do not guarantee execution order" ([https://react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition)); both, with the official form, are in [RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#transitions). The blog's `setError` above sits after an `await` without that wrap.

app-ui owns form pending the same way: "Own pending with a transition (`useTransition`), so it clears however the action ends." ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md))

## useActionState

[https://react.dev/reference/react/useActionState](https://react.dev/reference/react/useActionState) `useActionState(reducerAction, initialState, permalink?)` returns `[state, dispatchAction, isPending]`: the last result of the Action, a function to call inside an Action, and whether any dispatched Action is pending. The React 19 blog's form version:

```js
// Using <form> Actions and useActionState
function ChangeName({ name, setName }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) {
        return error;
      }
      redirect("/path");
      return null;
    },
    null,
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>Update</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

- `reducerAction` gets the previous state and the payload, and "Unlike reducers in `useReducer`, the `reducerAction` can be async and perform side effects". It "is not invoked twice in `<StrictMode>`".
- "React queues and executes multiple calls to `dispatchAction` sequentially. Each call to `reducerAction` receives the result of the previous call."
- "`dispatchAction` must be called from an Action": wrap it in `startTransition` or pass it to an Action prop such as `<form action>`; other calls log an error in development.
- "If `dispatchAction` throws an error, React cancels all queued actions and shows the nearest Error Boundary."
- "If you set state after `await` in the `reducerAction` you currently need to wrap the state update in an additional `startTransition`."
- The return type must match `initialState`; with Server Functions, `initialState` and the payload must be serializable. With `permalink`, "If `reducerAction` is a Server Function and the form is submitted before the JavaScript bundle loads, the browser will navigate to the specified permalink URL rather than the current page's URL."
- It "was previously called `ReactDOM.useFormState` in the Canary releases", now deprecated (React 19 blog).

## Form actions and useFormStatus

[https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19#form-actions) React DOM accepts functions as the `action` and `formAction` props of `<form>`, `<input>` and `<button>`. "When a `<form>` Action succeeds, React will automatically reset the form for uncontrolled components. If you need to reset the `<form>` manually, you can call the new `requestFormReset` React DOM API."

[https://react.dev/reference/react-dom/hooks/useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus) lets a design-system component read its form "as if the form was a Context provider":

```js
import {useFormStatus} from 'react-dom';

function DesignButton() {
  const {pending} = useFormStatus();
  return <button type="submit" disabled={pending} />
}
```

- It returns `pending`, `data` (a `FormData`, or `null` with no active submission), `method` (`'get'` or `'post'`) and `action`.
- "The `useFormStatus` Hook must be called from a component that is rendered inside a `<form>`." It "will only return status information for a parent `<form>`. It will not return status information for any `<form>` rendered in that same component or children components." The button that reads it is its own component inside the form.

## useOptimistic

[https://react.dev/reference/react/useOptimistic](https://react.dev/reference/react/useOptimistic) `useOptimistic(value, reducer?)` returns `[optimisticState, setOptimistic]`; the optimistic state "is equal to `value` unless an Action is pending". The React 19 blog's example:

```js
function ChangeName({currentName, onUpdateName}) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async formData => {
    const newName = formData.get("name");
    setOptimisticName(newName);
    const updatedName = await updateName(newName);
    onUpdateName(updatedName);
  };

  return (
    <form action={submitAction}>
      <p>Your name is: {optimisticName}</p>
      <p>
        <label>Change Name:</label>
        <input
          type="text"
          name="name"
          disabled={currentName !== optimisticName}
        />
      </p>
    </form>
  );
}
```

- "The `set` function must be called inside an Action. If you call the setter outside an Action, React will show a warning and the optimistic state will briefly render."
- "There's no extra render to 'clear' the optimistic state. The optimistic and real state converge in the same render when the Transition completes." If the save returns a different value than the optimistic one, both show the returned value.
- **On failure:** "If the Action throws an error, the Transition still ends, and React renders with whatever `value` currently is." Since the parent usually updates `value` only on success, the UI goes back to what it showed before; "You can catch the error to show a message to the user."
- With a reducer, `useOptimistic(items, fn)`, "If `items` changes while the Action is pending, React re-runs your `reducer` with the new `items`", keeping the optimistic additions on top of the latest data. The reducer and updater functions must be pure.

app-ui does optimistic state with its own override map instead: "An override map keyed by item id applies a status change over every list and surface that shows the item, until they are read again" ([app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#optimistic-then-honest)).

## Prove it

- No new `forwardRef`; components take `ref` as a prop. No ref callback with an implicit return (TypeScript flags it); every ref callback that sets something up returns its cleanup, and it survives Strict Mode's extra setup and cleanup.
- No review comment or rewrite claims `useContext` is deprecated; `use` is chosen where context is read after an early return or in a branch, never in a Server Component.
- Every promise passed to `use` comes from a cache, a framework or a Server Component, not from the component's own render; no `use` sits inside `try`.
- Every state update after an `await` inside `startTransition` or a `reducerAction` is wrapped in its own `startTransition`; `dispatchAction` and `setOptimistic` are only called inside an Action.
- A component reading `useFormStatus` renders inside the form it reports on. A failing Action is caught (shown to the user) or reaches an error boundary, and the optimistic value falls back to the stored one.
