# Respond to a Stripe dispute

Provider mechanics from Stripe's [response guide](https://docs.stripe.com/disputes/responding) and [category guidelines](https://docs.stripe.com/disputes/categories), checked while reviewing [more skills, 09-chargeback-recovery.md]. The paid recovery service, client rulebook, review queue and actual-recovery billing belong once in [the service guide](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/service-businesses/DISPUTE-RECOVERY.md). Read-only account reporting remains in [OPERATIONS.md](OPERATIONS.md#disputes-and-refunds).

## Identify the actual case and deadline

[https://docs.stripe.com/disputes/responding]

1. Read the dispute's actual category, product type, available issuer complaint and response deadline. Requirements differ by category; use the current case rather than a fixed response window invented from the service's daily schedule.
2. Distinguish an inquiry from a formal chargeback. An inquiry is a pre-dispute stage; if it escalates, respond again to the formal dispute. The source described every customer dispute as an immediate chargeback.
3. For an inquiry, submit the relevant evidence; accepting it does not resolve it. For a formal dispute, decide whether the evidence supports accepting or challenging the actual claim. Keep customer communications as evidence where relevant. The issuing bank determines the outcome; a model verdict is not a win or a recovered amount.
4. Present the complete response and attachments for the authorized review before final submission. Saving or preparing a draft is distinct from sending the final response.

## Assemble evidence for this category

[https://docs.stripe.com/disputes/categories; https://docs.stripe.com/disputes/responding]

- Read the current category's defense guidance and address the actual cardholder complaint. Use existing order, payment, policy, fulfillment and communication records; never list a document the merchant does not have.
- Match the product type. Physical-product evidence can establish possession; digital products/services use evidence such as usage, login or download; offline-service policies can be material. The source's generic delivery-to-billing-address and combined canceled/refunded checklist is not a universal category rule.
- State the facts succinctly and explain what each attachment establishes. Organize files by their Dashboard evidence label or API field rather than one undifferentiated bundle.
- Upload one file per evidence type; combine multiple items of the same type into a single multi-page file. Stripe's combined evidence-file limit is **4.5 MB**, and Mastercard evidence has a combined maximum of **19 pages**.
- Include the actual evidence in the submission. Banks do not review external links, audio/video, or requests to call or email for additional information. A tracking URL alone is not the submitted tracking evidence.
- Where Stripe pre-populates required Visa CE 3.0 evidence, do not edit it casually and risk eligibility; add required missing information through the documented form.

## Treat final submission as final

[https://docs.stripe.com/disputes/responding]

Stripe immediately forwards the submitted response and supporting files to the issuer. There is one opportunity: the response cannot be edited and further files cannot be added afterwards. Complete the evidence review before acknowledging finality and submitting. The source's approval step is useful, but it did not explain this irreversible provider boundary.

Follow the actual status after submission. A closed `won` dispute records a bank decision and returned disputed funds; `lost` records the opposite. Reconcile actual outcomes under the existing [account-operation contract](OPERATIONS.md), without treating preparation, a likelihood estimate or a predicted total as cash recovered.

## Keep the Shopify boundary separate

Shopify's automatic due-date submission, early-submission finality, network-resolution exceptions and distinct file limits are defined in [the service guide's provider boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/service-businesses/DISPUTE-RECOVERY.md#provider-approval-boundaries); do not substitute Stripe's submission controls. [https://help.shopify.com/en/manual/payments/chargebacks/chargebacks-in-admin]

## Prove it

[https://docs.stripe.com/disputes/responding; more skills, 09-chargeback-recovery.md]

- The case record identifies the merchant, category, actual deadline and inquiry/chargeback stage.
- Every asserted fact and attachment exists, addresses the actual complaint and fits the selected provider's format/size requirements.
- Final submission follows a review of the complete package, with no promise to amend it afterwards.
- The outcome report distinguishes prepared, submitted, under review, actually won/lost and actually returned funds. A model recommendation is never reported as recovery.
- A Shopify case names its automatic due-date behavior rather than promising operator-only submission. Report any unrun provider operation as unverified.
