import { useState } from "react";
import type { RefObject } from "react";

import {
  app_chat_file_too_big,
  app_chat_max_files,
  app_chat_unsupported_file,
} from "#/paraglide/messages";
import { agentChatFileMediaType } from "@/lib/agent-chat/attachments/agent-chat-file-types";
import {
  agentChatMaxFileBytes,
  agentChatMaxFiles,
} from "@/lib/agent-chat/conversation/agent-chat-messages";

import { isNonEmptyText } from "../../../../backend/shared/text/non-empty-text";

/**
 * A file attached in the composer, with the upload itself for sending. Its
 * chip previews an image from the upload (see AgentChatUploadPreview).
 */
export interface AgentChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  upload: File;
}

// The upload carries the type the agent reads it as, which for documents
// comes from the extension (agentChatFileMediaType).
const agentChatAttachmentFromUpload = (
  file: File,
  mimeType: string
): AgentChatAttachment => ({
  id: crypto.randomUUID(),
  name: file.name,
  mimeType,
  upload:
    file.type === mimeType
      ? file
      : new File([file], file.name, { type: mimeType }),
});

/**
 * The composer's attachments: adding files (checked for type, size and count),
 * removing one, and clearing them; nothing is added while a message is being
 * prepared.
 *
 * @param preparing - Whether a message is being prepared to send.
 * @returns The files, the error to show, and setFileError, addFiles, removeFile
 *   and clearFiles.
 */
export const useAgentChatAttachments = (preparing: RefObject<boolean>) => {
  const [files, setFiles] = useState<AgentChatAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Copies the files out at once: the input's FileList empties when the
  // input is reset, before a deferred state update would read it.
  const addFiles = (uploads: FileList | null) => {
    if (preparing.current) {
      return;
    }

    const picked = [...(uploads ?? [])];

    if (picked.length === 0) {
      return;
    }

    if (files.length + picked.length > agentChatMaxFiles) {
      setFileError(app_chat_max_files({ count: agentChatMaxFiles }));

      return;
    }

    const readable = picked.flatMap((file) => {
      const mimeType = agentChatFileMediaType(file);

      return isNonEmptyText(mimeType) ? [{ file, mimeType }] : [];
    });

    const fitting = readable.filter(
      ({ file }) => file.size <= agentChatMaxFileBytes
    );

    if (readable.length < picked.length) {
      setFileError(app_chat_unsupported_file());
    } else {
      setFileError(
        fitting.length < picked.length ? app_chat_file_too_big() : null
      );
    }

    const added = fitting.map(({ file, mimeType }) =>
      agentChatAttachmentFromUpload(file, mimeType)
    );

    setFiles((current) => [...current, ...added]);
  };

  const removeFile = (file: AgentChatAttachment) => {
    if (preparing.current) {
      return;
    }

    setFiles((current) => current.filter((item) => item.id !== file.id));
  };

  const clearFiles = () => {
    setFiles([]);
    setFileError(null);
  };

  return { files, fileError, setFileError, addFiles, removeFile, clearFiles };
};
