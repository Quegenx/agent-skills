---
name: content-strategy
description: "Plans what content to make and how it spreads: intake questions, the searchable versus shareable lens, the information-gain gate, content pillars and topic clusters, keywords by buyer stage, ideation from keyword exports, calls, surveys, forums and competitors, weighted scoring, the 60/30/10 calendar, per-format discipline, distribution (Create Once Distribute Twice, ORB, the flywheel, atomization) and headless CMS modeling. Use when deciding what to write about, building a content plan, editorial calendar or topic clusters, picking formats that earn links, planning distribution for a flagship piece, or choosing and modeling a headless CMS."
---

# Content strategy

A content plan decides which pieces to make, in what order, and how each one reaches people. Most of this skill comes from coreyhaines31/marketingskills `content-strategy` v2.1.3 (MIT), tagged `[coreyhaines31/marketingskills, content-strategy]`; where Google Search Central, Meta for Developers or a CMS vendor's docs say something different, the official page wins and the line says what the source said. Writing the piece itself is [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md); SEO rules and existing-content refreshes are [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md); keyword data and clustering are [keyword-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md); research on what customers say is [customer-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/customer-research/SKILL.md); vs and alternative pages are [comparison-pages](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Where ideas come from: keyword exports and their table, call transcripts, surveys, forum and competitor research, sales and support input | [IDEATION.md](IDEATION.md) |
| Searchable and shareable content types, link-earning formats (a vendor study), production discipline per format | [FORMATS.md](FORMATS.md) |
| Create Once Distribute Twice, ORB as a funnel, failure modes, platform half-lives, the flywheel, the atomization checklist | [DISTRIBUTION.md](DISTRIBUTION.md) |
| Headless or traditional CMS, content modeling, content types, SEO fields, editorial workflow, preview APIs, platform comparison | [CMS.md](CMS.md) |

## Before planning

`[coreyhaines31/marketingskills, content-strategy]` Read the product context file first, `.agents/product-context.md`, defined in [anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md) (the source calls it `.agents/product-marketing.md`, with `.claude/product-marketing.md` and the legacy `product-marketing-context.md`). Ask only for what it doesn't cover:

- **Business:** what the company does; the ideal customer; the primary goal for content (traffic, leads, brand awareness, thought leadership); the problems the product solves.
- **Customer research:** questions customers ask before buying; objections in sales calls; topics that repeat in support tickets; the language customers use for their problems.
- **Current state:** existing content and what works; resources (writers, budget, time); formats you can produce (written, video, audio).
- **Competition:** the main competitors; the content gaps in the market.

Task-specific questions, verbatim: "What patterns emerge from your last 10 customer conversations?" / "What questions keep coming up in sales calls?" / "Where are competitors' content efforts falling short?" / "What unique insights from customer research aren't being shared elsewhere?" / "Which existing content drives the most conversions, and why?"

## Searchable vs shareable

`[coreyhaines31/marketingskills, content-strategy]` "Every piece of content must be searchable, shareable, or both. Prioritize in that order, search traffic is the foundation." Searchable content captures existing demand; shareable content creates it. Treat each piece as its own launch: each published piece is "brand surface area", a new entry point where a stranger can find you.

**The information-gain gate,** verbatim: "before committing to a searchable piece, read the current top results for its query and write one sentence on what yours will add that none of them have: original data, a real product example, a working tool or template, a clearer answer, a stronger opinion. If you can't write that sentence, don't write the piece." Google's own self-assessment asks the same: "Does the content provide original information, reporting, research, or analysis?" and "Does the content provide substantial value when compared to other pages in search results?" ([creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)).

**Searchable checklist:**
- Target a specific keyword or question and match its search intent exactly.
- Titles that match search queries; headings that mirror search patterns.
- Comprehensive coverage, with data, examples and links to authoritative sources.
- AI discovery: clear positioning, structured content, brand consistency across the web (the methods are in [ai-search-visibility](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md)).
- Keywords and URLs: Google says "the keywords in the name of the domain (or URL path) alone have hardly any effect beyond appearing in breadcrumbs", "Excessively repeating the same words over and over (even in variations) is tiring for users, and keyword stuffing is against Google's spam policies", and of headings, "it doesn't matter if you're using them out of order" ([SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)). Keep URLs descriptive for people. The source said: "Place keywords in title, headings, first paragraph, URL".
- Length: "The length of the content alone doesn't matter for ranking purposes" (same Google page). Set no word count; the source's eval asked for a "3000+ word" pillar guide.

