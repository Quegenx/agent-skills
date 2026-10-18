---
name: sms-marketing
description: "Plans and writes SMS, MMS and WhatsApp marketing that stays lawful: when a text beats email, copy that fits one segment, welcome, cart, browse, post-purchase, win-back, replenishment and re-engagement sequences, TCPA consent and the FCC revocation rule, CTIA opt-in and STOP/HELP replies, quiet hours and Do-Not-Call, A2P 10DLC registration, fees and Trust Score throughput, and the WhatsApp 24-hour window, template categories, quality limits and per-message pricing. Use when planning an SMS or WhatsApp program, writing a text sequence, checking SMS consent or opt-out handling, registering for 10DLC, or deciding between SMS, email and WhatsApp."
---

# SMS marketing

A text interrupts, so it has to be worth the interruption, and in the US every marketing text rests on a signed written consent the sender can prove, on revocation honored however the person phrases it, and on a registered sender whose Trust Score sets how fast it may send. This skill adapts the coreyhaines31/marketingskills `sms` skill (v1.1.0, MIT) and corrects it against the FCC's TCPA rules (47 CFR 64.1200 and order FCC 24-24), the CTIA Messaging Principles and Short Code Monitoring Handbook, Twilio's A2P 10DLC, pricing and throughput pages, and Meta's WhatsApp docs as the source cites them. The source reads `.agents/product-marketing.md`; here the shared file is `.agents/product-context.md` ([../../anti-ai-slop/anti-slop-copy/CONTEXT.md](../../anti-ai-slop/anti-slop-copy/CONTEXT.md)). Sending through OneSignal (senders, keywords, Journeys, quiet-hours nodes) is [../../backend/onesignal/EMAIL-AND-SMS.md](../../backend/onesignal/EMAIL-AND-SMS.md); email is [../../backend/email-practices/SKILL.md](../../backend/email-practices/SKILL.md); phone-number capture popups are [../cro/POPUPS.md](../cro/POPUPS.md); the phone field itself is [../../frontend/web-accessibility/PHONE-NUMBERS.md](../../frontend/web-accessibility/PHONE-NUMBERS.md).

| The job | Read |
|---|---|
| The intake questions, when SMS beats email, cost per send, copy structure, links, segments and encoding, voice, the source's benchmarks, A/B tests, the plan to return, common mistakes | [CHANNEL-AND-COPY.md](CHANNEL-AND-COPY.md) |
| Welcome, abandoned cart, browse, post-purchase, win-back, promotional, transactional, re-engagement, replenishment and VIP templates with timing, and segmentation rules | [SEQUENCES.md](SEQUENCES.md) |
| TCPA versus CTIA versus platform rules, written consent, the opt-in disclosure, FCC revocation and the one confirmation text, STOP/HELP replies, the footer, quiet hours, Do-Not-Call, SHAFT, other countries, no cold texting, the audit checklist | [COMPLIANCE.md](COMPLIANCE.md) |
| A2P 10DLC brand and campaign registration, fees, Trust Score throughput and T-Mobile caps, unregistered traffic, per-message price, number types, rejections, approval time | [REGISTRATION.md](REGISTRATION.md) |
| WhatsApp: when it beats SMS, the 24-hour window, template categories, opt-in, quality rating and messaging limits, formats, phone numbers, per-message pricing, click-to-WhatsApp ads, playbooks | [WHATSAPP.md](WHATSAPP.md) |

## The rules

1. **Send marketing texts only with prior express written consent** that names the seller and the number and says consent is not a condition of purchase (47 CFR 64.1200(a)(2), (f)(9)); a number given at checkout is not consent ([COMPLIANCE.md](COMPLIANCE.md#tcpa-consent)).
2. **Treat any reasonable wording as a revocation,** not only the seven per se keywords, honor it at once and never later than ten business days, and send one confirmation with no marketing (64.1200(a)(10), (a)(12); a 2026 FCC order lets senders designate an exclusive opt-out method once it takes effect: [COMPLIANCE.md](COMPLIANCE.md#revocation-fcc)).
3. **Put the brand name first and an opt-out instruction in every message** (the repo's OneSignal rule; the source's "quarterly" has no official source).
4. **Register the brand and every campaign before the first US 10DLC send,** keep sample messages identical to live sends, and plan volume from the Trust Score's MPS and T-Mobile's daily brand cap (Twilio; [REGISTRATION.md](REGISTRATION.md)).
5. **Keep promotional texts between 8 a.m. and 9 p.m. recipient-local** (64.1200(c)(1)), or the stricter state window, and honor Do-Not-Call for marketing texts ([COMPLIANCE.md](COMPLIANCE.md#quiet-hours-and-do-not-call)).
6. **Send by text only what can't wait 24 hours;** everything else goes by email [coreyhaines31/marketingskills, sms].
7. **Count segments before sending:** one emoji or accent turns a message into UCS-2 at 70 characters a segment ([CHANNEL-AND-COPY.md](CHANNEL-AND-COPY.md#length-and-segments)).
8. **One link per text on a branded or platform domain,** never a public shortener (OneSignal; [CHANNEL-AND-COPY.md](CHANNEL-AND-COPY.md#one-cta-one-link)).
9. **No discount in the first cart text,** double opt-in for US cart programs, and no urgency, hold or expiry claim that isn't true ([SEQUENCES.md](SEQUENCES.md#abandoned-cart)).
10. **On WhatsApp, use an approved marketing template outside the 24-hour window,** and never plan marketing templates to US numbers (Meta, as cited by the source; [WHATSAPP.md](WHATSAPP.md)).
11. **Never text people cold,** and label every benchmark as the source's figure, not a target ([COMPLIANCE.md](COMPLIANCE.md#no-cold-texting)).

## Prove it

- A plan opens with the compliance check (10DLC status, opt-in mechanism) and flags blockers before any strategy.
- Every flow names its trigger, delays, copy with character and segment counts, one CTA, and its exit conditions.
- Test replies of "STOP", "opt out" and "please stop texting me" each end marketing texts with one confirmation.
- The send schedule fits the campaign's MPS, the T-Mobile daily cap and the quiet-hours window.
- No figure in the plan is presented as a platform rule unless an official page in these files says it, and every file's own Prove it checks pass for the parts you touched.
