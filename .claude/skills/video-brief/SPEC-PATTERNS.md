# Spec patterns

The prompt structures behind the films people copied. Each is a skeleton: fill the brackets from `brief.md`, keep the sections. All of them share one shape, and it is the useful part:

```
<inputs> what to ask the user for, with defaults if they skip
<direction> the look in concrete terms, plus a Banned line
<structure> the beat map: tempo, bars, what happens on which beat
<build> the render contract, numbered
<gotchas> the failures this kind of film always hits
<start> ask for inputs, then show the plan (beat map, stills) before code
```

## 1. One shape, never cut (UI morph loop)

The most-copied spec. A single element morphs through the product's states; a cursor drives every change; the last frame equals the first.

```
<inputs>
Ask me for: my product + URL, 8 to 12 UI states that tell its story (button, loader, player, slider,
toggle, tabs, chart, command palette, toast...), the real data shown in each state, brand colours +
fonts + one accent, a royalty-free track near 120 BPM (Mixkit, free for commercial use), formats.
</inputs>

<direction>
One shape, never cut: every state is the same element changing size, radius and fill while its content
swaps behind a short blur. A cursor drives every change with real clicks, typing and one drag. Light
warm-grey canvas, black and white components, one clean UI font, one accent. Springs everywhere, a tiny
overshoot at most. The camera zooms so each state fills the frame. The last frame is the first frame.
Never fade black into the accent: flood the new colour from the cursor instead.
Banned: bouncy easing, particle bursts, glows, gradients on UI chrome, mismatched icon strokes, dead
time, anything that looks like a template.
</direction>

<structure>
120 BPM, 8 bars, something happens on every beat.
[logo → button → field (typed) → loader → check → card → chart draws itself → tooltip on hover →
⌘K palette → type to filter → toast → logo]
</structure>

<build>
1. One HTML file. Every style is computed from time inside seek(t): no CSS transitions, no timers,
 no state carried between frames.
2. Closed-form springs. A value that changes target many times is the sum of one spring per change.
3. Content enters after its container starts morphing and leaves before the next morph.
4. Tab indicators and toggle knobs: the leading and trailing edges ride different springs, so they stretch.
5. Drags are direct manipulation: while held, the value follows the cursor; on release it springs back.
6. Measure the song's beat grid and start on a downbeat. Place every UI sound by its measured peak.
7. Render one frame per beat as a contact sheet first; fix anything off-grid, cramped or hard to read.
8. Render at 60 fps with 4 sub-frames per frame blended for motion blur (8 for fast moves).
</build>

<gotchas>
Never put will-change on anything the camera scales, or text renders blurry. Text that swaps inside a
morphing container needs its own enter and exit timing or it overlaps. The last frame must equal the
first, cursor position and velocity included, or the loop stutters.
</gotchas>

<start>Ask me for the inputs, then show me the state list on the beat grid before you write code.</start>
```

## 2. Product launch film

```
<inputs>
Ask me for: the product, its URL, the exact thing a user does in it, real screenshots or let me
capture them, the one number that proves it works, a track or "synthesize", the end-card line.
</inputs>

<direction>
A [15-30] s launch film, [1920x1080 / 1080x1920] at 60 fps, one continuous take where possible: each
scene grows out of the last (text rises from a mask line, a button expands into the page, colour floods
from one object and shrinks into another). One eased camera move per scene; never zoom in and out back
to back. Real product UI only: crop and animate the real thing, never redraw it from imagination.
Look: [palette tokens], [UI font] for UI, [display font] for the product name.
Banned: crossfades, blur-ins, holds longer than 1 s, camera moves that reverse direction, templates.
</direction>

<structure>
[BPM], [N] beats. Hook in the first 2 s: the problem in five words of huge type, or the product mid-action.
Then: the product appears through a real interaction → two or three capabilities, each a UI moment with
a cursor doing a real action → the one number → logo lockup and one line. Name what happens on each beat.
</structure>

<build>
1-3 as in pattern 1, plus: one camera transform on a container, keyed [time, zoom, x, y], zoom
interpolated in log space. Every handoff is a shared element (the flood carries the words; the button
carries its label into the page). Render 9:16 and 1:1 from the same timeline with their own layout.
</build>

<gotchas>
Four sub-frames leave ghost copies on fast moves: render 8 and slow the move. A colour flood must reach
the farthest corner and take about 0.35 s, or it reads as a flash. Set z-index on every layer. Keep
typed text on fixed lines so the camera never chases a wrapping cursor. Declare every variable before
the first seek() call.
</gotchas>

<start>Ask for the inputs, then show me the beat map and 4 stills before writing the full film.</start>
```

