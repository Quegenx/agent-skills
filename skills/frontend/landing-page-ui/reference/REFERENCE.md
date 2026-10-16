# Reference source

The production source this skill was written from. Copy these files as they are: they are the exact design, motion and behaviour the skill describes. Imports outside this folder (i18n messages, data atoms, server calls) are the app's own; replace them with yours.

Paths keep the app's layout below `src/`: `website/` is the marketing site (document, shared, widgets, features, pages) and `routes/(website)/` and `routes/(legal)/` are its TanStack Router file routes. The brand name is replaced with `App` / `app` throughout, and the production origin with `https://example.com`. All visible copy comes from Paraglide message functions (`#/paraglide/messages`), so the page files hold structure, motion and layout, not text.

## External imports

Packages (versions from the source package.json):

| Package | Version | Used for |
|---|---|---|
| `react`, `react-dom` | ^19.3.1 | Components, portals |
| `motion` (`motion/react`, `motion/react-m`) | ^14.3.0 | Entrances, reveals, springs, layout, LazyMotion |
| `gsap` | ^3.15.0 | Header menu growth and card fade (`site-header-menu-motion.ts`) |
| `lenis` (`lenis/react`) | ^1.3.27 | Smooth scrolling |
| `@radix-ui/react-select` | ^2.4.1 | Blog category select |
| `@hugeicons/react` | ^1.1.10 | Icon component |
| `@hugeicons-pro/core-stroke-rounded`, `@hugeicons-pro/core-duotone-rounded` | ^4.3.4 | Icons |
| `@tanstack/react-router`, `@tanstack/react-start` | ^1.170.44, ^1.169.2 | Routes, links, head, server functions |
| `@tanstack/react-router-devtools`, `@tanstack/react-devtools` | ^1.167.2, ^0.10.13 | Devtools in the document (development only) |
| `effect` | 4.0.5 | Schemas (environment, blog rows, contact input), the contact server call, `effect/Function` |
| `torph` (`torph/react`) | ^0.1.3 | Morphing text |
| `cn` (`cn`, `cn/config`) | ^0.4.0 | Class merging behind `site-class-merge.ts` |
| `tailwindcss` | ^4.3.3 | `website.css` imports its theme and utilities layers |
| `@inlang/paraglide-js` | ^2.29.0 | Generates `#/paraglide/messages` and `#/paraglide/runtime` |

App modules not copied (replace with yours):

| Import | What it is |
|---|---|
| `#/paraglide/messages`, `#/paraglide/runtime` | Generated i18n message functions, locale and localized URLs |
| `backend/shared/text/non-empty-text` | `isNonEmptyText` guard |
| `backend/shared/schema/standard-schema` | Standard Schema adapter for the contact form's server input |
| `backend/shared/supabase/supabase-service-database` | Server-side Supabase client the contact form writes with |
| `@/server/runtime/app-runtime.server`, `@/server/runtime/supabase-query` | Server runtime and query helper behind the contact form |
| `@/lib/split-text-graphemes` | Splits a word into graphemes for the title letters |
| `@/lib/route-not-found-exit` | Not-found handling shared by routes |
| `lib/css-custom-property-style` | Typed inline style for CSS custom properties |
| `styles/base/theme-transition.css` | The theme cross-fade shared with the app |
| `routes/__root.tsx` | The root route that renders `SiteDocument` and applies its classes |

