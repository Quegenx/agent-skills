# Component composition

How to shape a component's API so it grows without a pile of flags: pass props first, then `children`, and reach for context only when neither works; give each mode its own explicit component instead of a boolean; build complex widgets as compound components over one shared context; lift their state into a provider so siblings can reach it. The patterns and code come from Vercel's composition-patterns skill (MIT), fixed where its own code breaks (a `null` context destructured, a context value rebuilt every render, a `Composer.Context` that doesn't exist, an undeclared `sync`); the order of tools and the memo advice come from react.dev. React 19's `use`, `<Context value>` and `ref` as a prop are in [REACT-19.md](REACT-19.md).

**Contents:** [Props, then children, then context](#props-then-children-then-context) · [Explicit variants, not boolean props](#explicit-variants-not-boolean-props) · [Compound components](#compound-components) · [One context interface: state, actions, meta](#one-context-interface-state-actions-meta) · [The provider is the only place that knows the state](#the-provider-is-the-only-place-that-knows-the-state) · [Lift state into the provider](#lift-state-into-the-provider) · [Children over render props](#children-over-render-props) · [Prove it](#prove-it)

Severity: the source ranks these rules CRITICAL, HIGH and MEDIUM, and its own files disagree (its SKILL.md calls component architecture HIGH, the rule file CRITICAL). A review finding from them is written on the P0 to P3 scale of [code-review's REVIEWER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REVIEWER.md): CRITICAL and HIGH as P1, MEDIUM as P2, and P0 only for a finding that blocks the primary task.

The examples mix React Native and web (`TextInput`, `onChangeText` and `onPress` inside a `<form>`), as the source does: read them as the pattern, not as code that runs on either platform.

## Props, then children, then context

[https://react.dev/learn/passing-data-deeply-with-context](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context)

- "**Just because you need to pass some props several levels deep doesn't mean you should put that information into context.**"
- "**Start by passing props.** If your components are not trivial, it's not unusual to pass a dozen props down through a dozen components. It may feel like a slog, but it makes it very clear which components use which data!"
- "**Extract components and pass JSX as `children` to them.**" Data passed through layers that don't use it "often means that you forgot to extract some components along the way": instead of `<Layout posts={posts} />`, "make `Layout` take `children` as a prop, and render `<Layout><Posts posts={posts} /></Layout>`."
- "If neither of these approaches works well for you, consider context." The page's use cases: theming, the current account, routing, and managing state with a reducer plus context. "In general, if some information is needed by distant components in different parts of the tree, it's a good indication that context will help you."

## Explicit variants, not boolean props

[Vercel, composition-patterns] "Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize component behavior. Each boolean doubles possible states and creates unmaintainable conditional logic. Use composition instead."

**Incorrect: boolean props create exponential complexity**

```tsx
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header />
      <Input />
      {isDMThread ? (
        <AlsoSendToDMField id={dmId} />
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} />
      ) : null}
      {isEditing ? (
        <EditActions />
      ) : isForwarding ? (
        <ForwardActions />
      ) : (
        <DefaultActions />
      )}
      <Footer onSubmit={onSubmit} />
    </form>
  )
}
```

**Correct: composition eliminates conditionals**

```tsx
// Channel composer
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Thread composer - adds "also send to channel" field
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <AlsoSendToChannelField id={channelId} />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Edit composer - different footer actions
function EditComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.CancelEdit />
        <Composer.SaveEdit />
      </Composer.Footer>
    </Composer.Frame>
  )
}
```

"Each variant is explicit about what it renders. We can share internals without sharing a single monolithic parent."

At the call site the same rule reads [Vercel, composition-patterns]: not `<Composer isThread isEditing={false} channelId='abc' showAttachments showFormatting={false} />` ("What does this component actually render?") but `<ThreadComposer channelId="abc" />`, `<EditMessageComposer messageId="xyz" />` or `<ForwardMessageComposer messageId="123" />`. Each variant wraps its own provider around the shared parts:

```tsx
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input />
        <AlsoSendToChannelField channelId={channelId} />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.Submit />
        </Composer.Footer>
      </Composer.Frame>
    </ThreadProvider>
  )
}
```

"Each variant is explicit about: What provider/state it uses; What UI elements it includes; What actions are available. No boolean prop combinations to reason about. No impossible states." The same rule outside React (a flag added to a shared helper so one caller behaves differently) is in [refactoring's DESIGN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DESIGN.md).

app-ui does it differently: "A screen that needs a new look gets a variant on the component" ([app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)), a `variant` prop such as `variant?: "legend" | "label"` in field.tsx, and booleans that switch what renders, such as `showCloseButton?: boolean` in [sheet.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/feedback/dialog/sheet.tsx) and `showPrevious?: boolean` in [date-range-month.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/forms/date-range/date-range-month.tsx). They overlap where app-ui's variant is a look and Vercel's target is a behavior mode (thread, edit, forward); on booleans that switch what renders, the two disagree, and app-ui's components keep theirs.

## Compound components

[Vercel, composition-patterns] "Structure complex components as compound components with a shared context. Each subcomponent accesses shared state via context, not props. Consumers compose the pieces they need." The alternative it rejects is one `Composer({ renderHeader, renderFooter, renderActions, showAttachments, showFormatting, showEmojis })` that branches on each.

The source's version creates the context with a `null` default and destructures `use(ComposerContext)` directly: outside a provider that destructures `null` and throws a `TypeError`, and strict TypeScript rejects it. It also builds `{ state, actions, meta }` fresh on every render. Corrected below: a guarded hook throws a clear error (the shape of app-ui's `useSidebar` in [sidebar-context.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/navigation/sidebar/sidebar-context.tsx)), and the value is memoized as [https://react.dev/reference/react/useContext](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions) recommends:

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

// Throws outside a ComposerProvider instead of destructuring null.
function useComposer() {
  const context = use(ComposerContext)
  if (!context) {
    throw new Error('useComposer must be used within a ComposerProvider.')
  }
  return context
}

function ComposerProvider({ children, state, actions, meta }: ProviderProps) {
  const value = useMemo(() => ({ state, actions, meta }), [state, actions, meta])
  return <ComposerContext value={value}>{children}</ComposerContext>
}

function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}</form>
}

function ComposerInput() {
  const {
    state,
    actions: { update },
    meta: { inputRef },
  } = useComposer()
  return (
    <TextInput
      ref={inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}

function ComposerSubmit() {
  const {
    actions: { submit },
  } = useComposer()
  return <Button onPress={submit}>Send</Button>
}

// Export as compound component
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
  Attachments: ComposerAttachments,
  Formatting: ComposerFormatting,
  Emojis: ComposerEmojis,
}
```

Usage:

```tsx
<Composer.Provider state={state} actions={actions} meta={meta}>
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Submit />
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

"Consumers explicitly compose exactly what they need. No hidden conditionals. And the state, actions and meta are dependency-injected by a parent provider, allowing multiple usages of the same component structure."

- **Why memoize the value:** a value built in render "will be a *different* object pointing at a *different* function, so React will also have to re-render all components deep in the tree that call `useContext(AuthContext)`" (react.dev, useContext). The rule and its quotes are in [RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#context). The `useMemo` above only holds if `actions` and `meta` are themselves stable, so the providers below memoize them too.
- **The default value** ([https://react.dev/reference/react/createContext](https://react.dev/reference/react/createContext)): "If you don't have any meaningful default value, specify `null`. The default value is meant as a 'last resort' fallback." A `null` default is fine; reading it without a check is the bug.
- **The namespace object:** `Composer.Input` is the source's export style. app-ui exports each part by its own name instead (`FieldContent`, `FieldTitle` and the rest from [field.tsx](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/reference/components/ui/forms/fields/field.tsx)), matching this repo's rule "Prefer direct named exports and imports"; the parts above already have searchable names (`ComposerInput`) to export that way.
- app-ui and agent-chat-ui read context with `useContext` and mostly provide it with `<X.Provider value>` (`<SidebarContext.Provider value={contextValue}>` in sidebar-context.tsx); both forms are current, see [REACT-19.md](REACT-19.md#use-reads-context-conditionally-it-does-not-replace-usecontext).

## One context interface: state, actions, meta

[Vercel, composition-patterns] "Define a **generic interface** for your component context with three parts: `state`, `actions`, and `meta`. This interface is a contract that any provider can implement, enabling the same UI components to work with completely different state implementations." "**Core principle:** Lift state, compose internals, make state dependency-injectable."

```tsx
interface ComposerState {
  input: string
  attachments: Attachment[]
  isSubmitting: boolean
}

interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void
  submit: () => void
}

interface ComposerMeta {
  inputRef: React.RefObject<TextInput>
}

interface ComposerContextValue {
  state: ComposerState
  actions: ComposerActions
  meta: ComposerMeta
}
```

The rejected form is a part tied to one store: `const { input, setInput } = useChannelComposerState()` inside `ComposerInput` ("Tightly coupled to a specific hook"). With the interface, two providers serve the same parts. The source passes fresh `actions` and `meta` literals on every render (and renders `<ComposerContext value>` directly); corrected here, they are memoized and passed to `Composer.Provider` so the context value stays stable ([https://react.dev/reference/react/useContext](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)):

```tsx
// Provider A: Local state for ephemeral forms
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const inputRef = useRef(null)
  const submit = useForwardMessage()
  const actions = useMemo(() => ({ update: setState, submit }), [submit])
  const meta = useMemo(() => ({ inputRef }), [])

  return (
    <Composer.Provider state={state} actions={actions} meta={meta}>
      {children}
    </Composer.Provider>
  )
}

// Provider B: Global synced state for channels
function ChannelProvider({ channelId, children }: Props) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)
  const actions = useMemo(() => ({ update, submit }), [update, submit])
  const meta = useMemo(() => ({ inputRef }), [])

  return (
    <Composer.Provider state={state} actions={actions} meta={meta}>
      {children}
    </Composer.Provider>
  )
}
```

`actions` stays stable only if `useForwardMessage` and `useGlobalChannel` return stable functions. "The UI is reusable bits you compose together. The state is dependency-injected by the provider. Swap the provider, keep the UI."

Whether these manual `useMemo` calls stay under React Compiler is in [RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#the-react-compiler).

## The provider is the only place that knows the state

[Vercel, composition-patterns] "The provider component should be the only place that knows how state is managed. UI components consume the context interface; they don't know if state comes from useState, Zustand, or a server sync."

**Incorrect: UI coupled to state implementation** (the source's version calls an undeclared `sync`; here it uses the functions it destructured)

```tsx
function ChannelComposer({ channelId }: { channelId: string }) {
  // UI component knows about global state implementation
  const state = useGlobalChannelState(channelId)
  const { submit, updateInput } = useChannelSync(channelId)

  return (
    <Composer.Frame>
      <Composer.Input
        value={state.input}
        onChange={(text) => updateInput(text)}
      />
      <Composer.Submit onPress={() => submit()} />
    </Composer.Frame>
  )
}
```

**Correct: state management isolated in the provider.** `ChannelProvider` (above) wraps `Composer.Provider`; the UI renders only the parts:

```tsx
// UI component only knows about the context interface
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// Usage
function Channel({ channelId }: { channelId: string }) {
  return (
    <ChannelProvider channelId={channelId}>
      <ChannelComposer />
    </ChannelProvider>
  )
}
```

## Lift state into the provider

[Vercel, composition-patterns] "Move state management into dedicated provider components. This allows sibling components outside the main UI to access and modify state without prop drilling or awkward refs." Three ways it goes wrong:

- **State trapped inside the component:** `useState(initialState)` inside `ForwardMessageComposer`, while `MessagePreview` and `ForwardButton` beside it in the dialog need that state and its submit.
- **An Effect that syncs state up:**

  ```tsx
  function ForwardMessageComposer({ onInputChange }) {
    const [state, setState] = useState(initialState)
    useEffect(() => {
      onInputChange(state.input) // Sync on every change
    }, [state.input])
  }
  ```

  react.dev agrees ([https://react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect#notifying-parent-components-about-state-changes)): the Effect runs after the screen updates and the parent's update starts "another render pass. It would be better to do everything in a single pass." "Whenever you try to keep two different state variables synchronized, try lifting state up instead!" and "When child components update the state of their parent components in Effects, the data flow becomes very difficult to trace."
- **Reading state from a ref on submit:** `<ForwardMessageComposer stateRef={stateRef} />` with `<ForwardButton onPress={() => submit(stateRef.current)} />`.

**Correct: state lifted to the provider.** `ForwardMessageProvider` (above) owns the state; the dialog puts its custom parts inside the provider, outside the composer's frame:

```tsx
function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        {/* The composer UI */}
        <Composer.Frame>
          <Composer.Input placeholder="Add a message, if you'd like." />
          <Composer.Footer>
            <Composer.Formatting />
            <Composer.Emojis />
          </Composer.Footer>
        </Composer.Frame>

        {/* Custom UI OUTSIDE the composer, but INSIDE the provider */}
        <MessagePreview />

        {/* Actions at the bottom of the dialog */}
        <DialogActions>
          <CancelButton />
          <ForwardButton />
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

// This button lives OUTSIDE Composer.Frame but can still submit based on its context!
function ForwardButton() {
  const {
    actions: { submit },
  } = useComposer()
  return <Button onPress={submit}>Forward</Button>
}

// This preview lives OUTSIDE Composer.Frame but can read composer's state!
function MessagePreview() {
  const { state } = useComposer()
  return <Preview message={state.input} attachments={state.attachments} />
}
```

(Changed from the source: its version of this dialog reads `use(ComposerContext)` in `ForwardButton` and `MessagePreview`, and another reads `use(Composer.Context)`, but its `Composer` object has no `Context` key; the guarded `useComposer` hook replaces both.) "The provider boundary is what matters, not the visual nesting. Components that need shared state don't have to be inside the `Composer.Frame`. They just need to be within the provider." [Vercel, composition-patterns]

## Children over render props

[Vercel, composition-patterns] "Use `children` for composition instead of `renderX` props. Children are more readable, compose naturally, and don't require understanding callback signatures." Not `<Composer renderHeader={() => <CustomHeader />} renderFooter={() => (...)} renderActions={() => <SubmitButton />} />`, but:

```tsx
function ComposerFooter({ children }: { children: React.ReactNode }) {
  return <footer className='flex'>{children}</footer>
}

// Usage is flexible
return (
  <Composer.Frame>
    <CustomHeader />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Emojis />
      <SubmitButton />
    </Composer.Footer>
  </Composer.Frame>
)
```

The exception:

```tsx
// Render props work well when you need to pass data back
<List
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
/>
```

"Use render props when the parent needs to provide data or state to the child. Use children when composing static structure." Base UI's `render={<button />}` and Radix's `asChild`, which app-ui's components use, replace the rendered element; they are not `renderX` slots, and this rule does not cover them.

## Prove it

- Every context read goes through a hook that throws outside its provider; rendering a part without its provider shows that error, not a `TypeError` on `null`.
- The provider's `value` and the `actions` and `meta` objects passed into it are memoized, or React Compiler handles it as [RERENDERS-AND-COMPILER.md](RERENDERS-AND-COMPILER.md#the-react-compiler) describes.
- No component takes a boolean that picks a behavior mode; each mode is its own named component over shared parts. app-ui's own components keep booleans such as `showCloseButton` (see above).
- No Effect copies child state into a parent and no parent reads child state through a ref; siblings that need it sit inside the provider.
- A prop passed through a layer that doesn't use it was first tried as `children`, and context was chosen only when props and `children` didn't fit.
