import { getToolName } from "ai";

import {
  app_chat_members,
  app_chat_searching_groups,
  app_chat_skill,
  app_join_group,
  app_skill_ad_creation,
  app_skill_competitor_ads,
  app_skill_find_everywhere,
  app_skill_new_user_setup,
  app_skill_opportunity_review,
  app_skill_task_diagnosis,
  app_tool_analyze_ad_creatives,
  app_tool_analyze_landing_pages,
  app_tool_ask_question,
  app_tool_check_competitors,
  app_tool_classify_ads,
  app_tool_create_task,
  app_tool_delete_tasks,
  app_tool_find_similar_ads,
  app_tool_find_tools,
  app_tool_follow_competitors,
  app_tool_forget_memory,
  app_tool_list_ad_folders,
  app_tool_list_competitors,
  app_tool_list_opportunities,
  app_tool_list_saved,
  app_tool_list_scans,
  app_tool_list_tasks,
  app_tool_load_skill,
  app_tool_message_marketplace_seller,
  app_tool_prepare_join,
  app_tool_rank_advertisers,
  app_tool_read_action_pace,
  app_tool_read_ad_eu,
  app_tool_read_app_knowledge,
  app_tool_read_attached_document,
  app_tool_read_competitor_report,
  app_tool_read_facebook_connection,
  app_tool_read_group_join_status,
  app_tool_read_marketplace_listings,
  app_tool_judge_item_photos,
  app_tool_read_real_estate_contact,
  app_tool_read_real_estate_listings,
  app_tool_read_yad2_contact,
  app_tool_read_yad2_items,
  app_tool_remove_saved,
  app_tool_save_ads_to_folder,
  app_tool_save_groups,
  app_tool_save_memory,
  app_tool_scan_now,
  app_tool_search_collected_posts,
  app_tool_read_result_items,
  app_tool_search_facebook_ads,
  app_tool_search_group_posts,
  app_tool_search_jobs,
  app_tool_search_marketplace,
  app_tool_search_real_estate,
  app_tool_search_saved_ads,
  app_tool_search_yad2,
  app_tool_send_facebook_message,
  app_tool_suggest_tasks,
  app_tool_unfollow_competitors,
  app_tool_update_memory,
  app_tool_update_opportunities,
  app_tool_update_plan,
  app_tool_update_settings,
  app_tool_update_task,
} from "#/paraglide/messages";
import type { AppAgentToolName } from "@/agent/core/tool-runtime/app-agent-tools";
import type { AgentSkillName } from "@/agent/skills/registry/agent-skills";
import type {
  AgentChatGroupSearch,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import {
  groupNumber,
  groupPostActivityLabel,
} from "@/lib/groups/rows/group-format";

// How a tool call reads in the chat (agent-chat-answer-part.tsx): its row's
// title, its approval card's text and status, and a group search as the
// search card shows it.

// What each tool's row is called.
// A loaded skill's name in the page's language (the skills ship with ids
// only, src/agent/skills).
const agentSkillTitles = {
  "new-user-setup": app_skill_new_user_setup,
  "find-everywhere": app_skill_find_everywhere,
  "task-diagnosis": app_skill_task_diagnosis,
  "opportunity-review": app_skill_opportunity_review,
  "competitor-ads": app_skill_competitor_ads,
  "ad-creation": app_skill_ad_creation,
} satisfies Record<AgentSkillName, () => string>;

const isAgentSkillName = (name: string): name is AgentSkillName =>
  Object.hasOwn(agentSkillTitles, name);

const agentSkillTitle = (name: string) =>
  isAgentSkillName(name) ? agentSkillTitles[name]() : name;

// Every tool's title in the chat, in the page's language; a new tool fails
// the type check until it has one, so no raw tool name ever shows.
const agentChatToolTitles = {
  listTrackingTasks: app_tool_list_tasks,
  createTrackingTask: app_tool_create_task,
  updateTrackingTask: app_tool_update_task,
  setTrackingTaskSiteSearches: app_tool_update_task,
  deleteTrackingTasks: app_tool_delete_tasks,
  listTaskOpportunities: app_tool_list_opportunities,
  changeTaskOpportunityStatus: app_tool_update_opportunities,
  listSavedGroups: app_tool_list_saved,
  saveFacebookGroups: app_tool_save_groups,
  removeSavedGroups: app_tool_remove_saved,
  prepareFacebookGroupJoin: app_tool_prepare_join,
  joinFacebookGroup: app_join_group,
  scanTrackingTaskNow: app_tool_scan_now,
  listRecentScans: app_tool_list_scans,
  updateUserSettings: app_tool_update_settings,
  updateFacebookActionPace: app_tool_update_settings,
  searchSavedAds: app_tool_search_saved_ads,
  searchFacebookAds: app_tool_search_facebook_ads,
  findSimilarAds: app_tool_find_similar_ads,
  saveAdsToFolder: app_tool_save_ads_to_folder,
  rankAdvertisers: app_tool_rank_advertisers,
  readAdEuTransparency: app_tool_read_ad_eu,
  classifyAds: app_tool_classify_ads,
  analyzeAdCreatives: app_tool_analyze_ad_creatives,
  analyzeLandingPages: app_tool_analyze_landing_pages,
  readCompetitorReport: app_tool_read_competitor_report,
  listCompetitors: app_tool_list_competitors,
  followCompetitors: app_tool_follow_competitors,
  unfollowCompetitors: app_tool_unfollow_competitors,
  checkCompetitors: app_tool_check_competitors,
  readAttachedDocument: app_tool_read_attached_document,
  readToolResultItems: app_tool_read_result_items,
  readAppKnowledge: app_tool_read_app_knowledge,
  readFacebookConnection: app_tool_read_facebook_connection,
  readGroupJoinStatus: app_tool_read_group_join_status,
  searchGroupPosts: app_tool_search_group_posts,
  searchCollectedGroupPosts: app_tool_search_collected_posts,
  searchFacebookMarketplace: app_tool_search_marketplace,
  readMarketplaceListings: app_tool_read_marketplace_listings,
  judgeItemPhotos: app_tool_judge_item_photos,
  messageMarketplaceSeller: app_tool_message_marketplace_seller,
  sendFacebookMessage: app_tool_send_facebook_message,
  searchJobs: app_tool_search_jobs,
  searchRealEstate: app_tool_search_real_estate,
  readRealEstateListings: app_tool_read_real_estate_listings,
  readRealEstateContact: app_tool_read_real_estate_contact,
  searchYad2: app_tool_search_yad2,
  readYad2Items: app_tool_read_yad2_items,
  readYad2Contact: app_tool_read_yad2_contact,
  listAdFolders: app_tool_list_ad_folders,
  loadAgentSkill: app_tool_load_skill,
  saveAgentMemory: app_tool_save_memory,
  updateAgentMemory: app_tool_update_memory,
  forgetAgentMemories: app_tool_forget_memory,
  readFacebookActionPace: app_tool_read_action_pace,
  askUserQuestion: app_tool_ask_question,
  suggestTrackingTasks: app_tool_suggest_tasks,
  updatePlan: app_tool_update_plan,
  searchFacebookGroups: app_chat_searching_groups,
  toolSearch: app_tool_find_tools,
} satisfies Record<AppAgentToolName, () => string>;

const isAgentChatToolWithTitle = (
  name: string
): name is keyof typeof agentChatToolTitles =>
  Object.hasOwn(agentChatToolTitles, name);

/**
 * A tool call's title in the chat: a loaded playbook names itself, such as
 * "מדריך: הגדרה ראשונה"; any other tool its row's title, or its name.
 *
 * @param part - The tool call's part.
 * @returns The title.
 */
export const agentChatToolTitle = (part: AgentChatToolPart) => {
  if (
    part.type === "tool-loadAgentSkill" &&
    part.state === "output-available"
  ) {
    return app_chat_skill({ title: agentSkillTitle(part.output.name) });
  }

  const toolName = getToolName(part);

  return isAgentChatToolWithTitle(toolName)
    ? agentChatToolTitles[toolName]()
    : toolName;
};

/**
 * A group search as the search card shows it: each search word, done once
 * the results are in, with the groups it found.
 *
 * @param part - The group search's tool call.
 * @returns The search, query by query.
 */
export const agentChatGroupSearch = (
  part: Extract<AgentChatToolPart, { type: "tool-searchFacebookGroups" }>
): AgentChatGroupSearch => {
  const found = part.state === "output-available" ? part.output.searches : [];

  return {
    state: part.state,
    searches: (part.input?.keywords ?? []).map((keyword) => {
      const search = found.find((item) => item.keyword === keyword);

      return {
        query: keyword ?? "",
        done: search !== undefined,
        results: (search?.groups ?? []).map((group) => ({
          id: group.id,
          url: group.url,
          name: group.name,
          // Searches stored before the card showed photos have none.
          photoUrl: group.photoUrl ?? null,
          privacy: group.privacy,
          members:
            group.members === null
              ? null
              : app_chat_members({ count: groupNumber(group.members) }),
          // Searches stored before the card showed activity have none.
          activity: group.postsActivity
            ? groupPostActivityLabel(group.postsActivity)
            : null,
        })),
      };
    }),
  };
};
