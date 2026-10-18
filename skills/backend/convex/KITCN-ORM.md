# kitcn ORM

This optional kitcn branch comes from [udecode/kitcn, references/features/orm.md, references/features/migrations.md, references/setup/server.md] and the current first-party ORM documentation. Use it only after the application selects kitcn. Read [KITCN.md](KITCN.md) for procedure boundaries and [KITCN-SETUP.md](KITCN-SETUP.md) for generated wiring. Ordinary Convex access and authorization remain in [FUNCTIONS-AND-DATA.md](FUNCTIONS-AND-DATA.md) and [AUTH.md](AUTH.md).

## Tables, columns and stored values

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/schema; https://kitcn.dev/docs/orm/schema/column-types]

Define tables with `convexTable(name, columns, extraConfig?)`; `defineSchema` takes the tables map. Attach relations and triggers to the default schema export. The TypeScript property key is the document field name; a column builder's optional name parameter is generally unnecessary.

| Surface | Contract |
|---|---|
| System fields | ORM rows expose `id` and `createdAt`. Without an explicit column, `createdAt` is the numeric alias for Convex `_creationTime`. |
| Explicit `createdAt` | `timestamp().notNull().defaultNow()` stores a numeric `createdAt` column and reads it as `Date`; string timestamp mode reads it as `string`. |
| `text`, `textEnum` | String and runtime-validated string-union columns. |
| `integer` | Maps to Convex `v.number()`, a Float64 value; the name is not an integer-only validator. |
| `bigint`, `boolean`, `bytes` | Convex int64/JavaScript `bigint`, boolean and `ArrayBuffer`. |
| `timestamp` | Point-in-time value, stored numerically and exposed as `Date` by default; `{ mode: 'string' }` exposes a string. |
| `date` | Calendar-only `YYYY-MM-DD` value by default; `{ mode: 'date' }` exposes `Date`. |
| `id('table')` | Typed table reference. Add `.references()` or `foreignKey()` for ORM-enforced referential constraints. |
| `vector(dimensions)` | Numeric embedding array used with a declared vector index. |
| `arrayOf`, `objectOf`, `unionOf` | Nested document arrays, objects, homogeneous records and scalar unions. |
| `custom(validator)` | Keeps the provided Convex validator. |
| `json<T>()`, `$type<T>()` | Type annotations, not additional runtime validation; `json<T>()` wraps `v.any()`. |

Fields are nullable unless `.notNull()` is set. A selected field is `T | null` by default. An insert field is required when `.notNull()` has no default hook; `.default()`, `$defaultFn()` and `$onUpdateFn()` can make it optional on insert. Infer models through `$inferSelect`, `$inferInsert`, `InferSelectModel` or `InferInsertModel`; generated application aliases are covered in [KITCN-SETUP.md](KITCN-SETUP.md).

`.default(value)` applies when an inserted value is `undefined`; explicit `null` is preserved. `$defaultFn`/`$default` run on insertion when omitted. `$onUpdateFn`/`$onUpdate` run when an update does not explicitly supply the field and can also fill missing insert values. These hooks and constraints operate through ORM mutations; raw `ctx.db` writes bypass them.

The source's blanket statement that every `createdAt` maps to `_creationTime` is too broad. The current [schema storage table](https://kitcn.dev/docs/orm/schema#temporal-field-model-createdat-timestamp-date) distinguishes an explicit stored column from the system alias; another upstream indexes page retains the blanket prohibition. Check the actual schema and index rather than copying that prohibition.

## Indexes and constraints

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/schema/indexes-constraints; https://kitcn.dev/docs/orm/api-reference]

