# Camera prompts for generated footage

Camera directions paraphrased from the supplied `n/camera-movments.md`, Shots 01 to 27 and S1 to S6, with its direction and speed variants retained. The source does not identify an author or original site. The existing vocabulary comes from [coreyhaines31/marketingskills, video]; terminology checks use Adobe, Nikon and Snorricam below. These presets specify requested movement, speed, framing and ending, not verified model results. Keep model limits and generation approval in [AI-GENERATION.md](AI-GENERATION.md) and [SKILL.md](SKILL.md#the-rules).

## Choose the camera grammar

[n, camera-movments.md; coreyhaines31/marketingskills, video]

Use the selected preset's four fields together. A direction variant changes its direction, not the meaning of the whole family. Lens zoom changes focal length; dolly, truck and pedestal move the camera; pan and tilt rotate it from a fixed position. Longer focal lengths narrow the angle of view and enlarge the subject, while shorter ones widen it. [Nikon, Understanding Focal Length](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/understanding-focal-length); [Adobe, pan and tilt](https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles/pan-shot.html)

POV and over-the-shoulder describe viewpoint or framing, separately from the camera path. Tilt-shift miniature is a focus/look preset, time-lapse compresses time, and the scale/world transitions below are effects. Adobe lists POV and Over the Shoulder under cameraAngle separately from cameraMove. [Adobe, XMP Dynamic Media](https://developer.adobe.com/xmp/docs/xmp-namespaces/xmp-dm/)

These are footage directions. Code-made camera transforms, measured numbers and existing implementations stay in their owners: [shotlist](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/SKILL.md), [measured camera grammar](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion-camera.md) and [depth and footage](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/DEPTH-AND-FOOTAGE.md). Selecting a prompt does not replace the shotlist's technique selection, story or approval gates. [shotlist, SKILL.md]

## Locked camera and rotation

[n, camera-movments.md, Shots 01, 02, 02B, 03, 03B, 04, 04B]

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 01 Static | Keep the camera in one position throughout the clip. | Motionless and stable. | Preserve angle, height, lens distance and composition. | Match the starting framing and camera position. |
| 02 Pan right | Turn horizontally to the right around a fixed pivot. | Even, smooth rotation. | Keep the horizon level as the right side of the scene is revealed. | Come to rest on a readable composition. |
| 02B Pan left | Turn horizontally to the left around a fixed pivot. | Even, smooth rotation. | Keep the horizon level as the left side of the scene is revealed. | Come to rest on a readable composition. |
| 03 Whip pan right | Snap the viewing direction toward a second target on the right. | Rapid rotation with a short interval of motion blur. | Start with a readable view and carry the eye to another readable target. | Resolve into a sharp, settled frame. |
| 03B Whip pan left | Snap the viewing direction toward a second target on the left. | Rapid rotation with a short interval of motion blur. | Start with a readable view and carry the eye to another readable target. | Resolve into a sharp, settled frame. |
| 04 Tilt up | Rotate upward around a stationary pivot. | Continuous, even tilt. | Keep the upright subject or building centered during the rise. | Arrive on the upper subject or detail. |
| 04B Tilt down | Rotate downward around a stationary pivot. | Continuous, even tilt. | Keep the upright subject or building centered during the descent. | Arrive on the lower subject or detail. |

## Lens zoom

[n, camera-movments.md, Shots 05, 05B, 06, 06B, 07A, 07B; coreyhaines31/marketingskills, video]

These are lens changes, distinct from physically moving closer or farther away. The fast and crash variants belong to the same zoom family, with different requested pacing.

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 05 Slow zoom in | Increase focal length to narrow the frame. | Gradual, uniform change. | Keep the main target legible as its apparent size grows. | Hold a stable tighter composition. |
| 05B Slow zoom out | Reduce focal length to widen the frame. | Gradual, uniform change. | Keep the target legible while revealing its surroundings. | Hold a stable wider composition. |
| 06 Fast zoom in | Increase focal length quickly toward the target. | Brisk and decisive. | Keep the target centered or otherwise clearly legible during enlargement. | Hold the closer view steady. |
| 06B Fast zoom out | Reduce focal length quickly to reveal more around the target. | Brisk and decisive. | Preserve the target's readability as the view widens. | Hold the wider view steady. |
| 07A Crash zoom in | Snap the lens toward a tighter view of the target. | Very fast, emphatic change. | Preserve a readable target through the abrupt enlargement. | Land on a strong tighter composition. |
| 07B Crash zoom out | Snap the lens back to reveal the surroundings. | Very fast, emphatic change. | Preserve a readable target through the sudden widening. | Land on a strong wider composition. |

## Dolly and lateral or vertical travel

[n, camera-movments.md, Shots 08, 09, 10, 10B, 11A, 11B, 12, 12B, 13]

The source's dolly-in is physical forward travel; dolly-out retreats. The existing vocabulary's **slow push** means a gradual dolly-in used to build tension or focus. [coreyhaines31/marketingskills, video]

Truck and slider presets share lateral travel; the slider requests a small, slow displacement with visible depth layers. Pedestal translates the entire camera vertically with a level lens, rather than rotating it as a tilt does. [n, camera-movments.md, Shots 10 to 12B]; [Adobe, distinct Truck, Pedestal and Tilt cameraMove values](https://developer.adobe.com/xmp/docs/xmp-namespaces/xmp-dm/)

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 08 Dolly in | Travel straight forward toward the main subject. | Smooth, controlled approach. | Maintain camera height, lens direction and subject placement as the distance closes. | Arrive at a tighter view. |
| 09 Dolly out | Travel straight backward away from the subject. | Smooth, controlled retreat. | Maintain camera height and lens direction as the surroundings enter the view. | Arrive at a wider view. |
| 10 Truck right | Translate horizontally to the right on a straight path. | Smooth, even sideways motion. | Keep the lens orientation unchanged while the scene moves across the image. | Finish with clear lateral framing. |
| 10B Truck left | Translate horizontally to the left on a straight path. | Smooth, even sideways motion. | Keep the lens orientation unchanged while the scene moves across the image. | Finish with clear lateral framing. |
| 11A Pedestal up | Raise the whole camera on a straight vertical path. | Smooth, uniform ascent. | Keep the lens level and its viewing direction unchanged. | Make the higher composition clearly legible. |
| 11B Pedestal down | Lower the whole camera on a straight vertical path. | Smooth, uniform descent. | Keep the lens level and its viewing direction unchanged. | Make the lower composition clearly legible. |
| 12 Slider right | Make a short sideways translation to the right. | Slow, controlled, even motion. | Preserve readable foreground, subject and background as their parallax changes. | Show the resulting right-side view in a considered composition. |
| 12B Slider left | Make a short sideways translation to the left. | Slow, controlled, even motion. | Preserve readable foreground, subject and background as their parallax changes. | Show the resulting left-side view in a considered composition. |
| 13 Push past / pass-by | Advance past a foreground object, edge or opening. | A smooth forward glide. | Pass near the foreground while revealing the space behind it. | Arrive within or beyond that foreground layer. |

## Arc and orbit

[n, camera-movments.md, Shots 14, 14B, 15, 15B; coreyhaines31/marketingskills, video]

An orbit circles the subject. The arc presets request only a shallow curved change of angle; the orbit presets specify clockwise or counterclockwise travel at a consistent radius.

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 14 Arc right | Follow a shallow curve around the subject toward the right side. | Smooth, deliberate curved travel. | Maintain distance and height, keeping the subject legible as the angle changes. | Show a new right-side angle. |
| 14B Arc left | Follow a shallow curve around the subject toward the left side. | Smooth, deliberate curved travel. | Maintain distance and height, keeping the subject legible as the angle changes. | Show a new left-side angle. |
| 15 Orbit clockwise | Circle the subject clockwise at a fixed radius. | Smooth, controlled circling. | Keep the subject centered as the background turns around it. | Complete the chosen arc or full circle with stable framing. |
| 15B Orbit counterclockwise | Circle the subject counterclockwise at a fixed radius. | Smooth, controlled circling. | Keep the subject centered as the background turns around it. | Complete the chosen arc or full circle with stable framing. |

## Tracking

[n, camera-movments.md, Shots 16 to 22; coreyhaines31/marketingskills, video]

Tracking moves with a moving subject. The variants below change the camera's relative position, height or pace. The follow-shot's over-the-shoulder label describes its framing; the reverse-tracking preset's walk-and-talk label describes its walking use case.

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 16 Tracking | Travel through the scene together with the subject. | Match the subject's pace. | Keep the subject consistently legible while the environment moves around it. | Preserve a clear composition in motion. |
| 17 Follow / over-the-shoulder | Follow behind the subject along its route at shoulder height. | Match the subject's pace. | Use the back, shoulder or head as the near guide, with the route ahead readable. | Continue following with the subject leading the image. |
| 18 Reverse tracking / walk-and-talk | Retreat in front of a subject walking toward the camera. | Match the subject's forward pace. | Maintain stable front-facing face and body framing while the background travels behind. | Preserve a clear front-facing moving view. |
| 19 Side tracking | Move parallel to the subject beside its route. | Match the subject's motion. | Hold a side or three-quarter profile at a consistent distance. | Continue the parallel path with clear horizontal travel. |
| 20 Low tracking | Travel alongside the subject's movement path at ground level or below the waist. | Match the subject, its footsteps or its wheels. | Keep the low detail legible while the ground passes through the image. | Retain the low viewpoint. |
| 21 Vehicle tracking | Travel with a vehicle along its route. | Match the vehicle's pace. | Stabilize the vehicle's place in frame while the road or environment passes. | Maintain a clear moving-vehicle view. |
| 22 Chase | Pursue a moving subject quickly along the action path. | Fast, reactive, close pursuit. | Keep the subject visible while allowing energetic reframing. | Remain connected to the moving subject. |

## Human and body-mounted camera

[n, camera-movments.md, Shots 23, 24; coreyhaines31/marketingskills, video]

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 23 Handheld | Carry the camera at operator height with natural body motion for the existing documentary feel. | Responsive and organic. | Keep the subject readable through slight sway and small framing corrections. | Finish with a natural handheld view. |
| 24 Body-mounted / Snorricam | Lock the camera's relationship to the moving subject's torso or face. | Follow the subject's body motion. | Hold the subject close, centered and facing the lens while its surroundings move. | Keep the subject locked in frame. |

The manufacturer confirms the subject-fixed, surroundings-moving effect of its body-mounted rig. [Snorricam](https://www.snorricam.com/)

## Crane and aerial paths

[n, camera-movments.md, Shots 25, 25B, 26, 26B, 27]

Separate crane up/down from aerial paths. Adobe's metadata vocabulary lists Aerial independently of Crane Up and Crane Down. The old AI-GENERATION.md row combined them as "Crane or aerial" and said "Camera rises or descends"; that omitted the source's forward, backward and broad aerial paths. [Adobe, XMP Dynamic Media](https://developer.adobe.com/xmp/docs/xmp-namespaces/xmp-dm/)

| Preset | Movement | Speed | Framing | End |
|---|---|---|---|---|
| 25 Crane up | Lift smoothly upward through open space. | Slow, controlled rise. | Keep the subject or place legible during the climb. | Reveal the higher scale clearly. |
| 25B Crane down | Descend smoothly through open space. | Slow, controlled lowering. | Keep the subject or place legible during the descent. | Reveal the lower subject or destination clearly. |
| 26 Drone push in | Fly forward through open space toward a subject or destination. | A controlled aerial glide. | Keep both the route and destination legible during the approach. | Arrive at a closer aerial view. |
| 26B Drone pull back | Fly backward away from a subject or destination. | A controlled aerial retreat. | Keep the subject legible as more landscape appears. | Arrive at a wider aerial view. |
| 27 Helicopter-style aerial | Travel at high altitude on a broad, gradual flight path. | Steady, controlled aerial motion. | Keep the landscape or distant moving subject legible at a wide scale. | Finish with stable high-altitude framing. |

## Viewpoint, focus, time and transitions

[n, camera-movments.md, Shots S1 to S6]

These are the source's selected special-effect presets, not universal definitions of POV, lens tilt/shift or time-lapse. Nikon explains that tilt selects the focus plane and shift changes framing while the camera can stay level; a miniature appearance is one use of selective focus. [Nikon, PC Lens Advantage](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/the-pc-lens-advantage-what-you-see-is-what-youll-get)

| Preset | Movement or effect | Speed | Framing | End |
|---|---|---|---|---|
| S1 First-person view | Advance from the character's viewpoint at eye height. | Natural walking or reaching pace. | Include hands, arms or body edges as the preset's physical reference. | Reach the next action point without changing viewpoint. |
| S2 Tilt-shift miniature look | Hold or make a small glide over the scene from a high, angled view. | Small, precise motion. | Keep a narrow sharp band over the important subject area, with softer areas above and below. | Preserve the miniature-scale appearance. |
| S3 Infinite-zoom direction | Request a continuing inward transition; use the existing [infinite-zoom owner](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/DEPTH-AND-FOOTAGE.md#infinite-zoom) for its technique. | Smooth acceleration. | This preset keeps a circular target at the exact center as it expands. | Let the next visual world occupy the whole image. |
| S4 Earth zoom out | Rise from the starting point through street, city, landscape and planet scales. | Rapidly expanding outward transition. | Keep the original location centered while the scale grows. | Reach a planet view with the origin still implied at its center. |
| S5 Locked time-lapse | Keep the camera fixed while the depicted time advances rapidly. | Fast time compression with a stable camera. | Maintain composition and horizon as activity passes through. | Keep the original angle, showing that time has elapsed. |
| S6 Pass through objects | Advance toward a visible object, surface or barrier and continue beyond it. | A smooth, centered glide. | Center the opening or surface that marks the transition. | Arrive inside the space it reveals. |

## Existing rules and source alternatives

The source's locked, settled and body-mounted presets do not replace the existing code-film choices:

- **Locked versus living hold.** Shot 01 requests a fixed camera for the entire clip; S5 also needs a fixed camera for its time-lapse. [n, camera-movments.md, Shots 01, S5] The existing Cinetic recipe says "Under every hold the frame keeps a barely visible push, pull or sideways drift". Keep that code-film guidance; select a locked footage preset explicitly rather than silently imposing drift on it. [cinetic, cam-living-hold; [existing recipe](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/shotlist/library/techniques-camera-1.json)]
- **Settled clip versus accelerating exit.** These source presets often end on a stable composition. [n, camera-movments.md] The measured source's R6.15 says to end a camera moment "still accelerating with no settle". Keep that measured exit choice for the selected code-film moment; a completed generated-clip ending is a separately scoped request. [measured corpus, [motion-camera.md R6.15](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/measured/motion-camera.md#67-camera-micro-drift)]
- **Body lock versus smooth chase.** Shot 24 deliberately locks to the body. [n, camera-movments.md, Shot 24] The existing smooth follow-camera rule says "Never parent the camera to a jittery body." Keep that rule for its chase-camera implementation; a selected Snorricam effect asks for a different relationship. [seek-engine, [DEPTH-AND-FOOTAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/DEPTH-AND-FOOTAGE.md#3d-and-depth)]; [Snorricam](https://www.snorricam.com/)

## Prove it

[n, camera-movments.md; marketing-video, AI-GENERATION.md and SKILL.md; shotlist, existing shot contract]

Record the selected preset and its movement, speed, framing and ending in the shot plan. Inspect the actual clip for those requests and report what it does, rather than claiming that the prompt guarantees them. Keep a lens change distinct from physical travel, a viewpoint distinct from the path, and focus/time effects distinct from movement. Log model, prompt and take using AI-GENERATION.md; preserve the existing product-truth, caption, cost-approval and shot-selection rules. For code-built versions, follow the linked technique owner and verify the rendered result under the existing frame-review workflow.
