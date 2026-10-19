# Build and release

Google Play takes an Android App Bundle (AAB), not an installable app: the bundle holds all compiled code and resources and defers APK generation and signing to Google Play, which serves optimized APKs per device configuration. So two keys matter: the upload key you sign the bundle with, and the app signing key Google holds through Play App Signing. Most release failures are a version code that isn't higher than every earlier one, a bundle signed with the wrong upload key, a target API level below the current floor, or a release left uncommitted or unsent for review. This applies to the Android side of Flutter and React Native projects too; Flutter build commands are in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

**Contents:** [App bundles](#app-bundles) · [Size limits](#size-limits) · [Gradle builds](#gradle-builds) · [Versions](#versions) · [Shrinking and mapping files](#shrinking-and-mapping-files) · [Play App Signing](#play-app-signing) · [Target API level](#target-api-level) · [Release with gplay](#release-with-gplay) · [Release notes](#release-notes) · [Track and release fields](#track-and-release-fields) · [Review and publishing](#review-and-publishing) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## App bundles

- **AAB is required for new apps:** since August 2021, new apps must publish with the Android App Bundle on Google Play. Since June 30, 2023 Google Play no longer supports TV app updates using APKs.
- **Bundles are only for publishing** and cannot be installed on devices. Test with Internal App Sharing, or `adb install-multiple *.apk` with APKs from the app bundle explorer.
- **No expansion files:** Android App Bundles do not support APK expansion (`*.obb`) files. In-app updates are also not compatible with apps that use `.obb` files.
- **Large apps:** new apps larger than 200MB can use Play Asset Delivery or Play Feature Delivery.
- **Known issues:** tools that dynamically modify resource tables can make bundle-generated APKs behave unexpectedly; disable them when building a bundle. Feature modules inherit some build config from the base module, so conflicts (for example `buildTypes.release.debuggable = true` in base and `false` in a feature module) can cause issues.
- **The package name is fixed** once you upload an artifact; it can't be changed.

## Size limits

Compressed download size, calculated by Play Console on upload. `bundletool` estimates are "similar (but not identical)".

| Item | Limit |
|---|---|
| Base module | 500MB |
| Each feature module | 500MB |
| Each asset pack | 1.5GB |
| All modules plus install-time asset packs | 4GB |
| On-demand or fast-follow asset packs, cumulative | 30GB |
| Total maximum per app | 34 GB |

- **The APKs needed to install** (base plus configuration APKs) must total no more than 4 GB compressed; on-demand feature module downloads meet the same limit. Asset packs don't count toward it but have their own limits.
- **Other limits:** apps larger than 1GB must target a minimum SDK of Android Lollipop (API 21) or higher. The maximum recommended number of feature modules is 100 for apps with a minimum SDK of Android Oreo (API 26) or higher, and 50 below that. An app bundle holds at most 100 asset packs. Above 200MB, users on mobile data see a non-blocking dialog about the app's size. Apps still publishing APKs are under the legacy APK limit (100MB maximum), not the table above.
- **App size page:** Monitor and improve > Android vitals > App size, after a production release.

## Gradle builds

- **Bundle:** `./gradlew bundleRelease` writes `app/build/outputs/bundle/release/app-release.aab`. Prefer AAB over APK.
- **APK (legacy):** `./gradlew assembleRelease` writes `app/build/outputs/apk/release/app-release.apk`.
- **Signing config in the app-level `build.gradle`,** with credentials from environment variables:

```groovy
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

- **Export `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` and `KEY_PASSWORD`** before `./gradlew bundleRelease`. Never commit keystores; `gplay preflight` reports a shipped `.jks`, `.keystore`, `.p12`, `.pfx`, `.pem` or `.ppk` as an error.
- **Product flavors:** `flavorDimensions "version"`, `free { dimension "version"; applicationIdSuffix ".free" }`, `paid { dimension "version" }`; build with `./gradlew bundleFreeRelease` or `./gradlew bundlePaidRelease`. `./gradlew bundle` builds all variants.
- **Other tasks:** `./gradlew clean bundleRelease`; `./gradlew bundleRelease -PminSdkVersion=21 -PtargetSdkVersion=34`; `./gradlew bundleRelease -x test -x lint`.
- **Test release builds before uploading.**

## Versions

- **Every build needs a version code strictly higher than all previous releases on every track.** "Version code already exists" is a common rejection: increment `versionCode` and rebuild. Check what's used with `gplay tracks list --package com.example.app --output table`, or `gplay tracks get --edit $EDIT_ID --track production --output table`.
- **Ceiling:** "To upload your app to Play Console, the greatest possible value for versionCode is 2100000000." Above it, Play Console prevents you from submitting a new app bundle, so pick codes that leave room to increase on every update. The Android MAXINT differs from this Play Console limit.
- **Keep versions in `gradle.properties`:** `VERSION_NAME=1.2.3`, `VERSION_CODE=123`, read in `defaultConfig { versionCode project.property('VERSION_CODE').toInteger(); versionName project.property('VERSION_NAME') }`.
- **Increment script** (macOS `sed -i ""`):

```bash
CURRENT_VERSION=$(grep VERSION_CODE gradle.properties | cut -d'=' -f2)
NEW_VERSION=$((CURRENT_VERSION + 1))
sed -i "" "s/VERSION_CODE=$CURRENT_VERSION/VERSION_CODE=$NEW_VERSION/" gradle.properties
./gradlew bundleRelease
```

- **Which build a device gets:** the highest version code compatible with the device that is published to a track the user is eligible for. Everyone is eligible for production, so a production release with a higher version code than a test track wins for testers too. See [TESTING-AND-ROLLOUT.md](TESTING-AND-ROLLOUT.md).

## Shrinking and mapping files

- **Enable R8 for release** (the gplay skill says R8 is default in AGP 3.4+): `minifyEnabled true`, `shrinkResources true`, `proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'`.
- **Upload the mapping file after every release.** It is at `app/build/outputs/mapping/release/mapping.txt`. Without it, Android vitals stack traces are obfuscated and unusable.

```bash
gplay deobfuscation upload \
  --package com.example.app \
  --edit $EDIT_ID \
  --apk-version 123 \
  --type proguard \
  --file app/build/outputs/mapping/release/mapping.txt
```

- **`deobfuscation upload` is edit-scoped:** it needs `--edit`, the version flag is `--apk-version` (not `--version-code`), and the edit must be committed afterwards.
- **"Deobfuscation file too large"** means the mapping file exceeds the 300 MB limit; strip or compress it.

## Play App Signing

- **Required for new apps** so they can use AABs. Google manages the app signing key, protected by Google's Key Management Service (KMS). Configuring Play App Signing requires admin permission.

| Key | Who holds it | Format and size |
|---|---|---|
| Upload key | You | Java keystore (`.jks` or `.keystore`); RSA 2048 bits or more. If lost or compromised, Google can reset it. |
| App signing key | Google | Public certificate `.der` or `.pem`; Google-generated keys are RSA 4096-bit, custom keys RSA 2048-bit or higher. |

- **Keep the two keys different** for maximum security.
- **"Signing key mismatch"** means the upload was not signed with the upload key configured in Play App Signing; sign with that key.
- **New apps** are automatically enrolled in quantum-ready hybrid signing with Google-generated keys: a classical RSA 4096-bit key plus a post-quantum ML-DSA-65 key, and Google generates a separate classical key for pre-Android 17 devices, so the app uses three distinct keys. Android 17+ devices verify with APK signature scheme v3.2. Create an upload key (Android Studio or `keytool`) and upload the bundle.
- **Changing the app signing key** is possible only before a release is rolled out in open testing or production: Protected with Play > Play Store distribution > Go to Play app signing > Change the app signing key.
- **Existing apps:** Go to Play app signing, accept the terms, transfer the original key with the PEPK tool; creating a new upload key is recommended. Apps created before August 2021 can use a "key upgrade" option, but then every release must upload both an app bundle and a legacy APK signed with the old key.
- **Register Google's key with API providers** (Google Maps, OAuth, Facebook Login): register the Google-held app signing key fingerprint, not just your local upload key. Copy the SHA-1 or SHA-256 from the App signing key section; with hybrid signing register all three keys. Put the same fingerprints in `assetlinks.json` for Android App Links.
- **Annual key upgrade:** if the app signing key is compromised or you need a cryptographically stronger key, you can request an annual key upgrade for all installs on Android 17 (API 37)+, where the hybrid key is enforced (Protected with Play > Play Store distribution > Go to Play app signing > Upgrade key, then register the new fingerprints). Android 13 to 16 enforce the latest classical key (v3.1). Android 7 to 12 don't enforce it, but Google Play Protect checks updates are signed with the latest classical key.
- **Reset a lost upload key:** create a new key and export its certificate, then Protected with Play > Play Store protection > Manage Play app signing > Request upload key reset, enter a reason and upload the PEM.

```bash
keytool -export -rfc -keystore upload-keystore.jks -alias upload -file upload_certificate.pem
```

- **Distributing outside Play:** download a signed universal APK (Test & release > Latest releases and bundles > the bundle > Downloads tab), or provide your own key to Google.
- **Manifest stamps:** Google's apksigner adds `com.android.stamp.source` and `com.android.stamp.type`. APK Signature Scheme v4 is used automatically for eligible apps (Android 11+), except apps on quantum-ready hybrid signing.

## Target API level

| Apps | Must target, for new apps and updates | From |
|---|---|---|
| Phone and mobile | Android 16 (API 36) | August 31, 2026 |
| Phone and mobile | Android 15 (API 35) | August 31, 2025 |
| Wear OS | API 35 | August 31, 2026 (API 34 from August 31, 2025) |
| Android Automotive OS | API 35 | August 31, 2026 (API 34 from August 31, 2025) |
| Android TV | API 34 | August 31, 2025 |
| Android XR | API 34 | August 31, 2026 |

- **Staying visible:** existing apps must target API 35+ by August 31, 2026 (Wear OS 34+, Android TV 33+, XR 34+, Automotive 12L / API 32+). Otherwise they stop being discoverable to Google Play users whose devices run an Android version newer than the app's target. Users who already installed the app can still discover, reinstall and use it; a user on a newer device following a deep link sees "this app is not available to install on their device because it was made for an older version of Android."
- **Extension:** you can request one to November 1, 2026. The form is on the details page of the warning or issue on the Policy status page in Play Console; impacted apps get the link via Notifications.
- **Exception:** permanently private apps restricted to one organization for internal distribution.
- **Uploads below the floor are rejected** ("APK/Bundle targets an SDK below the required level"); raise `targetSdkVersion`. Fix in Gradle (Kotlin DSL): `android { defaultConfig { targetSdk = 35  // set to Play's current floor or higher } }`.
- **Read the floor, don't recall it.** The gplay skills say Play raises it roughly every August to "latest release minus one" and that you should read the level from the `policy` scanner (`gplay preflight --file app-release.aab --only policy`, overridable with `--min-target-sdk 36` when Google's bump lands before a gplay release) or from Play's published requirement; the same skill's rejection table says "34 or higher", which is below Google's current floor. The table above is Google's, from https://support.google.com/googleplay/android-developer/answer/11926878; confirm it there.
- **Behaviour changes to check when raising the target:** targeting Android 12 (API 31), apps can't start foreground services from the background (except special cases; use WorkManager expedited work) and must not start activities from services or broadcast receivers used as notification trampolines. Since Android 10, users see a warning on first launch for apps targeting Android 5.1 (API 22) or lower. Check that third-party SDKs support the new level, and keep `targetSdkVersion` at or below the Support Library's major version.
- **Billing Library has its own deadline;** see [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md).

