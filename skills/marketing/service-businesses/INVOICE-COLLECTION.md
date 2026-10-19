# Invoice collection service

The results-based invoice service from [more skills, 08-overdue-invoice-collection.md]. Preserve the client rulebook, exception handling, first-batch pilot, daily review and actual-recovery statement together. Shared demonstration acquisition is [DEMO-FIRST.md](DEMO-FIRST.md); judgment mechanics belong to [jev-decisions](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md).

## Offer, qualification and client intake

[more skills, 08-overdue-invoice-collection.md]

The source proposes an authorized free pilot, no upfront charge and a share of what is recovered; no recovery means no provider fee. Debtor payments go directly to the creditor's account. The owner later pays the provider from the actual-recovery statement. The source gives no percentage, attribution agreement or treatment of partial payments, refunds and chargebacks; resolve them before billing.

Choose a trade that actually bills after work, such as plumbing, HVAC, electrical, roofing, landscaping or cleaning, rather than a pay-at-counter business. The author suggests one trade/city first, rating at least 4.0, at least ten reviews, phone and website. Use permitted evidence, not a retained Maps export. The reviewable list contains name, address, phone, website, rating and review count where permitted.

The initial real-client export contains customer, amount, invoice date and email, with notes/replies about disputes or promised payments. Those fields alone do not establish due date, actual overdue age or current payment state. Reconcile authoritative accounting records and terms before queueing contact. Client account, authorized sender and client-specific policy stay associated with every invoice and review entry.

**Identity correction:** the source sends in the owner's name as though that alone settles identity. For an independent collector, determine actual role, jurisdiction and duties first. The [CFPB scope guidance](https://www.consumerfinance.gov/ask-cfpb/what-laws-limit-what-debt-collectors-can-say-or-do-en-329/) distinguishes consumer debt, business debt, original creditors and state law; [Regulation F identity/disclosure rules](https://www.consumerfinance.gov/rules-policy/regulations/1006/18/) prohibit misleading identity and require applicable collector disclosures. Authorized first-party correspondence is not automatically prohibited, but client approval does not erase these duties. [CFPB]

## Write the client's rulebook

[more skills, 08-overdue-invoice-collection.md]

Keep a base policy and an approved copy per client. The source's example timing and exceptions are:

| Condition | Source-proposed treatment |
|---|---|
| Seven days overdue | First reminder |
| 21 days overdue | Second reminder |
| 45 days overdue | Firm notice |
| 60 days overdue | Human call |
| Disputed invoice | Hold collection contact |
| Promised payment date not passed | Hold reminders |
| Payment plan | Hold this reminder flow |
| Amount below $50 | Exclude from this policy |
| Already paid | Never chase |
| Same customer contacted within seven days | No second contact |
| Customer asks what the invoice is for | Answer the question before resuming reminder decisions |

These are author business rules, not legal safe harbors or calibrated defaults. A client may choose a call at 30 days or remove calls altogether. Compute exact amounts, dates, authoritative paid state and cooldowns in code; use the model only for judgments such as the meaning of an actual reply, following [the existing code/judgment boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/SKILL.md#the-rules). [more skills, 08-overdue-invoice-collection.md; jev-decisions/SKILL.md]

Preserve the distinction between pausing collection and answering a service question. The author's failure case stopped an invoice when the customer asked what it covered, leaving the question unanswered. Add observed failures to the policy and retain the real reply history rather than treating stop as permanent silence.

Retaining that client history does not mean sending the entire archive to the classifier. Supply only the decision-relevant evidence under the existing [Jev privacy boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/PRODUCTION.md#jev-inside-a-product). [jev-decisions/PRODUCTION.md]

## Decision record and review boundary

[more skills, 08-overdue-invoice-collection.md]

For each invoice, retain five judgments:

1. Proposed action: reminder one, reminder two, firm notice, call or stop.
2. Whether the customer disputed it.
3. Whether a promised payment is still pending.
4. Whether evidence indicates it may already be paid, alongside authoritative record state.
5. Tone: friendly, firm or neutral.

The author's proposed bars are a stop strictly above 0.8 taking precedence, other actions only strictly above 0.8, everything else for review, and a separate possible-paid hold even at 0.5. Equality at 0.8 reaches review under the source's everything-else rule. These are illustrative asymmetric gates; use the existing [calibration and named output metric](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/jev-decisions/PRODUCTION.md), not an assertion that 0.8 proves correctness.

**Approval difference:** the prose suggests reviewing every first-batch message and later only uncertain cases. Its full prompt instead reviews every decision/message and preserves approval until explicitly changed. Keep that explicit approval boundary. A completed pilot or high score does not grant autonomous customer contact. Exact API form and shared source corrections are in [SKILL.md](SKILL.md).

## Communication packet and demonstration

[more skills, 08-overdue-invoice-collection.md]

Prepare four artifacts in the authorized business voice: short friendly first reminder, polite second-stage reminder, factual firm notice asking for payment or a reply by a stated date, and a short human call script. Each uses actual invoice number, amount, job date, job description and authorized payment link. An ignore-if-paid sentence is not payment reconciliation. Replies return to that invoice's history before its next decision.

The source's optional connection exercise has three supplied case shapes: ten days overdue/no reminders, 25 days/one reminder, and 30 days/customer promise still pending. It checks connection/output shape, not accuracy. No exercise is run merely by documenting it.

For the sales demonstration, the author proposes ten synthetic invoices 15 to 60 days overdue, including pending-promise, dispute and invoice-question cases. Show customer, amount, overdue age, proposed action and named metric; stopped reasons; the top three draft messages; and a computed total. Prominently label the fixtures synthetic without using a real prospect's brand. The call to action offers a free assessment of the client's 20 oldest unpaid invoices.

Use the [shared mail packet](DEMO-FIRST.md#prepare-the-mail-packet), with three sample demo pages and three postcards for approval. The front shows the invoice decision list; the back offers to inspect what the system would draft, with the correct preview QR and actual callback. Optional follow-up uses the shared lawful channel boundary, not inferred scan consent.

## Pilot, daily operation and billing

[more skills, 08-overdue-invoice-collection.md]

After actual owner acceptance, obtain the authorized oldest-invoice export and history, apply that client's approved rulebook, and review every decision/draft before contact. Use only the correctly authorized sender. Never import the source's anecdotal accuracy or cost results as evidence this implementation works.

For ongoing work, connect the authorized invoicing source and review overdue invoices every morning, including current payments and new replies. Confirmed-paid items leave the queue. Loop by client with client-labelled review items; exact synchronization/write permissions remain provider implementation inputs.

At month end, send operator and owner a statement listing invoices actually paid after this work, the actual total received and the agreed provider share. Keep that attribution description distinct from proof the reminder caused payment. Bill from the agreed actual-recovery basis, not the mock demo total or merely sent reminders. The guide does not define disputed attribution or partial-payment terms.

## Prove it

[more skills, 08-overdue-invoice-collection.md]

Show client role/authority, due-date and paid-state evidence, the approved policy copy, complete reply history and deterministic cooldown checks. Demonstrate the hold-versus-answer distinction and equality/possible-paid review branches in the documented decision record. Show exact approval for actual sends and a monthly statement reconciled to creditor receipts and agreed fee terms. Fixture output and author anecdotes are not represented as live collection results.
