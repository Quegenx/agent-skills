import { Link } from "@tanstack/react-router";

import {
  app_email,
  app_forgot_title,
  app_logging_in,
  app_login_create_account,
  app_login_no_account,
  app_login_subtitle,
  app_login_title,
  app_login_title_accent,
  app_nav_login,
  app_password,
} from "#/paraglide/messages";
import {
  AuthForm,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "@/components/auth/auth-form";
import { AuthStep, AuthStepSwitch } from "@/components/auth/auth-layout";
import { useSessionAuthFormSubmit } from "@/lib/auth/auth-form-submit";
import { signInInputSchema } from "@/lib/auth/auth-session";

/**
 * The log-in page's content: email and password, with links to reset the
 * password or sign up instead.
 *
 * @returns The step.
 */
export const LoginStep = () => {
  const { pending, error, submit } = useSessionAuthFormSubmit(
    signInInputSchema,
    (calls, data) => calls.signInWithPassword(data)
  );

  return (
    <AuthStep
      titleLead={app_login_title()}
      titleAccent={app_login_title_accent()}
      subtitle={app_login_subtitle()}
      footer={
        <AuthStepSwitch
          label={app_login_create_account()}
          prompt={app_login_no_account()}
          to="/app/signup"
          variant="button"
        />
      }
    >
      <AuthForm pending={pending} error={error} onSubmit={submit}>
        <AuthTextField
          label={app_email()}
          name="email"
          type="email"
          autoComplete="username"
          required
        />
        <AuthPasswordField
          label={app_password()}
          name="password"
          autoComplete="current-password"
          required
          labelAside={
            <Link
              to="/app/forgot-password"
              search={(previous) => previous}
              className="auth-link"
            >
              {app_forgot_title()}
            </Link>
          }
        />
        <AuthSubmitButton pending={pending} pendingLabel={app_logging_in()}>
          {app_nav_login()}
        </AuthSubmitButton>
      </AuthForm>
    </AuthStep>
  );
};
