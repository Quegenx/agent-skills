# Hit testing and mouse cursors

How a custom `RenderBox` answers "which render objects sit under this point": `hitTest`, `hitTestSelf`, `hitTestChildren`, the add-order rule, non-rectangular and oversized hit regions, transforms, and then how `MouseTracker` reuses that same hit test for cursors and hover. Sources: Matt Carroll's [hit-testing guide](https://renderobjects.com/guides/hit-testing/), his [hitTest() page](https://renderobjects.com/api/hit-testing/hittest/) and his [mouse-cursors guide](https://renderobjects.com/guides/mouse-cursors/), checked against api.flutter.dev and the framework source. Where the official API differs, the official form comes first and the site's claim follows in one line. The site states no Flutter version. Code blocks are copied from the site; dashes inside its code comments are replaced by commas or colons. Tap-target sizes are in [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md); transforms on the paint side are in [COMPOSITING.md](COMPOSITING.md#applypainttransform).

**Contents:** [What hit testing is](#what-hit-testing-is) · [The hitTest method](#the-hittest-method) · [BoxHitTestResult](#boxhittestresult) · [Testing yourself with hitTestSelf](#testing-yourself-with-hittestself) · [Testing children with hitTestChildren](#testing-children-with-hittestchildren) · [The add-order rule](#the-add-order-rule) · [Non-rectangular hit regions](#non-rectangular-hit-regions) · [Hit testing through transforms](#hit-testing-through-transforms) · [Hit testing outside your bounds](#hit-testing-outside-your-bounds) · [Hit-test performance](#hit-test-performance) · [Mouse cursors and hover](#mouse-cursors-and-hover) · [Prove it](#prove-it)

## What hit testing is

[renderobjects](https://renderobjects.com/guides/hit-testing/): hit testing turns one position (say, a tap) into an ordered list of render objects that declared interest in that point. The framework starts at the root and walks down; each render object says no, yes for itself, or defers to children. Every render object on the path from the root to the deepest interested descendant gets an entry.

- **It is a geometric query, not only for gestures** [renderobjects](https://renderobjects.com/guides/hit-testing/): `WidgetTester.tapAt` runs one in widget tests, `MouseRegion` uses it to find what the cursor is over, and the widget inspector uses it to find the widget you point at. The [hitTest() page](https://renderobjects.com/api/hit-testing/hittest/): logging a hit means "I'm beneath that point"; logging nothing means "I'm not beneath that point".
- **It has no relationship to `GestureDetector` or the gesture arena** [renderobjects](https://renderobjects.com/guides/hit-testing/): recognizers consume the result, but don't take part. The render object answers only "does my content cover this point, and does any child's?"
- **Layout must be current, paint need not be** ([RenderBox.hitTest](https://api.flutter.dev/flutter/rendering/RenderBox/hitTest.html)): "Hit testing requires layout to be up-to-date but does not require painting to be up-to-date ... a render object might be a child of a [RenderOpacity] object, which calls [hitTest] on its children when its opacity is zero". An invisible child is still hit-tested unless you prevent it.

## The hitTest method

- **Entry point** [renderobjects](https://renderobjects.com/guides/hit-testing/): `hitTest(BoxHitTestResult result, {required Offset position})`. The default checks `size`, asks children, asks self, and adds `this` if either says yes, so you usually override `hitTestSelf` and `hitTestChildren`, not `hitTest`.
- **The framework's default** ([RenderBox.hitTest](https://api.flutter.dev/flutter/rendering/RenderBox/hitTest.html)): `if (_size!.contains(position)) { if (hitTestChildren(result, position: position) || hitTestSelf(position)) { result.add(BoxHitTestEntry(this, position)); return true; } }`. It "Returns true ... if this render object or one of its descendants absorbs the hit (preventing objects below this one from being hit)". "The caller is responsible for transforming [position] ... This [RenderBox] is responsible for checking whether the given position is within its bounds".
- **A container with `RenderBoxContainerDefaultsMixin`, as the framework does it**: the framework's `RenderFlex` (source `flex.dart`) leaves `hitTest` alone and overrides only `hitTestChildren`:

```dart
  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    return defaultHitTestChildren(result, position: position);
  }
```

  The [hitTest() page](https://renderobjects.com/api/hit-testing/hittest/) instead overrides `hitTest` itself (`if (size.contains(position)) { defaultHitTestChildren(...); result.add(BoxHitTestEntry(this, position)); return true; } return false;`) and types the mixins with `BoxParentData`; the mixins' type parameter is bounded by `ContainerBoxParentData<ChildType>`, so that does not compile, and the override re-implements what `RenderBox.hitTest` already does. Child-list mixins are in [CHILD-MODELS.md](CHILD-MODELS.md).

## BoxHitTestResult

[renderobjects](https://renderobjects.com/guides/hit-testing/): the accumulator the framework hands you. When a point hits you:

```dart
result.add(BoxHitTestEntry(this, position));
```

The entry records which render object was hit and the local position, so events can be routed and downstream consumers can reason in your coordinate space. You construct entries yourself only when you override `hitTest` (rare).

## Testing yourself with hitTestSelf

[renderobjects](https://renderobjects.com/guides/hit-testing/): `hitTestSelf(Offset position)` declares whether your own pixels, independent of children, take the hit.

- **Default `false`**: right for transparent containers like a custom `Row` or `Stack`, where only children can be hit.
- **For content the user interacts with** (a button background, a colored panel, a drawn shape):

```dart
@override
bool hitTestSelf(Offset position) => true;
```

- **`position` is local** (origin at zero), and the default `hitTest` already checked `size`, so inspect `position` only when the hittable area is smaller than your bounds, such as a circular button in a square box.
- **Shadows should not be hittable** [renderobjects](https://renderobjects.com/guides/hit-testing/): users read shadows, glows, subtle hover effects and decorative overflow as decoration; taps there "register on nothing visible". Limit `hitTestSelf` to the visually meaningful surface.
- **`paintBounds` does not affect hit testing** [renderobjects](https://renderobjects.com/guides/hit-testing/): the default `hitTest` filters by layout `size`, so a point in your shadow outside the box is rejected before `hitTestSelf` runs ([PAINTING.md](PAINTING.md#paintbounds)).

## Testing children with hitTestChildren

[renderobjects](https://renderobjects.com/guides/hit-testing/): `hitTestChildren(BoxHitTestResult result, {required Offset position})` translates the position into each child's space and asks it. With no children the default returns `false`. A container walks children in **reverse paint order** (the topmost child gets first crack) and returns `true` on the first hit.

The site's loop, corrected: `previousSibling` lives on `ContainerParentDataMixin` ([previousSibling](https://api.flutter.dev/flutter/rendering/ContainerParentDataMixin/previousSibling.html)), so the cast must be to your container parent-data type. The only change is `as BoxParentData` to `as ContainerBoxParentData<RenderBox>`:

```dart
@override
bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
  // Walk children in reverse paint order so the topmost child is tested first.
  RenderBox? child = lastChild;
  while (child != null) {
    final childParentData = child.parentData! as ContainerBoxParentData<RenderBox>;
    final bool isHit = result.addWithPaintOffset(
      offset: childParentData.offset,
      position: position,
      hitTest: (BoxHitTestResult result, Offset transformed) {
        return child!.hitTest(result, position: transformed);
      },
    );
    if (isHit) return true;
    child = childParentData.previousSibling;
  }
  return false;
}
```

renderobjects.com casts to `BoxParentData`, which has no `previousSibling` and does not compile.

- **`addWithPaintOffset`** [renderobjects](https://renderobjects.com/guides/hit-testing/): subtracts the child's offset from `position`, passes the child-local position to the callback, and records the offset on the result so local coordinates of added entries come out right.
- **`defaultHitTestChildren`** [renderobjects](https://renderobjects.com/guides/hit-testing/): `RenderBoxContainerDefaultsMixin` does exactly this (reverse order, offset translation, short-circuit). Use it when paint order matches child-list order:

```dart
@override
bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
  return defaultHitTestChildren(result, position: position);
}
```

- **Custom paint order** [renderobjects](https://renderobjects.com/guides/hit-testing/): a stack with its own z-order or a layout that reorders for display must walk the reverse of *its* paint order. Walking forward makes taps on overlapping children hit the one underneath: "the kind of bug that looks fine on a static screen and falls apart the moment two children overlap."
- **The hitTest() page's hand-written variants** [renderobjects](https://renderobjects.com/api/hit-testing/hittest/): "Children Hittable First, Parent Second" runs the same reverse loop with `assert(localPosition == position - childParentData.offset);` inside the callback, then, if no child was hit, `if (size.contains(position)) { result.add(BoxHitTestEntry(this, position)); return true; }`. "Only Children Hittable" is the loop alone. Both snippets name the method `hitTeset`, a typo that would not override `hitTest`; they use placeholder types `ChildType` and `ParentDataType` (not framework types); and the parent-second variant reports the parent only when no child is hit, unlike the default `hitTest`, which adds the parent after a child hit too ([below](#the-add-order-rule)). The official form is the `hitTestChildren` plus `hitTestSelf` pair above.

## The add-order rule

[renderobjects](https://renderobjects.com/guides/hit-testing/): the order of entries is significant; consumers (most often gesture recognizers) read it deepest first.

- **Add child entries before your own.** The default `hitTest` calls `hitTestChildren` before `hitTestSelf`, so the list runs deepest to shallowest. If you override `hitTest`, keep that order; adding yourself first produces routing bugs such as a parent claiming events meant for a child.
- **A hit on a child doesn't stop the parent from also being added.** Both go in the result. Your job is only to report honestly who is geometrically interested.

## Non-rectangular hit regions

[renderobjects](https://renderobjects.com/guides/hit-testing/): inspect `position` in `hitTestSelf` and return `true` only inside the real shape. A circle:

```dart
@override
bool hitTestSelf(Offset position) {
  final center = size.center(Offset.zero);
  final radius = size.shortestSide / 2;
  return (position - center).distanceSquared <= radius * radius;
}
```

For complex shapes, build a `Path` once (a field, rebuilt only when its inputs change):

```dart
@override
bool hitTestSelf(Offset position) => _hitPath.contains(position);
```

The default `hitTest` still rejects anything outside `size` before `hitTestSelf` is called.

## Hit testing through transforms

[renderobjects](https://renderobjects.com/guides/hit-testing/): when paint applies a transform (`pushTransform` or your own `TransformLayer`), hit testing must undo it before asking the child. `result.addWithPaintTransform` takes the paint transform, inverts it, calls back with the child-local position, and records the transform on the result:

```dart
@override
bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
  if (child == null) return false;
  return result.addWithPaintTransform(
    transform: _transform,
    position: position,
    hitTest: (BoxHitTestResult result, Offset transformed) {
      return child!.hitTest(result, position: transformed);
    },
  );
}
```

- **Use the same matrix as paint and `applyPaintTransform`**, or you get "the button is in the wrong place" [renderobjects](https://renderobjects.com/guides/hit-testing/). The official snippet pairs them ([addWithPaintTransform](https://api.flutter.dev/flutter/rendering/BoxHitTestResult/addWithPaintTransform.html)):

```dart
abstract class RenderFoo extends RenderBox {
  final Matrix4 _effectiveTransform = Matrix4.rotationZ(50);

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    transform.multiply(_effectiveTransform);
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, { required Offset position }) {
    return result.addWithPaintTransform(
      transform: _effectiveTransform,
      position: position,
      hitTest: (BoxHitTestResult result, Offset position) {
        return super.hitTestChildren(result, position: position);
      },
    );
  }
}
```

- **Non-invertible transform** ([addWithPaintTransform](https://api.flutter.dev/flutter/rendering/BoxHitTestResult/addWithPaintTransform.html)): "If `transform` is null it will be treated as the identity transform ... If `transform` cannot be inverted, the `hitTest` callback is not invoked and false is returned." A scale-to-zero child can't be hit, which is correct [renderobjects](https://renderobjects.com/guides/hit-testing/).
- **The `addWith*` family** ([BoxHitTestResult](https://api.flutter.dev/flutter/rendering/BoxHitTestResult-class.html)): `addWithPaintOffset` for a plain offset; `addWithPaintTransform` for a paint transform (it inverts it); `addWithRawTransform({required Matrix4? transform, required Offset position, required BoxHitTest hitTest})`, where "the provided `transform` matrix is used directly to transform `position` without any pre-processing"; and `addWithOutOfBandPosition`, a "Pass-through method for adding a hit test while manually managing the position transformation logic", which takes exactly one of `paintOffset`, `paintTransform` or `rawTransform`. The guide also names `addWithReverseTransform` as related; no method of that name exists in the framework's `box.dart`. `RenderBox.hitTestChildren`'s docs list `addWithPaintTransform`, `addWithPaintOffset` and `addWithRawTransform` as the ones that "need to be invoked by subclasses to record the required transform operations".
- **Per-child transforms** [renderobjects](https://renderobjects.com/api/hit-testing/hittest/): "`RenderBox`s whose children are transformed with more than just an offset (e.g., rotation, scale, skew) must report a full transform matrix." Its loop, with `ParentDataType` a placeholder for your own parent data holding `transform` (and container links, see [PARENT-DATA.md](PARENT-DATA.md)):

```dart
bool hitTest(BoxHitTestResult result, {required Offset position}) {
  // Hit test our children, applying their transforms.
  ChildType? child = lastChild;
  while (child != null) {
    // This assumes that your layout code calculated each child's transformation
    // matrix and stored it with the child's parent data.
    final childParentData = child.parentData! as ParentDataType;

    final bool isHit = result.addWithPaintTransform(
      transform: childParentData.transform,
      position: position,
      hitTest: (BoxHitTestResult result, Offset localPosition) {
        return child!.hitTest(result, position: localPosition);
      },
    );
    if (isHit) {
      return true;
    }
    child = childParentData.previousSibling;
  }

  // Hit test us (the parent).
  if (size.contains(position)) {
    result.add(BoxHitTestEntry(this, position));
    return true;
  }

  return false;
}
```

  Note it tests children before checking `size`, so transformed children outside the box can still be hit; the default `hitTest` would reject them first.
- **Don't invert the matrix yourself** [renderobjects](https://renderobjects.com/guides/hit-testing/):

```dart
// Don't do this: the geometric check works, but the result loses
// the coordinate-transformation bookkeeping it needs later.
@override
bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
  if (child == null) return false;
  final inverse = Matrix4.tryInvert(_transform);
  if (inverse == null) return false;
  final transformed = MatrixUtils.transformPoint(inverse, position);
  return child!.hitTest(result, position: transformed);
}
```

  The tap lands on the right object, but `BoxHitTestEntry.localPosition` for the child's entries and `globalToLocal`/`localToGlobal` along the hit path are silently wrong by the inverse of your transform.

## Hit testing outside your bounds

[renderobjects](https://renderobjects.com/guides/hit-testing/): the default rejects any point outside `size` before your hooks run. For an oversized touch target (a small icon with a generous tap area) or a child that paints outside its parent, override `hitTest` itself. Corrected: `Size` has no `inflate`; only `Rect.inflate(double delta)` exists ([Rect.inflate](https://api.flutter.dev/flutter/dart-ui/Rect/inflate.html)), so the rect is built first. The only change is `Offset.zero & size.inflate(_extraHitSlop)` to `(Offset.zero & size).inflate(_extraHitSlop)`:

```dart
@override
bool hitTest(BoxHitTestResult result, {required Offset position}) {
  final expanded = (Offset.zero & size).inflate(_extraHitSlop);
  if (!expanded.contains(position)) return false;
  if (hitTestChildren(result, position: position) || hitTestSelf(position)) {
    result.add(BoxHitTestEntry(this, position));
    return true;
  }
  return false;
}
```

renderobjects.com writes `Offset.zero & size.inflate(_extraHitSlop)`, which does not compile.

- **Slop past the parent never arrives** (follows from the default `RenderBox.hitTest` quoted above; the site does not say it): a parent's default `hitTest` only forwards positions inside its own size (see [The hitTest method](#the-hittest-method)), so expanded slop works only within the parent's box.
- **Be conservative** [renderobjects](https://renderobjects.com/guides/hit-testing/): regions far past visible content surprise users; "a few logical pixels around tiny targets" is usually fine. For target sizes see [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md).
- **In-bounds content that shouldn't be hittable** (a decorative overlay) [renderobjects](https://renderobjects.com/guides/hit-testing/): there is no rejection hook; return `false` from `hitTestSelf` for those regions. Because the default `hitTest` checks `hitTestChildren` first, a non-hittable parent above hittable children works out of the box.

## Hit-test performance

[renderobjects](https://renderobjects.com/guides/hit-testing/): hit testing runs on every pointer event (down, every move, up); a drag fires "dozens of move events per second".

- Don't allocate inside `hitTest`; cache `Path`s, centers and hit rects as fields.
- Prefer a rect containment check to `path.contains` when it is geometrically correct; it is "dramatically cheaper".
- Walk children in reverse paint order and stop at the first hit.
- Use the `addWith*` helpers; they keep transforms right and handle non-invertible cases.

## Mouse cursors and hover

### What MouseTracker does

[renderobjects](https://renderobjects.com/guides/mouse-cursors/): on desktop and web, `MouseTracker` consumes raw pointer events, runs a hit test at the hover position (the same way pointer-down events are routed), and asks each annotated render object in the result whether it has a cursor opinion and wants enter or exit callbacks. The topmost cursor opinion is sent to the platform. Official ([MouseTracker](https://api.flutter.dev/flutter/rendering/MouseTracker-class.html)): it keeps hit-test entries whose `target is MouseTrackerAnnotation`.

### Prefer MouseRegion

[renderobjects](https://renderobjects.com/guides/mouse-cursors/): most mouse work belongs at the widget layer. `MouseRegion(cursor: SystemMouseCursors.click, onEnter: ..., onExit: ..., child: ...)` gives correct cursor behavior with no render-object code. Go to the render object only when it owns the relevant state, is a self-contained primitive, or is a low-level reusable widget that should carry its behavior, for example a slider whose cursor depends on whether the pointer is over the thumb.

### Implementing MouseTrackerAnnotation

- **It is a class you implement, not a mixin** ([MouseTrackerAnnotation](https://api.flutter.dev/flutter/services/MouseTrackerAnnotation-class.html)): it is declared `class MouseTrackerAnnotation with Diagnosticable { const MouseTrackerAnnotation({this.onEnter, this.onExit, this.cursor = MouseCursor.defer, this.validForMouseTracker = true}); ... }`, a plain class with a generative constructor, so `with MouseTrackerAnnotation` does not compile on Dart 3. The framework's own `RenderMouseRegion` is declared `extends RenderProxyBoxWithHitTestBehavior implements MouseTrackerAnnotation` ([RenderMouseRegion](https://api.flutter.dev/flutter/rendering/RenderMouseRegion-class.html)). Implementing it means providing all four members, `cursor`, `onEnter`, `onExit` and `validForMouseTracker`; the `Diagnosticable` members come from `RenderObject`, which already is `Diagnosticable`.
- **The site's sample, corrected.** Changes: `with` to `implements`; `validForMouseTracker` added with the attach and detach handling `RenderMouseRegion` uses (framework source `proxy_box.dart`); and the constructor, because `RenderProxyBox([RenderBox? child])` takes its child positionally, so `{super.child}` cannot forward to it (the framework's proxies write `({RenderBox? child}) : super(child)`).

```dart
class RenderHoverableThing extends RenderProxyBox implements MouseTrackerAnnotation {
  RenderHoverableThing({RenderBox? child}) : super(child);

  @override
  MouseCursor get cursor => SystemMouseCursors.click;

  @override
  PointerEnterEventListener? get onEnter => _handleEnter;

  @override
  PointerExitEventListener? get onExit => _handleExit;

  @override
  bool get validForMouseTracker => _validForMouseTracker;
  bool _validForMouseTracker = false;

  @override
  void attach(PipelineOwner owner) {
    super.attach(owner);
    _validForMouseTracker = true;
  }

  @override
  void detach() {
    // It's possible that the renderObject be detached during mouse events
    // dispatching, set the [MouseTrackerAnnotation.validForMouseTracker] false to prevent
    // the callbacks from being called.
    _validForMouseTracker = false;
    super.detach();
  }

  void _handleEnter(PointerEnterEvent event) {
    // ...
  }

  void _handleExit(PointerExitEvent event) {
    // ...
  }
}
```

  renderobjects.com calls `MouseTrackerAnnotation` "a mixin", writes `extends RenderProxyBox with MouseTrackerAnnotation` with `{super.child}`, and says it "declares three things" before listing four.
- **The object must also be hit** (see [How the mouse region is decided](#how-the-mouse-region-is-decided)): a proxy like this is in the path only when its child is hit or its `hitTestSelf` returns true.

### Declaring a cursor

[renderobjects](https://renderobjects.com/guides/mouse-cursors/):

- `SystemMouseCursors.click` for buttons and links; `.text` for editable text; also `.forbidden`, `.grab`, `.grabbing`, `.resizeLeftRight` and others.
- `SystemMouseCursors.basic` explicitly asserts the normal arrow and overrides inherited choices.
- `MouseCursor.defer` means "no opinion" and is the default. Use it when you take part only for hover callbacks.

The cursor can depend on state:

```dart
@override
MouseCursor get cursor {
  if (!_enabled) return SystemMouseCursors.forbidden;
  if (_isDragHandle) return SystemMouseCursors.grab;
  return SystemMouseCursors.click;
}
```

The topmost annotated object under the pointer that returns something other than `defer` wins; `defer` falls through to the next one beneath, then to the system default. Official ([MouseTrackerAnnotation](https://api.flutter.dev/flutter/services/MouseTrackerAnnotation-class.html)): "Defaults to [MouseCursor.defer], deferring the choice of cursor to the next region behind it in hit-test order."

### Enter, exit and hover

[renderobjects](https://renderobjects.com/guides/mouse-cursors/):

```dart
void _handleEnter(PointerEnterEvent event) {
  _hovering = true;
  markNeedsPaint(); // if hover affects appearance
}

void _handleExit(PointerExitEvent event) {
  _hovering = false;
  markNeedsPaint();
}
```

- Each fires once per entry and once per exit. Official ([MouseTrackerAnnotation](https://api.flutter.dev/flutter/services/MouseTrackerAnnotation-class.html)): "This method is always matched by a later [onExit]". Exit events go out in hit-test order and enter events in reverse hit-test order; both are skipped while `validForMouseTracker` is false.
- **There is no `onHover` on the annotation** [renderobjects](https://renderobjects.com/guides/mouse-cursors/). For the pointer position, override `handleEvent` and handle `PointerHoverEvent` (normal pointer routing), or use `MouseRegion.onHover`. The opt-in keeps the enter/exit case lean, since move events arrive at pointer-movement rate. Official ([RenderMouseRegion](https://api.flutter.dev/flutter/rendering/RenderMouseRegion-class.html)): `onHover` is `RenderMouseRegion`'s own field, not part of the annotation, dispatched from `handleEvent`.

### How the mouse region is decided

- **Your mouse region is your hit-tested region** [renderobjects](https://renderobjects.com/guides/mouse-cursors/): `hitTestSelf`, `hitTestChildren`, non-rectangular and expanded regions all apply. A circular hit region is a circular cursor region; a shadow outside the box is excluded, which is correct. "the hit test is the single source of truth."
- **Opaque overlays block cursors beneath them** [renderobjects](https://renderobjects.com/guides/mouse-cursors/), even with no cursor opinion. To let the content's cursors show through, hit-test as transparent there (return `false` from `hitTestSelf`, or make it a non-hit-testable decoration).
- **Reached only if in the hit-test path** ([RenderBox.hitTest](https://api.flutter.dev/flutter/rendering/RenderBox/hitTest.html)): the default adds the object when `hitTestChildren(...) || hitTestSelf(...)`, so a container whose child is hit is still in the path and still gets its annotation callbacks even if its `hitTestSelf` returns `false`. renderobjects.com says "A render object that returns `false` from `hitTestSelf` won't receive cursor or hover events"; that holds only when no child is hit either.

### Updating cursor state

- **No `markNeedsCursorUpdate` exists** [renderobjects](https://renderobjects.com/guides/mouse-cursors/). Cursor reselection happens on the normal pipeline pass, so a cursor-only change (an `enabled` flag with no visual change) leaves the cursor "stuck". Call `markNeedsPaint()` in that setter even if paint is a no-op. The framework does the same: `RenderMouseRegion`'s `cursor` setter calls `markNeedsPaint()` with the comment "A repaint is needed in order to trigger a device update of [MouseTracker] so that this new value can be found." (source `proxy_box.dart`).
- **`validForMouseTracker`** ([MouseTrackerAnnotation](https://api.flutter.dev/flutter/services/MouseTrackerAnnotation-class.html)): when false the annotation is ignored. "The [validForMouseTracker] is true for [MouseTrackerAnnotation]s built by the constructor", and it "does not affect hit testing". The attach and detach switching is something `RenderMouseRegion` does itself (set to `true` in `attach`, `false` in `detach` "to prevent the callbacks from being called" when detached during dispatch), so a custom implementer must copy it, as in the sample above. renderobjects.com says "The default is to return `true` while attached to the tree and `false` once detached"; for the interface that is wrong. Overriding it to opt out (for example while animating out) is possible, "but most code shouldn't need to" [renderobjects](https://renderobjects.com/guides/mouse-cursors/).

### Stacking and overlap

[renderobjects](https://renderobjects.com/guides/mouse-cursors/):

- **Cursor: topmost non-`defer` wins.** A small "click" region inside a larger "grab" region works: the inner cursor applies over the inner element, the outer one around it.
- **Hover callbacks fire independently for every annotated object under the pointer.** Entering an inner element doesn't fire the outer element's exit; leaving the inner one while still inside the outer doesn't fire an outer enter. Nested hover regions stack.
- **Cursor and enter/exit are independent decisions**: defer the cursor but still track hover for appearance, or declare a cursor without callbacks.

### Mouse pitfalls

[renderobjects](https://renderobjects.com/guides/mouse-cursors/):

- **Mobile has no mouse.** Never make essential function depend on hover; "Hover is for affordance polish on desktop and web, not for primary interaction." (Matches [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md): solve touch first.)
- **`basic` is not "no opinion".** It overrides ancestors and descendants; use `MouseCursor.defer`. Defaulting to `basic` breaks nested cursor regions.
- **A `click` cursor with no click action "is lying".** Provide the interaction, use another cursor, or defer.
- **Refresh after cursor-only state changes** with `markNeedsPaint()`.
- **Keep enter/exit callbacks light**: they run on the UI thread during pointer routing. "flip a flag, mark dirty, move on."
- **Don't listen for hover position you don't need**: `handleEvent` for `PointerHoverEvent` opts into every mouse move, "dozens or hundreds of events per second".
- **Decide cursors for overlays.** An opaque overlay (tooltip, popup, banner) with no cursor shows the default arrow over interactive content beneath; declare a cursor, defer, or hit-test as transparent there.

## Prove it

- [ ] No override of `hitTest` unless the object accepts hits outside `size`; containers override `hitTestChildren` (usually `defaultHitTestChildren`) and leaves override `hitTestSelf`.
- [ ] Hand-written child loops start at `lastChild`, follow `previousSibling` through `ContainerBoxParentData<RenderBox>` (or your subclass), use `addWithPaintOffset`/`addWithPaintTransform`, and stop at the first hit.
- [ ] With a custom paint order, a widget test that taps the overlap of two children hits the visually frontmost one.
- [ ] Every transformed child uses the same matrix in paint, `applyPaintTransform` and `addWithPaintTransform`; no `Matrix4.tryInvert` plus `child.hitTest` shortcuts remain.
- [ ] Taps on a shadow or glow outside the layout box do not register; taps on a circular control's corners do not register.
- [ ] Any hit-slop `hitTest` builds `(Offset.zero & size).inflate(...)` and the slop stays inside the parent's box.
- [ ] `hitTestSelf`/`hitTest` allocate nothing per call; paths and rects are cached fields.
- [ ] Render objects with cursors `implements MouseTrackerAnnotation`, provide `cursor`, `onEnter`, `onExit` and `validForMouseTracker`, and flip `validForMouseTracker` in `attach`/`detach`.
- [ ] Cursor-only setters call `markNeedsPaint()`; toggling `enabled` with the mouse resting on the object changes the cursor without moving the mouse.
- [ ] No essential action depends on hover; the same control works by touch.
