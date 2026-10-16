import type { ComponentProps, ReactNode } from "react";

import { SmoothDropdown } from "./smooth-dropdown";

import styles from "./smooth-dropdown.module.css";

/**
 * A dropdown of one choice among items: the trigger shows the chosen item,
 * and picking another calls onChange. SelectField labels it in a form.
 *
 * @returns The dropdown.
 */
export const SmoothSelect = <V extends string>({
  items,
  value,
  onChange,
  ...props
}: Omit<
  ComponentProps<typeof SmoothDropdown>,
  "options" | "onSelect" | "children" | "multiple" | "renderPanel"
> & {
  items: readonly { value: V; label: string; icon?: ReactNode }[];
  value: V;
  onChange: (value: V) => void;
}) => {
  const chosen = items.find((item) => item.value === value);

  return (
    <SmoothDropdown
      {...props}
      options={items.map((item) => ({
        value: item.value,
        label: item.label,
        icon: item.icon,
        selected: item.value === value,
      }))}
      onSelect={(next) => {
        const picked = items.find((item) => item.value === next);

        if (picked) {
          onChange(picked.value);
        }
      }}
    >
      <span className={styles.chosen}>
        {chosen?.icon}
        <bdi>{chosen?.label}</bdi>
      </span>
    </SmoothDropdown>
  );
};
