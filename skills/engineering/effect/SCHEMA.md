# Schema

**Contents:** [Ground rules](#ground-rules) · [Types and views](#types-and-views) · [Primitives, literals, strings, numbers](#primitives-literals-strings-numbers) · [Structs](#structs) · [Optional and nullable fields](#optional-and-nullable-fields) · [Decoding defaults](#decoding-defaults) · [Excess keys and index signatures](#excess-keys-and-index-signatures) · [Deriving structs](#deriving-structs) · [Tuples, arrays, records](#tuples-arrays-records) · [Unions](#unions) · [Recursive schemas](#recursive-schemas) · [Custom types](#custom-types) · [Filters and refinements](#filters-and-refinements) · [Brands](#brands) · [Recognising v3 Schema code](#recognising-v3-schema-code) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Effect v4 `Schema` (`import { Schema } from "effect"`, helpers from `effect/schema`). Classes, errors and constructors are in [SCHEMA-CLASSES.md](SCHEMA-CLASSES.md); decoding, transformations and error formatting in [SCHEMA-TRANSFORMS.md](SCHEMA-TRANSFORMS.md); annotations, JSON Schema, test data and HTTP, RPC, Config, SQL in [SCHEMA-INTEGRATIONS.md](SCHEMA-INTEGRATIONS.md). The full guide is the package's `SCHEMA.md` (repo `packages/effect/SCHEMA.md`); it is large, so read it in chunks.

## Ground rules

- **Do all validation and domain modeling with `Schema`.** Parse untrusted data with a schema; avoid predicates and manual parsing.
- **Two directions:** decoding turns unknown external data into typed, validated values; encoding turns typed values back into a serializable form.
- **Nothing is included implicitly.** Schemas are immutable; every combinator returns a new schema.
- **Requirements:** TypeScript 5.9 or newer (TypeScript 7 recommended), `strict: true`, `exactOptionalPropertyTypes` optional. With it off, `Schema.optionalKey(Schema.String)` types as `name?: string | undefined`, so `Schema.decodeSync(Person)({ name: undefined })` type-checks and then throws `SchemaError: Expected string at ["name"]`.
- **Naming convention:** a schema whose type equals its encoding is named after the type (`Schema.Finite`, `Schema.Date`); a transforming schema is `TFromE`, "decode `E` into `T`" (`FiniteFromString`, `DateFromString`).

## Types and views

- **Extract types** with `typeof S.Type`, `typeof S.Encoded`, and `Schema.Codec.DecodingServices<typeof S>` (or `typeof S.DecodingServices`). Defining an `interface` from the type is recommended for performance and readability. Most constructors return `readonly` types.
- **Views:** `Top`, `Schema<Type>`, `Decoder<Type, DecodingServices>`, `Encoder<Encoded, EncodingServices>`, `Codec<Type, Encoded, DecodingServices, EncodingServices>`. `Codec<string>` is `Codec<string, string, never, never>`. Hierarchy: `Top` -> `Schema<T>` -> `Codec<T, E, RD, RE>` -> `Bottom`.
- **Use `Top`, `Schema` and `Codec` as constraints only,** never as explicit annotations or return types:

  ```ts
  declare function foo<S extends Schema.Top>(schema: S) // good
  const schema: Schema.Codec<number, string> = Schema.FiniteFromString // erases info
  ```

  The annotation widens internals (for example `~type.mutability` becomes `"readonly" | "mutable"`). The one exception is recursive schemas (below).
- **Separate requirements:** `Codec<T, E, RD, RE>` keeps decoding and encoding services apart. `Schema.decodeEffect(User)` requires only `RD`, `Schema.encodeEffect(User)` only `RE` (decode can need a `UserDatabase` while encode needs `never`).
- **A schema wraps an untyped AST node.** AST nodes carry `annotations`, `checks`, `encoding` (a list of transformations) and `context` (optional or mutable info inside composites). Schema members include `ast`, `Type`, `Encoded`, `DecodingServices`, `EncodingServices`, `annotate`, `annotateKey`, `check`, `rebuild`, `make`.

## Primitives, literals, strings, numbers

- **Primitives:** `Schema.String`, `Number`, `BigInt`, `Boolean`, `Symbol`, `Undefined`, `Null`, `Void`.
- **Literals:** `Schema.Literal("tuna")`, `Schema.Literal(12)`, `Schema.Literal(2n)`, `Schema.Literal(true)`; symbols with `Schema.UniqueSymbol(Symbol("terrific"))`. Several values with `Schema.Literals(["red", "green", "blue"])`, which exposes `.literals` (the readonly tuple of values) and `.members` (the Literal schemas). Native TS enums with `Schema.Enum(Fruits)`; `.enums` exposes the members.
- **String checks** go through `.check(...)`: `Schema.isMaxLength(5)`, `isMinLength`, `isBetweenLength(5, 5)`, `isPattern(/^[a-z]+$/)`, `isStartingWith`, `isEndingWith`, `isIncluding`, `isUppercased()`, `isLowercased()`, `isTrimmed()`, `isCapitalized`, `isUncapitalized`, `isStringFinite`, `isStringBigInt`. Formats: `isUUID(version?)`, `isGUID`, `isULID`, `isBase64()`, `isBase64Url()`.
- **Validate versus transform:** `Schema.isTrimmed` only validates, `Schema.Trim` trims on decode, `Schema.Trimmed` requires input that is already trimmed. Lowercase works the same way. String transforms: `Schema.String.decode(SchemaTransformation.trim())`, `toLowerCase()`, `toUpperCase()`.
- **Numbers:** `Schema.Number` accepts all numbers; `Schema.Finite` rejects `Infinity`, `-Infinity` and `NaN`; `Schema.Int` exists. Checks: `isBetween({ minimum: 5, maximum: 10 })`, `isGreaterThan`, `isGreaterThanOrEqualTo`, `isLessThan`, `isLessThanOrEqualTo`, `isMultipleOf`, `isInt()`, `isInt32()`, `isUint32`.
- **BigInt has no pre-built check factories;** build them: `Schema.makeIsBetween({ order: Order.BigInt })`, `makeIsGreaterThan`, `makeIsGreaterThanOrEqualTo`, `makeIsLessThan`, `makeIsLessThanOrEqualTo`, `makeIsMultipleOf({ remainder: BigInt.remainder, zero: 0n })`.
- **Dates:** `Schema.Date` matches valid `Date` objects and rejects `new Date(NaN)`; date checks `isGreaterThanDate`, `isBetweenDate`. v4 `Schema.Date` expects a `Date` as its encoded value; use `Schema.DateFromString` for ISO strings (v3 `Schema.Date` decoded strings, so ported code can type-check and still reject the same input).
- **Template literals:** `Schema.TemplateLiteral([...parts])` with literal or schema parts; checks on parts apply per segment. Parts must not contain encodings (construction throws for transformed parts); use `Schema.TemplateLiteralParser` when parts decode.

  ```ts
  const email = Schema.TemplateLiteral([
    Schema.String.check(Schema.isMinLength(1)), "@", Schema.String.check(Schema.isMaxLength(64))
  ]) // type `${string}@${string}`
  ```

  `Schema.TemplateLiteralParser([Schema.String.check(Schema.isMinLength(2)), ":", Schema.Int])` decodes `"aa:1"` to `["aa", ":", 1]`. Ambiguous templates segment greedily with backtracking; round trips may differ when a segment contains a separator.
- **Other built-ins** in the source: `NonEmptyString`, `NumberFromString`, `FiniteFromString`, `BigIntFromString`, `DateFromString`, `URL`, `URLFromString`, `Uint8Array`, `DateTimeUtc`, `DateTimeUtcFromString`, `Duration`, `Option`, `Result`, `Exit`, `Cause`, `Chunk`, `HashMap`, `Redacted`, `Json`, `File`. Effect data types are covered in [SCHEMA-TRANSFORMS.md](SCHEMA-TRANSFORMS.md).

## Structs

- **Keys are required and readonly by default.** `Schema.optionalKey(s)` lets the key be absent, `Schema.mutableKey(s)` makes it writable, and they combine: `Schema.optionalKey(Schema.mutableKey(Schema.String))`.
- **`Schema.Struct({})`** types as `{}` and accepts any non-nullish value.
- **Reuse fields by spreading `.fields`:** `Schema.Struct({ ...Timestamped.fields, name: Schema.String })`, from one or several sources.
- **Tagged structs:** `Schema.TaggedStruct("A", { a: Schema.String })` equals `Schema.Struct({ _tag: Schema.tag("A"), a: Schema.String })`. With `make` the `_tag` is optional and added for you; decoding and encoding require it in the input. Read the literal with `tagged.fields._tag.schema.literal`.
- **Key annotations:** `Schema.String.annotateKey({ description: "...", messageMissingKey: "Username is required" })` gives `SchemaError: Username is required at ["username"]`.
- **Rename keys only in the encoded form** with `Schema.encodeKeys({ userId: "user_id", accountName: "account_name" })` (unlike `Struct.renameKeys`, which renames both sides). Apply it after the full struct is defined when you reuse fields or `Schema.fieldsAssign`. The migration reference marks it experimental.

  ```ts
  Schema.decodeUnknownSync(schema)({ user_id: "1", account_name: "alice" }) // { userId: 1, accountName: "alice" }
  ```

## Optional and nullable fields

| Field | Type |
|---|---|
| `Schema.optionalKey(X)` | `a?: T` (exact optional) |
| `Schema.optional(X)` | `b?: T \| undefined` |
| `Schema.optionalKey(Schema.NullOr(X))` | `c?: T \| null` |
| `Schema.optional(Schema.NullOr(X))` | `d?: T \| null \| undefined` |
| `Schema.optionalKey(Schema.Never)` | `a?: never` |

- **Drop `undefined` from the decoded output:**

  ```ts
  Schema.optional(Schema.FiniteFromString).pipe(Schema.decodeTo(Schema.optionalKey(Schema.Number), {
    decode: SchemaGetter.transformOptional(Option.filter(Predicate.isNotUndefined)),
    encode: SchemaGetter.passthrough()
  }))
  ```

- **Optional fields as `Option`:**
  - `Schema.OptionFromOptionalKey(X)`: encoded `quantity?: string`, type `Option<number>`; `{}` decodes to None; an explicit `undefined` fails; None encodes to `{}`.
  - `Schema.OptionFromOptional(X)`: encoded `quantity?: string | undefined`; `undefined` decodes to None; None encodes to `{}`.
  - `Schema.OptionFromOptionalNullOr(X)`: encoded `?: string | null | undefined`; null, undefined and missing all decode to None.
  - Also `OptionFromUndefinedOr`, `OptionFromNullOr`, `OptionFromNullishOr(x, { onNoneEncoding: null })`.
  - Exact optional plus null by hand:

    ```ts
    Schema.optionalKey(Schema.NullOr(X)).pipe(Schema.decodeTo(Schema.Option(Schema.Number),
      SchemaTransformation.transformOptional({
        decode: (oe) => oe.pipe(Option.filter(Predicate.isNotNull), Option.some),
        encode: Option.flatten
      })))
    ```

## Decoding defaults

| API | Applies when the encoded key is | Default value type |
|---|---|---|
| `Schema.withDecodingDefaultKey` | absent | Encoded |
| `Schema.withDecodingDefault` | absent or `undefined` | Encoded |
| `Schema.withDecodingDefaultTypeKey` | absent | Type |
| `Schema.withDecodingDefaultType` | absent or `undefined` | Type |

- **Defaults are Effects:** `Schema.FiniteFromString.pipe(Schema.withDecodingDefault(Effect.succeed("1")))` has encoded `a?: string | undefined` and type `a: number`. `withDecodingDefaultType(Effect.succeed(1))` bypasses the decoding step. Decoding defaults can require services and fail.
- **Nested defaults:** `Schema.Struct({ b: ...withDecodingDefault(Effect.succeed("1")) }).pipe(Schema.withDecodingDefault(Effect.succeed({})))` decodes `{}` to `{ a: { b: 1 } }`.
- **Manual defaults** (for example null becomes a default):

  ```ts
  Schema.decodeTo(Schema.FiniteFromString, {
    decode: SchemaGetter.transformOptional((oe) =>
      oe.pipe(Option.filter(Predicate.isNotNull), Option.orElseSome(() => "1"))),
    encode: SchemaGetter.passthrough()
  })
  ```

- **Constructor defaults** (`withConstructorDefault`) are a different thing, applied by `make`; see [SCHEMA-CLASSES.md](SCHEMA-CLASSES.md).

## Excess keys and index signatures

- **Unexpected keys are stripped silently by default** (`{"a":1,"b":2}` decodes to `{ a: 1 }`). Pass the parse option `{ onExcessProperty: "error" }` to reject them (`Expected no excess property at ["email"]`); customize with `.annotate({ messageUnexpectedKey: "Custom message" })`. Non-enumerable own properties such as `Error#stack` are ignored.
- **Keep extra keys by modelling them** with `Schema.Record` or `Schema.StructWithRest`:

  ```ts
  Schema.StructWithRest(Schema.Struct({ a: Schema.Number }), [Schema.Record(Schema.String, Schema.Number)])
  // { readonly [x: string]: number; readonly a: number }
  ```

  Filters on either side are preserved. The base must have an object-shaped encoded type; whole-object transformations are unsupported. For JSON strings wrap the finished schema: `Schema.fromJsonString(Schema.StructWithRest(base, records), { space: 2 })`. Make the rest mutable with `Schema.mutableKey` on the record value.

## Deriving structs

- **Derive with `.mapFields(...)` and the `Struct` module:** `Struct.pick(["a"])`, `Struct.omit(["b"])`, `Struct.assign({ c: Schema.Boolean })` (or `.pipe(Schema.fieldsAssign({ c: Schema.Boolean }))`), `Struct.evolve({ a: (field) => Schema.optionalKey(field) })`, `Struct.map(Schema.optionalKey)` (all optional), `Struct.map(Schema.requiredKey)`, `Struct.mapPick(["a", "c"], Schema.optionalKey)`, `Struct.mapOmit(["b"], Schema.optionalKey)`, `Struct.evolveKeys({ a: (key) => String.toUpperCase(key) })`, `Struct.renameKeys({ a: "A" })`, `Struct.evolveEntries({ a: (key, value) => [String.toUpperCase(key), Schema.optionalKey(value)] })`. Works on `Schema.Opaque` structs too (`A.mapFields(...)`).
- **`mapFields` drops the original struct's checks.** `{ unsafePreserveChecks: true }` keeps them; it is unsafe because the refinements may no longer hold on the new shape.

## Tuples, arrays, records

- **Tuples:** `Schema.Tuple([...])`; rest elements with `Schema.TupleWithRest(Schema.Tuple([Schema.FiniteFromString, Schema.String]), [Schema.Boolean, Schema.String])`, giving `readonly [number, string, ...boolean[], string]`. Annotate elements with `annotateKey({ messageMissingKey })`.
- **Derive tuples with `.mapElements(...)`:** `Tuple.pick([0, 2])`, `Tuple.omit([1])`, `Tuple.appendElement`, `Tuple.appendElements`, `Tuple.evolve([(v) => Schema.NullOr(v), undefined, ...])`, `Tuple.map(Schema.NullOr)`, `Tuple.mapPick`, `Tuple.mapOmit`, `Tuple.renameIndices(["1", "0"])`.
- **Arrays and tuples are readonly by default;** `Schema.mutable` makes them mutable. It does not support an encoding attached directly to the array or tuple, so apply it before adding one.
- **`Schema.UniqueArray(Schema.String)`** is `Schema.Array` plus `Schema.isUnique` with `ToEquivalence.make(item)`; error "Expected an array with unique items".
- **`Schema.Record(key, value)`:** the key schema selects which own properties belong to the record; unselected ones are ignored (key `Schema.String.check(Schema.isPattern(/^a/))`). Number keys: `Schema.Record(Schema.Int, Schema.String)` decodes `{ 1.1: "ignored" }` to `Success({})`. Literal keys: `Schema.Record(Schema.Literals(["a", "b"]), Schema.Number)` makes `a` and `b` required; use `Schema.optional(Schema.Number)` for optional. Records are readonly; make them mutable with `Schema.mutableKey` on the value.
- **Key transformations work:** `Schema.Record(Schema.String.pipe(Schema.decode(SchemaTransformation.snakeToCamel())), Schema.Number)` decodes `{ a_b: 1 }` to `{ aB: 1 }`; selection uses the encoded names. When two keys collide after the transform, the later selected one wins sequentially; with concurrency above 1, completion order decides. Some docs say Record key transformations throw `Unsupported key schema`; the source and its tests support them.

## Unions

- **Unions are inclusive and ordered:** members are tried in order and the first match wins. Put the more specific member first: with overlapping structs, `Schema.Union([Member1, Member2])` decodes `{ a: "a", b: 12 }` as `{ a: 'a' }` because the first member matches and strips `b`.
- **Incompatible members are excluded from the message:** `Schema.Union([Schema.NonEmptyString, Schema.Number])` on `""` reports "Expected a value with a length of at least 1"; on `null`, "Expected string | number". `Schema.Literals(["a","b"])` on null gives one message, `Expected "a" | "b"`.
- **Exclusive unions:** `Schema.Union([...], { mode: "oneOf" })` matches only when exactly one member matches ("Expected exactly one member to match").
- **Derive with `.mapMembers(...)`** (`Tuple.appendElement`, `Tuple.appendElements`, `Tuple.evolve`, `Tuple.map(Schema.Array)`), also on `Schema.Literals(...)`, for example turning literals into tagged structs.
- **Tagged unions:** `Schema.TaggedUnion({ A: { a: Schema.String }, B: { b: Schema.Finite } })` equals a `Schema.Union` of `Schema.TaggedStruct`s, with tag helpers built in.
- **`Schema.toTaggedUnion("type")`** adds the same helpers to any union discriminated by a field you choose, without changing the schema (works on external and nested unions). Each member needs a unique discriminant: overlaps fail to compile, duplicates throw at runtime, and `1` and `"1"` count as duplicates. When the tag is `_tag`, use `Schema.TaggedUnion`.

  ```ts
  const tagged = original.pipe(Schema.toTaggedUnion("type"))
  tagged.cases.A                          // member schema
  Schema.Literals(tagged.discriminants)   // Schema.Literals<readonly ["A","B","C"]>
  tagged.isAnyOf(["A", "B"])(value)       // boolean
  tagged.guards.A(value)                  // type guard
  tagged.match({ A: (a) => ..., B: (b) => ..., C: (c) => ... })(value)
  ```

## Recursive schemas

- **Use `Schema.suspend(() => ...)`;** the reference resolves lazily during decode and encode. Annotate the declaration explicitly with `Schema.Codec<...>`: without it TypeScript often cannot stabilize the self-referential type and reports implicit `any`.

  ```ts
  interface Category { readonly name: string; readonly children: ReadonlyArray<Category> }
  const Category: Schema.Codec<Category> = Schema.Struct({
    name: Schema.String,
    children: Schema.Array(Schema.suspend((): Schema.Codec<Category> => Category))
  })
  ```

- **When encoded differs from type, give both parameters:** `Schema.Codec<Category, CategoryEncoded>` (for example `name: Schema.FiniteFromString`). `Schema.Codec<Category>` alone forces both sides equal.
- **Mutual recursion in a union:** factor the edge into one shared `const URef = Schema.suspend((): Schema.Codec<U> => U)`, reuse it across members, and declare `const U: Schema.Codec<U> = Schema.Union([A, B])`.
- Recursive opaque structs and classes are in [SCHEMA-CLASSES.md](SCHEMA-CLASSES.md).

## Custom types

- **`instanceOf` for plain class checks:** `Schema.instanceOf(URL)`.
- **`Schema.declare<T>(is, annotations?)`** for anything else; the guard returning true is success. The default error is `Expected <Declaration>`; `{ expected: "URL" }` gives "Expected URL".
- **Give declarations a JSON form.** They default to `Schema.Json` as the encoded side in `Schema.toCodecJson`, so encoding a URL fails with "Expected JSON value" until you add a `toCodecJson` annotation that returns a link:

  ```ts
  toCodecJson: () =>
    Schema.link<globalThis.URL>()(
      Schema.String,
      SchemaTransformation.transformEffect<URL, string>({
        decode: (s, options) => Effect.try({
          try: () => new URL(s),
          catch: () => new SchemaIssue.InvalidValue({ message: "Invalid URL string" }, s, options)
        }),
        encode: (url) => Effect.succeed(url.href)
      })
    )
  ```

  Link transformations may be async, may fail and may use optional services, but cannot require services the input schema does not declare. The same annotation drives JSON Schema output; see [SCHEMA-INTEGRATIONS.md](SCHEMA-INTEGRATIONS.md).
- **Parametric types (`Box<A>`) use `Schema.declareConstructor<Type, Encoded>()(typeParameters, run, annotations)`;** `run` receives the resolved codecs and returns `(input, ast, options) => Effect<T, Issue>`. Use it only when the container shape is the same on both sides; for `T -> Box<T>`, declare `Box` and add a separate transformation. The codec can require only the services its type-parameter schemas already require.

  ```ts
  const Box = <A extends Schema.Top>(item: A) =>
    Schema.declareConstructor<Box<A["Type"]>, Box<A["Encoded"]>>()(
      [item],
      ([itemCodec]) => (u, ast, options) => {
        if (!isBox(u)) return Effect.fail(new SchemaIssue.InvalidType(ast, u, options))
        return Effect.mapBothEager(SchemaParser.decodeUnknownEffect(itemCodec)(u.value, options), {
          onSuccess: (value) => ({ value }),
          onFailure: (issue) => new SchemaIssue.Pointer(["value"], issue)
        })
      }
    )
  ```

## Filters and refinements

- **Add filters with `.check(...)`** (or `Schema.check`); a filter does not change the schema's type, so `.fields` and `.make` remain and `Schema.String.check(Schema.isNonEmpty())` is still `Schema.String`. Filters are reusable values: `Schema.isMinLength(3)` works on strings, arrays or anything with `length`; pass several with `.check(a, b)`.
- **Custom filters:** `Schema.makeFilter(predicate, annotations?)`; the default message is `Expected <filter>`. The predicate may return a string to become the message:

  ```ts
  Schema.makeFilter((s) => s.length >= 3 || `length must be >= 3, got ${s.length}`,
    { title: "length >= 3", description: "..." })
  ```

- **`Schema.FilterOutput`:** `undefined` or `true` is success; `false` a generic failure; a `string` the message; a `SchemaIssue.Issue` is used as is; `{ path, issue }` fails at a nested path; a `ReadonlyArray<FilterIssue>` reports several (empty is success, one is unwrapped, many become `Issue.Composite`).
- **Cross-field checks** go on the struct:

  ```ts
  Schema.Struct({ password, confirmPassword }).check(Schema.makeFilter((o) =>
    o.password === o.confirmPassword
      ? undefined
      : { path: ["password"], issue: "password and confirmPassword must match" }))
  ```

- **Filter factories** return `Schema.makeFilter<T>(pred, { title, description, ...annotations })` and take `annotations?: Schema.Annotations.Filter`. Group filters with `Schema.makeFilterGroup([Schema.isInt(), Schema.isBetween({ minimum: -2147483648, maximum: 2147483647 })], { title: "isInt32", description: "a 32-bit integer" })`.
- **Report all failures** with the parse option `{ errors: "all" }`; stop on one with `Schema.isMinLength(3).abort()`.
- **Structural filters run last:** `isMinLength`/`isMaxLength` on arrays, `isMinSize`/`isMaxSize`, `isMinProperties`/`isMaxProperties` run only after the value and its nested values parse; if a nested value fails they are skipped, even with `{ errors: "all" }`.
- **Filters passed to `.check` must be synchronous.** For async or service-based validation use `SchemaGetter.checkEffect` inside a transformation:

  ```ts
  const schema = Schema.Finite.pipe(
    Schema.decode({
      decode: SchemaGetter.checkEffect((n, options) =>
        Effect.gen(function*() {
          const user = yield* Effect.result(myapi(n))
          return Result.isFailure(user)
            ? new SchemaIssue.InvalidValue({ message: "not found" }, n, options)
            : undefined
        })
      ),
      encode: SchemaGetter.passthrough()
    })
  )
  ```

- **Narrow the type with `Schema.refine`:** `Schema.refine((arr): arr is readonly [string, string, ...Array<string>] => arr.length >= 2)`. To change the type in other ways, use a brand.

## Brands

- **`Schema.brand("UserId")` is type-only:** a nominal distinction that adds no runtime validation or metadata to the AST. The identifier must be one concrete string literal; apply it once per identifier for several brands. `SchemaRepresentation` does not keep brands, so reapply them after rebuilding or codegen.
- **Validate with `Schema.fromBrand`,** which reuses the checks of a `Brand.Constructor` (exactly one concrete brand key, and the identifier must match). Compose by applying it once per constructor; use `Schema.Union` for alternatives; with a string enum brand key, pass the enum member.

  ```ts
  type Int = number & Brand.Brand<"Int">
  const Int = Brand.check<Int>(Schema.isInt())
  type Positive = number & Brand.Brand<"Positive">
  const Positive = Brand.check<Positive>(Schema.isGreaterThan(0))
  const PositiveInt = Schema.Number.pipe(Schema.fromBrand("Int", Int), Schema.fromBrand("Positive", Positive))
  ```

- **Brands outside Schema:** `Brand.nominal<UserId>()` (no validation); `` Brand.make<Int>((n) => Number.isInteger(n) || `Expected ${n} to be an integer`) `` throws `BrandError`, with `option`, `result` and `is` alternatives.

## Recognising v3 Schema code

Port each name to the v4 form; search the migration reference for anything not listed.

- **Variadic to array:** v3 `Literal("a","b")` is `Literals(["a","b"])`; `Union(A, B)` is `Union([A, B])`; `Tuple(A, B)` is `Tuple([A, B])`; `TemplateLiteral(A, B)` is `TemplateLiteral([A, B])`; `Record({ key, value })` is `Record(key, value)`; `Literal(null)` is `Null`.
- **`FromSelf` dropped:** v3 `DateFromSelf`, `OptionFromSelf`, `DurationFromSelf`, `BigIntFromSelf`, `URLFromSelf`, `RedactedFromSelf` are `Date`, `Option`, `Duration`, `BigInt`, `URL`, `Redacted`; v3 `Redacted` is `RedactedFromValue`; `EitherFromSelf` is `Result`; `DateFromNumber` is `DateFromMillis`.
- **Filters:** v3 `filter(predicate)` is `check(makeFilter(predicate))`; `filter(refinement)` is `refine(refinement)`; `filterEffect` is `Schema.decode({ decode: SchemaGetter.checkEffect(...), encode: SchemaGetter.passthrough() })`; `pattern` is `check(isPattern(...))`. Filters gained an `is` prefix (`greaterThan` is `isGreaterThan`, `between` is `isBetween`, `int` is `isInt`, `minLength` is `isMinLength`, `length` is `isBetweenLength`). `positive`, `negative`, `nonNegative`, `nonPositive` are gone.
- **Struct operations:** v3 `pick`/`omit` are `mapFields(Struct.pick/omit([...]))`; `partial` is `mapFields(Struct.map(Schema.optional))`; `partialWith({ exact: true })` is `Struct.map(Schema.optionalKey)`; `required` is `mapFields(Struct.map(Schema.requiredKey))`; `extend(structB)` is `Struct.assign` or `fieldsAssign`; extending a union is `mapMembers(Tuple.map(Schema.fieldsAssign({...})))`; `rename` is `encodeKeys`; `attachPropertySignature` is `tagDefaultOmit`.
- **`optionalWith`:** `{ exact: true }` is `optionalKey`; `{ default }` is `withDecodingDefaultType(Effect.succeed(...))`; `{ exact, default }` is `withDecodingDefaultTypeKey`; nullable variants are `optional`/`optionalKey` of `NullOr(schema)` plus `decodeTo` with `Option.filter(Predicate.isNotNull)` (and `Option.orElseSome` for a default, `encode: SchemaGetter.required()`). `optionalToOptional`, `optionalToRequired`, `requiredToOptional` are `decodeTo` with `SchemaGetter.transformOptional`.
- **Other names:** v3 `asSchema` is `revealCodec`; `encodedSchema` is `toEncoded`; `typeSchema` is `toType`; `annotations` is `annotate`; `NonEmptyTrimmedString` is `Schema.Trimmed.check(Schema.isNonEmpty())`; `Capitalize` is `Schema.String.pipe(Schema.decodeTo(Schema.String.check(Schema.isCapitalized()), SchemaTransformation.capitalize()))`; `split` becomes a custom `decodeTo(Schema.Array(Schema.String), transform)`.
- **Removed without a direct twin:** `keyof`, `NonEmptyArrayEnsure`, `withDefaults`, and `Data(schema)` (in v4 `Equal.equals` compares structurally by default).

## Anti-patterns

- **Parsing untrusted data with predicates or hand-written checks.** Use a schema.
- **Annotating or returning `Schema.Codec`, `Schema.Schema` or `Schema.Top`.** Use them as generic constraints; only recursive declarations take an explicit `Schema.Codec<T, E>`.
- **Async or effectful filters in `.check`.** Use `SchemaGetter.checkEffect`.
- **Treating `Schema.brand` as validation.** It is type-only; use `Schema.fromBrand` or checks.
- **Expecting `mapFields` to keep checks.** It drops them; `unsafePreserveChecks: true` is unsafe.
- **Relying on default excess-key behavior to catch typos.** It strips silently; use `onExcessProperty: "error"`.
- **Putting a general union member before a specific one.** The first match wins and strips the rest.
- **Reusing a discriminant across members** of `toTaggedUnion`, including `1` and `"1"`.
- **Expecting v4 `Schema.Date` to decode ISO strings.** Use `Schema.DateFromString`.

## Prove it

The project type-checks with `strict: true`. Every boundary that receives untrusted data decodes it with a schema rather than a predicate. Tests decode a valid value, a value with an extra key (stripped, or rejected under `onExcessProperty: "error"`), a missing required key (the `messageMissingKey` text when set), and a value that breaks each filter (the expected message, every failure listed under `{ errors: "all" }`). Recursive schemas carry an explicit `Schema.Codec<...>` annotation, and no exported function or constant is annotated with a wide `Schema.Codec`.
