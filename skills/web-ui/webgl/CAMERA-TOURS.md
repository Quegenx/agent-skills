# Object inspection and guided camera tours

Use the object branch for hover lean plus click-to-lift, and the tour branch for travel through a place with room destinations and optional inspection. Both need one final camera owner and explicit interruption state. The source object study adds hover/dolly to a workshop's lift mechanism; the tour source distinguishes its reference's guided walk from additional collision-based free walking. [MengTo/Skills, 3d-orbit-inspect-demo; 3d-virtual-tour]

## Object inspection: keep the click target still

[MengTo/Skills, 3d-orbit-inspect-demo, SKILL.md and demo.html]

- Hover leans the camera, while inspection lifts the object on another render layer. Freeze camera lean on pointer-down and while the object is held, or camera easing can move the target before the pointer-up raycast.
- Gate hover gain on the actual raycast, and derive the target from pointer position relative to the piece. Normalize against the actual canvas rect, not an assumed full-window viewport. Raycast again on pointer-up against the appropriate layer.
- Use the actual event's pointer type as input to the interaction. A media query describes device capability and cannot establish that the current pointer event is touch or mouse. The source's touch sway is a chosen presentation, not a requirement under reduced motion.
- One pointer-down begins the click/drag decision. Source thresholds are less than 6 px and 600 ms; a drag cannot also open inspection. Scope touch-action and capture to active inspection, then restore the page's scrolling behavior.
- Source lean bounds are azimuth plus/minus 0.30 radians, elevation plus/minus 0.09, with `1-exp(-4.5*dt)` damping and hit-gain time constant 0.30 s. Keep them source tuning rather than a default for differently framed objects.

### Lift with independent layers and stored poses

[MengTo/Skills, 3d-orbit-inspect-demo]

The object moves to the inspection layer without cloning it. Render the room, the selected dim layer, clear depth, then the held object. Lights must be visible to the corresponding layer. A scene background or automatic clear in the second pass can erase the first; preserve explicit clear/background ownership and restore it for a shared renderer.

Store the original pose before moving the object. Source perspective-preserving handoff interpolates camera-space `x/z` and `y/z`, then applies interpolated depth. A canceled lift uses the stored from-pose; it must not re-read the already moving object as its destination.

Fit the subject into the band left by settled navigation/caption layout. The source formula is `fit=min(0.92*bandH,0.88*W)/(2*R*ppu)` with `ppu=H/(2*D*tan(fov/2))` and D 1 m. These coefficients and the caption offsets are specific to that HUD. Resize and portrait fitting must not hide the held piece beneath its own caption.

Source inspection recipe:

| Behavior | Selected parameters |
|---|---|
| Open |1.0 s, `1-pow(1-k,4.4)`, arc `sin(pi*e)*0.06` m |
| Home |0.60 s, fast close 0.28 s; straighten over progress 0 to 0.36, descend over 0.24 to 1 |
| Dim |Opacity 0.80 times lift progress |
| Drag |0.0085/0.0065 rad per px; spin decay `exp(-2.4*dt)` |
| Idle |0.26 rad/s after 2.2 s, disabled for reduced motion |
| Zoom |0.70 to 1.45 times fit; wheel `exp(-dy*0.0012)`, damping `1-exp(-8*dt)`; pinch distance ratio |
| Pitch |0.25 to 1.30 rad, home 0.72, relaxation `exp(-0.35*dt)` |

Close has its own clock starting from the visible current lift/rotation progress. Do not restart a half-open lift from zero. The source allows a longer return for a more rotated piece and resets zoom on close.

Use a real inspection trigger and close/return control, keyboard manipulation where supported and a separate status announcement. Return focus only after its opener is visible again. The supplied demo traps Tab while declaring a nonmodal surface; do not copy this as a general dialog pattern. Match the actual modality using [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md).

### Check the actual preparation and lifecycle

[MengTo/Skills, 3d-orbit-inspect-demo, SKILL.md and demo.html; existing webgl]

If the held-object pass uses another light set, prepare the actual variant before first interaction. A comment claiming both variants were warmed is insufficient when the extra light was not enabled in the warm-up path. Static shadows must refresh when an object leaves or changes layer, or its bench shadow can remain behind.

