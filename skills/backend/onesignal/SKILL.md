---
name: onesignal
description: "Builds on OneSignal across web, React and Next.js, React Native, Expo, Flutter and Node servers: platform credentials and SDK setup, the User Model (External ID, login, aliases, Subscriptions, tags), the REST API and the Node SDK with idempotent retries, sending from Supabase Edge Functions, Event Streams and webhooks, permission prompts and messaging practices, Segments, Journeys, in-app messages and HTML in-app messages, Live Activities, Liquid personalization and templates, email and SMS deliverability and compliance, analytics, plan limits and privacy, and migrating off the Player Model or debugging a notification that never arrived. Use when adding OneSignal to an app or site, sending push, email or SMS from a backend, building a Segment, Journey or in-app message, reading OneSignal reports, or fixing missing, duplicated or unshown notifications."
---

# OneSignal

OneSignal stores each person as a User with up to 20 Subscriptions (an app install, a browser, an email address, a phone number), and the External ID you pass to `OneSignal.login` is what joins them: without it every Subscription is its own anonymous User that segments, tags and transactional sends cannot treat as one. Everything here targets the User Model (mobile SDKs v5+, Web SDK v16+); code written from Player Model names (`include_player_ids`, `include_external_user_ids`, `setExternalUserId`, `onesignal.com/api/v1`, `userKey`) is outdated, and the Supabase guides still use them. Push cannot deliver until the platform credentials exist, and "Delivered" only means FCM, APNs or the browser push service accepted the message. Supabase itself is [supabase SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SKILL.md); OneSignal-neutral email deliverability is [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| FCM v1 and APNs `.p8` credentials, bare React Native, Expo plugin, Flutter, iOS capabilities, App Groups and the Notification Service Extension | [SETUP-MOBILE.md](SETUP-MOBILE.md) |
| Web SDK v16, the service worker path and scope, Typical Site vs Custom Code, `react-onesignal` in React and Next.js, init options, iOS Home Screen web push, localhost | [SETUP-WEB.md](SETUP-WEB.md) |
| React Native and Flutter runtime calls: log level, consent, click and foreground listeners, clearing notifications, IAM triggers, Live Activities, outcomes, location | [MOBILE-SDK-API.md](MOBILE-SDK-API.md) |
| Users, OneSignal ID and External ID, `login` and `logout`, aliases, Subscriptions and `notification_types`, observers, tags, custom events, Identity Verification (JWT) | [USER-MODEL.md](USER-MODEL.md) |
| Keys, rate limits, retries and `idempotency_key`, Create message targeting and fields, silent pushes, `custom_data`, responses and errors, Users, Aliases and Subscriptions APIs | [REST-API.md](REST-API.md) |
| The Node SDK `@onesignal/node-onesignal`, sending from Supabase Edge Functions, Event Streams and their data, Journey webhooks, web push webhooks | [SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md) |
| Permission prompts: mobile in-app soft prompt, programmatic prompting, iOS provisional, the mobile permission API, web Slidedown, Subscription Bell, custom link, native prompt rules and back-off | [PERMISSIONS.md](PERMISSIONS.md) |
| Push content limits, delivery time, payload, priority, TTL, throttling, frequency capping, how often to send, opt-in strategy, A/B tests and retargeting, auditing a program | [MESSAGING-PRACTICES.md](MESSAGING-PRACTICES.md) |
| Segments: filters, combining, counts, sessions, tags, Time Operators, custom events and message events, building one for someone | [SEGMENTS.md](SEGMENTS.md) |
| Journeys: entry, exit and re-entry rules, steps, live edits, recommended shapes, webhooks, A/B tests, analytics | [JOURNEYS.md](JOURNEYS.md) |
| In-app messages: audience and session pull, triggers, display rules, click actions, block editor, testing, reports | [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md) |
| HTML in-app messages: the `OneSignalIamApi` bridge, click labels, Liquid in HTML, mobile rendering, templates, composing one | [IAM-HTML.md](IAM-HTML.md) |
| iOS Live Activities: when to use one, lifecycle, limits, update budget and priority, analytics | [LIVE-ACTIVITIES.md](LIVE-ACTIVITIES.md) |
| Liquid, data sources, templates, API `custom_data`, Data Feeds, multi-language messages | [PERSONALIZATION.md](PERSONALIZATION.md) |
| Email senders, DNS, thresholds, warm-up, unsubscribe and suppression; SMS, MMS and RCS senders, registration, consent, keywords and compliance (provider-neutral SMS law, 10DLC and sequences: [sms-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md)) | [EMAIL-AND-SMS.md](EMAIL-AND-SMS.md) |
| Push reports, confirmed receipt, CTR, metric names across dashboard, API, CSV and Event Streams, conversion metrics, retention, plan limits, consent, GDPR, deletion | [ANALYTICS-AND-PRIVACY.md](ANALYTICS-AND-PRIVACY.md) |
| Player Model to User Model, the Web v15 to v16 method map, legacy endpoints and keys, troubleshooting order, delivered but not shown, duplicates, debug logs, test users | [MIGRATION-AND-TROUBLESHOOTING.md](MIGRATION-AND-TROUBLESHOOTING.md) |

## The rules

1. **Check credentials before debugging SDK code.** Push cannot deliver until FCM v1, APNs (a `.p8` with Sandbox & Production) or HMS credentials are configured in OneSignal; never say push will deliver before they are.
2. **Call `OneSignal.login(externalId)` with your own stable user ID** on every page load or app start once it is known, and `logout()` on sign-out. Identify users by External ID or aliases, never by tags, and never persist the OneSignal ID as the user's identifier.
3. **Target transactional sends with `include_aliases` keyed by `external_id`, plus `target_channel`,** and use exactly one targeting method per request.
4. **Never retry a message send without an `idempotency_key`,** and reuse the same key on every attempt. Retry timeouts, `429` (after `Retry-After`) and `5xx`; never `400`, `401` or `403`.
5. **Check the response `id`, not only the status.** A `200` with an empty `id` sent nothing.
6. **Keep REST API keys on the server.** Never embed them in a mobile or web client, never commit them, and never ask for API keys, `.p8` keys or `.p12` certificates in chat.
7. **Earn the permission with a soft prompt after a value moment,** not a system prompt on first launch: iOS shows the system prompt once.
8. **Don't claim the REST API alone can deliver in-app messages or Live Activities;** both need the SDK, and an in-app message shows only to users who met its audience before a new session started (30+ seconds in the background).

## Prove it

Verify only the configured platforms, channels and features involved in the task. FCM and APNs checks apply to their respective mobile push platforms; the cross-channel identity check applies to the subscriptions the application actually uses. A web-only, Android-only or email-only task does not require the other channels.

Push credentials show FCM v1 and an APNs `.p8` in the dashboard; after sign-in, one OneSignal ID holds the person's web, mobile and email Subscriptions under your External ID; a server send by `include_aliases.external_id` with `target_channel` and an `idempotency_key` returns a non-empty `id` and arrives once; `os_v2_app_` appears nowhere in the client bundle or repo; no Player Model names remain in the code; and every file's own Prove it checks pass for the parts you touched.
