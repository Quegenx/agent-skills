# Reconstruct an edited browser demonstration

An optional screenshot-to-video workflow from [MengTo/Skills, browser-video-recording/SKILL.md and scripts/render_browser_demo.py]. Capture real application states, then render deliberate cursor/camera choreography between them. Label this as an edited reconstruction; it does not measure the application's actual transition time or prove continuous live interaction. Live capture remains in [APP-RECORDING.md](APP-RECORDING.md).

## Capture the states first

- Use the browser selected by the task and capture actual click, navigation and scroll results. Save named browser-only screenshots after important changes, with target coordinates in the source viewport. A rendered fake page is not evidence of an actual product state. [MengTo/Skills, browser-video-recording/SKILL.md, Dependency Model; Capture Workflow]
- Establish capture dimensions, output ratio, frame rate and duration before framing. The source preset captures 1920 by 1440 and renders 3840 by 2880 at 60 fps; call it the source's 4:3 preset rather than assuming a recorder's “4K” enum guarantees those dimensions. Verify actual returned output. Reset any viewport override after the capture session. [MengTo/Skills, browser-video-recording/SKILL.md, Optional Native Recorder Support; Capture Workflow; Verification]
- Preserve a transparent cursor image and its hotspot, using an available authorized asset or the selected platform's actual capture support. Native-recorder APIs are optional and must be verified from the installed integration; the source's enum names do not establish another host's schema. [MengTo/Skills, browser-video-recording/SKILL.md, Self-Contained Execution; Optional Native Recorder Support]

## Keep one explicit choreography record

The source configuration records named screenshot shots, scene start times/transitions, viewport-space cursor keys, camera position/zoom keys, click times, duration, frame rate, output/source sizes and cursor scale. Keep these together so the rendered motion is reproducible. Do not introduce a second recorder or renderer when the project's established video engine already owns this job. [MengTo/Skills, browser-video-recording/SKILL.md, Render Script; repository dependency convention]

- Let the cursor arrive, briefly pause and click before the displayed page changes. Keep movement sparse and target-driven; frame the selected content rather than chasing every cursor movement. Subtle click feedback is the source default; decorative rings are optional only when requested. [MengTo/Skills, browser-video-recording/SKILL.md, Motion Rules]
- The source prefers mostly straight cursor paths. Existing [APP-RECORDING.md](APP-RECORDING.md) follows the house cursor-arc guidance; retain that default and treat the straight-path method as an explicitly selected source alternative. [MengTo/Skills, browser-video-recording/SKILL.md, Motion Rules; existing asset-prep APP-RECORDING.md]
- Source tuning values are cursor scale 3, click strength 15 and rotation up to 8 degrees driven by horizontal velocity. They describe this renderer's intended look, not universal cursor dimensions or proof of native input. [MengTo/Skills, browser-video-recording/SKILL.md, Default visual target]

## Prove it

When rendering is authorized, inspect the encoded file's actual dimensions, frame rate, duration and codec with the existing media verification workflow. Inspect representative frames and the full interaction sequence for browser-only crop, cursor visibility/hotspot, click ordering and camera framing. Report the real screenshot source, edited reconstruction method and any unavailable native recording surface; no generated crossfade establishes live product latency. [MengTo/Skills, browser-video-recording/SKILL.md, Verification; Dependency Model]
