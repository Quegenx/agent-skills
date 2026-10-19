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

See [Supabase/pgvector schema, operators, indexes, filters and RPC contracts](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/VECTORS.md).

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

## Memory and compression

Vectors are big: rows × dimensions × 4 bytes as float32. Ten million 768-dimension vectors are about 31 GB before any index; at 1,536 dimensions, 100,000 rows are about 600 MB. Work the number out before choosing where the index lives.

| Representation | Size per value | Loss | Notes |
|---|---|---|---|
| float32 | 4 bytes | none | the reference to measure the others against |
| half precision (`halfvec` in pgvector) | 2 bytes | barely measurable for search | also lifts the indexed dimension limit (to 4,000) |
| 4-bit codes | half a byte | small; check on your data | 8× smaller than float32 |
| 2-bit codes | a quarter byte | larger, worse on low-dimension vectors | 16× smaller |
| 1 bit (sign only, binary quantization) | an eighth of a byte | large on its own | only as a first pass, rescored (below) |

- **Search the compressed form first, then rescore exactly:** take a generous shortlist from the cheap codes (a few hundred, or a multiple of `k`), then order that shortlist by the full-precision distance. The returned scores are exact; what can change is which items made the shortlist, so measure it.

```sql
-- pgvector: a bit index for the first pass, the original vectors to rescore
create index on documents using hnsw ((binary_quantize(embedding)::bit(1536)) bit_hamming_ops);

select * from (
  select id, content, embedding from documents
  order by binary_quantize(embedding)::bit(1536) <~> binary_quantize($1)
  limit 200
) shortlist
order by embedding <=> $1
limit 10;
```

- **Quantizers that need no training** (a fixed random rotation of every vector, then a codebook derived from the resulting known distribution) take new vectors at once and delete them in microseconds; codebooks trained on your data (product quantization) need a representative sample up front and drift as the data changes.
- **When a quantizer offers a calibration fit,** run it once on a random, representative sample (about a thousand rows) before loading. Calibrating after a large ingest re-quantizes what was already quantized and costs recall; a fit on a biased sample clipped values that no later fit recovers. Keep the original vectors (or the source text) so you can rebuild.
- **Normalise for cosine** when the index scores by inner product, and store the length separately if magnitude matters.
- **Measure recall against exact search on your own vectors,** at the `k` you serve, with the bit width you plan to ship. Published numbers come from other embeddings; low-dimension and tightly bunched corpora (where most vectors point the same way) lose more.

### A flat scan of compressed codes or a graph index

A scan of compressed codes reads every vector, so its cost grows in a straight line with the corpus: well under a millisecond per query at a hundred thousand vectors on a few cores, still fine at a few million, and with no index to build or tune. For hundreds of millions of vectors behind a strict latency target, a graph (HNSW) or cluster (IVF) index belongs in front.

### An index file inside your process

An in-process index (a library with a file format, no server) suits a local or single-writer service. Make sure it has:

- **Stable ids:** a positional index that moves the last item into a deleted slot renumbers everything after it; key the index by your own ids, and treat any slot-based filter or mask as invalid after every change.
- **Filtering inside the search** (an allowlist of ids, or a mask), so you get `k` allowed results rather than `k` minus whatever a post-filter dropped. The same filter carries access control and tenancy.
- **Crash-safe saves:** write a temporary file, flush it to disk, rename it over the old one, flush the directory. An incremental save that writes only the changes since the last one is a big win for large indexes.
- **One writer per file.** Detect a file replaced underneath you rather than writing over someone else's commits.
- **Your own checksum** if the format has none: atomic saves prevent torn files, not bit rot afterwards.
- **Strict input:** reject the wrong dtype or dimension instead of converting it quietly.

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

## Prove it

Use [Evaluating it](#evaluating-it) to compare recall and latency on the same query set.
