import {
  personal_cta_description,
  personal_cta_title,
  personal_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The personal page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const PersonalCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.personalOpportunities}
    mutedTitle={personal_cta_title_muted()}
    subtitle={personal_cta_description()}
    title={personal_cta_title()}
  />
);
