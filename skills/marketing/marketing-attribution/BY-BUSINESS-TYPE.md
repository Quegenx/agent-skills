# Attribution by business type

The same "which channel drives revenue?" question wants a different source of truth, model and paradigm depending on cycle length, how many people are involved and where the budget goes. Two playbooks, B2B SaaS and ecommerce/DTC, and a blend for PLG with sales, from [coreyhaines31/marketingskills, attribution] (references/by-business-type.md, MIT). Match the product to one, or blend.

## B2B SaaS (long cycle, sales-assisted)

[coreyhaines31/marketingskills, attribution]

**Shape of the problem:** journeys run weeks to months, span several people (champion, economic buyer, users) and include touches that never appear in web analytics: a conference conversation, a sales call, a community mention, a peer recommendation. Deal values are high and volume low, so every deal matters and averages are noisy. With 15 touches over 3 months across 4 people, "last-touch = direct" and "first-touch = one LinkedIn ad" are both almost useless; the middle and the offline is where the deal was won.

1. **Source of truth = the CRM,** not an analytics tool. Revenue is real in the CRM (closed-won, ARR); everything else explains where those deals came from. Pipeline and revenue attribution live in [revops SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/revops/SKILL.md).
2. **Models: first-touch and position-based, shown together.** First-touch values demand creation; position-based credits the created-and-closed bookends. Last-touch alone will defund the top of funnel; don't lead with it.
3. **Self-reported attribution is the strongest signal.** Ask "How did you first hear about us?" on the demo request or signup form and again on sales calls. For word-of-mouth and dark-social-heavy B2B it catches what tracking can't (podcasts, communities, "my old coworker used you"). Weight it heavily.
4. **Attribute to pipeline stages, not just the conversion.** The useful question is what drove qualified pipeline and closed revenue: break MQL to SQL to closed-won down by first-touch channel. A channel that fills forms but never closes is a trap.
5. **MTA is weakest here; incrementality is awkward but valuable.** Low volume makes data-driven attribution unreliable and geo tests hard. Use on-off tests for big-ticket programs (turn a channel off for a quarter, watch pipeline) and lean on self-reported plus first-touch for the rest.
6. **Account level, not just lead level.** Roll touches up to the account, or you'll credit whichever person filled the form. One org is several people signing up with mixed work and personal emails: match contacts to the account (email domain, enrichment, the CRM's contact-to-account link) and attribute at the account. Exclude free-mail domains (gmail, yahoo, outlook) from domain matching; fall back to enrichment or manual matching for personal-email signups. (Production emphasis from Tessa Kriesel; the mechanics are in [FIRST-PARTY-STITCH.md](FIRST-PARTY-STITCH.md#account-rollup).)

**Tooling:** the CRM (HubSpot, Salesforce) as truth; a product-analytics tool identifying by user or account ID for first-party first touch; self-reported fields written to the CRM.

**The trap to name:** branded search and direct look like the best "channels" because that's where researched buyers convert. They're where demand created elsewhere cashes out. Segment branded vs non-branded search and treat a big direct share as evidence the top of funnel is working, not as a channel to invest in.

## Ecommerce / DTC (short cycle, self-serve)

[coreyhaines31/marketingskills, attribution]

**Shape of the problem:** journeys are fast (minutes to a few days), high-volume and almost entirely digital and self-serve. Budget concentrates in paid social, paid search and email/SMS. The conversion is a purchase you fully control. The dominant lie is platform over-attribution: Meta and Google each claiming the same sales.

1. **Source of truth = your store or backend** (Shopify, your payments system): the count of actual orders. Platform-reported conversions get de-duped against that total; they never define it and are never summed.
2. **Distrust platform ROAS by default.** After iOS ATT, platforms model and estimate conversions, count view-through and use generous windows, so "reported ROAS runs well above incremental ROAS". Use it for in-platform optimization, not cross-channel budget truth.
3. **Last-touch is defensible for quick-turn, impulse SKUs:** the closing click really is most of the story for a $30 impulse buy. It gets dangerous as consideration lengthens, where it over-credits retargeting and branded search.
4. **MMM once spend is material,** across paid social, search and offline (podcasts, TV, influencers, OOH): it sees the untrackable channels and the saturation curves. The source's threshold: "Below ~six figures/month of blended spend, MMM is overkill; good UTMs + a survey do more." That figure is the author's judgment, not a cited study.
5. **Incrementality on the biggest channels, especially the "always credited" ones:** geo holdouts and on-off tests earn their keep on retargeting, branded search and Meta prospecting, which platform reporting flatters most. Incremental CPA (spend / incremental orders) should move budget ([MEASUREMENT-PARADIGMS.md](MEASUREMENT-PARADIGMS.md#reading-a-test)).
6. **Post-purchase survey for dark social and brand demand:** a one-question "How did you hear about us?" on the order-confirmation page reveals touches (podcasts, organic social, word of mouth) that later convert as direct or branded search.

**Tooling:** the store or backend as truth; platform pixels and CAPI for optimization ([paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md)); a reporting connector to pull platform numbers into one place for de-duping; a post-purchase survey; MMM tooling (Robyn, Meridian or a vendor) once spend justifies it.

**The trap to name:** summing platform-reported conversions. If Meta claims 100 and Google claims 80 but you had 120 orders, you do not have 180 conversions; you have 120 with overlapping claims. Anchor on the 120 and allocate the overlap with incrementality, not by trusting whichever platform shouts loudest.

## Blended: PLG with sales

[coreyhaines31/marketingskills, attribution] Self-serve signups and a sales-assisted motion for larger accounts:

- The **DTC approach for the self-serve funnel** (fast, high-volume, first-party first touch to conversion, last non-direct plus a survey).
- The **B2B approach for the sales-assisted funnel** (CRM as truth, position-based, pipeline-stage attribution, self-reported at demo).
- **Alias identities across the two,** so a self-serve signup who later becomes a sales-assisted expansion keeps one journey ([posthog IDENTITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/IDENTITY.md#alias)).
- **Report them separately.** Blending a $50 self-serve signup and a $50k enterprise deal into one attribution number hides both stories.

## Prove it

The readout names the business type and the matching source of truth (CRM for B2B, the order count for DTC); B2B attribution is at the account level with free-mail domains excluded from matching; no DTC figure sums platform conversions; and a PLG-with-sales business reports the two funnels separately.
