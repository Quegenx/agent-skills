# Consent state

Where the choice lives decides what survives a reload, a closed tab, a dropped cookie, a second tab and a server render. Source: c15t's consent state reference (https://c15t.com/docs/concepts/consent-state.md), how-consent-works.md, choose-your-setup.md, troubleshooting.md and comparisons/build-your-own.md, all tagged `[c15t]`.

**Contents:** [What a save does](#what-a-save-does) · [Retry queue](#retry-queue) · [Cookie and localStorage](#cookie-and-localstorage) · [Open tabs](#open-tabs) · [Clearing records](#clearing-records) · [Blocked storage](#blocked-storage) · [Server rendering and caching](#server-rendering-and-caching) · [The build-time manifest](#the-build-time-manifest) · [Who runs the backend](#who-runs-the-backend) · [Ad blockers](#ad-blockers) · [Where the landing page differs](#where-the-landing-page-differs) · [Prove it](#prove-it)

## What a save does

When a visitor clicks Accept, Reject or Save [c15t, how-consent-works.md, consent-state.md]:

1. In the click task, the choice and permissions change, `onChoiceRecorded` and `onPermissionsChanged` run, gated scripts, iframes and network rules follow, and the surface closes ("Its exit animation still plays").
2. In the next task, the choice is written to the cookie and localStorage.
3. Then the request to the backend starts. "If the request fails, the choice stays saved in the browser and the request is retried later."
4. If the save turned off a category or vendor that was granted, the page reloads in the next task. "Removing a script cannot stop code that already ran, so the reload starts a page with only permitted code."

- "A failed request does not reopen the surface or roll the choice back."
- "A closing banner does not prove a saved choice; wait for the backend response." [c15t, SKILL.md §7]
- Closing without saving: "A visitor who opens preferences from the banner and backs out still owes a choice, so the banner comes back. Once a choice is recorded, closing the dialog leaves nothing open."

## Retry queue

[c15t, consent-state.md]

- A failed save "queues the payload in localStorage. Where localStorage is unavailable, the queue lives in memory until the page unloads. The queue is replayed after the next successful initialization and when the browser comes back online, up to 10 attempts over 7 days."
- "A replay carries the original action time and policy snapshot token, so the backend records when the visitor decided, and a duplicate submission resolves to the same consent record." A self-hosted backend's signed snapshot tokens expire after "30 minutes by default"; "A save still queued by then is recorded only in the browser."
- "A locally remembered choice alone does not prove that the backend received it; check the saved consent record in Inth."

## Cookie and localStorage

[c15t, consent-state.md]

- "The consent record is stored twice: as a cookie, which a server render reads, and in localStorage. The cookie is authoritative. A well-formed cookie wins even when it has expired, so a local copy can never bring back a grant the cookie no longer carries."
- "A denial in the local copy that is newer than the cookie's decision for that category is therefore applied on top of the cookie. A newer local grant is not, so a dropped cookie write only ever leaves the visitor with less permission."
- "When both copies hold a decision for a category from the same millisecond and the two conflict, the denial wins."
- "Cookies and localStorage are per origin. Serve the site from one origin, or share the cookie across subdomains." [c15t, troubleshooting.md]

## Open tabs

[c15t, consent-state.md]

- Same-origin tabs share the cookie and localStorage: "When a visitor rejects in one tab, every other open tab on that origin applies the rejection without a reload."
- Reconciliation runs on the `storage` event, on `visibilitychange` and on `focus`; reconnecting reads no storage. "The `storage` event only exists for localStorage." With localStorage blocked, another tab's change arrives on the next focus or visibility change. "c15t does not poll the cookie or use a `BroadcastChannel` for this."
- "Category decisions merge per category. Each category keeps the decision with the newer confirmation time, so a tab that only changed marketing never reverts another tab's newer measurement decision."
- "Blocked storage, or bytes that do not decode, change nothing. A failed read never grants a category."
- Tabs on another subdomain sharing the cookie get no `storage` event; "They pick up the change on their next focus or visibility change".

## Clearing records

[c15t, consent-state.md] `clearRecords()` removes every record, drops queued saves, and stores the time of the clear (the clear epoch) under `c15t-epoch` in localStorage and a cookie of the same name. "A decision confirmed before the epoch was made before the clear, so it is void wherever it turns up." An epoch "up to one hour ahead of the clock is kept"; further ahead it reads as corrupt, so a new epoch is capped an hour ahead. c15t names this a "known limit": "Times alone cannot order a clear against decisions stamped by a clock that went back more than an hour."

## Blocked storage

"Does the browser block storage, for example in a sandboxed iframe or a strict privacy mode? The choice works for the current page only. Nothing to fix in your app." [c15t, troubleshooting.md] If DevTools Application shows no `c15t` cookie and localStorage entry after saving, "look for `persistence: false` in your config. Examples use it on purpose; production apps should not."

## Server rendering and caching

[c15t, choose-your-setup.md, troubleshooting.md]

| Rendering | What the visitor gets |
|--|--|
| The server resolves consent for each request | The server reads the visitor's cookie and location headers, so the browser starts with the answer. Gated scripts can run right after hydration, and the banner can be part of the HTML. |
| The browser resolves consent | The HTML is the same for everyone. After the page loads, the browser requests the policy, then shows the banner or runs gated scripts. |

- "A static or prerendered page cannot contain one visitor's consent, because the same HTML goes to everyone." Shared caches (Next.js ISR, `'use cache'`) need browser resolution: "Cache the public policy manifest, never a response that contains a visitor's consent."
- "Never keep consent state in a module-level variable on the server. One visitor's state can leak into another request. Create it per request, as the framework guides do."
- "Pass the value your framework's server helper returns to the provider unchanged. Do not merge it with defaults or rebuild it from permissions."

## The build-time manifest

[c15t, choose-your-setup.md, troubleshooting.md] Server frameworks bundle the public policy at build time ("Rebuild after changing policies, translations or vendors. If your CI caches build output, force a fresh build."):

- "The fetch waits at most 10 seconds." On failure a production build stops with an error; dev warns and fetches at runtime.
- `onBuildError: 'runtime'`, or the environment variable, lets a production build finish during a backend outage: `C15T_ON_BUILD_ERROR=runtime npm run build`. "Turborepo's strict environment mode hides undeclared variables from tasks, so list `C15T_ON_BUILD_ERROR` in the build task's `passThroughEnv` there."
- "A failed download never reuses an older snapshot."
- Next.js "inlines `NEXT_PUBLIC_` variables at build time, so the build, the server and the browser use the same URL, and changing the variable on a built app has no effect until you rebuild." [c15t, next/quickstart.md]

## Who runs the backend

| Option | Use it when |
|--|--|
| Inth | You want hosted policies and consent records. |
| Self-hosted c15t backend | You need to run the service and its database yourself. |
| Offline mode | Local development and tests. Policies live in your code and choices stay in the browser, with no consent records. Not recommended for production environments. |

[c15t, choose-your-setup.md] "Remote records without a backend" is on c15t's list of what it does not include: "A local choice is not proof that a backend received it." [c15t, comparisons/build-your-own.md]

## Ad blockers

"Some filter lists block the consent backend's domain or old c15t chunk names such as `consent-dialog-*.js`. Current releases use neutral chunk names; update and rebuild. If the backend domain is blocked, the banner cannot load policy and every optional category stays denied." [c15t, troubleshooting.md]

## Where the landing page differs

The owner's banner ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#cookie-banner), `reference/website/widgets/cookie-consent/cookie-consent-storage.ts`) is the design for that skill; these are differences, not fixes:

- It stores `accepted` or `denied` in localStorage only, read by an inline head script before the tag bootstraps; c15t stores cookie plus localStorage with the cookie authoritative. The head-script read covers the first paint without a cookie.
- It keeps no backend record; c15t calls offline mode "Not recommended for production environments" (c15t's position, not an official-doc requirement).
- Its stored choice is versioned by key format (`app-cookie-consent:v1`), not by policy; c15t prompts again after a policy change or an expired choice.
- One binary decision drives `analytics_storage` only, with ad types always denied; c15t uses five categories and a preference dialog.
- Both agree on cross-tab sync over the `storage` event filtered to the consent key and on keeping the choice for the page view when storage is blocked.

## Prove it

After saving, DevTools Application shows the choice in the cookie and localStorage and the Network panel shows the backend save succeed; with the save request blocked the choice still holds on reload and the save is retried once the request is unblocked; a rejection in one tab applies in a second open tab without a reload; a server-rendered page carries no other visitor's consent and no cached response contains one; a production build with the backend unreachable stops with the manifest error unless `C15T_ON_BUILD_ERROR=runtime` is set.
