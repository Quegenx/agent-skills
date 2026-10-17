# Example: Apple Watch app grid

A worked example from renderobjects.com (Matt Carroll): a custom `RenderBox` plus a custom `Element` that lays out an Apple-Watch-style honeycomb of app icons, builds only the visible icons during layout, scrolls and flings vertically, springs back horizontally, and reports taps. The code below is copied from the article; the only change is that em dashes inside code comments are written as " - " (repo rule). The article's code does not compile as shown in one spot and leaves helpers out; both are listed under [Flagged problems](#flagged-problems) with corrected lines. No Flutter version is stated in the article. The other examples are [EXAMPLE-MESSAGE-ATTACHMENT.md](EXAMPLE-MESSAGE-ATTACHMENT.md) and [EXAMPLE-THERMOSTAT.md](EXAMPLE-THERMOSTAT.md); the skill's router is [SKILL.md](SKILL.md).

**Contents:** [What it builds](#what-it-builds) · [Techniques used](#techniques-used) · [The widget](#the-widget) · [The custom Element](#the-custom-element) · [The delegate interface](#the-delegate-interface) · [Layout](#layout) · [Paint](#paint) · [Hit testing](#hit-testing) · [Gesture recognition](#gesture-recognition) · [Semantics](#semantics) · [Debug properties](#debug-properties) · [Flagged problems](#flagged-problems) · [Similar implementations](#similar-implementations) · [Prove it](#prove-it)

## What it builds

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) The Apple Watch app selector "looks like a honeycomb grid, which scrolls vertically, and sizes the app icons with a kind of fisheye distortion". The user can pan in all four directions, scroll and fling vertically, and "when the user pans or flings beyond the boundary of the content, a springy overscroll is applied, which pulls the content back into frame".

The article names three reasons this UI is "a good candidate for a custom render object":

- It has child widgets.
- "Layout of child size and position is nuanced."
- "Only visible children should be built, therefore build happens during layout."

## Techniques used

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) Where each technique is explained in this skill:

| Technique in this example | Read |
| --- | --- |
| Custom `RenderObjectElement` that builds children during layout, `TickerMode` subscription, slots | [ELEMENTS.md](ELEMENTS.md) |
| Multi-child render box (`firstChild`, `childAfter`, `insert`, `move`, `remove`, `defaultPaint`, `defaultHitTestChildren`) | [CHILD-MODELS.md](CHILD-MODELS.md) |
| Per-child `index` stored in a custom parent data class (`_WatchAppGridLayoutParentData`) | [PARENT-DATA.md](PARENT-DATA.md) |
| `performLayout` with tight child constraints, `invokeLayoutCallback`, lazy build window | [LAYOUT.md](LAYOUT.md) |
| `defaultPaint` for children that carry their own size and position | [PAINTING.md](PAINTING.md) |
| `hitTestSelf => true` over the whole area, `handleEvent` with a pan recognizer and a slop-based tap | [HIT-TESTING.md](HIT-TESTING.md) |
| Scroll semantics: `scrollPosition`, `scrollExtentMin`/`Max`, `scrollChildCount`, `onScrollToOffset` | [SEMANTICS.md](SEMANTICS.md) |
| `debugFillProperties` | [DIAGNOSTICS.md](DIAGNOSTICS.md) |

The division of labor, in the article's words: "The `Widget` creates the specific `Element` and `RenderBox` needed for the app grid. The `Element` adds, holds, and removes children, and also runs child builds when requested. The `RenderBox` runs layout, asks the `Element` to create children, and then it sizes and positions those children. Then the `RenderBox` paints the app icon children."

## The widget

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) "The app grid builds child widgets on-demand. This requires a custom `Element` to run widget builds." Both the `Element` and the `RenderBox` are created by a `RenderObjectWidget`; `createRenderObject` hands the render object its element as a `LazyChildDelegate`.

