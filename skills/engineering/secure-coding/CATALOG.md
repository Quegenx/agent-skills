# The catalog: one input at a time

## Request bodies: mass assignment

Binding a request body to a stored row (`update(profile, req.body)`, `{ ...existing, ...body }`) lets a caller set `role`, `isVerified`, `balance` or `ownerId`. Accept only the editable fields, and let the server decide whose row it is.

```ts
const ProfileEdit = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().max(500),
  avatarUrl: z.string().url(),
}).partial().strict();                                     // strict: an unknown key is an error, not silently dropped

const edit = ProfileEdit.parse(await req.json());
await db.from("profiles").update(edit).eq("id", session.userId);   // the row comes from the session, never the body
```

A field added to the table later is denied until someone adds it to the schema on purpose. Without `.strict()`, zod strips unknown keys, which is also safe; `.strict()` makes the attempt visible.

## HTML output: stored XSS

Encode every user-supplied field (the author name too, not only the body) where it enters HTML. Replace in one pass so `&` isn't encoded twice:

```ts
const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
```

Honest text comes out looking unchanged. Stripping `<script>` or blocklisting tags fails on the next payload and mangles `x < y`. In React, text children are escaped for you; `dangerouslySetInnerHTML`, `href` values and inline event handlers are where escaping stops, so sanitize HTML you must render with a maintained sanitizer.

### JSON inside a script element

JSON-LD written into `<script>` is a different context: "JSON escaping alone does not stop a product string containing a script-closing tag from terminating the element" [coreyhaines31/marketingskills, schema]. The [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld): "`JSON.stringify` ... does not sanitize malicious strings used in XSS injection", so scrub them "by replacing the character, `<`, with its unicode equivalent, `\u003c`", or use a maintained serializer such as `serialize-javascript`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
/>
```

The same guide uses a native `<script>`, not `next/script`: JSON-LD "is structured data, not executable code". Escape at the HTML embedding boundary, "without deleting legitimate characters from the source data"; "parsing the JSON recovers the original product text" [coreyhaines31/marketingskills, schema]. aeo.js escapes more: "A schema value containing `</script>` (or U+2028 / U+2029) breaks out of the script block", fixed with [aeo.js]

```ts
JSON.stringify(value).replace(/</g, "\\u003C").replace(/>/g, "\\u003E").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
```

Which structured data to emit is the [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md).

## Links: scheme allowlist

A link built from user input can be `javascript:alert(1)`. Parse it and allow only the schemes you mean:

```ts
const LINK_SCHEMES = new Set(["http:", "https:", "mailto:"]);
function safeLink(raw: string, base: string): string | null {
  try { const url = new URL(raw, base); return LINK_SCHEMES.has(url.protocol) ? url.href : null; }
  catch { return null; }
}
```

## Redirects: local only

`?next=` that redirects anywhere turns your domain into a phishing launcher. `startsWith("/")` accepts `//evil.com` and `/\evil.com`, which browsers treat as another host. Resolve against your origin and compare origins:

```ts
function safeRedirectPath(target: string, origin: string): string {
  try {
    const url = new URL(target, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : "/";
  } catch { return "/"; }
}
```

## Host allowlists without suffix confusion

`hostname.endsWith("example.com")` accepts `evil-example.com`. Compare the parsed `url.hostname` (lowercased by the parser) to an exact set, and allow subdomains only with the dot: `host === "example.com" || host.endsWith(".example.com")`. Never match on the raw string, where `https://example.com@evil.com/` puts the real host after the `@`.

## Outbound fetches: SSRF

A server that fetches a user-supplied URL (webhooks, previews, imports) can be pointed at itself, the internal network or the cloud metadata endpoint at `169.254.169.254`. Checking the hostname text isn't enough: resolve it and check every address, including IPv6 and IPv4-mapped forms.

```ts
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const PRIVATE = new BlockList();
for (const [net, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16]] as const) PRIVATE.addSubnet(net, bits, "ipv4");
for (const [net, bits] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10]] as const) PRIVATE.addSubnet(net, bits, "ipv6");

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("SSRF_SCHEME_DENIED");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const family = isIP(host);
  const addresses = family ? [{ address: host, family }] : await lookup(host, { all: true });
  for (const a of addresses) {
    if (PRIVATE.check(a.address, a.family === 6 ? "ipv6" : "ipv4")) throw new Error("SSRF_PRIVATE_ADDRESS");
  }
  return url;
}
```

Use the hostname from the same parser the HTTP client uses: `new URL` turns `2130706433`, `0x7f.1` and `127.1` into `127.0.0.1`, while a regex on the raw string doesn't ([PARSERS.md](PARSERS.md)). A `BlockList` rule for an IPv4 range also matches the IPv4-mapped IPv6 form (`::ffff:127.0.0.1`) when checked as `"ipv6"`. The check alone still leaves three gaps:

- **Redirects:** fetch with `redirect: "manual"`, run the check on each `Location`, and cap the number of hops.
- **DNS rebinding:** the name can resolve to a public address for the check and a private one for the connection. Connect to the address you checked (a custom `lookup` on the HTTP agent that applies the same rules), or send outbound traffic through an egress proxy that enforces them.
- **Network controls:** the process shouldn't be able to reach the metadata service or internal admin ports at all; code checks are the second line.

