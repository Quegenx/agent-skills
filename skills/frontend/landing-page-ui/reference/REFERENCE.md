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

The page files (`website/pages/`, 141 rows) are in [REFERENCE-PAGES.md](REFERENCE-PAGES.md).

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
| `website/shared/layout/page/marketing-page-head.ts` | Canonical, hreflang, and Open Graph tags for a public marketing URL, and the JSON-LD script serializer | [DISCOVERY.md](../DISCOVERY.md) |
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
| `website/widgets/cookie-consent/cookie-consent-banner.tsx` | The website's cookie banner until the visitor chooses, and again when they reopen it from the footer; accepting turns analytics on (Consent Mode) | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/widgets/cookie-consent/cookie-consent-storage.ts` | What the visitor chose in the cookie banner | [SECTIONS.md](../SECTIONS.md), [DISCOVERY.md](../DISCOVERY.md) |
| `website/widgets/footer/site-footer-links.ts` | The footer's link groups: the navigation's sections, then the legal pages, in the page's language | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer-reveal.tsx` | Reveals the footer from under the page as it scrolls to the end, sized to its content | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer.styles.ts` | Class strings for site footer | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md) |
| `website/widgets/footer/site-footer.tsx` | The website's footer: the logo, the link groups and the cookie settings control | [SECTIONS.md](../SECTIONS.md), [MOTION.md](../MOTION.md), [DISCOVERY.md](../DISCOVERY.md) |
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
