# Marketing operations stack

This doc maps every marketing-skill and every relevant MCP/API integration to the AARRR stage(s) it primarily serves. It's the source for Section 11 of every plan.

Source: [coreyhaines31/marketingskills, marketing-plan] `references/ops-stack-mapping.md` (v1.2.2, MIT, Corey Haines), copied with its dashes replaced, its file and skill names mapped to this repo, and `.agents/product-marketing.md` written as `.agents/product-context.md`. The source's tool-to-stage tables are kept as its own list; vendors without a home in this repo (Ahrefs, DataForSEO, Typefully, Customer.io, Dub.co, Rewardful) are optional.

> **Note on scope.** When a plan references a skill or tool that isn't available, fall back to the underlying tactic and call it out in Section 13's open decisions [coreyhaines31/marketingskills, marketing-plan].

## The thesis

A small team + fCMO + agentic tooling = output of a 15 to 20-person traditional marketing org. The skills + MCPs encode workflows that previously required dedicated headcount per channel.

The plan's Section 11 makes this thesis explicit by:
1. Mapping skills to stages so the founder sees which skills execute which work
2. Mapping MCPs/APIs to stages so the founder sees the tooling layer
3. Naming a concrete operational example that proves the stack works
4. Showing capability unlocks by funding stage (pre-seed → seed → Series A)

## Skills mapped to AARRR

The source's tables name its own marketingskills skills; this table maps each stage to the skills in this repo that do the same work.

| Stage | Primary skills | Supporting skills |
|---|---|---|
| Acquisition | [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md), [keyword-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md), [ai-search-visibility](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md), [content-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md), [comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md), [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md), [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md), [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md), [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md), [app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md) | [product-launch](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/SKILL.md), [public-relations](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md), [lead-magnets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/lead-magnets/SKILL.md) (free tools), [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md), [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md), [prospecting](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/SKILL.md), [landing-page-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md), [web-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/SKILL.md) |
| Activation | [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md), [cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md) (forms, signup, popups), [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md) | [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md), [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md), [growth-ideas PSYCHOLOGY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/PSYCHOLOGY.md), [revenuecat](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md) |
| Retention | [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md), [churn-prevention](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/SKILL.md) | [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md) (delivery and consent), [resend](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/resend/SKILL.md), [onesignal](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/SKILL.md), [sms-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SKILL.md), [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) |
| Referral | [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md), [partnerships](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/SKILL.md), [community-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/community-marketing/SKILL.md) | [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md), [creator-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/creator-marketing/SKILL.md), [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md) |
| Revenue | [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md), [offer-design](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/SKILL.md), [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md) (paywalls), [sales-enablement](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md), [revops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md) | [stripe](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md), [revenuecat](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/revenuecat/SKILL.md), [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) |
| Measurement | [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md), [google-analytics](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/SKILL.md), [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md), [search-console](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/search-console/SKILL.md) | [marketing-loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md) (the weekly review and tracking-QA loops) |
| Cross-cutting | the product context file ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)), [customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md) | [growth-ideas](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/growth-ideas/SKILL.md), [marketing-council](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-council/SKILL.md) |

## MCPs and APIs mapped to AARRR

### Acquisition tooling

