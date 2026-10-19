# GA4

Setting up a Google Analytics 4 property and checking that it records what the plan says: data streams and retention, enhanced measurement, recommended events, gtag code, key events, custom definitions, audiences, DebugView, internal traffic, the Google Ads link and the GA4 MCP server. Rules are from the analytics skill of coreyhaines31/marketingskills (MIT, references/ga4-implementation.md) unless tagged with a Google URL; where the source is out of date, the Google form is given and the source's line is quoted. Tag Manager is [GTM.md](GTM.md); consent is [CONSENT-MODE.md](CONSENT-MODE.md).

**Contents:** [Setup](#setup) · [Data streams and retention](#data-streams-and-retention) · [Enhanced measurement](#enhanced-measurement) · [Recommended events](#recommended-events) · [Sending events with gtag](#sending-events-with-gtag) · [Key events](#key-events) · [Custom dimensions and metrics](#custom-dimensions-and-metrics) · [Audiences](#audiences) · [DebugView](#debugview) · [Common issues](#common-issues) · [Data quality](#data-quality) · [Google Ads](#google-ads) · [Privacy](#privacy) · [Reading GA4 from an agent](#reading-ga4-from-an-agent) · [Prove it](#prove-it)

## Setup

[coreyhaines31/marketingskills, analytics]
1. Create the GA4 property and data stream.
2. Install gtag.js or GTM.
3. Enable enhanced measurement.
4. Configure custom events.
5. Mark key events in Admin. The source says "Mark conversions in Admin"; GA4 now calls them key events ([Key events](#key-events)).

## Data streams and retention

[coreyhaines31/marketingskills, analytics]
- One stream per platform (web, iOS, Android).
- Enable enhanced measurement for automatic tracking.
- Configure data retention (the source: "2 months default, 14 months max").
- Enable Google Signals (for cross-device) only if consented.

Google's retention page adds (https://support.google.com/analytics/answer/7667196):
- "The data retention setting does not affect standard aggregated reports... The data retention setting only affects explorations and funnel reports."
- "The two-month retention period is always applied to age, gender, and interest data regardless of your settings."
- "Large and XL properties are limited to 2 months": when a standard property becomes Large, "event-level data older than 2 months becomes inaccessible and is permanently deleted."
- A longer setting applies to data already collected and not yet deleted; a shorter one deletes affected data "during the next monthly process"; "Analytics waits 24 hours before implementing the change."

## Enhanced measurement

Enhanced measurement sends these events once the options are on for a web stream, with no code changes; with the Google tag, each event must also be enabled for automatic event detection in the tag settings (on by default) (https://support.google.com/analytics/answer/9216061).

| Option / event | Fires | Parameters |
|---|---|---|
| Page views `page_view` | each page load or browser history change; collected automatically and cannot be turned off; an advanced setting controls the history events (pushState, popState, replaceState) | page_location, page_referrer |
| Scrolls `scroll` | the first time a user reaches 90% vertical depth on each page | engagement_time_msec |
| Outbound clicks `click` | a link leading away from the current domain; links to domains configured for cross-domain measurement do not trigger it | link_classes, link_domain, link_id, link_url, outbound (boolean) |
| Site search `view_search_results` | a results page, detected by a URL query parameter: by default `q`, `s`, `search`, `query` or `keyword`, configurable | search_term, optional `q_<param>` |
| Video engagement `video_start`, `video_progress`, `video_complete` | YouTube embeds with JS API support; progress past 10%, 25%, 50% and 75% | video_current_time, video_duration, video_percent, video_provider, video_title, video_url, visible |
| File downloads `file_download` | a link to a file whose extension matches `pdf\|xlsx?\|docx?\|txt\|rtf\|csv\|exe\|key\|pp(s\|t\|tx)\|7z\|pkg\|rar\|gz\|zip\|avi\|mov\|mp4\|mpe?g\|wmv\|midi?\|mp3\|wav\|wma` | file_extension, file_name, link_classes, link_id, link_text, link_url |
| Form interactions `form_start`, `form_submit` | the first interaction with a form in a session; a submit | form_id, form_name, form_destination, plus form_submit_text on submit; usable in reports only after you create custom dimensions for them |

The source's table omitted form interactions and the default search parameters. Its rule on names stands [coreyhaines31/marketingskills, analytics]: "Use these exact names in event filters and triggers. The option labels 'outbound clicks', 'site search' and 'video engagement' are not automatic event names. For video, report starts, progress milestones and completions separately; adding all three counts double-counts a viewing journey. A custom event with one of the old labels needs its own implementation. Verify enabled options and observed parameters in DebugView before expecting data."

## Recommended events

[coreyhaines31/marketingskills, analytics] Use Google's predefined events when possible for enhanced reporting (reference: https://support.google.com/analytics/answer/9267735):
- **All properties:** `login`, `sign_up`, `share`, `search`.
- **Ecommerce:** `view_item`, `view_item_list`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `refund`.
- **Games:** `level_up`, `unlock_achievement`, `post_score`, `spend_virtual_currency`.

## Sending events with gtag

[coreyhaines31/marketingskills, analytics]

```javascript
// Basic event
gtag('event', 'signup_completed', {
  'method': 'email',
  'plan': 'free'
});

// Event with value
gtag('event', 'purchase', {
  'transaction_id': 'T12345',
  'value': 99.99,
  'currency': 'USD',
  'items': [{
    'item_id': 'SKU123',
    'item_name': 'Product Name',
    'price': 99.99
  }]
});

// User properties
gtag('set', 'user_properties', {
  'user_type': 'premium',
  'plan_name': 'pro'
});

// User ID (for logged-in users)
gtag('config', 'GA_MEASUREMENT_ID', {
  'user_id': 'USER_ID'
});
```

In a typed codebase, route every call through one helper that does nothing on the server or without the tag, as the owner's website does with `trackAnalyticsEvent` ([google-analytics.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/site/google-analytics.ts)). The dataLayer form of these calls is in [GTM.md](GTM.md#datalayer-patterns).

## Key events

GA4 calls the actions you measure as goals **key events**; "conversions" now means Google Ads conversions created from them (https://support.google.com/analytics/answer/13128484). The source's steps said "Mark as conversion - Admin > Events > Mark as conversion".
- **Existing event:** Admin, under *Data display*, **Events**; find it in the **Recent events** tab and click the star icon.
- **New event:** Admin, Data display, Events, **+ Create event**, enter the name, toggle *Mark as key event*, pick the *Default key event value* and *Counting method*, **Create**. New events can be marked "ahead of time so that Google Analytics starts to treat the events as key events when they're collected."
- Limits: up to 30 key events on standard properties and 50 on Analytics 360.
- Marked by default: `purchase` (web and app), and on apps `first_open`, `in_app_purchase`, `app_store_subscription_convert`, `app_store_subscription_renew`. With Ads Personalization enabled and a linked Google Ads account, `add_to_cart`, `add_to_wishlist`, `begin_checkout`, `session_start`, `view_item`, `view_item_list` and `view_search_results` are marked too.
- Timing: marking "doesn't change historic data"; "allow for up to 24 hours for it to show up in standard reports. Realtime reports update a few minutes after a user triggers a key event." Unmarking leaves past events counted as key events.
- Counting, per the source [coreyhaines31/marketingskills, analytics]: once per session for leads and signups, every event for purchases; send `value` and `currency` on the event, or set a default value when marking it; import into Google Ads for conversion-optimized bidding. Google: "Google Ads conversions don't appear in standard Google Analytics reports."

## Custom dimensions and metrics

[coreyhaines31/marketingskills, analytics]
- **Custom dimensions** for properties you segment or filter by: user attributes (plan type, industry), content attributes (author, category). **Custom metrics** for numeric values to aggregate: scores, counts, durations.
- **Use predefined dimensions first.** For additional custom data, choose the matching scope: **Event** for event parameters, **User** for user properties, **Item** for custom parameters in the ecommerce `items` array. Configure the actual underlying key; the display name need not equal it. Admin, Data display, Custom definitions creates these definitions. The old setup line treated every scope as an event parameter, and the old Prove it required a custom definition for every reported parameter. [Google custom dimensions and metrics](https://support.google.com/analytics/answer/10075209), [event-scoped setup](https://support.google.com/analytics/answer/14239696)

| Dimension | Scope | Underlying key | Description |
|-----------|-------|-----------|-------------|
| User Type | User | user_type | Free, trial, paid |
| Content Author | Event | author | Blog post author |

`item_category` already populates the predefined Item category dimension; reuse it. The source table presented it as a new custom Item dimension. [Google ecommerce report](https://support.google.com/analytics/answer/9786881)

## Audiences

[coreyhaines31/marketingskills, analytics] Admin, Data display, Audiences. Uses: remarketing audiences exported to Ads, segment analysis, trigger-based events. Examples:
- **High-intent visitors:** viewed the pricing page, did not convert, in the last 7 days.
- **Engaged users:** 3+ sessions, or 5+ minutes total engagement.
- **Purchasers:** the purchase event, for exclusion (the source adds "or lookalike"; see [Google Ads](#google-ads) for what replaced similar audiences).

## DebugView

DebugView shows the events and user properties collected from one device in real time; it needs debug mode (https://support.google.com/analytics/answer/7201382).
- **For your own device:** Tag Assistant at https://tagassistant.google.com/ or Tag Manager's preview mode; "Tag Assistant adds a parameter to your website address to enable debug mode."
- **For everyone:** `gtag('config', 'G-12345ABCDE', { 'debug_mode':true });`, or `'debug_mode':true` on single events; in GTM, set `debug_mode` to `true` in the Google tag or in one "Google Analytics: Google Analytics Event tag".
- **To turn it off,** remove the parameter: "setting the parameter to `false` doesn't disable debug mode."
- **Where:** Admin, under *Data display*, **DebugView**. The Seconds stream shows the last 60 seconds, the Minutes stream the last 30 minutes; pick your device under **DEBUG DEVICE**.
- **Nothing shows** "if you have implemented privacy controls on the client-side, or if you've implemented consent mode and users have not given consent for Analytics cookies."
- DebugView does limited attribution; use the Acquisition reports for attribution.

The source said to enable it with "URL parameter: `?debug_mode=true`" and "Chrome extension: GA Debugger", and to view it at "Reports > Configure > DebugView"; Google's page names neither and gives the path above.

Real-time reports [coreyhaines31/marketingskills, analytics]: Reports, Real-time, for events in the last 30 minutes.

## Common issues

[coreyhaines31/marketingskills, analytics]
- **Events not appearing:** check DebugView first; verify gtag or GTM is firing; check filter exclusions.
- **Parameter values missing:** custom dimension not created; parameter name mismatch; data still processing (the source says 24 to 48 hours).
- **Key events not recording:** event not marked as a key event; event name doesn't match; counting method (once vs. every).

## Data quality

**Internal traffic** needs two steps; defining it alone only labels events (https://support.google.com/analytics/answer/10104470):
1. Admin, *Data collection and modification*, **Data streams**, a web stream, **Configure tag settings**, **Show more**, **Define internal traffic**, **Create**: name the rule, set the `traffic_type` value (default `internal`), and match IP addresses (equals, begins with, ends with, contains, CIDR range or regex; several conditions are OR).
2. Admin, **Data filters**, **Create Filter**, **Internal Traffic**, **Exclude**, and a state: **Testing** (matches get the "Test data filter name" dimension, visible in Explore), **Active** or **Inactive**.
- "Once you apply a data filter, the effect on the data is permanent"; use report filters to hide data without deleting it. Up to 10 data filters per property; a filter "can take between 24 - 36 hours to apply"; app traffic cannot be filtered this way. Run a filter in Testing first.
- Google's DebugView page also says to filter out developer traffic while debug mode is on (https://support.google.com/analytics/answer/7201382).

[coreyhaines31/marketingskills, analytics]
- **Cross-domain:** Admin, Data streams, the stream, Configure tag settings, Configure your domains: list every domain that should share sessions.
- **Session settings** (same place): session timeout (default 30 minutes), engaged session duration (default 10 seconds).

## Google Ads

[coreyhaines31/marketingskills, analytics] Link under Admin, Product links, Google Ads links; enable auto-tagging in Google Ads; import key events into Google Ads. GA4 audiences can be used in Google Ads for remarketing and customer match. The source also listed "Similar audiences"; Google Ads now says that "If you've been using similar segments in Awareness and Reach or Consideration Video campaigns", you can "include your first-party data segments in your ad groups and enable audience expansion" (https://support.google.com/google-ads/answer/12463119). Campaign work is [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md).

## Privacy

[coreyhaines31/marketingskills, analytics] No PII in analytics properties; set data retention; have user deletion capabilities; use consent mode ([CONSENT-MODE.md](CONSENT-MODE.md)); collect only what you need; integrate with a consent management platform ([cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)). The source also listed "IP anonymization"; Google: "In Google Analytics 4, IP masking is not necessary since IP addresses are not logged or stored" (https://support.google.com/analytics/answer/2763052).

## Reading GA4 from an agent

Google's GA4 MCP server (https://github.com/googleanalytics/google-analytics-mcp, marked "Experimental") exposes `get_account_summaries`, `get_property_details`, `list_google_ads_links`, `run_report`, `run_funnel_report`, `get_custom_dimensions_and_metrics` and `run_realtime_report`; its setup uses Application Default Credentials from user OAuth or service account impersonation, with the `analytics.readonly` scope. Google: "The MCP server is available for read requests only. It can't edit your Google Analytics configuration or settings." (https://developers.google.com/analytics/devguides/MCP). Numbers it returns still go through [TRACKING-PLAN.md](TRACKING-PLAN.md#reading-the-numbers).

- **Your own OAuth client** [open-seo, SELF_HOSTING_GOOGLE_ANALYTICS.md]: enable the Analytics Admin API (it lists properties) and the Analytics Data API (it runs reports), and register the redirect `<origin>/api/ga4/oauth/callback`. The Search Console client can be reused, but "GA4 still asks for a separate consent grant". "OAuth apps left in Google's Testing status can receive short-lived refresh grants."
- **From a CLI** [iannuttall/seo, README.md]: `seo analytics google properties`, then `seo ai-referrals --property 123456789`; the property must be the numeric id ([search-console SEO-CLI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SEO-CLI.md)).

## Prove it

With Tag Assistant connected, every planned event and its parameters appear in DebugView on your device; each enhanced measurement event the plan relies on is enabled and observed under its real name; reported custom data that needs a custom definition uses its correct scope and configured underlying key, while predefined dimensions are reused; key events are marked under Admin, Data display, Events and appear in Realtime; the internal traffic filter ran in Testing and shows your own events under "Test data filter name" before it was made Active; no `debug_mode: false` is left in production code.
