# SaaS and B2B branches

The SaaS branch sells to SaaS and digital businesses; the B2B branch sells to everyone else in B2B: services, agencies, manufacturers, mid-market and enterprise companies, professional services [coreyhaines31/marketingskills, prospecting] references/saas-prospecting.md and b2b-prospecting.md. "Treating B2B like SaaS: funding rounds matter less; PE ownership and acquisition activity matter more." Where contacts come from is in [SOURCING.md](SOURCING.md); verification in [ENRICHMENT.md](ENRICHMENT.md).

**Contents:** [SaaS signals](#saas-signals) · [B2B signals](#b2b-signals) · [Discovery sources](#discovery-sources) · [GitHub as a signal, not a contact source](#github-as-a-signal-not-a-contact-source) · [Qualification checklists](#qualification-checklists) · [Output columns](#output-columns) · [Top outreach targets](#top-outreach-targets) · [Common mistakes](#common-mistakes) · [Prove it](#prove-it)

## SaaS signals

[coreyhaines31/marketingskills, prospecting]

- **Technographic:** complementary tools (your integration target) or competing tools (a switch opportunity); recent stack changes ("adding/removing tools signals active vendor evaluation"); custom-built tooling, often a buyer who'd benefit; a free competitor plan, possibly ready to upgrade.
- **Growth:** a funding round in the last 6 months; headcount growth of 10%+ last quarter; openings for your buyer's role (hiring a "Head of RevOps" is a signal for RevOps tooling); product velocity (frequent shipping, new features, posts).
- **Decay (downgrade):** layoffs in the target department; a funding round over 2 years old with no follow-up; nothing shipped in 6+ months; a team page showing founders only.
- **Stage fit:** don't target Series C+ for early-stage sellers ("too many procurement hoops"), or pre-seed and seed for products that need meaningful budget.

## B2B signals

[coreyhaines31/marketingskills, prospecting]

- **Firmographic:** industry (NAICS or SIC codes if precision matters); headcount, revenue and location-count bands; geography (time zones, regulations, on-site needs); business model; ownership (independent, PE-backed, public, family-owned), which "affects buying motion".
- **Buying signals:** trigger events (a new C-level hire, an acquisition or divestiture, IPO or funding, a new location, a rebrand, expansion); vendor signals (public RFPs, switching costs in a quarterly report, contract renewal windows); operational signals (layoffs as cost pressure, rapid hiring as capacity pressure); news of new initiatives, markets or regulation that forces action.
- **Decay:** multiple bankruptcies or PE-stripped operations; negative growth with cost-cutting headlines; ownership stagnation; buyer turnover ("3+ Marketing Directors in 2 years").

## Discovery sources

[coreyhaines31/marketingskills, prospecting] Combine 2+ sources for cross-verification. Vendor descriptions are the source's, not verified.

- **Primary:** licensed contact databases (the source names Apollo for breadth, ZoomInfo for enterprise and intent, Clay for waterfall enrichment and custom scoring); Sales Navigator for decision-maker mapping, used by hand ([SOURCING.md](SOURCING.md#sourcing-without-scraping-linkedin)).
- **SaaS technographic and growth:** BuiltWith, Wappalyzer, Crunchbase, Pitchbook, Product Hunt launches, Show HN.
- **SaaS buying signals:** job boards (role openings), visitor identification, recent posts and changelogs, reviews mentioning competitor switches.
- **B2B directories:** Crunchbase and Pitchbook (funded businesses), D&B Hoovers, state and national business registries (incorporation), industry association member rosters, trade-show exhibitor lists, vertical procurement databases.
- **B2B trigger monitoring:** news alerts on trigger keywords ("acquired", "hires", "expansion", "raises", "announces"), press-release wires, SEC filings (material changes), state filings (new entities, dissolutions).

## GitHub as a signal, not a contact source

The source's SaaS reference pulls stargazers of competitor repos with a CLI, enriches their emails and validates them before "adding to outreach list", and its data-sources file calls GitHub a "Public API, no scraping concerns". The [GitHub list-policy correction](LIST-COMPLIANCE.md#github) applies to API and scraped information; the Acceptable Use Policies distinguish API collection from scraping without exempting it from the use restrictions. [https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies]

Stargazers and forks may count as an aggregate account signal (which companies show up around a category), never as a list of people to email. The API limits the source quotes are right: "your personal rate limit of 5,000 requests per hour", 60 an hour unauthenticated; on 403 or 429 wait for `retry-after` or `x-ratelimit-reset` (https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

## Qualification checklists

[coreyhaines31/marketingskills, prospecting]

**SaaS:** industry matches the ICP; headcount in range; the stack includes (or notably excludes) a target technology; funding stage matches buyer maturity; at least one growth signal in the last 90 days; the decision-maker role exists (named or inferable from job listings); a verifiable email contact; no disqualifiers (closed, acquired and paused, layoffs, ICP miss).

**B2B:** industry matches (a recognized classification if possible); size in range; geography fits; at least one trigger event in the last 90 to 180 days; the decision-maker role exists; a verifiable contact ("named role > info@ catchall"); source URLs captured for firmographic claims; no disqualifiers (closed, acquired and paused, multiple bankruptcies, off-ICP).

## Output columns

[coreyhaines31/marketingskills, prospecting]

SaaS CSV:

```csv
score,company,domain,industry,size_band,country,funding_stage,last_round_date,tech_stack_match,signal,signal_date,contact_name,contact_title,contact_email,email_status,linkedin_url,source_urls,why_prospect,confidence,verified_date,notes
```

B2B CSV:

```csv
score,company,domain,industry,naics_code,size_band,revenue_band,country,city,trigger_event,trigger_date,contact_name,contact_title,contact_email,email_status,linkedin_url,source_urls,why_prospect,confidence,verified_date,notes
```

Chat tables condense to: Score | Company | Industry | Size | Signal (or Trigger) | Contact | Email status | Confidence. Add a lawful-basis column for EU and UK contacts ([LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#provenance)).

## Top outreach targets

[coreyhaines31/marketingskills, prospecting]

- **SaaS order:** strongest signal recency ("funding 30 days ago beats funding 9 months ago"); tech stack match strength (a known integration partner beats inferred fit); a named decision-maker with a verified email beats a guessed role address; multi-source agreement beats one source.
- **B2B order:** trigger recency (30 days beats 6 months); trigger specificity (a new hire in your buyer's role beats "company in the news"); decision-maker access; exact vertical fit beats "adjacent industry".

Each rationale is one sentence naming the signal and the contact, in the source's shape: "Hired new VP of Marketing 14 days ago; verified email; mid-market manufacturer matching ICP."

## Common mistakes

[coreyhaines31/marketingskills, prospecting]

- Using a database export wholesale without re-verifying emails and firmographics; "Stale data is the norm".
- Treating tech stack data as complete; BuiltWith, Wappalyzer and waterfalls all miss things.
- Trying to pin down private company revenue; use size bands.
- Ignoring procurement at enterprise scale; the contact list may not include the approver.
- Cold-emailing executive assistants: "they're not the buyer and they will flag your outreach as spam".
- No source lineage: "without source lineage, you can't defend a contact under GDPR DSAR or CAN-SPAM challenge."
- Stopping at one source; cross-verify with LinkedIn by hand or the business's own site.

## Prove it

Each Hot row names a growth signal or trigger event with a date inside the checklist window; firmographic claims carry source URLs; no row's contact came from GitHub user data; a GitHub-based signal appears only as an account-level count; the CSV headers match the branch above; and the top targets are ordered by the branch's order with one-sentence rationales.
