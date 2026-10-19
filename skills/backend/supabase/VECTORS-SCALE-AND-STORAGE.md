# Vectors: production sizing, Vecs and vector buckets

Moved unchanged from [VECTORS.md](VECTORS.md) to keep each file under the size cap. Production and compute sizing, the Vecs Python client and vector buckets

## Production and compute sizing

- **The steps:** decide on indexes; over-provision RAM while preparing (at least 8XL is suggested); load the data; benchmark random queries; record RAM used including cache and buffers; scale down to a compute with that much RAM; warm the cache until QPS stops rising; benchmark real queries while tuning `ef_search` or `probes`; for more QPS raise `m` and `ef_construction` (or `lists`, or move IVFFlat to HNSW) and rebuild.
- **Warm the index before benchmarks or traffic:** `select pg_prewarm('vecs.docs_vec_idx');` loads it into RAM, then run warm-up queries. The production guide says 10,000 to 50,000 of them; the compute guide says a few thousand.
- **Postgres config is tuned to the compute size on the hosted platform;** self-hosters tune it to their RAM and CPU.
- **Benchmark at a concurrency of 5 or more,** 30 or more for high-load workloads; more vectors than the tables below fit if memory allows, with QPS falling and latency rising. Scaling should be close to linear, but measure your own workload.
- **Split vectors into their own project at scale:** they grow faster than operational data and need different resources, and separate projects remove a single point of failure. Query them with Vecs directly, or from the primary database through `postgres_fdw` foreign tables:

```sql
create extension postgres_fdw;
create server docs_server foreign data wrapper postgres_fdw
  options (host 'db.xxx.supabase.co', port '5432', dbname 'postgres');
create user mapping for docs_user server docs_server
  options (user 'postgres', password 'password');
create foreign table docs (
  id text not null,
  embedding extensions.vector(384),
  metadata jsonb,
  url text
) server docs_server options (schema_name 'public', table_name 'docs');
```

  For a small workload in one database, expose a Vecs collection through a view: `create view public.docs as select id, embedding, metadata, (metadata->>'url')::text as url from vector`.

HNSW benchmarks (accuracy 0.99, inner product, one table, QPS):

| Compute | 384 dims (gte-small) | 960 dims (gist-960) | 1536 dims (OpenAI) |
|---|---|---|---|
| Micro | 100,000 vectors, m 16, efc 64, efs 60: 580 (p95 0.024 s, 1 GB RAM plus swap) | 30,000: 430 | 15,000, m 16, efc 40, efs 40: 480 |
| Small | 250,000 (24/64/60): 440 | 100,000: 260 (2.2 GB swap) | 50,000 (32/64/100): 175 |
| Medium | 500,000 (24/64/80): 350 | 250,000: 120 | 100,000: 240 |
| Large | 1,000,000 (32/80/100): 270, 7 of 8 GB | 500,000: 160 | 224,482: 280, 8 GB |
| XL | 1M: 525 | 1M (32/80/200): 200, 13 GB | 500,000 (24/56/100): 360, 13 GB |
| 2XL | 790 | 340 | 1,000,000 (24/56/250): 560, 32 of 32 GB |
| 4XL | 1650 | 630 | 950 (1280 with m 32, efc 80) |
| 8XL | 2690 | 1100 | 1650 |
| 12XL | 3900 | 1420 | 1900 |
| 16XL | 4200 | 1650 | 2200 |

IVFFlat benchmarks (QPS):

| Compute | 384 dims, accuracy 0.98 | 384 dims, accuracy 0.99 |
|---|---|---|
| Micro | 100,000, lists 500, probes 50: 205 | 160 |
| Small | 250,000, lists 1000, probes 60: 160 | 100 |
| Medium | 500,000, lists 2000, probes 80: 120 | 85 |
| Large | 1M, lists 5000, probes 150: 75 (p95 0.375 s) | 50 |
| XL / 2XL / 4XL | 150 / 300 / 570 | 100 / 200 / 390 |
| 8XL / 12XL / 16XL | 1400 / 1550 / 1800 | 850 / 1000 / 1200 |

  The 0.99 column uses probes 70, 100, 120 and 250 for the Micro to Large sizes. At 960 and 1536 dims with probes 10 and lists = vectors / 1000: 960 dims runs from 75 QPS (Micro, 30,000) to 1345 (16XL, 1M); 1536 dims from 135 QPS (Micro, 20,000, mean latency 0.372 s) through 380 (2XL, 1M, lists 2000) to 1790 (16XL). At 1M vectors 10 probes gives accuracy 0.91 (0.95 to 0.99 at 500,000 and below); 40 probes reaches 0.98 at 140 QPS on 2XL and 670 on 16XL.

## Vecs (Python client)

