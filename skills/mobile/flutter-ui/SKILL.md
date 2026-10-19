---
name: flutter-ui
description: "Builds Flutter screens and reusable widgets with responsive constraints, theme tokens, typography, image loading, adaptive layouts and Flutter animations. Preserves Flutter documentation, owner sizing rules and tagged FlutterPro/ApparenceKit alternatives. Use when building or restyling Flutter UI, implementing a screen, fixing layout overflow, defining themes, polishing typography or images, or adding widget animations."
---

# Flutter UI

Screen construction extracted from the existing Flutter and Flutter UX skills. Sources remain Flutter's documentation and official agent skills (docs.flutter.dev and flutter/agent-plugins), the owner's responsive sizing rules, FlutterPro tips by Kamran Bekirov, ApparenceKit tips and the separately selected `flutter_scale_kit` package. Topic files preserve their source tags, official corrections and conflicting community views.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choose the screen-building topic and its selected checks | [SKILL.md](SKILL.md) |
| Responsive and adaptive layouts, parent constraints, window measurements, breakpoints, large screens, safe areas and layout errors | [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md) |
| Owner sizing rules, theme tokens, intrinsic and fluid sizing, component versus page measurements, text scaling and CSS-to-Flutter parallels | [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md) |
| The optional `flutter_scale_kit` package, setup, tokens and its disagreements with Flutter and owner sizing rules | [SCALE-KIT.md](SCALE-KIT.md) |
| Brand colors, `ThemeExtension`, palette-based theme factories, runtime light/dark switching, font and spacing choices | [THEMING.md](THEMING.md) |
| Image sizing, loading and caching, placeholders, font/icon preloading, tabular figures and text metrics | [IMAGES-AND-TYPOGRAPHY.md](IMAGES-AND-TYPOGRAPHY.md) |
| Avatars, app bars, overlays, zoom/pan, flex, clipping, keys, Actions/Intents and widget builders | [WIDGET-PATTERNS.md](WIDGET-PATTERNS.md) |
| Flutter animation timing, curves, springs, implicit animation, switcher keys, controllers and entrance sequences | [ANIMATION.md](ANIMATION.md) |

## Selected references

- For forms, focus, keyboards, navigation behavior, scrolling, press feedback, haptics or a whole-app UX review, select the corresponding [flutter-ux](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/SKILL.md) route. [existing flutter-ux, SKILL.md]
- For screen-reader semantics, contrast, tap targets or large-text acceptance, read [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md). For localized UI and directional layout, read [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md). [existing flutter, ACCESSIBILITY.md and LOCALIZATION.md]
- For state, data, app routing, platform integration, testing or measured rendering cost, select the corresponding [flutter](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md) route. Custom render objects remain in [flutter-render-objects](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-render-objects/SKILL.md). [existing flutter, SKILL.md]
- For painting and media recipes, read [flutter-ux PAINTING-AND-MEDIA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/PAINTING-AND-MEDIA.md); shared visual-design review remains in [anti-slop-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md). [existing flutter-ux, SKILL.md]

## The rules

1. **Base every layout decision on the available window space,** read with `MediaQuery.sizeOf(context)` or `LayoutBuilder`: never on hardware type ("phone" vs "tablet"), `Platform.isAndroid` or orientation, and never portrait-lock the app. [existing flutter, SKILL.md; LAYOUT-AND-RESPONSIVE.md]
2. **Keep component measurements local and fonts and spacing in theme tokens.** Follow the owner's intrinsic, fluid, component, page-skeleton and safe-area order in [RESPONSIVE-UNITS.md](RESPONSIVE-UNITS.md#the-iron-rule). [Owner's rule, RESPONSIVE-UNITS.md]
3. **Build themes from one palette,** keeping the palette and default text theme separate; retain the official API corrections alongside ApparenceKit's examples. [ApparenceKit](https://apparencekit.dev/blog/flutter-theme-made-easy/), [THEMING.md](THEMING.md)
4. **Images hold their space and arrive calmly:** size the box before load (`AspectRatio` or width and height; `fit:` doesn't count), show a plain grey box, fade in, and show a subtle broken-image icon on failure, never a technical message; precache the icons the first screen shows during the splash. [FlutterPro](https://flutterpro.design/details/reserve-image-space), [FlutterPro](https://flutterpro.design/details/smooth-image-loading), [FlutterPro](https://flutterpro.design/details/precache-icons)
5. **Keep animation identity and triggers explicit:** key an `AnimatedSwitcher` child on the changing value and compare the specific changed field in `didUpdateWidget` before starting its controller. [ApparenceKit](https://apparencekit.dev/flutter-tips/animatedswitcher-riverpod-animate-text/), [ApparenceKit](https://apparencekit.dev/flutter-tips/run-animation-property-change/)
6. **Keep the tagged alternatives visible.** Scale-kit device classification and proportional sizing differ from Flutter and owner rules; animation timing and spring preferences also have source-specific alternatives. Apply the recorded choice rather than silently replacing the existing rule. [SCALE-KIT.md](SCALE-KIT.md#where-it-disagrees-with-flutter), [ANIMATION.md](ANIMATION.md#enter-slow-exit-fast)

## Gotchas

- Device orientation and hardware class do not describe the space a component receives. Use the window or parent constraints for the selected layout. [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#measure-the-window)
- A plain `AnimationController` clamps spring overshoot; the retained spring recipe requires `AnimationController.unbounded` for a bouncy simulation. [FlutterPro](https://flutterpro.design/details/spring-physics)
- Flutter's `ThemeExtension<T>` and a Dart extension on `BuildContext` are different concepts despite the community example's shared name. [THEMING.md](THEMING.md#two-things-called-theme-extension)

## Prove it

Run the selected topic's checks for the UI changed and report what was actually verified. For responsive layout, use [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md#prove-it); for themes, images, widgets and motion, use each selected file's Prove it section. Accessibility and localization checks apply when those routes are selected. Whole-app UX reviews and unrelated app release checks are separate scopes. [existing flutter and flutter-ux, selected topic Prove it sections]
