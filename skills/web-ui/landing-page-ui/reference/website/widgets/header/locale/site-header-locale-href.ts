import { deLocalizeHref, localizeHref } from "#/paraglide/runtime";

/** Locale values supported by the site header language menu. */
export type SiteHeaderLocaleValue = "en" | "he";

/**
 * Builds the equivalent page URL for a site header locale selection.
 *
 * @param currentPath - The page's path, in its current language.
 * @param locale - The language to link to.
 * @returns The same page's path in that language.
 */
export const getSiteHeaderLocaleHref = (
  currentPath: string,
  locale: SiteHeaderLocaleValue
) => localizeHref(deLocalizeHref(currentPath), { locale });

/**
 * Removes client-only fragments before building a locale URL.
 *
 * @param href - The address.
 * @returns The address without its fragment.
 */
export const removeLocaleHrefFragment = (href: string) => href.split("#", 1)[0];
