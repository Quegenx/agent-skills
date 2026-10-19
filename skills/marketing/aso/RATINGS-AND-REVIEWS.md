# Ratings and reviews

Ratings feed ranking on both stores (Apple counts "user behavior (downloads, ratings and reviews, and more)") and conversion on the product page. Two levers move them: when you ask (the OS shows the prompt within a quota you don't control, so [eronred]'s core rule is to ask only users who have experienced value) and how you answer the reviews you get. Quotas and rules come from Apple's and Google's docs; [eronred] and [ApparenceKit] (a Flutter starter-kit author) tag third-party practice, and where it differs from Google's in-app review rules both are given. The native APIs are named here; wiring them into a Flutter app's iOS and Android side is beyond this skill.

**Contents:** [How the stores treat ratings](#how-the-stores-treat-ratings) · [When to prompt](#when-to-prompt) · [iOS prompt](#ios-prompt) · [Google Play in-app review](#google-play-in-app-review) · [Pre-prompt questions](#pre-prompt-questions-a-conflict) · [Responding to reviews](#responding-to-reviews) · [Recovering a rating](#recovering-a-rating) · [Prove it](#prove-it)

## How the stores treat ratings

- **App Store:** the summary rating is per territory; only the latest review and developer response per user displays. You can reset the overview rating when releasing a new version ([eronred]: ratings reset per version on request; reset after a major improvement, not after a controversial change).
- **Apple's rules:** "Use the provided API to prompt users to review your app ... we will disallow custom review prompts" (5.6.1); "Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality" (3.2.2(x)); manipulating reviews or inflating chart rankings "with paid, incentivized, filtered, or fake feedback" may lead to expulsion (section 3), and manipulating charts, search, reviews or referrals is not permitted (5.6.3); excessive negative reviews and refund requests may factor into Code of Conduct decisions (5.6.4).
- **Google Play:** new ratings and reviews are generally held back for around 24 hours before becoming public. Ratings are continuous and cumulative, never reset [eronred]; reviews and replies are indexed for search [eronred].
- **Targets** [eronred]: average 4.5+ ("Below 4.0 significantly hurts conversion"; [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/): "An app at 4.5 stars will outrank a similar app at 3.8 stars, even with fewer downloads"); reply to 100% of negative reviews; reply within 24 hours.

## When to prompt

Source: [eronred].

- **Core rule:** only prompt users who have experienced value: after a positive moment, never after a crash or error, never during onboarding or the first session.
- **Criteria:**

  ```
  Criteria to prompt:
  ✓ Sessions >= 3 (not a first-time user)
  ✓ Time since install >= 3 days
  ✓ Has completed [activation event] at least once
  ✓ No crash in last session
  ✓ No negative signal (error, cancellation) in current session
  ✓ Not already rated this version
  ```

- **Time conflict:** [eronred, review-management] says at least 7 days of usage (and 3+ uses); [eronred, rating-prompt] says at least 3 days since install. These are upstream source skills, not the separate local marketing/review-management skill.
- **Success moments by app type:** fitness after a workout, games after winning a level, shopping after a successful purchase.
- **Frequency:** iOS at most 3 times per 365 days, recommended 1 to 2 per version; Android recommended once per 30 days per user; never twice in one session.
- **Don't prompt users who left a negative review.**

## iOS prompt

- **API:** call `AppStore.requestReview(in:)`, or in SwiftUI read the `RequestReviewAction` from the environment ([Apple, StoreKit](https://developer.apple.com/documentation/storekit/skstorereviewcontroller)). Apple marks `SKStoreReviewController` "iOS 10.3 to 18.0 Deprecated ... Use `RequestReviewAction` instead" and `requestReview(in:)` "Deprecated. Use AppStore.requestReview(in:)." This file used to name `SKStoreReviewController` and `SKStoreReviewController.requestReview(in: scene)`; [coreyhaines31/marketingskills, aso] uses the same old name.
- **Quota:** "You can prompt for ratings up to three times in a 365-day period." [ApparenceKit](https://apparencekit.dev/flutter-tips/get-app-reviews-smart-way/) says "Apple stores limit asking with the native popup to 2 times a year", which is wrong against Apple's number (the same author's ASO post says 3 per year [ApparenceKit](https://apparencekit.dev/blog/aso-flutter-app-store-optimization/)).
- **Behaviour** [eronred]: Apple controls whether the prompt displays and it can't be customized; you control only when you call the request API.

## Google Play in-app review

- **Devices:** Android 5.0 (API 21)+ phones, tablets and Google TV with the Play Store, and ChromeOS with the Play Store; needs Play Core 1.8.0 or higher. Official integrations: Kotlin/Java, Native, Unity, Unreal.
- **When:** trigger after the user has experienced enough of the app, and don't prompt excessively.
- **Dependencies and flow:** `com.google.android.play:review:2.0.2` and `com.google.android.play:review-ktx:2.0.2`; `ReviewManagerFactory.create(context)` > `requestReviewFlow()` > `launchReviewFlow(activity, reviewInfo)`. `ReviewInfo` is valid for a limited time; pre-cache it only when you're sure you'll launch.
- **No result:** "The API does not indicate whether the user reviewed or not, or even whether the review dialog was shown"; on error, don't tell the user or change the flow.
- **Quota:** time-bound; calling `launchReviewFlow` more than once in a short period (e.g. less than a month) may show nothing, and the quota can change without notice. [ApparenceKit](https://apparencekit.dev/flutter-tips/get-app-reviews-smart-way/)'s "nearly 2 times every 3 months" is not a Google number; treat it as unverified. Don't put the API behind a button; send a button to the Play Store instead.
- **Show the card as-is:** no size, opacity or shape changes, no overlays, topmost layer, never removed programmatically.
- **Test:** `FakeReviewManager(context)` in unit and integration tests (no UI). On the internal test track the tester must be on the testers list, have the primary account selected in the Play Store, have the app in their library and no existing review; "The quota limits are not enforced if the app is downloaded from the internal test track." Internal app sharing can't submit reviews (the button is disabled).
- More Play setup is in [google-play SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/google-play/SKILL.md).

## Pre-prompt questions: a conflict

- **[eronred]** recommends a pre-prompt survey, "Are you enjoying [App Name]?": Yes opens the native prompt, "Not really" opens a feedback form and never the native prompt; it claims an "expected improvement: 0.3 to 0.8 stars".
- **[ApparenceKit] also backs a pre-prompt:** "Make your own screen or card in your app that asks if the user is willing to provide feedback ... This pre-screen should simply gauge their willingness to rate, not push them towards a specific rating or button. If they agree, *then* you can potentially trigger the native store review prompt (if available and within limits) or direct them to the store page" [ApparenceKit](https://apparencekit.dev/flutter-tips/get-app-reviews-smart-way/); "many apps use a pre-popup dialog" so "only genuinely engaged and satisfied users are prompted" [ApparenceKit](https://apparencekit.dev/flutter-tips/smart-rating/); its starter kit asks whether the user "has 10 seconds to give your app a rating", stores the last request time and answer, and never re-asks after "Yes" ([ApparenceKit](https://apparencekit.dev/blog/apparencekit-cli-3-update/)).
- **Google** says don't ask any questions before or while presenting the in-app review card, naming "Do you like the app?" and "Would you rate this app 5 stars" as examples. Don't put such a gate in front of the Play card: on Play, Google's rule wins over every third-party source above.
- **Apple** lists "paid, incentivized, filtered, or fake feedback" as review manipulation that may lead to expulsion (section 3 intro) and disallows custom review prompts (5.6.1); confirm a pre-prompt against the current guidelines before shipping it on iOS.
- **Never ask users to change a rating** ("against guidelines") **or offer incentives for reviews** [eronred]. A paid research interview or survey is never tied to leaving a review ([customer-research INTERVIEWS-AND-SURVEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/INTERVIEWS-AND-SURVEYS.md#incentives)).
- **Off the stores:** Google's equivalents for Maps reviews (no gating, no incentives) are in [seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md#what-google-forbids); review programs for G2, Capterra and Trustpilot are in [review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md); review stars in a website's structured data are in [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md#reviews-and-ratings).

## Responding to reviews

Source: [eronred].

- **Sort reviews into:** bugs and crashes, feature requests, UX complaints, pricing complaints, love and praise, competitor mentions. Mining feedback for research (rather than replying) splits further, keeping confusion and expectation mismatches apart from bugs and missing features ([customer-research SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md)), and reads app reviews 1 to 2 stars first, then 3, then 5 ([customer-research SOURCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SOURCES.md#consumer-products)).
- **Apple 5.6.1** ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)): "do not include personal information, spam, or marketing in your response". [coreyhaines31/marketingskills, referrals] adds for public replies: no CRM or private data, separate the reviewer's assertion from verified fact, and don't promise a refund or resolution that hasn't happened ([review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md#replying-to-a-review)).
- **HEAR:** Hear (acknowledge the specific issue they mentioned), Empathize (show you understand their frustration), Act (explain what you're doing about it, or have done), Resolve (invite them to contact support for direct help).
- **Templates:**
  - Bug report: "Thank you for reporting this, [name]. We identified the issue and it's fixed in version [X.X] releasing [date]. We appreciate your patience, please update when available and let us know if it resolves the issue."
  - Feature request: "Great suggestion! We've added this to our roadmap. We're always looking to improve based on user feedback. Stay tuned for upcoming updates."
  - Vague negative ("This app sucks"): "We're sorry to hear about your experience. We'd love to understand what went wrong so we can improve. Could you reach out to [support email] with details? We're here to help."
- **Don't:** reply defensively, copy-paste the same reply, ignore negatives, ask users to change their rating, or offer incentives.
- **Play:** reply to every 1 to 3 star review ("boosts score algorithmically"); replies invite re-rating; reply "Fixed in version X.X" once the fix ships.
- **Review data (third-party):** Appeeky `GET /v1/apps/:id/reviews?sort=recent&limit=20` or the MCP tool `get_app_reviews`.
- **A root cause in the product** (crashes, onboarding) needs crash analysis or onboarding work alongside replies and prompts.

## Recovering a rating

Source: [eronred].

| When | Step |
|---|---|
| Day 0 | identify the cause |
| Day 1 to 3 | reply to every negative review |
| Day 7 | ship the fix and reply "Fixed in X.X" |
| Day 8+ | prompt users with sessions >= 5 and no crash in the last 7 days |
| Week 3 | expect +0.2 to 0.5 stars over 2 to 4 weeks |

- **After a rating reset on iOS:** run a filtered prompt campaign in the first 7 days aimed at the most engaged users.

## Prove it

- The prompt fires only after the activation event, never in the first session or after a crash or error in the session, and never twice in one session.
- iOS requests stay within three per 365 days per device; the Play card is never behind a button, never preceded by a question, and shown unmodified.
- Play review flows are tested with `FakeReviewManager` and on the internal test track.
- Every 1 to 3 star review has a reply within 24 hours, none ask for a changed rating or offer a reward.
