# Style and documentation

Effective Dart's Style and Documentation guides: identifier casing, import ordering, formatting, comments, `///` doc comments and the code examples inside them. Two themes decide most calls: be consistent (two pieces of code should look different only when they differ in a meaningful way) and be brief ("The goal is code that is *economical*, not *dense*."). The official whitespace rules are whatever `dart format` produces; the other formatting rules cover the few things it cannot fix. Most rules name a linter rule that enforces them; enabling those lints is in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md). Usage and API design rules are in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md).

**Contents:** [Rule strength and terms](#rule-strength-and-terms) · [Identifiers](#identifiers) · [Import and export ordering](#import-and-export-ordering) · [Formatting](#formatting) · [Comments](#comments) · [Doc comments: what to document](#doc-comments-what-to-document) · [Doc comments: the summary and openers](#doc-comments-the-summary-and-openers) · [Doc comments: parameters, returns, throws](#doc-comments-parameters-returns-throws) · [Doc comments: placement](#doc-comments-placement) · [References and links](#references-and-links) · [Markdown and code fences](#markdown-and-code-fences) · [Code examples from files ({@example})](#code-examples-from-files-example) · [Writing style](#writing-style) · [Prove it](#prove-it)

## Rule strength and terms

| Keyword | Meaning |
|---|---|
| DO | Always follow. |
| DON'T | Almost never a good idea. |
| PREFER | Should follow; there may be circumstances where it makes sense otherwise. |
| AVOID | The dual of PREFER: should not do, with possible exceptions. |
| CONSIDER | Might or might not follow, depending on circumstances, precedent and preference. |

Listed exceptions may not be exhaustive.

| Term | Means |
|---|---|
| Library member | A top-level field, getter, setter or function: anything top-level that isn't a type. |
| Class member | A constructor, field, getter, setter, function or operator declared inside a class. |
| Member | Either a library member or a class member. |
| Variable | Top-level variables, parameters and locals (not static or instance fields). |
| Type | Any named type declaration: class, typedef, enum. |
| Property | A top-level variable, getter, setter or field. |

## Identifiers

Three casings: UpperCamelCase, lowerCamelCase (first word lowercase, even if it is an acronym) and lowercase_with_underscores (lowercase, even for acronyms).

- **DO name types using UpperCamelCase** (lint `camel_case_types`). This covers classes, enum types, typedefs and type parameters, including classes used as metadata annotations. If an annotation's constructor takes no parameters, you may create a separate lowerCamelCase const: `const foo = Foo();` then `@foo`.
  ```dart
  class SliderMenu { ... }
  class HttpRequest { ... }
  typedef Predicate<T> = bool Function(T value);
  ```
- **DO name extensions using UpperCamelCase** (lint `camel_case_extensions`): `extension MyFancyList<T> on List<T> { ... }`.
- **DO name packages, directories and source files using lowercase_with_underscores** (lints `file_names`, `package_names`). Some file systems are case-insensitive, and underscores keep the name a valid Dart identifier. Good: `my_package/lib/file_system.dart`, `slider_menu.dart`. Bad: `mypackage/lib/file-system.dart`, `SliderMenu.dart`.
- **DO name import prefixes using lowercase_with_underscores** (lint `library_prefixes`): `import 'dart:math' as math;`, `as angular_components;`, `as js;`. Bad: `as Math`, `as angularComponents`, `as JS`.
- **DO name other identifiers using lowerCamelCase** (lint `non_constant_identifier_names`): class members, top-level definitions, variables, parameters and named parameters.
- **PREFER lowerCamelCase for constant names** (lint `constant_identifier_names`), including enum values: `const pi = 3.14; const defaultTimeout = 1000; final urlScheme = RegExp('^([a-z]+):');`. Bad: `PI`, `DefaultTimeout`, `URL_SCHEME`, `NUMBER_GENERATOR`. SCREAMING_CAPS is allowed when adding to a file that already uses it, or when generating Dart that parallels Java code (for example protobuf enums). The reasons: it looks bad (CSS color enums), constants often become final non-const, and the enum `values` property is const and lowercase.
- **DO capitalize acronyms and abbreviations longer than two letters like words:** `Http`, `Nasa`, `Uri`, `Esq`, `Ave`. Two-letter ones capitalized in English stay capitalized: `ID`, `TV`, `UI`. Two-letter ones not capitalized in English: `Mr`, `St`, `Rd`. Bad: `HTTP`, `NASA`, `URI`, `Id`, `Tv`, `Ui`, `MR`. `HTTPSFTP` is ambiguous; write `HttpsFtp` or `HttpSftp`. At the start of a lowerCamelCase identifier the abbreviation is all lowercase: `httpConnection`, `tvSet`, `mrRogers`.
- **PREFER using wildcards for unused callback parameters.** Name an unused parameter `_` (a non-binding wildcard variable); several `_` are allowed: `.onError((_, _) { ... })`. Only for anonymous local functions; top-level functions and methods must name their parameters. Wildcards need language version 3.7 or later; before that use `__`, `___`. Lints `no_wildcard_variable_uses` and `unnecessary_underscores` help migrate. Language versions are in [VERSIONS.md](VERSIONS.md).
- **DON'T use a leading underscore for identifiers that aren't private:** locals, parameters, local functions, library prefixes.
- **DON'T use prefix letters (Hungarian notation):** `defaultTimeout`, not `kDefaultTimeout`.
- **DON'T explicitly name libraries.** `library my_library;` is legacy and discouraged; Dart generates a unique tag from the path and filename. Good: `/// A really great test library.` then `@TestOn('browser')` then `library;`.

## Import and export ordering

One lint covers this section: `directives_ordering`. Separate sections with a blank line.

- **DO place `dart:` imports before other imports.**
- **DO place `package:` imports before relative imports.**
- **DO specify exports in a separate section after all imports.**
- **DO sort sections alphabetically:** `package:bar` before `package:foo`; `foo.dart` before `foo/foo.dart`.

Which import paths to use (relative, `package:`, `lib/src`) is in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#libraries-and-imports).

## Formatting

- **DO format your code using `dart format`.** "The official whitespace-handling rules for Dart are *whatever `dart format` produces*." Formatter FAQ: https://github.com/dart-lang/dart_style/wiki/FAQ.
- **CONSIDER changing your code to be more formatter-friendly:** shorten local names, hoist expressions into locals.
- **PREFER lines 80 characters or fewer** (lint `lines_longer_than_80_chars`). `dart format` defaults to 80 and the page width is configurable; it does not split long string literals, so split those by hand. Wanting longer lines usually means the code is too verbose; the main offender is `VeryLongCamelCaseClassNames`, so ask whether each word in a type name tells you something critical or prevents a name collision. Exceptions: a URI or file path in a comment or string (usually an import or export) may stay whole, and multi-line strings may contain longer lines.
- **DO use curly braces for all flow control statements** (lint `curly_braces_in_flow_control_structures`); this avoids the dangling else. Exception: an `if` with no `else` that fits on one line may omit them: `if (arg == null) return defaultValue;`. If the body wraps, use braces.

## Comments

Effective Dart frames these as tips for comments you don't want in the generated docs, though the sentence rule covers all comments.

- **DO format comments like sentences.** Capitalize the first word unless it is a case-sensitive identifier, and end with a period (or `!` or `?`). This applies to doc comments, inline comments, TODOs and even fragments.
- **DON'T use block comments for documentation.** Use `/* ... */` only to temporarily comment out code; every other comment uses `//`.

## Doc comments: what to document

Doc comments start with `///` and are parsed by `dart doc`.

- **DO use `///` doc comments to document members and types** (lint `slash_for_doc_comments`). `dart doc` supports `///` and `/** ... */`, but `///` is more compact (`/**` and `*/` add two content-free lines) and easier with `*` bullet lists. If you find code still using the JavaDoc style, consider cleaning it up. The dart-lang skill puts it flatly: always `///`, never `/** ... */`.
- **PREFER writing doc comments for public APIs** (lint `public_member_api_docs`). Document most of them, not necessarily every one.
- **CONSIDER a library-level doc comment,** placed before the `library` directive and any annotations at the start of the file: a one-sentence summary, the terminology, a couple of complete code samples, links to the most important classes and functions, and links to external domain references.
- **Private APIs: the sources differ.** Effective Dart says CONSIDER doc comments for private APIs: they help in understanding private members called from other parts of the library. The dart-lang `dart-write-documentation` skill says skip private `_` members unless asked, because they do not appear in generated API docs.
- **AVOID redundancy with the surrounding context.** The class name and signature are visible. Good: `/// Sets the tooltip to [lines].` Bad: `/// Sets the tooltip for this radio button widget to the list of strings in [lines].` Add a doc comment only when it gives context, caveats or usage details that aren't obvious. Do not restate the signature or name ("This class is a...", "The foo method does...").
- **Don't repeat docs on `@override` members whose behavior is unchanged.** Dartdoc inherits them.

## Doc comments: the summary and openers

- **DO start doc comments with a single-sentence summary:** brief, user-centric, ending in a period. A fragment is often enough. Give just enough context for the reader to decide whether to keep reading or look elsewhere. Good: `/// Deletes the file at [path] from the file system.`
- **DO separate the first sentence into its own paragraph** with a blank `///` line after it. `dart doc` uses the first paragraph as the summary in lists of classes and members, copied verbatim. A truly empty line (no `///`) ends the doc comment block.
  ```dart
  /// Deletes the file at [path].
  ///
  /// Throws an [IOError] if the file could not be found. Throws a
  /// [PermissionError] if the file is present but could not be deleted.
  void delete(String path) {
    ...
  }
  ```
- **PREFER starting function or method comments with third-person verbs if the main purpose is a side effect:** `/// Connects to the server and fetches the query results.`, `/// Starts the stopwatch if not already running.`, `/// Initializes the database.`
- **PREFER starting a non-boolean variable or property comment with a noun phrase,** even for getters that compute: `/// The current day of the week, where `0` is Sunday.`, `/// The radius of the sphere.`
- **PREFER starting a boolean variable or property comment with "Whether"** followed by a noun or gerund phrase (intentionally not "Whether or not"): `/// Whether the modal is currently displayed to the user.`, `/// Whether the connection is active.`
- **PREFER a noun phrase or non-imperative verb phrase for a function or method whose primary purpose is returning a value** (conceptually a property): `/// The [index]th element of this iterable in iteration order.` on `E elementAt(int index);`, and `/// Whether this iterable contains an element equal to [element].`. `Iterable.take` is described as "The first [count] elements of ...".
- **PREFER starting library or type comments with noun phrases** that describe an *instance* of the type: `/// A chunk of non-breaking output text terminated by a hard or soft newline.`

## Doc comments: parameters, returns, throws

- **DO use prose to explain parameters, return values and exceptions.** No `@param`, `@return`, `@returns`, `@throws`, `@exception`, `@see` or `@type`. Consider sections that start "The [parameter]", "Returns" and "Throws". Errors can be documented the same way as exceptions, or just as requirements that must be satisfied, without naming the precise error thrown.
  ```dart
  /// Defines a flag with the given [name] and [abbreviation].
  ///
  /// The [name] and [abbreviation] strings must not be empty.
  ///
  /// Returns a new flag.
  ///
  /// Throws a [DuplicateFlagException] if there is already an option named
  /// [name] or there is already an option using the [abbreviation].
  Flag addFlag(String name, String abbreviation) => ...
  ```
  After the first paragraph, use Markdown for edge cases, thrown exceptions and internal behavior:
  ```dart
  /// Fetches the remote data.
  ///
  /// If [force] is true, this bypasses the local cache and forces a
  /// network request.
  ///
  /// Throws a [NetworkException] if the host is unreachable.
  Data load(bool force) { ... }
  ```

## Doc comments: placement

- **DO put doc comments before metadata annotations:** `/// A button ...` then `@Component(selector: 'toggle')` then `class ToggleComponent {}`. Likewise `/// Renders the widget to the screen.` then `@override` then `Widget build(BuildContext context)`.
- **DON'T write documentation for both getter and setter.** `dart doc` treats the pair as one field and discards the setter's doc comment if both have one. Effective Dart says document only one of them; the dart-lang skill says only the getter, and that tooling warns if both are documented.

## References and links

- **DO use square brackets to refer to in-scope identifiers** (lint `comment_references`): parameters, classes, methods, fields, top-level functions. `dart doc` looks up the name and links to its API docs. Examples: `[StateError]`, `[Duration.inDays]`, a named constructor `[Point.polar]`, the unnamed constructor `[Point.new]` (for example `[User.new]`, not `[User()]`). Reference syntax: https://dart.dev/tools/doc-comments/references.
- **Never use backticks for parameters;** use `[name]`.
- **Put keywords, literals and expressions in backticks,** never in brackets: `` `null` ``, `` `true` ``, `` `void` ``.
- **Parentheses in method links: the sources differ.** Effective Dart writes `[anotherMethod()]` and says the parentheses are optional. The dart-lang skill says no parentheses: `[String.contains]`, not `[String.contains()]`. Writing them without parentheses satisfies both.
- **Link symbols the library does not import with `@docImport`** on the `library;` declaration, not with a real import:
```dart
/// @docImport 'package:http/http.dart';
library;

/// To use this, you must pass a [Client].
```

## Markdown and code fences

Most Markdown is allowed and processed by `package:markdown`. Nested lists must be indented at least 4 spaces (5 counting the space after `///`).

- **AVOID using Markdown excessively.** "When in doubt, format less."
- **AVOID using HTML for formatting.** Maybe for tables, rarely.
- **PREFER backtick fences for code blocks,** not 4-space indentation. Indented blocks are brittle inside lists or when the code is itself indented; fences also let you name the language.
- **CONSIDER including code samples in doc comments** as fenced blocks inside `///`.
- **Fence language: the sources differ.** Effective Dart says the code language defaults to Dart. The dart-lang skill says always label fences (```` ```dart ````, ```` ```sh ````) because dartdoc otherwise guesses the language "and frequently guesses wrong". Label them.

## Code examples from files ({@example})

Put multi-line examples in standalone `.dart` files and inject them with `{@example}` instead of writing them inline in `///`, so the examples can be analyzed, linted and run.

- **Syntax:** `{@example <path>[#<region>] [lang=LANGUAGE] [indent=keep|strip]}`.
- **`lang`** is detected from the file extension, or set explicitly (`lang=text`).
- **`indent=strip` is the default** and removes shared leading indentation.
- **Whole file:** `/// {@example /example/client_request.dart}`.
- **Regions:** wrap code in `// #region request_snippet` ... `// #endregion request_snippet` and reference it as `{@example /example/client.dart#request_snippet}`.
- **Hide a line** by appending `#hide`: `final mockServer = startServer(); // #hide`.
- **Markers are processed only when a region suffix is given.** A whole-file include embeds the file as is, marker text included.
- **Markers work in any format,** because dartdoc strips them with a regex: YAML `# #region` and HTML `<!-- #region -->` work too.
- **`{@example}` is block-level** and must sit on its own `///` line.
- **Paths:** a leading `/` means the package root (`{@example /test/data/sample.txt}` reads `<package_root>/test/data/sample.txt`). Without it the path is relative to the file holding the doc comment (`{@example ../utils/demo.dart}`). `..` is allowed, but traversal stops at the package root.
- **No network URLs** (`https://`). Always use `/` separators, even on Windows. URI encoding such as `%20` is allowed.

## Writing style

- **PREFER brevity.** Be clear and precise, but also terse.
- **AVOID abbreviations and acronyms unless they are obvious.** Many people don't know what "i.e.", "e.g." and "et al." mean, and a field acronym may be less widely known than you think.
- **PREFER using "this" instead of "the" to refer to a member's instance,** with a qualifier after "this": `/// The value this box wraps.`, `/// Whether this box contains a value.`

## Prove it

- **`dart format` changes nothing** on the files you touched.
- **`dart analyze` reports no `comment_references` warnings:** every bracketed reference resolves.
- **`dart analyze` passes on the `{@example}` files** themselves.
- **`dart doc` (optional) builds without "Failed to read file" or "missing region" warnings.**
- **Each public doc comment's first paragraph is one sentence** ending in a period, followed by a `///` blank line, and no `@param`, `@returns` or `@throws` tags appear anywhere.
- **Only getters carry docs in getter/setter pairs,** and doc comments sit above annotations.
