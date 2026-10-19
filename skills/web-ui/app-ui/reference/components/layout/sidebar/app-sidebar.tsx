import { getRouteApi, Link, useLocation } from "@tanstack/react-router";

import {
  app_name,
  app_nav_ad_library,
  app_nav_dashboard,
  app_nav_group_search,
  app_nav_my_groups,
  app_nav_opportunities,
  app_nav_posts_comments,
  app_nav_section_facebook,
  app_nav_section_general,
  app_nav_section_tracking,
  app_nav_tasks,
  app_sidebar_close_navigation,
  app_sidebar_home_label,
  app_sidebar_workspace,
} from "#/paraglide/messages";
import { getTextDirection } from "#/paraglide/runtime";
import { AppSidebarAccount } from "@/components/layout/sidebar/app-sidebar-account";
import { AppSidebarAgentChats } from "@/components/layout/sidebar/app-sidebar-agent-chats";
import { useAppSidebarHoverHighlight } from "@/components/layout/sidebar/app-sidebar-hover-highlight";
import { AppSidebarNav } from "@/components/layout/sidebar/app-sidebar-nav";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { Button } from "@/components/ui/general/button";
import { AppIcon } from "@/components/ui/general/app-icon";
import { Sidebar } from "@/components/ui/navigation/sidebar/sidebar";
import { useSidebar } from "@/components/ui/navigation/sidebar/sidebar-context";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/navigation/sidebar/sidebar-layout";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/navigation/sidebar/sidebar-menu";
import { useUserNotifications } from "@/lib/notifications/user-notification-atoms";
import { useUserPlan } from "@/lib/plans/user-plan-atoms";

const appRouteApi = getRouteApi("/app/_app");

/**
 * The app's sidebar: its sections and pages, the agent's chats, the new
 * opportunities count and the account.
 *
 * @returns The sidebar.
 */
export const AppSidebar = () => {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const hover = useAppSidebarHoverHighlight();
  const footerHover = useAppSidebarHoverHighlight();
  const { user } = appRouteApi.useRouteContext();
  const { newOpportunities } = useUserNotifications(user.id);
  const plan = useUserPlan(user.id);
  const direction = getTextDirection();

  return (
    <Sidebar
      side={direction === "rtl" ? "right" : "left"}
      dir={direction}
      variant="inset"
      collapsible="icon"
    >
      <SidebarHeader className="flex-row items-center">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              aria-label={app_sidebar_home_label()}
              render={<Link to="/app/dashboard" />}
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <img
                src="/brand/app-logo.webp"
                alt=""
                width={32}
                height={32}
                className="app-sidebar-brand-logo"
              />
              <span className="app-sidebar-brand-label">
                <strong>{app_name()}</strong>
                <span>{app_sidebar_workspace()}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <TooltipHint label={app_sidebar_close_navigation()}>
          <Button
            variant="sidebar"
            size="icon-sm"
            className="md:hidden"
            aria-label={app_sidebar_close_navigation()}
            onClick={() => {
              setOpenMobile(false);
            }}
          >
            <AppIcon icon="close" aria-hidden="true" />
          </Button>
        </TooltipHint>
      </SidebarHeader>
      {/* Three sections: the home page and the agent; what is tracked and
          what it found; and Facebook itself, its groups, posts and (business
          up) the Ad Library. הגדרות is a dialog, opened from the footer. */}
      <SidebarContent id="workspace-navigation" {...hover.containerProps}>
        <div {...hover.highlightProps} />
        <AppSidebarNav
          label={app_nav_section_general()}
          items={[
            {
              title: app_nav_dashboard(),
              url: "/app/dashboard",
              icon: <AppIcon icon="grid" />,
              isActive: pathname === "/app/dashboard",
            },
          ]}
        >
          <AppSidebarAgentChats />
        </AppSidebarNav>
        <AppSidebarNav
          label={app_nav_section_tracking()}
          items={[
            {
              title: app_nav_tasks(),
              url: "/app/tasks",
              icon: <AppIcon icon="nav-tasks" />,
              isActive: pathname === "/app/tasks",
            },
            {
              title: app_nav_opportunities(),
              url: "/app/opportunities",
              icon: <AppIcon icon="opportunities" />,
              isActive: pathname === "/app/opportunities",
              count: newOpportunities,
            },
          ]}
        />
        <AppSidebarNav
          label={app_nav_section_facebook()}
          items={[
            {
              title: app_nav_group_search(),
              url: "/app/groups",
              icon: <AppIcon icon="nav-group-search" />,
              isActive: pathname === "/app/groups",
            },
            {
              title: app_nav_my_groups(),
              url: "/app/my-groups",
              icon: <AppIcon icon="nav-my-groups" />,
              isActive: pathname === "/app/my-groups",
            },
            {
              title: app_nav_posts_comments(),
              url: "/app/posts",
              icon: <AppIcon icon="posts" />,
              isActive: pathname === "/app/posts",
            },
            // The Ad Library is the business and pro plans'.
            ...(plan?.adLibrary === false
              ? []
              : [
                  {
                    title: app_nav_ad_library(),
                    url: "/app/ads" as const,
                    icon: <AppIcon icon="ad-library" />,
                    isActive: pathname === "/app/ads",
                  },
                ]),
          ]}
        />
      </SidebarContent>
      <SidebarFooter {...footerHover.containerProps}>
        <div {...footerHover.highlightProps} />
        <AppSidebarAccount />
      </SidebarFooter>
    </Sidebar>
  );
};
