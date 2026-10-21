# Vocabulary: the name for a motion effect

A reverse lookup: someone describes an effect loosely ("the bouncy thing when a popover opens", "it resists and snaps back") and gets the exact term back, so a human can tell an agent "Morph, not Crossfade" in two words. The glossary is Emil Kowalski's `animation-vocabulary` skill, "For naming an effect, not designing or building one" (tagged [Emil Kowalski, animation-vocabulary]); its definitions are quoted as it gives them, with two corrected against the official docs. After each term, **Built:** points to where this repo builds it, or says that it doesn't.

For exact Animista preset identifiers and preview defaults, use the separate [Animista catalog](ANIMISTA.md); this glossary retains the general effect definitions. [Animista, animista.json and animista-play-catalog.md]

**Contents:** [Naming method](#naming-method) · [Close terms told apart](#close-terms-told-apart) · [Entrances and exits](#entrances-and-exits) · [Sequencing and timing](#sequencing-and-timing) · [Movement and transforms](#movement-and-transforms) · [Transitions between states](#transitions-between-states) · [Scroll](#scroll) · [Feedback and interaction](#feedback-and-interaction) · [Easing](#easing) · [Spring animations](#spring-animations) · [Looping and ambient motion](#looping-and-ambient-motion) · [Polish and effects](#polish-and-effects) · [Performance](#performance) · [Principles to know](#principles-to-know) · [Prove it](#prove-it)

## Naming method

[Emil Kowalski, animation-vocabulary]

1. **"Read for intent, not keywords."** Users describe what they see or feel ("springy", "slides off", "draws itself in"), not the technical name; map the sensation to the term.
2. **"Quote the glossary verbatim."** Its descriptions are authoritative; don't paraphrase them.
3. **"Disambiguate close terms."** When two compete, contrast them so the user can pick ([below](#close-terms-told-apart)).
4. **When nothing matches exactly,** name the closest term and say plainly it's an approximation, or compose terms: "that's a *stagger* of *scale-in* entrances".
5. **"Stay within this glossary."** If a term isn't here, say so rather than inventing one.
6. **"Keep it tight."** Lead with the term; expand only if asked.

**Answer format:** the term in bold and its definition; if several fit, the best match first, then 1-2 alternates with a one-line note on how each differs. The source's worked examples:

- A popover that seems to grow out of the button you clicked, not from its middle: **Origin-aware animation**.
- One image that turns into another: **Morph**. Close alternates: **Crossfade**, "if they simply fade over each other in the same spot"; **Shared element transition**, "if an element travels and transforms from one position into another".
- The iOS scroll that resists and snaps back when you pull too far: **Rubber-banding**.

This is the vocabulary behind "Name the part" in [SKILL.md](SKILL.md) and its warning that "smooth transitions" produced a crossfade where a morph was meant. A feel asked for in words (heavy, snappy, bouncy) maps to spring numbers in [PHYSICS.md](PHYSICS.md#words-to-stiffness-and-damping).

## Close terms told apart

[Emil Kowalski, animation-vocabulary]

- **Clip-path vs Mask:** a clip-path cuts to a shape; a mask is "like clip-path, but with soft, fadeable edges".
- **Pop in vs Bounce:** Pop in is an entrance "with a slight overshoot"; Bounce is "A spring that overshoots and settles".
- **Shared element transition vs Layout animation:** a shared element "travels and transforms from one position into another"; a layout animation is one element whose own "size or position changes".
- **Morph vs Crossfade:** a morph is one shape turning into another; a crossfade is two elements fading "in the same spot".

## Entrances and exits

How elements appear and disappear. [Emil Kowalski, animation-vocabulary]

- **Fade in / Fade out**: Element appears or disappears by changing opacity. Built: [PATTERNS.md](PATTERNS.md#enter-and-exit).
- **Slide in**: Element enters by sliding in from off-screen (left, right, top, or bottom). Built: [TIMING.md](TIMING.md#direction-and-weight).
- **Scale in**: Element grows from smaller to full size as it appears, often paired with a fade. Built: [PATTERNS.md](PATTERNS.md#enter-and-exit).
- **Pop in**: Element appears with a slight overshoot, like it bounces into place. Built: the overshoot column in [TIMING.md](TIMING.md#duration-by-element).
- **Reveal**: Content is uncovered gradually, often by animating a clip-path or mask. Built: [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move), [svg CLIP-AND-MASK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md#css-clip-path-and-mask-on-html).
- **Enter / Exit**: The animation an element plays when it's added to or removed from the screen. Built: [PATTERNS.md](PATTERNS.md#enter-and-exit), [NATIVE-CSS.md](NATIVE-CSS.md#top-layer-enter-and-exit).

## Sequencing and timing

Coordinating multiple elements or moments. [Emil Kowalski, animation-vocabulary]

- **Keyframes**: Defined points in an animation (0%, 50%, 100%) that the browser fills the gaps between. Built: [NATIVE-CSS.md](NATIVE-CSS.md#web-animations-keyframes-take-offsets).
- **Interpolation / Tween**: Generating all the in-between frames between a start and end value, so motion is continuous. Built: [MATH.md](MATH.md#start-from-the-graph).
- **Stagger**: Animate several items one after another with a small delay between each, creating a cascade. Built: [TIMING.md](TIMING.md#staggers-and-sequencing).
- **Orchestration**: Deliberately timing multiple animations so they feel like one coordinated motion. Built: [TIMING.md](TIMING.md#composing-a-sequence).
- **Delay**: Time before an animation starts. Built: [TIMING.md](TIMING.md#staggers-and-sequencing).
- **Duration**: How long an animation takes. Built: [TIMING.md](TIMING.md#duration-by-element).
- **Fill mode**: Whether an element keeps its first or last frame's styles before the animation starts or after it ends (e.g. forwards). Built: `fill: "forwards"` on baked keyframes in [PHYSICS.md](PHYSICS.md#bake-physics-into-waapi-keyframes); no rule for it here.
- **Stepped animation**: An animation that is divided into discrete steps, like a countdown timer. Built: not in these skills.

## Movement and transforms

Changing an element's position, size, or angle. [Emil Kowalski, animation-vocabulary]

- **Translate**: Move an element along the X or Y axis. **Scale**: Make an element bigger or smaller. **Rotate**: Spin an element around a point. Built: [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).
- **Skew**: Slant an element along the X or Y axis, shearing it out of its rectangular shape. Built: [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move) ("skew is not an independent transform value").
- **3D tilt / Flip**: Rotate in 3D space (rotateX / rotateY) to add depth. Built: the tilt card in [MATH.md](MATH.md#face-the-direction-of-travel), [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#morphs-and-other-effects).
- **Perspective**: How strong the 3D effect looks - a lower value exaggerates depth, like the viewer is closer. Built: [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#morphs-and-other-effects).
- **Transform origin**: The anchor point a scale or rotation grows or spins from. Built: [PATTERNS.md](PATTERNS.md#modals-sheets-popovers), [svg REUSE-AND-TRANSFORMS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/REUSE-AND-TRANSFORMS.md#transform-origin-and-transform-box).
- **Origin-aware animation**: An element animates out of its trigger, like a popover growing from the button that opened it instead of from its own center which is the default in CSS. Built: "Grow from the trigger" in [PATTERNS.md](PATTERNS.md#modals-sheets-popovers). The CSS default is `transform-origin: 50% 50% 0` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-origin)).

## Transitions between states

Connecting one state, view, or element to another. [Emil Kowalski, animation-vocabulary]

- **Crossfade**: One element fades out as another fades in, in the same spot. Built: named as a tell when shapes could transform, in [PATTERNS.md](PATTERNS.md#tells-of-template-motion).
- **Continuity transition**: A change that keeps the user oriented by visually connecting before and after. For example, making the same rectangle bigger and smaller. Built: "what changed, and where did it go?" in [SKILL.md](SKILL.md), [PATTERNS.md](PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail).
- **Morph**: One shape smoothly turns into another shape, e.g. Dynamic Island. Built: [PATTERNS.md](PATTERNS.md#a-button-that-grows-into-a-panel), [PATTERNS.md](PATTERNS.md#icons-that-turn-into-each-other), [svg MORPHING-ICONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/MORPHING-ICONS.md#three-lines-per-icon).
- **Shared element transition**: An element travels and transforms from one position into another, like a thumbnail expanding into a card. Built: [PATTERNS.md](PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail).
- **Layout animation**: When an element's size or position changes, it animates to the new spot instead of snapping. Built: [PATTERNS.md](PATTERNS.md#lists-that-stagger-reorder-and-remove).
- **Accordion / Collapse**: A section smoothly expands and collapses its height to show or hide content. Built: [PATTERNS.md](PATTERNS.md#height-and-accordions), [NATIVE-CSS.md](NATIVE-CSS.md#details-and-height-auto).
- **Direction-aware transition**: Content slides one way going forward and the opposite way going back, so navigation has a sense of direction. Built: [TIMING.md](TIMING.md#direction-and-weight), [NATIVE-CSS.md](NATIVE-CSS.md#view-transitions).

## Scroll

Motion tied to scrolling or navigating between views. [Emil Kowalski, animation-vocabulary]

- **Scroll reveal**: Elements fade or slide into place as they enter the viewport. Built: [PATTERNS.md](PATTERNS.md#scroll-linked-motion).
- **Scroll-driven animation**: An animation whose progress is tied directly to scroll position. Built: [NATIVE-CSS.md](NATIVE-CSS.md#scroll-driven-animations), [modern-css SCROLL-ANIMATIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/SCROLL-ANIMATIONS.md#scroll-driven-animation).
- **Parallax**: Background and foreground move at different speeds while scrolling, creating depth. Built: [PATTERNS.md](PATTERNS.md#scroll-linked-motion).
- **Page transition**: An animation that plays when navigating from one page or route to another. Built: [TIMING.md](TIMING.md#duration-by-element), [REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#screen-transitions).
- **View transition**: The browser morphs between two states or pages, connecting shared elements. Built: [NATIVE-CSS.md](NATIVE-CSS.md#view-transitions), [modern-css VIEW-TRANSITIONS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/VIEW-TRANSITIONS.md#same-document-transitions).

## Feedback and interaction

Responding to the user's actions. [Emil Kowalski, animation-vocabulary]

- **Hover effect**: Visual change when the cursor moves over an element. Built: [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback).
- **Press / Tap feedback**: A subtle scale-down when an element is clicked, so it feels physical. Built: [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback) (which also lets professional tools "shift tone" instead of scaling), [REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#press-feedback).
- **Hold to confirm**: A progress effect that fills up while the user holds a button. Built: [REVEALS.md](REVEALS.md#hold-to-confirm).
- **Drag**: Moving an element by grabbing it, often with momentum when released. Built: [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap), [PHYSICS.md](PHYSICS.md#the-hand).
- **Drag to reorder**: Dragging items in a list to rearrange them, while the others shift to make room. Built: board drag and drop in [app-ui DATA-VIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/DATA-VIEWS.md#boards-and-lists-of-the-same-items).
- **Swipe to dismiss**: Dragging an element off-screen to close it, like a drawer or toast. Built: [SHEETS.md](SHEETS.md#a-swipeable-sheet-on-native-scroll), [REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#drag-to-dismiss-sheet).
- **Rubber-banding**: Resistance and snap-back when you drag past a boundary (the iOS overscroll feel). Built: `dragElastic` in [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap), walls in [PHYSICS.md](PHYSICS.md#walls-and-rubber-banding), `rubberband()` in [REACT-NATIVE-RECIPES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION-RECIPES.md#two-worklets-projection-and-rubber-banding).
- **Shake / Wiggle**: A quick side-to-side jitter signaling an error or rejected input. Built: [TIMING.md](TIMING.md#duration-by-element), [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback), [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#shake-glitch-and-motion-blur).
- **Ripple**: A circle expanding from the point of a tap, confirming the press. Built: in part, the `sin` ripples and pulse rings in [MATH.md](MATH.md#waves-sin-and-phase).

## Easing

How speed changes over an animation. [Emil Kowalski, animation-vocabulary]

- **Easing**: The rate at which an animation speeds up or slows down. Built: [TIMING.md](TIMING.md#curves).
- **Ease-out**: Starts fast, ends slow. The default for most UI and anything responding to the user. Built: `out` in [TIMING.md](TIMING.md#curves).
- **Ease-in**: Starts slow, ends fast. Usually avoided; can feel sluggish. Built: `exit` in [TIMING.md](TIMING.md#curves). **Both ways:** TIMING.md eases exits in on purpose (`exit | 0.55, 0.055, 0.675, 0.19 | leaving: accelerates away`) and records kciter and Argyle easing entrances in; the glossary, like [REACT-NATIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION.md#spring-or-timing) ("Never `ease-in` on UI"), mostly avoids it. Neither wins.
- **Ease-in-out**: Slow, fast, slow. Good for elements already on screen moving from A to B. Built: `standard` and `inOut` in [TIMING.md](TIMING.md#curves).
- **Linear**: Constant speed. Avoid for UI; reserve for spinners or marquees. Built: [TIMING.md](TIMING.md#curves).
- **Cubic-bezier**: A custom easing curve you define for precise control. Built: [TIMING.md](TIMING.md#curves), [MATH.md](MATH.md#start-from-the-graph).
- **Asymmetric easing**: A curve that accelerates and decelerates at different rates. Feels more alive than a symmetric one. Built: every token in [TIMING.md](TIMING.md#curves) but `inOut` is asymmetric; no line there says why.

## Spring animations

Physics-based motion as an alternative to fixed-duration easing. [Emil Kowalski, animation-vocabulary]

- **Spring**: Motion driven by physics (tension, mass, damping) rather than a set duration. Built: [TIMING.md](TIMING.md#springs), [MATH.md](MATH.md#a-spring-by-hand), [PHYSICS.md](PHYSICS.md#the-model).
- **Stiffness / Tension**: How strongly the spring pulls toward its target. Higher feels snappier. Built: [TIMING.md](TIMING.md#springs), [PHYSICS.md](PHYSICS.md#modal-and-physical-numbers).
- **Damping**: How quickly a spring settles. Lower damping means more bounce and oscillation. Built: [TIMING.md](TIMING.md#springs), [PHYSICS.md](PHYSICS.md#modal-and-physical-numbers).
- **Mass**: How heavy the animated element feels. More mass makes it slower and more sluggish. Built: [PHYSICS.md](PHYSICS.md#the-model), which adds that at fixed frequency and damping ratio mass shows only when something else pushes: a finger, a magnet, a wall.
- **Bounce**: A spring that overshoots and settles, adding playfulness. Built: [TIMING.md](TIMING.md#springs).
- **Perceptual duration**: How long a spring feels finished, even though it keeps micro-settling underneath. Built: Motion's `visualDuration` in [TIMING.md](TIMING.md#springs), Reanimated's spring `duration` in [REACT-NATIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION.md#spring-or-timing).
- **Momentum**: Motion that carries velocity, especially after a drag or interruption. Built: [PATTERNS.md](PATTERNS.md#gestures-drag-throw-snap), [PHYSICS.md](PHYSICS.md#projection-decide-on-release).
- **Velocity**: How fast and in which direction an element is moving. A spring carries it into the next animation when interrupted, so a flicked element keeps its speed. Built: [TIMING.md](TIMING.md#springs).
- **Interruptible animation**: An animation that can be smoothly redirected mid-flight instead of finishing first. Built: rule 5 in [SKILL.md](SKILL.md).

## Looping and ambient motion

Animations that run on their own. [Emil Kowalski, animation-vocabulary]

- **Marquee**: Text or content that scrolls continuously in a loop. Built: not in these skills; `anti-slop-ui` forbids it on report pages ("Never add auto-scrolling marquees").
- **Loop**: An animation that repeats, a set number of times or infinitely. Built: [MATH.md](MATH.md#sawtooth-one-way-then-reset), and the pause control in [PERFORMANCE.md](PERFORMANCE.md#reduced-motion).
- **Alternate (yoyo)**: A loop that plays forward then reverses each iteration, instead of jumping back to the start. Built: only as `infinite alternate` in code in [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#animated-gradient-text).
- **Orbit**: An element circling around another in a continuous path. Built: not in these skills.
- **Pulse**: A gentle repeating scale or opacity change to draw attention. Built: [MATH.md](MATH.md#sawtooth-one-way-then-reset), [PERFORMANCE.md](PERFORMANCE.md#reduced-motion).
- **Float**: A gentle, continuous up-and-down drift that makes a static element feel alive and weightless. Built: [MATH.md](MATH.md#waves-sin-and-phase); rule 1 in [SKILL.md](SKILL.md) cuts it or keeps it subliminal.
- **Idle animation**: Subtle motion that plays while an element is just sitting there, waiting to be interacted with. Built: rule 1 in [SKILL.md](SKILL.md) calls "idle bouncing" decoration.

## Polish and effects

The small touches that separate good from great. [Emil Kowalski, animation-vocabulary]

- **Blur**: A blur filter used to soften an element or mask tiny imperfections. Built: [REVEALS.md](REVEALS.md#blur-bridges-a-crossfade); motion blur is in [modern-css GRADIENTS-AND-EFFECTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/GRADIENTS-AND-EFFECTS.md#shake-glitch-and-motion-blur).
- **Clip-path**: Clipping an element to a shape, used for reveals, masks, and before/after sliders. Built: [svg CLIP-AND-MASK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md#css-clip-path-and-mask-on-html), [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).
- **Mask**: Hiding or revealing parts of an element using a shape or gradient - like clip-path, but with soft, fadeable edges. Built: [svg CLIP-AND-MASK.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CLIP-AND-MASK.md#clip-or-mask), the text shimmer in [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#pending).
- **Before / after slider**: A draggable divider that wipes between two overlaid images to compare them. Built: [REVEALS.md](REVEALS.md#a-before-and-after-slider).
- **Line drawing**: An SVG path that draws itself in, like an invisible pen tracing it. Built: [svg CSS-ANIMATION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/svg/CSS-ANIMATION.md#line-drawing-with-stroke-dasharray-and-stroke-dashoffset).
- **Text morph**: Text that animates character by character when it changes, drawing attention to the new value. Built: [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#text-that-changes), and the "Continue" to "Confirm" label in [PATTERNS.md](PATTERNS.md#numbers).
- **Skeleton / Shimmer**: A placeholder with a moving sheen shown while content loads. Built: [TIMING.md](TIMING.md#duration-by-element), [app-ui STATES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/STATES.md#pending).
- **Number ticker**: Digits rolling or counting up to a value. Built: [PATTERNS.md](PATTERNS.md#numbers).
- **Tabular numbers**: Fixed-width digits so numbers don't shift around as they change. Essential for tickers, timers, and counters. Built: [PATTERNS.md](PATTERNS.md#numbers).
- **Typewriter**: Text appearing one character at a time, as if being typed. Built: not as an effect; streamed text is paced in [agent-chat-ui STREAMING.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/STREAMING.md#pace-the-text), and `anti-slop-ui` forbids "simulated typing cursors" on report pages.

## Performance

What keeps motion smooth instead of stuttering. [Emil Kowalski, animation-vocabulary]

- **Frame rate (FPS)**: Frames drawn per second. 60fps is the baseline for smooth motion; 120fps on newer displays. Built: [PERFORMANCE.md](PERFORMANCE.md#performance-smooth-on-a-slow-phone).
- **Jank**: Visible stutter when the browser drops frames because it can't keep up with the animation. **Dropped frame**: A frame the browser missed its deadline to draw, causing a tiny hitch in motion. Built: [PERFORMANCE.md](PERFORMANCE.md#measuring).
- **Compositing**: Letting the GPU move or fade an element on its own layer without redoing layout or paint. Built: [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).
- **will-change** (corrected): a CSS hint for an element that is about to change, which MDN says to "Use … as a last resort to try to deal with existing performance problems. Don't use it to anticipate performance problems", and "Don't apply `will-change` to too many elements" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)). The glossary said "A CSS hint that an element is about to animate, so the browser can promote it to its own layer ahead of time." Built: [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move) ("only for a measured problem").
- **Layout thrashing** (corrected): forcing synchronous layouts, "lots of them in quick succession", by interleaving style reads and writes in a "read-write-read-write cycle" ([web.dev](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)). The glossary said "Animating properties like width, height, top, or left that force the browser to recalculate layout every frame, causing jank"; that is a different cost, one layout per frame. Built: thrashing in [PERFORMANCE.md](PERFORMANCE.md#react-animate-without-re-rendering), animating layout properties in [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).

## Principles to know

Concepts that guide when and how to animate. [Emil Kowalski, animation-vocabulary]

- **Purposeful animation**: Motion should serve a function - orient, give feedback, show relationships - not just decorate. Built: rule 1 in [SKILL.md](SKILL.md).
- **Anticipation**: A small wind-up in the opposite direction before a move, hinting at what's about to happen. Built: not in these skills.
- **Follow-through**: Parts of an element keep moving and settle slightly after the main motion stops, adding weight. Built: not by that name; overlapping follow-up moves are in [TIMING.md](TIMING.md#staggers-and-sequencing).
- **Squash & stretch**: Deforming an element as it moves to convey weight, speed, and flexibility. Built: the held switch in [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback), stretch from speed in [PHYSICS.md](PHYSICS.md#four-worked-components), the segmented pill in [app-ui CONTROLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/CONTROLS.md#segmented-tabs).
- **Perceived performance**: The right animation makes an interface feel faster, even when it isn't. Built: rule 2 in [SKILL.md](SKILL.md), [PATTERNS.md](PATTERNS.md#buttons-presses-and-feedback) ("Feedback is instant, results can follow").
- **Frequency of use**: The more often a user sees an animation, the shorter and subtler it should be. Built: rule 2 in [SKILL.md](SKILL.md), the frequency gate in [REACT-NATIVE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-NATIVE-MOTION.md#should-it-animate).
- **Spatial consistency**: Animating so an element keeps its identity and position across states, so users never lose track of where things went. Built: "What persists, travels" in [PATTERNS.md](PATTERNS.md#shared-elements-a-thumbnail-becomes-the-detail).
- **Hardware acceleration**: Animating transform and opacity lets the GPU keep motion smooth. Built: rule 7 in [SKILL.md](SKILL.md), [PERFORMANCE.md](PERFORMANCE.md#move-only-what-the-compositor-can-move).
- **Reduced motion**: Respecting the user's prefers-reduced-motion setting by toning down or removing motion. Built: [PERFORMANCE.md](PERFORMANCE.md#reduced-motion). **Both ways:** rule 8 in [SKILL.md](SKILL.md) says "Reduce, don't remove", movement becomes short fades; the glossary allows removal, as Argyle's opt-in view in PERFORMANCE.md does. Neither wins.

## Prove it

- When two terms could fit, the answer names the best match and the close alternates with how each differs ([Close terms told apart](#close-terms-told-apart)).
- Before naming an effect not listed here, say it's an approximation or compose listed terms, as the method says.
- Every **Built:** link opens a section that builds or rules on that effect; a term marked "not in these skills" has no build instructions, because the glossary gives none.
