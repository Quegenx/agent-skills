# Usage and design

Effective Dart's Usage guide (how to use language features in statements and expressions) and Design guide (consistent, usable library APIs: "If it's in a type signature or declaration, this goes over it."). Every rule carries its strength: DO always, DON'T almost never, PREFER and AVOID usually, CONSIDER depending on circumstances, precedent and preference (full table and glossary in [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md#rule-strength-and-terms)). Most rules name the lint that enforces them; turning lints on is in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md). The language features behind these rules (records, patterns, class modifiers, extension types, constructors) are in [LANGUAGE.md](LANGUAGE.md), futures and streams in [ASYNC.md](ASYNC.md), and language versions in [VERSIONS.md](VERSIONS.md).

**Contents:** [Libraries and imports](#libraries-and-imports) · [Null](#null) · [Strings](#strings) · [Collections](#collections) · [Functions](#functions) · [Variables](#variables) · [Members](#members) · [Constructors](#constructors) · [Error handling](#error-handling) · [Asynchrony](#asynchrony) · [Naming APIs](#naming-apis) · [Library privacy](#library-privacy) · [Classes and mixins](#classes-and-mixins) · [API members](#api-members) · [Types](#types) · [Parameters](#parameters) · [Equality](#equality) · [Prove it](#prove-it)

## Libraries and imports

"Import" here covers both `import` and `export`. Package layout is in [PACKAGES.md](PACKAGES.md).

- **DO use strings in `part of` directives** (lint `use_string_in_part_of_directives`): `part of '../../my_library.dart';`, not `part of my_library;`. Many developers avoid `part` entirely.
- **DON'T import libraries inside the `src` directory of another package** (lint `implementation_imports`). Code under `lib/src` is private implementation; a minor release may break you.
- **DON'T allow an import path to reach into or out of `lib`** (lint `avoid_relative_lib_imports`). Don't use `/lib/` in import paths and don't use `../` to escape `lib`. `import 'package:my_package/api.dart';` and `import '../lib/api.dart';` are treated as two unrelated libraries. From `test/`, use `package:` imports.
- **PREFER relative import paths when not crossing `lib`** (lint `prefer_relative_imports`): `lib/api.dart` imports `'src/stuff.dart'`; `lib/src/utils.dart` imports `'../api.dart'`; `test/api_test.dart` imports `'package:my_package/api.dart'` plus `'test_utils.dart'`.
- **Where sources differ, package imports everywhere:** [ApparenceKit](https://apparencekit.dev/blog/flutter-cursor-ai-setup/) tells its coding agents "always use package import even for our project files" and to "Comply to the always_use_package_imports rule", claiming "Dart and Flutter team pushes for package import". Effective Dart (above) says PREFER relative paths inside `lib`. The lint page for `always_use_package_imports` ("Avoid relative imports for files in `lib/`") lists `prefer_relative_imports` as incompatible (https://dart.dev/tools/linter-rules/always_use_package_imports), so a project picks one. Either is a project choice; the Dart team's written guidance is Effective Dart's. ApparenceKit puts its choice in the agent rules file because "Without this agent will create relative imports."

## Null

- **DON'T explicitly initialize variables to `null`** (lint `avoid_init_to_null`). Nullable variables are implicitly `null`: `Item? bestItem;`, not `Item? bestItem = null;`.
- **DON'T use an explicit default value of `null`** (lint `avoid_init_to_null`): `void error([String? message])`, not `[String? message = null]`.
- **DON'T use `true` or `false` in equality operations:** `if (nonNullableBool)` and `if (!nonNullableBool)`. For nullable booleans use `if (nullableBool ?? false)`, or `if (nullableBool != null && nullableBool)` to also promote. `nullableBool == true` hides that null is involved. A null-aware `??` in a condition doesn't promote the variable.
- **AVOID `late` variables if you need to check whether they are initialized.** Dart offers no way to tell whether a `late` variable is initialized; accessing it runs the initializer or throws. Make it non-late and nullable instead (unless null is a valid value).
- **CONSIDER type promotion or null-check patterns for nullable types.** Promotion works only for local variables, parameters and private final fields; declaring members private and final is often enough. Otherwise: the null-check pattern `if (this.response case var response?) { ... }`, or copy to a `final` local, `final response = this.response; if (response != null) {...}` (beware stale values, and don't write back to the local expecting the field to change). Sometimes `!` is best, but repeating `response!.url` is the bad example.

## Strings

- **DO use adjacent strings to concatenate string literals** (lint `prefer_adjacent_string_concatenation`), not `+`.
- **PREFER interpolation to compose strings and values** (lint `prefer_interpolation_to_compose_strings`): `'Hello, $name! You are ${year - birth} years old.'`. `.toString()` is fine for a single object.
- **AVOID curly braces in interpolation when not needed** (lint `unnecessary_brace_in_string_interps`): `'Hi, $name! I love your ${decade}s costume.'`.

## Collections

Dart supports lists, maps, queues and sets. The APIs themselves (map kinds, copying, JSON encoding) are in [CORE-LIBRARIES.md](CORE-LIBRARIES.md).

- **DO use collection literals when possible** (lint `prefer_collection_literals`): `<Point>[]`, `<String, Address>{}`, `<int>{}`, not `Map<String, Address>()` or `Set<int>()`. Named constructors (`List.from()`, `Map.fromIterable()`) still have uses; the unnamed `List` constructor is prohibited in null-safe Dart. Use spread `...`, `...?`, and collection `if` and `for`:
  ```dart
  var arguments = [
    ...options,
    command,
    ...?modeFlags,
    for (var path in filePaths)
      if (path.endsWith('.dart')) path.replaceAll('.dart', '.js'),
  ];
  ```
- **DON'T use `.length` to see if a collection is empty** (lints `prefer_is_empty`, `prefer_is_not_empty`). `Iterable` doesn't guarantee a constant-time length; use `.isEmpty` or `.isNotEmpty`, whichever doesn't need negation.
- **AVOID `Iterable.forEach()` with a function literal** (lint `avoid_function_literals_in_foreach_calls`): write `for (final person in people) {...}`. `people.forEach(print);` with an existing function is fine, and `Map.forEach()` is always OK.
- **DON'T use `List.from()` unless you intend to change the type.** `iterable.toList()` preserves `List<int>`; `List.from(iterable)` gives `List<dynamic>`. To change the type, use `List<int>.from(numbers)`.
- **DO use `whereType()` to filter a collection by type** (lint `prefer_iterable_whereType`): `objects.whereType<int>()`, not `.where((e) => e is int)` (which returns `Iterable<Object>`) nor `.where(...).cast<int>()`.
- **DON'T use `cast()` when a nearby operation will do:** `List<int>.from(stuff)` instead of `stuff.toList().cast<int>()`; `stuff.map<double>((n) => n * 2)` instead of `.map(...).cast<double>()`.
- **AVOID using `cast()`.** Create the collection with the right type, cast elements on access (`(n as int).isEven`), or cast eagerly with `List.from()`. `cast()` returns a lazy collection that checks the element type on every operation: it can be slow and may fail at runtime.

## Functions

- **DO use a function declaration to bind a function to a name** (lint `prefer_function_declarations_over_variables`): `void localFunction() {...}`, not `var localFunction = () {...};`.
- **DON'T create a lambda when a tear-off will do** (lint `unnecessary_lambdas`): `charCodes.forEach(print);`, `charCodes.forEach(buffer.write);`, `charCodes.map(String.fromCharCode);`, `charCodes.map(StringBuffer.new);`.

## Variables

- **DO follow a consistent rule for `var` and `final` on local variables.** Either `final` for locals that aren't reassigned and `var` for those that are, or `var` for all locals (still `final` for fields and top-level variables). Pick one. Most locals shouldn't have type annotations.
- **AVOID storing what you can calculate.** A `Circle` that stores area and circumference in its constructor goes stale; use getters: `double get area => pi * radius * radius;`. Cache only after you know you have a performance problem, carefully, with a comment.

## Members

- **DON'T wrap a field in a getter and setter unnecessarily** (lint `unnecessary_getters_setters`). Fields and getters/setters are indistinguishable in Dart.
- **PREFER a `final` field to make a read-only property:** `final contents = [];`.
- **CONSIDER `=>` for simple members** (lint `prefer_expression_function_bodies`), but use a block body if it runs more than a couple of lines or is deeply nested (cascades, conditionals). A `=>` setter is fine when paired with a `=>` getter: `set x(num value) => center = Point(value, center.y);`.
- **DON'T use `this.` except to redirect to a named constructor or to avoid shadowing** (lint `unnecessary_this`): `ShadeOfGray.alsoBlack() : this.black();`. Constructor parameters never shadow fields in initializer lists: `Box(Object? value) : value = value, super(value);`.
- **DO initialize fields at their declaration when possible:** `final DateTime start = DateTime.now();`. A `late` field's initializer can access `this`. Not applicable when a field depends on constructor parameters or is initialized differently by different constructors.

## Constructors

- **DO use initializing formals when possible** (lint `prefer_initializing_formals`): `Point(this.x, this.y);`.
- **DON'T use `late` when a constructor initializer list will do:** `Point.polar(double theta, double radius) : x = cos(theta) * radius, y = sin(theta) * radius;`. `late` turns a compile-time error into a runtime error and loses static safety and performance.
- **DO use `;` instead of `{}` for empty constructor bodies** (lint `empty_constructor_bodies`). It is required for const constructors.
- **PREFER concise constructor syntax** (lint `unnecessary_type_name_in_constructor`), only in libraries with language version 3.13 or later. Inside the class body, use `factory` for factory constructors and `new` for all others instead of repeating the class name. This applies to declarations only.
  ```dart
  class Logger {
    final String name;

    factory(String name) => _cache[name] ??= Logger._internal(name);

    new _internal(this.name);
    new fromJson(Map<String, Object?> json) : name = json['name'] as String;

    static final Map<String, Logger> _cache = {};
  }
  ```
- **DON'T use `new` in invocations** (lint `unnecessary_new`). It is optional, and its meaning is unclear because a factory constructor may not return a new object; consider it deprecated.
- **DON'T use `const` redundantly** (lint `unnecessary_const`). `const` is implicit inside a const collection literal, a const constructor call, a metadata annotation, the initializer of a const variable and a switch case expression. Default values are not in this list (a future Dart may allow non-const defaults). Anywhere writing `new` instead of `const` would be an error, you may omit `const`.
- **Keep generative constructors to assignment; put setup in a factory** ([ApparenceKit](https://apparencekit.dev/flutter-tips/dumb-constructor-smarter-factory-flutter/)). A constructor only takes the data it is given and assigns it to fields: no calculations, no fetching, no other logic. Work needed before the object can exist (the article's example is reading device info) goes in a `factory` constructor, which does that work and then returns an instance, "often using a standard constructor *after* the data is ready". A factory "doesn't necessarily create a *new* instance every time". The article's code is an image only.
- **CONSIDER making your constructor `const` if the class supports it** (all fields final, the constructor only initializes them). That lets users create instances inside larger constants, switch cases and default parameter values. A `const` constructor is a public-API commitment: changing it to non-const breaks users. In practice it is most useful for simple, immutable value-like types.

## Error handling

- **AVOID catches without `on` clauses** (lint `avoid_catches_without_on_clauses`). This "Pokémon exception handling" also catches `StackOverflowError`, `OutOfMemoryError`, `ArgumentError` and `AssertionError`. In framework code, prefer catching `Exception` over catching everything.
- **DON'T discard errors from catches without `on` clauses:** log, display or rethrow them.
- **DO throw objects that implement `Error` only for programmatic errors** (bugs). For runtime failures, throw `Exception` classes or other types.
- **DON'T explicitly catch `Error` or types that implement it** (lint `avoid_catching_errors`).
- **DO use `rethrow` to rethrow a caught exception** (lint `use_rethrow_when_possible`). It preserves the original stack trace; `throw e` resets it.

## Asynchrony

Futures, streams and their error handling in depth are in [ASYNC.md](ASYNC.md).

- **PREFER async/await over raw futures.**
  ```dart
  Future<int> countActivePlayers(String teamName) async {
    try {
      var team = await downloadTeam(teamName);
      if (team == null) return 0;

      var players = await team.roster;
      return players.where((player) => player.isActive).length;
    } on DownloadException catch (e) {
      log.error(e);
      return 0;
    }
  }
  ```
- **DON'T use `async` when it has no useful effect:** `return Future.any([left, right]);` needs no `async`. It is useful when you use `await`, when you return an error asynchronously (`async` plus `throw` is shorter than `Future.error`), and when you return a value to be wrapped (shorter than `Future.value`).
- **CONSIDER higher-order methods to transform a stream.**
- **AVOID using `Completer` directly.** It is needed only for new async primitives and for interfacing with non-future async code; otherwise use async/await or `Future.then()`.
- **DO test for `Future<T>` when disambiguating a `FutureOr<T>` whose type argument could be `Object`:** `if (value is Future<T>)`, because a `Future<Object>` is also an `Object`.
- **DO use `Future<void>` as the return type of async members that produce no values,** not `Future` or `Future<Null>`. Use `void` when no caller needs to await it or handle its failure.
- **AVOID `FutureOr<T>` as a return type:** `Future<int> triple(FutureOr<int> value) async => (await value) * 3;`. Use `FutureOr<T>` only in contravariant positions (parameters; a callback's return type is OK, for example `FutureOr<S> Function(T) callback`).
- **AVOID returning nullable `Future`, `Stream` and collection types.** Return an empty collection, a non-nullable future of a nullable type, or a stream that emits nothing. Exception: when `null` means something different.

## Naming APIs

Identifier casing is in [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md#identifiers).

- **DO use terms consistently and follow outside precedent:** `pageCount` and `updatePageCount()`, `toSomething()` (like `toList()`), `asSomething()` (like `asMap()`), `Point`. Bad: `renumberPages()`, `convertToSomething()`, `wrappedAsSomething()`, `Cartesian`.
- **AVOID abbreviations unless the abbreviation is more common than the full term:** `pageCount`, `buildRectangles`, `IOStream`, `HttpRequest`. Bad: `numPages`, `buildRects`, `InputOutputStream`, `HypertextTransferProtocolRequest`.
- **PREFER putting the most descriptive noun last:** `pageCount`, `ConversionSink`, `ChunkedConversionSink`, `CssFontFaceRule`. Bad: `numPages`, `CanvasRenderingContext2D`, `RuleFontFaceCss`.
- **CONSIDER making the code read like a sentence:** `errors.isEmpty`, `subscription.cancel()`, `monsters.where(...)`; bad `errors.empty`, `subscription.toggle()`, `monsters.filter(...)`. Don't overdo it: `theCollectionOfErrors`, `producesANewSequenceWhereEach`.
- **PREFER a noun phrase for a non-boolean property or variable:** `list.length`, `context.lineWidth`; bad `list.deleteItems`.
- **PREFER a non-imperative verb phrase for a boolean property or variable.** Forms of "to be" are most common (`isEnabled`, `wasShown`, `willFire`); auxiliary verbs (`hasElements`, `canClose`, `shouldConsume`, `mustSave`); active verbs only when the name can only be read as a predicate (`ignoresInput`, `wroteFile`; `loggedResult` and `closingConnection` are ambiguous). Good: `isEmpty`, `hasElements`, `canClose`, `closesWindow`, `canShowPopup`, `hasShownPopup`. Bad: `empty`, `withElements`, `closeable`, `closingWindow`, `showPopup`.
- **CONSIDER omitting the verb for a named boolean *parameter*:** `Isolate.spawn(entryPoint, message, paused: false);`, `List.from(elements, growable: true);`, `RegExp(pattern, caseSensitive: false);`.
- **PREFER the "positive" name for a boolean:** `socket.isConnected && database.hasData`, not `!socket.isDisconnected && !database.isEmpty`. In ambiguous cases choose the one less likely to be negated, or the shorter one. Exception: if users overwhelmingly need the negative form, use it.
- **PREFER an imperative verb phrase for a function or method whose main purpose is a side effect:** `list.add('element')`, `queue.removeFirst()`, `window.refresh()`.
- **PREFER a noun phrase or non-imperative verb phrase if returning a value is the primary purpose:** `list.elementAt(3)`, `list.firstWhere(test)`, `string.codeUnitAt(4)`. This one is softer: `list.take()` and `string.split()` are OK.
- **CONSIDER an imperative verb phrase to draw attention to the work performed:** `database.downloadData()`, `packageGraph.solveConstraints()`. Also softer; mostly name a method by what it does for the caller.
- **AVOID starting a function or method name with `get`.** Make it a getter (`breakfastOrder`), drop the `get` (`breakfastOrder()`), or use a precise verb (`create`, `download`, `fetch`, `calculate`, `request`, `aggregate`).
- **PREFER naming a method `to___()` if it copies the object's state to a new object** (lint `use_to_and_as_if_applicable`): `list.toSet()`, `stackTrace.toString()`, `dateTime.toLocal()`.
- **PREFER naming a method `as___()` if it returns a different representation backed by the original object** (a view): `table.asMap()`, `bytes.asFloat32List()`, `subscription.asFuture()`.
- **AVOID describing the parameters in the name:** `list.add(element)`, not `addElement`, except to disambiguate (`containsKey`, `containsValue`).
- **Name a class after what it is, not what it does** ([ApparenceKit](https://apparencekit.dev/flutter-tips/name-your-class-properly/)). `EmailValidator` covers one job; once formatting or parsing arrives, the name is wrong. Name the thing (`Email`) and make the jobs its methods (`validate()`, `format()`, `parse()`):

  ```dart
  class EmailValidator {
    EmailValidator();

    void validate(String email) {
      // code to check if email is valid
      // ... throws an error if not valid
    }
  }
  ```

  ```dart
  class Email {
    final String _value;

    Email(String email) : _value = email.trim(); // Represents an email

    void validate() {
      // code to check if *this* email is valid
      // ... throws an error if not valid
    }
  }
  ```
- **DO follow mnemonic conventions for type parameters:** `E` for element (`List<E>`), `K` and `V` for key and value (`Map<K, V>`), `R` for return type (visitors, `ExpressionVisitor<R>`), otherwise `T`, `S`, `U` (`Future<S> then<S>(...)` uses `S` to avoid shadowing `T`). Otherwise use another mnemonic or a descriptive name: `Graph<N, E>` or `Graph<Node, Edge>`.

## Library privacy

A leading `_` makes a member private to its library; this is built into the language.

- **PREFER making declarations private.** Public interfaces stay narrow, and the analyzer reports unused private declarations.
- **CONSIDER declaring multiple classes in the same library.** Privacy is library-level, which enables "friend" classes.

## Classes and mixins

Class modifier semantics are in [LANGUAGE.md](LANGUAGE.md).

- **AVOID defining a one-member abstract class when a simple function will do** (lint `one_member_abstracts`): `typedef Predicate<E> = bool Function(E element);`.
- **AVOID defining a class that contains only static members** (lint `avoid_classes_with_only_static_members`). Use top-level functions and constants, and libraries with import prefixes and `show`/`hide`. "A type that is never instantiated is a code smell." Not a hard rule: grouping constants or enum-like values in a class (for example `class Color { static const red = '#f00'; ... }`) can be natural.
- **AVOID extending a class that isn't intended to be subclassed.** Changing a generative constructor to a factory, or changing which methods call each other, breaks subclasses. Unless the author signals it (a doc comment, or an obvious name like `IterableBase`), assume you should not extend the class.
- **DO use class modifiers to control if your class can be extended** (`final`, `interface`, `sealed`): `final class A {}` or `interface class B {}` prevent extension outside the current library. Use modifiers rather than documentation.
- **AVOID implementing a class that isn't intended to be an interface.** Adding a member then breaks implementers. Implement implicit interfaces only for classes clearly intended to be implemented.
- **DO use class modifiers to control if your class can be an interface** (`final`, `base`, `sealed`): `final class C {}` or `base class D {}` prevent implementation outside the library.
- **PREFER defining a pure `mixin` or pure `class` to a `mixin class`** (lint `prefer_mixin`). Language versions 2.12 to 2.19 allowed mixing in any class that met the restrictions; Dart 3.0.0 requires `mixin class` for a type used both as a mixin and a class. It is mostly a migration aid.

## API members

- **PREFER making fields and top-level variables `final`** (lint `prefer_final_fields`). Use `late final` if it must reference `this`.
- **DO use getters for operations that conceptually access properties.** A getter takes no arguments and returns a result; the caller cares mostly about the result; it has no user-visible side effects (hidden caching or logging is OK); it is idempotent (a new future or list each time is fine if it holds the same value or elements); and it doesn't expose all of the object's state (use `to___()` or `as___()` for that). "getters are not 'particularly slow fields' in Dart; fields are 'particularly fast getters'." `IterableBase.length` is O(n), and that is OK; but if it does a surprising amount of work, make it a method named with a verb. Bad getters: `connection.nextIncomingMessage` (network I/O), `expression.normalForm` (exponential), `stdout.newline`, `list.clear`, `DateTime.now`. Good: `rectangle.area`, `collection.isEmpty`, `button.canShow`, `dataSet.minimumValue`.
- **DO use setters for operations that conceptually change properties** (lint `use_setters_to_change_properties`): a single argument, no result, changes state, idempotent.
- **DON'T define a setter without a corresponding getter** (lint `avoid_setters_without_getters`). A setter alone allows `=` but not `+=`. Don't add a getter just to permit it; use a method.
- **AVOID using runtime type tests to fake overloading.** Dart has no overloading; prefer separate method names unless callers have unknown types.
- **AVOID public `late final` fields without initializers.** They define a public setter. Alternatives: don't use `late`; use a factory constructor; initialize at the declaration; or use a private `late` field with a public getter.
- **AVOID returning `this` just to enable a fluent interface** (lint `avoid_returning_this`). Use cascades: `StringBuffer()..write('one')..write('two')`.
- **Overload an operator when it has a clear meaning for the type** ([ApparenceKit](https://apparencekit.dev/flutter-tips/overloading-operators-dart-flutter-readability/)), for example mathematical concepts: `v1 + v2` instead of `Vector(vector1.x + vector2.x, vector1.y + vector2.y)`. "You can overload many other operators in Dart."

  ```dart
  class Vector {
    final int x, y;
    Vector(this.x, this.y);

    // Define what '+' does for Vector objects
    Vector operator +(Vector other) => Vector(x + other.x, y + other.y);
  }

  void main() {
    final v1 = Vector(1, 2);
    final v2 = Vector(3, 4);

    // Now we can use '+' directly
    final result = v1 + v2;

    print('${result.x}, ${result.y}'); // Output: 4, 6
  }
  ```

## Types

Terminology: a declaration is type annotated, inferred, or `dynamic`. In short: annotate when inference lacks context (even for `dynamic`); don't annotate locals and generic invocations unless needed; prefer annotating top-level variables and fields unless the initializer makes the type obvious. When inference lacks information, Dart sometimes reports an error but usually silently fills in `dynamic`. Inference can also pick an overly precise type from an initializer when you mean to assign other types later; then write the type.

- **DO type annotate variables without initializers** (lint `prefer_typing_uninitialized_variables`): `List<AstNode> parameters;`, not `var parameters;`.
- **DO type annotate fields and top-level variables if the type isn't obvious** (lint `type_annotate_public_apis`): `Future<bool> install(PackageId id, String destination) => ...`, not `install(id, destination) => ...`. Obvious means literals, constructor invocations, references to explicitly typed constants, simple number and string expressions, and familiar factory methods (`int.parse()`, `Future.wait()`). When in doubt, annotate. This applies to private declarations too.
- **DON'T redundantly type annotate initialized local variables** (lint `omit_local_variable_types`). Annotate when you want a wider type: `Widget result = Text('You won!');`.
- **DO annotate return types on function declarations.** Dart doesn't infer a non-local function's return type from its body. Local functions and function expressions do infer, and anonymous function syntax doesn't allow a return type.
- **DO annotate parameter types on function declarations.** Dart doesn't infer an optional parameter's type from its default value: `void sayRepeatedly(String message, {int count = 2})`.
- **DON'T annotate inferred parameter types on function expressions** (lint `avoid_types_on_closure_parameters`): `people.map((person) => person.name)`.
- **DON'T type annotate initializing formals** (lint `type_init_formals`): `Point(this.x, this.y);`, `MyWidget({super.key});`, not `double this.x` or `Key? super.key`.
- **DO write type arguments on generic invocations that aren't inferred:** `<String, int>{}`, `StreamController<Event>()`; or annotate the non-local declaration: `final Completer<String> response = Completer();`.
- **DON'T write type arguments that are inferred:** no `Completer<String>()` after an annotated field; `Future.value([1, 2, 3])`, not `Future<List<int>>.value(<int>[1, 2, 3])`.
- **AVOID writing incomplete generic types ("raw types"):** `List<num> numbers`, `Completer<Map<String, int>>()`. Missing type arguments are filled with `dynamic` (or the bound).
- **DO annotate with `dynamic` instead of letting inference fail:** `dynamic mergeJson(dynamic original, dynamic changes) => ...`. It is OK to let inference propagate `dynamic` (for example `json['users']` from a `Map<String, dynamic>`). Exception: unused parameters (`_`) can omit annotations.
- **PREFER signatures in function type annotations:** `bool Function(String) test`, not a bare `Function`. Exception: a union of function arities, where you take `Function` and check `is Function(Object)` or `is Function(Object, StackTrace)`.
- **DON'T specify a return type for a setter** (lint `avoid_return_types_on_setters`); the same goes for `operator []=`.
- **DON'T use the legacy typedef syntax** (lint `prefer_generic_function_type_aliases`): `typedef Comparison<T> = int Function(T, T);`, not `typedef int Comparison<T>(T a, T b);`. In `typedef bool TestNumber(num);`, `num` is the parameter name and its type is `dynamic`. The old syntax is deprecated but supported.
- **PREFER inline function types over typedefs** (lint `avoid_private_typedef_functions`): `final bool Function(Event) _predicate;`. A typedef may still be worthwhile if the type is long or used often. [ApparenceKit](https://apparencekit.dev/flutter-tips/dart-typedef-alias-types/)'s examples: a callback type `typedef OnClickEvent = void Function(int index);` for a widget's `final OnClickEvent onClick;`, a non-function alias `typedef ComplexMap = Map<String, Map<String, num>>;` used as `final ComplexMap myMap = {};`, and a generic one, `typedef ComplexMap<T> = Map<String, Map<String, T>>;`. The article's widget still uses `const MyButton({Key? key, required this.onClick}) : super(key: key);`; write `{super.key, required this.onClick}` (lint `use_super_parameters`).
- **PREFER function type syntax for parameters** (lint `use_function_type_syntax_for_parameters`): `Iterable<T> where(bool Function(T) predicate)`, not `bool predicate(T element)`.
- **AVOID using `dynamic` unless you want to disable static checking.** `dynamic` permits every member access at compile time, which may throw at runtime. Otherwise use `Object?` (all objects) or `Object` (all but null) with `is` checks. Exception: existing APIs such as JSON's `Map<String, dynamic>`; cast to precise types before accessing.

`Future<void>` and `FutureOr<T>` return-type rules are under [Asynchrony](#asynchrony).

## Parameters

Optional parameters are either positional or named, not both.

- **AVOID positional boolean parameters** (lint `avoid_positional_boolean_parameters`): `Task.oneShot()`, `ListBox(scroll: true, showScrollbars: true)`, `Button(ButtonState.enabled)`. Setters are exempt.
- **AVOID optional positional parameters if the user may want to omit earlier ones.** Examples: `String.fromCharCodes(Iterable<int> charCodes, [int start = 0, int? end])`, `DateTime(int year, [int month = 1, ...])`, `Duration({int days = 0, ...})`.
- **AVOID mandatory parameters that accept a special "no argument" value:** `string.substring(start)`, not `substring(start, null)`.
- **DO use inclusive start and exclusive end parameters for ranges:** `[0, 1, 2, 3].sublist(1, 3) // [1, 2]`, `'abcd'.substring(1, 3) // 'bc'`.

## Equality

- **DO override `hashCode` if you override `==`** (lint `hash_and_equals`). Equal objects must have the same hash code.
- **DO make `==` reflexive, symmetric and transitive.**
- **AVOID defining custom equality for mutable classes** (lint `avoid_equals_and_hash_code_on_mutable_classes`).
- **DON'T make the parameter to `==` nullable** (lint `avoid_null_checks_in_equality_operators`): `bool operator ==(Object other) => other is Person && name == other.name;`. `==` is only called when the right side is not null.
- **A full override** with an `identical` fast path and a `runtimeType` check ([ApparenceKit](https://apparencekit.dev/flutter-tips/compare-dart-object-equals-hashcode/)); with several fields, "combine the hash codes of the relevant properties" ([ApparenceKit](https://apparencekit.dev/flutter-tips/object-equality-in-dart-flutter/)):

  ```dart
  class Person {
    const Person(this.name);

    final String name;

    @override
    bool operator ==(Object other) =>
        identical(this, other) ||
        other is Person &&
        runtimeType == other.runtimeType &&
        name == other.name;

    @override
    int get hashCode => name.hashCode;
  }
  ```
- **Or generate it:** extend `Equatable` from `package:equatable` and override the `props` getter with the fields that count; Equatable then provides `==` and `hashCode` ([ApparenceKit](https://apparencekit.dev/flutter-tips/object-equality-in-dart-flutter/), no version stated). IntelliJ and Android Studio can also generate `==` and `hashCode` from the fields you select, and `package:freezed` generates them too ([ApparenceKit](https://apparencekit.dev/flutter-tips/compare-dart-object-equals-hashcode/); freezed is in [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md)).
- **Why models need it in Flutter:** value equality "ensures that your UI updates correctly when an object's data changes, even if the object itself is a new instance", and it matters when comparing lists, filtering and using objects as map keys ([ApparenceKit](https://apparencekit.dev/flutter-tips/object-equality-in-dart-flutter/)). This is about model classes; never override `operator ==` on `Widget` objects ([flutter PERFORMANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/PERFORMANCE.md)).

## Prove it

- **`dart analyze` is clean with the lints named above enabled** (setup in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md)).
- **No import path contains `/lib/` or climbs out of `lib` with `../`,** no import reaches into another package's `lib/src`, and tests import the package under test with `package:`.
- **Every class that overrides `==` also overrides `hashCode`,** and its `==` takes a non-nullable `Object`.
- **Public fields, top-level variables, function return types and parameters are annotated** unless the initializer makes the type obvious; initialized locals and closure parameters are not.
- **Async members that return nothing return `Future<void>`,** and no member returns `FutureOr<T>` or a nullable `Future`, `Stream` or collection.
- **Every `catch` has an `on` clause or logs, displays or rethrows,** and rethrows use `rethrow`, not `throw e`.
