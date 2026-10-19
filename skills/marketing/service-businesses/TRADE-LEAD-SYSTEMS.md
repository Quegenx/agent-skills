# Trade enquiry and photo services

Missed-call intake, eligible local-demand alerts and honest job-photo delivery, paraphrased from [more skills, 20-trades-lead-systems.md]. Shared acquisition/approval is [DEMO-FIRST.md](DEMO-FIRST.md); the fixed-message rescue below does not require an LLM. Community observation is owned by [DEMAND-ALERTS.md](DEMAND-ALERTS.md), and job-photo fidelity by [marketing-images REAL-PHOTO-EDITING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#finished-trade-work).

## Offer order and qualification

[more skills, 20-trades-lead-systems.md]

The author proposes missed-call rescue first, current local-intent capture second, job photographs third. All capture and hand over; they do not claim qualifications, issue quotes or commit the trade to arrival/callback times. Do not turn missed-call counts, sparse photos or a personal-looking business name into evidence of lost jobs or known staffing.

Research the selected trade and town. The prose suggests rating at least 4.7, 10 to about 300 reviews and fewer than 8 actual photographs. Its detailed classifier instead rejects rating below 4.7, fewer than 10 or more than 500 reviews, missing phone and apparent national franchises. Choose the review ceiling explicitly; the source's seven-review example contradicts its minimum. Preserve existing [franchise-authority checks](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LOCAL-SMB.md#common-mistakes), [website cross-checks](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/LOCAL-SMB.md#website-status) and [photo-sample limits](FOOD-VISUALS.md#qualification-and-routing).

The proposed classifier records decision, reason, rating, review_count, photo_count, thin_proof, likely_sole_trader, has_website, lead_with and a neutral opening_line. Its author routing is missed_call for the sole-operator hypothesis, photos for non-solo with thin proof, intent for an owned site plus at least 8 photos. It leaves non-solo/no-owned-site/adequate-photo cases unresolved and supplies no complete unknown branch. Do not infer sole status from a name/address or invent a default offer.

## Missed-call service contract

[more skills, 20-trades-lead-systems.md]

The original business number stays with the owner. Conditional forwarding should activate only when an inbound call is unanswered, with ordinary answered calls untouched. The source proposes forwarding after four or five rings, a six-second answering message and caller acknowledgement about ten seconds later. These are author targets, not verified carrier behavior or a deployed SLA. Check actual number/forwarding availability before promising the service.

Use owner-approved fixed messages:

| Recipient | Required information and limits |
|---|---|
| Caller | Identify the business, acknowledge missed contact, ask what is happening and roughly where, and capture an urgency marker for human attention. No price, qualification, attendance time, callback window, same-day visit, invented current activity or unauthorized callback promise. |
| Owner | Caller number and time, acknowledgement state and the agreed daily-call-count meaning. The source says the caller has been called rather than has called; resolve which metric is intended. |

Match the actual business voice, including singular language for a one-person business. No marketing link, booking link, review request, upsell or automatic chase. The source's once-only acknowledgement is bounded further by its no-second-message-to-the-same-number-that-day acceptance rule. Keep owner-requested do-not-text entries from day one, including personal/trade/merchant contacts; suppress withheld/non-textable numbers and apply the source's mobile guard. Do not fire on outbound unanswered calls.

The original caller template says the operator is on a job, while its own rules forbid invented circumstances; it also promises a callback immediately after work despite forbidding callback windows. Keep these as source errors, not approved text. Urgency is an intake flag, not emergency coverage or an unapproved commitment.

## Consent and channel boundary

Twilio requires prior express consent for informational messages, clear sender identification and initial opt-out language; its inbound-message exchange exception is not blanket permission to text anyone who made a voice call. The source instead called a non-promotional missed-call response generally lawful and omitted initial opt-out wording. Do not activate the recipe until the actual consent/provider setup is established. [Twilio Messaging Policy](https://www.twilio.com/en-us/legal/messaging-policy)

The existing [SMS compliance owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/COMPLIANCE.md) retains jurisdiction, revocation and required-message rules. WhatsApp adaptation follows [sms-marketing WHATSAPP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/WHATSAPP.md#opt-in-and-opt-out) and [Kapso](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/kapso/SKILL.md); an unanswered voice call is not evidence of the customer-message service window. The source's direct channel substitution does not establish opt-in or a deployable integration. [more skills, 20-trades-lead-systems.md]

## Intent and photo extensions

[more skills, 20-trades-lead-systems.md]

- For eligible public/authorized community requests, alert the trade and draft a useful contextual reply for the actual operator to send only where permitted. Do not automate group posting. The complete research/digest contract stays in [DEMAND-ALERTS.md](DEMAND-ALERTS.md).
- Existing listing visibility belongs to [local SEO](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LOCAL.md). A problem-and-town page with useful explanation, phone and text action is the author's contact-page sketch, not a ranking guarantee or permission for near-duplicate doorway pages; apply [seo PAGES-AT-SCALE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/PAGES-AT-SCALE.md).
- Take authorized camera-roll images of actual finished work, request actual pre-work photos where available, and return a coherent pair/set using the [workmanship-preservation branch](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-images/REAL-PHOTO-EDITING.md#finished-trade-work). Presentation edits must not improve faulty workmanship. Sell the reviewed output, not a claim that a prompt guarantees fidelity.

## Sales conversation and commercial terms

[more skills, 20-trades-lead-systems.md]

The call-opening brief accepts trade, business name, checked rating/review information and actual offer. Under 40 spoken words: identify yourself, say you will be brief, ask one question about their own missed calls and stop. No criticism or marketing/AI/platform jargon. If busy, ask when to call back and end. Draft two labelled one-sentence responses: cost without an invented figure, and low missed-call volume without arguing. A free setup/leave-running promise requires the provider's actual commercial choice, not a generated commitment.

The author proposes one flat monthly fee per trade, month-to-month, cancel anytime, free first setup and about a fortnight of visible results. Continuing it free after non-purchase is an optional provider-funded commitment, not negligible-cost evidence or authorization to spend. Photo work is a separate recurring batch offer; resolve monthly versus per-batch wording before quoting. No money price is given. Provide a monthly recovery summary so the owner sees actual activity rather than relying on dashboard visits; do not call every acknowledgement a recovered booking.

## Prove it

[more skills, 20-trades-lead-systems.md]

Before a future authorized launch, the author's acceptance brief calls for 15 trials from different phones: answered calls and outbound misses do nothing; acknowledgement meets the chosen target; same-number/day duplicates are suppressed; withheld/non-textable and do-not-text cases are excluded; no time/price/qualification is promised; and the owner approved the exact words in writing. Consent, identity and opt-out requirements must also pass the provider/jurisdiction gate. The fortnight pilot names who monitors replies and pays ongoing costs; monthly reports distinguish calls/messages from confirmed work. The author reports no live number, missed-call run or rescue text, so this is an unbuilt service contract rather than proven production behavior.
