# Journeys

A Journey is a multi-step automated flow that sends push (mobile and web), email, SMS and in-app messages, driven by user behavior, time delays, Segment membership or Custom Events. It replaces the legacy Automated Messages. Watch three things: the entry rule (Segment or Custom Event, fixed once live), how entry, exit and re-entry rules interact with the first step, and which edits a live Journey accepts. If the user needs a single message with no branching, waiting or re-entry, suggest a regular message or template and confirm before defaulting to a Journey. Segments are in [SEGMENTS.md](SEGMENTS.md), External ID in [USER-MODEL.md](USER-MODEL.md), the Create Custom Events endpoint in [REST-API.md](REST-API.md), channel mix and frequency in [MESSAGING-PRACTICES.md](MESSAGING-PRACTICES.md).

**Contents:** [Before you build](#before-you-build) · [Settings](#settings) · [Entry rules](#entry-rules) · [Exit rules](#exit-rules) · [Re-entry](#re-entry) · [Schedule](#schedule) · [Action steps](#action-steps) · [Message steps](#message-steps) · [Custom Events in Journeys](#custom-events-in-journeys) · [Webhooks](#webhooks) · [Editing live Journeys](#editing-live-journeys) · [Recommended shapes](#recommended-shapes) · [A/B testing](#ab-testing) · [Analytics](#analytics) · [Building a Journey for someone](#building-a-journey-for-someone) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

## Before you build

- **Use External IDs to unify your users.** Without one, each Subscription (email, device, SMS) counts as a separate user, which can send duplicate or conflicting messages across channels and over-message.
- **Active Journey count is plan-dependent.** At the limit, scheduled Journeys do not launch; archive an unused one.
- **A user can be in several Journeys at once.**
- **Channel skip:** a user with no Subscription for a step's channel skips that step and continues. If a user unsubscribes from one channel mid-Journey, that channel's steps are skipped.
- **Prefer simple, working shapes,** and reuse the well-known shapes from the OneSignal Journey examples.

## Settings

- **Name:** required, max **300** characters. **Description:** optional, max **255** characters.
- **Goals:** optional success metrics per Journey and per message. The vendor skill calls them alpha; the settings docs call them Beta. Confirm in the current docs, and do not assume they are on unless the user mentions them.
- **Journey Goal metrics:** Entered, Completed, Exited Early. **Message Goals** (push): Sent, Delivered, Confirmed, Clicked, CTR, Failed, Unsubscribed, Capped; also Conversion Metrics.

## Entry rules

- **Segments or Custom Events, never both.** The type cannot switch after going live: stop and archive, then duplicate and reconfigure.
- **Choose by shape:** a Custom Event for a discrete action (signup, purchase, milestone, cart update); a Segment for a state (inactive 7+ days, in trial, on the free plan).
- **Segment entry:** any Subscription in an Included Segment makes the user enter; any Subscription in an Excluded Segment blocks them. In Segment Journeys a user is active only once at a time.
- **Always define both Included and Excluded Segments explicitly.** Example: include `last_session > 60hrs`, exclude `last_session ≤ 60hrs`.
- **Segments in a live Journey's entry rules are locked.** To edit one, archive the Journey or remove the Segment from the entry rules.
- **Future additions only:** when on, only users who join the included or excluded Segment after launch can enter. Users who already match at launch are excluded permanently, even if they leave and rejoin. The included and excluded Segments lock permanently at go-live. Use it only for one-time campaigns that should skip current matchers.
- **Custom Event entry:** an event name plus an optional property filter. The same user can enter several times in parallel, each entry with its own event properties. To prevent this, add a property filter or an exit rule on the same event name (that exits the current instance and re-enters with the latest properties: the abandoned-cart pattern).

## Exit rules

- **Options:** user becomes active (last session updates); a Custom Event occurs; user no longer matches the audience; user enters a Segment.
- **"Exit rules match on the event name only."**
- **Optional tag on early exit.** A blank value removes the tag; no tag is set if the user is at the tag limit.
- **Entry and exit both match at entry:** the user enters, completes the first step, then exits. Put a Wait step first, or add an Excluded Segment.

## Re-entry

- **Applies only to Segment entry.** Custom Event Journeys always allow re-entry.
- **The timer starts at exit,** not at entry.
- **With a Time Window, re-entry must be longer than the window** but shorter than the send interval, or users get two sends.
- **Edited re-entry rules apply only to users exiting after the change.**

## Schedule

- **Start now or later** (Scheduled, then Active); run indefinitely or stop at a future date.
- **At the end time the Journey stops and archives itself.** Messages stop immediately and no exit events fire.
- **To let current users finish instead:** include an empty Segment and uncheck "Exit when a user no longer matches the audience conditions".

## Action steps

No other step types exist.

| Step | Behavior |
|---|---|
| **Wait** | Fixed delay in minutes, hours, days or weeks. A changed timer affects only users who enter the step after the change. |
| **Wait Until** | Holds until a Segment entry, a message event (one per step) or a Custom Event. Several conditions branch on the first met, evaluated top to bottom. Users who already qualify pass immediately. |
| **Time Window** | Lets users progress only on set days and hours, in the user's time zone when known, otherwise the app default. Release is randomized between window start and window start + **15 minutes** to avoid spikes. |
| **Yes/No branch** | On Segment membership or message behavior (push: Clicked, Delivered; email: Clicked, Opened, Delivered). Cannot be restructured once live. |
| **Split Branch** | Random split with whole-number percentages (34/33/33). Locked once live. For A/B/N tests or a control group (an empty branch). |
| **Tag User** | Add or remove a tag (a blank value removes it). |

- **Always set an expiration on a Wait Until step,** or users wait indefinitely. The expiration gets its own branch.
- **Event Matching** (Custom Event entry Journeys): match a Trigger Event Property to a Wait Event Property (case-sensitive) so the right instance progresses. Survey example: `survey_start`/`survey_id`, `survey_complete`/`survey_type`.
- **Split Branch size:** the vendor skill says up to **20** branches; the actions docs say up to **25**. Confirm in the current docs.
- **Split Branch re-randomizes on re-entry** unless **Randomize on re-entry** is off. Keep a holdout after picking a winner.
- **Branching on a push action button** needs a workaround: capture the click with the SDK click listener, send a Custom Event with the action ID as a property, then branch with Wait Until.
- **Wait 15 minutes after Tag User.** Add a **15-minute** Wait between a Tag step and the next step when a webhook or personalized message depends on the tag.
- **Tag uses:** track progress; exclusion tags (set at the first step, blank at the last).

## Message steps

- **No per-step scheduling.** Push, email and SMS send immediately when reached; use a Wait before them.

| Step | Needs |
|---|---|
| **Push** | An active push Subscription. Sends on step entry. |
| **Email** | Email setup and a subscribed address. Supports Liquid, Data Tags and Data Feeds. |
| **SMS** | SMS setup and a subscribed phone number. |
| **In-app message** | A new session to display (app out of focus **30+ seconds**, then reopened). Optional delivery schedule window. |
| **Webhook** | A configured webhook; see [Webhooks](#webhooks). |

- **IAMs in a Journey show once per user,** even on re-entry. To show a similar IAM again, add a new IAM step.
- **An IAM needs a new session.** A user who is in the app when they reach the step sees it only in the next session. Place a Wait before the IAM step.
- **IAMs are not shared across Journeys.** They are independent copies: duplicating a Journey copies the IAM rather than referencing it. Start and end times are not copied either.
- **Data Feeds work only for email and SMS/RCS in Journeys;** see [PERSONALIZATION.md](PERSONALIZATION.md).

## Custom Events in Journeys

- **They come from your SDK or the Create Custom Events API.** The dashboard cannot fire one.
- **Each Journey instance stores up to 100 event properties per user** (oldest dropped).
- **Templates can reference** `journey.first_event`, `journey.last_event` and `journey.event.EVENT_NAME`.
- **Naming, numbers, PII and dedup rules** are in [SEGMENTS.md](SEGMENTS.md#custom-events): snake_case past tense, numbers as numbers, no PII, `idempotency_key` when the SDK and a backend send the same event.

## Webhooks

A Webhook node requires a configured webhook and sales access. Transport, authentication, allowed headers, Liquid, retries and testing are owned by [SERVER-AND-SUPABASE.md](SERVER-AND-SUPABASE.md#journey-webhooks). Add the 15-minute Wait after Tag User when the webhook depends on that tag.

## Editing live Journeys

| Change | Applies to |
|---|---|
| Step changes | Immediately, to users already in the Journey, based on where they are |
| Settings (entry, exit, re-entry, schedule) | Only users who enter after the change |
| Wait duration | Only users entering the step after; existing timers do not reset |
| Message step content | Keeps its stats |
| Replacing or removing a message step | Resets stats to zero for the new step |
| Split Branches, branch structure, step positions | Locked: duplicate the Journey instead |

- **No undo and no version history.** Duplicate a live Journey before risky edits.
- **Delete is irreversible,** and an archived Journey cannot be resumed.

## Recommended shapes

- **Onboarding:** Custom Event entry (for example `signup_completed`) when available; otherwise a "Subscribed Users" Segment with Future additions only. Then a Wait Until or Yes/No branch on the onboarding-complete signal (Custom Event preferred, Segment or Tag as fallback). Re-entry: No.
- **Re-engagement:** Segment entry on `last_session > N days`; exit on "user becomes active"; re-entry after the inactivity window. Add an Excluded Segment that mirrors the inverse (`last_session ≤ 7 days` in the example), so a user with one inactive and one active Subscription does not qualify. Example steps: push, Wait 2 days, Yes/No on activity, email with an incentive on the No branch. Default channels push + email; ask before adding SMS. Re-entry: Yes, after 7 days.
- **Abandoned cart:** Custom Event entry `cart_updated`, with **the same event name as an exit rule** so each cart update restarts the timer with fresh data, plus a `purchase_completed` exit. Example steps: Wait 1h, push, Wait Until `purchase_completed` (expires after about 23h), email on the expiration branch.
- **Recurring daily or weekly:** a Time Window as the **first** step; re-entry longer than the window but shorter than the interval (daily: window 10 AM to 6 PM, re-entry 12 hours). Weekly digest example: "Subscribed Users" Segment, Time Window Friday morning, Email, re-entry 7 days; rotate content over time.
- **Birthday:** a Time Operator Segment with re-entry of 52 weeks; update the tag after the send (see [SEGMENTS.md](SEGMENTS.md#time-operators)).
- **A/B/N:** Split Branch with equal percentages (50/50 for two variants); nest Split Branches for more than two; optionally leave one branch empty as a control. Tag users with their variant so analytics can be filtered.
- **Limited entries:** a `journey_count` tag, and exclude users at the cap from the audience.
- **Channel mix:** start with email, follow up with push, escalate to SMS, add in-app for in-session moments (for example a welcome email, then push, an IAM for promotions, SMS for time-sensitive reminders). Avoid the same channel back-to-back.
- **Improving a weak Journey:** review entry and exit rules, channel mix, timing and branching, plus early-exit and CTR metrics. Propose named changes (a tighter entry window, a segmented push instead of a generic one, a Yes/No on activity, an incentive on the No branch). Say which changes hit in-flight users and which hit only new entrants.

## A/B testing

### Message A/B testing in a step (private alpha)

- **Steps:** push, email, SMS/RCS (not IAM).
- **Variants:** Free/Growth up to 2, Professional/Enterprise up to 10. The split must total 100%.
- **Reporting retention:** 30 days (Free), 90 days (Growth), 1 year (Professional), 2 years (Enterprise).
- **Target metrics:** Push CTR, Email Unique Open Rate / Unique CTR, SMS CTR. Threshold by users or by date.
- **Winner:** Automatic (recommended) or Manual; confidence 70/80/90 (default)/95/99%.
- **Locks and irreversibles:** variants and templates lock when Running; cancel and select winner are irreversible; re-entrants are re-randomized.

### Variants as separate Journeys (membership tags)

- **Use a Split Branch instead when all variants share the entrance.**
- **Each Journey tags its entrants** (`variant: A`) and excludes the other variants' tag Segments: with Segment entry through an Excluded Segment; with event entry through a Yes/No or Wait Until first node routed to exit. Three variants means six checks.
- **Allow 15 minutes for tag propagation.**
- **Sequential scheduling:** a hard end time, the next start at the actual end, a 10 to 15 minute gap.
- **Clean up:** remove tags when tests end; put the date or test name in the value; query for double-tagged users.

## Analytics

- **Journey metrics count Users; message metrics count Subscriptions.**
- **Journey metrics:** Started (includes re-entries), In Progress, Early Exit, Completed.
- **Retention:** graph data and Audience Activity 30 days; step stats lifetime.
- **Only Journeys live after December 13, 2023** have analytics.
- **Push CTR in Journeys** = Unique Clicks / Deliveries.

## Building a Journey for someone

- **Questions, one decision at a time:** purpose (welcome or onboarding; re-engagement or win-back; abandoned cart; promotional campaign or launch; recurring scheduled message; event-driven follow-up); entry (Segment, Custom Event, or help choosing); channels (push, email, SMS, in-app, webhooks); re-entry for Segment entry (no; after a fixed time; every time they re-qualify); exit (on the goal action; when they become active; when they stop matching the audience; only at the end); recurring cadence (daily at a time window; a specific weekday; a specific date or one-time launch).
- **Name an unconfigured channel as a prerequisite** instead of proceeding silently. Offer: use an enabled channel, set up the channel first, skip that channel, or continue anyway.
- **Inspect first:** list and inspect Journeys, Segments and Custom Events; check that referenced Segments and events exist; check channel setup (push credentials, email, SMS, IAM).
- **Summarize and get explicit approval before creating or updating:** name and description; purpose; entry rule with specifics; included and excluded Segments or event property filters; Future additions only status; the ordered steps in plain language; branch logic; exit; re-entry; schedule; assumptions; limitations (for example "Split branches will be locked once live", "IAMs only show once per user per Journey", "Re-entry duration must exceed time window duration"). For live edits, say which changes apply right away and which only to future entrants.
- **Stop, archive and delete need an extra explicit confirmation:** delete cannot be undone, and an archived Journey cannot be resumed.

## Anti-patterns

- Asking for raw API fields or step IDs; asking every question upfront.
- Mixing Segment and Custom Event entry; changing the entry type live without duplicating.
- Editing Split Branches live.
- A message step right after entry when entry and exit can both match.
- Recurring re-entry shorter than or equal to the Time Window.
- A Wait Until with no expiration.
- Suggesting webhooks call OneSignal APIs, or that OneSignal rate-limits webhooks.
- IAM-heavy designs without explaining the new-session and once-per-Journey rules.
- The same event from the SDK and a backend without dedup.
- PII in events or tags; renaming events or tags a Journey depends on.
- Acting without a summary and approval; inventing step types, conditions or channels.

## Prove it

- **Entry and exit cannot collide:** if a user can match both at entry, the first step is a Wait or an Excluded Segment blocks them.
- **Both Segment lists set:** a Segment-entry Journey has explicit Included and Excluded Segments.
- **Re-entry math:** for a recurring Journey, re-entry is longer than the Time Window and shorter than the send interval.
- **Every Wait Until has an expiration branch.**
- **Tag then wait:** every Tag User step followed by a webhook or personalized message has a 15-minute Wait in between.
- **Event entry dedup:** a Custom Event Journey has a property filter or an exit rule on the same event name, and sending the event twice does not create two parallel instances you did not want.
- **IAM steps:** each has a Wait before it; a Test User who backgrounds the app for 30+ seconds and reopens sees it once, and not again on re-entry.
- **Webhook:** a Test User in the live Journey triggers a request your endpoint answers fast, with the bearer token checked and duplicates dropped by `event.id`.
- **Before a risky live edit:** a duplicate of the Journey exists.
