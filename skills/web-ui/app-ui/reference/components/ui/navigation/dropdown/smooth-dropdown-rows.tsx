import { span as MotionSpan, div as MotionDiv } from "motion/react-m";
import { DropdownMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { CheckboxMark } from "@/components/ui/forms/fields/checkbox-mark";

import styles from "./smooth-dropdown-menu.module.css";

// The smooth dropdown's rows (smooth-dropdown.tsx): each fades in from the
// side 20ms after the one before, and one highlight springs between rows
// (520/30/0.8).

const indicatorSpring = {
  type: "spring",
  damping: 30,
  stiffness: 520,
  mass: 0.8,
} as const;

const dropdownEase = [0.23, 1, 0.32, 1] as const;

/**
 * One option of a dropdown: its value, label, whether it is chosen, and what is
 * drawn beside it.
 */
export interface SmoothDropdownOption {
  value: string;
  label: string;
  selected: boolean;
  // Drawn before the label, such as a task status's icon.
  icon?: ReactNode;
  // Drawn at the row's end, such as how many items have it.
  detail?: ReactNode;
  disabled?: boolean;
}

/**
 * An action row (a "…" menu's): no checkbox, its icon, and red when it
 * destroys something. An action that opens a dialog (opensDialog) closes
 * the menu at once instead of shrinking it back, so the closing menu never
 * shows over the dialog's backdrop.
 */
export interface SmoothDropdownAction {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  opensDialog?: boolean;
  onSelect: () => void;
}

// A row's face, given to Radix's item (asChild): it fades in after the rows
// before it, with the springing highlight under the active row.
const SmoothDropdownRowFace = ({
  index,
  highlight,
  reduce,
  id,
  children,
  ...props
}: Omit<
  ComponentProps<typeof MotionDiv>,
  "initial" | "animate" | "transition"
> & {
  index: number;
  highlight: boolean;
  reduce: boolean | null;
  id: string;
  children: ReactNode;
}) => (
  <MotionDiv
    {...props}
    className={styles.item}
    initial={reduce === true ? false : { opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{
      duration: reduce === true ? 0 : 0.15,
      delay: reduce === true ? 0 : 0.06 + index * 0.02,
      ease: dropdownEase,
    }}
  >
    {highlight && (
      <MotionSpan
        aria-hidden="true"
        layoutId={`${id}-highlight`}
        className={styles.highlight}
        transition={reduce === true ? { duration: 0 } : indicatorSpring}
      />
    )}
    {children}
  </MotionDiv>
);

const SmoothDropdownItems = ({
  multiple,
  options,
  setHighlighted,
  onSelect,
  reduce,
  active,
  id,
}: {
  multiple: boolean;
  options: SmoothDropdownOption[];
  setHighlighted: (value: string) => void;
  onSelect?: (value: string) => void;
  reduce: boolean | null;
  active: string | undefined;
  id: string;
}) => {
  const Item = multiple ? DropdownMenu.CheckboxItem : DropdownMenu.RadioItem;

  return (
    <>
      {options.map((option, index) => (
        <Item
          key={option.value}
          value={option.value}
          checked={option.selected}
          textValue={option.label}
          disabled={option.disabled}
          asChild
          onFocus={() => {
            setHighlighted(option.value);
          }}
          onPointerMove={() => {
            setHighlighted(option.value);
          }}
          onSelect={(event) => {
            if (multiple) {
              event.preventDefault();
            }

            onSelect?.(option.value);
          }}
        >
          <SmoothDropdownRowFace
            index={index}
            highlight={active === option.value}
            reduce={reduce}
            id={id}
          >
            <span
              className={styles.checkBox}
              data-checked={option.selected}
              aria-hidden="true"
            >
              <CheckboxMark checked={option.selected} />
            </span>
            {option.icon}
            <span className={styles.label}>{option.label}</span>
            {option.detail !== undefined && (
              <span className={styles.detail}>{option.detail}</span>
            )}
          </SmoothDropdownRowFace>
        </Item>
      ))}
    </>
  );
};

const SmoothDropdownActionItems = ({
  actions,
  setHighlighted,
  reduce,
  active,
  id,
  onCloseAtOnce,
}: {
  actions: SmoothDropdownAction[];
  setHighlighted: (value: string) => void;
  reduce: boolean | null;
  active: string | undefined;
  id: string;
  onCloseAtOnce: () => void;
}) => (
  <>
    {actions.map((action, index) => (
      <DropdownMenu.Item
        key={action.label}
        textValue={action.label}
        disabled={action.disabled}
        asChild
        onFocus={() => {
          setHighlighted(action.label);
        }}
        onPointerMove={() => {
          setHighlighted(action.label);
        }}
        onSelect={() => {
          if (action.opensDialog === true) {
            onCloseAtOnce();
          }

          action.onSelect();
        }}
      >
        <SmoothDropdownRowFace
          data-destructive={action.destructive}
          index={index}
          highlight={active === action.label}
          reduce={reduce}
          id={id}
        >
          {action.icon}
          <span className={styles.label}>{action.label}</span>
        </SmoothDropdownRowFace>
      </DropdownMenu.Item>
    ))}
  </>
);

/**
 * The menu's rows: options with their checkboxes, then actions (a "…"
 * menu's, or a filter's "clear").
 *
 * @returns The rows.
 */
export const SmoothDropdownRows = ({
  actions,
  highlighted,
  onCloseAtOnce,
  ...props
}: ComponentProps<typeof SmoothDropdownItems> & {
  actions: SmoothDropdownAction[] | undefined;
  highlighted: string | null;
  // The next close skips the shrink (an action that opens a dialog).
  onCloseAtOnce: () => void;
}) => (
  <>
    <SmoothDropdownItems {...props} />
    {actions && (
      <SmoothDropdownActionItems
        actions={actions}
        setHighlighted={props.setHighlighted}
        reduce={props.reduce}
        active={highlighted ?? undefined}
        id={props.id}
        onCloseAtOnce={onCloseAtOnce}
      />
    )}
  </>
);

/**
 * The open dropdown's content: its panel when it has one, otherwise its rows of
 * options.
 *
 * @param props - renderPanel: draws a panel instead of rows; close: closes the
 *   dropdown; multiple: whether several options may be chosen; items and
 *   options: the rows.
 * @returns The panel or the rows.
 */
export const SmoothDropdownBody = ({
  renderPanel,
  close,
  multiple,
  items,
  options,
}: {
  renderPanel?: (close: () => void) => ReactNode;
  close: () => void;
  multiple: boolean;
  items: ReactNode;
  options: SmoothDropdownOption[];
}): ReactNode => {
  if (renderPanel) {
    return renderPanel(close);
  }

  if (multiple || options.length === 0) {
    return items;
  }

  return (
    <DropdownMenu.RadioGroup
      value={options.find((option) => option.selected)?.value}
    >
      {items}
    </DropdownMenu.RadioGroup>
  );
};
