---
name: shotlist
description: "Turns a video's story into a shot list and storyboard on the beat grid. Use after the brief and beat grid exist, or when a film feels rushed or confusing."
---

# Shot list

A list of effects is not a storyboard. "Zoom in, then morph, then add particles" describes activity, not meaning. A shot list says **what the viewer knows at each moment**, and it is a contract: if you can't say why shot four exists, shot four doesn't belong in the render.

Read `brief.md`, `style-guide.md` and `audio/beats.json` (or `audio/vo.json`) first. Every time in the list sits on that grid.

When the brief leaves the idea open, find the concept first with [CONCEPT.md](CONCEPT.md): the inventory, three lenses, the tests that kill weak ideas, the carrier's path, the beats and the end card. For the structure, budgets, transitions by intent and per-aspect layouts of each kind of film (launch, feature, loop, sting, walkthrough, vertical, explainer, trailer and more), read [FORMATS.md](FORMATS.md). A product reveal of a real physical object (tumble in, macro details, one feature, explode and snap back, hero) takes its beats from seek-engine's `REAL-OBJECTS.md`.


## Read by job

[existing shotlist topics; measured corpus, original chapter responsibilities]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Measured beat roles | [MEASURED-BEAT-ROLES.md](MEASURED-BEAT-ROLES.md) |
| Measured composition diagrams | [MEASURED-COMPOSITION-DIAGRAMS.md](MEASURED-COMPOSITION-DIAGRAMS.md) |
| Concept and source inventory | [CONCEPT.md](CONCEPT.md) |
| Film structures and format budgets | [FORMATS.md](FORMATS.md) |
| Measured beat direction and importance budget | [MEASURED-DIRECTION.md](MEASURED-DIRECTION.md) |
| Measured storyboard worksheet | [MEASURED-STORYBOARD.md](MEASURED-STORYBOARD.md) |
| Measured frame composition and layout | [MEASURED-COMPOSITION.md](MEASURED-COMPOSITION.md) |
| Measured endings and CTA source scope | [MEASURED-ENDINGS.md](MEASURED-ENDINGS.md) |
| Measured typography grammar | [MEASURED-TYPOGRAPHY.md](MEASURED-TYPOGRAPHY.md) |
| Measured counters, name morphs and reading observations | [MEASURED-TYPE-DECISIONS.md](MEASURED-TYPE-DECISIONS.md) |
| Measured product-demo grammar | [MEASURED-PRODUCT-DEMO.md](MEASURED-PRODUCT-DEMO.md) |
| Measured frame-timed demo recipes | [MEASURED-DEMO-RECIPES.md](MEASURED-DEMO-RECIPES.md) |
| Measured transition choice | [MEASURED-TRANSITIONS.md](MEASURED-TRANSITIONS.md) |
| Measured transition catalogue | [MEASURED-TRANSITION-CATALOGUE.md](MEASURED-TRANSITION-CATALOGUE.md) |


## States, not effects

Name the states the film moves through before any transition: `SEARCH → RESULT → DETAIL → ACTION → CONFIRMATION`. Then the film is the design of continuity between known states. Give each shot:

- an **entry state** and an **exit state** (what is on screen when it starts and ends)
- a **purpose**: the one thing it adds to the sentence in the brief
- its **reads**: what the viewer must understand, in order, each with a start and end time
- camera, on-screen text (exact words), and the sound that lands on it

## Reads: model the viewer

You know what happens because you wrote the code. The viewer sees it once, at full speed, muted. Timing is where generated films fail most: everything moves at one brisk speed and moments are over before anyone understands them.

- **One read at a time.** When two things happen at once, the viewer sees one of them. Put a cause and its reaction in sequence.
- **Fast actions, slow meanings.** A move can be quick if it is anticipated; what it means needs held time. Spend time on what matters to the story, move fast through what doesn't. That contrast is rhythm.
- **Lead the eye** before an important read: something moves, lights up or is looked at first.
- **Holds:** a readable state holds at least the smoke test's reading time, the [canonical reading floor](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/COPY.md#budget), never under 1 s for a phrase, and 2 s for the final line. Text never moves while it is being read.
- **Let the reads set the length.** A shot with many reads can't be short; a shot whose reads have landed shouldn't be padded.

