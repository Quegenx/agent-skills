# Firebase AI Logic

From [firebase/agent-skills, firebase-ai-logic-basics/SKILL.md; references/usage_patterns_web.md; references/flutter_setup.md].

## Provision before calling

[Firebase AI Logic setup](https://firebase.google.com/docs/ai-logic/get-started)

- Select the project, registered web/Flutter app and Gemini API provider. Client config files alone do not provision the service.
- If a request reports missing genai configuration, check that the provider setup was completed; recently provisioned configuration can take time to propagate. [Official error codes](https://firebase.google.com/docs/ai-logic/error-codes)
- Read supported model names and installed SDK types for the chosen provider. Do not copy retired model IDs or assume the same model supports every modality.
- The source prefers Gemini Developer API unless the application requires the other provider. Keep that as source advice, not a universal provider requirement. [firebase/agent-skills, firebase-ai-logic-basics/SKILL.md]

## Choose the response workflow

[firebase/agent-skills, firebase-ai-logic-basics/SKILL.md; references/usage_patterns_web.md; references/flutter_setup.md]

- Use a one-shot generation for one response, a chat session for conversation history and streaming for partial response display.
- Supply the actual MIME type and supported input representation for multimodal content. Check provider/model limits before choosing inline versus referenced media.
- Use the model's supported schema configuration for structured output. Generic extraction and validation discipline belongs in [AI features](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/ai-features/SKILL.md).
- Treat image generation, search grounding and hybrid/on-device inference as capability-specific branches. Do not infer cross-platform availability from one native example.
- Remote Config can select a supported model without a client-code release; keep safe local defaults and review the actual template. See [REMOTE-CONFIG.md](REMOTE-CONFIG.md).

## Attestation and development credentials

[Firebase App Check for AI Logic](https://firebase.google.com/docs/ai-logic/app-check)

- Configure the platform's App Check provider and applicable enforcement. Attestation and user authorization address different boundaries.
- Use documented debug providers for supported local development; debug tokens are private credentials, never public source or hardcoded fixtures.
- Limited-use token support is SDK-version-specific. Check the installed platform API before configuring it.
- The source's attestation protection is not a guarantee that every unauthorized request is impossible. Keep actual enforcement and provider limitations explicit.
- Do not import the source's unverified TTS/audio recipes, numerical latency promises or native-only setup.

## Prove it

The provider is provisioned in the intended project, model and modalities match the installed SDK, streamed/chat state has the intended lifecycle, and debug credentials remain private. Unsupported capabilities are reported rather than replaced with invented code. [firebase/agent-skills, firebase-ai-logic-basics/SKILL.md]
