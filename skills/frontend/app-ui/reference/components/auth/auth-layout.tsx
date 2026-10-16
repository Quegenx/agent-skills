import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { app_auth_brand_label, app_name } from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";

/**
 * The frame every auth page shares, built like the marketing site
 * (src/website): its hero's blue wash, the logo above a white card, and the
 * site's blur-and-rise reveal when the page loads (styles/auth/auth-page.css).
 * The logo leads back to the website.
 * The _auth layout route renders it once, so moving between login, sign-up
 * and recovery keeps it still and slides only the card's content
 * (StepSlideSwitcher).
 *
 * @returns The frame around the page.
 */
export const AuthFrame = ({ children }: { children: ReactNode }) => (
  <main className="auth-page">
    <div className="auth-stage">
      <a
        href={localizeHref("/")}
        className="auth-brand auth-reveal"
        aria-label={app_auth_brand_label()}
      >
        <img
          src="/brand/app-logo.webp"
          alt=""
          width={36}
          height={36}
        />
        {app_name()}
      </a>
      <section className="auth-card auth-reveal">{children}</section>
    </div>
  </main>
);

/**
 * One auth page's content inside the card: the site's two-line display title
 * (the second line in blue), a subtitle, the form, and a footer linking to
 * the other auth page under a divider.
 * The line under an auth step that switches to the other step. It keeps
 * ?redirect= so the user still lands where they were headed.
 *
 * @returns The footer's prompt and link.
 */
export const AuthStepSwitch = ({
  label,
  prompt,
  to,
  variant,
}: {
  label: string;
  prompt: string;
  to: "/app/login" | "/app/signup";
  variant: "button" | "link";
}) => (
  <>
    <span>{prompt}</span>
    <Link
      to={to}
      search={(previous) => previous}
      className={variant === "button" ? "auth-button" : "auth-link"}
      data-variant={variant === "button" ? "soft" : undefined}
    >
      {label}
    </Link>
  </>
);

/**
 * One auth page's content inside the card: the two-line title (its second line
 * in blue), a subtitle, the form and a footer.
 *
 * @param props - titleLead and titleAccent: the title's two lines; subtitle;
 *   footer; children: the form.
 * @returns The step.
 */
export const AuthStep = ({
  titleLead,
  titleAccent,
  subtitle,
  footer,
  children,
}: {
  titleLead: string;
  titleAccent?: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}) => (
  <>
    <h1 className="auth-title">
      {titleLead}
      {isNonEmptyText(titleAccent) && (
        <span className="auth-title-accent">{titleAccent}</span>
      )}
    </h1>
    <p className="auth-subtitle">{subtitle}</p>
    {children}
    {footer !== undefined && footer !== null && (
      <div className="auth-footer">{footer}</div>
    )}
  </>
);
