---
name: ai-features
description: "Builds LLM features: vector and hybrid search, RAG with citations, structured extraction and AI background jobs. Use when adding or reviewing embeddings, semantic search, RAG or LLM calls in an app."
---

# AI features

An AI feature is done when it is measured, not when the output reads well. Every part below has a way it fails quietly, and a check that catches it. Pick the file for the job:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Search by meaning, embeddings, pgvector, Convex vector search, hybrid search, memory and compression (quantization, coarse-then-exact search, in-process index files) | [VECTOR-SEARCH.md](VECTOR-SEARCH.md) |
| Answering questions from your own documents (RAG) | [RAG.md](RAG.md) |
| Turning images or documents into structured data | [EXTRACTION.md](EXTRACTION.md) |
| Calling a paid AI API from a job (transcription, generation, extraction) | [AI-JOBS.md](AI-JOBS.md) |

## The rules under all of them

1. **Measure the part that can be wrong.** Retrieval is measured by whether the right items come back; extraction by whether the fields are correct; generation by whether every claim is supported. Fluent prose proves none of these. Build a small labeled set first (ten to fifty real cases with known answers, including hard and unanswerable ones) and run it on every change.
2. **Typed output is not correct output.** A schema guarantees shape, not truth. Validate the values against the domain (formats, ranges, checksums, cross-field rules) and allow "unknown".
3. **Uncertainty is an answer.** The system must be able to say "not found", "unreadable" or "I don't know" and must be tested for it. A plausible invented value is the worst failure because nobody notices.
4. **For embedding retrieval, one representation end to end.** Queries and stored items use the same embedding model, version, dimensions and preprocessing. Record the model and version with the data; changing models means re-embedding everything.
5. **Pin and record what produced a result:** provider, model and version, prompt version, parameters. Results without this can't be compared or reproduced.
6. **Retrieved text and user files are data, never instructions.** Text in a document that tells the model to do something is content to quote or ignore, not a command. Filter by permissions before retrieval, never after generation.
7. **Paid calls are side effects.** Every call that costs money or can't be undone gets idempotency, a clear state, and a budget. A lost response is "uncertain", not "failed".
8. **Claims about speed and cost are local.** A benchmark describes its own environment and workload. Re-measure on yours before acting on it.

## Build versus buy

For rewriting or porting an existing system with agents, use the `system-migration` skill.

**Replacing a subscription with your own app:** worth it when an API supplies the hard capability and your scope is narrow. Write the scope down for the coding agent too ("one user, no billing, no speculative roles or services"), or it grows. Count the API usage, hosting, background-job handling, failure cases and your maintenance time (updates, backups, broken deploys) against the subscription, and design the job flow in [AI-JOBS.md](AI-JOBS.md) before calling it cheaper. A subscription is still the better deal when a team depends on the tool or nobody can maintain it. The agent builds the happy path quickly; the failure modes (a lost response that would charge twice, a deploy mid-job) still need someone who names them and asks for the fix.

## Before calling an AI feature done

- A labeled test set exists, includes hard and unanswerable cases, and the current numbers are written down with the model and prompt versions.
- Uncertain, empty and unsupported cases produce an honest result, shown in the UI.
- For paid calls: they are idempotent, budgeted and recoverable from a lost response.
- For retrieval: permissions are applied before retrieval.
- Report what was measured and what wasn't.
