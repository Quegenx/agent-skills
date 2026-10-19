# Keyboard and focus

The software keyboard and focus in Flutter forms: the keyboard action key, autofocus on single-field pages, dismissing the keyboard (on scroll, on a tap outside, before a modal), watching its visibility, a centered form that stays above it, forms in bottom sheets, and keyboard shortcuts. Sources are community material, not docs.flutter.dev: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips (apparencekit.dev), checked against api.flutter.dev where a line is wrong. No article states a Flutter or package version. Fields, autofill, the clipboard and edit forms are in [FORMS-AND-INPUT.md](FORMS-AND-INPUT.md); official layout rules in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md); sheet sizing and results in [NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md).

**Contents:** [The keyboard action key](#the-keyboard-action-key) · [Autofocus single-field pages](#autofocus-single-field-pages) · [Dismissing the keyboard](#dismissing-the-keyboard) · [Watching keyboard visibility](#watching-keyboard-visibility) · [A centered form above the keyboard](#a-centered-form-above-the-keyboard) · [Forms in a bottom sheet](#forms-in-a-bottom-sheet) · [Keyboard shortcuts](#keyboard-shortcuts) · [Prove it](#prove-it)

## The keyboard action key

[FlutterPro](https://flutterpro.design/details/text-input-action)

- **Every field puts an action key on the keyboard; the default, "done", just closes it.** With `textInputAction: TextInputAction.next`, Flutter moves focus to the next field on its own, "No need for a custom `FocusNode`". The last field uses `done` with `onFieldSubmitted`.

```dart
TextFormField(
  // Keyboard key: "next"
  textInputAction: TextInputAction.next,
),
TextFormField(
  textInputAction: TextInputAction.next,
),
TextFormField(
  // Keyboard key: "done"
  textInputAction: TextInputAction.done,
  onFieldSubmitted: (_) => _submit(),
),
```

- **`onFieldSubmitted` runs on the action key,** so give it the same method the submit button calls.
- **Match the key to the form's one clear action:** `TextInputAction.send` for a message, `go` for navigation, `search` for a query. `done` is the neutral pick. Same behavior, but the keyboard now says what the key does.
- **Platform-bound actions:** Android also has `previous` (jump back a field) and `none`; iOS has `join`, `route`, `continueAction` and `emergencyCall`. "Using one on the wrong platform throws exception **ONLY** in debug mode."
- **Pitfall: `onEditingComplete` replaces the default,** so moving focus to the next field and closing the keyboard become your job.
- **Multiline fields:** the return key must insert a line break, not submit. Set `maxLines` above 1 and leave the rest alone; the action defaults to `TextInputAction.newline`. The article writes the keyboard type as "`KeyboardType.multiline`"; the type is `TextInputType.multiline`, which `TextField` picks itself: `keyboardType ?? (maxLines == 1 ? TextInputType.text : TextInputType.multiline)` ([api.flutter.dev](https://api.flutter.dev/flutter/material/TextField/TextField.html)).
- **ApparenceKit's version of the same flow** [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-input-keyboard-actions-forms/): set the email field's key to "next"; in its `onFieldSubmitted`, (1) unfocus the current field, (2) focus the next one, managing the active field with `FocusNode`. No code given. The two sources differ: FlutterPro says `next` moves focus by itself with no `FocusNode`; ApparenceKit wires the hand-off by hand.

## Autofocus single-field pages

[FlutterPro](https://flutterpro.design/details/autofocus-single-field)

- **If a page exists to collect one input (OTP, the phone number on registration, change email), focus that field on open:** `TextField(autofocus: true, keyboardType: TextInputType.phone)`. The keyboard then stays up from the phone number to the OTP, with no tap in between.
- **OTP with [pinput](https://pub.dev/packages/pinput):** submit in `onCompleted`, which fires on the last digit; "Don't make the user reach for a "Continue" button that the code could press itself." Set `closeKeyboardWhenCompleted: false`: Pinput drops the keyboard on complete by default (the article's claim, no pinput version), so after a wrong code the user retypes with the keyboard gone.

```dart
Pinput(
  autofocus: true,
  length: 4,
  onCompleted: (pin) => _verify(pin),
  closeKeyboardWhenCompleted: false,
)
```

- **Skip "tap outside to dismiss" on these pages:** there is nothing else to reach, and dropping the keyboard only adds a tap to bring it back.
- **Only when the field is the only choice.** Not on a login page with an email field plus Google and Apple sign-in: the keyboard opens over those buttons and hides options the user might have picked. "The rule: when the page is the field, treat it that way. Focused on open, submitted on complete, keyboard stays."

## Dismissing the keyboard

- **On scroll** [FlutterPro](https://flutterpro.design/details/dismiss-keyboard-on-scroll): every scrollable (`ListView`, `SingleChildScrollView`, `CustomScrollView`, `GridView`) takes `keyboardDismissBehavior`. With `onDrag`, the field unfocuses and the keyboard slides away the moment the user starts scrolling.

```dart
ListView(
  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
  children: [
    // your fields
  ],
)
```

- **Where `onDrag` fits:** long forms (profile edit, registration), search (scrolling means reading results), and short forms too, even one field, when there is something below it.
- **Skip it in chat; leave it on `manual`.** Scrolling up to find an old message while typing would close the keyboard and cut off what the user was writing. Rule: `onDrag` when scrolling means the user is done with the field; `manual` when they scroll while still typing.
- **On a tap outside the field** [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-dismiss-keyboard-on-tap/): wrap the screen's main content (the `Scaffold`'s body) in a `GestureDetector` whose `onTap` calls `FocusScope.of(context).unfocus()`, which "will close the keyboard if a text field was focused".

```dart
GestureDetector(
  onTap: () => FocusScope.of(context).unfocus(),
  child: // Your page content goes here
)
```

- **Before opening a custom modal** [FlutterPro](https://flutterpro.design/details/unfocus-before-modal): the user types in "Note", then taps "City", which opens a picker; when the picker closes, the keyboard reopens and focuses "Note" again. Call `FocusManager.instance.primaryFocus?.unfocus();` before opening it. "An open keyboard takes a huge portion of the screen", so "always aim to close the keyboard when a user is done typing".

```dart
CustomDropdown(
    title: 'City',
    value: selectedCity,
    onTap: () async {
        // Add this before opening modal
        FocusManager.instance.primaryFocus?.unfocus();
  
        // Open picker, update state etc.
    },
)
```

- **The sources disagree on which call to use.** FlutterPro: "Don't use `FocusScope`: `FocusScope.of(context)` looks for the nearest "focus" in the widget tree. `FocusManager` holds the latest focused one. Use that." ApparenceKit's tap-outside snippet uses `FocusScope.of(context).unfocus()`.
- **Tap-outside versus single-field pages:** ApparenceKit applies tap-outside to forms generally; FlutterPro skips it on single-field pages ([above](#autofocus-single-field-pages)).

## Watching keyboard visibility

[ApparenceKit](https://apparencekit.dev/flutter-tips/listen-keyboard-visibility-state/)

- **No plugin needed.** A `StatefulWidget` (`KeyboardVisibility`) whose state mixes in `WidgetsBindingObserver`: `addObserver` when the widget starts, `removeObserver` when it is disposed, override `didChangeMetrics` (called "when the screen layout changes (like the keyboard appearing)"), read `MediaQuery.of(context).viewInsets.bottom` there, and call `onKeyboardStateChanged` with the state. Greater than 0 means visible.
- **Caveat from the article:** `viewInsets.bottom > 0` can also mean "other system UI like a navigation bar" takes the bottom.
- **Uses:** show or hide bottom buttons the keyboard would cover, resize layouts. The article shows only the usage, not the widget's code:

```dart
KeyboardVisibility(
  onKeyboardStateChanged: (state) => _handleKeyboardStateChange(state), // Your function
  child: YourMainContentWidget(), // The part of your UI that needs watching
)
```

- **Accessor:** the repo prefers the narrow `MediaQuery` accessors ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md): "Use `MediaQuery.sizeOf`, not `MediaQuery.of`"). The insets have one: `static EdgeInsets viewInsetsOf(BuildContext context)`, which rebuilds "only ... when this specific attribute changes" ([api.flutter.dev](https://api.flutter.dev/flutter/widgets/MediaQuery/viewInsetsOf.html)). Read `MediaQuery.viewInsetsOf(context).bottom` wherever these articles write `MediaQuery.of(context).viewInsets.bottom`.

## A centered form above the keyboard

[ApparenceKit](https://apparencekit.dev/flutter-tips/center-form-flutter-keyboard-safe/)

- **Use the actual viewport constraints:** follow Flutter's [spaced-items recipe](https://docs.flutter.dev/cookbook/lists/spaced-items) and [SingleChildScrollView guidance](https://api.flutter.dev/flutter/widgets/SingleChildScrollView-class.html): `LayoutBuilder` outside the scroll view, then `ConstrainedBox` with a minimum height from `constraints.maxHeight`. Fixed-height children can use the Column's alignment without flex; the documented `Spacer`/`Expanded` variation adds `IntrinsicHeight`, which can require laying out the contents twice.
- **P2 correction:** ApparenceKit prescribes a full-screen-height `SizedBox` and says the `Spacer`s shrink when the keyboard reduces the viewport. That box bounds the Column, so it is not inherently an unbounded-flex error, but full window height is not the available scroll viewport height. Use the official recipe above rather than promising the source's keyboard behavior. [ApparenceKit](https://apparencekit.dev/flutter-tips/center-form-flutter-keyboard-safe/), [SingleChildScrollView](https://api.flutter.dev/flutter/widgets/SingleChildScrollView-class.html)
- **Width:** keep the existing [large-screen form width rule](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#large-screens-and-foldables); the source specifies no width limit. [ApparenceKit](https://apparencekit.dev/flutter-tips/center-form-flutter-keyboard-safe/)

## Forms in a bottom sheet

[ApparenceKit](https://apparencekit.dev/blog/bottom-sheet-flutter-keyboard-fix/)

- **Why it breaks:** `showModalBottomSheet` "often takes up a portion of the screen (like half the height) and doesn't automatically resize when the keyboard appears"; content that is not scrollable has nowhere to go; the keyboard covers the bottom without the layout adapting.
- **Step 1: `isScrollControlled: true`,** so the sheet can grow taller than its default and occupy the space above the keyboard.

```dart
showModalBottomSheet(
  context: context,
  // 👇 Allow the sheet to resize freely
  isScrollControlled: true,
  builder: (context) {
    return YourBottomSheetWidget();
  },
);
```

- **Step 2: wrap the content in `SingleChildScrollView`,** with `mainAxisSize: MainAxisSize.min` on the `Column` ("Important for SingleChildScrollView").

```dart
@override
Widget build(BuildContext context) {
  return SingleChildScrollView( // 👈 Wrap content
    child: Padding(
      padding: const EdgeInsets.all(24.0), // Example padding
      child: Column(
        mainAxisSize: MainAxisSize.min, // Important for SingleChildScrollView
        children: [
          Text('Setup', style: Theme.of(context).textTheme.titleLarge),
          SizedBox(height: 16),
          TextField(
            decoration: InputDecoration(labelText: 'Number'),
            keyboardType: TextInputType.number,
          ),
          // ... other widgets in your sheet
        ],
      ),
    ),
  );
}
```

- **Step 3: bottom space equal to `viewInsets.bottom`** ("zero when the keyboard is hidden and non-zero when it's visible"), applied through `SafeArea(minimum: ...)`, plus optional extra (24). The `...` placeholders are the article's; read the inset with `MediaQuery.viewInsetsOf(context).bottom` ([above](#watching-keyboard-visibility)).

```dart
@override
Widget build(BuildContext context) {
  return SafeArea( // Use SafeArea to handle system intrusions
    minimum: EdgeInsets.only(
      bottom: MediaQuery.of(context).viewInsets.bottom + 24, // 👈  Calculate white space based on keyboard visibility + optional extra space
    ),
    child: Padding( // Apply padding, especially dynamic bottom padding
      padding: EdgeInsets.all(...),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Setup', ...),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(labelText: 'Number'),
              keyboardType: TextInputType.number,
            ),
            // ... other widgets
          ],
        ),
      ),
    ),
  );
}
```

- **The article applies the keyboard inset through `SafeArea.minimum`** ("A SafeArea widget is often a convenient way to apply this"). The official `SafeArea` line (notches, cutouts, status bar, rounded corners) is in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#safearea-and-mediaquery).
- **Author's view:** "I believe this should be the default behavior of the bottom sheet, but for now, this is the best way to handle it."
- **Web equivalent** (keyboard over a sheet, `padding-bottom: calc(100dvh - var(--visual-viewport-height))`): [ui-animation SHEETS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SHEETS.md). Sheet sizing and results: [NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md).

## Keyboard shortcuts

[ApparenceKit](https://apparencekit.dev/flutter-tips/handle-keyboard-shortcuts/)

- **For desktop and web:** `Shortcuts` maps key combinations to actions; `Actions` lets children trigger actions defined higher up, and works without `Shortcuts`; an `Intent` represents the intention, an `Action` holds the logic. No code in the article. This names the widgets behind "Support mice, trackpads and keyboard shortcuts" in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md) and [flutter ACCESSIBILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ACCESSIBILITY.md#design-values).

## Prove it

- Tab through a form with the keyboard action key: each field moves to the next, the last one submits through the same method as the button; no `onEditingComplete` without its own focus handling; multiline fields insert a newline.
- Single-field pages (OTP, change email) open with the keyboard up; login pages with social sign-in do not autofocus.
- Long forms and search use `ScrollViewKeyboardDismissBehavior.onDrag`; chat does not. Opening a picker after typing does not bring the keyboard back on close.
- Open the keyboard in every bottom sheet with a field: the field stays visible above it (`isScrollControlled: true`, scrollable content, bottom inset).
- No `MediaQuery.of(context)` for size or insets; `sizeOf` and `viewInsetsOf` instead.