```dart
/// Widget that displays a scrollable hexagonal grid of app icons.
class WatchAppGrid extends RenderObjectWidget {
  const WatchAppGrid({super.key, this.childCount, this.onAppPressed, required this.builder});

  final int? childCount;

  /// Called with the index of the app icon the user tapped.
  final ValueChanged<int>? onAppPressed;

  final Widget? Function(BuildContext context, int index) builder;

  @override
  WatchAppGridElement createElement() => WatchAppGridElement(this);

  @override
  RenderWatchAppGridLayout createRenderObject(BuildContext context) {
    return RenderWatchAppGridLayout(childManager: context as LazyChildDelegate, onAppPressed: onAppPressed);
  }

  @override
  void updateRenderObject(BuildContext context, RenderWatchAppGridLayout renderObject) {
    renderObject.onAppPressed = onAppPressed;
  }
}
```

## The custom Element

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) The element's responsibilities:

- Track the child `Element`s: insert, move, forget, remove.
- Build and dispose child `Element`s during layout: `createOrUpdateChildDuringLayout()` and `removeChildDuringLayout()`.
- Visit each child when requested: `visitChildren()`.
- "Notify the render object whether `Ticker`s are currently enabled or not (important for widget tests)." It subscribes to `TickerMode.getValuesNotifier(this)` in `mount`, again in `activate` (it "may have moved (e.g. via a GlobalKey reparent) under a new TickerMode ancestor"), and unsubscribes in `unmount`.

Child builds run inside `owner!.buildScope(this, ...)`, and the slot passed to `updateChild` is the preceding sibling `RenderBox`.

```dart
class WatchAppGridElement extends RenderObjectElement implements LazyChildDelegate {
  WatchAppGridElement(super.widget);

  final Map<int, Element> _childElements = {};

  WatchAppGrid get _widget => widget as WatchAppGrid;

  @override
  RenderWatchAppGridLayout get renderObject => super.renderObject as RenderWatchAppGridLayout;

  @override
  int? get childCount => _widget.childCount;

  /// Listen for ancestor desire to disable tickers, which is especially important in
  /// a widget test environment.
  ValueListenable<TickerModeData>? _tickerModeNotifier;

  @override
  void mount(Element? parent, Object? newSlot) {
    super.mount(parent, newSlot);
    _subscribeToTickerMode();
  }

  @override
  void activate() {
    super.activate();

    // We may have moved (e.g. via a GlobalKey reparent) under a new
    // TickerMode ancestor - refresh our subscription.
    _subscribeToTickerMode();
  }

  @override
  void unmount() {
    _tickerModeNotifier?.removeListener(_onTickerModeChanged);

    super.unmount();
  }

  void _subscribeToTickerMode() {
    final newNotifier = TickerMode.getValuesNotifier(this);
    if (newNotifier == _tickerModeNotifier) {
      return;
    }

    _tickerModeNotifier?.removeListener(_onTickerModeChanged);
    newNotifier.addListener(_onTickerModeChanged);
    _tickerModeNotifier = newNotifier;
    _onTickerModeChanged();
  }

  void _onTickerModeChanged() {
    renderObject.tickingEnabled = _tickerModeNotifier!.value.enabled;
  }

  @override
  void didStartLayout() {}

  @override
  bool createOrUpdateChildDuringLayout(int index, {required RenderBox? after}) {
    bool produced = false;
    owner!.buildScope(this, () {
      final newChild = updateChild(_childElements[index], _widget.builder(this, index), after);
      if (newChild != null) {
        _childElements[index] = newChild;
        produced = true;
      } else {
        _childElements.remove(index);
      }
    });
    return produced;
  }

  @override
  void insertRenderObjectChild(RenderObject child, Object? slot) {
    renderObject.insert(child as RenderBox, after: slot as RenderBox?);
  }

  @override
  void moveRenderObjectChild(RenderObject child, Object? oldSlot, Object? newSlot) {
    renderObject.move(child as RenderBox, after: newSlot as RenderBox?);
  }

  @override
  void removeChildDuringLayout(RenderBox child) {
    final index = (child.parentData! as _WatchAppGridLayoutParentData).index!;
    owner!.buildScope(this, () {
      updateChild(_childElements[index], null, index);
    });
    _childElements.remove(index);
  }

  @override
  void forgetChild(Element child) {
    final index = (child.renderObject!.parentData! as _WatchAppGridLayoutParentData).index;
    _childElements.remove(index);
    super.forgetChild(child);
  }

  @override
  void removeRenderObjectChild(RenderObject child, Object? slot) {
    renderObject.remove(child as RenderBox);
  }

  @override
  void didFinishLayout() {}

  @override
  void visitChildren(ElementVisitor visitor) {
    _childElements.values.forEach(visitor);
  }
}
```

