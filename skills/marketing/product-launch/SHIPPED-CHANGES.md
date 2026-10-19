# From shipped code to marketing

Turning what merged this week into a changelog entry, announcement drafts and a list of pages the change made wrong. Source: [coreyhaines31/marketingskills, launch] `references/shipped-changes.md` (v2.2.0, MIT, Corey Haines). Quotes keep the source's words with its dashes replaced. How big an announcement each tier of change gets is in [product-launch LAUNCH-PLAN.md](LAUNCH-PLAN.md#ongoing-launches); copy and claim tests are in [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md).

[coreyhaines31/marketingskills, launch] "Most product updates never get marketed because nobody translates them. The engineers wrote the PR description for each other, and by the time marketing hears about it, the moment has passed."

## Inputs

[coreyhaines31/marketingskills, launch] For the window (usually the last week, or since the last release tag):
- **Merged PRs** with titles, descriptions and linked issues. "These explain *why* better than commits do."
- **Commit log** for anything merged without a PR: `git log --since="1 week ago" --no-merges --pretty=format:"%h %s (%an, %ar)"`
- **Changed files**, "read wherever a title doesn't make the user-facing effect clear."
- **Release notes or tags**, if the team already writes them.
- **Feature flags**: "what's actually live for customers versus merged behind a flag."

"Only market what customers can use today. Anything behind a flag, in internal beta, or not yet deployed waits."

## Translate before you write

[coreyhaines31/marketingskills, launch] "For each change, write one line: **'You can now ___'** or **'___ no longer ___.'** If you can't fill that in, the change is invisible to customers. Refactors, dependency bumps, CI, and test changes go in no marketing output at all." Then sort the visible changes into major, medium and minor ([LAUNCH-PLAN.md](LAUNCH-PLAN.md#ongoing-launches)). "Several medium changes that share a theme ('five improvements to reporting') can be bundled into one major-tier story."

## Ground every claim in the change

[coreyhaines31/marketingskills, launch]
- "State what the change does, not what it might do for someone. 'Exports now include custom fields,' not 'unlock deeper insights.'"
- "Use numbers only if they come from the change itself (a benchmark in the PR, a measured speedup). Never invent customer results, adoption, or impact."
- "If a PR says the change is partial ('phase 1,' 'first step toward'), the announcement says so too."
- "Credit the user who asked for it, where the team does that and the user agreed."

No "we're excited to announce" ([anti-slop-copy PAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/PAGES.md#page-types)).

## Marketing that just became wrong

[coreyhaines31/marketingskills, launch] "Every shipped change can also make an existing claim false: a new limit, a renamed plan, a removed integration, a price change. Check the site, docs, comparison pages, and ads for statements the change contradicts." On a schedule that is the claim-drift loop in [marketing-loops](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/SKILL.md). "A new integration can deserve its own page ('[Product] + [Tool] integration')"; add new pages to the backlog in [content-strategy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/content-strategy/SKILL.md).

## Weekly digest

[coreyhaines31/marketingskills, launch]

```markdown
## Shipped: [date range]

### For customers
- **[Major]** [You can now ...] (PR #123)
- **[Medium]** [You can now ...] (PR #130)
- **[Minor]** [Fixed ...] (PR #131, #134)

### Changelog entry
## [version or date]
### Added
- [Customer-facing description]
### Changed
- [...]
### Fixed
- [...]

### Drafts
- Blog post: [working title], [angle], [who it's for]
- Email: [subject line options] → [segment]
- Social: [one post per major or medium change, built on its single most useful detail]
- In-app: [message + where it appears]

### Pages to update
- [Page]: [statement that's now wrong or incomplete]

### New content opportunities
- [Query or comparison the change makes winnable]
```

The changelog uses the Keep a Changelog headings ([keepachangelog.com 1.1.0](https://keepachangelog.com/en/1.1.0/)): "Added" "for new features", "Changed" "for changes in existing functionality", "Deprecated" "for soon-to-be removed features", "Removed" "for now removed features", "Fixed" "for any bug fixes", "Security" "in case of vulnerabilities". Its principles include "Changelogs are _for humans_, not machines" and "The latest version comes first."

## Writing the drafts

[coreyhaines31/marketingskills, launch]
- **Changelog:** "one line per change, written for a customer and in past or present tense. Link docs for anything non-obvious."
- **Blog post (major only):** "the problem the customer had, what changed, how to use it (with screenshots), and who it's for."
- **Email:** "lead with the change for that segment; one call to action that takes them to the feature" (sending rules in [email-practices](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/email-practices/SKILL.md)).
- **Social:** "one concrete detail per post, with a screenshot or 10-second clip of the feature doing it" ([social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md)).

"Drafts are staged for a human to review and send. Nothing in this workflow publishes on its own."

## Prove it

- Every customer-facing line reads as "You can now ___" or "___ no longer ___"; refactors, dependency bumps, CI and tests appear nowhere.
- Nothing behind a flag or not yet deployed is announced.
- Every number traces to the PR or a measurement of the change.
- The digest lists the pages whose claims the change made wrong.
- Nothing was published; every draft waits for a person.
