# Free tools (engineering as marketing)

A free tool is an interactive lead magnet: a calculator, generator, grader or tester that does one useful job and leads to the product. All from [coreyhaines31/marketingskills, free-tools] (v2.0.2) unless tagged. Downloadable content is in [PLANNING.md](PLANNING.md); the tool's landing page conversion is page work for [cro](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cro/SKILL.md), and the source's own eval treats it as "page CRO, not free tool strategy".

## Initial assessment

- **Business context:** the core product, the target audience, their problems.
- **Goals:** lead generation, SEO and traffic, brand awareness, product education.
- **Resources:** technical capacity to build, ongoing maintenance bandwidth, budget for promotion.

Task questions: what existing tools the audience uses for workarounds; how you currently generate leads; what technical resources are available; the timeline and budget.

## Core principles

**"Your product is my marketing opportunity."** "Bezos said 'your margin is my opportunity.' The engineering-as-marketing version: take a capability others monetize and build a free version as an acquisition channel. Unsplash gave away the stock photos Getty sold - and Getty acquired it." The sourced account of that case is in [FREE-TOOL-TYPES-AND-CASES.md](FREE-TOOL-TYPES-AND-CASES.md#case-library).

1. **Solve a real problem:** genuine value, a problem the audience actually has, "Useful even without your main product".
2. **Adjacent to the core product:** related to what you sell, a "Natural path from tool to product", educates on the problem you solve.
3. **Simple and focused:** does one thing well, low friction, immediate value.
4. **Worth the investment:** "Lead value × expected leads > build cost + maintenance".

## Tool types

| Type | Examples | Best for |
|---|---|---|
| Calculators | ROI, savings, pricing estimators | Decisions involving numbers |
| Generators | Templates, policies, names | Creating something quickly |
| Analyzers | Website graders, SEO auditors | Evaluating existing work |
| Testers | Meta tag preview, speed tests | Checking if something works |
| Libraries | Icon sets, templates, snippets | Reference material |
| Interactive | Tutorials, playgrounds, quizzes | Learning and understanding |

Examples and tips per type, and concepts by industry, are in [FREE-TOOL-TYPES-AND-CASES.md](FREE-TOOL-TYPES-AND-CASES.md).

## Ideation and validation

Start with pain points:

1. **What problems does your audience Google?** Search query research, common questions.
2. **What manual processes are tedious?** Spreadsheet tasks, repetitive calculations.
3. **What do they need before buying your product?** Assessments, planning, comparisons.
4. **What information do they wish they had?** Data they can't easily access, benchmarks.

Validate the idea:

- **Search demand:** is there search volume, and how competitive is it ([keyword-research](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/keyword-research/SKILL.md))?
- **Uniqueness:** what exists, and "How can you be 10x better?"
- **Lead quality:** does this audience match buyers?
- **Build feasibility:** how complex, and can you scope an MVP?

For an "ideas" request, the source's eval expects 5-8 ideas across several tool types, each briefly evaluated, with the top 2-3 recommended [coreyhaines31/marketingskills, free-tools evals].

## Lead capture

| Approach | Pros | Cons |
|---|---|---|
| Fully gated | Maximum capture | Lower usage |
| Partially gated | Balance of both | Common pattern |
| Ungated plus optional | Maximum reach | Lower capture |
| Ungated entirely | Pure SEO and brand | No direct leads |

The source's eval expects partial gating as the usual answer: the basic result free, the detailed report behind the email, with the SEO effect of gating discussed [coreyhaines31/marketingskills, free-tools evals]. Practices: a clear value exchange ("Get your full report"); "Minimal friction: Email only"; a preview of what they'll get; optionally one qualifying question to segment.

The source says nothing about consent. The address that unlocks a report is used to send it; joining a marketing list is a separate, unchecked opt-in confirmed by double opt-in ([GATING-AND-DELIVERY.md](GATING-AND-DELIVERY.md#consent-and-double-opt-in), [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md)).

## SEO

- **Keywords:** the tool page targets "[thing] calculator", "[thing] generator", "free [tool type]"; supporting content targets "How to [use case]" and "What is [concept]".
- **Why tools earn links:** genuinely useful (people reference them), unique (you can't link to just any page), shareable.

On-page SEO and links are in [seo](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/SKILL.md); for a site built with web-ui/landing-page-ui, the tool page's title, description, structured data and share card follow its DISCOVERY.md.

## Build or buy

- **Build custom:** a unique concept, core to the brand, high strategic value, dev capacity.
- **No-code:** "Outgrow, Involve.me, Typeform, Tally, Bubble, Webflow" for speed to market, limited dev resources, or testing a concept.
- **Embed existing:** something good exists, white-label is available, not a core differentiator.

## MVP scope

1. **Core functionality only:** does the one thing, works reliably.
2. **Essential UX:** "clear input, obvious output, mobile works".
3. **Basic lead capture:** email collection, and the leads "go somewhere useful".

Skip initially: account creation, saving results, advanced features, perfect design, every edge case.

## Evaluation scorecard

Rate each factor 1-5:

| Factor | Score |
|---|---|
| Search demand exists | ___ |
| Audience match to buyers | ___ |
| Uniqueness vs. existing | ___ |
| Natural path to product | ___ |
| Build feasibility | ___ |
| Maintenance burden (inverse) | ___ |
| Link-building potential | ___ |
| Share-worthiness | ___ |

"**25+**: Strong candidate | **15-24**: Promising | **<15**: Reconsider". Eight factors give a maximum of 40; the thresholds are the source's, not derived.

## Pitfalls

- **Over-engineering:** "Shipping a bloated tool before validating demand. Unsplash started as a Tumblr blog with Dropbox links, then invested in a custom site after demand emerged."
- **Poor product integration:** "A tool with no natural path to your product earns traffic but not pipeline"; an analyzer can demonstrate the problem the paid product solves.
- **Maintenance and security debt:** "Tools that scrape, call APIs, or take user input rot and become attack surfaces. Budget for upkeep before you build." User input, URL fetching (an analyzer that fetches a site is an SSRF surface) and uploads are in [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md); rate limits are in [api-design](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/SKILL.md).
- **Vanity metrics:** "Track leads, qualification rate, and trial/signup conversion - measured in your own funnel."

A tool that gets no traffic after months (the source's eval: a speed test, six months on) is diagnosed through its SEO, distribution, the competition and its unique value before any rebuild [coreyhaines31/marketingskills, free-tools evals].

## Prove it

The idea has a filled scorecard and the build-cost inequality with your own numbers; the MVP does one job and works on a phone; the gating choice is stated with its SEO effect; the report unlocks without marketing consent; any input or fetched URL passes secure-coding's checks and the endpoint is rate-limited; and the tool's success is reported as leads, qualification and trial conversion, not visits.
