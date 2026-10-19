---
name: event-marketing
description: "Makes events produce pipeline, authority and content, not just attendance: choosing which events to invest in, hosting, sponsoring and exhibiting, speaking and attending, the before, during and after arc with tiered follow-up, formats from webinars to user conferences, sponsorship math (cost per qualified meeting), negotiation, side events and the booth, getting booked and designing a talk, the webinar funnel from registration to replay, measurement tiers, and lawful follow-up of badge scans. Use when planning, sponsoring, speaking at or attending a conference, trade show, webinar, dinner, meetup, workshop, virtual summit or user conference, deciding whether a sponsorship is worth it, or following up event leads."
---

# Event marketing

Events are "the most expensive, riskiest, hardest-to-measure channel", so the leverage is in choosing which ones to do, and the event itself is the small part: pipeline is made in the weeks before (meetings booked, a target list) and won or lost in the 24 to 48 hours after. This skill is built from coreyhaines31/marketingskills `events` (MIT, version 1.0.0), which credits Knowatoa's ai-visibility-skills (MIT) for the talk storyboard method and alirezarezvani/claude-skills (MIT) for the webinar idea, and distils the portfolio from Corey Haines's *Founding Marketing*; its case numbers are the book's anecdotes and its benchmarks are directional, as the source says itself. Consent rules for follow-up come from the FTC, CASL and the email skill. A launch announcement is [product-launch SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/SKILL.md); joint webinars' partner terms are [partnerships PARTNER-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/PARTNER-MARKETING.md); press and podcasts are [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md).

Before asking questions, read the shared product context file `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`. Then ask in one batch [coreyhaines31/marketingskills, events]:

1. **Which role?** Hosting, sponsoring or exhibiting, speaking, or attending.
2. **What outcome?** Pipeline and meetings, authority and brand, community, or content. Pick one: "events that try to do everything measure nothing."
3. **Who must be in the room?** The ICP segment, and roughly how many of them attend.
4. **Budget and team:** money, and who can actually work the event.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The four roles, the 20% event and 80% before-and-after arc, tiered follow-up, hosting formats, attending without a booth, the content arc, measurement tiers, common mistakes | [EVENT-ARC.md](EVENT-ARC.md) |
| Which events to invest in: when in-person is worth it, the 80/20 of events, why bigger is often worse, owned events, trade shows and community events, cost benchmarks | [PORTFOLIO.md](PORTFOLIO.md) |
| Should we sponsor (ICP overlap, cost per qualified meeting, the counterfactual), prospectus red flags, negotiation order, the side-event dinner, working the booth, follow-up, lawful follow-up of scans, measuring it | [SPONSORSHIP.md](SPONSORSHIP.md) |
| Speaking: getting booked, the outline and feeling storyboard, the recording as the real audience, before, during and after the talk | [SPEAKING.md](SPEAKING.md) |
| The webinar funnel: topic and offer, registration page and promotion, the show-up system and reminder consent, the live arc to the offer, post-webinar segments, replays, honest urgency, diagnostics | [WEBINAR-FUNNEL.md](WEBINAR-FUNNEL.md) |

## The rules

1. **Choose events by fit, then by size:** in-person earns its cost for high-trust, high-ACV motions; a few events drive most event pipeline; niche and regional events often beat mega-conferences on cost per qualified meeting ([PORTFOLIO.md](PORTFOLIO.md)). [coreyhaines31/marketingskills, events]
2. **Book meetings before you arrive.** "A meeting booked two weeks out is worth ten hopeful hallway collisions." [coreyhaines31/marketingskills, events]
3. **Capture context, not contacts:** after each conversation, record what they said, what they care about and the agreed next step. [coreyhaines31/marketingskills, events]
4. **Follow up in 24 to 48 hours, tiered:** hot gets a personal note and a concrete next step, warm gets one asset tied to their stated problem, scan-only gets one light touch or nothing, and never a sales sequence ([EVENT-ARC.md](EVENT-ARC.md#after)). [coreyhaines31/marketingskills, events]
5. **Follow up only where the law allows it:** a badge scan or business card implies consent in Canada only for messages relevant to the person's role, the US needs an opt-out and a postal address in every message, and in the EU follow the strictest rule ([SPONSORSHIP.md](SPONSORSHIP.md#lawful-follow-up)). [https://laws-lois.justice.gc.ca/eng/acts/E-1.6/page-2.html; https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business]
6. **Report pipeline, not applause:** registrations, badge scans and foot traffic are tracked but never reported as success; cost per qualified meeting decides whether you go again ([EVENT-ARC.md](EVENT-ARC.md#measurement)). [coreyhaines31/marketingskills, events]
7. **Record everything you're allowed to record,** and confirm before accepting a slot that you'll get the recording and may republish it ([SPEAKING.md](SPEAKING.md#the-recording)). [coreyhaines31/marketingskills, events]
8. **Urgency must be true:** no fake scarcity, no countdowns that reset ([WEBINAR-FUNNEL.md](WEBINAR-FUNNEL.md#stage-3-live-to-close)). [https://www.ftc.gov/system/files/ftc_gov/pdf/P214800%20Dark%20Patterns%20Report%209.14.2022%20-%20FINAL.pdf]

## Prove it

Apply these checks to the selected role and format: in-person meeting preparation, tiered lead follow-up, sponsorship economics, speaker recording rights and webinar deadlines belong to their corresponding branches. Do not require every role's deliverables for one event task. [coreyhaines31/marketingskills, events; EVENT-ARC.md; SPONSORSHIP.md; SPEAKING.md; WEBINAR-FUNNEL.md]

The plan names one role per motion, one primary outcome and the number of ICP attendees; meetings are booked before the event; every conversation has a context note; follow-up went out within 48 hours by tier, with no scan dumped into a sequence and every message lawful where its recipient is; the report leads with qualified meetings, opportunities and cost per qualified meeting against another channel; every talk and webinar has a recording you may republish; every deadline in the webinar offer is real; and each file's own Prove it checks pass for the parts you used.
