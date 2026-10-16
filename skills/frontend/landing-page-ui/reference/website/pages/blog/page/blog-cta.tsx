import {
  blog_cta_subtitle,
  blog_cta_title,
  blog_cta_title_muted,
} from "#/paraglide/messages";

import { productScreens } from "../../../shared/site/product-screens";
import { AppStartCta } from "../../../widgets/app-start-cta/app-start-cta";

/**
 * The blog's closing call to start in the app.
 *
 * @returns The call to action.
 */
export const BlogCta = () => (
  <AppStartCta
    compactArtwork
    screen={productScreens.dashboard}
    mutedTitle={blog_cta_title_muted()}
    subtitle={blog_cta_subtitle()}
    title={blog_cta_title()}
  />
);
