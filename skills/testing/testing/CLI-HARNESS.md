# Interactive terminal verification

Use this to investigate an interactive CLI or TUI, its prompts, keyboard behavior, startup, hangs or memory growth. Source: [cursor/plugins, control-cli, SKILL.md]. Reuse the repository's existing harness before introducing a temporary terminal driver; a persistent new dependency or harness needs the task's authorization.

## Drive the visible session

[cursor/plugins, control-cli, SKILL.md]

1. Identify the exact command, runtime and smallest workspace that reproduces the behavior. Inspect package scripts, terminal tests, demo recorders and existing PTY helpers first.
2. Launch an isolated session with known environment values only when execution is authorized. Keep temporary harness material outside the repository unless adding a reusable harness is requested.
3. Capture the current terminal screen before sending input. Send one action, then wait for a concrete prompt or screen pattern before the next action.
4. Exercise the relevant text, Enter, arrows, Escape, interrupt and resize behavior. Keep input deterministic and avoid credentials or destructive commands.
5. Save the transcript and relevant profile artifacts. Clean up the session, temporary directories and processes you started; retain artifacts only when requested.

The source offers tmux, a PTY driver, the runtime inspector and a terminal recorder as alternatives. Prefer installed tools and the repository's own script; no supplied Python driver or new package is required by this guide. [cursor/plugins, control-cli, SKILL.md]

## Inspector environment correction

The source sets `NODE_OPTIONS` on the tmux client process and assumes the child CLI receives it. tmux's server/session environment controls new child processes; setting a client variable alone is unreliable when the server already exists. Pass session environment explicitly through the documented `new-session -e` mechanism when adapting an authorized harness. [cursor/plugins, control-cli, SKILL.md], [tmux manual](https://github.com/tmux/tmux/blob/master/tmux.1)

Node's inspector supports a loopback host and port zero to select an available port. Read the actual startup output for its endpoint; do not assume a fixed port. [Node CLI inspector documentation](https://nodejs.org/api/cli.html#--inspecthostport)

## Capture evidence for the question

[cursor/plugins, control-cli, SKILL.md]

| Question | Capture |
| --- | --- |
| Startup regression | Baseline and changed startup timings on the same machine, environment and command |
| Slow operation | A CPU profile around the operation, with top self-time functions |
| Memory growth | Comparable heap snapshots around repeated operations, using garbage collection consistently when available |
| Hang | Current screen, active resources and a stack or CPU sample before interruption |
| Prompt or keyboard regression | Before/after transcripts and the exact action sequence |

Wait for readiness evidence rather than a fixed sleep. If the available harness forces a delay, state why and keep that limitation visible. Broader experimental verdicts and controlled comparisons belong to [debugging verification](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/VERIFICATION.md). [cursor/plugins, control-cli, SKILL.md]

## Prove it

[cursor/plugins, control-cli, SKILL.md]

The record identifies the command, workspace, environment and input sequence; captures precede actions; every wait names its readiness condition; comparison inputs match; and the report lists the actual artifacts, unrun checks and cleanup of owned sessions and processes.
