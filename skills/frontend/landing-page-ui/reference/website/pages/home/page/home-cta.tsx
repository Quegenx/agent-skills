import {
  home_cta_subtitle,
  home_cta_title,
  home_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import { AppStartCta } from "../../../widgets/app-start-cta/app-start-cta";

/**
 * The home page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const HomeCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.opportunities}
    mutedTitle={home_cta_title_muted()}
    subtitle={home_cta_subtitle()}
    title={home_cta_title()}
  />
);
