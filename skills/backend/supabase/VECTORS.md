# Vectors and AI

Supabase does vector search inside Postgres with the pgvector extension (`vector`), so embeddings live next to the rows they describe, RLS filters similarity searches like any other select, and the SQL function you write decides whether the index is used. Most outcomes come down to three matches: the same embedding model for stored and query vectors, the index operator class matching the query's distance operator, and the `order by` sorting on that operator directly. Vector buckets (Storage, public alpha) are a separate, slower store for large volumes; the last sections cover them.

## How search works

- **The flow:** split the knowledge base into pages and embed each one, store the embeddings, embed the user's input once at query time, run a similarity search, return the most similar pages.
- **Three kinds of search:** semantic (by meaning, vectors), keyword (words and phrases, Postgres full-text search) and hybrid (both, fused). Keyword wins for exact terminology and identifiers (code, error messages); semantic for meaning (feeling-based forums); hybrid for mixed cases such as shopping.
- **One model for everything you compare.** Vectors from different models give meaningless similarities.
- **Fewer dimensions perform best.** Dimension count is the biggest factor in compute size: a 1536-dimension vector is about 6.15 KB, so 1M of them pass 6 GB, and indexes should fit in memory. `gte-small` (384 dims) scores 61.36 average on MTEB against 60.99 for `text-embedding-ada-002` (1536). Models that support shortening (Matryoshka embeddings, for example `text-embedding-3-large` with `dimensions`) trade little quality for speed and memory.

## Setup: extension, types, operators

- **Enable it** from Dashboard > Database > Extensions (search "vector") or in SQL: `create extension vector with schema extensions;`. Disable: `drop extension if exists vector;`.
- **Declare the column with the model's dimension,** schema-qualified as the docs do: `embedding extensions.vector(384)` for `gte-small`.
- **`halfvec` stores 16-bit floats** to save space, for example `halfvec(1536)` for `text-embedding-3-small`. `bit` exists for very high dimensions (index limit only).
- **Check the version** with `select * from pg_extension where extname = 'vector';` or the Dashboard Extensions tab. Older versions upgrade from project settings > General; getting pgvector 0.8.0 may require upgrading the Postgres version in Infrastructure settings.

| Operator | Meaning | Index operator class |
|---|---|---|
| `<->` | Euclidean (L2) distance | `vector_l2_ops` |
| `<#>` | negative inner product | `vector_ip_ops` |
| `<=>` | cosine distance | `vector_cosine_ops` (`halfvec_cosine_ops` for `halfvec`) |

- **Pick the operator by normalization.** Inner product is fastest when vectors are normalized (OpenAI embeddings are); cosine is the safe default when you don't know, and gives the best results with an index on unnormalized vectors. On normalized vectors cosine and inner product rank identically.
- **Structured or unstructured metadata:** dedicated columns can be filtered, constrained, indexed and migrated; a `jsonb` column suits user-defined or unknown fields and prototypes but pushes integrity into app code. Combining both (known fields as columns plus `meta jsonb`) works. A client library that creates tables for you (Vecs) emits DDL: copy that SQL into your migrations before production.

## Querying from a client: wrap it in a function

- **The Data API (PostgREST) does not support pgvector operators.** Write a Postgres function and call it with `rpc()`.

```sql
create or replace function match_documents (
  query_embedding extensions.vector(384),
  match_threshold float,
  match_count int
)
returns table (id bigint, title text, body text, similarity float)
language sql stable
as $$
  select documents.id, documents.title, documents.body,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by (documents.embedding <=> query_embedding) asc
  limit match_count;
$$;
```

```js
const { data: documents } = await supabaseClient.rpc('match_documents', {
  query_embedding: embedding, match_threshold: 0.78, match_count: 10,
})
```

- **`order by` the distance expression itself,** never the computed `similarity` column, or the planner may ignore the index.
- **Returning `setof documents` and capping the count** is the other documented shape. `match_threshold` runs from 1 (most similar) to -1; pick it by testing on your data (0.78 is only an example). The function may return fewer rows than `match_count`; the cap of 200 guards the database.

