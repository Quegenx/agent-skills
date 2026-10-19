# React Native and Expo: lists, state, native UI and project setup

React Native and Expo code that isn't motion: render crashes, virtualized lists, state, native navigators, sheets, safe areas, menus, styling, images, fonts and monorepos. The source is Vercel's `react-native-skills` (36 rule files, tagged [Vercel, react-native-skills]), checked against reactnative.dev, docs.expo.dev, the Reanimated, Gesture Handler and FlashList docs and React Navigation 7; each correction gives the official form, its URL and what the source said. Motion (Reanimated, gestures, springs, sheets that drag, screen transitions, haptics) is in [REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md) and is not repeated here; tests on a device are in [maestro MAESTRO.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/maestro/MAESTRO.md). The source ranks its rules CRITICAL, HIGH, MEDIUM and LOW; the two render crashes below are its CRITICAL tier.

**Contents:** [Before you change an app](#before-you-change-an-app) · [Render crashes](#render-crashes) · [Lists](#lists) · [State](#state) · [Measuring views](#measuring-views) · [Navigation](#navigation) · [Sheets and modals](#sheets-and-modals) · [Safe areas and insets](#safe-areas-and-insets) · [Pressables and menus](#pressables-and-menus) · [Styling](#styling) · [Images](#images) · [Design-system components](#design-system-components) · [Fonts and formatters](#fonts-and-formatters) · [Monorepos](#monorepos) · [Motion rules in this source](#motion-rules-in-this-source) · [Prove it](#prove-it)

## Before you change an app

[React Doctor, react-doctor] (its remote playbook) Read the manifest, lockfile, app config, React Native and Expo versions, New Architecture status, the Reanimated major and the list library's major first. Defer fixes that need absent native dependencies, Pods or Gradle changes. Don't batch navigation, gesture, safe-area or native-config changes as mechanical edits. Verify on release-build devices and name the platforms not tested.

Several rules below depend on those facts: FlashList v2 and `boxShadow` need the New Architecture; autolinking changed in Expo SDK 54; `NativeTabs` moved in SDK 58.

## Render crashes

[Vercel, react-native-skills]

- **Strings live inside `<Text>`.** A string as a direct child of `<View>` crashes: `Error: Text strings must be rendered within a <Text> component.`
- **"Never use `{value && <Component />}` when `value` could be an empty string or `0`."** They are falsy but renderable, so React Native tries to render them as text outside a `<Text>` and crashes in production. On the web the same leak prints a stray `0` instead (react.dev: "Don't put numbers on the left side of `&&`", in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#keys-and-component-identity)). Lint: `react/jsx-no-leaked-render` from [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-no-leaked-render.md).

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  return (
    <View>
      {name && <Text>{name}</Text>}
      {count && <Text>{count} items</Text>}
    </View>
  )
}
// If name="" or count=0, renders the falsy value → crash
```

The source's two inline fixes are a ternary, `{count ? <Text>{count} items</Text> : null}`, and explicit coercion, `{!!count && <Text>{count} items</Text>}`. Its best form is an early return:

```tsx
function Profile({ name, count }: { name: string; count: number }) {
  if (!name) return null

  return (
    <View>
      <Text>{name}</Text>
      {count > 0 ? <Text>{count} items</Text> : null}
    </View>
  )
}
```

## Lists

### Virtualize every list

[Vercel, react-native-skills] "Use a list virtualizer like LegendList or FlashList instead of ScrollView with mapped children, even for short lists." A `ScrollView` mounts every child: "50 items = 50 components mounted, even if only 10 visible". "Benefits apply to any screen with scrollable content, profiles, settings, feeds, search results. Default to virtualization." The web rule is narrower: [ui-animation PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/PERFORMANCE.md) virtualizes past hundreds of animated items.

```tsx
import { FlashList } from '@shopify/flash-list'

function Feed({ items }: { items: Item[] }) {
  return (
    <FlashList
      data={items}
      // if you aren't using React Compiler, wrap these with useCallback
      renderItem={({ item }) => <ItemCard item={item} />}
      keyExtractor={(item) => item.id}
    />
  )
}
```

**FlashList v2, corrected** ([v2 migration](https://shopify.github.io/flash-list/docs/v2-migration)): the size props are gone, "Size Estimation Props (No Longer Needed!)": remove `estimatedItemSize`, `estimatedListSize` and `estimatedFirstItemOffset`. `MasonryFlashList` becomes `<FlashList masonry numColumns={3} />`, and `overrideItemLayout` sets only `span`. "v2 only works on top of React Native's new architecture." The source still passed `estimatedItemSize={100}` to FlashList in its gallery rule.

**From the FlashList usage page** ([usage](https://shopify.github.io/flash-list/docs/usage)): remove explicit `key` props inside the `renderItem` tree (for a `.map()` inside an item, use its `useMappingHelper` hook); check any `useState` in an item, since a recycled item receives a different item's data and that state may need resetting; and "Do not test performance with JS dev mode on. Make sure you're in release mode."

The LegendList form (`@legendapp/list`, with `estimatedItemSize={80}` and `recycleItems`) is the source's; its props were not checked here.

### Keep references stable

[Vercel, react-native-skills] "Don't map or filter data before passing to virtualized lists. Virtualization relies on object reference stability to know what changed." Mapping data into new objects in the parent ends up "reparenting the entire list on every keystroke". Pass the stable array and transform inside the item:

```tsx
const renderItem = ({ item }) => <DomainItem tld={item} />

function DomainSearch() {
  const { data: tlds } = useTlds()

  return (
    <LegendList
      // good: as long as the data is stable, LegendList will not re-render the entire list
      data={tlds}
      renderItem={renderItem}
    />
  )
}

function DomainItem({ tld }: { tld: Tld }) {
  // good: transform within items, and don't pass the dynamic data as a prop
  // good: use a selector function from zustand to receive a stable string back
  const domain = useKeywordZustandState((s) => s.keyword + '.' + tld.name)
  return <Text>{domain}</Text>
}
```

- A new array is fine when its inner objects are the same ones: `tlds.toSorted((a, b) => a.name.localeCompare(b.name))`.
- State that belongs to one row is read by the row: `useFavoritesStore((s) => s.favorites.has(tld.id))`, so toggling a favourite re-renders one component, not the list.
- With the React Compiler, reading Context in items is "slightly slower than using a Zustand selector in most cases, the effect may be negligible."

### One callback, primitives in, light rows

[Vercel, react-native-skills]

- **Create one callback at the list root; items call it with their id.** The source's "Correct" example for this rule is broken (it calls `useCallback(() => handlePress(item.id), ...)` outside `renderItem`, where `item` doesn't exist). The working form is in its memo rule: pass the id, build the handler in the row.

```tsx
// Incorrect: inline function creates new reference
<UserRow name={item.name} onPress={() => handlePress(item.id)} />

// Correct: pass ID, handle in child
<UserRow id={item.id} name={item.name} />

const UserRow = memo(function UserRow({ id, name }: Props) {
  const handlePress = useCallback(() => {
    // use id here
  }, [id])
  return <Pressable onPress={handlePress}><Text>{name}</Text></Pressable>
})
```

- **No inline objects in `renderItem`.** `user={{ id: item.id, name: item.name }}` or `style={{ backgroundColor: item.isActive ? 'green' : 'gray' }}` is a new reference every render. Pass the item itself or primitives and derive the style inside the memoized row (`style={[styles.row, { backgroundColor }]}`), or hoist `activeStyle` and `inactiveStyle` to module scope.
- **Pass primitives to `memo()` rows, and only the fields used:** `<UserRow name={item.name} avatarUrl={item.avatar} />`, not `user={item}` when only the name renders. "If you have the React Compiler enabled, you do not need to use `memo()` or `useCallback()`, but the object references still apply."
- **Keep rows light:** "No queries or data fetching"; no expensive computation (move it to the parent); "Prefer Zustand selectors over React Context"; few `useState` and `useEffect`; pass pre-computed values. Membership checks use a `Set` built once at the root, `s.items.has(id)`, not `Array.includes()`. "The goal: list items should be simple rendering functions that take props and return JSX."

### Mixed item types

[Vercel, react-native-skills] A list of headers, messages and images gives each item a `type` and the list a `getItemType`, so items share a recycling pool only with their own type: "A header never recycles into an image cell", and a `switch` in `renderItem` narrows the TypeScript type per branch.

```tsx
type HeaderItem = { id: string; type: 'header'; title: string }
type MessageItem = { id: string; type: 'message'; text: string }
type ImageItem = { id: string; type: 'image'; url: string }
type FeedItem = HeaderItem | MessageItem | ImageItem

function Feed({ items }: { items: FeedItem[] }) {
  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.id}
      getItemType={(item) => item.type}
      renderItem={({ item }) => {
        switch (item.type) {
          case 'header':
            return <SectionHeader title={item.title} />
          case 'message':
            return <MessageRow text={item.text} />
          case 'image':
            return <ImageRow url={item.url} />
        }
      }}
      recycleItems
    />
  )
}
```

LegendList also takes `getEstimatedItemSize={(index, item, itemType) => ...}` per type (the source's 48, 72 and 300). FlashList has the same `getItemType` ("This will improve recycling if you have different types of items in the list", default type `0`, [usage](https://shopify.github.io/flash-list/docs/usage)) but no size estimate in v2.

## State

### Store the truth, derive the rest

[Vercel, react-native-skills] "State should be the minimal source of truth. Everything else is derived." Deriving during render instead of syncing in an Effect is defined in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#you-might-not-need-an-effect) ([react.dev, choosing the state structure](https://react.dev/learn/choosing-the-state-structure)).

The same rule for UI state: store `isExpanded`, derive `const height = isExpanded ? 200 : 0`, never `setHeight` in an effect. State names what is true (`pressed`, `progress`, `isOpen`), not its visual output (`scale`, `opacity`, `translateY`). The shared-value half of this rule (`pressed` 0 to 1 driving `interpolate`) is motion: [REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md#keep-it-off-the-js-thread).

### Fallback state instead of a copied initial value

[Vercel, react-native-skills] Start state at `undefined` and fall back with `??`, so "`undefined` means 'user hasn't chosen yet'" and the fallback stays live when the prop or server value changes. The source's code read an undeclared `defaultEnabled`; the prop is `fallbackEnabled`. Below is the source's block with `defaultEnabled` renamed `fallbackEnabled` (in the code and its comment), the only change.

```tsx
type Props = { fallbackEnabled: boolean }

