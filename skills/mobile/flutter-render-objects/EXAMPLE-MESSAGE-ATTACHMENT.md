# Example: message attachment

A worked example from renderobjects.com (Matt Carroll): a single-child `RenderBox` that shows a chat attachment thumbnail with a circle cut out of its top-right corner and a round "x" remove button inside that gap. It covers padding-like layout, dry layout, intrinsic sizing, a clip path, a hit area larger than the box, two tap targets recognized inside the render object, debug paint, semantics with a custom action, and debug properties. The code below is copied from the article; the only change is that em dashes inside code comments are written as " - " (repo rule). The article has two wrong comments, one wrong claim about compositing and leaves helpers out; all are under [Flagged problems](#flagged-problems). No Flutter version is stated in the article. The other examples are [EXAMPLE-WATCH-GRID.md](EXAMPLE-WATCH-GRID.md) and [EXAMPLE-THERMOSTAT.md](EXAMPLE-THERMOSTAT.md); the skill's router is [SKILL.md](SKILL.md).

**Contents:** [What it builds](#what-it-builds) · [Techniques used](#techniques-used) · [Layout](#layout) · [Intrinsic sizing](#intrinsic-sizing) · [Paint](#paint) · [Hit testing](#hit-testing) · [Gesture recognition](#gesture-recognition) · [Debug paint](#debug-paint) · [Semantics](#semantics) · [Debug properties](#debug-properties) · [Flagged problems](#flagged-problems) · [Prove it](#prove-it)

## What it builds

[renderobjects](https://renderobjects.com/examples/message-attachment/) "An attachment thumbnail, which might appear in a chat message, which includes an "x" button to remove the attachment. Notice that the "x" button is separated from the thumbnail with a clipped gap."

Why a custom render object for something this small: "even simple widgets can sometimes benefit from a custom render object". The top-right corner "is clipped with a circle that creates a gap between the thumbnail and the "x" button. It's as if the "x" button was cut out from the thumbnail." It "could be built with a widget tree. However, that widget tree would be rather confusing. The code within a custom render object more clearly demonstrates the relationship between cutting the circle out of the thumbnail, and displaying a circular "x" button."

## Techniques used

[renderobjects](https://renderobjects.com/examples/message-attachment/) Where each technique is explained in this skill:

| Technique in this example | Read |
| --- | --- |
| Padding-like `performLayout`, `computeDryLayout`, the four `compute*Intrinsic*` methods | [LAYOUT.md](LAYOUT.md) |
| One child, positioned through `BoxParentData.offset` | [CHILD-MODELS.md](CHILD-MODELS.md), [PARENT-DATA.md](PARENT-DATA.md) |
| Painting a child inside a clip, then painting over it | [PAINTING.md](PAINTING.md) |
| `context.pushClipPath`, keeping the returned layer in `layer` and passing it back as `oldLayer` | [COMPOSITING.md](COMPOSITING.md) |
| Overriding `hitTest` for a hit area outside `size`, `addWithPaintOffset`, a `TapGestureRecognizer` fed from `handleEvent` | [HIT-TESTING.md](HIT-TESTING.md) |
| `debugPaint` of hit areas, `debugFillProperties` | [DIAGNOSTICS.md](DIAGNOSTICS.md) |
| Semantic boundary, merging descendants, `CustomSemanticsAction` for a painted sub-control | [SEMANTICS.md](SEMANTICS.md) |

## Layout

[renderobjects](https://renderobjects.com/examples/message-attachment/) Layout "is almost as simple as just calling `layout()` on the `child` thumbnail. However, because the "x" button slightly extends beyond the boundary of the `child`, the layout process needs to insert that little gap on all 4 sides of the `child`." Deflate the constraints for the child, offset the child through `BoxParentData.offset`, `constrain` your own size, and use `constraints.smallest` when there is no child. `parentUsesSize: true` because the parent reads `child.size`. (One comment here gives the wrong direction; see [Flagged problems](#flagged-problems).)

```dart
  @override
  void performLayout() {
    final child = this.child;
    if (child == null) {
      size = constraints.smallest;
      return;
    }

    // Layout the thumbnail child, but subtract the gap that we need for the "x" button
    // to slightly sit outside the thumbnail bounds.
    child.layout(constraints.deflate(const EdgeInsets.all(_removeButtonOverflowDistance)), parentUsesSize: true);

    // The "x" button sits slightly beyond the thumbnail bounds. We add this overflow gap
    // on all 4 sides of the thumbnail. So we need to position the thumbnail down, and to
    // the left, by that amount.
    (child.parentData! as BoxParentData).offset = const Offset(
      _removeButtonOverflowDistance,
      _removeButtonOverflowDistance,
    );

    // Our size is the size of the thumbnail, plus the "x" button overflow distance, added
    // to all 4 sides.
    size = constraints.constrain(
      Size(child.size.width + _removeButtonOverflowDistance * 2, child.size.height + _removeButtonOverflowDistance * 2),
    );
  }
```

"The message attachment should also support dry layout." It mirrors `performLayout`, calling `getDryLayout` on the child.

```dart
  @override
  Size computeDryLayout(BoxConstraints constraints) => child != null
      ? constraints.constrain(
          child!.getDryLayout(constraints.deflate(const EdgeInsets.all(_removeButtonOverflowDistance))) +
              const Offset(_removeButtonOverflowDistance * 2, _removeButtonOverflowDistance * 2),
        )
      : constraints.smallest;
```

## Intrinsic sizing

[renderobjects](https://renderobjects.com/examples/message-attachment/) "The message attachment is basically a thumbnail plus a little extra padding. Therefore, the message attachment has an intrinsic size. Whenever a render object can reasonably report an intrinsic size, it should do so. This maximizes the places it can be used without throwing layout errors." Subtract the padding from the incoming extent, clamp at 0, ask the child, add the padding back.

```dart
  @override
  double computeMinIntrinsicWidth(double height) => child != null
      ? child!.getMinIntrinsicWidth((height - _removeButtonOverflowDistance * 2).clamp(0.0, double.infinity)) +
            _removeButtonOverflowDistance * 2
      : 0;

  @override
  double computeMaxIntrinsicWidth(double height) => child != null
      ? child!.getMaxIntrinsicWidth((height - _removeButtonOverflowDistance * 2).clamp(0.0, double.infinity)) +
            _removeButtonOverflowDistance * 2
      : 0;

  @override
  double computeMinIntrinsicHeight(double width) => child != null
      ? child!.getMinIntrinsicHeight((width - _removeButtonOverflowDistance * 2).clamp(0.0, double.infinity)) +
            _removeButtonOverflowDistance * 2
      : 0;

  @override
  double computeMaxIntrinsicHeight(double width) => child != null
      ? child!.getMaxIntrinsicHeight((width - _removeButtonOverflowDistance * 2).clamp(0.0, double.infinity)) +
            _removeButtonOverflowDistance * 2
      : 0;
```

Two sides, both true for different readers: [renderobjects] above is about implementers (report intrinsics so the object works inside widgets that ask for them); "**Avoid intrinsics.**" in [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md) is about callers that trigger an intrinsic pass (a second layout pass). For each `compute*Intrinsic*` method the docs say "Do not call this function directly" and to call the matching `get*` method instead, as this code does (https://api.flutter.dev/flutter/rendering/RenderBox-class.html).

## Paint

[renderobjects](https://renderobjects.com/examples/message-attachment/) Painting has three jobs:

1. Paint the thumbnail with rounded corners.
2. Cut out a circle in the top-right corner of the thumbnail.
3. Paint a circular "x" button at the center of the clipped circle.

`Path.combine(PathOperation.difference, rrect, oval)` builds the clip. The child is painted inside `context.pushClipPath(...)`, the returned layer is kept in `layer` and passed back as `oldLayer`, and `layer = null` when there is nothing to paint. The "x" button is painted after the clip, outside it. The article says that "to paint with a clip path, a compositing layer must be used"; that is wrong against the API docs, see [Flagged problems](#flagged-problems).

```dart
  @override
  void paint(PaintingContext context, Offset offset) {
    final child = this.child;
    final childRect = _thumbnailRect;
    if (child == null || childRect == null) {
      layer = null;
      return;
    }

    final childParentData = child.parentData! as BoxParentData;
    final Offset buttonCenter = _buttonCenter!;
    
    // Create a clipping path for the thumbnail that rounds the corners and also punches out
    // a circle around the location where the "x" button will be painted.
    final Path clipPath = Path.combine(
      PathOperation.difference,
      Path()..addRRect(_thumbnailRRect!),
      Path()..addOval(Rect.fromCircle(center: buttonCenter, radius: _removeButtonHitRadius)),
    );

    layer = context.pushClipPath(
      needsCompositing,
      offset,
      childRect,
      clipPath,
      (context, offset) => context.paintChild(child, offset + childParentData.offset),
      oldLayer: layer as ClipPathLayer?,
    );

    _paintRemoveButton(context, offset + buttonCenter);
  }
```

## Hit testing

[renderobjects](https://renderobjects.com/examples/message-attachment/) "The message attachment is mostly hittable, but not entirely. There's a thin invisible gap around the thumbnail. The message attachment should not report itself as being visible in that gap."

- A hit inside `size` goes through `super.hitTest`, which calls `hitTestSelf` and `hitTestChildren`.
- A hit outside `size` that lands on the enlarged "x" hit circle is added by hand with `result.add(BoxHitTestEntry(this, position))`, because "the "x" button hit area is larger than its paint area".
- `hitTestSelf` rejects the transparent gap: true only inside the thumbnail's rounded rect or the button's hit circle.
- `hitTestChildren` applies the child's paint offset with `addWithPaintOffset`.

```dart
  @override
  bool hitTest(BoxHitTestResult result, {required Offset position}) {
    if (size.contains(position)) {
      // Delegate to `hitTestSelf()` and `hitTestChildren()`.
      return super.hitTest(result, position: position);
    }

    if (_isWithinRemoveButtonHitArea(position)) {
      // Hit test location is outside our standard `RenderBox` bounds, but
      // the hit test location might still hit our circular "x" button because
      // the "x" button hit area is larger than its paint area.
      result.add(BoxHitTestEntry(this, position));
      return true;
    }

    return false;
  }

  @override
  bool hitTestSelf(Offset position) {
    if (child == null) {
      return false;
    }

    // Return `true` if the position is inside the thumbnail, or within the hit
    // area of the "x" button.
    return _thumbnailRRect!.contains(position) || _isWithinRemoveButtonHitArea(position);
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) => child != null
      ? result.addWithPaintOffset(
          offset: (child!.parentData! as BoxParentData).offset,
          position: position,
          hitTest: (result, transformed) => child!.hitTest(result, position: transformed),
        )
      : false;
```

API check: `BoxHitTestResult.addWithPaintOffset({required Offset? offset, required Offset position, required BoxHitTest hitTest})`; a null offset counts as zero (https://api.flutter.dev/flutter/rendering/BoxHitTestResult/addWithPaintOffset.html).

## Gesture recognition

[renderobjects](https://renderobjects.com/examples/message-attachment/) "If the whole render object had just one tap gesture for the whole area, this gesture recognition could be done in the widget tree using a `GestureDetector`. However, there are two different tappable areas in the message attachment, and the difference between those areas is determined by the internal layout logic of the message attachment. Therefore, the message attachment handles its own gesture recognition." Create the recognizer in the constructor, dispose it in `dispose`, feed it each `PointerDownEvent` from `handleEvent`, and decide which callback to run from the tap's local position.

```dart
  RenderMessageAttachment({
    VoidCallback? onThumbnailTap,
    VoidCallback? onRemoveTap,
    required TextDirection textDirection,
  }) : _onThumbnailTap = onThumbnailTap,
       _onRemoveTap = onRemoveTap,
       _textDirection = textDirection {
    _tap = TapGestureRecognizer()..onTapUp = _handleTapUp;
  }

  @override
  void dispose() {
    _tap.dispose();
    super.dispose();
  }

  late final TapGestureRecognizer _tap;

  @override
  void handleEvent(PointerEvent event, covariant BoxHitTestEntry entry) {
    if (event is PointerDownEvent) {
      _tap.addPointer(event);
    }
  }

  void _handleTapUp(TapUpDetails details) {
    final Offset local = details.localPosition;

    if (_isWithinRemoveButtonHitArea(local)) {
      _onRemoveTap?.call();
      return;
    }

    final thumbnailRRect = _thumbnailRRect;
    if (thumbnailRRect != null && thumbnailRRect.contains(local)) {
      _onThumbnailTap?.call();
    }
  }
```

## Debug paint

[renderobjects](https://renderobjects.com/examples/message-attachment/) "Debug paint is a great way to inspect important boundaries in a render object." When `debugPaintSizeEnabled` is on, it strokes "the exact shapes used for hit testing" (the thumbnail rounded rect and the button hit circle, which is larger than the painted circle) in 1 px green. (The comment names a method that does not exist; see [Flagged problems](#flagged-problems).)

```dart
  @override
  void debugPaint(PaintingContext context, Offset offset) {
    super.debugPaint(context, offset);

    if (debugPaintSizeEnabled) {
      final thumbnailRRect = _thumbnailRRect;
      final buttonCenter = _buttonCenter;
      if (thumbnailRRect == null || buttonCenter == null) {
        return;
      }

      final Paint hitAreaPaint = Paint()
        ..color = const Color(0xFF00FF00)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;

      // These mirror the exact shapes used for hit testing: the rounded
      // rect checked in `_handleTapUp`'s thumbnail branch, and the (larger
      // than the painted circle) radius checked in `_isWithinButtonHitArea`.
      context.canvas.drawRRect(thumbnailRRect.shift(offset), hitAreaPaint);
      context.canvas.drawCircle(offset + buttonCenter, _removeButtonHitRadius, hitAreaPaint);
    }
  }
```

API check: `debugPaintSizeEnabled` is a top-level `bool`, default `false` (https://api.flutter.dev/flutter/rendering/debugPaintSizeEnabled.html).

## Semantics

**P2 correction:** `isSemanticBoundary` stops annotation from leaking upward, but does not prevent an ancestor's explicit descendant merge. The source prose and comments below claim it cannot merge into any ancestor. Keep that source claim separate from the established [boundary and ancestor-merge correction](SEMANTICS.md#merging-boundaries-and-explicit-children), based on Flutter master and [isSemanticBoundary](https://api.flutter.dev/flutter/semantics/SemanticsConfiguration/isSemanticBoundary.html). This example still represents the remove action as a `CustomSemanticsAction` on the attachment node, not a separate focusable node.

[renderobjects](https://renderobjects.com/examples/message-attachment/) "The message attachment creates a semantics boundary so that it doesn't merge with any ancestor semantics nodes." Merging upward "could silently drop one of two conflicting `onTap` handlers, or trip the framework's "incompatible configuration" assertion". `isMergingSemanticsOfDescendants` folds the child's label (an image label, say) into the same node. It reports its text direction, a label, `isButton`, and both tap callbacks: the remove button "has no backing render object of its own", so its action is a `CustomSemanticsAction` on the same node "rather than as a separate, independently-focusable node".

```dart
  @override
  void describeSemanticsConfiguration(SemanticsConfiguration config) {
    super.describeSemanticsConfiguration(config);

    // Force this render object to own a distinct SemanticsNode instead of
    // possibly merging upward into an ancestor's (which could silently drop
    // one of two conflicting `onTap` handlers, or trip the framework's
    // "incompatible configuration" assertion). Merge the child's semantics
    // (if it has any, e.g. an image label) down into this same node, since
    // a nested node under a generic "Attachment thumbnail" label would just
    // be a confusing extra stop for screen readers.
    config.isSemanticBoundary = true;
    config.isMergingSemanticsOfDescendants = true;

    if (_onThumbnailTap != null) {
      config.onTap = _onThumbnailTap;
    }

    // The remove button has no backing render object of its own - it's
    // custom-painted and custom-hit-tested by this render object - so its
    // action is exposed as a custom action on this same semantics node
    // rather than as a separate, independently-focusable node.
    config.textDirection = _textDirection;
    config.label = 'Attachment thumbnail';
    config.isButton = _onThumbnailTap != null;
    if (_onRemoveTap != null) {
      config.customSemanticsActions = <CustomSemanticsAction, VoidCallback>{
        const CustomSemanticsAction(label: 'Remove attachment'): _onRemoveTap!,
      };
    }
  }
```

API check: none of `isSemanticBoundary`, `isMergingSemanticsOfDescendants`, `customSemanticsActions`, `onTap`, `label`, `isButton`, `textDirection` is deprecated (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration-class.html).

## Debug properties

[renderobjects](https://renderobjects.com/examples/message-attachment/) "With `debugFillProperties()` implemented, the Flutter debugger shows property values at runtime." Callbacks use `ObjectFlagProperty.has`, nullable values `DiagnosticsProperty<T>(..., defaultValue: null)`, and numbers and enums `DoubleProperty` and `EnumProperty`.

```dart
  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties
      ..add(ObjectFlagProperty<VoidCallback?>.has('onThumbnailTap', _onThumbnailTap))
      ..add(ObjectFlagProperty<VoidCallback>.has('onRemoveTap', _onRemoveTap))
      ..add(DiagnosticsProperty<Rect?>('thumbnailRect', _thumbnailRect, defaultValue: null))
      ..add(DiagnosticsProperty<Offset?>('buttonCenter', _buttonCenter, defaultValue: null))
      ..add(DoubleProperty('removeButtonHitRadius', _removeButtonHitRadius))
      ..add(EnumProperty<TextDirection>('textDirection', _textDirection));
  }
```

## Flagged problems

Found by checking the article's code against itself and against api.flutter.dev (fetched 2026-10-17). The article (no version stated) is wrong in the spots below.

**1. Wrong claim: "to paint with a clip path, a compositing layer must be used".** The official form (https://api.flutter.dev/flutter/rendering/PaintingContext/pushClipPath.html): `pushClipPath(bool needsCompositing, Offset offset, Rect bounds, Path clipPath, PaintingContextCallback painter, {Clip clipBehavior = Clip.antiAlias, ClipPathLayer? oldLayer})` returns `ClipPathLayer?`. When `needsCompositing` is false, "this method returns null, indicating that a layer is no longer necessary", and it uses "a more efficient way to apply the layer effect than actually creating a layer". A layer is created only when `needsCompositing` is true. The code is still right: store the return value in `layer` either way, as the example does. Also from that page: `clipPath` "should not include `offset`". More in [COMPOSITING.md](COMPOSITING.md).

**2. Wrong comment: "position the thumbnail down, and to the left".** The offset is `(+d, +d)`, which moves the child down and to the right. Corrected comment lines:

```dart
    // The "x" button sits slightly beyond the thumbnail bounds. We add this overflow gap
    // on all 4 sides of the thumbnail. So we need to position the thumbnail down, and to
    // the right, by that amount.
```

**3. Wrong comment: the debug paint comment names `_isWithinButtonHitArea`.** The method is `_isWithinRemoveButtonHitArea`. Corrected line:

```dart
      // than the painted circle) radius checked in `_isWithinRemoveButtonHitArea`.
```

**4. Missing pieces.** The article ends with "Full Source Code ... TODO: Link to repo.", and these are used but never shown, so the snippets do not run on their own:

- The class declaration and its single-child mixin that supplies `child` (see [CHILD-MODELS.md](CHILD-MODELS.md)), and the widget that creates `RenderMessageAttachment`.
- `_removeButtonOverflowDistance` and `_removeButtonHitRadius` (both used as constants).
- `_thumbnailRect`, `_thumbnailRRect` and `_buttonCenter` (nullable, computed from layout), and `_isWithinRemoveButtonHitArea` and `_paintRemoveButton`.
- The setters for `onThumbnailTap`, `onRemoveTap` and `textDirection`.

## Prove it

- Turn on `debugPaintSizeEnabled`: green outlines appear on the thumbnail rounded rect and on a circle larger than the painted "x"; taps inside each outline, and only there, fire the matching callback.
- Tap in the transparent gap around the thumbnail: neither callback fires, and the widget behind the attachment receives the tap.
- Tap just outside the box but inside the green button circle: `onRemoveTap` fires.
- Put the attachment inside `IntrinsicWidth` or `IntrinsicHeight`: no layout error, and the size equals the child's intrinsic size plus `_removeButtonOverflowDistance * 2`.
- With a screen reader, the attachment is one node labelled "Attachment thumbnail", announced as a button when `onThumbnailTap` is set, with a "Remove attachment" custom action when `onRemoveTap` is set.
- The child's image renders with rounded corners and a circular bite at the button, and the "x" draws on top, outside the clip.
