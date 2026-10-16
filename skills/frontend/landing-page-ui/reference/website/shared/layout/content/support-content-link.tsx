import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClassValue } from "cn";
import type { ReactNode } from "react";
import { useState } from "react";

import { localizeHref } from "#/paraglide/runtime";

import { buttonPress } from "../../styles/button-press";
import { cn } from "../../styles/site-class-merge";
import { supportContentStyles } from "./support-content.styles";

interface SupportContentLinkProps {
  arrowMotion?: "external" | "forward";
  children: ReactNode;
  circleActiveClassName?: ClassValue;
  circleClassName?: ClassValue;
  href: string;
  icon: IconSvgElement;
  iconSize: number;
  iconClassName?: ClassValue;
  press?: boolean;
  className?: ClassValue;
}

/**
 * A support card's link: its text and a circled arrow that moves on hover.
 *
 * @param props - href; children: the link's text; arrowMotion: forward or
 *   external; icon and the circle's styles.
 * @returns The link.
 */
export const SupportContentLink = ({
  arrowMotion = "forward",
  children,
  circleActiveClassName,
  circleClassName,
  href,
  icon,
  iconSize,
  iconClassName,
  press = false,
  className,
}: SupportContentLinkProps) => {
  const [hovered, setHovered] = useState(false);

  const _handleOnPointerEnter = () => {
    setHovered(true);
  };

  const _handleOnPointerLeave = () => {
    setHovered(false);
  };

  return (
    <a
      href={href.startsWith("/") ? localizeHref(href) : href}
      onPointerEnter={_handleOnPointerEnter}
      onPointerLeave={_handleOnPointerLeave}
      {...(press ? buttonPress : undefined)}
      className={cn(className, supportContentStyles.link)}
    >
      <span>{children}</span>
      <span
        className={cn(
          supportContentStyles.iconCircle,
          circleClassName,
          hovered &&
            (circleClassName === undefined
              ? supportContentStyles.iconCircleActive
              : circleActiveClassName)
        )}
      >
        <HugeiconsIcon
          icon={icon}
          size={iconSize}
          strokeWidth={1.5}
          className={cn(
            iconClassName,
            supportContentStyles.directionalIcon,
            hovered &&
              (arrowMotion === "external"
                ? supportContentStyles.directionalIconExternalActive
                : supportContentStyles.directionalIconActive)
          )}
        />
      </span>
    </a>
  );
};
