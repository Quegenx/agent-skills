# Design principles

The product-level questions under the visual filter: what a screen owes the person using it, before any color or type is chosen. The sources are two Apple design talks, WWDC17 *Essential Design Principles* ([session 802](https://developer.apple.com/videos/play/wwdc2017/802/)) and WWDC26 *Principles of great design* ([session 250](https://developer.apple.com/videos/play/wwdc2026/250/)), as Emil Kowalski's apple-design skill summarizes them and as their session pages say. Motion (springs, gestures, response) is in the `ui-animation` skill; how a principle turns into a checkable rule for a page is in [SKILL.md](SKILL.md).

## Four human needs

WWDC17: "We have the need for safety and predictability. We have a need for knowledge, for meaning, and understanding. We have a need to accomplish tasks… And we have the need to experience beauty and joy." apple-design shortens these to "safety/predictability, understanding, achievement, and joy" and says "Every rule here serves one of them" [Emil Kowalski, apple-design]. It credits them to WWDC18 *Designing Fluid Interfaces*; they are in the WWDC17 talk.

## Wayfinding

WWDC17: "Wayfinding helps us to feel safe by answering really basic questions like: where am I? Where can I go? What will I find when I get there? What's nearby? And how do I get out?" "Every screen in your app should answer all of these questions, or else people will feel lost." apple-design adds: "Never trap the user" [Emil Kowalski, apple-design].

## Mapping and grouping

WWDC17: "Mapping is about designing controls to resemble the objects that they affect." apple-design: "Proximity implies relationship; place a control near what it affects and arrange controls to mirror what they change. If you need a label to explain a control, the mapping is weak" [Emil Kowalski, apple-design].

## Feedback

apple-design, from the same WWDC17 talk: "Feedback comes in four kinds: status, completion, warning, error. Confirm meaningful actions, expose ongoing status, warn before problems, validate inline (not on submit)" [Emil Kowalski, apple-design]. The words for each are in anti-slop-copy's [anti-slop-copy MICROCOPY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/MICROCOPY.md); the states a screen can reach are in [SKILL.md](SKILL.md#3-absolute-no-purpose-excuses-these).

## Labels

"Direct, specific labels beat safe generic ones. Name nav items for their contents ("Progress", "Library"), not vague umbrellas ("Home"). Specificity creates predictability" [Emil Kowalski, apple-design]. Not verified: the example is not in the WWDC17 talk, and may come from a WWDC26 session on feature names that was not checked.

## Apple's eight principles

WWDC26 names eight chapters: Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft and Delight. apple-design's summaries, which match the session's chapter text where checked (undo and confirmation, privacy as "a human right", the allergy-aware recipe app, the trash metaphor, "Simplicity isn't minimalism", "Delight isn't confetti") [Emil Kowalski, apple-design]:

1. **Purpose.** "Make with intention; decide what *not* to build. Every feature asks for the user's time, attention, and trust: spend that budget only where it pays off."
2. **Agency.** "Keep people in control: offer choices, don't force a single path. Back it with forgiveness: easy undo for slips, a confirmation dialog only for genuinely destructive, irreversible actions (use sparingly; overusing it trains people to click through)." The session: "use interruptions carefully, and only when someone is about to make a big mistake."
3. **Responsibility.** "Act in the user's interest. Privacy: ask at the right moment, only for what's needed, transparently. Safety: anticipate misuse and harm, especially with AI (an allergy-aware recipe app must not suggest a harmful ingredient). Add previews, confirmations, disclaimers; cut a feature whose risk outweighs its value."
4. **Familiarity.** "Build on what people already know. Use metaphors that are neither too literal nor too abstract (a trash can means delete), and honor their physics. Be consistent: things that look the same must behave the same and live in the same place" so people can predict what happens next. "Only break a familiar pattern if you can prove it's better, then test it, don't assume." (apple-design's example, close always at the top left on macOS, was not checked against the session.)
5. **Flexibility.** "Design for different contexts, devices, and the full range of abilities. Adapt to the platform (iPhone = quick touch; desktop = deep workflows with precise pointer control) and to the situation. Design inclusively (age, language, expertise, accessibility). When no single layout fits everyone, let people personalize: rearrange controls, hide what they don't use."
6. **Simplicity, not minimalism.** "Strip the unnecessary so the core purpose shines; burying everything in one place looks minimal but isn't simple. Be concise (plain language, no jargon, fewer steps) and clear (use hierarchy: order, spacing, contrast, so the most important thing is the most obvious). Every element earns its place; sometimes *adding* context simplifies (a video scrubber that shows time remaining). Show the common path first, advanced options one level deeper."
7. **Craft.** "Uncompromising attention to detail builds trust. Beautiful typography, colors that adapt to light/dark, clear iconography, and responsive animations that give immediate, natural feedback. Nothing is random: every spacing, timing, and alignment value is a deliberate choice you can defend. Jittery scroll, misaligned icons, and layouts that break on rotation read as carelessness."
8. **Delight.** "The result of getting the other seven right, not confetti tacked on top. Decide the emotion you want people to feel (calm, confident, excited) and reinforce it in every decision."

Delight here is the outcome of the other seven; this skill's "Where to spend delight" and its contested note on play ([SKILL.md](SKILL.md#5-alive-not-just-clean)) are the other views.

## Process

- **Prototype interactively:** "an interactive demo is worth 'a million static designs.'" "You discover the interface by building and playing with it; a working prototype also sets a concrete bar that prevents a mediocre final implementation" [Emil Kowalski, apple-design, quoting WWDC18 *Designing Fluid Interfaces*, [session 803](https://developer.apple.com/videos/play/wwdc2018/803/)]. Directions to compare go behind a picker ([VARIANTS.md](VARIANTS.md)).
- **Design interaction and visuals together:** "You shouldn't be able to tell where one ends and the other begins." "Motion is not a layer added after the pixels" [Emil Kowalski, apple-design].
- **Motion earns its place:** HIG: "Don't add motion for the sake of adding motion", and "In apps, generally avoid adding motion to UI interactions that occur frequently" ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).

## Prove it

- For each screen, write where it answers the five wayfinding questions; a question with no answer on the screen is a finding.
- Every destructive action has an undo or a confirmation, and confirmations are kept for the irreversible ones.
- Every control sits near what it changes; a control that only a label can explain is listed.
- Each feedback kind the flow can reach (status, completion, warning, error) is on the screen, with errors validated inline.
- Any rule here that the owner's apps decide differently is left to `app-ui`, `landing-page-ui` or `agent-chat-ui`.
