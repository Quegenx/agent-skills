# The four formats

Search intent, URL pattern, keywords and page structure for each format, from coreyhaines31/marketingskills `competitors` (MIT). The section templates are in [TEMPLATES.md](TEMPLATES.md); keyword volume and SERP data are [keyword-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md).

## Format 1: [Competitor] alternative (singular)

`[coreyhaines31/marketingskills, competitors]`
- **Intent:** "actively looking to switch from a specific competitor".
- **URL:** `/alternatives/[competitor]` or `/[competitor]-alternative`.
- **Keywords:** "[Competitor] alternative", "alternative to [Competitor]", "switch from [Competitor]".
- **Structure:** 1 why people look for alternatives (validate their pain); 2 summary: you as the alternative; 3 detailed comparison (features, service, pricing); 4 who should switch (and who shouldn't); 5 migration path; 6 social proof from switchers; 7 CTA.

## Format 2: [Competitor] alternatives (plural)

`[coreyhaines31/marketingskills, competitors]`
- **Intent:** researching options, earlier in the journey.
- **URL:** `/alternatives/[competitor]-alternatives`.
- **Keywords:** "[Competitor] alternatives", "best [Competitor] alternatives", "tools like [Competitor]".
- **Structure:** 1 why people look for alternatives (common pain points); 2 what to look for (a criteria framework); 3 the list (you first, but real options); 4 a summary comparison table; 5 a breakdown of each; 6 a recommendation by use case; 7 CTA.
- "Include 4-7 real alternatives. Being genuinely helpful builds trust and ranks better."
- **AI answers,** the source's claim: these pages "often earn *citations* in AI answers, but whether AI *recommends* your brand from them depends on offsite consensus (reviews, forums, analysts)"; for an emerging brand "a self-ranked list can surface the competitors in the AI answer while you get only the citation." Measuring that is [ai-search-visibility](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).

## Format 3: You vs [Competitor]

`[coreyhaines31/marketingskills, competitors]`
- **URL:** `/vs/[competitor]` or `/compare/[you]-vs-[competitor]`.
- **Keywords:** "[You] vs [Competitor]", "[Competitor] vs [You]".
- **Structure:** 1 TL;DR (key differences in 2 or 3 sentences); 2 an at-a-glance table; 3 comparison by category (features, pricing, support, ease of use, integrations); 4 who [You] is best for; 5 who [Competitor] is best for ("be honest"); 6 testimonials from switchers; 7 migration support; 8 CTA.

## Format 4: [Competitor A] vs [Competitor B]

`[coreyhaines31/marketingskills, competitors]`
- **URL:** `/compare/[competitor-a]-vs-[competitor-b]`.
- **Keywords:** "[A] vs [B]", "[B] vs [A]".
- **Structure:** 1 overview of both; 2 comparison by category; 3 who each is best for; 4 the third option (introduce yourself); 5 a table of all three; 6 CTA.

## A third-party comparison site

`[coreyhaines31/marketingskills, competitors]` The source's eval for a publisher's "Notion vs Coda" page expects a third-party, objective perspective, with monetization through affiliate links or your own CTA. The FTC requires affiliates to disclose "clearly and conspicuously on your site"; "The closer the disclosure is to your recommendation, the better"; its sample wording is "I get commissions for purchases made through links in this post", and a bare "affiliate link" label may not be enough ([FTC endorsement guides Q&A](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)).

## Essential sections

`[coreyhaines31/marketingskills, competitors]`
- **TL;DR:** start every page with the key differences in 2 or 3 sentences, for scanners.
- **Paragraph comparisons:** beyond tables, one paragraph per dimension on the difference and when it matters.
- **Feature comparison:** per category, how each handles it, strengths and limitations, a bottom line.
- **Pricing:** tier by tier, what's included, hidden costs, total cost for a sample team size.
- **Who it's for:** the ideal customer for each option.
- **Migration:** what transfers, what needs reconfiguring, the support offered, quotes from switchers.

Principles behind them: depth over surface (explain why a difference matters, with use cases and scenarios); help them decide (be clear who you are best for and who the competitor is best for); one source of truth per competitor ([DATA-AND-HUB.md](DATA-AND-HUB.md)).

## Keyword targeting

`[coreyhaines31/marketingskills, competitors]`

| Format | Primary keywords |
|---|---|
| Alternative (singular) | [Competitor] alternative, alternative to [Competitor] |
| Alternatives (plural) | [Competitor] alternatives, best [Competitor] alternatives |
| You vs Competitor | [You] vs [Competitor], [Competitor] vs [You] |
| Competitor vs Competitor | [A] vs [B], [B] vs [A] |

Plan the page set in priority order by search volume. web-research's discovery wave C already mines `"{X} vs"` titles ([web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md#discovery-waves)), which also shows which vs pages the market already has.

## Prove it

Each page matches one format's structure in order; its URL follows the format's pattern; a format 4 page introduces you only after both competitors are covered fairly; a third-party page's affiliate disclosure sits next to the first recommendation.
