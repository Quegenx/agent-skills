# Outbound plays

"A play is a repeatable outbound motion: a trigger, an offer, a sequence, and a definition of success. Plays keep outbound from becoming a pile of one-off emails." [coreyhaines31/marketingskills, cold-email] references/outbound-plays.md. The signals that fire each play are in [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md).

## 1. Value-first teardown (services and agencies)

[coreyhaines31/marketingskills, cold-email] Give a specific piece of the work before asking for anything. It fits when what you sell is visible expertise: conversion optimization, design, SEO, ads, copy, analytics.

**Trigger:** something visible changed or matters now: a new pricing or landing page, a redesign, launched ad campaigns, a new head of growth, fresh funding with growth targets.

**Sequence**

1. **Email 1 asks permission, with no link.** Name one specific thing you noticed on their page and offer the rest.
   > Looked at your new pricing page. The annual toggle defaults to monthly, which usually costs a few points of annual uptake. I noted two other things I'd test there. Want me to send them over?
2. **When they say yes,** send a 2 to 4 minute video (or a one-page annotated screenshot) with 3 specific, testable ideas on their page, their page on screen in the first seconds.
3. **Follow-up** asks a small question about the ideas, not for a meeting: "Was the second one already on your list?"
4. **Then offer the call:** "Happy to walk through how we'd prioritize the rest."

Why ask first: no link in the first email, a "yes" filters for real interest, and the time-intensive teardown goes only to people who asked for it.

**Rules:** the ideas are real and specific to their page ("A generic checklist dressed as a teardown burns trust and the brand"); give enough to be useful and keep "how we'd do all of it" for the call; volume around 50 well-chosen accounts a week, mostly Tier 1 and 2; an agent may draft the teardown, and a human expert reviews every one before it goes out.

**Measure:** permission rate, teardown-to-call rate, call-to-proposal rate.

## 2. Product-led outbound (self-serve and freemium SaaS)

[coreyhaines31/marketingskills, cold-email] Reach people already using the product when their usage shows they're ready for more.

**Triggers,** roughly strongest first: hitting a plan, credit or usage limit; a much larger job or upload than usual; inviting teammates; signing up from a company domain that matches the ICP; returning repeatedly to pricing or upgrade pages. The events behind these are in [posthog SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md).

**Sequence**

1. **Within minutes of the trigger,** a short plain-text email from a founder or named account owner, from their own address, about what they're doing:
   > Saw you're verifying larger lists this week. If you're running these before outbound campaigns, a couple of settings help with catch-all domains. Happy to share them, or set you up with a volume plan if you're doing this regularly.
2. **LinkedIn connect** the same or next day, for company-domain users.
3. **One follow-up** with a specific resource for their use case.
4. **Stop** if they upgrade, go quiet for two weeks, or say no.

**Rules:** speed matters most here ("the trigger loses most of its value within a day"); "Never make the tracking feel like surveillance. Talk about the job they're doing and leave the logged events out of it."; help first, upgrade second; route accounts that exceed self-serve limits to a person ([revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md)).

**Measure:** trigger-to-reply rate, trigger-to-upgrade rate within 14 days, expansion revenue per triggered account.

## 3. Problem-led outbound (any product)

[coreyhaines31/marketingskills, cold-email] The default for accounts with no product usage: lead with a problem the segment is known to have, prove you understand it, offer something small.

**Trigger:** a signal from [prospecting SIGNALS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SIGNALS.md), or a tightly defined segment.

**Offer something smaller than a meeting:** a sample of the work (verify a sample of their list, audit one page, benchmark one metric), a relevant resource, or a quick answer to a question they're probably asking.

> Agencies running outbound for several clients usually find out about a bad list when the domain is already hurting. Want me to run a sample of one client's list through and send back what would have bounced?

**Rules:** the problem is specific to the segment, with proof from a similar customer; the free sample is genuinely small to deliver; and "If you sell deliverability, compliance, or quality, your own outbound has to be flawless. A bounce, a typo, or a missing opt-out from a company selling those things undercuts the pitch."

## 4. Founder-led outbound

[coreyhaines31/marketingskills, cold-email] Early stage, or a small set of strategic accounts: the founder writes personally, from their own account, about why they built the thing.

- Short, personal, specific to the recipient. No templates.
- Ask for advice or feedback as often as for a meeting. "People answer founders."
- 10 to 20 a week, done consistently, beats occasional bursts.
- Pairs with the founder posting on LinkedIn, so the name is familiar ([social-media SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md)).

## Choosing a play

[coreyhaines31/marketingskills, cold-email]

| If you... | Start with |
|---|---|
| Sell services where expertise is visible | Value-first teardown |
| Have self-serve users | Product-led for usage triggers, problem-led for everyone else |
| Sell a technical product to a defined segment | Problem-led with a free sample |
| Are pre-product-market fit or chasing a few big logos | Founder-led |

"Run one play at a time until it works. Each needs its own copy, its own success metric, and a few hundred touches before you can judge it." Every play still runs inside the rules in [SKILL.md](SKILL.md#the-rules).

## Prove it

The play has a named trigger, an offer, a sequence and one success metric written down before the first send; a teardown's ideas name things on that prospect's page and a human expert approved it; a product-led email mentions the job the user is doing and none of the tracked events; the free sample in a problem-led email is genuinely small to deliver; and only one play is being judged at a time.
