# Links and outreach

Link attributes, Google's link-spam limits, editorial prospecting, lawful outreach and verifying an actual backlink. Sources: Google Search Central, OpenSEO's `link-prospecting` skill (every-app/open-seo, MIT), and coreyhaines31/marketingskills `directory-submissions` v2.1.1 (MIT) for backlink verification, plus `link-building` SKILL.md and references/tactics.md, prospecting-and-outreach.md and risk-policy.md for diagnosis, reclamation and risk review. The directory assets, catalog, positioning and submission workflow are in [DIRECTORY-SUBMISSIONS.md](DIRECTORY-SUBMISSIONS.md); the tracker is [submission-tracker.csv](submission-tracker.csv). Press coverage is in [public-relations SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/public-relations/SKILL.md); general cold email is in [cold-outreach SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SKILL.md).

## Link attributes

From [qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links) unless marked:

- "For regular links that you expect Google to fetch and parse without any qualifications, you don't need to add a `rel` attribute." There is no `dofollow` attribute.
- `sponsored`: "Mark links that are advertisements or paid placements (commonly called *paid links*) with the `sponsored` value." `nofollow` "was previously recommended for these types of links and is still an acceptable way to flag them, though `sponsored` is preferred."
- `ugc`: "We recommend marking user-generated content (UGC) links, such as comments and forum posts, with the `ugc` value."
- `nofollow`: "Use the `nofollow` value when other values don't apply, and you'd rather Google not associate your site with, or crawl the linked page from, your site."
- "You may specify multiple `rel` values as a space- or comma-separated list", for example `rel="ugc nofollow"` or `rel="ugc,nofollow"`.
- These are hints, not blocks: "All the link attributes, `sponsored`, `ugc`, and `nofollow`, now work today as hints for us to incorporate for ranking purposes. For crawling and indexing purposes, `nofollow` will become a hint as of March 1, 2020" ([2019 announcement](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify)). Linked pages "may still be crawled" through sitemaps or other links.
- Page level: `<meta name="robots" content="nofollow">` means "Do not follow the links on this page", and "Any rule that can be used in a robots `meta` tag can also be specified as an `X-Robots-Tag`" ([robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)).
- "Google can only crawl your link if it's an `<a>` HTML element" with an `href`; "Links are also crawlable when you use JavaScript to insert them into a page dynamically"; "If you were paid in some way for the link, qualify these links with `sponsored` or `nofollow`" ([crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)).

On your own site, links that users supply carry `ugc` or `nofollow`; the owner's app design already does: "**Links the item supplies** get `rel="nofollow noopener noreferrer"`" ([app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md)).

## What Google calls link spam

