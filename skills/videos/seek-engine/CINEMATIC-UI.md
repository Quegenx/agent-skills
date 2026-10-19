# Cinematic UI: oblique macro shots on dark or light stages

A launch-film look where the product's real UI is filmed like an object: very close, from a steep low angle, with a thin focal plane, a slow motivated drift and the UI acting on its own, hard cuts on the action, then one line of copy and a still logo. Choose it in the brief (video-brief STYLES, *Cinematic UI*); when chosen, its rules below override the house defaults they contradict (cursor, depth of field spent once, typing cadence, music).

[1weiho/cinematic-shot, references/look.md] Choose one stage for the film from the product's real theme: dark UI on black, or light UI on a warm ground. Preserve the product's own interface. Camera, focus, reveals and action rhythm are shared; the black-stage lighting and ending below apply to the dark branch. The light branch is specified in [Light stage](#light-stage). These are film treatments, not product UI defaults.

## Story first

Before any camera, write: the 4-7 on-screen actions in order (open a view, pick a tab, type, the answer streams in, a document writes itself, approve); the one payoff frame the film exists for; the demo content (dense and believable: a dozen plausible rows, real-looking IDs, statuses and code, never three grey placeholders); and the closing copy (the name, then five words or fewer).

## Shot rhythm

- **45-55 s, 8-10 UI shots,** then the copy and the logo.
- **Length follows the action.** Process shots (typing, streaming, a document writing itself, a long diff) take 5-9 s; punctuation shots (a tab, a button, a nav item) 2-3.5 s. Alternate them; the median sits near 5 s. Back-to-back two-second shots read as a sizzle reel.
- **Cut on the action, not a grid:** cut in with the subject already in frame or arriving, start the action within 0.3-0.8 s, hold the result 0.5-1 s, and cut while the camera is still moving. UI shots are joined by hard cuts only.
- **One idea per shot;** a short chain (type, send, the reply starts) only if the camera follows one thread.
- **Scale like an editor:** mostly macro and extreme macro, medium for the long processes, and **one wide shot, saved for the payoff**, then straight back to a close-up.
- **Flip the diagonal every cut** (the sign of the in-plane roll), so consecutive shots read as new camera positions.
- **A different surface** (a terminal, a phone) gets its own slab in the same void, reached by a hard cut.

| Scale | Magnification at the focus | For | Sharp band (share of frame height) |
|---|---|---|---|
| Extreme macro | 5-7x | one tab, button, badge | 4-8% |
| Macro | 2.5-4x | a line of typing, a few rows, a code hunk | 8-15% |
| Medium | 1.5-2.5x | a panel at work, a list streaming, a diff | 15-30% |
| Wide (payoff only) | 0.8-1.1x | the whole window, near-frontal | 50-70% |

## Camera

The UI is one plane in a perspective camera: rotate in-plane (roll ±10-20°, sign flips per shot), then yaw (±5-15°), then tilt back (pitch 30-50°), with a perspective of about 0.6-0.75 of the frame width (1100-1400 px at 1080p; 1800-2200 px and pitch 8-12°, no roll, for the wide shot). Check the result: in-focus text runs diagonally and near text is 1.4-1.8x the size of far text; if it looks like a flat screenshot, add pitch first. Crop hard: slab edges run off frame, and a quarter to half the frame is stage ground or deep bokeh.

**Each shot is one motivated move:** track along the action (3-10% of frame width; 20-35% for a long pan down a document), follow content as it grows (down with a streaming reply, along with the caret), push 1-5%, turn 0.5-4°. Linear, or an ease-out over the first third into a slow constant drift; never an ease to a stop, no shake. **Rack focus** with the attention (input to reply, title to body) over 0.4-0.8 s on an ease-in-out.

## Depth of field, light and grade

Real depth of field varies with each point's distance from the focal plane, so blur grows continuously toward both the near and the far edge of the tilted UI, not a blurred background layer. In a DOM stack: stack copies of the plane, each blurred more and masked to a band further from the focal line, with the mask running along the direction depth changes across the plane (the z row of the plane's transform). Tested in Chromium at 3x and 4.5x on a 10-row list:

```js
// A shot looks across one UI plane. Every value is a function of the shot's own params; no clocks.
export function planeTransform(s) {
  // CSS applies right to left: scale, then in-plane roll, then yaw, then the tilt back, then the drift.
  return `translate3d(${s.tx}px, ${s.ty}px, 0) rotateX(${s.pitch}deg) rotateY(${s.yaw}deg) rotateZ(${s.roll}deg) scale(${s.mag})`;
}

/** Depth of field as stacked copies of the plane, each blurred more and masked to a band further from the focal line. */
export function dofLayers(s, ui, { bands = 4, sharp = 0.06, step = 0.07, kNear = 9, kFar = 14, feather = 0.35 } = {}) {
  const m = new DOMMatrix(planeTransform(s));
  // How depth changes across the plane (UI px): the z row of the transform. The mask runs along it.
  const angle = Math.atan2(m.m13, -m.m23);                   // CSS gradient angle: 0 = to top, 90deg = to right
  const L = Math.abs(ui.w * Math.sin(angle)) + Math.abs(ui.h * Math.cos(angle));
  const along = (x, y) => L / 2 + (x - ui.w / 2) * Math.sin(angle) - (y - ui.h / 2) * Math.cos(angle);
  const f = along(s.fx, s.fy);                                // the focal line's position on the gradient
  const half = (sharp * L) / 2, w = step * L;
  const layers = [{ blur: 0, mask: band(f - half, f + half) }];
  for (let i = 0; i < bands; i++) {
    const a = half + i * w, b = half + (i + 1) * w, last = i === bands - 1;
    layers.push({ blur: kNear * (i + 1) / bands, mask: band(f + a, last ? L * 3 : f + b) });   // toward the camera
    layers.push({ blur: kFar * (i + 1) / bands, mask: band(last ? -L * 3 : f - b, f - a) });   // away from it
  }
  return layers.map((l) => ({ ...l, mask: `linear-gradient(${(angle * 180) / Math.PI}deg, ${l.mask})` }));
  function band(lo, hi) {
    const fe = feather * w;
    return `transparent ${lo - fe}px, #000 ${lo}px, #000 ${hi}px, transparent ${hi + fe}px`;
  }
}