## 3. Motion brief with numbers (UI and web motion)

For motion that ships in a product, or any piece where the feel must be exact. Adjectives get the
default (300 ms, ease-in-out, a 20 px slide, a bounce on everything); numbers get exactly the numbers.

```
MOTION BRIEF
target [seek-engine HTML | GSAP 3 | Remotion]
canvas [1440 × 900, 60 fps]
beats 0.00 card group enters from +24px
 0.28 cards settled, title begins
 0.46 title settled, meta fades in
 0.60 rest state
duration cards 280ms · title 220ms · meta 160ms
easing cards cubic-bezier(0.05, 0.7, 0.1, 1) · title (0.2, 0, 0, 1) · meta (0, 0, 0, 1)
overshoot 0% (these carry information)
stagger 60ms between cards, total under 400ms
properties transform and opacity only
reduced cross-fade 120ms, no translation
```

Beats are a timeline, not a list: sequence relative to labels (`"<0.28"`), never as recomputed absolute
delays. Take every value from the seek-engine number sheet (call the Skill tool with "seek-engine").
Before the code, list each beat with start, duration, curve and overshoot in a table; the review checks
the render against that table.

## 4. Director's brief for a long autonomous run

What the overnight music video and the twelve-hour films used: they don't describe a video, they hire
a crew. Use it when the user wants to hand off a big piece and walk away.

```
You are the director, animator, sound designer and render engineer for a [DURATION] film made in code.
Treat this as a multi-session production. Don't rush to a final render.

## The film in one line
[LOGLINE. What the viewer should feel at the end.]

## References and inputs
- assets/refs/: [video / frames / image library]. Take the grammar, never the content.
- audio/track.wav: use it unchanged. Measure beats first.
- APIs in.env: [ELEVENLABS_API_KEY, FAL_KEY]. Budget: [$X]. Be economical.

## Look
[3-5 lines: palette, type, texture, camera language. Banned looks.]

## Character bible (if any)
[proportions, palette sampled from a sheet, expressions, an identity lock that survives every style change]

## Beat sheet
0:00-0:02 hook: [the single most striking image]
0:02-0:10 [act 1]
... a new visual payoff every 3-5 seconds
[END] the last frame sets up the first

## Text on screen
[where captions or lyrics go huge and where they sit like subtitles; composition leaves room for them]

## Workflow, with gates
1. style-guide.md and shotlist.md (every shot: frames, camera, text, sound). Show me the shot list;
 continue without waiting if I don't answer in 10 minutes.
2. A still for every shot. Contact sheet. Critique.
3. Animatic at 960x540. Fix pacing before polish.
4. Full animation, polish pass, sound pass, final render.
5. Splitting work across subagents per chapter: write ANIMATION_GUIDE.md first so every subagent
 codes in the same style, and STORYBOARD.md as the shared map.

## Critique loop (every shot, at least 3 rounds)
Score hook, readability at 360 px wide, motion, composition, depth, sound sync, polish, 1-10. Log the
scores and the 3 biggest problems in review-log.md. Fix. Repeat until all are 8+.

## Deliverables
out/final.mp4 · loop check · poster.png · contact.png · README.md
```

