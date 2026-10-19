import {
  app_active_filters,
  app_clear_all,
  app_remove_filter,
} from "#/paraglide/messages";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";

interface ActiveFilterChip {
  key: string;
  label: string;
  handleRemove: () => void;
}

/**
 * The chosen filters while their panel is closed (the group search's
 * results, the Ad Library's): each a chip that clears it, then "clear all".
 * Nothing when no filter is chosen.
 *
 * @returns The chips, or nothing when no filter is chosen.
 */
export const ActiveFilterChips = ({
  chips,
  disabled,
  onClearAll,
}: {
  chips: readonly ActiveFilterChip[];
  disabled?: boolean;
  onClearAll: () => void;
}) => {
  if (chips.length === 0) {
    return null;
  }

  return (
    <fieldset className="flex flex-wrap items-center gap-2 pt-3">
      <legend className="sr-only">{app_active_filters()}</legend>
      {chips.map((chip) => (
        <Button
          disabled={disabled}
          key={chip.key}
          variant="secondary"
          size="sm"
          aria-label={app_remove_filter({ label: chip.label })}
          onClick={chip.handleRemove}
        >
          {chip.label}
          {/* The × in its own round tint, as the search field's clear. */}
          <span className="active-filter-remove" aria-hidden="true">
            <AppIcon icon="close" />
          </span>
        </Button>
      ))}
      <Button
        variant="destructive-soft"
        size="sm"
        onClick={onClearAll}
        disabled={disabled}
      >
        {app_clear_all()}
      </Button>
    </fieldset>
  );
};
