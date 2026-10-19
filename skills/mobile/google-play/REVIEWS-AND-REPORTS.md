# Reviews and Reports

After launch, three loops keep an app healthy on Google Play: reading and replying to user reviews, asking for ratings and pushing updates from inside the app (the Play Core in-app review and in-app update APIs), and pulling installs, ratings and financial reports from Cloud Storage. The in-app review API decides little on its own: it reports nothing back and is quota-limited, so when you ask matters more than how. Review replies and report downloads here use the gplay CLI, whose author is third-party; the in-app APIs come from Google's Android docs. Releases are [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md), vitals [VITALS.md](VITALS.md), rollouts [TESTING-AND-ROLLOUT.md](TESTING-AND-ROLLOUT.md); CLI auth and service accounts are [CLI.md](CLI.md); ratings as a ranking lever are [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md).

## Review management (gplay CLI)

- **Commands:** `gplay reviews list --package [--paginate] [--output table] [--translation-language en-US]`; `reviews get --review REVIEW_ID`; `reviews reply --review REVIEW_ID --text "..."`.
- **JSON paths:** `.reviews[].rating`, `.reviewId`, `.comments[0].userComment.text`, `.comments[0].userComment.language`, `.comments[0].userComment.lastModified.time`. A review is unreplied when `(.comments | length == 1)`.
- **Date field conflict:** the review guide uses `comments[0].userComment.lastModified.time`; the rollout guide filters recent reviews with `select(.createdTime > "2025-02-05")`. Check which field your output carries before filtering by date.
- **Filters:**

| Want | jq |
|---|---|
| Rating 3 or below | `jq '.reviews[] \| select(.rating <= 3)'` |
| Crash reports | `jq '.reviews[] \| select(.comments[0].userComment.text \| test("crash\|freeze\|hang"; "i"))'` |
| Count by rating | `jq '[.reviews[] \| .rating] \| group_by(.) \| map({rating: .[0], count: length})'` |
| Average rating | `jq '[.reviews[].rating] \| add / length'` |
| Unreplied 1-star IDs | `jq -r '.reviews[] \| select(.rating == 1 and (.comments \| length == 1)) \| .reviewId'` |

- **Auto-reply:** pipe the unreplied 1-star IDs into `gplay reviews reply`.
- **Daily check:** cron `0 9 * * * /path/to/check-reviews.sh` alerting on unreplied reviews rated 2 or below.
- **Permissions:** the CLI author's permission lists include `CAN_REPLY_TO_REVIEWS` (per-app grant) and `CAN_REPLY_TO_REVIEWS_GLOBAL` (account-wide).

## In-app reviews

