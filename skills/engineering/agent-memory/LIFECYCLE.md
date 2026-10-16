# Keeping memory true

## Time

- **Every fact has a kind and its times:** an event (when it happened), a state (since when, and whether it still holds), a plan (when it is due), a preference, a relationship. Record when it happened and when it was said, separately.
- **Plans become history.** "Planning a party next Saturday" is wrong on Sunday. A pass over facts whose date has passed rewrites them ("held a party on 14 June"), or ranking treats a past plan as past.
- **Temporary facts expire:** an exam tomorrow, a meeting at three, a trip. Give such facts an expiry date; after it they leave search (still readable by id for audit).
- **Episodes fade, preferences strengthen:** "had coffee with Alex on Tuesday" matters less each month unless it was significant; a preference stated three times is stronger than one stated once.

## Change and contradiction

Plain similarity search picks the wrong fact when something changed: "loves Adidas" on day 1, "my Adidas broke, switching to Puma" on day 31, and on day 45 the closest match to "which sneakers should I buy?" is still the first one.

- **Keep both, mark which is current:** the newer fact supersedes the older one for "what is true now", and the old one stays for "what changed".
- **A correction says so:** "works at Meta (earlier noted as Google)".
- **Kinds of relation:** a fact can replace another, add detail to it while both stay true, or be inferred from several. Inferred facts were never stated: flag them, show them for review, and drop a declined one.
- **An additive store** (new facts only, nothing overwritten) loses nothing, but the old fact still surfaces beside the new one; it needs time-aware ranking to answer "what now" correctly.

## Forgetting and erasure

- **Forget by id** as a soft delete: out of search, kept for audit, restorable.
- **"Forget everything about X"** is a semantic match, so preview it first and delete exactly the ids the user approved. Rerunning the match can select a different set.
- **Erasure reaches everything derived:** deleting a fact, a conversation or a document also deletes the beliefs, summaries and profile lines built from it, and rebuilds them from what remains. A deleted chat that leaves its memory behind is a privacy bug.
- **Bulk deletes need an explicit scope:** a delete with no filter, or an empty id that matches everything, raises instead of wiping the account.
- **Suppress is not delete:** "don't bring this up again" stops using a fact without removing it; offer both.
- **A conversation marked temporary** neither reads nor writes memory, decided when it starts.

## What users see

- **A readable summary** of what the agent knows, with inline correction, "don't mention this" and delete.
- **Sources under a personalised answer:** which memory or past chat shaped it, each removable or markable as not relevant.
- **Staff see and delete** what was stored about a customer.
- **Telling the agent** a remembered fact is wrong corrects it at once.

## Scopes and privacy

- **One hard boundary per tenant or user,** derived from ids you already have, enforced where the data is stored (scoped keys or query-level filters), never as a filter the caller may omit. Topic and source are soft filters inside it.
- **A project can keep its own memory,** invisible to chats outside it and blind to them.
- **Shared summaries are written for their audience:** a belief built for a whole team or company states the trend ("teams are leasing GPU clusters"), not one person's confidential deal. Build each scope's summary in its own call, so one scope's details can't leak into another's.
- **Scan before storing:** keys, tokens, connection strings, card and identity numbers are redacted or the item is blocked, before the text reaches the store. Turning the scan on later doesn't clean what is already there.
- **No sensitive categories by default** (health, beliefs, the details of a minor) unless the product needs them and the user knows.

## Evals

Score memory on the failures users notice, with cases built from real conversations:

| Axis | A case looks like |
|---|---|
| Carry forward | the gear they described two weeks ago, asked about as "my setup" |
| Follow preferences | a vegetarian asks for meal prep; a stated "no hawker centres" |
| Stay current | the trip ended; "takeout open tonight" must use home |
| Knowledge update | moved, changed job, switched tools; the latest wins |
| Abstention | asked about something never said; the agent says it doesn't know |
| Time | "what did we decide before the launch" |
| Privacy | another user's fact must never appear; a deleted fact must not return |

- **Report tokens and latency with accuracy:** a score bought with 25,000 tokens of context per answer isn't comparable to one at 7,000. Compare systems at the same retrieval budget and model.
- **Small public benchmarks saturate;** gains on the hard categories (time, updates, several sessions) and at large history sizes are the ones that count.
- **The judge is noisy** (a point either way): repeat runs and read the misses.
