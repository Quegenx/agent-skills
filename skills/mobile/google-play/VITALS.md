# Android vitals and pre-launch reports

Android vitals is Google Play's measure of an app's stability and resource use on real devices, and its core vitals affect the app's visibility on Google Play. Play compares each core vital, as a 28-day average checked daily, against fixed bad-behaviour thresholds; an app over a threshold may get reduced visibility and a warning on its store listing. Pre-launch reports are the other half: Google's test lab runs every uploaded build on real devices before review. Both read the same crashes, so upload the mapping file for every release, or the stack traces are obfuscated and unusable ([BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md#shrinking-and-mapping-files)).

**Contents:** [Core vitals and thresholds](#core-vitals-and-thresholds) · [Memory thresholds](#memory-thresholds) · [How Play enforces them](#how-play-enforces-them) · [Where to read vitals](#where-to-read-vitals) · [Vitals from the CLI](#vitals-from-the-cli) · [Release workflow and CI gate](#release-workflow-and-ci-gate) · [Pre-launch reports](#pre-launch-reports) · [Prove it](#prove-it)

## Core vitals and thresholds

- **Core vitals:** stability (user-perceived crash rate and user-perceived ANR rate, all apps), battery (excessive partial wake locks for all apps, excessive battery usage for watch face apps) and memory (memory usage and bitmap memory usage, all mobile apps). DEX Code Optimization alerts may also affect visibility.

| Metric | Overall | Per phone model | Per watch model |
|---|---|---|---|
| User-perceived crash rate | 1.09% | 8% | 4% |
| User-perceived ANR rate | 0.47% | 8% | 5% |
| Excessive battery usage (Wear OS watch faces) | 1% | | 1% |
| Excessive partial wake locks | 5% | | |

- **Definitions:**
  - User-perceived crash rate: % of daily users with at least one user-perceived crash.
  - User-perceived ANR rate: % of daily active users with at least one user-perceived ANR. Only "input dispatching timed out" ANRs count.
  - Excessive partial wake locks: "More than 5% of battery sessions have experienced one or more partial wake locks totalling more than 3 hours".
  - Watch-face excessive battery: sessions where battery use exceeds 4.44% per hour.
- **Wake-lock conflict:** the Android developers vitals page lists excessive partial wake locks as a core vital affecting visibility; the Play Console Help page marks the metric beta and says "While the metric is in beta, this won't make your app less discoverable on Google Play." Confirm in the current docs.
- **Track ANRs separately from crashes;** the gplay skill says they weigh heavily on Play ranking.

## Memory thresholds

- **Memory usage is Anonymous RSS + Swap.** Thresholds vary by device RAM tier and app state, and differ for apps and games. Examples for apps:

| Device RAM | Foreground | User-Perceived Services | Background |
|---|---|---|---|
| 4 GB (3200 to 4800 MB) | 2.00 GB | 1.00 GB | 1.00 GB |
| 6 GB (4800 to 6800 MB) | 2.25 GB | 1.25 GB | 1.25 GB |
| 8 GB (6800 to 9216 MB) | 2.25 GB | 1.50 GB | 1.50 GB |
| 12 GB (9216 to 14336 MB) | 3.25 GB | 1.75 GB | 1.75 GB |
| 16 GB (14336 to 18432 MB) | 4.25 GB | 2.00 GB | 2.00 GB |

- **Games** have higher limits: 4 GB 2.25 / 2.00 / 2.00 GB; 6 GB 2.75 / 2.50 / 2.50; 8 GB 3.50 / 2.75 / 2.75; 12 GB 4.00 / 3.20 / 3.20; 16 GB 5.00 / 3.50 / 3.50 (foreground / user-perceived services / background). Below 4 GB and above 18432 MB no threshold is listed.
- **Bitmap memory thresholds** are the same across RAM tiers but vary by app state: 200 MB foreground, 200 MB user-perceived services, 400 MB background, for apps and games.
- **DEX Code Optimization** (keep above): apps with more than 10 MB of DEX code and games with more than 50 MB need at least 25% optimization, obfuscation and shrinking.
- **Coming:** "Apps exceeding the thresholds for memory usage, bitmap memory usage, or code optimization may see store visibility impact starting from February 2027."

## How Play enforces them

- **Consequences:** "Play may reduce the visibility of your title. Play may also show users a warning on your store listing." The Play Console Help page adds that bad behaviour on specific device models steers users on those devices away from the app towards more suitable ones.
- **Window:** "Play uses the last 28 days of data", checked daily on a 28-day average. Warnings disappear when the average improves; store listing warnings may be removed faster if Play detects improvement. Play "may act sooner in the event of a spike".
- **Core value:** when DAU/MAU doesn't meet the 8% threshold, a warning may be shown on the store listing and the app may not be eligible to appear on certain surfaces on Google Play. DAU are people who open the app at least once in a day; MAU at least once in 28 days.
- **Sessions:** a user session is the usage in a 24-hour period starting at midnight Pacific Time. Rates are per daily user on one device, so they differ from tools that count per app session.
- **Minimum functionality policy** also bars apps that crash, force close or freeze ([POLICY-AND-PREFLIGHT.md](POLICY-AND-PREFLIGHT.md#other-policy)).

## Where to read vitals

- **Play Console:** Monitor and improve > Android vitals > Overview (the gplay rollout skill names it Quality > Android vitals). Console data covers the previous 90 days. App size is at Monitor and improve > Android vitals > App size.
- **Play Developer Reporting API:** programmatic access with data for three years. It is separate from the Android Publisher API that releases use.

## Vitals from the CLI

- **Preconditions:** the service account needs "View app information and download bulk reports". Small apps return empty sets. JSON is the default output; dates are ISO `YYYY-MM-DD`.
- **Exactly three groups exist.** There is no `crashes list/get`, `errors list/get`, `performance overview/permissions`, `--cluster-id`, `--version-code`, `--start-time/--end-time`, `--severity` or `--error-id`.

| Command | Use |
|---|---|
| `vitals crashes query --from --to [--type crash\|anr] [--dimension versionCode\|deviceModel\|deviceBrand\|apiLevel\|countryCode] [--paginate]` | Crash and ANR rate metrics |
| `vitals crashes anomalies [--type crash\|anr\|errors\|performance\|all] [--limit 1 to 1000] [--from --to]` | Anomalies; `--type` defaults to `all`, `--limit` to 50, window to the last 7 days. The release gate. |
| `vitals performance startup\|rendering\|battery [--dimension apiLevel\|deviceModel\|country]` | Startup; rendering (slow 16ms and frozen 700ms frame rates); battery with `--type wakeup\|wakelock` |
| `vitals errors issues` | Grouped issues; `--order-by errorReportCount\|distinctUsers asc\|desc` (issues only) |
| `vitals errors reports` | Individual reports with stack traces |

- **Filter errors** with AIP-160 `--filter`: `errorIssueType` (`CRASH`, `ANR`, `NON_FATAL`), `apiLevel`, `versionCode`, `deviceModel`, `deviceBrand`, `deviceType`, `appProcessState` (`FOREGROUND`, `BACKGROUND`), `isUserPerceived`; reports also take `errorIssueId` and `errorReportId`.
  - `--filter 'errorIssueType = CRASH AND versionCode = 105 AND appProcessState = FOREGROUND'`
  - `--filter 'errorIssueId = 1234567890' --page-size 20`
- **jq paths:** `.errorIssues[0].name`; `.anomalies | length`. Field names vary by endpoint, so inspect with `--pretty` first.

## Release workflow and CI gate

- **After every release:** check anomalies; confirm with `crashes query` for `crash` and `anr` with `--dimension versionCode`; triage issues by report count; drill into reports; track ANRs on their own.
- **Gate promotion on anomalies:**

```bash
ANOMALIES=$(gplay vitals crashes anomalies \
  --package com.example.app --type all --from "$RELEASE_DATE" \
  | jq '.anomalies | length')

if [ "$ANOMALIES" -gt 0 ]; then
  echo "Vitals anomalies detected ($ANOMALIES). Halting promotion."
  exit 1
fi

gplay promote --package com.example.app --from beta --to production --rollout 0.1
```

- **During a staged rollout,** halt on a crash or ANR spike. The gplay rollout skill's matrix: crash rate below 1% continue, 1% to 2% halt and investigate, above 2% halt and roll back if possible. Those numbers are the skill's, not Google's; Google's overall bad-behaviour threshold is 1.09% for crashes and 0.47% for ANRs. Halting and rollback: [TESTING-AND-ROLLOUT.md](TESTING-AND-ROLLOUT.md#halting-and-resuming).
- **Bulk crash CSVs** (`stats/crashes/`) come from the reports buckets: [REVIEWS-AND-REPORTS.md](REVIEWS-AND-REPORTS.md).

## Pre-launch reports

- **What runs:** Google's test lab installs the app on devices, launches and crawls it, and tests for stability, Android compatibility, performance and accessibility issues. The gplay submission-checks skill adds that it surfaces crashes on launch, security vulnerabilities (known CVEs), accessibility issues (missing content descriptions, small touch targets) and performance warnings (slow startup, excessive wake locks).
- **When:** generated automatically when you upload an app bundle or APK or save a production release, "subject to capacity within our device lab". Check it after uploading to any track and fix critical issues before promoting.
- **Devices:** Android 9 and above; phones, tablets, Wear OS and Chromebooks. Android TV and Automotive OS can't be tested. Test devices are in the United States.
- **The crawl:** a Robo crawler types, taps and swipes "for several minutes". Results usually arrive within an hour, in some cases several hours after upload; if not complete after two days, re-upload to trigger a new report.
- **Sign-in:** provide test-account credentials for sign-in screens (reused for future tests); Sign in with Google logs in automatically. Robo scripts recorded with the Firebase tool in Android Studio run first; games use Game Loops.
- **Coverage:** up to three deep links, each crawled for a further 30 seconds; up to five languages.
- **Limits:** no tests without a main launch activity (including launchers, widgets, keyboards and watch faces); obfuscated builds still run but their stack traces stay obfuscated without a deobfuscation file; root-checking apps are unsupported; test devices can't make purchases.

## Prove it

- The mapping file for the current version code is uploaded, and a crash in `gplay vitals errors reports` shows readable class and method names.
- `gplay vitals crashes query --from <date> --to <date> --type crash --dimension versionCode` and the same with `--type anr` put the new version below 1.09% and 0.47% overall.
- `gplay vitals crashes anomalies --package <pkg> --type all --from "$RELEASE_DATE"` returns zero anomalies before each rollout increase or promotion.
- Android vitals > Overview shows no bad-behaviour warning for crash rate, ANR rate or memory.
- The pre-launch report for the latest upload has run (re-upload if nothing after two days), its crawl got past sign-in with the test account, and it lists no crashes on launch.
