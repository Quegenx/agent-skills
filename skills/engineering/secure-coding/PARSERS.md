# Parsers that disagree, inputs that explode, outputs others interpret

Many attacks need no bug in your logic: two components read the same bytes differently, a small input costs exponential work, or text you emit is executed by the next program. TypeScript and Node.

## When two parsers disagree

The check runs on one parse and the action on another. Parse once, at the edge, and pass the parsed value on; never let a second component re-parse the raw input with different rules.

- **IP addresses in URLs:** `2130706433`, `0x7f.1`, `0177.0.0.1` and `127.1` are all `127.0.0.1`. The WHATWG `URL` parser (Node's `new URL`, `fetch`) normalizes them, so a check on `new URL(raw).hostname` sees `127.0.0.1`; a regex on the raw string, or a different URL library than the HTTP client uses, sees an unfamiliar number and lets it through. Check the hostname from the same parser the client uses, then the resolved addresses ([CATALOG.md](CATALOG.md), SSRF).
- **Duplicate JSON members:** `JSON.parse('{"role":"user","role":"admin"}')` returns `admin` (last wins); other parsers keep the first. A gateway that validates one and a service that acts on the other disagree about the same request. For signed or security-relevant payloads, verify the signature over the raw bytes, parse once, and reject documents with duplicate keys using a strict parser; parse untrusted JSON with protection against `__proto__` and `constructor` keys (prototype pollution) when the result is merged into other objects.
- **HTTP message framing:** a request carrying both `Content-Length` and `Transfer-Encoding`, two different `Content-Length` values, or an unusual `Transfer-Encoding` lets a proxy and the server split the byte stream into different requests (request smuggling). Reject such messages with 400 and close the connection; keep Node's strict parser (never enable `insecureHTTPParser`); keep the proxy and server versions that agree on framing, and prefer HTTP/2 end to end.
- **Unicode lookalikes:** `ｊohn` (fullwidth) and `john` are different strings; so are `admin` with a Cyrillic `а` and the Latin one. For identifiers people must not impersonate (usernames, workspace slugs), derive a comparison key: NFKC-normalize, lowercase, and then either restrict the key to an allowlisted character set (`/^[a-z0-9_]{3,30}$/`) or map confusable characters to a skeleton (Unicode's confusables data, UTS #39). Put a unique index on the key; store and display the original.

```ts
export function usernameKey(raw: string): string {
  const key = raw.normalize("NFKC").toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(key)) throw new Error("USERNAME_INVALID_CHARACTERS");   // Cyrillic "а" fails here
  return key;
}
```

## Inputs that cost exponential work

**Availability findings need a shared consequence.** Trace input to resource cost, effective body/file/message bounds, upstream limits, concurrency, cancellation cleanup and shared pools before declaring a path unbounded. A missing local rate limiter alone is not a vulnerability; use the [security audit evidence contract](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SECURITY-AUDITS.md#boundary-and-result), and do not stress a live service to fill an evidence gap. [cloudflare/security-audit-skill, security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md]

- **Regular expressions with nested quantifiers** backtrack exponentially on a near-match: `/^([A-Z0-9]+-?)+$/` took about 19 seconds on 28 letters and a `!` in Node, blocking the event loop for every request. Rewrite so each character can be matched only one way (`/^[A-Z0-9]+(-[A-Z0-9]+)*$/` answers in a millisecond on 100,000 characters), cap the input length before matching, and run user-supplied patterns only on a linear-time engine (the `re2` package). Test validators with a long, almost-matching string.
- **Expansion bombs:** a few kilobytes that expand to gigabytes. XML entities (the billion laughs: disable DTDs and entity expansion in the XML parser), YAML aliases (cap the alias count), compressed uploads (limit the decompressed size while streaming, `zlib` `maxOutputLength`, and the entry count and total size of archives), CSS custom properties (`--ha2: var(--ha1) var(--ha1) var(--ha1);` and so on: "CSS was a victim of this when custom properties were introduced", [nerdy.dev: Lol Bomb](https://nerdy.dev/lol-bomb), 2021-08-01; the spec's defence is in [css-variables](https://drafts.csswg.org/css-variables/#long-variables)), and your own features: snippets, templates or macros that reference each other. Enforce the budget during expansion, not after:

```ts
export function expandSnippets(text: string, snippets: Map<string, string>, budget = { chars: 100_000, depth: 10 }): string {
  let produced = 0;
  const expand = (input: string, depth: number, seen: Set<string>): string =>
    input.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
      if (depth >= budget.depth) throw new Error("EXPANSION_TOO_DEEP");
      if (seen.has(name)) throw new Error("EXPANSION_CYCLE");
      const body = snippets.get(name) ?? "";
      const out = expand(body, depth + 1, new Set(seen).add(name));
      produced += out.length;
      if (produced > budget.chars) throw new Error("EXPANSION_TOO_LARGE");
      return out;
    });
  return expand(text, 0, new Set());
}
```

## Output another program interprets

- **Spreadsheet formulas:** a CSV cell starting with `=`, `+`, `-`, `@`, tab or carriage return runs as a formula when an admin opens the export (`=HYPERLINK(...)` exfiltrating data). Prefix such cells with `'` (and quote every field), or export a format that has no formulas. Negative numbers then open as text; export numeric columns unprefixed only when they are produced by your code, never from user text.

```ts
export const csvCell = (value: string): string => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};
```

- **Shell commands:** never build a command string from input. Call the program directly with an argument array (`execFile("convert", [input, output])`, `spawn` without `shell: true`), and put `--` before user-supplied arguments so a value starting with `-` can't become an option (`git log -- ${path}`).
- **Logs:** card numbers, tokens and passwords end up in logs through request dumps and error messages. Redact by field name at the logger (pino's `redact` paths for `password`, `authorization`, `card.number`) and, as a backstop, mask digit runs that pass the Luhn check, keeping the last four:

```ts
const luhn = (digits: string) =>
  [...digits].reverse().reduce((sum, d, i) => sum + (i % 2 ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][+d] : +d), 0) % 10 === 0;

export const redactCardNumbers = (text: string): string =>
  text.replace(/\b(?:\d[ -]?){12,18}\d\b/g, (m) => {
    const digits = m.replace(/\D/g, "");
    return luhn(digits) ? `[card ending ${digits.slice(-4)}]` : m;
  });
```

  CRLF injection in log lines and email headers is in [CATALOG.md](CATALOG.md).

## Cross-origin requests and proxies

- **CORS:** answer with an exact origin from an allowlist, never by echoing the request's `Origin` header. Reflecting any origin together with `Access-Control-Allow-Credentials: true` lets every website read your users' authenticated responses. Don't trust `Origin: null` (sandboxed iframes and local files send it), don't match origins with `endsWith` or unanchored regexes, and send `Vary: Origin` so caches don't serve one origin's answer to another.

```ts
const ALLOWED_ORIGINS = new Set(["https://app.example.com", "https://admin.example.com"]);

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return { Vary: "Origin" };       // no CORS headers: the browser blocks the read
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", Vary: "Origin" };
}
```

  CORS only controls which sites may read responses in a browser; it doesn't authenticate anything and doesn't stop requests from other clients.
- **The client's address behind proxies:** take it from the hop your own proxy appended to `X-Forwarded-For`, counting from the right, never the leftmost value the client wrote (the `api-design` skill's RELIABILITY.md, rate limiting).

## Tokens with a scope

- **Password reset tokens:** random (32 bytes), stored hashed, single use, expiring within minutes to an hour, bound to one user and one purpose (a reset token isn't valid for email verification or login), and invalidated when used, when another is issued, and when the password changes. After a reset, revoke the user's other sessions and refresh tokens. The request endpoint answers the same whether or not the email exists, and is rate-limited per account and per IP. Put the token in the URL path or fragment of a page that immediately exchanges it, and keep it out of logs and `Referer` headers (`Referrer-Policy: no-referrer`).
- **Delegated capabilities** (one service passing a narrowed permission to another, as with macaroons, UCAN or signed delegation tokens): verify the whole chain, not the last link. The root must be a trusted issuer; each link must be signed by the previous holder; each link's permissions must be a subset of its parent's (attenuation: they can only narrow); each expiry must be no later than its parent's; the last link must name the presenter; cap the chain length.

```ts
type Link = { issuer: string; audience: string; scopes: string[]; expiresAt: number };

export function verifyDelegationChain(chain: Link[], opts: {
  trustedRoots: Set<string>; presenter: string; now: number; maxLength: number;
  signatureValid: (link: Link, index: number) => boolean;              // checks link i was signed by link i's issuer
}): Set<string> {
  if (chain.length === 0 || chain.length > opts.maxLength) throw new Error("DELEGATION_CHAIN_LENGTH");
  if (!opts.trustedRoots.has(chain[0].issuer)) throw new Error("DELEGATION_UNTRUSTED_ROOT");
  let allowed = new Set(chain[0].scopes);
  let notAfter = chain[0].expiresAt;
  chain.forEach((link, i) => {
    if (!opts.signatureValid(link, i)) throw new Error("DELEGATION_BAD_SIGNATURE");
    if (i > 0 && link.issuer !== chain[i - 1].audience) throw new Error("DELEGATION_BROKEN_LINK");
    if (link.expiresAt > notAfter || link.expiresAt <= opts.now) throw new Error("DELEGATION_EXPIRY");
    if (!link.scopes.every((s) => allowed.has(s))) throw new Error("DELEGATION_SCOPE_WIDENED");
    allowed = new Set(link.scopes);
    notAfter = link.expiresAt;
  });
  if (chain[chain.length - 1].audience !== opts.presenter) throw new Error("DELEGATION_WRONG_PRESENTER");
  return allowed;
}
```

- **Incoming webhooks:** verify the provider's signature (an HMAC over the raw body plus timestamp, compared with `crypto.timingSafeEqual`) before parsing, reject timestamps outside a few minutes to stop replays, and record the event ID in the same transaction as its effect so redeliveries do nothing (the `messaging` skill's OUTBOX-INBOX.md).

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhook(rawBody: string, timestamp: string, signatureHex: string, secret: string, nowMs = Date.now()): boolean {
  if (Math.abs(nowMs - Number(timestamp) * 1000) > 5 * 60_000) return false;           // replay window
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const given = Buffer.from(signatureHex, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
```

## Prove it

For each parser boundary, a test with the ambiguous input (a duplicate key, a decimal IP, a fullwidth or Cyrillic username, a request with both framing headers) showing it's rejected or read identically everywhere; for each pattern and expander, a near-miss input with a time or size budget; for each export, a cell starting with `=`.