function Toggle({ fallbackEnabled }: Props) {
  const [_enabled, setEnabled] = useState<boolean | undefined>(undefined)
  const enabled = _enabled ?? fallbackEnabled
  // undefined = user hasn't touched it, falls back to prop
  // If fallbackEnabled changes, component reflects it
  // Once user interacts, their choice persists

  return <Switch value={enabled} onValueChange={setEnabled} />
}
```

With server data: `const theme = _theme ?? data.theme` "Shows server value until user overrides"; a refetch updates the fallback.

### Updaters when the next value depends on the current one

[Vercel, react-native-skills]

- The updater form for a value that depends on the current one is in [EFFECTS-AND-STATE.md](EFFECTS-AND-STATE.md#state-updates).
- For object state, compare inside the updater: "Returning the previous value from the updater skips the re-render."

```tsx
const [size, setSize] = useState<Size | undefined>(undefined)

const onLayout = (e: LayoutChangeEvent) => {
  const { width, height } = e.nativeEvent.layout
  setSize((prev) => {
    if (prev?.width === width && prev?.height === height) return prev
    return { width, height }
  })
}
```

- "For primitive states, you don't need to compare values before firing a re-render": the source sets it directly, `setSize(width)`. Its example declares that state `useState<Size | undefined>` and then sets a number, so the type needs fixing before use.

### Scroll position that nothing renders

[Vercel, react-native-skills] "Never store scroll position in `useState`." When nothing on screen reads it, keep it in a ref: `scrollY.current = e.nativeEvent.contentOffset.y`. When something animates from it, it's a shared value ([REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md#keep-it-off-the-js-thread)).

**`scrollEventThrottle`, corrected** ([ScrollView](https://reactnative.dev/docs/scrollview)): the default is `0`, and "Values ≤ `16` will disable throttling, regardless of the refresh rate of the device." So `16` means unthrottled, not a 60 fps cap. The source's comment beside `16` said "higher number has better performance, but it fires less often", which holds only above 16.

### The React Compiler and functions from hooks

[Vercel, react-native-skills] "This rule is only applicable if you are using the React Compiler." Destructure functions from hooks and props at the top of render (`const { push } = useRouter()`, `function SaveButton({ onSave })`), so the compiler keys its cache on the functions. The source's reason, that `router` and `props` "are objects that change each render", is not stated on react.dev or in the Expo Router docs checked here; keep it as the source's claim.

## Measuring views

[Vercel, react-native-skills] Measure once synchronously in `useLayoutEffect`, then keep it current with `onLayout`; for object state compare in an updater ([State](#updaters-when-the-next-value-depends-on-the-current-one)).

```tsx
import { useLayoutEffect, useRef, useState } from 'react'
import { View, LayoutChangeEvent } from 'react-native'

