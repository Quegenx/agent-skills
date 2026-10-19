# Listing and Metadata

The store listing is the page users see on Google Play: name, descriptions, icon, feature graphic, screenshots and video, per language, plus up to 50 custom listings and A/B experiments on top. What decides most outcomes is Google's metadata policy (no ranking, price or promotional claims, no emoji or repeated keywords) and the asset specs; files kept in version control and pushed through an edit keep it repeatable. Google's Help Center is the authority; facts from the gplay CLI's third-party author are marked as the CLI's where they differ. Google's values here were rechecked against the raw Help Center pages on 2026-10-17. Keyword and conversion strategy is [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md); edits and CLI auth are [CLI.md](CLI.md).

**Contents:** [Text fields and limits](#text-fields-and-limits) · [Metadata policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#metadata-policy) · [Graphic assets](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#graphic-assets) · [Preview video](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#preview-video) · [Metadata as files](#metadata-as-files) · [Screenshots: capture and upload](#screenshots-capture-and-upload) · [Custom store listings](#custom-store-listings) · [Store listing experiments](#store-listing-experiments) · [Prove it](#prove-it)

## Text fields and limits

The main listing lives at Grow users > Store presence > Main store listing; graphics are in its "Graphics" section.

| Field | Limit |
|---|---|
| App name (title) | 30 characters, one localized name per language (Metadata policy: "Your app title must be 30 characters or less") |
| Short description | 80 characters |
| Full description | 4000 characters |
| Alt text (feature graphic, each screenshot) | "using 140 characters or less"; don't start with "photo of" or "image of" |
| Subscription listing title / description | 55 / 80 characters (see [BILLING-AND-PURCHASES.md](BILLING-AND-PURCHASES.md)) |

- **Limits count both widths:** "Character limits apply to both full-width and half-width characters": the numbers are the maximum regardless of character type.
- **Contact details:** set on Grow users > Store presence > Store settings, under "Contact Details": a support email address (required), a phone number and a website URL ("we also highly recommend including a website"). They are shown on the store listing. CLI: `gplay details get --edit`; `gplay details update --edit --contact-email --contact-phone --contact-website`.
- **Languages:** the default is English (United States, `en-US`). Add translations and localized graphics, or users may see automated translations ("automated translations aren't supported for Armenian, Raeto-romance, Tagalog, and Zulu"). Locale codes look like `en-US`, `es-ES`, `fr-FR`, `de-DE`, `ja-JP`. Don't use machine translation without review.
- **Short description:** summarize the core function or purpose and what makes it unique; avoid duplicating its messaging across the short description, screenshots, feature graphic and video, since they may be shown side by side. "Do not include special characters, line breaks, emojis, emoticons, repeated punctuation ... or symbols" (standard characters of your language, and ©, ®, ™, are allowed). "Do not use capitalization for emphasis"; only capitalize the app name if the listing's app name is capitalized.
- **Title:** "Ensure your app's title and description accurately describe its functionality."
- **License:** publishing grants Google a license to use the icon, screenshots and videos for promotion.

## Metadata policy

The canonical [Play metadata policy](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#metadata-policy), [copy constraints](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#writing-the-copy) and [asset-specific rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#graphic-assets) distinguish metadata elements and mandatory requirements from promotion recommendations. The listing must also meet the general-audience policy collected there. Validate each field under its actual scope, not a blanket word/emoji blacklist across every full description. The old local acceptance check imposed that blanket blacklist. [Google Play metadata and asset policy]

## Graphic assets

Use [ASO Android asset specifications](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#graphic-assets) for required/promotion counts, device classes, formats, dimensions, alpha, real-experience rules and the general-audience boundary. Actual CLI image types and historical payload limits remain below. [Google Play asset specifications; gplay]

- **Where the CLI's author differs from Google:** it lists image types `phoneScreenshots` (required), `sevenInchScreenshots`, `tenInchScreenshots`, `tvScreenshots`, `wearScreenshots`, `icon` (512x512), `featureGraphic` (1024x500), `promoGraphic` (180x120), `tvBanner` (1280x720), with phone screenshots 2 to 8, and says "PNG or JPEG required (PNG recommended), max 8 MB per image". Google caps the icon at 1024 KB and requires 24-bit PNG without alpha for feature graphics and screenshots; follow Google's spec.

## Preview video

The YouTube URL, visibility, advertising/embedding, footage, autoplay and cover rules have one owner: [ASO Play preview video](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#preview-video), including its distinct permission for Google Play award references. Recording and uploading remain below. [Google Play asset specifications]

## Metadata as files

Keep metadata in version control, validate before import, and keep descriptions current. The gplay CLI reads the Fastlane tree:

```
fastlane/metadata/android/<locale>/{title.txt, short_description.txt, full_description.txt, video.txt, images/{phoneScreenshots, sevenInchScreenshots, tenInchScreenshots, tvScreenshots, wearScreenshots}/, images/icon.png, images/featureGraphic.png}
```

- **Export:** `gplay sync export-listings --package ... --dir ./fastlane/metadata/android`; `gplay sync export-images ...`.
- **Diff and validate:** `gplay sync diff-listings`; offline `gplay validate listing --dir ... --locale en-US`.
- **Import:** `gplay sync import-listings`; `gplay sync import-images`.
- **Read in an edit:** `listings list|get --edit $EDIT_ID [--locale en-US]`.
- **`listings update` clears what you leave out.** It sets all fields for a locale through flags (`--title`, `--short-description`, `--full-description`, `--video`); fields not provided are cleared. Use `listings patch` for partial updates.
- **New locale:** copy the `en-US` directory, translate, import.
- **Image commands:** `gplay images upload|list|delete --edit --locale --type --file|--image IMAGE_ID --confirm`. `images delete-all --locale --type --confirm` clears a type for a locale; `--confirm` defaults to false and it refuses without it.

## Screenshots: capture and upload

- **Capture is not gplay-specific:** `adb shell screencap` then `adb pull`, or Espresso / UI Automator, switching the emulator locale with `setprop persist.sys.locale`.
- **Screen recording for a preview video or a bug repro** [ApparenceKit](https://apparencekit.dev/flutter-tips/android-adb-cheat-sheet/): record with the command below, and turn the touch indicator on and off. The article's show-touches commands end their lines with a backslash followed by a space, which breaks shell line continuation; here they are with the trailing spaces removed:

```bash
adb shell screenrecord /sdcard/demo.mp4
```

  Fix: the article writes `screenrecord -p /sdcard/video.mp4`; `screenrecord` has no `-p` option (its options are `--help`, `--size`, `--bit-rate`, `--time-limit`, `--rotate`, `--verbose`). The command above is the official one; stop with Control+C, or it stops at three minutes, and audio is not recorded (https://developer.android.com/tools/adb#screenrecord).

```bash
adb shell content insert \
--uri content://settings/system \
--bind name:s:show_touches \
--bind value:i:1
```

```bash
adb shell content insert \
--uri content://settings/system \
--bind name:s:show_touches \
--bind value:i:0
```

- **Order by filename:** screenshots upload in filename order, so prefix `1_`, `2_`.
- **Validate:** `gplay validate screenshots --dir ./metadata --output table` (add `--locale en-US`).
- **Every image write goes through an edit:** create, then upload or import, then validate, then commit.

```bash
EDIT_ID=$(gplay edits create --package com.example.app | jq -r '.id')
```

- **Upload options:** (A, preferred) bulk `gplay sync import-images --package --edit "$EDIT_ID" --dir ./metadata` (add `--locale en-US`, `--dry-run`); (B) individual `images upload`; (C) `gplay release ... --screenshots-dir ./metadata`.
- **`--edit` conflict:** the metadata-sync guide shows `sync import-images` without `--edit`; the screenshot guide says it "Requires an open edit" and passes `--edit`. Check `gplay sync import-images --help`.
- **Finish:** `gplay edits validate --package ... --edit $EDIT_ID`, then `gplay edits commit`.

## Custom store listings

- **Up to 50:** "You can create up to 50 custom store listing pages." Customize name, icon, descriptions and graphic assets; contact details, privacy policy and category are shared with the main listing.
- **Targeting:** country or region ("you can only target a country with one custom store listing at a time"); pre-registration; churned (uninstalled), lapsed ("haven't opened your app in the last 28 days"), or lapsed and churned users; non-buyers, one-time buyers, repeat buyers, lapsed buyers ("haven't bought in the last 180 days"); ads traffic; search keywords; custom audiences.
- **Unique URL:** a string parameter unique across all your custom listings (lowercase alphanumerics plus `.`, `-`, `_`, `~`), served at `https://play.google.com/store/apps/details?id=[packageName]&listing=[parameter]`.
- **No automated translations:** "Custom store listings aren't automatically translated"; pick a default language and add translations for the languages spoken in the targeted countries.
- **Store listing groups** ([Google](https://support.google.com/googleplay/android-developer/answer/9867158)): every app starts with a "Default store listing group"; listings in a group inherit the icon, screenshots and descriptions, and "Updating a group asset will update that asset in all listings in the group."
- **Google Ads listings** must be fully reviewed and approved, then selected as a landing page in Google Ads.

## Store listing experiments

- **Types:** default graphics (icon, feature graphic, screenshots in the default language; users viewing a language that has localized graphics are excluded) and localized (also descriptions, in up to five languages).
- **Concurrency:** "For each app, you can run one default graphics experiment or up to five localized experiments at the same time"; up to 2 variants.
- **Target metric:** Unique user install clicks, Unique user open clicks, or Unique user pre-registration clicks.
- **Settings:** audience percentage, minimum detectable effect, confidence level ("Increasing the confidence level decreases the likelihood of a false positive").
- **Scope:** experiments run on default and custom store listings. Test one asset at a time. Hypotheses, sample size and reading results in general: [ab-testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ab-testing/SKILL.md).
- **End:** "Store listing experiments stop automatically after running for 6 months"; then traffic reverts to the current listing and no variant is applied. Apply the winning variant from the recommendation, or "Keep current listing".

## Prove it

- **Text fits:** `gplay validate listing --dir ... --locale <locale>` passes for every locale; title at most 30 characters, short description at most 80, full description at most 4000.
- **Policy scope:** each field and asset passes its [actual Play metadata/asset rules](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#metadata-policy); full-description formatting/keyword restrictions, short-description rules and title/icon/developer-name restrictions are checked separately, not by one blanket word blacklist. [Google Play metadata policy]
- **Assets meet spec:** the files satisfy [ASO Android asset specs](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/ANDROID.md#graphic-assets), with mandatory device/count/format requirements distinguished from promotion eligibility. [Google Play asset specifications]
- **Screenshots pass:** `gplay validate screenshots --dir ./metadata --output table` reports no errors and the files sort in the intended order.
- **The edit is clean:** `gplay edits validate` passes before `gplay edits commit`.
- **Nothing got cleared:** after a listing change, `gplay sync diff-listings` shows only the fields you meant to change.
