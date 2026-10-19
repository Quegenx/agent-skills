import { Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";

import {
  app_email,
  app_forgot_back,
  app_forgot_expired,
  app_forgot_resend,
  app_forgot_send,
  app_forgot_sent_after,
  app_forgot_sent_before,
  app_forgot_subtitle,
  app_forgot_title,
  app_forgot_title_accent,
  app_sending,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import {
  AuthForm,
  AuthNotice,
  AuthSubmitButton,
  AuthTextField,
} from "@/components/auth/auth-form";
import { AuthStep } from "@/components/auth/auth-layout";
import { useAuthFormSubmit } from "@/lib/auth/auth-form-submit";
import { passwordResetInputSchema } from "@/lib/auth/auth-session";

import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";

/**
 * The forgot-password page's content: the email to send a reset link to, then
 * where it was sent; it also says when a reset link has expired.
 *
 * @returns The step.
 */
export const ForgotPasswordStep = () => {
  // Not strict: while it slides out, this step is no longer the matched
  // route. expired is set by /auth/callback when a recovery link cannot be
  // exchanged.
  const { expired } = useSearch({ strict: false });
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { pending, error, submit } = useAuthFormSubmit(
    passwordResetInputSchema,
    (calls, data) =>
      calls.requestPasswordReset({ ...data, locale: getLocale() }),
    (data) => {
      setSentTo(data.email);
    }
  );

  return (
    <AuthStep
      titleLead={app_forgot_title()}
      titleAccent={app_forgot_title_accent()}
      subtitle={app_forgot_subtitle()}
      footer={
        <Link
          to="/app/login"
          search={(previous) => previous}
          className="auth-link"
        >
          {app_forgot_back()}
        </Link>
      }
    >
      <AuthForm
        pending={pending}
        error={error}
        notices={
          <>
            {expired === true && !isNonEmptyText(sentTo) && (
              <AuthNotice tone="error">{app_forgot_expired()}</AuthNotice>
            )}
            {isNonEmptyText(sentTo) && (
              <AuthNotice tone="info">
                {app_forgot_sent_before()}
                <bdi>{sentTo}</bdi>
                {app_forgot_sent_after()}
              </AuthNotice>
            )}
          </>
        }
        onSubmit={submit}
      >
        <AuthTextField
          label={app_email()}
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <AuthSubmitButton pending={pending} pendingLabel={app_sending()}>
          {isNonEmptyText(sentTo) ? app_forgot_resend() : app_forgot_send()}
        </AuthSubmitButton>
      </AuthForm>
    </AuthStep>
  );
};
