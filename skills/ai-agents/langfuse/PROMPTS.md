# Prompt management

Source: [langfuse/skills, langfuse, references/prompt-migration.md and prompt-engineering.md], with the current [JS/TS prompt-management documentation](https://langfuse.com/docs/prompt-management/get-started). Prompt quality and causal changes remain in the existing [fix loop](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md).

## Inventory the callers

[langfuse/skills, langfuse, references/prompt-migration.md]

- Find the actual prompt callers, their text or chat shape, variables, model settings and fallback behavior before migrating.
- Separate prompt content from application logic. Keep complex templating and conditional behavior in application code rather than pretending simple variable substitution implements it.
- Compose shared prompt parts only where there is actual reuse.
- Preserve the original inputs and rendered prompt when comparing the migrated caller. Changing storage is a different change from rewriting its instructions.

## Compile and deploy

[https://langfuse.com/docs/prompt-management/get-started]

- Use the current JS/TS prompt-management client, `@langfuse/client`, for the installed version. Tracing packages are a separate integration.
- Match text prompts, chat prompts and message placeholders to their documented compile contract. Variables use double braces; do not translate Python compile examples into guessed TypeScript calls.
- Select a prompt version or deployment label deliberately. Preserve version/label identity in the evaluation record and link the fetched prompt to its trace.
- Check the actual rendered messages, variable values and settings at the caller boundary before moving the production label.

## Improvement boundary

[langfuse/skills, langfuse, references/prompt-engineering.md]

Diagnose an observed failure class before editing the prompt, make an attributable change and compare it under the same evaluation contract. Do not import the source's broad GPT-versus-Claude prompting table or promise a universal prompting improvement. Generic method: [agent-evals FIX-LOOP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md).

## Prove it

Every migrated caller retains its intended text/chat shape, required variables and application-owned conditions; the rendered prompt matches the reviewed version; the trace identifies that prompt; and a label move has a verified comparison and a way back.
