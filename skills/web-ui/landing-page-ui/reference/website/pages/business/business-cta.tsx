import {
  business_cta_description,
  business_cta_title,
  business_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The business page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const BusinessCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.opportunities}
    mutedTitle={business_cta_title_muted()}
    subtitle={business_cta_description()}
    title={business_cta_title()}
  />
);
