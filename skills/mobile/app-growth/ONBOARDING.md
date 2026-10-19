# Onboarding and activation

Getting a new install to the activation event: defining that event, cutting screens and sign-up friction, timing permission prompts, choosing an onboarding flow, and where the paywall sits in onboarding. Untagged bullets are [eronred], a third-party playbook whose benchmarks are its author's claims; [ApparenceKit], [FlutterPro] and [coreyhaines31/marketingskills, <skill>] (Corey Haines' MIT-licensed marketing skills, written for web SaaS) are described in [RETENTION-AND-MONETIZATION.md](RETENTION-AND-MONETIZATION.md). Apple's and Google's docs win any conflict. The paywall itself is in [PAYWALLS.md](PAYWALLS.md); events for these funnels are in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#event-tracking-plan); web SaaS onboarding is in [onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md).

- **Activation is not sign-up.** Define the one activation event and funnel all of onboarding toward it as fast as possible. Ask for the baseline: what % of new users reach it within 24 hours, and where they drop off.
- **Find the activation event from cohorts, not guesses** [coreyhaines31/marketingskills, onboarding]: define signup as time zero, an early activation window and a separate, later retention outcome (for example first-seven-day actions and return activity in week four); include all eligible signups with full follow-up and show recent, immature cohorts separately ("do not count them as churned"); never use behavior from the retention window as the early predictor; treat high-correlation events as hypotheses with counts and uncertainty, confirm on a later mature cohort, and test whether forcing the action actually raises retention ("Correlation alone does not prove that forcing the action causes retention"). The source cites Amplitude's Compass docs (https://amplitude.com/docs/analytics/charts/compass/compass-aha-moment).

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
- **Then rebuild the path** [coreyhaines31/marketingskills, onboarding]: "inventory → remove → reconstruct": list every step between signup and value ("Most teams underestimate their own step count by half"), cut, defer, pre-fill or make skippable whatever isn't needed for first value, rebuild in value-first order, and treat the rebuild as "a hypothesis, not a finish line".
- **Ask for permissions in context; they are the #1 drop-off point.** Push after activation, never on cold open; location when needed, never during sign-up; camera and mic contextually; contacts when a social feature is used, never in onboarding; ATT after the user is invested, never on first open. Always show a native-looking pre-permission screen before the system prompt: users who understand why grant at 2-3x the rate. Apple allows a transparent pre-prompt for ATT but forbids gating features on it ([ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att)).
- **Permission timing: the sources differ.** [eronred] (above): push after activation, ATT never on first open. [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/) moved the notification request off app start onto "a permission request page during onboarding to increase acceptance rate", and asks for ATT "within onboarding" (both agree: never on cold open). [coreyhaines31/marketingskills, onboarding] gives a third order for mobile apps, "Permissions → Quick win → Push setup → Habit loop", while its own experiment list leaves "Permission timing" open; keep the in-context rule above. The ATT side of this conflict is in [ANALYTICS-AND-ATTRIBUTION.md](ANALYTICS-AND-ATTRIBUTION.md#app-tracking-transparency-att).
- **Plan the denied state** [ApparenceKit](https://apparencekit.dev/blog/app-showcase-uly/): wrap a permission-dependent screen (a camera view) in a widget that asks first; "If the user refused the permissions we shows a nice message to explain why we need it, and a button to go to the settings. That way you don't show a black screen where you could lose people." Flutter code for permission pages is in [flutter-ux NOTIFICATIONS-AND-PERMISSIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/NOTIFICATIONS-AND-PERMISSIONS.md).
- **Pre-permission copy template:** icon; benefit headline ("Get notified when your goal is complete"); one line ("We'll only send you reminders you set, no spam."); [Allow] [Not now].
- **Tie the ask to a concrete moment** [FlutterPro](https://flutterpro.design/details/notification-permission-priming): after an order is placed, "Get order status updates"; in a prayer-times app, when the user configures prayer times, showing the daily reminders for the 5 prayers.
- **Cut sign-up friction:** defer required sign-up until after activation; add Sign in with Apple and Google next to email and password; at most 1 profile question; make email verification deferred or optional. Guest mode converts guest to registered at typically 40-60%, against 15-30% for a hard gate. Web sign-up forms (which fields to defer, social buttons by audience) are in [cro SIGNUP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SIGNUP.md).
- **Login screen** [ApparenceKit](https://apparencekit.dev/blog/flutter-login-page/): "When you provide social logins, you should always provide a way to log in without it. (Most of the time with email authentication)", since some people refuse social login because social networks track which apps they use. Keep only necessary inputs (email, password and confirm is hard to fill on a phone), split into several pages if needed, make sure the keyboard doesn't hide the fields, and consider a "Contact support" button. Magic links have a downside: the user must open the mail app, can get distracted by other mail and never click.
- **Pick a flow:**

| Pattern | Order | For |
|---|---|---|
| Value-First (recommended) | Demo or preview, activation, "Save your progress" sign-up, permissions, personalization | Most apps |
| Personalization-First | 3-5 questions with a progress bar, "Your plan is ready", sign-up gate, activation | Health, fitness, AI |
| Social-First | Sign in with Apple/Google, find friends, first feed, activation | Social |

- **An onboarding module** [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/): feature pages (present the features), permission pages ("ATT consent, notifications, location") and question pages (single or multiple choice, "to personalize their experience"), with an analytics event per answer, then a loading step and the paywall.
- **Show, don't tell** [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/): the funnel is login, onboarding, paywall, where "each step builds enough trust for the next one"; on onboarding, "Don't tell them, show them" (attributed to ex-Apple designer Mike Stern): let users experience the one or two core benefits in the first session instead of explaining every feature.
- **Personalization questions:** 3-5 max; each visibly changes the experience; show progress; visual selections, not text inputs; never ask for data you don't use immediately.

| Funnel step | Benchmark | Poor |
|---|---|---|
| Open to first interaction | Over 85% | Under 70% |
| Sign-up | Over 60% | Under 40% |
| Push permission granted | Over 50% | Under 30% |
| Activation on day 0 | Over 40% | Under 20% |
| D1 retention | Over 30% | Under 15% |

- **Paywall placement in onboarding (show value before the paywall):** before activation, almost never (the user has no reference for value); at activation, strong; after activation on D1, the strongest for subscription apps; a contextual feature gate, good.
- **Onboarding paywall: the sources differ.** [ApparenceKit](https://apparencekit.dev/blog/how-to-monetize-mobile-app/) [ApparenceKit](https://apparencekit.dev/blog/flutter-good-paywall/): "**Most of your paid users will come from the first session.** Users who never see your paywall never convert. So show it during onboarding, right after you demonstrated value" (Onboarding, Value, Paywall), not on day 3 or 7. [ApparenceKit](https://apparencekit.dev/blog/apparencekit-4-update/): "a great onboarding is also the best opportunity to show your paywall." [eronred] (line above): before activation, almost never; after activation on D1, the strongest. RevenueCat also says onboarding paywalls tend to be very successful ([revenuecat PAYWALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/PAYWALLS.md#paywall-design-rules)). [coreyhaines31/marketingskills, paywalls], written for web SaaS upgrade prompts, lists "During onboarding (too early)" under when not to show one.

## Prove it

- **Activation:** the activation event is named and tracked, and the funnel from open to activation on day 0 is measured against the benchmark table.
- **Permissions:** no system permission prompt (push, location, contacts, ATT) fires on cold open; each is preceded by a pre-permission screen with [Allow] [Not now].
