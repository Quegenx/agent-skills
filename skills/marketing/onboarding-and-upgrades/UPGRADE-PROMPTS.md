# Upgrade prompts and paywalls

In-product moments that ask a user who has already seen value to pay or move up a tier: when to show the prompt, what it contains, how often, what happens after, and the app-store rules that change the design on mobile. From [coreyhaines31/marketingskills, paywalls] `SKILL.md` and `references/experiments.md` (MIT, Copyright (c) 2025 Corey Haines), checked against Apple's App Review Guidelines and Google Play's Subscriptions and Payments policies. The public pricing page is not this file's job ([pricing-strategy PAGE-TEARDOWN.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PAGE-TEARDOWN.md), [cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md)). Native mobile paywalls are built in [revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md) and audited in [app-growth PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md).

**Contents:** [Principles](#principles) · [Triggers](#triggers) · [What the screen holds](#what-the-screen-holds) · [Templates](#templates) · [Timing and frequency](#timing-and-frequency) · [From prompt to payment](#from-prompt-to-payment) · [Dark patterns and conversion killers](#dark-patterns-and-conversion-killers) · [Store rules for in-app upgrades](#store-rules-for-in-app-upgrades) · [Measure it](#measure-it) · [Prove it](#prove-it)

## Principles

[coreyhaines31/marketingskills, paywalls]

1. **Value before the ask:** after the aha moment, not before; the upgrade feels like the natural next step.
2. **Show, don't just tell:** preview what they're missing; make the upgrade tangible.
3. **A friction-free path:** easy to upgrade when ready; "Don't make them hunt for pricing".
4. **Respect the no:** don't trap or pressure; make it easy to continue free.

## Triggers

[coreyhaines31/marketingskills, paywalls]

- **Feature gate** (the user clicks a paid-only feature): why it's paid, what the feature does, a quick path to unlock, the option to continue without.
- **Usage limit:** a clear indication the limit is reached, what upgrading gives, and "Don't block abruptly".
- **Trial expiration:** early warnings ("7, 3, 1 day"), a clear "what happens" at expiry, a summary of the value received. On the stores the trial converts on its own; see below.
- **Time-based:** after X days of free use, a gentle reminder that highlights unused paid features and is easy to dismiss.

## What the screen holds

[coreyhaines31/marketingskills, paywalls]

1. **Headline** on what they get: "Unlock [Feature] to [Benefit]".
2. **Value demonstration:** a preview, before and after, "With Pro you could...".
3. **Feature comparison:** the key differences, with the current plan marked.
4. **Pricing:** clear and simple, annual and monthly options. On mobile the billed amount leads (below).
5. **Social proof:** customer quotes, "X teams use this".
6. **CTA,** specific and value-oriented: "Start Getting [Benefit]".
7. **Escape hatch:** a clear "Not now" or "Continue with Free".

## Templates

[coreyhaines31/marketingskills, paywalls]

**Feature lock:**

```
[Lock Icon]
This feature is available on Pro

[Feature preview/screenshot]

[Feature name] helps you [benefit]:
• [Capability]
• [Capability]

[Upgrade to Pro - $X/mo]
[Maybe Later]
```

**Usage limit:**

```
You've reached your free limit

[Progress bar at 100%]

Free: 3 projects | Pro: Unlimited

[Upgrade to Pro]  [Delete a project]
```

**Trial expiration** (a web trial that lapses):

```
Your trial ends in 3 days

What you'll lose:
• [Feature used]
• [Data created]

What you've accomplished:
• Created X projects

[Continue with Pro]
[Remind me later]  [Downgrade]
```

- **This template models a web trial that lapses.** A store trial converts automatically, so it needs no "Continue with Pro" purchase; the in-app screen says when the charge happens and how to cancel (Play: "how a user can cancel if they do not want to convert").
- **The owner's app does plan gates differently.** [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#empty-loading-filtered-partial): "A feature the plan doesn't include shows an empty state with what it does and a link to the plans, and the server refuses it too (it answers with an empty page, not an error)." [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md): "at the limit a muted line says so, with an upgrade hint only below the top plan." No modal, price or "Maybe Later" there; in that app, follow app-ui.

## Timing and frequency

[coreyhaines31/marketingskills, paywalls]

- **Show it** after the value moment and before frustration, after activation, when a genuine limit is hit.
- **Don't show it** "During onboarding (too early)", when they're mid-flow, or repeatedly after dismissal.
- **Frequency:** a limit per session; "Cool-down after dismiss (days, not hours)"; track annoyance signals.
- **The onboarding paywall: the sources differ.** This source says not during onboarding; for apps, ApparenceKit and RevenueCat report onboarding paywalls working right after value is shown ([app-growth ONBOARDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/ONBOARDING.md)). The source writes for B2B web products; app-growth for consumer apps. Test it in your context.

## From prompt to payment

[coreyhaines31/marketingskills, paywalls]

- **To payment:** minimize steps, keep it in context if possible, pre-fill known information (web only; on the stores the store owns the payment sheet).
- **After the upgrade:** immediate access to the features, a confirmation and receipt (the store sends it on mobile), a guide to what's new.
- **Stripe** upgrade mechanics and prorations are in [stripe SUBSCRIPTION-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SUBSCRIPTION-CHANGES.md#upgrades-and-downgrades).

## Dark patterns and conversion killers

[coreyhaines31/marketingskills, paywalls]

- **Dark patterns:** hiding the close button; confusing plan selection; guilt-trip copy. Google Play makes the first two policy (below).
- **Conversion killers:** asking before value is delivered; too-frequent prompts; blocking critical flows; a complicated upgrade.
- **Fake urgency** ("Limited-time upgrade offer with countdown", "'Last chance' offer with discount") is only honest with a real deadline ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)); Apple's Developer Code of Conduct says apps should never "trick them into making unwanted purchases... raise prices in a tricky manner... or engage in any other manipulative practices", and Play: "We do not allow apps that subject users to deceptive or manipulative purchase experiences".

