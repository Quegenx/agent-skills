# Client types

The 13-section plan structure stays consistent across client types. What changes is the **content emphasis** within each section. This doc names the dominant patterns by client archetype.

Source: [coreyhaines31/marketingskills, marketing-plan] `references/client-types.md` (v1.2.2, MIT, Corey Haines), copied with its dashes replaced, its file and skill names mapped to this repo, and `.agents/product-marketing.md` written as `.agents/product-context.md`. "Quietude" is the source's anonymized example client. Where an archetype recommends cold email or "Cold outbound to seed supply", it runs only under the consent and opt-out rules in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md) and [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md), and LinkedIn outreach within LinkedIn's User Agreement (repo rule). For apps, the store, Apple Ads and paywall detail is in [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md) and [app-growth](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).


**Contents:** [Archetype 1 - B2B SaaS](#archetype-1---b2b-saas) · [Archetype 2 - D2C Consumer App (Subscription)](#archetype-2---d2c-consumer-app-subscription) · [Archetype 3 - Hybrid Hardware + Software](#archetype-3---hybrid-hardware--software) · [Archetype 4 - Marketplace](#archetype-4---marketplace) · [Archetype 5 - Developer Tool / Open Source](#archetype-5---developer-tool--open-source) · [Archetype 6 - Deep-Tech / Scientific / Clinical](#archetype-6---deep-tech--scientific--clinical) · [Archetype 7 - Commerce / DTC (non-subscription)](#archetype-7---commerce--dtc-non-subscription) · [How to use this doc when drafting a plan](#how-to-use-this-doc-when-drafting-a-plan) · [When the client doesn't fit cleanly](#when-the-client-doesnt-fit-cleanly) · [Prove it](#prove-it)

## Archetype 1 - B2B SaaS

### Core characteristics
- Subscription revenue
- Often higher ACV ($1K - $100K+ per year)
- Sales-assisted or self-serve depending on tier
- Buyer often different from user (champion vs. end-user)

### AARRR emphasis

**Acquisition heavy:**
- SEO is the dominant top-of-funnel motion (people search for solutions)
- Content marketing (blog, knowledge base, comparison pages) drives MQLs
- LinkedIn for both organic founder presence and paid
- Outbound (cold email + LinkedIn) often complements inbound
- Events (conferences, webinars) for high-ACV products

**Activation:**
- Signup → trial → first key action (PLG products)
- Trial → demo → POC (sales-led products)
- Empty states matter - guide users to first value action

**Retention:**
- Product engagement metrics (DAU, feature adoption)
- Customer success motion (CSM team for higher ACV)
- Lifecycle emails focused on feature discovery, value moments

**Referral:**
- Customer advocacy programs
- Partner / integration co-marketing
- G2 / Capterra reviews
- Champion-to-buyer expansion

**Revenue:**
- Expansion / NRR is often the biggest growth lever
- Tier upgrades, seat expansion, usage-based add-ons

### Skills emphasis
- [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md), [seo PAGES-AT-SCALE](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md), [comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md), [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md), [ai-search-visibility](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md)
- [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) weighted toward LinkedIn + Google
- [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md) for trial nurture + lifecycle
- [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) for tier optimization

### Tier-1 budget priority
- SEO + content > everything else
- Founder-led LinkedIn channel
- Customer.io / Mailchimp for nurture
- HARO + investor backchannel for PR

## Archetype 2 - D2C Consumer App (Subscription)

### Core characteristics
- Lower ACV ($5 - $30/mo typically)
- High volume, lower margin per user
- App Store / Play Store as the primary acquisition surface
- Lifecycle email + push for retention
- Often paid-acquisition-driven once budget unlocks

### AARRR emphasis

**Acquisition:**
- App Store Optimization (ASO) is the highest-leverage non-site asset
- Paid social (Meta, TikTok) often dominant once budget exists
- Apple Search Ads for high-intent App Store traffic
- Influencer + content creators
- PR + endorsements

**Activation:**
- Onboarding is the dominant activation surface
- Time-to-value must be minutes, not hours
- Paywall structure + trial length critical

**Retention:**
- Lifecycle email + push
- In-app reminders (carefully - overuse = churn)
- Subscription preference center
- Win-back campaigns

**Referral:**
- Built-in sharing (share-a-month flow)
- Two-sided referrals
- Influencer / creator ambassadors

**Revenue:**
- Annual plan default is the biggest single move (compresses MRR but improves LTV)
- Tier optimization (Free → Premium → Premium+)
- In-app upsells

### Skills emphasis
- [onboarding-and-upgrades](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/onboarding-and-upgrades/SKILL.md) (the source's `onboarding` and `paywalls`), [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md)
- [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md), [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md) (heavy creative iteration)
- [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md)
- [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) for annual default + tier consolidation

### Tier-1 budget priority
- ASO first (highest organic leverage)
- Onboarding rebuild
- Lifecycle email shipping
- Founder-led social if founder is on-camera

## Archetype 3 - Hybrid Hardware + Software

### Core characteristics
- Physical product + software companion (e.g., Quietude's eye mask + app)
- Hardware as a distribution wedge (lower price, easier first purchase)
- Software as the LTV (recurring revenue)
- Blended CAC across both surfaces

### AARRR emphasis

**Acquisition:**
- Shopify storefront SEO (hardware product pages target consumer search)
- Amazon listing (high-discovery, takes margin)
- PR amplification (hardware is photogenic - high-profile influencer endorsements move volume)
- Paid social for hardware (Meta + Instagram, eye-catching creative)

**Activation:**
- Two activations to track: hardware unboxing experience + software signup
- Hardware → software activation flow is the bridge
- Concierge setup for high-value hardware buyers

**Retention:**
- Hardware post-purchase lifecycle (different from app onboarding)
- Software companion drives stickiness
- Community / practitioner network around hardware

**Referral:**
- Hardware gifting flows (high WOM for physical products)
- Eye-catching hardware drives organic social sharing
- Reviews on Shopify + Amazon

**Revenue:**
- Blended LTV math is critical (hardware margin + software recurring)
- Bundle strategy (hardware buy → free Premium for X months)
- Annual plan default for software

### Skills emphasis
- [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md) for Shopify product pages
- [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md) for both hardware post-purchase and software lifecycle
- [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md) with gifting layer
- [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) for blended-bundle math
- [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) with creative-heavy Meta presence

### Tier-1 budget priority
- Shopify product page optimization
- Hardware post-purchase lifecycle ship
- Bundle strategy formalization
- Hardware → app activation audit

## Archetype 4 - Marketplace

### Core characteristics
- Two-sided product (supply + demand)
- Network effects matter
- Liquidity is the critical early metric
- Take-rate × GMV is the revenue model

### AARRR emphasis

**Acquisition:**
- Two funnels - supply and demand
- Supply often acquired through outbound / partnership / cold email
- Demand often acquired through SEO / paid / content
- City-by-city programmatic SEO common

**Activation:**
- Supply activation: first listing posted, first response sent
- Demand activation: first purchase / first match / first transaction
- Both sides need their own onboarding

**Retention:**
- Repeat transaction frequency
- Supply utilization (% of listings active)
- Demand habit (DAU / MAU)

**Referral:**
- Supply → supply (refer other providers)
- Demand → demand (refer other buyers)
- Cross-side referrals are weaker

**Revenue:**
- Take-rate optimization
- Premium tier (better matching, lower fees)
- Lead-gen vs. transaction-fee monetization

### Skills emphasis
- [seo PAGES-AT-SCALE](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md) for city pages, vertical pages
- [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md) for supply-side recruitment
- [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md) for both sides
- [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) for take-rate decisions

### Tier-1 budget priority
- Programmatic SEO build for one side
- Cold outbound to seed supply (or demand, whichever is bottleneck)
- Lifecycle email for both sides

## Archetype 5 - Developer Tool / Open Source

### Core characteristics
- Technical buyer (developer or eng leader)
- High bar for content quality (developers are skeptical)
- DevRel matters more than traditional marketing
- Open source layer often funnel into commercial product

### AARRR emphasis

**Acquisition:**
- Technical content + docs SEO
- DevRel (conferences, talks, community)
- GitHub presence + npm/pip/etc. discovery
- Hacker News + Reddit + dev Twitter

**Activation:**
- First build / first integration is the activation event
- Time-to-Hello-World matters
- Documentation = onboarding for dev tools

**Retention:**
- Depth of integration (using more of the product)
- Team adoption (one user → entire org)
- Active project count

**Referral:**
- Star count on GitHub (semi-organic)
- Recommendation in technical forums
- Conference talks mentioning the tool

**Revenue:**
- Free → paid conversion when usage exceeds limits
- Team plans, enterprise tiers
- Support / SLA upsells

### Skills emphasis
- [seo PAGES-AT-SCALE](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md) for docs
- Less emphasis on traditional [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md)
- Heavy [content-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md) + technical content
- [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md) to engineering leads at target companies

### Tier-1 budget priority
- Docs + technical content production
- DevRel (founder doing talks)
- GitHub presence
- HN / Reddit / dev community

## Archetype 6 - Deep-Tech / Scientific / Clinical

### Core characteristics
- Long sales cycles
- Heavy credibility burden (must prove the science)
- Highly informed buyers (academics, clinicians, researchers)
- Often regulatory considerations

### AARRR emphasis

**Acquisition:**
- Academic publishing + peer-reviewed studies
- Conference speaking (academic + industry)
- Investor / advisor introductions
- PR via credibility hooks

**Activation:**
- Pilot programs / proof-of-concepts
- Concierge setup with high-touch onboarding
- Educational webinars / training

**Retention:**
- Customer success heavily
- Co-publication with customers
- Community of practice

**Referral:**
- Academic / clinical references
- Conference panel features
- Case studies with named institutions

**Revenue:**
- Pilot → paid expansion
- Institutional contracts (multi-seat / multi-year)
- Compliance / certification upsells

### Skills emphasis
- Light traditional marketing
- Heavy [product context](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md), [sales-enablement](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md), [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md)
- [cold-outreach](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md) to specific researchers / practitioners
- PR + investor marketing

### Tier-1 budget priority
- Academic outreach + conference speaking
- Investor backchannel for institutional warm intros
- Pilot deployment with key customers
- Case study + scientific publication

## Archetype 7 - Commerce / DTC (non-subscription)

### Core characteristics
- Physical or digital products sold transactionally
- Average Order Value matters
- Repeat purchase rate is the key retention metric

### AARRR emphasis

**Acquisition:**
- Paid social (Meta, TikTok) often dominant
- Shopify SEO for product pages
- Amazon listings
- Influencer + creator partnerships

**Activation:**
- First purchase is the activation event
- Cart abandonment recovery
- Trust signals on checkout (reviews, returns, shipping)

**Retention:**
- Post-purchase lifecycle
- Loyalty programs
- Email + SMS for repeat purchase

**Referral:**
- Gifting flows
- Refer-a-friend programs
- Reviews + UGC

**Revenue:**
- AOV optimization (bundles, upsells)
- Customer LTV optimization (repeat purchase frequency)
- Subscription option for repeat purchases

### Skills emphasis
- [paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md) + [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md) (heavy weight)
- [email-marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/email-marketing/SKILL.md) for post-purchase + abandoned cart
- [referral-programs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/referral-programs/SKILL.md) with gifting
- [pricing-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/pricing-strategy/SKILL.md) for bundles + subscription option

### Tier-1 budget priority
- Shopify storefront optimization
- Email lifecycle ship
- Influencer / UGC seeding
- Paid social testing (if minimal budget exists)

## How to use this doc when drafting a plan

When you start drafting Sections 4 to 8 (AARRR), identify the client's archetype (or hybrid if applicable) and lean into the patterns above.

**Hybrid cases are common.** Quietude is "Hybrid hardware + software" with significant overlap to "Deep-tech / scientific / clinical" (because of the peer-reviewed study + clinical positioning). The plan blends emphases from both archetypes.

When in doubt, lead with the archetype that best fits the *primary monetization model*. Quietude's primary monetization is software subscription (with hardware as the wedge), so the D2C consumer app + hardware-hybrid patterns dominate, with deep-tech credibility moves layered in.

## When the client doesn't fit cleanly

Some clients defy archetype:
- **Content / media businesses** - neither SaaS nor commerce; ad revenue or subscription model
- **Social networks** - own category, network effects dominate
- **Real estate / events** - physical + service model

For these, identify the closest archetype and adjust. Don't force-fit - name the deviation in the plan's Strategic Frame.

## Prove it

The plan names the client's archetype (or the primary-monetization archetype for a hybrid) and its emphasis shows in Sections 4 to 8; a client that fits none is mapped to the closest one with the deviation named in Section 2; any cold outbound in the plan runs inside the law and platform rules.
