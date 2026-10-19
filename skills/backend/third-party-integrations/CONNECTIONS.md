# Connections

## Who owns a connection

| Model | Use when | Key it by |
|---|---|---|
| Member-owned | each person connects and acts as themselves (their mailbox, their calendar) | `org_42:user_7` |
| Workspace-owned | the organisation connects one shared account (the company CRM, a support inbox) | `org_42:integration`, a dedicated identity that survives members leaving |

- **Prefix with the workspace** so the tenant boundary is visible even when member ids are only unique inside a workspace.
- **A workspace-owned connection still needs your own check** of which members may use it, before every use, from your membership table.
- **Use one environment per stage** (development, staging, production) with separate credentials; a separate setup per customer only when contracts or their own OAuth credentials require it.

## The connect flow

1. The server creates a short-lived connect session for the signed-in user, carrying your ids (user, workspace) as tags.
2. The browser opens the provider's consent through a hosted page or your own UI; tokens never pass through your frontend.
3. The provider redirects back; the server receives the connection (by webhook or by finishing the exchange) and stores its id against the owner the session named.
4. **A callback's query parameters are not proof:** match the result to the attempt you stored for that signed-in user before saving it.

Don't connect every app up front. Ask for a connection when a task first needs it, and remember it for next time.

## Your OAuth app or a shared one

A platform's shared OAuth app gets you started in minutes. Before launch, register your own for each provider where users see a consent screen:

- **The consent screen names you,** not the platform.
- **Scopes:** shared apps have fixed scopes; yours asks for exactly what you use.
- **Quota:** shared apps share rate limits (and polling intervals) with everyone else.
- **Survival and portability:** a provider can revoke a shared app, and only your own app's tokens can move with you if you change platforms.
- **The callback on your own domain** (a redirect that forwards the browser to the platform, query intact) set before real users connect; changing it later breaks reconnects until every provider app is updated.
- **Provider reviews:** some providers limit unverified apps (test-mode tokens that expire within days, "app blocked" warnings for sensitive scopes); plan the review into the launch. A worked Google example (External consent screen, test users or `access_denied`, a redirect URI that matches exactly with no trailing slash, tokens encrypted at rest) is in [search-console API.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/API.md#a-self-hosted-oauth-app) [open-seo, SELF_HOSTING_GOOGLE_SEARCH_CONSOLE.md].

**Scopes change only for new connections.** Users connected under the old set keep it until they reconnect, so a feature needing a new scope ships with a reconnect prompt.

## What a connection stores

| Field | Holds | Example |
|---|---|---|
| Your ids (tags) | attribution and routing back to your owner | user id, workspace id |
| Provider configuration | what the connection needs to work at all | subdomain, region, tenant id, base URL |
| Your settings | your configuration for this customer | field mappings, chosen folders, the webhook subscription id |
| Credentials | tokens and keys, encrypted, never returned to clients | refresh token |

Synced records live in your database, not in any of these.

## Several accounts for one app

- **A person may connect work and personal accounts.** Label them, and require an explicit choice when more than one is active; a default such as "the most recent" or "the oldest" lands a write in the wrong mailbox.
- **Know which account it is:** read the provider's own identity (the address, the username) from its profile endpoint after connecting; a label you set proves nothing.
- **Enforce policy on that identity** (only the company's email domain, the same organisation as before) when the connection is created and again on every reconnect. On reconnect, compare against the identity you stored the first time, not the connection's fresh settings, which already describe the new account.

## Keeping it alive

- **Refresh before expiry,** and touch idle connections at least daily: some providers revoke refresh tokens that go unused.
- **A refresh failure isn't final:** providers have outages. Retry for a while, alert on the failure, and clear the alert when a later refresh succeeds.
- **Revoked is normal** (a password change, 2FA, an admin policy, the user removed access). Mark the connection broken, show "Reconnect" where the user meets the feature, and notify them before they hit it.
- **Reconnect, don't recreate:** re-authorising keeps the connection's settings, sync position and history; deleting and recreating loses them.
- **A 401 on a call** means the user's token; a 403 on one action usually means a missing scope; an error before the provider is reached is your own credential or configuration. Diagnose at the right boundary, with the request or log id.

## Lifecycle hooks

- **After connecting:** validate the account, register per-connection provider webhooks, record their ids, seed settings.
- **Before deleting:** remove those webhooks and anything else created at the provider (idempotently: it may already be gone).
- **Deletion is soft first** (stop syncs, block use), hard after a recovery window.

## Custody

- **Tokens live in one place** (your encrypted store or the platform), are used server-side at call time and are never sent back to a client, even masked; an API that returns connection state shouldn't return a usable token.
- **Importing existing tokens** (users who connected before you adopted a platform) makes refreshing them your job, until they reconnect through the new flow.
- **A provider sub-token** some APIs hand back (a page token, a scoped key) is a credential too: keep it in memory for the calls that need it, never log or store it.
