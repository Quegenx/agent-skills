import {
  pricing_cta_description,
  pricing_cta_title,
  pricing_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The pricing page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const PricingCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.agentChat}
    mutedTitle={pricing_cta_title_muted()}
    subtitle={pricing_cta_description()}
    title={pricing_cta_title()}
  />
);
