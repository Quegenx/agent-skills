# React view transitions

React's `<ViewTransition>` component and `addTransitionType`, Next.js `transitionTypes`, the patterns that go wrong, a symptom table and the audit that comes first. Source: Vercel's `vercel-react-view-transitions` skill (MIT, version 1.0.0), checked on 2026-10-18 against [react.dev: ViewTransition](https://react.dev/reference/react/ViewTransition), [react.dev: addTransitionType](https://react.dev/reference/react/addTransitionType), the [React 19.3 post](https://react.dev/blog/2026/09/09/react-19-3), the [Next.js view transitions guide](https://nextjs.org/docs/app/guides/view-transitions), the [Next.js `<Link>` reference](https://nextjs.org/docs/app/api-reference/components/link) and @mdn/browser-compat-data 8.1.6. The Next.js guide itself recommends this skill ("The `vercel-react-view-transitions` skill teaches a coding agent the patterns in this guide"), and most of its CSS matches the guide. The browser API underneath (`startViewTransition`, `@view-transition`, names, classes, pseudo-elements, the swoop, freezing a transition) is in [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md); support and limits are in [NATIVE-CSS.md](NATIVE-CSS.md#view-transitions); the Motion `layoutId` route is in [PATTERNS.md](PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail). app-ui's page and board-to-list transitions are the owner's design and stay as written ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md), [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

**Contents:** [Availability](#availability) · [Where transitions go](#where-transitions-go) · [The component](#the-component) · [Transition types](#transition-types) · [Shared elements](#shared-elements) · [Patterns](#patterns) · [Isolating elements](#isolating-elements) · [Next.js App Router](#nextjs-app-router) · [Symptoms](#symptoms) · [Audit, then a navigation map](#audit-then-a-navigation-map) · [Prove it](#prove-it)

## Availability

- **Stable in React 19.3.** The 19.3 post: "We're excited to announce that both of these [View Transitions and Fragment Refs] are now stable in React 19.3!" Import it with `import { ViewTransition } from 'react'`; the post's examples import `addTransitionType` from `'react'` too, without calling it stable outright ([react.dev](https://react.dev/blog/2026/09/09/react-19-3)). The source said to install `react@canary react-dom@canary` because "`ViewTransition` is not in stable React"; that is out of date.
- **Next.js needs no setup:** "View transitions work in the App Router with no configuration. React 19.3 includes the `<ViewTransition>` component and `addTransitionType` API used in this guide" ([nextjs.org](https://nextjs.org/docs/app/guides/view-transitions)). Don't add the old `experimental.viewTransition` flag, and don't install `react@canary` into a Next app [Vercel, vercel-react-view-transitions]. The source's reason ("the App Router already bundles React canary internally") is out of date; the advice stands.
- **Browsers:** React's typed transitions call the object form `startViewTransition({ update, types })`, which browser-compat-data lists as Chrome 125, **Firefox 147**, Safari 18.2 (`api.Document.startViewTransition.options_parameter`); `:active-view-transition-type()` has the same three versions. The source wrote "Firefox 144+"; Firefox 144 has only the callback form and `view-transition-class`. The Next guide hedges: "available in Chromium 125+ and recent Safari and Firefox versions. Some animations may behave differently in Safari. Without browser support, your application works normally; the transitions do not animate."
- **DOM only:** "Currently, `<ViewTransition>` only works in the DOM" ([react.dev](https://react.dev/reference/react/ViewTransition)), so not in React Native ([REACT-NATIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION.md)).

## Where transitions go

[Vercel, vercel-react-view-transitions] "Every `<ViewTransition>` should communicate a spatial relationship or continuity. If you can't articulate what it communicates, don't add it." That is this skill's question: what changed, and where did it go ([SKILL.md](SKILL.md)).

| Priority | Pattern | What it communicates |
|---|---|---|
| 1 | Shared element (`name`) | "Same thing, going deeper" |
| 2 | Suspense reveal | "Data loaded" |
| 3 | List identity (per-item `key`) | "Same items, new arrangement" |
| 4 | State change (`enter`/`exit`) | "Something appeared/disappeared" |
| 5 | Route change (page-level) | "Going to a new place" |

- **Scope, both ways:** the source says "Implement **all** applicable patterns from this list, in this order", and "Only skip a pattern if the app has no use case for it." app-ui runs page transitions "only between two different app pages: not for opening settings, switching items inside one page, the first load, the marketing site, or any move to or from sign-in" ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)). Inside app-ui the owner's scope stands; the frequency gate in [TIMING.md](TIMING.md#should-it-animate-at-all) applies to every pattern either way.
- **Choosing the style:**

| Context | Animation | Why |
|---|---|---|
| Hierarchical navigation (list to detail) | Type-keyed `nav-forward` / `nav-back` | Communicates spatial depth |
| Lateral navigation (tab to tab) | Bare `<ViewTransition>` (fade) or `default="none"` | No depth to communicate |
| Suspense reveal | `enter`/`exit` string props | Content arriving |
| Revalidation, background refresh | `default="none"` | Silent, no animation needed |

- "Reserve directional slides for hierarchical navigation (list → detail) and ordered sequences (prev/next photo, carousel, paginated results)." In an ordered sequence "next" slides from right and "previous" from left; "Lateral/unordered navigation (tab-to-tab) should not use directional slides: it falsely implies spatial depth." In a right-to-left layout both sides flip ([TIMING.md](TIMING.md#direction-and-weight): new content enters from "left in right-to-left ones"); so the signs of the recipes' offsets in [VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md) swap with it.

## The component

[Vercel, vercel-react-view-transitions], each point confirmed on [react.dev](https://react.dev/reference/react/ViewTransition) unless tagged otherwise.

```jsx
import { ViewTransition } from 'react';

<ViewTransition>
  <Component />
</ViewTransition>
```

React "auto-assigns a unique `view-transition-name` and calls `document.startViewTransition` behind the scenes. Never call `startViewTransition` yourself."

| Trigger | When it fires |
|---|---|
| enter | `<ViewTransition>` first inserted during a Transition |
| exit | `<ViewTransition>` first removed during a Transition |
| update | DOM mutations inside a `<ViewTransition>`, or the boundary itself changing size or position because of an immediate sibling. With nested VTs, the mutation applies to the innermost one |
| share | A named VT unmounts and another with the same `name` mounts in the same Transition |

- **What activates it:** "Only `startTransition`, `useDeferredValue`, or `Suspense` activate VTs. Regular `setState` does not animate." `flushSync` skips the animation.
- **Placement rule:** a VT "only activates enter/exit if it appears **before any DOM nodes**":

```jsx
// Works
<ViewTransition enter="auto" exit="auto">
  <div>Content</div>
</ViewTransition>

// Broken: div wraps the VT, suppressing enter/exit
<div>
  <ViewTransition enter="auto" exit="auto">
    <div>Content</div>
  </ViewTransition>
</div>
```

- **Class props** take `"auto"` (the browser cross-fade), `"none"` (disabled), a class name, or `{ [type]: value }`: `<ViewTransition default="none" enter="slide-in" exit="slide-out" share="morph" />`. "If `default` is `"none"`, all triggers are off unless explicitly listed."
- **Use `default="none"` deliberately.** Without it, "every VT fires the browser cross-fade on **every** transition: Suspense resolves, `useDeferredValue` updates, background revalidations." But it "also turns off `update` (layout/reflow morphs) and `share` (a named pair with no explicit `share` prop never morphs). Keyed list items and displaced siblings *want* update: leave them bare or set `update="auto"`." The Next guide: "With `default="none"` and no `share` prop, the pair silently stops morphing."
- **Every matching VT fires at once,** in one `document.startViewTransition`. VTs in different transitions (a navigation, then a later Suspense resolve) don't compete.
- **Nested VTs** (Vercel's observation, not documented on react.dev): "When a parent VT mounts/unmounts **as one unit** with nested VTs inside it, the nested ones do not fire their own enter/exit: only the outermost VT animates. (A child VT mounted inside a *persistent* parent VT fires enter/exit normally.)" react.dev says only "If a `ViewTransition` is the first component inserted in this Transition, then this will activate". The source names experimental `parentEnter`/`parentExit` props ([React PR #36690](https://github.com/facebook/react/pull/36690)), "not currently available in the Next.js client runtime"; react.dev doesn't mention them.
- **More from react.dev** ([ViewTransition](https://react.dev/reference/react/ViewTransition)), not in the source:
  - "`<ViewTransition>` also waits up to 500 ms for new fonts and visible images to load so they don't flicker in after the animation starts."
  - "If there are other React ViewTransitions already running then React will wait for them to finish before starting the next one." Updates made meanwhile batch: "A→B→C→D becomes B→D" [Vercel, vercel-react-view-transitions]. The browser API alone is not interruptible ([NATIVE-CSS.md](NATIVE-CSS.md#view-transitions)); React queues instead. app-ui queues its board switch itself: "A second switch while one runs waits until it ends: starting a view transition skips the running one and the items jump mid-glide" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)). That queue stands.
  - `name`: "Only use `name` for shared element transitions"; without it "React will use a unique name for each View Transition".
  - "React doesn't automatically disable animations for this case. We recommend always using the @media (prefers-reduced-motion) media query to disable animations or tone them down based on user preference" ([VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md#durations-curves-and-reduced-motion-both-ways)).

## Transition types

[Vercel, vercel-react-view-transitions] "Call it multiple times to stack types: different VTs in the tree react to different types":

```jsx
startTransition(() => {
  addTransitionType('nav-forward');
  addTransitionType('select-item');
  router.push('/detail/1');
});
```

An object maps types to classes and "works on `enter`, `exit`, **and** `share`":

```jsx
<ViewTransition
  enter={{ 'nav-forward': 'slide-from-right', 'nav-back': 'slide-from-left', default: 'none' }}
  exit={{ 'nav-forward': 'slide-to-left', 'nav-back': 'slide-to-right', default: 'none' }}
  share={{ 'nav-forward': 'morph-forward', 'nav-back': 'morph-back', default: 'morph' }}
  default="none"
>
  <Page />
</ViewTransition>
```

- `enter` and `exit` "don't have to be symmetric", for example a fade in with a directional exit: `enter={{ 'nav-forward': 'fade-in', 'nav-back': 'fade-in', default: 'none' }}` with `exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}`.
- **One wrapper for every page,** "the single place to adjust if you add new transition types later":

```jsx
export function DirectionalTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
```

- **TypeScript:** a type map needs a `default` key; without it the error is "Property 'default' is missing". @types/react 19.3.0 types it as `ViewTransitionClassPerType = Record<"default" | (string & {}), ...>`; react.dev says only "If no types match then the special 'default' entry is used". A type-safe helper keeps names from clashing:

```tsx
const transitionTypes = ['default', 'transition-to-detail', 'transition-to-list'] as const;
const animationTypes = ['auto', 'none', 'animate-slide-from-left', 'animate-slide-from-right'] as const;

type TransitionType = (typeof transitionTypes)[number];
type AnimationType = (typeof animationTypes)[number];
type TransitionMap = { default: AnimationType } & Partial<Record<Exclude<TransitionType, 'default'>, AnimationType>>;
```

- **Matching rules** ([react.dev](https://react.dev/reference/react/addTransitionType)): "If multiple types match, then they're joined together." "If any type has the value 'none' then that wins and the ViewTransition is disabled (not assigned a name)."
- **CSS can read the types too:** React adds them as browser view-transition types, so `:root:active-view-transition-type(my-transition-type)` targets them with no type map (Chrome 125, Firefox 147, Safari 18.2) ([react.dev](https://react.dev/reference/react/addTransitionType)).
- **Types don't reach Suspense reveals.** "Transition Types are reset after each commit. This means a `<Suspense>` fallback will associate the types after a `startTransition`, but revealing the content does not" ([react.dev](https://react.dev/reference/react/addTransitionType)). So type maps go on page `enter`/`exit`, and Suspense VTs take plain string props [Vercel, vercel-react-view-transitions].
- **Back and forward, two views.** Next: "Browser-initiated back navigations (the back button or swipe gestures) do not carry a transition type, so the directional slide does not play. The shared element morph from Step 1 still applies if both pages have matching `name` props" ([nextjs.org](https://nextjs.org/docs/app/guides/view-transitions)). The source says the same of `router.back()`, and to "use `router.push()` with an explicit URL" for typed animations. react.dev is broader: a transition started from the legacy popstate event "must finish synchronously to ensure scroll and form restoration works correctly", so "React will skip animations from popstate and animations won't run for the back button. You can fix this by upgrading your router to use the Navigation API" ([react.dev](https://react.dev/reference/react/ViewTransition)). Outside Next, don't count on the morph on Back.

## Shared elements

[Vercel, vercel-react-view-transitions]

```jsx
<ViewTransition name="hero-image">
  <img src="/thumb.jpg" onClick={() => startTransition(() => onSelect())} />
</ViewTransition>

// On the other view: same name
<ViewTransition name="hero-image">
  <img src="/full.jpg" />
</ViewTransition>
```

- **One mounted name at a time:** "use unique names (`photo-${id}`)." A reusable component with a named VT rendered in a modal *and* a page mounts both and breaks the morph: "Either make the name conditional (via a prop) or move the named VT out of the shared component into the specific consumer."
- **`share` beats `enter`/`exit`.** "When no matching pair forms (e.g., the target page doesn't have the same name), `enter`/`exit` fires instead." For each `name`, list every navigation where a pair forms and where it doesn't, and give the paths without a pair their fallback.
- **Two silent failures:** "(1) `default="none"` with no explicit `share` prop: share resolves to none; (2) type-keyed `share` where the navigation never adds the type: a plain link click resolves the map's `default`."
- **Readiness:** "The target must be **in the DOM at navigation time** for the pair to form. If it's behind a Suspense fallback (not rendered yet), no pair forms." Render it above the data boundary, or have its data cached or prefetched. Next: "If the destination suspends into a fallback first, no pair forms, and the content animates with its enter animation instead when it arrives."
- "Never use a fade-out exit on pages with shared morphs: use a directional slide instead." A fading exit "dissolves the source while it is morphing".
- **A shared element inside a list item takes two layers:** an outer keyed VT for list identity, an inner named VT for the morph. "Missing either layer means that animation silently doesn't happen."

```jsx
{items.map(item => (
  <ViewTransition key={item.id}>                                      {/* list identity */}
    <Link href={`/items/${item.id}`}>
      <ViewTransition name={`item-image-${item.id}`} share="morph">   {/* shared element */}
        <Image src={item.image} />
      </ViewTransition>
      <p>{item.name}</p>
    </Link>
  </ViewTransition>
))}
```

- List-side shared elements take `default="none"` "to prevent per-item cross-fades on filter/search updates". app-ui's board and list switch names each item in both views and turns the morph on only for that switch's type ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## Patterns

[Vercel, vercel-react-view-transitions]

- **Suspense, cross-fade:** `<ViewTransition><Suspense fallback={<Skeleton />}><Content /></Suspense></ViewTransition>`.
- **Suspense, directional reveal:**

```jsx
<Suspense fallback={<ViewTransition exit="slide-down" default="none"><Skeleton /></ViewTransition>}>
  <ViewTransition enter="slide-up" default="none"><Content /></ViewTransition>
</Suspense>
```

  Corrected: the fallback's `default="none"` is the [Next guide](https://nextjs.org/docs/app/guides/view-transitions)'s form; the source leaves it off. The content VT always takes `default="none"` "to prevent re-animation on revalidation or unrelated transitions". A fallback-to-content `share` pair "morphs between snapshots. Use it only when that interpolation is desired and does not distort layout or geometry." app-ui suspends only the page content with `<Suspense fallback={null}>` ([app-ui MENUS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/MENUS.md)), so it has no skeleton to animate.
- **Reveal flicker:** "An element rendered in **both** the fallback and the content flickers (opacity dip) on reveal: it fades against itself." Render it once, above the boundary: `<h1>{title}</h1>` then `<Suspense fallback={<BodySkeleton />}><Body /></Suspense>`, or pin it with a `view-transition-name`.
- **Layout displacement:** "Only content inside an activated boundary animates position: everything else teleports to its new layout spot." Wrap the section below a growing list in a bare `<ViewTransition>` so it glides; it "must be a direct sibling of the changing content", because "React only measures boundaries that are direct children of nodes along the changed path". "Sometimes the better fix is no morph at all: pad fixed-size lists to a constant slot count with invisible fillers so the grid never changes height."
- **`key` forces a re-enter:** `<ViewTransition key={searchParams.toString()} enter="slide-up" default="none">`. "If wrapping `<Suspense>`, changing `key` remounts the boundary and refetches." Omit `key` for a cross-fade with no remount (tabs, panels, carousel): "Use `key` when content identity changes (state resets)."
- **Reorder a list:** `{items.map(item => <ViewTransition key={item.id}><ItemCard item={item} /></ViewTransition>)}`, triggered inside `startTransition`, with no wrapper `<div>` between the list and the VT.
- **Search as you type:** `useDeferredValue` "makes filter updates a transition, activating `<ViewTransition>`"; per-item named VTs inside the deferred list "trigger cross-fades on every keystroke" until they take `default="none"`.
- **Card to detail in one page:** a shared `name` on the card and the detail, `startTransition(() => setExpandedId(item.id))`, the scroll position saved on select (`scrollRef.current = window.scrollY`) and restored on close with `setTimeout(() => window.scrollTo({ behavior: 'smooth', top: scrollRef.current }), 100)` inside the transition. The Motion version with the URL following is [CARD-TO-MODAL.md](CARD-TO-MODAL.md).
- **Show and hide that keeps state:** `<Activity mode={isVisible ? 'visible' : 'hidden'}><ViewTransition enter="slide-in" exit="slide-out"><Sidebar /></ViewTransition></Activity>`. react.dev: "When a `<ViewTransition>` inside an `<Activity>` becomes visible, the `enter` animation activates. When it becomes hidden, the `exit` animation activates." "Only reach for Activity when there's state worth preserving." Without state, return `null` when closed and let `enter`/`exit` play: `if (!open) return null; return <ViewTransition enter="expand-in" exit="collapse-out">{children}</ViewTransition>`.
- **Keep controls out of the animation with `useOptimistic`:** its values "update before the transition snapshot, excluding them from animation". Drive labels and `aria-current` from the optimistic value; keep animated content (list order, the indicator) on committed state. "A list reorder driven by optimistic state won't animate."

```tsx
function cycleSort() {
  const nextSort = getNextSort(optimisticSort);
  startTransition(() => {
    setOptimisticSort(nextSort);  // before snapshot: no animation
    setSort(nextSort);            // between snapshots: animates
  });
}
```

- **A sliding tab indicator:** one indicator with one shared `name`, rendered only under the active tab, a distinct name per tab strip, the change inside `startTransition`, and the `.tab-underline` recipe ([VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md#css-recipes)). If the new tab suspends, the indicator and `aria-current` wait for the commit "and the strip feels dead on click"; give `aria-current` the `useOptimistic` value. The Motion `layoutId` indicator is in [HIGHLIGHTS-AND-SELECTION.md](HIGHLIGHTS-AND-SELECTION.md).
- **Events:** `onEnter`, `onExit`, `onUpdate` and `onShare` get `(instance, types)`; animate `instance.new` with WAAPI and return a cleanup. "`onShare` takes precedence over `onEnter`/`onExit`." `instance` carries `old`, `new`, `group`, `imagePair` and `name`.

```jsx
<ViewTransition
  onEnter={(instance, types) => {
    const anim = instance.new.animate(
      [{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 300, easing: 'ease-out' }
    );
    return () => anim.cancel();
  }}
>
  <Component />
</ViewTransition>
```

## Isolating elements

[Vercel, vercel-react-view-transitions] An element pulls out of the animated `root` snapshot with its own `view-transition-name`. "**`view-transition-name: none` is a no-op**: it's the CSS default, so the element stays in `root` (a common flicker bug)." modern-css puts `none` on `html` to take the root itself out of the transition ([modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md)); that is a different use, and it works.

- **Persistent chrome** (nav, sidebar, player bar): `<header style={{ viewTransitionName: "site-header" }}>` plus the isolation CSS in [VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md#css-recipes). `<ViewTransition default="none">` works too, "but its auto-name can't take `z-index`/backdrop `display:none`".
- Don't put a manual `viewTransitionName` on the root DOM node inside a `<ViewTransition>`: "React's auto-name overrides it". A raw `viewTransitionName` "only isolates an element; it does not activate a React view transition."
- **A skeleton that mirrors a control** (a search input, a tab bar) and the real control take the same `viewTransitionName` "so they morph in place".
- **Floating elements** (popovers, menus, tooltips) left open "are captured in `root` and flicker on settle": a real unique name plus the floating isolation CSS ([VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md#css-recipes)). "Native top-layer (`popover`/`<dialog>`) settle-flicker is a browser limit."
- **A name costs clicks:** "named participants are skipped by hit-testing while a transition runs ([csswg#10930](https://github.com/w3c/csswg-drafts/issues/10930)): clicks and hover fall through to whatever is beneath." Portal named popovers; inline in a clickable row, "mid-transition clicks activate the row and read as outside-clicks that close the popover". app-ui keeps its tooltip open through a view switch with a close delay ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)).
- **Toasts and other third-party floaters:** name "an always-mounted wrapper you own: `<div style={{ viewTransitionName: 'toaster' }} className="pointer-events-none fixed inset-0">`. Library containers often unmount when empty, so naming them directly leaves the group unpinned exactly when a toast appears mid-transition." Name a dialog's backdrop separately from its panel. Sonner's line is in [sonner SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/sonner/SKILL.md).

## Next.js App Router

[Vercel, vercel-react-view-transitions], each API checked on nextjs.org (Next.js 16) on 2026-10-18.

- **Every link click is a transition,** so "any VT with `default="auto"` fires on **every** navigation: use `default="none"` to prevent competing animations." Read the guide under `node_modules/next/dist/docs/` too: "The installed version is authoritative for flags and API signatures."
- **`transitionTypes` on `<Link>`** shipped in v16.2.0 ("Add `transitionTypes` prop", [Link reference](https://nextjs.org/docs/app/api-reference/components/link)); the types "are passed to `React.addTransitionType` inside the navigation transition". It works in Server Components and replaces `onNavigate` + `startTransition` + `addTransitionType` + `router.push()`; keep manual `startTransition` for buttons and forms. Check an installed version with `grep -r "transitionTypes" node_modules/next/dist/`.

```tsx
<Link href="/products/1" transitionTypes={['transition-to-detail']}>
  View Product
</Link>
```

- **Programmatic:** `router.push(href, { transitionTypes: ['nav-forward'] })`, and `router.replace` takes the same option ([useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router): "The optional `transitionTypes` are passed to `React.addTransitionType` inside the navigation Transition"). On a version without it, `startTransition` + `addTransitionType` + `router.push()`.
- **Pages, not layouts:** "**Layouts persist across navigations**: `enter`/`exit` only fire on initial mount, not on route changes." A layout VT around `{children}` silences every page VT; "A bare `<ViewTransition>` in layout works only if pages have **no** VTs of their own." Chrome in a layout keeps its state across navigations "for free: no `Activity` needed".
- **`loading.tsx` is an implicit Suspense:** `<ViewTransition exit="slide-down"><PhotoGridSkeleton /></ViewTransition>` in `loading.tsx`, `<ViewTransition enter="slide-up" default="none"><PhotoGrid photos={photos} /></ViewTransition>` in `page.tsx`, string props only.
- **Both layers in one page:** the directional VT wraps the page, and the Suspense pair sits inside it; they "fire at different moments".
- **Same route, new segment** (`/collection/[slug]`): "the router swaps subtrees keyed by the segment value rather than doing a plain unmount/mount: enter/exit don't fire reliably." Corrected: `enter="auto"` added to the source's block, as in the [Next guide](https://nextjs.org/docs/app/guides/view-transitions):

```tsx
<Suspense fallback={<Skeleton />}>
  <ViewTransition key={slug} name="collection-content" share="auto" enter="auto" default="none">
    <Content slug={slug} />
  </ViewTransition>
</Suspense>
```

  `key={slug}` forces the remount, the stable `name` pairs old and new, and the unkeyed `<Suspense>` "keeps old content visible during loading".
- **Content that must be ready:** "`<Link>` automatically prefetches in production, but the default behavior for dynamic routes may only prefetch a shell or loading boundary." Set `prefetch={true}` to prefetch the full route, and with Cache Components put the route data in a `use cache` scope. "Verify directional transitions in a production build with a cold client cache. Development mode does not run automatic `<Link>` prefetching."
- **Server-side sort and filter:** `startTransition(() => { router.replace(`?sort=${sort}`); })` animates list items wrapped in `<ViewTransition key={item.id}>`; give the button the `useOptimistic` value and keep the list on the committed one.
- **Tabs driven by the route:** tabs are `<Link scroll={false}>`, `active` comes from the URL, `onNavigate={() => startTransition(() => setOptimisticActive(t.value))}` drives `aria-current`, and the indicator renders under the committed `active` "so the bar lands where navigation actually settles".
- **Server and client:** `<ViewTransition>` and `<Link transitionTypes>` work in Server Components; `router.push(..., { transitionTypes })`, `addTransitionType` and `startTransition` need Client Components.

## Symptoms

[Vercel, vercel-react-view-transitions]

| Symptom | Cause, then fix |
|---|---|
| VT never activates | A DOM node wraps it, or the update is outside `startTransition`. A raw `viewTransitionName` isolates but doesn't activate. |
| "Two ViewTransition components with the same name" | Names must be unique: `name={`hero-${item.id}`}`; move a reusable component's name to its consumer. |
| Unrelated content cross-fades | A bare VT answers every trigger: `default="none"`, then opt in. |
| Only updates animate, never enter or exit | "Without `<Suspense>`, React treats swaps as updates." Conditionally render the VT itself, or wrap in `<Suspense>`. |
| Shared morph never fires | `share` resolved to `none`: `default="none"` with no `share`, or a type-keyed `share` the navigation never typed. |
| Shared morph fights a page fade | The fading exit dissolves the source mid-morph: drop that exit or slide instead. |
| Suspense reveal doesn't animate | Reveals carry no types: string props, not a type map. |
| An enter plays though Suspense never showed its fallback | The content VT was the topmost entering subtree. "Add a host DOM element immediately outside `Suspense`", not inside the reusable crossfade. |
| Page VTs silent under a layout VT | Nested enter and exit are skipped as one unit: keep route boundaries in pages. |
| Same-route content doesn't animate with `update` | A nested VT owns the mutation first: `key` plus a stable `name` and `share`. |
| Section below a list teleports | Outside any boundary, `default="none"` on it, or not an immediate sibling. |
| Directional slide missing on Back | Back carries no types ([Transition types](#transition-types)). |
| `flushSync` update doesn't animate | `flushSync` skips view transitions: `startTransition`. |
| Reorder with `useOptimistic` doesn't animate | Optimistic values land before the snapshot: drive the order from committed state. |
| TS "Property 'default' is missing" | Type maps need `default`. |
| Scrolling hangs during a transition | "The `::view-transition` overlay is `position: fixed` and its snapshots don't scroll": keep reveals short. The source's "experimental `useSwipeTransition`" is not on react.dev or in the 19.3 post. |
| Hash links jump | Navigate without the hash, then scroll in code. |
| Open popover flickers as a transition settles, or closes when clicked mid-way | Captured in `root`: a real name and isolation; portal it for clicks ([Isolating elements](#isolating-elements)). |
| `backdrop-filter` flickers | The backdrop-blur workaround in [VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md#css-recipes). |
| `border-radius` lost mid-transition | Put `border-radius` on the captured element itself. |
| Skeleton controls slide away | Give the skeleton and the real control the same `viewTransitionName`. |

## Audit, then a navigation map

[Vercel, vercel-react-view-transitions] "Start with the audit: do not skip it." Before any code:

1. **Search** every `<Link>` and `router.push` (open each file), every `<Suspense>` and what its fallback renders, every page component, persistent chrome (headers, navbars, sidebars, sticky controls), visual elements shared by a source and a target view, and controls that appear in both a skeleton and its content.
2. **Write the navigation map,** one row per kind of move:

```
| Route           | Navigates to         | Direction    | VT pattern            |
|-----------------|----------------------|--------------|-----------------------|
| /               | /detail/[id]         | forward      | directional slide     |
| /detail/[id]    | /                    | back         | directional slide     |
| /detail/[id]    | /detail/[other]      | sequential   | directional slide (ordered prev/next) or key+share crossfade |
| /tab/[a]        | /tab/[b]             | lateral      | key+share crossfade   |
| (Suspense)      | (content loads)      |              | slide-up reveal       |
```

   For each `name`, note every navigation where a pair forms and where it doesn't. In app-ui, mark each row against its scope first ([Where transitions go](#where-transitions-go)).
3. **Copy only the recipes the map needs** ([VIEW-TRANSITION-RECIPES.md](VIEW-TRANSITION-RECIPES.md)), reduced motion always; add live-root, persistent, backdrop or floating rules only for surfaces the audit found. "Customize timing after the structure works."
4. **Isolate persistent elements.**
5. **Directional page VTs** on hierarchical rows: `addTransitionType` (or `transitionTypes`) plus the page wrapper. "Always pair `enter` with `exit`: without an exit animation, the old page disappears instantly while the new one animates in."
6. **Suspense reveals** on every boundary the map lists.
7. **Shared elements,** with list-side `default="none"`.
8. **Walk every row** and answer: does the VT mount or stay mounted (same route)? Does a shared pair form, and if not, does `enter`/`exit` cover it? Does `default="none"` block a wanted animation? Does persistent chrome stay still? Do Suspense reveals animate apart from the directional move?

## Prove it

Walk every navigation-map row in a production build with a cold client cache and confirm the five answers in step 8. Press Back on a typed route: no directional slide, and in Next the shared morph still plays. Switch the document to `dir="rtl"`: forward content now enters from the left ([TIMING.md](TIMING.md#direction-and-weight)). Turn on reduced motion: no slide, scale or morph geometry remains and the fades still play. Open a popover and a toast, then navigate: neither flickers. Grep for `view-transition-name: none` and `viewTransitionName: 'none'` on children: none are left. Check every duration and curve against [TIMING.md](TIMING.md), and in app-ui against its own tokens.
