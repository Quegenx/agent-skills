import {
  monitoring_cta_description,
  monitoring_cta_title,
  monitoring_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The monitoring page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const MonitoringCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.tasks}
    mutedTitle={monitoring_cta_title_muted()}
    subtitle={monitoring_cta_description()}
    title={monitoring_cta_title()}
  />
);
