import type { ClassValue } from "cn";
import type { ReactNode } from "react";

import { AnimatedSectionHeadingText } from "../../motion/animated-section-heading-text";
import { ScrollReveal } from "../../motion/scroll-reveal";
import { cn } from "../../styles/site-class-merge";
import { typography } from "../../styles/typography";

interface MarketingFaqSectionProps {
  children: ReactNode;
  containerClassName: ClassValue;
  heading: string;
  headingClassName: ClassValue;
  id?: string;
  innerClassName: ClassValue;
  mutedHeading: string;
  sectionClassName: ClassValue;
}

/**
 * Shared structure for product-page FAQ sections.
 *
 * @returns The FAQ section.
 */
export const MarketingFaqSection = ({
  children,
  containerClassName,
  heading,
  headingClassName,
  id,
  innerClassName,
  mutedHeading,
  sectionClassName,
}: MarketingFaqSectionProps) => (
  <section
    data-alternate-styling="false"
    data-full-width="false"
    id={id}
    className={cn(sectionClassName)}
  >
    <div className={cn(innerClassName)}>
      <div className={cn(containerClassName)}>
        <ScrollReveal>
          <h2 className={cn(typography.marketingPageHeading, headingClassName)}>
            <AnimatedSectionHeadingText
              mutedText={mutedHeading}
              text={heading}
            />
          </h2>
        </ScrollReveal>
        {children}
      </div>
    </div>
  </section>
);
