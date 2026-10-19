# Product pass: before changing a developer tool's public surface

A CLI flag, a score, a config option, a JSON report field, a package API, an exit code or a GitHub Action input is a contract with users you don't control, the same as an endpoint. This is a runbook to work before writing the change: name the job, reuse before adding, wire one metric, pick the default and the compatibility artifacts, update the docs, and write down when the surface gets removed. Source: [React Doctor, product-thinking], React Doctor's runbook for its own CLI, score, config, JSON report, package API and GitHub Action; its file paths, telemetry plumbing and commands are left out. Versioning an HTTP API is [api-design CONTRACT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/CONTRACT.md); flag owners and removal conditions are [api-design FLAGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/FLAGS.md).

## When it runs

"Every surface is a contract: once it ships, people build on it and you can't quietly take it back."

| Surface | "Why it's load-bearing" |
|---|---|
| CLI command or flag | "Every flag is forever, it has to be parsed, documented, tested, and kept working across releases." |
| A score | "The number people screenshot and gate CI on; changing the math silently moves every user's score." |
| Config option | "A long-lived contract that interacts with existing precedence; a new knob is rarely removable later." |
| JSON report field | "A wire format other tools parse; a shape change breaks integrations unless `schemaVersion` is handled." |
| Package API or exit code | "Programmatic consumers pin to it, so changes are semver-breaking and need a changeset." |
| GitHub Action input or output | "Versioned independently (`vN`); workflows in other repos break when an input or output changes." |
| Terminal output | "The first impression and the daily experience; noise or confusion here is what makes people stop running it." |

Internal-only changes "skip the pass entirely; note in one line why the change is internal and move on." Lint rules have their own pipeline: [lint-rule-authoring LINT-RULES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/LINT-RULES.md).

## The steps

```
- [ ] 1. Write the job + the change (2 lines)
- [ ] 2. Search for a reuse candidate; extend it or justify new surface
- [ ] 3. Wire exactly one metric
- [ ] 4. Pick the default + add the compatibility artifacts
- [ ] 5. Update docs
- [ ] 6. Record the kill metric
- [ ] 7. Run checks
```

### 1. The job and the change

- "**Job**: who runs [the tool], what they are actually trying to get done, and what they do today instead (an existing flag or config option, a different tool, or nothing at all). Pin the job to behavior you've observed, not to what someone says they would hypothetically want."
- "**Change**: the smallest surface that does that job. If the change is bigger than the job, you are building speculatively."
- "If you can't name a job the current surface can't already serve, stop, there is nothing to build, and the right move is to point the user at the existing way to do it."

Two filters before building:

- "**Durability**: will this still matter as the model gets better ...? Capabilities the model will absorb, or that are trivially commoditized, are not worth a permanent slot on the surface. Spend surface area on durable, deterministic value."
- "**Trust**: a feature users don't trust is worse than no feature, because it teaches them to ignore the tool. If a change can fire false positives or can't back its recommendation with evidence, fix the trust problem first".

### 2. Search before adding

"Reuse beats adding every time, the cheapest surface is the one you never create." "Extend an existing surface when it does almost the same job: a new value on an existing flag, a new field on an existing config object, an extra column on output that's already there." "If you do add one, record in the brief what you searched for and why nothing fit, so the next person inherits the reasoning instead of re-litigating it."

### 3. Exactly one metric

"Decide that signal _before_ you build: if you can't describe which number would move, you don't yet know what success means."

- "**Adoption count**: is anyone using it?" ("did people turn this flag on")
- "**Per-scan outcome**: what happened on this run?" "Prefer one rich wide-event attribute over a pile of narrow counters, it stays queryable after the fact without new code."
- "never put a username, path, secret, or repo identity in an attribute".
- Write the metric name and "the threshold that would mean 'this worked'" into the brief.
- Their north star: "**CI cohort retention**: are teams still running React Doctor in CI weeks later? Treat most other numbers as vanity. For 'is this loved rather than merely used,' the proxy is a PMF survey scoring ≥40% 'very disappointed' if it went away."

### 4. The default and the compatibility artifacts

"The default is a product decision, not an implementation detail: most users never change it, so the default _is_ the behavior for almost everyone. Pick one that preserves today's behavior and make anything risky opt-in."