## Rules for every row

- **The key beat of a shot sits in its middle**, not at the end where the cut eats it.
- **A cut must add information.** If the next shot shows the same thing bigger, move the camera instead.
- **State the camera for every row**, even "locked", and for a locked shot name what must not move.
- For footage or video-model camera directions, use [marketing-video CAMERA-PROMPTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/marketing-video/CAMERA-PROMPTS.md); keep this shotlist's story, technique-selection and approval gates. [n, camera-movments.md; shotlist, existing workflow]
- **Show feeling as behaviour:** "the antenna droops, the body sinks 6 px", not "it is sad".
- **Exposure per action** for drawn films: twos for acting, ones for fast moves and tracked shots, a hold for a read. Decide it here, not in code.
- **Paste the style guide verbatim** at the top of `index.html` as a comment; a paraphrase drifts between sessions.

## Rhythm on the grid

- Something visibly changes on every beat in UI and product films, and every 2 to 4 seconds at the slowest in anything else. A bar where nothing moves reads as slow.
- Section changes land on downbeats; cuts inside a section on beats or eighths.
- The hook owns the first 2 seconds: frame 0 is already composed and moving, because a muted feed decides in one second and frame 0 is the thumbnail.
- Energy builds toward the payoff at roughly 75-90% of the runtime. Schedule a 0.3-0.75 s stillness just before it: the dramatic comma.
- The last frame is strong enough to be the poster. A loop's last frame flows into its first.
- Speech and spoken-word films follow phrases, pauses and emphasis rather than the beat: write the cue sheet from the voice's word times.
- Lyrics and captions vary in weight: some lines go huge as the hook, most sit like subtitles. Leave room in the composition where a line will land big (characters right, text left).

## Precedent per beat

`python3 <this skill>/scripts/precedent.py query --beat proof --content ui --text "selection becomes result" --k 6` returns what professional motion designers did at that kind of beat: 156 measured rules (WHEN, DO, BECAUSE, with frame numbers and the moment ids they come from), the 53 study moments and 507 rules decoded from 39 reference films (`library/moments.json` and its eight ordered JSONL parts; beats hook, turn, proof, cta; content ui, type, logo, number, 3d). Run one query per beat, adopt one rule, and write its id beside the beat (`PR-A01: crop to one object at 3.3x, reveal the product by pulling back`). The rows are model-decoded and unverified: the source-scoped measured chapters in the router outrank them.

## Draw the techniques

