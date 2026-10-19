# Prompting image models

How to pick an image model and write a prompt that gets a usable marketing image on the first few tries. From [coreyhaines31/marketingskills, image] `SKILL.md` and `references/ai-image-prompting.md` (MIT). The model comparison and tips are the source's opinion, not checked against each vendor; only OpenAI's dates were checked (developers.openai.com, 2026-10-18). Generated plates inside a video (one locked prompt skeleton per set, no text, logos or UI) are asset-prep's "Generated base footage" in [asset-prep SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md).

## OpenAI's image models

https://developers.openai.com/api/docs/deprecations, checked 2026-10-18:

- `dall-e-2` and `dall-e-3` were shut down on 2026-05-12.
- `gpt-image-1` shuts down on October 23, 2026.
- `gpt-image-1-mini`, `gpt-image-1.5` and `chatgpt-image-latest` shut down on December 1, 2026 (the source leaves out `chatgpt-image-latest`).
- The replacement is "gpt-image-2.5-sunburst or gpt-image-2.5-flare".

## The source's model comparison

[coreyhaines31/marketingskills, image]; pricing changes, so follow each vendor's pricing link rather than a number.

| Model | Best for | Text in images | Access |
|---|---|---|---|
| Gemini Image ("Nano Banana", Nano Banana Pro) | All-round, editing, multi-image reference, text rendering | Good | Gemini API |
| Flux (Black Forest Labs: Pro 1.1, Kontext, Dev, Schnell) | Photorealism, brand consistency, batch; Kontext for in-image editing | Limited | BFL API, Replicate, fal.ai |
| Ideogram 3.0 | Typography, branded graphics, accurate text | Best | Ideogram API |
| GPT Image (OpenAI) | General purpose, native editing | Good | OpenAI API |
| Midjourney v7 | Artistic, art-directed visuals | Improved | No official API; Discord and web |
| Recraft V3 | Vector and brand-consistent illustrations | Strong | Recraft API |
| Stable Diffusion 3.5 / SDXL | Self-hosted, fine-tunable | Varies | Open source |

The source's decision order:

1. Text or headlines in the image: Ideogram 3.0, then Gemini, then GPT Image.
2. Consistency across many images: Flux (multi-image reference), Gemini Nano Banana Pro, Recraft V3.
3. Editing an existing image in place: Gemini, Flux Kontext, ChatGPT Images.
4. Vector or illustrative brand assets: Recraft V3; Midjourney for artistic.
5. Highest visual quality: Flux Pro 1.1, Midjourney v7.
6. Volume at low cost: Flux Schnell, Gemini Flash, self-hosted Stable Diffusion.

**The source's per-model tips:**

- **Flux:** "Style transfer via reference images > style keywords in prompt"; prompts can be shorter because "the references do heavy lifting"; Flux Pro for finals, Flux Dev for iteration, Flux Klein for the cheapest high-volume batches.
- **Ideogram:** "Keep text requests simple: 3-5 words max for reliability"; a style reference system of up to 3 images; "Magic Prompt" auto-enhancement.
- **GPT Image:** "Automatic prompt rewriting: may deviate from exact request"; the API gives more control than the ChatGPT interface.
- **Gemini:** supports editing an uploaded image by describing the changes; handles short headlines.
- **Midjourney:** "Not agent-friendly: use for manual creative exploration only"; `--style raw` for less stylized output, `--ar 16:9` for the aspect ratio. (On text, the source's SKILL.md rates v7 "Improved", while its prompting file says "V6+ has improved text rendering but still unreliable".)

## The prompt

[coreyhaines31/marketingskills, image]

```
[Subject] + [Setting/context] + [Visual style] + [Lighting] + [Composition] + [Technical specs]
```

Keep it to 40-80 words, specific over comprehensive, and always give the aspect ratio or dimensions.

For an optional casual-phone look, describe the capture: who holds the camera, its approximate height and distance, the subject's ordinary action, concrete location details, light direction and what must remain visible. These are choices within the prompt brief, not universal tests of authenticity. Preserve the subject and product locks; actual-photo editing follows [REAL-PHOTO-EDITING.md](REAL-PHOTO-EDITING.md), and the existing size, prompt-length, text, UI and logo rules still apply. [nestyme/awesome-prompts, photo-realism/SKILL.md]

## Templates

[coreyhaines31/marketingskills, image] The source's SaaS blog hero, lifestyle shot and listing templates put a "dashboard" or "project management interface" on a screen, which the source itself forbids for product UI; they are left out. Put a real screenshot on the screen in post instead.

Blog hero:

```
[Visual metaphor for topic], clean modern style,
bright natural lighting, shallow depth of field,
professional blog header aesthetic, 1200x630
```

Profile banner:

```
Wide panoramic abstract background in navy blue and teal,
subtle geometric grid pattern with soft gradient,
clean corporate aesthetic, muted lighting,
1584x396, no text, space for logo overlay on left third
```

Directory listing (the screenshot is your real one, supplied as the input image):

```
Product screenshot on a clean gradient background,
soft shadow underneath, slight 3D perspective tilt,
modern SaaS product presentation style,
1270x760, bright and professional
```

## Keywords

[coreyhaines31/marketingskills, image]

- **Photorealistic:** "commercial photography", "shot on Canon EOS R5", "editorial style", "natural lighting", "shallow depth of field".
- **Clean, corporate:** "clean modern aesthetic", "minimal design", "professional corporate style", "bright and airy", "white background".
- **Illustrative:** "flat vector illustration", "isometric 3D render", "hand-drawn sketch style", "watercolor illustration", "line art".
- **The source's abstract and tech lists** ("flowing gradient", "particle effects", "holographic iridescent", "neon accent lighting", "glassmorphism", and its announcement template's "abstract flowing gradient in deep purple and electric blue") are the generic looks [anti-slop-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md) exists to avoid. Use one only when the brand's own direction calls for it.

