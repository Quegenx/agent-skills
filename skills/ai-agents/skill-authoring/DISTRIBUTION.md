# Sharing and composing skills

One of the biggest benefits of skills is sharing them with the rest of your team. There are two ways: check them into the repo, or publish them as plugins in a Claude Code plugin marketplace. The right one depends on team size and how much context the checked-in skills cost; skills can then build on each other by name.

## Repo or marketplace

- **Checked into the repo:** put skills under `./.claude/skills`. For smaller teams working across relatively few repos, this works well.
- **Every checked-in skill costs context:** each one adds a little to the context of the model.
- **A plugin marketplace at scale:** make a **plugin** and run a Claude Code [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) where users upload and install plugins. It lets the team decide which skills to install, and can include a setup flow.
- **Repo skills travel to cloud sessions; personal ones don't:** in a cloud session, `CLAUDE.md`, rules, skills, agents and commands come along with the repository, while your `~/.claude` stays on your laptop. Move what the team needs into the repository: commit skills and commands under `.claude/`.

## Running a marketplace

- **No central gatekeeper:** the Claude Code team has no central team deciding which skills go in; it tries to find the most useful skills organically.
- **Sandbox first:** someone with a skill they want people to try uploads it to a sandbox folder in GitHub and points people to it in Slack or other forums.
- **Promote on traction:** once a skill has gotten traction (the skill owner decides when), the owner opens a PR to move it into the marketplace.

## Composing skills

- **Reference other skills by name:** you may want skills that depend on each other, such as a file upload skill and a CSV generation skill that makes a CSV and uploads it. Dependency management is not built into marketplaces or skills yet, but you can reference other skills by name, and the model invokes them if they are installed.
- **Workflow skills lean on others:** business-process skills may depend on other skills or MCPs, and CI/CD skills may reference other skills to collect data.

## Prove it

Shared skills live under `./.claude/skills` in the repo or in a marketplace plugin, never only in one person's `~/.claude`; a skill that depends on another names it; a skill promoted to the marketplace has had a trial from a sandbox folder first.
