---
name: secure-coding
description: "Closes holes where untrusted input meets code, plus authentication, tenant isolation with RLS, secrets, tricky parsers and response security headers. Use when handling user input, URLs, uploads, auth, permissions or multi-tenant data, setting HSTS, CSP or cookie flags, or reviewing for security."
---

# Secure coding

Every rule here comes down to one decision: trust nothing that crossed the boundary, and say what's allowed rather than what's forbidden. A blocklist is a list of the attacks you thought of. Read the catalog for the input you're handling:

| The input or output | Read |
|---|---|
| Request bodies, HTML output, JSON inside a script element (JSON-LD), links, redirects, outbound URLs, file names and paths, logs, email headers, SQL, amounts, pagination, errors | [CATALOG.md](CATALOG.md) |
| Response security headers by value: HTTPS redirects and mixed content, HSTS, CSP, framing, `nosniff`, `Referrer-Policy`, cookie attributes, exposed `.env` and `.git` files | [HEADERS.md](HEADERS.md) |
| JWT validation, refresh-token rotation, API keys, permission checks, password hashing and upgrading it, TOTP two-factor, Next.js Server Action auth | [AUTH.md](AUTH.md) |
| Tenant isolation: scoped queries plus Postgres row-level security, pooled connections, Supabase policies | [TENANCY.md](TENANCY.md) |
| Encrypting stored secrets (AES-GCM, key versions, KMS), keeping internal services off the internet | [SECRETS-AND-NETWORK.md](SECRETS-AND-NETWORK.md) |
| Parsers that disagree (IP spellings, duplicate JSON keys, request smuggling, Unicode lookalikes), ReDoS and expansion bombs, CSV formulas, shell arguments, card numbers in logs, CORS, reset tokens, delegation chains, webhook signatures | [PARSERS.md](PARSERS.md) |
| Browser and Electron boundaries: window messages, cross-tab identity, service-worker caches, DOM gadgets, cross-site observations and IPC sender/bridge controls | [BROWSER-BOUNDARIES.md](BROWSER-BOUNDARIES.md) |
| Package installation boundaries: version-specific lifecycle-script policies, direct and transitive execution, dependency sources, evidence and exceptions | [PACKAGE-INSTALLS.md](PACKAGE-INSTALLS.md) |

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

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

For each input the change touches, a test with an honest value (unchanged), a hostile value (rejected or neutralized: `<script>`, `javascript:`, `//evil.com`, `../../etc/passwd`, `\r\nInjected:`, `http://169.254.169.254/`, a negative amount, a page size of 10,000, `</script><script>alert(1)</script>` inside a JSON-LD value), and a newly added field that must be denied by default.