| Declaration | Behavior |
|---|---|
| `index(name).on(...)` | Access path for filtering, relation lookup and ordering. Choose fields from the actual query. |
| `uniqueIndex`, `unique`, column `.unique()` | ORM runtime uniqueness checks; compound uniqueness uses multiple columns. `.nullsNotDistinct()` treats null as a value. |
| Column `.references()` | Foreign key with optional `onDelete`/`onUpdate` behavior. Self-reference callbacks may need an `AnyColumn` return annotation. |
| `foreignKey({ columns, foreignColumns })` | Table-level references, including non-ID parent columns. |
| Foreign key actions | `cascade`, `set null`, `set default`, `restrict`, `no action`; indexes on child referencing columns support fan-out, and indexes on non-ID parent targets support validation. |
| Async soft cascade | Needs an exact child index containing the referencing columns. Adding a mutable trailing field does not satisfy this continuation contract. |
| `check(name, expression)` | Evaluated on ORM inserts/updates. SQL-like null semantics mean only `false` fails; `unknown` passes. Use `.notNull()`/`isNotNull` for required presence. |
| `searchIndex` | `.on()` selects one searchable field; `.filter()` declares equality filter fields. |
| `vectorIndex` | `.on()` and `.dimensions(n)` are required; `.filter()` declares filter fields. Search/vector indexes support `.staged()`. |

Do not strengthen the upstream uniqueness description into an unverified concurrency guarantee or a universal race claim. Its best-effort warning has not been reconciled against the actual constraint path and Convex transaction behavior. Constraint enforcement is application-layer behavior, so raw writer paths still require inspection.

## Relations and discriminators

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/schema/relations; https://kitcn.dev/docs/orm/schema/column-types#discriminatorconfig]

Relations describe loading; foreign keys separately describe integrity. Attach them through `defineSchema(...).relations(...)`. A `one()` relation uses `from` and `to`; an unambiguous inverse can supply the `many()` side. Define the reverse side only when that direction needs loading. Use `alias` to disambiguate multiple edges or self-references; it does not rename the returned property.

| Relation feature | Contract |
|---|---|
| `one()` | Optional and nullable by default; `optional: false` changes return typing. True one-to-one cardinality requires a uniqueness constraint. |
| `many()` | Child foreign key needs an index. Size each parent relation with its own `limit`, schema `defaultLimit`, or an explicit parent `allowFullScan`. |
| `.through()` | Explicit junction-table traversal. Index the foreign keys used in each direction; compound lookup fields must form the matching index prefix. |
| Non-ID `one()` target | Requires an index on the target columns. ID targets use `db.get()` without an extra index. |
| Predefined `where` | References the target table's columns and filters candidate rows after fetching. |
| Nested `with` | Loads the requested levels, up to 10. Rows requiring further expansion throw `RELATION_DEPTH_EXCEEDED`; depth is not a substitute for per-level bounds. |
| Relation fan-out | Unique lookup keys are capped by `relationFanOutMaxKeys`, default 1000, unless `allowFullScan` is explicit. |
| `defineRelationsPart` | Splits a large relation graph. Inferred inverse edges must share a part, or use explicit `from`/`to`. |
| Extension composition | Extension relations merge before application relations; duplicate `table.field` definitions throw. |

