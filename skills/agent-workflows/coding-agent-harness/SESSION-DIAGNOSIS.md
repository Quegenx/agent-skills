# Diagnosing an agent session

Explain an expensive, repetitive or drifting run from its recorded evidence. Source: [obra/superpowers, diagnosing-superpowers], especially session-discovery, context-safety, analyst prompts, case/report templates and redaction-policy. This is a read-only investigation of the session; [code-research](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md) owns source proof and [agent-harness CONTEXT-COSTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/CONTEXT-COSTS.md) owns savings claims.

## Identify the case

[obra/superpowers, diagnosing-superpowers/SKILL.md and references/session-discovery.md]

- State the session, relevant turn range, expected and observed behavior, and the observable that matters: time, tokens, repetitions or an unexpected action. A scoped request can already provide this; ask only for identifying or scope facts that remain missing.
- Resolve the actual session using exposed history tools, configured storage or observed documentation. Confirm its ID, working directory, timestamps and matching conversation content; recency alone does not identify it.
- Enumerate associated workers and distinguish their transcripts from the parent. Pass exact paths or exposed session IDs to analysts; a worker's current session is its own.
- Record sources, relevant ranges, rejected plausible candidates and why, unavailable history and whether the session was still running at the read time. Leave original session files unchanged.

## Establish record meanings before totals

[obra/superpowers, diagnosing-superpowers/references/session-discovery.md, references/context-safety.md and templates/case.md]

- Measure file and record sizes before reading. A single transcript record can be huge: locate relevant records first, extract bounded fields, and narrow an oversized field again rather than printing the entire record.
- Establish which records are human prompts, injected instructions, parent dispatches, tool calls and results, usage and compaction. A worker's user-role message can be the parent's task, not the human's words.
- Pair calls with their actual results. Determine units, timestamp boundaries and whether counters are incremental or cumulative before calculating; an absent observation is unknown, not zero.
- Label environment and skill information as historical evidence, captured snapshot, current observation or unknown. A current version or mtime does not prove the historical version, and a captured skill body does not authenticate every installed file.
- Record these meanings once for all analysts. Follow the repository's discovery tools rather than copying a transcript command written for another host.

## Inspect the dimensions that answer the case

[obra/superpowers, diagnosing-superpowers/prompts/analyst-common.md and the seven dimension prompts]

| Dimension | Evidence to connect |
|---|---|
| Skills | Human request, then an evidenced invocation, skill read or attribution; matched triggers and late or missing invocations stay observations |
| Plan adherence | Agreed plan steps against actual actions, including skipped, invented or silently changed steps |
| Repeated work | Same tool and target across repeated reads, searches, commands or dispatches, with intervening changes checked |
| Stumbles | Errors, denials, retries, reverted edits, corrections and the later recovery or unresolved result |
| Quality evidence | Completion claims against actual results, acceptance checks and the response to review feedback |
| Request conflicts | Incompatible human constraints or loaded instructions, both quoted, plus the resolution actually taken |
| Cost and time | Supported per-turn/session totals, large tool results, compactions and the events dominating the recorded window |

- Read the reported region yourself, then split independent dimensions or long ranges when delegation is justified. Use [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) for packets and merge checks. The source always runs seven analysts; the scoped question and agreed budget decide the work here. [obra/superpowers, diagnosing-superpowers/SKILL.md; bgauryy/octocode, octocode-subagent/references/spawn-gate.md]
- Every finding carries the exact record location, a short supporting excerpt, affected turns, confidence and checked coverage. Drop unsupported findings; report none found with the range actually examined. [obra/superpowers, diagnosing-superpowers/prompts/analyst-common.md]
- For repetitions, check whether a file changed, the user corrected the task or compaction intervened. Re-reading an edited file is not the same finding as re-reading unchanged evidence. [obra/superpowers, diagnosing-superpowers/prompts/repeated-work.md]
- Mark compactions, resumes, aborts and dispatches between the plan and its execution. Cite the first divergence if drift follows one of them; timing alone does not prove cause. [obra/superpowers, diagnosing-superpowers/prompts/plan-adherence.md]
- Explain only what the transcript supports. A slow interval without activity evidence is not automatically model work or human waiting; a skill's involvement does not establish that the skill is defective. [obra/superpowers, diagnosing-superpowers/prompts/cost-and-time.md and templates/report.md]

## Write a report that can be checked

[obra/superpowers, diagnosing-superpowers/templates/report.md and templates/case.md]

- Lead with the supported verdict and confidence, then the case, environment provenance, sessions examined, human-turn timeline, findings and coverage gaps.
- State unexamined ranges, unavailable features and checks that would change the conclusion. Keep tool behavior, human instructions and analyst interpretation separate.
- When comparing another session, define a signature of observable markers. Each marker is hit, miss within checked scope, or unknown for a missing field; do not turn one matching symptom into full equivalence. [obra/superpowers, diagnosing-superpowers/prompts/similar-session.md]

## A shareable copy

[obra/superpowers, diagnosing-superpowers/references/redaction-policy.md, prompts/scrub.md and prompts/scrub-audit.md]

- Package session data only within the user's sharing scope. Work on copies; replace secrets, people, account identifiers, private hosts/repositories and proprietary terms with consistent placeholders across all files.
- Preserve safe record identity, relationships and original line markers so findings remain checkable. Mark substitutions in quotations as redactions; if scrubbing removes support, report that finding's evidence limit instead of retaining the private value.
- Audit every exported file, including quoted content, metadata and attachments. The scrub log records placeholder category and count, never a plaintext replacement map.
- Keep privacy and evidence reviews separate. A clean privacy audit does not prove that exported findings still have support. Show the file list and scrub log before an authorized archive or sharing action, and state that the user must review the copy because scrubbing can miss information.

## Prove it

[obra/superpowers, diagnosing-superpowers/templates/report.md, templates/case.md and prompts/scrub-audit.md]

- Session identity, source meanings and examined ranges are evidenced, including the difference between the human and a parent-agent dispatch.
- Totals use supported counters and units, and absent records do not become zero.
- Findings cite the exact record and what it proves; repeats and drift include intervening events.
- Original history is untouched. Any exported copy passes both the privacy audit and a separate check that its remaining evidence still supports the findings.
