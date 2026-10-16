/**
 * The website's color theme.
 */
export type SiteTheme = "dark" | "light";

/**
 * What the person chose: a theme, or "system" to follow the device's, which
 * is what an unsaved choice does (the bootstrap script and
 * initializeSiteTheme).
 */
export type SiteThemePreference = SiteTheme | "system";

interface SiteThemeRoot {
  classList: Pick<DOMTokenList, "toggle">;
  dataset: { theme?: string; themeTransition?: string };
  style: { colorScheme: string };
}

interface SiteThemeTransitionDocument {
  documentElement: SiteThemeRoot;
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
}

const siteThemeStorageKey = "app-site-theme";

const themeListeners = new Set<() => void>();

export const siteThemeBootstrapScript = `(()=>{let stored=null;try{stored=localStorage.getItem(${JSON.stringify(siteThemeStorageKey)})}catch{}const theme=stored==="dark"||stored==="light"?stored:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";const root=document.documentElement;root.classList.toggle("dark",theme==="dark");root.dataset.theme=theme;root.style.colorScheme=theme})()`;

/**
 * The theme the visitor chose, as stored; null when they chose none or storage
 * is unavailable.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @returns The stored theme, or null.
 */
export const readStoredSiteTheme = (
  storage: Pick<Storage, "getItem">
): SiteTheme | null => {
  try {
    const storedTheme = storage.getItem(siteThemeStorageKey);

    return storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : null;
  } catch {
    return null;
  }
};

/**
 * The visitor's theme choice: a stored theme, or the device's.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @returns light, dark or system.
 */
export const readSiteThemePreference = (
  storage: Pick<Storage, "getItem">
): SiteThemePreference => readStoredSiteTheme(storage) ?? "system";

/**
 * The theme to show: the stored one, or the device's.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @param prefersDark - Whether the device prefers dark.
 * @returns The theme.
 */
export const resolveSiteTheme = (
  storage: Pick<Storage, "getItem">,
  prefersDark: boolean
): SiteTheme =>
  readStoredSiteTheme(storage) ?? (prefersDark ? "dark" : "light");

/**
 * Stores the visitor's theme; the theme still applies when storage is
 * unavailable.
 *
 * @param storage - Where the choice is kept (localStorage).
 * @param theme - The theme.
 */
export const persistSiteTheme = (
  storage: Pick<Storage, "setItem">,
  theme: SiteTheme
) => {
  try {
    storage.setItem(siteThemeStorageKey, theme);
  } catch {
    // The selected theme still applies when storage is unavailable.
  }
};

/**
 * Applies a theme to the document: its dark class, data-theme and
 * color-scheme.
 *
 * @param root - The document's root element.
 * @param theme - The theme.
 */
