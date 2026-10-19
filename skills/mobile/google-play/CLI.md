# The gplay CLI and the Developer API

`gplay` is a third-party command-line client for the Google Play Developer API (not a Google tool). Edit-managed publishing writes go through a copy of the app's current published state that you change, validate and commit; methods for `inappproducts`, `products` and `subscriptions` take effect immediately even when no edit is open. The old introduction said every write waited for an edit commit. [https://developers.google.com/android-publisher/edits] Most failures come from that model (an edit invalidated by another edit or a Console change, a missing commit) or from a service account that lacks the right Play Console permission. Where the gplay skills and Google's docs differ, Google's docs are the authority; both are stated below.

**Contents:** [Install and discover](#install-and-discover) · [Flags and output](#flags-and-output) · [Auth with a service account](#auth-with-a-service-account) · [Profiles and environment](#profiles-and-environment) · [Edits](#edits) · [The Developer API underneath](#the-developer-api-underneath) · [Users and grants](#users-and-grants) · [Migrating from fastlane](#migrating-from-fastlane) · [Other commands](#other-commands) · [Prove it](#prove-it)

## Install and discover

- **Update in place:** `gplay update` installs the latest version; `gplay update --check` checks without installing. Set `GPLAY_NO_UPDATE` to turn off update checks. (The findings carry no first-install command; follow the gplay project's own install instructions.)
- **Discover with `--help` at every level:** `gplay --help`, `gplay tracks --help`, `gplay tracks list --help`. Confirm a flag with `--help` before using it; the skills record several commands and flags that do not exist.
- **Top-level commands:** `auth`, `apps`, `init`, `release`, `promote`, `rollout`, `tracks`, `bundles`, `edits`, `listings`, `images`, `sync`, `validate`, `vitals`, `users`, `grants`, `reports`, `docs generate`, `migrate`, `notify`, `update`.
- **Other command groups:** `onetimeproducts`, `purchase-options`, `iap`, `subscriptions`, `baseplans`, `offers`, `otp-offers`, `pricing`, `purchases`, `orders`, `rtdn`, `reviews`, `testers`, `details`, `deobfuscation`, `data-safety`, `preflight`, `checks`, `publish`.
- **Project setup:** `gplay init --package com.example.app --service-account /path/to/sa.json`.
- **List apps:** `gplay apps list`, with `--output table` and `--paginate`.

## Flags and output

- **Explicit long flags:** use `--package`, `--output` and so on. There are no interactive prompts.
- **Destructive operations require `--confirm`.** Without it they refuse.
- **`--paginate` fetches all pages.**
- **`--dry-run` previews write commands** (`release`, `migrate` and others). The gplay skills disagree on where it goes: the pricing skill says it is a global flag placed before the subcommand (`gplay --dry-run subscriptions update ...`) and that `gplay subscriptions update --dry-run ...` fails with "flag provided but not defined"; the release, CLI and migrate skills show it after the subcommand (`gplay release ... --dry-run`, `gplay migrate fastlane ... --dry-run`). Check `--help` for the command you run.
- **Output:** minified JSON by default; `--output table` or `--output markdown` for humans; `--pretty` only with JSON; `GPLAY_DEFAULT_OUTPUT=table` changes the default.
- **Pipe JSON into jq:**

```bash
gplay tracks list --package com.example.app | jq '.tracks[] | select(.track == "production")'
```

## Auth with a service account

- **Create the service account on Google's side first:** create a Google Cloud project, enable the Google Play Developer API, set up a service account, then invite the service account's email on Play Console **Users and permissions** with the permissions it needs. You no longer need to link the developer account to a Google Cloud project to use the API.
- **Billing APIs need two more permissions** on the service account: "View financial data, orders, and cancellation survey responses" and "Manage orders and subscriptions".
- **Keep service accounts in a secure environment, such as your server.** `gplay preflight` flags service-account JSON inside an artifact as an error.
- **Log in with the key:** `gplay auth login --service-account /path/to/sa.json`. Fallback: set `GPLAY_SERVICE_ACCOUNT` (and `GPLAY_PACKAGE` for the default package). In CI, use `GPLAY_SERVICE_ACCOUNT`.
- **OAuth scope:** `https://www.googleapis.com/auth/androidpublisher`.
- **Permissions per job:**

| Job | Permission the service account needs |
|---|---|
| Releases, rollouts, submission checks | "Release Manager" |
| `gplay vitals` | "View app information and download bulk reports" |
| `gplay users` and `gplay grants` | `CAN_MANAGE_PERMISSIONS_GLOBAL` |
| Financial reports | `VIEW_FINANCIAL_DATA` ("View financial data") |
| Stats reports | `VIEW_APP_INFORMATION` |

- **Auth errors:** `authentication failed` means run `gplay auth login --service-account <path>`; `403 Forbidden` means the service account isn't invited in Play Console with the needed permissions.

## Profiles and environment

```bash
# Create/login a named profile
gplay auth login --profile production --service-account /path/to/prod-sa.json
# Switch the active profile
gplay auth switch --profile production
gplay --profile production tracks list --package com.example.app
```

| Variable | Meaning |
|---|---|
| `GPLAY_SERVICE_ACCOUNT` | Path to the service account JSON |
| `GPLAY_PACKAGE` | Default package name |
| `GPLAY_PROFILE` | Active profile name |
| `GPLAY_TIMEOUT` | Request timeout (`90s`, `2m`); `GPLAY_TIMEOUT_SECONDS` in seconds |
| `GPLAY_UPLOAD_TIMEOUT` | Upload timeout (`5m`, `10m`); `GPLAY_UPLOAD_TIMEOUT_SECONDS` in seconds |
| `GPLAY_DEBUG` | Debug logging; `api` logs HTTP requests |
| `GPLAY_NO_UPDATE` | Disable update checks |
| `GPLAY_MAX_RETRIES` | Default 3 |
| `GPLAY_RETRY_DELAY` | Base retry delay, default `1s` |
| `GPLAY_DEFAULT_OUTPUT` | `json`, `table` or `markdown` |

- **Debug a call:** `GPLAY_DEBUG=1 gplay tracks list --package com.example.app`; `GPLAY_DEBUG=api ...` for HTTP details.

## Edits

- **The write model:** `gplay edits create` returns an edit id, you make changes against it (for example `gplay bundles upload --edit <edit_id> --file app.aab`), and `gplay edits commit` publishes them.
- **Capture the id:** `EDIT_ID=$(gplay edits create --package com.example.app | jq -r '.id')`.
- **Validate before every commit:** `gplay edits validate --package ... --edit $EDIT_ID`. It is the server-side check that catches what local validation cannot.
- **High-level versus manual:** `gplay release` creates the edit, uploads and commits for you; the manual `edits create`, `bundles upload`, `edits commit` sequence gives fine-grained control. Tester changes and image writes also go through an edit and are inert until the commit.
- **One open edit per user:** each user may have only a single edit open at a time. Creating a new edit invalidates any existing edit you have open, and if anyone commits an edit or makes changes to the app through the Play Console, all other edits for the app (owned by any user) are invalidated. Committing an invalid edit throws an exception and has no effect. If anyone changes the app in the Play Console while your edit is in progress, your edit is discarded and the Console changes take effect.
- **Not everything uses edits:** methods for the `inappproducts`, `products` and `subscriptions` resources take effect immediately, whether or not an edit is open.
- **The API only changes an existing app:** at least one APK must already be uploaded through the Play Console. The API can't change an app from published to unpublished or fill out the legal consents required for publishing; use the Play Console for those.
- **Commits are not instant:** committed changes can take several hours to take effect.

## The Developer API underneath

- **Bundle upload:** `POST https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{packageName}/edits/{editId}/bundles`. A timeout of 2 minutes is recommended. `ackBundleInstallationWarning` is deprecated; `deviceTierConfigId` accepts an id or `"LATEST"`.
- **Commit:** `POST https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/edits/{editId}:commit` with an empty body. `changesNotSentForReview`: when a rejection happens, the changes in this edit won't be reviewed until they are explicitly sent for review from the Play Console UI, and they join any other changes not yet sent for review.
- **Changes already in review:** `changesInReviewBehavior` defaults to `CANCEL_IN_REVIEW_AND_SUBMIT`, which cancels the review in progress and sends all changes for publishing. `ERROR_IF_IN_REVIEW` instead returns a 400 (`FAILED_PRECONDITION`, reason `CHANGES_ALREADY_IN_REVIEW`) without invalidating the edit.
- **Track and release fields:** `track`, `releases[]`, `name`, `versionCodes[]` ("Must include version codes to retain from previous releases"), `releaseNotes[]`, `status`, `userFraction`, `countryTargeting`, `inAppUpdatePriority`. Form factor tracks have a prefix, for example `wear:production`, `automotive:production`. Their rules are in [BUILD-AND-RELEASE.md](BUILD-AND-RELEASE.md) and [TESTING-AND-ROLLOUT.md](TESTING-AND-ROLLOUT.md).
- **Signing endpoints:** `enrollApp` and `rotateAppSigningKey` exist only for self-hosted Google Cloud KMS, which Google calls a non-standard setup that is not encouraged.
- **Quotas:** the default is 3000 queries per minute for each bucket (Subscriptions, Subscription Updates, One-time Purchases, Orders, ExternalTransactions, and the Publishing, Monetization and Reply to Reviews APIs). Monitor in Google Cloud Console Quotas; request more at https://support.google.com/googleplay/android-developer/contact/apiqr.
- **Vitals use a different API:** `gplay vitals` calls the Play Developer Reporting API, not the Android Publisher API. See [VITALS.md](VITALS.md).

## Users and grants

- **Two scopes:** `gplay users` sets account-wide permissions (`*_GLOBAL`, `CAN_SEE_ALL_APPS`); `gplay grants` sets per-app permissions. Prefer per-app grants (least privilege).
- **Every command needs `--developer DEVELOPER_ID`** (not `--developer-id`). The id is in the Console URL: `play.google.com/console/u/0/developers/<DEVELOPER_ID>/...`. If an app moves to another developer account, its Developer ID changes; use the new account's id in API calls for that app.
- **No `--role` or `--permissions` flag:** pass permissions with `--json` (inline or `@file`). Users take the key `developerAccountPermissions`; grants take `appLevelPermissions`. `update` accepts `--update-mask`. An optional `expirationTime` is RFC 3339.
- **Deletion is irreversible** and requires `--confirm`.
- **Commands:** `users list [--paginate --page-size 50] [--output table]`; `users create|update|delete --email`; `grants create|update|delete --email --package`.
- **Account permissions:** `CAN_SEE_ALL_APPS`, `CAN_VIEW_FINANCIAL_DATA_GLOBAL`, `CAN_MANAGE_PERMISSIONS_GLOBAL`, `CAN_EDIT_GAMES_GLOBAL`, `CAN_PUBLISH_GAMES_GLOBAL`, `CAN_REPLY_TO_REVIEWS_GLOBAL`, `CAN_MANAGE_PUBLIC_APKS_GLOBAL`, `CAN_MANAGE_TRACK_APKS_GLOBAL`, `CAN_MANAGE_TRACK_USERS_GLOBAL`, `CAN_MANAGE_PUBLIC_LISTING_GLOBAL`, `CAN_MANAGE_DRAFT_APPS_GLOBAL`, `CAN_CREATE_MANAGED_PLAY_APPS_GLOBAL`, `CAN_CHANGE_MANAGED_PLAY_SETTING_GLOBAL`, `CAN_MANAGE_ORDERS_GLOBAL`.
- **App permissions:**

| Permission | Grants |
|---|---|
| `CAN_ACCESS_APP` | Base access |
| `CAN_VIEW_FINANCIAL_DATA` | Financial data |
| `CAN_MANAGE_PERMISSIONS` | Permissions |
| `CAN_REPLY_TO_REVIEWS` | Review replies |
| `CAN_MANAGE_PUBLIC_APKS` | Production releases |
| `CAN_MANAGE_TRACK_APKS` | Test tracks |
| `CAN_MANAGE_TRACK_USERS` | Testers |
| `CAN_MANAGE_PUBLIC_LISTING` | Store listing |
| `CAN_MANAGE_DRAFT_APPS` | Draft apps |
| `CAN_MANAGE_ORDERS` | Orders |

- **Recipes for `appLevelPermissions`:** viewer `["CAN_ACCESS_APP"]`; release manager `["CAN_ACCESS_APP","CAN_MANAGE_PUBLIC_APKS","CAN_MANAGE_TRACK_APKS","CAN_MANAGE_TRACK_USERS","CAN_MANAGE_DRAFT_APPS"]`; finance `["CAN_ACCESS_APP","CAN_VIEW_FINANCIAL_DATA","CAN_MANAGE_ORDERS"]`. Account-wide finance (`developerAccountPermissions`): `["CAN_SEE_ALL_APPS","CAN_VIEW_FINANCIAL_DATA_GLOBAL"]`.
- **Onboard** with `{"developerAccountPermissions":[]}` and then a per-app grant. **Offboard** with `users delete --confirm`. **Audit** with `users list --paginate --output table`.
- **Enforce 2-Step Verification for all Play Console users.**

## Migrating from fastlane

- **Convert the metadata tree:** `gplay migrate fastlane --source ./fastlane/metadata/android --output-dir ./metadata`. `--source` and `--output-dir` are required; `--dry-run` previews; `--locales en-US,es-ES,fr-FR` limits locales (all by default).
- **What changes:** `title.txt`, `short_description.txt`, `full_description.txt` and `video.txt` consolidate into `<locale>/listing.json`; `changelogs/` and `images/` are copied as they are. The output targets gplay's file-based `metadata pull`, `metadata push` and `metadata validate`.
- **Command equivalents:**

| fastlane | gplay |
|---|---|
| `fastlane supply init` | `gplay sync export-listings --dir ./metadata` |
| `fastlane supply` | `gplay sync import-listings --dir ./metadata` |
| `fastlane supply --skip_upload_images` | `gplay sync import-listings --dir ./metadata` |
| `fastlane supply --track beta` | `gplay release --track beta --bundle app.aab` |
| `fastlane supply --track production --rollout 0.1` | `gplay release --track production --bundle app.aab --rollout 0.1` |

- **Migrate safely:** dry-run first; migrate locale by locale; keep the fastlane source until the output is verified; run `gplay validate listing` afterwards; replace CI commands one at a time; keep the output in version control.
- **Listing fields and images** after migration: [LISTING-AND-METADATA.md](LISTING-AND-METADATA.md).

## Other commands

- **Generate a command reference:** `gplay docs generate --output-file ./GPLAY.md`; `--output-file -` writes to stdout.
- **Notify a channel:** `gplay notify send --webhook-url https://hooks.slack.com/... --message "Release deployed"`.
- **Elsewhere in this skill:** purchases and products in [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md), regional prices in [PRICING.md](PRICING.md), reviews and bulk reports in [REVIEWS-AND-REPORTS.md](REVIEWS-AND-REPORTS.md). The App Store side is [app-store-connect SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/app-store-connect/SKILL.md).

## Prove it

- `gplay apps list --output table` lists the app with the service account you configured, and `gplay tracks list --package <pkg> --output table` returns the tracks.
- `GPLAY_DEBUG=api gplay tracks list --package <pkg>` shows the HTTP calls succeeding, with no `403`.
- A test edit created with `gplay edits create` passes `gplay edits validate`; no other job holds an open edit for the same app while you commit.
- `gplay users list --developer <id> --paginate --output table` shows each person with only the per-app grants their job needs.
- After a fastlane migration, `gplay migrate fastlane ... --dry-run` reports what it will write, and `gplay validate listing --dir ./metadata` passes on the output.
