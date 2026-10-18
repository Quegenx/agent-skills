/**
 * What the visitor chose in the cookie banner.
 */
export type CookieConsentDecision = "accepted" | "denied";

interface CookieConsentStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/** Versioned so a future change of the stored value can move to a new key. */
export const cookieConsentStorageKey = "app-cookie-consent:v1";

/** The unversioned key earlier visits wrote; read so their choice still counts. */
export const legacyCookieConsentStorageKey = "app-cookie-consent";

/**
 * The visitor's stored cookie choice.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @returns accepted, denied, or null before they chose.
 */
export const getCookieConsent = (
  storage: CookieConsentStorage
): CookieConsentDecision | null => {
  // Storage throws when the browser blocks it (privacy settings, sandboxed
  // frames); the visitor then counts as not having chosen.
  try {
    const decision =
      storage.getItem(cookieConsentStorageKey) ??
      storage.getItem(legacyCookieConsentStorageKey);

    return decision === "accepted" || decision === "denied" ? decision : null;
  } catch {
    return null;
  }
};

/**
 * Stores the visitor's cookie choice.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @param decision - accepted or denied.
 */
export const setCookieConsent = (
  storage: CookieConsentStorage,
  decision: CookieConsentDecision
) => {
  try {
    storage.setItem(cookieConsentStorageKey, decision);
  } catch {
    // Blocked storage: the banner keeps the choice for this page view.
  }
};
