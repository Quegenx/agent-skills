# Connection and recovery

From [morluto/rea, reverse-engineer-anything/references/connection-and-recovery.md]. Read this only for an observed connection, provider or command blocker.

## Diagnose the actual layer

[morluto/rea, reverse-engineer-anything/SKILL.md; references/connection-and-recovery.md]

- Available tools with no stale-registration evidence: proceed to the selected target. Do not run setup before every investigation.
- No tools: inspect registration. A skill installation alone supplies instructions; it does not connect the running agent.
- Missing, malformed or stale registration: prepare a scoped setup plan.
- Aligned registration without tools: reconnect/restart the client and inspect its launch error if tools remain absent. A doctor result cannot prove the current session is connected.
- Provider unavailable: inspect that operation's availability and diagnostics. Static JS analysis does not need a native decompiler. Continue useful supported work without changing the target.
- Launcher/PATH/runtime failure: inspect the actual command environment. Do not repeat registration repair for a shell-path problem.
- Client-policy rejection: preserve the client's actual authority boundary; an advertised tool does not grant approval.

## Review the concrete repair

[morluto/rea, reverse-engineer-anything/references/connection-and-recovery.md]

- Prefer an existing installed REA tool surface or CLI. Package acquisition through npx may download files and populate caches.
- Inspect the installed CLI help and current supported clients rather than copying a static client list from repository main.
- A setup dry-run describes the proposed registration paths, backups and bundled-skill replacement. Apply that exact scope only when authorized.
- Setup does not install unrelated Node/npm, package managers, Java or analysis engines. A separate missing provider is a separate problem.
- After an authorized repair, reconnect, confirm tools actually appear and resume the original task. Repeated setup is not a diagnosis.
- Unsupported clients can use a version-pinned manual registration or an authorized CLI route. Do not rewrite effects as read-only to bypass a client rejection.

## CLI evidence

[morluto/rea, reverse-engineer-anything/references/connection-and-recovery.md]

- A static JS CLI analysis accepts the user-supplied ASAR or extracted tree without MCP registration or a native engine.
- Save complete JSON to an authorized output path before projecting a summary or module view. Large complete output need not be loaded into context.
- A shell observation is shell evidence; only actual REA output is REA Evidence. A CLI fallback does not establish that MCP registration works.
- Native-only providers and prerequisite installation are outside this skill's JS/web scope.

## Prove it

The blocker is attributed to registration, connection, host policy, launcher or provider using observed evidence; repair paths and effects match the approved scope; the original investigation resumes after successful recovery. [morluto/rea, reverse-engineer-anything/references/connection-and-recovery.md]
