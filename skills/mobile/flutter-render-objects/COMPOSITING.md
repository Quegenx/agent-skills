# Compositing

When a custom `RenderObject` must take part in compositing itself: what layers are, how `needsCompositing` and `alwaysNeedsCompositing` propagate, pushing and reusing your own layers, updating a layer property without repainting, and reporting transforms through `applyPaintTransform`. Sources: Matt Carroll's [compositing guide](https://renderobjects.com/guides/compositing/) and his [applyPaintTransform()](https://renderobjects.com/api/paint/applyPaintTransform/) page, checked against api.flutter.dev, the framework source and `vector_math`. Where the official API differs, the official form comes first and the site's claim follows in one line. The site states no Flutter or vector_math version. Code blocks are copied from the site; dashes inside its code comments are replaced by commas or colons. Drawing, `push*` clip helpers and repaint-boundary basics are in [PAINTING.md](PAINTING.md); hit testing through transforms is in [HIT-TESTING.md](HIT-TESTING.md).

**Contents:** [Most objects never touch this](#most-objects-never-touch-this) · [What compositing is](#what-compositing-is) · [needsCompositing](#needscompositing) · [alwaysNeedsCompositing](#alwaysneedscompositing) · [Pushing a layer](#pushing-a-layer) · [OffsetLayer and repaint boundaries](#offsetlayer-and-repaint-boundaries) · [The layer slot and LayerHandle](#the-layer-slot-and-layerhandle) · [Reusing layers across frames](#reusing-layers-across-frames) · [Updating layer properties](#updating-layer-properties) · [When compositing bits need updating](#when-compositing-bits-need-updating) · [applyPaintTransform](#applypainttransform) · [Performance](#performance) · [Prove it](#prove-it)

## Most objects never touch this

[renderobjects](https://renderobjects.com/guides/compositing/): compositing happens inside the same `paint(PaintingContext, Offset)` method as drawing; instead of (or as well as) canvas commands you insert a `Layer`. The related members outside `paint` are `alwaysNeedsCompositing`, `layer`, `applyPaintTransform` and `markNeedsCompositingBitsUpdate`. Most render objects never need any of it, because `pushClipRect`, `pushOpacity` and the other helpers manage layers. This file is for pushing a layer yourself, reusing one across frames, or coordinating compositing flags up the tree.

## What compositing is

[renderobjects](https://renderobjects.com/guides/compositing/):

- **Pictures vs layers.** Canvas commands (`drawRect`, `drawPath`) are recorded into a *picture* that is rasterized. Layers are tree nodes the compositor handles as separate units; each can have its own transform, opacity, clip or backdrop filter applied on the GPU without re-rasterizing the pictures inside. Animated opacity, backdrop blur and arbitrary transforms work this way because repainting every pixel every frame would be too expensive.
- **The layer tree is parallel to, but distinct from, the render tree.** Each frame the framework walks the render tree's `paint` methods to build or update the layer tree, then hands it to the engine. Your render object either draws into the current layer's picture or introduces layers of its own.

## needsCompositing

[renderobjects](https://renderobjects.com/guides/compositing/): `needsCompositing` is a bit computed for you: true if any descendant has `alwaysNeedsCompositing` true or is a repaint boundary. "You read this flag, you don't write it."

- **Why helpers need it.** A canvas clip applies only to commands recorded into the same picture. A descendant's own layer is a separate node in the layer tree, so a canvas clip can't reach it; the clip has to become a `ClipRectLayer` that the compositor applies. That is why `pushClipRect` takes the flag. Pass your own value verbatim:

```dart
context.pushClipRect(needsCompositing, offset, clipRect, paintCallback);
```

- **Passing `false` wrongly** [renderobjects](https://renderobjects.com/guides/compositing/): clips don't apply to descendant layers, transforms get bypassed. Official ([pushClipRect](https://api.flutter.dev/flutter/rendering/PaintingContext/pushClipRect.html)): "Typically this matches the value of [RenderObject.needsCompositing] for the caller."
- **Not every helper takes it**: `pushOpacity` and `pushColorFilter` always push a layer ([PAINTING.md](PAINTING.md#layers-and-needscompositing)).

## alwaysNeedsCompositing

[renderobjects](https://renderobjects.com/guides/compositing/): declares that *this* render object produces a compositor layer during paint, so ancestors must know. Default `false`. Override it if you push a layer, unconditionally or by property:

```dart
@override
bool get alwaysNeedsCompositing => true;
```

```dart
@override
bool get alwaysNeedsCompositing => _filter != null;
```

If the answer can change at runtime, re-propagate it with `markNeedsCompositingBitsUpdate()` ([below](#when-compositing-bits-need-updating)). Official ([alwaysNeedsCompositing](https://api.flutter.dev/flutter/rendering/RenderObject/alwaysNeedsCompositing.html)): "You must call [markNeedsCompositingBitsUpdate] if the value of this getter changes. (This is implied when [adoptChild] or [dropChild] are called.)"

## Pushing a layer

- **Official signature** ([PaintingContext.pushLayer](https://api.flutter.dev/flutter/rendering/PaintingContext/pushLayer.html)): `pushLayer(ContainerLayer childLayer, PaintingContextCallback painter, Offset offset, {Rect? childPaintBounds})`.
  - "The `offset` is the offset to pass to the `painter`. In particular, it is not an offset applied to the layer itself."
  - "The given layer must be an unattached orphan." A reused layer has its old children removed automatically ("If a layer is being reused, it may already contain children. We remove them").
  - `childPaintBounds` "can be used for debugging but have no effect on painting".
  - The `pushLayer` docs do not say when `alwaysNeedsCompositing` must be true; the sibling [addLayer](https://api.flutter.dev/flutter/rendering/PaintingContext/addLayer.html), `pushOpacity` and `pushColorFilter` docs say a caller "is very likely to require its [RenderObject.alwaysNeedsCompositing] property to return true". renderobjects.com puts it more strongly for `pushLayer`: `pushLayer` "only makes sense when `alwaysNeedsCompositing` reports `true`", otherwise ancestors won't have made the right decisions.
- **The site's example** [renderobjects](https://renderobjects.com/guides/compositing/), which it says allocates a fresh layer every paint and is *not* what you want in real code (reuse is [below](#reusing-layers-across-frames)):

```dart
@override
void paint(PaintingContext context, Offset offset) {
  // Create or reuse a layer that applies some effect: here, a color filter.
  final ColorFilterLayer filterLayer = ColorFilterLayer(colorFilter: _filter!);
  // Push the layer and paint children into it.
  context.pushLayer(filterLayer, _paintContents, offset);
}

void _paintContents(PaintingContext context, Offset offset) {
  // Paint your children or other content here. They will be rasterized
  // inside the new layer's coordinate space.
  if (child != null) context.paintChild(child!, offset);
}
```

- **The callback gets a fresh `PaintingContext`** [renderobjects](https://renderobjects.com/guides/compositing/), because the framework may have started a new picture inside the layer. Its `offset` is where to paint in the layer's coordinate space, usually the `offset` you passed in.
- **For a color filter there is a helper**: `pushColorFilter(..., {ColorFilterLayer? oldLayer})` does this reuse for you (see `oldLayer` in [PAINTING.md](PAINTING.md#clips-and-transforms-with-push-helpers)).

## OffsetLayer and repaint boundaries

[renderobjects](https://renderobjects.com/guides/compositing/): with `isRepaintBoundary` true, the framework creates and manages an `OffsetLayer` for the render object, the root of an independently cached layer subtree. The offset moves out of your draw commands and onto the layer, so `paint` gets `Offset.zero`.

```dart
// Non-repaint-boundary: apply the offset to every draw call.
@override
void paint(PaintingContext context, Offset offset) {
  context.canvas.drawRect(offset & size, _paint);
}
```

```dart
// Repaint boundary: offset is always Offset.zero. The OffsetLayer
// the framework manages for you carries the actual position.
@override
bool get isRepaintBoundary => true;

@override
void paint(PaintingContext context, Offset offset) {
  assert(offset == Offset.zero);
  context.canvas.drawRect(Offset.zero & size, _paint);
}
```

In practice write `paint` the same way either way, since `offset + localPoint` collapses to `localPoint` at zero. Official ([updateCompositedLayer](https://api.flutter.dev/flutter/rendering/RenderObject/updateCompositedLayer.html)): "The [OffsetLayer.offset] property will be managed by the framework".

## The layer slot and LayerHandle

- **One slot** [renderobjects](https://renderobjects.com/guides/compositing/): `layer` holds the framework's `OffsetLayer` for a repaint boundary, your pushed layer for a non-boundary that pushes one, or `null` for neither. "You don't typically own both at once"; the layer-pushing patterns here are for render objects that are not repaint boundaries.
- **The setter enforces it** ([RenderObject.layer](https://api.flutter.dev/flutter/rendering/RenderObject/layer.html)): it asserts `!isRepaintBoundary` with "Attempted to set a layer to a repaint boundary render object. The framework creates and assigns an OffsetLayer to a repaint boundary automatically."
- **Two rules the site omits** ([RenderObject.layer](https://api.flutter.dev/flutter/rendering/RenderObject/layer.html)): "If [needsCompositing] is false, this field must be set to null", and "If a new layer is created and stored in some other field on the render object, the render object must use a [LayerHandle] to store it."
- **LayerHandle** ([LayerHandle](https://api.flutter.dev/flutter/rendering/LayerHandle-class.html)): a handle keeps a layer's native resources (engine layers, pictures, possibly "large chunks of texture memory") from being disposed. "A handle is automatically managed for [RenderObject.layer]." A render object that "creates layers in addition to its [RenderObject.layer] and it intends to reuse those layers separately from [RenderObject.layer], it must create a handle to that layer and dispose of it when the layer is no longer needed. For example, if it re-creates or nulls out an existing layer in [RenderObject.paint], it should dispose of the handle to the old layer. It should also dispose of any layer handles it holds in [RenderObject.dispose]." "To dispose of a layer handle, set its [layer] property to null." The class is `LayerHandle<T extends Layer>` with a `LayerHandle([this._layer])` constructor and a `layer` getter and setter. The framework's `RenderFlex` keeps its overflow clip layer this way (source `flex.dart`, excerpts from `paint` and the lines after it):

```dart
    _clipRectLayer.layer = context.pushClipRect(
      needsCompositing,
      offset,
      Offset.zero & size,
      defaultPaint,
      clipBehavior: clipBehavior,
      oldLayer: _clipRectLayer.layer,
    );
```

```dart
  final LayerHandle<ClipRectLayer> _clipRectLayer = LayerHandle<ClipRectLayer>();

  @override
  void dispose() {
    _clipRectLayer.layer = null;
    super.dispose();
  }
```

## Reusing layers across frames

[renderobjects](https://renderobjects.com/guides/compositing/): a non-boundary that pushes its own layer manages the `layer` slot: write it, reuse it, clear it when no layer is needed.

```dart
@override
void paint(PaintingContext context, Offset offset) {
  if (_filter == null) {
    // No effect is active: clear our slot and just paint children directly.
    layer = null;
    if (child != null) context.paintChild(child!, offset);
    return;
  }
  // Reuse the existing layer if we have one; otherwise allocate.
  final ColorFilterLayer filterLayer =
      (layer as ColorFilterLayer?) ?? ColorFilterLayer();
  // Update its properties in place.
  filterLayer.colorFilter = _filter!;
  // Remember it for next frame.
  layer = filterLayer;
  // Push it.
  context.pushLayer(filterLayer, _paintContents, offset);
}
```

- **Layers are mutable** [renderobjects](https://renderobjects.com/guides/compositing/): `ColorFilterLayer`, `OpacityLayer`, `TransformLayer` and so on can change properties between frames.
- **Why reuse matters** [renderobjects](https://renderobjects.com/guides/compositing/): fresh layers each frame still give ancestor isolation. What reuse adds is that the engine can skip re-rasterizing the layer's children when only an effect property changed; changing `OpacityLayer.alpha` per frame on a reused layer is "essentially free", while a brand-new layer has no cached picture and must be re-rasterized. "Always reuse."
- **Official wording** ([RenderObject.layer](https://api.flutter.dev/flutter/rendering/RenderObject/layer.html)): "When repainting, instead of creating a new layer the render object may update the layer stored in this field for better performance. It is also OK to leave this field as null and create a new layer on every repaint, but without the performance benefit."
- **With a helper, reuse is one argument**: `layer = context.pushClipRect(..., oldLayer: layer as ClipRectLayer?)`, and likewise `oldLayer:` on `pushOpacity` and `pushColorFilter` ([PAINTING.md](PAINTING.md#clips-and-transforms-with-push-helpers)).

## Updating layer properties

When only a layer's effect changed (opacity value, transform matrix, filter) and the content inside is identical, you want the engine to re-composite without re-running `paint`.

- **Official mechanism** ([markNeedsCompositedLayerUpdate](https://api.flutter.dev/flutter/rendering/RenderObject/markNeedsCompositedLayerUpdate.html), [updateCompositedLayer](https://api.flutter.dev/flutter/rendering/RenderObject/updateCompositedLayer.html)): make the render object a repaint boundary, override `OffsetLayer updateCompositedLayer({required covariant OffsetLayer? oldLayer})` to set the property on the layer, and call `markNeedsCompositedLayerUpdate()` from the setter. That "will schedule this method to be called without repainting children" (it queues the node for paint and requests a visual update); on a render object that "is not a repaint boundary or is a repaint boundary but hasn't been composited yet, it is equivalent to calling [markNeedsPaint]". The framework's `RenderOpacity` is the reference (source `proxy_box.dart`, excerpts):

```dart
@override
bool get alwaysNeedsCompositing => child != null && _alpha > 0;

@override
bool get isRepaintBoundary => alwaysNeedsCompositing;

set opacity(double value) {
  assert(value >= 0.0 && value <= 1.0);
  if (_opacity == value) {
    return;
  }
  final bool didNeedCompositing = alwaysNeedsCompositing;
  final wasVisible = _alpha != 0;
  _opacity = value;
  _alpha = ui.Color.getAlphaFromOpacity(_opacity);
  if (didNeedCompositing != alwaysNeedsCompositing) {
    markNeedsCompositingBitsUpdate();
  }
  markNeedsCompositedLayerUpdate();
  if (wasVisible != (_alpha != 0) && !alwaysIncludeSemantics) {
    markNeedsSemanticsUpdate();
  }
}

@override
OffsetLayer updateCompositedLayer({required covariant OpacityLayer? oldLayer}) {
  final OpacityLayer layer = oldLayer ?? OpacityLayer();
  layer.alpha = _alpha;
  return layer;
}
```

  Its `opacity` setter computes `_alpha = ui.Color.getAlphaFromOpacity(_opacity)`, calls `markNeedsCompositingBitsUpdate()` if `alwaysNeedsCompositing` flipped, then `markNeedsCompositedLayerUpdate()`. The distinct source example is in [PAINTING.md](PAINTING.md#case-1-a-property-decides-whether-a-layer-is-needed).
- **What renderobjects.com says instead** [renderobjects](https://renderobjects.com/guides/compositing/): mutate the live layer in the setter and skip `markNeedsPaint()`, because "The framework will pick up the change at the next compositing pass"; it calls the trigger "`markNeedsCompositingBitsUpdate`'s less-known cousin" without naming it. Its code:

```dart
set opacity(double value) {
  if (_opacity == value) return;
  _opacity = value;
  // Mutate the live layer if we have one. The framework will composite
  // the updated layer tree without rerunning paint or re-rasterizing
  // the picture inside the layer.
  final opacityLayer = layer as OpacityLayer?;
  if (opacityLayer != null) {
    opacityLayer.alpha = _alphaFromOpacity(value);
  } else {
    // We don't have a layer yet (e.g. first frame), so a full paint is needed.
    markNeedsPaint();
  }
}
```

  This is wrong against the framework: nothing in the setter schedules a frame, so the change shows only when something else does. `_alphaFromOpacity` is not a framework API; the framework uses `ui.Color.getAlphaFromOpacity`. Use `updateCompositedLayer` plus `markNeedsCompositedLayerUpdate` for a layer-property-only change.
- **The site's rule of thumb still holds** [renderobjects](https://renderobjects.com/guides/compositing/): if a change affects only a *layer property*, skip repaint; if it changes what is drawn inside the layer (a child's appearance, a clip path's shape, a color used in `_paintContents`), call `markNeedsPaint()`. The optimization matters most for animated properties (an opacity tween, a transform animation); "For one-off changes, just calling `markNeedsPaint()` is simpler and the cost is negligible."

## When compositing bits need updating

[renderobjects](https://renderobjects.com/guides/compositing/): `needsCompositing` is computed in a dedicated tree walk separate from layout and paint. Call `markNeedsCompositingBitsUpdate()` from any setter that might flip `alwaysNeedsCompositing`:

```dart
set filter(ColorFilter? value) {
  if (_filter == value) return;
  final wasCompositing = alwaysNeedsCompositing;
  _filter = value;
  if (alwaysNeedsCompositing != wasCompositing) {
    markNeedsCompositingBitsUpdate();
  }
  markNeedsPaint();
}
```

- Keep the early return: marking the bits dirty walks part of the tree, wasted on a no-op.
- Skipping the call when the answer did change leaves stale ancestor flags: the "clip doesn't apply to layer" bugs.

## applyPaintTransform

- **Official contract:** mutate the supplied matrix by the transform used to paint the given child. `getTransformTo(target)` maps local paint coordinates into the target's coordinate system; `addWithPaintTransform` accepts the child-to-parent paint matrix and inverts it for hit testing. Use the same paint transform in the coordinate-conversion and hit-test paths. [RenderObject.applyPaintTransform](https://api.flutter.dev/flutter/rendering/RenderObject/applyPaintTransform.html), [getTransformTo](https://api.flutter.dev/flutter/rendering/RenderObject/getTransformTo.html), [addWithPaintTransform](https://api.flutter.dev/flutter/rendering/BoxHitTestResult/addWithPaintTransform.html)
- **P2 wording correction:** [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/) and the old line here described a parent-to-child paint matrix. The [RenderBox method's prose](https://api.flutter.dev/flutter/rendering/RenderBox/applyPaintTransform.html) also uses that direction, while its implementation applies the positive child offset. The explicit conversion and hit-test contracts above avoid relying on that ambiguous wording.
- **When you must override** [renderobjects](https://renderobjects.com/guides/compositing/): whenever paint moves descendants in space relative to you.
  - A `TransformLayer` you push yourself: needs an override.
  - `context.pushTransform(...)`: needs an override; the helper applies the transform but cannot report it for you.
  - `pushClipRect`, `pushClipRRect`, `pushClipPath`: no override; clipping doesn't change coordinates.
  - `pushOpacity`, `pushColorFilter`: no override.
- **Skip it and taps miss** [renderobjects](https://renderobjects.com/guides/compositing/): hit testing beneath the transform is "off by exactly the transform you applied"; paint looks correct, but taps miss. The hit-test side must use the same matrix ([HIT-TESTING.md](HIT-TESTING.md#hit-testing-through-transforms)).

```dart
@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  // Apply our own transform first (the same one we apply in our layer
  // or via context.pushTransform).
  transform.multiply(_transform);
  // Then let the default handle the child's BoxParentData offset.
  super.applyPaintTransform(child, transform);
}
```

  The official pairing ([BoxHitTestResult.addWithPaintTransform](https://api.flutter.dev/flutter/rendering/BoxHitTestResult/addWithPaintTransform.html)) multiplies the same `_effectiveTransform` in `applyPaintTransform` and passes it to `addWithPaintTransform`, without calling `super`; the site's version also calls `super`, which adds the child's `BoxParentData` offset.

### Matrix4.translate and scale are deprecated

`Matrix4.translate` is `@Deprecated('Use translateByVector3, translateByVector4, or translateByDouble instead')` and `Matrix4.scale` is `@Deprecated('Use scaleByVector3, scaleByVector4, or scaleByDouble instead')` in [vector_math master](https://github.com/google/vector_math.dart/blob/master/lib/src/vector_math_64/matrix4.dart). The signatures are `translateByDouble(double tx, double ty, double tz, double tw)` and `scaleByDouble(double sx, double sy, double sz, double sw)`. The deprecated forms forward `translate(x, y)` to `translateByDouble(x, y, 0.0, 1.0)` and `scale(x, y)` to `scaleByDouble(x, y ?? x, z ?? x, 1.0)`, so `scale(_scale, _scale)` also scales z. The blocks below are renderobjects.com's with `translate` and `scale` replaced by those equivalents; that is the only change. The site's pages use `transform.translate(dx, dy)` and `..scale(_scale, _scale)`.

- **The `RenderBox` default** applies the child's `BoxParentData.offset`; if all children are placed that way and painted with `context.paintChild(child, offset + childParentData.offset)`, no override is needed [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/). The framework's own default (source `box.dart`) ends with `transform.translateByDouble(offset.dx, offset.dy, 0, 1);` and, in debug mode, throws "$runtimeType does not implement applyPaintTransform." if a child's parent data is not a `BoxParentData`, so a custom parent-data class that does not extend it must override this method.

```dart
// Default in RenderBox: no override required when using BoxParentData.offset.
@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  final BoxParentData childParentData = child.parentData! as BoxParentData;
  transform.translateByDouble(childParentData.offset.dx, childParentData.offset.dy, 0, 1);
}
```

  The same body serves multiple children: "the method is called once per child, so the same implementation handles all of them" [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/).
- **Offset kept in a field** [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/):

```dart
// _childOffset is computed and stored during performLayout().
Offset _childOffset = Offset.zero;

@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  transform.translateByDouble(_childOffset.dx, _childOffset.dy, 0, 1);
}
```

- **Scale and translate** [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/): "apply the translation first, then the scale, matching the order the operations are applied on the canvas."

```dart
@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  final BoxParentData childParentData = child.parentData! as BoxParentData;
  transform
    ..translateByDouble(childParentData.offset.dx, childParentData.offset.dy, 0, 1)
    ..scaleByDouble(_scale, _scale, _scale, 1);
}
```

- **Arbitrary matrix** (rotation, skew, perspective) [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/): multiply it in. `TransformParentData` is not a Flutter class; it is your own `ParentData` subclass holding a `Matrix4 transform` ([PARENT-DATA.md](PARENT-DATA.md)).

```dart
// _childTransform is a Matrix4 computed during performLayout() and
// stored in the child's parent data.
@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  final TransformParentData childParentData =
      child.parentData! as TransformParentData;
  transform.multiply(childParentData.transform);
}
```

- **Hidden child** [renderobjects](https://renderobjects.com/api/paint/applyPaintTransform/): `applyPaintTransform()` is still called for a child you don't paint (an off-screen page, a collapsed panel). Zero the matrix so coordinate conversion is non-invertible and hit tests are rejected.

```dart
@override
void applyPaintTransform(RenderObject child, Matrix4 transform) {
  if (!_isVisible) {
    // Child is not painted; zero the matrix so coordinate conversion
    // produces a non-invertible result and hit tests are rejected.
    transform.setZero();
  } else {
    final BoxParentData childParentData = child.parentData! as BoxParentData;
    transform.translateByDouble(childParentData.offset.dx, childParentData.offset.dy, 0, 1);
  }
}
```

  The rule the site omits ([RenderObject.applyPaintTransform](https://api.flutter.dev/flutter/rendering/RenderObject/applyPaintTransform.html)): "Some RenderObjects will provide a zeroed out matrix in this method, indicating that the child should not paint anything or respond to hit tests currently. A parent may supply a non-zero matrix even though it does not paint its child currently, for example if the parent is a [RenderOffstage] with `offstage` set to true. In both of these cases, the parent must return `false` from [paintsChild]." `RenderOpacity` does this: its `paintsChild` returns `_alpha > 0` (source `proxy_box.dart`).

## Performance

[renderobjects](https://renderobjects.com/guides/compositing/):

- Reuse layer objects across frames; a new layer per paint forces the engine to re-rasterize its contents.
- Prefer mutating layer properties over re-pushing layers: changing `OpacityLayer.alpha` is essentially free, replacing the `OpacityLayer` is not.
- Don't push layers you don't need: a layer has fixed per-frame overhead and memory proportional to its on-screen size. Use canvas operations when the effect can be expressed without one.
- Pass `needsCompositing` through helpers honestly.
- Audit `applyPaintTransform` whenever you add a transforming layer or call `pushTransform`; the bug doesn't show visually.

## Prove it

- [ ] Every render object that calls `pushLayer`, `pushOpacity` or `pushColorFilter` returns `true` from `alwaysNeedsCompositing` under the same condition.
- [ ] Every setter that can flip `alwaysNeedsCompositing` captures the old value and calls `markNeedsCompositingBitsUpdate()` only when it changed.
- [ ] Pushed layers are reused (`layer as XLayer? ?? XLayer()` or `oldLayer: layer`), and `layer = null` on every path that pushes nothing or when `needsCompositing` is false.
- [ ] No render object sets `layer` while `isRepaintBoundary` is true; any second layer field is a `LayerHandle` cleared in `dispose`.
- [ ] Layer-property-only animations use `updateCompositedLayer` plus `markNeedsCompositedLayerUpdate()` on a repaint boundary, not a bare layer mutation; the change appears on the next frame with no other trigger.
- [ ] Every `pushTransform` or `TransformLayer` has a matching `applyPaintTransform` and a matching `addWithPaintTransform` in hit testing; tap the transformed child's corners and they register.
- [ ] Children that are not painted get `transform.setZero()` (or a non-zero matrix for offstage) and `paintsChild` returns `false` for them.
- [ ] No `Matrix4.translate(` or `.scale(` calls remain in `applyPaintTransform`; `dart analyze` reports no deprecation for them.
