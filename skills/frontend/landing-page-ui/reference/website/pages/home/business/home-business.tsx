import {
  business_booking_cta,
  business_capabilities_description,
  business_capabilities_title,
  business_capabilities_title_muted,
  business_description,
  business_get_started,
  business_illustration_alt,
  business_learn_more,
  business_product,
  business_title_highlight,
  business_title_lead,
  business_title_trail,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { AnimatedSectionHeadingText } from "../../../shared/motion/animated-section-heading-text";
import { AnimatedTitleText } from "../../../shared/motion/animated-title-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { ProductScreenImage } from "../../../shared/site/product-screen-image";
import { productScreens } from "../../../shared/site/product-screens";
import { cn } from "../../../shared/styles/site-class-merge";
import { typography } from "../../../shared/styles/typography";
import { ButtonLink } from "../../../shared/ui/button/button";
import {
  HomeProductLogo,
  HomeProductShowcase,
} from "../motion/home-product-motion";
import { homeProductSectionStyles as productStyles } from "../motion/home-product-section.styles";
import { HomeBusinessCapabilityCard } from "./home-business-capability-card";
import { getHomeBusinessCapabilities } from "./home-business-capability-data";
import { homeBusinessStyles } from "./home-business.styles";

const HomeBusinessSectionHeading = () => (
  <div className={homeBusinessStyles.sectionHeadingWrap}>
    <div className={productStyles.sectionHeading}>
      <ScrollReveal>
        <h2
          className={cn(
            typography.marketingPageHeading,
            productStyles.sectionTitle,
            homeBusinessStyles.sectionTitle
          )}
        >
          <AnimatedSectionHeadingText
            mutedText={business_capabilities_title_muted()}
            text={business_capabilities_title()}
          />
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <p
          className={cn(
            typography.marketingBodyCompact,
            productStyles.sectionDescription,
            homeBusinessStyles.sectionDescription
          )}
        >
          {business_capabilities_description()}
        </p>
      </ScrollReveal>
    </div>
  </div>
);

/**
 * The home page's business section: what App does for a business, as
 * cards, with links to the business page and the app.
 *
 * @returns The section.
 */
export const HomeBusiness = () => (
  <HomeProductShowcase
    actions={
      <>
        <ButtonLink
          href={localizeHref("/business")}
          size="large"
          className={productStyles.compactButton}
          tone="solidWhite"
        >
          {business_get_started()}
        </ButtonLink>
        <ButtonLink
          href={localizeHref("/ai-agent")}
          size="large"
          className={[
            homeBusinessStyles.softWhiteButton,
            productStyles.compactButton,
          ]}
        >
          {business_booking_cta()}
        </ButtonLink>
      </>
    }
    actionsClassName={productStyles.buttons}
    badge={
      <>
        <HomeProductLogo className={homeBusinessStyles.productIcon} />
        {business_product()}
      </>
    }
    badgeClassName={[productStyles.product, homeBusinessStyles.product]}
    cardClassName={homeBusinessStyles.card}
    description={business_description()}
    descriptionClassName={[
      productStyles.description,
      homeBusinessStyles.description,
    ]}
    id="business"
    product="App for Business"
    sectionClassName={homeBusinessStyles.section}
    theme="dark"
    title={
      <AnimatedTitleText
        lines={[
          {
            segments: [
              { text: business_title_lead() },
              {
                letterClassName: homeBusinessStyles.titleHighlight,
                className: productStyles.titleHighlight,
                text: ` ${business_title_highlight()}`,
              },
              { text: ` ${business_title_trail()}` },
            ],
          },
        ]}
      />
    }
    titleClassName={[
      typography.marketingDisplayTitle,
      productStyles.title,
      homeBusinessStyles.title,
    ]}
  >
    <ScrollReveal>
      <div className={homeBusinessStyles.illustration}>
        <div className={homeBusinessStyles.illustrationFrame}>
          <ProductScreenImage
            alt={business_illustration_alt()}
            loading="lazy"
            screen={productScreens.opportunities}
            styles={[homeBusinessStyles.illustrationObject]}
          />
        </div>
      </div>
    </ScrollReveal>
    <div
      id="business-capabilities"
      className={cn(productStyles.subsection, homeBusinessStyles.subsection)}
    >
      <HomeBusinessSectionHeading />
      <ScrollReveal>
        <ButtonLink
          href={localizeHref("/monitoring")}
          size="large"
          className={homeBusinessStyles.softWhiteButton}
        >
          {business_learn_more()}
        </ButtonLink>
      </ScrollReveal>
    </div>
    <div className={homeBusinessStyles.cards}>
      {getHomeBusinessCapabilities().map((capability) => (
        <ScrollReveal key={capability.title}>
          <HomeBusinessCapabilityCard capability={capability} />
        </ScrollReveal>
      ))}
    </div>
  </HomeProductShowcase>
);
