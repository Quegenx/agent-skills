---
name: sonner
description: "Sets up, styles and troubleshoots Sonner, the React toast library, checked against its 2.0.8 source: one Toaster, picking the toast() call, promise and loading toasts, updating, dismissing and persisting, reading active toasts, multiple toasters, close callbacks, the styling ladder up to headless toasts, icons and theme, right-to-left, the hotkey and screen-reader behavior, swipe and timing numbers, stacking under a modal dialog, and a symptom table. Use when adding Sonner to an app or fixing toasts that don't appear, appear twice, never close, lose their styles, ignore Tailwind classes, sit behind a modal or ignore dark mode."
---

# Sonner

From Emil Kowalski's `ask-sonner` skill (emilkowalski/skills), checked against the Sonner docs ([sonner.emilkowal.ski](https://sonner.emilkowal.ski)) and the source at **2.0.8** ([emilkowalski/sonner `src/`](https://github.com/emilkowalski/sonner/tree/main/src); 2.0.8 went to npm on 2026-08-09, 2.0.7 on 2025-08-02). The skill has ten errors against the source, most of them shared with the docs, corrected below where each fact sits; every correction names the source file. Sonner is two pieces: one `<Toaster />` that renders and a plain `toast()` function that queues, joined by a module-level store, so most failures are a missing or doubled Toaster, a toaster that filters the toast out, or styles that lose the cascade. Toast motion in general is [ui-animation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md); the owner's app gives feedback in place and uses no toast library ([app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Install, mount one Toaster, call `toast()` from client code | [Setup](#setup) |
| Which call: plain, typed, loading, promise, action, JSX, headless | [Picking the call](#picking-the-call) |
| Update by id, persist, dismiss, read active toasts, links, several toasters, close callbacks, `toast.promise` details | [Recipes](#recipes) |
| `richColors`, inline styles, `classNames` with `!important`, CSS variables, headless toasts, icons, theme and next-themes | [Styling: the escalation ladder](#styling-the-escalation-ladder) |
| Screen readers and the hotkey, swipe thresholds, sizes and timing, right-to-left, stacking and modal dialogs | [Behavior read from the source](#behavior-read-from-the-source) |
| Where Sonner's defaults disagree with ui-animation, anti-slop-ui and app-ui | [Where other skills differ](#where-other-skills-differ) |
| Symptom, cause, fix | [Troubleshooting](#troubleshooting) |
| Every `<Toaster />` prop, every `toast()` option, `classNames` keys, the functions | [API.md](API.md) |

## The rules

1. **Mount exactly one `<Toaster />`, near the root, unconditionally** [Emil Kowalski, ask-sonner]. A second mounted Toaster duplicates every toast; a conditional or per-page one loses them.
2. **Call `toast()` only from client code.** It is a plain function with no hook or provider, and it does nothing on the server: a server action returns its result and the client calls `toast()` [Emil Kowalski, ask-sonner].
3. **Target toasters by id deliberately.** An untargeted toast renders only in Toasters without an `id`; a Toaster with an `id` shows only toasts sent to it ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).
4. **Update a toast by passing its `id` again** instead of dismissing and re-creating it; a stable `id` also stops StrictMode's double effect from duplicating it [Emil Kowalski, ask-sonner].
5. **Climb the styling ladder only as far as the change needs,** and go headless with `toast.custom()` once more than a few classes need `!important` [Emil Kowalski, ask-sonner].
6. **Set `theme` explicitly.** It defaults to `'light'` and does not follow the OS; pass `"system"` or the app's resolved theme [Emil Kowalski, ask-sonner].
7. **Read active toasts with `toast.getToasts()`** outside React and `useSonner()` inside it; `toast.getActiveToasts()` does not exist ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts)).
8. **Never count on the Toaster beating a modal `<dialog>`:** it is a `z-index`, not the top layer ([Stacking and modal dialogs](#stacking-and-modal-dialogs)).

## Setup

[Emil Kowalski, ask-sonner] Install with `pnpm i sonner`; the peer dependency is React 18 or 19.

1. **One `<Toaster />`, mounted once,** as close to the root as possible. In Next.js it goes in `layout.tsx`; it works inside server components because `index.tsx` starts with `'use client'`.
2. **`toast()` from client code:** event handlers, effects, callbacks.

```jsx
import { Toaster } from 'sonner'; // once, in layout
import { toast } from 'sonner';   // anywhere client-side
```

## Picking the call

[Emil Kowalski, ask-sonner]

| You want | Call |
|---|---|
| Plain message | `toast('Title')`, with `{ description }` for a second line |
| Success, error, info or warning icon | `toast.success('…')`, `toast.error('…')`, `toast.info('…')`, `toast.warning('…')` |
| Spinner while you manage state yourself | `toast.loading('…')`, then update it by id |
| Loading, then success or error, tied to a promise | `toast.promise(promise, { loading, success, error })`; `success` and `error` accept functions of the resolved value or error |
| A button that does something | `{ action: { label, onClick } }` closes the toast unless `onClick` calls `event.preventDefault()`; `cancel` is the secondary button |
| Custom JSX in the default shell | `toast(<jsx />)` |
| Custom JSX with no styles at all | `toast.custom((id) => <jsx />)`: headless, keeping Sonner's positioning, stacking and swipe |
| Back to a plain toast | `toast.message('…', { id })` resets the type, which turns a loading toast plain ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts)) |

- **`toast.custom` receives the id,** `jsx: (id: number | string) => React.ReactElement` ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts)). The docs say it "receives the `Toast` as an argument, giving you access to all properties"; the source passes only the id, which is what the skill said.
- **The action button still closes a non-dismissible toast; the cancel button does nothing when `dismissible: false`** (`if (!dismissible) return;`, [index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).
- **No close button renders on `toast.custom` toasts or on loading toasts,** even with `closeButton` ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).

## Recipes

- **Update a toast** [Emil Kowalski, ask-sonner]: call `toast()` again with the same `id`; only the props you pass change, and `toast.success(…, { id })` changes the type. This is a loading-to-success flow without `toast.promise`:

  ```jsx
  const id = toast.loading('Uploading…');
  toast.success('Uploaded', { id });
  ```

- **Persist** with `{ duration: Infinity }`; **dismiss** one with `toast.dismiss(id)` or all with `toast.dismiss()` [Emil Kowalski, ask-sonner]. `duration` is read as `toast.duration || toasterDuration || 4000`, so `duration: 0` falls back to the default instead of closing at once ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).
- **Read active toasts** with `useSonner()` in React (it returns `{ toasts }`) and `toast.getToasts()` outside it; `toast.getHistory()` returns every toast, kept to `MAX_HISTORY_SIZE = 100` in 2.0.8 by dropping dismissed toasts above it, never one still on screen. The skill and the docs (/other) say `toast.getActiveToasts()`: that is a method on the internal `ToastState`, which is not exported; `state.ts` ends with `Object.assign(basicToast, {…}, { getHistory, getToasts })` ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts), the same in v2.0.7).
- **Links or components in the text** [Emil Kowalski, ask-sonner]: pass a function for the title or description, `toast(() => <a href="…">View</a>)`.
- **Several toasters:** give one `<Toaster id="canvas" />` and send to it with `toast('…', { toasterId: 'canvas' })`. The filter is `if (id) return toasts.filter((toast) => toast.toasterId === id); return toasts.filter((toast) => !toast.toasterId);`, so an untargeted toast renders in every Toaster that has **no** `id`, and if every Toaster has an id it renders **nowhere** ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx), the same in v2.0.7). The skill said "Without `toasterId`, every toaster renders the toast", which holds only when no Toaster has an id.
- **Close callbacks:** `onAutoClose` fires on timeout. `onDismiss` fires on the close button, a swipe **and `toast.dismiss(id)`** (or `toast.dismiss()` for all) (the `toast.delete` effect runs `deleteToast(); toast.onDismiss?.(toast);`). Action and cancel clicks call `deleteToast()` and fire **neither** ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)). The skill and docs said `onDismiss` "fires on close button or swipe". There is no single "closed" callback [Emil Kowalski, ask-sonner].
- **`toast.promise` beyond the basics** ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts)):
  - It also takes `description` (which can be a function of the result) and `finally`.
  - It returns the toast id with an `unwrap()` that resolves or rejects like the original promise; with no `loading` option it returns only `{ unwrap }`.
  - The first argument is a promise or a function returning one.
  - A resolved `Response` with `!ok` becomes the error toast (`HTTP error! status: N`); a resolved `Error` instance also becomes the error toast; a resolved React element replaces the toast as a default toast.
  - With no `success` option the loading toast is dismissed; with no `loading` option no toast shows until the promise settles.

