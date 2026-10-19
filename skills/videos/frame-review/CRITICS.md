# Critics, verification and the ship gate

How a review round runs when the stakes are high (a launch film, anything long, anything shipping to a feed): independent critic lenses, a pass that tries to refute their claims, a rubric and a gate. A small sting or loop gets one round run by yourself; a launch film gets at least two rounds and stops at five.

## A round

1. **Render a preview** (the full film at `--scale 0.5 --sub 1`, or the master once picture is locked) and run the computational checks: `smoke.mjs` (every counter 0), `check_sync.py` once there is sound.
2. **Make the sheets**: the beat sheet, a watch sheet (`render.mjs sheet --every 0.08` per 4 s chunk, about 12 tiles per second), and a legibility sheet (`sheet --every 1 --w 480`, phone size).
3. **Read the flags yourself first** for five minutes, and declare what is designed: hard cuts in `cuts()`, a designed freeze or long read in the shot list. Declaring intent is how real problems elsewhere stay visible; never loosen a threshold to pass.
4. **Run the lenses** below, as parallel subagents when the harness has them, otherwise one after another in your own context, opening the sheets before any code (the code tells you what you meant; the sheets show what you made). On a tight budget run at least the director and art lenses.
5. **Verify** every P0 and P1 (below), then **fix** in order of impact per minute and **log** the round in `review-log.md`: the scores, each fixed issue, and which frames prove it.

