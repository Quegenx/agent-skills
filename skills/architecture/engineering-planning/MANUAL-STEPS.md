# Human-only procedures

Matt Pocock's wizard scopes a guided procedure around actions only the human can perform. Retain that interaction method without importing the source shell library, dotenv serializer or platform lifecycle helpers. [mattpocock/skills, wizard/SKILL.md, wizard/template.sh]

## Scope the procedure

[mattpocock/skills, wizard/SKILL.md]

- Read the relevant configuration, documented environment values and current/target state before asking the human to repeat facts already available.
- Automate steps the agent can perform within authorization; reserve the guided procedure for the human's access, judgment or manual interaction.
- Name the stages in dependency order. For every captured value, identify its origin, destination and whether it is secret. Some stages perform an action without producing a value.
- Resolve material changes to stage order, captured data or irreversible actions before carrying them out. Existing authorization still governs routine steps already agreed.

## Make each stage concrete

[mattpocock/skills, wizard/SKILL.md]

- Check current official instructions or the actual interface. Give the exact page, action and destination needed; say when the current route is unknown instead of inventing a dashboard path.
- Open or present the relevant URL before requesting the value shown there. Keep one focused task visible at a time and show progress through the procedure.
- Capture secrets through hidden entry, keep them out of transcripts and summaries, and write values only to their agreed destination.
- Seek confirmation before an irreversible stage when it is not already specifically authorized. A progress prompt is not a substitute for understanding the consequence.

## Verify and retain

[mattpocock/skills, wizard/SKILL.md, wizard/template.sh]

Trace every required value from its source through capture to the intended destination. Check that public and secret values use the correct handling, and that instructions and stage counts match the actual procedure. Do not run a human-interactive procedure unattended. The source treats one-off guides as temporary; retain a repeatable guide only when the user wants it and link its documented entry point.

The source's shell serializer uses shell quote concatenation inside dotenv values. [Node's official dotenv value rules](https://nodejs.org/api/environment_variables.html#variable-values) define quoted values as text; [the parser](https://github.com/nodejs/node/blob/main/src/node_dotenv.cc) takes the text between matching quotes. That source serializer is not imported here. Reuse a documented destination-specific writer instead of assuming shell quoting is a storage format. [mattpocock/skills, wizard/template.sh:141-146]

## Prove it

[mattpocock/skills, wizard/SKILL.md]

Every stage requires the human for a stated reason and follows verified instructions. Each captured value has a known origin, secrecy classification and destination. Secret values stay out of output, irreversible stages have the required authorization, and the completion report states which actions were actually performed.
