# Diagnostics

How a custom render object shows up in the DevTools inspector, `debugDumpRenderTree()`, error messages and logs: `debugFillProperties` and its property types, defaults and levels, reading a dump, `debugDescribeChildren`, `toStringShort`, debug-only asserts and state, `debugPaint`, and what never to put in diagnostics. Sources: the renderobjects.com diagnostics guide and `debugFillProperties` / `debugPaint` API pages (Matt Carroll; no Flutter version stated), checked against api.flutter.dev and Flutter master source. Where the source is wrong, the official form comes first, then one line on what renderobjects.com says. Element diagnostics are in [ELEMENTS.md](ELEMENTS.md#element-diagnostics).

**Contents:** [Why it matters](#why-it-matters) · [debugFillProperties](#debugfillproperties) · [Property types](#property-types) · [Defaults and levels](#defaults-and-levels) · [Reading a dump](#reading-a-dump) · [Children](#children) · [toStringShort](#tostringshort) · [Asserts and debug-only state](#asserts-and-debug-only-state) · [debugPaint](#debugpaint) · [Pitfalls](#pitfalls) · [Prove it](#prove-it)

## Why it matters

- **Everything you debug with runs on diagnostics:** the DevTools widget inspector, `debugDumpRenderTree()`, framework error messages (which print `toStringDeep` as context), `toString` / `toStringShort` in logs, test failures and IDE debuggers. Without it a custom render object shows only its class name and hash [renderobjects](https://renderobjects.com/guides/diagnostics/).
- "every hour spent making your render object debuggable saves five hours of debugging it later" (the author's estimate, not a measurement) [renderobjects](https://renderobjects.com/guides/diagnostics/).
- **Undescribed, a custom object dumps like this** [renderobjects](https://renderobjects.com/guides/diagnostics/):

```
RenderView#a4f21
 │ debug mode enabled - macos
 │ view size: Size(1280.0, 800.0) (in physical pixels)
 │ device pixel ratio: 2.0 (physical pixels per logical pixel)
 │ configuration: BoxConstraints(w=640.0, h=400.0) at 2.0x (in logical pixels)
 │
 └─child: RenderPadding#b9c33
   │ parentData: <none>
   │ constraints: BoxConstraints(w=640.0, h=400.0)
   │ size: Size(640.0, 400.0)
   │ padding: EdgeInsets.all(16.0)
   │
   └─child: RenderCustomBadge#7d8e2
       parentData: offset=Offset(16.0, 16.0)
       constraints: BoxConstraints(w=608.0, h=368.0)
       size: Size(120.0, 32.0)
```

## debugFillProperties

- **`RenderObject` extends `Diagnosticable`.** Override `debugFillProperties(DiagnosticPropertiesBuilder properties)`; `toString`, `toStringShallow`, `toStringDeep`, the inspector and error reporters all derive from it [renderobjects](https://renderobjects.com/guides/diagnostics/). It is called "when producing a debug description of a render object, in the widget inspector, in `toString()` output, and in the diagnostics printed when an assertion fails" [renderobjects](https://renderobjects.com/api/debugging/debugFillProperties/). https://api.flutter.dev/flutter/foundation/Diagnosticable/debugFillProperties.html
- **The pattern** [renderobjects](https://renderobjects.com/guides/diagnostics/):

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(DoubleProperty('spacing', _spacing));
  properties.add(EnumProperty<Axis>('direction', _direction));
  properties.add(DiagnosticsProperty<Color>('color', _color));
  properties.add(FlagProperty(
    'enabled',
    value: _enabled,
    ifFalse: 'disabled',
  ));
}
```

  Output: `spacing: 8.0`, `direction: horizontal`, `color: Color(0xff336699)`, `disabled` (a `FlagProperty` with `ifFalse` prints the single word).
- **Call `super.debugFillProperties` first:** base classes add size, constraints, attached state and dirty flags [renderobjects](https://renderobjects.com/guides/diagnostics/). In Flutter master the base `RenderObject` adds `needsCompositing`, `creator`, `parentData`, `constraints` (`missingIfNull: true`), `layer`, `semantics node`, and the `isBlockingSemanticsOfPreviouslyPaintedNodes` and `isSemanticBoundary` flags.
- **Keep it cheap.** It runs on every DevTools refresh, tree dump and error format; cache derived values [renderobjects](https://renderobjects.com/guides/diagnostics/).

## Property types

- **The types** [renderobjects](https://renderobjects.com/guides/diagnostics/):
  - `StringProperty`: quoting, show or hide when empty.
  - `IntProperty`.
  - `DoubleProperty`: with a unit string (degrees, pixels).
  - `PercentProperty`: 0.0 to 1.0 shown as a percentage.
  - `EnumProperty<T>`: prints the case name, `horizontal`, from `value?.name` (https://api.flutter.dev/flutter/foundation/EnumProperty-class.html).
  - `FlagProperty`: show only the interesting side.
  - `IterableProperty<T>`: comma list with truncation.
  - `ColorProperty`, `IconDataProperty`.
  - `TransformProperty`: a `Matrix4` as a multi-line matrix.
  - `DiagnosticsProperty<T>`: the catch-all.
  - renderobjects.com says `EnumProperty` prints `Axis.horizontal`; its own dump shows `horizontal`, which is what master prints.
- **Imports:** `StringProperty`, `IntProperty`, `DoubleProperty`, `PercentProperty`, `FlagProperty`, `IterableProperty` and `EnumProperty` are in `foundation` (`diagnostics.dart`); `ColorProperty` and `TransformProperty` are in `painting` (`colors.dart`, `matrix_utils.dart`); `IconDataProperty` is in `widgets` (`icon_data.dart`) (Flutter master).
- **Typed properties** [renderobjects](https://renderobjects.com/api/debugging/debugFillProperties/):

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(StringProperty('label', _label));
  properties.add(ColorProperty('color', _color));
  properties.add(DoubleProperty('strokeWidth', _strokeWidth));
  properties.add(IntProperty('itemCount', _itemCount));
  properties.add(FlagProperty('enabled', value: _enabled, ifTrue: 'enabled', ifFalse: 'disabled'));
}
```

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(EnumProperty<Axis>('direction', _direction));
  properties.add(DiagnosticsProperty<EdgeInsets>('padding', _padding));
  properties.add(DiagnosticsProperty<BorderRadius>('borderRadius', _borderRadius));
}
```

  `IterableProperty`: "Each element is printed on its own line in the inspector":

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(IterableProperty<String>('labels', _labels));
}
```

- **Generic vs specialized output.** The same object with `DiagnosticsProperty` everywhere, then with the specialized types [renderobjects](https://renderobjects.com/guides/diagnostics/):

```
└─child: RenderCustomBadge#7d8e2
    spacing: 8.0
    direction: Axis.horizontal
    color: Color(0xff336699)
    enabled: false
    progress: 0.75
    transform: [1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0,0.0,20.0,0.0,0.0,1.0]
```

```
└─child: RenderCustomBadge#7d8e2
    spacing: 8.0
    direction: horizontal
    color: Color(0xff336699)
    disabled
    progress: 75.0%
    transform:
      [0] 1.0,0.0,0.0,0.0
      [1] 0.0,1.0,0.0,0.0
      [2] 0.0,0.0,1.0,0.0
      [3] 20.0,0.0,0.0,1.0
```

## Defaults and levels

- **`defaultValue` hides a property equal to its default.** "A render object with twenty properties, eighteen of which are at their defaults, should display two" [renderobjects](https://renderobjects.com/guides/diagnostics/):

```dart
properties.add(DoubleProperty('spacing', _spacing, defaultValue: 0.0));
properties.add(EnumProperty<Axis>('direction', _direction, defaultValue: Axis.horizontal));
properties.add(DiagnosticsProperty<Color>('color', _color, defaultValue: const Color(0xff000000)));
properties.add(PercentProperty('progress', _progress, defaultValue: 1.0));
```

- **`level`:** the `DiagnosticLevel` enum in Flutter master is `hidden, fine, debug, info, warning, hint, summary, error, off`. `info` is the default; `fine` is hidden by default and shown in verbose dumps; `hidden` is more aggressive; `warning` is noteworthy; `error` is a problem [renderobjects](https://renderobjects.com/guides/diagnostics/). https://api.flutter.dev/flutter/foundation/DiagnosticLevel.html
  - renderobjects.com lists only `info`, `fine`, `hidden`, `warning` and `error`.
- **`defaultValue` or `level` to hide the uninteresting case** [renderobjects](https://renderobjects.com/api/debugging/debugFillProperties/):

```dart
@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  // Hidden when null, only shown in the inspector when a color is set.
  properties.add(ColorProperty('highlightColor', _highlightColor, defaultValue: null));

  // Hidden when false, only shown when the render object is in an error state.
  properties.add(FlagProperty(
    'hasError',
    value: _hasError,
    ifTrue: 'ERROR',
    level: _hasError ? DiagnosticLevel.warning : DiagnosticLevel.hidden,
  ));
}
```

## Reading a dump

- **A stuck object** dumps as `RenderCustomBadge#7d8e2 NEEDS-LAYOUT NEEDS-PAINT` with `constraints: MISSING` and `size: MISSING` [renderobjects](https://renderobjects.com/guides/diagnostics/).
- **Where the markers come from:** `NEEDS-LAYOUT` and `NEEDS-PAINT` (also `DISPOSED`, `DETACHED`, `relayoutBoundary=upN` and `NEEDS-COMPOSITING-BITS-UPDATE`) are appended to the header by `RenderObject.toStringShort()` in non-release builds; `MISSING` comes from `DiagnosticsProperty(..., missingIfNull: true)` (Flutter master `object.dart`). https://api.flutter.dev/flutter/rendering/RenderObject/toStringShort.html
  - renderobjects.com (no version stated) says the capitalized warnings come from properties the base class sets at `DiagnosticLevel.warning`.

## Children

- **`debugDescribeChildren` for non-standard child storage.** Without it a multi-child object dumps as a leaf. Prefer named slots (`'header'`, `'body'`) over `'child 0'`, `'child 1'` [renderobjects](https://renderobjects.com/guides/diagnostics/):

```dart
@override
List<DiagnosticsNode> debugDescribeChildren() {
  final children = <DiagnosticsNode>[];
  RenderBox? child = firstChild;
  int index = 0;
  while (child != null) {
    children.add(child.toDiagnosticsNode(name: 'child ${index++}'));
    child = childAfter(child);
  }
  return children;
}
```

- **What you get without writing it** (Flutter master): `ContainerRenderObjectMixin` overrides `debugDescribeChildren` and labels children `'child 1'`, `'child 2'` and so on (counting from 1); `RenderObjectWithChildMixin` labels its single child `'child'`; the base `RenderObject` returns `[]`. https://api.flutter.dev/flutter/rendering/ContainerRenderObjectMixin-mixin.html. Child models: [CHILD-MODELS.md](CHILD-MODELS.md).
  - renderobjects.com (no version stated) says `RenderBoxContainerDefaultsMixin` provides the default.

## toStringShort

- **Add one or two distinguishing fields** so errors name the instance [renderobjects](https://renderobjects.com/guides/diagnostics/):

```dart
@override
String toStringShort() {
  return '${objectRuntimeType(this, 'RenderCustomBadge')}(label: "$_label")';
}
```

  `RenderCustomBadge#7d8e2 was given infinite width.` becomes `RenderCustomBadge(label: "New") was given infinite width.`
- **Caveat from the source check:** this override drops the base header's `#hash` and the `NEEDS-LAYOUT` / `NEEDS-PAINT` / `relayoutBoundary` markers (see [Reading a dump](#reading-a-dump)). Building on `super.toStringShort()` keeps them. This is read from master source; the guide does not mention it.
- **`objectRuntimeType(Object? object, String optimizedValue)`** returns `runtimeType.toString()` when asserts are enabled, else `optimizedValue`. https://api.flutter.dev/flutter/foundation/objectRuntimeType.html
  - renderobjects.com says "debug builds"; the precise condition is "asserts enabled".

## Asserts and debug-only state

- **Assert invariants; asserts are stripped in release** [renderobjects](https://renderobjects.com/guides/diagnostics/):

```dart
set spacing(double value) {
  assert(value >= 0, 'spacing must be non-negative; got $value');
  if (_spacing == value) return;
  _spacing = value;
  markNeedsLayout();
}

@override
void performLayout() {
  assert(constraints.hasBoundedWidth,
      '$runtimeType requires a bounded width; received $constraints');
  // ... rest of layout
}
```

  Include the offending value in the message; name the render object; never assert something that can legitimately be false in normal use: asserts that fire on valid input "train developers to ignore asserts" [renderobjects](https://renderobjects.com/guides/diagnostics/).
- **Debug-only state with `assert(() { ...; return true; }())`** [renderobjects](https://renderobjects.com/guides/diagnostics/), the same idiom master uses (for example in `objectRuntimeType`):

```dart
BoxConstraints? _debugLastConstraints;

@override
void performLayout() {
  assert(() {
    _debugLastConstraints = constraints;
    return true;
  }());
  // ... rest of layout
}

@override
void debugFillProperties(DiagnosticPropertiesBuilder properties) {
  super.debugFillProperties(properties);
  properties.add(DiagnosticsProperty<BoxConstraints>(
    'last constraints',
    _debugLastConstraints,
    defaultValue: null,
  ));
}
```

  In release the closure is stripped, the field stays null and the `defaultValue: null` property prints nothing. Use it for "sized right on frame 1, wrong on frame 2" bugs [renderobjects](https://renderobjects.com/guides/diagnostics/).

## debugPaint

- **When it runs** (Flutter master `object.dart`): the framework calls `debugPaint(context, offset)` inside an `assert(() { ... }())` right after every `paint` in debug builds, whatever the debug flags. `RenderObject.debugPaint` is empty ("Override this method to paint debugging information."), but `RenderBox.debugPaint` is not: it runs `_debugVerifyDryBaselines()` when `debugCheckIntrinsicSizes` is set and draws `debugPaintSize` when `debugPaintSizeEnabled` is set (plus pointer and baseline painting). So an override that should draw only under a flag has to check it itself, and calling `super.debugPaint(context, offset)` keeps the `RenderBox` overlays. https://api.flutter.dev/flutter/rendering/RenderObject/debugPaint.html, https://api.flutter.dev/flutter/rendering/debugPaintSizeEnabled.html
  - renderobjects.com (no version stated) says it is called only when `debugPaintSizeEnabled` or another debug painting flag is set, and shows the default as empty (true for `RenderObject`, wrong for `RenderBox`).
- **Draw on `context.canvas`; avoid pushing new layers.** Everything drawn there is stripped from production [renderobjects](https://renderobjects.com/api/debugging/debugPaint/).
- **Bounding box,** with the flag check and `super` call added to the source's snippet (its `assert` wrapper is redundant because the call site is already inside an assert, but harmless):

```dart
@override
void debugPaint(PaintingContext context, Offset offset) {
  super.debugPaint(context, offset);
  assert(() {
    if (debugPaintSizeEnabled) {
      context.canvas.drawRect(
        offset & size,
        Paint()
          ..color = const Color(0xFF00FFFF)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0,
      );
    }
    return true;
  }());
}
```

- **More overlays, verbatim** (padding, child slots, baseline, clip) [renderobjects](https://renderobjects.com/api/debugging/debugPaint/). Add the same `super.debugPaint(context, offset);` call and `if (debugPaintSizeEnabled)` check to each.

```dart
@override
void debugPaint(PaintingContext context, Offset offset) {
  assert(() {
    final Canvas canvas = context.canvas;
    final Paint outerPaint = Paint()
      ..color = const Color(0xFF00FFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    final Paint innerPaint = Paint()
      ..color = const Color(0xFFFF9800)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // Outer bounds.
    canvas.drawRect(offset & size, outerPaint);
    // Inner content area after padding.
    canvas.drawRect(_padding.deflateRect(offset & size), innerPaint);
    return true;
  }());
}
```

```dart
@override
void debugPaint(PaintingContext context, Offset offset) {
  assert(() {
    final Paint slotPaint = Paint()
      ..color = const Color(0xFF4CAF50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    if (_leading != null) {
      final BoxParentData pd = _leading!.parentData! as BoxParentData;
      context.canvas.drawRect(
        (offset + pd.offset) & _leading!.size,
        slotPaint,
      );
    }
    if (_trailing != null) {
      final BoxParentData pd = _trailing!.parentData! as BoxParentData;
      context.canvas.drawRect(
        (offset + pd.offset) & _trailing!.size,
        slotPaint,
      );
    }
    return true;
  }());
}
```

```dart
@override
void debugPaint(PaintingContext context, Offset offset) {
  assert(() {
    final double? baseline =
        getDistanceToBaseline(TextBaseline.alphabetic, onlyReal: true);
    if (baseline != null) {
      context.canvas.drawLine(
        Offset(offset.dx, offset.dy + baseline),
        Offset(offset.dx + size.width, offset.dy + baseline),
        Paint()
          ..color = const Color(0xFFFF4081)
          ..strokeWidth = 1.0,
      );
    }
    return true;
  }());
}
```

```dart
@override
void debugPaint(PaintingContext context, Offset offset) {
  assert(() {
    context.canvas.drawRRect(
      _clipRRect.shift(offset),
      Paint()
        ..color = const Color(0xFFE040FB)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0,
    );
    return true;
  }());
}
```

## Pitfalls

From [renderobjects](https://renderobjects.com/guides/diagnostics/):

- Forgetting `super.debugFillProperties`.
- `DiagnosticsProperty<T>` for everything (use `ColorProperty` for colors).
- Omitting `defaultValue`.
- Expensive work in `debugFillProperties`.
- Asserting things that are not invariants.
- **Sensitive data in diagnostics:** no passwords, tokens or raw user content. Expose presence ("has value: true") or a redacted summary. See [secure-coding SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).
- Skipping diagnostics entirely.

## Prove it

- `debugDumpRenderTree()` (or the DevTools inspector) shows each custom render object's configured properties, with defaults hidden.
- Every `debugFillProperties` override calls `super` first and uses the specialized property types (`ColorProperty`, `EnumProperty`, `FlagProperty`, `PercentProperty`).
- Multi-child objects that do not use `ContainerRenderObjectMixin` or `RenderObjectWithChildMixin` override `debugDescribeChildren`; slotted ones use slot names.
- Every `debugPaint` override calls `super.debugPaint` and checks `debugPaintSizeEnabled` (or another flag) before drawing.
- No password, token or raw user text appears in any property.
- Assert messages include the offending value, and no assert fires on valid input.
