# AI avatars

An AI avatar delivers a script as a talking head, with lip-sync, expressions and gestures, so nobody has to film. It suits recurring and multilingual content; it is the wrong tool for authentic founder content and for showing the product. From [coreyhaines31/marketingskills, video] (MIT); plans and counts from heygen.com/pricing, checked 2026-10-18. A talking portrait built in code from one still and three mouth patches is asset-prep's "A talking portrait" in [asset-prep SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md).

## When an avatar fits

[coreyhaines31/marketingskills, video]

| Scenario | Avatar? | Use instead |
|---|---|---|
| Recurring content (weekly updates) | Yes | |
| Multilingual versions | Yes | |
| Personalized outreach at scale | Yes, within the law (below) | |
| Authentic founder content | No | Film yourself |
| Product UI walkthrough | No | Screen recording ([asset-prep APP-RECORDING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/APP-RECORDING.md)) |
| Creative or artistic video | No | AI generation ([AI-GENERATION.md](AI-GENERATION.md)) |

## HeyGen

[coreyhaines31/marketingskills, video] recommends HeyGen for lip-sync and micro-expressions, and because it "has an official MCP server: AI agents can generate avatar videos directly". Best for product explainers, feature announcements, personalized sales outreach and multilingual content.

The source's plan table ("230+ avatars, 140+ languages"; Creator and Business "Unlimited" videos at 5 and 20 minutes) is stale. heygen.com/pricing on 2026-10-18 lists 700+ stock avatars and 175+ languages, and the paid plans are credit-based, not unlimited:

| Plan | Price | Allowance | Longest video |
|---|---|---|---|
| Free | $0 | 3 videos a month (500+ avatars, 30+ languages) | 1 min |
| Creator | $29 a month | 600 credits | 30 min |
| Pro | $49 a month | 1,000 credits | 30 min |
| Business | $149 a month + $20 a seat | 1,500 credits | 60 min |
| Enterprise | Custom | Custom | No maximum |

Recheck the page before quoting a price: plans change.

**Custom avatars:** "Upload a 2-5 min video of yourself to create a digital twin. Looks and sounds like you, generates videos from text scripts." [coreyhaines31/marketingskills, video] The source scopes this to the user's own likeness. Make a custom avatar or cloned voice only of the user, or of a person who agreed to it, and record who agreed (this is the source's scope, not a legal ruling; no law was checked here).

## Synthesia

[coreyhaines31/marketingskills, video] Full-body avatars with expressive body language and built-in script generation from URLs and documents. Best for corporate training, compliance videos and enterprise presentations "where professional tone > realism".

## Weekly update videos

[coreyhaines31/marketingskills, video] eval 2: for recurring 60-second updates with nobody on camera, the source's setup is a script written from `.agents/product-context.md`, the avatar video generated from it (through the MCP server when an agent runs it), optional overlays of real screens and callouts built in code ([make-video](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/SKILL.md)), then export and distribution. If authentic founder content matters more than scale, film yourself instead.

## Personalized outreach videos

[coreyhaines31/marketingskills, video] eval 5 (50 intro videos, each naming a different company and pain point): write one master script with variables, loop over the list, check the first 5 by hand before generating the rest, caption every video, and track replies against plain cold email, since the videos cost more to make and must earn it.

Every one of these is a cold message. The send follows the law and the channel's rules: CAN-SPAM, GDPR and CASL in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md), and the outreach rules in [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

## Prove it

Each avatar and cloned voice has a named owner who agreed to it, on record; any plan or price you quote matches heygen.com/pricing on the day you quote it; the first 5 personalized videos were watched by a person before the batch ran; every send in an outreach batch passes the checks in email-practices COMPLIANCE.md; every avatar video ships with captions.