**Generate, then trace.** When the film needs characters, physics or organic motion that code draws
badly, generate base shots with a video model (character sheets and sets first, then shots), then
redraw the whole film in code on top of them, so the viewer only sees the code-drawn layer. The video
model supplies motion; the code supplies a consistent, ownable look. Build a verification loop for any
generated asset that must sync to audio (lip-sync, lyric timing) before spending budget on the rest.

**A song turned into a music video**:
- Give every lyric line one gag that reads instantly in a 1.4-4 s shot with one focal action, told with pictures and acting, not text: the lyric is already on screen, so no labels or signs repeat it, and a handful of big sound words (one per big hit) is the whole text budget.
- Build the arc into the world: chapters each have one set the camera moves through; every chorus returns to the same stage and escalates it (a party, then pyro, then a flood, then an alarm); one prop on that stage measures the song's argument and climbs each chorus, a thing the characters act on rather than an overlay; the hero grows across the film (a doodle on a screen, then person-sized, building-sized, planet-sized) and shrinks back at the reveal; the palette moves chapter by chapter; the last scene answers the first (the same curtain).
- Inside a chapter the action carries the cut (a mouth closing on the lens to black, a fall, a push through an eye, a bubble popping); a wipe only at chapter breaks.
- Lyrics in a karaoke bar along the bottom with the sung part filling word by word; keep faces and the action above that band.
- Splitting chapters across subagents: each chapter is one file with private helpers that registers its shots as `shot(t, localT, dur)` functions painting the whole frame, pure functions of `t` (frames render out of order); a subagent edits only its own file and reports a bug in a shared file instead of fixing it; the guide names a per-frame render budget (for example 2.5 s) and the check every subagent runs (a sheet of the first, middle and last frame of each shot, frames every 0.1 s around each hit, the transitions in and out).

**"Show the edit" hook**: when the story is "we removed something", make the removal visible. Each spoken word pops in on its timestamp with bars under it drawn from the real audio envelope; a filler grows letter by letter while it is spoken, turns to the accent and is cut out on screen on the same frame the audio cuts, and the next line lands at once. It works because the picture is driven by the same word and envelope data as the sound, so nothing can drift.

**A changelog or release-notes film**. Visualize, don't list: route every item before writing the script, strongest first: recreate the real surface that changed and let a mock act out the change; else an honest analog whose behaviour *is* the change; else type the command and show its result; a checklist only for genuinely non-visual items (fixes, dependency bumps), at most six rows with a tick landing on each item's spoken word. An analog shows a behaviour, never a screen that doesn't exist: faster is a counter and bar running slow then fast; caching is two identical request rows where the second short-circuits to done; batching is ticks drawing into brackets; dedupe is parallel rows collapsing onto one lane and a count dropping; a concurrency cap is a queue of chips at a gate where the first few pass; an error is the surface failing quietly and a toast sliding in with the reason. The edit is the job: 45-60 s, each theme one hero visual and at most three spoken items (a 30-item changelog still yields about 14 spoken beats), themes ordered marquee feature, product surface, performance, reliability, and everything else lives behind the outro's link to the full notes. Record each new surface you mock (its anatomy and the choreography that worked) so next week's film reuses it.

## 5. The showreel one-liner

```
make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are,
like it's your showreel for a résumé. go all out.
```

It works because "showreel for a résumé" is a genre with known rules (fast cuts, a new technique every
shot, best work first), the model is the subject (nothing to get wrong), and 15 s fits one pass. It
tests the setup; it never tests an idea, because it contains none. Hundreds of identical prompts produced
reels that rhyme with each other. Variants that shipped:

- longer, with a sound bar: "16:9, 60 s, S-tier sound design, no generic synth pads, compose an original
 score and sync every cut to it"
- anti-slop: "avoid frames and text in the corners, the usual giveaways of AI-made video"
- a story instead of techniques: "the history of [TOPIC] from [START] to today, surprise me with the
 storyboard, 45 s, 9:16"
- a persona: "a 30 s showreel as a niche branding studio for [audience]; every graphic from scratch; one
 accent colour; every shot a different technique"
- pointed at a product: add the URL, "use the actual product screenshots, logo and assets", and "must have music"