```sql
create or replace function match_documents (
  query_embedding extensions.vector(512),
  match_threshold float,
  match_count int
)
returns setof documents
language sql
as $$
  select *
  from documents
  where documents.embedding <=> query_embedding < 1 - match_threshold
  order by documents.embedding <=> query_embedding asc
  limit least(match_count, 200);
$$;
```

  Inner-product version: `where documents.embedding <#> query_embedding < -match_threshold order by documents.embedding <#> query_embedding asc` (negate the threshold because `<#>` is negative).
- **From SQL,** `select * from match_documents('[...]'::extensions.vector(512), 0.78, 10);`, with parameters bound when called from a Postgres client.
- **Filters go inside the function.** `.eq()` chained after `rpc()` is applied to the function's output after it has ranked and limited, so the planner can't use it and a selective filter leaves fewer than `match_count` rows. Add a parameter instead: `filter_category text` with `where documents.category = filter_category and documents.embedding <=> query_embedding < 1 - match_threshold`, or `where documents.metadata @> filter_metadata and ...` for `jsonb`; call with `filter_category: 'blog'`. Chaining `.select()` and `.limit()` after a `setof` function is fine.

## Indexes

- **No index means a sequential scan:** exact results, not bound by RAM, but higher latency and lower throughput (extra CPU cores raise QPS, not latency). Skipping the index is reasonable for a small dataset, low vector QPS, or when you need 100% accuracy. Indexes give lower latency and higher throughput, need RAM for caching, and return approximate (ANN) results, so results change slightly once one exists.
- **HNSW is the default choice:** better performance and robust to changing data. Build it right after creating the table; new rows fill it and it stays optimal.
- **The index serves only queries that use its operator.** Create the operator class that matches the query: `create index on items using hnsw (column_name vector_cosine_ops);` (or `vector_l2_ops`, `vector_ip_ops`). An index on `vector_ip_ops` needs queries with `<#>`; switching to `<=>` means rebuilding the index. When unsure, `vector_cosine_ops` is the most common.
- **Dimension limits for indexing (pgvector 0.7.0+):** `vector` 2,000, `halfvec` 4,000, `bit` 64,000. Above 2,000 dims, index a `halfvec` cast:

```sql
CREATE TABLE documents (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    content text,
    embedding vector(3072)
);
CREATE INDEX ON documents
    USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
```

  Above 4,000, reduce dimensions.

| HNSW parameter | Default | Meaning and guidance |
|---|---|---|
| `m` | 16 | links per new element; reasonable 2 to 100, start at 12 to 48 |
| `ef_construction` | 64 | build-time candidate list; at least `2 * m`; gains flatten past some point. Measure accuracy with `ef_search` = `ef_construction`; below 0.9 leaves room to improve |
| `ef_search` | 40 | query-time list; higher is more accurate and slower |

- **Higher `m` and `ef_construction` buy QPS** by allowing a smaller `ef_search`, at the cost of slower builds: on 1M OpenAI embeddings, 32/80 gave 35% more QPS than 24/56.
- **IVFFlat** clusters vectors into lists and searches only nearby ones: `create index on items using ivfflat (column_name vector_cosine_ops) with (lists = 100);`. Build it only after the table holds representative data (on an empty table recall drops sharply), and rebuild when the distribution changes significantly or the data more than doubles.
- **`ivfflat.probes` defaults to 1;** raise it per session (`set ivfflat.probes = 10;`) or per transaction (`begin; set local ivfflat.probes = 10; select ...; commit;`). Higher is slower and more accurate. When `probes` equals `lists` the planner does an exact search and skips the index.
- **`lists` guidance conflicts across pages.** The IVFFlat page says more lists speed queries at the expense of recall; the production guide says more lists build slower but can give better QPS and accuracy, while needing more probes for the same accuracy. Benchmark, and check the current docs. One page's recap also frames IVFFlat as the fit for 100k to 10M rows while the index pages recommend HNSW in general; follow the HNSW recommendation unless you've measured otherwise.

### Filtering with an index

