# Combat, enemy decisions and readable contact

Use this for action timing, a monster system, enemy AI, encounter pressure, combat animation or game effects. The sources share an authoritative gameplay clock and separate its decisions from rigs and views. Their anatomy constants and visual score targets are selected-project rubrics. [MengTo/Skills, design-action-combat; build-game-monster-system; build-threejs-enemy-systems; tune-enemy-ai; design-game-encounters; game-dev-combat-animation; game-dev-combat-skill-polish; create-game-vfx]

## Define the action before its animation

[MengTo/Skills, design-action-combat; build-game-monster-system; build-threejs-enemy-systems]

- Describe startup, active windows, recovery, cooldown, contact schedule, facing/turning commitment and interruption rules in the move definition. Range and angle determine legal moves; a click expresses intent and does not itself award damage.
- Give an action an identity and deduplicate hits against each target for that action. A looping attack creates a new action identity for its next attack, rather than sharing a permanent already-hit set or creating a new identity every rendered frame.
- Damage and reward follow authoritative contact. Animation, effects, audio and hit reactions observe that event. They must not each infer their own hit from a pose, particle arrival or callback.
- Make the moveset sampler pure enough to inspect a specific game time and phase. Preserve a fixture for startup, contact and recovery, including interruption and death/despawn/reset transitions.

## Separate perception, intent and motion

[MengTo/Skills, build-threejs-enemy-systems; tune-enemy-ai; design-game-encounters]

- Perception supplies target and world information; intent selects a legal action; motion follows the game's navigation/collision contract. The rendered model is not a substitute for any of these.
- Choose attacks by range, angle, cooldown and current commitment. Give the player visible telegraphs, recovery windows and counterplay. Bound pursuit and provide an unstuck, disengage and reset path.
- Tune the encounter's role pressure and player decisions together. Cap committed attackers where the selected encounter requires it; mixed roles should leave readable repositioning and escape routes.
- Complete, fail and reset the encounter explicitly, with reward once. Increasing enemy speed, damage and aggression together makes a poor diagnostic for which decision or pressure failed.

## Measure the actual rig

[MengTo/Skills, game-dev-combat-animation, references and tools]

- Write the action's reference-based standard before grading it. State upper-arm, forearm and blade intent; inspect the shoulder-relative hand arc and reachable world blade direction instead of treating named key poses as proof of a good swing.
- Sample the actual gameplay clock and loaded rig. After chest rotation, fit the remaining pose against world segment directions. Inspect both player camera views and full-resolution body/contact crops.
- Compare actual CPU-skinned mesh regions with the bind pose for stretch/crush, and collect failures across all moves and relevant body regions rather than stopping at the first assertion. Describe the source probe's body mesh, dominant-bone region assignment, exclusions and sampling limits.
- The source's no-twist/no-corrective HumGen joint ranges, bow anchor/hook/release/recoil and kinetic-chain recipes are rig-specific. Do not turn their constants into universal anatomical or engine limits.
- Nearest sampled vertex distance is an unsigned clearance heuristic; it cannot prove that two mesh surfaces do not intersect. A region probe that assigns a boundary edge from one endpoint can also distort regional percentiles. Keep visual review and probe scope explicit.

## Make effects follow the same cause

[MengTo/Skills, create-game-vfx; game-dev-combat-skill-polish]

- Give telegraph, travel, contact and aftermath different roles and lifetimes. Attach effects to the correct world point, joint or socket; use bounded pools and release them on interruption, death and reset.
- Start body reaction at actual contact/arrival. An arc attack can stagger contacts along the actual blade path; each ability retains its own contact schedule and pose.
- Sample motion for camera-facing trails and ribbons. Distinguish the visible effect, the impact and the body's response so a larger flash does not hide a missing reaction.
- Give reflective metal a useful environment and deliberate external illumination when that is the chosen look. Source bans on all primitives, exact art scores and comparison ceilings are project heuristics, not renderer laws.
- Lower quality can reduce decorative density or pass cost while retaining timing, targeting and readable telegraphs. Performance comparison uses the same encounter in [GAME-VERIFICATION.md](GAME-VERIFICATION.md).

## Capture the moment being judged

[MengTo/Skills, game-dev-combat-animation; game-dev-combat-skill-polish, references and tools]

Freeze or step the real game clock, wait for the resulting rendered frame, and capture contact plus aftermath. A useful strip identifies the caster, target, hero and arrival, with the actual game time and camera. Keep source changes out of a take. A stepped pose is evidence about that pose, not live frame pacing.

Separate readability checks from the art rubric. Optional anonymous fresh review, a lower-score aggregation rule and fixed reference anchors are source review protocols, not validated measurement instruments. State capture conditions, unresolved failures and a plateau instead of manufacturing a target score. The source capture tools contain hard-coded game paths and silent-success/timeout gaps; they are not supplied here as a general verifier.

## Prove it

The same action sampled live or at a fixed game time has the same phases and contacts. Repeated dispatch cannot hit or reward twice; interruption, death and retry clear owned action/effect state. Enemy pursuit and selection remain legal, the encounter leaves counterplay, and contact strips show the reaction at the authoritative moment. Label rig heuristics, art judgments and unperformed device checks. [MengTo/Skills, design-action-combat; build-game-monster-system; tune-enemy-ai; design-game-encounters; game-dev-combat-animation; game-dev-combat-skill-polish]