## 6. Voiceover-led launch film

The voice is the clock; captions type word by word on the exact time they are spoken.

```
<inputs>
Ask me for: product name, one-line pitch, logo, 3-6 screenshots, 40+ images of what it makes, brand colours and
font, an ElevenLabs key and voice ID, and a licensed track with a clear drop (file + drop timestamp).
</inputs>

<script>
A short voiceover adapted to the product, e.g. "This is [name]. A [category]... built for [value]. [Verb] in ANY
style. Give it a [input] - and it just... understands. [...] [Name]. Out now." Emotion tags sparingly.
</script>

<voice>
4 full takes to choose from; a line that sounds wrong gets 4 new tries and the best is spliced in. Long pauses
shortened; each phrase levelled toward the median. Word timings from the TTS timestamps.
</voice>

<direction>
[square / 16:9], one typeface, real images, captions typed at the spoken time. The camera keeps drifting
(1.0 → 1.04 per scene) and never resets at a handoff. Nothing appears instantly: fades of at least 0.3 s.
Images change on 16th notes with a click each. Scene changes on phrase starts; the drop on the [Verb] line.
No full stops on screen. Banned: selection-box highlights, white flashes, beat-snapped slams, templates.
</direction>

<sound>
The drop lands on the [Verb] line. Music ducked under the voice in the speech band until the voice sits ~9 dB
above it there. One SFX per event, placed by measured peak. Music fades on a dB curve under the end card. -14 LUFS.
</sound>

<build>
seek(t) driven by the word table; 8 sub-frames for motion blur; before showing anything: a contact sheet, a
scan for single-frame pops, and the voice-to-music ratio for every phrase.
</build>

<start>Ask for the inputs, write the script, send 4 takes, then show 8 stills before the full render.</start>
```

## 7. Promo built only from a real site

```
<direction>
A [N]-second promo built only from the site itself: its real header, real grid, real entry page, real copy quoted
verbatim (taglines, handles, numbers). The site's own skin: its fonts, its colours, one accent used only for
[highlighter / cursor halo]. One continuous camera over a single world layer; never two camera moves at once.
Banned: any feature the site doesn't have, invented numbers, paraphrased taglines, fades on everything.
</direction>

<build>
1. Scrape first: copy, handles, avatars, preview media, one full entry. Quote all of it verbatim.
2. Lay the site out once in world coordinates; drive the camera as (x, y, log-scale) tracks. A tile's corner
 radius goes to 0 as it reaches full-bleed, so pull-backs, whip-ins and match cuts are exact.
3. Real clips: detect their internal cuts, loop only cut-free windows with a 12-frame dissolve, stagger phases.
4. One cursor that homes on the live button position, because the camera keeps creeping during holds.
5. Stills at every cut before the full render; then a fresh critic who didn't build it reviews the render.
</build>

<gotchas>
Real clips carry their own HUDs and cursors: keep overlays clear of them. A tile the page's colour disappears:
give it a 1 px hairline. On a push, check the last frame: headers drift into the edge bands.
</gotchas>
```

## 8. Frame-exact sting

For a short film (8-15 s) where every frame is designed: write the shots as frame ranges with exact keyframe
values, and keep the cut frames exact even where they don't sit on a beat.

```
Frame numbers at [fps] (f0-f[N]); master rendered at 2x that rate.
S1 f0-71, [what]: [element] rises y932 (f0) -> 776 (f2) -> 683 (f5) -> 608 (f10) -> 546 (f24), drifting 1 px/frame
after. Name appears f2 blurred; pill f4-5 heavily blurred, sliding 15 px left as it sharpens. Camera 1.0 f46 ->
1.2 f60 ease-in-out... (one line per shot, every value with its frame)
Rules: every value continuous in the frame number (keyframe tables, no Math.floor on motion); every shot enters
already moving and leaves accelerating or on a blur ramp; blur follows speed and direction; nothing freezes
except one named hold. Then 4 stills at named frames before the full render.
```

## 9. Product film from the product's own repo