**Shareable checklist:** lead with a novel insight, original data or a counterintuitive take; challenge conventional wisdom with reasons; tell stories that make people feel something; make what people share to look smart or help others; connect to current trends or emerging problems; share honest experiences others can learn from.

## Pillars and buyer stage

`[coreyhaines31/marketingskills, content-strategy]` "Content pillars are the 3-5 core topics your brand will own." Find them four ways: product-led (problems the product solves), audience-led (what the ICP needs to learn), search-led (topics with volume), competitor-led (what competitors rank for). A good pillar aligns with the product, matches what the audience cares about, has search volume or social interest, and is broad enough for many subtopics. Each pillar is a hub with subtopic clusters of articles. Most content lives fine under `/blog` with internal links; dedicated pillar URLs (like `/guides/topic`) only for resources with several layers of depth.

Keyword modifiers by buyer stage, verbatim:

| Stage | Modifiers |
|---|---|
| Awareness | "what is," "how to," "guide to," "introduction to" |
| Consideration | "best," "top," "vs," "alternatives," "comparison" |
| Decision | "pricing," "reviews," "demo," "trial," "buy" |
| Implementation | "templates," "examples," "tutorial," "how to use," "setup" |

## Scoring ideas

`[coreyhaines31/marketingskills, content-strategy]` Score each idea 1-10 on four factors, multiply by the weight, sum:

- **Customer Impact (40%):** how often the topic came up in research, what share of customers face it, how emotionally charged it is, the potential LTV of customers with this need.
- **Content-Market Fit (30%):** alignment with the problems the product solves, unique insight from research, customer stories to support it, whether it leads naturally to product interest.
- **Search Potential (20%):** monthly volume, competition, long-tail opportunities, whether interest grows or declines.
- **Resource Requirements (10%):** expertise to write it with authority, research still needed, assets needed. The source doesn't say which direction scores high; decide once (for example, higher means cheaper to make) and use it for every idea.

| Idea | Customer Impact (40%) | Content-Market Fit (30%) | Search Potential (20%) | Resources (10%) | Total |
|---|---|---|---|---|---|
| Topic A | 8 | 9 | 7 | 6 | 7.9 |
| Topic B | 6 | 7 | 9 | 8 | 7.1 |

Topic A sums to 3.2 + 2.7 + 1.4 + 0.6 = 7.9; the source's table printed 8.0. Rank the list and make the top pieces first.

## The calendar: 60/30/10

`[coreyhaines31/marketingskills, content-strategy]` 60% searchable (use-case content, hub and spoke, how-tos), 30% shareable (thought leadership, original data, opinion), 10% experimental (new formats, channels, bets). "This is a starting ratio, not a rule": a new blog may lean searchable to build a base; an established brand chasing category leadership may push shareable higher.

## The deliverable

`[coreyhaines31/marketingskills, content-strategy]`
1. **Content pillars:** 3-5 with rationale, subtopic clusters for each, how each connects to the product.
2. **Priority topics:** per piece, the title; searchable, shareable or both; the content type; the target keyword and buyer stage; why this topic, with the research behind it.
3. **Topic cluster map:** how the pieces interconnect.

## The rules

1. **Read the product context file before asking anything,** and ask only for what it lacks. [coreyhaines31/marketingskills, content-strategy]
2. **No searchable piece without its information-gain sentence.** [coreyhaines31/marketingskills, content-strategy; [Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)]
3. **Searchable first, shareable second, both when you can.** [coreyhaines31/marketingskills, content-strategy]
4. **No keyword stuffing, no keyword-in-URL lever, no word-count target.** [[Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)]
5. **Every priority topic cites the research behind it** (a quote, a ticket theme, a keyword row). [coreyhaines31/marketingskills, content-strategy]
6. **Hub before spokes; interlink them.** [coreyhaines31/marketingskills, content-strategy]
7. **Plan distribution at creation:** each flagship gets its atomization list before drafting ([DISTRIBUTION.md](DISTRIBUTION.md)). [coreyhaines31/marketingskills, content-strategy]
8. **Vendor benchmarks stay labelled as vendor data** (the link-earning table in [FORMATS.md](FORMATS.md)). [coreyhaines31/marketingskills, content-strategy]

## Prove it

Every priority topic has a stage, a type, a keyword and a research citation; every searchable topic has its one-sentence information gain written against the current top results; the scoring table recomputes (weights times scores equal the total); 3 to 5 pillars, each with clusters; no topic carries a word-count target; each flagship lists its atomized outputs. A request to write one blog post goes to [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md), not here.
