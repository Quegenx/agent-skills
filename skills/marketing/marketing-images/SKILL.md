---
name: marketing-images
description: "Makes marketing images: choosing between AI generation, AI editing, a design tool, a real screenshot with an overlay, and stock; product mockups from real screenshots; blog heroes, social graphics, profile and listing banners and brand assets; image prompts and the current image models with OpenAI's gpt-image retirement dates; platform sizes marked verified or not; actual-photo fidelity and subject-specific review, and image delivery and image SEO on your own site. Use when creating a blog hero, social graphic, banner, product mockup or brand asset, prompting an image model, resizing one design for several platforms, checking edits of actual photographs, or preparing images for a website."
---

# Marketing images

Marketing images split into what a model may draw and what it may not. A model may draw a metaphor for a blog post, a lifestyle scene or an abstract background; it may not draw your product, your logo or text longer than a few words, which come from real screenshots, design files and post-processing. Choose the approach from the image's job, then the tool. Source: [coreyhaines31/marketingskills, image] v2.0.2 (MIT, (c) 2025 Corey Haines), with sizes and model dates checked against linkedin.com/help, developers.openai.com and developers.google.com. Paid ad images are [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md); store screenshots are [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md); share-card meta tags and generated OG images are [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md); images inside a video are [asset-prep](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/asset-prep/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Actual-photo permissions, subject fidelity and full-size QA, with source-specific alternatives under existing generation/text rules | [REAL-PHOTO-EDITING.md](REAL-PHOTO-EDITING.md) |
| Image models (the source's comparison and decision tree, OpenAI's retirement dates), the prompt formula, templates, style, lighting and composition keywords, prompt mistakes, batch workflow and cost | [PROMPTING.md](PROMPTING.md) |
| Social, banner and listing sizes, each marked verified or not, LinkedIn's official specs, banner practices, one design resized for many platforms | [SIZES.md](SIZES.md) |

## Before starting

[coreyhaines31/marketingskills, image] Read `.agents/product-context.md` first when it exists ([anti-slop-copy CONTEXT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/CONTEXT.md) defines it; the source calls the file `.agents/product-marketing.md`), then ask only for what it doesn't answer:

- **Goal:** the type (blog hero, social graphic, product mockup, banner, brand asset, OG image), the placement (website, social, directory listing, app store, email) and the dimensions.
- **Production:** existing brand assets (logo, colours, fonts, style guide), photorealistic or illustrative, one-off or a template for repeated use.
- **Technical:** API keys for image tools (in an environment variable, never pasted into chat), the budget (some tools charge per image), whether it must be optimized for the web.

## Choosing the approach

[coreyhaines31/marketingskills, image]

| Approach | Best for | Tools | When |
|---|---|---|---|
| AI generation | Original images from text prompts | Gemini (Nano Banana), Flux, Ideogram | Blog heroes, social graphics, lifestyle scenes |
| AI editing | Modifying existing images | Gemini, Flux Flex | Background removal, style changes, variations |
| Design tools | Templated, brand-consistent assets | Canva, Figma | Profile banners, social templates, presentations |
| Screenshot + overlay | Product UI showcases | Browser screenshot + code overlay | Product mockups, feature announcements |
| Stock photography | Generic business and lifestyle scenes | Unsplash, Pexels | When speed matters more than uniqueness |

| Scenario | Design tool | AI generation |
|---|---|---|
| Exact brand guidelines must be followed | Yes | Maybe (with strong reference images) |
| 20 size variants of one design | Yes (Canva Magic Resize) | No |
| A unique hero image for a blog post | No | Yes |
| A recurring social media template | Yes | No |
| Product mockup with real UI | No (use screenshots) | No (hallucinated UI) |
| Abstract or creative visual | No | Yes |

## Product mockups

[coreyhaines31/marketingskills, image] "AI models hallucinate UI: don't use them for this."

