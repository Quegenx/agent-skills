# Streaming with server-sent events (SSE)

SSE is a one-way stream from server to browser over plain HTTP (`Content-Type: text/event-stream`), good for live updates, progress and token-by-token AI output.

## Which client

| Need | Native `EventSource` | Fetch-based client (`@microsoft/fetch-event-source`) |
|---|---|---|
| GET with same-origin cookie auth | yes | yes |
| `Authorization: Bearer` header | no (`withCredentials` doesn't add it) | `headers` |
| POST with a JSON body | no | `method`, `body` |
| Check the status before reading | no | `onopen` |
| Your own retry policy | browser decides | `onerror` returns a delay or throws |
| Named events | `addEventListener(name)` | check `message.event` in `onmessage` |
| Stop on purpose | `close()` | abort the signal |

Start with native `EventSource` when a cookie-authenticated GET is enough. Don't hand-parse `fetch()` yourself: the body is a byte stream, a chunk can end mid-line or hold several events, and `data:` can span lines, so `JSON.parse` per chunk is wrong.

Never put the token in the query string; URLs end up in logs. The client library doesn't authenticate anything: the server still validates the token (issuer, audience, signature, expiry) and authorizes the subscription.

## Server

- Send `id:` on every event (a monotonically increasing sequence per stream) so a reconnecting client can resume, and `retry:` to suggest the reconnect delay.
- **Authorize when the stream opens and again on every reconnect and replay,** and only send events the caller may see. The stream is a resource like any other.
- **Replay from `Last-Event-ID`:** on reconnect, send the events after that id from a bounded store (a table or log of recent events), then switch to live events without a gap or a duplicate at the seam. If the id is older than what you keep, send an event telling the client to refetch the full state; don't pretend the stream is complete.
- **For notifications, persist first, then push.** Write the notification to the database, then send a small hint on the stream. A client that missed the hint recovers by reading current state.
- **One subscription per connection.** A shared queue or channel hands each item to one reader, so two tabs of the same user compete and each sees half the events. Fan out to every connection, routed by the authenticated identity.
- Send a comment line (`: ping`) every 15 to 30 seconds so proxies don't close an idle connection.
- Stop the work for a stream when the client disconnects (the request's abort signal), and exempt the stream from the normal request timeout ([RELIABILITY.md](RELIABILITY.md)).
- Know the platform's limit on response duration (serverless functions often cap it) and design for reconnection rather than one endless response.
- Cross-origin: allow the frontend origin and the `Authorization`, `Content-Type` and `Last-Event-ID` request headers, and expose `Retry-After` if the client reads it. Cookie auth across origins needs `credentials: "include"` on the client, an explicit allowed origin with credentials on the server, and cookies whose SameSite rules allow it.

## Client

What the library does: https://github.com/Azure/fetch-event-source/blob/main/src/fetch.ts and https://github.com/Azure/fetch-event-source/blob/main/src/parse.ts

- **Providing `onopen` replaces its default check,** so check the status and content type yourself. Compare the media type without parameters, so `text/event-stream; charset=utf-8` passes.
- **Throwing from `onerror` is the only way to stop retrying.** Returning a number retries after that many milliseconds (overriding the server's `retry:`); returning `undefined` keeps retrying at the default interval. Without a classifier it retries forever.
- **A normal end of the response completes the call** unless `onclose` throws. For a persistent subscription, throw there so `onerror` schedules a reconnect. For a finite stream (one search, one AI answer), let it finish normally.
- **Limit consecutive failures and reset the counter only after a message was handled,** not in `onopen`. A server that accepts the connection with 200 and then closes it would otherwise loop forever.
- **`onmessage` is not awaited.** An async handler runs unsupervised and its errors are lost. Keep it synchronous, or hand work to your own queue. `JSON.parse` doesn't validate the payload; parse with the schema.
- **Classify parsing, validation and synchronous handler failures deliberately.** An ordinary thrown error reaches `onerror` and retries unless that callback throws. The removed helper called parsing failures fatal without wrapping them in its fatal error class, so its classifier retried them. The source wraps these failures before dispatching them to the retry policy. [milan-jovanovic, apis/fetch-event-source.md] https://github.com/Azure/fetch-event-source/blob/main/src/fetch.ts
- **Check an already-aborted signal before starting.** The source does this before calling the library; the removed helper did not. Registering an abort listener does not handle a signal that was already aborted. [milan-jovanovic, apis/fetch-event-source.md] https://github.com/Azure/fetch-event-source/blob/main/src/fetch.ts
- Unlike native `EventSource`, `onmessage` receives named events too, and `msg.data` is the raw string.
- For a very long `Retry-After`, stop and show a "retry" action instead of holding a long timer.
- `openWhenHidden: false` (the default) closes the stream while the tab is hidden and reopens it when visible: fewer open connections, but replay must work. `true` keeps it open at a server cost, and mobile browsers may suspend it anyway.

## Resuming and duplicates

- The library remembers the last id **only within one call.** A new call (after a token refresh, a remount) starts without it, so store the last id yourself, scoped to the user and the subscription, and pass it as `Last-Event-ID`.
- **A received id is not a processed event.** The id can be recorded before your handler finishes. When reliable processing matters, keep your own checkpoint of what was applied, replay from it, and make applying an event idempotent, since a reconnect can deliver an event twice.

## POST streams

A search or generation endpoint may need a body: `method: "POST"`, `Content-Type: application/json`, `body: JSON.stringify(filter)`. A retried POST repeats the request: if it creates a job, either make it idempotent ([RELIABILITY.md](RELIABILITY.md)) or create the job with one POST and stream its progress from a separate GET.

## React

Use a fresh abort controller for each effect run, abort it during cleanup, and ignore callbacks from an aborted run. [milan-jovanovic, apis/fetch-event-source.md]

- Cleanup runs on unmount and before the effect restarts for a new token; Strict Mode runs setup and cleanup an extra time in development. The guards keep an old run from updating the current view.
- **A 401 is a handoff to the auth flow,** not a retry: the headers are fixed for the call, so retrying sends the same expired token. Refresh the token; the effect restarts with it.
- Show the stopped state (`role="alert"`) when the stream gives up, instead of a silent spinner.

## Prove it

Open a stream for one reader with a bearer token, then: let the token expire (the stream stops and restarts with a fresh token, no retry storm); drop the network mid-stream (it reconnects and receives the missed events once, from the last id); have the server close an idle stream with 200 repeatedly (the client gives up after the limit); open two tabs (both receive every event); try to subscribe to another reader's stream (refused).

- Send malformed JSON, a schema-invalid payload and a synchronous handler failure: each follows the chosen terminal-error policy. Pass an already-aborted signal: no connection starts. [milan-jovanovic, apis/fetch-event-source.md]
