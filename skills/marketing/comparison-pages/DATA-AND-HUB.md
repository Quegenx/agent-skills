# Competitor data, index pages and footer links

One data file per competitor feeds every page, so a price changes in one place. From coreyhaines31/marketingskills `competitors` `references/content-architecture.md` (MIT). The source's sample data (a real product's prices and reviews) is illustrative, not fact, and is replaced by placeholders here.

## Centralized competitor data

`[coreyhaines31/marketingskills, competitors]` One file per competitor (`competitor_data/[competitor-a].md`, `competitor_data/[competitor-b].md`), plus the same structure for your own product, "be honest". The template:

```yaml
name: [Competitor]
website: [domain]
tagline: "[from their homepage]"
founded: [year]
headquarters: [city]

# Positioning
primary_use_case: "[...]"
target_audience: "[...]"
market_position: "[...]"

# Provenance (re-verify before republishing)
last_verified: [YYYY-MM-DD]
sources:
  pricing: [their pricing URL]
  features: [their docs URL] + hands-on trial

# Pricing
pricing_model: [per-seat | usage-based | ...]
free_tier: [true | false]
free_tier_limits: "[...]"
starter_price: [$X/user/month]
business_price: [$X/user/month]
enterprise: [custom | $X]

# Features (rate 1-5 or describe)
features:
  [feature_a]: [1-5]
  [feature_b]: [1-5]

# Strengths (be honest)
strengths:
  - [...]

# Weaknesses (be fair)
weaknesses:
  - [...]

# Best for
best_for:
  - [...]

# Not ideal for
not_ideal_for:
  - [...]

# Common complaints (from reviews)
common_complaints:
  - "[verbatim, with its review URL in sources]"

# Migration notes
migration_from:
  difficulty: [low | medium | high]
  data_export: "[formats]"
  what_transfers: "[...]"
  what_doesnt: "[...]"
  time_estimate: "[...]"
```

A weakness or "not ideal for" entry follows the evidence rules: an absence is confirmed in docs or a trial, otherwise it reads "not listed on [page] (as of [date])" ([SKILL.md](SKILL.md#evidence-discipline)).

**web-research as the data source:** a competitor's merged file from [web-research COMPETITORS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/web-research/COMPETITORS.md#lanes-and-the-merge) already holds pricing, features and positioning with cited URLs; map its frontmatter into this file and add `last_verified`, per-field `sources`, `best_for`, `not_ideal_for`, `common_complaints` and `migration_from`.

## Page generation

`[coreyhaines31/marketingskills, competitors]`
- **Alternative page:** competitor data plus yours.
- **Alternatives page:** competitor data plus yours plus the other alternatives.
- **You vs competitor:** your data plus the competitor's.
- **A vs B:** both competitors' data plus yours.

"Update competitor pricing once, updates everywhere"; a new feature comparison appears on every page; accuracy stays consistent.

## Index pages

`[coreyhaines31/marketingskills, competitors]`
- **Alternatives index** (`/alternatives`): a headline ("[Your Product] as an Alternative"), a short intro on why people switch, every alternative page with the competitor's name, a one-line differentiator and a link, the aggregated reasons people switch, a CTA.
- **Vs index** (`/vs` or `/compare`): "[Your Product] vs Competitors" (direct comparisons), "Head-to-Head Comparisons" (A vs B pages), a brief methodology note, a CTA.
- **Keep them updated:** a new comparison page goes into its index. Link index to pages, pages back to the index, and related comparisons to each other; link feature pages to the relevant comparisons.
- **Show:** the last updated date, the number of comparisons, quick filters if there are many. Sort by search volume, alphabetically, by category or by date added.

Google's basis for the linking: "Every page you care about should have a link from at least one other page on your site", and good anchor text "is descriptive, reasonably concise, and relevant" ([crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).

## Footer columns

`[coreyhaines31/marketingskills, competitors]`
- **Minimum:** a "Compare" group linking `/alternatives` and `/vs`.
- **Columns by format:** "[Product] vs", "Alternatives to", "Compare", each with up to 8 links (top competitors by search volume) and a "View all" link to the index.
- Only create columns for formats you've built pages for; match column headers to the URL structure ("vs" column to `/vs/` URLs); columns may stack on phones, so order by priority; list the top ones, not every comparison.

The source says footer links pass "link equity from your entire site to comparison content" and signal "you're a key player in the space". Those are its claims, not Google's; Google says it "uses links as a signal when determining the relevancy of pages and to find new pages to crawl" and "There's no magical ideal number of links a given page should contain" ([crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)). landing-page-ui's footer is the owner's own design and keeps its own link set ([landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md)).

## Prove it

Every page's competitor facts come from the data file (grep the page for a price and find it only there); every data file has `last_verified` and `sources`; every comparison page is linked from its index and from at least one other page; footer columns exist only for built formats.
