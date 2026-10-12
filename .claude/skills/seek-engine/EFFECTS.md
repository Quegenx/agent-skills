# Effects: one object becoming another

Sixteen short product and type effects, each a recipe: the start, the end, when each part moves, and the detail that makes it read as designed. Swap the demo words for the film's real ones and every colour role (ground, surface, ink, muted, accent, second accent) for a `TOKENS` entry.

## The clock and the rules

As a loop, every effect runs on one 8 s clock: the move 0 to 2.2 s, the hold to 6.6 s, the return by 8.0 s, and `seek(8)` paints exactly `seek(0)`. Under narration use hold mode instead: play the move once and stay on the finished state, so it never resets mid-sentence. In a fast vertical cut, use only the active ~1.4 s of the move. Inside the move, "early" is the first 0.8 s, "middle" 0.8 to 1.4, "late" 1.4 to 2.2.

- **One object changes shape.** A button becomes a player, bars become a line, a card becomes a window. A crossfade from one picture to another reads cheap every time.
- **Leave a ghost of the start.** A faint or dashed outline where the object began lets the eye follow where the end state came from.
- **Stagger by a beat.** Rows, slats, letters and dots each start a little after the last; everything starting together reads as a slide transition.
- **Keep the hold alive.** The hold is where people look: keep one small thing moving (a progress bar, a cursor, a second wave of light), never the whole frame.
- **Shared elements travel.** A title that moves from the card into the window is the same element moving, never typed again.
- **Made-up numbers carry an "example" label on every frame** until the real ones go in.
- **One hero, big.** The hero object fills 60-70% of the frame with one focus; at most five words on screen; the after state holds at least 1.2 s.
- **Scale the effect to fill the frame.** Lay it out from `W`, `H` and `U`; an effect drawn at fixed coordinates ends up in a corner when the format changes.

