# Endings: the strip becomes the last letter

Extend the final-letter construction in the project copy of the word-fold engine. Use this with the [glyph guide](glyphs.md) and [main workflow](../../../WORD-FOLD.md). [word-fold, references/endings.md and assets/kit/fold.js]

## Built-in endings

[word-fold, references/endings.md]

The last step (16 frames, `RIG.lastLen`) is special, and `FOLD.ending` picks how it lands. These are built into `rigAt()` and `render()` in `fold.js`:

| ending | last step | then |
|---|---|---|
| `A` | planted leg leans to −23.47°, swing lands at +23.47° (Λ over the A centre) | crossbar rises from the baseline, clipped between the legs (`wedge`) |
| `T` | both legs close into one vertical bar at the T's stem | top bar expands both ways from the stem |
| `I` | both legs close into one vertical bar | - |
| `N` | planted leg stands as the left stem; swing lands as the diagonal, at an angle solved so its lower edge meets the right stem's corner | right stem grows up from the baseline; the band clip trims the diagonal at the stem's outer edge |

`endX` (where the apex lands) and `LAST_FOOT` (the last planted foot) come from the last letter's box. All step positions are spaced evenly from the first bar to `LAST_FOOT`.

## Adding an ending

[word-fold, references/endings.md]

The suggested letters below are construction recipes, not implemented endings.

Most letters reduce to one of two patterns:

1. **Close into a stem, then grow strokes** (T, I and good for L, E, F, H, K, P, R, B, D). Reuse the `T`/`I` branch: `P → 0`, `W → 0` at `endX` = stem centre, `LAST_FOOT = endX`. In `render()`, draw the remaining strokes in the strip colour with ease-out growth that starts around `T_LAND-1`: bars sliding out of the stem, a bowl drawn by clipping it with a sweeping wedge, and so on.
2. **Land as two legs, then add a piece** (A, N and good for V, M, 4, X, Y, K). Give the landing angles for planted (`P`) and swing (`W`) and solve them from the letter's geometry so edges meet exactly. Then grow the missing piece.

Rules:

- Every extra piece uses the strip colour and is clipped so it can't poke past the strip's legs.
- Any clip that changes per frame goes through `setClip` (double-buffered).
- Add the new ending to the engine, the setup helper's supported endings and the engine-exported sound schedule. The source only told authors to add a landing time in `sfx_steps.py`; the imported helper instead reads shared timing from `FOLD_INFO`. Name whether the new cue accents a contact or completed stroke. Existing authored landing accents precede the extra strokes' completion; they are not completion-time measurements. [word-fold, references/endings.md; scripts/init_word.py and sfx_steps.py; assets/kit/fold.js]
- Step through the landing at 60 fps (`capture.mjs` at `t + i/60`) and fix any frame with a blob, a chop or a pop before you hand it over.

## Prove it

[word-fold, references/endings.md]

The ending has explicit geometry and supported-ending registration, its pieces clip flush with the actual legs, and the landing has been inspected frame by frame. Regenerate SFX after changing timing and verify the declared contact/accent relationship. Unsupported endings must not silently render as a stem.
