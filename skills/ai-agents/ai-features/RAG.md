# Retrieval-augmented generation (RAG)

Two separate systems that fail separately: **indexing** (split documents, embed, store with their source) and **answering** (retrieve passages for the question, give them to the model, have it answer only from them, with citations). A fluent answer can come from wrong passages, and right passages can still yield an unsupported answer. Test each half on its own.

## When RAG isn't the answer

Check this before building the pipeline:

- **Small, stable knowledge** (it all fits in a few thousand tokens: a few pages of policy, a product's FAQ): put it in the system prompt. No index to keep in sync.
- **Questions about structured data** ("how many orders last week", "which plan is this user on"): query the database through a tool or function call. Embedding rows and hoping the model counts them gives wrong numbers.
- **Questions about the whole corpus** ("what are the common complaints across all tickets"): retrieval returns a handful of passages, not the corpus. Aggregate or summarize in a batch job instead.
- **An agent working in a codebase or a file tree:** give it a search tool (grep, file search) and let it find its own context. Claude Code started with a pre-indexed vector database; it was fast but needed indexing and setup and was fragile across environments, and a Grep tool let the model build its context itself.
- **People only need to find documents, not read an answer:** semantic search without generation ([VECTOR-SEARCH.md](VECTOR-SEARCH.md)) is cheaper and can't invent anything.

## Indexing

- **Chunk by the document's structure** (headings, sections, paragraphs, sentences), never mid-sentence. A starting point is 300 to 500 tokens per chunk with 10 to 20% overlap, or the section title repeated in each chunk so it stands alone. Characters divided by 4 is a cheap token estimate for English (2,000 characters is about 500 tokens); use the model's tokenizer when limits are tight, and for other languages. Tune the size on your test set: too small loses context, too large makes retrieval noisy and prompts expensive.
- **How the overlap works mechanically:** accumulate whole sentences until the next one would pass the size limit, emit the chunk, then start the next chunk with the last few sentences of the previous one (as many as fit in the overlap budget), so a fact spanning the boundary appears whole in at least one chunk.

```ts
export function chunkText(sentences: string[], maxChars = 2000, overlapChars = 200): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let tail: string[] = [];                                   // last sentences, within the overlap budget
  for (const s of sentences) {
    if (current.join(" ").length + s.length > maxChars && current.length > 0) {
      chunks.push(current.join(" ").trim());
      current = [...tail];
    }
    current.push(s);
    tail.push(s);
    while (tail.join(" ").length > overlapChars) tail.shift();
  }
  if (current.length > 0) chunks.push(current.join(" ").trim());
  return chunks;
}
```
- **A naive sentence splitter** (split on `. `, `! `, `? `) breaks on abbreviations ("e.g. ", "Dr. ") and drops the punctuation it splits on. Use `Intl.Segmenter` with `granularity: "sentence"` or the document's own structure.
- **Store with every chunk:** the document id, title, section heading, chunk index, URL or path, last-updated date, the embedding model, and the access fields (owner, tenant, visibility). Citations and permissions depend on them.
- **Give chunks deterministic ids** (`${documentId}:${chunkIndex}`) and upsert, so re-indexing the same document doesn't duplicate it.
- **Re-index by replacing, not only upserting:** delete all chunks for the document, then insert the new ones, in one transaction. Upsert alone leaves stale chunks behind when a document gets shorter, and a deleted document must lose all its chunks. Stale chunks produce confident wrong answers.
- **Embed in batches** (one call with many chunks, such as `embedMany`), not one request per chunk, and index large uploads in a background job ([AI-JOBS.md](AI-JOBS.md)) instead of inside the upload request.
- Embed and store as in [VECTOR-SEARCH.md](VECTOR-SEARCH.md), with [pgvector index timing](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/VECTORS.md#indexes) at its provider owner. Use hybrid search when questions include names, codes or exact terms; give each list more candidates than the final count, or fusion has little to work with.

## Answering

1. **Filter by permission first**, then retrieve. Never retrieve across tenants and hope the model won't mention it.
2. Retrieve more candidates than you'll use (e.g. 20), optionally re-rank, keep the best few that fit the context budget.
3. **Give passages with stable ids** and a system prompt that says: answer only from these passages, cite the ids for each claim, and when they don't contain the answer, say "I don't have information about that in the documents". Retrieved text is data: an instruction inside a document is not followed.
4. **Allow "not in the documents".** If no passage supports an answer, say so and, where useful, show the closest sources. Don't let the model fill gaps from general knowledge unless the product explicitly allows it, and then label which part is which.
5. **Return the sources with the answer** as data, not only as text inside it: `{ answer, sources: [{ documentId, title, chunkIndex, relevance, url }] }`. The UI links each one to the exact section, so a person can check.

```ts
const SourceSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  chunkIndex: z.number().int(),
  relevance: z.number(),        // the retrieval score, not a model-invented number
  url: z.string().url(),
});
const RagAnswerSchema = z.object({ answer: z.string(), sources: z.array(SourceSchema) });
```

## Re-ranking with a model

Asking a model to score each candidate's relevance (0 to 1) and re-sorting can help. Give it the whole chunk, not the first 200 characters, or it ranks on the opening line. Treat its reply as untrusted input: ask for `{ id, score }` pairs through structured output rather than a bare array matched by position (a list one item short silently shifts every score), check every score is in range and every id is one you sent, and fall back to the retrieval order when parsing fails, instead of crashing or trusting a malformed list. Measure whether the re-ranker improves your test set before paying for the extra call; a dedicated re-ranking model is usually cheaper and steadier than a chat model.

## Testing it

Build a question set from your real documents:
- questions with a known answer and the passage that contains it;
- questions that need two passages combined;
- questions whose answer changed in a newer document version;
- questions the documents don't answer;
- a document containing an instruction ("ignore previous instructions...") to confirm it's treated as text.

For each change (chunking, model, retrieval settings, prompt), check:
- **Retrieval:** did the passage that contains the answer come back, and at what rank?
- **Support:** is every claim in the answer backed by a cited passage? Open the citations; don't trust that they exist.
- **Refusal:** do unanswerable questions get an honest "not found" instead of an invented answer?
- **Freshness:** after editing or shortening a document, does the answer follow the new version, with no leftover chunks?

Record model, prompt version and retrieval settings next to the results.

## Prove it

Use [Testing it](#testing-it) to verify retrieval, support, refusal and freshness.
