# Verify and integrate transparent artwork

Transparent raster asset contracts and provenance from [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md and scripts/inspect_png.py]. The workflow's name is not proof of a selected model. Use the actually exposed generation/edit tool and schema; preserve the existing [image prohibitions](SKILL.md#the-rules), including generated product UI, logos and favicons.

## Define a separately usable asset

- Inspect the intended layout, references, current assets and pipeline. Establish generation versus editing versus project integration, requested format, dimensions, orientation, padding, occupied/empty areas and transparent openings. Keep labels/buttons in the interface and independently animated decoration in its own layer when requested. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Establish the asset contract; Write the generation prompt]
- For an isolated cutout, specify what must be transparent outside and inside the shape, including enclosed gaps. A painted checkerboard, flat backdrop or rectangular shadow is not alpha. Do not ban an intentional background, shadow or glow when the brief requires it. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Write the generation prompt]
- An L-shaped corner with roughly 70% empty toward the opposite corner, or a centered crest filling about 85% of its canvas, are source composition presets. Preserve readable silhouette and padding at the actual display size rather than treating these percentages as universal requirements. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Two useful compositions for ornate game UI]
- Follow live tool arguments for transparency and references. Inspect local edit targets first, select the supported reference mechanism and do not invent a model/size/output-path parameter. The source's example omits an explicit transparent-background flag; when the exposed tool requires such a flag, set it for a requested cutout. Never report an unexposed model as verified. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Use built-in Codex image gen; live image_gen.imagegen schema]

## Check the file and the actual openings

- Inspect actual file format, mode, dimensions, size and hash. RGBA mode alone is insufficient: alpha may still be fully opaque. Record alpha range, transparent/partial/opaque pixel proportions and visible bounds; reject entirely opaque or entirely invisible results when a visible cutout was requested. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Verify the PNG and transparency; scripts/inspect_png.py]
- Inspect silhouette, clipping, material, unwanted text and reference fidelity visually, including enclosed gaps over the consuming background or a checkerboard. Alpha statistics do not prove the intended holes are clear. Use the requested edit workflow to correct defects rather than silently substituting an unrelated vector or unrequested background-removal method. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Verify the PNG and transparency]

## Preserve and integrate

- Keep the generated original and complete final prompt/edit instructions. Record generator, requested model separately from an exposed actual model, dimensions, project-relative source/runtime paths and hashes. If exact originals are requested, compare hashes after byte-for-byte copying. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Preserve and integrate]
- Preserve an explicitly requested PNG format at runtime unless conversion is authorized. Follow the existing asset inventory/optimization path with a narrowly scoped exception when needed. Maintain aspect ratio and transparent padding; a reusable corner may be mirrored without generating another texture. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Establish the asset contract; Preserve and integrate]
- For a health-linked decoration, derive intensity from actual health, clear it on recovery/respawn, respect reduced motion and prevent decorative layers from intercepting controls. Verify image loading, openings, responsive placement and requested states when integration checks are authorized. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Preserve and integrate]

## Prove it

Deliver the usable files and saved prompts, with actual format/dimensions/alpha evidence and inspected openings. Report any unexposed model, failed generation, unverified integration or format limitation. Asset generation does not itself authorize deployment. [MengTo/Skills, codex-gpt-image-2-5-flare/SKILL.md, Deliver]
