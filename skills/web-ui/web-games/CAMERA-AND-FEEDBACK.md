# Player camera, mobile input and semantic feedback

Use this for a game camera, touch controls, lock-on/shake or game sound. Camera and feedback consume gameplay state while preserving visible threats, objectives and controls across devices. [MengTo/Skills, build-game-camera-controls; build-mobile-threejs-games; build-game-audio-feedback; create-game-vfx]

## Keep one final camera owner

[MengTo/Skills, build-game-camera-controls]

- Follow one declared target with separately tuned position and look smoothing. Keep important threats, objectives and movement space within the intended view.
- Apply lock-on, scripts and shake as temporary modifiers, with an explicit return/reset path; independent systems cannot directly overwrite the final camera in the same frame.
- Bound the camera and handle occlusion/collision. A camera that follows the player numerically can still hide the current attacker or move through a wall.
- For a guided tour or object-inspection handoff, use the detailed [webgl camera and tour contract](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/CAMERA-TOURS.md) rather than creating another controller owner.

## Treat mobile as a playable journey

[MengTo/Skills, build-mobile-threejs-games; test-playable-web-games]

- Define portrait and landscape layouts, touch zones and simultaneous movement/action behavior. Controls cannot cover required threats or leave the only action outside reachable space.
- Preserve HUD, run and input meaning through orientation changes. Handle multitouch cancellation, pointer release and background/resume so a lost pointer cannot keep moving or attacking.
- Quality tiers lower presentation cost without changing authoritative gameplay. Test actual mobile input and device pacing separately from a desktop browser resized to a phone viewport.
- Renderer buffer sizing and camera projection synchronization remain in [webgl THREEJS-AND-R3F.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/THREEJS-AND-R3F.md#resize-and-pixel-ratio).

## Emit game meaning once

[MengTo/Skills, build-game-audio-feedback; create-game-vfx]

- Route cues from semantic action, phase, contact, reward and game-state events. Each mesh/view must not independently trigger a second version of the same sound.
- Assign cue priorities and a bounded voice count so important contact/telegraph feedback survives a crowded encounter. Music follows game state; mute and settings apply coherently to existing and future voices.
- Pair sound with visible feedback. Browser user activation, blocked playback, shared context, mute/volume and node teardown stay in the canonical [web-audio](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-audio/SKILL.md) owner; an enabled setting is not evidence of successful sound output.
- Effect timing follows the authoritative contact contract in [COMBAT-AND-ENEMIES.md](COMBAT-AND-ENEMIES.md), including interruption, cancellation and reset.

## Prove it

The camera keeps intended threats/objectives visible, temporary modifiers return coherently and walls do not expose unintended camera paths. Movement plus action, canceled touch, orientation and background/resume preserve input and state on supported devices. A semantic contact triggers its intended feedback once, priority/voice limits hold, and the game remains complete with sound disabled or blocked. Name unperformed actual-device and playback checks. [MengTo/Skills, build-game-camera-controls; build-mobile-threejs-games; build-game-audio-feedback; test-playable-web-games]
