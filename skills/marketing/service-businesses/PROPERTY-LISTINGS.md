# Property-listing services

Listing observation, a one-room demonstration and managed recurring production, paraphrased from [more skills, 17-estate-agent-listings.md]. The buyer is the responsible estate agent, not the property seller. Shared discovery, approval and authorized outreach belong to [DEMO-FIRST.md](DEMO-FIRST.md); the staging technique is defined in [marketing-images REAL-PHOTO-EDITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#empty-property-staging).

## Offer sequence and observation record

[more skills, 17-estate-agent-listings.md]

The author proposes listing observation first, one staged main reception room as the entry demonstration, then listing films as continuing work. Work one town/postcode and contact the named agent handling the listing through the permitted business channel. Do not contact the seller to undermine their agent.

For a permitted radar, keep one snapshot per listing per day with price, status and photo count; compare today with 30 days earlier and retain first_seen. The manual starter option is weekly observation of six target agents' own sites. Prefer an authorized feed/API and apply [web-scraping](https://github.com/Quegenx/agent-skills/blob/main/skills/web-automation/web-scraping/SKILL.md) before collecting portal data. Low frequency or observing robots rules alone does not override platform terms.

Prioritize observed price reduction, longer observation age relative to the local observed sample, and thin/empty photography as the author's hypotheses. First_seen is observation age, not verified original listing date; a median observed age is not proven local time to sale. A missing 30-day snapshot does not establish unchanged price. Alert on a zero-result snapshot day so a broken collector is visible.

## Screening contract and unresolved inputs

[more skills, 17-estate-agent-listings.md]

The source's ordered rejects are: younger than chosen MIN_DAYS without a known price reduction; sold/under offer/SSTC/withdrawn; no photographs; centrally marketed new-build development. Its additive ranking is a configurable author heuristic:

| Observed signal | Points |
|---|---|
| Price reduction | 40 |
| Vacant/unfurnished | 25 |
| Observation age above twice the chosen local benchmark | 20 |
| Fewer than 8 photographs | 15 |
| No furnished main reception photograph | 10 |

The maximum is 110, not 100. Route an empty property to staging; a furnished property with at least 10 photos to film; otherwise to photo work. Output carries decision, reason, days_on_market, price_reduced, is_empty, photo_count, score, lead_with and one factual street-specific agent observation. Label the age's observation basis despite the source field name. Do not infer empty condition from missing evidence.

The source permits unknown fields and a null previous snapshot but requires numeric/boolean outputs without an unknown representation. Hold that exact automated template until missing data, benchmark provenance and no-previous-snapshot behavior are decided. Do not manufacture defaults or an unprovided MIN_DAYS.

## Demonstration and staging acceptance

[more skills, 17-estate-agent-listings.md]

Use one authorized actual empty main reception-room photograph and an explicit furniture list. Follow the [staging preservation/disclosure contract](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#empty-property-staging), including full-size comparison for removed defects, suitable ordinary furniture, correct scale and a disclosure inset against cropping. Give the agent one clear original/result demonstration rather than an unsolicited complete property set.

Photo commissioning alone does not establish the agent's copyright ownership, and a two-word label alone does not discharge every local disclosure obligation. The [official corrections](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#start-with-permission-and-the-original) and [California-specific disclosure correction](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#empty-property-staging) apply.

## Film brief and policy conflict

[more skills, 17-estate-agent-listings.md]

Preserve the useful film brief independently from its proposed generation method: 40 to 60 seconds, approximately four-second shots, ordered as exterior, hall, reception, kitchen, bedrooms largest first, bathroom, garden, exterior. Exteriors push forward without tilt; rooms drift laterally parallel to a wall; kitchen/bathroom shots push toward the work surface; gardens rise slightly. Alternate drift direction between consecutive rooms. Deliver a clean silent cut without music, text, transitions or added branding so the agent can brand the licensed deliverable.

The source proposes constant slow motion without acceleration, easing or an end settle, holding the last frame without fade. No geometry/object changes, added people/pets, opening doors, moving curtains/trees/clouds/water/lights, changing reflections or decorative film effects. Review each clip at quarter speed, watching door frames, worktop edges and fence horizons for warping or room expansion; reject uncertain shots.

**Current policy remains.** The source explicitly animates real listing photographs with image-to-video. [more skills, 17-estate-agent-listings.md] The existing rule prohibits generated footage of recognizable real locations or specific products and requires recording/building from the real thing. [coreyhaines31/marketingskills, video, marketing-video/SKILL.md] Keep the existing rule; this film brief is not an exception. The long source prompts also differ from current image/video prompt-length guidance; [the shared conflict record](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#conflicting-source-methods) preserves both views.

## Message and commercial handoff

[more skills, 17-estate-agent-listings.md]

Supply agent first name, agency, street only, exact work, supported observation age and known reduction status. Draft fewer than 65 words, plain and optionally lowercase. Name the street and free deliverable; mention age at most once neutrally. Never mention seller, asking price or reduction in the message; never imply a visit or criticize the agent's marketing. Disclose staging, avoid a call/meeting/package pitch and end with one easy question about further rooms. Return the message only; use [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md) for generic copy checks.

Measure actual complete-property production cost, including rejected attempts, before quoting. The source bills each staged set and film per property, with the provider carrying reroll risk, then offers an agreed monthly property volume. No monetary price is supplied. A 60-second/four-second plan is 15 accepted clips; its illustrative 20 attempts is not a bound on repeated failures. Retain human review of every staged room and clip rather than selling unreviewed automation.

## Prove it

[more skills, 17-estate-agent-listings.md]

Snapshots have permitted provenance and distinguish observation age from market age; unknown previous records remain unknown; additive score totals at most 110; selected offer matches evidence; the original and staged room preserve structure/defects and carry required disclosure; film production follows the current generic policy; the quote uses actual complete-property cost; and handoff specifies per-property or agreed monthly volume with named human QA. The author reports no live radar, produced listing film or agent outreach; the supplied example rooms were illustrations, not verified real-listing results.
