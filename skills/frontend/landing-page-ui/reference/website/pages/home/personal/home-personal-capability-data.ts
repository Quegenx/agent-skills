import {
  Briefcase01Icon,
  Home09Icon,
  Notification03Icon,
  Sofa01Icon,
  UserGroupIcon,
  Wrench01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import type { IconSvgElement } from "@hugeicons/react";

import {
  home_personal_card_alerts_description,
  home_personal_card_alerts_stat,
  home_personal_card_alerts_title,
  home_personal_card_groups_description,
  home_personal_card_groups_stat,
  home_personal_card_groups_title,
  home_personal_card_home_description,
  home_personal_card_home_stat,
  home_personal_card_home_title,
  home_personal_card_job_description,
  home_personal_card_job_stat,
  home_personal_card_job_title,
  home_personal_card_pro_description,
  home_personal_card_pro_stat,
  home_personal_card_pro_title,
  home_personal_card_secondhand_description,
  home_personal_card_secondhand_stat,
  home_personal_card_secondhand_title,
} from "#/paraglide/messages";
import { localizeHref } from "#/paraglide/runtime";
import type { LocalizedString } from "#/paraglide/runtime";

interface HomePersonalCapability {
  description: LocalizedString;
  href: string;
  icon: IconSvgElement;
  name: LocalizedString;
  stat: LocalizedString;
}

/**
 * What people look for in Facebook groups, each card leading to the page
 * that shows how App finds it.
 *
 * @returns The cards' contents, in the page's language.
 */
export const getHomePersonalCapabilities =
  (): readonly HomePersonalCapability[] => [
    {
      description: home_personal_card_home_description(),
      href: localizeHref("/personal"),
      icon: Home09Icon,
      name: home_personal_card_home_title(),
      stat: home_personal_card_home_stat(),
    },
    {
      description: home_personal_card_job_description(),
      href: localizeHref("/personal"),
      icon: Briefcase01Icon,
      name: home_personal_card_job_title(),
      stat: home_personal_card_job_stat(),
    },
    {
      description: home_personal_card_secondhand_description(),
      href: localizeHref("/personal"),
      icon: Sofa01Icon,
      name: home_personal_card_secondhand_title(),
      stat: home_personal_card_secondhand_stat(),
    },
    {
      description: home_personal_card_pro_description(),
      href: localizeHref("/personal"),
      icon: Wrench01Icon,
      name: home_personal_card_pro_title(),
      stat: home_personal_card_pro_stat(),
    },
    {
      description: home_personal_card_groups_description(),
      href: localizeHref("/ai-agent"),
      icon: UserGroupIcon,
      name: home_personal_card_groups_title(),
      stat: home_personal_card_groups_stat(),
    },
    {
      description: home_personal_card_alerts_description(),
      href: localizeHref("/monitoring"),
      icon: Notification03Icon,
      name: home_personal_card_alerts_title(),
      stat: home_personal_card_alerts_stat(),
    },
  ];
