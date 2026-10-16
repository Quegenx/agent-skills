import type { CalendarDate } from "@internationalized/date";
import { useMemo, useState } from "react";
import { I18nProvider, RangeCalendar } from "react-aria-components";

import {
  app_cancel,
  app_range_apply,
  app_range_days,
  app_range_from,
  app_range_invalid,
  app_range_pick,
  app_range_presets,
  app_range_to,
} from "#/paraglide/messages";
import { DateRangeChip } from "@/components/ui/forms/date-range/date-range-chip";
import { DateRangeMonth } from "@/components/ui/forms/date-range/date-range-month";
import { AppIcon } from "@/components/ui/general/app-icon";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import type { SmoothDropdownAppearance } from "@/components/ui/navigation/dropdown/smooth-dropdown-geometry";
import {
  calendarDateFromIso,
  dateRangeDays,
  dateRangePresets,
  formatDateRangeChip,
} from "@/lib/dates/date-range-presets";
import type { DateRangeValue } from "@/lib/dates/date-range-presets";
import { appIntlLocale } from "@/lib/i18n/app-intl-locale";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";

import styles from "./date-range-picker.module.css";

// amichai-all's date range picker (course-date-range-picker.tsx and
// course-date-calendar.tsx, adapted from BoardUI's), in the smooth dropdown:
// common ranges beside two months, the chosen range drawn as a band with
// solid ends, typed dd/mm/yyyy chips, and a range that commits only on
// Apply. Used by the Ad Library's dates and the tasks page's "created"
// filter.

const DateRangePanel = ({
  value,
  firstDate,
  lastDate,
  clearLabel,
  onApply,
  onClear,
  close,
}: {
  value: DateRangeValue;
  firstDate: CalendarDate;
  lastDate: CalendarDate;
  clearLabel?: string;
  onApply: (value: DateRangeValue) => void;
  onClear: () => void;
  close: () => void;
}) => {
  const [pending, setPending] = useState(() => ({ ...value }));
  const [focused, setFocused] = useState(() => value.start);
  const [invalid, setInvalid] = useState({ start: false, end: false });
  const [selectionRevision, setSelectionRevision] = useState(0);
  const presets = useMemo(() => dateRangePresets(firstDate), [firstDate]);

  const selectRange = (range: DateRangeValue) => {
    setPending(range);
    setSelectionRevision((revision) => revision + 1);
    setFocused(range.start);
    setInvalid({ start: false, end: false });
  };

  return (
    <I18nProvider locale={`${appIntlLocale()}-u-ca-gregory`}>
      <RangeCalendar
        aria-label={app_range_pick()}
        firstDayOfWeek="sun"
        visibleDuration={{ months: 2 }}
        pageBehavior="single"
        minValue={firstDate}
        maxValue={lastDate}
        value={pending}
        onChange={selectRange}
        focusedValue={focused}
        onFocusChange={setFocused}
        className={styles.picker}
      >
        <div className={styles.main}>
          <fieldset className={styles.presets} aria-label={app_range_presets()}>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={
                  pending.start.compare(preset.range.start) === 0 &&
                  pending.end.compare(preset.range.end) === 0
                }
                onClick={() => {
                  selectRange(preset.range);
                }}
                className={styles.preset}
              >
                {preset.label}
              </button>
            ))}
          </fieldset>
          <div className={styles.months}>
            <DateRangeMonth offset={0} showPrevious />
            <DateRangeMonth offset={1} showNext />
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.chips}>
            <DateRangeChip
              key={`start-${pending.start.toString()}-${selectionRevision}`}
              date={pending.start}
              label={app_range_from()}
              onInvalid={(start) => {
                setInvalid((current) => ({ ...current, start }));
              }}
              onCommit={(start) => {
                setPending((current) => ({
                  start,
                  end: start.compare(current.end) > 0 ? start : current.end,
                }));
                setFocused(start);
              }}
            />
            <DateRangeChip
              key={`end-${pending.end.toString()}-${selectionRevision}`}
              date={pending.end}
              label={app_range_to()}
              onInvalid={(end) => {
                setInvalid((current) => ({ ...current, end }));
              }}
              onCommit={(end) => {
                setPending((current) => ({
                  start: end.compare(current.start) < 0 ? end : current.start,
                  end,
                }));
                setFocused(end);
              }}
            />
            <span className={styles.days}>
              {app_range_days({ count: dateRangeDays(pending) })}
            </span>
          </div>
          <div className={styles.actions}>
            {isNonEmptyText(clearLabel) && (
              <button
                type="button"
                className={styles.clear}
                onClick={() => {
                  onClear();
                  close();
                }}
              >
                {clearLabel}
              </button>
            )}
            <button type="button" className={styles.cancel} onClick={close}>
              {app_cancel()}
            </button>
            <button
              type="button"
              className={styles.apply}
              disabled={invalid.start || invalid.end}
              onClick={() => {
                onApply(pending);
                close();
              }}
            >
              {app_range_apply()}
            </button>
          </div>
        </div>
        {(invalid.start || invalid.end) && (
          <p role="alert" className={styles.error}>
            {app_range_invalid()}
          </p>
        )}
      </RangeCalendar>
    </I18nProvider>
  );
};

/**
 * From and to as ISO days ("" for none), within limits; the trigger shows
 * the range, or placeholder when there is none. clearLabel offers going
 * back to no range.
 *
 * @returns The picker and its calendar.
 */
export const DateRangePicker = ({
  id,
  label,
  placeholder,
  from,
  to,
  limits,
  appearance = "field",
  clearLabel,
  disabled = false,
  onChange,
}: {
  id?: string;
  label: string;
  placeholder: string;
  from: string;
  to: string;
  limits: { min: string; max: string };
  appearance?: SmoothDropdownAppearance;
  clearLabel?: string;
  disabled?: boolean;
  onChange: (range: { from: string; to: string }) => void;
}) => {
  const firstDate = calendarDateFromIso(limits.min);
  const lastDate = calendarDateFromIso(limits.max);
  const start = calendarDateFromIso(from);
  const end = calendarDateFromIso(to);

  if (!(firstDate && lastDate)) {
    return null;
  }

  return (
    <SmoothDropdown
      triggerId={id}
      label={label}
      appearance={appearance}
      align="center"
      fullWidth={appearance === "field"}
      disabled={disabled}
      panelWidth={824}
      renderPanel={(close) => (
        <DateRangePanel
          value={{ start: start ?? lastDate, end: end ?? lastDate }}
          firstDate={firstDate}
          lastDate={lastDate}
          clearLabel={clearLabel}
          onApply={(range) => {
            onChange({
              from: range.start.toString(),
              to: range.end.toString(),
            });
          }}
          onClear={() => {
            onChange({ from: "", to: "" });
          }}
          close={close}
        />
      )}
    >
      <span className={styles.trigger}>
        <AppIcon icon="calendar" />
        {start && end ? (
          <bdi dir="ltr">
            {formatDateRangeChip(start)} – {formatDateRangeChip(end)}
          </bdi>
        ) : (
          placeholder
        )}
      </span>
    </SmoothDropdown>
  );
};
