import {
  monitoring_hero_description,
  monitoring_hero_eyebrow,
  monitoring_hero_title_accent,
  monitoring_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The monitoring page's hero, with the opportunities screen.
 *
 * @returns The hero.
 */
export const MonitoringHero = () => (
  <MarketingProductHero
    description={monitoring_hero_description()}
    eyebrow={monitoring_hero_eyebrow()}
    screen={productScreens.opportunities}
    titleAccent={monitoring_hero_title_accent()}
    titleLead={monitoring_hero_title_lead()}
  />
);
