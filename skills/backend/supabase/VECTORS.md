# Vectors and AI

Supabase does vector search inside Postgres with the pgvector extension (`vector`), so embeddings live next to the rows they describe, RLS filters similarity searches like any other select, and the SQL function you write decides whether the index is used. Most outcomes come down to three matches: the same embedding model for stored and query vectors, the index operator class matching the query's distance operator, and the `order by` sorting on that operator directly. Vector buckets (Storage, public alpha) are a separate, slower store for large volumes; [VECTORS-SCALE-AND-STORAGE.md](VECTORS-SCALE-AND-STORAGE.md#vector-buckets-storage-public-alpha) covers them.

**Contents:** [How search works](#how-search-works) · [Setup: extension, types, operators](#setup-extension-types-operators) · [Querying from a client: wrap it in a function](#querying-from-a-client-wrap-it-in-a-function) · [Indexes](#indexes) · [Hybrid search (full-text plus vectors)](#hybrid-search-full-text-plus-vectors) · [Generating embeddings](#generating-embeddings) · [Automatic embeddings (keep vectors in sync)](#automatic-embeddings-keep-vectors-in-sync) · [RAG with permissions](#rag-with-permissions) · [Production and compute sizing](VECTORS-SCALE-AND-STORAGE.md#production-and-compute-sizing) · [Vecs (Python client)](VECTORS-SCALE-AND-STORAGE.md#vecs-python-client) · [Vector buckets (Storage, public alpha)](VECTORS-SCALE-AND-STORAGE.md#vector-buckets-storage-public-alpha) · [Debugging](#debugging) · [Prove it](#prove-it)

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

### Model-tracked index example

The generic AI search guide uses this original schema/query form to keep the model/version alongside indexed content:

```sql
create extension if not exists vector with schema extensions;

create table documents (
  id bigint primary key generated always as identity,
  owner_id uuid not null,
  language text not null,
  content text not null,
  embedding extensions.vector(1536) not null,   -- dimensions must match the model
  embedding_model text not null                  -- e.g. 'text-embedding-3-small@2024'
);

create index on documents using hnsw (embedding vector_cosine_ops);

-- nearest neighbours, closest first
select id, content, embedding <=> $1 as distance
from documents
order by embedding <=> $1
limit 10;
```

- Locally, the `pgvector/pgvector:pg17` image includes the extension and runs through Docker Compose.
- Keeping vectors beside relational data permits joins/filters without a second store to sync. A dedicated vector database needs a measured scale/feature reason.
- Pick similarity thresholds from the labeled search set rather than a copied value. [Existing ai-features/VECTOR-SEARCH.md, Postgres with pgvector (Supabase)]

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

**Moved:** production and compute sizing, the Vecs Python client and vector buckets is now in [VECTORS-SCALE-AND-STORAGE.md](VECTORS-SCALE-AND-STORAGE.md).

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
