# Forms and input

Text fields, formatters, autofill and password managers, the clipboard, edit forms with Save and Discard, tappable links inside translated sentences, checkbox lists and repeated taps. The keyboard itself (action key, focus, dismissing it, watching it, forms under it and in bottom sheets, shortcuts) is in [KEYBOARD-AND-FOCUS.md](KEYBOARD-AND-FOCUS.md). Sources are community material, not docs.flutter.dev: FlutterPro tips by Kamran Bekirov (flutterpro.design) and ApparenceKit tips (apparencekit.dev), checked against api.flutter.dev and dart.dev where a line is wrong. No article states a Flutter, Dart or package version. Several FlutterPro blocks use dot shorthands, which need Dart 3.10 ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md#dot-shorthands)); write the full type names on older SDKs. Official layout rules are in [flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md); dialogs, sheets and their results in [NAVIGATION-AND-SHEETS.md](NAVIGATION-AND-SHEETS.md).

**Contents:** [Formatters see paste and autofill](#formatters-see-paste-and-autofill) · [Amount limits](#amount-limits) · [Autofill and password managers](#autofill-and-password-managers) · [Clipboard](#clipboard) · [Edit forms: Save](#edit-forms-save) · [Edit forms: Discard changes](#edit-forms-discard-changes) · [Links inside a translated sentence](#links-inside-a-translated-sentence) · [Fields that grow with their content](#fields-that-grow-with-their-content) · [Checkbox lists](#checkbox-lists) · [Repeated taps](#repeated-taps) · [Prove it](#prove-it)

## Formatters see paste and autofill

[FlutterPro](https://flutterpro.design/details/autofill-dial-code)

- **Every change to the text goes through `inputFormatters`:** keystrokes, paste and autofill all arrive as an ordinary edit. You can't control what gets inserted, so the formatter is where you catch it.
- **Tell a bulk insert from a keystroke by length.** "A keystroke grows the text by one character. Paste and autofill grow it by many." Act only when `newValue.text.length - oldValue.text.length > 1`, so typing is never touched.
- **Fixed dial-code prefix:** the field shows `+994` on the left, users paste or autofill the full international number, and the code lands twice. Strip it when the text starts with `00994`, or starts with `+` and its digits start with `994`; put the cursor at the end. The article uses `+994` (Azerbaijan): "For your country, adapt it yourself".

```dart
import 'package:flutter/services.dart';
  
class StripDialCodeFormatter extends TextInputFormatter {
  static const String _dialCode = '994';
  
  static final RegExp _nonDigits = RegExp(r'[^0-9]');
  
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // A keystroke grows the text by one character.
    // Paste and autofill grow it by many.
    final bool bulk = newValue.text.length - oldValue.text.length > 1;
    if (!bulk) return newValue;
  
    final String digits = newValue.text.replaceAll(_nonDigits, '');
  
    String national = digits;
    if (digits.startsWith('00$_dialCode')) {
      national = digits.substring(2 + _dialCode.length);
    } else if (newValue.text.trimLeft().startsWith('+') &&
        digits.startsWith(_dialCode)) {
      national = digits.substring(_dialCode.length);
    }
  
    return TextEditingValue(
      text: national,
      selection: TextSelection.collapsed(offset: national.length),
    );
  }
}
```

```dart
TextField(
  keyboardType: TextInputType.phone,
  autofillHints: const [
    AutofillHints.telephoneNumber,
  ],
  inputFormatters: [
    StripDialCodeFormatter(),
  ],
  decoration: const InputDecoration(
    prefixText: '+994 ',
    hintText: '501234567',
  ),
)
```

- **Keep `autofillHints`:** it "is what makes the OS offer the number in the first place". The formatter makes autofill safe, so users keep one-tap entry.

## Amount limits

[FlutterPro](https://flutterpro.design/details/max-amount-formatter)

- **A field that never accepts more beats an error after the fact.** For a hard limit (paying with a bonus balance), parse the new text in a formatter and return `oldValue` when it goes above the max: the edit never happens, "no error to show, nothing to dismiss". Empty text passes through, so users can always clear the field; unparsable text returns `oldValue`.

```dart
import 'package:flutter/services.dart';
  
class MaxAmountInputFormatter extends TextInputFormatter {
  final double maxAmount;
  
  MaxAmountInputFormatter(this.maxAmount);
  
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
  
    final double? value = double.tryParse(newValue.text);
    if (value == null) return oldValue;
  
    if (value > maxAmount) return oldValue;
  
    return newValue;
  }
}
```

- **The filter runs first,** so only digits with up to two decimals reach the max check:

```dart
TextField(
  keyboardType: const TextInputType.numberWithOptions(
    decimal: true,
  ),
  inputFormatters: [
    FilteringTextInputFormatter.allow(
      RegExp(r'^\d+\.?\d{0,2}'),
    ),
    MaxAmountInputFormatter(maxAmount),
  ],
)
```

- **The limit often comes from two amounts** (no more bonus than the user has, no more than the order costs). Take the smaller: `final double maxAmount = min(bonusBalance, orderTotal);`

## Autofill and password managers

[FlutterPro](https://flutterpro.design/details/password-autofill)

- **The OS needs to know what each field is, "and Flutter doesn't tell it by default".** Two things fix it: `autofillHints` on each field and an `AutofillGroup` around them. The hints say what each field expects; the group links the fields into one credential, so tapping the suggestion fills email and password together.

```dart
AutofillGroup(
  child: Column(
    children: [
      TextField(
        autofillHints: const [
          .username,
          .email,
        ],
        keyboardType: .emailAddress,
      ),
      TextField(
        autofillHints: const [
          .password,
        ],
        obscureText: true,
      ),
    ],
  ),
)
```

Correction (the hint lists above do not compile): `autofillHints` is `Iterable<String>?` and "the common values of hint strings can be found in `AutofillHints`" ([api.flutter.dev](https://api.flutter.dev/flutter/material/TextField/autofillHints.html)); "Dot shorthands use the context type to determine the member the compiler resolves to" ([dart.dev](https://dart.dev/language/dot-shorthands)), so `.username` is looked up on `String`. The article (no version stated) is wrong here; its own prose uses the full names. Write:

```dart
autofillHints: const [AutofillHints.username, AutofillHints.email],
// ...
autofillHints: const [AutofillHints.password],
```

`keyboardType: .emailAddress` is fine (the context type is `TextInputType`).

- **`AutofillHints.username` does more than fill saved logins:** the OS suggests the user's email addresses above the keyboard even when nothing is saved yet.
- **Sign-up and password reset use `AutofillHints.newPassword`,** not `password`; the OS then offers a generated strong password on the keyboard.
- **Some hints need a matching `keyboardType`:** `AutofillHints.email` needs `TextInputType.emailAddress`, `AutofillHints.name` needs `TextInputType.name`.

### Saving the typed login

[FlutterPro](https://flutterpro.design/details/trigger-password-save)

- **Set `AutofillGroup(onDisposeAction: .cancel)`.** The default tries to save whenever the screen is left, even after a failed sign-in. (Same hint-list correction as above applies to this block.)

```dart
AutofillGroup(
  onDisposeAction: .cancel,
  child: Column(
    children: [
      TextField(
        autofillHints: const [
          .username,
          .email,
        ],
        keyboardType: .emailAddress,
      ),
      TextField(
        autofillHints: const [
          .password,
        ],
        obscureText: true,
      ),
    ],
  ),
)
```

- **Trigger the save with `TextInput.finishAutofillContext()` only after sign-in succeeds.** Also call it after a successful password reset, so the manager updates the saved entry.

```dart
final bool success = await auth.signIn(email, password);
if (success) {
  TextInput.finishAutofillContext();
  // navigate away
}
```

- **iOS: tie the credential to your domain.** By default it is saved under the app's name. So the same login also fills on your site in Safari, add the Associated Domains capability in Xcode with `webcredentials:yourdomain.com` and serve `yourdomain.com/.well-known/apple-app-site-association` with the `application/json` content type. The `webcredentials` key has an `apps` array, a different shape from the `applinks` entry in [flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#ios-universal-links), which covers only `applinks`.

```json
{
  "webcredentials": {
    "apps": ["TEAMID.com.example.app"]
  }
}
```

### Carry what was typed on login

[FlutterPro](https://flutterpro.design/details/prefill-from-login)

- **Pass the phone number typed on login to the forgot-password page, prefilled.** Users usually go there right after a "Wrong credentials" error, to reset the account they just typed. Same for registration: a user who typed a number on login and then taps register "just realized they don't have an account". The article gives no code.

## Clipboard

- **Text needs no plugin** [ApparenceKit](https://apparencekit.dev/flutter-tips/flutter-clipboard-cheatsheet/): `Clipboard` from `package:flutter/services.dart`.

```dart
Future<String?> getFromClipboard() {
  return Clipboard.getData(Clipboard.kTextPlain)
    .then((res) => res?.text);
}
```

```dart
import 'package:flutter/services.dart';

Future<void> copyToClipboard(String text) async {
  if (text.isNotEmpty) {
    await Clipboard.setData(ClipboardData(text: text));
    print("Copied to clipboard!"); // Or show a toast message
  }
}
```

The `print` line trips `avoid_print`, which `flutter_lints` enables ([dart ANALYSIS-AND-LINTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/ANALYSIS-AND-LINTS.md)); replace it with the article's own suggestion, a "Copied!" message.
- **Check the text is not empty before copying, and confirm with feedback ("Copied!").**
- **Images:** `Clipboard` "doesn't handle images directly"; use a plugin, "A popular choice for this is `pasteboard`."

### Clipboard suggestion under a field

[FlutterPro](https://flutterpro.design/details/clipboard-suggestion)

- **For fields that are mostly copy-pasted** (promo code, referral code, card number, tracking number): when the field gets focus, read the clipboard and show the copied value as a chip under the field, so one tap fills it in. Give the field and the suggestion the same `FocusNode`; that is how the widget knows the field was tapped, and only then does it read the clipboard.

```dart
TextField(
  controller: controller,
  focusNode: focusNode,
),
  
// Shows the clipboard as a chip under the text field
ClipboardSuggestion(
  focusNode: focusNode,
  onTap: (String value) {
    controller.text = value;

    applyPromoCode(value);
  },
),
```

- **Placement:** some bank apps show it above the keyboard instead. "Also fine, but most Android keyboards already show a paste suggestion there, iOS doesn't. Pick the spot that fits the case."
- **Only code-like text:** non-empty, `length <= 32`, no whitespace, "so a copied sentence doesn't show up".
- **The widget** reads in a focus listener, removes the listener in `dispose`, checks `mounted` before `setState`, clears on blur and after a tap, and returns `SizedBox.shrink()` when there is nothing to show. "Design the chip to your taste."

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
  
class ClipboardSuggestion extends StatefulWidget {
  final FocusNode focusNode;
  final ValueChanged<String> onTap;
  
  const ClipboardSuggestion({
    super.key,
    required this.focusNode,
    required this.onTap,
  });
  
  @override
  State<ClipboardSuggestion> createState() => _ClipboardSuggestionState();
}
  
class _ClipboardSuggestionState extends State<ClipboardSuggestion> {
  String? _suggestion;
  
  @override
  void initState() {
    super.initState();
  
    widget.focusNode.addListener(_onFocusChanged);
  }
  
  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusChanged);
  
    super.dispose();
  }
  
  Future<void> _onFocusChanged() async {
    if (!widget.focusNode.hasFocus) {
      _set(null);
      return;
    }
  
    final ClipboardData? data = await Clipboard.getData(Clipboard.kTextPlain);
    final String value = data?.text?.trim() ?? '';
  
    // Only short, single-word text, so a copied sentence doesn't show up.
    final bool isCodeLike =
        value.isNotEmpty &&
        value.length <= 32 &&
        !value.contains(RegExp(r'\s'));
  
    _set(isCodeLike ? value : null);
  }

  void _set(String? value) {
    if (!mounted || _suggestion == value) return;
  
    setState(() => _suggestion = value);
  }
  
  @override
  Widget build(BuildContext context) {
    final String? suggestion = _suggestion;
  
    if (suggestion == null) return const SizedBox.shrink();
  
    return GestureDetector(
      onTap: () {
        widget.onTap(suggestion);
  
        _set(null);
      },
      behavior: .opaque,
      child: Chip(
        avatar: const Icon(
          Icons.content_paste_rounded, 
          size: 14,
        ),
        label: Text(
          suggestion,
        ),
      ),
    );
  }
}
```

## Edit forms: Save

[FlutterPro](https://flutterpro.design/details/disable-unchanged-save)

- **On edit forms (a profile page), disable "Save" until something changes.** The user sees there is nothing to save, and when the button turns on after an edit they know the change counts. It also saves network requests that save nothing.
- **Don't hide it and don't grey it out with opacity.** A page without the button "looks not editable"; "a half-transparent colored button still looks tappable". Use solid grey: background `#F1F5F9` with text `#64748B` ("shadcn's muted colors"), "but style it however fits your app". This differs from the owner's web design, where a disabled submit is "opacity .6 with `not-allowed`" ([app-ui AUTH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/AUTH.md)); that file stays as it is, and the solid-grey rule is FlutterPro's for Flutter screens.
- **Compare each field with its initial value (trimmed in the article's code),** so typing a letter and deleting it disables the button again. Rebuild from controller listeners. "Here's the simplest way, adapt it to your state management" (the official architecture keeps this in a view model, see [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md#view-models)):

```dart
late String _initialName = widget.profile.name;
late String _initialEmail = widget.profile.email;
  
late final TextEditingController _nameController =
    TextEditingController(
      text: _initialName,
    )..addListener(_onChanged);
late final TextEditingController _emailController =
    TextEditingController(
      text: _initialEmail,
    )..addListener(_onChanged);
  
bool get _hasChanges {
  return _nameController.text.trim() != _initialName ||
      _emailController.text.trim() != _initialEmail;
}
  
void _onChanged() {
  setState(() {});
}
```

- **`null` `onPressed` means disabled. Label it "Save changes":** "the label itself explains why it's disabled, no changes yet".

```dart
FilledButton(
  onPressed: _hasChanges ? _save : null,
  child: const Text('Save changes'),
)
```

- **After a successful save, store the new values as the initial ones,** so the button disables again.

```dart
Future<void> _save() async {
  await updateProfile(...);
  
  setState(() {
    _initialName = _nameController.text.trim();
    _initialEmail = _emailController.text.trim();
  });
}
```

- **Edit forms only.** On login and sign-up, keep the button enabled and show errors on tap: "a disabled button there doesn't tell the user what's missing".

## Edit forms: Discard changes

[FlutterPro](https://flutterpro.design/details/discard-changes-prompt)

- **Ask only when something changed:** `canPop: !_hasChanges`, the same flag as the Save button. "If nothing changed, just go back, a prompt there is annoying." This differs from the `PopScope` example in [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md), which uses `canPop: false` and so prompts on every back.
- **Name the buttons after what they do:** "Discard changes" in red and "Keep editing". "Don't use Yes / No / Cancel, the user can't tell what cancels what." Both ways, untouched in their files:
  - [flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md) labels its dialog buttons `'Cancel'` and `'Discard'`; FlutterPro says "Keep editing" and "Discard changes".
  - [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md) says confirm buttons "are verb plus object ("Delete report", "Cancel")"; FlutterPro rejects "Cancel" here. MICROCOPY's "Buttons start with a verb and name the action ... Never "OK", "Yes"" agrees with FlutterPro.
- **Return on `didPop`, await the dialog, check `context.mounted`, then pop.** ([flutter VERSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/VERSIONS.md) instead captures `navigator` before the await and passes `result` on.)

```dart
PopScope(
  canPop: !_hasChanges,
  onPopInvokedWithResult: (bool didPop, Object? result) async {
    if (didPop) return;
  
    final bool? discard = await DiscardChangesDialog.show(context);
  
    if (discard == true && context.mounted) {
      Navigator.of(context).pop();
    }
  },
  child: Scaffold(...),
)
```

- **The dialog as a static `show` returning `Future<bool?>`,** the destructive action in red. "Style it to your app."

```dart
class DiscardChangesDialog {
  static Future<bool?> show(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Discard changes?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(false);
              },
              child: const Text('Keep editing'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(true);
              },
              child: const Text(
                'Discard changes',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }
}
```

- **Compose screens (a post, an email) need the same guard with different buttons.** The work can be kept, so offer "Save draft" next to "Discard", as LinkedIn does. If the app can save drafts by itself, do that and skip the prompt, as Gmail does. The check is simpler there: just that the field isn't empty.
- **A custom back button must call `Navigator.maybePop`;** a plain `pop` skips `PopScope`.
- **On iOS the swipe-back gesture turns off while `canPop` is false;** the user goes through the back button, "that's the price of the guard".
- **go_router:** the article uses `Navigator` only. The official docs say "You cannot block navigation from page-backed screens with `PopScope`" ([flutter ROUTING-AND-DEEP-LINKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ROUTING-AND-DEEP-LINKS.md#navigator-or-router)); don't assume the guard covers every navigation in a Router app.

## Links inside a translated sentence

[FlutterPro](https://flutterpro.design/details/linked-text)

- **Each language puts inline links in a different spot.** English ends with them ("I agree to the **Terms of Use** and **Privacy Policy**"); Turkish starts with them ("**Kullanım Koşullarını** ve **Gizlilik Politikasını** kabul ediyorum"). Separate widgets glued together in code "can't move like that". Keep one string, mark the links with tags, and put it in the localization files as is: translators move the tags, and the tag name says which link was tapped in every language. This applies MICROCOPY's "Never assemble a sentence around a variable" rule to links; [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md) has no rich-text guidance.

```dart
LinkedText(
  text: 'I agree to the <terms>Terms of Use</terms> and <privacy>Privacy Policy</privacy>',
  style: const TextStyle(
    fontSize: 14, 
    color: Colors.black87,
  ),
  linkColor: Colors.blue,
  onTap: (tag) {
    if (tag == 'terms') openTerms();
    if (tag == 'privacy') openPrivacy();
  },
)
```

- **The widget** ("Copy this widget and use it as is"): regex `<(\w+)>(.*?)</\1>` with `dotAll: true`, one `TapGestureRecognizer` per match, rebuilt in `didUpdateWidget` when the text changes and disposed in `dispose`, plain `Text` when there are no tags, otherwise `Text.rich` with the link at `fontWeight: .w600`.

```dart
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
  
/// Text with tappable stretches marked inline as `<terms>Terms of Use</terms>`.
///
/// Keeping the tags in the string is what makes this translatable: a
/// sentence can put its links anywhere, in any order, without the layout
/// knowing. [onTap] is handed the tag name, so it stays the same in every
/// language no matter where the link moves.
class LinkedText extends StatefulWidget {
  final String text;
  final void Function(String tag) onTap;
  final TextStyle style;
  final Color linkColor;
  final TextAlign textAlign;
  
  const LinkedText({
    super.key,
    required this.text,
    required this.onTap,
    required this.linkColor,
    required this.style,
    this.textAlign = .center,
  });
  
  @override
  State<LinkedText> createState() => _LinkedTextState();
}
  
class _LinkedTextState extends State<LinkedText> {
  static final RegExp _pattern = RegExp(
    r'<(\w+)>(.*?)</\1>',
    dotAll: true,
  );
  
  List<RegExpMatch> _matches = <RegExpMatch>[];
  List<TapGestureRecognizer> _recognizers = <TapGestureRecognizer>[];
  
  @override
  void initState() {
    super.initState();
  
    _parse();
  }
  
  @override
  void didUpdateWidget(LinkedText oldWidget) {
    super.didUpdateWidget(oldWidget);
  
    if (oldWidget.text != widget.text) {
      _disposeRecognizers();
      _parse();
    }
  }
  
  @override
  void dispose() {
    _disposeRecognizers();
  
    super.dispose();
  }

  void _parse() {
    _matches = _pattern.allMatches(widget.text).toList();
  
    _recognizers = List<TapGestureRecognizer>.generate(
      _matches.length,
      (int index) {
        final String tag = _matches[index].group(1) ?? '';
  
        return TapGestureRecognizer()
          ..onTap = () {
            widget.onTap(tag);
          };
      },
    );
  }
  
  void _disposeRecognizers() {
    for (final TapGestureRecognizer recognizer in _recognizers) {
      recognizer.dispose();
    }
  
    _recognizers = <TapGestureRecognizer>[];
  }
  
  @override
  Widget build(BuildContext context) {
    final TextStyle style = widget.style;
    final TextStyle linkStyle = style.copyWith(
      color: widget.linkColor,
      fontWeight: .w600,
    );
  
    if (_matches.isEmpty) {
      return Text(
        widget.text,
        style: style,
        textAlign: widget.textAlign,
      );
    }
  
    final List<InlineSpan> spans = <InlineSpan>[];
    int cursor = 0;
  
    for (int index = 0; index < _matches.length; index++) {
      final RegExpMatch match = _matches[index];
      final String before = widget.text.substring(cursor, match.start);
  
      if (before.isNotEmpty) {
        spans.add(
          TextSpan(
            text: before,
          ),
        );
      }
  
      spans.add(
        TextSpan(
          text: match.group(2) ?? '',
          style: linkStyle,
          recognizer: _recognizers[index],
        ),
      );
  
      cursor = match.end;
    }
  
    final String tail = widget.text.substring(cursor);
  
    if (tail.isNotEmpty) {
      spans.add(
        TextSpan(
          text: tail,
        ),
      );
    }
  
    return Text.rich(
      TextSpan(
        children: spans,
        style: style,
      ),
      textAlign: widget.textAlign,
    );
  }
}
```

- **Not shown by the article:** the tagged string inside an ARB file through gen-l10n. Check it against [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md#escaping) (`use-escaping`) before relying on "as is".

## Fields that grow with their content

Owner's rule: CSS `field-sizing: content` maps to `IntrinsicWidth` / `IntrinsicHeight`; use them carefully, and prefer `minLines` / `maxLines` in `TextField` ([flutter-ui RESPONSIVE-UNITS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/RESPONSIVE-UNITS.md#the-parallel-list)).

- **Height:** `TextField(maxLines: null)`, or `minLines` with a higher `maxLines`, grows the field line by line with no intrinsics. The return key then inserts a line break ([KEYBOARD-AND-FOCUS.md](KEYBOARD-AND-FOCUS.md)).
- **Width:** only growing sideways needs `IntrinsicWidth`, which is "relatively expensive, because it adds a speculative layout pass" and can be O(N²) in the depth of the tree ([IntrinsicWidth](https://api.flutter.dev/flutter/widgets/IntrinsicWidth-class.html)); keep it off list items ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)).

## Checkbox lists

[ApparenceKit](https://apparencekit.dev/flutter-tips/how-to-create-checkbox-list-using-checkboxlisttile-flutter/)

- **`CheckboxListTile` combines label and checkbox:** `title` (the item's text), `value` (`true` checked, `false` unchecked), `onChanged` (flip the item's state, then update the screen). Build the list with `ListView.separated`, one tile per item. No code in the article.
- **"Using `shrinkWrap: true` on your `ListView` is a good practice if this list is nested inside another scrollable view."** The official fix for a list inside an unconstrained `Column` is `Expanded` or a `SizedBox` with a height ([flutter-ui LAYOUT-AND-RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ui/LAYOUT-AND-RESPONSIVE.md#fix-layout-errors)).

## Repeated taps

[ApparenceKit](https://apparencekit.dev/flutter-tips/prevent-button-spam-flutter-rxdart/)

- **The problem:** a user can tap "10 times in just 1 second", repeating a server request or an animation.
- **ApparenceKit: RxDart `debounceTime`.** It waits for a pause longer than the duration after the last tap; new taps reset the timer. Capture taps in a `BehaviorSubject`, apply `.debounceTime()` to its stream (example: 1000 ms), `.listen()` runs the action, and cancel the subscription in `dispose()` to prevent leaks. No code. Adds the `rxdart` package, and the action fires only after the pause.
- **Official alternative:** a command-backed button: "While `running` is true the command cannot start again, which stops users triggering it by tapping a button rapidly" ([flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md#commands)). Both are kept: the command is the official route, debounce is ApparenceKit's.

## Prove it

- Paste `+994501234567` and `00994501234567` into the phone field: it holds `501234567` with the cursor at the end; typing digit by digit is untouched.
- Type past the max in an amount field: the extra keystroke is dropped, no error shows; clearing the field works.
- No `autofillHints: const [ .username` style lists: every hint is `AutofillHints.<name>` (the dot form does not compile). `environment.sdk` is at least 3.10 if any other dot shorthand is copied.
- Login and sign-up fields sit in one `AutofillGroup`; sign-up and reset use `AutofillHints.newPassword`; `TextInput.finishAutofillContext()` runs only on success, with `onDisposeAction: .cancel`.
- Edit form: Save is disabled and solid grey until a change, re-disables after typing and deleting and after a save; back with no changes leaves at once, back with changes asks "Discard changes?" with "Keep editing" and "Discard changes"; custom back buttons call `maybePop`.
- No `print` in copied clipboard code.
