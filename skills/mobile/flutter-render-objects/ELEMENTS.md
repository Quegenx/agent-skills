# Elements

The element layer around a custom render object: getting inherited values (theme, text direction) into a render object, ancestor lookups and their costs, element diagnostics, and what a custom `RenderObjectElement` must do for `GlobalKey` reparenting (`forgetChild`). Sources: the four renderobjects.com element guides (Matt Carroll; no Flutter version stated): [accessing inherited widgets](https://renderobjects.com/guides/elements/accessing-inherited-widgets/), [accessing ancestors](https://renderobjects.com/guides/elements/accessing-ancestors/), [element diagnostics](https://renderobjects.com/guides/elements/element-diagnostics/) and [GlobalKey reparenting](https://renderobjects.com/guides/elements/global-key-reparenting/), checked against api.flutter.dev and Flutter master `framework.dart`, `slotted_render_object_widget.dart` and `inherited_model.dart`. No API they name is deprecated. Where they are wrong, the official form comes first, then one line on what renderobjects.com says. App-level use of inherited widgets is in [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md).

**Contents:** [Inherited widgets from elements and render objects](#inherited-widgets-from-elements-and-render-objects) · [Ancestor and descendant lookups](#ancestor-and-descendant-lookups) · [Element diagnostics](#element-diagnostics) · [GlobalKey reparenting](#globalkey-reparenting) · [Prove it](#prove-it)

## Inherited widgets from elements and render objects

Tag for this section: [renderobjects](https://renderobjects.com/guides/elements/accessing-inherited-widgets/), unless a line cites an official URL or master source.

- **How lookup and notification work.** An element finds the nearest ancestor of the type through a map of the inherited widget types above it, so the lookup does not walk the tree. When an `InheritedWidget` rebuilds, the framework calls the new widget's `updateShouldNotify(oldWidget)`; if it returns true, every dependent element is marked dirty and rebuilds.
- **The dependents** are a `Map<Element, Object?>` on the `InheritedElement` (`final Map<Element, Object?> _dependents = HashMap<Element, Object?>();`); the value holds the dependency data, such as `InheritedModel` aspects (Flutter master `framework.dart`).
  - renderobjects.com says the dependents are "a `Set<Element>`".
- **Render objects never read inherited widgets.** They have no `BuildContext`, take no part in dependency tracking, and are updated by their element rather than rebuilt. The element (or the widget's `createRenderObject` / `updateRenderObject`) reads the inherited value and pushes it to the render object as a property; the setter marks layout or paint dirty.
- **`dependOnInheritedWidgetOfExactType<T>()` vs `getInheritedWidgetOfExactType<T>()`.** The first registers the caller as a dependent, which then rebuilds when the inherited widget notifies; `Theme.of(context)` uses it. The second returns the same widget without registering a dependency. Both are on `BuildContext`, which `Element` implements. dependOn everywhere causes needless rebuilds; get where you needed a dependency leaves the element silently stale. From inside an element:

```dart
final theme = dependOnInheritedWidgetOfExactType<MyTheme>();
```

  Official: both are "O(1) with a small constant factor", the dependOn variant "will lead to the widget being rebuilt more often", and the signature takes an optional aspect: `T? dependOnInheritedWidgetOfExactType<T extends InheritedWidget>({Object? aspect});`. https://api.flutter.dev/flutter/widgets/BuildContext/dependOnInheritedWidgetOfExactType.html
- **A dependency lasts until the element is deactivated.** `Element._dependencies` is unregistered only on deactivation, cleared in `activate()` ("We unregistered our dependencies in deactivate, but never cleared the list. Since we're going to be reused, let's clear our list now."), and nulled on unmount; no rebuild path clears it (Flutter master `framework.dart`). The docs agree: `State.didChangeDependencies` "is re-invoked whenever the inherited widget this context depends on changes, until the next time the widget or one of its ancestors is moved" (https://api.flutter.dev/flutter/widgets/BuildContext/dependOnInheritedWidgetOfExactType.html). Still call the lookup fresh in each build.
  - renderobjects.com says the dependency set "is cleared at the start of every rebuild", so a lookup read only inside an `if` stops depending on rebuilds that skip the branch.
- **Notification happens in the build phase,** not inside `updateShouldNotify`. Dependents go on the build owner's dirty list and rebuild through the same `performRebuild` path as `markNeedsBuild`, including `updateRenderObject` calls. You see the change during your element's own rebuild, not immediately elsewhere in the frame.
- **`Element.didChangeDependencies` is `@mustCallSuper` and calls `markNeedsBuild()`.** It fires when a dependency changes, and from `activate()` when the element had dependencies. The "once right after `initState`, before the first build" call belongs to `State.didChangeDependencies`, not to `Element`; that is why the pattern below also pushes the value from `mount`. https://api.flutter.dev/flutter/widgets/Element/didChangeDependencies.html

```dart
@mustCallSuper
void didChangeDependencies() {
  assert(_lifecycleState == _ElementLifecycle.active); // otherwise markNeedsBuild is a no-op
  assert(_debugCheckOwnerBuildTargetExists('didChangeDependencies'));
  markNeedsBuild();
}
```

  - renderobjects.com says `Element.didChangeDependencies` is called "Once after `mount`, immediately before the first build" and that "The base `Element` implementation does nothing."
- **The guide's override:**

```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  final newDirectionality = dependOnInheritedWidgetOfExactType<Directionality>();
  renderObject.textDirection = newDirectionality!.textDirection;
}
```

- **A custom element that forwards an inherited value:**

```dart
class MyDirectionalElement extends SingleChildRenderObjectElement {
  MyDirectionalElement(MyDirectionalWidget super.widget);

  @override
  RenderMyDirectional get renderObject => super.renderObject as RenderMyDirectional;

  @override
  void mount(Element? parent, Object? newSlot) {
    super.mount(parent, newSlot);
    _updateRenderObjectFromInherited();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateRenderObjectFromInherited();
  }

  void _updateRenderObjectFromInherited() {
    final directionality = dependOnInheritedWidgetOfExactType<Directionality>();
    renderObject.textDirection = directionality?.textDirection ?? TextDirection.ltr;
  }
}
```

  Registration is idempotent within a build, and the render object's setter decides whether to mark layout or paint dirty.
- **Prefer the simpler route.** With a plain `RenderObjectWidget`, do the lookup in `createRenderObject` and `updateRenderObject`, which both receive a `BuildContext`. Write a custom element only when the work must happen outside those methods.
- **The forwarding recipe:** (1) the element reads the value with dependOn; (2) it passes it to a render-object setter; (3) the setter compares, stores, and calls `markNeedsLayout`, `markNeedsPaint` or `markNeedsSemanticsUpdate`; (4) when the inherited widget changes, the element rebuilds and repeats 1 and 2. Without a custom element, the whole recipe is:

```dart
@override
void updateRenderObject(BuildContext context, RenderMyWidget renderObject) {
  renderObject.textDirection = Directionality.of(context);
  // ...other properties
}
```

  `Directionality.of(context)` calls `context.dependOnInheritedWidgetOfExactType<Directionality>()`. Setter patterns: [LAYOUT.md](LAYOUT.md), [PAINTING.md](PAINTING.md), [SEMANTICS.md](SEMANTICS.md#keeping-it-fresh).
- **Render objects cannot look up; context-bearing callbacks can.** Push every value a render object needs before layout starts: in build, or in the element's `mount`, `update` or `didChangeDependencies`; never try to read inherited widgets during layout, paint or hit testing. The official dependOn doc allows calls "from build methods, layout and paint callbacks, or from [State.didChangeDependencies]"; those callbacks hold a `BuildContext` (builder callbacks), which a render object does not.
- **Not from `initState`, not from `dispose`.** The official doc: "This method should not be called from widget constructors or from State.initState methods", nor from `State.dispose` ("the element tree is no longer stable"). It is safe from `State.deactivate`, and from event handlers or timers when the value "is not cached and/or reused later". A debug assert enforces the `initState` rule: "dependOnInheritedWidgetOfExactType<$targetType>() or dependOnInheritedElement() was called before ${state.runtimeType}.initState() completed." Move the lookup to `didChangeDependencies`. https://api.flutter.dev/flutter/widgets/BuildContext/dependOnInheritedWidgetOfExactType.html
  - renderobjects.com gives the `initState` rule only.
- **`InheritedModel` and aspects:** use it when dependents care about only part of the data (colors vs typography vs durations), and reach for it only when profiling shows an inherited widget causes many needless rebuilds. The model's `updateShouldNotifyDependent(oldWidget, dependencies)` decides per dependent whether to notify. Official signatures: `static T? inheritFrom<T extends InheritedModel<Object>>(BuildContext context, {Object? aspect})` and `bool updateShouldNotifyDependent(covariant InheritedModel<T> oldWidget, Set<T> dependencies);` (https://api.flutter.dev/flutter/widgets/InheritedModel-class.html).

```dart
final colors = InheritedModel.inheritFrom<MyAppModel>(this, aspect: MyAppAspect.colors);
```

- **Pitfalls:** get where you needed dependOn; back-channels from a render object to its element; reading during layout or paint; an `updateShouldNotify` that always returns true (rebuilds every dependent) or always false (dependents never update), so compare the data; pushing the value in `mount` but not in `didChangeDependencies` (both paths must push); holding a stale reference to an inherited widget instance across builds.

## Ancestor and descendant lookups

Tag for this section: [renderobjects](https://renderobjects.com/guides/elements/accessing-ancestors/), unless a line cites an official URL or master source.

- **Two categories.** Dependency-creating lookups rebuild the caller when what they found changes; one-shot lookups register nothing. If the value decides what build renders, you need a dependency; in response to a user action or an async event, a one-shot lookup is correct.
- **Dependency-creating:**
  - `dependOnInheritedWidgetOfExactType<T>()`: O(1); backs `Theme.of`, `MediaQuery.of` and `Directionality.of`.
  - `dependOnInheritedElement(InheritedElement element, {Object? aspect})`: the lower-level form, used after `getElementForInheritedWidgetOfExactType`; `InheritedModel.inheritFrom` uses it with an aspect.
- **One-shot:**
  - `getInheritedWidgetOfExactType<T>()`: O(1), no dependency, for example in a callback.
  - `getElementForInheritedWidgetOfExactType<T>()`: returns the `InheritedElement`, no dependency.
  - `findAncestorWidgetOfExactType<T>()`: matches the exact runtime type, works for any widget, O(N) in depth; discouraged because it creates implicit coupling.
  - `findAncestorStateOfType<T extends State>()`: the nearest; backs `Scaffold.of`; O(N), no dependency. [Scaffold.of](https://api.flutter.dev/flutter/material/Scaffold/of.html)
  - `findRootAncestorStateOfType<T extends State>()`: the topmost match (outermost `Navigator` or `Form`); rarely needed.
  - `findAncestorRenderObjectOfType<T extends RenderObject>()`: O(N), no dependency.
  - `visitAncestorElements(bool Function(Element) visitor)`: return true to continue, false to stop; the most flexible lookup.
- **Costs (official):** get and getElementFor are "O(1) with a small constant factor"; the `findAncestor*` methods and `visitAncestorElements` are "relatively expensive (O(N) in the depth of the tree)". https://api.flutter.dev/flutter/widgets/Element-class.html
- **P2 correction:** [Form.of](https://api.flutter.dev/flutter/widgets/Form/of.html) and [Scrollable.of](https://api.flutter.dev/flutter/widgets/Scrollable/of.html) create dependencies on the returned form or scrollable. The [renderobjects ancestor guide](https://renderobjects.com/guides/elements/accessing-ancestors/) and the old list here grouped them with the one-shot `Scaffold.of` lookup.
- **The inherited lookups use a map, not a walk.** `getInheritedWidgetOfExactType` is built on `getElementForInheritedWidgetOfExactType`, which reads the element's `_inheritedElements` map (Flutter master `framework.dart`).
  - renderobjects.com calls `visitAncestorElements` "the one all the others are built on".
- **Descendants:** `visitChildElements(ElementVisitor)` visits immediate children and does not recurse ("Wrapper around visitChildren for BuildContext."). `visitChildren` is the framework's tree-walk hook: you override it in a custom element and rarely call it. There is no "find descendant of type" API; a descendant that must be found should announce itself (a callback, a notification, or registering with an ancestor).
- **Never cache lookup results across builds.** Ancestors get removed, replaced or reparented; call the lookup fresh each time, as `.of` methods do inside build.
- **Decision flow:**
  - Ambient state in build: dependOn, through `.of`.
  - A method on an ancestor's State: `findAncestorStateOfType`, through `.of`.
  - An ancestor's render object: `findAncestorRenderObjectOfType`.
  - A read without rebuilds: `getInheritedWidgetOfExactType`, but ask why.
  - A custom match: `visitAncestorElements`.
  - A descendant: "Almost always the wrong question."
- **Pitfalls:** `findAncestor*` inside build; walking descendants; caching ancestor references; confusing the nearest and root variants; `findAncestorWidgetOfExactType` for cross-cutting state ("now strongly discouraged").

## Element diagnostics

Tag for this section: [renderobjects](https://renderobjects.com/guides/elements/element-diagnostics/), unless a line cites an official URL or master source. Render-object diagnostics: [DIAGNOSTICS.md](DIAGNOSTICS.md).

- **Why:** rebuild, reconciliation and inherited-widget bugs surface at the element layer. The DevTools widget inspector, `debugDumpApp()`, framework error messages and the "select widget" tool all print element diagnostics; without them a custom element shows only its class name. `Element` extends `DiagnosticableTree` and implements `BuildContext` (https://api.flutter.dev/flutter/widgets/Element-class.html).
- **`debugFillProperties` on an element:** call super first and keep it cheap.

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(DiagnosticsProperty<int>('child count', _children.length));
  properties.add(DiagnosticsProperty<bool>('has forgotten children',
      _forgottenChildren.isNotEmpty,
      defaultValue: false));
  properties.add(IntProperty('currently updating index', _currentlyUpdatingChildIndex,
      defaultValue: null));
}
```

- **What super adds** (Flutter master `framework.dart`): the base `Element.debugFillProperties` adds `depth`, `widget`, `key` (hidden level), then calls `_widget?.debugFillProperties(properties)`, then `dirty` and `dependencies` (the sorted inherited dependencies). It adds no lifecycle or slot property.
  - renderobjects.com says the base contributes "depth, lifecycle state, and the dirty flag" (and "depth, dirty state, slot" in its pitfalls).
- **Widget vs element.** The widget exposes construction-time configuration (`color`, `padding`, `child`); the element exposes runtime state: child storage layout, internal flags such as `_currentlyUpdatingChildIndex` and `_forgottenChildren`, dependency info and lifecycle. Do not duplicate widget properties on the element: super already prints them through `_widget?.debugFillProperties`.
- **Types and defaults:** `IntProperty` (counts, indices), `FlagProperty` (booleans), `IterableProperty<T>` (for example materialized indices), `DiagnosticsProperty<T>` (the fallback). Hide boring values with `defaultValue: 0` for child counts, `false` for rare flags, `null` for transient state. Levels: [DIAGNOSTICS.md](DIAGNOSTICS.md#defaults-and-levels).
- **Children in dumps come from `visitChildren`.** Write `debugDescribeChildren` only for structured children (slotted, coordinate-based or virtualized), labelling each by its key. `Element.toDiagnosticsNode({String? name, DiagnosticsTreeStyle? style})` exists in master.

```dart
@override
List<DiagnosticsNode> debugDescribeChildren() {
  final children = <DiagnosticsNode>[];
  for (final entry in _children.entries) {
    children.add(entry.value.toDiagnosticsNode(name: 'cell ${entry.key}'));
  }
  return children;
}
```

- **Before and after** (the guide's dumps are illustrative: with the default `toStringShort` below, a real element line shows the widget's name rather than `MyGridElement`):

```
MyApp
└MaterialApp
 └Scaffold
  └Center
   └MyGrid
    └MyGridElement
      ├cell 0
      │ └Text("A")
      ├cell 1
      │ └Text("B")
      └cell 2
        └Text("C")
```

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(IntProperty('cells', _children.length));
  properties.add(DiagnosticsProperty<bool>(
    'has forgotten children',
    _forgottenChildren.isNotEmpty,
    defaultValue: false,
  ));
}
```

```
MyGridElement(cells: 3)
 ├cell GridCoord(0, 0)
 │ └Text("A")
 ├cell GridCoord(0, 1)
 │ └Text("B")
 └cell GridCoord(1, 0)
   └Text("C")
```

```
MyGridElement(cells: 3, currently updating index: 2, has forgotten children)
```

- **`toStringShort` defaults to the widget's.** Master: `String toStringShort() => _widget?.toStringShort() ?? '${describeIdentity(this)}(DEFUNCT)';`, and `Widget.toStringShort` is the runtime type plus `-$key` when the widget has a key. The type-plus-hash form appears only for a defunct element. Override it only for clearly better error messages. https://api.flutter.dev/flutter/widgets/Element/toStringShort.html
  - renderobjects.com says the default is "the runtime type plus a hash".
- **Assert-guarded invariants** cost nothing in release; assert only on what must never happen:

```dart
@override
void mount(Element? parent, Object? newSlot) {
  super.mount(parent, newSlot);
  assert(_children.isEmpty, 'Element should not have children before mount');
}

void createChild(int index, {required RenderBox? after}) {
  assert(_currentlyUpdatingChildIndex == null,
      'Re-entrant child creation: already updating index $_currentlyUpdatingChildIndex');
  // ... rest of the method
}

@override
void forgetChild(Element child) {
  assert(_children.containsValue(child),
      'forgetChild called on a child this element does not own');
  super.forgetChild(child);
}
```

- **Pitfalls:** skipping super; duplicating widget properties; expensive computation (cache derived values); missing `defaultValue`; numeric labels for structured children; asserts on valid input; skipping element diagnostics because the widget has them; "Element diagnostics that lie": recompute values at diagnostic time rather than keeping a field in sync.

## GlobalKey reparenting

Tag for this section: [renderobjects](https://renderobjects.com/guides/elements/global-key-reparenting/), unless a line cites an official URL or master source.

- **What reparenting needs.** The framework finds the element by its global key, detaches it without tearing down state, attaches it to the new parent and moves its render object. The old parent's only job is to stop tracking the child without deactivating it; `forgetChild` is that hook. Official: "Remove the given child from the element's child list, in preparation for the child being reused elsewhere in the element tree." It is `@protected @mustCallSuper`; the base `Element.forgetChild` records children with a GlobalKey for duplicate-key checks ("If [update] is never called, the forgotten child still represents a global key duplication that we need to catch."). After it, "[deactivateChild] is called to sever the link to this object" (Flutter master `framework.dart`).
- **When you write nothing.** `SingleChildRenderObjectElement`, `SlottedRenderObjectElement` and `MultiChildRenderObjectElement` already implement `forgetChild` (and `LeafRenderObjectElement.forgetChild` asserts false). You need your own only when you subclass `RenderObjectElement` directly, typically for structured or virtualized children. Child models: [CHILD-MODELS.md](CHILD-MODELS.md).
- **The framework's sequence:** (1) look up the element by its key; (2) call `forgetChild` on the old parent; (3) move the element, keeping state and render object; (4) call `removeRenderObjectChild` on the old parent and `insertRenderObjectChild` on the new one; (5) on the old parent's next `update`, reconciliation skips the forgotten child, then clears the set and removes it from storage.
- **Two valid storage strategies** (Flutter master):
  - **Immediate removal for keyed or slotted storage.** `SingleChildRenderObjectElement.forgetChild` sets `_child = null`; `SlottedRenderObjectElement.forgetChild` calls `_slotToChild.remove(child.slot)`.
  - **A deferred forgotten set for list- or index-based storage,** as `MultiChildRenderObjectElement` does, because its `updateChildren` works over a list.
  - renderobjects.com presents the forgotten set as the only correct way and says removing the child from storage inside `forgetChild` "breaks the framework's expectation that children are still findable".
- **The forgotten-set minimum:** a set, a `forgetChild` that adds to it, a `visitChildren` that skips it, and a reconciliation that skips it and then clears it:

```dart
final Set<Element> _forgottenChildren = <Element>{};

@override
void forgetChild(Element child) {
  assert(_children.containsValue(child));
  _forgottenChildren.add(child);
  super.forgetChild(child);
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
void update(MyWidget newWidget) {
  super.update(newWidget);
  // ... your reconciliation logic, which must skip forgotten children
  _forgottenChildren.clear();
}
```

  This mirrors `MultiChildRenderObjectElement`: there `_forgottenChildren = HashSet<Element>()`, `forgetChild` asserts `_children.contains(child)` and `!_forgottenChildren.contains(child)` before adding, and `update` passes `forgottenChildren: _forgottenChildren` to `RenderObjectElement.updateChildren(...)`, the framework's ready-made reconciliation that skips them, then clears the set (Flutter master `framework.dart`).
- **The render-tree side needs no special code:** `adoptChild` / `dropChild` or `ContainerRenderObjectMixin.insert` / `remove` handle the handoff. Guard `setupParentData` with `is!` so a moved child keeps compatible parent data that a `ParentDataWidget` set ([PARENT-DATA.md](PARENT-DATA.md)):

```dart
@override
void setupParentData(RenderBox child) {
  if (child.parentData is! MyParentData) {
    child.parentData = MyParentData();
  }
}
```

- **Pitfalls:** not clearing the set after `update`; not skipping forgotten children in reconciliation (it replaces them or corrupts render-tree operations); calling `deactivateChild` from `forgetChild`; skipping `super.forgetChild`; a `forgetChild` without a filtering `visitChildren` (deactivation walks into the moved child and tears down its state).

## Prove it

- Every inherited value a render object uses reaches it through a setter called from `createRenderObject` / `updateRenderObject`, or from a custom element's `mount` and `didChangeDependencies` (both).
- Every `didChangeDependencies` override calls super; no dependOn or `.of` call in `initState`, `dispose` or a constructor.
- No `findAncestor*` or `visitAncestorElements` call inside build, and no lookup result stored in a field.
- A custom element's `debugFillProperties` calls super and does not repeat the widget's properties; `debugDumpApp()` shows its structured children by key.
- A custom `RenderObjectElement` subclassed directly overrides `forgetChild` (calling super), and either removes the child from keyed storage immediately or keeps a forgotten set that `visitChildren` and reconciliation skip and `update` clears.
- Moving a child with a `GlobalKey` between two instances of the custom element keeps its `State` (a counter in it survives the move).
