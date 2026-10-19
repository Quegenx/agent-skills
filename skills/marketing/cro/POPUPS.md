# Popups, slide-ins and banners

A popup converts when it appears at a moment of need with an obvious benefit and is easy to dismiss. This file covers email and lead-magnet popups, discount and exit popups, announcement banners, sticky bars and slide-ins. The source is [coreyhaines31/marketingskills, popups] v2.0.0 (MIT), corrected against Google Search Central, W3C WCAG 2.2 and the ARIA APG, web.dev and the FTC. The form inside a popup follows [FORMS.md](FORMS.md); dialog mechanics are [web-accessibility FOCUS-AND-KEYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md#focus-trapping-and-restoration) and [modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md); in-app messages in mobile apps are [onesignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SKILL.md); a cookie banner is a consent notice, not a popup ([cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md)).

**Contents:** [Before designing one](#before-designing-one) · [Triggers](#triggers) · [Types](#types) · [Design, sizing and closing](#design-sizing-and-closing) · [Copy](#copy) · [Urgency and countdowns](#urgency-and-countdowns) · [Frequency and targeting](#frequency-and-targeting) · [Google and interstitials](#google-and-interstitials) · [Accessibility](#accessibility) · [Layout shift](#layout-shift) · [Measurement](#measurement) · [Output and strategies](#output-and-strategies) · [Prove it](#prove-it)

## Before designing one

[coreyhaines31/marketingskills, popups]

- **Purpose:** email or newsletter capture, lead magnet delivery, discount or promotion, announcement, exit-intent save, feature promotion, feedback or survey.
- **Current state:** existing performance, the triggers in use, user complaints, the mobile experience.
- **Traffic:** sources (paid, organic, direct), new versus returning visitors, the page types where it shows.
- **Questions:** the primary goal, current performance, the traffic sources being optimized for, the incentive on offer, compliance requirements (GDPR and the like), the mobile and desktop split.
- **Principles:** timing ("Too early = annoying interruption / Too late = missed opportunity"), obvious value ("Worth the interruption"), and "Respect the User (Easy to dismiss / Don't trap or trick / Remember preferences)".

## Triggers

[coreyhaines31/marketingskills, popups]

| Trigger | What it is | Best for |
|---|---|---|
| Time | "Not recommended: Show after 5 seconds"; "Better: Show after 30-60 seconds" | General site visitors |
| Scroll | "Typical: 25-50% scroll depth" (the source's own evals use 50%+ and 50 to 70%: test the depth) | Blog posts, long-form content |
| Exit intent | "Detects cursor moving to close/leave" | E-commerce, lead gen |
| Click | The user clicks a button or link; "Zero annoyance factor" | Lead magnets, gated content, demos |
| Page count | After X pages, a sign of research or comparison | Multi-page journeys |
| Behavior | Cart abandonment, pricing-page visitors, repeat visits | High-intent segments |

**Exit intent on mobile.** Cursor exit can't be detected on touch screens. The source's mobile alternative is "Back button or scroll up": use scroll up. Never intercept the Back button to show a popup; the FTC's dark-patterns report catalogues interfaces that obstruct the user, though no Google or Chrome doc on Back-button interception was checked for this file.

## Types

[coreyhaines31/marketingskills, popups]

| Type | Practices |
|---|---|
| Email capture | A clear value proposition, not just "Subscribe"; "Single field (email only)"; consider an incentive. Headline: a benefit or curiosity hook; subhead: "What they get, how often"; CTA: a specific action ("Get Weekly Tips"). The subhead is also what informed consent needs ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#consent-checkboxes-and-forms)) |
| Lead magnet | Show what they get (cover image, preview); a specific, tangible promise; minimal fields; "Instant delivery expectation". The magnet itself: [lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md) |
| Discount | A clear discount (10%, $20, free shipping); "Single use per visitor"; "Easy to apply code". The source adds "Deadline creates urgency": only a real deadline ([Urgency and countdowns](#urgency-and-countdowns)) |
| Exit intent | Acknowledge they're leaving; "Different offer than entry popup"; address common objections. Formats: "Wait! Before you go...", "Forget something?", "Questions? Chat with us" |
| Announcement banner | Top of page, sticky or static; one clear message; dismissable; links to more; "Time-limited (don't leave forever)". A banner injected above content after load must reserve its space ([Layout shift](#layout-shift)) |
| Slide-in | Enters from a corner or the bottom; "Doesn't block content"; easy to dismiss or minimize; good for chat, support and secondary CTAs. It must not hide a focused control ([Accessibility](#accessibility)) |

## Design, sizing and closing

[coreyhaines31/marketingskills, popups]

- **Visual order:** headline (largest, first seen), value proposition or offer, form or CTA, close option.
- **Sizing:** "Desktop: 400-600px wide typical / Don't cover entire screen / Mobile: Full-width bottom or center, not full-screen". "Full-screen overlays feel aggressive / Bottom slide-ups work well." Google's guidance says the same: "Don't obscure the entire page with interstitials" ([Google and interstitials](#google-and-interstitials)).
- **Close button:** keep it visible; the source says "top right is convention", which is the top end in right-to-left layouts. "Large enough to tap on mobile": the AA floor is 24 by 24 CSS px and 44px a heuristic ([web-accessibility HIT-AREAS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/HIT-AREAS.md)). Offer a "No thanks" text link as an alternative and close on a click outside ([modern-css POPOVER-AND-DIALOG.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/POPOVER-AND-DIALOG.md#light-dismiss-with-closedby)).
- **Imagery:** a product image or preview; optional, copy can work alone. The source's "Face if relevant (increases trust)" has no source: test it.

## Copy

[coreyhaines31/marketingskills, popups]

- **Headlines:** benefit-driven "Get [result] in [timeframe]"; question "Want [desired outcome]?"; command "Don't miss [thing]"; social proof "Join [X] people who..." (only with a real, sourced count, [SKILL.md](SKILL.md#where-other-skills-differ)); curiosity "The one thing [audience] always get wrong about [topic]".
- **Subheads:** expand on the promise, address an objection ("No spam, ever"), set expectations ("Weekly tips in 5 min").
- **CTAs:** first person ("Get My Discount" vs "Get Your Discount"), specific ("Send Me the Guide" vs "Submit"), value-focused ("Claim My 10% Off" vs "Subscribe").
- **Decline options:** "Polite, not guilt-trippy": "No thanks", "Maybe later", "I'm not interested". "Avoid manipulative: 'No, I don't want to save money'". The FTC calls this confirm shaming; the rule and its quote are in [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md#rules).

## Urgency and countdowns

The source says "Deadline creates urgency", "Add countdown timers to create urgency" and tests "Banner with countdown timer vs. without", without saying the deadline must be real.

- **The rule:** a timer shows a real deadline and never resets; the FTC names baseless countdown timers and false limited-time messages as dark patterns, quoted once in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns). "Show escalating offers over multiple visits" [coreyhaines31/marketingskills, popups] gets the same check: each offer is real.
- **A ticking timer is auto-updating content.** [WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (Level A): information that updates automatically, starts automatically and sits beside other content needs "a mechanism for the user to pause, stop, or hide it or to control the frequency of the update", and "there is no five second exception for auto-updating". Reading, not stated by W3C for countdowns: a dismissible banner probably counts as the hide.

## Frequency and targeting

[coreyhaines31/marketingskills, popups]

- **Capping:** "Show maximum once per session / Remember dismissals (cookie/localStorage) / 7-30 days before showing again / Respect user choice". Storage and consent: [cookie-consent](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md).
- **Targeting:** new versus returning visitors, by traffic source ("match ad message"), by page type, "Exclude converted users", "Exclude recently dismissed".
- **Page rules:** "Exclude checkout/conversion flows"; consider blog versus product pages; match the offer to the page.
- **Interruptions:** [WCAG 2.2.4 Interruptions](https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html) is Level AAA: "Interruptions can be postponed or suppressed by the user, except interruptions involving an emergency." Capping and remembered dismissals are the closest practice; cite it as AAA context, never as an AA failure.

## Google and interstitials

The source says "Intrusive interstitials hurt SEO / Mobile especially sensitive / Allow: Cookie notices, age verification, reasonable banners / Avoid: Full-screen before content on mobile". That copies Google's 2016 blog post ([Helping users easily access content on mobile](https://developers.google.com/search/blog/2016/08/helping-users-easily-access-content-on)). The current page, [Avoid intrusive interstitials and dialogs](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials) (last updated 2025-12-10), has no mobile-only framing:

- The effect: "Intrusive dialogs and interstitials make it hard for Google and other search engines to understand your content, which may lead to poor search performance."
- "Don't obscure the entire page with interstitials."
- "Don't redirect the user to a separate page for their consent or input."
- "Use banners instead of interstitials": banners "that take up only a small fraction of the screen", with Smart App Banners and Chrome's in-app install as its examples; the same containers can hold a newsletter sign-up. Prefer the CMS's standard dialog plugins.
- The rules above hold "Unless they're legally mandatory": "Certain sites are required to show an interstitial due to the kind of content they are publishing" (its example: "a casino site may need to show an age gate"). For those it still recommends: "Ensure that the content is overlaid with the interstitial"; don't redirect incoming requests to a consent page; for an age gate, let verified Googlebot requests crawl the content without it.
- [Understanding page experience](https://developers.google.com/search/docs/appearance/page-experience) (last updated 2026-09-22): "Core Web Vitals are used by our ranking systems." "Beyond Core Web Vitals, other page experience aspects don't directly help your website rank higher in search results." It still asks "Do your pages avoid using intrusive interstitials?"

So: a full-screen popup may hurt how Google understands the page on any device; it is not a mobile-only ranking penalty. SEO rules beyond this are [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md).

## Accessibility

The source lists "Keyboard navigable (Tab, Enter, Esc) / Focus trap while open / Screen reader compatible / Sufficient color contrast / Don't rely on color alone". For a modal popup, "screen reader compatible" means the [WAI-ARIA APG Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): role `dialog`, `aria-modal`, a visible title named by `aria-labelledby`, focus moved inside on open, Escape closes it, a visible close button in the tab order, the page behind inert, and focus returned on close (for a timed, scroll or exit popup with no trigger, to where it was before). Each rule, quoted, with the code: [web-accessibility FOCUS-AND-KEYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md#focus-trapping-and-restoration).

**Non-modal slide-ins, sticky bars and banners** have a floor the source omits, [WCAG 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) (Level AA): the focused control is never entirely hidden by them. When such an overlay passes: [web-accessibility FOCUS-AND-KEYBOARD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/FOCUS-AND-KEYBOARD.md#focus-not-obscured).

**Consent wording in popups** [coreyhaines31/marketingskills, popups]: clear consent language, a link to the privacy policy, "Don't pre-check opt-ins", honor unsubscribe and preferences. The FTC lists "Preselection" as a dark pattern too ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)). Consent forms are [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#consent-checkboxes-and-forms).

## Layout shift

A top announcement banner inserted above the content after load, on a timer or on scroll, shifts the page unless it reserves its space or overlays it. The web.dev cause, CLS thresholds and the user-input exclusion are in [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#layout-shift).

## Measurement

[coreyhaines31/marketingskills, popups]

| Metric | Definition |
|---|---|
| Impression rate | Visitors who see the popup |
| Conversion rate | Impressions → submissions |
| Close rate | How many dismiss immediately |
| Engagement rate | Interaction before close |
| Time to close | How long before dismissing |

Track: popup views, form focus, submission attempts, successful submissions, close-button clicks, outside clicks, the Escape key. Event naming is [posthog EVENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/EVENTS.md#naming-events-and-properties), with no field values in events.

**Benchmarks.** [coreyhaines31/marketingskills, popups] reports, with no cited data: "Email popup: 2-5% conversion typical", "Exit intent: 3-10% conversion", "Click-triggered: Higher (10%+, self-selected)". Compare against your own baseline, not these.

## Output and strategies

[coreyhaines31/marketingskills, popups]

- **Popup design:** Type, Trigger (when it appears), Targeting (who sees it), Frequency, Copy (headline, subhead, CTA, decline), Design notes (layout, imagery, mobile).
- **Several popups:** each one's purpose, trigger and audience, plus "Conflict rules: How they don't overlap".
- **Test hypotheses** with expected outcomes ([EXPERIMENTS.md](EXPERIMENTS.md#popups)).

| Business | Sequence |
|---|---|
| E-commerce | Entry or scroll: first-purchase discount; exit intent: bigger discount or reminder; cart abandonment: complete your order |
| B2B SaaS | Click-triggered: demo request, lead magnets; scroll: newsletter or blog subscription; exit intent: trial reminder or content offer |
| Content and media | Scroll: newsletter after engagement; page count: subscribe after several visits; exit intent: don't miss future content |
| Lead generation | Time-delayed: general list building (the source's time trigger: "Better: Show after 30-60 seconds"); click-triggered: specific lead magnets; exit intent: final capture attempt |

## Prove it

- No popup shows on page load: it waits for a time, scroll or exit trigger, or the visitor's click [coreyhaines31/marketingskills, popups, eval 2]; checkout and conversion flows show none.
- Frequency is capped, dismissals are remembered, converted visitors and existing subscribers are excluded [eval 3].
- No popup covers the whole page or redirects to a separate page; mobile popups are bottom or centered, not full-screen.
- Every countdown shows a real deadline that never resets; no decline link shames the visitor.
- A modal popup has `role="dialog"`, `aria-modal="true"`, a visible title, a visible close button in the tab order, closes on Escape and returns focus; with keyboard only, no sticky bar or slide-in fully hides the focused control.
- A top banner added after load reserves its space or overlays the page, so it adds no layout shift.
- A request to redesign the form inside a popup keeps the popup to minimal fields and hands the form to [FORMS.md](FORMS.md) [eval 6].
