import { RegistryContext } from "@effect/atom-react";
import {
  HeadContent,
  ScriptOnce,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import type { AtomRegistry } from "effect/reactivity";
import type { ReactNode } from "react";

import { app_name, document_title } from "#/paraglide/messages";
import { getLocale, getTextDirection } from "#/paraglide/runtime";
import { DirectionProvider } from "@/components/ui/layout/direction";

import { SiteChrome, SiteHeadScripts } from "../website/document/site-document";
import {
  siteBodyProps,
  siteDocumentProps,
} from "../website/document/site-document-styles";
import { NotFoundPage } from "../website/pages/not-found/not-found-page";
import { localeTransitionBootstrapScript } from "../website/widgets/header/locale/site-header-locale-transition";
import { siteThemeBootstrapScript } from "../website/widgets/header/theme/site-theme";

import appCss from "../styles.css?url";
import websiteCss from "../website/document/website.css?url";

// One site: the marketing website on every path and the product under /app.
// Each section keeps its own global stylesheet (Tailwind's reset never
// reaches the website, the website's never reaches the app) and its own
// document: both follow their URL's language (Hebrew or /en English) and
// share one light or dark theme; the website adds its header and footer.
const isAppRouteId = (routeId: string) =>
  routeId === "/app" || routeId.startsWith("/app/");

const RootDocument = ({ children }: { children: ReactNode }) => {
  const { atomRegistry } = Route.useRouteContext();

  const inApp = useRouterState({
    select: (state) =>
      state.matches.some((match) => isAppRouteId(match.routeId)),
  });

  const direction = getTextDirection();

  return (
    <html
      lang={getLocale()}
      dir={direction}
      suppressHydrationWarning
      {...(inApp ? {} : siteDocumentProps)}
    >
      <head>
        {inApp ? (
          <>
            <ScriptOnce>{localeTransitionBootstrapScript}</ScriptOnce>
            <ScriptOnce>{siteThemeBootstrapScript}</ScriptOnce>
          </>
        ) : (
          <SiteHeadScripts />
        )}
        <HeadContent />
      </head>
      <body {...(inApp ? {} : siteBodyProps)}>
        <RegistryContext.Provider value={atomRegistry}>
          <DirectionProvider direction={direction}>
            {inApp ? children : <SiteChrome>{children}</SiteChrome>}
          </DirectionProvider>
        </RegistryContext.Provider>
        <Scripts />
      </body>
    </html>
  );
};

// The router's atom registry (see getRouter) reaches every loader.
export const Route = createRootRouteWithContext<{
  atomRegistry: AtomRegistry.AtomRegistry;
}>()({
  // A client navigation can change the language, so the document follows
  // it (paraglide's i18n example does the same).
  beforeLoad: () => {
    if (!import.meta.env.SSR) {
      document.documentElement.setAttribute("dir", getTextDirection());
      document.documentElement.setAttribute("lang", getLocale());
    }
  },
  head: ({ matches }) => {
    const inApp = matches.some((match) => isAppRouteId(match.routeId));

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#0866ff" },
        { name: "color-scheme", content: "light dark" },
        { title: inApp ? app_name() : document_title() },
      ],
      links: [
        { rel: "stylesheet", href: inApp ? appCss : websiteCss },
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon.png",
          sizes: "180x180",
        },
        {
          rel: "icon",
          href: "/brand/favicon-48x48.png",
          sizes: "48x48",
          type: "image/png",
        },
        {
          rel: "icon",
          href: "/brand/favicon-96x96.png",
          sizes: "96x96",
          type: "image/png",
        },
        {
          rel: "icon",
          href: "/brand/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          rel: "icon",
          href: "/brand/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          rel: "icon",
          href: "/favicon.ico",
          sizes: "48x48",
          type: "image/x-icon",
        },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
    };
  },
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});
