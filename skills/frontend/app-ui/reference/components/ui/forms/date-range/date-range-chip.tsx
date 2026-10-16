import type { CalendarDate } from "@internationalized/date";
import { useState } from "react";

import {
  formatDateRangeChip,
  parseDateRangeChip,
} from "@/lib/dates/date-range-presets";

import styles from "./date-range-picker.module.css";

/**
 * A typed date: dd/mm/yyyy, committed on blur or Enter; Escape restores it.
 *
 * @returns The date chip's field.
 */
export const DateRangeChip = ({
  date,
  label,
  onCommit,
  onInvalid,
}: {
  date: CalendarDate;
  label: string;
  onCommit: (date: CalendarDate) => void;
  onInvalid: (invalid: boolean) => void;
}) => {
  const formatted = formatDateRangeChip(date);
  const [draft, setDraft] = useState({ formatted, text: formatted });
  const text = draft.formatted === formatted ? draft.text : formatted;
  const invalid = parseDateRangeChip(text) === null;

  const commit = () => {
    const parsed = parseDateRangeChip(text);

    if (parsed) {
      onCommit(parsed);
    }
  };

  return (
    <label className={styles.dateLabel}>
      {label}
      <input
        value={text}
        aria-label={label}
        inputMode="numeric"
        dir="ltr"
        aria-invalid={invalid}
        className={styles.dateChip}
        onChange={(event) => {
          setDraft({ formatted, text: event.target.value });
          onInvalid(parseDateRangeChip(event.target.value) === null);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }

          if (event.key === "Escape") {
            setDraft({ formatted, text: formatted });
            onInvalid(false);
          }
        }}
      />
    </label>
  );
};