| Tool | What it provides | Wired-at-client check |
|---|---|---|
| **Ahrefs API** | SEO data: keyword research, backlinks, competitor analysis | Required `AHREFS_API_KEY` in `.env` |
| **DataForSEO API** | SERP data, keyword volume, competitor SERP analysis | Required API key |
| **GA4 MCP** | Traffic by channel, conversion events, funnels (read-only, "Experimental") | A Google Cloud project with a service account or user OAuth / ADC (https://developers.google.com/analytics/devguides/MCP) |
| **Typefully MCP** | Social posting (LinkedIn, X, Threads, Bluesky) | Typefully account + API key |
| **Google Ads MCP** | Performance pulls only | Wired post-budget-unlock |

**Correction** (official): the source's row read "Ad account management, campaign creation, performance pulls". Google's official server (https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server, github.com/googleads/google-ads-mcp) has three tools, `search`, `get_resource_metadata` and `list_accessible_customers`, for "account discovery and performance reporting"; it cannot create or change campaigns.

| **agent-browser** | Browser automation (form fills, screenshots, scraping); this repo: [browser-automation](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/browser-automation/SKILL.md), within each site's terms | CLI install: `npm install -g agent-browser` |
| **dev-browser** | General-purpose browser automation | MCP server install |
| **defuddle** | Clean markdown extraction from web pages | CLI install |
| **Notion** | Internal knowledge directory access | Notion API key |
| **Stripe MCP** | LTV math, paid-CAC reconciliation (cross-cuts to Revenue) | Stripe account + restricted key |

### Activation tooling

| Tool | What it provides |
|---|---|
| **App Store Connect** | Conversion rate by listing variant, install funnel | Usually manual + `dev-browser` for screenshots |
| **Figma / Pencil MCP** | Onboarding screen design + iteration |
| **Customer.io MCP** | In-app messaging + lifecycle email coordination |
| **Stripe MCP** | Subscription state for paywall logic |
| **GA4 MCP** | Activation events instrumentation |

### Retention tooling

| Tool | What it provides |
|---|---|
| **Customer.io MCP** | The retention infrastructure - flow building, segmentation, sending |
| **Shopify** | Hardware buyer events as lifecycle triggers |
| **Stripe MCP** | Subscription state, churn cohorts, plan changes |
| **GA4 MCP** | Session events, retention curves |
| **Resend / Mailchimp / SendGrid** | Alternatives to Customer.io for different stacks |

### Referral tooling

| Tool | What it provides |
|---|---|
| **Dub.co** | Ambassador attribution, short links, per-ambassador tracking |
| **Stripe MCP** | Commission accounting + payouts via Connect |
| **Customer.io MCP** | Ambassador lifecycle (recruitment → onboarding → monthly digest → payout notifications) |
| **Rewardful / Tolt / Mention Me** | Alternatives to Dub for affiliate management |

### Revenue tooling

| Tool | What it provides |
|---|---|
| **Stripe MCP** | Pricing tests, subscription analytics, churn cohort analysis, blended CAC math |
| **Shopify** | Hardware transactions |
| **GA4 MCP** | Revenue events |
| **Customer.io MCP** | Paywall / pricing-related lifecycle |
| **Notion** | Commercial knowledge directory |

### Cross-cutting tooling

| Tool | What it provides |
|---|---|
| **Notion** | Shared knowledge base |
| **defuddle** | Research extraction |
| **obsidian-cli** | Working notes for fCMO |
| **Pencil MCP** | Design files |
| **Figma MCP** | Design files (if Figma) |

## Capability unlocks by funding stage

The plan's Section 11 must include this table (or equivalent), specific to the client's current and projected funding stages.

| Stage | Headcount | Tooling | Channels live |
|---|---|---|---|
| **Pre-seed / bootstrapped** | fCMO + founder team | All current tooling + marketing-skills library + MCP layer | Organic only (SEO, content, App Store, founder-led social, events, WOM, ambassador) |
| **Seed close** | + first marketing hire (lifecycle/content owner) | + paid ad accounts (Apple Search Ads, Meta, LinkedIn) + [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) skill activated | + paid acquisition pilot ($5 to 15K/mo - see [FUNDING-STAGES.md](FUNDING-STAGES.md) for canonical tiers) |
| **Seed deployment** | + designer (potentially fractional) | + analytics expansion (Mixpanel / Amplitude if needed) | + paid scaling ($20 to 50K/mo) + first launches (PH, GA) |
| **Series A** | + performance marketing lead + content lead | + dedicated tooling spend ([Tier 4 budget](FUNDING-STAGES.md#tier-4---series-a)) + sponsored event budget | + paid scaling ($50 to 150K/mo) + international consideration + B2B vertical expansion |
| **Series B+** | Full-stack marketing org (10+ people) | + agency partnerships + PR firm | + brand campaigns + acquisitions + sponsorships at category level |

**Source budget difference:** this operations example said $2 to 5K/mo for Series A software [coreyhaines31/marketingskills, marketing-plan, references/ops-stack-mapping.md]; the canonical funding-stage table gives $5,000 to 10,000/mo for its tooling stack [same source, references/funding-stages.md]. Use the funding-stage table as this plan's tier anchor and keep any client-specific budget explicit; do not silently combine the two ranges.

## The concrete-example test

Section 11 of the plan must include at least one concrete operational example that proves the stack thesis. The example should be:
- A specific event (not abstract claim)
- From this client's actual history if possible (most credible)
- Tied to a non-technical person executing via the stack (proves it works without dedicated engineering)

The source's examples (a founder drafting a lifecycle flow live on a kickoff call through an email tool's MCP; a team ranking new keywords with programmatic pages; a reactivation campaign built from billing and analytics data) show the shape. Their figures are the source's unverified anecdotes; don't reuse them as results.

If the client has no such moment in their history yet, frame the example as the *first move* - "Here's the demonstration the team will run in week one to validate the stack:"

## When the stack doesn't apply (yet)

For clients without MCP connections set up, frame Section 11 differently:
- List the skills that DO apply with current tooling
- Name which MCPs would unlock which sections of the plan
- Treat MCP setup as a Q1 priority alongside the bedrock fixes

A plan can't claim the agentic-stack thesis if the stack isn't wired. Be honest about state.

## Prove it

Section 11 maps every stage to skills that exist in this repo or flags them as external; every tool it names is in the client's stack or marked "future / not yet wired"; no MCP is credited with an action its official tool list lacks (Google Ads and GA4 MCPs read only); at least one concrete operational example comes from the client's own history or is framed as the week-one demonstration; the capability-unlock table is specific to the client.
