import type { ClassValue } from "cn";
import {
  domAnimation,
  LazyMotion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { div as MotionDiv, p as MotionP } from "motion/react-m";
import type { ReactNode, RefObject } from "react";
import { useRef } from "react";

import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { layouts } from "../../../shared/styles/layouts";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { homeProductSectionStyles as productStyles } from "./home-product-section.styles";

interface HomeProductMotionProps {
  children: ReactNode;
  isVisible?: boolean;
  prefersReducedMotion: boolean | null;
  className: ClassValue;
}

/**
 * Reveals a home product badge when its product section enters view.
 *
 * @returns The badge, fading up into view.
 */
const HomeProductBadgeMotion = ({
  children,
  isVisible = true,
  prefersReducedMotion,
  className,
}: HomeProductMotionProps) => (
  <MotionDiv
    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
    initial={{ opacity: 0, y: 8 }}
    transition={
      prefersReducedMotion === true
        ? { duration: 0 }
        : { delay: 0.5, duration: 0.35 }
    }
    className={cn(typography.marketingCardTitle, className)}
  >
    {children}
  </MotionDiv>
);

/**
 * Reveals home product descriptive copy after its heading.
 *
 * @returns The description, fading up into view.
 */
const HomeProductDescriptionMotion = ({
  children,
  isVisible = true,
  prefersReducedMotion,
  className,
}: HomeProductMotionProps) => (
  <MotionP
    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
    initial={{ opacity: 0, y: 16 }}
    transition={
      prefersReducedMotion === true
        ? { duration: 0 }
        : { delay: 1, duration: 0.35 }
    }
    className={cn(typography.marketingCardTitle, className)}
  >
    {children}
  </MotionP>
);

/**
 * Reveals home product actions after the title and description sequence.
 *
 * @returns The actions, fading up into view.
 */
const HomeProductActionsMotion = ({
  children,
  prefersReducedMotion,
  className,
}: Omit<HomeProductMotionProps, "isVisible">) => (
  <MotionDiv
    animate={{ opacity: 1, y: 0 }}
    initial={{ opacity: 0, y: 8 }}
    transition={
      prefersReducedMotion === true
        ? { duration: 0 }
        : { delay: 1.25, duration: 0.2 }
    }
    className={cn(className)}
  >
    {children}
  </MotionDiv>
);

interface HomeProductSectionLayoutProps {
  children: ReactNode;
  sectionRef?: RefObject<HTMLElement | null>;
  sectionClassName: ClassValue;
}

/**
 * Provides the shared semantic and responsive shell for a home product section.
 *
 * @returns The section.
 */
const HomeProductSectionLayout = ({
  children,
  sectionRef,
  sectionClassName,
}: HomeProductSectionLayoutProps) => (
  <section
    data-alternate-styling="false"
    data-full-width="false"
    ref={sectionRef}
    className={cn(productStyles.section, sectionClassName)}
  >
    <div className={layouts.contentNarrow}>
      <div className={productStyles.content}>{children}</div>
    </div>
  </section>
);

/**
 * The App logo in a home product badge, beside the product's name.
 *
 * @returns The logo image.
 */
export const HomeProductLogo = ({ className }: { className: ClassValue }) => (
  <img
    alt=""
    aria-hidden="true"
    height="28"
    src="/brand/app-logo.webp"
    width="28"
    className={cn(className)}
  />
);

interface HomeProductShowcaseProps {
  actions: ReactNode;
  actionsClassName: ClassValue;
  backdrop?: ReactNode;
  badge: ReactNode;
  badgeClassName: ClassValue;
  cardClassName: ClassValue;
  children: ReactNode;
  description: string;
  descriptionClassName: ClassValue;
  id: string;
  product: string;
  sectionClassName: ClassValue;
  theme?: "dark" | "light";
  title: ReactNode;
  titleClassName: ClassValue;
}

/**
 * One product's section of the home page (business, personal, the
 * platform): its badge, title, description and actions, revealed in that
 * order once the section enters view, then the section's own content.
 *
 * @returns The section.
 */
export const HomeProductShowcase = ({
  actions,
  actionsClassName,
  backdrop,
  badge,
  badgeClassName,
  cardClassName,
  children,
  description,
  descriptionClassName,
  id,
  product,
  sectionClassName,
  theme,
  title,
  titleClassName,
}: HomeProductShowcaseProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useInView(sectionRef, { once: true });
  const prefersReducedMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        data-product={product}
        data-theme={theme}
        data-theme-dark={theme === "dark" ? "true" : undefined}
        id={id}
        className={cn(
          theme === "dark" && "site-dark-theme",
          productStyles.container
        )}
      >
        <div className={cn(productStyles.card, cardClassName)}>
          {backdrop}
          <HomeProductSectionLayout
            sectionRef={sectionRef}
            sectionClassName={sectionClassName}
          >
            <ScrollReveal>
              <HomeProductBadgeMotion
                isVisible={isVisible}
                prefersReducedMotion={prefersReducedMotion}
                className={badgeClassName}
              >
                {badge}
              </HomeProductBadgeMotion>
            </ScrollReveal>
            <div className={productStyles.headingGroup}>
              <ScrollReveal>
                <h2 className={cn(titleClassName)}>{title}</h2>
              </ScrollReveal>
              <ScrollReveal>
                <HomeProductDescriptionMotion
                  isVisible={isVisible}
                  prefersReducedMotion={prefersReducedMotion}
                  className={descriptionClassName}
                >
                  {description}
                </HomeProductDescriptionMotion>
              </ScrollReveal>
            </div>
            <ScrollReveal>
              <HomeProductActionsMotion
                prefersReducedMotion={prefersReducedMotion}
                className={actionsClassName}
              >
                {actions}
              </HomeProductActionsMotion>
            </ScrollReveal>
            {children}
          </HomeProductSectionLayout>
        </div>
      </div>
    </LazyMotion>
  );
};
