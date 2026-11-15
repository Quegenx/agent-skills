# Capture comparable visual evidence

Capture the actual interface and preserve what each image can prove. Sources: [MengTo/Skills, workflow-progress-screenshots/SKILL.md; stitched-full-page-capture/SKILL.md; html-to-interaction-prompts/SKILL.md; daily-ui-inspiration-capture/SKILL.md]. Use the task's selected browser tools; the sources' particular browser and helper scripts are not prerequisites.

## Before, key moment and result

- For a visual change, capture the initial state, meaningful interaction and resulting state with the same viewport, camera and application state. For a fix, show the failure and its corrected result. Share a small batch after meaningful passes when requested or appropriate, rather than every save. [MengTo/Skills, workflow-progress-screenshots/SKILL.md, Rules]
- Use real rendered output, inspect every image before sharing it and recapture incomplete assets, stale state, stray overlays or the wrong scene. A caption states what the image demonstrates. A path mentioned in prose is not a displayed image. [MengTo/Skills, workflow-progress-screenshots/SKILL.md, Rules]
- Label a browser viewport or headless capture honestly. A phone-sized viewport is not a device test, and a scripted review state is staged. Motion needs representative frames or a recording; one still cannot prove timing. [MengTo/Skills, workflow-progress-screenshots/SKILL.md, Rules; How to capture]
- Establish actual readiness after navigation and scrolling: required fonts/media, intended interaction state and settled reveal/sticky behavior. The source suggests a two-second settle for reference captures and three to five seconds for headless 3D; these are presets, not proof of readiness. A helper that times out and still captures, or merely logs page errors, has not proved success. [MengTo/Skills, html-to-interaction-prompts/SKILL.md, Capture screenshots for each prompt; workflow-progress-screenshots/SKILL.md and scripts/capture.mjs]

## A tall image of a scroll-driven page

- Warm lazy-loaded content by traversing the actual page, then return to the beginning. Capture settled, overlapping viewport states when a browser's single full-page screenshot does not reproduce scroll-triggered content. Keep the actual method explicit: a stitched scroll study combines different moments, rather than a single simultaneous page state. [MengTo/Skills, stitched-full-page-capture/SKILL.md]
- Record requested and actual scroll position for each capture, viewport dimensions, overlap, capture order and resulting image dimensions. Use actual offsets when deciding what overlap to crop. Near the bottom, a requested scroll may clamp to the maximum, so treating the request as the actual position can duplicate or lose rows. The supplied stitching script uses requested offsets here. [MengTo/Skills, stitched-full-page-capture/scripts/stitch_full_page_capture.mjs; https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY]
- `scrollY` reports the current viewport offset and can be fractional. Safari overscroll can report positions outside the usual range; reconcile capture offsets against the document/viewport bounds instead of assuming integer requests were honored. [https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY]
- Inspect the assembled image against the page or its recording, including the first and last rows and sticky-element seams. Document where fixed or sticky content repeats or requires special treatment. Equal-height slices do not establish meaningful page sections. [MengTo/Skills, stitched-full-page-capture/SKILL.md; html-to-interaction-prompts/SKILL.md]

## Derive section evidence from one image

- Keep one full-page image as the source of truth for its section crops. Cover the hero, each meaningful middle section and footer in visual order, using purpose labels when clear. Adjacent crops must cover the source's pixel rows without gaps; record any justified overlap. [MengTo/Skills, html-to-interaction-prompts/SKILL.md, Daily UI Inspiration Capture Contract; daily-ui-inspiration-capture/SKILL.md, Capture]
- Record each crop's label, file, parent full-page image, vertical start/end and height in the manifest. Keep coordinates with the evidence metadata rather than using them as article captions. Display the whole page and the ordered section images when the deliverable is a reference article. [MengTo/Skills, daily-ui-inspiration-capture/SKILL.md, Article Shape; Manifest Shape]
- A marketplace cover or a pan across a still is not live website evidence. Record the actual landing/preview URL for scroll recordings and extract representative states from that recording. If capture fails, label the gap or fallback and prefer a replacement reference when live behavior is required. [MengTo/Skills, html-to-interaction-prompts/SKILL.md, Capture videos when requested]

## Prove it

Every shared image was inspected and matches its caption; comparison conditions match; motion claims have moving or frame-sequence evidence; stitched offsets reflect actual scrolling; source rows and section order are accounted for; and the capture method, viewport, readiness checks and gaps are recorded. Keep blocked capture visible as a limitation. [MengTo/Skills, workflow-progress-screenshots/SKILL.md; stitched-full-page-capture/SKILL.md; daily-ui-inspiration-capture/SKILL.md, Verification]