1. **Capture real screenshots** of the product at 2x resolution (Browser DevTools, Shottr, CleanShot X or the `screencapture` CLI; for a site, asset-prep's `capture.mjs` writes 2x viewport and full-page screenshots at several sizes).
2. **Frame them** in a browser, laptop or phone frame.
3. **Add context:** callout arrows, feature labels, before and after.
4. **Annotate in code** (HTML and CSS) so the overlay stays sharp and editable.

landing-page-ui does the same on the owner's sites: "**Show the real product.** Every claim sits beside a screen of the real app with demo data" ([landing-page-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md)). Use demo-safe data on every screen.

For store decks, use [ASO's screenshot production workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SCREENSHOT-PRODUCTION.md) for benefit/capture pairing, approvals and final-image QA, and [its 18 optional art directions](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SCREENSHOT-STYLES.md) for the surrounding artwork. [aso-appstore-screenshots, SKILL.md; app-store-screenshots, SKILL.md; style-prompts.md]

## Blog heroes and social graphics

[coreyhaines31/marketingskills, image]

- **Blog hero:** find the visual metaphor for the topic, generate it (Flux or Gemini for photorealistic, Ideogram when it needs words), at 1200x630 (hero and OG image in one) or 1920x1080 for full width. The prompt pattern is in [PROMPTING.md](PROMPTING.md#templates).
- **Social graphics:** make the concept once at the largest size needed, resize per platform, set any text in post, export at each platform's size ([SIZES.md](SIZES.md)).
- **Brand direction comes from the brand,** not from a model's defaults: anti-slop-ui's "Look for the brand's direction" ([anti-slop-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/SKILL.md)).

For a carousel adapted from an authorized reference, record its image crop, type regions and hierarchy, alignment and overlap, annotations and information density before making the first slide. Rebuild those mechanics with the brand's own assets and design, then review one slide before batching. This is reference analysis, not a prescribed visual genre or evidence that a layout improves engagement. [nestyme/awesome-prompts, carousel-styles/SKILL.md; carousel-styles/reference.md]

The narrative framework and consistent interior template remain in [social-media's carousel guide](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/CAROUSELS.md). Keep claims, counts, verification status and commenters factual; text and logos still follow this skill's post-processing rules.

## Brand assets

[coreyhaines31/marketingskills, image]

| Asset | AI generation | Design tool | Notes |
|---|---|---|---|
| Logo | Poor: inconsistent, not vector | Yes (Figma) | Always design or commission logos |
| App icon | A decent starting point | Yes (Figma) | Generate concepts, refine by hand |
| Illustrations | Good for style exploration | Depends | AI for concepts, finish in a design tool |
| Favicons | No | Yes | Derive from the logo |
| Social icons | No | Yes | Use the platform's own assets |

## Images on your own site

- **Delivery** (WebP, quality, `srcset`, width and height, lazy loading) is [web-performance BROWSER.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/BROWSER.md). The source says "serve as WebP with JPEG fallback"; BROWSER.md says "Every current browser decodes WebP, so no JPEG or PNG fallback is needed", and that rule stands. BROWSER.md also records the source's "<200KB" hero target, labelled as the source's.
- **Batch commands** [coreyhaines31/marketingskills, image]: `cwebp -q 80 input.png -o output.webp`; `mogrify -format webp -quality 80 *.png`; `jpegoptim --max=80 --strip-all *.jpg`.
- **List a page's images:** `curl -s https://yoursite.com | grep -oE 'src="[^"]+\.(jpg|png|webp)"' | head -20`. The source writes `grep -oP`; `-P` is a GNU grep option that the BSD grep on macOS lacks, so use `-oE`.
- **Image SEO** (https://developers.google.com/search/docs/appearance/google-images): Google supports "BMP, GIF, JPEG, PNG, WebP, SVG, and AVIF", and the extension should match the file type; avoid generic filenames "like `image1.jpg`, `pic.gif`, `1.jpg`"; "Google doesn't index CSS images", so content images go in `<img src>`; with `srcset` or `<picture>`, "always specify a fallback URL using the `src` attribute"; an image sitemap may list CDN URLs on another domain in `<image:loc>`; inlining images as data URIs "can considerably increase the size of the page". Alt text is [web-accessibility](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SKILL.md); Google also warns against "filling `alt` attributes with keywords".
- **Share images** (`og:image`, its alt, `twitter:card`, generated OG images and their limits): [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md). The owner's sites set them in [landing-page-ui DISCOVERY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/DISCOVERY.md).

## Common mistakes

[coreyhaines31/marketingskills, image]

1. Using AI for product UI screenshots: models hallucinate interfaces; capture real screenshots.
2. Skipping image optimization (the source calls it "the #1 page speed killer", without data).
3. No OG image: shared links look broken without a preview image.
4. Wrong aspect ratio: check the platform's size before generating.
5. Text-heavy images from a model that can't render text: use Ideogram or add the text in post.
6. Generating without style direction: "photorealistic", "flat illustration" and "3D render" change the output drastically.
7. Inconsistent brand visuals: use reference images or design templates.
8. Huge images on landing pages: compress, resize, lazy load.

## The rules

1. **Never generate product UI, a logo or a favicon.** Product images come from real screenshots at 2x; logos are designed or commissioned; favicons derive from the logo. [coreyhaines31/marketingskills, image]
2. **Words go on in post.** Ask a model for no text, or 3-5 words at most from a model that renders text well; logos are always added in post-processing. [coreyhaines31/marketingskills, image]
3. **Pick the size before generating** and generate at the largest one needed; label a size from an unverified source as such ([SIZES.md](SIZES.md)).
4. **Use models that still exist:** OpenAI shuts `gpt-image-1` down on October 23, 2026 and `gpt-image-1-mini`, `gpt-image-1.5` and `chatgpt-image-latest` on December 1, 2026; DALL-E 2 and 3 are already shut down (https://developers.openai.com/api/docs/deprecations).
5. **Brand direction comes from the brand's own files,** and generic AI looks in the source's keyword lists are a choice to justify, not a default ([PROMPTING.md](PROMPTING.md#keywords)).
6. **Site images follow BROWSER.md** for format and size and Google's image guidelines for indexing.

## Prove it

No delivered image shows UI, a logo or more than a few words a model drew; every product image traces to a real screenshot file; each file's pixel size matches its row in [SIZES.md](SIZES.md) (`sips -g pixelWidth -g pixelHeight` or `ffprobe`); the prompt and model of every generated image are saved with it; site images pass BROWSER.md's checks and sit in `<img>` with a `src`.
