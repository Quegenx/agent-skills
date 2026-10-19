import { LazyMotion, domMax, useReducedMotion } from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import { DropdownMenu, Popover } from "radix-ui";
import { useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { getTextDirection } from "#/paraglide/runtime";
import { TooltipTrigger } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";

import {
  dropdownMenuEstimate,
  dropdownMenuLeft,
  dropdownSpring,
  dropdownSurface,
  measureDropdownOpening,
  useDropdownMenuHeight,
  useDropdownPosition,
  useDropdownTriggerSize,
} from "./smooth-dropdown-geometry";
import type {
  SmoothDropdownAlign,
  SmoothDropdownAppearance,
} from "./smooth-dropdown-geometry";
import { SmoothDropdownBody, SmoothDropdownRows } from "./smooth-dropdown-rows";
import type {
  SmoothDropdownAction,
  SmoothDropdownOption,
} from "./smooth-dropdown-rows";
import {
  SmoothDropdownSearch,
  useSmoothDropdownSearch,
} from "./smooth-dropdown-search";
import {
  SmoothDropdownBackdrop,
  SmoothDropdownPortal,
  SmoothDropdownTrigger,
  SmoothDropdownTriggerHint,
} from "./smooth-dropdown-trigger";

import menuStyles from "./smooth-dropdown-menu.module.css";
import styles from "./smooth-dropdown.module.css";

// amichai-all's smooth dropdown (course-smooth-dropdown.tsx and its menu,
// items and options modules), ported 1:1 in behavior: the trigger's own
// surface springs open into the menu (380/34/0.8), rows fade in from the
// side 20ms apart, one highlight springs between rows (520/30/0.8), and each
// row shows a checkbox. Radix owns focus, keyboard and dismissal; the menu
// renders inside the morphing surface. Our colors and the page's reading
// direction replace its dark course theme.

const emptyOptions: SmoothDropdownOption[] = [];

/**
 * A dropdown of options (one, or several with multiple), of actions (a "…"
 * menu), or of any panel (renderPanel, such as a date picker). It floats by
 * default: while open its surface moves to the page root, tracking its
 * trigger, so a clipping container (a filters panel, a table, a sheet) never
 * cuts it off. fullWidth fills its form field; align centers a floating
 * panel under its trigger.
 *
 * @returns The dropdown.
 */
export const SmoothDropdown = ({
  triggerId,
  label,
  children,
  options = emptyOptions,
  actions,
  renderPanel,
  panelWidth = 220,
  appearance = "field",
  align = "start",
  multiple = false,
  floating = true,
  fullWidth = false,
  disabled = false,
  boundary,
  backdrop,
  onSelect,
  onOpenChange,
}: {
  // The trigger button's id, for a <label htmlFor>.
  triggerId?: string;
  label: string;
  children: ReactNode;
  options?: SmoothDropdownOption[];
  actions?: SmoothDropdownAction[];
  renderPanel?: (close: () => void) => ReactNode;
  panelWidth?: number;
  appearance?: SmoothDropdownAppearance;
  align?: SmoothDropdownAlign;
  multiple?: boolean;
  floating?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  boundary?: Element | null;
  // The app's backdrop behind the open surface, for a panel that takes the
  // page's attention (the notifications).
  backdrop?: boolean;
  onSelect?: (value: string) => void;
  // Told on opening and closing, such as to keep a row's "…" shown while
  // its menu is open.
  onOpenChange?: (open: boolean) => void;
}) => {
  const Primitive = renderPanel ? Popover : DropdownMenu;
  const direction = getTextDirection();
  const [openVersion, setOpenVersion] = useState(0);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const present = open || closing;

  const [opening, setOpening] = useState({
    alignStart: true,
    upward: false,
    maxHeight: 800,
    field: "",
  });

  const [highlighted, setHighlighted] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // Set by an action that opens a dialog, for the close it causes.
  const closeAtOnce = useRef(false);
  const { size, viewportWidth } = useDropdownTriggerSize(trigger);

  const { position, track } = useDropdownPosition(
    trigger,
    floating,
    open,
    closing
  );

  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const search = useSmoothDropdownSearch(options, !renderPanel, open, content);

  const menuHeight = useDropdownMenuHeight(open, content, () =>
    dropdownMenuEstimate(options, actions)
  );

  const id = useId();
  const reduce = useReducedMotion();

  const menuWidth = Math.min(
    Math.max(panelWidth, size.width),
    viewportWidth - 32
  );

  const active =
    highlighted ?? options.find((option) => option.selected)?.value;

  const contentStyle: CSSProperties &
    Record<`--${string}`, string | undefined> = {
    "--menu-max-height": `${opening.maxHeight}px`,
    "--menu-open-width": `${menuWidth}px`,
    "--trigger-top": `${position.top}px`,
    "--trigger-left": `${position.left}px`,
    "--trigger-bottom": `${position.bottom}px`,
    "--trigger-width": `${size.width}px`,
    "--field": opening.field || undefined,
  };

  const closedSurface = dropdownSurface(
    appearance,
    false,
    size.width,
    size.height,
    position.left
  );

  const changeOpen = (next: boolean) => {
    if (next && trigger.current) {
      const measured = measureDropdownOpening(
        trigger.current,
        boundary,
        menuHeight,
        menuWidth
      );

      track(measured.position);
      setOpening(measured);
    }

    // An action that opens a dialog closes the menu at once (no shrink).
    setClosing(!next && reduce !== true && !closeAtOnce.current);
    closeAtOnce.current = false;
    setOpen(next);
    onOpenChange?.(next);

    if (next) {
      setOpenVersion((version) => version + 1);
      setHighlighted(null);
      search.reset();
    }
  };

  const items = (
    <SmoothDropdownRows
      actions={actions}
      multiple={multiple}
      options={search.matches}
      setHighlighted={setHighlighted}
      onSelect={onSelect}
      onCloseAtOnce={() => {
        closeAtOnce.current = true;
      }}
      reduce={reduce}
      highlighted={highlighted}
      active={active}
      id={id}
    />
  );

  const shell = (
    <MotionDiv
      className={styles.shell}
      dir={direction}
      data-appearance={appearance}
      data-floating={floating}
      data-open={open}
      data-upward={opening.upward}
      data-align-start={opening.alignStart}
      data-present={present}
      style={contentStyle}
      initial={floating ? closedSurface : false}
      animate={
        open
          ? dropdownSurface(
              appearance,
              true,
              menuWidth,
              menuHeight,
              dropdownMenuLeft(position, menuWidth, align)
            )
          : closedSurface
      }
      transition={reduce === true ? { duration: 0 } : dropdownSpring}
      onAnimationComplete={() => {
        if (!open) {
          setClosing(false);
        }
      }}
    >
      <span aria-hidden="true" className={styles.returnLabel}>
        {children}
        <AppIcon icon="chevron-down" />
      </span>
      <Primitive.Content
        asChild
        aria-label={label}
        onEscapeKeyDown={(event) => {
          event.stopPropagation();
        }}
        onPointerLeave={() => {
          setHighlighted(null);
        }}
      >
        <div
          ref={setContent}
          className={menuStyles.items}
          data-list={!renderPanel}
          data-searchable={search.searchable}
          onKeyDownCapture={search.handleTyping}
        >
          <SmoothDropdownSearch
            searchable={search.searchable}
            inputRef={search.inputRef}
            query={search.query}
            onQueryChange={search.handleQueryChange}
            matches={search.matches}
            onPick={(value) => {
              onSelect?.(value);

              if (!multiple) {
                changeOpen(false);
              }
            }}
          />
          <SmoothDropdownBody
            key={openVersion}
            renderPanel={renderPanel}
            close={() => {
              changeOpen(false);
            }}
            multiple={multiple}
            items={items}
            options={search.matches}
          />
        </div>
      </Primitive.Content>
    </MotionDiv>
  );

  return (
    <LazyMotion features={domMax} strict>
      <Primitive.Root
        {...(renderPanel ? {} : { dir: direction })}
        modal={false}
        open={open}
        onOpenChange={changeOpen}
      >
        <span
          className={styles.anchor}
          data-appearance={appearance}
          data-floating={floating}
          data-full-width={fullWidth}
          data-open={open}
          data-present={present}
        >
          <SmoothDropdownTriggerHint
            label={label}
            appearance={appearance}
            open={open}
          >
            <Primitive.Trigger asChild>
              <TooltipTrigger
                render={
                  <SmoothDropdownTrigger
                    ref={trigger}
                    triggerId={triggerId}
                    label={label}
                    disabled={disabled}
                    open={open}
                    onToggle={() => {
                      changeOpen(!open);
                    }}
                  >
                    {children}
                  </SmoothDropdownTrigger>
                }
              />
            </Primitive.Trigger>
          </SmoothDropdownTriggerHint>
          <SmoothDropdownPortal portaled={floating && present}>
            {shell}
          </SmoothDropdownPortal>
        </span>
        <SmoothDropdownBackdrop
          enabled={backdrop}
          open={open}
          present={present}
          reduce={reduce}
        />
      </Primitive.Root>
    </LazyMotion>
  );
};
