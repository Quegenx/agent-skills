import { RegistryContext } from "@effect/atom-react";
import { Effect } from "effect";
import { useContext, useEffect, useRef, useState } from "react";
import type { ComponentProps, RefObject } from "react";

import {
  app_chat_add_files,
  app_chat_cancel_recording,
  app_chat_dictate,
  app_chat_drop_hint,
  app_chat_drop_title,
  app_chat_files_unreadable,
  app_chat_message_label,
  app_chat_queue_full,
  app_chat_queue_message,
  app_chat_queued_hint,
  app_chat_queued_remove,
  app_chat_stop_answer,
  app_send,
} from "#/paraglide/messages";
import { AgentChatAttachmentChip } from "@/components/agent-chat/composer/agent-chat-attachment-chip";
import { useAgentChatFileDrop } from "@/components/agent-chat/composer/agent-chat-file-drop";
import { AgentChatRecordingStrip } from "@/components/agent-chat/composer/agent-chat-recording-strip";
import { AgentChatPlaceholder } from "@/components/agent-chat/page/agent-chat-placeholder";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import { useAgentChatAttachments } from "@/lib/agent-chat/attachments/agent-chat-attachments";
import type { AgentChatAttachment } from "@/lib/agent-chat/attachments/agent-chat-attachments";
import { agentChatAcceptedFiles } from "@/lib/agent-chat/attachments/agent-chat-file-types";
import { agentChatMessageMaxLength } from "@/lib/agent-chat/conversation/agent-chat-messages";
import type { QueuedAgentChatMessage } from "@/lib/agent-chat/conversation/agent-chat-queue";
import { useAgentChatDictation } from "@/lib/agent-chat/dictation/agent-chat-dictation";
import { runClientEffect } from "@/lib/atoms/app-atom-runtime";
import { typedTextDirection } from "@/lib/i18n/typed-text-direction";

// The composer (AI Elements PromptInput): a rounded card with the
// attached files as chips, the text box with the example prompts cycling
// over it while empty, and a footer with attach and dictate at the start and
// send at the end. The text box takes focus when the composer opens. Enter
// sends, Shift+Enter starts a new line, Backspace in the empty box removes
// the last file, and pasting or dropping files attaches them. Dictating
// swaps the text for a timer and waveform until it is stopped (Soniox's
// transcript goes into the text) or thrown away.
// Each icon button names itself in a tooltip above it (AgentChatComposerAction).
// The page owns the draft, so a suggestion can fill it and focus textRef.
// While the agent answers, stop sits beside send, and what the user sends
// waits above the text as a queued message until the answer ends
// (agent-chat-queue.ts); each can be removed before it goes.
// The chat's icon button, owned here so a tooltip can render it as its
// trigger (as the answer's AgentChatIconButton).
const AgentChatComposerButton = ({
  variant,
  ...props
}: ComponentProps<"button"> & { variant: "primary" | "outline" | "ghost" }) => (
  <button
    type="button"
    className="agent-chat-button"
    data-variant={variant}
    data-size="icon"
    {...props}
  />
);

