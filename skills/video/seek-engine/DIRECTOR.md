# The director: editing to the music

A film cut automatically to a track: stages, captions, flashes and glitches placed from `audio/beats.json` and `audio/bands.js` (both from the beat-grid skill).

## Editing to the music: the director

A simulation can be cut to a track automatically, every rule a pure function of time and the beat grid (`audio/beats.json`, `bands.js` for kick strength):
- **Shots change on bar lines:** a table of crops (wide 1.0, tight 1.75 on focus 0, medium 1.3 on focus 1, very tight 2.2 ...), cutting every 4 beats before the drop and every 2 after; the first beats of the drop always open wide. The sim returns its focus points (screen coordinates of what matters) each frame so tight shots frame them.
- **Punch-ins on kicks:** scale +3% before the drop, +7% after, decaying in ~0.11 s; a slow push of +3.5% across each bar in tight shots.
- **The drop:** a shake decaying over ~0.25 s, a white flash, accent flashes on later downbeats.
- **Land the hero on the drop:** warp the simulation's own time piecewise linearly so its hero moment (the 256th agent, the ignition) happens exactly on the drop, while cuts and captions run on music time.
- **Captions on the beat:** words slam in on successive beats (half-beats when a line has more than four words), each scaling from 1.35 to 1 on an exponential ease with a blur of 8 px clearing in ~0.12 s; marked words get the accent box; a number caption rolls from its start to its end value over a set number of beats; a sub-line types itself (~22 ms a character) after the last word lands; the caption leaves in ~0.18 s with a small sideways jitter. After the drop, every downbeat gets a faint full-frame flash (~0.16 × the beat's energy, decaying in ~0.2 s) so the second half keeps pulsing. A glitch on each stage change and on the drop: for ~3 frames, horizontal slices of the frame copied with sideways offsets up to ±60 px plus one accent bar.
- **Captions placed by the music:** each story line placed at a bar, or a number of bars from the drop, and held for a number of beats.
**Editing craft.** When cut priorities conflict, Walter Murch's order decides: emotion first, then story, rhythm, where the eye is, screen direction, and spatial continuity last; a cut that is right emotionally survives a small continuity slip, never the reverse.
- Cut on phrases (2, 4 or 8 beats), not every beat; the cut rhythm follows the film's personality: premium every 8-16 beats with long holds, corporate every 8, playful every 4 with syncopated accents, energetic every 1-2 beats only at the climax.
- Cut on action: about a third of the way into a move, while the shape is still travelling, and carry the same direction and speed into the next shot. A match cut registers the shared shape in size, position and angle within 1-2 frames, or the illusion breaks.
- A speed ramp into a hit: map real time to film time with an eased curve whose slope falls to ~25% into the impact and recovers after (100% to 25% to 100%), and land the slowest frame on the beat; keep the shutter constant through the ramp. The template's `timeWarp` is the freeze version.
- The arc is in the shot lengths: long holds to establish, shortening toward the climax, the fastest cuts on the drop, then one long hold to resolve. Default to the hard cut; a dissolve is not a fix for a cut in the wrong place.

Choose the clip window with `analyze_audio.py grid --drop-at 0.4` so the drop lands about 40% in.

**Sequencing shots in a cut film**:
- Never the same camera move on two adjacent shots: a push into one surface followed by a push into the next reads as one long shot with a bad cut. Alternate (locked, turn, locked, dolly, locked); write each shot's move on the shot list so the rule is checked on paper.
- Alternate dense and still. Three dense product shots back to back exhaust the viewer by twenty seconds; put a title, a number or a quote between them. A rough budget for 45 s: three dense shots, four still or near-still ones, a type frame at each end.
- A comparison makes its case by partial coverage: the alternative gets a neutral mark on the rows it really covers and a different-shaped mark (a hand, a clock) where the work is manual. A column of all dashes is a straw man, and a strike-through or red cross reads as attack copy. Rows are the buyer's problems, not your feature names.
- Successive numbers about one thing (four quarters, three metrics of one product) stay in the same visual space and look, and only the value changes; a change of look tells the viewer a new idea has started. Give a number a shape that carries its size (a fill, a ring, a bar), not a figure floating alone.
- Pick the chart by the story the numbers tell: under three points is a stat card, not a chart; comparing categories is a bar (horizontal when labels are long, sorted when it is a ranking); a trend over time is a line; parts of a whole is a donut of five slices at most; change is a before and after with the delta; more than about twelve categories get aggregated into the top few and "other". Bars start at zero, charts stay flat (3D distorts size), two series with different scales get two charts rather than two axes, every bar or line carries its own label rather than a legend, and colour is never the only cue (add a label or pattern; avoid red against green). Build a chart over 2-4 s and hold it built at least 3 s; if the voice moves on first, simplify the chart or lengthen the shot.
- A chart plots a series you have, with a labelled axis. Without the data, draw a form that is visibly not a chart (no axis, ticks, numerals or gridlines) or cut the shot; a curve that looks about right is the fastest way to make a real product look fake.

