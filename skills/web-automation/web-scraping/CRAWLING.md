# Crawling politely

From [D4Vinci/Scrapling, scrapling-official/references/spiders], [open-seo] and [aeo.js]. Keep each crawler's settings distinct from [Google's robots parser](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

**Contents:** [Guardrails](#guardrails) · [How a crawler runs](#how-a-crawler-runs) · [Option: Scrapling spiders](#option-scrapling-spiders-vendor) · [Requests and dedup](#requests-and-dedup) · [robots.txt](#robotstxt) · [How Google reads robots.txt](#how-google-reads-robotstxt) · [Concurrency and delay](#concurrency-and-delay) · [AutoThrottle](#autothrottle) · [Blocked responses](#blocked-responses) · [Audit crawlers](#audit-crawlers-worked-limits) · [Sessions per request](#sessions-per-request) · [Checkpoints, dev cache, streaming](#checkpoints-dev-cache-streaming) · [Hooks, stats, logging](#hooks-stats-logging) · [Templates](#templates) · [Export](#export) · [Inside Scrapy](#inside-scrapy) · [Prove it](#prove-it)

## Guardrails

- **Only scrape content you're authorized to access.**
- **Respect robots.txt and terms of service;** turn robots enforcement on in the crawler.
- **Add delays on large crawls,** fixed or adaptive.
- **Don't bypass paywalls or authentication without permission.**
- **Never scrape personal or sensitive data.**
- **Practice on a purpose-built sandbox** such as `quotes.toscrape.com`.
- **Terms of service bind crawlers by name.** LinkedIn's [User Agreement](https://www.linkedin.com/legal/user-agreement) (section 8.2) forbids using "software, devices, scripts, robots or any other means or processes (such as crawlers, browser plugins and add-ons or any other technology) to scrape or copy the Services", using "bots or other unauthorized automated methods" to add contacts, message or drive engagement, and to "bypass or circumvent any access controls or use limits". Read the target's terms before the first request; an official API or export is the route when they forbid scraping.
- **Probe by who owns the site.** An audit crawler that also sends discovery probes (`/.env`, `/swagger.json`, paths robots.txt disallows) runs passive on a site the user does not own, such as a competitor or a prospect; loud probing that "can trip a WAF" runs only on a site the user owns or is authorized to test, only on request, after confirming ownership: "Never choose them on your own" [squirrelscan]. The audit workflow is [site-audit SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/SKILL.md).
- **Identify the crawler.** Send a user agent that names the tool and, ideally, a URL: `OpenSEO-Audit/1.0` [open-seo], `aeo.js (+https://aeojs.org)` [aeo.js]. A site owner who wants the crawl can then allowlist it.

## How a crawler runs

1. The spider builds requests from its start URLs.
2. A scheduler holds them in a priority queue and drops duplicates by fingerprint.
3. An engine dequeues under global and per-domain concurrency limits and delays, and drops requests robots.txt disallows.
4. Each request goes to the session it names; check its status and stop at an access block rather than escalating into evasion. [D4Vinci/Scrapling, scrapling-official/SKILL.md; user standing rule 9]
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
| Blocked response | Stop and use the permitted access route below |
| `CONCURRENT_REQUESTS` | `concurrent_requests` |
| `ROBOTSTXT_OBEY` | `robots_txt_obey` |
| `JOBDIR` | `crawldir` |
| Run | `MySpider().start()` |
| (none) | `async for item in spider.stream()`, multiple sessions |

## Requests and dedup

- **`Request(url, sid="", callback=None, priority=0, dont_filter=False, meta={}, **kwargs)`:** the callback defaults to `parse`; extra kwargs go to the session's fetch.
- **`response.follow(url, ...)`** resolves relative links and merges metadata, but 0.5 does not inherit method, params, data, json, files or multipart, and removes inherited Content-Length. Followed links start as GET unless explicitly set otherwise. The old description said all session kwargs were inherited. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
- **Fingerprint = URL + method + body + session ID.** `dont_filter=True` allows a revisit (e.g. after login). Class attrs `fp_include_kwargs`, `fp_keep_fragments`, `fp_include_headers` are all `False` by default.
- **`allowed_domains`** (subdomains match) drops offsite requests and counts them in `stats.offsite_requests_count`.
- **Queue order:** BFS is the default; DFS changes order only within equal Request.priority. Higher priority still wins, rediscovery does not reorder a duplicate and parallel completion need not follow queue order. Keep the selected strategy on resume. [D4Vinci/Scrapling, scrapling-official/references/spiders/generic-templates.md]

## robots.txt

`robots_txt_obey = True` (default **False**):

- Pre-fetches robots.txt for the start domains concurrently; domains found mid-crawl fetch theirs on first request; cached per domain.
- Drops disallowed requests and counts them in `stats.robots_disallowed_count`.
- `Crawl-delay` and `Request-rate` set the delay to max(directive, `download_delay`): it never lowers your delay.
- It does not change concurrency. In 0.5, robots fetch exceptions or non-200/non-4xx responses block that domain for the run; the result is cached, so restart after correcting the failure. Respect the delay ceiling qualification below. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

### How Google reads robots.txt

What the file means is defined by the parser that reads it; Google's rules are the common reference ([robots.txt spec](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)):

- **Select the most specific user-agent group.** Google internally combines rules from multiple applicable groups for that specific user agent; it does not merge a specific-agent group with the wildcard group. The old summary said other groups were ignored without the repeated-specific-group merging qualification. [https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec]
- **Within the group, the longest path wins:** "the most specific rule based on the length of the rule path"; on a true tie, "the least restrictive rule".
- **Google supports `user-agent`, `allow`, `disallow` and `sitemap`;** "other fields such as `crawl-delay` aren't supported", so `Content-Signal` is ignored too. Other crawlers do honor `crawl-delay` (Anthropic supports "the non-standard Crawl-delay extension", [Anthropic crawlers](https://support.claude.com/en/articles/8896518)), and Scrapling's `robots_txt_obey` honors it as above.
- **Size:** the file limit is 500 KiB.
- **Fetch errors:** any 4xx except 429 means Google assumes no robots crawl restrictions. On a 5xx Google stops crawling for the first 12 hours while retrying; for the next 30 days it uses the last good copy while retrying, or assumes no restrictions if no cached copy exists. After 30 days a generally available site is treated as having no robots.txt; if the site has general availability problems, crawling remains stopped while robots fetches continue. The old summary omitted the no-cache and generally-unavailable-site branches. These are Google's rules, not Scrapling's fail-closed behavior above. [https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec]

A crawler that clears its user-agent set on blank lines, or treats a `Disallow: /` in any group as a block for every bot, misreads real files; aeo.js's audit parser does both [aeo.js]. Use a maintained parser (OpenSEO uses `robots-parser` [open-seo]). Writing a robots.txt for your own site, including the AI crawler tokens, is [ai-search-visibility AI-CRAWLERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/AI-CRAWLERS.md).

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
- **Delay floors are capped.** autothrottle_max_delay can undercut download_delay, robots delay and Retry-After; configure its maximum to honor the actual required wait. The old source said floors were never undercut. [D4Vinci/Scrapling, scrapling-official/references/spiders/advanced.md; https://github.com/D4Vinci/Scrapling/blob/main/docs/spiders/advanced.md]
- **Measured latency includes** internal retries and browser render time.
- **Learned delays are not checkpointed;** a resumed crawl restarts from `start_delay`. Final delays are in `stats.autothrottle_delays`.

## Blocked responses

Stop on a challenge, access denial or rate-limit boundary and report it. Do not use CAPTCHA solving, bot-detection bypass or identity/proxy rotation to continue. Use a documented API or an owner-approved route consistent with platform rules; retry/backoff is not permission to evade. The source's procedural blocked-retry guidance is excluded. [D4Vinci/Scrapling, scrapling-official/references/spiders/proxy-blocking.md; user standing rule 9]

## Audit crawlers: worked limits

Two open-source site-audit crawlers, as reference values for a polite crawl of one site (their choices, not standards):

- **OpenSEO's throttle** [open-seo, crawl-throttle.ts]: a 1 s interval that doubles on trouble up to 30 s; the first 429 backs off 30 s, then exponentially, honoring `Retry-After` as seconds or an HTTP date; **every 429 pauses the whole origin**, not just the URL; 3 retries per URL. The crawl stops for good after more than 3 consecutive 429s or more than 30 minutes of total cooldown, and the report says it is incomplete: "URLs we did not fetch are not recorded as broken or rate limited". Its throttle state is checkpointed between chunks, unlike AutoThrottle's learned delays above.
- **OpenSEO's sitemap discovery** [open-seo, discovery.ts]: sitemaps from robots.txt plus `/sitemap.xml`, recursion depth 3, at most 300 sitemap documents, concurrency 5, and a discovered-URL cap of `min(max(maxPages*20, 500), 50_000)`. A sitemap may legally reach 50 MB uncompressed or 50,000 URLs ([build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)), so read it with a bound.
- **aeo.js** [aeo.js, remote-crawl.ts]: a 12 s timeout, the home page plus 10 inner pages, at most 20 sitemap URLs, concurrency 5, a 1 MB body cap, manual redirects (at most 5, each re-checked), and the first 5 same-origin links when there is no sitemap.

The rule both follow: when the server says slow down, slow the whole origin, and when it keeps saying it, stop and report what you didn't see instead of guessing.

## Sessions per request

- **Default:** one `FetcherSession`. Add more in `configure_sessions(self, manager)` with `manager.add(session_id, session, default=False, lazy=False)`; the first added is the default unless another sets `default=True`. Sessions are started for you and all close when the spider closes; `lazy=True` starts one on first use (e.g. a browser only when needed).
- **Spiders take only** `FetcherSession` and the async browser sessions (`AsyncStealthySession`).
- **`FetcherSession` in a spider has no `.get()`/`.post()`;** pass `method="POST"` on the `Request`.
- **Route with `sid=`;** kwargs such as `headers`, `wait_selector` and `network_idle` are forwarded, and new ones override inherited ones.

## Checkpoints, dev cache, streaming

- **Pause and resume:** `MySpider(crawldir="crawl_data/x", interval=120.0)`; the periodic checkpoint defaults to every **5 minutes**. Checkpoints hold pending requests plus seen fingerprints, pickled and written atomically (temp file then rename), periodically and on graceful shutdown, and are deleted on normal completion. Ctrl+C once waits for in-flight requests, checkpoints and exits; twice forces a stop. A resume skips `start_requests()`; `on_start(resuming: bool)` tells you which. Ctrl+C closes gracefully even without a `crawldir`.
- **0.5 migration:** params, falsy JSON bodies and header ordering have corrected request fingerprints, so old cache/checkpoint identities can differ. Blocked pages are not cached as successful, and failed runs retain recovery checkpoints. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]
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
- **`ContentSpider` (`SiteToMarkdownSpider` remains a supported alias):** requires `allowed_domains`; yields `url`, `title`, `markdown`; `output_dir` writes one `.md` per page; `max_pages` (0 = no limit; already-queued requests may still be fetched but are not converted); `css_selector`; `main_content_only` (default on). Restrict it with `rules()` allow and deny (deny wins). The RAG pipeline is in UNTRUSTED-CONTENT.md. [https://github.com/D4Vinci/Scrapling/blob/main/scrapling/spiders/templates/site_to_markdown.py]
- **`ShopifySpider` (platform-specific):** `target_website` (falls back to `start_urls[0]`, then `allowed_domains`, else `ValueError`); pages `/collections.json` (250 per page), then `/collections/<handle>/products.json`; one item per variant, deduped, with name, price (string), category, brand, identifier, sku, stock (`None` available, `0` out of stock), image_url, url, description, old_price, barcode. Override `_process_product()`. It sees only online-store-channel products, so `products_count` means "nonzero, fetch it", not a total; protected or password stores most likely fail.

**0.5 template corrections:** a restrict selector matching nothing yields no links rather than falling back to the whole page; a matching sitemap rule without a callback routes to parse. The old behavior could widen the crawl or misroute results. [https://github.com/D4Vinci/Scrapling/blob/main/docs/migrating-to-v0.5.md]

## Export

`ItemList` exports: `to_json(path, indent=True)`, `to_jsonl`, `to_csv(fields=[...], delimiter="\t")` (columns are the union of keys; missing cells stay empty), `to_xml(root_tag=, item_tag=)` (default `<items><item>`). Nested values are written as JSON; parent directories are created.

## Inside Scrapy

To use the parser inside an existing Scrapy project: `from scrapling.integrations.scrapy import scrapling_response` and decorate callbacks (functions, generators, coroutines and async generators; name, docstring and kind are kept for Scrapy contracts), e.g. `@scrapling_response(adaptive=True, keep_comments=True)`. Outside callbacks: `convert_response(scrapy_response, keep_comments=False)`. No extras needed.

- **Use `scrapy.Request(response.urljoin(href))`, not `response.follow()`,** which builds Scrapling-spider requests Scrapy doesn't understand.
- `meta` is shallow-copied (`response.meta["playwright_page"]` stays reachable); cookies are parsed from the raw `Set-Cookie`.

## Prove it

Run against a sandbox site with `robots_txt_obey = True`, `concurrent_requests_per_domain` set and AutoThrottle on: `robots_disallowed_count` and `offsite_requests_count` match what robots.txt and `allowed_domains` exclude, a forced 429 raises that domain's delay in `autothrottle_delays`, and an access block stops the crawl without evasion. Interrupt with one Ctrl+C, resume from the `crawldir`, and the final `items_scraped` has no duplicates. `development_mode` is off in the shipped spider. For an audit crawler: a run against a server that answers 429 pauses the origin, stops after the configured limit, and the report lists the unfetched URLs as not crawled rather than broken; a challenge page is reported as `blocked`, not retried through another tier; the user agent names the tool.
