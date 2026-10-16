import { useInView, useReducedMotion } from "motion/react";
import { div as MotionDiv } from "motion/react-m";
import { useRef } from "react";

import { MarketingAppActions } from "../../shared/layout/page/marketing-app-actions";
import { MarketingContentSection } from "../../shared/layout/page/marketing-content-section";
import { marketingContentSectionStyles } from "../../shared/layout/page/marketing-content-section.styles";
import { AnimatedSectionHeadingText } from "../../shared/motion/animated-section-heading-text";
import { ScrollReveal } from "../../shared/motion/scroll-reveal";
import { ProductScreenImage } from "../../shared/site/product-screen-image";
import type { ProductScreen } from "../../shared/site/product-screens";
import { cn } from "../../shared/styles/site-class-merge";
import { typography } from "../../shared/styles/typography";
import { appStartCtaStyles as styles } from "./app-start-cta.styles";

interface AppStartCtaProps {
  compactArtwork?: boolean;
  imageAlt?: string;
  screen: ProductScreen;
  mutedTitle: string;
  subtitle: string;
  title: string;
}

/**
 * The closing panel of a page: a heading, a line on what happens next, the
 * app's sign-up and log-in buttons, and a screen of the app beside them.
 *
 * @returns The call to action.
 */
export const AppStartCta = ({
  compactArtwork = false,
  imageAlt = "",
  screen,
  mutedTitle,
  subtitle,
  title,
}: AppStartCtaProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { margin: "-80px", once: true });
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <MarketingContentSection>
      <ScrollReveal>
        <MotionDiv
          animate={inView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          ref={panelRef}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className={styles.panel}
        >
          <div className={styles.intro}>
            <div className={styles.introTop}>
              <img
                alt=""
                aria-hidden="true"
                height="56"
                src="/brand/app-logo.webp"
                width="56"
                className={styles.appIcon}
              />
              <h2
                className={cn(
                  typography.marketingPageHeading,
                  styles.heading,
                  marketingContentSectionStyles.responsiveHeading
                )}
              >
                <AnimatedSectionHeadingText
                  mutedText={mutedTitle}
                  text={title}
                />
              </h2>
              <p
                className={cn(
                  typography.marketingContentTitle,
                  styles.subtitle
                )}
              >
                {subtitle}
              </p>
            </div>
            <div className={styles.action}>
              <MarketingAppActions className={styles.buttonMobile} />
            </div>
          </div>
          <div
            aria-hidden={imageAlt ? undefined : "true"}
            className={cn(
              styles.illustrationWrap,
              compactArtwork && styles.illustrationWrapCompact
            )}
          >
            <ProductScreenImage
              alt={imageAlt}
              loading="lazy"
              screen={screen}
              styles={[styles.illustration]}
            />
          </div>
        </MotionDiv>
      </ScrollReveal>
    </MarketingContentSection>
  );
};
