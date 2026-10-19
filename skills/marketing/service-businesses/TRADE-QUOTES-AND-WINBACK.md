# Trade quotes and customer win-back

The paired service from [more skills, 11-trades-instant-quotes-winback.md]: a website quote widget for new inquiries and a permissioned past-customer reactivation queue, with source-tagged bookings and a per-booking fee. The owner-confirmed pricebook and existing [Jev](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md) and [SMS](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md) rules govern production.

## Offer, fit and unresolved commercial terms

[more skills, 11-trades-instant-quotes-winback.md]

The author proposes free setup, then payment per booked job from either channel. The source supplies no fee amount, completed-job requirement or cancellation terms. Its step title says free first job while its prose bills first-batch bookings. Resolve that ambiguity instead of inventing a free-booking allowance.

Select one repeat-price/repeat-work trade and city, such as plumbing, HVAC, electrical, pest control, garage doors, cleaning or landscaping. The author's qualification settings are rating at least 4.0, ten or more reviews, phone and website. Record permitted identity/contact evidence, listed services and observed booking method: contact-form-only, phone-only or online booking. Put contact-form-only candidates first and obtain selection approval using [DEMO-FIRST.md](DEMO-FIRST.md).

## Owner-confirmed price table

[more skills, 11-trades-instant-quotes-winback.md]

The table has one row per job type, base price, modifiers and exclusions. The source's illustration uses drain clearing at $180 plus $60 after 6 p.m. or $90 weekends, 40/50-gallon heater swaps at $1,450/$1,700, and leak repair at $220 first hour then $110 per additional hour. Repipe and commercial-building work require a visit. These are supplied illustrations, never local market rates or a client's prices.

For production, use the actual owner's rates. If no document exists, the author proposes a ten-minute price interview, then transcription from authorized recording or notes, a plain-language table returned for corrections and explicit owner confirmation before loading it.

Per request, preserve four outputs: job type, whether the owner table can quote it, applicable modifiers and whether a human must look first, including emergency, damage or commercial-context cases. Code selects exact table values and computes the amount under the existing [code/judgment boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md#the-rules).

The author's quote threshold is strictly above 0.8; anything else becomes a callback with submitted answers saved, which includes equality. The guide does not specify a complete combination rule for all four outputs. Do not silently ignore a human-first flag or treat a high score as calibrated permission. Apply [existing Jev calibration](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/PRODUCTION.md).

## Widget and paired demonstration

[more skills, 11-trades-instant-quotes-winback.md]

The widget brief asks three or four short plain-language questions: job type, relevant modifier questions and desired timing. It then shows a supported price/time window and booking action, asking name/phone afterward. Send actual bookings and supplied incomplete-request details to the owner and log them. Match the authorized client site's fonts/colors rather than changing production design rules.

The source requests script-tag installation but supplies no implementation. It also provides no availability integration proving a displayed slot is bookable. Asking phone last cannot guarantee every abandoning visitor leaves a callable lead; only information actually submitted exists. Keep these as implementation inputs rather than claims the widget is already built.

The proposed acquisition demo combines a working quote illustration with three sample win-back messages, an invitation to provide the real price/customer lists for free setup and the actual operator contact. Its postcard focuses only on the quote widget mid-quote; win-back is introduced during the conversation. Use the [shared mail packet](DEMO-FIRST.md#prepare-the-mail-packet), retaining three demo pages and three postcards for approval.

**Demo price conflict:** the source asks for estimated local rates in the preview, conspicuously labelled unconfirmed, while its final rule bans any price outside the owner's table. Keep production owner-confirmed. Do not invent local rates; any explicitly approved illustrative demo exception must use supplied source figures or actual confirmed inputs and show its limits. Do not invent a prospect's customer backlog. [more skills, 11-trades-instant-quotes-winback.md]

## Past-customer intake and message queue

[more skills, 11-trades-instant-quotes-winback.md]

Import customer name, phone, email, actual last job, job date and amount. The source excludes complaints, refunds, unresolved issues, contact within the previous 90 days and last-job value below owner-selected `[$x]`. Rank eligible candidates by actual service history and substantiated service timing; elapsed time alone does not prove an individual customer needs maintenance.

Draft one message per eligible customer in the authorized business voice, referencing the actual prior job and supported due work, with the booking link. Show the top 50 candidates and every draft before sending. An owner export and operator approval do not establish promotional SMS consent; use [SMS consent and suppression](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md). [Twilio's Messaging Policy](https://www.twilio.com/en-us/legal/messaging-policy) requires promotional written consent and proof, appropriate sender/subject scope and opt-out handling. [more skills, 11-trades-instant-quotes-winback.md; Twilio Messaging Policy]

**Cadence differences:** this guide says one message per customer and skip already-contacted people, yet later reenqueues customers next season. It does not define whether one means ever or per service cycle. The existing [win-back sequence](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/SEQUENCES.md#win-back) also has a second-send option from its own source. Keep both tagged views and the existing sequence; do not enable recurring contact under this single-message recipe until cycle scope and authorization are resolved. [more skills, 11-trades-instant-quotes-winback.md; coreyhaines31/marketingskills, sms]

## Onboarding, continued delivery and fee statement

[more skills, 11-trades-instant-quotes-winback.md]

After owner acceptance and price confirmation, install the authorized widget and start with the first 50 eligible customer records, reviewing every message. Track every actual booking by widget or win-back origin. A high model confidence does not remove the approval requirement.

The ongoing source proposal works through the next owner-chosen `[x]` messages each week and hands uncertain widget requests to the owner with submitted answers and supplied phone. Seasonal reenrollment remains held until the source ambiguity above is resolved.

At month end, operator and owner receive widget bookings, win-back bookings, callbacks needed and total value of booked work. Invoice from the agreed per-booking basis, not callbacks, sent messages or an assumed completed-job amount. No source fee rate is supplied.

## Prove it

[more skills, 11-trades-instant-quotes-winback.md]

Show the corrected/confirmed owner price table, exact computations, supported availability and uncertainty handoff. Show permitted past-customer records, exclusions, substantiated due-work claims and every required draft approval. Single-message versus recurring-cycle scope and first-batch charging are resolved or held. The monthly counts trace to real channel-labelled bookings and the agreed billing definition.