## Release with gplay

- **Preconditions:** credentials set, an AAB or APK built and signed, a version code higher than the previous one, and a service account with "Release Manager".
- **Internal:** `gplay release --package com.example.app --track internal --bundle app-release.aab`. Beta adds `--release-notes @release-notes.json`. A staged production release adds `--rollout 0.1`.
- **Flags:**

| Flag | Meaning |
|---|---|
| `--package` | Required |
| `--track` | `production`, `beta`, `alpha`, `internal`; default `internal` |
| `--bundle` or `--apk` | One, not both |
| `--release-notes` | See below |
| `--rollout` | Fraction 0.0 to 1.0 (0.1 is 10%, never a percent); default 1.0 |
| `--listings-dir`, `--screenshots-dir` | Push metadata and screenshots with the release |
| `--skip-metadata`, `--skip-screenshots` | Skip them |
| `--dry-run` | Run the pipeline against a real edit and discard it |
| `--output` | Output format |

- **Manual sequence** for full control: `gplay edits create` (capture the id with `EDIT_ID=$(gplay edits create --package com.example.app | jq -r '.id')`), then `gplay bundles upload --edit $EDIT_ID --file app-release.aab`, then `gplay tracks update --edit $EDIT_ID --track production --releases @releases.json`, then `gplay edits validate`, then `gplay edits commit`. `--releases` takes a JSON array of track releases or `@file`, for example `'[{"versionCodes":["123"],"status":"completed"}]'`.
- **Promote between tracks:** `gplay promote --package com.example.app --from internal --to beta`; `--from beta --to production --rollout 0.25`. Promotion copies the source track's version codes to the destination.
- **Pre-release checklist:** version code incremented; signed with the correct keystore; mapping file uploaded; release notes for all locales; tested on internal or beta; service account permissions; dry run passes.
- **Preflight and validation gates** before any upload: [POLICY-AND-PREFLIGHT.md](POLICY-AND-PREFLIGHT.md). Rollout schedules: [TESTING-AND-ROLLOUT.md](TESTING-AND-ROLLOUT.md). Store listing pushed with a release: [LISTING-AND-METADATA.md](LISTING-AND-METADATA.md).

