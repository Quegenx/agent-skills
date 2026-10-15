# Styles: look, motion language, video type

A film is three separate choices, and keeping them apart is what makes a brief buildable and a restyle cheap:

- **video type**: the structure, beats and pacing (`shotlist/FORMATS.md`);
- **look**: palette, type, stage, texture and shapes (`STYLES` tokens in the seek-engine template);
- **motion language**: how things move (durations, curves, springs, stagger, overshoot, the seam types it prefers).

"Cyberpunk + cinematic" is a look and a motion language. "A SaaS demo, but snappy" is a type and a motion language. When a request names two looks, the first owns layout, type and texture and the second lends palette and mood; with two motion languages the first owns curves and timing and the second adds its one signature trait (a glitch's displacement, an elastic's landing squash). Write all three into `brief.md`, plus any defaults you applied.

**Three dials before any concept**: visual variance (one tight grammar, a few scene families, or a new mode per beat), motion intensity (calm holds, clear accents, fast kinetic changes) and information density (one idea a frame, an idea with support, dense diagrams), each 1-10, with a one-line design read that names the audience and the reason ("investor-facing AI launch: precise, restrained, credible; no hype visuals", never just "modern and clean"). The dials constrain each other: high motion with low density means short kinetic beats, not dense diagrams; low motion with high density means stable frames, builds and long holds; high variance needs stronger anchors (recurring type, palette, framing or a sound motif).

## Sameness hides in structure

