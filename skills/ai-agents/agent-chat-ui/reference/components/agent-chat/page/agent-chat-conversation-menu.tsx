import { RegistryContext } from "@effect/atom-react";
import { useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  app_cancel,
  app_chat_delete_description,
  app_chat_delete_title,
  app_chat_rename_hint,
  app_chat_rename_title,
  app_delete,
  app_download,
  app_name_label,
  app_pin,
  app_rename,
  app_save,
  app_unpin,
} from "#/paraglide/messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  ConfirmDeleteDialog,
} from "@/components/ui/feedback/dialog/alert-dialog";
import { useDialogMorph } from "@/components/ui/feedback/dialog/dialog-morph";
import { Field, FieldLabel } from "@/components/ui/forms/fields/field";
import { Input } from "@/components/ui/forms/fields/input";
import { AppIcon } from "@/components/ui/general/app-icon";
import { MorphText } from "@/components/ui/general/morph-text";
import { SmoothDropdown } from "@/components/ui/navigation/dropdown/smooth-dropdown";
import {
  deleteAgentChatConversation,
  renameAgentChatConversation,
  setAgentChatConversationPinned,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-actions";
import {
  agentChatConversationNameMaxLength,
  agentChatConversationTitle,
} from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import type { AgentChatConversation } from "@/lib/agent-chat/conversation/agent-chat-conversation-atoms";
import { agentChatConversationMarkdown } from "@/lib/agent-chat/conversation/agent-chat-conversation-markdown";

import { trimEndCharacters } from "../../../../backend/shared/text/trim-text-end";

// Saves the conversation as a markdown file named after it.
const downloadAgentChatConversation = (conversation: AgentChatConversation) => {
  const slug = trimEndCharacters(
    agentChatConversationTitle(conversation)
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+/u, ""),
    "-"
  );

  const url = URL.createObjectURL(
    new Blob([agentChatConversationMarkdown(conversation)], {
      type: "text/markdown;charset=utf-8",
    })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug || "conversation"}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// The rename dialog: the name with a count against its 120-letter limit
// (MorphText, as the app's other counts); saving needs a changed, non-empty
// name. It grows out of the menu's trigger (findSource) and shrinks back into
// it, as settings and sign-out grow out of their rows (useDialogMorph).
const AgentChatRenameDialog = ({
  conversation,
  open,
  onOpenChange,
  findSource,
}: {
  conversation: AgentChatConversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findSource: () => HTMLElement | null;
}) => {
  const registry = useContext(RegistryContext);
  const title = agentChatConversationTitle(conversation);
  const [name, setName] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const morph = useDialogMorph(open, findSource);
  const changed = name.trim().length > 0 && name.trim() !== title;

  const save = () => {
    if (changed) {
      renameAgentChatConversation(registry, conversation.id, name);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        {...morph}
        title={app_chat_rename_title()}
        initialFocus={inputRef}
      >
        <AlertDialogDescription>
          {app_chat_rename_hint()}
        </AlertDialogDescription>
        <form
          id="agent-chat-rename-form"
          // The dialog's description inset: 16px at the sides, 16px above.
          className="px-4 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Field>
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="agent-chat-rename">
                {app_name_label()}
              </FieldLabel>
              <span className="text-xs text-muted-foreground">
                <MorphText>
                  {`${name.length}/${agentChatConversationNameMaxLength}`}
                </MorphText>
              </span>
            </div>
            <Input
              ref={inputRef}
              id="agent-chat-rename"
              required
              autoComplete="off"
              maxLength={agentChatConversationNameMaxLength}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              onFocus={(event) => {
                event.target.select();
              }}
            />
          </Field>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel>{app_cancel()}</AlertDialogCancel>
          <AlertDialogAction disabled={!changed} onClick={save}>
            {app_save()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * The chat menu, opened from the chat's title or its row in the
 * sidebar as the app's other "…" menus open (SmoothDropdown): pin or unpin,
 * rename, download as markdown, and delete. Deleting a chat with messages
 * asks first, since they cannot be restored; an empty chat goes at once.
 * Sharing waits for the agent backend.
 *
 * @returns The menu.
 */
export const AgentChatConversationMenu = ({
  conversation,
  label,
  icon,
  onOpenChange,
}: {
  conversation: AgentChatConversation;
  label: string;
  icon: ReactNode;
  onOpenChange?: (open: boolean) => void;
}) => {
  const registry = useContext(RegistryContext);
  const [renaming, setRenaming] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  // Each opening starts the dialog afresh from the current name.
  const [renameKey, setRenameKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <span ref={anchorRef} className="contents">
        <SmoothDropdown
          appearance="icon"
          label={label}
          onOpenChange={onOpenChange}
          actions={[
            {
              label: conversation.pinned ? app_unpin() : app_pin(),
              icon: (
                <AppIcon
                  icon={conversation.pinned ? "agent-pin-off" : "agent-pin"}
                />
              ),
              onSelect: () => {
                setAgentChatConversationPinned(
                  registry,
                  conversation.id,
                  !conversation.pinned
                );
              },
            },
            {
              label: app_rename(),
              icon: <AppIcon icon="agent-pencil" />,
              // The menu closes at once and the dialog grows out of its
              // trigger.
              opensDialog: true,
              onSelect: () => {
                setRenameKey(renameKey + 1);
                setRenaming(true);
              },
            },
            {
              label: app_download(),
              icon: <AppIcon icon="agent-download" />,
              disabled: conversation.messages.length === 0,
              onSelect: () => {
                downloadAgentChatConversation(conversation);
              },
            },
            {
              label: app_delete(),
              icon: <AppIcon icon="agent-trash" />,
              destructive: true,
              // A chat with messages asks first, in a dialog.
              opensDialog: conversation.messages.length > 0,
              onSelect: () => {
                if (conversation.messages.length > 0) {
                  setDeleting(true);
                } else {
                  deleteAgentChatConversation(registry, conversation.id);
                }
              },
            },
          ]}
        >
          {icon}
        </SmoothDropdown>
      </span>
      <AgentChatRenameDialog
        key={renameKey}
        conversation={conversation}
        open={renaming}
        onOpenChange={setRenaming}
        findSource={() => anchorRef.current?.querySelector("button") ?? null}
      />
      <ConfirmDeleteDialog
        description={app_chat_delete_description()}
        onConfirm={() => {
          deleteAgentChatConversation(registry, conversation.id);
          setDeleting(false);
        }}
        onOpenChange={setDeleting}
        open={deleting}
        subject={agentChatConversationTitle(conversation)}
        title={app_chat_delete_title()}
      />
    </>
  );
};
