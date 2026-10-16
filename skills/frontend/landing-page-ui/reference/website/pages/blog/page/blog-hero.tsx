import {
  blog_description,
  blog_hero_eyebrow,
  blog_hero_image_alt,
  blog_hero_title_accent,
  blog_hero_title_lead,
} from "#/paraglide/messages";

import { MarketingProductHero } from "../../../shared/layout/hero/marketing-product-hero";
import { productScreens } from "../../../shared/site/product-screens";

/**
 * The blog's hero, with the posts screen.
 *
 * @returns The hero.
 */
export const BlogHero = () => (
  <MarketingProductHero
    description={blog_description()}
    eyebrow={blog_hero_eyebrow()}
    screen={productScreens.posts}
    screenAlt={blog_hero_image_alt()}
    titleAccent={blog_hero_title_accent()}
    titleLead={blog_hero_title_lead()}
  />
);
