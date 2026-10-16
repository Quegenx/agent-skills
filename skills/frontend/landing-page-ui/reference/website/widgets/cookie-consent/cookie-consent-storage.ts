/**
 * What the visitor chose in the cookie banner.
 */
export type CookieConsentDecision = "accepted" | "denied";

interface CookieConsentStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const cookieConsentStorageKey = "app-cookie-consent";

/**
 * The visitor's stored cookie choice.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @returns accepted, denied, or null before they chose.
 */
export const getCookieConsent = (
  storage: CookieConsentStorage
): CookieConsentDecision | null => {
  const decision = storage.getItem(cookieConsentStorageKey);

  return decision === "accepted" || decision === "denied" ? decision : null;
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
  storage.setItem(cookieConsentStorageKey, decision);
};
