# Live sound and picture on one beat

Use this for an interactive beat-driven page or metronome, where tempo and playback can change while the browser is drawing. `stopmotion-video/references/live.md` supplies the shared clock, lookahead scheduler and interaction recipe. Its example is a particular live page, not a browser timing guarantee. Offline music analysis and cue mixing stay with [beat-grid](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/beat-grid/SKILL.md) and [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md).

## Share one beat and re-anchor tempo

[stopmotion-video, references/live.md, One clock on the page's time]

- Store an anchor beat, anchor page time and tempo. Derive the current beat from elapsed `performance.now()` time, rather than incrementing an independent scene counter on each frame.
- On a tempo change, first compute the beat at now under the old tempo, make it the new anchor, then apply the new tempo. The current pose continues rather than jumping.
- Draw each scene as a pure function of the shared beat and its loop phase. The source counts two poses per metronome click; define that subdivision explicitly if adopting the recipe.
- Offscreen examples stop listening to the frame clock. The source has one animation-frame loop while at least one scene listens, and none when no scene does. Its choice to sound only the most visible example is a page policy, not an autoplay or audio API rule.

## Map page time to audio time

[stopmotion-video, references/live.md, sections 2 and 3; MDN, getOutputTimestamp]

`AudioContext.getOutputTimestamp()` relates two time systems. `contextTime` describes the sample frame at the audio output device in the context's seconds; `performanceTime` estimates when that sample frame was rendered, in the same milliseconds and origin as `performance.now()`. The source maps a desired page time by adding its offset from `performanceTime`, converted to seconds, to `contextTime`. This is an estimated output mapping, not proof that the physical speaker and display presented simultaneously ([MDN getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp)).

Keep the source's approximations explicit:

- **Different latency portions:** `baseLatency` measures processing from the graph's destination to the host audio subsystem; `outputLatency` estimates the subsequent output path to the audio device. The source's `outputLatency || baseLatency` fallback treats them as alternatives. They are not interchangeable measurements of one total delay ([MDN baseLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/baseLatency), [outputLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency)).
- **Not a latency measurement:** the source computes a difference between `currentTime` and the mapped output time and calls it latency. The Web Audio specification explicitly says the difference between `currentTime` and the timestamp's `contextTime` is not a reliable output-latency estimate, because `currentTime` may advance non-uniformly. Use the API's output estimate where supported, and report missing timestamp/latency support and any measured fallback limits ([Web Audio, getOutputTimestamp](https://webaudio.github.io/web-audio-api/#dom-audiocontext-getoutputtimestamp)).
- **Measure the picture lead:** the source draws 25 ms ahead after observing late pictures on its page. Re-measure the rendered picture against output sound on the actual browser and device; its 25 ms lead and Bluetooth latency range are not portable calibration values. [stopmotion-video, references/live.md, The picture on or just ahead of the sound; Checking a live page]

The source calls every React listener inside `flushSync` on each animation frame. React documents that API as uncommon, potentially expensive and a last resort. Do not make synchronous React flushing a general requirement for live audio; choose it only for an integration that needs it and verify the cost ([react.dev flushSync](https://react.dev/reference/react-dom/flushSync)).

## Queue sound on the audio clock

[stopmotion-video, references/live.md, Sound scheduled ahead on the audio clock]

- Let a timer schedule upcoming beats, with each source's `start(when)` using the audio context's time coordinate system. The frame loop draws; it does not decide the precise playback instant. `start()` without a future time starts immediately ([MDN start](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/start)).
- The example wakes every 25 ms and schedules a 120 ms horizon. These values cover that implementation's lookahead, not arbitrary main-thread stalls. Check the future scheduling window in audio time and on the actual output path instead of assuming a timer interval guarantees audible timing.
- Skip events already late rather than firing them as a burst. Keep scheduled source handles and their times so changing tempo, muting or pausing can stop future sources before they play; clearing the JavaScript timer alone does not cancel already scheduled audio. `stop(when)` schedules a stop, and an omitted time stops at once ([MDN stop](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/stop)).
- The source routes coincident clicks and metronome hits through shared output gain and a compressor. Compression reduces loud peaks when sounds overlap; check the actual overlap rather than treating its gain, threshold or ratio as a clipping guarantee ([MDN DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)). [stopmotion-video, references/live.md, The metronome's own sound]
- When the tab becomes hidden, suspend the source page's audio and stop its scheduling work. On return, synchronize scheduling to the current beat instead of replaying the hidden interval. Resume through the actual context state and Promise, subject to playback policy ([MDN resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume)).

## Pause, sound controls and reduced motion

[stopmotion-video, references/live.md, sections 4, 7 to 9 and 11]

- The rhythmic page pauses at the click nearest the press: if ahead, it continues to that click; if just passed, the source settles back to it. Restart anchors that click at now, keeping a whole click until the next. Its 160 ms return is a source animation choice.
- A committed tempo change also cancels beats queued at the old tempo. The source's editor applies Enter and restores the old value on Escape or blur; its 60 to 200 BPM range belongs to that demo, not to Web Audio.
- Sound controls and playback permission follow [UI-CUES.md](UI-CUES.md#keep-state-and-controls-honest). Keep mute separate from permission or context suspension; the initial unlock press must not also mute.
- Under reduced motion, hold a meaningful still pose. The source moves only after an explicit sound-control press, not after automatic playback or an unrelated unlock gesture. Preserve the product's accepted motion policy and the existing [motion accessibility requirements](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md); sound permission alone does not replace them.
- Count an authored ending hold in beat subdivisions when it must finish on a click at every tempo. For a metronome-only illustration, the source lands meaningful starts and arrivals on audible clicks, with faster motion between them; this is its choreography, not a requirement for ordinary interface feedback.

## Prove it

[stopmotion-video, references/live.md, Checking a live page]

Record the browser, output path and actual picture/sound offset, rather than judging sync by ear alone. Check speakers and the supported headset path; change tempo mid-move without a pose jump or old-tempo click, pause and resume on the intended beat, and mute with future events already queued. Hide and restore the tab without a catch-up burst. Check an initial sound-control press, persisted mute where promised, blocked playback and the actual context state. Under reduced motion the chosen still communicates the example until the applicable explicit request. Name unsupported timestamp/latency APIs, untested devices, measured lead and remaining drift; a running context or timer does not establish physical output synchronization.
