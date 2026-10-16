import { cn } from "../../styles/site-class-merge";
import { appLockupStyles as styles } from "./app-lockup.styles";

/**
 * The App logo (the app's own, public/brand/app-logo.webp)
 * and wordmark.
 * The wordmark is live text in the site's theme color, or white on the
 * footer's dark panel (tone="onDark"); "App" reads the same in both
 * locales, so it is not translated. It is decorative: the link around it
 * carries the accessible name.
 *
 * @returns The lockup.
 */
export const AppLockup = ({
  hideWordmarkOnPhone = false,
  size = "small",
  tone = "default",
}: {
  hideWordmarkOnPhone?: boolean;
  size?: "small" | "large";
  tone?: "default" | "onDark";
}) => (
  <span aria-hidden="true" className={cn(styles.lockup, styles[size])}>
    <img
      alt=""
      height={32}
      src="/brand/app-logo.webp"
      width={32}
      className={styles.mark}
    />
    <span
      className={cn(
        styles.wordmark,
        tone === "onDark" && styles.wordmarkOnDark,
        hideWordmarkOnPhone && styles.wordmarkHiddenOnPhone
      )}
    >
      App
    </span>
  </span>
);
