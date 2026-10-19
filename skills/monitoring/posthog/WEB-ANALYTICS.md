# Web analytics: heatmaps, autocapture, bots, live traffic, path cleaning

These tools read what browsers send: heatmap geometry, `$autocapture` clicks with their `elements_chain`, user agents for bot classification, and `$pathname` for page tiles. Most outcomes come down to whether the data is captured at all (heatmaps and autocapture are opt-in, crawlers that never run JS never fire `$pageview`) and whether you filter it correctly (unique visitors over raw counts, bots excluded from human metrics, selectors that match one interaction, path cleaning rules anchored and ordered). SQL in general is [HOGQL.md](HOGQL.md).

**Contents:** [Heatmaps](#heatmaps) · [Autocapture events](#autocapture-events) · [Bot traffic](#bot-traffic) · [Live traffic](#live-traffic) · [Path cleaning rules](#path-cleaning-rules) · [Suggested path cleaning rules](#suggested-path-cleaning-rules) · [Marketing analytics](#marketing-analytics) · [Prove it](#prove-it)

## Heatmaps

- **Heatmap data is pure geometry:** `pointer_relative_x` (0 to 1 across the viewport), `pointer_y` (absolute pixels down the page) and a count per spot. It doesn't know what was clicked; cross-reference autocapture on the same URL to name elements.
- **Heatmaps must be opted in** (`Team.heatmaps_opt_in`). Empty results on a trafficked page mean capture is off or the URL is wrong.
- **Data is retained 90 days.**

Workflow:

1. **Pick the page:** exact `url_exact` or regex `url_pattern`. Default to the last 7 days; widen to 30 if volume is low.
2. **Fetch each signal** with MCP `heatmaps-list`, or SQL on the `heatmaps` table. Types: `type: "click"`, `type: "rageclick"` (the single strongest "something is broken or misleading" signal), `type: "scrolldepth"`.
3. **Name the hot spots** with autocapture on the same URL (query below); `elements_chain` gives the selector or DOM path when two elements share the same text. Clicks concentrated on something that is not a link or button (plain text, an image, a disabled control) mean users expect it to be clickable.
4. **Optionally save a rendered heatmap** with `heatmaps-saved-create` and the page `url` (type defaults to `screenshot`). It renders asynchronously in a headless browser; pass `widths` matching the band you analyzed, then poll `heatmaps-saved-get` by `short_id` until `status` is `completed`. Only the `screenshot` type renders an image; `iframe` and `recording` don't. Don't claim to have seen the page.
5. **Find the sessions behind specific `points`** with `heatmaps-events`, and watch them in replay.
6. **Report** what it shows (including the fold split), problems ranked (rage clicks, clicks on non-interactive elements, CTAs below the scroll cliff, ignored primary actions), and recommendations that each cite a signal.

- **Use `aggregation: "unique_visitors"`** for how many people; `total_count` exaggerates a few heavy clickers.
- **Click results come hottest-first, capped at `limit` (default 500).** Page with `offset` and check `has_more`. `scrolldepth` ignores `limit` and returns every bucket.
- **Click types return a `fold` object:** `pct_below_fold` (share of non-fixed interactions below the initial viewport), `below_fold_count` / `total_count` (fixed-position elements excluded), `median_viewport_height` (the typical fold line in CSS pixels). Segment by device with `viewport_width_min` / `viewport_width_max` (desktop and mobile have very different folds) and read `fold` per band rather than blending them.
- **Use the API's coordinates, not the raw table's.** Coordinates are scaled by a factor of 16 in storage; the API already returns CSS-pixel `pointer_y` and relative x.
- **For a distribution** (clicks bucketed by how far below the fold, say), use SQL on the raw `heatmaps` table, which has `y` and `viewport_height` in the same scaled units.

```sql
SELECT properties.$el_text AS text, count() AS clicks
FROM events
WHERE event = '$autocapture'
  AND properties.$current_url = 'https://example.com/pricing'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY text
ORDER BY clicks DESC
LIMIT 25
```

| Signal | Likely meaning | Typical recommendation |
|---|---|---|
| Rage clicks on an element | Broken, slow, or looks clickable but isn't | Fix the handler, add feedback, or make it actually interactive |
| Many clicks on non-link text or image | Users expect it to be clickable | Make it a link or button, or remove the affordance |
| Primary CTA gets few clicks | Buried, low-contrast, or out-competed | Raise it, increase contrast, reduce nearby noise |
| Scroll cliff before key content | Content or CTA is below where people stop | Move it up or add a reason to scroll |
| High % of clicks below the fold | Users scroll before interacting | Move the most-clicked elements onto the first screen |
| Hot clicks on nav, cold body | The page isn't delivering; people bail to nav | Re-evaluate the page's core content |

## Autocapture events

- **posthog-js (when opted in) captures clicks, form submissions and page changes as `$autocapture`,** each recording the clicked element and its ancestors in `elements_chain`. Only posthog-js captures elements; other SDKs don't.
- **Turn it off** with the project setting `autocapture_opt_out`, or `autocapture: false` in posthog-js `init()`.
- **`$autocapture` is intentionally excluded from the `posthog:read-data-schema` taxonomy.** Don't query the schema to look up its properties.
- **Canonical properties:** `$event_type` (`click`, `submit`, `change`), `$el_text`, `$current_url`, `$elements_chain`, plus the standard `$browser`, `$os`, `$device_type`.

| Materialized column | Type | Holds |
|---|---|---|
| `elements_chain` | String | Full semicolon-separated element chain |
| `elements_chain_href` | String | Last href value from the chain |
| `elements_chain_texts` | Array(String) | All text values from elements |
| `elements_chain_ids` | Array(String) | All id attribute values |
| `elements_chain_elements` | Array(String) | Useful tag names: a, button, input, select, textarea, label |

### The elements_chain format

```text
tag_name.class1.class2:key1="value1":key2="value2";parent_tag.parent_class:key="val"
```

- **`;` separates elements:** the clicked element first, then its ancestors. Classes are sorted alphabetically; attributes are `:key="value"`, with quotes escaped as `\"`.
- **Standard keys:** `text`, `href`, `attr_id`, `nth-child`, `nth-of-type`, `attr_class`. Custom attributes appear verbatim: `data-attr` (PostHog's default data attribute, configurable per team), `data-testid`, `aria-label`.
- **Example:** `button.btn.primary:data-attr="checkout":text="Buy Now";div.container:attr_id="main"`

| CSS selector | HogQL match (`elements_chain =~ '{regex}'`) |
|---|---|
| `button` | `(^|;)button(\.|$|;|:)` |
| `button.cta` | `(^|;)button.*?cta.*?` |
| `#submit` | `indexOf(elements_chain_ids, 'submit') > 0` (not a regex) |
| `[data-attr="checkout"]` | `(^|;).*?data-attr="checkout".*?` |
| `button[data-attr="checkout"]` | `(^|;)button.*?data-attr="checkout".*?` |

### Finding a selector

- **Selector priority, best first:** `data-attr` / `data-*`; element ID (`attr_id`, via `elements_chain_ids`); tag plus class; text content (fragile: copy edits and i18n break it); tag name alone (too broad). Build `[data-attr="value"]` or `button[data-attr="value"]`.
- **Workflow:** confirm data exists (count); explore broadly via the materialized columns; find a candidate selector; check it is unique (match with `elements_chain =~`, sample, compare to total volume: a good selector matches one logical interaction); refine with text, URL or href filters only as needed; then use it in insights, ad-hoc HogQL, or an action.
- **Always set timestamp filters** (autocapture is high volume), `LIMIT` generously when sampling `elements_chain`, and prefer the materialized columns over `elements_chain =~` for performance.

### Using it in insights and actions

- **`type: "element"` filters** take keys `selector`, `tag_name`, `text`, `href`. `selector` and `tag_name` support only `exact` and `is_not` (others error). `text` and `href` accept `exact`, `is_not`, `icontains`, `not_icontains`, `regex`, `not_regex`, `is_set`, `is_not_set`.
- **`type: "event"` filters** take the canonical properties or any event property with standard operators.
- **`value` is an array even for one selector,** and the selector string includes the `[data-attr="..."]` wrapper.
- **Pick the form by reuse:** an action (`ActionsNode`) when it is referenced more than once; inline filters for a one-off insight; raw HogQL for joins or custom aggregation.

```json
{
  "kind": "FunnelsQuery",
  "series": [
    {
      "kind": "EventsNode",
      "event": "$autocapture",
      "properties": [
        {
          "type": "element",
          "key": "selector",
          "value": ["[data-attr=\"autocapture-series-save-as-action-banner-shown\"]"],
          "operator": "exact"
        }
      ]
    },
    {
      "kind": "EventsNode",
      "event": "$autocapture",
      "properties": [
        {
          "type": "element",
          "key": "selector",
          "value": ["[data-attr=\"autocapture-save-as-action\"]"],
          "operator": "exact"
        }
      ]
    }
  ]
}
```

Create an action with `posthog:action-create`:

```json
{
  "name": "Clicked checkout button",
  "steps": [
    {
      "event": "$autocapture",
      "selector": "button[data-attr='checkout']",
      "text": "Complete Purchase",
      "text_matching": "exact",
      "url": "/checkout",
      "url_matching": "contains"
    }
  ]
}
```

- **Step fields:** `selector`, `tag_name`, `text` / `text_matching`, `href` / `href_matching`, `url` / `url_matching` (`exact`, `contains`, `regex`).
- **Verify it with `matchesAction('Clicked checkout button')`,** and use `posthog:query-trends` / `posthog:query-funnel` with the action for recurring analysis.

### Example queries

Volume check, then explore by tag, text, href and page:

```sql
SELECT count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
```

```sql
SELECT
  arrayJoin(elements_chain_elements) as tag,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY tag
ORDER BY cnt DESC
LIMIT 20
```

```sql
SELECT
  arrayJoin(elements_chain_texts) as text,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND length(text) > 0
GROUP BY text
ORDER BY cnt DESC
LIMIT 30
```

```sql
SELECT
  elements_chain_href as href,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain_href != ''
GROUP BY href
ORDER BY cnt DESC
LIMIT 20
```

```sql
SELECT
  elements_chain,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND properties.$current_url ILIKE '%/pricing%'
  AND elements_chain != ''
GROUP BY elements_chain
ORDER BY cnt DESC
LIMIT 10
```

Which data attributes exist:

```sql
SELECT
  arrayJoin(extractAll(elements_chain, 'data-attr="([^"]*)"')) as data_attr_value,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND match(elements_chain, 'data-attr=')
GROUP BY data_attr_value
ORDER BY cnt DESC
LIMIT 20
```

```sql
SELECT
  arrayJoin(extractAll(elements_chain, '(data-[a-zA-Z0-9_-]+)=')) as data_key,
  count() as cnt
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND match(elements_chain, 'data-')
GROUP BY data_key
ORDER BY cnt DESC
LIMIT 20
```

Check a selector's uniqueness, sample its matches, then refine by text or URL:

```sql
SELECT count() as matching_events
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
```

```sql
SELECT
  elements_chain,
  properties.$current_url as url,
  elements_chain_texts as texts,
  timestamp
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
ORDER BY timestamp DESC
LIMIT 10
```

```sql
SELECT count() as matching_events
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
  AND arrayExists(x -> x = 'Complete Purchase', elements_chain_texts)
```

```sql
SELECT count() as matching_events
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
  AND properties.$current_url ILIKE '%/checkout%'
```

Clicks per day and per page:

```sql
SELECT
  toStartOfDay(timestamp) as day,
  count() as clicks
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 14 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
GROUP BY day
ORDER BY day
```

```sql
SELECT
  properties.$current_url as url,
  count() as clicks
FROM events
WHERE event = '$autocapture'
  AND timestamp > now() - INTERVAL 7 DAY
  AND elements_chain =~ '(^|;)button.*?data-attr="checkout"'
GROUP BY url
ORDER BY clicks DESC
LIMIT 20
```

First click after a pageview:

```sql
SELECT
  person_id,
  first_pageview,
  first_click_after
FROM (
  SELECT
    p.person_id,
    p.pageview_time as first_pageview,
    min(c.click_time) as first_click_after
  FROM (
    SELECT person_id, min(timestamp) as pageview_time
    FROM events
    WHERE event = '$pageview'
      AND timestamp > now() - INTERVAL 14 DAY
      AND properties.$current_url ILIKE '%/pricing%'
    GROUP BY person_id
  ) p
  INNER JOIN (
    SELECT person_id, timestamp as click_time
    FROM events
    WHERE event = '$autocapture'
      AND timestamp > now() - INTERVAL 14 DAY
      AND elements_chain =~ '(^|;)button.*?data-attr="signup"'
  ) c ON p.person_id = c.person_id AND c.click_time > p.pageview_time
  GROUP BY p.person_id, p.pageview_time
)
```

Verify an action:

```sql
SELECT count() as matching_events
FROM events
WHERE matchesAction('Clicked checkout button')
  AND timestamp > now() - INTERVAL 7 DAY
```

## Bot traffic

- **Virtual properties read the user agent for you,** falling back from `$raw_user_agent` to `$user_agent`. Prefer them in the insight builder and filters; use the HogQL functions in hand-written SQL.

| Virtual property | Value |
|---|---|
| `$virt_is_bot` | boolean |
| `$virt_traffic_type` | `Regular`, `AI Agent`, `Bot`, `Automation` |
| `$virt_traffic_category` | e.g. `ai_crawler`, `ai_search`, `ai_assistant`, `search_crawler`, `seo_crawler`, `social_crawler`, `monitoring`, `http_client`, `headless_browser`, `no_user_agent`, `regular` |
| `$virt_bot_name` | e.g. `Googlebot`, `GPTBot`, `ClaudeBot` (the live-traffic guide lists `Googlebot`, `GPTBot`, `Claude`, `Lighthouse`, `HeadlessChrome`) |
| `$virt_bot_operator` | e.g. `Google`, `OpenAI`, `Anthropic` |

- **Pass the UA to the functions as `coalesce(nullIf(properties.$raw_user_agent, ''), properties.$user_agent)`.** The `nullIf` keeps an empty `$raw_user_agent` from shadowing a real `$user_agent`, mirroring the virtual-property expression.

| HogQL function | Returns |
|---|---|
| `isLikelyBot(ua)` | `true` for a bot or automation pattern (an empty UA counts as a bot) |
| `getTrafficType(ua)` | `AI Agent` / `Bot` / `Automation` / `Regular` |
| `getTrafficCategory(ua)` | Subcategory; `regular` for humans |
| `getBotType(ua)` | Same subcategory, but empty string for humans |
| `getBotName(ua)` | Bot name; empty for humans |
| `getBotOperator(ua)` | Operator; empty for humans |

| Traffic type | What it is | Default move |
|---|---|---|
| `Regular` | Human visitors | Keep |
| `AI Agent` | AI crawlers, AI search, AI assistants (GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User) | Often measure, don't drop |
| `Bot` | Search crawlers, SEO tools, social previews, monitoring (Googlebot, AhrefsBot, Pingdom) | Exclude from human metrics; track separately for SEO |
| `Automation` | HTTP clients and headless browsers (curl, python-requests, Puppeteer) | Usually noise: exclude |

### Recipes

Humans only (a property filter; it does not change stored data):

```json
{ "key": "$virt_is_bot", "value": ["false"], "operator": "exact", "type": "event" }
```

For a narrower exclusion, filter `$virt_traffic_type` or `$virt_traffic_category` with `operator: is_not`.

Share of automated traffic:

```json
{
  "kind": "TrendsQuery",
  "dateRange": { "date_from": "-30d" },
  "series": [{ "kind": "EventsNode", "event": "$pageview", "math": "total" }],
  "breakdownFilter": { "breakdown": "$virt_traffic_type", "breakdown_type": "event" },
  "trendsFilter": { "display": "ActionsBarValue" }
}
```

Which bots:

```json
{
  "kind": "TrendsQuery",
  "dateRange": { "date_from": "-30d" },
  "series": [{ "kind": "EventsNode", "event": "$pageview", "math": "total" }],
  "properties": [{ "key": "$virt_is_bot", "value": ["true"], "operator": "exact", "type": "event" }],
  "breakdownFilter": { "breakdown": "$virt_bot_name", "breakdown_type": "event", "breakdown_limit": 25 },
  "trendsFilter": { "display": "ActionsBarValue" }
}
```

AI-agent traffic: filter `$virt_traffic_type` `exact` `AI Agent` and break down by `$virt_bot_operator`.

```sql
-- human pageviews only
SELECT count() AS human_pageviews
FROM events
WHERE event = '$pageview'
    AND NOT isLikelyBot(coalesce(nullIf(properties.$raw_user_agent, ''), properties.$user_agent))

-- top bots by hits
SELECT
    getBotName(coalesce(nullIf(properties.$raw_user_agent, ''), properties.$user_agent)) AS bot,
    getBotOperator(coalesce(nullIf(properties.$raw_user_agent, ''), properties.$user_agent)) AS operator,
    count() AS hits
FROM events
WHERE event = '$pageview'
    AND isLikelyBot(coalesce(nullIf(properties.$raw_user_agent, ''), properties.$user_agent))
GROUP BY bot, operator
ORDER BY hits DESC
```

### Custom bot rules

- **The built-in list covers only self-declared user agents PostHog knows.** Add a custom rule for undetected scrapers (an internal load test, a partner integration, a niche crawler). Rules feed `isLikelyBot`, `Bot name` and `Traffic category` everywhere HogQL runs.
- **A rule matches one event property:** the user agent by default, or `$ip`, `$lib`, `$host`, `$pathname`, `$current_url`, `$browser`, `$os`, `$browser_language`, `$screen_width`, `$screen_height`, `$geoip_country_code`, `$referrer`, `$referring_domain`.
- **Operators:** `contains` (case-insensitive substring), `regex` (RE2), `cidr` (IP range, only with `$ip`). `name` is the label for `Bot name`; an optional `category` (a built-in one, such as `ai_crawler`) relabels the traffic type. A rule whose pattern can't run is rejected on save.
- **Manage rules** in Settings > Environment > Custom bots, with MCP `web-analytics-bot-rules-list`, `web-analytics-bot-rules-create`, `web-analytics-bot-rules-destroy` (prefer these for agents), or REST `GET/POST /api/projects/{project_id}/web_analytics_bot_rules/` and `DELETE /api/projects/{project_id}/web_analytics_bot_rules/{id}/`.
- **Permissions:** project members can list; creating and deleting need a project admin (it mutates the admin-only `modifiers` team setting).

### Gotchas

- **Most crawlers and AI agents never run JS,** so posthog-js never fires `$pageview` for them. Forward server access logs as `$http_log` events carrying `$raw_user_agent` (a Vercel logs source, an edge worker, or the capture API). "Why don't I see GPTBot" is almost always no `$http_log` ingestion.
- **`isLikelyBot` is a UA heuristic,** and some bots spoof browser UAs. Treat it as best effort.
- **An empty UA is `Automation` / `no_user_agent`,** and `isLikelyBot` returns true.
- **Don't silently drop the host filter:** inherit `$host` in `properties`.
- **Bot definitions evolve,** so re-running later can classify older events differently.
- **Retroactivity: the sources disagree.** The bot-filtering guide says classification is computed at query time from `$raw_user_agent` / `$user_agent`, so it works on any historical event with no need to restrict `dateRange.date_from`. The live-traffic guide says bots are detected server-side, the virtual properties are attached before the event lands in ClickHouse and are not retroactive, so keep `dateRange.date_from` within the last few months for reliable bot results.

## Live traffic

- **The Live tab is `/web/live`.** Everything uses a 30-minute sliding window except "Users online" (last 60 seconds). Data comes from a livestream (SSE) backed by short HogQL backfills; it is not a HogQL playground.
- **The only filter is the host (Domain) selector,** shared with the rest of Web analytics and gated by the flag `WEB_ANALYTICS_LIVE_DOMAIN_FILTER` (off means all domains). It narrows the SSE stream, the backfill queries and users online. It strips the protocol (`example.com`, not `https://example.com`), has no URL param and persists in `localStorage`. There is no date picker, compare, property filter or test-account filter.
- **Bot-eligible events:** `$pageview`, `$pageleave`, `$screen`, `$http_log`, `$autocapture`.

| Card | What | Window or notes |
|---|---|---|
| Users online | Distinct device IDs seen | Last 60 seconds |
| Unique visitors | Distinct device IDs | Last 30 min |
| Pageviews | `$pageview` count | Last 30 min |
| Active users per minute | Bar chart, new vs returning | Last 30 min |
| Top pages | `$pathname` + view count | Top 10, 30 min |
| Top referrers | `$referring_domain` | Top 10, 30 min |
| Devices | `$device_type` | Top 6 + Other |
| Browsers | `$browser` | Top 6 + Other |
| Top countries | `$geoip_country_code` | Top 6 + Other; Country/City tab with flag `WEB_ANALYTICS_LIVE_CITY_BREAKDOWN` |
| Bot requests per minute | Bot events per minute | Flag `WEB_ANALYTICS_BOT_ANALYSIS` |
| Bot traffic | Named bots by event share, with category tag | Flag `WEB_ANALYTICS_BOT_ANALYSIS`; rows open a single-bot insight |
| Countries (world map) | SVG world map heat | Flag `WEB_ANALYTICS_LIVE_MAP` |
| Live events | Streamed feed (event, person, URL, timestamp) | Last 50 events |

- **Every tile except live events and the world map has "Open as new insight"** (a 7-day Trends query). Defaults: `date_from` `-7d`; `interval` `hour` for 7-day windows, `minute` only under a day, `day` beyond 14 days.

Bot traffic breakdown:

```json
{
  "kind": "TrendsQuery",
  "interval": "hour",
  "dateRange": { "date_from": "-7d" },
  "series": [
    {
      "kind": "GroupNode",
      "custom_name": "Requests",
      "operator": "OR",
      "math": "total",
      "nodes": [
        { "kind": "EventsNode", "event": "$pageview", "math": "total" },
        { "kind": "EventsNode", "event": "$pageleave", "math": "total" },
        { "kind": "EventsNode", "event": "$screen", "math": "total" },
        { "kind": "EventsNode", "event": "$http_log", "math": "total" },
        { "kind": "EventsNode", "event": "$autocapture", "math": "total" }
      ]
    }
  ],
  "properties": [{ "key": "$virt_is_bot", "value": ["true"], "operator": "exact", "type": "event" }],
  "breakdownFilter": {
    "breakdown": "$virt_bot_name",
    "breakdown_type": "event",
    "breakdown_limit": 25
  },
  "trendsFilter": { "display": "ActionsBarValue" }
}
```

Single-bot drill-down (the category filter is optional; `Lighthouse · headless_browser` is a different row from `Lighthouse · monitoring`):

```json
{
  "kind": "TrendsQuery",
  "interval": "hour",
  "dateRange": { "date_from": "-7d" },
  "series": [
    /* same combined "Requests" GroupNode as above */
  ],
  "properties": [
    { "key": "$virt_is_bot", "value": ["true"], "operator": "exact", "type": "event" },
    { "key": "$virt_bot_name", "value": ["GPTBot"], "operator": "exact", "type": "event" },
    { "key": "$virt_traffic_category", "value": ["ai_crawler"], "operator": "exact", "type": "event" }
  ],
  "trendsFilter": { "display": "ActionsLineGraph" }
}
```

- **Category breakdown:** break down by `$virt_traffic_category` instead of `$virt_bot_name`.
- **Non-bot tiles** are `$pageview` with `math: unique_users`:

| Tile | Breakdown property | Display |
|---|---|---|
| Top pages | `$pathname` | `ActionsBarValue` |
| Top referrers | `$referring_domain` | `ActionsBarValue` |
| Devices | `$device_type` | `ActionsPie` |
| Browsers | `$browser` | `ActionsPie` |
| Countries | `$geoip_country_code` | `WorldMap` |

- **Host filter:** `{ "key": "$host", "value": ["<host>"], "operator": "exact", "type": "event" }`.
- **The Live tab and dashboards are not directly comparable** beyond the last 30 minutes.
- **Refreshing replays the backfill HogQL,** not the SSE stream; a brief "0" right after load is not a drop.
- **Tile order persists per team in `localStorage`** (flag `WEB_ANALYTICS_LIVE_EDIT_LAYOUT`).

## Path cleaning rules

- **Rules normalize `$pathname` and `$entry_pathname`** so templated pages collapse (`/users/<id>/profile`) in Web analytics tiles, Paths insights and HogQL that calls `apply_path_cleaning`. Use them for cardinality complaints; for per-URL drill-down use a `$pathname` property filter.
- **They apply only when opted in:** the "Path cleaning" toggle in the Web analytics page header, the Paths insight toggle, or HogQL `apply_path_cleaning(path_expr, team)`. Rules are per project, not per insight.
- **`Team.path_cleaning_filters` is a JSON list of `PathCleaningFilter`:**

```json
{
  "regex": "/users/\\d+/profile",
  "alias": "/users/<id>/profile",
  "order": 0
}
```

- **`regex` is re2:** no need to escape `/`; anchor with `^` / `$` when meant. **`alias`** uses angle-bracket placeholders (`<id>`, `<slug>`, `<uuid>`, `<date>`); backreferences work but cost more. **`order`:** rules apply sequentially, ascending, each output feeding the next, as chained `replaceRegexpAll(pathname, regex, alias)` calls.

### Workflow

Inspect the real paths first (`execute-sql`) and scan for numeric IDs, UUIDs, slugs, dates, locales and pagination:

```sql
SELECT properties.$pathname AS path, count() AS views
FROM events
WHERE event = '$pageview'
  AND timestamp > now() - INTERVAL 7 DAY
GROUP BY path
ORDER BY views DESC
LIMIT 200
```

| Pattern | Example match | `regex` | `alias` |
|---|---|---|---|
| Numeric segment | `/users/123/profile` | `/users/\d+/profile` | `/users/<id>/profile` |
| UUID v4 | `/sessions/8f3c1a3b-…` | `/sessions/[0-9a-f-]{36}` | `/sessions/<uuid>` |
| Slug | `/posts/why-posthog` | `/posts/[a-z0-9-]+$` | `/posts/<slug>` |
| ISO date | `/archive/2024-09-12` | `/archive/\d{4}-\d{2}-\d{2}` | `/archive/<date>` |
| Locale prefix | `/en-US/about` | `^/[a-z]{2}-[A-Z]{2}/` | `/<locale>/` |
| Trailing query/page | `/blog?page=3` | `\?page=\d+$` | (empty alias drops it) |

- **Test before saving:** the tester at `/settings/project#path_cleaning` (replays the full ordered chain); HogQL `SELECT replaceRegexpAll('/users/42/profile', '/users/\d+/profile', '/users/<id>/profile')` (chain calls in rule order); or the built-in "Help me with Regex" helper (`AiRegexHelper`), whose output you always validate.
- **Order rules from most specific to most general:**

```text
order=0  /users/me/profile        →  /users/me/profile     (specific, runs first)
order=1  /users/\d+/profile       →  /users/<id>/profile
order=2  /users/[a-z0-9-]+        →  /users/<slug>          (catch-all, runs last)
```

- **Apply with MCP `path-cleaning-rules-update`.** It reads the current rules, takes operations `append`, `insert`, `replace`, `remove`, `reorder`, and auto-numbers `order`. Without `confirm: true` it returns a preview, and `sample_paths` shows the rewrites. Call it without `confirm`, show the preview, then resend with `"confirm": true`:

```json
{
  "operations": [{ "action": "append", "alias": "/users/<id>/profile", "regex": "/users/\\d+/profile" }],
  "sample_paths": ["/users/123/profile", "/users/me/profile"]
}
```

- **The fallback `project-settings-update` overwrites the whole list,** as does writing raw `path_cleaning_filters`. Read the existing rules first and merge.

### Pitfalls

- **Prefer a placeholder alias over a backreference:** a capture-group rule costs roughly 3x more per row. Backreferences are `\0`, `\1` to `\9`; in JSON or SQL literals double the backslash (`\\1`).
- **Keep regexes `^`-anchored.** Unanchored patterns are much more expensive because `replaceRegexpAll` keeps scanning.
- **Don't forget `$`:** `\d+` turns `/blog/2024-09-12/post` into `/blog/<num>-<num>-<num>/post`. Use `\d+$` or `\d+(/|$)`.
- **`\/` works but adds noise.**
- **re2 is case-sensitive:** prefix `(?i)`, e.g. `(?i)/users/\d+`.
- **Rules apply globally and can change historical numbers in every cleaned chart.** Warn before applying.

## Suggested path cleaning rules

- **PostHog suggests rules weekly** for teams in the web-analytics precompute cohort: it samples real paths, asks an LLM for `{regex, alias}` rules, validates them against the team's own paths and stores them for review. It only suggests, never auto-applies.
- **Where users see them:** a banner on `/settings/project#path_cleaning` (regex to alias previews with match counts; "Apply all" for project admins merges, close dismisses), the `path_cleaning` onboarding step, and the health page `/web/health`.
- **No suggestion appears when** the team had no `$pageview` within 30 days, already has rules, or has fewer than 50 distinct paths. Empty generations are never stored.
- **Validation:** each regex is compiled with re2 and test-applied to sampled paths; non-compiling or zero-match rules are dropped, and survivors get dense `order` and a `match_count`. Before/after examples are computed in memory only and never stored.
- **Storage:** a `path_cleaning_suggestions` health issue, severity `info`, one active per team, with payload `rules`, `model`, `sampled_path_count`, `distinct_path_count`; each rule has `regex`, `alias`, `order`, `reason`, `match_count`. The check runs weekly, Monday 06:23 UTC; teams with an active suggestion are re-emitted without a fresh LLM call.
- **Applying merges into `path_cleaning_filters`, never overwrites** (dedupes by regex, continues `order`).
- **API:** `POST /api/projects/:id/web_analytics_path_cleaning_suggestions/generate/`; `GET .../{issue_id}/preview/` (before/after on a fresh sample, never stored); `POST .../{issue_id}/apply/` (merges and resolves; project admin only). List with `GET /api/projects/:id/health_issues/?kind=path_cleaning_suggestions&status=active&dismissed=false`; dismiss with `PATCH .../health_issues/{id}/` and `{"dismissed": true}`.
- **MCP:** `web-analytics-path-cleaning-suggestions-generate` and `web-analytics-path-cleaning-suggestions-apply`. Apply is `destructive` (it changes historical chart numbers), so the MCP confirmation gate applies.

## Marketing analytics

- **The scene defaults to last-touch with a 90-day window** (range 1 to 90 days): `DEFAULT_ATTRIBUTION_MODE = AttributionMode.LastTouch`, `DEFAULT_ATTRIBUTION_WINDOW_DAYS = 90` in PostHog's source ([marketing-analytics/frontend/logic/utils.ts](https://github.com/PostHog/posthog/blob/master/frontend/src/scenes/web-analytics/tabs/marketing-analytics/frontend/logic/utils.ts)); the docs pages don't state it. Ad platforms' own numbers count conversions with "their own pixel data and attribution models (e.g., 7-day click, 1-day view)" ([marketing analytics schema](https://posthog.com/docs/web-analytics/marketing-analytics-schema)), so reported conversions may differ from PostHog conversions.
- **First-party first touch** is a breakdown on `$initial_utm_source` or `$initial_referring_domain`, built explicitly ([METRICS-MODELING.md](METRICS-MODELING.md#conversion)) [coreyhaines31/marketingskills, attribution].
- **Revenue computed at ingest:** some tools compute revenue properties at ingest (person-on-events), so historical events may read 0; use the persons table for current MRR, or tier by plan [coreyhaines31/marketingskills, attribution].
- **AI referrers:** group chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai and the like into one channel, keep landing page, referrer and query parameters, and expect it to undercount [coreyhaines31/marketingskills, ai-seo]; measure branded search and direct visits to exposed pages over 1-hour, 24-hour and 7-day windows after a known exposure change ([ai-search-visibility MEASUREMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/MEASUREMENT.md#four-layers-of-effect)).
- Choosing a model and reconciling PostHog with ad platforms and the CRM: [marketing-attribution SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Prove it

- `heatmaps-list` returns data for the page (or you confirmed `Team.heatmaps_opt_in` is off or the URL is wrong), and every recommendation cites a signal: rage clicks, a `fold` value, or an autocapture click count.
- A selector's `elements_chain =~` count, compared with the sampled matches and total `$autocapture` volume, shows it matches one logical interaction, and `matchesAction(...)` on the saved action returns a count.
- Human metrics carry `$virt_is_bot` = `false` (or `NOT isLikelyBot(...)`), and the host filter is still in `properties`; if expected crawlers are missing, `$http_log` events exist.
- A new path cleaning rule was previewed with `sample_paths` before `"confirm": true`, and the top-paths query after applying shows the templated pages collapsed.
