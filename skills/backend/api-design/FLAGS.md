# Feature flags and experiments

A flag separates deploying code from turning the behavior on. It lets you release gradually, run an experiment and switch off a bad change without a deploy. Each flag is also a temporary branch in the code that someone must remove.

## Rules

- **Kinds of rule:** on/off; a percentage of users; a list or segment of users or tenants (targeting, for phased rollouts: start small, raise while watching errors and latency; for high-risk changes, employees first, then one percent of users, then everyone); a time window (on between two dates, such as a sale). Flags can live in configuration for simple on/off, or in a flag service when you need targeting and changes without a deploy.
- **One definition per flag name.** Declare flag keys as constants in one module (`export const FLAGS = { newRanking: "new-ranking" } as const`) and import them, so a typo is a compile error and a search finds every use.
- **Gate whole endpoints too,** not only branches inside them: when the flag is off, the endpoint answers 404 as if it didn't exist.

- **Stable assignment.** The same user gets the same variant on every request and device: hash the user id (or account id for B2B) with the flag key and map it to a bucket (`hash(flagKey + userId) % 100 < rolloutPercent`). Random per request is a bug.

```ts
import { createHash } from "node:crypto";

export function bucketFor(flagKey: string, subjectId: string): number {
  const digest = createHash("sha256").update(`${flagKey}:${subjectId}`).digest();
  return digest.readUInt32BE(0) % 100;                         // 0..99, stable for this flag and subject
}

export const isEnabledFor = (flagKey: string, subjectId: string, rolloutPercent: number) =>
  bucketFor(flagKey, subjectId) < rolloutPercent;               // raising 10 -> 20 keeps the first 10% in
```
- **Evaluate once per workflow.** Decide the variant at the start of a request or multi-step flow and pass it down, so a user doesn't switch variants mid-checkout because the rollout percentage changed between steps.
- **Evaluate on the server** for anything that affects data, money, permissions or security. A client-side flag is presentation only.
- **Every flag has an owner and a removal condition** written where it's defined: "remove when the new ranking is at 100% for two weeks", with a date to review. Release flags are short-lived; kill switches for risky dependencies may be permanent and are labeled as such.
- **Classify every flag as a kill switch or a ramp,** and retire each one as soon as it is safe. When flags pile up, open a dedicated thread to coordinate their rollouts and cleanup: one two-week push that shipped anything that could cause a user-visible problem behind a short-lived flag introduced nearly two hundred, and more than half were already cleaned up by the end.
- **Default to the safe behavior** when the flag service is unreachable.

## Flags and trunk-based development

Everyone merges small changes to the main branch at least daily instead of keeping long-lived feature branches. Unfinished work ships to production behind a flag that is off, so main is always releasable; turning the flag on is the release, and turning it off is the rollback. When the field data shows a flagged change didn't help, turn the flag off and iterate. With automated review, at least one human approval on every PR and unit tests before optimizations, and anything that could cause a user-visible problem behind a short-lived flag, one push merged more than three thousand changes without a customer-facing incident or rollback.

## Experiments (A/B)

Use the canonical [A/B testing method](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md) for the hypothesis, metrics, sample size, stopping rule and result. Keep the flag's implementation contract here. [existing api-design, FLAGS.md, Experiments (A/B)]

- Log exposure when the user actually sees the variant, not when the flag was evaluated somewhere they never reached.
- Keep assignment stable for the whole experiment, and don't change the split mid-way without restarting the analysis.

## Removing a flag

When the decision is made: delete the losing branch and the flag check in the same change, remove the flag from the flag service afterwards, and delete tests that only covered the removed path.

## Prove it

Roll out a new search ranking to 10% of users: confirm the same user sees the same ranking across many requests and sessions, that raising to 20% keeps the original 10% in the new variant, and that the flag's removal condition and owner are written next to its definition.
