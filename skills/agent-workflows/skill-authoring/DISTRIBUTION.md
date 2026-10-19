# Sharing and composing skills

One of the biggest benefits of skills is sharing them with the rest of your team. Within a team there are two ways: check them into the repo, or publish them as plugins in a Claude Code plugin marketplace. The right one depends on team size and how much context the checked-in skills cost; skills can then build on each other by name.

## Repo or marketplace

- **Checked into the repo:** put skills under `./.claude/skills`. For smaller teams working across relatively few repos, this works well.
- **Every checked-in skill costs context:** each one adds a little to the context of the model.
- **A plugin marketplace at scale:** make a **plugin** and run a Claude Code [plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) where users upload and install plugins. It lets the team decide which skills to install, and can include a setup flow.
- **Repo skills travel to cloud sessions; personal ones don't:** in a cloud session, `CLAUDE.md`, rules, skills, agents and commands come along with the repository, while your `~/.claude` stays on your laptop. Move what the team needs into the repository: commit skills and commands under `.claude/`.

## Beyond the team

- **A public registry:** with skills.sh, "once a skill is written, it can be distributed and installed without being rewritten for each agent." Installs concentrate: "375 skills, or 0.04% of the registry, account for 62% of installs", while nearly half of all skills were installed exactly once ([State of agent skills](https://vercel.com/blog/state-of-agent-skills)).
- **One public URL for agents that can't read the repo:** for reports, proposals and one-off pages Vercel needed "a single public URL that anyone can point their agents at, regardless of the environment they run in." [vercel.com/design.md](https://vercel.com/design.md) is an Agent Skill with a trigger-style description, and its assets resolve from wherever it was opened: "Resolve assets/vercel-brand.css from this skill's location. If the skill was opened from a URL, resolve the asset against that original URL."
- **An uploaded ZIP for Claude:** "Ensure the folder name matches your skill's name. Create a ZIP file of the folder. The ZIP should contain the skill folder as its root (not a subfolder)" ([How to create custom skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)). Inspect the finished archive, not only the working directory, and report an upload as untested until it has run on the target account [coreyhaines31/marketingskills, lead-magnets].
- **A skill handed to an audience:** "an email gate is not a technical redistribution control"; measure downloads apart from activation, "do not add hidden tracking to the skill", and publish an owner, version and known limitations. The whole workflow for a course or podcast archive is in [CONTENT-TO-SKILL.md](CONTENT-TO-SKILL.md) [coreyhaines31/marketingskills, lead-magnets].
- **Carry the context the repo gave it:** a skill moved out of its repo loses the components and shipped examples around it; see [WRITING.md](WRITING.md).

## Inside the package

A library can ship its skills and docs inside the package users install, so they version with it. c15t generates `packages/*/docs`, `AGENTS.md` and `SKILL.md` from its `docs/**/*.mdx` at build time and ships them through `files`; one generator script decides which packages bundle them, only user-facing SDK packages do, and the build task declares them as outputs. "Never edit generated `packages/*/docs`, `AGENTS.md` or `SKILL.md`": regenerate them. Maintainer skills stay in `.agents/skills/` and are not shipped [c15t, writing-docs], [c15t, creating-a-package]. The package side is in [deployment NPM-PACKAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/NPM-PACKAGES.md#create-a-package); pub's version of the same split, where `dart pub publish` bundles a top-level `skills/` directory and `.agents/skills/` stays internal, is in [dart PACKAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/PACKAGES.md#shipping-agent-skills-with-a-package). A generated copy can drift from its sources: [WRITING.md](WRITING.md#check-a-compiled-file-against-its-sources).

## Running a marketplace

- **No central gatekeeper:** the Claude Code team has no central team deciding which skills go in; it tries to find the most useful skills organically.
- **Sandbox first:** someone with a skill they want people to try uploads it to a sandbox folder in GitHub and points people to it in Slack or other forums.
- **Promote on traction:** once a skill has gotten traction (the skill owner decides when), the owner opens a PR to move it into the marketplace.

## Composing skills

- **Reference other skills by name:** you may want skills that depend on each other, such as a file upload skill and a CSV generation skill that makes a CSV and uploads it. Dependency management is not built into marketplaces or skills yet, but you can reference other skills by name, and the model invokes them if they are installed.
- **A missing dependency is a stop, not an improvisation:** Jakub Krehel's `interface-review` owns scope and statuses and hands severity, the cap and the verdict to a sibling skill; "If `better-interface` is unavailable, report the resolved scope and the file inventory, name it as the missing skill and stop. Do not invent a severity scale, a cap or a verdict."
- **A chain of existing skills, run by hand:** React Doctor's `ship` takes a branch "from done-coding to merge-ready in one pass", and is manual-only (`disable-model-invocation: true`) because "it commits, pushes, and opens a PR". "Each stage delegates to an existing skill. Run them in order and do not advance while a stage still has unresolved findings." It has the agent copy a checklist and tick it [React Doctor, ship]:
  ```
  Ship progress:
  - [ ] 1. Review the diff against AGENTS.md
  - [ ] 2. Deslop the touched code
  - [ ] 3. Commit and push
  - [ ] 4. Open the PR
  - [ ] 5. Babysit to merge-ready
  ```
  Stage 1 reads `AGENTS.md` first "(its rules change)" and pauses for the user "only if a fix would change behavior or broaden scope"; stage 3 keeps "Git safety: no force-push to `main`, no skipped hooks, no `git config` changes"; stage 5 resolves conflicts, triages comments and fixes in-scope CI "until the PR is mergeable, green, and its comments are triaged. Report back instead of merging." That last choice differs from the `babysit-pr` example in [CATEGORIES.md](CATEGORIES.md), which enables auto-merge; both are choices. Its stop conditions: pause when review or babysit "surfaces a change that would broaden scope or alter intended behavior", when "A merge conflict has genuinely conflicting intent on the two branches", and when "CI fails for reasons outside this branch's scope even after merging the latest base". Two of its dependencies show the rule above: `/review` is now an alias of `/code-review` in Claude Code ([commands](https://code.claude.com/docs/en/commands)), and `/babysit` is neither a Claude Code command nor in React Doctor's public repo, so `ship` cannot finish as written outside its authors' setup.
- **Workflow skills lean on others:** business-process skills may depend on other skills or MCPs, and CI/CD skills may reference other skills to collect data.

## Prove it

Shared skills live under `./.claude/skills` in the repo or in a marketplace plugin, never only in one person's `~/.claude`; a skill that depends on another names it and stops when it is missing; skills and docs bundled in a package are generated, never hand-edited; a skill promoted to the marketplace has had a trial from a sandbox folder first.
