# Live HTML demos of a product workflow

For an authored app window on a page, HTML Demo supplies named steps, a shared clock and views computed from time. It is an illustration of a real feature, not evidence that the depicted app performed the action. Keep the existing [product illustration direction](PRODUCT-ILLUSTRATIONS.md), actual product references and protected owner designs. No HTML Demo runtime is bundled here. [html-demo, SKILL.md; references/contract.md; references/brief.md]

## Define steps and their clock

[html-demo, references/contract.md, A step and Writing a step; scripts/StepWindow.jsx; scripts/step-window.js]

- Give each step a stable unique identity, short visible name, duration and view. The source's React stage keys by that identity, so a step change remounts it; choose that reset intentionally.
- Compute phases, typed text, progress, reveals, counters and pointer position from the supplied local time. Put cue times at the definition so retiming does not require finding literals throughout the drawing. Avoid a separate timer, state-changing effect or unseeded randomness inside the view.
- Show the starting context, the action, the app's working state and the result. The result's end frame must be a complete composition because reduced motion uses it as the still for that step.
- Keep one external clock when playback controls or a scrubber drive the whole window. Expose step selection, pause, resume and seek through that clock instead of starting competing clocks in each view.

## Separate computed motion from CSS smoothing

[html-demo, references/contract.md, Two kinds of motion]

A value computed from the requested time can reconstruct that moment after a seek. A CSS transition or keyed animation also depends on prior playback: pure view state alone does not make its rendered intermediate frame exact. Use computed motion wherever a frozen or scrubbed frame must be exact. Waiting for a transition to settle establishes its settled state, not its pose at the requested intermediate time.

For the live version, retain the [canonical playback and performance checks](PRODUCT-ILLUSTRATIONS.md#rehearse-in-the-host). The source's hidden/offscreen guard skips state updates while its interval still wakes; do not describe that implementation as doing zero work while hidden. [html-demo, scripts/StepWindow.jsx; scripts/step-window.js]

The source says playback requires 30 percent visibility, but its callbacks assign `isIntersecting`. That Boolean establishes intersection, not the fraction. Use the actual [intersectionRatio](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/intersectionRatio) for a fractional visibility requirement; [isIntersecting](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry/isIntersecting) has a different contract. [html-demo, references/contract.md; scripts/StepWindow.jsx; scripts/step-window.js]

## Measure in the stage's coordinate space

[html-demo, references/contract.md, Aiming at real elements and The window; references/brief.md]

- Aim at the rendered target, accounting for the stage's position and uniform scale. Re-measure after a label or layout change; recorded coordinates are not valid merely because the click timestamp stayed the same. Gesture choreography remains in [GESTURES.md](GESTURES.md#authored-cursors-and-drags).
- The source uses a fixed 1200 by 750 design stage scaled into a 16:10 window. This is a scoped alternative for a miniature whose content remains readable at the host size. The existing illustration rule still makes a narrow composition separately; scaling this demo is not permission to squeeze the production app or abandon that rule. [html-demo, references/contract.md; stageshow, references/craft.md]
- Keep illustrated controls distinct from the real step buttons and playback controls. The source stylesheet's `pointer-events: none` does not itself remove keyboard focus, as [MDN documents](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events). Use the existing [accessibility owner](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md) for the actual semantics. If using [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert), keep the illustration's description outside that subtree, which is also removed from the accessibility tree. [html-demo, scripts/step-window.css]

## Schedule a whole workflow from its dependencies

[html-demo, references/film.md, Flows scheduled from their graph, Beats after the run and The camera]

- For a workflow graph, derive a step's start from completion of its inputs, then any declared travel delay. Adding a node should retime its dependents instead of leaving a hand-timed downstream sequence stale.
- Fold earlier beat state and elapsed cues into the requested frame so values persist until a later cue changes them. Rebuilding a moment from the beginning avoids relying on which frames played before it.
- Measure camera targets from the laid-out nodes and the available canvas area. Store a measured camera transform with the flow identity and apply it only to that flow, so the next canvas does not inherit the previous one's camera.
- Preserve the outgoing flow's last frame through its exit before showing the new flow. Preload the next flow's assets. CSS camera smoothing retains the seek limitation above.
- Record any compressed demonstration of a real run as a presentation choice. A shortened demo clock does not establish the product's actual processing time. [html-demo, references/film.md, Flows scheduled from their graph]

## Integrate several windows coherently

[html-demo, references/brief.md]

Finish one window as the visual reference before splitting optional section work. Give each section explicit files, a unique CSS and keyframe prefix, the same real product references, tokens and asset boundaries. Export a shared view once and import it where reused. Compare contributors' captures yourself before integration, and keep their reported deficiencies as the next revision's concrete work.

## Prove it

[html-demo, references/contract.md; references/brief.md; references/film.md]

Review each step's opening, action, payoff and end frame in the real host, then pause, seek, replay, interrupt and return from offscreen. Distinguish exact computed frames from CSS-settled captures. Verify measured pointer targets, real labels/assets, flow-specific camera state and reduced-motion stills. Inspect screenshots and console output; a helper's exit status or a contributor's report alone is not that review.
