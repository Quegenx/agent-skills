# Coding-agent completion instructions

The completion prompt below comes from the existing agent-harness PROMPT.md. It addresses a coding agent reporting runnable work as complete; product-agent prompt measurement, caching and reminder placement remain in [agent-harness PROMPT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/PROMPT.md). [existing agent-harness, PROMPT.md, The base prompt]

## Coding-agent completion

- **A coding agent that reports changes as done** without test or build output (more likely at low effort) gets this paragraph:
  ```text
  When you change code that can be run, built, or type-checked, run a real
  check that exercises the change before reporting it done: the project's
  tests, type-checker, or build, or the changed command itself. A syntax-only
  check, or a check command that failed to start, does not count; if all
  that is missing is the project's declared dependencies, install them with
  its own package manager and lockfile (e.g. npm install, pip
  install -r requirements.txt), never via sudo or the system package manager,
  unless told not to. Only if no real check can run here, say which one you
  did not run and why instead of reporting the change as done.
  ```

## Prove it

Completion claims identify the actual check and result, or the check that could not run and why. The prompt does not expand the project's existing execution or dependency-installation authorization. [existing agent-harness, PROMPT.md, coding-agent completion paragraph; owner AGENTS.md]
