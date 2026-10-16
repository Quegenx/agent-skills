"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

const Tooltip = ({ ...props }: TooltipPrimitive.Root.Props) => (
  <TooltipPrimitive.Root data-slot="tooltip" {...props} />
);

// 80ms (--duration-micro) intent delay filters a passing cursor without the
// default 600ms wait; Base UI takes the delay as a number, not a CSS token.
const TooltipTrigger = ({
  delay = 80,
  ...props
}: TooltipPrimitive.Trigger.Props) => (
  <TooltipPrimitive.Trigger
    data-slot="tooltip-trigger"
    delay={delay}
    {...props}
  />
);

// The popup pops open on the source preview's spring and fades out
// (app-tooltip, tooltip.css).
const TooltipContent = ({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      className="isolate z-50"
    >
      <TooltipPrimitive.Popup
        data-slot="tooltip-content"
        className={cn(
          "app-tooltip z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-2xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pe-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-4xl",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:translate-x-[1.5px] data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:translate-x-[-1.5px] data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:translate-x-[-1.5px] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:translate-x-[1.5px] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
);

// The app's hint for one element: hovered (or focused), it shows `label` in
// the animated tooltip. The child is the element itself (a button, a time, a
// truncated name), rendered as the trigger with its own props and content.
// Use it instead of a native title, which neither animates nor matches the
// app.
const TooltipHint = ({
  label,
  children,
  side,
  closeDelay,
}: {
  label: React.ReactNode;
  children: React.ReactElement<{ children?: React.ReactNode }>;
  side?: TooltipPrimitive.Positioner.Props["side"];
  closeDelay?: number;
}) => (
  <Tooltip>
    <TooltipTrigger render={children} closeDelay={closeDelay}>
      {children.props.children}
    </TooltipTrigger>
    <TooltipContent side={side}>{label}</TooltipContent>
  </Tooltip>
);

export { Tooltip, TooltipTrigger, TooltipContent, TooltipHint };