API check: `TickerMode.getValuesNotifier(BuildContext context)` returns `ValueListenable<TickerModeData>`, and with no `TickerMode` ancestor it returns `TickerModeData.fallback` (https://api.flutter.dev/flutter/widgets/TickerMode/getValuesNotifier.html). `forgetChild` "must remove the child element from its child list", and an element with children "must expose them in its implementation of the visitChildren method" (https://api.flutter.dev/flutter/widgets/RenderObjectElement-class.html). `BuildOwner.buildScope` allows only one active scope at a time (https://api.flutter.dev/flutter/widgets/BuildOwner/buildScope.html).

## The delegate interface

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) The element implements `LazyChildDelegate`, "an interface that was declared in this code to create a contract between the `RenderBox` and the `Element`". It "keeps the render object from calling arbitrary Element methods that could corrupt the widget tree." (The doc comment's class name is wrong; see [Flagged problems](#flagged-problems).)

```dart
/// Interface between [RenderWatchAppGridLayout] and [WatchAppGridLayoutElement] for
/// lazy child building during layout. Keeps the render object from calling
/// arbitrary Element methods that could corrupt the widget tree.
abstract interface class LazyChildDelegate {
  /// Total item count, or null if unbounded.
  int? get childCount;

  /// Called at the start of each layout pass.
  void didStartLayout();

  /// Build or update the child at [index], inserting it after [after].
  /// Returns true if a child was produced, false if the builder returned null.
  bool createOrUpdateChildDuringLayout(int index, {required RenderBox? after});

  /// Unmount and remove [child] from the tree.
  void removeChildDuringLayout(RenderBox child);

  /// Called at the end of each layout pass.
  void didFinishLayout();
}
```

## Layout

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) Layout has three jobs:

- A staggered row layout (3-4-3-4).
- "A fisheye lens distortion, which shrinks app icons near the periphery, and also pulls them closer to the center."
- "Decide which app icons are currently visible, build the visible ones, and dispose the non-visible ones."

The article: most of this `performLayout()` is the fisheye distortion, which "was generated with AI and then iterated"; it "shrinks app icons near the edge of the watch face, and also pulls them a little bit closer to the center of the watch so that the space between app icons remains consistent". When reading it, "look for the lines that interact with the `Element`, such as notifying the `Element` when layout begins and ends, and asking the `Element` to create and/or dispose children."

The protocol the code follows:

1. `didStartLayout()`.
2. Evict children above the new window **before** building anything. Slots are "the previous sibling RenderBox", by reference; a stale child left in place "would silently reparent the children after it ... desyncing the list ... and eventually asserting".
3. Build forward from the first visible index, each build inside `invokeLayoutCallback<BoxConstraints>`. Stop when a row is guaranteed invisible or the builder returns null. Lay out each child with tight constraints and set its offset.
4. Remove every stale child outside `[firstVisibleIndex, index)`, then `didFinishLayout()`.
5. Report the scroll extent from the total `childCount`, not the built range, and call `markNeedsSemanticsUpdate()` when the max extent changes.

The honeycomb maths: groups of 7 icons fill two rows (3 then 4); `cellWidth = width / 4`, `rowHeight = cellWidth * sqrt(3) / 2`, `iconSize = cellWidth * 0.87`. Icons are full size in the central 40% (`innerRadius = 0.4`), `dMax = 2.0 - innerRadius`, distance is a superellipse (Minkowski p=4), scale falls off with smoothstep `t*t*(3-2t)`, and its integral `t - t^3 + 0.5t^4` pulls icons inward.

