# Semantics

How a custom render object describes itself to screen readers (TalkBack, VoiceOver), switch devices and widget tests: `describeSemanticsConfiguration`, labels, values and hints, flags, actions, merging, boundaries, exclusion, blocking, `markNeedsSemanticsUpdate` and `semanticBounds`. Sources: the renderobjects.com semantics guide and API pages (Matt Carroll; no Flutter version stated), checked against api.flutter.dev and Flutter master source. Where the source is wrong, the official form comes first, then one line on what renderobjects.com says. Widget-level semantics are in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md).

**Contents:** [Widget layer first](#widget-layer-first) · [The entry point](#the-entry-point) · [Labels, values and hints](#labels-values-and-hints) · [Flags](#flags) · [Actions](#actions) · [Merging, boundaries and explicit children](#merging-boundaries-and-explicit-children) · [Excluding, blocking and hiding](#excluding-blocking-and-hiding) · [Keeping it fresh](#keeping-it-fresh) · [Coordinates and order](#coordinates-and-order) · [semanticBounds](#semanticbounds) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## Widget layer first

- **Prefer the widget layer** (`Semantics`, `MergeSemantics`, `ExcludeSemantics`, `BlockSemantics`), for example `Semantics(button: true, label: 'Submit', onTap: ..., child: ...)` [renderobjects](https://renderobjects.com/guides/semantics/). Composed custom widgets get semantics there, not in a render object.
- **Go to the render object only when:** (1) only the render object has the information (a custom scrollable exposing scroll actions from layout state); (2) the render object is the control (a custom slider with its own paint, gestures and value); (3) it is a low-level reusable primitive whose semantics should ride along [renderobjects](https://renderobjects.com/guides/semantics/).

## The entry point

- **`describeSemanticsConfiguration(SemanticsConfiguration config)`** is called "when building the semantics tree, the parallel tree consumed by screen readers (TalkBack, VoiceOver), accessibility services, and widget tests. Override it to declare what your render object represents and how a user can interact with it." Write to the config "to describe the node's role, label, current value, and any actions" [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/). Doc: https://api.flutter.dev/flutter/rendering/RenderObject/describeSemanticsConfiguration.html
- **Related methods:** `markNeedsSemanticsUpdate` and, for advanced cases, `assembleSemanticsNode` [renderobjects](https://renderobjects.com/guides/semantics/).
- **No override means an empty config.** Children still flow through, which is correct for structural objects [renderobjects](https://renderobjects.com/guides/semantics/). The API page puts it this way: a render object that leaves the config untouched "is invisible to the semantics tree", and nodes produced by its children "are merged upward into the nearest ancestor that does have semantics" [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/).
- **The tree.** The framework builds a tree of `SemanticsNode`s parallel to the render tree (like the layer tree) and handles node identity across frames and platform notifications. "A render object's job is narrow: describe yourself." [renderobjects](https://renderobjects.com/guides/semantics/)
- **Minimal override** [renderobjects](https://renderobjects.com/guides/semantics/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config.label = 'Submit';
  config.isButton = true;
  config.onTap = _handleTap;
}
```

- **Call super first and keep it cheap.** It runs on every semantics pass after the object is marked dirty; cache computed labels [renderobjects](https://renderobjects.com/guides/semantics/).
- **The config surface:** text (`label`, `value`, `hint`, `increasedValue`, `decreasedValue`), flags, actions (`onTap`, `onLongPress`, `onScrollUp`, `onIncrease`, `onSetText` and more) and structure (`isSemanticBoundary`, `explicitChildNodes`, `isBlockingSemanticsOfPreviouslyPaintedNodes`). Set only what is true, and do not keep the config object [renderobjects](https://renderobjects.com/guides/semantics/).

## Labels, values and hints

- **label = what it is;** every interactive element needs one. **value = current state** (slider position, text field content; empty for boolean controls, whose state comes from `isChecked`). **hint = supplementary,** read after a delay, often turned off by users, never load-bearing; essential text goes in the label [renderobjects](https://renderobjects.com/guides/semantics/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config.label = 'Volume';                // What it is.
  config.value = '${(_volume * 100).round()}%';  // Its current state.
  config.hint = 'Slide to adjust';        // Supplementary action info.
}
```

- **Pair a label with `textDirection`** ("Always pair a label with `textDirection`.") [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config
    ..label = 'Monthly revenue chart, ${'$_currentMonth'}'
    ..textDirection = TextDirection.ltr
    ..isImage = true;
}
```

  The API page hardcodes `TextDirection.ltr` in its examples. [ELEMENTS.md](ELEMENTS.md#inherited-widgets-from-elements-and-render-objects) shows how a render object receives `Directionality`.
- **Strings are spoken verbatim, so localize them.** Take them as inputs from the widget (which localizes through `Intl` or `AppLocalizations`); never hardcode English in a library render object [renderobjects](https://renderobjects.com/guides/semantics/). See [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md).
- **`increasedValue` / `decreasedValue`** are the value after an increment or decrement, announced on the action; some platforms preview them [renderobjects](https://renderobjects.com/guides/semantics/). Official rule (Flutter master `semantics.dart`): one of `increasedValue` or `attributedIncreasedValue` "must be set if a handler for [SemanticsAction.increase] is provided and one of the [value] or [attributedValue] is set" (likewise for decrease), and `SemanticsNode` asserts "A SemanticsNode with action \"increase\" needs to be annotated with either both \"value\" and \"increasedValue\" or neither".
- **Value and range** [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config
    ..label = 'Volume'
    ..value = '${(_volume * 100).round()}%'
    ..textDirection = TextDirection.ltr
    ..onIncrease = () => _setVolume((_volume + 0.1).clamp(0.0, 1.0))
    ..onDecrease = () => _setVolume((_volume - 0.1).clamp(0.0, 1.0));
}
```

  Fix to the source: this example sets `value` and `onIncrease` / `onDecrease` without `increasedValue` / `decreasedValue`, so it trips the `SemanticsNode` assert quoted above in debug; set both (Flutter master `semantics.dart`).
  For progress indicators, [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md) records a percentage `SemanticsValue` (Flutter 3.44); the source's string `value` does not use it.

## Flags

- **Role flags** [renderobjects](https://renderobjects.com/guides/semantics/): `isButton` (with `onTap`, announced as "button", tap to activate), `isHeader` (fast header navigation), `isImage`, `isTextField`, `isLink`, `isObscured` (password). State flags `isChecked`, `isToggled`, `isSelected`, `isFocused`, `isEnabled` describe current state, not capability.
- **State flags are `bool?`.** `isChecked`, `isToggled`, `isEnabled`, `isFocused` and `isExpanded` are nullable: null means "no such state", true or false declares the state; a tristate checkbox uses `isCheckStateMixed`. "Do not call the setter for this field if the owning [RenderObject] doesn't have checked/unchecked state that can be controlled by the user." There is no `isCheckbox` on `SemanticsConfiguration`. https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isChecked.html
  - renderobjects.com (no version stated) says to pair `isChecked` with an `isCheckbox` flag, which does not exist.
- **Live regions: `config.liveRegion`** announces changes while focus is elsewhere; it controls the `SemanticsFlag.isLiveRegion` flag. https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/liveRegion.html
  - renderobjects.com (no version stated) names the config property `isLiveRegion`, which is the flag, not the setter.
- **Focus:** set `isFocused` (`bool?`). `isFocusable` is deprecated after v3.36.0-0.0.pre ("Setting isFocused automatically set this to true", Flutter master `semantics.dart`); the widget side is in [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md).
- **Headers.** The guide uses `isHeader` [renderobjects](https://renderobjects.com/guides/semantics/). Since Flutter 3.47 `header` is a no-op on iOS and Android; use heading levels, which at render-object level is `config.headingLevel = n` (asserts 0 to 6), and a level above 0 maps to an iOS and Android heading (breaking-change page https://docs.flutter.dev/release/breaking-changes/semantics-header-heading-level and the engine source). The api.flutter.dev page for `SemanticsConfiguration.headingLevel` still says "only used for web semantics"; it is stale. Details: [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md#breaking-change-details).
- **Set flags honestly:** "if you set a role flag, provide the corresponding action" [renderobjects](https://renderobjects.com/guides/semantics/). Tappable, with `isEnabled` so assistive technology knows whether the action is available [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config
    ..label = 'Submit'
    ..hint = 'Submits the form'
    ..textDirection = TextDirection.ltr
    ..isButton = true
    ..isEnabled = _enabled
    ..onTap = _enabled ? _handleTap : null;
}
```

- **Checked state** [renderobjects](https://renderobjects.com/api/semantics/describeSemanticsConfiguration/):

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config
    ..label = 'Receive notifications'
    ..textDirection = TextDirection.ltr
    ..isEnabled = true
    ..isChecked = _isChecked
    ..onTap = _handleToggle;
}
```

## Actions

- **Assigning a handler declares the action available** (VoiceOver rotor, TalkBack local context menu, switch device action list) [renderobjects](https://renderobjects.com/guides/semantics/):

```dart
config.onTap = () => _activate();
config.onLongPress = () => _showContextMenu();
config.onIncrease = () => _setValue(_value + _step);
config.onDecrease = () => _setValue(_value - _step);
```

- **Do not duplicate.** If an ancestor `GestureDetector` already handles taps, it supplies the semantic tap; an `onTap` on the render object as well creates duplicate actions [renderobjects](https://renderobjects.com/guides/semantics/).
- **`onIncrease` / `onDecrease` only for adjustable elements** (sliders, steppers, volume); platforms expose them through dedicated gestures (vertical swipe on iOS) [renderobjects](https://renderobjects.com/guides/semantics/).
- **More actions:** `onScrollUp`, `onScrollDown`, `onScrollLeft`, `onScrollRight`, `onDismiss`, `onCopy`, `onPaste`, `onSetSelection`, `onSetText`, `onDidGainAccessibilityFocus`, `onDidLoseAccessibilityFocus` [renderobjects](https://renderobjects.com/guides/semantics/).

## Merging, boundaries and explicit children

- **Merge a composite (icon plus label button) into one node.** "If your composite has a single interaction, it's a single semantic node" [renderobjects](https://renderobjects.com/guides/semantics/). Setting `isMergingSemanticsOfDescendants` to true "requires that [isSemanticBoundary] is also true"; the setter asserts it, and the framework's `RenderMergeSemantics` sets them in this order: `config..isSemanticBoundary = true..isMergingSemanticsOfDescendants = true;` (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isMergingSemanticsOfDescendants.html). The guide's example with the boundary line added:

```dart
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config.isButton = true;
  config.label = 'Submit';
  config.onTap = _handleTap;
  // Roll up the icon and label into this single semantic node.
  config.isSemanticBoundary = true;
  config.isMergingSemanticsOfDescendants = true;
}
```

  - renderobjects.com (no version stated) sets only `isMergingSemanticsOfDescendants = true`, which fails the assert in debug.
- **A boundary does not stop an ancestor's merge.** Once an ancestor merges, every descendant, semantic boundaries included, is merged into it: a boundary below a merging ancestor still forms its own node, and that node is merged into the ancestor (Flutter master `_RenderObjectSemantics`: `mergeIntoParent: (parentData?.mergeIntoParent ?? false) || configProvider.effective.isMergingSemanticsOfDescendants`). `isSemanticBoundary` means its information "will not leak into parents", which stops annotation of the parent, not an ancestor's merge (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isSemanticBoundary.html). To keep an inner "Remove" button separately focusable inside a card, do not merge across it: merge a narrower region.
  - renderobjects.com (no version stated) says "Merges don't cross semantic boundaries" and sets `isSemanticBoundary = true` on the inner button to escape the card's merge.
- **`explicitChildNodes = true`** for deliberately structured nodes (tables, trees, data rows); "the rarest of the three" [renderobjects](https://renderobjects.com/guides/semantics/):

```dart
// On a custom data row render object whose children should each remain distinct:
@override
void describeSemanticsConfiguration(SemanticsConfiguration config) {
  super.describeSemanticsConfiguration(config);
  config.label = 'Order summary';
  // Children below us produce their own nodes, sibling-style, under this one.
  config.explicitChildNodes = true;
}
```

  Official meaning: when true, children may contribute only by introducing their own explicit `SemanticsNode`s, not by annotating the parent; "often used in combination with [isSemanticBoundary]" (Flutter master `semantics.dart` doc comment). The widget form is in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md).
- **Mental model:** merge = collapse everything below me into my node; boundary = I form my own node and my information does not leak into my parent (see above for merges); explicitChildNodes = preserve child structure [renderobjects](https://renderobjects.com/guides/semantics/), corrected per the official docs above.
- **Over-merging absorbs inner controls; under-merging gives three focus stops for one button** [renderobjects](https://renderobjects.com/guides/semantics/).

## Excluding, blocking and hiding

- **Excluding a subtree:** use the `ExcludeSemantics` widget, or at render-object level do what `RenderExcludeSemantics` does: override `visitChildrenForSemantics` and return without visiting the children while excluding (https://api.flutter.dev/flutter/rendering/RenderExcludeSemantics-class.html). A boundary with an empty config still lets descendants form nodes under it.
  - renderobjects.com (no version stated) says a boundary with nothing populated (plus `explicitChildNodes = false` on the API page) makes the subtree invisible, and offers `bool get excludeFromSemantics => true;`, which does not compile: `RenderObject` has no `excludeFromSemantics` member (it exists only as a widget parameter, for example on `Image` and `GestureDetector`).
- **Blocking: `config.isBlockingSemanticsOfPreviouslyPaintedNodes = true`** drops the semantics of what was painted before, for modal overlays [renderobjects](https://renderobjects.com/guides/semantics/). Official limit: it drops "siblings and cousins ... earlier in a depth-first pre-order traversal ... up until a semantic boundary", in the paint order that `visitChildrenForSemantics` returns (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isBlockingSemanticsOfPreviouslyPaintedNodes.html).
- **Hiding: `config.isHidden = true`** keeps the node but hidden elements cannot gain focus by touch, though linear navigation still reaches them. "Instead of marking an element as hidden it should usually be excluded from the semantics tree altogether. Hidden elements are only included ... to work around platform limitations and they are mainly used to implement accessibility scrolling on iOS." (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isHidden.html)
  - renderobjects.com (no version stated) suggests `isHidden` for fading-out animations, with `Offstage` / `Visibility` covering common cases.

## Keeping it fresh

- **Call `markNeedsSemanticsUpdate` in every setter that affects semantics.** The official doc: it "must be called whenever the semantics configuration ... changes in any way" (Flutter master `object.dart` doc comment). Verbatim pattern [renderobjects](https://renderobjects.com/guides/semantics/):

```dart
set label(String value) {
  if (_label == value) return;
  _label = value;
  markNeedsSemanticsUpdate();
}
```

- **Missing it** means "the checkbox visibly toggled but the screen reader still says 'unchecked'". `markNeedsLayout` does not imply it; scrollables may need both. Keep the early return: each mark walks the tree and updates the platform, and "at scale" that is "accessibility-side jank" [renderobjects](https://renderobjects.com/guides/semantics/).

## Coordinates and order

- **Bounds come from `size` and tree position.** `pushTransform`, `pushOffset` and repaint boundaries are understood automatically; `applyPaintTransform` is shared by semantics and hit testing [renderobjects](https://renderobjects.com/guides/semantics/). See [PAINTING.md](PAINTING.md) and [HIT-TESTING.md](HIT-TESTING.md).
- **`visitChildrenForSemantics`** "has to return the children in paint order skipping all children that are not semantically relevant (e.g. because they are invisible)"; that order is what blocking uses (https://api.flutter.dev/flutter/rendering/RenderObject/visitChildrenForSemantics.html). Override it if you reorder children (a reverse-painted stack) so semantics sees paint order.
  - renderobjects.com (no version stated) presents the override as setting screen-reader reading order; the official purpose is paint order and skipping invisible children.

## semanticBounds

- **Contract:** "a `Rect` that defines the region the accessibility framework associates with a semantic node, expressed in the render object's own local coordinate space. Screen readers use it to position highlight overlays, and the framework uses it to route accessibility gestures". "Unlike `paintBounds`, which must be a conservative overestimate, `semanticBounds` should be accurate." Override it for a small icon that needs a larger target, padded containers or clipped content [renderobjects](https://renderobjects.com/api/semantics/semanticBounds/). The `RenderBox` default is `Rect get semanticBounds => Offset.zero & size;` (Flutter master `box.dart`; https://api.flutter.dev/flutter/rendering/RenderBox/semanticBounds.html).
- **Minimum target:** "Elements smaller than the platform-recommended minimum (48 × 48 logical pixels on Material platforms) should expand their semantic bounds" [renderobjects](https://renderobjects.com/api/semantics/semanticBounds/). Pointer hits are separate: `RenderBox.hitTest` checks `_size!.contains(position)` (Flutter master `box.dart`), see [HIT-TESTING.md](HIT-TESTING.md). Target sizes: [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md).

```dart
static const double _minTargetSize = 48.0;

@override
Rect get semanticBounds {
  return Rect.fromCenter(
    center: size.center(Offset.zero),
    width: size.width.clamp(_minTargetSize, double.infinity),
    height: size.height.clamp(_minTargetSize, double.infinity),
  );
}
```

- **Content area, clip rect, rounded clip** [renderobjects](https://renderobjects.com/api/semantics/semanticBounds/):

```dart
// _padding is an EdgeInsets stored by the render object.
@override
Rect get semanticBounds => _padding.deflateRect(Offset.zero & size);
```

```dart
// _clipRect is computed during performLayout() and used in paint().
@override
Rect get semanticBounds => _clipRect;
```

```dart
@override
Rect get semanticBounds => _clipRRect.outerRect;
```

- **Purely decorative or structural:** return `Rect.zero` (`Rect get semanticBounds => Rect.zero;`) [renderobjects](https://renderobjects.com/api/semantics/semanticBounds/), and exclude the subtree as in [Excluding, blocking and hiding](#excluding-blocking-and-hiding).
  - renderobjects.com (no version stated) pairs it with `bool get excludeFromSemantics => true;`, which does not exist on `RenderObject`.

## Pitfalls

From [renderobjects](https://renderobjects.com/guides/semantics/), with the merge item corrected above:

- Forgetting `markNeedsSemanticsUpdate`.
- A role without its action, or an action without its role.
- Hardcoded English.
- Over-merging (absorbs inner controls) and under-merging (several focus stops for one control).
- Trusting the visual hierarchy: `isHeader`, `isImage` and `isLink` must be set explicitly.
- Essential text in `hint` instead of `label`.
- No override on a meaningful object: it "doesn't exist to assistive tech".

## Prove it

- Every setter that changes a label, value, flag or action calls `markNeedsSemanticsUpdate` after an early return on equal values.
- Every `isMergingSemanticsOfDescendants = true` has `isSemanticBoundary = true` set before it.
- No `isCheckbox`, no `config.isLiveRegion`, no `excludeFromSemantics` override and no `isFocusable` on a `SemanticsConfiguration` or render object.
- Library render objects take label, value and hint strings from their widget; no English literals in `describeSemanticsConfiguration`.
- No `onTap` on a render object whose widget is already wrapped in a `GestureDetector` handling taps.
- With TalkBack or VoiceOver, a single-interaction composite is one focus stop, and an inner control the user must reach separately is not inside a merged region.
