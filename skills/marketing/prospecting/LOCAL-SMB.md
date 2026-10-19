# Local SMB branch

For selling to local small businesses: shops, gyms, restaurants, salons, clinics, professional services, contractors, real estate, fitness studios, dental practices [coreyhaines31/marketingskills, prospecting] references/local-prospecting.md, which says it is adapted from a local-client-prospector pattern (browser-assisted discovery, website status classification, proximity scoring). "The local branch is the most scraping-sensitive of the three motions." What Google's terms allow you to keep from Maps is in [LIST-COMPLIANCE.md](LIST-COMPLIANCE.md#google-maps).

## Signals

[coreyhaines31/marketingskills, prospecting]

- **Operational:** an active business (profile updated, recent reviews, recent hours updates); open now with regular hours and recent owner photos; customer engagement (the owner answering reviews, social posts, an active calendar).
- **Proximity:** distance from the user's location or service area; density (clusters of similar businesses are a neighborhood opportunity); travel time when the work is in person.
- **Decay:** a "closed permanently" banner; reviews paused or the listing reported closed; last review or post over 12 months ago.

## Website status

[coreyhaines31/marketingskills, prospecting] The primary qualification axis.

| Status | Definition | Typical outcome |
|---|---|---|
| No site found | No credible standalone website after a cross-checked search | Hot prospect for a web or marketing service |
| Social only | Facebook, Instagram, WhatsApp, Linktree, a booking portal or marketplace page only | Hot prospect for a web or marketing service |
| Weak site | A standalone site that is outdated, broken, very thin, not mobile-friendly, or missing a clear contact or conversion flow | Warm prospect for a refresh or rebuild |
| Has site | A credible, modern standalone site | Low prospect unless other signals apply (poor SEO, weak conversion design) |

"Finding 'no site' on Maps doesn't mean no site exists; do an exact-name web search before classifying."

## The browser workflow

[coreyhaines31/marketingskills, prospecting]

1. Search the map for the category near the base location, by hand, and walk the visible results. Don't bulk-extract.
2. Build candidates from visible local results, search results and public directories (Yelp, Bing and Apple Maps for different coverage, Facebook Pages, industry directories, the local chamber of commerce, state business registries).
3. Inspect public sources for each candidate's fields.
4. Search the exact business name plus city to check for a standalone website.
5. Classify the website status.
6. Mark confidence: High (2+ sources), Medium (1 source plus consistent evidence), Low (incomplete or ambiguous).

Once you have a candidate's own website URL, a fetch or a browser on that one URL can speed up the status check (live, modern, mobile-friendly, has a contact flow). "Strict line: use these on the individual business's URL. Don't point them at Google Maps, Yelp, or any platform whose ToS prohibits bulk extraction; discovery stays manual." Fetch tiers are in [web-scraping SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/SKILL.md).

When the user asks for subagents and they're available, split candidates into non-overlapping batches that verify only website, social and contact status.

## Qualification checklist

[coreyhaines31/marketingskills, prospecting] Active (reviews or activity in the last 6 months); the category matches the user's service; within the target radius; website status classified; phone or contact channel verified; at least one cross-source confirms the business operates at the listed address; not a duplicate, chain location or out-of-scope category; not closed permanently.

## Scoring

[coreyhaines31/marketingskills, prospecting]

| Score | Criteria |
|---|---|
| Hot | No site found OR social-only + phone present + active business + within target radius |
| Warm | Weak site, poor online presentation, or marketplace or booking page only |
| Cold | A good website already OR low confidence |
| Skip | Closed, duplicate, outside radius, irrelevant category, or not a business prospect |

## Output columns

[coreyhaines31/marketingskills, prospecting]

```
| Score | Business | Category | Area | Distance | Website status | Website/Social | Phone | Why it's a prospect | Confidence |
```

```csv
score,business,category,area,distance_km,website_status,website_url,social_urls,phone,email,source_urls,why_prospect,confidence,verified_date,notes
```

Keep "Why it's a prospect" short and actionable; write `Not found` rather than leaving a field blank; include source links sparingly; if confidence is low, say exactly what remains uncertain.

## Top outreach targets

[coreyhaines31/marketingskills, prospecting] For the top 3 hot leads: no site or social only plus a phone present first; then a high review count (an established business); then owner-answered reviews ("engaged owner = more likely to evaluate a vendor"); then alignment with your specialty over a generic category match. One sentence per target naming the gap and the signal, in the source's shape: "No standalone website (cross-checked); 80+ Google reviews with owner replies; 2 km from target area."

## Contact rules

[coreyhaines31/marketingskills, prospecting] Public business channels only: the published phone, the contact form, the info@ address. Don't reach individual employees through personal channels. An owner's name published on the business's own site is fine to use; if you only found it on LinkedIn, record that source.

## Common mistakes

[coreyhaines31/marketingskills, prospecting] Bulk-scraping the map ("fastest way to violate ToS and lose the research channel"); treating listings as truth (cross-check hours, status, reviews); skipping the exact-name website search; targeting only the largest businesses ("The 2-5 employee SMBs are the under-served opportunity"); generic outreach to every hot lead instead of naming their gap ("I noticed your menu isn't visible on mobile"); skipping chains and franchises without checking whether the franchisee has local marketing authority.

## Prove it

Every "No site found" row had an exact-name web search; every row has a cross-source confirming the address; nothing was bulk-extracted from a map or directory; only each business's own URL was fetched programmatically; the retained fields came from the business's own site or were recorded with their source; blank fields read `Not found`; and the top three each have a one-sentence gap-plus-signal rationale.
