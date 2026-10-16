import {
  AiChat02Icon,
  Briefcase01Icon,
  Megaphone01Icon,
  Notification03Icon,
  UserIcon,
  UserShield01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";

import { homePlatformMetricStyles as styles } from "./home-platform-metrics.styles";

/**
 * The name of a home platform metric's icon.
 */
export type HomePlatformMetricIconName =
  | "agent"
  | "alerts"
  | "business"
  | "competitors"
  | "control"
  | "personal";

const iconByName = {
  agent: AiChat02Icon,
  alerts: Notification03Icon,
  business: Briefcase01Icon,
  competitors: Megaphone01Icon,
  control: UserShield01Icon,
  personal: UserIcon,
} satisfies Record<HomePlatformMetricIconName, IconSvgElement>;

/**
 * A home platform metric's icon.
 *
 * @param props - name: the icon's name.
 * @returns The icon.
 */
export const HomePlatformMetricIcon = ({
  name,
}: {
  name: HomePlatformMetricIconName;
}) => (
  <span className={styles.semanticIcon}>
    <HugeiconsIcon aria-hidden="true" icon={iconByName[name]} size={28} />
  </span>
);
