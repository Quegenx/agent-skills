import { isNonEmptyText } from "../../../backend/shared/text/non-empty-text";

// The app page a path is on: /app/agent/<chat> is the agent's page.
const appPageName = (pathname: string) =>
  /\/app\/(?<page>[^/]+)/u.exec(pathname)?.groups?.page;

/**
 * The view transition type of a move between two app pages, which the
 * page reveal in app-page-transition.css runs under (the router's
 * defaultViewTransition); anything else (opening settings, a chat within
 * the agent, the first load, the website) has none.
 *
 * @returns The transition types, or false for no transition.
 */
export const appPageTransitionTypes = ({
  fromLocation,
  toLocation,
}: {
  fromLocation?: { pathname: string };
  toLocation: { pathname: string };
}) => {
  const from = fromLocation && appPageName(fromLocation.pathname);
  const to = appPageName(toLocation.pathname);

  const touchesLogin = from === "login" || to === "login";

  if (
    !(isNonEmptyText(from) && isNonEmptyText(to)) ||
    from === to ||
    touchesLogin
  ) {
    return false;
  }

  return ["app-page"];
};
