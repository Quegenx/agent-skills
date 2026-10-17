# Show on screen

How a render object asks its ancestors to reveal it, and when a custom render object must handle that request: who calls `showOnScreen`, its signature and default, when to override, how a scrollable reveals a target (and why to reuse `RenderViewportBase.showInViewport`), clipping containers, blocking a request, and pitfalls. Sources: the renderobjects.com show-on-screen guide and `showOnScreen` API page (Matt Carroll; no Flutter version stated), checked against api.flutter.dev and Flutter master source. Where the source is wrong, the official form comes first, then one line on what renderobjects.com says.

**Contents:** [What it is and who calls it](#what-it-is-and-who-calls-it) · [Signature and default](#signature-and-default) · [When to override](#when-to-override) · [A scrollable](#a-scrollable) · [A clipping container](#a-clipping-container) · [Blocking a request](#blocking-a-request) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## What it is and who calls it

- **`showOnScreen` is how code says "make this render object visible".** A request bubbles up: each ancestor either handles it (scrolls) or passes it on; scrollables scroll and then continue the bubble-up so outer scrollables adjust; non-scrollables pass it through [renderobjects](https://renderobjects.com/guides/show-on-screen/).
- **The framework's own callers** (Flutter master): the semantics node built for a render object wires `SemanticsAction.showOnScreen` to `renderObject.showOnScreen` (a screen reader moving to an off-screen element), and `EditableText` calls `renderEditable.showOnScreen(rect: ...)` to reveal the caret (a focused field under the keyboard). `Scrollable.ensureVisible` does not call it: it walks the `Scrollable.maybeOf(context)` ancestors and scrolls each by position, and focus traversal calls `Scrollable.ensureVisible`. https://api.flutter.dev/flutter/widgets/Scrollable/ensureVisible.html, https://api.flutter.dev/flutter/rendering/RenderObject/showOnScreen.html
  - renderobjects.com (no version stated) says `Scrollable.ensureVisible` "calls it directly" and that focus traversal invokes `showOnScreen`.
- **Other uses** the guide names: form validation scrolling to the first invalid field [renderobjects](https://renderobjects.com/guides/show-on-screen/).

## Signature and default

- **Signature:** `showOnScreen({RenderObject? descendant, Rect? rect, Duration duration = Duration.zero, Curve curve = Curves.ease})`. `descendant` null means "make myself visible"; `Duration.zero` is an instant jump [renderobjects](https://renderobjects.com/guides/show-on-screen/). Official: "The `rect` parameter is interpreted relative to the coordinate system of `descendant` if that argument is provided and relative to this [RenderObject] otherwise"; "If `rect` is null, the entire [RenderObject] (as defined by its [paintBounds]) will be revealed." https://api.flutter.dev/flutter/rendering/RenderObject/showOnScreen.html
- **The default forwards to the parent** (Flutter master):

```dart
parent?.showOnScreen(
  descendant: descendant ?? this,
  rect: rect,
  duration: duration,
  curve: curve,
);
```

  - renderobjects.com's "roughly what the base class does" version casts `parent! as RenderObject` first; `parent` is already typed `RenderObject?`, so the cast is obsolete. Same behavior.
- **`descendant` defaults to `this` when bubbling,** which is why `someRenderObject.showOnScreen()` with no arguments works [renderobjects](https://renderobjects.com/guides/show-on-screen/).

## When to override

- **Do not override** in a leaf, a passive layout container (`Row`, `Column`, `Padding`, `Stack`), or an object that applies only simple offsets to children (those go through `applyPaintTransform`). "If your render object isn't a scrollable and doesn't apply any non-standard transform, you can skip this entirely." The API page: override only if you own a viewport or an adjustable clip [renderobjects](https://renderobjects.com/guides/show-on-screen/), [renderobjects](https://renderobjects.com/api/misc/showOnScreen/).
- **Override when:** (1) it is a scrollable (the canonical case); (2) it virtualizes children (a request for a child not yet built: scroll first, then materialize it, then complete); (3) it applies a transform not expressed through `pushTransform` and not reported through `applyPaintTransform`. For (3), usually fix `applyPaintTransform` instead and override only if the transform cannot be expressed that way [renderobjects](https://renderobjects.com/guides/show-on-screen/).
- **The reveal rect travels through the same `applyPaintTransform` chain** that hit testing and semantics use; get `applyPaintTransform` right and `showOnScreen` needs nothing extra [renderobjects](https://renderobjects.com/guides/show-on-screen/). See [PAINTING.md](PAINTING.md).

## A scrollable

- **`RenderViewportBase.showInViewport`** is a public static helper that takes `required RenderAbstractViewport viewport` and `required ViewportOffset offset`; "[RenderViewportBase] and [SingleChildScrollView] delegate this method to" it (`RenderObject.showOnScreen` doc). `RenderViewportBase.showOnScreen` in Flutter master does three things:
  1. If `!offset.allowImplicitScrolling`, it calls `super.showOnScreen(descendant:, rect:, ...)` unchanged.
  2. Otherwise it calls `RenderViewportBase.showInViewport(descendant:, viewport: this, offset:, rect:, duration:, curve:)`, which computes leading and trailing reveal offsets with `getOffsetToReveal`, clamps them with `RevealedOffset.clampOffset`, returns early if the target is already fully visible, and calls `offset.moveTo(targetOffset.offset, duration:, curve:)` (which handles both a jump and an animation).
  3. It bubbles with `super.showOnScreen(rect: newRect, duration: duration, curve: curve)`: no `descendant`, and the revealed rect in its own coordinate space.

  https://api.flutter.dev/flutter/rendering/RenderViewportBase/showInViewport.html
  - renderobjects.com's guide sketch (no version stated) bubbles with `descendant ?? this` and the original `rect`, calls it a pitfall to bubble "without the descendant parameter", and calls `animateTo` even when `duration` is zero.
- **A hand-rolled scrollable box** (not a `RenderAbstractViewport`): scroll, then forward so outer viewports reveal too [renderobjects](https://renderobjects.com/api/misc/showOnScreen/).

```dart
@override
void showOnScreen({
  RenderObject? descendant,
  Rect? rect,
  Duration duration = Duration.zero,
  Curve curve = Curves.ease,
}) {
  // Compute the target rect in this render object's local coordinate space.
  final Rect targetRect = descendant != null
      ? MatrixUtils.transformRect(
          descendant.getTransformTo(this),
          rect ?? descendant.paintBounds,
        )
      : rect ?? paintBounds;

  // Determine how much to scroll to bring the target into view.
  final double currentOffset = _scrollOffset;
  final double viewportHeight = size.height;
  double newOffset = currentOffset;

  if (targetRect.top < currentOffset) {
    newOffset = targetRect.top;
  } else if (targetRect.bottom > currentOffset + viewportHeight) {
    newOffset = targetRect.bottom - viewportHeight;
  }

  if (newOffset != currentOffset) {
    if (duration == Duration.zero) {
      _setScrollOffset(newOffset);
    } else {
      _animateScrollOffset(newOffset, duration: duration, curve: curve);
    }
  }

  // Let outer viewports reveal this render object in turn.
  super.showOnScreen(
    descendant: this,
    rect: targetRect.shift(Offset(0, -newOffset)),
    duration: duration,
    curve: curve,
  );
}
```

- **Target rect:** map from the descendant's local space with `MatrixUtils.transformRect` and `descendant.getTransformTo(this)`; with no descendant the target is `rect`, or the whole object [renderobjects](https://renderobjects.com/guides/show-on-screen/). `showInViewport` does the same for its already-visible check: `MatrixUtils.transformRect(descendant.getTransformTo(viewport.parent), rect ?? descendant.paintBounds)`.
- **Scroll the minimum:** already visible, do not scroll; above, bring the top edge in; below, bring the bottom edge in; larger than the viewport, usually align the leading edge [renderobjects](https://renderobjects.com/guides/show-on-screen/).
- **Pass `duration` and `curve` through unchanged** from the caller to the scrollable and into `super.showOnScreen`. Substituting your own makes focus traversal, `ensureVisible` and accessibility navigation animate differently. Always honor `Duration.zero` (performance paths and tests). Custom physics (spring, snap to page) may translate them but must not ignore them [renderobjects](https://renderobjects.com/guides/show-on-screen/).

## A clipping container

A clip "still needs to report the visible portion of the target rect to its ancestors" [renderobjects](https://renderobjects.com/api/misc/showOnScreen/):

```dart
@override
void showOnScreen({
  RenderObject? descendant,
  Rect? rect,
  Duration duration = Duration.zero,
  Curve curve = Curves.ease,
}) {
  // Intersect the requested rect with our clip bounds so ancestors only
  // try to reveal the portion that is actually visible through this clip.
  final Rect targetRect = descendant != null
      ? MatrixUtils.transformRect(
          descendant.getTransformTo(this),
          rect ?? descendant.paintBounds,
        )
      : rect ?? paintBounds;

  final Rect clippedRect = targetRect.intersect(Offset.zero & size);

  super.showOnScreen(
    descendant: this,
    rect: clippedRect,
    duration: duration,
    curve: curve,
  );
}
```

## Blocking a request

- **To stop a request escaping** ("a modal dialog ... should not cause the content behind it to scroll" [renderobjects](https://renderobjects.com/api/misc/showOnScreen/)), handle it internally and do not forward it to `super.showOnScreen` [renderobjects](https://renderobjects.com/api/misc/showOnScreen/). A request arriving from below already names a descendant of this object, because the default forwards `descendant ?? this` to `parent` (Flutter master `object.dart`).
  - renderobjects.com (no version stated) guards with `if (descendant != null && isDescendantOf(descendant))`. `RenderObject` has no `isDescendantOf` method, and the check asks the reverse question (whether this object is inside the target).

## Pitfalls

From [renderobjects](https://renderobjects.com/guides/show-on-screen/):

- Forgetting to bubble up after handling: the inner scrollable scrolls and the outer does not, so nested horizontal-in-vertical lists break.
- Ignoring `Duration.zero`: tests that expect immediate state fail.
- A too-lenient "already visible" check: compute against the descendant's complete bounds; a partly visible target should still scroll.
- Overriding in a `Row` or `Column`, which usually breaks the bubble-up.
- Virtualized lists: scroll to where the child would be, materialize it, then fire the reveal again once its bounds exist.

The guide also lists bubbling without `descendant` as a pitfall; Flutter's own `RenderViewportBase` does exactly that with a rect in its own space (see [A scrollable](#a-scrollable)).

## Prove it

- Only scrollables, virtualizing containers, clips and objects with an unreported transform override `showOnScreen`; `Row`/`Column`-style containers do not.
- Every override that handles a request still calls `super.showOnScreen` (unless it deliberately blocks), with a rect expressed in the coordinate space of the `descendant` it passes, or its own space when it passes none.
- A custom `RenderAbstractViewport` that reveals by hand is checked against what `RenderViewportBase.showInViewport` does (clamped leading and trailing offsets, no move when already fully visible, `offset.moveTo`).
- `duration` and `curve` are passed through unchanged, and `Duration.zero` jumps.
- In a nested scrollable (horizontal inside vertical), moving a screen reader to an off-screen item and focusing an off-screen text field (whose caret `EditableText` reveals through `showOnScreen`) both bring it fully into view in both scrollables. Tab traversal goes through `Scrollable.ensureVisible`, not `showOnScreen`, so it does not test this override.
- No `isDescendantOf` call on a render object.
