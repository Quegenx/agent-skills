import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import {
  app_nav_new_password,
  app_page_title,
  app_saving,
  app_update_password_continue,
  app_update_password_label,
  app_update_password_saved,
  app_update_password_submit,
  app_update_password_subtitle,
  app_update_password_title,
} from "#/paraglide/messages";
import {
  AuthForm,
  AuthNotice,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { AuthFrame, AuthStep } from "@/components/auth/auth-layout";
import { useAuthFormSubmit } from "@/lib/auth/auth-form-submit";
import { passwordUpdateInputSchema } from "@/lib/auth/auth-session";

const UpdatePassword = () => {
  const [saved, setSaved] = useState(false);

  const { pending, error, submit } = useAuthFormSubmit(
    passwordUpdateInputSchema,
    (calls, data) => calls.updatePassword(data),
    () => {
      setSaved(true);
    }
  );

  return (
    <AuthFrame>
      <AuthStep
        titleLead={app_update_password_title()}
        subtitle={app_update_password_subtitle()}
      >
        {saved ? (
          <div className="auth-form">
            <AuthNotice tone="info">{app_update_password_saved()}</AuthNotice>
            <Link
              to="/app/dashboard"
              className="auth-button"
              data-variant="primary"
            >
              {app_update_password_continue()}
            </Link>
          </div>
        ) : (
          <AuthForm pending={pending} error={error} onSubmit={submit}>
            <AuthPasswordField
              label={app_update_password_label()}
              name="password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              required
            />
            <AuthSubmitButton pending={pending} pendingLabel={app_saving()}>
              {app_update_password_submit()}
            </AuthSubmitButton>
          </AuthForm>
        )}
      </AuthStep>
    </AuthFrame>
  );
};

// Without a session, recovery starts again. TanStack's redirect with `throw`
// throws the redirect itself (a Response, which TanStack catches).
const redirectToForgotPassword = (): never => {
  redirect({ to: "/app/forgot-password", throw: true });

  throw new Error("APP_RECOVERY_REDIRECT_NOT_THROWN: redirect did not throw");
};

// Reached from the recovery email through /auth/callback, which signs the user in.
export const Route = createFileRoute("/app/update-password")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      redirectToForgotPassword();
    }
  },
  head: () => ({
    meta: [{ title: app_page_title({ page: app_nav_new_password() }) }],
  }),
  component: UpdatePassword,
});
