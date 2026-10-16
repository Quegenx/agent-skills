import type { ReactNode } from "react";

import { app_chosen_count, app_clear } from "#/paraglide/messages";
import { AppIcon } from "@/components/ui/general/app-icon";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";

import { isNonEmptyText } from "../../../../../backend/shared/text/non-empty-text";

// A page toolbar's filter, as data-table filters: a pill chip with a "+" and
// its label, then what is chosen after a divider. It opens the smooth
// dropdown with the filter's options. The tasks and opportunities toolbars
// both filter with it.
const FilterChipFace = ({
  label,
  chosen,
  withIcon,
}: {
  label: string;
  chosen: string | null;
  withIcon: boolean;
}) => (
  <>
    {withIcon && <AppIcon icon="tasks-plus-circle" />}
    {label}
    {isNonEmptyText(chosen) && (
      <>
        <span className="filter-chip-divider" />
        <span className="filter-chip-chosen">{chosen}</span>
      </>
    )}
  </>
);

/**
 * A filter where several may be chosen (values): each option with its icon,
 * a checkbox and how many items have it, and a clear row once any is chosen.
 * The chip sums them up as how many are chosen. appearance "chip"
 * is a toolbar's pill; "field" a white field the size of the dropdowns
 * beside it (the posts page's סוג פוסט by its group dropdown), without the
 * "+", as a field shows its chevron.
 *
 * @returns The filter's dropdown.
 */
export const FilterChipOptions = <V extends string>({
  label,
  values,
  options,
  count,
  appearance = "chip",
  onChange,
}: {
  label: string;
  values: readonly V[];
  options: { value: V; label: string; icon: ReactNode }[];
  count: (value: V) => number;
  appearance?: "chip" | "field";
  onChange: (values: V[]) => void;
}) => {
  const chosenValues = new Set(values);

  return (
    <SmoothDropdown
      label={label}
      appearance={appearance}
      multiple
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        icon: option.icon,
        detail: count(option.value),
        selected: chosenValues.has(option.value),
      }))}
      actions={
        values.length > 0
          ? [
              {
                label: app_clear(),
                destructive: true,
                onSelect: () => {
                  onChange([]);
                },
              },
            ]
          : undefined
      }
      onSelect={(next) => {
        const picked = options.find((option) => option.value === next);

        if (picked) {
          onChange(
            chosenValues.has(picked.value)
              ? values.filter((value) => value !== picked.value)
              : [...values, picked.value]
          );
        }
      }}
    >
      <FilterChipFace
        label={label}
        chosen={
          values.length > 0 ? app_chosen_count({ count: values.length }) : null
        }
        withIcon={appearance === "chip"}
      />
    </SmoothDropdown>
  );
};

/**
 * A filter where exactly one applies: the chosen one is checked, and picking
 * one closes the menu.
 *
 * @returns The filter's dropdown.
 */
export const FilterChipChoices = <V extends string>({
  label,
  chosen,
  options,
  onChange,
}: {
  label: string;
  chosen: V;
  options: { value: V; label: string }[];
  onChange: (chosen: V) => void;
}) => (
  <SmoothDropdown
    label={label}
    appearance="chip"
    panelWidth={260}
    options={options.map((option) => ({
      value: option.value,
      label: option.label,
      selected: option.value === chosen,
    }))}
    onSelect={(next) => {
      const picked = options.find((option) => option.value === next);

      if (picked) {
        onChange(picked.value);
      }
    }}
  >
    <FilterChipFace
      label={label}
      chosen={options.find((option) => option.value === chosen)?.label ?? null}
      withIcon
    />
  </SmoothDropdown>
);