- **A `where` clause does not bypass the index.** The planner picks index or sequential scan by selectivity and table size; with the index, the filter applies to candidates as they come back, so `select * from items where category_id = 123 order by embedding <-> '[3,1,2]' limit 5;` can return fewer than 5 rows (HNSW and IVFFlat).
- **pgvector 0.8.0+ has iterative scans** for HNSW: `hnsw.iterative_scan` (default `off`; `strict_order` keeps exact ordering, `relaxed_order` reorders slightly for better recall), bounded by `hnsw.max_scan_tuples` (default 20,000) and `hnsw.scan_mem_multiplier` (default 1). The Supabase guides don't document the IVFFlat equivalents.

### Building a large index

- **The Dashboard SQL editor stops queries after about 2 minutes.** Build large indexes from `psql` or another external client: the Session pooler (port 5432), or the direct connection if your network has IPv6 (`curl -6 https://ifconfig.co/ip` prints an address).
- **Then, in that session:**

```sql
set maintenance_work_mem to '<several GB>';
show maintenance_work_mem;
set max_parallel_maintenance_workers to <integer>;   -- about 1/2 to 2/3 of the compute's cores
show max_parallel_maintenance_workers;
set statement_timeout = '0';
show statement_timeout;
```

- **Upgrade pgvector to 0.6+ first:** it builds HNSW in parallel. One benchmark built 1M x 1536 in 9.5 minutes, 9 times faster, with `maintenance_work_mem` 30GB on 4XL. The platform default for `max_parallel_maintenance_workers` is CPU count / 2; worker count doesn't change accuracy or QPS. No documented formula gives the memory an HNSW build needs.
- **Leave disk headroom:** HNSW builds can write a few GB of temporary files; raise disk size in Infrastructure settings if needed. Temporarily upgrading compute (billed hourly) and scaling down afterwards also works. Unlogged tables build faster when embeddings can be regenerated.
- **Locking:** building without `CONCURRENTLY` locks the table. The troubleshooting guide's sentence about build time next to it is ambiguous; check the current docs.
- **Project-wide settings without a restart:** `supabase postgres-config update --project-ref <project-ref> --experimental --config maintenance_work_mem=512MB` (likewise `max_parallel_maintenance_workers=2`); needs Owner or Administrator in the organization.
- **OrioleDB (public beta)** supports HNSW only experimentally.

## Hybrid search (full-text plus vectors)

- **Each search runs separately, then Reciprocal Rank Fusion merges them:** a row scores the sum of `1 / (k + rank)` over the lists it appears in (0 where absent). With k = 1 the top rank scores 0.5.

```sql
create table documents (
  id bigint primary key generated always as identity,
  content text,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding extensions.vector(512)
);
create index on documents using gin(fts);
create index on documents using hnsw (embedding vector_ip_ops);

create or replace function hybrid_search(
  query_text text,
  query_embedding extensions.vector(512),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns setof documents
language sql
as $$
with full_text as (
  select
    id,
    -- Note: ts_rank_cd is not indexable but will only rank matches of the where clause
    -- which shouldn't be too big
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from documents
  where fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> query_embedding) as rank_ix
  from documents
  order by rank_ix
  limit least(match_count, 30) * 2
)
select documents.*
from full_text
  full outer join semantic on full_text.id = semantic.id
  join documents on coalesce(full_text.id, semantic.id) = documents.id
order by
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
  desc
limit least(match_count, 30)
$$;
```

- **Parameters:** `query_text`, `query_embedding` (same model and dimension as the column) and `match_count` are required; weights default to 1 (2 vs 1 gives full-text twice the weight), `rrf_k` to 50. Results cap at 30; each side fetches twice that. Call: `select * from hybrid_search('Italian recipes with tomato sauce', '[...]'::extensions.vector(512), 10);`.
- **From an Edge Function:** embed the query with `text-embedding-3-large` and `dimensions: 512`, then `supabase.rpc('hybrid_search', { query_text: query, query_embedding: embedding, match_count: 10 })`. Use the user's JWT instead of the secret key when RLS should apply. The docs' version of this function creates the client with an undefined variable (`supabaseServiceRoleKey` where it declared `supabaseSecretKey`); don't copy it as is.
- **Test locally:** `curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hybrid-search' --header 'Authorization: Bearer <anonymous key>' --header 'Content-Type: application/json' --data '{"query":"Italian recipes with tomato sauce"}'`.

## Generating embeddings

