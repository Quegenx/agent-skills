import {
  competitors_cta_description,
  competitors_cta_title,
  competitors_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../shared/site/product-screens";
import { AppStartCta } from "../../widgets/app-start-cta/app-start-cta";

/**
 * The competitors page's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const CompetitorsCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.adLibrary}
    mutedTitle={competitors_cta_title_muted()}
    subtitle={competitors_cta_description()}
    title={competitors_cta_title()}
  />
);