function MeasuredBox({ children }: { children: React.ReactNode }) {
  const ref = useRef<View>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    // Sync measurement on mount (RN 0.82+)
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setHeight(rect.height)
    // Pre-0.82: ref.current?.measure((x, y, w, h) => setHeight(h))
  }, [])

  const onLayout = (e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height)
  }

  return (
    <View ref={ref} onLayout={onLayout}>
      {children}
    </View>
  )
}
```

**Version, unconfirmed:** the source labels `getBoundingClientRect()` "RN 0.82+" with `measure()` as the older path. The [element nodes](https://reactnative.dev/docs/element-nodes) page lists `getBoundingClientRect()` and puts `measure()` under "Legacy API", but states no version. Text scaling and measured heights are in [REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md#reduced-motion-and-text-size).

## Navigation

[Vercel, react-native-skills] Native navigators use "UINavigationController on iOS, Fragment on Android".

- **Stacks:** `@react-navigation/native-stack` (`createNativeStackNavigator`), or Expo Router's `<Stack />`, which is the native stack. Avoid `@react-navigation/stack`.
- **Tabs:** `react-native-bottom-tabs` with `@bottom-tabs/react-navigation` (`createNativeBottomTabNavigator`, `tabBarIcon: () => ({ sfSymbol: 'house' })`), or Expo Router's `NativeTabs`. Avoid `@react-navigation/bottom-tabs` "when native feel matters"; its 7.x page points to a separate native bottom tabs navigator.
- **Headers:** native options over `header: () => <CustomHeader />`: `title`, `headerLargeTitleEnabled: true` (iOS-only), `headerSearchBarOptions: { placeholder: 'Search' }` for the native search bar. [React Navigation 7](https://reactnavigation.org/docs/native-stack-navigator/) documents both options. The motion source adds "`headerLargeTitle` is deprecated" [Emil Kowalski, animate-expo]; that is not stated there (unconfirmed).

The source's native-tabs layout, with only the import path changed to the SDK 58 form (correction below):

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs } from 'expo-router/native-tabs'

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name='index'>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='house.fill' md='home' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='gear' md='settings' />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
```

