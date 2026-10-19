# Core libraries

The dart:core, dart:collection and dart:convert APIs that come up in everyday code: adding days to a `DateTime` across a daylight saving change, the three map kinds and their common operations, shallow and deep copies of lists and maps, packages for immutable collections, pretty-printed JSON, calling a function dynamically with `Function.apply`, and runtime path operations with `package:path`. The tips come from ApparenceKit's Dart articles (apparencekit.dev); each is checked against the API reference at api.dart.dev, and where the two disagree the official form is given and the source's error is named. Effective Dart rules about collections (literals, `List.from`, `cast()`) are in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#collections) and win where a tip contradicts them; JSON decoding into typed models is in [RECORDS-AND-PATTERNS.md](RECORDS-AND-PATTERNS.md); compiling to JS is in [CLI-APPS.md](CLI-APPS.md).

**Contents:** [Dates across daylight saving](#dates-across-daylight-saving) · [Maps](#maps) · [Copying lists and maps](#copying-lists-and-maps) · [Immutable collection packages](#immutable-collection-packages) · [Pretty-printing JSON](#pretty-printing-json) · [Calling a function dynamically](#calling-a-function-dynamically) · [Paths with package:path](#paths-with-packagepath) · [Prove it](#prove-it)

## Dates across daylight saving

[ApparenceKit](https://apparencekit.dev/flutter-tips/datetime-advanced-understanding-flutter/) shows two ways to add a day, and "they don't always give the same answer".

Method 1, a fixed duration:

```dart
final date = DateTime(2025,10,26,0,0,0);
final datePlus1 = date.add(const Duration(days: 1));
```

Method 2, the next calendar day:

```dart
final date = DateTime(2025,10,26,0,0,0);
final datePlusOneDay = DateTime(date.year, date.month, date.day + 1, 0, 0, 0);
```

- **`add(Duration(days: 1))` adds exactly 24 hours.** The API reference says the same of `today.add(const Duration(days: 50))`: "the duration being added is actually 50 * 24 * 60 * 60 seconds. If the resulting `DateTime` has a different daylight saving offset than `this`, then the result won't have the same time-of-day as `this`, and may not even hit the calendar date 50 days later." It ends: "Be careful when working with dates in local time." (https://api.dart.dev/dart-core/DateTime/add.html)
- **The source's example:** in France, adding 24 hours to `2025-10-26 00:00:00` gives `2025-10-26 23:00:00`, not `2025-10-27 00:00:00`, because the midnight-to-midnight day of the clock change lasts 25 hours. Method 2 "will reliably give you `2025-10-27 00:00:00`" because it ignores DST effects on the calendar date.
- **The source contradicts itself on the date:** it says the clocks fall back "on October 27th, 2025", but its own result (the 26th at 23:00) only happens if the change falls on the 26th. Check the transition date for the time zone before you reuse the example in a test.
- **Pick by intent** ([ApparenceKit](https://apparencekit.dev/flutter-tips/datetime-advanced-understanding-flutter/)): use `add(Duration)` for exact time intervals. For calendars, events scheduled on distinct days, or "next day" navigation, build `DateTime(y, m, d + 1, ...)`, and "**don't use the first method**": it "might unexpectedly shift your day backward or forward due to DST".
- **Name the date checks** with an extension on `DateTime` (`isToday()`, `isSameDay(other)`); see [LANGUAGE.md](LANGUAGE.md#extension-methods).

## Maps

[ApparenceKit](https://apparencekit.dev/flutter-tips/dart-map-cheatsheet-guide/): a map holds key and value pairs with unique keys. Lookup by key "is usually instant, no matter how big the map is (this takes O(1) time)", where finding an item in a list may mean checking every item (O(n)).

| Kind | Order | Source |
|---|---|---|
| `LinkedHashMap` | Insertion order. `Map()` "Creates an empty LinkedHashMap", is "equivalent to the non-const map literal `<K, V>{}`" and "iterates in key insertion order" | https://api.dart.dev/dart-core/Map/Map.html |
| `HashMap` | "unordered (the order of iteration is not guaranteed)"; the order "only changes when the map is modified" | https://api.dart.dev/dart-collection/HashMap-class.html |
| `SplayTreeMap` | Sorted by key, "based on a self-balancing binary tree" | [ApparenceKit](https://apparencekit.dev/flutter-tips/dart-map-cheatsheet-guide/) |

- **The source is wrong about the default:** it calls `HashMap` "the standard map". A map literal and `Map()` are `LinkedHashMap`s (api.dart.dev above); import `dart:collection` and ask for `HashMap` only when you want no ordering.
- **Create with literals:** `var data = {'name': 'John Doe', 'occupation': 'gardener'};` and `var data2 = <int, String>{1: 'sky', 2: 'falcon', 3: 'rock'};` ([ApparenceKit](https://apparencekit.dev/flutter-tips/dart-map-cheatsheet-guide/)).

**List to map.** The source shows three forms:

```dart
// Transform a list into a map
var listResult = Map.fromIterable([
  {'key': 'test1', 'value': 0},
  {'key': 'test2', 'value': 1},
  {'key': 'test3', 'value': 2}
],
  key: (item) => item['key'], // Use the 'key' from each item
  value: (item) => item['value'] // Use the 'value' from each item
);

// Or using a more modern syntax (from Dart 2.3+)
var modernResult = { for (var item in [
  {'key': 'test1', 'value': 0},
  {'key': 'test2', 'value': 1},
  {'key': 'test3', 'value': 2}
]) item['key']: item['value'] };

// Or simply using .asMap() for lists where the index is the key
var listItems = ['test1', 'test2', 'test3'];
var mapFromList = listItems.asMap(); // {0: 'test1', 1: 'test2', 2: 'test3'}
```

- **Use the collection-`for` form, not `Map.fromIterable`:** the recommended lint set includes `prefer_for_elements_to_map_fromIterable` ([ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md#lint-sets)). `asMap()` gives an index-keyed map (a view, per the `as___()` naming rule in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#naming-apis)).

**Everyday operations** ([ApparenceKit](https://apparencekit.dev/flutter-tips/dart-map-cheatsheet-guide/); the source spells the key `'Usrname'` throughout, kept here as written):

```dart
var details = {'Usrname':'bruce', 'Password':'mypass'};

// Adding a new entry
details['Uid'] = '3802983209A';

// A safer way to add if the key doesn't exist
details.putIfAbsent('AnotherKey', () => 'SomeValue');
```

```dart
// Check if map contains a key (fast O(1))
details.containsKey('Usrname'); // Returns true
details.containsKey('Email'); // Returns false
```

```dart
var transformedMap = details.map((key, value) => MapEntry(key, '$key:$value'));
// transformedMap might look like {'Usrname': 'Usrname:bruce', 'Password': 'Password:mypass', 'Uid': 'Uid:3802983209A'}
```

```dart
details.update('bruce', (value) => "joker"); // Changes 'bruce' to 'joker'
```

- **The `update` example is wrong:** `update` takes a key, and `'bruce'` is a value in this map. The API reference says: "If the key is not present, `ifAbsent` must be provided." (https://api.dart.dev/dart-core/Map/update.html). The intended call is:

```dart
details.update('Usrname', (value) => "joker"); // Changes 'bruce' to 'joker'
```

- **Skip the source's `details.cast<int, int>()`:** Effective Dart says AVOID using `cast()` ([USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#collections)).

## Copying lists and maps

[ApparenceKit](https://apparencekit.dev/flutter-tips/6-ways-copy-list-map-dart/) lists the ways to copy without changing the original; choose "considering if you need a deep clone, the performance implications, and if you are working with mutable or immutable collections".

| Way | Code (source) | Depth (source) | Repo rule |
|---|---|---|---|
| Spread | `[...oldList]`, `{...oldMap}`; for a map, `var copy = {...details}; // Simple way to create a shallow copy` | Shallow (the cheatsheet); the copy article calls it "clone without reference" | Preferred (`prefer_spread_collections`, collection literals) |
| `from` | `List.from(oldList)`, `Map.from(oldMap)` | Shallow: "for complex objects within the list/map, it might still copy references" | DON'T use `List.from()` unless you intend to change the type: it gives `List<dynamic>`; `iterable.toList()` keeps the type |
| `..addAll` | `[]..addAll(oldList)`, `{}..addAll(oldMap)` | Shallow | Don't copy this form: the recommended set has `prefer_spread_collections` |
| JSON round trip | `json.decode(json.encode(oldList))` | Deep: "creates a clone without reference" | See below |

The source writes raw types (`List newList = [...oldList];`), which Effective Dart says to AVOID and `strict-raw-types` rejects ([USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#types), [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md#strict-modes)). Give the copy its element type, or let it be inferred from the spread.

**Deep copy through JSON** ([ApparenceKit](https://apparencekit.dev/flutter-tips/6-ways-copy-list-map-dart/)):

```dart
import 'dart:convert';

List newList = json.decode(json.encode(oldList));
Map newMap = json.decode(json.encode(oldMap));
```

- **It only works for values JSON can encode:** "numbers, strings, booleans, null, lists and maps with string keys", and any other object goes through `toEncodable`, which "defaults to calling `.toJson()` on the object" (https://api.dart.dev/dart-convert/JsonEncoder/JsonEncoder.withIndent.html). `json.decode` returns `dynamic`, so with `strict-casts` on, the assignments above need an explicit cast ([ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md#strict-modes)).

## Immutable collection packages

Both from [ApparenceKit](https://apparencekit.dev/flutter-tips/6-ways-copy-list-map-dart/); neither article states a version, so check pub.dev before adding one.

- **`built_collection`** (https://pub.dev/packages/built_collection), from Google: immutable collections. "It doesn't make an immediate deep copy but provides a copy-on-write wrapper and methods for rebuilding." The [map cheatsheet](https://apparencekit.dev/flutter-tips/dart-map-cheatsheet-guide/) recommends it for maps "you can't accidentally modify".

```dart
// Requires built_collection package
// var builtList = [1, 2, 3].build();
// builtList = builtList.rebuild((b) => b..addAll([7, 6, 5]));
```

- **`fast_immutable_collections`:** `IList` and `IMap`, "which are inherently 'copied' when modified, as operations return new instances".

```dart
// Requires fast_immutable_collections package
// final IList<String> oldList; // example immutable list
// var newList = IList.orNull(oldList); // creates a new immutable list pointing to the same data initially
```

Immutable model classes (freezed, built_value) are in [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md); value equality for your own classes is in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#equality).

## Pretty-printing JSON

[ApparenceKit](https://apparencekit.dev/flutter-tips/format-json-with-dart/): use the `JsonEncoder.withIndent` constructor from `dart:convert`.

```dart
import 'dart:convert';

// Your unformatted JSON data (replace with your actual data)
var data = {
  'name': 'John Doe',
  'age': 30,
  'isStudent': false,
  'courses': ['Math', 'Science']
};

// Create an encoder with an indent (using two spaces here)
var encoder = const JsonEncoder.withIndent('  ');

// Convert your data to a pretty-printed JSON string
String prettyprint = encoder.convert(data);

// Now 'prettyprint' holds the nicely formatted JSON string
print(prettyprint);
```

- **The input can be a Map or a List;** the indent can be tabs (`\t`) or any other string. The source's step list writes `withIndent(' ')` (one space) while saying "two spaces"; the code block above is the correct one.
- **Official signature:** `const JsonEncoder.withIndent(String? indent, [Object? toEncodable(dynamic)?])`. "The `indent` string is prepended to these elements, once for each level of indentation. If `indent` is `null`, the output is encoded as a single line." (https://api.dart.dev/dart-convert/JsonEncoder/JsonEncoder.withIndent.html)
- **In a Flutter app,** `print` is flagged by `avoid_print` ([ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md#lint-sets)).

## Calling a function dynamically

`Function.apply(function, positionalArguments, [namedArguments])` "Dynamically call[s] `function` with the specified arguments", with named arguments keyed by `Symbol`, and gives "the same errors if `function` expects different parameters". A null positional list or a missing named map counts as empty: `Function.apply(helloWorld, null);` (https://api.dart.dev/dart-core/Function/apply.html).

[ApparenceKit](https://apparencekit.dev/flutter-tips/dynamic-function-invocation-dart/) uses it when the arguments are known only at run time, for example a chatbot that maps a user command to an app function:

```dart
int operatorXpBonus(Task task, {DateTime? date}) {
  return 1;
}
```

```dart
void test(Task task, DateTime date) {
  final result = Function.apply(operatorXpBonus, [task], {#date: date}) as int;
}
```

- **Prefer a static call** when you can: the source says static calls are better for performance and type safety, and the result is `dynamic` (hence the `as int`).
- **On the web, avoid it:** for JS output, "For production avoid `Function.apply()`" ([CLI-APPS.md](CLI-APPS.md), `dart compile js`).

## Paths with package:path

[package:path API](https://pub.dev/documentation/path/latest/path/).

Windows separates paths with `\`, macOS and Linux with `/`, so string operations on paths silently break on one of them. Import `package:path/path.dart` as `p`: inspect with `p.split(path)`, join with `p.join(...)`.

| Task | Prefer | Avoid | Why |
|---|---|---|---|
| Join | `p.join(dir, file)` | `'$dir/$file'`, `'a/$b'` | `/` on Windows; `//` with a trailing separator |
| Segment match | `p.split(path).contains('foo')` | `path.contains('foo/')` | Fails on `foo\bar`; false positive on `barfoo/` |
| Prefix | `if (p.split(path) case ['foo', ...])` or `case ['foo', ...final rest]`, or `p.isWithin('foo', path)` | `path.startsWith('foo/')`, `p.split(path).first == 'foo'` | `.first` throws `StateError` on empty lists and needs `.skip(1)`. For `./foo/bar` use `p.isWithin` or `p.split(p.normalize(path))` |
| Extension | `p.extension(path) == '.wasm'` | `path.endsWith('.wasm')` | Matches directories like `foo.wasm/` |
| Slicing | `p.withoutExtension(path)`, `p.extension(path, 2)` | `lastIndexOf('.')` plus `substring` | Breaks on `.gitignore`, `.js.map`, `.tar.gz` |
| POSIX or URL form | `p.posix.joinAll(p.split(path))`, `p.url.joinAll(p.split(path))` | `path.replaceAll(r'\', '/')` | Fails on root drives, mixes contexts |
| URI | `p.toUri(path)`, `p.fromUri(uri)` | `Uri.parse(path)`, `uri.path` | Fails on `C:`, leaks `%20` |
| Directory basename | `String canonicalDirName(Directory d) => p.basename(p.normalize(d.absolute.path));` | Repeating it inline | Centralizes the logic |

- **Joining static subpaths:** cross-platform libraries pass separate segments (`p.join(dir, 'sub', 'file.json')`). POSIX-only tools and static subpaths prefer a 2-argument join (`p.join(home, '.local/share/app/bin/config.json')`): splitting 5 or 6 static segments makes `dart format` wrap across 6 to 8 lines and destroys grep-ability.
- **`p.normalize` is lexical only** (`.` and `..`; no filesystem, no case). `p.canonicalize` returns absolute paths where possible and canonicalizes ASCII case on Windows; it does not resolve symlinks. [canonicalize](https://pub.dev/documentation/path/latest/path/canonicalize.html)
  - P2 correction: the source and old line here recommended `p.canonicalize` for physical identity across symlinks.
- **`<path>:<line>-<col>` strings aren't paths:** on Windows `Uri.parse` treats `C:` as a scheme and `:line` as a port. Strip with `RegExp(r'^(.*?):(\d+(?:-\d+)?)$')` first.
- **Prefix matching across roots:** call `p.relative(filePath, from: root)` first so root segments (`'/'` or `r'C:\'`) don't break the pattern, then split, match with list patterns, and join with `p.posix.joinAll` or `p.url.joinAll`.

```dart
import 'package:path/path.dart' as p;

String computeWebAssetKey(String filePath, String projectRoot) {
  final relative = p.relative(filePath, from: projectRoot);
  final segments = p.split(relative);
  return switch (segments) {
    ['assets', ...] => p.posix.joinAll(segments),
    _ => p.posix.joinAll(['assets', ...segments]),
  };
}
```

- **Git paths use `/` even on Windows** (trees, `.gitignore`, `.gitattributes`, git symlinks). A `\` in `.gitignore` or git commands is an escape character and silently breaks matching.

```dart
String toGitPath(String relativeNativePath) =>
    p.posix.joinAll(p.split(relativeNativePath));
```

- **Compound extensions:** `p.extension` takes an optional level; `p.extension('main.dart.wasm', 2)` returns `'.dart.wasm'`. Check that the 2-level result is a known compound (or `.endsWith('.map')`) before using it.

```dart
import 'package:path/path.dart' as p;

String insertContentHash(String filename, String hash) {
  final compoundExt = p.extension(filename, 2);
  // Only use the 2-level extension for true compound suffixes (e.g., '.js.map')
  final ext = compoundExt.endsWith('.map')
      ? compoundExt
      : p.extension(filename);
  final stem = filename.substring(0, filename.length - ext.length);
  return '$stem.$hash$ext';
}
```

- **With `package:file`, use the filesystem's own path context.** Top-level `p.*` binds to the host OS, so `MemoryFileSystem(style: FileSystemStyle.windows)` on Linux or macOS plus a global `p.split(file.path)` splits on `/` and breaks the test. Use `file.fileSystem.path`.

```dart
import 'package:file/file.dart';
import 'package:file/memory.dart';

/// Lists subdirectory names using the [FileSystem]'s own path context
/// rather than the host OS's global `p.*` functions.
List<String> listSubdirectoryNames(Directory dir) {
  final pathContext = dir.fileSystem.path;
  return dir
      .listSync()
      .whereType<Directory>()
      .map((d) => pathContext.basename(d.path))
      .toList();
}

void main() {
  // Simulates a Windows filesystem running inside a unit test on Linux/macOS.
  final fs = MemoryFileSystem(style: FileSystemStyle.windows);
  final projectDir = fs.directory(r'C:\workspace\app\lib')
    ..createSync(recursive: true);
  fs.directory(r'C:\workspace\app\lib\src').createSync();

  final subdirs = listSubdirectoryNames(projectDir);
  print('Subdirectories: $subdirs');
}
```

- **Out of scope for package:path:** HTTP URI routing, database query strings, non-path strings.

**Refactoring checklist:**

- Replace string interpolation (`'$dir/$file'`) with `p.join(dir, file)`.
- Replace `.contains('dir/')` and `.startsWith('dir/')` with `p.split(path)` list pattern checks (`case ['dir', ...final rest]`) or `p.isWithin(parent, child)`.
- Replace `.replaceAll(r'\', '/')` with `p.posix.joinAll(p.split(path))` (or `p.url.joinAll`).
- Replace `.endsWith('.ext')` on file paths with `p.extension(path) == '.ext'`.
- Replace manual dot-index slicing with `p.withoutExtension(path)` and `p.extension(path, [level])`.
- Verify that code using `package:file` accesses `fileSystem.path` instead of global `p.*`.
- Ensure Git paths, `.gitignore` entries, and symlink targets use `p.posix` forward slashes.

## Prove it

- **Calendar arithmetic:** a search for `.add(const Duration(days:` and `.add(Duration(days:` finds only exact-interval code; "next day" and calendar code builds `DateTime(y, m, d + 1)`, and a test covers a day that crosses a DST change in a zone that has one.
- **Maps:** no `Map.fromIterable` remains (`prefer_for_elements_to_map_fromIterable` reports nothing); every `update(key, ...)` passes a key that exists or an `ifAbsent`; `HashMap` appears only where iteration order does not matter.
- **Copies:** no `[]..addAll(` copy and no `List.from(` without an explicit type argument; deep copies through JSON only touch JSON-encodable values.
- **JSON output:** debug dumps use `JsonEncoder.withIndent`, and no `print` survives in Flutter code.
- **`Function.apply`:** appears only where the arguments are truly dynamic, never in code compiled to JS for production.
- **Path code:** no `'$dir/$file'`, `.replaceAll(r'\', '/')` or `.endsWith('.ext')` on paths remains, and tests with `MemoryFileSystem(style: FileSystemStyle.windows)` pass on Linux or macOS.
