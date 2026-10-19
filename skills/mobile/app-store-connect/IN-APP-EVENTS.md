# In-app events

In-app events are timed happenings inside the app (a challenge, a premiere, a new season) that show as cards on the product page, in search results and on the Today, Games and Apps tabs on iOS 15 / iPadOS 15 and later, where users can opt in to a notification when the event starts. Users who downloaded the app before see the event card in search; others see screenshots and previews. Most outcomes come down to the schedule rules, a deep link that opens the event, media at the exact sizes in every locale, and a submission path that matches whether the app already has an approved version. Event metadata and keyword strategy for discovery: [aso SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md). `asc` CLI facts come from its third-party authors (rorkai).

## Limits

| Item | Limit |
|---|---|
| Events published at a time | 10 |
| Approved events in App Store Connect | 15 |
| Events with overlapping start times | 10 |
| Reference name (internal, `--name` in asc) | 64 characters |
| Event name (displayed) | 30 characters |
| Short description | 50 characters |
| Long description | 120 characters |
| Duration | 15 minutes to 31 days |
| Publish date | up to 14 days before the start, and no later than the start |
| Regional start dates | customized ones must be within 48 hours of each other |

Required role: Account Holder, Admin, App Manager or Marketing. Every event must be approved.

## What makes a good event

- **Pick a listed event type.** Guideline 2.3.13: an event must fall within an event type provided in App Store Connect, its metadata must pertain to the event, it must happen at the selected times across storefronts, and its deep link must go to the proper destination.
- **Badges:** Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event.
- **Not good candidates:** daily tasks or rewards, price promotions without new content, general app awareness.
- **Write the metadata plainly:** the event name in title case and the actual event name, not a call to action; descriptions in sentence case; no unverifiable claims ("the best", "#1"). "Don't include specific prices ... will lead to rejection."
- **Purposes:** Appropriate for all users, Attract new users, Keep active users informed, Bring back lapsed users. Also set priority (High or Normal) and whether an in-app purchase is required.
- **Deep link:** a universal link is recommended. Test the universal link or custom scheme in the build you ship; a registered scheme alone does not prove the destination works. Creating an event without a deep link can succeed, but the event is then not ready for review.

## Media

| Asset (`--asset-type`) | Aspect ratio | Minimum | Maximum |
|---|---|---|---|
| `EVENT_CARD` | 16:9 | 1920 x 1080 | 3840 x 2160 |
| `EVENT_DETAILS_PAGE` | 9:16 | 1080 x 1920 | 2160 x 3840 |

- **Formats:** images `.jpg`, `.jpeg`, `.png`; videos `.mov`, `.m4v`, `.mp4` at 30 or 60 fps, 15 to 30 seconds. Max 500 MB per file. Opaque only, no alpha.
- **Keep media clean:** avoid text or logos in the media; no borders or gradients. Account for crops, gradients and App Store controls, and check the App Store Connect preview when available rather than assuming a fixed safe area.
- **Give every locale its own media.** Locales do not inherit missing assets from the primary locale.
- **Spec page:** https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-media-and-audio-specifications/

## Create and localize with asc

- **Do only the stage asked for.** A request for localization, media or a diagnosis does not authorize creating or submitting another event.
- **Inspect first:** `asc app-events list --app "APP_ID" --paginate --output json`; `asc app-events view --event-id "EVENT_ID" --output json`; `asc app-events localizations list --event-id "EVENT_ID" --paginate --output json`.
- **Check the schedule yourself.** Use future RFC 3339 timestamps with the start before the end. The CLI parses timestamps but does not enforce all of Apple's schedule rules.
- **Create:**

```bash
asc app-events create \
  --app "APP_ID" --name "Summer Challenge" --event-type CHALLENGE \
  --start "$START_RFC3339" --end "$END_RFC3339" \
  --publish-start "$PUBLISH_START_RFC3339" \
  --deep-link "myapp://event/summer" --primary-locale en-US \
  --purchase-requirement NO_COST_ASSOCIATED \
  --priority NORMAL --purpose APPROPRIATE_FOR_ALL_USERS --output json
```

  Check `--help` for the accepted `--event-type`, `--purpose` and `--purchase-requirement` values; don't assume every value App Store Connect describes is supported by the CLI. Keep the returned event ID. Change an existing event with `asc app-events update`.
