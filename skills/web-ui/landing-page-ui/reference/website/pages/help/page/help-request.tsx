import { ArrowUpRight01Icon } from "@hugeicons-pro/core-stroke-rounded";

import {
  help_request_cta,
  help_request_description,
  help_request_image_alt,
  help_request_title,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { SupportContentCard } from "../../../shared/layout/content/support-content-card";
import { SupportContentLink } from "../../../shared/layout/content/support-content-link";
import { productScreens } from "../../../shared/site/product-screens";
import { typography } from "../../../shared/styles/typography";

/**
 * The help page's card for asking a person, linking to the contact page.
 *
 * @returns The card.
 */
export const HelpRequest = () => (
  <SupportContentCard
    description={help_request_description()}
    imageAlt={help_request_image_alt()}
    link={
      <SupportContentLink
        arrowMotion="external"
        href={localizeHref("/contact")}
        icon={ArrowUpRight01Icon}
        iconSize={13}
        className={typography.marketingCardLabel}
      >
        {help_request_cta()}
      </SupportContentLink>
    }
    reveal
    screen={productScreens.facebookAccounts}
    title={help_request_title()}
  />
);
