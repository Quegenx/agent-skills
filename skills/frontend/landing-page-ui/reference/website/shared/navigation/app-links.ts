import { localizeHref } from "#/paraglide/runtime";

import { trackAnalyticsEvent } from "../site/google-analytics";

/**
 * The product's entry pages (routes/app/_auth), in the page's language
 * (/en/app/… in English): every sign-up and log-in button on the website
 * leads to one of these. They are plain links, not router navigations, so
 * the visitor arrives on a fresh app document (its own stylesheet) rather
 * than inside the website's.
 *
 * @returns The sign-up page's address.
 */
export const appSignUpHref = () => localizeHref("/app/signup");

/**
 * The log-in page's address, in the page's language.
 *
 * @returns The address.
 */
export const appLoginHref = () => localizeHref("/app/login");

/**
 * Records which button sent a visitor to the app, and from which page.
 *
 * @param action - Which button: sign up or log in.
 * @returns Nothing; it sends the event.
 */
export const trackAppEntryClick = (action: "sign_up" | "log_in") => {
  trackAnalyticsEvent("app_entry_clicked", {
    action,
    cta_location: window.location.pathname,
  });
};