- **For data science and ephemeral stores.** Production Python apps with versioned migrations should register the vector type with their ORM or driver through pgvector-python (Django, SQLAlchemy, SQLModel, psycopg, asyncpg, Peewee). Connect with the URI from the **Shared pooler** option under Connect.
- **Basics:** `pip install vecs` (Python 3.7+); `vx = vecs.create_client(DB_CONNECTION)`; `docs = vx.get_or_create_collection(name="docs", dimension=3)`; `docs.upsert(records=[("vec0", [0.1, 0.2, 0.3], {"year": 1973}), ...])` inserts or updates by id; `docs.delete(ids=[...])` or `docs.delete(filters={"year": {"$eq": 2012}})` (missing ids raise nothing). Close with `vx.disconnect()` or `with vecs.create_client(DB_CONNECTION) as vx:`. `create_collection` and `get_collection` are deprecated in favour of `get_or_create_collection`.
- **Query:** `docs.query(data=[0.4,0.5,0.6], limit=5, filters={}, measure="cosine_distance", include_value=False, include_metadata=False, include_vector=False)` returns ids. Without an index it warns `query does not have a covering index for cosine_similarity. See Collection.create_index`; never run unindexed in production.
- **Index:** `docs.create_index()`, one per collection (creating replaces it). Measures `vecs.IndexMeasure.cosine_distance` (default), `l2_distance`, `l1_distance`, `max_inner_product`; methods `vecs.IndexMethod.auto`, `hnsw`, `ivfflat`; parameters via `IndexArgsHNSW` or `IndexArgsIVFFlat`, as in `docs.create_index(method=IndexMethod.hnsw, measure=IndexMeasure.cosine_distance, index_arguments=IndexArgsHNSW(m=8))`. Uploading data creates an index with default parameters. IVFFlat needs data first and a rebuild once the collection more than doubles; HNSW works on an empty collection. Builds take under a minute for a few thousand records, a few minutes for more.
- **Metadata filters** (binary JSON; Boolean, String, Number; 1 GB per field): `$eq $ne $gt $gte $lt $lte $in $contains`, combined with nestable `$and` and `$or`. Scalar pairs with `$eq`, `$and` and `$or` use indexes most reliably.
- **Text in, text out:** `pip install "vecs[text_embedding]"` and `Adapter([ParagraphChunker(skip_during_query=True), TextEmbedding(model='all-MiniLM-L6-v2')])` (384 dims) to upsert and query with text.
- **Collection tables** are `create table <collection_name> (id string primary key, vec vector(<dimension>), metadata jsonb)` (the prewarm example puts them in schema `vecs`). Selecting from them outside Vecs is safe; running DDL on them is not recommended.
- **The docs disagree on method arguments:** the quick start uses `docs.upsert(vectors=...)` and a module-level `vecs.get_or_create_collection(...)`, the scaling guide `docs.query(query_vector=...)`, the API reference `upsert(records=...)` and `query(data=...)`. Check the current API reference for your version.

## Vector buckets (Storage, public alpha)

- **Status:** public alpha since December 2025 (dashboard management from 2025-11-26), Pro projects and above, limited regions, not available self-hosted. Every page warns of rapid changes, limited features and possible breaking updates, and the JS methods may not be available to every account type. Check the current docs before using it.
- **What it is:** S3-compatible storage holding indexes (each with a fixed dimension and distance metric), vectors and metadata, built for tens of millions of vectors per index with sub-second search. Use it for large-scale storage, backend processing and cases where speed matters less; use pgvector for prototypes, small volumes and user-facing, low-latency search. A documented hybrid keeps hot vectors in pgvector and archives in buckets, both queried from Postgres through the wrapper.
- **Hosted buckets run on Amazon S3 Vectors; local ones run on pgvector,** so behaviour and performance differ between environments.

| Limit (alpha defaults, adjustable on request) | Hosted | Local |
|---|---|---|
| Buckets per project | 10 | 10 |
| Indexes per bucket | 10 | 10 |
| Dimensions | 4096 | 4096 |
| Vectors per insert or update request | 1000 (see below) | 1000 |
| `topK` | 10,000 | 100 |
| Results per response | 100 | 100 |
| `nextToken` pagination | yes | rejected |

- **Batch size conflicts:** the limits page says 1000 per request; the creating, storing and intro pages say 500; the wrapper's `batch_size` allows 1 to 500 (default 300). Stay at 500 or below until the current docs agree.
- **Create a bucket and index** from Dashboard > Storage > Create Bucket > **Vector Bucket**, or from server code with a secret key:

```js
await supabase.storage.vectors.createBucket('embeddings')
await supabase.storage.vectors.from('embeddings').createIndex({
  indexName: 'documents-openai', dataType: 'float32', dimension: 1536, distanceMetric: 'cosine',
})
```

  Python: `supabase.storage.vectors().create_bucket('embeddings')` and `bucket.create_index(index_name='documents-openai', dimension=1536, distance_metric='cosine', data_type='float32')`. `metadataConfiguration: { nonFilterableMetadataKeys: ['raw_text'] }` marks keys you won't filter on. The launch post shows `createIndex('documents-openai', { ... })`; the reference uses the single-object form above.
