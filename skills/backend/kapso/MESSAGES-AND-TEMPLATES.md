# Messages, media and templates

Payload distinctions from [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-api-reference.md; references/templates-reference.md; references/whatsapp-cloud-api-js.md]. Consent, the customer-service window, categories and market policy have one definition in [WhatsApp marketing](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/WHATSAPP.md).

## Send and read

[gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/whatsapp-api-reference.md; references/whatsapp-cloud-api-js.md]

- Sends use `POST /meta/whatsapp/{version}/{phone_number_id}/messages`. Resolve the authorized number and recipient first. Treat a returned message ID as acknowledgement; inspect delivery status separately.
- The source covers text, media, voice, location, contacts, reactions, replies, read receipts, typing and interactive messages. Choose the exact schema for the requested type; a message body is not a template-creation payload.
- Interactive choices include reply buttons, lists, CTA URLs, Flow, product/catalog and contact-information request. For `request_contact_info`, both interactive.type and action.name are `request_contact_info`; include body and omit header/footer.
- Prefer the CLI's message list/get, conversation list and template list/get operations for discovery. Proxy history uses GET number messages/conversations; SDK entry points include messages.query/get, conversations.list/get and templates.get. Kapso history extensions are not generic Meta Cloud API capabilities.
- A reply uses the source message identity; reactions target a message, rather than becoming a new text reply. Preserve returned IDs and opaque cursors rather than constructing them from names.

## Template creation versus sending

[gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/templates-reference.md]

- Manage template definitions under the WABA business_account_id; send approved templates under phone_number_id. Creation uses language, not language_code, and includes the appropriate category/components.
- Named parameters use `parameter_format: "NAMED"` and `{{param_name}}`; supply creation examples for HEADER/BODY variables. At send time include parameter_name for named HEADER/BODY parameters.
- URL button variables belong at the end of the URL and use positional `{{1}}`; send a button component with sub_type url and its index. Do not interleave QUICK_REPLY buttons with URL/PHONE_NUMBER buttons. A REQUEST_CONTACT_INFO creation button omits text because WhatsApp supplies its label.
- Use the current endpoint schema for template edits. One supplied API reference said PUT while another reference/helper used POST; that unresolved method disagreement is not a maintained instruction here.

## Authentication corrections

- Use the [authentication-category policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/sms-marketing/WHATSAPP.md#template-categories) for identity OTPs. The supplied templates reference's UTILITY fallback for custom OTP text was wrong. [Meta template categorization](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization)
- Keep add_security_recommendation in BODY and code_expiration_minutes in FOOTER. The supplied authentication reference/asset incorrectly placed expiration in BODY. [Meta copy-code authentication templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/copy-code-button-authentication-templates)
- Meta's current copy-code examples use a send-time URL button subtype and allow optional button text. The Kapso authentication guide instead demonstrates otp and says text is removed; follow the linked Meta form and check the actual proxy/SDK schema before retaining code. [Meta copy-code authentication templates](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/copy-code-button-authentication-templates)

## Media identity

[gokapso/agent-skills, integrate-whatsapp/references/whatsapp-api-reference.md; references/templates-reference.md]

- Distinguish upload/send media IDs from the resumable-upload header handle used in a template's creation example. A normal message media upload does not supply that creation handle.
- Send-time media headers use either id or link, never both. Match the actual media type and current accepted MIME/size contract before upload, rather than turning the source's format matrix into permanent platform limits.
- Reading metadata, downloading content and deleting media are separate operations. Keep protected URLs/credentials out of diagnostics and preserve the authorized number's ownership.

## Prove it

[gokapso/agent-skills, integrate-whatsapp/SKILL.md; references/templates-reference.md]

Creation uses the WABA ID and examples; sending uses the number ID and approved language/components; named variables and button indices match the definition; media header handle versus send ID is explicit. A send or permission test occurs only within the user's authorized scope, and acknowledgement is not reported as delivery.
