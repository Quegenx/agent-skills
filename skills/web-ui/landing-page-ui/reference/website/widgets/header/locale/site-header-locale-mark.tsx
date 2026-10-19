import type { ReactNode } from "react";

import type { SiteHeaderLocaleValue } from "./site-header-locale-href";
import { siteHeaderLocaleMarkStyles as styles } from "./site-header-locale-mark.styles";

interface SiteHeaderLocaleMarkProps {
  locale: SiteHeaderLocaleValue;
}

// A flag's 21:15 canvas on its white field, drawn at the size of a text
// line; children paint the flag over it.
const FlagCanvas = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    height="14"
    viewBox="0 0 21 15"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#fff" height="15" width="21" />
    {children}
  </svg>
);

/**
 * Israel's flag, drawn for the language picker.
 *
 * @returns The flag's SVG.
 */
export const IsraelFlag = () => (
  <FlagCanvas>
    <rect fill="#0038B8" height="2.25" width="21" y="1.5" />
    <rect fill="#0038B8" height="2.25" width="21" y="11.25" />
    <path
      d="M10.5 4.35 13.45 9.45H7.55Z"
      fill="none"
      stroke="#0038B8"
      strokeLinejoin="miter"
      strokeWidth="0.9"
    />
    <path
      d="M10.5 10.65 7.55 5.55h5.9Z"
      fill="none"
      stroke="#0038B8"
      strokeLinejoin="miter"
      strokeWidth="0.9"
    />
  </FlagCanvas>
);

/**
 * The United States' flag, drawn for the language picker.
 *
 * @returns The flag's SVG.
 */
export const UnitedStatesFlag = () => (
  <FlagCanvas>
    <rect fill="#B22234" height="1.154" width="21" />
    <rect fill="#B22234" height="1.154" width="21" y="2.308" />
    <rect fill="#B22234" height="1.154" width="21" y="4.615" />
    <rect fill="#B22234" height="1.154" width="21" y="6.923" />
    <rect fill="#B22234" height="1.154" width="21" y="9.231" />
    <rect fill="#B22234" height="1.154" width="21" y="11.538" />
    <rect fill="#B22234" height="1.154" width="21" y="13.846" />
    <rect fill="#3C3B6E" height="8.077" width="8.4" />
    <circle cx="1.7" cy="1.15" fill="#fff" r="0.38" />
    <circle cx="4.2" cy="1.15" fill="#fff" r="0.38" />
    <circle cx="6.7" cy="1.15" fill="#fff" r="0.38" />
    <circle cx="2.95" cy="2.45" fill="#fff" r="0.38" />
    <circle cx="5.45" cy="2.45" fill="#fff" r="0.38" />
    <circle cx="1.7" cy="3.75" fill="#fff" r="0.38" />
    <circle cx="4.2" cy="3.75" fill="#fff" r="0.38" />
    <circle cx="6.7" cy="3.75" fill="#fff" r="0.38" />
    <circle cx="2.95" cy="5.05" fill="#fff" r="0.38" />
    <circle cx="5.45" cy="5.05" fill="#fff" r="0.38" />
    <circle cx="1.7" cy="6.35" fill="#fff" r="0.38" />
    <circle cx="4.2" cy="6.35" fill="#fff" r="0.38" />
    <circle cx="6.7" cy="6.35" fill="#fff" r="0.38" />
  </FlagCanvas>
);

const siteHeaderLocaleFlags = {
  en: UnitedStatesFlag,
  he: IsraelFlag,
} as const;

/**
 * Country flag next to a language option: Israel for Hebrew, United States for English.
 *
 * @returns The flag.
 */
export const SiteHeaderLocaleMark = ({ locale }: SiteHeaderLocaleMarkProps) => {
  const Flag = siteHeaderLocaleFlags[locale];

  return (
    <span aria-hidden="true" data-locale-mark={locale} className={styles.flag}>
      <Flag />
    </span>
  );
};
