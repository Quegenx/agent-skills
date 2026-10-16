import { ArrowRight01Icon } from "@hugeicons-pro/core-stroke-rounded";

import {
  faq_page_support_cta,
  faq_page_support_description,
  faq_page_support_image_alt,
  faq_page_support_title,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";

import { SupportContentCard } from "../../shared/layout/content/support-content-card";
import { SupportContentLink } from "../../shared/layout/content/support-content-link";
import { productScreens } from "../../shared/site/product-screens";

/**
 * The FAQ page's support card, linking to the help center.
 *
 * @returns The card.
 */
export const FaqPageSupport = () => (
  <SupportContentCard
    description={faq_page_support_description()}
    imageAlt={faq_page_support_image_alt()}
    imageInset
    link={
      <SupportContentLink
        href={localizeHref("/help")}
        icon={ArrowRight01Icon}
        iconSize={16}
        press
      >
        {faq_page_support_cta()}
      </SupportContentLink>
    }
    screen={productScreens.preferences}
    title={faq_page_support_title()}
  />
);
