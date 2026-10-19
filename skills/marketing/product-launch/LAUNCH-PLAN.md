# Launch plan

The strategy layer of a web or SaaS launch, copied and adapted from coreyhaines31/marketingskills `launch` (MIT). The source's company case studies (Superhuman, Notion, TRMNL, SavvyCal, Reform) are left out: they are anecdotes with no citation. Its vendor plugs (Introw, Navattic) are left out too. For an app store launch, use [app-growth LAUNCH-AND-MARKETING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/LAUNCH-AND-MARKETING.md), which has the store-specific calendar.

**Contents:** [Ask first](#ask-first) · [Readiness gate](#readiness-gate) · [The ORB channels](#the-orb-channels) · [Five phases](#five-phases) · [After the launch](#after-the-launch) · [Ongoing launches](#ongoing-launches) · [Checklist](#checklist) · [Prove it](#prove-it)

## Ask first

[coreyhaines31/marketingskills, launch] Read `.agents/product-context.md` first, then ask only what it does not answer:

1. What are you launching? (New product, major feature, minor update)
2. What's your current audience size and engagement?
3. What owned channels do you have? (Email list size, blog traffic, community)
4. What's your timeline for launch?
5. Have you launched before? What worked/didn't work?
6. Are you considering Product Hunt? What's your preparation status? (If yes, [PRODUCT-HUNT.md](PRODUCT-HUNT.md).)

## Readiness gate

[coreyhaines31/marketingskills, launch] Run this before the phases. "Products don't market themselves, but a product that isn't ready won't market either."

Two failure modes kill launches from opposite ends:

- **Stealth Mode:** launching too late. "Procrastination in a fancy suit." You keep polishing in private, waiting for the product to be perfect. It never ships, and nobody learns you exist.
- **"Just One More Feature":** never launching. Every proposed launch date gets pushed for one more thing. The scope creeps forever; the launch never comes.

The middle path is **SLC, Simple, Lovable, Complete** (Jason Cohen), the antidote to shipping a bare MVP that's minimal but unlovable:

- **Simple:** it does *one* thing. Not many things poorly. One clear job, done well.
- **Lovable:** people *want* to use it, not just tolerate it. If nobody would be sad to lose it, it isn't lovable yet.
- **Complete:** it's a *whole* experience for that one thing, not a stub with obvious holes. Complete at its chosen scope, not a teaser of a bigger promise.

Quick check before running the phases:

- [ ] Does it do one clearly-defined thing? (Simple)
- [ ] Would a target user *choose* to use it, not just endure it? (Lovable)
- [ ] Is that one thing a whole experience, with no glaring stubs? (Complete)
- [ ] Are you polishing past this bar? Stop. You're in Stealth Mode. Ship.
- [ ] Are you still adding new things to the scope? Stop. You're in "Just One More Feature." Cut back to SLC.

Product Hunt's guide describes the same choice as three camps of founders: ship right away, get feedback then ship, or wait for "that magic moment"; it does not pick one for you. [https://www.producthunt.com/launch/before-launch]

## The ORB channels

[coreyhaines31/marketingskills, launch] Structure launch marketing across three channel types. "Everything should ultimately lead back to owned channels."

| Type | What it is | Examples | How to use it |
|---|---|---|---|
| **Owned** | Your direct relationship and publishing assets; this category does not waive the rules of a provider hosting or delivering them | Email list, blog, podcast, branded community (Slack, Discord), website or product | Start with 1-2: industry lacks quality content, start a blog; people want direct updates, focus on email; engagement matters, build a community |
| **Rented** | Visibility on platforms you don't control; algorithms shift, rules change, pay-to-play rises | Social (X, LinkedIn, Instagram), app stores and marketplaces, YouTube, Reddit | Pick 1-2 where the audience is active; use them to drive traffic to owned channels; never the only strategy. X threads link to the newsletter; LinkedIn posts lead to gated content or email signup; marketplace listings (Shopify, Slack) drive to the site |
| **Borrowed** | Someone else's audience | Guest posts, podcast interviews, newsletter features; webinars, co-marketing, social takeovers; conferences, panels, virtual summits; influencer partnerships | List the leaders your audience follows, pitch win-win collaborations, find audience overlap with SparkToro or Listen Notes, set up affiliate or referral incentives |

"Rented channels give speed, not stability." "Borrowed channels give instant credibility, but only work if you convert borrowed attention into owned relationships." Partner work is [partnerships](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/SKILL.md); community work is [community-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/community-marketing/SKILL.md); press and podcasts are [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md); creators are [creator-marketing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md); referral and affiliate mechanics are [referral-programs SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md).

The source's owned-channel definition said "no algorithm or platform rules" while including hosted communities. Slack's terms still bind workspace users to its User Terms and Acceptable Use Policy, and [mailbox rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md) still apply to email. Keep owned as the source's direct-relationship category, not a platform-policy exemption. The recurring-content funnel application is in [content-strategy DISTRIBUTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/DISTRIBUTION.md#orb-as-a-funnel). [https://slack.com/terms-of-service/user; coreyhaines31/marketingskills, launch]

## Five phases

[coreyhaines31/marketingskills, launch] Launching is a phased process that builds momentum.

| Phase | Actions | Goal |
|---|---|---|
| **1. Internal** | Recruit early users one-on-one to test for free; collect feedback on usability gaps and missing features; the prototype only needs to demo | Validate core functionality with friendly users |
| **2. Alpha** | Landing page with an early-access signup form; announce the product exists; invite users individually; the MVP works in production, even if still evolving | First external validation and the start of a waitlist |
| **3. Beta** | Work through the early-access list (some free, some paid); market with teasers about the problems you solve; recruit friends, investors and influencers to test and share. Consider a waitlist page, a "Beta" sticker in the dashboard navigation, email invites, an early-access toggle in settings | Build buzz and refine with broader feedback |
| **4. Early access** | Leak details (screenshots, feature GIFs, demos); gather usage data and qualitative feedback; run user research with engaged users (incentivize with credits); optionally a product/market fit survey. Expand by throttling invites in batches of 5-10% at a time, or invite everyone under "early access" framing | Validate at scale and prepare for full launch |
| **5. Full** | Open self-serve signups; start charging (if not already); announce general availability on every channel | Maximum visibility and conversion to paying users |

Full-launch touchpoints: customer emails; in-app popups and product tours; a website banner linking to launch assets; a "New" sticker in the dashboard navigation; a blog post; social posts; Product Hunt ([PRODUCT-HUNT.md](PRODUCT-HUNT.md)), BetaList, Hacker News. A recruitment ask to friends and investors in phase 3 is for testing and sharing; on Product Hunt it must never become an upvote ask ([PRODUCT-HUNT.md](PRODUCT-HUNT.md#what-gets-a-launch-removed)).

Sending the invite and onboarding emails lawfully and reliably is [email-practices SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md).

## After the launch

[coreyhaines31/marketingskills, launch] The launch isn't over when the announcement goes live:

- **Educate new users:** an automated onboarding email sequence introducing key features and use cases.
- **Reinforce the launch:** include the announcement in your weekly, biweekly or monthly roundup email to catch people who missed it.
- **Differentiate:** publish comparison pages ([comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)).
- **Update web pages:** add sections about the new feature or product across the site.
- **Offer a hands-on preview:** a no-code interactive demo visitors can explore before signing up.

"It's easier to build on existing momentum than start from scratch."

## Ongoing launches

[coreyhaines31/marketingskills, launch] Don't rely on one launch event; every update is a smaller launch. Decide how much marketing each one deserves:

| Tier | Typical changes | Output |
|---|---|---|
| **Major** | New capability, new plan, product overhaul, big workflow change | Changelog, blog post, email, social, in-app messages: full campaign |
| **Medium** | New integration, notable UX improvement, performance gain customers can feel | Changelog, targeted email to the relevant segment or an in-app banner, one social post |
| **Minor** | Fixes, polish, small additions | Changelog only, batched |

- Several medium changes that share a theme ("five improvements to reporting") can be bundled into one major-tier story.
- **Space out releases:** stagger announcements instead of shipping everything at once.
- **Reuse what worked** in earlier announcements.
- **Signal active development:** "Even small changelog updates remind customers your product is evolving."
- **Turning merged pull requests into the week's changelog, announcement drafts and the pages a change made wrong** (inputs, "You can now ___", grounding claims, the weekly digest with Keep a Changelog headings, drafts staged for review) is in [SHIPPED-CHANGES.md](SHIPPED-CHANGES.md).

## Checklist

[coreyhaines31/marketingskills, launch]

**Pre-launch**
- [ ] Landing page with a clear value proposition ([cro SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md))
- [ ] Email capture or waitlist signup
- [ ] Early-access list built
- [ ] Owned channels established (email, blog, community)
- [ ] Rented channel presence (social profiles optimized)
- [ ] Borrowed channel opportunities identified (podcasts, influencers)
- [ ] Product Hunt listing prepared, if using ([PRODUCT-HUNT.md](PRODUCT-HUNT.md))
- [ ] Launch assets created (screenshots, demo video, GIFs)
- [ ] Onboarding flow ready
- [ ] Analytics and tracking in place
- [ ] Site launch audit done if the launch includes a new site, redesign or migration ([site-audit LAUNCH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-audit/LAUNCH.md))

**Launch day**
- [ ] Announcement email to the list
- [ ] Blog post published
- [ ] Social posts scheduled and posted
- [ ] Product Hunt listing live, if using
- [ ] In-app announcement for existing users
- [ ] Website banner or notification active
- [ ] Team ready to engage and respond
- [ ] Monitor for issues and feedback

**Post-launch**
- [ ] Onboarding email sequence active
- [ ] Follow-up with engaged prospects
- [ ] Roundup email includes the announcement
- [ ] Comparison pages published
- [ ] Interactive demo created
- [ ] Gather and act on feedback
- [ ] Plan the next launch moment

## Prove it

- The plan answers the six ask-first questions, and the SLC check is written down with a yes for each of Simple, Lovable and Complete.
- Every rented and borrowed tactic names the owned channel it feeds.
- Each phase has dated actions and a goal; nothing announced is behind a flag or undeployed.
- Each later update is tiered, and its outputs match its tier (no full campaign for a minor fix).
- A launch that recovers from a flop (few signups three weeks in) starts by reading which channels produced the signups that did come, then runs the post-launch list.
