---
name: asset-prep
description: "Captures and prepares what a video animates: site screenshots, brand colours, fonts and logos, cutouts, cleanup and upscaling. Use when a video shows a real product or site, or supplied images need preparing."
---

# Asset prep

**Real assets only.** Without them the model draws your product from scratch and it looks off: wrong spacing, placeholder boxes, fake buttons. Anyone who has used good software feels it in a second, and the whole film reads as cheap. The model may invent the camera; it may not invent the product.

Everything lands in the film's `assets/`, and every file is listed in `brief.md` under ASSETS with where it came from. List what you found **before** animating anything. A screen the story needs and you don't have is a blocker: ask for it.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## Capture a product from its site

**Helper prerequisite:** the bundled Chrome/CDP helpers used by brand capture and logo fetching require unflagged global `WebSocket`, available in Node 22+. The old helper docs had no specific Node prerequisite. This does not change the separate app-recording source's Node requirement. [Node globals, WebSocket](https://nodejs.org/api/globals.html#class-websocket); [asset-prep, scripts/_cdp.mjs]

**The brand first.** `node <this skill>/scripts/brand.mjs https://product.com assets/brand` (needs Google Chrome) writes `board.png`, one sheet to look at: the logo, the palette with each colour's role (ground, ink from the largest heading, ink-soft for body copy, ink muted, accent from the buttons and brand variables, or accent candidates sampled from the imagery on a monochrome site), a type specimen in the real downloaded font, the copy (headline, subhead, navigation, button labels) and four screens. Beside it `BRAND.md`, `brand.json`, `logo/`, `fonts/` (the font files the page actually uses), `screens/` and `media/` (large product imagery shot in isolation; blank WebGL canvases dropped, screenshots of the site flagged as not product media). Look at the board and check the roles before writing the style guide: the headline ink is not the body grey, and an accent is a button colour or a colour from the imagery, not a link colour. Tested on linear.app: logo, a dark ground with its inks, a teal accent candidate from the imagery, four font files and six screens.

**Then the product's screens.** Copy `scripts/capture.mjs` from this skill's folder into the film's `scripts/`.

```bash
node scripts/capture.mjs https://product.com https://product.com/pricing --sizes 1440x900,390x844 [--dark]
```

Writes 2x viewport and full-page screenshots to `assets/screens/` for every page and size.

Capture every surface the story might use: key pages, the mobile view (`--sizes 390x844`) and dark mode (`--dark`). Break screenshots into components (icons, cards, rows, buttons) so each can animate; a raw screenshot sliding around reads as a screen recording.

Logged-in product UI and design-system components: the user's own repo is the best source (real components, tokens, icons, the logo file). Inspect it before designing anything; when a screen must be motion-separated, rebuild it faithfully from the real design system instead of scaling a giant screenshot. When there is no product UI yet, build it from a real component library (21st.dev components are made by design engineers) rather than inventing chrome on the spot. A Figma file: use its frames, tokens and assets as the source of truth (through a Figma connector when one is available) and add only the motion. Fabric.js and Rive assets need a deterministic renderer adapter: [seek-engine TECHNIQUES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/seek-engine/TECHNIQUES.md#fabricjs-and-rive-assets).

## Working inside an existing product repo

Add the film beside what is there; never replace or regress an existing composition, and reuse its fonts, utilities and QA tooling where they fit. Use clearly synthetic, demo-safe values for anything that could look like real customer data, and never put personal, test-user or production information on screen.

The repo is the style guide, and it outranks every default in these skills. Before the brief, read it in a few focused passes and record each finding with its source file:

