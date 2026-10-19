# Film delivery

Film outputs, production records and encoded-file inspection from the existing delivery workflow. [Quegenx/agent-skills, videos workflow at 48e92a7]

## Delivered files

Before calling it done, the gates on the delivered file all pass and their numbers go into the production log: smoke counters at 0, `look.py` G0 (renders, moves and right length; audible audio only with `--expect-audio`, failing gate exit only with `--strict`), G2 (no run of more than 3 flat frames), G3 (end hold, final-shot share), `chrome_lint.mjs` G5 (no page chrome), and by eye G1 (the proof is readable: UI text at least 4% of the height, the fragment large or cropped by the frame) and G4 (one hero per frame). Never certify the film as good; say what was checked. The review lookup of AI defaults against designer decisions is [the measured review](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/MEASURED-REVIEW.md).

Keep the delivery folder clean: deliverables at the top, QA material (sheets, crops, reports) in `out/qa/` and `reviews/`.

1. `out/<format>.mp4` for every format, rendered from the same timeline
1b. For feeds, encode H.264 High profile at roughly 8-15 Mbps; much under 5 Mbps and the platform's re-encode visibly degrades it (render.mjs's CRF 16 at 1080p usually lands there; check the bitrate with ffprobe).
2. `out/poster.png`: the strongest frame, usually the last (`render.mjs still <t> --out out/poster.png`)
   For a landing page add a muted file (`render.mjs full --audio none`) and web encodes of it, best codec first: AV1 (`ffmpeg -i out/16x9.mp4 -c:v libsvtav1 -crf 35 -preset 6 -pix_fmt yuv420p -movflags +faststart -an out/16x9.av1.mp4`), a VP9 WebM (`ffmpeg -i out/16x9.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -an out/16x9.webm`), and the H.264 MP4 as the fallback every browser plays (the `<source>` order and why all three: [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md#images-and-video)). Decode each with frame-review's `verify_delivery.py --bg <ground>`: the ground must come back as the token and check the selected loop contract in [frame-review DELIVERY-CHECKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/DELIVERY-CHECKS.md#loop-contracts). The old instruction universally required duplicate first/last decoded frames.
3. the contact sheet of the decoded master
4. the final shot list and the exact runtime
5. the source folder and the commands that reproduce the render
6. the list of real assets used, with sources and licences
7. two lines on the motion language (the carrier, the curves, the camera)
8. what still needs a human eye, and any compromise you made
9. optional extras from the same timeline: a cover still at another size (2000×800 article cover, 1280×720 thumbnail) as a format of the same scene, and a GIF preview for a README or a post: `ffmpeg -i out/16x9.mp4 -vf "fps=12,scale=420:-1:flags=lanczos,hqdn3d=4:4:6:6,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out/preview.gif` (keep it under ~4 MB)
   **A looping cover GIF** (a newsletter or post cover that moves): animate only the one element the user named, nothing else; rotate the loop so the first frame shows the finished picture (inboxes and link previews show frame 1 as a still); encode a flat image with no dithering (`palettegen=max_colors=128:stats_mode=full` then `paletteuse=dither=none`), which otherwise adds flicker to every frame; then measure, don't eyeball: the seam (mean difference between the last and first frame, target 0.0-0.3 on 0-255 grey at 216 px) and the excursion (the largest difference of any frame from frame 0, about 0.7-2.8; near 0 means nothing visible moves; never measure at the halfway frame, where a sine is back at zero). Look at it at 240 px wide, the inbox size, and check the uploaded link still ends in `.gif`. Animating a still image: mask the named element by colour, soften the mask's edge, change only those pixels (a video model asked to hold the camera still pushes in anyway; code is the only way to lock it). In ffmpeg's `eq` filter add `eval=frame`, or the expression is evaluated once and nothing moves.
   **GIF clock:** inspect encoded frame delays and total loop duration, not just the requested fps. GIF89a stores delay in hundredths of a second. The source's 24 fps export therefore needs a check of its encoded timing rather than an assumption that every requested frame interval is represented exactly. [cinetic, references/finishing.md; https://www.w3.org/Graphics/GIF/spec-gif89a.txt, section 23]
10. the production log: every input and its source and licence; what made the pixels and the sound for each shot (code, supplied footage, which external model and version); model and service usage and cost, render time, revision count; the human decisions; claims still unverified

Credit honestly. "One prompt", "all code", "no external assets" and "no human edits" are four separate claims: state only the ones that are true, and say what the audio is (synthesized, supplied, generated, voiced).

Do not call a film done because the encoder exited 0: it is done when the evidence says it works.

## Prove it

Every requested format and its decoded contact sheet are present; the source commands reproduce the output; the production log records the actual checks and remaining limits. [Quegenx/agent-skills, videos workflow at 48e92a7]
