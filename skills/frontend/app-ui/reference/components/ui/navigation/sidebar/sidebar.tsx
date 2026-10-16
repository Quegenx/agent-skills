"use client";

import { cn } from "cn";
import type { ComponentProps } from "react";

import {
  app_navigation_menu,
  app_navigation_menu_mobile,
  app_toggle_sidebar,
} from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/feedback/dialog/sheet";
import { Button } from "@/components/ui/general/button";

import type { SidebarStyle } from "./sidebar-context";
import { useSidebar } from "./sidebar-context";
import { SidebarToggleIcon } from "./sidebar-toggle-icon";

const SIDEBAR_WIDTH_MOBILE = "18rem";

const mobileStyle: SidebarStyle = { "--sidebar-width": SIDEBAR_WIDTH_MOBILE };

/**
 * The sidebar: a fixed panel on desktop that collapses as collapsible says, and
 * a sheet on mobile.
 *
 * @param props - side, variant and collapsible; the panel's className,
 *   children, dir and other div props.
 * @returns The sidebar.
 */
export const Sidebar = ({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={mobileStyle}
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{app_navigation_menu()}</SheetTitle>
            <SheetDescription>{app_navigation_menu_mobile()}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-(--ease-smooth-out)",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-(--ease-smooth-out) data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * The button that opens and closes the sidebar, with its hint.
 *
 * @param props - The button's props; onClick runs before the toggle.
 * @returns The button.
 */
export const SidebarTrigger = ({
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button>) => {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();

  return (
    <TooltipHint label={app_toggle_sidebar()} side="bottom">
      <Button
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        aria-expanded={isMobile ? openMobile : open}
        aria-controls="workspace-navigation"
        variant="ghost"
        size="icon"
        className={cn(className)}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      >
        <SidebarToggleIcon isOpen={isMobile ? openMobile : open} />
        <span className="sr-only">{app_toggle_sidebar()}</span>
      </Button>
    </TooltipHint>
  );
};
