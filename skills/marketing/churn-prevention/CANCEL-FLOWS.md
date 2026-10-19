# Cancel flows and save offers

The voluntary side of churn on the web: the five-step cancel flow, the exit survey, matching a save offer to the reason, pause and downgrade, flows by business type and billing interval, segmentation, and what happens after the cancel. From [coreyhaines31/marketingskills, churn-prevention] `SKILL.md` and `references/cancel-flow-patterns.md` (MIT, Copyright (c) 2025 Corey Haines); the ASCII wireframes are the source's. The law on cancellation (ROSCA's "simple mechanisms", the vacated 2024 rule) is defined in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation). Stripe's own cancel page (reasons, retention coupon) is in [stripe BILLING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/BILLING.md#customer-portal); on iOS and Android the user cancels in the store, so the app-side flow is in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#subscription-lifecycle).

**Contents:** [The five steps](#the-five-steps) · [Exit survey](#exit-survey) · [Match the offer to the reason](#match-the-offer-to-the-reason) · [Save offers](#save-offers) · [The flow on screen](#the-flow-on-screen) · [B2C and self-serve](#b2c-and-self-serve) · [B2B and team plans](#b2b-and-team-plans) · [Freemium](#freemium) · [Monthly and annual subscribers](#monthly-and-annual-subscribers) · [Segments](#segments) · [After the cancel](#after-the-cancel) · [Prove it](#prove-it)

## The five steps

[coreyhaines31/marketingskills, churn-prevention]

```
Trigger → Survey → Dynamic Offer → Confirmation → Post-Cancel
```

1. **Trigger:** the customer clicks "Cancel subscription" in account settings.
2. **Exit survey:** why they're cancelling; it picks the save offer.
3. **Dynamic save offer:** targeted to the reason (discount, pause, downgrade).
4. **Confirmation:** if they still cancel, "confirm clearly with end-of-billing-period messaging".
5. **Post-cancel:** "Set expectations, offer easy reactivation path, trigger win-back sequence."

"Process cancellation even if save flow has errors", and confirm by email receipt.

## Exit survey

[coreyhaines31/marketingskills, churn-prevention]

| Reason | What it tells you |
|---|---|
| Too expensive | Price sensitivity; may respond to discount or downgrade |
| Not using it enough | Low engagement; may respond to pause or onboarding help |
| Missing a feature | Product gap; show roadmap or workaround |
| Switching to competitor | Competitive pressure; understand what they offer |
| Technical issues / bugs | Product quality; escalate to support |
| Temporary / seasonal need | Usage pattern; offer pause |
| Business closed / changed | Unavoidable; learn and let go gracefully |
| Other | Catch-all with a free text field |

- "1 question, single-select with optional free text"; "5-8 reason options max"; most common reasons first (review the data quarterly); no guilt trip; "'Help us improve' framing works better than 'Why are you leaving?'".
- **"Too expensive" often masks other issues** (the source's eval): when it dominates, look at activation and usage before cutting the price.

## Match the offer to the reason

[coreyhaines31/marketingskills, churn-prevention] "A discount won't save someone who isn't using the product. A feature roadmap won't save someone who can't afford it."

| Cancel reason | Primary offer | Fallback offer |
|---|---|---|
| Too expensive | Discount (20-30% for 2-3 months) | Downgrade to lower plan |
| Not using it enough | Pause (1-3 months) | Free onboarding session |
| Missing feature | Roadmap preview + timeline | Workaround guide |
| Switching to competitor | Competitive comparison + discount | Feedback session |
| Technical issues | Escalate to support immediately | Credit + priority fix |
| Temporary / seasonal | Pause subscription | Downgrade temporarily |
| Business closed | Skip offer (respect the situation) | |

**Two views on when the discount comes.** The source leads with a discount for "Too expensive". [eronred] in [app-growth RETENTION-AND-MONETIZATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/RETENTION-AND-MONETIZATION.md#subscription-lifecycle) offers "a discount only as a last resort (20-30% off for 3 months)" after a pause and a value recap. Same range, different order; test it.

## Save offers

[coreyhaines31/marketingskills, churn-prevention]

- **Discount:** 20 to 30% off for 2 to 3 months; avoid 50%+ ("trains customers to cancel for deals"); show the dollar amount saved, not only the percentage. The source also suggests "Time-limit the offer ('This offer expires when you leave this page')": only if it is true, or it is the FTC's False Limited Time Message ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#scarcity-urgency-and-dark-patterns)).
- **The discount ladder:** "Cancel click → 15% off → Still cancelling → 25% off → Still cancelling → Let them go". "Maximum 2 discount offers per cancel session"; "Never exceed 30%"; time-limit the discount (2 to 3 months, then full price); "if they cancel again at full price, don't re-offer".
- **Two views on win-back depth.** "Never exceed 30%" is the source's in-flow rule; [eronred]'s post-cancel win-back ladder in app-growth reaches "3 months at 50% off" at week 6. One is a save offer, the other a win-back; state which you are running.
- **Pause:** often better than a discount "because it doesn't devalue your product".

| Setting | The source's recommendation |
|---|---|
| Pause duration options | 1 month, 2 months, 3 months |
| Default selection | 1 month (shortest) |
| Maximum pause | 3 months (longer pauses rarely return) |
| During pause | Keep data, remove access |
| Reactivation | Auto-reactivate with 7-day advance email |
| Repeat pauses | Allow 1 pause per 12-month period |

  Reactivation emails: day -7 "Your pause ends in 7 days. We've been busy - here's what's new."; day -1 "Welcome back tomorrow! Here's what's waiting for you."; day 0 "You're back! Here's a quick tour of what's new." Stripe's two pause mechanisms are in [stripe SUBSCRIPTION-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SUBSCRIPTION-CHANGES.md#pausing). The source's "60-80% of pausers eventually return" has no study behind it.
- **Downgrade:** offer a lower tier instead of cancellation; show what they keep and lose; frame it as "right-size your plan"; keep the path back up easy. "Preserve their data even on the lower plan"; "If they downgrade, don't show upgrade prompts for at least 30 days." Stripe mechanics: [stripe SUBSCRIPTION-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SUBSCRIPTION-CHANGES.md#upgrades-and-downgrades).

```
┌─────────────────────────────────────────┐
│  Before you go, what about right-sizing │
│  your plan?                             │
│                                         │
│  Current: Pro ($49/mo)                  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Switch to Starter ($19/mo)      │    │
│  │                                 │    │
│  │ ✓ Keep: Projects, integrations  │    │
│  │ ✗ Lose: Advanced analytics,     │    │
│  │         team features           │    │
│  │                                 │    │
│  │ [Switch to Starter]             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [No thanks, continue cancelling]       │
└─────────────────────────────────────────┘
```

- **Feature unlock or extension:** unlock a premium feature they haven't tried, or extend a trial of a higher tier; for "not getting enough value".
- **Personal outreach:** for high-value accounts (top 10 to 20% by MRR), route to customer success; a founder email at smaller companies.
- **Competitor switch:** ask which competitor (optional), show a comparison ([comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)), offer a migration credit ("We'll match their price for 3 months"), request a 15-minute feedback call.

## The flow on screen

[coreyhaines31/marketingskills, churn-prevention]

```
┌─────────────────────────────────────┐
│  We're sorry to see you go          │
│                                     │
│  What's the main reason you're      │
│  cancelling?                        │
│                                     │
│  ○ Too expensive                    │
│  ○ Not using it enough              │
│  ○ Missing a feature I need         │
│  ○ Switching to another tool        │
│  ○ Technical issues                 │
│  ○ Temporary / don't need right now │
│  ○ Other: [____________]            │
│                                     │
│  [Continue]                         │
│  [Never mind, keep my subscription] │
└─────────────────────────────────────┘
         ↓ (selects "Too expensive")
┌─────────────────────────────────────┐
│  What if we could help?             │
│                                     │
│  We'd love to keep you. Here's a    │
│  special offer:                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  25% off for the next 3 months│  │
│  │  Save $XX/month               │  │
│  │                               │  │
│  │  [Accept Offer]               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Or switch to [Basic Plan] at       │
│  $X/month →                         │
│                                     │
│  [No thanks, continue cancelling]   │
└─────────────────────────────────────┘
```

- Keep "continue cancelling" visible on every step (no dark patterns); one primary offer + one fallback, "not a wall of options"; specific dollar savings; the customer's name and account data where possible; mobile-friendly; no guilt-trip copy ("Are you sure you want to abandon us?"). Never hide the cancel button. The component patterns for these screens (dialogs, in-place confirms) are in [app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md).

## B2C and self-serve

[coreyhaines31/marketingskills, churn-prevention] Fully automated, no human in the loop, 2 to 3 screens maximum, one offer + one fallback, mobile-optimized, "Clear 'continue cancelling' at every step". The source's example for a $29/mo app: (1) "What's the main reason?" with 6 options; (2) "Too expensive" → "Get 25% off for 3 months (save $21.75)"; (3) declined → "Or switch to our Starter plan at $12/mo"; (4) declined → "We're sorry to see you go. Your access continues until [date]."

The source's worked example has four numbered stages despite its "2 to 3 screens maximum" rule. Stages are not evidence of separate screens: keep the implemented flow within the existing three-screen limit rather than copying the numbering as a screen count. The original example is retained above. [coreyhaines31/marketingskills, churn-prevention]

## B2B and team plans

[coreyhaines31/marketingskills, churn-prevention]

- Route accounts above an MRR threshold to customer success; show team impact ("Your 8 team members will lose access"); offer an admin-to-admin call for enterprise; allow "schedule a call" as a save option; **require the admin or owner role to cancel** (not any team member).
- **MRR routing, with one row removed:**

| Account MRR | Cancel flow |
|---|---|
| <$100/mo | Automated flow with offers |
| $100-$500/mo | Automated + flag for CS follow-up |
| $500-$2,000/mo | Route to CS before cancel completes |

- **Do not copy the source's last row,** "$2,000+/mo: Block self-serve cancel, require CS call". It contradicts the source's own compliance note ("Cannot require a phone call to cancel if signup was online") and ROSCA's "simple mechanisms for a consumer to stop recurring charges" ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#trials-auto-renewal-and-cancellation)). Routing to a person is fine while the self-serve cancel still completes.

## Freemium

[coreyhaines31/marketingskills, churn-prevention] "Cancel button → 'Switch to Free?' prompt → Exit survey (if still cancelling) → Offer → Confirm". Lead with the free tier as the first option; show what they keep on free and what they lose; "The 'save' is keeping them on free"; track free-tier users for later re-upgrade.

## Monthly and annual subscribers

[coreyhaines31/marketingskills, churn-prevention]

- **Monthly:** more price-sensitive; discounts (20 to 30% for 2 to 3 months) and pause (1 to 2 months) work; suggest annual at a discount. Priority: discount if the reason is price, pause if not using or temporary, annual switch if engaged but price-sensitive.
- **Annual:** higher commitment and usually stronger reasons; personal outreach is justified. Priority: (1) pause the remainder of the term if temporary; (2) plan adjustment + credit for the next renewal; (3) personal outreach from CS; (4) partial refund + downgrade. "Offer prorated refund if significant time remaining"; "'Pause until renewal' if less than 3 months left"; "Be generous - bad refund experiences create vocal detractors." A prorated refund is not a money-back guarantee ([offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md#guarantees)); in Stripe, a custom cancellation date can't come with a refund, so issue the refund separately ([stripe SUBSCRIPTION-CHANGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SUBSCRIPTION-CHANGES.md#canceling)).

## Segments

[coreyhaines31/marketingskills, churn-prevention] Segment by plan or MRR, tenure, usage level, billing interval, previous saves ("Don't re-offer the same discount to a repeat canceller") and cancel reason.

- **New customer (< 30 days):** they haven't activated; "The save is onboarding, not discounts." Offer an onboarding call, setup help, an extended trial; ask "What were you hoping to accomplish?" ([onboarding-and-upgrades SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md)).
- **Engaged, cancelling on price:** discount, annual switch, downgrade.
- **Dormant (no login 30+ days):** "A discount won't bring them back." Pause, and a "what changed?" conversation.
- **Power user to a competitor:** competitive match, feedback call, roadmap preview.

## After the cancel

[coreyhaines31/marketingskills, churn-prevention]

```
Your subscription has been cancelled.

What happens next:
• Your access continues until [billing period end date]
• Your data will be preserved for 90 days
• You can reactivate anytime from your account settings

[Reactivate My Account]

We'd love to have you back. We'll keep improving based on feedback
from customers like you.
```

| Timing | Action |
|---|---|
| Immediately | Confirmation email with access end date |
| Day 1 | Nothing ("don't be desperate") |
| Day 7 | Satisfaction survey about the overall experience |
| Day 30 | "What's new" email with recent improvements |
| Day 60 | Address their specific cancel reason if resolved |
| Day 90 | Final win-back with special offer |

- **Email tone and return path** [coreyhaines31/marketingskills, emails]: "No guilt, no desperation"; personalize by cancellation reason; make returning easy. That source describes the day-30/60/90 ladder above as 2 to 3 emails over 90 days.
- **Win-back mail is marketing mail:** consent, unsubscribe and the transactional line are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md) and [email-practices EMAIL-TYPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/EMAIL-TYPES.md). The source's "Don't use post-cancel data for marketing without consent" skips the other lawful bases; follow COMPLIANCE.md instead.
- **Data after cancel (EU).** Tell users the retention period and offer an export before deletion. The source says "Honor deletion requests within 30 days"; GDPR Art. 12(3) says "without undue delay and in any event within one month of receipt of the request. That period may be extended by two further months where necessary", and you inform the person of any extension within the first month ([GDPR Art. 12](https://gdpr-info.eu/art-12-gdpr/)).

## Prove it

A test cancel completes in at most 3 screens with "continue cancelling" visible on each, even when the offer service is down; the offer shown matches the selected reason; no save discount exceeds 30% or appears more than twice; a repeat canceller isn't offered the same discount; no account size forces a phone call; the confirmation states the access end date; and the post-cancel emails respect consent and unsubscribe.
