import {
  ai_agent_hero_description,
  ai_agent_hero_eyebrow,
  ai_agent_hero_title_accent,
  ai_agent_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The AI agent page's hero, with the agent's chat screen.
 *
 * @returns The hero.
 */
export const AiAgentHero = () => (
  <MarketingProductHero
    description={ai_agent_hero_description()}
    eyebrow={ai_agent_hero_eyebrow()}
    screen={productScreens.agentChat}
    titleAccent={ai_agent_hero_title_accent()}
    titleLead={ai_agent_hero_title_lead()}
  />
);
