# Ratings and reviews

Ratings feed ranking on both stores (Apple counts "user behavior (downloads, ratings and reviews, and more)") and conversion on the product page. Two levers move them: when you ask (the OS shows the prompt within a quota you don't control, so [eronred]'s core rule is to ask only users who have experienced value) and how you answer the reviews you get. Quotas and rules come from Apple's and Google's docs; [eronred] tags third-party practice, and where it differs from Google's in-app review rules both are given. The native APIs are named here; wiring them into a Flutter app's iOS and Android side is beyond this skill.

**Contents:** [How the stores treat ratings](#how-the-stores-treat-ratings) · [When to prompt](#when-to-prompt-eronred) · [iOS prompt](#ios-prompt) · [Google Play in-app review](#google-play-in-app-review) · [Pre-prompt questions](#pre-prompt-questions-a-conflict) · [Responding to reviews](#responding-to-reviews-eronred) · [Recovering a rating](#recovering-a-rating-eronred) · [Prove it](#prove-it)

## How the stores treat ratings

- **App Store:** the summary rating is per territory; only the latest review and developer response per user displays. You can reset the overview rating when releasing a new version ([eronred]: ratings reset per version on request; reset after a major improvement, not after a controversial change).
- **Apple's rules:** "Use the provided API to prompt users to review your app ... we will disallow custom review prompts" (5.6.1); "Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality" (3.2.2(x)); manipulating reviews or inflating chart rankings "with paid, incentivized, filtered, or fake feedback" may lead to expulsion (section 3), and manipulating charts, search, reviews or referrals is not permitted (5.6.3); excessive negative reviews and refund requests may factor into Code of Conduct decisions (5.6.4).
- **Google Play:** new ratings and reviews are generally held back for around 24 hours before becoming public. Ratings are continuous and cumulative, never reset [eronred]; reviews and replies are indexed for search [eronred].
- **Targets** [eronred]: average 4.5+ ("Below 4.0 significantly hurts conversion"); reply to 100% of negative reviews; reply within 24 hours.

## When to prompt [eronred]

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

- **Time conflict:** the review-management skill says at least 7 days of usage (and 3+ uses); the rating-prompt skill says at least 3 days since install.
- **Success moments by app type:** fitness after a workout, games after winning a level, shopping after a successful purchase.
- **Frequency:** iOS at most 3 times per 365 days, recommended 1 to 2 per version; Android recommended once per 30 days per user; never twice in one session.
- **Don't prompt users who left a negative review.**

## iOS prompt

- **Quota:** with `SKStoreReviewController` "You can prompt for ratings up to three times in a 365-day period."
- **Behaviour** [eronred]: Apple controls whether the prompt displays and it can't be customized; you control only when you call `SKStoreReviewController.requestReview(in: scene)`.

## Google Play in-app review

- **Devices:** Android 5.0 (API 21)+ phones, tablets and Google TV with the Play Store, and ChromeOS with the Play Store; needs Play Core 1.8.0 or higher. Official integrations: Kotlin/Java, Native, Unity, Unreal.
- **When:** trigger after the user has experienced enough of the app, and don't prompt excessively.
- **Dependencies and flow:** `com.google.android.play:review:2.0.2` and `com.google.android.play:review-ktx:2.0.2`; `ReviewManagerFactory.create(context)` > `requestReviewFlow()` > `launchReviewFlow(activity, reviewInfo)`. `ReviewInfo` is valid for a limited time; pre-cache it only when you're sure you'll launch.
- **No result:** "The API does not indicate whether the user reviewed or not, or even whether the review dialog was shown"; on error, don't tell the user or change the flow.
- **Quota:** time-bound; calling `launchReviewFlow` more than once in a short period (e.g. less than a month) may show nothing, and the quota can change without notice. Don't put the API behind a button; send a button to the Play Store instead.
- **Show the card as-is:** no size, opacity or shape changes, no overlays, topmost layer, never removed programmatically.
- **Test:** `FakeReviewManager(context)` in unit and integration tests (no UI). On the internal test track the tester must be on the testers list, have the primary account selected in the Play Store, have the app in their library and no existing review; "The quota limits are not enforced if the app is downloaded from the internal test track." Internal app sharing can't submit reviews (the button is disabled).
- More Play setup is in [../google-play/SKILL.md](../google-play/SKILL.md).

## Pre-prompt questions: a conflict

- **[eronred]** recommends a pre-prompt survey, "Are you enjoying [App Name]?": Yes opens the native prompt, "Not really" opens a feedback form and never the native prompt; it claims an "expected improvement: 0.3 to 0.8 stars".
- **Google** says don't ask any questions before or while presenting the in-app review card, naming "Do you like the app?" and "Would you rate this app 5 stars" as examples. Don't put such a gate in front of the Play card.
- **Apple** lists "paid, incentivized, filtered, or fake feedback" as review manipulation that may lead to expulsion (section 3 intro) and disallows custom review prompts (5.6.1); confirm a pre-prompt against the current guidelines before shipping it on iOS.
- **Never ask users to change a rating** ("against guidelines") **or offer incentives for reviews** [eronred].

## Responding to reviews [eronred]

- **Sort reviews into:** bugs and crashes, feature requests, UX complaints, pricing complaints, love and praise, competitor mentions.
- **HEAR:** Hear (acknowledge the specific issue they mentioned), Empathize (show you understand their frustration), Act (explain what you're doing about it, or have done), Resolve (invite them to contact support for direct help).
- **Templates:**
  - Bug report: "Thank you for reporting this, [name]. We identified the issue and it's fixed in version [X.X] releasing [date]. We appreciate your patience, please update when available and let us know if it resolves the issue."
  - Feature request: "Great suggestion! We've added this to our roadmap. We're always looking to improve based on user feedback. Stay tuned for upcoming updates."
  - Vague negative ("This app sucks"): "We're sorry to hear about your experience. We'd love to understand what went wrong so we can improve. Could you reach out to [support email] with details? We're here to help."
- **Don't:** reply defensively, copy-paste the same reply, ignore negatives, ask users to change their rating, or offer incentives.
- **Play:** reply to every 1 to 3 star review ("boosts score algorithmically"); replies invite re-rating; reply "Fixed in version X.X" once the fix ships.
- **Review data (third-party):** Appeeky `GET /v1/apps/:id/reviews?sort=recent&limit=20` or the MCP tool `get_app_reviews`.
- **A root cause in the product** (crashes, onboarding) needs crash analysis or onboarding work alongside replies and prompts.

## Recovering a rating [eronred]

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
