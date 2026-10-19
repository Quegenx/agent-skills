# Section templates

Ready-to-fill sections for comparison pages, copied from coreyhaines31/marketingskills `competitors` `references/templates.md` (MIT), with dashes replaced and the FTC rules added where quotes and results appear. Fill every bracket from the competitor data file ([DATA-AND-HUB.md](DATA-AND-HUB.md)), never from memory, and pass the finished copy through [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

## TL;DR

`[coreyhaines31/marketingskills, competitors]`

```markdown
**TL;DR**: [Competitor] excels at [strength] but struggles with [weakness].
[Your product] is built for [your focus], offering [key differentiator].
Choose [Competitor] if [their ideal use case]. Choose [You] if [your ideal use case].
```

## Paragraph comparison

`[coreyhaines31/marketingskills, competitors]` One paragraph per major dimension, not just tables:

```markdown
## Features

[Competitor] offers [description of their feature approach].
Their strength is [specific strength], which works well for [use case].
However, [limitation] can be challenging for [user type].

[Your product] takes a different approach with [your approach].
This means [benefit], though [honest tradeoff].
Teams who [specific need] often find this more effective.
```

## Feature comparison

`[coreyhaines31/marketingskills, competitors]`

```markdown
## Feature Comparison

### [Feature Category]

**[Competitor]**: [2-3 sentence description of how they handle this]
- Strengths: [specific]
- Limitations: [specific]

**[Your product]**: [2-3 sentence description]
- Strengths: [specific]
- Limitations: [specific]

**Bottom line**: Choose [Competitor] if [scenario]. Choose [You] if [scenario].
```

## Pricing comparison

`[coreyhaines31/marketingskills, competitors]` Add the "as of" date to the table caption or heading.

```markdown
## Pricing

| | [Competitor] | [Your Product] |
|---|---|---|
| Free tier | [Details] | [Details] |
| Starting price | $X/user/mo | $X/user/mo |
| Business tier | $X/user/mo | $X/user/mo |
| Enterprise | Custom | Custom |

**What's included**: [Competitor]'s $X plan includes [features], while
[Your product]'s $X plan includes [features].

**Total cost consideration**: Beyond per-seat pricing, consider [hidden costs,
add-ons, implementation]. [Competitor] charges extra for [X], while
[Your product] includes [Y] in base pricing.

**Value comparison**: For a 10-person team, [Competitor] costs approximately
$X/year while [Your product] costs $Y/year, with [key differences in what you get].
```

Rules for stating your own prices (reference prices, "free", savings claims) are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md).

## Service and support

`[coreyhaines31/marketingskills, competitors]`

```markdown
## Service & Support

| | [Competitor] | [Your Product] |
|---|---|---|
| Documentation | [Quality assessment] | [Quality assessment] |
| Response time | [SLA if known] | [Your SLA] |
| Support channels | [List] | [List] |
| Onboarding | [What they offer] | [What you offer] |
| CSM included | [At what tier] | [At what tier] |

**Support quality**: Based on [G2/Capterra reviews, your research],
[Competitor] support is described as [assessment]. Common feedback includes
[quotes or themes].

[Your product] offers [your support approach]. [Specific differentiator like
response time, dedicated CSM, implementation help].
```

A status page is not an SLA ([web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md#the-fact-check)).

## Who it's for

`[coreyhaines31/marketingskills, competitors]`

```markdown
## Who Should Choose [Competitor]

[Competitor] is the right choice if:
- [Specific use case or need]
- [Team type or size]
- [Workflow or requirement]
- [Budget or priority]

**Ideal [Competitor] customer**: [Persona description in 1-2 sentences]

## Who Should Choose [Your Product]

[Your product] is built for teams who:
- [Specific use case or need]
- [Team type or size]
- [Workflow or requirement]
- [Priority or value]

**Ideal [Your product] customer**: [Persona description in 1-2 sentences]
```

## Migration

`[coreyhaines31/marketingskills, competitors]`

```markdown
## Switching from [Competitor]

### What transfers
- [Data type]: [How easily, any caveats]
- [Data type]: [How easily, any caveats]

### What needs reconfiguration
- [Thing]: [Why and effort level]
- [Thing]: [Why and effort level]

### Migration support

We offer [migration support details]:
- [Free data import tool / white-glove migration]
- [Documentation / migration guide]
- [Timeline expectation]
- [Support during transition]

### What customers say about switching

> "[Quote from customer who switched]"
> [Name], [Role] at [Company]
```

## Social proof

`[coreyhaines31/marketingskills, competitors]` Focus on switchers:

```markdown
## What Customers Say

### Switched from [Competitor]

> "[Specific quote about why they switched and outcome]"
> [Name], [Role] at [Company]

> "[Another quote]"
> [Name], [Role] at [Company]

### Results after switching
- [Company] saw [specific result]
- [Company] reduced [metric] by [amount]
```

## FTC rules for quotes and results

From the FTC's endorsement guidance ([FTC endorsement guides Q&A](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)):
- "An endorsement must reflect the honest opinion of the endorser." Use real customers' real words.
- If the results shown aren't typical, the ad must "make clear to the audience" what typical results are. A "[Company] reduced [metric] by [amount]" line needs that context unless it is typical.
- A testimonial given for payment or a reward can need a disclosure of that connection.
- Affiliate links: disclose "clearly and conspicuously", close to the recommendation ([FORMATS.md](FORMATS.md#a-third-party-comparison-site)).

## Comparison tables

`[coreyhaines31/marketingskills, competitors]` Beyond checkmarks. Instead of `✓` and `✗`:

| Feature | You | Competitor |
|---|---|---|
| Feature A | Full support with [detail] | Basic support, [limitation] |
| Feature B | [Specific capability] | Not available |
| Feature C | [Specific capability] | Not listed on pricing page (as of [Mon YYYY]) |

"Only write "Not available" when the competitor's docs or a trial confirm it. If the evidence is just that their site doesn't mention it, say that."

- **Group by category:** core functionality, collaboration, integrations, security and compliance, support and service.
- **Ratings where useful:** a category row with star ratings for each side and a notes column. Glyphs like ✓, ✗ and stars need a text equivalent for screen readers ([web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md)).

## Prove it

No bracket survives into a published page; every number in a pricing or results line traces to the data file or the customer's own figure; every quote is from a named real customer who agreed to it; atypical results carry the typical result beside them.
