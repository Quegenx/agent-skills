import {
  help_answer_ad_library_search,
  help_answer_ad_library_search_what,
  help_answer_ad_library_search_when,
  help_answer_ad_library_search_where,
  help_answer_ad_library_sort,
  help_answer_agent_abilities,
  help_answer_agent_abilities_groups,
  help_answer_agent_abilities_opportunities,
  help_answer_agent_abilities_settings,
  help_answer_agent_abilities_tasks,
  help_answer_agent_approval,
  help_answer_agent_conversations,
  help_answer_agent_memory,
  help_answer_connect_facebook,
  help_answer_create_account,
  help_answer_create_task,
  help_answer_delete_account,
  help_answer_delete_data,
  help_answer_disconnect_facebook,
  help_answer_find_groups,
  help_answer_forgot_password,
  help_answer_join_groups,
  help_answer_opportunity_match,
  help_answer_opportunity_reply,
  help_answer_opportunity_status,
  help_answer_opportunity_status_done,
  help_answer_opportunity_status_open,
  help_answer_primary_account,
  help_answer_profile_language,
  help_answer_profile_type,
  help_answer_scan_frequency,
  help_answer_scan_frequency_fast,
  help_answer_scan_frequency_slow,
  help_answer_scan_now,
  help_answer_search_preferences,
  help_answer_shared_details,
  help_answer_verification_code,
  help_answer_verification_code_app,
  help_answer_verification_code_device,
  help_answer_verification_code_key,
  help_answer_verification_code_sms,
  help_answer_work_pace,
  help_question_ad_library_search,
  help_question_ad_library_sort,
  help_question_agent_abilities,
  help_question_agent_approval,
  help_question_agent_conversations,
  help_question_agent_memory,
  help_question_connect_facebook,
  help_question_create_account,
  help_question_create_task,
  help_question_delete_account,
  help_question_delete_data,
  help_question_disconnect_facebook,
  help_question_find_groups,
  help_question_forgot_password,
  help_question_join_groups,
  help_question_opportunity_match,
  help_question_opportunity_reply,
  help_question_opportunity_status,
  help_question_primary_account,
  help_question_profile_language,
  help_question_profile_type,
  help_question_scan_frequency,
  help_question_scan_now,
  help_question_search_preferences,
  help_question_shared_details,
  help_question_verification_code,
  help_question_work_pace,
} from "#/paraglide/messages";

import { createHelpQuestion } from "./help-center-model";
import type { HelpQuestion } from "./help-center-model";

const facebookAccountsTopic = "facebook-accounts";
const dataPrivacyTopic = "data-privacy";

// A Record, not an interface: Object.values reads a Record's values typed.
type HelpQuestionGroups = Record<
  | "account"
  | "aiAgent"
  | "competitors"
  | "dataPrivacy"
  | "facebookAccounts"
  | "groups"
  | "opportunities"
  | "tasks",
  HelpQuestion[]
>;

/**
 * The help center's questions by topic, in the page's language.
 *
 * @returns The questions, grouped by topic.
 */