The Storage guide also shows this creation form:

```js
supabase.storage.vectors.createBucket('embeddings')
supabase.storage.vectors.from('embeddings').createIndex({ indexName, dataType: 'float32', dimension: 1536, distanceMetric: 'cosine' })
```

- **Storage-specific limits:** PutVector bodies allow 20 MB (raised from 1.6 MB); the local CLI template sets `max_indexes = 5`, unlike the ten-index alpha limit above. [Supabase Storage/vector guides; existing STORAGE.md, Vector buckets]

- **Index settings are permanent:** dimension, distance metric and data type (only `float32`) can't change; a wrong dimension makes inserts and queries fail; deleting an index can't be undone. Cosine suits OpenAI, Cohere embed-english-v3.0, sentence-transformers and Google text-embedding-004; Llama 2 takes cosine or L2. Metrics offered: cosine, euclidean, L2.
- **Methods:** `listBuckets({ prefix })`, `getBucket(name)`, `deleteBucket(name)` (delete its indexes first), `bucket.listIndexes({ prefix })`, `bucket.getIndex(name)`, `bucket.deleteIndex(name)`, `index.putVectors({ vectors: [{ key, data: { float32: [...] }, metadata }] })` (insert or update by key), `index.getVectors({ keys, returnData, returnMetadata })`, `index.listVectors({ maxResults, nextToken, returnData, returnMetadata })`, `index.deleteVectors({ keys })`, `index.queryVectors({ queryVector: { float32 }, topK, filter, returnDistance, returnMetadata, nextToken })`.
- **Results rank by distance, lowest first;** convert with `similarity: 1 - result.distance`. Filters look like `{ category: 'electronics', in_stock: true, price: { $lte: 500 } }` and can apply before or after the similarity search. For more than 100 results, set `topK` up to 10,000 and loop on `nextToken` until the response omits it, keeping the other parameters unchanged.
- **Joining relational data:** query with `topK: 100`, then `supabase.from('documents').select('*').in('id', vectorResults.vectors.map((v) => v.metadata?.doc_id))` and merge.
- **Storing:** always batch (250 per batch is shown as good); keep metadata small, flat and consistently typed, since it comes back with every result; mark the fields you filter on; avoid `topK: 1000` with `returnData: true`.
- **Local development:** in `supabase/config.toml` set `[storage.vector] enabled = true` and declare buckets as `[storage.vector.buckets.documents-openai]`; create them with `supabase seed buckets` (local or linked project) on the latest CLI.
- **S3 Vectors wrapper (FDW):** `create extension if not exists wrappers with schema extensions;` and `create foreign data wrapper s3_vectors_wrapper handler s3_vectors_fdw_handler validator s3_vectors_fdw_validator;`. Server options: `vault_access_key_id` and `vault_secret_access_key` (otherwise credentials sit in plain text in `pg_catalog.pg_foreign_server`) or `aws_access_key_id` and `aws_secret_access_key`, plus `aws_region`, optional `endpoint_url` and `batch_size`. Foreign tables need `bucket_name`, `index_name` and `rowid_column`; import with `import foreign schema "my-vector-bucket" from server s3_vectors_server into s3_vectors;`.
- **Wrapper tables** are `key text not null, data s3vec not null, metadata jsonb` and support select, insert and delete only (update is delete plus insert; no truncate). `s3vec` is Float32 (`'[0.1, 0.2]'::s3vec`, shown as `s3vec:5`). Only these patterns push down: `data <==> vector`, `metadata <==> '{"price": {"$gte": 100, "$lte": 500}}'::jsonb` (`$eq $ne $gt $gte $lt $lte $in $nin $exists $and $or`), `key = ...`, `key in (...)`; other complex `where` clauses are unsupported. `s3vec_distance(data)` gives the distance only inside a `<==>` search (0.0 otherwise; lower is closer). Materialized views on these tables may fail during logical backups.
- **The docs disagree on the SQL surface:** the bucket guides use type `embd`, `embd_distance(data)`, `metadata->>'category' = ...` filters and joins; the wrapper reference uses `s3vec`, `s3vec_distance()` and `jsonb` filters and rules out complex `where` clauses. The intro writes the operator `<===>`, the examples `<==>`. Read the wrapper reference (`https://supabase.com/docs/guides/database/extensions/wrappers/s3_vectors.md`) before writing SQL against buckets.

## Prove it

Use the [vector bucket acceptance criteria](VECTORS.md#prove-it): the same local/hosted topK and pagination work within their stated limits, and batches stay within 500. Production sizing follows the workload benchmarks above.
