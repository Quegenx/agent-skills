# Stop motion on one pose grid

Frame-derived pose timing from the supplied stopmotion-video references/clock.md, poses.md, hits.md, skipping.md and sound.md. Apply this deliberately chosen held-pose style inside the existing [seek contract](SKILL.md#the-contract); it does not select a new renderer. The source defaults to Remotion, while this engine retains its pure-time API. [stopmotion-video, references/clock.md; seek-engine, SKILL.md]

## Keep the pose clock global

[stopmotion-video, references/clock.md, sections 1 to 6 and 9]

- Derive poses from the measured song rather than running a nearby round pose interval that drifts. In the source's eighth-note recipe, two poses make one quarter-note song beat; keep pose counts and song-beat counts distinct.
- A pose may span a fractional number of output frames. Keep that fractional timing until the output needs a whole frame; the source starts pose n on the ceiling of n times frames per pose.
- Count poses on the whole film's clock. A scene-relative restart can shift some changes by a frame against neighboring scenes and music. Scene offsets refer back to the same film clock.
- Keep authored timing and real audio seconds explicit when applying a tempo speed multiplier. Do not mix authored milliseconds, output frames and audio samples under one label.
- In the source's 4/4 eighth-note recipe, pages start on bar lines unless a documented musical reason chooses another song beat. Retiming by whole bars preserves later alignment; a local change can instead recover its poses before the next bar line.

## Space the visible poses

[stopmotion-video, references/poses.md, sections 1 to 8 and 11; references/hits.md, section 7]

- Sample the curve at the poses the audience actually sees. List each step's travel and inspect leaps, tiny creeps, repeated poses inside a move and a first pose identical to the one it leaves. Respacing is the fix; adding smooth frames changes the chosen style.
- A move's first pose is already one step in and its last pose is complete. Transition poses are intermediate states between the old and new pages, whose complete states sit on either side; do not use the same endpoint sampling for both jobs.
- For the hand-placed look, use irregular seeded corrections only during movement, bounded relative to the move. Turn that jitter off at rest. Lift, scale and shadow describe the same physical state.
- Keep a finished pose still. This differs from the existing [moving-hold default](MOTION-NUMBERS.md#rest-is-half-the-film), which says no frame is frozen. Retain both tagged choices: stopmotion-video deliberately holds identical poses; the existing generic film default keeps idle life.
- Camera sampling is also a style decision: the source steps it with the scene, whereas [the existing hand-drawn two-clock recipe](MOTION-NUMBERS.md#two-clocks-for-hand-drawn-films) keeps the camera smooth. Choose explicitly in the brief.
- Hard cuts, sheet overlays and no fades belong to this source film's vocabulary. They do not replace the other film styles or the owner's live UI transitions. [stopmotion-video, references/hits.md, sections 7 and 8]

## One event list for picture and sound

[stopmotion-video, references/sound.md, sections 1 to 3 and 7; references/hits.md, sections 1 and 2]

- Keep one click-pose list for both the visible press and the audio bake. Count the cursor's lead-in backward from the intended hit.
- Place the audio tick from the measured hit time at sample resolution. The first output frame of a pose is not automatically the sample where the drum transient lands; the source's measured lead is specific to its track, not a universal latency correction.
- Keep the checking metronome separate from the delivery mix. When a click moves, rebuild its event list, click track and ducked music; when the excerpt changes, measure alignment again. Audio mixing and mastering remain in [sound-pass](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/sound-pass/SKILL.md). [stopmotion-video, references/sound.md, sections 5 to 7]

## Prove it

[stopmotion-video, references/poses.md, section 11; references/skipping.md, sections 9 to 12]

- Record pose-to-frame mapping, each move's sampled travel, transition endpoint treatment, declared bar exceptions and any retime recovered before the next bar line. Review the rendered click against its audio transient rather than assuming a frame-placed cue is sample-aligned.
- State units with timing: the source calls three frames 120ms, which is true at 25fps; at 30fps three frames are 100ms before any authored-time speed mapping. Recompute for the selected output rather than copying that equivalence. [stopmotion-video, references/poses.md, section 10; arithmetic: frames divided by fps]
- Check flashes across cuts and the loop seam. WCAG 2.3.1 permits at most three flashes in any one-second period, or flashing below the general and red-flash thresholds; its area and luminance conditions matter. The source's shorthand says under three full-frame flashes per second, and its song-beat rate alone does not establish conformance. [W3C](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)