## Styling: the escalation ladder

[Emil Kowalski, ask-sonner] Climb only as far as the change requires; jumping to the top rung early is fine (it is the recommended end state), lingering in the middle is not.

1. **Defaults,** plus `richColors` on the Toaster for colorful success and error, and `invert` to flip against the theme.
2. **Inline tweaks:** `toastOptions={{ style: {…} }}` on the Toaster for all toasts, or `style` per `toast()` call.
3. **Classes on parts:** `toastOptions={{ classNames: { toast, title, description, … } }}` (all keys in [API.md](API.md#classnames-keys)). Sonner's styles win the cascade, so every class needs `!important` (Tailwind `!text-red-900`). If you are marking more than a few things important, go headless.
4. **Headless:** `toast.custom()` with your own JSX, wrapped in your own `toast()` abstraction. The docs call it "the recommended approach as people usually either use the defaults or go fully custom". `unstyled: true` is the halfway house.

- **One rule per type:** `classNames.success`, `.error` and the other type keys go on the toast's `<li>`, and `default` is the key for plain `toast()` toasts ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)).
- **Theme colors are CSS custom properties** on `[data-sonner-toaster][data-sonner-theme='light']` (`--normal-bg: #fff; --success-bg: hsl(143, 85%, 96%); --success-text: hsl(140, 100%, 27%); …`) in [styles.css](https://github.com/emilkowalski/sonner/blob/main/src/styles.css). Overriding them is another rung, but neither the skill nor the docs name it: treat it as source-observed, not a documented API.
- **Icons** [Emil Kowalski, ask-sonner]: per type through the Toaster's `icons` (which also takes `close`), per toast through `icon`, and `null` removes one.
- **Theme** [Emil Kowalski, ask-sonner]: `theme` defaults to `'light'` and does not track the OS. `theme="system"` follows `prefers-color-scheme` live through a `matchMedia` change listener ([index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx)). With next-themes, the docs put `<Toaster theme={resolvedTheme as ToasterProps['theme']} />` in a `'use client'` wrapper ([docs: Toaster](https://sonner.emilkowal.ski/toaster)). app-ui reads its saved theme with `useSyncExternalStore(subscribe, readStored, () => "system")` ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)); that resolved value is what `theme` would take.

## Behavior read from the source

All from [index.tsx](https://github.com/emilkowalski/sonner/blob/main/src/index.tsx) and [styles.css](https://github.com/emilkowalski/sonner/blob/main/src/styles.css) at 2.0.8; none of it is in the skill.

### Screen readers and the hotkey

- The container is `<section aria-live="polite" aria-relevant="additions text" aria-atomic="false" tabIndex={-1}>`, and each toast an `<li tabIndex={0}>`.
- Its label is `${containerAriaLabel} ${hotkeyLabel}` ("Notifications alt+T"); `customAriaLabel` replaces the whole label. Both are Toaster props.
- `hotkey` is a `string[]`, default `['altKey', 'KeyT']`: every entry must match, each a modifier property name or an `event.code`. It expands the stack and focuses it, Escape collapses it, and `hotkey={[]}` turns it off (`hotkey.length > 0 && ...`). Focus returns to the previously focused element on blur or unmount.
- `testId` renders `data-testid` on the toast `<li>`, which matches the e2e runner's default `testIdAttribute` ([tester-army-e2e RUNNER-SETUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/RUNNER-SETUP.md)); that skill's query order puts `getByRole` first and `getByTestId` last ([tester-army-e2e WRITING-TESTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/WRITING-TESTS.md)).

### Swipe

- Dismiss at `SWIPE_THRESHOLD = 45` px or a velocity above 0.11 px/ms, in an allowed direction only. Directions come from `position`; override them with `swipeDirections` [Emil Kowalski, ask-sonner].
- Movement the other way is damped by `1 / (1.5 + |delta| / 20)`, and the direction locks after 1px.
- Right-click, buttons, loading toasts and non-dismissible toasts don't swipe; selecting text cancels the swipe.

### Sizes and timing

- `TOAST_WIDTH = 356`, `GAP = 14`, `VISIBLE_TOASTS_AMOUNT = 3`, `TOAST_LIFETIME = 4000`, `TIME_BEFORE_UNMOUNT = 200` ("Equal to exit animation duration").
- Toasts transition `transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms`; a non-front toast removed while collapsed uses `transition: transform 500ms, opacity 200ms`.
- The timer pauses while the stack is expanded (hover), while the user interacts (pointer down) and while the tab is hidden (`expanded || interacting || isDocumentHidden`).
- Under `@media (prefers-reduced-motion)` the stylesheet sets `transition: none !important; animation: none !important;` on `[data-sonner-toast]`, its children and `.sonner-loading-bar`.
- `offset` defaults to `'24px'` (`VIEWPORT_OFFSET`) and `mobileOffset` to `'16px'` (`MOBILE_VIEWPORT_OFFSET`); the mobile value applies under `@media (max-width: 600px)`, so at 600px and below. The skill and the docs (/toaster) say 32px and "< 600px" (the same in v2.0.7).

### Right-to-left

`dir` defaults to `getDocumentDirection()`, which reads `<html dir>`, falls back to the computed `direction`, and returns `'ltr'` only on the server; the type is `'rtl' | 'ltr' | 'auto'`, and `'auto'` re-reads the document. A right-to-left app needs no prop. The skill and docs give the default as `'ltr'`.

### Toasts created before the Toaster

In 2.0.7 and earlier, a toast created before the Toaster subscribes is lost. From 2.0.8 `subscribe` replays active toasts: "A toast can be created before the `Toaster` had a chance to subscribe, e.g. when it's called in an effect of a component rendered above the `Toaster`. Replay whatever is still active so it doesn't get lost." ([state.ts](https://github.com/emilkowalski/sonner/blob/main/src/state.ts)).

### Stacking and modal dialogs

- The toaster is `z-index: 999999999`, not the top layer, so a native `<dialog>` opened with `showModal()` paints over it whatever its z-index. Moving the Toaster to the document root fixes an ancestor's stacking context, not a top-layer dialog. This follows from MDN's [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) rules, not from Sonner's docs.
- In 2.0.8 the section carries `data-react-aria-top-layer`, which v2.0.7 lacks. That it keeps toasts usable over React Aria modals is a reading of the attribute's name; React Aria's docs were not checked.
- **The other view:** anti-slop-ui puts "**Layers that must float (menus, popovers, toasts, dialogs)**" in the top layer, through "the `popover` attribute and `<dialog>` with `showModal()`" ([anti-slop-ui DETAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/DETAILS.md#stacking-without-z-index-wars), with the techniques in [modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md#use-them-and-the-top-layer)). Sonner does not do that. Both hold: a toast library on a z-index works until a modal dialog opens, and then the dialog wins.

## Where other skills differ

- **Toast timing.** ui-animation's [ui-animation TIMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/TIMING.md) gives "| toast | 250-350 in, 150-200 out | emphasized in, exit out | 0% |". Sonner enters with a 400ms transform; a removed front toast keeps its 400ms `transform` and `opacity` transitions but unmounts at 200ms (`TIME_BEFORE_UNMOUNT`, "Equal to exit animation duration"), and a collapsed non-front toast fades its opacity over 200ms. Neither wins; use the table for your own toasts and leave Sonner's own timing alone unless you go headless.
- **Reduced motion.** ui-animation's rule 8: "**Reduce, don't remove:** with reduced motion, movement becomes short fades; feedback and state changes stay" ([ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md#the-rules)). Sonner's stylesheet removes every transition and animation instead. Both are in use; a headless toast can follow ui-animation's rule.
- **A visible countdown.** ui-animation [ui-animation PATTERNS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PATTERNS.md#feedback-where-it-happened): "**A self-dismissing notification shows its time left:** an animated border visibly counts down how long it stays." Sonner pauses its timer on hover, pointer interaction and a hidden tab, so a countdown drawn on a Sonner toast must pause with it.
- **app-ui** (the owner's design) has no toast component and no Sonner: it confirms in place ([app-ui OVERLAYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/OVERLAYS.md#confirm-in-place)), puts errors with a retry action inside the results card ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)), and reads "Saved" on the save toggle ([app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md)). Its motion tokens still name a toast: "| `--duration-medium` | 350ms | panels and toasts closing |" ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)). Sonner's stylesheet doesn't read those tokens, so a styled Sonner still unmounts at 200ms, not 350ms.

## Troubleshooting

[Emil Kowalski, ask-sonner], with the rows the source corrects marked.

| Symptom | Cause, then fix |
|---|---|
| Toast never appears | No `<Toaster />` mounted, or it unmounted (conditional render, per-page placement): mount one at the root. From a server action: `toast()` is client-only, so call it with the action's result on the client. Every Toaster has an `id` and the toast has no `toasterId`: it renders nowhere (source). Before 2.0.8, a toast fired in an effect above the Toaster before it subscribed is lost: upgrade (source). |
| Same toast appears twice | Two Toasters mounted (layout **and** page): keep one. Or `toast()` fired in an effect under React StrictMode's dev double-invoke: fire it from the event handler, or pass a stable `id` so the second call updates instead of duplicating. |
| Tailwind or CSS classes have no effect | Default styles override them. Mark them `!important`, or use `unstyled` or headless (the ladder above). |
| Toasts render completely unstyled (common in Astro and with view transitions) | The injected stylesheet was lost: import it in a layout, `import 'sonner/dist/styles.css'` (`package.json` exports `"./dist/styles.css"`). |
| A toast that appears during a view transition flickers or slides with the page | [Vercel, vercel-react-view-transitions] Name "an always-mounted wrapper you own: `<div style={{ viewTransitionName: 'toaster' }} className="pointer-events-none fixed inset-0">`", because "Library containers often unmount when empty, so naming them directly leaves the group unpinned exactly when a toast appears mid-transition" ([ui-animation REACT-VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/REACT-VIEW-TRANSITIONS.md#isolating-elements)). |
| Unstyled inside Shadow DOM | Styles land in `document.head`, not the shadow root. Copy the `<style>` whose text includes `[data-sonner-toaster]` into the shadow root. |
| Toast behind a modal or overlay, or clipped | An ancestor creates a stacking context (`transform`, `filter`, `overflow`) or the overlay out-z-indexes the toaster: move `<Toaster />` to the document root, outside any dialog or portal container. A `<dialog>` opened with `showModal()` is in the top layer and stays on top anyway ([Stacking](#stacking-and-modal-dialogs)). |
| Dark mode ignored | `theme` defaults to `'light'`: set `theme="system"` or pass the resolved theme. |
| Success and error look gray, not green and red | That is the default: add `richColors` to the Toaster. |
| Toast never closes (corrected) | `duration: Infinity`; a bare `toast.loading()` never updated; a `toast.promise` whose promise never settles; or the timer is paused while the stack is expanded, the pointer is down or the tab is hidden. `dismissible: false` does **not** stop auto-close: the timer returns early only for loading and promise-loading toasts and `duration === Infinity` (source; the skill listed it). |
| `toast.promise` stuck on loading | It needs a promise, or a function returning one, as its first argument, and that promise must resolve or reject. |
| Swipe-to-dismiss goes the wrong way or doesn't work | Directions derive from `position`: override with `swipeDirections`. Loading and non-dismissible toasts never swipe. |
| Toast shows up in every toaster (corrected) | Untargeted toasts render in every Toaster **without** an `id`: give each Toaster an `id` and pass `toasterId`, keeping one id-less Toaster for untargeted toasts if you want them shown. |
| Toasts too close to the screen edge on mobile (corrected) | `offset` (default `'24px'`) and `mobileOffset` (default `'16px'`, at 600px wide and below), each a number, a CSS string or a per-side object. The skill said 32px. |

## Prove it

Exactly one Toaster is mounted (count `[data-sonner-toaster]` in the DOM, per toaster id); a toast fired from a client handler appears once under StrictMode; an updated toast keeps its id and changes type; `toast.getToasts()` returns the visible toasts; a targeted toast shows only in its Toaster and an untargeted one only in the id-less one; dark mode follows the app's theme; styles survive a production build and a view transition; a screen reader announces a new toast and Alt+T focuses the stack; and a toast opened while a `showModal()` dialog is up is checked for whether the dialog covers it.
