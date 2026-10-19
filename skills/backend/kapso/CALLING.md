# WhatsApp Calling

Calling integration from [gokapso/agent-skills, integrate-whatsapp-calling/SKILL.md; references/calling-api.md; references/providers.md], checked against [Kapso Calling](https://docs.kapso.ai/docs/whatsapp/calling/overview), [outbound calls](https://docs.kapso.ai/docs/whatsapp/calling/outbound-calls) and [TypeScript calls](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/calls).

## Identity and readiness

- Discover the Meta phone number in the authorized project, enable calls_enabled through its Platform API configuration and read back calling.status. Meta may reject activation; a successful configuration write does not prove Calling eligibility. Do not hardcode country/eligibility lists. [gokapso/agent-skills, integrate-whatsapp-calling/references/calling-api.md]
- Verify the phone-number Meta receiver and the application's calls subscription independently, using [WEBHOOKS.md](WEBHOOKS.md). The receiver secret_key is not the API key or Meta app secret. [gokapso/agent-skills, integrate-whatsapp-calling/references/calling-api.md]
- Signaling, media transport and the voice-agent provider are separate layers. Use a real generated SDP offer/answer; placeholder SDP and an HTTP success cannot establish working two-way audio. [gokapso/agent-skills, integrate-whatsapp-calling/SKILL.md; references/providers.md]

## Permissions and actions

[gokapso/agent-skills, integrate-whatsapp-calling/references/calling-api.md]

- Query `/meta/whatsapp/{version}/{phone_number_id}/call_permissions` for the actual user_wa_id or BSUID recipient; inspect start_call and send_call_permission_request rather than assuming a prior message grants a call.
- A permission request is its specific interactive action within the allowed messaging window, or the current approved template flow outside it. An ordinary quick-reply button is not a Calling grant. [Meta call permissions](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/user-call-permissions)
- Call actions use POST number calls with messaging_product whatsapp. Outbound connect has the recipient and an offer; preserve its returned Meta call ID and optional per-attempt callback identity. Inbound pre_accept and accept use the same real answer; pre_accept alone does not answer. Reject is for an unanswered inbound call; terminate ends the call.
- Preserve BSUID-only users when a phone is absent. Associate every item with project, metadata.phone_number_id and saved call state. Process every entry/change/item and deduplicate it, without confusing an item-delivery key with the per-call session lock.

## Provider and cleanup

[gokapso/agent-skills, integrate-whatsapp-calling/references/providers.md; integrate-whatsapp-calling/SKILL.md]

- Choose the actual provider bridge, such as Pipecat or ElevenLabs, rather than mixing their session/artifact APIs. Confirm WebRTC reachability and negotiated audio, including the required ICE/TURN path for that environment.
- Gate greeting and end-call timing on the documented accepted/media/provider state. A provider session, signaling acceptance and actual speech playback establish different facts.
- Release only the resources owned by this call. Keep failed call actions and cleanup failures visible; an artifact-completion event must not start a new agent or revive terminated media work.
- Do not blindly redial after an ambiguous connect result. Inspect exact state/history using the saved attempt and call identities. General uncertain-write policy remains in [third-party-integrations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/SKILL.md).

## Saved history

[gokapso/agent-skills, integrate-whatsapp-calling/references/calling-api.md]

- Exact proxy history lookup uses call_id with the number scope; an unknown/out-of-scope ID returns empty data, and SDK calls.get can return undefined. History can lag delivery, so it is not live-call state.
- Meta call_id identifies signaling. The history row's id is the saved local UUID used for detail/artifacts. Stored direction values USER_INITIATED/BUSINESS_INITIATED and legacy INBOUND/OUTBOUND are not interchangeable filter aliases.
- Proxy history/SDK get do not expose artifacts. Use [CALL-ARTIFACTS.md](CALL-ARTIFACTS.md); check deployed support before relying on a newer filter or wrapper.

## Prove it

[gokapso/agent-skills, integrate-whatsapp-calling/SKILL.md]

The authorized recipient has the required grant; inbound/outbound SDP roles are correct; accepted signaling and media readiness are separately observed; every batch item is scoped; ambiguous outcomes cannot auto-redial. A real-call claim needs authorized live evidence of two-way audio, termination and owned-resource cleanup.
