# Retention and monetization

Turning installs into active, paying, returning users: onboarding to the activation event, the paywall and pricing, the subscription lifecycle from trial to win-back, retention loops, web-to-app funnels, and asking for ratings. What decides most outcomes is timing against the user's first value moment: permissions, the paywall, the ATT prompt and the rating prompt all convert better after it and do damage before it. Apple's and Google's docs are the authority for every offer type, limit and guideline here; bullets tagged [eronred] are a third-party playbook whose benchmarks and percentages are its author's claims, and where the two differ both are given. Bullets tagged [ApparenceKit] come from apparencekit.dev, a Flutter starter-kit author's posts about his own apps; its numbers are his claims. Bullets tagged [coreyhaines31/marketingskills, <skill>] come from Corey Haines' MIT-licensed marketing skills, written for web SaaS; their benchmarks are the author's claims, and the web versions of these topics live in the marketing set (linked where they apply). The paywall itself is in [PAYWALLS.md](PAYWALLS.md). Offer types and their limits per store are in [SUBSCRIPTION-OFFERS.md](SUBSCRIPTION-OFFERS.md); purchase code, entitlements, paywalls, webhooks and dunning tooling are in [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md); event names for these funnels are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#event-tracking-plan); store-side rating strategy and review replies are in [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md).

