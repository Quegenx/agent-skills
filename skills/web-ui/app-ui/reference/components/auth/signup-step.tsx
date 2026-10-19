import {
  app_email,
  app_full_name,
  app_nav_login,
  app_nav_signup,
  app_password_min,
  app_signup_has_account,
  app_signup_pending,
  app_signup_subtitle,
  app_signup_title,
  app_signup_title_accent,
} from "#/paraglide/messages";
import {
  AuthForm,
  AuthPasswordField,
  AuthSubmitButton,
  AuthTextField,
} from "@/components/auth/auth-form";
import { AuthStep, AuthStepSwitch } from "@/components/auth/auth-layout";
import { useSessionAuthFormSubmit } from "@/lib/auth/auth-form-submit";
import { signUpInputSchema } from "@/lib/auth/auth-session";

/**
 * The sign-up page's content: name, email and password, with a link to log in
 * instead.
 *
 * @returns The step.
 */
export const SignupStep = () => {
  const { pending, error, submit } = useSessionAuthFormSubmit(
    signUpInputSchema,
    (calls, data) => calls.signUpWithPassword(data)
  );

  return (
    <AuthStep
      titleLead={app_signup_title()}
      titleAccent={app_signup_title_accent()}
      subtitle={app_signup_subtitle()}
      footer={
        <AuthStepSwitch
          label={app_nav_login()}
          prompt={app_signup_has_account()}
          to="/app/login"
          variant="link"
        />
      }
    >
      <AuthForm pending={pending} error={error} onSubmit={submit}>
        <AuthTextField
          label={app_full_name()}
          name="name"
          autoComplete="name"
          maxLength={120}
          required
        />
        <AuthTextField
          label={app_email()}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <AuthPasswordField
          label={app_password_min()}
          name="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={72}
          required
        />
        <AuthSubmitButton pending={pending} pendingLabel={app_signup_pending()}>
          {app_nav_signup()}
        </AuthSubmitButton>
      </AuthForm>
    </AuthStep>
  );
};
