import { Suspense } from "react";
import type { ReactNode, CSSProperties } from "react";

import { app_skip_to_content } from "#/paraglide/messages";
import { AgentChatSearchDialog } from "@/components/agent-chat/page/agent-chat-search-dialog";
import { AppHeader } from "@/components/layout/shell/app-header";
import { AppLocaleTransition } from "@/components/layout/shell/app-locale-transition";
import { useAppSiteThemeSync } from "@/components/layout/shell/app-site-theme-sync";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/navigation/sidebar/sidebar-context";
import { SidebarInset } from "@/components/ui/navigation/sidebar/sidebar-layout";

const shellStyle: CSSProperties & {
  "--sidebar-width": string;
  "--header-height": string;
  "--sidebar-width-icon": string;
} = {
  "--sidebar-width": "17rem",
  "--header-height": "4rem",
  "--sidebar-width-icon": "4rem",
};

/**
 * An app page: the header with its title and actions, and the page's content
 * under it.
 *
 * @param props - title: the page's heading; actions: controls at the header's
 *   end; children: the page.
 * @returns The page.
 */
export const AppShell = ({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  useAppSiteThemeSync();

  return (
    <div className="app-shell">
      <SidebarProvider style={shellStyle}>
        <a
          href="#main-content"
          className="fixed start-4 top-4 z-50 -translate-y-24 rounded-md border bg-card px-4 py-2 text-foreground focus:translate-y-0"
        >
          {app_skip_to_content()}
        </a>
        <AppSidebar />
        <SidebarInset
          id="main-content"
          tabIndex={-1}
          className="@container/shell min-w-0"
        >
          <AppHeader title={title} actions={actions} />
          <div className="app-content @container/main flex min-w-0 flex-1 flex-col">
            {/* Navigation and the header never wait for page data: content
              that suspends (the saved groups) waits here alone. */}
            <Suspense fallback={null}>{children}</Suspense>
          </div>
        </SidebarInset>
        {/* ⌘K opens the agent's chat search from any page. */}
        <AgentChatSearchDialog />
        <AppLocaleTransition />
      </SidebarProvider>
    </div>
  );
};
