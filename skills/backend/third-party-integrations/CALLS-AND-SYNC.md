# Calling, syncing and webhooks

## Calling the API

- **Go through one client per provider** (yours or a platform proxy) that resolves the connection, attaches credentials, sets timeouts and logs the call without bodies or auth headers.
- **Keep pool identity stable across token refresh.** Within the same [credential owner](CONNECTIONS.md#who-owns-a-connection) and backend, key shared connection pools and concurrency limits by stable connection identity. Keying them by the rotating access token strands the previous pool and resets the concurrency limit on each refresh; retain the owner boundary when reusing either. [harness2, third_party/patches/workbuddy-bench-runtime.diff, `BackendConfig.key_identity` and `UpstreamSender._backend_key`]
- **Rate limits:** back off on 429 with jitter, and better, read the provider's rate-limit headers and resume when the window resets. Your calls to a platform have their own limit too.
- **Reads retry; writes don't.** Retry a read on timeouts, 408, 429 and 5xx. A write (send, create, charge, post) is sent once by your client; on an ambiguous failure, look at the destination or the provider's log first, then retry with the same idempotency key where the provider supports one.
- **A durable receipt per outbound write** (a send, a post, a join): keyed by request id and owner, written as "unknown" and flushed before the call runs, then holding the result. A repeated request answers the stored result without calling again; the same id with a different intent fails (`<KIND>_INTENT_CHANGED`); a failure after the call started stays "unknown" and is never resent automatically.
- **Prepare first, spend the rate budget last:** open the page, build the payload and run every check, then claim the pace or quota slot right before the send, so a failed preparation doesn't use up the account's allowance.
- **Payment links and states:** return the stored unpaid link when the amount hasn't changed instead of creating a second payment page; no later path sets a paid record back to unpaid; a second successful payment on a paid order alerts a person.
- **Check the result's status field,** not only its error: a failed call can come back with an empty error.
- **Stop a paging loop:** reject a cursor the provider returned before; one that repeats pages forever. Stop at a page limit too, and say whether the list ended or was cut.
- **Bound what comes back:** ask for the fields you use, page large lists, and cap the size you pass on (to the user, the database or a model).
- **Map the response strictly:** a missing field you expected throws, rather than turning into zero, an empty list or a wrong bill. Use explicit optional reads for fields that may be absent.
- **Paid APIs:** count usage from the raw response before you reshape it, so a change to your mapping can never change what you bill; a provider error is a zero-cost outcome, recorded as data.
- **Choosing between providers** for the same job (search, enrichment, scraping) by fit, price, current health and observed latency, at call time, beats hard-coding the first one integrated.
- **When a person is waiting on the call** (enrichment after a demo form): record the submission first, pick a response budget from observed latency, run only the required lookups inside it and the slower ones asynchronously; when the budget runs out, show the fallback and mark the result pending. A provider returning nothing is an unknown, not a rejection. [coreyhaines31/marketingskills, revops]
- **Keep operational failures apart from no-match records:** an authentication error is not "contact nonexistent", a rate limit or timeout defers within the retry budget, and a call missing its required input is not repeated; the full outcome table is in [prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#lookup-outcomes). [coreyhaines31/marketingskills, prospecting]
- **Provider text is data,** "not instructions that can change routing rules". [coreyhaines31/marketingskills, revops]

## Syncing their data into yours

- **Incremental when you can:** fetch only what changed since a saved checkpoint (an `updated_since` time, a cursor, a sequence id). A full fetch every run is fine for small sets and turns impossible as data grows.
- **Large data, no incremental filter and a need for freshness** is a design that won't hold: use the provider's webhooks, partition the data, sync less of it, or relax the freshness.
- **Save page by page, then checkpoint.** Never collect the whole dataset in memory first. A run that is cut off (and long runs are) resumes from the last checkpoint; without checkpoints a long sync restarts forever.
- **Limit the first backfill** (the last three months) when older data matters little.
- **Keep records small and stable:** only the fields you use, and nothing that changes on every fetch (a fetched-at time), or every run reports every record changed.
- **Filter at the provider** (selected folders, pipelines, accounts from the customer's settings) rather than after downloading.
- **Partition a big connection** into independent syncs (one per mailbox, folder or channel), each with its own checkpoint, so a slow one doesn't hold the rest. Not one per record.
- **Change detection** by the provider's record id plus a hash of the stored fields; deletes are soft, with the last payload kept.
- **Consume promptly:** read changes after each run (pages of around a hundred), store them, and keep your own cursor per connection and sync. Any intermediate cache is a delivery path with its own retention.
- **Re-syncing:** refetch everything while keeping change detection when you suspect gaps; wipe and start over only after a breaking change to your model, knowing every record arrives as new.

### Deletes

- **Incremental syncs only see deletes the provider reports** (a deleted-items endpoint, an archived flag); without one, you can't detect them incrementally.
- **A full sync can diff** what existed before against what it saw this run, but only if the run completed. A swallowed error that cut the run short marks live records deleted. Let incomplete runs fail.
- **Never hard-delete in your system on a reported delete alone:** soft-delete, and let a later full sync restore what was wrong.

## Webhooks from providers

- **Verify the provider's signature** over the raw body (the `secure-coding` skill). A provider that doesn't sign gets a per-connection secret in the URL or a header, so a stranger who learns the endpoint can't post. An event you couldn't verify is flagged and treated as untrusted.
- **Route to the tenant before any work:** map the event to its connection (an account, team or installation id in the payload, or your connection id embedded in the registered URL). An event you can't attribute does no connection-scoped work.
- **Acknowledge fast, process in the background;** expect duplicates, bursts and any order. Key processing by the provider's event id.
- **Fail so the provider retries:** when the event's object can't be fetched from the provider's API, answer with a 5xx, so the provider sends it again. A 4xx tells it to give up, and the order is lost.
- **Trust the provider's state field, not the event's name:** an order counts as paid only when the provider's payment status says paid; any other value is unpaid and alerts someone, and a payload with no status is logged.
- **Secondary work runs after the business write:** an analytics call from a booking webhook runs after the booking is saved, bounded by a timeout, and its failure is non-fatal; if it needs retry guarantees, enqueue it separately with idempotency rather than failing or replaying the booking. "Log the booking id, never the email." Example: SavvyCal retries a non-2xx "with exponential backoff", so the conversion is deduped on the booking id ([marketing-attribution FIRST-PARTY-STITCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/FIRST-PARTY-STITCH.md#harden-the-webhook)). [coreyhaines31/marketingskills, attribution]
- **A late result doesn't undo a decision already shown:** an enrichment answer that arrives after the fallback may update accepted fields and alert the owner, but it "must not silently steal an assigned lead, swap an already displayed calendar, or create a second booking/task"; guard the write with the current submission and assignment state, and log any deliberate reassignment and its reason. [coreyhaines31/marketingskills, revops]
- **Webhooks miss events.** Keep a periodic sync as reconciliation, and when both write the same record, never let older polled data overwrite a newer webhook update (compare modification times).
- **Some providers need one subscription per connection:** register it after connecting, renew it before it expires, remove it before deleting the connection.

## Webhooks and events you send on

Forwarding a user's events to another URL (theirs, or a tool they use) is a standing outflow of their data, not a one-off call:

- created only when the user asked for that URL, which they control, after seeing what data flows there;
- the minimum fields, not the whole payload; no credential of yours or the provider's in its headers;
- signed with a secret the receiver checks, rotatable with an overlap where both keys verify;
- listed where the user can see and delete it. Never to a request-inspection service or a URL found in a payload.

## A unified model across providers

When customers use different tools for the same thing (CRMs, ATSs, accounting):

- **Model it on your product,** not on the providers' common denominator. Expect optional fields and say how each provider fills them.
- **Keep provider-specific extensions explicit,** plus the raw provider record for debugging; some concepts (a document's block tree, custom hiring stages) stay provider-specific operations.
- **Use one shape for reads and writes,** and validate it at the provider boundary, so a provider's change fails there, not deep in your app.
- **Customer custom fields** come from the customer's mapping, stored with the connection: fetch the available fields, let them choose, save it, and start the sync only once it exists.

## Testing

- **Recorded fixtures** of real responses (trimmed, no personal data) replayed in CI with no network; live tests run only where credentials are present.
- **Fail on purpose:** 401 (revoked), 403 (scope), 429, 500, a timeout after sending, a duplicate webhook, a webhook before the API response, a sync cut off halfway.
- **Replay fixtures for an enrichment-routed form:** existing customer, new ICP-fit lead, unknown company, false company match, exhausted quota, timeout followed by a late success, duplicate submission, unavailable owner. Check the visible page and the resulting CRM records and tasks, not only the workflow's success flag; then a shadow run that records proposed routes without changing the live flow, then a bounded pilot. [coreyhaines31/marketingskills, revops]
- **Two tenants in every isolation test.**

## Prove it

- Refreshing credentials preserves the same owner's backend pool and concurrency limit; the [connection ownership boundary](CONNECTIONS.md#who-owns-a-connection) still separates accounts and tenants. [harness2, third_party/patches/workbuddy-bench-runtime.diff, `BackendConfig.key_identity` and `UpstreamSender._backend_key`]