| Pass | Where | What to write down |
|---|---|---|
| Rules and voice | `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `CONTRIBUTING.md`, brand and design docs | casing, dashes, banned words, reading level; radius, borders, shadows, where mono is allowed; what the product may claim, approved lines and taglines |
| Tokens | the global CSS (`@theme`, CSS variables), the Tailwind config, theme files | ground, ink, muted, surface, border and accent in dark and light, hover and pressed; radius; fonts and where they load; the UI's own easing curves and springs (search `cubic-bezier`, `spring`, `transition`) |
| Components | buttons and their loading state, badges, status marks, loaders, avatars, toggles, cards, the logo file, partner icons, signature graphics (a dither, a hatch, an ornament) | the path, and whether it runs its own clock or loads images asynchronously (seek-engine's `TECHNIQUES.md`, "Real components, on the film's clock") |
| Features | the real screen or component for each feature the film might show, its copy, the states it moves through, the demo data the landing page already uses | so the film and the site show the same names and numbers |

Then tour the live site at desktop width and write notes after every couple of screenshots (framing, colours, type sizes, how buttons press, how the logo moves). Name the options you offer the user after what you found: their features, screens and components by their product names, never generic ones. Write a components table into the brief: each one imported as is, twinned on the film's clock, or redrawn, with the reason.

## The logo

**A known brand, or a third-party mark** (an integrations beat, a partner): `node <this skill>/scripts/fetch_logo.mjs "Stripe" stripe.com --out assets/logo` fetches the official SVG (SVGL first, then Simple Icons with the official hex, then the brand's own site icon), with light and dark variants and `logo.json` recording every source. It never draws or recolours one; when nothing is found, set the name in type. Render it once and look before using it: when it falls through to the brand's site, the SVG can be a wide header strip or a lockup instead of the symbol. Tested: Stripe returned its mark, wordmark and #635BFF.


Use the real file. When only a raster exists, trace it to SVG so it stays sharp at any zoom and can animate (`potrace` on a thresholded bitmap, or `vtracer` for colour), then compare the trace against the original at 4x before using it. Never redraw or approximate a logo by hand.

## Prepare supplied images

The posters-to-layers pipeline: take a flat image apart so each piece can move on its own.

| Job | Tool | Command sketch |
|---|---|---|
| Ink or line art off paper | OpenCV threshold / adaptive threshold | `uv run --with opencv-python-headless python ...` |
| Cut a subject out | rembg (BiRefNet models) | `uvx rembg i -m birefnet-general in.png out.png` |
| Fill the hole it leaves | LaMa inpainting (e.g. `uvx --from lama-cleaner ...` or an API) | mask = the cutout's alpha |
| Paper, cardboard, grain textures | crop patches from the source with OpenCV, feather edges, tile to cover the frame | |
| Upscale a final or an asset | Real-ESRGAN (`realesrgan-ncnn-vulkan`) | 2x or 4x |
| Colour and size facts | `ffprobe`, a quick numpy read of pixels | measure, never guess |
| Real video clips | all-intra re-encode or a JPEG sequence; scene detection before looping; a phone recording is often HEVC and full range, so re-encode it to H.264 limited range (`-pix_fmt yuv420p -color_range tv`) or it comes out washed out | call the Skill tool with "seek-engine" for the recipes |

These pull models on first use (hundreds of MB): say so before running one. Save each layer as its own PNG with alpha, named for what it is (`cat.png`, `bag-empty.png`), and record the layer list. Check every cutout at 100% on a contrasting background before animating it: a halo of the old background is the usual tell.

## References to direct from

Pick one or two reference videos whose style the film should take and name it: launch films (whatships.com collects them), code-made AI motion by category with prompts and source where public (the Awesome AI Motion gallery, guanmo-ai.github.io/awesome-ai-motion), Dribbble motion, competitors' launch films, or the user's own past work. Naming a style beats describing one; the video-brief skill turns the reference into a style guide.

[guanmo-ai/awesome-ai-motion, docs/SOURCES.md and THIRD_PARTY.md] Record whether a linked resource is the exact film project, the advertised product's repository, a general toolkit or a live demo. A product repository or preview alone does not establish that the film's source is available or reproducible.

## Real use as footage

For a game, a tool or anything with live behaviour, record real use (replays, screen captures of a real session) and mine it for the tense or revealing moments: a near miss, the instant the smart part acts. Cut those to the beat; never let emphasis text or a transition hide the moment itself.

**A scripted recording of your own web app** (one flow re-recorded every release, driven by Playwright with subtitles, a visible cursor, a fake URL bar and optional narration): [APP-RECORDING.md](APP-RECORDING.md).

**Recording the screen yourself**: record at twice the delivery size (4K for a 1080p film) so a 2x zoom on code stays sharp; 60 fps for scrolling and UI, 30 for mostly static code or a terminal; editor text 18-22 px or more at delivery, line numbers on, minimap and status clutter off; move the pointer deliberately, rest on a target about half a second before clicking, hide it while explaining; hold each zoomed area 3 s or more before panning on; play key moments at real speed, speed up boilerplate and navigation, and cut the wait out of installs and builds.

**Transforming supplied footage:** probe it first (`ffprobe` duration, fps, size, audio, subtitle tracks), write down what must not change (the voice, the captions, the length, the person, the order of information), then plan segment by segment: what the original shows, what replaces it, what has to be drawn or repaired. Make a 10-second sample, check it against the original audio and captions, then do the rest.

When the job is cutting the footage itself (picking takes, trimming a talk), route to video-use (make-video's engine table); when a film here cuts supplied speech, its correctness rules hold: cut only on word boundaries from a word-level transcript (never phrase-level subtitles, which lose the gaps), padded 30-200 ms because word timestamps drift 50-100 ms; prefer silences of 400 ms or more as cut points, use 150-400 ms ones only after looking, never under 150 ms; give 400-600 ms of air at a speaker change and keep the laugh after a punchline (the reaction is the beat); put a 30 ms audio fade on both sides of every cut or each one pops; extract each segment and join them with a lossless copy, so overlays don't re-encode everything twice; shift each overlay so its frame 0 lands at its window start; offset subtitle times into the output timeline (`word.start − segment start + segment offset`) and burn them last, after every overlay; cache transcripts per source file. Check every cut in the rendered file (frames and waveform around each boundary) for a jump, a pop, a caption hidden under an overlay. When two shots of the same speaker meet, keep the eyes at the same height and horizontal place on screen across the cut, measured in the final crop and scale (a small reframe or uniform scale per shot, never chasing the eyes frame by frame); reframing can't fix a change in where they look. To trim dead air at the head and tail, inspect the actual clip's waveform and pause boundaries before accepting cuts. Do not automatically pass `loudnorm.input_thresh` into `silencedetect=noise`: the former is an EBU relative loudness gate, while the latter is an amplitude threshold (a ratio, or dB when suffixed). The old line and the source substituted one for the other without a validated conversion. Keep the threshold specific to the inspected clip; no replacement dB value is established here. [heygen-com/hyperframes, remotion-markup/silence-detection.md; official correction: https://ffmpeg.org/ffmpeg-filters.html#loudnorm and https://ffmpeg.org/ffmpeg-filters.html#silencedetect]

## Archival material (history and explainers)

Receipts for a history or an explainer come from free archives, never from memory. Wikimedia Commons: search files through its API (`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=<terms>&prop=imageinfo&iiprop=url|extmetadata&format=json`) and download originals with a descriptive User-Agent; the licence and author are in `extmetadata`. The Library of Congress blocks direct image links: use its IIIF image service or a Commons mirror, and check that the OCR page you matched is the image's page (off-by-one page indexes are common). Patents, government documents and court records are usually public domain. Write each file's source and licence into `brief.md`. Record reuse scope separately for code, fonts, music, images, logos and other third-party media; a repository's code licence does not establish rights to those assets. [awesome-claude-5-5-videos, THIRD_PARTY.md; guanmo-ai/awesome-ai-motion, LICENSE and THIRD_PARTY.md] Never recreate a photograph: when no free photo exists, the beat goes typographic or uses a real later artifact labelled as such. A recreated document is fine if the frame says so ("typesetting recreated from the 1839 text").

## Free stock footage
 When a shot must look real (a city, an office, people at work, waves, traffic, archival-style places), stock beats generation, which still makes uncanny people; when it must look specific to the idea (a metaphor, a diagram, a branded world), generate or draw it. Pexels and Pixabay are free for commercial use with no attribution required (neither may be resold unaltered or imply endorsement); both need a free API key in `.env`. Search is keyword-based: 2-4 words, the subject first, plus the point of view the shot needs (aerial or drone, macro, top-down, over-the-shoulder, handheld, locked-off, timelapse), and synonyms when results are poor; the same query always returns the same results. Filter by orientation and duration so a 4-second need doesn't download a 30-second clip; download Pixabay results at once (its links expire). Judge each result before using it: right subject (not just a keyword match), right point of view (a wrong one costs more than a wrong grade), long enough, smooth motion unless motion is the point, the target frame rate, framing that doesn't cut the subject awkwardly; below "acceptable", change the query, try the other library, then generate. Discard stock audio. Record the photographer and source URL for every clip in `brief.md`.

## Screens inside a device photo

To play the product inside a photographed phone, laptop or foldable, measure the screen from the photo and mask by geometry; never ship a mask cleaned up from segmentation (a morphological close fills small corners and eats the anti-aliased edge of a hinge or bezel). Scan single rows and columns across each screen edge in greyscale (the screen bright, the bezel dark) and record the first and last bright pixel: a constant value is a straight edge, a slope means perspective (fit a line, or a homography when the screen isn't square to the camera). For a corner radius, the inset of the first bright pixel k rows below the top edge is `r − √(2rk − k²)`; solve it at k = 1 and k ≈ 10, and the two estimates should agree within a couple of pixels. Blank the screen by drawing that exact rounded rectangle (supersampled 4x, then downsampled) and leave every other pixel of the photo alone, then put the content in a box of the same geometry with `overflow: hidden`. Compare 3x crops of each corner against the photo before trusting it. Never resize the screen to fit the content: scale the content. Something on a screen is always mid-motion, and two screens side by side are offset so they never move in sync. For a real app's look, read its glyphs and type metrics from its live mobile site at a phone viewport (each `svg` with its `aria-label` or test id and its box, and `getComputedStyle` for the type) instead of drawing icons from memory; use real posts only with the rights to them.

## Generated base footage (optional)

A generated image is for a missing surface only (a ground with light and texture, a material, an object cut-out), never text, a logo, a UI, a chart or a person presented as real; write the prompt so it asks for none of those, label the result illustrative in the production log, and make every plate do something in the film (parallax, light, occlusion, a mask reveal, a rack focus). It never replaces the product proof. A set of generated images for one film shares one locked prompt skeleton: only the subject changes, the light, palette and lens words stay identical, and each is generated at the film's final aspect ratio, or the set won't cut together.


When the film needs characters, physics or organic motion that code draws badly, generate base material (character sheets first, then sets, then shots) with an image or video model the user has a key for (`FAL_KEY` in `.env`), then **trace it in code** so the viewer sees only the code-drawn layer. Block the camera and timing first with gray boxes (in Blender or a quick seek-engine scene) and use that blockout as the video model's motion reference, so the generated shots keep the planned framing and cut on the grid. Before each expensive step (a batch of generations, a long render on paid compute), list it with an estimated cost and wait for approval. Keep a log per shot: the reference images, the model and version, how many takes, which one was chosen and why.

**Prompting a video model**. Models describe subject and setting well and get motion, space and camera wrong, so fill five slots every time: the subject (type and the attributes that tell it apart), its motion in time order with what it touches, the scene (setting, time of day, what moves in it), the space (shot size, place in frame, foreground, midground and background, and how they change during the clip), and the camera (speed, lens, height, angle, focus, steadiness, movement). Name the camera move exactly: a dolly or truck moves the camera, a pan or tilt turns it, a zoom or rack focus is the lens alone; "static" means no move, no zoom and no focus change at all; bird's-eye means straight down, aerial only means high up. List titles and overlays separately, never as part of the scene's depth. Write the visual cause instead of the feeling ("tears on the cheek, shoulders slumped, staring at an empty chair", not "sad"; "low angle, 24 mm, the sun behind the subject", not "epic"). For several shots of one character, repeat the same 3-6 identifying attributes word for word in every shot, never "the same character". Order things by time, or by prominence when time doesn't apply. Length suits the model: some reward 200-400 structured words for a hero shot, others degrade past about 60-80; start simple, add camera, then light, then style one at a time, keep a seed that worked, and repeat the same style and grade words across clips so they cut together. Ask for the budget, be economical, and build a check for anything that must sync (lip-sync, lyric timing) before generating the rest.

## A talking portrait

A photo or a generated face that speaks is one still image plus three mouth patches, never four whole frames. Generate one canonical portrait: front-facing, eye level, head centred, even soft light with no shadow across the lips, mouth closed, a plain background and plain clothing (these pixels never change). Then make three separate identity-preserving edits of that same image, one per pose: *soft* (lips slightly parted), *round* (a conversational "oh") and *open* (a medium "eh/ah", a little teeth), each prompt saying to change only the lips and inner mouth and to keep canvas, crop, eyes, glasses, hair, jaw, beard, clothing, background and light identical. Reject any edit where something outside the mouth moved. Crop all three at the same integer rectangle (the mouth plus a thin ring of skin, well under a third of the portrait each way), place it by percentages of the portrait, and feather only its edge with a small elliptical mask; the closed pose is the portrait with no patch. A double lip means the crop or mask is off, not the timing.

## Done when

Every asset the shot list needs exists in `assets/`, is listed with its source, has been looked at, and nothing on screen will be invented.
