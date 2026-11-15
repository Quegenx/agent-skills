# Verify the external contract before depending on it

Use this when a client library, endpoint, executable or parsed document may behave differently from the contract the code assumes. The supplied Verifying External Behavior and Sibling Sweep skills add exact-call probes and a class-based search to the existing [debugging workflow](SKILL.md). Run only authorized probes; use [VERIFICATION.md](VERIFICATION.md) for evidence limits and verdicts. [wdm0006/python-skills, verifying-external-behavior; kajisho5/ffmpeg-skill, .claude/skills/sibling-sweep/SKILL.md]

## Probe the request that actually leaves the client

[wdm0006/python-skills, verifying-external-behavior, Probe the exact call; Permissive clients; Per-endpoint docs; The response shape]

- Use the exact endpoint form, dependency version and argument spelling the implementation will use. A nearby documented example does not establish that call's behavior.
- Inspect the outbound request at the transport boundary when a client forwards arbitrary parameters. A misspelled selector may be ignored and return plausible default data instead of raising an error. Confirm that the intended selector exists and reaches the service under its documented name.
- Check collection and item forms independently before writing status-specific handling. Keep an unobserved defensive branch labeled as defensive, alongside the response actually observed.
- Inspect a real response element's fields before designing a fast path around them. A summary object can omit the fields a full-entity check expects, turning the supposed fallback into an enrichment request for every item.
- Preserve the command or procedure, observed output, version and date. Redact credentials and sensitive records before retaining the receipt. A surprising upstream result is evidence to record, not a number to tune away without testing the explanation.

Use the provider owner's [call and response rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md). This file verifies an assumed upstream contract; it does not replace retry, idempotency, credential or tenant policy.

## Validate the evidence path

[wdm0006/python-skills, verifying-external-behavior, A fake proves your code calls the fake; Dry-runs skip the step that fails]

A fake and its caller may agree because both encode the same mistaken assumption. The [integration evidence owner](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#independent-evidence) distinguishes fake, boundary and actual-provider evidence. Where authorized, apply the relevant assertions to the real dependency as well. Captured real parser input can reveal whitespace, structure or native-value differences that hand-written fixtures omit.

For a cheap check or dry run, identify the step it omits. Resolution does not establish a build, and a planned call does not establish its external effect. When the decisive operation cannot run, report that missing observation rather than label the contract verified.

## Sweep the demonstrated failure class

[kajisho5/ffmpeg-skill, .claude/skills/sibling-sweep/SKILL.md, The loop; What a sweep is not]

State the failure class without naming the first affected tool. Then enumerate the dimensions that can carry it: input property, shared transformation, alternate path with the same meaning, units or conventions, dependency version and returned claim. Vary those dimensions rather than checking only the reported caller.

Use the [integration fixture checks](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#independent-evidence) to establish the generated input before interpreting its result. Review each differing result against the current contract and decision records; a documented refusal is not automatically a sibling bug.

A sweep comparing result metadata can miss wrong output with a healthy result document. If the defect concerns the artifact or side effect, inspect those outputs on every relevant path, including matching metadata rows. Report unsupported entry points and excluded cases. Fix a shared cause at its common owner; keep separately caused defects outside the repair unless their scope is authorized.

Record the class, inspected paths and dimensions, actual observations and the disposition of each candidate. A declaration that no siblings exist needs that search scope and evidence. Do not import the source's sweep helper or automatically file issues.

## Inject only the failure being investigated

[wdm0006/python-skills, writing-defect-reports, Pick the narrowest injection point]

Target the smallest boundary that reaches the intended recovery path. A global hook can fail an earlier operation and reproduce a different bug. Afterward, confirm that the intended boundary was reached and the failure occurred there. If a harness captures logging, missing console output alone does not establish that the path never ran; inspect an authorized observation outside that capture.

Test fixture checks remain in the [integration owner](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/INTEGRATION.md#independent-evidence); keep temporary instrumentation isolated and remove it after the investigation.

## Prove it

[wdm0006/python-skills, verifying-external-behavior, Checklist; kajisho5/ffmpeg-skill, .claude/skills/sibling-sweep/SKILL.md]

Name the exact upstream call and version, the outbound selector and observed response shape or status, the dated receipt and any unobserved defensive handling. Distinguish fake, planned and real-provider evidence. Account for the failure class's relevant paths, actual fixture properties, artifact checks and exclusions. An unauthorized or unavailable probe remains unperformed.
