# Contrast

Measuring a foreground against the background it actually renders on, the WCAG 2 and APCA thresholds a measured pair is reported against, APCA's sign, and fixing a failing pair through lightness without breaking the palette or the gamut. Sources: Jakub Krehel's better-colors and oklch-skill, each tagged, checked against [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html) and [APCA-W3](https://github.com/Myndex/apca-w3); numbers marked "computed" were checked with an OKLab, WCAG 2 and APCA 0.0.98G implementation.

## Measure the rendered pair

[Jakub Krehel, better-colors] Contrast is measured between a foreground (text, an icon or a UI element) and "the background color it actually renders against, usually the nearest ancestor that paints one. Identify that background first. Measuring against the page background when the element sits on a card gives the wrong answer."

- "Never report a contrast value you did not measure, and never estimate a color you could compute."
- Which requirement applies to a pair is an accessibility decision ([web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md)). "Where neither that skill nor the project names a standard, report the WCAG 2 result and add the APCA value."
- **Two views on the default metric.** oklch-skill: "Use APCA as the default", with WCAG 2 "still required when making formal WCAG 2.x conformance claims" [Jakub Krehel, oklch-skill]. anti-slop-ui makes WCAG 2 the absolute rule ("text at least 4.5:1 ... Compute it, never eyeball it", [anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md)), and better-colors reports WCAG 2 first. VisBug shows both and finds "moments where they disagree" ([modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#contrast-scores-apca-and-l)).

For hex pairs, use [scripts/contrast.py](scripts/contrast.py): `python3 <color-system>/scripts/contrast.py "#777777" "#ffffff"`. Several colors after the first check each against it; verdicts compare the unrounded ratio. [contrast.py](scripts/contrast.py), moved from anti-slop-ui's contrast helper.

## WCAG 2 thresholds

[Jakub Krehel, better-colors] "WCAG 2 is the standard formal conformance claims are made against."

| Content type | AA | AAA |
| --- | --- | --- |
| Text | 4.5:1 | 7:1 |
| Large text, at least `24px` or `18.67px` bold | 3:1 | 4.5:1 |
| UI components and graphical objects | 3:1 | n/a |

- **Large text is defined in points:** "at least 18 point or 14 point bold" ([WCAG 2.2](https://www.w3.org/TR/WCAG22/#dfn-large-scale)), which W3C's Understanding page gives as "approximately 18.5px and 24px". oklch-skill's table writes "<18px / <14px bold", which is wrong: those are point sizes.
- **Ratios are not rounded:** "4.499:1 would not meet the 4.5:1 threshold" ([W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Compare the unrounded ratio, even when you print two decimals.
- "Disabled or inactive controls and logos are exempt." [Jakub Krehel, better-colors]

## APCA thresholds

Lc, Lightness Contrast, is APCA's measure of perceived contrast. These are APCA's own levels from [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html), which better-colors' table follows except where noted below:

| Content type | Minimum |
| --- | --- |
| Body text, columns or blocks of text (18px/400, 16px/500, 14px/700) | Lc 75, preferred Lc 90 |
| Content text that is not body text, such as labels and headlines (24px/400 or 16px/700) | Lc 60; "To use these sizes as body text, add Lc 15" |
| Larger, heavier text, at least `36px` regular or `24px` bold | Lc 45 |
| Fine-detail or outline icons | Lc 45 |
| Any text not listed above, including placeholder and disabled text; "mostly solid" icons or pictograms | Lc 30, "the absolute minimum" |
| Non-text that only has to be discernible, such as dividers | Lc 15 |

- **Placeholder and disabled text have a minimum.** better-colors says they "are not covered by a requirement. Aim for Lc 30". APCA in a Nutshell lists Lc 30 as "the absolute minimum for any text not listed above", which "includes placeholder text and disabled element text", so in APCA it is a stated floor, not an aim. (WCAG 2 does exempt disabled controls.)
- **Solid icons, not UI components.** better-colors' Lc 30 row reads "Solid icons and UI components"; APCA in a Nutshell names "large/solid semantic & understandable non-text elements such as “mostly solid” icons or pictograms" and does not mention UI components.
- **Lc 60 is not a body-text pass.** oklch-skill's table ("Normal text Lc 60 pass / 75 pass+", Large 45/60, UI 30) calls itself "conservative approximations", but APCA puts body text at Lc 75 minimum and Lc 60 only for non-body text. Use the table above.

### The sign of Lc

Lc is signed: **positive means dark text on a light background, negative means light text on a dark background.** APCA-W3 marks the negative sign as white on black: with `places = 0`, "instead of a minus sign for polarity, 'WoB' for white on black is returned" ([github.com/Myndex/apca-w3](https://github.com/Myndex/apca-w3)). Compare the absolute value against the threshold. better-colors has this right; oklch-skill reverses it ("positive means light text on dark background").

APCA is asymmetric: `#2b3a4f` on `#eef2f7` is Lc +88.5, and the mirrored pair is Lc -91.4 (computed). So a pair that passes in one appearance has to be measured again in the other.

## Fix a failing pair only on request

[Jakub Krehel, better-colors] "When a pair fails, report the pair, its measured value and the threshold it misses, then leave the colors alone. They are a design decision. Change them only when asked, and remeasure after."

**Change lightness first.** "It is the channel contrast responds to. Hue and saturation move the measured value far less." Move the foreground away from the background in perceived lightness, holding hue and saturation, then remeasure. "Keeping hue fixed is what stops a contrast fix becoming a palette change."

```css
/* Failing: text too close to its background in lightness (Lc ≈ 50) */
color: #7d93b0;
background: #eef2f7;

/* Fixed: darker text, same hue (Lc ≈ 88) */
color: #2b3a4f;
background: #eef2f7;
```

Computed: Lc 50.5 before, Lc 88.5 after.

[Jakub Krehel, oklch-skill] The same move in OKLCH: "In hex/rgb, fixing contrast means trial and error across three channels. In oklch, contrast is controlled by lightness (L) alone." The skill's fix, `oklch(0.35 0.2 250)`, is outside sRGB (the maximum at L 0.35, H 250 is 0.099, computed), so the browser has to gamut-map it. Lower C to the gamut maximum after moving L:

```css
/* Failing: text too close in lightness to its background */
color: oklch(0.65 0.2 250);       /* foreground */
background: oklch(0.75 0.05 250); /* background */

/* Fix: darken the text, keep H, bring C back inside sRGB */
color: oklch(0.35 0.099 250);     /* foreground - more L distance */
background: oklch(0.75 0.05 250); /* background - unchanged */
```

Computed: 1.46:1 before, 5.11:1 after.

- **Chroma moves contrast a little, not zero.** oklch-skill says "Chroma has negligible effect on contrast, always adjust L, never C." At L 0.6, WCAG luminance is 0.216 at C 0 and between 0.197 (H 25, C 0.15) and 0.221 (H 110, C 0.12), about a 10% shift (computed), so always remeasure.
- **Mid-lightness backgrounds cap what is achievable.** "On a background near OKLCH `L` `0.75`, even pure black text reaches only about Lc 60" (computed 60.2). "Body text needs a background near one extreme, so a mid-range background is the thing that has to change." [Jakub Krehel, better-colors]
- **Pushing lightness can push the color out of gamut.** Reduce saturation as needed to keep it renderable ([DARK-MODE-AND-GAMUT.md](DARK-MODE-AND-GAMUT.md#gamut-clamp)). [Jakub Krehel, better-colors]
- "Always remeasure after changing a value. Do not assume a fix landed." [Jakub Krehel, better-colors]

### Lightness gap guide

[Jakub Krehel, oklch-skill] "These are approximations, always verify with an actual contrast calculation."

- **Light background (L > 0.85):** foreground L should be below 0.45 (neutrals at those bounds: 4.71:1, computed).
- **Dark background (L < 0.25):** foreground L should be above 0.75 (neutrals: 7.19:1, computed).

## Pick text polarity from the background

[Jakub Krehel, better-colors] "Compare black and white using the project's required contrast metric. APCA and WCAG 2 can favor different text colors on the same background. A higher score does not by itself mean the pair passes."

- "WCAG 2's neutral crossover is near 56% OKLCH lightness" (computed 0.564). "At `oklch(65% 0 0)`, black measures about `6.49:1` and white `3.23:1`. Only black passes AA for normal text. For colored backgrounds or other foregrounds, measure the actual pair rather than applying a crossover."
- oklch-skill's shortcut: "if L > 0.6 → use dark text on this background; if L <= 0.6 → use light text" [Jakub Krehel, oklch-skill]. A neutral at L 0.6 gives 3.95:1 against white and 5.32:1 against black (computed), and the WCAG crossover sits lower, near 0.564, so measure rather than branch on L.
- `contrast-color()` picks white or black in CSS, and "mid-tone backgrounds often contrast poorly with both" ([modern-css COLOR.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/COLOR.md#contrast-color)).

## What to check

[Jakub Krehel, better-colors]

- **Every pair, in every appearance.** "APCA scores mirrored pairs differently, so a pair passing in light mode can fail in dark."
- **Translucent surfaces.** A color on a `backdrop-filter` header or an overlay "shifts with whatever scrolls behind it. Test against the lightest and darkest content it can sit over, or make the surface opaque enough that the shift cannot break the pair."
- **Computed colors.** "`color-mix()`, relative color syntax and opacity modifiers resolve at render time; measure the rendered result, not the declaration."
- **Text on a color with alpha** (`/50`, `rgba(`, `color-mix(` with `transparent`): "Measure the rendered result, or use a solid token." Owner's design: app-ui sets quieter text as alpha tokens (`--muted-foreground: rgb(var(--ink) / 0.5)`, [app-ui TOKENS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/TOKENS.md)); keep them and measure the rendered result.
- **Text over images.** "There is no single background color. Measure the worst region, or guarantee one with a scrim."

## Prove it

- Every reported value was measured against the nearest painted ancestor, in both appearances, with unrounded ratios compared to the threshold.
- Each pair lists its WCAG 2 ratio, and its APCA Lc with the sign that matches its polarity (positive for dark on light).
- Body text reaches 4.5:1 and Lc 75; placeholder and disabled text reach at least Lc 30.
- Every fix moved lightness, kept the hue, and the new value is inside sRGB at its L and H; the pair was remeasured after.
- Translucent surfaces were measured over the lightest and darkest content behind them, and text over images at its worst region.
