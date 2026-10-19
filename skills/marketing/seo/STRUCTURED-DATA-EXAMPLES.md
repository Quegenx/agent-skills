# Structured data examples

Complete JSON-LD for common types, copied from the MIT `schema` skill of coreyhaines31/marketingskills (`references/schema-examples.md`) and corrected where Google's docs disagree; each correction says what the source had. The rules behind them (required properties, retired features, review rules, escaping) are in [STRUCTURED-DATA.md](STRUCTURED-DATA.md). Replace every `example.com` value with real page data: markup must match what the page shows. [coreyhaines31/marketingskills, schema]

**Contents:** [Organization](#organization) · [WebSite](#website) · [Article](#article) · [Product](#product) · [SoftwareApplication](#softwareapplication) · [FAQPage](#faqpage) · [HowTo](#howto) · [BreadcrumbList](#breadcrumblist) · [LocalBusiness](#localbusiness) · [Event](#event) · [One graph per page](#one-graph-per-page) · [Rendering in Next.js](#rendering-in-nextjs) · [Prove it](#prove-it)

## Organization

For the home page or one page about the organization ([organization](https://developers.google.com/search/docs/appearance/structured-data/organization)). Google lists no required properties; the logo is at least 112x112px.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Company",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://twitter.com/example",
    "https://linkedin.com/company/example",
    "https://facebook.com/example"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service"
  }
}
```

## WebSite

For the site name, on the home page at the domain or subdomain root ([site names](https://developers.google.com/search/docs/appearance/site-names)). Google retired the sitelinks search box in November 2024; adding `SearchAction` cannot restore it. [coreyhaines31/marketingskills, schema]

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Example",
  "alternateName": "Example Co",
  "url": "https://example.com/"
}
```

The source had no `alternateName`; Google's site-names page recommends it, in order of preference.

## Article

For blog posts and news ([article](https://developers.google.com/search/docs/appearance/structured-data/article)). Dates carry a timezone; the author is a `Person` (or `Organization`) with a `url`.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Implement Schema Markup",
  "image": [
    "https://example.com/photos/1x1/photo.jpg",
    "https://example.com/photos/4x3/photo.jpg",
    "https://example.com/photos/16x9/photo.jpg"
  ],
  "datePublished": "2026-01-15T08:00:00+00:00",
  "dateModified": "2026-01-20T10:00:00+00:00",
  "author": {
    "@type": "Person",
    "name": "Jane Doe",
    "url": "https://example.com/authors/jane"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Example Company",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "description": "A complete guide to implementing schema markup...",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/schema-guide"
  }
}
```

The source had one `image` and 2024 dates; Google recommends several images in 16x9, 4x3 and 1x1.

## Product

For a page where customers buy (merchant listing: `name`, `image`, `offers` with a price above zero and `priceCurrency`) ([merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)). The rating is allowed only when the reviews are real and visible on this page ([review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)).

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium Widget",
  "image": "https://example.com/widget.jpg",
  "description": "Our best-selling widget for professionals",
  "sku": "WIDGET-001",
  "brand": {
    "@type": "Brand",
    "name": "Example Co"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/widget",
    "priceCurrency": "USD",
    "price": "99.99",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2027-12-31"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

The source had `"priceValidUntil": "2024-12-31"`; Google: "Your product snippet may not display if the `priceValidUntil` property indicates a past date" ([product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)). Keep the date in the future or leave it out.

## SoftwareApplication

For SaaS and app pages ([software app](https://developers.google.com/search/docs/appearance/structured-data/software-app)). Google requires `aggregateRating` or `review`, plus `offers.price` (`0` when free); without a real rating there is no software rich result, and a made-up one breaks the review rules.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Example App",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "ratingCount": "1250"
  }
}
```

## FAQPage

Semantic markup for visible questions when a consumer other than Google needs it. Google stopped showing FAQ rich results on May 7, 2026; this cannot bring back expandable results. Use the Schema.org Validator, and don't treat missing Rich Results Test detection as a failure. Use the page's real questions and answers, never invented ones. [coreyhaines31/marketingskills, schema]

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is schema markup?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Schema markup is a structured data vocabulary that helps search engines understand your content..."
      }
    },
    {
      "@type": "Question",
      "name": "How do I implement schema?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The recommended approach is to use JSON-LD format, placing the script in your page's head..."
      }
    }
  ]
}
```

## HowTo

Semantic markup for a tutorial when a consumer needs it. Google retired HowTo rich results in September 2023; this does not restore them. [coreyhaines31/marketingskills, schema]

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Add Schema Markup to Your Website",
  "description": "A step-by-step guide to implementing JSON-LD schema",
  "totalTime": "PT15M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Choose your schema type",
      "text": "Identify the appropriate schema type for your page content...",
      "url": "https://example.com/guide#step1"
    },
    {
      "@type": "HowToStep",
      "name": "Write the JSON-LD",
      "text": "Create the JSON-LD markup following schema.org specifications...",
      "url": "https://example.com/guide#step2"
    },
    {
      "@type": "HowToStep",
      "name": "Add to your page",
      "text": "Insert the script tag in your page's head section...",
      "url": "https://example.com/guide#step3"
    }
  ]
}
```