export const applySiteTheme = (root: SiteThemeRoot, theme: SiteTheme) => {
  // The website's dark tokens (website.css) key off data-theme; the app's and
  // auth pages' (styles/base/tokens.css) and Tailwind's dark: variant off
  // this class.
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

const updateSiteTheme = (root: SiteThemeRoot, theme: SiteTheme) => {
  applySiteTheme(root, theme);

  for (const listener of themeListeners) {
    listener();
  }
};

/**
 * Applies the stored or device theme, and follows the device's changes while
 * nothing is stored.
 *
 * @param root - The document's root element.
 * @param storage - Where the choice is kept (localStorage).
 * @param colorSchemeQuery - The device's prefers-color-scheme: dark query.
 * @returns A function that stops following the device.
 */
export const initializeSiteTheme = (
  root: SiteThemeRoot,
  storage: Pick<Storage, "getItem">,
  colorSchemeQuery: MediaQueryList
) => {
  updateSiteTheme(root, resolveSiteTheme(storage, colorSchemeQuery.matches));

  const syncSystemTheme = (event: MediaQueryListEvent) => {
    if (readStoredSiteTheme(storage)) {
      return;
    }

    updateSiteTheme(root, event.matches ? "dark" : "light");
  };

  colorSchemeQuery.addEventListener("change", syncSystemTheme);

  return () => {
    colorSchemeQuery.removeEventListener("change", syncSystemTheme);
  };
};

// Saved before the listeners hear of it, so a preference read in one
// (readSiteThemePreference) is already the new one.
const setSiteTheme = (
  root: SiteThemeRoot,
  storage: Pick<Storage, "setItem">,
  theme: SiteTheme
) => {
  persistSiteTheme(storage, theme);
  updateSiteTheme(root, theme);
};

// Forgets the saved theme and follows the device's from now on.
const followSystemSiteTheme = (
  root: SiteThemeRoot,
  storage: Pick<Storage, "removeItem">,
  prefersDark: boolean
) => {
  try {
    storage.removeItem(siteThemeStorageKey);
  } catch {
    // The system theme still applies when storage is unavailable.
  }

  updateSiteTheme(root, prefersDark ? "dark" : "light");
};

const clearSiteThemeTransition = async (
  root: SiteThemeRoot,
  finished: Promise<void>
) => {
  try {
    await finished;
  } catch {
    // A skipped view transition already applied the theme; nothing to undo.
  } finally {
    delete root.dataset.themeTransition;
  }
};

const revealSiteTheme = (
  transitionDocument: SiteThemeTransitionDocument,
  switchTheme: () => void,
  prefersReducedMotion: boolean
) => {
  const root = transitionDocument.documentElement;

  if (prefersReducedMotion || !transitionDocument.startViewTransition) {
    switchTheme();

    return;
  }

  root.dataset.themeTransition = "circle-top-start";
  const transition = transitionDocument.startViewTransition(switchTheme);
  void clearSiteThemeTransition(root, transition.finished);
};

/**
 * Sets and stores a theme, revealed in a circle from the switch when motion is
 * allowed.
 *
 * @param transitionDocument - The document, for its view transition.
 * @param storage - Where the choice is kept (localStorage).
 * @param theme - The theme.
 * @param prefersReducedMotion - Whether to skip the circle.
 * @returns Nothing; the theme changes.
 */
export const setSiteThemeWithCircleTransition = (
  transitionDocument: SiteThemeTransitionDocument,
  storage: Pick<Storage, "setItem">,
  theme: SiteTheme,
  prefersReducedMotion: boolean
) => {
  revealSiteTheme(
    transitionDocument,
    () => {
      setSiteTheme(transitionDocument.documentElement, storage, theme);
    },
    prefersReducedMotion
  );
};

/**
 * The settings' theme choice: a theme as the header's switch sets it, or the
 * device's (prefersDark) from now on, revealed the same way.
 *
 * @param transitionDocument - The document, for its view transition.
 * @param storage - Where the choice is kept (localStorage).
 * @param preference - light, dark or system.
 * @param prefersDark - Whether the device prefers dark.
 * @param prefersReducedMotion - Whether to skip the circle.
 * @returns Nothing; the theme changes, in a circle when motion is allowed.
 */
export const setSiteThemePreferenceWithCircleTransition = (
  transitionDocument: SiteThemeTransitionDocument,
  storage: Pick<Storage, "setItem" | "removeItem">,
  preference: SiteThemePreference,
  prefersDark: boolean,
  prefersReducedMotion: boolean
) => {
  if (preference === "system") {
    revealSiteTheme(
      transitionDocument,
      () => {
        followSystemSiteTheme(
          transitionDocument.documentElement,
          storage,
          prefersDark
        );
      },
      prefersReducedMotion
    );

    return;
  }

  setSiteThemeWithCircleTransition(
    transitionDocument,
    storage,
    preference,
    prefersReducedMotion
  );
};

/**
 * Subscribes to theme changes, for useSyncExternalStore.
 *
 * @param listener - Called on each change.
 * @returns A function that unsubscribes.
 */
export const subscribeSiteTheme = (listener: () => void) => {
  themeListeners.add(listener);

  return () => themeListeners.delete(listener);
};

/**
 * The theme the document shows now, for useSyncExternalStore.
 *
 * @returns The theme.
 */
export const getSiteThemeSnapshot = (): SiteTheme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

/**
 * The theme a server render assumes: light.
 *
 * @returns light.
 */
export const getServerSiteThemeSnapshot = (): SiteTheme => "light";
