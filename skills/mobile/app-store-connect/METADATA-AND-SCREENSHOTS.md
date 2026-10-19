# App Store metadata and screenshots

The text, screenshots, previews and creative assets of an App Store product page, kept in files and synced with the `asc` CLI. Two things decide most outcomes: whether a field belongs to the app-info record (name, subtitle, privacy URLs) or to a version (description, keywords, What's New, screenshots), and whether every write was pulled, validated and dry-run against explicit IDs before it went remote. Version fields only reach users through a submission, except promotional text. For keyword choice and listing optimization read [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md); for Apple Ads read [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md). Facts about the `asc` CLI come from its third-party authors (rorkai); where they differ from Apple's docs, both are given.

**Contents:** [asc ground rules](#asc-ground-rules) · [Field limits](#field-limits) · [Review rules for metadata](#review-rules-for-metadata) · [Sync metadata with asc metadata](#sync-metadata-with-asc-metadata) · [Localize metadata](#localize-metadata) · [What's New and promotional text](#whats-new-and-promotional-text) · [Screenshots](#screenshots) · [App previews](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/VISUALS.md#app-preview-specs-app-store) · [Creative assets and the Asset Library](#creative-assets-and-the-asset-library) · [Custom product pages](#custom-product-pages) · [Prove it](#prove-it)

## asc ground rules

- **Authenticate first:** `asc auth login`, or the `ASC_*` environment variables.
- **Find the app ID:** `asc apps list --output table`; by name `asc apps list --name "AppName"`; by bundle `asc apps list --bundle-id "com.example.app"`. Set a default with `export ASC_APP_ID="APP_ID"`.
- **Confirm flags with `--help` for the installed version** (`asc localizations --help`, `asc localizations upload --help`, `asc apps info edit --help`). Prefer explicit long flags: `--app`, `--version`, `--version-id`, `--type`, `--app-info`.
- **Set `--output` when format matters.** Output is TTY-aware: a table in an interactive terminal, JSON in CI, pipes and non-interactive runs. Use `--output table` for human checks and JSON for automation; add `--pretty` to debug JSON and `--paginate` to fetch every page.
- **Operate on IDs, never on "the first row".** Do not `head -1` a list unless the user agrees; resolve names to IDs first.
- **Validate and dry-run before every remote write:** `asc metadata validate`, then `--dry-run` where supported.
- **Keep going on per-item failures.** Log each failed item or locale, finish the rest, and report every failure together at the end.
- **A receipt is not approval.** A successful submit, upload or placement does not mean approved or published; read the state back.
- **Treat `403 FORBIDDEN_ERROR` as possibly real.** Check the selected profile, app access and role before calling it transient. One 403 is no reason to rotate credentials. Retry reads with bounded backoff only when recent successful calls support a transient cause. Before repeating an uncertain create or upload, list the existing resource and inspect its delivery state.

## Field limits

| Field | Record | Limit and rules |
|---|---|---|
| Name | App info | At least 2 and at most 30 characters. One name per localization, unique on the store (if another developer uses it and you hold the trademark, submit a claim). Editable until submission; later changes need a new version. |
| Subtitle | App info | 30 characters. |
| Privacy Policy URL | App info | Required for iOS and macOS apps. |
| Trader status (EU, Digital Services Act) | App info | Disclose trader status to distribute in the EU; a trader's address and contact details are shown on EU product pages. Required to submit updates for EU apps since October 16, 2024; since February 17, 2025 apps without trader status are removed from the EU App Store until it is provided and verified (`https://developer.apple.com/news/upcoming-requirements/`). |
| Keywords | Version | Apple's App Store Connect Help says "up to 100 bytes of content"; Apple's product page and search pages say "100 characters total". Each keyword longer than two characters; comma-separated with no spaces. Don't repeat the app or company name (the app is already searchable by both); no other app or company names. Required, localizable. Confirm bytes versus characters in the current docs. |
| Description | Version | 4000 characters, plain text, no HTML. Used for web search results after release. |
| What's New | Version | 4000 characters. Not available for the first version; required for every later version. |
| Promotional Text | Version | 170 characters. Shown above the description. Updatable without a new submission. |
| Support URL | Version | Required. Full URL with protocol, leading to real contact information (legal address, email, telephone) where the law requires it. An SBOM can live on the support site. |
| Marketing URL | Version | Optional, localizable. |
| Copyright | Version | Required, for example "2014 Example, Inc." (the symbol is added automatically). |
| Screenshots | Version | Required, localizable. 1 to 10 per device size. |
| App previews | Version | Optional. Up to 3 per localization per device size. |

## Review rules for metadata

Use [App Review metadata policy](REVIEW-GUIDELINES.md#23-accurate-metadata) and [ASO asset policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/VISUALS.md#rules-for-every-asset) before syncing. The old local 2.3.10 summary omitted the approved interactive-functionality exception; the policy owner preserves it. [https://developer.apple.com/app-store/review/guidelines/#accurate-metadata]

## Sync metadata with asc metadata

- **Use the canonical `asc metadata` workflow** for app-info and version localization fields. Drop to `asc localizations` or `asc migrate` only when the user needs `.strings` files or legacy fastlane metadata.
- **Start with a pull:**

```bash
asc metadata pull --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata"
```

  With several app-info records, resolve the one you want and pass it:

```bash
asc apps info list --app "APP_ID" --output table
asc metadata pull --app "APP_ID" --app-info "APP_INFO_ID" --version "1.2.3" --platform IOS --dir "./metadata"
```

- **Keep app-info and version fields separate.** The layout is `metadata/app-info/<locale>.json` for `name`, `subtitle`, `privacyPolicyUrl`, `privacyChoicesUrl`, `privacyPolicyText`, and `metadata/version/<version>/<locale>.json` for `description`, `keywords`, `marketingUrl`, `promotionalText`, `supportUrl`, `whatsNew`.
- **Set copyright on the version, not in a localization:** `asc versions update --version-id "VERSION_ID" --copyright "2026 Your Company"`.
- **Validate before any write:** `asc metadata validate --dir "./metadata" --output table`. Subscription apps add the Terms of Use / EULA check: `asc metadata validate --dir "./metadata" --subscription-app --output table`.
- **Dry-run, then push:**

```bash
asc metadata push --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --dry-run --output table
asc metadata push --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata"
```

  `asc metadata apply` is the same operation on the same files under an apply name (it takes `--dry-run` too).
- **Use the review-artifact workflow for durable approvals** (asc 2.6.1 and later):

```bash
asc metadata plan --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --review-dir ".asc/metadata/review"
asc metadata approve --review-dir ".asc/metadata/review" --all
asc metadata status --review-dir ".asc/metadata/review" --output table
asc metadata apply --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --review-dir ".asc/metadata/review" --confirm
```

  Approve selectively with `asc metadata approve --key "version:1.2.3:en-US:whatsNew"` or `--scope app-info,version`. Version-scoped keys include the App Store version string.
- **Name asset scopes explicitly.** Pull and push default to localization text; add assets with `--include localizations,app-clip,previews` (push with `--dry-run`, then `--confirm`).
- **Previews in metadata need care.** Preview validation needs `ffprobe`. Exports can hold HLS `.m3u8` playlists and `.preview.json` references instead of the original videos: a matching remote preview is reused, an unmatched reference needs the original video or `previews` removed from `--include`. Renaming a playlist to `.mp4` does not make it uploadable. `video-previews download` also returns playlists, so give it a `.m3u8` output path. Replacing an App Clip header deletes the old header first and needs `--allow-deletes`.
- **Keyword-only changes:**

```bash
asc metadata keywords diff --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata"
asc metadata keywords apply --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --confirm
asc metadata keywords import --dir "./metadata" --version "1.2.3" --locale "en-US" --input "./keywords.csv"
asc metadata keywords sync --app "APP_ID" --version "1.2.3" --platform IOS --dir "./metadata" --input "./keywords.csv"
```

  The metadata-sync guide passes `--platform IOS`; the What's New and ASO guides show the same commands without it. Check `--help`.
- **Quick single-field edits:** always pass `--version-id`, or `--version` plus `--platform`; never rely on the ambiguous latest-version default.

```bash
asc apps info edit --app "APP_ID" --version-id "VERSION_ID" --locale "en-US" --whats-new "Bug fixes and improvements"
asc apps info edit --app "APP_ID" --version "1.2.3" --platform IOS --locale "en-US" --description "Your app description here"
asc apps info edit --app "APP_ID" --version "1.2.3" --platform IOS --locale "en-US" --keywords "keyword1,keyword2,keyword3"
asc apps info edit --app "APP_ID" --version "1.2.3" --platform IOS --locale "en-US" --support-url "https://support.example.com"
```

  It also takes `--promotional-text "..."`.
- **App-info fields after app creation:**

```bash
asc app-setup info set --app "APP_ID" --primary-locale "en-US" --privacy-policy-url "https://example.com/privacy"
asc app-setup info set --app "APP_ID" --locale "en-US" --name "Your App Name" --subtitle "Your subtitle"
```

### Lower-level `.strings` localizations

- **Version localizations:** `asc localizations list --version "VERSION_ID" --output table`; `asc localizations download --version "VERSION_ID" --path "./localizations"` (writes files like `./localizations/en-US.strings`); `asc localizations upload --version "VERSION_ID" --path "./localizations" --dry-run`, then without `--dry-run`.
- **App-info localizations:** `asc localizations list|download|upload --app "APP_ID" --type app-info --app-info "APP_INFO_ID" --path "./app-info-localizations"`. Name and subtitle go through these `.strings` files; there is no app-infos localizations command.
- **Format:**

```
// nl-NL.strings
"description" = "Je app-beschrijving hier";
"keywords" = "wiskunde,kinderen,tafels,leren";
"whatsNew" = "Bugfixes en verbeteringen";
"promotionalText" = "Leer de tafels van vermenigvuldiging!";
```

### Legacy fastlane metadata

```bash
asc migrate export --app "APP_ID" --version-id "VERSION_ID" --output-dir "./fastlane"
asc migrate validate --fastlane-dir "./fastlane"
asc migrate import --app "APP_ID" --version-id "VERSION_ID" --fastlane-dir "./fastlane" --dry-run
asc migrate import --app "APP_ID" --version-id "VERSION_ID" --fastlane-dir "./fastlane" --confirm
```

- **Deliverfile paths resolve relative to the Deliverfile** and take precedence. With `--fastlane-dir "./fastlane"`, write `metadata_path "./metadata"`, not `"./fastlane/metadata"` (that resolves to `./fastlane/fastlane/metadata`).
- **Paths outside the fastlane directory fail** unless trusted with `--allow-external-metadata` / `--allow-external-screenshots`. Leave both off for untrusted imports.
- **Import `--dry-run` inventories local inputs only.** Add `--check-remote` to compare remote assets without writing (needs auth, may download media); add `--skip-previews` when playlist references can't be matched.
- **If you keep fastlane** [ApparenceKit](https://apparencekit.dev/blog/automate-flutter-ios-deploy-fastlane/) (it calls fastlane "not optional. It is infrastructure", where this skill treats it as legacy): commit `fastlane/metadata/` (one folder per locale, one text file per field) for history and translator PRs, never the `.p8` key; give every locale a release note with an `en-US` fallback, since "If you forget a locale, Apple will reject your submission or show stale release notes"; and drop `force: true` on the first local run to see fastlane's HTML preview. Its locale list has 39 locales, missing `bn-BD, gu-IN, kn-IN, ml-IN, mr-IN, or-IN, pa-IN, sl-SI, ta-IN, te-IN, ur-PK` from the list below (undated article). The lanes themselves are in [FASTLANE.md](FASTLANE.md#ios-lanes-with-an-app-store-connect-api-key).
- **Read the body, not the exit code.** `asc migrate validate` can return `valid: false` with a nonzero `errorCount` and still exit 0; a confirmed import can print `status: "partial"` and exit nonzero.

## Localize metadata

- **Locales for version and app-info localizations:** `ar-SA, bn-BD, ca, cs, da, de-DE, el, en-AU, en-CA, en-GB, en-US, es-ES, es-MX, fi, fr-CA, fr-FR, gu-IN, he, hi, hr, hu, id, it, ja, kn-IN, ko, ml-IN, mr-IN, ms, nl-NL, no, or-IN, pa-IN, pl, pt-BR, pt-PT, ro, ru, sk, sl-SI, sv, ta-IN, te-IN, th, tr, uk, ur-PK, vi, zh-Hans, zh-Hant`. Subscription and IAP display names use a shorter list (see [PRICING-AND-SUBSCRIPTIONS.md](PRICING-AND-SUBSCRIPTIONS.md)).
- **Resolve the version first.** Version localizations belong to a version, so create the version before localizing. Latest live: `asc versions list --app "APP_ID" --state READY_FOR_DISTRIBUTION --output table`; editable: `--state PREPARE_FOR_SUBMISSION`; app info: `asc apps info list --app "APP_ID" --output table`.
- **Translate with these rules:**
  - Formal register and formal "you" (Russian вы, German Sie, French vous, Spanish usted, Dutch u, Italian Lei, formal Portuguese você). Playful English may need adjusting for formal markets such as `ja` and `de-DE`.
  - Description keeps its formatting, at most 4000.
  - Keywords are not translated literally: research the locale's search terms; at most 100, no duplicates, no app name (Apple adds it automatically).
  - What's New at most 4000; promotional text at most 170 and updatable without a new version; subtitle at most 30 and may need creative adaptation; name kept original unless the user asks, at most 30.
- **Shorten over-limit text; never truncate mid-sentence.**
- **Work like this:** read the source locale first; list existing localizations and don't overwrite unless asked; show a fields-by-locales summary table for approval before upload; upload one locale at a time; for updates, download the current text, show a diff and get approval.
- **`whatsNew` only matters for updates,** not the first version.

## What's New and promotional text

- **Build input from git when asked:** `git describe --tags --abbrev=0`, then `git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges`. Drop merges, dependency bumps, CI and formatting-only commits. Bullet points or free text also work as input.
- **Group under New, Improved, Fixed;** omit empty sections.
- **Lead with the biggest change as a full sentence.** About the first 170 characters show before "more". Example hook: "Search just got faster: find what you need in seconds. Plus: smarter notifications and smoother transitions throughout the app."
- **Aim for 500 to 1500 characters in the primary locale;** translations grow 30 to 40%. Hard limit 4000.
- **Write for the user:** benefit-focused, direct "you", action verbs, specifics.
- **Avoid:** version numbers in headings, mentioning competitors, references to other platforms ("Now matching our Android version"), keyword stuffing, fluff, walls of text. The asc guide also bans the generic "Bug fixes and improvements"; Apple's guideline 2.3.12 allows a generic description for simple bug fixes.
- **Echo keywords only for conversion.** Read `keywords` from `metadata/version/{latest}/{locale}.json` (latest = the highest semver directory under `metadata/version/`) and weave relevant ones in; skip when empty. What's New is not indexed for search.
- **Pair it with promotional text:** at most 170 characters, can reference seasonal events (Ramadan, Eid, back-to-school, New Year), not indexed ("promotional text doesn't affect your app's search ranking"), updatable without a submission. Refresh it monthly or with each major update.
- **Update cadence:** the asc authors suggest an update every 2 to 4 weeks and say each update triggers algorithm re-evaluation.
- **Upload only after the user approves.** On partial failure, report succeeded and failed locales and offer a retry.

| Field | Limit | Indexed | Needs a submission |
|---|---|---|---|
| What's New | 4000 | No | Yes |
| Promotional Text | 170 | No | No |

## Screenshots

Apple's screenshot counts, formats, required device classes and full size matrix have one owner: [ASO screenshot specs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/VISUALS.md#screenshot-specs-app-store). Check the [current official specification](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) and the installed CLI's size list before choosing upload targets.

### Validate, fix and upload with asc

- **Let the CLI own the size matrix;** don't hard-code dimensions: `asc screenshots sizes --output table`, `asc screenshots sizes --all --output table`.
- **Validate:** `asc screenshots validate --path "./screenshots/iphone" --device-type "IPHONE_65" --output table`; iPad `--device-type "IPAD_PRO_3GEN_129"`. Use `--all` for 6.9-inch iPhone, Apple TV, Mac, Vision Pro, iMessage and Watch. The asc guide treats `IPHONE_65` (6.5-inch, 1284 x 2778, Apple's "Face ID, large" class) as the common iPhone anchor; Apple's spec requires at least one Dynamic Island (medium display) screenshot. Check `asc screenshots sizes` and Apple's spec page before choosing the set.
- **Inspect:** `sips -g pixelWidth -g pixelHeight screenshot.png`; `sips -g hasAlpha -g space screenshot.png`.
- **Strip alpha with a JPEG round trip** (App Store Connect rejects transparency):

```bash
sips -s format jpeg input.png --out /tmp/asc-screenshot-no-alpha.jpg
sips -s format png /tmp/asc-screenshot-no-alpha.jpg --out output.png
rm /tmp/asc-screenshot-no-alpha.jpg
```

- **Resize with height first:** `sips -z` takes height, then width. Portrait `IPHONE_65`: `sips -z 2778 1284 input.png --out output.png`. Never stretch across aspect ratios; write to a separate directory.
- **Convert Display P3 to sRGB:** `sips -m "/System/Library/ColorSync/Profiles/sRGB IEC61966-2.1.icc" input.png --out output.png`.
- **Clean filenames:** macOS screenshot names can contain hidden Unicode spaces that cause "not a valid file" errors.
- **Trust `asc screenshots validate` over your eyes,** then upload:

```bash
asc screenshots upload --version-localization "LOC_ID" --path "./resized" --device-type "IPHONE_65" --dry-run --output table
asc screenshots upload --version-localization "LOC_ID" --path "./resized" --device-type "IPHONE_65"
```

### Automated capture pipeline

xcodebuild, then AXe capture, then Koubou framing, then upload. These local commands are experimental in the asc CLI; say so in the handoff. Feedback: https://github.com/rorkai/App-Store-Connect-CLI/issues/new/choose

- **Defaults:** settings `.asc/shots.settings.json`, plan `.asc/screenshots.json`, raw `./screenshots/raw`, framed `./screenshots/framed`, frame device `iphone-air`.

```json
{
  "version": 1,
  "app": {
    "bundle_id": "com.example.app",
    "project": "MyApp.xcodeproj",
    "scheme": "MyApp",
    "simulator_udid": "booted"
  },
  "paths": {
    "plan": ".asc/screenshots.json",
    "raw_dir": "./screenshots/raw",
    "framed_dir": "./screenshots/framed"
  },
  "pipeline": {
    "frame_enabled": true,
    "upload_enabled": false
  },
  "upload": {
    "version_localization_id": "",
    "device_type": "IPHONE_65",
    "source_dir": "./screenshots/framed"
  }
}
```

  To skip framing set `"frame_enabled": false` and `"upload.source_dir": "./screenshots/raw"`.
- **Build and launch on the simulator:** `xcrun simctl boot "$UDID" || true`; `xcodebuild -project "MyApp.xcodeproj" -scheme "MyApp" -configuration Debug -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath ".build/DerivedData" build`; `xcrun simctl install "$UDID" ".build/DerivedData/Build/Products/Debug-iphonesimulator/MyApp.app"`; `xcrun simctl launch "$UDID" "com.example.app"`. If the bundle path differs, read it from `xcodebuild -showBuildSettings`.
- **Capture from a plan:** `asc screenshots run --plan ".asc/screenshots.json" --udid "$UDID" --output json`. AXe primitives: `axe describe-ui --udid "$UDID"`, `axe tap --id "search_field" --udid "$UDID"`, `axe type "wwdc" --udid "$UDID"`, `axe screenshot --output "./screenshots/raw/home.png" --udid "$UDID"`.

```json
{
  "version": 1,
  "app": {
    "bundle_id": "com.example.app",
    "udid": "booted",
    "output_dir": "./screenshots/raw"
  },
  "steps": [
    { "action": "launch" },
    { "action": "wait", "duration_ms": 800 },
    { "action": "screenshot", "name": "home" }
  ]
}
```

- **Pin Koubou to 0.20.0:** `pip install koubou==0.20.0`; `kou --version` must print 0.20.0. After upgrading from 0.18.x, or when frames are missing, run `kou setup-frames` once with network. List devices with `asc screenshots list-frame-devices --output json`; frame with `asc screenshots frame --input "./screenshots/raw/home.png" --output-dir "./screenshots/framed" --device "iphone-air" --output json`.
- **`--device` values:** iPhone `iphone-air` (default), `iphone-17-pro`, `iphone-17-pro-max`, `iphone-16e`, `iphone-17`; iPad `ipad-pro-13`, `ipad-pro-11`, `ipad-air-13`, `ipad-air-11`, `ipad-mini`; other `mac`, `watch-series-11`, `watch-ultra-3`, `apple-tv`.
- **Review before upload:** `asc screenshots review-generate --framed-dir "./screenshots/framed" --output-dir "./screenshots/review"`, then `review-open`, then `review-approve --all-ready`. For reviewed multi-locale sets: `asc screenshots plan --app "APP_ID" --version "1.2.3" --review-output-dir "./screenshots/review" --output json`, then `asc screenshots apply ... --confirm --output json` (it checks existing remote screenshot counts and append limits). List what is live with `asc screenshots list --version-localization "LOC_ID" --output table`.
- **Switch language per simulator, not per launch.** `xcrun simctl launch ... -e AppleLanguages` sets an environment variable and does not reliably switch the language. Write simulator-wide defaults per UDID:

```bash
xcrun simctl spawn "$UDID" defaults write NSGlobalDomain AppleLanguages -array "$LANG"
xcrun simctl spawn "$UDID" defaults write NSGlobalDomain AppleLocale -string "$APPLE_LOCALE"
```

  Then `asc screenshots capture --bundle-id "com.example.app" --name "home" --udid "$UDID" --output-dir "./screenshots/raw/$LOCALE" --output json` (it relaunches the app). A manual launch can pass `xcrun simctl launch "$UDID" "com.example.app" -AppleLanguages "(de)" -AppleLocale "de_DE"`. Use one locale per simulator UDID and run them in parallel with `&` and `wait`, or `xargs -P 4`.

## App previews

Counts, placement, codec/audio requirements, accepted resolutions, poster frame and processing limits are defined in [ASO preview specs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/VISUALS.md#app-preview-specs-app-store); use the [current official spec](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications). Metadata export/reuse and HLS-reference handling remain in [the asc sync workflow](#sync-metadata-with-asc-metadata).

## Creative assets and the Asset Library

Product page headers and search results assets are new in fall 2026 (guideline 2.3.14). The Asset Library in App Store Connect (October 5, 2026) uploads and pre-approves assets, with a preview tool for Dark Mode, devices and orientations before you submit.

Header/search image and video sizes, ratios, formats, alpha/audio/looping constraints and 2.3.14 policy are in [ASO creative asset specs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/VISUALS.md#product-page-header-and-search-assets-fall-2026), checked against the [official specification](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications). The upload, localization placement and review operations below remain separate stages.

- **Run only the stages asked for.** Upload, assign, submit for review and publish are separate operations.
- **Inspect:**

```bash
asc asset-library view --app "APP_ID" --output json
asc asset-library specs --output json
asc asset-library images list --library-id "LIBRARY_ID" --paginate --output json
asc asset-library videos list --library-id "LIBRARY_ID" --paginate --output json
```

- **Upload in the right category.** The default `CREATIVE_ASSETS` covers headers, search and event media; in-use screenshots and previews use `APP_SCREENSHOTS_AND_PREVIEWS`:

```bash
asc asset-library images upload --library-id "LIBRARY_ID" --file "./header.png" --output json
asc asset-library videos upload --library-id "LIBRARY_ID" --file "./preview.mp4" --category APP_SCREENSHOTS_AND_PREVIEWS --output json
```

  Video uploads need `ffprobe`. Save the asset ID, including from partial-failure receipts; after a timeout, check `images view --id` / `videos view --id` before retrying. A processed upload is not App Review approval.
- **Assign to the localization resource ID,** not the parent version, page or event ID. Creating a placement does not remove an existing one.

```bash
asc localizations placements list --localization-id "LOC_ID" --include image,video --paginate --output json
asc localizations placements create --localization-id "LOC_ID" --image-id "IMAGE_ID" --placement-type PRODUCT_PAGE_HEADER_ASSET
asc localizations placements create --localization-id "LOC_ID" --video-id "VIDEO_ID" --placement-type APP_PREVIEW --placement-group IPHONE_DUO_PROFILE
```

  Pass exactly one image or video ID. Previews need an explicit device placement group; header and search creative use `DEFAULT_PROFILE`. Custom product page and product page optimization placements live under `product-pages custom-pages localizations placements` and `product-pages experiments treatments localizations placements`. Event placements are in [IN-APP-EVENTS.md](IN-APP-EVENTS.md). Deleting a placement keeps the media in the library; deleting several placements is not atomic.
- **Get assets reviewed.** A first app version carries its assets in that version's submission. A standalone asset review needs an approved app version: attach `appAssetLibraryImages` or `appAssetLibraryVideos` with `review items-add`, then `review submissions-submit --confirm`. Never attach an asset that is already in an active submission to a second one. The CLI has no separate placement-publication command. Guide: https://github.com/rorkai/App-Store-Connect-CLI/blob/main/guides/asset-library.mdx

## Custom product pages

- **Up to 70 per app.** Each varies screenshots, previews, promotional text and keywords; localizable; has a unique URL (a product page ID parameter); visible only through its link or its assigned keywords in search, on iOS 15 / iPadOS 15 and later.
- **Prerequisites:** the app must be Ready for Distribution in at least one country, and each page must be approved before it shows. Its metadata is reviewed independently of an app update. Role: Account Holder, Admin, App Manager or Marketing.
- **Keywords:** assign them from the latest approved version and "select a unique set of keywords for each page".
- **Deep link (optional):** a universal link or custom URL for users on iOS 18 / iPadOS 18 and later; it must be approved; avoid URL shorteners.
- **Linking from ads:** ad networks pass `customProductPageIdentifier` with `SKOverlay`, or `SKStoreProductParameterCustomProductPageIdentifier` with `SKStoreProductViewController`. Apple Ads can use custom product pages (Today tab, Search tab, search results ad variations); see [app-growth SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/app-growth/SKILL.md).
- **Metrics** appear in App Analytics after at least five first-time downloads. Disabled or deleted page URLs redirect to the default page.
- **Placements via asc:** `product-pages custom-pages localizations placements` (see the Asset Library section).
- **Configure guide:** https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions

## Prove it

- **Metadata round trip:** `asc metadata validate --dir "./metadata" --output table` reports no errors, `asc metadata push ... --dry-run --output table` shows only the intended fields, and a fresh `asc metadata pull` after the push matches the local files.
- **Limits:** every locale's name is 2 to 30 characters and subtitle at most 30, keywords fit the 100 limit with no spaces after commas, promotional text is at most 170, description and What's New at most 4000, and the first version has no What's New.
- **fastlane imports:** the JSON body of `asc migrate validate` shows `valid: true` and `errorCount: 0`; an import does not print `status: "partial"`.
- **Screenshots:** `asc screenshots validate` passes for each device type; `sips -g hasAlpha` prints `no`; the set includes an iPhone Dynamic Island (medium display) size and, for iPad apps, an iPad 13-inch size; `asc screenshots list --version-localization "LOC_ID"` shows the expected count (at most 10).
- **Localized captures:** each locale's raw screenshots show that language, captured on a simulator whose `AppleLanguages` default was written, not passed with `-e`.
- **Previews:** each file is 15 to 30 seconds, at most 500 MB, at most 30 fps, at the accepted resolution for its class, and at most 3 per device size and language.
- **Assets:** `asc localizations placements list` shows each placement on the localization ID you meant; review state is read back, not inferred from the upload receipt.