Public assets referenced by path, not copied: `/fonts/ploni/*.woff2` (the site's licensed font), `/brand/app-logo.webp`, `/images/product/*.webp` (screens of the app, sizes in `product-screens.ts`).

## Files

| File | What it is | Described in |
|---|---|---|
| `routes/(legal)/accessibility.tsx` | Route /accessibility: head tags and the page component | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [DISCOVERY.md](../DISCOVERY.md) |
| `routes/(legal)/account-deletion.tsx` | Route /account-deletion: head tags and the page component | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [DISCOVERY.md](../DISCOVERY.md) |
| `routes/(legal)/cancellation-refund-policy.tsx` | Route /cancellation-refund-policy: head tags and the page component | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [DISCOVERY.md](../DISCOVERY.md) |
| `routes/(legal)/privacy-policy.tsx` | Route /privacy-policy: head tags and the page component | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [DISCOVERY.md](../DISCOVERY.md) |
| `routes/(legal)/terms-of-service.tsx` | Route /terms-of-service: head tags and the page component | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [DISCOVERY.md](../DISCOVERY.md) |
| `routes/(website)/about.tsx` | Route /about: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/ai-agent.tsx` | Route /ai-agent: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/blog.tsx` | Route /blog: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/blog_.$slug.tsx` | Route /blog/$slug: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/business.tsx` | Route /business: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/competitors.tsx` | Route /competitors: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/contact.tsx` | Route /contact: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/faq.tsx` | Route /faq: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/help.tsx` | Route /help: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/help_.$topic.tsx` | Route /help/$topic: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/index.tsx` | Route /: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/monitoring.tsx` | Route /monitoring: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/personal.tsx` | Route /personal: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `routes/(website)/pricing.tsx` | Route /pricing: head tags and the page component | [DISCOVERY.md](../DISCOVERY.md), [SECTIONS.md](../SECTIONS.md) |
| `website/document/site-document-styles.ts` | The website's <html> and <body> classes | [SYSTEM.md](../SYSTEM.md) |
| `website/document/site-document.tsx` | The website's document: scripts that run before paint (analytics, stored locale transition, theme) | [SYSTEM.md](../SYSTEM.md) |
| `website/document/website.css` | The website's own stylesheet: Tailwind layers, tokens, dark sections, fonts, reset | [SYSTEM.md](../SYSTEM.md) |
| `website/features/contact-form/contact-field.tsx` | One of the contact form's fields | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/contact-form/contact-form-api.ts` | The contact form's server call: input schema, email check and the insert | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/contact-form/contact-form.styles.ts` | Class strings for contact form | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/contact-form/contact-form.tsx` | The website's contact form: name, email and message, checked as typed, with the fields vanishing once the message is sent | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/contact-form/contact-submit-button.tsx` | The contact form's send button: label turns to sending, then to success with a check and the success color | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/features/contact-form/contact-tile-pattern.tsx` | Renders the contact background as individually hover-reactive SVG tiles | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/features/help-search/help-search-close-button.tsx` | The help search's close button | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search-close.ts` | The help search dialog's lifetime: scroll lock and input focus while open, fade out on close | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search-group.tsx` | One result of the help search: a question or a topic, with its category and link | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search-icons.tsx` | A help search result's icon: a book for a topic, a question mark for a question | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search-results.ts` | The help search's matching and result list | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search.styles.ts` | Class strings for help search | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/features/help-search/help-search.tsx` | The help center's search dialog: questions and topics matched as the person types, keyboard and pointer selection | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
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
| `website/shared/layout/content/article-prose.styles.ts` | Shared reading rhythm for long-form legal and editorial content | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/content/inline-content-link.styles.ts` | Class strings for inline content link | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/content/support-content-card.tsx` | A support call to action (FAQ's still need help, help center's request): heading, link and an app screen | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/content/support-content-heading.tsx` | Renders the shared heading lockup used by support calls to action | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/content/support-content-link.tsx` | A support card's link: its text and a circled arrow that moves on hover | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/content/support-content.styles.ts` | Shared typography and layout for support calls to action and guide copy | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/layout/hero/marketing-hero-brand-eyebrow.tsx` | App mark plus label used as the product-hero eyebrow | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/hero/marketing-hero-content.styles.ts` | Class strings for marketing hero content | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/hero/marketing-hero-content.tsx` | A marketing hero's content: the eyebrow, the two-line title, the description, the actions and the media, revealed in turn | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/hero/marketing-product-hero-media.tsx` | Product-hero illustration slot: panel plus centered product visual | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/hero/marketing-product-hero.styles.ts` | Class strings for marketing product hero | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/hero/marketing-product-hero.tsx` | Product-page hero: app sign-up/log-in, brand eyebrow, and media slot | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/page/back-navigation.styles.ts` | Shared accessible back-link treatment for marketing content routes | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/page/faq-page-json-ld.ts` | FAQPage JSON-LD built from the FAQ items a page shows | [DISCOVERY.md](../DISCOVERY.md) |
| `website/shared/layout/page/marketing-app-actions.tsx` | Sign-up and log-in buttons into the app, for heroes and CTAs | [SECTIONS.md](../SECTIONS.md), [SYSTEM.md](../SYSTEM.md) |
| `website/shared/layout/page/marketing-content-section.styles.ts` | Class strings for marketing content section | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/page/marketing-content-section.tsx` | A marketing page's content section: its centered inner column, with the first section's spacing when it opens the page | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/page/marketing-motion-page.tsx` | A marketing page's main element, with motion's features loaded once for the page | [MOTION.md](../MOTION.md) |
| `website/shared/layout/page/marketing-page-head.ts` | Canonical, hreflang, and Open Graph tags for a public marketing URL | [DISCOVERY.md](../DISCOVERY.md) |
| `website/shared/layout/page/marketing-page-header.tsx` | Provides the shared semantic and responsive header shell for marketing pages | [DISCOVERY.md](../DISCOVERY.md) |
| `website/shared/layout/page/marketing-page.styles.ts` | Shared page chrome used by marketing, support, and legal routes | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/layout/page/marketing-section.tsx` | Shared outer shell for full-width marketing page sections | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/motion/animated-section-heading-text.styles.ts` | Class strings for animated section heading text | [MOTION.md](../MOTION.md) |
| `website/shared/motion/animated-section-heading-text.tsx` | Section H2 word reveal with its muted second tone | [MOTION.md](../MOTION.md) |
| `website/shared/motion/animated-title-text.styles.ts` | Class strings for animated title text | [MOTION.md](../MOTION.md) |
| `website/shared/motion/animated-title-text.tsx` | Page title letter-by-letter elastic entrance and hover squash | [MOTION.md](../MOTION.md) |
| `website/shared/motion/animated-word-reveal.tsx` | Reveals localized text word by word while preserving its original whitespace | [MOTION.md](../MOTION.md) |
| `website/shared/motion/scroll-reveal.tsx` | Blur and fade reveal that repeats as content enters the viewport | [MOTION.md](../MOTION.md) |
| `website/shared/navigation/app-links.ts` | The app's sign-up and log-in addresses in the page's language, used by every app button | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/navigation/section-navigation-observer.ts` | Viewport threshold for the on-this-page rail's section tracking | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/navigation/side-section-navigation.styles.ts` | Class strings for side section navigation | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/navigation/side-section-navigation.tsx` | On-this-page rail with a shared sliding active indicator | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/navigation/site-navigation-items.ts` | The website's navigation: sections and links with titles, descriptions and icons | [MOTION.md](../MOTION.md) |
| `website/shared/site/google-analytics.ts` | Sends one Google Analytics event, when the tag is loaded; nothing during server rendering | [DISCOVERY.md](../DISCOVERY.md) |
| `website/shared/site/product-screen-image.tsx` | A screen of the app at its own size; decorative unless alt describes it | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/site/product-screens.ts` | A screenshot of the app the website shows: its file and size | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/site/site-environment.ts` | The website's public settings (VITE_* env), decoded and checked at build | [DISCOVERY.md](../DISCOVERY.md) |
| `website/shared/styles/button-press.ts` | Shared press feedback for buttons and button-like links | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/directional-arrow.styles.ts` | Mirrors directional arrow controls in right-to-left documents | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/document-foundation.ts` | Class strings for the document base (html, body) | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/layouts.ts` | Shared layout class strings (centered column sections) | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/site-class-merge.ts` | Merges the website's class strings so a later style replaces earlier values of the same property | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/surfaces.ts` | Shared elevation and outline treatments for reusable interface surfaces | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/styles/typography.ts` | Shared type class strings (screen-reader-only text and the type scale) | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/ui/accordion/accordion-item.tsx` | One accordion row's content: its question, answer and anchor id | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/accordion-list-resizer.styles.ts` | Shared height-transition shell for expandable FAQ lists | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/accordion-list-resizer.tsx` | Animates an accordion list's height as rows are shown or hidden, clipping while it moves | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/accordion-open-item.ts` | One open row at a time: a row's toggle opens it, or closes it when it is the open one. -1 is no open row | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/accordion.styles.ts` | Class strings for accordion | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/expandable-faq-list.styles.ts` | Class strings for expandable faq list | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/expandable-faq-list.tsx` | Shared FAQ rows, open-row push motion, and show-more resizer | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/accordion/marketing-faq-section.tsx` | Shared structure for product-page FAQ sections | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/brand/app-lockup.styles.ts` | Class strings for the logo lockup | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/ui/brand/app-lockup.tsx` | The logo mark and live-text wordmark, in default and onDark tones | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/ui/button/button.styles.ts` | Class strings for the button's sizes and tones | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/ui/button/button.tsx` | The website's button: size and tone recipes, press feedback | [SYSTEM.md](../SYSTEM.md) |
| `website/shared/ui/form-controls/clear-input-button.styles.ts` | Class strings for clear input button | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/clear-input-button.tsx` | Clears a populated text field without moving focus away from that field | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/smooth-caret-field.styles.ts` | Class strings for smooth caret field | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/smooth-caret-fields.tsx` | Keeps the native input behavior while springing its visual caret between positions | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/smooth-caret-lifecycle.ts` | Props shared by native fields that render the smooth-caret overlay | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/smooth-caret-position.ts` | Moves one axis of the smooth caret: jumping there at once when snapping, otherwise letting its spring follow | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/smooth-caret-textarea-position.ts` | Where a textarea's smooth caret goes: the mirrored marker's place minus the scroll, and whether that is inside the visible box | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/vanishing-input-canvas.ts` | The vanish canvas's size for a field, at the canvas's scale | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/vanishing-input-overlay.styles.ts` | Class strings for vanishing input overlay | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/vanishing-input-overlay.tsx` | The canvas over a field that turns its text into particles and sweeps them away, then reports it is done | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/form-controls/vanishing-input-particles.ts` | One particle of a vanishing input's text: its color, size and place | [CONTENT-PAGES.md](../CONTENT-PAGES.md), [MOTION.md](../MOTION.md) |
| `website/shared/ui/hover-arrow/hover-arrow-track.styles.ts` | Shared track and circular control for the dual hover arrow | [MOTION.md](../MOTION.md) |
| `website/shared/ui/hover-arrow/hover-arrow-track.tsx` | Hover and focus state that drives the dual outgoing/incoming arrow | [MOTION.md](../MOTION.md) |
| `website/shared/ui/market-card/product-market-card.tsx` | A product card: its label, title, description and feature tokens, revealed on scroll | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/ui/market-card/product-market-data.ts` | A product card's content: its label, title, description and feature tokens | [SECTIONS.md](../SECTIONS.md) |
| `website/shared/ui/select-menu/select-menu.styles.ts` | Shared structure and interaction states for Radix select menus | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/shared/ui/select-menu/select-menu.tsx` | Radix select popover: end aligned, floating menu viewport | [CONTENT-PAGES.md](../CONTENT-PAGES.md) |
| `website/widgets/app-start-cta/app-start-cta.styles.ts` | Class strings for app start cta | [SECTIONS.md](../SECTIONS.md) |
| `website/widgets/app-start-cta/app-start-cta.tsx` | The closing panel of a page: heading, what happens next, the app's sign-up and log-in, and an app screen | [SECTIONS.md](../SECTIONS.md) |
| `website/widgets/cookie-consent/cookie-consent-banner.styles.ts` | Class strings for cookie consent banner | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/widgets/cookie-consent/cookie-consent-banner.tsx` | The website's cookie banner until the visitor chooses; accepting turns analytics on (Consent Mode) | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/widgets/cookie-consent/cookie-consent-storage.ts` | What the visitor chose in the cookie banner | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/widgets/footer/site-footer-links.ts` | The footer's link groups: the navigation's sections, then the legal pages, in the page's language | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer-reveal.tsx` | Reveals the footer from under the page as it scrolls to the end, sized to its content | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer.styles.ts` | Class strings for site footer | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer.tsx` | The website's footer: the logo and the link groups | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header-card.tsx` | One section of the header menu as a card of links, the current page marked | [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header-logo.tsx` | The header's logo, its wordmark hidden on phones | [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header-menu-motion.ts` | The header menu's GSAP motion: the nav grows to its cards' height, cards fade up in turn | [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header-settings-card.tsx` | The header menu's settings card: the language choice, each linking to this page in that language | [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header.styles.ts` | Class strings for the header bar and menu | [MOTION.md](../MOTION.md) |
| `website/widgets/header/bar/site-header.tsx` | The website's header: logo, menu with navigation cards and settings, theme switch, app actions | [MOTION.md](../MOTION.md) |
| `website/widgets/header/locale/site-header-locale-href.ts` | Locales of the language menu and the address of this page in each | [MOTION.md](../MOTION.md), [SYSTEM.md](../SYSTEM.md) |
| `website/widgets/header/locale/site-header-locale-mark.styles.ts` | Class strings for site header locale mark | [MOTION.md](../MOTION.md), [SYSTEM.md](../SYSTEM.md) |
| `website/widgets/header/locale/site-header-locale-mark.tsx` | The flag drawn for the language picker | [MOTION.md](../MOTION.md), [SYSTEM.md](../SYSTEM.md) |
| `website/widgets/header/locale/site-header-locale-transition.styles.ts` | Class strings for site header locale transition | [MOTION.md](../MOTION.md), [SYSTEM.md](../SYSTEM.md) |
| `website/widgets/header/locale/site-header-locale-transition.tsx` | The language switch curtain: columns cover, the locale changes, columns reveal | [MOTION.md](../MOTION.md), [SYSTEM.md](../SYSTEM.md) |
| `website/widgets/header/theme/site-header-theme-switcher.styles.ts` | Class strings for site header theme switcher | [SYSTEM.md](../SYSTEM.md), [MOTION.md](../MOTION.md) |
| `website/widgets/header/theme/site-header-theme-switcher.tsx` | The header's light and dark switch, its sun morphing into a moon | [SYSTEM.md](../SYSTEM.md), [MOTION.md](../MOTION.md) |
| `website/widgets/header/theme/site-theme-icon.tsx` | The sun that morphs into a moon: the website header's theme switcher draws it | [SYSTEM.md](../SYSTEM.md), [MOTION.md](../MOTION.md) |
| `website/widgets/header/theme/site-theme.ts` | The website's color theme: stored choice, system preference, applying it before paint | [SYSTEM.md](../SYSTEM.md), [MOTION.md](../MOTION.md) |
| `website/widgets/marketing-story/marketing-story.styles.ts` | Class strings for story headers, panels, cards and lists | [SECTIONS.md](../SECTIONS.md) |
| `website/widgets/marketing-story/marketing-story.tsx` | A story section: its two-tone heading over a panel, cards or list | [SECTIONS.md](../SECTIONS.md) |
