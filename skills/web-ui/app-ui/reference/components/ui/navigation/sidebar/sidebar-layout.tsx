"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import type { ComponentProps } from "react";

const SidebarInset = ({ className, ...props }: ComponentProps<"main">) => (
  <main
    data-slot="sidebar-inset"
    className={cn(
      "relative flex w-full flex-1 flex-col bg-background",
      className
    )}
    {...props}
  />
);

const SidebarHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sidebar-header"
    data-sidebar="header"
    className={cn(
      "flex flex-col gap-2 p-2 [--radius:var(--radius-xl)]",
      className
    )}
    {...props}
  />
);

const SidebarFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sidebar-footer"
    data-sidebar="footer"
    className={cn("flex flex-col gap-2 p-2", className)}
    {...props}
  />
);

const SidebarContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sidebar-content"
    data-sidebar="content"
    className={cn(
      "no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto [--radius:var(--radius-xl)] group-data-[collapsible=icon]:overflow-hidden",
      className
    )}
    {...props}
  />
);

const SidebarGroup = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    data-slot="sidebar-group"
    data-sidebar="group"
    className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
    {...props}
  />
);

const SidebarGroupLabel = ({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & ComponentProps<"div">) => (
  <>
    {useRender({
      defaultTagName: "div",
      props: mergeProps<"div">(
        {
          className: cn(
            "flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium text-sidebar-foreground/70 outline-hidden transition-[margin,opacity] duration-200 ease-(--ease-smooth-out) group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-4 [&>svg]:shrink-0",
            className
          ),
        },
        props
      ),
      render,
      state: {
        slot: "sidebar-group-label",
        sidebar: "group-label",
      },
    })}
  </>
);

const SidebarGroupContent = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <div
    data-slot="sidebar-group-content"
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
);

export {
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
};
