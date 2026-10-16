import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { RegistryContext } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  app_chat_current,
  app_chat_new,
  app_chat_none_found,
  app_chat_search,
  app_chat_search_placeholder,
  app_chats_pinned,
  app_last_30_days,
  app_last_7_days,
  app_today,
  app_yesterday,
} from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { EmptyState } from "@/components/ui/display/empty";
import { useDialogMorph } from "@/components/ui/feedback/dialog/dialog-morph";
import { SearchClearButton } from "@/components/ui/forms/filters/search-input";
import { AppIcon } from "@/components/ui/general/app-icon";
import {
  selectAgentChatConversation,
  startAgentChatConversation,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import {
  agentChatConversationTitle,
  sortAgentChatConversations,
  useAgentChatConversations,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import type { AgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import {
  useAgentChatSearchOpen,
  useSetAgentChatSearchOpen,
} from "@/lib/agent-chat/page/agent-chat-search-atoms";
import { formatTimeAgo } from "@/lib/dates/relative-time";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

const agentChatMonthFormatOptions = {
  month: "long",
} as const;

const agentChatMonthFormatByLocale = {
  he: new Intl.DateTimeFormat("he-IL", agentChatMonthFormatOptions),
  en: new Intl.DateTimeFormat("en-US", agentChatMonthFormatOptions),
};

const agentChatMonthFormat = () => agentChatMonthFormatByLocale[getLocale()];

// Date groups: today, yesterday, the last 7 and 30 days, then one
// group per month, newest first.
const agentChatDateGroups = (conversations: AgentChatConversation[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = (days: number) => today.getTime() - days * 86_400_000;

  const ranges = [
    { label: app_today(), start: daysAgo(0) },
    { label: app_yesterday(), start: daysAgo(1) },
    { label: app_last_7_days(), start: daysAgo(7) },
    { label: app_last_30_days(), start: daysAgo(30) },
  ];

  const groups = new Map<string, AgentChatConversation[]>();

  for (const conversation of conversations) {
    const time = new Date(conversation.createdAt).getTime();

    const label =
      ranges.find((range) => time >= range.start)?.label ??
      agentChatMonthFormat().format(time);

    groups.set(label, [...(groups.get(label) ?? []), conversation]);
  }

  return [...groups].map(([label, items]) => ({ label, items }));
};

const agentChatConversationMatches = (
  conversation: AgentChatConversation,
  query: string
) =>
  [
    agentChatConversationTitle(conversation),
    ...conversation.messages.flatMap((message) =>
      message.parts.flatMap((part) => (part.type === "text" ? [part.text] : []))
    ),
  ].some((text) => text.toLowerCase().includes(query));

/**
 * The chat search (⌘K or Ctrl+K, or סוכן › חיפוש בשיחות): a search
 * box over the chats, on Base UI's inline Autocomplete. Empty, it offers a
 * new chat, then the pinned chats and the rest by date; typing lists the
 * chats whose name or messages match. The first row is highlighted, the
 * arrow keys move the highlight, and Enter opens it.
 *
 * @returns The search dialog.
 */
export const AgentChatSearchDialog = () => {
  const registry = useContext(RegistryContext);
  const open = useAgentChatSearchOpen();
  const setAgentChatSearchOpen = useSetAgentChatSearchOpen();
  const navigate = useNavigate();
  const { conversations, activeId } = useAgentChatConversations();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Grows out of the sidebar's חיפוש בשיחות as the create-task dialog grows
  // out of its "+"; opened with ⌘K, with no button pressed, it just fades.
  const morph = useDialogMorph(open);

  // Each opening starts from an empty search.
  const setOpen = (next: boolean) => {
    setQuery("");
    setAgentChatSearchOpen(next);
  };

  const setOpenRef = useRef(setOpen);
  useLayoutEffect(() => {
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandK =
        event.code === "KeyK" && (event.metaKey || event.ctrlKey);

      if (commandK && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        setOpenRef.current(!open);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const search = query.trim().toLowerCase();
  const sorted = sortAgentChatConversations(conversations);

  const groups = search
    ? [
        {
          label: null,
          items: sorted.filter((conversation) =>
            agentChatConversationMatches(conversation, search)
          ),
        },
      ]
    : [
        {
          label: app_chats_pinned(),
          items: sorted.filter((conversation) => conversation.pinned),
        },
        ...agentChatDateGroups(
          sorted.filter((conversation) => !conversation.pinned)
        ),
      ];

  const openChat = (conversationId: string | null) => {
    if (isNonEmptyText(conversationId)) {
      selectAgentChatConversation(registry, conversationId);
    } else {
      startAgentChatConversation(registry);
    }

    setOpen(false);
    void navigate({ to: "/app/agent" });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="app-backdrop" />
        <Dialog.Popup {...morph} className="agent-chat-search">
          {/* One wrapper, so the morph can counter-scale the content. */}
          <div className="agent-chat-search-body">
            <Dialog.Title className="sr-only">{app_chat_search()}</Dialog.Title>
            <Autocomplete.Root
              inline
              open
              mode="none"
              autoHighlight="always"
              value={query}
              onValueChange={setQuery}
            >
              <div className="agent-chat-search-field">
                <AppIcon icon="agent-search" />
                <Autocomplete.Input
                  ref={searchInputRef}
                  aria-label={app_chat_search()}
                  placeholder={app_chat_search_placeholder()}
                />
                <SearchClearButton
                  show={query.length > 0}
                  onClear={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                />
              </div>
              <Autocomplete.List className="agent-chat-search-list">
                {!search && (
                  <div className="agent-chat-search-group">
                    <Autocomplete.Item
                      value="new"
                      className="agent-chat-search-option"
                      onClick={() => {
                        openChat(null);
                      }}
                    >
                      <AppIcon icon="agent-plus" />
                      <span>{app_chat_new()}</span>
                    </Autocomplete.Item>
                  </div>
                )}
                {groups.map(
                  (group) =>
                    group.items.length > 0 && (
                      <Autocomplete.Group
                        key={group.label ?? "results"}
                        className="agent-chat-search-group"
                      >
                        {isNonEmptyText(group.label) && (
                          <Autocomplete.GroupLabel className="agent-chat-search-heading">
                            {group.label}
                          </Autocomplete.GroupLabel>
                        )}
                        {group.items.map((conversation) => (
                          <Autocomplete.Item
                            key={conversation.id}
                            value={conversation.id}
                            className="agent-chat-search-option"
                            onClick={() => {
                              openChat(conversation.id);
                            }}
                          >
                            <AppIcon icon="agent-bubble-chat" />
                            <bdi className="agent-chat-search-option-title">
                              {agentChatConversationTitle(conversation)}
                            </bdi>
                            {conversation.id === activeId && (
                              <span
                                className="app-tag agent-chat-badge"
                                data-variant="outline"
                              >
                                {app_chat_current()}
                              </span>
                            )}
                            <span className="agent-chat-search-option-time">
                              {formatTimeAgo(conversation.createdAt)}
                            </span>
                          </Autocomplete.Item>
                        ))}
                      </Autocomplete.Group>
                    )
                )}
                {search && groups[0]?.items.length === 0 && (
                  <EmptyState
                    icon="agent-search"
                    title={app_chat_none_found()}
                  />
                )}
              </Autocomplete.List>
            </Autocomplete.Root>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
