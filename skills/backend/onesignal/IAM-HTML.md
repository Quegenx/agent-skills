# HTML in-app messages

An HTML IAM is a full HTML document that runs in a sandboxed WebView inside the app, and its interactive actions go through the `OneSignalIamApi` methods. In that sandbox, plain links and `window.open()` are not tracked and may not navigate, Liquid does not reach `<script>`, and the runtime may inject the HTML after `DOMContentLoaded` has fired. Every HTML IAM should be anchored to a known use case and a primary CTA that maps to a `OneSignalIamApi` method; without both, do not generate HTML. Triggers, audience and testing are in [IN-APP-MESSAGES.md](IN-APP-MESSAGES.md); Liquid rules in [PERSONALIZATION.md](PERSONALIZATION.md).

**Contents:** [Requirements](#requirements) · [The OneSignalIamApi bridge](#the-onesignaliamapi-bridge) · [Click handling](#click-handling) · [Liquid in HTML](#liquid-in-html) · [Mobile rendering](#mobile-rendering) · [Defaults when brand context is missing](#defaults-when-brand-context-is-missing) · [HTML templates](#html-templates) · [Composing an IAM for someone](#composing-an-iam-for-someone) · [In OneSignal's dashboard composer](#in-onesignals-dashboard-composer) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## Requirements

- **SDK:** the HTML editor requires iOS 3.9.0+ and Android 4.6.3+. Older SDKs fall back to Center Modal, so the design must degrade gracefully.
- **Internet:** IAMs need a connection; no offline display.

## The OneSignalIamApi bridge

The vendor composer skill allows only these methods for interactivity and says never to invent others. The docs point to the Mobile SDK Reference for SDK methods that set triggers, handle in-app click events or manage the in-app lifecycle.

```
OneSignalIamApi.openUrl(e, url)                 // open an external URL or deep link; closes the IAM
OneSignalIamApi.triggerPushPrompt(e)            // show the native push permission prompt
OneSignalIamApi.triggerLocationPrompt(e)        // show the native location permission prompt
OneSignalIamApi.tagUser(e, { key: "value" })    // tag the user for segmentation
OneSignalIamApi.sendOutcome(e, "outcome_name")  // record an unattributed custom outcome
OneSignalIamApi.addClickName(e, "click_name")   // set a click identifier readable by the mobile SDK click listener
OneSignalIamApi.trackClick(e)                   // manually track a click; required before any custom navigation
OneSignalIamApi.close(e)                        // dismiss the IAM
```

- **`openUrl` opens the browser and closes the IAM;** the API page says it supports deep linking. The click-actions page says to use a Custom action ID (`addClickName`) for in-app deep links instead. Confirm in the current docs and test on a device.
- **Map intent to method:** "open/navigate/view" to `openUrl`; "subscribe/enable/allow" to `triggerPushPrompt` or `triggerLocationPrompt` depending on context; "tag/save preference" to `tagUser`; "claim/record/track" to `sendOutcome`; "dismiss/close" to `close`.

## Click handling

- **Every clickable element needs a unique `data-onesignal-unique-label`:** CTAs, secondary buttons, close and icon controls, anything with a click listener. Duplicates mis-log clicks or break actions. Use short kebab-case values (`allow-notifications`, `maybe-later`, `close`, `claim-offer`). Never use the attribute name itself as the value, and do not namespace verbosely (`myapp-onboarding-step-1-next`) when `next-1` is unique.
- **Prefer `<button>` over `<a>`.** `<a href>`, `<a target>` and `window.open()` are not tracked, may not navigate in the sandbox, and can log `SOAuthorizationCoordinator::tryAuthorize (2): Attempting to perform subframe navigation.` Use `OneSignalIamApi.openUrl`.
- **"Always call `OneSignalIamApi.trackClick(e)` before `openUrl()` or any other OneSignal API method."**
- **Attach listeners explicitly.**

The docs example (HTML IAM):

```html
<button id="shop-now" data-onesignal-unique-label="your-unique-label-for-this-button">
  Shop Now
</button>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    const btn = document.getElementById("shop-now");
    btn.addEventListener("click", function(e) {
      OneSignalIamApi.trackClick(e);
      OneSignalIamApi.openUrl(e, "https://shop.example.com/");
    });
  });
</script>
```

- **When to bind (the sources disagree):** the docs say "Bind event listeners after DOMContentLoaded to ensure that the elements exist," as in the example above, and do not mention `readyState`. The vendor composer skill warns that the IAM runtime may inject HTML after the host page's `DOMContentLoaded` has already fired, so a bare `document.addEventListener('DOMContentLoaded', init)` can silently never run; it says to use a `readyState` check, or to place the script at the end of `<body>` and call init directly. Confirm in the current docs and test on a device. The vendor's form:

```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

## Liquid in HTML

- **Liquid works in** inline element text, `<style>` blocks, and the attributes `href`, `src`, `<form action>` and `<object data>`.
- **Liquid does not substitute inside `<script>`** or ambiguous nested content. In JS, read the global `liquidPlayerTags` object: it is available after `DOMContentLoaded`, and only if the IAM contains at least one Liquid tag in a supported field. Or put the tag into an `href` and pass `e.currentTarget.href` to `openUrl`.
- **IAMs support only Tag substitution;** see [PERSONALIZATION.md](PERSONALIZATION.md).
- **Every variable needs a default filter:** `{{ first_name | default: 'there' }}`.
- **Personalization is opt-in.** Add Liquid only if the user asked for it, the prompt references a tag (for example "greet them by name"), or the user approved it in the summary.

## Mobile rendering

- **Safe areas:** `var(--safe-area-inset-top)`, `--safe-area-inset-right`, `--safe-area-inset-bottom`, `--safe-area-inset-left`.
- **Explicit light and dark colors** with `@media (prefers-color-scheme: dark)`; never rely on system defaults.
- **Responsive CSS** with media queries, right at common mobile widths.
- **iOS dynamic type:** `:root { font: -apple-system-body; }` where appropriate.
- **Payload:** inline critical CSS, avoid large or heavy base64, `font-display: swap` for web fonts.
- **Autoplay video only muted:** embed with `<iframe>` using `/embed/VIDEO_ID` and `&mute=1`, with `allow="autoplay; encrypted-media"`; keep videos short.
- **Language variants** each have a 1 MB size limit.

## Defaults when brand context is missing

- **Layout:** center modal, about **320 to 360 px** content width, vertical stack.
- **Font:** system stack `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Colors:** white background in light mode, `#1c1c1e` in dark mode, one accent color on the primary CTA.
- **Controls:** a primary CTA plus a dismiss control; generous padding; safe-area insets.
- **Accessibility:** text contrast at least **4.5:1**, touch targets at least **44 px**, descriptive button labels.

## HTML templates

- **Copy and paste templates:** email form, phone/SMS form (E.164 and consent), checklist survey, countdown, promo wheel, quiz, ranking survey, audio player, vertical swiping.
- **"Do not put secrets (API keys, tokens) in template code. Treat all in-app message input as untrusted and validate it in your app or backend."**
- **Email and SMS forms:** calling the Create User API from the HTML does not attach the address to a `login` user. Passing the value through `addClickName`, the SDK click listener, then `addEmail`/`addSms` does (see [USER-MODEL.md](USER-MODEL.md)).
- **Promo wheel:** replace hardcoded codes with server-generated codes.

## Composing an IAM for someone

- **Use case from keywords:** permission/opt-in/push to Soft Push Permission Prompt; new feature/announce/introducing to Feature Announcement; welcome/setup/getting started to Onboarding; promo/sale/deal/bonus to Promo; rate/review to Rating; subscribe/newsletter to Capture.
- **Soft defaults, never block on them:** goal (push prompt to opt-in, announcement to adoption, onboarding to activation), brand (neutral center modal), copy (written for them), layout and constraints.
- **Ask only what blocks the build:** the use case and the primary action (open a link or deep link, trigger the push prompt, tag the user, record a custom outcome). Never ask about brand colors, fonts, tone, copy direction, goal, layout, dismiss presence or dark mode. Exception: one question for a website URL when a brand tool is available, or for brand colors when it is not.
- **At most one or two quality-lifting follow-ups:** soft push (the concrete value of opting in; "Maybe later" or a single dismiss); announcement (which benefit leads; where the CTA goes; which audience); onboarding (which step, a progress indicator, the next step); promo (the concrete offer; urgency, only when true: [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md); universal or personalized); rating (what earned the prompt; a feedback branch or dismiss); personalization (propose 1 or 2 concrete Liquid options).
- **Brand source precedence:** the user's request, then existing campaign or IAM context, then the Brand Kit, then user-provided colors or description, then the neutral defaults (surfaced in the summary).
- **Summary before HTML:** type, goal, CTA mapped to its method; brand source, confidence and key styles; copy direction with a sample headline; Liquid variables and their defaults; filled-in defaults. Wait for explicit approval ("looks good", "generate it"); on a revision, summarize what changed.
- **Every edit regenerates the full document.**
- **Self-check before output:** unique labels on every clickable element; every interaction is a real bridge method, with `trackClick(e)` before `openUrl()`; the readyState-safe init (the vendor skill's check; the docs bind on `DOMContentLoaded`).
- **Example outcome call** (promo claim): `OneSignalIamApi.sendOutcome(e, "claimed_bonus")`.

## In OneSignal's dashboard composer

These apply only when the agent runs inside OneSignal's own dashboard AI, which provides `ask_user`, `apply_to_iam_composer`, `generate_brand_kit_from_website` and `suggest_reply_to_user`.

- **Questions:** one `ask_user` call per request, 1 to 3 question blocks of up to 4 options (2 to 5 word label, optional one-line description). The built-in "Something else" free text (`allow_free_text: true` by default) covers custom answers; never spend a slot on "Type your answer" or "Other". `allow_multiple: true` for multi-select; optional `title` and `subtitle`. No second round unless the task changes. No `suggest_reply_to_user` in the same turn.
- **Palettes for the blocking questions:** use case: Soft Push Permission Prompt, Feature Announcement, Multi-Step Onboarding, Promo or Sale (Rating, Capture and others come through free text). Action: open a link or deep link (`openUrl`), trigger the push permission prompt (`triggerPushPrompt`), tag the user (`tagUser`), record a custom outcome (`sendOutcome`); `triggerLocationPrompt` and `close` come through free text or inference.
- **Brand Kit:** `generate_brand_kit_from_website` takes `{ "url": "https://..." }` (feature-flagged) and returns `{ suggestions, current }`. Prefer `current` (the saved Brand Kit) when populated, else `suggestions` (colors, fonts, logos, tone sliders). It saves nothing. Never call `save_brand_kit` (it replaces the whole Brand Kit); send users to Brand Kit settings.
- **Apply:** after approval, show the complete HTML in exactly one fenced `html` block first, then call `apply_to_iam_composer` with `{ "html": "<!DOCTYPE html>..." }`. `html` is the only field and the button label is fixed ("Apply to editor"). The content replaces the active editor. One apply per response; there is no diff tool.
- **Never claim the IAM is applied, saved or published;** nothing is published. Never print the JSON payload or re-print the HTML after the call. No prose alongside the HTML unless asked.
- **The apply tool exists only while the IAM composer is open** (`iam_composer` UI target). Without it, show the code block and tell the user to open the in-app message HTML editor.

## Anti-patterns

- Generating HTML with no known use case or no primary CTA mapped to a bridge method; "anything" HTML.
- `<a href>`, `<a target>` or `window.open()` for navigation.
- `openUrl()` without `trackClick(e)` first.
- Missing or duplicate `data-onesignal-unique-label` values, or the attribute name used as its value.
- A bare `DOMContentLoaded` listener with no readyState check (the vendor skill's warning; the docs example binds this way).
- Liquid inside `<script>`; Liquid variables without a default filter; Liquid the user did not ask for.
- Relying on system colors instead of explicit light and dark colors.
- Secrets in template code; trusting IAM form input without validation in the app or backend.
- Hardcoded promo codes.

## Prove it

- **Static check of the HTML:** every element with a click listener has a `data-onesignal-unique-label`, and no two values repeat.
- **Every `openUrl` call** is preceded by `trackClick(e)` in the same handler, and the HTML contains no `<a target>` or `window.open(`.
- **No `{{` inside `<script>`;** script reads personalization from `liquidPlayerTags`, and every `{{ }}` has a `default` filter.
- **On a device:** the IAM renders in light and dark mode, buttons respond (so init ran), clicks from a real (not test) send show in IAM reports, and the safe-area insets are respected.
- **Old SDK:** on Android below 4.6.3 the message falls back to Center Modal and still reads correctly.
- **Form templates:** a submitted email or phone number lands on the logged-in user (through `addEmail`/`addSms`), not a separate one.