## BreadcrumbList

For a page with a visible breadcrumb trail ([breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)): at least two items, following a typical user path rather than the URL. The last item may leave out `item`; Google then uses the page's own URL.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://example.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SEO Guide"
    }
  ]
}
```

The source's last item also carried `"item": "https://example.com/blog/seo-guide"`, which is allowed; Google: "If the breadcrumb is the last item ... `item` is not required".

## LocalBusiness

For a location page ([local business](https://developers.google.com/search/docs/appearance/structured-data/local-business)). Swap `LocalBusiness` for the most specific sub-type that fits the business.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Example Coffee Shop",
  "image": "https://example.com/shop.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Example City",
    "addressRegion": "CA",
    "postalCode": "94102",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "37.77493",
    "longitude": "-122.41942"
  },
  "telephone": "+1-555-555-5555",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00:00",
      "closes": "18:00:00"
    }
  ],
  "priceRange": "$$"
}
```

The source had four-decimal coordinates ("37.7749") and "08:00"; Google wants at least 5 decimal places and hh:mm:ss.

## Event

For an event people attend in person and the public can book ([event](https://developers.google.com/search/docs/appearance/structured-data/event)).

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Annual Marketing Conference",
  "startDate": "2027-06-15T09:00:00-07:00",
  "endDate": "2027-06-15T17:00:00-07:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "Example Conference Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "100 Example Avenue",
      "addressLocality": "Example City",
      "addressRegion": "CA",
      "postalCode": "94102",
      "addressCountry": "US"
    }
  },
  "image": "https://example.com/conference.jpg",
  "description": "Join us for our annual marketing conference...",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/conference/tickets",
    "price": "199",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "validFrom": "2027-01-01"
  },
  "organizer": {
    "@type": "Organization",
    "name": "Example Company",
    "url": "https://example.com"
  }
}
```

The source's example was a webinar with `"eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode"` and a `VirtualLocation`; Google: "Virtual experiences that have no real-world component aren't supported." An online-only event can keep that schema.org markup for other consumers.

## One graph per page

This example uses the source's organization convention: one script, one `@graph`, everything referenced by absolute `@id`. That convention is not a universal validity requirement; use the existing qualifications for [script placement](STRUCTURED-DATA.md#format-and-placement) and [expanded identity and relative identifiers](STRUCTURED-DATA.md#one-identity-across-pages). The `WebPage` id changes per page; the `WebSite` and `Organization` ids never do. [squirrelscan]

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://example.com/about#webpage",
      "url": "https://example.com/about",
      "name": "About",
      "isPartOf": { "@id": "https://example.com/#website" },
      "about": { "@id": "https://example.com/#organization" }
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com/",
      "publisher": { "@id": "https://example.com/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example Ltd",
      "url": "https://example.com/",
      "logo": "https://example.com/logo.png",
      "sameAs": [
        "https://www.linkedin.com/company/example",
        "https://github.com/example"
      ]
    }
  ]
}
```

## Rendering in Next.js

Per the [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld) (`app/products/[id]/page.js`): a native `<script>` rendered in `layout.js` or `page.js`, with every `<` escaped after `JSON.stringify`.

```jsx
export default async function Page({ params }) {
  const { id } = await params
  const product = await getProduct(id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
  }

  return (
    <section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* page content */}
    </section>
  )
}
```

The source wrapped the script in `<Head>`; the guide renders it in the page or layout component. Build ids from one site-origin setting so they cannot drift between environments. [squirrelscan]

## Prove it

- **Each example validates:** pasted into the Schema.org Validator with real values, every block above parses with no errors.
- **Google features pass by URL:** a deployed page using the Article, Product, SoftwareApplication, BreadcrumbList, LocalBusiness or Event block passes the Rich Results Test by URL with no required-property errors.
- **Dates describe the real offer/event:** check price expiry and event timing/status separately. validFrom is when tickets go on sale, so a past sale-start date can correctly describe a current offer. This file formerly required validFrom never to be in the past; do not move the actual date forward to satisfy that check. [Google Event offers.validFrom](https://developers.google.com/search/docs/appearance/structured-data/event); [Schema.org validFrom](https://schema.org/validFrom)
- **No placeholders shipped:** a search of the built site for `example.com`, `Example Company` and `555-555` returns nothing.
- **Escaping:** a product name containing `</script>` renders inside the JSON-LD as `\u003c/script>`, and the page's DOM has exactly one `application/ld+json` script for that block.
