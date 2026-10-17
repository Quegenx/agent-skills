# Example: Nest-style thermostat

A worked example from renderobjects.com (Matt Carroll): a fully interactive thermostat dial built as one leaf `RenderBox` with no child widgets. It covers square layout, baseline reporting from text measured during layout, direct `Canvas` painting, whole-box hit testing, tap and pan recognizers inside the render object, debug paint of touch regions, slider-like semantics, and debug properties. The code below is copied from the article; the only change is that em dashes inside code comments are written as " - " (repo rule). Two blocks do not compile as written and helpers are left out; see [Flagged problems](#flagged-problems). No Flutter version is stated in the article. The other examples are [EXAMPLE-WATCH-GRID.md](EXAMPLE-WATCH-GRID.md) and [EXAMPLE-MESSAGE-ATTACHMENT.md](EXAMPLE-MESSAGE-ATTACHMENT.md); the skill's router is [SKILL.md](SKILL.md).

**Contents:** [What it builds](#what-it-builds) · [Techniques used](#techniques-used) · [The fake state around it](#the-fake-state-around-it) · [Layout](#layout) · [Baseline](#baseline) · [Paint](#paint) · [Hit testing](#hit-testing) · [Gesture recognition](#gesture-recognition) · [Debug paint](#debug-paint) · [Semantics](#semantics) · [Debug properties](#debug-properties) · [Flagged problems](#flagged-problems) · [Similar implementations](#similar-implementations) · [Prove it](#prove-it)

## What it builds

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) The goal is "a fully interactive thermostat dial using nothing but a custom `RenderBox`", with "no nested widgets, just direct `Canvas` painting, layout, hit-testing, and gesture handling". The user drags the ring or taps the +/- buttons to change the target temperature. It paints "a background, a temperature dial, up/down buttons, the current temperature, and the current heating/cooling mode text".

## Techniques used

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) Where each technique is explained in this skill:

| Technique in this example | Read |
| --- | --- |
| Childless `performLayout` that only sets `size`, a fallback size when unbounded, `computeDistanceToActualBaseline` | [LAYOUT.md](LAYOUT.md) |
| Leaf painting: `save`, `translate(offset)`, paint in local coordinates, `restore`; a `TextPainter` laid out in `performLayout` | [PAINTING.md](PAINTING.md) |
| `hitTestSelf => true`, `TapGestureRecognizer` and `PanGestureRecognizer` fed from `handleEvent` | [HIT-TESTING.md](HIT-TESTING.md) |
| `debugPaint` of touch regions behind `debugPaintSizeEnabled` and `assert`, `debugFillProperties` with `hasSize` guards | [DIAGNOSTICS.md](DIAGNOSTICS.md) |
| Slider-like semantics: `value`, `increasedValue`, `decreasedValue`, `onIncrease`, `onDecrease` | [SEMANTICS.md](SEMANTICS.md) |

## The fake state around it

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) The example "fakes various pieces of information and state that would otherwise come from a physical device and/or server." The render object never stores the new value: it calls `onTargetTempChanged`, and the parent's `setState` rebuilds the `Thermostat` widget with it.

```dart
class _ThermostatPageState extends State<ThermostatPage> {
  static const double _currentTemp = 65;

  double _targetTemp = 72;

  ThermostatMode get _mode {
    if (_targetTemp > _currentTemp) return ThermostatMode.heating;
    if (_targetTemp < _currentTemp) return ThermostatMode.cooling;
    return ThermostatMode.off;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          // This is our Thermostat widget, which includes our custom render object.
          child: Thermostat(
            targetTemp: _targetTemp,
            currentTemp: _currentTemp,
            mode: _mode,
            minTemp: 50,
            maxTemp: 90,
            // This callback allows our thermostat render object to change the
            // fake target temperature using taps and drags, within itself.
            onTargetTempChanged: (t) => setState(() => _targetTemp = t),
          ),
        ),
      ),
    );
  }
}
```

## Layout

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "Layout has two responsibilities: choose a `size`, and layout children. The thermostat has no children, so it just needs to select a `size`. As a matter of preference, the thermostat makes itself into a square that fits within the given constraints."

```dart
  @override
  void performLayout() {
    size = _squareSize(constraints);
  }
```

