import { RegistryContext } from "@effect/atom-react";
import { getRouteApi, useLocation, useNavigate } from "@tanstack/react-router";
import { useContext, useId, useState } from "react";

import {
  app_chat_new,
  app_chat_options,
  app_chat_search,
  app_chats_pinned,
  app_chats_recent,
  app_nav_agent,
} from "#/paraglide/messages";
import { AgentChatConversationMenu } from "@/components/agent-chat/page/agent-chat-conversation-menu";
import { AppIcon } from "@/components/ui/general/app-icon";
import { useSidebar } from "@/components/ui/navigation/sidebar/sidebar-context";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/navigation/sidebar/sidebar-menu";
import {
  selectAgentChatConversation,
  startAgentChatConversation,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import {
  agentChatConversationTitle,
  sortAgentChatConversations,
  useAgentChatConversationRestore,
  useAgentChatConversations,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import type { AgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import { useSetAgentChatSearchOpen } from "@/lib/agent-chat/page/agent-chat-search-atoms";

const agentPagePath = "/app/agent";

// One chat in the menu, with a "more" button at its end: it shows
// while the row is hovered or focused, or while its menu is open.
// A button, not a <Link to="/app/agent">: the open chat lives in the chat store,
// not the URL, and TanStack Router marks every link to the current page
// aria-current="page", which lit up all the chats at once on /agent.
const AppSidebarAgentChatRow = ({
  conversation,
  current,
  onOpen,
}: {
  conversation: AgentChatConversation;
  current: boolean;
  onOpen: () => void;
}) => {
  const registry = useContext(RegistryContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <li
      className="app-sidebar-agent-chat"
      data-menu-open={menuOpen || undefined}
    >
      <button
        type="button"
        className="app-sidebar-collapsible-link"
        aria-current={current ? "page" : undefined}
        onClick={() => {
          selectAgentChatConversation(registry, conversation.id);
          onOpen();
        }}
      >
        <span>{agentChatConversationTitle(conversation)}</span>
      </button>
      <span className="app-sidebar-agent-chat-more">
        <AgentChatConversationMenu
          conversation={conversation}
          label={app_chat_options({
            title: agentChatConversationTitle(conversation),
          })}
          icon={<AppIcon icon="more" />}
          onOpenChange={setMenuOpen}
        />
      </span>
    </li>
  );
};

// The agent's chats as a sidebar menu that opens and closes like
// amichai-all's course chapters: the row's chevron turns, the chats grow
// in, and the row opens on its own on the agent page. The menu starts with
// שיחה חדשה and חיפוש בשיחות (also ⌘K), then the pinned chats and the
// recent ones, newest first. With the
// sidebar collapsed to icons the row goes straight to the agent. One row of
// a sidebar section (AppSidebarNav's children).
const appRouteApi = getRouteApi("/app/_app");

/**
 * The sidebar's chats: the agent's conversations, a new chat and the chat
 * search, loaded here since the sidebar shows on every page.
 *
 * @returns The chats section.
 */
export const AppSidebarAgentChats = () => {
  const registry = useContext(RegistryContext);
  const { user } = appRouteApi.useRouteContext();
  // The chats load here, since the sidebar lists them on every page.
  useAgentChatConversationRestore(user.id);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const setAgentChatSearchOpen = useSetAgentChatSearchOpen();
  const sidebarCollapsed = state === "collapsed" && !isMobile;
  const onAgentPage = pathname === agentPagePath;
  // undefined until the row is toggled, so the menu follows the page.
  const [expanded, setExpanded] = useState<boolean>();
  const open = !sidebarCollapsed && (expanded ?? onAgentPage);
  const panelId = useId();
  const { conversations, activeId } = useAgentChatConversations();
  const sorted = sortAgentChatConversations(conversations);

  const chatGroups = [
    {
      label: app_chats_pinned(),
      items: sorted.filter((conversation) => conversation.pinned),
    },
    {
      label: app_chats_recent(),
      items: sorted.filter((conversation) => !conversation.pinned),
    },
  ];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        data-collapsible-row
        // While its chats show, the open chat carries the highlight.
        isActive={onAgentPage && !open}
        aria-label={app_nav_agent()}
        tooltip={app_nav_agent()}
        aria-expanded={sidebarCollapsed ? undefined : open}
        aria-controls={panelId}
        onClick={() => {
          if (sidebarCollapsed) {
            void navigate({ to: agentPagePath });

            return;
          }

          setExpanded(!open);
        }}
      >
        <AppIcon icon="agent-speech-bubble" />
        <span>{app_nav_agent()}</span>
        <span className="app-sidebar-collapsible-chevron">
          <AppIcon icon="chevron-left" />
        </span>
      </SidebarMenuButton>
      <div
        id={panelId}
        className="app-sidebar-collapsible-panel"
        data-open={open || undefined}
        inert={!open}
      >
        <div className="app-sidebar-collapsible-content">
          <div className="app-sidebar-collapsible-body">
            <ol className="app-sidebar-collapsible-list">
              <li>
                <button
                  type="button"
                  className="app-sidebar-collapsible-link"
                  onClick={() => {
                    startAgentChatConversation(registry);
                    setOpenMobile(false);
                    void navigate({ to: agentPagePath });
                  }}
                >
                  <AppIcon icon="agent-plus" />
                  <span>{app_chat_new()}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="app-sidebar-collapsible-link"
                  aria-keyshortcuts="Meta+K Control+K"
                  onClick={() => {
                    setOpenMobile(false);
                    setAgentChatSearchOpen(true);
                  }}
                >
                  {/* One child, so the search grows out of this button
                      (useDialogMorph morphs only a one-element button). */}
                  <span className="app-sidebar-collapsible-link-content">
                    <AppIcon icon="agent-search" />
                    <span>{app_chat_search()}</span>
                  </span>
                </button>
              </li>
            </ol>
            {chatGroups.map(
              (group) =>
                group.items.length > 0 && (
                  <section key={group.label} aria-label={group.label}>
                    <h3 className="app-sidebar-agent-chat-heading">
                      {group.label}
                    </h3>
                    <ol className="app-sidebar-collapsible-list">
                      {group.items.map((conversation) => (
                        <AppSidebarAgentChatRow
                          key={conversation.id}
                          conversation={conversation}
                          current={onAgentPage && conversation.id === activeId}
                          onOpen={() => {
                            setOpenMobile(false);
                            void navigate({ to: agentPagePath });
                          }}
                        />
                      ))}
                    </ol>
                  </section>
                )
            )}
          </div>
        </div>
      </div>
    </SidebarMenuItem>
  );
};
