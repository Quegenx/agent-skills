import type { ClassValue } from "cn";
import type { ReactNode } from "react";

import { cn } from "../../styles/site-class-merge";

interface MarketingSectionProps {
  children: ReactNode;
  containerClassName?: ClassValue;
  id?: string;
  innerClassName: ClassValue;
  sectionAccentClassName?: ClassValue;
  sectionOverrideClassName?: ClassValue;
  sectionClassName: ClassValue;
}

/**
 * Shared outer shell for full-width marketing page sections.
 *
 * @returns The section.
 */
export const MarketingSection = ({
  children,
  containerClassName,
  id,
  innerClassName,
  sectionAccentClassName,
  sectionOverrideClassName,
  sectionClassName,
}: MarketingSectionProps) => (
  <section
    data-alternate-styling="false"
    data-full-width="false"
    id={id}
    className={cn(
      sectionClassName,
      sectionOverrideClassName,
      sectionAccentClassName
    )}
  >
    <div className={cn(innerClassName, containerClassName)}>{children}</div>
  </section>
);
