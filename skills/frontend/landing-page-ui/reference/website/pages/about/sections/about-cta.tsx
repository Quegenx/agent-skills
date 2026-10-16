import {
  about_cta_subtitle,
  about_cta_title,
  about_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import { AppStartCta } from "../../../widgets/app-start-cta/app-start-cta";

/**
 * The about page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const AboutCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.agentChat}
    mutedTitle={about_cta_title_muted()}
    subtitle={about_cta_subtitle()}
    title={about_cta_title()}
  />
);
