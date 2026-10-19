import { createFileRoute } from "@tanstack/react-router";

import { AppNotFoundPage } from "@/components/layout/shell/app-not-found-page";
import { readSessionUser } from "@/lib/auth/session-user-atom";

// The product, under /app (the marketing website owns the other paths).
// Its pages read the signed-in user from context to guard app and auth
// pages. It comes from the registry's cache (readSessionUser), so navigating
// between pages does not wait on a session round trip, and website pages
// never read the session at all.
export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context }) => ({
    user: await readSessionUser(context.atomRegistry),
  }),
  // A missing page under /app gets the app's 404, in the app's styles,
  // with its way out for a signed-in or a signed-out visitor.
  notFoundComponent: AppNotFoundPage,
});