- **Where it runs:** "Android devices (phones, tablets, and TVs with Google TV) running Android 5.0 (API level 21) or higher that have the Google Play Store installed", and ChromeOS devices with the Play Store. Requires Play Core 1.8.0 or higher. Platforms: Kotlin/Java, Native, Unity, Unreal.
- **When to ask:** "after a user has experienced enough of your app or game to provide useful feedback". Don't prompt excessively. Don't ask any questions before or while presenting the card ("Do you like the app?", "Would you rate this app 5 stars").
- **Show the card as-is:** no size, opacity, shape or other changes, no overlay on or around it, keep the card and its background the topmost layer, and don't remove it programmatically (it goes on the user's action or an internal Play Store mechanism).
- **Quota:** time-bound. Calling `launchReviewFlow` "more than once during a short period of time (for example, less than a month) might not always display a dialog", and the quota "can be changed by Google Play without any notice". Don't trigger the API from a call-to-action such as a button; for that, redirect the user to the Play Store instead.
- **Dependencies:** `com.google.android.play:review:2.0.2` and `com.google.android.play:review-ktx:2.0.2`.
- **Flow:** `ReviewManagerFactory.create(context)`, then `requestReviewFlow()`, then `launchReviewFlow(activity, reviewInfo)`. `ReviewInfo` is valid for a limited time: pre-cache it only when you are sure you'll launch.
- **No result comes back:** "The API does not indicate whether the user reviewed or not, or even whether the review dialog was shown". Wait until the flow completes before continuing the normal user flow. "If an error occurs during the in-app review flow, do not inform the user or change your app's normal user flow."
- **Testing:** `FakeReviewManager(context)` for unit and integration tests (no UI). On the internal test track the account must be in the testers list, be the primary account selected in the Play Store, have the app in its library, and have no existing review; "The quota limits are not enforced if the app is downloaded from the internal test track." Through internal app sharing, reviews can't be submitted (the button is disabled). `FakeReviewManager` always returns a fake `ReviewInfo` and success.
- **Third-party pre-prompts:** Flutter sources ([ApparenceKit](https://apparencekit.dev/flutter-tips/get-app-reviews-smart-way/)) recommend asking "if the user is willing to provide feedback" before the card; Google's rule above wins on Play. The conflict is laid out in [aso RATINGS-AND-REVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/RATINGS-AND-REVIEWS.md#pre-prompt-questions-a-conflict).
- **Dialog doesn't show:** the app must be in the account's Play library; select the primary account in the Play Store; protected (for example enterprise) accounts: "Use a Gmail account instead"; already reviewed: "Delete the review directly from Play Store"; quota reached: use an internal test track or internal app sharing.

## In-app updates

- **Where it runs:** Android 5.0 (API level 21) or higher; "only supported for Android mobile devices, Android tablets, and ChromeOS devices". "not compatible with apps that use APK expansion files (`.obb` files)".
- **Two modes:**

| Mode | Behavior |
|---|---|
| Flexible | Background download and install; the user keeps using the app |
| Immediate | Fullscreen; the user must update and restart; Google Play handles install and restart; "best for cases where an update is critical to the core functionality" |

- **Dependencies:** `com.google.android.play:app-update:2.1.0`, `com.google.android.play:app-update-ktx:2.1.0`.
- **Check:** `AppUpdateManagerFactory.create(context)`, `appUpdateManager.appUpdateInfo`, `updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE`, `isUpdateTypeAllowed(AppUpdateType.IMMEDIATE or FLEXIBLE)`, `clientVersionStalenessDays()`.
- **Priority 0 to 5** (0 default, 5 highest), set with `inAppUpdatePriority` under `Edits.tracks.releases` in the Play Developer API. "Priority can only be set when rolling out a new release and cannot be changed later." "All newly-added versions in the release are considered to be the same priority as the release." Google's release body: `{"releases": [{"versionCodes": ["88"], "inAppUpdatePriority": 5, "status": "completed"}]}`. Read it with `updatePriority()`, which accounts for all version codes between installed and latest, irrespective of track (a priority 5 release on the internal track raises a production user's update from 1 to 3 to priority 5).
- **Start:** `startUpdateFlowForResult(appUpdateInfo, activityResultLauncher, AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build())`. "Each `AppUpdateInfo` instance can be used to start an update only once." To retry after a failure, request a new `AppUpdateInfo` and check again. `AppUpdateOptions` `setAllowAssetPackDeletion()` lets the update clear asset packs on low storage (default false).
- **Result codes:** `RESULT_OK` (accepted; immediate updates may never deliver it), `RESULT_CANCELED` (denied or canceled), `ActivityResult.RESULT_IN_APP_UPDATE_FAILED` (some other error).
- **Flexible completion:** register an `InstallStateUpdatedListener`; on `InstallStatus.DOWNLOADED` prompt the user and call `completeUpdate()` (in the foreground: a full-screen UI, then the app restarts into its main activity; in the background: "installed silently without obscuring the device UI"). Check for `DOWNLOADED` whenever the app comes to the foreground; "Otherwise, the update data continues to occupy the user's device storage."
- **Immediate resume:** on resume, if the state is `DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS`, resume the flow.
- **Cross-platform alternative:** a forced or soft update driven by a server config (minimum versions per platform, store URLs, a maintenance flag) works on iOS and Android alike and complements Play's Immediate mode [FlutterPro](https://flutterpro.design/details/forced-update); the Flutter version is in [flutter-ux APP-LIFECYCLE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter-ux/APP-LIFECYCLE.md#forced-update-soft-update-maintenance-mode).

## Downloading reports (gplay CLI)

Reports are not available through the REST API. They are CSV or ZIP files in Cloud Storage buckets named `pubsite_prod_rev_<id>` or `pubsite_prod_<id>` (varies by account: copy the exact URI).

- **Find the bucket ID** at Play Console > Download reports > Cloud Storage URI (for example `gs://pubsite_prod_rev_12110000881713004121/`); pass the full URI or the numeric ID. It is NOT the developer ID in the Console URL; using that gives `404 Not Found`.
- **Permissions:** financial reports need `VIEW_FINANCIAL_DATA` ("View financial data"); stats need `VIEW_APP_INFORMATION`. Cloud Storage access is granted automatically when the service account is added to Play Console with those permissions.
- **Prefixes:** financial `earnings/`, `sales/`, `payouts/`, `play_balance_krw/`, `wht_statements/`; stats `stats/installs/`, `stats/ratings/`, `stats/crashes/`, `stats/store_performance/`, `financial-stats/subscriptions/`.
- **Financial:** `gplay reports financial list|download --bucket-id <id> [--type earnings|sales|payouts|play_balance|wht_statements|all] [--from YYYY-MM] [--to YYYY-MM] [--dir ./reports]`. `list` defaults `--type` to `all`; `download` requires `--type` and `--from`; `--to` defaults to `--from`; `--dir` defaults to `.`.
- **Stats:** `gplay reports stats list|download --bucket-id <id> [--package] [--type installs|ratings|crashes|store_performance|subscriptions|all] ...`; `download` requires `--package`, `--type` and `--from`.
- **Filenames:** `earnings/earnings_YYYYMM_<id>.zip`, `sales/salesreport_YYYYMM.zip`, `payouts/payout_YYYYMM.csv`, `stats/installs/installs_<pkg>_YYYYMM_overview.csv`, `stats/ratings/ratings_<pkg>_YYYYMM_overview.csv`, `stats/crashes/crashes_<pkg>_YYYYMM_overview.csv`.

| Symptom | Fix |
|---|---|
| `authentication failed` | `gplay auth login --service-account <path>` |
| `403 Forbidden` | Invite the service account in Play Console with the permissions above |
| `404 Not Found` | Wrong bucket ID (likely the developer ID from the URL) |
| Empty list | No reports for that range |

## Prove it

- **No review goes unanswered:** `gplay reviews list --package ... | jq -r '.reviews[] | select(.rating == 1 and (.comments | length == 1)) | .reviewId'` prints nothing after the reply run.
- **The review prompt is gated:** the code calls `launchReviewFlow` only after a meaningful moment, never from a button, and the flow continues the same whether it succeeds or fails.
- **Review flow tested:** a test with `FakeReviewManager` passes, and an internal-test-track install shows the card.
- **Updates complete:** a flexible update on an internal-track build reaches `InstallStatus.DOWNLOADED` and `completeUpdate()` restarts the app; an immediate update resumes after backgrounding.
- **Reports download:** `gplay reports stats list --bucket-id <id> --type installs` lists files, and `gplay reports financial download --bucket-id <id> --type earnings --from YYYY-MM` writes a ZIP to `--dir`.