For a team with a codebase and a design system. The brief points at the source of truth instead of describing it.

```
REPO / SOURCE OF TRUTH: [main app path], tokens [path], wordmark [path], icons [path], newest screenshots [path].
Existing motion project: [path]. Do not replace or regress it; add a new composition beside it, reusing its
infrastructure. Inspect the real UI before designing; do not invent functionality.

VISUAL LANGUAGE: the real tokens (background, surfaces, brand accent and what it means, text, positive/negative only
where semantic), the real fonts, the real logo (never redrawn).

CORE RULES: one shot = one idea; room to breathe; the product UI is the hero; very little copy (3-4 words a line);
object-driven transitions; overlapping motion; restraint over effects.

STORY: one continuous thought ([chaos] -> [control] -> [clarity] -> [brand]), about four visual ideas in 15 s,
the first meaningful product moment by ~2 s, one calmer beat before the payoff, a still final frame.

REAL PRODUCT ONLY: demo-safe synthetic values; no personal, test-user or production data. A screen that must move
in parts is rebuilt from the design system, not scaled up from a screenshot.

DO NOT STOP AFTER FIRST IMPLEMENTATION: render frames at ~10 timestamps, inspect them, fix, render the full film,
inspect decoded frames from the final MP4, iterate. Reject it if it feels like a template, a slide deck, a screen
recording or a crypto ad.

DELIVERABLES: storyboard, source, master, poster, contact sheet, exact runtime, assets used, a note on the motion
language, remaining compromises, commands to reproduce. Don't deploy, merge or touch production data.
```

## 10. Speech typography

A spoken-word film staged entirely in type: words get structural roles and the layout itself carries the emotion.

```
EXACT WORDS, EXACT ORDER: "[line 1]" "[line 2]"... (understandable without audio)
CENTRAL RULE: words have roles ([WORD] is a lintel, [WORD] a support, [WORD] a platform), built from the actual
glyph paths, never from illustrations behind the text.
STORYBOARD: one row per line with its time range and what it does to the architecture of the frame.
CHOREOGRAPHY: cue sheet from phrases, pauses and emphasis, not a dance beat; reveals follow reading order; at least
one 400 ms moment of absolute stillness; critically damped settling; transitions between unrelated words by
occlusion or matched edges, never arbitrary path interpolation; render(0) = render(end) when it loops.
QUALITY GATE: 8 representative frames; the speech reads in order; no line is destroyed before it can be read.
```

## 11. One carrier dot

```
The [accent] dot connects every scene: it starts in the UI, becomes the dot over a letter, traces a spring graph,
grows into a shape that fills the frame and returns on the end card. A cursor makes the opening click real.
Build: the graph and the dot follow the same spring function; the circle, square and pill are states of one shape;
a shape that fills the screen scales past all four corners; first and last frames match for the loop.
Banned: motion that isn't connected to an element already on screen.
```

## 12. Real footage

```
High-end minimal, one idea per shot, one accent, one sans with tight tracking, real footage only (never placeholder
cards), no full stops on screen. 10 bars at 120 BPM: the hook word by word on the beats; a hook word morphs into
the UI; the drop opens a circle out of the button; then one move per bar.
Build: clips extracted to image sequences (or all-intra video) and swapped per frame, seek awaits the decodes;
calibrate the beat grid to the real kick hits; every cut on a downbeat; probe 20+ frames before the full render.
Gotcha: never set opacity or filter on a preserve-3d element; fade its wrapper.
```

## 13. Narrated explainer (education, a paper, a concept)

The biggest single kind of film people make this way: history recaps, science and maths concepts, paper explainers. What separates the good ones is the order of ideas and the checking, not the effects.

