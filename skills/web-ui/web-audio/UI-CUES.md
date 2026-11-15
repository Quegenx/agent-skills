# Optional sounds for interface feedback

Use cues when the product calls for audio feedback, with the visible interface still carrying the result. The supplied `defaults` skill gives a deliberately sparse palette and two implementation routes: file playback and a short synthesized click. Its values are source choices, not requirements to change an accepted product design. [defaults, SKILL.md, Sound confirms, never alone; recipes.md, Sound]

## Choose the cue and its visible equivalent

[defaults, SKILL.md, Sound confirms, never alone; recipes.md, Sound]

- Confirmations such as an upload or submission can have a cue; an important error can have one too. Pair it with the actual visible status change, rather than making sound the only sign of completion or failure.
- The source keeps typing, hover, scrolling and keyboard navigation silent. Its short cue palette favors a soft toggle click, a brief confirmation chime and a quiet error cue. A metronome or authored media illustration is a different job, covered by [LIVE-BEAT-CLOCKS.md](LIVE-BEAT-CLOCKS.md).
- Provide an off switch and apply the product's sound settings. The source starts at volume `0.3`; retain that as its starting point where adopted, not a calibrated loudness or a universal default.

## Play files and report actual playback

[defaults, recipes.md, Sound; MDN, HTMLMediaElement.play]

- The recipe preloads its cue files, applies the current enabled/volume setting and resets `currentTime` before retriggering. Preloading does not grant autoplay permission.
- **Promise correction:** the recipe calls `void audio.play()`. `play()` returns a Promise that resolves when playback starts and can reject with `NotAllowedError` when playback is disallowed. Handle that result, keep the visual result intact, and offer a user-operated way to start sound where appropriate. Do not mark audio as playing merely because `play()` was called ([MDN play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)).
- For Web Audio, create or resume the context from an allowed user gesture. `resume()` returns a Promise resolving when the context resumes; it rejects for a closed context. Update controls from that result and context state, including failures ([MDN best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume)).

## The source's synthesized click

[defaults, recipes.md, Sound]

The worked recipe shares one `AudioContext`. Each click creates a mono noise buffer lasting about eight milliseconds, a buffer source, a bandpass filter at 4000 Hz with Q 3 and a gain envelope. Gain starts at the supplied volume and decays exponentially to `0.001` across the buffer. The graph connects source, filter, gain and destination; `onended` disconnects the source, filter and gain.

These are the source recipe's parameters, not a definition of how all interface clicks should sound. It also sketches a confirmation oscillator moving from 400 to 600 Hz over 40 ms. Listen in the actual product and preserve its sound direction rather than importing a palette blindly.

**Envelope constraint:** an exponential ramp cannot reach zero. Keep a valid nonzero envelope and stop the source, or skip the muted cue, rather than passing a zero endpoint. The source uses `0.001`; setting the user volume to zero also needs to respect the ramp's constraints ([MDN exponentialRampToValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime)).

## Keep state and controls honest

[stopmotion-video, references/live.md, Starting the sound; defaults, SKILL.md, Sound confirms, never alone]

- A first press intended to start sound must not immediately toggle it back off. The live source uses a 600 ms guard; that number is its workaround, while the required outcome is one press with one coherent result.
- If mute is persisted, guard storage reads and writes so unavailable storage does not break the control. Keep the visible setting and the actual context/playback state distinct.
- The live source sets `navigator.audioSession.type = "playback"` for an explicit Safari sound press. This is not a generic cue-unlock recipe: the API is experimental, and `playback` describes media playback that can pause other playback audio. Check the platform and the intended audio category before using it ([MDN AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)).

## Prove it

- Trigger the actual confirmation/error with sound off: its visible result remains complete. Repeat ordinary typing, hover, scrolling and keyboard navigation; they remain silent under this cue policy. [defaults, SKILL.md, Sound confirms, never alone]
- Check allowed and blocked playback. The first sound-control press starts once, rejection does not show a false playing state, and mute/volume work at the chosen settings. If persistence is promised, reload preserves mute when storage is available; unavailable storage does not break the control and remains a stated persistence limit. [MDN play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [stopmotion-video, references/live.md, Starting the sound]
- Trigger a cue again, inspect its actual result and confirm completed synthetic graphs disconnect. Check muted/zero-volume behavior without an invalid exponential ramp. No setting value alone establishes measured output loudness. [defaults, recipes.md, Sound; MDN exponentialRampToValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime)
