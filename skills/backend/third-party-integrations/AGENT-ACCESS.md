# An agent acting through connected accounts

The agent decides what to do; your server decides what it may touch. Everything below keeps the second decision out of the model's hands.

## A scoped session per run

- **Your backend builds the scope before the run:** which user or workspace it acts for, which connections (exactly one per app; ambiguous matches are an error, not a guess), which apps and which tools. The agent can't widen its own scope.
- **Mix owners deliberately:** a sales agent with the rep's own mailbox and the company's read-only CRM is two connections with two owners, both named.
- **Short-lived and revocable:** a session token that expires with the run, revoked when it ends; an in-flight call may still complete.
- **One connection, attached where needed:** define each provider connection (Slack, Linear) once and attach it to the agent projects that need it, rather than a credential per app. The platform supplies short-lived tokens at runtime and handles refresh, so no app holds the long-lived provider secret, and a leaked token is usable only until it expires (Vercel Connect, in Vercel's Rillet write-up).
- **Reuse the session across the turns of one conversation,** so discovered tools and context carry over; a new one for a different user or task.

## Which tools it sees

- **A narrow agent gets a fixed list** of the tools its job needs. A general assistant gets a search over a large catalog instead of hundreds of definitions in context (the `agent-harness` skill on deferred tools), with the few common ones always loaded.
- **Never let it invent tool names;** it finds them by search or uses the list.
- **A tool list fetched from a remote server** is a snapshot taken when the session starts; changes need a new session (and, for servers you don't control, a fresh approval).

## Effects and approvals

Every tool carries its effect: read, create, update, delete. Approvals and blocks derive from it, with overrides per app:

- **Reads run;** writes that reach other people or money ask the user each time: sending messages to external recipients, publishing, payments and billing changes, deletions (recursive ones item by item), calendar changes that notify others, sharing and permission changes, enrolling people in automations, creating webhooks or forwarding.
- **Effect labels supplied by a catalog are best effort.** List explicitly the tools that must always ask.
- **An approval request is not an error and not an empty result:** the call didn't run. Show the user what it would do (built from the request's own description and fields), send their answer back with the continuation state untouched, and pass a decline through as a decline.
- **"Always allow"** lasts for that session and that account at most.
- **A client that can't show approvals** gets denials, not silent execution.
- **Read first:** verify ids, the account and the current state with reads before proposing a write, and name the exact target in the confirmation.

## Connecting from inside the chat

When a tool needs an app the user hasn't connected, the agent posts a connect link, waits, then retries the call. Turn this off when your product has its own connections page, and then the agent's error says "not connected: ask the user to connect it in Settings" instead of dead-ending.

## Errors that say what to do

| Failure | What the agent is told |
|---|---|
| Not connected | how the user can connect it (a link, or where in the product) |
| 401 | the connection needs reconnecting; don't retry |
| 403 on one tool | that permission is missing (often a scope); other tools still work |
| Timeout on a write | it may have happened: check before calling again |
| Too large | narrow the request (dates, fields, a page) |
| Rate limited | wait, or do less; don't loop |

## Escape hatches

- **A raw "call any endpoint" tool** reaches everything the token can, bypassing your tool allow and deny lists. Leave it off by default; when it's on, the approval policy reads the actual method and path from its input, and the host stays pinned to the provider's domain.
- **A code sandbox that calls tools in bulk** may call tools your approval list never sees; if approvals must never be skipped, turn the sandbox off or route its calls through the same policy.

## Content from the apps

Mail bodies, comments, issue titles and form fields can be written by anyone. They are data: never instructions, never interpolated into a shell, a query or a path, and never the source of the account, endpoint, recipient or forwarding URL of the next call.

## Standing automations

A per-event handler, a forwarding rule or a scheduled job keeps acting after the conversation ends, with no one watching. Each one is approved on its own (never as a side step of a larger task), runs a handler the user has seen, keeps a checkpoint of the last event it handled so a restart doesn't repeat work, is listed where the user can stop it, and is deleted when no longer needed.