/** The light trails its subject like a follow-spot: the mean of the subject's path over the last T seconds. */
export function laggedMean(path, t, { T = 0.4, start = 0, n = 12 } = {}) {
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const p = path(Math.max(start, t - (T * i) / (n - 1)));
    x += p.x / n; y += p.y / n;
  }
  return { x, y };
}
```

On the dark stage, build one `.plane` per layer, each a full copy of the UI with the same transform, `filter: blur(b) brightness(0.75)` on the blurred ones (out-of-focus text dims instead of glowing) and `mask-image: mask`. The bands are disjoint with feathered edges, so their order doesn't matter. Text in a scaled 3D layer can rasterise soft: if the in-focus text isn't crisp, lay the UI out at the magnification (bigger fonts and sizes) and scale down, never the other way.

**Dark-stage light is a pool on the plane, not a hole in an overlay.** A layer with the plane's own size and transform, above every depth copy, carrying two radial gradients in UI pixels: a wide soft spill ending in black (at least five stops, so it doesn't read as CSS) and a tighter core offset 8-15% toward the key. The tilt foreshortens it and the roll lays it along the text, so every shot gets its own shape. Make it longer along the action than across it. Put the key toward the far side and flip it with the roll. In about a third of the shots, cut one side with a soft straight flag (an edge 20-30% of the frame width from the subject, at least 25° off the text diagonal, riding with the pool). The pool trails the subject (`laggedMean` over 0.3-0.5 s, so the frame stays a function of time), follows a rack, grows 20-40% as content grows, and opens wide and flat for the payoff. A constant centred vignette keeps the corners black; it belongs to the lens, not the light.

**Dark-stage grade:** true black outside the UI; average frame luminance 4-10%; in-focus text about 85-90% white, secondary 45-60%; the only colour is the product's own (status icons, diff green and red, a brand button). No glows, flares, rings, sweeps or tinted light, and the UI is never restyled. Panels may get a hairline 1 px edge to separate them from the void.

**Finish:** motion blur (180° shutter, 4+ sub-frames), fine temporal grain applied after the grade, 60 fps.

## Motion inside the shot

- **No cursor.** Selection, presses and highlights happen through the controls' own states: a pill slides to the new tab (0.35 s, the label brightening), a button dips to 0.97 and shows its pressed colour, a gutter control appears and the line highlights.
- **Typing** at 12-13 characters a second for this look (slower than the house default, so it can be read in close-up), a solid caret while typing; identifiers become chips once typed. On send the composer clears and the message appears.
- **Streaming as a stipple dissolve:** each glyph pixel shows when a hash of its 2x2 px cell is under the line's eased progress (`easeOutCubic` over 0.5 s); while resolving, the dots are 10-15% brighter on the dark stage, or stronger ink on the light stage with a 1-1.5 px blur falling to 0. Lines start about 0.1 s apart, top to bottom, each before the last one finishes; icons resolve with their row.
- **Documents and diagrams build in order:** title, headings, paragraphs, rows; nodes, then connectors drawing on, then labels.
- **Appear:** opacity, 12 px rise and a 6 px blur to sharp over about 0.35 s on a strong ease-out, no overshoot. Scrolling under the drift at reading speed.
- **No impact effects:** the payoff is the wide shot and how much changes, not shake or flashes.

## Ending

Leave the last UI shot by a hard cut or a 0.4 s blur-and-dim to black. One centred line of copy on black (about 90 px at 1080p, weight 500, slightly tight tracking, near-white), un-blurring from about 16 px while fading in over 0.6-1 s; either all at once, or the name first and the tagline joining on the same line as it re-centres. Hold 3-5 s. Then a cut or 0.3 s dissolve to the plain white logo, completely still, held 4-5 s to the end. No CTA cards unless asked.

## Light stage

[1weiho/cinematic-shot, references/look.md] Use the real light interface on a warm-grey ground, with a contact shadow and a soft cast shadow anchoring its white viewport. The source starts the ground at `#EAE7E2` and grades it toward `#E3E0DB`; these are its author presets, not a replacement for the product's palette.

- **Keep bokeh bright.** Use `bokehDim = 0`; omit the dark branch's `brightness(0.75)` on blurred layers, which would turn white UI grey. [1weiho/cinematic-shot, references/look.md]
- **Light belongs to the slab.** Use one soft on-plane layer, at most 12% darkening with spill radii about 1.6 times the dark-stage spill; no tighter core, straight flags or black lens mask. Clip it to the UI so it does not darken the ground, and keep the same follow-spot lag. [1weiho/cinematic-shot, references/look.md]
- **Keep crop boundaries hidden.** Composite the detailed subject crop over a full-viewport context capture, feathering by about 24 UI px in the source recipe; the visible slab edge must remain the page's real edge. [1weiho/cinematic-shot, references/look.md]
- **Grade for a light stage.** The source's average-luminance target is 75-90%, its white gain 0.97, and dark text keeps full contrast. These are look targets; they do not establish accessibility conformance. [1weiho/cinematic-shot, references/look.md]
- **End on the ground.** Hard-cut or fade the UI into the warm ground. Set closing copy in dark ink without glow, then use the actual brand logo on that ground rather than forcing a white mark or fading through black. [1weiho/cinematic-shot, references/look.md]

## Sound

Foley over near-silence: a tick per typed character, a click per selection, a soft whoosh on send, a faint hiss under streaming text; no music, nothing on the payoff, and the copy and logo over silence (sound-pass, *Foley only*).

## Prove it

Render stills mid-shot, at each action's peak, at the payoff, and on the copy and logo. Each should pass as a frame grab: one sharp subject found in under half a second; near and far bokeh (except the wide shot); text diagonal and visibly shrinking; in-focus text legible at half resolution; at least a quarter of the frame near-black on the dark stage, or the warm ground and its contact/cast shadows on the light stage; consecutive shots differ in scale or diagonal; the same stage, light and grain everywhere, with the pool's shape changing per camera. The strongest frame is the poster.
