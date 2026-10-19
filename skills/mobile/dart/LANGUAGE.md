# Dart 3 language

Dart 3 types are non-nullable by default, class hierarchies can be opened or closed per library with class modifiers, `sealed` families give exhaustive switches, extension types wrap a value in a static-only interface at no run-time cost, and dot shorthands drop a type name the context already knows. What decides most outcomes is the package's language version: the lower bound of `environment.sdk` in `pubspec.yaml` picks which of these features compile, per package. This file covers class modifiers and sealed types, extension methods, extension types, dot shorthands and null safety. Records and patterns are in [RECORDS-AND-PATTERNS.md](RECORDS-AND-PATTERNS.md), primary and concise constructors in [CONSTRUCTORS.md](CONSTRUCTORS.md), futures, streams and isolates in [ASYNC.md](ASYNC.md), and which version shipped what in [VERSIONS.md](VERSIONS.md). Style and naming rules are in [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md) and [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md); lints in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md).

**Contents:** [Feature minimums](#feature-minimums) · [Class modifiers](#class-modifiers) · [Sealed types](#sealed-types) · [Modifiers in a published API](#modifiers-in-a-published-api) · [Extension methods](#extension-methods) · [Extension types](#extension-types) · [Dot shorthands](#dot-shorthands) · [Null safety](#null-safety) · [Prove it](#prove-it)

## Feature minimums

| Feature | Language version |
|---|---|
| Sound null safety (enforced) | 3.0 (opt-in from 2.12 to 2.19) |
| Records, patterns, switch expressions, if-case | 3.0 |
| Class modifiers (all except `abstract`) | 3.0 |
| Private final field promotion | 3.2 |
| Extension types | 3.3 |
| Digit separators (`1__000_000__000_000__000_000`) | 3.6 |
| Wildcard variables (`_` non-binding) | 3.7 |
| Null-aware elements | 3.8 |
| Flow analysis assumes null safety | 3.9 |
| Dot shorthands | 3.10 |
| Private named parameters | 3.12 |
| Primary constructors, concise constructors | 3.13 |

## Class modifiers

- **The set:** `abstract`, `base`, `final`, `interface`, `sealed`, `mixin`. Only `base` can appear before a `mixin` declaration. Modifiers do not apply to `enum`, `typedef`, `extension` or `extension type`.
- **No modifier:** construct, extend and implement from any library; a mixin or mixin class can be mixed in.
- **`abstract`:** cannot be constructed from any library; may have abstract methods. Define a factory constructor to make it look instantiable.
- **`base`:** no implementing outside its library. Guarantees the base constructor always runs for subtypes, all implemented private members exist in subtypes, and a new member does not break subtypes (unless a subtype has the same name with an incompatible signature). Every class that implements or extends a base class must be `base`, `final` or `sealed`, directly or indirectly.
- **`interface`:** outside libraries can implement but not extend. Self-calls on `this` reach known implementations, which reduces the fragile base class problem. `abstract interface class` is a pure interface (its most common use).
- **`final`:** closes the hierarchy outside the library (no `implements`, `extends`, `with` or `on`); it can still be extended or implemented inside its library. It encompasses `base`, so subclasses must be `base`, `final` or `sealed`. The maintainer can add methods and turn constructors into factories without breaking users.
- **`interface` and `base` restrictions are ignored inside the declaring library** but apply to every other library, even in your own package.
- **Order:** optional `abstract`, then optionally one of `base` / `interface` / `final` / `sealed`, then optional `mixin`, then `class`. Invalid: `base`, `interface` and `final` together; `sealed` with `abstract` (redundant); `sealed` with `base`, `interface` or `final` (redundant); `mixin` with `abstract` (redundant); `mixin` with `interface`, `final` or `sealed`; `enum` or `extension type` with any modifier (an extension type can only be implemented by other extension types).

| Declaration | Construct | Extend | Implement | Mix in | Exhaustive |
|---|---|---|---|---|---|
| `class` | Yes | Yes | Yes | No | No |
| `base class` | Yes | Yes | No | No | No |
| `interface class` | Yes | No | Yes | No | No |
| `final class` | Yes | No | No | No | No |
| `sealed class` | No | No | No | No | Yes |
| `abstract class` | No | Yes | Yes | No | No |
| `abstract base class` | No | Yes | No | No | No |
| `abstract interface class` | No | No | Yes | No | No |
| `abstract final class` | No | No | No | No | No |
| `mixin class` | Yes | Yes | Yes | Yes | No |
| `base mixin class` | Yes | Yes | No | Yes | No |
| `abstract mixin class` | No | Yes | Yes | Yes | No |
| `abstract base mixin class` | No | Yes | No | Yes | No |
| `mixin` | No | No | Yes | Yes | No |
| `base mixin` | No | No | No | Yes | No |

- **Why `base` matters:** without it, `class B implements A {}` in another library lacks `_privateMethod()`, and `callPrivateMethod(B())` throws at run time.

## Sealed types

- **`sealed` gives a known, enumerable set of subtypes** so switches are checked for exhaustiveness at compile time. A sealed class cannot be extended or implemented outside its library and is implicitly abstract (no construction; it may have factory constructors and constructors for subclasses). Its subclasses are not implicitly abstract.
- **A missing subtype is a compile error:** "The switch does not exhaustively account for all possible objects of type `Vehicle`".
- **All direct subtypes must be in the same library;** there is no transitive restriction (`class OtherLucky extends Lucky {}` in another file is fine; `class Bad extends Amigo {}` is an error).

```dart
sealed class Amigo {}

class Lucky extends Amigo {}

class Dusty extends Amigo {}

class Ned extends Amigo {}

String lastName(Amigo amigo) => switch (amigo) {
  Lucky _ => 'Day',
  Dusty _ => 'Bottoms',
  Ned _ => 'Nederlander',
};
```

- **`sealed` or `final`:** if users must construct instances, it cannot be sealed. If the library has no subtypes, sealed gives nothing. Otherwise sealed is likely what you want. Adding a subtype to a sealed type is a breaking change (like adding an enum value); to add subtypes later without breaking users, use `final` (users then need a default case).
- **When modernizing code,** replace `is` ladders with sealed classes and switch expressions (third-party RandalSchwartz changelog skill).

## Modifiers in a published API

- **Mixins need `mixin class` since 3.0.** Before 3.0 any class could be a mixin unless it declared non-factory constructors or extended a class other than `Object`. `mixin class Both {}` works in both `with` and `extends`. About 90% of existing classes already could not be mixins.
- **To avoid breaking users, put `mixin` before every class that could be used as a mixin.** Leaving it a plain class or turning it into a pure mixin is a breaking API change (bump the major version).
- **Adding `interface`, `base`, `final` or `sealed` is potentially breaking:** increment the major version.
- **Summary:** `interface` prevents code reuse while allowing re-implementation; `base` requires reuse; `final` prevents extension entirely; `sealed` opts into exhaustiveness. dart.dev adds that "since these features are new, we still don't know what the best practices will be."

## Extension methods

- **"Extension methods add functionality to existing libraries"** (https://dart.dev/language/extension-methods): methods on classes you don't own, such as `DateTime`, so a long condition becomes one named call ([ApparenceKit](https://apparencekit.dev/flutter-tips/refactor-with-dart-extensions/)). Before: `if (!activities.hasActivity(date) && date.day == today.day && date.month == today.month && date.year == today.year) {`. After: `if (!activities.hasActivity(date) && date.isToday()) {`.

```dart
extension DateExtension on DateTime {
    // Checks if this date is the current day
    bool isToday() => isSameDay(DateTime.now());

    // Checks if this date is the same day as another date
    bool isSameDay(DateTime other) {
        return day == other.day && month == other.month && year == other.year;
    }

    // Other useful methods you can add:
    // DateTime get firstDayOfWeek { /* ... */ }
    // DateTime get lastDayOfWeek { /* ... */ }
    // bool isSameWeek(DateTime other) { /* ... */ }
    // bool isAfterDayOrEqual(DateTime other) { /* ... */ }
}
```

  What changed: the article's export has a stray markdown heading `##### Other useful methods you can add:` inside the code, which does not compile; it is a `//` comment here. [ApparenceKit's date extension list](https://apparencekit.dev/flutter-tips/useful-date-extension/) also names `firstDayOfMonth`. Adding a day across a DST change is in [CORE-LIBRARIES.md](CORE-LIBRARIES.md#dates-across-daylight-saving).
- **Static members are called through the extension's name.** "Extensions can also have static fields and static helper methods"; invoke them "through the declaration name", and an unnamed extension's static members only within the extension declaration (https://dart.dev/language/extension-methods). So the hex-color helper below is `HexColor.fromHex('#FF0000')`, not `Color.fromHex(...)`. [ApparenceKit](https://apparencekit.dev/flutter-tips/hexa-string-color-extension/) accepts `"RRGGBB"` or `"#RRGGBB"`, prepends `ff` (fully opaque) for 6- or 7-character input, strips `#` and parses with `radix: 16`:

```dart
extension HexColor on Color {
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) {
      buffer.write('ff');
    }
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
}
```

  What changed: the article's `if` has no braces and spans two lines, which `curly_braces_in_flow_control_structures` (in `core.yaml`) flags; braces added ([STYLE-AND-DOCS.md](STYLE-AND-DOCS.md)).
- **An extension method is not an extension type:** an extension method adds members to every instance of the underlying type; an extension type's interface applies only where the static type is the extension type (below).

## Extension types

- **A compile-time wrapper.** An extension type wraps an existing *representation type* with a different, static-only interface; it is compiled away ("essentially zero cost") and is a major part of static JS interop. An extension method adds members to every instance of the underlying type; an extension type's interface applies only to expressions whose static type is the extension type.

```dart
extension type IdNumber(int id) {
  // Wraps the 'int' type's '<' operator:
  operator <(IdNumber other) => id < other.id;
  // Doesn't declare the '+' operator, for example,
  // because addition does not make sense for ID numbers.
}

void main() {
  int myUnsafeId = 42424242;
  myUnsafeId = myUnsafeId + 10; // This works, but shouldn't be allowed for IDs.

  var safeId = IdNumber(42424242);
  safeId + 10; // Compile-time error: No '+' operator.
  myUnsafeId = safeId; // Compile-time error: Wrong type.
  myUnsafeId = safeId as int; // OK: Run-time cast to representation type.
  safeId < IdNumber(42424241); // OK: Uses wrapped '<' operator.
}
```

- **The declaration** `extension type E(int i) { ... }` introduces an implicit getter `int get i` and an implicit constructor `E(int i) : i = i`. Type parameters work: `extension type E<T>(List<T> elements)`. The header is a primary constructor with exactly one parameter (see [CONSTRUCTORS.md](CONSTRUCTORS.md)).
- **Constructors.** Extra non-redirecting generative constructors must initialize the representation: `E.n(this.i); E.m(int j, String foo) : i = j + foo.length;`. Name the representation constructor to free the unnamed one: `extension type const E._(int it) { E(): this._(42); E.otherName(this.it); }`. Hide it with `_`: `extension type E._(int i) { E.fromString(String foo) : i = int.parse(foo); }`. Forwarding generative and factory constructors are allowed.
- **Members:** methods, getters, setters and operators. No non-external instance variables, no abstract members. The representation type's members are not available unless the type implements it.
- **`implements` may name** the representation type (all its members become available: `extension type NumberI(int i) implements int {}`); a supertype of it (`extension type Sequence<T>(List<T> _) implements Iterable<T>`; `extension type Id(int _id) implements Object` makes the extension type non-nullable); or another extension type on the same representation.
- **A same-named member is a redeclaration, not an override.** Annotate it with `@redeclare` from `package:meta`; the lint `annotate_redeclares` warns when it is missing.

```dart
import 'package:meta/meta.dart';

extension type MyString(String _) implements String {
  // Replaces 'String.operator[]'.
  @redeclare
  int operator [](int index) => codeUnitAt(index);
}
```

- **Two uses.** Extended interface (transparent: implements its representation type, so `int v2 = NumberT(2);` is OK). Different interface (not transparent: `int num2 = NumberE(2); // Error`, `num1.isNegative() // Error`, `num1.value - 2 // OK`). The representation type is never a subtype of the extension type.
- **Extension types are an unsafe abstraction.** They leave no trace at run time: `is`, `as`, `switch` and `if case` test the representation object's runtime type. `int i = 2; if (i is NumberE) print("It is"); // Prints 'It is'.` A cast or pattern match to an extension type does not run a constructor, so call `NumberE(i)` explicitly when you need validation. `List<E>` is exactly `List<R>` at run time.
- **When to use which:** a typedef gives no protection, an extension type gives little, and only a class gives full abstraction and encapsulation (see [RECORDS-AND-PATTERNS.md](RECORDS-AND-PATTERNS.md#records)).

## Dot shorthands

- **`.foo` omits the type when the context type determines it:** an identifier `.myValue`, a constructor `.new()`, a constant creation `const .myValue()`. Operations can be chained.

```dart
enum Status { none, running, stopped, paused }

Status currentStatus = .running; // Instead of Status.running

int port = .parse('8080'); // Instead of int.parse('8080')

Point origin = .origin(); // Instead of Point.origin()
```

- **Enums are "a primary and highly recommended use case",** especially in assignments and switches: `return switch (level) { .debug => 'gray', .info => 'blue', .warning => 'orange', .error => 'red', };` and `colorCode(.warning)`. Default values and named arguments work too: `{LogLevel level = .info}`, `level: .error`.
- **Constructors:** named, factory and generic: `Point p1 = .fromList([1.0, 2.0]);`, `List<int> intList = .filled(5, 0);`. Unnamed `.new()` infers generic arguments: `late final AnimationController _animationController = .new(vsync: this); final ScrollController _scrollController = .new(); final GlobalKey<ScaffoldMessengerState> scaffoldKey = .new(); Map<String, Map<String, bool>> properties = .new();`.
- **Static members:** `BigInt bigIntZero = .zero;`. **Const contexts:** `const Status defaultStatus = .running;`, `const List<Point> keyPoints = [.origin(), .new(1.0, 1.0)];`.
- **Rules:**
  - A chain must produce the context type: `String lowerH = .fromCharCode(72).toLowerCase();`.
  - `==` and `!=` use the left side's static type, so the shorthand goes only on the right: `myColor == .green` is OK; `.red == myColor`, `myColor == (condition ? .green : .blue)` and `(myColor as Object) == .green` are errors.
  - A ternary in an assignment is OK: `Color inferredColor = condition ? .green : .blue;`.
  - An expression statement cannot begin with `.`: `.log('Hello');` is an error.
  - For `T?`, the shorthand finds static members of `T`, not of `Null`. For `FutureOr<T>`, static members of `T`, not of `Future`.

## Null safety

- **Required named arguments are independent of nullability:** `required` makes the caller supply the argument; its type can still be nullable. [Understanding null safety](https://dart.dev/null-safety/understanding-null-safety)
- **Sound and non-nullable by default.** Add `?` for nullable: `int? aNullableInt = null;`. Enforced since Dart 3 (May 2023); Dart 3 removed `--no-sound-null-safety` and rejects any package whose SDK lower bound is below `2.12.0`. Migration docs are archived at github.com/dart-community/migrate-to-null-safety.
- **Nullable types expose only members on both the base type and `Null`:** `toString()`, `==`, `hashCode`. Implicit downcasts are gone: pass `maybeString as String` explicitly. `List<int> filterEvens(...) { return ints.where(...); }` is a compile error.
- **Top and bottom types.** The top type is `Object?` (accept any value with it; `Object` excludes null). The bottom type is `Never`: a function like `Never wrongType(String type, Object value) { throw ArgumentError(...); }` extends reachability analysis. A `throw` expression has static type `Never`.
- **Compile errors to expect:**
  - A non-nullable return type must reliably return.
  - Top-level variables and static fields need initializers.
  - Instance fields must be initialized at the declaration, by an initializing formal, or in the initializer list (before the constructor body).
  - Locals must be definitely assigned before use.
  - Optional parameters must be nullable or have a default.
- **Flow analysis** handles reachability (`if (object is! List) return false; return object.isEmpty;` is OK), definite assignment (`final int result;` assigned on each path) and promotion on `== null` / `!= null`, `as`, assignments and `!`. Promotion works on locals and parameters, and on private final fields since 3.2; since 3.3, abstract getters promote under the same private final field rules. Since 3.9, with `sdk: ^3.9.0`, flow analysis assumes null safety for promotion, reachability and definite assignment, which can surface new `dead_code` warnings.
- **Unnecessary null checks warn:** null-aware operators or `== null` / `!= null` on a non-nullable type.
- **Null-aware chains short-circuit:** `thing?.doohickey.gizmo` (a second `?.` would mean `doohickey` itself is nullable). Null-aware cascade `receiver?..method();`, null-aware index `receiver?[index];`, nullable function call `function?.call(arg1, arg2);`.
- **Parenthesize a chain to call something on its result even when it is null** ([FlutterPro](https://flutterpro.design/details/never-show-null)): `(state.cartInfo?.totalPrice?.toString()).orPlaceholder()`, where `orPlaceholder` is an extension on `String?`. Without the parentheses, a null `cartInfo` short-circuits the whole expression and `orPlaceholder()` never runs; with them, it always runs.
- **Null-aware elements (3.8):** `?expr` in a collection literal adds the element only when it is non-null, replacing `if (x != null) x` ([ApparenceKit](https://apparencekit.dev/flutter-tips/null-aware-elements-dart-flutter-simplify-code/); the recommended lint `use_null_aware_elements` asks for it):

```dart
children: [
  if (title != null)
    title,
  // ... other widgets
]
```

```dart
children: [
  ?title, // So much cleaner!
  // ... other widgets
]
```
- **`!` casts to the non-nullable type,** checked at run time; it may throw.
- **`late`** means "enforce this variable's constraints at runtime instead of at compile time". Reading before assignment throws. `late` with an initializer is lazy and may access `this`. `late final` is assignable once; a second assignment throws. It covers Kotlin's `lateinit` and Swift's `lazy`, and works on locals.
- **`required` is independent of nullability:** `function({int? a, required int? b, int? c, required int? d}) {}`. It replaces `@required` from `package:meta`, which Dart 3.10 no longer supports.
- **Abstract fields:** `abstract class Cup { abstract Beverage contents; }`.
- **Nullable fields promote only when private and final** (barring the reasons listed at https://dart.dev/tools/non-promotion-reasons). Otherwise use `!` or copy to a local: `var temperature = _temperature; if (temperature != null) {...}`.
- **Generics.** An unbounded `T` is potentially nullable and has the restrictions of both. To cast away `T?`, use `object as T`, not `!` (`Box<int?>.full(null).unbox()` must not throw). A non-nullable bound `T extends num` forbids nullable arguments; the default bound is `Object?`.
- **Core library changes:** `catch` without `on` has type `Object` (not `dynamic`); `Map[]` returns `V?` (for a key known to exist, `map['key']!`); the unnamed `List()` constructor is gone (use literals, `List.filled()`, `List.generate()`, `List.empty()`); setting a longer `length` on a non-nullable list throws; `ListMixin.insert()` calls `add()` (custom lists should define `add()`); `Iterator.current` before or after iteration is undefined (most throw `StateError`).
- **Choosing a field's type when migrating** (third-party RandalSchwartz changelog skill):

  | Field | Becomes |
  |---|---|
  | Can be null | `String?` |
  | Always set in the constructor | `final` |
  | Set before first use | `late final` |
  | Has a default | `= 0` |

  Drop `assert(x != null)`; use `?.` and `??` chains.

## Prove it

- **The language version allows the feature:** the `environment.sdk` lower bound meets the [feature minimums](#feature-minimums); `dart analyze` shows no "This requires the '<feature>' language feature" message.
- **Exhaustive switches:** every switch over a `sealed` type compiles with no `_` arm, and adding a subtype makes `dart analyze` report the switch as not exhaustive.
- **Published API changes:** a release that adds `interface`, `base`, `final` or `sealed`, or adds a subtype to a sealed type, bumps the major version.
- **Extension types that need validation** are built through their constructor, never by `as` or a pattern match.
- **Redeclared members** carry `@redeclare`; `annotate_redeclares` reports nothing.
- **Extension statics** are called as `ExtensionName.member`, and conditions repeated across files have become named extension methods.
- **Dot shorthands** appear only on the right of `==` / `!=` and never start an expression statement.
- **Null safety:** no `!` on a generic `T?` where `as T` is meant; nullable non-private or non-final fields are copied to a local before null checks.