- **In Edge Functions, `gte-small` is built in** (Edge Runtime v1.36.0+) and is the only supported embedding model: 384 dims, English only, input truncated to 512 tokens. No package to install; types come from `import 'jsr:@supabase/functions-js/edge-runtime.d.ts'`. A typical request runs under 1 s even cold and uses 100 to 200 ms of CPU.
- **Create the session once at module scope;** requests share it.

```ts
const session = new Supabase.ai.Session('gte-small');
Deno.serve(async (req) => {
  const { input } = await req.json();
  const embedding = await session.run(input, { mean_pool: true, normalize: true });
  return new Response(JSON.stringify({ embedding }), { headers: { 'Content-Type': 'application/json' } });
});
```

  `mean_pool` pools token embeddings into one sentence embedding; `normalize` makes it unit length so inner product works. Newer docs write the handler with `npm:@supabase/server@^1`: `export default { fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => ...) }`, returning `Response.json(await model.run(input, { mean_pool: true, normalize: true }))`. Check the current docs for which style to use.
- **Test locally:** `supabase functions serve`, then `curl --request POST 'http://localhost:54321/functions/v1/embed' --header 'Content-Type: application/json' --header 'apikey: SUPABASE_PUBLISHABLE_KEY' --data '{ "input": "hello world" }'` with the key from `supabase status`.
- **LLMs through `Supabase.ai.Session`** need your own Ollama or Llamafile server named by the function secret `AI_INFERENCE_API_HOST` (locally `http://host.docker.internal:11434`; deployed `supabase secrets set AI_INFERENCE_API_HOST=https://path-to-your-llm-server/`). Options: `{ stream: false, timeout: 30 }`, `{ stream: true, mode: 'ollama' }`, `mode: 'openaicompatible'` for Llamafile (default `'ollama'`). Hosted LLM inference is early access only.
- **Outside Edge Functions,** call an embedding API (OpenAI `text-embedding-3-small`, 1536 dims) or run Transformers.js in the browser or Node:

```js
import { pipeline } from '@huggingface/transformers'
const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small')
const output = await generateEmbedding(body, { pooling: 'mean', normalize: true })
const embedding = Array.from(output.data)
const { data, error } = await supabase.from('documents').insert({ title, body, embedding })
```

  The pgvector extension page imports the same code from `@xenova/transformers`, the older package name.
- **Database webhook pattern:** a table `embeddings (id bigint identity primary key, content text not null, embedding extensions.vector(384))` with RLS enabled and `create index on embeddings using hnsw (embedding vector_ip_ops);`. A webhook function with `withSupabase({ auth: 'secret' }, ...)` (deployed with `verify_jwt = false`, since the webhook authenticates with a secret key) runs `model.run(content, { mean_pool: true, normalize: true })` and writes `ctx.supabaseAdmin.from('embeddings').update({ embedding: JSON.stringify(embedding) }).eq('id', id)`. Search with `query_embeddings(embedding extensions.vector(384), match_threshold float) returns setof embeddings` using `<#>`, called as `ctx.supabase.rpc('query_embeddings', { embedding, match_threshold: 0.8 }).select('content').limit(3)` inside `withSupabase({ auth: 'user' }, ...)`.

## Automatic embeddings (keep vectors in sync)

Full-text columns stay in sync synchronously with triggers; embeddings need an API call, so this pipeline queues work: a trigger enqueues a job in pgmq, pg_cron runs a batcher every 10 seconds, pg_net posts batches to one `embed` Edge Function, and the function writes vectors and deletes finished jobs. One queue and one function serve any table. Read the full guide before building it (`https://supabase.com/docs/guides/ai/automatic-embeddings.md`); the pieces:

