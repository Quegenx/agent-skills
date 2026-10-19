import { Link, useRouteContext } from "@tanstack/react-router";
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import { span as MotionSpan } from "motion/react-m";

import {
  app_action_log_in,
  not_found_back_home,
  not_found_description,
  not_found_title_accent,
  not_found_title_lead,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";
import { ButtonLink } from "@/components/ui/general/button";

import {
  notFoundQuestionMarkBob,
  notFoundQuestionMarkTransition,
} from "../../../website/pages/not-found/not-found-character-motion";
import { NotFoundHeadDrawing } from "../../../website/pages/not-found/not-found-head-drawing";

// Where each question mark floats, as the website's: 16% apart from the
// right, the middle one a little lower.
const appNotFoundQuestionMarks = [
  {
    className:
      "absolute top-0 right-0 text-5xl font-black text-primary select-none",
    id: "first",
    index: 0,
  },
  {
    className:
      "absolute top-[6%] right-[16%] text-5xl font-black text-primary select-none",
    id: "second",
    index: 1,
  },
  {
    className:
      "absolute top-0 right-[32%] text-5xl font-black text-primary select-none",
    id: "third",
    index: 2,
  },
];

// The website's 404 character (NotFoundIllustration), in the app's colors,
// its square canvas cropped to the head and the room above it for the
// question marks (the drawing leaves the lower third empty): a
// head whose eyes blink and look side to side every few seconds, with three
// question marks bobbing above it in the brand blue. Still under reduced
// motion.
const AppNotFoundIllustration = () => {
  const reduce = useReducedMotion() === true;

  return (
    <div
      aria-hidden="true"
      className="relative w-56 text-muted-foreground sm:w-64"
    >
      <svg
        aria-hidden="true"
        viewBox="40 20 244 192"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-auto w-full"
      >
        {/* The website's 1.25s eyes, under the app's 1s limit for motion. */}
        <NotFoundHeadDrawing animated={!reduce} eyeDuration={0.95} />
      </svg>
      {appNotFoundQuestionMarks.map((mark) => (
        <MotionSpan
          key={mark.id}
          animate={reduce ? undefined : notFoundQuestionMarkBob}
          transition={notFoundQuestionMarkTransition(mark.index)}
          className={mark.className}
        >
          ?
        </MotionSpan>
      ))}
    </div>
  );
};

/**
 * The 404 under /app, in the app's own design system: the website's
 * NotFoundPage is built on the website's styles (website.css), which
 * the app's document does not load, so under /app it rendered as bare text.
 * The website's character and words ("העמוד הזה לא נמצא.", its end in the
 * brand blue), without an error code a user has no use for, and one way
 * back: signed in, the dashboard; signed out, where every app page would
 * only lead to the login, the login itself or the website's home page.
 *
 * @returns The page.
 */
export const AppNotFoundPage = () => {
  const signedIn = useRouteContext({ from: "/app" }).user !== null;

  return (
    <LazyMotion features={domAnimation} strict>
      <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-background px-4 py-12 text-center text-foreground">
        <AppNotFoundIllustration />
        <div className="flex max-w-md flex-col items-center gap-4">
          <h1 className="type-display text-balance">
            {not_found_title_lead()}
            <span className="block text-primary">
              {not_found_title_accent()}
            </span>
          </h1>
          <p className="text-base text-muted-foreground">
            {not_found_description()}
          </p>
          {signedIn ? (
            <ButtonLink size="lg" render={<Link to="/app/dashboard" />}>
              {not_found_back_home()}
            </ButtonLink>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink size="lg" render={<Link to="/app/login" />}>
                {app_action_log_in()}
              </ButtonLink>
              <ButtonLink
                size="lg"
                variant="secondary"
                href={localizeHref("/")}
              >
                {not_found_back_home()}
              </ButtonLink>
            </div>
          )}
        </div>
      </main>
    </LazyMotion>
  );
};
