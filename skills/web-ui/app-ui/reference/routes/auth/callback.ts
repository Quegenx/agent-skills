import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { readAuthRedirectPath } from "@/lib/auth/auth-redirect";
import { runAppRequest } from "@/server/runtime/app-runtime.server";
import { signedInSupabaseClient } from "@/server/runtime/supabase-client";

import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";

// Response.redirect() has immutable headers, but TanStack Start appends the
// session's Set-Cookie headers to non-2xx responses, so redirects are built here.
const authCallbackRedirect = (path: string) =>
  new Response(null, { status: 303, headers: { Location: path } });

// Email links (password recovery) land here with a PKCE code. Exchanging it
// needs the code verifier cookie set when the link was requested, so the link
// works only in the browser that asked for it.
const exchangeAuthCallback = async ({ request }: { request: Request }) =>
  await runAppRequest(
    Effect.gen(function* exchangeAuthCallbackCode() {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");

      const target =
        readAuthRedirectPath(url.searchParams.get("next")) ?? "/app/dashboard";

      if (isNonEmptyText(code)) {
        const supabase = yield* signedInSupabaseClient;

        const { error } = yield* Effect.promise(
          async () => await supabase.auth.exchangeCodeForSession(code)
        );

        if (!error) {
          return authCallbackRedirect(target);
        }
      }

      // An expired link reopens recovery in the link's language.
      return authCallbackRedirect(
        target.startsWith("/en/")
          ? "/en/app/forgot-password?expired=1"
          : "/app/forgot-password?expired=1"
      );
    })
  );

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: { GET: exchangeAuthCallback },
  },
});