[cinetic, assets/library/techniques.json] Evidence counts are source claims; entries with evidence 0 are uncorroborated recipes. Source starter paths and helpers are not bundled here. Current [reading floors](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/COPY.md#budget) govern readable production text, even where a recipe uses a shorter hold.

Left to choose, every agent picks the same fade-up, push-in and end card. Before designing shots, draw the film's techniques at random from the library, weighted to the format and energy:

The [Cinetic catalogue](library/techniques.json) keeps 14 category intros and an ordered list of 21 sibling JSON parts containing the 273 source recipes [cinetic, assets/library/techniques.json]. Copy the complete skill folder when installing it; the script resolves each part relative to the manifest, preserving entry order for seeded draws. Direct JSON consumers must flatten the listed parts in order; the manifest replaces the old top-level `techniques` array.

```bash
python3 <this skill>/scripts/draw_techniques.py --format launch --energy high --seconds 30     # a whole-film plan, seed printed
python3 <this skill>/scripts/draw_techniques.py --category transition --n 3 --format launch     # three seams
python3 <this skill>/scripts/draw_techniques.py --category camera --exclude cam-living-hold         # reroll one slot
python3 <this skill>/scripts/draw_techniques.py --show tr-velocity-handoff-cut                         # one entry in full
```

Formats: launch, feature, loop, sting, walkthrough, vertical; energy: calm, medium, high. Write the seed and the picks into `shotlist.md`. Build each pick the concept can carry, retold in the film's own objects; reroll a pick that fights the concept at most twice, or drop it with a written reason; never add a technique the draw did not give you (draw one with `--category`). A draw is a starting point, not a quota. The recipes were written for another engine: translate them to the seek-engine template's `tween`, `EASE`, `SPR`, `beat()` and `TOKENS`.

## Ideas, not features

One shot is one idea. A 15 s film holds about four visual ideas; three extraordinary moments beat ten mediocre feature animations. Tell it as one continuous thought (for example, chaos → control → clarity → the product) rather than a list of five features. The first 1.5 seconds already look finished, and the first real product moment lands by about 2 seconds.

## One carrier

[shotlist, existing house rule; measured corpus, brand.md section 4] This house shape uses one carrier. The measured source treats a carrier as optional for held shots, typographic essays and task documentaries; see [the source alternative](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-BRAND-SYSTEM.md#4-the-hero--carrier-object-optional). Keep the chosen film shape explicit.

Pick one object that travels through every shot and changes role: the prompt bar, the card, the dot that becomes the logo. Persistent objects make a film feel designed instead of assembled, carry the eye across every cut, and let the story read with the sound off. Every transition is motivated by something on screen. Give the film one hero moment and build to it; don't spend it early.

The test for a transition: the viewer thinks "of course the next scene came from that."

| Good | Bad |
|---|---|
| a chart line becomes a document's edge | crossfade |
| a pill becomes the invoice button | random wipe, spin, glitch |
| a number becomes the amount in the next screen | a whip-pan every two seconds |
| a card's edge becomes the next surface | generic slide-left |
| the camera pushes through an interface element | zoom-blur on everything |
| a mask in the product's own shape | a hard cut with no rhythmic reason |

## shotlist.md

```
Logline:  [≤ 15 words]
Carrier:  [the object and its path through the shots]
Grid:     [BPM, beat length, bars, where frame 0 sits in the track]
Hero:     [the one hero moment and its time]

#  time         state in → state out        purpose
   reads        [t0-t1] first thing the viewer must understand (where is the eye?)
                [t1-t2] next one
   camera       [push 1.0 → 1.3, cam spring] · text "[exact words]" · sound [kind on beat]
   transition   [how this shot hands its carrier to the next]
```

Put the same times into the composition's data (state arrays, cue lists): the shot list and the code must not drift apart. When a retime happens, update the list first.

## Three variants

When the brief leaves the direction open, write three short storyboard variants that differ in idea, not decoration (for example: the product's own verb made literal; the viewer's pain made visible; one unbroken camera move or a container that becomes the product). Each is a logline, a carrier and a 5-8 row beat table, and each has passed the ownership and specificity tests in [CONCEPT.md](CONCEPT.md). Throw out any variant whose props could appear in a competitor's film. The user picks one; a picked direction beats fixing the first idea you had.

## Audit the plan before building

A plan that will read as a slideshow can be caught before any pixel. Revise when most shots share one layout or one shot size, when descriptions repeat, when a shot has no purpose a viewer would name, when a camera move has no reason, when most shots are text first, or when a shot is described in stock words ("modern", "sleek", "dynamic", "stunning", "a person", "seamless"). Name the film's delivery promise in the brief (motion led, source footage led, data explainer, screen demo, presenter) and never quietly downgrade it: a film promised as motion that has to fall back to still images stops and asks.

## Done when

The concept gate in CONCEPT.md is met; the technique draw and its seed are recorded; neighbouring shots differ in at least two dimensions (FORMATS.md); every shot has an entry, an exit, a purpose and reads that fit its length; nothing important overlaps; there is a transition at every seam; the hook, hero and poster frame are named; and the user has seen it.