## Release notes

- **One `--release-notes` flag** takes a JSON array (multi-locale), plain text (assigned `en-US`), or `@file` with either. There is no separate locale flag.

```json
[
  { "language": "en-US", "text": "Bug fixes and performance improvements" },
  { "language": "es-ES", "text": "Correcciones de errores y mejoras de rendimiento" },
  { "language": "fr-FR", "text": "Corrections de bugs et améliorations des performances" }
]
```

- **Shape conflict:** the release-flow skill specifies the `{language, text}` array above; the submission-checks skill passes an object keyed by locale (`'{"en-US": "Bug fixes and improvements"}'`). Check `gplay release --help`.
- **"Release notes missing for default locale"** is a rejection: include `--release-notes`.
- **Limit:** release notes are at most 500 characters (counted by `gplay preflight`).

## Track and release fields

Developer API `edits.tracks` fields, which gplay writes for you:

- **`versionCodes[]`:** "Must include version codes to retain from previous releases."
- **`status`:** `statusUnspecified`, `draft` (not served), `inProgress` (served to `userFraction`), `halted` (no longer served; users who already have it are unaffected), `completed` (no further changes; served to all users, unless they are eligible to APKs of a more recent release).
- **`userFraction`:** `0 < fraction < 1`, only when status is `inProgress` or `halted`.
- **`countryTargeting`:** only for `inProgress` releases on production.
- **`inAppUpdatePriority`:** range [0, 5], 5 the highest, default 0; it can't be updated once the release is rolled out. The app reads it with `updatePriority()`.
- **`name`:** not required to be unique; if unset it is generated from the APK's versionName (or the date for a release with multiple APKs).
- **`releaseNotes[]`** are `{ "language", "text" }` objects with a BCP-47 tag; **`track`** for form factors takes a prefix such as `wear:production`.

