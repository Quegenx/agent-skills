import { RegistryContext } from "@effect/atom-react";
import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import { Option, Schema } from "effect";
import { useContext, useEffect } from "react";

import { AppShell } from "@/components/layout/shell/app-shell";
import { SettingsDialog } from "@/components/settings/page/settings-dialog";
import { agentMemoriesAtom } from "@/lib/agent-memory/agent-memory-atoms";
import { warmServerReads } from "@/lib/atoms/server-read-atom";
import { facebookAccountsAtom } from "@/lib/facebook-accounts/facebook-account-atoms";
import { GroupFinderProvider } from "@/lib/groups/finder/group-finder-provider";
import { savedGroupsAtom } from "@/lib/groups/saved/saved-group-atoms";
import { userNotificationsAtom } from "@/lib/notifications/user-notification-atoms";
import { reportJourneyTiming } from "@/lib/perf/journey-timing-report";
import { userPlanAtom } from "@/lib/plans/user-plan-atoms";
import { settingsDialogSectionSchema } from "@/lib/settings/user-settings/settings-dialog-section";
import type { SettingsDialogSearch } from "@/lib/settings/user-settings/settings-dialog-section";
import { userSettingsAtom } from "@/lib/settings/user-settings/user-settings-atoms";

const appLoadMark = "app-load-reported";

const decodeSettingsDialogSection = Schema.decodeUnknownOption(
  settingsDialogSectionSchema
);

// Every app page requires a signed-in user; others are sent to login and back.
// The layout renders the app shell once, around every page.
const AppLayout = () => {
  const { user } = Route.useRouteContext();
  const { settings } = Route.useSearch();
  // The router's, not this layout's: "." stays on the open page instead of
  // resolving against the layout's own path (/app).
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const registry = useContext(RegistryContext);
  // The first effect after hydration: the page is interactive.
  useEffect(() => {
    // Once per page load: a performance mark stays on the page through
    // client navigations and a development code reload, which would
    // otherwise count from the tab's first load.
    if (performance.getEntriesByName(appLoadMark).length > 0) {
      return;
    }

    performance.mark(appLoadMark);
    void reportJourneyTiming(registry, {
      journey: "app-load",
      ms: Math.round(performance.now()),
      details: { page: `/${pathname.split("/")[1] ?? ""}` },
    });
  }, [pathname, registry]);

  // The shell (sidebar and header) stays mounted from page to page; each
  // page names its header in its route's staticData.
  const { pageTitle, PageTitle, PageActions } = useMatches({
    select: (matches) => matches.at(-1)?.staticData ?? {},
  });

  return (
    <GroupFinderProvider key={user.id} userId={user.id}>
      <AppShell
        title={PageTitle ? <PageTitle /> : pageTitle?.()}
        actions={PageActions && <PageActions />}
      >
        <Outlet />
      </AppShell>
      <SettingsDialog
        userId={user.id}
        section={settings}
        onSectionChange={(section) => {
          void navigate({
            to: ".",
            search: (current) => ({ ...current, settings: section }),
            // Opening is a step Back undoes; switching sections or closing
            // replaces it, so Back never reopens a closed dialog.
            replace: settings !== undefined,
          });
        }}
      />
    </GroupFinderProvider>
  );
};

// A signed-out visitor goes to login, then back here. TanStack's redirect
// with `throw` throws the redirect itself (a Response, which TanStack
// catches), so this never returns and the signed-in context stays non-null.
const redirectSignedOutVisitor = (href: string): never => {
  redirect({ to: "/app/login", search: { redirect: href }, throw: true });

  throw new Error("APP_LOGIN_REDIRECT_NOT_THROWN: redirect did not throw");
};

export const Route = createFileRoute("/app/_app")({
  // ?settings=<section> opens the settings dialog on any app page.
  validateSearch: (search: { settings?: string }): SettingsDialogSearch => ({
    settings: Option.getOrUndefined(
      decodeSettingsDialogSection(search.settings)
    ),
  }),
  // The open settings section, so its reads start with the loader below.
  loaderDeps: ({ search }) => ({ settings: search.settings }),
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      return redirectSignedOutVisitor(location.href);
    }

    return { user: context.user };
  },
  // "My groups" is shared by every app page (save buttons, the list), the
  // header's notifications and the sidebar's plan by every page. A server
  // render waits for them (warmServerReads), so its HTML shows them; in the
  // browser they start reading here without blocking, and content that
  // needs the saved groups waits in AppShell's Suspense boundary. With
  // ?settings open, every settings section's reads start too: the link to
  // it preloads this loader on hover (defaultPreload "intent"), so the
  // dialog and each of its tabs open with their data.
  loader: async ({ context, deps }) => {
    await warmServerReads(context.atomRegistry, [
      savedGroupsAtom(context.user.id),
      userNotificationsAtom(context.user.id),
      userPlanAtom(context.user.id),
      ...(deps.settings
        ? [
            userSettingsAtom(context.user.id),
            facebookAccountsAtom(context.user.id),
            agentMemoriesAtom(context.user.id),
          ]
        : []),
    ]);
  },
  component: AppLayout,
});
