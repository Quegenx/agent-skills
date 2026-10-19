# Sonner API reference

[Emil Kowalski, ask-sonner] Exact props, types and defaults, checked against `src/index.tsx`, `src/state.ts` and `src/types.ts` at Sonner 2.0.8 ([emilkowalski/sonner `src/`](https://github.com/emilkowalski/sonner/tree/main/src)). Rows marked **corrected** differ from the skill and the docs, with what they said; rows marked **added** are in the source but missing from the skill. Options passed to `toast()` override the same options set through the Toaster's `toastOptions`. How to use them is in [SKILL.md](SKILL.md).

## `<Toaster />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `theme` | `string` | `'light'` | `'light'`, `'dark'` or `'system'`. |
| `richColors` | `boolean` | `false` | Makes error and success states more colorful. |
| `expand` | `boolean` | `false` | Toasts expanded by default (otherwise they expand on hover). |
| `visibleToasts` | `number` | `3` | Amount of visible toasts. |
| `id` | `string` | none | Toaster id, targeted by `toast()`'s `toasterId`. A Toaster with an `id` shows only toasts sent to it; one without shows only untargeted toasts. |
| `position` | `string` | `'bottom-right'` | `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`. |
| `closeButton` | `boolean` | `false` | Adds a close button to all toasts (never on `toast.custom` or loading toasts). |
| `offset` | `string \| number \| object` | `'24px'` | Offset from screen edges. Object form is per side: `{ bottom: '24px', right: '16px' }`. **Corrected:** the skill and docs say `'32px'`; the source has `VIEWPORT_OFFSET = '24px'`. |
| `mobileOffset` | `string \| number \| object` | `'16px'` | Offset under `@media (max-width: 600px)`, so at 600px and below. **Corrected:** the skill said "< 600px". |
| `swipeDirections` | `array` | from `position` | Allowed swipe-to-dismiss directions. |
| `dir` | `'rtl' \| 'ltr' \| 'auto'` | the document's direction | `getDocumentDirection()` reads `<html dir>`, then the computed `direction`; `'ltr'` only on the server. `'auto'` re-reads the document. **Corrected:** the skill and docs say `'ltr'`. |
| `hotkey` | `string[]` | `['altKey', 'KeyT']` | Expands and focuses the toaster. Every entry must match: a modifier property name or an `event.code`. `[]` turns it off. **Corrected:** the skill said `string`. |
| `invert` | `boolean` | `false` | Dark toasts in light mode and vice versa. |
| `toastOptions` | `object` | none | Defaults for every toast. `ToastOptions` in `types.ts` takes only `className`, `closeButton`, `descriptionClassName`, `style`, `cancelButtonStyle`, `actionButtonStyle`, `duration`, `unstyled`, `classNames`, `closeButtonAriaLabel` (default `'Close toast'`) and `toasterId` (typed, but the Toaster does not read it). The docs' table gives it a default of `4000`, a slip. **Corrected:** the skill said "any `toast()` option". |
| `gap` | `number` | `14` | Gap between toasts when expanded. |
| `icons` | `object` | none | Replace default icons: `{ success, info, warning, error, loading, close }`; `null` removes one. **Added:** `close`. |
| `duration` | `number` | `4000` | Default lifetime of every toast in ms. **Added.** |
| `className` | `string` | none | Class on the toaster. **Added.** |
| `style` | `object` | none | Inline styles on the toaster. **Added.** |
| `containerAriaLabel` | `string` | `'Notifications'` | Label of the toast container, rendered as `${containerAriaLabel} ${hotkeyLabel}` ("Notifications alt+T"). **Corrected:** the skill and the docs' toast table list it as a `toast()` option; it is in `ToasterProps` only. |
| `customAriaLabel` | `string` | none | Replaces the container's whole label. **Added.** |

## `toast()` options

`toast(message, options)`: the message is a string, JSX or a function returning JSX. It returns the toast's id.

| Option | Type | Default | Description |
|---|---|---|---|
| `description` | `ReactNode` | none | Renders under the title; also accepts a function returning JSX. |
| `closeButton` | `boolean` | `false` | Adds a close button. |
| `invert` | `boolean` | `false` | Dark toast in light mode and vice versa. |
| `richColors` | `boolean` | `false` | Colorful success and error for this toast. **Added.** |
| `duration` | `number` | `4000` | Milliseconds before auto-close; `Infinity` persists the toast. Read as `toast.duration \|\| toasterDuration \|\| 4000`, so `0` falls back to the default. |
| `position` | `string` | `'bottom-right'` | Position of this toast. |
| `dismissible` | `boolean` | `true` | If `false`, blocks swipe, the close button and the cancel button. It does not stop auto-close, and the action button still closes the toast. **Corrected:** the skill listed it as a cause of "Toast never closes". |
| `icon` | `ReactNode` | none | Icon in front of the text; `null` removes the default. |
| `action` | `ReactNode \| { label, onClick }` | none | Primary button; clicking closes the toast unless `onClick` calls `event.preventDefault()`. Fires neither `onDismiss` nor `onAutoClose`. |
| `cancel` | `ReactNode \| { label, onClick }` | none | Secondary button; clicking closes the toast, unless `dismissible: false`, where it does nothing. Fires neither callback. |
| `actionButtonStyle` | `object` | `{}` | Styles for the action button. |
| `cancelButtonStyle` | `object` | `{}` | Styles for the cancel button. |
| `id` | `string \| number` | none | Custom id; calling `toast()` again with the same id updates the existing toast. |
| `testId` | `string` | none | Rendered as `data-testid` on the toast `<li>`. |
| `toasterId` | `string` | none | Id of the Toaster to render this toast in. |
| `style` | `object` | none | Inline styles for the toast. |
| `className` | `string` | none | Class on the toast. **Added.** |
| `descriptionClassName` | `string` | none | Class on the description. **Added.** |
| `classNames` | `object` | none | Classes per part (keys below). Needs `!important` unless `unstyled`. |
| `unstyled` | `boolean` | `false` | Removes all default styles. |
| `onDismiss` | `(toast) => void` | none | Fires on the close button, a swipe and `toast.dismiss(id)` or `toast.dismiss()`. **Corrected:** the skill and docs say close button or swipe only. |
| `onAutoClose` | `(toast) => void` | none | Fires when the toast closes after `duration`. |

### `classNames` keys

`toast`, `title`, `description`, `actionButton`, `cancelButton`, `closeButton`, `loader`, `success`, `error`, `info`, `warning`, `loading`, `default`, `content`, `icon` (`ToastClassnames` in `types.ts`). The type keys go on the toast's `<li>`, and `default` is the key for plain `toast()` toasts. **Added:** the skill listed the first six.

## Functions

| Function | Purpose |
|---|---|
| `toast(message, opts?)` | Render a toast; returns its id. |
| `toast.success / .error / .info / .warning(message, opts?)` | Typed toast with the matching icon. |
| `toast.message(message, opts?)` | Plain toast; with an existing `id` it resets the type, so a loading toast turns plain. **Added.** |
| `toast.loading(message, opts?)` | Toast with a spinner; update it by id. Never closes on its own. |
| `toast.promise(promise, { loading, success, error, description, finally })` | Loading toast that settles with the promise (or a function returning one). `success` and `error` accept strings, JSX, functions of the result or objects of toast options; `description` takes a string, JSX or a function of the result. Returns the id with an `unwrap()` that resolves or rejects like the original (only `{ unwrap }` without `loading`). A `Response` with `!ok` or a resolved `Error` becomes the error toast. **Added:** `description`, `finally`, `unwrap()`. |
| `toast.custom((id) => jsx, opts?)` | Headless toast: your JSX, Sonner's behavior. The callback receives the id. **Corrected (docs):** the docs say it receives the `Toast` object. |
| `toast.dismiss(id?)` | Dismiss one toast, or all without an id. Fires `onDismiss`. |
| `toast.getToasts()` | Active toasts, usable outside React. **Corrected:** the skill and docs (/other) say `toast.getActiveToasts()`, which is internal to `ToastState` and not exported. |
| `toast.getHistory()` | Every toast created, kept to 100 (`MAX_HISTORY_SIZE` in 2.0.8) by dropping dismissed toasts. **Added.** |
| `useSonner()` | React hook returning `{ toasts }`. |

## Prove it

Every prop and option used in the code appears in these tables with the type given; nothing calls `toast.getActiveToasts()` or passes `containerAriaLabel` to `toast()`; `hotkey` is an array; and a test that dismisses a toast with `toast.dismiss(id)` expects `onDismiss` to fire.
