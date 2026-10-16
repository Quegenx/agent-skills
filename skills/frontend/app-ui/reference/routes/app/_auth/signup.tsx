import { createFileRoute } from "@tanstack/react-router";

import { app_nav_signup, app_page_title } from "#/paraglide/messages";

// Its content is SignupStep, which the _auth layout slides in.
export const Route = createFileRoute("/app/_auth/signup")({
  head: () => ({
    meta: [{ title: app_page_title({ page: app_nav_signup() }) }],
  }),
});
