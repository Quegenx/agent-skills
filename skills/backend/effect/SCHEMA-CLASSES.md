# Schema classes, errors and constructors

**Contents:** [Constructors](#constructors) · [Constructor defaults](#constructor-defaults) · [Opaque structs](#opaque-structs) · [Schema.Class](#schemaclass) · [TaggedClass](#taggedclass) · [Errors](#errors) · [Existing classes](#existing-classes) · [Static helpers on schemas](#static-helpers-on-schemas) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

How Effect v4 Schema builds values: `make`, constructor defaults, opaque structs, `Schema.Class`, and the tagged errors every service uses. Field definitions are in [SCHEMA.md](SCHEMA.md).

## Constructors

- **Every schema has `make`, unions included.** It runs all validations and throws on failure (an `Error` with the issue in its `cause`). Constructors take the `Type`, not the `Encoded` (`FiniteFromString`'s constructor takes a number).
- **Use `make` when invalid input is exceptional; when failure is expected use `makeOption` or `makeEffect`.** `Schema.makeOption`, `schema.makeOption` and `SchemaParser.makeOption(schema)` return an `Option` (None for schema issues; defects still throw).
- **`makeEffect` fails with `SchemaIssue.Issue`,** per the source signature `makeEffect(...): Effect.Effect<this["Type"], SchemaIssue.Issue>` (also `SchemaParser.makeEffect`). Some docs say it fails with `SchemaError`.
- **`MakeOptions`:** `parseOptions?` and `disableChecks?` (disables validation).
- **A branded schema's own `make` brands its input:** `Schema.String.pipe(Schema.brand<"a">())` has `make(input: string, options?: Schema.MakeOptions): string & Brand<"a">`. Inside a struct you must pass an already-branded value. Refinements work the same way: `Schema.Option(Schema.String).pipe(Schema.refine(Option.isSome))` accepts `Option<string>` and returns `Option.Some<string>`, but inside a struct the refined value must be provided.

## Constructor defaults

- **`Schema.withConstructorDefault(Effect.succeed(-1))`** applies when the key is missing or `undefined`. The Effect runs each time a default is needed, so `Effect.sync(() => new Date(counter++))` gives a fresh value per call. Nested defaults resolve inner first.
- **Effectful defaults need an environment of `never`;** run them with `SchemaParser.makeEffect(schema)({})`, and reach optional services with `Effect.serviceOption(ConstructorService)`.
- **Defaults travel with the field:** reusing `Person.fields.age` keeps its default, and defaults apply in classes.

## Opaque structs

- **`Schema.Opaque<Self>()(Schema.Struct({...}))`** gives a struct its own TypeScript type through a thin class shell; the runtime value is still the plain struct schema. Instance methods and custom constructors are not allowed (no `new`), though the type level doesn't enforce it.
- **Use it like the struct:** `Person.make({ name: "John" })`, `Person.fields`, nest it in other schemas; `Schema.revealCodec(Person)` shows `Codec<Person, { readonly name: string }, never, never>`.
- **Annotate the inner struct,** `Schema.Struct({...}).annotate({ identifier: "Person" })`, which gives "Expected Person". `Person.annotate(...)` returns the wrapped struct type, not a new class.
- **Recursive opaque with a different encoded side:** declare `interface CategoryEncoded extends Schema.Codec.Encoded<typeof Category> {}` and suspend with `Schema.suspend((): Schema.Codec<Category, CategoryEncoded> => Category)`.
- **Branded opaque:** `Schema.Opaque<A, { readonly brand: unique symbol }>()(...)` or `Schema.Opaque<A, Brand.Brand<"A">>()(...)` stops two same-shaped opaques from being assignable to each other.

## Schema.Class

- **One declaration gives a runtime validator and a TypeScript class.** Use a stable module-path identifier:

```ts
  export class User extends Schema.Class<User>("path/to/module/User")({
    id: Schema.Int,
    name: Schema.NonEmptyString,
    email: Schema.String,
    role: Schema.Literals(["admin", "member"])
  }) {}
  export type UserEncoded = typeof User["Encoded"]
```

- **The identifier is required and stable:** it labels diagnostics and generated references, formats instances (`String(alice)` is `Person({"name":"Alice","age":30})`), and derives a runtime marker that recognizes instances across hot module reloads where `instanceof` fails. It is explicit because the JS class name is not available while `extends` is evaluated and can change under renaming or minification. Omitting `Self` is a `MissingSelfGeneric<"Schema.Class">` type error.
- **Signature:** `Schema.Class<Self, Brand = {}>(identifier)(fieldsOrStruct, annotations?)`. Statics include `make`, `makeOption`, `makeEffect`, `annotate`, `annotateKey`, `check`, `extend`, `mapFields`.
- **Classes are transformations from a struct to a declaration:** decoding builds an instance, encoding gives a plain object. `new A({ a: "a" })`, `A.make({ a: "a" })` and `Schema.decodeUnknownSync(A)({ a: "a" })` all give `A { a: 'a', _a: 1 }` for `class A extends Schema.Class<A>("A")({ a: Schema.String }) { readonly _a = 1 }`. When every field is optional the constructor accepts `void`.
- **Unlike `Opaque`,** methods, getters, setters, regular fields and custom constructors are allowed, instances carry the prototype (`instanceof` works), and they compare structurally with `Equal.equals` (nested arrays included) without implementing `Equal`.
- **Construction validates.** `new Person({...}, { disableChecks: true })` skips it; that is not generally recommended.
- **Class-wide filters:** pass a `Struct` with `.check(...)` instead of a field record; both `new A(...)` and decoding then fail with the filter's message ("Expected a === b").
- **Annotations go in the second argument:** `Schema.Class<A>("A")({ a: Schema.String }, { title: "my title" })`, read back with `A.ast.annotations?.title`.
- **Branded classes:** `Schema.Class<A, { readonly brand: unique symbol }>("A")` or `Schema.Class<A, Brand.Brand<"A">>("A")`.
- **Extend with `A.extend<B>("B")({ b: Schema.Number })`:** base instance fields and getters are inherited. A same-named field replaces the inherited one, and Effect does not check compatibility; the caller must keep the base class contract. Keep statics with `A.extend<B, typeof A>("B")(...)`.
- **Recursive classes** use `Schema.suspend((): Schema.Codec<Category> => Category)`; with a different encoded side, `interface CategoryEncoded extends Schema.Codec.Encoded<typeof Category> {}`.

## TaggedClass

- **`Schema.TaggedClass<Person>()("Person", { name: Schema.String })`** adds `_tag` through `Schema.tag`. The tag doubles as the identifier; override it with `Schema.TaggedClass<Person>("MyPerson")("Person", {...})` (`Person.identifier === "MyPerson"`).
- **Unions of tagged classes decode to instances:** `Schema.Union([Cat, Dog])` decodes `{ _tag: "Cat", lives: 9 }` to `Cat {...}`.
- **Every Class feature applies:** `extend`, `annotate`, `check`, brands, recursion.

## Errors

See [tagged error construction, Defect encoding and decoder error mapping](ERRORS.md#defining-errors).

## Existing classes

- **Validate constructor arguments of a class you already have** with a tuple schema's `make` inside the constructor: `const PersonConstructorArguments = Schema.Tuple([Schema.String, Schema.Finite])`; `PersonConstructorArguments.make([name, age])` throws "Expected a finite number\n  at [1]". Subclasses validate only their additional arguments.
- **Give an existing class a schema** with `instanceOf` and a `toCodecJson` link:

```ts
  Schema.instanceOf(Person, {
    title: "Person",
    toCodecJson: () => Schema.link<Person>()(
      Schema.Tuple([Schema.String, Schema.Number]),
      SchemaTransformation.transform({
        decode: (args) => new Person(...args),
        encode: (instance) => [instance.name, instance.age] as const
      }))
  })
```

  Add `.pipe(Schema.encodeTo(Schema.Struct({ name, age }), SchemaTransformation.transform({...})))` for an explicit encoding.
- **`Data.Error` with schema-validated props:** `class Err extends Data.Error<typeof Props.Type> { constructor(props) { super(Props.make(props)) } }`, with the schema `Schema.instanceOf(Err, {...}).pipe(Schema.encodeTo(Props, transformation))`. The guide's example puts the link under a `serialization.json` annotation while every other example uses `toCodecJson`; treat that as an inconsistency in the guide.

## Static helpers on schemas

- **Attach serializers as statics:** `static readonly serializer = Schema.toCodecJson(this)`. `Schema.encodeUnknownSync(Person)` keeps a `Date` as a `Date`; the serializer gives ISO strings.
- **Subclass a schema for static helpers only:** `class MyString extends Schema.String { static readonly decodeUnknownSync = Schema.decodeUnknownSync(this) }`. It is not nominal and makes no prototype instances; subclassing works.

## Anti-patterns

- **A class without a stable identifier,** or one derived from the JS class name. Use a module-path string.
- **`make` where failure is expected.** Use `makeOption` or `makeEffect`.
- **Raising an error in `Effect.gen` without `return`.** Write `return yield* new SomeError(...)`.
- **Duplicate `_tag` values** across error classes.
- **`disableChecks: true` to make construction pass.**
- **Calling `.annotate` on an opaque to rename it.** Annotate the inner struct.

## Prove it

Every class and tagged error has an explicit, unique identifier and tag (grep the tags for duplicates). A test constructs each class from invalid input and gets the schema's message, decodes and encodes one instance and gets the same plain object back, and catches each tagged error with `Effect.catchTag`. No `disableChecks` appears outside tests.