```dart
  @override
  void performLayout() {
    size = constraints.biggest;
    _lazyChildDelegate.didStartLayout();

    final double verticalOffset = _verticalOffset;
    final double horizontalOffset = _horizontalOffset;

    // 3-4-3-4 Apple Watch honeycomb.
    // Every group of 7 icons fills two rows: 3 (even row) + 4 (odd row).
    //   Even row centers: W/4,  W/2,  3W/4          (xStart = cellWidth/2)
    //   Odd  row centers: W/8, 3W/8, 5W/8, 7W/8     (xStart = 0)
    const int evenRowColumns = 3;
    const int oddRowColumns = 4;

    final double cellWidth = size.width / oddRowColumns;
    final double rowHeight = cellWidth * sqrt(3) / 2;
    final double iconSize = cellWidth * 0.87;
    final double cx = size.width / 2.0;
    final double cy = size.height / 2.0;

    // The central 40% of the screen renders icons at full size; beyond that,
    // icons shrink toward zero as the normalized distance approaches dMax
    // (see the falloff below). Because a row's vertical distance doesn't
    // depend on column or horizontal offset, a row whose |ny| already
    // exceeds dMax is guaranteed to have every icon in it at scale == 0 -
    // which lets rows entirely outside the viewport be skipped below instead
    // of built and laid out just to render at zero size.
    const double innerRadius = 0.4;
    final double dMax = 2.0 - innerRadius;

    final int? maxCount = _lazyChildDelegate.childCount;

    // If the total icon count isn't a multiple of a full row, the final row
    // has fewer icons than its row size (3 for an even row, 4 for an odd
    // row). Precompute which row that is and how many icons it holds so
    // those icons can be centered within the row instead of packed to the
    // leading edge.
    int? lastRowIndex;
    int? lastRowCount;
    if (maxCount != null && maxCount > 0) {
      final int lastItemIndex = maxCount - 1;
      final int lastItemGroup = lastItemIndex ~/ 7;
      final int lastItemRem = lastItemIndex % 7;
      lastRowIndex = lastItemRem < evenRowColumns ? 2 * lastItemGroup : 2 * lastItemGroup + 1;
      lastRowCount = (lastItemRem < evenRowColumns ? lastItemRem : lastItemRem - evenRowColumns) + 1;
    }

    // First index of a group's row, given the row number.
    int firstIndexOfRow(int row) => row.isEven ? (row ~/ 2) * 7 : ((row - 1) ~/ 2) * 7 + evenRowColumns;

    // Smallest row whose grid-space center could land within dMax of the
    // (scroll-shifted) viewport center; every row above it is guaranteed to
    // be entirely invisible. One row of margin is kept to stay clear of
    // floating-point edge cases at the boundary.
    final double lowestVisibleY = verticalOffset + cy * (1.0 - dMax);
    final int rowMin = max(0, ((lowestVisibleY - rowHeight / 2.0) / rowHeight).floor() - 1);
    final int firstVisibleIndex = firstIndexOfRow(rowMin);

    // Evict children that have scrolled above the new window *before*
    // building anything. Slots below are tracked as "the previous sibling
    // RenderBox", by reference; if a stale child were left in place while
    // the loop below moves the new first child to the head of the list, the
    // stale child's removal would silently reparent the children after it
    // without their recorded slot changing, desyncing the list from what
    // the loop below believes it built and eventually asserting.
    RenderBox? leading = firstChild;
    while (leading != null) {
      final leadingData = leading.parentData! as _WatchAppGridLayoutParentData;
      final next = childAfter(leading);
      if (leadingData.index == null || leadingData.index! < firstVisibleIndex) {
        invokeLayoutCallback<BoxConstraints>((_) {
          _lazyChildDelegate.removeChildDuringLayout(leading!);
        });
      }
      leading = next;
    }

    RenderBox? precedingChild;
    int index = firstVisibleIndex;

    while (maxCount == null || index < maxCount) {
      // Map linear index → (row, col) in the 3-4-3-4 pattern.
      final int group = index ~/ 7;
      final int rem = index % 7;
      final int row = rem < evenRowColumns ? 2 * group : 2 * group + 1;
      final int col = rem < evenRowColumns ? rem : rem - evenRowColumns;

      // Rows increase monotonically with index, so once a row has scrolled
      // far enough past the bottom of the viewport to guarantee scale == 0,
      // every later row will too - stop instead of building icons nobody
      // can see.
      final double rowViewY = row * rowHeight + rowHeight / 2.0 - verticalOffset;
      if ((rowViewY - cy) / cy > dMax) {
        break;
      }

      bool hasChildAtIndex = false;
      invokeLayoutCallback<BoxConstraints>((_) {
        hasChildAtIndex = _lazyChildDelegate.createOrUpdateChildDuringLayout(index, after: precedingChild);
      });

      if (!hasChildAtIndex) {
        break;
      }

      final RenderBox? child = precedingChild == null ? firstChild : childAfter(precedingChild);
      assert(
        child != null,
        'createOrUpdateChildDuringLayout reported success but no child render '
        'object was found at index $index.',
      );
      if (child == null) {
        break;
      }

      final parentData = child.parentData! as _WatchAppGridLayoutParentData;
      parentData.index = index;

      // Grid-space centre of this icon. A full row is centered by
      // construction (evenRowColumns/oddRowColumns icons within
      // oddRowColumns cells); a partial final row is centered the same way,
      // just using however many icons it actually holds.
      final int rowSize = row.isOdd ? oddRowColumns : evenRowColumns;
      final int effectiveRowSize = (row == lastRowIndex && lastRowCount != null) ? lastRowCount : rowSize;
      final double xStart = (size.width - effectiveRowSize * cellWidth) / 2.0;
      final double gridX = xStart + col * cellWidth + cellWidth / 2;
      final double gridY = row * rowHeight + rowHeight / 2;

      // Viewport-space centre: apply scroll offsets.
      final double viewX = gridX + horizontalOffset;
      final double viewY = gridY - verticalOffset;

      // Distance vector from screen center.
      final double dx = viewX - cx;
      final double dy = viewY - cy;

      // Normalize distance by the respective screen dimensions.
      final double nx = dx / cx;
      final double ny = dy / cy;

      // Calculate superellipse distance (Minkowski distance with p=4).
      final double nx2 = nx * nx;
      final double ny2 = ny * ny;
      final double nx4 = nx2 * nx2;
      final double ny4 = ny2 * ny2;

      // DO NOT clamp to 1.0 here! We must evaluate virtual points outside
      // the screen bounds so they can be pulled inward to fill the edges.
      final double d = pow(nx4 + ny4, 0.25).toDouble();

      double scale = 1.0;
      double dPrime = d;

      if (d > innerRadius) {
        // The integral of our easing curve from 0 to 1 equals 0.5.
        // This means the displacement mathematically compresses the falloff zone by half.
        // To ensure the grid still reaches the screen edge (dPrime = 1.0) when scale drops to 0,
        // we must stretch the virtual falloff zone (dMax) to compensate.
        final double range = dMax - innerRadius;

        // Now we clamp the interpolation factor, not the raw distance.
        final double t = ((d - innerRadius) / range).clamp(0.0, 1.0);

        // Scaling easing curve.
        final double smooth = t * t * (3.0 - 2.0 * t);
        scale = 1.0 - smooth;

        // Integrate the scale curve to calculate the new compressed distance.
        // Integral of (1 - 3t^2 + 2t^3) is (t - t^3 + 0.5t^4).
        final double integral = t - (t * t * t) + 0.5 * (t * t * t * t);
        dPrime = innerRadius + range * integral;
      }

      final double scaledSize = iconSize * scale;

      // Radially displace the coordinates inward.
      final double ratio = d == 0.0 ? 0.0 : (dPrime / d);
      final double finalX = cx + (dx * ratio);
      final double finalY = cy + (dy * ratio);

      child.layout(BoxConstraints.tight(Size(scaledSize, scaledSize)));
      parentData.offset = Offset(finalX - scaledSize / 2, finalY - scaledSize / 2);

      precedingChild = child;
      index++;
    }

    // Remove any previously-live children that are no longer within the
    // built range: scrolled out above firstVisibleIndex, scrolled out below
    // where the loop stopped, or beyond a shrunk childCount.
    RenderBox? stale = firstChild;
    while (stale != null) {
      final staleData = stale.parentData as _WatchAppGridLayoutParentData;
      final next = childAfter(stale);
      if (staleData.index == null || staleData.index! < firstVisibleIndex || staleData.index! >= index) {
        invokeLayoutCallback<BoxConstraints>((_) {
          _lazyChildDelegate.removeChildDuringLayout(stale!);
        });
      }
      stale = next;
    }

    _lazyChildDelegate.didFinishLayout();

    // Report scroll extent. This reflects the extent of the whole list, not
    // just the (now partial) range built above, so it's derived from the
    // total childCount rather than the loop's final index.
    if (lastRowIndex != null) {
      final double contentHeight = (lastRowIndex + 1) * rowHeight + 2.0;
      final double firstRowCenterOffset = rowHeight / 2.0 - cy;
      final double previousMaxScrollExtent = _maxScrollExtent;
      _reportScrollExtent(
        contentHeight: contentHeight,
        viewportHeight: size.height,
        rowHeight: rowHeight,
        firstRowCenterOffset: firstRowCenterOffset,
      );
      if (_maxScrollExtent != previousMaxScrollExtent) {
        markNeedsSemanticsUpdate();
      }
    }
  }
```