## Baseline

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "The thermostat includes some text, which means it should support the concept of a text "baseline"." It overrides `computeDistanceToActualBaseline(baseline)` to report where the baseline sits. The article: "it's called after `layout()` but before `paint()`. So if we only layout text during `paint()`, then `computeDistanceToActualBaseline(baseline)` won't yet know where the baseline sits. Therefore, the thermostat runs layout on its text during `layout()`." So it lays the `TextPainter` out in `performLayout`, caches one baseline per `TextBaseline` value, and returns it. When unbounded it falls back to an arbitrary 300 px square. This block does not compile as written (`baselines`); the fix is under [Flagged problems](#flagged-problems).

```dart
  @override
  void performLayout() {
    size = _squareSize(constraints);

    // Calculate text layout during layout instead of paint, to support baseline
    // reporting.
    //
    // The debug baseline query might happen before `paint()` is called, but
    // it's called after `layout()`. We measure here so that the results are
    // available to both the baseline query, and to `paint()`, instead of
    // running this measurement in two different places.
    final width = size.width;
    final textPainter = TextPainter(
      text: TextSpan(
        text: _targetTemp.round().toString(),
        style: TextStyle(
          fontSize: width * 0.22,
          fontWeight: FontWeight.w800,
          height: 1.0,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final modeOffset = _mode != ThermostatMode.off ? width * 0.04 : 0.0;
    final textTop = size.height / 2 + modeOffset - textPainter.height / 2;
    for (final baseline in TextBaseline.values) {
      _baselines[baselines] = textTop + textPainter.computeDistanceToActualBaseline(baseline);
    }
  }

  Size _squareSize(BoxConstraints constraints) {
    final side = math.min(
      // Note: We arbitrarily choose 300px as our intrinsic width/height when
      //       no bounds are given.
      constraints.maxWidth.isFinite ? constraints.maxWidth : 300.0,
      constraints.maxHeight.isFinite ? constraints.maxHeight : 300.0,
    );
    return constraints.constrain(Size(side, side));
  }

  /// Returns the distance from the top of the widget to the alphabetic or
  /// ideographic baseline of the temperature numeral, so the thermostat can
  /// participate in baseline-aligned rows.
  @override
  double? computeDistanceToActualBaseline(TextBaseline baseline) =>
      _baselines[baseline];
```

API check (https://api.flutter.dev/flutter/rendering/RenderBox-class.html): the signature is `double? computeDistanceToActualBaseline(TextBaseline baseline)`, and `getDistanceToActualBaseline` calls it and caches the result. The page gives no timing beyond that; "called after `layout()` but before `paint()`" is the article's own claim. The same page lists `double? computeDryBaseline(covariant BoxConstraints constraints, TextBaseline baseline)` (backing `getDryBaseline`); this example implements neither it nor `computeDryLayout`. The page does not say they are required, so this is a gap, not an error.

## Paint

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "The specific `Canvas` calls aren't the focus of this example, so the following code shows you the `paint()` method, but not the individual methods that paint the various shapes and paths." Save, translate by `offset`, paint each part in local coordinates, restore.

```dart
  @override
  void paint(PaintingContext context, Offset offset) {
    final canvas = context.canvas;
    canvas.save();
    canvas.translate(offset.dx, offset.dy);

    _paintBackground(canvas);
    _paintTicks(canvas);
    _paintButtonArcs(canvas);
    _paintCenterText(canvas);
    _paintButtons(canvas);

    canvas.restore();
  }
```

## Hit testing

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "While only part of the thermostat involves gestures, the whole rectangle visually presents the thermostat. Therefore, the thermostat render object reports its entire self as hittable."

```dart
  @override
  bool hitTestSelf(Offset position) => true;
```

## Gesture recognition

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) The dial can be tapped or dragged, and the up/down buttons tapped. "These gestures must be handled with the standard gesture recognition system, but registered inside the render object, instead of registered in the widget tree." First the recognizers and the pan bookkeeping:

```dart
late final TapGestureRecognizer _tap;
late final PanGestureRecognizer _pan;
double? _lastPanAngle;
double _panAccum = 0;
```

"The thermostat is responsible for initializing and disposing the recognizers." The constructor's parameters are elided in the article as `{ /**/ }`.

```dart
  // Initialization
  RenderThermostat({ /**/ }) {
    _tap = TapGestureRecognizer()..onTapUp = _onTapUp;

    _pan = PanGestureRecognizer()
      ..onStart = _onPanStart
      ..onUpdate = _onPanUpdate;

    //...
  }

  // Disposal
  @override
  void dispose() {
    _tap.dispose();
    _pan.dispose();

    super.dispose();
  }
```

"All `RenderBox`s have a method that's called when a gesture interacts with it." Forward each `PointerDownEvent` to both recognizers:

```dart
  @override
  void handleEvent(PointerEvent event, BoxHitTestEntry entry) {
    if (event is PointerDownEvent) {
      _tap.addPointer(event);
      _pan.addPointer(event);
    }
  }
```

Then the actions. Taps are resolved from `localPosition`: a button first, else a point on the ring maps to a temperature. A pan accumulates angle deltas normalized to (−π, π] "so short-arc motion never wraps the temperature", and accumulates "as float so slow drags don't stutter; emit as integer".

```dart
  void _onTapUp(TapUpDetails d) {
    final pos = d.localPosition;
    switch (_buttonAt(pos)) {
      case _ButtonHit.down:
        // User tapped the down button.
        _emit((_targetTemp - 1).clamp(_minTemp, _maxTemp));
        return;
      case _ButtonHit.up:
        // User tapped the up button.
        _emit((_targetTemp + 1).clamp(_minTemp, _maxTemp));
        return;
      case _ButtonHit.none:
        break;
    }

    if (_onRing(pos)) {
      // User tapped somewhere on the temperature dial.
      final angle = _rawAngle(pos);
      if (_angleInDial(angle)) {
        _emit(_angleToTemp(angle).roundToDouble());
      }
    }
  }

  void _onPanStart(DragStartDetails d) {
    // The user started panning.
    _lastPanAngle = _rawAngle(d.localPosition);
    _panAccum = _targetTemp;
  }

  void _onPanUpdate(DragUpdateDetails d) {
    if (_lastPanAngle == null) {
      return;
    }

    // Accumulate distance along the temperature dial as the user pans.
    final cur = _rawAngle(d.localPosition);
    var delta = cur - _lastPanAngle!;
    // Normalize to (−π, π] so short-arc motion never wraps the temperature.
    while (delta > math.pi) { 
      delta -= _kTwoPi; 
    }
    while (delta < -math.pi) { 
      delta += _kTwoPi; 
    }
    _lastPanAngle = cur;

    // Accumulate as float so slow drags don't stutter; emit as integer.
    _panAccum = (_panAccum + delta / _kSweepAngle * (_maxTemp - _minTemp))
            .clamp(_minTemp, _maxTemp);

    // Update the desired temperature based on how far along the dial
    // the user has dragged.
    _emit(_panAccum.roundToDouble());
  }

  void _emit(double temp) => _onTargetTempChanged?.call(temp);
```

## Debug paint

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "The user can see the final painting, but a developer can't see the touch regions. Let's use debug paint to display those touch regions, which can help diagnose touch interaction bugs." Two rules from the code's comments:

- "The `debugPaint()` method is always run for debug builds, not just when debugging tools activate guidelines." Check `debugPaintSizeEnabled` and paint nothing when it is false.
- Put the painting in `assert(() { ...; return true; }())` "so that it's not even compiled into a release build".

This block does not compile as written (the `_circle` helper); the fix is under [Flagged problems](#flagged-problems).

```dart
  @override
  void debugPaint(PaintingContext context, Offset offset) {
    super.debugPaint(context, offset);

    // The `debugPaint()` method is always run for debug builds, not just when
    // debugging tools activate guidelines. To make sure we only paint these
    // paths when a developer asks for it, we need to check one of Flutter's
    // standard debug paint variables. If it's `false`, we paint nothing.
    if (!debugPaintSizeEnabled) {
      return;
    }

    // The following code paints paths around the dial regions that are
    // tappable and draggable. This helps debug gesture issues.
    //
    // This code is placed into an assert() so that it's not even compiled
    // into a release build. By doing this in all render objects, the size
    // of the release build is reduced, and it's guaranteed that this code
    // will never run in production.
    assert(() {
      final canvas = context.canvas;
      canvas.save();
      canvas.translate(offset.dx, offset.dy);

      final c = _center;
      final r = _dialR;
      const inset = 8.0;
      const len = 0.18;
      final outerR = r - inset;
      final innerR = outerR - len * r;
      final arcR = (outerR + innerR) / 2;

      // Dial outer boundary (where the ring sits against the background).
      _circle(r, const Color(0xFF00FFFF));
      // Outer edge of notch band.
      _circle(outerR, const Color(0xFF00FF00));
      // Inner edge of notch band.
      _circle(innerR, const Color(0xFFFF00FF));

      // Gap arc - the region reserved for buttons, filled with a translucent
      // orange stroke at the mid-radius of the notch band.
      final gapStart = _kStartAngle + _kSweepAngle;
      final gapSweep = _kTwoPi - _kSweepAngle;
      canvas.drawArc(
        Rect.fromCircle(center: c, radius: arcR),
        gapStart,
        gapSweep,
        false,
        Paint()
          ..color = const Color(0x80FF8000)
          ..style = PaintingStyle.stroke
          ..strokeWidth = outerR - innerR
          ..strokeCap = StrokeCap.butt,
      );

      // Button centre markers - red crosshairs at each button's logical centre.
      for (final deg in [_kUpArcCenterDeg, _kDownArcCenterDeg]) {
        final pos = _buttonCenter(deg);
        const arm = 6.0;
        final paint = Paint()
          ..color = const Color(0xFFFF0000)
          ..strokeWidth = 1.5;
        canvas.drawLine(pos - Offset(arm, 0), pos + Offset(arm, 0), paint);
        canvas.drawLine(pos - Offset(0, arm), pos + Offset(0, arm), paint);
        canvas.drawCircle(pos, 3, Paint()..color = const Color(0xFFFF0000));
      }

      canvas.restore();
      return true;
    }());
  }

  void _circle(double radius, Color color) => canvas.drawCircle(
    c,
    radius,
    Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0,
    );
```

API check: the framework's own `RenderBox.debugPaint` body is wrapped in `assert(() { ... return true; }())`, consistent with the advice above; the page does not say whether the framework calls `debugPaint` only in debug mode (https://api.flutter.dev/flutter/rendering/RenderBox/debugPaint.html). `debugPaintSizeEnabled` defaults to `false` (https://api.flutter.dev/flutter/rendering/debugPaintSizeEnabled.html).

## Semantics

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "The thermostat needs to advertise the current temperature, the target temperature, heating/coooling mode, and the ability to increase/decrease the target temperature." It sets `label`, a `value` combining target, mode and current temperature, `increasedValue`/`decreasedValue`, a `hint`, `isEnabled = true` and `isSemanticBoundary = true`. `onIncrease` and `onDecrease` are null when there is no change callback.

```dart
  @override
  void describeSemanticsConfiguration(SemanticsConfiguration config) {
    super.describeSemanticsConfiguration(config);

    final target = _targetTemp.round();
    final increased = (target + 1).clamp(_minTemp.round(), _maxTemp.round());
    final decreased = (target - 1).clamp(_minTemp.round(), _maxTemp.round());

    config
      ..isSemanticBoundary = true
      ..isEnabled = true
      ..label = 'Thermostat'
      ..value =
          '$target degrees, $_modeLabel, '
          'current temperature ${_currentTemp.round()} degrees'
      ..increasedValue = '$increased degrees'
      ..decreasedValue = '$decreased degrees'
      ..hint = 'Swipe up or down to adjust target temperature';

    config.onIncrease = _onTargetTempChanged == null
        ? null
        : () => _emit((target + 1).toDouble().clamp(_minTemp, _maxTemp));

    config.onDecrease = _onTargetTempChanged == null
        ? null
        : () => _emit((target - 1).toDouble().clamp(_minTemp, _maxTemp));
  }
```

API check: none of these members is deprecated; `isEnabled` is `bool?` (https://api.flutter.dev/flutter/semantics/SemanticsConfiguration-class.html).

## Debug properties

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "With `debugFillProperties()` implemented, the Flutter debugger shows property values at runtime." Size-dependent values are guarded with `hasSize ? ... : null` and `defaultValue: null`.

```dart
  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties
      ..add(DoubleProperty('targetTemp', _targetTemp))
      ..add(DoubleProperty('currentTemp', _currentTemp))
      ..add(EnumProperty<ThermostatMode>('mode', _mode))
      ..add(DoubleProperty('minTemp', _minTemp))
      ..add(DoubleProperty('maxTemp', _maxTemp))
      ..add(DoubleProperty('tempRange', _maxTemp - _minTemp))
      ..add(ObjectFlagProperty<ValueChanged<double>>.has('onTargetTempChanged', _onTargetTempChanged))
      ..add(DoubleProperty('dialRadius', hasSize ? _dialR : null, defaultValue: null))
      ..add(DiagnosticsProperty<Size>('size', hasSize ? size : null, defaultValue: null));
  }
```

## Flagged problems

Found by checking the article's code against itself and against api.flutter.dev (fetched 2026-10-17). The article (no version stated) is wrong in the spots below.

**1. Does not compile: `_baselines[baselines]` in `performLayout`.** The loop variable is `baseline`; `baselines` is undefined. Corrected loop:

```dart
    for (final baseline in TextBaseline.values) {
      _baselines[baseline] = textTop + textPainter.computeDistanceToActualBaseline(baseline);
    }
```

**2. Does not compile: the `_circle` helper.** It uses `canvas` and `c`, which are locals inside `debugPaint`'s `assert` closure, not visible in `_circle`. Corrected helper, passing both in:

```dart
  void _circle(Canvas canvas, Offset c, double radius, Color color) => canvas.drawCircle(
    c,
    radius,
    Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0,
    );
```

and the three calls inside the `assert` closure:

```dart
      _circle(canvas, c, r, const Color(0xFF00FFFF));
      _circle(canvas, c, outerR, const Color(0xFF00FF00));
      _circle(canvas, c, innerR, const Color(0xFFFF00FF));
```

**3. Missing pieces.** The article ends with "Full Source Code ... TODO: Link to repo.", and these are used but never shown, so the snippets do not run on their own:

- The `Thermostat` widget, the `RenderThermostat` constructor parameters (elided as `{ /**/ }`) and setters, `ThermostatMode`, and the `_ButtonHit` enum.
- The `_baselines` map (keyed by `TextBaseline`), `_center`, `_dialR`, `_modeLabel`, and the fields `_targetTemp`, `_currentTemp`, `_mode`, `_minTemp`, `_maxTemp`, `_onTargetTempChanged`.
- `_paintBackground`, `_paintTicks`, `_paintButtonArcs`, `_paintCenterText`, `_paintButtons`.
- `_buttonAt`, `_onRing`, `_rawAngle`, `_angleInDial`, `_angleToTemp`, `_buttonCenter`, and the constants `_kTwoPi`, `_kSweepAngle`, `_kStartAngle`, `_kUpArcCenterDeg`, `_kDownArcCenterDeg`.

## Similar implementations

[renderobjects](https://renderobjects.com/examples/nest-thermostat/) "A similar approach would work equally well for various other render objects", for example "a variety of graphs and charts (e.g., candlestick stock chart)".

## Prove it

- After filling in the missing pieces, `flutter analyze` reports no error in `performLayout` or `debugPaint` (it would on the article's `baselines` and `_circle`).
- Place the thermostat in a `Row` with `crossAxisAlignment: CrossAxisAlignment.baseline` next to a `Text`: the temperature numeral and the text share a baseline.
- Give it unbounded constraints (inside an `UnconstrainedBox`): it lays out as a 300 px square.
- Tap the up and down buttons: the target changes by 1 and stays within `minTemp` to `maxTemp`. Drag slowly along the ring: the number steps smoothly, and dragging across the gap never jumps from one end of the range to the other.
- Turn on `debugPaintSizeEnabled`: the cyan, green and magenta circles, the orange gap arc and the red button crosshairs appear; in a release build none of that code is present.
- With a screen reader, the dial reads "Thermostat" with its value and hint, and swipe up or down changes the target by 1; with `onTargetTempChanged` null, no increase or decrease action is offered.
