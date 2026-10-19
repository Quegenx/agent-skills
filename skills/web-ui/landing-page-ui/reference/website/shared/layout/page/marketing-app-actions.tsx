import type { ClassValue } from "cn";

import { app_action_log_in, app_action_sign_up } from "#/paraglide/messages";

import {
  appLoginHref,
  appSignUpHref,
  trackAppEntryClick,
} from "../../navigation/app-links";
import { ButtonLink } from "../../ui/button/button";

const handleSignUpClick = () => {
  trackAppEntryClick("sign_up");
};

const handleLogInClick = () => {
  trackAppEntryClick("log_in");
};

/**
 * Sign-up and log-in buttons into the app, for heroes and CTAs.
 *
 * @returns The sign-up and log-in buttons.
 */
export const MarketingAppActions = ({
  className,
}: {
  className?: ClassValue;
}) => (
  <>
    <ButtonLink
      href={appSignUpHref()}
      onClick={handleSignUpClick}
      size="large"
      className={className}
      tone="solidInk"
    >
      {app_action_sign_up()}
    </ButtonLink>
    <ButtonLink
      href={appLoginHref()}
      onClick={handleLogInClick}
      size="large"
      className={className}
      tone="softAccent"
    >
      {app_action_log_in()}
    </ButtonLink>
  </>
);