Prompt rules that pay off: say what changed since the last round so it gets checked hardest; say "do not re-report fixed issues"; say "do not propose adding text" (critics reach for captions when a picture doesn't read, and the fix is the picture); ask for a ranking by impact per minute of fixing with the time left; batch frames into sheets, because images are the expensive part of a critic's context.

## Every lens returns this

```json
{"issues": [{"id": "short-kebab-id", "priority": "P0|P1|P2", "t": "12.40-12.60",
             "problem": "TELL-ID: what is wrong, what the viewer sees", "fix": {"file": "index.html", "change": "the concrete edit, with values"}}],
 "overall": "3-6 sentences.\nrubric: idea=4 hook=3 ...", "score": 7.5}
```

At most 12 issues, every fix concrete and code-level (a constant, a curve, a time in beats, never "improve the pacing"), the tell ID from `TELLS.md` at the start of the problem when one matches.

## The lenses

**Director.** Watch before you read: go through the watch sheets in order, imagining real-time playback, and write first impressions before opening any code. Then answer with times:
- the weakest 3 seconds, and why;
- anything cheap, templated, slow, confusing or dead (check against `TELLS.md`);
- specificity: would the film be just as true of a simpler product? Name the non-obvious behaviour and the beat that should show it;
- its own look: could it be the starter, or any other film made with these skills? Is there a personality in the type, stage, shapes and motion?
- does each act's idea land within its first second; does the story read with the sound off; does the device survive every seam;
- the hook (frame 0 composed and moving, problem felt by 1 s), the end (lockup resolved and building 1.5-2 s, the brief's fact on the end card, the last frame a poster);
- pacing: one peak per bar, calm between peaks, a first 6 s about twice as dense as the middle, the last and biggest peak at 75-90%;
- transitions: 6-8 types, none more than twice, one signature move at open, middle and close.
Owns: idea, hook, composition, motion, transitions, pacing.

**Art, copy and UI.** Judge every frame literally, as a paused still. Copy: spelling, casing, plurals, placeholders, reveals that spell other words mid-way, the word budget (≤ 5 words a line, ≤ 2 lines, one line at a time), stock phrasing, the end card's fact. Type: one family on one token set, emphasis from size or motion, tabular figures, sizes. Brand: do the choices follow from the brand's three adjectives; is the mark ownable and does it pass the 64 px misread test. Colour: one accent with one meaning, ≤ 8% of pixels outside one flood, no muddy washes or banding. Composition: no SaaS layout, one focal action, safe margins, no text covered by a mover, vertical frames that use their height. Product truth: the smart part shown, data that agrees with itself and the story, counters that change on their cause's landing frame, the feature named once, no cursor once the product acts alone. Run it in round 1 and whenever copy, type, colour or UI changed. Owns: copy, colour, composition, product.

**Sound and sync.** You can't listen, so you measure: `check_sync.py` (lag, true peak, loudness, range, where the loudest moment sits), the mix report (each phrase's voice-over-music ratio, warnings), and strips around the key hits. Check that every sound has a visible cause and every instance of a sounded action is sounded at one level; whooshes peak on the visual peak; impacts sit on the contact frame; the payoff is the loudest moment and the ending subtracts; the hook has a sound with a reason on frame 0; the score's energy matches the brand's personality. When a hit belongs on the beat, move the picture, not the sound. Owns: sound.

**Verifier.** Critics are often confidently wrong: an effect invisible at speed, a seam that was declared, a fix that would break sync. Before fixing anything, hand every P0 and P1 (up to 5 per verifier, on one act) to a fresh agent whose only job is to refute them from frames and code. It rejects an issue that is wrong, exaggerated (demote it), invisible at normal speed and on no key beat, already fixed, or whose fix would make the film worse; when the problem is real but the fix is wrong, it keeps the issue with a better fix. It returns only confirmed issues, each starting `VERIFIED:` with its evidence (times plus a measurement or a clearly described image), and lists every rejection with its reason. P2s skip verification and go to a backlog.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| P0 | visible on a key beat (hook, payoff, logo, end card), breaks the story or a fact, or breaks a ban the brief set | the lockup vanishes in 2 frames; a typo on the payoff; audio 3 frames late; the device blinks out at a seam |
| P1 | noticeable on a normal viewing | a one-frame pop mid-act; a 2.7 s dead logo hold; a masked hit; a stall at a seam |
| P2 | visible only on pause | a 1 px sliver for 3 frames in a fast move; a label 2 px off its grid |

## The rubric (1-5 per dimension)

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| Idea and device | a feature tour | a clear idea, but the device drops out or the film fits a simpler product | one idea specific to this product that reads muted; the device survives every cut and resolves |
| Hook (0-2 s) | blank or static | motion, but the problem lands after 2 s | frame 0 composed and moving; the problem felt by 1 s |
| Copy and type | labels, bullets, mixed fonts | clean but generic | on budget, lines that pay off the film's own words, one family on one token set |
| Colour and brand | gradients, neon, glass, the starter's look | disciplined but generic | a look of its own from the brand's personality; one accent with one meaning |
| Composition | centred web layout, voids | correct, with framing errors | full-bleed, one focal point per shot, headroom kept |
| Motion | uniform fades and bounces | good eases, with pops or stalls | named curves, weight, landings that land |
| Transitions | crossfades and presets | motivated, with repeats | velocity-matched cuts, relays and morphs, a signature move |
| Pacing | dead holds or cramming | even, with flat energy | one peak per bar, calm between, results held long enough |
| Product truth | a fake dashboard | real UI, but naive or inconsistent | the non-obvious behaviour shown; data that agrees with itself and the story |
| Sound and sync | stock sounds or out of lock | synced, but masked or flat | every event within a frame, audible, the payoff loudest, on target loudness |
| Finish | pops, ghosts, jitter, banding | occasional P1 artifacts | every counter 0, clean blur, correct tags |

Take the lower score where lenses disagree, and cap a dimension at 3 while it has an open verified P0.

## The ship gate

- every dimension ≥ 3, Finish and Sound and sync at 5, the mean ≥ 4.2;
- no open verified P0;
- every script passes: `smoke.mjs` (all counters 0 in every format), `check_sync.py`, the delivered-file checks.

When the gate is met, ship and say plainly what you would still change. Stop after 5 rounds and report any unmet gate as incomplete. The old source said to ship when either the gate passed or the round cap was reached; the cap does not establish a passing result. [Quegenx/agent-skills, frame-review/SKILL.md delivery evidence and original CRITICS.md at 48e92a7]

## Design-off for a weak act

When one act stays at 2 or below on any dimension for two rounds, or the director names the same act as the weakest 3 seconds twice, stop patching it and redesign it in competition. Three designers in parallel, each with the brief, the act's slot (its times, the cues and the device's state at both seams) and one bias: **story** (what must the viewer understand, and what is the most direct image of it), **camera** (one continuous move or a relay that carries the idea), **rhythm** (start from the bars: where the peaks, the silence and the drop go). Each writes a beat sheet (time · picture · camera · copy · sound) that keeps the seams and the word budget, with an honest build estimate. One judge scores each 1-5 on cinema (would someone rewatch), clarity (reads muted in one viewing), restraint and risk (buildable in the time left), checks every claim against the engine, picks a winner and grafts in the best one or two ideas from the others. Build the winner fresh, then run a full round on it. A design-off costs about one round, less than a third round of polishing an act whose idea doesn't work.
