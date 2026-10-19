# Promotion and measurement

Where a lead magnet gets promoted, what to measure, how to tell good leads from bad, and the source's benchmark tables. Every rate below is [coreyhaines31/marketingskills, lead-magnets] with no study cited; the source itself closes its tables with "These benchmarks are general guidelines ... Start measuring from day one and build your own benchmarks." Use them as starting assumptions to replace, never as targets you report against.

**Contents:** [Promotion](#promotion) · [Key metrics](#key-metrics) · [Lead quality](#lead-quality) · [A/B test ideas](#ab-test-ideas) · [The source's benchmarks](#the-sources-benchmarks) · [Prove it](#prove-it)

## Promotion

[coreyhaines31/marketingskills, lead-magnets]

- **Blog CTAs and content upgrades:** relevant CTAs inside posts (inline, end of post); post-specific content upgrades (a bonus checklist for a how-to post). The source claims "Content upgrades convert 2-5x better than generic sidebar CTAs", uncited.
- **Exit intent and popups:** trigger on exit intent or scroll depth; match the popup's offer to the page. Building popups is in [cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md).
- **Social:** snippets and teasers, carousel posts from the key points, the magnet as the CTA in your bio or profile ([social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md)).
- **Paid:** Facebook and Instagram lead ads for top-funnel magnets, Google Ads for high-intent ones (templates, tools), LinkedIn for B2B, retargeting blog visitors ([paid-ads](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md), where each platform's lead-ad rules belong).
- **Partners:** cross-promote with complementary brands, guest webinars with partner audiences, partner newsletters, bundles in resource collections ([partnerships](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/partnerships/SKILL.md)).

## Key metrics

| Metric | What it tells you | The source's benchmark |
|---|---|---|
| Landing page conversion rate | Offer attractiveness | 20-40% (warm traffic), 5-15% (cold) |
| Cost per lead | Acquisition efficiency | Varies by channel and industry |
| Lead-to-customer rate | Lead quality | 1-5% (B2B), varies widely |
| Email engagement | Content relevance | "30-50% open, 2-5% click" (see below on opens) |
| Time to conversion | Nurture effectiveness | Track by lead magnet source |

Tag every address with the magnet that brought it, so time to conversion and lead-to-customer rate can be read per magnet; this repo's lists already "Segment by ... signup source" ([email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#marketing-emails)). Funnels and experiments are built in [posthog](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/posthog/SKILL.md); attribution across channels is in [marketing-attribution](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-attribution/SKILL.md).

## Lead quality

The source's signals [coreyhaines31/marketingskills, lead-magnets, references/benchmarks.md]:

- **High quality:** "Open first 3 emails at 40%+ rate"; click through to content or product pages; return to the site within 30 days; match ICP demographics (role, company size, industry); progress to trial, demo or purchase within 90 days.
- **Low quality:** unsubscribe within the first 3 emails; never open beyond the delivery email; disposable email addresses (this repo's server-side validation can detect them, [email-practices LISTS-AND-CAPTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/LISTS-AND-CAPTURE.md#capturing-addresses)); don't match the target customer profile; downloaded for the content with no product interest.

**Opens: two views.** The source sets open-rate targets. This repo records that "Google doesn't track open rates; low open rates 'aren't necessarily an accurate indicator of deliverability.'" ([email-practices DELIVERABILITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/DELIVERABILITY.md)) and that "Apple Mail Privacy Protection over-reports opens; prefer clicks." ([onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md)). Judge quality on clicks, return visits and progress to trial or purchase; treat opens as a rough signal at most.

**Quality against volume** [coreyhaines31/marketingskills, lead-magnets, references/benchmarks.md]:

| Format | Lead volume | Lead quality | Net value |
|---|---|---|---|
| Generic ebook | High | Low-Medium | Medium |
| Specific template | Medium | High | High |
| Industry report | Medium | Medium-High | High |
| Quiz or assessment | High | Medium (segmentable) | High |
| Webinar | Low-Medium | High | High |
| Checklist | High | Low-Medium | Medium |
| Free trial | Low | Very High | Very High |

## A/B test ideas

[coreyhaines31/marketingskills, lead-magnets]

- **Headline:** benefit-focused against curiosity-driven.
- **Format:** checklist against guide on the same topic.
- **Gate level:** full gate against partial preview.
- **Form fields:** email only against email plus name.
- **CTA copy:** "Download Free Guide" against "Get Your Copy".
- **Delivery:** instant download against email delivery.

Sample sizes and stopping rules are in [ab-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).

## The source's benchmarks

All [coreyhaines31/marketingskills, lead-magnets, references/benchmarks.md], unsourced.

**Landing page conversion by format:** checklist 30-50%; cheat sheet 25-40%; template 25-45%; ebook or guide 20-35%; quiz 30-50%; webinar 20-40% registration, with "30-50% attendance rate of registrants"; mini-course 15-30%; free trial 5-15%.

**By traffic source:** blog content upgrade 3-8% of post readers; dedicated landing page 20-40% organic, 10-25% paid; exit-intent popup 2-5% of visitors; sidebar or banner CTA 0.5-2%; social media link 10-20%.

**By industry (landing page):** SaaS and tech 15-25%; marketing and agency 20-35%; finance 10-20%; e-commerce 10-20%; education 20-35%; health and wellness 15-25%.

**Cost per lead by channel:** organic search $0-5; blog content upgrade $0-2; Facebook and Instagram ads $3-15; Google Ads $10-50; LinkedIn Ads $25-75; partner co-promotion $0-5.

**Creation cost (DIY / with a designer or freelancer):** checklist free / $100-300; cheat sheet free / $200-500; template free / $100-500; ebook (10-25 pages) free / $500-2,000; quiz $0-100/mo for the tool / $500-2,000; webinar free (Zoom) / $500-1,500; email mini-course free / $500-1,500; video course $0-200 for gear / $2,000-5,000.

**Time to see results:** first leads immediately with existing traffic or paid; organic traffic growth 2-6 months (SEO); meaningful lead volume 1-3 months; measurable pipeline impact 3-6 months; full ROI assessment 6-12 months.

## Prove it

Every address carries its magnet's ID; the report shows clicks, trials and customers per magnet, not opens alone; any benchmark in a plan or report is labelled as the source's and sits beside your own measured number once you have one; and each A/B test has one variable from the list above.
