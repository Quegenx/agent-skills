import { PreviewCard } from "@base-ui/react/preview-card";
import { useEffect, useRef } from "react";

import { app_chat_remove_file } from "#/paraglide/messages";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import type { AgentChatAttachment } from "@/lib/agent-chat/attachments/agent-chat-attachments";

// An attached image, shown from the upload itself. Each mounted image holds
// its own object URL and revokes it when it unmounts or the upload changes.
const AgentChatUploadPreview = ({
  upload,
  width,
  height,
}: {
  upload: File;
  width: number;
  height: number;
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(upload);

    if (imageRef.current) {
      imageRef.current.src = objectUrl;
    }

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [upload]);

  return <img ref={imageRef} alt={upload.name} width={width} height={height} />;
};

/**
 * The inline attachment (AI Elements Attachment, variant "inline"):
 * a 32px chip with a 20px thumbnail or file icon and the name. On hover the
 * thumbnail fades out and a remove button fades in on the same spot, and a
 * card opens below with the image and the file type.
 *
 * @returns The chip, with its preview on hover.
 */
export const AgentChatAttachmentChip = ({
  file,
  onRemove,
}: {
  file: AgentChatAttachment;
  onRemove: () => void;
}) => {
  const image = file.mimeType.startsWith("image/");

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={0}
        closeDelay={0}
        render={<div className="agent-chat-attachment-chip" />}
      >
        <span className="agent-chat-attachment-chip-media">
          <span className="agent-chat-attachment-chip-preview">
            {image ? (
              <AgentChatUploadPreview
                upload={file.upload}
                width={20}
                height={20}
              />
            ) : (
              <AppIcon icon="agent-file" />
            )}
          </span>
          <TooltipHint label={app_chat_remove_file({ name: file.name })}>
            <button
              type="button"
              className="agent-chat-attachment-chip-remove"
              aria-label={app_chat_remove_file({ name: file.name })}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <AppIcon icon="agent-remove" />
            </button>
          </TooltipHint>
        </span>
        <span className="agent-chat-attachment-chip-name">
          <bdi>{file.name}</bdi>
        </span>
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          alignOffset={4}
          className="agent-chat-hover-card-positioner"
        >
          <PreviewCard.Popup className="agent-chat-hover-card">
            {image && (
              <span className="agent-chat-hover-card-image">
                <AgentChatUploadPreview
                  upload={file.upload}
                  width={320}
                  height={384}
                />
              </span>
            )}
            <span className="agent-chat-hover-card-text">
              <strong>
                <bdi>{file.name}</bdi>
              </strong>
              {file.mimeType && <code>{file.mimeType}</code>}
            </span>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
};
