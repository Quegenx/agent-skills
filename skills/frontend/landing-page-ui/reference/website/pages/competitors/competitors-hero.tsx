import {
  competitors_hero_description,
  competitors_hero_eyebrow,
  competitors_hero_title_accent,
  competitors_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The competitors page's hero, with the Ad Library screen.
 *
 * @returns The hero.
 */
export const CompetitorsHero = () => (
  <MarketingProductHero
    description={competitors_hero_description()}
    eyebrow={competitors_hero_eyebrow()}
    screen={productScreens.adLibrary}
    titleAccent={competitors_hero_title_accent()}
    titleLead={competitors_hero_title_lead()}
  />
);
