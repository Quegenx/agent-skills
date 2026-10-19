# Testing tracks and staged rollouts

Google Play ships a build through tracks: internal, closed, open and production. A device installs the highest compatible version code on any track its user is eligible for, and every user is eligible for production. New personal developer accounts can't reach production at all until a closed test has run with at least 12 testers opted in for 14 consecutive days. Once in production, updates go out as staged rollouts that you raise, halt and resume by hand; Play has no automatic rollback, so the fix for a bad build is always a new build with a higher version code.

**Contents:** [Tracks](#tracks) · [Internal testing](#internal-testing) · [Closed testing](#closed-testing) · [Open testing](#open-testing) · [Which build a tester gets](#which-build-a-tester-gets) · [Managing testers with gplay](#managing-testers-with-gplay) · [Production access for new personal accounts](#production-access-for-new-personal-accounts) · [Staged rollouts](#staged-rollouts) · [Halting and resuming](#halting-and-resuming) · [Rollback](#rollback) · [Rollout schedules](#rollout-schedules) · [Prove it](#prove-it)

## Tracks

| Track (`--track`) | Audience | Testers | Review | Availability |
|---|---|---|---|---|
| `internal` | By email list | Up to 100 per app | Might not be subject to standard Play policy or security reviews | Within minutes |
| `alpha` | Closed, invite-only (not public) | Unlimited | (gplay table: no) | Minutes (gplay table) |
| `beta` | Open or closed | Unlimited (open: optionally limited, at least 1,000) | (gplay table: "No/Yes") | Minutes (gplay table) |
| Custom closed track | Closed | No size limits | (gplay table: no) | Minutes (gplay table) |
| `production` | Public | Unlimited | Yes | Days |

- **Availability conflict:** the gplay testers skill lists internal as "instant" and closed and open tracks as "minutes". Google says a new bundle on the internal track becomes available within minutes, first-time uploads are available immediately to internal testers, and after publishing any test for the first time the test link can take several hours to become available, with additional changes also taking several hours.
- **Testers need a Google Account** or a Google Workspace account.
- **Test before production:** "You must test your app before releasing it to production."
- **Feedback stays private:** testers can't leave public reviews for test versions and their feedback doesn't affect the public rating; open and closed testers can send private feedback through Google Play. Staged-rollout users in production can leave public reviews.
- **Pricing and countries are shared:** price changes affect all versions across all tracks; country and region changes apply across all tracks, except internal.
- **Paid apps:** open and closed testers must buy the app; internal testers install it free but still pay for in-app purchases unless they are on a license testers list. Purchases on the internal track or in draft are subject to spend limits.
- **Managed Google Play** (Test and release > Advanced settings > Managed Google Play tab) makes the app private: no longer searchable on the public Play Store.
- **Opt-in links** show only when the app status is "Published" (not "Draft" or "Pending publication"). Internal and closed test apps can't be found by search before open testing or production; share the Play Store URL or the opt-in link.
- **Testers' installs auto-update** to the test version within a few minutes.
- **End a test:** Manage track > Pause track. Testers stop getting updates but keep the app installed.

## Internal testing

- **Up to 100 testers per app,** by email list. It can start before app setup is complete and run alongside closed and open tests.
- **First uploads** are available immediately and show a temporary name and store listing for up to 48 hours.
- **No geography or device rules:** internal testers in any country get access, even where production, open or closed isn't available, and device exclusion rules don't apply.
- **Exempt from Data safety:** apps active only on internal testing tracks are exempt from inclusion in the Data safety section.
- **Internal opt-ins are exclusive:** a user opted into the internal test isn't eligible for open or closed tests until they opt out of internal, and receives only the internal track's version code.

## Closed testing

- **By email lists:** up to 200 lists, each up to 2,000 users; up to 50 lists per track.
- **By Google Group** (`yourgroupname@googlegroups.com`): users must join the group before opting in. Or by organization ID (managed Google Play).
- **Additional closed tracks:** Closed testing > Create track. The track name identifies it in Play Console and the Developer API; these groups have no size limits. Not supported on additional tracks: enterprise targeting for private apps, device compatibility for bundles only on those tracks, country targeting, and track details in the Play Console mobile app.
- **Multiple closed tests and one open test** can run at the same time.
- **CSV tester uploads overwrite** earlier addresses, and Play Console rejects CSV saved as UTF-8 with BOM.

## Open testing

- **Anyone can join:** unlimited testers by default, or a limited number of at least 1,000.
- **Discovery:** early-access apps (not yet in production) are findable via search; apps already in production can be opted into from the store listing.
- **New personal accounts** get open testing only after gaining production access (below).

## Which build a tester gets

- **Highest compatible version code wins:** a device receives the highest version code compatible with it that is published to a track the user is eligible for. All users are eligible for production, so if production has a higher version code than the test track, the tester gets production.
- **Test-track eligibility** needs both: the user is included in the track's configuration, and actively opts in to that test. Users eligible for several tracks get the highest version code across them; internal opt-ins get only the internal track's version code. A user added through both Play Console and the Google Admin console (organization testers) gets the highest version code among all available versions.
- **Fallback statuses** on a release: Shadowed, Promoted, Superseded, Partially shadowed ("This usually indicates an error in version code assignment").

## Managing testers with gplay

- **Three subcommands only:** `testers get` (read; there is no `testers list`), `testers update` (replaces the entire set), `testers patch` (merges).
- **Flags:** `--edit $EDIT_ID --track alpha --emails "a@x.com,b@x.com"` or `--google-groups "beta-testers@example.com,qa-team@example.com"`.
- **Changes are inert until `gplay edits commit`.**
- **No `--testers` flag** exists on `gplay release` or anywhere. The canonical flow: `edits create`, `bundles upload`, `tracks update` with releases, `testers update`, `edits commit`.
- **Remove a tester** by updating with the reduced set:

```bash
CURRENT=$(gplay testers get --package com.example.app --edit $EDIT_ID --track alpha \
  | jq -r '.testers[]?')
KEEP=$(echo "$CURRENT" | grep -v "user@example.com" | paste -sd "," -)

gplay testers update \
  --package com.example.app \
  --edit $EDIT_ID \
  --track alpha \
  --emails "$KEEP"
```

- **Custom closed track:** `gplay tracks create --package ... --edit $EDIT_ID --track qa-ring`, then `testers update`, then commit.
- **Promote a build between tracks:** `gplay promote --package com.example.app --from internal --to beta`. Promotion copies the source track's version codes.

## Production access for new personal accounts

- **Who:** personal Play Console accounts created after November 13, 2023. Production (Test and release > Production) and Pre-registration stay disabled until the requirement is met.
- **The rule:** "Developers with personal accounts created after November 13, 2023, must run a closed test for their app with a minimum of 12 testers who have been opted in continuously for at least 14 days." Then apply for production access on the Dashboard.

| Track | Requirement |
|---|---|
| Internal testing | None |
| Closed testing | Complete app setup |
| Open testing | Gain access to production |
| Production | Closed test with at least 12 testers opted in continuously for 14 days, then apply |

- **The 14 days must be consecutive:** "Testers who opt in, test for fewer than 14 days, and then opt out do not count toward the requirement. If a tester opts out and opts back in later, the 14 days must be consecutive."
- **The application** has three sections: "About your closed test", "About your app/game" (answers aren't public and don't affect visibility), and "About your production readiness".
- **Review** "usually takes seven days or less, but can occasionally take longer"; the email goes to the account owner. Fewer than 12 opted-in testers or too little tester engagement can mean continued testing is required. After approval, the Production and Open testing pages unlock.
- **Recruit testers** from personal and professional networks, target-audience communities and social media; aim for diverse testers; give clear instructions and a feedback channel.

## Staged rollouts

- **Updates only:** staged rollouts work on production and test tracks, but "Staged rollouts can only be used for app updates, not when publishing an app for the first time."
- **Random, sticky users:** new and existing users are eligible and are chosen at random for each new release rollout, and they aren't notified. The update may take time to reach the full group. Halting and resuming affects the same set of users, and a new staged release started before the previous one completes uses the same user group.
- **Nothing increases on its own:** in Play Console, Releases tab > Manage rollout > Update rollout > Confirm update.
- **Countries:** a staged rollout defaults to production countries; once it has started you can't remove any countries. With specific countries chosen, only users with Google Play accounts in those locations get it. Country availability options exist only when updating a production release.
- **With gplay:** `--rollout` is a fraction from 0.0 to 1.0 (0.1 is 10%), never a percent.
  - Start: `gplay release --package com.example.app --track production --bundle app-release.aab --rollout 0.1`, or promote with `gplay promote --package com.example.app --from beta --to production --rollout 0.25`.
  - Raise: `gplay rollout update --package ... --track production --rollout 0.5`.
  - Finish: `gplay rollout complete` (100%); `rollout update --rollout 1.0` also reaches 100%.
  - Read the current fraction: `gplay tracks get --package com.example.app --track production | jq '.releases[0].userFraction'`. (The rollout skill calls `tracks get` without `--edit`; the submission-checks skill passes `--edit`. Check `--help`.)
- **In the API:** a staged release has status `inProgress` with `userFraction` strictly between 0 and 1; `countryTargeting` applies only to `inProgress` releases on production.
- **After 100%:** update the store listing once the release reaches 100%. Monitor crashes and feedback throughout ([VITALS.md](VITALS.md)).

## Halting and resuming

- **Halt** in Play Console: Releases tab > Manage rollout > Halt rollout. With gplay: `gplay rollout halt`. In the API: set the release status to `halted`.
- **What a halt does:** no additional users receive the version; users who already received it stay on it.
- **Resume:** Manage rollout > Resume rollout, set the percentage, Confirm update (in the Play Console app: Staged rollout > Resume rollout > Resume). With gplay: `gplay rollout resume`.
- **If the bundle itself is broken,** don't resume it: roll out a new release with a fixed bundle.
- **Use the Console UI as a backup** for manual control.

## Rollback

- **Google Play doesn't support automatic rollback.**
- **Option 1:** a hotfix with a higher version code, released at 100%.
- **Option 2:** `gplay promote --from beta --to production` if the previous version is still on beta.

## Rollout schedules

These schedules and thresholds are the gplay rollout skill's recommendations, not Google rules. Google's bad-behaviour thresholds (user-perceived crash rate 1.09%, ANR rate 0.47%) are in [VITALS.md](VITALS.md).

| Schedule | Steps |
|---|---|
| Conservative, 7 days | 10%, 25% (day 2), 50% (day 3), 75% (day 5), complete (day 7) |
| Aggressive, 3 days | 25%, 50%, complete |
| Cautious, 10 days | 5%, 10% (day 2), 25% (day 3), 50% (day 5), 75% (day 7), complete (day 10) |

- **Release-flow strategies:** internal in week 1, promote to beta in week 2, promote to production at `--rollout 0.1` in week 3, then 0.5 on day 2 and complete on day 7. Or direct to production: 10% day 1, 25% day 2, 50% day 3, complete day 7 (not for a first release, which can't be staged). Or a full release with metadata, dry-run first.

| Signal during rollout | Action |
|---|---|
| Crash rate below 1% | Continue |
| Crash rate 1% to 2% | Halt, investigate |
| Crash rate above 2% | Halt, roll back if possible |
| Spike in 1-star reviews | Halt |
| ANR spike | Halt |
| No issues after 24 hours | Increase |

- **Do:** start below 20%; wait 24 hours between increases; have a hotfix plan and the team available; alert on crash rates; test in beta; update release notes; communicate the timeline.
- **Avoid:** jumping from 10% to 100%; ignoring crash increases; rolling out on weekends or holidays; skipping beta.
- **Gate promotions on vitals anomalies:** the CI gate in [VITALS.md](VITALS.md) halts promotion when `gplay vitals crashes anomalies` returns any.

- **Check crash rates during rollout:** Play Console > Quality > Android vitals. [gplay, rollout]

## Prove it

- For a new personal account: the closed test shows at least 12 testers opted in, none of them opted out and back in within the last 14 days, before you apply for production.
- After adding testers, `gplay testers get --edit $EDIT_ID --track <track>` on a fresh edit shows the new set, proving the commit happened.
- A tester's device installs the test version code; if it gets production instead, production's version code is higher.
- During a rollout, `gplay tracks get --package <pkg> --track production | jq '.releases[0].userFraction'` matches the step you set, and after `gplay rollout halt` no further users receive the build while existing ones keep it.
- The first production release went out without `--rollout` (staging only works for updates).
