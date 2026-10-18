# Native recordings and transcripts

Per-call opt-in, late completion and protected retrieval from [gokapso/agent-skills, integrate-whatsapp-calling/references/native-artifacts.md], checked against [Kapso recordings and transcripts](https://docs.kapso.ai/docs/whatsapp/calling/recordings-and-transcripts). No dated free-price or rollout guarantee is retained.

## Opt in and correlate

[gokapso/agent-skills, integrate-whatsapp-calling/references/native-artifacts.md]

- Recording and transcription are independent opt-ins on outbound connect or inbound accept, never pre_accept. Each enabled object requires status, purpose and announcement_language; choose the real authorized purpose/language. Recording does not imply transcription, or vice versa.
- Meta announces capture to participants. Preserve accepted/media-readiness gates; announcement or HTTP success is not proof of complete captured audio. Confirm actual number/deployment eligibility.
- Signed completion items arrive in value.calls[]: call_recording_available supplies call_recording.audio; call_transcript_available and call_transcription_available are aliases for the same transcript completion, using call_transcript.document.
- Correlate project, phone metadata and Meta call ID with saved state; retain BSUID identities. Late artifact events survive media cleanup without relaunching an agent. A placeholder saved from metadata alone does not prove pickup, billing or a conversation.

## Correct IDs and hosts

[gokapso/agent-skills, integrate-whatsapp-calling/references/native-artifacts.md]

- The protected `/api/v1/whatsapp_calls` routes use `https://app.kapso.ai` with project X-API-Key. The WhatsApp proxy at api.kapso.ai/meta/whatsapp is a different surface.
- List saved calls by whatsapp_config_id, using the number's Kapso internal_id/configuration UUID, not its Meta phone ID. Follow page/per_page and Link pagination; an incorrect ID can yield HTTP 200 with empty data.
- Match returned call_id to the desired Meta call, then use the row's local id for `/api/v1/whatsapp_calls/:id`, `:id/artifacts/recording` and `:id/artifacts/transcription`. Lists/proxy exact lookup do not contain artifact content; do not fetch media for every growing list row.
- Detail exposes data.artifacts.recording/transcription. Absent means no notification received; available is metadata within the estimated window, not proof download works; expired retains metadata without a fetch path. Use only the stored owner's protected fetch_path.

## Retrieval and limits

[Kapso recordings and transcripts](https://docs.kapso.ai/docs/whatsapp/calling/recordings-and-transcripts)

- Recording fetch returns native audio, inline by default, with download=true for attachment. The documented cap is 32 MiB; Range is unsupported.
- Transcript preview returns a data envelope with available/empty state, text, language, duration, segments and truncated. Times use seconds. Render plain text; an empty valid result does not trigger retranscription.
- Preview caps text at 100,000 characters, segments at 500 and aggregate segment text at 100,000 characters; word arrays/extra provider fields are omitted. download=true exports original provider JSON bytes; original input/export is capped at 2 MiB.
- Estimated expiry uses the earlier positive event timestamp/first receipt plus seven days, with receipt fallback for invalid times. Replay does not extend it; media may disappear earlier. Authorization, owner credential, current URL resolution, HTTPS attachment host/path, redirect rejection, MIME/size/SHA-256 checks and private/no-store handling remain part of retrieval.
- Keep tokens, protected URLs, audio and transcript content out of diagnostic logs. A permanent archive requires separately authorized storage; no source example grants that retention scope.

## Prove it

[gokapso/agent-skills, integrate-whatsapp-calling/references/native-artifacts.md]

Evidence separates opt-in, audible announcement, two-way media, termination, signed late completion, saved UUID/detail, recording playback, transcript preview and original export. Availability metadata is not reported as successful retrieval, and a failed fetch does not invent a new saved lifecycle state.
