# Record a real native app flow

Capture the app performing the action, then edit around its observed response. This is showtime's capture-clock, action-journal and motion-review method from docs/preparation.md, showtime-execution.md and visual-acceptance.md. Its native driver, compositor, device assets and approval schemas are not bundled here. Web recording remains in [APP-RECORDING.md](APP-RECORDING.md); footage inspection and cuts use [MEDIA-INSPECTION.md](MEDIA-INSPECTION.md) and [FOOTAGE-EDITS.md](FOOTAGE-EDITS.md). [showtime, docs/preparation.md; docs/showtime-execution.md; docs/visual-acceptance.md]

## Prepare the scene and framing together

[showtime, docs/showtime-execution.md, Story and Capture; docs/preparation.md]

- Show one benefit through context, feature entry, action, visible result and a readable return to the beginning. Start at the nearest understandable screen. When the person acting and the person benefiting differ, show the result from the beneficiary's perspective.
- Use the real app and demo-safe content. Keep names, dates, roles and scene state consistent across the take. Rehearse the actual scene and reset only its intended demo state.
- Select the capture device and phone framing together. Verify the simulator's actual device type rather than its editable name, and check the matching simulator is available. A catalog entry alone does not establish local support; do not silently substitute an explicitly requested unavailable model.
- Capture the complete native viewport. Fit that complete screen into its device frame, then crop the composed device at the delivery canvas if the selected composition needs it. Inspect bottom corners and controls during transitions as well as in stills.
- Take action coordinates from the current UI and record the viewport and coordinate units. A changed layout needs new coordinates and framing evidence.

Showtime's silent, app-text-only film, selected phone families, background catalog, hidden caret and keyboard styling are its specific production profile. The existing [web recording](APP-RECORDING.md) branch uses captions, browser chrome and optional narration. Keep the selected profile explicit. The source also declares moving important app buttons authorized; that declaration does not authorize changes to this repo's protected app, landing-page or agent-chat designs. [showtime, docs/preparation.md, Visual rules; coreyhaines31/marketingskills, video; owner standing rules]

## Bind actions to the capture clock

[showtime, docs/showtime-execution.md, Capture]

- Wait for the recorder's ready signal before driving the scene. Keep each action journal with its own take and capture clock.
- Record each action's identity, kind, target, coordinate space and timing evidence. A command's dispatch time is not physical contact time. For a hold, preserve contact start and release; command duration alone does not establish hold duration.
- Capture complete input, transitions, the result's reading interval and the loop return. Leave room for the entry and release of any selected tap indicator.
- Verify the resulting text in the actual native field and the full visible input interval. A successful input command does not establish correct typing, keyboard appearance or caret behavior. If the chosen profile changes recording-only appearance, verify restoration after completion, interruption and focus loss.
- Stop only the recorder belonging to the take and wait for it to finish. Exclude any recording sentinel from the edit.

## Edit from observed app states

[showtime, docs/showtime-execution.md, Edit]

- Inspect the source recording and mark, per action, response start, transition end, result ready, overlays clear and the required reading interval. Do not infer completion from command timestamps.
- Keep those observations in source-video time and bind them to the actual capture. Response follows the action; completion follows response. Reading begins after the transition, result and obstructing overlays have all cleared.
- Protect whole scrolls and native navigation transitions, including motion between action windows. Shorten a pause only where the cut does not jump or interrupt visible motion.
- A continuously animated decoration needs a chosen meaningful interval, not an impossible demand that every pixel stop. If the take lacks a complete ending or enough reading time, record again rather than inventing a freeze or shortening the result hold.
- Preserve the input's timing evidence when normalizing for editing. A constant output cadence cannot recover source motion that was never captured. Use the [media inspection](MEDIA-INSPECTION.md) and [cut verification](FOOTAGE-EDITS.md#prove-it) owners for stream and boundary checks.

## Review the encoded result

[showtime, docs/visual-acceptance.md; scripts/render_quality.py; scripts/review_gate.py]

- Watch the complete encoded export at normal speed and through several uninterrupted loops. Stills can establish comprehension of a frame; they do not establish continuous native motion.
- Inspect the entire input interval, every navigation transition, each cut and the result hold. Check the promised benefit, content continuity, unobstructed reading and the phone's screen geometry.
- If the profile includes tap or hold indicators, compare every journal event with the edited event list, render report and visible encoded indicator. Confirm target, contact time, entry and release. An empty event list is valid only when the scene actually has no taps or holds.
- Check that the loop returns after readable success without implying the action was undone or cutting motion short.
- Bind findings to the exact export and its hash. Keep technical reports, observed visual results and unverified properties distinct. The source's hash gate does not inspect image meaning, and its quality helper can leave an individual ring unverifiable while an aggregate pass remains true. Neither establishes visual acceptance. Use the existing [delivery evidence limits](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md).

## Prove it

[showtime, docs/preparation.md; docs/showtime-execution.md; docs/visual-acceptance.md]

The selected device and complete viewport match the prepared composition. The journal belongs to the take, contact uncertainty remains explicit, and edit markers come from observed app states. The full encoded input, cuts, native transitions, reading interval and loop were reviewed. Record capture defects as needing a new take and unchecked properties as unverified; report the actual checks performed.