**`NativeTabs`, corrected** ([Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs/)): SDK 58 and later import from `expo-router/native-tabs`; SDK 54 to 57 use `expo-router/unstable-native-tabs`, the only path the source gave. `NativeTabs.Trigger.Label` is SDK 55 and later. `Icon` takes `sf`, `md`, `src`, `xcasset`, `drawable`, or `{ default, selected }`. On iOS, native tabs turn on automatic content insets for the first `ScrollView` of each tab screen; `disableAutomaticContentInsets` on the trigger turns that off, and then "you must manage safe area insets manually". All tab screens render eagerly, and that can't be changed; the motion consequence is in [REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md#pick-the-tool).

## Sheets and modals

[Vercel, react-native-skills] Use a native sheet, not a JS bottom-sheet library: native ones bring "swipe-to-dismiss, proper keyboard avoidance, and accessibility out of the box". The React Navigation form is right:

```tsx
// In your navigator
<Stack.Screen
  name='Details'
  component={DetailsScreen}
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: 'fitToContents',
  }}
/>
```

React Navigation's `formSheet` "Uses "BottomSheetBehavior" on Android and "UIModalPresentationFormSheet" … on iOS", with `sheetAllowedDetents` as `'fitToContents'` or fractions ([native stack navigator](https://reactnavigation.org/docs/native-stack-navigator/)). Motion recipes are in [REACT-NATIVE-MOTION-RECIPES.md](REACT-NATIVE-MOTION-RECIPES.md#screen-transitions).

