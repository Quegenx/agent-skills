# Lifecycle emails

The marketing and retention side of an app's email, next to the transactional catalog in [EMAIL-TYPES.md](EMAIL-TYPES.md#which-transactional-emails-an-app-needs): which lifecycle emails exist, what triggers each, and what it says. It follows the coreyhaines31/marketingskills `emails` skill (MIT), copied with its tag, corrected where the FTC or Apple pages say otherwise. Multi-email flows (welcome, nurture, onboarding, re-engagement) are in [SEQUENCES.md](SEQUENCES.md). Anything promotional here needs marketing consent and an unsubscribe ([COMPLIANCE.md](COMPLIANCE.md)); an email that is purely about the user's account or payment stays transactional only while it carries no promotion ([EMAIL-TYPES.md](EMAIL-TYPES.md#legal-rules-by-type)).

**Contents:** [Onboarding](#onboarding) · [Retention](#retention) · [Review requests](#review-requests) · [Billing](#billing) · [Usage](#usage) · [Win-back](#win-back) · [Campaigns](#campaigns) · [Audit checklist](#audit-checklist) · [Prove it](#prove-it)

## Onboarding

[coreyhaines31/marketingskills, emails]

- **New users series:** trigger signup (free or trial), 5-7 emails over 14 days, goal the aha moment; the flow is in [SEQUENCES.md](SEQUENCES.md#onboarding). Key metrics: activation rate, feature adoption.
- **New customers series:** trigger conversion to paid, 3-5 emails over 14 days:
  1. Thank you and what's next (immediately)
  2. Getting full value, a setup checklist (day 2)
  3. Pro tips for paid features (day 5)
  4. Success story from a similar customer (day 7)
  5. Check-in and support resources (day 14)

  "Different from new user series - they've committed. Focus on reinforcement and expansion, not conversion."
- **Key step reminders:** one email or a 2-3 email mini-sequence when a critical setup step is missing, for example no integration connected after 48 hours, no teammate invited after 3 days, profile incomplete after 24 hours. Remind them what they started, explain why the step matters, link directly to it, offer help.
- **Teammate invite:** to the invited person: the invite (immediately), a reminder if not accepted (day 2), a final reminder (day 5). Personalize with the inviter's name, explain what they're joining, one CTA to accept. The recipient never signed up. for "forward-to-a-friend" messages the FTC says "Whether a seller or forwarder is a 'sender' or 'initiator' depends on the facts", and a reward for forwarding makes the seller likely responsible (https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business); it doesn't address invites by name.

## Retention

[coreyhaines31/marketingskills, emails]

- **Upgrade to paid,** 3-5 emails. Triggers: time (trial day 10, 12, 14), behavior (hit a usage limit, used a premium feature), engagement (a highly active free user). Order: value summary, what they're missing, who else upgraded, urgency (trial ending, limited offer), last chance with an easy path. Urgency must be real ([../../marketing/offer-design/FTC-PRICING-CLAIMS.md](../../marketing/offer-design/FTC-PRICING-CLAIMS.md)).
- **Upgrade to a higher plan:** triggers such as 80% of the seat limit, 90% of storage or usage, a try at a higher-tier feature, power-user patterns. Acknowledge their growth, show what the next tier unlocks, quantify value against cost, make upgrading easy.
- **Proactive support:** triggers such as usage dropping week over week, repeated failed attempts, repeated help-doc views, stuck at one onboarding step. "I noticed you..." if the data allows, direct help rather than a docs link, from support or a CSM, "No sales pitch - pure help". The app-side churn signals are in [../../mobile/app-growth/RETENTION-AND-MONETIZATION.md](../../mobile/app-growth/RETENTION-AND-MONETIZATION.md).
- **NPS survey:** quarterly or after a milestone; "Just the NPS question initially", then a follow-up form asking why; a personal sender (CEO, founder, CSM); say how you'll use the feedback. Promoters (9-10): thank them, and they may get the referral ask; passives (7-8): ask what would make it a 10; detractors (0-6): personal outreach. The source also sends promoters a review ask; that is review gating (next section).
- **Referral program:** after a positive NPS response, a result, a renewal, or in a seasonal campaign. Remind them of their success, explain the offer, a unique link, what's in it for them and the referee. Program design is in [../../marketing/referral-programs/SKILL.md](../../marketing/referral-programs/SKILL.md).

## Review requests

- **Ask by experience, never by sentiment.** The FTC: "Don't ask for reviews only from customers you think will leave positive ones." "If you offer an incentive for a review, don't condition it, explicitly or implicitly, on the review being positive", and "the review should disclose the incentive" (https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers). The Consumer Review Rule (16 CFR 465) "became fully effective on October 21, 2024" (https://www.ftc.gov/system/files/ftc_gov/pdf/2025-Fake-Review-Warning-Template.pdf).
- **What the source said:** "Promoters (9-10): Thank + ask for review/referral", and ask "After positive support interaction ... NOT after billing issues or bugs" [coreyhaines31/marketingskills, emails]. Timing an ask after a milestone (30/60/90 days, a measurable result, a renewal) is fine; choosing recipients by score or mood is not.
- **The email** [coreyhaines31/marketingskills, emails]: thank them, name the milestone, "Explain why reviews matter (help others decide)", a direct link to the review platform, short. The cohort rules and a neutral invitation template are in [../../marketing/referral-programs/REVIEW-PROGRAMS.md](../../marketing/referral-programs/REVIEW-PROGRAMS.md#requesting-reviews); app stores use the system prompt instead ([../../mobile/app-growth/RETENTION-AND-MONETIZATION.md](../../mobile/app-growth/RETENTION-AND-MONETIZATION.md#rating-prompts)).

## Billing

[coreyhaines31/marketingskills, emails]

- **Switch to annual:** calculate the exact savings, any extra benefits, an easy one-click switch. Timing: around the monthly renewal date, end or start of the year, after 3-6 months, or when a price increase is announced (lock in the old rate).
- **Failed payment recovery,** 3-4 emails over 7-14 days:

| Day | Email |
|---|---|
| 0 | Friendly notice, update payment link |
| 3 | Reminder, service may be interrupted |
| 7 | Urgent, account will be suspended |
| 10-14 | Final notice, what they'll lose |

  "Assume it's an accident (card expired, etc.)"; clear, direct, no guilt; one CTA to update payment; explain what happens if it isn't resolved. Key metrics: recovery rate, time to recovery. The repo's single "Payment failed" email is in [EMAIL-TYPES.md](EMAIL-TYPES.md#what-each-transactional-email-contains); Stripe's own failed-payment emails and retries are in [../stripe/BILLING.md](../stripe/BILLING.md); dunning copy is in [../../marketing/churn-prevention/SKILL.md](../../marketing/churn-prevention/SKILL.md).
- **Cancellation survey:** in-app at cancellation completes better; email only if they skip it; personal outreach for high-value accounts. Ask the primary reason, what you could have done better, whether anything would change their mind, and whether you can help with the transition; offer a save that matches the reason (discount, pause, downgrade, training). Cancel-flow design is in [../../marketing/churn-prevention/CANCEL-FLOWS.md](../../marketing/churn-prevention/CANCEL-FLOWS.md).
- **Upcoming renewal reminder:** the source says "X days before renewal (14 or 30 days typical)"; the repo's renewal notice says "Typically 3 to 7 days before renewal" ([EMAIL-TYPES.md](EMAIL-TYPES.md#what-each-transactional-email-contains)). Both are conventions. Include the renewal date and amount, what's included, how to update payment or plan, and any pricing or feature changes. The source's "Required for: Annual subscriptions, high-value contracts" names no law; check the auto-renewal rules that apply to you before treating it as required.

## Usage

[coreyhaines31/marketingskills, emails]

- **Daily, weekly or monthly summary:** daily for high-engagement products (notifications, quick stats), weekly an activity summary with highlights and suggestions, monthly a full report with achievements and ROI if calculable. Key metrics at a glance, achievements, a breakdown, what to try next, a CTA. "Must be relevant to their actual usage. Empty reports are worse than no report."
- **Milestones:** first [action] completed, 10th or 100th [thing], a goal achieved, a team milestone, a usage streak. Celebrate the specific achievement, give context (against before or others), name the next milestone.

## Win-back

[coreyhaines31/marketingskills, emails]

- **Expired trials,** 3-4 emails over 30 days: day 1 after expiry "here's what you're missing"; day 7 "What held you back?"; day 14 an incentive (discount, extended trial); day 30 "Final reach-out, door is open". By trial engagement: high, remove friction to convert; low, a fresh start with more onboarding; none, ask what happened and offer a demo or call.
- **Cancelled customers,** 2-3 emails over 90 days: day 30 "What's new since you left"; day 60 "We've addressed [common reason]"; day 90 a special offer. "No guilt, no desperation"; personalize by cancellation reason; make returning easy.
- **Two ladders, side by side:** the app-growth win-back ladder runs week 1 "We miss you", week 3 30% off the first month, week 6 three months at 50% off, week 12+ archive ([../../mobile/app-growth/RETENTION-AND-MONETIZATION.md](../../mobile/app-growth/RETENTION-AND-MONETIZATION.md#subscription-lifecycle)). Both are source conventions; pick one per product.
- **Consent:** a cancelled customer may still be a marketing subscriber or may not; win-back email goes only to those whose marketing consent stands.

## Campaigns

[coreyhaines31/marketingskills, emails]

- **Monthly roundup or newsletter:** product updates and tips, customer stories, education, company news; a consistent send day and time, scannable, one primary CTA. "Unsubscribe is okay - keeps list healthy."
- **Seasonal promotions,** a burst of 2-4 emails: the announcement, a midway reminder, a last chance. A "last chance" must be the real end of the offer.
- **Product updates:** what's new, why it matters, how to use it (direct link), who asked for it; target users who benefit most or requested it. "General feature announcements are marketing emails" ([EMAIL-TYPES.md](EMAIL-TYPES.md)).
- **Pricing update:** announce 30-60 days before, remind 14 days before, final notice 7 days before; explain why, grandfather if possible, give options (annual lock-in, downgrade). Store rules for subscription price increases and the rollout are in [../../marketing/pricing-strategy/PRICE-CHANGES.md](../../marketing/pricing-strategy/PRICE-CHANGES.md).

## Audit checklist

[coreyhaines31/marketingskills, emails] Use it to find the gaps in an existing program:

- **Onboarding:** new users series; new customers series; key step reminders; teammate invite sequence.
- **Retention:** upgrade to paid; upgrade to a higher plan; review requests (by milestone, not sentiment); proactive support; usage reports; NPS survey; referral emails.
- **Billing:** switch to annual; failed payment recovery; cancellation survey; renewal reminders.
- **Usage:** summaries; key event notifications; milestone celebrations.
- **Win-back:** expired trials; cancelled customers.
- **Campaigns:** newsletter; seasonal calendar; product update announcements; pricing update communications.

## Prove it

- Each lifecycle email in the program is labelled transactional or marketing, and every marketing one goes only to consented addresses with the unsubscribe headers.
- Review requests go to every customer who reached the milestone, or a sample not chosen by score, and no incentive depends on a positive review.
- The failed-payment emails stop as soon as the payment succeeds.
- A usage report with no activity is not sent.
- Every "last chance" or deadline in a campaign matches the date the offer really ends.
