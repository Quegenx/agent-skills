import { getLocale } from "#/paraglide/runtime";

// The app's languages (paraglide's locales: project.inlang/settings.json).
export const appLocales = ["he", "en"] as const;

/**
 * A language the app is written in, one of appLocales.
 */
export type AppLocale = (typeof appLocales)[number];

/**
 * The Intl locale for the page's language: numbers, dates and relative times
 * follow the app's language (paraglide's getLocale). Call it when formatting,
 * never at module load: on the server one module serves requests in both
 * languages.
 *
 * @returns he-IL or en-US.
 */
export const appIntlLocale = () => (getLocale() === "en" ? "en-US" : "he-IL");