- **`formSheet` differs by platform** ([Expo modals](https://docs.expo.dev/router/advanced/modals/)): Android caps detents at three; `sheetGrabberVisible` is iOS-only; Android form sheets can't host native headers or nested stacks; `fitToContents` needs explicitly sized content, not a `flex: 1` root.

**`<Modal presentationStyle="formSheet">`, corrected** ([Modal](https://reactnative.dev/docs/modal)): `presentationStyle` is iOS-only and "controls how the modal appears (generally on larger devices such as iPad or plus-sized iPhones)"; `formSheet` "covers narrow-width view centered (only on larger devices)". So it is not a detented bottom sheet, and it has no Android form. On iOS, `onRequestClose` is also called when a `pageSheet` or `formSheet` modal is dismissed by dragging. The source offered the core `Modal` with `formSheet` as an equal bottom-sheet replacement; use the navigator's `formSheet` for that.

## Safe areas and insets

[Vercel, react-native-skills] The source replaces safe-area wrappers and padding with scroll-view insets. On iOS that works; all three props are **iOS-only** ([ScrollView](https://reactnative.dev/docs/scrollview)), so followed alone the rules leave Android content under the system bars.

- **`contentInsetAdjustmentBehavior="automatic"`** on the root `ScrollView` lets iOS apply the safe-area insets natively and lets content scroll under the status bar. The default is `'never'`; values are `'automatic'`, `'scrollableAxes'`, `'never'`, `'always'`.
- **`contentInset` with `scrollIndicatorInsets`** for top or bottom space that changes (keyboard, toolbar): it moves the scroll bounds without re-laying-out the content. `scrollIndicatorInsets` "should normally be set to the same value as the `contentInset`." Space that never changes can stay padding.

```tsx
function Feed({ bottomOffset }: { bottomOffset: number }) {
  return (
    <ScrollView
      contentInset={{ bottom: bottomOffset }}
      scrollIndicatorInsets={{ bottom: bottomOffset }}
    >
      {children}
    </ScrollView>
  )
}
// Changing bottomOffset only adjusts scroll bounds
```

- **Android** still needs `react-native-safe-area-context` (`useSafeAreaInsets`). The core `SafeAreaView` is deprecated: "Use react-native-safe-area-context instead" ([SafeAreaView](https://reactnative.dev/docs/safeareaview)), which matches the source's dislike of it.

## Pressables and menus

- **`Pressable` over the Touchables** [Vercel, react-native-skills]. The source says "Never use `TouchableOpacity`"; React Native doesn't deprecate it and calls Pressable "a more extensive and future-proof way" ([TouchableOpacity](https://reactnative.dev/docs/touchableopacity)). Prefer `Pressable`; the docs don't mark the Touchables deprecated.
- **Inside scrolling lists,** `Pressable` from `react-native-gesture-handler` coordinates with the scroll "as long as you are using the ScrollView from `react-native-gesture-handler` as well." Animated press states are in [Motion rules in this source](#motion-rules-in-this-source).
- **Native menus with [zeego](https://zeego.dev)** [Vercel, react-native-skills], instead of an absolutely positioned JS menu: native menus "provide built-in accessibility, consistent platform UX, and better performance"; zeego covers both platforms.
- **`Link.Preview` and `Link.Menu`** are an "iOS-only feature available in SDK 54 and later"; a `Link` with a preview or menu but no `Link.Trigger` throws ([Expo link preview](https://docs.expo.dev/router/reference/link-preview/)).

```tsx
import * as DropdownMenu from 'zeego/dropdown-menu'

function MyMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable>
          <Text>Open Menu</Text>
        </Pressable>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item key='edit' onSelect={() => console.log('edit')}>
          <DropdownMenu.ItemTitle>Edit</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          key='delete'
          destructive
          onSelect={() => console.log('delete')}
        >
          <DropdownMenu.ItemTitle>Delete</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
```

Long press is `zeego/context-menu` with the same `Root`, `Trigger`, `Content`, `Item`, `ItemTitle`. Toggles are `DropdownMenu.CheckboxItem` with `value`, `onValueChange` and a `DropdownMenu.ItemIndicator`; submenus are `Sub`, `SubTrigger` and `SubContent`.

## Styling

[Vercel, react-native-skills] with platform limits from [View style props](https://reactnative.dev/docs/view-style-props).

- **`gap` for space between children, `padding` for space within:** `<View style={{ padding: 16, gap: 12 }}>`, not `marginBottom` on each child.
- **`borderCurve: 'continuous'`** beside `borderRadius` for smoother corners. It is **iOS-only** ("On iOS 13+, it is possible to change the corner curve of borders"). The source said "Always".
- **`boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'`** over `shadowColor`/`shadowOffset` objects and `elevation`: "`boxShadow` is only available on the New Architecture. Outset shadows are only supported on Android 9+. Inset shadows are only supported on Android 10+." The source gave no limits.
- **Gradients without a library, corrected.** The source: "Use `experimental_backgroundImage`" (`'linear-gradient(to bottom, #000, #fff)'`). The current docs list an unprefixed `backgroundImage`, which "provides the ability to draw a `linear-gradient()` and `radial-gradient()` using a web-like syntax" and is not marked experimental: `<View style={{ backgroundImage: 'linear-gradient(45deg, blue, red)' }} />`. Only `experimental_backgroundPosition`, `experimental_backgroundRepeat` and `experimental_backgroundSize` carry "**This API is experimental.**… Don't use them in production."
- **Type hierarchy, both ways.** The source: "Avoid multiple font sizes, use weight and color for emphasis" (one size; title `fontWeight: '600'`, subtitle `#666`, caption `#999`). The owner's app sets a type scale by role instead, from `type-display` `clamp(1.75rem, 1.5rem + 1cqi, 2rem)` to `type-card-title` 1.0625rem and smaller steps ([app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#type-by-role)). app-ui governs app-ui.

## Images

[Vercel, react-native-skills]

- **Request the size you show:** "4000x3000 image loaded for a 100x100 thumbnail" costs memory and scroll jank. Ask the server or an image CDN for 2x the display size: `${product.imageUrl}?w=200&h=200&fit=cover` for a 100×100 slot. The web rule is in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md).
- **`expo-image` over the core `Image`:** "memory-efficient caching, blurhash placeholders, progressive loading, and better performance for lists." Cross-platform with the web: `SolitoImage` from `solito/image`, which uses `expo-image`.

```tsx
import { Image } from 'expo-image'

<Image
  source={{ uri: url }}
  placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
  contentFit="cover"
  transition={200}
  priority="high"
  cachePolicy="memory-disk"
  style={styles.image}
/>
```

**`expo-image` props, corrected** ([expo-image](https://docs.expo.dev/versions/latest/sdk/image/)): `contentFit` is `cover` (default), `contain`, `fill`, `none` or `scale-down`; the source left out `none`. `cachePolicy` defaults to `'disk'` (also `null`, `'none'`, `'memory'`, `'memory-disk'`); `priority` defaults to `'normal'`. A blurhash placeholder without width and height defaults to 16. `recyclingKey` "resets the image view content to blank or a placeholder before loading"; it is "especially useful for any kinds of recycling views like FlashList" "to prevent showing the previous source before the new one fully loads."

- **A lightbox with [`@nandorojo/galeria`](https://github.com/nandorojo/galeria),** not a custom `Modal`: native shared-element zoom, pinch, double-tap and pan-to-close, with any image component. Thumbnails can be low-res while `urls` holds the high-res set (`<Galeria urls={highResUrls}>` around the low-res images). Inside FlashList:

```tsx
<Galeria urls={urls}>
  <FlashList
    data={urls}
    renderItem={({ item, index }) => (
      <Galeria.Image index={index}>
        <Image source={{ uri: item }} style={styles.thumbnail} />
      </Galeria.Image>
    )}
    numColumns={3}
  />
</Galeria>
```

The source's version passed `estimatedItemSize={100}`, removed in FlashList v2 ([Lists](#virtualize-every-list)).

## Design-system components

[Vercel, react-native-skills]

- **Compound components, not polymorphic children.** "If a component can receive a string child, it must be a dedicated `*Text` component." A button is `Button` (a `Pressable`), `ButtonText` and `ButtonIcon`, composed explicitly, never `typeof children === 'string' ? <Text>{children}</Text> : children`. It also keeps strings out of `View`s ([Render crashes](#render-crashes)).

```tsx
<Button>
  <ButtonIcon><SaveIcon /></ButtonIcon>
  <ButtonText>Save</ButtonText>
</Button>
```

- **Import from a design-system folder, both ways.** The source: "Re-export dependencies from a design system folder. App code imports from there, not directly from packages", one file per component (`components/view.tsx` wraps `View` with `Pick<React.ComponentProps<typeof RNView>, 'style' | 'children'>`; `components/text.tsx` is `export { Text } from 'react-native'`). The owner's CLAUDE.md says "Prefer direct named exports and imports. Avoid broad re-export barrels unless a framework requires one." One wrapper file per concept is not a barrel, but a bare re-export file is close to one; the owner decides per project.

## Fonts and formatters

- **Embed fonts with the `expo-font` config plugin** [Vercel, react-native-skills], not `useFonts` or `Font.loadAsync`, so there is no loading gate:

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/Geist-Bold.otf"]
        }
      ]
    ]
  }
}
```

Then `npx expo prebuild` and rebuild; `<Text style={{ fontFamily: 'Geist-Bold' }}>` works at launch. Expo: "We recommend using the config plugin instead whenever possible"; on Android "the file name becomes the font family name", while iOS takes the name from the font's metadata; the plugin also has `android.fonts` (with `fontFamily` and `fontDefinitions` for weights) and `ios.fonts`; the plugin needs prebuild ([expo-font](https://docs.expo.dev/versions/latest/sdk/font/)).

- **Hoist `Intl` formatters** [Vercel, react-native-skills]: `Intl.NumberFormat`, `DateTimeFormat` and `RelativeTimeFormat` at module scope when locale and options are fixed, `useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])` when the locale changes. The source's reason, "each instantiation parses locale data and builds internal lookup tables", was not measured here. The inline form in [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md) is about wording, not cost.

## Monorepos

- **Native dependencies and autolinking, corrected for Expo** ([Expo autolinking](https://docs.expo.dev/modules/autolinking/)). The source: "Autolinking only scans the app's `node_modules`", so a native package used by `packages/ui` must also be listed in `packages/app`. Since SDK 54, Expo autolinking "resolves the dependencies of your app and any dependency or peer dependency recursively", matching Node resolution; "Before SDK 54, Expo Autolinking didn't search dependencies recursively and only resolved your app's direct dependencies"; `legacy_shallowReactNativeLinking` restores that for React Native modules. With two versions of a native module, "your JavaScript bundle may contain both versions of the native module", and "This might cause runtime crashes and risks incompatibilities." React Native CLI projects without Expo were not checked.
- **One version of each native module.** "Only one version of a native module can be compiled for an app build at a time" ([Expo monorepos](https://docs.expo.dev/guides/monorepos/)); "Duplicate React versions in a single app will cause runtime errors." In SDK 54, `experiments.autolinkingModuleResolution: true` in app.json is opt-in; "From SDK 55, this is enabled automatically for apps in monorepos."
- **Single versions across the repo** [Vercel, react-native-skills]: exact versions without `^` or `~`, enforced with syncpack, a root `pnpm.overrides`, or yarn `resolutions` "as a last resort". Expo's monorepo guide uses `resolutions` (npm: `overrides`) to force one `react`. The source's pin, `react-native-reanimated` 3.16.1, is Reanimated 3; Reanimated 4 is current ([REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md#setup-that-silently-breaks-motion)).

## Motion rules in this source

The source's animation rules belong to [REACT-NATIVE-MOTION.md](REACT-NATIVE-MOTION.md), which already states the correct forms. Where this source is wrong:

- **Non-layout properties:** the source says only `transform` and `opacity` avoid layout. Reanimated: "Animating non-layout properties (like `transform`, `opacity` or `backgroundColor`) is generally more performant… the latter group requires an additional step of layout recalculation" ([performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)). Its `scaleY` collapse on a fixed `height: 200` box still takes 200 in layout.
- **`interpolate(withTiming(...), ...)` is invalid:** "withTiming returns an animation object" ([withTiming](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/)), not a number. Interpolate the shared value: `interpolate(pressed.get(), [0, 1], [1, 0.95])`.
- **`runOnJS`** is deprecated in Reanimated 4; use `scheduleOnRN` ([migration from 3.x](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)).
- **Gesture builders rebuilt every render:** memoize gesture objects, or use the Gesture Handler 3 hooks (`useTapGesture`), which have Reanimated integration on by default ([Reanimated interactions](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/reanimated-interactions/)).
- **A shared value read in JSX** (``title={`Count: ${count.get()}`}``, the source's "Correct" example) breaks "Don't read or modify the value of a shared value during a component's render" ([useSharedValue](https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/)).
- **Derive, react only for side effects** [Vercel, react-native-skills]: "When deriving a shared value from another, use `useDerivedValue`… Use `useAnimatedReaction` only for side effects that don't produce a value (e.g., triggering haptics, logging…)", as the [native threshold recipe](REACT-NATIVE-MOTION-RECIPES.md#fire-once-at-a-threshold) does.
- **Press feedback, both ways.** The source drives press scale with `GestureDetector`, `Gesture.Tap()` and shared values "instead of Pressable's `onPressIn`/`onPressOut`… no JS thread round-trip". [REACT-NATIVE-MOTION-RECIPES.md](REACT-NATIVE-MOTION-RECIPES.md#press-feedback) uses `Pressable` with a Reanimated CSS transition: "A press scale is a CSS transition; a drag is a shared value", and `setState` "fires twice per press, not per frame". The native-motion reference's press-feedback rule stays the default.

## Prove it

Run on a release build on each platform you ship, and name the ones you didn't. No string sits outside a `<Text>` and no `&&` has a string or number on its left (`react/jsx-no-leaked-render` passes); every scrolling list is virtualized, FlashList v2 carries no `estimatedItemSize`, and rows take primitives and fetch nothing; no state is synced from props in an effect; every iOS-only prop (`presentationStyle`, `contentInset`, `contentInsetAdjustmentBehavior`, `scrollIndicatorInsets`, `borderCurve`, `headerLargeTitleEnabled`) has an Android answer or is checked on Android; `boxShadow` sits on the New Architecture; `NativeTabs` imports from the path for the project's SDK; and a monorepo has one version of each native module.
