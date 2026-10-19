"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import type { ComponentProps } from "react";

import { app_close } from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";

const Sheet = ({ ...props }: SheetPrimitive.Root.Props) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
);

const SheetClose = ({ ...props }: SheetPrimitive.Close.Props) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
);

const SheetPortal = ({ ...props }: SheetPrimitive.Portal.Props) => (
  <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
);

const SheetOverlay = ({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) => (
  <SheetPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={cn("app-backdrop", className)}
    {...props}
  />
);

type SheetSide = "top" | "right" | "bottom" | "left";

const SheetContent = ({
  className,
  children,
  side = "right",
  size = "default",
  showCloseButton = true,
  appearance = "default",
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: SheetSide;
  // "table" fits a full data table (the posts page's group picker).
  size?: "default" | "wide" | "table";
  showCloseButton?: boolean;
  appearance?: "default" | "group-details";
}) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Popup
      data-slot="sheet-content"
      data-side={side}
      data-size={size}
      className={cn(
        "fixed z-50 flex flex-col bg-popover bg-clip-padding text-base text-popover-foreground transition-[opacity,translate,filter] duration-(--duration-slow) ease-(--ease-smooth-out) data-ending-style:opacity-0 data-ending-style:duration-(--duration-medium) data-starting-style:opacity-0 data-starting-style:blur-(--blur-small) data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full motion-reduce:transition-none data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
        size === "wide" &&
          "w-full max-w-[36rem] data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-[36rem] data-[side=right]:sm:max-w-[36rem]",
        size === "table" &&
          "w-full max-w-[64rem] data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-[64rem] data-[side=right]:sm:max-w-[64rem]",
        appearance === "group-details" && "group-details-sheet",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <TooltipHint label={app_close()} side="bottom">
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              // Gray at rest, as every close and remove ×, not only on
              // hover.
              <Button
                variant="secondary"
                className="absolute end-4 top-4"
                size="icon-sm"
              />
            }
          >
            <AppIcon icon="close" />
            <span className="sr-only">{app_close()}</span>
          </SheetPrimitive.Close>
        </TooltipHint>
      )}
    </SheetPrimitive.Popup>
  </SheetPortal>
);

const SheetHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-ui-sm p-ui-md", className)}
    {...props}
  />
);

const SheetFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sheet-footer"
    className={cn("mt-auto flex flex-col gap-ui-sm p-ui-md", className)}
    {...props}
  />
);

const SheetTitle = ({ className, ...props }: SheetPrimitive.Title.Props) => (
  <SheetPrimitive.Title
    data-slot="sheet-title"
    className={cn("font-heading type-headline-lg text-heading", className)}
    {...props}
  />
);

const SheetDescription = ({
  className,
  ...props
}: SheetPrimitive.Description.Props) => (
  <SheetPrimitive.Description
    data-slot="sheet-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
