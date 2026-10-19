# The Search Console API

The two endpoints SEO work reads (Search Analytics for clicks, impressions, CTR and position; URL Inspection for index status), the limits that make a pull partial, the errors, CSV exports, and the OAuth app a self-hosted tool needs. Every limit is quoted from developers.google.com; the request defaults and error names come from iannuttall/seo's client (`packages/core/src/google/api.ts`, `gsc/dates.ts`, `gsc/client/inspection-quota.ts`; Apache-2.0, Copyright 2026 Ian Nuttall) and the OAuth steps from every-app/open-seo's `docs/SELF_HOSTING_GOOGLE_SEARCH_CONSOLE.md` (MIT, Copyright (c) 2026 Ben Senescu). What the numbers mean is in [SKILL.md](SKILL.md#the-rules).

## Search Analytics

`POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query` ([Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)).

- **Scopes:** `https://www.googleapis.com/auth/webmasters.readonly` or `webmasters`. A tool that only reads asks for `webmasters.readonly` (OpenSEO does [openseo.so, /google-search-console-mcp]).
- **Filters:** only on `country`, `device`, `page`, `query` and `searchAppearance`. There is no position filter: fetch, then filter position yourself.
- **Sort:** "Results are sorted by click count, in descending order, unless you group by date."
- **Rows:** `rowLimit` from 1 to 25,000, default 1,000; page with `startRow`. "The API is bounded by internal limitations of Search Console and does not guarantee to return all data rows but rather top ones."
- **Search types:** `type` is `discover`, `googleNews`, `news`, `image`, `video` or `web`.
- **Freshness:** `dataState` defaults to `final`; `all` adds fresh data; `hourly_all` goes with the `hour` dimension. `metadata.first_incomplete_date` and `first_incomplete_hour` are in America/Los_Angeles.
- **Dates:** `startDate` and `endDate` are "in PT time (UTC - 7:00/8:00)"; "Data is typically available after 2-3 days" ([all your data](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data)).

[iannuttall/seo, api.ts; dates.ts] One client's defaults, for comparison: `dataState: 'final'`, `dimensions: ['query','page']`, `type: 'web'`, `aggregationType: 'auto'`, pages of 25,000 rows advanced by `startRow` until a short page, time zone `America/Los_Angeles`, a 4-day final-data lag (more conservative than Google's 2 to 3 days) and a default window of 28 days ending at the last final date. Its type allows only `'final' | 'all'`, so it cannot ask for `hourly_all`.

## What a pull can miss

[[all your data](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data)]
- "a maximum of 50K rows of data per day per search type (web, image, and so on--sorted by clicks)". A row past the cap is missing data, never a zero ([SKILL.md](SKILL.md#the-rules)).
- "When you group by page and/or query, our system may drop some data." "For accurate counts, you must omit the page and query dimensions." [iannuttall/seo, SKILL.md] "Query rows do not add up to site totals."
- Search appearance takes two steps: group by `searchAppearance` alone to list the values, then filter by one value.

## Quotas

[[usage limits](https://developers.google.com/webmaster-tools/limits)]

| API | Per site | Per user | Per project |
|---|---|---|---|
| Search Analytics | 1,200 QPM | 1,200 QPM | 30,000,000 QPD, 40,000 QPM |
| URL Inspection | 2,000 QPD, 600 QPM | | 10,000,000 QPD, 15,000 QPM |

- On a short-term load error, "wait 15 minutes". Page and query queries are the most expensive, and "a six month range [is] much more expensive than a query with a one day range."
- [iannuttall/seo, inspection-quota.ts] That client caps URL Inspection at 2,000 a day and 600 a minute per property and resets the daily count at UTC midnight; the limits page names no reset time zone, so the reset time is unverified.
- [openseo.so, /docs/mcp] OpenSEO's `inspect_urls` takes "up to 10 URLs at a time": that is the tool's batch cap, not Google's quota.

## URL Inspection

`POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `{siteUrl, inspectionUrl, languageCode?}` ([index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)).

- "Presently only the status of the version in the Google index is available; you cannot test the indexability of a live URL." [iannuttall/seo, SKILL.md] That tool's `seo index` pairs it with a live check of each page ("checked live and with URL Inspection").
- A URL-prefix `siteUrl` "must include a trailing /"; a domain property is `sc-domain:example.com`.
- Using inspection on a sample to size index bloat (unknown to Google, canonicalised away, crawled but not indexed, indexed) is in [seo TECHNICAL-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/TECHNICAL-AUDIT.md).

## Errors

[iannuttall/seo, api.ts] How one client maps HTTP status to an error code the agent can act on: 401 is `AUTH_EXPIRED`, 403 is `ACCESS_DENIED` ("Check the Google account, its access to this property, and the granted scopes"), 404 is `PROPERTY_NOT_FOUND`, 429 is `RATE_LIMITED`, and any other status is `PROVIDER_UNAVAILABLE`. Whatever the code, a failed pull is missing data, never a zero ([SKILL.md](SKILL.md#the-rules)).

## CSV exports

[open-seo, seo-project-setup] When there is no API connection, ask the user for exports into a local `gsc/` folder:

```text
gsc/queries-last-3-months.csv
gsc/pages-last-3-months.csv
gsc/queries-last-16-months.csv
gsc/pages-last-16-months.csv
```

Also query and page combinations when possible, and countries or devices if relevant. Do not claim an export exists until you can see the file.

- An export is a truncated sample: "The maximum you can export through the Search Console user interface is 1,000 rows of data", while the API returns up to 50,000 rows per day per site per search type ([performance data deep dive](https://developers.google.com/search/blog/2022/10/performance-data-deep-dive)). Say so in the report.
- The source's 16-month export is not confirmed by that post or by the Help page, which gives a default range of the last 3 months; daily data is in Pacific Time ([Search Console Help 9216516](https://support.google.com/webmasters/answer/9216516)).

## A self-hosted OAuth app

[open-seo, SELF_HOSTING_GOOGLE_SEARCH_CONSOLE.md] What a tool that reads Search Console as the user needs:
1. A Google Cloud project with the Search Console API enabled.
2. An OAuth consent screen set to External. While it is in Testing, add the users as test users, "otherwise Google blocks the sign-in with `access_denied`".
3. A web-application OAuth client whose redirect URI is the app's callback (OpenSEO: `<origin>/api/gsc/oauth/callback`); "scheme, host, and port must match exactly, with no trailing slash".
4. The client id and secret in the environment, and the stored tokens encrypted at rest (OpenSEO: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a `BETTER_AUTH_SECRET` of 32 or more characters from `openssl rand -base64 32`).

| Error | Fix |
|---|---|
| `redirect_uri_mismatch` | Make the registered redirect URI match exactly |
| "Search Console API isn't enabled" | Enable it, wait a minute |
| No properties to pick | Verify the site in Search Console first |

Reading Google Analytics with the same client is [google-analytics SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md). OAuth app setup in general is [third-party-integrations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/SKILL.md).

## Prove it

A pull pages with `startRow` until a short page and the report states the window, the `dataState`, the search type and whether the 50,000-row or grouping limits could apply; position filters run after fetching; totals come from a query without page and query dimensions; inspection runs stay under 2,000 a day and 600 a minute per site; a 403 reports the account, property and scope; an exported CSV is called a 1,000-row sample; and a test sign-in on the OAuth app succeeds with a test user and fails cleanly with `redirect_uri_mismatch` on a changed port.
