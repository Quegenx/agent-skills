# Primary constructors and concise constructors

Dart 3.13 lets a class declare its fields and its main constructor in the class header (`class Point(var int x, var int y);`), and lets in-body constructors drop the class name (`new(...)`, `factory name()`). Dart 3.12 added private named parameters. These change only how a declaration is written, not runtime behavior. What decides most outcomes: the package's language version (the `environment.sdk` lower bound), whether a header parameter carries `var` or `final` (that is what makes it a field), and the scope rules for the initializers. Lints that push code toward these forms are in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md); version history is in [VERSIONS.md](VERSIONS.md).

**Contents:** [Versions](#versions) · [Primary constructors](#primary-constructors) · [Scopes and semantics](#scopes-and-semantics) · [Constraints](#constraints) · [Concise in-body constructors](#concise-in-body-constructors) · [Private named parameters](#private-named-parameters) · [Breaking change in 3.13](#breaking-change-in-313) · [Migration](#migration) · [Diagnostics](#diagnostics) · [Prove it](#prove-it)

## Versions

| Feature | Language version |
|---|---|
| Primary constructors | 3.13 and later: on by default (`sdk: '^3.13.0'`). 3.12: experimental, flag `primary-constructors`. 3.11 and earlier: not supported. |
| Concise `new` / `factory` in-body syntax | 3.13 and later |
| Private named parameters | 3.12 and later (`sdk: '^3.12.0'`) |

- **On 3.12 only, enable the experiment** with `dart run --enable-experiment=primary-constructors bin/main.dart` or in `analysis_options.yaml`:

```yaml
analyzer:
  enable-experiment:
    - primary-constructors
```

- **Conflict on the `new` shorthand version.** dart.dev puts concise constructor syntax in 3.13. The third-party RandalSchwartz changelog skill says 3.13.0 in most files and "Dart 3.16+" in two others (`dart-2-milestones.md`, `rescuing-legacy-dart-apps.md`). Confirm on https://dart.dev/language/constructors.

## Primary constructors

- **Three parameter kinds.** *Declaring* (`var` or `final`): induces an instance variable. *Initializing* (`this.` or `super.`). *Regular* (no modifier): no field, available only during initialization. `class User(String name);` declares no field.

```dart
// Current syntax.
class Point {
  int x;
  int y;

  Point(this.x, this.y);
}
// Using a primary constructor.
class Point(var int x, var int y);
```

```dart
// Declares fields x and y, and a generative constructor Point(this.x, this.y)
class Point(var int x, var int y);

// Declares final fields
class PointFinal(final int x, final int y);
```

- **The in-body part** is `this : <initializer list>;` or `this : <initializer list> { <body> }`. Metadata is allowed: `@metadata this;`. At most one such part.

```dart
class C(final int x, int y) extends Base {
  this : super(y);
}
```

```dart
class Point(var int x, var int y) {
  // Initializer list in class body
  this : assert(x >= 0), y = y * 2;
}
```

`class Point(var int x, var int y) { this : assert(x >= 0 && y >= 0) { print('Point initialized at ($x, $y)'); } }`

- **Private fields** via a private named parameter: `class User({required var String _name});`, called as `User(name: 'John Doe')`.
- **Empty bodies become `;`** for a class, mixin class, mixin, extension and extension type:

```dart
class C(int x);
mixin class MC;
extension type ET(int x);
mixin M;
extension Ext on C;
```

- **Const:** put `const` before the type name. A const primary constructor allows no body block (even an empty one is an error); all fields must be final, non-late and definitely initialized, with potentially constant initializers: `class const ConstPoint(final int x, final int y) { final int z; this : z = x + y; }`.

```dart
class const Point(final int x, final int y);
extension type const Ext(int x);
enum const MyEnum(final int x) {
  entry(1);
}
```

- **Enums:** `enum Color(final String hex) { red('#FF0000'), green('#00FF00'), blue('#0000FF'), }`. dart.dev says enums are implicitly constant, so `enum const Color` is redundant; the dart-lang skill's example above still writes `enum const MyEnum`. Confirm in the current docs. Dart 3.13 also added the lint `unnecessary_const_in_enum_constructor`.
- **Named and private:** `class Point.custom(var int x, var int y);`, `class Point._(var int x, var int y);`.
- **Super parameters:** `class Person(final String name, final int age);` then `class Employee(super.name, super.age, final String role) extends Person;`.
- **Extension types must use a primary constructor** with exactly one parameter, which is always declaring and becomes the representation field. `var` on it is an error (`representation_field_modifier`); `final` is optional and inferred. See [LANGUAGE.md](LANGUAGE.md#extension-types).
- **Mixin classes** may have only a primary constructor with no parameters, body or initializer list.
- **Third-party examples** from the RandalSchwartz changelog skill (Flutter widget, DTO, Cubit, exception):

```dart
class const UserProfile({
  required final String id,
  required final String email,
  required final int age,
});
final class CounterCubit() extends Cubit<int> {
  this : super(0);
  void increment() => emit(state + 1);
}
class NetworkException(final String message, final int statusCode) implements Exception;
```

## Scopes and semantics

- **Primary initializer scope:** non-late field initializers and the `this :` initializer list. Names there refer to the *parameters*.

```dart
class DeltaPoint(final int x, int delta) {
  // Accesses 'x' and 'delta' parameters directly!
  final int y = x + delta;
}
```

- **Primary parameter scope:** the `this { ... }` body. Declaring parameter names there refer to the induced *field*.
- **`late` initializers are outside the initializer scope.** Referencing a parameter there is a compile-time error. Shadowing: a non-late `int y = x` reads parameter `x`; `late int y = x` reads field `x`.
- **One generative constructor.** A class, mixin class or enum with a primary constructor cannot declare other non-redirecting generative in-body constructors (extension types excepted); the others must redirect to it.

## Constraints

- **Declaring parameters** cannot be `late` or `external`. `covariant` is allowed only on `var` declaring parameters.
- **Name collisions** between declaring parameters and body members are errors.
- **Parameters are read-only in the initializer scope:** `x = 5` or `x++` there, or in `this :`, is a compile-time error.
- **No double initialization:** initializing a field both at its declaration and in `this :` (or by an initializing formal) is a compile-time error.
- **The `this` block** cannot be `async`, `async*`, `sync*` or `=>`, and cannot exist without a primary constructor.
- **A method named `factory`** with no return type (`factory() {}`) parses as a concise factory constructor. Give it a return type: `void factory() {}`.

## Concise in-body constructors

Inside the body, write `new`, `new name`, `factory` or `factory name`, with no dot between keyword and name.

```dart
class Point {
  double x, y;

  // Concise unnamed generative constructor.
  new(this.x, this.y);

  // Concise named generative constructor.
  new origin() : x = 0, y = 0;

  // Equivalent to `factory Point.clone(Point other)`.
  factory clone(Point other) => Point(other.x, other.y);
}
```

| Traditional (class `LongClassName`) | Concise |
|---|---|
| `LongClassName() {}` | `new() {}` |
| `LongClassName.name() {}` | `new name() {}` |
| `const LongClassName();` | `const new();` |
| `const LongClassName.name();` | `const new name();` |
| `LongClassName(): this.other();` | `new(): this.other();` |
| `LongClassName.name(): this();` | `new name(): this();` |
| `factory LongClassName() { ... }` | `factory() { ... }` |
| `factory LongClassName.name() { ... }` | `factory name() { ... }` |
| `factory LongClassName() = D;` | `factory() = D;` |
| `const factory LongClassName.name() = D;` | `const factory name() = D;` |

- **Constructors that cannot access `this`:** factory constructors, the right-hand side of an initializer list, and arguments to a superclass constructor.

## Private named parameters

- **A named initializing formal may be private;** callers use the public name: `class Point { final double _x; Point({required this._x}); }` is called as `Point(x: 1.0)`. Optional and default values work: `PointPrivate({this._x, this._y = 0.0});`.

```dart
class Point {
  final int _x, _y;
  Point({required this._x, required this._y});
}
final p = Point(x: 10, y: 20);
```

- **Rules:** neither the private nor the generated public name may clash with another parameter; only initializing formals (`this._field`) qualify; the name must map to a valid public identifier (`this._` and `this._2x` are invalid). In the initializer list use the private name (`: assert(_x >= 0)`); subclasses use the public name for super parameters (`Hammer({required super.price});`).
- **Since 3.12, `prefer_initializing_formals` suggests private named parameters** (third-party RandalSchwartz changelog skill).

## Breaking change in 3.13

- **`final` and `var` on parameters are reserved for declaring parameters.** On language version 3.13, a modifier anywhere else (top-level functions, methods, closures, in-body constructors) is the compile-time error `extraneous_modifier`, for example `void printValue(final int x) => print(x);`.
- **Fix:** remove the modifier or run `dart fix`. To keep parameters immutable, enable the lint `parameter_assignments`.
- **Before upgrading from 3.12 or lower,** enable the lints `avoid_final_parameters` and `var_with_no_type_annotation`. Since 3.12, `dart fix` handles `avoid_final_parameters` (third-party RandalSchwartz changelog skill).

## Migration

```dart
// Before
class User {
  final String name;
  final int age;
  User(this.name, this.age);
}
```

```dart
// After
class User(final String name, final int age);
```

```dart
// Before
class Point {
  final int x;
  final int y;
  Point(this.x, this.y) : assert(x >= 0);
}

// After
class Point(final int x, final int y) {
  this : assert(x >= 0);
}
```

```dart
// Before
class Rect {
  final double width;
  final double height;
  final double area;
  Rect(this.width, this.height) : area = width * height;
}

// After
class Rect(final double width, final double height) {
  // 'width' and 'height' are in scope here
  final double area = width * height;
}
```

```dart
// Before
class Point {
  final int x;
  final int y;
  Point(this.x, this.y);
  Point.zero() : x = 0, y = 0;
}

// After
class Point(final int x, final int y) {
  new zero() : this(0, 0); // Redirects to primary
}
```

```dart
// Before
class DatabaseService {
  final String url;
  DatabaseService(this.url);
  DatabaseService.local() : url = 'localhost';
  factory DatabaseService.create() => DatabaseService('default');
}

// After
class DatabaseService {
  final String url;
  new(this.url); // Omit class name, use 'new'
  new local() : url = 'localhost'; // Use 'new local' for named constructors
  factory create() => DatabaseService('default'); // Omit class name from factory
}
```

- **Bulk conversion:** `dart fix --dry-run`, then `dart fix --apply`. IDE refactorings: Convert to primary constructor, Convert to in-body constructor, Convert to declaring parameter, Move initialization to the field declaration.
- **Lints to add to `analysis_options.yaml`** for 3.13 code, per the third-party RandalSchwartz changelog skill: `use_primary_constructors`, `use_declaring_parameters`, `unnecessary_type_name_in_constructor`, `unnecessary_primary_constructor_body`, `simplify_variable_pattern`, `use_named_constants`.
- **Monorepos:** language version is evaluated per package, so `dart analyze` rejects 3.13 syntax in a package whose constraint is `^3.5.0`. One layout keeps the root and tooling packages on `sdk: ^3.13.0` while published packages stay on `sdk: ^3.5.0` (third-party RandalSchwartz changelog skill).

## Diagnostics

Run `dart fix` for quick-fixes.

| Error | Cause | Fix |
|---|---|---|
| Invalid Late Access | A parameter used in a `late` initializer | Make the field non-late, or route through another non-late field |
| `fieldInitializedInInitializerAndDeclaration` | Field initialized at its declaration and in `this :` | Remove one |
| `nonRedirectingGenerativeConstructorWithPrimary` | An in-body generative constructor that does not redirect | Make it redirect (`this(...)`) or remove it |
| `extraneous_modifier` | `final` or `var` on a non-declaring parameter (3.13) | Remove the modifier or run `dart fix` |
| `representation_field_modifier` | `var` on an extension type's representation parameter | Drop `var` |

## Prove it

- **Language version:** `environment.sdk` lower bound is `^3.13.0` for primary or concise constructors and `^3.12.0` for private named parameters; on 3.12 the analyzer lists `primary-constructors` under `enable-experiment`.
- **Clean analysis:** `dart analyze` reports no `extraneous_modifier`, `fieldInitializedInInitializerAndDeclaration` or `nonRedirectingGenerativeConstructorWithPrimary`.
- **Bulk migration is reviewable:** `dart fix --dry-run` lists the changes before `dart fix --apply`.
- **Behavior unchanged:** existing tests pass before and after the conversion, since the feature changes declarations only.
