# Paywalls

The in-app paywall of a store-billed app: the funnel from app open to purchase, the seven elements to audit, placement and timing, display patterns, A/B tests, and what to do after the paywall. The store rules decide the layout before any test does: both Apple and Google Play make the billed amount the most prominent price, and Play requires a clearly visible way to dismiss an offer when users can access functionality without subscribing, plus an easy manage-or-cancel method. The source's blanket visible-close rule is stricter. Bullets tagged [eronred] or [ApparenceKit] are the third-party sources described in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md); bullets tagged [coreyhaines31/marketingskills, paywalls] come from Corey Haines' MIT-licensed marketing skills, written for web SaaS in-product upgrade prompts. Untagged bullets in the first three sections are [eronred]. Pricing, tiers and trials are in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#monetization-model-and-pricing); paywall code, design rules and RevenueCat paywalls are in [revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md); web upgrade prompts and plan gates are in [onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md).

## Funnel and audit

- **Ask first:** App ID and framework (RevenueCat, Superwall, Adapty, native); paywall view to trial start and trial to paid over the last 30 days; paywall screenshots; plan structure. If RevenueCat is connected, pull subscription metrics first ([revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md)) and cross-check trial counts against App Store Connect.

| Funnel stage | Healthy | Red flag (cause) |
|---|---|---|
| App open to paywall view | 60-95% | Under 50% (buried) |
| Paywall view to CTA tap | 25-45% | Under 15% (weak copy or offer) |
| CTA tap to purchase confirm | 70-90% | Under 50% (StoreKit friction or price shock) |
| Trial to paid | 25-60% | Under 15% (wrong audience or price) |