Relation sorting uses the index when it can produce the requested order. After an equality-pinned foreign key, the remaining sort fields must follow the index order. Every unpinned declared key must be represented; an extra trailing key can change which tied rows survive `limit`. If the first requested field is equality-pinned in the opposite direction, include `createdAt` in the moving direction to make the tie-break explicit. Non-null comparisons follow Convex value ordering, including UTF-8 strings, signed zero and NaN. Unsupported ordering, or columns that may be null/missing, can read and sort the whole child partition. [https://kitcn.dev/docs/orm/queries#ordering; udecode/kitcn, references/features/orm.md]

`discriminator({ variants, as? })` is schema-first polymorphism. One discriminator column is supported per table; variant keys become its literals. Writes are flat, variant fields are nullable physical columns, and reads synthesize a typed nested union at `details` or the chosen alias. A branch's `.notNull()` requires that field in that branch. Duplicate names across variants require identical builder signatures; the alias cannot collide with columns, relations, `with` or `extras`. `withVariants: true` loads the table's `one()` relations. There is no query `polymorphic` option.

## Read modes and scan bounds

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/queries; https://kitcn.dev/docs/orm/queries/filters; https://kitcn.dev/docs/orm/queries/operators]

Use `ctx.orm.query.table.findMany`, `findFirst` or `findFirstOrThrow`. Non-paginated `findMany` needs `limit`, cursor mode, schema `defaultLimit`, or explicit `allowFullScan`. There is no implicit built-in `defaultLimit` when it is unset.

| Need | Mode and limits |
|---|---|
| Base fields or relation conditions | Object `where`; the planner uses indexes when possible. Relation existence uses a relation condition, including its negation. |
| Drizzle-style expressions | Callback `where` returning an operator expression; same planner as object filters. |
| Arbitrary JavaScript predicate | Explicit `.withIndex(name, range?)`, then `predicate(...)`; cursor scan fallback needs `maxScan`. |
| Full-text relevance | `search: { index, query, filters? }`; one searchable field per declared search index. |
| Vector similarity | `vectorSearch: { index, vector, limit, includeScore?, filter? }`; provider wiring and a declared vector index are required. |
| Transform before pagination | The `select()` chain below. |

Query operators include `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`, `notBetween`, `in`, `notIn`, `isNull`, `isNotNull`, `AND`, `OR`, `NOT` and relation conditions. `between` includes both endpoints; `notBetween` is strictly outside them. Mutation/RLS helpers use `inArray`/`notInArray` and lowercase `and`/`or`/`not` with column builders.

The planner can compile comparisons, set/null tests, ranges, `startsWith`, prefix `like` and same-field equality OR onto indexes. Constrain the leading compound-index fields; reversed AND equality order is normalized to index order. Other string/array operators run post-fetch: `ilike`, `notLike`, `notIlike`, `endsWith`, `contains`, `arrayContains`, `arrayContained`, `arrayOverlaps`. The typed API makes scan scope explicit with `.withIndex()` where required.

| Post-fetch need | Source's indexed alternative |
|---|---|
| Array membership/overlap | An inverted or join table keyed by element. |
| `contains` | A search index or tokenized denormalized field. |
| `endsWith` | A reversed, indexed column queried with `startsWith`. |
| Case-insensitive prefix matching | A normalized lowercase query column. |
| Negative/general filters | A positive indexed pre-filter and a bounded residual scan. |

`columns` is post-fetch projection: Convex still reads full documents. Include-only, exclude-only and empty selections affect table fields while preserving relations/extras. `extras` are computed after fetching and relation loading; they cannot drive `where`/`orderBy`. Prefer relation loading over per-row application calls, with [indexed relation counts](KITCN-AGGREGATES.md) when only counts are needed.

Search keeps relevance order, supports equality `search.filters` and base-table object `where` as a post-search filter, and permits `with`. It rejects `orderBy`, callback/predicate `where` and relation `where`. Keep search results bounded; filtering a capped result afterwards does not establish complete results for the combined condition.

Vector mode requires `vectorSearch.limit` from 1 through 256. It rejects top-level `limit`, `where`, `cursor`, `maxScan`, `offset`, `.withIndex()` and `orderBy`; `with`, `columns` and `extras` remain available. `_score` appears only with `includeScore: true`.

## Ordering, pagination and composition

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/queries/pagination; https://kitcn.dev/docs/orm/queries#ordering; https://kitcn.dev/docs/orm/api-reference]

An index-served order lets `limit` bound the read. Non-cursor unsupported sorts can fetch the full filtered candidate set before sorting and applying offset/limit. Cursor ordering follows every `orderBy` field the index serves; when the index cannot serve the whole order, the ORM warns and drops the remaining fields after the first. The source and an older API-reference summary said cursor ordering uses only the first field; use the current ordering contract.

| Mode | Contract |
|---|---|
| Offset | `findMany({ offset, limit })`; suitable for shallow page-number navigation, with the cost of reading earlier rows. |
| Cursor | `cursor: null` starts; return shape includes `page`, `continueCursor`, `isDone`, optional `pageStatus` and `splitCursor`. Keep filters/index/order stable between calls. |
| Reactive boundary | Pass `endCursor` with cursor mode to pin adjacent refreshed pages; cRPC's paginated input is in [KITCN.md](KITCN.md). |
| Scan fallback | `maxScan` caps scanned rows in cursor mode and can return a partial page with split hints. Strict mode throws if the needed budget is absent; `strict: false` warns and runs uncapped. |
| Full-scan opt-in | `allowFullScan` is for non-cursor sizing/fan-out exceptions; it does not replace cursor `maxScan`. |
| Key paging | `pageByKey` accepts `index`, `order`, `startKey`, `endKey`, inclusive/exclusive bounds, `targetMaxRows`, `absoluteMaxRows`; returns `page`, `indexKeys`, `hasMore`. |

`in`, `notIn`, `ne` and same-field equality OR on an indexed leading field can page from index ranges without a scan budget. Up to 64 ranges can be merged for cross-value ordering; wider unions walk ranges in index order. An unsupported cross-value order or an order the index cannot supply requires bounded scan fallback. Without `orderBy`, the result is grouped by the walked index value, not creation order.

Use `select()` for ordered pre-pagination `where`, `union`, `interleaveBy`, `filter`, `map`, relation `flatMap` and `distinct({ fields })`. Stage outputs are inferred in chain order. A union source's `index: { name, range }` overrides the chain index; sources without one inherit it. A source `where` can lower onto a suitable index only when it preserves the merge order. A pinned range is the source's scope: a companion `where` filters after reading instead of widening that range. `interleaveBy` fields must already be trailing order fields of every source, with earlier fields equality-pinned; different source index names are allowed when those trailing fields match.

`flatMap('relation', { includeParent })` traverses child indexes beginning with the relation foreign key. A matching composite index can lower the stage's filter onto the child range; that range's fields then order children before creation time. `findMany({ distinct })` is unsupported; use pipeline distinct. Do not combine `select()` with search, vector search, offset, `with`, extras or columns.

An ID-list `select().where({ id: { in: [...] } })` without ordering visits listed positions in input order; missing/policy-filtered IDs still consume scan budget. Adding `orderBy` switches to a scan and needs one field that an index leads with, without a pinned `.withIndex()`. Sorting that list by `createdAt` reads all IDs and cannot use `maxScan`. `endCursor` or `maxScan` without cursor mode is rejected; `pageByKey` cannot combine with cursor, offset, search, vector search or composition.

## Writes, RLS and hooks

[udecode/kitcn, references/features/orm.md; https://kitcn.dev/docs/orm/mutations; https://kitcn.dev/docs/orm/mutations/update; https://kitcn.dev/docs/orm/mutations/delete; https://kitcn.dev/docs/orm/rls; https://kitcn.dev/docs/orm/schema/triggers]

| Operation | Contract |
|---|---|
| Insert | `.insert(table).values(rowOrRows)`; no returned data without `.returning()`. |
| Returning | `.returning()` yields an array, even for one row; selected fields and relation counts are supported. Async execution returns the first batch's rows only. |
| Upsert | `.onConflictDoNothing({ target? })` skips conflicts; omitting the target covers any unique conflict. `.onConflictDoUpdate({ target, set })` needs a backing unique target; missing-index fallback requires explicit `.allowFullScan()`. |
| Update/delete | Require `.where(...)`, or deliberate `.allowFullScan()`; non-ID unindexed access needs the explicit scan opt-in. |
| Set/unset | `.set()` ignores `undefined`. Use `unsetToken` to remove a top-level field; it is a shallow removal. |
| Delete modes | Per-query `.hard()`, `.soft()`, `.scheduled({ delayMs })` override table `deletion(...)`; the fallback is hard deletion. |
| Scheduled deletion | The worker checks the original `deletionTime` token; clearing/changing it cancels that pending deletion. |
| Paged mutation | `.paginate({ cursor, limit })` executes one page, returning `continueCursor`, `isDone`, `numAffected`, and `page` with returning. Only single-range index plans are supported. |

Async bulk execution is the default when generated scheduling is wired: the first batch runs in the current mutation and later batches are scheduled. It is not one transaction across every batch. Customize `.execute({ batchSize, delayMs })`; use `.execute({ mode: 'sync' })` or schema `mutationExecutionMode: 'sync'` for all matched rows in one transaction, subject to the cap. Without scheduling wiring, default execution falls back to sync. Async cannot combine with `.paginate()` or a resolved scheduled-delete mode. Ordinary Convex transaction boundaries remain in [FUNCTIONS-AND-DATA.md](FUNCTIONS-AND-DATA.md#function-boundaries).

| Runtime default | Built-in fallback |
|---|---|
| `mutationBatchSize` | 400 matched rows per collection page. |
| `mutationMaxRows` | 10000 matched rows in sync mode. |
| `mutationLeafBatchSize` | 1600 rows for non-recursive FK fan-out. |
| `mutationMaxBytesPerBatch` | 2,097,152 measured bytes per continuation batch. |
| `mutationScheduleCallCap` | 800 schedule calls per mutation invocation. |
| `mutationAsyncDelayMs` | 0 milliseconds. |

Set overrides through `defineSchema(..., { defaults })`. Per-call batch size/delay beat schema defaults. Numeric defaults must be integers; delay can be zero, the other numeric limits must be at least one. Recursive delete cascades use the mutation batch size; non-recursive FK updates use the leaf batch size. The source's smaller schema-template numbers are configured examples, not these built-in fallbacks.

RLS is application-layer enforcement through policy-aware `ctx.orm`; `ctx.db` and `ctx.orm.skipRules` bypass it. Enable policies with `rlsPolicy` or `convexTable.withRLS`; enabled RLS without permissive policies denies access. Configure `rls: { ctx }` on ORM context. Select/delete use `using`; insert uses `withCheck`; update uses both. A missing `withCheck` falls back to `using`. RLS comparisons with missing fields/context evaluate to unknown and deny, unlike the check-constraint unknown behavior above.

Named `rlsRole` policies require a `roleResolver`; absence throws `RLS_ROLE_RESOLVER_REQUIRED` before table reads, including empty tables. Pseudo-roles `public`, `current_user`, `current_role`, `session_user` apply to everyone without a resolver. Related-table and junction-table policies govern `with` traversal. FK fan-out begins after the root passes RLS but does not re-check child-table policies. Authentication and parent ownership remain the application's [public-boundary checks](AUTH.md#public-functions-and-referenced-parents).

Declare hooks with schema `.triggers(...)`, not table extra configuration. Hooks are `create/update/delete.before(dataOrDoc, ctx)`, their `.after(doc, ctx)`, and `change(change, ctx)`. Before hooks return `void`, `{ data }` for a shallow payload merge, or `false` to cancel and throw `TriggerCancelledError`; after hooks return void. Change payload includes `id`, `operation`, `oldDoc`, `newDoc`, with null on the missing insert/delete side. Extension hooks merge before app hooks; duplicates for the same table/event throw. Keep hooks bounded and non-recursive; expensive work uses [scheduled procedures](KITCN-SCHEDULING.md).

Trigger errors fail the mutation; recursive writes are queued deterministically in the wrapped context. `ctx.innerDb` bypasses recursive dispatch; `ctx.orm.withoutTriggers(callback)` supplies a trigger-free ORM in the same transaction. Auth lifecycle hooks are covered in [KITCN-AUTH.md](KITCN-AUTH.md), and ORM-managed metrics need [no manual trigger wiring](KITCN-AGGREGATES.md).

The source counter example wrote an undeclared `openTaskCount` without `where`, counted only a 500-row prefix, and updated only the new parent on reassignment. It is not a valid invariant-maintenance recipe; use the supported targeted-write and indexed-metric contracts above. The source tests also assigned IDs from inserts without `.returning()`; the [official insert contract](https://kitcn.dev/docs/orm/mutations/insert) returns void otherwise.

## Online migrations

[udecode/kitcn, references/features/migrations.md; https://kitcn.dev/docs/orm/migrations]

The generic [expand, migrate, tighten workflow](MIGRATIONS-AND-RECOVERY.md#expand-migrate-tighten) owns compatibility. kitcn migrations are for existing records that fail the new schema/behavior: optional-to-required fields, narrower types/enums, incompatible rename/removal and semantic backfills. New optional fields/tables/indexes and compatible read defaults do not themselves require a data migration.

`defineMigration({ id, description?, up, down? })` uses a unique timestamped ID. Each step supplies `table`, `migrateOne`, optional `batchSize` and `writeMode`. Return a partial patch or nothing to skip. Runtime batch fallback is 128; CLI configuration normally supplies 256. `safe_bypass` is default and bypasses ORM rules/lifecycle triggers; select `normal` when those hooks are required. The callback receives raw `db`, `orm`, `migrationId`, `runId`, `direction`, `dryRun` and `writeMode`.

| Surface | Contract |
|---|---|
| `migrate create <name>` | Scaffolds `<functionsDir>/migrations/<timestamp>_<name>.ts` and updates `manifest.ts`. |
| `defineMigrationSet([...])` | Manifest collection, checksum computation and ID ordering. |
| `migrate up` | Applies pending migrations in order. |
| `migrate down --steps N` / `--to <id>` | Explicit rollback; missing down handler errors. |
| `migrate status` / `migrate cancel` | Inspect applied/pending/drift/runs or cancel an active run. |
| `migration_state`, `migration_run` | Reserved internal table names. |
| `generated/server:migrationStatus` | Internal query; default run limit 25, capped at exported `MAX_STATUS_RUN_LIMIT` 100. `runId` ignores the limit. |

Status `activeRun` resolves independently of a run filter. Authored migrations, pending and drift always cover the complete manifest. Run statuses are `pending`, `running`, `completed`, `failed`, `canceled`, `dry_run`, `noop`, `drift_blocked`.

Current migration code must be pushed before `migrate up`; use deterministic `dev`/codegen then migration order. `kitcn deploy` sequences backend deploy, migrations up and aggregate backfill. Deploy normally waits and blocks drift; dev defaults are relaxed (`strict: false`, `allowDrift: true`). Applied checksum changes or removal from the manifest block the next strict run. Keep applied files immutable and create a new migration; `allowDrift` is an emergency override, not routine production configuration.

The source's deploy-migration JSON had extra closing braces; the [official configuration](https://kitcn.dev/docs/orm/migrations#deploy-integration) is the reference. Its down example removed every `medium` value without proving which values the up migration introduced; a down handler is optional and must be safe for the actual data. If reversibility is not established, retain the official forward-fix approach.

## Prove it

[udecode/kitcn, references/features/orm.md, references/features/migrations.md; https://kitcn.dev/docs/orm/api-reference; https://kitcn.dev/docs/orm/migrations]

- Identify explicit stored timestamps versus system aliases and check model types, constraints and raw-writer bypasses.
- Trace the actual index prefix, order, scan bound, per-parent relation size and live cursor/endCursor boundaries.
- Establish whether a bulk write is one sync transaction or scheduled batches; account for first-batch returning data, limits and cancellation tokens.
- Trace RLS context, named roles, junction traversal and cascade bypasses back to public authorization checks.
- Verify trigger invariants without truncated counts or missed old parents; distinguish accepted hook suppression from normal writes.
- Name migration target, compatible callers, current code, reserved tables, progress, drift and any safe reverse transform. Record unperformed runtime verification under [TESTING.md](TESTING.md).
