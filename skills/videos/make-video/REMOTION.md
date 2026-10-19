# Remotion: frame timing, composition metadata and render output

Use this when [ENGINES.md](ENGINES.md#choosing-the-engine) selects Remotion. These framework contracts come from the supplied [remotion-dev/skills](https://github.com/remotion-dev/skills) snapshot, identified there as 4.0.536, checked against the official documentation linked below. That snapshot does not establish the project's installed version. The brief, beat grid, stills and review gates remain in [SKILL.md](SKILL.md); embedding a preview in a product belongs to React's [react REMOTION-PLAYER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REMOTION-PLAYER.md).

## Start with the installed version

Read the project's manifests and lockfile before choosing APIs. Keep `remotion` and every installed `@remotion/*` package on one exact version; inspect every workspace that supplies them. Check the documentation and types for that version before adopting newer timing props or defaults. The official [upgrade guide](https://www.remotion.dev/docs/upgrading) describes coordinated upgrades; a source snapshot is not a reason to upgrade an existing project.

The engine choice and current licence terms are in [ENGINES.md](ENGINES.md#choosing-the-engine). Check those before selecting Remotion for a commercial workflow.

## Keep parent placement and source time separate

[remotion-dev/skills, remotion-markup/timing-props and sequencing]; official [timing](https://www.remotion.dev/docs/timing), [Sequence](https://www.remotion.dev/docs/sequence) and [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame).

Use `useVideoConfig().fps` for seconds-to-frame conversions inside a composition. Within a `Sequence`, `useCurrentFrame()` reflects that sequence's timing rather than the unshifted parent frame.

For components supporting the documented timing props, `from` places the child in its parent's clock; `trimBefore` selects the source start; `durationInFrames` selects a source range; `playbackRate` changes its speed; and `loop` repeats the selected range. These operations have different jobs. The documented local frame before looping is `trimBefore + (frame - from) * playbackRate`, where `frame` is the parent frame. A selected source range therefore need not occupy the same number of parent frames when its speed changes. Read the installed component's contract before applying these props to it.

Use a shared `Sequence` to place picture and captions together, or to place a child that does not accept timing props. Keep caption timestamps relative to the clip. Before applying trim or speed to that shared parent, verify that the installed `Sequence` supports `trimBefore` and `playbackRate`, as shown in the current [Sequence documentation](https://www.remotion.dev/docs/sequence). Wrapping a trimmed or speed-adjusted media child alone does not apply that child's transforms to its caption sibling. A `Sequence` fills its parent by default; choose `layout="none"` when it should provide timing without adding that layout wrapper.

## Drive motion from the frame

[remotion-dev/skills, remotion-markup/timing]; official [interpolate](https://www.remotion.dev/docs/interpolate), [Easing](https://www.remotion.dev/docs/easing) and [spring](https://www.remotion.dev/docs/spring).

`interpolate()` extrapolates beyond its input range by default. Set `extrapolateLeft` or `extrapolateRight` to `"clamp"` when the value should stop at an endpoint. `Easing.spring()` is an easing function for normalized progress; `spring()` evaluates the supplied `frame` and `fps`. Choose the API for the clock being supplied. Source damping and duration examples are samples, not required motion settings.

The supplied Studio interactivity rules keep editable values and interpolation inline and prefer the individual CSS `scale`, `translate` and `rotate` properties. Those are source-editor writeback constraints, not general React rendering requirements. The source itself permits transform strings for perspective, skew and cases where transform order matters. Keep the project's established React structure when Studio writeback is not required.

## Account for transition overlap

[remotion-dev/skills, remotion-markup/transitions]; official [TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries) and [transitioning](https://www.remotion.dev/docs/transitioning).

A `TransitionSeries.Transition` overlaps adjacent sequences, shortening the total by its transition duration. A `TransitionSeries.Overlay` adds an effect around a cut without shortening the sequences. Compute composition duration from the sequence durations and actual overlaps. Ask the timing object for `getDurationInFrames({fps})` with the composition's FPS; spring timings without a fixed duration can depend on that FPS. Recalculate after changing a timing or the composition FPS.

## Resolve metadata through a callback

[remotion-dev/skills, remotion-markup/calculate-metadata]; official [dynamic metadata](https://www.remotion.dev/docs/dynamic-metadata) and [data fetching](https://www.remotion.dev/docs/data-fetching).

Supply `calculateMetadata` as a function on the composition. It can resolve duration, dimensions, FPS and component props before rendering. Return a `props` field when the component must receive computed data; returning only `durationInFrames` does not pass local calculations into the component. Use the callback's `abortSignal` for fetches so obsolete metadata work can be aborted when inputs change. Outside the composition component, obtain FPS from the registration or shared configuration rather than calling `useVideoConfig()`.

Source corrections: remotion-interactivity/SKILL.md:413-425 passes the Promise produced by `useMemo(async () => ...)` as `calculateMetadata`; the API requires a callback, and [React's useMemo](https://react.dev/reference/react/useMemo) returns the calculation's result. remotion-markup/voiceover.md:84-90 returns only duration while claiming it passes `sceneDurations` through a prop; computed props require the explicit returned `props` field described in [dynamic metadata](https://www.remotion.dev/docs/dynamic-metadata).

## Preserve the caption data and clock

[remotion-dev/skills, remotion-captions]; official [Caption](https://www.remotion.dev/docs/captions/caption), [displaying captions](https://www.remotion.dev/docs/captions/displaying) and [caption pages](https://www.remotion.dev/docs/captions/create-tiktok-style-captions).

The `Caption` type uses `text`, `startMs` and `endMs`, with nullable `timestampMs` and `confidence`, plus optional `pageBreakAfter`. Keep milliseconds distinct from composition frames. Preserve spaces in the text; word entries can carry their preceding space, and `white-space: pre` preserves it when rendering. `pageBreakAfter` forces a page boundary without changing word timings.

Keep picture and captions in the shared clock described above when trimming or changing speed. The supplied editor requires inline caption arrays to save edits back to source; that restriction belongs to its writeback workflow, not every caption renderer. For narration and word timings, read [voiceover](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/voiceover/SKILL.md).

## Load the rendered font before measuring

[remotion-dev/skills, remotion-markup/google-fonts and measuring-text]; official [loadFont](https://www.remotion.dev/docs/google-fonts/load-font), [measurement best practices](https://www.remotion.dev/docs/layout-utils/best-practices), [measureText](https://www.remotion.dev/docs/layout-utils/measure-text) and [fitText](https://www.remotion.dev/docs/layout-utils/fit-text).

Load the styles, weights and subsets the composition uses. `@remotion/google-fonts` blocks rendering until its fonts are ready; await its `waitUntilDone()` before measuring text. Measurement must use the same font family, size, weight, spacing and other relevant styles as the rendered text. `measureText()` runs in the browser, not Node.js or Bun.

Treat versioned defaults explicitly: the docs distinguish the permissive v4 `loadFont()` call from v5's required nonempty weights and subsets, and describe `validateFontIsLoaded` changing from false to true by default in v5. These documented v5 rules do not establish that the installed runtime is v5. Version caveat: remotion-markup/google-fonts.md:29 uses argument-free `loadFont()`, valid under its v4 contract; check the installed version and use its supported, narrowed form.

## Select media and alpha output for the render target

[remotion-dev/skills, remotion-markup/embedding-videos and remotion-render/transparent-videos]; official [video component comparison](https://www.remotion.dev/docs/video-tags), [transparent videos](https://www.remotion.dev/docs/transparent-videos) and [browser render support](https://www.remotion.dev/docs/web-renderer/can-render-media-on-web).

The current media guide recommends `Video` and `Audio` from `@remotion/media` for new code and explains `Html5Video` and `OffthreadVideo` alternatives and fallbacks. Choose components supported by the installed version and intended renderer; successful Player playback alone does not establish export support. In particular, the browser rendering migration guide requires [supported media components](https://www.remotion.dev/docs/client-side-rendering/migration).

For alpha output, coordinate transparent composition content, PNG render frames, codec and alpha pixel format. Official ProRes settings use profile `4444` or `4444-xq` with `yuva444p10le`; WebM transparency can use VP8 or VP9 with compatible settings and target support. Check the resulting file in its destination application or browser.

Source correction: remotion-render/transparent-videos.md:61-94 labels a VP9 recipe but changes its metadata default to `vp8`; keep the chosen codec consistent across CLI, configuration and composition defaults. VP8 is also a valid alpha choice, as the [official guide](https://www.remotion.dev/docs/transparent-videos) shows.

## Prove it

Record the installed Remotion versions and chosen render target. Check frame boundaries after placement, trimming, speed changes and transitions; picture and captions stay synchronized, and the resolved composition duration matches the intended program. Metadata changes reach both component props and the final render. Text is measured with the loaded rendered font and fits in the inspected frames. Inspect alpha output in its destination. Complete [make-video's gates](SKILL.md#the-gates) and [frame-review](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/frame-review/SKILL.md) before calling the film done.