```sql
create extension if not exists vector with schema extensions;
create extension if not exists pgmq;          -- creates its own schema
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;       -- creates its own schema
create extension if not exists hstore with schema extensions; -- for clearing embeddings during updates

create schema util;

create function util.project_url()
returns text
language plpgsql
security definer
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value from vault.decrypted_secrets where name = 'project_url';
  return secret_value;
end;
$$;

create or replace function util.invoke_edge_function(
  name text,
  body jsonb,
  timeout_milliseconds int = 5 * 60 * 1000  -- default 5 minute timeout
)
returns void
language plpgsql
as $$
declare
  headers_raw text;
  auth_header text;
begin
  -- If we're in a PostgREST session, reuse the request headers for authorization
  headers_raw := current_setting('request.headers', true);
  auth_header := case
    when headers_raw is not null then (headers_raw::json->>'authorization')
    else null
  end;
  perform net.http_post(
    url => util.project_url() || '/functions/v1/' || name,
    headers => jsonb_build_object('Content-Type', 'application/json', 'Authorization', auth_header),
    body => body,
    timeout_milliseconds => timeout_milliseconds
  );
end;
$$;

create or replace function util.clear_column()
returns trigger
language plpgsql as $$
declare
    clear_column text := TG_ARGV[0];
begin
    NEW := NEW #= hstore(clear_column, NULL);
    return NEW;
end;
$$;

select pgmq.create('embedding_jobs');
```

- **Store the project URL in Vault.** Locally, in `supabase/seed.sql`: `select vault.create_secret('http://api.supabase.internal:8000', 'project_url');`. On the hosted project, in the SQL editor: `select vault.create_secret('<project-url>', 'project_url');`.
- **`util.queue_embeddings()`** (`security definer`, `set search_path = ''`) is the trigger function: it takes the content function name (`TG_ARGV[0]`) and the embedding column (`TG_ARGV[1]`), sends `{ id, schema, table, contentFunction, embeddingColumn }` to `embedding_jobs`, and needs `for each row`.
- **`util.process_embeddings(batch_size int = 10, max_requests int = 10, timeout_milliseconds int = 5 * 60 * 1000)`** reads up to `max_requests * batch_size` jobs with a visibility timeout of `timeout_milliseconds / 1000` seconds, tags each with `jobId` (the `msg_id`), and calls `embed` once per batch. Schedule it:

```sql
select cron.schedule('process-embeddings', '10 seconds', $$ select util.process_embeddings(); $$);
```

- **Why batches and a queue:** one request for everything times out, one per row hits API rate limits. A read job stays hidden for the visibility timeout; if it isn't deleted by then it reappears and the next cron run retries it. Tune `batch_size`, `max_requests` and `timeout_milliseconds` from the 10-second starting point.
- **The `embed` function** (`supabase functions new embed`) connects with the built-in `SUPABASE_DB_URL`, validates the body as an array of `{ jobId, id, schema, table, contentFunction, embeddingColumn }` (405 for non-POST, 400 for bad JSON or shape), selects `<contentFunction>(t)` for the row, embeds it with `text-embedding-3-small`, updates the column, then `pgmq.delete`s the job. It errors with `row not found` or `invalid content - expected string`. It races the work against `beforeunload`, so jobs left when the worker is killed (wall clock limit) are reported failed. It always answers `200` with `{ completedJobs, failedJobs }` and headers `x-completed-jobs` and `x-failed-jobs`; one failed job doesn't affect the others.
- **Secrets:** `OPENAI_API_KEY=your-api-key` in a local `.env`; deploy with `supabase secrets set --env-file .env` or `supabase secrets set OPENAI_API_KEY=<your-api-key>`.
- **Wire up a table.** It must have a primary key named `id`. With 1536-dim `halfvec`, queries must use `<=>` to match `halfvec_cosine_ops`, and HNSW indexes `halfvec` up to 4,000 dims.

```sql
create table documents (
  id integer primary key generated always as identity,
  title text not null,
  content text not null,
  embedding halfvec(1536),
  created_at timestamp with time zone default now()
);
create index on documents using hnsw (embedding halfvec_cosine_ops);

create or replace function embedding_input(doc documents)
returns text
language plpgsql
immutable
as $$
begin
  return '# ' || doc.title || E'\n\n' || doc.content;
end;
$$;

create trigger embed_documents_on_insert
  after insert on documents for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');

create trigger embed_documents_on_update
  after update of title, content -- must match the columns in embedding_input()
  on documents for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');
```

- **A new row's `embedding` is `null` until the next cron run** (up to 10 seconds). After an update the old vector stays until the job runs. To clear it instead (always in sync, but rows briefly vanish from search), add a `before` trigger on a nullable column:

```sql
create trigger clear_document_embedding_on_update
  before update of title, content -- must match the columns in embedding_input()
  on documents for each row
  execute function util.clear_column('embedding');
```