Verbatim from [spam policies](https://developers.google.com/search/docs/essentials/spam-policies): "Link spam is the practice of creating links to or from a site primarily for the purpose of manipulating search rankings." Its examples:

- "Buying or selling links for ranking purposes", including "Exchanging money for links, or posts that contain links"; "Exchanging goods or services for links"; "Sending someone a product in exchange for them writing about it and including a link"
- "Excessive link exchanges ("Link to me and I'll link to you") or partner pages exclusively for the sake of cross-linking"
- "Using automated programs or services to create links to your site"
- "Requiring a link as part of a Terms of Service, contract, or similar arrangement without allowing a third-party content owner the choice of qualifying the outbound link"
- "Text advertisements or text links that don't block ranking credit"
- "Advertorials or native advertising where payment is received for articles that include links that pass ranking credit, or links with optimized anchor text in articles, guest posts, or press releases distributed on other sites"
- "Low-quality directory or bookmark site links"
- "Keyword-rich, hidden, or low-quality links embedded in widgets that are distributed across various sites"
- "Widely distributed links in the footers or templates of various sites"
- "Forum comments with optimized links in the post or signature"
- "Creating low-value content primarily for the purposes of manipulating linking and ranking signals"

The carve-out: "It's not a violation of our policies to have such links as long as they are qualified with a `rel="nofollow"` or `rel="sponsored"` attribute value to the `<a>` tag."

Domain Rating (DR) is an Ahrefs metric, not a Google signal; Google's docs don't mention it. The directory source attributes high DR with little organic traffic to badge-swap rings; those observations alone do not establish the cause. Judge directories by verified audience, editorial fit and actual link practices, not DR. [coreyhaines31/marketingskills, directory-submissions; existing observations-are-not-causes rule in TECHNICAL-AUDIT.md]

## Finding link prospects

[open-seo, link-prospecting]

1. **Clarify the linkable asset** (page, product, study, guide, tool) and the reason someone would reference it.
2. **Build 5 to 10 queries** from these patterns: `<topic> resources`, `best <category> tools`, `<competitor> alternatives`, `<topic> statistics`, `<topic> guide`, `<topic> examples`, `<topic> templates`, `<topic> software`, `<topic> for <audience>`. Run them through a licensed SERP data source or by hand, never by scraping Google ([Ranking evidence](TECHNICAL-AUDIT.md#ranking-evidence)).
3. **Mine competitors' backlink profiles** when you have them; continue without if unavailable.
4. **Local businesses:** use the local pack and nearby businesses to find local chambers, associations, campus resources, community pages and directories ([LOCAL.md](LOCAL.md)).
5. **Filter.** Keep topical, editorial pages: articles, directories, resource pages, comparisons, statistics pages, templates, curated lists. Deprioritize homepages, login pages, thin affiliate pages, spam, unrelated forums and direct competitors (unless a comparison angle is valid). Flag likely paid placements: a paid link is supposed to carry `sponsored`.
6. **Pick an angle per prospect:** a broken or missing resource; better current data; a useful tool or template; inclusion as an alternative or comparison; an expert quote or supporting reference.

For "best of" listicles, the directory source's search patterns are `"best [category] tools" 2026`, `"best [competitor] alternative"`, `"top AI [category]"`, `"[category] tools review"` [coreyhaines31/marketingskills, directory-submissions].

## Diagnose the target and reclaim earned links

[coreyhaines31/marketingskills, link-building/SKILL.md and references/tactics.md]

- Check the target page's indexing, query intent and useful content before recommending links. Compare its referring domains with three to five outranking pages, and add useful internal links from relevant strong pages. A page-level gap is a diagnosis to investigate, not proof that links are the only bottleneck; similar counts do not prove a content problem either.
- Reclaim an existing unlinked mention by identifying the exact sentence and a destination useful to its readers. Negative mentions need a response decision before a link request; do not treat every mention as an outreach opportunity.
- Inspect earned inbound links to dead URLs or redirect chains. Repair the destination with the [canonical migration and redirect owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/site-architecture/URLS-AND-LINKS.md), then ask valuable referring pages to update the link directly. Do not promise recovery of a particular amount of ranking value.
- For another site's broken resource, confirm that a proposed replacement covers the actual missing subject; build an appropriate asset or skip the pitch. Use real partner, integration, customer or vendor relationships, and ask list authors for an honest evaluation rather than a promised rank or reciprocal link.

## Outreach

- **Contact paths from public sources only** [open-seo, link-prospecting]: author bylines, contact pages, editorial guidelines, about and team pages, professional profiles, mastheads, and `Person`/`Organization`/`sameAs`/`email` structured data. "Only record contact details that were actually found. Include the source URL". "Do not invent email addresses, social handles, or contact names." If nothing turns up, name the next discovery step (author page, contact page, professional profile).
- **Personal data.** The source also lists "Public email addresses in page HTML". A named person's email is personal data under GDPR, and the repo's scraping rule is "never scrape personal or sensitive data" ([web-scraping SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/SKILL.md)). Prefer business-role contact paths (an editor's contact form, a published press address); use an individual's public address only with a lawful basis and an opt-out, and never build scraped lists.
- **The law.** Every email follows CAN-SPAM, GDPR, PECR and CASL as written in [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md).
- **Messages.** "Avoid spammy mass outreach. Personalize by page and reason." [open-seo, link-prospecting] Draft two or three reusable messages: resource or list inclusion, an article update, a comparison mention. Ask to be reviewed or considered; don't trade a product, credits or money for a link. The directory source's listicle template offers "a free account + credits for readers" in exchange for a mention, which is "Exchanging goods or services for links" when it aims at a link; any gift is disclosed and any resulting link qualified.
- **Report** [open-seo, link-prospecting]: the angle; a prospects table (URL, site, source, angle, contact path, priority); why each prospect fits, then the exact ask; the drafts; limitations (contact paths not found, competitors, likely paid placements, which source found each contact); what to send first.

## Outreach state and risk review

[coreyhaines31/marketingskills, link-building/references/prospecting-and-outreach.md and risk-policy.md]

Keep one deduplicated record with domain, exact referring page, tactic, target destination, lawful contact provenance, approval/status, sent/follow-up/placement dates and result. If an AI engine cited the prospect, record the actual prompt and observation; a placement is not a guarantee of future retrieval or recommendation. Verify observed attributes using [the backlink procedure](#verify-the-actual-backlink). The source's tactic-specific cap is one follow-up about a week later, then stop; this does not relax the [general sending and opt-out rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/cold-outreach/SENDING.md).

When reviewing a vendor, inspect actual placements, relevance, editorial standards, commercial terms and reporting. Selling unqualified links by DR, guaranteed optimized anchors, any-topic publication and counts-only reports are risk signals to investigate. Apply [Google's link-spam definition](#what-google-calls-link-spam), not a vendor's label. The source bans every paid insertion into an old article; Google's distinction is the manipulative purpose and required qualification, not article age alone.

For an actual manual action, read the Search Console notice, remove or qualify controlled or purchased links, record unsuccessful removal attempts and prepare a reconsideration explanation of the changes. Do not infer a manual action from a third-party toxicity score. [coreyhaines31/marketingskills, link-building/references/risk-policy.md]

Google's disavow gate requires both a considerable quantity of spammy, artificial or low-quality incoming links **and** an actual or likely manual action caused by them. Try removal first; most sites do not need the tool and incorrect use can harm Search performance. The source simplified this to a manual action or large self-created link volume; keep Google's conjunctive gate. An audit does not authorize uploading a disavow list or changing an existing one. [official disavow guidance](https://support.google.com/webmasters/answer/2648487?hl=en); [owner approval rule]

## Verify the actual backlink

The source's procedure [coreyhaines31/marketingskills, directory-submissions], with four additions from Google's docs marked (G):

1. Fetch the listing's HTML (`curl -fsSL https://directory.example/your-listing`) or inspect its rendered DOM. `curl -I` cannot see an anchor's `href` or `rel`, but (G) read `X-Robots-Tag` there: a page-level `nofollow` in the header or in `<meta name="robots">` (or `googlebot`) qualifies every link on the page.
2. Find the specific `<a>` that links to your product and check its destination, including redirects. (G) It must be an `<a>` with an `href`; a `<span href>`, an `<a onclick>` or a router link without `href` is not reliably a link.
3. Record its actual `rel` tokens, (G) split on spaces and commas. With no qualifier, record "unqualified link observed": "There is no `dofollow` attribute to look for, and this is not a guarantee of indexing, ranking credit, or referral traffic."
4. If the anchor is absent from the downloaded HTML, check whether JavaScript renders it (Google crawls links inserted by JavaScript). Blocked, behind a login or not inspectable: "unverified". Inspection confirms no link: "missing".
5. (G) On a paid or badge tier, `sponsored` (or `nofollow`) is the correct observed value, not a failure.
6. Save the listing URL, checked destination, observed attributes, timestamp and any access limit. Recheck after a directory changes its template or tier.

## Prove it

Every prospect was chosen for topical fit and traffic, not DR; no link was bought, swapped, required by a badge or created by an automated service without being qualified; every contact detail has a source URL and was found in public, business-role sources; each outreach email meets [email-practices COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/COMPLIANCE.md); every verified backlink has an observed `rel` and timestamp from the anchor itself, with page-level `nofollow` and `X-Robots-Tag` checked; target-page gaps remain hypotheses, outreach state prevents duplicate pitches, and any disavow recommendation satisfies both official conditions without an unauthorized upload. [open-seo, link-prospecting; coreyhaines31/marketingskills, directory-submissions; Google links guidance above]
