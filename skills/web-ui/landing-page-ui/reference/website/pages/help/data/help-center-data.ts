import {
  AiChat02Icon,
  Megaphone01Icon,
  Radar01Icon,
  SecurityCheckIcon,
  Target02Icon,
  UserAccountIcon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons-pro/core-stroke-rounded";

import {
  help_topic_account_description,
  help_topic_account_meta_description,
  help_topic_account_title,
  help_topic_ai_agent_description,
  help_topic_ai_agent_meta_description,
  help_topic_ai_agent_title,
  help_topic_competitors_description,
  help_topic_competitors_meta_description,
  help_topic_competitors_title,
  help_topic_data_privacy_description,
  help_topic_data_privacy_meta_description,
  help_topic_data_privacy_title,
  help_topic_facebook_accounts_description,
  help_topic_facebook_accounts_meta_description,
  help_topic_facebook_accounts_title,
  help_topic_groups_description,
  help_topic_groups_meta_description,
  help_topic_groups_title,
  help_topic_opportunities_description,
  help_topic_opportunities_meta_description,
  help_topic_opportunities_title,
  help_topic_tasks_description,
  help_topic_tasks_meta_description,
  help_topic_tasks_title,
} from "#/paraglide/messages";

import type { HelpTopic } from "./help-center-model";
import { getHelpQuestionGroups } from "./help-question-data";

/**
 * The help center's topics, each with its questions, in the page's language.
 *
 * @returns The topics.
 */
export const getHelpTopics = (): HelpTopic[] => {
  const questions = getHelpQuestionGroups();

  return [
    {
      description: help_topic_account_description(),
      href: "/help/account",
      icon: UserAccountIcon,
      metaDescription: help_topic_account_meta_description(),
      questions: questions.account,
      slug: "account",
      title: help_topic_account_title(),
    },
    {
      description: help_topic_facebook_accounts_description(),
      href: "/help/facebook-accounts",
      icon: UserMultiple02Icon,
      metaDescription: help_topic_facebook_accounts_meta_description(),
      questions: questions.facebookAccounts,
      slug: "facebook-accounts",
      title: help_topic_facebook_accounts_title(),
    },
    {
      description: help_topic_ai_agent_description(),
      href: "/help/ai-agent",
      icon: AiChat02Icon,
      metaDescription: help_topic_ai_agent_meta_description(),
      questions: questions.aiAgent,
      slug: "ai-agent",
      title: help_topic_ai_agent_title(),
    },
    {
      description: help_topic_tasks_description(),
      href: "/help/tasks",
      icon: Radar01Icon,
      metaDescription: help_topic_tasks_meta_description(),
      questions: questions.tasks,
      slug: "tasks",
      title: help_topic_tasks_title(),
    },
    {
      description: help_topic_opportunities_description(),
      href: "/help/opportunities",
      icon: Target02Icon,
      metaDescription: help_topic_opportunities_meta_description(),
      questions: questions.opportunities,
      slug: "opportunities",
      title: help_topic_opportunities_title(),
    },
    {
      description: help_topic_groups_description(),
      href: "/help/groups",
      icon: UserGroupIcon,
      metaDescription: help_topic_groups_meta_description(),
      questions: questions.groups,
      slug: "groups",
      title: help_topic_groups_title(),
    },
    {
      description: help_topic_competitors_description(),
      href: "/help/competitors",
      icon: Megaphone01Icon,
      metaDescription: help_topic_competitors_meta_description(),
      questions: questions.competitors,
      slug: "competitors",
      title: help_topic_competitors_title(),
    },
    {
      description: help_topic_data_privacy_description(),
      href: "/help/data-privacy",
      icon: SecurityCheckIcon,
      metaDescription: help_topic_data_privacy_meta_description(),
      questions: questions.dataPrivacy,
      slug: "data-privacy",
      title: help_topic_data_privacy_title(),
    },
  ];
};

/**
 * One help topic by its slug.
 *
 * @param slug - The topic's slug.
 * @returns The topic, or undefined when there is none.
 */
export const getHelpTopic = (slug: string): HelpTopic | undefined =>
  getHelpTopics().find((topic) => topic.slug === slug);
