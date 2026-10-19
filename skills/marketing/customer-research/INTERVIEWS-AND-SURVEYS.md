# Mode 3: interviews and surveys

Asking customers directly, the highest-signal and first-party research. From coreyhaines31/marketingskills `customer-research` `references/interviews-and-surveys.md` (MIT). Three primary pillars, best used together: video calls, surveys, and online sleuthing ([SOURCES.md](SOURCES.md)). Analyze what you gather with the extraction framework and theme confidence in [SKILL.md](SKILL.md#the-extraction-framework).

## The first rule

`[coreyhaines31/marketingskills, customer-research]` "The first rule of customer research: you do not talk about customer research." Once customers think they're in "a research study" they perform. Frame calls as a chat; don't lead, don't pitch, don't defend the product.

**Prove yourself wrong, not right.** Research is disconfirmation. The source's Dropbox example: the team assumed users cared most about sync speed; research aimed at disproving it showed they cared more that files were reliably there and safe. "Ask questions that could return an answer you don't want to hear. If none of your questions can prove you wrong, rewrite them."

For [Sales Safari](SOURCES.md#sales-safari), observe the audience before recruiting interviews. [coreyhaines31/marketingskills, customer-research]

## Recruiting

`[coreyhaines31/marketingskills, customer-research]` Interview the customers you want more of. Segment the CRM by high deal size, short sales cycle and low churn; ask sales and CS for referrals; close every call with "Who else should we talk to?"

## Incentives

`[coreyhaines31/marketingskills, customer-research]` $50 per call (about 30 minutes), $5 per survey response, offered up front; gift cards work. "Aim for 10 calls, be happy with 5"; by call 5 or 6 the same themes repeat.

These are payments for research, never for public reviews: Apple lists "paid, incentivized, filtered, or fake feedback" as review manipulation, and aso's rule is never to "offer incentives for reviews" ([aso RATINGS-AND-REVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/RATINGS-AND-REVIEWS.md)). Don't tie a gift card to leaving a store, G2 or Capterra review.

## The outreach email

`[coreyhaines31/marketingskills, customer-research]` Short, casual, specific, low-commitment; never say "customer research study". One ask, two time options, a booking link.

```
Subject: Quick favor, 30 min, on us

Hi [First name],

I'm [name] from [company]. I'm trying to get better at helping customers
like you, and I'd love to steal 30 minutes to hear how [product area] is
actually working for you: what's good, what's annoying, what you wish
were different. No pitch, no agenda.

As a thank you I'll send you a $50 [Amazon/Visa] gift card.

Are you free [day] or [day] this week? Here's my calendar: [link]

Thanks either way,
[Name]
```

Keep it a research request. The FTC applies a primary-purpose test: a message that mixes commercial and relationship content is commercial if the subject line would make a recipient think it advertises, or if the relationship content isn't mainly at the beginning ([CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)). Add a pitch and the commercial-email duties apply ([email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md)).

## Keep asking why

`[coreyhaines31/marketingskills, customer-research]` Ladder each answer down 3 to 5 levels to the root motivation, the business outcome or the emotional driver. The source's worked example:
- "Why did you downgrade your plan last quarter?" "We weren't using the advanced reports."
- "Why weren't you using them?" "Nobody on the team knew how to build one."
- "Why didn't anyone learn?" "The person who set us up left, and onboarding never got re-run for the new hires."
- "Why did that matter enough to downgrade?" "Without the reports, my boss couldn't see the ROI, so at renewal it looked like an easy cost to cut."
- "Why is that the real risk?" "If leadership can't see value, we churn, and if we *had* seen it, we'd probably have added seats, not cut them."

The surface answer was "we don't use reports"; the root is an onboarding gap that turns expansion into contraction. **Pain points vs passion points:** pains are what they'll pay to escape and drive acquisition; passion points are what they'd be "very disappointed" to lose and drive retention and referrals. Ladder for both.

## The PMF survey

`[coreyhaines31/marketingskills, customer-research]` From Sean Ellis, popularized by Superhuman's Rahul Vohra:

> **"How would you feel if you could no longer use [product]?"**
> - Very disappointed
> - Somewhat disappointed
> - Not disappointed
> - N/A, I no longer use it

The benchmark is Ellis's practitioner rule, not a standard: 40% or more "very disappointed" means you likely have product/market fit. The source reports Superhuman reached 58% by segmenting on the "very disappointed" cohort, doubling down on what it loved and converting the "somewhat disappointed". Run it as a recurring pulse. Follow-ups:
- "What type of person do you think would most benefit from [product]?" (sharpens the ICP)
- "What is the main benefit you receive from [product]?" (positioning, in their words)
- "How can we improve [product] for you?" (from the fence-sitters)

Segment every answer by the "very disappointed" cohort against the rest. Building it as an in-app survey is [posthog SURVEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SURVEYS.md).

## Survey guardrails

`[coreyhaines31/marketingskills, customer-research]` Keep it short (each extra question drops completion); "Prefer open-ended for language mining; multiple-choice answers are artifacts of the options you gave"; don't lead; deliver the $5 on submit.

Two views on the first question: this source prefers open text for language; PostHog's survey data shows a single-choice first question at 8.0% response against 0.8% for open text ([posthog SURVEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SURVEYS.md#design-for-responses)). They fit together: open with a choice question for the response rate, follow with open text for the language.

## Case anchors

`[coreyhaines31/marketingskills, customer-research]` The source's three: Airbnb (listings failed on bad host photos, not pricing or copy, so it sent photographers), Dropbox (reliability over sync speed), Superhuman (the PMF survey).

## Prove it

Every interview question could return an answer the team doesn't want; the outreach email has no pitch; no incentive is linked to a public review; the PMF survey uses the exact four options and is segmented by the "very disappointed" cohort; each laddered answer reaches at least three levels.
