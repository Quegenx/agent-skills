# Measured composition diagrams

Geometric frame diagrams from the measured layout corpus; use the parent [composition rules](MEASURED-COMPOSITION.md) for coordinates, type, framing and cropping. [measured corpus, original layout.md]

## Diagrams

[measured corpus, original layout.md]

The diagrams show the *geometry of the ink*. Every empty area in them is a built ground ([video-brief MEASURED-WORLD.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/video-brief/MEASURED-WORLD.md)), not a flat swatch, and none of them has a label, counter or caption in a corner ([composition section 0](MEASURED-COMPOSITION.md#0-page-chrome-is-never-part-of-the-film-gate-g5)).

Statement frame (3-5 words, M914/M919/M941):
```
x 0      .25      .50      .75      1.0
y0 +----------------------------------------+
   |                                        |   top 40% empty
.25|                                        |
   |                                        |
.43|        .---------------------.         |   ink band
.53|        |  three to five words|  drift  |   baseline y .52-.54
.55|        '---------------------'  <--    |   x .23-.77, drifts left 1-2%/s
   |                                        |
.75|                                        |   bottom 40% empty
y1 +----------------------------------------+
```

Lockup frame (M946, M974, M920):
```
x 0      .25      .50      .75      1.0
y0 +----------------------------------------+
   |                                        |
.41|            Try it now   (CTA line)      |   x .40-.66, top y .41 (M920 only)
.50|       [icon] Wordmark                  |   icon .33-.47 | word .49-.67
.54|         ^ gap .02 W                     |   y centre .50
   |                                        |
y1 +----------------------------------------+   95% empty, glow/sweep alive
```

UI-proof frame (M913, one magnified card, camera = one group):
```
x 0      .25      .50      .75      1.0
y0 +----------------------------------------+
   |   (top 28% empty, dot grid screen-fixed)
.28|     .--------------------------------.  |
.38|     | o  row one       (.17 | .20)    |  |   rows 0.05 H, pitch .11 H
.49|     | o  row two                      |  |
.60|     | o  row three                    |  |
.72|     '--------------------------------'  |   card x .12-.88, 44% H tall
   |   (bottom 28% empty)                   |
y1 +----------------------------------------+   cursor above everything
```

Comparison frame (M936, 30:00 vs the next figure):
```
x 0      .25      .50      .75      1.0
y0 +----------------------------------------+
   |                                        |
.33|            30:00      (0.22 H em)      |   claim figure, pure black
.50|                                        |   same baseline, same height
.66|            unit label (0.067 H)         |   label fades in 0.2 s after figure lands
   |                                        |
   |  later: [6] slides left  | weeks ->    |   second figure same 0.22 H, cropped at
y1 +----------------------------------------+   right edge, never settles
```

Menu + hero (M963):
```
.50  (.27,.50) disk r .16 W               * Item A     x .70, 2.4% H
                                            Item B     bullet at x .69 fixed,
                                            Item C     list scrolls behind it
```

## Prove it

[measured corpus, original layout.md; frame-review, existing evidence workflow] Record the selected film decision and cited evidence ID, distinguish source observation from unverified helper behavior, then inspect the rendered frames and report what was actually checked. Current house gates and the owner's approved design remain authoritative.
