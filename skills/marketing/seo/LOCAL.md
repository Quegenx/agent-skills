# Local SEO

Local SEO works out why a business does or doesn't show in Google Maps and the local pack near its customers, and what to fix first. The workflow comes from OpenSEO's `local-seo` skill (every-app/open-seo, MIT), with profile, citation and measurement additions from [coreyhaines31/marketingskills, seo-audit/references/local-seo.md, local-seo-profile-and-citations.md and local-seo-pages-and-measurement.md]; the review and naming rules are Google's own policies, quoted. Location landing pages built from a template are in [PAGES-AT-SCALE.md](PAGES-AT-SCALE.md) (the Locations playbook); `LocalBusiness` markup is in [STRUCTURED-DATA.md](STRUCTURED-DATA.md).

## Inputs

[open-seo, local-seo]

- The business by `cid` or `placeId` ("most reliable"), or its name.
- Its coordinate. Derive it from a local search result row; ask only when that is ambiguous.
- "One to three keywords customers actually search (e.g. "emergency plumber", not the brand name)".
- What the business does and where it operates, from `.agents/product-context.md` ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md)); this decides the keywords and the radius.

## Workflow

[open-seo, local-seo]

1. **Find the listing.** Search the brand name with a wide radius, then resolve identity with cid/place_id, coordinates and the actual business context. The source and this file formerly treated several name hits as proof of a chain, despite the source's warning about same-name collisions; multiple hits alone do not establish common ownership. [open-seo, local-seo]
2. **Get the local pack** for the main keyword near the coordinate. Record the top 3 to 5 competitors' `cid`/`place_id` and the business's own row.
3. **Compare against the top two competitors:** primary category, additional categories, review count, hours completeness, photo count, claimed status.
4. **Check each listing's website link:** it "should deep-link to that location's page on the project domain, not a homepage or a stale domain". Broader on-page work goes to [TECHNICAL-AUDIT.md](TECHNICAL-AUDIT.md).
5. **Reviews** for the business and the strongest competitor: volume, recency, average rating, and the share with an owner reply.
6. **Rank grid** for the main keyword: separate "ranks at the storefront only" from "ranks across the service area", and name who wins at each point where the business doesn't. A 3x3 grid is nine searches; go to 5x5 only when the service area is genuinely wide, and tell the user the cost first, because every point is a paid SERP call.
7. **Posts** only once the profile basics are competitive and the gap is engagement, not setup.
8. **Prioritize.** "Category and claim problems outrank posting cadence every time."

