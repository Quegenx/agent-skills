---
name: third-party-integrations
description: "Builds integrations with the apps your users connect (Gmail, Slack, CRMs, calendars): connection ownership, OAuth apps and scopes, token refresh and reconnect, calling their APIs, syncing their data, provider webhooks, and agents acting through those accounts. Use when adding or fixing an integration with a user's external account."
---

# Third-party integrations

Your product acts in systems it doesn't own, with credentials users lent it, against APIs that rate-limit, change, go down and revoke tokens. Most integration bugs are not in the API call: they are a connection stored under the wrong user, a token that quietly expired, a sync that marked live records deleted, a webhook from a stranger, or an agent that wrote to the wrong account.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Connections: who owns one, the connect flow, OAuth apps and scopes, storing the connection, several accounts per user, checking which account connected, refresh, revocation and reconnect, credential custody | [CONNECTIONS.md](CONNECTIONS.md) |
| Using them: calling the API, rate limits, retries and ambiguous writes, syncing data incrementally, detecting deletes, webhooks in and out, a unified model across providers, per-customer settings, testing | [CALLS-AND-SYNC.md](CALLS-AND-SYNC.md) |
| An agent acting through connected accounts: scoped tool sets, approvals by effect, connecting mid-chat, errors that say what to do, raw-API escape hatches, standing automations | [AGENT-ACCESS.md](AGENT-ACCESS.md) |
| Verifying a webhook signature, encrypting stored tokens, SSRF | the `secure-coding` skill |
| Delivering your own events reliably (outbox, retries) | the `messaging` skill |
| Kapso WhatsApp onboarding, messages, webhooks, native forms, workflows, Functions and Calling | [kapso](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/kapso/SKILL.md) |

## Build or buy

An integration platform (managed OAuth, token storage and refresh, a proxy, sync runtimes, tool catalogs for agents) saves months when you need many providers. Building it yourself fits one or two providers you know well. Either way the rules below are yours: the platform stores the tokens, but who owns a connection, what an agent may do with it and what a sync may delete are decisions in your code.

## The rules under all of them

1. **A connection belongs to an owner you decide:** a person, or a workspace's shared integration identity. Key it by your own immutable id (never an email, never a shared placeholder), and store the provider's connection id next to it in your database.
2. **The signed-in user is the only proof of who is asking.** An id in a request, a callback URL or a tag is a claim; check it against the session before touching a connection.
3. **Tokens never reach the browser, the logs or the model.** The server, or the platform's proxy, attaches them at the moment of the call.
4. **Revocation is normal.** Every connection can stop working at any time; detect it, tell the user, and offer a reconnect that keeps the connection's settings and data.
5. **Least privilege:** only the scopes the features use, only the apps the task needs, read before write.
6. **Writes to someone else's system are never retried blindly.** A timeout means "maybe": read the destination, or retry with the same idempotency key.
7. **What came from a provider is untrusted:** webhook bodies, record fields, email text. Validate it at the boundary, and never let it choose the account, the endpoint or the recipient of the next call.
8. **Your database is the record;** a provider or a platform cache is a delivery path. Copy what you need, promptly.

## Prove it

- [ ] Two users, and two members of two different workspaces, can't see or use each other's connections; a removed member can't use the workspace's
- [ ] One safe read through the real code path returns real provider data for the right account (a connect link alone proves nothing)
- [ ] An expired or revoked token produces the reconnect path; a recovered one clears it
- [ ] A write that times out is checked before it's repeated
- [ ] A sync interrupted halfway resumes; a sync that failed halfway marks nothing deleted
- [ ] A forged webhook is rejected, a duplicate is harmless, and an event maps to the right tenant before any work
- [ ] No token in logs, traces, prompts or the client bundle
