# Script gating

Consent holds back code only when the consent manager owns its loader. Each optional tool gets one loading path, its events keep flowing only while allowed, and a withdrawal stops it and cleans what it wrote. Source: c15t's hosted setup skill (https://c15t.com/SKILL.md §2, §6), https://c15t.com/docs/integrations/overview.md, the React scripts, network-blocker and clear-on-revocation pages under https://c15t.com/docs/frameworks/react/, and the Google Tag, Google Tag Manager and PostHog integration pages, plus Google's Consent Mode overview where cited. Categories are [CATEGORIES-AND-POLICIES.md](CATEGORIES-AND-POLICIES.md).

**Contents:** [Inventory before installing](#inventory-before-installing) · [One loader per vendor](#one-loader-per-vendor) · [Framework vendor packages](#framework-vendor-packages) · [Picking the mechanism](#picking-the-mechanism) · [Loading behaviour per helper](#loading-behaviour-per-helper) · [Keep the product's events](#keep-the-products-events) · [Withdrawal stops the tool](#withdrawal-stops-the-tool) · [The network blocker](#the-network-blocker) · [Iframes and plain HTML](#iframes-and-plain-html) · [Clear on revocation](#clear-on-revocation) · [Google Consent Mode and tag managers](#google-consent-mode-and-tag-managers) · [PostHog](#posthog) · [Naming](#naming) · [Prove it](#prove-it)

## Inventory before installing

[c15t, SKILL.md §2] Do this before installing anything:

- "A homegrown banner counts as a consent manager: a component or script that shows a choice, stores it (cookie or localStorage) and checks it before tracking."
- Search "dependencies, imports, root layouts and document heads, inline scripts, framework plugins, environment variable names, vendor domains and IDs, iframes and embeds, and tag-manager containers. Include first-party tracking such as a fetch to an app-owned metrics endpoint."
- Record per tool: every file that loads or initializes it, every file that sends events through it, its IDs and purpose, and "whether the current code gates it on consent, and how".
- Read the site's own requirements and "Write down whether vendors may load with denied defaults before consent or must send no requests at all before opt-in. If nothing says, ask."
- "Server-side tracking and forwarding are outside the browser consent boundary; list them separately." [c15t, SKILL.md §6]

## One loader per vendor

- "Remove the vendor's own snippet, tracking image, framework plugin or tag manager entry before adding its helper. c15t cannot gate a copy it did not load. Tag managers and data pipelines such as Segment can load further destinations, which need consent settings of their own." [c15t, integrations/overview.md]
- "Wrapping an old loader in a consent check is not a migration: it misses withdrawal and leaves two loading paths. Consent checks can still guard event calls." [c15t, SKILL.md §6.3]
- Where analytics loads before a choice, look for: a `<script>` tag in HTML, layout or `_document`; a framework package or plugin "such as `@next/third-parties`, `@nuxt/scripts`, `nuxt-gtag` or a Vercel or Netlify analytics toggle"; a tag in Google Tag Manager that fires on page view; an embed rendered without `ConsentGate` [c15t, troubleshooting.md].
- Search again per tool for "its ID, domain, global (`gtag`, `fbq`, `posthog`) and old loader. Every remaining match must have a stated role. Keep one loading path per tool." Remove vendor packages once nothing imports them: "a leftover dependency invites someone to load the vendor again." [c15t, SKILL.md §6.7]

## Framework vendor packages

"`@next/third-parties`, `@nuxt/scripts`, `nuxt-gtag`, `vue-gtag`, `react-ga4`, Gatsby and Astro analytics plugins" load the vendor outside the consent manager [c15t, SKILL.md §6.3]:

| Export | Replace with |
| --- | --- |
| `GoogleAnalytics` (`@next/third-parties`), `useScriptGoogleAnalytics` (`@nuxt/scripts`), the `nuxt-gtag` module | The `gtag` helper, or a custom c15t script when the site forbids requests before opt-in |
| `GoogleTagManager`, `useScriptGoogleTagManager` | The `googleTagManager` helper, or a custom c15t script under the same rule |
| `useScriptTriggerConsent` and other consent triggers | Nothing: c15t decides when the script loads. A second consent trigger keeps a second source of truth. |
| `sendGAEvent`, `sendGTMEvent`, `useGtag().gtag`, a registry script's `proxy` | Calls to the `gtag`, `dataLayer` or vendor global that c15t loads. `sendGAEvent` drops events with a console warning once `GoogleAnalytics` is gone. |
| `YouTubeEmbed`, `GoogleMapsEmbed`, `ScriptYouTubePlayer`, `ScriptGoogleMaps` | The YouTube or Google Maps guide: your own iframe inside the framework's consent gate |

"Keep the measurement ID, container ID and `dataLayer` name the old code used." `next/script` with `beforeInteractive` runs before any provider can block it: [react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#nextscript).

## Picking the mechanism

[c15t, SKILL.md §6.2]

- A helper exists and its loading behaviour meets the site's requirement for requests before opt-in: use it.
- "The helper loads before a choice (for example 'Always loads; signals Google consent') and the site forbids requests before opt-in → do not use it silently. Use the documented gated alternative if the guide gives one; otherwise register a custom script with a c15t category that waits for consent, and tell the user which vendor features that loses (such as consent-mode modeling)."
- An embed or iframe: the consent-gated component. No helper: a custom script or a gate on the consent hook, with a category chosen by purpose.

## Loading behaviour per helper

"Most wait for the category to be allowed. A few load on every page and pass the permission to the vendor's own consent API, so the browser contacts the vendor before a choice." [c15t, integrations/overview.md] The behaviour classes, verbatim:

| Behaviour | Examples |
|--|--|
| Waits for effective permission | Segment, Hotjar, Plausible, Fathom, LinkedIn Insight Tag, Vercel Analytics, chat widgets |
| Gated initially; keeps the SDK and signals consent | Meta Pixel, TikTok Pixel, OpenAI Pixel; Pinterest Tag "keeps the tag" |
| Always loads; calls opt-in and opt-out APIs | Mixpanel |
| Always loads; signals ad storage consent | Microsoft UET |
| Always loads and signals Google consent by default; `loadMode: 'after-consent'` waits for permission | Google Tag, Google Tag Manager |
| Configurable; defaults to always loading and calling opt-in and opt-out APIs | PostHog |
| Configurable; defaults to always loading and loads Replay after permission | Sentry |

"A category on a script does not always mean zero requests." [c15t, frameworks/react/scripts.md]

## Keep the product's events

- "Keep vendor IDs, settings, event names and payloads. Point each event caller at the loader c15t owns, and make sure the call is a no-op or queued by the vendor's own documented queue while consent is missing. Never add a queue that replays events collected without consent, replace tracking with empty functions, or keep a second SDK bootstrap to preserve an event API. Check for module-level SDK calls that run before consent is known." [c15t, SKILL.md §6.4]
- Guard your own calls: "The `posthog` global exists before the SDK loads, so its presence does not mean measurement is allowed" [c15t, integrations/posthog.md]:

```ts
export function trackSignupStarted(measurementAllowed: boolean) {
	if (!measurementAllowed) return;
	window.posthog?.capture('signup_started');
}
```

- The event dispatcher (`useEventDispatcher()` in React) sends a named event "to every registered integration that has an event API and is allowed right now. It drops events while measurement is denied"; "It reads consent when an event goes out, so an event sent right after a visitor withdraws consent is dropped." `pageview` sends only to integrations named in `pageviews`; "The first call records the path without sending, and repeated paths or hash-only changes are skipped." Every dispatcher on one provider shares one pageview history [c15t, integrations/overview.md].

## Withdrawal stops the tool

- "Follow the guide's revocation behavior (opt-out API, reload, or unload). A one-time gate at startup is not enough." [c15t, SKILL.md §6.5]
- "Denied later. The provider removes the script element. Code that already ran keeps running, so after the visitor turns off a category they had allowed, the provider reloads the page once the save finishes. Set `reloadOnConsentRevoked: false` only if every gated vendor stops itself." [c15t, frameworks/react/scripts.md]
- Switching off one vendor inside an allowed category: c15t "does not load that vendor's script. Helpers that load on every page, such as Google Tag Manager, Microsoft UET and Mixpanel, still load and send the vendor a denied signal instead." [c15t, integrations/overview.md]

## The network blocker

For SDKs already on the page that send their own beacons [c15t, frameworks/react/network-blocker.md]:

- Rules name a `domain` (subdomains included), the `category` it needs, and optionally `pathIncludes`, `methods` and `vendor`. "Load vendor SDKs through `scripts` instead of a `<script>` tag or `next/script`, so they wait for consent before they run at all."
- "The blocker wraps `window.fetch` and `XMLHttpRequest`. A blocked `fetch` resolves to a `451` response with the status text `Request blocked by consent`, and nothing is sent. A blocked XHR is aborted and fires an `error` event."
- While consent is unknown, a matching request waits; if the policy fails to load, waiting requests are blocked.
- It cannot stop: code that runs before the provider renders ("inline scripts in the HTML, third-party tags in `<head>`, scripts loaded before hydration (such as `next/script` with `beforeInteractive`), and client modules that evaluate earlier"); code that saved its own `fetch` or `XMLHttpRequest` reference; "`navigator.sendBeacon`, `WebSocket`, `EventSource`, and requests made by `<img>`, `<script>` or `<iframe>` elements, web workers and service workers".
- Bundlers differ: "Webpack builds evaluate a route's client component modules when its chunk loads, so their top-level code runs first. Turbopack evaluates a client component module when its first element renders, which inside the provider is after blocking starts."
- "Send them from an effect or an event handler, never at module top level"; check the category before calling a vendor from your own code, "and treat the blocker as a backstop."

## Iframes and plain HTML

- "Write gated iframes with `data-src`, not `src`. The browser requests a `src` as soon as the iframe is in the document, before the blocker can pause it, whether the iframe comes from the server HTML or a client render." [c15t, consent-categories.md]
- A YouTube player inside `ConsentGate` uses `https://www.youtube-nocookie.com` [c15t, frameworks/react/content-security-policy.md].
- On a plain HTML page, keep the vendor's own snippet inert until allowed [c15t, integrations/google-tag.md]:

```html
<script type="text/plain" data-c15t-category="measurement">
  // The vendor's snippet, unchanged
</script>
```

## Clear on revocation

"Gating stops new requests, but it leaves the cookies and storage keys a vendor already wrote." [c15t, frameworks/react/clear-on-revocation.md]

```tsx
import type { ClearOnRevocationConfig } from 'c15t';

const clearOnRevocation: ClearOnRevocationConfig = {
  measurement: { cookies: ['_ga', '_ga_*'], localStorage: ['analytics:*'] },
  marketing: { cookies: ['_fbp'], sessionStorage: ['campaign-id'] },
};
```

- "Use an exact name, or a prefix followed by `*`. `_ga_*` matches `_ga_ABC123` but not `_ga`, so list both. Regular expressions, a `*` anywhere but the end, and a bare `*` are not supported."
- It runs on the first page load after the policy resolves, for every denied category, and whenever a category goes from allowed to denied (saved refusal, expiry, policy change, GPC). "Switching off one vendor inside an allowed category deletes nothing, because the category stays allowed."
- Limits: "It cannot delete `HttpOnly` cookies or another origin's data; expire those from your server. A vendor SDK still running on the page can write its cookies again, which is one reason c15t reloads the page after a revocation."

## Google Consent Mode and tag managers

[c15t, integrations/google-tag.md, google-tag-manager.md] The loader side; the Google side is [google-analytics CONSENT-MODE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md). In both modes the helper sends `gtag('consent', 'default', ...)` before `config` and an `update` on each change:

| `loadMode` | Until the category is allowed | After the category is allowed |
|--|--|--|
| `'always'` (default) | Loads `gtag/js` and sends `consent` `default` with the current permissions, then `config`. | Sends `consent` `update` with the mapped types granted. |
| `'after-consent'` | Sends nothing to Google. The helper creates no `dataLayer` or `gtag` function. | Loads `gtag/js` once. `consent` `default` carries the current permissions and comes before `config`. Later changes send `update`. |

- `'always'` is what Google calls advanced mode and `'after-consent'` basic mode; Google's definitions, the modeling tradeoff (basic mode loses the advertiser-specific model, not all modeling, which c15t's pages overstate), the late-banner `wait_for_update` and consent settings for tags in a GTM container are in [google-analytics CONSENT-MODE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md#basic-and-advanced-mode).
- "`'after-consent'` waits for the category to be allowed, not for a recorded choice." Under `opt-out` or `none`, `gtag/js` loads on the first page; "`category: 'necessary'` loads `gtag/js` before a choice in either mode." [c15t]
- If the site forbids requests to Google before opt-in, do not keep the default silently: set `loadMode: 'after-consent'` and tell the owner which Consent Mode features that gives up [c15t, SKILL.md §6.2].
- A GTM container's non-Google tags ignore Consent Mode signals; "If a vendor must make no request before consent, remove it from the container and register its own c15t helper instead." [c15t, google-tag-manager.md]
- The landing page's design is advanced mode: "analytics storage is denied by default and granted from the first page view only if the visitor already accepted ... The ad consents (ad storage, ad user data, ad personalization) stay denied always." [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md#consent-and-analytics)

## PostHog

Two views on whether to gate the SDK, both kept:

- The posthog skill: "**Always load posthog-js; don't gate the snippet behind consent.**" so it can count visitors who ignore the banner [posthog PROXY-AND-PRIVACY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/PROXY-AND-PRIVACY.md). c15t's helper default `loadMode: 'always'` matches it: it loads `array.js` and calls `opt_out_capturing` until measurement is allowed [c15t, integrations/posthog.md].
- c15t's quickstarts use `loadMode: 'after-consent'` with `cookieless_mode: 'never'`: "Set `cookieless_mode: 'never'`, as in the example, if a refusal must stop capture." With the helper's default `cookieless_mode: 'on_reject'`, "PostHog keeps capturing without cookies after a refusal. That mode needs cookieless server hashing turned on" [c15t, integrations/posthog.md].
- Choose by the inventory's answer: may vendors load with denied defaults before consent, or must they send no requests before opt-in [c15t, SKILL.md §6.2].
- An app that already initializes `posthog-js` keeps it and registers a callback-only script; init the SDK with `opt_out_capturing_by_default: true` and `cookieless_mode: 'never'` [c15t, integrations/posthog.md]:

```ts
import type { Script, ScriptCallbackInfo } from 'c15t/modules/script-loader';

type PostHogConsentApi = {
	opt_in_capturing: () => unknown;
	opt_out_capturing: () => unknown;
};

export function posthogConsent(instance: PostHogConsentApi): Script {
	const sync = ({ hasConsent }: ScriptCallbackInfo) => {
		if (hasConsent) instance.opt_in_capturing();
		else instance.opt_out_capturing();
	};

	return {
		id: 'posthog-sdk-consent',
		category: 'measurement',
		callbackOnly: true,
		alwaysLoad: true,
		onBeforeLoad: sync,
		onConsentChange: sync,
	};
}
```

  "This does not delay the SDK import or its first request. `loadMode: 'disabled'` is not a substitute, because it syncs nothing."

## Naming

"Name consent code for consent (`ConsentProvider`), vendor configuration for the vendor, and event functions for the product action (`trackSignup`). Do not prefix app code with `C15T`, and avoid names like `ConsentAwareAnalytics` or `AnalyticsV2`. Keep exported names other code depends on." [c15t, SKILL.md §6]

## Prove it

For each tool in the inventory, a search for its ID, domain, global and old loader finds only the one path the consent manager owns; framework vendor packages are gone from `package.json`; before a choice under opt-in, its domain is absent from the Network panel (or, for an always-loading helper, the consent signal it receives is denied); its event calls fire once per action after consent and not before; turning its category off reloads the page, the tool stays absent and the cookies listed for it are gone; gated iframes carry `data-src`; and every GTM tag that is not from Google has a consent requirement.
