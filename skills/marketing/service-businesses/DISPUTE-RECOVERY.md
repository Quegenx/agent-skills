# Managed dispute recovery

The managed-service workflow from [more skills, 09-chargeback-recovery.md]: a last-three-disputes pilot, per-client evidence rulebook, reviewed response packet, daily deadline queue and billing from actual recoveries. Use [DEMO-FIRST.md](DEMO-FIRST.md) for acquisition and [Stripe disputes](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/DISPUTES.md) for the Stripe response adapter.

## Offer, candidate and pilot

[more skills, 09-chargeback-recovery.md]

The author proposes a share of actual recovered funds and no charge for lost disputes. No percentage, partial-win billing rule or recovery-attribution agreement is supplied. Do not invent one or promise a win.

Target a chosen niche/city among furniture, home goods, boutiques, jewelry or online-order restaurants. The author's filters are rating at least 4.0, phone and website, with online shops first. The permitted candidate record includes name, address, phone, site, rating/review evidence, observed online-shop status and observed commerce platform: Shopify, Square, WooCommerce or other. Approval precedes demonstration production; these fields do not prove dispute pain.

For the free initial assessment, request the consenting store's last three disputes plus actual order details. A connected payment account is not required merely to assess that packet. Closed cases can be analyzed; only a still-open eligible case inside its actual response window can receive a response. Review the proposed action and attachments before any authorized submission.

## Client rulebook and judgments

[more skills, 09-chargeback-recovery.md]

Keep each client's dispute policy and account separate. Intake contains actual reason/category, order/payment facts, tracking, current customer messages, provider deadline and available issuer claim. Use evidence relevant to that reason, not a universal checklist that promises success.

Preserve the source's concrete candidate evidence, then select the provider's actual reason-specific requirements:

| Source category | Evidence packet and correction |
|---|---|
| Fraud or unrecognized card payment | Available address/CVV verification, delivery and actual product-use evidence. These are evidence candidates, not a guarantee the cardholder authorized the purchase. |
| Item not received | Carrier/tracking/delivery records and any actual signature. The source required billing-address delivery universally; Shopify's physical-product guidance instead checks the address supplied at checkout. |
| Not as described | Actual product page/photos at the time of sale and relevant customer messages. |
| Canceled or refunded | The source grouped checkout policy/assent together. Separate subscription cancellation records/terms from refund transaction records and credit-not-processed evidence. |

These corrections follow [Shopify's dispute-type guidance](https://help.shopify.com/en/manual/payments/chargebacks/chargeback-process); use the selected provider's actual category rather than merging categories into a universal winning checklist. [more skills, 09-chargeback-recovery.md; Shopify Help Center]

Retain four judgment outputs: fight/accept/gather more; low/medium/high assessed likelihood; evidence complete yes/no; and deadline risk yes/no. Compute the actual deadline/date arithmetic in code and apply existing [Jev gates](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md#the-rules).

The author's prepare-only gate is strictly above 0.8 and likelihood at least medium. Everything else, including equality, goes to review. It does not authorize submission. The guide does not define the likelihood rubric, which confidence field is compared, unknown handling or a complete rule combining the completeness/deadline answers. Resolve those inputs using [existing calibration](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/PRODUCTION.md); do not silently treat the source gate as a proven policy.

Keep the useful failure constraint: only list evidence that exists at submission. A future-only document cannot be required as if it were already available. Record the actual missing evidence and preserve gather-more as a real outcome.

## Response and demonstration artifacts

[more skills, 09-chargeback-recovery.md]

For a proposed challenge, prepare one short factual paragraph with order number, date, amount, product, payment and delivery details. Follow it with numbered evidence items, one line explaining what each shows, and the actual reviewable attachments: order confirmation/receipt, tracking capture, sale-time product page and relevant customer messages. Show the exact response and attachments together for approval.

The optional source connection exercise uses three supplied reason shapes: nonreceipt with recorded delivery, alleged fraud with address/CVV mismatch, and description dispute with an actual favorable post-delivery message. These are fixture shapes, not guaranteed verdicts or experiments already run.

The sales demonstration contains three synthetic reason-specific cases, evidence-present/absent checklist, action and named metric, plus the strongest proposed response. Mark synthetic data clearly, avoid real-brand fictional orders and offer a free assessment of the client's last three actual disputes. Do not call the sum would-have-won revenue. The source predicts wins and a recovered total; the bank decides, as [Stripe's response guide](https://docs.stripe.com/disputes/responding) explains. [Stripe dispute response documentation]

Use the shared [mail packet](DEMO-FIRST.md#prepare-the-mail-packet), retaining this source's three sample demo pages and three postcards, front screenshot with verdicts, factual invitation to inspect the assessment, QR and actual callback. An optional DM remains a human draft through a permitted channel. Visits do not establish a recent financial loss.

## Provider approval boundaries

For Stripe, final submission is a single opportunity and cannot be amended. Review the complete response before that action and follow the [Stripe adapter](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/DISPUTES.md). The source's generic dashboard-submission step omitted that finality. [https://docs.stripe.com/disputes/responding]

**Shopify is a separate adapter:** it automatically collects evidence and sends its response on the due date, even if the merchant adds nothing. Some network-resolution cases have no open response window. Its open/submitted/won/lost/resolved states and actual case due date govern work. Saving evidence is not proof that manual approval controls every submission. Resolve this platform behavior before promising the source's universal no-submission-without-approval invariant. [https://help.shopify.com/en/manual/payments/chargebacks/chargebacks-in-admin]

Shopify accepts PDF, JPEG and PNG, requires PDF/A and no PDF portfolios, fewer than 50 pages per PDF, at most 2 MB per file and 4 MB combined, with one file per evidence type. No audio/video, outside-resource links or requests to contact the merchant. Before early submission, the merchant can edit; early submission is final. These are Shopify-specific limits, not Stripe limits. [https://help.shopify.com/en/manual/payments/chargebacks/chargebacks-in-admin]

## Daily fulfillment and actual recovery statement

[more skills, 09-chargeback-recovery.md]

After signing and authorized account connection, review new disputes each morning, gather current actual evidence, apply the client's rulebook and present responses at least the agreed `[n]` days before the actual provider deadline. The guide supplies no value for `[n]`. A daily schedule does not guarantee every deadline is met.

Keep the review queue client-labelled. Record the exact approved response and actual platform outcome. Funds recovered return to the store; track actual returns and the provider-confirmed result rather than a model's prediction. At month end, operator and owner receive every dispute, outcome and actual recovery total; invoice only the agreed recoveries share. Partial outcomes and existing automated responses need explicit commercial treatment.

## Prove it

[more skills, 09-chargeback-recovery.md; official provider pages above]

Show the real pilot scope, per-client rulebook, reason-specific evidence, actual deadline and reviewer packet. Every attachment exists, every claimed result follows provider evidence, and no forecast is labelled recovered cash. Show how the chosen provider's submission behavior fits the actual approval contract, then reconcile the monthly statement and fee to store receipts and agreed terms.
