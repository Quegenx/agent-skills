import {
  personal_hero_description,
  personal_hero_eyebrow,
  personal_hero_title_accent,
  personal_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The personal page's hero, with the agent's chat for a person.
 *
 * @returns The hero.
 */
export const PersonalHero = () => (
  <MarketingProductHero
    description={personal_hero_description()}
    eyebrow={personal_hero_eyebrow()}
    screen={productScreens.personalAgentChat}
    titleAccent={personal_hero_title_accent()}
    titleLead={personal_hero_title_lead()}
  />
);
