# Reviewing one change: scope, blast radius and status

How a review of one branch, pull request or uncommitted change decides what it covers and whose fault each finding is: resolve the range and name its base, drop machine-authored paths, expand changed files to the surfaces they render in, read the removed lines, and give every finding a status by cause. Source: Jakub Krehel's `interface-review` (`SKILL.md`, `scope-resolution.md`, `removed-signals.md`), written for interface reviews; the scope rules hold for any diff, and the [UI changes](#ui-changes-removed-signals-and-absent-states) section is the interface part. Its examples rate severity `HIGH` and `MEDIUM`; here they are written on the P0 to P3 scale in [REVIEWER.md](REVIEWER.md#tags-and-output) (HIGH as P1, MEDIUM as P2, LOW as P3). The commands were checked against git 2.56.0's man pages and a throwaway repository; caveats are marked where the source is off.

**Contents:** [The change, not the codebase](#the-change-not-the-codebase) · [Resolving the scope](#resolving-the-scope) · [Pull requests](#pull-requests) · [Awkward repository states](#awkward-repository-states) · [Excluded paths](#excluded-paths) · [Blast radius](#blast-radius) · [Status by cause](#status-by-cause) · [UI changes: removed signals and absent states](#ui-changes-removed-signals-and-absent-states) · [Read-only and rendered checks](#read-only-and-rendered-checks) · [The report](#the-report) · [Before you finish](#before-you-finish) · [Prove it](#prove-it)

## The change, not the codebase

- "The author is asking 'did I make this worse?'. Report what the change caused and stay mostly quiet about what it merely touched. Three pre-existing findings is a courtesy; thirty is a different review and one nobody asked for." [Jakub Krehel, interface-review]
- "Read the whole diff before forming an opinion of it. A skimmed diff produces findings about code the next hunk already fixed." [Jakub Krehel, interface-review]
- **Out of domain:** in an interface review, "Correctness, tests, security and performance belong to the project's general code review. Name such a concern once, point at that review and drop it." [Jakub Krehel, interface-review]

## Resolving the scope

Source for this section: [Jakub Krehel, interface-review].

**With no target, stop at the first match:**

1. "`HEAD` is ahead of `git merge-base origin/<default-branch> HEAD`. Review that range **plus** any uncommitted changes, stating the commit count and the uncommitted file count separately."
2. "The working tree is dirty. Review the uncommitted changes."
3. Neither: there is no change, so ask (below).

"Record the base commit of the resolved range as `$BASE` and name it in the scope block. Every command … uses it."

**Nothing to review, ask rather than invent one.** "Never fall back to `HEAD~1..HEAD` on your own. The last commit is whatever happened to land, often a merge or someone else's work." First gather "the current branch, the count ahead of the base, the last commit's SHA and subject and any open pull request from `gh pr status`", then offer these routes and wait:

- "**The open pull request** on the current branch, first when there is one. A branch whose commits already landed resolves to no change, while its pull request is still exactly what the user meant."
- "**The last commit**, `HEAD~1..HEAD`, named by short SHA and subject so the user sees what they would get."
- "**A target they name**, such as `pr <n>`, a branch, a ref or a range."
- **A whole-repository audit,** which is not a change review and carries none of this file's scope block, statuses or pre-existing section ([REVIEWER.md](REVIEWER.md#bigger-reviews-with-more-agents) has the whole-app mode).

"Never report a review of nothing as `Approve`." `gh pr status`, per the source, "succeeds when no pull request is open. It omits `currentBranch`, so an empty result is an answer, not an error. It fails outright without `gh`, without authentication and on a repository with no GitHub remote. Treat any failure as 'no pull request found', say so and offer the remaining routes rather than stopping." The `currentBranch` detail and the no-PR behaviour are not on the [official manual page](https://cli.github.com/manual/gh_pr_status).

**Both views on the default:** [browser-ui-qa ADVERSARIAL-UI-QA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/ADVERSARIAL-UI-QA.md#testing-a-diff) starts QA from `git diff --name-only HEAD~1` (or `main...HEAD`), and [anti-slop-code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md) says "otherwise ask, or start with the most recently changed files"; interface-review asks, with the facts gathered first. Both rules stay where they are.

**Default branch.** "Try `refs/remotes/origin/HEAD`, then `gh repo view --json defaultBranchRef`. If the ref is missing, ask the remote with `git remote set-head origin --auto` rather than guessing. It needs the network and writes only a ref under `.git`, so it is permitted; note it in Verification. With no remote at all, fall back to a local `main` or `master` and state which base you assumed."

**Targets.** "Accepted targets are `working`, `staged`, `branch`, `pr <n>`, a bare `<ref>` and an explicit `<a>..<b>` or `<a>...<b>` range. Anything else in the invocation is a `<ref>`."

- "Diff a branch against the **merge base**, with three dots. Two dots reports every upstream commit that landed on the base branch as part of the change."
- "But use the dots the user wrote when they wrote a range. `<a>..<b>` compares the endpoints; `<a>...<b>` compares `merge-base(<a>, <b>)` with `<b>`. Rewriting `release..feature` to three dots drops everything between `release` and the merge base, which is often exactly what was asked for." git-diff(1) agrees: "git diff A...B is equivalent to git diff $(git merge-base A B) B".
- "`git diff HEAD` reports tracked changes only. Any target including uncommitted work must pair it with `git ls-files --others --exclude-standard`. Otherwise a newly added component is silently dropped from a scope the report claims to cover in full."

**Renames.** "Rename detection is on by default in `git diff`, and `--name-status` reports `R100 old/path new/path`. Lower the similarity threshold with `--find-renames=40%` when a file was moved and edited in the same change." "Review a rename as a move, not a delete plus an add. Everything that survived the move is unchanged code, and only the genuine edits are in scope."

## Pull requests

Source: [Jakub Krehel, interface-review].

- "Fetch the head into a remote-tracking ref, `git fetch origin "pull/<n>/head:refs/remotes/pr/<n>"`, and review it in place. This works for forks, which `origin/<branch>` does not." GitHub documents `git fetch origin pull/ID/head:BRANCH_NAME` but does not state the fork behaviour ([checking out pull requests locally](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/checking-out-pull-requests-locally)).
- "Diff against the pull request's own base, never the default branch by assumption. Read it from `gh pr view <n> --json baseRefName,baseRefOid` and fetch it if it is not local. A pull request into `release/2.0` diffed against `main` picks up every commit between the two."
- "Read files at the head ref with `git show refs/remotes/pr/<n>:path/to/file`. Never open the working-tree copy, which is a different revision."
- "`gh pr diff <n>` is a fine shortcut for the patch text. It gives no way to read unchanged context or expand to consumers, so fetch the ref as well."
- "**Citations.** Line numbers from a fetched ref need not match the working tree. Cite against the head ref and declare that ref and its SHA in the scope block so the numbers resolve."
- "**Intent.** The `title` and `body` from `gh pr view` are the stated intent … Add the commit subjects when the body is empty."

## Awkward repository states

Source: [Jakub Krehel, interface-review]. "Everything else fails loudly at `merge-base`: unrelated histories, a repo with no commits, a moved submodule pointer. Say the base is unresolvable and stop. Never review a range you cannot name."

- "**Detached HEAD.** Use the merge base against the default branch and name the SHA, not a branch, in the scope block."
- "**Shallow clone**, the CI default, where `merge-base` returns nothing. Fetch `--deepen=50`, retry, then `--deepen=200`, then report the scope as unresolvable. Deepening writes to `.git` and not to the working tree, so it is permitted; note it in Verification."
  - Lighthouse CI hits the same problem as "Ancestor hash not determinable" and documents its own fetch-depth fix: [web-performance LIGHTHOUSE-CI.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/LIGHTHOUSE-CI.md#troubleshooting).
- "**Mid-rebase or mid-merge**, the one that does not fail loudly. `git diff` succeeds and returns something that is not the change, so the review looks fine and is wrong." Detect it with `git rev-parse --git-path` against `rebase-merge`, `rebase-apply`, `MERGE_HEAD` and `CHERRY_PICK_HEAD`; "Do not test `.git/` paths directly, because they are not directories inside a linked worktree. Stop and say the tree is mid-operation." Caveat from git-rev-parse(1) and a test: `--git-path` resolves a path and does not check that it exists, and takes one path per flag (`git rev-parse --git-path rebase-merge MERGE_HEAD` fails with "ambiguous argument"). Run one `--git-path` per name, then test each returned path.

## Excluded paths

Source: [Jakub Krehel, interface-review]. "Exclude these and name what you excluded in the scope block. They are machine-authored and carry no interface rules." This is a concrete version of REVIEW.md's "List paths to skip" ([REVIEWER.md](REVIEWER.md#writing-a-reviewmd)).

| Category | Patterns |
| --- | --- |
| Lockfiles | `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`, `Cargo.lock`, `composer.lock`, `Gemfile.lock`, `poetry.lock`, `uv.lock` |
| Snapshots and fixtures | `__snapshots__/`, `*.snap`, `*.approved.*`, `test-results/`, `playwright-report/` |
| Generated output | `dist/`, `build/`, `out/`, `.next/`, `.turbo/`, `.svelte-kit/`, `coverage/`, `storybook-static/`, `*.min.js`, `*.min.css`, `*.map` |
| Generated sources | `*.gen.ts`, `*.generated.*`, `*.d.ts` emitted by a build, GraphQL and Prisma client output |
| Vendored code | `vendor/`, `third_party/`, `node_modules/` |
| Binaries and media | `*.png`, `*.jpg`, `*.webp`, `*.avif`, `*.woff2`, `*.mp4`, `*.pdf` |

"Two exceptions stay in scope. A **font file** added or swapped is a" typography change; "An **image** added to a component is a" UI and accessibility change, "through its outline and its `alt` text. Review the code that references them, not the bytes." "If nothing survives the exclusions, treat it as no change."

"Apply the exclusions as pathspecs so the file count in the scope block is the reviewed count":

```bash
git diff --name-only "$BASE" <head-ref> -- . ':(exclude)pnpm-lock.yaml' ':(glob,exclude)**/dist/**'
```

"Two traps under-exclude silently. `*.lock` catches `yarn.lock` and `Cargo.lock` but not `package-lock.json` or `pnpm-lock.yaml`, so cover every suffix in the table. And without `glob` magic, `**/dist/**` needs a literal `/` before `dist`, so it misses a root-level `dist/`. Run the diff with and without the pathspecs and confirm the count dropped by exactly the files you named." A test confirmed it: `:(exclude)**/dist/**` kept a root `dist/a.js`, `:(glob,exclude)**/dist/**` excluded both.

## Blast radius

Source: [Jakub Krehel, interface-review]. "A changed file is evidence, not the review subject. Its **blast radius** is the set of surfaces it renders in; review those." (In [LAYERS.md](LAYERS.md) blast radius sets the approval bar; here it sets which surfaces get read.)

- "Expand one hop by default, to the direct importers and callers. Expand a second hop only for design tokens, theme values and shared primitives, where one line reaches the whole product."
- "Review at most five consumers in total across both hops … State how many you did not expand, since an unstated cutoff reads as completeness."
- "Use the project's own resolver where one exists, otherwise import paths."
- "`git grep` searches the working tree by default. Pass the reviewed ref after the pattern, or on a pull request you search a different revision and miss importers the change itself added. Results come back as `<rev>:path/to/file`; read them with `git show`, never the working-tree copy. Pass `-e` when the pattern starts with a dash, such as a `--color-*` token, or git parses it as an option."
- "For a changed token or theme value, search the token name rather than the file, since consumers reference the name and never import it."
- Order consumers "by a rule you can evaluate, so the cutoff is reproducible instead of a guess":
  1. "**Route and layout entry points first**, whatever the framework treats as a rendered surface: `app/**/page.*`, `app/**/layout.*`, `pages/**`, `routes/**`, `src/views/**`, `*.astro` pages. Everything else only appears inside one."
  2. "**Then by importer count**, since a component pulled in by twenty files carries more of the change than one pulled in by two."
  3. "**Break ties by proximity**, same package or feature directory first."
- "Say plainly if the ordering was arbitrary past a point."

## Status by cause

Source: [Jakub Krehel, interface-review]. Every finding gets one status, beside its tag in [REVIEWER.md](REVIEWER.md#tags-and-output):

- "`Introduced`: the change created it."
- "`Regression`: the change weakened something previously correct."
- "`Pre-existing`: present before the change and not made worse by it."

"Status by cause, not by location. A finding a changed line causes is `Introduced` or `Regression` wherever it surfaces, including an untouched consumer of a changed token. A finding the change neither created nor worsened is `Pre-existing`, even three lines from a hunk."

"To check whether a line predates the change, blame the reviewed range. A `^` prefix marks a line unchanged since the base":

```bash
git blame -L <line>,<line> "$BASE"..<head-ref> -- path/to/file
```

"For uncommitted work, drop the range. A line marked `Not Committed Yet` or blamed on a commit inside `$BASE..HEAD` belongs to the change." Caveat from git-blame(1): with `-b` or the `blame.blankBoundary` config the boundary commit shows a blank SHA-1 instead of `^`, so read "a `^` prefix or a blank SHA"; the repository's root commit also shows `^` in a plain blame.

## UI changes: removed signals and absent states

Source: [Jakub Krehel, interface-review]. "Regressions are invisible in the post-change state. Read the `-` side of every hunk." "A signal is a lead, not a finding. A removal is a regression only when nothing in the change replaces it". A checker that scans changed lines reads the `+` side ([app-ui CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CHECKS.md#a-checker-in-ci)); this is the other half. The Owner column names this repo's skill; the source routes to its own `better-*` skills.

| Removed from the `-` side | Owner here | What to check |
| --- | --- | --- |
| `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-live`, `role=` | [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md) | The control or region lost its accessible name, description or announcement |
| `alt=`, `<label`, `for=`, `htmlFor`, `scope=` | web-accessibility | Image, field or table cell lost its programmatic association |
| `<button>`, `<a>`, `<nav>`, `<main>`, `<ul>` replaced by `div` or `span` | web-accessibility | Keyboard and assistive-technology behavior was traded for styling |
| `:focus-visible`, `:focus`, `outline`, `tabindex` | web-accessibility | Keyboard users lost the focus indicator or the element left the tab order |
| `prefers-reduced-motion` | web-accessibility | Motion now ignores the user's system preference |
| `prefers-contrast` | [color-system](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/color-system/SKILL.md) | Colors now ignore the user's contrast preference |
| Logical properties swapped for `left` / `right` | [modern-css RESPONSIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE.md), with its exceptions (centring with `left: 50%` and a translate, code blocks, parts measured in physical pixels at runtime) | Direction-aware layout was dropped |
| `lang=`, `dir=` | [modern-css](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SKILL.md) | Language metadata or text direction was dropped |
| `text-wrap`, `line-clamp`, `overflow-wrap`, `tabular-nums`, `font-feature-settings` | modern-css | Text rendering, wrapping or numeral alignment silently changed |
| A color token swapped for a literal, or a token swapped for a lighter one | color-system | The rendered contrast pair may now fail; measure it |
| A user-facing string deleted or shortened | [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md) | A label, error or empty state lost the information it carried |

**Equivalent replacements** "clear the signal. Drop a removal one of them explains before routing anything":

- "`aria-label` giving way to `aria-labelledby` pointing at visible text."
- "An explicit `role` dropped because the element became the native equivalent, such as `role="button"` going when a `div` becomes a `<button>`."
- "`outline` replaced by a `box-shadow` ring on the same `:focus-visible` selector."
- "`tabindex="0"` dropped from an element that is now natively focusable."
- "A color literal replaced by a token with the same value."
- "A physical property replaced by its logical counterpart, which is the fix rather than the regression."
- "A string moved into the translation catalogue rather than deleted."

**Searching the removed side.** "Restrict the search to deleted lines so additions do not mask a removal":

```bash
git diff -U0 "$BASE" <head-ref> -- . <exclusions> \
  | grep -E '^-' | grep -vE '^--- (a/|/dev/null)' \
  | grep -E 'aria-|role=|alt=|htmlFor|for=|scope=|focus|outline|tabindex|prefers-|lang=|dir=|text-wrap|line-clamp|overflow-wrap|tabular-nums|font-feature|inset-|-inline|-block'
```

"Leave `<head-ref>` off for a target that includes uncommitted work, so the diff runs against the working tree. Removed strings and swapped color tokens have no pattern; read those hunks." "Read the surrounding hunk before deciding. A removed attribute is meaningless without the element it came from, and `-U0` deliberately hides that context."

**Hold the change to its stated intent.** "Read the pull request title and body, the linked issue and the commit messages, then review whether the interface delivers what they claim." "This is how you find the **incomplete** change, which a surface review misses because it inspects only the states that exist. Look for the absent ones":

- "A new variant, size or theme applied to some states but not all of hover, focus, active, disabled, loading and selected."
- "A new user-facing string with no entry in the translation catalogue the project maintains."
- "A new component with no empty, loading, error, disabled or narrow-width state."
- "A control added to one surface but not to the siblings that already carry its peers."

**Both views on scope creep:** interface-review says "Do not report scope creep. Whether a change does too much is a process question, not an interface one." [Jakub Krehel, interface-review]; the general reviewer here may "estimate how far the feature is needed against refactoring something that already exists" ([REVIEWER.md](REVIEWER.md)), and anti-slop-code has an `unneeded` verdict. The first holds inside an interface-only review; the general review keeps its check.

## Read-only and rendered checks

Source: [Jakub Krehel, interface-review]. "A change review is read-only, including the checkout. `git fetch` writes only to `.git` and is permitted. `gh pr checkout`, `git checkout`, `git switch` and `git stash` rewrite the files the author has open, so they are never permitted. Fetch pull request refs and read them in place."

"Mark visual and runtime claims **Not verified** unless the project exposes a cheap preview or the user asks for a rendered review. For `working` and `branch`, the checkout already is the head, so render it in place. For any other target, render an isolated worktree such as `git worktree add /tmp/review-<n> refs/remotes/pr/<n>` and remove it when done."

**Both views on checking out:** QA that runs the app says "check the branch, check out the PR branch, reinstall dependencies" ([browser-ui-qa ADVERSARIAL-UI-QA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/ADVERSARIAL-UI-QA.md#testing-a-diff)); a review never checks out. The worktree route above satisfies both.

## The report

Source: [Jakub Krehel, interface-review]. "Open with the scope block":

| Field | Value |
| --- | --- |
| Target | `branch`, `working`, `staged`, `pr 482` or the range as entered |
| Base ref | `origin/main` at `a1b2c3d` |
| Head ref | `refs/remotes/pr/482` at `e4f5g6h` |
| Commits | 7 committed, 2 files uncommitted |
| Files in scope | 12 after exclusions |
| Excluded | `pnpm-lock.yaml`, `src/__snapshots__/`, lockfile and snapshots |
| Surfaces expanded | `CheckoutPage`, `SettingsPanel`; 3 further `Button` consumers not expanded |

- **Coverage:** "A domain with no evidence in the change scope is `Not reviewed: no evidence in the change scope`, which is a coverage statement rather than a gap."
- **Findings,** with a `Status` column (severity written on the P0 to P3 scale; the source's row reads `HIGH`):

| Severity | Domain | Status | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | Accessibility | Regression | `src/Dialog.tsx:42` | `aria-label="Close"` removed in this change | Restore `aria-label="Close"` on the icon-only control | The close control had an accessible name before this change and no longer does |

- "With no `Introduced` or `Regression` findings, omit the table and state 'No actionable interface findings in this change.'"
- "Then `Pre-existing` findings, at most three, highest severity first, stated plainly as not this change's responsibility. Omit the section when there are none." (The source's example severity is `MEDIUM`.)

| Severity | Domain | Location | Issue |
| --- | --- | --- | --- |
| P2 | Typography | `src/Toolbar.tsx:7` | Numeric badges use proportional figures; predates this change |

## Before you finish

[Jakub Krehel, interface-review]:

| Mistake | Fix |
| --- | --- |
| The scope block counts only uncommitted files while `HEAD` is ahead of the merge base | Review the branch range plus the uncommitted changes, with both counts |
| A report on `HEAD~1..HEAD` the user never chose | State the facts and offer the routes in [Resolving the scope](#resolving-the-scope) |
| A changed shared component with no consumer under `Surfaces expanded` | Expand to its consumers and name the ones you skipped |
| A deleted `aria-label`, `outline` or `prefers-reduced-motion` with no finding and no note | Route it to its owner through the removed-signals table |
| A `Regression` whose removed attribute reappears elsewhere in the diff | Check the equivalent replacements first |
| A finding on an untouched consumer of a changed token statused `Pre-existing` | The change caused it, so it is `Introduced` or `Regression` |
| A line outside every hunk statused `Introduced` with no causing change named | Blame it against the reviewed range |
| `gh pr checkout` or `git switch` in the command log | Fetch the ref and read files with `git show` |
| A cited line that does not match `git show <head-ref>:path` | Cite against the head ref named in the scope block |

## Prove it

The scope block names the target, `$BASE` and the head ref with SHAs, both commit and uncommitted counts, and the excluded files; the diff run with and without the pathspecs differs by exactly the excluded files; untracked files are in scope when uncommitted work is; every shared component or token changed has its consumers expanded or counted as skipped; every finding carries a status, and every `Pre-existing` one survives a blame against the range; at most three `Pre-existing` findings are listed; visual claims not rendered are marked Not verified; and the command log holds no `checkout`, `switch` or `stash`.
