import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { getRouteApi } from "@tanstack/react-router";
import { Effect } from "effect";
import { useContext, useEffect, useRef } from "react";

import { getLocale } from "#/paraglide/runtime";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import { appLocaleSwitchAtom } from "@/lib/i18n/app-locale-switch-atom";
import { flushUserSettingsWrites } from "@/lib/settings/user-settings/user-settings-atoms";
import { UserSettingsServerCalls } from "@/lib/settings/user-settings/user-settings-server-calls";
import { flushUserPageStates } from "@/lib/user-state/user-page-state-atom";

import { useLocaleStairTransition } from "../../../website/widgets/header/locale/site-header-locale-transition";

// The website's language switch animation in the app: blue stairs drop over
// the page with the logo, pending settings and page edits save, the page
// reloads in the other language, and the stairs lift off it
// (useLocaleStairTransition). Styled by the app (styles/layout/shell/app-shell.css),
// since the website's stylesheet never reaches the app. The shell renders
// it, so the reveal plays on every page, phones included. It also saves
// the language for the monitor.
const appRouteApi = getRouteApi("/app/_app");

/**
 * The language switch's transition: stairs cover the page while the language
 * changes and the page's unsaved settings are saved; each load also saves the
 * page's language for the task monitor.
 *
 * @returns The transition's overlay.
 */
export const AppLocaleTransition = () => {
  const registry = useContext(RegistryContext);
  const { user } = appRouteApi.useRouteContext();
  // Each load saves the page's language, so the task monitor writes match
  // descriptions in it (user_settings.app_locale); a failed save waits for
  // the next load.
  useEffect(() => {
    void runClientEffect(
      registry,
      Effect.flatMap(Effect.service(UserSettingsServerCalls), (calls) =>
        calls.saveUserAppLocale({ userId: user.id, locale: getLocale() })
      ).pipe(Effect.ignore)
    );
  }, [registry, user.id]);
  const targetLocale = useAtomValue(appLocaleSwitchAtom);
  const overlayRef = useRef<HTMLDivElement>(null);

  const stairs = useLocaleStairTransition(
    overlayRef,
    targetLocale,
    async () => {
      await runClientEffect(
        registry,
        Effect.all([flushUserSettingsWrites, flushUserPageStates], {
          concurrency: "unbounded",
        }).pipe(Effect.asVoid)
      );
    }
  );

  return (
    <div
      ref={overlayRef}
      className="app-locale-transition"
      data-locale-transition-overlay
      data-active={targetLocale ? "" : undefined}
    >
      <div className="app-locale-transition-stairs">
        {stairs.map((stair) => (
          <div key={stair} data-locale-stair={stair} />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="app-locale-transition-logo"
        // The English wordmark keeps its logo on the left in both languages.
        dir="ltr"
        data-locale-logo
      >
        <img
          src="/brand/app-logo.webp"
          alt=""
          width={36}
          height={36}
        />
        App
      </div>
    </div>
  );
};
