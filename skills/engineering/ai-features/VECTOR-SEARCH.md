# Vector search

An embedding model turns text (or an image) into a vector. Similar meanings land near each other, so "quick healthy breakfast ideas" finds "nutritious morning meals" with no shared words. Search embeds the query with the same model, compares it with the stored vectors and returns the nearest ones together with their original content.

What it's good for: search by meaning, the retrieval half of RAG, "more like this" recommendations, and finding near-duplicates. What it's weak at: exact identifiers (an ISBN, an order number, a SKU, an email) and hard constraints ("under $50", "in Hebrew", "published after 2020"). Those need an exact lookup, keyword search or filters.

## Three kinds of search, side by side

| | Matches | Misses |
|---|---|---|
| Keyword (`LIKE`, exact match) | the literal words | synonyms ("scarlet footwear" for "red shoes"), context, questions |
| Full-text (`tsvector`, stemming, ranking) | word forms, ranked by relevance | meaning beyond the words |
| Vector | related concepts, paraphrases, questions | exact codes, numbers, rare names |

Most real products need two of them. See hybrid search below.

## Design choices

- **What to embed:** the text a person would search by (title plus description, one section of a doc), not raw HTML or boilerplate. Keep the original text and source metadata beside the vector, since that is what you show.
- **Embedding models have an input limit.** A whole long article sent as one input is truncated or rejected, depending on the provider, and one vector for a long page blurs its topics. For page-level search, embed the title and summary or the opening; for passage-level search, chunk ([RAG.md](RAG.md)).
- **One model per index.** Dimensions and the distance metric are fixed when the column or index is created. Store the model name and version with each row. Queries must use the same model; vectors from different models are not comparable, unless the provider explicitly documents a shared embedding space across its models. Changing models means re-embedding everything, so plan a backfill and a switch-over.
- **Hide the provider behind one function** (`embedText(text): Promise<number[]>`) so a local model in development and a hosted one in production are a config change, not a rewrite. The model and dimensions still have to match the stored data.
- **Distance:** use the metric the model was trained for; cosine is the common default. For normalized vectors, inner product ranks the same as cosine and is cheaper.
- **Filters as a contract:** decide which fields searches can filter on (tenant, language, category, visibility) and store them as real columns or filter fields, not buried in text.
- **Exact vs approximate:** without an index the search is a sequential scan: exact, perfect recall, and fine for hundreds or a few thousand rows. An approximate nearest neighbor index (HNSW, IVFFlat) is fast at millions of rows but can miss true neighbors. Add one when measured latency needs it, and check its recall against exact search.

## Postgres with pgvector (Supabase)

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

- Locally, the `pgvector/pgvector:pg17` image is Postgres with the extension preinstalled (run it with docker compose).
- The main reason to stay in Postgres: vectors sit next to the relational data, so one query can join, filter by ordinary columns, and paginate, with no second store to sync. A dedicated vector database earns its place at a scale or feature set you've measured you need.
- Operators and their index operator classes: `<=>` cosine distance (`vector_cosine_ops`), `<->` Euclidean distance (`vector_l2_ops`), `<#>` negative inner product (`vector_ip_ops`). The index only helps a query that uses the operator matching its class. Similarity for cosine is `1 - (a <=> b)`.
- **Order by the distance expression itself** (`order by embedding <=> $1`), not by a computed similarity column, or the index isn't used.
- Expose search through a SQL function and call it with `supabase.rpc(...)`; apply ownership and visibility filters inside the function (row level security applies to functions with `security invoker`).
- **HNSW:** better recall and speed, more memory, can be created on an empty table. **IVFFlat:** faster to build and smaller, but it clusters the rows that exist when it's built. Building it on an empty table (a common tutorial shortcut) gives useless clusters; build it after loading representative data and rebuild as data grows. Indexed `vector` columns are limited to 2,000 dimensions (`halfvec` allows more).
- **Filters with an approximate index** can return fewer rows than requested, because the filter is applied after the index scan. Raise the search width (`hnsw.ef_search`) or use iterative scans in recent pgvector versions, and test filtered queries specifically.
- A similarity threshold (e.g. `> 0.78`) is data-specific. Pick it from your labeled set, never by copying a number.

## Convex

```ts
// schema.ts
documents: defineTable({
  text: v.string(),
  language: v.string(),
  ownerId: v.id("users"),
  embedding: v.array(v.float64()),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,                 // 2 to 2048, must match the model
  filterFields: ["language", "ownerId"],
}),

// search.ts (vector search runs in an action)
export const search = action({
  args: { query: v.string(), language: v.string() },
  handler: async (ctx, { query, language }) => {
    const vector = await embedText(query);  // same model as stored vectors
    const hits = await ctx.vectorSearch("documents", "by_embedding", {
      vector,
      limit: 16,                         // 1 to 256, default 10
      filter: (q) => q.eq("language", language),   // only q.eq and q.or over filterFields
    });
    // hits are { _id, _score }: load the documents with an internal query, keep the order
    return await ctx.runQuery(internal.documents.byIds, { ids: hits.map((h) => h._id) });
  },
});
```

Filters can only use the declared `filterFields` with equality and `or`. Range constraints (price, date) are applied after loading, so request more results than you show, or model the constraint as a filter field (a bucket).

## Dedicated vector stores

Managed vector stores (a vector database service, or a vector bucket type in object storage) follow the same rules: the index fixes dimensions and metric at creation, so one index per model; metadata stored with each vector is what you filter on; a query takes the vector, a `topK`, and flags for returning metadata and distance. Large text that is only displayed, never filtered on, can be marked non-filterable where the store supports it. Write vectors in batches, not one call per item. If a working vector store is already in place, a cheaper one rarely justifies the migration on its own. Vendor claims about cost and latency are tied to the announcement date and preview status; check current pricing and measure query latency against your own target before choosing one over Postgres.

## Keeping the index current

Re-embed when content changes, not on a nightly guess. For content that ships through a deploy (docs, a blog), run the indexing step in CI on publish; for user content, enqueue an embed job on write (see [AI-JOBS.md](AI-JOBS.md)). Skip unchanged items by storing a content hash with the vector. Deleting content deletes its vectors.

## Hybrid search

When users search both by meaning and by exact terms, run keyword or full-text search and vector search separately and merge the ranked lists with reciprocal rank fusion: each result scores `1 / (k + rank)` in each list it appears in (k around 50 to 60), summed, highest first. In Postgres that is a `tsvector` column with full-text search plus the vector query in one SQL function.

Don't merge by adding raw scores (`0.7 * cosine + 0.3 * ts_rank`): the two scores live on different scales, so the weights don't mean what they look like they mean. Fuse by rank, and weight the two lists only if your evaluation shows one matters more. Exact identifiers are better matched first with an exact lookup, before any ranking.

## Evaluating it

Build a set of queries with the expected results, mixing:
- paraphrases of a theme ("a story about a robot learning to feel"),
- exact identifiers (an ISBN, a code),
- constrained queries ("in Hebrew", "for children"),
- queries with no right answer.

For each change (model, index, threshold, chunking, filter), measure how often the expected item appears in the top k (recall at k) and where it ranks, for vector, keyword and hybrid side by side, and compare the approximate index against exact search on the same queries. Measure query latency at your real data size against a stated target. Record the model and index settings with the numbers.
