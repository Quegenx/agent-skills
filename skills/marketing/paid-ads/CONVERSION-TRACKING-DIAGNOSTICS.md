# Conversion tracking diagnostics

Trace a business outcome from its actual success signal to the destination, keeping installation, firing, arrival and attribution separate. From [coreyhaines31/marketingskills, conversion-tracking, SKILL.md and references/audit-playbook.md]. Platform installation and shared event IDs stay in [CONVERSION-TRACKING-WEB.md](CONVERSION-TRACKING-WEB.md); scoring stays in [AUDIT-GUARDRAILS.md](AUDIT-GUARDRAILS.md#audit-scoring).

## Define the outcome and senders

[coreyhaines31/marketingskills, conversion-tracking, SKILL.md and references/audit-playbook.md]

- Read `.agents/product-context.md` and establish the confirmed business action, entry points and destinations. For a lead, inspect the actual accepted-submission signal; for a purchase, use the confirmed order record. A click, native submit event or reachable thank-you URL alone does not establish success.
- Inventory browser tags, server senders, native integrations and CRM imports before adding another sender. For one action, record event name, destination, identifier and deduplication relationship. Check value, currency, tax and shipping treatment, and where refunds are reflected.
- Compare the exact event the application emits with the trigger's predicate, including firing and blocking conditions. A correctly named tag can still be blocked or wait for an event the application never emits.

## Gather evidence in layers

[coreyhaines31/marketingskills, conversion-tracking, references/audit-playbook.md]

1. Read the actual landing, conversion and confirmation surfaces and available published container. Distinguish a base tag from a conversion event. With code access, inspect the success branch of each relevant form or checkout handler.
2. Record the limits of static inspection. A published container does not establish unpublished or paused configuration, complete custom-template behavior or server-side coverage. Browser absence does not prove no server or native sender exists. A clean static read does not clear the audit.
3. Trace the click identifier through landing URLs, redirects, permitted storage and conversion payload. A fabricated identifier tests transport only; it cannot demonstrate attribution to a real ad click. Check actual persistence before prescribing a missing linker or extra tag.
4. Observe the real success signal, tag firing and outgoing request separately. Then inspect destination diagnostics for arrival and deduplication. A fired tag is not proof of arrival; arrival is not proof a campaign received credit.
5. Compare like windows and definitions before explaining dashboard differences. Name the next account, container or real-click check when the available evidence cannot resolve the issue.

Consent configuration follows the existing [Google consent owner](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/google-analytics/CONSENT-MODE.md). The source playbook says `gcs=G100` means a conversion is discarded or modeled; do not use that parameter alone as a verdict. Basic and advanced consent behavior differ, and advanced consent mode can send cookieless pings when storage consent is denied. [Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)

## Report the actual verification state

[coreyhaines31/marketingskills, conversion-tracking, SKILL.md and references/audit-playbook.md]

- Mark each finding observed, reported or inferred, with its exact evidence. Use Pass, Fail, Unknown or Not applicable; unknown reduces evidence coverage rather than health. Include what works and what could not be checked.
- Separate settings changes, client changes and structural limitations. State what was built, where it is installed, what firing was observed, what arrival was confirmed and what remains pending. Give each pending item a named check and handoff instead of declaring completion.
- Review live publishing and real conversion actions under the existing [live-account authorization rule](SKILL.md#the-rules). Do not send a real lead or order merely to satisfy a verification checklist.

## Prove it

For each retained conversion, the evidence identifies its confirmed action, sender inventory, exact trigger, payload and deduplication relationship. A synthetic identifier is reported only as a transport check. Installed, firing, arrived and attributed are separate claims, and every unobserved stage has a named pending check. [coreyhaines31/marketingskills, conversion-tracking, references/audit-playbook.md]