The source's reduced-motion intent is no lean/idle spin and immediate lift, while direct drag/keys/zoom remain. Parts of its touch/reduced path still schedule work; preserve the existing [still, hidden and teardown contract](WIDGETS.md#accessibility-and-layout), rather than importing the demo's loop. Do not blindly erase userData as its clone workaround suggests; define ownership instead. Three.js warns functions in `Object3D.userData` are not cloned. [Object3D](https://threejs.org/docs/pages/Object3D.html)

## Tour: route coordinates outlive the page layout

[MengTo/Skills, 3d-virtual-tour, SKILL.md and REFERENCES.md]

Choose only needed modes: guided sampler, room destination, bounded inspection, and free walking when requested. Orbit controls alone do not produce a walkable interior; a panorama collection can use linked viewpoints without implying geometric depth.

Store route keys as progress/time, position, look target or orientation and FOV. Stops have stable IDs, labels, route coordinates and asset groups; route coordinate is independent of page height and animation clock. Put keys before, inside and after narrow openings, with floor-relative eye height and deliberately timed turns/landmarks.

A smooth curve can cut a corner between collision-free keys. Validate the complete interpolated route, including camera near-plane clearance, against walls, ceilings, furniture and doorframes. Curve parameter is not automatically distance or travel time; select arc-length sampling for constant speed, or author timed pauses. The source uses nonuniform timed Hermite; it does not establish that every tour uses the same spline. [Three.js Curve](https://threejs.org/docs/pages/Curve.html)

Orientation keys can use quaternion slerp. Interpolated look targets must not coincide with or cross the camera. Update projection when FOV/aspect changes through the canonical [resize owner](THREEJS-AND-R3F.md#resize-and-pixel-ratio).

## Save and restore navigation mode

[MengTo/Skills, 3d-virtual-tour]

- One state machine gives one controller the final camera write. Inputs request a transition; route, orbit and transition handlers cannot all mutate the live camera independently.
- Entering inspection saves route coordinate, active stop, prior playback and scroll bookmark, then freezes guided progress. Start on the viewer's compatible side of the scene.
- Validate the full handoff path. A direct interior-to-exterior lerp can cross a roof; use safe waypoints or an intentional fade/cut when a credible continuous path is unavailable.
- Returning restores exact saved state and reconciles scroll. Clear stale drag velocity/damping and resume only prior running playback. Disable inactive controllers, including their settling updates.
- A new destination interrupts from the current pose and replaces stale work. It cannot queue several camera tweens or allow an obsolete asset load to reveal an old destination.

## Keep stops, world and controls in agreement

[MengTo/Skills, 3d-virtual-tour]

- Room cards, rail, floor plan and hotspots use one stop registry. Declare world-to-plan transform rather than assuming world Z matches the plan's vertical axis; use boundary hysteresis for selected room/segment.
- Navigate through a safe connecting route or an intentional cut/fade. Synchronize selected labels and optional URL state with actual destination; history changes at meaningful navigation, not every rendered frame.
- Derive doors, captions and exposure from route coordinate so backward seeks and jumps immediately produce correct state. Timer-only door callbacks can leave the path blocked after seeking. Preserve user season/lighting overrides unless the route explicitly owns them.
- Prefetch by route proximity and prepare a directly selected destination before revealing it. Hold a stable useful view during loading; failed optional assets cannot trap navigation. Cache shared assets and reject obsolete requests.
- Guided-path culling is conditional on the camera mode. Re-evaluate regions for orbit/free inspection before missing rooms become visible.
- Free walking needs walkable surfaces and collision/clearance; pointer lock supplies look input, not floor following. Touch users need an equivalent path and a visible exit from immersive controls.
- Keep stops available as semantic HTML controls and a keyboard room list beside graphical navigation. Escape and Return release inspection, focus returns to its trigger, and forms/unrelated controls keep their input behavior. Scope pointer capture/touch-action to the active region and handle cancel/lost capture/blur.

## Prove it

For object inspection, click and drag separate correctly; lean freezes before selection; drag/wheel/pinch/keys work; every close path, including interrupted opening, returns the exact stored pose and focus. For a tour, travel forward/backward through every opening, select every stop/list/map path and inspect from start/interior/end before returning to saved state. Interrupt with a new destination, Escape, resize, hidden-tab interval and asset failure. One camera owner, correct labels/doors/assets, released scroll lock and informative reduced-motion views remain. Name actual performed checks and unverified device behavior. [MengTo/Skills, 3d-orbit-inspect-demo; 3d-virtual-tour]
