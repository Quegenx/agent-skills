# Adding letters (glyphs)

Extend the geometric alphabet in the project copy of the supplied kit. Built-in support and the workflow live in [WORD-FOLD.md](../../../WORD-FOLD.md). [word-fold, references/glyphs.md and assets/kit/fold.js]

## Geometry and paths

[word-fold, references/glyphs.md]

All letters are geometric caps in **local units**: cap line `CAP=597.9`, baseline `BASE=681.64` (cap height 83.74), vertical stems `STEM=14.43`, horizontal bars `BAR=12.9`, diagonals about 13.9 thick measured square to the stroke (horizontal width ~17.6), rounds 14.4 on the sides and 12.9 at top and bottom. Match these, or the new letter will look bolder or lighter than the rest.

A glyph is an entry in `GLYPH` in `word-fold/fold.js`:

```js
X:{w:WIDTH, draw:x=>[ /* SVG path strings, x = left edge of the letter box */ ]},
```

- `w` is the advance box width. The box should hug the ink; `space_word.py` adjusts pair spacing within its [measurement limits](../../../WORD-FOLD.md#helper-corrections-and-measurement-limits).
- Return one or more path strings. They are filled with `fill-rule: evenodd`, so use **separate strings** for overlapping parts. Put counters inside the same string as their outer shape (as `dShape(outer)+dShape(inner)` does).
- Helpers: `rect(x0,y0,x1,y1)`, `dShape(x0, xa, top, bot)` (a rectangle plus a half-round of radius (bot-top)/2 starting at `xa`; used for D, B and R bowls), and the A builder `aPaths(c)`. The O, G and N glyphs show how ellipse rings, an open ring with a bar, and a diagonal meeting stem corners exactly are built.

## Recipes

[word-fold, references/glyphs.md]

These are extension recipes, not additional implemented glyphs.

- **H**: two stems + a bar at y 633.45 to 645.52 (same bar as E's middle).
- **F**: E without the bottom bar.
- **P**: R without the leg.
- **B** (w ≈ 89): upper `dShape(x, x+43.45, CAP, 640.3) + dShape(x+14.42, x+39.05, 610.89, 633.45)`, lower `dShape(x, x+46.61, 635.76, BASE) + dShape(x+14.42, x+43.55, 645.52, 668.76)`: two strings, each outer bowl with its counter.
- **U**: two stems down to ~BASE-41 + a half-ring bottom (an ellipse arc); keep the stroke at 14.43 on the sides.
- **V**: two diagonals meeting at the baseline (an A upside down, no crossbar).
- **M**: two stems + two diagonals meeting at the middle bottom; give the diagonals the same width as N's.
- **S / C / K / Q**: build them from ellipse arcs and rectangles in the same weights. Check them at 4× zoom; round letters need the most care.
- **Digits**: the source mentions a strip-made 4 (diagonal + stem + crossbar cut flush along the diagonal), but its referenced player is absent. No digit implementation is bundled.

## Check every new glyph

[word-fold, references/glyphs.md]

Render the final frame, crop each letter at 3 to 5× and check that:

- no edge bleeds (a bar end must follow the round it joins, like G's bar),
- no 1 to 2 px steps where strokes meet (make a diagonal meet stem corners exactly),
- the weight matches its neighbours.

Then rerun `space_word.py`.

## Prove it

[word-fold, references/glyphs.md]

The new glyph uses separate paths for overlapping solids, counters in the same path as their outer shapes, matching stroke weight and joins without bleed. Inspect the final-frame crops and rerun the spacing helper; report any unresolved segmentation or residual rather than claiming spacing is solved.