API check: `invokeLayoutCallback` is `@protected`, "can only be called during layout", and its callback is the only time mutations are allowed; calling it disables several assertions, so the docs generally discourage it (https://api.flutter.dev/flutter/rendering/RenderObject/invokeLayoutCallback.html).

## Paint

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) "The layout for this render object is complicated, but painting couldn't be easier. Every child app icon has its own size and position. This widget doesn't add any custom paint of its own. Therefore, the default paint implementation is all that's needed."

```dart
  @override
  void paint(PaintingContext context, Offset offset) {
    defaultPaint(context, offset);
  }
```

## Hit testing

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) "We want the user to be able to drag anywhere in our bounds, regardless of whether the user is dragging over an app icon, or dragging between app icons." So `hitTestSelf` always returns true, and children use the default.

```dart
  @override
  bool hitTestSelf(Offset position) => true;

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    return defaultHitTestChildren(result, position: position);
  }
```

## Gesture recognition

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) The design decision: scrolling could be externalized with "some kind of `AppGridScrollController` ... the way a `ListView` takes a `ScrollController`", and taps with a `GestureDetector` per child. It was kept inside the render object because "it's unlikely that the app grid wants external widgets controlling the scroll offset", and "the entire purpose of the app grid is to present tappable app icons, so there's no obvious reason to make every child widget add its own `GestureDetector`."

