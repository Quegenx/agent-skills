---
name: web-audio
description: "Builds browser sound feedback and live beat-synchronized pages with HTML media and Web Audio: optional cues, playback permission, mute and volume, synthesis, output timestamps, lookahead scheduling, tempo changes and teardown. Use when adding UI sounds, a confirmation cue, a synthesized click, a browser metronome, live audio/visual sync or sound controls, or debugging blocked playback, stale scheduled beats or device latency."
---

# Browser audio

Browser audio has two clocks to reconcile: the page draws on its frame clock, while scheduled sound runs on the audio context's clock and reaches an output device later. This skill uses `defaults/SKILL.md` and `defaults/recipes.md` for optional interface cues, and `stopmotion-video/references/live.md` for live beat-driven pages, with API corrections from MDN, the Web Audio specification and react.dev. These are consumer browser behaviors; a video's offline cue list, mix and loudness remain with [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md), and its measured music grid with [beat-grid](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/beat-grid/SKILL.md).

Apply the selected route only. Preserve the product's accepted sound and motion decisions; a source's metronome, click palette or volume is not permission to add sound to every screen.

| The job | Read |
|---|---|
| Optional confirmation/error cues, visible equivalents, sound settings, file playback, playback rejection and synthesized clicks | [UI-CUES.md](UI-CUES.md) |
| A live metronome or authored page following a beat, page/audio clock mapping, latency limits, scheduling, tempo, pause, visibility and reduced motion | [LIVE-BEAT-CLOCKS.md](LIVE-BEAT-CLOCKS.md) |

## The rules

1. **Sound supplements the interface.** Keep a visible equivalent for a cue and a way to turn it off. The UI source leaves typing, hover, scrolling and keyboard navigation silent; an authored rhythmic demo has a separate purpose. [defaults, SKILL.md, Sound confirms, never alone; stopmotion-video, references/live.md]
2. **Distinguish enabled from started.** Create or resume the audio context through a user gesture when required, handle the returned Promise, and reflect actual playback/context state. An enabled setting alone does not establish successful playback. [MDN, Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume), [play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)
3. **Give one page a shared audio context.** The supplied cue recipe reuses it and disconnects the completed source's graph. Live scheduling also keeps handles for sounds already scheduled ahead so mute, tempo changes and pause can cancel them. [defaults, recipes.md, Sound; stopmotion-video, references/live.md, Sound scheduled ahead on the audio clock]
4. **Schedule beat-critical sound in audio time.** A lookahead timer queues sources at their own audio timestamps; the frame loop draws from the shared beat. Timer intervals, scheduling horizons and visual leads are measured implementation choices, not device-independent guarantees. [stopmotion-video, references/live.md, sections 1 to 3]
5. **Name the clock and the estimate.** Page time uses milliseconds from `performance.now()`; audio scheduling uses seconds in the context's time system. `getOutputTimestamp()` relates output position to estimated page time. `baseLatency` and `outputLatency` describe different pipeline portions. [MDN, getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp), [baseLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/baseLatency), [outputLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency)
6. **Keep tempo and visibility changes coherent.** Re-anchor a changed tempo without jumping the current pose, stop future sources at the old tempo and resynchronize after the tab returns. A delayed scheduler must not replay a backlog of missed clicks. [stopmotion-video, references/live.md, sections 1, 3, 7 and 8]
7. **Preserve the motion policy independently of sound.** A meaningful still can communicate a beat-driven example under reduced motion. An autoplay exception or the gesture that unlocks audio does not itself request the demo's motion. Existing [motion accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md) remains authoritative. [stopmotion-video, references/live.md, Reduced motion]

## Gotchas

- The source's `void audio.play()` discards the Promise; it does not handle autoplay rejection. Use the actual result before showing a successful playing state. [defaults, recipes.md, Sound; MDN play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)
- The source's fallback chooses `outputLatency || baseLatency`, and its scheduler labels a timestamp difference as latency. Neither establishes exact speaker latency; keep the corrections in [LIVE-BEAT-CLOCKS.md](LIVE-BEAT-CLOCKS.md#map-page-time-to-audio-time).
- The source commits every scene with `flushSync`. React calls that API uncommon and a last resort because it can hurt performance; it is not a default frame-loop requirement. [stopmotion-video, references/live.md, section 2; react.dev flushSync](https://react.dev/reference/react-dom/flushSync)

## Prove it

The selected workflow works with sound disabled and when playback is blocked. Cues have visible equivalents, settings and controls report the actual state, and completed sources release their connections. For live timing, record the browser, output device, clock mapping and measured picture/sound offset; exercise tempo, pause, mute, visibility and reduced motion using [LIVE-BEAT-CLOCKS.md](LIVE-BEAT-CLOCKS.md#prove-it). Report unperformed device or playback checks as unverified. [defaults, SKILL.md, Sound confirms, never alone; stopmotion-video, references/live.md, Checking a live page]
