import {
  platform_connection_description,
  platform_connection_title,
  platform_description,
  platform_learn_more,
  platform_title,
  platform_title_muted,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import {
  ScrollReveal,
  ScrollRevealSeparator,
} from "../../../shared/motion/scroll-reveal";
import { ProductScreenImage } from "../../../shared/site/product-screen-image";
import { productScreens } from "../../../shared/site/product-screens";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { AppLockup } from "../../../shared/ui/brand/app-lockup";
import { ButtonLink } from "../../../shared/ui/button/button";
import { HomeProductShowcase } from "../motion/home-product-motion";
import { homeProductSectionStyles as productStyles } from "../motion/home-product-section.styles";
import { HomePlatformMetrics } from "./home-platform-metrics";
import { homePlatformStyles as styles } from "./home-platform.styles";

/**
 * The home page's platform section: App as one connected product, with
 * its metrics and a link to the about page.
 *
 * @returns The section.
 */
export const HomePlatform = () => (
  <HomeProductShowcase
    actions={
      <ButtonLink
        href={localizeHref("/about")}
        size="large"
        className={productStyles.compactButton}
        tone="softAccent"
      >
        {platform_learn_more()}
      </ButtonLink>
    }
    actionsClassName={styles.buttons}
    backdrop={<div aria-hidden="true" className={styles.wash} />}
    badge={<AppLockup />}
    badgeClassName={productStyles.product}
    cardClassName={styles.card}
    description={platform_description()}
    descriptionClassName={[productStyles.description, styles.description]}
    id="platform"
    product="App"
    sectionClassName={styles.section}
    theme="light"
    title={
      <AnimatedSectionHeadingText
        mutedText={platform_title_muted()}
        text={platform_title()}
      />
    }
    titleClassName={[
      typography.marketingPageHeading,
      productStyles.title,
      styles.title,
    ]}
  >
    <div className={styles.lowerContent}>
      <HomePlatformMetrics />
      <ScrollRevealSeparator
        data-full-width="false"
        data-variant="tertiary"
        className={styles.divider}
      />
      <div className={styles.connection}>
        <ScrollReveal>
          <h2
            className={cn(
              typography.marketingContentTitle,
              styles.connectionTitle
            )}
          >
            {platform_connection_title()}
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p
            className={cn(
              typography.marketingBodyCompact,
              styles.connectionDescription
            )}
          >
            {platform_connection_description()}
          </p>
        </ScrollReveal>
      </div>
      <ScrollReveal>
        <div className={styles.connectionVisual}>
          <ProductScreenImage
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            screen={productScreens.dashboard}
            styles={[styles.connectionImage]}
          />
        </div>
      </ScrollReveal>
    </div>
  </HomeProductShowcase>
);