What the code does:

- `handleEvent` gives each `PointerDownEvent` to the pan recognizer and records the down position. A `PointerUpEvent` within `kTouchSlop` of the down position counts as a tap; `PointerCancelEvent` clears it.
- Dragging past 0 or the max extent applies `_kOverscrollFriction`.
- On pan end, a fling-snap simulation runs vertically and a `SpringSimulation` with `SpringDescription.withDampingRatio(mass: 1.0, stiffness: 300.0, ratio: 0.8)` springs the horizontal offset back to 0.
- Every offset change calls `markNeedsLayout()` and `markNeedsSemanticsUpdate()`.

The block starts with `@override` at column 0, as in the source.

```dart
@override
  void handleEvent(PointerEvent event, covariant BoxHitTestEntry entry) {
    if (event is PointerDownEvent) {
      _pan.addPointer(event);
      _tapDownPosition = event.localPosition;
    } else if (event is PointerUpEvent) {
      final downPosition = _tapDownPosition;
      _tapDownPosition = null;
      if (downPosition != null && (event.localPosition - downPosition).distance <= kTouchSlop) {
        _handleTap(event.localPosition);
      }
    } else if (event is PointerCancelEvent) {
      _tapDownPosition = null;
    }
  }

  void _onPanUpdate(DragUpdateDetails details) {
    // dy is positive downward; scrolling down increases the vertical offset.
    _applyScrollDelta(-details.delta.dy);
    _applyHorizontalPanDelta(details.delta.dx);
  }

  void _applyScrollDelta(double dy) {
    _verticalFling.stop();
    final double proposed = _verticalOffset + dy;
    if (_verticalOffset < 0.0) {
      _verticalOffset += dy * _kOverscrollFriction;
    } else if (_verticalOffset > _maxScrollExtent) {
      _verticalOffset += dy * _kOverscrollFriction;
    } else if (proposed < 0.0) {
      final double inBounds = -_verticalOffset;
      final double overBounds = dy - inBounds;
      _verticalOffset = overBounds * _kOverscrollFriction;
    } else if (proposed > _maxScrollExtent) {
      final double inBounds = _maxScrollExtent - _verticalOffset;
      final double overBounds = dy - inBounds;
      _verticalOffset = _maxScrollExtent + overBounds * _kOverscrollFriction;
    } else {
      _verticalOffset = proposed;
    }
    markNeedsLayout();
    markNeedsSemanticsUpdate();
  }

  void _applyHorizontalPanDelta(double dx) {
    _horizontalSpring.stop();
    _horizontalOffset += dx * _kHorizontalFriction;
    markNeedsLayout();
    markNeedsSemanticsUpdate();
  }

  void _onPanEnd(DragEndDetails details) {
    final velocity = details.velocity.pixelsPerSecond;

    _verticalFling.animateWith(
      _FlingSnapSimulation(
        position: _verticalOffset,
        velocity: -velocity.dy,
        leadingExtent: 0.0,
        trailingExtent: _maxScrollExtent,
        rowHeight: _rowHeight,
        firstRowCenterOffset: _firstRowCenterOffset,
      ),
    );

    _horizontalSpring.animateWith(
      SpringSimulation(
        SpringDescription.withDampingRatio(mass: 1.0, stiffness: 300.0, ratio: 0.8),
        _horizontalOffset,
        0.0,
        velocity.dx * _kHorizontalFriction,
      ),
    );
  }

  void _handleTap(Offset position) {
    final index = _hitTestChildIndex(position);
    if (index != null) {
      _onAppPressed?.call(index);
    }
  }
```

