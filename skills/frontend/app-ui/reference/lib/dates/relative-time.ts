import { getLocale } from "#/paraglide/runtime";

const relativeTimeFormatOptions = {
  numeric: "auto",
} as const;

const relativeTimeFormatByLocale = {
  he: new Intl.RelativeTimeFormat("he-IL", relativeTimeFormatOptions),
  en: new Intl.RelativeTimeFormat("en-US", relativeTimeFormatOptions),
};

const relativeTimeFormat = () => relativeTimeFormatByLocale[getLocale()];

const relativeTimeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/**
 * How long ago, in the largest whole unit: "לפני 3 שעות", "אתמול",
 * "בדקה זו".
 *
 * @param iso - The time, as ISO.
 * @returns The relative time in the page's language.
 */
export const formatTimeAgo = (iso: string) => {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;

  for (const [unit, size] of relativeTimeUnits) {
    if (Math.abs(seconds) >= size) {
      return relativeTimeFormat().format(Math.round(seconds / size), unit);
    }
  }

  return relativeTimeFormat().format(0, "minute");
};
