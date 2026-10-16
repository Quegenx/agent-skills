import { getLocale } from "#/paraglide/runtime";

import { siteHeaderThemeSwitcherStyles } from "./site-header-theme-switcher.styles";
import type { SiteTheme } from "./site-theme";
import { SiteThemeIcon } from "./site-theme-icon";

interface SiteHeaderThemeSwitcherProps {
  onToggle: () => void;
  theme: SiteTheme;
}

const themeLabels = {
  en: {
    dark: "Switch to light theme",
    light: "Switch to dark theme",
  },
  he: {
    dark: "מעבר לערכת נושא בהירה",
    light: "מעבר לערכת נושא כהה",
  },
} as const;

/**
 * The header's light and dark switch, its sun morphing into a moon.
 *
 * @param props - theme: the theme shown; onToggle: switches it.
 * @returns The switch.
 */
export const SiteHeaderThemeSwitcher = ({
  onToggle,
  theme,
}: SiteHeaderThemeSwitcherProps) => {
  const isDark = theme === "dark";
  const locale = getLocale();

  return (
    <button
      aria-label={themeLabels[locale][theme]}
      aria-pressed={isDark}
      onClick={onToggle}
      type="button"
      className={siteHeaderThemeSwitcherStyles.button}
    >
      <SiteThemeIcon
        theme={theme}
        className={siteHeaderThemeSwitcherStyles.icon}
      />
    </button>
  );
};
