# Parent data

Per-child storage that a parent render object keeps on each child: what it is for, when to subclass it and which base class to extend, `setupParentData`, and writing it from the widget tree with a `ParentDataWidget`. Sources: the renderobjects.com parent-data and list-of-children guides, the layout guide and the `setupParentData` API page by Matt Carroll, checked against api.flutter.dev. Where the site's code contradicts the API docs, the official form is given and a one-line note says what renderobjects.com has. Reading parent data during layout is in [LAYOUT.md](LAYOUT.md#positioning-children); the child models that use it are in [CHILD-MODELS.md](CHILD-MODELS.md).

**Contents:** [What parent data is](#what-parent-data-is) · [When you need a subclass](#when-you-need-a-subclass) · [Choosing the base class](#choosing-the-base-class) · [setupParentData](#setupparentdata) · [Parent data for a list](#parent-data-for-a-list) · [ParentDataWidget](#parentdatawidget) · [A flex layout reading parent data](#a-flex-layout-reading-parent-data) · [Parent data written by layout](#parent-data-written-by-layout) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## What parent data is

- [renderobjects](https://renderobjects.com/guides/children/parent-data/): "Parent data is per-child storage that lives on each child render object but is owned and managed by the parent." `BoxParentData.offset` is the canonical use, read in paint: `context.paintChild(child, offset + childParentData.offset)`.
- "Parent data is written by the parent during `performLayout()` and read back during `paint()` and `hitTest()`. The child render object never reads or writes its own parent data." [renderobjects](https://renderobjects.com/api/layout/setupParentData/)
- Ownership: the parent owns the data (chooses the type, reads it, writes `offset`). The framework installs it (`adoptChild` calls `setupParentData`) and `dropChild` clears it. `ParentDataWidget`s populate it through `applyParentData`. "Children never read their own parent data." A reparented child gets fresh parent data. [renderobjects](https://renderobjects.com/guides/children/parent-data/) Official: `dropChild` calls `child.parentData!.detach();` and then `child.parentData = null;` (https://api.flutter.dev/flutter/rendering/RenderObject/dropChild.html).

## When you need a subclass

- [renderobjects](https://renderobjects.com/guides/children/parent-data/): you need one when the widget tree assigns per-child layout info (anything set through a `ParentDataWidget` like `Flexible`, `Expanded`, `Positioned`, `LayoutId`), or when the parent must remember per-child computed state between passes (a baseline offset, a measured intrinsic size, a cached calculation).
- You don't when you need only the offset, or when the state is derivable from the child itself or its list position. "If you're not sure, start without a custom subclass." [renderobjects](https://renderobjects.com/guides/children/parent-data/)
- Fields it can carry: an index, a flex factor, an alignment and so on. [renderobjects](https://renderobjects.com/guides/layout/)

## Choosing the base class

- **With the container mixins, extend `ContainerBoxParentData<RenderBox>`; without them, extend `BoxParentData`.** Official bounds: `ContainerRenderObjectMixin` requires `ParentDataType extends ContainerParentDataMixin<ChildType>` (https://api.flutter.dev/flutter/rendering/ContainerRenderObjectMixin-mixin.html) and `RenderBoxContainerDefaultsMixin` requires `ParentDataType extends ContainerBoxParentData<ChildType>` (https://api.flutter.dev/flutter/rendering/RenderBoxContainerDefaultsMixin-mixin.html). `BoxParentData` satisfies neither.
- The parent-data guide says "Subclass `BoxParentData`, not `ParentData` directly" and pairs `GridParentData extends BoxParentData` with both container mixins, which fails those bounds; its pitfall "If you use `ContainerRenderObjectMixin<RenderBox, BoxParentData>` (the default)" has the same problem. The site's list and virtualized guides extend `ContainerBoxParentData<RenderBox>`, and its custom-model grid (no mixins) extends `BoxParentData`, both of which are right. [renderobjects](https://renderobjects.com/guides/children/parent-data/)
- A `RenderBox` that only needs offsets needs no override at all: `RenderBox.setupParentData` already installs `BoxParentData` (https://api.flutter.dev/flutter/rendering/RenderObject/setupParentData.html). renderobjects.com describes only `RenderObject`'s default, a plain `ParentData`, and calls it "rarely sufficient". [renderobjects](https://renderobjects.com/api/layout/setupParentData/)

The guide's grid parent data in the official form (base class changed from `BoxParentData`):

```dart
class GridParentData extends ContainerBoxParentData<RenderBox> {
  int row = 0;
  int column = 0;
  int rowSpan = 1;
  int columnSpan = 1;
}

class RenderCustomGrid extends RenderBox
    with ContainerRenderObjectMixin<RenderBox, GridParentData>,
         RenderBoxContainerDefaultsMixin<RenderBox, GridParentData> {

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! GridParentData) {
      child.parentData = GridParentData();
    }
  }
}
```

## setupParentData

- [renderobjects](https://renderobjects.com/api/layout/setupParentData/): called "whenever a child render object is attached to a parent. Its job is to attach a `ParentData` object to the child ... that the parent owns and uses to store per-child layout information such as position offsets, flex factors, or grid coordinates." It is "the only sanctioned place to initialize parent data" ([renderobjects](https://renderobjects.com/guides/layout/)). Official signature: `void setupParentData(covariant RenderObject child)`.
- It is called once per child by `adoptChild`. The `is!` check reuses a matching instance (a child moved from a parent that used the same type) and keeps values a `ParentDataWidget` wrote in the same frame; "A child might already have been given richer parent data by a subclass, and overwriting it would destroy that information." [renderobjects](https://renderobjects.com/guides/children/parent-data/) Official: `dropChild` sets the child's `parentData` to null (see [What parent data is](#what-parent-data-is)), so a child arriving from another parent has no instance to reuse.

```dart
@override
void setupParentData(RenderBox child) {
  if (child.parentData is! MyParentData) {
    child.parentData = MyParentData();
  }
}
```

- Leaf render objects: "`setupParentData()` is never called. No override is needed." [renderobjects](https://renderobjects.com/api/layout/setupParentData/)
- "The `setupParentData()` method is only responsible for instantiating the parent data, not to configure it. Parent data is configured during layout." [renderobjects](https://renderobjects.com/api/layout/setupParentData/)

```dart
@override
void performLayout() {
  child!.layout(constraints, parentUsesSize: true);

  // 1. Get a reference to the parent data (which was initialized in `setupParentData`), which is
  //    attached to this child.
  final BoxParentData childParentData = child!.parentData! as BoxParentData;
  // 2. Configure the parent data that's attached to this child.
  childParentData.offset = Offset(16, 16);

  size = constraints.biggest;
}
```

## Parent data for a list

- [renderobjects](https://renderobjects.com/guides/children/list-of-children/): list parent data carries linked-list pointers (`previousSibling`/`nextSibling` from `ContainerParentDataMixin`) plus per-child layout state. Row and Column need only `ContainerBoxParentData<RenderBox>`. Two subclasses:

```dart
class MyStackParentData extends ContainerBoxParentData<RenderBox> {
  double? top;
  double? right;
  double? bottom;
  double? left;
  double? width;
  double? height;
}
```

```dart
class MyFlexParentData extends ContainerBoxParentData<RenderBox> {
  int flex = 0;
  FlexFit fit = FlexFit.loose;
}
```

- Framework pairs: `Positioned` writes `StackParentData`, `Expanded`/`Flexible` write `FlexParentData`, `LayoutId` writes `MultiChildLayoutParentData`. [renderobjects](https://renderobjects.com/guides/children/list-of-children/)

## ParentDataWidget

- [renderobjects](https://renderobjects.com/api/layout/setupParentData/): "`ParentDataWidget` calls `applyParentData()` on the child render object, writes the new value, then notifies the parent to re-run layout."
- Mark the *parent* dirty, and only when something changed, which "avoids ... cascading dirty marks on every rebuild". Use `renderObject.parent?.markNeedsLayout()`, not `renderObject.markNeedsLayout()`. [renderobjects](https://renderobjects.com/guides/children/parent-data/)
- Official (https://api.flutter.dev/flutter/widgets/ParentDataWidget/applyParentData.html): if `applyParentData` changes data that affects the parent's layout or painting, it is "responsible for calling RenderObject.markNeedsLayout or RenderObject.markNeedsPaint on the parent". So a paint-only field calls `markNeedsPaint` on the parent, a case the guides do not mention. `renderObject.parent` is typed `RenderObject?` (https://api.flutter.dev/flutter/rendering/RenderObject/parent.html), so `renderObject.parent?.markNeedsLayout()` compiles without a cast. The official `LayoutId` pattern:

```dart
@override
void applyParentData(RenderObject renderObject) {
  assert(renderObject.parentData is MultiChildLayoutParentData);
  final parentData = renderObject.parentData! as MultiChildLayoutParentData;
  if (parentData.id != id) {
    parentData.id = id;
    renderObject.parent?.markNeedsLayout();
  }
}
```

- `debugTypicalAncestorWidgetClass` names the expected ancestor. If a `GridCell` is put inside a `Column`, "the framework produces a helpful error pointing at the mismatch"; this is the "Incorrect use of ParentData widget" error in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md). [renderobjects](https://renderobjects.com/guides/children/parent-data/) Official: `ParentDataWidget` also has `debugTypicalAncestorWidgetDescription` and `debugIsValidRenderObject` (https://api.flutter.dev/flutter/widgets/ParentDataWidget-class.html).

A positioned child for the list-model stack ([renderobjects](https://renderobjects.com/guides/children/list-of-children/)), and its use:

```dart
class MyPositioned extends ParentDataWidget<MyStackParentData> {
  const MyPositioned({
    super.key,
    this.top,
    this.right,
    this.bottom,
    this.left,
    this.width,
    this.height,
    required super.child,
  });

  final double? top;
  final double? right;
  final double? bottom;
  final double? left;
  final double? width;
  final double? height;

  @override
  void applyParentData(RenderObject renderObject) {
    final parentData = renderObject.parentData! as MyStackParentData;
    bool needsLayout = false;
    if (parentData.top != top) { parentData.top = top; needsLayout = true; }
    if (parentData.right != right) { parentData.right = right; needsLayout = true; }
    if (parentData.bottom != bottom) { parentData.bottom = bottom; needsLayout = true; }
    if (parentData.left != left) { parentData.left = left; needsLayout = true; }
    if (parentData.width != width) { parentData.width = width; needsLayout = true; }
    if (parentData.height != height) { parentData.height = height; needsLayout = true; }

    if (needsLayout) {
      renderObject.parent?.markNeedsLayout();
    }
  }

  @override
  Type get debugTypicalAncestorWidgetClass => MyStack;
}
```

```dart
MyStack(
  children: [
    Container(color: Colors.red),
    MyPositioned(
      top: 20,
      left: 20,
      child: Text('Overlay'),
    ),
  ],
)
```

A grid cell writing the `GridParentData` above ([renderobjects](https://renderobjects.com/guides/children/parent-data/)):

```dart
class GridCell extends ParentDataWidget<GridParentData> {
  const GridCell({
    super.key,
    required this.row,
    required this.column,
    this.rowSpan = 1,
    this.columnSpan = 1,
    required super.child,
  });

  final int row;
  final int column;
  final int rowSpan;
  final int columnSpan;

  @override
  void applyParentData(RenderObject renderObject) {
    final parentData = renderObject.parentData! as GridParentData;
    bool needsLayout = false;
    if (parentData.row != row) { parentData.row = row; needsLayout = true; }
    if (parentData.column != column) { parentData.column = column; needsLayout = true; }
    if (parentData.rowSpan != rowSpan) { parentData.rowSpan = rowSpan; needsLayout = true; }
    if (parentData.columnSpan != columnSpan) { parentData.columnSpan = columnSpan; needsLayout = true; }

    if (needsLayout) {
      renderObject.parent?.markNeedsLayout();
    }
  }

  @override
  Type get debugTypicalAncestorWidgetClass => CustomGrid;
}
```

The `setupParentData` API page illustrates the mechanism with a home-made `Flexible`. Official facts it gets wrong: `Flexible.flex` and `FlexParentData.flex` are `int` (`final int flex;`, `int? flex;`, https://api.flutter.dev/flutter/widgets/Flexible/flex.html); `AbstractNode` is no longer in the framework, so the parent call is `renderObject.parent?.markNeedsLayout();`; the real `Flexible` also writes `fit`, marks layout once through a `needsLayout` flag, and has `debugTypicalAncestorWidgetClass => Flex`. renderobjects.com uses `double flex`, `flex: 1.0` and `final AbstractNode? targetParent = renderObject.parent;`.

## A flex layout reading parent data

The same page's reading side, in the official form (`flex` is `int?`, so the two reads take `?? 0`; otherwise as the site wrote it) [renderobjects](https://renderobjects.com/api/layout/setupParentData/):

```dart
@override
void performLayout() {
  double totalFlex = 0;
  RenderBox? child = firstChild;
  while (child != null) {
    final FlexParentData pd = child.parentData! as FlexParentData;
    totalFlex += pd.flex ?? 0;
    child = pd.nextSibling;
  }

  final double spacePerFlex = constraints.maxWidth / totalFlex;
  double xOffset = 0;

  child = firstChild;
  while (child != null) {
    // Get a reference to the child's parent data, which was configured by the `Flexible` widget.
    final FlexParentData pd = child.parentData! as FlexParentData;

    // Pull out the flex factor from the `FlexParentData` attached to the child.
    final double childWidth = spacePerFlex * (pd.flex ?? 0);

    child.layout(
      BoxConstraints.tightFor(width: childWidth, height: constraints.maxHeight),
      parentUsesSize: true,
    );
    pd.offset = Offset(xOffset, 0);
    xOffset += childWidth;
    child = pd.nextSibling;
  }
  size = constraints.biggest;
}
```

## Parent data written by layout

Per-child computed state, a wrap layout's line index: "extend `ContainerBoxParentData` with additional fields." [renderobjects](https://renderobjects.com/api/layout/setupParentData/)

```dart
class WrapParentData extends ContainerBoxParentData<RenderBox> {
  int lineIndex = 0;
}

class MyWrapRenderBox extends RenderBox
    with ContainerRenderObjectMixin<RenderBox, WrapParentData>,
         RenderBoxContainerDefaultsMixin<RenderBox, WrapParentData> {

  @override
  void setupParentData(RenderObject child) {
    if (child.parentData is! WrapParentData) {
      child.parentData = WrapParentData();
    }
  }

  @override
  void performLayout() {
    double x = 0;
    double y = 0;
    double lineHeight = 0;
    int currentLine = 0;

    RenderBox? child = firstChild;
    while (child != null) {
      final WrapParentData pd = child.parentData! as WrapParentData;
      child.layout(constraints.loosen(), parentUsesSize: true);

      if (x + child.size.width > constraints.maxWidth && x > 0) {
        y += lineHeight;
        x = 0;
        lineHeight = 0;
        currentLine++;
      }

      pd.offset = Offset(x, y);
      pd.lineIndex = currentLine; // Store the line index on every child's parent data

      x += child.size.width;
      if (child.size.height > lineHeight) lineHeight = child.size.height;
      child = pd.nextSibling;
    }

    size = Size(constraints.maxWidth, y + lineHeight);
  }
}
```

The final `size` is not passed through `constraints.constrain`, so under unbounded width it is infinite, which `RenderBox.debugAssertDoesMeetConstraints` rejects ("was given an infinite size during layout", https://api.flutter.dev/flutter/rendering/RenderBox/debugAssertDoesMeetConstraints.html); see [LAYOUT.md](LAYOUT.md#sizing-yourself).

## Pitfalls

From [renderobjects](https://renderobjects.com/guides/children/parent-data/) and [renderobjects](https://renderobjects.com/guides/children/list-of-children/):

- Leaving out the `is!` check in `setupParentData` discards values a `ParentDataWidget` just wrote.
- A parent data type that does not meet the mixin bound (see [Choosing the base class](#choosing-the-base-class)).
- Marking the child dirty instead of the parent in `applyParentData`.
- Storing state on parent data that is not per-child.
- Reading parent data on a detached child.

## Prove it

- Every `setupParentData` override has the `is!` guard and creates the type the parent casts to everywhere else.
- Every parent data class used with `ContainerRenderObjectMixin` extends `ContainerBoxParentData<RenderBox>`; `flutter analyze` reports no type-bound error.
- Every `applyParentData` compares before writing, marks `renderObject.parent` (never `renderObject`), and calls `markNeedsPaint` instead for paint-only fields.
- Every `ParentDataWidget` overrides `debugTypicalAncestorWidgetClass`; placing it under the wrong parent in a widget test produces the "Incorrect use of ParentDataWidget." error.
- No child render object reads `parentData` on itself.
