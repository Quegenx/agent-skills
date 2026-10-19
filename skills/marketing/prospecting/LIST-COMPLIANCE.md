# List compliance

The platform terms and data rules that apply while building a list, before anything is sent [coreyhaines31/marketingskills, prospecting] references/compliance.md, which carries the note: "Operational guidance, not legal advice. For high-volume programs or programs touching EU/UK residents, run your setup past a privacy attorney." The law per country (CAN-SPAM, GDPR and ePrivacy, UK PECR, Germany, Canada, Australia, US phone rules) is in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md); this file covers what the list must record and what each platform allows.

## Provenance

[coreyhaines31/marketingskills, prospecting] "Every contact carries: the source (provider or URL), the collection date, the lawful basis for EU/UK contacts, and the last verification date and result. This answers 'where did you get my email?' and makes data deletion requests possible."

- For EU and UK contacts the source of the data must be told to the person "at the latest at the time of the first communication" (GDPR Art. 14, https://gdpr-info.eu/art-14-gdpr/); the record is what makes that line in the first message true.
- Keep a written legitimate interests assessment where legitimate interest is the basis; the cases and the UK and EU positions are in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md).
- Flag or exclude personal addresses (Gmail, personal Outlook); "Personal addresses raise GDPR risk significantly."
- Store only what you need and plan when to delete it. The French regulator's 2024 decision against Kaspr found that a five-year retention renewed on each data update (usually a job change) keeps data "for a disproportionately long time" (https://www.cnil.fr/en/data-scraping-kaspr-fined-eu240000).

## Sensitive traits

[coreyhaines31/marketingskills, prospecting] "Never target or infer sensitive traits. Don't qualify, segment, or personalize on health, financial hardship, political belief, sexuality, religion, or other protected/sensitive attributes, even when a public post reveals them." The demand-signal branch adds: exclude personal-distress contexts entirely ([FIRST-CUSTOMERS.md](FIRST-CUSTOMERS.md#step-3-public-sources-only)).

## LinkedIn

- **Sales Navigator as a research tool is fine;** define filters there and pull contacts from a licensed database ([SOURCING.md](SOURCING.md#sourcing-without-scraping-linkedin)) [coreyhaines31/marketingskills, prospecting].
- **The User Agreement** bans bots and automated methods that "add or download contacts, send or redirect messages", scraping tools, and attempts to "bypass or circumvent any access controls or use limits" (section 8.2, https://www.linkedin.com/legal/user-agreement). Scraping LinkedIn at any scale is out.
- **Publicly visible is not free to use.** CNIL fined Kaspr €240,000 on 5 December 2024 for collecting the contact details of LinkedIn users who had restricted their visibility to 1st and 2nd-degree connections (https://www.cnil.fr/en/data-scraping-kaspr-fined-eu240000); in March 2026 Kaspr chose to delete its database and stop collecting data on LinkedIn (https://www.cnil.fr/fr/cloture-de-linjonction-prononcee-lencontre-de-la-societe-kaspr).
- **Vendors that depend on LinkedIn can disappear.** The source reports lawsuits against Proxycurl and ProAPIs and removed company pages for Apollo, Seamless and HeyReach; this is news it reports, not verified. "Keep an alternative."
- The source: "Messages, InMail, and connection requests are still processing of personal data, so GDPR, PECR, and similar laws apply exactly as they do to email" [coreyhaines31/marketingskills, prospecting].

## Google Maps

Google's Maps Platform Terms 3.2.3(a), "No Scraping": customers "will not export, extract, or otherwise scrape Google Maps Content for use outside the Services", including to "copy and save business names, addresses, or user reviews"; 3.2.3(b) bans caching "except as expressly permitted" (https://cloud.google.com/maps-platform/terms). The Places policies: "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions", and "the place ID ... is exempt from the caching restrictions. You can therefore store place ID values indefinitely" (https://developers.google.com/maps/documentation/places/web-service/policies).

- **Use Maps to find businesses by hand;** keep place IDs if you want to look a business up again; take every retained field (name, address, phone, email) from the business's own site and record that URL as the source.
- The source said "The Places API is the compliant way to pull business data programmatically"; under 3.2.3(a) the Places API cannot fill a retained lead list.
- The source's local reference said "Don't store full Google Maps Place IDs in your CRM"; place IDs are the one thing the policies let you store indefinitely.
- No bulk extraction from Maps, Yelp or other directories whose terms forbid it; a fetch or browser on a business's own URL is fine ([LOCAL-SMB.md](LOCAL-SMB.md#the-browser-workflow)).

## GitHub

GitHub's Acceptable Use Policies (https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) forbid using information from the service, "whether scraped, collected through our API, or obtained otherwise", "for the purposes of sending unsolicited emails to users" or "selling personal information, such as to recruiters, headhunters, and job boards", and limit personal information to "the purpose for which that User has authorized it". GitHub data may inform an account-level signal; it never becomes a contact list ([SAAS-AND-B2B.md](SAAS-AND-B2B.md#github-as-a-signal-not-a-contact-source)). The source said "Public API, no scraping concerns".

## Data providers

[coreyhaines31/marketingskills, prospecting]

- Every licensed provider has terms limiting reselling, downstream sharing and use cases. "Read your contract: typically you can use the data for your own outreach but not productize it."
- "Don't share extracts publicly (e.g., on a leaderboard, in a public report)."
- No breached, leaked or unprovenanced data, no scraped-contact marketplaces, no list brokers without source lineage: "You inherit their legal exposure."
- No reselling a list built from any platform whose terms forbid it.

## Anti-patterns

[coreyhaines31/marketingskills, prospecting] Bulk-scraping LinkedIn, Maps or Yelp; buying lists without provenance; guessing addresses and sending unverified ("you can't claim a 'legitimate interest' basis for an email you fabricated"); harvesting personal addresses from public profiles; keeping data you don't need; skipping lawful-basis records; reselling lists; and CAPTCHA or login-wall bypass, which "violates virtually every ToS" (the rule in [SKILL.md](SKILL.md#the-rules)).

## The pre-ship audit

[coreyhaines31/marketingskills, prospecting] Before the list goes to the user or to outreach:

- Every contact has a source URL and collection date.
- No contacts came from scraped LinkedIn data.
- No Maps content (names, addresses, reviews, ratings, listing copies) is retained beyond Google's terms.
- The country gate in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md) was applied to every row, including the entity type for UK contacts.
- Phone numbers were scrubbed against Do Not Call lists, and no AI-voice calls are planned without prior express consent.
- The lawful basis is documented (a legitimate interests assessment for B2B, or the relevant alternative).
- Email addresses were verified ([ENRICHMENT.md](ENRICHMENT.md#verification)).
- Personal addresses are flagged or excluded.
- The providers' contracts permit the intended use.
- A retention plan says when the list is deleted.
- The first outreach will carry an opt-out, a postal address and, for EU and UK contacts, where the data came from ([cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md#the-rules)).

## Prove it

A sample of ten rows each shows source, collection date, lawful basis (EU and UK) and last verification; no stored field came from Maps content other than a place ID; no person on the list came from GitHub or a LinkedIn export; no row was qualified on a sensitive trait; the provider contract names your use case; and the retention date is written on the list.
