import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "motion/react";
import { span as MotionSpan } from "motion/react-m";
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import {
  app_filters,
  app_search,
  app_search_keywords,
  app_searching,
} from "#/paraglide/messages";
import { Badge } from "@/components/ui/display/badge";
import { Card, CardContent } from "@/components/ui/display/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/forms/fields/field";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";
import type { AppIconName } from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";

// The filters count springs in with the first filter and out with the last,
// as ביטול springs out of a confirm button (ConfirmCancelButton), no bounce.
const filterCountSpring = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
} as const;

/**
 * The search card of the group search, the Ad Library and the posts
 * collection: the search input (or what stands for it, such as the groups to
 * collect from), a "מסננים" toggle counting active filters, the submit
 * button, the filters in a disclosure panel that opens itself when a filter
 * is invalid, and what goes under the search row (belowSearch, such as the
 * chosen groups). The labels default to searching; a collection names its
 * own (אפשרויות, איסוף).
 *
 * @returns The search card.
 */
export const FilterableSearchForm = ({
  label,
  variant = "groups",
  searchId,
  searchInput,
  belowSearch,
  filtersId,
  filtersLayout,
  activeFilters,
  searching,
  submitDisabled,
  filtersLabel = app_filters(),
  submitLabel = app_search(),
  busyLabel = app_searching(),
  submitIcon = "search",
  onSearch,
  children,
}: {
  label: string;
  // "ad-library" takes the Ad Library's wider filter grid styles.
  variant?: "groups" | "ad-library";
  // The search input's id, for its hidden label; null when the row holds
  // other controls, labelled by their own text.
  searchId: string | null;
  searchInput: ReactNode;
  belowSearch?: ReactNode;
  filtersId: string;
  filtersLayout: ComponentProps<typeof FieldGroup>["layout"];
  activeFilters: number;
  searching: boolean;
  submitDisabled: boolean;
  filtersLabel?: string;
  submitLabel?: string;
  busyLabel?: string;
  submitIcon?: AppIconName;
  onSearch: () => void;
  children: ReactNode;
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Card>
      <CardContent>
        <form
          aria-label={label}
          className={
            variant === "ad-library"
              ? "ad-search-form flex flex-col"
              : "flex flex-col"
          }
          onInvalid={() => {
            setFiltersOpen(true);
          }}
          // A client action: React handles the submit after the browser's
          // own validation, so the page never navigates.
          action={() => {
            onSearch();
          }}
        >
          <FieldGroup layout="search">
            <Field>
              {isNonEmptyText(searchId) && (
                <FieldLabel htmlFor={searchId} className="sr-only">
                  {app_search_keywords()}
                </FieldLabel>
              )}
              {searchInput}
            </Field>
            <Button
              type="button"
              variant="outline"
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              onClick={() => {
                setFiltersOpen((open) => !open);
              }}
            >
              {filtersLabel}
              {/* Its width grows from nothing, so the button widens
                  smoothly instead of jumping; the number morphs. The
                  button's gap is inside that width (filter-count-badge),
                  so it opens with it. */}
              <LazyMotion features={domAnimation} strict>
                <MotionConfig reducedMotion="user">
                  {/* oxlint-disable react-doctor/no-layout-property-animation --
                      the badge's width is what widens the button: one small
                      box, briefly; a transform would leave the label still. */}
                  <AnimatePresence initial={false}>
                    {activeFilters > 0 && (
                      <MotionSpan
                        key="count"
                        className="filter-count-badge"
                        initial={{ width: 0, opacity: 0, scale: 0.6 }}
                        animate={{ width: "auto", opacity: 1, scale: 1 }}
                        exit={{ width: 0, opacity: 0, scale: 0.6 }}
                        transition={filterCountSpring}
                      >
                        <Badge variant="status">
                          <MorphText>{activeFilters}</MorphText>
                        </Badge>
                      </MotionSpan>
                    )}
                  </AnimatePresence>
                  {/* oxlint-enable react-doctor/no-layout-property-animation */}
                </MotionConfig>
              </LazyMotion>
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              <AppIcon icon={submitIcon} data-icon="inline-start" />
              <MorphText>{searching ? busyLabel : submitLabel}</MorphText>
            </Button>
          </FieldGroup>
          {belowSearch !== undefined && belowSearch !== null && (
            <div className="pt-ui-md">{belowSearch}</div>
          )}
          <div
            id={filtersId}
            className="disclosure-panel"
            data-open={filtersOpen}
            inert={!filtersOpen}
          >
            <div className="disclosure-panel-inner">
              <div className="pt-ui-md">
                <FieldGroup layout={filtersLayout}>{children}</FieldGroup>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
