import { useContext } from "react";
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  RangeCalendarStateContext,
} from "react-aria-components";
import type { CalendarCellRenderProps } from "react-aria-components";

import { app_next_month, app_previous_month } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { AppIcon } from "@/components/ui/general/app-icon";

import styles from "./date-range-picker.module.css";

// One month of the date range picker (date-range-picker.tsx): its title,
// the arrow to the next or previous month, and its days, with the chosen
// range drawn as a band with solid ends.

// A month's title ("October 2026"), one formatter per app language.
const dateRangeMonthTitleOptions = {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
} as const;

const dateRangeMonthTitle = {
  he: new Intl.DateTimeFormat("he-IL", dateRangeMonthTitleOptions),
  en: new Intl.DateTimeFormat("en-US", dateRangeMonthTitleOptions),
};

const DateRangeDay = ({
  date,
  formattedDate,
  isSelected,
  isSelectionStart,
  isSelectionEnd,
  isHovered,
  isFocusVisible,
  isDisabled,
  isOutsideMonth,
}: CalendarCellRenderProps) => {
  if (isOutsideMonth) {
    return <div className={styles.day} />;
  }

  const weekday = date.toDate("UTC").getUTCDay();
  const single = isSelectionStart && isSelectionEnd;

  return (
    <div className={styles.day}>
      <span
        aria-hidden="true"
        className={styles.band}
        data-band-start={isSelectionStart}
        data-band-end={isSelectionEnd}
        data-visible={isSelected && !single}
        data-extend-start={!isSelectionStart && weekday !== 0}
        data-extend-end={!isSelectionEnd && weekday !== 6}
      />
      <div
        className={styles.dayFace}
        data-hovered={isHovered && !isSelected}
        data-focus-visible={isFocusVisible}
        data-disabled={isDisabled}
      >
        <span
          aria-hidden="true"
          className={styles.edge}
          data-visible={isSelectionStart || isSelectionEnd}
          data-start={isSelectionStart}
          data-end={isSelectionEnd}
        />
        <span className={styles.dayNumber}>{formattedDate}</span>
      </div>
    </div>
  );
};

/**
 * One month of the date range calendar, its grid of days, with the previous or
 * next month buttons where asked.
 *
 * @param props - offset: months after the calendar's first visible month;
 *   showPrevious and showNext: whether to show those buttons.
 * @returns The month.
 */
export const DateRangeMonth = ({
  offset,
  showPrevious,
  showNext,
}: {
  offset: number;
  showPrevious?: boolean;
  showNext?: boolean;
}) => {
  const state = useContext(RangeCalendarStateContext);
  const date = state?.visibleRange.start.add({ months: offset });

  const title = date
    ? dateRangeMonthTitle[getLocale()].format(date.toDate("UTC"))
    : "";

  return (
    <div className={styles.month}>
      <div className={styles.monthHeader}>
        {showPrevious === true ? (
          <AriaButton
            slot="previous"
            aria-label={app_previous_month()}
            className={styles.navigation}
          >
            <AppIcon icon="chevron-right" className="ltr:rotate-180" />
          </AriaButton>
        ) : (
          <span className={styles.navigationSpacer} />
        )}
        <span className={styles.monthTitle}>{title}</span>
        {showNext === true ? (
          <AriaButton
            slot="next"
            aria-label={app_next_month()}
            className={styles.navigation}
          >
            <AppIcon icon="chevron-left" className="ltr:rotate-180" />
          </AriaButton>
        ) : (
          <span className={styles.navigationSpacer} />
        )}
      </div>
      <CalendarGrid
        offset={{ months: offset }}
        weekdayStyle="short"
        className={styles.grid}
      >
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className={styles.weekday}>
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(cellDate) => (
            <CalendarCell date={cellDate} className={styles.cell}>
              {(cell) => <DateRangeDay {...cell} />}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  );
};
