# Guest-house pages, overflow calls and room assets

Two related guides with different operating contracts: [more skills, 04-hotel-ai-front-desk.md] sells a property-grounded voice demo; [more skills, 16-guest-house-systems.md] combines a direct-booking request page, strict overflow message taking and per-room assets. Keep the modes separate. Shared qualification, demo review, postcard approval and send records are in [DEMO-FIRST.md](DEMO-FIRST.md).

## Choose the property and the offer

[more skills, 04-hotel-ai-front-desk.md; more skills, 16-guest-house-systems.md]

Guide 04's author filter is independent lodging in the chosen city/radius, rating at least 4.0 and a published phone. Guide 16 proposes rating at least 4.4, at least 25 reviews and no evidenced property-owned website; it rejects chain/group properties and the combination of Hotel in the name with more than 400 reviews. These are author qualification choices, not proof of revenue, ownership or service quality. A missing website field does not prove no site exists.

Guide 16's proposed flags are missing website, platform-only website, fewer than eight returned photos and phone present. Its classifier chooses voice before photos whenever a phone and real website exist, making its later photos branch unreachable; it also lacks a defined outcome for a real website with no phone. Resolve those branches before using the classifier. Returned-photo count is not a verified count of every property photo.

| Offer | Deliverable and billing choice in guide 16 |
|---|---|
| Direct page | A complete free first page is the proposed acquisition offer. Later page work is a one-time build, client-owned with hosting, rather than a page held behind a subscription |
| Overflow voice | Operator-managed monthly service, with actual phone/minute costs and continuing lost-call review |
| Room assets | One job per room, photographs/film priced as a set; see the existing generation conflict below |

No numerical selling price, commission rate or monthly fee is supplied. Guide 04 gives no pilot duration. Guide 16 proposes treating the first fortnight as a pilot; the author explicitly had not deployed its number, live voice path, booking page or room film. Do not sell the document as production evidence.

## Mode A: a grounded hotel FAQ demo

[more skills, 04-hotel-ai-front-desk.md, steps 3 to 8]

Build the knowledge sheet before the voice demo. Its eleven top-level fields are check-in, check-out, parking (free/paid/none), pets, breakfast, Wi-Fi, pool, room types, cancellation policy, distances to main nearby attractions and the five recurring review themes. Use the property's actual sources; mark unlisted facts unknown. Show three finished sheets for review. The source requested twenty recent reviews, but its selected API source does not establish that collection; use available permitted evidence under [list compliance](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md).

Use a warm, calm, brief greeting and answer only from the knowledge sheet. The source proposes switching to the caller's language when supported, collecting the caller's name and callback number when the answer is unknown or a human is requested, and offering the booking link when someone wants to stay. Do not invent prices or availability, impersonate staff, promise an unsupported callback time or send a booking text without the caller's permission. These are a demo's proposed behaviors to verify, not established capabilities of every voice provider.

Check every property demo against check-in time, dogs/pets and parking; send three working agent links for operator calls. A simple demo page leads directly to that property's voice interaction, identifies the builder and, when the actual plan supports it, can display a demo number. Say what has been built as a demo, rather than claiming the property already operates it.

Guide 04 proposes an alert after a demo conversation exceeds thirty seconds, with property, actual duration, available transcript and an actually available contact number attributed to its real source. It also proposes Friday drafts for prospects whose page opened without a voice interaction. Report observed events without asserting the visitor was the owner or that a follow-up is authorized. Its postcard uses the shared three-proof/batch-approval flow.

## Mode B: strict overflow message taking

[more skills, 16-guest-house-systems.md, system 3.1 and Prompt 01]

Keep the owner's number and let an answered call remain with the owner. The author proposes conditional forwarding after four rings, then answering within two rings once the assistant receives the call. Those are different points in the call path, not a two-ring total promise. Confirm the actual carrier/number support before promising this setup.

The first sentence identifies the property and says it is an answering assistant. If asked whether it is human, say plainly that it is automated. Ask one question at a time, in this order: arrival date/nights; people/rooms; caller name; callback number. Read the number back digit by digit and confirm it. Close using the owner's actual callback window; the source's immediate-callback greeting must not create an unsupported commitment.

This mode cannot see the calendar, confirm availability or a booking, quote a price, or take a card, deposit or payment detail. It can pass on a change/cancellation request but cannot say the change is complete. For distress, anger or a problem at the property, stop ordinary intake, mark the message urgent, tell the caller it will be passed on immediately and end politely. That handoff must actually be supported; a promise is not completed notification. Answer supplied factual questions plainly and leave other facts unknown. Keep replies around the author's twenty-word ceiling and allow interruption.

**Source discrepancy:** guide 16's overview prohibits prices it has not been given, while its full prompt prohibits every quoted price. This strict intake mode follows the latter. Mode A is a separate grounded FAQ recipe; do not silently merge their permissions. [more skills, 16-guest-house-systems.md; more skills, 04-hotel-ai-front-desk.md]

## Preserve partial capture and notification state

[more skills, 16-guest-house-systems.md, Prompt 01 and database Prompt 06]

The call record contains nullable caller name, callback number, arrival date, nights, guests, rooms and note; enquiry type is new booking, existing booking, question or other, alongside urgent and captured flags. Captured is true only when both name and callback number exist. If the caller hangs up before both required fields are collected, keep the actual partial information in the note and leave captured false. A completed name-and-number capture remains true when the call ends; never invent a callback number.

The proposed app has prospects, enquiries and booking-request views. Enquiries show newest calls with transcript/recording when available and permitted. The owner message, not a dashboard visit, is the primary delivery: author acceptance target is within one minute after the call ends, with name, callback number and dates. Keep `owner_notified_at` separate from `captured`; recording a call does not prove the owner was notified.

