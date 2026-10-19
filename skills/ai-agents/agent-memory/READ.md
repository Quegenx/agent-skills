# Reading memory back

## Two layers

| Layer | Holds | How it arrives |
|---|---|---|
| **Profile** | Stable facts (name and what to call them, role, time zone, how they want answers, standing constraints) and current context (active projects, a trip next month) | Every turn, in the per-turn note before the newest message. Never in the system prompt: a saved memory would break the cache |
| **Search** | Specific details: what was decided about the migration, the gear they own | A tool the agent calls when the turn needs it; the call shows in the transcript |

- **Why both:** a search for "plan a trip to Japan" never surfaces "call me Dan, not Daniel", because the two share nothing. Facts that should shape every reply belong in the profile; search is for what the question is about.
- **Why search is a tool and not pushed context:** retrieval the agent asked for serves what it is doing; retrieval it didn't ask for drags in the wrong topic. Push only the profile.
- **Precomputed answers** for questions asked often ("what are this user's preferences?") can be written in the background and read with one database query; mark them stale when facts in their scope arrive, and have the agent check a stale one against the facts before trusting it.
- **Memory can shape tool queries:** the home city and diet make a restaurant search better.

## Keep the profile small and current

- **Oldest first,** so a new fact joins the end and the earlier ones keep their place in the cached part of the note.
- **Cap it:** a fixed number of facts of bounded length, or a token budget (a few hundred tokens). A fact costs about ten tokens; fifty distinctive ones are cheap, and distinctive details are what make a reply feel personal.
- **Split by lifetime:** stable facts change rarely; current context expires (a project ends, a trip happens).
- **Topic groups** (preferences, work, goals) with precise descriptions ("explicit first-person preferences only, not inferred traits") keep each group clean.

## A minimal store

Lasting facts about the user (their setup, plan, standing preferences), saved and forgotten with tools and shown at the start of each new conversation. Decide what is worth keeping with a narrow question over what the user or staff wrote, never over what the agent inferred, or a wrong inference gets saved and repeated. Don't store what belongs on a record (an entry code belongs on the order), nor shop policy.

- **Cap it:** a fixed number of memories of a bounded length per person (100 of 500 characters), read whole into each turn.
- **Memories go in the per-turn note,** not the system prompt, so saving one mid-conversation doesn't break the cache.
- **Staff can see and delete them.**

## Ranking a search

No single method answers every query, so run several and fuse them:

| Method | Finds |
|---|---|
| Meaning (embeddings) | "Alice's job" finds "Alice works as a software engineer" |
| Exact words (keyword search) | names, ids, product terms an embedding blurs |
| Entity links | facts about a person or project reached through shared entities |
| Time | "what did we do last spring" |

- **Fuse by rank, not by score:** the scales differ (cosine, BM25, link weights), so combine positions (reciprocal rank fusion) and let a fact several methods agree on rise.
- **Rerank the top few hundred** with a model that reads query and fact together.
- **Small multiplicative nudges** for recency, closeness to an asked-for time and strength of evidence (each within about ten percent), so a recent but irrelevant fact never jumps a relevant one.
- **Limit the pull of common entities:** an entity linked to thousands of facts ("user") says little; saturate or down-weight it.
- **Time questions:** parse the expression into a window, pick by relevance inside it, and spread the picks across the window, so "in 2023" isn't all December.
- **Current-state questions prefer the latest version** of a fact that changed, while history questions may need the old one.
- **Cut to a token budget, not a count:** the agent budgets context in tokens; fill it top down and skip a fact too long for what is left rather than stopping.
- **Offer the source text** when the distilled fact loses the nuance, for exact quotes.
- **Scope in the query, every time:** the user or tenant filter is part of the query the store runs. A filter on one field doesn't constrain the others: asking for a user's facts may also return their session or agent facts unless those are named.
- **Explain the scores** (per method, per boost) behind a debug flag; tuning without it is guessing.

## An answer built from memory

When the agent reasons over many facts (a recommendation, a summary of the account), give it the layers in order: precomputed answers, then consolidated beliefs, then raw facts as ground truth. It must retrieve before it answers, and may cite only ids it actually retrieved.

## What the agent says

- **Don't narrate memory operations** ("I've saved that") unless the product shows memory on purpose; do say where a personal answer came from when asked.
- **Show the sources** of a personalised answer where the product can (which memory, which past chat), with a way to mark one wrong.
