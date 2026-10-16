# Schema integrations

**Contents:** [Annotations](#annotations) · [JSON Schema](#json-schema) · [SchemaRepresentation](#schemarepresentation) · [Equivalence, optics, JSON Patch](#equivalence-optics-json-patch) · [Arbitrary test data](#arbitrary-test-data) · [HTTP (HttpApi)](#http-httpapi) · [RPC](#rpc) · [Config](#config) · [SQL and Model](#sql-and-model) · [Forms and web frameworks](#forms-and-web-frameworks) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

What Effect v4 derives from a schema (metadata, JSON Schema, test data, equivalence) and how HTTP, RPC, Config and SQL consume schemas. Defining schemas is [SCHEMA.md](SCHEMA.md); codecs and errors are [SCHEMA-TRANSFORMS.md](SCHEMA-TRANSFORMS.md). The package also ships `ARBITRARY.md`, `HTTPAPI.md` and `CONFIG.md` (repo `packages/effect/`); read them in chunks for anything below that is not enough.

## Annotations

- **Standard keys** for `annotate` and `annotateEncoded`: `expected`, `title`, `description`, `documentation`, `readOnly`, `writeOnly`, `format`, `contentEncoding`, `contentMediaType`, `contentSchema`, plus `identifier`, `default`, `examples` and the message keys in [SCHEMA-TRANSFORMS.md](SCHEMA-TRANSFORMS.md).
- **`Schema.resolveAnnotations(schema)`:** when the schema has checks, annotations come from the last check, so `.check(Schema.isNonEmpty().annotate({ title: "from check" }))` wins over the base annotations. `Schema.resolveAnnotationsKey(schema)` reads `annotateKey` annotations.
- **Custom annotations through module augmentation:**

  ```ts
  declare module "effect/Schema" {
    namespace Annotations {
      interface Augment { readonly version?: readonly [number, number, number] | undefined }
    }
  }
  ```

- **`.annotate` on a transformation annotates the decoded side.** Output that follows the encoded side (JSON Schema) needs `Schema.annotateEncoded({...})` (for example on `Schema.Trim`), or annotate the source before `Schema.decodeTo(Schema.Trimmed, SchemaTransformation.trim())`.

## JSON Schema

- **`Schema.toJsonSchemaDocument(schema, options?)`** produces draft-2020-12 by default; v3 called it `JSONSchema.make`. It derives the canonical JSON codec first, so prefer it for runtime schemas. The result holds the dialect, the schema, and `definitions` for `$ref`. Examples in the guide print that first key as `dialect` in some places and `source` in others.
- **JSON Schema is preliminary validation; the Effect decoder is the final authority.** Passing JSON Schema validation does not guarantee decoding succeeds. Known differences: Unicode code-point versus UTF-16 length, RegExp flags, property checks before versus after decoding.
- **Options:** `referencePolicy`, `onExcessProperty`, `generateDescriptions`, `includeAnnotationKey`. The default `"ignore"` emits `additionalProperties: true`; pass `{ onExcessProperty: "error" }` to both the generator and the decoder to reject unknown keys (`additionalProperties: false`).
- **JSON Schema follows the encoded side.** Standard metadata comes from `.annotate`: `title`, `description`, `default`, `examples`, `readOnly`, `writeOnly`. Checks and annotations on the source side of a generated transformation do not appear; put metadata on an explicit JSON target.
- **Mappings:** `optionalKey` becomes an optional property; `Schema.optional` and `Schema.UndefinedOr` become an optional property with `anyOf [type, {type: "null"}]`. Filters become `allOf` entries (`{ minLength: 1 }`), and filter annotations attach to their entry (`Schema.isMinLength(1, { description: "description1" })`). `fromJsonString` emits `{ type: "string", contentMediaType: "application/json", contentSchema: {...} }`. A `oneOf` with an approximate branch becomes `anyOf`.
- **References:** an `identifier` creates a `$defs` entry referenced by `$ref`. Recursive schemas always get a reference, with a synthetic name when there is no identifier; some docs say recursive schemas require an identifier.
- **Custom types and checks:** a `toCodecJson` annotation drives both the runtime codec and the JSON Schema (useful for OpenAPI). Check-level `toJsonSchema` callbacks return `schema` (exact) or `[schema, true]` (approximate, may accept more); return `[{}, true]` to omit a constraint, while a bare `{}` declares "no constraint" and is trusted. Filters without `toJsonSchema` count as approximate. Callbacks must not mutate their input or returned fragments. For `Schema.Record(Key, Value)`, `patternProperties` must represent the key check exactly.

  ```ts
  Schema.instanceOf(Headers, {
    toCodecJson: () => Schema.link<Headers>()(
      Schema.Array(Schema.Tuple([Schema.String, Schema.String])),
      { decode: SchemaGetter.transform(...), encode: SchemaGetter.transform((headers) => [...headers.entries()]) })
  })
  ```

- **Draft-07:** `JsonSchema.toDocumentDraft07(Schema.toJsonSchemaDocument(schema))`. Converters throw rather than silently change meaning (draft-07 cannot express dynamic refs, unevaluated constraints, or non-default `minContains`/`maxContains`).

## SchemaRepresentation

- **A representation projects one side of a schema,** the encoded side by default; apply `Schema.toType` first for the decoded side. `Schema.toRepresentation(Schema.NumberFromString).representation._tag` is `"String"`; with `Schema.toType(...)` it is `"Number"`. Transformation functions are not serialized.
- **Data model:** `Representation` (a tagged tree, with `Reference` for named or recursive nodes), `Document` (`representation`, `references`), `MultiDocument` (several roots sharing references).
- **APIs:** `Schema.toRepresentation`, `SchemaRepresentation.toRepresentation(ast)`, `toRepresentations(asts)`, `toJson`/`fromJson` (multi: `toJsonMultiDocument`/`fromJsonMultiDocument`), `fromRepresentation`/`fromRepresentations`, `toJsonSchemaDocument`, `toCodeDocument`, `toMultiDocument`, `toJsonSchemaMultiDocument`, `fromJsonSchemaDocument`.
- **What survives:** brands are absent; refine checks may remain but their narrowed types are lost. Live documents can hold function annotations (`toJsonSchema`, `toCode`); `toJson` drops them along with any annotation holding functions, `undefined`, `bigint`, symbols or cycles. Compile the live document before `toJson`.
- **Persisting custom nodes:** give them a `representation: { id, payload }` annotation (`RepresentationAnnotation { id: string; payload: Schema.Json }`; checks may add `schemas`). An unannotated custom declaration or leaf filter works live, but `toJson` rejects it.
- **Rebuilding:** `fromJson` does not restore callbacks. `SchemaRepresentation.fromRepresentation(document, { revivers: [SchemaRepresentation.isMinLengthReviver] })`; the `revivers` array is required even when empty. Built-ins include `OptionReviver`, `DateReviver`, `isMinLengthReviver`; missing or duplicate ids are errors. Custom revivers: `makeReviverDeclaration`, `makeReviverFilter(id, payloadSchema, ({ annotations, payload }) => ...)`, `makeReviverFilterGroup`.
- **Reference naming:** only nodes with a resolved `identifier` go to `references` by default; recursive schemas always get one (synthetic names like `Objects_`, `Suspend_`); collisions become `Value_1`, `Value_2`. Pass `referencePolicy: ({ ast, occurrences, identifier }) => string | undefined` to change it (occurrences count by identity, not structure); `Schema.toJsonSchemaDocument(schema, options)` and `OpenApi.fromApi(api, options)` forward it.
- **Code generation:** `toCodeDocument(multiDocument)` emits runtime and TypeScript source per root, dependency-sorted, with recursive refs separated for `Schema.suspend`. It takes no revivers; rebuild with `fromRepresentation` first. v3 called this `Schema.format`.
- **Importing JSON Schema:** `SchemaRepresentation.fromJsonSchemaDocument(doc)` returns a runtime `Schema.Top`. It is best-effort, not lossless; it assumes valid draft 2020-12 without meta-validating and follows only `#/$defs/<token>` refs. `{ not: {} }` becomes `Never`; `additionalProperties` true or omitted becomes a `Schema.Json` index signature; `minLength`/`maxLength` count code points (`Schema.isMinCodePoints`/`isMaxCodePoints`); `integer` becomes `Schema.isInt` (safe range). Unsupported: `$dynamicRef`, `contains`, `dependentRequired`, `dependentSchemas`, active `if/then/else`, `unevaluatedItems`, `unevaluatedProperties`, object or array `const`/`enum`. Options include `onEnter` and `includeAnnotationKey` (for example to keep `x-` keys).
- **Imported regex patterns are rejected by default,** because the native engine can block without bound. Use `patterns: "apply"` only for trusted documents; `patterns: "ignore"` skips them.

## Equivalence, optics, JSON Patch

- **`Schema.toEquivalence(schema)`** (v3 `equivalence`). For declarations: `Schema.instanceOf(MyClass, { toEquivalence: () => (x, y) => x.a === y.a })`; override with `.pipe(Schema.overrideToEquivalence(() => Equivalence.make((x, y) => x.a === y.a)))`.
- **`Schema.toIso(B)`** generates an `Iso` instead of `Optic.makeIso` by hand: `iso.key("a").key("s").replace("b", value)`. Also `toIsoSource`, `toIsoFocus`. It consumes `toCodecIso` synchronously, so failing, async or service-dependent transformations can throw "Schema validation failed" with a `SchemaIssue.Issue` in `cause`.
- **`Schema.toDifferJsonPatch(schema)`** gives `differ.diff(old, new)` (RFC 6902 `add`, `remove`, `replace`) and `differ.patch(old, patch)`; it works on classes, encodes through `toCodecJson` synchronously with the same throw caveats, and invalid operations produce `JsonPatch` errors.

## Arbitrary test data

`effect/Arbitrary` (or `Arbitrary` from `effect`), unstable. v3 `Schema.toArbitrary`, `Schema.Arbitrary`, `effect/testing/FastCheck` and the `toArbitrary` annotation are gone; use `Arbitrary.schema(schema)` and `toCodecArbitrary`.

- **Three parts:** the schema says which inputs are allowed, `Arbitrary<A>` generates and shrinks, and `it.prop`, `it.effect.prop` or `Arbitrary.checkEffect` runs the rule.

  ```ts
  const integer = Arbitrary.schema(Schema.Int)
  it.prop("adding zero is identity", [integer], ([value]) => value + 0 === value)
  ```

  Default 100 runs; inputs as an array or a record.
- **Constrain inputs with Schema checks** (`Schema.Int.check(Schema.isBetween({ minimum: -100, maximum: 100 }))`). Bounds, lengths, finite and int, supported regex patterns and uniqueness generate matching values directly; other checks reject after generation. Prefer a check when it can describe the allowed inputs.
- **`Arbitrary.schema` generates decoded `Type` values** (numbers for `NumberFromString`) and throws immediately for unsupported schemas. Recursive schemas need a finite path (`Schema.suspend` plus `isMaxLength`). Declarations resolve through `toCodecArbitrary`, then the built-in representation, then `toCodecJson`, then `toCodec`. A custom `shrink` option exists.

  ```ts
  toCodecArbitrary: () => Schema.link<UserId>()(Schema.Int.check(...), SchemaTransformation.transform({...}))
  ```

  The old `arbitrary` filter annotation is `arbitraryConstraint` (for example `{ order: Order.Number, minimum: 0, exclusiveMinimum: true }`).
- **Combinators:** `Arbitrary.Constant`, `map`, `filter`, `filterMap`, `flatMap`, `all` (tuples or records), `array(item, { minLength?, maxLength })`. Callbacks must be deterministic and pure and must not mutate generated values. Use `Object.hasOwn` on generated records; some lack the `Object` prototype.
- **Sampling:** `Arbitrary.sampleEffect(arb, { count, size, seed })` (defaults count 10, size 10, `maxDiscards` max(100, count*10)) fails with `SampleError` after too many discards.
- **Checking:** `Arbitrary.checkEffect(arb, property, { runs, size, maxDiscards, maxShrinks, seed, replay })` (defaults runs 100, size 10, maxShrinks 100) returns `Passed`, `Falsified` (with a `replay` token and `PropertyError` or `ReturnedFalse`), `Exhausted` or `ReplayMismatch`; defects and interruption propagate. Replay tokens may not survive releases; copy a failing input into a regular test for a permanent regression.
- **`@effect/vitest`:** `it.prop(name, [Schema.Int, Schema.Int], pred, { arbitrary: { runs: 200, seed: "addition" } })`, `it.effect.prop`, `it.live.prop`. fast-check generators are not supported.
- **Limits:** no weighted choice (write targeted scenarios), no parallel runs, no low-level generator constructor.

## HTTP (HttpApi)

- **Schemas first:** path params, query, headers, payloads, responses and errors are all schemas, used to validate requests, serialize responses, generate docs and type the client. Status codes and content types are schema annotations, not endpoint config.
- **Write domain types; the endpoint coerces.** Path, query and header schemas go through `Schema.toCodecStringTree`; JSON payload, success and error schemas through `Schema.toCodecJson`. Use `Schema.Int` directly, with no string or JSON transformation added by hand.
- **Endpoint options:** `params`, `query`, `headers` (a record of fields or a full schema), `payload` (a schema or an array; for GET, a record of schemas read from the query string), `success` (default 200 with no content), `error` (default 500 JSON). Any schema that encodes to `Schema.Void` is "no content".
- **Encodings:** `HttpApiSchema.asJson` (default), `asFormUrlEncoded`, `asText({ contentType })`, `asUint8Array`, `asMultipart`, `asMultipartStream`. Status with `HttpApiSchema.status(404)` or the `httpApiStatus` annotation.
- **Errors with a status:**

  ```ts
  class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {}, { httpApiStatus: 404 }) {}
  ```

  Or a struct: `Schema.Struct({ _tag: Schema.tag("UserNotFound"), message: Schema.String }).pipe(HttpApiSchema.status(404))`, failed with `UserNotFound.make({...})`. Group related errors in a wrapper (`UsersError` with `reason: Schema.Union([UserNotFound, SearchQueryTooShort])`) so services and endpoints don't list too many error types. Bodiless errors: `HttpApiSchema.asNoContent({ decode: () => new UserNotFound() })`. Predefined: `HttpApiError.NotFound`, `Unauthorized` and others, `HttpApiDecodeError` (400, the request did not match the schema), plus `*NoContent` variants.
- **Schema failures:** a request that fails decoding gets an empty 400 and is ignored by error reporters; a response that fails encoding gets an empty 500 and is reported. Both raise `HttpApiSchemaError` with `kind: "Params" | "Headers" | "Query" | "Body" | "Payload" | "ResponseHeaders"` and `cause: Schema.SchemaError`. Customize at endpoint, group or API level:

  ```ts
  HttpApiMiddleware.layerSchemaErrorTransform(SchemaErrorHandler, (schemaError) =>
    Effect.fail(new ValidationError({ message: `Invalid request: ${schemaError.message}` })))
  ```

- **Docs:** `.annotate({ description: "A user", identifier: "User" })` (the identifier lists the schema under Models in Scalar). `OpenApi.fromApi(api, options)` applies `referencePolicy` when extracting components.
- **Query arrays:** `Schema.optionalKey(Schema.Array(Schema.String))` accepts `?a=1&a=2`, one value, or none.
- **Response headers:** `HttpApiSchema.WithHeaders(schema, { "x-total-count": Schema.Int })`, with the handler returning `HttpApiSchema.withHeaders({ body, headers })`; header values are stringified at the boundary. `HttpApiSchema.encodeToWithHeaders({ body: HttpApiSchema.Empty(404), headers: {...} }, { decode, encode })` folds headers into a domain error class.
- **Payload and response variants:** with `Model.Class` (see [SQL and Model](#sql-and-model)), respond with `User.json` and accept `User.jsonCreate` / `User.jsonUpdate`, so clients cannot set generated ids or timestamps. Branded ids: `Schema.String.pipe(Schema.brand("UserId"))`.

## RPC

- **`Rpc.make(tag, { payload?, success?, error?, defect?, stream?, primaryKey? })`** (unstable). `payload` is a schema or struct fields (fields become a `Schema.Struct`). Defaults: `success: Schema.Void`, `error: Schema.Never`, `defect: Schema.Defect()`. `stream: true` wraps success and error in `RpcSchema.Stream(success, error)` and sets the normal error schema to `Schema.Never`. `primaryKey` makes the payload a `Schema.Class` with a `PrimaryKey` derived from it.
- **Serialization:** the `RpcSerialization` service has `codecFor: <S>(schema: S) => Schema.Codec<S["Type"], unknown, ...>`; JSON serializations return `Schema.toCodecJson`, so the encoded side is JSON. Layers: `layerJson`, `layerNdjson`, `layerJsonRpc`, `layerNdJsonRpc`, `layerSchemaBinary`.
- **Cluster entities use the same definitions:** `Rpc.make("Increment", { payload: { amount: Schema.Int }, success: Schema.Int })`; persist messages with `.annotate(ClusterSchema.Persisted, true)`.

## Config

- **`Config.schema(schema, path?)` decodes raw strings into typed values** (`"8080"` to `8080`, `"true"` to `true`):

  ```ts
  const AppConfig = Config.schema(Schema.Struct({ host: Schema.String, port: Schema.Int, debug: Schema.Boolean }))
  AppConfig.parse(provider)
  ```

- **It uses the canonical `Schema.StringTree` codec** and the encoded AST to decide what to load. Opaque encodings (`Schema.Any`, `Schema.Unknown`, `Schema.ObjectKeyword`, `Schema.Json`, `Schema.MutableJson`) are rejected synchronously at construction, even nested; for arbitrary JSON in one value use `Schema.fromJsonString(Schema.Json)`.
- **Lists and maps from one string:** plain `Schema.Array` and `Schema.Record` accept structural input only. Use `Config.Array(Schema.String, "items")` for `"a,b,c"` and `Config.Record(Schema.String, Schema.String, "items")` for `"a=1,b=2"` (options `separator`, `keyValueSeparator`).
- **Absence:** a missing value reaches the decoder as `undefined`, so `Config.schema(Schema.UndefinedOr(Schema.String), "key")` succeeds with `undefined`. If the schema rejects `undefined`, `Config.withDefault` and `Config.option` apply. A struct schema validates one structured input (missing required fields fail); `Config.all` composes independent children.
- **Validation errors are not absence.** `ConfigError` wraps a `SourceError` or a `SchemaError` (check `error.cause._tag === "SchemaError"`). `Config.withDefault` and `Config.option` recover only from absence; use `Config.orElse` for validation errors.
- **There is no public `Config.make`;** start from a constructor or `Config.schema`, then `Config.map`, `mapEffect`, `all`, `orElse`, `withDefault`. `ConfigProvider.constantCase` maps camelCase keys to `SCREAMING_SNAKE_CASE`.

## SQL and Model

- **`Model` (`effect/schema`, unstable) keeps one field declaration as the source of truth** and derives variants for selecting, inserting, updating and JSON. Define domain models with `Model.Class`:

  ```ts
  class Group extends Model.Class<Group>("Group")({
    id: Model.UuidV4Insert(GroupId),
    name: Schema.NonEmptyString,
    slug: Schema.NonEmptyString.pipe(Model.FieldExcept(["update", "jsonUpdate"])),
    notes: Schema.NullOr(Schema.String).pipe(Model.FieldOnly(["select", "insert"])),
    memberCount: Model.Field({ select: Schema.Int, json: Schema.Int }),
    createdAt: Model.DateTimeInsert,
    updatedAt: Model.DateTimeUpdate
  }) {}
  ```

  Variants: `Group`, `Group.insert`, `Group.update`, `Group.json`, `Group.jsonCreate`, `Group.jsonUpdate`. Other exports: `Override`, `GeneratedByDb`, `GeneratedByApp`, `Sensitive`, `FieldOption`, `BooleanSqlite`, `Date`, `DateTimeInsert`/`DateTimeUpdate` (with `FromDate`/`FromNumber` variants), `JsonFromString`, `UuidV7Insert`, `UuidV4BytesInsert`.
- **Generated values use the Effect clock:** `Group.insert.makeEffect({ name, slug, notes: null })` fills the id and timestamps, so tests control them with `TestClock`.
- **Repositories:** `SqlModel.makeRepository(Group, { tableName, spanPrefix, idColumn })` derives insert, update, findById and delete.
- **Queries (`SqlSchema`, unstable):** `` SqlSchema.findAll({ Request: Schema.Void, Result: Group, execute: () => sql`SELECT * FROM groups ORDER BY createdAt` }) ``; also `findNonEmpty`, `findOne` (fails with `NoSuchElementError` on no rows), `findOneOption`, `void`. Each encodes the request before `execute` and decodes the unknown driver rows into the result schema.
- **Keep service errors on the domain:** treat database and encoding failures as defects.

  ```ts
  repo.findById(id).pipe(Effect.catchTags({
    NoSuchElementError: () => new GroupNotFound({ id }),
    SchemaError: Effect.die,
    SqlError: Effect.die
  }))
  ```

## Forms and web frameworks

- **TanStack Form:** `validators: { onChangeAsync: Schema.toStandardSchemaV1(schema), onSubmitAsync: async ({ value }) => { ... } }`; fields are validated and parsed; form-level rules go in `.check(Schema.makeFilter(...))` on the struct; type `defaultValues` with `satisfies (typeof schema)["Encoded"]`.
  - Optional inputs that submit `""`: `Schema.Union([UndefinedFromEmptyString, schema])` with `UndefinedFromEmptyString = Schema.Undefined.pipe(Schema.encodeTo(Schema.Literal(""), { decode: SchemaGetter.transform(() => undefined), encode: SchemaGetter.transform(() => "" as const) }))`.
  - Numbers from text inputs: `Schema.Number.check(Schema.isInt({ message }).abort(), Schema.isBetween({...}, { message })).pipe(Schema.encodeTo(Schema.String, SchemaTransformation.numberFromString))`.
- **React Hook Form:** `@hookform/resolvers` provides `effectTsResolver`.
- **Elysia:** decode bodies with `Schema.toStandardSchemaV1(Schema.toCodecJson(schema))`, params and query with `Schema.toStandardSchemaV1(Schema.toCodecStringTree(schema))`, and responses with `Schema.toStandardSchemaV1(Schema.flip(Schema.toCodecJson(schema)).annotate({ direction: "encoding" }))`. For OpenAPI use `Schema.toJsonSchemaDocument`; the guide's Elysia example calls a `Schema.toJsonSchema` and a `Schema.ValidDate` that the source does not export.

## Anti-patterns

- **Treating a passing JSON Schema check as decoded data.** Decode with the schema.
- **Generating JSON Schema with the default `onExcessProperty` while the decoder rejects extras,** or the reverse. Pass the same setting to both.
- **`.annotate` on a transformation for JSON Schema metadata.** Use `Schema.annotateEncoded`.
- **`patterns: "apply"` on untrusted JSON Schema documents.**
- **Hand-written string or JSON transformations on HttpApi params or payloads.** The endpoint coerces domain types.
- **`Config.withDefault` to recover from invalid values.** It covers absence only; use `Config.orElse`.
- **`Schema.Json` or `Schema.Unknown` inside `Config.schema`.** Use `Schema.fromJsonString(Schema.Json)`.
- **Exposing `SchemaError` or `SqlError` from a repository's service interface.** Map to domain errors or die.
- **fast-check generators with `it.prop`,** or keeping a replay token as the only record of a failure.

## Prove it

Generated JSON Schema documents come from `Schema.toJsonSchemaDocument` and use the same `onExcessProperty` as the decoder. An HttpApi test sends a request that breaks the payload schema and gets a 400 (or the custom error from `layerSchemaErrorTransform`), and every error class carries its status. A Config test supplies an invalid value and gets a `SchemaError` cause rather than the default. Property tests built with `Arbitrary.schema` or `it.prop` run with a fixed seed, and any falsified input is copied into a regular test. Model-based inserts run under `TestClock` with the expected timestamps.
