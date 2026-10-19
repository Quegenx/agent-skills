# Restaurant and cafe visual services

Four related offers, paraphrased from [more skills, 15-restaurant-food-visuals.md]. Use [DEMO-FIRST.md](DEMO-FIRST.md) for the shared acquisition/delivery loop and [marketing-images REAL-PHOTO-EDITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#food-and-cafe-premises) for the canonical dish/premises fidelity contract.

## Offer order and buyer

[more skills, 15-restaurant-food-visuals.md]

Work one area at a time with independently operated cafes/restaurants. The author proposes the physical review card first, a finished dish demonstration second, then the coherent photo set and menu after initial acceptance. This is an offer sequence, not proof that one channel or offer always wins. Check the review platform customers actually use locally.

| Offer | Deliverable and author-proposed unit |
|---|---|
| Review card | Programmed physical card with QR fallback in a counter stand; one purchase, business owns it, no monthly subscription. Setup and genuine-review rules belong to [PHYSICAL-REVIEW-CARDS.md](PHYSICAL-REVIEW-CARDS.md). |
| Dish demonstration | First actual-dish image free, usable whether or not the recipient replies, subject to image rights. |
| Photo set | Fixed-price, one-off set of four coherent images: frontage, room, counter/cake case, dish, in that order. |
| Menu rebuild | Paid job with image plus editable file and explicit owner transcription signoff. |
| Optional recurring extension | One fresh dish image each week for social output; distinct from one-off menus/photo sets. |

The source states no selling price. It favors operator-run production and selling reviewed output; do not replace operator review with an assumption that owners cannot judge their own food.

## Qualification and routing

[more skills, 15-restaurant-food-visuals.md]

The author's starting filters are rating at least 4.5 and roughly fewer than 150 reviews, with one-site independents preferred. These are targeting hypotheses, not proof of food quality. The detailed prompt additionally rejects fewer than 5 reviews and apparent chains, but says uncertain chain matches should be kept/flagged. Existing [local SMB guidance](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LOCAL-SMB.md#common-mistakes) checks franchisees' marketing authority instead of categorical exclusion.

Assess each offer independently: actual food photograph for dish work; low review count plus more than one year in business for the review-gap prose; a genuinely thin photo set; or an absent/unreadable/menu-image-only menu. The source priority is review card, dish, photo set, then menu. Proposed output fields are decision, reason, rating, review_count, photo_count, four needs flags, lead_with and one factual owner observation.

Do not deploy the literal selector unchanged: its prompt omits the business-age condition, checks only missing website for menus, cannot classify food from photo metadata alone, lacks an uncertainty flag, and at exactly 150 reviews may require a lead choice with no true needs flag. It gives no complete unknown/rejected/no-offer representation. Preserve these unresolved branches for a decision rather than fabricate booleans or numbers.

Google's supporting APIs return up to 10 photographs, so returned array length is not a verified listing inventory. The source instead treated it as the total. Verify a thin-photo claim with appropriate evidence. [Google Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos)

Missing website data also requires the existing [exact-name cross-check](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LOCAL-SMB.md#website-status); it is not proof no site/menu exists. Retained evidence follows [prospecting LIST-COMPLIANCE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#google-maps).

## Dish and four-image production

[more skills, 15-restaurant-food-visuals.md]

Obtain permissioned actual photographs, follow the [food/premises branches](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#food-and-cafe-premises), put original and result together, and inspect every output for restyling. Keep the four-image sequence and common presentation without changing actual food, signage, neighbors, seating or premises. The author's preparation exercise is at least 10 inspected dish edits before the first send. It is not a validated sample size or reliability guarantee.

## Exact menu reconstruction

[more skills, 15-restaurant-food-visuals.md]

Preserve every item and price, section heading, order and item-to-section membership, spelling and capitalization. Do not silently correct wording or round prices. Mark genuinely unreadable text as `XXXX` instead of guessing. Compare every line with the original, tell the owner it is a draft needing their check, and obtain transcription signoff. Deliver an editable file as well as the image.

The source's optional visual direction is warm off-white, serif section headings, sans-serif items, generous spacing, right-aligned prices and a narrow section rule, without decorative assets. Aim for a phone-readable and A4-readable deliverable. This is a menu proposal, not a replacement for owner UI design.

Keep proofread=false initially and block approval for menu assets while it remains false. Asset approval remains separate from authorized sending. The source asks an image model to generate the entire menu; the existing words-in-post policy remains in force, with [both views recorded here](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#conflicting-source-methods). The transcription contract does not approve that conflicting rendering method.

## First message and handoff

[more skills, 15-restaurant-food-visuals.md]

Allowed facts are business name, exact work, checked rating/review/photo information and chosen channel. Use fewer than 55 words, plain language and optionally lowercase. Open with the finished work being their own photograph, use one supported listing number once, offer the gift without reply/purchase condition and end with one easy question. No call, meeting, audit or package pitch; no invented meal, local identity or relationship. Apply [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md) rather than repeating a phrase list. The source's example used both rating and count and claimed a sole cause without evidence; do not copy it.

Start with a spreadsheet for a small local batch. If ongoing work justifies an app, the source separates a prospect list sorted by review count, a before/after detail with editable message, and a send history. Business records carry identity, supported metrics, offer flags and selected lead; assets carry kind, originals/results, draft message, exact model/prompt, proofreading and pending/approved/rejected state; send records identify asset, channel, recipient and time. Ownership/access follows [Supabase security](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SECURITY.md). Raw Places retention, incomplete storage-write rules and insert-only history erased by cascades are unresolved source implementation defects, not a ready migration.

## Evidence boundary

[more skills, 15-restaurant-food-visuals.md]

The author reports live search/photo pulls/edits, but no business outreach, physical-card trial or measured reply rate. Universal device support, photo reuse permission, channel superiority and vendor free-tier claims are not established. Apply the [photo-rights correction](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#start-with-permission-and-the-original); public customer photos are not automatically licensed to the depicted business.

## Prove it

[more skills, 15-restaurant-food-visuals.md]

Each offer has its own unit and acceptance gate; qualification uses verified rather than sampled photo totals and cross-checked website/menu status; every dish/premises result passes the shared fidelity review; every menu item/price was checked and owner-signed-off in an editable handoff; unproofread menus cannot be approved; and neither a free sample nor asset approval is treated as sending permission or a demonstrated sales result.
