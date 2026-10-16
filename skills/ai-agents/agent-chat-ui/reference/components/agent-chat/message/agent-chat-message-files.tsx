import { m } from "motion/react";
import { useState } from "react";

import { app_chat_show_file } from "#/paraglide/messages";
import { AgentChatImageViewer } from "@/components/agent-chat/message/agent-chat-image-viewer";
import { TooltipHint } from "@/components/ui/display/tooltip";
import { AppIcon } from "@/components/ui/general/app-icon";
import type { AgentChatFile } from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

// A long file name keeps its first and last 7 letters, as the
// attachment tile shortens it; the extension shows in the type line.
const agentChatShortFileName = (name: string) => {
  const base = name.split(".")[0] ?? "";

  return base.length <= 18 ? base : `${base.slice(0, 7)}...${base.slice(-7)}`;
};

/**
 * A message's attached files: images as thumbnails that open the image viewer,
 * documents as file chips.
 *
 * @param props - files: the message's files.
 * @returns The files, and the viewer for its images.
 */
export const AgentChatMessageFiles = ({
  files,
}: {
  files: AgentChatFile[];
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [thumbnail, setThumbnail] = useState<{
    element: HTMLElement;
    index: number;
  } | null>(null);

  const images = files.filter((file) => isNonEmptyText(file.previewUrl));

  return (
    <>
      <div className="agent-chat-message-files">
        {files.map((file, index) =>
          isNonEmptyText(file.previewUrl) ? (
            <m.button
              key={file.id}
              type="button"
              className="agent-chat-message-image"
              aria-label={app_chat_show_file({ name: file.name })}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={(event) => {
                setViewerIndex(images.indexOf(file));
                setThumbnail({
                  element: event.currentTarget,
                  index: images.indexOf(file),
                });
                setViewerOpen(true);
              }}
            >
              <span className="agent-chat-message-file">
                <img
                  className="image-cover-fill"
                  src={file.previewUrl}
                  alt=""
                  width={96}
                  height={96}
                />
              </span>
            </m.button>
          ) : (
            <TooltipHint key={file.id} label={file.name}>
              <span className="agent-chat-message-file">
                <AppIcon icon="agent-file" />
                <span className="agent-chat-message-file-name">
                  <bdi>{agentChatShortFileName(file.name)}</bdi>
                  <span>{file.mimeType}</span>
                </span>
              </span>
            </TooltipHint>
          )
        )}
      </div>
      <AgentChatImageViewer
        images={images}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        thumbnail={thumbnail}
      />
    </>
  );
};