// A composer icon button with its name in the design system's tooltip, as
// the answer's copy button: the name a pointer sees on hover is the one
// assistive technology reads (aria-label).
const AgentChatComposerAction = ({
  label,
  children,
  ...props
}: ComponentProps<typeof AgentChatComposerButton> & { label: string }) => (
  <Tooltip>
    <TooltipTrigger
      render={<AgentChatComposerButton aria-label={label} {...props} />}
    >
      {children}
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

// The messages waiting for the answer to end, each with its remove button,
// and one line saying when they go and that closing the page drops them.
const AgentChatQueuedMessages = ({
  queued,
  onRemove,
}: {
  queued: readonly QueuedAgentChatMessage[];
  onRemove: (id: string) => void;
}) => (
  <div className="agent-chat-prompt-queued">
    <ul>
      {queued.map((message) => {
        const preview =
          message.text || message.files.map((file) => file.name).join(", ");

        return (
          <li key={message.id} className="agent-chat-prompt-queued-message">
            <AppIcon icon="agent-clock" />
            <span dir="auto">{preview}</span>
            <AgentChatComposerAction
              label={app_chat_queued_remove({ message: preview.slice(0, 60) })}
              variant="ghost"
              onClick={() => {
                onRemove(message.id);
              }}
            >
              <AppIcon icon="agent-remove" />
            </AgentChatComposerAction>
          </li>
        );
      })}
    </ul>
    <p>{app_chat_queued_hint()}</p>
  </div>
);

// The composer's footer: attach and dictate at the start (or throw the
// recording away while dictating), and stop and send at the end.
const AgentChatComposerFooter = ({
  dictation,
  preparing,
  answering,
  canSend,
  onAttach,
  onStop,
}: {
  dictation: ReturnType<typeof useAgentChatDictation>;
  preparing: boolean;
  answering: boolean;
  canSend: boolean;
  onAttach: () => void;
  onStop: () => void;
}) => (
  <div className="agent-chat-prompt-footer">
    <div className="agent-chat-prompt-tools">
      {dictation.listening ? (
        <AgentChatComposerAction
          label={app_chat_cancel_recording()}
          variant="ghost"
          onClick={() => {
            dictation.cancel();
          }}
        >
          <AppIcon icon="agent-trash" />
        </AgentChatComposerAction>
      ) : (
        <>
          <AgentChatComposerAction
            label={app_chat_add_files()}
            variant="outline"
            disabled={preparing}
            onClick={onAttach}
          >
            <AppIcon icon="agent-attach" />
          </AgentChatComposerAction>
          <AgentChatComposerAction
            label={app_chat_dictate()}
            variant="ghost"
            disabled={preparing}
            onClick={() => {
              dictation.start();
            }}
          >
            <AppIcon icon="agent-microphone" />
          </AgentChatComposerAction>
        </>
      )}
    </div>
    <div className="agent-chat-prompt-tools">
      {answering && (
        <AgentChatComposerAction
          label={app_chat_stop_answer()}
          variant={canSend ? "outline" : "primary"}
          onClick={onStop}
        >
          <AppIcon icon="agent-stop" />
        </AgentChatComposerAction>
      )}
      {(!answering || canSend) && (
        <AgentChatComposerAction
          type="submit"
          label={answering ? app_chat_queue_message() : app_send()}
          variant="primary"
          disabled={!canSend || preparing}
          // Keep focus in the text so typing can go on.
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          <AppIcon icon="agent-send" />
        </AgentChatComposerAction>
      )}
    </div>
  </div>
);

/**
 * The chat's message composer: the text box, attachments, dictation, the queue
 * of messages sent while the agent answers, and the send and stop buttons.
 *
 * @param props - The draft and its setter, the answering state, the send, queue
 *   and stop handlers, and the user and account kind.
 * @returns The composer form.
 */
export const AgentChatComposer = ({
  draft,
  onDraftChange,
  textRef,
  answering,
  onSend,
  onQueue,
  queued,
  onRemoveQueued,
  onStop,
  business,
  userId,
}: {
  userId: string;
  // A business's example requests in the placeholder, or a person's.
  business: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  textRef: RefObject<HTMLTextAreaElement | null>;
  answering: boolean;
  onSend: (text: string, files: AgentChatAttachment[]) => Promise<void>;
  // While answering: queues the message, or false when the queued messages
  // together would pass one message's limits.
  onQueue: (text: string, files: AgentChatAttachment[]) => boolean;
  queued: readonly QueuedAgentChatMessage[];
  onRemoveQueued: (id: string) => void;
  onStop: () => void;
}) => {
  const registry = useContext(RegistryContext);
  const [preparing, setPreparing] = useState(false);
  const preparingRef = useRef(false);

  const { files, fileError, setFileError, addFiles, removeFile, clearFiles } =
    useAgentChatAttachments(preparingRef);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dictation = useAgentChatDictation(userId);
  const text = draft.trim();
  const canSend = text.length > 0 || files.length > 0 || dictation.listening;

  useEffect(() => {
    textRef.current?.focus();
  }, [textRef]);
  const dragging = useAgentChatFileDrop(formRef, addFiles);

  const appendToDraft = (heard: string) => {
    if (heard) {
      onDraftChange(
        draft.length > 0 && !draft.endsWith(" ")
          ? `${draft} ${heard}`
          : `${draft}${heard}`
      );
    }
  };

  const send = () => {
    if (!canSend || preparingRef.current) {
      return;
    }

    const { listening } = dictation;
    preparingRef.current = true;
    setPreparing(true);
    void runClientEffect(
      registry,
      // Sending while dictating sends what Soniox heard as well.
      (listening ? dictation.stop() : Effect.succeed("")).pipe(
        Effect.flatMap((heard) => {
          const message = [text, heard].filter(Boolean).join(" ");

          return (
            answering
              ? Effect.suspend(() =>
                  onQueue(message, files)
                    ? Effect.void
                    : Effect.fail(app_chat_queue_full())
                )
              : Effect.tryPromise({
                  try: async () => {
                    await onSend(message, files);
                  },
                  catch: () => app_chat_files_unreadable(),
                })
          ).pipe(
            Effect.match({
              onSuccess: () => {
                onDraftChange("");
                clearFiles();
              },
              onFailure: (failure) => {
                if (heard) {
                  appendToDraft(heard);
                }

                setFileError(failure);
              },
            })
          );
        }),
        Effect.ensuring(
          Effect.sync(() => {
            preparingRef.current = false;
            setPreparing(false);
          })
        )
      )
    );
  };

  return (
    <form
      ref={formRef}
      className="agent-chat-prompt"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={agentChatAcceptedFiles}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="agent-chat-prompt-group">
        {queued.length > 0 && (
          <AgentChatQueuedMessages queued={queued} onRemove={onRemoveQueued} />
        )}
        {files.length > 0 && (
          <div className="agent-chat-prompt-attachments">
            {files.map((file) => (
              <AgentChatAttachmentChip
                key={file.id}
                file={file}
                onRemove={() => {
                  removeFile(file);
                }}
              />
            ))}
          </div>
        )}
        <div className="agent-chat-prompt-text">
          {dictation.listening ? (
            <div className="agent-chat-prompt-recording">
              <AgentChatRecordingStrip
                stream={dictation.stream}
                finishing={dictation.phase === "finishing"}
                onStop={() => {
                  void runClientEffect(
                    registry,
                    dictation.stop().pipe(Effect.map(appendToDraft))
                  );
                }}
              />
            </div>
          ) : (
            <>
              <textarea
                ref={textRef}
                name="message"
                className="agent-chat-prompt-textarea"
                aria-label={app_chat_message_label()}
                dir={typedTextDirection(draft)}
                rows={1}
                maxLength={agentChatMessageMaxLength}
                enterKeyHint="send"
                spellCheck={false}
                value={draft}
                disabled={preparing}
                onChange={(event) => {
                  onDraftChange(event.target.value);
                }}
                onPaste={(event) => {
                  if (event.clipboardData.files.length > 0) {
                    event.preventDefault();
                    addFiles(event.clipboardData.files);
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    send();

                    return;
                  }

                  const last = files.at(-1);

                  if (event.key === "Backspace" && draft === "" && last) {
                    event.preventDefault();
                    removeFile(last);
                  }
                }}
              />
              <AgentChatPlaceholder
                hidden={draft.length > 0}
                business={business}
              />
            </>
          )}
        </div>
        <AgentChatComposerFooter
          dictation={dictation}
          preparing={preparing}
          answering={answering}
          canSend={canSend}
          onAttach={() => fileInputRef.current?.click()}
          onStop={onStop}
        />
      </div>
      {dragging && (
        <div className="agent-chat-prompt-dropzone">
          <AppIcon icon="agent-attach" />
          <strong>{app_chat_drop_title()}</strong>
          <span>{app_chat_drop_hint()}</span>
        </div>
      )}
      {(fileError ?? dictation.error ?? "") !== "" && (
        <p className="agent-chat-prompt-error" role="alert">
          {fileError ?? dictation.error}
        </p>
      )}
    </form>
  );
};
