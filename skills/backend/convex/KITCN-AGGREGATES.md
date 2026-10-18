# kitcn indexed metrics and ranking

This optional kitcn topic comes from [udecode/kitcn, references/features/aggregates.md, references/features/orm.md, references/features/auth-organizations.md] and the current first-party aggregates documentation. It owns metric and rank declarations, query limits, readiness and repair. Schema/query basics stay in [KITCN-ORM.md](KITCN-ORM.md); runtime generation and CLI ownership stay in [KITCN-SETUP.md](KITCN-SETUP.md).

## Capability and index lifecycle

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates; https://kitcn.dev/docs/orm/api-reference]

Aggregate/rank support is an optional ORM capability. A manual ORM setup registers `aggregateCapability()` from `kitcn/orm/aggregate-index` in `createOrm({ schema, capabilities })`. Codegen registers it when the schema declares `aggregateIndex` or `rankIndex` and omits it otherwise. Declare the index, then regenerate; do not manually edit `generated/server.ts` or wire aggregate triggers.

| Operation | Requirement |
|---|---|
| Unfiltered `count()` | Native Convex count syscall; no aggregate index/capability. |
| `aggregate({ _count: true })` without a filter | Same native count exception. |
| Filtered counts, field counts and metric aggregates | Matching declared `aggregateIndex`, capability and ready index. |
| Finite `groupBy`, relation `_count` | Matching aggregate coverage and capability. |
| Ranked access | Declared `rankIndex`, capability and constrained partition fields. |