Two films can share no colour and still be the same film. Before building, write this film's structure beside the last one's and change at least two of: the rhetorical device (many into one, before and after, a day in the life, testimony, pure demonstration, contradiction, the work that no longer happens, one object examined); the arc and where the turn lands (40% is everyone's default: try 15%, a cold open on the answer, or 75%, a long patient problem); the climax mechanic (one hero element swallowing the frame is one option); the opening state (empty ground that fills is the default: start full and subtract, or mid-action); the ending (a quiet lockup is the default: end loud, mid-motion, on the product still in use, or on the problem now absent); human presence (a hand, a face, a real photograph differs more than any grade); and the sound's shape (sparse hits then a late sustained tone is the default resolution). Breaking a category's cliché the same way twice is a house style too. Let the claim's feeling pick the look: relief from drudgery feels like weight lifting (crowded to clean, loud to quiet), precision feels like an instrument, speed is kinetic, craft is slow and tactile, scale is wide and deep, play overshoots. A look that argues against the script is the commonest reason a clean film feels wrong.

## Start from the brand's personality

An invented look starts from three adjectives written into the brief before any colour or face is picked. Without this every film drifts to the same cool, light, geometric-sans minimalism: the starter's look, which reads as a template the second time a viewer sees it.

| Personality | Typeface | Stage | Accent | Shapes | Motion |
|---|---|---|---|---|---|
| Calm, clear, unhurried (notes, reading) | a humanist sans (Source Sans 3, Commissioner), 350-450 | light neutral or cool paper, soft ink | low-chroma ink blue, moss, sage, teal | soft radii, thin strokes | unhurried: 30-48 frame moves on `out` and `dolly`, no overshoot, long holds |
| Fast, exact, confident (CI, APIs, build tools) | a tight grotesk (Schibsted Grotesk, Instrument Sans) at 600-650, a mono for numbers | often dark, neutral or cool | a hot signal: red, green or a clean yellow | square or small corners, a visible grid | crisp: 12-20 frames on `out` and `whip`, cuts on the beat |
| Bright, friendly, playful (consumer, social) | a rounded sans (Nunito, Fredoka) at 600-700 | light, or one designed flood of the accent | one saturated primary | big radii, pills, blobs | lively: quick arrivals, contact squash, overshoot only on its 1-2 true landings |
| Precise, quiet, expensive (finance, legal, premium) | a neo-grotesk (Hanken Grotesk, Public Sans) at 400-500 | deep near-black or bright paper with fine rules | deep jewel tones at restrained chroma | small corners, hairlines | slow and exact: `rest` and `dolly`, 36-60 frames, no overshoot |
| Raw, mechanical, honest (dev tools, infrastructure) | a mono as the voice (JetBrains Mono, Martian Mono) with a plain sans | concrete grey or dark | safety yellow or signal red | square corners, notches, registration marks | detents, steps, hard stops, conveyors |
| Warm, kind, steady (health, care) | a friendly humanist sans (Figtree, Nunito Sans) at 500-600 | light and neutral: the warmth comes from type, shapes and motion, not beige | from the product's world: leaf green, sky blue, a soft red | rounded corners, organic shapes | soft, no overshoot |

For a world (3D, illustrated, a game-like film), tie the look to the idea in one sentence, a visual thesis ("a courier races through a paper city that folds into ramps as the deadline nears"), and derive five decisions from it: shape language (rounded, angular, stacked, sliced, inflated); colour by job (one dominant field, one structural neutral, one accent for what matters, one for danger when the story has it); one material family (matte clay, cut paper, lacquered plastic, emissive wire); one lighting model; one motion signature (folding, snapping, floating, orbiting). An asset that fits none of them is restyled or cut.

Write colour as numbers: background lightness, the primary colours, one accent, and how much of the frame is colourful. In a measured sample of 1,119 code-made films, the motion and UI category split into dark-neutral and light-neutral looks of nearly equal size, and the median share of visibly colourful pixels was about 18% for ads and launches against about 45% for music videos (Awesome Claude 5.5 Videos, CC BY 4.0). Descriptive, not a recipe: a restrained ad and a saturated music video are both normal. Check colour consistency shot to shot on the beat sheet.

Light or dark is a brand decision: dark for dev tools, night, focus and security, and premium brands that want a cinematic feel; light for documents, reading, health, consumer and anything used in daylight. A brand that supplies its own serif, warm paper or orange wins over this table: record the exception in the brief. Vendor the chosen family with `add-font.mjs`; compare two or three candidates on the name and the key line before committing.

## Look families

Pick a family, then a look inside it. Each line is a starting descriptor, not a template: write the actual tokens (hex values, family, weights, radii, texture) into `style-guide.md`.

- **Commercial.** *Minimal* (one subject and one message per shot, vast negative space, one accent). *Hero product* (the object on black or white under rim light, slow orbits, oversized confident type). *Luxury* (slow and restrained, deep blacks or ivory, fine gold rules, wide-tracked display type, a brand-supplied serif when there is one). *Corporate* (navy and a clear blue, a structured grid, calm pacing). *Clean UI* (white cards, quiet shadows, one brand colour, motion that follows interaction). *Editorial* (magazine pages in motion: big headlines, columns, rules, photo blocks).
- **Cinematic.** *Cinematic UI* (the product's real interface filmed like an object: oblique macro close-ups on true black, a thin focal plane, a light pool on the UI, slow motivated drift, no cursor, hard cuts, one line of copy and a still logo, foley instead of music; seek-engine's CINEMATIC-UI.md). *Trailer* (letterbox, high contrast, huge condensed titles on black between shots, silence before the title). *Sci-fi* (vast scale, cold blues with one hot accent, slow majestic camera). *Dark atmospheric* (low-key light, fog, slow reveals, mood over information). *Horror* (mostly darkness, one red, long silences and sudden stings). *Documentary* (lower thirds, dates, maps, grain, slow moves on stills).
- **Digital.** *Futuristic HUD* (thin linework, rings, ticks, readouts; everything is an instrument). *Network* (nodes and flows on deep blue, precise type). *Cyberpunk* (magenta and cyan on near-black, signage, scanlines, dense depth). *Glitch* (broken signal as an aesthetic: channel splits, slice displacement, stutter). *Holographic* (iridescent translucent layers, refraction). *Retro-futurism* (chrome sunsets, grid floors, italic chrome type).
- **Information.** *Infographic* (big numbers, bars and rings that build, one insight per shot). *Data viz* (chart first: axes, lines that draw, annotations). *Technical* (callouts with leader lines, exploded parts, neutral greys with one signal colour). *Blueprint* (white linework on blue, dimensions, construction lines). *Whiteboard* (stroke-by-stroke drawings, handwritten labels). *Map* (routes, pins and dates, a camera that flies between places). *Timeline* (an axis that draws on, years as big numerals).
- **Illustration.** *Comic* (panels, ink outlines, halftone, action lines). *Hand-drawn* (wobbly lines drawn on, paper texture, off-register fills). *Paper cut-out* (layered sheets with soft shadows, stepped timing). *Stop-motion* (on twos, per-frame jitter, tactile materials). *Children's* (round shapes, soft brights, bouncy timing).
- **Abstract.** *Geometric* (primitives with strict ratios locking into grids). *Generative* (flow fields, rule systems; the system is the subject). *Liquid* (gooey merges, glossy morphs). *Particle* (the subject made of points that form and re-form). *Organic* (growth, curves, breathing motion).
- **Retro.** *VHS* (chroma bleed, tracking bands, a timestamp). *CRT* (scanlines, phosphor glow, a curved bezel). *80s*, *90s* (collage, xerox, stickers), *Y2K* (gloss, chrome, bubbles), *pixel art* and *8/16-bit* (an integer grid, a tiny palette, stepped motion, no soft edges), *arcade*.

Glow, gradients, glass, neon and serif "elegance" are what generated work reaches for: use them when the chosen look truly calls for them (a cyberpunk film owns its neon), never as decoration on a look that doesn't. Every look still obeys the frame-review tells and the finish gate.

**Looks named after a designer**: naming a reference gives the look a point of view. Starters, not presets; the brand's own tokens win.

| Look | After | Feels | Defining moves |
|---|---|---|---|
| Swiss pulse | Josef Müller-Brockmann | clinical, precise (dashboards, developer tools, metrics) | everything on a visible 12-column grid, numbers dominate at 80-120 px, hard cuts, nothing floats |
| Velvet standard | Massimo Vignelli | premium, timeless (luxury, enterprise, keynotes) | vast negative space, symmetry, thin wide-tracked capitals, sequential reveals with long holds, everything glides |
| Deconstructed | Neville Brody | industrial, raw (developer and security launches) | type at angles escaping the frame, heavy weights, scan-line grit, words slam and snap together |
| Maximalist type | Paula Scher | loud, kinetic (big launches, milestones) | type is the picture, overlapping layers at many scales filling half the frame or more, 2-3 s scenes, fast arrivals and hard stops |
| Data drift | Refik Anadol | futuristic, immersive (AI and data products) | thin weightless sans, fluid morphs, extreme scale shifts, particles gathering into numbers, light tracing data paths |
| Soft signal | Stefan Sagmeister | intimate, warm (wellness, personal stories) | handwritten or humanist serif in lowercase, one element filling the frame, slow drifts, nothing polished |
| Folk frequency | Eduardo Terrazas | cultural, vivid (consumer, food, festive) | warm rounded type, pattern and repetition, layered texture, things pop and spin in with deliberate overshoot |
| Shadow cut | Hans Hillmann | dark, cinematic (security, investigations, dramatic reveals) | near-monochrome with one blood-red accent, film-noir title type, elements emerging from darkness, slow creeping push-ins, the pause before the hit |

## Motion languages

Set these as constants at the top of the scene (or in a `MOTION` object beside `TOKENS`) so a different language is a different set of numbers, not a rewrite.

| Language | Enter / exit / move (s) | Hold (s) | Word stagger | Curves and springs | Prefers |
|---|---|---|---|---|---|
| Smooth (the default) | 0.6 / 0.4 / 0.9 | 1.4 | 70 ms | `out`, `standard`, `SPR.enter` | dissolves, pushes, match cuts |
| Cinematic | 1.2 / 0.8 / 1.8 | 2.4 | 140 ms | `cam`, `dolly`, long eases, `SPR.heavy` | slow pushes, layered depth, held pauses |
| Snappy | 0.35 / 0.22 / 0.45 | 0.9 | 45 ms | `out`, `whip`, small overshoot, anticipation | quick scale changes, whips, cuts |
| Elastic | 0.8 / 0.35 / 0.9 | 1.2 | 80 ms | under-damped springs (z 0.5-0.7), `squash` | bounces, landings, playful morphs |
| Mechanical | 0.5 / 0.4 / 0.6 | 1.2 | 100 ms | stepped values on a grid, hard stops, linear with detents | steps, slides on rails, wipes |
| Organic | 1.0 / 0.8 / 1.6 | 1.8 | 110 ms, jittered | soft eases with seeded variation; nothing perfectly in sync | morphs, growth, dissolves |
| Glitch | 0.35 / 0.2 / 0.4 | 1.0 | 50 ms | discontinuous jumps, slice displacement, channel splits (seeded) | hard cuts, displacement, flashes |
| Energetic | 0.3 / 0.2 / 0.4 | 0.8 | 40 ms | `whip`, `contact`, impact frames | rapid cuts, whips, punches |
| Calm | 1.4 / 1.0 / 2.2 | 3.0 | 160 ms | `smooth`, `dolly`, critical springs | long dissolves, slow parallax |
| Stop-motion | 0.7 / 0.5 / 1.0 | 1.4 | 100 ms | values sampled on twos (`Math.floor(t * 12) / 12`) plus seeded per-frame jitter | stepped cuts |

Stop-motion and glitch break continuity on purpose: declare their steps in `cuts()` or run the smoke test with `--no-pops` for those stretches only, and say so in the review log.

## The same film in several looks

When the user asks for "the same video in three styles", or to compare looks: build one composition whose every colour, face and texture comes from `TOKENS`, add one entry per look to `STYLES` (each with its matching on-colours), and keep the script, scenes and timing identical. Then:

```bash
for s in paper night brass; do node scripts/render.mjs full --style $s --out out/16x9-$s.mp4; done
ffmpeg -i out/16x9-paper.mp4 -i out/16x9-night.mp4 -i out/16x9-brass.mp4 \
  -filter_complex "[0:v]scale=640:-2[a];[1:v]scale=640:-2[b];[2:v]scale=640:-2[c];[a][b][c]hstack=inputs=3[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -crf 20 -pix_fmt yuv420p out/compare.mp4
```

For four looks use `xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0` (a 2×2 grid). Check the comparison: the same beats at the same moments, each clearly its own look. When an asset must change with the look (a photo texture in a pixel-art look), branch on the style name, but never on timing.

## Restyle without rebuilding

"Make it more cinematic", "make it cyberpunk", "snappier": modify, don't rebuild. Keep the story, timing and assets. A motion change swaps the motion constants; a look change adds a `STYLES` entry (or blends: keep one look's layout and type, borrow another's palette). Try it first on stills (`render.mjs sheet --every 1 --style <new>`), then commit, then edit only the scenes whose assets clash with the new look, and report what changed. A restyle that alters the beats is a new film: go back to the shot list.