Check stills at 0, 1, 2.2, 4.4, 6.6, 7.9 and 8 s: 0 and 8 identical, 0, 1 and 2.2 all different (if two match, part of the move isn't running), and the point of the effect readable from the 4.4 s frame alone.

## Interfaces

**01 Button to player.** A pill button ("Preview", a play triangle) grows into a full player: thumbnail, title, a time readout, a progress bar with a round handle. The button's own shell stretches into the player shape over the move; its label fades in the first quarter, the player's contents fade in over the second half; the play icon travels to the centre, grows a dark disc behind it and changes colour; around 2.6 s play morphs into pause (two shapes morphing, not a swap). Through the hold the progress bar creeps and the readout counts. A ghost of the button stays where it started.

**02 Search to results.** A short pill with a magnifier opens to full width before a caret appears; then the query types (about 0.75 to 1.2 s); from about 1.1 s three result cards rise ~14 px into place, a beat apart, each with a coloured tile, a title and one real metric. The pill opens before the typing starts so the two moves never fight. (The `examples/explainer` film is this effect grown into a story.)

**03 Card to workspace.** A small outlined card grows from its own corner into an editor window (title bar, a sidebar with one active item in the accent, a document, chips). Dashed guides run from the card's corners to the window's; the card's own text fades in the first fifth; the window's contents wait until the shell is past halfway, so nothing is squashed; the card's title travels into the window's title bar. A dashed ghost of the card stays at the origin.

**04 Tabs to panels.** The selection pill stretches to the next tab: its leading edge moves first and its trailing edge a beat behind (the template's `SPR.lead` and `SPR.trail`), so it grows long then short as it lands, with two short speed lines behind it. Each tab label's colour follows how much of the pill covers it, so text never flips. From about 0.9 s the panel's header and rows swap, each sliding 14 to 16 px sideways as it fades, top row first.

## Data and lists

**05 Chart morph.** Six bars slim to hairlines left to right, a beat apart; from about 0.84 s a line draws on through the same six tops with a soft fill under it, a dot popping in as the line reaches each point, the last point in the accent with a value tag rising onto it at ~1.5 s. The values never change between bars and line, which is why the viewer trusts it; the line is drawn, never faded in. The title, labels and axis never move; only the chart changes, and nothing fades out to be replaced.

**06 Dashboard zoom.** Four accent corner brackets snap around one KPI tile in the first 0.9 s ("this one" before anything moves); the rest of the dashboard dims; from about 0.7 s the tile scales forward from its exact position and size into a large card (label, delta chip, the big number, a sparkline), dashed guides joining old corners to new. It reads as the same object coming closer.

**07 Spring stack.** Three stacked cards fan out on real springs with different damping: the back card heavily damped, the middle less, the top card least, so it swings past its angle and wobbles back; the top leads, the others follow 0.05 and 0.1 s behind; settled by ~1.8 s. A dashed ghost marks the top card's resting angle and a short trail of accent dots follows its corner. The return eases them home with no spring.

**08 Magnetic dock.** A cursor glides over a dock of seven icons; each icon's size follows a bell curve of its distance from the cursor, the dock re-centres as it widens so it grows around the cursor, and a label sits over the largest icon. Through the hold the cursor sweeps once left and right and the swell follows. A smooth falloff, never "this icon big, the rest small".

## Type

**09 Masked type.** Artwork rises inside the letters of a big outlined word, the fill edge climbing bottom to top over ~1.35 s with an accent line and a small square handle marking the edge; from ~0.95 s a second line rises into view from behind a clean cut line (a mask, not a fade). The marker fades when the fill completes.

**10 Elastic type.** Letters stretch on one locked baseline into a peak: the stretch starts at the middle letter and spreads out in pairs a beat apart, the middle letter tallest, narrowest and the only one in the accent; letters change width as well as height (a variable font's `wdth`), so the word stays one word. A handle on the middle letter, a dashed line for its travel and a readout counting the width ("wdth 100" to "wdth 62") explain it.

**11 Text to layout.** One headline splits into two halves that travel separately to an editorial page, growing as they go (the second half drops first, then slides left, so the halves never share a line); then, in reading order, a kicker fades in (~1.0 s), an image wipes open (~1.05 s), body lines draw on (~1.1 s) and a pull-quote card rises last (~1.2 s). The headline is the same text moving, never retyped.

**12 Image reveal.** Seven dark vertical slats each narrow to nothing toward their own centre line, left to right a beat apart, the last gone at ~1.7 s, each with a faint light edge so it reads as a physical object; a small label pill fades in from ~1.05 s.

## Systems

**13 Perspective shift.** Three flat layers of a page (a chart at the back, a list, a layout on top) pull apart in depth back to front, a beat apart, all angled toward one shared vanishing point (marked with a small dot, dashed guides fading in from ~0.9 s). Through the hold the vanishing point drifts gently so the stack breathes. Every layer keeps real content, so it reads as "the layers of this thing", not three grey cards.

**14 Glass focus.** A lens steps down a softly blurred report: only the text inside it is sharp, at 1.1x, with two faint tinted copies a fraction of a pixel either side like real glass, a highlight across its top and a double rim. Through the hold it travels to the last row and back on an eased curve.

**15 Flowing paths.** Pulses leave a source node 0.14 s apart, light their connector as they travel (the line is drawn by the pulse, never switched on), and each node answers its arrival with an expanding ring and a brighter dot; a second set runs on into the result node, the lines shading from the cool colour to the accent; a second wave at ~3.6 s keeps the hold alive. Cause and effect are visible.

**16 Particle logo or number.** Dots fly in on gentle arcs with short trails, leftmost first with a seeded spread over ~1.1 s, and pack into a mark or a number; a label switches from "assembling" to "assembled" at ~2.0 s; the return scatters them to their exact starting points. Build the targets by drawing the mark or the number (in the bold weight) on an offscreen canvas and sampling its filled pixels on a grid, so the finished shape is crisp. At feed size give most of the points to the shape (about 2,700 of 3,200, each ~2.5 px at near full opacity), or the digits read grey; the rest drift as dimmer stars. Create that canvas's context with `getContext('2d', { willReadFrequently: true })`: after repeated `getImageData` reads Chromium moves a canvas to another drawing path and the same frame can come out slightly different.
