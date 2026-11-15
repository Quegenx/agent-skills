# Remove motion without breaking the interface

Use this for an explicitly requested subtraction pass: too much animation, repeated entrances or an interface that feels delayed. The source is Emil Kowalski's `remove-animations`, not permission to remove an accepted product decision. Adding or retuning motion remains [AUDIT.md](AUDIT.md); the competing frequency and timing policies remain [TIMING.md](TIMING.md#should-it-animate-at-all). [Emil Kowalski, remove-animations, SKILL.md]

## Inventory and decide

[Emil Kowalski, remove-animations, The Gate, Where to Hunt and Workflow]

- Record the stack, motion libraries, tokens and animated surfaces, then their purpose and frequency. Sweep keyboard actions, repeated navigation and list hovers, scroll reveals, ambient loops, charts that restart from zero, mount-time counters, staggered rows and loading flashes. Clear each class explicitly or record candidates at their actual source locations.
- Give every candidate a decision and the branch that decided it: delete, reduce or keep. Preserve motion that explains a relationship or prevents a disorienting jump. A subtraction pass also lists considered motion deliberately kept and why; do not invent a minimum number of examples.
- The source deletes keyboard-triggered and 100+-a-day motion, reduces frequent motion and permits rare delight. Those are its strict choices; this skill's existing frequent-action and duration alternatives still stand. Marketing explanation has more latitude than routine product work, without making repeated content-blocking reveals automatically useful.
- Reduce the same motion rather than redesigning it. If retained motion needs a different spring, easing or origin, report that for a separate tuning pass. Keep documented tradeoffs and all protected owner designs.

## Check what removal would break

[Emil Kowalski, remove-animations, Removal Hazards]

| Before deleting | Preserve the behavior |
|---|---|
| Hidden start states, `initial` opacity, reveal classes or filled keyframes | Remove the hidden start state with the animation so content remains visible. |
| `animationend`, `transitionend`, `onExitComplete` or duration-sized timers | Remove obsolete waits and put required work at the actual state change. |
| Exit-delayed unmount | Check cleanup and focus timing when the element leaves sooner. Motion's `AnimatePresence` retains nodes for their exit, and `onExitComplete` runs when all exiting nodes finish. [Motion](https://motion.dev/docs/react-animate-presence) |
| Layout or FLIP animation concealing a jump | If removal exposes a layout problem, retain that animation and report the underlying layout issue rather than silently expanding the subtraction pass. |
| Focus moved after motion | Move required focus with the state change once that wait is removed. |
| Checks waiting for animation classes or durations | Update the affected expectation within the authorized verification scope. |

## Clean the trail and report

[Emil Kowalski, remove-animations, Cleanup and Required Output Format]

Remove only newly orphaned keyframes, classes, variants, presence wrappers, imports and token/config entries after checking their remaining references. Replace a `motion.*` element only when none of its motion behavior remains. A now-unused motion dependency is a separate removal decision under the project's authorization rules.

Report each changed location, previous behavior, delete/reduce decision and deciding branch. Also report retained motion, deferred tuning, orphaned code removed and actual verification. Compare the running result when authorized; source inspection alone cannot establish the resulting feel. The source's blanket tests/typecheck step does not override the user's verification restrictions.

## Prove it

[Emil Kowalski, remove-animations, Hard Rules, Removal Hazards and Required Output Format]

Every removed animation has a recorded purpose/frequency decision and hazard check. Content remains visible, required callbacks and focus still occur, retained behavior is named, and cleanup leaves no references to removed identifiers. Report unperformed runtime and device checks explicitly.
