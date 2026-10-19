# Flutter selectors through the accessibility tree

Flutter paints onto a canvas, so a tool outside the app sees only what Flutter's AccessibilityBridge translates from its virtual semantics tree into the native accessibility tree that TalkBack, VoiceOver and accessibility-based test tools read. Maestro and the `e2e` runner both work from outside on that tree: give every control a test needs a `Semantics(identifier:)` and both find it. Flutter Keys never reach that tree. Patrol runs as Dart inside the app and finds widgets by Keys. This Maestro-owned reference also records the tagged tester-army/e2e differences; no other runner needs to be installed. Read it only for outside-the-app Flutter automation; Patrol's own Keys contract is in the [patrol skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/patrol/PATROL.md#test-keys). [mobile-dev-inc/maestro-docs, Flutter; tester-army/e2e, Flutter example; leancodepl/patrol, test keys]

## Selectors

[mobile-dev-inc/maestro-docs, Flutter selectors; tester-army/e2e, Flutter example]

- **Maestro's rule:** "**Flutter**: Use visible text or Semantics Labels (for text), or Semantics Identifiers (for id). Internal Flutter "Keys" are not supported."
- **Why not Keys:** "They are not exposed to the system's accessibility layer. Because Maestro lives outside the Flutter runtime, it cannot "see" Keys. Always use Semantics for automation." A `flutter_driver`-based route to Keys was rejected because it works only in debug and profile builds (Dart VM service extensions are off in release), needs a `pubspec.yaml` dependency and init code, and would need context switching and tree merging for relative selectors. e2e's docs say nothing about Keys; their only Flutter id is `Semantics(identifier:)`.
- **Use `Semantics(identifier:)` for test ids** (Flutter 3.19+), above all in localized or A/B-tested apps. It lands in the native accessibility tree on Android and iOS, so Maestro's `id`, Maestro Studio, e2e's `getByTestId` and Appium all find it. Don't put test ids in a label: screen readers read the label aloud, while the identifier is "the same as accessibility label, but only for UI testing. Screen readers won't read it out."

```dart
Semantics(
  identifier: 'login_button',
  child: ElevatedButton(onPressed: _login, child: Text('Sign In')),
)
```

```yaml
- tapOn:
    id: "login_button"
```

- **Label an icon with no text** through `semanticLabel`, and wrap a layout widget in `Semantics(label:)` to make a non-text area tappable:

```dart
FloatingActionButton(
  onPressed: _incrementCounter,
  child: Icon(Icons.add, semanticLabel: 'fabAddIcon'),
)
```

```yaml
- tapOn: "fabAddIcon"
```

```dart
Semantics(
  label: 'yellow_box',
  child: Container(color: Colors.yellow, width: 100, height: 100),
)
```

## MergeSemantics and merged nodes

[mobile-dev-inc/maestro-docs, Flutter issues; tester-army/e2e, Flutter example]

- **Wrap a button's `Semantics` in `MergeSemantics`** "so the id and the button role land on one node". It is the one Flutter-specific rule in e2e's device docs.
- **An `IconButton` labelled only on its `Icon`** gave a Maestro tap that passed with no effect (Maestro 1.33.1, Android 14, Flutter 3.13.9). Wrapping the `IconButton` fixed it:

```dart
child: Semantics(
  button: true,
  label: 'Account',
  child: IconButton()...
```

- **Merged text shows up as the selector:** a `BottomNavigationBarItem` was found by its merged accessibility text, not the wrapped Semantics: `tapOn: 'Menu\nTab 2 of 2'`. The suspected cause was the icon's semantics merging into the item's title. Read the real selector off Maestro Studio instead of guessing.

## Prove it

For the selected accessibility-based Flutter runner, inspect the actual exposed tree and prove the identifiers used by the test are present. Maestro uses its hierarchy or Studio; tester-army/e2e uses its live device observation and locator contract. Keep each runner's own matching and native-automation acceptance in its skill. Patrol finds Keys inside the app and does not inherit this outside-the-app selector requirement. [mobile-dev-inc/maestro-docs, Flutter selectors; tester-army/e2e, Flutter example; leancodepl/patrol, test keys]
