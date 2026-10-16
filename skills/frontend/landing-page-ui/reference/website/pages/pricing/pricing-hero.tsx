import {
  pricing_hero_description,
  pricing_hero_eyebrow,
  pricing_hero_title_accent,
  pricing_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The pricing page's hero, with the dashboard screen.
 *
 * @returns The hero.
 */
export const PricingHero = () => (
  <MarketingProductHero
    description={pricing_hero_description()}
    eyebrow={pricing_hero_eyebrow()}
    screen={productScreens.dashboard}
    titleAccent={pricing_hero_title_accent()}
    titleLead={pricing_hero_title_lead()}
  />
);
