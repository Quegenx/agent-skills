import type { ReactNode } from "react";

import { AppNotifications } from "@/components/layout/shell/app-notifications";
import { SidebarTrigger } from "@/components/ui/navigation/sidebar/sidebar";

/**
 * title is the page's heading, or a control inside it, such as the agent
 * page's editable chat title. actions sit at the end of the header, such as
 * the agent page's tasks button, before the notifications bell every page
 * has.
 *
 * @returns The header.
 */
export const AppHeader = ({
  title,
  actions,
}: {
  title: ReactNode;
  actions?: ReactNode;
}) => (
  <header className="app-header @container/header flex min-h-16 shrink-0 items-center gap-ui-sm bg-background">
    <SidebarTrigger />
    <h1 className="type-headline-lg">{title}</h1>
    <div className="ms-auto flex items-center gap-1">
      {actions}
      <AppNotifications />
    </div>
  </header>
);
