# WhatsApp

Where most customers live outside the US, WhatsApp often beats SMS for the same flows, but it runs on Meta's rules: free-form messages only inside a 24-hour window the customer opens, approved templates everywhere else, a charge on every marketing template, and a quality rating that shrinks how many people you may message when recipients block you. This file adapts the source's WhatsApp reference [coreyhaines31/marketingskills, sms, references/whatsapp.md], itself "Adapted from a contribution by @Inflimity (PR #516)". The source says its platform facts are "**as of 2026-10**" and cites the Meta pages listed under [Sources](#sources); this round did not re-fetch them, and "Meta changes pricing and limits often. Check the pricing page before quoting costs to a client." SMS consent law is in [COMPLIANCE.md](COMPLIANCE.md).

**Contents:** [When WhatsApp fits](#when-whatsapp-fits) · [App or platform](#app-or-platform) · [The 24-hour window](#the-24-hour-window) · [Template categories](#template-categories) · [Opt-in and opt-out](#opt-in-and-opt-out) · [Quality rating and limits](#quality-rating-and-limits) · [Formats and copy](#formats-and-copy) · [Phone numbers](#phone-numbers) · [Pricing](#pricing) · [Click-to-WhatsApp ads](#click-to-whatsapp-ads) · [Playbooks](#playbooks) · [Sources](#sources) · [Prove it](#prove-it)

Kapso implementation, onboarding, webhook, native form and Calling contracts are in [kapso](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/kapso/SKILL.md); this file remains the marketing-policy owner.

## When WhatsApp fits

| Situation | Better fit | Why |
|---|---|---|
| Customers mostly in LATAM, EMEA, India, SEA | **WhatsApp** | It's where conversations already happen |
| Customers mostly in the US | **SMS** | Meta's restriction covers +1 numbers with a US area code, not every +1 destination |
| Rich product messages (images, buttons, lists) | **WhatsApp** | Native interactive formats, no MMS surcharge |
| Two-way sales or support conversations | **WhatsApp** | Threaded chat, reply buttons, human handoff |
| Paid social is a major acquisition channel | **WhatsApp** | Click-to-WhatsApp ads open a free window |
| Simple one-way alerts, auth codes, US-heavy list | **SMS** | Simpler setup, universal reach |
| Multi-country program | **Both** | WhatsApp where adoption is high, SMS as fallback |

"Ask first: where are the customers? If more than half are in the US, WhatsApp marketing is a support or transactional layer at best until Meta lifts the US marketing restriction."

The source and this file formerly reduced that restriction to all +1 numbers. Meta specifies +1 together with a US area code; Canada and other +1 destinations must not be classified as US solely by country code. [Meta per-user marketing limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits)

## App or platform

- **WhatsApp Business app:** free, manual, one phone or a few linked devices; fine for a solo operator, not built for automation or large broadcasts.
- **WhatsApp Business Platform (Cloud API):** programmatic sending, templates, webhooks, automation, directly through Meta or through a Business Solution Provider (BSP). "All of them pass through Meta's per-message fees; most add a markup or platform fee on top." Pick a BSP by your existing stack, the markets you send to, and whether you need a no-code flow builder.

## The 24-hour window

- The window opens when the customer messages you and lasts 24 hours from their latest message; each new customer message resets it.
- Inside it you can send free-form messages (text, media, interactive buttons and lists) without pre-approval.
- Outside it only a **pre-approved template** goes out; free-form sends fail with error 131047 ("Re-engagement message").
- "A cart recovery message 1 hour after abandonment is almost always outside a window, so it must be an approved template."

## Template categories

| Category | What qualifies | Examples |
|---|---|---|
| **Marketing** | Anything promotional, awareness, or retargeting | Offers, launches, back-in-stock, **abandoned cart reminders**, re-engagement |
| **Utility** | Non-promotional AND specific to the user's request or account (or critical to them) | Order confirmation, shipping update, appointment reminder, billing notice |
| **Authentication** | One-time passcodes only, using Meta's pre-built formats | Login codes, verification codes |

- **Cart reminders are marketing,** even when the user asked to be reminded; Meta's guidelines list "You left {{items}} in your cart" as a retargeting example.
- **Mixed content becomes marketing:** an order update with a promo code, or a feedback survey with a discount.
- **Auto-recategorization:** since April 9, 2025, a template submitted as utility that Meta judges to be marketing is approved as marketing; Meta also re-reviews approved templates (usually with 1 day's notice, none for repeat misuse).
- **Appeals:** 60 days from creation or a category change.
- **Authentication templates** can't contain URLs, media or emojis.
- **Anatomy:** optional header (text, image, video, document), body with variables like `{{1}}`, optional footer (often the opt-out line), optional buttons (quick reply, URL, phone, copy-code). "Submit realistic sample values for every variable. Vague samples are a common rejection cause."

## Opt-in and opt-out

- **Meta requires opt-in** that clearly says the person will get messages from your business, and it must comply with local law (GDPR, LGPD, India's DPDP Act, TCPA). Meta allows a general business opt-in; the source calls naming WhatsApp "the safer practice", so do it.
- **Where to collect it:** a website form, a checkout checkbox, SMS, IVR, in person or inside a WhatsApp chat. Meta recommends separate opt-ins (or one that names the categories) for order updates versus offers.
- **Sample checkout opt-in** (unchecked by default):

> [ ] Send me order updates and offers from Acme on WhatsApp. You can opt out anytime.

- **Opt-out:** a quick reply button like `Stop promotions` on every marketing template, or a footer like "Reply STOP to opt out"; flag the person in your CRM at once and stop all marketing templates; send one confirmation ("You're unsubscribed from Acme offers. Reply START to rejoin."); keep the utility messages they opted in to separately.
- "If the only way to stop your messages is the Block button, people will block, and blocks drive your quality rating down."

## Quality rating and limits

- **Quality rating** per phone number, from the past 7 days of blocks, reports and their reasons ("Didn't sign up," "Spam," "No longer needed"): Green (High, eligible to scale), Yellow (Medium, warning), Red (Low, the number goes to **Flagged**). A Flagged number that recovers within 7 days keeps its limit; otherwise the **messaging limit drops one level**.
- **Templates have quality ratings too:** new or low-quality marketing and utility templates are **paced** (Meta holds part of a send to collect feedback); bad feedback **pauses** the template, and held messages fail.
- **Messaging limit:** unique users reachable with templates **outside** a service window in a rolling 24 hours, shared across the whole **business portfolio**, not per number.

| Tier | Unique users per 24h |
|---|---|
| Starting default | 250 |
| After verification or scaling | 2,000 |
| Next levels | 10,000, then 100,000, then unlimited |

- **250 to 2,000:** complete business verification, or deliver 2,000 high-quality template messages to unique users within 30 days. **Above 2,000:** automatic once you've used at least half the current limit in the last 7 days with high-quality messages; upgrades land within about 6 hours. Replies inside a service window don't count.
- **Per-user marketing cap:** Meta caps how many marketing templates one person receives from all businesses, based on their recent read rate; blocked sends return error 131049. Wait at least 24 hours before retrying. A marketing message inside an open service window doesn't count.
- **Warming up a new number** [source]: get business verification done first (Meta still approves or denies the increase after a quality review, so check the actual limit); send the first templates to recent, high-intent opt-ins (buyers from the last 30 days, people who messaged you); scale over 1 to 2 weeks while the number stays green; spread big sends over hours; watch block reasons in WhatsApp Manager after every campaign. This is ordinary pacing of consented sends, not a warmup network.

## Formats and copy

| Format | Limits | Best for |
|---|---|---|
| **Reply buttons** | Up to 3 buttons, 20 chars each | Yes/no, pick a path, opt-out |
| **List message** | Up to 10 rows across up to 10 sections, row titles 24 chars | Product categories, booking slots, qualification |
| **URL / call buttons** (templates) | Opens a link or starts a call | Checkout, tracking, support line |
| **Media header** | Image, video, or document | Product shots, drops, receipts |
| **Catalog / product messages** | Pulls from a Meta commerce catalog | Browsing and buying in chat |

Copy [source]: 1 to 3 short sentences per bubble (roughly under 60 words); buttons instead of raw URLs; `*bold*`, `_italic_` and line breaks work; one or two emojis are fine and, unlike SMS, don't change cost; name the brand in the first line of templates, since many users won't have your number saved.

## Phone numbers

Meta's Cloud API reference (https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers/): "We highly recommend that you include both the plus sign and country calling code"; "If the plus sign is omitted, your business phone number's country calling code is prepended"; and "Plus signs (`+`), hyphens (`-`), parenthesis (`(`,`)`), and spaces are supported in send message requests." Store numbers in E.164 and send them with the `+`. Never route a message or bill by the number's prefix: "The prefix in a mobile number reflects the **issuing** carrier, not the active SIM provider"; use an HLR or portability lookup for the live carrier [skills-il, israeli-phone-formatter] ([web-accessibility PHONE-NUMBERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/PHONE-NUMBERS.md#the-prefix-is-not-the-carrier)).

## Pricing

Per-message pricing since **July 1, 2025**: you pay per delivered message, at a rate set by category and the recipient's country code.

| Message type | How it's charged |
|---|---|
| **Marketing template** | Every delivery, inside or outside a service window |
| **Utility template** | Outside a window; inside an open window it was free from July 1, 2025 until **October 1, 2026**, when Meta began charging for it |
| **Authentication template** | Per delivery; check the current rate card for in-window treatment in your market |
| **Service message** (free-form reply) | Free from November 1, 2024. From **October 1, 2026**, each business phone number gets **1,000 free service messages a month** (no rollover), then a per-message charge at the market's utility/authentication rate, with no volume tiers |
| **Meta Business Agent** | Per token from August 1, 2026, about $2 per 1M tokens; never free |
| **Anything in a free entry point window** | Free (below) |

- **Volume tiers:** utility and authentication rates drop as monthly volume grows, per market across the portfolio, reset each calendar month. Marketing has no tiers, but the Marketing Messages API lets you set a max price per delivery.
- "Marketing is the most expensive category in every market, often several times the utility rate." Model cost per recovered order from Meta's (or your BSP's) rate card before launching a flow; a business case that assumed "replies are free" needs redoing after October 2026.

## Click-to-WhatsApp ads

- **Free entry point window:** when someone messages you from a CTWA ad or a Facebook Page call-to-action button and you reply within 24 hours, a window opens from your reply; Meta says it may stay open up to 7 days. While open, marketing, utility, authentication and service messages are free; Meta Business Agent messages are still charged. "Check the window's actual expiry in your delivery data rather than assuming the maximum."
- **How to use it** [source]: hook the ad on a reason to chat (a quiz, sizing help, a quote, a code to claim); pre-fill the first message ("Hi! I'd like my 15% welcome code."); reply fast with 2 to 3 qualifying reply buttons; convert or hand off while the window is open; ask for marketing opt-in in the chat. Ads themselves are in [paid-ads SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/paid-ads/SKILL.md).

## Playbooks

[coreyhaines31/marketingskills, sms, references/whatsapp.md]

### Abandoned cart recovery

- **Trigger:** 45 to 60 minutes after abandonment, only for contacts with WhatsApp marketing opt-in. **Type:** marketing template. **Exit:** purchase, opt-out or 48 hours. **Second touch** (optional, 24 hours): only if the first wasn't read or clicked; hold any discount until here.

```text
Header: [product image]
Body: Hi {{1}}, it's Acme. You left {{2}} in your cart. We're holding it for you, but stock is limited.
Footer: Reply STOP to opt out
Buttons: [URL: Finish checkout] [Quick reply: I have a question]
```

"We're holding it" and "stock is limited" go out only when both are true; false scarcity is in [offer-design FTC-PRICING-CLAIMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/offer-design/FTC-PRICING-CLAIMS.md). "I have a question" opens a service window; route it to the support handoff.

### Welcome (after opt-in or CTWA)

Immediately after opt-in or the first inbound message from an ad; free-form if the window is open, otherwise a marketing template.

```text
Hi {{1}}, welcome to Acme! Here's your code: WELCOME15. What are you shopping for today?
Buttons: [Skincare] [Haircare] [Just browsing]
```

Each button routes to 2 to 3 product picks with a checkout link; ask for marketing opt-in here if they came from an ad.

### Re-engagement

Opted-in customers with no purchase in 60 to 90 days; marketing template; 1 to 2 marketing sends a month to this segment ("More gets you blocks and per-user limit errors").

```text
Hi {{1}}, it's Acme. Your {{2}} usually runs out around now. Want us to set aside a refill?
Buttons: [Yes, reorder] [Not now] [Stop promotions]
```

"Not now" suppresses them for 30 days; "Stop promotions" opts them out.

### Support handoff

A help button, a keyword like "agent", or the bot failing to match twice; service messages (charged from October 1, 2026, so resolve in as few messages as you can).

```text
Got it. Connecting you with someone from our team. Typical reply time is under 10 minutes between 9am and 6pm.
```

Pass the cart or order context to the agent. Outside staffed hours, say when a person will reply and offer an FAQ list; past 24 hours, answering needs a utility template.

## Sources

As cited by the source, all accessed 2026-10:

- Pricing: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Service and utility pricing updates (Oct 2026): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages
- Messaging limits: https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits
- Phone number quality rating: https://www.facebook.com/business/help/896873687365001
- Template categorization: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization
- Template pacing: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-pacing
- Per-user marketing limits (incl. US restriction): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits/
- Opt-in: https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in
- Reply buttons: https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-reply-buttons-messages
- List messages: https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-list-messages
- Click-to-WhatsApp ads: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-whatsapp

## Prove it

- A cart reminder for a Brazil or Mexico shopper goes out as an approved **marketing** template unless an open service or free entry point window is shown in that customer's message history.
- Every recipient has an opt-in that names the business (and WhatsApp), and every marketing template has a `Stop promotions` button or a STOP footer.
- Cost estimates use per-message rates by category and country, never per-conversation pricing.
- No marketing template is scheduled to a +1 number with a US area code under the current US restriction; +1 alone is not a sufficient country classification. [Meta per-user marketing limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits)
- Before scaling, the number shows Green quality and the portfolio's current messaging limit covers the send.
