import { cn } from "cn";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";

import { AppIcon } from "@/components/ui/general/app-icon";
import type { AppIconName } from "@/components/ui/general/app-icon";

const MotionFacebookIcon = m.create(AppIcon);
const iconSwapHidden = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
const iconSwapShown = { opacity: 1, scale: 1, filter: "blur(0px)" };

/**
 * An icon that changes with state (copy → copied, show → hide password):
 * the old one shrinks and blurs out while the new one grows in, a 0.3s
 * spring with no bounce. The first render does not animate, and reduced
 * motion swaps it at once. Both icons share one grid cell while they swap,
 * so nothing moves: popLayout lifted the old one out and placed it by its
 * left offset, which in right-to-left slid the icons sideways and back.
 *
 * @returns The icon.
 */
export const IconSwap = ({
  icon,
  className,
}: {
  icon: AppIconName;
  className?: string;
}) => (
  <span className="inline-grid shrink-0 place-items-center">
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence initial={false}>
          <MotionFacebookIcon
            key={icon}
            icon={icon}
            className={cn("[grid-area:1/1]", className)}
            initial={iconSwapHidden}
            animate={iconSwapShown}
            exit={iconSwapHidden}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          />
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  </span>
);