```
Explain [concept] to [audience: a high-school student / a beginner who has never coded] in [60-180] s.
Research it first and list the sources; every claim on screen traces to one. Before the script, list the factual claims, their sources and anything
disputed or needing my confirmation. Anything not checked is labelled an illustration, not a validated explanation.
Order: the everyday intuition first, then the mechanism, then (only if the audience can take it) one piece of the
maths, each step built on the last picture rather than a new one.
Look: [line art on paper / whiteboard strokes drawn on / paper cut-out], one accent, friendly and light.
Narration is the clock: write the script, voice it (word timings), then cut the picture to the words.
Captions burned in: [language], or two languages stacked (the primary larger), never covering the action.
One concept on screen at a time; a concept is drawn the moment the voice names it.
Show a preview to someone in the audience before polish, and check terms, formulas and dates.
You cannot hear the narration: say so, and have a person listen to the whole track (names, terms, numbers) before it ships.
```

Shaping an explainer. Pick one structure, never a splice: a concept explainer (name the idea, reveal its mechanism layer by layer, land the implication) for one idea the audience half-knows; a how-to (3-6 ordered steps on one consistent stage, the object being worked on carried from step to step); a listicle (a hook, N co-equal items, rule of three strongest, a wrap); a story explainer (setup, tension, turn, resolution, a lesson that generalises). Open with one hook strategy that opens a gap or names stakes, never a definition: a credible shocking number, a rhetorical question, a counterintuitive claim, validating a confusion the viewer already has, a visceral metaphor, naming the concept as a memorable term, direct address, an "imagine" scenario, or a real cost of getting it wrong. Every beat names the technique that makes it land, not "explain the idea": an analogy, a worked example with real numbers, progressive disclosure, a before and after, common belief against reality, a counterexample, frame-then-fill, a causal chain, a demonstration of the mechanism running, a callback to the hook, a distillation into one line. When the idea is a mechanism (an algorithm, a protocol, a system), the stage can be an invented machine whose moving parts do the idea, never boxes and arrows: a queue as a marble run, an LRU cache as a bookcase that pushes its oldest book off the end, a bloom filter as a fruit machine (seek-engine `ISOMETRIC.md`). The body is 3-6 frames on one stage that keeps growing (the same diagram, the same number line) with one repeated seam between them; an element that transforms from one idea into the next does it inside one shot, not across a cut. Animate what you would explain as "first this, then that" (a sequence, a transformation, an assembly, a comparison of states, change over time) and show static what you would explain by pointing at one picture (a labelled diagram, a dense table). Build a hard equation by showing it whole and dimmed to ~20% so the viewer sees where it is going, then lighting each term as it is explained. Teaching needs more time than promos: a new equation about 2 s to appear and 2 s held, a new label 1 s and 1 s, the key insight 2.5 s and 3 s, with a deliberate pause before it. Teaching follows Mayer's multimedia-learning principles: one new concept every 30-45 s at most (a 3-minute film carries 4-6); a spoken signpost about as often; picture and narration at the same moment, never seconds apart; cut the interesting but irrelevant detail, which lowers what is learned; narration with pictures beats written text with pictures, so don't print what the voice is saying. Link sections with "but" and "therefore", never "and then"; give working memory a short breather (a pause, a visual joke) every 45-60 s; hold 1-3 s of quiet after the key insight. A 3-minute shape: hook to 0:08, the gap or misconception to 0:30, the foundation, the complication, a breather, the key insight (the most polished shot), a proof in one concrete case, the implications, a close that calls back to the hook; for 1 minute keep 1-2 concepts and a 5 s hook.

