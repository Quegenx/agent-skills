---
name: agent-memory
description: "Designs long-term memory for LLM agents: what to remember and where it lives, extracting facts, consolidating them, an always-on profile plus search, staying current over time, forgetting, user controls and memory evals. Use when an agent should remember users or work across conversations."
---

# Agent memory

Memory is what lets the next conversation start from what the last ones established: the user's setup, their constraints, the decision taken last week. It fails in three ways, and every rule here answers one of them: the agent **forgets** what it was told, **ignores** a preference it holds, or **holds on to what stopped being true** ("still in Singapore" a month after the trip). The third is the one simple systems get worst, and the one users notice.

| The job | Read |
|---|---|
| Writing memory: what to extract, the extraction rules, who said it, grounding dates, duplicates, links, consolidating facts into beliefs | [WRITE.md](WRITE.md) |
| Reading it back: the always-on profile, search on demand, ranking, time-aware retrieval, token budgets, where memory goes in the prompt | [READ.md](READ.md) |
| Keeping it true: change over time, contradictions, expiry, forgetting and erasure, what users see and correct, scopes and privacy, evals | [LIFECYCLE.md](LIFECYCLE.md) |
| Compaction within one conversation, the per-turn note, history replay | the `agent-harness` skill |

## Where each piece of information belongs

| It is... | It goes to | Example |
|---|---|---|
| needed on every request, word for word | the system prompt | answer in the user's language; never quote internal prices |
| a record queried by id, summed or joined | your database, read by a tool | invoice 4821, 1,340.50, paid |
| what a colleague would remember about this person | memory | prefers async updates; moved to Seattle in March |
| material someone would look up by meaning | documents, searched | the planning doc, past tickets, the changelog |
| the state of the current conversation | the conversation | the draft being edited right now |

Memory is not a system of record: no joins, no totals, no lookup by key. Keep the rows in the database and remember the story around them ("disputed invoice 4821 and nearly left over it").

## The shape

```
turn starts  ->  load the profile (always)  ->  the model may search memory (a tool, when it needs more)
turn ends    ->  queue the conversation for extraction (in the background, off the reply path)
background   ->  extract facts  ->  dedupe and link  ->  consolidate into beliefs  ->  refresh the profile
```

1. **Write after the answer, never before it.** Extraction is a model call; run it in the background and keep the reply fast. Save the conversation's messages even when nothing was extracted: they are context for the next extraction.
2. **Read in two layers.** A short profile goes into every turn, because the facts that should colour every reply (what to call the user, their time zone, their role, how they like answers) never match a search query. Specific details come from search, which the agent calls when it needs them.
3. **Store facts, not transcripts.** "User switched from almond to oat milk after an almond sensitivity" is searchable and current; the chat it came from is not.
4. **Scope every read and write.** User, workspace or tenant is a hard boundary enforced in the query, never a filter the caller may forget.
5. **Facts carry their time.** When it happened, when it was said, whether it is ongoing, done or planned. Staying current depends on it.
6. **Nothing is silently overwritten.** A change keeps what it replaced ("lived in Austin until March 2026, now Seattle"), so the agent knows what changed and why.
7. **The user can see, correct and delete it,** and deleting a source deletes what was derived from it.

## When not to build it

A product with short, unrelated sessions, or one whose state lives entirely in its own records (orders, tickets), needs the database and the conversation, not memory. Start with the profile alone (a capped list of facts written by a tool) and add extraction, search and consolidation only when evals show what is missing.

## Prove it

- [ ] Every kind of information placed by the table above; nothing transactional in memory
- [ ] Extraction runs after the reply, raises on a model failure instead of returning "nothing to remember", and is tested on real conversations (incidental facts, several topics, dates)
- [ ] Facts carry who stated them, when it happened and when it was said; relative dates resolved against when it was said
- [ ] A profile in every turn (in the per-turn note, not the system prompt), search as a tool, both scoped by a boundary the query enforces
- [ ] Changes keep history; planned events turn into past ones; expired facts leave search
- [ ] Users can see, correct, suppress and delete; deletion reaches derived beliefs and the profile
- [ ] Secrets and payment data scanned out before anything is stored
- [ ] A memory eval with the three failures (forgot, ignored a preference, stale) plus abstention, scored with tokens and latency per answer