**Contents:** [Onboarding and activation](#onboarding-and-activation) · [Monetization model and pricing](#monetization-model-and-pricing) · [Paywalls](#paywalls) · [Trials](#trials) · [Subscription lifecycle](#subscription-lifecycle) · [Retention and engagement](#retention-and-engagement) · [Web-to-app funnels](#web-to-app-funnels) · [Rating prompts](#rating-prompts) · [Prove it](#prove-it)

## Onboarding and activation

- **The activation event, the screen audit, permission timing, sign-up friction, onboarding flows and the onboarding paywall** are in [ONBOARDING.md](ONBOARDING.md).

## Monetization model and pricing

Source: [eronred].

| Model | Fits |
|---|---|
| Freemium + Subscription | Productivity, health, education |
| Freemium + IAP | Games, social, utilities |
| Paid upfront | Niche tools |
| Free + Ads | Content, casual games; low ARPU, hurts UX |
| Hybrid | Most apps |

- **The models, per [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/):** paid upfront "is dying for most categories" ($4.99 once earns far less over a lifetime than $4.99/month) and still fits utilities used once or occasionally; consumables (credits, tokens, coins) suit AI apps, games and content apps ("Users pay for what they use. No commitment. Low friction."); ads fit "high volume and low engagement" apps (utilities, games, content aggregators), rewarded ads complement IAP or freemium, and never build on ad revenue alone. Freemium gates features, usage limits ("free users get 5 exports per month, paid get unlimited"), content (previews vs full) or ads removal; hard paywalls convert better but can raise churn when value is unclear, so test (the author prefers freemium). "B2B pays more than B2C. Health pays more than entertainment. Niche pays more than generic." Pick the model before writing code, build the paywall into the MVP, and track events from day one.
- **What to gate** [coreyhaines31/marketingskills, pricing]: "don't gate the feature that delivers your core value; gate the ones that separate casual from serious users." Web SaaS pricing models, value metrics and tiers are in [pricing-strategy MODELS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/MODELS.md).

- **Tiers:** Free (core value with limits); Monthly at $X.99 (the anchor for annual); Annual at a 40-60% discount vs monthly (the SaaS pricing source [coreyhaines31/marketingskills, pricing] puts an "Annual discount callout (17-20%)" on web pricing pages; the two figures are for different audiences); Lifetime at 2-3x the annual price; Family at 1.5-2x the individual price.
- **Price psychology:** end in .99; anchor on monthly and push annual ("Save 50%"); state expensive subscriptions as a weekly price ("Just $1.99/week"); offer 3 tiers Good/Better/Best, since most users pick the middle. [coreyhaines31/marketingskills, pricing] adds the exception: "Charm pricing: $49 vs. $50 (for value-focused)"; "Round pricing: $50 vs. $49 (for premium)".
- **A weekly or monthly breakdown never hides the total.** The FTC lists "listing the price per payment (such as $10 per week) without disclosing the total number of payments or overall cost" as a dark pattern (Bringing Dark Patterns to Light, 2022, https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf), and both stores make the billed amount the most prominent price ([PAYWALLS.md](PAYWALLS.md#store-rules-for-the-paywall)). The FTC rules for prices, discounts and per-period claims are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#installments-and-per-period-prices).
- **Weekly vs monthly: the sources differ.** [eronred] (above) anchors on monthly and offers weekly only as the category norm. [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/): "**Monthly** not the best in 2026. All report show a drop in conversion compared to weekly. Users prefer shorter commitments"; weekly suits daily-use, high-engagement apps (fitness, AI assistants) but churns more; yearly works "when users trust the value: offer a discount to push them here"; "$4.99/week vs $9.99/month can make a 3x difference in revenue." The reports it cites are not named.

| Category | Monthly | Annual |
|---|---|---|
| Productivity | $4.99-$9.99 | $29.99-$49.99 |
| Health & Fitness | $9.99-$14.99 | $49.99-$79.99 |
| Education | $9.99-$19.99 | $49.99-$99.99 |
| Photo & Video | $4.99-$9.99 | $29.99-$49.99 |
| Games | $4.99-$9.99 | $29.99-$49.99 |
| Finance | $4.99-$14.99 | $29.99-$79.99 |

- **These are consumer-app prices.** For web SaaS, [coreyhaines31/marketingskills, pricing] starts from "~$10/mo" for prosumers and individuals, "~$100/mo" for SMB and team tools ("the SaaS default") and "~$1,000/mo" for mid-market and sales-assisted products; keep each table to its audience.
- **Raising a subscription price follows the store's rules,** not a staged rollout to a share of subscribers: Apple asks for consent when the subscriber's region requires consent for any price change, when the increase is more than 50% and exceeds about US$5 per period (US$50 a year for annual), or when the subscriber already had an increase on that subscription in the past 12 months, and otherwise notifies before renewal; Google Play makes increases opt-in by default and cancels subscribers who don't accept (https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions, https://developer.android.com/google/play/billing/price-changes). Both stores' rules side by side are in [pricing-strategy PRICE-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/PRICE-CHANGES.md#app-store-and-google-play-subscriptions); each store's own steps are in [app-store-connect PRICING-AND-SUBSCRIPTIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#price-increases-for-existing-subscribers) and [google-play PRICING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/PRICING.md#existing-subscribers), and the Play Subscriptions policy in [google-play BILLING-AND-PURCHASES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/BILLING-AND-PURCHASES.md#subscriptions-policy).

- **In-app purchases:** consumables: anchor with the expensive option first, "Best Value" bundles, limited-time offers, starter packs. Non-consumables: unlock features individually, bundles, a one-time "Pro Upgrade" as an alternative to subscription.
- **Revenue targets:** ARPPU 3-10x ARPU; paying conversion (Paying / Total) 2-10%; trial-to-paid 40-60%; LTV over CAC; freemium conversion "Typical ... is 2-5%. Good is 5-10%. If you're above 10% you're doing great" [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/); Payback Period = CAC / Monthly ARPU under 6 months. Levers: conversion, price (often works better than expected), churn, extra revenue streams, pushing annual. ROAS and payback against ad spend are in [BUDGET-AND-ROAS.md](BUDGET-AND-ROAS.md).
- **The playbooks disagree on trial-to-paid:** 40-60% (monetization), 25-40% is strong (subscription lifecycle), 25-60% healthy and under 15% a red flag (paywall). They also disagree on LTV: ARPU x Avg Lifetime (analytics, monetization) vs ARPU / Monthly churn rate (subscription lifecycle). Web SaaS figures measure a different population: [coreyhaines31/marketingskills, pricing] gives "Higher trial-to-paid conversion (40-50% vs. 15-25%)" for card-upfront trials, and [coreyhaines31/marketingskills, onboarding] cites ChartMogul (200 B2B products) at about 30% trial-to-paid for card-required trials. A store trial always has a payment method on file, so compare app trials only with card-required ones.

## Paywalls

- **The paywall funnel, the seven-element audit, placement, display, A/B tests and the store rules for the layout** are in [PAYWALLS.md](PAYWALLS.md).

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

- **Web SaaS trials run longer:** [coreyhaines31/marketingskills, pricing] gives "7-14 days for simple products" and "14-30 days for complex products", with "Full access (not feature-limited)". It also names the reverse trial: "Start with full access", then "After trial, downgrade to free tier" (more in [pricing-strategy TIERS-AND-TRIALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/TIERS-AND-TRIALS.md)).

- **Psychology the trial leans on** [coreyhaines31/marketingskills, marketing-psychology, no study cited]: the Endowment Effect ("Free trials, samples, and freemium models let customers 'own' the product"), the Zeigarnik Effect ("'You're 80% done' creates pull to finish") and the Peak-End Rule ("Design memorable peaks... and strong endings"); more in [growth-ideas PSYCHOLOGY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md#endowment-effect).
- **Test a 7-day vs a 14-day trial on monthly apps:** conversion may drop slightly, but LTV often rises.
- **Platform limits:** Apple free trials come in 3 Days, 1 or 2 Weeks, 1, 2, 3 or 6 Months, or 1 Year; Google Play free trials run 3 days to 3 years. Details are in [SUBSCRIPTION-OFFERS.md](SUBSCRIPTION-OFFERS.md).
- **A store trial converts on its own.** Google Play requires telling users, before they enroll, "how and when a free trial will convert to a paid subscription, how much the paid subscription will cost, and how a user can cancel if they do not want to convert" (https://support.google.com/googleplay/android-developer/answer/9900533). A trial-end screen with "Continue with Pro" or "Remind me later" buttons [coreyhaines31/marketingskills, paywalls] models a web trial that lapses; in a store app it says when the charge happens and how to cancel.
- **Run the trial [eronred]:** value reminders on days 1, 3 and 5; a trial countdown ("3 days left"); a discounted first period at trial end; easy cancellation (builds trust, reduces refund requests). Nurture schedule for a 7-day trial: day 0 welcome; day 1 core feature; day 3 progress or social proof; day 5 "2 days left"; day 6 value recap; day 7 "Your trial ends today". Show value, not just pressure. The countdown is honest because the trial really ends that day; a countdown that resets or has no real deadline is an FTC dark pattern ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)). The discounted first period conflicts with "Never discount to acquire" [coreyhaines31/marketingskills, offers]: trial users are not yet customers, and that source keeps discounts for existing customers. The trial-end paywall recaps achievements and the most-used premium features, shows 3 plans and the annual saving ("Save 40%").

## Subscription lifecycle

Source: [eronred].

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
- **Read the survey per reason** [coreyhaines31/marketingskills, customer-research]: "Segment by reason, don't average across different churn causes."
- **Lead with a discount or keep it last: the sources differ.** [eronred] (above) offers a discount "only as a last resort". [coreyhaines31/marketingskills, churn-prevention] maps each reason to a primary and a fallback offer and leads "Too expensive" with "Discount (20-30% for 2-3 months)", then "Downgrade to lower plan"; it also says "Avoid 50%+ discounts (trains customers to cancel for deals)". Its web cancel flow, survey and offer table are in [churn-prevention CANCEL-FLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/CANCEL-FLOWS.md#match-the-offer-to-the-reason).
- **On iOS the cancel screen belongs to Apple.** The Retention Messaging API is "a server-to-server service that enables you to select which message the system displays to customers when they view a subscription details page and might cancel": text (bullets optional), text with image, a switch-plan message or a promotional-offer message, shown on the Confirm Cancellation page after the user taps Cancel Subscription. Each product needs a default message per locale ("The system doesn't display a retention message for a product in any locale that lacks a default retention message"), offers need the real-time flow, and "Don't upload content that is misleading or inaccurate." Apple marks it pre-release with a "Request access" link (https://developer.apple.com/documentation/retentionmessaging).
- **US law: a simple way to stop.** ROSCA (15 U.S.C. 8403) requires disclosing all material terms before taking billing information, express informed consent before charging, and "simple mechanisms for a consumer to stop recurring charges" (https://www.law.cornell.edu/uscode/text/15/8403); the FTC's 2024 click-to-cancel rule was vacated on July 8, 2025. Details are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation).
- **Churn-risk signals:** sessions under 1 per week (down from baseline); core feature unused for 14+ days; push disabled; last session over 7 days ago. Trigger a re-engagement push or in-app message before they cancel. A subscription with renewal off (`willRenew == false`) is the moment to "reach out and maybe show them a special deal before they leave" [ApparenceKit](https://apparencekit.dev/flutter-tips/check-user-subscription-renewal-status/); the Dart check is in [revenuecat FLUTTER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/FLUTTER.md#customer-info-and-entitlement-gates).
- **Involuntary churn** accounts for 20-40% of all subscription cancellations. Dunning schedule: day 0 payment fails and the store retries; day 3 retry #2; day 7 retry #3 plus an in-app "Update payment method" banner; day 10 push; day 14 grace period ends, access suspended; day 15 final in-app "Reactivate". Apple retries billing "for up to 60 days", sends `DID_FAIL_TO_RENEW` on failure and `DID_RECOVER` on recovery ("The `RENEWAL` notification type is scheduled for deprecation"), and the banner can deep-link to `https://apps.apple.com/account/billing` ("only supported for iOS and macOS") (https://developer.apple.com/documentation/storekit/reducing-involuntary-subscriber-churn).
- **Grace period, as the stores set it:** Apple's billing grace period is 3 or 6 days for weekly subscriptions and 3, 16 or 28 days for monthly and longer ("even if you select a 16 or 28 day grace period, the actual grace period will only be 6 days" for weekly); it applies to "All Renewals" or "Only Paid to Paid Renewals", edits "will only apply to upcoming renewals", and it "doesn't apply for monthly subscriptions with a 12 month commitment" (https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions). Google Play enables a grace period (access kept) and account hold (access blocked) by default on every auto-renewing base plan; "You can set a grace period of 0 days, but Play will wait a minimum of 1 day", account hold lasts "60 days minus any grace period duration", and "Specifying a length less than the default value may reduce the number of subscriptions recovered" (https://developer.android.com/google/play/billing/lifecycle/subscriptions). Set each to the longest the store offers. Before this fix the line said the playbook gives "iOS 6 days (configurable up to 16 in App Store Connect) and Android 3 days (configurable)"; Apple's maximum is 28.
- **With RevenueCat:** it handles dunning automatically; enable Billing Retry (iOS) and Account Hold (Android); set the grace period to the maximum; use webhooks to trigger in-app messaging at each failure event ([revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md)).
- **Win-back ladder** for subscribers who cancelled or expired in the last 30-90 days; start with the softest offer and escalate only if there is no response: week 1 "We miss you" plus new features; week 3 30% off the first month back; week 6 3 months at 50% off; week 12+ archive. Channels: push, email, Apple win-back offers, paid retargeting to the lapsed list. [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/) adds discounts and promotions "for users that use your app and not pay". The ladder's 50% conflicts with [coreyhaines31/marketingskills, churn-prevention] ("Avoid 50%+ discounts", and "Never exceed 30%" in its save ladder), and its email win-back runs day 30 "What's new since you left", day 60 "We've addressed [common reason]", day 90 an offer, "No guilt, no desperation" [coreyhaines31/marketingskills, emails].
- **The email side** of the trial nurture is in [email-marketing SEQUENCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SEQUENCES.md#onboarding), failed-payment notices and win-back (both ladders side by side) in [email-marketing LIFECYCLE-EMAILS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/LIFECYCLE-EMAILS.md#win-back); web dunning copy and in-app banners are in [churn-prevention DUNNING-COPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/DUNNING-COPY.md).

## Retention and engagement

Source: [eronred].

| Category | D1 | D7 | D30 | Good |
|---|---|---|---|---|
| Games | 25-30% | 10-15% | 3-5% | D1 over 35, D30 over 8 |
| Social | 30-35% | 15-20% | 8-12% | D1 over 40, D30 over 15 |
| Health & Fitness | 20-25% | 10-12% | 4-6% | D1 over 30, D30 over 10 |
| Productivity | 15-20% | 8-10% | 3-5% | D1 over 25, D30 over 8 |
| E-commerce | 15-20% | 5-8% | 2-3% | D1 over 25, D30 over 5 |
| Finance | 20-25% | 10-12% | 5-8% | D1 over 30, D30 over 10 |
| Education | 15-20% | 8-10% | 3-5% | D1 over 25, D30 over 8 |

- **These differ from the general benchmarks** (D1 25-40%, D7 10-20%, D30 5-10%) in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#metrics-and-formulas); the playbook says benchmarks vary dramatically by category.

| Stage | Days | Tactics |
|---|---|---|
| Activation | 0-1 | The first session decides: users who miss the aha moment in session 1 rarely return. Show core value in under 60 seconds, remove steps, defer account creation, progressive disclosure, a quick win |
| Habit | 1-7 | Personalized push, streaks, daily content, social hooks |
| Deepening | 7-30 | Feature discovery, personalization, community, achievements |
| Long-term | 30+ | Content updates, re-engaging features, win-back, loyalty rewards |

- **Push schedule:** day 1 welcome plus a tip; day 3 value reminder; day 5 social proof; day 7 streak; day 14 feature discovery; day 30 milestone. At most 3-5 notifications per week; always deliver value, never just "Come back!"; personalize; offer granular preferences; A/B test timing and copy.
- **Win back users inactive 7+ days** with email (if you have it), push, and an in-app message on return ("Welcome back! Here's what's new").
- **Show what's new once per version** [ApparenceKit](https://apparencekit.dev/blog/apparencekit-flutter-template-v5-release/): an "update log bottom sheet" shown once to every user after an update. Building the in-app changelog in Flutter is in [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#changelog-after-update); the store's What's New field is a different thing ([aso KEYWORDS-AND-METADATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/KEYWORDS-AND-METADATA.md#description-promotional-text-whats-new)).
- **In-app feature voting** [ApparenceKit](https://apparencekit.dev/blog/flutter-feedback-template-release/): "One vote per user, per feature is allowed"; requested features "won't be displayed on the vote page directly. As we don't want someone showing up crazy things on your vote page. You want to filter first." In-app beats a web form because "users don't want to open a browser" (the author claims "more than 300% increase in feature requests" in his own apps), and users "feel like they are part of the app".

## Web-to-app funnels

Source: [eronred].

- **Ask first:** web traffic (SEO, paid search, social ads with a web destination, podcast, newsletter); monetization model; current web property; markets (web payment rules differ in the EU and Korea); current funnel metrics.
- **Why (as of 2025):** the stores take a 15-30% fee on subscriptions, which web-billed subscriptions save (about 15-30% of LTV; web-first CAC is typically higher, offset by the saved fee and the email asset); Apple's EU DMA compliance, Korean law, the Dutch dating-app ruling and the DOJ Epic ruling allow more web-payment flexibility; paid social CPMs are cheaper for a web destination; higher trust; email capture before install.

| Pattern | Flow | For |
|---|---|---|
| A | Web, install, in-app paywall | Small purchases, ads, featuring eligibility |
| B | Web quiz plus Stripe payment, then install and sign in | Subscriptions over $5/mo (used by Cal AI, Rise Sleep, Noom, Zing, Future) |
| C | Web email or phone capture, SMS install link, in-app paywall | Lower-priced subscriptions, mobile-first |

- **Pattern B flow:** ad, SEO or TikTok bio; quiz landing; personalized plan; email capture; Stripe checkout; a "Get the app" page with QR code and store badges; install (a deferred deep link carries the paid status); the app calls your backend with the email or token; skip the in-app paywall.
- **Pattern B engineering:** a deferred deep link carrying the email or token (Branch, AppsFlyer, or your own handler after the Universal Link); the backend maps the Stripe customer to the app user on first sign-in; an "Already paid" check on every paywall surface; apply the actual storefront's payment/link conditions rather than a global better-than-IAP-price ban ([store purchase rules](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#external-purchase-links-us-and-eu)). Web billing through RevenueCat is in [revenuecat SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md).
- **Compliance:** check the app category, storefront, entitlement and actual purchase/consumption flow against [Apple's regional purchase rules](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#external-purchase-links-us-and-eu) and [Play Billing policy](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/BILLING-AND-PURCHASES.md#subscriptions-policy). US storefront external links/buttons do not require these Apple entitlements. The source incorrectly listed a US entitlement requirement and certified every web-payment-then-install flow as "fully compliant" based only on ordering; ordering alone does not establish compliance. [https://developer.apple.com/app-store/review/guidelines/]
- **Smart banners:** Apple Smart App Banner `<meta name="apple-itunes-app">` (free, Safari only); Branch Journeys; AppsFlyer Smart Banner; custom JS (user-agent sniff, Universal Link timeout). Use Universal Links / App Links, pass context (page or item ID), and fall back to the App Store with a deferred deep link that preserves the context.
- **The quiz:** 6-12 questions, mostly multiple choice with images, 30-60 seconds; reactive copy and a progress bar; email capture after the results, before the plan and price; a "Your plan" result; annual as the default, social proof above the CTA; Stripe Checkout in the same tab on mobile, no modal. Build with Next.js + Stripe + Postgres, or no-code Funnelish, Heyflow, GetWaitlist. Weigh Stripe vs Paddle for EU VAT.
- **Compliance checklist:** the actual storefront/category payment and metadata rules are met, rather than a blanket ban on links or payment mentions; the privacy policy covers Stripe and linkage to app data, and Universal Links / App Links verify. The source applied the same entitlement/description restriction everywhere. [https://developer.apple.com/app-store/review/guidelines/; eronred, web-to-app]
- **Measure every step:** visit, quiz start, email, checkout, paid, install, sign-in, activation.
- **Anti-patterns:** Pattern B without a backend that recognizes paid users (they pay on the web, hit the paywall in the app, and churn); no QR code and "SMS me the link" on desktop success; unverified Universal Links; payment/metadata claims that violate the applicable storefront rule (the source treated every such price mention as a 3.1.3 violation); no email before payment (loses 30-60% of would-be subscribers to retargeting); a Stripe modal on mobile (use a full-page redirect).

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

- **ApparenceKit's quota numbers are wrong.** [ApparenceKit](https://apparencekit.dev/flutter-tips/get-app-reviews-smart-way/) says "Apple stores limit asking with the native popup to 2 times a year" and Play "nearly 2 times every 3 months"; the same author elsewhere says 3 a year. Apple's number is the one in the table (3 in 365 days); Google publishes no number, so treat 2 per 3 months as unverified.
- **Persistent review link (Apple):** append `action=write-review` to the product page URL: `https://apps.apple.com/app/idYOURAPPSTOREID?action=write-review`.
- **When to ask:** after demonstrated engagement, at the end of a completed sequence (a level or significant task done); never on first launch, during onboarding, mid-task, or as the result of a user action. Apple's HIG suggests at least a week or two between requests; people can turn review requests off. Google: don't ask any question before or while showing the card ("Do you like the app?", "Would you rate this app 5 stars"), show the card as-is with no overlays on the topmost layer, and never remove it programmatically.
- **Happy-moment timing is not sentiment filtering.** The FTC's Consumer Reviews and Testimonials Rule (effective October 21, 2024) "does not contain a specific prohibition" on asking only happy customers, but "this practice could violate the FTC Act" (Endorsement Guides 16 CFR 255.2(d) and (e)(11), https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers); an incentive may never depend on the review being positive (16 CFR 465.4). Time the system prompt to completed engagement; never decide whom to ask from a satisfaction answer.
- **Apple's sample gating:** not already prompted for the current bundle version; the process completed at least four times (Apple calls the number arbitrary); pause a few seconds on the completion scene, with a 2-second delay before `await requestReview()`; store `processCompletedCount` and `lastVersionPromptedForReview` in `@AppStorage`. The same throttle in [ApparenceKit](https://apparencekit.dev/blog/apparencekit-cli-3-update/)'s rating helper: save "the last request time and user answer", don't show again after a recent request (a configurable delay) or once the user said "Yes".
- **Pre-prompt questions:** [eronred] and ApparenceKit ask ("if he has 10 seconds to give your app a rating") before the system prompt; Google forbids any question before the Play card. Both sides are in [aso RATINGS-AND-REVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/RATINGS-AND-REVIEWS.md#pre-prompt-questions-a-conflict); on Play, follow Google.
- **Version resets (Apple HIG):** weigh resetting the summary rating on a new version against showing fewer ratings.
- **Play setup:** `implementation("com.google.android.play:review:2.0.2")` and `implementation("com.google.android.play:review-ktx:2.0.2")`. `ReviewInfo` is valid only for a limited time: pre-cache it only when you are certain to launch the flow.
- **Testing:** Apple always shows the prompt in development and never in TestFlight. Play needs the app on at least the internal test track or internal app sharing, with the tester's account in the track, the primary account selected in the Play Store, the app in their Play library and no existing review; use `FakeReviewManager(context)` in unit and integration tests. Play troubleshooting: quota reached, use the internal test track or internal app sharing; enterprise accounts, use a Gmail account; already reviewed, delete the review.
- **Playbook timing [eronred]:** show the in-app rating prompt after a positive experience, and after shipping a crash fix ([ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#crash-analytics)). Review replies and rating recovery are in [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md).

## Prove it

- **Onboarding:** the checks in [ONBOARDING.md](ONBOARDING.md#prove-it) pass.
- **Paywall:** the checks in [PAYWALLS.md](PAYWALLS.md#prove-it) pass.
- **Lifecycle:** dunning messages fire from billing-failure events (for example RevenueCat webhooks) on the scheduled days, and the grace period is set to the maximum the store allows.
- **Web-to-app:** a user who paid on the web, installs through the deferred deep link and signs in skips the in-app paywall on every paywall surface; the actual storefront-specific payment and link conditions are satisfied, including the US exception to these entitlement requirements ([store rules](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/PRICING-AND-SUBSCRIPTIONS.md#external-purchase-links-us-and-eu)).
- **Rating prompts:** no button calls the review API; the prompt is gated on completed engagement and the current version; Play's flow is verified on the internal test track and in tests with `FakeReviewManager`.
