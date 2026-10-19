import { createFileRoute } from "@tanstack/react-router";

import { app_nav_forgot_password, app_page_title } from "#/paraglide/messages";

// expired is set by /auth/callback when a recovery link cannot be exchanged.
interface PasswordResetSearch {
  expired?: boolean;
}

// Its content is ForgotPasswordStep, which the _auth layout slides in.
export const Route = createFileRoute("/app/_auth/forgot-password")({
  validateSearch: (search: { expired?: number }): PasswordResetSearch =>
    search.expired === 1 ? { expired: true } : {},
  head: () => ({
    meta: [{ title: app_page_title({ page: app_nav_forgot_password() }) }],
  }),
});