Variants that shipped:
- **Talking head into explainer:** keep the speaker's audio, captions and duration untouched; shrink the speaker into a round picture-in-picture in a lower corner (clear of the captions) and draw each concept in the main frame as it is spoken.
- **Talking head with designed cards**: the clip plays untouched and timed cards (a title, a lower third, a data callout, a quote, a side panel) arrive when the transcript reaches them. Four ways the speaker and a card share the frame, chosen per moment: side by side (equal weight, speaker and data), stacked (the speaker on top, a summary card below), the card full frame with the speaker in a corner (a content-heavy moment), or the speaker full frame with a card floating over the bottom (a dramatic moment). Move between them by tweening the video's own box, and pick the card style by the talk's tone, not its topic.
- **Split-screen lesson:** the lesson on one half, a calm looping gameplay-style motion on the other, for vertical feeds; the lesson half still obeys every reading rule.
- **Maths and physics:** Manim instead of the seek engine, voiced by the voiceover skill.
- **A "why" film, briefed in one line:** the question people half understand, then the visual turn nobody expects, then the metaphor that carries the idea ("Why do we dream? Then someone wakes up, zooms out of the eye and into outer space; neural networks of interconnection stand for the brain."). The opening line has to promise what's coming: say the question big, show the first surprise inside 5 s.
- **Documentary shot types**, one per line of script: a kinetic statement (three short lines of bold condensed type on a torn paper strip); paper cards dropping in for several things at once; a before and after (same card, the date chip flips); a label call-out (a marker circle draws itself, then the label); a counter; a grid of identical tiles where one breaks the pattern. Cards and objects that move in depth, never a lone bar or line crossing an empty frame. Say "looks like" when the research shows only a similarity, and "one reason", never "the reason".
- **History recap:** a timeline device (a line that draws on, years as big numerals) carries every era; one image per era, never a slideshow of facts.
- **The hidden-in-plain-sight collage**. The film makes the viewer recognise the thing first, then pays it off with a causal history. Pick topics with four tests, used to choose, never to refuse one the user names: the viewer meets it daily and has never looked at it (or everyone dates it wrong); the story lands on a person and a date within one beat; one beat lets the eye verify the claim unaided; the receipts exist as free archival material. Spine for 60 s: the familiar thing and more instances of it 15%, the dig ("and it comes back to [person], [year]") 5%, the story with its why 15%, the one physical artifact held on screen 10%, the mechanism the viewer verifies 20%, a later technology removing a constraint 15%, the thesis in two plain sentences 10%, a close that mirrors the open with a fact the viewer doesn't have 10%. About 150 words a minute; ~225 words is the ceiling for 90 s, and a beat that can't be filled honestly is cut, never faked.
 - **From a supplied document** (a memo, report, paper or link), the source is ore, not an outline: never film it section by section. Pull out the recognition its intended audience already has, the claim that contradicts what they assume, the turn the story pivots on, the one claim the viewer can verify on screen (build the demonstration if the source only asserts it) and the receipts. One storyline per film; everything else becomes a receipt. The narration never mentions the source ("the memo says", "according to the doc"): if a line only parses for someone who read the original, cut it.
 - **The look is a collage of printed objects on a pale ground:** photos as cards, history as clippings, data as specimens, one recurring shape as the carrier. Every beat names its layout and its motion before the build, so the film can't drift into a slideshow: at least one push into a photograph that isolates its subject, at least one pull-back arrival on a payoff, a subject lifted off its photo doing what a flat card can't, static cards or side-by-sides in at most a third of the beats, and no two beats in a row with the same layout or the same move. Elements move on 12 fps steps over a smooth camera.
 - **Words on screen have one of three jobs or are cut:** a ≤3-word anchor with a drawn arrow whose tip touches the subject; one promoted sentence per act, staircased over 2-3 lines; or a name (a credit, a label) in the same slot every time. Every highlight, underline or circled word animates on (a bar sweeping left to right behind the words in ~0.4 s, a circle drawing itself); a highlight that simply appears reads as pre-printed. The caption rail stays clear of every other element.
 - **Frame rules for the contact sheet:** no lone element drifting on empty ground (every element relates to the grid or to another element); labels sit within one gap of what they name; a grid has no empty cell; a circle or arrow drawn on a photo is checked against the feature's actual pixels; text in a shape sits optically centred within ~70% of it; nothing spills out of its container. Real photographs are never recreated (a missing photo turns the beat typographic); a recreated document says so on the frame.

