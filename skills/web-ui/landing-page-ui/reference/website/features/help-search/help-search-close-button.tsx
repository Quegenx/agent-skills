import { Cancel01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

import { help_search_close } from "#/paraglide/messages";

import { buttonPress } from "../../shared/styles/button-press";
import { cn } from "../../shared/styles/site-class-merge";
import { clearInputButtonStyles as styles } from "../../shared/ui/form-controls/clear-input-button.styles";

interface HelpSearchCloseButtonProps {
  onClose: () => void;
}

/**
 * The help search's close button.
 *
 * @param props - onClose: closes the search.
 * @returns The button.
 */
export const HelpSearchCloseButton = ({
  onClose,
}: HelpSearchCloseButtonProps) => (
  <button
    aria-label={help_search_close()}
    {...buttonPress}
    onClick={onClose}
    type="button"
    className={cn(styles.button, styles.searchButton)}
  >
    <span
      aria-hidden="true"
      className={cn(styles.surface, styles.searchSurface)}
    >
      <span className={cn(styles.icon, styles.searchIcon)}>
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
      </span>
    </span>
  </button>
);