**Crawlers are where this check gets cut short.** OpenSEO's site-audit crawler resolves DNS (over DoH) "only for the start URL ... per-link DoH lookups would be prohibitively slow"; links found mid-crawl are checked by hostname or IP-literal text only, and a failed lookup returns `false`, so it fails open [open-seo, url-policy.ts]. aeo.js never resolves at all: its guard matches hostname strings and literal IPs, so a public name pointing at a private address passes [aeo.js]. That is the ceiling of a text-only check; a crawler that fetches arbitrary links needs the per-connection check above or an egress proxy. OpenSEO's block list also names entries the list above lacks: the hostname `metadata.google.internal`, the address `100.100.100.200`, the `.internal` and `.home.arpa` suffixes, `198.18.0.0/15`, and everything from `224.0.0.0` up [open-seo, url-policy.ts]. Add the ranges and the address to `PRIVATE`, and match the hostname and suffixes (exactly, or with the leading dot) before resolving.

## File names and paths

**Uploads:** store under a server-owned ID and keep the user's name only as display metadata. When a user-chosen name must hit the disk, sanitize it:

```ts
export function sanitizeFileName(raw: string): string {
  const last = raw.split(/[\\/]/).pop() ?? "";               // both separators: Windows paths arrive too
  const name = last.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 64);
  return name === "" || /^\.+$/.test(name) ? "file" : name;
}
```

**Reading a path the user influences:** resolve it and require the result to stay under the root.

```ts
import path from "node:path";
export function resolveUnderRoot(root: string, userPath: string): string {
  const base = path.resolve(root);
  const full = path.resolve(base, userPath);
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error("PATH_OUTSIDE_ROOT");
  return full;
}
```

`startsWith(base)` without the separator accepts `/srv/files-evil`. Symlinks inside the root can still point out; resolve with `fs.realpath` before the check when links are possible. Lexical normalization of a path (collapsing `..`) is not a security check by itself.

**A resolved path is not a race-safe open.** If a lower-trust writer can replace a path component between validation and use, retain a verified directory/file descriptor, use no-follow directory-relative traversal where the platform supports it, verify final type and bounds, and read through that same handle. Fail closed when the required confinement cannot be enforced. The old realpath-before-check advice above is incomplete under concurrent path replacement; Node also warns against check/open races, and its archive reader uses no-follow open plus descriptor validation. [cloudflare/security-audit-skill, security-audit/SKILL.md; https://github.com/nodejs/node/blob/main/doc/api/fs.md; https://github.com/nodejs/node/blob/main/lib/internal/zip/archive.js]

## Logs and email headers: CRLF injection

A username of `bob\r\n2026-10-15 INFO admin logged in` forges a log line. Escape carriage return and newline in every field you write into a text log, so they show as visible `\r` and `\n`:

```ts
const logSafe = (s: string) => s.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
```

Structured JSON logging escapes them inside string values, which is the better default; the viewer that renders the log still needs output encoding. In email, a subject or recipient containing `\r\n` adds headers (`Bcc:`): reject control characters in any header value, and let the mail library build headers.

## SQL

- **Values are always bound parameters** (`$1`, `@minPages`, the query builder's `.eq(...)`), never concatenated, including numbers and dates.
- **Identifiers can't be parameters.** Map user choices to trusted fragments and reject everything else:

```ts
const SORTS = { newest: "created_at desc", oldest: "created_at asc", title: "title asc" } as const;
type SortKey = keyof typeof SORTS;
const sortSql = (key: string) => (key in SORTS ? SORTS[key as SortKey] : SORTS.newest);
```

- When an identifier truly must be dynamic inside Postgres, quote it with `format('%I', name)` or `quote_ident`, after an allowlist check.

## Content types

Compare the parsed media type to an exact set: `header.split(";")[0].trim().toLowerCase()` in `{"image/png", "image/jpeg", "application/pdf"}`. A substring check accepts `text/html; image/png`. For stored uploads the header is a claim; check the file's magic bytes and serve it back with the stored type and `Content-Disposition: attachment` when it isn't meant to render.

## Amounts and numbers

- **Sign:** a refund or transfer of `-500` is a deposit. Require `Number.isSafeInteger(cents) && cents > 0`, and a refund no larger than what was captured minus earlier refunds.
- **Overflow:** a quantity times a price can pass the safe-integer range or a database column's width. Detect it and fail explicitly instead of wrapping or rounding.
- **Page size:** clamp what the caller asks for (`Math.min(Math.max(requested ?? 20, 1), 100)`) or reject it; an unbounded `limit` is a denial-of-service parameter.

## Lookups and errors

- **No enumeration:** "unknown email" versus "wrong password", or 404 versus 403 on someone else's resource, tells an attacker which accounts or IDs exist. Return the same status and message for both, and keep the timing similar (hash a dummy password when the user doesn't exist).
- **Scrubbed errors:** respond with a stable error code, a generic message and a correlation ID; log the exception, SQL and stack server-side only (the `api-design` skill's problem-details format).
