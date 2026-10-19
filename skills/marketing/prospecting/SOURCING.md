# Sourcing

How to get contacts legitimately: "LinkedIn is where the people are, and scraping it is where the lawsuits are" [coreyhaines31/marketingskills, prospecting] references/sourcing-and-enrichment.md and data-sources.md. Filling in missing fields and verifying them is in [ENRICHMENT.md](ENRICHMENT.md); the terms each platform sets are in [LIST-COMPLIANCE.md](LIST-COMPLIANCE.md).

## Sourcing without scraping LinkedIn

[coreyhaines31/marketingskills, prospecting]

1. **Define the audience in Sales Navigator** (or LinkedIn search): titles, seniority, company size, industry, geography, recent job changes, growth. "This is research, which is fine."
2. **Pull the contacts from a licensed database** with the same filters; licensed providers carry the provenance. Check what each provider's contract allows and where its LinkedIn-overlap data comes from before assuming it is compliant.
3. **Use LinkedIn by hand for Tier 1:** confirm the person still holds the role, read their recent posts, decide whether to connect.

Sales Navigator facts, corrected: LinkedIn "currently doesn't offer the option to export account and lead information from Sales Navigator into a CSV or XLS file" (https://www.linkedin.com/help/sales-navigator/answer/a102031), and CRM sync needs Advanced Plus ("Sales Navigator Advanced- Team collaboration without CRM sync", "Advanced Plus- Full CRM sync", https://www.linkedin.com/help/sales-navigator/answer/a104003). The source said CRM sync comes "only on Advanced plans"; its "caps searches at 2,500 results" has no official page found.

## Other sources

[coreyhaines31/marketingskills, prospecting]

| Source | Good for | Notes |
|---|---|---|
| Job boards (via job-post data providers) | Companies hiring in your function | Also reveals their tools |
| Directories and marketplaces | Niche lists: app store developers, agency directories, partner listings, software review categories | Check each site's terms; prefer official APIs or exports |
| Competitor customer pages | Logos and case studies | Use them as accounts, not as a pitch ("I see you use X") |
| Podcast guests, conference speakers | Leaders who talk publicly | Ready-made research material too |
| AI list builders | Niche lists from a plain-English description | "Precise but incomplete": the source cites one 2026 evaluation where the best tool found about a fifth of possible matches at high precision. Use for depth, not coverage |
| Actor-based scrapers for sites without an API | Structured data from public sites | Only sites whose terms allow it; "never for LinkedIn" |
| Lookalikes | "More companies like our best customers" | Similar-company search in your database or a search API |
| Maps and local directories | Local businesses | Find them there; keep fields from the business's own site ([LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#google-maps)) |
| GitHub | Developer-tool accounts as an aggregate signal | Not a contact source ([SAAS-AND-B2B.md](SAAS-AND-B2B.md#github-as-a-signal-not-a-contact-source)) |

Two rows of the source's table are corrected here. It listed "Google Places API | Local and SMB lists | The compliant programmatic route"; Google's terms forbid copying and saving business names, addresses or reviews from Maps content, so the Places API cannot build a retained lead list ([LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#google-maps)). It listed GitHub as a contact source for outreach; GitHub's policies forbid that ([LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#github)).

## Visitor identification

[coreyhaines31/marketingskills, prospecting] Pixel-based tools that identify anonymous site visitors as companies or people (the source names RB2B for person-level US identification, Warmly, Vector, Koala) feed the "high-intent visit" signal ([SIGNALS.md](SIGNALS.md#rank-signals-by-how-close-they-are-to-you)). The source's cautions: "verify your privacy policy disclosures"; "Person-level identification raises higher concerns than company-level". A vendor's claim that its identification needs no consent banner is the vendor's claim; consent for tracking scripts is in [cookie-consent SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/cookie-consent/SKILL.md). Never mention an identified visit to the prospect ([SIGNALS.md](SIGNALS.md#common-mistakes)).

## Vendor facts

The source's descriptions of vendors, none verified against the vendors' own pages: Apollo ">200M contacts, >60M companies" with "Email accuracy ~60-80%"; ZoomInfo "Expensive ($15K+/yr starter)"; Hunter's free tier "25 lookups/month"; Clearbit "absorbed into HubSpot (Breeze Intelligence)" with free tools ended in 2025; Truelist returning `email_state` values `ok`, `email_invalid`, `risky`, `unknown`, `accept_all` and sub-states such as `is_disposable` and `is_role`, through `/api/v1/verify_inline` (one address) and `/api/v1/verify` (bulk). Check the vendor's current docs before relying on any of them.

With no paid tools, the source's fallback is browser research on public sources: exact-name searches, LinkedIn company pages by hand, the business's own site and About page ("primary source for any claim"), news and press releases.

## Prove it

Every contact on the sheet came from a licensed provider, the business's own site or manual research, with that source recorded; nothing was exported or scraped from LinkedIn; no Maps names, addresses or reviews are stored as list data; no person came from GitHub user data; and any visitor-identification signal on the sheet came from a tool your privacy notice discloses.
