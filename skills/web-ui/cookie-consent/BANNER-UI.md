# Banner UI

The banner shows the actions the visitor's policy allows, in a shape that suits the region, without hiding the page more than the policy needs. Source: c15t's ConsentBanner page (https://c15t.com/docs/frameworks/react/components/consent-banner.md), motion page (https://c15t.com/docs/customization/motion.md), Content Security Policy page (https://c15t.com/docs/frameworks/react/content-security-policy.md), verify-consent.md and banner-experiments.md, all `[c15t]`. Focus rules in general are [web-accessibility FOCUS-AND-KEYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md); motion in general is [ui-animation SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/ui-animation/SKILL.md).

**Contents:** [What each prompt shows](#what-each-prompt-shows) · [Equal prominence](#equal-prominence) · [Variants and positions](#variants-and-positions) · [Blocking and non-blocking](#blocking-and-non-blocking) · [Motion](#motion) · [Keyboard, width and contrast](#keyboard-width-and-contrast) · [Content Security Policy](#content-security-policy) · [Banner experiments](#banner-experiments) · [Where the landing page differs](#where-the-landing-page-differs) · [Prove it](#prove-it)

## What each prompt shows

[c15t, consent-banner.md]

- "A `choice` prompt shows the actions the rule allows: reject and accept at equal prominence, plus customize when the rule offers it."
- "A `notice` prompt shows an 'OK' button and a button styled as underlined text, labeled 'Do not sell or share my data'. The latter opens preferences. A notice never traps focus or locks scroll."
- "A rule with `prompt: 'none'` renders nothing." An opt-out rule with no prompt "still has rights, so the preference center and the dialog trigger stay available as the route to preferences."
- "Acknowledging a notice records its dismissal. It does not record consent or change category permissions, including existing denials and privacy-signal restrictions."
- The extra preference buttons are "button elements that open the preference center; CSS gives them an underlined text appearance. They do not submit an opt-out by themselves." A choice prompt without Customize renders a "Manage preferences" button.
- "Configure your legal links and keep preferences reachable after the banner closes."

## Equal prominence

- "Accept and Reject keep equivalent default prominence." Layouts that omit a required action get it back: "Required actions omitted from a layout are restored." [c15t, consent-banner.md]
- One brand color can make "whichever action is primary use a filled button through the provider's theme" (`consentActions: { primary: { variant: 'primary', mode: 'filled' } }`); the stock default makes Customize primary on a choice banner and OK primary on a notice [c15t].
- An experiment arm that "makes accept primary while reject stays neutral" trips `equivalent-prominence-overridden` and is not shown under that policy unless `acknowledgeDiagnostics: true`; "You own the legal review of that arm; c15t records that you made it." [c15t, banner-experiments.md]

## Variants and positions

[c15t, consent-banner.md]

| Variant | Shape | Positions | Default |
|--|--|--|--|
| `floating` | A card in a corner or centered on an edge; the default for every prompt | `bottom-left`, `bottom-right`, `top-left`, `top-right`, `bottom-center`, `top-center` | `bottom-left` |
| `bar` | Full width; "From 1024px wide the text, the right links, and the controls share one row" | `top`, `bottom` | `bottom` |
| `widget` | A compact card with smaller type; "Pair it with a short notice" | `bottom-left`, `bottom-right`, `top-left`, `top-right` | `bottom-right` |
| `wall` | A centered card over a backdrop that blocks the page; "always blocking" | `center` | `center` |

"A default corner mirrors left and right for right-to-left languages. A position you set is never mirrored."

## Blocking and non-blocking

- "`blocking` controls the backdrop, scroll lock, and focus trap together" [c15t].
- "Blocking banners carry `role="dialog"` and `aria-modal="true"`. Non-blocking banners leave page controls usable by keyboard and pointer." "Notices always stay non-blocking." [c15t]
- A fixed non-blocking banner can cover the focused element; the scroll-padding rule is [web-accessibility FOCUS-AND-KEYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md#focus-not-obscured).

## Motion

[c15t, motion.md]

- "The banner never slides in. When it shows with the page, it is part of the first paint and appears on its first frame. When it arrives more than 100ms after the page first painted, such as after a slow script or a client-side init, it fades in over `--c15t-duration-normal` instead, and its root and backdrop carry `data-entry="late"`. A banner rendered on the server always shows at once."
- Tokens: `--c15t-duration-fast` 80ms (banner fade out, buttons, tabs), `--c15t-duration-normal` 150ms (preference dialog, late banner fade in, switches, accordions), `--c15t-duration-slow` 200ms (legal links, floating trigger); easings include `--c15t-easing-out` `cubic-bezier(0.215, 0.61, 0.355, 1)` for the dialog and late fade in and `--c15t-easing-in` `cubic-bezier(0.55, 0.055, 0.675, 0.19)` for the banner fade out.
- Reduced motion: the stylesheet's `prefers-reduced-motion: reduce` rules stop the banner, dialog, trigger, switches, tabs and accordions from animating; "`disableAnimation: false` does not bring the animations back for these visitors".
- Theme switches without transitions: add `c15t-no-transitions` to `<html>`, apply the theme, force a layout pass with `root.getBoundingClientRect()`, then remove the class. "Otherwise the browser computes the new theme only after the class is gone, and the change animates."

## Keyboard, width and contrast

"Tab through the banner and dialog with the keyboard only. Focus stays inside a modal dialog and returns to the button that opened it when it closes. Set the viewport to 375 pixels wide and switch to a language with long labels, such as German. After applying your theme, check text contrast and that focus rings are visible." [c15t, verify-consent.md]

## Content Security Policy

[c15t, content-security-policy.md] What the consent manager adds, and the directive each needs:

| What | Directive |
|--|--|
| The `<style>` elements the stock components render | `style-src` with a nonce |
| The `<style id="c15t-theme">` element from `ConsentTheme` | `style-src` with a nonce or its hash |
| `<script>` elements the loader creates for `scripts` entries | `script-src` with each vendor's host, or a nonce |
| The inline early `/init` script and the pre-hydration tap script | `script-src` with a nonce or its hash |
| Requests to the backend's `/init` and `/subjects` | `connect-src` with the backend origin |
| Gated iframes and the frames, images and requests vendors load | `frame-src`, `img-src`, `connect-src` for each vendor |

- "A nonce protects a page only when it changes on every response. A static host serves the same file to everyone, so use host allowlists there."
- With a nonce on the provider the style elements "render next to each component with the nonce. React 19 would otherwise move them into `<head>` and drop the nonce." Or set `styles: false` and import `c15t/react/styles.css` under `style-src 'self'`.
- "Scripts that a vendor script adds itself, such as a tag manager's tags, need their own hosts too, or `'strict-dynamic'` with a nonce."
- Verify "with the policy enforced, not in report-only mode"; read each script's `nonce` property in the console, because "Browsers hide the attribute from `getAttribute`." Test against a production build: Vite's dev server and the DevTools panel add `<style>` elements without a nonce.
- Security headers in general are [secure-coding HEADERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/HEADERS.md).

## Banner experiments

[c15t, banner-experiments.md]

- "An experiment changes only how the prompt and the preference center look: variant, position, layout, primary actions, blocking. The policy rule, its categories and its copy stay the same for every arm". Copy is out of scope because a copy change "re-prompts every returning visitor".
- "The opt-in rate of an arm is visitors with an `accept_all` choice under that arm, divided by visitors whose session reports carry the arm. Count visitors, not requests: an undecided visitor sends a report on every page until they choose."
- "Time to decision is the median `timeToDecisionMs` per arm over the choices. Use the median, not the mean: a visitor who leaves the tab open skews the mean without saying anything about the arm."
- "An impression fires before any consent exists. If your analytics tool loads only after consent, it never sees a decliner's impression, and its opt-in rate trends towards 100%."
- "Run a sample-size calculator against your own base rate before you start, decide the stop date up front, and do not stop early on a good-looking day." (c15t's page also gives per-arm visitor counts for a 30% base rate; the standard two-proportion formula gives smaller ones, so use the calculator, not those numbers.) The sample-size method is [ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md).
- "For a clean analysis, change `id` rather than editing the arms of a running experiment." Under an opt-out policy with a notice, "compare arms on opt-outs instead".
- Catch a rejected arm before deploying with `validateExperiment(bannerExperiment, euPolicy, { presentation })` in a test.

## Where the landing page differs

The owner's banner ([landing-page-ui SECTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SECTIONS.md#cookie-banner)) is that skill's design; differences, not fixes:

- Motion: landing-page-ui's banner appears "after 1s, rises 20px over .5s on the site ease (opacity only over .2s with reduced motion); leaves with a fade and `scale(.94)` over .2s" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md)); c15t's banner never slides in and a late one fades over 150ms. Both honour reduced motion.
- Both use a non-blocking banner; landing-page-ui's is "a `section` with an `aria-label` and `aria-live="polite"`".

## Prove it

Under a choice policy the Reject and Accept buttons share one visual treatment; under a notice policy focus is not trapped and scroll is not locked; a blocking banner carries `role="dialog"` and `aria-modal="true"` and returns focus to its opener; at 375 px wide in German nothing overflows; with reduced motion emulated the banner appears without moving; with the CSP enforced the console shows no `Refused to` error naming the banner, the backend or a vendor; and each experiment arm passes `validateExperiment` under every policy it runs in.
