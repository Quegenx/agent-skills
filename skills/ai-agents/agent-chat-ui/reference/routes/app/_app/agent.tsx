import { createFileRoute } from "@tanstack/react-router";

import { app_nav_agent, app_page_title } from "#/paraglide/messages";
import { AgentChatPage } from "@/components/agent-chat/page/agent-chat-page";
import { AgentChatTitle } from "@/components/agent-chat/page/agent-chat-title";
import { AgentTasksPanelTrigger } from "@/components/agent-chat/page/agent-tasks-panel";
import { storedAgentChatConversationsAtom } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import { warmServerReads } from "@/lib/atoms/server-read-atom";
import { userSettingsAtom } from "@/lib/settings/user-settings/user-settings-atoms";
import { trackingTasksAtom } from "@/lib/tasks/tracking-task-atoms";

const AgentChat = () => {
  const { user } = Route.useRouteContext();

  return <AgentChatPage userId={user.id} userName={user.name ?? null} />;
};

export const Route = createFileRoute("/app/_app/agent")({
  staticData: {
    pageTitle: app_nav_agent,
    // The header holds the chat's editable title and the tasks button.
    PageTitle: AgentChatTitle,
    PageActions: AgentTasksPanelTrigger,
  },
  // The stored chats, the settings and the tasks (the tasks panel) start
  // reading with the page (on the server for a first load, on link hover
  // after that), so the newest chat opens without first showing an empty
  // one and the panel opens with its tasks.
  loader: async ({ context }) => {
    await warmServerReads(context.atomRegistry, [
      storedAgentChatConversationsAtom(context.user.id),
      userSettingsAtom(context.user.id),
      trackingTasksAtom(context.user.id),
    ]);
  },
  head: () => ({
    meta: [{ title: app_page_title({ page: app_nav_agent() }) }],
  }),
  component: AgentChat,
});
