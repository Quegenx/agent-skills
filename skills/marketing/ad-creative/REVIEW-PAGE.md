# Creative review page

A shareable, self-contained web page that presents generated concepts for a client or stakeholder to review and pick: each concept as an in-feed mockup (Instagram or Facebook, with a handle toggle for partnership ads), carousels as a labeled frame-by-frame storyboard, headline variations to toggle, and a required disclosure of what is real. It is the approval surface on top of `INDEX.md`. From [coreyhaines31/marketingskills, ad-creative, creative-review-page.md and assets/creative-review-template.html] (MIT, Copyright (c) 2025 Corey Haines); the template ships here at [assets/creative-review-template.html](assets/creative-review-template.html) with the source's real-brand sample data replaced by neutral placeholders. One file, inline CSS and JS, no build, no dependencies, no network.

## When to produce one

- **A batch for approval,** after Mode 1 or 3 generation: picking 5 of 50 is a visual decision, and a client shouldn't have to read markdown to make it.
- **A partnership ad pitch:** show the partner exactly what the ad looks like under each handle, with the rollout steps.
- **A monthly slate review** ([CREATIVE-ROADMAP.md](CREATIVE-ROADMAP.md#the-roadmap)): render the slate so the pick happens off one link.

Not for a single headline tweak or an internal gut check; markdown is faster. Reach for it when someone other than you has to choose.

## The data model

Everything renders from one JSON block near the top of the file, `<script type="application/json" id="review-data">`; you don't edit the render code. Annotated below with `//` comments for reading; **the file itself is strict JSON** (no comments, no trailing commas).

```jsonc
{
  project: {
    brand: "Example Brand",        // required
    agency: "Example Studio",      // optional: adds the co-brand line and the default handle fallback
    date: "2026-10-18",            // optional
    note: "one-line context"       // optional
  },
  platforms: ["instagram", "facebook"],   // previews to offer, first is default; supported: instagram, facebook
  concepts: [                              // each concept is one strategic ANGLE
    {
      name: "Proof-Led Concept",           // required
      tagline: "what makes this concept distinct",
      handles: [                           // optional: 1 entry = normal post, 2 = partnership handle toggle
        { name: "examplebrand", partner: "Paid partnership with examplestudio", initials: "EB" },
        { name: "Example Studio", partner: "Paid partnership with examplebrand", initials: "ES" }
      ],
      frames: [                            // 1 frame = single ad, several = carousel storyboard
        {
          label: "Hook",                   // the frame's job in the narrative arc
          prompt: "image description",     // shown as a placeholder if there's no image
          image: "images/concept-01.png",  // optional: local or relative path, or a data URI
          headline: "overlay text",        // optional per-frame overlay
          headlineTheme: "dark"            // optional: "dark" (white text) or "light"
        }
      ],
      headlines: ["variation 1", "variation 2"],   // the picked one overlays frame 1
      primaryText: "caption or body copy",
      likes: "1,000",                      // optional Instagram like count
      destination: { url: "example.com", cta: "Shop now", offer: "a real offer" },
      rollout: { title: "How the partnership ad runs", steps: ["step 1", "step 2"] },   // optional
      grounding: "What in this concept is real (required)"
    }
  ]
}
```

2 to 4 concepts is the useful range; more than that and the tabs stop being a decision.

**Frames are a storyboard:** label each by the job it does (`Hook`, `The problem`, `The proof`, `The ask`), not by what's pictured. A proof-led concept is literally Hook → Problem → Mechanism → Results → Context → Ask. Carousel arcs for social are in [social-media](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/social-media/SKILL.md).

**Images vs placeholders:** with `image`, the creative fills the frame; without it, a styled placeholder shows the label and prompt, so the page is useful before images exist. The template blocks remote and protocol-relative image URLs (including spellings the browser normalizes), so the page stays offline and can't beacon on open: download authorized assets into a local `images/` folder and keep paths relative. Hosted relative assets still load from that host. That restriction covers image sources only; it is not a sandbox for arbitrary edits to the HTML.

## Grounding is required

Every concept carries a `grounding` line, and it is true: exactly what is real (which test result, which review, whose photography) and, by omission, what is illustrative. If proof isn't real yet, the line says so ("Results shown are illustrative pending the real data"). Never present invented stats, fabricated results or stock imagery as the brand's own: "a review page that launders fiction as fact is worse than no review page." Real proof only ([SKILL.md](SKILL.md#the-rules)).

## Populating the data safely

The data block is inert JSON parsed with `JSON.parse`, so a value can never run as script. Two rules:

- **Valid JSON only:** double-quoted keys and strings, no comments, no trailing commas. A malformed block shows an error banner instead of failing silently.
- **Escape every `<` in a string value as `\u003c`.** A value containing `</script>` would otherwise close the block early. Values are HTML-escaped again at render time, but the source-level escape is the one that matters; apply it mechanically. The general rule for JSON inside a script tag is in [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/CATALOG.md#json-inside-a-script-element).

## Producing and delivering

1. Copy `assets/creative-review-template.html` into the batch folder as `review.html` (`outputs/YYYY-MM-DD/review.html`).
2. Replace the data block with the real project, with `image` paths relative to the HTML so the folder stays portable.
3. Open it in a browser and click through every concept tab, both platform and handle toggles, and every storyboard frame.
4. Hand off the folder (HTML plus `images/`) or host it on any static host.

Keep `INDEX.md` and the per-concept files as the operator's record and grounding audit trail; `review.html` sits on top of them.

## Common mistakes

Too many concepts; frames labeled by content instead of job; missing or dishonest grounding; editing the render code (if something won't show, it's a data field); absolute image paths.

## Prove it

A review page for four concepts parses (no error banner), shows every concept tab, both platforms and the handle toggle, labels frames by job, has a true grounding line per concept with illustrative proof labeled illustrative, uses placeholders for unrendered frames with relative image paths, contains no remote image URL and no real brand that isn't the client, and the delivery note says how to open, host or hand it off [coreyhaines31/marketingskills, ad-creative, evals #10].
