import { TanStackDevtools } from "@tanstack/react-devtools";
import { ScriptOnce } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

import "lenis/dist/lenis.css";

import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";
import { siteEnvironment } from "../shared/site/site-environment";
import { buttonPressCss } from "../shared/styles/button-press";
import { CookieConsentBanner } from "../widgets/cookie-consent/cookie-consent-banner";
import {
  cookieConsentStorageKey,
  legacyCookieConsentStorageKey,
} from "../widgets/cookie-consent/cookie-consent-storage";
import { SiteFooter } from "../widgets/footer/site-footer";
import { SiteHeader } from "../widgets/header/bar/site-header";
import { localeTransitionBootstrapScript } from "../widgets/header/locale/site-header-locale-transition";
import { siteThemeBootstrapScript } from "../widgets/header/theme/site-theme";

// The marketing website's part of the shared document (routes/__root.tsx):
// what its pages need around them and the app's pages under /app must not
// get (its theme and locale scripts, Analytics, smooth scrolling, header,
// footer and cookie banner).

const globalSmoothScrollOptions = {
  anchors: true,
  autoRaf: true,
  respectReducedMotion: true,
};

// Google Analytics loads only when the site has its own tag (VITE_GOOGLE_TAG_ID),
// in Consent Mode: analytics storage stays denied until the visitor accepts
// the cookie banner (a stored "accepted" grants it from the first page view;
// updateAnalyticsConsent handles a choice made on the page).
const { googleTagId } = siteEnvironment;

const googleTagBootstrapScript = isNonEmptyText(googleTagId)
  ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}var granted=false;try{granted=(localStorage.getItem(${JSON.stringify(cookieConsentStorageKey)})??localStorage.getItem(${JSON.stringify(legacyCookieConsentStorageKey)}))==="accepted"}catch(e){}gtag("consent","default",{ad_personalization:"denied",ad_storage:"denied",ad_user_data:"denied",analytics_storage:granted?"granted":"denied"});gtag("js",new Date);gtag("config","${googleTagId}")`
  : null;

/**
 * Runs before the page paints: Analytics first, then the stored locale
 * transition and theme, so a dark-theme visitor never sees a light flash.
 *
 * @returns The head's scripts.
 */
export const SiteHeadScripts = () => (
  <>
    {isNonEmptyText(googleTagBootstrapScript) ? (
      <>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
        />
        <ScriptOnce>{googleTagBootstrapScript}</ScriptOnce>
      </>
    ) : null}
    <ScriptOnce>{localeTransitionBootstrapScript}</ScriptOnce>
    <ScriptOnce>{siteThemeBootstrapScript}</ScriptOnce>
  </>
);

/**
 * The website's chrome around a page: smooth scrolling, the header and footer,
 * the cookie banner, and the devtools in development.
 *
 * @param props - children: the page.
 * @returns The page with its chrome.
 */
export const SiteChrome = ({ children }: { children: ReactNode }) => (
  <>
    <ReactLenis options={globalSmoothScrollOptions} root />
    <style>{buttonPressCss}</style>
    <SiteHeader />
    {children}
    <SiteFooter />
    <CookieConsentBanner />
    <TanStackDevtools
      config={{
        position: "bottom-right",
      }}
      plugins={[
        {
          name: "Tanstack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  </>
);
