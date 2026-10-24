# Living illustrations

Drawn characters, creatures, props and small scenes, from rossark0's rossark-motion-skill: SKILL.md, MOTION.md, both motion and live-face templates, and the Chef, Garden, Reveal and Orbit demos. Its numbers are illustration starting points in drawing units and milliseconds, not interface requirements. Read [MATH.md](MATH.md#illustration-tracks-and-stable-variation) for the shared primitives and [React Native illustration](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-ILLUSTRATION.md) for that platform's implementation contract. [rossark-motion-skill, SKILL.md sections 2 to 5]

## Scope and project rules

[rossark-motion-skill, SKILL.md sections 0, 1 and 7; ui-animation, SKILL.md]

- Read the project's motion notes and the art file's constraints first. Preserve the drawing at frame zero, then split moving parts at their actual pivots: a stem's base, a door's hinge, the head's neck or a hanging object's hook.
- Choose one main action and two or three quiet idle loops. Repeated parts get stable differences in phase, speed and size; do not generate new random values every frame.
- Keep motion inside the drawing. The surrounding layout stays fixed; a body can squash inside its allotted box without resizing the page's component.
- Apply the existing [frequency gate](TIMING.md#should-it-animate-at-all) to the interface that contains the illustration. A constantly jiggling gift is this source's illustration recipe, not permission to animate every waiting control.
- Rossark favors strong timed curves, small amplitudes and no bounce unless the project wants a bouncy brand. The owner's `app-ui`, `landing-page-ui` and `agent-chat-ui` retain their own curves, bounces, press scales, opacity treatments and timing. For example, Rossark's press scale is about .97; [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#buttons) uses `scale(1.07, .91)`, and its [motion ceiling](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md#motion-tokens) limits app motion to 1s. Do not replace either with a multi-second illustration default.

## Recipes by subject

[rossark-motion-skill, SKILL.md section 3]

Use the artwork's coordinate system for the units below. These are source starting points, not measured properties of a new reference.

| Subject | Source recipe |
|---|---|
| Character or creature | Breath rises 1 to 2 units over 3 to 5s; head tilt 3 to 6 degrees; blink every 3 to 4s. |
| Tail, ears, hair, antenna | Rotate around the root by 4 to 10 degrees; delay the wave phase by .1 to .2 per segment. |
| Plant, tree, grass | Sway 1.5 to 4 degrees around the base, 3 to 6s per cycle; leaves add small seeded phase differences, tips move farther than the base. |
| Flag, curtain, cloth, scarf | Split into strips or points; a traveling phase moves along the length, with amplitude growing away from the fixed edge. |
| Fire or candle | Lean 2 to 4 degrees and stretch 3 to 6% on two waves, such as 700 and 1100ms; the inner flame has another period. |
| Smoke or steam | Two or three out-of-phase wisps rise 8 to 14 units with a bell envelope. |
| Water | Rings grow from zero to full size with a bell envelope; a traveling wave drives surface points; floating objects bob 1 to 2 units and rock 2 degrees. |
| Rain, snow, falling leaves | Linear loop progress with seeded phase, speed variation of plus or minus 20% and horizontal drift; snow adds a slow sideways wave. |
| Clouds and sky | Horizontal drift over 20 to 60s, slower in distant layers; sun rays rotate once in 30 to 60s. |
| Lights, lamps, stars, screens | Glow grows 2 to 5% over 2 to 4s; seeded star twinkles, brief LED on/off and rare screen flicker. |
| Machines, gears, fans, clocks | Linear gears follow their tooth ratio; clock hand steps each second with ease-out, colon blinks each .5s, fan turns steadily. |
| Phone or alarm | Bursts of plus or minus 3 degrees, four cycles in about .45s, separated by pauses; vibration marks appear only during a burst. |
| Vehicle | Body bobs .5 to 1 unit; wheels rotate linearly; background layers drift at different speeds. |
| Waiting box, gift or card | Squash/widen pulse of 1.5 to 3% over 200 to 350ms, alternating a roughly 1% sideways bulge; stop during tap anticipation. Keep this in the rare illustration tier. |
| Floating or levitating | Enter from a quarter to a third of the object's height below, slow down, drift down and back a few percent, then rise while disappearing. |
| Icon or logo | Play once on appearance, then rest. No endless loop on interface chrome. |
| Chart or diagram | One-shot line draw, bars growing from their base with 40 to 80ms staggering, numbers easing toward their final data. |
| Scene | One main action, followed by the remaining quiet idle motion. |

Rossark's general rule permits opacity only for appearance/disappearance, but its own star recipe includes an opacity dip. Treat that as a source-specific illustration preference; keep the owner's partial-opacity hover states. Do not replace their existing dimming behavior. [rossark-motion-skill, SKILL.md sections 1 and 3; landing-page-ui, MOTION.md#hover-details; agent-chat-ui, MOTION.md]

## A face that stays part of the drawing

[rossark-motion-skill, SKILL.md section 4; templates/react-native/liveFace.tsx; templates/swiftui/LiveFace.swift]

- Draw plain eye whites first. Place moving pupils in the head's coordinates, clipped to the white. Skin-colored lids and cheeks cover the white, then the nose, fringe or glasses cover those layers where the art requires it. The clipping correction is owned by [SVG clipping](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md#illustration-lids-and-touching-edges).
- Keep gaze X/Y, upper lid, optional independent right lid, cheek, mouth depth and head tilt as separate channels. Tilt belongs on the head layer, not on a detached face overlay.
- A source loop lasts 6 to 9s. Give it one or two glances, about 500ms to travel and at least 1s holding the gaze. Close a blink over about 110ms, hold 30 to 50ms, reopen over about 190ms with ease-out. Let the lower lid rise about 15% to meet it; place blinks on head turns and occasionally use a double blink.
- At 30fps a 70ms close occupies about two frames. Rossark recommends longer readable blinks and a 60fps export where allowed; this is its timing preference, not a WCAG threshold or a guarantee that every shorter move flickers.
- Split back hair, body, head with its face, and foreground hands or props. Do not tilt the head away from a hand touching the face. Extend cropped artwork below the crop so breathing does not expose its edge.
- A creature without this face rig can still breathe, turn its head and carry delayed ear or tail motion.

| Feeling | Source face treatment |
|---|---|
| Tired | Downward or screen gaze, lid resting at .3 to .4, slower blinks and one heavy blink. |
| Sad | Down and away, lid .1, slow blinks and a slow upward glance. |
| Happy | Look between viewer and friend, open lids and a cheek squint once per loop. |
| Talking | Look at the listener; mouth track has 8 to 14 syllable shapes, around 180ms each. |
| Focused | Fixed task gaze, lid .1, rare blinks and small gaze changes. |
| Sleepless | Wide eyes toward ceiling and clock, followed by a slow tired close. |

## Acting between poses

[rossark-motion-skill, SKILL.md section 5; templates/react-native/motion.ts]

- Use a continuous pose track for a chain of body, arm and head poses, rather than easing to a full stop at every key. Repeat a value to hold it, then layer idle motion over that hold. The tangent and endpoint behavior is defined once in [MATH.md](MATH.md#illustration-tracks-and-stable-variation).
- Layer each channel as key pose, idle waves, delayed parent follow-through and a windowed accent. The source's moving holds use body height variation of plus or minus 1 to 1.5% over 2 to 3s, head tilt of plus or minus 2 degrees over 4 to 5s, weight drifting over 4 to 5s, a turn around 5% of a full turn, and small out-of-phase limb and joint motion. Choose idle periods that divide the loop. These belong to a visible acting character, not every component.
- Follow-through reads the parent 60 to 150ms earlier at .3 to .6 strength. The source's counter-motion is `own(t) - 0.45 * lean(t - 110)` for the head; its trailing joint adds `0.45 * (parent(t - 90) - parent(t))`. Keep the parent and child channels independently editable.
- A limb has two segments and a shared round joint: root angle `a`, bend `e`, forearm direction `a + e`. Keep the left and right sides out of phase and avoid mirroring every gesture.

| Arm gesture | Root angle | Bend and accent |
|---|---|---|
| Wave | About 60 degrees | About 110 degrees, waving 10 to 15 degrees on a .6 to .9s period. |
| Hand on hip | About 30 degrees | About -95 degrees. |
| Cheer | About 55 degrees | About 60 degrees. |
| Balance | About 80 to 120 degrees | Straight joint. |
| Raised V | About 150 degrees | Straight joint, with about 30% additional reach. |

## Turns, weight and contact

[rossark-motion-skill, SKILL.md section 5; demo/ChefScene.swift; demo/GardenScene.swift; demo/RevealScene.swift]

- For the source's 2.5D turn, keep the head outline fixed: nose moves about 13% of head width, eyes and mouth 10%, ears and back hair about 9% in the opposite direction. Chest markings shift 8 to 12% of torso width and stay clipped inside the torso.
- Shift weight over the support leg. The source estimates support-leg angle as sideways shift divided by leg length, in radians, and lifts or relaxes the unloaded leg. A floating figure has limp feet, with ankles around 60 to 80 degrees and asymmetric knees, rather than feet planted on an invisible floor.
- Falling height follows quadratic progress; the source adds 5 to 10% stretch, 15 to 20% squash on landing and a small recovery. A hop anticipates with 5 to 10% crouch. Its demos use `1 / pow(s, 0.6)` to widen during squash: call this stylized compensation, not exact area or volume conservation. Before added breathing, width times height is `s^0.4`.
- Keep the shadow on the floor and vary its size with height. Its shape follows the camera: a thin pill in a flat view, a wider oval from above. The source's `1 - height / 220` is an example in its drawing units, not a transferable scale.
- Props enter already moving from beyond the visible edge, including the device screen edge. Rolling rotation is distance divided by radius. On a strike, shift onto the support side, wind up, pass through contact at the fast middle of the swing, follow through, then watch the prop go. A launched prop follows the source's ballistic position, `x0 + vx*s`, `y0 - vy*s + g*s*s/2`, with seconds as the time unit.
- The source's contact accent lasts 60 to 100ms, with roughly 15% squash along the hit and 10% widening across it. Resolve the actual contact point from the same transforms used to draw the hand, prop or landing surface. The chef demo shares pan/hat transforms with its pancake endpoints and solves the hand toward the pan grip; the garden demo emits each drop from the watering can's transform at its birth time.
- Keep attention connected to events: eyes follow the prop, then the face follows. In the chef demo the eye target is delayed 50ms and face pitch 140ms; these are that scene's choices, not general perception constants.

## Build and frame for the camera

[rossark-motion-skill, SKILL.md sections 5 and 10; demo/RevealScene.swift; demo/OrbitScene.swift]

- A slightly elevated, toy-like camera changes the whole build. Rossark starts with head 40 to 50% of total height, torso about .6 head widths tall and narrower than the head, no visible neck, legs a quarter of total height or less, arms reaching the hips and round feet tucked under trousers or socks.
- The floor-visible shadow is about 1.3 to 1.5 head widths, a third as tall as wide, with feet in its lower half. Keep these proportions in one build record and derive floor contact from it. Do not force this style onto a supplied character with different proportions.
- Frame the widest pose and highest jump before scaling up the character. On a phone, place its feet in the lower screen area; keep background fills tall enough for the actual screen.
- For an orbiting foreground/background rig, the Orbit demo sorts cards by depth, draws the back group, then the subject, then the front group; face width changes as cards turn edge-on. General collection pose interpolation stays in [COLLECTIONS.md](COLLECTIONS.md).

## One scene, one clock

[rossark-motion-skill, SKILL.md sections 6, 8 and 11; ui-animation, PERFORMANCE.md#reduced-motion]

- Write beats as named start/end windows and overlap the next action with the preceding one. Hold the final meaning-bearing frame after a one-shot. In a carousel, run only the visible scene and avoid an empty or dark frame between scenes.
- Pause unseen clocks, including backgrounded and hidden scenes. One clock drives a character or scene, rather than one timer per part. The React Native source cancels and resets its loop on visibility changes; it does not preserve a paused loop's phase.
- Rossark freezes loops at frame zero and puts active reduced-motion one-shots at the final frame. Existing [UI reduced-motion guidance](PERFORMANCE.md#reduced-motion) keeps short fades, and the protected owner designs retain their documented behavior. Keep these source views explicit rather than globally replacing one with the other.
- Autoplaying motion must also meet [the applicable motion criterion](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/MOTION-AND-ZOOM.md#which-criterion-motion-falls-under). Hiding work offscreen or honoring reduced motion does not replace the pause/stop/hide mechanism where SC 2.2.2 requires one.

## Prove it

[rossark-motion-skill, SKILL.md sections 5, 10 and 11]

- Inspect frame zero, active one-shot final frame and loop seam; record any jump, detached hand, exposed crop or shadow that stays fixed while its subject rises.
- In a visible acting hold, check that the intended idle and follow-through remain; left and right do not move in lockstep, and props meet their actual contact surfaces.
- Compare matching moments and the motion measurements using [reference motion](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/pixel-reverse-engineer/REFERENCE-MOTION.md). State what was read or rendered and what remains unseen on a real device; a source demo is not evidence that the target app runs smoothly.