"As the user pans up/down/left/right, the app grid moves with the user's finger. When the user releases a pan, the app grid vertically scrolls with momentum in that direction, and it snaps back to the center, horizontally." A tap on an icon "executes the widget's tap callback".

API check: `kTouchSlop` is `18.0`, and a total delta of `kTouchSlop` or less is not a drag, so the `<= kTouchSlop` tap test matches it (https://api.flutter.dev/flutter/gestures/kTouchSlop-constant.html). `SpringDescription.withDampingRatio({required double mass, required double stiffness, double ratio = 1.0})` is current (https://api.flutter.dev/flutter/physics/SpringDescription/SpringDescription.withDampingRatio.html).

## Semantics

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) "The most important details to report to Flutter's semantics system is the scroll behavior." Only the vertical axis is reported, because the horizontal offset "is a rubber-band tilt that always springs back to 0, not a way to reach different content". `hasImplicitScrolling` and `onScrollToOffset` are set only when `maxScrollExtent > 0`, so assistive technology ("iOS's VoiceOver focus engine") can scroll through `SemanticsAction.scrollToOffset`.

```dart
  @override
  void describeSemanticsConfiguration(SemanticsConfiguration config) {
    super.describeSemanticsConfiguration(config);
    // This grid only truly scrolls vertically - horizontal offset is a
    // rubber-band tilt that always springs back to 0, not a way to reach
    // different content - so only the vertical axis is reported here.
    final double maxScrollExtent = _maxScrollExtent;
    config
      ..isSemanticBoundary = true
      ..scrollPosition = _verticalOffset
      ..scrollExtentMin = 0.0
      ..scrollExtentMax = maxScrollExtent
      ..scrollChildCount = _lazyChildDelegate.childCount;
    if (maxScrollExtent > 0.0) {
      config
        ..hasImplicitScrolling = true
        ..onScrollToOffset = (Offset targetOffset) => _jumpTo(targetOffset.dy);
    }
  }

  // Invoked by assistive technology (e.g. iOS's VoiceOver focus engine) via
  // the SemanticsAction.scrollToOffset handler in describeSemanticsConfiguration.
  void _jumpTo(double offset) {
    _verticalFling.stop();
    _verticalOffset = offset.clamp(0.0, _maxScrollExtent);
    markNeedsLayout();
    markNeedsSemanticsUpdate();
  }
```