## Store rules for in-app upgrades

The source contains no store rules; on iOS and Android these decide the design. The app-side summary is in [app-growth PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall); the full policy text belongs in [app-store-connect REVIEW-GUIDELINES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-GUIDELINES.md), [app-store-connect PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PREFLIGHT.md) and [google-play BILLING-AND-PURCHASES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/BILLING-AND-PURCHASES.md); what follows is where they change this file's advice. Sources: [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play Subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533), [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738).

- **The billed amount leads, on both stores.** Follow the [mobile paywall policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall). The source's price-display tests ("Price per day framing ('Less than a coffee')", annual savings framing) are valid only with the breakdown subordinate.
- **No hidden price, no hidden charge.** Follow the [mobile paywall policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall) for visible cost, billing frequency and auto-renewal terms. The source's test arms "de-emphasize until click" and "emphasize 'Start Free'" are not valid variants on mobile.
- **Say how the trial converts and how to cancel.** Play: "Be sure to let your users know how and when a free trial will convert to a paid subscription, how much the paid subscription will cost, and how a user can cancel if they do not want to convert"; trials run "between 3 days and 3 years".
- **A visible dismiss.** Follow the [mobile paywall policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall). This agrees with the source's escape hatch.
- **No accidental subscribe.** Follow the [mobile paywall policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall); this constrains the source's "confusing plan selection".
- **A manage-and-cancel link in account settings** follows the [mobile paywall policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/PAYWALLS.md#store-rules-for-the-paywall).
- **The store owns payment.** Apple 3.1.1: to unlock features "you must use in-app purchase"; Play allows alternative billing only "if they enroll in the applicable program". So the source's upgrade-path tests (card required or not, pre-filled payment info, multiple payment methods, one-click vs separate checkout) are web-only.
- **Lapsed users get win-back offers, not a second trial.** The source's "Second trial offer for expired/churned users" isn't a store mechanism: Apple introductory offers don't go to existing or lapsed subscribers, and Play "may detect users attempting to circumvent free trial or introductory pricing offer eligibility criteria". Map it to win-back, promotional or offer-code offers ([app-growth SUBSCRIPTION-OFFERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SUBSCRIPTION-OFFERS.md)).
- **One-time value is an in-app product.** Apple 3.1.2(a): "Subscriptions may be offered alongside à la carte offerings"; Play: products without "sustained and recurring value must use an in-app product instead of a subscription product".
- **Refunds are the store's.** Play: on cancel "the user will not receive a refund for the current billing period", with prorated refunds in some countries by law; don't promise an in-app money-back guarantee.
- **An offer on dismiss.** The source tests "Offer alternative (lower tier, annual discount)" on dismiss. The repo's rule against a second offer on dismiss comes from RevenueCat ([revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md)); Apple's guidelines contain no such literal rule. Treat it as RevenueCat's rejection experience, not Apple's text.
- **"Grace period" and "pause" mean different things here.** The source's "Grace period after expiration" is a web trial lapse, not the store's billing grace period; its "Pause option" exists on Play only.

## Measure it

[coreyhaines31/marketingskills, paywalls] Paywall impression rate, click-through to upgrade, completion rate, revenue per user, churn after upgrade. What to test is in [EXPERIMENTS.md](EXPERIMENTS.md#upgrade-prompt-experiments).

**Ask first:** the current free-to-paid conversion; what triggers prompts today; what's behind the paywall; the aha moment; the pricing model (per seat, usage, flat); mobile app, web app, or both.

## Prove it

Every prompt appears only after the activation event and never mid-flow; a dismissed prompt stays away for days; each screen has a visible "Not now"; on mobile the billed amount is the largest price on screen, the trial terms state when the charge happens and how to cancel, and account settings link to the store's subscription management; no countdown is fake; and in the owner's app, plan gates follow app-ui's empty state and muted limit line.
