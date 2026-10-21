# Animista preset catalog

An exact-name lookup from Ana Travas's [Animista player data](https://animista.net/animista.json), version `1.1.0`, embedded date `2019-10-30`. The supplied `animista-play-catalog.md` snapshot was fetched 2026-10-20; the supplied JSON matched the live file byte for byte on 2026-10-21. These are 662 presets in 75 groups across six categories, not 662 implementations included in this skill. [Animista, animista.json; animista-play-catalog.md]

**Contents:** [Use the catalog](#use-the-catalog) · [Caveats](#caveats) · [Basic](#basic) · [Entrances](#entrances) · [Exits](#exits) · [Text](#text) · [Attention](#attention) · [Background](#background) · [Prove it](#prove-it)

## Use the catalog

[Animista, animista.json; https://animista.net/play/basic/scale-up]

Apply the [motion gate](SKILL.md#before-you-build) first. For a named preset, open its group's Preview link, choose the exact variation, adjust settings and save selected favourites, then copy or download the generated CSS. The official playground supports previewing and tweaking before export. These data contain no keyframes; obtain the generated CSS rather than reconstructing an effect from its name. General effect names stay in [VOCABULARY.md](VOCABULARY.md).

For every preset, start with these shared Animista values: delay `0`; fillMode `both`; iterationCount `1`; direction `normal`. Add its group Defaults, then replace only fields stated on the preset's row. Values on rows are exceptions, not extra presets. Optional fields absent from both group and row remain absent. `useObject` is the source preview selector; `is3d` and `perspective` retain source flags, not CSS declarations. [Animista, animista.json]

## Caveats

- [Animista, animista.json; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-duration] Durations below are raw numbers. Only 19 presets explicitly record durationUnit `s`; 643 omit it. CSS time values require `s` or `ms`. The source omitted those units; do not turn its raw numbers into unitless CSS or assume the missing unit.
- [Animista, animista.json; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function] Easing values such as `easeOutSine` and `easeInQuad` are player identifiers. CSS uses keywords such as `ease-out` and easing functions; obtain the actual generated CSS without inventing a curve mapping. The source records identifiers, not their CSS definitions.
- [Animista, animista.json; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-fill-mode] `both` is this catalog's fillMode, not the browser's initial value, `none`. The source uses `both` for every preset.
- [Animista, animista.json; ui-animation, SKILL.md rule 4] Keep both views: this skill says "Exits are faster than entrances"; Animista records bounce-in `1.1` versus bounce-out `1.5`, and puff-in `0.7` versus puff-out `0.9` or `1` (raw numbers). These are preview alternatives; retain the existing [timing policy and source disagreements](TIMING.md), product tokens and [performance/reduced-motion checks](PERFORMANCE.md). Infinite repeats do not waive the motion gate or pause controls.
- [Animista, animista.json; https://animista.net/play/basic/scale-up] There are 75 empty browserSupport objects and 75 empty notes lists; neither supplies support evidence. The flags supply no perspective distance or proof of actual 3D behavior. Animista warns some animations are experimental and prefixing does not ensure older-browser support. Group links below are lookup links, not an assertion that variations lack their own URLs; the supplied Markdown asserted that without routing evidence.
- [https://animista.net/license] Generated CSS is offered for personal and commercial use under FreeBSD, with copyright, conditions and disclaimer retention requirements. This statement applies to generated CSS, not a blanket licence for the JSON or site source.

## Basic

[Animista, animista.json categories.basic]

18 groups, 218 presets.

### scale-up

[Preview](https://animista.net/play/basic/scale-up) · 15

Defaults: useObject `#box-object`; duration `0.4`; easing `easeOutSine`.

- `scale-up-center`
- `scale-up-top`
- `scale-up-tr`
- `scale-up-right`
- `scale-up-br`
- `scale-up-bottom`
- `scale-up-bl`
- `scale-up-left`
- `scale-up-tl`
- `scale-up-hor-center`
- `scale-up-hor-left`
- `scale-up-hor-right`
- `scale-up-ver-center`
- `scale-up-ver-top`
- `scale-up-ver-bottom`

### scale-down

[Preview](https://animista.net/play/basic/scale-down) · 15

Defaults: useObject `#box-object`; duration `0.4`; easing `easeOutQuad`.

- `scale-down-center`
- `scale-down-top`
- `scale-down-tr`
- `scale-down-right`
- `scale-down-br`
- `scale-down-bottom`
- `scale-down-bl`
- `scale-down-left`
- `scale-down-tl`
- `scale-down-hor-center`
- `scale-down-hor-left`
- `scale-down-hor-right`
- `scale-down-ver-center`
- `scale-down-ver-top`
- `scale-down-ver-bottom`

### rotate

[Preview](https://animista.net/play/basic/rotate) · 21

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `easeInOutQuad`.

- `rotate-center`: is3d `false`; duration `0.6`; easing `easeInOut`
- `rotate-top`
- `rotate-tr`
- `rotate-right`
- `rotate-br`
- `rotate-bottom`
- `rotate-bl`
- `rotate-left`
- `rotate-tl`
- `rotate-hor-center`
- `rotate-hor-top`: easing `easeInOutCubic`
- `rotate-hor-bottom`: easing `easeInOutCubic`
- `rotate-vert-center`: useObject `#card-object-vf`
- `rotate-vert-left`: useObject `#card-object-vf`; easing `easeInOutCubic`
- `rotate-vert-right`: useObject `#card-object-vf`; easing `easeInOutCubic`
- `rotate-diagonal-1`: useObject `#card-object-df1`; duration `0.4`; easing `linear`
- `rotate-diagonal-2`: useObject `#card-object-df2`; duration `0.4`; easing `linear`
- `rotate-diagonal-tr`: useObject `#card-object-df1`; duration `0.4`; easing `linear`
- `rotate-diagonal-br`: useObject `#card-object-df2`; duration `0.4`; easing `linear`
- `rotate-diagonal-bl`: useObject `#card-object-df1`; duration `0.4`; easing `linear`
- `rotate-diagonal-tl`: useObject `#card-object-df2`; duration `0.4`; easing `linear`

### rotate-scale

[Preview](https://animista.net/play/basic/rotate-scale) · 10

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.65`; easing `linear`.

- `rotate-scale-up`
- `rotate-scale-down`
- `rotate-scale-up-hor`
- `rotate-scale-down-hor`
- `rotate-scale-up-ver`: useObject `#card-object-vf`
- `rotate-scale-down-ver`: useObject `#card-object-vf`
- `rotate-scale-up-diag-1`: useObject `#card-object-df1`; duration `0.7`
- `rotate-scale-down-diag-1`: useObject `#card-object-df1`; duration `0.7`
- `rotate-scale-up-diag-2`: useObject `#card-object-df2`; duration `0.7`
- `rotate-scale-down-diag-2`: useObject `#card-object-df2`; duration `0.7`

### rotate-90

[Preview](https://animista.net/play/basic/rotate-90) · 22

Defaults: useObject `#card-object-hf`; duration `0.4`; easing `easeOutQuad`.

- `rotate-90-cw`: durationUnit `s`
- `rotate-90-ccw`: durationUnit `s`
- `rotate-90-top-cw`: durationUnit `s`
- `rotate-90-top-ccw`: durationUnit `s`
- `rotate-90-tr-cw`: durationUnit `s`
- `rotate-90-tr-ccw`: durationUnit `s`
- `rotate-90-right-cw`: durationUnit `s`
- `rotate-90-right-ccw`: durationUnit `s`
- `rotate-90-br-cw`: durationUnit `s`
- `rotate-90-br-ccw`: durationUnit `s`
- `rotate-90-bottom-cw`: durationUnit `s`
- `rotate-90-bottom-ccw`: durationUnit `s`
- `rotate-90-bl-cw`: durationUnit `s`
- `rotate-90-bl-ccw`: durationUnit `s`
- `rotate-90-left-cw`: durationUnit `s`
- `rotate-90-left-ccw`: durationUnit `s`
- `rotate-90-tl-cw`: durationUnit `s`
- `rotate-90-tl-ccw`: durationUnit `s`
- `rotate-90-horizontal-fwd`: useObject `#cube-object`; is3d `true`
- `rotate-90-horizontal-bck`: useObject `#cube-object`; is3d `true`
- `rotate-90-vertical-fwd`: useObject `#cube-object`; is3d `true`
- `rotate-90-vertical-bck`: useObject `#cube-object`; is3d `true`

### flip

[Preview](https://animista.net/play/basic/flip) · 16

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.4`; easing `easeInOutQuad`.

- `flip-horizontal-bottom`
- `flip-horizontal-top`
- `flip-horizontal-bck`
- `flip-horizontal-fwd`
- `flip-vertical-right`: useObject `#card-object-vf`
- `flip-vertical-left`: useObject `#card-object-vf`
- `flip-vertical-bck`: useObject `#card-object-vf`
- `flip-vertical-fwd`: useObject `#card-object-vf`
- `flip-diagonal-1-tr`: useObject `#card-object-df1`
- `flip-diagonal-1-bl`: useObject `#card-object-df1`
- `flip-diagonal-1-bck`: useObject `#card-object-df1`
- `flip-diagonal-1-fwd`: useObject `#card-object-df1`
- `flip-diagonal-2-br`: useObject `#card-object-df2`
- `flip-diagonal-2-tl`: useObject `#card-object-df2`
- `flip-diagonal-2-bck`: useObject `#card-object-df2`
- `flip-diagonal-2-fwd`: useObject `#card-object-df2`

### flip-2

[Preview](https://animista.net/play/basic/flip-2) · 16

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `easeInOutQuad`.

- `flip-2-hor-top-1`
- `flip-2-hor-top-2`
- `flip-2-hor-top-bck`
- `flip-2-hor-top-fwd`
- `flip-2-ver-right-1`: useObject `#card-object-vf`
- `flip-2-ver-right-2`: useObject `#card-object-vf`
- `flip-2-ver-right-bck`: useObject `#card-object-vf`
- `flip-2-ver-right-fwd`: useObject `#card-object-vf`
- `flip-2-hor-bottom-1`
- `flip-2-hor-bottom-2`
- `flip-2-hor-bottom-bck`
- `flip-2-hor-bottom-fwd`
- `flip-2-ver-left-1`: useObject `#card-object-vf`
- `flip-2-ver-left-2`: useObject `#card-object-vf`
- `flip-2-ver-left-bck`: useObject `#card-object-vf`
- `flip-2-ver-left-fwd`: useObject `#card-object-vf`

### flip-scale

[Preview](https://animista.net/play/basic/flip-scale) · 8

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `linear`.

- `flip-scale-up-hor`
- `flip-scale-down-hor`
- `flip-scale-up-ver`: useObject `#card-object-vf`
- `flip-scale-down-ver`: useObject `#card-object-vf`
- `flip-scale-up-diag-1`: useObject `#card-object-df1`
- `flip-scale-down-diag-1`: useObject `#card-object-df1`
- `flip-scale-up-diag-2`: useObject `#card-object-df2`
- `flip-scale-down-diag-2`: useObject `#card-object-df2`

### flip-scale-2

[Preview](https://animista.net/play/basic/flip-scale-2) · 4

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `linear`.

- `flip-scale-2-hor-top`
- `flip-scale-2-ver-right`: useObject `#card-object-vf`
- `flip-scale-2-hor-bottom`
- `flip-scale-2-ver-left`: useObject `#card-object-vf`

### swing

[Preview](https://animista.net/play/basic/swing) · 16

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.4`; easing `easeOutQuad`.

- `swing-top-fwd`
- `swing-top-bck`
- `swing-top-right-fwd`: useObject `#card-object-df1`
- `swing-top-right-bck`: useObject `#card-object-df1`
- `swing-right-fwd`: useObject `#card-object-vf`
- `swing-right-bck`: useObject `#card-object-vf`
- `swing-bottom-right-fwd`: useObject `#card-object-df2`
- `swing-bottom-right-bck`: useObject `#card-object-df2`
- `swing-bottom-fwd`
- `swing-bottom-bck`
- `swing-bottom-left-fwd`: useObject `#card-object-df1`
- `swing-bottom-left-bck`: useObject `#card-object-df1`
- `swing-left-fwd`: useObject `#card-object-vf`
- `swing-left-bck`: useObject `#card-object-vf`
- `swing-top-left-fwd`: useObject `#card-object-df2`
- `swing-top-left-bck`: useObject `#card-object-df2`

### slide

[Preview](https://animista.net/play/basic/slide) · 8

Defaults: useObject `#card-object-hf`; duration `0.5`; easing `easeOutQuad`.

- `slide-top`
- `slide-tr`
- `slide-right`
- `slide-br`
- `slide-bottom`
- `slide-bl`
- `slide-left`
- `slide-tl`

### slide-bck

[Preview](https://animista.net/play/basic/slide-bck) · 9

Defaults: useObject `#card-object-hf`; duration `0.45`; easing `easeInSine`.

- `slide-bck-center`
- `slide-bck-top`
- `slide-bck-tr`
- `slide-bck-right`
- `slide-bck-br`
- `slide-bck-bottom`
- `slide-bck-bl`
- `slide-bck-left`
- `slide-bck-tl`

### slide-fwd

[Preview](https://animista.net/play/basic/slide-fwd) · 9

Defaults: useObject `#card-object-hf`; duration `0.45`; easing `easeOutQuad`.

- `slide-fwd-center`
- `slide-fwd-top`
- `slide-fwd-tr`
- `slide-fwd-right`
- `slide-fwd-br`
- `slide-fwd-bottom`
- `slide-fwd-bl`
- `slide-fwd-left`
- `slide-fwd-tl`

### slide-rotate

[Preview](https://animista.net/play/basic/slide-rotate) · 12

Defaults: useObject `#card-object-hf`; duration `0.5`; easing `easeInOutQuad`.

- `slide-rotate-hor-top`: easing `easeOutQuad`
- `slide-rotate-hor-t-bck`
- `slide-rotate-hor-t-fwd`
- `slide-rotate-ver-right`: easing `easeOutQuad`
- `slide-rotate-ver-r-bck`
- `slide-rotate-ver-r-fwd`
- `slide-rotate-hor-bottom`: easing `easeOutQuad`
- `slide-rotate-hor-b-bck`
- `slide-rotate-hor-b-fwd`
- `slide-rotate-ver-left`: easing `easeOutQuad`
- `slide-rotate-ver-l-bck`
- `slide-rotate-ver-l-fwd`

### shadow-drop

[Preview](https://animista.net/play/basic/shadow-drop) · 11

Defaults: useObject `#box-object-light`; is3d `true`; duration `0.4`; easing `easeOutQuad`.

- `shadow-drop-center`
- `shadow-drop-top`
- `shadow-drop-right`
- `shadow-drop-bottom`
- `shadow-drop-left`
- `shadow-drop-lr`
- `shadow-drop-tb`
- `shadow-drop-tr`
- `shadow-drop-br`
- `shadow-drop-bl`
- `shadow-drop-tl`

### shadow-drop-2

[Preview](https://animista.net/play/basic/shadow-drop-2) · 11

Defaults: useObject `#box-object-light`; is3d `true`; duration `0.4`; easing `easeOutQuad`.

- `shadow-drop-2-center`
- `shadow-drop-2-top`
- `shadow-drop-2-right`
- `shadow-drop-2-bottom`
- `shadow-drop-2-left`
- `shadow-drop-2-lr`
- `shadow-drop-2-tb`
- `shadow-drop-2-tr`
- `shadow-drop-2-br`
- `shadow-drop-2-bl`
- `shadow-drop-2-tl`

### shadow-pop

[Preview](https://animista.net/play/basic/shadow-pop) · 4

Defaults: useObject `#box-object-light`; is3d `true`; duration `0.3`; easing `easeInSine`.

- `shadow-pop-tr`
- `shadow-pop-br`
- `shadow-pop-bl`
- `shadow-pop-tl`

### shadow-inset

[Preview](https://animista.net/play/basic/shadow-inset) · 11

Defaults: useObject `#box-object-light`; is3d `true`; duration `0.4`; easing `easeOutQuad`.

- `shadow-inset-center`
- `shadow-inset-top`
- `shadow-inset-right`
- `shadow-inset-bottom`
- `shadow-inset-left`
- `shadow-inset-lr`
- `shadow-inset-tb`
- `shadow-inset-tr`
- `shadow-inset-br`
- `shadow-inset-bl`
- `shadow-inset-tl`

## Entrances

[Animista, animista.json categories.entrances]

20 groups, 176 presets.

### scale-in

[Preview](https://animista.net/play/entrances/scale-in) · 15

Defaults: useObject `#box-object`; duration `0.5`; easing `easeOutQuad`.

- `scale-in-center`
- `scale-in-top`
- `scale-in-tr`
- `scale-in-right`
- `scale-in-br`
- `scale-in-bottom`
- `scale-in-bl`
- `scale-in-left`
- `scale-in-tl`
- `scale-in-hor-center`
- `scale-in-hor-left`
- `scale-in-hor-right`
- `scale-in-ver-center`
- `scale-in-ver-top`
- `scale-in-ver-bottom`

### rotate-in

[Preview](https://animista.net/play/entrances/rotate-in) · 13

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `easeOutQuad`.

- `rotate-in-center`: duration `0.6`
- `rotate-in-top`
- `rotate-in-tr`
- `rotate-in-right`
- `rotate-in-br`
- `rotate-in-bottom`
- `rotate-in-bl`
- `rotate-in-left`
- `rotate-in-tl`
- `rotate-in-hor`: useObject `#box-object`; perspective `true`
- `rotate-in-ver`: useObject `#box-object`; perspective `true`
- `rotate-in-diag-1`: useObject `#box-object`; perspective `true`
- `rotate-in-diag-2`: useObject `#box-object`; perspective `true`

### rotate-in-2

[Preview](https://animista.net/play/entrances/rotate-in-2) · 14

Defaults: useObject `#image-object`; duration `0.5`; easing `easeOutQuad`.

- `rotate-in-2-cw`
- `rotate-in-2-ccw`
- `rotate-in-2-fwd-cw`
- `rotate-in-2-fwd-ccw`
- `rotate-in-2-bck-cw`
- `rotate-in-2-bck-ccw`
- `rotate-in-2-tr-cw`
- `rotate-in-2-tr-ccw`
- `rotate-in-2-br-cw`
- `rotate-in-2-br-ccw`
- `rotate-in-2-bl-cw`
- `rotate-in-2-bl-ccw`
- `rotate-in-2-tl-cw`
- `rotate-in-2-tl-ccw`

### swirl-in

[Preview](https://animista.net/play/entrances/swirl-in) · 18

Defaults: useObject `#card-object-hf`; duration `0.6`; easing `easeOut`.

- `swirl-in-fwd`: is3d `false`
- `swirl-in-bck`: is3d `false`; duration `0.65`
- `swirl-in-top-fwd`
- `swirl-in-top-bck`: duration `0.65`
- `swirl-in-tr-fwd`
- `swirl-in-tr-bck`: duration `0.65`
- `swirl-in-right-fwd`
- `swirl-in-right-bck`: duration `0.65`
- `swirl-in-br-fwd`
- `swirl-in-br-bck`: duration `0.65`
- `swirl-in-bottom-fwd`
- `swirl-in-bottom-bck`: duration `0.65`
- `swirl-in-bl-fwd`
- `swirl-in-bl-bck`: duration `0.65`
- `swirl-in-left-fwd`
- `swirl-in-left-bck`: duration `0.65`
- `swirl-in-tl-fwd`
- `swirl-in-tl-bck`: duration `0.65`

### flip-in

[Preview](https://animista.net/play/entrances/flip-in) · 8

Defaults: useObject `#image-object`; duration `0.5`; easing `easeOutQuad`.

- `flip-in-hor-bottom`
- `flip-in-hor-top`
- `flip-in-ver-right`
- `flip-in-ver-left`
- `flip-in-diag-1-tr`
- `flip-in-diag-1-bl`
- `flip-in-diag-2-tl`
- `flip-in-diag-2-br`

### slit-in

[Preview](https://animista.net/play/entrances/slit-in) · 4

Defaults: useObject `#image-object`; is3d `true`; perspective `true`; duration `0.45`; easing `easeOut`.

- `slit-in-vertical`
- `slit-in-horizontal`
- `slit-in-diagonal-1`
- `slit-in-diagonal-2`

### slide-in

[Preview](https://animista.net/play/entrances/slide-in) · 8

Defaults: useObject `#box-object`; is3d `true`; duration `0.5`; easing `easeOutQuad`.

- `slide-in-top`
- `slide-in-tr`
- `slide-in-right`
- `slide-in-br`
- `slide-in-bottom`
- `slide-in-bl`
- `slide-in-left`
- `slide-in-tl`

### slide-in-fwd

[Preview](https://animista.net/play/entrances/slide-in-fwd) · 9

Defaults: useObject `#box-object`; perspective `true`; duration `0.4`; easing `easeOutQuad`.

- `slide-in-fwd-center`
- `slide-in-fwd-top`
- `slide-in-fwd-tr`
- `slide-in-fwd-right`
- `slide-in-fwd-br`
- `slide-in-fwd-bottom`
- `slide-in-fwd-bl`
- `slide-in-fwd-left`
- `slide-in-fwd-tl`

### slide-in-bck

[Preview](https://animista.net/play/entrances/slide-in-bck) · 9

Defaults: useObject `#box-object`; perspective `true`; duration `0.6`; easing `easeOutQuad`.

- `slide-in-bck-center`: duration `0.7`
- `slide-in-bck-top`
- `slide-in-bck-tr`
- `slide-in-bck-right`
- `slide-in-bck-br`
- `slide-in-bck-bottom`
- `slide-in-bck-bl`
- `slide-in-bck-left`
- `slide-in-bck-tl`

### slide-in-blurred

[Preview](https://animista.net/play/entrances/slide-in-blurred) · 8

Defaults: useObject `#circle-object`; is3d `true`; duration `0.6`; easing `easeOutQuint`.

- `slide-in-blurred-top`
- `slide-in-blurred-tr`
- `slide-in-blurred-right`
- `slide-in-blurred-br`
- `slide-in-blurred-bottom`
- `slide-in-blurred-bl`
- `slide-in-blurred-left`
- `slide-in-blurred-tl`

### slide-in-elliptic

[Preview](https://animista.net/play/entrances/slide-in-elliptic) · 8

Defaults: useObject `#box-object`; is3d `true`; perspective `true`; duration `0.7`; easing `easeOutQuad`.

- `slide-in-elliptic-top-fwd`
- `slide-in-elliptic-top-bck`
- `slide-in-elliptic-right-fwd`
- `slide-in-elliptic-right-bck`
- `slide-in-elliptic-bottom-fwd`
- `slide-in-elliptic-bottom-bck`
- `slide-in-elliptic-left-fwd`
- `slide-in-elliptic-left-bck`

### bounce-in

[Preview](https://animista.net/play/entrances/bounce-in) · 6

Defaults: useObject `#circle-object`; is3d `true`; duration `1.1`; easing `ease`.

- `bounce-in-top`
- `bounce-in-right`
- `bounce-in-bottom`
- `bounce-in-left`
- `bounce-in-fwd`
- `bounce-in-bck`

### roll-in

[Preview](https://animista.net/play/entrances/roll-in) · 4

Defaults: useObject `#card-object-hf`; duration `0.6`; easing `easeOut`.

- `roll-in-left`
- `roll-in-top`: useObject `#card-object-vf`
- `roll-in-right`
- `roll-in-bottom`: useObject `#card-object-vf`

### roll-in-blurred

[Preview](https://animista.net/play/entrances/roll-in-blurred) · 4

Defaults: useObject `#card-object-hf`; duration `0.65`; easing `easeOutQuint`.

- `roll-in-blurred-left`
- `roll-in-blurred-top`: useObject `#card-object-vf`; duration `0.6`
- `roll-in-blurred-right`
- `roll-in-blurred-bottom`: useObject `#card-object-vf`; duration `0.6`

### tilt-in

[Preview](https://animista.net/play/entrances/tilt-in) · 12

Defaults: useObject `#image-object`; duration `0.6`; easing `easeOutQuad`.

- `tilt-in-top-1`
- `tilt-in-top-2`
- `tilt-in-tr`: duration `0.65`
- `tilt-in-right-1`
- `tilt-in-right-2`
- `tilt-in-br`: duration `0.65`
- `tilt-in-bottom-1`
- `tilt-in-bottom-2`
- `tilt-in-bl`: duration `0.65`
- `tilt-in-left-1`
- `tilt-in-left-2`
- `tilt-in-tl`: duration `0.65`

### tilt-in-fwd

[Preview](https://animista.net/play/entrances/tilt-in-fwd) · 4

Defaults: useObject `#image-object`; duration `0.6`; easing `easeOutQuad`.

- `tilt-in-fwd-tr`
- `tilt-in-fwd-br`
- `tilt-in-fwd-bl`
- `tilt-in-fwd-tl`

### swing-in

[Preview](https://animista.net/play/entrances/swing-in) · 8

Defaults: useObject `#image-object`; is3d `true`; perspective `true`; duration `0.5`; easing `easeOutBack`.

- `swing-in-top-fwd`
- `swing-in-top-bck`: duration `0.6`
- `swing-in-right-fwd`
- `swing-in-right-bck`: duration `0.6`
- `swing-in-bottom-fwd`
- `swing-in-bottom-bck`: duration `0.6`
- `swing-in-left-fwd`
- `swing-in-left-bck`: duration `0.6`

### fade-in

[Preview](https://animista.net/play/entrances/fade-in) · 11

Defaults: useObject `#image-object`; duration `0.6`; easing `easeOutSine`.

- `fade-in`: duration `1.2`
- `fade-in-fwd`
- `fade-in-bck`
- `fade-in-top`
- `fade-in-tr`
- `fade-in-right`
- `fade-in-br`
- `fade-in-bottom`
- `fade-in-bl`
- `fade-in-left`
- `fade-in-tl`

### puff-in

[Preview](https://animista.net/play/entrances/puff-in) · 11

Defaults: useObject `#box-object`; perspective `true`; duration `0.7`; easing `easeInSine`.

- `puff-in-center`
- `puff-in-top`
- `puff-in-tr`
- `puff-in-right`
- `puff-in-br`
- `puff-in-bottom`
- `puff-in-bl`
- `puff-in-left`
- `puff-in-tl`
- `puff-in-hor`
- `puff-in-ver`

### flicker-in

[Preview](https://animista.net/play/entrances/flicker-in) · 2

Defaults: useObject `#box-object`; duration `2`; easing `linear`.

- `flicker-in-1`
- `flicker-in-2`: useObject `#box-object-light`

## Exits

[Animista, animista.json categories.exits]

18 groups, 158 presets.

### scale-out

[Preview](https://animista.net/play/exits/scale-out) · 15

Defaults: useObject `#box-object`; duration `0.5`; easing `easeInQuad`.

- `scale-out-center`: durationUnit `s`
- `scale-out-top`
- `scale-out-tr`
- `scale-out-right`
- `scale-out-br`
- `scale-out-bottom`
- `scale-out-bl`
- `scale-out-left`
- `scale-out-tl`
- `scale-out-horizontal`
- `scale-out-hor-left`
- `scale-out-hor-right`
- `scale-out-vertical`
- `scale-out-ver-top`
- `scale-out-ver-bottom`

### rotate-out

[Preview](https://animista.net/play/exits/rotate-out) · 13

Defaults: useObject `#card-object-hf`; is3d `true`; duration `0.5`; easing `easeInQuad`.

- `rotate-out-center`: duration `0.6`
- `rotate-out-top`
- `rotate-out-tr`
- `rotate-out-right`
- `rotate-out-br`
- `rotate-out-bottom`
- `rotate-out-bl`
- `rotate-out-left`
- `rotate-out-tl`
- `rotate-out-hor`: useObject `#box-object`; perspective `true`
- `rotate-out-ver`: useObject `#box-object`; perspective `true`
- `rotate-out-diag-1`: useObject `#box-object`; perspective `true`; duration `0.6`
- `rotate-out-diag-2`: useObject `#box-object`; perspective `true`; duration `0.6`

### rotate-out-2

[Preview](https://animista.net/play/exits/rotate-out-2) · 12

Defaults: useObject `#image-object`; duration `0.6`; easing `easeOutQuad`.

- `rotate-out-2-cw`
- `rotate-out-2-ccw`
- `rotate-out-2-bck`: perspective `true`
- `rotate-out-2-fwd`: perspective `true`
- `rotate-out-2-tr-cw`
- `rotate-out-2-tr-ccw`
- `rotate-out-2-br-cw`
- `rotate-out-2-br-ccw`
- `rotate-out-2-bl-cw`
- `rotate-out-2-bl-ccw`
- `rotate-out-2-tl-cw`
- `rotate-out-2-tl-ccw`

### swirl-out

[Preview](https://animista.net/play/exits/swirl-out) · 18

Defaults: useObject `#card-object-hf`; perspective `true`; duration `0.6`; easing `easeIn`.

- `swirl-out-bck`
- `swirl-out-fwd`: duration `0.65`
- `swirl-out-top-bck`
- `swirl-out-top-fwd`: duration `0.65`
- `swirl-out-tr-bck`
- `swirl-out-tr-fwd`: duration `0.65`
- `swirl-out-right-bck`
- `swirl-out-right-fwd`: duration `0.65`
- `swirl-out-br-bck`
- `swirl-out-br-fwd`: duration `0.65`
- `swirl-out-bottom-bck`
- `swirl-out-bottom-fwd`: duration `0.65`
- `swirl-out-bl-bck`
- `swirl-out-bl-fwd`: duration `0.65`
- `swirl-out-left-bck`
- `swirl-out-left-fwd`: duration `0.65`
- `swirl-out-tl-bck`
- `swirl-out-tl-fwd`: duration `0.65`

### flip-out

[Preview](https://animista.net/play/exits/flip-out) · 8

Defaults: useObject `#image-object`; perspective `true`; duration `0.45`; easing `easeInQuad`.

- `flip-out-hor-top`
- `flip-out-hor-bottom`
- `flip-out-ver-left`
- `flip-out-ver-right`
- `flip-out-diag-1-tr`
- `flip-out-diag-1-bl`
- `flip-out-diag-2-tl`
- `flip-out-diag-2-br`

### slit-out

[Preview](https://animista.net/play/exits/slit-out) · 4

Defaults: useObject `#image-object`; is3d `true`; perspective `true`; duration `0.5`; easing `easeIn`.

- `slit-out-vertical`
- `slit-out-horizontal`
- `slit-out-diagonal-1`
- `slit-out-diagonal-2`

### slide-out

[Preview](https://animista.net/play/exits/slide-out) · 8

Defaults: useObject `#box-object`; is3d `true`; duration `0.5`; easing `easeInQuad`.

- `slide-out-top`
- `slide-out-tr`
- `slide-out-right`
- `slide-out-br`
- `slide-out-bottom`
- `slide-out-bl`
- `slide-out-left`
- `slide-out-tl`

### slide-out-bck

[Preview](https://animista.net/play/exits/slide-out-bck) · 9

Defaults: useObject `#box-object`; perspective `true`; duration `0.5`; easing `easeInQuad`.

- `slide-out-bck-center`
- `slide-out-bck-top`
- `slide-out-bck-tr`
- `slide-out-bck-right`
- `slide-out-bck-br`
- `slide-out-bck-bottom`
- `slide-out-bck-bl`
- `slide-out-bck-left`
- `slide-out-bck-tl`

### slide-out-fwd

[Preview](https://animista.net/play/exits/slide-out-fwd) · 9

Defaults: useObject `#box-object`; perspective `true`; duration `0.6`; easing `easeInQuad`.

- `slide-out-fwd-center`: duration `0.7`
- `slide-out-fwd-top`
- `slide-out-fwd-tr`
- `slide-out-fwd-right`
- `slide-out-fwd-br`
- `slide-out-fwd-bottom`
- `slide-out-fwd-bl`
- `slide-out-fwd-left`
- `slide-out-fwd-tl`

### slide-out-blurred

[Preview](https://animista.net/play/exits/slide-out-blurred) · 8

Defaults: useObject `#circle-object`; is3d `true`; duration `0.45`; easing `easeInQuint`.

- `slide-out-blurred-top`
- `slide-out-blurred-tr`
- `slide-out-blurred-right`
- `slide-out-blurred-br`
- `slide-out-blurred-bottom`
- `slide-out-blurred-bl`
- `slide-out-blurred-left`
- `slide-out-blurred-tl`

### slide-out-elliptic

[Preview](https://animista.net/play/exits/slide-out-elliptic) · 8

Defaults: useObject `#box-object`; is3d `true`; perspective `true`; duration `0.7`; easing `easeIn`.

- `slide-out-elliptic-top-bck`
- `slide-out-elliptic-top-fwd`: easing `easeInQuad`
- `slide-out-elliptic-right-bck`
- `slide-out-elliptic-right-fwd`: easing `easeInQuad`
- `slide-out-elliptic-bottom-bck`
- `slide-out-elliptic-bottom-fwd`: easing `easeInQuad`
- `slide-out-elliptic-left-bck`
- `slide-out-elliptic-left-fwd`: easing `easeInQuad`

### bounce-out

[Preview](https://animista.net/play/exits/bounce-out) · 6

Defaults: useObject `#circle-object`; duration `1.5`; easing `ease`.

- `bounce-out-top`
- `bounce-out-right`
- `bounce-out-bottom`
- `bounce-out-left`
- `bounce-out-bck`: is3d `true`; perspective `true`
- `bounce-out-fwd`: is3d `true`; perspective `true`

### roll-out

[Preview](https://animista.net/play/exits/roll-out) · 4

Defaults: useObject `#card-object-hf`; duration `0.6`; easing `easeIn`.

- `roll-out-left`
- `roll-out-top`: useObject `#card-object-vf`
- `roll-out-right`
- `roll-out-bottom`: useObject `#card-object-vf`

### roll-out-blurred

[Preview](https://animista.net/play/exits/roll-out-blurred) · 4

Defaults: useObject `#card-object-hf`; duration `0.65`; easing `easeInQuint`.

- `roll-out-blurred-left`
- `roll-out-blurred-top`: useObject `#card-object-vf`; duration `0.6`
- `roll-out-blurred-right`
- `roll-out-blurred-bottom`: useObject `#card-object-vf`; duration `0.6`

### swing-out

[Preview](https://animista.net/play/exits/swing-out) · 8

Defaults: useObject `#image-object`; is3d `true`; perspective `true`; duration `0.45`; easing `easeInBack`.

- `swing-out-top-bck`
- `swing-out-top-fwd`: duration `0.55`
- `swing-out-right-bck`
- `swing-out-right-fwd`: duration `0.55`
- `swing-out-bottom-bck`
- `swing-out-bottom-fwd`: duration `0.55`
- `swing-out-left-bck`
- `swing-out-left-fwd`: duration `0.55`

### fade-out

[Preview](https://animista.net/play/exits/fade-out) · 11

Defaults: useObject `#image-object`; duration `0.7`; easing `easeOutQuad`.

- `fade-out`: duration `1`; easing `easeOut`
- `fade-out-bck`: perspective `true`
- `fade-out-fwd`: perspective `true`
- `fade-out-top`
- `fade-out-tr`
- `fade-out-right`
- `fade-out-br`
- `fade-out-bottom`
- `fade-out-bl`
- `fade-out-left`
- `fade-out-tl`

### puff-out

[Preview](https://animista.net/play/exits/puff-out) · 11

Defaults: useObject `#box-object`; perspective `true`; duration `0.9`; easing `easeOutQuart`.

- `puff-out-center`: duration `1`
- `puff-out-top`
- `puff-out-tr`
- `puff-out-right`
- `puff-out-br`
- `puff-out-bottom`
- `puff-out-bl`
- `puff-out-left`
- `puff-out-tl`
- `puff-out-hor`
- `puff-out-ver`

### flicker-out

[Preview](https://animista.net/play/exits/flicker-out) · 2

Defaults: useObject `#box-object`; duration `2`; easing `linear`.

- `flicker-out-1`
- `flicker-out-2`: useObject `#box-object-light`

## Text

[Animista, animista.json categories.text]

8 groups, 53 presets.

### tracking-in

[Preview](https://animista.net/play/text/tracking-in) · 8

Defaults: useObject `#text-object`; duration `0.8`; easing `easeOutCubic`.

- `tracking-in-expand`: duration `0.7`
- `tracking-in-expand-fwd`: perspective `true`
- `tracking-in-expand-fwd-top`: perspective `true`
- `tracking-in-expand-fwd-bottom`: perspective `true`
- `tracking-in-contract`
- `tracking-in-contract-bck`: perspective `true`; duration `1`
- `tracking-in-contract-bck-top`: perspective `true`; duration `1`
- `tracking-in-contract-bck-bottom`: perspective `true`; duration `1`

### tracking-out

[Preview](https://animista.net/play/text/tracking-out) · 8

Defaults: useObject `#text-object`; duration `0.8`; easing `easeInQuad`.

- `tracking-out-contract`: duration `0.7`
- `tracking-out-contract-bck`: perspective `true`
- `tracking-out-contract-bck-top`: perspective `true`
- `tracking-out-contract-bck-bottom`: perspective `true`
- `tracking-out-expand`: easing `easeOutQuad`
- `tracking-out-expand-fwd`: perspective `true`
- `tracking-out-expand-fwd-top`: perspective `true`
- `tracking-out-expand-fwd-bottom`: perspective `true`

### focus-in

[Preview](https://animista.net/play/text/focus-in) · 5

Defaults: useObject `#text-object`; duration `1`; easing `easeOutQuad`.

- `text-focus-in`: easing `easeInQuad`
- `focus-in-expand`: duration `0.8`
- `focus-in-expand-fwd`: perspective `true`; duration `0.8`
- `focus-in-contract`: duration `0.7`
- `focus-in-contract-bck`: perspective `true`

### blur-out

[Preview](https://animista.net/play/text/blur-out) · 5

Defaults: useObject `#text-object`; duration `1`; easing `easeInQuad`.

- `text-blur-out`: duration `1.2`
- `blur-out-contract`
- `blur-out-contract-bck`: perspective `true`
- `blur-out-expand`: easing `easeOutQuad`
- `blur-out-expand-fwd`: perspective `true`; easing `easeOutQuad`

### flicker

[Preview](https://animista.net/play/text/flicker) · 2

Defaults: useObject `#letter-object`; duration `4`; easing `linear`.

- `text-flicker-in-glow`
- `text-flicker-out-glow`: duration `2.5`

### shadow-drop

[Preview](https://animista.net/play/text/shadow-drop) · 9

Defaults: useObject `#letter-object`; duration `0.6`; easing `ease`.

- `text-shadow-drop-center`
- `text-shadow-drop-top`
- `text-shadow-drop-tr`
- `text-shadow-drop-right`
- `text-shadow-drop-br`
- `text-shadow-drop-bottom`
- `text-shadow-drop-bl`
- `text-shadow-drop-left`
- `text-shadow-drop-tl`

### shadow-pop

[Preview](https://animista.net/play/text/shadow-pop) · 8

Defaults: useObject `#letter-object`; duration `0.6`; easing `ease`.

- `text-shadow-pop-top`
- `text-shadow-pop-tr`
- `text-shadow-pop-right`
- `text-shadow-pop-br`
- `text-shadow-pop-bottom`
- `text-shadow-pop-bl`
- `text-shadow-pop-left`
- `text-shadow-pop-tl`

### pop-up

[Preview](https://animista.net/play/text/pop-up) · 8

Defaults: useObject `#letter-object`; duration `0.5`; easing `easeOutQuad`.

- `text-pop-up-top`
- `text-pop-up-tr`
- `text-pop-up-right`
- `text-pop-up-br`
- `text-pop-up-bottom`
- `text-pop-up-bl`
- `text-pop-up-left`
- `text-pop-up-tl`

## Attention

[Animista, animista.json categories.attention]

8 groups, 37 presets.

### vibrate

[Preview](https://animista.net/play/attention/vibrate) · 3

Defaults: useObject `#box-object-2`; duration `0.3`; easing `linear`; iterationCount `infinite`.

- `vibrate-1`
- `vibrate-2`
- `vibrate-3`: duration `0.5`

### flicker

[Preview](https://animista.net/play/attention/flicker) · 5

Defaults: useObject `#box-object`; duration `2`; easing `linear`; iterationCount `infinite`.

- `flicker-1`
- `flicker-2`
- `flicker-3`: duration `2.5`
- `flicker-4`: duration `4`
- `flicker-5`: duration `8`

### shake

[Preview](https://animista.net/play/attention/shake) · 11

Defaults: useObject `#box-object-2`; duration `0.8`; easing `easeInOutQuad`.

- `shake-horizontal`
- `shake-vertical`
- `shake-lr`: duration `0.7`
- `shake-top`
- `shake-tr`: useObject `#image-object`
- `shake-right`: duration `0.7`
- `shake-br`: useObject `#image-object`
- `shake-bottom`
- `shake-bl`: useObject `#image-object`
- `shake-left`: duration `0.7`
- `shake-tl`: useObject `#image-object`

### jello

[Preview](https://animista.net/play/attention/jello) · 4

Defaults: useObject `#box-object`; duration `0.9`; easing `ease`.

- `jello-horizontal`
- `jello-vertical`
- `jello-diagonal-1`: duration `0.8`
- `jello-diagonal-2`: duration `0.8`

### wobble

[Preview](https://animista.net/play/attention/wobble) · 4

Defaults: useObject `#box-object`; duration `0.8`; easing `ease`.

- `wobble-hor-bottom`
- `wobble-hor-top`
- `wobble-ver-left`
- `wobble-ver-right`

### bounce

[Preview](https://animista.net/play/attention/bounce) · 4

Defaults: useObject `#box-object-2`; duration `0.9`; easing `ease`.

- `bounce-top`
- `bounce-bottom`
- `bounce-left`: duration `0.8`
- `bounce-right`: duration `0.8`

### pulsate

[Preview](https://animista.net/play/attention/pulsate) · 4

Defaults: useObject `#circle-object`; duration `0.5`; easing `easeInOut`; iterationCount `infinite`.

- `heartbeat`: duration `1.5`
- `pulsate-bck`
- `pulsate-fwd`
- `ping`: duration `0.8`

### blink

[Preview](https://animista.net/play/attention/blink) · 2

Defaults: useObject `#box-object-2`; duration `0.6`; easing `ease`.

- `blink-1`
- `blink-2`: duration `0.9`

## Background

[Animista, animista.json categories.background]

3 groups, 20 presets.

### ken-burns

[Preview](https://animista.net/play/background/ken-burns) · 8

Defaults: useObject `#image-large-object`; duration `5`; easing `easeOut`.

- `kenburns-top`
- `kenburns-top-right`
- `kenburns-right`
- `kenburns-bottom-right`
- `kenburns-bottom`
- `kenburns-bottom-left`
- `kenburns-left`
- `kenburns-top-left`

### bg-pan

[Preview](https://animista.net/play/background/bg-pan) · 8

Defaults: useObject `#box-object-backgroung-image`; is3d `true`; duration `8`; easing `ease`.

- `bg-pan-left`: useObject `#box-object-gradient-hor`
- `bg-pan-right`: useObject `#box-object-gradient-hor`
- `bg-pan-top`: useObject `#box-object-gradient-ver`
- `bg-pan-bottom`: useObject `#box-object-gradient-ver`
- `bg-pan-tr`
- `bg-pan-br`
- `bg-pan-bl`
- `bg-pan-tl`

### color-change

[Preview](https://animista.net/play/background/color-change) · 4

Defaults: useObject `#box-object-flat-color`; duration `2`; easing `linear`; iterationCount `infinite`; direction `alternate`.

- `color-change-2x`
- `color-change-3x`: duration `4`
- `color-change-4x`: duration `6`
- `color-change-5x`: duration `8`

## Prove it

- [Animista, animista.json] Identify the exact category, group and variation; resolve shared values, group Defaults and row exceptions without filling absent optional fields.

- [https://animista.net/play/basic/scale-up] For implementation, supply the retrieved generated CSS and distinguish it from this parameter catalog. Report unavailable CSS or unverified preview behavior plainly.

- [ui-animation, SKILL.md; TIMING.md; PERFORMANCE.md] Apply the selected interaction's [motion review](SKILL.md#prove-it), recorded timing alternatives, product tokens, reduced-motion and performance checks.
