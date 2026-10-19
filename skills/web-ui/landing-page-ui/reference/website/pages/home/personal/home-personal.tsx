import {
  home_personal_description,
  home_personal_illustration_alt,
  home_personal_product,
  home_personal_start_building,
  home_personal_talk_to_sales,
  home_personal_title_highlight,
  home_personal_title_lead,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { AnimatedTitleText } from "../../../shared/motion/animated-title-text";
import { ScrollReveal } from "../../../shared/motion/scroll-reveal";
import { ProductScreenImage } from "../../../shared/site/product-screen-image";
import { productScreens } from "../../../shared/site/product-screens";
import { typography } from "../../../shared/styles/typography";
import { ButtonLink } from "../../../shared/ui/button/button";
import {
  HomeProductLogo,
  HomeProductShowcase,
} from "../motion/home-product-motion";
import { homeProductSectionStyles as productStyles } from "../motion/home-product-section.styles";
import { HomePersonalCarousel } from "./home-personal-carousel";
import { homePersonalStyles } from "./home-personal.styles";

/**
 * The home page's personal section: what people find in Facebook groups, as a
 * carousel, with links to the personal page and the app.
 *
 * @returns The section.
 */
export const HomePersonal = () => (
  <HomeProductShowcase
    actions={
      <>
        <ButtonLink
          href={localizeHref("/personal")}
          size="large"
          className={productStyles.compactButton}
          tone="solidAccent"
        >
          {home_personal_start_building()}
        </ButtonLink>
        <ButtonLink
          href={localizeHref("/monitoring")}
          size="large"
          className={productStyles.compactButton}
          tone="softAccent"
        >
          {home_personal_talk_to_sales()}
        </ButtonLink>
      </>
    }
    actionsClassName={productStyles.buttons}
    badge={
      <>
        <HomeProductLogo className={homePersonalStyles.productIcon} />
        {home_personal_product()}
      </>
    }
    badgeClassName={[productStyles.product, homePersonalStyles.product]}
    cardClassName={homePersonalStyles.card}
    description={home_personal_description()}
    descriptionClassName={[
      productStyles.description,
      homePersonalStyles.description,
    ]}
    id="personal"
    product="App Personal"
    sectionClassName={homePersonalStyles.section}
    title={
      <AnimatedTitleText
        lines={[
          { segments: [{ text: home_personal_title_lead() }] },
          {
            breakBefore: true,
            segments: [
              {
                className: [
                  productStyles.titleHighlight,
                  homePersonalStyles.titleHighlight,
                ],
                text: home_personal_title_highlight(),
              },
            ],
          },
        ]}
      />
    }
    titleClassName={[
      typography.marketingDisplayTitle,
      productStyles.title,
      homePersonalStyles.title,
    ]}
  >
    <div className={homePersonalStyles.stack}>
      <ScrollReveal>
        <div className={homePersonalStyles.illustration}>
          <ProductScreenImage
            alt={home_personal_illustration_alt()}
            loading="lazy"
            screen={productScreens.personalOpportunities}
            styles={[homePersonalStyles.stackGraphic]}
          />
        </div>
      </ScrollReveal>
      <div className={homePersonalStyles.partnerSurface}>
        <HomePersonalCarousel />
      </div>
    </div>
  </HomeProductShowcase>
);