- **Localize:** `asc app-events localizations create --event-id "EVENT_ID" --locale en-US --name ... --short-description ... --long-description ...`; update with `asc app-events localizations update --localization-id "LOC_ID"`. Create only missing, requested localizations.
- **Add media:** `asc app-events screenshots create --event-id "EVENT_ID" --locale en-US --path "./event-card.png" --asset-type EVENT_CARD`, and the same with `--asset-type EVENT_DETAILS_PAGE`. Use `--localization-id "LOC_ID"` instead of `--event-id` plus `--locale` once the localization is resolved. Videos go through `asc app-events video-clips create` (`--preview-frame-time-code`).
- **Asset Library placements:** `app-events localizations placements` accepts only `EVENT_CARD_ASSET` or `EVENT_DETAILS_PAGE_ASSET`. Reordering events is unsupported. Replace with `swap --confirm`; a failed swap is no reason to delete the previous placement. A placement does not submit the event. Upload and review of library assets: [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md#creative-assets-and-the-asset-library).

## Submit

- **Read back first:** the schedule, deep link, localized text and delivered media (and video clips when used), with `asc app-events view --event-id "EVENT_ID" --output json` and `asc app-events screenshots list --event-id "EVENT_ID" --locale en-US --paginate --output json`. Report any preview or link behavior you did not verify.

- **App with an approved iOS version:** `asc app-events submit --event-id "EVENT_ID" --app "APP_ID" --platform IOS --confirm --output json`, then read it back with `asc review submissions-get --id "SUBMISSION_ID" --output json` using the `submissionId` from the receipt. A successful submit receipt is not approval or publication; report the state Apple returns.
- **No approved iOS version yet:** Apple requires the event to go in the first version's submission. Prepare that version ([TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md)), add the event to its draft with `review items-add` as below, and skip the standalone `app-events submit`. Coordinate the build and event release when the event needs new functionality.
- **Submissions run in parallel with versions.** Each platform can have two submissions under review: one with an app version and one with items only (in-app events, custom product pages).
- **Recover a half-finished submit.** `app-events submit` creates a submission, adds the event and submits; a failure after the create can leave a draft. Inspect `asc review submissions-list --app "APP_ID" --platform IOS --paginate --output json` and `asc review items-list --submission "SUBMISSION_ID" --paginate --output json`. Confirm the app, platform and every item belong to the authorized submission, and repair the event first (for a missing deep link, `asc app-events update --event-id "EVENT_ID" --deep-link "myapp://event/summer"`). Reuse the draft: `asc review items-add --submission "SUBMISSION_ID" --item-type appEvents --item-id "EVENT_ID" --if-exists skip`, then `asc review submissions-submit --id "SUBMISSION_ID" --confirm`. Don't cancel an empty `READY_FOR_REVIEW` draft, and don't resubmit one that is already waiting. Other submission states: [TESTFLIGHT-AND-RELEASE.md](TESTFLIGHT-AND-RELEASE.md#submission-health). A `403 FORBIDDEN_ERROR` follows the rules in [METADATA-AND-SCREENSHOTS.md](METADATA-AND-SCREENSHOTS.md#asc-ground-rules).
- **Apple guides:** submit https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-event ; setup https://developer.apple.com/help/app-store-connect/offer-in-app-events/offer-in-app-events/ ; presentation https://developer.apple.com/app-store/in-app-events/

## Prove it

- **Schedule:** end minus start is between 15 minutes and 31 days; publish start is at most 14 days before start and not after it; at most 10 events overlap their start times.
- **Text:** every locale's name is at most 30 characters, short description at most 50, long description at most 120, the reference name at most 64, with no prices and no "the best" or "#1".
- **Media:** every locale has an `EVENT_CARD` and an `EVENT_DETAILS_PAGE` asset at 16:9 and 9:16 within the size ranges, opaque, at most 500 MB.
- **Deep link:** tapping the event's link on a device running the shipped build opens the event screen.
- **Submission:** `asc review submissions-get` shows the event in a submitted state; `asc review items-list` shows it in exactly one submission.
