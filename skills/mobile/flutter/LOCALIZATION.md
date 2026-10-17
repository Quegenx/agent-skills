# Localization

How a Flutter app shows its text, numbers and dates in the user's language. By default Flutter only provides US English localizations. The mechanism: `flutter_localizations` and `intl`, with `.arb` (App Resource Bundle) files that `gen-l10n` compiles into a generated, type-safe `AppLocalizations` class, plus delegates on `MaterialApp` (or `CupertinoApp`) that load the right translations for the resolved locale. The skill's recurring rules: fix the ARB syntax errors the generator reports, update a key in every locale's file, and read `AppLocalizations` only below `MaterialApp`. Layout is in [LAYOUT-AND-RESPONSIVE.md](LAYOUT-AND-RESPONSIVE.md); the store listing's languages are in the `aso` skill.

**Contents:** [Setup](#setup) · [Wire the delegates](#wire-the-delegates) · [ARB files](#arb-files) · [Placeholders, plurals and select](#placeholders-plurals-and-select) · [Number and date formats](#number-and-date-formats) · [Escaping](#escaping) · [Locales and resolution](#locales-and-resolution) · [iOS](#ios) · [l10n.yaml options](#l10nyaml-options) · [Versions and breaking changes](#versions-and-breaking-changes) · [Other approaches](#other-approaches) · [Prove it](#prove-it)

## Setup

1. **Add the packages:** `flutter pub add flutter_localizations --sdk=flutter` and `flutter pub add intl:any` (the docs write it as one command: `flutter pub add flutter_localizations:"{sdk: flutter}" intl:any`). The pubspec ends up with:

   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     flutter_localizations:
       sdk: flutter
     intl: any
   ```

2. **Turn on code generation** in `pubspec.yaml`:

   ```yaml
   flutter:
     generate: true
   ```

3. **Add `l10n.yaml` at the project root.** The docs' version:

   ```yaml
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-localization-file: app_localizations.dart
   ```

   The `flutter-setup-localization` skill's version adds `synthetic-package: true` (conflict, see below):

   ```yaml
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-localization-file: app_localizations.dart
   synthetic-package: true
   ```

   The skill's "Complete `l10n.yaml`":

   ```yaml
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-localization-file: app_localizations.dart
   synthetic-package: true
   use-escaping: true
   ```

4. **Write `lib/l10n/app_en.arb`** (the template) and one file per other locale, for example `app_es.arb` (see [ARB files](#arb-files)).
5. **Generate:** `flutter pub get` or `flutter run` triggers generation, or run `flutter gen-l10n`. If it fails, read the terminal for ARB syntax errors (missing commas, mismatched placeholders), fix and run again.

- **Conflict: synthetic package or source output.** The `flutter-setup-localization` skill sets `synthetic-package: true` and imports `package:flutter_gen/gen_l10n/app_localizations.dart` (its snippets are under [Wire the delegates](#wire-the-delegates)). The docs' breaking change "Localized messages are generated into source, not a synthetic package" (landed 3.28.0-0.0.pre, stable 3.32.0) says the `flutter` tool "will no longer generate a synthetic `package:flutter_gen`", that apps should "reference source files generated into the app's source directory directly", and that "In the next stable release after this change lands, `package:flutter_gen` support will be removed." Its migration: set `synthetic-package: false` in `l10n.yaml` and change the import:

  ```yaml
  synthetic-package: false

  # The files are generated into the path specified by `arb-dir`
  arb-dir: lib/i18n

  # Or, specifically provide an output path:
  output-dir: lib/src/generated/i18n
  ```

  ```dart
  // Before
  import 'package:flutter_gen/gen_l10n/app_localizations.dart';

  // After (assuming arb-dir: lib/i18n, importing from lib/main.dart)
  import 'i18n/app_localizations.dart';
  ```

  The docs' `gen-l10n` options table still says `synthetic-package` "is `true` by default". Confirm in the current docs and `flutter gen-l10n --help` for your SDK.

## Wire the delegates

- **Import** `package:flutter_localizations/flutter_localizations.dart` (the docs import it with the `flutter_localizations` prefix) and your generated `app_localizations.dart`. The docs import it from source: `import 'l10n/app_localizations.dart';`.
- **Pass `localizationsDelegates` and `supportedLocales`** to `MaterialApp` or `CupertinoApp`. The docs' version:

```dart
return const MaterialApp(
  title: 'Localizations Sample App',
  localizationsDelegates: [
    AppLocalizations.delegate, // Add this line
    ...GlobalMaterialLocalizations.delegates,
  ],
  supportedLocales: [
    Locale('en'), // English
    Locale('es'), // Spanish
  ],
  home: MyHomePage(),
);
```

- **The skill's version** imports from `package:flutter_gen`, which the docs' 3.32 breaking change removes (see the conflict under [Setup](#setup)):

```dart
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart'; // Adjust path if synthetic-package is false

// ... inside build method
return MaterialApp(
  localizationsDelegates: const [
    AppLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  supportedLocales: const [
    Locale('en'), // English
    Locale('es'), // Spanish
  ],
  home: const MyHomePage(),
);
```

- **Or use the generated list:** `supportedLocales: AppLocalizations.supportedLocales`.
- **The individual delegates** are `AppLocalizations.delegate`, `GlobalMaterialLocalizations.delegate`, `GlobalWidgetsLocalizations.delegate` and `GlobalCupertinoLocalizations.delegate` (the skill lists all four). `GlobalWidgetsLocalizations.delegate` defines the LTR or RTL text direction. Cupertino apps use `GlobalCupertinoLocalizations.delegates`; a plain `WidgetsApp` uses `GlobalWidgetsLocalizations.delegate`.
- **Read strings** with `AppLocalizations.of(context)!.helloWorld`. The widget calling it must be a descendant of `MaterialApp`: the app has to have started to initialize `AppLocalizations`, otherwise you get a null exception.
- **Localize the app title** the OS shows with `MaterialApp.onGenerateTitle: (context) => DemoLocalizations.of(context).title`.
- **A subtree in another locale:** `Localizations.override(context: context, locale: const Locale('es'), child: Builder(...))`.

## ARB files

- **New strings go in the template** `lib/l10n/app_en.arb`, each with a `description`. When you edit a key, update it in every `.arb` file.
- **Editor:** the VS Code ARB editor extension (`Google.arb-editor`).

```json
{
  "helloWorld": "Hello World!",
  "@helloWorld": {
    "description": "The conventional newborn programmer greeting"
  }
}
```

`lib/l10n/app_es.arb`:

```json
{
  "helloWorld": "¡Hola Mundo!"
}
```

## Placeholders, plurals and select

- **Placeholder:** the generated method takes it as an argument, `AppLocalizations.of(context)!.hello('John')`.

```json
"hello": "Hello {userName}",
"@hello": {
  "description": "A message with a single parameter",
  "placeholders": {
    "userName": {
      "type": "String",
      "example": "Bob"
    }
  }
}
```

- **Plural:** the full form is `"{countPlaceholder, plural, =0{message0} =1{message1} =2{message2} few{messageFew} many{messageMany} other{messageOther}}"`. The `other` case is mandatory; it is the only one required.

```json
"nWombats": "{count, plural, =0{no wombats} =1{1 wombat} other{{count} wombats}}",
"@nWombats": {
  "description": "A plural message",
  "placeholders": {
    "count": {
      "type": "num",
      "format": "compact"
    }
  }
}
```

- **Select:** the comparison is case-sensitive, so `"Male"` falls through to `other`.

```json
"pronoun": "{gender, select, male{he} female{she} other{they}}",
"@pronoun": {
  "description": "A gendered message",
  "placeholders": {
    "gender": {
      "type": "String"
    }
  }
}
```

- **In a widget,** the skill's "Complete Widget Implementation" (same `package:flutter_gen` import conflict as above):

```dart
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class GreetingWidget extends StatelessWidget {
  final String userName;
  final int notificationCount;

  const GreetingWidget({
    super.key, 
    required this.userName, 
    required this.notificationCount,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      children: [
        Text(l10n.hello(userName)),
        Text(l10n.nWombats(notificationCount)),
      ],
    );
  }
}
```

## Number and date formats

Set `"format"` on a `num` placeholder. Output for 1200000:

| Format | Output | Takes `optionalParameters` |
|---|---|---|
| `compact` | 1.2M | |
| `compactCurrency` | $1.2M | Yes |
| `compactSimpleCurrency` | $1.2M | Yes |
| `compactLong` | 1.2 million | |
| `currency` | USD1,200,000.00 | Yes |
| `decimalPattern` | 1,200,000 | |
| `decimalPatternDigits` | 1,200,000 | Yes |
| `decimalPercentPattern` | 120,000,000% | Yes |
| `percentPattern` | 120,000,000% | |
| `scientificPattern` | 1E6 | |
| `simpleCurrency` | $1,200,000 | Yes |

- **Optional parameters** look like `"decimalDigits": 2`.
- **Dates:** `DateTime` placeholders use `DateFormat`, with 41 format variations. `"format": "yMd"` gives "7/9/1959" in en_US and "9.07.1959" in ru.

## Escaping

- **Turn it on** with `use-escaping: true` in `l10n.yaml`. Text in single quotes is then literal, and `''` is one single quote: `"Hello! '{Isn''t}' this a wonderful day?"` renders as `"Hello! {Isn't} this a wonderful day?"`.

## Locales and resolution

- **Prefer `Locale.fromSubtags`,** which supports `scriptCode`. To cover Chinese fully, list `zh`, `zh_Hans`, `zh_Hant`, `zh_Hans_CN`, `zh_Hant_TW`, `zh_Hant_HK`; differentiate `fr_FR` and `fr_CA` the same way.
- **Flutter only resolves to locales in `supportedLocales`.** The order: an exact match, then the first locale with a matching `languageCode`, then the first element of `supportedLocales`. Override with `localeResolutionCallback: (locale, supportedLocales) { return locale; }`.
- **Current locale:** `Localizations.localeOf(context)`.
- **How it works:** `Localizations` behaves like an `InheritedWidget`; each `LocalizationsDelegate.load()` produces the localized objects, for example `MaterialLocalizations.of(context).backButtonTooltip`.
- **A language `GlobalMaterialLocalizations` lacks** needs about 70 translations plus date patterns and symbols (the docs' Nynorsk example defines `NnMaterialLocalizations` and a delegate returning a `SynchronousFuture`).

## iOS

- **Add the languages in Xcode** (Runner project > Info > Localizations > +) so the App Store entry shows the supported languages. Xcode creates `.strings` files and updates `project.pbxproj`.

## l10n.yaml options

Run `flutter gen-l10n --help` for the current list.

| Option | Default or note |
|---|---|
| `arb-dir` | `lib/l10n` |
| `output-dir` | Requires `synthetic-package: false` |
| `template-arb-file` | `app_en.arb` |
| `output-localization-file` | `app_localizations.dart` |
| `output-class` | `AppLocalizations` |
| `untranslated-messages-file` | |
| `preferred-supported-locales` | For example `[ en_US ]` |
| `header`, `header-file` | |
| `[no-]use-deferred-loading` | Web only |
| `gen-inputs-and-outputs-list` | |
| `synthetic-package` | Listed as default `true`; see [Setup](#setup) for 3.32 |
| `project-dir` | |
| `[no-]required-resource-attributes` | |
| `[no-]nullable-getter` | Default true; false removes the null checks (`!`) in your code |
| `[no-]format` | Runs `dart format` |
| `use-escaping` | See [Escaping](#escaping) |
| `[no-]suppress-warnings`, `[no-]relax-syntax`, `[no-]use-named-parameters` | |

## Versions and breaking changes

- **Flutter 3.32:** localized messages are generated into source, not a synthetic package `package:flutter_gen`; `generate: true` is now required when using generated l10n source; `package:flutter_gen` support is removed in the next stable after the change.
- **Flutter 3.47 (Aug 12, 2026):** `flutter_localizations` is unbundled for the design components. `localizationsDelegates: GlobalMaterialLocalizations.delegates` from `package:material_ui` now includes the Cupertino and Widgets delegates. Projects will soon be encouraged to use the `material_ui` and `cupertino_ui` packages (`flutter create` does not yet); migrate with `dart fix --apply --code=migrate_design_widgets`. `MaterialUiCompatibilityBridge` injects theme and localization data so legacy `MaterialLocalizations.of(context)` keeps working. Details in [VERSIONS.md](VERSIONS.md).

## Other approaches

- **A plain Map-based class** (`DemoLocalizations`) with your own delegate.
- **`intl_translation`:** `dart run intl_translation:extract_to_arb ...` and `dart run intl_translation:generate_from_arb ...`.

## Prove it

- **Generation is clean:** `flutter gen-l10n` (or `flutter pub get`) finishes with no ARB errors.
- **No missing keys:** with `untranslated-messages-file` set, the generated file lists no untranslated messages for any shipped locale.
- **Every locale renders:** switching the device language to each entry in `supportedLocales` shows translated strings, and an unsupported language falls back to the first supported locale.
- **Plurals and select cover `other`:** `nWombats(0)`, `nWombats(1)` and `nWombats(5)` give "no wombats", "1 wombat" and "5 wombats"; `pronoun('Male')` gives the `other` text.
- **Formats match the locale:** a `yMd` date shows "7/9/1959" in en_US and "9.07.1959" in ru.
- **Right-to-left works:** in an RTL locale the layout mirrors (requires `GlobalWidgetsLocalizations` among the delegates).
- **No flutter_gen import** remains on Flutter 3.32 or later; the generated `app_localizations.dart` is imported from source.
- **The App Store lists the languages:** Xcode's Runner project > Info > Localizations contains every shipped locale.
