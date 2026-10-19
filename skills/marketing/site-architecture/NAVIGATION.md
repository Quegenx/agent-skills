# Navigation

Navigation patterns for headers, footers, sidebars, breadcrumbs and mobile, from coreyhaines31/marketingskills' `site-architecture` (MIT, references/navigation-patterns.md), copied where quoted, with Google's crawlable-links doc and the WAI-ARIA breadcrumb pattern where they apply. The owner's own marketing header and footer are a house pattern with their own rules ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)); where the source disagrees, both views are below and the house pattern wins on those sites. Responsive navigation forks for app screens are in [modern-css RESPONSIVE-FORKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/modern-css/RESPONSIVE-FORKS.md#6-complex-navigation).

## Navigation types

| Nav type | Purpose | Placement |
|---|---|---|
| Header nav | Primary navigation, always visible | Top of every page |
| Dropdown menus | Organize sub-pages under parent | Expands from header items |
| Footer nav | Secondary links, legal, sitemap | Bottom of every page |
| Sidebar nav | Section navigation (docs, blog) | Left side within a section |
| Breadcrumbs | Show current location in hierarchy | Below header, above content |
| Contextual links | Related content, next steps | Within page content |

## Header

[coreyhaines31/marketingskills, site-architecture] Rules for the primary header:

- **4-7 items max** in the primary nav (the source: more causes decision paralysis).
- **CTA button rightmost** ("Start Free Trial", "Get Started"), visually distinct.
- **Logo links to the homepage,** on the left.
- **Order by priority:** most important or most visited first.
- **Active page** gets a visual indicator (underline, bold, colour). For assistive tech, the current link carries `aria-current="page"`, as the owner's menu does ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)).

Simple header (4 to 6 items), for small businesses, simple SaaS and portfolios:

```
[Logo]   Features   Pricing   Blog   About   [CTA Button]
```

Mega menu header, for SaaS with many features, e-commerce categories and large content sites:

```
[Logo]   Product ▾   Solutions ▾   Resources ▾   Pricing   Docs   [CTA]
```

