# Retention and monetization

Turning installs into active, paying, returning users: onboarding to the activation event, the paywall and pricing, the subscription lifecycle from trial to win-back, retention loops, web-to-app funnels, and asking for ratings. What decides most outcomes is timing against the user's first value moment: permissions, the paywall, the ATT prompt and the rating prompt all convert better after it and do damage before it. Apple's and Google's docs are the authority for every offer type, limit and guideline here; bullets tagged [eronred] are a third-party playbook whose benchmarks and percentages are its author's claims, and where the two differ both are given. Purchase code, entitlements, paywalls, webhooks and dunning tooling are in [../../backend/revenuecat/SKILL.md](../../backend/revenuecat/SKILL.md); event names for these funnels are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#event-tracking-plan-eronred); store-side rating strategy and review replies are in [../aso/SKILL.md](../aso/SKILL.md).

**Contents:** [Onboarding and activation](#onboarding-and-activation-eronred) · [Monetization model and pricing](#monetization-model-and-pricing-eronred) · [Paywalls](#paywalls-eronred) · [Trials](#trials) · [Subscription lifecycle](#subscription-lifecycle-eronred) · [Apple subscription offers](#apple-subscription-offers) · [Google Play subscription offers](#google-play-subscription-offers) · [Retention and engagement](#retention-and-engagement-eronred) · [Web-to-app funnels](#web-to-app-funnels-eronred) · [Rating prompts](#rating-prompts) · [Prove it](#prove-it)

## Onboarding and activation [eronred]

- **Activation is not sign-up.** Define the one activation event and funnel all of onboarding toward it as fast as possible. Ask for the baseline: what % of new users reach it within 24 hours, and where they drop off.

| Category | Activation event |
|---|---|
| Fitness | First workout |
| Productivity | First task or project |
| Social | First connection or post |
| Finance | First account linked or budget |
| Games | First level or match |
| Meditation | First session |
| Photo/Video | First edit or export |

- **Audit every screen:** flag it Required, Value-adding or Friction only; remove or defer friction-only screens. Score each on Necessity (can the user reach activation without it? if so, skip it), Timing (the right moment for this ask?), Value exchange (does the user understand why it benefits them?) and Cognitive load (how many decisions?).
- **Ask for permissions in context; they are the #1 drop-off point.** Push after activation, never on cold open; location when needed, never during sign-up; camera and mic contextually; contacts when a social feature is used, never in onboarding; ATT after the user is invested, never on first open. Always show a native-looking pre-permission screen before the system prompt: users who understand why grant at 2-3x the rate. Apple allows a transparent pre-prompt for ATT but forbids gating features on it ([ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att)).
- **Pre-permission copy template:** icon; benefit headline ("Get notified when your goal is complete"); one line ("We'll only send you reminders you set, no spam."); [Allow] [Not now].
- **Cut sign-up friction:** defer required sign-up until after activation; add Sign in with Apple and Google next to email and password; at most 1 profile question; make email verification deferred or optional. Guest mode converts guest to registered at typically 40-60%, against 15-30% for a hard gate.
- **Pick a flow:**

| Pattern | Order | For |
|---|---|---|
| Value-First (recommended) | Demo or preview, activation, "Save your progress" sign-up, permissions, personalization | Most apps |
| Personalization-First | 3-5 questions with a progress bar, "Your plan is ready", sign-up gate, activation | Health, fitness, AI |
| Social-First | Sign in with Apple/Google, find friends, first feed, activation | Social |

- **Personalization questions:** 3-5 max; each visibly changes the experience; show progress; visual selections, not text inputs; never ask for data you don't use immediately.

| Funnel step | Benchmark | Poor |
|---|---|---|
| Open to first interaction | Over 85% | Under 70% |
| Sign-up | Over 60% | Under 40% |
| Push permission granted | Over 50% | Under 30% |
| Activation on day 0 | Over 40% | Under 20% |
| D1 retention | Over 30% | Under 15% |

- **Paywall placement in onboarding (show value before the paywall):** before activation, almost never (the user has no reference for value); at activation, strong; after activation on D1, the strongest for subscription apps; a contextual feature gate, good.

## Monetization model and pricing [eronred]

| Model | Fits |
|---|---|
| Freemium + Subscription | Productivity, health, education |
| Freemium + IAP | Games, social, utilities |
| Paid upfront | Niche tools |
| Free + Ads | Content, casual games; low ARPU, hurts UX |
| Hybrid | Most apps |

- **Tiers:** Free (core value with limits); Monthly at $X.99 (the anchor for annual); Annual at a 40-60% discount vs monthly; Lifetime at 2-3x the annual price; Family at 1.5-2x the individual price.
- **Price psychology:** end in .99; anchor on monthly and push annual ("Save 50%"); state expensive subscriptions as a weekly price ("Just $1.99/week"); offer 3 tiers Good/Better/Best, since most users pick the middle.

| Category | Monthly | Annual |
|---|---|---|
| Productivity | $4.99-$9.99 | $29.99-$49.99 |
| Health & Fitness | $9.99-$14.99 | $49.99-$79.99 |
| Education | $9.99-$19.99 | $49.99-$99.99 |
| Photo & Video | $4.99-$9.99 | $29.99-$49.99 |
| Games | $4.99-$9.99 | $29.99-$49.99 |
| Finance | $4.99-$14.99 | $29.99-$79.99 |

- **In-app purchases:** consumables: anchor with the expensive option first, "Best Value" bundles, limited-time offers, starter packs. Non-consumables: unlock features individually, bundles, a one-time "Pro Upgrade" as an alternative to subscription.
- **Revenue targets:** ARPPU 3-10x ARPU; paying conversion (Paying / Total) 2-10%; trial-to-paid 40-60%; LTV over CAC; Payback Period = CAC / Monthly ARPU under 6 months. Levers: conversion, price (often works better than expected), churn, extra revenue streams, pushing annual. ROAS and payback against ad spend are in [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).
- **The playbooks disagree on trial-to-paid:** 40-60% (monetization), 25-40% is strong (subscription lifecycle), 25-60% healthy and under 15% a red flag (paywall). They also disagree on LTV: ARPU x Avg Lifetime (analytics, monetization) vs ARPU / Monthly churn rate (subscription lifecycle).

## Paywalls [eronred]

- **Ask first:** App ID and framework (RevenueCat, Superwall, Adapty, native); paywall view to trial start and trial to paid over the last 30 days; paywall screenshots; plan structure. If RevenueCat is connected, pull subscription metrics first ([../../backend/revenuecat/SKILL.md](../../backend/revenuecat/SKILL.md)) and cross-check trial counts against App Store Connect.

| Funnel stage | Healthy | Red flag (cause) |
|---|---|---|
| App open to paywall view | 60-95% | Under 50% (buried) |
| Paywall view to CTA tap | 25-45% | Under 15% (weak copy or offer) |
| CTA tap to purchase confirm | 70-90% | Under 50% (StoreKit friction or price shock) |
| Trial to paid | 25-60% | Under 15% (wrong audience or price) |

- **Fix only the weakest stage.** Trial-to-paid problems belong to the lifecycle section below.
- **Audit seven elements, scoring each 1-5** (2 or below is a quick win, 3 an A/B candidate):
  - **Headline:** an outcome ("Unlock unlimited workouts" beats "Pro Plan"; "Unlock [specific benefit]" beats "Go Premium").
  - **Value props:** 3-5, benefits not features, scannable in under 3 seconds; show what's missing (blurred or locked), a before/after or with/without comparison.
  - **Social proof:** rating, review count, user count or named testimonials; required above the fold.
  - **Plan picker:** annual selected by default with its savings %; monthly labelled "billed monthly"; weekly only if it is the category norm.
  - **Price anchoring:** annual as a monthly equivalent ("$3.33/mo, billed annually") plus the total ("$39.99/yr").
  - **Trust:** "Cancel anytime", "No charge until X date", no-commitment trial messaging, restore purchases visible; display the annual savings % prominently.
  - **CTA:** one primary, an action verb ("Start Free Trial", not "Subscribe"), high contrast.
- **Always ship a restore-purchases button and a visible close button.** The playbooks call a missing restore button a guaranteed Apple rejection (Guideline 3.1.2), and a hidden close button causes rejection and bad reviews. Apple's Guideline 3.1.2(c): before asking someone to subscribe, clearly describe what they get for the price.

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

- **Display patterns:** annual default with savings % ("Save 67%"); trial CTA primary; single plan; 3 tiers with the middle as the anchor; lifetime as a decoy; localized currency (Apple localizes the price automatically, but the display copy must match). The display matters more than the price itself.
- **A/B test one element at a time.** Sample floors to detect about a 10% lift: baseline 5% needs about 6,000 users per variant; 15% about 2,000; 30% about 1,000. Priority: 1 headline, 2 trial offer (3-day vs 7-day vs none), 3 plan default, 4 CTA copy ("Start free trial" vs "Try free for 7 days" vs "Continue"), 5 social proof element (rating vs user count vs testimonial), 6 visual style, 7 number of plans. Tools: Superwall (no-deploy paywall tests, recommended), RevenueCat Experiments, Adapty A/B, Firebase Remote Config with your own logic.
- **Anti-patterns:** testing 5 things at once; optimizing trial starts while ignoring trial-to-paid; stopping tests at p=0.05 without a sample size; weekly pricing where users expect annual; no restore-purchase button; hiding "cancel anytime".

## Trials

- **Length [eronred]:**

| App type | Monetization playbook | Lifecycle playbook |
|---|---|---|
| Simple app or utility | 3 days | 3-7 days |
| Most apps | 7 days | |
| Health/fitness, productivity, education | | 7-14 days |
| Entertainment | | 7 days |
| Complex or B2B | 14 days | |
| Enterprise or high price | 30 days (risk of trial abuse) | |

- **Test a 7-day vs a 14-day trial on monthly apps:** conversion may drop slightly, but LTV often rises.
- **Platform limits:** Apple free trials come in 3 Days, 1 or 2 Weeks, 1, 2, 3 or 6 Months, or 1 Year; Google Play free trials run 3 days to 3 years. Details are in the offer sections below.
- **Run the trial [eronred]:** value reminders on days 1, 3 and 5; a trial countdown ("3 days left"); a discounted first period at trial end; easy cancellation (builds trust, reduces refund requests). Nurture schedule for a 7-day trial: day 0 welcome; day 1 core feature; day 3 progress or social proof; day 5 "2 days left"; day 6 value recap; day 7 "Your trial ends today". Show value, not just pressure. The trial-end paywall recaps achievements and the most-used premium features, shows 3 plans and the annual saving ("Save 40%").

## Subscription lifecycle [eronred]

- **Stages:** install, trial start, trial, conversion, renewal, cancel, win-back. Non-converters get nurture; voluntary churners an exit survey; involuntary churners dunning; lapsed users a campaign.

| Metric | Benchmark |
|---|---|
| Trial start rate (Trials / Downloads) | Over 20% |
| Trial-to-paid | 25-40% strong |
| Month 1 renewal | Over 70% |
| Month 6 renewal | Over 50% |
| Monthly churn | Under 5% good, under 2% excellent |
| MRR | Active subs x monthly price |
| LTV | ARPU / Monthly churn rate |
| Dunning recovery | Over 30% |
| Resubscribe rate | 5-15% |

| Cancel reason | Fix |
|---|---|
| Forgot | Onboarding plus notifications |
| Not enough value | Push underused features |
| Too expensive | Lower tier or pause |
| App problem | Fix it, reply to reviews |
| Found an alternative | Monitor competitors |
| Seasonal | Pause |

- **Cancellation flow** (iOS `ManagedSubscriptionGroup`, as the playbook writes it): offer a 1-3 month pause; recap value; a discount only as a last resort (20-30% off for 3 months); a 1-tap exit survey (Too expensive, Not using it enough, Missing a feature I need, Switching to a competitor, Technical issues, Just taking a break). Offers by reason: too expensive, a discount or downgrade; not using enough, usage stats; missing a feature, the roadmap; found an alternative, the unique value. Make cancelling easy: forced retention backfires.
- **Churn-risk signals:** sessions under 1 per week (down from baseline); core feature unused for 14+ days; push disabled; last session over 7 days ago. Trigger a re-engagement push or in-app message before they cancel.
- **Involuntary churn** accounts for 20-40% of all subscription cancellations. Dunning schedule: day 0 payment fails and the store retries; day 3 retry #2; day 7 retry #3 plus an in-app "Update payment method" banner; day 10 push; day 14 grace period ends, access suspended; day 15 final in-app "Reactivate".
- **Grace period:** the playbook gives iOS 6 days (configurable up to 16 in App Store Connect) and Android 3 days (configurable); set it to the maximum, since every extra day recovers more subscribers. Apple's and Google's docs quoted here don't state these values: confirm them in App Store Connect and Play Console.
- **With RevenueCat:** it handles dunning automatically; enable Billing Retry (iOS) and Account Hold (Android); set the grace period to the maximum; use webhooks to trigger in-app messaging at each failure event ([../../backend/revenuecat/SKILL.md](../../backend/revenuecat/SKILL.md)).
- **Win-back ladder** for subscribers who cancelled or expired in the last 30-90 days; start with the softest offer and escalate only if there is no response: week 1 "We miss you" plus new features; week 3 30% off the first month back; week 6 3 months at 50% off; week 12+ archive. Channels: push, email, Apple win-back offers, paid retargeting to the lapsed list.

## Apple subscription offers

- **Three StoreKit offer types:** `Product.SubscriptionOffer.OfferType` is `introductory`, `promotional` or `winBack` (iOS 15+). Offer codes are a fourth way in. Setting up introductory offers in App Store Connect needs the Account Holder, Admin, App Manager or Marketing role.

| | Introductory | Promotional | Win-back | Offer codes |
|---|---|---|---|---|
| Who | New subscribers; lapsed subscribers who never used an intro offer in the group | Existing and previously subscribed customers, even after an intro offer | Churned subscribers (`expirationDate` in the past, `willAutoRenew` false) | New, existing (includes billing retry and grace with auto-renew on), or expired subscribers |
| Not eligible | Existing subscribers (upgrade, downgrade, crossgrade) | | Only the most recently lapsed product in each group | |
| Limit | One per customer per subscription group; one current and one future per storefront | Up to 10 active per subscription; all storefronts (can't limit by country) | 350 per subscription, 5 running per storefront per subscription | 10 active offers; 1,000,000 codes per app per quarter |
| After creation | Can't be edited: delete and recreate; overlapping dates, the latest action wins | Only price editable | Price can't change; overlapping offers, Apple picks one | |
| Shown | Automatically on the product page to eligible users | In your app to eligible subscribers | Manage Subscriptions (iOS 14.3+ / macOS 14+), in-app sheet (iOS 18+ / macOS 15+), App Store promotion (iOS 18+ / macOS 15+) | Redemption sheet |
| Needs | | An In-App Purchase key and a server signature; iOS 12.2+, macOS 10.14.4+, tvOS 12.2+ | Subscription approved by App Review | Subscription codes iOS 14.2+, other IAP types iOS 16.3+ |

- **Introductory payment modes:** free trial (the subscription begins immediately, billing after the trial), pay as you go (for example $1.99/month for 3 months), pay up front (for example $1.99 for 2 months).

| Standard duration | Pay as you go |
|---|---|
| 1 Week | 1 to 12 Weeks |
| 1 Month | 1 to 12 Months |
| 2 Months | 2, 4, 6, 8, 10 or 12 Months |
| 3 Months | 3, 6, 9 or 12 Months |
| 6 Months | 6 or 12 Months |
| 1 Year | 1 Year |

  Pay Up Front (1, 2, 3 or 6 Months, 1 Year) and Free Trial (3 Days, 1 or 2 Weeks, 1, 2, 3 or 6 Months, 1 Year) are the same for every standard duration.
- **Promotional offers:** your server generates a signature (time sensitive, unique per offer, redeemable once) from `applicationUsername`, `productIdentifier` and the offer `identifier`, and returns `nonce`, `timestamp`, `keyIdentifier`; the app passes them in `SKPaymentDiscount`, and `applicationUsername` on the payment must match. On failure, generate a new signature. The offer period starts at the next billing event. A suggested eligibility signal is `DID_CHANGE_RENEWAL_STATUS`.
- **Win-back offers** (announced September 10, 2024; WWDC24 session 10110) are configured per subscription product, not per group. Earliest start is one day after today; minimum run 3 days; priority Normal or High. Eligibility: Minimum Paid Duration (1-24 months, or 3, 4 or 5 years) and Time Since Last Subscribed (1 to 24 months), both required; Wait Between Offers (2-24 months) optional. App Store promotion (product page, editorial, personalized recommendations) needs an approved subscription image (not the app icon or a screenshot) and replaces In-App Purchase promotions in that storefront.
- **Win-back in code:** link directly with `https://apps.apple.com/win-back/<win-back offer Apple ID>`, after checking eligibility server-side through Get All Subscription Statuses and `JWSRenewalInfoDecodedPayload.eligibleWinBackOfferIds` (best offer first). With Streamlined Purchasing on (the default) a completed transaction arrives in `Transaction.updates` / `all` / `currentEntitlements`; with it off a `PurchaseIntent` arrives in `intents` (the latest approved binary must handle `PurchaseIntent` before you turn it off). In-app, `Transaction.offer` has type `winBack`; on the server `offerType` is `4`.

```swift
// Prepare the purchase options.
var purchaseOptions: Set<Product.PurchaseOption> = []

// Add the win-back offer to the purchase.
if let offer = purchaseIntent.offer, offer.type == .winBack {
    purchaseOptions.insert(.winBackOffer(offer))
}

// Present the purchase.
let result = try await purchaseIntent.product.purchase(options: purchaseOptions)
```

- **Conflict on win-back code:** the playbook says StoreKit 2 win-back offers (iOS 18+, App Store Connect > Subscriptions > Win-Back Offers) are presented automatically in the App Store and need no code beyond a StoreKit 2 integration. Apple's docs: with Streamlined Purchasing on (the default) the completed transaction is delivered in `Transaction.updates` / `all` / `currentEntitlements`, and turning it off delivers a `PurchaseIntent` that the latest approved binary must handle. Apple also shows win-back offers in Manage Subscriptions from iOS 14.3, not only iOS 18.
- **Offer codes:** one-time-use codes (expire after at most six months, batches of 500 to 25,000), custom codes (for example SPRINGPROMO, no expiration needed) and sandbox codes (10 to 10,000 per batch, up to 10,000 per quarter). Choose whether codes stack with the introductory offer. Redeem with `offerCodeRedemption(options:isPresented:onCompletion:)` (SwiftUI), `presentOfferCodeRedeemSheet(from:options:)` (UIKit/AppKit), or `presentCodeRedemptionSheet()` on iOS 16 and earlier. Server `offerType` is `3`; notifications `OFFER_REDEEMED`, `SUBSCRIBED`, `ONE_TIME_CHARGE`.
- **Guideline 3.1.2(a):** auto-renewable subscriptions must provide ongoing value, and "the subscription period must last at least seven days and be available across all of the user's devices."

## Google Play subscription offers

- **Model:** subscription, then base plans (auto-renewing, prepaid, installments), then offers. Installments exist only in Brazil, France, Italy and Spain, paid monthly. Up to 250 base plans and offers per subscription, 50 active at once. Offers attach only to auto-renewing base plans.
- **Offer phases:** free trial (3 days to 3 years); introductory pricing (absolute amount, fixed discount or percentage, at or below the base price); single payment; multiple payments (a discount for 1 to 52 recurrences of the billing period).
- **Eligibility:** New customer acquisition (never had this subscription, or never had any subscription in the app); Upgrade (a current subscription and optional billing period, with a redemption cap); Developer determined (you decide the business logic; it can't be purchased outside the app; for example limited to past subscribers who canceled, to win them back). Up to 20 offer tags, invisible to users; offers return their own tags and their base plan's.
- **Select the offer in code:** pass `productDetails.getSubscriptionOfferDetails(selectedOfferIndex).getOfferToken()` to `ProductDetailsParams.setOfferToken(...)` in `BillingFlowParams`.
- **Win-back on Play:** Google's support and developer docs, as searched, show no separate win-back offer type; the documented routes are developer-determined offers and a winback SKU. Resubscribe from the Play Store subscriptions center is on by default for up to one year after expiration. For a free trial or intro price on a winback SKU, uncheck "Allow one free trial per app"; resubscribing to the same SKU loses trial and intro eligibility. Free trials verify a valid payment method with a temporary hold; cancelling during the trial keeps access to its end. Promo codes can grant extended free trials.
- **Deadline:** by Aug 31, 2026 all new apps and updates must use Billing Library version 8 or later, with an extension available until Nov 1, 2026. Store-side setup is in [../google-play/SKILL.md](../google-play/SKILL.md).

## Retention and engagement [eronred]

| Category | D1 | D7 | D30 | Good |
|---|---|---|---|---|
| Games | 25-30% | 10-15% | 3-5% | D1 over 35, D30 over 8 |
| Social | 30-35% | 15-20% | 8-12% | D1 over 40, D30 over 15 |
| Health & Fitness | 20-25% | 10-12% | 4-6% | D1 over 30, D30 over 10 |
| Productivity | 15-20% | 8-10% | 3-5% | D1 over 25, D30 over 8 |
| E-commerce | 15-20% | 5-8% | 2-3% | D1 over 25, D30 over 5 |
| Finance | 20-25% | 10-12% | 5-8% | D1 over 30, D30 over 10 |
| Education | 15-20% | 8-10% | 3-5% | D1 over 25, D30 over 8 |

- **These differ from the general benchmarks** (D1 25-40%, D7 10-20%, D30 5-10%) in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#metrics-and-formulas-eronred); the playbook says benchmarks vary dramatically by category.

| Stage | Days | Tactics |
|---|---|---|
| Activation | 0-1 | The first session decides: users who miss the aha moment in session 1 rarely return. Show core value in under 60 seconds, remove steps, defer account creation, progressive disclosure, a quick win |
| Habit | 1-7 | Personalized push, streaks, daily content, social hooks |
| Deepening | 7-30 | Feature discovery, personalization, community, achievements |
| Long-term | 30+ | Content updates, re-engaging features, win-back, loyalty rewards |

- **Push schedule:** day 1 welcome plus a tip; day 3 value reminder; day 5 social proof; day 7 streak; day 14 feature discovery; day 30 milestone. At most 3-5 notifications per week; always deliver value, never just "Come back!"; personalize; offer granular preferences; A/B test timing and copy.
- **Win back users inactive 7+ days** with email (if you have it), push, and an in-app message on return ("Welcome back! Here's what's new").

## Web-to-app funnels [eronred]

- **Ask first:** web traffic (SEO, paid search, social ads with a web destination, podcast, newsletter); monetization model; current web property; markets (web payment rules differ in the EU and Korea); current funnel metrics.
- **Why (as of 2025):** the stores take a 15-30% fee on subscriptions, which web-billed subscriptions save (about 15-30% of LTV; web-first CAC is typically higher, offset by the saved fee and the email asset); Apple's EU DMA compliance, Korean law, the Dutch dating-app ruling and the DOJ Epic ruling allow more web-payment flexibility; paid social CPMs are cheaper for a web destination; higher trust; email capture before install.

| Pattern | Flow | For |
|---|---|---|
| A | Web, install, in-app paywall | Small purchases, ads, featuring eligibility |
| B | Web quiz plus Stripe payment, then install and sign in | Subscriptions over $5/mo (used by Cal AI, Rise Sleep, Noom, Zing, Future) |
| C | Web email or phone capture, SMS install link, in-app paywall | Lower-priced subscriptions, mobile-first |

- **Pattern B flow:** ad, SEO or TikTok bio; quiz landing; personalized plan; email capture; Stripe checkout; a "Get the app" page with QR code and store badges; install (a deferred deep link carries the paid status); the app calls your backend with the email or token; skip the in-app paywall.
- **Pattern B engineering:** a deferred deep link carrying the email or token (Branch, AppsFlyer, or your own handler after the Universal Link); the backend maps the Stripe customer to the app user on first sign-in; an "Already paid" check on every paywall surface; don't show better-than-IAP pricing in the app if IAP is offered, or use the external payment link entitlement. Web billing through RevenueCat is in [../../backend/revenuecat/SKILL.md](../../backend/revenuecat/SKILL.md).
- **Compliance:** Apple lets users pay on the web but the app can't link to web payment from inside (exceptions: the External Purchase Link Entitlement in the US, EU, Korea and the Netherlands; the reader app exception 3.1.3(a)); the funnel may start on the web and the app may sign in web-paid users. Google offers User Choice Billing in the EEA and some markets and is more flexible about mentioning the web outside checkout. Web, then web payment, then app install, then app sign-in is fully compliant; the constraint is only on in-app linking back out.
- **Smart banners:** Apple Smart App Banner `<meta name="apple-itunes-app">` (free, Safari only); Branch Journeys; AppsFlyer Smart Banner; custom JS (user-agent sniff, Universal Link timeout). Use Universal Links / App Links, pass context (page or item ID), and fall back to the App Store with a deferred deep link that preserves the context.
- **The quiz:** 6-12 questions, mostly multiple choice with images, 30-60 seconds; reactive copy and a progress bar; email capture after the results, before the plan and price; a "Your plan" result; annual as the default, social proof above the CTA; Stripe Checkout in the same tab on mobile, no modal. Build with Next.js + Stripe + Postgres, or no-code Funnelish, Heyflow, GetWaitlist. Weigh Stripe vs Paddle for EU VAT.
- **Compliance checklist:** no in-app links to web checkout (or the entitlement); the privacy policy covers Stripe and the linkage to app data; the store description doesn't mention web payment; Universal Links / App Links verified.
- **Measure every step:** visit, quiz start, email, checkout, paid, install, sign-in, activation.
- **Anti-patterns:** Pattern B without a backend that recognizes paid users (they pay on the web, hit the paywall in the app, and churn); no QR code and "SMS me the link" on desktop success; unverified Universal Links; pricing in the App Store description while charging on the web (a Guideline 3.1.3 violation); no email before payment (loses 30-60% of would-be subscribers to retargeting); a Stripe modal on mobile (use a full-page redirect).

## Rating prompts

- **Use the system prompt, never a custom one.** Apple Guideline 5.6.1: "Use the provided API to prompt users to review your app ... and we will disallow custom review prompts." Guideline 3.2.2(x): never force a rating or review to access functionality. Manipulating reviews "with paid, incentivized, filtered, or fake feedback" may lead to expulsion from the Developer Program. Google Play prohibits "any manipulation of ratings, reviews, or install counts. This includes incentivizing feedback, using forced pop-ups, or paying for fake reviews" (for example, a notification offering a discount for a high rating).

| | Apple (StoreKit) | Google Play In-App Review |
|---|---|---|
| API | SwiftUI `@Environment(\.requestReview)` (`RequestReviewAction`, iOS 16+, macOS 13+, visionOS 1); `AppStore.requestReview(in:)` with a `UIWindowScene` (iOS 16+) or `NSViewController` (macOS 13+) | `ReviewManagerFactory.create(context)`, `manager.requestReviewFlow()`, `manager.launchReviewFlow(activity, reviewInfo)` |
| Deprecated | `SKStoreReviewController` (iOS/iPadOS/Mac Catalyst 18.0, macOS 15.0, visionOS 2.0): "Use AppStore.requestReview(in:)." | |
| Limit | No rating yet on this device: at most 3 times in 365 days. Already rated: only on a new app version and more than 365 days after the previous review | A time-bound quota with no published number; more than one call in a short period ("for example, less than a month") may show nothing |
| From a button | Never: the API may not show an alert | Never: link to the Play Store instead |
| Feedback | | The API doesn't say whether the user reviewed or whether the dialog showed; on errors, don't tell the user or change the flow |
| Devices | | Android 5.0 (API 21)+ phones, tablets, Google TV and ChromeOS with the Play Store; Play Core 1.8.0+ |

- **Persistent review link (Apple):** append `action=write-review` to the product page URL: `https://apps.apple.com/app/idYOURAPPSTOREID?action=write-review`.
- **When to ask:** after demonstrated engagement, at the end of a completed sequence (a level or significant task done); never on first launch, during onboarding, mid-task, or as the result of a user action. Apple's HIG suggests at least a week or two between requests; people can turn review requests off. Google: don't ask any question before or while showing the card ("Do you like the app?", "Would you rate this app 5 stars"), show the card as-is with no overlays on the topmost layer, and never remove it programmatically.
- **Apple's sample gating:** not already prompted for the current bundle version; the process completed at least four times (Apple calls the number arbitrary); pause a few seconds on the completion scene, with a 2-second delay before `await requestReview()`; store `processCompletedCount` and `lastVersionPromptedForReview` in `@AppStorage`.
- **Version resets (Apple HIG):** weigh resetting the summary rating on a new version against showing fewer ratings.
- **Play setup:** `implementation("com.google.android.play:review:2.0.2")` and `implementation("com.google.android.play:review-ktx:2.0.2")`. `ReviewInfo` is valid only for a limited time: pre-cache it only when you are certain to launch the flow.
- **Testing:** Apple always shows the prompt in development and never in TestFlight. Play needs the app on at least the internal test track or internal app sharing, with the tester's account in the track, the primary account selected in the Play Store, the app in their Play library and no existing review; use `FakeReviewManager(context)` in unit and integration tests. Play troubleshooting: quota reached, use the internal test track or internal app sharing; enterprise accounts, use a Gmail account; already reviewed, delete the review.
- **Playbook timing [eronred]:** show the in-app rating prompt after a positive experience, and after shipping a crash fix ([ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#crash-analytics-eronred)). Review replies and rating recovery are in [../aso/SKILL.md](../aso/SKILL.md).

## Prove it

- **Activation:** the activation event is named and tracked, and the funnel from open to activation on day 0 is measured against the benchmark table.
- **Permissions:** no system permission prompt (push, location, contacts, ATT) fires on cold open; each is preceded by a pre-permission screen with [Allow] [Not now].
- **Paywall:** a restore-purchases button and a visible close button exist on every paywall; annual is default-selected with its savings % and monthly equivalent; the paywall says what the user gets for the price before asking to subscribe.
- **Offers (Apple):** in sandbox, an introductory offer shows only to an eligible user; a promotional offer purchase succeeds with a fresh server signature and fails with a reused one; an offer code redeems through the redemption sheet and the server receives `OFFER_REDEEMED`; a win-back purchase arrives in `Transaction.updates` with offer type `winBack`.
- **Offers (Play):** the purchase flow passes the selected offer's `getOfferToken()` to `setOfferToken(...)`, and the app is on Billing Library 8 or later.
- **Lifecycle:** dunning messages fire from billing-failure events (for example RevenueCat webhooks) on the scheduled days, and the grace period is set to the maximum the store allows.
- **Web-to-app:** a user who paid on the web, installs through the deferred deep link and signs in skips the in-app paywall on every paywall surface; the app contains no link to web checkout unless the entitlement is granted.
- **Rating prompts:** no button calls the review API; the prompt is gated on completed engagement and the current version; Play's flow is verified on the internal test track and in tests with `FakeReviewManager`.
