import { useEffect, useState } from "react";

// Calendar dates as ISO "YYYY-MM-DD" strings in local time, as the date
// range picker reads and writes them. "" is no date.

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * A date as an ISO day (YYYY-MM-DD) in local time.
 *
 * @param date - The date.
 * @returns The ISO day.
 */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Today, renewed at midnight while the page stays open.
 *
 * @returns Today's date.
 */
export const useCalendarToday = () => {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const midnight = new Date(today);
    midnight.setHours(24, 0, 0, 0);

    const timer = window.setTimeout(() => {
      setToday(new Date());
    }, midnight.getTime() - today.getTime());

    return () => {
      window.clearTimeout(timer);
    };
  }, [today]);

  return today;
};
