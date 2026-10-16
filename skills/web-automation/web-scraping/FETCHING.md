# Fetching pages

**Contents:** [Pick the tier](#pick-the-tier) · [Safety: TLS and redirects](#safety-tls-and-redirects) · [Option: Browserbase Fetch API](#option-browserbase-fetch-api-vendor) · [Option: Scrapling CLI](#option-scrapling-cli-vendor) · [Option: Scrapling HTTP fetcher](#option-scrapling-http-fetcher-vendor) · [Option: Scrapling browser fetcher](#option-scrapling-browser-fetcher-vendor) · [Stealth fetchers](#stealth-fetchers) · [Capturing XHR data](#capturing-xhr-data) · [Prove it](#prove-it)

## Pick the tier

- **Plain HTTP fetch** when the page needs no JavaScript: static content, status codes and headers, JSON endpoints, simple scraping. Fast.
- **A browser** when the page is rendered by JavaScript or needs a form filled or a click. Slower.
- **Step up on empty content.** Empty content from a plain fetch means the page probably needs rendering. When unsure, start with plain fetch; if it fails or returns empty, escalate to a browser fetch.
- **A crawler** when it is many pages from a site (CRAWLING.md).
- **Check `statusCode` before you process content.**

| Use case | Plain fetch | Browser |
|---|---|---|
| Static page content | Yes | Overkill |
| HTTP status and headers | Yes | No |
| JavaScript-rendered pages | No | Yes |
| Form interactions | No | Yes |
| Simple scraping | Yes | Overkill |
| Speed | Fast | Slower |

One library's ladder (Scrapling), each tier with a session class that keeps the connection or browser alive:

```
get / FetcherSession
  └─ If JS required → fetch / DynamicSession
       └─ If blocked → stealthy-fetch / StealthySession
            └─ If multi-page → Spider
```

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
| `proxies` | boolean | `false` | IP rate limiting or geo-restrictions |

- **Response:** `id`, `statusCode`, `headers` (string to string), `content` (body as a string), `contentType`, `encoding`.
- **JSON endpoints:** the body arrives as a string, so parse it: `jq '.content | fromjson'` or `JSON.parse(response.content)`.
- **Status and headers only:** `curl ... | jq '{statusCode, headers}'`.
- **SDKs:** Node `@browserbasehq/sdk`, `bb.fetchAPI.create({ url, allowRedirects, allowInsecureSsl, proxies })`; Python `browserbase`, `bb.fetch_api.create(url=..., allow_redirects=..., allow_insecure_ssl=..., proxies=...)` returning `status_code`, `headers`, `content`. The Python sync SDK runs a batch one request after another.
- **Batches:** `Promise.all(urls.map(url => bb.fetchAPI.create({ url, allowRedirects: true })))` fetches several URLs concurrently.

| Status | Meaning | Fix |
|---|---|---|
| 400 | Invalid body (e.g. "Invalid URL format") | Check `url` is a valid URI and types are right |
| 429 | Concurrent fetch limit exceeded, per account | Wait and retry, cut concurrency, or contact support |
| 502 | Response too large, or TLS verification failed | Fetch a narrower URL or use a browser to pull out specific content; `allowInsecureSsl` only for trusted hosts |
| 504 | Timed out | Default timeout is **60 s and not configurable per request**; use a browser session, which has longer timeouts |

## Option: Scrapling CLI (vendor)

Python 3.10+. Set up in a venv: `pip install "scrapling[all]>=0.4.15"`, then `scrapling install --force` (downloads browser dependencies). If `scrapling` is not on `$PATH`, use its full path. Docker images `pyd4vinci/scrapling` or `ghcr.io/d4vinci/scrapling:latest` cover the commands only, not Python code. The `rag` extra installs Markdown conversion support; `ai`, `shell` and `all` include it.

- **Commands:** `scrapling extract get|post|put|delete|fetch|stealthy-fetch <url> <outfile>`. `get` for simple sites, blogs, news; `fetch` for modern web apps and dynamic content.
- **The output format follows the file extension:** `.md` converts HTML to Markdown, `.html` saves raw, `.txt` saves clean text. Prefer `.md`; use `.html` only to parse structure.
- **Write to a temp file, read it back, then always delete it.**
- **Always pass `--ai-targeted`** to protect against prompt injection: it extracts main content and sanitizes hidden elements (default off). On browser commands it also turns on ad blocking.
- **Select with `-s/--css-selector`** (returns all matches) instead of passing whole HTML; it saves tokens significantly.
- **HTTP options** (`get`, `post`, `put`, `delete`): `-H/--headers "Key: Value"` (repeatable), `--cookies "n1=v1; n2=v2"`, `--timeout` seconds (default 30), `--proxy "http://user:pass@host:port"`, `-p/--params "k=v"` (repeatable), `--follow-redirects/--no-follow-redirects` (default safe), `--verify/--no-verify` (default on), `--impersonate`, `--stealthy-headers/--no-stealthy-headers` (default on). `post` and `put` add `-d/--data "a=1&b=2"` and `-j/--json '<json>'`.
- **Browser options** (`fetch`, `stealthy-fetch`): `--headless/--no-headless` (default on), `--disable-resources` (default off), `--network-idle` (default off), `--real-chrome` (default off), `--timeout` ms (default 30000), `--wait` ms (default 0), `--wait-selector`, `--proxy`, `-H/--extra-headers`, `--dns-over-https` (Cloudflare DoH to prevent DNS leaks with proxies, default off), `--block-ads` (about 3,500 ad and tracker domains, default off), `--executable-path` (falls back to env `SCRAPLING_EXECUTABLE_PATH`). `fetch` only: `--locale`.

## Option: Scrapling HTTP fetcher (vendor)

`from scrapling.fetchers import Fetcher, AsyncFetcher, StealthyFetcher, DynamicFetcher`. The HTTP tier runs on `curl_cffi`; any other `curl_cffi` argument passes through.

- **Defaults:** `timeout=30` s, `retries=3`, `retry_delay=1` s, `follow_redirects="safe"`, `max_redirects=30`, `verify=True`, `http3=False` (can be problematic with `impersonate`), `stealthy_headers` on, `impersonate` the latest Chrome (a list picks one at random per request).
- **Other args:** `cookies` (dict or list of dicts), `proxy` (`http://user:pass@host:port`), `proxy_auth` (tuple), `proxies` (`{"http": ..., "https": ...}`), `proxy_rotator` (cannot combine with `proxy`/`proxies`), `headers` (override generated ones), `cert=(cert, key)`, `selector_config`.
- **Methods:** `get(params=)`, `post`/`put`/`delete(data=, json=)`, `auth=(user, pw)` for basic auth. **`OPTIONS` and `HEAD` are not supported.** Async: `AsyncFetcher` with `await`.
- **Use a `FetcherSession` for many requests:** it keeps cookies and auth, pools connections and holds one config (overridable per request). It works in sync and async code; `asyncio.gather(*[session.get(u) for u in urls])`. `Fetcher` alone makes a temporary session per request; the library claims a session is 10 times faster than a session per request.
- **Response:** a `Selector` (PARSING.md) plus `status`, `reason`, `cookies` (dict), `headers`, `request_headers`, `history` (redirects), `body` (always bytes), `encoding`, `meta` (e.g. the proxy used), `captured_xhr`.
- **JSON:** `page.json()`. **Files:** write `page.body` to a file opened `'wb'`.
- **Pagination:** loop `?page={n}` until `page.css('.product')` comes back empty.
- **Global parser config:** `Fetcher.configure(adaptive=True, keep_comments=False, keep_cdata=False)` (keys `adaptive`, `adaptive_domain`, `huge_tree`, `keep_comments`, `keep_cdata`, `storage`, `storage_args`); `display_config()` shows them; per request `selector_config={...}`. `adaptive` is off by default.

## Option: Scrapling browser fetcher (vendor)

`DynamicFetcher` runs Playwright; async method `async_fetch`. Three modes: bundled Chromium; `real_chrome=True` (installed Chrome; `playwright install chrome` installs it); `cdp_url='ws://...'` or `http://localhost:9222` for a remote or managed browser.

- **Waiting:** `load_dom` (default on, waits for `domcontentloaded`), `network_idle` (no connections for 500 ms), `wait` (ms after everything), `wait_selector` with `wait_selector_state` (default `attached`; also `detached`, `visible`, `hidden`; `visible` means a non-empty box and not `visibility:hidden`, and `display:none` counts as not visible). Order: navigation, network idle (if on), `page_action`, `wait_selector`, `load_dom` re-check, network idle re-check.
- **Hooks:** `page_setup(page)` runs before `page.goto()` (register listeners and routes); `page_action(page)` runs after navigation. Both must be async functions with `async_fetch`. `init_script` takes an absolute path to a JS file run on page creation.
- **Speed:** `disable_resources` drops fonts, images, media, beacons, objects, imagesets, text tracks, websockets, CSP reports and stylesheets (about 25% faster on some sites, but some sites then never finish loading); `blocked_domains` (a set, subdomains match); `block_ads`.
- **Other args:** `headless` (default on), `timeout` ms (default 30000), `cookies`, `useragent`, `extra_headers`, `google_search` (default on), `proxy` (string, or dict with only `server`/`username`/`password`), `locale`, `timezone_id`, `user_data_dir` (sessions only), `extra_flags`, `additional_args` (Playwright context; beats the library's settings), `dns_over_https`, `proxy_rotator`, `retries=3`, `retry_delay=1`, `capture_xhr`, `executable_path`, `selector_config`.
- **Sessions** (`DynamicSession`, `AsyncDynamicSession`) reuse the browser and keep cookies. Per-request overrides: `google_search`, `timeout`, `wait`, `page_action`, `page_setup`, `extra_headers`, `disable_resources`, `wait_selector`, `wait_selector_state`, `network_idle`, `load_dom`, `blocked_domains`, `proxy`, `selector_config`.
- **Tab pool (`max_pages`):** a request reuses a free tab (tab-level settings are re-applied, so nothing leaks), else opens a new one under `max_pages`, else polls for **60 s** and raises `TimeoutError` (usually an unresponsive site). Errored tabs are closed and replaced; `session.close_pages()` closes all; `get_pool_stats()` shows busy, free and errored. Tabs stay open, so the next request's `page_setup` runs on the previous page, which lets you chain steps.
- **Proxies with a browser:** a browser can't set a proxy per tab, so with a `ProxyRotator` the fetcher opens one context per proxy with one tab each, and closes both when done.

## Stealth fetchers

Stealth browser fetchers exist for sites behind bot protection: in Scrapling, `StealthyFetcher` (sessions `StealthySession`, `AsyncStealthySession`; CLI `stealthy-fetch`; MCP `stealthy_fetch`, `bulk_stealthy_fetch`), which accepts all `DynamicFetcher` arguments. When its challenge handling is used, set the timeout to **at least 60 seconds**, and on custom sites add `wait_selector` so it waits for the real content.

## Capturing XHR data

Many single-page apps load their data through background XHR or fetch calls; a browser fetcher can capture those responses.

```python
AsyncDynamicSession(capture_xhr=r"https://api\.example\.com/.*")
# page.captured_xhr: each a full Response with .url, .status, .headers, .body (bytes)
```

`captured_xhr` is an empty list when `capture_xhr` is unset. To turn a whole session's traffic into a documented API, see TRAFFIC-TO-OPENAPI.md.

## Prove it

The fetch returns a 2xx and non-empty content at the lowest tier that works, and a lower tier was tried first or ruled out (needs JavaScript, needs interaction). Timeouts are set in the right unit for the tier. No request skips TLS verification or follows unrestricted redirects toward an internal address. Temp output files are gone after reading.