- **Fix only the weakest stage.** Trial-to-paid problems belong to the lifecycle section of [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md#subscription-lifecycle).
- **Audit seven elements, scoring each 1-5** (2 or below is a quick win, 3 an A/B candidate):
  - **Headline:** an outcome ("Unlock unlimited workouts" beats "Pro Plan"; "Unlock [specific benefit]" beats "Go Premium").
  - **Value props:** 3-5, benefits not features, scannable in under 3 seconds ("Try to list the 3 main benefits of your app. Showing too much will just confuse your users. Showing too little will not convince them", pairing benefit and feature: not "Access exercices" but "Transform yourself in 30 days: Access 300+ premium exercices" [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/)); show what's missing (blurred or locked), a before/after or with/without comparison.
  - **Social proof:** rating, review count, user count or named testimonials; required above the fold.
  - **Plan picker:** annual selected by default with its savings %; monthly labelled "billed monthly"; weekly only if it is the category norm.
  - **Price anchoring:** annual as a monthly equivalent ("$3.33/mo, billed annually") plus the total ("$39.99/yr"). [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/) suggests showing the monthly or daily price instead of only the yearly one (daily when the app has daily usage); both stores require the opposite weighting (see [Store rules](#store-rules-for-the-paywall)). The article (undated) omits this rule; keep any calculated price smaller than the billed amount.
  - **Trust:** "Cancel anytime", "No charge until X date", no-commitment trial messaging, restore purchases visible; display the annual savings % prominently. [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/): show the trial days and what the user pays after them, a "Restore" button inlined at the bottom with the legal links (purchases belong to the store account, so restore covers a new phone or several devices), and the subscription name as entered in App Store Connect ("Apple will reject your app if that is not the case").
  - **CTA:** one primary, an action verb ("Start Free Trial", not "Subscribe"), high contrast.
- **Always ship a restore-purchases button and a visible close button.** The playbooks call a missing restore button a guaranteed Apple rejection (Guideline 3.1.2), and a hidden close button causes rejection and bad reviews. Apple's Guideline 3.1.1 says "you should make sure you have a restore mechanism for any restorable in-app purchases"; Apple's guideline text doesn't literally require a close button, so that part is the playbooks' claim, while Google Play's Subscriptions policy makes it a rule (see [Store rules](#store-rules-for-the-paywall)). Apple's Guideline 3.1.2(c): before asking someone to subscribe, clearly describe what they get for the price (https://developer.apple.com/app-store/review/guidelines/).

## Placement and display

| Placement | For | Risk |
|---|---|---|
| Hard paywall (after onboarding, before the app) | High-intent installs, high-LTV apps | Tanks D1 retention; needs strong creative on the store page |
| Soft, after the value moment | Most consumer apps; the default with no data | Lower trial start rate |
| Feature-gated (on a premium feature tap) | Utility, productivity | Low conversion volume |
| Time or usage gated (free for N days or uses) | Habit-forming apps | Hard to tune the gate |
| Multiple paywalls (different placements and designs) | Mature apps with Superwall or RevenueCat targeting | Engineering complexity |

| Paywall timing | Conversion |
|---|---|
| Onboarding, before value | 2-5% (only with a strong brand) |
| After the aha moment | 5-10% (most apps) |
| Feature gate | 8-15% (utility, productivity) |
| Usage limit (after N uses) | 5-8% (content, tools) |
| Time-based trial | 5-10% (complex apps) |

- **Display patterns:** annual default with savings % ("Save 67%"); trial CTA primary; single plan; 3 tiers with the middle as the anchor; lifetime as a decoy; localized currency (Apple localizes the price automatically, but the display copy must match). The display matters more than the price itself. [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/) adds a two-offer pattern, one plan with a trial and one without, "a new classic pattern that is proven to increase conversion rate" (no figure given).
- **Offer or design: the sources differ.** [eronred] (line above): the display matters more than the price. [ApparenceKit](https://apparencekit.dev/blog/apparencekit-flutter-template-v5-release/): "Changing the UI of your paywall can triple your conversion rate" (no data). [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/), "After testing a lot of apps and paywalls": "copy is less important than your offer"; "the price and billing interval are the main levers to increase conversion and revenue"; "the design of your paywall matters less than showing it at the right time ... But you can't sell high prices if your paywall looks cheap."
- **How often to show it** [coreyhaines31/marketingskills, paywalls]: limit prompts per session; "Cool-down after dismiss (days, not hours)"; never show it "repeatedly after dismissal" or mid-flow.

## A/B tests

- **A/B test one element at a time.** Sample sizes to detect a 10% relative lift (two-sided alpha 0.05, 80% power, recomputed with the standard two-proportion formula): baseline 5% needs about 31,200 users per variant; 15% about 9,260; 30% about 3,760. Before this fix the line said "baseline 5% needs about 6,000 users per variant; 15% about 2,000; 30% about 1,000", about 4 to 5 times too low for a relative lift and no match for an absolute one. The full table, the duration formula and what to do when the sample is too high are in [ab-testing SAMPLE-SIZE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SAMPLE-SIZE.md#sample-per-variant). Priority: 1 headline, 2 trial offer (3-day vs 7-day vs none), 3 plan default, 4 CTA copy ("Start free trial" vs "Try free for 7 days" vs "Continue"), 5 social proof element (rating vs user count vs testimonial), 6 visual style, 7 number of plans. Tools: Superwall (no-deploy paywall tests, recommended), RevenueCat Experiments, Adapty A/B, Firebase Remote Config with your own logic.
- **Remote config as the switch** [ApparenceKit](https://apparencekit.dev/blog/flutter-template-advantages/): "I always use remote config to test some titles, texts, or trigger delay to my paywalls." [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/) picks the paywall variant with a Dart switch whose `_` arm falls back to a known paywall (`remoteConfigApiProvider` and `PaywallFactory` are ApparenceKit's Riverpod names), verbatim:

```dart
/// ===============================================
/// This is an example of how to get the paywall from the remote config
/// You can use this to test different paywalls
/// ===============================================
final configuredPaywall = ref
     .read(remoteConfigApiProvider) //
     .subscription
     .paywall;

 final paywallFactory = switch (configuredPaywall) {
   'withSwitch' => PaywallFactory.withSwitch,
   _ => PaywallFactory.basic,
 };
 ...
```

- **Only significant data counts** [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/): "Improving conversion on one day with 30 people means nothing"; "Data needs to be significant to be relevant."
- **Test arms the stores don't allow.** The marketingskills paywall test list [coreyhaines31/marketingskills, paywalls] includes "Display price prominently vs. de-emphasize until click", "Show price after trial vs. emphasize 'Start Free'" and "Price per day framing". On Google Play those arms break the Subscriptions policy ("Users should not have to perform any additional action to review the information"; a violation example: "Offer emphasizes the free trial and users may not understand that they will automatically be charged at the end of the trial", https://support.google.com/googleplay/android-developer/answer/9900533), and on both stores a daily or monthly breakdown may never outweigh the billed amount. Card-required trials, pre-filled payment and one-click checkout arms don't exist in store billing: the store owns the card and the sheet.
- **Anti-patterns:** testing 5 things at once; optimizing trial starts while ignoring trial-to-paid; stopping tests at p=0.05 without a sample size; weekly pricing where users expect annual; no restore-purchase button; hiding "cancel anytime".

## After the paywall

- **After the paywall** [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/): once a user subscribes, put a link in the app to the store's subscription management page, to "prevent getting some bad reviews when people doesn't know how to unsubscribe"; "ask for feedback after a user has subscribed"; "When users leave the paywall, show a popup that ask them why they didn't subscribe." On Google Play the management link is a policy requirement, not only a tip (see [Store rules](#store-rules-for-the-paywall)).
- **No second offer on dismiss: RevenueCat's rule, not a guideline.** RevenueCat says "Apple App Review disallows ... a second offer on dismiss or purchase cancel" ([revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md#paywall-design-rules)); the App Review Guidelines contain no such literal rule (https://developer.apple.com/app-store/review/guidelines/). Before this fix the line said "Apple disallows a second offer on dismiss or cancel". The marketingskills paywall tests list "Offer alternative (lower tier, annual discount)" on dismiss [coreyhaines31/marketingskills, paywalls]; RevenueCat reports such a flow rejected, so keep the dismiss screen free of offers.

## Store rules for the paywall

- **The billed amount is the most prominent price on both stores.** Apple: "the amount that will be billed must be the most prominent pricing element in the layout"; a breakdown price "should be displayed in a subordinate position and size to the annual price" (https://developer.apple.com/app-store/subscriptions/, [app-store-connect PREFLIGHT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PREFLIGHT.md#rules-subscriptions)). Google Play lists as a violation "Annual subscriptions that most prominently display their pricing in terms of monthly cost", and its annotated example: "Offer most prominently displays pricing in terms of monthly breakdown cost, rather than what the users will actually be charged" (https://support.google.com/googleplay/android-developer/answer/9900533).
- **State the terms where the user can see them** (Play): "You must be transparent about your offer. This includes clearly and explicitly disclosing your offer terms, the cost of your subscription, the frequency of your billing cycle, the automatic renewal terms, whether a subscription is required to use the app, and any other material information about the subscription. Users should not have to perform any additional action to review the information." Apple 3.1.2(c) asks the same before the user subscribes.
- **A visible dismiss button** (Play): violation example "Dismiss button is missing or not clearly visible and users may not understand that they can access functionality without accepting the subscription offer"; and "In-app promotions that do not clearly demonstrate that a user can access content without a subscription (when available)".
- **No accidental subscribing:** Play bans "Multiple screens in the purchase flow that lead users into accidentally clicking the subscribe button"; Apple 3.1.2(b): users "should not be able to inadvertently subscribe to multiple variations of the same thing".
- **A manage-and-cancel link in the app** (Play): "your app(s) clearly disclose how a user can manage or cancel their subscription. You must also include in your app access to an easy-to-use, online method to cancel the subscription", met by "A link to Google Play's Subscription Center ... and/or direct access to your cancellation process"; violation: "The app is missing a link to manage and cancel subscriptions in the account setting or equivalent page."
- **No manipulative purchase flow.** Apple's Developer Code of Conduct: apps should never "trick them into making unwanted purchases ... raise prices in a tricky manner ... or engage in any other manipulative practices". Play: "We do not allow apps that subject users to deceptive or manipulative purchase experiences". A real time-limited offer is allowed; a fake or resetting countdown is the manipulative case ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)).
- **The rest of the Play Subscriptions policy** (free-trial disclosure, refunds, sustained value, subscription names) is on the policy page above; Play Billing is in [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md), and Apple's 3.1 rules are in [app-store-connect REVIEW-GUIDELINES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/REVIEW-GUIDELINES.md).

## Prove it

- The source's stricter design rule keeps restore and a visible close control on every paywall; distinguish it from Apple's restore requirement for restorable purchases and Play's dismiss guidance for functionality available without a subscription. [eronred; https://developer.apple.com/app-store/review/guidelines/; https://support.google.com/googleplay/android-developer/answer/9900533]
- No calculated price (monthly, weekly or daily breakdown) is larger or bolder than the billed amount, on iOS and Android.
- Annual is default-selected with its savings % and monthly equivalent; the paywall says what the user gets for the price, the billing period and the renewal terms before asking to subscribe.
- Account settings link to the store's subscription management page.
- The dismiss screen shows no second offer, and no A/B arm hides the price or the post-trial charge.
- Every A/B test states its baseline, minimum detectable effect and sample per variant before it starts.
