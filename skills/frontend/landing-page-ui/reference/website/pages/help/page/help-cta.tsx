import {
  help_cta_subtitle,
  help_cta_title,
  help_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import { AppStartCta } from "../../../widgets/app-start-cta/app-start-cta";

/**
 * The help pages' closing call to start in the app.
 *
 * @returns The call to action.
 */
export const HelpCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.agentChat}
    mutedTitle={help_cta_title_muted()}
    subtitle={help_cta_subtitle()}
    title={help_cta_title()}
  />
);
