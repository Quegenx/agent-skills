# Captured traffic to an OpenAPI spec

From [browserbase/skills, browser-to-api/SKILL.md and scripts], with its source-reading limitations below. A site's own pages call its API; the Browserbase generator turns recorded request/response pairs into a best-effort OpenAPI 3.1 document, client and report offline. The generator needs Node 18+ and the standard library. The shared [observed API environment boundary](CAPTURES-AND-EVIDENCE.md#project-an-observed-api-environment) remains separate from a complete server contract.

**Contents:** [What it can and can't tell you](#what-it-can-and-cant-tell-you) · [Review the output for secrets](#review-the-output-for-secrets) · [Source prerequisites](#source-prerequisites) · [Capture](#capture) · [Generate](#generate) · [Pipeline](#pipeline) · [Static generator limits](#static-generator-limits) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## What it can and can't tell you

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Coverage is the flows you drove.** A trace cannot prove the API is complete; drive every flow you want documented.
- **Schemas are inductive, not contractual:** they describe the samples seen.
- **Auth is observed, never declared:** recorded as `x-observed-auth`, not as a security scheme.
- **Path templating is heuristic, and redaction is best-effort.**
- **Response bodies need a separate capture.** The CDP network event stream carries request `postData` but no response bodies (those need `Network.getResponseBody`). Without a body capture, responses become `{description, content: <mimeType>}` skeletons.

## Review the output for secrets

[browserbase/skills, browser-to-api/SKILL.md and scripts]

**The generated client copies raw header values.** The client's default headers include any non-standard header present in more than 50% of samples, with the **raw first observed value**, written into `client.mjs`, and the HTML report embeds `client.mjs`. Only `cookie`, `authorization`, `x-api-key` and standard headers are skipped, so CSRF tokens, `x-*-token`, session and signature headers reach the generated client unredacted, even though the redaction step would have redacted them in the spec. Before sharing or committing `client.mjs` or `index.html`, search them for tokens, session IDs and signatures, and replace the values.

## Source prerequisites

[browserbase/skills, browser-to-api/SKILL.md; browser-to-api/scripts/discover.mjs]

This Markdown skill does not install the [browser-to-api generator and modules](https://github.com/browserbase/skills/tree/main/skills/browser-to-api/scripts) or the sibling [browser-trace scripts](https://github.com/browserbase/skills/tree/main/skills/browser-trace/scripts). Commands below are source-layout examples: inspect the obtained upstream workspace and installed `browse` contract before using them. Do not execute these paths as if the helpers shipped beside this file.

The [browser-automation capture workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/RUN-TRACING.md#capture) owns the tracer setup and run lifecycle. The example below preserves this generator's body-snapshot and input-layout prerequisites, rather than defining another generic observer. Use only authorized traffic and review private captures before sharing. [browserbase/skills, browser-to-api/SKILL.md; existing browser capture owner]

## Capture

[browserbase/skills, browser-to-api/SKILL.md and scripts]

```bash
TARGET=9222
node ../browser-trace/scripts/start-capture.mjs "$TARGET" my-site
browse open about:blank --cdp "$TARGET"
browse network on                                    # capture request/response bodies
browse open https://example.com
# ...drive whatever flows you want covered...
cp -r "$(browse network path | jq -r .path)" .o11y/my-site/cdp/network/bodies/
browse network off
node ../browser-trace/scripts/stop-capture.mjs my-site
node ../browser-trace/scripts/bisect-cdp.mjs my-site
```

- **Snapshot the bodies before turning capture off:** the body directory is shared per `browse` daemon session, so a later `browse network on` would mix or overwrite them.
- The generator reads `.o11y/<run>/cdp/network/{requests,responses}.jsonl`; it never captures traffic itself.

## Generate

[browserbase/skills, browser-to-api/SKILL.md and scripts]

In the inspected upstream generator workspace, `node scripts/discover.mjs --run .o11y/my-site` writes the outputs below. Read `report.md` as text first. Before opening or sharing `index.html`, review credentials in the client/report and the [output-encoding defect](#static-generator-limits); only view the HTML after that boundary is safe. The old source instructed opening the report immediately. [browserbase/skills, browser-to-api/SKILL.md; scripts/discover.mjs; scripts/emit.mjs]

| Flag | Default | Meaning |
|---|---|---|
| `--run` | required | Run path, or a bare id resolved under `$O11Y_ROOT` (default `.o11y`) |
| `--out` | `<run>/api-spec` | Output directory |
| `--bodies` | `<run>/cdp/network/bodies/` | Auto-detected |
| `--include <re>` | | Repeatable, ORed |
| `--exclude <re>` | | Repeatable, adds to the defaults |
| `--origins a,b` | | Only these hosts; use on noisy sites |
| `--format` | `both` | `yaml`, `json` or `both` |
| `--title` | | Spec title |
| `--redact a,b` | | Adds to the default redactions, never replaces them |
| `--min-samples n` | 1 | `2` or more drops the long tail |
| `--stage` | | `load`, `filter`, `normalize`, `infer` or `emit` |

An unknown argument exits with code 2. Outputs: `index.html`, `client.mjs` (zero-dependency fetch client), `openapi.yaml`, `openapi.json`, `report.md`, `confidence.json`, `samples/<method>__<sha1-10>.json`, and `intermediate/*.jsonl` (`paired`, `filtered`, `endpoints`, `endpoint-samples`, `endpoints.with-schemas`) plus `redaction-stats.json`.

## Pipeline

[browserbase/skills, browser-to-api/SKILL.md and scripts]

### Load: pair requests with responses

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Pairing is only by CDP requestId.** The source keeps the last response for that ID and can attach it to an earlier request in a redirect chain. It does not build a verified hop-by-hop request/response join; inspect the original events and body correspondence before treating redirected observations as an endpoint contract. The old line described the terminal response as an adequate pairing guarantee. [browserbase/skills, browser-to-api/scripts/load.mjs; https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-requestWillBeSent]
- **Drop** `OPTIONS`, `data:` and `blob:` URLs, and 3xx responses.
- **Keep** types `XHR`, `Fetch`, `Document`, or any URL that looks like an API:

  ```js
  return /\/(api|graphql|rest|v\d+)\b/i.test(url) ||
         /\.(json|jsonl|ndjson)(\?|$)/i.test(url);
  ```

- **Join bodies by id, not by URL or time:** the body capture's `request.json.id` equals the CDP `requestId` for XHR and Fetch. Document bodies use another id and are skipped. Only `body` is read from the body capture; status and headers come from CDP. JSON bodies are parsed; others stay raw strings. For repeated query keys the first value wins.

### Filter: drop noise

[browserbase/skills, browser-to-api/SKILL.md and scripts]

At the filter stage, `--origins` gates everything (host equal or a `.`-suffix match), a user `--exclude` wins, and `--include` can rescue that stage's default excludes. It cannot restore rows dropped by load, override origin/user exclusions or prevent the later normalize stage from discarding page/noise classifications. The old troubleshooting claim said --include bypassed filtering globally. [browserbase/skills, browser-to-api/scripts/discover.mjs, scripts/filter.mjs, scripts/normalize.mjs]

- **Default excludes:** segment, mixpanel, google-analytics, googletagmanager, datadog(hq), sentry.io, amplitude, fullstory, hotjar, intercom.io, clarity.ms, cloudflareinsights, doubleclick, facebook.com/tr.
- **Static files:** `png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|otf|css|map|mp4|webm|mp3|m4a`, plus `/sw.js`, `/service-worker.js`, `/manifest.json`, `/robots.txt`, `/favicon.ico`.

### Normalize: group into endpoints

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Template paths in two passes:** per segment first, then across each bucket's raw paths for slugs; group by `(method, origin, template)`.
- **Path segment rules:** `v\d+`, `api`, `graphql`, `rest`, `public`, `private`, `me`, `self` are never templated. UUID v1 to v5 becomes `{id}` (string, uuid); all digits `{id}` (integer); hex of 8+ characters `{id}` (string); base62 of 8+ characters **with uppercase, lowercase and a digit** `{id}` (string). In the second pass, a column that varies across same-length paths where every value matches `^[A-Za-z0-9_-]+$` becomes `{slug}`. Repeats are numbered `{id}`, `{id2}`, with one shared counter, so `{slug2}` can follow `{id}`. (The docs describe looser base62 and "short alpha" slug rules; this is what the code does.)
- **Noise drops:** GETs that only ever return `text/html` (pages); tracking, consent, experiment, bot-defense and session paths such as `/track`, `/pixel`, `/beacon`, `/log`, `/impression`, `/pageview`, `/click`, `/session-start`, `/cookie-consent`, `/consent/`, `/onetrust`, `/experiment`, `/feature-flag`, `/akam/`, `/akamai/`; obfuscated paths (2 or more mixed-case segments of 8+ characters that aren't `v\d+|api|dapi|graphql|rest|fe|gql`); bodies whose only key is `sensor_data` or `body`. This is claimed to drop 60 to 80% of captured traffic.
- **Multiplexed endpoints** (GraphQL, JSON-RPC): look for a discriminator in the body (`operationName`, `method`, `action`, `type`, `command`) or the query (`opname`, `operationName`, `op`, `action`). It applies when at least 80% of rows carry the field with at least 2 distinct values; each operation becomes a virtual path `"<path> [<OpName>]"` with its own schemas.
- **Flags:** `divergent-response-shape`, `single-sample`, `single-status`, `mixed-content-types`, `request-body-only-on-some-samples`.
- **Query params:** `required` only when present in every sample; type tried as integer, then number, then boolean, then string.

### Infer: schemas from samples

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Merge:** a field is required when present in all non-null samples; types are unioned (integer and number kept apart); `[t, 'null']` when nullable; mixed types become a type array (valid in OpenAPI 3.1).
- **Formats** when at least 80% of strings match, checked in order: uuid, date-time, uri, email.
- **Enums** only when at most 8 distinct values over at least 5 samples, **and** distinct values ≤ max(2, floor(n/2)); otherwise every distinct ID across N samples would look like an N-way enum. (The docs state only the first condition.)
- **Response schemas are per status;** bodies without a status are skipped. The example is the first 2xx response and the first request body, redacted once and reused.
- **Observed auth headers:** `authorization`, `x-api-key`, any `*token*`, `^x-.*-auth`.

### Redact

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Headers:** `authorization`, `cookie`, `set-cookie`, `x-csrf-token`, `x-xsrf-token`, `x-api-key`, `proxy-authorization`, plus any matching `/token/i`, `/secret/i`, `/signature/i`, `/session/i`.
- **Body keys** (case-folded, `_` and `-` removed): `password`, `token`, `secret`, `api_key`/`apikey`, `accesstoken`, `refreshtoken`, `creditcard`, `ssn`.
- **Values** of 6+ characters that look like a JWT (`^eyJ...\....\....$`), an email, or a phone number (`^\+?[0-9][0-9\s().-]{6,}[0-9]$`).
- **Replace with the string `"<redacted>"`** so the value stays a string for type inference.
- This covers the spec, not the client's default headers (see Review the output for secrets).

### Emit

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- **Confidence:** `low` with 2 or fewer samples or any flag; `high` with 10+ samples and 2+ statuses; else `medium`.
- **Components** are hoisted by a stable structural hash when referenced twice or more, or when the object has 4+ properties; named from the last static path segment (`Request` suffix for request bodies) or the property key, falling back to `Schema<n>`, with `_<n>` on collisions.
- **`operationId`:** `<method>_<path tokens>` or `<method>_<OpName>`. `requestBody` only for POST, PUT, PATCH, DELETE. Each status gets a default description; the example attaches to the first status only.
- **Extensions:** `x-confidence {samples, statusCodes, normalizationFlags, confidence}`, `x-sample-count`, `x-observed-auth`, `x-origin`, `x-also-served-from` (the same method and path on several origins keeps the one with more samples).
- **`servers`** sorted by sample count; title `<host> (discovered)`; `info.version` `0.1.0-discovered`.
- **`client.mjs`:** `BASE`, default headers (`Content-Type: application/json`, the frequent non-standard headers above, and a source-generated browser identity header that must not be used for impersonation), a `request()` that throws on `!res.ok` and parses JSON by content type. Persisted-query GraphQL gets a `HASHES` table and `extensions.persistedQuery {version: 1, sha256Hash}`.
- **YAML without a library:** quote anything that could re-parse differently: reserved words (`true`, `false`, `null`, `yes`, `no`, `on`, `off`, `~`, plus `True`, `False`, `Null`, `TRUE`, `FALSE`, `NULL`), numeric-looking strings, a first character from the YAML 1.2 indicators `` , [ ] { } # & * ! | > ' " % @ ` ``, or a leading `- ? :`; strings with `'` or newlines become double-quoted JSON strings.

### Known report quirks

[browserbase/skills, browser-to-api/SKILL.md and scripts]

- The HTML report labels every card's method `POST`, and labels the protocol "GraphQL (APQ)" whenever any decomposed operation exists; check methods in `openapi.yaml`.
- Redirect 3xx responses are dropped, not recorded on the next request as the docs say.
- The reference docs describe an `open-swagger-ui.mjs` script that is not shipped; use `index.html`.

## Static generator limits

[browserbase/skills, browser-to-api/SKILL.md and scripts]

These are source-reading defects in the supplied generator, not an executed validation result or permission to rewrite it. [browserbase/skills, browser-to-api/scripts/emit.mjs, scripts/lib/schema-merge.mjs]

- **Templated paths are not substituted in the generated REST client.** buildClient passes the template path straight to request, without binding path arguments; report curl examples can retain the same placeholders. A generated function is not a usable concrete request until its path parameters are supplied and encoded through an actual implementation. The source advertised a callable client without this qualification. [browserbase/skills, browser-to-api/scripts/emit.mjs]
- **A null-only field can produce an empty type array.** The merger removes null from nonNull, treats nullable as requiring another type, then emits that empty list for null-only data. It does not describe the observed null value; use an actual null type where that is the supported inferred contract. The old source claimed all sample merges yielded a valid matching schema. [browserbase/skills, browser-to-api/scripts/lib/schema-merge.mjs; https://json-schema.org/draft/2020-12/json-schema-validation.html#section-6.1.1]
- **A nullable type does not override enum.** The source can include null in type while excluding it from enum; the observed null then still fails enum. Include null among permitted enum values when null is intended, or remove an unsupported inferred enum. [browserbase/skills, browser-to-api/scripts/lib/schema-merge.mjs; https://json-schema.org/draft/2020-12/json-schema-validation.html#section-6.1.2]
- **Date-only is not date-time.** The source's ISO_RE accepts a date with no time/offset but labels it date-time. RFC 3339 distinguishes full-date from date-time; choose the actual observed representation and format rather than copying that overbroad inference. [browserbase/skills, browser-to-api/scripts/lib/schema-merge.mjs; https://www.rfc-editor.org/rfc/rfc3339#section-5.6]
- **Generated report HTML still needs output encoding.** Most report fields call escHtml, but the Client usage variable JSON is interpolated into an HTML code element without that encoding. Treat capture-controlled values as untrusted and repair their output boundary before opening or sharing the report; JSON.stringify alone is not HTML encoding. No replacement template or payload is invented here. [browserbase/skills, browser-to-api/scripts/emit.mjs]
- **Client and curl examples choose the primary origin.** The spec can list several servers and x-origin values while generated requests use servers[0]. Inspect each operation's observed origin and any collisions; do not assume the client exercises every captured origin. Redirect joins need the separate qualification above. [browserbase/skills, browser-to-api/scripts/emit.mjs, scripts/load.mjs]

The shared HTML and JSON-in-HTML boundary is defined in [secure-coding CATALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/CATALOG.md); keep one definition rather than treating a generated report as trusted. [existing security owner]

## Troubleshooting

[browserbase/skills, browser-to-api/SKILL.md and scripts]

| Symptom | Cause and fix |
|---|---|
| `paired.jsonl` empty | Inspect recorded requests and the load-stage method/URL/status gates. The loader retains XHR, Fetch, Document and API-shaped URLs; absence of XHR/Fetch alone does not explain empty paired output. The old line incorrectly said static-only sites yielded nothing. [browserbase/skills, browser-to-api/scripts/load.mjs] |
| `paths: {}` | Inspect each saved pipeline stage and its drop reason; --include only affects its documented filter-stage branch, not load/normalization or origin/user exclusions |
| Over-aggressive templating | `--exclude` the noisy paths |
| Everything `type: "string"` | Bodies aren't JSON or weren't captured; check `reqBody` and `respBody` in `paired.jsonl` |
| Validator rejects `info.version` `0.1.0-discovered` | Inspect the validator or consumer's documented restriction. OpenAPI 3.1.1 defines this as a required string distinct from the `openapi` specification version; that field definition does not prohibit this value. The old advice prescribed editing without naming a restriction. [https://spec.openapis.org/oas/v3.1.1.html#info-object] |

## Prove it

[browserbase/skills, browser-to-api/SKILL.md and scripts]

`report.md` lists an endpoint for every flow you drove and none for analytics or static files; `--min-samples 2` leaves the endpoints you care about; response schemas have real types (not all strings), which shows bodies were captured. A search of `client.mjs`, `index.html` and `samples/` for the token, cookie and session values from the capture finds none. Path parameters and origins match the intended request, nullable/date formats describe the samples, and report interpolation is safe before the HTML is opened or shared. State unperformed validation rather than claiming a runnable complete client. [browserbase/skills, browser-to-api/scripts/emit.mjs, scripts/lib/schema-merge.mjs]
