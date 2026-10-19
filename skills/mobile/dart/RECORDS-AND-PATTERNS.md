# Records and patterns

Records and patterns (both need language version 3.0 or later) let Dart return several values, validate and destructure data in one step, and switch exhaustively over a family of types. Most outcomes come down to two rules: a record's type is its shape (field count, types and names), and case patterns are refutable. Use patterns where they replace length checks, `is`/`as` chains and per-field reads; keep plain `is` and property access where a pattern only adds aliases. Class modifiers and `sealed` are in [LANGUAGE.md](LANGUAGE.md); naming and usage rules are in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md).

**Contents:** [Records](#records) · [Where patterns appear](#where-patterns-appear) · [Switch statement or expression](#switch-statement-or-expression) · [Pattern types](#pattern-types) · [Picking a pattern](#picking-a-pattern) · [Anti-patterns](#anti-patterns) · [Examples](#examples) · [Prove it](#prove-it)

## Records

- **What a record is.** An anonymous, immutable, fixed-size aggregate of typed, heterogeneous fields. Records are real values: store them, nest them, pass them, put them in collections.
- **Syntax.** `var record = ('first', a: 2, b: true, 'last');`. Named fields go in braces after the positional ones in a type annotation: `({int a, bool b}) record; record = (a: 123, b: true);`.

```dart
(int, int) swap((int, int) record) {
  var (a, b) = record;
  return (b, a);
}
```

- **Named field names are part of the type.** `({int a, int b})` and `({int x, int y})` are different types. Positional field names in an annotation are documentation only: `(int a, int b) recordAB = (1, 2); (int x, int y) recordXY = (3, 4); recordAB = recordXY; // OK.`
- **Fields are read through getters, never set.** Named fields expose same-named getters; positional fields expose `$<position>`, counting only positional fields: in the record above, `record.$1` is `'first'`, `record.a` is `2`, `record.b` is `true`, `record.$2` is `'last'`.
- **Records are structurally typed.** The shape alone determines the type, so two unrelated libraries that build same-shaped records share the type. `(num, Object) pair = (42, 'a'); var first = pair.$1; // Static type num, runtime int.`
- **Equality is automatic.** Records define `hashCode` and `==`: two records are equal when they have the same shape and equal field values. Named field order is not part of the shape. `(int x, int y, int z) point = (1, 2, 3); (int r, int g, int b) color = (1, 2, 3); point == color` is `true`; with named fields `x/y/z` against `r/g/b` it is `false` (the lint reports "Equals on unrelated types").
- **Return several values with a record** instead of a class (more verbose) or a List or Map (loses type safety):

```dart
(String name, int age) userInfo(Map<String, dynamic> json) {
  return (json['name'] as String, json['age'] as int);
}
var (name, age) = userInfo(json);
// named:
({String name, int age}) userInfo(Map<String, dynamic> json)
final (:name, :age) = userInfo(json);
```

- **Records parallelize futures of different types** with `.wait`; see [ASYNC.md](ASYNC.md#waiting-on-several-futures).
- **Name a shape with a typedef.** A list of records (for example button definitions with `label`, `icon`, `onPressed`) needs no class: `typedef ButtonItem = ({String label, Icon icon, void Function()? onPressed});`. The typedef is an alias only. You can later turn it into a class or an extension type (`extension type ButtonItem._(({String label, Icon icon, void Function()? onPressed}) _) {...}`) without changing users. A type alias gives no protection that the value is that record, an extension type gives little, and "Only a class can provide full abstraction and encapsulation."
- **Records replace `package:tuple`** when modernizing old code (third-party RandalSchwartz changelog skill).

## Where patterns appear

- **Places:** local variable declarations and assignments, `for` and `for-in` loops, `if-case` and `switch` cases, and control flow in collection literals. A pattern can match a value, destructure it, or both; matching checks shape, constant, equality or type.
- **Declarations start with `var` or `final`:** `var (a, [b, c]) = ('str', [1, 2]);`. An assignment pattern assigns existing variables: `(b, a) = (a, b); // Swap.`
- **Case patterns are refutable.** Values they destructure are locals scoped to that case body.

```dart
switch (obj) {
  case 1:
    print('one');
  case >= first && <= last:
    print('in range');
  case (var a, var b):
    print('a = $a, b = $b');
  default:
}
```

- **Share a body with logical-or:** `Color.red || Color.yellow || Color.blue => true, _ => false,`. Share a guard: `case Square(size: var s) || Circle(size: var s) when s > 0:`. A `when` guard that is false moves on to the next case; it does not exit the switch.
- **Destructure in a for-in:** `for (var MapEntry(key: key, value: count) in hist.entries)`, or the shorthand `for (var MapEntry(:key, value: count) in hist.entries)`.
- **Destructure a class instance:** `var Foo(:one, :two) = myFoo;`.
- **Algebraic data types:** use a `sealed` family with an exhaustive switch when you have related types, an operation that needs per-type behavior, and want that behavior in one place (see [Examples](#examples)).
- **The smell that calls for one** ([ApparenceKit](https://apparencekit.dev/flutter-tips/replace-type-code-union-type-flutter-dart/)): a class with an `enum` type field (`Document` with `DocumentType { pdf, doc, markdown }`) and `switch` or `if` chains on `document.type` spread through the code. Replace it with a sealed `DocumentSealed` whose subclasses `PdfDocument`, `DocDocument` and `MarkdownDocument` each implement `write`; exhaustive switch expressions then point to every place a new type needs handling. It also fits "if certain operations are only possible for some document types (like you can't 'write' to a PDF in your system)", and each type's behavior can be tested in isolation. The article has no code.
- **Validate incoming JSON with one if-case.** `if (data case {'user': [String name, int age]}) { print('User $name is $age years old.'); }` checks that `data` is a non-null map with key `user` whose value is a list of exactly a `String` and an `int`, and binds `name` and `age`. It replaces a verbose `is` / `containsKey` / `length` / `as` chain.

## Switch statement or expression

- **To produce a value, use a switch expression:** `switch (value) { pattern => expression, }`. One expression per case, no fallthrough, and it must be exhaustive.
- **For side effects, use a switch statement:** `switch (value) { case pattern: statements; }`. Empty cases fall through; non-empty cases break implicitly (no `break`). [ApparenceKit](https://apparencekit.dev/flutter-tips/run-animation-property-change/)'s old/new record switch `switch ((wasUploading, isUploading)) { case (false, true): ... break; ... }` ends each case with `break;`. "Dart does not support fallthrough execution for non-empty cases, so `break`s at the end of non-empty switch case statements are unnecessary" (lint `unnecessary_breaks`, reported only at language version 3.0 or later; https://dart.dev/tools/linter-rules/unnecessary_breaks), so drop the `break;` after `_controller.forward(from: 0);` and `_controller.reverse(from: 1);` when copying; the `default:` case holds only a comment and `break;`, which the lint page still allows (`case 1: break;`).
- **Unmatched values:** end with `_` or `default`, unless the switch is over a `sealed` type and covers every subtype.

## Pattern types

Precedence, lowest first: logical-or, logical-and, relational, postfix unary (cast, null-check and null-assert at one level), primary patterns. Collection and Object patterns are evaluated first, as outer patterns.

| Pattern | Form | Rules |
|---|---|---|
| Logical-or | `p1 \|\| p2` | Left to right, short-circuits. Both branches must bind exactly the same variables. |
| Logical-and | `p1 && p2` | Variables must not overlap: `case (var a, var b) && (var b, var c):` is an error. |
| Relational | `== expr`, `!=`, `<`, `>`, `<=`, `>=` | Compares against a constant: `< space => 'control'`, `> space && < zero => 'punctuation'`, `>= zero && <= nine => 'digit'`. |
| Cast | `foo as String` | Throws on a type mismatch: `var (i as int, s as String) = record;`. |
| Null-check | `subpattern?` | Matches non-null and binds the non-nullable type; null fails the match without throwing: `case var s?:`. To match null, use the constant pattern `null`. |
| Null-assert | `subpattern!` | Throws on null: `case ['user', var name!]:`, `var (x!, y!) = position;`. |
| Constant | literals, named constants, const constructors, const collections | Number, boolean and string literals, `math.pi`, `double.infinity`, `const Point(0, 0)`, `const []`, `const {1, 2}`. Wrap complex expressions: `const (1 + 2)`. `case [a, b]:` is a list pattern; `case const [a, b]:` is a list literal. |
| Variable | `var bar`, `String str`, `final int _` | A typed variable pattern only matches values of that type: `case (int a, String b):` does not match `(1, 2)`. |
| Identifier | `foo`, `_` | Declares in a declaration, assigns in an assignment, and is a named constant in a matching context (except `_`). With `const c = 1; switch (2) { case c: ... default: print('no match'); }` it prints "no match". |
| Parenthesized | `(subpattern)` | Controls precedence: `x \|\| y && z` equals `x \|\| (y && z)`. |
| List | `[p1, p2]` | Must match the whole list unless there is a rest element; at most one `...`. `var [a, b, ..., c, d] = [1, 2, 3, 4, 5, 6, 7]; // 1 2 6 7`; `...rest` collects `[3, 4, 5]`. |
| Map | `{"key": p1, someConst: p2}` | Need not match the whole map; keys the pattern does not name are ignored. Matching a key that does not exist in the map throws `StateError`: `final {'foo': int? foo} = {};`. |
| Record | `(p1, p2)`, `(x: p1, y: p2)` | Must match the whole record shape. Getter names can be inferred: `var (:untyped, :int typed) = record;`, `case (:var checked?, :var asserted!):`, `var (:untyped as int, :typed as String) = record;`. |
| Object | `SomeClass(x: p1, y: p2)` | Refuted if the type differs; need not match every field: `case Rect(width: var w, height: var h):`, `var Point(:x, :y) = Point(1, 2);`. |
| Wildcard | `_` | Binds nothing: `var [_, two, _] = list;`; typed: `case (int _, String _):`. |

- **Map patterns check key existence.** `{'key': String? val}` checks `map.containsKey('key')`, so an omitted key fails the match even though `String?` is nullable. Read optional keys with `map['key'] as String?`. This is the dart-lang skill's wording; dart.dev's pattern-types page says matching a missing key throws `StateError` (the declaration example in the table). Confirm in the current docs.

## Picking a pattern

From the dart-lang team's pattern-matching skill:

- **Use patterns for:** if-else chains, polymorphic JSON or API responses, destructuring Lists, URI and path segments, `String.split()` tokens, records, maps, and sealed-class exhaustiveness. **Not for:** simple booleans, single-variable promotion (use `is`), or basic collection filtering.
- **Deserialized JSON:** Map, List and Object patterns validate and destructure in one step.
- **`uri.pathSegments`, `p.split(path)`, `String.split()`:** List patterns with rest (`['api', 'comments', ...]`, `['assets', ...final rest]`, `[..., final parent, _]`) instead of `.length`, `.first`, `.skip(1)` and `length - N`.
- **Polymorphic payloads:** switch expressions over discriminant keys, building a `sealed` hierarchy.
- **Multiple returns:** record patterns.
- **Object or `MapEntry` unpacking:** `final Spec(:field1, :field2!) = spec;`, `for (final MapEntry(:key, :value) in map.entries)`, when promoting nullables or unpacking 3 or more fields used across statements. Not for a single-call passthrough.
- **ADTs:** Object patterns plus `sealed`. **Ranges:** relational plus `&&`. **Shared logic:** `||`. **Ignore:** `_` or `...`.
- **Workflow:** identify the structure; choose expression or statement; write the patterns; bind with `var x`, `:var y`, `...final rest`; add `when` guards; handle unmatched values with `_` or `default` (unless sealed); run `dart analyze` for exhaustiveness and dead code; check Map and JSON behavior for omitted keys against explicit `null`.
- **Malformed structures must reach** `_ => throw FormatException(...)`, not be skipped.

## Anti-patterns

1. **Prefer `is` promotion over an `if-case` alias.**

```dart
// Promotes `key` directly in-place without extra variables
for (final MapEntry(:key, :value) in map.entries) {
  if (key is String && value != null) {
    process(key, value);
  }
}
```

```dart
// Anti-pattern: Introduces unnecessary alias variable `k`
for (final MapEntry(:key, :value) in map.entries) {
  if (key case final String k when value != null) {
    process(k, value);
  }
}
```

2. **Match `T?` instead of adding a separate `null` arm** when null is handled the same way.

```dart
// Clean nullable pattern match
switch (value) {
  final String? s => s,
  _ => throw FormatException('Invalid value: $value'),
}
```

```dart
// Redundant separate null arm
switch (value) {
  final String s => s,
  null => null,
  _ => throw FormatException('Invalid value: $value'),
}
```

3. **Fail fast; never let `if-case` silently drop data.**

```dart
// Fast-fail with explicit diagnostic error
for (final raw in rawTasks) {
  if (raw is! Map<String, dynamic>) {
    throw FormatException('Expected Map item, got ${raw.runtimeType}: $raw');
  }
  _applyTask(raw);
}
```

```dart
// Silently ignores malformed items
for (final raw in rawTasks) {
  if (raw case final Map<String, dynamic> taskMap) {
    _applyTask(taskMap);
  }
}
```

4. **No single-case switch with `default: break;`** (use `if (x is T)`), and no `switch (condition) { true => a, false => b }` (use a ternary).
5. **Destructure objects only when it pays:** 3 or more fields used across statements, `MapEntry(:key, :value)` loops, removing a single-use intermediate, or promoting nullable fields. Keep plain access for a single property (`user.name`, or `final CpuCallFrame(:url, :line) = node.callFrame;` rather than nesting `ProfileNode(callFrame: ...)`); 1 or 2 fields in a short getter or a passthrough to one call; when `specify_nonobvious_local_variable_types` would force new imports for one or two uses; when a long class name wraps a 2-field unpack over 3 or more lines; when the target is assigned to an outer variable (for example `db = res.$1;` before `finally`, where `final (db, ...)` would shadow the outer `db`) or mixes `final` and `var`; and for `.first`/`.last` on lists that may have length 1 (`[first, ..., last]` needs `length >= 2`).

```dart
// Unpacks multiple fields and asserts non-nullability in one declaration
final RunSpec(:target, :device!, :verbose) = spec;
```

```dart
// Repetitive multi-line property extraction
final target = spec.target;
final device = spec.device!;
final verbose = spec.verbose;
```

6. **Standalone scalar checks stay plain:** `if (code >= 200 && code < 300)`, not `if (code case >= 200 && < 300)`. Relational patterns are for multi-arm switch tables.

## Examples

Path segments:

```dart
String? resolveAllowedAssetSubpath(List<String> segments) {
  if (segments case ['assets', ...final rest]
      when rest.isNotEmpty && !rest.contains('..')) {
    return rest.join('/');
  }
  return null;
}
```

Sealed ADT:

```dart
sealed class Shape {}

class Square implements Shape {
  final double length;
  Square(this.length);
}

class Circle implements Shape {
  final double radius;
  Circle(this.radius);
}

// Switch expression guarantees exhaustiveness due to `sealed` modifier.
double calculateArea(Shape shape) => switch (shape) {
  Square(length: var l) => l * l,
  Circle(:var radius)   => math.pi * radius * radius,
};
```

Swap and destructure:

```dart
var (a, b) = ('left', 'right');
(b, a) = (a, b); // Swap values

// Destructuring a function return
var (name, age) = getUserInfo();
```

Guard plus logical-or:

```dart
switch (shape) {
  case Square(length: var s) || Circle(radius: var s) when s > 0:
    print('Valid positive shape with dimension $s');
  case Square() || Circle():
    print('Zero or negative dimension shape');
}
```

Polymorphic and nested JSON:

```dart
/// Represents an API response in a sealed hierarchy.
sealed class ApiResponse {}

/// Successful API response carrying data.
class SuccessResponse implements ApiResponse {
  final Map<String, dynamic> data;
  SuccessResponse(this.data);
}

/// Error API response carrying an error message and code.
class ErrorResponse implements ApiResponse {
  final String message;
  final int code;
  ErrorResponse(this.message, this.code);
}

/// Parses a raw JSON map into an [ApiResponse] subtype.
ApiResponse parseApiResponse(Map<String, dynamic> json) => switch (json) {
  {'status': 'ok', 'data': Map<String, dynamic> data} => SuccessResponse(data),
  {'status': 'error', 'message': String msg, 'code': int code} => ErrorResponse(
    msg,
    code,
  ),
  _ => throw FormatException('Invalid or unrecognized API response: $json'),
};

/// Validates a nested user payload with both required schema and optional keys.
void processUserPayload(Map<String, dynamic> json) {
  if (json case {
    'id': String id,
    'profile':
        {'name': String name, 'email': String email} &&
        final Map<String, dynamic> profile,
    'tags': [
      String primaryTag,
      ...,
    ], // Matches at least 1 element, ignores rest
  }) {
    // Read optional/omitted fields directly from the validated submap.
    // Map patterns check for key existence (containsKey), so an omitted key
    // fails matching even if typed as String?.
    final avatarUrl = profile['avatarUrl'] as String?;
    print(
      'User $name ($id, $email, avatar: $avatarUrl) - Primary tag: $primaryTag',
    );
  } else {
    throw FormatException('Malformed user payload structure: $json');
  }
}
```

## Prove it

- **The package allows patterns:** the `environment.sdk` lower bound in `pubspec.yaml` is 3.0 or higher (see [VERSIONS.md](VERSIONS.md#language-version-and-minimum-sdk)).
- **Exhaustiveness:** `dart analyze` reports nothing like "The type 'X' is not exhaustively matched by the switch cases" or an unreachable arm. Fix by adding Object patterns for missing subtypes or an explicit `_` arm.
- **JSON parsing:** a test feeds a payload with an omitted optional key and one with an explicit `null`, and a malformed payload that must throw `FormatException`, not be skipped.
- **No pattern where `is` would do:** no `if (x case final T y)` that only aliases a promoted variable, no single-case switch with `default: break;`, no `if (code case >= 200 && < 300)`.
