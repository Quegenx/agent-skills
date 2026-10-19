# Consent Mode

The Google side of consent: the consent commands gtag and Tag Manager understand, the default every page must send, waiting for a banner that loads late, URL passthrough, basic versus advanced mode, consent settings for tags in a container, and how to verify it. Google's rules are from its consent mode guide (https://developers.google.com/tag-platform/security/guides/consent) and overview (https://developers.google.com/tag-platform/security/concepts/consent-mode); container and verification notes are from c15t's Google tag and Tag Manager docs (Apache-2.0). The banner itself, consent categories, policies by region and gating other vendors' scripts are [cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md).

## The owner's design

The owner's website runs advanced mode with ads always denied: "The analytics tag loads only when the site has one configured, in consent mode: its script loads `async` before the bootstrap; analytics storage is denied by default and granted from the first page view only if the visitor already accepted (read from storage in the head script), and updated the moment they choose in the banner. ... The ad consents (ad storage, ad user data, ad personalization) stay denied always" ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md#consent-and-analytics); code in `site-document.tsx` and [google-analytics.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/shared/site/google-analytics.ts)). It already sends all four parameters in the default, before `config`. Nothing below changes it.

## The default, on every page

"Call the `gtag('consent', 'default', ...)` command on every page of your site before any commands that send measurement data (such as `config` or `event`)." Google's example denies all four ad and analytics parameters (https://developers.google.com/tag-platform/security/guides/consent):

```javascript
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied'
});
```

Then `gtag('consent', 'update', {...})` with the parameters the visitor granted, the moment they choose. The marketingskills source's example set only `analytics_storage` and `ad_storage` in both the default and the update [coreyhaines31/marketingskills, analytics]; use the four-parameter form above.

The consent types and the c15t category each maps to (the type names match Google's list, e.g. "ad_user_data: Sets consent for sending user data to Google for online advertising purposes") [c15t]:

| Consent type | c15t category |
|---|---|
| `security_storage` | `necessary` |
| `functionality_storage` | `functionality` |
| `analytics_storage` | `measurement` |
| `ad_storage`, `ad_user_data`, `ad_personalization` | `marketing` |
| `personalization_storage` | `experience` |

## A banner that loads late, and URL passthrough

From Google's guide (https://developers.google.com/tag-platform/security/guides/consent):
- "If your banner loads asynchronously, it might not always run before your Google tags." Add `wait_for_update` with a millisecond value to the default; Google's example gives the consent tool 500 milliseconds to call `update` before tags fire.
- **URL passthrough:** `gtag('set', 'url_passthrough', true);` in the default snippet before any `config`. Links may then carry `gclid`, `dclid`, `gclsrc`, `_gl` and `wbraid` as users move through the site.
- **When `ad_storage` is denied,** "new cookies won't be set for advertising purposes", and third-party cookies on google.com and doubleclick.net "won't be used except for spam and fraud purposes"; data sent "will still include the full page URL, including any ad click information in the URL parameters." `ads_data_redaction` can be set with `gtag('set', ...)`.
- In Tag Manager custom templates, the APIs are `setDefaultConsentState` and `updateConsentState`.

## Basic and advanced mode

From Google's overview (https://developers.google.com/tag-platform/security/concepts/consent-mode):
- **Advanced:** "Google tags load when a user opens the website or app"; while consent is denied they send "measurements without cookies", and the mode "provides an advertiser-specific model as opposed to a general model". The owner's website is advanced mode.
- **Basic:** you "prevent Google tags from loading until a user interacts with a consent banner"; if the user doesn't consent, "no data is transferred to Google at all - not even the consent status", and "Consent mode's conversion modeling in Ads is then based on a general model."

c15t's helper calls these `loadMode: 'always'` (sends the `default` before `config` and loads gtag.js before a choice) and `loadMode: 'after-consent'` (creates no `dataLayer` and sends nothing until allowed) [c15t]. c15t says that with after-consent "visitors whose category is denied send nothing, so Google has no data to model them from"; per Google, basic mode loses the advertiser-specific model, not all modeling. Choosing between them is a requirement question (may vendors load with denied defaults before consent, or must nothing be requested before opt-in); that decision and the loaders live in [cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md).

## Tag Manager

- The source's steps [coreyhaines31/marketingskills, analytics]: enable Consent Overview in Admin, configure consent for each tag; Google tags respect the consent state.
- "Tags in the container that are not from Google ignore these signals, unless you add consent checks in GTM... For each non-Google tag, add a consent requirement in the tag's consent settings, or fire it from a Custom Event trigger on `consent-update`. If a vendor must make no request before consent, remove it from the container." [c15t] The source's "Tags respect consent state automatically" holds only for Google tags.
- With after-consent loading, "no `consent-update` event fires for that choice. Triggers that wait only for `consent-update` first fire on a later change." [c15t]

## Verifying it

- In Tag Assistant, "the `consent` `default` command comes before `config`, with `analytics_storage` and `ad_storage` set to `denied`"; with after-consent, "`window.dataLayer` is `undefined` in the Console" until the visitor allows measurement [c15t].
- "With client-side navigation, check that each route change sends one page view. A separate router integration that also sends `page_view` doubles the count." [c15t] GA4's own `page_view` already listens for history changes (https://support.google.com/analytics/answer/9216061).
- DebugView shows nothing for a visitor who has not given consent for Analytics cookies (https://support.google.com/analytics/answer/7201382), so test the granted path in DebugView and the denied path in the network panel.
- The full consent journey (reject, reload, change of mind, failed backend) is the cookie-consent skill's verification.

## Prove it

On a fresh visit Tag Assistant shows the consent `default` with all four ad and analytics parameters before any `config` or `event`, on every page type; granting analytics sends one `update` and events then appear in DebugView; ad parameters stay as designed after any choice; each non-Google tag in the container has a consent requirement or is gone; and one route change sends exactly one `page_view`.
