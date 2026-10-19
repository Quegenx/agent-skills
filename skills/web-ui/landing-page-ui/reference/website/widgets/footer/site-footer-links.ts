import {
  AccessibilityIcon,
  Delete02Icon,
  File02Icon,
  MoneyReceiveCircleIcon,
  Shield01Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { IconSvgElement } from "@hugeicons/react";

import {
  footer_link_accessibility,
  footer_link_account_deletion,
  footer_link_cancellation_refund,
  footer_link_privacy,
  footer_link_terms,
  footer_section_legal,
} from "#/paraglide/messages";

import { siteNavigationSections } from "../../shared/navigation/site-navigation-items";

interface SiteFooterLink {
  href: string;
  icon: IconSvgElement;
  label: string;
}

interface SiteFooterGroup {
  links: readonly SiteFooterLink[];
  title: string;
}

/**
 * The footer's link groups: the navigation's sections, then the legal pages, in
 * the page's language.
 *
 * @returns The groups.
 */
export const getSiteFooterGroups = (): readonly SiteFooterGroup[] => [
  ...siteNavigationSections.map((section) => ({
    links: section.items.map((item) => ({
      href: item.href,
      icon: item.footerIcon,
      label: item.title(),
    })),
    title: section.title(),
  })),
  {
    links: [
      {
        href: "/terms-of-service",
        icon: File02Icon,
        label: footer_link_terms(),
      },
      {
        href: "/privacy-policy",
        icon: Shield01Icon,
        label: footer_link_privacy(),
      },
      {
        href: "/cancellation-refund-policy",
        icon: MoneyReceiveCircleIcon,
        label: footer_link_cancellation_refund(),
      },
      {
        href: "/accessibility",
        icon: AccessibilityIcon,
        label: footer_link_accessibility(),
      },
      {
        href: "/account-deletion",
        icon: Delete02Icon,
        label: footer_link_account_deletion(),
      },
    ],
    title: footer_section_legal(),
  },
];
