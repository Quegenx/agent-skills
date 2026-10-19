import {
  Content as SelectContent,
  Item as SelectItem,
  Portal as SelectPortal,
  Viewport as SelectViewport,
} from "@radix-ui/react-select";
import type { ClassValue } from "cn";
import type { ReactNode } from "react";

import { cn } from "../../styles/site-class-merge";
import { surfaces } from "../../styles/surfaces";
import { selectMenuStyles } from "./select-menu.styles";

export {
  Icon as SelectMenuIcon,
  ItemText as SelectMenuItemText,
  Root as SelectMenu,
  Trigger as SelectMenuTrigger,
  Value as SelectMenuValue,
} from "@radix-ui/react-select";

interface SelectMenuContentProps {
  children: ReactNode;
  contentClassName?: ClassValue;
  menuClassName?: ClassValue;
  sideOffset?: number;
}

/**
 * Unique Radix select popover: end-aligned, floating menu viewport.
 *
 * @returns The menu's content, in a portal.
 */
export const SelectMenuContent = ({
  children,
  contentClassName,
  menuClassName,
  sideOffset = 4,
}: SelectMenuContentProps) => (
  <SelectPortal>
    <SelectContent
      align="end"
      position="popper"
      side="bottom"
      sideOffset={sideOffset}
      className={cn(contentClassName)}
    >
      <SelectViewport
        className={cn(
          surfaces.floatingMenu,
          selectMenuStyles.menu,
          menuClassName
        )}
      >
        {children}
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
);

interface SelectMenuItemProps {
  children: ReactNode;
  isSelected?: boolean;
  selectedClassName?: ClassValue;
  className?: ClassValue;
  value: string;
}

/**
 * Unique Radix select option using the shared menu option states.
 *
 * @returns The menu item.
 */
export const SelectMenuItem = ({
  children,
  isSelected = false,
  selectedClassName,
  className,
  value,
}: SelectMenuItemProps) => (
  <SelectItem
    value={value}
    className={cn(
      selectMenuStyles.option,
      className,
      isSelected && selectedClassName
    )}
  >
    {children}
  </SelectItem>
);
