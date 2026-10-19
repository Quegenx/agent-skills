import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useSidebar } from "@/components/ui/navigation/sidebar/sidebar-context";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/navigation/sidebar/sidebar-layout";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/navigation/sidebar/sidebar-menu";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

type AppSidebarNavUrl =
  | "/app/dashboard"
  | "/app/opportunities"
  | "/app/tasks"
  | "/app/groups"
  | "/app/my-groups"
  | "/app/posts"
  | "/app/ads";

/**
 * One sidebar section, such as "קבוצות": its label and its pages.
 * children are rows of its own after the pages, such as the agent's chats.
 *
 * @returns The section.
 */
export const AppSidebarNav = ({
  label,
  items,
  children,
}: {
  label?: string;
  children?: ReactNode;
  items: {
    title: string;
    url: AppSidebarNavUrl;
    icon: ReactNode;
    isActive: boolean;
    // A count shown at the row's end, such as new opportunities.
    count?: number;
  }[];
}) => {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {isNonEmptyText(label) && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                isActive={item.isActive}
                aria-current={item.isActive ? "page" : undefined}
                aria-label={item.title}
                tooltip={item.title}
                render={<Link to={item.url} />}
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.count !== undefined && item.count !== 0 ? (
                  <span className="app-sidebar-nav-count">
                    {item.count > 99 ? "99+" : item.count}
                  </span>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {children}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
