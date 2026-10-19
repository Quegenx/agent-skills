# Content that answer engines can lift

How to structure a page so an answer engine can quote a passage of it correctly, without writing a second version "for AI". Google's position comes first because it limits everything else; the block templates and the fan-out matrix are from [coreyhaines31/marketingskills, ai-seo] (MIT; the matrix adapted there from Profound's MIT skill), with the source's example statistics removed. Docs-specific rules live in [developer-docs WRITING-AND-PUBLISHING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md); page copy in [anti-slop-copy SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

**Contents:** [Google's limits](#googles-limits) · [Structure rules](#structure-rules) · [Block templates](#block-templates) · [Fact-family fan-out matrix](#fact-family-fan-out-matrix) · [Authority by domain](#authority-by-domain) · [By content type](#by-content-type) · [What not to do](#what-not-to-do) · [Prove it](#prove-it)

## Google's limits

[https://developers.google.com/search/docs/fundamentals/ai-optimization-guide, updated 2026-07-10]
- "The best practices for SEO continue to be relevant because our generative AI features on Google Search are rooted in our core Search ranking and quality systems."
- "There's no requirement to break your content into tiny pieces for AI to better understand it." The source quotes this as "Don't break your content into tiny pieces"; Google's wording says it is not required, not that it is forbidden.
- Making separate content to manipulate generative AI responses "violates Google's scaled content abuse spam policy." Since 2026-05-15 Google's changelog says "our spam policies also apply to generative AI responses in Google Search." [https://developers.google.com/search/updates]
- Google's query fan-out example: "how to fix a lawn that's full of weeds" (the source still has the older "how to fix lawns").

The source's view of other engines: they "actively reward extractable structure", so structure is a layer on SEO, not a replacement. That is the source's claim, not a vendor's; the blocks below are ordinary good organization either way.

## Structure rules

[coreyhaines31/marketingskills, ai-seo] "AI systems extract passages, not pages. Every key claim should work as a standalone statement."
- Lead every section with a direct answer; don't bury it.
- Use H2 and H3 headings that match how people phrase queries.
- Tables beat prose for comparisons; numbered lists beat paragraphs for processes.
- Each paragraph conveys one clear idea.
- Practitioner numbers with no official source: key answer passages of 40 to 60 words, FAQ answers of 50 to 100, voice answers under 30. Use them as starting points for non-Google engines only.

[freescan] Lead with the direct answer, then scope, evidence, exceptions and limits under descriptive headings. Each section must keep its meaning when quoted alone: define acronyms, don't lean on "this" or "the above result". Original research states its population, data window, exclusions, aggregation, sample size and update time; say when a sample is too small, and separate measured data from interpretation.

These match the repo's docs rules: "Keep each explanation understandable when retrieved alone" and "do not force every heading into a question" ([developer-docs](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md#headings-and-structure)).

**Freshness** [coreyhaines31/marketingskills, ai-seo]: a visible "Last updated: [date]", refreshes on competitive topics (the source says quarterly at minimum), and outdated facts removed. The cadence is the source's opinion; the refresh workflow is [seo CONTENT-REFRESH.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/CONTENT-REFRESH.md).

**Evidence** [coreyhaines31/marketingskills, ai-seo]: the GEO study (Aggarwal et al., KDD 2024) found that adding citations, quotations and statistics raised visibility "by roughly 30-40% on its own metric", and keyword stuffing hurt. The source's per-method table (+40%, +37% ...) and its "15-30%" line disagree with each other; quote only the hedged range, and never as a forecast.

## Block templates

[coreyhaines31/marketingskills, ai-seo, content-patterns] Copy the shapes; fill them with your own sourced facts.

**Definition** for "What is [X]?":

```markdown
## What is [Term]?

[Term] is [concise 1-sentence definition]. [Expanded 1-2 sentence explanation with key characteristics]. [Brief context on why it matters or how it's used].
```

**Step-by-step** for "How to [X]":

```markdown
## How to [Action/Goal]

[1-sentence overview of the process]

1. **[Step Name]**: [Clear action description in 1-2 sentences]
2. **[Step Name]**: [Clear action description in 1-2 sentences]
3. **[Step Name]**: [Clear action description in 1-2 sentences]

[Optional: Brief note on expected outcome or time estimate]
```

**Comparison table** for "[X] vs [Y]" (the full comparison-page method is [comparison-pages SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/comparison-pages/SKILL.md)):

```markdown
## [Option A] vs [Option B]: [Brief Descriptor]

| Feature | [Option A] | [Option B] |
|---------|------------|------------|
| [Criteria 1] | [Value/Description] | [Value/Description] |
| [Criteria 2] | [Value/Description] | [Value/Description] |
| Best For | [Use case] | [Use case] |

**Bottom line**: [1-2 sentence recommendation based on different needs]
```

**Pros and cons** for "Is [X] worth it?":

```markdown
## Advantages and Disadvantages of [Topic]

[1-sentence overview of the evaluation context]

### Pros

- **[Benefit category]**: [Specific explanation]

### Cons

- **[Drawback category]**: [Specific explanation]

**Verdict**: [1-2 sentence balanced conclusion with recommendation]
```

**FAQ** for pages with several common questions. Use natural phrasing ("How do I..."), question words, and the "People Also Ask" wording. Google's FAQ rich result "will no longer appear in Google Search starting May 7, 2026" [https://developers.google.com/search/updates, entry of 2026-05-08], so the block is for readers and other engines, not for a Google feature; the source still calls it "Essential for FAQ schema".

```markdown
## Frequently Asked Questions

### [Question phrased exactly as users search]?

[Direct answer in first sentence]. [Supporting context in 2-3 additional sentences].
```

**Listicle** for "Best [X]": "ranking yourself #1 in your own 'best [category]' guide gets the page *cited* far more reliably than it gets your brand *recommended*" ([VISIBILITY-AUDIT.md](VISIBILITY-AUDIT.md#cited-is-not-recommended)). A fairer shape the source calls a practitioner pattern: name the category leader first, say honestly what it does well, then show where you go further.

```markdown
## [Number] Best [Items] for [Goal/Purpose]

[1-2 sentence intro establishing context and selection criteria]

### 1. [Item Name]

[Why it's included in 2-3 sentences with specific benefits]
```

**Statistic citation, expert quote, authoritative claim, self-contained answer, evidence sandwich:**

```markdown
[Claim statement]. According to [Source/Organization], [specific statistic with number and timeframe]. [Context for why this matters].

"[Direct quote from expert]," says [Expert Name], [Title/Role] at [Organization]. [1 sentence of context or interpretation].

[Topic] [verb: is/has/requires/involves] [clear, specific claim]. [Source] [confirms/reports/found] that [supporting evidence]. This [explains/means/suggests] [implication or action].

**[Topic/Question]**: [Complete, self-contained answer that makes sense without additional context. Include specific details, numbers, or examples in 2-3 sentences.]

[Opening claim statement].

Evidence supporting this includes:
- [Data point 1 with source]
- [Data point 2 with source]

[Concluding statement connecting evidence to actionable insight].
```

The source's filled-in examples carry statistics with no real source ("over 60% of Google searches now end without a click", a "Google's 2024 Core Web Vitals report" figure that no Google doc holds, "77% more backlinks"). They are not copied; every number you put in a block needs a source you can link.

## Fact-family fan-out matrix

[coreyhaines31/marketingskills, ai-seo, adapted from Profound's MIT ai-retrieval-fanout-mapper] Engines rewrite a prompt into several background searches, and the exact strings rarely repeat between runs (the source cites Profound's April 2026 vendor study), so plan around the stable fact families underneath.

1. Pick a prompt family, with its audience, buying stage, engine and market.
2. List the fan-outs: observed ones where you have them ([PROMPT-RESEARCH.md](PROMPT-RESEARCH.md#chatgpts-own-fan-out-queries)), otherwise inferred, and mark every inferred row as a hypothesis.
3. Break the job into fact families: entities and category terms, factual sub-questions, comparison criteria, constraints (price, compatibility, location, recency), and the evidence that settles them.
4. Fill one row per fact family:

| Fact family | Observed or inferred | What the buyer needs | Current best source | Competitor source | Our owning page | Gap |
|---|---|---|---|---|---|---|
| Pricing for 10 seats | Observed | Monthly cost at 10 seats, annual discount | Third-party review (2025 prices) | Competitor pricing page | /pricing | Per-seat price not stated in text |
| SOC 2 status | Inferred | Report type and date | None | Competitor trust page | /security | Page says "enterprise-grade," no report type |

5. "Give each fact one owning page." Improve or consolidate an existing page before creating one; one strong page can answer several families. "Never build a doorway page per fan-out query." FreeScan calls the same mistake "prompt-variant doorway pages" and recommends a subject hub with focused pages that answer materially different questions. [freescan]
6. Retest across repeated runs and engines; judge by whether the fact family gets answered from your page.

## Authority by domain

[coreyhaines31/marketingskills, ai-seo]
- **Technology:** precise terminology, version numbers and dates for software, links to official documentation, code examples.
- **Health:** peer-reviewed studies with publication details, credentials, study limitations, a "last reviewed" date.
- **Finance:** regulators named, numbers with timeframes, a note that it is educational, not advice.
- **Legal:** the specific laws and jurisdiction, professional disclaimers, when to consult a professional.
- **Business:** case studies with measurable results and their sources.

## By content type

[coreyhaines31/marketingskills, ai-seo, content-types]
- **Product pages:** what it does and who it is for in the first paragraph; specific metrics instead of "blazing fast"; visible pricing (and a [pricing file](AGENT-READINESS.md#a-pricing-file-for-agents)).
- **Blog posts:** one target query per post, a definition first for "what is" queries, original data, a visible updated date.
- **Comparison and alternatives pages:** tables, "Fair and balanced", current prices and features.
- **Industry or segment pages:** one per segment you actually serve, with real workflows, integrations, compliance and proof. "Templated pages that only swap the industry name are what the scaled-content policy targets" (the policy and pages at scale: [seo PAGES-AT-SCALE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md)).
- **Docs:** numbered steps, code, screenshots with alt text, prerequisites and outcomes. The source also says "HowTo schema markup"; Google removed the How-to documentation on 2023-09-14 because "this rich result is no longer shown in search results" [https://developers.google.com/search/updates]. schema.org `HowTo` still exists; no Google feature uses it.
- **Local and ecommerce:** Merchant Center feeds and a complete Business Profile (Google's own emphasis, quoted in [AGENT-READINESS.md](AGENT-READINESS.md#acting-not-only-reading)); local SEO is [seo LOCAL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md).

## What not to do

[coreyhaines31/marketingskills, ai-seo]
- Write separate content "for AI" (the scaled content abuse policy, above).
- Generate thin variations at scale for ranking.
- Pursue inauthentic mentions: no fabricated citations, invented awards, owned "independent" review sites, or bulk posting on Reddit or Wikipedia. "Fake or misleadingly sourced reviews can also break the FTC's 2024 reviews rule" (16 CFR Part 465). The repo's copy rule agrees: "Invented stats and testimonials cost trust and can carry legal risk" ([anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md)); the FTC rules are defined in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).
- Hide main content behind JavaScript that doesn't render.
- Invent AI-only technical requirements, or quote precise statistics with no population or method. [freescan]

## Prove it

Each priority page answers its main question in the first paragraph under its heading; every section still makes sense pasted alone into a chat; every number on the page links to its source; each fact family in the matrix has exactly one owning page and no page exists only for a fan-out wording; and no block was produced in a second "AI" version of a page.