| Lighting | Effect | Best for |
|---|---|---|
| Natural light | Warm, organic feel | Lifestyle, editorial |
| Studio lighting | Even, controlled | Product shots |
| Rim lighting | Edge highlights, dramatic | Hero images, abstract |
| Soft directional | Gentle shadows, dimensional | Blog headers |
| Volumetric | Light rays, atmospheric | Dramatic, cinematic |
| Flat or even | No shadows, clean | Icons, diagrams |
| Golden hour | Warm orange tones | Lifestyle, outdoor |
| High key | Bright, minimal shadows | Clean, corporate |

| Composition | Effect | Best for |
|---|---|---|
| Rule of thirds | Subject off-centre | Editorial, lifestyle |
| Centered | Subject in the middle | Product shots, icons |
| Wide or panoramic | Expansive view | Banners, headers |
| Close-up or macro | Detail focus | Texture, product detail |
| Bird's eye or overhead | Top-down view | Desk setups, flat lays |
| Negative space | Room for text overlay | Blog headers, banners |
| Symmetrical | Balanced, formal | Corporate, luxury |

## Prompt mistakes

[coreyhaines31/marketingskills, image]

| Mistake | Why it fails | Fix |
|---|---|---|
| "A professional image" | No visual detail | Describe subject, setting, style, lighting |
| A paragraph of text in the image | Models can't render paragraphs | 3-5 words max; add text in post |
| "Make it look good" | Not actionable | Specify the style: "commercial photography, bright" |
| 200+ word prompts | Models lose focus | 40-80 words, specific over comprehensive |
| No aspect ratio | Random output size | Always give dimensions or a ratio |
| "Logo in bottom right" | Unreliable placement | Add logos in post-processing |
| "Make it viral" | Not a visual instruction | Describe the aesthetic you want |
| Requesting UI screenshots | AI hallucinates interfaces | Capture real screenshots |

## Batch workflow and cost

[coreyhaines31/marketingskills, image]

1. Generate 3-4 test images with different style prompts.
2. Pick the winning style by brand fit, and save its exact prompt as the template.
3. Upload the winner as a style reference (Flux multi-reference, or the model's equivalent).
4. Batch the variations: same style, different subjects.
5. Post-process: text overlays, logos, crops to each platform size.

To spend less: draft on a cheap tier (Flux Dev, Gemini Flash) and upgrade for finals; use references over long prompts; generate a series in one session with the same style; reuse backgrounds, patterns and textures; "Post-process instead of re-generate": crop, overlay text and adjust colour in code.

## Prove it

The chosen model is not on OpenAI's shutdown list for the delivery date; the saved prompt has 40-80 words, an aspect ratio or size, and no request for UI, a logo or more than 5 words of text; a batch shares one saved template and style reference; every final was post-processed for text and logo, not generated with them.
