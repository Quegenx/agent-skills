# Verify consent

"A banner on screen proves only that the banner renders." The release check watches network requests and storage in a production build. Source: c15t's verify-consent guide (https://c15t.com/docs/guides/verify-consent.md), the hosted setup skill's §7, comparisons/build-your-own.md and the per-vendor verify sections, all `[c15t]`. The same journey as an automated test is [browser-ui-qa CONSENT-JOURNEY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/CONSENT-JOURNEY.md).

## What you are checking

[c15t]

1. Optional vendors make no requests before the visitor allows them.
2. A rejection survives a reload and a new tab.
3. The visitor can reopen preferences and change their mind.
4. The policy is right for each location you serve.

"Run the checks against `next build && next start`, `vite preview`, or your framework's equivalent. Dev servers load code differently and hide problems."

## Set up the browser

1. "Open a private window, so no earlier choice is stored."
2. "Open DevTools, select Network, and turn on **Disable cache** and **Preserve log**."
3. "List the vendors you expect, such as `posthog.com`, `googletagmanager.com`, `connect.facebook.net` or `youtube-nocookie.com`. You will filter by each."

"Before testing, list every place a vendor could load: `<script>` tags, framework analytics plugins, tag manager tags and embeds. c15t cannot hold back code it does not load. Remove duplicates first, or the results mean nothing." [c15t]

## The visitor flow

[c15t]

| Step | What to check |
|--|--|
| Load the page | The banner appears under an opt-in policy. Filter Network by each vendor domain; opt-in vendors show no requests. |
| Click Reject | The banner closes. Vendor domains still show no requests. |
| Reload | No banner. Still no vendor requests. DevTools Application shows a `c15t` cookie. |
| Open a new tab on the same site | Same result as the reload. |
| Open preferences from your footer link | The dialog opens with the categories you rejected turned off. |
| Allow one category and save | Only vendors in that category start loading. The others stay silent. |
| Turn that category off again | The page reloads, and the vendor does not load after the reload. |
| Navigate between pages without a full reload | Each vendor loads once, not once per navigation. |

- "By default, Google Tag and Google Tag Manager load before consent on purpose and send Consent Mode signals. For them, check that the consent state in the request parameters changes when the visitor chooses, not that requests are absent." [c15t]
- After each save, wait for the backend response (a successful `POST` to `/subjects`): "A closing banner does not prove a saved choice" [c15t, SKILL.md §7].

## Locations

"Test at least" [c15t]:

- "A location that needs a choice, such as Germany or the United Kingdom."
- "A location without a prompt, such as a US state without a privacy law in your rules."
- "A request with no location headers at all. c15t applies your policy's fallback for unknown locations; make sure that fallback is what you want."

Use a VPN, the host's geolocation preview, or the `country` option on the framework's server helper; "Remove test overrides before you deploy."

## Privacy signals

"Turn on Global Privacy Control in the browser. Brave and DuckDuckGo send it by default; in Firefox, enable it in Privacy settings. Reload and confirm the categories your policy restricts for GPC are denied, without the visitor having clicked anything. Turn GPC off and confirm the restriction ends." [c15t]

## A failed backend

[c15t] Make the request that initializes consent fail, then reload:

- "For a request the browser makes, block it in DevTools (right-click the request, then **Block request URL**)."
- "When the server resolves consent before the page loads, the browser never sees that request. Make it fail on the server instead, for example by pointing the backend URL at an unreachable address for one run."
- Expected: "No banner appears, and vendors that wait for consent send no requests." An always-loading helper such as `gtag` with its default `loadMode` still loads; "check that it reports denied consent. A missing banner must never mean 'allowed'. Then undo the change and confirm the page recovers."

## The interface

Keyboard only through banner and dialog, focus kept inside a modal dialog and returned to its opener, 375 px wide with long German labels, contrast and visible focus rings after theming [c15t]. Details are [BANNER-UI.md](BANNER-UI.md#keyboard-width-and-contrast).

## Per-vendor checks

- **Google Tag and Tag Manager:** the Tag Assistant checks (the `default` before `config` with the optional types denied, `window.dataLayer` undefined under `'after-consent'`, one page view per route change) are in [google-analytics CONSENT-MODE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md#verifying-it).
- **GTM:** after Reject and reload, "no non-Google tag in the container fires" [c15t, google-tag-manager.md].
- **Cleanup:** allow measurement, see `_ga` and `_ga_<id>` in Application, turn measurement off and save: "c15t reloads the page. Both cookies are gone", and they do not come back on reload [c15t, clear-on-revocation.md].
- **Network blocker:** before a choice, matching requests are absent and the console logs each blocked request [c15t, network-blocker.md].
- **CSP:** enforced, not report-only; no `Refused to` error that mentions a consent element, the backend or a vendor [c15t, content-security-policy.md].

## The vibe-coded banner check

"Check a fresh visit, a saved refusal, a later change of mind and a failed backend save. Also check navigation, policy changes and each vendor's behaviour. For example, a banner can save a refusal while a separate analytics script still runs." [c15t, comparisons/build-your-own.md]

## Record the result

"Write down the framework, the rendering mode, the policy you tested, and the requests you saw before and after consent. 'The banner appears' is not a test result." Reconcile what you saw with the inventory "and investigate any request you did not expect", and mark anything you could not access as unverified [c15t, SKILL.md §7].

## Prove it

The written record names the framework, rendering mode and policy, lists the requests before and after consent for every vendor in the inventory, covers the eight visitor-flow steps, three locations, GPC on and off, and a failed init with recovery, and shows a successful backend save after each choice; any step not run is marked unverified.
