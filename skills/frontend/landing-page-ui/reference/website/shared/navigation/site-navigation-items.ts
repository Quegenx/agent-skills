import {
  AiChat02Icon,
  Briefcase01Icon,
  Building03Icon,
  CustomerSupportIcon,
  HelpCircleIcon,
  Home01Icon,
  Mail01Icon,
  Megaphone01Icon,
  News01Icon,
  Radar01Icon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import {
  AiChat02Icon as AiChat02StrokeIcon,
  Briefcase01Icon as Briefcase01StrokeIcon,
  Building03Icon as Building03StrokeIcon,
  CustomerSupportIcon as CustomerSupportStrokeIcon,
  HelpCircleIcon as HelpCircleStrokeIcon,
  Home01Icon as Home01StrokeIcon,
  Mail01Icon as Mail01StrokeIcon,
  Megaphone01Icon as Megaphone01StrokeIcon,
  News01Icon as News01StrokeIcon,
  Radar01Icon as Radar01StrokeIcon,
  Tag01Icon as Tag01StrokeIcon,
  UserIcon as UserStrokeIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { IconSvgElement } from "@hugeicons/react";

import {
  header_link_about_description,
  header_link_about_title,
  header_link_ai_agent_description,
  header_link_ai_agent_title,
  header_link_blog_description,
  header_link_blog_title,
  header_link_business_description,
  header_link_business_title,
  header_link_competitors_description,
  header_link_competitors_title,
  header_link_contact_description,
  header_link_contact_title,
  header_link_faq_description,
  header_link_faq_title,
  header_link_help_description,
  header_link_help_title,
  header_link_home_description,
  header_link_home_title,
  header_link_monitoring_description,
  header_link_monitoring_title,
  header_link_personal_description,
  header_link_personal_title,
  header_link_pricing_description,
  header_link_pricing_title,
  header_section_about,
  header_section_features,
  header_section_products,
  header_section_resources,
} from "#/paraglide/messages";
import type { LocalizedString } from "#/paraglide/runtime";

type SiteHeaderCopy = () => LocalizedString;

/**
 * One link in the website's navigation: its title, description, icons and
 * address.
 */
export interface SiteNavigationLinkItem {
  description: SiteHeaderCopy;
  footerIcon: IconSvgElement;
  href: string;
  icon: IconSvgElement;
  title: SiteHeaderCopy;
}

type SiteNavigationSectionId = "about" | "features" | "products" | "resources";

/**
 * One section of the website's navigation, with its links.
 */
export interface SiteNavigationSection {
  id: SiteNavigationSectionId;
  items: readonly SiteNavigationLinkItem[];
  title: SiteHeaderCopy;
}

// The site's pages as the header menu and the footer list them.
export const siteNavigationSections = [
  {
    id: "products",
    items: [
      {
        description: header_link_personal_description,
        footerIcon: UserStrokeIcon,
        href: "/personal",
        icon: UserIcon,
        title: header_link_personal_title,
      },
      {
        description: header_link_business_description,
        footerIcon: Briefcase01StrokeIcon,
        href: "/business",
        icon: Briefcase01Icon,
        title: header_link_business_title,
      },
      {
        description: header_link_pricing_description,
        footerIcon: Tag01StrokeIcon,
        href: "/pricing",
        icon: Tag01Icon,
        title: header_link_pricing_title,
      },
    ],
    title: header_section_products,
  },
  {
    id: "features",
    items: [
      {
        description: header_link_ai_agent_description,
        footerIcon: AiChat02StrokeIcon,
        href: "/ai-agent",
        icon: AiChat02Icon,
        title: header_link_ai_agent_title,
      },
      {
        description: header_link_monitoring_description,
        footerIcon: Radar01StrokeIcon,
        href: "/monitoring",
        icon: Radar01Icon,
        title: header_link_monitoring_title,
      },
      {
        description: header_link_competitors_description,
        footerIcon: Megaphone01StrokeIcon,
        href: "/competitors",
        icon: Megaphone01Icon,
        title: header_link_competitors_title,
      },
    ],
    title: header_section_features,
  },
  {
    id: "resources",
    items: [
      {
        description: header_link_faq_description,
        footerIcon: HelpCircleStrokeIcon,
        href: "/faq",
        icon: HelpCircleIcon,
        title: header_link_faq_title,
      },
      {
        description: header_link_help_description,
        footerIcon: CustomerSupportStrokeIcon,
        href: "/help",
        icon: CustomerSupportIcon,
        title: header_link_help_title,
      },
      {
        description: header_link_blog_description,
        footerIcon: News01StrokeIcon,
        href: "/blog",
        icon: News01Icon,
        title: header_link_blog_title,
      },
    ],
    title: header_section_resources,
  },
  {
    id: "about",
    items: [
      {
        description: header_link_home_description,
        footerIcon: Home01StrokeIcon,
        href: "/",
        icon: Home01Icon,
        title: header_link_home_title,
      },
      {
        description: header_link_about_description,
        footerIcon: Building03StrokeIcon,
        href: "/about",
        icon: Building03Icon,
        title: header_link_about_title,
      },
      {
        description: header_link_contact_description,
        footerIcon: Mail01StrokeIcon,
        href: "/contact",
        icon: Mail01Icon,
        title: header_link_contact_title,
      },
    ],
    title: header_section_about,
  },
] as const satisfies readonly SiteNavigationSection[];
