# Approval

Human approval is scaled by risk. Pulling a senior engineer out of deep work to catch a routine mistake costs far more than an automated review, so people approve where the risk is and automated checks catch the rest.

## Risk tiers

| Risk | Examples | Human approvals |
|---|---|---|
| Low | Docs, copy, internal-only features, additive changes behind a flag | None required once automated review and security checks are green |
| Medium | Ordinary product changes, and changes to sensitive areas such as caching, the auto-updater, or system prompts | One person |
| High | The highest-risk code, plus a small set of paths that always need two people | Two people |

- **Write the tiers down; start strict and loosen with evidence.**
- **The change sets the tier, not the author.** A classifier reads the change and picks its risk tier. A second classifier asks whether this particular change needs another person even when its tier says it doesn't.
- **Some paths always need a person:** anything owners have listed as sensitive, and any CI workflow file.
- **Enforce it with CODEOWNERS and branch protection,** so auth, billing, CI and release workflows, and installers always need a person.

## Who may approve

- **Only trusted authors get the lighter paths.** Only authors on the repo's trusted list get them, mostly the team that owns it. Everyone else needs a second person to approve.
- **An agent's approval never counts as a person's.** Automated review can clear a low-risk change, but it can't fill a slot that calls for a human. Never let a bot's approval replace a required human's.
- **Whoever prompted the change is on the hook for it.** On an agent-written PR, the person directing the agent counts as one of the required reviewers, the same as if they'd typed the code themselves.
- **An approval covers one specific commit.** If new commits land that the system can't vouch for, like an agent's push or a merge someone resolved by hand, the approval has to be given again. Dismiss approvals on new commits.
- **Keep human review for changes from outside the team.** One team that declared its review bottleneck solved still did, so someone asks "should we even do this?"

## Where humans stay in the loop

People moved from reading every diff to the decisions machines are bad at:

- **Should we build this at all?** Direction, taste and scope. (The "should it exist" checks for one diff are in [anti-slop-code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md).)
- **Risky code** such as billing, the auto-updater and CI workflows.
- **Architecture** that sets a pattern others will copy.
- **Reading the evidence.** Test output, the command that ran and what it returned, a screenshot, the reviewer's findings. If you can't say what the checks would miss, ask for a real review rather than a quick approval.
- **Owning the outcome.** A person is accountable for every change that ships, whoever typed it.

## Where the line sits

Code Review for Claude Code posts findings, not approvals: approving a pull request is still a human call there. The Claude Code team's own repos go further, letting owners decide which low-risk changes merge on automated checks alone, and that line keeps moving. The goal hasn't changed: less human time per change, and no more reverts than before ([LAYERS.md](LAYERS.md)).

## Anti-patterns

- **The author sets the tier,** instead of the change.
- **A bot's approval counted toward a required human slot.**
- **An approval that survives new commits,** including an agent's push or a hand-resolved merge.
- **A quick approval from someone who can't say what the checks would miss.**

## Prove it

The tiers are written down; CODEOWNERS and branch protection require a person on auth, billing, CI and release workflows, installers and every owner-listed sensitive path; branch protection dismisses approvals on new commits; bot approvals don't count toward required reviews; and the lighter paths are limited to the repo's trusted-author list.
