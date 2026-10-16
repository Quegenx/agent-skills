# Crawling politely

**Contents:** [Guardrails](#guardrails) · [How a crawler runs](#how-a-crawler-runs) · [Option: Scrapling spiders](#option-scrapling-spiders-vendor) · [Requests and dedup](#requests-and-dedup) · [robots.txt](#robotstxt) · [Concurrency and delay](#concurrency-and-delay) · [AutoThrottle](#autothrottle) · [Blocked responses](#blocked-responses) · [Sessions per request](#sessions-per-request) · [Checkpoints, dev cache, streaming](#checkpoints-dev-cache-streaming) · [Hooks, stats, logging](#hooks-stats-logging) · [Templates](#templates) · [Export](#export) · [Inside Scrapy](#inside-scrapy) · [Prove it](#prove-it)

## Guardrails

- **Only scrape content you're authorized to access.**
- **Respect robots.txt and terms of service;** turn robots enforcement on in the crawler.
- **Add delays on large crawls,** fixed or adaptive.
- **Don't bypass paywalls or authentication without permission.**
- **Never scrape personal or sensitive data.**
- **Practice on a purpose-built sandbox** such as `quotes.toscrape.com`.

## How a crawler runs

1. The spider builds requests from its start URLs.
2. A scheduler holds them in a priority queue and drops duplicates by fingerprint.
3. An engine dequeues under global and per-domain concurrency limits and delays, and drops requests robots.txt disallows.
4. Each request goes to the session it names; the response is checked for a block and retried if blocked.
5. The callback yields items or new requests.
6. It repeats until the queue is empty with no active tasks, or the crawl is paused.

Checkpoints save the pending requests and the seen fingerprints, so a resumed crawl neither loses work nor refetches.

## Option: Scrapling spiders (vendor)

Scrapy-like. A spider needs `name`, `start_urls` (or `start_requests()`) and `async def parse(self, response)`. **Every callback must be `async def` and `yield`, even one that yields no requests.** Callbacks yield a dict (an item), a `Request`, or `None`.

```python
result = MySpider().start()
result.items      # ItemList
result.stats      # items_scraped, requests_count, elapsed_seconds, requests_per_second, ...
result.completed; result.paused
```

`start(use_uvloop=True)` uses uvloop or winloop if installed separately.

| Scrapy | Scrapling |
|---|---|
| Item pipelines | `on_scraped_item()` |
| Middlewares | Session manager |
| Blocked detection | `is_blocked()` + `retry_blocked_request()` |
| `CONCURRENT_REQUESTS` | `concurrent_requests` |
| `ROBOTSTXT_OBEY` | `robots_txt_obey` |
| `JOBDIR` | `crawldir` |
| Run | `MySpider().start()` |
| (none) | `async for item in spider.stream()`, multiple sessions |

## Requests and dedup

- **`Request(url, sid="", callback=None, priority=0, dont_filter=False, meta={}, **kwargs)`:** the callback defaults to `parse`; extra kwargs go to the session's fetch.
- **`response.follow(url, ...)`** resolves relative URLs, sets the Referer (`referer_flow=True`), and inherits callback, `sid`, priority and session kwargs; `meta` is merged with new values winning.
- **Fingerprint = URL + method + body + session ID.** `dont_filter=True` allows a revisit (e.g. after login). Class attrs `fp_include_kwargs`, `fp_keep_fragments`, `fp_include_headers` are all `False` by default.
- **`allowed_domains`** (subdomains match) drops offsite requests and counts them in `stats.offsite_requests_count`.
- **Priority:** e.g. product pages `priority=10`, pagination `0`.

## robots.txt

`robots_txt_obey = True` (default **False**):

- Pre-fetches robots.txt for the start domains concurrently; domains found mid-crawl fetch theirs on first request; cached per domain.
- Drops disallowed requests and counts them in `stats.robots_disallowed_count`.
- `Crawl-delay` and `Request-rate` set the delay to max(directive, `download_delay`): it never lowers your delay.
- It does not change concurrency.

## Concurrency and delay

| Setting | Default | Meaning |
|---|---|---|
| `concurrent_requests` | 4 | Global limit |
| `concurrent_requests_per_domain` | 0 | Per-domain limit; 0 = none |
| `download_delay` | 0.0 | Fixed wait before every request, regardless of domain |

**Set `concurrent_requests_per_domain`.** A throttled domain that is sleeping still holds a global slot, so with no per-domain limit one slow domain eats the shared budget.

## AutoThrottle

An adaptive delay per domain.

| Setting | Default |
|---|---|
| `autothrottle_enabled` | `False` |
| `autothrottle_start_delay` | 5.0 |
| `autothrottle_max_delay` | 60.0 |
| `autothrottle_target_concurrency` | `None` |
| `autothrottle_block_backoff` | `True` |

- **Track the server's latency.** After each response the delay moves toward the server's latency divided by the target concurrency (`autothrottle_target_concurrency`, else `concurrent_requests_per_domain`, else 1). Latency spikes apply at once; speed-ups come gradually.
- **Double on blocks.** A 429, a 403 or a captcha page usually comes back faster than real content, so latency alone would speed the crawler up. Any non-2xx or blocked response doubles the domain's delay (0.5, 1, 2, 4, 8 ... up to the max); healthy responses walk it back down.
- **Honor `Retry-After`** on 429 and 503 (seconds or an HTTP date) in place of doubling; it is still capped by `autothrottle_max_delay`, so raise the cap to honor long waits.
- **Floors:** `download_delay` and robots `Crawl-delay` are never undercut.
- **Measured latency includes** internal retries and browser render time.
- **Learned delays are not checkpointed;** a resumed crawl restarts from `start_delay`. Final delays are in `stats.autothrottle_delays`.

## Blocked responses

- **Default blocked statuses:** 401, 403, 407, 429, 444, 500, 502, 503, 504.
- **Flow:** `is_blocked(response)`, then `retry_blocked_request(request, response)`, which re-queues a copy with `dont_filter=True` and lower priority, up to `max_blocked_retries` (default **3**, a counter separate from the session's `retries`).
- **Custom `is_blocked`:** check the status plus a body sniff (`"access denied"`, `"rate limit"`).
- **Escalate the tier on block:** switch `request.sid` to a lazily started browser session.
- **Proxies:** `ProxyRotator([...])` is cyclic by default, or pass `strategy(proxies, current_index) -> (proxy, next_index)`. Strings work everywhere, Playwright dicts work for browsers. `response.meta["proxy"]` and `stats.proxies` show what was used. A per-request `proxy=` overrides the rotator (e.g. for geo-located content). It cannot combine with `proxy`/`proxies`.

## Sessions per request

- **Default:** one `FetcherSession`. Add more in `configure_sessions(self, manager)` with `manager.add(session_id, session, default=False, lazy=False)`; the first added is the default unless another sets `default=True`. Sessions are started for you and all close when the spider closes; `lazy=True` starts one on first use (e.g. a browser only when needed).
- **Spiders take only** `FetcherSession` and the async browser sessions (`AsyncDynamicSession`, `AsyncStealthySession`).
- **`FetcherSession` in a spider has no `.get()`/`.post()`;** pass `method="POST"` on the `Request`.
- **Route with `sid=`;** kwargs such as `headers`, `wait_selector`, `network_idle` and `impersonate` are forwarded, and new ones override inherited ones.

## Checkpoints, dev cache, streaming

- **Pause and resume:** `MySpider(crawldir="crawl_data/x", interval=120.0)`; the periodic checkpoint defaults to every **5 minutes**. Checkpoints hold pending requests plus seen fingerprints, pickled and written atomically (temp file then rename), periodically and on graceful shutdown, and are deleted on normal completion. Ctrl+C once waits for in-flight requests, checkpoints and exits; twice forces a stop. A resume skips `start_requests()`; `on_start(resuming: bool)` tells you which. Ctrl+C closes gracefully even without a `crawldir`.
- **Development cache:** `development_mode = True` caches every response under `.scrapling_cache/{name}/` relative to the **current working directory** (override with `development_cache_dir`), one `{fingerprint_hex}.json` per fingerprint with a base64 body, written atomically. A replay skips the network, `download_delay`, rate limiting and the blocked-retry; stats still count, plus `cache_hits` and `cache_misses`. No expiry: delete the directory or call the manager's `clear()`. Changing fingerprint options forces a refetch. **Don't ship a spider with `development_mode = True`.**
- **Streaming:** `async for item in spider.stream()` in an async context, with live `spider.stats`; run with `anyio.run(main)`. `spider.pause()` closes the crawl when no `crawldir` is set.

## Hooks, stats, logging

- **Hooks:** `on_start`, `on_close` (after completion or pause), `on_error(request, error)`, `on_scraped_item(item)` (return `None` to drop the item; use it as a pipeline), `start_requests()` (e.g. POST a login, then `follow` to authenticated pages).
- **Stats:** `requests_count`, `failed_requests_count`, `blocked_requests_count`, `offsite_requests_count`, `robots_disallowed_count`, `cache_hits`, `cache_misses`, `items_scraped`, `items_dropped`, `response_bytes`, `elapsed_seconds`, `requests_per_second`, `response_status_count`, `domains_response_bytes`, `sessions_requests_count`, `proxies`, `log_levels_counter`, `start_time`, `end_time`, `download_delay`, `concurrent_requests`, `concurrent_requests_per_domain`, `autothrottle_enabled`, `autothrottle_delays`, `custom_stats`, `to_dict()`.
- **Logging:** `logging_level=logging.DEBUG`, `logging_format="[%(asctime)s]:({spider_name}) %(levelname)s: %(message)s"`, `logging_date_format="%Y-%m-%d %H:%M:%S"`, `log_file=None` (its directory is created automatically); `self.logger` in the spider.

## Templates

- **`CrawlSpider` with `rules()`:** `CrawlRule(LinkExtractor(...), callback=, priority=, process_request=)`. A rule without a callback falls through to `parse()` (handy for pagination). To override `parse` and keep the rules: `async for req in super().parse(response): yield req`.
- **`LinkExtractor`:** `allow=()` (empty = all), `deny=()` (overrides allow), `allow_domains`, `deny_domains`, `restrict_css`, `restrict_xpath`, `tags=("a","area")`, `attrs=("href",)`, `canonicalize=True` (sorts the query, normalizes the path), `strip=True`, `keep_fragment=False`, `deny_extensions=IGNORED_EXTENSIONS`, `process` (a falsy return drops the link). `.extract(response)` returns absolute, filtered, deduped URLs; `.matches(url)` returns a bool.
- **`SitemapSpider`:** `sitemap_urls` (a robots.txt URL works; its `Sitemap:` lines are read), descends into `<sitemapindex>`, `sitemap_follow = LinkExtractor(...)` filters child sitemaps, `sitemap_alternate_links = True` adds hreflang URLs; handles gzip. The first matching rule wins; with rules set, an unmatched URL is dropped; with no rules, everything goes to `parse()` (which raises `NotImplementedError` by default).
- **`XMLFeedSpider`:** `itertag` (default `"item"`), `parse_node(response, node)` where the node is a namespace-stripped lxml element (`node.findtext("title")`); a prefixed `itertag` plus `namespaces = (("media", "http://search.yahoo.com/mrss/"),)` matches one namespace. Gzip is decompressed; malformed XML logs a warning instead of crashing.
- **`CSVFeedSpider`:** `parse_row(response, row: dict)`; `headers`, `delimiter`, `quotechar`; gzip.
- **`SiteToMarkdownSpider`:** requires `allowed_domains`; yields `url`, `title`, `markdown`; `output_dir` writes one `.md` per page; `max_pages` (0 = no limit; already-queued requests may still be fetched but are not converted); `css_selector`; `main_content_only` (default on). Restrict it with `rules()` allow and deny (deny wins). The RAG pipeline is in UNTRUSTED-CONTENT.md.
- **`ShopifySpider` (platform-specific):** `target_website` (falls back to `start_urls[0]`, then `allowed_domains`, else `ValueError`); pages `/collections.json` (250 per page), then `/collections/<handle>/products.json`; one item per variant, deduped, with name, price (string), category, brand, identifier, sku, stock (`None` available, `0` out of stock), image_url, url, description, old_price, barcode. Override `_process_product()`. It sees only online-store-channel products, so `products_count` means "nonzero, fetch it", not a total; protected or password stores most likely fail.

## Export

`ItemList` exports: `to_json(path, indent=True)`, `to_jsonl`, `to_csv(fields=[...], delimiter="\t")` (columns are the union of keys; missing cells stay empty), `to_xml(root_tag=, item_tag=)` (default `<items><item>`). Nested values are written as JSON; parent directories are created.

## Inside Scrapy

To use the parser inside an existing Scrapy project: `from scrapling.integrations.scrapy import scrapling_response` and decorate callbacks (functions, generators, coroutines and async generators; name, docstring and kind are kept for Scrapy contracts), e.g. `@scrapling_response(adaptive=True, keep_comments=True)`. Outside callbacks: `convert_response(scrapy_response, keep_comments=False, keep_cdata=False)`. No extras needed.

- **Use `scrapy.Request(response.urljoin(href))`, not `response.follow()`,** which builds Scrapling-spider requests Scrapy doesn't understand.
- `meta` is shallow-copied (`response.meta["playwright_page"]` stays reachable); cookies are parsed from the raw `Set-Cookie`.

## Prove it

Run against a sandbox site with `robots_txt_obey = True`, `concurrent_requests_per_domain` set and AutoThrottle on: `robots_disallowed_count` and `offsite_requests_count` match what robots.txt and `allowed_domains` exclude, a forced 429 raises that domain's delay in `autothrottle_delays`, and blocked retries stop at `max_blocked_retries`. Interrupt with one Ctrl+C, resume from the `crawldir`, and the final `items_scraped` has no duplicates. `development_mode` is off in the shipped spider.
