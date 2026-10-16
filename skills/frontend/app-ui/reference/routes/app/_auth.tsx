import { createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import type { ComponentType } from "react";

import { AuthFrame } from "@/components/auth/auth-layout";
import { ForgotPasswordStep } from "@/components/auth/forgot-password-step";
import { LoginStep } from "@/components/auth/login-step";
import { SignupStep } from "@/components/auth/signup-step";
import { StepSlideSwitcher } from "@/components/ui/layout/step-slide-switcher";
import { readAuthRedirectPath } from "@/lib/auth/auth-redirect";
import type { AuthRedirectSearch } from "@/lib/auth/auth-redirect";

// The auth pages and how deep each sits: login is the root, sign-up and
// recovery are pushed on top of it. The child routes hold only their title
// and search params; this layout renders their content, so the frame stays
// mounted and only the card's content slides between them.
const authSteps = {
  "/app/login": { depth: 0, Step: LoginStep },
  "/app/signup": { depth: 1, Step: SignupStep },
  "/app/forgot-password": { depth: 1, Step: ForgotPasswordStep },
} satisfies Record<string, { depth: number; Step: ComponentType }>;

const isAuthStepPath = (pathname: string): pathname is keyof typeof authSteps =>
  Object.hasOwn(authSteps, pathname);

const readAuthStep = (pathname: string) =>
  isAuthStepPath(pathname) ? authSteps[pathname] : authSteps["/app/login"];

const AuthLayout = () => {
  const location = useLocation();
  const step = readAuthStep(location.pathname);
  const historyIndex = location.state.__TSR_index;

  // Going back is a shallower page or a step back in history (the browser's
  // back button); either slides the other way.
  const [shown, setShown] = useState({
    pathname: location.pathname,
    historyIndex,
    reverse: false,
  });

  if (shown.pathname !== location.pathname) {
    const shownDepth = readAuthStep(shown.pathname).depth;
    setShown({
      pathname: location.pathname,
      historyIndex,
      reverse: historyIndex < shown.historyIndex || step.depth < shownDepth,
    });
  }

  return (
    <AuthFrame>
      {/* The document is always Hebrew (routes/__root.tsx: dir="rtl"). */}
      <StepSlideSwitcher
        stepKey={shown.pathname}
        reverse={shown.reverse}
        dir="rtl"
      >
        <step.Step />
      </StepSlideSwitcher>
    </AuthFrame>
  );
};

// Login, sign-up and recovery are for signed-out visitors only. Once a form
// signs the user in, router.invalidate() reruns this guard, which sends them
// on to the page that asked for login.
// A signed-in visitor goes where they were headed. TanStack's redirect with
// `throw` throws the redirect itself (a Response, which TanStack catches).
const redirectSignedInVisitor = (href: string): never => {
  redirect({ href, throw: true });

  throw new Error("APP_SIGNED_IN_REDIRECT_NOT_THROWN: redirect did not throw");
};

export const Route = createFileRoute("/app/_auth")({
  validateSearch: (search: AuthRedirectSearch): AuthRedirectSearch => ({
    redirect: readAuthRedirectPath(search.redirect),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      redirectSignedInVisitor(search.redirect ?? "/app/dashboard");
    }
  },
  component: AuthLayout,
});