## Review and publishing

- **Changes are not sent for review automatically:** they collect in "Changes not yet sent for review" on the Publishing overview page. A commit with `changesNotSentForReview` lands there too when a rejection happens. A commit while other changes are in review cancels that review and sends everything by default (`changesInReviewBehavior`, see [CLI.md](CLI.md#the-developer-api-underneath)).
- **Standard publishing** (default) publishes updates as soon as possible after approval. **Managed publishing** holds approved changes until you publish them.
- **Review time:** for certain developer accounts Google takes more time, up to seven days or longer in exceptional cases; certain apps get expanded reviews of up to 7 days or longer. Updates may take several days (in some cases up to 7 days) to reach all devices.
- **Statuses:** App status (Draft, Internal testing, Closed testing, Open testing, Pre-registration, Production, No active releases, Unpublished, Removed by Google, Suspended by Google; a removed app is reinstated by a policy-compliant update, a suspended one only by a successful appeal); Update status (No pending changes, In review, Update rejected, App rejected, Changes not yet sent for review, Previous); Item status.
- **Review is not a troubleshooting step:** submitting non-compliant apps for reviewers to find issues leads to rejections, review delays and longer appeals.

- **Before the real release:** use `--dry-run` and upload the deobfuscation file after each release. [gplay, build-and-release]

## Troubleshooting

- **Keystore:** `keytool -list -v -keystore release.keystore`.
- **Inspect a bundle:** `bundletool build-apks --bundle=app-release.aab --output=output.apks --mode=universal`, then `unzip output.apks`.
- **Find version tasks:** `./gradlew tasks --all | grep Version`.

## Prove it

- `./gradlew bundleRelease` produces `app/build/outputs/bundle/release/app-release.aab`, and `keytool -list -v -keystore release.keystore` shows the alias Play App Signing expects as the upload key.
- The new `versionCode` is higher than every code `gplay tracks list --package <pkg> --output table` shows on any track.
- `gplay preflight --file app-release.aab --only policy` reports no target SDK finding, and the target matches the table in Google's current requirement.
- `gplay release ... --dry-run` succeeds before the real release; after it, the release is in review or published, not sitting in "Changes not yet sent for review".
- The mapping file for the new version code is uploaded, and the App signing key fingerprints (all three with hybrid signing) are registered with Maps, OAuth and `assetlinks.json`.
