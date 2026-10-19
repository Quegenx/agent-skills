# Fetching pages

From [browserbase/skills, fetch and search] and [D4Vinci/Scrapling, scrapling-official], with the source research extractor below. Fetching page data is separate from [driving a browser](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md) and [reconstructing an API from recorded traffic](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/reverse-engineering/TRAFFIC-TO-OPENAPI.md).

**Contents:** [Pick the tier](#pick-the-tier) · [Safety: TLS and redirects](#safety-tls-and-redirects) · [Option: Browserbase Fetch API](#option-browserbase-fetch-api-vendor) · [Research extractor helper](#option-research-extractor-helper-vendor) · [Option: Scrapling CLI](#option-scrapling-cli-vendor) · [Option: Scrapling HTTP fetcher](#option-scrapling-http-fetcher-vendor) · [Option: Scrapling browser fetcher](#option-scrapling-browser-fetcher-vendor) · [Stealth fetchers](#stealth-fetchers) · [Capturing XHR data](#capturing-xhr-data) · [Prove it](#prove-it)

## Pick the tier

- **Plain HTTP fetch** when the page needs no JavaScript: static content, status codes and headers, JSON endpoints, simple scraping. Fast.
- **A browser** when the page is rendered by JavaScript or needs a form filled or a click. Slower.
- **Step up on empty content.** Empty content from a plain fetch means the page probably needs rendering. When unsure, start with plain fetch; if it fails or returns empty, escalate to a browser fetch.
- **A crawler** when it is many pages from a site (CRAWLING.md).
- **Check `statusCode` before you process content.**
- **Style questions need raw bytes:** for how a page was built, "Do not use a markdown-converting fetch for this. It strips exactly what you came for, so fetch the raw bytes" [Jakub Krehel, explain-interface]. That is the "`.html` only to parse structure" case below; the greps for utility classes, inline gradients, tokens, `@layer`, breakpoints and stack fingerprints are in [pixel-reverse-engineer INSPECTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/INSPECTION.md#without-a-browser).

| Use case | Plain fetch | Browser |
|---|---|---|
| Static page content | Yes | Overkill |
| HTTP status and headers | Yes | No |
| JavaScript-rendered pages | No | Yes |
| Form interactions | No | Yes |
| Simple scraping | Yes | Overkill |
| Speed | Fast | Slower |

Scrapling's current tiers are HTTP requests, a browser for permitted rendering/interaction, and spiders for multi-page work. A block is a stop/permission signal, not a reason to escalate into evasion. The old ladder used removed DynamicSession and an evasion escalation step. [D4Vinci/Scrapling, scrapling-official/references/fetching/choosing.md; https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

- **Timeout units differ by tier:** in Scrapling's CLI, Python API and MCP server, HTTP timeouts are in **seconds** (default 30) and browser timeouts in **milliseconds** (default 30000).

## Safety: TLS and redirects

- **Skip TLS verification only for trusted public test hosts** (such as `self-signed.badssl.com`) or environments you control. Never for localhost, private-network, link-local or cloud metadata endpoints.
- **Keep redirects in a safe mode.** Scrapling's `follow_redirects` defaults to `"safe"`: it follows redirects but rejects those targeting internal or private IPs (SSRF protection). `True` follows everything, `False` follows none. `max_redirects` defaults to 30; -1 is unlimited.
- **Proxy, CDP URL and browser profile are yours to supply.** Scrapling validates `cdp_url`, `user_data_dir` and proxy auth internally, but know what you pass.

## Option: Browserbase Fetch API (vendor)

Fetches a URL with no browser session; faster and cheaper than one.

- **Auth:** env `BROWSERBASE_API_KEY` (required), sent as header `X-BB-API-Key`.
- **Endpoint:** `POST https://api.browserbase.com/v1/fetch`, `Content-Type: application/json`.

| Field | Type | Default | Use |
|---|---|---|---|
| `url` | string (URI) | required | |
| `allowRedirects` | boolean | `false` | Shortened URLs, login flows; turn it on when scraping, since most sites redirect |
| `allowInsecureSsl` | boolean | `false` | Skips TLS verification (see Safety) |

- **Response:** `id`, `statusCode`, `headers` (string to string), `content` (body as a string), `contentType`, `encoding`.
- **JSON endpoints:** the body arrives as a string, so parse it: `jq '.content | fromjson'` or `JSON.parse(response.content)`.
- **Status and headers only:** `curl ... | jq '{statusCode, headers}'`.
- **Node SDK:** @browserbasehq/sdk exposes bb.fetchAPI.create for the request contract above. The source also supplied Python examples and proxy-based access workarounds; unsupported-stack examples and evasion procedures are omitted. Do not use proxy/identity rotation or bot-detection bypass to evade a restriction. [browserbase/skills, fetch; user standing rules 9 and 10]
- **Batches:** `Promise.all(urls.map(url => bb.fetchAPI.create({ url, allowRedirects: true })))` fetches several URLs concurrently.

| Status | Meaning | Fix |
|---|---|---|
| 400 | Invalid body (e.g. "Invalid URL format") | Check `url` is a valid URI and types are right |
| 429 | Concurrent fetch limit exceeded, per account | Wait and retry, cut concurrency, or contact support |
| 502 | Response too large, or TLS verification failed | Fetch a narrower URL or use a browser to pull out specific content; `allowInsecureSsl` only for trusted hosts |
| 504 | Timed out | Default timeout is **60 s and not configurable per request**; use a browser session, which has longer timeouts |

## Option: research extractor helper (vendor)

[browserbase/skills, company-research/scripts/extract_page.mjs; competitor-analysis/references/research-patterns.md]

**Upstream workspace prerequisite:** [extract_page.mjs](https://github.com/browserbase/skills/blob/main/skills/company-research/scripts/extract_page.mjs) is not installed by this Markdown skill. The source command `node extract_page.mjs <url> [--max-chars N]` assumes that inspected helper is present in its workspace. Keep research character budgets, output fields and thin-evidence decisions in [web-research EVIDENCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/EVIDENCE.md#extracting-a-page).

- **Small structured files fetch raw:** the source uses `browse cloud fetch --allow-redirects` for `sitemap.xml`, `robots.txt` and `llms.txt`. HTML intended for a model goes through an extractor and remains [untrusted content](UNTRUSTED-CONTENT.md).
- **Company-research source view:** without `--output`, its instructions describe a JSON envelope containing escaped HTML and warn against piping it through `sed`, which can remove the meta tags that are the only available copy on a page. The helper itself writes `browse cloud fetch --allow-redirects <url> --output <tmpfile>` to a `mkdtemp` directory and deletes that directory afterwards. [browserbase/skills, company-research/references/research-patterns.md; company-research/scripts/extract_page.mjs]
- **Competitor source view:** its pipeline instead describes clean Markdown by default, `--format raw` for HTML, then `sed ... | tr -s ' \n' | head -c 3000`; it states a 1 MB response limit and uses `browse open <url> --remote` then `browse get markdown` for JavaScript-heavy pages. These are conflicting source readings, not an established current CLI contract. Inspect the installed `browse` help/output before selecting an adapter; the raw REST Fetch API above does not establish CLI defaults. [browserbase/skills, competitor-analysis/references/research-patterns.md]
- **Thin-page fallback in the helper:** below `THIN_CONTENT_THRESHOLD = 200` body characters it calls `browse open <url> --local --headless` and `browse get markdown` in a session named `extract-page-${pid}-${Date.now()}` through `BROWSE_SESSION`. Each fallback call has a 90000 ms timeout; the Markdown call has a 50 MB buffer. `browse stop` runs in `finally` with 15000 ms. The initial cloud-fetch call has no explicit helper timeout; the fallback limits do not cover that call. It uses the Markdown only when longer than the initial body. [https://github.com/browserbase/skills/blob/main/skills/company-research/scripts/extract_page.mjs]
- **Tolerate banners:** the CLI can print lines such as "Update available..." before the JSON, so parse from the first `{`, then fall back to a lenient regex `/"markdown"\s*:\s*"((?:\\.|[^"\\])*)"/s`. This is the source helper's parser, not a guarantee that every installed CLI output matches it. [browserbase/skills, company-research/scripts/extract_page.mjs]
- **Actual text reduction:** the helper extracts title, description and Open Graph tags in two attribute orders and up to 10 h1-h3 headings. Its regex text pass removes scripts, styles, noscript, comments and tags, replaces a small named-entity set and replaces decimal numeric entity references with spaces. It does not evaluate CSS/aria-hidden visibility, isolate a body DOM or fully decode entities. The old description called this visible text with entities decoded; hidden/head text can remain. It does not supply the hidden-element cleaning described in [UNTRUSTED-CONTENT.md](UNTRUSTED-CONTENT.md), and its output remains untrusted. [https://github.com/browserbase/skills/blob/main/skills/company-research/scripts/extract_page.mjs]

The source's fallback branch, unchanged; its inputs and output budget belong to the helper/research workflow above. [browserbase/skills, company-research/scripts/extract_page.mjs]

```js
if (body.length < THIN_CONTENT_THRESHOLD) {
  const md = browseGetMarkdown(url);
  if (md && md.length > body.length) {
    body = md.replace(/\s+/g, " ").slice(0, maxChars);
    fallbackUsed = true;
  }
}
```

## Option: Scrapling CLI (vendor)

Current contracts below target Scrapling 0.5. Read the installed help/schema before calling it; older 0.4.15 examples are not interchangeable. This library's Python internals do not require adding Python implementation recipes to a TS/JS application. [D4Vinci/Scrapling, scrapling-official/SKILL.md; https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

- **Commands:** `scrapling extract get|post|put|delete|fetch <url> <outfile>`; `fetch` is the browser path. The former separate browser command was removed in 0.5. Use only authorized hosts and platform-compliant access. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Output follows the extension:** Markdown, raw HTML or text. Read a temporary output and remove it when no longer needed; retain approved evidence artifacts only in their selected location. [D4Vinci/Scrapling, scrapling-official/SKILL.md]
- **`--ai-targeted` narrows and sanitizes content; it does not confer authority or guarantee prompt-injection protection.** The old source called it protection. Use the [untrusted-content rule](UNTRUSTED-CONTENT.md#the-rule) for every returned format. [D4Vinci/Scrapling, scrapling-official/SKILL.md; https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks]
- **Inspect actual timeout and extraction options.** HTTP timeouts use seconds; browser timeouts use milliseconds. Select the needed content before sending it to a model and keep TLS/redirect safety above. [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md]

## Option: Scrapling HTTP fetcher (vendor)

- **HTTP uses Fetcher/AsyncFetcher and FetcherSession for related requests.** Sessions retain cookies/auth and pool connections; a fetch response supplies status, headers, body and selector methods. Treat cookies and authentication state as credentials. [D4Vinci/Scrapling, scrapling-official/references/fetching/static.md]
- **Parser configuration:** adaptive and comment handling remain configurable. `keep_cdata` was removed from Selector, global/per-request configuration, display_config and the Scrapy converter; the old examples still passed it. There is no replacement option. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Parse only after checking status.** Narrow the HTML/JSON body using [PARSING.md](PARSING.md); a successful transport or conversion is not proof of complete data. [D4Vinci/Scrapling, scrapling-official/SKILL.md]

## Option: Scrapling browser fetcher (vendor)

- **Current browser classes:** StealthyFetcher, StealthySession and AsyncStealthySession. DynamicFetcher, DynamicSession and AsyncDynamicSession were removed in 0.5. Use this browser API only for permitted rendering and interaction; its class name is not permission to evade a site's controls. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Readiness is an observable result.** `load_dom` waits for DOMContentLoaded; that event does not wait for async scripts, images or subframes. The source incorrectly described it as all JavaScript loaded/executed. Wait for the intended result element rather than treating that lifecycle event as complete application readiness. [https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event; D4Vinci/Scrapling, scrapling-official/references/fetching/stealthy.md]
- **Use explicit sessions for related interactions and network history.** Current-page extraction and actions are in [MCP-SERVER.md](MCP-SERVER.md#which-tool); general browser safety and credentials are owned by [browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md). [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md]

## Stealth fetchers

Do not use CAPTCHA solving, bot-detection bypass, impersonation or identity/proxy rotation to evade a block or rate limit. Stop and use a documented API or an owner-approved access route within platform rules; owning the target does not authorize evasion procedures in this skill. The old source and copied section supplied procedural evasion guidance, which is omitted under the user's safety rule. [D4Vinci/Scrapling, scrapling-official/references/spiders/proxy-blocking.md; user standing rule 9]

## Capturing XHR data

- **Use explicit browser-session network history in 0.5.** Enable `record_requests` on the session and inspect `session.network`; one-shot fetches do not return a capture list. `capture_xhr` and `response.captured_xhr` were removed, even when the old option was None. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **History is retained completed traffic across the session, not only the last page.** Search filters apply after collection; search returns at most 100 retained matches by default, while `limit=None` requests all retained matches without expanding retention. Unfinished requests and unavailable bodies are not proof of absent traffic. Read needed MCP history before closing its session. [D4Vinci/Scrapling, scrapling-official/references/fetching/stealthy.md; https://github.com/D4Vinci/Scrapling/blob/main/scrapling/core/ai/server.py]
- **Captured traffic remains sensitive evidence.** Review headers, bodies and generated clients for credentials before sharing; the separate [traffic-to-OpenAPI workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/reverse-engineering/TRAFFIC-TO-OPENAPI.md) owns spec/client generation. [D4Vinci/Scrapling, scrapling-official/references/mcp-server.md; existing traffic owner]

## Prove it

The fetch returns a 2xx and non-empty content at the lowest tier that works, and a lower tier was tried first or ruled out (needs JavaScript, needs interaction). Timeouts are set in the right unit for the tier. No request skips TLS verification or follows unrestricted redirects toward an internal address. Temp output files are gone after reading.