- **Published package behavior changed:** add a changeset, so the change is versioned and lands in the changelog.
- **JSON report shape changed:** "preserve the existing shape or bump `schemaVersion`", and run the report's smoke test. "CI pipelines parse this output, so an unannounced shape change breaks them silently."
- **Score weight or algorithm changed:** "every user's number moves at once and CI gates keyed to a threshold can flip. Treat it as a breaking change: changeset plus an explicit call-out of the shift."
- **`action.yml` changed,** per [GitHub's managing custom actions](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/manage-custom-actions): create a release tag with semantic versioning (`v1.0.1`) and "Move the major version tag (for example, `v1`) to point to the Git ref of the current release"; "Introduce a new major version tag (for example, `v2`) for changes that will break existing workflows, such as changing an action's inputs." With immutable releases enabled, that page points to a separate page, [using immutable releases and tags](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/using-immutable-releases-and-tags-to-manage-your-actions-releases). The source says to "cut a `vX.Y.Z` tag and move the floating `vN`" for every `action.yml` change, "because other repos pin to the major and won't receive the change otherwise"; GitHub's page gives the new major for a breaking change, which is the form written here.

### 5. Docs are part of done

"A surface nobody can discover is wasted, and a stale doc is a trust bug." Update the `--help` text next to the new flag or command, the website page, any prompt that agents fetch at runtime, and distributed skills when the user-facing workflow changes.

### 6. The kill metric

"Write one line in the brief: the metric from step 3, a threshold, and a horizon, e.g. 'remove if `<metric>` stays under N after 2 releases'. Schedule the check instead of trusting yourself to remember it, and treat deleting unused surface as a win, not an admission of failure." The same idea for flags: every flag has an owner and a removal condition ([api-design FLAGS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/api-design/FLAGS.md)).

### 7. Run the checks

Typecheck, tests and lint, plus the report smoke test when the JSON report changed.

## The brief

"Fill this in as you work the steps; fold it into the PR's 'Why'."

```md
## Product brief: <change>

Job: <who / goal / what they do today>
Change: <smallest surface that does it>
Reuse: <what you searched; what you extended, or why new surface was needed>
Metric: <METRIC name or wide-event attribute + the number that means success>
Compat: <default state; changeset / schemaVersion / action tag>
Kill: <metric threshold + horizon that triggers removal>
```

## Stop and ask when

- "You can't name a job the current surface can't already do": propose reuse or dropping it rather than adding surface.
- "You can't define a metric for it": either add the instrumentation or reconsider whether the change is real.
- "It breaks a published contract (package behavior, JSON `schemaVersion`, the score, or action I/O)": confirm the changeset, version bump and migration path before landing.
- "It would grow scope beyond what was asked": get explicit agreement before expanding.

## Tie-breakers

Source: [React Doctor, product-thinking], "Product principles". "When two options both seem fine, pick the one these favor":

1. "**Fewer findings > more findings.** Ten issues a developer will actually act on beat a hundred they scroll past; cap and rank rather than dump everything."
2. "**Root causes > individual warnings.** Collapse the symptoms of one underlying problem into a single finding instead of reporting each echo separately."
3. "**Evidence > assertions.** Show the proof (the code, the measurement, the reason) rather than asking the user to take the tool's word for it."
4. "**Actionability > correctness.** A fixable issue with a clear next step beats a technically perfect finding nobody knows what to do with."
5. "**Workflows > dashboards.** Meet developers where they already work (the CLI, PRs, the editor) instead of sending them to a separate surface."
6. "**Education > diagnostics.** Explain _why_ something is a problem so the user learns, not just _that_ it is one."
7. "**Trust > detection coverage.** The best finding is one the user believes and acts on; one false positive costs more trust than a missed issue costs coverage."

## Prove it

The PR's "Why" holds the brief with all six lines filled; the job is pinned to observed behavior; the Reuse line names what was searched; exactly one metric with a success threshold is wired and carries no username, path, secret or repo identity; the default preserves today's behavior; a changed report shape bumped `schemaVersion` or kept the old shape and passed the smoke test; an `action.yml` change cut a semver tag and moved `vN` only when inputs and outputs stayed compatible, otherwise it introduced a new major; `--help` and the docs page changed in the same PR; and the kill line has a metric, a threshold, a horizon and a scheduled check.