**A film built from someone's real words**: ask before reading any history; quote verbatim as a contiguous span of what they wrote (cutting to a shorter span is fine, rewording, merging or fixing spelling is not), and record each line's source (session, timestamp). Pick the typical session or day, not the most dramatic one, in the order it happened, and leave out a kind of moment their history doesn't show. Before any design pass, show the person one table of every line that will appear on screen with its kind and source, ask which name goes on screen, and strip anything naming another person, a client or company, a product under NDA, a file path, a URL, an email, an identifying number or a secret (automated flags miss a lowercase name: read every line). Take their edits, get an explicit yes, and until then stamp every frame DRAFT. The film holds their words: it is theirs to share, never posted or uploaded by you.

## 14. Illustrated short from generated stills

For characters and painterly worlds that code draws badly, generate the stills and do the motion, camera and finish in code:

```
Story as a numbered shot list with exact times (24 fps, 2.39:1 or 9:16), each shot one action and one camera move.
Art: generate the background, each character and each prop as separate stills. Characters on a flat #00FF00 field,
keyed yourself (asking an image model for "transparent background" returns a fake checkerboard). Keep one character's
poses in one session, editing from a base image so the design never drifts; change only the region that moves.
Finish: upscale every still 4x, estimate depth for the backgrounds and parallax them per pixel, then composite in
2.5D: layers at real depths, a pinhole camera with a real focal length, focus pulls, rain or dust in 3D, motion blur,
bloom and grain, a grade. Characters breathe and their hair and cloth move by mesh warps; key poses change on twos.
Sound: real licensed effects per beat of the story, a score written to the story beats, dialogue voiced, distance
per shot; -16 LUFS. Render previews per shot as sheets and fix before the master.
```

## 15. Model showdown (one brief, several AI models)

A fair test people can check: the same brief word for word to each model, the first try only (no re-rolls, no fixes, no "one more go" for the one you hoped would win), each model delivering one self-contained `seek(t)` page that one shared renderer exports at identical settings. A model that fails or returns broken HTML keeps its panel, saying so. Label each panel with the full model name and version on its own dark tile (a logo over footage vanishes on light frames). 16:9 side by side for a newsletter, three 1080×360 panels stacked inside the 9:16 safe band for a feed.

## One-line starters by kind of film

Short prompts that shipped, for when the user wants a fast start. Each still goes through the gates.

| Kind | Starter |
|---|---|
| Product launch | "Make a dynamic 20-second launch video for [product] ([URL]). Use the actual product screenshots, logo and assets; break screenshots into components so they can animate. Must have music, and the motion must match it." |
| From the codebase | "Analyze my frontend project, use the actual components from the product, and make a high-end launch film that sells it." |
| Explainer | "Build a 30-second animated explainer for my business: the customer's problem, what I do, how it works in 3 steps, one proof point, my name at the end. Bold type, smooth transitions, my brand colours." |
| Technical concept | "Explain [a token bucket rate limiter], canvas only, no libraries, every frame a pure function of time." |
| Recipe or process | "Show the full [recipe] from empty glass to finished drink, explainer style, ingredients and measurements as they go in. 30 s." |
| History or timeline | "The history of [topic] from [start] to today; surprise me with the storyboard. 45 s, 9:16." |
| Story or short | "Make a 45-second silent short with no dialogue, where sound tells half the story. Invent the story." |
| Music-driven | "Build a 45-second machine that plays an original piece of music, where every note comes from a visible collision." |
| Lyric video | "A lyrics motion video for the attached track, every line synced to the vocals and the beat." |
| Music visualizer | "A visual for this track: the structure cuts on the bars, the texture breathes with the bass and the hats; one recurring shape that evolves through the song." |
| From project history | "Turn this repo's git history (or this coding session) into a 60-second film: the milestones as chapters, the real commit messages and files as the material." Real words on screen go through a privacy gate first ("A film built from someone's real words", section 13). |
| Logo reveal | "A slow-reveal transition that assembles and finally reveals the [brand] logo." |
| Named style | "Make a motion graphic about my studio in [risograph / oscilloscope / paper cut-out shadow theatre / whiteboard] style." |
| Quality push | "Question your plan before you build; if it doesn't feel like a professional designer made it, start over. Every frame matters." |
