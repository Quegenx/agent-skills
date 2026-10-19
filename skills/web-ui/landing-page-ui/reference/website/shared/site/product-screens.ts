// Screens of the app, captured from the real app with demo data
// (public/images/product, framed for the site). Two demo accounts: a
// real-estate broker (business pages) and someone renting an apartment
// (personal-*). Every page shows the same files, so a screen's size is
// defined once here.

/**
 * A screenshot of the app the website shows: its file and size.
 */
export interface ProductScreen {
  height: number;
  src: string;
  width: number;
}

const productScreen = (name: string): ProductScreen => ({
  height: 1040,
  src: `/images/product/${name}.webp`,
  width: 1600,
});

export const productScreens = {
  agentChat: productScreen("agent-chat"),
  agentJoinApproval: productScreen("agent-join-approval"),
  adLibrary: productScreen("ad-library"),
  adLibraryFilters: productScreen("ad-library-filters"),
  dashboard: productScreen("dashboard"),
  facebookAccounts: productScreen("facebook-accounts"),
  groupSearch: productScreen("group-search"),
  memory: productScreen("memory"),
  notifications: productScreen("notifications"),
  opportunities: productScreen("opportunities"),
  personalAgentChat: productScreen("personal-agent-chat"),
  personalOpportunities: productScreen("personal-opportunities"),
  personalTasks: productScreen("personal-tasks"),
  posts: productScreen("posts"),
  preferences: productScreen("preferences"),
  tasks: productScreen("tasks"),
} as const satisfies Record<string, ProductScreen>;
