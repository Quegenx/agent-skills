---
name: growth-ideas
description: "Finds the right marketing ideas for a product's stage, budget and team from a library of 139 ideas, with guerrilla tactics and 72 buyer-psychology models, each idea that touches a platform rule carrying that rule. Use when the user is stuck on how to market something, asks for marketing or growth ideas, wants a brainstorm, or wants to apply psychology, mental models or persuasion to marketing."
---

# Growth ideas

A starting point when someone doesn't know how to market a product: suggest the 3 to 5 ideas that fit their stage, budget and team, explain how to start each, and hand execution to the skill that owns the channel. A full plan with every idea mapped to funnel stages is [marketing-plan](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-plan/SKILL.md); repeating an idea on a schedule is [marketing-loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md). Sources: [coreyhaines31/marketingskills, marketing-ideas] v2.0.1 (its guerrilla reference credits Corey Haines, *Founding Marketing*, ch. 13) and [coreyhaines31/marketingskills, marketing-psychology] v2.0.0 (MIT, Corey Haines), copied with their dashes replaced. Both source skills read `.agents/product-marketing.md`; this repo's file is `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The 139 ideas by category, one line each, with platform-rule notes (parasite SEO, programmatic pages, engagement pods, giveaways, review incentives, creator disclosure) | [IDEAS.md](IDEAS.md) |
| Guerrilla marketing: stories over campaigns, the direct-mail three-rule framework, ROI discipline, the case library, using it with a client | [GUERRILLA.md](GUERRILLA.md) |
| Buyer psychology: 72 mental models with their citation status, the repo and official limits on defaults, tiers, daily prices, scarcity and proof, the quick-reference table | [PSYCHOLOGY.md](PSYCHOLOGY.md) |

## How to use it

Read `.agents/product-context.md` first; ask only for what it doesn't cover. Then [coreyhaines31/marketingskills, marketing-ideas]:

1. Ask about their product, audience, and current stage if not clear
2. Suggest 3-5 most relevant ideas based on their context
3. Provide details on implementation for chosen ideas
4. Consider their resources (time, budget, team size)

Questions to ask: "1. What's your current stage and main growth goal? 2. What's your marketing budget and team size? 3. What have you already tried that worked or didn't? 4. What competitor tactics do you admire?"

## Ideas by category

[coreyhaines31/marketingskills, marketing-ideas]

| Category | Ideas | Examples |
|----------|-------|----------|
| Content & SEO | 1 to 10 | Programmatic SEO, Glossary marketing, Content repurposing |
| Competitor | 11 to 13 | Comparison pages, Marketing jiu-jitsu |
| Free Tools | 14 to 22 | Calculators, Generators, Chrome extensions |
| Paid Ads | 23 to 34 | LinkedIn, Google, Retargeting, Podcast ads |
| Social & Community | 35 to 44 | LinkedIn audience, Reddit marketing, Short-form video |
| Email | 45 to 53 | Founder emails, Onboarding sequences, Win-back |
| Partnerships | 54 to 64 | Affiliate programs, Integration marketing, Newsletter swaps |
| Events | 65 to 72 | Webinars, Conference speaking, Virtual summits |
| PR & Media | 73 to 76 | Press coverage, Documentaries |
| Launches | 77 to 86 | Product Hunt, Lifetime deals, Giveaways |
| Product-Led | 87 to 96 | Viral loops, Powered-by marketing, Free migrations |
| Content Formats | 97 to 109 | Podcasts, Courses, Annual reports, Year wraps |
| Unconventional | 110 to 122 | Awards, Challenges, [Guerrilla marketing](GUERRILLA.md) |
| Platforms | 123 to 130 | App marketplaces, Review sites, YouTube |
| International | 131 to 132 | Expansion, Price localization |
| Developer | 133 to 136 | DevRel, Certifications |
| Audience-Specific | 137 to 139 | Referrals, Podcast tours, Customer language |

## Picking ideas

[coreyhaines31/marketingskills, marketing-ideas]

**By stage.** Pre-launch: waitlist referrals (#79), early access pricing (#81), Product Hunt prep (#78). Early stage: content and SEO (#1 to 10), community (#35), founder-led sales (the source cites #47, which is the founder welcome email). Growth stage: paid acquisition (#23 to 34), partnerships (#54 to 64), events (#65 to 72). Scale: brand campaigns, international (#131 to 132), media acquisitions (#73).

**By budget.** Free: content and SEO, community building, social media, comment marketing. Low: targeted ads, sponsorships, free tools. Medium: events, partnerships, PR. High: acquisitions, conferences, brand campaigns.

**By timeline.** Quick wins: ads, email, social posts. Medium-term: content, SEO, community. Long-term: brand, thought leadership, platform effects.

**By use case:**

- **Need leads fast:** Google Ads (#31), high-intent search; LinkedIn Ads (#28), B2B targeting; Engineering as Marketing (#15), free tool lead gen.
- **Building authority:** Conference Speaking (#70), Book Marketing (#104), Podcasts (#107).
- **Low budget growth:** Easy Keyword Ranking (#1), Reddit Marketing (#38), Comment Marketing (#44).
- **Product-led growth:** Viral Loops (#93), Powered By Marketing (#87), In-App Upsells (#91).
- **Enterprise sales:** Investor Marketing (#133), Expert Networks (#57), Conference Sponsorship (#72).

## Output format

For each recommended idea [coreyhaines31/marketingskills, marketing-ideas]:

- **Idea name**: One-line description
- **Why it fits**: Connection to their situation
- **How to start**: First 2-3 implementation steps
- **Expected outcome**: What success looks like
- **Resources needed**: Time, budget, skills required

## Handoffs

Where each idea is carried out in this repo: programmatic SEO (#4) to [seo PAGES-AT-SCALE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md); comparison pages (#11) to [comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md); email sequences and campaign copy to [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md), delivery/authentication/list operations to [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md); free tools (#15) to [lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md); referrals and viral growth (#93, #137) to [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md); paid ads to [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md); social to [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md); launches to [product-launch](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/SKILL.md); app listings (#124) to [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md). A request to design a referral program or an A/B test is that skill's job, not an idea list (the source's evals).

## The rules

1. **Read `.agents/product-context.md` and ask for stage, budget, team and what was tried** before suggesting anything [coreyhaines31/marketingskills, marketing-ideas].
2. **Suggest 3 to 5 ideas filtered by stage, budget, timeline and use case,** each in the output format, unless the user asks for more [coreyhaines31/marketingskills, marketing-ideas].
3. **Carry each idea's platform note:** no parasite SEO for borrowed ranking, no engagement pods, giveaways within each platform's rules, unique value on programmatic pages, disclosure on paid or incentivized reviews and creator posts ([IDEAS.md](IDEAS.md)).
4. **Psychology claims are the source's, uncited:** never present a model's number as measured, and keep the repo and official limits noted under each model ([PSYCHOLOGY.md](PSYCHOLOGY.md)).
5. **Scarcity and urgency only when real;** the legal rules are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md) [coreyhaines31/marketingskills, marketing-psychology].
6. **Guerrilla plays start from a story, a qualified list and a small test** ([GUERRILLA.md](GUERRILLA.md)) [coreyhaines31/marketingskills, marketing-ideas].
7. **Hand execution to the owning skill** once an idea is chosen (Handoffs above).

## Prove it

From the source's seven idea evals [coreyhaines31/marketingskills, marketing-ideas]:

- A bootstrapped team of 3 with $500 a month: low-budget ideas from the catalog, ranked by likely impact, each with why it fits, how to start, the expected outcome and the resources needed.
- Enterprise security with $10k a month wanting leads fast: the leads-fast filter, paid and outbound ideas fit for enterprise, and a note that fast leads means paid or outbound, with timelines.
- A freemium PLG company with no ad budget: PLG, virality and referral ideas, none that depend on ads.
- A new HR tech company wanting authority: original research, content, community and media appearances, flagged as long-term.
- "Give me 20 ideas": about 20, across categories, each with brief context.
- "Set up a referral program": routed to [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md), no full program design here.
- A guerrilla request: handled with [GUERRILLA.md](GUERRILLA.md)'s Prove it.

The psychology evals are in [PSYCHOLOGY.md](PSYCHOLOGY.md#prove-it).
