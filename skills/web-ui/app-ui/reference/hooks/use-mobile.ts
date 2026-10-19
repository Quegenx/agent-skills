import { useSyncExternalStore } from "react";

// The same breakpoint as the shell's `@media (width < 48rem)` (app-shell.css),
// in rem so it follows the reader's font size.
const mobileQuery = "(width < 48rem)";

const subscribeToMobileQuery = (onChange: () => void) => {
  const mql = window.matchMedia(mobileQuery);
  mql.addEventListener("change", onChange);

  return () => {
    mql.removeEventListener("change", onChange);
  };
};

/**
 * Server render has no viewport, so it reports desktop (false) like before.
 *
 * @returns Whether the viewport is mobile-sized.
 */
export const useIsMobile = () =>
  useSyncExternalStore(
    subscribeToMobileQuery,
    () => window.matchMedia(mobileQuery).matches,
    () => false
  );
