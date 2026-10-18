# Reference source: page files

The `website/pages/` rows of the file table in [REFERENCE.md](REFERENCE.md), moved unchanged to keep each file under the size cap. The intro, the external imports and every other file are there.

## Page files

| File | What it is | Described in |
|---|---|---|
| `website/pages/about/page/about-page.styles.ts` | Class strings for about page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/page/about-page.tsx` | The about page: hero, story, proof, values, capabilities and the closing call to action | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/sections/about-capabilities.tsx` | The about page's capabilities section: a card for each part of the product, with its screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/sections/about-cta.tsx` | The about page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/sections/about-hero.tsx` | The about page's hero, with the app's sign-up and log-in actions | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/sections/about-proof.tsx` | The about page's proof section: the steps from a goal to groups to opportunities, on the group search's screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/about/sections/about-values.tsx` | The about page's values section, a card for each value with its screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-cta.tsx` | The AI agent page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-faqs-data.ts` | The AI agent page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-faqs.tsx` | The AI agent page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-hero.tsx` | The AI agent page's hero, with the agent's chat screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-page.styles.ts` | Class strings for ai agent page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-page.tsx` | The AI agent marketing page: hero, story, FAQs and the closing call to action | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/ai-agent/ai-agent-story.tsx` | The AI agent page's story: the problem, then how the agent works and asks before it acts | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/blog/data/articles.ts` | Blog article model: rich text pieces, blocks and categories | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/data/blog-cache-policy.ts` | CDN cache policy for public blog pages | [DISCOVERY.md](../DISCOVERY.md) |
| `website/pages/blog/data/blog-data.ts` | Blog reads from the database: published articles, cover and images | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/data/posts.ts` | Blog categories and post listing | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-category-select.styles.ts` | Class strings for blog category select | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-category-select.tsx` | The blog's category picker | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-cta.tsx` | The blog's closing call to start in the app | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-hero.tsx` | The blog's hero, with the posts screen | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-page.styles.ts` | Class strings for blog page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-page.tsx` | The blog's index page: the featured post, then the recent posts by category, a page at a time | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-pagination.styles.ts` | Class strings for blog pagination | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-pagination.tsx` | The blog's page numbers with previous and next; nothing for a single page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/page/blog-recent-posts.tsx` | The blog's recent posts, stacking in as the page scrolls | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/pages/blog/page/post-card.tsx` | The blog's featured post card: its image, category, title and description | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-article-inline-text.tsx` | An article's rich text as React elements: links, code, emphasis, strong text and line breaks | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-article-list.tsx` | An article's list, ordered or not, its items of rich text | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-article-table.tsx` | An article's table, its header row and body rows of rich text | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-image-preview.styles.ts` | Class strings for blog image preview | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/pages/blog/post/blog-image-preview.tsx` | Opens a blog image in an accessible, draggable full-screen preview | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/pages/blog/post/blog-post-content.tsx` | An article's blocks as the page shows them, each revealed on scroll; headings report when they come into view | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-post-on-this-page.tsx` | A blog post's table of contents: its headings, the one in view marked | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-post-prose.styles.ts` | Class strings for a post's prose (h3, h4, strong) | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-post.styles.ts` | Class strings for blog post | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/blog-rich-text-key.ts` | A stable React key for one piece of rich text | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/post-page.styles.ts` | Class strings for post page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/post-page.tsx` | A blog post's page: its title and date, the article's blocks, and its table of contents following the heading in view | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/blog/post/split-heading-emphasis.ts` | Splits dynamic headings into a stable lead and a short tonal phrase | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/business/business-cta.tsx` | The business page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-faqs-data.ts` | The business page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-faqs.tsx` | The business page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-hero.tsx` | The business page's hero, with the opportunities screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-page.styles.ts` | Class strings for business page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-page.tsx` | The business marketing page: hero, story, FAQs and the closing call | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/business/business-story.tsx` | The business page's story: the problem, then how App finds customers in groups | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-cta.tsx` | The competitors page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-faqs-data.ts` | The competitors page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-faqs.tsx` | The competitors page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-hero.tsx` | The competitors page's hero, with the Ad Library screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-page.styles.ts` | Class strings for competitors page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-page.tsx` | The competitors marketing page: hero, story, FAQs and the closing call to action | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/competitors/competitors-story.tsx` | The competitors page's story: the problem, then how the Ad Library follows competitors' ads | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/contact/contact-page.tsx` | The contact page: its heading and the contact form | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/faq/faq-page-animated-text.tsx` | FAQ page text revealed word by word | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/faq/faq-page-data.ts` | The FAQ page's topics and their questions | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/faq/faq-page-support.tsx` | The FAQ page's support card, linking to the help center | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/faq/faq-page.styles.ts` | Class strings for faq page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/faq/faq-page.tsx` | The FAQ page: its sections by topic, with a side navigation following the one in view, then help | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/data/help-center-data.ts` | The help center's topics, each with its questions, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/data/help-center-model.ts` | Help center model: question and topic types | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/data/help-question-data.ts` | The help center's questions by topic, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/data/help-question-lookup.ts` | Lookup of every help question by topic | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/page/help-cta.tsx` | The help pages' closing call to start in the app | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/page/help-page-animated-text.tsx` | Help page text revealed word by word | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/page/help-page.styles.ts` | Class strings for help page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/page/help-page.tsx` | The help center: its search (⌘K), the topics, the common questions, and asking for help | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/page/help-request.tsx` | The help page's card for asking a person, linking to the contact page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/topic/help-topic-card.styles.ts` | Class strings for help topic card | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/pages/help/topic/help-topic-card.tsx` | A help topic's card, tilting toward the pointer on hover | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/pages/help/topic/help-topic-page.styles.ts` | Class strings for help topic page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/help/topic/help-topic-page.tsx` | A help topic's page: its questions with their answers, one open at a time, then help | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/home/business/home-business-capability-card.styles.ts` | Class strings for home business capability card | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/business/home-business-capability-card.tsx` | One of the home page's business capability cards | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/business/home-business-capability-data.ts` | What App does for a business, one card each with its features, in the page's language | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/business/home-business.styles.ts` | Class strings for the home business section | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/business/home-business.tsx` | The home page's business section: what App does for a business, as cards, with links to the business page and the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/faq/home-faq-items.ts` | Homepage FAQ pairs shown in the accordion and copied into FAQPage JSON-LD | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/pages/home/faq/home-faq.styles.ts` | Class strings for home faq | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/faq/home-faq.tsx` | The home page's FAQ, one answer open at a time | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/faq/marketing-expandable-faq-section.tsx` | Product-page FAQ heading plus expandable list inside a content section | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/hero/home-hero.styles.ts` | Class strings for home hero | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/hero/home-hero.tsx` | The home page's hero: the title revealed letter by letter, the description, the app's sign-up and log-in, and the agent's chat screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/motion/home-product-motion.tsx` | Reveals a home product badge when its product section enters view | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/home/motion/home-product-section.styles.ts` | Shared layout and typography contracts for home product sections | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/home/page/home-cta.tsx` | The home page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/page/home-page.tsx` | The home page: hero, business, personal, platform, FAQ and the closing call to action | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/page/home-structured-data.ts` | Organization, WebSite, and homepage FAQ JSON-LD for `/` | [DISCOVERY.md](../DISCOVERY.md) |
| `website/pages/home/personal/home-personal-capability-card.styles.ts` | Class strings for home personal capability card | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal-capability-card.tsx` | One of the home page's personal capability cards, linking to its page, its arrow moving on hover | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal-capability-data.ts` | What people look for in Facebook groups, each card leading to the page that shows how App finds it | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal-carousel.styles.ts` | Class strings for home personal carousel | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal-carousel.tsx` | The home personal capabilities as a sideways carousel with previous and next buttons and fading edges | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal.styles.ts` | Class strings for home personal | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/personal/home-personal.tsx` | The home page's personal section: what people find in Facebook groups, as a carousel, with links to the personal page and the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/platform/home-platform-metric-icon.tsx` | The icon of a home platform metric | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/platform/home-platform-metrics.styles.ts` | Class strings for home platform metrics | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/platform/home-platform-metrics.tsx` | The home platform section's metric cards, each revealed on scroll | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/platform/home-platform.styles.ts` | Class strings for home platform | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/home/platform/home-platform.tsx` | The home page's platform section: App as one connected product, with its metrics and a link to the about page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/legal/accessibility-document.ts` | The accessibility statement, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/account-deletion-document.ts` | How to delete an account and what deleting removes, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/cancellation-document.ts` | The cancellation and refund policy, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/legal-page-animated-words.tsx` | Legal page text revealed word by word | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/legal-page-reveal.ts` | Whether a legal page's sections reveal on scroll, given hydration and reduced motion | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/legal-page.styles.ts` | Class strings for legal page | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/legal-page.tsx` | A legal document's page: its title and intro, its sections with a side navigation following the one in view | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/legal-page.types.ts` | One section of a legal document: its anchor id, title, paragraphs and points | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/privacy-document.ts` | The privacy policy, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/legal/terms-document.ts` | The terms of use, in the page's language | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/pages/monitoring/monitoring-cta.tsx` | The monitoring page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-faqs-data.ts` | The monitoring page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-faqs.tsx` | The monitoring page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-hero.tsx` | The monitoring page's hero, with the opportunities screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-page.styles.ts` | Class strings for monitoring page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-page.tsx` | The monitoring marketing page: hero, story, FAQs and the closing call to action | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/monitoring/monitoring-story.tsx` | The monitoring page's story: the problem, then how tracking tasks keep watching, filter what they find and alert on matches | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/not-found/not-found-card.styles.ts` | Class strings for not found card | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/not-found/not-found-character-motion.ts` | The 404 character's question marks' sway, each a little behind the one before | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/not-found/not-found-head-drawing.tsx` | The 404 character's head, shared with the app's 404: eyes that blink and look side to side | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/not-found/not-found-illustration.tsx` | The website's 404 character, animated unless the visitor prefers reduced motion | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/not-found/not-found-page.styles.ts` | Class strings for not found page | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/not-found/not-found-page.tsx` | The website's 404 page: what happened, the way back home, and the illustration | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/pages/personal/personal-cta.tsx` | The personal page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-faqs-data.ts` | The personal page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-faqs.tsx` | The personal page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-hero.tsx` | The personal page's hero, with the agent's chat for a person | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-page.styles.ts` | Class strings for personal page | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-page.tsx` | The personal marketing page: hero, story, FAQs and the closing call | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/personal/personal-story.tsx` | The personal page's story: the problem, then how App finds apartments, jobs, cars and pros in groups | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-cta.tsx` | The pricing page's closing call to start in the app | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-faqs-data.ts` | The pricing page's FAQ, shown in its accordion and in its FAQPage schema | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-faqs.tsx` | The pricing page's FAQ, with show more and less | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-hero.tsx` | The pricing page's hero, with the dashboard screen | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-page.styles.ts` | Class strings for the pricing page and its plan row | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-page.tsx` | The pricing page: hero, plans, FAQ and the closing call | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-plan-card.tsx` | One plan card: audience, monthly price, what it includes and a sign-up button, on the story-card surface | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-plans-data.ts` | The plans: audience, features, name, monthly price, recommended badge | [SECTIONS.md](../SECTIONS.md) |
| `website/pages/pricing/pricing-plans.tsx` | The three plans side by side, each revealed on its own like the story cards on the product pages, with the payment note under them | [SECTIONS.md](../SECTIONS.md) |
