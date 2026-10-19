# Formatting values for humans

Formatting values in Dart code before they reach the screen: dates with `DateFormat`, counts, money and big numbers with `NumberFormat`, phone numbers while typing and on display, and never showing "null". Source: FlutterPro tips by Kamran Bekirov (flutterpro.design), third-party community advice, not Flutter team docs. The official way to format numbers and dates inside ARB messages (the `"format"` value on a gen-l10n placeholder) is in [flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md#number-and-date-formats); this file covers direct `intl` calls for values that are not in ARB messages. Text fields in general are in [FORMS-AND-INPUT.md](FORMS-AND-INPUT.md).

**Contents:** [Version notes](#version-notes) · [Dates](#dates) · [Numbers](#numbers) · [Phone numbers](#phone-numbers) · [Never show null](#never-show-null) · [Prove it](#prove-it)

## Version notes

- No article states a Dart or package version (`intl`, `mask_text_input_formatter`, `phone_numbers_parser`). [FlutterPro](https://flutterpro.design/details/format-date-times)
- **Two extensions named `StringX`:** the phone tip's `StringX on String` and the null tip's `StringX on String?`. Rename one if you copy both into one app.

## Dates

[FlutterPro](https://flutterpro.design/details/format-date-times): `2016-06-24 14:44:00.000` is what `DateTime` prints, and no user should read a date like that. Show `24 July 2016, 14:44` instead. (The source's raw value says June and its formatted one July; use one month if you copy the example.)

`DateFormat` from [intl](https://pub.dev/packages/intl) takes a pattern and a locale, so month names come out in the user's language:

```dart
DateFormat('d MMMM yyyy, HH:mm', languageCode).format(dateTime)
```

Locale data doesn't load itself, so initialize it once in `main`:

```dart
await initializeDateFormatting();
```

Calling `DateFormat` with patterns all over the app gets messy. Collect the formats in one extension on `DateTime?`, where every case has a method, a null date becomes a placeholder instead of `null` on screen, and showing a date stays one call:

```dart
Text(
  order.createdAt.formattedDateTime(languageCode),
)
```

**Pattern by context:**

| Where | Pattern | Example |
|---|---|---|
| The date is the point (order details) | `d MMMM yyyy, HH:mm` | 24 July 2016, 14:44 |
| Dense lists, no room for full month names | `d MMM yyyy` | 24 Jul 2016 |
| The user plans around it (an appointment) | `EEEE, d MMMM` | Friday, 24 July |
| Everything on the screen happened today | `HH:mm` | 14:44 |
| Recent dates | `Today` / `Yesterday`, then the date | Today |
| Requests to the backend, never shown | `yyyy-MM-dd`, `''` for null | 2016-07-24 |

For recent dates, `Today` reads better than `24 July`: check today and yesterday first, then fall back to the date. "Run the labels through your translations too." The file below hard-codes `'Today'`, `'Yesterday'` and `'N/A'`; that is the article's simplification, so route them through your localizations ([flutter LOCALIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/LOCALIZATION.md)).

The whole file, ready to copy:

```dart
import 'package:intl/intl.dart';

extension DateTimeX on DateTime? {
  // 24 July 2016, 14:44
  String formattedDateTime(String languageCode) {
    if (this == null) return 'N/A';

    return DateFormat('d MMMM yyyy, HH:mm', languageCode).format(this!);
  }

  // 24 Jul 2016
  String formattedDate(String languageCode) {
    if (this == null) return 'N/A';

    return DateFormat('d MMM yyyy', languageCode).format(this!);
  }

  // Friday, 24 July
  String formattedWeekdayDate(String languageCode) {
    if (this == null) return 'N/A';

    return DateFormat('EEEE, d MMMM', languageCode).format(this!);
  }

  // 14:44
  String get formattedTime {
    if (this == null) return 'N/A';

    return DateFormat('HH:mm').format(this!);
  }

  // Today · Yesterday · 24 Jul 2016
  String formattedDayOrDate(String languageCode) {
    if (this == null) return 'N/A';

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return formattedDate(languageCode);
  }

  // 2016-07-24, for requests only
  String get formattedForBackend {
    if (this == null) return '';

    return DateFormat('yyyy-MM-dd').format(this!);
  }

  bool get isToday {
    if (this == null) return false;

    final DateTime now = DateTime.now();

    return this!.year == now.year &&
        this!.month == now.month &&
        this!.day == now.day;
  }

  bool get isYesterday {
    if (this == null) return false;

    final DateTime yesterday = DateTime.now().subtract(
      const Duration(days: 1),
    );

    return this!.year == yesterday.year &&
        this!.month == yesterday.month &&
        this!.day == yesterday.day;
  }
}
```

The web version of the same idea (`Intl.DateTimeFormat` styles and `Intl.RelativeTimeFormat` for "yesterday") is in [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md).

## Numbers

[FlutterPro](https://flutterpro.design/details/format-numbers-for-humans): `1234567` looks different depending on where your user is: `1,234,567` in the US, `1.234.567` in Germany, `1 234 567` in France. `NumberFormat` from intl handles that. The simplest case is a plain count, like search results or items in a cart:

```dart
// en_US → "1,234,567"
// fr_FR → "1 234 567"
final String count = NumberFormat
    .decimalPatternDigits()
    .format(1234567);
```

It follows the user's region by default. To force one, pass it in: `NumberFormat.decimalPatternDigits(locale: 'de_DE')`. `decimalDigits: 2` sets how many digits show after the dot.

Money needs a symbol and the right number of decimals. Give `simpleCurrency` the currency code and it handles both, even the decimal count (US Dollar has two, Japanese Yen none):

```dart
// en_US → "$1,234.50"
// de_DE → "1.234,50 $"
final String price = NumberFormat
    .simpleCurrency(
      name: 'USD',
    )
    .format(1234.50);
```

Big numbers read better short. `compact` turns them into `K` and `M`:

```dart
// "1.23M"
final String views = NumberFormat
    .compact()
    .format(1234567);

// "9.8K"
final String likes = NumberFormat
    .compact()
    .format(9800);
```

`compactLong` spells the word out:

```dart
// "1.23 million"
final String views = NumberFormat
    .compactLong()
    .format(1234567);
```

(The flutter skill's ARB table shows `compact` as 1.2M and `compactLong` as 1.2 million for 1200000; the input differs, so both agree.)

- **The rule:** "if the user reads it as "how much", format. If they read it as "which one", skip."
- `NumberFormat` also does sign control, money short forms like `$1.2M`, custom patterns, digit limits and rounding: https://pub.dev/documentation/intl/latest/intl/NumberFormat-class.html.

An extension on `num` "that covers 99% of the time":

```dart
extension NumX on num {
  String humanizedCount({
    int? decimalDigits,
  }) {
    return NumberFormat.decimalPatternDigits(
      decimalDigits: decimalDigits,
    ).format(this);
  }

  String humanizedCurrency(String code) {
    return NumberFormat.simpleCurrency(
      name: code,
    ).format(this);
  }

  String humanizedCompact() {
    return NumberFormat.compact().format(this);
  }
}
```

## Phone numbers

[FlutterPro](https://flutterpro.design/details/format-phone-numbers): "`994501234567` is a string. `+994 50 123 45 67` is a phone number." Humans read digits in groups, so a formatted number is easier to check and harder to mistype. Format it everywhere the user sees it, including while they type.

**One country:** a mask is enough, with [mask_text_input_formatter](https://pub.dev/packages/mask_text_input_formatter). `eager` inserts the spaces as the user types, not one digit late:

```dart
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

final phoneNumberInputFormatter = MaskTextInputFormatter(
  mask: '+### ## ### ## ##',
  filter: {
    "#": RegExp(r'[0-9]'),
  },
  type: MaskAutoCompletionType.eager,
);
```

Wire it into the field:

```dart
TextField(
  inputFormatters: [
    phoneNumberInputFormatter,
  ],
)
```

The same formatter also formats numbers coming from your backend, and deformats them back. A small extension makes both one call:

```dart
extension StringX on String {
  String get maskPhoneNumber {
    return phoneNumberInputFormatter.maskText(this);
  }

  String get unmaskPhoneNumber {
    return phoneNumberInputFormatter.unmaskText(this);
  }
}
```

Show it formatted:

```dart
Text(
  user.phoneNumber.maskPhoneNumber,
)
```

Send it raw:

```dart
api.updatePhone(
  controller.text.unmaskPhoneNumber,
)
```

**Store E.164 with the `+`, not bare digits.** The mask `+### ## ### ## ##` unmasks to digits without the `+`. Store and send one E.164 value (`+`, country code, national number) and render separators only for display; Meta's WhatsApp Cloud API: "We highly recommend that you include both the plus sign and country calling code" ([phone numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers/)). The Israeli case (trunk `0`, `+972`), the ranges, special numbers and what the Israeli source got wrong are in [web-accessibility PHONE-NUMBERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/PHONE-NUMBERS.md) [skills-il, israeli-phone-formatter].

**With a country picker:** one mask stops working. Don't write a mask per country. First check whether your country picker package ships a formatter. If not, [phone_numbers_parser](https://pub.dev/packages/phone_numbers_parser) knows every country's format; wrap it in a small `TextInputFormatter` with the selected country's ISO code:

```dart
class PhoneInputFormatter extends TextInputFormatter {
  PhoneInputFormatter(this.isoCode);

  final IsoCode isoCode;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // drop own spaces and pasted symbols
    final String digits = newValue.text.replaceAll(
      RegExp(r'[^0-9]'),
      '',
    );

    return TextEditingValue(
      text: PhoneNumberFormatter.formatNsn(digits, isoCode),
    );
  }
}
```

The returned `TextEditingValue` sets no `selection`, so the source leaves the caret position unhandled.

Validate against a parser's metadata, not a regex: a hand-written regex for one country's numbers over-accepts (the Israeli source's own sample `0521234567` fails libphonenumber), so take test numbers from the parser, not from a blog post ([web-accessibility PHONE-NUMBERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/PHONE-NUMBERS.md#validate-with-libphonenumber)).

## Never show null

[FlutterPro](https://flutterpro.design/details/never-show-null): three broken displays.

- A field comes back `null` from the API and `Text(state.field.toString())` shows the word "null". "For them this means nothing."
- The backend serializes null as the literal string `"null"`. Same thing.
- The field is an empty string: a blank spot where a value should be. "Looks just as broken."

`Text(state.field ?? '-')` seems to handle these, but it misses some cases. This extension handles all:

```dart
extension StringX on String? {
  bool get isUsable {
    return this != null && this!.isNotEmpty && this != 'null';
  }

  String orPlaceholder([String placeholder = '-']) {
    if (!isUsable) return placeholder;

    return this!;
  }
}
```

Then:

```dart
Text(
  user.name.orPlaceholder(),
)
// null → "-"

Text(
  user.name.orPlaceholder('N/A'),
)
// null → "N/A"
```

Sometimes the goal is hiding the widget, not a placeholder. Instead of:

```dart
if (user.profession != null && user.profession!.isNotEmpty
      && user.profession != 'null')
  Text(
    user.profession!,
  )
```

Just:

```dart
if (user.profession.isUsable)
  Text(
    user.profession!,
  )
```

When the value isn't a `String`, call `.toString()` first:

```dart
Text(
  order.totalPrice.toString().orPlaceholder(),
)
```

If objects in the chain can be null, wrap the whole expression in parentheses:

```dart
Text(
  (state.cartInfo?.totalPrice?.toString()).orPlaceholder(),
)
```

Without the parentheses, a null `cartInfo` short-circuits the whole expression and `orPlaceholder()` never runs; with them it always runs ([dart LANGUAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/LANGUAGE.md) on null-aware chains).

**Placeholder character (two choices, both tagged):** [FlutterPro]: `-` by default, or a word such as `'N/A'`. The web [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md) shows an unavailable count as the em dash character (U+2014).

## Prove it

- **Dates:** no screen shows a raw `DateTime` string; switching the app language changes month and weekday names; `initializeDateFormatting()` runs in `main`; `Today` and `Yesterday` are translated; backend requests use `yyyy-MM-dd`.
- **Numbers:** counts, prices and big numbers follow the device region (check `en_US`, `de_DE`, `fr_FR`); a JPY price shows no decimals; numbers the user reads as "which one" are left unformatted.
- **Phone numbers:** typing shows the spaces as each digit lands; pasted numbers with symbols are cleaned; the request body carries one E.164 value with its `+` and no separators; with a country picker, switching country reformats the field.
- **Null:** with the API returning `null`, `"null"` and `""` for a text field, the screen shows the placeholder (or hides the widget), never the word "null" or a blank.