export const getHelpQuestionGroups = (): HelpQuestionGroups => ({
  account: [
    createHelpQuestion(
      "account",
      "create-account",
      help_question_create_account(),
      help_answer_create_account()
    ),
    createHelpQuestion(
      "account",
      "forgot-password",
      help_question_forgot_password(),
      help_answer_forgot_password()
    ),
    createHelpQuestion(
      "account",
      "profile-type",
      help_question_profile_type(),
      help_answer_profile_type()
    ),
    createHelpQuestion(
      "account",
      "profile-language",
      help_question_profile_language(),
      help_answer_profile_language()
    ),
  ],
  facebookAccounts: [
    createHelpQuestion(
      facebookAccountsTopic,
      "connect-facebook",
      help_question_connect_facebook(),
      help_answer_connect_facebook()
    ),
    createHelpQuestion(
      facebookAccountsTopic,
      "verification-code",
      help_question_verification_code(),
      help_answer_verification_code(),
      [
        help_answer_verification_code_sms(),
        help_answer_verification_code_app(),
        help_answer_verification_code_device(),
        help_answer_verification_code_key(),
      ]
    ),
    createHelpQuestion(
      facebookAccountsTopic,
      "primary-account",
      help_question_primary_account(),
      help_answer_primary_account()
    ),
    createHelpQuestion(
      facebookAccountsTopic,
      "disconnect-facebook",
      help_question_disconnect_facebook(),
      help_answer_disconnect_facebook()
    ),
  ],
  aiAgent: [
    createHelpQuestion(
      "ai-agent",
      "agent-abilities",
      help_question_agent_abilities(),
      help_answer_agent_abilities(),
      [
        help_answer_agent_abilities_groups(),
        help_answer_agent_abilities_tasks(),
        help_answer_agent_abilities_opportunities(),
        help_answer_agent_abilities_settings(),
      ]
    ),
    createHelpQuestion(
      "ai-agent",
      "agent-approval",
      help_question_agent_approval(),
      help_answer_agent_approval()
    ),
    createHelpQuestion(
      "ai-agent",
      "agent-memory",
      help_question_agent_memory(),
      help_answer_agent_memory()
    ),
    createHelpQuestion(
      "ai-agent",
      "agent-conversations",
      help_question_agent_conversations(),
      help_answer_agent_conversations()
    ),
  ],
  tasks: [
    createHelpQuestion(
      "tasks",
      "create-task",
      help_question_create_task(),
      help_answer_create_task()
    ),
    createHelpQuestion(
      "tasks",
      "scan-frequency",
      help_question_scan_frequency(),
      help_answer_scan_frequency(),
      [help_answer_scan_frequency_fast(), help_answer_scan_frequency_slow()]
    ),
    createHelpQuestion(
      "tasks",
      "scan-now",
      help_question_scan_now(),
      help_answer_scan_now()
    ),
    createHelpQuestion(
      "tasks",
      "search-preferences",
      help_question_search_preferences(),
      help_answer_search_preferences()
    ),
  ],
  opportunities: [
    createHelpQuestion(
      "opportunities",
      "opportunity-match",
      help_question_opportunity_match(),
      help_answer_opportunity_match()
    ),
    createHelpQuestion(
      "opportunities",
      "opportunity-status",
      help_question_opportunity_status(),
      help_answer_opportunity_status(),
      [
        help_answer_opportunity_status_open(),
        help_answer_opportunity_status_done(),
      ]
    ),
    createHelpQuestion(
      "opportunities",
      "opportunity-reply",
      help_question_opportunity_reply(),
      help_answer_opportunity_reply()
    ),
  ],
  groups: [
    createHelpQuestion(
      "groups",
      "find-groups",
      help_question_find_groups(),
      help_answer_find_groups()
    ),
    createHelpQuestion(
      "groups",
      "join-groups",
      help_question_join_groups(),
      help_answer_join_groups()
    ),
    createHelpQuestion(
      "groups",
      "work-pace",
      help_question_work_pace(),
      help_answer_work_pace()
    ),
  ],
  competitors: [
    createHelpQuestion(
      "competitors",
      "ad-library-search",
      help_question_ad_library_search(),
      help_answer_ad_library_search(),
      [
        help_answer_ad_library_search_where(),
        help_answer_ad_library_search_what(),
        help_answer_ad_library_search_when(),
      ]
    ),
    createHelpQuestion(
      "competitors",
      "ad-library-sort",
      help_question_ad_library_sort(),
      help_answer_ad_library_sort()
    ),
  ],
  dataPrivacy: [
    createHelpQuestion(
      dataPrivacyTopic,
      "shared-details",
      help_question_shared_details(),
      help_answer_shared_details()
    ),
    createHelpQuestion(
      dataPrivacyTopic,
      "delete-data",
      help_question_delete_data(),
      help_answer_delete_data()
    ),
    createHelpQuestion(
      dataPrivacyTopic,
      "delete-account",
      help_question_delete_account(),
      help_answer_delete_account()
    ),
  ],
});
