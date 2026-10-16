import {
  CalendarDate,
  endOfMonth,
  endOfYear,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  startOfYear,
  today,
} from "@internationalized/date";

import {
  app_range_all,
  app_range_last_30,
  app_range_last_7,
  app_range_last_month,
  app_range_last_year,
  app_range_this_month,
  app_range_this_year,
  app_range_today,
  app_range_yesterday,
} from "#/paraglide/messages";

// amichai-all's date range helpers (course-date-range.ts) for the date range
// picker: dd/mm/yyyy chips, the range's length, and the common ranges.

/**
 * A date range: its first and last days.
 */
export interface DateRangeValue {
  start: CalendarDate;
  end: CalendarDate;
}

/**
 * Our stored dates are ISO days ("2026-10-11"); "" is no date.
 *
 * @param iso - The ISO day, or "" for none.
 * @returns The calendar date, or null.
 */
export const calendarDateFromIso = (iso: string) =>
  iso ? parseDate(iso) : null;

/**
 * A date as a date range chip shows it, dd/mm/yyyy.
 *
 * @param date - The date.
 * @returns The text.
 */
export const formatDateRangeChip = (date: CalendarDate) =>
  `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${date.year}`;

const dateRangeChipPattern =
  /^(?<day>\d{1,2})\/(?<month>\d{1,2})\/(?<year>\d{4})$/u;

/**
 * A typed dd/mm/yyyy date, as the date range chip reads it.
 *
 * @param text - What the person typed.
 * @returns The date, or null when it is not a valid date.
 */
export const parseDateRangeChip = (text: string): CalendarDate | null => {
  const match = dateRangeChipPattern.exec(text.trim());

  if (!match?.groups) {
    return null;
  }

  const day = Number(match.groups.day);
  const month = Number(match.groups.month);
  const year = Number(match.groups.year);

  const outsideCalendar = month < 1 || month > 12 || day < 1 || day > 31;

  if (year < 1 || outsideCalendar) {
    return null;
  }

  const date = new CalendarDate(year, month, day);

  return date.day === day && date.month === month && date.year === year
    ? date
    : null;
};

/**
 * How many days a range covers, its first and last day included.
 *
 * @param value - The range.
 * @returns The number of days.
 */
export const dateRangeDays = (value: DateRangeValue) =>
  Math.round(
    (value.end.toDate("UTC").getTime() - value.start.toDate("UTC").getTime()) /
      86_400_000
  ) + 1;

/**
 * The common ranges, each from firstDate on at the earliest (the oldest
 * date there is to filter by).
 *
 * @param firstDate - The oldest date there is to filter by.
 * @returns The presets, each with its label and range.
 */
export const dateRangePresets = (firstDate: CalendarDate) => {
  const now = today(getLocalTimeZone());
  const yesterday = now.subtract({ days: 1 });
  const lastMonth = now.subtract({ months: 1 });
  const lastYear = now.subtract({ years: 1 });

  return [
    { label: app_range_today(), range: { start: now, end: now } },
    {
      label: app_range_yesterday(),
      range: { start: yesterday, end: yesterday },
    },
    {
      label: app_range_last_7(),
      range: { start: now.subtract({ days: 6 }), end: now },
    },
    {
      label: app_range_last_30(),
      range: { start: now.subtract({ days: 29 }), end: now },
    },
    {
      label: app_range_this_month(),
      range: { start: startOfMonth(now), end: endOfMonth(now) },
    },
    {
      label: app_range_last_month(),
      range: { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) },
    },
    {
      label: app_range_this_year(),
      range: { start: startOfYear(now), end: endOfYear(now) },
    },
    {
      label: app_range_last_year(),
      range: { start: startOfYear(lastYear), end: endOfYear(lastYear) },
    },
    { label: app_range_all(), range: { start: firstDate, end: now } },
  ];
};