The source core said every count/aggregate requires an aggregate index. The [official native-count exception](https://kitcn.dev/docs/orm/queries/aggregates#scalar-metrics) above is the precise form.

`aggregateIndex` and `rankIndex` are ORM-maintained. `kitcn dev` runs their backfill automatically; deployment also has aggregate backfill in its [CLI sequence](KITCN-SETUP.md). Wait for the internal `aggregateBackfillStatus` query to report `READY` before routing dependent reads to the index. The source's legacy component/`defineTriggers` repair instructions are not the current ORM-managed path.

## Declare metric coverage

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#declaring-aggregate-indexes]

| Builder | Meaning |
|---|---|
| `aggregateIndex(name).on(fields)` | Filter-key coverage for namespaced metrics. |
| `.all()` | Global, unfiltered metric coverage. |
| `.count(field)` | Field-count coverage. |
| `.sum(field)`, `.avg(field)`, `.min(field)`, `.max(field)` | Declare the metrics the index serves. |

Use the actual filter shape when choosing coverage. For example, member counts by organization and pending-invitation counts by organization plus status require their respective declared key fields; a missing or mismatched aggregate index is an error rather than an implicit table scan.

Bulk ORM statements reuse bucket reads per distinct key tuple and membership reads per document within an uninterrupted statement. Shared bucket/extrema writes fold within that statement. Statement exit, user hooks and policy callbacks end reuse; callbacks and aggregate reads, including returning relation counts, flush pending writes so nested work sees stored changes. Membership still costs one write per changed document. Do not interpret this optimization as a promise that all hooks or repeated metric calls are free.

## Count and aggregate queries

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#count; https://kitcn.dev/docs/orm/queries/aggregates#aggregate]

`count({ where, select? })` supports the indexed scalar subset: `eq`, `in`, `isNull`, `gt`, `gte`, `lt`, `lte`, conjunction through `AND`, and bounded finite DNF `OR` when every branch is plannable on one aggregate index. Field counts in `select` need `.count(field)` declarations. `aggregate()` uses the same filter rules with Prisma-style `_count`, `_sum`, `_avg`, `_min` and `_max` blocks. Unsupported callback/relation filter arguments do not become a scan fallback.

Null matching is deliberate: `isNull: true` matches explicitly null and absent fields; a direct null value or `eq: null` matches explicit null only. `findMany`, scalar counts, metrics, `groupBy` and relation `_count` use this distinction consistently. `_sum` returns null for an empty set or when every field value is null.

| Window | Supported shape |
|---|---|
| Count | `orderBy`, `skip`, `take`, `cursor`; a cursor requires ordering and is single-field in the documented v1 window contract. |
| Field-count selection | `count({ select: { field: true } })` with skip/take/cursor is unsupported; use the all-row count form for that window. |
| Metric aggregate | `orderBy` plus `cursor` supports count/sum/average/min/max. |
| Metric skip/take | Count-only in the documented v1 contract; non-count metrics throw `AGGREGATE_ARGS_UNSUPPORTED`. |

Keep that aggregate-window contract separate from the ORM's [ordinary cursor pagination](KITCN-ORM.md#ordering-pagination-and-composition). One upstream example combines `_sum` with skip/take while the same page says that combination throws; retain the stated supported contract rather than copying the example. [https://kitcn.dev/docs/orm/queries/aggregates#windowed-aggregate]

| Error | Meaning |
|---|---|
| `COUNT_NOT_INDEXED` | No matching aggregate-index filter coverage. |
| `COUNT_FILTER_UNSUPPORTED` | Unsupported filter or exceeded `aggregateWorkBudget`; a bucket scan costs one work unit and min/max also require extrema reads per matching bucket. |
| `COUNT_INDEX_BUILDING` | Backfill is not ready. |
| `COUNT_RLS_UNSUPPORTED` | Count called through an RLS-restricted context. |
| `AGGREGATE_ARGS_UNSUPPORTED` | Unsupported aggregate arguments/window shape. |

## Finite groups

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#groupby]

`groupBy({ by, where, _count, _sum, _avg, _min, _max, orderBy, having, skip, take, cursor })` is an indexed finite-group operation, not an unrestricted scan-and-group API.

- `by` is required and every grouped field must have a finite `eq`, `in` or `isNull` constraint in `where`.
- An `isNull` grouped field emits one null-keyed group covering explicit null and absent values.
- `orderBy` can use grouped fields and selected metrics; skip/take/cursor require explicit ordering.
- `having` accepts conjunctions on grouped fields and selected metrics; OR/NOT in having is unsupported and throws `AGGREGATE_FILTER_UNSUPPORTED`.
- An unconstrained grouping field throws `AGGREGATE_ARGS_UNSUPPORTED`; missing coverage does not trigger manual in-memory grouping.

Prefer this operation for multiple filtered buckets, dashboard category breakdowns or replacing repeated per-value count calls. Do not present a capped `findMany` prefix or an unrandomized sample as an exact population count. The source admin dashboard estimated admins from its first 100 users, divided by an empty sample when no users existed, and capped its growth rows at 1000; those examples are not exact totals.

## Relation and returning counts

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#relation-_count]

Request `with: { _count: { relation: true } }` when only related counts are needed, instead of issuing a per-parent application count loop. A relation value can carry `where` for supported scalar filters. Indexed `through()` relation filtering is supported; nested relation filters in a relation count are blocked with `RELATION_COUNT_FILTER_UNSUPPORTED`.

Counts are available on `findMany`, `findFirst` and `findFirstOrThrow`, read as `row._count?.relation ?? 0`. Ask for `_count` at each needed level of a nested `with`, including the deepest returned level, instead of rereading the returned tree to attach counts. This preserves the distinction between the children loaded in the page and the total children available.

Insert, update and delete `.returning()` selections also support `_count`, including supported filters. An aggregate read flushes pending shared metric writes before resolving that count. General returning and async first-batch behavior remain in [KITCN-ORM.md](KITCN-ORM.md#writes-rls-and-hooks).

`findMany({ distinct })` is unsupported; [pipeline distinct](KITCN-ORM.md#ordering-pagination-and-composition) is the supported deduplication surface.

## Ranked access

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#ranked-access-with-rankindex]

Declare `rankIndex(name)` with `.partitionBy(fields)` for separate ranked sets or `.all()` for an unpartitioned set. Chain `.orderBy({ column, direction })` for product ordering and optional `.sum(field)` for ranked sums. Query with `ctx.orm.query.table.rank(indexName, { where })`; constrain the required partition fields.

| Operation | Result |
|---|---|
| `.indexOf({ id })` | Rank of a document in the indexed table. |
| `.at(offset)` | Row at an offset. |
| `.paginate({ cursor, limit })` | Ordered traversal. |
| `.max()` / `.min()` | Ranked-set extremes. |
| `.random()` | Random row from the ranked set. |
| `.count()` / `.sum()` | Ranked-set count or sum. |

The source leaderboard passed the authenticated user ID to a rank over separate score documents. The [official operation](https://kitcn.dev/docs/orm/queries/aggregates#ranked-access-with-rankindex) takes the ranked document ID; a user ID is not automatically that score-row ID. Do not copy that example or invent a lookup implementation.

Partition by tenant when that is the product's ranked-set boundary; the source notes a global rank can create cross-tenant contention. Match sort directions and tie-break columns to real reads. High-frequency nearby-key updates can contend, and high-cardinality partitions have overhead. The source's three-to-four composite-key-component suggestion is a design guideline, not a platform maximum.

## Repair and operational checks

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates#repair]

`kitcn aggregate rebuild` clears stored state in scheduled batches. Index status is `CLEARING` while draining, then `BUILDING` while recomputing; wait for `READY` for dependent queries. Writes targeting a declared index in `CLEARING` fail before the document write and may be retried after the index advances to BUILDING or READY. This is an operation capability, not authorization to run a rebuild.

Automatic pruning follows lifecycle state so kickoff reads remain bounded. For state-less storage, the documented recovery uses `aggregateBackfill` in prune mode with exact `tableName` and `indexName`. During a declared count index's backfill, the organization source permits catching only `COUNT_INDEX_BUILDING` and reading the exact count from its matching native organization index until ready; do not replace every aggregate error with a sampled/capped count. [udecode/kitcn, references/features/auth-organizations.md; https://kitcn.dev/docs/orm/queries/aggregates]

## Prove it

[udecode/kitcn, references/features/aggregates.md; https://kitcn.dev/docs/orm/queries/aggregates]

- Distinguish native unfiltered count from indexed filtered metrics, and verify capability registration, filter coverage and readiness.
- Check finite grouping constraints, null/absent semantics, supported windows and the actual error code.
- Verify relation counts at the requested tree depth without a second per-node pass or truncated-population claim.
- Trace rank IDs to the ranked table, partition and ordering; separate source design guidelines from runtime limits.
- Identify the target and lifecycle before repair, and record evidence or unperformed runtime checks under [TESTING.md](TESTING.md).
