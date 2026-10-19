---
name: product-launch
description: "Plans web and SaaS product launches and feature announcements: the readiness gate (Simple, Lovable, Complete), owned, rented and borrowed channels, the five launch phases, how much marketing each update deserves, shipped-change digests and announcement drafts, the launch checklist, and a Product Hunt launch run by Product Hunt's own rules (accounts, scheduling, listing limits, first comment, what gets a product removed, relaunching). Use when planning a launch, a beta or early access, a feature announcement or a Product Hunt launch, or when a launch flopped."
---

# Product launch

A launch is a sequence, not a day: a product that is Simple, Lovable and Complete goes out in phases, every phase pulls attention from rented and borrowed channels back into owned ones (email, blog, community, site), and every later feature is a smaller launch of its own. This skill is built from coreyhaines31/marketingskills `launch` (MIT, version 2.2.0) and, for Product Hunt, from Product Hunt's own launch guide and help center, which win wherever the two differ. App store launches (pre-orders, TestFlight, phased release, the 8-week app calendar) are in [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md); press for a launch is [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md); a launch event is [event-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/event-marketing/SKILL.md).

Before asking questions, read the shared product context file `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); the source calls it `.agents/product-marketing.md`.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Is it ready to launch (Stealth Mode, "Just One More Feature", SLC), owned, rented and borrowed channels, the five phases from internal to full launch, post-launch work, update tiers for later features, the three-part checklist, the questions to ask first | [LAUNCH-PLAN.md](LAUNCH-PLAN.md) |
| Turning shipped code into a changelog, announcement drafts, claim-drift updates and a weekly digest | [SHIPPED-CHANGES.md](SHIPPED-CHANGES.md) |
| Product Hunt: who can post, the 1-week account wait, self-hunting, day and time, scheduling, every listing field and its limit, the maker's first comment, what is against the rules, launch day, the Product Page, relaunching within 6 months | [PRODUCT-HUNT.md](PRODUCT-HUNT.md) |

## The rules

1. **Gate before mechanics.** If it is not yet Simple, Lovable and Complete, cut scope until one thing is; if it already is and you are still polishing, ship ([LAUNCH-PLAN.md](LAUNCH-PLAN.md#readiness-gate)). [coreyhaines31/marketingskills, launch]
2. **Everything leads back to owned channels.** Use rented platforms and borrowed audiences to bring people into the email list, blog, community or product, not as the whole strategy. [coreyhaines31/marketingskills, launch]
3. **Launch in phases** (internal, alpha, beta, early access, full) and only market what customers can use today; anything behind a flag or not deployed waits. [coreyhaines31/marketingskills, launch]
4. **Size the announcement to the change:** major gets a full campaign, medium a targeted email or in-app message, minor a changelog line ([LAUNCH-PLAN.md](LAUNCH-PLAN.md#ongoing-launches)). [coreyhaines31/marketingskills, launch]
5. **Set measurable goals per launch,** not only "Product of the Day": Product Hunt itself lists failing to set measurable goals as a pre-launch mistake ([PRODUCT-HUNT.md](PRODUCT-HUNT.md#goals)). [https://www.producthunt.com/launch/sharing-your-launch]
6. **On Product Hunt, ask for feedback, never upvotes,** post from a personal account, and never pay a hunter or anyone to send traffic: Product Hunt removes the product and can ban the maker ([PRODUCT-HUNT.md](PRODUCT-HUNT.md#what-gets-a-launch-removed)). [https://www.producthunt.com/launch/sharing-your-launch]
7. **A launch that ships a new site, redesign or migration also passes the site launch audit** before, at and after the switch: [site-audit LAUNCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/LAUNCH.md). [coreyhaines31/marketingskills, launch]

## Prove it

The plan names what is launching, the SLC check passed, the owned channel every rented and borrowed tactic feeds, a dated phase plan and measurable goals; each later update is tiered and gets only its tier's outputs; for a Product Hunt launch, its listing has a tagline of at most 60 characters, a square thumbnail, at least 2 gallery images, a clean product URL with no shortener or UTM, a drafted maker first comment that asks for feedback, a personal account at least a week old, and no upvote ask anywhere in the launch emails and posts; and each file's own Prove it checks pass for the parts you used.
