# Evidence for a playable browser game

Use this when validating a game change, a combat take, a performance improvement or a release artifact. The sources combine reproducible fixtures with an actual journey and keep screenshots, pose probes and live device evidence distinct. These are acceptance criteria; running a build, test, browser or deployment still follows the task's authorization. [MengTo/Skills, test-playable-web-games; optimize-threejs-games; game-dev-combat-animation; game-dev-combat-skill-polish; ship-web-games]

## Exercise a coherent journey

[MengTo/Skills, test-playable-web-games]

Cover launch, new game, controls, the core action, an enemy encounter, reward, inventory/progression, save/continue, loss/retry, pause, settings and completion as appropriate to the selected change. Use desktop keyboard/pointer and actual supported mobile variants; a green build does not show that this journey works.

Give the journey a reproducible seed and state fixtures for combat phase, loadout, boss phase, tutorial step, save migration, low health and error states. Test important transitions directly rather than only replaying a long happy path. Keep each journey's instructions and observable outcomes separate; ordinary gameplay evidence must still exercise actual controls, collision and progression.

Check authoritative contact and reward once, retry/reset, save integrity, console errors, accessible alternatives, responsive controls and intended failure states. Fixtures accelerate investigation; they do not replace the real launch/continue route.

## Capture what the claim requires

[MengTo/Skills, game-dev-combat-animation; game-dev-combat-skill-polish; build-vesperfall-review-assets; existing webgl, THREEJS-AND-R3F.md]

- Identify actual asset/action, game time, camera and revision. Freeze or step the real gameplay clock and wait for its rendered result before taking a contact or aftermath strip.
- Use full-resolution views/crops for contact, body deformation and small effects. Keep caster, target and arrival visible where the judgment needs them; do not edit the source between frames of one take.
- Label a source inference, fixed-time pose, visual judgment, heuristic mesh probe and live pacing measurement separately. A source numeric art rubric is not a validated instrument; optional blind reviewers do not change that.
- Equal screenshot byte sizes do not prove duplicate frames. The source tool's timeout or silent zero exit does not prove the game was ready. Report actual captured frames and failures, not presumed success.
- A phone-sized headless viewport is responsive evidence; actual mobile controls, thermals and pacing require actual supported-device evidence. Report those checks as unverified when unavailable.

## Compare the same encounter

[MengTo/Skills, optimize-threejs-games; create-game-vfx]

Record device/browser, viewport, camera, quality, actors and active effects before optimizing. Distinguish CPU from GPU pressure and compare the same gameplay path afterward. Draw-call or triangle totals alone are not measured live FPS. Reduce decorative cost before removing combat information, and confirm contacts, collision and decisions did not change with the visual tier.

Generic allocation, instancing, resource, color-space and drawing-buffer checks stay in [webgl THREEJS-AND-R3F.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/webgl/THREEJS-AND-R3F.md). Source author hardware timings remain source reports, not expected results on the target device.

## Validate the artifact that ships

[MengTo/Skills, ship-web-games; build-game-changelog]

Identify the actual artifact and deployed revision. A local tree different from the deployed build does not validate production behavior. Exercise the deployed path and critical launch/continue route when release verification is authorized; cleanup removes only owned temporary resources and cannot discard a player save or another task's work.

Player-visible release history follows [INVENTORY-AND-RELEASES.md](INVENTORY-AND-RELEASES.md). Deployment operations and publishing authorization remain with the selected delivery workflow.

## Prove it

Report exact fixtures/journeys, revision/artifact, device/browser and capture conditions, actual results and remaining gaps. Repeated contact/reward, input cancellation, inventory/save, retry and pause meet the declared state contracts. Performance comparisons repeat the same encounter, visual findings have evidence, and no unrun device, deployment or gameplay check is claimed as coverage. [MengTo/Skills, test-playable-web-games; optimize-threejs-games; ship-web-games; game-dev-combat-animation; game-dev-combat-skill-polish]
