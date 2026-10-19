# Physical review-card service

The sample-to-sale service from [more skills, 03-nfc-review-cards.md]: send a free personalized NFC review card, then offer counter stands, staff cards and replacements with activity reporting. Use [DEMO-FIRST.md](DEMO-FIRST.md) for candidate approval, lawful contact and batch handoff; this guide owns the physical fulfillment packet.

## Fit and candidate packet

[more skills, 03-nfc-review-cards.md]

Choose a city and counter-based niche: cafes, restaurants, salons, barbers, gyms, dentists or retail. Look for actual storefront foot traffic, a physical counter and a published phone rather than a service-area-only listing. The author proposes rating at least 4.0 and treats review count as less central than in the website offer.

The source worksheet contains business name, address, phone, rating, review count, opening hours and place ID. Use permissioned sourcing, show the total and first 20 rows, and obtain list approval. Its blanket chain/franchise exclusion differs from the existing [local marketing-authority check](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LOCAL-SMB.md#common-mistakes), which remains in force. [more skills, 03-nfc-review-cards.md; coreyhaines31/marketingskills, prospecting]

## Controlled destination and acceptance

[more skills, 03-nfc-review-cards.md]

Program a redirect on the operator's domain rather than writing the final destination directly to each card. Keep each business-to-link mapping so the destination can be changed without replacing the card. The source proposes a business-slug path and visit timestamps. Menu, booking and website destinations are optional variants of the physical product.

The source's prose requires checking every link on a phone before ordering; its prompt instead opens five. Retain the stronger every-link acceptance, and label any five-link sample as additional spot checking rather than complete acceptance. Confirm destination identity and record which links were actually checked.

Use the actual owner's supported review destination. The source promises instant ready-to-rate access; [Google's review help](https://support.google.com/business/answer/3474122?hl=en) says reviewers need to sign in to a Google Account. Device coverage, supplier programming and any printed Google icon permission must be established for the selected product, not assumed. Review eligibility and counter behavior follow [review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md#platform-rules). [Google Business Profile help; more skills, 03-nfc-review-cards.md]

## Sample order and envelope

[more skills, 03-nfc-review-cards.md]

The source presents two fulfillment alternatives: a supplier prints/programs/drop-ships the sample, or the operator obtains blank NTAG213 cards, programs them and uses an authorized mailing route. Supplier support remains an input to verify.

Prepare one sample card per approved business. The order packet contains business name, neutral tap-to-review instruction, programmed redirect, quantity and correct shipping address. Show the complete order list and total cost before order approval.

Prepare a plain note of at most four lines: tap instruction, explanation of that business's review destination, statement that the sample is theirs to keep, and the real sender/name/number with an offer of cards for registers and staff. Approve the exact insert before submitting it to the supplier. This is a free sample to the business, not an incentive to a customer for leaving a review.

## Activity and follow-up

[more skills, 03-nfc-review-cards.md]

Keep a private operator dashboard with business, confirmed delivery date when available, total observed requests to the card link, this week's requests and baseline/current review counts. The author proposes daily refresh and a Monday internal list of the ten most-active businesses.

The source infers counter installation and owner interest from activity. A redirect request alone establishes neither physical taps, unique people, who used it nor reviews caused by the card. Report the observation using its actual unit and keep delivery evidence separate.

The author's strict greater-than `[n]` weekly activity threshold creates one follow-up draft per business. It identifies the sender/sample, cites the actual observed post-delivery count and offers the stand and staff-card setup. Show each draft; use only an authorized permitted channel. The shared [contact boundary](DEMO-FIRST.md#handle-observed-interest) still applies.

## Paid setup and continuing delivery

[more skills, 03-nfc-review-cards.md]

The paid product contains a counter stand, a specified number of staff cards and replacements as they wear out. Give each staff card a separate redirect to the same business review destination so the report can distinguish assets. The source's staff-name URL convention is optional; it supplies no privacy policy for those names.

Before every order, show quantities, destination addresses and total cost for approval. Send the owner an agreed monthly report of observed activity per card and current review count. Keep the neutral no-pressure review rules; card-level reporting is not a staff review quota or a request that reviewers name employees.

The source proposes pairing counter cards with [post-job review automation](REVIEW-AUTOMATION.md). It gives no selling price, subscription fee, pilot duration or margin. Resolve the actual purchase and reporting scope before promising them.

## Prove it

[more skills, 03-nfc-review-cards.md]

Show the approved candidate and order lists, every checked destination, the approved four-line insert, supplier capability evidence, matched programmed cards and actual fulfillment result. The private report distinguishes observed link requests from physical taps and attributed reviews. Repeat orders and the one-per-business follow-up have explicit approval; the paid quantities and reporting scope are agreed without invented fees.
