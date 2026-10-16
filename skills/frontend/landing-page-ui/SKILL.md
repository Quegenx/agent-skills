---
name: landing-page-ui
description: "Builds a product's marketing website so it reads as one designed piece: its own token set and stylesheet apart from the app, a hero that assembles letter by letter, headings with a muted half, story sections built from real product screens, carousels, FAQ accordions with structured data, a closing call to action, a floating header that grows into a menu, a footer revealed from under the page, language and theme transitions, contact and help pages, a blog and legal pages. React with Motion, GSAP and CSS. Use when building or reviewing landing pages, product pages or a marketing site."
---

# Landing page UI

A marketing site is read once, scrolled fast and judged in seconds; an app is used every day. So the site gets the slow, expressive motion the app must never have (letters that land, words that rise, sections that clear from a blur), on a strict, repeatable page structure. Every page tells the same kind of story with the same building blocks; only the words and the product screens change.

| The job | Read |
|---|---|
| The site's own system: stylesheet, tokens, dark sections, type, buttons, press, theme and language before paint | [SYSTEM.md](SYSTEM.md) |
| Motion: hero sequence, letters, words, scroll reveals, header menu, footer reveal, language and theme transitions, hover details | [MOTION.md](MOTION.md) |
| Page structure and sections: hero, story panels and cards, carousels, plans, FAQ, closing call, 404 | [SECTIONS.md](SECTIONS.md) |
| Pages with function: contact form, help center and its search, blog, legal documents, on-this-page navigation | [CONTENT-PAGES.md](CONTENT-PAGES.md) |
| Being found and measured: head tags, hreflang, structured data, caching, consent and analytics | [DISCOVERY.md](DISCOVERY.md) |

The product's own screens are `app-ui`; its agent's chat is `agent-chat-ui`; durations and curves in general are `ui-animation`; what copy to put in the sections is `anti-slop-copy`.

## The rules

1. **The site is not the app.** It has its own stylesheet, tokens, reset and chrome (header, footer, cookie banner, smooth scroll, analytics), and the app's pages load none of it. Links from the site into the app are plain links, so the app arrives as a fresh document with its own styles.
2. **One page template.** Hero, then the story (the problem, what it does, how it fits, the steps, more), then the questions, then the closing call. A new page is new words and new screens in the same blocks.
3. **Show the real product.** Every claim sits beside a screen of the real app with demo data, registered once with its size so every image has width and height. Every image ships compressed as WebP (share images and the structured-data logo stay PNG for crawlers) and every video compressed as WebM (VP9 or AV1) with an H.264 fallback; the encoding settings are in the `performance-and-caching` skill's BROWSER.md. The hero screen loads with `fetchPriority="high"`; every other screen, story image and card image is `loading="lazy"` and `decoding="async"`.
4. **Every heading has two tones:** a statement and a muted part in the same sentence (or an accent line in the hero). It is the site's voice; keep it on every section.
5. **Motion is generous but finite.** The hero assembles once; sections clear from a blur as they arrive; nothing loops except one decorative background, and nothing moves under the reader's eyes while they read.
6. **Hover is a bonus, never the path.** Every hover detail (arrows that fly, icons that tilt, tiles that light, tints that deepen) runs only under `(hover: hover)` (CSS `hover:` behind the media query, pointer-enter handlers behind `matchMedia`), and the same detail starts on focus unless it is pure decoration with no meaning lost on touch.
7. **Both languages and both themes from the first frame.** Theme and language scripts run before paint; mixed-direction titles split into direction runs; arrows mirror; nothing flashes.
8. **Reduced motion keeps the page whole:** letters and words appear at once, scroll reveals and height animations are skipped, loops stop, pointer-following tilts stay still, and transitions that cover the page become instant. Read the setting reactively, not once on mount.

## Prove it

Load each page cold on a throttled phone: the hero image is the first large paint, nothing shifts as fonts and images arrive, the cookie banner does not cover the last button. Scroll fast top to bottom and back. Switch language and theme mid-page. Tab through the header menu, the FAQ and the carousel. Turn on reduced motion and read a whole page. Check the head of every page (canonical, both languages, structured data that matches what is shown).
