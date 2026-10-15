---
name: secure-coding
description: Closes the common holes where untrusted input meets code - allowlists instead of blocklists, mass assignment (accept only editable fields, never bind a request to a persisted row), output encoding against stored XSS, URL scheme allowlists for links, open redirects (same-origin after parsing), host allowlists without suffix confusion, SSRF (resolve the name and reject private, loopback, link-local and metadata addresses, check every redirect and the address actually connected), path traversal (canonical path under a root, server-owned file names), CRLF injection in logs and email headers, bound parameters and identifier allowlists for SQL including sort columns, exact content-type allowlists, sign and overflow checks on amounts, page-size clamps, uniform not-found messages against enumeration, and scrubbed error responses - plus the trusted service boundary between clients and the database (Supabase Row Level Security, never the service-role key in the browser); authentication and authorization (JWT verification with pinned algorithms, issuer and audience, short tokens with rotated and reuse-detected refresh tokens, hashed and scoped API keys, permission checks instead of role names, Argon2id passwords with migrate-on-login upgrades, TOTP two-factor with pending enrollment, limited pre-2FA tokens, replay and brute-force limits, recovery codes); tenant isolation in two layers (scoped queries plus Postgres row-level security with a non-owner role, force, fail-closed settings and transaction-local tenant context behind poolers); AES-GCM field encryption with versioned keys from a KMS; keeping databases and dashboards off the public internet; and parser disagreements (alternate IPv4 spellings, duplicate JSON members, HTTP request smuggling, Unicode lookalike usernames), regex backtracking and expansion bombs, spreadsheet formula injection, shell argument injection, card-number redaction, exact-origin CORS, scoped password reset tokens, attenuated delegation chains and signed webhooks. TypeScript and Node, Supabase. Use when handling user input, URLs, uploads, file paths, redirects, outbound fetches, logs, emails, query parameters or error responses, adding login, tokens, API keys, roles, permissions, 2FA or password storage, building multi-tenant features or RLS policies, storing third-party secrets, exposing a service, configuring CORS, exporting CSV, running shell commands, accepting webhooks, writing validation regexes, or when reviewing code for security.
---

# Secure coding

Every rule here comes down to one decision: trust nothing that crossed the boundary, and say what's allowed rather than what's forbidden. A blocklist is a list of the attacks you thought of. Read the catalog for the input you're handling:

| The input or output | Read |
|---|---|
| Request bodies, HTML output, links, redirects, outbound URLs, file names and paths, logs, email headers, SQL, amounts, pagination, errors | [CATALOG.md](CATALOG.md) |
| JWT validation, refresh-token rotation, API keys, permission checks, password hashing and upgrading it, TOTP two-factor | [AUTH.md](AUTH.md) |
| Tenant isolation: scoped queries plus Postgres row-level security, pooled connections, Supabase policies | [TENANCY.md](TENANCY.md) |
| Encrypting stored secrets (AES-GCM, key versions, KMS), keeping internal services off the internet | [SECRETS-AND-NETWORK.md](SECRETS-AND-NETWORK.md) |
| Parsers that disagree (IP spellings, duplicate JSON keys, request smuggling, Unicode lookalikes), ReDoS and expansion bombs, CSV formulas, shell arguments, card numbers in logs, CORS, reset tokens, delegation chains, webhook signatures | [PARSERS.md](PARSERS.md) |

## The rules

1. **Allowlist, don't blocklist.** Name the fields a request may set, the schemes a link may use, the hosts a fetch may reach, the characters a file name may contain, the columns a sort may use. Anything new is denied until someone adds it.
2. **Parse, then decide.** Check a URL after `new URL()`, a path after resolving it, a number after parsing it. String checks on raw input (`startsWith("/")`, `includes("..")`, `endsWith(".example.com")`) are fooled by encodings, backslashes, `//evil.com` and `evil-example.com`.
3. **Encode at output, for the context.** Store what the user typed; encode when writing it into HTML, a URL, a header, a log line or SQL. Stripping "dangerous" characters on input both breaks honest data and misses the next context.
4. **Separate input contracts from stored entities.** A request schema lists what the caller may set; the persisted row has fields (role, balance, owner, verified flags) the caller must never reach.
5. **The client is never the trust boundary.** Authorization, validation, limits and audit happen on a server you control. With Supabase, the browser does talk to the database API, so Row Level Security policies on every exposed table are the per-operation authorization, and the service-role key, which bypasses them, stays on the server.
6. **Fail closed and say little.** Reject with a generic message, log the detail server-side. The same response for "no such user" and "wrong password", no stack traces or SQL in responses.
7. **Bound everything a caller controls:** page sizes, body sizes, array lengths, amounts, recursion, the number of outbound requests.
8. **Prefer the platform's encoder, parser and query builder** to a hand-written one. The snippets in the catalog show the rule; production code uses the framework's escaping (React escapes text children; `dangerouslySetInnerHTML` opts out), the database driver's parameters and `node:path`.

## Prove it

For each input the change touches, a test with an honest value (unchanged), a hostile value (rejected or neutralized: `<script>`, `javascript:`, `//evil.com`, `../../etc/passwd`, `\r\nInjected:`, `http://169.254.169.254/`, a negative amount, a page size of 10,000), and a newly added field that must be denied by default.