The source's step 7 also uses profile Q&A. Google discontinued the My Business Q&A API on November 3, 2025 ([sunset dates](https://developers.google.com/my-business/content/sunset-dates)); this file formerly inferred that all profile Q&A work was unavailable. Google's [Maps Q&A help](https://support.google.com/maps/answer/7421661?hl=en) still describes the feature in certain countries/regions, and DataForSEO separately documents a [Q&A endpoint](https://docs.dataforseo.com/v3/business_data/google/questions_and_answers/task_post/). OpenSEO's tool uses that provider route. Treat Q&A as optional evidence only after checking the actual provider, market and runtime availability; documentation alone does not prove a live endpoint. [every-app/open-seo, local-seo/SKILL.md; src/server/mcp/tools/dataforseo-research-tools.ts]

## Reading the grid

[open-seo, local-seo]

- "A missing rank at a grid point means the business wasn't among the results returned there. Read it with that point's `resultsCount`: a full result set means outranked; a near-empty one means a sparse SERP, not proof of invisibility."
- "A grid centered on the wrong place is worse than no grid": confirm the coordinate matches the storefront before spending on the grid.
- "Do not infer local-pack strength from national organic metrics."
- Match businesses by `cid` or `place_id` when you have one: "Name matching collides with chains and similarly named businesses."
- A local business "needs a grid before a tracker" [openseo.so, /features/rank-tracking].

## Chains

[open-seo, local-seo] Always build a snapshot table for every location (category, rating, review count, claimed status). Deep-dive all locations when there are 5 or fewer; with more, show the snapshot and ask which 1 to 3 to deep-dive, recommending a default such as "the weakest profile in the densest market".

## Prospects

Unclaimed listings (`isClaimed: false`) near the business are candidates for local partnership and link work [open-seo, local-seo]. Local chambers, associations, campus resources and community pages are local link prospects [open-seo, link-prospecting]; the method is in [LINKS-AND-OUTREACH.md](LINKS-AND-OUTREACH.md#finding-link-prospects).

## What Google forbids

The source's guardrail is "Never recommend review gating, fake reviews, or keyword-stuffed business names." Google's policies behind it:

- Merchants must not "Discourage or prohibit negative reviews, or selectively solicit positive reviews", and must not offer "incentives - such as payment, discounts, free goods and/or services" for reviews, nor post "conflict of interest" reviews ([Maps user-contributed content policy](https://support.google.com/contributionpolicy/answer/7400114)).
- "Including unnecessary information in your business name isn't permitted, and could result in the suspension" of the profile: no taglines, store codes, trademark signs or all caps ([Business Profile guidelines](https://support.google.com/business/answer/3038177)).
- Review stars in markup have their own rules (self-serving reviews are ineligible): [STRUCTURED-DATA.md](STRUCTURED-DATA.md).

Apple's equivalent rules for app reviews are in [aso RATINGS-AND-REVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/RATINGS-AND-REVIEWS.md).

## Business model and profile facts

[coreyhaines31/marketingskills, seo-audit/references/local-seo.md and local-seo-profile-and-citations.md]; [Google representation guidelines](https://support.google.com/business/answer/3038177); [service-area guidance](https://support.google.com/business/answer/9157481)

| Actual operation | Audit boundary |
|---|---|
| Storefront | Confirm a real customer-facing location and the hours customers can visit |
| Service-area business | Customers are served at their locations; hide a residential address and use the actual operating base, not a profile per target city |
| Hybrid | Show an eligible staffed customer-facing location and the actual service area |
| Multiple bases | Confirm genuinely separate eligible locations, staff and service areas before recommending separate profiles |
| Online-only | Do not invent a physical presence to obtain Business Profile eligibility |

Check the real-world name, appropriate categories, services, customer-contact phone, website destination, ordinary and special hours, and real photographs with permission. Keep the description factual; Google's rules exclude links and promotional prices or offers. Do not promise a ranking improvement from posting or filling a field. Apply the existing [naming and review rules](#what-google-forbids) and optional Q&A boundary above.

Keep private verification addresses separate from public profile fields, citations and website markup. Do not publish a home address merely to satisfy structured-data requirements. Google local-business rich-result eligibility still requires its documented public properties; `areaServed` does not replace a missing required address. Use [STRUCTURED-DATA.md](STRUCTURED-DATA.md) for that definition. [official representation guidelines above; coreyhaines31/marketingskills, seo-audit/references/local-seo-pages-and-measurement.md]

## Citation cleanup and useful location pages

[coreyhaines31/marketingskills, seo-audit/references/local-seo-profile-and-citations.md and local-seo-pages-and-measurement.md]

- Make a correction record with entity/location, listing URL, observed public facts, verified source of truth, correction or duplicate action, access/status and date. Compare meaning rather than punctuation; prioritize a wrong phone, address or location identity over harmless formatting differences.
- Preserve legitimate branch numbers and separate-location identities. On a real move, update the existing identity rather than creating an unnecessary duplicate. Paid distribution is optional; do not recommend buying directory coverage as an eligibility requirement.
- A location page represents an actual location. A service-coverage page needs useful local service evidence, availability and customer information; it does not establish a storefront or justify a new profile. Do not invent offices or generate city-swapped pages. Scaled-page rules remain in [PAGES-AT-SCALE.md](PAGES-AT-SCALE.md).

## Measure customer outcomes

[coreyhaines31/marketingskills, seo-audit/references/local-seo-pages-and-measurement.md]

| Evidence | Keep its limit visible |
|---|---|
| Qualified calls and inquiries | Count the actual qualified outcome, not every tap |
| Profile interactions | Interactions are not completed purchases or attended visits |
| Search Console clicks and queries | Separate brand/nonbrand demand and the page/location scope |
| Tagged website actions | Confirm the event and destination before equating it with a lead |
| Local visibility observations | Record the point, query, date and returned-result coverage using the grid rules above |

Record a baseline by location and period, then compare like-for-like windows and customer outcomes. Distance, demand and query mix can change. Do not promise a fixed uplift or recovery date, or attribute a change to one profile edit merely because it followed it. A narrow request for a profile description does not require a full local audit first. [coreyhaines31/marketingskills, seo-audit/references/local-seo.md and local-seo-pages-and-measurement.md]

## Report

[open-seo, local-seo] In order: **Snapshot** (one or two sentences, then category, rating, review count, claimed status; a row per location for a chain); **The one fix**; **Head to head** (signal, this business, best competitor, gap: categories, reviews with count, recency and owner replies, hours and completeness, website link); **Maps coverage** (where visibility drops and who wins there; label every value in a chart); posting only when the basics are competitive; **What to do next** as an ordered list; **How this report was made**, reading each missing grid rank against that point's `resultsCount`.

## Prove it

The listing is matched by `cid` or `place_id`; the grid's center matches the storefront; every missing grid rank is read against its `resultsCount`; the first fix is a category, claim or website-link problem whenever one exists; each listing links to its own location page; no recommendation gates, buys or filters reviews or stuffs the business name; optional Q&A evidence uses a verified available surface rather than the discontinued API; the user saw the cost before any 5x5 grid ran; private addresses stayed private, citation changes use a verified source of truth, coverage pages do not invent locations, and outcome comparisons name their location, period and limits. [open-seo, local-seo; official Q&A sources above]
