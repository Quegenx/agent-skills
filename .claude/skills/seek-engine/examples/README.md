# Examples

A finished film to copy instead of starting from the template's demo. Each one keeps the template's FILM, MOTION LIBRARY, LOOK, LAYOUT and API blocks unchanged and replaces only the SCENE block, and each passes every smoke counter in 16:9, 9:16 and 1:1.

| Example | What it shows |
|---|---|
| [explainer](explainer/index.html) | A product explainer: a query typed on whole frames, staggered result rows, a cursor pick, a flood seam from the click point, a number that rolls to the real sum of the rows, a split bar, a camera that follows the read, sound cues computed from the motion, layout from `U` in every format. |

```bash
cp <seek-engine>/examples/explainer/index.html .    # then rewrite the SCENE block for your film
node scripts/smoke.mjs --format 16:9                 # every counter reads 0
```

Two traps it hit on the way, kept as comments in its code: a placeholder that shows for 0.4 s is a read too short to finish, and a slow camera push over DOM text re-rasterises the glyphs in visible steps.
