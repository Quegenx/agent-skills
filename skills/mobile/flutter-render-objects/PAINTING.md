# Painting

What a custom `RenderObject` must do in `paint`: honour the `offset`, draw on the canvas, paint children, become a repaint boundary only when it pays, mark itself dirty, and use the `push*` helpers for clips and effects. Sources: Matt Carroll's [painting guide](https://renderobjects.com/guides/painting/) and his API pages for [paint()](https://renderobjects.com/api/paint/paint/) and [paintBounds](https://renderobjects.com/api/paint/paintBounds/), checked against api.flutter.dev and the framework source. Where the official API differs, the official form comes first and the site's claim follows in one line. The site states no Flutter version. Code blocks are copied from the site; dashes inside its code comments are replaced by commas or colons. Layers you push yourself, `alwaysNeedsCompositing` in depth and `applyPaintTransform` are in [COMPOSITING.md](COMPOSITING.md); layout and parent-data offsets are in [LAYOUT.md](LAYOUT.md) and [PARENT-DATA.md](PARENT-DATA.md).

**Contents:** [The paint method](#the-paint-method) · [The offset](#the-offset) · [Drawing with the canvas](#drawing-with-the-canvas) · [Painting children](#painting-children) · [Repaint boundaries](#repaint-boundaries) · [When paint re-runs](#when-paint-re-runs) · [Layers and needsCompositing](#layers-and-needscompositing) · [Clips and transforms with push helpers](#clips-and-transforms-with-push-helpers) · [paintBounds](#paintbounds) · [Performance](#performance) · [Prove it](#prove-it)

## The paint method

[renderobjects](https://renderobjects.com/guides/painting/): `paint(PaintingContext context, Offset offset)` is the single override the framework calls when it is time to draw. Inside it you do some combination of three things:

1. Draw your own visual content onto `context.canvas`.
2. Paint each child with `context.paintChild(child, childOffset)`.
3. Optionally wrap either in clips, transforms or other effects via `context` helpers.

The `isRepaintBoundary` getter, the `needsCompositing` flag and property setters that mark you dirty live outside `paint` but sit "in close orbit around it".

- **Contract** [renderobjects](https://renderobjects.com/api/paint/paint/): paint "is responsible for running `Canvas` commands, pushing engine layers, and running paint on any children. Typically, a Render Object just paints its children ... But sometimes a Render Object needs to add some decorations, visual effects, and transformations of its own."
- **Never call it yourself** [api.flutter.dev](https://api.flutter.dev/flutter/rendering/RenderObject/paint.html): "Do not call this function directly. If you wish to paint yourself, call [markNeedsPaint] instead ... If you wish to paint one of your children, call [PaintingContext.paintChild]."
- **The canvas can change mid-paint** [api.flutter.dev](https://api.flutter.dev/flutter/rendering/RenderObject/paint.html): "the current canvas held by the context might change because draw operations before and after painting children might need to be recorded on separate compositing layers."
- **You don't construct the `PaintingContext`** [renderobjects](https://renderobjects.com/guides/painting/): the framework hands it to you. It exposes `canvas`, methods for painting children and helpers for compositing effects.

## The offset

[renderobjects](https://renderobjects.com/guides/painting/): `offset` is where your local origin sits in the shared canvas. Your own coordinates always start at `(0, 0)`; add `offset` to every local coordinate before drawing.

```dart
@override
void paint(PaintingContext context, Offset offset) {
  final localTopLeft = const Offset(50, 50);
  final rect = (offset + localTopLeft) & const Size(20, 20);
  context.canvas.drawRect(rect, _paint);
}
```

- If `offset` is `(100, 200)`, the rectangle lands at `(150, 250)`, the right place.
- **Forgetting `offset` is one of the most common bugs** [renderobjects](https://renderobjects.com/guides/painting/): the object paints correctly when it sits at the canvas origin and "mysteriously shift[s] or disappear[s] everywhere else". If something paints in the wrong place, check this first.

## Drawing with the canvas

- **`context.canvas` is a standard `Canvas`** [renderobjects](https://renderobjects.com/guides/painting/): `drawRect`, `drawRRect`, `drawCircle`, `drawPath`, `drawImage`, `drawParagraph` and so on, combined with `Paint` objects for color, stroke, blend mode and shader.
- **Stay inside `offset & size`** [renderobjects](https://renderobjects.com/guides/painting/): the framework assumes everything you draw is inside it. Painting outside "works visually but breaks repaint optimization, hit testing, and clipping by ancestors." If you must draw outside, override [paintBounds](#paintbounds).
- **`Paint` objects are not free** [renderobjects](https://renderobjects.com/guides/painting/): hold a reused configuration as a field and mutate it only when its inputs change. Allocating a `Paint` inside `paint` is "a small but real per-frame cost."

## Painting children

[renderobjects](https://renderobjects.com/guides/painting/): for each child call:

```dart
context.paintChild(child, offset + childOffset);
```

`childOffset` is the offset you stored in the child's `parentData` during layout ([LAYOUT.md](LAYOUT.md)). `paintChild` handles the rest, including whether the child is a repaint boundary or has its own compositing needs.

- **`defaultPaint`** [renderobjects](https://renderobjects.com/guides/painting/): with `ContainerRenderObjectMixin` (`RenderBoxContainerDefaultsMixin` supplies `defaultPaint`), this walks children in order and paints each at its `BoxParentData` offset. If your paint order matches child order and you apply no effects between children, it is all you need:

```dart
@override
void paint(PaintingContext context, Offset offset) {
  defaultPaint(context, offset);
}
```

- **Custom order** [renderobjects](https://renderobjects.com/guides/painting/): for back-to-front stacks or skipping invisible children, iterate yourself and call `context.paintChild` for each. Hit testing must then walk the reverse of *your* paint order ([HIT-TESTING.md](HIT-TESTING.md#testing-children-with-hittestchildren)).
- **Hand-written passthrough, corrected** ([ContainerParentDataMixin.nextSibling](https://api.flutter.dev/flutter/rendering/ContainerParentDataMixin/nextSibling.html)): `nextSibling` lives on `ContainerParentDataMixin`, so the cast must be to your container parent-data type, here `ContainerBoxParentData<RenderBox>`:

```dart
void paint(PaintingContext context, Offset offset) {
  RenderBox? child = firstChild;
  while (child != null) {
    final childParentData = child.parentData! as ContainerBoxParentData<RenderBox>;
    context.paintChild(child, offset + childParentData.offset);
    child = childParentData.nextSibling;
  }
}
```

  renderobjects.com's [paint() page](https://renderobjects.com/api/paint/paint/) casts to `BoxParentData`, which has no `nextSibling` and does not compile; the rest of the block is unchanged. Its "Paint a Thermostat" and "Transform Children" sections are empty TODO stubs. Child-list mixins are in [CHILD-MODELS.md](CHILD-MODELS.md).

## Repaint boundaries

[renderobjects](https://renderobjects.com/guides/painting/): by default a render object is *not* a repaint boundary. When it is marked dirty for paint, the framework walks up to the nearest ancestor boundary and repaints from there. For content that repaints often (animation, video, scrolling) or has expensive ancestors, opt in:

```dart
@override
bool get isRepaintBoundary => true;
```

The framework then gives the render object its own layer, cached apart from the surrounding tree; on repaint only its own `paint` runs and ancestor layers reuse their cached output. App-level guidance on `RepaintBoundary` is in [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md).

- **A boundary always gets `Offset.zero`** [renderobjects](https://renderobjects.com/guides/painting/): its content lives in its own layer, and the parent's position is applied to the layer, not to your draw commands. Code written as `offset + localPoint` works either way. Zero means "your layer's origin", not the screen origin. Official ([updateCompositedLayer](https://api.flutter.dev/flutter/rendering/RenderObject/updateCompositedLayer.html)): "The [OffsetLayer.offset] property will be managed by the framework".
- **Gotchas** [renderobjects](https://renderobjects.com/guides/painting/):
  - They cost memory: each holds a layer, which Carroll calls "a GPU-side texture sized to your render object". The official docs do not describe layers as textures; treat that as his interpretation. A boundary around a large scrollable region or a full-screen widget can be substantial.
  - A boundary can help when either side repaints independently: a frequently repainting child can spare static surroundings, and a static child can spare work when its parent repaints. If both repaint together, the boundary can be redundant. [RenderRepaintBoundary](https://api.flutter.dev/flutter/rendering/RenderRepaintBoundary-class.html). P2 correction: renderobjects.com said a boundary that repaints every frame gains nothing.
  - They can mask a missing `markNeedsPaint()` in an ancestor, because ancestors no longer repaint when you do.
  - They may force ancestors to composite: a layer mid-tree raises `needsCompositing` for everything above, which can promote cheap ancestor clips and transforms into compositor layers.
- **Use them deliberately** [renderobjects](https://renderobjects.com/guides/painting/): where there is a clear reason, such as high paint frequency, expensive surroundings, or a piece of UI logically independent of its tree.

## When paint re-runs

[renderobjects](https://renderobjects.com/guides/painting/): `paint` is called when layout produced a new size or position, when you are marked dirty with `markNeedsPaint()`, or when a descendant inside your repaint scope needs to repaint.

A setter that changes appearance but not layout calls `markNeedsPaint()`:

```dart
set color(Color value) {
  if (_color == value) return;
  _color = value;
  markNeedsPaint();
}
```

- **Layout and paint both changed** [renderobjects](https://renderobjects.com/guides/painting/): call only `markNeedsLayout()`, which implies a repaint. "Don't call both; you'll just waste work."
- **Keep the early return** [renderobjects](https://renderobjects.com/guides/painting/): marking dirty when nothing changed wastes work and can propagate unnecessary repaints.
- **Only a layer property changed** (opacity, transform, filter on a layer you own): see [COMPOSITING.md](COMPOSITING.md#updating-layer-properties) for `markNeedsCompositedLayerUpdate`, which skips repainting children.

## Layers and needsCompositing

[renderobjects](https://renderobjects.com/guides/painting/): most of the time you don't touch layers directly. `needsCompositing` is computed for you from your children; you intervene only in two cases.

- **The helpers do not all decide alike** ([PaintingContext.pushOpacity](https://api.flutter.dev/flutter/rendering/PaintingContext/pushOpacity.html)): only the clip and transform helpers (`pushClipRect`, `pushClipRRect`, `pushClipPath`, `pushTransform`) take a `needsCompositing` argument and can fall back to a canvas save, clip or transform and restore. `pushOpacity(Offset offset, int alpha, PaintingContextCallback painter, {OpacityLayer? oldLayer})` takes no such argument and always creates an `OpacityLayer` (`final OpacityLayer layer = oldLayer ?? OpacityLayer(); ... pushLayer(layer, painter, Offset.zero);`); its docs say the caller "is very likely to require its [RenderObject.alwaysNeedsCompositing] property to return true". The same applies to `pushColorFilter`. renderobjects.com says every `push*` helper, `pushOpacity` included, "decides under the hood whether to apply the effect as a cheap canvas operation or as a full compositor layer"; for opacity and color filters that is wrong.

### Case 1: a property decides whether a layer is needed

[renderobjects](https://renderobjects.com/guides/painting/): opacity is the canonical example. Override `alwaysNeedsCompositing` and call `markNeedsCompositingBitsUpdate()` when the answer flips:

```dart
@override
bool get alwaysNeedsCompositing => _opacity > 0 && _opacity < 1;

set opacity(double value) {
  if (_opacity == value) return;
  final wasCompositing = alwaysNeedsCompositing;
  _opacity = value;
  if (alwaysNeedsCompositing != wasCompositing) {
    markNeedsCompositingBitsUpdate();
  }
  markNeedsPaint();
}
```

- **Official rule** ([alwaysNeedsCompositing](https://api.flutter.dev/flutter/rendering/RenderObject/alwaysNeedsCompositing.html)): "You must call [markNeedsCompositingBitsUpdate] if the value of this getter changes. (This is implied when [adoptChild] or [dropChild] are called.)"
- **How the framework's own `RenderOpacity` does it** ([RenderOpacity](https://api.flutter.dev/flutter/rendering/RenderOpacity-class.html), framework source `proxy_box.dart`): the setter shape matches, but it composites whenever it has a child and alpha above zero, makes itself a repaint boundary only then, keeps the alpha on the layer through `updateCompositedLayer`, and calls `markNeedsCompositedLayerUpdate()` instead of `markNeedsPaint()`.

The complete framework reference, including the setter, is in [Updating layer properties](COMPOSITING.md#updating-layer-properties). [RenderOpacity](https://api.flutter.dev/flutter/rendering/RenderOpacity-class.html)

  renderobjects.com's version calls `markNeedsPaint()`, so every opacity change re-runs `paint`. Details in [COMPOSITING.md](COMPOSITING.md#updating-layer-properties).

### Case 2: you always need a layer

[renderobjects](https://renderobjects.com/guides/painting/): if the object always applies a backdrop filter or shader mask that can't be expressed without a layer, return `true` with no setter work:

```dart
@override
bool get alwaysNeedsCompositing => true;
```

The official docs' example ([alwaysNeedsCompositing](https://api.flutter.dev/flutter/rendering/RenderObject/alwaysNeedsCompositing.html)): "videos should return true if they use hardware decoders." For everything else use the `push*` helpers and "don't touch `alwaysNeedsCompositing`" [renderobjects](https://renderobjects.com/guides/painting/), except opacity and color filters, which always push a layer (above).

## Clips and transforms with push helpers

[renderobjects](https://renderobjects.com/guides/painting/): call a `push*` method on the context, pass a callback that does the painting, and the context applies the effect for that callback. The site's example, with its comments (they carry the technique):

```dart
@override
void paint(PaintingContext context, Offset offset) {
  context.pushClipRect(
    // Pass through our own compositing flag so the helper can decide
    // whether the clip needs to become a real compositor layer.
    needsCompositing,
    // The position of our render object in the parent's coordinate space:
    // pushClipRect expects this to translate the clip rect into place.
    offset,
    // The clip rect itself, expressed in our LOCAL coordinate space
    // (origin at zero), since the helper will translate it using `offset`.
    Offset.zero & size,
    // The painting callback. The framework hands us a fresh context and
    // offset that already account for any layer it may have set up.
    (innerContext, innerOffset) {
      // Draw using innerContext and innerOffset, not the outer ones.
      innerContext.canvas.drawRect(innerOffset & size, _paint);
    },
  );
}
```

- **The clip rect is local** [renderobjects](https://renderobjects.com/guides/painting/): pass `Offset.zero & size`, not `offset & size`; the helper combines it with `offset`. Official ([pushClipRect](https://api.flutter.dev/flutter/rendering/PaintingContext/pushClipRect.html)): "The `clipRect` ... should not include the `offset`."
- **`offset` is your position in the parent's space**, the value you received in `paint` [renderobjects](https://renderobjects.com/guides/painting/).
- **Inside the callback, use the supplied `innerOffset`.** `pushClipRect` passes its `offset` through both the composited and canvas branches; a composited clip does not by itself make the callback offset zero. [pushClipRect](https://api.flutter.dev/flutter/rendering/PaintingContext/pushClipRect.html). P2 correction: [renderobjects](https://renderobjects.com/guides/painting/) said the callback offset becomes `Offset.zero` when this helper pushes a layer.
- **Keep the returned layer: `oldLayer`** ([pushClipRect](https://api.flutter.dev/flutter/rendering/PaintingContext/pushClipRect.html)): the full signature takes `{Clip clipBehavior = Clip.hardEdge, ClipRectLayer? oldLayer}` and returns `ClipRectLayer?`. For `oldLayer`, "specify the layer created in the previous frame ... Typically this is the value of [RenderObject.layer]". When `needsCompositing` is false "this method returns null ... If a render object calling this method stores the `oldLayer` in its [RenderObject.layer] field, it should set that field to null." The framework's own `RenderClipRect` (source `proxy_box.dart`):

```dart
@override
void paint(PaintingContext context, Offset offset) {
  if (child != null) {
    if (clipBehavior != Clip.none) {
      _updateClip();
      layer = context.pushClipRect(
        needsCompositing,
        offset,
        _clip!,
        super.paint,
        clipBehavior: clipBehavior,
        oldLayer: layer as ClipRectLayer?,
      );
    } else {
      context.paintChild(child!, offset);
      layer = null;
    }
  } else {
    layer = null;
  }
}
```

  renderobjects.com's example ignores `oldLayer` and the return value, so it gives up layer reuse across frames. The other `push*` helpers take an `oldLayer` the same way (`pushOpacity(..., {OpacityLayer? oldLayer})`, `pushColorFilter(..., {ColorFilterLayer? oldLayer})`); reuse is covered in [COMPOSITING.md](COMPOSITING.md#reusing-layers-across-frames).
- **The other helpers** [renderobjects](https://renderobjects.com/guides/painting/): `pushClipRRect`, `pushClipPath`, `pushTransform`, `pushOpacity` and `pushColorFilter`. Use them. Manual `canvas.save()`, `canvas.clipRect()` and `canvas.restore()` works for simple non-anti-aliased cases but "skips the framework's compositing logic", so anti-aliasing quality suffers and the compositor can't optimize.
- **`pushTransform` also needs `applyPaintTransform`**, or taps miss: see [COMPOSITING.md](COMPOSITING.md#applypainttransform).

## paintBounds

- **What it is, officially** ([RenderObject.paintBounds](https://api.flutter.dev/flutter/rendering/RenderObject/paintBounds.html)): "An estimate of the bounds within which this render object will paint. Useful for debugging flags such as [debugPaintLayerBordersEnabled]. These are also the bounds used by [showOnScreen] to make a [RenderObject] visible on screen." `RenderBox` (source `box.dart`) returns `Offset.zero & size`, "in the local coordinate system of this box":

```dart
// Default in RenderBox: no override needed for standard box content.
@override
Rect get paintBounds => Offset.zero & size;
```

  renderobjects.com says the framework uses it for repaint region calculations ("to decide which parts of the screen to repaint, to cull layers that are off-screen") and that too small a rect causes "visible tearing". The official docs say neither; `RenderBox.paintBounds` says instead: "If the box attempts to paints outside its paint bounds, there might not be enough memory allocated to represent the box's visual appearance, which can lead to undefined behavior."
- **Override it when you draw outside your size** [renderobjects](https://renderobjects.com/api/paint/paintBounds/): drop shadows, glows, overflow text, badges, or a transform that moves pixels beyond the box. Return a rect that covers everything you draw. The painting guide puts this under a heading "Semantic Bounds", but the member is `paintBounds`; `semanticBounds` is a different getter ([SEMANTICS.md](SEMANTICS.md)).

```dart
@override
Rect get paintBounds {
  return (Offset.zero & size).inflate(_shadowExtent);
}
```

- **Drop shadow** [renderobjects](https://renderobjects.com/api/paint/paintBounds/): expand outward by the shadow's spread.

```dart
static const double _shadowBlur = 12.0;
static const Offset _shadowOffset = Offset(0, 4);

@override
Rect get paintBounds {
  // Inflate by blur radius on all sides, then shift to cover the shadow offset.
  return (Offset.zero & size).expandToInclude(
    Offset(_shadowOffset.dx, _shadowOffset.dy) &
        Size(size.width + _shadowBlur * 2, size.height + _shadowBlur * 2),
  ).inflate(_shadowBlur);
}
```

  "A simpler approximation that is guaranteed to be a safe overestimate":

```dart
@override
Rect get paintBounds => (Offset.zero & size).inflate(_shadowBlur + _shadowOffset.distance);
```

- **Badge on a corner** [renderobjects](https://renderobjects.com/api/paint/paintBounds/):

```dart
static const double _badgeRadius = 8.0;

@override
Rect get paintBounds {
  // Badge is centered on the top-right corner of the box.
  final Rect base = Offset.zero & size;
  final Rect badge = Rect.fromCircle(
    center: Offset(size.width, 0),
    radius: _badgeRadius,
  );
  return base.expandToInclude(badge);
}
```

- **Transformed content** [renderobjects](https://renderobjects.com/api/paint/paintBounds/): take the axis-aligned bounding rect of the transformed box.

```dart
// _transform is a Matrix4 applied to the child during paint().
@override
Rect get paintBounds {
  // Map the four corners of the child through the transform and take
  // the bounding rect of the results.
  return MatrixUtils.transformRect(_transform, Offset.zero & size);
}
```

- **Paints nothing** [renderobjects](https://renderobjects.com/api/paint/paintBounds/): a pure layout node or sizing proxy "can return `Rect.zero`":

```dart
@override
Rect get paintBounds => Rect.zero;
```

  Caution from the official docs ([showOnScreen](https://api.flutter.dev/flutter/rendering/RenderObject/showOnScreen.html)): "If `rect` is null, the entire [RenderObject] (as defined by its [paintBounds]) will be revealed" ([SHOW-ON-SCREEN.md](SHOW-ON-SCREEN.md)).
- **`paintBounds` does not affect hit testing**: the default `hitTest` filters by layout `size` ([HIT-TESTING.md](HIT-TESTING.md#testing-yourself-with-hittestself)).

## Performance

[renderobjects](https://renderobjects.com/guides/painting/): `paint` can run every frame, so small costs compound.

- Don't allocate `Paint`, `Path` or `Rect` objects inside `paint` if you can avoid it; cache them as fields and mutate them only when their inputs change.
- Don't build a complex `Path` from scratch each paint; build it once during layout (or when its inputs change) and reuse it.
- Prefer the context's `push*` helpers over manual `canvas.save()`/`canvas.restore()` for clips and transforms; the helpers cooperate with the compositor.
- Use repaint boundaries deliberately: they cost memory but save paint work, and the balance depends on paint frequency and position in the tree.

## Prove it

- [ ] Every draw call adds `offset` (or `innerOffset` inside a `push*` callback); move the widget away from the screen origin and it still paints in place.
- [ ] No `Paint`, `Path` or `Rect` is allocated inside `paint` for values that don't change per frame.
- [ ] Every appearance setter has the `if (_x == value) return;` early return and calls `markNeedsPaint()`; layout-affecting setters call only `markNeedsLayout()`.
- [ ] `push*` clip and transform calls pass `needsCompositing`, a local clip rect (`Offset.zero & size`), and store the returned layer through `oldLayer:` / `layer =`; `layer` is set to `null` on paths that push nothing.
- [ ] Any `pushOpacity` or `pushColorFilter` caller returns `true` from `alwaysNeedsCompositing` while it pushes.
- [ ] `isRepaintBoundary => true` only where there is a stated reason (high paint frequency, expensive surroundings, logically independent UI), and its `paint` works with `offset == Offset.zero`.
- [ ] Anything drawn outside `size` is covered by an overridden `paintBounds`; turn on `debugPaintLayerBordersEnabled` and confirm.
- [ ] Hand-written child loops cast to `ContainerBoxParentData<RenderBox>` (or your subclass), not `BoxParentData`.
