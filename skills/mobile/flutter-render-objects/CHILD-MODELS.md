# Child models

How a custom render object widget holds its children: how the element reconciles them, keys, and the five models (a single child, an ordered list, named slots, a custom structure with its own element, and children built during layout), each with its widget, element and render object code. Sources: the renderobjects.com "Children" guides by Matt Carroll, checked against api.flutter.dev. Where the site's code contradicts the API docs, the official form is given and a one-line note says what renderobjects.com has. Parent data classes and `ParentDataWidget` are in [PARENT-DATA.md](PARENT-DATA.md); GlobalKey reparenting from the element's side and element lookups are in [ELEMENTS.md](ELEMENTS.md).

**Contents:** [How the element reconciles children](#how-the-element-reconciles-children) · [Keys](#keys) · [Single child](#single-child) · [List of children](#list-of-children) · [Slotted children](#slotted-children) · [Custom child model](#custom-child-model) · [Virtualized children](#virtualized-children) · [Prove it](#prove-it)

## How the element reconciles children

- [renderobjects](https://renderobjects.com/guides/children/intro-to-children/): the framework generalizes reconciliation (`updateChild` for single positions, `updateChildren` for ordered lists). It cannot generalize which widget fields are children, how they match (single, list or named slots) or what each child means to the render object. A `Scaffold`-like widget with `appBar`, `body`, `floatingActionButton`, `bottomNavigationBar` and `drawer` reconciles each slot independently; a chart with separate `series` and `annotations` lists reconciles each list separately.
- The models differ only in "the in-memory data structure the element uses to hold its children and how the element maps that structure to the render tree." [renderobjects](https://renderobjects.com/guides/children/intro-to-children/)
- Four outcomes. Update in place: same runtime type and key, state kept. Replace: different type or key, state lost. Insert: new positions. Remove: old positions are deactivated and eventually unmounted. [renderobjects](https://renderobjects.com/guides/children/intro-to-children/)
- `Element? updateChild(Element? child, Widget? newWidget, Object? newSlot)`: both null gives null; old null and new non-null mounts the new one; old non-null and new null deactivates and returns null; both non-null updates when type and key match, otherwise replaces. This matches the table at https://api.flutter.dev/flutter/widgets/Element/updateChild.html. [renderobjects](https://renderobjects.com/guides/children/custom-child-model/)

Lifecycle sequences [renderobjects](https://renderobjects.com/guides/children/intro-to-children/):

- **Add:** the parent creates the child element, the child mounts (and creates its render object during mount), then the framework calls `insertRenderObjectChild` on the nearest render-object ancestor with the render object and the slot.
- **Update in place:** `updateChild(existing, newWidget)` checks type and key, the child updates its render object's properties, and no render-tree attachment changes.
- **Remove:** `updateChild(existing, null)` deactivates the child, then `removeRenderObjectChild` runs. At the end of the frame, a child that was not reactivated is unmounted and its render object disposed.
- **Reorder keyed:** the element is reused, then `moveRenderObjectChild` runs with the new slot.
- **Deactivation ("limbo"):** the framework's inactive-elements list holds the child until the end of the frame. Reactivated in the same frame, it rejoins and its render object is reattached, possibly to a new parent.
- **GlobalKey reparenting:** the framework finds the element by its global key. The old parent gets `forgetChild`: it removes the child from its bookkeeping but does *not* deactivate it. The render object is detached, the element moves, `insertRenderObjectChild` runs on the new ancestor, and then `update` gives it the new widget, all "atomically within a single frame".

## Keys

- [renderobjects](https://renderobjects.com/guides/children/list-of-children/): without keys children match by position, so an insert in the middle shifts every later child and "Stateful children at shifted positions lose their state"; "reordering looks to the framework like deletion and insertion at every shifted position". With keys, children match across positions and keep state, animation progress and scroll position. "A keyed child that moves from index 3 to index 1 is preserved as the same element." For a static set, keys "are optional but cost very little".
- `MultiChildRenderObjectElement` implements "the keyed-matching algorithm" for you ([renderobjects](https://renderobjects.com/guides/children/list-of-children/)); slots reconcile per slot, the custom grid loop matches by coordinate and virtualized children by index; see each model below.

## Single child

All from [renderobjects](https://renderobjects.com/guides/children/single-child/) unless noted.

- You need no custom element: `SingleChildRenderObjectWidget.createElement` returns `SingleChildRenderObjectElement`. Do not override `createElement`, and forward the child with `super.child`.
- `createRenderObject` is called once when the element first mounts. `updateRenderObject` runs on later rebuilds to forward non-child properties; child management is not its job.

```dart
class MyContainer extends SingleChildRenderObjectWidget {
  const MyContainer({super.key, super.child, this.padding = 0.0});

  final double padding;

  @override
  RenderMyContainer createRenderObject(BuildContext context) {
    return RenderMyContainer(padding: padding);
  }

  @override
  void updateRenderObject(BuildContext context, RenderMyContainer renderObject) {
    renderObject.padding = padding;
  }
}
```

```dart
class RenderMyContainer extends RenderBox
    with RenderObjectWithChildMixin<RenderBox> {
  RenderMyContainer({double padding = 0.0}) : _padding = padding;

  double _padding;
  double get padding => _padding;
  set padding(double value) {
    if (_padding == value) return;
    _padding = value;
    markNeedsLayout();
  }

  // Layout, paint, etc. go here. They use the inherited `child` getter.
}
```

- The mixin provides a `child` getter and setter (assigning adopts the new child and drops the old one; null drops it), `visitChildren`, `attach`/`detach` propagation and `redepthChildren`. The type parameter constrains the child (`RenderBox`, or `RenderSliver` for a sliver child). Official: `RenderObjectWithChildMixin<ChildType extends RenderObject>`, members `child`, `debugValidateChild`, `attach`, `detach`, `redepthChildren`, `visitChildren` (https://api.flutter.dev/flutter/rendering/RenderObjectWithChildMixin-mixin.html).
- The flow. On mount: `createElement`, mount, `createRenderObject`, `updateChild(null, widget.child, ...)`, then `insertRenderObjectChild` sets `renderObject.child`. On rebuild: `updateRenderObject`, then `updateChild(_child, widget.child, ...)`. `SingleChildRenderObjectElement` already implements `forgetChild`, so GlobalKey reparenting works.

Pitfalls:

- Redeclaring `child` shadows the base `final Widget? child` and "break[s] the framework's reconciliation". Forward with `super.child`.
- Not forwarding a property in `updateRenderObject` causes "the widget rebuilt with new values but the screen didn't update".
- `child` is null in the render object's constructor. Read it in layout, paint and hit testing.
- A wrong mixin type parameter fails when the child is adopted. Official: the check is `debugValidateChild`, a debug-mode check (https://api.flutter.dev/flutter/rendering/RenderObjectWithChildMixin-mixin.html). renderobjects.com says "The type is enforced at the moment the child is adopted, so a mismatch produces an immediate error" without saying it is debug only.
- Do not override `mount`, `update` or the insert and remove callbacks for a single child.

## List of children

All from [renderobjects](https://renderobjects.com/guides/children/list-of-children/) unless noted.

- Fits a flat `List<Widget> children` (Row, Column, Stack, Wrap, Flow, ListBody). Do not redeclare `children` and do not override `createElement` (it returns `MultiChildRenderObjectElement`).

```dart
class MyStack extends MultiChildRenderObjectWidget {
  const MyStack({
    super.key,
    super.children,
    this.alignment = Alignment.topLeft,
  });

  final Alignment alignment;

  @override
  RenderMyStack createRenderObject(BuildContext context) {
    return RenderMyStack(alignment: alignment);
  }

  @override
  void updateRenderObject(BuildContext context, RenderMyStack renderObject) {
    renderObject.alignment = alignment;
  }
}
```

- Parent data for lists does two jobs: linked-list pointers (`previousSibling`/`nextSibling` from `ContainerParentDataMixin`) and per-child layout state. Row and Column need only `ContainerBoxParentData<RenderBox>` (offset plus sibling pointers). This stack's `MyStackParentData` definition and its `MyPositioned` writer are in [PARENT-DATA.md](PARENT-DATA.md#parent-data-for-a-list). [renderobjects](https://renderobjects.com/guides/children/list-of-children/)

- `ContainerRenderObjectMixin<ChildType, ParentDataType>` provides `firstChild`, `lastChild`, `childCount`, `childBefore`, `childAfter`, `insert`, `move` and `remove`; `RenderBoxContainerDefaultsMixin` provides `defaultPaint`, `defaultHitTestChildren` and `defaultComputeDistanceToFirstActualBaseline`.
- Official bounds and extra members: `ContainerRenderObjectMixin<ChildType extends RenderObject, ParentDataType extends ContainerParentDataMixin<ChildType>>`, which also has `add`, `addAll`, `removeAll` and `debugValidateChild` (https://api.flutter.dev/flutter/rendering/ContainerRenderObjectMixin-mixin.html); `RenderBoxContainerDefaultsMixin<ChildType extends RenderBox, ParentDataType extends ContainerBoxParentData<ChildType>>`, which also provides `defaultComputeDistanceToHighestActualBaseline` and `getChildrenAsList()` (https://api.flutter.dev/flutter/rendering/RenderBoxContainerDefaultsMixin-mixin.html). `defaultHitTestChildren` walks the list backwards and `defaultPaint` forwards.

```dart
class RenderMyStack extends RenderBox
    with ContainerRenderObjectMixin<RenderBox, MyStackParentData>,
         RenderBoxContainerDefaultsMixin<RenderBox, MyStackParentData> {

  RenderMyStack({Alignment alignment = Alignment.topLeft})
      : _alignment = alignment;

  Alignment _alignment;
  Alignment get alignment => _alignment;
  set alignment(Alignment value) {
    if (_alignment == value) return;
    _alignment = value;
    markNeedsLayout();
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! MyStackParentData) {
      child.parentData = MyStackParentData();
    }
  }

  // Layout, paint, etc. go here. They iterate via firstChild + childAfter.
}
```

- List order is not visual order. The list sets reconciliation matching, linked-list order, "paint order (and therefore z-order in case of overlap), hit-test order, and the order of `visitChildren`". Placement can come from parent data (Stack plus Positioned). "The list is for identity and reconciliation; visual layout is up to your render object."
- The flow: the element calls `updateChildren`. Each child inserts with an `IndexedSlot`, and `insertRenderObjectChild` calls `renderObject.insert(child, after: ...)`. On rebuild, moved keyed children trigger `moveRenderObjectChild`, which calls `renderObject.move(child, after: ...)`; gone children trigger `removeRenderObjectChild`, which calls `renderObject.remove(child)`; new ones trigger `insertRenderObjectChild`. Official: `IndexedSlot<T extends Element?>(int index, T value)`, "A value for Element.slot used for children of MultiChildRenderObjectElements" (https://api.flutter.dev/flutter/widgets/IndexedSlot-class.html).

Pitfalls:

- Redeclaring `children`.
- Mismatched type parameters between the two mixins ("won't compile").
- Leaving out the `is!` check in `setupParentData` discards values a `ParentDataWidget` just wrote.
- Reorderable or filterable children without keys.
- Assuming list order is visual order.
- If the API cannot be reshaped as a flat list with parent data, it needs the [custom child model](#custom-child-model).

## Slotted children

All from [renderobjects](https://renderobjects.com/guides/children/slotted-children/) unless noted.

- Use slots when the children are a fixed set of distinct roles exposed as separate properties (`MyLayout(header:, body:, footer:)`), "fixed at compile time". This holds even when two slots hold the same type (a leading and a trailing icon). Interchangeable children use the list model.
- The slot identifier is conventionally an enum ("documents the fixed set of slots at the type level"); any value type works: `enum MySlot { header, body, footer }`.

```dart
class MyLayout extends SlottedMultiChildRenderObjectWidget<MySlot, RenderBox> {
  const MyLayout({
    super.key,
    this.header,
    this.body,
    this.footer,
    this.spacing = 0.0,
  });

  final Widget? header;
  final Widget? body;
  final Widget? footer;
  final double spacing;

  @override
  Iterable<MySlot> get slots => MySlot.values;

  @override
  Widget? childForSlot(MySlot slot) {
    switch (slot) {
      case MySlot.header:
        return header;
      case MySlot.body:
        return body;
      case MySlot.footer:
        return footer;
    }
  }

  @override
  RenderMyLayout createRenderObject(BuildContext context) {
    return RenderMyLayout(spacing: spacing);
  }

  @override
  void updateRenderObject(BuildContext context, RenderMyLayout renderObject) {
    renderObject.spacing = spacing;
  }
}
```

- Official (https://api.flutter.dev/flutter/widgets/SlottedMultiChildRenderObjectWidget-class.html): `SlottedMultiChildRenderObjectWidget<SlotType, ChildType extends RenderObject>` extends `RenderObjectWidget` with `SlottedMultiChildRenderObjectWidgetMixin<SlotType, ChildType>`; `createElement` returns `SlottedRenderObjectElement<SlotType, ChildType>`; the returned render object must implement `SlottedContainerRenderObjectMixin`.

```dart
class RenderMyLayout extends RenderBox
    with SlottedContainerRenderObjectMixin<MySlot, RenderBox> {
  RenderMyLayout({double spacing = 0.0}) : _spacing = spacing;

  double _spacing;
  double get spacing => _spacing;
  set spacing(double value) {
    if (_spacing == value) return;
    _spacing = value;
    markNeedsLayout();
  }

  // Convenience getters for cleaner layout/paint code.
  RenderBox? get header => childForSlot(MySlot.header);
  RenderBox? get body => childForSlot(MySlot.body);
  RenderBox? get footer => childForSlot(MySlot.footer);
}
```

- Official (https://api.flutter.dev/flutter/widgets/SlottedContainerRenderObjectMixin-mixin.html): the mixin's `children` getter "Returns an Iterable of all non-null children", and "Implementers may consider overriding children to return the children of this render object in a consistent order" (for example for hit-test order), and "The base implementation makes no guarantee about the order in which the children are returned"; that getter drives the default `visitChildren`. `childForSlot` is `@protected` (https://api.flutter.dev/flutter/widgets/SlottedContainerRenderObjectMixin/childForSlot.html), so public getters like the ones above are the way to expose slots. renderobjects.com says the default `visitChildren` "visits every slot's child in slot-enum order".
- Each slot is reconciled independently with `updateChild`, "with no cross-slot interactions". A stateful widget in one slot keeps its state while that slot's widget stays compatible. `moveRenderObjectChild` "is essentially never triggered for slotted setups".

Pitfalls:

- Switch over the enum with no `default`, so a missing slot shows up at analysis time.
- A widget instance may be used at multiple tree locations; each placement inflates its own element. [Widget](https://api.flutter.dev/flutter/widgets/Widget-class.html). P2 correction: renderobjects.com says the same widget returned from two slots is mounted twice and fails; widget-instance reuse itself is permitted, as distinguished from element identity in [The three trees](SKILL.md#the-three-trees).
- Slot enum order does not set paint or layout order.
- Slots cannot be added at runtime. Always declare the slot and return `null` when it is empty.
- Layout must handle any slot being null.
- Do not read children in the constructor.
- `slots` must be "stable and complete". Never filter it by which slots have a child.

## Custom child model

All from [renderobjects](https://renderobjects.com/guides/children/custom-child-model/) unless noted.

- Fits `List<List<Widget>>`, `Map<GridCoord, Widget>`, a domain structure (a calendar `MonthData`) or mixed models (a `header` plus a `List<Widget>`): a custom `RenderObjectWidget` plus a custom `RenderObjectElement`.

The running example:

```dart
MyGrid(
  children: GridChildren()
    ..set(row: 0, column: 0, child: Text('Top-left'))
    ..set(row: 0, column: 2, child: Text('Top-right'))
    ..set(row: 1, column: 1, child: Text('Center')),
)
```

The children structure needs value equality on its keys, enumeration and lookup (`GridChildren` is marked `@immutable` but has a mutable `set` and map, as the site wrote it):

```dart
@immutable
class GridChildren {
  GridChildren();

  final Map<GridCoord, Widget> _children = <GridCoord, Widget>{};

  void set({required int row, required int column, required Widget child}) {
    _children[GridCoord(row, column)] = child;
  }

  Widget? childAt(GridCoord coord) => _children[coord];

  Iterable<GridCoord> get coords => _children.keys;
}

@immutable
class GridCoord {
  const GridCoord(this.row, this.column);
  final int row;
  final int column;

  @override
  bool operator ==(Object other) =>
      other is GridCoord && other.row == row && other.column == column;

  @override
  int get hashCode => Object.hash(row, column);
}
```

The widget extends `RenderObjectWidget` directly and overrides `createElement`:

```dart
class MyGrid extends RenderObjectWidget {
  const MyGrid({super.key, required this.children, this.gap = 0.0});

  final GridChildren children;
  final double gap;

  @override
  MyGridElement createElement() => MyGridElement(this);

  @override
  RenderMyGrid createRenderObject(BuildContext context) {
    return RenderMyGrid(gap: gap);
  }

  @override
  void updateRenderObject(BuildContext context, RenderMyGrid renderObject) {
    renderObject.gap = gap;
  }
}
```

The element stores elements (not widgets) by coordinate, plus the set of forgotten children:

```dart
class MyGridElement extends RenderObjectElement {
  MyGridElement(MyGrid super.widget);

  final Map<GridCoord, Element> _children = <GridCoord, Element>{};
  final Set<Element> _forgottenChildren = <Element>{};

  @override
  MyGrid get widget => super.widget as MyGrid;

  @override
  RenderMyGrid get renderObject => super.renderObject as RenderMyGrid;

  // Mount, update, visitChildren, forgetChild, and render-tree bridge methods
  // follow below.
}
```

Call `updateChild` once per coordinate; "The coordinate is the slot":

```dart
_children[coord] = updateChild(_children[coord], widget.children.childAt(coord), coord)!;
```

```dart
@override
void mount(Element? parent, Object? newSlot) {
  super.mount(parent, newSlot);
  for (final coord in widget.children.coords) {
    final childWidget = widget.children.childAt(coord);
    _children[coord] = updateChild(null, childWidget, coord)!;
  }
}
```

```dart
@override
void update(MyGrid newWidget) {
  super.update(newWidget);

  final newCoords = widget.children.coords.toSet();
  final oldCoords = _children.keys.toSet();

  // Update or insert: every coord in the new structure gets an updateChild call.
  for (final coord in newCoords) {
    final newChildWidget = widget.children.childAt(coord);
    _children[coord] = updateChild(_children[coord], newChildWidget, coord)!;
  }

  // Remove: every coord that was in the old structure but isn't anymore.
  for (final coord in oldCoords.difference(newCoords)) {
    if (!_forgottenChildren.contains(_children[coord])) {
      updateChild(_children[coord], null, coord);
    }
    _children.remove(coord);
  }

  _forgottenChildren.clear();
}
```

- This loop matches only by coordinate. Cross-coordinate key matching has to be written by hand ("For most structured-children widgets this is unnecessary"). Official (https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html): "Where possible, the update method should attempt to map the elements from the last pass to the widgets in the new pass", and `updateChild` should be called for children "in their logical order". A slot is "an identifier whose meaning is private to this RenderObjectElement node", set by `updateChild` and changed with `updateSlotForChild`.

The render object, without `ContainerRenderObjectMixin`:

```dart
class MyGridParentData extends BoxParentData {
  GridCoord? coord;
}

class RenderMyGrid extends RenderBox {
  RenderMyGrid({double gap = 0.0}) : _gap = gap;

  double _gap;
  double get gap => _gap;
  set gap(double value) {
    if (_gap == value) return;
    _gap = value;
    markNeedsLayout();
  }

  final Map<GridCoord, RenderBox> _children = <GridCoord, RenderBox>{};

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! MyGridParentData) {
      child.parentData = MyGridParentData();
    }
  }

  void insertChild(RenderBox child, GridCoord coord) {
    assert(!_children.containsKey(coord), 'a child already exists at $coord');
    _children[coord] = child;
    (child.parentData as MyGridParentData).coord = coord;
    adoptChild(child);
  }

  void moveChild(RenderBox child, GridCoord oldCoord, GridCoord newCoord) {
    assert(_children[oldCoord] == child);
    assert(!_children.containsKey(newCoord));
    _children.remove(oldCoord);
    _children[newCoord] = child;
    (child.parentData as MyGridParentData).coord = newCoord;
    // Adoption doesn't change; the child is already adopted.
    markNeedsLayout();
  }

  void removeChild(RenderBox child, GridCoord coord) {
    assert(_children[coord] == child);
    _children.remove(coord);
    dropChild(child);
  }

  RenderBox? childAt(GridCoord coord) => _children[coord];

  @override
  void attach(PipelineOwner owner) {
    super.attach(owner);
    for (final child in _children.values) {
      child.attach(owner);
    }
  }

  @override
  void detach() {
    super.detach();
    for (final child in _children.values) {
      child.detach();
    }
  }

  @override
  void redepthChildren() {
    for (final child in _children.values) {
      redepthChild(child);
    }
  }

  @override
  void visitChildren(RenderObjectVisitor visitor) {
    for (final child in _children.values) {
      visitor(child);
    }
  }

  // Layout, paint, hit-test, etc., go here. They walk _children by coordinate.
}
```

- Fix to the site's `insertChild` order: official `RenderObject.adoptChild` is what calls `setupParentData(child)` (https://api.flutter.dev/flutter/rendering/RenderObject/adoptChild.html), so on a fresh child the cast before it finds no `MyGridParentData`. Call `adoptChild(child)` first, then write `coord`.
- `redepthChildren` matches the official rule: "Override this method in subclasses with child nodes to call [redepthChild] for each child" (https://api.flutter.dev/flutter/rendering/RenderObject/redepthChildren.html).

The render-tree bridge narrows the types with `covariant`. The base signatures are already covariant (`insertRenderObjectChild(covariant RenderObject child, covariant Object? slot)` and likewise for move and remove, https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html), so this is legal:

```dart
@override
void insertRenderObjectChild(covariant RenderBox child, GridCoord slot) {
  renderObject.insertChild(child, slot);
}

@override
void moveRenderObjectChild(covariant RenderBox child, GridCoord oldSlot, GridCoord newSlot) {
  renderObject.moveChild(child, oldSlot, newSlot);
}

@override
void removeRenderObjectChild(covariant RenderBox child, GridCoord slot) {
  renderObject.removeChild(child, slot);
}
```

Skip forgotten children in visits and clear the set after each `update`:

```dart
@override
void visitChildren(ElementVisitor visitor) {
  for (final child in _children.values) {
    if (!_forgottenChildren.contains(child)) {
      visitor(child);
    }
  }
}
```

```dart
@override
void forgetChild(Element child) {
  assert(_children.containsValue(child));
  _forgottenChildren.add(child);
  super.forgetChild(child);
}
```

Official (https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html): a subclass's `forgetChild` "must remove the child element from its child list"; with many elements, track forgotten ones in a `Set`, as `MultiChildRenderObjectElement` does.

Pitfalls:

- Without the mixin you must call `adoptChild`/`dropChild` ("sets the child's parent pointer, calls `setupParentData`, propagates attach state, and handles depth").
- Override `attach`, `detach` and `redepthChildren`.
- Skip forgotten children in `visitChildren`, or it "destroys the state that `GlobalKey` reparenting is meant to preserve".
- Coordinate matching is not key matching.
- Store elements, not widgets.
- The slot type in the `covariant` overrides must match the slot passed to `updateChild`.
- Clear `_forgottenChildren` once per update.
- Do not use `ContainerRenderObjectMixin` for coordinate-identified children.

## Virtualized children

All from [renderobjects](https://renderobjects.com/guides/children/virtualized-children/) unless noted.

- Virtualization means the widget receives "an instruction for producing children on demand" (a builder and a count). No children exist at build time; layout materializes them. Standard elements reconcile "during the build phase", which is the wrong time here. The framework's reference implementation is `SliverMultiBoxAdaptorWidget` / `SliverMultiBoxAdaptorElement`.
- The framework cannot generalize virtualization: "A list virtualizes by visible range; a grid virtualizes by visible rectangle; a virtualized graph might virtualize by viewport-intersecting nodes."
- Lifecycle inversion: a rebuild does no reconciliation; `performLayout` computes the visible indices and asks the element to materialize new ones and release gone ones. "The render object is the driver ... The element is the responder."

The widget, official form (the framework's `NullableIndexedWidgetBuilder`, "similar but may return null", https://api.flutter.dev/flutter/widgets/IndexedWidgetBuilder.html):

```dart
class MyVirtualList extends RenderObjectWidget {
  const MyVirtualList({
    super.key,
    required this.itemBuilder,
    required this.itemCount,
    this.itemExtent = 50.0,
  });

  final NullableIndexedWidgetBuilder itemBuilder;
  final int itemCount;
  final double itemExtent;

  @override
  MyVirtualListElement createElement() => MyVirtualListElement(this);

  @override
  RenderMyVirtualList createRenderObject(BuildContext context) {
    return RenderMyVirtualList(itemExtent: itemExtent);
  }

  @override
  void updateRenderObject(BuildContext context, RenderMyVirtualList renderObject) {
    renderObject.itemExtent = itemExtent;
  }
}
```

renderobjects.com declares its own `typedef IndexedWidgetBuilder = Widget? Function(BuildContext context, int index);`, which has the framework's name (whose return is non-nullable) and shadows it.

- `itemBuilder` returning `null` means "no widget at this index". `itemCount` is the total logical count, needed for scroll extent and bounds.

Element storage: a `SplayTreeMap` keeps indices sorted, only materialized children are stored, and the index is the slot:

```dart
class MyVirtualListElement extends RenderObjectElement {
  MyVirtualListElement(MyVirtualList super.widget);

  final SplayTreeMap<int, Element> _children = SplayTreeMap<int, Element>();
  final Set<Element> _forgottenChildren = <Element>{};

  @override
  MyVirtualList get widget => super.widget as MyVirtualList;

  @override
  RenderMyVirtualList get renderObject => super.renderObject as RenderMyVirtualList;
  // ...
}
```

`createChild` and `removeChild` build inside `buildScope` with a re-entrancy guard:

```dart
void createChild(int index, {required RenderBox? after}) {
  assert(_currentlyUpdatingChildIndex == null);
  owner!.buildScope(this, () {
    _currentlyUpdatingChildIndex = index;
    try {
      final Widget? newWidget = widget.itemBuilder(this, index);
      final Element? newChild = updateChild(
        _children[index],
        newWidget,
        _IndexedSlot(index, after),
      );
      if (newChild != null) {
        _children[index] = newChild;
      } else {
        _children.remove(index);
      }
    } finally {
      _currentlyUpdatingChildIndex = null;
    }
  });
}

int? _currentlyUpdatingChildIndex;
```

```dart
void removeChild(RenderBox child) {
  final int index = renderObject._indexOf(child);
  assert(_currentlyUpdatingChildIndex == null);
  owner!.buildScope(this, () {
    _currentlyUpdatingChildIndex = index;
    try {
      updateChild(_children[index], null, null);
      _children.remove(index);
    } finally {
      _currentlyUpdatingChildIndex = null;
    }
  });
}
```

- Official: `SliverMultiBoxAdaptorElement.createChild(int index, {required RenderBox? after})` is "Called during layout when a new child is needed ... inserted ... after the `after` child (at the start of the list if `after` is null)"; it implements `RenderSliverBoxChildManager` (https://api.flutter.dev/flutter/widgets/SliverMultiBoxAdaptorElement-class.html). `BuildOwner.buildScope(Element context, [VoidCallback? callback])` "Establishes a scope for updating the widget tree", then "builds all the elements that were marked as dirty ... in depth order", and "Only one buildScope can be active at a time" (https://api.flutter.dev/flutter/widgets/BuildOwner/buildScope.html).
- **Layout-time child mutation needs both calls.** Official (RenderObjectElement, "Dynamically determining the children during layout", https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html): layout-time children require `RenderObject.invokeLayoutCallback` and `BuildOwner.buildScope`. `invokeLayoutCallback<T extends Constraints>(LayoutCallback<T> callback)` "Allows mutations to be made to this object's child list (and any descendants)", can only be called during layout, "disables a number of assertions", and "using this function is generally discouraged" (https://api.flutter.dev/flutter/rendering/RenderObject/invokeLayoutCallback.html). So the render object's `performLayout` wraps its calls to `_element.createChild(...)` and `_element.removeChild(...)` in `invokeLayoutCallback<BoxConstraints>((BoxConstraints _) { ... })`. renderobjects.com says `buildScope` alone "is what makes mid-layout child building safe" and that the render object "can simply call `createChild` and `removeChild`", and never mentions `invokeLayoutCallback`.

The render object side. It holds a back-reference to the element (set in `mount`, cleared in `unmount`); children still live in the mixin's linked list, and the index lives in parent data:

```dart
class MyVirtualListParentData extends ContainerBoxParentData<RenderBox> {
  int? index;
}

class RenderMyVirtualList extends RenderBox
    with ContainerRenderObjectMixin<RenderBox, MyVirtualListParentData>,
         RenderBoxContainerDefaultsMixin<RenderBox, MyVirtualListParentData> {

  RenderMyVirtualList({required double itemExtent}) : _itemExtent = itemExtent;

  double _itemExtent;
  double get itemExtent => _itemExtent;
  set itemExtent(double value) {
    if (_itemExtent == value) return;
    _itemExtent = value;
    markNeedsLayout();
  }

  MyVirtualListElement? _element;
  set element(MyVirtualListElement? value) {
    _element = value;
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! MyVirtualListParentData) {
      child.parentData = MyVirtualListParentData();
    }
  }

  int _indexOf(RenderBox child) {
    return (child.parentData as MyVirtualListParentData).index!;
  }

  void _setIndex(RenderBox child, int index) {
    (child.parentData as MyVirtualListParentData).index = index;
  }

  // performLayout calls _element.createChild(index, after: ...) for each
  // newly-visible index, and _element.removeChild(child) for each child
  // that's no longer visible. The mechanics of figuring out which indices
  // are visible are layout-specific and out of scope here.
}
```

The private `_indexOf` and `_setIndex` are reachable from the element only when both classes share one library ("identifiers that start with an underscore (`_`) are visible only inside the library", https://dart.dev/language/libraries); the site does not say so.

The bridge uses a private `_IndexedSlot` (index plus previous sibling), whose definition the site never shows. The framework's public `IndexedSlot<T extends Element?>` carries an `Element`, not a `RenderBox` (https://api.flutter.dev/flutter/widgets/IndexedSlot-class.html).

```dart
@override
void insertRenderObjectChild(covariant RenderBox child, _IndexedSlot slot) {
  renderObject.insert(child, after: slot.after);
  renderObject._setIndex(child, slot.index);
}

@override
void moveRenderObjectChild(covariant RenderBox child, _IndexedSlot oldSlot, _IndexedSlot newSlot) {
  renderObject.move(child, after: newSlot.after);
  renderObject._setIndex(child, newSlot.index);
}

@override
void removeRenderObjectChild(covariant RenderBox child, _IndexedSlot slot) {
  renderObject.remove(child);
}
```

`mount`, `update`, `unmount`, `visitChildren` and `forgetChild`. This matches the documented pattern ("the update method can mark the render object as needing layout ... and then the render object's RenderObject.performLayout method can call back to the element", https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html):

```dart
@override
void mount(Element? parent, Object? newSlot) {
  super.mount(parent, newSlot);
  renderObject.element = this;
}

@override
void update(MyVirtualList newWidget) {
  final MyVirtualList oldWidget = widget;
  super.update(newWidget);
  // If itemCount or itemBuilder changed, every visible child may need
  // re-materialization. The render object handles this by re-running
  // its visibility computation during the next layout.
  if (newWidget.itemBuilder != oldWidget.itemBuilder ||
      newWidget.itemCount != oldWidget.itemCount) {
    renderObject.markNeedsLayout();
  }
}

@override
void unmount() {
  renderObject.element = null;
  super.unmount();
}

@override
void visitChildren(ElementVisitor visitor) {
  for (final child in _children.values) {
    if (!_forgottenChildren.contains(child)) {
      visitor(child);
    }
  }
}

@override
void forgetChild(Element child) {
  assert(_children.containsValue(child));
  _forgottenChildren.add(child);
  super.forgetChild(child);
}
```

- Keys: identity by index works automatically. Identity across an index change is kept only if both old and new elements are materialized when the change happens. A child that scrolls fully out of view loses its state unless there is a keep-alive (`SliverMultiBoxAdaptorElement`, the `KeepAlive` widget). "State that needs to survive scrolling should be stored outside the child element."

Pitfalls:

- Building outside `buildScope` trips assertions.
- Clear the guard in a `finally`.
- Set the back-reference in `mount` and clear it in `unmount`.
- `markNeedsLayout` from `update` is fine; "never call `markNeedsLayout` from inside `performLayout` itself; the framework asserts on this".
- Do not hold references to torn-down children.
- Index identity is not stable identity across reorders ("need keys *and* a keep-alive mechanism").
- Materializing too many children ("iterates over `itemCount` instead of just the visible range"): "Profile materialization counts during scrolling".
- Handle a `null` return from the builder.

## Prove it

- No `SingleChildRenderObjectWidget` or `MultiChildRenderObjectWidget` subclass redeclares `child`/`children` or overrides `createElement`.
- Every `updateRenderObject` assigns every non-child field that `createRenderObject` passes.
- The two container mixins share one `ParentDataType`, a subclass of `ContainerBoxParentData<RenderBox>`.
- A reorderable or filterable list passes keys; reordering it in a widget test keeps a `StatefulWidget` child's state.
- A slotted widget's `childForSlot` switch has no `default`, and `slots` returns every slot unconditionally.
- A custom element overrides `mount`, `update`, `visitChildren`, `forgetChild` and the three render-object bridge methods; it skips forgotten children and clears the set once per `update`; a test that moves a `GlobalKey` child into it and back keeps the child's state.
- A render object without the container mixin overrides `attach`, `detach`, `redepthChildren` and `visitChildren`, and calls `adoptChild` before reading the child's parent data.
- A virtualized render object wraps every `createChild`/`removeChild` call from `performLayout` in `invokeLayoutCallback`; scrolling a long list in a test materializes only the visible range (count the builder calls).
