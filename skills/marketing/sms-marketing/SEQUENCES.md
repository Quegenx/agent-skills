# SMS sequences

Copy templates with timing and segmentation for each common flow, from the source's sequence templates [coreyhaines31/marketingskills, sms, references/sequence-templates.md]. The timings, caps and suppression windows are the source's opinion, not platform or legal rules. Three repo rules change how the templates go out: every message carries an opt-out instruction (the source shows it only on some; see [COMPLIANCE.md](COMPLIANCE.md#the-opt-out-footer)); US cart texts need double opt-in ([COMPLIANCE.md](COMPLIANCE.md#the-opt-in-disclosure)); and `[short.link]` means a branded or platform domain, never a public shortener ([CHANNEL-AND-COPY.md](CHANNEL-AND-COPY.md#one-cta-one-link)). Every urgency or expiry line ("selling fast", "expires tonight") goes out only when it is true; false scarcity and fake deadlines are in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md). Building these flows in OneSignal Journeys is in [onesignal JOURNEYS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/JOURNEYS.md).

**Contents:** [Welcome](#welcome) · [Abandoned cart](#abandoned-cart) · [Browse abandonment](#browse-abandonment) · [Post-purchase](#post-purchase) · [Win-back](#win-back) · [Promotional sends](#promotional-sends) · [Transactional](#transactional) · [Re-engagement](#re-engagement) · [Replenishment](#replenishment) · [VIP and loyalty](#vip-and-loyalty) · [Segmentation rules](#segmentation-rules) · [Prove it](#prove-it)

"Character counts shown assume GSM-7 encoding. Emojis force UCS-2 (70 chars/segment instead of 160). All templates use `[Brand]`, `[FirstName]`, and `[short.link]` as substitution tokens." The counts are the source's, before any added footer; recount after appending one.

## Welcome

Send 1, immediate (after opt-in):

```
From [Brand]: Welcome! Here's your 10% off code: WELCOME10. Shop now: [short.link]
Reply STOP to opt out, HELP for help. Msg & data rates may apply.
```
~155 chars / 1 segment (just). The source: "Footer required on first send." When this is also the CTIA opt-in confirmation, it must name the program, HELP, how to opt out, the frequency and fees ([COMPLIANCE.md](COMPLIANCE.md#the-opt-in-disclosure)); this version has no frequency line, so add one and recount.

Send 2, 24 hours later (optional):

```
From [Brand]: Don't forget your code WELCOME10 - expires in 48hrs. Top picks: [short.link]
```
~108 chars / 1 segment.

Send 3, 7 days later (optional, only if no purchase):

```
From [Brand]: Last chance for 10% off with WELCOME10. Expires tonight at midnight: [short.link]
```
~107 chars / 1 segment.

## Abandoned cart

The source calls it the "highest-ROI flow for ecom".

Send 1, 30 minutes after abandon:

```
From [Brand]: Hey [FirstName], you left something behind! Your cart's here: [short.link]
```
~95 chars / 1 segment.

Send 2, 4 hours after abandon (if no purchase):

```
From [Brand]: Items in your cart are selling fast. Reserved for you for 24hrs: [short.link]
```
~98 chars / 1 segment. Send it only when stock really is moving and the cart really is held for 24 hours.

Send 3, 24 hours after abandon (if no purchase, discount allowed):

```
From [Brand]: Still thinking? Here's 10% off to seal the deal: SAVE10. Shop: [short.link]
```
~99 chars / 1 segment.

- "Discount on Send 1 trains customers to abandon. Reserve for Send 2 or 3."
- "Exclude customers who abandoned <$X in cart value or repeat abandoners (gaming the discount)."
- "Stop sequence on purchase, opt-out, or 48 hours elapsed."

## Browse abandonment

Send 1, 1 hour after browse (single product or category):

```
From [Brand]: Still thinking about [product]? Take another look: [short.link]
```
~84 chars / 1 segment.

- "Trigger only after meaningful browse signal (3+ product views or 2+ min on product page)."
- "Exclude if a purchase happened on a different product."

## Post-purchase

Sends 1 to 3 are transactional; 4 and 5 need marketing consent.

Send 1, immediately after purchase:

```
From [Brand]: Order #12345 confirmed! We'll text shipping updates here. Track: [short.link]
```
~95 chars / 1 segment.

Send 2, day of shipment:

```
From [Brand]: Your order's on the way. Estimated delivery: [date]. Track: [short.link]
```
~92 chars / 1 segment.

Send 3, day of delivery:

```
From [Brand]: Your order should arrive today! Questions? Reply or visit [short.link]
```
~88 chars / 1 segment.

Send 4, 2 days after delivery (marketing consent required):

```
From [Brand]: How are you liking your [product]? Share a review for 15% off next order: [short.link]
```
~108 chars / 1 segment. The FTC's review rule bars incentives conditioned on the review "expressing a particular sentiment, whether positive or negative" (16 CFR 465.4). That does not authorize a platform-prohibited incentive: do not use this discount template for Google reviews, which prohibit review incentives regardless of sentiment. Follow the destination's rules in [review-management REVIEW-PROGRAMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/review-management/REVIEW-PROGRAMS.md). The old line mentioned only the FTC sentiment condition. [https://support.google.com/business/answer/16816815?hl=en]

Send 5, 14 days after delivery (cross-sell, marketing consent):

```
From [Brand]: Goes great with your [product]: [related-item]. 10% off bundle: [short.link]
```
~99 chars / 1 segment.

## Win-back

Send 1, 60 to 90 days after the last purchase:

```
From [Brand]: [FirstName], we miss you! Picks we think you'll love: [short.link]
```
~84 chars / 1 segment.

Send 2, 14 days later (if no purchase):

```
From [Brand]: Come back for 15% off your next order: COMEBACK15. Expires in 7 days: [short.link]
```
~106 chars / 1 segment.

Send 3, 14 days after Send 2 (final, if no purchase):

```
From [Brand]: Last chance - 20% off ends tonight: COMEBACK20. We'll stop texting if you'd rather: reply STOP. [short.link]
```
~130 chars / 1 segment.

- "After Send 3 with no engagement, suppress for 90 days minimum."
- "After two full win-back cycles with no engagement, sunset (remove from active list)."
- Win-back across SMS and email together is in [churn-prevention SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/churn-prevention/SKILL.md).

## Promotional sends

The source caps a campaign at 1 to 2 sends and stacks them against the email schedule "to avoid same-day double-tap".

Flash sale (single send):

```
From [Brand]: 24-HOUR FLASH: 25% off everything with FLASH25. Ends midnight: [short.link]
```
~94 chars / 1 segment.

Limited drop or launch:

```
From [Brand]: New drop just landed: [product-name]. Limited stock, members get early access: [short.link]
```
~115 chars / 1 segment.

Holiday or BFCM, Send 1 on launch day:

```
From [Brand]: Black Friday is LIVE - up to 50% off sitewide. Shop now: [short.link]
```
~92 chars / 1 segment.

Send 2, the same day or evening (expiration push):

```
From [Brand]: Last 6 hours of BFCM savings. Don't miss out: [short.link]
```
~73 chars / 1 segment.

## Transactional

Order updates, shipping, auth codes and account alerts are a separate compliance bucket: generally fine without marketing consent when tied to a transaction the user started [source]. Apply the actual [sender-type registration](REGISTRATION.md#what-registration-covers), which corrects the source's blanket US 10DLC requirement. [https://www.twilio.com/docs/messaging/compliance/a2p-10dlc] OneSignal wants a dedicated sender per program type ([onesignal EMAIL-AND-SMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/onesignal/EMAIL-AND-SMS.md#sms-model-and-setup)).

```
[Brand]: Order #12345 confirmed. Total $XX.XX. Track at [short.link]. Reply HELP for help.
```

```
[Brand]: Your order #12345 shipped! Track: [short.link]. ETA [date].
```

```
[Brand]: Order #12345 delivered. Enjoy! Issues? Reply or [support-link].
```

```
[Brand] verification code: 123456. Expires in 10 min. Do not share.
```

```
[Brand]: Sign-in from new device in [location]. Wasn't you? Secure: [short.link]
```

## Re-engagement

For SMS subscribers with no engagement with any send in 60+ days.

Send 1, soft reactivation:

```
From [Brand]: We've missed you, [FirstName]! Here's what's new: [short.link]
```
~80 chars / 1 segment.

Send 2, confirm interest (if no engagement):

```
From [Brand]: Want to keep hearing from us? Reply YES to stay on the list, or STOP to opt out.
```
~98 chars / 1 segment.

"After no reply: suppress for 60 days, then remove from active list. This protects opt-out rate metrics and reduces wasted spend."

## Replenishment

For products with predictable usage cycles (skincare, supplements, coffee, pet food).

Send 1, at the expected reorder window (e.g. 28 days for a 30-day supply):

```
From [Brand]: Running low on [product]? Reorder in one tap: [short.link]
```
~73 chars / 1 segment.

Send 2, 7 days later (if no purchase):

```
From [Brand]: Don't run out! 10% off your reorder of [product]: REFILL10 [short.link]
```
~92 chars / 1 segment.

## VIP and loyalty

"Higher frequency, exclusive offers, early access - different cadence rules apply but quiet hours and STOP still required."

```
From [Brand]: VIPs get the new drop 24hrs early. Yours now: [short.link]
```
~72 chars / 1 segment.

```
From [Brand]: You've reached Gold status! Your perks: 15% off + free shipping. [short.link]
```
~95 chars / 1 segment.

## Segmentation rules

[coreyhaines31/marketingskills, sms]

- Suppress customers in active sequences from promotional sends (no double-tap).
- Suppress opted-out subscribers from everything.
- Frequency cap: max 4 to 6 marketing sends a week per subscriber, lower for newer subscribers. Apply the source-qualified Florida/Oklahoma/Maryland three-text guidance and its limits from [COMPLIANCE.md](COMPLIANCE.md#onesignal-jurisdiction-guidance).
- Quiet hours: the source uses 9am to 8pm recipient-local, inside the federal 8 a.m. to 9 p.m. rule ([COMPLIANCE.md](COMPLIANCE.md#quiet-hours-and-do-not-call)).
- Cool-off: after a discount-driven purchase, suppress promotional sends for 14 days.

## Prove it

- A three-text cart sequence fires at 30 minutes, 4 hours and 24 hours, has no discount in Send 1, stops on purchase, opt-out or 48 hours, and reaches only double-opted-in US numbers.
- Every sent body starts with the brand, has one link on a branded or platform domain, ends with an opt-out instruction, and fits the segment count planned for it.
- No urgency, hold or expiry claim goes out that the store can't back with stock data or a real deadline.
- Review incentives don't depend on the rating given and are allowed by the destination platform; none are offered for Google reviews. [https://support.google.com/business/answer/16816815?hl=en]
