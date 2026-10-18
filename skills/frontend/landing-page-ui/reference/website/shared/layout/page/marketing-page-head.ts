import { og_image_alt } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

import { siteEnvironment } from "../../site/site-environment";

// The site's public origin (VITE_SITE_URL): canonical URLs, hreflang, Open
// Graph and structured data all start from it.
export const SITE_ORIGIN = siteEnvironment.siteUrl;

/**
 * JSON-LD as the text of a script element. JSON.stringify leaves `<` as is, so
 * a value holding `</script>` would close the tag (XSS); `<` becomes its
 * unicode escape `\u003c`, which JSON parsing turns back into `<`
 * (https://nextjs.org/docs/app/guides/json-ld).
 *
 * @param data - The structured data.
 * @returns The script's text.
 */
export const serializeJsonLdScript = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

interface MarketingPageHeadInput {
  datePublished?: string;
  description: string;
  image?: string;
  // What the share image shows (og:image:alt), for an image other than the
  // default share image.
  imageAlt?: string;
  index?: boolean;
  path: string;
  title: string;
  type?: "article" | "website";
}

/**
 * Canonical, hreflang, and Open Graph tags for a public marketing URL.
 *
 * @returns The route's head: its links, meta tags and JSON-LD scripts.
 */
export const getMarketingPageHead = ({
  datePublished,
  description,
  image,
  imageAlt,
  index = true,
  path,
  title,
  type = "website",
}: MarketingPageHeadInput) => {
  const locale = getLocale();

  const shareImage =
    image ??
    `${SITE_ORIGIN}/images/og/og-image-${locale === "he" ? "he" : "en"}.png`;

  // ogp.me: og:image:alt is "A description of what is in the image (not a
  // caption)" (https://ogp.me/).
  const shareImageAlt = imageAlt ?? og_image_alt();

  const localizedPath = path === "/" ? "" : path;
  const hebrewUrl = `${SITE_ORIGIN}${localizedPath}`;
  const englishUrl = `${SITE_ORIGIN}/en${localizedPath}`;
  const canonicalUrl = locale === "en" ? englishUrl : hebrewUrl;

  const brandedTitle = title.includes("App")
    ? title
    : `${title} – App`;

  const inLanguage = locale === "he" ? "he-IL" : "en-US";

  const structuredData = {
    "@context": "https://schema.org",
    "@id": `${canonicalUrl}/#webpage`,
    "@type": type === "article" ? "BlogPosting" : "WebPage",
    author:
      type === "article"
        ? {
            "@id": `${SITE_ORIGIN}/#organization`,
            "@type": "Organization",
            name: "App",
          }
        : undefined,
    datePublished: type === "article" ? datePublished : undefined,
    description,
    headline: type === "article" ? brandedTitle : undefined,
    image: shareImage,
    inLanguage,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    name: brandedTitle,
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    url: canonicalUrl,
  };

  return {
    links: [
      { href: canonicalUrl, rel: "canonical" },
      { href: hebrewUrl, hrefLang: "he", rel: "alternate" },
      { href: englishUrl, hrefLang: "en", rel: "alternate" },
      { href: hebrewUrl, hrefLang: "x-default", rel: "alternate" },
    ],
    meta: [
      { title: brandedTitle },
      { content: description, name: "description" },
      {
        content: index
          ? "index, follow, max-image-preview:large"
          : "noindex, follow",
        name: "robots",
      },
      // Facebook: og:title is the title "without any branding such as your
      // site name" (https://developers.facebook.com/docs/sharing/webmasters/).
      { content: title, property: "og:title" },
      { content: description, property: "og:description" },
      { content: canonicalUrl, property: "og:url" },
      { content: type, property: "og:type" },
      { content: "App", property: "og:site_name" },
      { content: locale === "he" ? "he_IL" : "en_US", property: "og:locale" },
      {
        content: locale === "he" ? "en_US" : "he_IL",
        property: "og:locale:alternate",
      },
      { content: shareImage, property: "og:image" },
      { content: shareImageAlt, property: "og:image:alt" },
      { content: "summary_large_image", name: "twitter:card" },
      { content: brandedTitle, name: "twitter:title" },
      { content: description, name: "twitter:description" },
      { content: shareImage, name: "twitter:image" },
      { content: shareImageAlt, name: "twitter:image:alt" },
    ],
    scripts: [
      {
        children: serializeJsonLdScript(structuredData),
        type: "application/ld+json",
      },
    ],
  };
};
