import {
  business_hero_description,
  business_hero_eyebrow,
  business_hero_title_accent,
  business_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The business page's hero, with the opportunities screen.
 *
 * @returns The hero.
 */
export const BusinessHero = () => (
  <MarketingProductHero
    description={business_hero_description()}
    eyebrow={business_hero_eyebrow()}
    screen={productScreens.opportunities}
    titleAccent={business_hero_title_accent()}
    titleLead={business_hero_title_lead()}
  />
);