The source's four-record model is:

| Record | Source fields and states to retain |
|---|---|
| Properties | Owner identity, unique place ID, name/town/address, rating/review/photo counts, nullable website and agent number, phone, client flag and initial new status; the source's raw payload field does not override permitted-data retention |
| Enquiries | Property link, call fields above, note/transcript/recording reference and nullable owner-notified timestamp |
| Booking requests | Property, guest name/email/optional phone, arrival/nights/guests, room type/message; new, confirmed or declined |
| Assets | Property, room photo/room film/booking-page kind, before/after references, actual model/prompt and pending initial status |

All four have IDs and creation timestamps; dependent records belong to their property. Do not adopt raw Places-payload retention as a prospect database; the existing [list-compliance owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LIST-COMPLIANCE.md#google-maps) governs retained fields. The source proposes newest-call lookup per property and a lookup of unnotified calls. Its schema is a proposal, not a complete deployed product. Clerk trust, owner RLS and the child-to-property authorization join use [Supabase's existing security and provider owners](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SKILL.md). Determine the authorized server writer for incoming calls and public booking requests before production; an owner-read policy alone does not establish those writes. Do not copy the source's migration prompt as proof of isolation.

## Direct booking means a request

[more skills, 16-guest-house-systems.md, system 3.2]

Collect room choice and the requested dates/party details with the guest contact information. Hold no inventory and take no payment in this first version. Email the actual request to both parties and let the owner confirm it; a new request is not a reservation. Add payment only if the client asks. The stated commercial angle is a route for repeat, recommended or name-search guests, not a guarantee that every platform booking can be replaced or a claim that no-site properties take every booking through intermediaries.

The source's content inputs are a real room image, property name/town, short factual description, room prices, requested dates, one request action and contact/address/map details. **Design conflict:** it mandates that page order and excludes other components. The existing [landing-page owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md) requires copying the production references. Keep that owner design; treat the supplied items as content/request inputs, not permission to replace the layout. [more skills, 16-guest-house-systems.md; web-ui/landing-page-ui/SKILL.md]

Use actual booking economics for any fee comparison. The source's commission and universal payback claims are not established inputs; do not manufacture a percentage or promise the page pays for itself after one booking.

## Room assets and the first message

[more skills, 16-guest-house-systems.md, systems 3.2 to 3.3 and Prompts 03 to 05]

The shared [real-photo contract](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md) owns room architecture/furniture preservation and permitted cleanup. The source's room-film brief starts on the approved still and makes one slow continuous forward/slightly-left move, with no pan away, orbit, ceiling tilt, cut, acceleration or easing. It proposes fifteen to twenty seconds with an explicit aspect ratio, holding the shot to the last frame without a fade. Keep room, furniture, bed, light and objects stable; reject appearance/disappearance, shape change or drift. Its only tiny movement exceptions are fabric settling and almost imperceptible light shift. Exclude people, opening doors, moving curtains, flare, vignette, grading shifts, music, text, captions, logos and watermarks; scrub the whole clip for defects.

**Method conflict:** that generated-location method disagrees with the existing [marketing-video rule](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/SKILL.md). Keep the existing rule; the detailed source brief is an attributed alternative and acceptance record, not permission to generate footage of the real property. [more skills, 16-guest-house-systems.md; coreyhaines31/marketingskills, video]

The proposed first message is under seventy words: state the actual free artifact, one evidenced booking fact, no invented visit/local identity, no platform-name pitch or commission percentage, and one simple question. Its free page remains free whether the property replies. Route publication and outreach through [DEMO-FIRST.md](DEMO-FIRST.md), not an automatic send prompt.

## Operate after the owner signs

[more skills, 04-hotel-ai-front-desk.md, going live; more skills, 16-guest-house-systems.md, charging and acceptance]

Guide 04 starts with unanswered and after-hours calls, updates known facts from the owner and proposes an 8 a.m. summary of call time, caller number, need and callback action. The source leaves the timezone unspecified; agree it before scheduling. Booking-link messages require an actual requested/permitted conversation. Direct reservations are a later separately scoped capability, not this intake mode.

Guide 16 proposes operator review of lost calls weekly in the first month, fixing the actual prompt failures, and owner access to recordings during the first fortnight where lawful. Before live calls, verify local number availability, the actual recording/consent rules for the property and callers, and the appropriate greeting notice. The source's claim that recording is the only legally consequential part is not adopted; other data, communication and image rights remain with their existing owners.

If the owner actually uses WhatsApp, the source suggests adapting the message-taking job to text, omitting the spoken greeting/readback. Verify that channel with the owner and use [the existing WhatsApp consent/template rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/WHATSAPP.md); regional generalizations are not evidence of this property's workflow.

## Prove it

[more skills, 04-hotel-ai-front-desk.md; more skills, 16-guest-house-systems.md]

- Mode A's property answers match its knowledge sheet; all missing facts remain unknown, and three sheets/agent links/card proofs reach operator review.
- Mode B's future acceptance exercise includes at least twenty calls with interruption, hangup and price requests. It identifies itself, never confirms a booking or price, and reads the callback number back. This guide does not claim those calls ran.
- Owner-answer priority, actual forwarding behavior, partial capture and owner notification are distinct verified observations. The one-minute delivery target is measured rather than assumed from a transcript.
- Booking requests remain new until the owner confirms or declines them; no inventory hold/payment is implied.
- The pilot, fee units, asset rights, recording access and callback window are explicit; missing prices, permissions or production checks remain unresolved.