API check: none of these `SemanticsConfiguration` members is deprecated; `onScrollToOffset` is a `ScrollToOffsetHandler?` (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration-class.html).

## Debug properties

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) "There are a number of properties that you might want to report to Flutter's debugger. However, in this case, the app grid only reports the following." This block does not compile as written; the fix is under [Flagged problems](#flagged-problems).

```dart
  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties.add(IntProperty('childCount', childCount));
    properties.add(DoubleProperty('verticalOffset', _controller.verticalOffset));
    properties.add(DoubleProperty('horizontalOffset', _controller.horizontalOffset));
  }
```

## Flagged problems

Found by checking the article's code against itself and against api.flutter.dev (fetched 2026-10-17). The article (no version stated) is wrong in the spots below.

**1. Does not compile: `_controller` in `debugFillProperties`.** No `_controller` exists in any snippet; every other block reads and writes the fields `_verticalOffset` and `_horizontalOffset` directly. Corrected lines:

```dart
    properties.add(DoubleProperty('verticalOffset', _verticalOffset));
    properties.add(DoubleProperty('horizontalOffset', _horizontalOffset));
```

**2. Wrong comment: the `LazyChildDelegate` doc comment names `WatchAppGridLayoutElement`.** The element class is `WatchAppGridElement`. Corrected line:

```dart
/// Interface between [RenderWatchAppGridLayout] and [WatchAppGridElement] for
```

**3. Missing pieces.** The article ends with "Full Source Code ... TODO: Link to repo", and these are used but never shown, so the snippets do not run on their own:

- `_WatchAppGridLayoutParentData` (with a nullable `int? index`) and the render object's mixins that supply `firstChild`, `childAfter`, `insert`, `move`, `remove`, `defaultPaint` and `defaultHitTestChildren` (see [CHILD-MODELS.md](CHILD-MODELS.md) and [PARENT-DATA.md](PARENT-DATA.md)).
- The `RenderWatchAppGridLayout` constructor taking `childManager` and `onAppPressed`, the `_lazyChildDelegate` field, the `onAppPressed` setter and the `tickingEnabled` setter.
- `_pan` and its setup (`onUpdate = _onPanUpdate`, `onEnd = _onPanEnd`), `_tapDownPosition`, `_verticalFling` and `_horizontalSpring` (each is given a simulation with `animateWith` and stopped with `stop()`).
- `_FlingSnapSimulation`, `_reportScrollExtent`, `_hitTestChildIndex`, `_maxScrollExtent`, `_rowHeight`, `_firstRowCenterOffset`, `_kOverscrollFriction`, `_kHorizontalFriction`.

**4. No SDK version.** The article gives no Flutter version. `TickerMode.getValuesNotifier`/`TickerModeData` and `SemanticsConfiguration.onScrollToOffset` exist on api.flutter.dev as of 2026-10-17; confirm both exist in your SDK at the URLs above.

## Similar implementations

[renderobjects](https://renderobjects.com/examples/apple-watch-app-grid/) The example "demonstrates the fundamentals of building render objects with virtualized children (lazily built children)". The same approach applies to:

- Long lists of widgets
- Unbounded lists of widgets
- Scrollable tables/spreadsheets
- Infinite Canvas

## Prove it

- After filling in the missing pieces, `flutter analyze` reports no error on `debugFillProperties` (it would on the article's `_controller` lines).
- Scroll from top to bottom and back with a large `childCount`: no assertion about child order, and the element's `_childElements` only ever holds the visible window (step 2 of [Layout](#layout) is what keeps this true).
- Drag past the top or bottom: the grid moves with friction and settles back inside the extent on release; drag sideways: it springs back to horizontal offset 0.
- A touch that moves no more than `kTouchSlop` (18.0) calls `onAppPressed` with the icon's index; a longer drag does not.
- Wrap the grid in `TickerMode(enabled: false, ...)` in a widget test: `tickingEnabled` goes false on the render object.
- With VoiceOver or TalkBack on and more icons than fit, the grid announces as scrollable and moving focus scrolls it; with everything on screen (`maxScrollExtent == 0`), no scroll action is offered.
- The `debugFillProperties` output in the widget inspector shows `childCount`, `verticalOffset` and `horizontalOffset`.
