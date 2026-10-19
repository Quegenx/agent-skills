# Layout

How a custom `RenderBox` lays out, from `performLayout` to dry layout, baselines, intrinsics and building during layout. Sources: the renderobjects.com layout guide and layout API pages by Matt Carroll, checked against api.flutter.dev and the framework source; where the site is wrong, the official form comes first and one line says what renderobjects.com has. Parent data types and `setupParentData` are in [PARENT-DATA.md](PARENT-DATA.md); which child model to use is in [CHILD-MODELS.md](CHILD-MODELS.md).

**Contents:** [The performLayout contract](#the-performlayout-contract) · [Measuring children](#measuring-children) · [Sizing yourself](#sizing-yourself) · [Positioning children](#positioning-children) · [performLayout recipes](#performlayout-recipes) · [When layout runs](#when-layout-runs) · [sizedByParent and performResize](#sizedbyparent-and-performresize) · [Dry layout](#dry-layout) · [Baselines](#baselines) · [Intrinsic sizes](#intrinsic-sizes) · [Text direction](#text-direction) · [Building during layout](#building-during-layout) · [Performance](#performance) · [Prove it](#prove-it)

## The performLayout contract

- [renderobjects](https://renderobjects.com/guides/layout/): `performLayout` is the single override the framework calls for layout. Inside it, do three things in this order: (1) lay out each child with `child.layout(...)`; (2) decide your own size and assign it to `size`; (3) position each child by writing its `parentData.offset`. `setupParentData`, the intrinsic methods and dirty-marking setters sit "in close orbit around it".
- [renderobjects](https://renderobjects.com/api/layout/performLayout/): its two responsibilities are "Run layout on any children and position them (if there are children)" and "Choose the size for the Render Object". Official wording: performLayout is "where render boxes decide, if they are not [sizedByParent], what [size] they should be, and also where they decide where their children should be" (https://api.flutter.dev/flutter/rendering/RenderObject/performLayout.html).
- Official (https://api.flutter.dev/flutter/rendering/RenderBox/performLayout.html): "RenderBox subclasses need to either override performLayout() to set a size and lay out any children, or, set sizedByParent to true so that performResize() sizes the render object." So a `sizedByParent` box with no children needs no override. renderobjects.com says "There is no default implementation for `performLayout()`".

## Measuring children

- [renderobjects](https://renderobjects.com/guides/layout/): measure a child with `child.layout(childConstraints, parentUsesSize: true)`. The constraints you pass may be the same ones you received, tightened, loosened or entirely made up.
- Pass `parentUsesSize: true` **if your own size or layout depends on the child's size**. Otherwise Flutter may not notify you when the child relayouts, which gives "stale layouts that are very hard to debug". "When in doubt, set it to true." [renderobjects](https://renderobjects.com/guides/layout/)
- After `child.layout(...)` you may read `child.size` only if you passed `parentUsesSize: true`; otherwise reading it is a contract violation that asserts in debug mode. Official: `layout` sets `_debugCanParentUseSize = parentUsesSize` and the `size` getter asserts against it (https://api.flutter.dev/flutter/rendering/RenderBox/size.html). [renderobjects](https://renderobjects.com/guides/layout/)
- Official: "Passing tight constraints ... to the child will allow the rendering library to apply some optimizations" (https://api.flutter.dev/flutter/rendering/RenderBox-class.html).

## Sizing yourself

- [renderobjects](https://renderobjects.com/guides/layout/): size yourself with `size = constraints.constrain(Size(width, height));`. **Your final size must satisfy the incoming constraints** or a debug assertion fires. Use `constrain`, `biggest`, `smallest` or `tighten` on the constraints.
- You must always set `size`, even with no content: "A render box without a size is an error." Official: `RenderBox.hitTest` throws "Cannot hit test a render box with no size." (https://api.flutter.dev/flutter/rendering/RenderBox/hitTest.html). [renderobjects](https://renderobjects.com/guides/layout/)

## Positioning children

- [renderobjects](https://renderobjects.com/guides/layout/): position a child through its parent data:

```dart
final childParentData = child.parentData! as BoxParentData;
childParentData.offset = Offset(x, y);
```

- The offset is relative to your own top-left. The framework uses it during painting and hit testing; you don't apply it yourself. [renderobjects](https://renderobjects.com/guides/layout/)
- `setupParentData` only instantiates parent data; "Parent data is configured during layout." See [PARENT-DATA.md](PARENT-DATA.md#setupparentdata). [renderobjects](https://renderobjects.com/api/layout/setupParentData/)

## performLayout recipes

All from [renderobjects](https://renderobjects.com/api/layout/performLayout/) unless noted.

No children, take all space:

```dart
void performLayout() {
  size = constraints.biggest;
}
```

No children, a preferred size that yields to the constraints:

```dart
static const Size _preferredSize = Size(300, 200);

void performLayout() {
  size = constraints.constrain(_preferredSize);
}
```

One child, same size as the child ("The child is given the same constraints so it can shrink or grow up to the available space."):

```dart
void performLayout() {
  if (child != null) {
    child!.layout(constraints, parentUsesSize: true);
    size = child!.size;
  } else {
    size = constraints.smallest;
  }
}
```

One child, fill and center ("The child receives loose constraints so it can size itself naturally."):

```dart
void performLayout() {
  size = constraints.biggest;
  if (child != null) {
    child!.layout(constraints.loosen(), parentUsesSize: true);
    final BoxParentData childParentData = child!.parentData! as BoxParentData;
    childParentData.offset = Offset(
      (size.width - child!.size.width) / 2,
      (size.height - child!.size.height) / 2,
    );
  }
}
```

Several slotted children, a scaffold: "The body fills whatever vertical space remains" (only API names checked):

```dart
void performLayout() {
  size = constraints.biggest;
  double top = 0;
  double bottom = size.height;

  // App bar: full width, natural height, pinned to the top.
  if (_appBar != null) {
    _appBar!.layout(
      BoxConstraints.tightFor(width: size.width),
      parentUsesSize: true,
    );
    (_appBar!.parentData! as BoxParentData).offset = Offset.zero;
    top += _appBar!.size.height;
  }

  // Bottom nav: full width, natural height, pinned to the bottom.
  if (_bottomNav != null) {
    _bottomNav!.layout(
      BoxConstraints.tightFor(width: size.width),
      parentUsesSize: true,
    );
    bottom -= _bottomNav!.size.height;
    (_bottomNav!.parentData! as BoxParentData).offset = Offset(0, bottom);
  }

  // Body: fills the remaining space between app bar and bottom nav.
  if (_body != null) {
    _body!.layout(
      BoxConstraints.tightFor(width: size.width, height: (bottom - top).clamp(0, double.infinity)),
      parentUsesSize: false,
    );
    (_body!.parentData! as BoxParentData).offset = Offset(0, top);
  }
}
```

A list of children, a facepile of overlapping avatars. Corrected form: walking siblings needs `ContainerBoxParentData<RenderBox>` (https://api.flutter.dev/flutter/rendering/ContainerParentDataMixin/previousSibling.html).

```dart
static const double _avatarSize = 40.0;
static const double _overlap = 12.0;

void performLayout() {
  final BoxConstraints childConstraints = BoxConstraints.tight(
    const Size(_avatarSize, _avatarSize),
  );

  double x = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    child.layout(childConstraints, parentUsesSize: false);
    final ContainerBoxParentData<RenderBox> childParentData =
        child.parentData! as ContainerBoxParentData<RenderBox>;
    childParentData.offset = Offset(x, 0);
    child = childParentData.nextSibling;
    x += _avatarSize - _overlap;
  }

  // The last avatar is not overlapped on its right side, so add back
  // the overlap that was subtracted in the final iteration.
  final double totalWidth = childCount == 0
      ? 0
      : x - (_avatarSize - _overlap) + _avatarSize;
  size = constraints.constrain(Size(totalWidth, _avatarSize));
}
```

renderobjects.com casts to `BoxParentData`, which has no `nextSibling`, so its version does not compile.

Skipping layout for off-screen children: "Children outside the viewport still exist in the child list and retain their parent data offsets, but `layout()` is not called for them. They are skipped in `paint()` as well." Same correction as the facepile. Children built during layout are in [CHILD-MODELS.md](CHILD-MODELS.md#virtualized-children).

```dart
static const double _itemExtent = 160.0;

double _scrollOffset = 0.0;

void performLayout() {
  size = constraints.biggest;

  final double viewportStart = _scrollOffset;
  final double viewportEnd = _scrollOffset + size.width;

  RenderBox? child = firstChild;
  int index = 0;
  while (child != null) {
    final ContainerBoxParentData<RenderBox> childParentData =
        child.parentData! as ContainerBoxParentData<RenderBox>;
    final double itemStart = index * _itemExtent;
    final double itemEnd = itemStart + _itemExtent;

    if (itemEnd > viewportStart && itemStart < viewportEnd) {
      // Child is at least partially visible: lay it out.
      child.layout(
        BoxConstraints.tightFor(width: _itemExtent, height: size.height),
        parentUsesSize: false,
      );
    }

    // Store the position in layout space; paint() applies the scroll offset.
    childParentData.offset = Offset(itemStart, 0);

    child = childParentData.nextSibling;
    index++;
  }
}
```

## When layout runs

- [renderobjects](https://renderobjects.com/guides/layout/): `performLayout` runs when your constraints change, when you are marked dirty with `markNeedsLayout()`, or when a child whose size you said you use (`parentUsesSize`) changes size.
- A layout-affecting property setter must call `markNeedsLayout()`. Forgetting it is "the single most common bug in custom render objects". The early return matters: marking dirty on no change is wasted work and "can cause infinite layout loops in pathological cases." [renderobjects](https://renderobjects.com/guides/layout/)

```dart
set spacing(double value) {
  if (_spacing == value) return;
  _spacing = value;
  markNeedsLayout();
}
```

- Relayout boundaries are points where a child's relayout cannot affect its parent, so dirtiness stops propagating upward; `parentUsesSize: true` deliberately turns this optimization off. [renderobjects](https://renderobjects.com/guides/layout/) Official condition, four arms: `_isRelayoutBoundary = !parentUsesSize || sizedByParent || constraints.isTight || parent == null;` (https://api.flutter.dev/flutter/rendering/RenderObject/layout.html). renderobjects.com names only tight constraints and an unused size. Debug output shows `relayoutBoundary=up<N>` in render object descriptions.

## sizedByParent and performResize

- [renderobjects](https://renderobjects.com/api/layout/performResize/): "`performResize()` sets the render object's `size` using only the incoming `BoxConstraints`, before children are laid out. It is only called when `sizedByParent` returns `true`." Then `performResize` sets `size` from `constraints` only ("children are not accessible here"), and "`performLayout()` must **not** set `size`. It runs afterward to position and lay out children." Official debug text: "Because this RenderBox has sizedByParent set to true, it must set its size in performResize()."
- "`sizedByParent` defaults to `false`, so `performResize()` is never called. Size is set inside `performLayout()` instead. This is the right choice whenever the render object's size depends on its children." [renderobjects](https://renderobjects.com/api/layout/performResize/)
- Why: official, "Sizing purely based on the constraints allows the system to make some significant optimizations" (https://api.flutter.dev/flutter/rendering/RenderBox-class.html). renderobjects.com adds that unchanged constraints let the framework skip `performResize()`.
- Official form (https://api.flutter.dev/flutter/rendering/RenderBox/performResize.html): `RenderBox.performResize()` already does `size = computeDryLayout(constraints);`, and its docs say "Instead of overriding this method, consider overriding [computeDryLayout]." The class-doc example:

```dart
@override
bool get sizedByParent => true;

@override
Size computeDryLayout(BoxConstraints constraints) {
  return constraints.smallest;
}
```

renderobjects.com overrides `performResize` itself, which leaves `computeDryLayout` at its default, which asserts through `debugCannotComputeDryLayout` (see [Dry layout](#dry-layout)). Its examples in the official shape (each `performResize` body returned from `computeDryLayout`):

```dart
@override
bool get sizedByParent => true;

@override
Size computeDryLayout(BoxConstraints constraints) => constraints.biggest;

@override
void performLayout() {
  // Size is already set. Lay out and position children here.
  child?.layout(constraints, parentUsesSize: false);
}
```

```dart
// Width-to-height ratio (e.g. 16/9 for widescreen).
static const double _aspectRatio = 16 / 9;

@override
bool get sizedByParent => true;

@override
Size computeDryLayout(BoxConstraints constraints) {
  final double width = constraints.maxWidth;
  final double height = (width / _aspectRatio).clamp(
    constraints.minHeight,
    constraints.maxHeight,
  );
  return Size(width, height);
}
```

```dart
static const Size _naturalSize = Size(200, 48);

@override
bool get sizedByParent => true;

@override
Size computeDryLayout(BoxConstraints constraints) => constraints.constrain(_naturalSize);
```

The aspect-ratio example uses `constraints.maxWidth`, which is infinite under unbounded width and would fail `assert(size.isFinite)`; renderobjects.com does not say so.

## Dry layout

- [renderobjects](https://renderobjects.com/api/layout/computeDryLayout/): `computeDryLayout(BoxConstraints constraints)` answers "what size would you be under these constraints?" without layout; it is "the engine behind `getDryLayout()`, which is called by `IntrinsicWidth`, `IntrinsicHeight`, and any other render object that needs to measure a child before committing to a layout pass." It "cannot set `size`, position children, or call `child.layout()`. It may only call `child.getDryLayout()` to measure children, then return a `Size`."
- Official (https://api.flutter.dev/flutter/rendering/RenderBox/computeDryLayout.html): `Size computeDryLayout(covariant BoxConstraints constraints)` (`@visibleForOverriding @protected`). "The size returned by this method must match the [size] that the [RenderBox] will compute for itself in [performLayout] (or [performResize], if [sizedByParent] is true)." "If this algorithm depends on the size of a child, the size of that child should be obtained using its [getDryLayout] method." Never call `computeDryLayout` directly; call `getDryLayout`.
- When the size cannot be known, official: "the function should call [debugCannotComputeDryLayout] from within an assert and return a dummy value of `const Size(0, 0)`". `bool debugCannotComputeDryLayout({String? reason, FlutterError? error})` takes exactly one of the two. The default implementation does exactly that with '... class does not implement "computeDryLayout"'. renderobjects.com says the default "throws an `UnsupportedError`"; the guide adds that returning `Size.zero` "is increasingly considered a smell. As of recent Flutter versions, returning a meaningful dry layout is the expected default." [renderobjects](https://renderobjects.com/guides/layout/)

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  assert(debugCannotComputeDryLayout(
    reason: 'MyRenderBox does not support dry layout.',
  ));
  return Size.zero;
}
```

- "Any render object that could appear inside an `IntrinsicWidth` or `IntrinsicHeight` must override this method. If your render object will never be used in that context, override it to assert instead of silently failing." [renderobjects](https://renderobjects.com/api/layout/computeDryLayout/)

Leaf, fixed and fill:

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  return constraints.constrain(const Size(200, 48));
}
```

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  return constraints.biggest;
}
```

One child, match and padding:

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  final Size childSize = child!.getDryLayout(constraints);
  return constraints.constrain(childSize);
}
```

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  const EdgeInsets padding = EdgeInsets.all(16);
  final BoxConstraints innerConstraints = constraints.deflate(padding);
  final Size childSize = child!.getDryLayout(innerConstraints);
  return constraints.constrain(padding.inflateSize(childSize));
}
```

Several children, largest and sum along the axis:

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  Size largest = Size.zero;
  RenderBox? child = firstChild;
  while (child != null) {
    final Size childSize = child.getDryLayout(constraints);
    if (childSize.width > largest.width || childSize.height > largest.height) {
      largest = childSize;
    }
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return constraints.constrain(largest);
}
```

```dart
@override
Size computeDryLayout(BoxConstraints constraints) {
  double totalWidth = 0;
  double maxHeight = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    final Size childSize = child.getDryLayout(constraints.loosen());
    totalWidth += childSize.width;
    if (childSize.height > maxHeight) maxHeight = childSize.height;
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return constraints.constrain(Size(totalWidth, maxHeight));
}
```

## Baselines

### Actual baseline

- [renderobjects](https://renderobjects.com/guides/layout/): override `computeDistanceToActualBaseline(TextBaseline baseline)` when baseline alignment matters (for example inside a `Row` with `CrossAxisAlignment.baseline`). Return the distance from your top edge, or `null` if you have no baseline. For containers it is usually the relevant child's baseline plus that child's offset. "Most layouts don't need this."
- It is called after layout and cached until the next layout; child sizes and positions are known. Override it, not `getDistanceToBaseline()`. [renderobjects](https://renderobjects.com/api/layout/computeDistanceToActualBaseline/) Official: "Do not call this function directly. If you need to know the baseline of a child from an invocation of [performLayout] or [paint], call [getDistanceToBaseline]." (https://api.flutter.dev/flutter/rendering/RenderBox/computeDistanceToActualBaseline.html)
- Official, inside your override (https://api.flutter.dev/flutter/rendering/RenderBox/getDistanceToActualBaseline.html): "For classes that have a child to which they wish to defer the computation, call [getDistanceToActualBaseline] on the child (not [computeDistanceToActualBaseline], the internal implementation, and not [getDistanceToBaseline], the public entry point for this API)." Container child models can use `RenderBoxContainerDefaultsMixin.defaultComputeDistanceToFirstActualBaseline`. The class docs add: "if the box has any children, it must implement [computeDistanceToActualBaseline]" (https://api.flutter.dev/flutter/rendering/RenderBox-class.html).

First child's baseline, from the guide (already in the official form):

```dart
@override
double? computeDistanceToActualBaseline(TextBaseline baseline) {
  final child = firstChild;
  if (child == null) return null;
  final childBaseline = child.getDistanceToActualBaseline(baseline);
  if (childBaseline == null) return null;
  final childOffset = (child.parentData! as BoxParentData).offset;
  return childBaseline + childOffset.dy;
}
```

The API page's variants in the official form (`getDistanceToActualBaseline` on the child, `ContainerBoxParentData` to walk siblings) [renderobjects](https://renderobjects.com/api/layout/computeDistanceToActualBaseline/):

```dart
// No baseline (the default returns null too).
@override
double? computeDistanceToActualBaseline(TextBaseline baseline) {
  return null;
}
```

```dart
// Fixed baseline.
@override
double? computeDistanceToActualBaseline(TextBaseline baseline) {
  return baseline == TextBaseline.alphabetic ? 14.0 : null;
}
```

```dart
// Single child with offset.
@override
double? computeDistanceToActualBaseline(TextBaseline baseline) {
  if (child == null) return null;
  final BoxParentData childParentData = child!.parentData! as BoxParentData;
  final double? childBaseline = child!.getDistanceToActualBaseline(baseline);
  if (childBaseline == null) return null;
  return childBaseline + childParentData.offset.dy;
}
```

```dart
// First child with a baseline. Also right for baseline-aligned rows:
// "each child's offset already encodes the alignment".
@override
double? computeDistanceToActualBaseline(TextBaseline baseline) {
  RenderBox? child = firstChild;
  while (child != null) {
    final ContainerBoxParentData<RenderBox> childParentData =
        child.parentData! as ContainerBoxParentData<RenderBox>;
    final double? childBaseline = child.getDistanceToActualBaseline(baseline);
    if (childBaseline != null) {
      return childBaseline + childParentData.offset.dy;
    }
    child = childParentData.nextSibling;
  }
  return null;
}
```

renderobjects.com calls `child.getDistanceToBaseline(baseline, onlyReal: true)` in these snippets and casts the multi-child one to `BoxParentData` (no `nextSibling`, so it does not compile).

### Dry baseline

- [renderobjects](https://renderobjects.com/api/layout/computeDryBaseline/): the baseline "without performing a real layout ... called when a parent needs baseline information before committing to a layout pass (for example, when aligning children by baseline in a row)." It receives `BoxConstraints` and a `TextBaseline` (`alphabetic` or `ideographic`), returns `double?` (`null` for no baseline) and has no side effects.
- Official (https://api.flutter.dev/flutter/rendering/RenderBox/computeDryBaseline.html): `double? computeDryBaseline(covariant BoxConstraints constraints, TextBaseline baseline)`. "It's the same exact value [RenderBox.computeDistanceToActualBaseline] would return, when this [RenderBox] was laid out at `constraints` in the same exact state"; accessing `size` or `child.size` "usually indicates a bug". When you implement `computeDryLayout`, "consider overriding [computeDryBaseline] such that it returns a baseline location that is consistent with [getDistanceToActualBaseline]". The layout guide never mentions `computeDryBaseline`.
- Query children with `child.getDryBaseline(...)`, never `child.computeDryBaseline(...)`: it is `@visibleForOverriding @protected`, and `getDryBaseline` caches and "should be only called by the parent [RenderBox]'s [computeDryBaseline] or [computeDryLayout] implementation" (https://api.flutter.dev/flutter/rendering/RenderBox/getDryBaseline.html). renderobjects.com says to use `child.computeDryBaseline()` and does so in every snippet; they are corrected below.
- Default, official: it asserts through `debugCannotComputeDryLayout` and then returns `null`, so in debug the default is an error; boxes that cannot compute it (for example `LayoutBuilder`) "must call [debugCannotComputeDryLayout] in an assert, and return a dummy baseline offset value (such as `null`)." renderobjects.com says the default "returns `null`" and is "correct for render objects that contain no text". Returning `null` explicitly is the right "no baseline" override:

```dart
@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  return null;
}
```

Fixed, passthrough, padding, first baseline and aligned baseline, with children queried through `getDryBaseline` [renderobjects](https://renderobjects.com/api/layout/computeDryBaseline/):

```dart
@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  // Baseline sits 14px from the top (ascent of the fixed font).
  return 14;
}
```

```dart
@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  return child?.getDryBaseline(constraints, baseline);
}
```

```dart
static const double _paddingTop = 12;
static const double _paddingHorizontal = 16;

@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  if (child == null) return null;
  final BoxConstraints innerConstraints = constraints.deflate(
    const EdgeInsets.symmetric(horizontal: _paddingHorizontal, vertical: _paddingTop),
  );
  final double? childBaseline =
      child!.getDryBaseline(innerConstraints, baseline);
  if (childBaseline == null) return null;
  return childBaseline + _paddingTop;
}
```

```dart
@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  double yOffset = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    final Size childSize = child.getDryLayout(constraints);
    final double? childBaseline =
        child.getDryBaseline(constraints, baseline);
    if (childBaseline != null) {
      return yOffset + childBaseline;
    }
    yOffset += childSize.height;
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return null;
}
```

```dart
@override
double? computeDryBaseline(BoxConstraints constraints, TextBaseline baseline) {
  // Find the maximum baseline distance among all children.
  double maxBaseline = 0;
  bool anyBaseline = false;
  RenderBox? child = firstChild;
  while (child != null) {
    final double? childBaseline =
        child.getDryBaseline(constraints.loosen(), baseline);
    if (childBaseline != null) {
      if (childBaseline > maxBaseline) maxBaseline = childBaseline;
      anyBaseline = true;
    }
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return anyBaseline ? maxBaseline : null;
}
```

Dry and actual must agree ("same exact value"): the fixed dry example returns `14` for every baseline type, the fixed actual one only for `alphabetic`. `RenderBox.debugPaint` verifies dry baselines when `debugCheckIntrinsicSizes` is on.

## Intrinsic sizes

- [renderobjects](https://renderobjects.com/api/layout/computeMinMaxIntrinsicWidthHeight/): the intrinsic methods "answer hypothetical sizing questions without performing a real layout pass. They are called by `IntrinsicWidth`, `IntrinsicHeight`, and `Table`". `computeMinIntrinsicWidth(height)` is the "smallest width that avoids clipping content"; `computeMaxIntrinsicWidth(height)` the "width beyond which extra space adds no value" (official: "the smallest width beyond which increasing the width never decreases the preferred height"); heights likewise for a given width.
- Official signatures: `computeMinIntrinsicWidth(double height)`, `computeMaxIntrinsicWidth(double height)`, `computeMinIntrinsicHeight(double width)`, `computeMaxIntrinsicHeight(double width)` (https://api.flutter.dev/flutter/rendering/RenderBox/computeMaxIntrinsicHeight.html). The layout guide lists `computeMaxIntrinsicHeight(double height)`, a typo.
- "For most render objects, min and max intrinsic width are equal. They differ when content can reflow: a paragraph of text has a narrow min intrinsic width (the longest unbreakable word) and a wide max intrinsic width (the full text unwrapped on one line)." [renderobjects](https://renderobjects.com/api/layout/computeMinMaxIntrinsicWidthHeight/)
- Intrinsics are expensive ("often requires laying out children speculatively") and "Flutter loudly discourages overusing it". If nothing calls them you may skip them. If you implement them, the answers must match what `performLayout` actually produces: "Lying here causes layout glitches that are nearly impossible to track down." [renderobjects](https://renderobjects.com/guides/layout/) The app-level advice to avoid intrinsic passes is in [flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md).
- Never call `child.layout(...)` inside an intrinsic method: "Laying out a child during intrinsic measurement corrupts its layout state." Call the public `child.getMinIntrinsicWidth()` and friends, not the `@protected` `compute*` variants. [renderobjects](https://renderobjects.com/guides/layout/)
- Default: "All four methods return `0` by default. This is acceptable for render objects that only ever live inside a scrollable viewport. To ensure that your render object is robust across many use-cases, you should implement all 4 methods." Official: `computeMinIntrinsicWidth` returns `0.0`. [renderobjects](https://renderobjects.com/api/layout/computeMinMaxIntrinsicWidthHeight/)

Leaf with a fixed size, passthrough and padding (`math` is `import 'dart:math' as math;`):

```dart
static const double _width = 48;
static const double _height = 48;

@override
double computeMinIntrinsicWidth(double height) => _width;

@override
double computeMaxIntrinsicWidth(double height) => _width;

@override
double computeMinIntrinsicHeight(double width) => _height;

@override
double computeMaxIntrinsicHeight(double width) => _height;
```

```dart
@override
double computeMinIntrinsicWidth(double height) =>
    child!.getMinIntrinsicWidth(height);

@override
double computeMaxIntrinsicWidth(double height) =>
    child!.getMaxIntrinsicWidth(height);

@override
double computeMinIntrinsicHeight(double width) =>
    child!.getMinIntrinsicHeight(width);

@override
double computeMaxIntrinsicHeight(double width) =>
    child!.getMaxIntrinsicHeight(width);
```

```dart
static const double _horizontal = 32; // left + right padding
static const double _vertical = 24;   // top + bottom padding

@override
double computeMinIntrinsicWidth(double height) =>
    child!.getMinIntrinsicWidth(math.max(0, height - _vertical)) + _horizontal;

@override
double computeMaxIntrinsicWidth(double height) =>
    child!.getMaxIntrinsicWidth(math.max(0, height - _vertical)) + _horizontal;

@override
double computeMinIntrinsicHeight(double width) =>
    child!.getMinIntrinsicHeight(math.max(0, width - _horizontal)) + _vertical;

@override
double computeMaxIntrinsicHeight(double width) =>
    child!.getMaxIntrinsicHeight(math.max(0, width - _horizontal)) + _vertical;
```

Column: "Width is the maximum across all children. Height is the sum of all children's heights."

```dart
@override
double computeMinIntrinsicWidth(double height) {
  double maxWidth = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    maxWidth = math.max(maxWidth, child.getMinIntrinsicWidth(double.infinity));
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return maxWidth;
}

@override
double computeMaxIntrinsicWidth(double height) {
  double maxWidth = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    maxWidth = math.max(maxWidth, child.getMaxIntrinsicWidth(double.infinity));
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return maxWidth;
}

@override
double computeMinIntrinsicHeight(double width) {
  double totalHeight = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    totalHeight += child.getMinIntrinsicHeight(width);
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return totalHeight;
}

@override
double computeMaxIntrinsicHeight(double width) {
  double totalHeight = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    totalHeight += child.getMaxIntrinsicHeight(width);
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return totalHeight;
}
```

Row: "Width is the sum across all children. Height is the maximum across all children."

```dart
@override
double computeMinIntrinsicWidth(double height) {
  double totalWidth = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    totalWidth += child.getMinIntrinsicWidth(height);
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return totalWidth;
}

@override
double computeMaxIntrinsicWidth(double height) {
  double totalWidth = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    totalWidth += child.getMaxIntrinsicWidth(height);
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return totalWidth;
}

@override
double computeMinIntrinsicHeight(double width) {
  double maxHeight = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    maxHeight = math.max(maxHeight, child.getMinIntrinsicHeight(double.infinity));
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return maxHeight;
}

@override
double computeMaxIntrinsicHeight(double width) {
  double maxHeight = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    maxHeight = math.max(maxHeight, child.getMaxIntrinsicHeight(double.infinity));
    child = (child.parentData! as ContainerBoxParentData<RenderBox>).nextSibling;
  }
  return maxHeight;
}
```

## Text direction

- [renderobjects](https://renderobjects.com/guides/layout/): text direction matters only for start/end layouts; purely geometric layouts can ignore it. Render objects don't read `BuildContext`, so the widget reads `Directionality.of(context)` and pushes it down in both `createRenderObject` and `updateRenderObject`. `Directionality.of(context)` registers the dependency, so a direction change rebuilds the widget and runs `updateRenderObject`. "there's no automatic mirroring, your render object owns this entirely."

```dart
class MyDirectionalWidget extends SingleChildRenderObjectWidget {
  const MyDirectionalWidget({super.key, super.child});

  @override
  MyRenderObject createRenderObject(BuildContext context) {
    return MyRenderObject(textDirection: Directionality.of(context));
  }

  @override
  void updateRenderObject(BuildContext context, MyRenderObject renderObject) {
    renderObject.textDirection = Directionality.of(context);
  }
}
```

```dart
TextDirection _textDirection;
TextDirection get textDirection => _textDirection;
set textDirection(TextDirection value) {
  if (_textDirection == value) return;
  _textDirection = value;
  markNeedsLayout();
}
```

## Building during layout

- [renderobjects](https://renderobjects.com/api/layout/performLayout/): a LayoutBuilder-style render object runs a build from layout. "Calling `setState` or `markNeedsBuild` directly during layout is illegal and will throw."
- Official form: the mixin is `RenderObjectWithLayoutCallbackMixin`, used by `LayoutBuilder` and `SliverLayoutBuilder`. Override `layoutCallback()`, call `runLayoutCallback()` in `performLayout` "typically as early as possible before any layout work is done", and call `scheduleLayoutCallback()` when the callback changes (https://api.flutter.dev/flutter/rendering/RenderObjectWithLayoutCallbackMixin-mixin.html). Underneath, `invokeLayoutCallback<T extends Constraints>(LayoutCallback<T> callback)` is a `@protected` method on `RenderObject`; "Calling this function disables a number of assertions that are intended to catch likely bugs. As such, using this function is generally discouraged. This function can only be called during layout." (https://api.flutter.dev/flutter/rendering/RenderObject/invokeLayoutCallback.html)
- renderobjects.com names a `LayoutCallbackMixin`, which does not exist, and resets the callback with `markNeedsLayout()` instead of `scheduleLayoutCallback()`.
- Layout-time children for a list model (a builder plus a count) are in [CHILD-MODELS.md](CHILD-MODELS.md#virtualized-children).

## Performance

- [renderobjects](https://renderobjects.com/guides/layout/): don't allocate inside `performLayout`; lay each child out at most once per pass (two passes are legal but expensive, so be deliberate, as with baseline-aligned rows); don't read `child.size` before `child.layout(...)` ("stale ... and the framework will assert").

## Prove it

- Every `child.layout(...)` whose `child.size` is read afterwards passes `parentUsesSize: true`.
- Every path through `performLayout` (or `computeDryLayout` with `sizedByParent`) sets a size derived from the constraints.
- Every layout-affecting setter has the equality early return and calls `markNeedsLayout()`.
- No sibling walk casts to plain `BoxParentData`; `nextSibling` comes from `ContainerBoxParentData<RenderBox>` or your subclass of it.
- No `sizedByParent` box overrides `performResize` without a matching `computeDryLayout`.
- Wrapping the widget in `IntrinsicHeight` and in a `Row` with `CrossAxisAlignment.baseline` throws no dry-layout assertion in debug, and with `debugCheckIntrinsicSizes` on, debug paint reports no dry-baseline mismatch.
- No intrinsic or dry method calls `child.layout` or a child's `compute*`, and `computeDistanceToActualBaseline` never calls `getDistanceToBaseline`.
- Under RTL `Directionality`, a start-aligned layout mirrors.
