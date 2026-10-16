import { getToolName, isToolUIPart } from "ai";

import type { AppIconName } from "@/components/ui/general/app-icon";
import {
  agentChatAnswerPartShows,
  agentChatToolHasOwnView,
  agentChatToolIsHidden,
  agentChatToolRunning,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import type {
  AgentChatMessage,
  AgentChatToolPart,
} from "@/lib/agent-chat/conversation/agent-chat-messages";
import {
  isListingSite,
  listingSiteService,
} from "@/lib/sites/listing-site-labels";

import { jobSites } from "../../../../backend/jobs/job-search-contract";
import { realEstateSites } from "../../../../backend/listings/real-estate/real-estate-contract";

const tasksIcon = "agent-tasks";
const joinGroupIcon = "join-group";
const adLibraryIcon = "ad-library";
const targetIcon = "agent-target";
const memoryIcon = "nav-memory";

// What an agent answer's work log (agent-chat-work-log.tsx) reads from the
// answer: what it does now, the actions it finished, the sites it links to,
// and each action's icon.

// Each action's icon in the status line and its row.
const agentChatToolIcons = {
  listTrackingTasks: tasksIcon,
  createTrackingTask: tasksIcon,
  updateTrackingTask: tasksIcon,
  setTrackingTaskSiteSearches: tasksIcon,
  deleteTrackingTasks: tasksIcon,
  scanTrackingTaskNow: tasksIcon,
  listRecentScans: tasksIcon,
  listTaskOpportunities: "opportunities",
  changeTaskOpportunityStatus: "opportunities",
  listSavedGroups: "bookmark",
  saveFacebookGroups: "bookmark",
  removeSavedGroups: "bookmark",
  prepareFacebookGroupJoin: joinGroupIcon,
  joinFacebookGroup: joinGroupIcon,
  readGroupJoinStatus: joinGroupIcon,
  searchGroupPosts: "posts",
  searchCollectedGroupPosts: "posts",
  searchFacebookMarketplace: "search",
  readMarketplaceListings: "eye",
  messageMarketplaceSeller: "platform-messenger",
  sendFacebookMessage: "platform-messenger",
  searchJobs: "search",
  searchRealEstate: "search",
  readRealEstateListings: "eye",
  readRealEstateContact: "profile",
  searchYad2: "search",
  readYad2Items: "eye",
  readYad2Contact: "profile",
  updateUserSettings: "nav-settings",
  updateFacebookActionPace: "nav-settings",
  searchSavedAds: adLibraryIcon,
  searchFacebookAds: adLibraryIcon,
  findSimilarAds: adLibraryIcon,
  saveAdsToFolder: adLibraryIcon,
  listAdFolders: adLibraryIcon,
  classifyAds: adLibraryIcon,
  analyzeAdCreatives: adLibraryIcon,
  readAdEuTransparency: adLibraryIcon,
  rankAdvertisers: adLibraryIcon,
  analyzeLandingPages: "post-public",
  readCompetitorReport: targetIcon,
  listCompetitors: targetIcon,
  followCompetitors: targetIcon,
  unfollowCompetitors: targetIcon,
  checkCompetitors: targetIcon,
  readAttachedDocument: "agent-file",
  readAppKnowledge: "summary-details",
  readFacebookConnection: "nav-facebook-accounts",
  loadAgentSkill: "list-bullet",
  saveAgentMemory: memoryIcon,
  updateAgentMemory: memoryIcon,
  forgetAgentMemories: memoryIcon,
} satisfies Record<string, AppIconName>;

const isAgentChatToolWithIcon = (
  name: string
): name is keyof typeof agentChatToolIcons =>
  Object.hasOwn(agentChatToolIcons, name);

// The outside services an action works through, shown by their favicons on
// its row: Firecrawl reads landing pages, Gemini (AdVisionModel) analyzes
// them and ads' images and videos; the site tools show the sites they read
// (listing-site-labels.ts).
const agentChatToolServices = {
  analyzeLandingPages: [
    { name: "Firecrawl", url: "https://www.firecrawl.dev" },
    { name: "Gemini", url: "https://gemini.google.com" },
  ],
  analyzeAdCreatives: [{ name: "Gemini", url: "https://gemini.google.com" }],
} satisfies Record<string, { name: string; url: string }[]>;

const isAgentChatToolWithServices = (
  name: string
): name is keyof typeof agentChatToolServices =>
  Object.hasOwn(agentChatToolServices, name);

// The sites a site tool call reads: the ones its input names, or every site
// of its kind.
// A streaming input may still hold undefined entries.
const agentChatToolSites = (
  part: AgentChatToolPart
): readonly (string | undefined)[] => {
  if (part.type === "tool-searchJobs") {
    return part.input?.sites ?? jobSites;
  }

  if (part.type === "tool-searchRealEstate") {
    return part.input?.sites ?? realEstateSites;
  }

  if (
    part.type === "tool-readRealEstateListings" ||
    part.type === "tool-readRealEstateContact"
  ) {
    return part.input?.site ? [part.input.site] : [];
  }

  if (
    part.type === "tool-searchYad2" ||
    part.type === "tool-readYad2Items" ||
    part.type === "tool-readYad2Contact"
  ) {
    return ["yad2"];
  }

  return [];
};

/**
 * The services a tool call used (Facebook, a job or listing site), for the
 * chips on its row.
 *
 * @param part - The tool call's part.
 * @returns The services, from the tool's own list or the sites it searched.
 */
export const agentChatToolServiceList = (part: AgentChatToolPart) => {
  const name = getToolName(part);

  if (isAgentChatToolWithServices(name)) {
    return agentChatToolServices[name];
  }

  return agentChatToolSites(part).flatMap((site) =>
    isListingSite(site) ? [listingSiteService(site)] : []
  );
};

/**
 * The icon of a tool call's row; tools without their own get the generic action
 * icon.
 *
 * @param part - The tool call's part.
 * @returns The icon's name.
 */
export const agentChatToolIcon = (
  part: AgentChatToolPart
): AppIconName => {
  const name = getToolName(part);

  return isAgentChatToolWithIcon(name) ? agentChatToolIcons[name] : "agent-zap";
};

/**
 * What the status line shows now: the pulse dot, thinking, or a running
 * action. Null while nothing should show: the answer is writing its text, an
 * action waits on the user's approval, or a card shows its own progress (the
 * group search).
 * A model call that failed before streaming and is tried again shows as
 * reconnecting (retryAgentModelVisibly) until the answer moves on.
 */
export type AgentChatLiveActivity =
  | { kind: "dot" }
  | { kind: "thinking" }
  | { kind: "reconnecting"; attempt: number; of: number }
  | { kind: "tool"; part: AgentChatToolPart };

/**
 * What the chat's status line shows now for the newest message
 * (AgentChatLiveActivity).
 *
 * @param message - The newest message, if any.
 * @returns The pulse dot, thinking, a running action, or null.
 */
export const agentChatLiveActivity = (
  message: AgentChatMessage | undefined
): AgentChatLiveActivity | null => {
  if (
    message?.role !== "assistant" ||
    !message.parts.some(
      (part) => part.type === "reasoning" || agentChatAnswerPartShows(part)
    )
  ) {
    return { kind: "dot" };
  }

  const tools = message.parts.filter(
    (part): part is AgentChatToolPart =>
      isToolUIPart(part) && !agentChatToolIsHidden(part)
  );

  if (tools.some((part) => part.state === "approval-requested")) {
    return null;
  }

  const running = tools.findLast(
    (part) => agentChatToolRunning(part.state) && !agentChatToolHasOwnView(part)
  );

  if (running) {
    return { kind: "tool", part: running };
  }

  const last = message.parts.findLast((part) => {
    const writtenText = part.type === "text" && part.text.trim().length > 0;

    return (
      part.type === "reasoning" ||
      writtenText ||
      (isToolUIPart(part) && !agentChatToolIsHidden(part))
    );
  });

  // Once the answer is writing its text, the text shows the work; the line
  // stays away until the answer ends, even in the moment between the text's
  // end and the answer's (it showed "חושב" there, then gave way to copy).
  // A tool or reasoning after the text brings it back.
  if (last?.type === "text") {
    return null;
  }

  if (
    last &&
    isToolUIPart(last) &&
    agentChatToolHasOwnView(last) &&
    agentChatToolRunning(last.state)
  ) {
    return null;
  }

  return { kind: "thinking" };
};

/**
 * The finished actions an answer folds: every tool call that is not its own
 * card and has an outcome.
 *
 * @param message - The agent's answer.
 * @returns The tool parts the work log folds.
 */
export const agentChatWorkLogParts = (message: AgentChatMessage) =>
  message.parts.filter(
    (part): part is AgentChatToolPart =>
      isToolUIPart(part) &&
      !agentChatToolIsHidden(part) &&
      !agentChatToolHasOwnView(part) &&
      !agentChatToolRunning(part.state)
  );

// The other sites an answer links to (Facebook's own links are its
// content, not sources), once each, in the order they appear.
const agentChatLinkPattern = /https?:\/\/[^\s)<>\]]+/gu;
const agentChatFacebookHosts = ["facebook.com", "fb.com", "fb.me"];

/**
 * The other sites an answer links to, once each, in the order they appear;
 * Facebook's own links are its content, not sources.
 *
 * @param message - The agent's answer.
 * @returns The links' URLs.
 */
export const agentChatAnswerSources = (message: AgentChatMessage) => {
  const urls = message.parts.flatMap((part) =>
    part.type === "text" ? (part.text.match(agentChatLinkPattern) ?? []) : []
  );

  const seen = new Set<string>();

  return urls.filter((url) => {
    if (!URL.canParse(url)) {
      return false;
    }

    const host = new URL(url).hostname.replace(/^www\./u, "");

    if (
      seen.has(host) ||
      agentChatFacebookHosts.some(
        (facebook) => host === facebook || host.endsWith(`.${facebook}`)
      )
    ) {
      return false;
    }

    seen.add(host);

    return true;
  });
};

/**
 * A site's favicon (Google's favicon service), for source chips and the
 * "מקורות" row.
 *
 * @param url - The site's address.
 * @returns The favicon's address, 64 pixels.
 */
export const agentChatFaviconUrl = (url: string) =>
  `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
