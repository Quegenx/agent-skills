import {
  about_hero_caption,
  about_hero_eyebrow,
  about_hero_highlight,
  about_hero_line_one,
  about_hero_line_two,
} from "#/paraglide/messages";

import { MarketingHeroBrandEyebrow } from "../../../shared/layout/hero/marketing-hero-brand-eyebrow";
import { MarketingHeroContent } from "../../../shared/layout/hero/marketing-hero-content";
import {
  MarketingProductHeroMedia,
  MarketingProductScreenImage,
} from "../../../shared/layout/hero/marketing-product-hero-media";
import { marketingProductHeroStyles } from "../../../shared/layout/hero/marketing-product-hero.styles";
import { MarketingAppActions } from "../../../shared/layout/page/marketing-app-actions";
import { MarketingSection } from "../../../shared/layout/page/marketing-section";
import { productScreens } from "../../../shared/site/product-screens";

/**
 * The about page's hero, with the app's sign-up and log-in actions.
 *
 * @returns The hero.
 */
export const AboutHero = () => (
  <MarketingSection
    innerClassName={marketingProductHeroStyles.inner}
    sectionClassName={marketingProductHeroStyles.section}
  >
    <MarketingHeroContent
      actions={
        <MarketingAppActions className={marketingProductHeroStyles.ctaWidth} />
      }
      description={about_hero_caption()}
      eyebrow={<MarketingHeroBrandEyebrow label={about_hero_eyebrow()} />}
      media={
        <MarketingProductHeroMedia>
          <MarketingProductScreenImage screen={productScreens.agentChat} />
        </MarketingProductHeroMedia>
      }
      titleAccent={`${about_hero_line_two()} ${about_hero_highlight()}`}
      titleLead={about_hero_line_one()}
      titleClassName={marketingProductHeroStyles.title}
    />
  </MarketingSection>
);