Mega menu rules: 2 to 4 columns max (the source's SKILL.md says 3 to 4); group items logically (feature area, use case or audience); a "See all" link at the bottom; no dropdowns nested inside a mega menu; descriptions when labels alone aren't clear.

Split navigation, for apps with both marketing and product nav: page links on the left, authentication actions (Login, Sign Up) on the right.

```
[Logo]   Features   Pricing   Blog        [Login]   [Sign Up]
```

**Where the house pattern differs.** The source lists "Hidden primary nav: burying important pages in hamburger menus on desktop" as an anti-pattern. The owner's header puts its navigation in section cards opened from the bar: "The menu grows out of the bar: closed, the nav is the bar's height" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)); read that file for which links show at which width on the owner's sites.

## Footer

[coreyhaines31/marketingskills, site-architecture] Group links into 3 to 5 themed columns:

- **Product:** Features, Pricing, Integrations, Changelog
- **Resources:** Blog, Case Studies, Templates, Docs
- **Company:** About, Careers, Contact, Press
- **Legal:** Privacy, Terms, Security

Variants: a **column footer** for most sites; a **minimal footer** (logo, copyright, Privacy, Terms, Contact) for simple sites and landing pages; an **expanded footer** for sites that use it for comparison, location and resource links. The owner's sites feed one navigation list to both the header menu and the footer, with the footer groups being the nav sections plus Legal: "One list of navigation items (title, description, two icon styles, address) feeds both the header menu and the footer" ([landing-page-ui MOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/MOTION.md#the-floating-header)).

## Sidebars

[coreyhaines31/marketingskills, site-architecture]

**Documentation sidebar,** persistent on the left with collapsible sections: current page highlighted; sections collapsible, with the active section expanded by default; search at the top; "Previous / Next" navigation at the bottom of the content; sticky on scroll.

```
Getting Started
  ├── Installation
  ├── Quick Start
  └── Configuration
Guides
  ├── Authentication
  └── Deployment
API Reference
  ├── REST API
  └── GraphQL
Changelog
```

**Blog sidebar:** categories with counts, popular posts, a newsletter signup.

## Breadcrumbs

[coreyhaines31/marketingskills, site-architecture]

```
Home > Features > Analytics
Home > Blog > SEO Category > How to Do Keyword Research
Home > Docs > API Reference > Authentication
```

- One separator, `>` or `/`, used consistently.
- Every segment is a link except the current page.
- The source shows the current page as plain text and says to drop it "if the title is already visible as an H1". The WAI-ARIA pattern links the current page with `aria-current="page"`, and "If the element representing the current page is not a link, aria-current is optional" ([APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)). Wrap the trail in a labelled nav landmark ([web-accessibility SEMANTICS-AND-ARIA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SEMANTICS-AND-ARIA.md#landmarks-and-headings)).
- The trail follows a typical user path, not necessarily the URL ([URLS-AND-LINKS.md](URLS-AND-LINKS.md#breadcrumbs)).

The source's JSON-LD (it recommends JSON-LD over microdata), where the last item omits `item` and Google uses the page's own URL:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Features", "item": "https://example.com/features" },
    { "@type": "ListItem", "position": 3, "name": "Analytics" }
  ]
}
```

Serializing it safely and tying it into the page's graph: [seo STRUCTURED-DATA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/STRUCTURED-DATA.md).

## Mobile

[coreyhaines31/marketingskills, site-architecture]

**Hamburger menu:** icon top-right or top-left; full-screen or slide-out panel; the CTA visible without opening the menu (sticky header); search reachable from the menu; an accordion for nested items.

**Bottom tab bar,** for web apps, PWAs and mobile-first products: 3 to 5 items; icons plus labels, not icons alone; a clear active state; the most important action in the centre.

## Anti-patterns

[coreyhaines31/marketingskills, site-architecture]

- **Too many header items** (8+): decision paralysis, unreadable on smaller screens.
- **Dropdown inception:** dropdowns inside dropdowns inside dropdowns.
- **Mystery icons:** icons without labels. Icon-only controls also need an accessible name ([web-accessibility SEMANTICS-AND-ARIA.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SEMANTICS-AND-ARIA.md#accessible-names)).
- **Inconsistent nav between pages:** the nav should be identical across the site, except app versus marketing.
- **No mobile consideration:** a desktop nav that doesn't translate to mobile.
- **Footer as sitemap dump:** 50+ links in the footer with no organization.

| Problem | Fix |
|---|---|
| Too many nav items | Group into dropdowns or mega menus |
| Users can't find pages | Add search, improve labeling |
| High bounce from nav | Simplify choices, use clearer labels |
| SEO pages not linked | Add to footer or resource sections |
| Mobile nav is broken | Test on real devices, use hamburger pattern |

## Crawlable navigation

Google crawls links that are `<a>` elements with an `href`, including ones inserted by JavaScript; it does not recommend `javascript:` hrefs or `<a>` without `href`, and suggests checking the rendered HTML with the URL Inspection Tool ([links-crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)). The source said "Don't use JavaScript-only nav"; the rule is real `<a href>` links, however they are rendered. Use descriptive labels ("Analytics Features" rather than "Features") [coreyhaines31/marketingskills, site-architecture].

The source also claims "Header nav links are strongest" and "Footer links pass less value"; Google's link documentation says nothing about navigation zones, so treat these as the source's belief, not a ranking fact.

## Prove it

The header has a logo linking home, items in priority order, the CTA last and the current page marked with `aria-current="page"`; no dropdown nests another; every icon in the nav has a visible label or an accessible name; the breadcrumb sits in a labelled `nav`, links every segment but the current one, and its JSON-LD validates in the Rich Results Test; the URL Inspection Tool's rendered HTML shows every nav link as an `<a href>`; on the owner's sites, the header and footer match landing-page-ui's pattern, not this file's generic one.