- **Edge Function limits bound the worker:**

| Limit | Value |
|---|---|
| Memory | 256 MB |
| Wall clock | 150 s Free, 400 s paid |
| CPU time per request | 2 s (async I/O excluded) |
| Request idle timeout | 150 s, then 504 |
| Secrets | 100 per project; names can't start with `SUPABASE_` |

## RAG with permissions

- **RLS filters similarity search like any select.** Embeddings sit in Postgres, so a policy decides which sections a user's search can return:

```sql
create table documents (
  id bigint primary key generated always as identity,
  name text not null,
  owner_id uuid not null references auth.users (id) default auth.uid(),
  created_at timestamp with time zone not null default now()
);
create table document_sections (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id),
  content text not null,
  embedding extensions.vector (384)
);

GRANT SELECT ON public.document_sections TO authenticated;
alter table document_sections enable row level security;
create policy "Users can query their own document sections"
on document_sections for select to authenticated using (
  document_id in (
    select id from documents where (owner_id = (select auth.uid()))
  )
);
```

  This covers `select` only; add insert, update and delete policies separately. Grants, policies and function rules are in SECURITY.md.
- **Many owners per document:** a `document_owners (id, owner_id uuid references auth.users default auth.uid(), document_id bigint references documents)` join table, with the policy reading `select document_id from document_owners where (owner_id = (select auth.uid()))`.
- **Permissions from another database:** `create extension postgres_fdw with schema extensions;`, a server and `create user mapping for authenticated server foreign_server options (user 'postgres', password '<user-password>');` (a minimum-privilege user in production), then `import foreign schema public limit to (users, documents) from server foreign_server into external;`. Foreign tables can't be FK targets, so `document_sections.document_id` has no FK and must match the external ID type. RLS is latency-sensitive: check the query plan before relying on FDW-backed policies.
- **Direct Postgres connections:** the policy reads `owner_id = current_setting('app.current_user_id')::bigint`, and every request runs `set app.current_user_id = '<current-user-id>';`. Keep RLS rather than `where` filters in app code, because RLS keeps applying to queries written later.
- **Custom JWT providers through the REST API** reuse the `auth.uid()` policy: `auth.uid()` reads `current_setting('request.jwt.claim.sub')`, set at the start of each request.

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
- **Index settings are permanent:** dimension, distance metric and data type (only `float32`) can't change; a wrong dimension makes inserts and queries fail; deleting an index can't be undone. Cosine suits OpenAI, Cohere embed-english-v3.0, sentence-transformers and Google text-embedding-004; Llama 2 takes cosine or L2. Metrics offered: cosine, euclidean, L2.
- **Methods:** `listBuckets({ prefix })`, `getBucket(name)`, `deleteBucket(name)` (delete its indexes first), `bucket.listIndexes({ prefix })`, `bucket.getIndex(name)`, `bucket.deleteIndex(name)`, `index.putVectors({ vectors: [{ key, data: { float32: [...] }, metadata }] })` (insert or update by key), `index.getVectors({ keys, returnData, returnMetadata })`, `index.listVectors({ maxResults, nextToken, returnData, returnMetadata })`, `index.deleteVectors({ keys })`, `index.queryVectors({ queryVector: { float32 }, topK, filter, returnDistance, returnMetadata, nextToken })`.
- **Results rank by distance, lowest first;** convert with `similarity: 1 - result.distance`. Filters look like `{ category: 'electronics', in_stock: true, price: { $lte: 500 } }` and can apply before or after the similarity search. For more than 100 results, set `topK` up to 10,000 and loop on `nextToken` until the response omits it, keeping the other parameters unchanged.
- **Joining relational data:** query with `topK: 100`, then `supabase.from('documents').select('*').in('id', vectorResults.vectors.map((v) => v.metadata?.doc_id))` and merge.
- **Storing:** always batch (250 per batch is shown as good); keep metadata small, flat and consistently typed, since it comes back with every result; mark the fields you filter on; avoid `topK: 1000` with `returnData: true`.
- **Local development:** in `supabase/config.toml` set `[storage.vector] enabled = true` and declare buckets as `[storage.vector.buckets.documents-openai]`; create them with `supabase seed buckets` (local or linked project) on the latest CLI.
- **S3 Vectors wrapper (FDW):** `create extension if not exists wrappers with schema extensions;` and `create foreign data wrapper s3_vectors_wrapper handler s3_vectors_fdw_handler validator s3_vectors_fdw_validator;`. Server options: `vault_access_key_id` and `vault_secret_access_key` (otherwise credentials sit in plain text in `pg_catalog.pg_foreign_server`) or `aws_access_key_id` and `aws_secret_access_key`, plus `aws_region`, optional `endpoint_url` and `batch_size`. Foreign tables need `bucket_name`, `index_name` and `rowid_column`; import with `import foreign schema "my-vector-bucket" from server s3_vectors_server into s3_vectors;`.
- **Wrapper tables** are `key text not null, data s3vec not null, metadata jsonb` and support select, insert and delete only (update is delete plus insert; no truncate). `s3vec` is Float32 (`'[0.1, 0.2]'::s3vec`, shown as `s3vec:5`). Only these patterns push down: `data <==> vector`, `metadata <==> '{"price": {"$gte": 100, "$lte": 500}}'::jsonb` (`$eq $ne $gt $gte $lt $lte $in $nin $exists $and $or`), `key = ...`, `key in (...)`; other complex `where` clauses are unsupported. `s3vec_distance(data)` gives the distance only inside a `<==>` search (0.0 otherwise; lower is closer). Materialized views on these tables may fail during logical backups.
- **The docs disagree on the SQL surface:** the bucket guides use type `embd`, `embd_distance(data)`, `metadata->>'category' = ...` filters and joins; the wrapper reference uses `s3vec`, `s3vec_distance()` and `jsonb` filters and rules out complex `where` clauses. The intro writes the operator `<===>`, the examples `<==>`. Read the wrapper reference (`https://supabase.com/docs/guides/database/extensions/wrappers/s3_vectors.md`) before writing SQL against buckets.

