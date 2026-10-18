---
name: google-analytics
description: "Sets up and checks Google Analytics 4, Google Tag Manager and UTM tracking: the tracking plan and event library, event naming, UTM rules and partner link patterns, GA4 channel groups including AI Assistant, enhanced measurement, recommended and key events, custom definitions, audiences, DebugView, internal traffic filters, the dataLayer, GTM naming, versions and price variables, Google Consent Mode, and reading the numbers without fooling yourself. Use when adding GA4 or GTM to a site, writing a tracking plan or a UTM scheme, debugging events that don't show up, wiring consent mode, or reporting marketing numbers from GA4."
---

# Google Analytics

GA4 counts what a page sends it and nothing else: an event it was never sent, a parameter with no custom definition, a link with a mistyped `utm_medium` or a visitor who refused consent all look the same in a report, as nothing. So most of the work happens before the data arrives: a tracking plan that starts from the decisions the numbers will drive, names that match what Google collects, UTMs that follow one spelling, and a check in DebugView or Tag Assistant before anyone trusts a report. The material comes from the analytics skill of coreyhaines31/marketingskills (MIT; its partner-UTM table is "adapted from Wispr Flow's link-creator skill (MIT)"), checked against Google's Analytics, Tag Manager, tag platform and Google Ads help pages, with the Google side of c15t's consent docs (Apache-2.0). Where the source disagrees with Google, each file gives Google's form with its URL and says what the source said.

Product analytics for the user's apps is PostHog ([../posthog/SKILL.md](../posthog/SKILL.md)); the owner's website sends GA4 events through one typed helper in consent mode, described in [../../frontend/landing-page-ui/DISCOVERY.md](../../frontend/landing-page-ui/DISCOVERY.md#consent-and-analytics) and [google-analytics.ts](../../frontend/landing-page-ui/reference/website/shared/site/google-analytics.ts). That design is the owner's and this skill does not replace it. The cookie banner, consent categories and script gating are [../../frontend/cookie-consent/SKILL.md](../../frontend/cookie-consent/SKILL.md); choosing attribution models and reconciling tools is [../../marketing/marketing-attribution/SKILL.md](../../marketing/marketing-attribution/SKILL.md); experiment design is [../../marketing/ab-testing/SKILL.md](../../marketing/ab-testing/SKILL.md).

Before asking questions, read `.agents/product-context.md` if it exists (defined in [../../anti-ai-slop/anti-slop-copy/CONTEXT.md](../../anti-ai-slop/anti-slop-copy/CONTEXT.md); the source calls this file `.agents/product-marketing.md`), then ask only what it doesn't cover: what decisions the data will inform and the key conversions, what tracking and tools exist, the stack and any privacy requirements [coreyhaines31/marketingskills, analytics].

| The job | Read |
|---|---|
| Principles, reading numbers (compute, cross-check, a segment's own numbers, matching windows, pending cohorts, recommending against the goal), the plan template, naming, essential events, standard properties, funnels, the plan document, the validation checklist | [TRACKING-PLAN.md](TRACKING-PLAN.md) |
| The full event library by area: marketing site, product, monetization, ecommerce, B2B, property examples | [EVENT-LIBRARY.md](EVENT-LIBRARY.md) |
| The five UTM parameters, naming rules, patterns per partner type, GA4's default channel rules, custom channel groups, AI Assistant traffic | [UTM.md](UTM.md) |
| GA4 setup, data streams, retention, enhanced measurement events and parameters, recommended events, gtag code, key events, custom definitions, audiences, DebugView, internal traffic filters, Google Ads links, IP masking, the GA4 MCP server | [GA4.md](GA4.md) |
| Tag Manager containers, naming, dataLayer patterns, ecommerce pushes, the Google tag and event tags, pixels, preview, workspaces and versions, sequencing, custom JavaScript variables and prices | [GTM.md](GTM.md) |
| Consent Mode: the four ad and analytics parameters, the default on every page, `wait_for_update`, URL passthrough, basic and advanced mode, GTM consent settings, verifying it | [CONSENT-MODE.md](CONSENT-MODE.md) |

## The rules

1. **Every event informs a decision.** Start from the questions and the actions the answers drive, work back to the events, and avoid vanity metrics; clean data beats more data [coreyhaines31/marketingskills, analytics] ([TRACKING-PLAN.md](TRACKING-PLAN.md#principles)).
2. **Use Google's names for Google's events.** Filter on `click` with `outbound: true`, `view_search_results` and `video_start`/`video_progress`/`video_complete`, not the option labels; naming a custom event does not make GA4 collect it [coreyhaines31/marketingskills, analytics] ([GA4.md](GA4.md#enhanced-measurement)).
3. **One spelling per UTM value, lowercase, no personal data,** built from a shared sheet, and test the final URL after shorteners and redirects [coreyhaines31/marketingskills, analytics] ([UTM.md](UTM.md#naming-rules)).
4. **Check the channel a medium lands in before a campaign ships.** Only a few mediums map to a default channel; the rest go Unassigned unless the source matches one of Google's site lists or a custom channel group catches them (https://support.google.com/analytics/answer/9756891) ([UTM.md](UTM.md#where-a-medium-lands)).
5. **GA4 has key events, not conversions.** Mark them under Admin, Data display, Events; "conversions" now means Google Ads conversions (https://support.google.com/analytics/answer/13128484) ([GA4.md](GA4.md#key-events)).
6. **Send the consent default on every page before any `config` or `event` command,** with all four of `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage` (https://developers.google.com/tag-platform/security/guides/consent) ([CONSENT-MODE.md](CONSENT-MODE.md)).
7. **Compute every figure from row-level data and divide matching closed windows** [coreyhaines31/marketingskills, analytics] ([TRACKING-PLAN.md](TRACKING-PLAN.md#reading-the-numbers)).
8. **Money comes from data, not display text:** a numeric amount and currency from the data layer, `null` when missing, `0` only for a free item [coreyhaines31/marketingskills, analytics] ([GTM.md](GTM.md#custom-javascript-variables)).
9. **Confirm in DebugView or Tag Assistant before trusting a report,** remembering that DebugView shows nothing for a visitor who denied analytics cookies (https://support.google.com/analytics/answer/7201382) ([GA4.md](GA4.md#debugview)).

## Prove it

Every event in the plan names the decision it informs and appears in DebugView with its parameters; filters use `click` with `outbound=true`, `view_search_results` and the three video events reported separately, never summed as views; each campaign link's medium lands in the intended channel; key events appear in Realtime within minutes; a GTM price variable returns `1234.56` for `data-price="1234.56"`, `null` for a missing or malformed value and `0` only for a free item; Tag Assistant shows the consent `default` before `config` with all four parameters; and each file's own Prove it checks pass for the parts you touched.
