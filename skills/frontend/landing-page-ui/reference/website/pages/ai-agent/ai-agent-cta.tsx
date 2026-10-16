import {
  ai_agent_cta_description,
  ai_agent_cta_title,
  ai_agent_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The AI agent page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const AiAgentCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.opportunities}
    mutedTitle={ai_agent_cta_title_muted()}
    subtitle={ai_agent_cta_description()}
    title={ai_agent_cta_title()}
  />
);
