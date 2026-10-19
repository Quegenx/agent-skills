import {
  Layers01Icon,
  Megaphone01Icon,
  Notification03Icon,
  Target02Icon,
  TaskDaily01Icon,
  UserGroupIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { IconSvgElement } from "@hugeicons/react";

import {
  business_card_competitors_description,
  business_card_competitors_label,
  business_card_competitors_title,
  business_card_opportunities_description,
  business_card_opportunities_label,
  business_card_opportunities_title,
  business_card_tasks_description,
  business_card_tasks_label,
  business_card_tasks_title,
  business_tag_ads,
  business_tag_alerts,
  business_tag_fit_score,
  business_tag_groups,
  business_tag_platforms,
  business_tag_tasks,
} from "#/paraglide/messages";

import type { ProductMarket } from "../../../shared/ui/market-card/product-market-data";

const feature = (name: string, icon: IconSvgElement) => ({
  icon,
  name,
});

/**
 * What App does for a business, one card each with its features, in
 * the page's language.
 *
 * @returns The capabilities.
 */
export const getHomeBusinessCapabilities = (): readonly ProductMarket[] => [
  {
    description: business_card_opportunities_description(),
    label: business_card_opportunities_label(),
    title: business_card_opportunities_title(),
    tokens: [
      feature(business_tag_fit_score(), Target02Icon),
      feature(business_tag_alerts(), Notification03Icon),
    ],
  },
  {
    description: business_card_tasks_description(),
    label: business_card_tasks_label(),
    title: business_card_tasks_title(),
    tokens: [
      feature(business_tag_tasks(), TaskDaily01Icon),
      feature(business_tag_groups(), UserGroupIcon),
    ],
  },
  {
    description: business_card_competitors_description(),
    label: business_card_competitors_label(),
    title: business_card_competitors_title(),
    tokens: [
      feature(business_tag_ads(), Megaphone01Icon),
      feature(business_tag_platforms(), Layers01Icon),
    ],
  },
];
