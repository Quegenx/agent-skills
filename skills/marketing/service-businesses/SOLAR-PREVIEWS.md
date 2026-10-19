# Solar preview services

Two installer-facing offers and their operating contract, paraphrased from [more skills, 14-solar-rooftop-renders.md]. This is a service guide, not a Google Solar API tutorial. Shared discovery, demonstration, approval and authorized delivery follow [DEMO-FIRST.md](DEMO-FIRST.md); roof-edit constraints are defined once in [marketing-images REAL-PHOTO-EDITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#solar-roof-illustrations).

## Choose the buyer and pilot

[more skills, 14-solar-rooftop-renders.md]

- Residential offer: a local installation firm buys a ready-made campaign pack for its own town. The author's starting suggestion is 30 house illustrations, aimed at installers of roughly 2 to 20 people. Those are targeting and batch choices, not validated optimums. Contacting an installer first does not remove homeowner-data, photograph or marketing-permission requirements.
- Commercial offer: roof previews for commercial installers, with an author target of roughly 5 to 50 people. Investigate business categories with large roofs, such as merchants, storage, furniture showrooms, distribution, printing or joinery. The occupying business is not necessarily the roof owner, and daytime activity does not establish on-site electricity consumption or savings.
- Start with one property manually, one spreadsheet row and a before/after folder. Do not build a scheduler or dashboard before the workflow is understood. For a first client, the author proposes one town, an agreed image count, two weeks and a fixed fee; measure actual replies before negotiating recurring terms. No selling price or measured reply rate is supplied.

## Qualification and supported numbers

[more skills, 14-solar-rooftop-renders.md]

The source's screening is an ordered business heuristic, not installation design: reject capacity below 8 panels, no slope of at least 20 square meters, selected slope more than 90 degrees away from the equator-facing azimuth, pitch below 5 or above 45 degrees, or imagery older than a chosen minimum year. It selects among eligible slopes by closeness to equator-facing azimuth, using 180 degrees in the northern hemisphere and 0 in the southern. The commercial variation proposes at least 800 square meters, 250 panels, maximum 15-degree pitch and removal of the orientation reject.

Hold that exact automated selector: the commercial variation retains the residential 5-degree minimum despite favoring flat roofs; the area-only fit rule does not prove placement on the visible chosen slope; and selecting the smallest configuration when none fits violates its own fit bound. Rejected/missing records require numeric fields the source may not have. Do not invent fallback values, an equatorial rule or engineering clearance.

The proposed review output carries decision/reason, selected slope pitch/azimuth/area, chosen panel count, capacity, modeled annual production and confidence. The source sets low confidence for non-HIGH imagery but does not define the other confidence levels. Preserve missing/unknown inputs rather than filling them with a model guess.

Use only numbers traceable to the actual reviewed configuration. Capacity is count times supported panel watts divided by 1,000; the author displays one decimal place. Annual modeled production must belong to that configuration, with its source and date, rather than an unrelated total. The commercial option rounds displayed panel count down to 50; that is not permission to leave inconsistent capacity/production labels. Omit unavailable numbers. Do not turn production into money, percentages or payback in the preview message.

## Compose and review the deliverable

[more skills, 14-solar-rooftop-renders.md]

1. Confirm the building identity, appropriate photo rights, usable visible roof and supported measurements. Center the asset on the actual building rather than trusting an entrance/car-park pin.
2. Use the [roof illustration contract](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#solar-roof-illustrations), including matching visible count, obstacles, existing arrays, materials, light and unchanged surroundings.
3. Make a one-page asset: large illustration, supported count/capacity/approximate annual production beneath it, legible measurement provenance/date and a clear illustration-not-installation-design statement. The source proposes PNG/PDF exports.
4. Review every final asset. The operator can compare original/result and provenance, edit the message, approve, reject or regenerate. Repeating the same render is the author's first retry option, not a success guarantee or permission for unbounded paid attempts.
5. Use only an approved final asset in a separately authorized send, and monitor the reply inbox. A corrected bounced address is not itself a new permission to contact.

## Message contract

[more skills, 14-solar-rooftop-renders.md]

Supply only property address, supported panel count, capacity/production, measurement source/date and actual sender identity. Draft fewer than 60 words in plain language, optionally lowercase. Open by explaining the illustration, state production once, identify the source briefly, disclose its illustrative status and end with one easy question. No invented visit, survey, prior request, relationship or financial saving; no greeting formula, compliment or energy-bill question. Return message text only, or email subject/body with a subject under 50 characters. Generic inflated sales language is checked under [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md), not a second phrase dictionary here.

## Operating records and handoff

[more skills, 14-solar-rooftop-renders.md]

Keep building identity/location and residential/commercial type, supported roof metrics and imagery date, asset references, exact model/prompt, subject/body, review status and send history with recipient/channel/provider ID/time. Use permitted retention, not the source's keep-raw-data-forever instruction. The source distinguishes prospect list, side-by-side review/detail and send log, with prospect-stage filters and largest-roof-first sorting as optional operator choices.

Checkpoint each stage so a failure resumes from the last completed step. The author proposes weekday-morning preparation, one active job and three retries after 1, 5 and 25 minutes, then parking/alerting. Durable work and duplicate prevention belong to [background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/SKILL.md); ownership and private asset access belong to [Supabase security](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SECURITY.md). A pending/approved column alone does not prove unauthorized sending impossible. The source also leaves insert-only send rows versus delivery updates/cascade deletion and storage-write permissions unresolved.

Managed option: agency keeps code/keys and a named human reviewer, with monthly billing per lead or booked appointment. Client branding/domain requires actual authorization. Handoff option: build in client accounts, teach a reviewer to approve and agree setup plus ongoing support. The source prefers managed visual QA; it gives no basis for assuming every client reviewer is incapable.

## Input and evidence limits

Use the existing [list-compliance rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#google-maps) rather than a retained raw Maps prospect database. In the fetched non-EEA Solar-specific terms, marketing as a Downstream Transaction requires user opt-in; raw Building Insights/Data Layers caching is limited to 30 days, with a fixed-media exception for valid Downstream Transactions. The source instead prescribed cold-property campaigns and permanent raw/photo retention. Check the terms applicable to the billing region and the attribution requirements before using provider data. [Service-specific terms, section 20](https://cloud.google.com/maps-platform/terms/maps-service-terms), [Solar policies](https://developers.google.com/maps/documentation/solar/policies)

Street View is not a general-purpose printable/editable marketing-photo source: [the shared rights correction](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#start-with-permission-and-the-original) applies.

[more skills, 14-solar-rooftop-renders.md] The author reports trying input APIs and illustrations, but no real prospect send, deployed dashboard or scheduled run, and no measured reply rate. Model identifiers, prices, coverage counts, sizing fallbacks and global channel claims are not adopted here. Generic image-prompt/product-generation conflicts remain in [marketing-images REAL-PHOTO-EDITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#conflicting-source-methods).

## Prove it

[more skills, 14-solar-rooftop-renders.md]

The selected offer names its installer buyer and permitted campaign inputs; one property was understood manually before automation; every shown number traces to the same configuration and matches the picture; every final received human review; source/date and illustration disclaimer remain legible; the pilot specifies town/count/two-week period/fixed fee without invented results; and handoff names account ownership, review responsibility and support terms. The author's suggested readiness exercise is at least 20 inspected illustrations, not evidence that this guide achieved production reliability.
