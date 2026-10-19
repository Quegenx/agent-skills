import { useEffect } from "react";

import { initializeSiteTheme } from "../../../website/widgets/header/theme/site-theme";

/**
 * Applies the saved theme, or the device's while none is saved, and follows
 * the device's changes, as the website header does. The shell calls it on
 * every app page; the settings' theme choice (AppearanceSettingsCard)
 * changes it.
 */
export const useAppSiteThemeSync = () => {
  useEffect(
    () =>
      initializeSiteTheme(
        document.documentElement,
        window.localStorage,
        window.matchMedia("(prefers-color-scheme: dark)")
      ),
    []
  );
};
