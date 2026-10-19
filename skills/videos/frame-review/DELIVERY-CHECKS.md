# Delivery checks

Inspect the decoded delivery rather than relying on page screenshots or encoder success. [Quegenx/agent-skills, videos workflow at 48e92a7]

## Delivered-file checks

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,color_primaries,color_transfer -show_entries format=duration -of compact out/16x9.mp4
python3 scripts/waveform.py out/16x9.mp4                                                              # out/qa/wave.png: hits on the coral cue lines
python3 scripts/look.py out/16x9.mp4 --out out/look --expect <seconds> --expect-audio --strict         # G0 render exists, G2 no run of more than 3 flat frames, G3 end hold 0.6-1.4 s (--hold-warn 2.5 for a launch film's designed end card) and final shot under 25%; cuts, pre-cut frames, audio audit, motion band
# look.py takes cuts from out/<film>.mp4.events.json (render.mjs writes it from timeline().cuts) and detects them only when no cut is declared. Shutter blur and --grain change its frame differences: run the gates on a render without --grain.
node scripts/chrome_lint.mjs index.html                                                              # G5 no page chrome: corner labels, tracked caps, counters, metadata, header bars, kickers, deck layouts, progress bars, letter-typed headlines, vibe-coded UI cards
uv run scripts/energy_arc.py out/16x9.mp4 --map audio/map.json                                      # the measured energy arc: peaks where the norms put them, 40-60% rest, the picture climbing with the music
uv run scripts/verify_delivery.py out/16x9.mp4 out/16x9.webm --bg "#0a0a0a" --duration <s>   # decoded pixels: ground equals the token (a mismatch needs investigation of the sampled background and encoding), add --loop only for the duplicate-endpoint profile below; for an --alpha render, extract one alpha frame (`ffmpeg -i f.mov -vf alphaextract -frames:v 1 a.png`) and composite the clip over a light and a dark ground to check the edges; --step 3 for a film drawn on threes; probes t:x,y=#hex
uv run scripts/check_sync.py out/16x9.mp4 audio/mix.wav                                              # sync lag ≤ 1 ms, true peak ≤ -1 dBTP, -14 LUFS ±1, LRA, loudest moment
ffmpeg -i out/16x9.mp4 -vf "fps=2,scale=320:-1,tile=6x5" -frames:v 1 out/contact.png                  # contact sheet of the actual file
ffmpeg -i out/16x9.mp4 -vf "fps=1,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png                    # phone test of the actual file
ffmpeg -stream_loop 1 -i out/16x9.mp4 -c copy out/loop_check.mp4                                       # loops: watch the seam twice
ffprobe -v error -select_streams v -show_entries frame=pts_time -of csv=p=0 out/16x9.mp4 | awk 'NR>1{d=$1-p; if(d<m||m=="")m=d; if(d>x)x=d}{p=$1}END{print "frame spacing", m, x}'   # even timestamps
```

Check the size, fps, duration, yuv420p and BT.709 tags against the brief; that frame timestamps are evenly spaced and the duration is exact; that the first frame of the file is the composed frame 0; and the contact sheet of the decoded file, not just the page's sheets (the encode can shift colour and band gradients). Loudness is re-measured on the delivered file, after the AAC encode. Then report plainly: what was checked, the final scores, what was fixed, and what still needs a human eye (feel and rhythm can't be judged from stills). Audio was measured, not heard: say so, and ask a person to listen to the whole track, especially narration (names, terms, numbers).

## Loop contracts

[Quegenx/agent-skills, render.mjs, smoke.mjs and verify_delivery.py at 48e92a7]

The template wraps seek(D) to seek(0), while an N-frame render ends at D - 1/fps. Smoke compares the seam step with neighboring steps. `verify_delivery.py --loop` instead requires duplicate first and last decoded frames. Keep that stricter source variant only for a brief that requires duplicate endpoints; ordinary continuous loops use the seam review and the decoded loop playback above. The old delivery command applied `--loop` universally.

## Evidence limits

[Quegenx/agent-skills, frame-review scripts at 48e92a7]

Use `--expect-audio` for a profile that requires audible audio and `--strict` when a failing look.py gate must fail the command. The old example enabled neither. Inspect its actual GATES result. A missing usable sync correlation is unverified, not a measured pass. Pass the same selected `--lufs` profile to the mixer and sync checker; the source foley-only -20 profile differs from the generic -14 profile. Still images cannot establish sound or continuous rhythm.

The smoke contrast check uses relative text-box height and sampled background pixels. It is a film heuristic, not proof of WCAG conformance; the official text-size/contrast definitions are in [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md#contrast). [https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum]

## Prove it

Report the selected profile, measured gates, actual decoded frames and any unverified measurements. A stopped review budget never counts as passing a gate. [Quegenx/agent-skills, videos workflow at 48e92a7]