## Debugging

- **Index ignored:** `order by` sorts on a computed similarity instead of the operator; the operator class doesn't match the query operator; IVFFlat `probes` equals `lists`. Read the plan with `explain`.
- **Fewer rows than asked for:** an approximate index plus a filter. Move filters into the SQL function and turn on `hnsw.iterative_scan` (0.8.0+).
- **Index build times out in the Dashboard:** the ~2 minute limit; build from `psql` with the settings above.
- **"Too many dimensions" for an index:** cast to `halfvec` (up to 4,000) or shorten the embeddings.
- **Poor IVFFlat recall:** built on an empty or small table, or the data changed a lot since; rebuild.
- **Similarities look random:** query and stored vectors came from different models.
- **Automatic embeddings stay `null`:** `select * from net._http_response where (headers->>'x-failed-jobs')::int > 0;` and read `failedJobs[].error` in the body; trace a call with its `x-deno-execution-id` in the function logs. Failures come from the embedding API, the database connection, the worker hitting its wall clock, or any thrown error. Check the `project_url` Vault secret (locally `http://api.supabase.internal:8000`) and that the primary key is named `id`.
- **Slow first queries:** cold cache; `pg_prewarm` the index and warm up.
- **Search returns other users' rows, or nothing:** the RLS policy or the `GRANT SELECT ... TO authenticated`; on direct connections, `app.current_user_id` isn't set.
- **Bucket query works locally but not hosted, or the reverse:** local is pgvector with `topK` at most 100 and no `nextToken`.

## Prove it

- **The index is used:** `explain` the function's query with a real embedding and see the HNSW or IVFFlat index, not a sequential scan.
- **Filters return full pages:** call the search function with a selective filter and `match_count` 10 and get 10 rows when at least 10 matching rows exist.
- **Permissions hold:** run the search as two signed-in users (SECURITY.md's `set local role authenticated` block) and see each get only their own sections; as `anon`, none.
- **One model throughout:** the column's dimension, the function's parameter type and the model's output dimension are the same number.
- **Automatic embeddings work:** insert a row, wait past one cron interval, and see `embedding` filled; `net._http_response` shows no responses with `x-failed-jobs` above 0.
- **Vector buckets:** the code that runs locally also runs against the hosted project with the same `topK` and pagination, and batches stay within 500.
