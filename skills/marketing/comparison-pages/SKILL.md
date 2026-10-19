---
name: comparison-pages
description: "Builds and maintains public competitor comparison and alternative pages: the four formats (singular alternative, plural alternatives, you vs competitor, competitor vs competitor) with their URLs, keywords and structures, evidence discipline (not observed is not absent, dated facts, no guessed motives), section templates, centralized competitor data with provenance, index pages and footer links, FTC rules for affiliate links and switcher testimonials, and the competitive asset audit. Use when writing a vs page, an alternative or alternatives page, a third-party comparison, planning a set of comparison pages, or checking existing comparison pages and sales assets for stale or risky claims."
---

# Comparison pages

A comparison page is a public claim about another company that its buyers and its own team will read and check. Most of this skill comes from coreyhaines31/marketingskills `competitors` v2.3.0 (MIT), tagged `[coreyhaines31/marketingskills, competitors]`, with the evidence rules shared with its `competitor-profiling` v2.1.3; Google's review guidance and the FTC's endorsement guidance are quoted where they apply. Researching competitors from scratch (discovery, lanes, feature matrix) is [web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md); internal battle cards are [sales-enablement](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sales-enablement/SKILL.md) and web-research's battle-card lane, never a public page; the copy itself is [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The four formats: intent, URL pattern, keywords, page structure; essential sections; keyword targeting; AI answers | [FORMATS.md](FORMATS.md) |
| Section templates (TL;DR, paragraph, feature, pricing, support, who it's for, migration, social proof), comparison tables, FTC rules for quotes and results | [TEMPLATES.md](TEMPLATES.md) |
| Centralized competitor data with `last_verified` and sources, page generation, alternatives and vs index pages, footer columns | [DATA-AND-HUB.md](DATA-AND-HUB.md) |
| The competitive asset audit (Current, Changed, Unverifiable, Overclaimed) and the refresh cadence | [AUDIT.md](AUDIT.md) |

## Before writing

`[coreyhaines31/marketingskills, competitors]` Read the product context file, `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md); the source calls it `.agents/product-marketing.md`). Its "Alternatives", "What's different", "Objections and poor fits" and "Switching" sections feed these pages. Then establish:
- **Your product:** core value proposition, key differentiators, ideal customer, pricing model, strengths and honest weaknesses.
- **The landscape:** direct and indirect competitors, each one's positioning, search volume for competitor terms.
- **Goals:** SEO traffic, sales enablement, converting competitor users, brand positioning.
- **Questions to ask,** verbatim: "What are common reasons people switch to you? Do you have customer quotes about switching? What's your pricing vs. competitors? Do you offer migration support?"

"Never guess the competitor. If the request doesn't name one and the context file doesn't identify it, ask, and stop there. Don't draft a polished page around the most likely candidate."

## Evidence discipline

`[coreyhaines31/marketingskills, competitors]` "Every one should survive the competitor's own team reading it."
- **"Not observed" is not "doesn't have."** "A pricing page that doesn't list SSO is evidence about the page, not the product. Write "not listed on their pricing page (as of Mar 2026)" or drop the row. Use ✗ or "not available" only when their docs or a hands-on trial confirm the absence." The same for pricing: "no public pricing" is not "free" and not "expensive" (competitor-profiling).
- **Date competitor facts.** Put an "as of" date on pricing tables and in the competitor data file; re-verify before republishing.
- **One look is a snapshot.** A single visit can't support "they haven't changed pricing in years"; that needs dated history (changelog, archived pages).
- **State what changed, not why.** "They moved SSO to the Enterprise tier" is a fact; "because they're squeezing upmarket" is a guess. Leave motive out unless they've said it publicly.
- **Keep three layers apart:** what their site says, what you think it means for the buyer, what you recommend.
- **Honesty:** acknowledge competitor strengths, be accurate about your limitations, don't misrepresent features; "Readers are comparing, they'll verify claims."

Google's guidance for review content backs the same habits ([write high-quality reviews](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews)): "Explain what sets something apart from its competitors."; "Cover comparable things to consider, or explain which might be best for certain uses or circumstances."; "Discuss the benefits and drawbacks of something, based on your own original research."; "Provide evidence such as visuals, audio, or other links of your own experience"; "Share quantitative measurements about how something measures up in various categories of performance."

## Research for a page

`[coreyhaines31/marketingskills, competitors]` Per competitor:
1. **Product:** sign up, use it, document features, UX and limitations (a trial is what can confirm an absence).
2. **Pricing:** current pricing, what's included, hidden costs.
3. **Reviews:** G2, Capterra, TrustRadius for praise and complaint themes, read within each site's terms (methods in [customer-research SOURCES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SOURCES.md)).
4. **Switchers:** talk to customers who switched, in both directions.
5. **Content:** their positioning, their own comparison pages, their changelog.

## Outputs

`[coreyhaines31/marketingskills, competitors]` A competitor data file (YAML, [DATA-AND-HUB.md](DATA-AND-HUB.md)); page content (URL, meta tags, copy by section, comparison tables, CTAs); a page set plan in priority order by search volume; an asset audit report ([AUDIT.md](AUDIT.md)).

## The rules

1. **Never guess the competitor;** ask and stop. [coreyhaines31/marketingskills, competitors]
2. **No ✗ or "not available" without their docs or a trial;** otherwise "not listed on [page] (as of [date])" or no row. [coreyhaines31/marketingskills, competitors]
3. **Every competitor fact carries a source and a check date,** kept once in the centralized data file. [coreyhaines31/marketingskills, competitors]
4. **No motives, no "hasn't changed" from one visit.** [coreyhaines31/marketingskills, competitor-profiling]
5. **Say who the competitor is best for, honestly,** and who should not switch. [coreyhaines31/marketingskills, competitors]
6. **A plural alternatives page lists 4 to 7 real alternatives.** [coreyhaines31/marketingskills, competitors]
7. **Affiliate links get a clear, conspicuous disclosure next to the recommendation;** switcher quotes and results follow the FTC endorsement rules ([TEMPLATES.md](TEMPLATES.md#ftc-rules-for-quotes-and-results)). [[FTC](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)]
8. **No FAQ markup for a Google rich result:** Google's changelog of May 8, 2026 says "This feature will no longer appear in Google Search starting May 7, 2026", and on June 15, 2026 "The FAQ rich result feature is no longer shown in Google Search results" ([Search Central updates](https://developers.google.com/search/updates)). The source said "Consider FAQ schema for common questions like "What is the best alternative to [Competitor]?"". [Google]
9. **Public pages first** when fixing claims, then what reps say, then internal docs. [coreyhaines31/marketingskills, competitors]

## Prove it

Every competitor cell on the page traces to a source URL and a date in the data file; every ✗ or "not available" has a docs link or a trial note; no sentence states a competitor's motive; the "who should choose [Competitor]" section exists and is specific; a plural page lists at least four real alternatives; any affiliate link has its disclosure beside it; the page carries no FAQ markup justified by rich results.
