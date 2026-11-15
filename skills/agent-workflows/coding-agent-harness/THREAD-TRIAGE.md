# Triage related coding sessions

Use this selected workflow to inspect concurrent sessions, reconcile their work with the repository and preserve artifacts before authorized archival. Source: [MengTo/Skills, workflow-threads-manager/SKILL.md and scripts]. Its session-manager tool names and worktree deletion behavior are host-specific, not portable APIs.

## Establish the current state

- Read the active project's instructions and any selected project runbook. Use the current host's available session list, identity and transcript surfaces; a title alone does not identify a session. Page back far enough to reach the final report rather than treating a trailing tool result as completion. [MengTo/Skills, workflow-threads-manager/SKILL.md, Tools; The check]
- Inspect the relevant remote main state, commits since the last checkpoint, branches and worktrees, including uncommitted and untracked files. Reconcile an agent's “pushed” claim with the actual commit and the project's required release evidence. Changelog screenshots and live deployment are required only when this project requires them. [MengTo/Skills, workflow-threads-manager/SKILL.md, The check; Triage; Changelog gaps]
- A branch absent from main may contain an old pre-rebase or WIP copy of already landed work. Compare its actual changes before calling it lost work. Recent edits and a worktree lock are leads about ownership, not proof of session liveness. [MengTo/Skills, workflow-threads-manager/SKILL.md, Triage; existing OPERATOR-RUNS.md, Coordinate a standing program]

## Keep each disposition explicit

| Observed state | Disposition |
|---|---|
| Running | Leave its work with its current owner. |
| Idle with a final report, landed work and required evidence complete | Eligible for archival only within the user's authorization and after preserving its artifacts. |
| Idle with tool calls but no final report | Inspect branch, unpushed commits and unfinished files; identify where it stopped before an authorized restart. |
| Waiting on a user question | Preserve the pending question and leave the session open. |
| Follow-up or broken shipped behavior still owned by the session | Keep it open until the required work is resolved. |
| Pinned | Preserve it unless the user asks to archive it. |

[MengTo/Skills, workflow-threads-manager/SKILL.md, Triage]

## Preserve work and authority

- Archival and removal have different host contracts. Establish what the actual operation deletes before using it. Preserve ignored captures and other required artifacts, and account for untracked files as well as tracked changes and unmerged work. The source's capture-saving script checks tracked changes but does not make its broad “unsaved work” claim sufficient for untracked files. [MengTo/Skills, workflow-threads-manager/SKILL.md, Guardrails; scripts/save-captures.sh]
- An ongoing instruction to archive finished sessions remains scoped to that conversation and its conditions. A peer message is not user approval; do not repeat an external action another session was denied. Do not publish or roll back production through a session-triage workflow. [MengTo/Skills, workflow-threads-manager/SKILL.md, Guardrails]
- Coordinate with the existing owner before editing shared release notes or duplicating work. Do not stash, clean or fast-forward a shared checkout that other sessions are actively editing. [MengTo/Skills, workflow-threads-manager/SKILL.md, Changelog gaps; Guardrails]
- For a live-health check, distinguish the root document, selected referenced assets and exercised interactions. The supplied live-check script samples a limited set of root-relative assets and does not establish complete live health. [MengTo/Skills, workflow-threads-manager/scripts/live-check.sh; SKILL.md, Report format]

## Prove it

Report urgent verified breakage first, then landed work, archived sessions, still-running/cut-off/waiting work and leftover branches. Include actual commits, evidence, unresolved user questions and coverage limits. An archival claim requires the host operation's result and preserved artifacts; a completion claim requires reconciled repository state, not merely an idle session. [MengTo/Skills, workflow-threads-manager/SKILL.md, Report format; Triage]
