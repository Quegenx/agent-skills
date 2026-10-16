# Schema decoding, transformations and errors

**Contents:** [Decoding and encoding APIs](#decoding-and-encoding-apis) · [SchemaError](#schemaerror) · [Parse options](#parse-options) · [Transformations](#transformations) · [Optional keys in transformations](#optional-keys-in-transformations) · [Services in decoding](#services-in-decoding) · [Flipping and projections](#flipping-and-projections) · [Fallbacks](#fallbacks) · [Serialization formats](#serialization-formats) · [Canonical codecs](#canonical-codecs) · [Effect data types](#effect-data-types) · [Error messages](#error-messages) · [Error formatters and Standard Schema](#error-formatters-and-standard-schema) · [Compilers](#compilers) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

How Effect v4 Schema runs: the decode and encode entry points, transformations between schemas, the canonical JSON and string codecs, and how failures are reported. Defining schemas is [SCHEMA.md](SCHEMA.md).

## Decoding and encoding APIs

| Returns | Decode (unknown input / typed `Encoded` input) | Encode |
|---|---|---|
| `Effect<Type, SchemaError, RD>` | `decodeUnknownEffect` / `decodeEffect` | `encodeUnknownEffect` / `encodeEffect` |
| `Exit<Type, SchemaError>` | `decodeUnknownExit` / `decodeExit` | `encodeUnknownExit` / `encodeExit` |
| `Option` | `decodeUnknownOption` / `decodeOption` | `encodeUnknownOption` / `encodeOption` |
| `Result<Type, SchemaError>` | `decodeUnknownResult` / `decodeResult` | `encodeUnknownResult` / `encodeResult` |
| `Promise` | `decodeUnknownPromise` / `decodePromise` | `encodeUnknownPromise` / `encodePromise` |
| value, throws `SchemaError` | `decodeUnknownSync` / `decodeSync` | `encodeUnknownSync` / `encodeSync` |

- **Build parsers once at module level and reuse them at the edges,** not per request: `export const decodeUser = Schema.decodeUnknownEffect(User)`.
- **Inside Effect code use the Effect variants,** so validation errors stay typed in the error channel. Prefer `decodeEffect` when the input is already typed as the schema's `Encoded`.
- **Sync, Exit, Option, Result and Promise variants need a service-free schema** (constraint `ConstraintDecoder<unknown>`); the Effect variants accept any. Async transformations also cannot run in the Sync, Option, Result or Exit interpreters (`Schema.decodeUnknownExit(asyncSchema)` fails); use `decodeUnknownEffect` or `decodeUnknownPromise`.
- **Non-schema failures leak differently per variant:** Exit wraps schema issues as `SchemaError` and leaves defects and interruptions in the Cause; Result, Option and `is` convert only causes made entirely of schema issues and otherwise throw; Sync and Promise may throw or reject with a runtime failure instead of a `SchemaError`.
- **Options** can be passed when creating the decoder or when applying it; application options override creation options.
- **Guards:** `Schema.is(schema)(u)` and `Schema.asserts(schema, input)` check the decoded type `T` only. `asserts` throws an `Error` with the generic message `"Schema validation failed"` and the `SchemaIssue.Issue` in its `cause`; format it with `SchemaIssue.makeFormatterDefault()`. v3 wrote `asserts(schema)(input)`.
- **To validate a value that is already decoded,** decode against its type side: `Schema.decodeSync(Schema.toType(schema))` (v3 called this `validate*`).
- **`SchemaParser.*` has the same adapter names but fails with `SchemaIssue.Issue` directly;** its Promise and Sync adapters reject or throw an `Error` whose `cause` is the `Issue`. `SchemaParser` also has `makeEffect`, `makeOption`, `make`.
- **v3 names:** `decodeUnknown` is now `decodeUnknownEffect`, `decode` is `decodeEffect`, `decodeUnknownEither` is `decodeUnknownExit`, `decodeEither` is `decodeExit`, and the same for encode. `decodeUnknownResult` is the Result analogue of the old Either.
- **A round trip `decode(encode(value))` should approximate `value`,** but it is not guaranteed.

## SchemaError

- **`class SchemaError extends Data.TaggedError("SchemaError")<{ readonly issue: SchemaIssue.Issue }>`.** Catch it with `Effect.catchTag("SchemaError", ...)`; narrow unknowns with `Schema.isSchemaError(u)`.
- **`message`** renders `issue` with the default formatter (`Schema.decodeUnknownResult(Schema.Number)("not a number")` fails with `"Expected number"`); `toString()` is `SchemaError(${message})`; `toJSON()` is `{ _tag, message }`.
- **`Schema.decodeUnknownSync` throws a `SchemaError`; read `error.issue`, not `error.cause`.** The `Error` with an Issue in `cause` comes from `SchemaParser.decodeUnknownSync`. The migration guide's formatter example reads `error.cause` from `Schema.decodeUnknownSync`; that example is wrong.

## Parse options

- **`errors?: "first" | "all"`** (default `"first"`). `"all"` evaluates every filter and reports every issue.
- **`onExcessProperty?: "ignore" | "error"`** (default `"ignore"`, which strips unspecified properties).
- **`disableChecks?: boolean`** disables checks while still applying defaults and transformations.
- **`reportInput: true`** keeps the rejected input in issues (see [Error messages](#error-messages)).
- **`concurrency`** has `Effect.forEach` semantics (`undefined` or `1` sequential, a number bounds it, `"unbounded"`). It applies independently at every nested tuple, array, struct, record and struct-with-rest; union members stay sequential. Results keep their positions; `errors: "first"` interrupts the remaining children and `errors: "all"` accumulates.

  ```ts
  Schema.decodeUnknownEffect(Schema.Array(item))(["a", "b", "c"], { concurrency: 2 })
  ```

- **Parse options apply to the whole operation;** schema annotations do not override them for nested schemas.

## Transformations

- **Transformations are standalone reusable values** (v3 embedded them: `transform(String, Trimmed, {...})`). `Transformation<T, E, RD, RE>` holds two getters, `decode: Getter<T, E, RD>` and `encode: Getter<E, T, RE>`. Getter kinds: `Transform`, `TransformOptional` (handles a missing value through `Option`), `TransformEffect`, `TransformOptionalEffect`, `Passthrough`. Build with `SchemaGetter.map` and `SchemaGetter.compose`; `SchemaGetter.run` executes a getter and always returns an Effect.

  ```ts
  // what SchemaTransformation.trim() is
  new SchemaTransformation.Transformation(SchemaGetter.trim(), SchemaGetter.passthrough())
  ```

- **Same schema on both sides:** `Schema.String.pipe(Schema.decode(SchemaTransformation.trim()))` (inverse `Schema.encode`). Compose transformations with `SchemaTransformation.composeTransformation(SchemaTransformation.trim(), SchemaTransformation.toLowerCase())`.
- **Different schemas:** `Schema.decodeTo(target, transformation?)` (inverse `Schema.encodeTo`). Without a transformation it is schema composition: `KilometersFromMeters.pipe(Schema.decodeTo(MilesFromKilometers))`, which does not require the types to line up. v3 called it `compose`.
- **Inline transformations:**

  ```ts
  SchemaTransformation.transform({ decode: (meters) => meters / 1000, encode: (km) => km * 1000 })

  // fallible, target Schema.instanceOf(URL)
  SchemaTransformation.transformEffect({
    decode: (s, options) => Effect.try({
      try: () => new URL(s),
      catch: () => new SchemaIssue.InvalidValue({ message: "Invalid URL string" }, s, options)
    }),
    encode: (url) => Effect.succeed(url.href)
  })
  ```

  v3 `transform(from, to, {...})` is `from.pipe(decodeTo(to, SchemaTransformation.transform({...})))`; v3 `transformOrFail` is `decodeTo(to, { decode: SchemaGetter.transformEffect(...), encode: ... })` failing with `new SchemaIssue.InvalidValue()` (renamed `transformEffect` for clarity).
- **Literal mappings:** `Schema.Literal(0).transform("a")`; `Schema.Literals([0, 1, 2]).transform(["a", "b", "c"])` (v3 `transformLiteral`, `transformLiterals`).
- **`SchemaTransformation.numberFromString` does not validate:** `Schema.String.pipe(Schema.decodeTo(Schema.Number, SchemaTransformation.numberFromString))` decodes `"a"` to `NaN`. Use `Schema.FiniteFromString` or `NumberFromString` with validation.
- **Passthrough helpers** for composition when types need help: `SchemaTransformation.passthrough()` when `To.Encoded === From.Type`; `passthroughSubtype()` when `From.Type` extends `To.Encoded`; `passthroughSupertype()` when `To.Encoded` extends `From.Type`; `passthrough({ strict: false })` when neither does.
- **Coercion from unknown:** `Schema.Unknown.pipe(Schema.decodeTo(Schema.String, { decode: Getter.String(), encode: Getter.passthrough() }))` turns `42` into `"42"` and `null` into `"null"`.
- **Array targets:** when the source already decodes elements, use `Schema.toType` on the target to avoid double decoding.
- **One-way transformations:** `encode: SchemaGetter.forbidden(() => "A SHA-256 digest cannot be encoded as its source.")` reports the restriction as a schema issue.

## Optional keys in transformations

- **`SchemaTransformation.transformOptional({ decode: (oe: Option<E>) => Option<T>, encode })`:** returning `Option.none()` leaves the key out; `Option.some(v)` includes it.
- **Omit a key on encode:**

  ```ts
  Schema.String.pipe(Schema.encodeTo(Schema.optionalKey(Schema.String), {
    decode: SchemaGetter.withDefault(Effect.succeed("default_value")),
    encode: SchemaGetter.omit()
  }))
  ```

  The encoded side must be `optionalKey`; otherwise `None` on a required field is a `MissingKey` error.
- **`Schema.tagDefaultOmit("MyTag")`** adds the tag on decode when missing and omits it on encode.

## Services in decoding

- **A transformation can use a service;** the service then appears in `DecodingServices`, and you provide it with `Effect.provide(layer)`:

  ```ts
  Schema.decodeTo(PeopleId, {
    decode: SchemaGetter.transformEffect((s) => Effect.gen(function*() {
      const validator = yield* Validation
      // ...
    }).pipe(Effect.mapError((e) => new SchemaIssue.InvalidValue({ message: e.message })))),
    encode: SchemaGetter.passthrough()
  })
  ```

- **Remove a requirement from the codec** with `Schema.middlewareDecoding(Effect.provideService(Service, {...}))`.

## Flipping and projections

- **`Schema.flip(Schema.FiniteFromString)`** decodes a number to a string; `.schema` returns the original and a double flip restores it. `encode(schema)` is `decode(flip(schema))`; every AST operation is symmetrical. A flipped schema's `make` builds values of the original's encoded type.
- **`Schema.toType(schema)`** keeps the decoded side with its checks (`FiniteFromString.check(isGreaterThanOrEqualTo(2))` becomes `Finite.check(...)`); **`Schema.toEncoded(schema)`** keeps the encoded-side checks and drops the decoding path. v3 called them `typeSchema` and `encodedSchema`.

## Fallbacks

- **`Schema.catchDecoding(() => Effect.succeedSome("b"))`** returns a fallback when decoding fails (the Effect has no context); return `Effect.succeedNone` to omit an optional field. v3 called it `decodingFallback`.
- **`Schema.catchDecodingWithContext(...)`** for fallbacks that need services.

## Serialization formats

- **JSON strings:** `Schema.fromJsonString(schema)` parses then decodes, and encodes then stringifies; it fails on invalid JSON or a mismatch. `Schema.fromJsonString(Schema.Unknown)` parses without validating. v3 called it `parseJson`.
- **String encodings:** `Schema.StringFromBase64` (RFC 4648), `StringFromBase64Url`, `StringFromHex`, `StringFromUriComponent`; compose them, for example `Schema.StringFromBase64.pipe(Schema.decodeTo(Schema.fromJsonString(schema)))`. Binary: `Schema.Uint8ArrayFromBase64`, `Uint8ArrayFromBase64Url`, `Uint8ArrayFromHex`. Prefer these over the low-level `SchemaTransformation.stringFromBase64String` family unless you are building a custom pipeline.
- **Forms and query strings:** `Schema.fromFormData(schema)` and `Schema.fromURLSearchParams(schema)` parse into a nested tree with bracket notation (`b[c]`), then decode. Non-string values need `Schema.toCodecStringTree`: `Schema.fromFormData(Schema.toCodecStringTree(Schema.Struct({ a: Schema.Int })))` gives `{ a: 1 }`.
- **XML:** `Schema.toEncoderXml(schema)` returns `(t) => Effect<string, Schema.SchemaError, never>`; it uses `toCodecStringTree` internally and encodes custom types as `undefined`.

## Canonical codecs

- **Why:** a `Date` does not round-trip through `JSON.parse`; `Uint8Array`, `ReadonlyMap` and `ReadonlySet` stringify to `{}`; `Symbol` and `BigInt` throw; custom classes, `Option` and `Result` are unknown to JSON.
- **`Schema.toCodecJson(schema)`** walks the AST, replaces non-JSON types using their `toCodecJson` annotations, and composes recursively. Derivation does not run transformations. When it adds a transformation for a node, that node's checks and annotations stay on the source node and still run. It preserves the input schema's requirements.
- **Explicit encodings win:** a `Schema.Date.pipe(Schema.encodeTo(Schema.Number, transform(...)))` field encodes to epoch millis while a plain `Schema.Date` field encodes to an ISO string.
- **`Schema.instanceOf(Point)` without an annotation** fails: `toCodecJson` encode says "Expected JSON value", decode says "Expected <Declaration>", and the JSON Schema is empty. With a `toCodecJson` link to `Schema.Tuple([Schema.Finite, Schema.Finite])` it encodes to `[1,2]`, and the same annotation drives the JSON Schema (an array with `prefixItems`, `minItems: 2`, `maxItems: 2`).
- **`Schema.toCodecStringTree(schema)`** makes every leaf a string (`[ '1', '2' ]` where JSON gives `[1, 2]`), for `StringTree = string | undefined | { readonly [key: string]: StringTree } | ReadonlyArray<StringTree>`. It preserves requirements.
- **`Schema.toCodecIso(Person)`** converts a class to and from its plain struct form, mainly for optics; it declares no requirements.
- **`Schema.toCodecGoJson(schema)`** (unstable) is `toCodecJson` plus decoding leniency: an optional key's `null` becomes missing, a required array's `null` becomes `[]`, a required record's `null` becomes `{}` (not tuples, non-empty arrays or structs). Encoding is unchanged. Use `toCodecJson` with explicit nullable schemas when nil versus empty matters.

## Effect data types

- **Option:** `Schema.Option(value)`; the optional-field forms are in [SCHEMA.md](SCHEMA.md).
- **Result:** `Schema.Result(success, failure)` encodes to JSON as `{ _tag: "Success", success }` or `{ _tag: "Failure", failure }`.
- **Duration:** `Duration`, `DurationFromString`, `DurationFromMillis`, `DurationFromNanos`; JSON form `{ _tag: "Millis", value: 2000 }`.
- **Redacted:** `Schema.Redacted(value)` validates an existing `Redacted`; `Schema.RedactedFromValue(Schema.Trim)` wraps raw input. **The default JSON form of `Schema.Redacted(value)` exposes the inner value;** set `Schema.Redacted(Schema.String, { label: "Secret", disallowJsonEncode: true })` so JSON encoding fails instead.

## Error messages

- **Default labels:** a type failure uses the schema's `identifier`; a filter failure uses the filter's `message`, then `expected`, then `<filter>`. An identifier never names a failed filter: `Schema.NonEmptyString.annotate({ identifier: "Username" })` reports "Expected Username" for `null` and "Expected a value with a length of at least 1" for `""`. A check runs only after the base schema accepts the input.
- **Set messages inline:** `.annotate({ message })` for an invalid type, `.annotateKey({ messageMissingKey })` (also pipeable as `Schema.annotateKey(...)`), `.check(Schema.isNonEmpty({ message }))`, `Schema.isNonEmpty({ expected: "a non-empty name" })`, and a struct-level `.annotate({ message })`. Messages are strings or functions returning strings. Annotating a schema after `.check(...)` targets its last check.
- **Rejected input is not kept by default.** `{ reportInput: true }` keeps it: `SchemaParser.decodeUnknownResult(Schema.String)(1, { reportInput: true })` formats as "Expected string, got 1". Test for it with `SchemaIssue.hasInput(issue)`, not `issue.input !== undefined`. It can retain and disclose secrets, PII and large object graphs through `SchemaError.message`, the formatter and Standard Schema messages. Custom issues honour it only when built as `new SchemaIssue.InvalidValue(annotations, input, options)`.

## Error formatters and Standard Schema

- **`Schema.toStandardSchemaV1(schema, { leafHook?, checkHook?, parseOptions? })`** returns `StandardSchemaV1<Encoded, Type> & S`, with issues `{ message: string; path: ReadonlyArray<PropertyKey> }`. It requires `DecodingServices` of `never`; `validate` is synchronous unless the schema has async parts, then it returns a Promise. Defects become one issue without a `path`; the vendor is `"effect"`. v3 called it `standardSchemaV1`. `Schema.toStandardJSONSchemaV1(schema)` is experimental.
- **Hooks:** `SchemaIssue.makeFormatterStandardSchemaV1({ leafHook, checkHook })`. `LeafHook` handles `InvalidType`, `InvalidValue`, `MissingKey`, `UnexpectedKey`, `Forbidden`, `OneOf`; `CheckHook` handles `Check` issues from filters and refinements (read `issue.filter.annotations?.meta`, for example `meta._tag === "isMinLength"` and `meta.minLength`). The default hooks are for demos; hooks are required by design to keep bundles small. Default output looks like `{ path: ['a'], message: 'Missing key' }`. A schema `message` annotation beats any hook, which is how i18n plugs in.
- **Flatten issues** (v3 `ParseResult.ArrayFormatter`): `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues`.
- **Send a failure over the wire:**

  ```ts
  Schema.encodeSync(Schema.toCodecJson(Schema.StandardSchemaV1FailureResult))(
    SchemaIssue.makeFormatterStandardSchemaV1()(issue))
  ```

  Symbol keys print as `'Symbol(b)'`.
- **Pretty-print values** with `Schema.toFormatter` (v3 `pretty`) and override with `overrideToFormatter`.

## Compilers

Experimental; measure them against your own schemas before enabling them in production.

- **JIT:** `import "effect/schema/SchemaJITCompiler/enable"` at startup, or `SchemaJITCompiler.enable(schema.ast)` for one AST. Importing `SchemaJITCompiler` alone does not enable it. If dynamic function construction is blocked or compilation fails, the interpreter keeps running.
- **AOT:** `SchemaAOTCompiler.compile([{ ast: User.ast, operations: ["decode"] }, { ast: SchemaAST.toType(User.ast), operations: ["is", "make"] }])` generates a module exporting `install(asts)`, called with the ASTs in the same order; it works where `new Function` is forbidden. Target `SchemaAST.toType(schema.ast)` for `is` and `make`, and `SchemaAST.flip(schema.ast)` with `decode` for encoding. `build({ modules, baseUrl: import.meta.url, outFile })` from `effect/schema/SchemaAOTCompiler/Build` writes a self-installing module through `FileSystem`; it prepares decoding by default, so request `encode`, `is`, `make` explicitly. Regenerate when schemas or the Effect version change. AOT does not evaluate `Suspend` thunks at build time.
- **Keep checks and property getters deterministic and side-effect free;** proxy inputs and modified built-ins are unsupported by the optimization.

## Anti-patterns

- **Building a decoder inside a request handler.** Create it once at module level.
- **Sync, Exit, Result, Option or Promise variants inside Effect code,** or on schemas with services or async transformations. Use the Effect variants.
- **Reading `error.cause` from `Schema.decodeUnknownSync`.** It throws a `SchemaError`; read `.issue`.
- **`SchemaTransformation.numberFromString` alone** for untrusted numbers (it yields `NaN`).
- **`SchemaGetter.omit()` against a required encoded key.**
- **`reportInput: true` on data that may hold secrets or PII.**
- **`Schema.Redacted` encoded to JSON without `disallowJsonEncode: true`.**
- **`instanceOf` or `declare` without a `toCodecJson` annotation** on anything that crosses a JSON boundary.

## Prove it

Every decoder used in a request path is a module-level constant, and Effect code calls only the Effect variants. Tests round-trip each transforming schema (`decode(encode(value))` equals `value` where a round trip is intended), encode each custom type through `Schema.toCodecJson` without "Expected JSON value", decode a bad number string and get a failure rather than `NaN`, and assert that a failure message for a secret field does not contain the input. Any `Redacted` schema that can reach JSON sets `disallowJsonEncode: true`.
