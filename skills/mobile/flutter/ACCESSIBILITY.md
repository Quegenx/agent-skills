# Accessibility

Making a Flutter app usable with screen readers, large text, switch and voice control, and low vision. "Flutter's standard widgets generate an accessibility tree automatically", so most of the work is keeping standard widgets, labeling what is custom with `Semantics`, giving every control a real action and a large enough target, and leaving room for large fonts. "We strongly encourage you to include an accessibility checklist as a key criteria before shipping your app." Layout and orientation rules are in [LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md), widget tests in [TESTING.md](TESTING.md), reduced motion in [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md). Semantics for a custom `RenderObject` (`describeSemanticsConfiguration`, `semanticBounds`) is in [flutter-render-objects SEMANTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/SEMANTICS.md); the community text-scale cap and `GestureDetector` hit areas are in [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#text-scale-cap).

## Regulations

- **Standards named:** WCAG 2, EN 301 549 (EU harmonized standard), VPAT; US ADA and Section 508; EU European Accessibility Act (EAA, technical basis EN 301 549).

## Release checklist

- **Active interactions:** no no-op `onPressed`. Every control does something, for example shows a `SnackBar`. The same holds for semantics: "if you set a role flag, provide the corresponding action" ([renderobjects](https://renderobjects.com/guides/semantics/)).
- **Screen reader testing:** with TalkBack (Android) and VoiceOver (iOS), all controls are described intelligibly.
- **Contrast ratios:** "at least 4.5:1 between controls or text and the background, with the exception of disabled components".
- **Context switching:** nothing changes context automatically while the user is typing.
- **Tappable targets:** "at least 48x48 pixels". Padding only counts if it takes taps: a `GestureDetector` by default "only takes taps on its child", so for a padded icon-and-text row set `behavior: HitTestBehavior.opaque` ([FlutterPro](https://flutterpro.design/details/gesture-detector-hit-area), [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#gesturedetector-hit-area)). A custom render object can grow its accessibility rect with `semanticBounds` ([flutter-render-objects SEMANTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/SEMANTICS.md#semanticbounds)).
- **Errors:** important actions can be undone; suggest corrections.
- **Color vision deficiency testing:** check in colorblind and grayscale modes.
- **Scale factors:** the UI stays legible at very large text and display scaling.

## Design values

| Item | Value |
| --- | --- |
| Contrast, small text (below 18 pt regular or 14 pt bold) | At least 4.5:1 (W3C) |
| Contrast, large text | At least 3.0:1 (W3C) |
| Tap target, Android | 48x48 dp |
| Tap target, iOS | 44x44 pts |
| Tap target, W3C | 44x44 CSS pixels |

- **Large fonts:** Flutter text widgets respect the OS font-size setting. "Make sure your layout has enough room to render all its contents when the font sizes are increased." Test on a small-screen device at the largest font. iOS: Settings > Accessibility > Display & Text Size. Android: Settings > Font size.
- **A community view: cap the text scale.** FlutterPro clamps `MediaQuery.textScaler` app-wide to 1.1 ("don't ignore user's preference completely, just it limit to x1.1 at max", [FlutterPro](https://flutterpro.design/details/text-scale-factor)), and the flutter-improve-design catalog counts "no clamp and no fixed override like x1.0 or x1.1" as a failure [improve-design]. Flutter's docs give the opposite instruction (the quote above: make room for larger fonts). Both sides and the code: [flutter-ux SCROLLING-AND-LAYOUT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SCROLLING-AND-LAYOUT.md#text-scale-cap). Owner's rule: never lock or cap text scaling app-wide; when a layout breaks at large text, change the structure (`Row` to `Column`), don't shrink the font, and keep `MediaQuery.withClampedTextScaling` to one region that truly can't grow ([RESPONSIVE-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/RESPONSIVE-UNITS.md#enhancement-not-the-base)).
- **Other platform settings** come through `AccessibilityFeatures` (bold text, high contrast, inverted colors). `MediaQuery` also exposes high contrast, text scaling and whether TalkBack or VoiceOver is on.
- **Recent additions:** Flutter 3.47 detects Android high contrast and color inversion automatically (`MediaQueryData.highContrast`, `MediaQueryData.invertColors`). Flutter 3.44 added iOS motion accessibility features via `AccessibilityFeatures`, percentage `SemanticsValue` for progress indicators, and on web honors `prefers-reduced-motion` and announces form validation errors via `aria-description`.
- **Adaptive layouts:** a community post on context-aware UI says real-time touch-target enlargement and automatic WCAG-compliant contrast are natural fits for adaptive systems "only if you make it an explicit adaptation rule rather than hoping it falls out" ([LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#context-aware-layouts-optional)).
- **Orientation:** locked screens can be an accessibility issue; see [LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#orientation).
- **Keyboard:** keep common flows keyboard-navigable and support mice, trackpads and keyboard shortcuts (`Shortcuts`, `Actions`, `Intent`, `Action`; see [LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#input-and-state)).

## Semantics and screen readers

- **Customize the tree with the `Semantics` widget** where standard widgets do not describe a control. Its relatives are `MergeSemantics`, `ExcludeSemantics` and `BlockSemantics`, for example `Semantics(button: true, label: 'Submit', onTap: ..., child: ...)`. Composed custom widgets get semantics at this widget layer; only a custom render object describes itself in `describeSemanticsConfiguration` and calls `markNeedsSemanticsUpdate()` when what it reports changes ([renderobjects](https://renderobjects.com/guides/semantics/), [flutter-render-objects SEMANTICS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/SEMANTICS.md#widget-layer-first)).
- **Label, value, hint** ([renderobjects](https://renderobjects.com/guides/semantics/)): the label says what it is, and every interactive element needs one; the value is its current state; the hint is supplementary, read after a delay and often turned off by users, so essential information goes in the label. Labels are spoken verbatim, so localize them ([LOCALIZATION.md](LOCALIZATION.md)).
- **Merge composites, not regions** ([renderobjects](https://renderobjects.com/guides/semantics/)): an icon-plus-label button or a list tile is one node ("If your composite has a single interaction, it's a single semantic node"), but merging a large region can absorb inner interactive elements that should stay focusable, so protect them with a semantic boundary or merge more granularly. Status messages that change while focus is elsewhere are live regions (`isLiveRegion`); blocking (`BlockSemantics` at the widget layer) keeps a screen reader off what is behind a modal.
- **Say the on state in the label:** FlutterPro recommends a clear affirmative switch title. [FlutterPro](https://flutterpro.design/details/switch-thumb-icons). `SwitchListTile` uses `MergeSemantics` to combine descendant semantic nodes into one interactive entity. [SwitchListTile](https://api.flutter.dev/flutter/material/SwitchListTile-class.html). P2 correction: the source and the old line here claimed screen readers read only the title and never icons; the semantic contract is not categorically title-only. A custom spinner labels itself with `Semantics(label: 'Loading', ...)` ([FlutterPro](https://flutterpro.design/details/neutral-loading-spinner)). The [switch](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/MOTION-AND-FEEDBACK.md#switch-thumb-icons) and [spinner](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/MOTION-AND-FEEDBACK.md#neutral-spinner) recipes stay with their widgets.
- **One announcement for a composed view** ([FlutterPro](https://flutterpro.design/details/friendly-error-view)): `Semantics(container: true, label: 'Something went wrong. Restarting the app should fix it.', child: ExcludeSemantics(...))` reads one sentence instead of each child.
- **Headings (Flutter 3.47):** `header` is a no-op on iOS and Android. Use `Semantics(headingLevel: 1, child: Text('Section Title'))`; details in [VERSIONS.md](VERSIONS.md#breaking-change-details). The `SemanticsConfiguration.headingLevel` API page still says web only; the breaking-change page and the engine source say otherwise (checked in VERSIONS.md).
- **Screen reader voice:** set a specific voice with `TextSpan.locale`. "`MaterialApp.locale` and `Localizations.override` will affect screen reader voices starting from flutter 3.38 release."
- **Assistive technologies to test:**
  - Screen readers: TalkBack (Settings > Accessibility > TalkBack), VoiceOver (Settings > Accessibility > VoiceOver). Web: VoiceOver and TalkBack on mobile browsers; VoiceOver, JAWS and NVDA on desktop. Windows: Narrator, NVDA. Linux: Orca.
  - Mobility: Android Switch Access, Voice Access, Accessibility Menu; iOS Switch Control, Voice Control, AssistiveTouch.

## Web

- **Accessibility is off by default on web** "For performance reasons". Users turn it on with an invisible button, `aria-label="Enable accessibility"`, or you enable it in code:

```dart
import 'package:flutter/semantics.dart';

void main() {
  runApp(const MyApp());
  if (kIsWeb) {
    SemanticsBinding.instance.ensureSemantics();
  }
}
```

- **Roles:** `Semantics(role: SemanticsRole.list, explicitChildNodes: true, ...)` and `SemanticsRole.listItem` translate to ARIA roles. Prefer standard widgets that already include roles (`TabBar`, `MenuAnchor`, `Table`). The docs' example imports `package:material_ui/material_ui.dart`; the move of Material and Cupertino into packages is in [VERSIONS.md](VERSIONS.md).
- **See the semantics tree on web:** `flutter run -d chrome --profile --dart-define=FLUTTER_WEB_DEBUG_SHOW_SEMANTICS=true` (profile and release modes).

## Testing

- **Guideline API test.** Put it alongside widget tests or in `test/a11y_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:your_accessible_app/main.dart';

void main() {
  testWidgets('Follows a11y guidelines', (tester) async {
    final SemanticsHandle handle = tester.ensureSemantics();
    await tester.pumpWidget(const AccessibleApp());

    // Checks that tappable nodes have a minimum size of 48 by 48 pixels
    // for Android.
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline));

    // Checks that tappable nodes have a minimum size of 44 by 44 pixels
    // for iOS.
    await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));

    // Checks that touch targets with a tap or long press action are labeled.
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));

    // Checks whether semantic nodes meet the minimum text contrast levels.
    // The recommended text contrast is 3:1 for larger text
    // (18 point and above regular).
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    handle.dispose();
  });
}
```

- **Automated scanners:**
  - Android: Accessibility Scanner (Settings > Accessibility > Accessibility Scanner > On).
  - iOS: Xcode > Open Developer Tools > Accessibility Inspector (Inspection > Enable Point to Inspect; Audit > Run Audit).
  - Web: Chrome DevTools Elements > Accessibility sub-tab on the semantics host.

## Prove it

- **Guideline test passes:** `test/a11y_test.dart` (or an equivalent widget test) runs `androidTapTargetGuideline`, `iOSTapTargetGuideline`, `labeledTapTargetGuideline` and `textContrastGuideline` on each main screen, and all four pass.
- **Screen reader pass:** with TalkBack and VoiceOver on, every control on the changed screens is announced intelligibly and does something when activated.
- **Scanners:** Android Accessibility Scanner and the iOS Accessibility Inspector audit report no issues on the changed screens.
- **Largest font:** on a small-screen device at the largest OS font size, no text is cut off and no overflow stripes appear.
- **Color:** contrast meets 4.5:1 for small text and 3.0:1 for large text, and the screens still work in grayscale and colorblind modes.
- **No no-op handlers:** search for empty `onPressed: () {}` callbacks; there are none.
- **One stop per control:** with TalkBack or VoiceOver, an icon-plus-label button or list tile is a single focus stop, and its label names its state ("Dark theme").
- **Web builds:** `SemanticsBinding.instance.ensureSemantics()` runs when `kIsWeb`, or the "Enable accessibility" button is documented for users; the semantics debug run shows labeled nodes.
